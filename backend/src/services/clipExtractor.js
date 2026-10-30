import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { config } from '../config.js';

/**
 * Live multimodal extraction for a short lecture clip (issue #5, enhanced in #28):
 *   split audio → Whisper transcript with timestamps
 *   pick keyframes where the board/slide settles after a change → subject-agnostic vision OCR
 *   fuse both by timestamp → CognitiveEventStream (src/types/pipeline.ts)
 * Any failure (no API key, network, timeout) falls back to the authored fixture so the demo
 * never stalls; results are cached by file hash so a second run is instant.
 */
const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
export const CLIPS_DIR = path.resolve(here, '../../assets/clips');
const CACHE_DIR = path.join(CLIPS_DIR, '.cache');
const FALLBACK_FIXTURE = path.resolve(here, '../../../mock/mock_short_clip_sample.json');

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

// Keyframe selection on 1 fps grayscale thumbnails of the board/slide area.
const THUMB_W = 96;
const THUMB_H = 54;
const DEFAULT_BOARD_X_FROM = 0.45; // Default for traditional classroom blackboard where teacher stands on the left
const STABLE_DIFF = 1.0; // mean abs pixel change between consecutive seconds when nothing moves
// Change against the last keyframe that counts as new board content. A short chalk line on
// the demo clip measures ~2.2 while a still board drifts up to ~1.0 (lighting, small moves).
const BOARD_CHANGED_DIFF = 1.5;
const MAX_KEYFRAMES = 4;
const REQUEST_TIMEOUT_MS = 30_000;

export const STAGES = [
  { id: 'split_audio', label: 'Tách audio & chép lời (Whisper)' },
  { id: 'keyframes', label: 'Chọn keyframe bảng phấn / slide' },
  { id: 'board_ocr', label: 'Đọc nội dung bảng / slide (Vision)' },
  { id: 'fuse', label: 'Hợp nhất timeline' },
];

export const CLIP_EXTENSIONS = ['.mp4'];

function isClipFile(file) {
  if (!CLIP_EXTENSIONS.includes(path.extname(file).toLowerCase())) return false;
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

export function listClips() {
  if (!fs.existsSync(CLIPS_DIR)) return [];
  return fs.readdirSync(CLIPS_DIR).filter((f) => isClipFile(path.join(CLIPS_DIR, f)));
}

/** Absolute path of a regular, supported clip file inside CLIPS_DIR, or null. */
export function resolveClip(name) {
  if (typeof name !== 'string' || !name.trim()) return null;
  const file = path.join(CLIPS_DIR, path.basename(name));
  return isClipFile(file) ? file : null;
}

async function ffmpeg(args, options = {}) {
  const { stdout } = await execFileAsync(FFMPEG, ['-v', 'error', ...args], {
    maxBuffer: 256 * 1024 * 1024,
    encoding: 'buffer',
    ...options,
  });
  return stdout;
}

async function extractAudio(clipPath, outFile, { signal } = {}) {
  await ffmpeg(['-y', '-i', clipPath, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', outFile], { signal });
  return outFile;
}

/**
 * Extracts the region of interest for keyframe change detection.
 * Supports configurable xFrom (0.0 for full screen slides, 0.45 for blackboard with teacher on left).
 */
export function boardRegion(frame, xFrom = DEFAULT_BOARD_X_FROM) {
  const out = [];
  const startX = Math.floor(THUMB_W * Math.max(0, Math.min(0.9, xFrom)));
  for (let y = 0; y < THUMB_H; y++) {
    for (let x = startX; x < THUMB_W; x++) out.push(frame[y * THUMB_W + x]);
  }
  return out;
}

function meanAbsDiff(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

/**
 * Seconds at which to read the board: the first frame, then every moment the board area
 * becomes still again and differs enough from the last keyframe (teacher finished writing/switching slide).
 */
export function pickKeyframeSeconds(regions) {
  if (!regions.length) return [];
  const picked = [0];
  for (let t = 1; t < regions.length; t++) {
    const stable = meanAbsDiff(regions[t], regions[t - 1]) < STABLE_DIFF;
    const changed = meanAbsDiff(regions[t], regions[picked.at(-1)]) > BOARD_CHANGED_DIFF;
    if (stable && changed) picked.push(t);
  }
  if (picked.length <= MAX_KEYFRAMES) return picked;
  // Keep the first frame and the latest boards, which carry the most writing.
  return [0, ...picked.slice(-(MAX_KEYFRAMES - 1))];
}

async function boardThumbnails(clipPath, xFrom = DEFAULT_BOARD_X_FROM, { signal } = {}) {
  const raw = await ffmpeg([
    '-i', clipPath,
    '-vf', `fps=1,scale=${THUMB_W}:${THUMB_H},format=gray`,
    '-f', 'rawvideo', '-',
  ], { signal });
  const size = THUMB_W * THUMB_H;
  const regions = [];
  for (let i = 0; i + size <= raw.length; i += size) regions.push(boardRegion(raw.subarray(i, i + size), xFrom));
  return regions;
}

async function grabFrameJpeg(clipPath, second, { signal } = {}) {
  return ffmpeg(
    ['-ss', String(second), '-i', clipPath, '-frames:v', '1', '-vf', 'scale=1024:-1', '-f', 'image2', '-c:v', 'mjpeg', '-'],
    { signal },
  );
}

async function probeDuration(clipPath, { signal } = {}) {
  const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
  const { stdout } = await execFileAsync(
    ffprobe,
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', clipPath],
    { signal },
  );
  return stdout.trim();
}

const FFMPEG_MEDIA = { extractAudio, boardThumbnails, grabFrame: grabFrameJpeg, probeDuration };

let client = null;
function openai() {
  if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY is not set');
  client ??= new OpenAI({ apiKey: config.openaiApiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });
  return client;
}

/** Whisper transcript as [{ start, end, text }] in clip seconds. */
export async function transcribeWithWhisper(audioFile, { signal } = {}) {
  const result = await openai().audio.transcriptions.create(
    {
      file: fs.createReadStream(audioFile),
      model: config.models.stt,
      language: 'vi',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    },
    { signal },
  );
  return (result.segments ?? []).map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }));
}

/**
 * Issue #28: Build a subject-neutral prompt for blackboard and slide OCR.
 * Injects `meta.subject` as an optional hint without constraining output.
 */
export function buildVisionPrompt(meta = {}) {
  const subjectHint = meta.subject ? `Gợi ý môn học/lĩnh vực bài giảng: "${meta.subject}". ` : '';
  return `Bạn là chuyên gia trích xuất nội dung bài giảng đa phương tiện (bảng phấn hoặc slide trình chiếu). ${subjectHint}Hãy đọc kỹ khung hình và trả về JSON đúng cấu trúc:
{
  "blackboardText": "Toàn bộ chữ viết, tiêu đề, mã code hoặc nội dung văn bản nhìn thấy trên bảng/slide, giữ nguyên cấu trúc xuống dòng",
  "blackboardLatex": ["mỗi công thức toán học/khoa học dạng chuỗi LaTeX chuẩn nếu có. Nếu bài giảng không có công thức, để mảng rỗng []"],
  "spatialGeometry": null hoặc {
    "shapeType": "cube" | "cuboid" | "tetrahedron" | "plane" | "general_3d" | "diagram",
    "vertices": ["A", "B", ...],
    "highlightedVectors": ["..."],
    "actionDescription": "mô tả ngắn gọn hình học hoặc sơ đồ nếu có"
  },
  "diagramDescription": "mô tả ngắn sơ đồ tế bào, biểu đồ, quy trình, hình vẽ hoặc code (nếu có, để null nếu không có)",
  "trapRiskLevel": "none" | "low" | "medium" | "high",
  "pedagogicalTags": ["các từ khóa phân loại nội dung, ví dụ: problem_statement, definition, diagram, code_example..."]
}
Quy tắc sư phạm:
- "trapRiskLevel" = "high" khi trên bảng/slide có lời giải sai bị gạch, dấu hiệu cảnh báo sai lầm, hoặc chỗ học sinh dễ mắc ngộ nhận/hiểu sai.
- Nếu bài giảng KHÔNG PHẢI hình học không gian 3D, hãy đặt "spatialGeometry": null và KHÔNG ép tạo công thức LaTeX vô nghĩa.
- Chỉ ghi lại trung thực những gì thực sự nhìn thấy trên khung hình.`;
}

export const BOARD_PROMPT = buildVisionPrompt();

/** Blackboard/slide reading of one keyframe, shaped as the board fields of CognitiveTimelineSegment. */
export async function readBoardWithVision(jpeg, meta = {}, { signal } = {}) {
  const model = config.models.vision;
  const promptContent = buildVisionPrompt(meta);
  const request = {
    model,
    // gpt-6 reasoning adds ~8s per frame without improving the board reading on the demo clip
    ...(model.startsWith('gpt-6') ? { reasoning_effort: config.visionReasoningEffort } : {}),
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: promptContent },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Ảnh bài giảng (bảng phấn hoặc slide):' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${jpeg.toString('base64')}`, detail: 'high' } },
        ],
      },
    ],
  };
  const response = await openai().chat.completions.create(request, { signal });
  return JSON.parse(response.choices?.[0]?.message?.content ?? '{}');
}

const TRAP_LEVELS = ['none', 'low', 'medium', 'high'];
const SHAPES = ['cube', 'cuboid', 'tetrahedron', 'plane', 'general_3d', 'diagram'];

function normalizeBoard(board = {}) {
  const geo = board.spatialGeometry;
  return {
    blackboardText: String(board.blackboardText ?? ''),
    blackboardLatex: Array.isArray(board.blackboardLatex) ? board.blackboardLatex.map(String) : [],
    spatialGeometry:
      geo && SHAPES.includes(geo.shapeType)
        ? {
            shapeType: geo.shapeType,
            vertices: Array.isArray(geo.vertices) ? geo.vertices.map(String) : [],
            highlightedVectors: Array.isArray(geo.highlightedVectors) ? geo.highlightedVectors.map(String) : [],
            actionDescription: String(geo.actionDescription ?? ''),
          }
        : undefined,
    diagramDescription: board.diagramDescription ? String(board.diagramDescription) : undefined,
    trapRiskLevel: TRAP_LEVELS.includes(board.trapRiskLevel) ? board.trapRiskLevel : 'none',
    pedagogicalTags: Array.isArray(board.pedagogicalTags) ? board.pedagogicalTags.map(String) : [],
  };
}

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** One segment per keyframe; its speech is every transcript line starting before the next keyframe. */
export function fuseTimeline({ keyframeSeconds, boards, transcript, speaker }) {
  return keyframeSeconds.map((second, i) => {
    const next = keyframeSeconds[i + 1] ?? Infinity;
    const speech = transcript.filter((t) => t.start >= second && t.start < next).map((t) => t.text);
    return {
      id: `live_seg_${String(i + 1).padStart(2, '0')}`,
      second,
      timeFormatted: formatTime(second),
      audioTranscript: speech.join(' '),
      speaker,
      ...normalizeBoard(boards[i]),
    };
  });
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

function fallbackStream(reason) {
  const stream = JSON.parse(fs.readFileSync(FALLBACK_FIXTURE, 'utf8'));
  stream.processedBy = { ...stream.processedBy, mode: 'authored', fallbackReason: reason };
  return stream;
}

/**
 * @param {string} clipPath
 * @param {object} [options]
 * @param {(e: {stage: string, status: 'running'|'done'|'error', detail?: string}) => void} [options.onStage]
 * @param {object} [options.meta] videoId/videoTitle/teacherName/subject/sourceClip/roi for the output
 * @param {boolean} [options.useCache=true]
 * @param {Function} [options.transcribe] (audioFile, { signal }) => transcript; override for tests
 * @param {Function} [options.readBoard] (jpeg, meta, { signal }) => board; override for tests
 * @param {object} [options.media] overrides for the ffmpeg steps (extractAudio, boardThumbnails, grabFrame, probeDuration)
 * @returns {Promise<import('../../../src/types/pipeline').CognitiveEventStream>}
 */
export async function extractClip(clipPath, options = {}) {
  const {
    onStage = () => {},
    meta = {},
    useCache = true,
    transcribe = transcribeWithWhisper,
    readBoard = readBoardWithVision,
  } = options;
  const media = { ...FFMPEG_MEDIA, ...options.media };

  const started = Date.now();
  // The first failure cancels every other in-flight step; the run only ends once all of them settle.
  const controller = new AbortController();
  const { signal } = controller;
  let failure = null;
  const fail = (stage, err) => {
    if (failure) return;
    failure = { stage, err };
    controller.abort(err);
  };
  // Wait for every promise to settle, cancelling the rest as soon as one rejects.
  const settleAll = async (stage, promises) => {
    const results = await Promise.allSettled(
      promises.map((p) => p.catch((err) => {
        fail(stage, err);
        throw err;
      })),
    );
    const rejected = results.find((r) => r.status === 'rejected');
    if (rejected) throw failure?.err ?? rejected.reason;
    return results.map((r) => r.value);
  };
  // Report each stage when it really starts and ends; stages may overlap and finish out of order.
  // No stage starts once the run is cancelled.
  const run = async (id, fn) => {
    signal.throwIfAborted();
    onStage({ stage: id, status: 'running' });
    try {
      const result = await fn();
      onStage({ stage: id, status: 'done' });
      return result;
    } catch (err) {
      fail(id, err);
      throw err;
    }
  };

  let workDir = null;
  try {
    const cacheFile = path.join(CACHE_DIR, `${hashFile(clipPath)}.json`);
    if (useCache && fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      for (const s of STAGES) onStage({ stage: s.id, status: 'done', detail: 'cached' });
      return cached;
    }
    workDir = fs.mkdtempSync(path.join(CLIPS_DIR, '.work-'));
    const audioFile = path.join(workDir, 'audio.mp3');

    // Configurable ROI: default to 0.45 only when specifically marked or subject is math blackboard, else 0.0 (full screen)
    const isMathBoard = typeof meta.subject === 'string' && meta.subject.includes('Toán');
    const xFrom = [options.roi?.xFrom, meta.roi?.xFrom].find(Number.isFinite) ?? (isMathBoard ? DEFAULT_BOARD_X_FROM : 0.0);

    // Speech and board reading do not depend on each other, so both branches run concurrently.
    const transcriptPromise = run('split_audio', async () =>
      transcribe(await media.extractAudio(clipPath, audioFile, { signal }), { signal }),
    );
    const boardsPromise = run('keyframes', async () =>
      pickKeyframeSeconds(await media.boardThumbnails(clipPath, xFrom, { signal })),
    ).then((seconds) =>
      run('board_ocr', async () => ({
        seconds,
        boards: await settleAll(
          'board_ocr',
          seconds.map(async (s) => readBoard(await media.grabFrame(clipPath, s, { signal }), meta, { signal })),
        ),
      })),
    );
    const [transcript, { seconds: keyframeSeconds, boards }] = await settleAll('fuse', [transcriptPromise, boardsPromise]);
    const stream = await run('fuse', async () => {
      const durationSeconds = Math.round(Number(await media.probeDuration(clipPath, { signal })));
      const fileName = path.basename(clipPath, path.extname(clipPath));
      return {
        videoId: meta.videoId ?? fileName,
        videoTitle: meta.videoTitle ?? fileName,
        teacherName: meta.teacherName ?? 'Thầy Nguyễn Phan Tiến',
        subject: meta.subject ?? 'Toán 12 - Hình học không gian',
        durationSeconds,
        ...(meta.sourceClip ? { sourceClip: meta.sourceClip } : {}),
        processedBy: {
          mode: 'live',
          sttModel: config.models.stt,
          visionModel: config.models.vision,
          processingLatencyMs: Date.now() - started,
        },
        segments: fuseTimeline({
          keyframeSeconds,
          boards,
          transcript,
          speaker: meta.teacherName ?? 'Thầy Nguyễn Phan Tiến',
        }),
      };
    });

    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, `${JSON.stringify(stream, null, 2)}\n`);
    } catch (err) {
      // A live result is still valid when it cannot be cached; the next run just extracts again.
      console.warn(`[clipExtractor] could not cache ${path.basename(clipPath)}: ${err.message}`);
    }
    return stream;
  } catch (err) {
    // Every branch has settled here, so nothing reports progress after this terminal event.
    const stage = failure?.stage ?? 'fuse';
    const message = (failure?.err ?? err)?.message ?? String(failure?.err ?? err);
    onStage({ stage, status: 'error', detail: message });
    return fallbackStream(`${stage}: ${message}`);
  } finally {
    if (workDir) fs.rmSync(workDir, { recursive: true, force: true });
  }
}

export default { extractClip, listClips, resolveClip, STAGES, buildVisionPrompt, boardRegion };
