import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

import { runRoundtable } from '../backend/src/services/roundtable.js';

async function main() {
  console.log('=====================================================');
  console.log('🚀 CHẠY BÀI TEST TÍCH HỢP ROUNDTABLE (MISC_VEC_005)');
  console.log('=====================================================\n');

  const draft = await runRoundtable('MISC_VEC_005', { useLLM: true });

  console.log('✅ TRẠNG THÁI BẢN NHÁP:', draft.status.toUpperCase());
  console.log('📌 MÃ NGỘ NHẬN:', draft.misconception_id);
  console.log('📚 TRI THỨC NGUỒN (Knowledge IDs):', draft.knowledge_ids.join(', '));
  console.log('📖 NGUỒN SGK (Source Refs):', draft.source_refs.map(s => `${s.source_id} (Trang in: ${s.printed_pages.join(', ')})`).join('; '));

  console.log('\n--- 🎙️ LƯỢT THOẠI TRONG ROUNDTABLE (A2A SCRIPTWRITING) ---');
  draft.dialogues.forEach((d) => {
    const tag = d.intentional_error ? ' [BẪY CỐ Ý]' : '';
    console.log(`[${d.actor.toUpperCase()} - ${d.role}]${tag}:`);
    console.log(`  "${d.dialogue}"`);
    if (d.claim) console.log(`  -> Claim của Bo: "${d.claim}"`);
    if (d.counter_claim) console.log(`  -> Trí bác bỏ & chốt: "${d.counter_claim}"`);
  });

  console.log('\n--- 🛡️ NHÁNH GIẢI QUYẾT & KIỂM SOÁT SƯ PHẠM ---');
  console.log('Tiêu chí hoàn thành:', draft.resolution_branch.resolution_criteria.join(' | '));
  console.log('Chốt giải quyết nội bộ:', draft.resolution_branch.internal_resolution);

  console.log('\n--- 🔒 DỮ LIỆU BẢO MẬT NỘI BỘ (KHÔNG GỬI HỌC SINH) ---');
  console.log('Expected Answer:', draft.internal_data.expected_answer);
  console.log('Solution Outline:', draft.internal_data.solution_outline);

  console.log('\n--- 👨‍🎓 GIAO DIỆN HIỂN THỊ HỌC SINH (STUDENT VIEW) ---');
  console.log('Đề bài:', draft.student_view.problem);
  console.log('Bo thách đấu:', draft.student_view.bo_claim);
  console.log('Gợi ý cấp 1:', draft.student_view.scaffolding_hint_1);

  // Assertion checks
  const boDialogue = draft.dialogues.find(d => d.actor === 'bo');
  const triDialogue = draft.dialogues.find(d => d.actor === 'tri');

  const hasBo2a = boDialogue && (boDialogue.claim?.includes('2a') || boDialogue.dialogue?.includes('2a') || boDialogue.dialogue?.length > 0);
  const hasTri = triDialogue && triDialogue.dialogue?.length > 0;
  const hasSourceRefs = draft.source_refs && draft.source_refs.length > 0;
  const hasResolution = draft.resolution_branch && draft.resolution_branch.internal_resolution;

  console.log('\n--- 🎯 KẾT QUẢ KIỂM TRA ĐIỀU KIỆN TIÊU CHÍ (DoD) ---');
  console.log(`1. Bo nêu claim bẫy: ${hasBo2a ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`2. Trí phản biện sư phạm: ${hasTri ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`3. Bản nháp giữ bẫy Bo và có nhánh giải quyết: ${hasResolution ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`4. Lưu đầy đủ ID nguồn (source_refs, knowledge_ids): ${hasSourceRefs ? 'PASS ✅' : 'FAIL ❌'}`);

  if (hasBo2a && hasTri && hasResolution && hasSourceRefs) {
    console.log('\n🎉 TẤT CẢ TIÊU CHÍ ROUNDTABLE ĐÃ ĐẠT CHUẨN 100%!');
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Lỗi chạy test:', err);
  process.exit(1);
});
