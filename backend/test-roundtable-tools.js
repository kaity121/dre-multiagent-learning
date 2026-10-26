/**
 * backend/test-roundtable-tools.js
 *
 * Kiểm tra xác thực E2E cho Multi-Agent Scriptwriter Roundtable có Deterministic Tools:
 * - Trí gọi tool_verify_vector_algebra để kiểm chứng claim 2a của Bo
 * - Tool trả về isValid: false, correct: a\sqrt{2}
 * - Trí đổi lời thoại bác bẫy dựa vào kết quả tool
 * - Kiểm tra hợp đồng DeterministicToolCall và reasoning_events
 */

import { runRoundtable } from './src/services/roundtable.js';

async function main() {
  console.log('='.repeat(70));
  console.log('🧪 BẮT ĐẦU KIỂM THỬ ROUNDTABLE MULTI-AGENT + DETERMINISTIC TOOLS');
  console.log('='.repeat(70));

  // Chạy buồng họp cho ngộ nhận MISC_VEC_005 (Cộng độ dài trực tiếp trong Ví dụ 3)
  const draft = await runRoundtable('MISC_VEC_005', { useLLM: true });

  console.log('\n[1] Thông tin bản nháp (Draft Script):');
  console.log(`- Draft ID: ${draft.id}`);
  console.log(`- Misconception ID: ${draft.misconception_id}`);
  console.log(`- Trạng thái: ${draft.status}`);

  console.log('\n[2] Các lượt gọi Deterministic Tools (DeterministicToolCall):');
  console.log(JSON.stringify(draft.deterministic_tool_calls, null, 2));

  console.log('\n[3] Đối thoại của các tác nhân (Agent Dialogues):');
  for (const d of draft.dialogues) {
    console.log(`  ➤ [${d.actor.toUpperCase()}] (${d.role}):`);
    console.log(`     "${d.dialogue}"`);
    if (d.claim) console.log(`     Claim: ${d.claim}`);
    if (d.counter_claim) console.log(`     Counter Claim: ${d.counter_claim}`);
  }

  console.log('\n[4] Chuỗi sự kiện suy luận (Reasoning Events Stream):');
  for (const ev of draft.reasoning_events) {
    console.log(`  • [${ev.eventType}] ${ev.agentDisplayName}: ${ev.content.substring(0, 80)}...`);
  }

  // Kiểm tra Definition of Done
  console.log('\n' + '='.repeat(70));
  console.log('📋 KIỂM CHỨNG THEO DEFINITION OF DONE (DoD):');

  const vectorToolCall = draft.deterministic_tool_calls.find(t => t.toolName === 'tool_verify_vector_algebra');
  if (vectorToolCall) {
    console.log('  ✅ DoD #1: tool_verify_vector_algebra đã được gọi.');
    console.log(`     Input claim: "${vectorToolCall.input.claim}"`);
    console.log(`     Output isValid: ${vectorToolCall.output.isValid} (Mong đợi: false)`);
    console.log(`     Output correct: "${vectorToolCall.output.correct}" (Mong đợi: "a\\sqrt{2}")`);
    if (vectorToolCall.output.isValid === false && vectorToolCall.output.correct.includes('sqrt{2}')) {
      console.log('     => Case Ví dụ 3 đạt chuẩn 100%!');
    }
  } else {
    console.log('  ❌ DoD #1: Chưa tìm thấy lượt gọi tool_verify_vector_algebra!');
  }

  const triDialogue = draft.dialogues.find(d => d.actor === 'tri');
  const hasSqrtInDialogue = triDialogue && (
    triDialogue.dialogue.includes('√2') ||
    triDialogue.dialogue.includes('sqrt{2}') ||
    triDialogue.dialogue.includes('sqrt(2)') ||
    (triDialogue.counter_claim && (triDialogue.counter_claim.includes('√2') || triDialogue.counter_claim.includes('sqrt')))
  );

  if (triDialogue && hasSqrtInDialogue) {
    console.log('  ✅ DoD #2: Trí đã phản biện và đổi lời thoại dựa trên kết quả của tool!');
    console.log(`     Lời thoại của Trí: "${triDialogue.dialogue}"`);
  } else {
    console.log('  ❌ DoD #2: Lời thoại của Trí chưa phản ánh kết quả tool.');
  }

  if (draft.deterministic_tool_calls.length > 0 && draft.deterministic_tool_calls.every(t => t.toolName && t.timestampMs)) {
    console.log('  ✅ DoD #3: Các tool calls tuân thủ chuẩn DeterministicToolCall để stream lên UI (#10).');
  } else {
    console.log('  ❌ DoD #3: Contract DeterministicToolCall chưa đạt.');
  }

  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('Lỗi khi chạy kiểm thử:', err);
  process.exit(1);
});
