// Which Bloom levels the learner has actually reached in this lesson, from what the app records.
// Each level is tied to one real step of the journey; nothing here is graded or scored.

export interface BloomProgressInput {
  /** The lecture has started playing or moved past 0:00. */
  lessonStarted: boolean;
  /** The learner answered the pause question (Bo has taken a stance or the checkpoint is closed). */
  checkpointAnswered: boolean;
  /** Station 2 (Sổ tay) is finished. */
  worksheetDone: boolean;
  /** Bo conceded and Cô Lam closed the checkpoint. */
  boRefuted: boolean;
  /** The learner's own problem passed the check in Station 4. */
  teachBackDone: boolean;
}

export interface BloomLevelProgress {
  /** 1–6, matching BLOOM_TAXONOMY[].index. */
  index: number;
  reached: boolean;
  /** What unlocks the level, shown while it is not reached. */
  unlockHint: string;
}

export interface BloomProgress {
  levels: BloomLevelProgress[];
  reachedCount: number;
  /** Highest reached level index, or 0 when none is reached. */
  highest: number;
}

export function deriveBloomProgress(input: BloomProgressInput): BloomProgress {
  const rules: Array<[boolean, string]> = [
    [input.lessonStarted, 'Mở khi bạn bắt đầu xem bài'],
    [input.lessonStarted, 'Mở khi bạn bắt đầu xem bài'],
    [input.checkpointAnswered, 'Mở khi bạn trả lời câu hỏi dừng'],
    [input.worksheetDone, 'Mở khi xong Trạm 2'],
    [input.boRefuted, 'Mở khi bạn bác được Bo'],
    [input.teachBackDone, 'Mở khi xong Trạm 4'],
  ];
  const levels = rules.map(([reached, unlockHint], i) => ({ index: i + 1, reached, unlockHint }));
  const reached = levels.filter((l) => l.reached);
  return {
    levels,
    reachedCount: reached.length,
    highest: reached.length ? reached[reached.length - 1].index : 0,
  };
}
