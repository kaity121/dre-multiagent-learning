/**
 * DRE (Diagnose -> Repair -> Explain) Architecture Types
 */

export type DREState = 
  | 'ONBOARDING'
  | 'IDLE'
  | 'MARKED'
  | 'EXPLAIN_PROMPT'
  | 'BO_CHALLENGE'        // Bo tung lập luận thách thức / ngụy biện trực giác
  | 'AWAITING_REBUTTAL'    // Chờ học viên gõ phản biện đáp trả Bo
  | 'CLOSE'
  | 'PROBE'
  | 'HINT'
  | 'TUTOR_NUDGE';

export type LearningMode = 
  | 'worksheet'        // Sổ tay bắt lỗi 3 bước (DRE Classic)
  | 'video_clash'      // Video bài giảng & Bo nghi vấn phản biện
  | 'predict_poe'      // Dự đoán kết quả (Predict - Observe - Explain)
  | 'protege_teaching'; // Học viên làm gia sư giảng lại cho Bo

export type VideoCheckpointPhase = 
  | 'WATCHING'             // Video đang phát
  | 'CHECKPOINT_REACHED'   // Dừng lại suy ngẫm, hiện câu hỏi
  | 'BO_DEBATE'            // Bo nghi vấn, đấu đá bẫy trực giác
  | 'BO_CONCEDED'          // Bo nhận ra sơ hở, gãi đầu chịu thua
  | 'CO_LAM_CLOSURE'       // Cô Lam làm trọng tài chốt kiến thức chuẩn
  | 'STUDENT_FREEZE';      // Học viên bấm "Khoan đã cô ơi!"

export type LearnerLevel = 'beginner' | 'intermediate' | 'advanced';

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
  errorStepIndex: number; // 1-indexed (e.g. 2 or 3)
  errorType: string;
  errorDescription: string;
  standardExplanation: string;
  hintLevel1: string;
  hintLevel2?: string;
  keywords: string[];
  nudgeStarter: string;
}

export interface EvaluationResult {
  isCorrectStep: boolean;
  explanationQuality: 'thorough' | 'partial' | 'off-track' | 'empty';
  feedbackTutor: string;
  reactionBo?: string;
}

export interface RebuttalSticker {
  id: string;
  text: string;
  isEffective: boolean;
  feedback: string;
}

export interface VideoLessonItem {
  id: string;
  title: string;
  subject: string;
  duration: number; // seconds
  checkpointTimestamp: number; // seconds where video pauses
  videoUrl?: string; // Optional YouTube / MP4 video link
  blackboardTitle: string;
  lectureNotes: string[];
  checkpointQuestion: {
    prompt: string;
    options: {
      id: string;
      label: string;
      isStandardBest: boolean;
      feedback: string;
    }[];
  };
  boArgument: {
    speech: string;
    shortcutClaim: string;
    fallacyType: string;
  };
  rebuttalStickers: RebuttalSticker[];
  boConcession: {
    speech: string;
    realizationNote: string;
  };
  teacherClosure: {
    speech: string;
    goldenRule: string;
  };
  freezeNote: string;
}

