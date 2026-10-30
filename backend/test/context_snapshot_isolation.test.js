import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRuntimeContext,
  getMockSessionState,
  resolveLessonSubject,
} from '../src/services/contextSnapshot.js';
import { createSession, updateSession } from '../src/sessionStore.js';
import { dispatchMessage } from '../src/services/dispatcher.js';

const FIXTURE_SUMMARY_MARKER = 'Trạm 4 người học dạy lại Bo';
const VECTOR_TERMS = /vectơ|vecto|SGK Toán|hình lập phương|BC'|DD'/i;

describe('Context snapshot session isolation', () => {
  test('unknown session id gets an empty state instead of the session_001 fixture', () => {
    const state = getMockSessionState('session_never_created');
    assert.equal(state.session_id, 'session_never_created');
    assert.equal(state.memory.summary, '');
    assert.deepEqual(state.memory.misconceptions_triggered, []);

    const snapshot = buildRuntimeContext({ agentId: 'tri', second: 2233, sessionId: 'session_never_created' });
    assert.ok(!snapshot.metadata.memorySummary.includes(FIXTURE_SUMMARY_MARKER));
    assert.notEqual(snapshot.learnerCognitiveState.currentBloomLevel, 'Evaluate');
  });

  test('memory of one live session never appears in another session snapshot', () => {
    const a = createSession({ id: `iso_a_${Date.now()}` });
    const b = createSession({ id: `iso_b_${Date.now()}` });
    updateSession(a.id, { memory: { ...a.memory, summary: 'Bí mật riêng của phiên A' } });

    const snapA = buildRuntimeContext({ agentId: 'colam', second: 2233, sessionId: a.id });
    const snapB = buildRuntimeContext({ agentId: 'colam', second: 2233, sessionId: b.id });
    assert.equal(snapA.metadata.memorySummary, 'Bí mật riêng của phiên A');
    assert.ok(!JSON.stringify(snapB).includes('Bí mật riêng của phiên A'));
  });

  test('session_001 demo fixture is still served for the default demo session', () => {
    const snapshot = buildRuntimeContext({ agentId: 'tri', second: 2233 });
    assert.ok(snapshot.metadata.memorySummary.includes(FIXTURE_SUMMARY_MARKER));
  });
});

describe('Lesson subject resolution', () => {
  test('explicit videoId wins over a default math lesson title', () => {
    const r = resolveLessonSubject({ videoId: 'VID_AI_INTRO_01', lessonTitle: 'Toán 12 — Vectơ trong không gian' });
    assert.deepEqual(r, { videoId: 'VID_AI_INTRO_01', isMathLesson: false });
  });

  test('vector lesson and title-only fallbacks keep the math path', () => {
    assert.deepEqual(resolveLessonSubject({ videoId: 'VID_VECTO_12_TIEN' }), { videoId: 'VID_VECTO_12_TIEN', isMathLesson: true });
    assert.deepEqual(resolveLessonSubject({ lessonTitle: 'Toán 12 — Vectơ trong không gian' }), { videoId: 'VID_VECTO_12_TIEN', isMathLesson: true });
    assert.deepEqual(resolveLessonSubject({ lessonTitle: 'Trí tuệ nhân tạo: Nhập môn' }), { videoId: 'VID_AI_INTRO_01', isMathLesson: false });
  });
});

describe('Subject-agnostic snapshot content', () => {
  test('non-math lesson snapshot carries no vector-lesson citations, RAG or geometry', () => {
    for (const agentId of ['bo', 'tri', 'an', 'colam']) {
      const snapshot = buildRuntimeContext({ agentId, second: 120, sessionId: `ai_${agentId}_${Date.now()}`, videoId: 'VID_AI_INTRO_01' });
      assert.equal(snapshot.metadata.isMathLesson, false);
      assert.equal(snapshot.temporalContext.spatialGeometry, null);
      assert.equal(snapshot.learnerCognitiveState.activeMisconceptionId, null);
      assert.ok(!VECTOR_TERMS.test(JSON.stringify(snapshot.citations)), `citations leak vector content for ${agentId}`);
      assert.ok(!VECTOR_TERMS.test(JSON.stringify(snapshot.ragContextSnippets)), `RAG leaks vector content for ${agentId}`);
      assert.ok(snapshot.citations.every((c) => c.source === 'video'));
    }
  });

  test('vector lesson at 37:13 keeps SGK citation and cube geometry', () => {
    const snapshot = buildRuntimeContext({ agentId: 'tri', second: 2233 });
    assert.equal(snapshot.metadata.isMathLesson, true);
    assert.ok(snapshot.citations.some((c) => c.source === 'sgk'));
    assert.equal(snapshot.temporalContext.spatialGeometry.shapeType, 'cube');
  });

  test('second 0 is honoured instead of jumping to the 37:13 demo checkpoint', () => {
    const snapshot = buildRuntimeContext({ agentId: 'tri', second: 0 });
    assert.equal(snapshot.temporalContext.second, 0);
  });

  test('dispatcher response for a non-math lesson does not merge vector citations', async () => {
    const res = await dispatchMessage({
      message: 'Học có giám sát cần dữ liệu có nhãn ground truth đúng không?',
      currentTime: 120,
      videoId: 'VID_AI_INTRO_01',
      useLLM: false,
    });
    assert.ok(!VECTOR_TERMS.test(JSON.stringify(res.citations)));
    assert.ok(!VECTOR_TERMS.test(res.primaryResponse.text));
  });
});
