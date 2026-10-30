import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShowcaseStatus,
  SHOWCASE_STATIONS,
  ShowcaseStationConfig,
  SPLIT_LENGTH_TRAP_OPTION_ID,
} from '../types/showcase';
import { LearningMode } from '../types/dre';

interface ShowcaseCheckpointOption {
  id: string;
  label: string;
  isStandardBest?: boolean;
}

export interface ShowcaseControllerActions {
  setCurrentMode: (mode: LearningMode) => void;
  setActiveStudioView: (view: 'classroom' | 'warroom' | 'editor') => void;
  handleJumpToCheckpoint: () => void;
  // May return a Promise so the controller can wait until the backend session is ready.
  handleAnswerCheckpoint: (label: string, optionId?: string) => void | Promise<unknown>;
  handleSubmitRebuttal: (text: string, isEffective: boolean) => void | Promise<unknown>;
  setIsInspectorDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  currentVideoLesson: {
    checkpointQuestion?: { options?: ShowcaseCheckpointOption[] };
    rebuttalStickers?: { text?: string }[];
  } | null | undefined;
  playTabSound?: () => void;
  playSuccessSound?: () => void;
}

const ANSWER_AT_MS = 2200;
const REBUTTAL_AT_MS = 4400;
// Upper bound on how long station 1 waits for a slow backend before moving on.
const STATION1_READINESS_TIMEOUT_MS = 8000;
const URL_AUTOSTART_DELAY_MS = 300;

function hasShowcaseUrlFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const s = new URLSearchParams(window.location.search);
  return s.get('showcase') === '1' || s.get('demo') === '1';
}

/** Pick the misconception option by stable id; never by label text or position. */
function pickTrapOption(options: ShowcaseCheckpointOption[]): ShowcaseCheckpointOption | undefined {
  return (
    options.find((o) => o?.id === SPLIT_LENGTH_TRAP_OPTION_ID) ??
    options.find((o) => o?.isStandardBest === false)
  );
}

export function useShowcaseController(actions: ShowcaseControllerActions) {
  const [status, setStatus] = useState<ShowcaseStatus>('idle');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [elapsedStationMs, setElapsedStationMs] = useState<number>(0);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepStartTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const currentStepRef = useRef<number>(1);
  const statusRef = useRef<ShowcaseStatus>('idle');

  // Always read the latest actions; App passes a fresh object every render.
  const actionsRef = useRef<ShowcaseControllerActions>(actions);
  actionsRef.current = actions;

  // Cancellation token: bumped by clearAllTimers so pending async work drops itself.
  const runIdRef = useRef<number>(0);

  // ?showcase=1 is consumed at most once, and any explicit start/stop/pause consumes it.
  const hasConsumedUrlAutostartRef = useRef<boolean>(false);

  // Station-1 progress of the current showcase run (reset by start()).
  const answerPromiseRef = useRef<Promise<void> | null>(null);
  const rebuttalPromiseRef = useRef<Promise<void> | null>(null);

  currentStepRef.current = currentStep;
  statusRef.current = status;

  const currentStation: ShowcaseStationConfig =
    SHOWCASE_STATIONS[currentStep - 1] || SHOWCASE_STATIONS[0];

  const clearAllTimers = useCallback(() => {
    runIdRef.current += 1;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetRun = useCallback(() => {
    clearAllTimers();
    setStatus('idle');
    setElapsedStationMs(0);
    pausedElapsedRef.current = 0;
  }, [clearAllTimers]);

  /** Explicit user stop: also cancels any pending URL autostart. */
  const stop = useCallback(() => {
    hasConsumedUrlAutostartRef.current = true;
    resetRun();
  }, [resetRun]);

  const answerTrap = useCallback((): Promise<void> => {
    const a = actionsRef.current;
    const trap = pickTrapOption(a.currentVideoLesson?.checkpointQuestion?.options ?? []);
    if (!trap) {
      console.warn('[Showcase] No misconception option found in the current checkpoint');
      return Promise.resolve();
    }
    return Promise.resolve(a.handleAnswerCheckpoint(trap.label, trap.id)).then(
      () => undefined,
      (err: unknown) => console.warn('[Showcase] Answer step failed:', err)
    );
  }, []);

  const submitRebuttal = useCallback((): Promise<void> => {
    const a = actionsRef.current;
    const rebText =
      a.currentVideoLesson?.rebuttalStickers?.[0]?.text ||
      'Độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng!';
    return Promise.resolve(a.handleSubmitRebuttal(rebText, true)).then(
      () => undefined,
      (err: unknown) => console.warn('[Showcase] Rebuttal step failed:', err)
    );
  }, []);

  const executeStationActions = useCallback(
    (stepNum: number, startOffsetMs: number = 0) => {
      clearAllTimers();
      const myRun = runIdRef.current;
      const isCurrentRun = () => runIdRef.current === myRun;

      stepStartTimeRef.current = Date.now() - startOffsetMs;
      setElapsedStationMs(startOffsetMs);

      const stationConfig = SHOWCASE_STATIONS[stepNum - 1];
      if (!stationConfig) return;

      const remainingTotal = Math.max(0, stationConfig.durationMs - startOffsetMs);

      intervalRef.current = setInterval(() => {
        setElapsedStationMs(Date.now() - stepStartTimeRef.current);
      }, 100);

      if (stepNum === 1) {
        if (startOffsetMs < 500 && !answerPromiseRef.current) {
          const a = actionsRef.current;
          a.setActiveStudioView('classroom');
          a.setCurrentMode('video_clash');
          a.setIsInspectorDrawerOpen(false);
          a.handleJumpToCheckpoint();
        }

        // The rebuttal is sent no earlier than its 4.4s mark AND only after the
        // answer has actually resolved (so a backend session created by the
        // answer is visible to the rebuttal). It is sent at most once per run.
        const scheduleRebuttalAfter = (answer: Promise<void>) => {
          answer.then(() => {
            if (!isCurrentRun() || rebuttalPromiseRef.current) return;
            const wait = Math.max(0, REBUTTAL_AT_MS - (Date.now() - stepStartTimeRef.current));
            const t = setTimeout(() => {
              if (!isCurrentRun() || rebuttalPromiseRef.current) return;
              rebuttalPromiseRef.current = submitRebuttal();
            }, wait);
            timersRef.current.push(t);
          });
        };

        if (answerPromiseRef.current) {
          // Resumed after the answer was dispatched.
          scheduleRebuttalAfter(answerPromiseRef.current);
        } else {
          const t1 = setTimeout(() => {
            if (!isCurrentRun()) return;
            answerPromiseRef.current = answerTrap();
            scheduleRebuttalAfter(answerPromiseRef.current);
          }, Math.max(0, ANSWER_AT_MS - startOffsetMs));
          timersRef.current.push(t1);
        }
      } else if (stepNum === 2) {
        actionsRef.current.setActiveStudioView('warroom');
        actionsRef.current.setIsInspectorDrawerOpen(false);
      } else if (stepNum === 3) {
        actionsRef.current.setActiveStudioView('editor');
        actionsRef.current.setIsInspectorDrawerOpen(false);
      } else if (stepNum === 4) {
        actionsRef.current.setActiveStudioView('classroom');
        actionsRef.current.setCurrentMode('video_clash');
        actionsRef.current.setIsInspectorDrawerOpen(true);
      }

      const advance = () => {
        if (!isCurrentRun()) return;
        if (stepNum < 4) {
          actionsRef.current.playTabSound?.();
          const next = stepNum + 1;
          setCurrentStep(next);
          executeStationActions(next, 0);
        } else {
          clearAllTimers();
          setStatus('completed');
          actionsRef.current.playSuccessSound?.();
          const tDone = setTimeout(() => resetRun(), 3500);
          timersRef.current.push(tDone);
        }
      };

      const tEnd = setTimeout(() => {
        if (!isCurrentRun()) return;
        if (stepNum !== 1) {
          advance();
          return;
        }
        // Station 1 leaves only once the rebuttal has settled (bounded wait).
        const waitForRebuttal = new Promise<void>((resolve) => {
          const poll = () => {
            if (!isCurrentRun()) return resolve();
            if (rebuttalPromiseRef.current) {
              rebuttalPromiseRef.current.then(resolve);
              return;
            }
            const t = setTimeout(poll, 100);
            timersRef.current.push(t);
          };
          poll();
        });
        const timeout = new Promise<void>((resolve) => {
          const t = setTimeout(resolve, STATION1_READINESS_TIMEOUT_MS);
          timersRef.current.push(t);
        });
        Promise.race([waitForRebuttal, timeout]).then(advance);
      }, remainingTotal);

      timersRef.current.push(tEnd);
    },
    [clearAllTimers, resetRun, answerTrap, submitRebuttal]
  );

  const start = useCallback(() => {
    hasConsumedUrlAutostartRef.current = true;
    resetRun();
    answerPromiseRef.current = null;
    rebuttalPromiseRef.current = null;
    setStatus('running');
    setCurrentStep(1);
    actionsRef.current.playTabSound?.();
    executeStationActions(1, 0);
  }, [resetRun, executeStationActions]);

  const togglePause = useCallback(() => {
    hasConsumedUrlAutostartRef.current = true;
    if (statusRef.current === 'running') {
      clearAllTimers();
      pausedElapsedRef.current = Date.now() - stepStartTimeRef.current;
      setStatus('paused');
    } else if (statusRef.current === 'paused') {
      setStatus('running');
      executeStationActions(currentStepRef.current, pausedElapsedRef.current);
    }
  }, [clearAllTimers, executeStationActions]);

  const nextStation = useCallback(() => {
    if (currentStepRef.current < 4) {
      actionsRef.current.playTabSound?.();
      const next = currentStepRef.current + 1;
      setCurrentStep(next);
      setStatus('running');
      executeStationActions(next, 0);
    } else {
      stop();
    }
  }, [executeStationActions, stop]);

  // Keyboard shortcuts: F2 toggles, Escape stops, Space pauses/resumes.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (statusRef.current === 'idle') {
          start();
        } else {
          stop();
        }
        return;
      }

      if (e.key === 'Escape') {
        // Escape before the URL autostart fires cancels it as well.
        hasConsumedUrlAutostartRef.current = true;
      }

      if (statusRef.current === 'running' || statusRef.current === 'paused') {
        if (e.key === 'Escape') {
          e.preventDefault();
          stop();
          return;
        }

        const target = e.target as HTMLElement | null;
        const isInput =
          !!target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable);

        if (e.key === ' ' && !isInput) {
          e.preventDefault();
          togglePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [start, stop, togglePause]);

  // ?showcase=1 / ?demo=1 autostarts once on mount. The consumed flag is set by
  // start() itself (not when scheduling) so a StrictMode mount/cleanup/mount
  // cycle keeps the single run, while any explicit stop/pause/Escape cancels it.
  useEffect(() => {
    if (hasConsumedUrlAutostartRef.current || !hasShowcaseUrlFlag()) return;
    const timer = setTimeout(() => {
      if (hasConsumedUrlAutostartRef.current) return;
      start();
    }, URL_AUTOSTART_DELAY_MS);
    return () => clearTimeout(timer);
  }, [start]);

  useEffect(() => clearAllTimers, [clearAllTimers]);

  const totalDuration = currentStation.durationMs;
  const progressPercent = Math.min(100, (elapsedStationMs / totalDuration) * 100);
  const remainingSeconds = Math.max(0, Math.ceil((totalDuration - elapsedStationMs) / 1000));

  return {
    status,
    currentStep,
    currentStation,
    progressPercent,
    remainingSeconds,
    start,
    stop,
    togglePause,
    nextStation,
  };
}
