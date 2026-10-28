import { DRELessonSchema } from '../../types/lesson';
import { API_BASE_URL } from '../inspector/InspectorDrawer';

export interface CollisionWarning {
  type: 'rule_violation' | 'time_overlap' | 'api_warning';
  partId: string;
  message: string;
  severity: 'warning' | 'error';
  itemIds: string[];
}

export async function checkTimelineCollisions(
  lesson: DRELessonSchema
): Promise<CollisionWarning[]> {
  const warnings: CollisionWarning[] = [];

  lesson.parts.forEach((part) => {
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
        .map((q) => ({ id: q.id, timestamp: q.timestamp, name: 'Câu hỏi' })),
      ...(part.scenarios || [])
        .filter((s) => s.is_active)
        .map((s) => ({ id: s.id, timestamp: s.timestamp, name: `Kịch bản (${s.agent})` })),
    ].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < allActiveItems.length; i++) {
      const prev = allActiveItems[i - 1];
      const curr = allActiveItems[i];
      if (curr.timestamp - prev.timestamp < 5) {
        warnings.push({
          type: 'time_overlap',
          partId: part.id,
          severity: 'warning',
          message: `Tại "${part.title}", mốc ${curr.name} (${curr.timestamp}s) và ${prev.name} (${prev.timestamp}s) cách nhau dưới 5 giây, học sinh có thể bị quá tải tương tác.`,
          itemIds: [prev.id, curr.id],
        });
      }
    }
  });

  try {
    const res = await fetch(`${API_BASE_URL}/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'tool_timeline_collision_checker',
        parameters: { lesson },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.warnings && Array.isArray(data.warnings)) {
        data.warnings.forEach((w: any) => {
          warnings.push({
            type: 'api_warning',
            partId: w.partId || '',
            severity: w.severity || 'warning',
            message: w.message || String(w),
            itemIds: w.itemIds || [],
          });
        });
      }
    }
  } catch (_err) {
    // Offline fallback
  }

  return warnings;
}
