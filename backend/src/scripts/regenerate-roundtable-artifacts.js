/**
 * Regenerates the committed roundtable artifacts from deterministic (offline) runs:
 *   - backend/src/data/drafts/lesson_draft_<videoId>.json for the long lecture, the 60s Example 3 clip
 *     and the 65s single-segment clip
 *   - mock/mock_roundtable_run_fixture.json (replay fixture of Part 3 of the long lecture)
 *
 * Usage: node backend/src/scripts/regenerate-roundtable-artifacts.js
 * No model is called (useLLM: false), so no API key is needed and the output is reproducible
 * apart from ids and timestamps.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  runFullLessonRoundtable,
  runRoundtableForPart,
  partitionTimelineIntoParts,
  buildLessonDraft,
  getDraftsDir,
} from '../services/roundtableOrchestrator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8'));

// Single-segment 65s clip used by the roundtable tests for the short-clip case.
const SHORT_CLIP_65S = {
  videoId: 'VID_SHORT_60S',
  videoTitle: 'Clip 60s: Ví dụ tính nhanh độ dài vectơ',
  teacherName: 'Thầy Nguyễn Phan Tiến',
  subject: 'Toán 12',
  durationSeconds: 65,
  segments: [
    {
      id: 'seg_clip_37',
      second: 37,
      timeFormatted: '00:37',
      audioTranscript: "Ví dụ 3: Cho hình lập phương ABCD.A'B'C'D' cạnh bằng 1. Tính độ dài tổng vectơ BC cộng DD'.",
      speaker: 'Thầy Tiến',
      blackboardText: "Tính: |BC + DD'|",
      blackboardLatex: ["|\\vec{BC} + \\vec{DD'}|"],
      trapRiskLevel: 'high',
      pedagogicalTags: ['length_addition_fallacy'],
    },
  ],
};

async function main() {
  if (process.env.DRE_DRAFTS_DIR) {
    throw new Error('Unset DRE_DRAFTS_DIR: this script writes the committed drafts.');
  }

  const longLecture = readJson('mock/mock_cognitive_stream_vecto12.json');
  const streams = [longLecture, readJson('mock/mock_short_clip_sample.json'), SHORT_CLIP_65S];
  for (const stream of streams) {
    const draft = await runFullLessonRoundtable(stream, { useLLM: false });
    console.log(`draft ${stream.videoId}: ${draft.parts.length} part(s), checkpoints at ${draft.checkpoints.map(c => c.second).join(', ')}s`);
  }

  const runId = 'run_vecto12_part3_wow_moment';
  const part = partitionTimelineIntoParts(longLecture).find(p => p.misconceptionId === 'MISC_VEC_005');
  const events = [];
  const partResult = await runRoundtableForPart(part, {
    useLLM: false,
    onEvent: evt => events.push({ ...evt, runId }),
  });
  const fixture = {
    runId,
    provenance: 'recorded_fixture',
    videoId: longLecture.videoId,
    videoTitle: longLecture.videoTitle,
    partNumber: partResult.partNumber,
    createdAt: new Date().toISOString(),
    generation: partResult.generation,
    stats: {
      totalEvents: events.length,
      totalToolCalls: events.filter(e => e.eventType === 'tool_call').length,
      crossCheckCorrectionOccurred: partResult.crossCheckCorrectionOccurred,
      bloomLevel: partResult.bloomLevel,
      partTitle: partResult.title,
    },
    reasoning_events: events,
    lesson: buildLessonDraft(longLecture, [partResult]),
  };
  const fixturePath = path.join(REPO_ROOT, 'mock/mock_roundtable_run_fixture.json');
  fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + '\n', 'utf-8');
  console.log(`fixture ${path.relative(REPO_ROOT, fixturePath)}: ${events.length} events`);
  console.log(`drafts written to ${path.relative(REPO_ROOT, getDraftsDir())}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
