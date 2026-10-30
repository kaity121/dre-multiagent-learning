import React from 'react';
import { ShowcaseStatus, ShowcaseStationConfig } from '../../types/showcase';
import { Play, Pause, SkipForward, X, CheckCircle2 } from 'lucide-react';

interface ShowcaseHUDProps {
  status: ShowcaseStatus;
  currentStep: number;
  currentStation: ShowcaseStationConfig;
  progressPercent: number;
  remainingSeconds: number;
  onTogglePause: () => void;
  onNextStation: () => void;
  onStop: () => void;
}

export const ShowcaseHUD: React.FC<ShowcaseHUDProps> = ({
  status,
  currentStep,
  currentStation,
  progressPercent,
  remainingSeconds,
  onTogglePause,
  onNextStation,
  onStop,
}) => {
  if (status === 'idle') return null;

  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';

  return (
    <aside
      aria-label="Thanh điều khiển Showcase tự động"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 select-none"
    >
      <div className="bg-[#121712] text-white border border-[#3B4D3B] rounded-2xl shadow-2xl px-4 py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-5 min-w-[340px] sm:min-w-[580px]">
        {/* Phần 1: Trạng thái & Tên trạm hiện tại */}
        <div className="flex items-center gap-2.5 min-w-0">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-[#C8F169] shrink-0" />
          ) : (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {!isPaused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPaused ? 'bg-amber-400' : 'bg-rose-500'}`} />
            </span>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C8F169]">
                {isCompleted ? 'SHOWCASE HOÀN TẤT' : `SHOWCASE DEMO · BƯỚC ${currentStep}/4`}
              </span>
              {!isCompleted && (
                <span className="text-[11px] font-mono text-stone-400">
                  {remainingSeconds}s
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-[260px] sm:max-w-[300px]">
              {isCompleted ? 'Đã chạy qua toàn bộ 4 trạm liên hoàn' : currentStation.shortTitle}
            </span>
          </div>
        </div>

        {/* Phần 2: Thanh tiến trình nhịp thời gian */}
        {!isCompleted && (
          <div className="w-full sm:w-36 flex flex-col gap-1 shrink-0">
            <div className="w-full h-1.5 bg-[#263126] rounded-full overflow-hidden border border-[#3B4D3B]/50">
              <div
                className="h-full bg-[#C8F169] transition-all duration-200 ease-linear rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
            <span className="text-xs text-stone-300 font-medium truncate hidden sm:block">
              {currentStation.description}
            </span>
          </div>
        )}

        {/* Phần 3: Cụm nút thao tác điều khiển */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {!isCompleted && (
            <>
              {/* Nút Tạm dừng / Tiếp tục */}
              <button
                type="button"
                onClick={onTogglePause}
                title={isPaused ? 'Tiếp tục chạy (Phím tắt: Space)' : 'Tạm dừng demo (Phím tắt: Space)'}
                className="h-7 px-2.5 rounded-lg bg-[#263126] hover:bg-[#344234] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-[#3B4D3B]"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 text-[#C8F169] fill-[#C8F169]" />
                    <span className="text-xs">Tiếp tục</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-stone-300" />
                    <span className="text-xs">Tạm dừng</span>
                  </>
                )}
              </button>

              {/* Nút Trạm kế tiếp */}
              <button
                type="button"
                onClick={onNextStation}
                title="Chuyển ngay sang trạm tiếp theo"
                className="h-7 px-2.5 rounded-lg bg-[#263126] hover:bg-[#344234] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-[#3B4D3B]"
              >
                <span className="text-xs hidden sm:inline">Trạm kế tiếp</span>
                <SkipForward className="w-3 h-3 text-[#C8F169]" />
              </button>
            </>
          )}

          {/* Nút Thoát */}
          <button
            type="button"
            onClick={onStop}
            title="Thoát khỏi chế độ Showcase (Phím tắt: Esc hoặc F2)"
            className="h-7 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 text-rose-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-rose-300" />
            <span className="text-xs">Thoát (Esc)</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
