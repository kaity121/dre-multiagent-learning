import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readThought, clipThought } from '../src/agents/thoughtField.js';
import {
  dispatchMessage,
  generatePeerChime,
  primaryFallbackThought,
  followUpFallbackThought,
} from '../src/services/dispatcher.js';
import { app } from '../server.js';

test('readThought keeps a short one-line summary and rejects missing or non-string values', () => {
  assert.equal(readThought({ suy_nghi: '  Tớ thấy cậu\n nhầm   hướng.  ' }), 'Tớ thấy cậu nhầm hướng.');
  assert.equal(readThought({ suy_nghi: '' }), null);
  assert.equal(readThought({ suy_nghi: 42 }), null);
  assert.equal(readThought(null), null);
  const long = readThought({ suy_nghi: 'a'.repeat(500) });
  assert.ok(long.length <= 240);
  assert.ok(long.endsWith('…'));
  assert.equal(clipThought(undefined), null);
});

test('without the LLM the primary answer carries a thought derived from the dispatcher reason', async () => {
  const result = await dispatchMessage({
    message: 'Tại sao vectơ AB khác vectơ BA?',
    currentTime: 400,
    useLLM: false,
    sessionId: `thought_primary_${Date.now()}`,
  });
  const thought = result.primaryResponse.thought;
  assert.equal(typeof thought, 'string');
  assert.ok(thought.length > 0);
  assert.equal(thought, primaryFallbackThought(result.verdict));
  if (result.followUpResponse) {
    assert.equal(typeof result.followUpResponse.thought, 'string');
    assert.ok(result.followUpResponse.thought.length > 0);
  }
});

test('fallback thoughts never come back empty', () => {
  assert.ok(primaryFallbackThought({}).length > 0);
  assert.ok(primaryFallbackThought(null).length > 0);
  assert.match(followUpFallbackThought({ author: 'Bo' }), /Bo/);
  assert.ok(followUpFallbackThought(null).length > 0);
});

test('a peer chime without the LLM still explains why the classmate stepped in', async () => {
  const chime = await generatePeerChime({
    chimeAgent: 'linhchi',
    primaryResponse: { author: 'Trí', avatarId: 'tri', text: 'Vectơ có hướng nên AB khác BA.' },
    message: 'Vì sao?',
    conversationContext: null,
    mathProblem: 'Vectơ',
    lessonTitle: 'Toán 12 — Vectơ trong không gian',
    currentTime: 400,
    useLLM: false,
  });
  assert.equal(typeof chime.thought, 'string');
  assert.match(chime.thought, /Trí/);
});

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('/api/chat/classroom returns the primary thought alongside the answer', async () => {
  const res = await fetch(`${base}/api/chat/classroom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Tại sao vectơ AB khác vectơ BA?',
      currentTime: 400,
      useLLM: false,
      sessionId: `thought_route_${Date.now()}`,
    }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(typeof body.thought, 'string');
  assert.ok(body.thought.length > 0);
  if (body.followUpResponse) assert.equal(typeof body.followUpResponse.thought, 'string');
});
