// Run: npx tsx --test src/components/journey/journeyModel.test.ts src/components/agentmap/agentMapModel.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveJourneyStops, deriveTaskBeat, formatClock, lessonIdentity, type JourneyInput } from './journeyModel';

const base: JourneyInput = {
  currentMode: 'video_clash',
  videoPhase: 'WATCHING',
  videoCurrentTime: 0,
  checkpointTimestamp: 2233,
  checkpointResolved: false,
  isQuizSkipped: false,
};

const statuses = (input: JourneyInput) => deriveJourneyStops(input).map((s) => s.status);

test('watching: first stop is current, the rest are locked', () => {
  assert.deepEqual(statuses(base), ['current', 'locked', 'locked', 'locked', 'locked', 'locked']);
  assert.equal(deriveTaskBeat(base), 'watch');
  assert.equal(deriveJourneyStops(base)[1].label, 'Bo sai ở 37:13');
});

test('checkpoint phases advance the line one stop at a time', () => {
  assert.deepEqual(statuses({ ...base, videoPhase: 'CHECKPOINT_REACHED' }), ['done', 'done', 'current', 'locked', 'locked', 'locked']);
  assert.deepEqual(statuses({ ...base, videoPhase: 'BO_DEBATE' }), ['done', 'done', 'done', 'current', 'locked', 'locked']);
  assert.deepEqual(statuses({ ...base, videoPhase: 'BO_CONCEDED' }), ['done', 'done', 'done', 'done', 'current', 'locked']);
  assert.equal(deriveTaskBeat({ ...base, videoPhase: 'BO_DEBATE' }), 'rebut');
  assert.equal(deriveTaskBeat({ ...base, videoPhase: 'CO_LAM_CLOSURE' }), 'closure');
});

test('after Cô Lam closes the checkpoint the learner heads to the teach-back stations', () => {
  const resolved = { ...base, checkpointResolved: true };
  assert.deepEqual(statuses(resolved), ['done', 'done', 'done', 'done', 'done', 'current']);
  assert.equal(deriveTaskBeat(resolved), 'continue');
  assert.equal(deriveJourneyStops({ ...base, currentMode: 'worksheet' })[5].status, 'current');
});

test('a skipped checkpoint stays open as "waiting"', () => {
  const skipped = { ...base, isQuizSkipped: true, videoCurrentTime: 2240 };
  const stops = deriveJourneyStops(skipped);
  assert.equal(stops[1].status, 'done');
  assert.equal(stops[2].status, 'waiting');
  assert.equal(stops[2].statusText, 'Đang chờ bạn');
  assert.equal(deriveTaskBeat(skipped), 'waiting');
});

test('a lesson without a pause question locks the checkpoint stops', () => {
  const stops = deriveJourneyStops({ ...base, checkpointTimestamp: null, videoPhase: 'BO_DEBATE' });
  assert.deepEqual(stops.slice(1, 5).map((s) => s.status), ['locked', 'locked', 'locked', 'locked']);
  assert.equal(stops[1].label, 'Bo sai');
});

test('formatClock', () => {
  assert.equal(formatClock(2233), '37:13');
  assert.equal(formatClock(3990), '1:06:30');
  assert.equal(formatClock(-5), '0:00');
});

test('lessonIdentity splits title and teacher from the shapes the app carries', () => {
  assert.deepEqual(lessonIdentity({ title: 'Toán 12 · Vectơ trong không gian · Thầy Nguyễn Phan Tiến' }), {
    title: 'Toán 12 — Vectơ trong không gian',
    teacher: 'Thầy Nguyễn Phan Tiến',
  });
  assert.deepEqual(
    lessonIdentity({
      title: 'Bài 1.1: Vectơ Trong Không Gian - Toán 12 (SGK Mới) || Thầy Nguyễn Phan Tiến',
      topic: 'Toán 12: Vectơ trong không gian — Định nghĩa, Tổng & Hiệu hai Vectơ',
    }),
    { title: 'Toán 12 — Vectơ trong không gian', teacher: 'Thầy Nguyễn Phan Tiến' },
  );
});

test('jumping to a later station does not mark the checkpoint as done', () => {
  assert.deepEqual(statuses({ ...base, currentMode: 'worksheet' }), ['open', 'open', 'open', 'open', 'open', 'current']);
  assert.deepEqual(statuses({ ...base, currentMode: 'worksheet', checkpointResolved: true }), ['done', 'done', 'done', 'done', 'done', 'current']);
});
