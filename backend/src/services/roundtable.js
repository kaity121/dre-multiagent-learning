import { getById } from './knowledgeBase.js';
import { chatJSON, chatWithTools } from '../openaiClient.js';
import { executeTool } from '../tools/index.js';
import { config } from '../config.js';

/**
 * Xác định công cụ kiểm chứng tương ứng với từng dạng ngộ nhận
 */
export function getMisconceptionVerifiableConfig(misconceptionInput) {
  const misconception = misconceptionInput?.misconception || misconceptionInput || {};
  // 1. Phép toán trong hình lập phương / cộng độ dài
  if (misconception.id === 'MISC_VEC_005' || (misconception.tags || []).includes('cube')) {
    return {
      toolType: 'vector_algebra',
      toolName: 'tool_verify_vector_algebra',
      params: { shape: 'cube', side: 'a', expr: "|BC + DD'|", defaultClaim: '2a' },
    };
  }
  // 2. Quy tắc hình hộp
  if (misconception.id === 'MISC_VEC_006' || (misconception.tags || []).includes('box_rule')) {
    return {
      toolType: 'vector_algebra',
      toolName: 'tool_verify_vector_algebra',
      params: { shape: 'cube', side: 'a', expr: "|AB + AD + AA'|", defaultClaim: 'a\\sqrt{3}' },
    };
  }
  // 3. MISC_VEC_017: Đảo một vectơ không đổi góc (góc bù: angle(-u, v) = 180° - theta)
  if (misconception.id === 'MISC_VEC_017') {
    return {
      toolType: 'dot_product',
      toolName: 'tool_calculate_dot_product',
      params: { uMag: 2, vMag: 3, angleDeg: 60, claimValue: '60', claimType: 'angle', reverseU: true, isReversed: true },
    };
  }
  // 4. MISC_VEC_020: Bình phương tổng bỏ số hạng chéo (|u+v|^2 = |u|^2 + |v|^2 + 2u.v)
  if (misconception.id === 'MISC_VEC_020' || (misconception.tags || []).includes('cross_term')) {
    return {
      toolType: 'dot_product',
      toolName: 'tool_calculate_dot_product',
      params: { uMag: 2, vMag: 3, angleDeg: 60, claimValue: '13', claimType: 'norm_sum_squared' },
    };
  }
  // 5. MISC_VEC_018, MISC_VEC_019 & các dạng tích vô hướng / góc khác
  if (['MISC_VEC_018', 'MISC_VEC_019'].includes(misconception.id) ||
      (misconception.tags || []).some(t => ['dot_product', 'vector_angle', 'zero_angle'].includes(t))) {
    let u = 2, v = 3, theta = 120, claim = 'không âm';
    if (misconception.id === 'MISC_VEC_018') {
      u = 0; v = 2; theta = 0; claim = '0';
    } else if (misconception.id === 'MISC_VEC_019') {
      u = 2; v = 3; theta = 120; claim = 'không âm';
    }
    return {
      toolType: 'dot_product',
      toolName: 'tool_calculate_dot_product',
      params: { uMag: u, vMag: v, angleDeg: theta, claimValue: claim, claimType: misconception.id === 'MISC_VEC_018' ? 'angle' : 'dot_product' },
    };
  }
  // 6. Mặc định cho các chủ đề khác (vectơ không, trọng tâm...)
  return {
    toolType: 'kb_rag',
    toolName: 'tool_query_misconception_kb',
    params: { misconceptionId: misconception.id, defaultClaim: misconception.incorrect_claim },
  };
}

/**
 * Xây dựng prompt và forced tool choice cho Trí dựa trên bẫy của Bo và cấu hình tool
 */
export function buildTriPrompt({ misconception: misconceptionInput, boTurn, toolConfig }) {
  const misconception = misconceptionInput?.misconception || misconceptionInput || {};
  let triPrompt = '';
  let forcedToolChoice = null;

  if (toolConfig.toolType === 'vector_algebra') {
    const expr = toolConfig.params.expr;
    const claim = boTurn.claim || toolConfig.params.defaultClaim;
    const sideLine = toolConfig.params.side ? `\n- side: "${toolConfig.params.side}"` : '';
    triPrompt = `Bạn là "Trí" — bạn học Deep Thinker đào sâu bản chất trong buồng họp Roundtable.
Bo vừa phát biểu: "${boTurn.dialogue}" với claim là "${claim}".
BẠN BẮT BUỘC PHẢI DÙNG TOOL "tool_verify_vector_algebra" để kiểm chứng claim này trước khi phát biểu!
- expr: "${expr}"
- claim: "${claim}"${sideLine}

Sau khi nhận kết quả từ tool:
- Dựa vào kết quả đúng (correct) và căn cứ hình học từ tool để BÁC BỎ dứt khoát bẫy của Bo. Chỉ rõ Bo sai ở đâu và gợi ý cho học sinh tự sửa.
Trả về JSON chuẩn:
{
  "counter_claim": "<kết luận toán học chuẩn từ tool, ví dụ: a\\sqrt{2}>",
  "dialogue": "<câu Trí trích dẫn kết quả tool để bác bẫy Bo và đặt câu hỏi gợi mở>",
  "geometric_basis": "<căn cứ hình học từ tool reason>"
}`;
    forcedToolChoice = { type: 'function', function: { name: 'tool_verify_vector_algebra' } };
  } else if (toolConfig.toolType === 'dot_product') {
    const claim = boTurn.claim || toolConfig.params.claimValue;
    const reverseULine = (toolConfig.params.reverseU || toolConfig.params.isReversed) ? '\n- reverseU: true' : '';
    triPrompt = `Bạn là "Trí" — bạn học Deep Thinker đào sâu bản chất trong buồng họp Roundtable.
Bo vừa phát biểu: "${boTurn.dialogue}" với claim là "${claim}".
BẠN BẮT BUỘC PHẢI DÙNG TOOL "tool_calculate_dot_product" để kiểm chứng claim này trước khi phát biểu!
- uMag: ${toolConfig.params.uMag}
- vMag: ${toolConfig.params.vMag}
- angleDeg: ${toolConfig.params.angleDeg}
- claimValue: "${claim}"
- claimType: "${toolConfig.params.claimType || 'dot_product'}"${reverseULine}

Sau khi nhận kết quả từ tool:
- Bác bỏ sai lầm của Bo dựa trên kết quả tính toán từ tool và nêu rõ bản chất hình học.
Trả về JSON chuẩn:
{
  "counter_claim": "<kết luận toán học chuẩn từ tool>",
  "dialogue": "<câu Trí trích dẫn kết quả tool để bác bẫy Bo>",
  "geometric_basis": "<căn cứ từ tool reason>"
}`;
    forcedToolChoice = { type: 'function', function: { name: 'tool_calculate_dot_product' } };
  } else {
    triPrompt = `Bạn là "Trí" — bạn học Deep Thinker đào sâu bản chất trong buồng họp Roundtable.
Bo vừa phát biểu: "${boTurn.dialogue}".
BẠN BẮT BUỘC PHẢI DÙNG TOOL "tool_query_misconception_kb" với misconceptionId: "${misconception.id}" để kiểm chứng chân lý bài toán.
Sau khi nhận kết quả từ tool:
- Bác bỏ bẫy sai của Bo dựa trên tri thức chuẩn xác và phản ví dụ.
Trả về JSON chuẩn:
{
  "counter_claim": "<kết luận toán học chuẩn từ tri thức SGK>",
  "dialogue": "<câu Trí phản biện Bo và gợi ý hướng đi đúng>",
  "geometric_basis": "<căn cứ kiến thức toán>"
}`;
    forcedToolChoice = { type: 'function', function: { name: 'tool_query_misconception_kb' } };
  }

  return { triPrompt, forcedToolChoice };
}

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
  const toolConfig = getMisconceptionVerifiableConfig(misconception);

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
    if (toolCall && eventType === 'tool_call') {
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
  "claim": "<phát biểu bẫy cốt lõi ngắn gọn>",
  "dialogue": "<câu Bo thách đố cả lớp>",
  "fallacyType": "${misconception.topic}"
}`,
        userPayload: boPayload,
      });

      recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boTurn.dialogue);

      // --- Lượt 2: Trí kích hoạt Tool xác thực toán học & bác bẫy của Bo ---
      const { triPrompt, forcedToolChoice } = buildTriPrompt({ misconception, boTurn, toolConfig });

      const triResponse = await chatWithTools({
        model: config.models.tri || config.models.bo,
        systemPrompt: triPrompt,
        tool_choice: forcedToolChoice,
        userPayload: {
          ...triPayload,
          bo_claim: boTurn.dialogue,
          claim_value: boTurn.claim || toolConfig.params?.defaultClaim || toolConfig.params?.claimValue || '',
        },
      });

      triTurn = triResponse.result;

      // Ghi nhận tool calls và tool results của Trí theo đúng thứ tự nhân quả
      for (const tc of triResponse.toolCalls) {
        recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', `Kích hoạt tool ${tc.toolName}`, tc);
        recordEvent('tool_result', 'tri', 'Trí (Hệ 2 - Logic)', `Kết quả kiểm chứng từ ${tc.toolName}: ${JSON.stringify(tc.output)}`, tc);
      }

      recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);

      // --- Lượt 3: Linh Chi cung cấp gợi ý ghi nhớ từ Scaffolding ---
      linhChiTurn = await chatJSON({
        model: config.models.linhChi || config.models.bo,
        systemPrompt: `Bạn là "Linh Chi" — Note Taker phụ trách sổ tay quy tắc.
Nhiệm vụ: Dựa vào scaffolding gợi ý cấp 1 ("${misconception.scaffolding[0]?.question || ''}") hoặc cấp 2 ("${misconception.scaffolding[1]?.question || ''}"), nhắc nhở ngắn gọn mẹo ghi nhớ cho học sinh.
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
      recordEvent('tool_result', 'colam', 'Cô Lam (Director)', `Mức Bloom ${bloomToolCall.output.level} (Điểm: ${bloomToolCall.output.score}/6)`, bloomToolCall);

      const timelineToolCall = executeTool('tool_timeline_collision_checker', {
        events: [
          { id: 'bo_trap', at_s: 35, actor_id: 'bo', type: 'comment' },
          { id: 'tri_rebuttal', at_s: 60, actor_id: 'tri', type: 'comment' },
          { id: 'colam_checkpoint', at_s: 90, actor_id: 'colam', type: 'checkpoint' },
        ],
        minGapS: 20,
      });
      recordEvent('tool_call', 'colam', 'Cô Lam (Director)', `Kiểm tra nhịp thời gian bài giảng: ${timelineToolCall.output.reason}`, timelineToolCall);
      recordEvent('tool_result', 'colam', 'Cô Lam (Director)', `Kết quả kiểm tra timeline: ${timelineToolCall.isValid ? 'Hợp lệ' : 'Cần điều chỉnh'}`, timelineToolCall);

      coLamTurn = await chatJSON({
        model: config.models.coLam,
        systemPrompt: `Bạn là "Cô Lam" — giáo viên chủ trì sư phạm trong Roundtable.
Nhiệm vụ: Chốt lại hướng đi đúng theo phương pháp Socratic ("nudges, not answers").
Lưu ý quan trọng:
1. Đồng bộ ký hiệu tham số theo Trí (${triTurn.counter_claim || 'a\\sqrt{2}'}), không tự đổi sang số khác.
2. Nêu tiêu chí hoàn thành bài tập, không giải trọn vẹn đáp án ngay mà để học sinh tự làm.
Trả về JSON chuẩn:
{
  "dialogue": "<câu Cô Lam điều phối và chốt tiêu chí sư phạm>",
  "resolution_focus": "${misconception.resolution_criteria[0] || ''}"
}`,
        userPayload: {
          ...coLamPayload,
          tri_verification: triTurn,
          bloom_evaluation: bloomToolCall.output,
          debate_context: [boTurn.dialogue, triTurn.dialogue, linhChiTurn.dialogue],
        },
      });

      recordEvent('checkpoint_created', 'colam', 'Cô Lam (Director)', coLamTurn.dialogue);

    } catch (err) {
      console.warn('[Roundtable] LLM gọi không thành công hoặc lỗi, chuyển sang fallback có thực thi tool nội bộ:', err.message);

      // Fallback: Chạy theo đúng thứ tự nhân quả
      const boClaim = toolConfig.params?.defaultClaim || toolConfig.params?.claimValue || misconception.incorrect_claim;
      let boDialogue = `Theo tớ thì: ${misconception.incorrect_claim}!`;
      if (misconception.id === 'MISC_VEC_005') {
        boDialogue = `Theo tớ thì cạnh bằng a nên |BC + DD'| = a + a = 2a chứ còn gì nữa!`;
      } else if (misconception.id === 'MISC_VEC_017') {
        boDialogue = `Góc giữa u và v là 60° thì đảo một vectơ v thành -v thì góc giữa u và -v vẫn là 60° chứ!`;
      } else if (misconception.id === 'MISC_VEC_020') {
        boDialogue = `Theo định lý Pythagore thì |u + v|^2 = |u|^2 + |v|^2 = 2^2 + 3^2 = 13!`;
      }

      boTurn = {
        claim: boClaim,
        dialogue: boDialogue,
      };
      recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boTurn.dialogue);

      // Thực thi tool phù hợp
      let vectorToolCall;
      if (toolConfig.toolType === 'vector_algebra') {
        vectorToolCall = executeTool('tool_verify_vector_algebra', {
          shape: toolConfig.params.shape || 'cube',
          side: toolConfig.params.side || 'a',
          expr: toolConfig.params.expr,
          claim: boClaim,
        });
      } else if (toolConfig.toolType === 'dot_product') {
        vectorToolCall = executeTool('tool_calculate_dot_product', {
          ...toolConfig.params,
          claimValue: boClaim,
        });
      } else {
        vectorToolCall = executeTool('tool_query_misconception_kb', {
          misconceptionId: misconception.id,
        });
      }

      recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', `Kiểm chứng toán học ${toolConfig.toolName}`, vectorToolCall);
      recordEvent('tool_result', 'tri', 'Trí (Hệ 2 - Logic)', `Kết quả kiểm chứng: ${vectorToolCall.isValid ? 'Hợp lệ' : 'Bác bỏ'}`, vectorToolCall);

      triTurn = {
        counter_claim: vectorToolCall.output?.correct || misconception.correction,
        dialogue: `Bo nhầm to rồi! Tớ vừa kiểm tra hệ thức: ${vectorToolCall.output?.reason || misconception.correction}. Đáp án đúng phải là ${vectorToolCall.output?.correct || misconception.correction}!`,
        geometric_basis: vectorToolCall.output?.reason || misconception.correction,
      };
      recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);

      linhChiTurn = {
        dialogue: `Linh Chi note lại nhé: ${misconception.scaffolding[0]?.question || 'Nhớ áp dụng quy tắc hình học để đưa về một vectơ tổng trước khi tính độ dài!'}`,
      };
      recordEvent('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTurn.dialogue);

      const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
        question: exercises[0]?.problem || misconception.scaffolding[0]?.question,
        expected_points: misconception.resolution_criteria,
      });
      recordEvent('tool_call', 'colam', 'Cô Lam (Director)', 'Thẩm định Bloom cho checkpoint', bloomToolCall);
      recordEvent('tool_result', 'colam', 'Cô Lam (Director)', `Mức Bloom ${bloomToolCall.output.level}`, bloomToolCall);

      coLamTurn = {
        dialogue: `Trí chỉ ra rất chuẩn xác với kết quả ${triTurn.counter_claim}. Các em hãy chú ý: ${misconception.resolution_criteria.join(', ')}.`,
      };
      recordEvent('checkpoint_created', 'colam', 'Cô Lam (Director)', coLamTurn.dialogue);
    }
  } else {
    // Chế độ không dùng LLM (useLLM = false): Chạy hoàn toàn Deterministic Tools
    const boClaim = toolConfig.params?.defaultClaim || toolConfig.params?.claimValue || misconception.incorrect_claim;
    let boDialogue = `Theo tớ thì: ${misconception.incorrect_claim}!`;
    if (misconception.id === 'MISC_VEC_005') {
      boDialogue = `Theo tớ thì cạnh bằng a nên |BC + DD'| = a + a = 2a!`;
    } else if (misconception.id === 'MISC_VEC_017') {
      boDialogue = `Góc giữa u và v là 60° thì đảo một vectơ v thành -v thì góc giữa u và -v vẫn là 60° chứ!`;
    } else if (misconception.id === 'MISC_VEC_020') {
      boDialogue = `Theo định lý Pythagore thì |u + v|^2 = |u|^2 + |v|^2 = 2^2 + 3^2 = 13!`;
    }

    boTurn = {
      claim: boClaim,
      dialogue: boDialogue,
    };
    recordEvent('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boTurn.dialogue);

    let vectorToolCall;
    if (toolConfig.toolType === 'vector_algebra') {
      vectorToolCall = executeTool('tool_verify_vector_algebra', {
        shape: toolConfig.params.shape || 'cube',
        side: toolConfig.params.side || 'a',
        expr: toolConfig.params.expr,
        claim: boClaim,
      });
    } else if (toolConfig.toolType === 'dot_product') {
      vectorToolCall = executeTool('tool_calculate_dot_product', {
        ...toolConfig.params,
        claimValue: boClaim,
      });
    } else {
      vectorToolCall = executeTool('tool_query_misconception_kb', {
        misconceptionId: misconception.id,
      });
    }

    recordEvent('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', `Kiểm chứng toán học ${toolConfig.toolName}`, vectorToolCall);
    recordEvent('tool_result', 'tri', 'Trí (Hệ 2 - Logic)', `Kết quả: ${vectorToolCall.output?.correct || 'Hoàn tất'}`, vectorToolCall);

    triTurn = {
      counter_claim: vectorToolCall.output?.correct || misconception.correction,
      dialogue: `Bo nhầm to rồi! Tớ vừa kiểm tra: ${vectorToolCall.output?.reason || misconception.correction}. Đáp án chuẩn phải là ${vectorToolCall.output?.correct || misconception.correction}!`,
      geometric_basis: vectorToolCall.output?.reason || misconception.correction,
    };
    recordEvent('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triTurn.dialogue);

    linhChiTurn = {
      dialogue: `Linh Chi note lại nhé: ${misconception.scaffolding[0]?.question || 'Nhớ đưa về chung gốc trước khi cộng!'}`,
    };
    recordEvent('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTurn.dialogue);

    const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
      question: exercises[0]?.problem || misconception.scaffolding[0]?.question,
      expected_points: misconception.resolution_criteria,
    });
    recordEvent('tool_call', 'colam', 'Cô Lam (Director)', 'Thẩm định Bloom cho checkpoint', bloomToolCall);
    recordEvent('tool_result', 'colam', 'Cô Lam (Director)', `Mức Bloom ${bloomToolCall.output.level}`, bloomToolCall);

    coLamTurn = {
      dialogue: `Trí chỉ ra rất chuẩn xác với kết quả ${triTurn.counter_claim}. Các em hãy chú ý: ${misconception.resolution_criteria.join(', ')}.`,
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
        claim: boTurn.claim || toolConfig.params?.defaultClaim || toolConfig.params?.claimValue || '2a',
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

export default { runRoundtable, getMisconceptionVerifiableConfig, buildTriPrompt };
