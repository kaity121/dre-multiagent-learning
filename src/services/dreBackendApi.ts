/**
 * DRE Backend API Client
 * Bridges the React frontend with the dre-backend Express server (running on http://localhost:3001)
 * Powered by OpenAI GPT-6 (Bo, Assessor & TA An on gpt-6-sol, Cô Lam on gpt-6.1-sol).
 */

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
  isValid?: boolean;
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
  timeStr: string;
  second?: number;
}

/**
 * Send a question to the Classroom Live Chat Bar (grounded in DRE Knowledge Base & AI Peers)
 */
export async function sendClassroomChat(
  message: string,
  currentTime: number,
  recipient: string = 'all'
): Promise<ClassroomChatResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API_BASE_URL}/api/chat/classroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, currentTime, recipient }),
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

export interface RoundtableStreamOptions {
  videoId?: string;
  partNumber?: number;
  streamDelayMs?: number;
  useLLM?: boolean;
  onEvent?: (event: any) => void;
  onComplete?: (data: any) => void;
  onError?: (err: any) => void;
}

/**
 * Open real-time SSE stream for A2A Roundtable War Room Demo (#302)
 * Returns an unsubscribe / close function.
 */
export function streamRoundtable({
  videoId = 'VID_VECTO_12_TIEN',
  partNumber,
  streamDelayMs = 20,
  useLLM = false,
  onEvent,
  onComplete,
  onError,
}: RoundtableStreamOptions): () => void {
  const query = new URLSearchParams();
  if (videoId) query.append('videoId', videoId);
  if (partNumber !== undefined) query.append('partNumber', String(partNumber));
  if (streamDelayMs) query.append('streamDelayMs', String(streamDelayMs));
  if (useLLM) query.append('useLLM', 'true');

  const url = `${API_BASE_URL}/api/roundtable/stream?${query.toString()}`;
  const eventSource = new EventSource(url);

  eventSource.addEventListener('reasoning_event', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      onEvent?.(data);
    } catch (err) {
      console.warn('[DRE API] Parse error in SSE reasoning_event:', err);
    }
  });

  eventSource.addEventListener('complete', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      onComplete?.(data);
    } catch (err) {
      console.warn('[DRE API] Parse error in SSE complete:', err);
    }
    eventSource.close();
  });

  eventSource.onerror = (err) => {
    console.warn('[DRE API] EventSource error:', err);
    onError?.(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}
