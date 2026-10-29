import { DRELessonSchema } from '../../types/lesson';
import { API_BASE_URL } from '../inspector/InspectorDrawer';

export interface CollisionWarning {
  type: 'rule_violation' | 'time_overlap' | 'api_warning';
  partId: string;
  message: string;
  severity: 'warning' | 'error';
  itemIds: string[];
}

// Ngưỡng giãn cách sư phạm tối thiểu chuẩn mực của hệ thống DRE (Issue #301 & Review @Blu)
export const CANONICAL_MIN_GAP_S = 20;
export const CANONICAL_WARMUP_S = 15;

/**
 * Kiểm tra va chạm thời gian và nhịp độ sư phạm (Pacing Bridge) cho Timeline Editor.
 * Đồng bộ chuẩn 100% với Deterministic Tool backend: tool_timeline_collision_checker.
 */
export async function checkTimelineCollisions(
  lesson: DRELessonSchema
): Promise<CollisionWarning[]> {
  const warnings: CollisionWarning[] = [];

  const allEventsForApi: Array<{
    id: string;
    at_s: number;
    actor_id: string;
    type: string;
    partId: string;
    chained?: boolean;
    isChained?: boolean;
    groupId?: string;
  }> = [];

  // 1. Kiểm tra luật sư phạm cục bộ (Local Rules & Deterministic Fallback)
  (lesson.parts || []).forEach((part) => {
    const activePauseQuestions = (part.pause_questions || []).filter((q) => q.is_active);
    if (activePauseQuestions.length > 1) {
      warnings.push({
        type: 'rule_violation',
        partId: part.id,
        severity: 'error',
        message: `Phân đoạn "${part.title}" có ${activePauseQuestions.length} câu hỏi dừng đang bật. Quy định chuẩn chỉ cho phép tối đa 1 lần dừng mỗi part.`,
        itemIds: activePauseQuestions.map((q) => q.id),
      });
    }

    const allActiveItems = [
      ...(part.pause_questions || [])
        .filter((q) => q.is_active)
        .map((q) => ({
          id: q.id,
          timestamp: q.timestamp,
          name: 'Câu hỏi',
          actor_id: 'colam',
          type: 'checkpoint',
          partId: part.id,
          isChained: false,
        })),
      ...(part.scenarios || [])
        .filter((s) => s.is_active)
        .map((s) => ({
          id: s.id,
          timestamp: s.timestamp,
          name: `Kịch bản (${s.agent})`,
          actor_id: s.agent ? s.agent.toLowerCase() : 'auto',
          type: 'scenario',
          partId: part.id,
          isChained: false,
        })),
    ].sort((a, b) => a.timestamp - b.timestamp);

    allActiveItems.forEach((item) => {
      allEventsForApi.push({
        id: item.id,
        at_s: item.timestamp,
        actor_id: item.actor_id,
        type: item.type,
        partId: item.partId,
        isChained: item.isChained,
      });

      // Kiểm tra mở đầu bài giảng (Warmup >= 15s)
      if (item.timestamp < CANONICAL_WARMUP_S) {
        warnings.push({
          type: 'rule_violation',
          partId: part.id,
          severity: 'warning',
          message: `Mốc ${item.name} (${item.timestamp}s) xuất hiện trong ${CANONICAL_WARMUP_S}s đầu bài giảng khi học sinh chưa kịp làm quen bài học.`,
          itemIds: [item.id],
        });
      }
    });

    // Kiểm tra khoảng cách liên tiếp theo chuẩn minGapS = 20s
    for (let i = 1; i < allActiveItems.length; i++) {
      const prev = allActiveItems[i - 1];
      const curr = allActiveItems[i];
      const gap = curr.timestamp - prev.timestamp;

      // Bỏ qua các sự kiện nối tiếp chủ ý cùng mốc checkpoint (gap <= 3s)
      const isIntentionalChaining = gap <= 3;
      if (!isIntentionalChaining && gap < CANONICAL_MIN_GAP_S) {
        warnings.push({
          type: 'time_overlap',
          partId: part.id,
          severity: 'warning',
          message: `Tại "${part.title}", mốc ${curr.name} (${curr.timestamp}s) và ${prev.name} (${prev.timestamp}s) cách nhau ${gap}s (dưới chuẩn tối thiểu ${CANONICAL_MIN_GAP_S}s), học sinh có thể bị quá tải tương tác.`,
          itemIds: [prev.id, curr.id],
        });
      }
    }
  });

  // 2. Gọi Deterministic Tool API backend nếu có kết nối mạng
  try {
    const res = await fetch(`${API_BASE_URL}/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'tool_timeline_collision_checker',
        input: {
          events: allEventsForApi,
          minGapS: CANONICAL_MIN_GAP_S,
          warmupPeriodS: CANONICAL_WARMUP_S,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const output = data.output || data.result || data;

      if (output.collisions && Array.isArray(output.collisions)) {
        output.collisions.forEach((c: any) => {
          const ev1 = c.event1 || {};
          const ev2 = c.event2 || {};
          const matchedPart = allEventsForApi.find((e) => e.id === ev1.id)?.partId || '';

          // Tránh duplicate warning nếu local đã báo
          const alreadyLogged = warnings.some(
            (w) => w.itemIds.includes(ev1.id) && w.itemIds.includes(ev2.id)
          );
          if (!alreadyLogged) {
            warnings.push({
              type: 'api_warning',
              partId: matchedPart,
              severity: 'warning',
              message: c.reason || `Phát hiện va chạm nhịp độ giữa ${ev1.id} và ${ev2.id} (khoảng cách ${c.gapS}s < ${CANONICAL_MIN_GAP_S}s)`,
              itemIds: [ev1.id, ev2.id].filter(Boolean),
            });
          }
        });
      }

      if (output.warnings && Array.isArray(output.warnings)) {
        output.warnings.forEach((w: any) => {
          const msg = typeof w === 'string' ? w : w.message || '';
          if (msg && !warnings.some((existing) => existing.message === msg)) {
            warnings.push({
              type: 'api_warning',
              partId: '',
              severity: 'warning',
              message: msg,
              itemIds: [],
            });
          }
        });
      }
    }
  } catch (_err) {
    // Offline fallback: đã có bộ lọc cục bộ 20s phía trên
  }

  return warnings;
}
