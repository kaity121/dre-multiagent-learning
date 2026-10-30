/**
 * DRE Learning Prototype - Sổ Tay Học Toán Cùng Bo & Cô Lam
 * Visual aesthetic: Authentic tactile Sketchbook / Spiral Notebook with cozy desk flatlay.
 * Features cute Chibi Bo and gentle Cô Lam illustrations, 100% custom SVG icons (zero keyboard emojis),
 * and clean Vietnamese handwriting typography.
 * 
 * Supports 4 Interactive Flow Archetypes:
 * 1. Sổ tay bắt lỗi (DRE Classic): Chẩn đoán -> Sửa lỗi -> Giải thích
 * 2. Video bài giảng & Bo phản biện (Video Checkpoint & Peer Clash): Dừng video -> Tranh luận đấu đá bẫy trực giác
 * 3. Dự đoán kết quả (Predict - Observe - Explain / POE)
 * 4. Gia sư nhí (Protégé Teaching): Học viên giảng lại cho Bo
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DEMO_LESSON_SCHEMA, DEMO_REASONING_EVENTS, DEMO_INSPECTOR_TURNS } from './demo/demoLesson';
import { InspectorTurn } from './types/reasoning';
import type { TimelineComment } from './types/dre';
import { ResizableSplitter } from './components/layout/ResizableSplitter';
import { DRELessonSchema } from './types/lesson';
import { ReplaySource } from './services/reasoningSource';
import { createSSEClient } from './services/sseClient';
import { WarRoomPanel } from './components/warroom/WarRoomPanel';
import { TimelineEditor } from './components/timeline/TimelineEditor';
import { useLessonStore, lessonStore } from './store/lessonStore';
import { mapReasoningEventsToInspectorTurns, mapBackendToReasoningEvent } from './services/reasoningAdapter';
import mockReasoningEvents from '../mock/mock_reasoning_events.json';
import mockLessonSchema from '../mock/lesson.json';

const baseReplayEvents = ((mockReasoningEvents as any[]) || []).map(mapBackendToReasoningEvent);
const lastReplayTs = baseReplayEvents.length > 0
  ? baseReplayEvents[baseReplayEvents.length - 1].timestamp
  : new Date('2026-10-26T09:00:35.000Z').getTime();

const FULL_REPLAY_REASONING_EVENTS = [
  ...baseReplayEvents,
  {
    id: 'ev_019_done',
    timestamp: lastReplayTs + 1000,
    agent: 'Assessor',
    eventType: 'done' as const,
    phase: 'bloom' as const,
    content: 'Kết thúc phát lại fixture (18 sự kiện)',
    metadata: { lesson: mockLessonSchema },
    normalized: true as const,
  },
];
import {
  InspectorDrawer,
} from './components/inspector/InspectorDrawer';
import { useShowcaseController } from './hooks/useShowcaseController';
import { SPLIT_LENGTH_TRAP_OPTION_ID } from './types/showcase';
import { ShowcaseHUD } from './components/showcase/ShowcaseHUD';
import { 
  DREState, 
  LearnerLevel, 
  MisconceptionItem, 
  LearningMode, 
  VideoCheckpointPhase, 
  VideoLessonItem 
} from './types/dre';
import { MISCONCEPTION_LIBRARY } from './data/misconceptions';
import { VIDEO_LESSON_LIBRARY } from './data/videoLessons';
import { WorkingObjectSheet } from './components/WorkingObjectSheet';
import { InteractionCardSheet } from './components/InteractionCardSheet';
import { VideoPlayerSheet } from './components/VideoPlayerSheet';
import { VideoDebateSheet } from './components/VideoDebateSheet';
import { AlternativeFlowsSheet } from './components/AlternativeFlowsSheet';
import { PauseModal } from './components/PauseModal';
import { adaptLessonToPlayer, hasCheckpoint } from './utils/lessonAdapter';
import { LessonSelectorDrawer } from './components/LessonSelectorDrawer';
import { ScenarioPlayerBar } from './components/ScenarioPlayerBar';
import { LearningFlowGuideModal } from './components/LearningFlowGuideModal';
import { MaicPeerClassroomDock } from './components/MaicPeerClassroomDock';
import { PreClassLobbyModal } from './components/PreClassLobbyModal';
import { OnboardingModal } from './components/OnboardingModal';
import { MultiAgentInspectorModal } from './components/MultiAgentInspectorModal';
import { JourneyTopBar } from './components/journey/JourneyTopBar';
import { JourneyRail, type JourneyRailProps } from './components/journey/JourneyRail';
import { Station1TaskCard } from './components/journey/Station1TaskCard';
import { VideoActionBar } from './components/journey/VideoActionBar';
import { VideoStrip } from './components/journey/VideoStrip';
import { deriveJourneyStops, deriveTaskBeat, formatClock, lessonIdentity, type StationStatus } from './components/journey/journeyModel';
import { AgentMapDialog } from './components/agentmap/AgentMapDialog';
import dreLogoImg from './assets/dre-logo.png';
import { sound } from './utils/soundEffects';
import { withTimeout, CHECKPOINT_BACKEND_TIMEOUT_MS } from './utils/withTimeout';
import { 
  evaluateStepAndExplanation, 
  getBoChallenge, 
  getBoConcession, 
  evaluateRebuttalOffline 
} from './utils/evaluator';
import { 
  checkBackendHealth, 
  startBackendSession, 
  submitBackendAnswer, 
  submitBackendRebuttal,
  dispatchRuntimeMessage
} from './services/dreBackendApi';

const cleanText = (str?: string) => (str ? str.replace(/\u20d7/g, '') : '');

export default function App() {
  // Current active mode (Default to Trạm 1: Video Checkpoint & Bo phản biện)
  const [currentMode, setCurrentMode] = useState<LearningMode>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('station');
      if (s === '1' || s === 'video_clash') return 'video_clash';
      if (s === '2' || s === 'worksheet') return 'worksheet';
      if (s === '3' || s === 'predict_poe') return 'predict_poe';
      if (s === '4' || s === 'protege_teaching') return 'protege_teaching';
      const sum = new URLSearchParams(window.location.search).get('summary');
      if (sum) return 'protege_teaching';
    }
    return 'video_clash';
  });
  const [reactionToast, setReactionToast] = useState<string | null>(null);

  const handleQuickReaction = (type: 'understood' | 'confused') => {
    sound.playPencilTap();
    if (type === 'understood') {
      setReactionToast('Đã ghi nhận: Bạn nắm vững đoạn này');
    } else {
      setReactionToast('Đã ghi nhận: Bạn chưa rõ đoạn này');
    }
    setTimeout(() => setReactionToast(null), 2500);
  };

  // Backend Multi-Agent AI States (Connected to dre-backend Express on port 3001)
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = backendSessionId;
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [liveBoDialogue, setLiveBoDialogue] = useState<string | null>(null);
  const [liveCoLamDialogue, setLiveCoLamDialogue] = useState<string | string[] | null>(null);
  const [liveHintDialogue, setLiveHintDialogue] = useState<string | null>(null);

  // Worksheet Mode States
  const [selectedLevel, setSelectedLevel] = useState<LearnerLevel>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      const lvl = s.get('level');
      if (lvl === 'beginner' || lvl === 'intermediate' || lvl === 'advanced') return lvl;
    }
    return 'intermediate';
  });
  const [currentLesson, setCurrentLesson] = useState<MisconceptionItem>(MISCONCEPTION_LIBRARY[0]);
  const [currentState, setCurrentState] = useState<DREState>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('state');
      if (s === 'idle') return 'IDLE';
      if (s === 'hint') return 'HINT';
      if (s === 'challenge') return 'BO_CHALLENGE';
      if (s === 'close') return 'CLOSE';
      const p = new URLSearchParams(window.location.search).get('step');
      if (p) return 'MARKED';
    }
    return 'IDLE';
  });
  const [selectedStep, setSelectedStep] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('state');
      if (s === 'idle') return null;
      if (s === 'hint') return 1;
      const p = new URLSearchParams(window.location.search).get('step');
      if (p) return parseInt(p, 10);
    }
    return null;
  });
  const [explanationText, setExplanationText] = useState<string>('');
  const [worksheetRebuttalText, setWorksheetRebuttalText] = useState<string>('');
  const [worksheetHintLevel, setWorksheetHintLevel] = useState<number>(0);

  // Video Mode States
  const [currentVideoLesson, setCurrentVideoLesson] = useState<VideoLessonItem>(VIDEO_LESSON_LIBRARY[0]);
  const [videoPhase, setVideoPhase] = useState<VideoCheckpointPhase>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      const cp = s.get('checkpoint_phase');
      if (cp === 'question') return 'CHECKPOINT_REACHED';
      if (cp === 'bo_debate') return 'BO_DEBATE';
      if (cp === 'co_lam') return 'BO_CONCEDED';
      if (s.get('banner') === '1' || s.get('collapsed') === '1') return 'CHECKPOINT_REACHED';
    }
    return 'WATCHING';
  });
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('time');
      if (t) return parseInt(t, 10);
    }
    return 0;
  });
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  // Journey shell state: whether Cô Lam has closed the checkpoint this session, and play requests
  // the task card sends to the embedded player.
  const [checkpointResolved, setCheckpointResolved] = useState<boolean>(false);
  const [playRequest, setPlayRequest] = useState<{ id: number; fromSecond?: number } | null>(null);
  const [isAgentMapOpen, setIsAgentMapOpen] = useState<boolean>(false);
  const [agentMapFocusId, setAgentMapFocusId] = useState<string | null>(null);
  const [agentMapExtraTurn, setAgentMapExtraTurn] = useState<InspectorTurn | null>(null);
  const [isPeerNotebookOpen, setIsPeerNotebookOpen] = useState<boolean>(false);
  const [showVideoInFaceOff, setShowVideoInFaceOff] = useState<boolean>(false);
  const [lastRebuttalText, setLastRebuttalText] = useState<string | null>(null);
  const stationTopRef = useRef<HTMLDivElement | null>(null);
  const taskCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (videoPhase === 'BO_CONCEDED' || videoPhase === 'CO_LAM_CLOSURE') setCheckpointResolved(true);
  }, [videoPhase]);
  const [currentPoeTopic, setCurrentPoeTopic] = useState<string>('Toán 12 · Biến thể Vectơ trong không gian (Thầy Nguyễn Phan Tiến)');
  const [isQuizCollapsedToChat, setIsQuizCollapsedToChat] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('collapsed') === '1' || s.get('banner') === '1') return true;
    }
    return false;
  });
  const [isQuizSkipped, setIsQuizSkipped] = useState<boolean>(false);
  const [savedSelectedOptionId, setSavedSelectedOptionId] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);
  const [externalQuestionTrigger, setExternalQuestionTrigger] = useState<{ id: number; text: string } | null>(null);
  const [chatFocusRequest, setChatFocusRequest] = useState<{ id: number; prefix: string } | null>(null);
  const [showAllTimeline, setShowAllTimeline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('all_chat') === '1' || s.get('timeline') === 'all') return true;
    }
    return false;
  });
  const [isPoeCompleted, setIsPoeCompleted] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(sound.getEnabled());

  // Multi-Agent Studio Views (War Room, Timeline Editor, Inspector)
  const [activeStudioView, setActiveStudioView] = useState<'classroom' | 'warroom' | 'editor'>(() => {
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v === 'editor' || v === 'warroom') return v;
    }
    return 'classroom';
  });
  const [lessonStoreState] = useLessonStore();
  const [currentLessonSchema, setCurrentLessonSchema] = useState<DRELessonSchema>(
    () => lessonStoreState.currentLessonSchema || DEMO_LESSON_SCHEMA
  );

  // Tự động đồng bộ state từ store chung khi có cập nhật kịch bản đã duyệt
  useEffect(() => {
    if (lessonStoreState.currentLessonSchema) {
      setCurrentLessonSchema(lessonStoreState.currentLessonSchema);
    }
    if (lessonStoreState.currentVideoLesson) {
      setCurrentVideoLesson(lessonStoreState.currentVideoLesson);
    }
  }, [lessonStoreState.currentLessonSchema, lessonStoreState.currentVideoLesson]);
  const [useLiveSSE, setUseLiveSSE] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('stream') === 'live' || s.get('sse') === '1') return true;
    }
    return false;
  });

  const activeReasoningSource = useMemo(() => {
    if (useLiveSSE) {
      return createSSEClient({
        videoId: currentVideoLesson.id,
        streamDelayMs: 25,
      });
    }
    const isShowcase = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('showcase') === '1');
    return new ReplaySource(FULL_REPLAY_REASONING_EVENTS as any, isShowcase ? 6.0 : 1.0);
  }, [useLiveSSE, currentVideoLesson.id]);
  const [inspectorTurns, setInspectorTurns] = useState<InspectorTurn[]>(() => DEMO_INSPECTOR_TURNS);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(() => Math.max(0, DEMO_INSPECTOR_TURNS.length - 1));

  // Tự động cập nhật activeTurnIndex theo lượt mới nhất khi có thêm turn tương tác
  useEffect(() => {
    if (inspectorTurns.length > 0) {
      setActiveTurnIndex(inspectorTurns.length - 1);
    }
  }, [inspectorTurns.length]);

  // Tự động map luồng sự kiện từ reasoning source sang inspector turns (Issue #16)
  useEffect(() => {
    const unsub = activeReasoningSource.subscribe(() => {
      const history = activeReasoningSource.getHistory();
      if (history && history.length > 0) {
        const turns = mapReasoningEventsToInspectorTurns(history);
        if (turns.length > 0) {
          setInspectorTurns(turns);
        }
      }
    });
    return () => unsub();
  }, [activeReasoningSource]);

  // Kích thước co giãn tự do cho Trạm 1 (Mục B Layout Elasticity)
  const [chatWidth, setChatWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      const l = s.get('layout');
      if (l === 'video_wide') return 300;
      if (l === 'chat_wide') return 520;
      if (l === 'default') return 400;
      try {
        const saved = localStorage.getItem('dre_station1_chat_width');
        if (saved) return Math.max(300, Math.min(640, Number(saved)));
      } catch (e) {}
    }
    return 400;
  });

  const handleChatSplitterDelta = (deltaX: number) => {
    setChatWidth((prev) => {
      const next = Math.max(300, Math.min(640, prev - deltaX));
      try {
        localStorage.setItem('dre_station1_chat_width', String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleResetChatWidth = () => {
    sound.playPencilTap();
    const defaultW = 400;
    setChatWidth(defaultW);
    try {
      localStorage.setItem('dre_station1_chat_width', String(defaultW));
    } catch (e) {}
  };

  const [isInspectorDrawerOpen, setIsInspectorDrawerOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('inspector') === '1';
    }
    return false;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isInput) return;

      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setIsInspectorDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTriggerRaiseHand = () => {
    sound.playStampThud();
    setIsChaptersDrawerOpen(false);
    setIsRaiseHandModalOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsVideoPlaying(false);
        setVideoPhase('STUDENT_FREEZE');
      } else {
        setVideoPhase('WATCHING');
      }
      return next;
    });
    const mm = Math.floor(videoCurrentTime / 60);
    const ss = Math.floor(videoCurrentTime % 60);
    const timeStr = `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    setChatFocusRequest({
      id: Date.now(),
      prefix: `[Tại ${timeStr}] `,
    });
  };

  // Modals & Drawers
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      const l = s.get('lessons');
      return l === '1' || l === 'bai9' || s.get('drawer') === 'lessons';
    }
    return false;
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('onboarding') === '1') return true;
    }
    return false;
  });
  const [isAiInspectorOpen, setIsAiInspectorOpen] = useState(false);
  const [isFlowGuideOpen, setIsFlowGuideOpen] = useState(false);
  const [isChaptersDrawerOpen, setIsChaptersDrawerOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [isRaiseHandModalOpen, setIsRaiseHandModalOpen] = useState(false);

  // Dynamic dialog overrides for worksheet mode
  const [tutorFeedbackOverride, setTutorFeedbackOverride] = useState<string | null>(null);
  const [boSpeechOverride, setBoSpeechOverride] = useState<string | null>(null);
  const [probeQuestionOverride, setProbeQuestionOverride] = useState<string | null>(null);

  // Scenario runner tracking
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  // QA / Dev bar visibility: hidden by default; toggled via keyboard shortcut (Ctrl+Shift+D, Ctrl+Shift+K, or F2)
  const [showQaBar, setShowQaBar] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('debug') === '1';
    }
    return false;
  });

  // Global Keyboard Shortcut listener to toggle Test Case bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle QA test case bar on Ctrl+Shift+D, Ctrl+Shift+K or Ctrl+Alt+T (F2 belongs to the demo).
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) ||
        (e.ctrlKey && e.altKey && (e.key === 'T' || e.key === 't'))
      ) {
        e.preventDefault();
        setShowQaBar((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-play demo walkthrough state (1 chạm chạy liên hoàn 4 trạm)
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const [autoWalkStep, setAutoWalkStep] = useState(1);
  const [autoWalkMessage, setAutoWalkMessage] = useState<string>('');
  const autoWalkTimersRef = useRef<any[]>([]);

  // Cleanup auto-walk timers on unmount
  useEffect(() => {
    return () => {
      autoWalkTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // LocalStorage persistence for true "Tạm dừng, quay lại sau"
  const DRE_STORAGE_KEY = 'dre_saved_session_v1';
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());

  // Sảnh chờ trước lớp học (Khảo sát đầu vào & Đặt tên học sinh)
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('lobby') === '1') return false;
      return true;
    }
    return true;
  });
  const [learnerProfile, setLearnerProfile] = useState<{ name: string; level: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('dre_learner_profile');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // Restore saved session from localStorage on initial load
  useEffect(() => {
    try {
      const savedStr = localStorage.getItem(DRE_STORAGE_KEY);
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved.lessonId) {
          const match = MISCONCEPTION_LIBRARY.find((m) => m.id === saved.lessonId);
          if (match) setCurrentLesson(match);
        }
        if (saved.videoLessonId) {
          const matchVid = VIDEO_LESSON_LIBRARY.find((v) => v.id === saved.videoLessonId);
          if (matchVid) setCurrentVideoLesson(matchVid);
        }
        if (saved.selectedLevel) setSelectedLevel(saved.selectedLevel);
        if (saved.currentState) {
          setCurrentState(saved.currentState);
          if (saved.currentState === 'IDLE') {
            setSelectedStep(null);
          } else if (saved.selectedStep !== undefined) {
            setSelectedStep(saved.selectedStep);
          }
        }
        if (saved.explanationText) setExplanationText(saved.explanationText);
        if (saved.worksheetRebuttalText) setWorksheetRebuttalText(saved.worksheetRebuttalText);
        if (saved.worksheetHintLevel !== undefined) setWorksheetHintLevel(saved.worksheetHintLevel);
        if (saved.boSpeechOverride) setBoSpeechOverride(saved.boSpeechOverride);
        if (saved.tutorFeedbackOverride) setTutorFeedbackOverride(saved.tutorFeedbackOverride);
        if (saved.probeQuestionOverride) setProbeQuestionOverride(saved.probeQuestionOverride);
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const hasUrlStation = Boolean(urlParams?.get('station'));
        if (!hasUrlStation && saved.currentMode) setCurrentMode(saved.currentMode);
        // On reload the lecture continues at the saved second (paused), and a checkpoint that
        // Cô Lam already closed stays closed. An open checkpoint restarts from watching.
        const hasUrlOverride = Boolean(
          urlParams?.get('checkpoint_phase') ||
          urlParams?.get('banner') ||
          urlParams?.get('collapsed') ||
          urlParams?.get('time')
        );
        if (!hasUrlOverride) {
          const savedSecond = Number(saved.videoCurrentTime);
          setVideoCurrentTime(Number.isFinite(savedSecond) && savedSecond > 0 ? Math.floor(savedSecond) : 0);
          if (saved.checkpointResolved === true) setCheckpointResolved(true);
          setVideoPhase('WATCHING');
          setIsVideoPlaying(false);
          setIsQuizCollapsedToChat(false);
          setIsQuizSkipped(false);
          setSavedSelectedOptionId(null);
        }
        if (saved.savedAt) setLastSavedTimestamp(saved.savedAt);
      }
    } catch (e) {
      console.warn('[DRE] Failed to restore session from localStorage:', e);
    }
  }, []);

  // Auto-save session progress to localStorage whenever state changes (Debounced 500ms dứt điểm hiện tượng giật lag khi nhập liệu)
  const saveTimeoutRef = useRef<any>(null);
  useEffect(() => {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const now = Date.now();
        const sessionData = {
          currentMode,
          lessonId: currentLesson.id,
          selectedLevel,
          currentState,
          selectedStep,
          explanationText,
          worksheetRebuttalText,
          worksheetHintLevel,
          boSpeechOverride,
          tutorFeedbackOverride,
          probeQuestionOverride,
          videoLessonId: currentVideoLesson.id,
          videoPhase,
          videoCurrentTime,
          checkpointResolved,
          savedAt: now,
        };
        localStorage.setItem(DRE_STORAGE_KEY, JSON.stringify(sessionData));
        setLastSavedTimestamp(now);
      } catch (e) {
        console.warn('[DRE] Failed to save session to localStorage:', e);
      }
    }, 500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [
    currentMode,
    currentLesson.id,
    selectedLevel,
    currentState,
    selectedStep,
    explanationText,
    worksheetRebuttalText,
    worksheetHintLevel,
    boSpeechOverride,
    tutorFeedbackOverride,
    probeQuestionOverride,
    currentVideoLesson.id,
    videoPhase,
    videoCurrentTime,
    checkpointResolved,
  ]);

  // Inactivity tracking (45s nudge threshold) - Dùng ref để 0ms re-render
  const lastActiveTimestamp = useRef<number>(Date.now());

  // Periodically check if dre-backend is running
  useEffect(() => {
    let mounted = true;
    const probeBackend = async () => {
      const live = await checkBackendHealth();
      if (mounted) setIsBackendLive(live);
    };
    probeBackend();
    const interval = setInterval(probeBackend, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Reset activity timestamp on user interaction (Thuần ref, không kích hoạt re-render)
  const recordUserActivity = () => {
    lastActiveTimestamp.current = Date.now();
  };

  // Timer loop for 45s tutor nudge in worksheet mode (Chỉ kích hoạt re-render duy nhất khi vượt ngưỡng 45s)
  useEffect(() => {
    if (currentMode !== 'worksheet') return;
    const timer = setInterval(() => {
      if (currentState === 'MARKED' || currentState === 'EXPLAIN_PROMPT') {
        const elapsed = Math.floor((Date.now() - lastActiveTimestamp.current) / 1000);
        if (elapsed >= 45) {
          setCurrentState('TUTOR_NUDGE');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentMode, currentState]);

  // Video playback ticker effect (CHỈ chạy timer giả lập nếu bài giảng KHÔNG DÙNG YouTube iframe)
  useEffect(() => {
    let interval: any = null;
    if (currentMode === 'video_clash' && isVideoPlaying && !currentVideoLesson.youtubeId) {
      interval = setInterval(() => {
        setVideoCurrentTime((prev) => {
          const next = prev + 1;
          // Trigger checkpoint stop
          if (hasCheckpoint(currentVideoLesson) && next >= currentVideoLesson.checkpointTimestamp && videoPhase === 'WATCHING') {
            setIsVideoPlaying(false);
            setVideoPhase('CHECKPOINT_REACHED');
            return currentVideoLesson.checkpointTimestamp;
          }
          // End of video
          if (next >= currentVideoLesson.duration) {
            setIsVideoPlaying(false);
            return currentVideoLesson.duration;
          }
          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [currentMode, isVideoPlaying, videoPhase, currentVideoLesson]);

  // =========================================================================
  // WORKSHEET HANDLERS
  // =========================================================================

  const handleSelectStep = useCallback((stepNumber: number) => {
    recordUserActivity();
    setSelectedStep(stepNumber);
    setBoSpeechOverride(null);
    setTutorFeedbackOverride(null);
    setCurrentState('MARKED');
  }, []);

  const handleExplanationChange = useCallback((text: string) => {
    recordUserActivity();
    setExplanationText(text);
    setCurrentState((prev) => (prev === 'MARKED' ? 'EXPLAIN_PROMPT' : prev));
  }, []);

  const handleSubmitExplanation = async () => {
    recordUserActivity();
    if (!selectedStep) return;

    if (selectedStep !== currentLesson.errorStepIndex) {
      setCurrentState('HINT');
      setBoSpeechOverride(null);
      setTutorFeedbackOverride(null);
      return;
    }

    // Step is correct (Step 2) -> evaluate user explanation
    const evalResult = evaluateStepAndExplanation(currentLesson, selectedStep, explanationText);

    if (evalResult.explanationQuality === 'thorough') {
      // User provided a sharp / complete explanation (e.g. AC - AB' = c - a - b or khẩu quyết lộn ngược)
      setBoSpeechOverride(evalResult.reactionBo || getBoConcession(currentLesson));
      setTutorFeedbackOverride(evalResult.feedbackTutor);
      setCurrentState('CLOSE');
      return;
    }

    // Step is correct but explanation is partial or empty -> Bo challenges with shortcut fallacy
    setCurrentState('BO_CHALLENGE');
    setWorksheetHintLevel(0);
    setWorksheetRebuttalText('');
    setBoSpeechOverride(evalResult.reactionBo || getBoChallenge(currentLesson));
    if (evalResult.explanationQuality === 'partial') {
      setTutorFeedbackOverride(evalResult.feedbackTutor);
    } else {
      setTutorFeedbackOverride(null);
    }

    // Pre-start backend session in background if backend is live so rebuttal is ready
    if (isBackendLive && !backendSessionId) {
      startBackendSession(currentLesson.id)
        .then((res) => {
          if (res?.sessionId) {
            sessionIdRef.current = res.sessionId;
            setBackendSessionId(res.sessionId);
          }
        })
        .catch(() => {});
    }
  };

  const handleSubmitWorksheetRebuttal = async () => {
    recordUserActivity();
    if (!worksheetRebuttalText.trim()) return;

    const currentRebuttal = worksheetRebuttalText.trim();

    // Check backend with a strict 3.5s timeout so user is never stuck
    if (isBackendLive && backendSessionId) {
      setIsLoadingAi(true);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout 3.5s')), 3500)
        );
        const rebRes: any = await Promise.race([
          submitBackendRebuttal(backendSessionId, currentRebuttal),
          timeoutPromise,
        ]);
        if (rebRes) {
          if (rebRes.danhGiaPhanBien === 'sac_ben' || rebRes.done) {
            if (rebRes.boDialogue) setBoSpeechOverride(rebRes.boDialogue);
            const closure = Array.isArray(rebRes.coLamDialogue) ? rebRes.coLamDialogue.join(' ') : rebRes.coLamDialogue;
            if (closure) setTutorFeedbackOverride(closure);
            setCurrentState('CLOSE');
            setWorksheetRebuttalText('');
            setIsLoadingAi(false);
            return;
          } else {
            // chua_ro with hint
            if (rebRes.boDialogue) setBoSpeechOverride(rebRes.boDialogue);
            const hint = Array.isArray(rebRes.coLamDialogue) ? rebRes.coLamDialogue.join(' ') : rebRes.coLamDialogue;
            setTutorFeedbackOverride(hint || 'Cô Lam: Hãy xem lại bản chất quy tắc toán học nhé!');
            setWorksheetHintLevel((prev) => (rebRes.hintLevel !== undefined ? rebRes.hintLevel : prev + 1));
            setIsLoadingAi(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[DRE Worksheet] Backend rebuttal error or timeout, falling back immediately:', err);
      }
      setIsLoadingAi(false);
    }

    // Fast semantic / rule-based evaluator fallback:
    const offlineRes = evaluateRebuttalOffline(currentLesson, currentRebuttal);
    if (offlineRes.isSharp) {
      setBoSpeechOverride(offlineRes.boReaction);
      setTutorFeedbackOverride(offlineRes.tutorFeedback);
      setCurrentState('CLOSE');
      setWorksheetRebuttalText('');
    } else {
      setTutorFeedbackOverride(offlineRes.tutorFeedback);
      const nextLevel = worksheetHintLevel + 1;
      setWorksheetHintLevel(nextLevel);
      if (nextLevel >= 2) {
        // Max 2 turns reached -> close with synthesis
        setBoSpeechOverride(getBoConcession(currentLesson));
        setCurrentState('CLOSE');
        setWorksheetRebuttalText('');
      } else {
        setBoSpeechOverride('Ủa nhưng giải thích như vậy tớ vẫn chưa thông lắm, cậu nói rõ hơn chút nữa đi?');
      }
    }
  };

  const handleRequestHint = () => {
    recordUserActivity();
    if (currentState === 'TUTOR_NUDGE') {
      setCurrentState('EXPLAIN_PROMPT');
    }
  };

  const handleNextLesson = () => {
    const currentIndex = MISCONCEPTION_LIBRARY.findIndex(l => l.id === currentLesson.id);
    const nextLesson = MISCONCEPTION_LIBRARY[(currentIndex + 1) % MISCONCEPTION_LIBRARY.length];
    handleSwitchLesson(nextLesson);
  };

  const handleRetryLesson = () => {
    setSelectedStep(null);
    setExplanationText('');
    setWorksheetRebuttalText('');
    setWorksheetHintLevel(0);
    setCurrentState('IDLE');
    setBoSpeechOverride(null);
    setTutorFeedbackOverride(null);
    setProbeQuestionOverride(null);
    setActiveScenario(null);
    recordUserActivity();
  };

  const handleSwitchLesson = (lesson: MisconceptionItem) => {
    setCurrentLesson(lesson);
    setSelectedLevel(lesson.level);
    handleRetryLesson();
  };

  // Run scripted scenario for rapid verification (Only available in ?debug=1)
  const handleRunScenario = (num: 1 | 2 | 3) => {
    setActiveScenario(num);
    recordUserActivity();
    setBackendSessionId(null);
    setCurrentMode('worksheet');

    if (num === 1) {
      setSelectedStep(currentLesson.errorStepIndex);
      setExplanationText(currentLesson.standardExplanation);
      setCurrentState('CLOSE');
      setTutorFeedbackOverride(`Chính xác! Bo đã ${currentLesson.errorDescription.toLowerCase()}`);
      setBoSpeechOverride(getBoConcession(currentLesson));
    } else if (num === 2) {
      const wrongStep = currentLesson.errorStepIndex === 1 ? 2 : 1;
      setSelectedStep(wrongStep);
      setExplanationText('Chắc là do bước này tính toán sai?');
      setCurrentState('HINT');
      setBoSpeechOverride('Dòng đó tớ kiểm tra kỹ rồi mà ta? Cậu xem lại các dòng khác thử xem!');
      setTutorFeedbackOverride(`Dòng đó chưa phải chỗ cần soi đâu. ${currentLesson.hintLevel1}`);
    } else if (num === 3) {
      setSelectedStep(currentLesson.errorStepIndex);
      setExplanationText('Vì bước này giải sai quy tắc');
      setCurrentState('BO_CHALLENGE');
      setBoSpeechOverride(getBoChallenge(currentLesson));
    }
  };

  const handleTriggerNudge = () => {
    if (!selectedStep) {
      setSelectedStep(currentLesson.errorStepIndex);
    }
    setCurrentState('TUTOR_NUDGE');
  };

  const handleDismissNudge = () => {
    recordUserActivity();
    setCurrentState('EXPLAIN_PROMPT');
  };

  // =========================================================================
  // VIDEO CHECKPOINT & PEER CLASH HANDLERS
  // =========================================================================

  const handleToggleVideoPlay = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const handleSeekVideo = (time: number, isManualSeek: boolean = false) => {
    setVideoCurrentTime(time);
    // Chỉ kích hoạt lại Checkpoint khi người dùng chủ động tua (manual seek) đến mốc checkpoint và chưa bị skip
    // Tránh việc timer phát 400ms tick lại rơi vào [T-3, T+3] tự động mở lại sau khi vừa bấm Bỏ qua (Skip)
    if (
      isManualSeek &&
      !isQuizSkipped &&
      hasCheckpoint(currentVideoLesson) &&
      Math.abs(time - currentVideoLesson.checkpointTimestamp) <= 3 &&
      videoPhase === 'WATCHING'
    ) {
      handleJumpToCheckpoint();
    }
  };

  const handleJumpToCheckpoint = () => {
    // The teacher may have disabled every pause question; there is nothing to jump to.
    if (!hasCheckpoint(currentVideoLesson)) return;
    sound.playStampThud();
    setIsChaptersDrawerOpen(false);
    setIsRaiseHandModalOpen(false);
    setIsQuizCollapsedToChat(false);
    setIsQuizSkipped(false);
    setVideoCurrentTime(currentVideoLesson.checkpointTimestamp);
    setIsVideoPlaying(false);
    setLiveBoDialogue(null);
    setLiveCoLamDialogue(null);
    setLiveHintDialogue(null);
    setVideoPhase('CHECKPOINT_REACHED');
  };

  const handleSkipCheckpoint = () => {
    sound.playPencilTap();
    setIsQuizSkipped(true);
    setIsQuizCollapsedToChat(true);
    setVideoPhase('WATCHING');
    setIsVideoPlaying(true);
    setVideoCurrentTime(currentVideoLesson.checkpointTimestamp + 1);
  };

  const handleTriggerFreeze = () => {
    setIsVideoPlaying(false);
    setVideoPhase('STUDENT_FREEZE');
  };

  const handleChatMessageProcessed = (chatInfo: { text: string; author: string; reply: any; second: number; messageId?: string }) => {
    const turnNumber = inspectorTurns.length + 1;
    const rawAuthor = chatInfo.reply?.author || 'Trí';
    const cleanAgent = rawAuthor.replace(/^(Bạn học|Trợ giảng|Cô|Thầy)\s*/i, '').trim() || 'Trí';
    const isTa = rawAuthor.includes('Trợ giảng');
    const isTeacher = rawAuthor.includes('Cô Lam');

    const hasMeasuredDispatcher = Boolean(chatInfo.reply?.verdict);
    const measuredVerdict = chatInfo.reply?.verdict;
    const measuredConfidence = typeof measuredVerdict?.confidence === 'number'
      ? measuredVerdict.confidence
      : (typeof chatInfo.reply?.confidence === 'number' ? chatInfo.reply.confidence : undefined);
    const measuredIntent = measuredVerdict?.detectedIntent || chatInfo.reply?.intent || (chatInfo.reply?.kbMatchedId ? `Truy vấn kiến thức (${chatInfo.reply.kbMatchedId})` : undefined);
    const measuredAgent = measuredVerdict?.dispatchedAgent
      ? (measuredVerdict.dispatchedAgent === 'colam' ? 'Cô Lam' : measuredVerdict.dispatchedAgent === 'bo' ? 'Bo' : measuredVerdict.dispatchedAgent === 'linhchi' ? 'Linh Chi' : measuredVerdict.dispatchedAgent === 'minhkhang' ? 'Minh Khang' : measuredVerdict.dispatchedAgent === 'an' ? 'An' : rawAuthor)
      : rawAuthor;

    const newTurn: InspectorTurn = {
      turnId: `chat-turn-${Date.now()}`,
      timestamp: Date.now(),
      turnNumber,
      timestampStr: `${Math.floor(chatInfo.second / 60)}:${(chatInfo.second % 60).toString().padStart(2, '0')}`,
      agent: isTeacher ? 'Cô Lam' : isTa ? 'An' : cleanAgent,
      dispatcher: {
        intent: measuredIntent || 'Hỏi đáp lớp học',
        selectedAgent: measuredAgent || cleanAgent,
        confidence: measuredConfidence,
        reason: measuredVerdict?.reasoning || `Học sinh trao đổi: "${chatInfo.text.slice(0, 80)}". Điều phối ${rawAuthor} giải đáp trực tiếp.`,
        isEvaluated: typeof measuredConfidence === 'number',
      },
      contextView: {
        visibleContext: [
          `Tin nhắn học sinh: "${chatInfo.text}"`,
          `Thời điểm bài giảng: ${Math.floor(chatInfo.second / 60)}:${(chatInfo.second % 60).toString().padStart(2, '0')}`,
          chatInfo.reply?.kbMatchedId ? `Tri thức RAG: ${chatInfo.reply.kbMatchedId}` : 'Hỏi đáp tương tác đa tác tử',
        ],
        hiddenContext: [
          'Kịch bản phân tầng trợ giúp',
          'Lịch sử tương tác lớp học',
        ],
        isEvaluated: Boolean(chatInfo.reply?.kbMatchedId || chatInfo.reply?.ragContextUsed),
        cognitiveMetrics: {
          hesitationScore: typeof chatInfo.reply?.hesitationScore === 'number' ? chatInfo.reply.hesitationScore : undefined,
          comprehensionScore: typeof chatInfo.reply?.comprehensionScore === 'number' ? chatInfo.reply.comprehensionScore : undefined,
          misconceptionDetected: Boolean(chatInfo.reply?.kbMatchedId),
          isEvaluated: typeof chatInfo.reply?.hesitationScore === 'number' || typeof chatInfo.reply?.comprehensionScore === 'number',
        },
      },
      dialogue: chatInfo.reply?.text || '',
      question: chatInfo.text,
      messageId: chatInfo.messageId,
      citations: Array.isArray(chatInfo.reply?.citations) ? chatInfo.reply.citations : undefined,
      toolCalls: chatInfo.reply?.toolCalls || (chatInfo.reply?.toolCall ? [chatInfo.reply.toolCall] : []),
      assessor: (chatInfo.reply?.assessment || chatInfo.reply?.assessor || chatInfo.reply?.bloomLevel !== undefined || chatInfo.reply?.hesitationScore !== undefined) ? {
        matchedPoints: chatInfo.reply?.assessment?.matchedPoints || [],
        missingPoints: chatInfo.reply?.assessment?.missingPoints || [],
        bloomBefore: chatInfo.reply?.assessment?.bloomBefore,
        bloomAfter: chatInfo.reply?.assessment?.bloomAfter,
        bloomLevel: typeof chatInfo.reply?.bloomLevel === 'number' ? chatInfo.reply.bloomLevel : undefined,
        hesitationScore: typeof chatInfo.reply?.hesitationScore === 'number' ? chatInfo.reply.hesitationScore : undefined,
        hesitationLabel: typeof chatInfo.reply?.hesitationScore === 'number' ? (chatInfo.reply.hesitationScore < 0.3 ? 'thấp' : chatInfo.reply.hesitationScore < 0.7 ? 'trung bình' : 'cao') : undefined,
        verdictLabel: chatInfo.reply?.assessment?.verdictLabel || 'Đã đánh giá',
        isEvaluated: typeof chatInfo.reply?.bloomLevel === 'number' || typeof chatInfo.reply?.hesitationScore === 'number',
      } : undefined,
    };
    setInspectorTurns((prev) => [...prev, newTurn]);
  };

  const handleAnswerCheckpoint = async (optionLabel: string, optionId?: string) => {
    recordUserActivity();
    setLiveHintDialogue(null);
    setIsQuizSkipped(false);
    const resolvedId =
      optionId ||
      currentVideoLesson.checkpointQuestion.options.find(
        (o) => cleanText(o.label) === cleanText(optionLabel)
      )?.id ||
      'opt_a';
    setSavedSelectedOptionId(resolvedId);

    // Cập nhật lượt Soi não tác nhân tương ứng với câu trả lời thực tế của học sinh (P1 Fix)
    const turnNumber = inspectorTurns.length + 1;
    // Identify the misconception by stable option id, never by label text
    // (the correct option's label also contains "BC").
    const isOptionB = resolvedId === SPLIT_LENGTH_TRAP_OPTION_ID;
    const newAnswerTurn: InspectorTurn = {
      turnId: `live-ans-${Date.now()}`,
      timestamp: Date.now(),
      turnNumber,
      timestampStr: '37:13',
      agent: 'Bo',
      question: optionLabel,
      dispatcher: {
        intent: 'Phản biện lỗi nhận thức vectơ',
        selectedAgent: 'Bo',
        confidence: undefined,
        reason: `Học sinh đã chọn phương án "${optionLabel}". Kích hoạt phản biện trực tiếp để kiểm tra độ vững kiến thức.`,
        isEvaluated: false,
      },
      contextView: {
        visibleContext: [
          `Câu trả lời của học sinh: ${optionLabel}`,
          'Phân đoạn bài giảng: Ví dụ 3 - Hình lập phương ABCD.A\'B\'C\'D\'',
          'Độ dài các cạnh bằng 1',
        ],
        hiddenContext: [
          'Công thức chuẩn Cô Lam chuẩn bị chốt: Tuyệt đối không tách |a + b| = |a| + |b|',
          'Đáp án bài kiểm tra định kỳ liên quan',
        ],
        boardSnippet: "|BC + DD'| = ?",
        teacherSpeech: 'Cộng độ dài DD\' đấy bằng là 1 + 1 bằng...',
        ragKnowledge: 'Quy tắc hình hộp & cộng vectơ trong không gian',
      },
      thought: `Học sinh đã chọn "${optionLabel}". Mình cần phản biện ngay lập luận này xem bạn có nắm chắc bản chất vectơ hay không!`,
      speech: currentVideoLesson.boArgument?.speech || 'Ủa sao cậu phải đổi DD\' thành CC\' chi cho cực vậy?! Tớ thấy cứ tách ra là xong!',
      assessor: {
        matchedPoints: [
          'Tương tác kịp thời tại điểm dừng 37:13',
          'Đưa ra câu trả lời rõ ràng dứt khoát',
        ],
        missingPoints: isOptionB
          ? ['Đang ngộ nhận tách độ dài |a + b| = |a| + |b|']
          : ['Cần giải thích lý do thế vectơ DD\' = CC\''],
        bloomBefore: undefined,
        bloomAfter: undefined,
        bloomLevel: undefined,
        hesitationScore: undefined,
        hesitationLabel: undefined,
        verdictLabel: 'Kích hoạt tranh luận',
        matchedSummary: isOptionB ? 'Phát hiện ngộ nhận tách độ dài' : 'Khớp phương án đúng, kích hoạt phản biện kiểm chứng',
        isEvaluated: false,
      },
    };
    setInspectorTurns((prev) => [...prev, newAnswerTurn]);
    if (isBackendLive) {
      dispatchRuntimeMessage({
        message: `Học sinh chọn đáp án ${optionLabel}`,
        currentTime: 2233,
        recipient: 'bo',
        lessonTitle: currentVideoLesson.title,
        useLLM: false,
      }).then((res) => {
        if (res && res.ok && res.verdict) {
          setInspectorTurns((prev) =>
            prev.map((t) =>
              t.turnId === newAnswerTurn.turnId
                ? {
                    ...t,
                    dispatcher: {
                      intent: res.verdict.detectedIntent || (res as any).intent || t.dispatcher?.intent || 'Phản biện lỗi nhận thức vectơ',
                      selectedAgent: res.verdict.dispatchedAgent === 'bo' ? 'Bo' : res.verdict.dispatchedAgent === 'colam' ? 'Cô Lam' : res.verdict.dispatchedAgent === 'linhchi' ? 'Linh Chi' : res.verdict.dispatchedAgent === 'minhkhang' ? 'Minh Khang' : res.verdict.dispatchedAgent === 'an' ? 'An' : ((res as any).selectedAgent || t.dispatcher?.selectedAgent || '—'),
                      confidence: typeof res.verdict.confidence === 'number' ? res.verdict.confidence : (typeof (res as any).confidence === 'number' ? (res as any).confidence : undefined),
                      reason: res.verdict.reasoning || t.dispatcher?.reason || '',
                      isEvaluated: typeof res.verdict.confidence === 'number' || typeof (res as any).confidence === 'number',
                    },
                    latencyMs: typeof res.latencyMs === 'number' ? res.latencyMs : undefined,
                    contextView: {
                      ...t.contextView!,
                      isEvaluated: Boolean(res.ragContextUsed),
                      ragKnowledge: res.ragContextUsed
                        ? `RAG [${res.ragContextUsed.misconceptionId}]: ${res.ragContextUsed.correction}`
                        : t.contextView?.ragKnowledge,
                    },
                    assessor: t.assessor ? {
                      ...t.assessor,
                      isEvaluated: typeof (res as any).bloomLevel === 'number' || typeof (res as any).hesitationScore === 'number',
                      bloomLevel: typeof (res as any).bloomLevel === 'number' ? (res as any).bloomLevel : undefined,
                      hesitationScore: typeof (res as any).hesitationScore === 'number' ? (res as any).hesitationScore : undefined,
                    } : undefined,
                  }
                : t
            )
          );
        }
      }).catch((e) => console.warn('[App] dispatch answer error:', e));
    }

    // Đối với bài 1.1 Thầy Tiến (VID_VECTO_12): Luồng phản biện sư phạm đã được đóng gói chuẩn xác 100%
    if (currentVideoLesson.id === 'VID_VECTO_12') {
      sound.playStampThud();
      setLiveBoDialogue(currentVideoLesson.boArgument.speech);
      setVideoPhase('BO_DEBATE');
      return;
    }

    if (isBackendLive) {
      setIsLoadingAi(true);
      try {
        const miscId = currentVideoLesson.id === 'VID_002' ? 'MISC_002' : currentVideoLesson.id === 'VID_003' ? 'MISC_008' : 'MISC_001';
        let currentSess = backendSessionId;
        if (!currentSess) {
          const sessRes = await withTimeout(startBackendSession(miscId), CHECKPOINT_BACKEND_TIMEOUT_MS);
          if (sessRes) {
            currentSess = sessRes.sessionId;
            sessionIdRef.current = currentSess;
            setBackendSessionId(currentSess);
          }
        }

        if (currentSess) {
          const ansRes = await withTimeout(submitBackendAnswer(currentSess, optionLabel), CHECKPOINT_BACKEND_TIMEOUT_MS);
          if (ansRes && ansRes.boDialogue) {
            setLiveBoDialogue(ansRes.boDialogue);
            setVideoPhase('BO_DEBATE');
            setIsLoadingAi(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[DRE App] Backend answer error:', err);
      }
      setIsLoadingAi(false);
    }

    // Backend unreachable, slow or failed: Bo debates with the lesson's own argument.
    sound.playStampThud();
    setLiveBoDialogue(null);
    setVideoPhase('BO_DEBATE');
  };

  const handleSubmitRebuttal = async (rebuttalText: string, isEffective: boolean) => {
    recordUserActivity();

    // Ghi nhận lượt Soi não tác nhân khi học sinh phản biện thành công (P1 Fix)
    const liveTurnId = isEffective ? `live-reb-${Date.now()}` : '';
    if (isEffective) {
      const rebuttalTurnNumber = inspectorTurns.length + 1;
      const newRebuttalTurn: InspectorTurn = {
        turnId: liveTurnId,
        timestamp: Date.now(),
        turnNumber: rebuttalTurnNumber,
        timestampStr: '37:13',
        agent: 'Cô Lam',
        question: rebuttalText,
        dispatcher: {
          intent: 'Chốt quy tắc vàng & Tổng kết sư phạm',
          selectedAgent: 'Cô Lam',
          confidence: undefined,
          reason: 'Học sinh đã phản biện thành công lập luận sai của Bo. Cô Lam xuất hiện để chuẩn hóa kiến thức.',
          isEvaluated: false,
        },
        contextView: {
          visibleContext: [
            'Đề bài Ví dụ 3 câu a',
            "Biểu thức vectơ BC + DD'",
            'Quy tắc thế vectơ nối tiếp BC + CC\' = BC\'',
          ],
          hiddenContext: [
            'Nội dung phân đoạn tiếp theo: Quy tắc hình hộp chữ nhật',
          ],
          boardSnippet: "|BC + CC'| = |BC'| = √2",
          teacherSpeech: 'Tuyệt đối không tách độ dài tổng thành tổng độ dài!',
          ragKnowledge: 'Định lý Pytago tam giác vuông và quy tắc cộng vectơ',
        },
        thought: 'Học sinh nắm rất vững bản chất hình học và không bị Bo làm lung lay. Cần khen ngợi và chốt ngay quy tắc vàng!',
        speech: currentVideoLesson.teacherClosure?.goldenRule || 'Quy tắc vàng: Tuyệt đối không tách |a + b| = |a| + |b|.',
        assessor: {
          matchedPoints: [
            'Giải thích được việc thế DD\' = CC\' để nối tiếp',
            'Tính đúng độ dài đường chéo bằng căn bậc hai của 2',
            'Bác bỏ hoàn toàn ngộ nhận tách độ dài của Bo',
          ],
          missingPoints: [],
          bloomBefore: undefined,
          bloomAfter: undefined,
          bloomLevel: undefined,
          hesitationScore: undefined,
          hesitationLabel: undefined,
          verdictLabel: 'Phản biện sắc bén',
          matchedSummary: 'Đạt 3/3 ý cần có',
          isEvaluated: false,
        },
      };
      setInspectorTurns((prev) => [...prev, newRebuttalTurn]);
    }
    if (isBackendLive) {
      dispatchRuntimeMessage({
        message: rebuttalText,
        currentTime: 2233,
        recipient: 'all',
        lessonTitle: currentVideoLesson.title,
        useLLM: false,
      }).then((res) => {
        if (res && res.ok && res.verdict) {
          // The dispatcher may answer through any agent; only Bo's words go in Bo's panel and
          // only Cô Lam's in hers.
          const speaker = (r?: { agent?: string; author?: string }) => `${r?.author ?? ''} ${r?.agent ?? ''}`.toLowerCase();
          if (res.primaryResponse?.text && isEffective && /\bbo\b/.test(speaker(res.primaryResponse))) {
            setLiveBoDialogue(res.primaryResponse.text);
          }
          if (res.followUpResponse?.text && isEffective && speaker(res.followUpResponse).includes('lam')) {
            setLiveCoLamDialogue(res.followUpResponse.text);
          }
          if (isEffective && liveTurnId) {
            setInspectorTurns((prev) =>
              prev.map((t) =>
                t.turnId === liveTurnId
                  ? {
                      ...t,
                      dispatcher: {
                        intent: res.verdict.detectedIntent || 'Chốt quy tắc vàng & Tổng kết sư phạm',
                        selectedAgent: res.verdict.dispatchedAgent === 'colam' ? 'Cô Lam' : res.verdict.dispatchedAgent === 'bo' ? 'Bo' : (res.verdict.dispatchedAgent || '—'),
                        confidence: typeof res.verdict.confidence === 'number' ? res.verdict.confidence : undefined,
                        reason: res.verdict.reasoning || '',
                        isEvaluated: typeof res.verdict.confidence === 'number',
                      },
                      latencyMs: typeof res.latencyMs === 'number' ? res.latencyMs : undefined,
                      thought: res.primaryResponse?.text
                        ? `Tác nhân đã phân tích: "${res.verdict.reasoning}"`
                        : t.thought,
                      speech: res.followUpResponse?.text || res.primaryResponse?.text || t.speech,
                      contextView: {
                        visibleContext: t.contextView?.visibleContext || [],
                        hiddenContext: t.contextView?.hiddenContext || [],
                        boardSnippet: t.contextView?.boardSnippet || "|BC + CC'| = √2",
                        teacherSpeech: t.contextView?.teacherSpeech,
                        hiddenItem: t.contextView?.hiddenItem,
                        ragKnowledge: res.ragContextUsed
                          ? `RAG [${res.ragContextUsed.misconceptionId}]: ${res.ragContextUsed.correction}`
                          : t.contextView?.ragKnowledge,
                      },
                    }
                  : t
              )
            );
          }
        }
      }).catch((e) => console.warn('[App] dispatch rebuttal error:', e));
    }

    // Đối với bài 1.1 Thầy Tiến (VID_VECTO_12): Chốt quy tắc vàng ngay khi phản biện đúng
    if (currentVideoLesson.id === 'VID_VECTO_12') {
      if (isEffective) {
        sound.playSuccessChime();
        setLiveBoDialogue(currentVideoLesson.boConcession.speech);
        setLiveCoLamDialogue(currentVideoLesson.teacherClosure.goldenRule);
        setVideoPhase('BO_CONCEDED');
      } else {
        setLiveHintDialogue('Bo chưa phục đâu! Bạn hãy dùng quy tắc thế cạnh CC\' hoặc chỉ ra góc vuông nhé!');
      }
      return;
    }

    const activeSess = sessionIdRef.current || backendSessionId;
    if (isBackendLive && activeSess) {
      setIsLoadingAi(true);
      try {
        const rebRes = await withTimeout(submitBackendRebuttal(activeSess, rebuttalText), CHECKPOINT_BACKEND_TIMEOUT_MS);
        if (rebRes) {
          if (rebRes.danhGiaPhanBien === 'sac_ben' || rebRes.done) {
            if (rebRes.boDialogue) setLiveBoDialogue(rebRes.boDialogue);
            if (rebRes.coLamDialogue) setLiveCoLamDialogue(rebRes.coLamDialogue);
            setVideoPhase('BO_CONCEDED');
            setIsLoadingAi(false);
            return;
          } else {
            // chua_ro with hint
            const hint = Array.isArray(rebRes.coLamDialogue) ? rebRes.coLamDialogue.join(' ') : rebRes.coLamDialogue;
            setLiveHintDialogue(hint || 'Cô Lam: Hãy xem xét kỹ hơn điều kiện và bản chất toán học nhé!');
            setIsLoadingAi(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[DRE App] Backend rebuttal error:', err);
      }
      setIsLoadingAi(false);
    }

    // Backend unreachable, slow or failed: continue with the lesson's own data.
    if (isEffective) {
      sound.playSuccessChime();
      setLiveBoDialogue(null);
      setLiveCoLamDialogue(null);
      setVideoPhase('BO_CONCEDED');
    } else {
      setLiveHintDialogue('Bo chưa phục đâu! Hãy chỉ ra vì sao không được cộng thẳng hai độ dài.');
    }
  };

  const handleResumeVideoAfterClosure = () => {
    setVideoPhase('WATCHING');
    setIsVideoPlaying(true);
  };

  const handleSwitchVideoLesson = (lesson: VideoLessonItem) => {
    setCurrentVideoLesson(lesson);
    setCheckpointResolved(false);
    setVideoCurrentTime(0);
    setVideoPhase('WATCHING');
    setIsVideoPlaying(false);
    setBackendSessionId(null);
    setLiveBoDialogue(null);
    setLiveCoLamDialogue(null);
    setLiveHintDialogue(null);
  };

  // 1-Click Automated Showcase Controller (Issue #17)
  const showcase = useShowcaseController({
    setCurrentMode,
    setActiveStudioView,
    handleJumpToCheckpoint,
    handleAnswerCheckpoint,
    handleSubmitRebuttal,
    setIsInspectorDrawerOpen,
    currentVideoLesson,
    playTabSound: () => sound.playTabSwitch(),
    playSuccessSound: () => sound.playSuccessChime(),
  });

  // TỰ ĐỘNG CHẠY LIÊN HOÀN 4 TRẠM (1 CHẠM DEMO TUẦN TỰ)
  const stopAutoWalk = () => {
    autoWalkTimersRef.current.forEach(clearTimeout);
    autoWalkTimersRef.current = [];
    setIsAutoWalking(false);
    setAutoWalkMessage('');
  };

  const handleToggleAutoWalk = () => {
    if (isAutoWalking) {
      stopAutoWalk();
      return;
    }

    stopAutoWalk();
    setIsAutoWalking(true);
    setAutoWalkStep(1);
    setAutoWalkMessage('1/6: Trạm 1 - Phát video 00:00 & quan sát 24 thảo luận sinh viên bám sát bảng thầy Tiến');

    // BƯỚC 1: Về Trạm 1 lúc 00:00
    setCurrentMode('video_clash');
    setVideoCurrentTime(0);
    setVideoPhase('WATCHING');
    setIsVideoPlaying(true);
    setIsQuizCollapsedToChat(false);

    // BƯỚC 2: Nhảy tới điểm dừng 37:13 và thu câu hỏi xuống Chat
    const t1 = setTimeout(() => {
      setAutoWalkStep(2);
      setAutoWalkMessage('2/6: Trạm 1 - Dừng tại 37:13 khoảnh khắc bẫy độ dài & Thu câu hỏi xuống chat để nghe lại');
      handleJumpToCheckpoint();
      setIsQuizCollapsedToChat(true);
    }, 4500);

    // BƯỚC 3: Mở lại câu hỏi trên Video và chọn Đáp án A (Gom về BC')
    const t2 = setTimeout(() => {
      setAutoWalkStep(3);
      setAutoWalkMessage("3/6: Trạm 1 - Mở lại câu hỏi & chọn Đáp án A (Gom về BC') -> Bo cãi bướng 1+1=2");
      setIsQuizCollapsedToChat(false);
      handleAnswerCheckpoint(currentVideoLesson.checkpointQuestion.options[0].label);
    }, 9000);

    // BƯỚC 3b: Bắn Sticker phản biện Bo -> Cô Lam chốt quy tắc vàng
    const t3 = setTimeout(() => {
      setAutoWalkMessage('3b/6: Trạm 1 - Bắn Sticker phản biện hình học -> Cô Lam chốt quy tắc vàng sư phạm');
      handleSubmitRebuttal(currentVideoLesson.rebuttalStickers[0].text, true);
    }, 14000);

    // BƯỚC 4: Chuyển sang Trạm 2 (Bắt lỗi Bo viết xuôi ở Bước 2)
    const t4 = setTimeout(() => {
      setAutoWalkStep(4);
      setAutoWalkMessage('4/6: Trạm 2 - Sổ tay bắt lỗi Bo viết xuôi ở Bước 2 dựa trên khẩu quyết "Chung đầu - Lộn ngược"');
      setIsVideoPlaying(false);
      setCurrentMode('worksheet');
      handleRunScenario(1);
    }, 18500);

    // BƯỚC 5: Chuyển sang Trạm 3 (POE Thử thách dự đoán hướng vectơ)
    const t5 = setTimeout(() => {
      setAutoWalkStep(5);
      setAutoWalkMessage('5/6: Trạm 3 - POE Thử thách dự đoán hướng vectơ ngược chiều IA = -3·IG');
      setCurrentMode('predict_poe');
    }, 24500);

    // BƯỚC 6: Chuyển sang Trạm 4 (Dạy kèm Bo & Khảo sát Bloom)
    const t6 = setTimeout(() => {
      setAutoWalkStep(6);
      setAutoWalkMessage('6/6: Trạm 4 - Hiệu ứng người bảo trợ: Dạy kèm Bo & Khảo sát chẩn đoán Bloom');
      setCurrentMode('protege_teaching');
    }, 30500);

    // KẾT THÚC DEMO
    const t7 = setTimeout(() => {
      setAutoWalkMessage('🎉 Đã hoàn thành toàn bộ kịch bản 4 Trạm liên hoàn!');
      setTimeout(() => {
        stopAutoWalk();
      }, 3000);
    }, 36500);

    autoWalkTimersRef.current = [t1, t2, t3, t4, t5, t6, t7];
  };

  // =========================================================================
  // JOURNEY SHELL: rail, task beat, station switcher, Agent Map
  // =========================================================================
  const checkpointSecond = hasCheckpoint(currentVideoLesson) ? currentVideoLesson.checkpointTimestamp : null;
  const journeyInput = {
    currentMode,
    videoPhase,
    videoCurrentTime,
    checkpointTimestamp: checkpointSecond,
    checkpointResolved,
    isQuizSkipped,
  };
  const journeyStops = deriveJourneyStops(journeyInput);
  const taskBeat = deriveTaskBeat(journeyInput);
  const isFaceOffBeat = taskBeat === 'rebut' || taskBeat === 'closure';
  // During the face-off the paused video shrinks to a strip so the three panels fit the screen.
  const collapseVideo = currentMode === 'video_clash' && isFaceOffBeat && !showVideoInFaceOff;
  const lessonIdent = lessonIdentity(currentVideoLesson);

  const stationStatus: Record<LearningMode, StationStatus> = {
    video_clash: videoPhase === 'BO_CONCEDED' || checkpointResolved || isPoeCompleted ? 'done' : 'open',
    worksheet: currentState === 'CLOSE' ? 'done' : 'open',
    predict_poe: isPoeCompleted ? 'done' : 'open',
    protege_teaching: 'open',
  };

  const prevBeatRef = useRef(taskBeat);
  useEffect(() => {
    if (prevBeatRef.current === taskBeat) return;
    prevBeatRef.current = taskBeat;
    setShowVideoInFaceOff(false);
    if (taskBeat === 'watch') return;
    // Wait for the layout change (video strip) before scrolling.
    const raf = requestAnimationFrame(() => {
      const target = taskBeat === 'rebut' || taskBeat === 'closure' ? stationTopRef.current : taskCardRef.current;
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [taskBeat]);

  const handleSelectStation = (mode: LearningMode) => {
    sound.playTabSwitch();
    setActiveStudioView('classroom');
    if (mode !== 'video_clash') setIsVideoPlaying(false);
    setCurrentMode(mode);
  };

  const railActions: JourneyRailProps['actions'] = {};
  if (currentMode !== 'video_clash') {
    railActions.watch = { run: () => handleSelectStation('video_clash'), hint: 'Về Trạm 1 · Xem bài' };
  }
  if (checkpointSecond !== null && (currentMode !== 'video_clash' || videoPhase === 'WATCHING')) {
    railActions.bo_mistake = {
      run: () => {
        if (currentMode !== 'video_clash') handleSelectStation('video_clash');
        setIsQuizCollapsedToChat(false);
        handleJumpToCheckpoint();
      },
      hint: `Tua tới ${formatClock(checkpointSecond)} và mở câu hỏi dừng`,
    };
  }
  if (currentMode !== 'protege_teaching') {
    railActions.teach_back = { run: () => handleSelectStation('protege_teaching'), hint: 'Sang Trạm 4 · Dạy kèm Bo' };
  }

  const currentChapterTitle = (() => {
    const chapter = [...(currentVideoLesson.chapters || [])]
      .reverse()
      .find((ch) => videoCurrentTime >= ch.startSecond) || currentVideoLesson.chapters?.[0];
    return chapter ? cleanText(chapter.title) : 'Phân cảnh';
  })();

  const agentMapTurns = agentMapExtraTurn ? [...inspectorTurns, agentMapExtraTurn] : inspectorTurns;

  const openAgentMap = (turnId: string | null) => {
    sound.playBubblePop();
    if (!turnId) setAgentMapExtraTurn(null);
    setAgentMapFocusId(turnId);
    setIsAgentMapOpen(true);
  };

  // An evidence chip opens the turn that produced the message; scripted lecture messages have no
  // recorded turn, so the map is built from what the message itself carries.
  const handleOpenEvidence = (msg: TimelineComment) => {
    const existing = inspectorTurns.find((t) => t.messageId === msg.id);
    if (existing) {
      setAgentMapExtraTurn(null);
      openAgentMap(existing.turnId);
      return;
    }
    const tools = msg.toolCalls && msg.toolCalls.length > 0 ? msg.toolCalls : msg.toolCall ? [msg.toolCall] : [];
    const extra: InspectorTurn = {
      turnId: `msg-${msg.id}`,
      timestamp: Date.now(),
      timestampStr: formatClock(msg.second),
      agent: msg.author,
      dialogue: msg.text,
      question: msg.replyTo?.text,
      toolCalls: tools as unknown as InspectorTurn['toolCalls'],
      citations: (msg.citations || []).map((c) => ({ source: c.source, label: c.label, snippet: c.snippet, timestamp: c.timestamp })),
      messageId: msg.id,
    };
    setAgentMapExtraTurn(extra);
    openAgentMap(extra.turnId);
  };

  return (
    <>
      {/* QA Scenario Runner Bar: Only rendered when ?debug=1 or toggled via F2 / Ctrl+Shift+D */}
      {showQaBar && (
        <ScenarioPlayerBar
          isVisible={showQaBar}
          onToggleVisible={() => setShowQaBar(prev => !prev)}
          onRunScenario={handleRunScenario}
          onTriggerNudge={handleTriggerNudge}
          onTriggerVideoStart={() => {
            setCurrentMode('video_clash');
            setVideoCurrentTime(0);
            setVideoPhase('WATCHING');
            setIsVideoPlaying(false);
          }}
          onTriggerVideoScenario={() => {
            setCurrentMode('video_clash');
            setIsQuizCollapsedToChat(false);
            handleJumpToCheckpoint();
          }}
          onTriggerVideoEnd={() => {
            sound.playSuccessChime();
            setCurrentMode('video_clash');
            setVideoCurrentTime(currentVideoLesson.lectureEndSecond || 9503);
            setIsVideoPlaying(true);
          }}
          onTriggerStation={(station) => {
            if (station !== 'video_clash') setIsVideoPlaying(false);
            setCurrentMode(station);
          }}
          onReset={handleRetryLesson}
          activeScenario={activeScenario}
          idleTimerSeconds={0}
          isAutoWalking={isAutoWalking}
          autoWalkStep={autoWalkStep}
          onToggleAutoWalk={handleToggleAutoWalk}
          showAllTimeline={showAllTimeline}
          onToggleShowAllTimeline={() => setShowAllTimeline(prev => !prev)}
        />
      )}

      {/* BANNER THUYẾT MINH SƯ PHẠM KHI ĐANG CHẠY AUTO-WALK */}
      {isAutoWalking && (
        <div className="w-full bg-slate-900 text-white px-4 py-2 border-b border-cyan-500/40 shadow-lg flex items-center justify-between text-xs sticky top-0 z-40 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2.5 max-w-5xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="px-2 py-0.5 rounded bg-cyan-600/60 border border-cyan-400/40 font-sans text-xs font-bold shrink-0">
              DEMO LIÊN HOÀN ({autoWalkStep}/6)
            </span>
            <span className="font-semibold text-slate-200 truncate">{autoWalkMessage}</span>
          </div>
          <button
            type="button"
            onClick={stopAutoWalk}
            className="px-2.5 py-0.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[11px] cursor-pointer shrink-0 transition-colors"
          >
            ⏹ Dừng
          </button>
        </div>
      )}

      {/* SẢNH CHỜ TRƯỚC LỚP HỌC (2 BƯỚC: KHẢO SÁT & SẴN SÀNG) */}
      {(!isLoggedIn || isLobbyOpen) && (
        <PreClassLobbyModal
          initialName={learnerProfile?.name}
          initialLevel={learnerProfile?.level}
          onClose={isLoggedIn ? () => setIsLobbyOpen(false) : undefined}
          onCompleteLobby={(name, lvl) => {
            const profile = { name, level: lvl };
            setLearnerProfile(profile);
            localStorage.setItem('dre_learner_profile', JSON.stringify(profile));
            setIsLoggedIn(true);
            setIsLobbyOpen(false);
            setVideoCurrentTime(0);
            setVideoPhase('WATCHING');
            setIsVideoPlaying(false);
            setIsQuizCollapsedToChat(false);
            setIsQuizSkipped(false);
            setSavedSelectedOptionId(null);
          }}
        />
      )}

      {/* ====================================================================
          KHÔNG GIAN HỌC TẬP EDTECH 4 TRẠM - LIME SOFT DESIGN SYSTEM
          ==================================================================== */}
      <div className="min-h-screen bg-[#F3F8E8] text-[#121712] flex flex-col font-sans select-none">
        <JourneyTopBar
          logoSrc={dreLogoImg}
          lessonTitle={lessonIdent.title}
          teacherName={lessonIdent.teacher}
          currentMode={currentMode}
          stationStatus={stationStatus}
          onSelectStation={handleSelectStation}
          onOpenAgentMap={() => openAgentMap(null)}
          studioView={activeStudioView}
          onBackToClassroom={() => {
            sound.playTabSwitch();
            setActiveStudioView('classroom');
          }}
          onLogoClick={() => {
            sound.playBubblePop();
            setActiveStudioView('classroom');
          }}
          menu={{
            isSoundEnabled,
            onToggleSound: () => setIsSoundEnabled(sound.toggle()),
            onChangeLesson: () => setIsLessonDrawerOpen(true),
            onPause: () => setIsPauseOpen(true),
            levelLabel:
              learnerProfile?.level === 'new_learner' ? 'Mới học' : learnerProfile?.level === 'reviewing' ? 'Đang ôn' : 'Đã học',
            onOpenLevel: () => setIsLobbyOpen(true),
            onOpenPeerNotebook: () => setIsPeerNotebookOpen(true),
            isDemoRunning: showcase.status !== 'idle',
            onToggleDemo: () => (showcase.status === 'idle' ? showcase.start() : showcase.stop()),
            onOpenTimelineEditor: () => {
              sound.playTabSwitch();
              setActiveStudioView('editor');
            },
            onOpenWarRoom: () => {
              sound.playTabSwitch();
              setActiveStudioView('warroom');
            },
            isInspectorOpen: isInspectorDrawerOpen,
            onToggleInspector: () => {
              sound.playBubblePop();
              setIsInspectorDrawerOpen((prev) => !prev);
            },
            onOpenContextSnapshot: () => {
              sound.playBubblePop();
              setIsAiInspectorOpen(true);
            },
          }}
        />

        {/* VIEW 1: WAR ROOM VIEW */}
        {activeStudioView === 'warroom' && (
          <main className="flex-1 w-full px-3 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col space-y-4">
            <WarRoomPanel
              source={activeReasoningSource}
              autoPlayReplay={showcase.status === 'running'}
              isLiveStream={useLiveSSE}
              onToggleStreamMode={() => {
                sound.playPencilTap();
                setUseLiveSSE((prev) => !prev);
              }}
              defaultCollapsed={false}
              onTransferDraftToTimeline={(draftLesson) => {
                sound.playTabSwitch();
                if (draftLesson) {
                  setCurrentLessonSchema(draftLesson);
                  lessonStore.setDraft(draftLesson);
                } else {
                  lessonStore.setDraft(currentLessonSchema);
                }
                setActiveStudioView('editor');
              }}
            />
          </main>
        )}

        {/* VIEW 2: TIMELINE EDITOR VIEW */}
        {activeStudioView === 'editor' && (
          <main className="flex-1 w-full px-3 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col space-y-6">
            <TimelineEditor
              initialLesson={currentLessonSchema}
              onSeekVideo={(s) => {
                sound.playPencilTap();
                setActiveStudioView('classroom');
                setCurrentMode('video_clash');
                handleSeekVideo(s);
              }}
              onApproveSuccess={(approved) => {
                sound.playSuccessChime();
                setCurrentLessonSchema(approved);
                // Dong bo ngay lap tuc sang Classroom Video Player (P1 Fix)
                const updatedVideoLesson = adaptLessonToPlayer(approved);
                setCurrentVideoLesson((prev) => ({
                  ...prev,
                  title: approved.title || prev.title,
                  duration: (approved as any).video_duration_s || updatedVideoLesson.duration || prev.duration,
                  checkpointTimestamp: updatedVideoLesson.checkpointTimestamp ?? prev.checkpointTimestamp,
                  checkpointQuestion: updatedVideoLesson.checkpointQuestion || prev.checkpointQuestion,
                  boArgument: updatedVideoLesson.boArgument || prev.boArgument,
                  rebuttalStickers: updatedVideoLesson.rebuttalStickers || prev.rebuttalStickers,
                  teacherClosure: updatedVideoLesson.teacherClosure || prev.teacherClosure,
                }));
              }}
            />
          </main>
        )}

        {/* CLASSROOM: journey rail + the current station */}
        {activeStudioView === 'classroom' && (
          <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:gap-6 lg:py-5 2xl:px-8">
            <aside className="rounded-2xl border border-[#E2EAD2] bg-white px-2 py-3 lg:sticky lg:top-[84px] lg:w-[200px] lg:shrink-0 lg:self-start lg:border-0 lg:border-r lg:bg-transparent lg:rounded-none lg:px-0 lg:py-4 lg:pr-4">
              <JourneyRail stops={journeyStops} actions={railActions} />
            </aside>

            <main className="flex min-w-0 flex-1 flex-col">
              {/* TRẠM 1: VIDEO, VIỆC CỦA BẠN, LỚP HỌC */}
              {currentMode === 'video_clash' && (
                <div
                  className={`grid w-full grid-cols-1 gap-4 lg:gap-5 ${collapseVideo ? '' : 'lg:grid-cols-[minmax(0,1fr)_var(--chat-w)]'}`}
                  style={{ '--chat-w': `${chatWidth}px` } as React.CSSProperties}
                >
                  <div ref={stationTopRef} className="flex min-w-0 scroll-mt-[84px] flex-col gap-3 lg:col-start-1 lg:row-start-1">
                    {collapseVideo && (
                      <VideoStrip
                        title={lessonIdent.title}
                        currentTime={videoCurrentTime}
                        duration={currentVideoLesson.durationSeconds || currentVideoLesson.duration}
                        onShowVideo={() => setShowVideoInFaceOff(true)}
                      />
                    )}
                    {/* Kept mounted while collapsed so the embedded player keeps its state. */}
                    <div className={collapseVideo ? 'h-0 overflow-hidden' : ''} inert={collapseVideo} aria-hidden={collapseVideo || undefined}>
                    <VideoPlayerSheet
                      lesson={currentVideoLesson}
                      phase={videoPhase}
                      currentTime={videoCurrentTime}
                      isPlaying={isVideoPlaying}
                      isLoadingAi={isLoadingAi}
                      liveBoDialogue={liveBoDialogue}
                      liveCoLamDialogue={liveCoLamDialogue}
                      isQuizCollapsedToChat={isQuizCollapsedToChat}
                      isQuizSkipped={isQuizSkipped}
                      onToggleCollapseQuiz={(collapsed) => setIsQuizCollapsedToChat(collapsed)}
                      onSendContextualQuestion={(qText) =>
                        setExternalQuestionTrigger({ id: Date.now(), text: qText })
                      }
                      onTogglePlay={handleToggleVideoPlay}
                      onSeek={handleSeekVideo}
                      onTriggerFreeze={handleTriggerFreeze}
                      onJumpToCheckpoint={() => {
                        setIsQuizCollapsedToChat(false);
                        setIsQuizSkipped(false);
                        handleJumpToCheckpoint();
                      }}
                      onSwitchVideoLesson={handleSwitchVideoLesson}
                      onAnswerCheckpoint={handleAnswerCheckpoint}
                      onSubmitRebuttal={handleSubmitRebuttal}
                      onResumeVideo={handleResumeVideoAfterClosure}
                      onSkipCheckpoint={handleSkipCheckpoint}
                      isOverlayDrawerOpen={isChaptersDrawerOpen}
                      onToggleOverlayDrawer={() => setIsChaptersDrawerOpen(prev => !prev)}
                      isAttachModalOpen={isAttachModalOpen}
                      onToggleAttachModal={setIsAttachModalOpen}
                      isRaiseHandModalOpen={isRaiseHandModalOpen}
                      onToggleRaiseHandModal={(open) => {
                        const next = typeof open === 'boolean' ? open : !isRaiseHandModalOpen;
                        setIsRaiseHandModalOpen(next);
                        if (next) {
                          setIsVideoPlaying(false);
                          setVideoPhase('STUDENT_FREEZE');
                        } else if (videoPhase === 'STUDENT_FREEZE') {
                          setVideoPhase('WATCHING');
                        }
                      }}
                      onTriggerRaiseHand={handleTriggerRaiseHand}
                      hideInternalBottomBar={true}
                      checkpointUiExternal={true}
                      playRequest={playRequest}
                    />
                    </div>

                    {reactionToast && (
                      <p role="status" className="rounded-xl border border-[#B7DB6A] bg-[#F4FAE6] p-2 text-center text-[13px] font-semibold text-[#1F4D12]">
                        {reactionToast}
                      </p>
                    )}
                  </div>

                  <div ref={taskCardRef} className={`flex min-w-0 scroll-mt-[84px] flex-col gap-3 lg:col-start-1 lg:row-start-2 ${isFaceOffBeat && !collapseVideo ? 'lg:col-span-2' : ''}`}>
                    <Station1TaskCard
                      beat={taskBeat}
                      lesson={currentVideoLesson}
                      checkpointTimestamp={checkpointSecond}
                      isLoadingAi={isLoadingAi}
                      liveBoDialogue={liveBoDialogue}
                      liveCoLamDialogue={liveCoLamDialogue}
                      liveHintDialogue={liveHintDialogue}
                      onJumpToCheckpoint={() => {
                        setIsQuizCollapsedToChat(false);
                        handleJumpToCheckpoint();
                      }}
                      onReplayBeforeCheckpoint={() => {
                        if (checkpointSecond === null) return;
                        const from = Math.max(0, checkpointSecond - 30);
                        setVideoCurrentTime(from);
                        setPlayRequest({ id: Date.now(), fromSecond: from });
                      }}
                      onAnswer={(label, id) => handleAnswerCheckpoint(label, id)}
                      onSkip={handleSkipCheckpoint}
                      submittedRebuttal={lastRebuttalText}
                      onRebut={(text, isEffective) => {
                        setLastRebuttalText(text);
                        handleSubmitRebuttal(text, isEffective);
                      }}
                      onResumeLecture={() => {
                        handleResumeVideoAfterClosure();
                        if (checkpointSecond !== null) setPlayRequest({ id: Date.now(), fromSecond: checkpointSecond + 5 });
                      }}
                      onNextStation={() => {
                        // Moving on closes the pause question; coming back shows "what's next".
                        if (videoPhase === 'BO_CONCEDED' || videoPhase === 'CO_LAM_CLOSURE') setVideoPhase('WATCHING');
                        handleSelectStation('worksheet');
                      }}
                    />

                    <VideoActionBar
                      chapterTitle={currentChapterTitle}
                      onToggleChapters={() => setIsChaptersDrawerOpen(prev => !prev)}
                      onOpenAttach={() => setIsAttachModalOpen(true)}
                      onReaction={handleQuickReaction}
                      onJumpToCheckpoint={checkpointSecond !== null ? () => {
                        setIsQuizCollapsedToChat(false);
                        handleJumpToCheckpoint();
                      } : undefined}
                      checkpointLabel={checkpointSecond !== null ? formatClock(checkpointSecond) : undefined}
                      onRaiseHand={handleTriggerRaiseHand}
                      isRaiseHandOpen={isRaiseHandModalOpen}
                    />
                  </div>

                  {/* LỚP HỌC: chat column; the splitter sits on its left edge */}
                  <div
                    className={`relative h-[72vh] min-h-[460px] lg:col-start-2 lg:row-start-1 lg:h-auto ${collapseVideo ? 'lg:hidden' : isFaceOffBeat ? '' : 'lg:row-span-2'}`}
                  >
                    <ResizableSplitter
                      id="splitter-video-chat"
                      label="Kéo đổi kích thước giữa Video và Thảo luận lớp"
                      valueNow={chatWidth}
                      valueMin={300}
                      valueMax={640}
                      onDelta={handleChatSplitterDelta}
                      onReset={handleResetChatWidth}
                      onStep={(step) => handleChatSplitterDelta(-step)}
                      className="absolute -left-4 top-0 h-full"
                    />
                    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#E2EAD2] bg-white lg:absolute lg:inset-0">
                      <VideoDebateSheet
                        lesson={currentVideoLesson}
                        phase={videoPhase}
                        currentTime={videoCurrentTime}
                        isChatExpanded={isChatExpanded}
                        isBackendLive={isBackendLive}
                        isLoadingAi={isLoadingAi}
                        liveBoDialogue={liveBoDialogue}
                        liveCoLamDialogue={liveCoLamDialogue}
                        liveHintDialogue={liveHintDialogue}
                        isQuizCollapsedToChat={isQuizCollapsedToChat}
                        isQuizSkipped={isQuizSkipped}
                        onSetQuizSkipped={setIsQuizSkipped}
                        savedSelectedOptionId={savedSelectedOptionId}
                        onSetSavedSelectedOptionId={setSavedSelectedOptionId}
                        onExpandQuizBackToVideo={() => {
                          sound.playBubblePop();
                          setIsQuizCollapsedToChat(false);
                          setIsQuizSkipped(false);
                          setIsVideoPlaying(false);
                          setVideoPhase('CHECKPOINT_REACHED');
                          setVideoCurrentTime(currentVideoLesson.checkpointTimestamp);
                        }}
                        externalQuestionTrigger={externalQuestionTrigger}
                        chatFocusRequest={chatFocusRequest}
                        onSeekVideo={(sec) => handleSeekVideo(sec, true)}
                        onAnswerCheckpoint={handleAnswerCheckpoint}
                        onSkipCheckpoint={handleSkipCheckpoint}
                        onSubmitRebuttal={handleSubmitRebuttal}
                        onResumeVideo={handleResumeVideoAfterClosure}
                        onDismissFreeze={() => {
                          setVideoPhase('WATCHING');
                          setIsVideoPlaying(true);
                        }}
                        learnerName={learnerProfile?.name}
                        showAllTimeline={showAllTimeline}
                        onSwitchToStation2={() => {
                          setIsVideoPlaying(false);
                          setCurrentMode('worksheet');
                        }}
                        onChatMessageProcessed={handleChatMessageProcessed}
                        onOpenEvidence={handleOpenEvidence}
                        questionInTaskCard
                        onFocusTaskCard={() => taskCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TRẠM 2: SỔ TAY BẮT LỖI */}
              {currentMode === 'worksheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
                  <WorkingObjectSheet
                    lesson={currentLesson}
                    currentState={currentState}
                    selectedStep={selectedStep}
                    onSelectStep={handleSelectStep}
                    boSpeechOverride={boSpeechOverride}
                  />
                  <InteractionCardSheet
                    lesson={currentLesson}
                    currentState={currentState}
                    selectedStep={selectedStep}
                    onSelectStep={handleSelectStep}
                    explanationText={explanationText}
                    rebuttalText={worksheetRebuttalText}
                    onExplanationChange={handleExplanationChange}
                    onRebuttalChange={setWorksheetRebuttalText}
                    onSubmitExplanation={handleSubmitExplanation}
                    onSubmitRebuttal={handleSubmitWorksheetRebuttal}
                    onRequestHint={handleRequestHint}
                    onNextLesson={handleNextLesson}
                    onRetryLesson={handleRetryLesson}
                    onSwitchToStation3={() => setCurrentMode('predict_poe')}
                    onAcceptNudgeHint={() => {
                      setExplanationText(prev => prev || currentLesson.nudgeStarter || '');
                      setCurrentState('EXPLAIN_PROMPT');
                    }}
                    onDismissNudge={handleDismissNudge}
                    tutorFeedbackOverride={tutorFeedbackOverride}
                    probeQuestionOverride={probeQuestionOverride}
                    boSpeechOverride={boSpeechOverride}
                    isLoadingAi={isLoadingAi}
                    hintLevel={worksheetHintLevel}
                  />
                </div>
              )}

              {/* TRẠM 3 & TRẠM 4: POE & GIA SƯ NHÍ */}
              {(currentMode === 'predict_poe' || currentMode === 'protege_teaching') && (
                <div className="w-full flex-1 flex flex-col min-h-0">
                  <AlternativeFlowsSheet
                    mode={currentMode}
                    onSwitchMode={(mode) => setCurrentMode(mode)}
                    onPoeTopicChange={(topic) => setCurrentPoeTopic(topic)}
                    onPoeCompletedChange={(completed) => setIsPoeCompleted(completed)}
                  />
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Global Modals & Drawers */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStart={() => setIsOnboardingOpen(false)}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
      />

      <LearningFlowGuideModal
        isOpen={isFlowGuideOpen}
        onClose={() => setIsFlowGuideOpen(false)}
        onSelectMode={(mode) => setCurrentMode(mode)}
      />

      <PauseModal
        isOpen={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        onResetOrChange={() => {
          setIsPauseOpen(false);
          setIsLessonDrawerOpen(true);
        }}
        topicTitle={currentLesson.topic}
        savedTimestamp={lastSavedTimestamp}
        onClearSavedProgress={() => {
          localStorage.removeItem(DRE_STORAGE_KEY);
          handleRetryLesson();
          setIsPauseOpen(false);
        }}
      />

      <LessonSelectorDrawer
        isOpen={isLessonDrawerOpen}
        onClose={() => setIsLessonDrawerOpen(false)}
        currentLessonId={currentLesson.id}
        onSelectLesson={handleSwitchLesson}
      />

      {/* Teacher tool: turn inspector, a floating panel over any view (Alt+I or ⋯ menu) */}
      {isInspectorDrawerOpen && (
        <div className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-md shadow-2xl">
          <InspectorDrawer
            isOpen={isInspectorDrawerOpen}
            onClose={() => setIsInspectorDrawerOpen(false)}
            turns={inspectorTurns}
            activeTurnIndex={activeTurnIndex}
            isReplay={!useLiveSSE}
          />
        </div>
      )}

      <AgentMapDialog
        isOpen={isAgentMapOpen}
        onClose={() => setIsAgentMapOpen(false)}
        turns={agentMapTurns}
        focusTurnId={agentMapFocusId}
        onSeekVideo={(sec) => {
          if (currentMode !== 'video_clash') setCurrentMode('video_clash');
          handleSeekVideo(sec, true);
        }}
      />

      <MaicPeerClassroomDock
        currentMode={currentMode}
        currentState={currentState}
        lessonTopic={currentLesson.topic}
        errorStepIndex={currentLesson.errorStepIndex}
        peerContext={currentVideoLesson.peerContext}
        hideTrigger
        isOpen={isPeerNotebookOpen}
        onOpenChange={setIsPeerNotebookOpen}
      />
      {/* 1-CLICK AUTOMATED SHOWCASE CONTROLLER HUD (ISSUE #17) */}
      <ShowcaseHUD
        status={showcase.status}
        currentStep={showcase.currentStep}
        currentStation={showcase.currentStation}
        progressPercent={showcase.progressPercent}
        remainingSeconds={showcase.remainingSeconds}
        onTogglePause={showcase.togglePause}
        onNextStation={showcase.nextStation}
        onStop={showcase.stop}
      />

      {/* Multi-Agent Context Isolation Inspector Modal (#402) */}
      <MultiAgentInspectorModal
        isOpen={isAiInspectorOpen}
        onClose={() => setIsAiInspectorOpen(false)}
        isBackendLive={isBackendLive}
        lastSessionId={backendSessionId}
        lastBoSpeech={liveBoDialogue}
        lastCoLamSpeech={Array.isArray(liveCoLamDialogue) ? liveCoLamDialogue.join(' ') : liveCoLamDialogue}
        currentMode={currentMode}
        currentVideoSecond={videoCurrentTime}
        onSeekVideo={handleSeekVideo}
      />
    </>
  );
}
