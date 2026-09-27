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
import { OnboardingModal } from './components/OnboardingModal';
import { PauseModal } from './components/PauseModal';
import { LessonSelectorDrawer } from './components/LessonSelectorDrawer';
import { ScenarioPlayerBar } from './components/ScenarioPlayerBar';
import { MultiAgentInspectorModal } from './components/MultiAgentInspectorModal';
import { LearningFlowGuideModal } from './components/LearningFlowGuideModal';
import { 
  WashiTape, 
  SparkleIcon, 
  OpenBookIcon, 
  SwordsDebateIcon, 
  ChalkboardIcon 
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
  // Current active mode (Default to worksheet DRE classic notebook)
  const [currentMode, setCurrentMode] = useState<LearningMode>('worksheet');

  // Backend Multi-Agent AI States (Connected to dre-backend Express on port 3001)
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [liveBoDialogue, setLiveBoDialogue] = useState<string | null>(null);
  const [liveCoLamDialogue, setLiveCoLamDialogue] = useState<string | string[] | null>(null);
  const [liveHintDialogue, setLiveHintDialogue] = useState<string | null>(null);

  // Worksheet Mode States
  const [selectedLevel, setSelectedLevel] = useState<LearnerLevel>('beginner');
  const [currentLesson, setCurrentLesson] = useState<MisconceptionItem>(MISCONCEPTION_LIBRARY[0]);
  const [currentState, setCurrentState] = useState<DREState>('IDLE');
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [explanationText, setExplanationText] = useState<string>('');
  const [worksheetRebuttalText, setWorksheetRebuttalText] = useState<string>('');
  const [worksheetHintLevel, setWorksheetHintLevel] = useState<number>(0);

  // Video Mode States
  const [currentVideoLesson, setCurrentVideoLesson] = useState<VideoLessonItem>(VIDEO_LESSON_LIBRARY[0]);
  const [videoPhase, setVideoPhase] = useState<VideoCheckpointPhase>('CHECKPOINT_REACHED');
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(VIDEO_LESSON_LIBRARY[0].checkpointTimestamp);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [currentPoeTopic, setCurrentPoeTopic] = useState<string>('Toán 8 · Phá ngoặc & Đổi dấu: B = 7x − (2x − 5)');

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
    setVideoCurrentTime(lesson.checkpointTimestamp);
    setVideoPhase('CHECKPOINT_REACHED');
    setIsVideoPlaying(false);
    setBackendSessionId(null);
    setLiveBoDialogue(null);
    setLiveCoLamDialogue(null);
    setLiveHintDialogue(null);
  };

  return (
    <div className="min-h-screen bg-[#ECE4D5] text-[#2F2923] flex flex-col desk-bg selection:bg-[#F5D65D]">
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
          if (mode === 'video_clash') {
            handleJumpToCheckpoint();
          }
        }}
        onOpenPause={() => setIsPauseOpen(true)}
        onOpenLessonDrawer={() => setIsLessonDrawerOpen(true)}
        onOpenHelp={() => setIsOnboardingOpen(true)}
        onOpenAiInspector={() => setIsAiInspectorOpen(true)}
        onOpenFlowGuide={() => setIsFlowGuideOpen(true)}
      />

      {/* Main Learning Workspace: Realistic Open Sketchbook lying on desk */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 lg:p-6 flex flex-col justify-start">
        {/* Workspace State Ribbon */}
        <div className="mb-2 sm:mb-3 flex flex-wrap items-center justify-between text-xs text-[#7A6D5E] px-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8A33D]" />
            <span className="font-mono uppercase font-bold text-[#8C5D19]">
              {currentMode === 'worksheet' && `Trạng thái: ${currentState}`}
              {currentMode === 'video_clash' && `Video: ${videoPhase}`}
              {currentMode === 'predict_poe' && 'Chế độ: Dự đoán kết quả (POE)'}
              {currentMode === 'protege_teaching' && 'Chế độ: Gia sư nhí cho Bo'}
            </span>
            <span className="text-[#A39686]">·</span>
            <span className="font-handwriting text-sm text-[#4E4135] font-semibold">
              {currentMode === 'worksheet'
                ? currentLesson.topic
                : currentMode === 'video_clash'
                ? currentVideoLesson.title
                : currentMode === 'predict_poe'
                ? currentPoeTopic
                : 'Toán 7 · Quy đồng mẫu số phân số'}
            </span>
          </div>

          {/* Quick Lesson Switcher on Ribbon */}
          {currentMode === 'worksheet' ? (
            <button
              onClick={() => setIsLessonDrawerOpen(true)}
              className="hover:underline font-handwriting text-sm text-[#377A69] font-bold flex items-center gap-1 cursor-pointer"
            >
              <OpenBookIcon className="w-3.5 h-3.5 text-[#377A69]" />
              <span>Mở sổ chọn bài khác</span>
            </button>
          ) : currentMode === 'video_clash' ? (
            <div className="flex items-center gap-1.5 font-handwriting text-xs">
              <span className="text-[#8A7D6F]">Chọn bài video:</span>
              {VIDEO_LESSON_LIBRARY.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSwitchVideoLesson(v)}
                  type="button"
                  className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
                    currentVideoLesson.id === v.id
                      ? 'bg-[#4E9B87] text-white font-bold border-[#3A7564]'
                      : 'bg-white/80 text-[#5C4F42] border-[#DFD6C4] hover:bg-white'
                  }`}
                >
                  {v.id}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* The Open Sketchbook Spine & Dual Sheets Container */}
        <div className="relative bg-[#FAF6EE] p-3 sm:p-5 lg:p-6 rounded-md sketchbook-shadow border-2 sm:border-4 border-[#E0D7C6]">
          {/* Decorative Corner Washi Tapes */}
          <WashiTape variant="blue" className="absolute -top-3 left-12 w-28 -rotate-2 z-10" />
          <WashiTape variant="pink" className="absolute -top-3 right-16 w-24 rotate-3 z-10" />
          <WashiTape variant="yellow" className="absolute -bottom-3 right-20 w-24 -rotate-1 z-10" />
          <WashiTape variant="green" className="absolute -bottom-3 left-16 w-20 rotate-2 z-10" />

          {/* ========================================================================= */}
          {/* MODE 1: WORKSHEET (DRE Classic) */}
          {/* ========================================================================= */}
          {currentMode === 'worksheet' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
              <div className="lg:col-span-7">
                <WorkingObjectSheet
                  lesson={currentLesson}
                  currentState={currentState}
                  selectedStep={selectedStep}
                  onSelectStep={handleSelectStep}
                  boSpeechOverride={boSpeechOverride}
                />
              </div>

              <div className="lg:col-span-5">
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
                    setExplanationText(prev => prev || currentLesson.nudgeStarter);
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

          {/* ========================================================================= */}
          {/* MODE 2: VIDEO CHECKPOINT & PEER CLASH (The Requested Feature) */}
          {/* ========================================================================= */}
          {currentMode === 'video_clash' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
              <div className="lg:col-span-7">
                <VideoPlayerSheet
                  lesson={currentVideoLesson}
                  phase={videoPhase}
                  currentTime={videoCurrentTime}
                  isPlaying={isVideoPlaying}
                  onTogglePlay={handleToggleVideoPlay}
                  onSeek={handleSeekVideo}
                  onTriggerFreeze={handleTriggerFreeze}
                  onJumpToCheckpoint={handleJumpToCheckpoint}
                  onSwitchVideoLesson={handleSwitchVideoLesson}
                />
              </div>

              <div className="lg:col-span-5">
                <VideoDebateSheet
                  lesson={currentVideoLesson}
                  phase={videoPhase}
                  isBackendLive={isBackendLive}
                  isLoadingAi={isLoadingAi}
                  liveBoDialogue={liveBoDialogue}
                  liveCoLamDialogue={liveCoLamDialogue}
                  liveHintDialogue={liveHintDialogue}
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

          {/* ========================================================================= */}
          {/* MODE 3 & 4: ALTERNATIVE FLOWS (POE & Protégé) */}
          {/* ========================================================================= */}
          {(currentMode === 'predict_poe' || currentMode === 'protege_teaching') && (
            <AlternativeFlowsSheet
              mode={currentMode}
              onSwitchMode={(mode) => setCurrentMode(mode)}
              onPoeTopicChange={(topic) => setCurrentPoeTopic(topic)}
            />
          )}
        </div>
      </main>

      {/* Tactile Footer */}
      <footer className="w-full border-t border-[#DFD6C4] bg-[#FAF6EE]/75 py-3 text-center text-xs text-[#8A7D6F] font-handwriting">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <SparkleIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
          <span>
            {currentMode === 'worksheet' && 'Sổ tay học Toán DRE · Cơ chế Tự giải thích & Bắt lỗi bạn học'}
            {currentMode === 'video_clash' && 'Video Bài Giảng Tương Tác · Bo Nghi Vấn Đấu Đá & Phản Biện Socratic'}
            {currentMode === 'predict_poe' && 'Predict-Observe-Explain (POE) · Dự đoán trước khi hé lộ kết quả'}
            {currentMode === 'protege_teaching' && 'Protégé Effect · Học viên đóng vai gia sư giảng lại cho Bo'}
          </span>
          <SparkleIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
        </div>
      </footer>

      {/* Modals & Drawers */}
      <MultiAgentInspectorModal
        isOpen={isAiInspectorOpen}
        onClose={() => setIsAiInspectorOpen(false)}
        isBackendLive={isBackendLive}
        lastSessionId={backendSessionId}
        lastBoSpeech={liveBoDialogue || boSpeechOverride}
        lastCoLamSpeech={Array.isArray(liveCoLamDialogue) ? liveCoLamDialogue.join(' ') : (liveCoLamDialogue || tutorFeedbackOverride)}
        currentMode={currentMode}
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
        currentLesson={currentLesson}
        onSelectLesson={handleSwitchLesson}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        selectedLevel={selectedLevel}
        onSelectLevel={(lvl) => {
          setSelectedLevel(lvl);
          const matching = MISCONCEPTION_LIBRARY.filter(l => l.level === lvl);
          const randomLesson = matching[Math.floor(Math.random() * matching.length)] || matching[0];
          handleSwitchLesson(randomLesson);
        }}
        onStart={() => {
          setIsOnboardingOpen(false);
          setCurrentState('IDLE');
        }}
      />
    </div>
  );
}
