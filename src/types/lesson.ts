export interface PauseQuestion {
  id: string;
  timestamp: number;
  question: string;
  bloom_level: string;
  expected_answers: string[];
  is_active: boolean;
  type: 'active' | 'passive';
}

export interface ScenarioItem {
  id: string;
  timestamp: number;
  agent: string;
  trigger_condition: string;
  dialogue: string;
  bloom_level: string;
  is_active: boolean;
  type: 'active' | 'passive';
}

export interface LessonPart {
  id: string;
  title: string;
  duration: number;
  video_url: string;
  pause_questions?: PauseQuestion[];
  scenarios?: ScenarioItem[];
}

export interface DRELessonSchema {
  lesson_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'approved' | 'archived';
  parts: LessonPart[];
  metadata?: Record<string, unknown>;
}

export interface VideoLessonItem {
  id: string;
  title: string;
  url: string;
  duration: number;
  parts: {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    url: string;
  }[];
}

export interface TimelineComment {
  id: string;
  partId: string;
  timestamp: number;
  author: string;
  content: string;
  bloomLevel?: string;
  type: 'active' | 'passive' | 'question' | 'scenario';
  isActive: boolean;
  metadata?: Record<string, unknown>;
}
