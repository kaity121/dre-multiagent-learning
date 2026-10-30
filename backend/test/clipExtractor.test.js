import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('live run on the demo clip produces a CognitiveEventStream with named stages', { skip: skipNoClip }, async () => {
  const events = [];
  let boardsRead = 0;
  const stream = await extractClip(CLIP, {
    useCache: false,
    meta: { videoId: 'CLIP_TEST', sourceClip: { parentVideoId: 'VID_VECTO_12_TIEN', startSecond: 2204, endSecond: 2264 } },
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
