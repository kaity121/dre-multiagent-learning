import { useState, useEffect, useRef, useCallback } from 'react';
import { ShowcaseStatus, SHOWCASE_STATIONS, ShowcaseStationConfig } from '../types/showcase';
import { LearningMode } from '../types/dre';

export interface ShowcaseControllerActions {
  setCurrentMode: (mode: LearningMode) => void;
  setActiveStudioView: (view: 'classroom' | 'warroom' | 'editor') => void;
  handleJumpToCheckpoint: () => void;
  handleAnswerCheckpoint: (label: string, optionId?: string) => void;
  handleSubmitRebuttal: (text: string, isEffective: boolean) => void;
  setIsInspectorDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  currentVideoLesson: any;
  playTabSound?: () => void;
  playSuccessSound?: () => void;
}

export function useShowcaseController(actions: ShowcaseControllerActions) {
  const [status, setStatus] = useState<ShowcaseStatus>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('showcase') === '1' || s.get('demo') === '1') {
        return 'running';
      }
    }
    return 'idle';
  });
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [elapsedStationMs, setElapsedStationMs] = useState<number>(0);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepStartTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const currentStepRef = useRef<number>(1);
  const statusRef = useRef<ShowcaseStatus>('idle');

  currentStepRef.current = currentStep;
  statusRef.current = status;

  const currentStation: ShowcaseStationConfig =
    SHOWCASE_STATIONS[currentStep - 1] || SHOWCASE_STATIONS[0];

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearAllTimers();
    setStatus('idle');
    setElapsedStationMs(0);
    pausedElapsedRef.current = 0;
  }, [clearAllTimers]);

  // Thực thi hành vi cho từng trạm
  const executeStationActions = useCallback(
    (stepNum: number, startOffsetMs: number = 0) => {
      clearAllTimers();

      stepStartTimeRef.current = Date.now() - startOffsetMs;
      setElapsedStationMs(startOffsetMs);

      const stationConfig = SHOWCASE_STATIONS[stepNum - 1];
      if (!stationConfig) return;

      const remainingTotal = stationConfig.durationMs - startOffsetMs;

      // 1. Ticker cập nhật thanh tiến trình mỗi 100ms
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - stepStartTimeRef.current;
        setElapsedStationMs(elapsed);
      }, 100);

      // 2. Kịch bản từng trạm
      if (stepNum === 1) {
        // TRẠM 1: Lớp học tương tác (7s)
        if (startOffsetMs < 500) {
          actions.setActiveStudioView('classroom');
          actions.setCurrentMode('video_clash');
          actions.setIsInspectorDrawerOpen(false);
          actions.handleJumpToCheckpoint();
        }

        // Chọn phương án B tại giây thứ 2.2
        if (startOffsetMs < 2200) {
          const t1 = setTimeout(() => {
            const optB =
              actions.currentVideoLesson?.checkpointQuestion?.options?.find(
                (o: any) => o.label.includes('1 + 1 = 2') || o.label.includes('B')
              )?.label || '1 + 1 = 2 (Tách độ dài)';
            actions.handleAnswerCheckpoint(optB);
          }, Math.max(50, 2200 - startOffsetMs));
          timersRef.current.push(t1);
        }

        // Phản biện sắc bén tại giây thứ 4.4
        if (startOffsetMs < 4400) {
          const t2 = setTimeout(() => {
            const rebText =
              actions.currentVideoLesson?.rebuttalStickers?.[0]?.text ||
              'Độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng!';
            actions.handleSubmitRebuttal(rebText, true);
          }, Math.max(50, 4400 - startOffsetMs));
          timersRef.current.push(t2);
        }
      } else if (stepNum === 2) {
        // TRẠM 2: Multi-Agent War Room (6s)
        actions.setActiveStudioView('warroom');
        actions.setIsInspectorDrawerOpen(false);
      } else if (stepNum === 3) {
        // TRẠM 3: Multi-Track Timeline (5s)
        actions.setActiveStudioView('editor');
        actions.setIsInspectorDrawerOpen(false);
      } else if (stepNum === 4) {
        // TRẠM 4: Đánh giá nhận thức Tháp Bloom (5s)
        actions.setActiveStudioView('classroom');
        actions.setCurrentMode('video_clash');
        actions.setIsInspectorDrawerOpen(true);
      }

      // 3. Hết thời gian trạm: Chuyển trạm tiếp theo hoặc Hoàn tất
      const tEnd = setTimeout(() => {
        if (stepNum < 4) {
          actions.playTabSound?.();
          const next = stepNum + 1;
          setCurrentStep(next);
          executeStationActions(next, 0);
        } else {
          // Hoàn tất Showcase
          clearAllTimers();
          setStatus('completed');
          actions.playSuccessSound?.();
          const tDone = setTimeout(() => {
            stop();
          }, 3500);
          timersRef.current.push(tDone);
        }
      }, remainingTotal);

      timersRef.current.push(tEnd);
    },
    [actions, clearAllTimers, stop]
  );

  const start = useCallback(() => {
    stop();
    setStatus('running');
    setCurrentStep(1);
    actions.playTabSound?.();
    executeStationActions(1, 0);
  }, [stop, actions, executeStationActions]);

  const togglePause = useCallback(() => {
    if (statusRef.current === 'running') {
      // Tạm dừng
      clearAllTimers();
      pausedElapsedRef.current = Date.now() - stepStartTimeRef.current;
      setStatus('paused');
    } else if (statusRef.current === 'paused') {
      // Tiếp tục
      setStatus('running');
      executeStationActions(currentStepRef.current, pausedElapsedRef.current);
    }
  }, [clearAllTimers, executeStationActions]);

  const nextStation = useCallback(() => {
    if (currentStepRef.current < 4) {
      actions.playTabSound?.();
      const next = currentStepRef.current + 1;
      setCurrentStep(next);
      setStatus('running');
      executeStationActions(next, 0);
    } else {
      stop();
    }
  }, [actions, executeStationActions, stop]);

  // Lắng nghe phím tắt bàn phím F2, Esc, Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Phím F2: Bật/Tắt chế độ Showcase
      if (e.key === 'F2') {
        e.preventDefault();
        if (statusRef.current === 'idle') {
          start();
        } else {
          stop();
        }
        return;
      }

      // Khi Showcase đang hoạt động: Esc hoặc Space
      if (statusRef.current === 'running' || statusRef.current === 'paused') {
        if (e.key === 'Escape') {
          e.preventDefault();
          stop();
          return;
        }

        // Phím Space: Tạm dừng / Tiếp tục (chỉ khi không đang gõ trong input/textarea)
        const target = e.target as HTMLElement;
        const isInput =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable);

        if (e.key === ' ' && !isInput) {
          e.preventDefault();
          togglePause();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [start, stop, togglePause]);

  // Tự động khởi chạy nếu URL có query ?showcase=1 hoặc ?demo=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('showcase') === '1' || s.get('demo') === '1') {
        const timer = setTimeout(() => {
          start();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [start]);

  // Dọn dẹp timers khi unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const totalDuration = currentStation.durationMs;
  const progressPercent = Math.min(100, (elapsedStationMs / totalDuration) * 100);
  const remainingSeconds = Math.max(
    0,
    Math.ceil((totalDuration - elapsedStationMs) / 1000)
  );

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
