// Quiet toolbar under the Station 1 task card: chapters, change link, quick reactions,
// jump to the pause question and raise hand. Same actions as before, one slim row.
import React from 'react';
import { BookOpenText, CircleHelp, Hand, Link2, SkipForward, ThumbsUp } from 'lucide-react';

export interface VideoActionBarProps {
  chapterTitle: string;
  onToggleChapters: () => void;
  onOpenAttach: () => void;
  onReaction: (type: 'understood' | 'confused') => void;
  /** Absent when the lesson has no pause question. */
  onJumpToCheckpoint?: () => void;
  checkpointLabel?: string;
  onRaiseHand: () => void;
  isRaiseHandOpen: boolean;
}

const btn =
  'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#E2EAD2] bg-white px-3 text-[13px] font-semibold text-[#121712] transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]';

export const VideoActionBar: React.FC<VideoActionBarProps> = ({
  chapterTitle,
  onToggleChapters,
  onOpenAttach,
  onReaction,
  onJumpToCheckpoint,
  checkpointLabel,
  onRaiseHand,
  isRaiseHandOpen,
}) => (
  <div role="toolbar" aria-label="Công cụ video" className="flex flex-wrap items-center gap-2">
    <button type="button" onClick={onToggleChapters} className={`${btn} max-w-[240px]`} title="Phân cảnh và bản chép lời">
      <BookOpenText className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{chapterTitle}</span>
    </button>
    <button type="button" onClick={onOpenAttach} className={btn} title="Đổi link YouTube bài giảng">
      <Link2 className="h-4 w-4" aria-hidden="true" />
      Đổi link
    </button>
    <span className="flex-1" />
    <button type="button" onClick={() => onReaction('understood')} className={btn} title="Bấm nếu bạn đã hiểu đoạn này">
      <ThumbsUp className="h-4 w-4" aria-hidden="true" />
      Đã hiểu
    </button>
    <button type="button" onClick={() => onReaction('confused')} className={btn} title="Bấm nếu bạn chưa rõ đoạn này">
      <CircleHelp className="h-4 w-4" aria-hidden="true" />
      Chưa rõ
    </button>
    {onJumpToCheckpoint && (
      <button type="button" onClick={onJumpToCheckpoint} className={btn} title="Nhảy tới câu hỏi dừng">
        <SkipForward className="h-4 w-4" aria-hidden="true" />
        Câu hỏi dừng{checkpointLabel ? ` ${checkpointLabel}` : ''}
      </button>
    )}
    <button
      type="button"
      onClick={onRaiseHand}
      aria-pressed={isRaiseHandOpen}
      className={`${btn} ${isRaiseHandOpen ? 'border-[#121712] bg-[#121712] text-white hover:bg-black' : ''}`}
      title="Giơ tay hỏi thầy và bạn"
    >
      <Hand className="h-4 w-4" aria-hidden="true" />
      Giơ tay
    </button>
  </div>
);
