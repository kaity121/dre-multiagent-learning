import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftToEditorLesson } from './draftToEditorLesson';

const councilDraft = {
  lesson_id: 'lesson_clip_draft',
  status: 'draft',
  title: 'clip',
  video_url: '',
  parts: [
    {
      part_id: 'part_1',
      start_s: 0,
      end_s: 60,
      concept: 'Bẫy cộng độ dài',
      goals: [{ bloom_target: 'Evaluate' }],
      pause_questions: [
        {
          question_id: 'p1_q_checkpoint',
          at_s: 15,
          question: "|BC + DD'| bằng bao nhiêu?",
          options: [
            { option_id: 'a', text: '√2', is_correct: true },
            { option_id: 'b', text: '2', is_correct: false },
          ],
        },
      ],
    },
  ],
};

test('a council draft becomes an editor lesson with titled, timed parts', () => {
  const lesson = draftToEditorLesson(councilDraft);
  assert.equal(lesson.parts[0].id, 'part_1');
  assert.equal(lesson.parts[0].title, 'Phần 1: Bẫy cộng độ dài');
  assert.equal(lesson.parts[0].duration, 60);
  assert.deepEqual(
    lesson.parts[0].pause_questions?.map((q) => [q.id, q.timestamp, q.bloom_level, q.expected_answers]),
    [['p1_q_checkpoint', 15, 'Evaluate', ['√2']]],
  );
});

test('a lesson already in the editor shape passes through unchanged', () => {
  const editorLesson = { lesson_id: 'x', title: 't', status: 'draft', parts: [{ id: 'p', title: 'Phần 1', duration: 5, video_url: '' }] };
  assert.equal(draftToEditorLesson(editorLesson), editorLesson);
});
