// Quiet toolbar under the Station 1 task card: chapters, quick reactions,
// jump to the pause question and raise hand. On small screens the secondary actions
// collapse into a "Thêm" menu so the row never wraps.
import React from 'react';
import { BookOpenText, CircleHelp, Hand, MoreHorizontal, SkipForward, ThumbsUp } from 'lucide-react';
import { useMenuButton } from './useMenuButton';

export interface VideoActionBarProps {
  chapterTitle: string;
  onToggleChapters: () => void;
  onReaction: (type: 'understood' | 'confused') => void;
  /** Absent when the lesson has no pause question. */
  onJumpToCheckpoint?: () => void;
  checkpointLabel?: string;
  onRaiseHand: () => void;
  isRaiseHandOpen: boolean;
}

// No display utility here: each button sets its own (inline-flex, or hidden sm:inline-flex).
const btnBase =
  'h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#E2EAD2] bg-white px-3 text-[13px] font-semibold text-[#121712] transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]';
const btn = `inline-flex ${btnBase}`;
const wideOnly = `hidden sm:inline-flex ${btnBase}`;
const menuItem =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#121712] hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#121712]';

export const VideoActionBar: React.FC<VideoActionBarProps> = ({
  chapterTitle,
  onToggleChapters,
  onReaction,
  onJumpToCheckpoint,
  checkpointLabel,
  onRaiseHand,
  isRaiseHandOpen,
}) => {
  const { open, setOpen, close, triggerRef, menuRef, onMenuKeyDown, onTriggerKeyDown } = useMenuButton();
  const run = (fn: () => void) => () => {
    close(false);
    fn();
  };

  const checkpointButton = onJumpToCheckpoint && (
    <button type="button" onClick={onJumpToCheckpoint} className={btn} title="Nhảy tới câu hỏi dừng">
      <SkipForward className="h-4 w-4" aria-hidden="true" />
      Câu hỏi dừng{checkpointLabel ? ` ${checkpointLabel}` : ''}
    </button>
  );
  const raiseHandButton = (
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
  );

  return (
    <div role="toolbar" aria-label="Công cụ video" className="flex items-center gap-2">
      {/* Wide screens: every action inline */}
      <button type="button" onClick={onToggleChapters} className={`${wideOnly} max-w-[240px]`} title="Phân cảnh và bản chép lời">
        <BookOpenText className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{chapterTitle}</span>
      </button>
      <span className="hidden flex-1 sm:block" />
      <button type="button" onClick={() => onReaction('understood')} className={wideOnly} title="Bấm nếu bạn đã hiểu đoạn này">
        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        Đã hiểu
      </button>
      <button type="button" onClick={() => onReaction('confused')} className={wideOnly} title="Bấm nếu bạn chưa rõ đoạn này">
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
        Chưa rõ
      </button>
      {checkpointButton}
      {raiseHandButton}

      {/* Small screens: the rest behind "Thêm" */}
      <div className="relative ml-auto sm:hidden">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls="video-actions-more"
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
          className={btn}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          Thêm
        </button>
        {open && (
          <div
            ref={menuRef}
            id="video-actions-more"
            role="menu"
            aria-label="Công cụ video khác"
            onKeyDown={onMenuKeyDown}
            className="absolute bottom-[calc(100%+8px)] right-0 z-30 w-[min(86vw,260px)] rounded-2xl border border-[#E2EAD2] bg-white p-2 shadow-[0_12px_32px_-8px_rgba(18,23,18,0.22)]"
          >
            <button type="button" role="menuitem" onClick={run(onToggleChapters)} className={menuItem}>
              <BookOpenText className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">Phân cảnh · {chapterTitle}</span>
            </button>
            <button type="button" role="menuitem" onClick={run(() => onReaction('understood'))} className={menuItem}>
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              Đã hiểu đoạn này
            </button>
            <button type="button" role="menuitem" onClick={run(() => onReaction('confused'))} className={menuItem}>
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
              Chưa rõ đoạn này
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
