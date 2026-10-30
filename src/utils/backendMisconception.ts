// The one place that maps a video lesson to the backend misconception its checkpoint session uses
// (GET /api/misconceptions lists the ids the backend knows). The vector lecture's pause question at
// 37:13 (|BC + DD'| in a unit cube) has its own entry; MISC_VECTO_12 is the Station 2 problem.
const VECTOR_CHECKPOINT_ID = 'MISC_VECTO_12_CP3713';
const VECTOR_LESSON_IDS = new Set(['VID_VECTO_12', 'VID_VECTO_12_TIEN', 'lesson_dre_vector_12', 'math_12_vecto_01', 'lesson_vecto_12']);

const BY_LESSON_ID: Record<string, string> = {
  VID_002: 'MISC_002',
  VID_003: 'MISC_008',
};

export function backendMisconceptionId(lesson: { id: string; title?: string; topic?: string; subject?: string }): string {
  if (VECTOR_LESSON_IDS.has(lesson.id)) return VECTOR_CHECKPOINT_ID;
  if (BY_LESSON_ID[lesson.id]) return BY_LESSON_ID[lesson.id];
  // Approved lessons arrive with editor-generated ids; recognise the vector lesson by its own wording.
  if (/vect/i.test(`${lesson.title ?? ''} ${lesson.topic ?? ''} ${lesson.subject ?? ''}`)) return VECTOR_CHECKPOINT_ID;
  return 'MISC_001';
}
