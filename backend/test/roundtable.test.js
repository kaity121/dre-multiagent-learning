/**
 * backend/test/roundtable.test.js
 *
 * Test suite cho Issue #302: A2A Scriptwriting Roundtable Orchestrator.
 * Kiểm tra các tiêu chí Definition of Done (DoD):
 * 1. Chạy trên fixture bài 58 phút -> ra lesson draft hợp lệ, >= 3 parts, có scenario của nhiều actor.
 * 2. Log chứng minh ít nhất 1 lần rà soát chéo bác bỏ và sửa đề xuất dựa trên kết quả tool (WOW moment).
 * 3. Có >= 1 lượt gọi RAG và >= 1 lượt gọi tool thật trong một lần chạy.
 * 4. Chạy được trên output clip ngắn (1 segment/part).
 * 5. Reasoning events đúng type chuẩn contract src/types/pipeline.ts.
 * 6. Thời gian chạy hợp lý cho demo (< 30s).
 */

import { describe, it } from 'node:test';
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
  resolveDraftPath,
  getDraftsDir,
} from '../src/services/roundtableOrchestrator.js';
import { executeTool } from '../src/tools/index.js';
import { config } from '../src/config.js';

// Generated drafts go to a temp directory so test runs never rewrite the committed drafts.
process.env.DRE_DRAFTS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dre-drafts-'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.join(__dirname, '../../mock/mock_cognitive_stream_vecto12.json');

describe('A2A Scriptwriting Roundtable Orchestrator - Unit Tests (#302)', () => {
  const cognitiveStream = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));

  it('1. Phân chia CognitiveEventStream thành >= 3 Parts bài giảng theo đúng tiến trình sư phạm', () => {
    const parts = partitionTimelineIntoParts(cognitiveStream);
    assert.ok(parts.length >= 3, 'Phải có ít nhất 3 parts');
    assert.strictEqual(parts[0].partNumber, 1);
    assert.strictEqual(parts[1].partNumber, 2);
    assert.strictEqual(parts[2].partNumber, 3);

    // Mốc vàng Ví dụ 3 (37:13) phải thuộc Part 3
    assert.ok(parts[2].chosenSegment.second === 2233);
  });

  it('2. Khoảnh khắc WOW: Trí kích hoạt Tool bác bỏ bẫy sai phi thực tế của Bo và Bo sửa lại thành công', async () => {
    const part3 = partitionTimelineIntoParts(cognitiveStream)[2];
    const result = await runRoundtableForPart(part3, { useLLM: false });

    // Kiểm tra cờ crossCheckCorrectionOccurred
    assert.strictEqual(
      result.crossCheckCorrectionOccurred,
      true,
      'Phải có sự kiện sửa sai sau rà soát chéo'
    );

    // Kiểm tra chuỗi suy luận có sự kiện cross_check_verdict
    const crossCheckEvents = result.reasoning_events.filter(
      e => e.eventType === 'cross_check_verdict'
    );
    assert.ok(crossCheckEvents.length >= 2, 'Phải có lượt bác bỏ và lượt đồng thuận');

    // Lượt 1: Bác bỏ bẫy vô lý AB
    const rejectionEvt = crossCheckEvents[0];
    assert.strictEqual(rejectionEvt.agentId, 'tri');
    assert.ok(
      rejectionEvt.content.includes('Bo nhầm to rồi') || rejectionEvt.content.includes('bác bỏ')
    );
    assert.strictEqual(rejectionEvt.toolCall?.isValid, false);

    // Lượt 2: Đồng thuận bẫy 2a tự nhiên
    const consensusEvt = crossCheckEvents[1];
    assert.ok(
      consensusEvt.content.includes('đồng ý') || consensusEvt.content.includes('tự nhiên')
    );
  });

  it('3. Đầy đủ các loại Reasoning Event theo đúng chuẩn contract pipeline.ts', async () => {
    const part1 = partitionTimelineIntoParts(cognitiveStream)[0];
    const result = await runRoundtableForPart(part1, { useLLM: false });

    const eventTypes = new Set(result.reasoning_events.map(e => e.eventType));
    assert.ok(eventTypes.has('thought'), 'Phải có thought event');
    assert.ok(eventTypes.has('tool_call'), 'Phải có tool_call event');
    assert.ok(eventTypes.has('tool_result'), 'Phải có tool_result event');
    assert.ok(eventTypes.has('debate_turn'), 'Phải có debate_turn event');
    assert.ok(eventTypes.has('cross_check_verdict'), 'Phải có cross_check_verdict event');
    assert.ok(eventTypes.has('checkpoint_created'), 'Phải có checkpoint_created event');

    // Kiểm tra các Agent tham gia thảo luận
    const agentIds = new Set(result.reasoning_events.map(e => e.agentId));
    assert.ok(agentIds.has('colam'), 'Cô Lam phải tham gia');
    assert.ok(agentIds.has('bo'), 'Bo phải tham gia');
    assert.ok(agentIds.has('tri'), 'Trí phải tham gia');
    assert.ok(agentIds.has('linhchi'), 'Linh Chi phải tham gia');
    assert.ok(agentIds.has('minhkhang'), 'Minh Khang phải tham gia');
  });

  it('4. Chạy toàn bộ bài giảng 58 phút sinh ra draft package hợp lệ, >= 3 parts và lưu file draft', async () => {
    const startTime = Date.now();
    const draft = await runFullLessonRoundtable(cognitiveStream, { useLLM: false });
    const elapsedMs = Date.now() - startTime;

    assert.strictEqual(draft.status, 'draft');
    assert.ok(draft.parts.length >= 3, 'Bài giảng phải có ít nhất 3 parts');
    assert.ok(draft.checkpoints.length >= 3, 'Phải có ít nhất 3 checkpoints');
    assert.ok(draft.timelineComments.length >= 6, 'Phải có timeline comments');
    assert.ok(draft.crossCheckLogs.length >= 1, 'Phải có log ghi nhận rà soát chéo');
    assert.ok(draft.allReasoningEvents.length >= 15, 'Phải có chuỗi sự kiện suy luận đầy đủ');

    // Kiểm tra luật sư phạm
    assert.ok(
      draft.checkpoints.every(c => c.options.length >= 3),
      'Mỗi checkpoint phải có các lựa chọn trắc nghiệm kèm feedback note'
    );
    assert.ok(
      draft.checkpoints.every(c => c.boInitialChallenge && c.boInitialChallenge.length > 0),
      'Phải có lời thách đố ban đầu của Bo'
    );

    // Kiểm tra thời gian thực thi cho demo (< 30s)
    assert.ok(elapsedMs < 30000, `Thời gian chạy phải < 30s (thực tế: ${elapsedMs}ms)`);

    // Kiểm tra file draft đã được ghi thành công trên đĩa
    const draftPath = resolveDraftPath(cognitiveStream.videoId);
    assert.strictEqual(path.dirname(draftPath), getDraftsDir());
    assert.ok(fs.existsSync(draftPath), 'File draft phải tồn tại trên đĩa');
    const savedContent = JSON.parse(fs.readFileSync(draftPath, 'utf-8'));
    assert.strictEqual(savedContent.lessonId, draft.lessonId);
  });

  it('5. Chạy được trên clip ngắn 60s (Single-segment cognitive stream)', async () => {
    const shortStream = {
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

    const draft = await runFullLessonRoundtable(shortStream, { useLLM: false });
    assert.strictEqual(draft.status, 'draft');
    assert.strictEqual(draft.durationSeconds, 65);
    assert.ok(draft.checkpoints.length >= 1);
  });

  it('6. Hỗ trợ tham số callback onEvent phát ra các AgentReasoningEvent theo đúng thời gian thực và thứ tự', async () => {
    const part3 = partitionTimelineIntoParts(cognitiveStream)[2];
    const emittedEvents = [];

    const result = await runRoundtableForPart(part3, {
      useLLM: false,
      onEvent: (evt) => {
        emittedEvents.push(evt);
      },
      streamDelayMs: 2,
    });

    assert.ok(emittedEvents.length >= 10, 'Callback onEvent phải nhận được đầy đủ events');
    assert.strictEqual(emittedEvents.length, result.reasoning_events.length);

    // Kiểm tra thứ tự xuất hiện các event types chính: thought -> tool_call -> tool_result -> debate_turn -> cross_check_verdict -> checkpoint_created
    const eventTypes = emittedEvents.map(e => e.eventType);
    assert.strictEqual(eventTypes[0], 'thought', 'Event đầu tiên phải là thought của Cô Lam');
    assert.ok(eventTypes.includes('tool_call'), 'Phải có tool_call');
    assert.ok(eventTypes.includes('tool_result'), 'Phải có tool_result');
    assert.ok(eventTypes.includes('debate_turn'), 'Phải có debate_turn');
    assert.ok(eventTypes.includes('cross_check_verdict'), 'Phải có cross_check_verdict');
    assert.strictEqual(eventTypes[eventTypes.length - 1], 'checkpoint_created', 'Event cuối cùng phải là checkpoint_created của Cô Lam');
  });

  it('7. Ràng buộc sư phạm Warmup: Không chèn checkpoint vào 15s - 30s đầu bài giảng hoặc phân đoạn', async () => {
    const earlyStream = {
      videoId: 'VID_EARLY_WARMUP',
      videoTitle: 'Test Warmup Barrier',
      teacherName: 'Thầy Tiến',
      subject: 'Toán 12',
      durationSeconds: 120,
      segments: [
        {
          id: 'seg_warmup_5',
          second: 5, // Quá sớm (< 15s/30s)
          timeFormatted: '00:05',
          audioTranscript: 'Chào các em...',
          speaker: 'Thầy Tiến',
          blackboardText: 'Mở đầu',
          blackboardLatex: [],
          trapRiskLevel: 'high',
          pedagogicalTags: ['warmup'],
        },
        {
          id: 'seg_valid_45',
          second: 45, // Hợp lệ (>= 30s)
          timeFormatted: '00:45',
          audioTranscript: 'Bắt đầu nội dung trọng tâm...',
          speaker: 'Thầy Tiến',
          blackboardText: 'Vectơ',
          blackboardLatex: ['|\\vec{BC}|'],
          trapRiskLevel: 'high',
          pedagogicalTags: ['valid_moment'],
        },
      ],
    };

    const parts = partitionTimelineIntoParts(earlyStream);
    assert.ok(parts[0].chosenSegment.second >= 30, 'Segment được chọn không được rơi vào 30s warmup');

    // Chạy part để xác thực checkpointSecond
    const partResult = await runRoundtableForPart(parts[0], { useLLM: false });
    assert.ok(partResult.checkpointSecond >= 30, `Checkpoint second (${partResult.checkpointSecond}) phải >= 30s`);
  });

  it('8. Kiểm tra endpoint SSE Stream trong server.js', async () => {
    process.env.NODE_ENV = 'test';
    const { app } = await import('../server.js');
    assert.ok(app, 'app Express phải được export từ server.js');
    // Kiểm tra các route SSE stream đã được đăng ký
    const routes = app._router.stack
      .filter(r => r.route)
      .map(r => ({ path: r.route.path, methods: Object.keys(r.route.methods) }));

    const streamGetRoute = routes.find(r => r.path === '/api/roundtable/stream' && r.methods.includes('get'));
    const streamPostRoute = routes.find(r => r.path === '/api/roundtable/stream' && r.methods.includes('post'));
    assert.ok(streamGetRoute, 'Phải có route GET /api/roundtable/stream');
    assert.ok(streamPostRoute, 'Phải có route POST /api/roundtable/stream');
  });
  it('9. Security Check: Ngăn chặn triệt để Path Traversal qua videoId', async () => {
    const maliciousStream = {
      videoId: 'x/../../../../package',
      durationSeconds: 60,
      segments: [{ second: 20, trapRiskLevel: 'high' }],
    };

    await assert.rejects(
      async () => {
        await runFullLessonRoundtable(maliciousStream, { useLLM: false });
      },
      (err) => {
        return err && err.message && err.message.includes('[Security Alert]');
      },
      'Hệ thống phải ném lỗi Security Alert khi videoId cố tình thoát khỏi thư mục drafts'
    );
  });

  it('10. Short clip bounds & Content matching: Clip 60s ra đúng 1 part, câu hỏi về độ dài Ex 3', async () => {
    const shortFixture = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mock/mock_short_clip_sample.json'), 'utf-8'));
    const parts = partitionTimelineIntoParts(shortFixture);

    assert.strictEqual(parts.length, 1, 'Clip 60s chỉ được chia đúng 1 Part duy nhất');
    assert.strictEqual(parts[0].startSecond, 0);
    assert.strictEqual(parts[0].endSecond, 60);
    assert.strictEqual(parts[0].misconceptionId, 'MISC_VEC_005', 'Clip Ví dụ 3 phải tự động map đúng MISC_VEC_005');

    const draftResult = await runFullLessonRoundtable(shortFixture, { useLLM: false });
    assert.strictEqual(draftResult.parts.length, 1);
    assert.ok(draftResult.checkpoints[0].second <= 60, 'Checkpoint phải nằm trong thời lượng 60s');
    assert.strictEqual(draftResult.checkpoints[0].options.find(o => o.isCorrect)?.label, 'a√2');
  });
});
