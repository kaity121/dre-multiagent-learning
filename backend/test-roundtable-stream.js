/**
 * backend/test-roundtable-stream.js
 *
 * Automated Test Runner & Verifier for Roundtable Orchestrator & SSE Streaming (#302)
 * Agent 2 (Tester & Verifier) - DRE Multi-Agent Learning System
 *
 * Tests:
 * 1. Roundtable per Part (Part 1, Part 2, Part 3) with streaming callback and SSE HTTP endpoint
 * 2. Cross-Check WOW Moment verification (Trí tool rejects Bo's flawed proposal, Bo corrects)
 * 3. AgentReasoningEvent lifecycle and contract compliance (thought -> tool_call -> tool_result -> debate_turn -> cross_check_verdict -> checkpoint_created)
 * 4. Pedagogical invariants verification (max 1 checkpoint/part, warmup protection, Bloom level >= Apply/Analyze, Socratic hints)
 * 5. Benchmark execution time & performance (< 30-60s for demo readiness)
 */

process.env.NODE_ENV = 'test';

import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// Generated drafts go to a temp directory so verification runs never rewrite the committed drafts.
process.env.DRE_DRAFTS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dre-drafts-'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.join(__dirname, '../mock/mock_cognitive_stream_vecto12.json');

import {
  runRoundtableForPart,
  runFullLessonRoundtable,
  partitionTimelineIntoParts,
} from './src/services/roundtableOrchestrator.js';
import { app } from './server.js';

let passedChecks = 0;
let totalChecks = 0;
const failures = [];

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failures.push(message);
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function runSSEClientTest(port, pathAndQuery, options = {}) {
  return new Promise((resolve, reject) => {
    const events = [];
    const rawChunks = [];
    const method = options.method || 'GET';
    const payload = options.body
      ? typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
      : null;

    const headers = {
      Accept: 'text/event-stream',
      ...(options.headers || {}),
    };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: pathAndQuery,
        method,
        headers,
      },
      (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
          const str = chunk.toString('utf-8');
          rawChunks.push(str);
          buffer += str;

          const lines = buffer.split('\n\n');
          buffer = lines.pop(); // giữ lại phần dư chưa kết thúc khối

          for (const block of lines) {
            const blockLines = block.split('\n');
            let currentEvent = 'message';
            let currentData = '';

            for (const line of blockLines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                currentData = line.replace('data: ', '').trim();
              }
            }

            if (currentData) {
              try {
                const parsed = JSON.parse(currentData);
                events.push({ eventName: currentEvent, data: parsed });
              } catch (_) {
                events.push({ eventName: currentEvent, raw: currentData });
              }
            }
          }
        });

        res.on('end', () => {
          if (buffer && buffer.trim()) {
            const blockLines = buffer.split('\n');
            let currentEvent = 'message';
            let currentData = '';
            for (const line of blockLines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                currentData = line.replace('data: ', '').trim();
              }
            }
            if (currentData) {
              try {
                events.push({ eventName: currentEvent, data: JSON.parse(currentData) });
              } catch (_) {
                events.push({ eventName: currentEvent, raw: currentData });
              }
            }
          }
          resolve({ statusCode: res.statusCode, events, rawChunks });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(options.timeoutMs || 10000, () => {
      req.destroy(new Error(`SSE request timeout for ${pathAndQuery}`));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function httpGetJSON(port, pathAndQuery) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: pathAndQuery,
        headers: { Accept: 'application/json' },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (_) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error(`HTTP GET timeout for ${pathAndQuery}`)));
  });
}

async function main() {
  console.log('================================================================');
  console.log('🧪 DRE MULTI-AGENT ROUNDTABLE ORCHESTRATOR VERIFICATION SUITE');
  console.log('================================================================\n');

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const serverPort = testServer.address().port;
  console.log(`  ℹ️ Test server lắng nghe tại ephemeral port: ${serverPort}\n`);

  try {
    const cognitiveStream = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));
    const parts = partitionTimelineIntoParts(cognitiveStream);

    // ---------------------------------------------------------------------------
    // TEST 1: ROUNDTABLE PER PART WITH CALLBACK STREAMING & SSE
    // ---------------------------------------------------------------------------
    console.log('▶ [TEST 1] Roundtable theo từng Part (Part 1, 2, 3) & Streaming Callback / SSE');

    // 1.1 Kiểm tra callback streaming cục bộ cho Part 1, 2, 3
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const streamedEvents = [];
      const partResult = await runRoundtableForPart(part, {
        useLLM: false,
        onEvent: (evt) => streamedEvents.push(evt),
      });

      assert(
        partResult.partNumber === part.partNumber,
        `Part ${part.partNumber} (${part.title}) chạy thành công`
      );
      assert(
        streamedEvents.length >= 7,
        `Part ${part.partNumber} phát ra ${streamedEvents.length} events qua onEvent callback (kỳ vọng >= 7)`
      );
      assert(
        streamedEvents.length === partResult.reasoning_events.length,
        `Số lượng stream callback (${streamedEvents.length}) khớp chính xác số events trong draft (${partResult.reasoning_events.length})`
      );
    }

    // 1.2 Kiểm tra SSE HTTP Endpoint thực tế (/api/roundtable/stream)
    const ssePart3 = await runSSEClientTest(
      serverPort,
      '/api/roundtable/stream?partNumber=3&streamDelayMs=0'
    );
    const eventNames = ssePart3.events.map((e) => e.eventName);
    assert(
      eventNames.includes('session_start'),
      'SSE stream phát sự kiện [session_start]'
    );
    assert(
      eventNames.includes('reasoning_event'),
      'SSE stream phát sự kiện [reasoning_event]'
    );
    assert(
      eventNames.includes('complete'),
      'SSE stream kết thúc với sự kiện [complete]'
    );

    const completeEvent = ssePart3.events.find((e) => e.eventName === 'complete');
    assert(
      completeEvent && completeEvent.data?.part?.partNumber === 3,
      'Dữ liệu [complete] chứa partResult hợp lệ của Part 3'
    );

  // ---------------------------------------------------------------------------
  // TEST 2: KIỂM CHỨNG KHOẢNH KHẮC CROSS-CHECK WOW
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 2] Kiểm chứng khoảnh khắc Cross-Check WOW (Trí bác bỏ bẫy sai phi thực tế của Bo -> Bo sửa đạt chuẩn)');

  const part3 = parts[2]; // Part 3 trọng tâm Ví dụ 3 (37:13)
  const part3Result = await runRoundtableForPart(part3, { useLLM: false });

  assert(
    part3Result.crossCheckCorrectionOccurred === true,
    'Cờ crossCheckCorrectionOccurred phải bật true'
  );

  const crossCheckEvents = part3Result.reasoning_events.filter(
    (e) => e.eventType === 'cross_check_verdict'
  );
  assert(
    crossCheckEvents.length >= 2,
    `Part 3 phát ra ${crossCheckEvents.length} lượt phán xét rà soát chéo (Lượt 1: Bác bỏ, Lượt 2: Đồng thuận)`
  );

  // Lượt 1: Trí bác bỏ claim sai "AB" dựa trên tool_verify_vector_algebra (isValid: false)
  const verdict1 = crossCheckEvents[0];
  assert(
    verdict1.agentId === 'tri',
    'Lượt 1 phán xét do Trí (Hệ 2 - Logic) đưa ra'
  );
  assert(
    verdict1.toolCall && verdict1.toolCall.isValid === false,
    `Tool kiểm chứng lượt 1 trả về isValid: false (thực tế claim="${verdict1.toolCall?.input?.claim}")`
  );
  assert(
    verdict1.content.toLowerCase().includes('nhầm') ||
    verdict1.content.toLowerCase().includes('bác bỏ') ||
    verdict1.content.toLowerCase().includes('không có thật'),
    `Nội dung Trí bác bỏ rõ ràng: "${verdict1.content.slice(0, 80)}..."`
  );

  // Lượt 2: Bo tiếp thu, sửa thành bẫy nhận thức tự nhiên 2a, Trí đồng thuận
  const verdict2 = crossCheckEvents[1];
  assert(
    verdict2.content.toLowerCase().includes('tự nhiên') ||
    verdict2.content.toLowerCase().includes('đồng ý') ||
    verdict2.content.toLowerCase().includes('chọn bẫy này'),
    `Trí đồng thuận bẫy tự nhiên sau khi Bo sửa sai: "${verdict2.content.slice(0, 80)}..."`
  );

  // Kiểm tra Bo cập nhật bẫy đạt chuẩn trong kịch bản và checkpoint
  assert(
    part3Result.checkpoint.boInitialChallenge.includes('2a'),
    'Lời thách đố cuối cùng của Bo trong Checkpoint chứa ngộ nhận chuẩn "2a"'
  );

  // ---------------------------------------------------------------------------
  // TEST 3: KIỂM CHỨNG CHUỖI AGENT REASONING EVENT (CONTRACT & ORDER)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 3] Kiểm chứng hợp đồng chuỗi AgentReasoningEvent & Thứ tự phát sinh');

  const validEventTypes = [
    'thought',
    'tool_call',
    'tool_result',
    'debate_turn',
    'cross_check_verdict',
    'checkpoint_created',
  ];
  const validAgentIds = ['colam', 'bo', 'tri', 'linhchi', 'minhkhang'];

  const allEvents = part3Result.reasoning_events;
  let contractCompliant = true;
  let toolCallResultPaired = true;

  for (let idx = 0; idx < allEvents.length; idx++) {
    const evt = allEvents[idx];
    if (
      !evt.id ||
      !validEventTypes.includes(evt.eventType) ||
      !validAgentIds.includes(evt.agentId) ||
      !evt.agentDisplayName ||
      typeof evt.content !== 'string' ||
      !evt.timestamp
    ) {
      contractCompliant = false;
      console.error('Event vi phạm schema:', evt);
      break;
    }

    // Nếu là tool_call, sự kiện ngay tiếp theo phải là tool_result cho cùng toolName
    if (evt.eventType === 'tool_call') {
      const nextEvt = allEvents[idx + 1];
      if (
        !nextEvt ||
        nextEvt.eventType !== 'tool_result' ||
        nextEvt.toolCall?.toolName !== evt.toolCall?.toolName
      ) {
        toolCallResultPaired = false;
        console.error(`Lỗi bắt cặp tool_call -> tool_result tại index ${idx}:`, evt);
      }
    }
  }

  assert(
    contractCompliant,
    'Tất cả sự kiện đều tuân thủ 100% schema chuẩn src/types/pipeline.ts'
  );
  assert(
    toolCallResultPaired,
    'Mọi sự kiện tool_call đều được theo sau trực tiếp bởi tool_result tương ứng'
  );

  // Kiểm tra sự kiện chốt cuối cùng của Part phải là checkpoint_created do Cô Lam phát
  const lastEvent = allEvents[allEvents.length - 1];
  assert(
    lastEvent.eventType === 'checkpoint_created' && lastEvent.agentId === 'colam',
    'Sự kiện kết thúc của Part là checkpoint_created do Cô Lam (Director) phát ra'
  );

  // ---------------------------------------------------------------------------
  // TEST 4: KIỂM CHỨNG CÁC LUẬT SƯ PHẠM BẤT BIẾN (PEDAGOGICAL INVARIANTS)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 4] Kiểm chứng các luật sư phạm bất biến');

  const fullLessonDraft = await runFullLessonRoundtable(cognitiveStream, { useLLM: false });

  // 4.1 Tối đa 1 checkpoint dừng do hệ thống / part
  const checkpointCountsPerPart = fullLessonDraft.parts.map((p) => (p.checkpoint ? 1 : 0));
  assert(
    checkpointCountsPerPart.every((c) => c === 1),
    `Mỗi Part có đúng duy nhất 1 checkpoint chính (Tổng parts: ${fullLessonDraft.parts.length}, tổng checkpoints: ${fullLessonDraft.checkpoints.length})`
  );

  // 4.2 Không đặt checkpoint trong khoảng mở đầu part (warmup >= 15-30s)
  let warmupProtected = true;
  for (const p of fullLessonDraft.parts) {
    const start = p.startSecond;
    const chkSec = p.checkpointSecond;
    const minSafe = start === 0 ? 30 : start + 15;
    if (chkSec < minSafe) {
      warmupProtected = false;
      console.error(`Part ${p.partNumber} vi phạm warmup: start=${start}, checkpoint=${chkSec}, minSafe=${minSafe}`);
    }
  }
  assert(
    warmupProtected,
    'Tất cả Checkpoint đều nằm ngoài vùng đệm mở đầu (Part 1 >= 30s; Part 2,3 >= startSecond + 15s)'
  );

  // Test trường hợp biên: Segment bị đặt quá sớm (second = 5s), hệ thống tự đẩy qua warmup
  const earlySegmentPart = {
    partNumber: 1,
    title: 'Part test segment quá sớm',
    startSecond: 0,
    endSecond: 300,
    chosenSegment: { second: 5, timeFormatted: '00:05', trapRiskLevel: 'high' },
  };
  const earlyResult = await runRoundtableForPart(earlySegmentPart, { useLLM: false });
  assert(
    earlyResult.checkpointSecond >= 30,
    `Cơ chế tự vệ sư phạm: Segment tại 5s tự động được dời về giây an toàn ${earlyResult.checkpointSecond}s (>= 30s)`
  );

  // 4.3 Checkpoint đạt Bloom level >= Apply/Analyze
  const bloomTools = fullLessonDraft.parts
    .flatMap((p) => p.deterministic_tool_calls || [])
    .filter((t) => t.toolName === 'tool_evaluate_bloom_level');

  assert(
    bloomTools.length >= 3,
    `Đã thẩm định chuẩn Bloom cho cả 3 parts (số lượt gọi: ${bloomTools.length})`
  );
  const allBloomPass = bloomTools.every((t) => {
    const score = t.output?.score || 0;
    const level = t.output?.level;
    return score >= 3 && ['Apply', 'Analyze', 'Evaluate', 'Create'].includes(level);
  });
  assert(
    allBloomPass,
    'Tất cả câu hỏi Checkpoint đều đạt mức tư duy nhận thức cao (Bloom level >= Apply/Analyze)'
  );

  // 4.4 Lời thoại gợi mở Socratic, không tiết lộ đáp án trực tiếp
  let socraticCompliant = true;
  for (const chk of fullLessonDraft.checkpoints) {
    // Câu hỏi không chứa đáp án trực tiếp trong đề bài
    const correctOpt = chk.options.find((o) => o.isCorrect);
    if (correctOpt && chk.questionText.includes(`đáp án là ${correctOpt.label}`)) {
      socraticCompliant = false;
    }
    // Bo chỉ nêu bẫy hoặc thách thức
    if (!chk.boInitialChallenge || chk.boInitialChallenge.length < 5) {
      socraticCompliant = false;
    }
    // Có feedbackNote cho từng phương án để giải thích khi học sinh chọn
    if (!chk.options.every((o) => o.feedbackNote && o.feedbackNote.length > 5)) {
      socraticCompliant = false;
    }
  }
  assert(
    socraticCompliant,
    'Định dạng Socratic chuẩn mực: Thách đố gợi mở, feedback note phân tầng, không tiết lộ đáp án thô trong đề bài'
  );

  // ---------------------------------------------------------------------------
  // TEST 5: BENCHMARK THỜI GIAN CHẠY CỦA PART & FULL LESSON (< 30-60S)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 5] Benchmark thời gian thực thi (Performance & Latency)');

  const t0 = Date.now();
  await runRoundtableForPart(parts[0], { useLLM: false });
  const part1Ms = Date.now() - t0;

  const t1 = Date.now();
  await runRoundtableForPart(parts[2], { useLLM: false });
  const part3Ms = Date.now() - t1;

  const tFull0 = Date.now();
  await runFullLessonRoundtable(cognitiveStream, { useLLM: false });
  const fullLessonMs = Date.now() - tFull0;

  console.log(`  ⏱️  Thời gian chạy Part 1: ${part1Ms}ms`);
  console.log(`  ⏱️  Thời gian chạy Part 3 (Cross-Check WOW): ${part3Ms}ms`);
  console.log(`  ⏱️  Thời gian chạy toàn bộ Full Lesson (3 Parts): ${fullLessonMs}ms`);

  assert(
    part3Ms < 1000,
    `Thời gian chạy 1 Part cực nhanh: ${part3Ms}ms << 30s (Sẵn sàng 100% cho live demo War Room)`
  );
  assert(
    fullLessonMs < 5000,
    `Thời gian chạy toàn bài giảng 58 phút: ${fullLessonMs}ms << 60s`
  );

  // ---------------------------------------------------------------------------
  // TEST 6: REPLAY STREAM TỪ FIXTURE & SCHEMA CONTRACT VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 6] Replay Stream từ Fixture (Fast Replay & Schema Contract)');

  // 6.1 Replay qua đường dẫn /api/roundtable/fixture/stream?speed=10
  const sseFixture = await runSSEClientTest(
    serverPort,
    '/api/roundtable/fixture/stream?speed=10'
  );
  const fixtureEventNames = sseFixture.events.map((e) => e.eventName);

  assert(
    fixtureEventNames.includes('session_start'),
    'Replay fixture phát sự kiện [session_start]'
  );
  assert(
    fixtureEventNames.includes('reasoning') || fixtureEventNames.includes('reasoning_event'),
    'Replay fixture phát sự kiện [reasoning] / [reasoning_event]'
  );

  const requiredEventTypes = [
    'thought',
    'tool_call',
    'tool_result',
    'debate_turn',
    'cross_check_verdict',
    'checkpoint_created',
  ];
  const allEventTypesPresent = requiredEventTypes.every((type) => fixtureEventNames.includes(type));
  assert(
    allEventTypesPresent,
    `Replay fixture phát đầy đủ từng <eventType> (${requiredEventTypes.join(', ')})`
  );

  const doneEvent = sseFixture.events.find((e) => e.eventName === 'done');
  assert(
    Boolean(doneEvent),
    'Replay fixture phát sự kiện kết thúc [done]'
  );

  const fixtureCompleteEvent = sseFixture.events.find((e) => e.eventName === 'complete');
  assert(
    Boolean(fixtureCompleteEvent),
    'Replay fixture phát sự kiện [complete]'
  );

  // Lesson draft theo DRELessonSchema (src/types/pipeline.ts): bản nháp chờ giáo viên duyệt
  const lessonDraft = doneEvent?.data?.lesson;
  assert(
    Boolean(lessonDraft),
    'Sự kiện done/complete chứa lesson draft hợp lệ'
  );
  assert(
    typeof lessonDraft?.lesson_id === 'string' && lessonDraft.lesson_id.length > 0,
    `Lesson draft có lesson_id hợp lệ: "${lessonDraft?.lesson_id}"`
  );
  assert(
    typeof lessonDraft?.title === 'string' && lessonDraft.title.length > 0,
    `Lesson draft có title hợp lệ: "${lessonDraft?.title}"`
  );
  assert(
    Array.isArray(lessonDraft?.parts) && lessonDraft.parts.every((p) => p.pause_questions.length === 1),
    `Lesson draft chứa ${lessonDraft?.parts?.length} part, mỗi part đúng 1 câu hỏi checkpoint`
  );
  assert(
    Array.isArray(lessonDraft?.parts) && lessonDraft.parts.every((p) => p.scenarios.length >= 2),
    'Lesson draft chứa scenarios của các AI Peers trong từng part'
  );
  assert(
    lessonDraft?.status === 'draft' && doneEvent?.data?.approval?.approvedByTeacher === false,
    'Lesson draft giữ trạng thái draft, chưa được giáo viên phê duyệt (approvedByTeacher: false)'
  );
  assert(
    doneEvent?.data?.provenance === 'replay' && doneEvent?.data?.source === 'fixture',
    'Replay fixture báo đúng nguồn gốc (provenance: replay, source: fixture)'
  );

  // 6.2 Kiểm tra replay qua query params /api/roundtable/stream?mode=replay&fixture=true&speed=10
  const sseQueryReplay = await runSSEClientTest(
    serverPort,
    '/api/roundtable/stream?mode=replay&fixture=true&speed=10'
  );
  assert(
    sseQueryReplay.events.some((e) => e.eventName === 'done') &&
    sseQueryReplay.events.some((e) => e.eventName === 'complete'),
    'Replay qua query param mode=replay&fixture=true phát đủ [done] và [complete]'
  );

  // ---------------------------------------------------------------------------
  // TEST 7: LIVE RUN RECORDING & EXACT REPLAY (100% REASONING MATCH)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 7] Live Run Recording & Exact Replay (So sánh 100% độ trùng khớp)');

  const testRunId = 'test_run_auto_record';
  const recordedRunFilePath = path.resolve(__dirname, `src/data/runs/${testRunId}.json`);

  // Xóa file cũ nếu có để đảm bảo test việc tạo mới
  if (fs.existsSync(recordedRunFilePath)) {
    fs.unlinkSync(recordedRunFilePath);
  }

  // 7.1 Chạy live stream với partNumber=3 và runId tự đặt
  const sseLive = await runSSEClientTest(
    serverPort,
    `/api/roundtable/stream?partNumber=3&runId=${testRunId}&streamDelayMs=0`
  );
  const liveEventNames = sseLive.events.map((e) => e.eventName);

  assert(
    liveEventNames.includes('session_start') && liveEventNames.includes('complete'),
    'Live stream Part 3 ghi nhận đầy đủ session_start và complete'
  );

  // 7.2 Kiểm tra file run được tự động lưu trên đĩa
  assert(
    fs.existsSync(recordedRunFilePath),
    `File run được tự động ghi lại tại backend/src/data/runs/${testRunId}.json`
  );

  const savedRunData = JSON.parse(fs.readFileSync(recordedRunFilePath, 'utf-8'));
  assert(
    savedRunData.runId === testRunId && Array.isArray(savedRunData.reasoning_events),
    `File run đã lưu chứa đúng runId="${testRunId}" và reasoning_events (${savedRunData.reasoning_events.length} events)`
  );
  assert(
    Boolean(savedRunData.lesson?.status === 'draft' && savedRunData.lesson.parts?.[0]?.pause_questions?.length === 1),
    'File run đã lưu chứa lesson (DRELessonSchema draft) với checkpoint hợp lệ'
  );
  assert(
    savedRunData.provenance === 'live' && savedRunData.generation?.mode === 'deterministic',
    'File run đã lưu ghi rõ provenance live và chế độ sinh deterministic'
  );

  // 7.3 Mở stream replay từ run vừa ghi
  const sseReplay = await runSSEClientTest(
    serverPort,
    `/api/roundtable/${testRunId}/stream?speed=10`
  );

  // 7.4 So sánh 100% độ trùng khớp các reasoning events
  const liveReasoning = sseLive.events.filter((e) => e.eventName === 'reasoning').map((e) => e.data);
  const replayReasoning = sseReplay.events.filter((e) => e.eventName === 'reasoning').map((e) => e.data);

  assert(
    liveReasoning.length === replayReasoning.length && liveReasoning.length >= 7,
    `Số lượng reasoning events trùng khớp tuyệt đối: Live (${liveReasoning.length}) === Replay (${replayReasoning.length})`
  );

  let exactMatchCount = 0;
  for (let i = 0; i < liveReasoning.length; i++) {
    const l = liveReasoning[i];
    const r = replayReasoning[i];
    const sameType = l.eventType === r.eventType;
    const sameAgent = l.agentId === r.agentId;
    const sameContent = l.content === r.content;
    const sameTool = (!l.toolCall && !r.toolCall) || (l.toolCall?.toolName === r.toolCall?.toolName && l.toolCall?.isValid === r.toolCall?.isValid);

    if (sameType && sameAgent && sameContent && sameTool) {
      exactMatchCount++;
    }
  }

  assert(
    exactMatchCount === liveReasoning.length,
    `Độ trùng khớp reasoning events đạt 100% (${exactMatchCount}/${liveReasoning.length} events khớp chính xác eventType, agentId, content, tool calls)`
  );

  const replayDone = sseReplay.events.find((e) => e.eventName === 'done');
  const replayComplete = sseReplay.events.find((e) => e.eventName === 'complete');
  assert(
    Boolean(replayDone && replayComplete),
    'Replay run stream phát đầy đủ done và complete'
  );

  // ---------------------------------------------------------------------------
  // TEST 8: ERROR HANDLING & RESILIENCE (KHÔNG BỊ TREO KHI GẶP LỖI)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 8] Error Handling & Resilience (Phát event: error và không làm treo client)');

  // 8.1 Replay runId không tồn tại -> server phát event: error và ngắt kết nối
  const tErr0 = Date.now();
  const sseNonExistent = await runSSEClientTest(
    serverPort,
    '/api/roundtable/stream?mode=replay&runId=non_existent_run_404_resilience'
  );
  const nonExistentDuration = Date.now() - tErr0;

  const errorEvent = sseNonExistent.events.find((e) => e.eventName === 'error');
  assert(
    Boolean(errorEvent),
    'Replay run không tồn tại phát ra [event: error]'
  );
  assert(
    errorEvent?.data?.error?.toLowerCase().includes('không tìm thấy'),
    `Nội dung lỗi rõ ràng: "${errorEvent?.data?.error}"`
  );
  assert(
    nonExistentDuration < 2000,
    `Xử lý ngắt kết nối lập tức, không bị treo (hoàn tất trong ${nonExistentDuration}ms < 2s)`
  );

  // 8.2 Truy vấn stream với cognitiveStream rỗng/bất thường gây lỗi -> server không sập và gửi error
  const sseCorrupt = await runSSEClientTest(
    serverPort,
    '/api/roundtable/stream',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { cognitiveStream: { segments: 'invalid_not_array' }, partNumber: 1 },
    }
  );
  assert(
    sseCorrupt.statusCode === 400,
    `Payload cognitiveStream không hợp lệ bị từ chối với HTTP 400 trước khi mở SSE (thực tế: ${sseCorrupt.statusCode})`
  );

  // ---------------------------------------------------------------------------
  // TEST 9: RUN MANAGEMENT API (DANH SÁCH & CHI TIẾT RUNS)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 9] Run Management API (/api/roundtable/runs & /api/roundtable/runs/:runId)');

  // 9.1 GET /api/roundtable/runs
  const runsListRes = await httpGetJSON(serverPort, '/api/roundtable/runs');
  assert(
    runsListRes.statusCode === 200 && runsListRes.body?.ok === true,
    'GET /api/roundtable/runs trả về HTTP 200 và ok: true'
  );
  assert(
    Array.isArray(runsListRes.body?.runs) && runsListRes.body.runs.length >= 2,
    `Danh sách runs trả về ${runsListRes.body?.runs?.length} runs (kỳ vọng >= 2: fixture + live run vừa ghi)`
  );

  const hasFixture = runsListRes.body.runs.some(
    (r) => r.isFixture || r.runId === 'fixture' || r.runId === 'run_vecto12_part3_wow_moment'
  );
  assert(
    hasFixture,
    'Danh sách runs có chứa run fixture tiêu chuẩn'
  );

  const hasRecordedRun = runsListRes.body.runs.some(
    (r) => r.runId === testRunId
  );
  assert(
    hasRecordedRun,
    `Danh sách runs có chứa run vừa tự động ghi ("${testRunId}")`
  );

  // 9.2 GET /api/roundtable/runs/:runId (Chi tiết run vừa ghi)
  const runDetailRes = await httpGetJSON(serverPort, `/api/roundtable/runs/${testRunId}`);
  assert(
    runDetailRes.statusCode === 200 && runDetailRes.body?.run?.runId === testRunId,
    `GET /api/roundtable/runs/${testRunId} trả về chi tiết chính xác của run`
  );
  assert(
    Array.isArray(runDetailRes.body?.run?.reasoning_events) && runDetailRes.body.run.reasoning_events.length >= 7,
    `Chi tiết run chứa đầy đủ ${runDetailRes.body?.run?.reasoning_events?.length} reasoning events`
  );

  // 9.3 GET /api/roundtable/runs/fixture
  const fixtureDetailRes = await httpGetJSON(serverPort, '/api/roundtable/runs/fixture');
  assert(
    fixtureDetailRes.statusCode === 200 && fixtureDetailRes.body?.ok === true,
    'GET /api/roundtable/runs/fixture trả về HTTP 200 và dữ liệu chi tiết của fixture'
  );

  // 9.4 GET /api/roundtable/runs/:runId với runId không tồn tại -> HTTP 404
  const notFoundRes = await httpGetJSON(serverPort, '/api/roundtable/runs/non_existent_run_random_999');
  assert(
    notFoundRes.statusCode === 404 && notFoundRes.body?.ok === false,
    'GET runId không tồn tại trả về đúng HTTP 404 Not Found'
  );
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
  }

  // ---------------------------------------------------------------------------
  // TỔNG KẾT
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passedChecks}/${totalChecks} CHECKS ĐẠT CHUẨN (${Math.round((passedChecks / totalChecks) * 100)}%)`);
  if (failures.length > 0) {
    console.error(`❌ CÓ ${failures.length} KIỂM THỬ THẤT BẠI:`);
    failures.forEach((f, idx) => console.error(`   ${idx + 1}. ${f}`));
    console.log('================================================================\n');
    process.exit(1);
  } else {
    console.log('🎉 TẤT CẢ CÁC MỤC KIỂM THỬ ĐẠT CHUẨN XUẤT SẮC 100%!');
    console.log('================================================================\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('💥 Ngoại lệ ngoài ý muốn trong quá trình chạy test:', err);
  process.exit(1);
});
