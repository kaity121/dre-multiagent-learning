import { DRELessonSchema, VideoLessonItem, TimelineComment } from '../types/lesson';
import { sanitizeFixtureData } from './sanitizeKatex';

export interface AdaptedLessonResult {
  videoLesson: VideoLessonItem;
  timelineComments: TimelineComment[];
}

export function adaptLessonToPlayer(rawLesson: DRELessonSchema): VideoLessonItem {
  const lesson = sanitizeFixtureData(rawLesson);
  let cumulativeTime = 0;

  const parts = lesson.parts.map((part) => {
    const startTime = cumulativeTime;
    const endTime = cumulativeTime + (part.duration || 0);
    cumulativeTime = endTime;

    return {
      id: part.id,
      title: part.title,
      startTime,
      endTime,
      url: part.video_url || '',
    };
  });

  return {
    id: lesson.lesson_id,
    title: lesson.title,
    url: parts[0]?.url || '',
    duration: cumulativeTime,
    parts,
  };
}

export function adaptLessonToTimelineComments(rawLesson: DRELessonSchema): TimelineComment[] {
  const lesson = sanitizeFixtureData(rawLesson);
  const comments: TimelineComment[] = [];
  let cumulativeTime = 0;

  lesson.parts.forEach((part) => {
    const partOffset = cumulativeTime;

    if (part.pause_questions && Array.isArray(part.pause_questions)) {
      part.pause_questions.forEach((q) => {
        comments.push({
          id: q.id,
          partId: part.id,
          timestamp: partOffset + q.timestamp,
          author: 'Trợ giảng AI',
          content: q.question,
          bloomLevel: q.bloom_level,
          type: 'question',
          isActive: q.is_active ?? true,
          metadata: {
            expected_answers: q.expected_answers,
            originalType: q.type,
            localTimestamp: q.timestamp,
          },
        });
      });
    }

    if (part.scenarios && Array.isArray(part.scenarios)) {
      part.scenarios.forEach((s) => {
        comments.push({
          id: s.id,
          partId: part.id,
          timestamp: partOffset + s.timestamp,
          author: s.agent || 'Hệ thống',
          content: s.dialogue,
          bloomLevel: s.bloom_level,
          type: 'scenario',
          isActive: s.is_active ?? true,
          metadata: {
            trigger_condition: s.trigger_condition,
            originalType: s.type,
            localTimestamp: s.timestamp,
          },
        });
      });
    }

    cumulativeTime += part.duration || 0;
  });

  return comments.sort((a, b) => a.timestamp - b.timestamp);
}

export function adaptLesson(rawLesson: DRELessonSchema): AdaptedLessonResult {
  return {
    videoLesson: adaptLessonToPlayer(rawLesson),
    timelineComments: adaptLessonToTimelineComments(rawLesson),
  };
}

export function exportApprovedLessonJSON(lesson: DRELessonSchema): string {
  const payload: DRELessonSchema = {
    ...lesson,
    status: 'approved',
    metadata: {
      ...lesson.metadata,
      approvedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
  return JSON.stringify(payload, null, 2);
}
