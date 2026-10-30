import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Pre-indexed lessons (CognitiveEventStream) loaded once from disk, so the classroom and the
 * roundtable get a long lecture instantly and offline instead of extracting it live.
 * Files are produced by `npx tsx scripts/build-lesson-index.ts`.
 */
const INDEX_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/lesson-index');

const lessons = new Map(
  fs
    .readdirSync(INDEX_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const stream = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, f), 'utf8'));
      stream.segments.sort((a, b) => a.second - b.second);
      return [stream.videoId, stream];
    }),
);

export function listLessons() {
  return [...lessons.values()].map(({ videoId, videoTitle, teacherName, subject, durationSeconds, segments }) => ({
    videoId,
    videoTitle,
    teacherName,
    subject,
    durationSeconds,
    segmentCount: segments.length,
  }));
}

export function getLessonIndex(videoId) {
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
 * What the board shows and what the teacher just said at `second`, for grounding an agent
 * answer (context snapshot #12). `recentSpeech` lists segments that started within the
 * last `windowS` seconds, always including the active one.
 */
export function getBoardStateAt(videoId, second, windowS = 30) {
  const stream = lessons.get(videoId);
  if (!stream) return null;

  const { segments } = stream;
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
