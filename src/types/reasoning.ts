export type EventType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'speaking'
  | 'cross_check_verdict'
  | 'done';

export type AgentName = 'Cô Lam' | 'Trí' | 'Bo' | 'An' | 'Minh Khang' | 'Linh Chi' | 'Assessor' | 'Dispatcher' | string;
export type AgentState = 'thinking' | 'tool_calling' | 'speaking' | 'idle';
export type PhaseType = 'extract' | 'rag' | 'roundtable' | 'bloom';
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'error';

export interface ToolCallPayload {
  toolName: string;
  args: Record<string, unknown>;
  params?: Record<string, unknown>;
  callId?: string;
}

export interface ToolResultPayload {
  toolName: string;
  callId?: string;
  status: 'success' | 'failure';
  result?: unknown;
  isValid?: boolean | null;
  error?: string;
}

export interface CrossCheckVerdictPayload {
  judgeAgent: string;
  targetAgent: string;
  verdict: 'agree' | 'disagree' | 'partial';
  confidence: number;
  critique: string;
  counterProposal?: string;
}

export interface ReasoningEvent {
  id: string;
  timestamp: number;
  agent: AgentName;
  eventType: EventType;
  phase?: PhaseType;
  content?: string;
  toolCall?: ToolCallPayload;
  toolResult?: ToolResultPayload;
  crossCheck?: CrossCheckVerdictPayload;
  metadata?: Record<string, unknown>;
  normalized?: true;
}

export interface DispatcherInfo {
  intent: string;
  selectedAgent: string;
  confidence?: number;
  reason: string;
  isEvaluated?: boolean;
}

export interface ContextViewInfo {
  visibleContext: string[];
  hiddenContext: string[];
  boardSnippet?: string;
  teacherSpeech?: string;
  ragKnowledge?: string;
  hiddenItem?: string;
  isEvaluated?: boolean;
  cognitiveMetrics?: {
    hesitationScore?: number;
    comprehensionScore?: number;
    misconceptionDetected?: boolean;
    isEvaluated?: boolean;
  };
}

export interface AssessorInfo {
  matchedPoints: string[];
  missingPoints: string[];
  bloomBefore?: string;
  bloomAfter?: string;
  hesitationScore?: number;
  verdictLabel?: string;
  matchedSummary?: string;
  bloomLevel?: number;
  hesitationLabel?: string;
  isEvaluated?: boolean;
}

export interface InspectorTurn {
  turnId: string;
  timestamp: number;
  turnNumber?: number;
  timestampStr?: string;
  agent: string;
  dispatcher?: DispatcherInfo;
  contextView?: ContextViewInfo;
  thought?: string;
  speech?: string;
  dialogue?: string;
  assessor?: AssessorInfo;
  toolCalls?: ToolCallPayload[];
  /** The learner message that started this turn, when known. */
  question?: string;
  /** Lecture citations returned with the answer. */
  citations?: TurnCitation[];
  /** Round-trip time reported by the backend dispatcher, when it ran. */
  latencyMs?: number;
  /** Chat message id of the answer, so evidence chips can find their turn. */
  messageId?: string;
}

export interface TurnCitation {
  source: string;
  label: string;
  snippet?: string;
  timestamp?: number;
}
