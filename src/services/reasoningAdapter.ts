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
    return raw?.name || 'unknown';
  }

  const norm = raw.trim().toLowerCase();
  if (norm.includes('trí') || norm === 'tri') return 'Trí';
  if (norm.includes('bo')) return 'Bo';
  if (norm.includes('khang') || norm === 'minhkhang') return 'Minh Khang';
  if (norm.includes('chi') || norm === 'linhchi') return 'Linh Chi';
  if (norm.includes('lam') || norm === 'colam' || norm.includes('tutor')) return 'Cô Lam';
  if (norm.includes('assessor') || norm.includes('trọng tài')) return 'Assessor';
  if (norm.includes('dispatcher') || norm.includes('điều phối')) return 'Dispatcher';
  if (norm.includes('an') || norm === 'ta') return 'An';

  return raw;
}

export function sanitizeLatexValue(val: any): any {
  if (typeof val === 'string') {
    return val
      .replace(/[\u000b\x0B]ec/g, '\\vec')
      .replace(/[\u000b\x0B]/g, '\\vec')
      .replace(/\\Bec/g, '\\vec')
      .replace(/Bec\{/g, '\\vec{');
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeLatexValue);
  }
  if (val && typeof val === 'object') {
    const res: any = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = sanitizeLatexValue(v);
    }
    return res;
  }
  return val;
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
  if (norm === 'checkpoint_created') return 'speaking';
  if (norm === 'done') return 'done';
  return 'speaking';
}

/**
 * Chuyển đổi AgentReasoningEvent (chuẩn PR #21 / Backend) sang ReasoningEvent của War Room Console
 */
export function mapBackendToReasoningEvent(raw: AgentReasoningEvent | any): ReasoningEvent {
  if (raw?.normalized === true) return raw;

  const agent = normalizeAgentName(raw.agentDisplayName || raw.agentId || raw.agent || 'unknown');
  const eventType = normalizeEventType(raw.eventType || raw.type);

  // Timestamp chuẩn hóa ra milliseconds (bảo đảm luôn là number hợp lệ)
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

  const rawTc = raw.toolCall || (raw.toolResult ? { toolName: raw.toolResult.toolName, output: raw.toolResult.result } : undefined);

  if (rawTc) {
    // Preserve the producer's tool identity; never guess one from content.
    const toolName = rawTc.toolName || rawTc.name || 'unknown_tool';
    toolCall = {
      toolName,
      args: sanitizeLatexValue(rawTc.input || rawTc.params || rawTc.args || {}),
      callId: rawTc.callId || `tc-${ts}`,
    };

    if (rawTc.output !== undefined || rawTc.isValid !== undefined || eventType === 'tool_result') {
      const rawValid = rawTc.isValid !== undefined ? rawTc.isValid : rawTc.output?.isValid;
      const isValid = rawValid === null || rawValid === undefined ? undefined : Boolean(rawValid);
      toolResult = {
        toolName,
        callId: toolCall.callId,
        status: isValid === false ? 'failure' : 'success',
        result: sanitizeLatexValue(rawTc.output ?? rawTc.result),
        isValid,
        error: rawTc.error,
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
    normalized: true,
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
      intent: (meta.intent as string) || '—',
      selectedAgent: (meta.selectedAgent as string) || evt.agent,
      confidence: typeof meta.confidence === 'number' ? meta.confidence : undefined,
      reason: (meta.dispatchReason as string) || (meta.reason as string) || '—',
      isEvaluated: typeof meta.confidence === 'number',
    };

    const contextView: ContextViewInfo = {
      boardSnippet: meta.boardSnippet ? String(meta.boardSnippet) : undefined,
      teacherSpeech: meta.teacherSpeech ? String(meta.teacherSpeech) : undefined,
      ragKnowledge: meta.ragKnowledge ? String(meta.ragKnowledge) : undefined,
      hiddenItem: meta.hiddenItem ? String(meta.hiddenItem) : undefined,
      visibleContext: Array.isArray(meta.visibleContext) ? (meta.visibleContext as string[]) : [],
      hiddenContext: Array.isArray(meta.hiddenContext) ? (meta.hiddenContext as string[]) : [],
      isEvaluated: Boolean(meta.ragKnowledge || meta.boardSnippet),
    };

    // Missing & Matched Points: Danh sách các ý học sinh trích xuất từ metadata thực tế
    const rawMissing = Array.isArray(meta.missingPoints) ? (meta.missingPoints as string[]) : [];
    const matchedPoints = Array.isArray(meta.matchedPoints) ? (meta.matchedPoints as string[]) : [];
    const missingPoints = rawMissing;

    const assessor: AssessorInfo = {
      matchedSummary: (meta.matchedSummary as string) || undefined,
      matchedPoints,
      missingPoints,
      verdictLabel: (meta.verdictLabel as string) || undefined,
      bloomBefore: (meta.bloomBefore as string) || undefined,
      bloomAfter: (meta.bloomAfter as string) || undefined,
      bloomLevel: typeof meta.bloomLevel === 'number' ? meta.bloomLevel : undefined,
      hesitationScore: typeof meta.hesitationScore === 'number' ? meta.hesitationScore : undefined,
      hesitationLabel: (meta.hesitationLabel as string) || undefined,
      isEvaluated: typeof meta.bloomLevel === 'number' || typeof meta.hesitationScore === 'number',
    };

    turns.push({
      turnId: `turn-${evt.id || idx + 1}`,
      timestamp: evt.timestamp,
      turnNumber: turnCounter++,
      timestampStr: (meta.timestampStr as string) || timestampStr || '—',
      agent: evt.agent,
      dispatcher,
      contextView,
      thought: (meta.thought as string) || (evt.eventType === 'thinking' ? evt.content : undefined),
      speech: evt.eventType === 'speaking' ? evt.content : (meta.speech as string) || undefined,
      assessor,
      toolCalls: evt.toolCall ? [evt.toolCall] : undefined,
    });
  });

  return turns;
}
