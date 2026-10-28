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
import { DRELessonSchema } from './types/lesson';
import { ReplaySource } from './services/reasoningSource';
import { WarRoomPanel } from './components/warroom/WarRoomPanel';
import { TimelineEditor } from './components/timeline/TimelineEditor';
import {
  InspectorDrawer,
} from './components/inspector/InspectorDrawer';
import { ChevronDown, SlidersHorizontal, Activity, Clock, ArrowLeft, MoreHorizontal, Eye } from 'lucide-react';
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
import { ScrapbookHeader } from './components/ScrapbookHeader';
import { WorkingObjectSheet } from './components/WorkingObjectSheet';
import { InteractionCardSheet } from './components/InteractionCardSheet';
import { VideoPlayerSheet } from './components/VideoPlayerSheet';
import { VideoDebateSheet } from './components/VideoDebateSheet';
import { AlternativeFlowsSheet } from './components/AlternativeFlowsSheet';
import { PauseModal } from './components/PauseModal';
import { LessonSelectorDrawer } from './components/LessonSelectorDrawer';
import { ScenarioPlayerBar } from './components/ScenarioPlayerBar';
import { LearningFlowGuideModal } from './components/LearningFlowGuideModal';
import { MaicPeerClassroomDock } from './components/MaicPeerClassroomDock';
import { PreClassLobbyModal } from './components/PreClassLobbyModal';
import { OnboardingModal } from './components/OnboardingModal';
import dreLogoImg from './assets/dre-logo.png';
import { sound } from './utils/soundEffects';
import { 
  WashiTape, 
  SparkleIcon, 
  OpenBookIcon, 
  SwordsDebateIcon, 
  ChalkboardIcon,
  WoodenPencil,
  PencilIcon,
  VideoPlayIcon,
  CompassIcon,
  TeacherHatIcon,
  CheckCircleIcon
} from './components/HandmadeArtwork';
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
  submitBackendRebuttal 
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
  const [videoPhase, setVideoPhase] = useState<VideoCheckpointPhase>('WATCHING');
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('time');
      if (t) return parseInt(t, 10);
    }
    return 0;
  });
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [currentPoeTopic, setCurrentPoeTopic] = useState<string>('Toán 12 · Biến thể Vectơ trong không gian (Thầy Nguyễn Phan Tiến)');
  const [isQuizCollapsedToChat, setIsQuizCollapsedToChat] = useState<boolean>(false);
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
  const [isInternalMenuOpen, setIsInternalMenuOpen] = useState(false);
  const [currentLessonSchema, setCurrentLessonSchema] = useState<DRELessonSchema>(
    DEMO_LESSON_SCHEMA
  );
  const replaySource = useMemo(() => {
    return new ReplaySource(DEMO_REASONING_EVENTS as any, 1.0);
  }, []);
  const [isInspectorDrawerOpen, setIsInspectorDrawerOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('inspector') === '1';
    }
    return false;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      // Toggle QA test case bar on Ctrl+Shift+D, Ctrl+Shift+K, Ctrl+Alt+T, or F2
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) ||
        (e.ctrlKey && e.altKey && (e.key === 'T' || e.key === 't')) ||
        e.key === 'F2'
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
        // Khi mới vào app hoặc tải lại trang: Luôn bắt đầu video ở mốc 0:00 chuẩn sư phạm (TC_01A)
        // để người học trải nghiệm bài giảng từ đầu, không bị nảy tin nhắn chat trước khi bấm phát video
        setVideoCurrentTime(0);
        setVideoPhase('WATCHING');
        setIsVideoPlaying(false);
        setIsQuizCollapsedToChat(false);
        setIsQuizSkipped(false);
        setSavedSelectedOptionId(null);
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
          if (next >= currentVideoLesson.checkpointTimestamp && videoPhase === 'WATCHING') {
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
          if (res?.sessionId) setBackendSessionId(res.sessionId);
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

  const handleSeekVideo = (time: number) => {
    setVideoCurrentTime(time);
  };

  const handleJumpToCheckpoint = () => {
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
          const sessRes = await startBackendSession(miscId);
          if (sessRes) {
            currentSess = sessRes.sessionId;
            setBackendSessionId(currentSess);
          }
        }

        if (currentSess) {
          const ansRes = await submitBackendAnswer(currentSess, optionLabel);
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

    // Fallback to local
    setLiveBoDialogue(null);
    setVideoPhase('BO_DEBATE');
  };

  const handleSubmitRebuttal = async (rebuttalText: string, isEffective: boolean) => {
    recordUserActivity();

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

    if (isBackendLive && backendSessionId) {
      setIsLoadingAi(true);
      try {
        const rebRes = await submitBackendRebuttal(backendSessionId, rebuttalText);
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

    // Fallback to local
    if (isEffective) {
      setLiveBoDialogue(null);
      setLiveCoLamDialogue(null);
      setVideoPhase('BO_CONCEDED');
    }
  };

  const handleResumeVideoAfterClosure = () => {
    setVideoPhase('WATCHING');
    setIsVideoPlaying(true);
  };

  const handleSwitchVideoLesson = (lesson: VideoLessonItem) => {
    setCurrentVideoLesson(lesson);
    setVideoCurrentTime(0);
    setVideoPhase('WATCHING');
    setIsVideoPlaying(false);
    setBackendSessionId(null);
    setLiveBoDialogue(null);
    setLiveCoLamDialogue(null);
    setLiveHintDialogue(null);
  };

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

  const LEARNING_STATIONS: {
    id: LearningMode;
    stationNumber: string;
    stageLabel: string;
    title: string;
    shortLabel: string;
  }[] = [
    {
      id: 'video_clash',
      stationNumber: '1 · Video',
      stageLabel: 'Khởi động',
      title: 'Trạm 1: Video tương tác & Bo cãi bướng',
      shortLabel: '1 · Video',
    },
    {
      id: 'worksheet',
      stationNumber: '2 · Sổ tay',
      stageLabel: 'Luyện tập',
      title: 'Trạm 2: Sổ tay bắt lỗi bài giải của Bo',
      shortLabel: '2 · Sổ tay',
    },
    {
      id: 'predict_poe',
      stationNumber: '3 · Đoán',
      stageLabel: 'Thử thách',
      title: 'Trạm 3: Thử thách dự đoán POE',
      shortLabel: '3 · Đoán',
    },
    {
      id: 'protege_teaching',
      stationNumber: '4 · Dạy kèm',
      stageLabel: 'Làm chủ',
      title: 'Trạm 4: Gia sư dạy kèm Bo & Sáng tạo đề',
      shortLabel: '4 · Dạy kèm',
    },
  ];

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
        {/* THANH HEADER 2 TẦNG CHUẨN LIME SOFT - CÙNG MAX-WIDTH 7XL VỚI NỘI DUNG */}
        <header className="w-full bg-white border-b border-[#E2EAD2] px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto w-full">
            {/* TẦNG 1: LOGO + CÔNG CỤ GIÁO VIÊN + CỤM TIỆN ÍCH */}
            <div className="w-full flex items-center justify-between gap-4 pb-2.5 border-b border-stone-100">
              {/* Cụm trái: Logo DRE */}
              <div className="flex items-center gap-3.5">
                <div 
                  className="flex items-center shrink-0 cursor-pointer"
                  onClick={() => {
                    sound.playBubblePop();
                    setActiveStudioView('classroom');
                    setCurrentMode('worksheet');
                  }}
                  title="DRE - Nền tảng học tập đối thoại đa tác nhân"
                >
                  <img
                    src={dreLogoImg}
                    alt="DRE Logo"
                    className="h-7 sm:h-8 w-auto object-contain hover:opacity-85 transition"
                  />
                </div>
              </div>

              {/* Cụm phải: Tiện ích có Tooltip rõ ràng (Ẩn nút học viên khi ở chế độ Giáo viên) */}
              <div className="flex items-center gap-2 shrink-0">
                {activeStudioView === 'editor' || activeStudioView === 'warroom' ? (
                  <>
                    {/* Nút Bật / Tắt Âm thanh */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = sound.toggle();
                        setIsSoundEnabled(next);
                      }}
                      className={`h-8 px-3 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs ${
                        isSoundEnabled
                          ? 'bg-[#F3F8E8] text-[#121712] border-[#C8F169]'
                          : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                      }`}
                      title={isSoundEnabled ? 'Âm thanh: Đang bật (Nhấn để tắt)' : 'Âm thanh: Đang tắt (Nhấn để bật)'}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSoundEnabled ? 'bg-[#16A34A] animate-pulse' : 'bg-stone-400'}`} />
                      <span className="hidden sm:inline">{isSoundEnabled ? 'Âm thanh' : 'Tắt tiếng'}</span>
                    </button>

                    {/* Nút Quay lại lớp học */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTabSwitch();
                        setActiveStudioView('classroom');
                      }}
                      className="h-8 px-4 bg-[#121712] hover:bg-black text-white font-bold text-xs rounded-full shadow-2xs flex items-center gap-2 transition cursor-pointer"
                      title="Quay lại giao diện lớp học học viên"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#C8F169]" />
                      <span>Quay lại lớp học</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Nút Bật / Tắt Âm thanh */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = sound.toggle();
                        setIsSoundEnabled(next);
                      }}
                      className={`h-8 px-3 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs ${
                        isSoundEnabled
                          ? 'bg-[#F3F8E8] text-[#121712] border-[#C8F169]'
                          : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                      }`}
                      title={isSoundEnabled ? 'Âm thanh: Đang bật (Nhấn để tắt)' : 'Âm thanh: Đang tắt (Nhấn để bật)'}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSoundEnabled ? 'bg-[#16A34A] animate-pulse' : 'bg-stone-400'}`} />
                      <span className="hidden sm:inline">{isSoundEnabled ? 'Âm thanh' : 'Tắt tiếng'}</span>
                    </button>

                    <MaicPeerClassroomDock
                      currentMode={currentMode}
                      currentState={currentState}
                      lessonTopic={currentLesson.topic}
                      errorStepIndex={currentLesson.errorStepIndex}
                      peerContext={currentVideoLesson.peerContext}
                    />

                    <button
                      type="button"
                      onClick={() => setIsLobbyOpen(true)}
                      className="h-8 px-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-semibold cursor-pointer text-xs rounded-full shadow-2xs flex items-center gap-1.5"
                      title="Khảo sát trình độ người học"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>
                        {learnerProfile?.level === 'new_learner'
                          ? 'Mới học'
                          : learnerProfile?.level === 'reviewing'
                          ? 'Đang ôn'
                          : 'Đã học'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLessonDrawerOpen(true)}
                      className="h-8 px-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-semibold cursor-pointer text-xs rounded-full shadow-2xs"
                      title="Đổi bài học khác"
                    >
                      Đổi bài
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPauseOpen(true)}
                      className="h-8 px-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-semibold cursor-pointer text-xs rounded-full shadow-2xs"
                      title="Tạm dừng phiên học"
                    >
                      Tạm dừng
                    </button>

                    {/* Nút Soi não tác nhân (Alt + I) cho người demo */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playBubblePop();
                        setIsInspectorDrawerOpen((prev) => !prev);
                      }}
                      className={`h-8 px-3.5 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-2xs shrink-0 whitespace-nowrap ${
                        isInspectorDrawerOpen
                          ? 'bg-[#121712] text-[#C8F169] border border-[#121712] ring-1 ring-[#C8F169]'
                          : 'bg-[#121712] hover:bg-black text-white border border-[#121712]'
                      }`}
                      title="Soi não tác nhân (Phím tắt: Alt + I)"
                    >
                      <Eye className="w-4 h-4 text-[#C8F169] shrink-0" />
                      <span className="text-white font-bold tracking-tight whitespace-nowrap inline-block">Soi não</span>
                      <span className="px-2 py-0.5 bg-[#263126] text-[#C8F169] text-xs font-sans font-bold rounded-full border border-[#3B4D3B] whitespace-nowrap inline-block">
                        Alt + I
                      </span>
                    </button>

                    {/* Menu 3 chấm góc dành cho Công cụ Giáo viên & Kỹ thuật nội bộ */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsInternalMenuOpen((prev) => !prev)}
                        className={`h-8 w-8 rounded-full border text-xs font-semibold flex items-center justify-center transition cursor-pointer shadow-2xs ${
                          isInternalMenuOpen
                            ? 'bg-[#121712] text-white border-[#121712]'
                            : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                        title="Công cụ giáo viên & kỹ thuật nội bộ"
                      >
                        <MoreHorizontal className="w-4 h-4 text-inherit" />
                      </button>

                      {isInternalMenuOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsInternalMenuOpen(false)} 
                          />
                          <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-[#E2EAD2] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3.5 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                              Công cụ giáo viên &amp; nội bộ
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playTabSwitch();
                                setActiveStudioView('editor');
                                setIsInternalMenuOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 transition hover:bg-stone-50 cursor-pointer text-stone-700 font-semibold"
                            >
                              <Clock className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                              <span>Timeline Editor (Giáo viên)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playTabSwitch();
                                setActiveStudioView('warroom');
                                setIsInternalMenuOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 transition hover:bg-stone-50 cursor-pointer text-stone-700 font-semibold"
                            >
                              <Activity className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                              <span>Phòng điều hành (War Room)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playBubblePop();
                                setIsInspectorDrawerOpen(true);
                                setIsInternalMenuOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition hover:bg-stone-50 cursor-pointer text-stone-700 font-semibold"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span>Thanh tra lượt thoại (Inspector)</span>
                              </div>
                              <kbd className="px-1.5 py-0.5 text-xs bg-stone-100 rounded text-stone-600 font-sans font-bold">Alt+I</kbd>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* TẦNG 2: STEPPER 4 TRẠM HOẶC GÓC NHÌN GIÁO VIÊN / NỘI BỘ */}
            {activeStudioView === 'editor' ? (
              <div className="pt-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#121712] text-white flex items-center gap-1.5 shadow-2xs border border-[#121712]">
                    <span className="w-2 h-2 rounded-full bg-[#C8F169] animate-pulse" />
                    <span>Góc nhìn giáo viên</span>
                  </span>
                  <span className="text-xs text-stone-700 font-medium hidden sm:inline">
                    Biên tập dòng thời gian bài giảng · Thiết lập câu hỏi dừng & kịch bản sư phạm
                  </span>
                </div>
                <div className="text-xs font-sans font-bold text-[#121712] bg-white px-3.5 py-1 rounded-full border border-stone-300 shadow-2xs">
                  Chế độ thiết kế giáo án
                </div>
              </div>
            ) : activeStudioView === 'warroom' ? (
              <div className="pt-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#121712] text-white flex items-center gap-1.5 shadow-2xs border border-[#121712]">
                    <span className="w-2 h-2 rounded-full bg-[#C8F169] animate-pulse" />
                    <span>Góc nhìn nội bộ</span>
                  </span>
                  <span className="text-xs text-stone-700 font-medium hidden sm:inline">
                    Theo dõi quy trình 4 pha suy luận · Phản biện chéo giữa Trí, Bo và An
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                  {LEARNING_STATIONS.map((station) => {
                    const isActive = activeStudioView === 'classroom' && currentMode === station.id;
                    const isCompleted =
                      (station.id === 'video_clash' && (videoPhase === 'BO_CONCEDED' || isPoeCompleted)) ||
                      (station.id === 'worksheet' && currentState === 'CLOSE') ||
                      (station.id === 'predict_poe' && isPoeCompleted);
                    return (
                      <button
                        key={station.id}
                        type="button"
                        onClick={() => {
                          sound.playTabSwitch();
                          setActiveStudioView('classroom');
                          if (station.id !== 'video_clash') {
                            setIsVideoPlaying(false);
                          }
                          setCurrentMode(station.id);
                        }}
                        className={`h-9 px-4 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-[#121712] text-white shadow-xs ring-2 ring-[#C8F169]'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                        title={station.title}
                      >
                        {isCompleted && (
                          <CheckCircleIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#C8F169]' : 'text-emerald-600'}`} />
                        )}
                        <span>{station.stationNumber}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs text-stone-600 font-medium hidden md:block">
                  {currentMode === 'worksheet'
                    ? 'Trạm 2: Chẩn đoán & Bắt lỗi bài giải Bo'
                    : currentMode === 'video_clash'
                    ? 'Trạm 1: Xem video & Phản biện bẫy trực giác'
                    : currentMode === 'predict_poe'
                    ? 'Trạm 3: Dự đoán & Đối chiếu thực nghiệm 3D'
                    : 'Trạm 4: Gia sư nhí dạy kèm Bo'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* VIEW 1: WAR ROOM VIEW */}
        {activeStudioView === 'warroom' && (
          <main className="flex-1 w-full px-3 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col space-y-4">
            <WarRoomPanel source={replaySource} defaultCollapsed={false} />
          </main>
        )}

        {/* VIEW 2: TIMELINE EDITOR VIEW */}
        {activeStudioView === 'editor' && (
          <main className="flex-1 w-full px-3 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col space-y-6">
            <TimelineEditor
              initialLesson={currentLessonSchema}
              onApproveSuccess={(approved) => {
                sound.playSuccessChime();
                setCurrentLessonSchema(approved);
              }}
            />
          </main>
        )}

        {/* VIEW 3: CLASSROOM 4 STATIONS (TRẠM 1 ĐẾN 4) */}
        {activeStudioView === 'classroom' && (
          <main className={`flex-1 w-full ${isInspectorDrawerOpen ? 'max-w-[1920px]' : 'max-w-7xl'} mx-auto px-2 sm:px-3.5 2xl:px-6 py-3.5 sm:py-4 flex flex-col overflow-x-hidden transition-all duration-300`}>
            {/* TRẠM 1: VIDEO BÀI GIẢNG & THẢO LUẬN LỚP HỌC (3 CỘT CÂN ĐỐI, VỪA KHÍT 1280 & 1366 KHÔNG TRÀN NGANG) */}
            {currentMode === 'video_clash' && (
              <div className="flex flex-col lg:flex-row gap-2.5 2xl:gap-4 items-start flex-1 min-h-0 w-full">
                {/* CỘT TRÁI: VIDEO PLAYER & THANH ĐIỀU KHIỂN (luôn >= 480px) */}
                <div className="flex-1 min-w-[440px] sm:min-w-[480px] 2xl:min-w-[560px] flex flex-col space-y-3.5 transition-all duration-300">
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
                  />

                  {reactionToast && (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold text-xs text-center shadow-sm animate-in fade-in duration-150">
                      {reactionToast}
                    </div>
                  )}

                  {/* THANH ĐIỀU KHIỂN DƯỚI VIDEO (CHUẨN 100% THEO CODE CŨ & ẢNH 2) */}
                  <div className="bg-white border border-stone-200/90 rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs text-xs">
                    {/* Cụm trái: Menu Phân cảnh & Đổi link */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsChaptersDrawerOpen(prev => !prev)}
                        className="h-8 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-semibold border border-stone-200 flex items-center gap-1.5 max-w-[130px] sm:max-w-[170px] truncate cursor-pointer transition-all shadow-2xs shrink-0"
                        title="Xem Phân cảnh & Bản chép lời bài giảng"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-stone-500 shrink-0">
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M6 6h10M6 10h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span className="truncate">
                          {(() => {
                            const currentChapter = [...(currentVideoLesson.chapters || [])]
                              .reverse()
                              .find((ch) => videoCurrentTime >= ch.startSecond) || currentVideoLesson.chapters?.[0];
                            return currentChapter ? cleanText(currentChapter.title) : '1. Định nghĩa & Giá của vectơ';
                          })()}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAttachModalOpen(true)}
                        className="h-8 px-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-semibold border border-stone-200 flex items-center gap-1 cursor-pointer transition-all shadow-2xs shrink-0"
                        title="Đổi URL YouTube bài giảng khác"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-amber-500 shrink-0">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Đổi link</span>
                      </button>
                    </div>

                    {/* Cụm phải: Combo phản xạ [Đã hiểu | Chưa rõ] + Câu hỏi dừng 37:13 + Giơ tay */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* COMBO PILL: [👍 Đã hiểu | ❓ Chưa rõ] */}
                      <div className="h-8 px-1 rounded-xl bg-white border border-stone-200 flex items-center shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickReaction('understood')}
                          className="px-2 py-1 text-stone-700 hover:text-emerald-700 hover:bg-stone-50 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors text-xs shrink-0"
                          title="Bấm nếu bạn đã hiểu đoạn này"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-amber-500 shrink-0">
                            <path d="M7 10v12M7 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h3v8Zm0 0l4-8 2 1v6h7.5a2 2 0 0 1 2 2.5l-2 8a2 2 0 0 1-2 1.5H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>Đã hiểu</span>
                        </button>
                        <span className="w-px h-3.5 bg-stone-200 shrink-0" />
                        <button
                          type="button"
                          onClick={() => handleQuickReaction('confused')}
                          className="px-2 py-1 text-stone-700 hover:text-rose-700 hover:bg-stone-50 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors text-xs shrink-0"
                          title="Bấm nếu bạn chưa rõ đoạn này"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-rose-500 shrink-0">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <circle cx="12" cy="17" r="0.8" fill="currentColor" />
                          </svg>
                          <span>Chưa rõ</span>
                        </button>
                      </div>

                      {/* Nút Câu hỏi dừng */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuizCollapsedToChat(false);
                          handleJumpToCheckpoint();
                        }}
                        className="h-8 px-3.5 rounded-xl bg-[#121712] hover:bg-stone-800 text-white font-bold flex items-center cursor-pointer shadow-xs transition-all shrink-0 text-xs"
                        title="Nhảy tới mốc câu hỏi dừng"
                      >
                        <span>Câu hỏi dừng</span>
                      </button>

                      {/* Nút Giơ tay */}
                      <button
                        type="button"
                        onClick={handleTriggerRaiseHand}
                        className={`h-8 px-2.5 sm:px-3 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer border transition-colors shrink-0 shadow-2xs ${
                          isRaiseHandModalOpen
                            ? 'bg-[#121712] text-white border-[#121712]'
                            : 'bg-white hover:bg-stone-50 text-[#121712] border-stone-200'
                        }`}
                        title="Giơ tay hỏi thầy và bạn"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className={`w-3.5 h-3.5 shrink-0 ${isRaiseHandModalOpen ? 'text-[#C8F169]' : 'text-stone-700'}`}>
                          <path d="M12 4V13M8 6V13M16 8V13M4 11V14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14V10C20 8.89543 19.1046 8 18 8C16.8954 8 16 8.89543 16 10M4 11C4 9.89543 4.89543 9 6 9C7.10457 9 8 9.89543 8 11M8 6C8 4.89543 8.89543 4 10 4C11.1046 4 12 4.89543 12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span>Giơ tay</span>
                      </button>
                    </div>
                  </div>

                  {/* TIẾN TRÌNH BÀI GIẢNG & GHI CHÚ SƯ PHẠM (LẤP ĐẦY NỬA DƯỚI CỘT TRÁI) */}
                  <div className="bg-white border border-[#E2EAD2] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2EAD2] pb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#121712] shrink-0" />
                        <span className="font-bold text-sm text-[#121712] truncate">
                          Tiến trình bài giảng &amp; Điểm dừng tương tác
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-stone-600 bg-[#F3F8E8] px-2.5 py-0.5 rounded-full border border-[#E2EAD2] shrink-0 ml-auto">
                        Thầy Nguyễn Phan Tiến · 1h 38m
                      </span>
                    </div>

                    {/* Dải tiến độ 4 mốc thời gian (2 cột trên màn nhỏ/1366, 4 cột trên 1920) */}
                    <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2 sm:gap-2.5">
                      {[
                        { time: '00:00', title: 'Khởi động', desc: 'Định nghĩa & Giá vectơ', active: videoCurrentTime < 1260 },
                        { time: '21:00', title: 'Quy tắc hình', desc: 'Ba điểm & Bình hành', active: videoCurrentTime >= 1260 && videoCurrentTime < 2233 },
                        { time: '37:13', title: 'Câu hỏi dừng', desc: 'Bẫy độ dài |a+b|', active: videoCurrentTime >= 2233 && videoCurrentTime < 3990, isCheckpoint: true },
                        { time: '1:06:30', title: 'Quy tắc thế', desc: 'Nhân vectơ với một số', active: videoCurrentTime >= 3990 }
                      ].map((marker, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            sound.playPencilTap();
                            if (marker.isCheckpoint) {
                              setIsQuizCollapsedToChat(false);
                              handleJumpToCheckpoint();
                            } else if (marker.time === '00:00') {
                              handleSeekVideo(0);
                            } else if (marker.time === '21:00') {
                              handleSeekVideo(1260);
                            } else {
                              handleSeekVideo(3990);
                            }
                          }}
                          className={`p-3 rounded-2xl border text-left cursor-pointer transition-all space-y-1 ${
                            marker.active
                              ? 'bg-[#121712] text-white border-[#121712] shadow-xs ring-1 ring-[#121712]'
                              : 'bg-[#F3F8E8] hover:bg-[#E2EAD2] border-[#E2EAD2] text-[#121712]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 flex-nowrap">
                            <span className={`font-sans font-bold text-xs tabular-nums shrink-0 ${marker.active ? 'text-[#C8F169]' : 'text-[#121712]'}`}>
                              {marker.time}
                            </span>
                            {marker.isCheckpoint && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 whitespace-nowrap ${
                                marker.active ? 'bg-[#C8F169] text-[#121712]' : 'bg-[#121712] text-[#C8F169]'
                              }`}>
                                Điểm dừng
                              </span>
                            )}
                          </div>
                          <div className={`font-bold text-xs ${marker.active ? 'text-white' : 'text-[#121712]'}`}>
                            {marker.title}
                          </div>
                          <p className={`text-xs leading-snug ${marker.active ? 'text-stone-300' : 'text-stone-600'}`}>
                            {marker.desc}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Thẻ ghi chú sư phạm Cô Lam */}
                    <div className="p-3.5 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] text-xs text-[#121712] leading-relaxed space-y-1">
                      <span className="font-bold text-[#121712] block">
                        Ghi chú trọng tâm từ Cô Lam:
                      </span>
                      <p className="text-stone-700">
                        “Tại mốc 37:13, thầy Tiến đưa ra bài toán cộng hai vectơ không cùng gốc trong hình lập phương. Con hãy chú ý quan sát cách xác định hướng và điểm đặt của vectơ trước khi tính độ dài nhé!”
                      </p>
                    </div>
                  </div>
                </div>

                {/* CỘT GIỮA: THẢO LUẬN LỚP HỌC */}
                <div 
                  style={{ height: 'calc(100vh - 120px)', minHeight: '480px', maxHeight: 'calc(100vh - 110px)' }}
                  className={`${
                    isInspectorDrawerOpen ? 'w-full lg:w-[280px] xl:w-[300px] 2xl:w-[360px] shrink-0' : (isChatExpanded ? 'w-full lg:w-[48%] shrink-0' : 'w-full lg:w-[380px] xl:w-[420px] shrink-0')
                  } bg-white rounded-3xl border border-[#E2EAD2] overflow-visible flex flex-col shadow-xs transition-all duration-300 relative group/chatcol`}
                >
                  {/* Thanh mở rộng / thu hẹp chat ở mép trái (Interactive Expand Handle Bar) */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPencilTap();
                      setIsChatExpanded((prev) => !prev);
                    }}
                    className="hidden lg:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-16 bg-white hover:bg-[#F3F8E8] border border-[#E2EAD2] rounded-full shadow-md items-center justify-center text-[#121712] transition-all cursor-pointer hover:scale-105 group"
                    title={isChatExpanded ? 'Thu hẹp khung chat (về 33%)' : 'Thanh mở rộng khung chat (lên 50%)'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 transition-transform group-hover:scale-110">
                      {isChatExpanded ? (
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                  </button>

                  <div className="w-full h-full rounded-3xl overflow-hidden flex flex-col">
                    <VideoDebateSheet
                      lesson={currentVideoLesson}
                      phase={videoPhase}
                      currentTime={videoCurrentTime}
                      isChatExpanded={isChatExpanded}
                      onToggleChatExpanded={() => setIsChatExpanded((prev) => !prev)}
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
                    onSeekVideo={handleSeekVideo}
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
                  />
                </div>
              </div>

              {/* CỘT PHẢI: SOI NÃO TÁC NHÂN (INSPECTOR DRAWER) - CỘT RIÊNG BÊN PHẢI CẠNH CHAT, KHÔNG CHE VIDEO/CHAT */}
              {isInspectorDrawerOpen && (
                <div className="w-full lg:w-[370px] xl:w-[390px] 2xl:w-[450px] shrink-0 transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                  <InspectorDrawer
                    isOpen={isInspectorDrawerOpen}
                    onClose={() => setIsInspectorDrawerOpen(false)}
                    turns={DEMO_INSPECTOR_TURNS}
                    activeTurnIndex={3}
                  />
                </div>
              )}
            </div>
          )}

            {/* TRẠM 2: SỔ TAY BẮT LỖI (2 CỘT CÂN ĐỐI, TỐI ĐA 2 TẦNG CARD) */}
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

            {/* TRẠM 3 & TRẠM 4: POE & GIA SƯ NHÍ (KHÔNG KHUNG TRẮNG NGOÀI CÙNG) */}
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

      {/* Turn Inspector Drawer (#16) nếu mở ở các góc nhìn khác ngoài Trạm 1 */}
      {isInspectorDrawerOpen && (activeStudioView !== 'classroom' || currentMode !== 'video_clash') && (
        <div className="fixed top-20 right-4 z-50 w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-right-4">
          <InspectorDrawer
            isOpen={isInspectorDrawerOpen}
            onClose={() => setIsInspectorDrawerOpen(false)}
            turns={DEMO_INSPECTOR_TURNS}
            activeTurnIndex={3}
          />
        </div>
      )}
    </>
  );
}
