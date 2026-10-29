import { InspectorTurn, DispatcherInfo, ContextViewInfo, AssessorInfo } from '../../types/reasoning';

export function normalizeTurn(raw: Record<string, unknown>, index: number = 0): InspectorTurn {
  const turnId = (raw.turnId || raw.id || `turn-${Date.now()}-${index}`) as string;
  const timestamp = Number(raw.timestamp || Date.now());
  const agent = (raw.agent || raw.selectedAgent || 'Tác tử chưa định danh') as string;

  let dispatcher: DispatcherInfo | undefined;
  const rawRouting = (raw.routing || raw.dispatcher || {}) as Record<string, unknown>;
  if (Object.keys(rawRouting).length > 0 || raw.intent || raw.selectedAgent) {
    dispatcher = {
      intent: String(rawRouting.intent || raw.intent || 'Trợ giúp học tập / Giải đáp thắc mắc'),
      selectedAgent: String(rawRouting.selectedAgent || raw.selectedAgent || agent),
      confidence: Number(rawRouting.confidence ?? raw.confidence ?? 0.85),
      reason: String(
        rawRouting.reason ||
          raw.reason ||
          'Agent được chỉ định dựa trên độ phù hợp của chuyên môn sư phạm và ngữ cảnh câu hỏi.'
      ),
    };
  }

  let contextView: ContextViewInfo | undefined;
  const rawContext = (raw.contextView || raw.context || {}) as Record<string, unknown>;
  const visible = Array.isArray(rawContext.visibleContext)
    ? (rawContext.visibleContext as string[])
    : Array.isArray(rawContext.visible)
    ? (rawContext.visible as string[])
    : [
        'Câu hỏi hiện tại của học sinh',
        'Phân đoạn bài giảng (Phần 1 - Vectơ trong không gian)',
        'Lịch sử 3 lượt thoại gần nhất',
      ];

  const hidden = Array.isArray(rawContext.hiddenContext)
    ? (rawContext.hiddenContext as string[])
    : Array.isArray(rawContext.hidden)
    ? (rawContext.hidden as string[])
    : [
        'Toàn bộ đề thi học kỳ và đáp án chi tiết',
        'Gợi ý giải trực tiếp bài tập nâng cao tiếp theo',
        'Prompt hệ thống bảo mật của mô hình',
      ];

  contextView = {
    visibleContext: visible,
    hiddenContext: hidden,
  };

  const thought = String(
    raw.thought ||
      raw.internal_thought ||
      raw.reasoning ||
      'Học sinh đang nhầm lẫn giữa độ dài tổng vectơ và tổng độ dài. Cần đưa ra câu hỏi gợi mở về bất đẳng thức tam giác.'
  );

  const speech = String(
    raw.speech ||
      raw.dialogue ||
      raw.message ||
      raw.content ||
      'Chào bạn! Hãy quan sát kỹ tam giác hình thành bởi hai vectơ xem độ dài cạnh thứ ba có luôn bằng tổng hai cạnh kia không nhé?'
  );

  let assessor: AssessorInfo | undefined;
  const rawAssessor = (raw.assessor || raw.assessment || {}) as Record<string, unknown>;
  assessor = {
    matchedPoints: Array.isArray(rawAssessor.matchedPoints)
      ? (rawAssessor.matchedPoints as string[])
      : ['Nhận biết được quy tắc ba điểm', 'Phân biệt được vectơ cùng hướng và khác hướng'],
    missingPoints: Array.isArray(rawAssessor.missingPoints)
      ? (rawAssessor.missingPoints as string[])
      : ['Chưa xét điều kiện dấu bằng xảy ra'],
    bloomBefore: String(rawAssessor.bloomBefore || 'Nhớ (L1)'),
    bloomAfter: String(rawAssessor.bloomAfter || 'Hiểu & Vận dụng (L2-L3)'),
    hesitationScore: Number(rawAssessor.hesitationScore ?? 0.2),
  };

  return {
    turnId,
    timestamp,
    agent,
    dispatcher,
    contextView,
    thought,
    speech,
    assessor,
    toolCalls: Array.isArray(raw.toolCalls) ? (raw.toolCalls as any) : undefined,
  };
}
