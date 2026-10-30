/**
 * DRE Backend API Client
 * Bridges the React frontend with the dre-backend Express server (running on http://localhost:3001)
 * Powered by OpenAI GPT-6 (Bo, Assessor & TA An on gpt-6-sol, Cô Lam on gpt-6.1-sol).
 */

import type { AgentCitation } from '../types/pipeline';

export type { AgentCitation };

const API_BASE_URL = (import.meta as any).env?.VITE_DRE_API_URL || 'http://localhost:3001';

export interface StartSessionResponse {
  sessionId: string;
  baiToan: string;
  coLamDialogue: string;
}

export interface SubmitAnswerResponse {
  sessionId: string;
  danhGia: 'dung' | 'sai';
  boDialogue: string;
  mode: 'shortcut_fallacy' | 'edge_case_skeptic' | 'misconception_ally';
  done: boolean;
}

export interface SubmitRebuttalResponse {
  sessionId: string;
  danhGiaPhanBien: 'sac_ben' | 'chua_ro';
  boDialogue?: string;
  coLamDialogue?: string | string[];
  hintLevel?: number;
  done: boolean;
}

/**
 * Check if the DRE backend Express server is running and reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/api/misconceptions`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Step 1: Start a new learning session for a misconception
 */
export async function startBackendSession(misconceptionId: string): Promise<StartSessionResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ misconceptionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] startSession error, falling back to local simulation:', err);
    return null;
  }
}

/**
 * Steps 2-5: Submit student's initial answer
 * Assessor grades -> picks trap -> Bo challenges
 */
export async function submitBackendAnswer(sessionId: string, cauTraLoi: string): Promise<SubmitAnswerResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/session/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cauTraLoi }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] submitAnswer error, falling back to local simulation:', err);
    return null;
  }
}

/**
 * Steps 6-8: Submit student's rebuttal to Bo's challenge
 * Assessor grades rebuttal -> Bo concedes or Cô Lam intervenes with hint
 */
export async function submitBackendRebuttal(sessionId: string, phanBien: string): Promise<SubmitRebuttalResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/session/${sessionId}/rebuttal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phanBien }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] submitRebuttal error, falling back to local simulation:', err);
    return null;
  }
}

export interface DeterministicToolCallInfo {
  toolName: string;
  status: 'running' | 'completed';
  label: string;
  badgeText: string;
  category?: 'rag' | 'math_verify' | 'bloom' | 'timeline';
  input?: Record<string, any>;
  output?: Record<string, any>;
  isValid?: boolean | null;
  timestampMs?: number;
}

export interface ClassroomChatResponse {
  ok: boolean;
  author: string;
  text: string;
  followUpBoText?: string | null;
  peerId: string;
  kbMatchedId?: string | null;
  toolCall?: DeterministicToolCallInfo | null;
  toolCalls?: DeterministicToolCallInfo[] | null;
  citations?: AgentCitation[] | null;
  contextSnapshot?: any | null;
  timeStr: string;
  sessionId?: string;
  sessionState?: any;
}

/**
 * Send a question to the Classroom Live Chat Bar (grounded in DRE Knowledge Base & AI Peers)
 */
export async function sendClassroomChat(
  message: string,
  currentTime: number,
  recipient: string = 'all',
  sessionId?: string
): Promise<ClassroomChatResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API_BASE_URL}/api/chat/classroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, currentTime, recipient, sessionId }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] sendClassroomChat error, will fall back to local simulation:', err);
    return null;
  }
}

export interface PeerChatResponse {
  ok: boolean;
  peerId: string;
  toolCalls?: DeterministicToolCallInfo[] | null;
  result: {
    dialogue: string;
    focusConcept?: string;
    cheatSheetSteps?: string[];
    realLifeAnalogy?: string;
    toolCall?: DeterministicToolCallInfo | null;
    toolCalls?: DeterministicToolCallInfo[] | null;
  };
}

/**
 * Send a 1-on-1 private message to a peer (Bo, Trí, Linh Chi, Minh Khang)
 */
export async function sendPeerChat(
  peerId: string,
  message: string,
  topic: string = 'Toán 12 Vectơ trong không gian',
  mathProblem: string = ''
): Promise<PeerChatResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API_BASE_URL}/api/peer/${peerId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, topic, mathProblem }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] sendPeerChat error, will fall back to local simulation:', err);
    return null;
  }
}


/**
 * AISDLC Issue #402: Fetch Context Isolation Snapshot for an agent at second T
 */
export async function fetchContextSnapshot(
  agentId: string = 'tri',
  second: number = 2233,
  sessionId: string = 'session_001'
): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/runtime/context-snapshot?agentId=${agentId}&second=${second}&sessionId=${sessionId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.snapshot || null;
  } catch (err) {
    console.warn('[DRE API] fetchContextSnapshot error:', err);
    return null;
  }
}

/**
 * ============================================================================
 * AISDLC Issue #403: Cognitive Evaluator & Bloom Certification Client APIs
 * ============================================================================
 */

export async function evaluateCognitiveResponse(payload: {
  answer: string;
  expectedPoints?: string[];
  currentTime?: number;
  misconceptionId?: string;
  deltaSeconds?: number;
  characterCount?: number;
  backspaceCount?: number;
}): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/evaluator/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] evaluateCognitiveResponse error:', err);
    return null;
  }
}

export async function sendEvaluatorAction(payload: {
  sessionId: string;
  action: 'create_learning_record' | 'update_mastery_state' | 'create_review_task';
  payload: Record<string, any>;
}): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/evaluator/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] sendEvaluatorAction error:', err);
    return null;
  }
}

export async function certifyStation4Bloom(payload: {
  sessionId: string;
  teachingAnswer: string;
  createdProblem?: any;
  videoTimeS?: number;
}): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/evaluator/certify-station4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] certifyStation4Bloom error:', err);
    return null;
  }
}

export async function exportSessionSchema(sessionId: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/session/${sessionId}/export`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.session || null;
  } catch (err) {
    console.warn('[DRE API] exportSessionSchema error:', err);
    return null;
  }
}
