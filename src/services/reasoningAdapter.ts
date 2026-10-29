import {
  ReasoningEvent,
  EventType,
  AgentName,
  InspectorTurn,
  ToolCallPayload,
  ToolResultPayload,
  CrossCheckVerdictPayload,
  DispatcherInfo,
  ContextViewInfo,
  AssessorInfo,
} from '../types/reasoning';
import { AgentReasoningEvent, DeterministicToolCall } from '../types/pipeline';

/**
 * Chuẩn hóa tên Tác tử sang danh xưng hiển thị chuẩn mực trên giao diện
 */
export function normalizeAgentName(raw: any): AgentName {
  if (typeof raw !== 'string') {
    if (raw?.agentDisplayName) return normalizeAgentName(raw.agentDisplayName);
    if (raw?.agent) return normalizeAgentName(raw.agent);
    if (raw?.agentId) return normalizeAgentName(raw.agentId);
    return 'Bo';
  }

  const norm = raw.trim().toLowerCase();
  if (norm.includes('trí') || norm === 'tri') return 'Trí';
  if (norm.includes('bo')) return 'Bo';
  if (norm.includes('an') || norm === 'ta') return 'An';
  if (norm.includes('lam') || norm === 'colam' || norm.includes('tutor')) return 'Cô Lam';
  if (norm.includes('chi') || norm === 'linhchi') return 'Linh Chi';
  if (norm.includes('khang') || norm === 'minhkhang') return 'Minh Khang';
  if (norm.includes('blu')) return 'Blu';
  if (norm.includes('assessor') || norm.includes('trọng tài')) return 'Assessor';
  if (norm.includes('dispatcher') || norm.includes('điều phối')) return 'Dispatcher';

  return raw;
}

/**
 * Chuẩn hóa loại sự kiện suy luận từ backend/producer sang EventType của Frontend
 */
export function normalizeEventType(rawType: string): EventType {
  const norm = (rawType || '').toLowerCase().trim();
  if (norm === 'thought' || norm === 'thinking') return 'thinking';
  if (norm === 'debate_turn' || norm === 'speaking') return 'speaking';
  if (norm === 'tool_call' || norm === 'tool_calling') return 'tool_call';
  if (norm === 'tool_result') return 'tool_result';
  if (norm === 'cross_check_verdict') return 'cross_check_verdict';
  if (norm === 'done' || norm === 'checkpoint_created') return 'done';
  return 'speaking';
}

/**
 * Chuyển đổi AgentReasoningEvent (chuẩn PR #21 / Backend) sang ReasoningEvent của War Room Console
 */
export function mapBackendToReasoningEvent(raw: AgentReasoningEvent | any): ReasoningEvent {
  const agent = normalizeAgentName(raw.agentDisplayName || raw.agent || raw.agentId);
  const eventType = normalizeEventType(raw.eventType || raw.type);

  // Timestamp chuẩn hóa ra milliseconds
  let ts = Date.now();
  if (typeof raw.timestamp === 'number') {
    ts = raw.timestamp;
  } else if (typeof raw.timestamp === 'string') {
    const parsed = new Date(raw.timestamp).getTime();
    if (!isNaN(parsed)) ts = parsed;
  }

  // Chuyển đổi toolCall / DeterministicToolCall
  let toolCall: ToolCallPayload | undefined = undefined;
  let toolResult: ToolResultPayload | undefined = undefined;

  if (raw.toolCall) {
    const tc: DeterministicToolCall = raw.toolCall;
    toolCall = {
      toolName: tc.toolName || (tc as any).name || 'deterministic_tool',
      args: tc.input || (tc as any).params || {},
      callId: (tc as any).callId || `tc-${ts}`,
    };

    if (tc.output || tc.isValid !== undefined) {
      toolResult = {
        toolName: toolCall.toolName,
        callId: toolCall.callId,
        status: tc.isValid !== false ? 'success' : 'failure',
        result: tc.output,
        error: (tc as any).error,
      };
    }
  }

  return {
    id: raw.id || `evt-${ts}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: ts,
    agent,
    eventType,
    phase: raw.phase || (raw.secondTarget ? 'roundtable' : undefined),
    content: raw.content || raw.dialogue || raw.thought || '',
    toolCall,
    toolResult,
    crossCheck: raw.crossCheck,
    metadata: {
      ...raw.metadata,
      secondTarget: raw.secondTarget,
      agentId: raw.agentId,
      runId: raw.runId,
    },
  };
}

/**
 * Chuyển đổi chuỗi sự kiện suy luận thành các lượt tương tác của Inspector Modal (Issue #16)
 * Đảm bảo trích xuất đầy đủ: Missing Points, Context Snapshot (Bảng phấn, Lời thầy, RAG snippets)
 */
export function mapReasoningEventsToInspectorTurns(events: ReasoningEvent[] | any[]): InspectorTurn[] {
  if (!events || events.length === 0) return [];

  const turns: InspectorTurn[] = [];
  let turnCounter = 1;

  // Gom các sự kiện liên quan theo agent và timestamp thành các InspectorTurn
  events.forEach((rawEvt, idx) => {
    const evt = mapBackendToReasoningEvent(rawEvt);
    const tsSec = Math.round(evt.timestamp / 1000);
    const m = Math.floor(tsSec / 60) % 60;
    const s = tsSec % 60;
    const timestampStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Trích xuất metadata ngữ cảnh hoặc giá trị mặc định chuẩn sư phạm
    const meta = evt.metadata || {};

    const dispatcher: DispatcherInfo = {
      intent: (meta.intent as string) || (evt.eventType === 'speaking' ? 'Phản biện sắc bén' : 'Đào sâu bản chất'),
      selectedAgent: evt.agent,
      confidence: typeof meta.confidence === 'number' ? meta.confidence : 0.94,
      reason: (meta.dispatchReason as string) || `Tác nhân ${evt.agent} được kích hoạt dựa trên nhịp độ sư phạm bài giảng.`,
    };

    const contextView: ContextViewInfo = {
      boardSnippet: (meta.boardSnippet as string) || "| BC + DD' | = ?",
      teacherSpeech: (meta.teacherSpeech as string) || 'Thầy Tiến: Lưu ý độ dài của tổng khác tổng hai độ dài.',
      ragKnowledge: (meta.ragKnowledge as string) || 'MISC_VEC_005: Ngộ nhận tách |a + b| = |a| + |b|.',
      hiddenItem: (meta.hiddenItem as string) || 'Lời giải chuẩn và đáp án tối ưu bị ẩn.',
      visibleContext: Array.isArray(meta.visibleContext)
        ? (meta.visibleContext as string[])
        : ['Đề bài Ví dụ 3 Thầy Tiến', "Đẳng thức vectơ BC + DD'", 'Mặt phẳng đáy ABCD'],
      hiddenContext: Array.isArray(meta.hiddenContext)
        ? (meta.hiddenContext as string[])
        : ['Đáp án chuẩn √2', 'Bảng điểm nhận thức'],
    };

    // Missing Points: Danh sách các ý học sinh còn thiếu hoặc chưa hoàn thiện
    const rawMissing = Array.isArray(meta.missingPoints) ? meta.missingPoints : [];
    const missingPoints: string[] = rawMissing.length > 0
      ? rawMissing
      : idx === 0
      ? ['Chưa chứng minh DD\' vuông góc với BC', 'Chưa nêu điều kiện hai vectơ cùng phương']
      : [];

    const matchedPoints: string[] = Array.isArray(meta.matchedPoints)
      ? meta.matchedPoints
      : ['Chỉ ra giả định sai của Bo', 'Sử dụng liên hệ hình học trên bảng phấn', 'Phát hiện bẫy tách độ dài'];

    const assessor: AssessorInfo = {
      matchedSummary: `Đạt ${matchedPoints.length}/${matchedPoints.length + missingPoints.length} ý cần có`,
      matchedPoints,
      missingPoints,
      verdictLabel: (meta.verdictLabel as string) || 'Phản biện sắc bén',
      bloomBefore: (meta.bloomBefore as string) || 'Bậc 3 Vận dụng',
      bloomAfter: (meta.bloomAfter as string) || 'Bậc 4 Phân tích',
      bloomLevel: typeof meta.bloomLevel === 'number' ? meta.bloomLevel : 4,
      hesitationScore: typeof meta.hesitationScore === 'number' ? meta.hesitationScore : 0.12,
      hesitationLabel: (meta.hesitationLabel as string) || 'thấp',
    };

    turns.push({
      turnId: `turn-${evt.id || idx + 1}`,
      timestamp: evt.timestamp,
      turnNumber: turnCounter++,
      timestampStr: (meta.timestampStr as string) || timestampStr || '37:13',
      agent: evt.agent,
      dispatcher,
      contextView,
      thought: (meta.thought as string) || (evt.eventType === 'thinking' ? evt.content : `Tác nhân ${evt.agent} đang kiểm chứng lập luận bẫy ngộ nhận qua công cụ toán học.`),
      speech: evt.eventType === 'speaking' ? evt.content : (meta.speech as string) || evt.content,
      assessor,
      toolCalls: evt.toolCall ? [evt.toolCall] : undefined,
    });
  });

  return turns;
}
