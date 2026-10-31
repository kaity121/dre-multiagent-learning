import type { DRELessonSchema, LessonPart, PauseQuestion } from '../../types/lesson';

/**
 * The council emits its draft in the backend lesson contract (part_id, concept, start_s/end_s, at_s).
 * The timeline editor works on the frontend lesson shape (id, title, duration, timestamp).
 * Lessons already in the editor shape pass through unchanged.
 */
export function draftToEditorLesson(raw: any): DRELessonSchema {
  const parts: any[] = Array.isArray(raw?.parts) ? raw.parts : [];
  if (parts.every((p) => typeof p?.id === 'string' && typeof p?.title === 'string')) return raw as DRELessonSchema;

  const editorParts: LessonPart[] = parts.map((p, i) => {
    const start = Number(p?.start_s) || 0;
    const end = Number(p?.end_s) || start;
    const bloom = p?.goals?.[0]?.bloom_target || 'Analyze';
    const questions: PauseQuestion[] = (p?.pause_questions || []).map((q: any, j: number) => ({
      id: q?.question_id || `${p?.part_id || `part_${i + 1}`}_q${j + 1}`,
      timestamp: Number(q?.at_s) || start,
      question: q?.question || '',
      bloom_level: bloom,
      expected_answers: (q?.options || []).filter((o: any) => o?.is_correct).map((o: any) => o?.text || ''),
      is_active: true,
      type: 'active',
    }));
    return {
      id: p?.part_id || `part_${i + 1}`,
      title: `Phần ${i + 1}: ${p?.concept || 'Chưa đặt tên'}`,
      duration: Math.max(0, end - start),
      video_url: raw?.video_url || '',
      pause_questions: questions,
      scenarios: [],
    };
  });

  return {
    lesson_id: raw?.lesson_id || 'lesson_draft',
    title: raw?.title || 'Bài học nháp',
    status: 'draft',
    parts: editorParts,
    metadata: { source: 'roundtable', subject: raw?.subject, video_duration_s: raw?.video_duration_s },
  };
}
