import { useState, useEffect, useRef, useCallback } from 'react';
import { ShowcaseStatus, SHOWCASE_STATIONS, ShowcaseStationConfig } from '../types/showcase';
import { LearningMode } from '../types/dre';

export interface ShowcaseControllerActions {
  setCurrentMode: (mode: LearningMode) => void;
  setActiveStudioView: (view: 'classroom' | 'warroom' | 'editor') => void;
  handleJumpToCheckpoint: () => void;
  // Có thể trả về Promise để controller đợi sessionId sẵn sàng (Blu #36-3)
  handleAnswerCheckpoint: (label: string, optionId?: string) => void | Promise<unknown>;
  handleSubmitRebuttal: (text: string, isEffective: boolean) => void | Promise<unknown>;
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

  // Blu #36-1 / #36-3: luôn đọc actions mới nhất, không bắt closure cũ
  const actionsRef = useRef<ShowcaseControllerActions>(actions);
  actionsRef.current = actions;

  // Token huỷ: tăng mỗi lần clearAllTimers để các async đang chờ tự bỏ
  const runIdRef = useRef<number>(0);

  // Blu #36-1: ?showcase=1 chỉ tự chạy đúng 1 lần
  const hasConsumedUrlAutostartRef = useRef<boolean>(false);

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
      const myRun = runIdRef.current;

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
          const a = actionsRef.current;
          a.setActiveStudioView('classroom');
          a.setCurrentMode('video_clash');
          a.setIsInspectorDrawerOpen(false);
          a.handleJumpToCheckpoint();
        }

        // Phản biện: chạy đúng mốc 4.4s, nhưng KHÔNG sớm hơn lúc câu trả lời xong
        const scheduleRebuttal = () => {
          const wait = Math.max(50, 4400 - (Date.now() - stepStartTimeRef.current));
          const t2 = setTimeout(() => {
            if (runIdRef.current !== myRun) return;
            const a = actionsRef.current;
            const rebText =
              a.currentVideoLesson?.rebuttalStickers?.[0]?.text ||
              'Độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng!';
            a.handleSubmitRebuttal(rebText, true);
          }, wait);
          timersRef.current.push(t2);
        };

        if (startOffsetMs < 2200) {
          // Chọn phương án bẫy (opt_b) tại giây 2.2
          const t1 = setTimeout(async () => {
            if (runIdRef.current !== myRun) return;
            const a = actionsRef.current;
            const opts: any[] = a.currentVideoLesson?.checkpointQuestion?.options ?? [];
            // Định danh ổn định, KHÔNG dùng label.includes('B') (khớp nhầm \vec{BC} của opt_a)
            const optB =
              opts.find((o: any) => o?.id === 'opt_b' || o?.id === 'B' || o?.isTrap === true) ??
              opts[1];
            if (optB) {
              await Promise.resolve(a.handleAnswerCheckpoint(optB.label, optB.id));
            }
            if (runIdRef.current !== myRun) return; // đã Esc/Pause trong lúc chờ
            scheduleRebuttal();
          }, Math.max(50, 2200 - startOffsetMs));
          timersRef.current.push(t1);
        } else if (startOffsetMs < 4400) {
          // Resume sau Pause khi đã qua bước chọn đáp án
          scheduleRebuttal();
        }
      } else if (stepNum === 2) {
        // TRẠM 2: Multi-Agent War Room (6s)
        actionsRef.current.setActiveStudioView('warroom');
        actionsRef.current.setIsInspectorDrawerOpen(false);
      } else if (stepNum === 3) {
        // TRẠM 3: Multi-Track Timeline (5s)
        actionsRef.current.setActiveStudioView('editor');
        actionsRef.current.setIsInspectorDrawerOpen(false);
      } else if (stepNum === 4) {
        // TRẠM 4: Đánh giá nhận thức Tháp Bloom (5s)
        actionsRef.current.setActiveStudioView('classroom');
        actionsRef.current.setCurrentMode('video_clash');
        actionsRef.current.setIsInspectorDrawerOpen(true);
      }

      // 3. Hết thời gian trạm: Chuyển trạm tiếp theo hoặc Hoàn tất
      const tEnd = setTimeout(() => {
        if (stepNum < 4) {
          actionsRef.current.playTabSound?.();
          const next = stepNum + 1;
          setCurrentStep(next);
          executeStationActions(next, 0);
        } else {
          // Hoàn tất Showcase
          clearAllTimers();
          setStatus('completed');
          actionsRef.current.playSuccessSound?.();
          const tDone = setTimeout(() => {
            stop();
          }, 3500);
          timersRef.current.push(tDone);
        }
      }, remainingTotal);

      timersRef.current.push(tEnd);
    },
    [clearAllTimers, stop]
  );

  // start ổn định (không phụ thuộc actions) -> effect autostart không chạy lại
  const start = useCallback(() => {
    stop();
    setStatus('running');
    setCurrentStep(1);
    actionsRef.current.playTabSound?.();
    executeStationActions(1, 0);
  }, [stop, executeStationActions]);

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
      actionsRef.current.playTabSound?.();
      const next = currentStepRef.current + 1;
      setCurrentStep(next);
      setStatus('running');
      executeStationActions(next, 0);
    } else {
      stop();
    }
  }, [executeStationActions, stop]);

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

  // Tự động khởi chạy ?showcase=1 / ?demo=1 ĐÚNG 1 LẦN khi mount.
  // Cờ consumed được set TRONG callback (không set lúc lên lịch) để React
  // StrictMode (mount -> cleanup -> mount) không làm mất lần chạy duy nhất.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasConsumedUrlAutostartRef.current) return;
    const s = new URLSearchParams(window.location.search);
    if (s.get('showcase') !== '1' && s.get('demo') !== '1') return;

    const timer = setTimeout(() => {
      hasConsumedUrlAutostartRef.current = true;
      start();
    }, 300);
    return () => clearTimeout(timer);
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
