/**
 * DRE Backend API Client
 * Bridges the React frontend with the dre-backend Express server (running on http://localhost:3001)
 * Powered by OpenAI GPT-6 (Bo, Assessor & TA An on gpt-6-sol, Cô Lam on gpt-6.1-sol).
 */

import type { AgentCitation, AgentReasoningEvent, ApprovedLessonPackage } from '../types/pipeline';
import fallbackFixtureData from '../../mock/mock_roundtable_run_fixture.json';

export type { AgentCitation };

const fallbackFixture = fallbackFixtureData as any;

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
  second?: number;
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

export interface RoundtableRunSummary {
  runId: string;
  isFixture?: boolean;
  title: string;
  partNumber: number | string;
  videoId?: string;
  createdAt: string;
  totalEvents: number;
  crossCheckCorrectionOccurred: boolean;
  bloomLevel?: string;
}

export interface RoundtableRunDetail {
  runId: string;
  videoId: string;
  videoTitle: string;
  partNumber: number | string;
  createdAt: string;
  stats?: {
    totalEvents: number;
    crossCheckCorrectionOccurred: boolean;
    bloomLevel?: string;
    totalToolCalls?: number;
    partTitle?: string;
  };
  reasoning_events: AgentReasoningEvent[];
  lessonDraft?: ApprovedLessonPackage | any;
}

export interface RoundtableStreamOptions {
  videoId?: string;
  partNumber?: number;
  streamDelayMs?: number;
  useLLM?: boolean;
  mode?: 'live' | 'replay';
  runId?: string;
  speed?: number;
  fixture?: boolean;
  fallbackToOffline?: boolean;
  onReasoning?: (event: AgentReasoningEvent) => void;
  onEvent?: (event: AgentReasoningEvent) => void;
  onDone?: (data: {
    runId: string;
    totalEvents: number;
    mode: string;
    provenance?: 'live' | 'replay' | 'fallback_fixture';
    isFallback?: boolean;
    lesson?: any;
    lessonDraft?: any;
  }) => void;
  onComplete?: (data: any) => void;
  onError?: (err: any) => void;
}

/**
 * Fetch all saved runs from backend with offline fallback
 */
export async function getRoundtableRuns(): Promise<RoundtableRunSummary[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE_URL}/api/roundtable/runs`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.runs) && data.runs.length > 0) {
        return data.runs;
      }
    }
  } catch (err) {
    console.warn('[DRE API] getRoundtableRuns network error, falling back to offline fixture:', err);
  }

  // Fallback offline fixture
  return [
    {
      runId: 'fixture',
      isFixture: true,
      title: fallbackFixture.videoTitle || 'Bài 1.1: Vectơ Trong Không Gian (Fixture Run)',
      partNumber: fallbackFixture.partNumber || 3,
      videoId: fallbackFixture.videoId || 'VID_VECTO_12_TIEN',
      createdAt: fallbackFixture.createdAt || new Date().toISOString(),
      totalEvents: fallbackFixture.reasoning_events?.length || 20,
      crossCheckCorrectionOccurred: Boolean(fallbackFixture.stats?.crossCheckCorrectionOccurred),
      bloomLevel: fallbackFixture.stats?.bloomLevel || 'Analyze',
    },
  ];
}

/**
 * Fetch a specific run detail by runId with offline fallback
 */
export async function getRoundtableRun(runId: string): Promise<RoundtableRunDetail | null> {
  const normId = String(runId || '').trim();
  if (normId === 'fixture' || normId === 'mock' || normId === 'run_vecto12_part3_wow_moment') {
    return fallbackFixture as unknown as RoundtableRunDetail;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE_URL}/api/roundtable/runs/${runId}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return data.run || null;
    }
  } catch (err) {
    console.warn(`[DRE API] getRoundtableRun(${runId}) network error:`, err);
  }

  return fallbackFixture as unknown as RoundtableRunDetail;
}

/**
 * Open real-time SSE stream for A2A Roundtable War Room Demo (#302)
 * Supports live execution, saved run replay, speed controls, and offline simulation fallback.
 * Returns an unsubscribe / close function.
 */
export function streamRoundtable({
  videoId = 'VID_VECTO_12_TIEN',
  partNumber,
  streamDelayMs = 20,
  useLLM = false,
  mode = 'live',
  runId,
  speed = 1,
  fixture = false,
  fallbackToOffline = true,
  onReasoning,
  onEvent,
  onDone,
  onComplete,
  onError,
}: RoundtableStreamOptions): () => void {
  const query = new URLSearchParams();
  if (videoId) query.append('videoId', videoId);
  if (partNumber !== undefined) query.append('partNumber', String(partNumber));
  if (streamDelayMs) query.append('streamDelayMs', String(streamDelayMs));
  if (useLLM) query.append('useLLM', 'true');
  if (mode) query.append('mode', mode);
  if (runId) query.append('runId', runId);
  if (speed) query.append('speed', String(speed));
  if (fixture) query.append('fixture', 'true');

  const endpoint = runId && mode === 'replay'
    ? `${API_BASE_URL}/api/roundtable/${encodeURIComponent(runId)}/stream?${query.toString()}`
    : `${API_BASE_URL}/api/roundtable/stream?${query.toString()}`;

  let isClosed = false;
  let offlineTimer: any = null;

  // Fallback offline simulator if SSE connection fails
  const triggerOfflineSimulation = () => {
    if (isClosed) return;
    console.info('[DRE API] Triggering offline replay simulation from fixture (provenance: fallback_fixture)');
    const events = (fallbackFixture.reasoning_events || []) as AgentReasoningEvent[];
    const safeDelay = Math.max(10, Math.floor(40 / (Number(speed) || 1)));

    let index = 0;
    const playNext = () => {
      if (isClosed) return;
      if (index < events.length) {
        const evt = events[index];
        onReasoning?.(evt);
        onEvent?.(evt);
        index++;
        offlineTimer = setTimeout(playNext, safeDelay);
      } else {
        onDone?.({
          runId: fallbackFixture.runId,
          totalEvents: events.length,
          mode: 'replay',
          provenance: 'fallback_fixture',
          isFallback: true,
        });
        onComplete?.({
          ok: true,
          mode: 'replay',
          provenance: 'fallback_fixture',
          isFallback: true,
          runId: fallbackFixture.runId,
          draft: fallbackFixture.lessonDraft,
          stats: fallbackFixture.stats,
        });
      }
    };
    playNext();
  };

  const eventSource = new EventSource(endpoint);

  // Set deduplication guard to ensure each event is dispatched exactly once
  const dispatchedEventIds = new Set<string>();

  const handleIncomingReasoningEvent = (rawData: string) => {
    try {
      const data = JSON.parse(rawData);
      const eventKey = data.id || `evt_${data.timestamp || ''}_${data.eventType || ''}_${data.content?.slice(0, 20) || ''}`;
      if (dispatchedEventIds.has(eventKey)) {
        return; // Already dispatched via alias
      }
      dispatchedEventIds.add(eventKey);
      onReasoning?.(data);
      onEvent?.(data);
    } catch (err) {
      console.warn('[DRE API] Parse error in SSE reasoning event:', err);
    }
  };

  eventSource.addEventListener('reasoning', (e: MessageEvent) => {
    handleIncomingReasoningEvent(e.data);
  });

  eventSource.addEventListener('reasoning_event', (e: MessageEvent) => {
    handleIncomingReasoningEvent(e.data);
  });

  eventSource.addEventListener('done', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      onDone?.(data);
    } catch (err) {
      console.warn('[DRE API] Parse error in SSE done:', err);
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

  eventSource.addEventListener('error', (e: MessageEvent) => {
    try {
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e;
      onError?.(data);
    } catch (_) {
      onError?.(e);
    }
  });

  eventSource.onerror = (err) => {
    eventSource.close();
    if (!isClosed) {
      // If client explicitly requested replay, fixture, or fallbackToOffline is enabled (default true for hackathon resiliency)
      const shouldFallback = mode === 'replay' || fixture || fallbackToOffline !== false;
      if (shouldFallback) {
        console.warn('[DRE API] EventSource network error or backend unreachable — activating offline simulation fallback:', err);
        triggerOfflineSimulation();
      } else {
        console.warn('[DRE API] EventSource network connection error:', err);
        onError?.(err);
      }
    }
  };

  return () => {
    isClosed = true;
    if (offlineTimer) clearTimeout(offlineTimer);
    eventSource.close();
  };
}


/**
 * AISDLC Issue #401: Runtime Intent Classifier & Dynamic Routing Dispatcher
 */
export async function dispatchRuntimeMessage(payload: {
  message: string;
  currentTime?: number;
  lessonTitle?: string;
  sessionId?: string;
  recipient?: string;
  useLLM?: boolean;
}): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/runtime/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] dispatchRuntimeMessage error:', err);
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
