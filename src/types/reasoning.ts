export type EventType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'speaking'
  | 'cross_check_verdict'
  | 'done';

export type AgentName = 'Trí' | 'Bo' | 'An' | 'Blu' | 'Dispatcher' | 'Assessor' | string;
export type AgentState = 'thinking' | 'tool_calling' | 'speaking' | 'idle';
export type PhaseType = 'extract' | 'rag' | 'roundtable' | 'bloom';
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'error';

export interface ToolCallPayload {
  toolName: string;
  args: Record<string, unknown>;
  callId?: string;
}

export interface ToolResultPayload {
  toolName: string;
  callId?: string;
  status: 'success' | 'failure';
  result?: unknown;
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
}

export interface DispatcherInfo {
  intent: string;
  selectedAgent: string;
  confidence: number;
  reason: string;
}

export interface ContextViewInfo {
  visibleContext: string[];
  hiddenContext: string[];
  boardSnippet?: string;
  teacherSpeech?: string;
  ragKnowledge?: string;
  hiddenItem?: string;
}

export interface AssessorInfo {
  matchedPoints: string[];
  missingPoints: string[];
  bloomBefore: string;
  bloomAfter: string;
  hesitationScore: number;
  verdictLabel?: string;
  matchedSummary?: string;
  bloomLevel?: number;
  hesitationLabel?: string;
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
  assessor?: AssessorInfo;
  toolCalls?: ToolCallPayload[];
}
