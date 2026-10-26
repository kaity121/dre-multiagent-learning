import { getById } from './knowledgeBase.js';
import { chatJSON } from '../openaiClient.js';
import { config } from '../config.js';

/**
 * Buồng họp A2A Scriptwriting Roundtable cho một ngộ nhận (mặc định: MISC_VEC_005).
 *
 * Quy tắc phân chia dữ liệu nghiêm ngặt theo vai trò (Context Isolation Guardrails):
 * - Bo:       incorrect_claim, error_mechanism
 * - Trí:      knowledge, correction, counterexample
 * - Linh Chi: scaffolding
 * - Cô Lam:   resolution_criteria, exercises (không để lộ expected_answer / solution_outline)
 *
 * Dữ liệu nội bộ (expected_answer, solution_outline) được lưu giữ trong internal_data.
 */
export async function runRoundtable(misconceptionId = 'MISC_VEC_005', { useLLM = true } = {}) {
  // Lấy dữ liệu chuẩn hoá từ Knowledge Base
  const context = getById(misconceptionId);
  if (!context) {
    throw new Error(`Không tìm thấy dữ liệu cho misconceptionId: "${misconceptionId}"`);
  }

  const { misconception, knowledge, exercises } = context;

  // 1. Phân lập dữ liệu đầu vào cho từng Agent theo đúng ma trận trách nhiệm
  const boPayload = {
    incorrect_claim: misconception.incorrect_claim,
    error_mechanism: misconception.error_mechanism,
    topic: misconception.topic,
  };

  const triPayload = {
    knowledge: knowledge.map(k => ({
      id: k.id,
      title: k.title,
      statement: k.statement,
      formula_latex: k.formula_latex,
    })),
    correction: misconception.correction,
    counterexample: misconception.counterexample,
  };

  const linhChiPayload = {
    scaffolding: misconception.scaffolding,
  };

  const coLamPayload = {
    resolution_criteria: misconception.resolution_criteria,
    exercises: exercises.map(e => ({
      id: e.id,
      problem: e.problem,
      hints: e.hints,
      bloom_target: e.bloom_target_suggested,
      // BẢO MẬT: Giữ expected_answer và solution_outline ở ngữ cảnh nội bộ, KHÔNG gửi cho học sinh
    })),
  };

  // 2. Thực thi lượt thoại tương tác giữa các tác nhân (A2A Collaboration)
  let boTurn, triTurn, linhChiTurn, coLamTurn;

  if (useLLM && config.openaiApiKey) {
    try {
      // --- Lượt 1: Bo soạn bẫy nhận thức ---
      boTurn = await chatJSON({
        model: config.models.bo,
        systemPrompt: `Bạn là "Bo" — bạn học lém lỉnh, tự tin thái quá trong Roundtable A2A.
Nhiệm vụ: Dựa vào incorrect_claim ("${misconception.incorrect_claim}") và error_mechanism ("${misconception.error_mechanism}") được giao, hãy phát biểu một bẫy nhận thức ngắn (1-2 câu) tự nhiên theo văn phong học sinh (xưng tớ, cậu).
Trích xuất claim bẫy ngắn gọn.
Trả về JSON chuẩn:
{
  "claim": "<phát biểu bẫy cốt lõi ngắn gọn>",
  "dialogue": "<câu Bo thách đố cả lớp>",
  "fallacyType": "${misconception.topic}"
}`,
        userPayload: boPayload,
      });

      // --- Lượt 2: Trí rà soát chéo tính logic & bác bẫy của Bo ---
      triTurn = await chatJSON({
        model: config.models.bo, // gpt-6-sol
        systemPrompt: `Bạn là "Trí" — bạn học Deep Thinker đào sâu bản chất trong buồng họp Roundtable.
Nhiệm vụ: Dựa vào tri thức chuẩn (${knowledge.map(k=>k.statement).join('; ')}) và phản ví dụ ("${misconception.counterexample?.setup} -> ${misconception.counterexample?.result}"), hãy bác bỏ bẫy của Bo một cách logic, chỉ ra điểm sai lầm và đưa ra định hướng giải quyết đúng.
Đặt câu hỏi gợi mở cho học sinh, KHÔNG giải hộ hoàn toàn.
Trả về JSON chuẩn:
{
  "counter_claim": "<kết luận toán học chuẩn>",
  "dialogue": "<câu Trí phản biện Bo và hỏi gợi mở>",
  "geometric_basis": "<căn cứ hình học/đại số chuẩn>"
}`,
        userPayload: {
          ...triPayload,
          bo_claim: boTurn.dialogue,
        },
      });

      // --- Lượt 3: Linh Chi cung cấp gợi ý ghi nhớ từ Scaffolding ---
      linhChiTurn = await chatJSON({
        model: config.models.bo, // gpt-6-sol
        systemPrompt: `Bạn là "Linh Chi" — Note Taker phụ trách sổ tay quy tắc.
Nhiệm vụ: Dựa vào scaffolding gợi ý cấp 1 ("${misconception.scaffolding[0]?.question}") hoặc cấp 2 ("${misconception.scaffolding[1]?.question}"), nhắc nhở ngắn gọn mẹo ghi nhớ cho học sinh.
Trả về JSON chuẩn:
{
  "dialogue": "<câu Linh Chi gợi ý>",
  "hint_level": 1
}`,
        userPayload: {
          ...linhChiPayload,
          debate_context: [boTurn.dialogue, triTurn.dialogue],
        },
      });

      // --- Lượt 4: Cô Lam chốt tiêu chí sư phạm & giao nhiệm vụ ---
      coLamTurn = await chatJSON({
        model: config.models.coLam, // gpt-6.1-sol
        systemPrompt: `Bạn là "Cô Lam" — giáo viên chủ trì sư phạm trong Roundtable.
Nhiệm vụ: Dựa vào resolution_criteria ("${misconception.resolution_criteria.join('; ')}"), chốt lại hướng đi đúng và nhắc nhở học sinh tiêu chí hoàn thành bài.
Trả về JSON chuẩn:
{
  "dialogue": "<câu Cô Lam điều phối và chốt tiêu chí>",
  "resolution_focus": "${misconception.resolution_criteria[0] || ''}"
}`,
        userPayload: {
          ...coLamPayload,
          debate_context: [boTurn.dialogue, triTurn.dialogue, linhChiTurn.dialogue],
        },
      });
    } catch (err) {
      console.warn('[Roundtable] LLM gọi không thành công hoặc timeout, dùng fallback chuẩn từ KB:', err.message);
      boTurn = {
        claim: misconception.incorrect_claim,
        dialogue: `Theo tớ thì: ${misconception.incorrect_claim}`,
      };
      triTurn = {
        counter_claim: misconception.correction,
        dialogue: `Bo nhầm rồi. ${misconception.correction} ${misconception.counterexample ? 'Ví dụ: ' + misconception.counterexample.setup + ' thì ' + misconception.counterexample.result : ''}`,
      };
      linhChiTurn = {
        dialogue: `Gợi ý của Linh Chi: ${misconception.scaffolding[0]?.question || ''}`,
      };
      coLamTurn = {
        dialogue: `Các em hãy nhớ tiêu chí: ${misconception.resolution_criteria.join(', ')}.`,
      };
    }
  } else {
    boTurn = {
      claim: misconception.incorrect_claim,
      dialogue: `Theo tớ thì: ${misconception.incorrect_claim}`,
    };
    triTurn = {
      counter_claim: misconception.correction,
      dialogue: `Bo nhầm rồi. ${misconception.correction} ${misconception.counterexample ? 'Ví dụ: ' + misconception.counterexample.setup + ' thì ' + misconception.counterexample.result : ''}`,
    };
    linhChiTurn = {
      dialogue: `Gợi ý của Linh Chi: ${misconception.scaffolding[0]?.question || ''}`,
    };
    coLamTurn = {
      dialogue: `Các em hãy nhớ tiêu chí: ${misconception.resolution_criteria.join(', ')}.`,
    };
  }

  // 3. Đóng gói bản nháp kịch bản hoàn chỉnh (Draft Script Package)
  const draft = {
    id: `ROUND_${misconception.id}_${Date.now()}`,
    status: 'draft',
    misconception_id: misconception.id,
    knowledge_ids: misconception.knowledge_ids,
    exercise_ids: misconception.exercise_ids,
    source_refs: misconception.source_refs,

    // Kịch bản đối chất của các tác nhân
    dialogues: [
      {
        actor: 'bo',
        role: 'Sparring Partner',
        claim: boTurn.claim || "2a",
        dialogue: boTurn.dialogue,
        intentional_error: true,
      },
      {
        actor: 'tri',
        role: 'Deep Thinker',
        counter_claim: triTurn.counter_claim || "a√2",
        dialogue: triTurn.dialogue,
      },
      {
        actor: 'linhchi',
        role: 'Note Taker',
        dialogue: linhChiTurn.dialogue,
      },
      {
        actor: 'colam',
        role: 'Teacher Socratic',
        dialogue: coLamTurn.dialogue,
      },
    ],

    // Nhánh giải quyết và kiểm soát sư phạm
    resolution_branch: {
      resolution_criteria: misconception.resolution_criteria,
      internal_resolution: exercises[0]?.solution_outline || misconception.correction,
      closure_condition: misconception.resolution_criteria.join('; '),
    },

    // Dữ liệu nội bộ được bảo vệ (Internal Only — Không để lộ ra cho học sinh)
    internal_data: {
      expected_answer: exercises[0]?.expected_answer,
      solution_outline: exercises[0]?.solution_outline,
      counterexample_verification: misconception.counterexample?.verification,
      review_status: misconception.review_status,
    },

    // Hiển thị cho học sinh (Student-Facing View)
    student_view: {
      problem: exercises[0]?.problem,
      bo_claim: boTurn.dialogue,
      scaffolding_hint_1: misconception.scaffolding[0]?.question,
      scaffolding_hint_2: misconception.scaffolding[1]?.question,
    },
  };

  return draft;
}

export default { runRoundtable };
