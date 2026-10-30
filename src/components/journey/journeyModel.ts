// Pure derivations for the learner journey shell: the six-stop rail and the four-station switcher.
// Everything here reads existing app state (video phase, current station, completion flags);
// it never changes business rules, it only decides how the story is told.
import type { LearningMode, VideoCheckpointPhase } from '../../types/dre';

export type StopStatus = 'done' | 'current' | 'waiting' | 'open' | 'locked';

export type JourneyStopId = 'watch' | 'bo_mistake' | 'diagnose' | 'rebut' | 'closure' | 'teach_back';

export interface JourneyStop {
  id: JourneyStopId;
  label: string;
  status: StopStatus;
  statusText: string;
  /** The 37:13 checkpoint is drawn as an interchange on the line. */
  isInterchange?: boolean;
}

export interface JourneyInput {
  currentMode: LearningMode;
  videoPhase: VideoCheckpointPhase;
  videoCurrentTime: number;
  checkpointTimestamp: number | null;
  /** True once Cô Lam has closed the checkpoint in this session. */
  checkpointResolved: boolean;
  isQuizSkipped: boolean;
}

const STATUS_TEXT: Record<StopStatus, string> = {
  done: 'Hoàn thành',
  current: 'Đang thực hiện',
  waiting: 'Đang chờ bạn',
  open: 'Chưa làm',
  locked: 'Chưa mở',
};

const CHECKPOINT_PHASES: VideoCheckpointPhase[] = ['CHECKPOINT_REACHED', 'BO_DEBATE', 'BO_CONCEDED', 'CO_LAM_CLOSURE'];

/** Index of the stop the learner is on; stops before it are done, after it are locked. */
function currentStopIndex(input: JourneyInput): number {
  if (input.currentMode !== 'video_clash') return 5;
  switch (input.videoPhase) {
    case 'CHECKPOINT_REACHED':
      return 2;
    case 'BO_DEBATE':
      return 3;
    case 'BO_CONCEDED':
    case 'CO_LAM_CLOSURE':
      return 4;
    default:
      // Watching (or a learner-initiated freeze): after the rule is locked the lesson continues
      // towards the teach-back stations, otherwise the learner is still watching.
      return input.checkpointResolved ? 5 : 0;
  }
}

export function deriveJourneyStops(input: JourneyInput): JourneyStop[] {
  const idx = currentStopIndex(input);
  const labels: Array<[JourneyStopId, string]> = [
    ['watch', 'Xem bài'],
    ['bo_mistake', `Bo sai ở ${formatClock(input.checkpointTimestamp ?? 0)}`],
    ['diagnose', 'Chẩn đoán'],
    ['rebut', 'Bác Bo'],
    ['closure', 'Cô Lam chốt'],
    ['teach_back', 'Dạy lại Bo'],
  ];
  const hasCheckpoint = input.checkpointTimestamp !== null;

  return labels.map(([id, label], i) => {
    let status: StopStatus = i < idx ? 'done' : i === idx ? 'current' : 'locked';

    // Jumping ahead to Stations 2–4 does not complete the checkpoint: those stops stay to do.
    if (input.currentMode !== 'video_clash' && !input.checkpointResolved && i < idx) status = 'open';

    // "Bo sai ở 37:13" is a moment, not a task: it is done as soon as the class reaches it.
    if (id === 'bo_mistake' && idx === 1) status = 'done';

    // A skipped checkpoint stays open: the question is still waiting in the chat.
    if (
      input.isQuizSkipped &&
      !input.checkpointResolved &&
      input.currentMode === 'video_clash' &&
      !CHECKPOINT_PHASES.includes(input.videoPhase) &&
      (id === 'bo_mistake' || id === 'diagnose')
    ) {
      status = id === 'bo_mistake' ? 'done' : 'waiting';
    }

    if (!hasCheckpoint && (id === 'bo_mistake' || id === 'diagnose' || id === 'rebut' || id === 'closure')) {
      status = 'locked';
    }

    return {
      id,
      label: hasCheckpoint || id === 'watch' || id === 'teach_back' ? label : label.replace(/ ở .*$/, ''),
      status,
      statusText: STATUS_TEXT[status],
      isInterchange: id === 'bo_mistake',
    };
  });
}

export type StationStatus = 'done' | 'current' | 'open';

export interface StationMeta {
  id: LearningMode;
  number: 1 | 2 | 3 | 4;
  name: string;
  description: string;
}

export const STATIONS: StationMeta[] = [
  { id: 'video_clash', number: 1, name: 'Xem bài', description: 'Xem bài giảng, dừng ở điểm dừng để bắt lỗi của Bo.' },
  { id: 'worksheet', number: 2, name: 'Sổ tay', description: 'Tìm bước sai trong lời giải của Bo và giải thích vì sao.' },
  { id: 'predict_poe', number: 3, name: 'Đoán', description: 'Đoán kết quả trước, rồi xem hình 3D để kiểm tra.' },
  { id: 'protege_teaching', number: 4, name: 'Dạy kèm', description: 'Giảng lại cho Bo để chắc rằng bạn đã hiểu.' },
];

export function stationFor(mode: LearningMode): StationMeta {
  return STATIONS.find((s) => s.id === mode) ?? STATIONS[0];
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? m.toString().padStart(2, '0') : m.toString();
  return `${h > 0 ? `${h}:` : ''}${mm}:${sec.toString().padStart(2, '0')}`;
}

/** Bo's stance after the first answer, as chosen by the backend (or its local equivalent). */
export type BoMode = 'misconception_ally' | 'shortcut_fallacy' | 'edge_case_skeptic';

export type TaskBeat = 'watch' | 'diagnose' | 'rebut' | 'closure' | 'continue' | 'waiting';

/** Which instruction the "Việc của bạn bây giờ" card shows on Station 1. */
export function deriveTaskBeat(input: JourneyInput): TaskBeat {
  switch (input.videoPhase) {
    case 'CHECKPOINT_REACHED':
      return 'diagnose';
    case 'BO_DEBATE':
      return 'rebut';
    case 'BO_CONCEDED':
    case 'CO_LAM_CLOSURE':
      return 'closure';
    default:
      if (input.checkpointResolved) return 'continue';
      if (input.isQuizSkipped && input.checkpointTimestamp !== null) return 'waiting';
      return 'watch';
  }
}

/** Short lesson title and teacher for the top bar, derived from the lesson's own fields. */
export function lessonIdentity(lesson: { title: string; topic?: string }): { title: string; teacher?: string } {
  const teacherPattern = /(Thầy|Cô)\s+[^·|()\-—,]+/u;
  const teacher = (lesson.title.match(teacherPattern) ?? lesson.topic?.match(teacherPattern))?.[0].trim();
  let base = (lesson.topic || lesson.title).split('||')[0];
  if (teacher) base = base.replace(teacher, '');
  base = base.replace(/\(\s*\)/g, '').split(' — ')[0];
  const title = base
    .split(/\s+·\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' — ')
    .replace(/^([^:]{2,24}):\s*/, '$1 — ')
    .replace(/[\s·\-—]+$/u, '')
    .trim();
  return { title: title || lesson.title, teacher };
}

export interface BoStep {
  text: string;
  /** The step where the argument goes wrong. */
  isCrux?: boolean;
}

/**
 * Bo's working, laid out as steps, from one wrong claim such as
 * "Tách trực tiếp thành tổng hai độ dài: |BC| + |DD'| = 1 + 1 = 2".
 * The method before the colon is step 1, the computation is the crux, the last value is his conclusion.
 */
export function deriveBoSteps(claim: string): { steps: BoStep[]; conclusion?: string } {
  const text = claim.trim();
  if (!text) return { steps: [] };
  const colon = text.indexOf(': ');
  const method = colon > 0 ? text.slice(0, colon).trim() : '';
  const work = colon > 0 ? text.slice(colon + 2).trim() : text;
  const lastEq = work.lastIndexOf('=');
  const conclusion = lastEq >= 0 ? work.slice(lastEq + 1).trim() || undefined : undefined;
  const steps: BoStep[] = [];
  if (method) steps.push({ text: method });
  steps.push({ text: work, isCrux: true });
  return { steps, conclusion };
}
