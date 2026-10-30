/**
 * src/hooks/useRoundtableStream.ts
 *
 * React hook to manage real-time Server-Sent Events (SSE) streaming
 * from the DRE Multi-Agent Roundtable Orchestrator.
 * Supports both Live Generation and Replay of recorded runs with speed adjustment.
 *
 * `mode` is what the user asked for; `provenance` is what the events actually are
 * (live run, replay of a recording, or the bundled fixture when the backend is unreachable).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentReasoningEvent, DRELessonSchema } from '../types/pipeline';
import {
  streamRoundtable,
  RoundtableStreamOptions,
  RoundtableRunSummary,
  RoundtableProvenance,
  RoundtableApproval,
  RoundtableGenerationInfo,
  getRoundtableRuns,
} from '../services/dreBackendApi';

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error';

export interface UseRoundtableStreamOptions {
  autoConnect?: boolean;
  defaultVideoId?: string;
  defaultPartNumber?: number;
  defaultSpeed?: number;
}

export interface UseRoundtableStreamReturn {
  events: AgentReasoningEvent[];
  currentEvent: AgentReasoningEvent | null;
  lesson: DRELessonSchema | null;
  approval: RoundtableApproval | null;
  generation: RoundtableGenerationInfo | null;
  status: StreamStatus;
  error: string | null;
  mode: 'live' | 'replay';
  provenance: RoundtableProvenance | null;
  runId: string | null;
  speed: number;
  runs: RoundtableRunSummary[];
  crossCheckCorrectionOccurred: boolean;
  stats: {
    totalEvents: number;
    toolCallsCount: number;
    bloomLevel: string;
  };
  startStream: (options?: Partial<RoundtableStreamOptions>) => void;
  stopStream: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  refreshRuns: () => Promise<void>;
}

export function useRoundtableStream({
  autoConnect = false,
  defaultVideoId = 'VID_VECTO_12_TIEN',
  defaultPartNumber = 3,
  defaultSpeed = 1,
}: UseRoundtableStreamOptions = {}): UseRoundtableStreamReturn {
  const [events, setEvents] = useState<AgentReasoningEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<AgentReasoningEvent | null>(null);
  const [lesson, setLesson] = useState<DRELessonSchema | null>(null);
  const [approval, setApproval] = useState<RoundtableApproval | null>(null);
  const [generation, setGeneration] = useState<RoundtableGenerationInfo | null>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'replay'>('live');
  const [provenance, setProvenance] = useState<RoundtableProvenance | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [speed, setSpeedState] = useState<number>(defaultSpeed);
  const [runs, setRuns] = useState<RoundtableRunSummary[]>([]);
  const [crossCheckCorrectionOccurred, setCrossCheckCorrectionOccurred] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const refreshRuns = useCallback(async () => {
    try {
      setRuns(await getRoundtableRuns());
    } catch (err) {
      console.warn('[useRoundtableStream] Không tải được danh sách runs:', err);
    }
  }, []);

  useEffect(() => {
    refreshRuns();
  }, [refreshRuns]);

  const stopStream = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setStatus((prev) => (prev === 'streaming' || prev === 'connecting' ? 'idle' : prev));
  }, []);

  const clearRunState = useCallback(() => {
    setEvents([]);
    setCurrentEvent(null);
    setLesson(null);
    setApproval(null);
    setGeneration(null);
    setError(null);
    setCrossCheckCorrectionOccurred(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    clearRunState();
    setProvenance(null);
    setStatus('idle');
  }, [stopStream, clearRunState]);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
  }, []);

  const startStream = useCallback(
    (opts: Partial<RoundtableStreamOptions> = {}) => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      const streamMode = opts.mode || (opts.runId || opts.fixture ? 'replay' : 'live');
      setMode(streamMode);
      setProvenance(null);
      setRunId(opts.runId || null);
      clearRunState();
      setStatus('connecting');

      const streamOptions: RoundtableStreamOptions = {
        videoId: opts.videoId || defaultVideoId,
        partNumber: opts.partNumber !== undefined ? opts.partNumber : defaultPartNumber,
        streamDelayMs: opts.streamDelayMs !== undefined ? opts.streamDelayMs : 30,
        useLLM: opts.useLLM !== undefined ? opts.useLLM : false,
        mode: streamMode,
        runId: opts.runId,
        speed: opts.speed || speed,
        fixture: opts.fixture !== undefined ? opts.fixture : false,
        fallbackToOffline: opts.fallbackToOffline,

        // One history per run: whatever arrives after a session start belongs to that session only.
        onSession: (info) => {
          clearRunState();
          setProvenance(info.provenance);
          setRunId(info.runId);
        },

        onReasoning: (evt: AgentReasoningEvent) => {
          setStatus('streaming');
          setCurrentEvent(evt);
          setEvents((prev) => [...prev, evt]);
          if (evt.eventType === 'cross_check_verdict' && evt.toolCall?.isValid === false) {
            setCrossCheckCorrectionOccurred(true);
          }
        },

        onComplete: (data) => {
          setStatus('completed');
          setProvenance(data.provenance);
          if (data.runId) setRunId(data.runId);
          setLesson(data.lesson);
          setApproval(data.approval);
          setGeneration(data.generation || null);
          if (data.stats?.crossCheckCorrectionOccurred) {
            setCrossCheckCorrectionOccurred(true);
          }
          refreshRuns();
        },

        onError: (err) => {
          console.error('[useRoundtableStream] Stream error:', err);
          setError(err.error || 'Lỗi kết nối Roundtable SSE');
          setStatus('error');
        },
      };

      unsubscribeRef.current = streamRoundtable(streamOptions);
    },
    [defaultVideoId, defaultPartNumber, speed, refreshRuns, clearRunState]
  );

  useEffect(() => {
    if (autoConnect) {
      startStream();
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [autoConnect, startStream]);

  const toolCallsCount = events.filter((e) => e.eventType === 'tool_call').length;
  const bloomEvent = events.find((e) => e.toolCall?.toolName === 'tool_evaluate_bloom_level');
  const bloomLevel = bloomEvent?.toolCall?.output?.level || 'Analyze';

  return {
    events,
    currentEvent,
    lesson,
    approval,
    generation,
    status,
    error,
    mode,
    provenance,
    runId,
    speed,
    runs,
    crossCheckCorrectionOccurred,
    stats: {
      totalEvents: events.length,
      toolCallsCount,
      bloomLevel,
    },
    startStream,
    stopStream,
    reset,
    setSpeed,
    refreshRuns,
  };
}
