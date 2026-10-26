/**
 * tool_timeline_collision_checker.js
 *
 * Deterministic Tool: Kiểm tra nhịp thời gian và va chạm trên timeline video.
 * Đảm bảo các quy tắc sư phạm của Cô Lam (Director):
 * 1. Khoảng cách giữa các bình luận liên tiếp >= 20 giây (minGapS = 20) để học sinh không bị quá tải.
 * 2. Không chèn tương tác ở đoạn mở đầu bài giảng (at_s < 15s).
 * 3. Tối đa 1 checkpoint dừng trong một phần (part) bài giảng.
 */

/**
 * Hàm thực thi Tool: tool_timeline_collision_checker
 *
 * @param {Object} input
 * @param {Array<Object>} input.events - Danh sách sự kiện { id, at_s, actor_id, type, duration_s }
 * @param {number} [input.minGapS=20] - Khoảng cách tối thiểu giữa 2 sự kiện (giây)
 * @param {number} [input.warmupPeriodS=15] - Thời gian đầu video không nên can thiệp
 * @param {number} [input.maxCheckpoints=1] - Số lượng checkpoint tối đa
 * @returns {Object} { isValid, collisions, warnings, suggestions, reason }
 */
export function checkTimelineCollision({
  events = [],
  minGapS = 20,
  warmupPeriodS = 15,
  maxCheckpoints = 1,
}) {
  if (!Array.isArray(events)) {
    throw new Error('Tham số events phải là một mảng các sự kiện.');
  }

  // Sắp xếp các sự kiện theo thứ tự thời gian tăng dần
  const sorted = [...events].sort((a, b) => a.at_s - b.at_s);

  const collisions = [];
  const warnings = [];
  const suggestions = [];

  let checkpointCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // Kiểm tra thời gian khởi động (warmup period)
    if (current.at_s < warmupPeriodS) {
      warnings.push({
        eventId: current.id || `event_${i}`,
        at_s: current.at_s,
        message: `Sự kiện tại giây ${current.at_s} quá gần phần mở đầu của thầy (< ${warmupPeriodS}s).`,
      });
      suggestions.push(`Dời sự kiện "${current.id || i}" lùi về sau giây thứ ${warmupPeriodS}.`);
    }

    // Đếm số lượng checkpoint
    if (current.type === 'checkpoint') {
      checkpointCount++;
    }

    // Kiểm tra khoảng cách với sự kiện liền kề trước đó
    if (i > 0) {
      const prev = sorted[i - 1];
      const gap = current.at_s - prev.at_s;

      if (gap < minGapS) {
        collisions.push({
          eventId1: prev.id || `event_${i - 1}`,
          eventId2: current.id || `event_${i}`,
          at_s1: prev.at_s,
          at_s2: current.at_s,
          gapS: gap,
          requiredGapS: minGapS,
          reason: `Khoảng cách giữa 2 sự kiện (${gap}s) nhỏ hơn ngưỡng cho phép (${minGapS}s).`,
        });
        suggestions.push(
          `Tách sự kiện "${current.id || i}" (tại ${current.at_s}s) cách sự kiện trước ít nhất ${minGapS}s (đề xuất: ${prev.at_s + minGapS}s).`
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
    ? `Dòng thời gian hợp lệ: ${sorted.length} sự kiện cách nhau tối thiểu ${minGapS}s, nhịp sư phạm tốt.`
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
