import React from 'react';
import { DRELessonSchema, TimelineComment } from '../types/lesson';
import { VideoLessonItem } from '../types/dre';
import { DEMO_LESSON_SCHEMA } from '../demo/demoLesson';
import { adaptLessonToPlayer, adaptLessonToTimelineComments, exportApprovedLessonJSON } from '../utils/lessonAdapter';

export const DRAFT_STORAGE_KEY = 'dre_timeline_draft_active';
export const APPROVED_STORAGE_KEY_PREFIX = 'dre_approved_lesson_';

export interface LessonStoreState {
  currentLessonSchema: DRELessonSchema;
  currentVideoLesson: VideoLessonItem;
  timelineComments: TimelineComment[];
  isDraftDirty: boolean;
  isReplayFallback: boolean;
  lastApprovedAt: string | null;
}

type Listener = () => void;

class LessonStore {
  private state: LessonStoreState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): LessonStoreState {
    let schema: DRELessonSchema = DEMO_LESSON_SCHEMA;
    let isDirty = false;
    let lastApprovedAt: string | null = null;

    if (typeof window !== 'undefined') {
      try {
        const approvedKey = `${APPROVED_STORAGE_KEY_PREFIX}${DEMO_LESSON_SCHEMA.lesson_id}`;
        const savedApproved = localStorage.getItem(approvedKey);
        if (savedApproved) {
          const parsed = JSON.parse(savedApproved);
          if (parsed && Array.isArray(parsed.parts)) {
            schema = parsed;
            lastApprovedAt = parsed.metadata?.approvedAt || null;
          }
        } else {
          const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed && Array.isArray(parsed.parts)) {
              schema = parsed;
              isDirty = true;
            }
          }
        }
      } catch (err) {
        console.warn('[LessonStore] Không thể đọc localStorage:', err);
      }
    }

    const videoLesson = adaptLessonToPlayer(schema);
    const timelineComments = adaptLessonToTimelineComments(schema);

    return {
      currentLessonSchema: schema,
      currentVideoLesson: videoLesson,
      timelineComments,
      isDraftDirty: isDirty,
      isReplayFallback: true, // Mặc định hiển thị Replay badge khi đang chạy dữ liệu mock/fixture
      lastApprovedAt,
    };
  }

  public getState(): LessonStoreState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.warn('[LessonStore] Listener error:', e);
      }
    });
  }

  public setDraft(schema: DRELessonSchema) {
    this.updateDraft(() => schema);
  }

  public updateDraft(updater: (prev: DRELessonSchema) => DRELessonSchema) {
    const updatedSchema = updater(this.state.currentLessonSchema);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedSchema));
      } catch (err) {
        console.warn('[LessonStore] Lỗi lưu draft localStorage:', err);
      }
    }
    const updatedVideoLesson = adaptLessonToPlayer(updatedSchema);
    const updatedComments = adaptLessonToTimelineComments(updatedSchema);
    this.state = {
      ...this.state,
      currentLessonSchema: updatedSchema,
      currentVideoLesson: updatedVideoLesson,
      timelineComments: updatedComments,
      isDraftDirty: true,
    };
    this.notify();
  }

  public approveAndPublish(customSchema?: DRELessonSchema): DRELessonSchema {
    const targetSchema: DRELessonSchema = {
      ...(customSchema || this.state.currentLessonSchema),
      status: 'approved',
    };
    const approvedAt = new Date().toISOString();
    const jsonStr = exportApprovedLessonJSON(targetSchema);

    if (typeof window !== 'undefined') {
      try {
        const approvedKey = `${APPROVED_STORAGE_KEY_PREFIX}${targetSchema.lesson_id || 'VID_VECTO_12'}`;
        localStorage.setItem(approvedKey, jsonStr);
        localStorage.setItem(DRAFT_STORAGE_KEY, jsonStr);
      } catch (err) {
        console.warn('[LessonStore] Lỗi lưu approved localStorage:', err);
      }
    }

    const updatedVideoLesson = adaptLessonToPlayer(targetSchema);
    const updatedComments = adaptLessonToTimelineComments(targetSchema);

    this.state = {
      ...this.state,
      currentLessonSchema: targetSchema,
      currentVideoLesson: updatedVideoLesson,
      timelineComments: updatedComments,
      isDraftDirty: false,
      lastApprovedAt: approvedAt,
    };
    this.notify();
    return targetSchema;
  }

  public setReplayFallback(isReplay: boolean) {
    if (this.state.isReplayFallback !== isReplay) {
      this.state = {
        ...this.state,
        isReplayFallback: isReplay,
      };
      this.notify();
    }
  }

  public selectLesson(lesson: VideoLessonItem) {
    const adapted = adaptLessonToPlayer(lesson);
    this.state = {
      ...this.state,
      currentVideoLesson: adapted,
    };
    this.notify();
  }
}

export const lessonStore = new LessonStore();

/**
 * Custom React hook để các component (Classroom Player, Chat Drawer, Timeline Editor)
 * đăng ký và nhận cập nhật State tức thì ngay khi kịch bản được lưu hoặc phê duyệt.
 */
export function useLessonStore(): [LessonStoreState, LessonStore] {
  const [state, setState] = React.useState<LessonStoreState>(() => lessonStore.getState());

  React.useEffect(() => {
    return lessonStore.subscribe(() => {
      setState(lessonStore.getState());
    });
  }, []);

  return [state, lessonStore];
}
