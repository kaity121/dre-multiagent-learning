import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { extractRouter } from '../src/routes/extract.js';
import { CLIPS_DIR } from '../src/services/clipExtractor.js';

// A clip whose sidecar metadata is corrupt makes the handler throw after validation.
const BROKEN_CLIP = 'zz-route-test-broken.mp4';
const brokenClipPath = path.join(CLIPS_DIR, BROKEN_CLIP);
const brokenSidecarPath = brokenClipPath.replace(/\.mp4$/, '.json');

let server;
let base;

before(async () => {
  fs.mkdirSync(CLIPS_DIR, { recursive: true });
  fs.writeFileSync(brokenClipPath, 'not a real video');
  fs.writeFileSync(brokenSidecarPath, '{ not json');
  const app = express();
  app.use(express.json());
  app.use('/api/extract', extractRouter);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/extract`;
});

after(async () => {
  fs.rmSync(brokenClipPath, { force: true });
  fs.rmSync(brokenSidecarPath, { force: true });
  await new Promise((resolve) => server.close(resolve));
});

const postClip = (body) =>
  fetch(`${base}/clip`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function assertServerAlive() {
  const res = await fetch(`${base}/clips`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
}

test('a directory name is rejected with 404 and the server keeps serving', async () => {
  for (const clip of ['.', '..', '.cache']) {
    const res = await postClip({ clip });
    assert.equal(res.status, 404, clip);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.ok(Array.isArray(body.clips));
  }
  await assertServerAlive();
});

test('a missing or non-string clip field is a 400', async () => {
  for (const body of [{}, { clip: 5 }, { clip: ['a.mp4'] }, { clip: '  ' }]) {
    const res = await postClip(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal((await res.json()).ok, false);
  }
  await assertServerAlive();
});

test('a handler failure becomes a controlled 500 instead of an unhandled rejection', async () => {
  const res = await postClip({ clip: BROKEN_CLIP });
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.match(body.error, /metadata/i);
  await assertServerAlive();
});

test('the SSE route validates before opening the event stream', async () => {
  const missing = await fetch(`${base}/clip/nope.mp4/stream`);
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('content-type'), /application\/json/);

  const broken = await fetch(`${base}/clip/${BROKEN_CLIP}/stream`);
  assert.equal(broken.status, 500);
  assert.match(broken.headers.get('content-type'), /application\/json/);
  await assertServerAlive();
});
