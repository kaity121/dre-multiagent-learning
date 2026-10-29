/**
 * src/hooks/useRoundtableStream.ts
 *
 * React hook to manage real-time Server-Sent Events (SSE) streaming
 * from the DRE Multi-Agent Roundtable Orchestrator.
 * Supports both Live Generation and Replay of recorded runs with speed adjustment.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentReasoningEvent, ApprovedLessonPackage } from '../types/pipeline';
import {
  streamRoundtable,
  RoundtableStreamOptions,
  RoundtableRunSummary,
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
  lesson: ApprovedLessonPackage | null;
  status: StreamStatus;
  error: string | null;
  mode: 'live' | 'replay';
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
  const [lesson, setLesson] = useState<ApprovedLessonPackage | null>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'replay'>('live');
  const [runId, setRunId] = useState<string | null>(null);
  const [speed, setSpeedState] = useState<number>(defaultSpeed);
  const [runs, setRuns] = useState<RoundtableRunSummary[]>([]);
  const [crossCheckCorrectionOccurred, setCrossCheckCorrectionOccurred] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const refreshRuns = useCallback(async () => {
    try {
      const runList = await getRoundtableRuns();
      setRuns(runList);
    } catch (_) {}
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

  const reset = useCallback(() => {
    stopStream();
    setEvents([]);
    setCurrentEvent(null);
    setLesson(null);
    setStatus('idle');
    setError(null);
    setCrossCheckCorrectionOccurred(false);
  }, [stopStream]);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
  }, []);

  const startStream = useCallback(
    (opts: Partial<RoundtableStreamOptions> = {}) => {
      // Dừng phiên hiện tại nếu có
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      const streamMode = opts.mode || (opts.runId || opts.fixture ? 'replay' : 'live');
      setMode(streamMode);
      setEvents([]);
      setCurrentEvent(null);
      setLesson(null);
      setError(null);
      setStatus('connecting');
      setCrossCheckCorrectionOccurred(false);

      if (opts.runId) {
        setRunId(opts.runId);
      }

      const streamOptions: RoundtableStreamOptions = {
        videoId: opts.videoId || defaultVideoId,
        partNumber: opts.partNumber !== undefined ? opts.partNumber : defaultPartNumber,
        streamDelayMs: opts.streamDelayMs !== undefined ? opts.streamDelayMs : 30,
        useLLM: opts.useLLM !== undefined ? opts.useLLM : false,
        mode: streamMode,
        runId: opts.runId,
        speed: opts.speed || speed,
        fixture: opts.fixture !== undefined ? opts.fixture : false,

        onReasoning: (evt: AgentReasoningEvent) => {
          setStatus('streaming');
          setCurrentEvent(evt);
          setEvents((prev) => [...prev, evt]);

          if (
            evt.eventType === 'cross_check_verdict' ||
            (evt.toolCall && evt.toolCall.isValid === false)
          ) {
            setCrossCheckCorrectionOccurred(true);
          }
        },

        onDone: (data) => {
          if (data.runId) setRunId(data.runId);
        },

        onComplete: (data) => {
          setStatus('completed');
          if (data.runId) setRunId(data.runId);
          const approvedDraft = data.draft || data.part || null;
          if (approvedDraft) {
            setLesson(approvedDraft);
          }
          if (data.stats?.crossCheckCorrectionOccurred || data.part?.crossCheckCorrectionOccurred) {
            setCrossCheckCorrectionOccurred(true);
          }
          // Refresh saved runs
          refreshRuns();
        },

        onError: (err) => {
          console.error('[useRoundtableStream] Stream error:', err);
          setError(err?.error || err?.message || 'Lỗi kết nối Roundtable SSE');
          setStatus('error');
        },
      };

      unsubscribeRef.current = streamRoundtable(streamOptions);
    },
    [defaultVideoId, defaultPartNumber, speed, refreshRuns]
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

  // Derived stats
  const toolCallsCount = events.filter((e) => e.eventType === 'tool_call' || e.toolCall).length;
  const bloomEvent = events.find((e) => e.toolCall?.toolName === 'tool_evaluate_bloom_level');
  const bloomLevel = bloomEvent?.toolCall?.output?.level || 'Analyze';

  return {
    events,
    currentEvent,
    lesson,
    status,
    error,
    mode,
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
