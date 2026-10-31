import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, FileVideo, Upload, X } from 'lucide-react';
import type { PhaseStatus } from '../../types/reasoning';
import type { CognitiveEventStream } from '../../types/pipeline';
import {
  ClipApiError,
  fetchClipCatalog,
  streamClipExtraction,
  uploadClip,
  type ClipItem,
} from '../../services/clipSourceApi';
import {
  checkUploadFile,
  DEFAULT_MAX_UPLOAD_BYTES,
  explainExtractionError,
  formatBytes,
  type ExtractionStage,
  type ExtractionStageStatus,
} from '../../services/clipExtractionText';
import { sound } from '../../utils/soundEffects';

/** The pre-indexed lesson the roundtable reads from (backend/content + mock/mock_cognitive_stream_vecto12.json). */
const INDEXED_LESSON = {
  video: 'Bài 1.1 Vectơ trong không gian · Thầy Nguyễn Phan Tiến',
  textbook: 'SGK Toán 12 Kết nối tri thức, Tập 1 · Bài 6, tr.45–59',
  knowledge: '24 kiến thức · 20 ngộ nhận · 20 bài tập',
};
const DEFAULT_CLIP = 'tien-vecto12-ex3-60s.mp4';

/** Shown until the server sends its own stage list (same ids and labels as clipExtractor STAGES). */
const FALLBACK_STAGES: ExtractionStage[] = [
  { id: 'split_audio', label: 'Tách audio & chép lời (Whisper)' },
  { id: 'keyframes', label: 'Chọn keyframe bảng phấn / slide' },
  { id: 'board_ocr', label: 'Đọc nội dung bảng / slide (Vision)' },
  { id: 'fuse', label: 'Hợp nhất timeline' },
];

interface LessonSourceCardProps {
  /** Drives the "Trích xuất" phase of the War Room stepper; `detail` names the running stage. */
  onExtractPhase?: (status: PhaseStatus, detail?: string) => void;
  /** The analysed video the council is reading, or null for the indexed lesson. */
  councilClip?: string | null;
  /** Hands an analysed video to the council (null returns to the indexed lesson). */
  onRunCouncil?: (clip: string | null) => void;
}

type Catalog =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; items: ClipItem[]; maxUploadBytes: number };

type UploadState =
  | { state: 'idle' }
  | { state: 'uploading'; fileName: string; fraction: number }
  | { state: 'error'; message: string }
  | { state: 'done'; title: string };

interface StageRow {
  status: ExtractionStageStatus;
  detail?: string;
}

type Extraction =
  | { state: 'idle' }
  | { state: 'running'; clip: string }
  | { state: 'done'; clip: string; stream: CognitiveEventStream; cached: boolean }
  | { state: 'error'; clip: string; message: string; detail?: string };

const isAbort = (err: unknown) => (err as Error)?.name === 'AbortError';

const StageIcon: React.FC<{ status: ExtractionStageStatus }> = ({ status }) => {
  if (status === 'done') {
    return (
      <span className="w-5 h-5 rounded-full bg-[#1F5E3A] text-white flex items-center justify-center shrink-0">
        <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="w-5 h-5 rounded-full bg-[#121712] text-white flex items-center justify-center shrink-0">
        <X className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  if (status === 'running') {
    return (
      <span className="w-5 h-5 rounded-full bg-[#C8F169] flex items-center justify-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#121712] motion-safe:animate-pulse" aria-hidden="true" />
      </span>
    );
  }
  return <span className="w-5 h-5 rounded-full border-2 border-[#C9D4B6] bg-white shrink-0" aria-hidden="true" />;
};

const STAGE_STATUS_TEXT: Record<ExtractionStageStatus, string> = {
  pending: 'Chờ',
  running: 'Đang chạy',
  done: 'Xong',
  error: 'Lỗi',
  stopped: 'Đã dừng',
};

/** Stages still marked running when the run ended were cancelled by another stage's failure. */
const stopRunning = (rows: Record<string, StageRow>): Record<string, StageRow> =>
  Object.fromEntries(
    Object.entries(rows).map(([id, row]) => [id, row.status === 'running' ? { status: 'stopped' as const } : row]),
  );

export const LessonSourceCard: React.FC<LessonSourceCardProps> = ({ onExtractPhase, councilClip = null, onRunCouncil }) => {
  const [catalog, setCatalog] = useState<Catalog>({ state: 'loading' });
  const [selected, setSelected] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadState>({ state: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const [stages, setStages] = useState<ExtractionStage[]>(FALLBACK_STAGES);
  const [stageRows, setStageRows] = useState<Record<string, StageRow>>({});
  const [extraction, setExtraction] = useState<Extraction>({ state: 'idle' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortRef = useRef<(() => void) | null>(null);
  const extractAbortRef = useRef<AbortController | null>(null);
  const onPhaseRef = useRef(onExtractPhase);
  onPhaseRef.current = onExtractPhase;

  const loadCatalog = useCallback(async (select?: string) => {
    try {
      const result = await fetchClipCatalog();
      setCatalog({ state: 'ready', items: result.items, maxUploadBytes: result.maxUploadBytes ?? DEFAULT_MAX_UPLOAD_BYTES });
      if (result.stages.length) setStages(result.stages);
      setSelected((current) => {
        const names = result.items.map((i) => i.name);
        if (select && names.includes(select)) return select;
        if (current && names.includes(current)) return current;
        return names.includes(DEFAULT_CLIP) ? DEFAULT_CLIP : (names[0] ?? null);
      });
    } catch (err) {
      setCatalog({ state: 'error', message: err instanceof ClipApiError ? err.message : 'Không tải được danh sách video.' });
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
    return () => {
      uploadAbortRef.current?.();
      extractAbortRef.current?.abort();
    };
  }, [loadCatalog]);

  const maxBytes = catalog.state === 'ready' ? catalog.maxUploadBytes : DEFAULT_MAX_UPLOAD_BYTES;
  const uploading = upload.state === 'uploading';
  const extracting = extraction.state === 'running';

  const startUpload = (file: File) => {
    if (uploading) return;
    const problem = checkUploadFile(file, maxBytes);
    if (problem) {
      setUpload({ state: 'error', message: problem });
      return;
    }
    sound.playPencilTap();
    setUpload({ state: 'uploading', fileName: file.name, fraction: 0 });
    const handle = uploadClip(file, (fraction) =>
      setUpload((u) => (u.state === 'uploading' ? { ...u, fraction } : u)),
    );
    uploadAbortRef.current = handle.abort;
    handle.promise
      .then(async (item) => {
        setUpload({ state: 'done', title: item.title });
        await loadCatalog(item.name);
      })
      .catch((err: unknown) => {
        if (isAbort(err)) setUpload({ state: 'idle' });
        else setUpload({ state: 'error', message: err instanceof Error ? err.message : 'Tải lên thất bại.' });
      })
      .finally(() => {
        uploadAbortRef.current = null;
      });
  };

  const stageLabel = (id: string) => stages.find((s) => s.id === id)?.label ?? id;

  const runExtraction = async (refresh: boolean) => {
    if (!selected || extracting) return;
    sound.playPencilTap();
    const clip = selected;
    const controller = new AbortController();
    extractAbortRef.current = controller;
    setStageRows({});
    setExtraction({ state: 'running', clip });
    onPhaseRef.current?.('running', 'Đang chuẩn bị video');

    let failure: { stage: string; detail?: string } | null = null;
    let cached = false;
    try {
      const stream = await streamClipExtraction(
        clip,
        {
          onStages: (list) => list.length && setStages(list),
          onStage: (e) => {
            if (e.status === 'error') failure = { stage: e.stage, detail: e.detail };
            if (e.detail === 'cached') cached = true;
            setStageRows((rows) => ({ ...rows, [e.stage]: { status: e.status, detail: e.detail } }));
            if (e.status === 'running') onPhaseRef.current?.('running', stageLabel(e.stage));
          },
        },
        { refresh, signal: controller.signal },
      );
      const fallbackReason = stream.processedBy?.fallbackReason;
      if (failure || stream.processedBy?.mode !== 'live') {
        const f = failure as { stage: string; detail?: string } | null;
        const detail = f?.detail ?? fallbackReason;
        setExtraction({
          state: 'error',
          clip,
          message: explainExtractionError(detail, f ? stageLabel(f.stage) : undefined),
          detail,
        });
        setStageRows(stopRunning);
        onPhaseRef.current?.('error');
        return;
      }
      setExtraction({ state: 'done', clip, stream, cached });
      onPhaseRef.current?.('completed');
      sound.playSuccessChime();
    } catch (err) {
      if (isAbort(err)) {
        setExtraction({ state: 'idle' });
        setStageRows({});
        onPhaseRef.current?.('pending');
        return;
      }
      setExtraction({
        state: 'error',
        clip,
        message: err instanceof Error ? err.message : 'Phân tích video gặp lỗi.',
      });
      setStageRows(stopRunning);
      onPhaseRef.current?.('error');
    } finally {
      if (extractAbortRef.current === controller) extractAbortRef.current = null;
    }
  };

  const items = catalog.state === 'ready' ? catalog.items : [];
  const selectedItem = items.find((i) => i.name === selected);
  const showStages = extraction.state !== 'idle';

  return (
    <section
      aria-labelledby="lesson-source-title"
      className="w-full bg-white border border-[#E2EAD2] rounded-3xl p-5 sm:p-6 shadow-[0_1px_2px_rgba(18,23,18,0.04)]"
    >
      <div className="mb-4">
        <h2 id="lesson-source-title" className="text-[17px] font-bold text-[#121712] leading-tight">
          Nguồn bài học
        </h2>
        <p className="text-[13px] text-[#4A5546] mt-1">
          Bài giảng, tài liệu và kho tri thức mà hội đồng AI dựa vào để soạn kịch bản.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Lesson in use + extraction progress */}
        <div className="space-y-4 min-w-0">
          <div className="rounded-2xl bg-[#F7FAF0] border border-[#E2EAD2] p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-[#121712]">Đang dùng</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#B7DB6A] bg-white text-xs font-semibold text-[#1F4D12]">
                <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                Đã lập chỉ mục
              </span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
              <dt className="text-[#4A5546]">Video</dt>
              <dd className="font-semibold text-[#121712]">{INDEXED_LESSON.video}</dd>
              <dt className="text-[#4A5546]">Tài liệu</dt>
              <dd className="font-semibold text-[#121712]">{INDEXED_LESSON.textbook}</dd>
              <dt className="text-[#4A5546]">Kho tri thức</dt>
              <dd className="font-semibold text-[#121712] tabular-nums">{INDEXED_LESSON.knowledge}</dd>
            </dl>
          </div>

          {showStages && (
            <div className="rounded-2xl border border-[#E2EAD2] p-4 space-y-3" aria-live="polite">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#121712]">Phân tích video</h3>
                <span className="font-mono text-[11px] text-[#5B6657] truncate">{extraction.clip}</span>
              </div>
              <ol className="space-y-2">
                {stages.map((s) => {
                  const row = stageRows[s.id];
                  const status: ExtractionStageStatus = row?.status ?? 'pending';
                  return (
                    <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                      <StageIcon status={status} />
                      <span className={status === 'pending' || status === 'stopped' ? 'text-[#4A5546]' : 'text-[#121712] font-semibold'}>{s.label}</span>
                      <span className="ml-auto text-xs text-[#4A5546] shrink-0">
                        {row?.detail === 'cached' ? 'Lấy từ lần trước' : STAGE_STATUS_TEXT[status]}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {extraction.state === 'error' && (
                <div role="alert" className="rounded-xl border border-[#D5DFC4] bg-[#F7FAF0] p-3 space-y-1">
                  <p className="text-[13px] font-semibold text-[#121712]">{extraction.message}</p>
                  {extraction.detail && (
                    <p className="font-mono text-[11px] text-[#4A5546] break-all line-clamp-3" title={extraction.detail}>
                      {extraction.detail}
                    </p>
                  )}
                  <p className="text-xs text-[#4A5546]">Hội đồng vẫn dùng bài giảng đã lập chỉ mục ở trên.</p>
                </div>
              )}

              {extraction.state === 'done' && (
                <div className="rounded-xl border border-[#B7DB6A] bg-[#F7FBEF] p-3 space-y-2">
                  <p className="text-[13px] font-semibold text-[#1F4D12]">
                    {extraction.stream.segments.length} đoạn · {extraction.stream.durationSeconds} giây
                    {extraction.stream.processedBy?.processingLatencyMs !== undefined && !extraction.cached && (
                      <> · xử lý {(extraction.stream.processedBy.processingLatencyMs / 1000).toFixed(1).replace('.', ',')} s</>
                    )}
                    {extraction.cached && ' · kết quả lần phân tích trước'}
                  </p>
                  <ul className="space-y-1">
                    {extraction.stream.segments.slice(0, 4).map((seg) => (
                      <li key={seg.id} className="flex gap-2 text-[13px] min-w-0">
                        <span className="font-mono text-[11px] text-[#1F4D12] tabular-nums pt-0.5 shrink-0">{seg.timeFormatted}</span>
                        <span className="text-[#121712] truncate">
                          {(seg.blackboardText || seg.audioTranscript || '—').replace(/\s+/g, ' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {extraction.stream.segments.every((seg) => !seg.blackboardText && !seg.audioTranscript) && (
                    <p className="text-xs text-[#4A5546]">
                      Video không có lời nói và chưa đọc được chữ trên bảng hay slide, nên hội đồng sẽ không có nội dung để soạn.
                    </p>
                  )}
                  {onRunCouncil && (
                    councilClip === extraction.clip ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[13px] font-semibold text-[#1F4D12]">Hội đồng đang đọc video này. Bấm Phát suy luận bên dưới.</span>
                        <button
                          type="button"
                          onClick={() => onRunCouncil(null)}
                          className="rounded-lg px-2 py-1 text-[13px] font-semibold text-[#1F4D12] underline underline-offset-2 hover:bg-[#EDF6DA] focus-visible:outline-2 focus-visible:outline-[#121712]"
                        >
                          Quay về bài đã lập chỉ mục
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onRunCouncil(extraction.clip);
                          document.getElementById('warroom-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="mt-1 inline-flex h-9 items-center rounded-full bg-[#121712] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]"
                      >
                        Cho hội đồng soạn kịch bản từ video này
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload + clip picker */}
        <div className="space-y-4 min-w-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) startUpload(file);
            }}
            className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${
              dragOver ? 'border-[#121712] bg-[#F4FAE6]' : 'border-[#C9D4B6] bg-white'
            }`}
          >
            {uploading ? (
              <div className="space-y-2" aria-live="polite">
                <div className="flex items-center gap-2 text-[13px]">
                  <FileVideo className="w-4 h-4 text-[#3D4739] shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-[#121712] truncate">{upload.fileName}</span>
                  <span className="ml-auto font-mono text-[11px] text-[#3D4739] tabular-nums">{Math.round(upload.fraction * 100)}%</span>
                </div>
                <div
                  className="h-1.5 rounded-full bg-[#E9F2D8] overflow-hidden"
                  role="progressbar"
                  aria-label="Tiến độ tải lên"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(upload.fraction * 100)}
                >
                  <div className="h-full bg-[#1F5E3A] transition-[width] duration-200" style={{ width: `${upload.fraction * 100}%` }} />
                </div>
                <button
                  type="button"
                  onClick={() => uploadAbortRef.current?.()}
                  className="text-xs font-semibold text-[#3D4739] underline underline-offset-4 cursor-pointer hover:text-[#121712]"
                >
                  Huỷ tải lên
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#F3F8E8] flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4 text-[#121712]" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#121712]">Kéo thả video bài giảng vào đây</p>
                  <p className="text-xs text-[#4A5546]">MP4, WebM hoặc MOV · tối đa {formatBytes(maxBytes)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4 rounded-full border border-[#D5DFC4] bg-white text-sm font-semibold text-[#121712] hover:bg-[#F3F8E8] cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]"
                >
                  Chọn tệp
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) startUpload(file);
                  }}
                />
              </div>
            )}
            {upload.state === 'error' && (
              <p role="alert" className="mt-2 text-[13px] text-[#121712]">
                <span className="font-semibold">Chưa tải lên được:</span> {upload.message}
              </p>
            )}
            {upload.state === 'done' && (
              <p className="mt-2 text-[13px] text-[#1F4D12] font-semibold">Đã tải lên “{upload.title}”. Chọn Phân tích để đọc video.</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 id="clip-list-title" className="text-sm font-semibold text-[#121712]">
              Video trên máy chủ
            </h3>
            {catalog.state === 'loading' && <p className="text-[13px] text-[#4A5546]">Đang tải danh sách…</p>}
            {catalog.state === 'error' && (
              <div role="alert" className="text-[13px] text-[#121712] space-y-1">
                <p>{catalog.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCatalog({ state: 'loading' });
                    void loadCatalog();
                  }}
                  className="text-xs font-semibold text-[#2F7A3B] underline underline-offset-4 cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}
            {catalog.state === 'ready' && items.length === 0 && (
              <p className="text-[13px] text-[#4A5546]">Chưa có video nào. Tải một video lên để phân tích.</p>
            )}
            {items.length > 0 && (
              <div role="radiogroup" aria-labelledby="clip-list-title" className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {items.map((item) => {
                  const active = item.name === selected;
                  return (
                    <label
                      key={item.name}
                      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#121712] ${
                        active ? 'border-[#121712] bg-[#F7FAF0]' : 'border-[#E2EAD2] bg-white hover:bg-[#F7FAF0]'
                      } ${extracting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="lesson-clip"
                        value={item.name}
                        checked={active}
                        disabled={extracting}
                        onChange={() => setSelected(item.name)}
                        className="mt-1 accent-[#121712]"
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-[#121712] leading-snug">{item.title}</span>
                        <span className="block text-[11px] text-[#4A5546] truncate">
                          <span className="font-mono">{item.name}</span>
                          {item.sizeBytes !== null && <span className="tabular-nums"> · {formatBytes(item.sizeBytes)}</span>}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {extracting ? (
              <button
                type="button"
                onClick={() => extractAbortRef.current?.abort()}
                className="h-10 px-5 rounded-full border border-[#D5DFC4] bg-white text-sm font-semibold text-[#121712] hover:bg-[#F3F8E8] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]"
              >
                Dừng phân tích
              </button>
            ) : (
              <button
                type="button"
                disabled={!selectedItem}
                onClick={() => void runExtraction(false)}
                className="h-10 px-5 rounded-full bg-[#121712] text-white text-sm font-semibold hover:bg-black cursor-pointer disabled:bg-[#E3EDCF] disabled:text-[#6B7766] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]"
              >
                Phân tích
              </button>
            )}
            {!extracting && (extraction.state === 'done' || extraction.state === 'error') && extraction.clip === selected && (
              <button
                type="button"
                onClick={() => void runExtraction(true)}
                className="h-10 px-4 rounded-full text-sm font-semibold text-[#3D4739] hover:bg-[#F3F8E8] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]"
              >
                Phân tích lại từ đầu
              </button>
            )}
            {selectedItem && !extracting && (
              <span className="text-xs text-[#4A5546] min-w-0 truncate">Chép lời và đọc bảng của video đã chọn</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
