/**
 * tool_timeline_collision_checker.js
 *
 * Deterministic Tool: Kiểm tra nhịp thời gian và va chạm trên timeline video.
 * Đảm bảo các quy tắc sư phạm của Cô Lam (Director):
 * 1. Khoảng cách giữa các bình luận liên tiếp >= 20 giây (minGapS = 20) để học sinh không bị quá tải.
 * 2. Không chèn tương tác ở đoạn mở đầu bài giảng (at_s < 15s).
 * 3. Tối đa 1 checkpoint dừng trong một phần (part) bài giảng.
 * 4. Cho phép các sự kiện nối tiếp có chủ ý trong cùng một lần dừng (checkpoint + debate turn cách nhau <= 5s, hoặc cùng groupId / cờ isChained / chainedTo).
 */

/**
 * Hàm thực thi Tool: tool_timeline_collision_checker
 *
 * @param {Object} input
 * @param {Array<Object>} [input.events] - Danh sách sự kiện { id, at_s, actor_id, type, duration_s, chained, isChained, chainedTo, groupId, checkpointId }
 * @param {Array<number>} [input.timelineSeconds] - Danh sách mốc thời gian (giây)
 * @param {number} [input.minGapS=20] - Khoảng cách tối thiểu giữa 2 sự kiện (giây)
 * @param {number} [input.minGapSeconds] - Alias cho minGapS
 * @param {number} [input.warmupPeriodS=15] - Thời gian đầu video không nên can thiệp
 * @param {number} [input.warmupSeconds] - Alias cho warmupPeriodS
 * @param {number} [input.maxCheckpoints=1] - Số lượng checkpoint tối đa
 * @returns {Object} { isValid, collisions, warnings, suggestions, reason }
 */
export function checkTimelineCollision({
  events = [],
  timelineSeconds,
  minGapS = 20,
  minGapSeconds,
  warmupPeriodS = 15,
  warmupSeconds,
  maxCheckpoints = 1,
}) {
  const effectiveMinGap = minGapSeconds !== undefined ? minGapSeconds : minGapS;
  const effectiveWarmup = warmupSeconds !== undefined ? warmupSeconds : warmupPeriodS;

  let eventList = events;
  if (Array.isArray(timelineSeconds)) {
    eventList = timelineSeconds.map((sec, idx) => ({
      id: `ev_${idx + 1}`,
      at_s: sec,
      actor_id: 'auto',
      type: 'comment',
    }));
  }

  if (!Array.isArray(eventList)) {
    throw new Error('Tham số events hoặc timelineSeconds phải là một mảng.');
  }

  // Sắp xếp các sự kiện theo thứ tự thời gian tăng dần
  const sorted = [...eventList].sort((a, b) => a.at_s - b.at_s);

  const collisions = [];
  const warnings = [];
  const suggestions = [];

  let checkpointCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // Kiểm tra thời gian khởi động (warmup period)
    if (current.at_s < effectiveWarmup) {
      warnings.push({
        eventId: current.id || `event_${i}`,
        at_s: current.at_s,
        message: `Sự kiện tại giây ${current.at_s} quá gần phần mở đầu của thầy (< ${effectiveWarmup}s).`,
      });
      suggestions.push(`Dời sự kiện "${current.id || i}" lùi về sau giây thứ ${effectiveWarmup}.`);
    }

    // Đếm số lượng checkpoint
    if (current.type === 'checkpoint') {
      checkpointCount++;
    }

    // Kiểm tra khoảng cách với sự kiện liền kề trước đó
    if (i > 0) {
      const prev = sorted[i - 1];
      const gap = current.at_s - prev.at_s;

      // Kiểm tra xem hai sự kiện có cố ý nối nhau trong cùng một lần dừng hay không (chained / co-located)
      // Ví dụ: Checkpoint dừng video tại 37:13 (2233s) và lượt tranh biện của Bo ngay sau đó (cách 2s)
      const chained = Boolean(
        (current.chainedTo && current.chainedTo === prev.id) ||
        (prev.chainedTo && prev.chainedTo === current.id) ||
        current.chained ||
        current.isChained ||
        current.coLocated ||
        (current.groupId && current.groupId === prev.groupId) ||
        (current.checkpointId && current.checkpointId === prev.checkpointId) ||
        (prev.type === 'checkpoint' && ['comment', 'debate_turn', 'dialogue'].includes(current.type) && gap <= 5)
      );

      if (gap < effectiveMinGap && !chained) {
        collisions.push({
          eventId1: prev.id || `event_${i - 1}`,
          eventId2: current.id || `event_${i}`,
          at_s1: prev.at_s,
          at_s2: current.at_s,
          gapS: gap,
          gap: gap,
          requiredGapS: effectiveMinGap,
          reason: `Khoảng cách giữa 2 sự kiện (${gap}s) nhỏ hơn ngưỡng cho phép (${effectiveMinGap}s).`,
        });
        suggestions.push(
          `Tách sự kiện "${current.id || i}" (tại ${current.at_s}s) cách sự kiện trước ít nhất ${effectiveMinGap}s (đề xuất: ${prev.at_s + effectiveMinGap}s).`
        );
      }
    }
  }

  // Kiểm tra số lượng checkpoint
  if (checkpointCount > maxCheckpoints) {
    warnings.push({
      type: 'excess_checkpoints',
      count: checkpointCount,
      maxAllowed: maxCheckpoints,
      message: `Có ${checkpointCount} checkpoint, vượt quá giới hạn khuyến nghị (${maxCheckpoints} checkpoint/part).`,
    });
    suggestions.push(`Giảm bớt checkpoint dừng, chỉ giữ lại checkpoint trọng tâm nhất.`);
  }

  const isValid = collisions.length === 0 && warnings.length === 0;
  const reason = isValid
    ? `Dòng thời gian hợp lệ: ${sorted.length} sự kiện cách nhau tối thiểu ${effectiveMinGap}s (hoặc được nối chuỗi trong cùng mốc dừng), nhịp sư phạm tốt.`
    : `Phát hiện ${collisions.length} điểm va chạm nhịp và ${warnings.length} cảnh báo sư phạm.`;

  return {
    isValid,
    collisions,
    warnings,
    suggestions,
    reason,
  };
}

export default checkTimelineCollision;
