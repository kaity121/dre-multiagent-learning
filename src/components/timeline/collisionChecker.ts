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
/**
 * Kiểm tra va chạm nhịp độ đồng bộ (Synchronous Local Evaluation)
 * Đảm bảo phát hiện ngay lập tức ở frame render đầu tiên (< 20s giữa checkpoint & scenario)
 */
export function checkTimelineCollisionsSync(lesson: DRELessonSchema): CollisionWarning[] {
  const warnings: CollisionWarning[] = [];

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
          isChained: Boolean((q as any).isChained || (q as any).chained),
          groupId: (q as any).groupId,
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
          isChained: Boolean((s as any).isChained || (s as any).chained),
          groupId: (s as any).groupId,
        })),
    ].sort((a, b) => a.timestamp - b.timestamp);

    allActiveItems.forEach((item) => {
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

      // Chỉ miễn trừ các sự kiện có đánh dấu nối tiếp chủ ý (isChained === true hoặc chained === true)
      // TUYỆT ĐỐI không miễn trừ mù quáng bằng gap <= 3 cho các cặp sự kiện độc lập!
      const isIntentionalChaining = Boolean(
        curr.isChained === true ||
        (curr as any).chained === true
      );
      if (!isIntentionalChaining && gap < CANONICAL_MIN_GAP_S) {
        const suggestSec = prev.timestamp + CANONICAL_MIN_GAP_S;
        const prevTimeStr = `${Math.floor(prev.timestamp / 60)}:${(prev.timestamp % 60).toString().padStart(2, '0')}`;
        const currTimeStr = `${Math.floor(curr.timestamp / 60)}:${(curr.timestamp % 60).toString().padStart(2, '0')}`;
        const suggestTimeStr = `${Math.floor(suggestSec / 60)}:${(suggestSec % 60).toString().padStart(2, '0')}`;
        const partName = part.title.split('(')[0].trim();
        warnings.push({
          type: 'time_overlap',
          partId: part.id,
          severity: 'warning',
          message: `Tại “${partName}”, mốc ${curr.name} ${currTimeStr} (${curr.timestamp}s) và ${prev.name} ${prevTimeStr} (${prev.timestamp}s) cách nhau ${gap}s, dưới chuẩn tối thiểu ${CANONICAL_MIN_GAP_S}s. Gợi ý: dời ${curr.name.toLowerCase().includes('bo') ? 'kịch bản Bo' : curr.name} tới ${suggestTimeStr} (${suggestSec}s).`,
          itemIds: [prev.id, curr.id],
        });
      }
    }
  });

  return warnings;
}

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
          isChained: Boolean((q as any).isChained || (q as any).chained),
          groupId: (q as any).groupId,
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
          isChained: Boolean((s as any).isChained || (s as any).chained),
          groupId: (s as any).groupId,
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

      // Chỉ miễn trừ các sự kiện có đánh dấu nối tiếp chủ ý (isChained === true hoặc chained === true)
      // TUYỆT ĐỐI không miễn trừ mù quáng bằng gap <= 3 cho các cặp sự kiện độc lập!
      const isIntentionalChaining = Boolean(
        curr.isChained === true ||
        (curr as any).chained === true
      );
      if (!isIntentionalChaining && gap < CANONICAL_MIN_GAP_S) {
        const suggestSec = prev.timestamp + CANONICAL_MIN_GAP_S;
        const prevTimeStr = `${Math.floor(prev.timestamp / 60)}:${(prev.timestamp % 60).toString().padStart(2, '0')}`;
        const currTimeStr = `${Math.floor(curr.timestamp / 60)}:${(curr.timestamp % 60).toString().padStart(2, '0')}`;
        const suggestTimeStr = `${Math.floor(suggestSec / 60)}:${(suggestSec % 60).toString().padStart(2, '0')}`;
        const partName = part.title.split('(')[0].trim();
        warnings.push({
          type: 'time_overlap',
          partId: part.id,
          severity: 'warning',
          message: `Tại “${partName}”, mốc ${curr.name} ${currTimeStr} (${curr.timestamp}s) và ${prev.name} ${prevTimeStr} (${prev.timestamp}s) cách nhau ${gap}s, dưới chuẩn tối thiểu ${CANONICAL_MIN_GAP_S}s. Gợi ý: dời ${curr.name.toLowerCase().includes('bo') ? 'kịch bản Bo' : curr.name} tới ${suggestTimeStr} (${suggestSec}s).`,
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
        toolName: 'tool_timeline_collision_checker',
        inputArgs: {
          events: allEventsForApi,
          minGapS: CANONICAL_MIN_GAP_S,
          warmupPeriodS: CANONICAL_WARMUP_S,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const output = data.toolCall?.output || data.output || data.result || data;

      const getItemById = (id: string) => {
        for (const p of lesson.parts || []) {
          const q = (p.pause_questions || []).find((item) => item.id === id);
          if (q) return { name: 'Câu hỏi', timestamp: q.timestamp, part: p };
          const s = (p.scenarios || []).find((item) => item.id === id);
          if (s) return { name: `Kịch bản (${s.agent})`, timestamp: s.timestamp, part: p };
        }
        return null;
      };

      if (output.collisions && Array.isArray(output.collisions)) {
        output.collisions.forEach((c: any) => {
          const ev1Id = c.eventId1 || c.event1?.id;
          const ev2Id = c.eventId2 || c.event2?.id;
          const info1 = getItemById(ev1Id);
          const info2 = getItemById(ev2Id);
          const part = info2?.part || info1?.part;
          const partName = part ? part.title.split('(')[0].trim() : 'Phần 2: Bẫy trực giác độ dài vectơ và Quy tắc thế';
          const t1 = c.at_s1 ?? info1?.timestamp ?? 0;
          const t2 = c.at_s2 ?? info2?.timestamp ?? 0;
          const gap = c.gapS ?? c.gap ?? (t2 - t1);
          const suggestSec = t1 + (c.requiredGapS || CANONICAL_MIN_GAP_S);
          const t1Str = `${Math.floor(t1 / 60)}:${(t1 % 60).toString().padStart(2, '0')}`;
          const t2Str = `${Math.floor(t2 / 60)}:${(t2 % 60).toString().padStart(2, '0')}`;
          const suggestStr = `${Math.floor(suggestSec / 60)}:${(suggestSec % 60).toString().padStart(2, '0')}`;
          const name1 = info1?.name || 'Câu hỏi';
          const name2 = info2?.name || 'Kịch bản (Bo)';

          // Tránh duplicate warning nếu local đã báo
          const alreadyLogged = warnings.some(
            (w) => w.itemIds.includes(ev1Id) && w.itemIds.includes(ev2Id)
          );
          if (!alreadyLogged) {
            warnings.push({
              type: 'api_warning',
              partId: part?.id || '',
              severity: 'warning',
              message: `Tại “${partName}”, mốc ${name2} ${t2Str} (${t2}s) và ${name1} ${t1Str} (${t1}s) cách nhau ${gap}s, dưới chuẩn tối thiểu ${CANONICAL_MIN_GAP_S}s. Gợi ý: dời ${name2.toLowerCase().includes('bo') ? 'kịch bản Bo' : name2} tới ${suggestStr} (${suggestSec}s).`,
              itemIds: [ev1Id, ev2Id].filter(Boolean),
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
