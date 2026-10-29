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
import path from 'path';
import { fileURLToPath } from 'url';

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

async function runSSEClientTest(port, pathAndQuery) {
  return new Promise((resolve, reject) => {
    const events = [];
    const rawChunks = [];

    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: pathAndQuery,
        headers: {
          Accept: 'text/event-stream',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP status ${res.statusCode}`));
        }

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
          resolve({ events, rawChunks });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy(new Error('SSE request timeout'));
    });
  });
}

async function main() {
  console.log('================================================================');
  console.log('🧪 DRE MULTI-AGENT ROUNDTABLE ORCHESTRATOR VERIFICATION SUITE');
  console.log('================================================================\n');

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
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const serverPort = testServer.address().port;
  console.log(`  ℹ️ Test server lắng nghe tại ephemeral port: ${serverPort}`);

  try {
    // Gọi SSE cho Part 3 qua HTTP GET
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
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
  }

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
