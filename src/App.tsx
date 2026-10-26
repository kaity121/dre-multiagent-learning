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

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [currentMode, setCurrentMode] = useState<LearningMode>('video_clash');
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
  const [selectedLevel, setSelectedLevel] = useState<LearnerLevel>(MISCONCEPTION_LIBRARY[0].level);
  const [currentLesson, setCurrentLesson] = useState<MisconceptionItem>(MISCONCEPTION_LIBRARY[0]);
  const [currentState, setCurrentState] = useState<DREState>('IDLE');
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [explanationText, setExplanationText] = useState<string>('');
  const [worksheetRebuttalText, setWorksheetRebuttalText] = useState<string>('');
  const [worksheetHintLevel, setWorksheetHintLevel] = useState<number>(0);

  // Video Mode States
  const [currentVideoLesson, setCurrentVideoLesson] = useState<VideoLessonItem>(VIDEO_LESSON_LIBRARY[0]);
  const [videoPhase, setVideoPhase] = useState<VideoCheckpointPhase>('WATCHING');
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [currentPoeTopic, setCurrentPoeTopic] = useState<string>('Toán 12 · Biến thể Vectơ trong không gian (Thầy Nguyễn Phan Tiến)');
  const [isQuizCollapsedToChat, setIsQuizCollapsedToChat] = useState<boolean>(false);
  const [isQuizSkipped, setIsQuizSkipped] = useState<boolean>(false);
  const [savedSelectedOptionId, setSavedSelectedOptionId] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);
  const [externalQuestionTrigger, setExternalQuestionTrigger] = useState<{ id: number; text: string } | null>(null);
  const [chatFocusRequest, setChatFocusRequest] = useState<{ id: number; prefix: string } | null>(null);
  const [showAllTimeline, setShowAllTimeline] = useState<boolean>(false);
  const [isPoeCompleted, setIsPoeCompleted] = useState<boolean>(false);

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
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
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
      if (searchParams.get('skip_lobby') === '1') return true;
      // Luôn hiển thị giao diện khảo sát / chọn học trước khi vào học theo yêu cầu
      return false;
    }
    return false;
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
        if (saved.currentMode) setCurrentMode(saved.currentMode);
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
    color: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
    inactiveBg: string;
    inactiveText: string;
    inactiveBorder: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'video_clash',
      stationNumber: 'Trạm 1: Video & Bo cãi',
      stageLabel: 'Khởi động',
      title: 'Video tương tác & Bo cãi bướng',
      color: '#4E9B87',
      activeBg: 'bg-[#1B4338]',
      activeText: 'text-white',
      activeBorder: 'border-[#1B4338]',
      inactiveBg: 'bg-white',
      inactiveText: 'text-stone-700',
      inactiveBorder: 'border-stone-200',
      icon: <VideoPlayIcon className="w-3.5 h-3.5" />,
    },
    {
      id: 'worksheet',
      stationNumber: 'Trạm 2: Sổ tay bắt lỗi',
      stageLabel: 'Luyện tập',
      title: 'Sổ tay bắt lỗi bài giải của Bo',
      color: '#1B4338',
      activeBg: 'bg-[#1B4338]',
      activeText: 'text-white',
      activeBorder: 'border-[#1B4338]',
      inactiveBg: 'bg-white',
      inactiveText: 'text-stone-700',
      inactiveBorder: 'border-stone-200',
      icon: <PencilIcon className="w-3.5 h-3.5" />,
    },
    {
      id: 'predict_poe',
      stationNumber: 'Trạm 3: Đoán kết quả (POE)',
      stageLabel: 'Thử thách',
      title: 'Thử thách dự đoán POE',
      color: '#1B4338',
      activeBg: 'bg-[#1B4338]',
      activeText: 'text-white',
      activeBorder: 'border-[#1B4338]',
      inactiveBg: 'bg-white',
      inactiveText: 'text-stone-700',
      inactiveBorder: 'border-stone-200',
      icon: <SparkleIcon className="w-3.5 h-3.5" />,
    },
    {
      id: 'protege_teaching',
      stationNumber: 'Trạm 4: Dạy kèm Bo',
      stageLabel: 'Làm chủ',
      title: 'Gia sư dạy kèm Bo & Sáng tạo đề',
      color: '#1B4338',
      activeBg: 'bg-[#1B4338]',
      activeText: 'text-white',
      activeBorder: 'border-[#1B4338]',
      inactiveBg: 'bg-white',
      inactiveText: 'text-stone-700',
      inactiveBorder: 'border-stone-200',
      icon: <TeacherHatIcon className="w-3.5 h-3.5" />,
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
            <span className="px-2 py-0.5 rounded bg-cyan-600/60 border border-cyan-400/40 font-mono text-[11px] font-bold shrink-0">
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
          KHÔNG GIAN HỌC TẬP EDTECH 4 TRẠM (ĐỒNG NHẤT 100% THEO INSPOS ẢNH 3)
          ==================================================================== */}
      <div className="min-h-screen bg-[#F4EFE6] text-stone-900 flex flex-col font-sans select-none">
        {/* THANH HEADER CHUẨN KHỚP 100% ẢNH THAM CHIẾU FIGMA */}
        <header className="w-full bg-[#F4EFE6] px-4 sm:px-6 pt-3 pb-2 sticky top-0 z-40">
          <div className="w-full flex items-center justify-between gap-3 text-xs">
            {/* CỤM TRÁI: Logo DRE góc trái trên cùng + Dải Station Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
              {/* Logo web DRE (Đã tách nền trong suốt) */}
              <div 
                className="flex items-center shrink-0 pr-3 border-r border-stone-300/80 cursor-pointer"
                onClick={() => {
                  sound.playBubblePop();
                  setCurrentMode('video_clash');
                }}
                title="DRE - Nền tảng học tập đối thoại đa tác nhân"
              >
                <img
                  src={dreLogoImg}
                  alt="DRE Logo"
                  className="h-7 sm:h-7.5 w-auto object-contain hover:opacity-80 hover:scale-102 transition-all"
                />
              </div>

              {LEARNING_STATIONS.map((station) => {
                const isActive = currentMode === station.id;
                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      sound.playPageFlip();
                      if (station.id !== 'video_clash') {
                        setIsVideoPlaying(false);
                      } else {
                        // Khi bấm vào tab Trạm 1: nếu video trước đó đã ở cuối bài, reset về 0 để người học xem lại
                        if (videoCurrentTime >= (currentVideoLesson.lectureEndSecond || 9503)) {
                          setVideoCurrentTime(0);
                          setVideoPhase('WATCHING');
                        }
                      }
                      setCurrentMode(station.id);
                    }}
                    className={`h-8 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs ${
                      isActive
                        ? 'bg-[#1B4338] text-white shadow-xs font-bold'
                        : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700'
                    }`}
                    title={station.title}
                  >
                    <span className="shrink-0">{station.icon}</span>
                    <span>{station.stationNumber}</span>
                  </button>
                );
              })}
            </div>

            {/* CỤM PHẢI: Sổ tay & Hỏi riêng 4 bạn + Đổi bài + Tạm dừng + Khảo sát chọn học/ôn */}
            <div className="flex items-center gap-2 shrink-0">
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
                className="h-8 px-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-semibold cursor-pointer text-xs rounded-xl shadow-2xs flex items-center gap-1.5"
                title="Khảo sát trình độ & Chọn chế độ học (Mới học / Đã học / Đang ôn luyện)"
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
                className="h-8 px-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-semibold cursor-pointer text-xs rounded-xl shadow-2xs"
              >
                Đổi bài
              </button>

              <button
                type="button"
                onClick={() => setIsPauseOpen(true)}
                className="h-8 px-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-semibold cursor-pointer text-xs rounded-xl shadow-2xs"
              >
                Tạm dừng
              </button>
            </div>
          </div>
        </header>

        {/* MAIN WORKSPACE: CARD CONTAINER BO TRÒN TRẮNG TRÊN NỀN CÁT ẤM ÁP */}
        <main className="flex-1 w-full px-3 sm:px-5 pt-1 pb-2 flex flex-col">
          <div className="w-full bg-white rounded-3xl border border-stone-200/90 p-3 sm:p-4 shadow-sm flex-1 flex flex-col min-h-0">
            {/* TRẠM 1: VIDEO BÀI GIẢNG & THẢO LUẬN LỚP HỌC (2 CỘT CÂN ĐỐI KHỚP ẢNH 3) */}
            {currentMode === 'video_clash' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
                {/* CỘT TRÁI: VIDEO PLAYER & THANH ĐIỀU KHIỂN (8/12 hoặc 6/12 khi mở rộng chat) */}
                <div className={`${isChatExpanded ? 'lg:col-span-6' : 'lg:col-span-8'} flex flex-col space-y-2.5 transition-all duration-300`}>
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
                  <div className="bg-white border border-stone-200/90 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-2xs text-xs overflow-x-auto no-scrollbar flex-nowrap whitespace-nowrap">
                    {/* Cụm trái: Menu Phân cảnh & Đổi link */}
                    <div className="flex items-center gap-1.5 min-w-0 shrink-0 flex-nowrap">
                      <button
                        type="button"
                        onClick={() => setIsChaptersDrawerOpen(prev => !prev)}
                        className="h-8 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-semibold border border-stone-200 flex items-center gap-1.5 max-w-[150px] sm:max-w-[210px] truncate cursor-pointer transition-all shadow-2xs shrink-0"
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
                    <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
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

                      {/* Nút Câu hỏi dừng (Khớp ảnh 2: nền xanh đậm sang trọng) */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuizCollapsedToChat(false);
                          handleJumpToCheckpoint();
                        }}
                        className="h-8 px-3 rounded-xl bg-[#1B4338] hover:bg-[#143830] text-white font-bold flex items-center cursor-pointer shadow-xs transition-all shrink-0 text-xs"
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
                            ? 'bg-[#1B4338] text-white border-[#1B4338]'
                            : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                        }`}
                        title="Giơ tay hỏi thầy và bạn"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className={`w-3.5 h-3.5 shrink-0 ${isRaiseHandModalOpen ? 'text-amber-300' : 'text-amber-600'}`}>
                          <path d="M12 4V13M8 6V13M16 8V13M4 11V14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14V10C20 8.89543 19.1046 8 18 8C16.8954 8 16 8.89543 16 10M4 11C4 9.89543 4.89543 9 6 9C7.10457 9 8 9.89543 8 11M8 6C8 4.89543 8.89543 4 10 4C11.1046 4 12 4.89543 12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span>Giơ tay</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: THẢO LUẬN LỚP HỌC (4/12 hoặc 6/12 khi mở rộng chat) */}
                <div 
                  style={{ height: 'calc(100vh - 85px)', minHeight: '560px' }}
                  className={`${isChatExpanded ? 'lg:col-span-6' : 'lg:col-span-4'} bg-white rounded-2xl border border-stone-200/90 overflow-visible flex flex-col shadow-2xs transition-all duration-300 relative group/chatcol`}
                >
                  {/* Thanh mở rộng / thu hẹp chat ở mép trái (Interactive Expand Handle Bar) */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPencilTap();
                      setIsChatExpanded((prev) => !prev);
                    }}
                    className="hidden lg:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-16 bg-white hover:bg-stone-50 border border-stone-300 rounded-full shadow-md items-center justify-center text-stone-600 hover:text-[#1B4338] transition-all cursor-pointer hover:scale-105 group"
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

                  <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col">
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
              </div>
            )}

            {/* TRẠM 2: SỔ TAY BẮT LỖI (2 CỘT CÂN ĐỐI) */}
            {currentMode === 'worksheet' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-white">
                  <WorkingObjectSheet
                    lesson={currentLesson}
                    currentState={currentState}
                    selectedStep={selectedStep}
                    onSelectStep={handleSelectStep}
                    boSpeechOverride={boSpeechOverride}
                  />
                </div>
                <div className="bg-white">
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
              </div>
            )}

            {/* TRẠM 3 & TRẠM 4: POE & GIA SƯ NHÍ */}
            {(currentMode === 'predict_poe' || currentMode === 'protege_teaching') && (
              <AlternativeFlowsSheet
                mode={currentMode}
                onSwitchMode={(mode) => setCurrentMode(mode)}
                onPoeTopicChange={(topic) => setCurrentPoeTopic(topic)}
                onPoeCompletedChange={(completed) => setIsPoeCompleted(completed)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
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
    </>
  );
}
