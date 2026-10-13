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

  // Modals & Drawers
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAiInspectorOpen, setIsAiInspectorOpen] = useState(false);
  const [isFlowGuideOpen, setIsFlowGuideOpen] = useState(false);

  // Dynamic dialog overrides for worksheet mode
  const [tutorFeedbackOverride, setTutorFeedbackOverride] = useState<string | null>(null);
  const [boSpeechOverride, setBoSpeechOverride] = useState<string | null>(null);
  const [probeQuestionOverride, setProbeQuestionOverride] = useState<string | null>(null);

  // Scenario runner tracking
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  // QA / Dev bar visibility: hidden by default unless ?debug=1 in URL or toggled by button
  const [showQaBar, setShowQaBar] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('debug') === '1';
    }
    return false;
  });

  // LocalStorage persistence for true "Tạm dừng, quay lại sau"
  const DRE_STORAGE_KEY = 'dre_saved_session_v1';
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());

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

  // Video playback ticker effect
  useEffect(() => {
    let interval: any = null;
    if (currentMode === 'video_clash' && isVideoPlaying) {
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
    if (time >= currentVideoLesson.checkpointTimestamp && videoPhase === 'WATCHING') {
      setIsVideoPlaying(false);
      setVideoPhase('CHECKPOINT_REACHED');
    }
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
    <div className="h-screen overflow-hidden bg-[#ECE4D5] text-[#2F2923] flex flex-col desk-bg selection:bg-[#F5D65D]">
      {/* Scenario Bar for dev/QA: ONLY rendered if ?debug=1 is in the URL */}
      {showQaBar && (
        <ScenarioPlayerBar
          isVisible={showQaBar}
          onToggleVisible={() => setShowQaBar(prev => !prev)}
          onRunScenario={handleRunScenario}
          onTriggerNudge={handleTriggerNudge}
          onTriggerVideoScenario={() => {
            setCurrentMode('video_clash');
            handleJumpToCheckpoint();
          }}
          onReset={handleRetryLesson}
          activeScenario={activeScenario}
          idleTimerSeconds={idleSeconds}
        />
      )}

      {/* Top Header Bar with Mode Switcher */}
      <ScrapbookHeader
        currentLesson={currentLesson}
        currentMode={currentMode}
        isBackendLive={isBackendLive}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
        }}
        onOpenPause={() => setIsPauseOpen(true)}
        onOpenLessonDrawer={() => setIsLessonDrawerOpen(true)}
        onOpenHelp={() => setCurrentMode('video_clash')}
      />

      {/* Main Learning Workspace: Realistic Open Sketchbook lying on desk (Expanded to cover ~85% of screen width) */}
      <main className="flex-1 min-h-0 w-[96vw] max-w-[1600px] mx-auto px-2 py-2 flex flex-col">
        {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG: Trái là 4 Tab Trạm học · Phải là 1 Nút Sổ tay 4 bạn (Không bao giờ tràn lề!) */}
        <div className="flex items-center justify-between px-2 mb-1.5 shrink-0 gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {LEARNING_STATIONS.map((station) => {
              const isActive = currentMode === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => {
                    sound.playPageFlip();
                    setCurrentMode(station.id);
                  }}
                  type="button"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1B4338] text-white border-[#1B4338] font-bold shadow-xs'
                      : 'bg-white/85 hover:bg-white text-[#4B5563] border-[#D8CEBC] font-medium'
                  }`}
                >
                  <span className="shrink-0">{station.icon}</span>
                  <span>
                    {station.stationNumber}: {station.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cụm phải: Nút Sổ tay & Hỏi riêng 4 bạn gọn gàng */}
          <div className="flex items-center gap-2 shrink-0">
            <MaicPeerClassroomDock
              currentMode={currentMode}
              currentState={currentState}
              lessonTopic={currentMode === 'video_clash' ? currentVideoLesson.title : currentLesson.topic}
              errorStepIndex={currentLesson.errorStepIndex}
              peerContext={currentVideoLesson.peerContext}
            />
          </div>
        </div>

        {/* KHUNG SỔ TAY CHÍNH: 1 Mặt phẳng duy nhất (#FFFDF7), không còn hộp lồng hộp! */}
        <div className="flex-1 min-h-0 bg-[#FFFDF7] rounded-2xl border-2 border-[#C8B69E] shadow-lg p-3 sm:p-4 flex flex-col overflow-hidden">
          {currentMode === 'video_clash' && (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 h-full items-stretch">
              <div className="lg:col-span-7 h-full min-h-0">
                <VideoPlayerSheet
                  lesson={currentVideoLesson}
                  phase={videoPhase}
                  currentTime={videoCurrentTime}
                  isPlaying={isVideoPlaying}
                  isLoadingAi={isLoadingAi}
                  liveBoDialogue={liveBoDialogue}
                  liveCoLamDialogue={liveCoLamDialogue}
                  onTogglePlay={handleToggleVideoPlay}
                  onSeek={handleSeekVideo}
                  onTriggerFreeze={handleTriggerFreeze}
                  onJumpToCheckpoint={handleJumpToCheckpoint}
                  onSwitchVideoLesson={handleSwitchVideoLesson}
                  onAnswerCheckpoint={handleAnswerCheckpoint}
                  onSubmitRebuttal={handleSubmitRebuttal}
                  onResumeVideo={handleResumeVideoAfterClosure}
                />
              </div>

              <div className="lg:col-span-3 h-full min-h-0 border-t lg:border-t-0 lg:border-l border-[#EAE3D5]">
                <VideoDebateSheet
                  lesson={currentVideoLesson}
                  phase={videoPhase}
                  currentTime={videoCurrentTime}
                  isBackendLive={isBackendLive}
                  isLoadingAi={isLoadingAi}
                  liveBoDialogue={liveBoDialogue}
                  liveCoLamDialogue={liveCoLamDialogue}
                  liveHintDialogue={liveHintDialogue}
                  onSeekVideo={handleSeekVideo}
                  onAnswerCheckpoint={handleAnswerCheckpoint}
                  onSubmitRebuttal={handleSubmitRebuttal}
                  onResumeVideo={handleResumeVideoAfterClosure}
                  onDismissFreeze={() => {
                    setVideoPhase('WATCHING');
                    setIsVideoPlaying(true);
                  }}
                />
              </div>
            </div>
          )}

          {currentMode === 'worksheet' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 h-full divide-y lg:divide-y-0 lg:divide-x divide-[#EAE3D5] overflow-y-auto no-scrollbar">
              <div className="lg:col-span-7 h-full">
                <WorkingObjectSheet
                  lesson={currentLesson}
                  currentState={currentState}
                  selectedStep={selectedStep}
                  onSelectStep={handleSelectStep}
                  boSpeechOverride={boSpeechOverride}
                />
              </div>
              <div className="lg:col-span-5 h-full">
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
            <div className="h-full overflow-hidden">
              <AlternativeFlowsSheet
                mode={currentMode}
                onSwitchMode={(mode) => setCurrentMode(mode)}
                onPoeTopicChange={(topic) => setCurrentPoeTopic(topic)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
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
    </div>
  );
}
