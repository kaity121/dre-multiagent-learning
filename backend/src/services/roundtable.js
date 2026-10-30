import { getById } from './knowledgeBase.js';
import { chatJSON, chatWithTools } from '../openaiClient.js';
import { executeTool } from '../tools/index.js';
import { config } from '../config.js';

/**
 * Xác định công cụ kiểm chứng tương ứng với từng dạng ngộ nhận theo cấu trúc Subject Pack / data-driven.
 * Không hardcode danh sách mã MISC_VEC_xxx; nếu không có verifier cụ thể thì dùng tool_check_source_grounding.
 */
function getMisconceptionVerifiableConfig(misconception) {
  // 1. Nếu ngộ nhận có khai báo verifier riêng (từ Subject Pack)
  if (misconception?.verifier) {
    return {
      toolType: 'subject_specific',
      toolName: misconception.verifier.toolName,
      params: misconception.verifier.params || {},
    };
  }

  // 2. Tương thích ngược: Phép toán trong hình lập phương / cộng độ dài
  if ((misconception.tags || []).includes('cube') || misconception.id === 'MISC_VEC_005') {
    return {
      toolType: 'vector_algebra',
      toolName: 'tool_verify_vector_algebra',
      params: { shape: 'cube', side: 'a', expr: "|BC + DD'|", defaultClaim: '2a' },
    };
  }
  // 3. Quy tắc hình hộp
  if ((misconception.tags || []).includes('box_rule') || misconception.id === 'MISC_VEC_006') {
    return {
      toolType: 'vector_algebra',
      toolName: 'tool_verify_vector_algebra',
      params: { shape: 'cube', side: 'a', expr: "|AB + AD + AA'|", defaultClaim: 'a\\sqrt{3}' },
    };
  }

  // 4. Mặc định cho môn phi toán hoặc ngộ nhận chung: dùng tool kiểm chứng theo nguồn bài giảng (PR #44)
  return {
    toolType: 'source_grounding',
    toolName: 'tool_check_source_grounding',
    params: { claim: misconception.incorrect_claim },
  };
}

/**
 * Buồng họp A2A Scriptwriting Roundtable có hỗ trợ Deterministic Tools & Function Calling.
 */
export async function runRoundtable(misconceptionId = 'MISC_VEC_005', { useLLM = true } = {}) {
  // Lấy dữ liệu chuẩn hoá từ Knowledge Base / Subject Pack
  const context = getById(misconceptionId);
  if (!context) {
    throw new Error(`Không tìm thấy dữ liệu cho misconceptionId: "${misconceptionId}"`);
  }

  const { misconception, knowledge, exercises } = context;
  const toolConfig = getMisconceptionVerifiableConfig(misconception);

  // Danh sách lưu trữ tiến trình suy luận (A2A Reasoning Stream)
  const reasoningEvents = [];
  const runId = `run_${Date.now()}`;

  function recordEvent(eventType, agentId, agentDisplayName, content, toolCall = null) {
    reasoningEvents.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      runId,
      eventType,
      agentId,
      agentDisplayName,
      content,
      toolCall,
      timestamp: new Date().toISOString(),
    });
  }

  let boTurn, triTurn, linhChiTurn, coLamTurn;

  if (useLLM && config.hasOpenAIKey) {
    try {
      // BƯỚC 1: BO PHÁT BIỂU BẪY NGỘ NHẬN
      const boPrompt = `
Bạn là Bo (học sinh hệ trực giác, hay mắc bẫy ngộ nhận toán học).
Hãy nêu phát biểu của bạn về vấn đề: "${misconception.incorrect_claim}".
Giải thích lý do trực giác khiến bạn nghĩ như vậy dựa trên cơ chế lỗi: "${misconception.error_mechanism}".
Trả về kết quả dưới dạng JSON { "claim": string, "dialogue": string }.
`;
      const boRes = await chatJSON({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: boPrompt }],
      });
      boTurn = boRes || {
        claim: toolConfig.params?.defaultClaim || misconception.incorrect_claim,
        dialogue: `Theo tớ thì: ${misconception.incorrect_claim}!`,
      };
      recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boTurn.dialogue);

      // BƯỚC 2: TRÍ PHẢN BÁC VÀ GỌI DETERMINISTIC TOOL KIỂM CHỨNG
      const triSystemPrompt = `
Bạn là Trí (học sinh hệ logic, phản biện sắc bén, luôn đòi hỏi kiểm chứng chặt chẽ).
Nhiệm vụ của bạn là kiểm chứng phát biểu của Bo: "${boTurn.claim}" dựa trên tri thức:
- Định lý/Công thức: ${knowledge.map(k => k.statement).join('; ')}
- Lời giải đúng: ${misconception.correction}
Bạn có các công cụ tính toán chính xác để kiểm chứng toán học hoặc tra cứu. Hãy gọi công cụ nếu cần thiết.
`;

      const triMessages = [
        { role: 'system', content: triSystemPrompt },
        { role: 'user', content: `Bo vừa nói: "${boTurn.dialogue}". Hãy kiểm chứng và phản biện.` },
      ];

      const triRes = await chatWithTools({
        model: 'gpt-4o-mini',
        messages: triMessages,
      });

      if (triRes.toolCalls && triRes.toolCalls.length > 0) {
        for (const tc of triRes.toolCalls) {
          const fnName = tc.function.name;
          const fnArgs = JSON.parse(tc.function.arguments || '{}');
          const toolResult = executeTool(fnName, fnArgs);
          recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', `Thực thi ${fnName}`, toolResult);
          recordEvent('tool_result', 'tri', 'Trí (Hệ 2 - Logic)', `Kết quả: ${toolResult.isValid ? 'Hợp lệ' : 'Bác bỏ'}`, toolResult);
        }
      }

      triTurn = {
        counter_claim: misconception.correction,
        dialogue: triRes.text || `Bo nhầm rồi! Đáp án đúng phải là: ${misconception.correction}`,
        geometric_basis: misconception.counterexample?.geometric_basis || misconception.correction,
      };
      recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);

      // BƯỚC 3: LINH CHI NOTE TAKER
      linhChiTurn = {
        dialogue: `Linh Chi note lại nhé: ${misconception.scaffolding[0]?.question || 'Nhớ áp dụng định lý đúng trước khi tính toán!'}`,
      };
      recordEvent('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTurn.dialogue);

      // BƯỚC 4: CÔ LAM THẨM ĐỊNH VÀ CHỐT CHECKPOINT
      const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
        question: exercises[0]?.problem || misconception.scaffolding[0]?.question,
        expected_points: misconception.resolution_criteria,
      });
      recordEvent('tool_call', 'colam', 'Cô Lam (Director)', 'Thẩm định Bloom cho checkpoint', bloomToolCall);
      recordEvent('tool_result', 'colam', 'Cô Lam (Director)', `Mức Bloom ${bloomToolCall.output?.level || 'Understand'}`, bloomToolCall);

      coLamTurn = {
        dialogue: `Trí chỉ ra rất chuẩn xác. Các em hãy chú ý: ${misconception.resolution_criteria.join(', ')}.`,
      };
      recordEvent('checkpoint_created', 'colam', 'Cô Lam (Director)', coLamTurn.dialogue);

    } catch (err) {
      console.warn('Lỗi luồng LLM trong Roundtable, chuyển sang Fallback:', err);

      // Fallback: Chạy theo đúng thứ tự nhân quả
      const boClaim = toolConfig.params?.defaultClaim || misconception.incorrect_claim;
      boTurn = {
        claim: boClaim,
        dialogue: misconception.id === 'MISC_VEC_005'
          ? `Theo tớ thì cạnh bằng a nên |BC + DD'| = a + a = 2a chứ còn gì nữa!`
          : `Theo tớ thì: ${misconception.incorrect_claim}!`,
      };
      recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boTurn.dialogue);

      // Thực thi tool phù hợp
      let vectorToolCall;
      if (toolConfig.toolType === 'vector_algebra' || toolConfig.toolType === 'subject_specific') {
        vectorToolCall = executeTool(toolConfig.toolName || 'tool_verify_vector_algebra', {
          shape: toolConfig.params.shape || 'cube',
          side: toolConfig.params.side || 'a',
          expr: toolConfig.params.expr,
          claim: boClaim,
        });
      } else {
        vectorToolCall = executeTool(toolConfig.toolName || 'tool_check_source_grounding', {
          claim: boClaim,
        });
      }

      recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', `Kiểm chứng ${toolConfig.toolName}`, vectorToolCall);
      recordEvent('tool_result', 'tri', 'Trí (Hệ 2 - Logic)', `Kết quả kiểm chứng: ${vectorToolCall.isValid ? 'Hợp lệ' : 'Bác bỏ'}`, vectorToolCall);

      triTurn = {
        counter_claim: vectorToolCall.output?.correct || misconception.correction,
        dialogue: `Bo nhầm to rồi! Tớ vừa kiểm tra hệ thức: ${vectorToolCall.output?.reason || misconception.correction}. Đáp án đúng phải là ${vectorToolCall.output?.correct || misconception.correction}!`,
        geometric_basis: vectorToolCall.output?.reason || misconception.correction,
      };
      recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);

      linhChiTurn = {
        dialogue: `Linh Chi note lại nhé: ${misconception.scaffolding[0]?.question || 'Nhớ kiểm chứng kỹ càng trước khi đưa ra kết luận!'}`,
      };
      recordEvent('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTurn.dialogue);

      const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
        question: exercises[0]?.problem || misconception.scaffolding[0]?.question,
        expected_points: misconception.resolution_criteria,
      });
      recordEvent('tool_call', 'colam', 'Cô Lam (Director)', 'Thẩm định Bloom cho checkpoint', bloomToolCall);
      recordEvent('tool_result', 'colam', 'Cô Lam (Director)', `Mức Bloom ${bloomToolCall.output?.level || 'Understand'}`, bloomToolCall);

      coLamTurn = {
        dialogue: `Trí chỉ ra rất chuẩn xác với kết quả ${triTurn.counter_claim}. Các em hãy chú ý: ${misconception.resolution_criteria.join(', ')}.`,
      };
      recordEvent('checkpoint_created', 'colam', 'Cô Lam (Director)', coLamTurn.dialogue);
    }
  } else {
    // Chế độ không dùng LLM (useLLM = false): Chạy hoàn toàn Deterministic Tools
    const boClaim = toolConfig.params?.defaultClaim || misconception.incorrect_claim;
    boTurn = {
      claim: boClaim,
      dialogue: misconception.id === 'MISC_VEC_005'
        ? `Theo tớ thì cạnh bằng a nên |BC + DD'| = a + a = 2a!`
        : `Theo tớ thì: ${misconception.incorrect_claim}!`,
    };
    recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boTurn.dialogue);

    let vectorToolCall;
    if (toolConfig.toolType === 'vector_algebra' || toolConfig.toolType === 'subject_specific') {
      vectorToolCall = executeTool(toolConfig.toolName || 'tool_verify_vector_algebra', {
        shape: toolConfig.params.shape || 'cube',
        side: toolConfig.params.side || 'a',
        expr: toolConfig.params.expr,
        claim: boClaim,
      });
    } else {
      vectorToolCall = executeTool(toolConfig.toolName || 'tool_check_source_grounding', {
        claim: boClaim,
      });
    }

    recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', `Kiểm chứng ${toolConfig.toolName}`, vectorToolCall);
    recordEvent('tool_result', 'tri', 'Trí (Hệ 2 - Logic)', `Kết quả: ${vectorToolCall.isValid ? 'Hợp lệ' : 'Bác bỏ'}`, vectorToolCall);

    triTurn = {
      counter_claim: vectorToolCall.output?.correct || misconception.correction,
      dialogue: `Bo sai rồi! Đáp án chính xác phải là ${vectorToolCall.output?.correct || misconception.correction}. Lý do: ${vectorToolCall.output?.reason || misconception.correction}`,
      geometric_basis: vectorToolCall.output?.reason || misconception.correction,
    };
    recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);

    linhChiTurn = {
      dialogue: `Gợi ý từ Linh Chi: ${misconception.scaffolding[0]?.question || 'Hãy xem lại định nghĩa và tính chất cơ bản!'}`,
    };
    recordEvent('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTurn.dialogue);

    const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
      question: exercises[0]?.problem || misconception.scaffolding[0]?.question,
      expected_points: misconception.resolution_criteria,
    });
    recordEvent('tool_call', 'colam', 'Cô Lam (Director)', 'Thẩm định Bloom cho checkpoint', bloomToolCall);
    recordEvent('tool_result', 'colam', 'Cô Lam (Director)', `Mức Bloom ${bloomToolCall.output?.level || 'Understand'}`, bloomToolCall);

    coLamTurn = {
      dialogue: `Cô đồng ý với phản biện của Trí. Tiêu chí cốt lõi: ${misconception.resolution_criteria.join(', ')}.`,
    };
    recordEvent('checkpoint_created', 'colam', 'Cô Lam (Director)', coLamTurn.dialogue);
  }

  // Cấu trúc Lesson Draft chuẩn hoá (DRELessonSchema)
  const draft = {
    lessonId: `lesson_${misconceptionId.toLowerCase()}`,
    title: `Buồng họp xử lý ngộ nhận: ${misconception.incorrect_claim}`,
    grade: misconception.grade || 12,
    topic: misconception.topic || 'vector_geometry',
    misconceptionId,
    pedagogicalGoal: `Giúp học sinh vượt qua bẫy trực giác "${misconception.incorrect_claim}" thông qua phản ví dụ và suy luận logic.`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    scenarios: [
      {
        id: `sc_${Date.now()}_1`,
        title: 'Màn tranh biện mở đầu về bẫy ngộ nhận',
        events: reasoningEvents,
        dialogue: [
          { author: 'Bo', text: boTurn.dialogue },
          { author: 'Trí', text: triTurn.dialogue },
          { author: 'Linh Chi', text: linhChiTurn.dialogue },
          { author: 'Cô Lam', text: coLamTurn.dialogue },
        ],
      },
    ],
    checkpoints: [
      {
        id: `cp_${Date.now()}_1`,
        timestamp: '37:13',
        type: 'concept_check',
        prompt: exercises[0]?.problem || `Hãy giải thích vì sao phát biểu "${misconception.incorrect_claim}" là sai lầm?`,
        options: [
          { text: `Độ dài đúng phải là ${triTurn.counter_claim}`, isCorrect: true },
          { text: `Đúng như Bo nói, kết quả là ${boTurn.claim}`, isCorrect: false },
        ],
        resolutionCriteria: misconception.resolution_criteria,
      },
    ],
    internal_data: {
      source_misconception: misconception,
      source_knowledge: knowledge,
      resolution_criteria: misconception.resolution_criteria,
      exercises,
    },
  };

  return draft;
}

export default { runRoundtable };
