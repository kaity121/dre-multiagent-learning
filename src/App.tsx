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

import { useState, useEffect, useRef } from 'react';
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
  TeacherHatIcon
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

export default function App() {
  // Current active mode (Default to Trạm 1: Video Checkpoint & Bo phản biện)
  const [currentMode, setCurrentMode] = useState<LearningMode>('video_clash');

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
  const [externalQuestionTrigger, setExternalQuestionTrigger] = useState<{ id: number; text: string } | null>(null);
  const [showAllTimeline, setShowAllTimeline] = useState<boolean>(false);

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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('skip_lobby') === '1') return true;
      const savedUser = localStorage.getItem('dre_learner_profile');
      return !!savedUser;
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
        if (saved.currentState) setCurrentState(saved.currentState);
        if (saved.selectedStep !== undefined) setSelectedStep(saved.selectedStep);
        if (saved.explanationText) setExplanationText(saved.explanationText);
        if (saved.worksheetRebuttalText) setWorksheetRebuttalText(saved.worksheetRebuttalText);
        if (saved.worksheetHintLevel !== undefined) setWorksheetHintLevel(saved.worksheetHintLevel);
        if (saved.boSpeechOverride) setBoSpeechOverride(saved.boSpeechOverride);
        if (saved.tutorFeedbackOverride) setTutorFeedbackOverride(saved.tutorFeedbackOverride);
        if (saved.probeQuestionOverride) setProbeQuestionOverride(saved.probeQuestionOverride);
        if (saved.currentMode) setCurrentMode(saved.currentMode);
        if (saved.videoPhase) setVideoPhase(saved.videoPhase);
        if (saved.videoCurrentTime !== undefined) setVideoCurrentTime(saved.videoCurrentTime);
        if (saved.savedAt) setLastSavedTimestamp(saved.savedAt);
      }
    } catch (e) {
      console.warn('[DRE] Failed to restore session from localStorage:', e);
    }
  }, []);

  // Auto-save session progress to localStorage whenever state changes
  useEffect(() => {
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

  // Inactivity tracking (45s nudge threshold)
  const [idleSeconds, setIdleSeconds] = useState(0);
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

  // Reset activity timestamp on user interaction
  const recordUserActivity = () => {
    lastActiveTimestamp.current = Date.now();
    setIdleSeconds(0);
  };

  // Timer loop for 45s tutor nudge in worksheet mode
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentMode === 'worksheet' && (currentState === 'MARKED' || currentState === 'EXPLAIN_PROMPT')) {
        const elapsed = Math.floor((Date.now() - lastActiveTimestamp.current) / 1000);
        setIdleSeconds(elapsed);
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

  const handleSelectStep = (stepNumber: number) => {
    recordUserActivity();
    setSelectedStep(stepNumber);
    setBoSpeechOverride(null);
    setTutorFeedbackOverride(null);
    setCurrentState('MARKED');
  };

  const handleExplanationChange = (text: string) => {
    recordUserActivity();
    setExplanationText(text);
    if (currentState === 'MARKED') {
      setCurrentState('EXPLAIN_PROMPT');
    }
  };

  const handleSubmitExplanation = async () => {
    recordUserActivity();
    if (!selectedStep) return;

    if (selectedStep !== currentLesson.errorStepIndex) {
      setCurrentState('HINT');
      setBoSpeechOverride(null);
      setTutorFeedbackOverride(null);
      return;
    }

    // Step is correct -> Enter Peer Clash (Bo challenges with shortcut fallacy)!
    setCurrentState('BO_CHALLENGE');
    setWorksheetHintLevel(0);
    setWorksheetRebuttalText('');
    setTutorFeedbackOverride(null);

    if (isBackendLive) {
      setIsLoadingAi(true);
      try {
        let sessId = backendSessionId;
        const startRes = await startBackendSession(currentLesson.id);
        if (startRes) {
          sessId = startRes.sessionId;
          setBackendSessionId(sessId);
        }
        if (sessId) {
          const ansRes = await submitBackendAnswer(sessId, explanationText);
          if (ansRes && ansRes.boDialogue) {
            setBoSpeechOverride(ansRes.boDialogue);
            setIsLoadingAi(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[DRE Worksheet] Backend answer error:', err);
      }
      setIsLoadingAi(false);
    }

    // Fallback if offline / backend not running
    setBoSpeechOverride(getBoChallenge(currentLesson));
  };

  const handleSubmitWorksheetRebuttal = async () => {
    recordUserActivity();
    if (!worksheetRebuttalText.trim()) return;

    if (isBackendLive && backendSessionId) {
      setIsLoadingAi(true);
      try {
        const rebRes = await submitBackendRebuttal(backendSessionId, worksheetRebuttalText);
        if (rebRes) {
          if (rebRes.danhGiaPhanBien === 'sac_ben' || rebRes.done) {
            if (rebRes.boDialogue) setBoSpeechOverride(rebRes.boDialogue);
            const closure = Array.isArray(rebRes.coLamDialogue) ? rebRes.coLamDialogue.join(' ') : rebRes.coLamDialogue;
            if (closure) setTutorFeedbackOverride(closure);
            setCurrentState('CLOSE');
            setIsLoadingAi(false);
            return;
          } else {
            // chua_ro with hint
            const hint = Array.isArray(rebRes.coLamDialogue) ? rebRes.coLamDialogue.join(' ') : rebRes.coLamDialogue;
            setTutorFeedbackOverride(hint || 'Cô Lam: Hãy xem lại bản chất quy tắc toán học nhé!');
            setWorksheetHintLevel(rebRes.hintLevel || 1);
            setIsLoadingAi(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[DRE Worksheet] Backend rebuttal error:', err);
      }
      setIsLoadingAi(false);
    }

    // Offline evaluation
    const offlineRes = evaluateRebuttalOffline(currentLesson, worksheetRebuttalText);
    if (offlineRes.isSharp) {
      setBoSpeechOverride(offlineRes.boReaction);
      setTutorFeedbackOverride(offlineRes.tutorFeedback);
      setCurrentState('CLOSE');
    } else {
      setTutorFeedbackOverride(offlineRes.tutorFeedback);
      const nextLevel = worksheetHintLevel + 1;
      setWorksheetHintLevel(nextLevel);
      if (nextLevel >= 2) {
        // Max 2 turns reached -> close with synthesis
        setBoSpeechOverride(getBoConcession(currentLesson));
        setCurrentState('CLOSE');
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
    setVideoCurrentTime(currentVideoLesson.checkpointTimestamp);
    setIsVideoPlaying(false);
    setVideoPhase('CHECKPOINT_REACHED');
  };

  const handleTriggerFreeze = () => {
    setIsVideoPlaying(false);
    setVideoPhase('STUDENT_FREEZE');
  };

  const handleAnswerCheckpoint = async (optionLabel: string) => {
    recordUserActivity();
    setLiveHintDialogue(null);

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
      stationNumber: 'Trạm 1',
      stageLabel: 'Khởi động',
      title: 'Video & Bo cãi',
      color: '#4E9B87',
      activeBg: 'bg-[#E1F2ED]',
      activeText: 'text-[#1B5749]',
      activeBorder: 'border-[#3D8F7B]',
      inactiveBg: 'bg-[#EDF7F3]/90',
      inactiveText: 'text-[#3E7D6F]',
      inactiveBorder: 'border-[#BDDFD5]',
      icon: <VideoPlayIcon className="w-3.5 h-3.5 text-[#2C7866]" />,
    },
    {
      id: 'worksheet',
      stationNumber: 'Trạm 2',
      stageLabel: 'Luyện tập',
      title: 'Sổ tay bắt lỗi',
      color: '#E8A33D',
      activeBg: 'bg-[#FFF5E0]',
      activeText: 'text-[#7D490E]',
      activeBorder: 'border-[#E8A33D]',
      inactiveBg: 'bg-[#FFF8EA]/90',
      inactiveText: 'text-[#8A5F1F]',
      inactiveBorder: 'border-[#ECD7AF]',
      icon: <PencilIcon className="w-3.5 h-3.5 text-[#B8781B]" />,
    },
    {
      id: 'predict_poe',
      stationNumber: 'Trạm 3',
      stageLabel: 'Thử thách',
      title: 'Đoán kết quả (POE)',
      color: '#E2B124',
      activeBg: 'bg-[#FEF8DC]',
      activeText: 'text-[#7A5B05]',
      activeBorder: 'border-[#D9A716]',
      inactiveBg: 'bg-[#FCF9E8]/90',
      inactiveText: 'text-[#856611]',
      inactiveBorder: 'border-[#E8DC9E]',
      icon: <SparkleIcon className="w-3.5 h-3.5 text-[#B3870E]" />,
    },
    {
      id: 'protege_teaching',
      stationNumber: 'Trạm 4',
      stageLabel: 'Làm chủ',
      title: 'Dạy kèm Bo',
      color: '#6B9E5C',
      activeBg: 'bg-[#EBF7E7]',
      activeText: 'text-[#2B6121]',
      activeBorder: 'border-[#5FA04E]',
      inactiveBg: 'bg-[#F2F9EF]/90',
      inactiveText: 'text-[#427A34]',
      inactiveBorder: 'border-[#C4E3BA]',
      icon: <TeacherHatIcon className="w-3.5 h-3.5 text-[#3D7C2D]" />,
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
          onTriggerStation={(station) => {
            if (station !== 'video_clash') setIsVideoPlaying(false);
            setCurrentMode(station);
          }}
          onReset={handleRetryLesson}
          activeScenario={activeScenario}
          idleTimerSeconds={idleSeconds}
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
      {!isLoggedIn && (
        <PreClassLobbyModal
          onCompleteLobby={(name, lvl) => {
            const profile = { name, level: lvl };
            setLearnerProfile(profile);
            localStorage.setItem('dre_learner_profile', JSON.stringify(profile));
            setIsLoggedIn(true);
          }}
        />
      )}

      {/* ====================================================================
          TRẠM 1: LỚP HỌC VIDEO (FULL-BLEED EDTECH ROOM THEO CHUẨN BLU1606 & FIGMA)
          ==================================================================== */}
      {currentMode === 'video_clash' ? (
        <div className="room select-none">
          {/* 1. ROOM TITLE BAR (56px) */}
          <header className="room-title">
            <div className="rt-left flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setCurrentMode('video_clash')}
                className="brand-mark shrink-0 font-bold tracking-tight cursor-pointer"
                title="DRE Learning Classroom"
              >
                DRE
              </button>

              {/* Dải station pills chuyển trạm nhanh */}
              <div className="flex items-center gap-1.5 shrink-0">
                {LEARNING_STATIONS.map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      sound.playPageFlip();
                      if (station.id !== 'video_clash') setIsVideoPlaying(false);
                      setCurrentMode(station.id);
                    }}
                    className={`chip station-pill ${
                      currentMode === station.id
                        ? 'chip--primary'
                        : 'chip--ghost'
                    }`}
                    title={station.title}
                  >
                    <span className="shrink-0">{station.icon}</span>
                    <span>{station.stationNumber}</span>
                  </button>
                ))}
              </div>

              <span className="rt-partno shrink-0">Part 1</span>
              <span className="rt-goal flex-1 min-w-0 text-slate-800 truncate font-semibold" title={currentVideoLesson.topic}>
                {currentVideoLesson.topic}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className={`rt-status ${
                  videoPhase === 'CHECKPOINT_REACHED' || videoPhase === 'BO_DEBATE'
                    ? 'is-paused'
                    : isVideoPlaying
                    ? 'is-playing'
                    : 'is-paused'
                }`}
              >
                <span className="rt-dot" />
                <span>
                  {videoPhase === 'CHECKPOINT_REACHED'
                    ? 'Dừng bài tập (37:13)'
                    : videoPhase === 'BO_DEBATE'
                    ? 'Phản biện Bo'
                    : isVideoPlaying
                    ? 'Đang phát'
                    : 'Tạm dừng'}
                </span>
              </span>

              <button
                type="button"
                onClick={() => setIsLessonDrawerOpen(true)}
                className="btn btn--sm bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer"
              >
                Đổi bài
              </button>
            </div>
          </header>

          {/* 2. ROOM STAGE: KHUNG VIDEO BÀI GIẢNG 16:9 */}
          <section className="room-stage" aria-label="Video bài giảng">
            <VideoPlayerSheet
              lesson={currentVideoLesson}
              phase={videoPhase}
              currentTime={videoCurrentTime}
              isPlaying={isVideoPlaying}
              isLoadingAi={isLoadingAi}
              liveBoDialogue={liveBoDialogue}
              liveCoLamDialogue={liveCoLamDialogue}
              isQuizCollapsedToChat={isQuizCollapsedToChat}
              onToggleCollapseQuiz={(collapsed) => setIsQuizCollapsedToChat(collapsed)}
              onSendContextualQuestion={(qText) =>
                setExternalQuestionTrigger({ id: Date.now(), text: qText })
              }
              onTogglePlay={handleToggleVideoPlay}
              onSeek={handleSeekVideo}
              onTriggerFreeze={handleTriggerFreeze}
              onJumpToCheckpoint={() => {
                setIsQuizCollapsedToChat(false);
                handleJumpToCheckpoint();
              }}
              onSwitchVideoLesson={handleSwitchVideoLesson}
              onAnswerCheckpoint={handleAnswerCheckpoint}
              onSubmitRebuttal={handleSubmitRebuttal}
              onResumeVideo={handleResumeVideoAfterClosure}
              isOverlayDrawerOpen={isChaptersDrawerOpen}
              onToggleOverlayDrawer={() => setIsChaptersDrawerOpen(prev => !prev)}
              isAttachModalOpen={isAttachModalOpen}
              onToggleAttachModal={setIsAttachModalOpen}
              isRaiseHandModalOpen={isRaiseHandModalOpen}
              onToggleRaiseHandModal={() => setIsRaiseHandModalOpen(prev => !prev)}
              hideInternalBottomBar={true}
            />
          </section>

          {/* 3. ROOM PANEL: CỘT PHẢI LỚP HỌC (PEOPLE ROW + TABS + CHAT + COMPOSER) */}
          <aside className="room-panel">
            <VideoDebateSheet
              lesson={currentVideoLesson}
              phase={videoPhase}
              currentTime={videoCurrentTime}
              isBackendLive={isBackendLive}
              isLoadingAi={isLoadingAi}
              liveBoDialogue={liveBoDialogue}
              liveCoLamDialogue={liveCoLamDialogue}
              liveHintDialogue={liveHintDialogue}
              isQuizCollapsedToChat={isQuizCollapsedToChat}
              onExpandQuizBackToVideo={() => setIsQuizCollapsedToChat(false)}
              externalQuestionTrigger={externalQuestionTrigger}
              onSeekVideo={handleSeekVideo}
              onAnswerCheckpoint={handleAnswerCheckpoint}
              onSubmitRebuttal={handleSubmitRebuttal}
              onResumeVideo={handleResumeVideoAfterClosure}
              onDismissFreeze={() => {
                setVideoPhase('WATCHING');
                setIsVideoPlaying(true);
              }}
              learnerName={learnerProfile?.name}
              showAllTimeline={showAllTimeline}
            />
          </aside>

          {/* 4. ROOM BAR: THANH ĐIỀU KHIỂN ĐÁY PHÒNG HỌC (CHUẨN 100% BLU1606 MOCK) */}
          <footer className="room-bar">
            {/* Trái: Menu Phân cảnh & Đổi link */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsChaptersDrawerOpen(prev => !prev)}
                className={`btn btn--sm flex items-center gap-1.5 max-w-[280px] truncate ${
                  isChaptersDrawerOpen ? 'bg-slate-900 text-white font-bold border-slate-900' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Xem Phân cảnh & Bản chép lời bài giảng"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0">
                  <path d="M4 5.5C4 4.67 4.67 4 5.5 4H11V19H5.5C4.67 19 4 19.67 4 20.5V5.5Z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="M12 5.5C12 4.39543 12.8954 3.5 14 3.5H19.5C20.0523 3.5 20.5 3.94772 20.5 4.5V18.5C20.5 19.0523 20.0523 19.5 19.5 19.5H14C12.8954 19.5 12 20.3954 12 21.5M12 5.5C12 4.39543 11.1046 3.5 10 3.5H4.5C3.94772 3.5 3.5 3.94772 3.5 4.5V18.5C3.5 19.0523 3.94772 19.5 4.5 19.5H10C11.1046 19.5 12 20.3954 12 21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="truncate">1. Định nghĩa vectơ &amp; Giá của vectơ</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAttachModalOpen(true)}
                className="btn btn--sm flex items-center gap-1 shrink-0 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                title="Đổi URL YouTube bài giảng khác"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#F5D65D]">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline">Đổi link</span>
              </button>
            </div>

            {/* Giữa: Cụm nút phản xạ + Câu hỏi dừng + Giơ tay */}
            <div className="act-group">
              <button
                type="button"
                onClick={() => sound.playPencilTap()}
                className="act-btn"
                title="Đã hiểu đoạn này"
              >
                <svg viewBox="0 0 24 24" fill="none" className="ic">
                  <path d="M7 11V19M7 19H4C3.44772 19 3 18.5523 3 18V12C3 11.4477 3.44772 11 4 11H7M7 19L11.5 19C12.3284 19 13.0691 18.4984 13.3768 17.7292L15.3768 12.7292C15.4578 12.5266 15.5 12.3093 15.5 12.0901V11C15.5 10.4477 15.0523 10 14.5 10H11L12.5 5.5C12.5 4.5 11.5 4 10.5 4L7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="lbl">Hay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playBubblePop();
                  handleTriggerFreeze();
                }}
                className="act-btn"
                title="Chưa rõ đoạn này"
              >
                <svg viewBox="0 0 24 24" fill="none" className="ic">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 10H9.01M15 10H15.01M9.5 16C10.5 14.5 13.5 14.5 14.5 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="lbl">Khó hiểu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuizCollapsedToChat(false);
                  handleJumpToCheckpoint();
                }}
                className="act-btn act-btn--checkpoint font-bold text-white"
                title="Nhảy tới mốc câu hỏi dừng 37:13"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                  <path d="M13 2L4.5 13.5H11.5L10.5 22L19.5 10.5H12.5L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                <span>Câu hỏi dừng (37:13)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playStampThud();
                  setIsRaiseHandModalOpen(prev => !prev);
                }}
                className={`act-btn act-btn--hand ${isRaiseHandModalOpen ? 'is-active ring-2 ring-amber-500' : ''}`}
                title="Giơ tay hỏi thầy và bạn"
              >
                <svg viewBox="0 0 24 24" fill="none" className="ic">
                  <path d="M12 4V13M8 6V13M16 8V13M4 11V14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14V10C20 8.89543 19.1046 8 18 8C16.8954 8 16 8.89543 16 10M4 11C4 9.89543 4.89543 9 6 9C7.10457 9 8 9.89543 8 11M8 6C8 4.89543 8.89543 4 10 4C11.1046 4 12 4.89543 12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>Giơ tay</span>
              </button>
            </div>

            {/* Phải: Nút Tạm dừng */}
            <div className="act-end">
              <button
                type="button"
                onClick={() => setIsPauseOpen(true)}
                className="btn btn--sm bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              >
                Tạm dừng
              </button>
            </div>
          </footer>
        </div>
      ) : (
        /* ====================================================================
            TRẠM 2, 3, 4: KHÔNG GIAN HỌC TẬP EDTECH HIỆN ĐẠI (VIBE-MATCHED)
            ==================================================================== */
        <div className="min-h-screen bg-[#f8fafc] text-[#111827] flex flex-col font-sans">
          {/* THANH COMBO SIÊU GỌN 2 DÒNG (TIẾT KIỆM 180PX - VỪA KHÍT 1 MÀN HÌNH KHÔNG CẦN SCROLL) */}
          <header className="w-full bg-white border-b border-slate-200 px-4 py-2 sticky top-0 z-40 shadow-2xs select-none">
            <div className="max-w-7xl mx-auto space-y-1.5">
              {/* DÒNG 1: [1. Video & Bo cãi] → [2. Sổ tay bắt lỗi] → [3. Đoán POE] → [4. Gia sư] | [💬 Hỏi 4 bạn] [Sang Trạm 3 →] */}
              <div className="flex items-center justify-between gap-3 text-xs">
                {/* Cụm trái: Logo DRE + 4 Trạm pills ĐỒNG BỘ 100% NHƯ TRẠM 1 (ẢNH 1) */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setCurrentMode('video_clash')}
                    className="brand-mark shrink-0 font-bold tracking-tight cursor-pointer"
                    title="Quay lại Trạm 1: Lớp học Video"
                  >
                    DRE
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {LEARNING_STATIONS.map((station) => (
                      <button
                        key={station.id}
                        type="button"
                        onClick={() => {
                          sound.playPageFlip();
                          if (station.id !== 'video_clash') setIsVideoPlaying(false);
                          setCurrentMode(station.id);
                        }}
                        className={`chip station-pill ${
                          currentMode === station.id
                            ? 'chip--primary'
                            : 'chip--ghost'
                        }`}
                        title={station.title}
                      >
                        <span className="shrink-0">{station.icon}</span>
                        <span>{station.stationNumber}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cụm phải: Hỏi riêng 4 bạn + Nút sang trạm tiếp theo + Đổi bài + Tạm dừng */}
                <div className="flex items-center gap-2 shrink-0">
                  <MaicPeerClassroomDock
                    currentMode={currentMode}
                    currentState={currentState}
                    lessonTopic={currentLesson.topic}
                    errorStepIndex={currentLesson.errorStepIndex}
                    peerContext={currentVideoLesson.peerContext}
                  />

                  {currentMode === 'worksheet' && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPageFlip();
                        setCurrentMode('predict_poe');
                      }}
                      className="px-3 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>Sang Trạm 3: Đoán POE ➔</span>
                    </button>
                  )}

                  {currentMode === 'predict_poe' && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPageFlip();
                        setCurrentMode('protege_teaching');
                      }}
                      className="px-3 py-1 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>Sang Trạm 4: Dạy kèm Bo ➔</span>
                    </button>
                  )}

                  {currentMode === 'protege_teaching' && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPageFlip();
                        setCurrentMode('video_clash');
                      }}
                      className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>↺ Hoàn thành · Quay lại Trạm 1</span>
                    </button>
                  )}

                  {currentMode === 'worksheet' && (
                    <button
                      type="button"
                      onClick={() => setIsLessonDrawerOpen(true)}
                      className="btn btn--sm bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer h-7 px-2.5 text-xs rounded-lg"
                    >
                      Đổi bài
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsPauseOpen(true)}
                    className="btn btn--sm bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer h-7 px-2.5 text-xs rounded-lg"
                  >
                    Tạm dừng
                  </button>
                </div>
              </div>

              {/* DÒNG 2: TIÊU ĐỀ BÀI HỌC GỌN 1 DÒNG DUY NHẤT (KHÔNG LẶP BREADCRUMB, KHÔNG RỚT DÒNG) */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-[#0e7490] font-bold text-[11px] shrink-0 font-mono">
                    {currentMode === 'worksheet' ? 'Trạm 2' : currentMode === 'predict_poe' ? 'Trạm 3' : 'Trạm 4'}
                  </span>
                  <h1 className="font-bold text-sm text-slate-900 truncate tracking-tight m-0 leading-tight">
                    {currentMode === 'worksheet'
                      ? currentLesson.topic
                      : currentMode === 'predict_poe'
                      ? 'Thử thách Đoán kết quả (Predict – Observe – Explain) — IA = -3IG'
                      : 'Thực hành Dạy kèm Bo & Tự ra đề — Quy tắc hình hộp'}
                  </h1>
                  <span className="text-[11px] text-slate-500 font-medium hidden md:inline shrink-0">
                    · Toán 12 SGK Mới
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-slate-600 font-medium">
                    {currentMode === 'worksheet'
                      ? 'Bắt lỗi Bo'
                      : currentMode === 'predict_poe'
                      ? 'Dự đoán POE'
                      : 'Dạy kèm Bo'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* MAIN PAGE WORKSPACE (SÁT MÉP TRÊN, VỪA KHÍT MÀN HÌNH LAPTOP) */}
          <main className="page flex-1 w-full max-w-7xl mx-auto pt-2.5 pb-6 px-4 sm:px-6 animate-in fade-in duration-150">

            {/* CARD CONTAINER NỀN TRẮNG CHUẨN EDTECH */}
            <div className="card overflow-hidden">
              {currentMode === 'worksheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                  <div className="lg:col-span-7 p-6 bg-white">
                    <WorkingObjectSheet
                      lesson={currentLesson}
                      currentState={currentState}
                      selectedStep={selectedStep}
                      onSelectStep={handleSelectStep}
                      boSpeechOverride={boSpeechOverride}
                    />
                  </div>
                  <div className="lg:col-span-5 p-6 bg-slate-50/50">
                    <InteractionCardSheet
                      lesson={currentLesson}
                      currentState={currentState}
                      selectedStep={selectedStep}
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

              {(currentMode === 'predict_poe' || currentMode === 'protege_teaching') && (
                <div className="p-6 bg-white">
                  <AlternativeFlowsSheet
                    mode={currentMode}
                    onSwitchMode={(mode) => setCurrentMode(mode)}
                    onPoeTopicChange={(topic) => setCurrentPoeTopic(topic)}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      )}

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
