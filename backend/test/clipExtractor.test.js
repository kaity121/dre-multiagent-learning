import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import path from 'node:path';
import {
  extractClip,
  pickKeyframeSeconds,
  fuseTimeline,
  resolveClip,
  STAGES,
  CLIPS_DIR,
  buildVisionPrompt,
  boardRegion,
} from '../src/services/clipExtractor.js';

const CLIP = resolveClip('tien-vecto12-ex3-60s.mp4');
const skipNoClip = CLIP ? false : 'demo clip missing: run scripts/fetch-demo-clip.sh';

const flat = (v) => new Array(10).fill(v);

test('keyframes: first frame, then each time the board settles on new content', () => {
  // still board, teacher writes (moving pixels), board settles on new writing, stays still
  const regions = [flat(10), flat(10), flat(30), flat(60), flat(80), flat(80), flat(80)];
  assert.deepEqual(pickKeyframeSeconds(regions), [0, 5]);
  assert.deepEqual(pickKeyframeSeconds([]), []);
});

test('keyframes: capped at 4, keeping the first and the latest boards', () => {
  const regions = [];
  for (let level = 0; level < 8; level++) regions.push(flat(level * 20), flat(level * 20));
  const picked = pickKeyframeSeconds(regions);
  assert.equal(picked.length, 4);
  assert.equal(picked[0], 0);
  assert.equal(picked.at(-1), 15);
});

test('fusion assigns each transcript line to the keyframe window it starts in', () => {
  const segments = fuseTimeline({
    keyframeSeconds: [0, 34],
    boards: [{ blackboardText: 'VD3', trapRiskLevel: 'bogus' }, { blackboardLatex: ['|\\vec{BC}|'], trapRiskLevel: 'high' }],
    transcript: [
      { start: 1, end: 5, text: 'Ví dụ 3.' },
      { start: 30, end: 36, text: 'Một cộng một bằng hai là sai.' },
      { start: 40, end: 45, text: 'Dời DD phẩy về CC phẩy.' },
    ],
    speaker: 'Thầy Tiến',
  });
  assert.equal(segments[0].audioTranscript, 'Ví dụ 3. Một cộng một bằng hai là sai.');
  assert.equal(segments[1].audioTranscript, 'Dời DD phẩy về CC phẩy.');
  assert.equal(segments[0].trapRiskLevel, 'none', 'unknown risk levels are normalized');
  assert.equal(segments[1].timeFormatted, '00:34');
});

// Issue #28 Test: buildVisionPrompt is neutral and accepts subject hint
test('Issue #28: buildVisionPrompt is subject-neutral and injects subject hint when provided', () => {
  const defaultPrompt = buildVisionPrompt();
  assert.match(defaultPrompt, /bảng phấn hoặc slide trình chiếu/);
  assert.match(defaultPrompt, /không có công thức/i);
  assert.match(defaultPrompt, /diagramDescription/);

  const aiPrompt = buildVisionPrompt({ subject: 'Trí tuệ nhân tạo' });
  assert.match(aiPrompt, /Gợi ý môn học\/lĩnh vực bài giảng: "Trí tuệ nhân tạo"/);
  assert.match(aiPrompt, /KHÔNG PHẢI hình học không gian 3D/);
});

// Issue #28 Test: boardRegion supports configurable ROI (xFrom)
test('Issue #28: boardRegion supports full-width slides (xFrom=0.0) and custom ROI', () => {
  const dummyFrame = new Uint8Array(96 * 54).fill(128);
  const fullRegion = boardRegion(dummyFrame, 0.0);
  assert.equal(fullRegion.length, 96 * 54);

  const rightRegion = boardRegion(dummyFrame, 0.45);
  const expectedCols = 96 - Math.floor(96 * 0.45);
  assert.equal(rightRegion.length, expectedCols * 54);
});

// Issue #28 Test: Non-math slide clip extraction produces valid CognitiveEventStream
test('Issue #28: non-math slide clip produces valid CognitiveEventStream without forced LaTeX or geometry', async () => {
  const mockTranscript = [
    { start: 0, end: 15, text: 'Hôm nay chúng ta tìm hiểu về Học có giám sát (Supervised Learning).' },
    { start: 22, end: 40, text: 'Điểm mấu chốt là dữ liệu bắt buộc phải có ground truth nhãn đi kèm.' },
  ];

  const mockBoards = [
    {
      blackboardText: 'Chương 1: Supervised Learning\n- Input: (X, y)\n- Cần nhãn ground truth',
      blackboardLatex: [],
      spatialGeometry: null,
      diagramDescription: 'Sơ đồ luồng dữ liệu huấn luyện từ tập mẫu sang mô hình phân lớp',
      trapRiskLevel: 'none',
      pedagogicalTags: ['supervised_learning', 'data_labels'],
    },
    {
      blackboardText: 'Lưu ý: Không thể huấn luyện Supervised nếu thiếu nhãn nhãn y!',
      blackboardLatex: [],
      spatialGeometry: null,
      diagramDescription: null,
      trapRiskLevel: 'high',
      pedagogicalTags: ['misconception_unlabeled_data'],
    },
  ];

  const timeline = fuseTimeline({
    keyframeSeconds: [0, 20],
    boards: mockBoards,
    transcript: mockTranscript,
    speaker: 'TS. Hoàng Minh',
  });

  assert.equal(timeline.length, 2);
  assert.equal(timeline[0].audioTranscript, 'Hôm nay chúng ta tìm hiểu về Học có giám sát (Supervised Learning).');
  assert.equal(timeline[1].audioTranscript, 'Điểm mấu chốt là dữ liệu bắt buộc phải có ground truth nhãn đi kèm.');
  assert.equal(timeline[0].blackboardLatex.length, 0, 'No forced LaTeX in non-math slides');
  assert.equal(timeline[0].spatialGeometry, undefined, 'No forced 3D geometry');
  assert.equal(timeline[0].diagramDescription, 'Sơ đồ luồng dữ liệu huấn luyện từ tập mẫu sang mô hình phân lớp');
  assert.equal(timeline[1].trapRiskLevel, 'high');
  assert.equal(timeline[0].speaker, 'TS. Hoàng Minh');
});

// Pipeline control flow with injected media steps, so it runs without ffmpeg or the demo clip.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const workDirs = () => fs.readdirSync(CLIPS_DIR).filter((f) => f.startsWith('.work-'));
const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});
const fakeClip = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clip-extractor-'));
  tempDirs.push(dir);
  const file = path.join(dir, 'fake.mp4');
  fs.writeFileSync(file, crypto.randomBytes(64));
  return file;
};
const removeCacheFor = (file) => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
  fs.rmSync(path.join(CLIPS_DIR, '.cache', `${hash}.json`), { force: true });
};
// Still board, new writing appears at second 2 and has settled by second 3 -> keyframes [0, 3].
const twoBoards = () => [flat(10), flat(10), flat(80), flat(80)];
const fakeMedia = (overrides = {}) => ({
  extractAudio: async (_clip, outFile) => outFile,
  boardThumbnails: async () => twoBoards(),
  grabFrame: async () => Buffer.alloc(2000),
  probeDuration: async () => '60',
  ...overrides,
});

test('resolveClip only accepts regular supported clip files inside the clips folder', () => {
  const dirClip = path.join(CLIPS_DIR, 'zz-dir-test.mp4');
  fs.mkdirSync(dirClip, { recursive: true });
  try {
    for (const name of ['.', '..', '', '   ', 'tien-vecto12-ex3-60s.json', 'zz-dir-test.mp4', 'missing.mp4', 5, null, {}]) {
      assert.equal(resolveClip(name), null, `rejects ${JSON.stringify(name)}`);
    }
  } finally {
    fs.rmSync(dirClip, { recursive: true, force: true });
  }
});

test('injected media: a full run produces a live stream and cleans its work folder', async () => {
  const clip = fakeClip();
  const events = [];
  try {
    const stream = await extractClip(clip, {
      useCache: false,
      onStage: (e) => events.push(e),
      media: fakeMedia(),
      transcribe: async () => [{ start: 3, end: 4, text: 'board two' }],
      readBoard: async (_jpeg, _meta, { signal }) => {
        assert.ok(signal instanceof AbortSignal, 'board reads receive the cancellation signal');
        return { blackboardText: 'B' };
      },
    });
    assert.equal(stream.processedBy.mode, 'live');
    assert.deepEqual(stream.segments.map((s) => s.second), [0, 3]);
    assert.equal(stream.segments[1].audioTranscript, 'board two');
    assert.deepEqual(events.at(-1), { stage: 'fuse', status: 'done' });
    assert.deepEqual(workDirs(), []);
  } finally {
    removeCacheFor(clip);
  }
});

test('asymmetric failure: the surviving branch drains before cleanup and the terminal error', async () => {
  const clip = fakeClip();
  const events = [];
  let thumbnailsFinished = false;
  let workDirDuringSlowStep = null;
  let framesGrabbed = 0;
  const stream = await extractClip(clip, {
    useCache: false,
    onStage: (e) => events.push(e),
    transcribe: async () => {
      throw new Error('speech service down');
    },
    media: fakeMedia({
      // A step that cannot be interrupted keeps running after the other branch fails.
      boardThumbnails: async () => {
        await delay(60);
        workDirDuringSlowStep = workDirs().length;
        thumbnailsFinished = true;
        return twoBoards();
      },
      grabFrame: async () => {
        framesGrabbed++;
        return Buffer.alloc(2000);
      },
    }),
    readBoard: async () => ({}),
  });

  assert.equal(thumbnailsFinished, true, 'extractClip waits for the in-flight keyframe step');
  assert.ok(workDirDuringSlowStep >= 1, 'the work folder still exists while a branch is running');
  assert.deepEqual(workDirs(), [], 'the work folder is removed after every branch settled');
  assert.equal(framesGrabbed, 0, 'no new step starts after the run is cancelled');
  assert.ok(!events.some((e) => e.stage === 'board_ocr' || e.stage === 'fuse'));
  assert.deepEqual(events.at(-1), { stage: 'split_audio', status: 'error', detail: 'speech service down' });
  assert.equal(events.filter((e) => e.status === 'error').length, 1);
  assert.equal(stream.processedBy.mode, 'authored');
  assert.match(stream.processedBy.fallbackReason, /^split_audio: speech service down$/);
});

test('a failure aborts the other branch through its signal instead of waiting it out', async () => {
  const clip = fakeClip();
  let sawAbort = false;
  const started = Date.now();
  const stream = await extractClip(clip, {
    useCache: false,
    transcribe: async () => {
      await delay(10);
      throw new Error('stt quota');
    },
    media: fakeMedia({
      boardThumbnails: (_clip, _xFrom, { signal }) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(twoBoards()), 10_000);
          signal.addEventListener('abort', () => {
            sawAbort = true;
            clearTimeout(timer);
            reject(signal.reason);
          });
        }),
    }),
  });
  assert.equal(sawAbort, true);
  assert.ok(Date.now() - started < 2000, 'cancelled work does not hold the run');
  assert.match(stream.processedBy.fallbackReason, /^split_audio: stt quota$/, 'the original failure is reported');
  assert.deepEqual(workDirs(), []);
});

test('one failing keyframe read waits for the other reads and reports board_ocr', async () => {
  const clip = fakeClip();
  const events = [];
  let slowReadFinished = false;
  const stream = await extractClip(clip, {
    useCache: false,
    onStage: (e) => events.push(e),
    // Each fake frame carries its second so the reader can fail on the first keyframe only.
    media: fakeMedia({ grabFrame: async (_clip, second) => Buffer.from(String(second)) }),
    transcribe: async () => [],
    readBoard: async (jpeg) => {
      if (jpeg.toString() === '0') throw new Error('vision 500');
      await delay(40);
      slowReadFinished = true;
      return {};
    },
  });
  assert.equal(slowReadFinished, true);
  assert.deepEqual(events.at(-1), { stage: 'board_ocr', status: 'error', detail: 'vision 500' });
  assert.ok(!events.some((e) => e.stage === 'fuse'));
  assert.match(stream.processedBy.fallbackReason, /^board_ocr: vision 500$/);
  assert.deepEqual(workDirs(), []);
});

test('keyframe ROI: explicit numeric roi wins, otherwise math boards skip the teacher side', async () => {
  const clip = fakeClip();
  const seen = [];
  const media = fakeMedia({
    boardThumbnails: async (_clip, xFrom) => {
      seen.push(xFrom);
      throw new Error('stop after ROI');
    },
  });
  for (const meta of [
    { roi: { xFrom: 0.2 } },
    { roi: { xFrom: 'wide' }, subject: 'Toán 12' },
    { subject: 'Trí tuệ nhân tạo' },
    { subject: 42 },
  ]) {
    await extractClip(clip, { useCache: false, meta, media, transcribe: async () => [] });
  }
  assert.deepEqual(seen, [0.2, 0.45, 0, 0]);
});

test('setup failures (unreadable clip) fall back instead of rejecting', async () => {
  const events = [];
  const stream = await extractClip(CLIPS_DIR, { useCache: false, onStage: (e) => events.push(e), media: fakeMedia() });
  assert.equal(stream.processedBy.mode, 'authored');
  assert.equal(events.length, 1);
  assert.equal(events[0].status, 'error');
  assert.deepEqual(workDirs(), []);
});

test('live run on the demo clip produces a CognitiveEventStream with named stages', { skip: skipNoClip }, async () => {
  const events = [];
  let boardsRead = 0;
  const stream = await extractClip(CLIP, {
    useCache: false,
    // Same blackboard ROI as the clip's sidecar; full-frame detection would include the teacher moving.
    meta: {
      videoId: 'CLIP_TEST',
      roi: { xFrom: 0.45 },
      sourceClip: { parentVideoId: 'VID_VECTO_12_TIEN', startSecond: 2204, endSecond: 2264 },
    },
    onStage: (e) => events.push(e),
    transcribe: async () => [
      { start: 2, end: 8, text: 'Ví dụ 3 cho hình lập phương.' },
      { start: 29, end: 33, text: 'Không được lấy một cộng một bằng hai.' },
    ],
    readBoard: async (jpeg) => {
      boardsRead++;
      assert.ok(jpeg.length > 1000, 'keyframe is a real jpeg');
      return { blackboardText: 'VD3', blackboardLatex: ["|\\vec{BC} + \\vec{DD'}|"], trapRiskLevel: 'high', spatialGeometry: { shapeType: 'cube', vertices: ['A'], highlightedVectors: ['BC'], actionDescription: 'x' } };
    },
  });

  assert.equal(stream.processedBy.mode, 'live');
  assert.equal(stream.durationSeconds, 60);
  assert.equal(stream.sourceClip.startSecond, 2204);
  assert.equal(stream.segments[0].second, 0);
  assert.ok(stream.segments.length >= 2, 'the board change while writing the trap yields a second keyframe');
  assert.equal(boardsRead, stream.segments.length);
  assert.equal(stream.segments[0].spatialGeometry.shapeType, 'cube');
  // Speech and board branches run concurrently, so only fuse has a fixed position (last).
  const done = events.filter((e) => e.status === 'done').map((e) => e.stage);
  assert.deepEqual([...done].sort(), STAGES.map((s) => s.id).sort());
  assert.equal(done.at(-1), 'fuse');
  assert.ok(done.indexOf('keyframes') < done.indexOf('board_ocr'));
});

test('failures fall back to the authored fixture and report the failing stage', { skip: skipNoClip }, async () => {
  const events = [];
  const stream = await extractClip(CLIP, {
    useCache: false,
    onStage: (e) => events.push(e),
    transcribe: async () => {
      throw new Error('OPENAI_API_KEY is not set');
    },
  });
  assert.equal(stream.processedBy.mode, 'authored');
  assert.match(stream.processedBy.fallbackReason, /split_audio: OPENAI_API_KEY is not set/);
  assert.ok(stream.segments.length > 0);
  assert.deepEqual(events.find((e) => e.status === 'error'), {
    stage: 'split_audio',
    status: 'error',
    detail: 'OPENAI_API_KEY is not set',
  });
  assert.ok(!events.some((e) => e.stage === 'fuse'), 'nothing is fused after a failure');
  assert.equal(fs.readdirSync(CLIPS_DIR).filter((f) => f.startsWith('.work-')).length, 0, 'temp files cleaned up');
});

test('a successful run is cached and replayed instantly', { skip: skipNoClip }, async () => {
  const cacheDir = path.join(CLIPS_DIR, '.cache');
  fs.rmSync(cacheDir, { recursive: true, force: true });
  let calls = 0;
  const options = {
    transcribe: async () => (calls++, []),
    readBoard: async () => ({}),
  };
  await extractClip(CLIP, options);
  const started = Date.now();
  const again = await extractClip(CLIP, options);
  assert.equal(calls, 1);
  assert.equal(again.processedBy.mode, 'live');
  assert.ok(Date.now() - started < 1000);
  fs.rmSync(cacheDir, { recursive: true, force: true });
});
