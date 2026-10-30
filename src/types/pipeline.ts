// File: src/types/pipeline.ts
/**
 * ============================================================================
 * AISDLC Pipeline Contracts & Data Exchange Interfaces
 * DRE Multi-Agent Interactive Learning
 * ============================================================================
 * Harmonizes:
 * 1. Multimodal Video Ingestion (Blu @blu1606)
 * 2. Issue #3 Proposal by Hiếu (@aprlx21): lesson.json & session_<id>.json
 * 3. Pedagogical RAG & Deterministic Tools (Hiếu @aprlx21 & An @presentisperfect)
 * 4. Runtime Intent Dispatcher & Context Isolation (An @presentisperfect)
 * 5. Teacher Studio UI & Observability Console (Khuê @kaity121)
 *
 * Producer → consumer map (issue numbers on kaity121/dre-multiagent-learning):
 *   CognitiveEventStream  : #5 live clip, #6 pre-indexed lesson → #9 #12 #15
 *   PedagogicalRAGItem    : #7 knowledge base                 → #8 #9 #12
 *   AgentReasoningEvent[] : #9 roundtable, #10 stream         → #14 War Room, #16 Inspector
 *   DRELessonSchema       : #9 (draft) → #15 (approved)       → classroom runtime #11 #12
 *   IntentRoutingVerdict  : #11 dispatcher                    → #16
 *   AgentRuntimeContext   : #12 context snapshot              → runtime agents
 *   DRESessionSchema      : #13 evaluator                     → #16, end-of-class summary
 *
 * Fixtures for every contract live in mock/ and are checked by `npm run validate:fixtures`.
 */

// ----------------------------------------------------------------------------
// 1. Multimodal Ingestion & Cognitive Event Stream (CES)
// ----------------------------------------------------------------------------
export type TrapRiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface VisualGeometryContext {
  /** `diagram` covers non-geometry visuals on slides (flowcharts, plots, cell diagrams). */
  shapeType: 'cube' | 'cuboid' | 'tetrahedron' | 'plane' | 'general_3d' | 'diagram';
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
  /** Short description of a diagram, chart, process or code shown on the board/slide. */
  diagramDescription?: string;
  trapRiskLevel: TrapRiskLevel;
  pedagogicalTags: string[];
}

export interface CognitiveEventStream {
  videoId: string;
  videoTitle: string;
  teacherName: string;
  subject: string;
  durationSeconds: number;
  /** Set when the stream covers a cut of a longer video; segment seconds stay relative to the clip. */
  sourceClip?: {
    parentVideoId: string;
    startSecond: number;
    endSecond: number;
  };
  /** How the stream was produced: live extraction (#5) or pre-indexed / hand-authored (#6). */
  processedBy?: {
    mode: 'live' | 'pre_indexed' | 'authored';
    sttModel?: string;
    visionModel?: string;
    processingLatencyMs?: number;
    /** Set when live extraction failed and the authored fixture was served instead. */
    fallbackReason?: string;
  };
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
    | 'tool_evaluate_bloom_level'
    | 'tool_calculate_dot_product';
  input: Record<string, any>;
  output: Record<string, any>;
  /** null = the tool could not judge the input (e.g. unparseable claim), not that it is wrong. */
  isValid: boolean | null;
  timestampMs: number;
}

export interface AgentReasoningEvent {
  id: string;
  runId?: string;
  eventType: ReasoningEventType;
  agentId: AgentRole;
  agentDisplayName: string;
  secondTarget?: number;
  content: string;
  toolCall?: DeterministicToolCall;
  timestamp: string;
}

// ----------------------------------------------------------------------------
// 4. Runtime Pedagogical Dispatcher & Context Isolation
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
  snippet?: string;
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
  citations?: AgentCitation[];
  metadata?: Record<string, any>;
}

// ----------------------------------------------------------------------------
// 5. Harmonized DRE Lesson Specification (Issue #3 lesson.json Extensions)
// ----------------------------------------------------------------------------
export type LessonSourceType = 'transcript' | 'slide' | 'blackboard' | 'geometry_3d';

export interface LessonSourceItem {
  source_id: string;
  type: LessonSourceType;
  start_s: number;
  end_s: number;
  content: string;
  latex?: string[];
  geometry_meta?: VisualGeometryContext;
}

export interface LessonLearningGoal {
  goal_id: string;
  description: string;
  bloom_target?: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
}

export interface PauseQuestionOption {
  option_id: string;
  text: string;
  is_correct?: boolean;
  misconception_linked?: string;
}

export interface PauseQuestion {
  question_id: string;
  at_s: number;
  purpose: 'review_previous_lesson' | 'checkpoint_misconception_test' | 'concept_check';
  previous_lesson_id?: string;
  question_type: 'multiple_choice' | 'boolean' | 'sticker_pick';
  question: string;
  blackboard_formula?: string;
  options: PauseQuestionOption[];
  correct_option_ids: string[];
  explanation: string;
  max_attempts: number;
  allow_skip: boolean;
  on_correct: 'confirm_and_resume' | 'trigger_bo_challenge' | 'advance_station';
  on_incorrect: 'show_explanation_and_resume' | 'trigger_bo_ally_trap' | 'offer_scaffolding';
  on_skip: 'resume' | 'flag_unmastered';
  misconception_id?: string;
}

export interface InteractiveScenario {
  scenario_id: string;
  at_s: number;
  actor_id: AgentRole;
  /** passive_comment never pauses the video; the others address the learner directly. */
  interaction_type: 'passive_comment' | 'ask_learner' | 'debate_challenge' | 'bo_trap_bait' | 'scaffold_hint';
  bloom_level?: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  /** Teacher toggle from the review timeline (#15); omitted means enabled. */
  enabled?: boolean;
  question: string;
  expected_points: string[];
  misconception_target?: string;
  bo_fallacy_statement?: string;
  linhchi_cheat_sheet_ref?: string;
  pause_video: boolean;
  wait_timeout_s: number;
  on_correct: 'confirm_and_resume' | 'bo_concedes' | 'advance_to_station_2';
  on_incorrect: 'hint_then_explain_and_resume' | 'deepen_bo_challenge' | 'open_cheat_sheet';
  on_timeout: 'offer_hint_or_skip' | 'ta_nudge_resume';
}

export interface LessonPart {
  part_id: string;
  start_s: number;
  end_s: number;
  concept: string;
  context: string;
  goals: LessonLearningGoal[];
  source_refs: string[];
  pause_questions: PauseQuestion[];
  scenarios: InteractiveScenario[];
}

export interface DRELessonSchema {
  lesson_id: string;
  version: string;
  status: 'draft' | 'under_review' | 'approved';
  title: string;
  subject: string;
  video_url: string;
  video_duration_s: number;
  sources: LessonSourceItem[];
  parts: LessonPart[];
}

// ----------------------------------------------------------------------------
// 6. Harmonized DRE Session Specification (Issue #3 session_<id>.json Extensions)
// ----------------------------------------------------------------------------
export type ActivityEventType = 
  | 'pause_question_shown'
  | 'pause_question_answer'
  | 'scenario_triggered'
  | 'learner_answer'
  | 'feedback_shown'
  | 'bo_challenge_initiated'
  | 'bo_conceded'
  | 'linhchi_cheat_sheet_opened'
  | 'tutor_nudge_offered'
  | 'poe_prediction_submitted'
  | 'poe_explanation_submitted'
  | 'protege_teaching_turn'
  | 'bloom_certified';

export interface ActivityLogEvent {
  event_id: string;
  type: ActivityEventType;
  question_id?: string;
  scenario_id?: string;
  part_id: string;
  video_time_s: number;
  attempt?: number;
  selected_option_ids?: string[];
  answer?: string;
  evaluation?: 'correct' | 'partial' | 'incorrect' | 'sharp_rebuttal' | 'unclear';
  matched_points?: string[];
  missing_points?: string[];
  feedback?: string;
  bloom_level_demonstrated?: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  hesitation_seconds?: number;
  agent_actor?: AgentRole;
}

export interface SessionAssessmentGoal {
  goal_id: string;
  /** A correct choice without an explanation is only 'attempted', never 'mastered'. */
  result: 'mastered' | 'developing' | 'attempted' | 'not_started';
  bloom_level?: string;
  evidence_event_ids: string[];
  comment: string;
}

export interface SessionPartReview {
  part_id: string;
  concept: string;
  overall_result: 'mastered' | 'developing' | 'needs_attention';
  summary: string;
  strengths: string[];
  needs_review: string[];
  suggested_follow_up: string;
  evidence_event_ids: string[];
}

export interface DRESessionSchema {
  session_id: string;
  learner_id: string;
  lesson_id: string;
  lesson_version: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  video_time_s: number;
  station_progress: 'station_1_video' | 'station_2_dre' | 'station_3_poe' | 'station_4_protege';
  activity_log: ActivityLogEvent[];
  memory: {
    summary: string;
    open_questions: string[];
    misconceptions_triggered: string[];
    rebuttal_mastery_rate: number;
  };
  assessment: {
    prerequisite_review?: {
      question_id: string;
      result: 'correct' | 'incorrect';
      evidence_event_ids: string[];
      comment: string;
    };
    goals: SessionAssessmentGoal[];
  };
  part_reviews: SessionPartReview[];
  overall_review: {
    result: 'mastered' | 'developing' | 'needs_review';
    bloom_certified_level?: string;
    hesitation_index_score?: number;
    summary: string;
    reviewed_part_ids: string[];
  };
}
