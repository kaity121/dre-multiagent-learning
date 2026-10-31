import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import express from 'express';
import { sanitizeClipName, hasVideoSignature, saveUploadedClip, UploadError } from '../src/services/clipUpload.js';
import { extractRouter } from '../src/routes/extract.js';
import { CLIPS_DIR } from '../src/services/clipExtractor.js';

// Smallest byte strings that pass the container signature check.
const MP4_HEADER = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(32)]);
const WEBM_HEADER = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(32)]);

const tempDirs = [];
const tempDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clip-upload-'));
  tempDirs.push(dir);
  return dir;
};
const upload = (dir, rawName, bytes, extra = {}) =>
  saveUploadedClip(Readable.from([bytes]), { rawName, contentType: 'video/mp4', dir, ...extra });
const rejectsWith = (promise, status) =>
  assert.rejects(promise, (err) => err instanceof UploadError && err.status === status);

test('sanitizeClipName folds Vietnamese and keeps only safe characters', () => {
  assert.equal(sanitizeClipName('Bài giảng Vectơ 12 (đề 3).mp4'), 'bai-giang-vecto-12-de-3.mp4');
  assert.equal(sanitizeClipName('  LESSON.MOV '), 'lesson.mov');
  assert.equal(sanitizeClipName('a..b.webm'), 'a-b.webm');
  assert.equal(sanitizeClipName(`${'x'.repeat(200)}.mp4`).length, 80 + '.mp4'.length);
});

test('sanitizeClipName rejects traversal, missing names and unsupported types', () => {
  for (const name of ['../../server.mp4', '..\\evil.mp4', 'a/b.mp4', 'C:\\x\\y.mp4', 'nul\u0000.mp4']) {
    assert.throws(() => sanitizeClipName(name), (e) => e.status === 400, JSON.stringify(name));
  }
  for (const name of ['', '   ', undefined, null, 5, ['a.mp4'], '---.mp4', `${'a'.repeat(300)}.mp4`]) {
    assert.throws(() => sanitizeClipName(name), (e) => e.status === 400, JSON.stringify(name));
  }
  for (const name of ['clip.json', 'clip.mp4.exe', 'clip', 'clip.mkv', 'clip.part', '.mp4']) {
    assert.throws(() => sanitizeClipName(name), (e) => e.status === 415, name);
  }
});

test('hasVideoSignature checks the container the extension promises', () => {
  assert.equal(hasVideoSignature(MP4_HEADER, '.mp4'), true);
  assert.equal(hasVideoSignature(MP4_HEADER, '.mov'), true);
  assert.equal(hasVideoSignature(WEBM_HEADER, '.webm'), true);
  assert.equal(hasVideoSignature(WEBM_HEADER, '.mp4'), false);
  assert.equal(hasVideoSignature(Buffer.from('<html>hello</html>'), '.mp4'), false);
  assert.equal(hasVideoSignature(Buffer.alloc(3), '.mp4'), false);
});

test('an upload is saved under its sanitized name with a title sidecar', async () => {
  const dir = tempDir();
  const saved = await upload(dir, 'Bài 1.mp4', MP4_HEADER);
  assert.deepEqual(saved, { clip: 'bai-1.mp4', title: 'Bài 1', sizeBytes: MP4_HEADER.length });
  assert.deepEqual(fs.readFileSync(path.join(dir, 'bai-1.mp4')), MP4_HEADER);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'bai-1.json'), 'utf8')).videoTitle, 'Bài 1');
  assert.deepEqual(fs.readdirSync(dir).filter((f) => f.endsWith('.part')), [], 'temp file removed');
});

test('a second upload with the same name never replaces the first', async () => {
  const dir = tempDir();
  const first = await upload(dir, 'lesson.mp4', MP4_HEADER);
  const other = Buffer.concat([MP4_HEADER, Buffer.from('second')]);
  const second = await upload(dir, 'lesson.mp4', other);
  // A stem used by another container or a leftover sidecar is taken too.
  fs.writeFileSync(path.join(dir, 'lesson-3.json'), '{}');
  const third = await upload(dir, 'Lesson.webm', WEBM_HEADER, { contentType: 'video/webm' });
  assert.equal(first.clip, 'lesson.mp4');
  assert.equal(second.clip, 'lesson-2.mp4');
  assert.equal(third.clip, 'lesson-4.webm');
  assert.deepEqual(fs.readFileSync(path.join(dir, 'lesson.mp4')), MP4_HEADER);
});

test('uploads over the cap, empty, or not really video are rejected and leave nothing behind', async () => {
  const dir = tempDir();
  await rejectsWith(upload(dir, 'big.mp4', Buffer.concat([MP4_HEADER, Buffer.alloc(100)]), { maxBytes: 64 }), 413);
  await rejectsWith(upload(dir, 'big.mp4', MP4_HEADER, { contentLength: String(10 * 1024 ** 3) }), 413);
  await rejectsWith(upload(dir, 'empty.mp4', Buffer.alloc(0)), 400);
  await rejectsWith(upload(dir, 'fake.mp4', Buffer.from('<html>not a video</html>')), 415);
  await rejectsWith(upload(dir, 'clip.mp4', MP4_HEADER, { contentType: 'text/html' }), 415);
  assert.deepEqual(fs.readdirSync(dir), []);
});

// Route level: the upload lands in the real clips folder, so every name used here is removed after.
const ROUTE_STEM = 'zz-upload-route-test';
let server;
let base;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/extract', extractRouter);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/extract`;
});

after(async () => {
  for (const f of fs.readdirSync(CLIPS_DIR)) if (f.startsWith(ROUTE_STEM)) fs.rmSync(path.join(CLIPS_DIR, f), { force: true });
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
  await new Promise((resolve) => server.close(resolve));
});

const postUpload = (name, body, contentType = 'video/mp4') =>
  fetch(`${base}/upload?name=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'Content-Type': contentType }, body });

test('POST /upload saves a clip that the clip list then shows', async () => {
  const res = await postUpload(`${ROUTE_STEM}.mp4`, MP4_HEADER);
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.clip, `${ROUTE_STEM}.mp4`);
  assert.equal(body.item.sizeBytes, MP4_HEADER.length);

  const list = await (await fetch(`${base}/clips`)).json();
  const item = list.items.find((i) => i.name === `${ROUTE_STEM}.mp4`);
  assert.ok(item, 'uploaded clip is listed');
  assert.equal(item.title, ROUTE_STEM);
  assert.equal(typeof list.maxUploadBytes, 'number');
});

test('POST /upload answers bad names and types with a JSON error status', async () => {
  for (const [name, type, status] of [
    ['../../server.mp4', 'video/mp4', 400],
    [`${ROUTE_STEM}.exe`, 'video/mp4', 415],
    [`${ROUTE_STEM}-html.mp4`, 'text/html', 415],
  ]) {
    const res = await postUpload(name, MP4_HEADER, type);
    assert.equal(res.status, status, name);
    assert.equal((await res.json()).ok, false);
  }
  const noName = await fetch(`${base}/upload`, { method: 'POST', headers: { 'Content-Type': 'video/mp4' }, body: MP4_HEADER });
  assert.equal(noName.status, 400);
  assert.equal(fs.existsSync(path.resolve(CLIPS_DIR, '../../server.mp4')), false);
});
