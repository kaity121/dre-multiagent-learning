import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classroomCommentsFor } from './lessonAdapter';

const approved = {
  lesson_id: 'lesson_dre_vector_12',
  parts: [
    {
      scenarios: [
        { id: 'sc-04', timestamp: 2240, agent: 'Bo', dialogue: 'Tớ cứ tưởng 1 + 1 = 2 luôn!', is_active: true },
        { id: 'sc-off', timestamp: 100, agent: 'Trí', dialogue: 'Tắt', is_active: false },
      ],
      pause_questions: [{ id: 'pq-02', timestamp: 2233, question: 'Câu hỏi dừng' }],
    },
  ],
};

test('an approved lesson keeps the played lecture\'s class chat plus its own active scenarios', () => {
  const comments = classroomCommentsFor(approved);
  const ids = comments.map((c) => c.id);
  assert.ok(ids.includes('c_18'), "Trí's 37:05 check from the lecture is present");
  assert.ok(comments.find((c) => c.id === 'c_18')?.citations?.length, 'its citations survive, so it gets an evidence chip');
  assert.ok(ids.includes('sc-04'));
  assert.ok(!ids.includes('sc-off'), 'inactive scenarios are left out');
  assert.ok(!ids.includes('pq-02'), 'pause questions are not chat messages');
  assert.deepEqual(comments.map((c) => c.second), [...comments.map((c) => c.second)].sort((a, b) => a - b));
});
