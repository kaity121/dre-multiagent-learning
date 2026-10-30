// Slim stand-in for the paused lecture while the face-off takes the screen:
// title, position on the timeline, and a way back to the full video and class chat.
import React from 'react';
import { Pause, PanelsTopLeft } from 'lucide-react';
import { formatClock } from './journeyModel';

export interface VideoStripProps {
  title: string;
  currentTime: number;
  duration: number;
  /** Second of the pause question, marked on the bar. */
  checkpointSecond?: number | null;
  onShowVideo: () => void;
}

export const VideoStrip: React.FC<VideoStripProps> = ({ title, currentTime, duration, checkpointSecond, onShowVideo }) => {
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E2EAD2] bg-white px-3 py-2.5 sm:gap-4 sm:px-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#121712] text-white" aria-hidden="true">
        <Pause className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[#121712]">
          <span className="sr-only">Video đang dừng: </span>
          {title}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <div
            className="relative h-1.5 flex-1 rounded-full bg-[#E2EAD2]"
            role="progressbar"
            aria-label="Vị trí bài giảng"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatClock(currentTime)} trên ${formatClock(duration)}`}
          >
            <div className="h-full rounded-full bg-[#121712]" style={{ width: `${progress}%` }} />
            {typeof checkpointSecond === 'number' && duration > 0 && checkpointSecond <= duration && (
              <span
                aria-hidden="true"
                title={`Câu hỏi dừng ${formatClock(checkpointSecond)}`}
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border-2 border-[#121712] bg-[#C8F169]"
                style={{ left: `${(checkpointSecond / duration) * 100}%` }}
              />
            )}
          </div>
          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#3D4739]">
            {formatClock(currentTime)} / {formatClock(duration)}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onShowVideo}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#D5DFC4] bg-white px-3.5 text-[13px] font-semibold text-[#121712] transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]"
      >
        <PanelsTopLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Hiện video và lớp học</span>
        <span className="sm:hidden">Hiện video</span>
      </button>
    </div>
  );
};
