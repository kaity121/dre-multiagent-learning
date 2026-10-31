// Run: npx tsx --test src/components/journey/journeyModel.test.ts src/components/agentmap/agentMapModel.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveBloomProgress } from './bloomProgress';
import { deriveJourneyStops, deriveTaskBeat, formatClock, lessonIdentity, type JourneyInput } from './journeyModel';

const base: JourneyInput = {
  currentMode: 'video_clash',
  videoPhase: 'WATCHING',
  videoCurrentTime: 0,
  checkpointTimestamp: 2233,
  checkpointResolved: false,
  isQuizSkipped: false,
  completedStations: {},
};

const statuses = (input: JourneyInput) => deriveJourneyStops(input).map((s) => s.status);

test('watching: first stop is current, the rest are locked', () => {
  assert.deepEqual(statuses(base), ['current', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked']);
  assert.equal(deriveTaskBeat(base), 'watch');
  assert.equal(deriveJourneyStops(base)[1].label, 'Bo sai ở 37:13');
});

test('checkpoint phases advance the line one stop at a time', () => {
  assert.deepEqual(statuses({ ...base, videoPhase: 'CHECKPOINT_REACHED' }), ['done', 'done', 'current', 'locked', 'locked', 'locked', 'locked']);
  assert.deepEqual(statuses({ ...base, videoPhase: 'BO_DEBATE' }), ['done', 'done', 'done', 'current', 'locked', 'locked', 'locked']);
  assert.deepEqual(statuses({ ...base, videoPhase: 'BO_CONCEDED' }), ['done', 'done', 'done', 'done', 'current', 'locked', 'locked']);
  assert.equal(deriveTaskBeat({ ...base, videoPhase: 'BO_DEBATE' }), 'rebut');
  assert.equal(deriveTaskBeat({ ...base, videoPhase: 'CO_LAM_CLOSURE' }), 'closure');
});

test('after Cô Lam closes the checkpoint the learner heads to the practice stations', () => {
  const resolved = { ...base, checkpointResolved: true };
  assert.deepEqual(statuses(resolved), ['done', 'done', 'done', 'done', 'done', 'current', 'locked']);
  assert.equal(deriveTaskBeat(resolved), 'continue');
});

test('Stations 2 and 3 light up "Luyện tập", never "Dạy lại Bo"', () => {
  for (const mode of ['worksheet', 'predict_poe'] as const) {
    const stops = deriveJourneyStops({ ...base, currentMode: mode, checkpointResolved: true });
    const practice = stops.find((s) => s.id === 'practice')!;
    assert.equal(practice.label, 'Luyện tập');
    assert.equal(practice.status, 'current');
    assert.equal(stops.find((s) => s.id === 'teach_back')!.status, 'locked');
    assert.equal(practice.subStations!.find((s) => s.id === mode)!.status, 'current');
  }
  const sheet = deriveJourneyStops({ ...base, currentMode: 'worksheet' }).find((s) => s.id === 'practice')!;
  assert.deepEqual(
    sheet.subStations!.map((s) => [s.number, s.name, s.status, s.statusText]),
    [
      [2, 'Sổ tay', 'current', 'đang làm'],
      [3, 'Đoán', 'open', 'chưa làm'],
    ],
  );
});

test('the practice sub-dots follow recorded completion', () => {
  const onPoe = deriveJourneyStops({ ...base, currentMode: 'predict_poe', completedStations: { worksheet: true } });
  assert.deepEqual(onPoe[5].subStations!.map((s) => s.status), ['done', 'current']);
});

test('Station 4 lights up "Dạy lại Bo"; "Luyện tập" is done only when both stations are', () => {
  const onTeach = { ...base, currentMode: 'protege_teaching' as const, checkpointResolved: true };
  assert.deepEqual(statuses(onTeach), ['done', 'done', 'done', 'done', 'done', 'open', 'current']);
  assert.deepEqual(deriveJourneyStops(onTeach)[5].subStations!.map((s) => s.status), ['open', 'open']);
  const allDone = { ...onTeach, completedStations: { worksheet: true, predict_poe: true } };
  assert.deepEqual(statuses(allDone), ['done', 'done', 'done', 'done', 'done', 'done', 'current']);
  // Finished practice shows as done even when the learner is back on Station 1.
  assert.equal(deriveJourneyStops({ ...base, completedStations: { worksheet: true, predict_poe: true } })[5].status, 'done');
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
  assert.deepEqual(statuses({ ...base, currentMode: 'worksheet' }), ['open', 'open', 'open', 'open', 'open', 'current', 'locked']);
  assert.deepEqual(statuses({ ...base, currentMode: 'worksheet', checkpointResolved: true }), ['done', 'done', 'done', 'done', 'done', 'current', 'locked']);
  assert.deepEqual(statuses({ ...base, currentMode: 'protege_teaching' }), ['open', 'open', 'open', 'open', 'open', 'open', 'current']);
});

test('deriveBoSteps lays out method, crux and conclusion from one claim', async () => {
  const { deriveBoSteps } = await import('./journeyModel');
  const r = deriveBoSteps("Tách trực tiếp thành tổng hai độ dài: |BC| + |DD'| = 1 + 1 = 2");
  assert.deepEqual(r.steps, [
    { text: 'Tách trực tiếp thành tổng hai độ dài' },
    { text: "|BC| + |DD'| = 1 + 1 = 2", isCrux: true },
  ]);
  assert.equal(r.conclusion, '2');
  assert.deepEqual(deriveBoSteps('Bằng √3'), { steps: [{ text: 'Bằng √3', isCrux: true }], conclusion: undefined });
});

const noBloom = { lessonStarted: false, checkpointAnswered: false, worksheetDone: false, boRefuted: false, teachBackDone: false };

test('Bloom tower: nothing reached before the lesson starts', () => {
  const p = deriveBloomProgress(noBloom);
  assert.equal(p.reachedCount, 0);
  assert.equal(p.highest, 0);
  assert.equal(p.levels[3].unlockHint, 'Mở khi xong Trạm 2');
});

test('Bloom tower counts only the steps the learner actually did', () => {
  const watched = deriveBloomProgress({ ...noBloom, lessonStarted: true });
  assert.deepEqual(watched.levels.map((l) => l.reached), [true, true, false, false, false, false]);
  assert.equal(watched.reachedCount, 2);
  const refuted = deriveBloomProgress({ ...noBloom, lessonStarted: true, checkpointAnswered: true, boRefuted: true });
  assert.deepEqual(refuted.levels.map((l) => l.reached), [true, true, true, false, true, false]);
  assert.equal(refuted.reachedCount, 4);
  assert.equal(refuted.highest, 5);
  const all = deriveBloomProgress({ lessonStarted: true, checkpointAnswered: true, worksheetDone: true, boRefuted: true, teachBackDone: true });
  assert.equal(all.reachedCount, 6);
  assert.equal(all.highest, 6);
});
