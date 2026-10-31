/**
 * Pure helpers for the lesson-source card: SSE frame parsing, upload pre-checks and plain
 * Vietnamese wording for extraction failures reported by backend/src/services/clipExtractor.js.
 */

export type ExtractionStageId = 'split_audio' | 'keyframes' | 'board_ocr' | 'fuse';
// 'stopped': cancelled because another stage failed; the server sends no event for it.
export type ExtractionStageStatus = 'pending' | 'running' | 'done' | 'error' | 'stopped';

export interface ExtractionStage {
  id: ExtractionStageId | string;
  label: string;
}

export interface ExtractionStageEvent {
  stage: string;
  status: 'running' | 'done' | 'error';
  detail?: string;
}

export interface SseFrame {
  event: string;
  data: string;
}

/** Incremental `text/event-stream` parser: feed decoded text, get every complete frame back. */
export class SseParser {
  private buffer = '';

  push(text: string): SseFrame[] {
    this.buffer += text.replace(/\r\n?/g, '\n');
    const frames: SseFrame[] = [];
    let end = this.buffer.indexOf('\n\n');
    while (end !== -1) {
      const block = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 2);
      let event = 'message';
      const data: string[] = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      if (data.length) frames.push({ event, data: data.join('\n') });
      end = this.buffer.indexOf('\n\n');
    }
    return frames;
  }
}

export const UPLOAD_EXTENSIONS = ['.mp4', '.webm', '.mov'] as const;
export const DEFAULT_MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0).replace('.', ',')} MB`;
}

/** Same limits the server enforces, checked before any byte is sent. Returns an error or null. */
export function checkUploadFile(
  file: { name: string; size: number },
  maxBytes: number = DEFAULT_MAX_UPLOAD_BYTES,
): string | null {
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!(UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
    return `"${file.name}" không phải video MP4, WebM hoặc MOV.`;
  }
  if (file.size === 0) return `"${file.name}" là tệp rỗng.`;
  if (file.size > maxBytes) {
    return `"${file.name}" nặng ${formatBytes(file.size)}, vượt giới hạn ${formatBytes(maxBytes)}.`;
  }
  return null;
}

/**
 * A failed stage's raw detail (Node/OpenAI error text) rewritten as what the teacher can act on.
 * The raw text is still shown next to it, so nothing is hidden.
 */
export function explainExtractionError(detail: string | undefined, stageLabel?: string): string {
  const text = detail ?? '';
  if (/spawn \S*ff(mpeg|probe)\S* ENOENT|ff(mpeg|probe)\S* is not recognized/i.test(text)) {
    return 'Máy chủ chưa cài ffmpeg (hoặc FFMPEG_PATH trỏ sai), nên chưa tách được audio và khung hình.';
  }
  if (/OPENAI_API_KEY/i.test(text)) {
    return 'Máy chủ chưa có khoá OpenAI, nên chưa chép lời và đọc bảng được.';
  }
  if (/\b401\b|invalid api key|incorrect api key/i.test(text)) {
    return 'Khoá OpenAI trên máy chủ không hợp lệ.';
  }
  if (/\b429\b|quota|rate limit/i.test(text)) {
    return 'Tài khoản OpenAI đang hết hạn mức hoặc bị giới hạn tốc độ. Thử lại sau ít phút.';
  }
  if (/timed? ?out|ETIMEDOUT|aborted/i.test(text)) {
    return 'Dịch vụ AI phản hồi quá lâu nên bước này bị dừng. Thử phân tích lại.';
  }
  if (/Invalid data found|moov atom|could not find codec|Error opening input/i.test(text)) {
    return 'ffmpeg không đọc được video này: tệp có thể bị hỏng hoặc dùng định dạng lạ.';
  }
  if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|fetch failed|Connection error/i.test(text)) {
    return 'Máy chủ không kết nối được tới dịch vụ OpenAI.';
  }
  return stageLabel ? `Bước "${stageLabel}" gặp lỗi.` : 'Phân tích video gặp lỗi.';
}
