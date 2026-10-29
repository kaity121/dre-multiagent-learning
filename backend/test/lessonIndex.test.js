import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listLessons, getLessonIndex, getBoardStateAt } from '../src/services/lessonIndex.js';

const VIDEO_ID = 'VID_VECTO_12_TIEN';

test('lists the pre-indexed Thầy Tiến lesson with its real duration', () => {
  const lesson = listLessons().find((l) => l.videoId === VIDEO_ID);
  assert.ok(lesson);
  assert.equal(lesson.durationSeconds, 9503);
  assert.ok(lesson.segmentCount > 0);
});

test('board at 37:13 shows Example 3 on the cube', () => {
  const state = getBoardStateAt(VIDEO_ID, 2233);
  assert.equal(state.segment.second, 2233);
  assert.equal(state.segment.spatialGeometry.shapeType, 'cube');
  assert.ok(state.segment.blackboardLatex.some((l) => l.includes("\\vec{DD'}")));
  assert.equal(state.segment.trapRiskLevel, 'high');
});

test('board between segments keeps the last segment shown', () => {
  const state = getBoardStateAt(VIDEO_ID, 2400);
  assert.equal(state.segment.second, 2233);
});

test('recent speech covers the window and always includes the active segment', () => {
  const state = getBoardStateAt(VIDEO_ID, 2240, 60);
  const seconds = state.recentSpeech.map((s) => s.second);
  assert.deepEqual(seconds, [2191, 2233]);

  const narrow = getBoardStateAt(VIDEO_ID, 2400, 30);
  assert.deepEqual(narrow.recentSpeech.map((s) => s.second), [2233]);
});

test('before the first segment and unknown lessons', () => {
  assert.equal(getBoardStateAt(VIDEO_ID, -1).segment, null);
  assert.equal(getBoardStateAt('NOPE', 10), null);
  assert.equal(getLessonIndex('NOPE'), null);
});

test('loads the full index fast enough to switch lessons instantly', async () => {
  const started = performance.now();
  const mod = await import(`../src/services/lessonIndex.js?fresh=${Date.now()}`);
  const elapsed = performance.now() - started;
  assert.ok(mod.getLessonIndex(VIDEO_ID).segments.length > 0);
  assert.ok(elapsed < 1000, `index load took ${elapsed.toFixed(0)}ms`);
});
