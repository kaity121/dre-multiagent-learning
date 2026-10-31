/**
 * DRE Backend API Client
 * Bridges the React frontend with the dre-backend Express server (running on http://localhost:3001)
 * Powered by OpenAI GPT-6 (Bo, Assessor & TA An on gpt-6-sol, Cô Lam on gpt-6.1-sol).
 */

import type { AgentCitation, AgentReasoningEvent, DRELessonSchema } from '../types/pipeline';
import fallbackFixtureData from '../../mock/mock_roundtable_run_fixture.json';

export type { AgentCitation };

// Bundled recording of a deterministic run; JSON imports are typed loosely, the shape is checked by validate:fixtures.
const fallbackFixture = fallbackFixtureData as any;

export const API_BASE_URL = (import.meta as any).env?.VITE_DRE_API_URL || 'http://localhost:3001';

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
  category?: 'rag' | 'math_verify' | 'math_calc' | 'grounding' | 'bloom' | 'timeline';
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
  followUpResponse?: { author?: string; agent?: string; text?: string; citations?: AgentCitation[] | null; contextSnapshot?: any | null } | null;
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
  sessionId?: string | null,
  conversation?: {
    replyTo?: { author: string; text?: string } | null;
    history?: { author: string; text: string }[];
  }
): Promise<ClassroomChatResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API_BASE_URL}/api/chat/classroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        currentTime,
        recipient,
        sessionId,
        replyTo: conversation?.replyTo ?? null,
        chatHistory: conversation?.history ?? [],
      }),
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

/** Where the events of a roundtable stream actually came from. */
export type RoundtableProvenance = 'live' | 'replay' | 'fallback_fixture';

export interface RoundtableGenerationInfo {
  requestedMode: 'llm' | 'deterministic';
  mode: 'llm' | 'mixed' | 'deterministic' | 'deterministic_fallback';
  isFallback: boolean;
  fallbackReason: string | null;
}

export interface RoundtableApproval {
  status: DRELessonSchema['status'];
  approvedByTeacher: boolean;
  reviewedBy: string | null;
  approvedAt: string | null;
}

export interface RoundtableSessionInfo {
  runId: string;
  mode: 'live' | 'replay';
  provenance: RoundtableProvenance;
  isFallback: boolean;
  source?: 'fixture' | 'recorded_run';
  fallbackReason?: string;
}

export interface RoundtableCompletion extends RoundtableSessionInfo {
  totalEvents: number;
  lesson: DRELessonSchema | null;
  approval: RoundtableApproval | null;
  generation?: RoundtableGenerationInfo | null;
  stats?: {
    totalEvents: number;
    crossCheckCorrectionOccurred?: boolean;
    bloomLevel?: string;
    totalToolCalls?: number;
    partTitle?: string;
  };
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
  provenance?: string;
  videoId: string;
  videoTitle: string;
  partNumber: number | string;
  createdAt: string;
  generation?: RoundtableGenerationInfo | null;
  stats?: RoundtableCompletion['stats'];
  reasoning_events: AgentReasoningEvent[];
  lesson?: DRELessonSchema | null;
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
  /** Play the bundled fixture when the backend cannot be reached at all (never after a live run started). */
  fallbackToOffline?: boolean;
  /** Called once per stream, before any event, with the real provenance of what follows. */
  onSession?: (info: RoundtableSessionInfo) => void;
  onReasoning?: (event: AgentReasoningEvent) => void;
  /** @deprecated alias of onReasoning; if both are given only onReasoning is called. */
  onEvent?: (event: AgentReasoningEvent) => void;
  onDone?: (data: RoundtableCompletion) => void;
  onComplete?: (data: RoundtableCompletion) => void;
  onError?: (err: { error: string; runId?: string; provenance?: RoundtableProvenance }) => void;
}

const BUNDLED_FIXTURE_IDS = new Set(['fixture', 'mock', 'run_vecto12_part3_wow_moment']);

/**
 * Fetch all saved runs from the backend. When the backend is unreachable only the bundled
 * fixture is listed, flagged with isFixture so it is never mistaken for a recorded run.
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
    console.warn('[DRE API] getRoundtableRuns network error, listing the bundled fixture only:', err);
  }

  return [
    {
      runId: 'fixture',
      isFixture: true,
      title: fallbackFixture.videoTitle || 'Bài 1.1: Vectơ Trong Không Gian (Fixture Run)',
      partNumber: fallbackFixture.partNumber || 3,
      videoId: fallbackFixture.videoId || 'VID_VECTO_12_TIEN',
      createdAt: fallbackFixture.createdAt || new Date().toISOString(),
      totalEvents: fallbackFixture.reasoning_events?.length || 0,
      crossCheckCorrectionOccurred: Boolean(fallbackFixture.stats?.crossCheckCorrectionOccurred),
      bloomLevel: fallbackFixture.stats?.bloomLevel || 'Analyze',
    },
  ];
}

/**
 * Fetch one run. The bundled fixture is returned only when it was asked for; a failed request
 * for another run returns null instead of silently substituting fixture data.
 */
export async function getRoundtableRun(runId: string): Promise<RoundtableRunDetail | null> {
  const normId = String(runId || '').trim();
  if (BUNDLED_FIXTURE_IDS.has(normId)) {
    return fallbackFixture;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE_URL}/api/roundtable/runs/${encodeURIComponent(normId)}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return data.run || null;
    }
  } catch (err) {
    console.warn(`[DRE API] getRoundtableRun(${normId}) network error:`, err);
  }
  return null;
}

/**
 * Open the SSE stream for the A2A Roundtable War Room (#302, #303): live generation or replay
 * of a recorded run. Returns a close function.
 *
 * Each reasoning event is delivered once: only the canonical `reasoning_event` name is consumed,
 * although the server also emits aliases for older listeners. Provenance comes from the server
 * (`session_start`); the bundled fixture is played only when the backend was never reached, and
 * is announced as `fallback_fixture` before its first event.
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
  onSession,
  onReasoning,
  onEvent,
  onDone,
  onComplete,
  onError,
}: RoundtableStreamOptions): () => void {
  const deliverReasoning = onReasoning || onEvent;
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
  let isFinished = false;
  let sessionStarted = false;
  let offlineTimer: ReturnType<typeof setTimeout> | null = null;
  const eventSource = new EventSource(endpoint);

  const finish = () => {
    isFinished = true;
    eventSource.close();
  };

  const parse = <T,>(raw: string, label: string): T | null => {
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[DRE API] Parse error in SSE ${label}:`, err);
      return null;
    }
  };

  const playBundledFixture = (reason: string) => {
    const events = (fallbackFixture.reasoning_events || []) as AgentReasoningEvent[];
    const session: RoundtableSessionInfo = {
      runId: fallbackFixture.runId,
      mode: 'replay',
      provenance: 'fallback_fixture',
      isFallback: true,
      source: 'fixture',
      fallbackReason: reason,
    };
    onSession?.(session);
    const safeDelay = Math.max(10, Math.floor(40 / (Number(speed) || 1)));
    let index = 0;
    const playNext = () => {
      if (isClosed) return;
      if (index < events.length) {
        deliverReasoning?.(events[index]);
        index++;
        offlineTimer = setTimeout(playNext, safeDelay);
        return;
      }
      const lesson = (fallbackFixture.lesson || null) as DRELessonSchema | null;
      const completion: RoundtableCompletion = {
        ...session,
        totalEvents: events.length,
        lesson,
        approval: lesson ? { status: lesson.status, approvedByTeacher: false, reviewedBy: null, approvedAt: null } : null,
        generation: fallbackFixture.generation || null,
        stats: fallbackFixture.stats,
      };
      onDone?.(completion);
      onComplete?.(completion);
    };
    playNext();
  };

  eventSource.addEventListener('session_start', (e: MessageEvent) => {
    const data = parse<RoundtableSessionInfo>(e.data, 'session_start');
    if (!data) return;
    sessionStarted = true;
    onSession?.(data);
  });

  eventSource.addEventListener('reasoning_event', (e: MessageEvent) => {
    const data = parse<AgentReasoningEvent>(e.data, 'reasoning_event');
    if (data) deliverReasoning?.(data);
  });

  eventSource.addEventListener('done', (e: MessageEvent) => {
    const data = parse<RoundtableCompletion>(e.data, 'done');
    if (data) onDone?.(data);
  });

  eventSource.addEventListener('complete', (e: MessageEvent) => {
    const data = parse<RoundtableCompletion>(e.data, 'complete');
    finish();
    if (data) onComplete?.(data);
  });

  // Server-sent `event: error` frames carry JSON data; native connection errors do not and go to onerror.
  eventSource.addEventListener('error', (e: Event) => {
    const raw = (e as MessageEvent).data;
    if (typeof raw !== 'string') return;
    const data = parse<{ error: string; runId?: string }>(raw, 'error');
    finish();
    onError?.({ error: data?.error || 'Lỗi từ máy chủ Roundtable', runId: data?.runId });
  });

  eventSource.onerror = () => {
    if (isClosed || isFinished) return;
    finish();
    if (!sessionStarted && fallbackToOffline !== false) {
      console.warn('[DRE API] Roundtable backend unreachable — playing the bundled fixture (provenance: fallback_fixture).');
      playBundledFixture('backend_unreachable');
      return;
    }
    onError?.({
      error: sessionStarted
        ? 'Mất kết nối với máy chủ giữa phiên Roundtable; dữ liệu đã nhận chưa đầy đủ.'
        : 'Không kết nối được máy chủ Roundtable.',
      runId,
      provenance: mode === 'replay' ? 'replay' : 'live',
    });
  };

  return () => {
    isClosed = true;
    if (offlineTimer) clearTimeout(offlineTimer);
    eventSource.close();
  };
}


export interface DispatchRequest {
  message: string;
  currentTime?: number;
  recipient?: string;
  lessonTitle?: string;
  useLLM?: boolean;
  sessionId?: string | null;
}

export interface DispatchResponse {
  ok: boolean;
  verdict: {
    detectedIntent: string;
    dispatchedAgent: string;
    confidence: number;
    reasoning: string;
    isOffTopic?: boolean;
    unsubstantiatedRebuttal?: boolean;
  };
  primaryResponse: {
    agent: string;
    text: string;
    type: string;
  };
  followUpResponse?: {
    agent: string;
    text: string;
  };
  ragContextUsed?: {
    misconceptionId: string;
    title: string;
    correction: string;
  } | null;
  latencyMs: number;
  currentTimeStr: string;
  timestamp: string;
}

/**
 * Send learner input to the Runtime Intent Classifier & Dynamic Routing Dispatcher (#26)
 */
export async function dispatchRuntimeMessage(req: DispatchRequest): Promise<DispatchResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/runtime/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[DRE API] dispatchRuntimeMessage error, will use local fallback:', err);
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
