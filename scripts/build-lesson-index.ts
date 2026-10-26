// Builds the pre-indexed CognitiveEventStream for a long lesson from the data we already
// have (authored board segments, transcript cues, chapter list), so the classroom can load
// the whole lesson instantly instead of extracting a 2.5h video live.
// Run: npx tsx scripts/build-lesson-index.ts
// Chapters without a transcript are kept as markers tagged `not_indexed_yet`; re-run the
// live extractor offline on those ranges to fill them in.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VECTO_12_THAY_TIEN_LESSON } from '../src/data/videoLessons';
import type { CognitiveEventStream, CognitiveTimelineSegment } from '../src/types/pipeline';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authored: CognitiveEventStream = JSON.parse(
  fs.readFileSync(path.join(root, 'mock/mock_cognitive_stream_vecto12.json'), 'utf8'),
);
const lesson = VECTO_12_THAY_TIEN_LESSON;

// An authored segment this close to a cue start already describes that moment.
const SAME_MOMENT_S = 5;

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${String(m).padStart(2, '0')}:${sec}`;
};

const segments: CognitiveTimelineSegment[] = [...authored.segments];
const covered = (second: number) => segments.some((s) => Math.abs(s.second - second) <= SAME_MOMENT_S);

for (const cue of lesson.transcriptCues) {
  if (covered(cue.start)) continue;
  segments.push({
    id: `idx_${cue.id}`,
    second: cue.start,
    timeFormatted: formatTime(cue.start),
    audioTranscript: cue.text,
    speaker: cue.speaker,
    blackboardText: cue.formula ?? '',
    blackboardLatex: [],
    trapRiskLevel: cue.tag === 'checkpoint' ? 'high' : 'none',
    pedagogicalTags: cue.tag ? [cue.tag] : [],
  });
}

const lastTranscriptSecond = Math.max(...lesson.transcriptCues.map((c) => c.end));
for (const chapter of lesson.chapters) {
  if (chapter.startSecond <= lastTranscriptSecond || covered(chapter.startSecond)) continue;
  segments.push({
    id: `idx_${chapter.id}`,
    second: chapter.startSecond,
    timeFormatted: formatTime(chapter.startSecond),
    audioTranscript: '',
    speaker: 'Thầy Tiến',
    blackboardText: `${chapter.title}${chapter.formulaPreview ? `\n${chapter.formulaPreview}` : ''}`,
    blackboardLatex: [],
    trapRiskLevel: 'none',
    pedagogicalTags: ['chapter_marker', 'not_indexed_yet'],
  });
}

segments.sort((a, b) => a.second - b.second);

const index: CognitiveEventStream = {
  videoId: authored.videoId,
  videoTitle: lesson.title,
  teacherName: authored.teacherName,
  subject: authored.subject,
  durationSeconds: lesson.durationSeconds,
  processedBy: { mode: 'pre_indexed' },
  segments,
};

const outDir = path.join(root, 'backend/src/data/lesson-index');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${index.videoId}.json`);
fs.writeFileSync(outFile, `${JSON.stringify(index, null, 2)}\n`);

const pending = segments.filter((s) => s.pedagogicalTags.includes('not_indexed_yet')).length;
console.log(`Wrote ${path.relative(root, outFile)}: ${segments.length} segments, ${pending} chapters not indexed yet.`);
