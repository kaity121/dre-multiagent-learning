/**
 * Roundtable guarantees that do not depend on a model or an API key:
 * tool-controlled cross-check verdicts, labelled LLM fallback, duration-bounded parts,
 * contained draft storage, abort handling and the DRELessonSchema draft output.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  runRoundtableForPart,
  runFullLessonRoundtable,
  partitionTimelineIntoParts,
  assessTrapProposal,
  assertSafeVideoId,
  resolveDraftPath,
  getDraftsDir,
} from '../src/services/roundtableOrchestrator.js';
import { executeTool } from '../src/tools/index.js';
import { config } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LONG_FIXTURE = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mock/mock_cognitive_stream_vecto12.json'), 'utf-8'));

process.env.DRE_DRAFTS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dre-drafts-'));

const SHORT_STREAM_65S = {
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

function part3() {
  return partitionTimelineIntoParts(LONG_FIXTURE).find(p => p.misconceptionId === 'MISC_VEC_005');
}

/** Fake chat client: Bo answers from `boClaims` in order, every other agent gets a valid line. */
function scriptedLLM(boClaims) {
  const calls = [];
  let boRound = 0;
  return {
    calls,
    chatJSON: async ({ model, systemPrompt, userPayload }) => {
      calls.push({ model, systemPrompt, userPayload });
      if (systemPrompt.includes('"Bo"')) {
        const claim = boClaims[Math.min(boRound, boClaims.length - 1)];
        boRound++;
        return { thought: `Bo thử ${claim}`, claim, speech: `Tớ nghĩ |BC + DD'| = ${claim} đó!` };
      }
      return { speech: 'Lời thoại từ model.', tip: 'Mẹo từ model.', analogy: 'Ví dụ từ model.' };
    },
  };
}

describe('Cross-check verdicts are decided by tool output', () => {
  it('rejects the unrealistic proposal and approves the length-addition trap in a deterministic run', async () => {
    const [part] = partitionTimelineIntoParts(SHORT_STREAM_65S);
    const result = await runRoundtableForPart(part, { useLLM: false });
    assert.deepEqual(
      result.crossCheckRounds.map(r => [r.claim, r.toolIsValid, r.reasonCode]),
      [
        ['AB', false, 'unrealistic_error'],
        ['2a', false, 'natural_misconception'],
      ]
    );
  });

  it('rejects a correct answer proposed by the model and approves only the tool-confirmed misconception', async () => {
    const llm = scriptedLLM(['a√2', '2a']);
    const result = await runRoundtableForPart(part3(), { useLLM: true, llm });

    assert.deepEqual(
      result.crossCheckRounds.map(r => [r.claim, r.verdict, r.reasonCode]),
      [
        ['a√2', 'rejected', 'claim_is_correct'],
        ['2a', 'approved', 'natural_misconception'],
      ]
    );
    assert.equal(result.crossCheckCorrectionOccurred, true);
    assert.ok(result.checkpoint.boInitialChallenge.includes('2a'));
    assert.equal(result.generation.mode, 'llm');
    assert.equal(result.generation.isFallback, false);
    assert.ok(llm.calls.length >= 6, 'Bo, Trí, Linh Chi, Minh Khang và Cô Lam đều phải được gọi model');
  });

  it('approves on the first round when the first proposal is already a natural misconception', async () => {
    const result = await runRoundtableForPart(part3(), { useLLM: true, llm: scriptedLLM(['2a']) });
    assert.equal(result.crossCheckRounds.length, 1);
    assert.equal(result.crossCheckRounds[0].verdict, 'approved');
    assert.equal(result.crossCheckCorrectionOccurred, false);
  });

  it('falls back to the canonical trap on the final round when every model proposal is rejected', async () => {
    const result = await runRoundtableForPart(part3(), { useLLM: true, llm: scriptedLLM(['a√2', 'AB', 'a√2']) });
    const rounds = result.crossCheckRounds;
    assert.equal(rounds.length, 3);
    assert.deepEqual(rounds.slice(0, 2).map(r => r.verdict), ['rejected', 'rejected']);
    assert.equal(rounds[2].verdict, 'approved');
    assert.equal(rounds[2].proposalSource, 'deterministic_fallback');
    assert.equal(result.generation.mode, 'mixed');
    assert.equal(result.generation.isFallback, true);
  });

  it('labels every turn as deterministic fallback when the model call fails', async () => {
    const llm = { chatJSON: async () => { throw new Error('provider down'); } };
    const result = await runRoundtableForPart(part3(), { useLLM: true, llm });
    assert.equal(result.generation.mode, 'deterministic_fallback');
    assert.equal(result.generation.fallbackReason, 'llm_call_failed');
    assert.ok(result.generation.turns.every(t => t.source === 'deterministic_fallback'));
    assert.equal(result.crossCheckRounds.at(-1).verdict, 'approved');
  });

  it('labels the run as fallback when useLLM is requested without a configured key', async () => {
    const savedKey = config.openaiApiKey;
    config.openaiApiKey = '';
    try {
      const result = await runRoundtableForPart(part3(), { useLLM: true });
      assert.equal(result.generation.requestedMode, 'llm');
      assert.equal(result.generation.mode, 'deterministic_fallback');
      assert.equal(result.generation.fallbackReason, 'llm_not_configured');
    } finally {
      config.openaiApiKey = savedKey;
    }
  });

  it('reports a plain deterministic run when the model was not requested', async () => {
    const result = await runRoundtableForPart(part3(), { useLLM: false });
    assert.equal(result.generation.mode, 'deterministic');
    assert.equal(result.generation.isFallback, false);
  });

  it('assessTrapProposal maps raw tool results to verdict codes', () => {
    const spec005 = { misconceptionId: 'MISC_VEC_005' };
    const kbSpec = { misconceptionId: 'MISC_VEC_001', kbGrounded: true };
    const kbHit = executeTool('tool_query_misconception_kb', { misconceptionId: 'MISC_VEC_001' });
    assert.equal(assessTrapProposal(kbSpec, 'cùng phương', kbHit).approved, true);
    const kbMiss = executeTool('tool_query_misconception_kb', { misconceptionId: 'MISC_VEC_999' });
    assert.equal(assessTrapProposal(kbSpec, 'cùng phương', kbMiss).code, 'unverifiable');
    assert.equal(assessTrapProposal({ ...spec005, naturalMisconception: () => false }, 'x', { isValid: null }).code, 'unverifiable');
    assert.equal(assessTrapProposal({ ...spec005, naturalMisconception: () => false }, 'x', { isValid: true }).code, 'claim_is_correct');
  });
});

describe('Parts and checkpoints stay inside the input duration and content', () => {
  function assertBounded(stream) {
    const duration = stream.durationSeconds;
    const parts = partitionTimelineIntoParts(stream);
    assert.ok(parts.length >= 1);
    for (const p of parts) {
      assert.ok(p.startSecond < p.endSecond, `Part ${p.partNumber} đảo ngược: ${p.startSecond}..${p.endSecond}`);
      assert.ok(p.startSecond >= 0 && p.endSecond <= duration, `Part ${p.partNumber} vượt thời lượng ${duration}s`);
      assert.ok(p.checkpointSecond >= p.startSecond && p.checkpointSecond < p.endSecond, `Checkpoint ${p.checkpointSecond}s ngoài Part`);
    }
    return parts;
  }

  it('turns the 65s clip into one 0..65 part paused on the vector-length segment', async () => {
    const parts = assertBounded(SHORT_STREAM_65S);
    assert.equal(parts.length, 1);
    assert.equal(parts[0].endSecond, 65);
    assert.equal(parts[0].misconceptionId, 'MISC_VEC_005');

    const draft = await runFullLessonRoundtable(SHORT_STREAM_65S, { useLLM: false, persist: false });
    assert.equal(draft.checkpoints.length, 1);
    assert.equal(draft.checkpoints[0].second, 37);
    assert.match(draft.checkpoints[0].questionText, /BC \+ DD'/);
    assert.equal(draft.checkpoints[0].options.find(o => o.isCorrect).label, 'a√2');
  });

  it('keeps a 20s clip checkpoint inside the clip', () => {
    const [part] = assertBounded({
      videoId: 'VID_TINY', durationSeconds: 20,
      segments: [{ id: 's1', second: 3, audioTranscript: "Tính |BC + DD'|", blackboardLatex: [], trapRiskLevel: 'high', pedagogicalTags: [] }],
    });
    assert.ok(part.checkpointSecond < 20);
  });

  it('drops empty parts of a medium-length video instead of inventing content', () => {
    const parts = assertBounded({
      videoId: 'VID_MEDIUM', durationSeconds: 600,
      segments: [
        { id: 'm1', second: 40, audioTranscript: 'Hai đường thẳng chéo nhau có cùng phương không?', blackboardLatex: [], trapRiskLevel: 'medium', pedagogicalTags: [] },
        { id: 'm2', second: 500, audioTranscript: "Tính độ dài |BC + DD'|", blackboardLatex: [], trapRiskLevel: 'high', pedagogicalTags: [] },
      ],
    });
    assert.deepEqual(parts.map(p => p.misconceptionId), ['MISC_VEC_001', 'MISC_VEC_005']);
  });

  it('keeps the long lecture parts and checkpoints within their own range', () => {
    const parts = assertBounded(LONG_FIXTURE);
    assert.deepEqual(parts.map(p => p.checkpointSecond), [282, 1813, 2233]);
  });

  it('ignores segments that lie beyond the declared duration', () => {
    const parts = assertBounded({
      videoId: 'VID_TRUNC', durationSeconds: 60,
      segments: [
        { id: 'in', second: 30, audioTranscript: "Tính |BC + DD'|", blackboardLatex: [], trapRiskLevel: 'medium', pedagogicalTags: [] },
        { id: 'out', second: 900, audioTranscript: 'Quy tắc hình hộp', blackboardLatex: [], trapRiskLevel: 'high', pedagogicalTags: [] },
      ],
    });
    assert.equal(parts[0].chosenSegment.id, 'in');
  });
});

describe('Draft storage is contained and aborts publish nothing', () => {
  it('rejects unsafe video ids before generation', async () => {
    for (const bad of ['x/../../../../package', '..', 'a\\b', 'abc def', '../drafts', 'id\u0000']) {
      assert.throws(() => assertSafeVideoId(bad), /Security Alert/);
      await assert.rejects(
        runFullLessonRoundtable({ ...SHORT_STREAM_65S, videoId: bad }, { useLLM: false }),
        /Security Alert/
      );
    }
    assert.equal(path.dirname(resolveDraftPath('VID_OK-1')), getDraftsDir());
  });

  it('returns null and writes no draft when aborted before generation', async () => {
    const videoId = `VID_ABORT_${Date.now()}`;
    const result = await runFullLessonRoundtable({ ...SHORT_STREAM_65S, videoId }, { useLLM: false, isAborted: () => true });
    assert.equal(result, null);
    assert.equal(fs.existsSync(resolveDraftPath(videoId)), false);
  });

  it('returns null and writes no draft when aborted mid-run', async () => {
    const videoId = `VID_ABORT_MID_${Date.now()}`;
    let seen = 0;
    const result = await runFullLessonRoundtable(
      { ...LONG_FIXTURE, videoId },
      { useLLM: false, onEvent: () => { seen++; }, isAborted: () => seen > 5 }
    );
    assert.equal(result, null);
    assert.equal(fs.existsSync(resolveDraftPath(videoId)), false);
  });
});

describe('Roundtable output follows DRELessonSchema as a teacher-reviewable draft', () => {
  let draft;
  before(async () => {
    draft = await runFullLessonRoundtable(LONG_FIXTURE, { useLLM: false, persist: false });
  });

  it('emits a draft lesson that is never marked approved by the producer', () => {
    const lesson = draft.lesson;
    assert.equal(lesson.status, 'draft');
    assert.equal(draft.approval.approvedByTeacher, false);
    assert.equal(lesson.video_duration_s, LONG_FIXTURE.durationSeconds);
    for (const key of ['lesson_id', 'version', 'title', 'subject', 'video_url']) assert.equal(typeof lesson[key], 'string', key);
    assert.ok(Array.isArray(lesson.sources) && lesson.sources.length === LONG_FIXTURE.segments.length);
  });

  it('maps every part to one checkpoint question and actor scenarios inside the part', () => {
    const sourceIds = new Set(draft.lesson.sources.map(s => s.source_id));
    for (const part of draft.lesson.parts) {
      assert.equal(part.pause_questions.length, 1);
      const q = part.pause_questions[0];
      assert.ok(q.at_s >= part.start_s && q.at_s <= part.end_s);
      assert.ok(q.correct_option_ids.length === 1);
      assert.ok(q.options.some(o => o.option_id === q.correct_option_ids[0] && o.is_correct));
      assert.ok(part.source_refs.every(ref => sourceIds.has(ref)));
      assert.ok(part.scenarios.some(sc => sc.actor_id === 'bo' && sc.interaction_type === 'bo_trap_bait' && sc.bo_fallacy_statement));
      for (const sc of part.scenarios) {
        assert.ok(sc.at_s >= part.start_s && sc.at_s <= part.end_s, `${sc.scenario_id} ngoài part`);
        if (sc.interaction_type === 'passive_comment') assert.equal(sc.pause_video, false);
      }
    }
  });
});
