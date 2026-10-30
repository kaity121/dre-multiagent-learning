import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

// A side of an equation is a vector when a \vec term survives after removing every |...| norm.
function sideKind(side) {
  let bare = side.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|').replace(/\\quad.*$/, '');
  bare = bare.replace(/\|[^|]*\|/g, ' NORM ');
  return /\\vec\{/.test(bare) ? 'vector' : 'scalar';
}

function mixedEqualities(stream) {
  const mixed = [];
  for (const segment of stream.segments) {
    for (const formula of segment.blackboardLatex) {
      const kinds = new Set(formula.split('=').map(sideKind));
      if (kinds.size > 1) mixed.push(`${segment.second}: ${formula}`);
    }
  }
  return mixed;
}

test('equation sides classify vectors apart from norms and numbers', () => {
  assert.equal(sideKind("\\vec{BC} + \\vec{CC'}"), 'vector');
  assert.equal(sideKind("|\\vec{BC'}|"), 'scalar');
  assert.equal(sideKind("\\left|\\vec{BC}\\right|+\\left|\\vec{DD'}\\right|"), 'scalar');
  assert.equal(sideKind('\\sqrt{2}'), 'scalar');
  // The previously indexed board formula equated vector BC' with the number sqrt(2).
  assert.equal(mixedEqualities({ segments: [{ second: 0, blackboardLatex: ["\\vec{BC'} = \\sqrt{2}"] }] }).length, 1);
});

test('no indexed board formula equates a vector with a scalar', () => {
  const stream = getLessonIndex(VIDEO_ID);
  assert.deepEqual(mixedEqualities(stream), []);
  for (const fixture of ['mock_cognitive_stream_vecto12.json', 'mock_short_clip_sample.json']) {
    const authored = JSON.parse(fs.readFileSync(new URL(`../../mock/${fixture}`, import.meta.url), 'utf8'));
    assert.deepEqual(mixedEqualities(authored), [], fixture);
  }
});

test('Example 3 keeps the vector sum and its length as separate equalities', () => {
  const latex = getBoardStateAt(VIDEO_ID, 2233).segment.blackboardLatex;
  const vectorSum = latex.find((l) => l.startsWith("\\vec{BC} + \\vec{DD'} ="));
  const length = latex.find((l) => l.startsWith("|\\vec{BC} + \\vec{DD'}| ="));
  assert.ok(vectorSum, 'vector equality present');
  assert.ok(length, 'norm equality present');
  assert.equal(vectorSum.split('=').at(-1).trim(), "\\vec{BC'}", 'the sum is the face diagonal vector');
  assert.ok(!vectorSum.includes('\\sqrt'), 'the vector equality carries no length');
  assert.ok(length.includes("|\\vec{BC'}|"), 'the length is taken of the diagonal vector');
  assert.equal(length.split('=').at(-1).trim(), '\\sqrt{2}', 'unit cube face diagonal has length sqrt(2)');
  // The deliberate wrong example stays labelled as wrong.
  const wrong = latex.find((l) => l.endsWith('= 2 \\quad (\\text{SAI})'));
  assert.ok(wrong, 'the 1 + 1 = 2 fallacy is marked SAI');
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
