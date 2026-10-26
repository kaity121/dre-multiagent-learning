import { getById } from './knowledgeBase.js';
import { chatJSON, chatWithTools } from '../openaiClient.js';
import { executeTool } from '../tools/index.js';
import { config } from '../config.js';

/**
 * Buồng họp A2A Scriptwriting Roundtable có hỗ trợ Deterministic Tools & Function Calling.
 *
 * Quy tắc phân chia dữ liệu nghiêm ngặt theo vai trò (Context Isolation Guardrails):
 * - Bo:       incorrect_claim, error_mechanism
 * - Trí:      knowledge, correction, counterexample + Deterministic Tools (kiểm chứng toán)
 * - Linh Chi: scaffolding
 * - Cô Lam:   resolution_criteria, exercises + Deterministic Tools (thẩm định Bloom, nhịp timeline)
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

  // Mảng lưu vết các sự kiện suy luận và lượt gọi tool
  const reasoningEvents = [];
  const recordedToolCalls = [];

  // Helper ghi nhận sự kiện suy luận
  function recordEvent(eventType, agentId, agentDisplayName, content, toolCall = null) {
    const event = {
      id: `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      agentId,
      agentDisplayName,
      content,
      toolCall: toolCall || undefined,
      timestamp: new Date().toISOString(),
    };
    reasoningEvents.push(event);
    if (toolCall) {
      recordedToolCalls.push(toolCall);
    }
  }

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
  "claim": "<phát biểu bẫy cốt lõi ngắn gọn, ví dụ: 2a>",
  "dialogue": "<câu Bo thách đố cả lớp>",
  "fallacyType": "${misconception.topic}"
}`,
        userPayload: boPayload,
      });

      recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boTurn.dialogue);

      // --- Lượt 2: Trí kích hoạt Tool xác thực toán học & bác bẫy của Bo ---
      const triPrompt = `Bạn là "Trí" — bạn học Deep Thinker đào sâu bản chất trong buồng họp Roundtable.
Bo vừa phát biểu: "${boTurn.dialogue}" với claim là "${boTurn.claim || '2a'}".
BẠN BẮT BUỘC PHẢI DÙNG TOOL "tool_verify_vector_algebra" để kiểm chứng claim này trước khi phát biểu!
- expr: "|BC + DD'|"
- claim: "${boTurn.claim || '2a'}"

Sau khi nhận kết quả từ tool:
- Nếu tool báo isValid = false: Hãy dựa vào lý do và kết quả đúng (correct) từ tool để BÁC BỎ dứt khoát bẫy của Bo. Chỉ rõ Bo sai ở đâu và gợi ý cho học sinh tự sửa.
Trả về JSON chuẩn:
{
  "counter_claim": "<kết luận toán học chuẩn từ tool, ví dụ: a\\sqrt{2}>",
  "dialogue": "<câu Trí trích dẫn kết quả tool để bác bẫy Bo và đặt câu hỏi gợi mở>",
  "geometric_basis": "<căn cứ hình học từ tool reason>"
}`;

      const triResponse = await chatWithTools({
        model: config.models.bo, // hoặc config.models.tri
        systemPrompt: triPrompt,
        userPayload: {
          ...triPayload,
          bo_claim: boTurn.dialogue,
          claim_value: boTurn.claim || '2a',
        },
      });

      triTurn = triResponse.result;

      // Ghi nhận tool calls của Trí
      for (const tc of triResponse.toolCalls) {
        recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', `Kích hoạt tool ${tc.toolName} để kiểm chứng claim "${tc.input.claim}"`, tc);
      }

      recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);

      // --- Lượt 3: Linh Chi cung cấp gợi ý ghi nhớ từ Scaffolding ---
      linhChiTurn = await chatJSON({
        model: config.models.bo,
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

      recordEvent('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTurn.dialogue);

      // --- Lượt 4: Cô Lam thẩm định sư phạm qua Deterministic Tools & chốt bài giảng ---
      const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
        question: exercises[0]?.problem || misconception.scaffolding[0]?.question,
        expected_points: misconception.resolution_criteria,
      });
      recordEvent('tool_call', 'colam', 'Cô Lam (Director)', `Thẩm định Bloom cho bài tập: đạt mức ${bloomToolCall.output.level}`, bloomToolCall);

      const timelineToolCall = executeTool('tool_timeline_collision_checker', {
        events: [
          { id: 'bo_trap', at_s: 35, actor_id: 'bo', type: 'comment' },
          { id: 'tri_rebuttal', at_s: 60, actor_id: 'tri', type: 'comment' },
          { id: 'colam_checkpoint', at_s: 90, actor_id: 'colam', type: 'checkpoint' },
        ],
        minGapS: 20,
      });
      recordEvent('tool_call', 'colam', 'Cô Lam (Director)', `Kiểm tra nhịp thời gian bài giảng: ${timelineToolCall.output.reason}`, timelineToolCall);

      coLamTurn = await chatJSON({
        model: config.models.coLam,
        systemPrompt: `Bạn là "Cô Lam" — giáo viên chủ trì sư phạm trong Roundtable.
Nhiệm vụ: Chốt lại hướng đi đúng và nhắc nhở học sinh tiêu chí hoàn thành bài.
Dữ liệu thẩm định: Bài tập đạt mức Bloom "${bloomToolCall.output.level}". Nhịp timeline: ${timelineToolCall.output.reason}.
Trả về JSON chuẩn:
{
  "dialogue": "<câu Cô Lam điều phối và chốt tiêu chí sư phạm>",
  "resolution_focus": "${misconception.resolution_criteria[0] || ''}"
}`,
        userPayload: {
          ...coLamPayload,
          bloom_evaluation: bloomToolCall.output,
          debate_context: [boTurn.dialogue, triTurn.dialogue, linhChiTurn.dialogue],
        },
      });

      recordEvent('checkpoint_created', 'colam', 'Cô Lam (Director)', coLamTurn.dialogue);

    } catch (err) {
      console.warn('[Roundtable] LLM gọi không thành công hoặc lỗi, chuyển sang fallback có thực thi tool nội bộ:', err.message);

      // Fallback: Tự động chạy tool thuần túy để đảm bảo dữ liệu luôn đầy đủ
      const boClaim = '2a';
      const vectorToolCall = executeTool('tool_verify_vector_algebra', {
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: boClaim,
      });

      const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
        question: exercises[0]?.problem || misconception.scaffolding[0]?.question,
        expected_points: misconception.resolution_criteria,
      });

      recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', 'Kiểm chứng đại số vectơ Ví dụ 3', vectorToolCall);
      recordEvent('tool_call', 'colam', 'Cô Lam (Director)', 'Thẩm định Bloom cho checkpoint', bloomToolCall);

      boTurn = {
        claim: boClaim,
        dialogue: `Theo tớ thì cạnh bằng a nên |BC + DD'| = a + a = 2a chứ còn gì nữa!`,
      };

      triTurn = {
        counter_claim: vectorToolCall.output.correct || 'a\\sqrt{2}',
        dialogue: `Bo nhầm to rồi! Tớ vừa kiểm tra hệ thức: ${vectorToolCall.output.reason}. Đáp án đúng phải là ${vectorToolCall.output.correct}!`,
        geometric_basis: vectorToolCall.output.reason,
      };

      linhChiTurn = {
        dialogue: `Linh Chi note lại nhé: ${misconception.scaffolding[0]?.question || 'Muốn cộng hai vectơ, ta phải đưa về chung gốc hoặc áp dụng quy tắc hình bình hành / tam giác!'}`,
      };

      coLamTurn = {
        dialogue: `Trí chỉ ra rất chuẩn xác. Các em hãy chú ý: ${misconception.resolution_criteria.join(', ')}.`,
      };

      recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boTurn.dialogue);
      recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);
      recordEvent('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTurn.dialogue);
      recordEvent('checkpoint_created', 'colam', 'Cô Lam (Director)', coLamTurn.dialogue);
    }
  } else {
    // Chế độ không dùng LLM (useLLM = false): Chạy hoàn toàn Deterministic Tools
    const boClaim = '2a';
    const vectorToolCall = executeTool('tool_verify_vector_algebra', {
      shape: 'cube',
      side: 'a',
      expr: "|BC + DD'|",
      claim: boClaim,
    });

    const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
      question: exercises[0]?.problem || misconception.scaffolding[0]?.question,
      expected_points: misconception.resolution_criteria,
    });

    recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', `Theo tớ thì cạnh bằng a nên |BC + DD'| = a + a = 2a!`);
    recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', 'Kiểm chứng đại số vectơ Ví dụ 3', vectorToolCall);

    boTurn = {
      claim: boClaim,
      dialogue: `Theo tớ thì cạnh bằng a nên |BC + DD'| = a + a = 2a!`,
    };

    triTurn = {
      counter_claim: vectorToolCall.output.correct || 'a\\sqrt{2}',
      dialogue: `Bo nhầm to rồi! Tớ vừa kiểm tra: ${vectorToolCall.output.reason}. Đáp án chuẩn phải là ${vectorToolCall.output.correct}!`,
      geometric_basis: vectorToolCall.output.reason,
    };

    recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);

    linhChiTurn = {
      dialogue: `Linh Chi note lại nhé: ${misconception.scaffolding[0]?.question || 'Nhớ đưa về chung gốc trước khi cộng!'}`,
    };
    recordEvent('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTurn.dialogue);

    recordEvent('tool_call', 'colam', 'Cô Lam (Director)', 'Thẩm định Bloom cho checkpoint', bloomToolCall);

    coLamTurn = {
      dialogue: `Trí chỉ ra rất chuẩn xác. Các em hãy chú ý: ${misconception.resolution_criteria.join(', ')}.`,
    };
    recordEvent('checkpoint_created', 'colam', 'Cô Lam (Director)', coLamTurn.dialogue);
  }

  // 3. Đóng gói bản nháp kịch bản hoàn chỉnh (Draft Script Package)
  const draft = {
    id: `ROUND_${misconception.id}_${Date.now()}`,
    status: 'draft',
    misconception_id: misconception.id,
    knowledge_ids: misconception.knowledge_ids,
    exercise_ids: misconception.exercise_ids,
    source_refs: misconception.source_refs,

    // Danh sách các lượt gọi Deterministic Tool chuẩn contract pipeline.ts
    deterministic_tool_calls: recordedToolCalls,

    // Chuỗi sự kiện suy luận phục vụ stream #10 và UI #14
    reasoning_events: reasoningEvents,

    // Kịch bản đối chất của các tác nhân
    dialogues: [
      {
        actor: 'bo',
        role: 'Sparring Partner',
        claim: boTurn.claim || '2a',
        dialogue: boTurn.dialogue,
        intentional_error: true,
      },
      {
        actor: 'tri',
        role: 'Deep Thinker',
        counter_claim: triTurn.counter_claim || 'a\\sqrt{2}',
        dialogue: triTurn.dialogue,
        geometric_basis: triTurn.geometric_basis,
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
