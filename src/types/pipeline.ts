// File: src/types/pipeline.ts
/**
 * ============================================================================
 * AISDLC Pipeline Contracts & Data Exchange Interfaces
 * DRE Multi-Agent Interactive Learning
 * ============================================================================
 * Defines shared interfaces between:
 * 1. Multimodal Video Ingestion (Blu @blu1606)
 * 2. Pedagogical RAG & Knowledge Base (Hiếu @aprlx21 & An @presentisperfect)
 * 3. Tool-Augmented Multi-Agent Scriptwriter (Hiếu @aprlx21)
 * 4. Runtime Intent Dispatcher & Context Isolation (An @presentisperfect)
 * 5. Teacher Studio UI & Observability Console (Khuê @kaity121)
 */

// ----------------------------------------------------------------------------
// 1. Multimodal Ingestion & Cognitive Event Stream (CES)
// ----------------------------------------------------------------------------
export type TrapRiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface VisualGeometryContext {
  shapeType: 'cube' | 'cuboid' | 'tetrahedron' | 'plane' | 'general_3d';
  vertices: string[];
  highlightedVectors: string[];
  actionDescription: string;
}

export interface CognitiveTimelineSegment {
  id: string;
  second: number;
  timeFormatted: string; // e.g. "37:13"
  audioTranscript: string;
  speaker: string;
  blackboardText: string;
  blackboardLatex: string[];
  spatialGeometry?: VisualGeometryContext;
  trapRiskLevel: TrapRiskLevel;
  pedagogicalTags: string[];
}

export interface CognitiveEventStream {
  videoId: string;
  videoTitle: string;
  teacherName: string;
  subject: string;
  durationSeconds: number;
  segments: CognitiveTimelineSegment[];
}

// ----------------------------------------------------------------------------
// 2. Pedagogical RAG & Knowledge Base
// ----------------------------------------------------------------------------
export interface PedagogicalRAGItem {
  id: string;
  topic: string;
  grade: number;
  standardFormula: string;
  theoremSummary: string;
  misconceptionId: string;
  misconceptionName: string;
  misconceptionFrequency: number;
  boTrapPattern: string;
  rebuttalAnchor: string;
  scaffoldingNudges: string[];
}

// ----------------------------------------------------------------------------
// 3. Deterministic Tools & Multi-Agent Reasoning Stream
// ----------------------------------------------------------------------------
export type AgentRole = 'bo' | 'tri' | 'linhchi' | 'minhkhang' | 'an' | 'colam' | 'assessor';

export type ReasoningEventType = 
  | 'thought'
  | 'tool_call'
  | 'tool_result'
  | 'debate_turn'
  | 'cross_check_verdict'
  | 'checkpoint_created';

export interface DeterministicToolCall {
  toolName: 
    | 'tool_verify_vector_algebra' 
    | 'tool_query_misconception_kb' 
    | 'tool_timeline_collision_checker' 
    | 'tool_evaluate_bloom_level';
  input: Record<string, any>;
  output: Record<string, any>;
  isValid: boolean;
  timestampMs: number;
}

export interface AgentReasoningEvent {
  id: string;
  eventType: ReasoningEventType;
  agentId: AgentRole;
  agentDisplayName: string;
  secondTarget?: number;
  content: string;
  toolCall?: DeterministicToolCall;
  timestamp: string;
}

// ----------------------------------------------------------------------------
// 4. Approved Lesson Script Package (Produced by Scriptwriter & Approved by Teacher)
// ----------------------------------------------------------------------------
export interface CheckpointQuestionOption {
  id: string;
  label: string;
  isCorrect: boolean;
  misconceptionLinked?: string;
  feedbackNote: string;
}

export interface ScriptCheckpointItem {
  id: string;
  second: number;
  title: string;
  questionText: string;
  blackboardFormula: string;
  options: CheckpointQuestionOption[];
  boInitialChallenge: string;
  linhChiCheatSheetSnippet?: {
    ruleTitle: string;
    rules: string[];
    mnemonicTrap: string;
  };
}

export interface ScriptTimelineCommentItem {
  id: string;
  second: number;
  author: string;
  role: 'classmate' | 'ta' | 'teacher';
  avatarId: AgentRole;
  text: string;
  isPinned?: boolean;
}

export interface ApprovedLessonPackage {
  lessonId: string;
  title: string;
  videoUrl: string;
  durationSeconds: number;
  checkpoints: ScriptCheckpointItem[];
  timelineComments: ScriptTimelineCommentItem[];
  pedagogicalSummary: {
    totalTrapsIdentified: number;
    bloomMasteryTarget: string;
    approvedByTeacher: boolean;
    approvalTimestamp?: string;
  };
}

// ----------------------------------------------------------------------------
// 5. Runtime Pedagogical Dispatcher & Context Isolation
// ----------------------------------------------------------------------------
export type LearnerIntentType = 
  | 'ask_formula_mnemonic'
  | 'ask_deep_concept'
  | 'challenge_shortcut_fallacy'
  | 'ask_scaffolding_help'
  | 'sharp_rebuttal'
  | 'general_classroom_chitchat';

export interface IntentRoutingVerdict {
  detectedIntent: LearnerIntentType;
  dispatchedAgent: AgentRole;
  confidence: number;
  reasoning: string;
}

export interface AgentCitation {
  label: string;
  timestamp: number;
  timeFormatted: string;
  source: 'video' | 'blackboard' | 'sgk' | 'slide';
  quote?: string;
  url?: string;
}

export interface AgentRuntimeContext {
  persona: {
    agentId: AgentRole;
    systemPrompt: string;
    speechStyle: string;
  };
  temporalContext: {
    second: number;
    blackboardLatex: string;
    teacherSpeechNow: string;
    spatialGeometry?: VisualGeometryContext;
  };
  dialogueHistory: {
    speaker: string;
    text: string;
  }[];
  ragContextSnippets: string[];
  learnerCognitiveState: {
    hesitationLevel: 'low' | 'medium' | 'high';
    currentBloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
    activeMisconceptionId?: string;
  };
}
