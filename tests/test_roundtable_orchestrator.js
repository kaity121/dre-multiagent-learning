/**
 * tests/test_roundtable_orchestrator.js
 *
 * Automated Test Script for Roundtable Orchestrator & SSE Streaming (#302)
 * Agent 2 (Tester & Verifier)
 *
 * Can be run with: `node tests/test_roundtable_orchestrator.js`
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.join(__dirname, '../mock/mock_cognitive_stream_vecto12.json');

import {
  runRoundtableForPart,
  runFullLessonRoundtable,
  partitionTimelineIntoParts,
} from '../backend/src/services/roundtableOrchestrator.js';

let passed = 0;
let total = 0;

function check(title, condition, detail = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${title} ${detail ? '(' + detail + ')' : ''}`);
  } else {
    console.error(`  ❌ [FAIL] ${title} ${detail ? '(' + detail + ')' : ''}`);
  }
}

async function run() {
  console.log('========================================================================');
  console.log('🎯 RUNNING ROUNDTABLE ORCHESTRATOR & STREAM VERIFIER (Agent 2)');
  console.log('========================================================================\n');

  const cognitiveStream = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));
  const parts = partitionTimelineIntoParts(cognitiveStream);

  // 1. Roundtable per Part & Stream callback
  console.log('--- [Test 1] Roundtable theo Part & Event Streaming ---');
  for (const part of parts) {
    const events = [];
    const res = await runRoundtableForPart(part, {
      useLLM: false,
      onEvent: (evt) => events.push(evt),
    });
    check(`Part ${part.partNumber} chạy hoàn tất`, res.status === 'draft');
    check(`Part ${part.partNumber} stream đầy đủ events`, events.length === res.reasoning_events.length, `${events.length} events`);
  }

  // 2. Cross-check WOW moment
  console.log('\n--- [Test 2] Khoảnh khắc WOW: Trí kích hoạt tool kiểm chứng & Bo sửa bẫy ---');
  const part3 = parts[2];
  const part3Result = await runRoundtableForPart(part3, { useLLM: false });
  check('Cờ crossCheckCorrectionOccurred được kích hoạt', part3Result.crossCheckCorrectionOccurred === true);

  const crossChecks = part3Result.reasoning_events.filter(e => e.eventType === 'cross_check_verdict');
  check('Có ít nhất 2 lượt rà soát chéo (Bác bỏ & Đồng thuận)', crossChecks.length >= 2, `${crossChecks.length} verdicts`);
  check('Lượt 1: Tool trả về isValid: false cho claim sai của Bo', crossChecks[0]?.toolCall?.isValid === false);
  check('Lượt 1: Trí phát biểu bác bỏ bẫy phi thực tế', crossChecks[0]?.content.includes('nhầm to rồi') || crossChecks[0]?.content.includes('bác bỏ'));
  check('Lượt 2: Trí phê duyệt bẫy tự nhiên sau khi Bo sửa sai', crossChecks[1]?.content.includes('tự nhiên') || crossChecks[1]?.content.includes('đồng ý'));

  // 3. Chuỗi AgentReasoningEvent
  console.log('\n--- [Test 3] Chuỗi AgentReasoningEvent hợp lệ theo pipeline.ts ---');
  const eventTypes = new Set(part3Result.reasoning_events.map(e => e.eventType));
  ['thought', 'tool_call', 'tool_result', 'debate_turn', 'cross_check_verdict', 'checkpoint_created'].forEach(type => {
    check(`Có sự kiện loại "${type}"`, eventTypes.has(type));
  });

  // 4. Các luật sư phạm bất biến
  console.log('\n--- [Test 4] Các luật sư phạm bất biến (Pedagogical Invariants) ---');
  const fullDraft = await runFullLessonRoundtable(cognitiveStream, { useLLM: false });
  check('Tối đa 1 checkpoint chính cho mỗi Part', fullDraft.parts.every(p => p.checkpoint != null) && fullDraft.checkpoints.length === 3);

  const warmupPass = fullDraft.parts.every(p => {
    const minTime = p.startSecond === 0 ? 30 : p.startSecond + 15;
    return p.checkpointSecond >= minTime;
  });
  check('Không đặt checkpoint trong khoảng mở đầu part (warmup >= 15-30s)', warmupPass);

  const bloomPass = fullDraft.parts.every(p => {
    const bloomCall = p.deterministic_tool_calls.find(t => t.toolName === 'tool_evaluate_bloom_level');
    return bloomCall && bloomCall.output.score >= 3;
  });
  check('Tất cả checkpoint đạt chuẩn nhận thức Bloom >= Apply/Analyze (Score >= 3)', bloomPass);

  const socraticPass = fullDraft.checkpoints.every(c => c.options.length >= 3 && c.options.every(o => o.feedbackNote));
  check('Câu hỏi thiết kế theo phương pháp Socratic, có feedback phân tầng', socraticPass);

  // 5. Benchmark tốc độ
  console.log('\n--- [Test 5] Benchmark thời gian chạy (< 30-60s cho Demo) ---');
  const t0 = Date.now();
  await runFullLessonRoundtable(cognitiveStream, { useLLM: false });
  const elapsed = Date.now() - t0;
  check('Thời gian chạy toàn bài giảng 58 phút siêu tốc (< 5000ms << 60s)', elapsed < 5000, `Thực tế: ${elapsed}ms`);

  console.log('\n========================================================================');
  console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHÍ ĐẠT CHUẨN (${Math.round((passed / total) * 100)}%)`);
  if (passed === total) {
    console.log('🎉 TOÀN BỘ CÁC BÀI TEST ROUNDTABLE ĐÃ HOÀN TOÀN ĐẠT CHUẨN!');
    console.log('========================================================================\n');
    process.exit(0);
  } else {
    console.error('❌ CÓ BÀI TEST CHƯA ĐẠT CHUẨN!');
    console.log('========================================================================\n');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Lỗi thực thi test script:', err);
  process.exit(1);
});
