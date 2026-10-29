import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

import {
  classifyLearnerIntent,
  classifyHeuristic,
  dispatchMessage,
  INTENT_AGENT_MAP,
} from '../backend/src/services/dispatcher.js';

/**
 * ============================================================================
 * BENCHMARK DATASET: 24 CÂU HỎI MẪU CHO RUNTIME DISPATCHER (ISSUE #401)
 * ============================================================================
 */
const BENCHMARK_CASES = [
  // 1. ask_formula_mnemonic -> linhchi
  {
    query: 'Linh Chi ơi cho mình xin lại công thức cộng vectơ hình bình hành với',
    expectedIntent: 'ask_formula_mnemonic',
    expectedAgent: 'linhchi',
  },
  {
    query: 'Quy tắc 3 điểm áp dụng như thế nào vậy bạn?',
    expectedIntent: 'ask_formula_mnemonic',
    expectedAgent: 'linhchi',
  },
  {
    query: 'Xem giúp mình sổ tay công thức tích vô hướng và điều kiện xác định',
    expectedIntent: 'ask_formula_mnemonic',
    expectedAgent: 'linhchi',
  },
  {
    query: 'Có mẹo nhớ nhanh quy tắc hình hộp không bạn?',
    expectedIntent: 'ask_formula_mnemonic',
    expectedAgent: 'linhchi',
  },

  // 2. ask_deep_concept -> tri
  {
    query: 'Tại sao độ dài vectơ tổng |a + b| lại không bằng tổng độ dài |a| + |b| vậy bạn?',
    expectedIntent: 'ask_deep_concept',
    expectedAgent: 'tri',
  },
  {
    query: 'Bản chất hình học của phép trừ hai vectơ chung gốc là gì?',
    expectedIntent: 'ask_deep_concept',
    expectedAgent: 'tri',
  },
  {
    query: 'Khi nào thì dấu bằng trong bất đẳng thức tam giác của vectơ xảy ra?',
    expectedIntent: 'ask_deep_concept',
    expectedAgent: 'tri',
  },
  {
    query: 'Trí ơi giải thích giùm mình ý nghĩa của vectơ chỉ phương trong không gian',
    expectedIntent: 'ask_deep_concept',
    expectedAgent: 'tri',
  },

  // 3. challenge_shortcut_fallacy -> bo
  {
    query: 'Cứ lấy độ dài cộng đại vào nhau cho nhanh, vẽ hình chi cho mệt',
    expectedIntent: 'challenge_shortcut_fallacy',
    expectedAgent: 'bo',
  },
  {
    query: 'Bài này bấm máy tính Casio thế số vào là ra liền khỏi cần suy nghĩ',
    expectedIntent: 'challenge_shortcut_fallacy',
    expectedAgent: 'bo',
  },
  {
    query: 'Lấy luôn 1 + 1 = 2 cho lẹ chứ phân tích làm gì',
    expectedIntent: 'challenge_shortcut_fallacy',
    expectedAgent: 'bo',
  },
  {
    query: 'Làm tắt kiểu này đỡ mệt hơn nhiều, đúng không Bo?',
    expectedIntent: 'challenge_shortcut_fallacy',
    expectedAgent: 'bo',
  },

  // 4. ask_scaffolding_help -> an
  {
    query: 'Em bí quá chưa hiểu đề bài nói gì, cho em xin gợi ý với',
    expectedIntent: 'ask_scaffolding_help',
    expectedAgent: 'an',
  },
  {
    query: 'Trợ giảng ơi bài này khó quá, nên bắt đầu từ bước 1 như thế nào ạ?',
    expectedIntent: 'ask_scaffolding_help',
    expectedAgent: 'an',
  },
  {
    query: 'Mình làm mãi không ra câu này, cứu em với',
    expectedIntent: 'ask_scaffolding_help',
    expectedAgent: 'an',
  },
  {
    query: 'Gợi ý giúp mình câu này với',
    expectedIntent: 'ask_scaffolding_help',
    expectedAgent: 'an',
  },

  // 5. sharp_rebuttal -> bo (then colam)
  {
    query: 'Bo sai rồi, độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi!',
    expectedIntent: 'sharp_rebuttal',
    expectedAgent: 'bo',
  },
  {
    query: 'Bạn cộng trực tiếp độ dài là sai rồi, theo bất đẳng thức tam giác |a+b| <= |a|+|b|',
    expectedIntent: 'sharp_rebuttal',
    expectedAgent: 'bo',
  },
  {
    query: 'Không bằng 2 được đâu, vì hai vectơ này vuông góc nên đường chéo phải ra căn 2 theo Pytago chứ!',
    expectedIntent: 'sharp_rebuttal',
    expectedAgent: 'bo',
  },
  {
    query: 'Khẳng định của Bo không đúng, hai vectơ đối nhau tổng bằng vectơ 0!',
    expectedIntent: 'sharp_rebuttal',
    expectedAgent: 'bo',
  },

  // 6. general_classroom_chitchat -> minhkhang
  {
    query: 'Hôm nay lớp học đông vui quá ha các bạn',
    expectedIntent: 'general_classroom_chitchat',
    expectedAgent: 'minhkhang',
  },
  {
    query: 'Mấy bạn ăn cơm chưa, học mệt quá',
    expectedIntent: 'general_classroom_chitchat',
    expectedAgent: 'minhkhang',
  },
  {
    query: 'Thầy Tiến giảng bài cuốn ghê',
    expectedIntent: 'general_classroom_chitchat',
    expectedAgent: 'minhkhang',
  },
  {
    query: 'Minh Khang ơi có ví dụ đời sống thực tế nào dễ nhớ về vectơ không?',
    expectedIntent: 'general_classroom_chitchat',
    expectedAgent: 'minhkhang',
  },

  // 7. Benchmark bổ sung: Các ca kiểm thử mở rộng theo yêu cầu PR Review (36 cases)
  {
    query: 'Bo sai rồi, không bằng 2 đâu',
    expectedIntent: 'challenge_shortcut_fallacy',
    expectedAgent: 'bo',
  },
  {
    query: 'em không bằng bạn Trí đâu',
    expectedIntent: 'general_classroom_chitchat',
    expectedAgent: 'minhkhang',
  },
  {
    query: 'thầy Tiến giảng nhanh quá em không theo kịp',
    expectedIntent: 'ask_scaffolding_help',
    expectedAgent: 'an',
  },
  {
    query: 'chào Bo nha',
    expectedIntent: 'challenge_shortcut_fallacy',
    expectedAgent: 'bo',
  },
  {
    query: "Hình lập phương cạnh bằng 2, |BC + DD'| bằng bao nhiêu?",
    expectedIntent: 'ask_deep_concept',
    expectedAgent: 'tri',
  },
  {
    query: "Hình lập phương cạnh bằng 2, |BC + DD'| bằng 2√2 có đúng không?",
    expectedIntent: 'ask_deep_concept',
    expectedAgent: 'tri',
  },
  {
    query: 'Quy tắc hiệu chung đầu lộn ngược là gì vậy Linh Chi?',
    expectedIntent: 'ask_formula_mnemonic',
    expectedAgent: 'linhchi',
  },
  {
    query: 'Tại sao hai đường thẳng chéo nhau lại không cùng phương vậy Trí?',
    expectedIntent: 'ask_deep_concept',
    expectedAgent: 'tri',
  },
  {
    query: 'Cứ lấy cạnh cộng cạnh là xong, cần gì vẽ thêm điểm',
    expectedIntent: 'challenge_shortcut_fallacy',
    expectedAgent: 'bo',
  },
  {
    query: 'Cô Lam ơi cho em hỏi bài tập về nhà với ạ',
    expectedIntent: 'ask_deep_concept',
    expectedAgent: 'colam',
  },
  {
    query: 'Trợ giảng An ơi bài này em chưa hiểu bước 2',
    expectedIntent: 'ask_scaffolding_help',
    expectedAgent: 'an',
  },
  {
    query: 'Hôm nay ai vừa giành quả bóng vàng 2026 vậy?',
    expectedIntent: 'encourage_study_focus',
    expectedAgent: 'minhkhang',
  },
];

async function runBenchmark() {
  console.log('========================================================================');
  console.log('🚀 KIỂM THỬ HỆ THỐNG INTENT CLASSIFIER & RUNTIME DISPATCHER (ISSUE #401)');
  console.log('========================================================================\n');

  let correctCount = 0;
  const benchmarkResults = [];

  for (let i = 0; i < BENCHMARK_CASES.length; i++) {
    const item = BENCHMARK_CASES[i];
    const verdict = await classifyLearnerIntent({
      message: item.query,
      currentTime: 2233,
      recipient: 'all',
      useLLM: false, // Benchmark fast-path & deterministic heuristics
    });

    const isIntentMatch = verdict.detectedIntent === item.expectedIntent;
    const isAgentMatch = verdict.dispatchedAgent === item.expectedAgent;
    const isPass = isIntentMatch && isAgentMatch;

    if (isPass) correctCount++;

    benchmarkResults.push({
      index: i + 1,
      query: item.query,
      expectedIntent: item.expectedIntent,
      expectedAgent: item.expectedAgent,
      actualIntent: verdict.detectedIntent,
      actualAgent: verdict.dispatchedAgent,
      confidence: verdict.confidence,
      reasoning: verdict.reasoning,
      pass: isPass,
    });

    console.log(
      `[${isPass ? 'PASS ✅' : 'FAIL ❌'}] Câu ${i + 1}: "${item.query.slice(0, 45)}..."`
    );
    console.log(`   -> Target: [${item.expectedIntent} -> ${item.expectedAgent}]`);
    console.log(`   -> Output: [${verdict.detectedIntent} -> ${verdict.dispatchedAgent}] (conf: ${verdict.confidence.toFixed(2)})\n`);
  }

  const accuracy = (correctCount / BENCHMARK_CASES.length) * 100;
  console.log('------------------------------------------------------------------------');
  console.log(`📊 TỔNG KẾT BENCHMARK INTENT CLASSIFIER:`);
  console.log(`   - Số câu kiểm tra: ${BENCHMARK_CASES.length}`);
  console.log(`   - Số câu chính xác: ${correctCount}`);
  console.log(`   - Độ chính xác đạt: ${accuracy.toFixed(1)}% (Tiêu chuẩn DoD: >= 90%)`);
  console.log('------------------------------------------------------------------------\n');

  // TEST CASE 2: Kiểm thử kịch bản phản biện tại trạm 37:13 (Chained Sequence Bo -> Cô Lam)
  console.log('🎙️ KIỂM THỬ RUNTIME DISPATCH TẠI CHECKPOINT 37:13 (PHẢN BIỆN BẪY BO):');
  const rebuttalMsg = 'Bo sai rồi, độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi!';
  const dispatchResult = await dispatchMessage({
    message: rebuttalMsg,
    currentTime: 2233,
    useLLM: false, // Dùng mock/deterministic handler cho CI test
  });

  const hasBoConcede = dispatchResult.primaryResponse && dispatchResult.primaryResponse.author === 'Bo';
  const hasCoLamClosure = dispatchResult.followUpResponse && dispatchResult.followUpResponse.author === 'Cô Lam';
  const hasRagContext = dispatchResult.ragContextUsed && dispatchResult.ragContextUsed.misconceptionId;

  console.log(`   - Tác nhân 1 (Bo nhận thua): ${hasBoConcede ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`     Lời Bo: "${dispatchResult.primaryResponse.text}"`);
  console.log(`   - Tác nhân 2 (Cô Lam chốt bài): ${hasCoLamClosure ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`     Lời Cô Lam: "${dispatchResult.followUpResponse.text}"`);
  console.log(`   - Ngữ cảnh RAG đã dùng: ${hasRagContext ? dispatchResult.ragContextUsed.title : 'Chưa có'}`);
  console.log('');

  // TEST CASE 3: Kiểm thử Scaffolding với Trợ giảng An
  console.log('🤝 KIỂM THỬ TRỢ GIẢNG AN (SCAFFOLDING NUDGE):');
  const scaffoldResult = await dispatchMessage({
    message: 'Em bí quá chưa hiểu đề, cho em xin một gợi ý với ạ',
    currentTime: 2233,
    useLLM: false,
  });
  const hasTaAn = scaffoldResult.primaryResponse && scaffoldResult.primaryResponse.author === 'Trợ giảng An';
  console.log(`   - Trợ giảng An phản hồi: ${hasTaAn ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`     Lời An: "${scaffoldResult.primaryResponse.text}"\n`);

  // Lưu file bằng chứng nghiệm thu (Benchmark Evidence)
  const evidencePath = path.join(__dirname, 'dispatcher_benchmark_evidence.json');
  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalQueries: BENCHMARK_CASES.length,
        correctQueries: correctCount,
        accuracyPercent: accuracy,
        meetsDoD: accuracy >= 90,
        benchmarkResults,
        checkpoint3713Test: {
          passed: hasBoConcede && hasCoLamClosure,
          primaryAuthor: dispatchResult.primaryResponse?.author,
          followUpAuthor: dispatchResult.followUpResponse?.author,
        },
      },
      null,
      2
    )
  );
  console.log(`📁 Đã lưu báo cáo bằng chứng nghiệm thu tại: ${evidencePath}\n`);

  if (accuracy >= 90 && hasBoConcede && hasCoLamClosure && hasTaAn) {
    console.log('🎉 TẤT CẢ TIÊU CHÍ DEFINITION OF DONE CỦA ISSUE #401 ĐÃ ĐẠT CHUẨN 100%!');
    process.exit(0);
  } else {
    console.error('❌ Chưa đạt đầy đủ tiêu chí Definition of Done!');
    process.exit(1);
  }
}

runBenchmark().catch((err) => {
  console.error('❌ Lỗi kiểm thử:', err);
  process.exit(1);
});
