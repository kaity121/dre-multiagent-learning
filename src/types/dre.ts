// File: src/types/dre.ts

export type DREState = 
  | 'ONBOARDING'
  | 'IDLE'
  | 'MARKED'
  | 'EXPLAIN_PROMPT'
  | 'BO_CHALLENGE'
  | 'AWAITING_REBUTTAL'
  | 'CLOSE'
  | 'PROBE'
  | 'HINT'
  | 'TUTOR_NUDGE';

export type LearnerLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningMode = 'video_clash' | 'worksheet' | 'predict_poe' | 'protege_teaching';

export type VideoCheckpointPhase = 
  | 'WATCHING'
  | 'CHECKPOINT_REACHED'
  | 'BO_DEBATE'
  | 'BO_CONCEDED'
  | 'CO_LAM_CLOSURE'
  | 'STUDENT_FREEZE';

export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';

export interface SolutionStep {
  stepNumber: number;
  content: string;
}

export interface MisconceptionItem {
  id: string;
  topic: string;
  level: LearnerLevel;
  levelLabel: string;
  workingObject: {
    title: string;
    steps: SolutionStep[];
  };
  errorStepIndex: number;
  errorType: string;
  errorDescription: string;
  standardExplanation: string;
  hintLevel1: string;
  hintLevel2?: string;
  nudgeStarter?: string;
  keywords: string[];
  // Bổ sung Cheat Sheet của Linh Chi cho Trạm 2
  linhChiCheatSheet?: {
    title: string;
    rules: string[];
    commonTrap: string;
  };
}

export interface EvaluationResult {
  isCorrectStep: boolean;
  explanationQuality: 'thorough' | 'partial' | 'off-track' | 'empty';
  feedbackTutor: string;
  reactionBo?: string;
}

export interface VideoChapter {
  id: string;
  title: string;
  startSecond: number;
  hasCheckpoint?: boolean;
  formulaPreview?: string;
}

export interface TranscriptCue {
  id: string;
  start: number;
  end: number;
  speaker?: 'Cô Lam' | 'Thầy Tiến' | 'Bo' | 'Bảng Phấn' | string;
  text: string;
  formula?: string;
  tag?: 'formula' | 'trap' | 'checkpoint' | 'rule';
  // Bổ sung cho tính năng "Khoan đã cô ơi!" theo từng giây (OpenMAIC Director)
  minhKhangAnalogy?: string;
  linhChiNote?: string;
}

export interface RebuttalSticker {
  id: string;
  text: string;
  isEffective: boolean;
  bloomLevel?: BloomLevel;
  feedback: string;
}

export interface TimelineComment {
  id: string;
  second: number;
  author: string;
  role: 'classmate' | 'ta' | 'teacher';
  text: string;
  isPinned?: boolean;
  toolCall?: {
    toolName: string;
    label: string;
    badgeText: string;
    category?: 'rag' | 'math_verify' | 'math_calc' | 'grounding' | 'bloom' | 'timeline';
    isValid?: boolean | null;
    correct?: string;
  } | null;
  toolCalls?: Array<{
    toolName: string;
    label: string;
    badgeText: string;
    category?: 'rag' | 'math_verify' | 'math_calc' | 'grounding' | 'bloom' | 'timeline';
    isValid?: boolean | null;
    correct?: string;
  }> | null;
  replyTo?: {
    id?: string;
    author: string;
    text?: string;
  } | null;
  citations?: Array<{
    source: 'video' | 'blackboard' | 'sgk' | 'slide';
    label: string;
    snippet?: string;
    timestamp?: number;
    partId?: string;
  }> | null;
  contextSnapshot?: any | null;
}

export interface PeerContextData {
  bo: {
    hotTake: string;
    quickPrompts: string[];
    defaultReply: string;
  };
  tri: {
    edgeCaseNote: string;
    quickPrompts: string[];
    defaultReply: string;
  };
  linhchi: {
    cheatSheetTitle: string;
    cheatSheetBullets: string[];
    quickPrompts: string[];
    defaultReply: string;
  };
  minhkhang: {
    analogyTitle: string;
    analogyContent: string;
    quickPrompts: string[];
    defaultReply: string;
  };
}

export interface VideoLessonItem {
  id: string;
  title: string;
  subject?: string;
  topic?: string;
  duration: number;
  durationSeconds?: number;
  checkpointTimestamp: number;
  lectureEndSecond?: number; // Mốc giây kết thúc bài học để chuyển trạm (cấu hình trong JSON/data)
  videoUrl?: string;
  youtubeId?: string;
  blackboardTitle?: string;
  lectureNotes?: string[];
  // Phân cảnh & Bản chép lời từng giây kiểu YouTube/Coursera
  chapters?: VideoChapter[];
  transcriptCues?: TranscriptCue[];
  // Dữ liệu Sổ tay & Chat riêng đồng bộ theo đúng bài học cho 4 bạn
  peerContext?: PeerContextData;
  checkpointQuestion: {
    prompt: string;
    options: {
      id: string;
      label: string;
      isStandardBest: boolean;
      feedback: string;
      remediationSecond?: number;
    }[];
  };
  boArgument: {
    speech: string;
    shortcutClaim?: string;
    fallacyType?: string;
  };
  rebuttalStickers: RebuttalSticker[];
  boConcession: {
    speech: string;
    realizationNote?: string;
  };
  teacherClosure: {
    speech?: string;
    goldenRule: string;
  };
  freezeNote: string;
  timelineComments?: TimelineComment[];
}

// Lưu trữ ngầm dữ liệu Bloom & Action Layer (Zero Pressure trong lúc học)
export interface SilentLearningRecord {
  id: string;
  timestamp: string;
  station: LearningMode;
  actionName: 'create_learning_record' | 'update_mastery_state' | 'create_review_task';
  bloomLevel: BloomLevel;
  status: 'mastered' | 'consolidated' | 'attempted' | 'skipped_not_mastered';
  detail: string;
}
