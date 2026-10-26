import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { config } from '../config.js';

/**
 * Live multimodal extraction for a short lecture clip (issue #5):
 *   split audio → Whisper transcript with timestamps
 *   pick keyframes where the blackboard settles after a change → vision OCR of the board
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

// Keyframe selection on 1 fps grayscale thumbnails of the board area.
const THUMB_W = 96;
const THUMB_H = 54;
const BOARD_X_FROM = 0.45; // the teacher mostly stands on the left; the board fills the right
const STABLE_DIFF = 1.0; // mean abs pixel change between consecutive seconds when nothing moves
// Change against the last keyframe that counts as new board content. A short chalk line on
// the demo clip measures ~2.2 while a still board drifts up to ~1.0 (lighting, small moves).
const BOARD_CHANGED_DIFF = 1.5;
const MAX_KEYFRAMES = 4;
const REQUEST_TIMEOUT_MS = 30_000;

export const STAGES = [
  { id: 'split_audio', label: 'Tách audio & chép lời (Whisper)' },
  { id: 'keyframes', label: 'Chọn keyframe bảng phấn' },
  { id: 'board_ocr', label: 'Đọc bảng phấn (Vision)' },
  { id: 'fuse', label: 'Hợp nhất timeline' },
];

export function listClips() {
  if (!fs.existsSync(CLIPS_DIR)) return [];
  return fs.readdirSync(CLIPS_DIR).filter((f) => f.endsWith('.mp4'));
}

export function resolveClip(name) {
  const file = path.join(CLIPS_DIR, path.basename(name));
  return fs.existsSync(file) ? file : null;
}

async function ffmpeg(args, options = {}) {
  const { stdout } = await execFileAsync(FFMPEG, ['-v', 'error', ...args], {
    maxBuffer: 256 * 1024 * 1024,
    encoding: 'buffer',
    ...options,
  });
  return stdout;
}

async function extractAudio(clipPath, outFile) {
  await ffmpeg(['-y', '-i', clipPath, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', outFile]);
  return outFile;
}

function boardRegion(frame) {
  const out = [];
  for (let y = 0; y < THUMB_H; y++) {
    for (let x = Math.floor(THUMB_W * BOARD_X_FROM); x < THUMB_W; x++) out.push(frame[y * THUMB_W + x]);
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
 * becomes still again and differs enough from the last keyframe (teacher finished writing).
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

async function boardThumbnails(clipPath) {
  const raw = await ffmpeg([
    '-i', clipPath,
    '-vf', `fps=1,scale=${THUMB_W}:${THUMB_H},format=gray`,
    '-f', 'rawvideo', '-',
  ]);
  const size = THUMB_W * THUMB_H;
  const regions = [];
  for (let i = 0; i + size <= raw.length; i += size) regions.push(boardRegion(raw.subarray(i, i + size)));
  return regions;
}

async function grabFrameJpeg(clipPath, second) {
  return ffmpeg(['-ss', String(second), '-i', clipPath, '-frames:v', '1', '-vf', 'scale=1024:-1', '-f', 'image2', '-c:v', 'mjpeg', '-']);
}

let client = null;
function openai() {
  if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY is not set');
  client ??= new OpenAI({ apiKey: config.openaiApiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });
  return client;
}

/** Whisper transcript as [{ start, end, text }] in clip seconds. */
export async function transcribeWithWhisper(audioFile) {
  const result = await openai().audio.transcriptions.create({
    file: fs.createReadStream(audioFile),
    model: config.models.stt,
    language: 'vi',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });
  return (result.segments ?? []).map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }));
}

const BOARD_PROMPT = `Bạn là chuyên gia OCR bảng phấn Toán THPT. Đọc ảnh bảng phấn và trả về JSON đúng dạng:
{
  "blackboardText": "toàn bộ chữ trên bảng, giữ xuống dòng",
  "blackboardLatex": ["mỗi công thức là một chuỗi LaTeX chuẩn, ví dụ |\\\\vec{BC} + \\\\vec{DD'}|"],
  "spatialGeometry": null hoặc {
    "shapeType": "cube" | "cuboid" | "tetrahedron" | "plane" | "general_3d",
    "vertices": ["A", "B", ...],
    "highlightedVectors": ["BC", "DD'"],
    "actionDescription": "thầy đang làm gì với hình"
  },
  "trapRiskLevel": "none" | "low" | "medium" | "high",
  "pedagogicalTags": ["snake_case tag"]
}
trapRiskLevel = "high" khi trên bảng có lời giải sai bị gạch hoặc chỗ học sinh dễ mắc ngộ nhận. Chỉ ghi những gì thật sự nhìn thấy.`;

/** Blackboard reading of one keyframe, shaped as the board fields of CognitiveTimelineSegment. */
export async function readBoardWithVision(jpeg) {
  const response = await openai().chat.completions.create({
    model: config.models.vision,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: BOARD_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Ảnh bảng phấn:' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${jpeg.toString('base64')}`, detail: 'high' } },
        ],
      },
    ],
  });
  return JSON.parse(response.choices?.[0]?.message?.content ?? '{}');
}

const TRAP_LEVELS = ['none', 'low', 'medium', 'high'];
const SHAPES = ['cube', 'cuboid', 'tetrahedron', 'plane', 'general_3d'];

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
 * @param {object} [options.meta] videoId/videoTitle/teacherName/subject/sourceClip for the output
 * @param {boolean} [options.useCache=true]
 * @param {Function} [options.transcribe] override for tests
 * @param {Function} [options.readBoard] override for tests
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

  const cacheFile = path.join(CACHE_DIR, `${hashFile(clipPath)}.json`);
  if (useCache && fs.existsSync(cacheFile)) {
    for (const s of STAGES) onStage({ stage: s.id, status: 'done', detail: 'cached' });
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }

  const started = Date.now();
  const workDir = fs.mkdtempSync(path.join(CLIPS_DIR, '.work-'));
  let stage = STAGES[0].id;
  const run = async (id, fn) => {
    stage = id;
    onStage({ stage: id, status: 'running' });
    const result = await fn();
    onStage({ stage: id, status: 'done' });
    return result;
  };

  try {
    // Audio and keyframes do not depend on each other; start both, report in pipeline order.
    const transcriptPromise = extractAudio(clipPath, path.join(workDir, 'audio.mp3')).then(transcribe);
    const regionsPromise = boardThumbnails(clipPath);
    transcriptPromise.catch(() => {});
    regionsPromise.catch(() => {});

    const transcript = await run('split_audio', () => transcriptPromise);
    const keyframeSeconds = await run('keyframes', async () => pickKeyframeSeconds(await regionsPromise));
    const boards = await run('board_ocr', () =>
      Promise.all(keyframeSeconds.map(async (s) => readBoard(await grabFrameJpeg(clipPath, s)))),
    );
    const stream = await run('fuse', async () => {
      const durationSeconds = Math.round(Number(await probeDuration(clipPath)));
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

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, `${JSON.stringify(stream, null, 2)}\n`);
    return stream;
  } catch (err) {
    onStage({ stage, status: 'error', detail: err.message });
    return fallbackStream(`${stage}: ${err.message}`);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

async function probeDuration(clipPath) {
  const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
  const { stdout } = await execFileAsync(ffprobe, [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', clipPath,
  ]);
  return stdout.trim();
}

export default { extractClip, listClips, resolveClip, STAGES };
