import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Pre-indexed lessons (CognitiveEventStream) loaded from disk.
 * Supports:
 * 1. backend/src/data/lesson-index/*.json
 * 2. mock/*.json (as fallback for mock_cognitive_stream_vecto12 and mock_short_clip_sample)
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../');
const INDEX_DIR = path.resolve(__dirname, '../data/lesson-index');
const MOCK_DIR = path.resolve(REPO_ROOT, 'mock');

const lessons = new Map();

function loadIndexFiles() {
  lessons.clear();

  // 1. Load from backend/src/data/lesson-index
  if (fs.existsSync(INDEX_DIR)) {
    const files = fs.readdirSync(INDEX_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      try {
        const stream = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, f), 'utf8'));
        if (stream && stream.videoId && Array.isArray(stream.segments)) {
          stream.segments.sort((a, b) => (a.second || 0) - (b.second || 0));
          lessons.set(stream.videoId, stream);
        }
      } catch (err) {
        console.warn(`[LessonIndex] Error reading index file ${f}:`, err);
      }
    }
  }

  // 2. Load mock fallbacks if not already present
  if (fs.existsSync(MOCK_DIR)) {
    const mockFiles = ['mock_cognitive_stream_vecto12.json', 'mock_short_clip_sample.json'];
    for (const mf of mockFiles) {
      const fullPath = path.join(MOCK_DIR, mf);
      if (fs.existsSync(fullPath)) {
        try {
          const stream = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (stream && stream.videoId && !lessons.has(stream.videoId) && Array.isArray(stream.segments)) {
            stream.segments.sort((a, b) => (a.second || 0) - (b.second || 0));
            lessons.set(stream.videoId, stream);
          }
        } catch (_) {}
      }
    }
  }
}

// Initial load
loadIndexFiles();

export function listLessons() {
  loadIndexFiles();
  return [...lessons.values()].map(({ videoId, videoTitle, teacherName, subject, durationSeconds, segments }) => ({
    videoId,
    videoTitle,
    teacherName,
    subject,
    durationSeconds,
    segmentCount: (segments || []).length,
  }));
}

export function getLessonIndex(videoId) {
  if (!videoId) return null;
  const direct = lessons.get(videoId);
  if (direct) return direct;

  // Reload once in case a new file was written
  loadIndexFiles();
  return lessons.get(videoId) ?? null;
}

/** Index of the last segment starting at or before `second` (-1 if none). */
function segmentIndexAt(segments, second) {
  let lo = 0;
  let hi = segments.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid].second <= second) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/**
 * What the board shows and what the teacher just said at `second`.
 */
export function getBoardStateAt(videoId, second, windowS = 30) {
  const stream = getLessonIndex(videoId);
  if (!stream) return null;

  const segments = stream.segments || [];
  const i = segmentIndexAt(segments, second);
  if (i === -1) return { second, segment: null, recentSpeech: [] };

  const recentSpeech = [];
  for (let j = i; j >= 0; j--) {
    const s = segments[j];
    if (j !== i && s.second < second - windowS) break;
    if (s.audioTranscript) recentSpeech.unshift({ second: s.second, speaker: s.speaker, text: s.audioTranscript });
  }

  return { second, segment: segments[i], recentSpeech };
}

export default { listLessons, getLessonIndex, getBoardStateAt };
