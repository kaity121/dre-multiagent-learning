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
  const [isQuizCollapsedToChat, setIsQuizCollapsedToChat] = useState<boolean>(false);
  const [externalQuestionTrigger, setExternalQuestionTrigger] = useState<{ id: number; text: string } | null>(null);

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
    <>
      {/* QA Scenario Runner Bar: Only rendered when ?debug=1 */}
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
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
                {LEARNING_STATIONS.map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      sound.playPageFlip();
                      if (station.id !== 'video_clash') setIsVideoPlaying(false);
                      setCurrentMode(station.id);
                    }}
                    className={`chip ${
                      currentMode === station.id
                        ? 'chip--primary'
                        : 'chip--ghost text-slate-300 border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="shrink-0">{station.icon}</span>
                    <span>{station.stationNumber}: {station.title}</span>
                  </button>
                ))}
              </div>

              <span className="rt-partno shrink-0 text-white font-semibold">Part 1</span>
              <span className="rt-goal text-slate-400 truncate">{currentVideoLesson.topic}</span>
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
                className="btn btn--sm btn--on-dark"
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
            />
          </aside>

          {/* 4. ROOM BAR: THANH ĐIỀU KHIỂN ĐÁY PHÒNG HỌC (REACTIONS + GIƠ TAY + PHÒNG HỌC) */}
          <footer className="room-bar">
            <div className="act-part truncate">
              Part 1/4 · Định nghĩa vectơ &amp; Quy tắc hình hộp || Thầy Nguyễn Phan Tiến (SGK Mới)
            </div>
            <div className="act-group">
              <button
                type="button"
                onClick={() => sound.playPencilTap()}
                className="act-btn"
                title="Thả cảm xúc Hay"
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
                title="Báo đoạn này khó hiểu"
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
                  sound.playStampThud();
                  handleTriggerFreeze();
                }}
                className="act-btn act-btn--hand"
                title="Giơ tay hỏi thầy và bạn"
              >
                <svg viewBox="0 0 24 24" fill="none" className="ic">
                  <path d="M12 4V13M8 6V13M16 8V13M4 11V14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14V10C20 8.89543 19.1046 8 18 8C16.8954 8 16 8.89543 16 10M4 11C4 9.89543 4.89543 9 6 9C7.10457 9 8 9.89543 8 11M8 6C8 4.89543 8.89543 4 10 4C11.1046 4 12 4.89543 12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>Giơ tay</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLessonDrawerOpen(true)}
                className="act-btn"
                title="Danh sách thành viên lớp học"
              >
                <svg viewBox="0 0 24 24" fill="none" className="ic">
                  <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M16 3.13C17.7699 3.58316 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="1.8"/>
                </svg>
                <span className="lbl">Lớp học (4)</span>
              </button>
            </div>
            <div className="act-end">
              <button
                type="button"
                onClick={() => setIsPauseOpen(true)}
                className="btn btn--sm btn--on-dark"
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
          {/* MODERN EDTECH APPBAR (60px) */}
          <header className="appbar">
            <button
              type="button"
              onClick={() => setCurrentMode('video_clash')}
              className="brand cursor-pointer border-0 bg-transparent"
              title="Quay lại Trạm 1: Lớp học Video"
            >
              <div className="brand-mark">DRE</div>
              <span className="font-bold text-base">DRE Learning</span>
            </button>

            {/* Dải station navigation chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {LEARNING_STATIONS.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => {
                    sound.playPageFlip();
                    setCurrentMode(station.id);
                  }}
                  className={`chip ${currentMode === station.id ? 'chip--primary' : ''}`}
                >
                  <span className="shrink-0">{station.icon}</span>
                  <span>{station.stationNumber}: {station.title}</span>
                </button>
              ))}
            </div>

            <div className="appbar-role flex items-center gap-3">
              {currentMode === 'worksheet' && (
                <button
                  type="button"
                  onClick={() => setIsLessonDrawerOpen(true)}
                  className="btn btn--sm"
                >
                  Đổi bài ({currentLesson.id})
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPauseOpen(true)}
                className="btn btn--sm"
              >
                Tạm dừng
              </button>
            </div>
          </header>

          {/* MAIN PAGE WORKSPACE */}
          <main className="page flex-1 w-full max-w-7xl mx-auto py-6 px-4 sm:px-6">
            <div className="page-head">
              <div>
                <div className="crumb">
                  <span>Lộ trình 4 Trạm</span> / <strong>
                    {currentMode === 'worksheet'
                      ? 'Trạm 2: Sổ tay bắt lỗi'
                      : currentMode === 'predict_poe'
                      ? 'Trạm 3: Đoán kết quả (POE)'
                      : 'Trạm 4: Dạy kèm Bo & Thách đấu'}
                  </strong>
                </div>
                <h1>
                  {currentMode === 'worksheet'
                    ? currentLesson.topic
                    : currentMode === 'predict_poe'
                    ? 'Thử thách Đoán kết quả (Predict - Observe - Explain)'
                    : 'Thực hành Dạy kèm Bo & Tự ra đề'}
                </h1>
                <p className="muted">Toán 12 · Hình học không gian SGK Mới</p>
              </div>

              <div className="flex items-center gap-2">
                <MaicPeerClassroomDock
                  currentMode={currentMode}
                  currentState={currentState}
                  lessonTopic={currentLesson.topic}
                  errorStepIndex={currentLesson.errorStepIndex}
                  peerContext={currentVideoLesson.peerContext}
                />
              </div>
            </div>

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
