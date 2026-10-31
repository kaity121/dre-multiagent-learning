/**
 * Client for the lecture-clip routes in backend/src/routes/extract.js:
 * list clips, upload a video (raw body, XHR so upload progress is observable),
 * and run extraction over the SSE stream (fetch, so HTTP errors keep their JSON body).
 */
import { API_BASE_URL } from './dreBackendApi';
import {
  SseParser,
  type ExtractionStage,
  type ExtractionStageEvent,
} from './clipExtractionText';
import type { CognitiveEventStream } from '../types/pipeline';

export interface ClipItem {
  name: string;
  title: string;
  sizeBytes: number | null;
  uploadedAt: string | null;
}

export interface ClipCatalog {
  items: ClipItem[];
  stages: ExtractionStage[];
  maxUploadBytes: number | null;
}

/** Network failure (server down / CORS), as opposed to an error the server answered with. */
export class ClipApiError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
    this.name = 'ClipApiError';
  }
}

const EXTRACT_BASE = `${API_BASE_URL}/api/extract`;
const unreachable = () =>
  new ClipApiError(`Không kết nối được máy chủ phân tích (${API_BASE_URL}). Kiểm tra backend đang chạy.`, null);

async function errorFromResponse(res: Response): Promise<ClipApiError> {
  let message = `Máy chủ trả lỗi ${res.status}.`;
  try {
    const body = await res.json();
    if (body && typeof body.error === 'string') message = body.error;
  } catch {
    // non-JSON error body: keep the status message
  }
  return new ClipApiError(message, res.status);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toClipItem(raw: unknown): ClipItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name);
  if (!name) return null;
  return {
    name,
    title: asString(r.title) ?? name,
    sizeBytes: typeof r.sizeBytes === 'number' ? r.sizeBytes : null,
    uploadedAt: asString(r.uploadedAt),
  };
}

export async function fetchClipCatalog(signal?: AbortSignal): Promise<ClipCatalog> {
  let res: Response;
  try {
    res = await fetch(`${EXTRACT_BASE}/clips`, { signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw unreachable();
  }
  if (!res.ok) throw await errorFromResponse(res);
  const body = (await res.json()) as Record<string, unknown>;
  // Older servers only send `clips` (names); fall back to them.
  const rawItems = Array.isArray(body.items)
    ? body.items
    : Array.isArray(body.clips)
      ? body.clips.map((name) => ({ name }))
      : [];
  return {
    items: rawItems.map(toClipItem).filter((i): i is ClipItem => i !== null),
    stages: Array.isArray(body.stages)
      ? (body.stages as unknown[]).filter(
          (s): s is ExtractionStage =>
            Boolean(s) && typeof (s as ExtractionStage).id === 'string' && typeof (s as ExtractionStage).label === 'string',
        )
      : [],
    maxUploadBytes: typeof body.maxUploadBytes === 'number' ? body.maxUploadBytes : null,
  };
}

export interface UploadHandle {
  promise: Promise<ClipItem>;
  abort: () => void;
}

/** Streams the file as the request body; `onProgress` receives 0..1. */
export function uploadClip(file: File, onProgress: (fraction: number) => void): UploadHandle {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<ClipItem>((resolve, reject) => {
    xhr.open('POST', `${EXTRACT_BASE}/upload?name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      const body = xhr.response as Record<string, unknown> | null;
      if (xhr.status === 201 && body?.ok) {
        const item = toClipItem(body.item) ?? toClipItem({ name: body.clip, title: body.title, sizeBytes: body.sizeBytes });
        if (item) {
          resolve(item);
          return;
        }
      }
      const message = body && typeof body.error === 'string' ? body.error : `Máy chủ trả lỗi ${xhr.status}.`;
      reject(new ClipApiError(message, xhr.status));
    };
    // A reset connection is also what the server does when a body overruns the size cap mid-stream.
    xhr.onerror = () => reject(new ClipApiError(`Tải lên bị ngắt. Kiểm tra backend (${API_BASE_URL}) và dung lượng tệp.`, null));
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    xhr.send(file);
  });
  return { promise, abort: () => xhr.abort() };
}

export interface ExtractionHandlers {
  onStages?: (stages: ExtractionStage[]) => void;
  onStage: (event: ExtractionStageEvent) => void;
}

/**
 * Runs extraction through `GET /clip/:name/stream`. Resolves with the CognitiveEventStream the
 * server produced (a fallback stream carries `processedBy.mode === 'authored'` and a reason).
 */
export async function streamClipExtraction(
  clip: string,
  handlers: ExtractionHandlers,
  options: { refresh?: boolean; signal?: AbortSignal } = {},
): Promise<CognitiveEventStream> {
  const url = `${EXTRACT_BASE}/clip/${encodeURIComponent(clip)}/stream${options.refresh ? '?refresh=1' : ''}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: options.signal, headers: { Accept: 'text/event-stream' } });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw unreachable();
  }
  if (!res.ok) throw await errorFromResponse(res);
  if (!res.body) throw new ClipApiError('Trình duyệt không đọc được luồng tiến độ.', null);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      const frames = parser.push(done ? decoder.decode() : decoder.decode(value, { stream: true }));
      for (const frame of frames) {
        let data: unknown;
        try {
          data = JSON.parse(frame.data);
        } catch {
          continue;
        }
        if (frame.event === 'stages' && Array.isArray(data)) handlers.onStages?.(data as ExtractionStage[]);
        else if (frame.event === 'stage' && data && typeof data === 'object') handlers.onStage(data as ExtractionStageEvent);
        else if (frame.event === 'error') {
          const message = (data as { error?: unknown })?.error;
          throw new ClipApiError(typeof message === 'string' ? message : 'Phân tích video gặp lỗi.', 500);
        } else if (frame.event === 'done') {
          const stream = (data as { stream?: CognitiveEventStream })?.stream;
          if (!stream) throw new ClipApiError('Máy chủ kết thúc mà không trả kết quả phân tích.', 500);
          return stream;
        }
      }
      if (done) break;
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError' || err instanceof ClipApiError) throw err;
    throw new ClipApiError('Mất kết nối với máy chủ trong lúc phân tích.', null);
  } finally {
    reader.releaseLock();
  }
  throw new ClipApiError('Luồng phân tích đóng trước khi có kết quả.', null);
}
