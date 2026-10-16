import React from 'react';
import { ClapperboardIcon, SparkleIcon, VideoPlayIcon, PencilIcon, TeacherHatIcon } from './HandmadeArtwork';
import { LearningMode } from '../types/dre';

interface ScenarioPlayerBarProps {
  isVisible: boolean;
  onToggleVisible: () => void;
  onRunScenario: (scenarioNumber: 1 | 2 | 3) => void;
  onTriggerNudge: () => void;
  onTriggerVideoStart?: () => void;
  onTriggerVideoScenario?: () => void;
  onTriggerStation?: (station: LearningMode) => void;
  onReset: () => void;
  activeScenario: number | null;
  idleTimerSeconds: number;
  isAutoWalking?: boolean;
  autoWalkStep?: number;
  onToggleAutoWalk?: () => void;
  showAllTimeline?: boolean;
  onToggleShowAllTimeline?: () => void;
}

export const ScenarioPlayerBar: React.FC<ScenarioPlayerBarProps> = ({
  isVisible,
  onToggleVisible,
  onRunScenario,
  onTriggerNudge,
  onTriggerVideoStart,
  onTriggerVideoScenario,
  onTriggerStation,
  onReset,
  activeScenario,
  idleTimerSeconds,
  isAutoWalking = false,
  autoWalkStep = 1,
  onToggleAutoWalk,
  showAllTimeline = false,
  onToggleShowAllTimeline,
}) => {
  if (!isVisible) return null;

  return (
    <div className="w-full bg-[#FAF4E8] border-b border-[#E3D8C6] px-4 py-2 text-xs shadow-xs animate-in slide-in-from-top-2 duration-150 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-[#4E4135] flex items-center gap-1.5">
            <ClapperboardIcon className="w-4 h-4 text-[#8A7246]" />
            <span>Test Case Demo 4 Trạm:</span>
          </span>

          {/* NÚT CHẠY TỰ ĐỘNG LIÊN HOÀN (AUTO-PLAY TOÀN BỘ) */}
          {onToggleAutoWalk && (
            <button
              onClick={onToggleAutoWalk}
              type="button"
              className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-xs ${
                isAutoWalking
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Tự động phát liên tục tuần tự qua tất cả các trạm và tình huống sư phạm"
            >
              {isAutoWalking ? (
                <>
                  <span>⏹ Dừng tự động</span>
                  <span className="text-[10px] bg-rose-800/80 px-1.5 py-0.2 rounded font-mono">
                    Bước {autoWalkStep}/6
                  </span>
                </>
              ) : (
                <>
                  <span>▶ Chạy tự động liên tục</span>
                  <span className="text-[10px] bg-emerald-800/80 px-1.5 py-0.2 rounded">1 chạm</span>
                </>
              )}
            </button>
          )}

          <span className="text-[11px] text-[#807262] hidden lg:inline ml-1 font-medium">
            (Hoặc bấm nhảy nhanh từng chặng bên dưới)
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {/* 1. Trạm 1: Khởi động 00:00 */}
          {onTriggerVideoStart && (
            <button
              onClick={onTriggerVideoStart}
              type="button"
              className="px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer bg-white hover:bg-[#EBF7F3] text-[#1B5749] border-[#3D8F7B] flex items-center gap-1 transition-colors"
              title="Về phút 00:00 để quan sát 24 thảo luận sinh viên bám sát bảng thầy Tiến"
            >
              <VideoPlayIcon className="w-3.5 h-3.5 text-[#2C7866]" />
              <span>1. Video (00:00)</span>
            </button>
          )}

          {/* 2. Trạm 1: Điểm dừng 37:13 */}
          {onTriggerVideoScenario && (
            <button
              onClick={onTriggerVideoScenario}
              type="button"
              className="px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer bg-[#4E9B87] hover:bg-[#3D8270] text-white border-[#3A7564] shadow-xs flex items-center gap-1 transition-colors"
              title="Nhảy thẳng tới giây 37:13, kích hoạt câu hỏi bẫy và Bo tranh luận"
            >
              <ClapperboardIcon className="w-3.5 h-3.5" />
              <span>2. Dừng (37:13)</span>
            </button>
          )}

          {/* 3. Trạm 2: Sổ tay bắt lỗi Bo */}
          {onTriggerStation && (
            <button
              onClick={() => onTriggerStation('worksheet')}
              type="button"
              className="px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer bg-white hover:bg-[#FFF5E0] text-[#7D490E] border-[#E8A33D] flex items-center gap-1 transition-colors"
              title="Chuyển sang Trạm 2 để bắt lỗi Bo viết xuôi ở Bước 2"
            >
              <PencilIcon className="w-3.5 h-3.5 text-[#B8781B]" />
              <span>3. Trạm 2 (Bắt lỗi)</span>
            </button>
          )}

          {/* 4. Trạm 3: POE Trí vs Bo */}
          {onTriggerStation && (
            <button
              onClick={() => onTriggerStation('predict_poe')}
              type="button"
              className="px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer bg-white hover:bg-[#FEF8DC] text-[#7A5B05] border-[#D9A716] flex items-center gap-1 transition-colors"
              title="Chuyển sang Trạm 3 kiểm chứng hướng vectơ ngược chiều"
            >
              <SparkleIcon className="w-3.5 h-3.5 text-[#B3870E]" />
              <span>4. Trạm 3 (POE)</span>
            </button>
          )}

          {/* 5. Trạm 4: Dạy kèm Bo */}
          {onTriggerStation && (
            <button
              onClick={() => onTriggerStation('protege_teaching')}
              type="button"
              className="px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer bg-white hover:bg-[#EBF7E7] text-[#2B6121] border-[#5FA04E] flex items-center gap-1 transition-colors"
              title="Chuyển sang Trạm 4 dạy kèm Bo & tổng kết Bloom"
            >
              <TeacherHatIcon className="w-3.5 h-3.5 text-[#3D7C2D]" />
              <span>5. Trạm 4 (Dạy Bo)</span>
            </button>
          )}

          <span className="w-px h-4 bg-[#D8CEBC] mx-0.5 hidden sm:inline" />

          {/* Các bộ test case chuẩn sư phạm ở Trạm 2 */}
          <button
            onClick={() => onRunScenario(1)}
            type="button"
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer transition-colors ${
              activeScenario === 1
                ? 'bg-[#E8A33D] text-white border-[#C98420]'
                : 'bg-white hover:bg-[#F5EFE3] text-[#473B2E] border-[#D8CEBC]'
            }`}
            title="Kịch bản 1: Học sinh bắt đúng lỗi dòng 2 và giải thích chuẩn ngay"
          >
            Đúng ngay
          </button>

          <button
            onClick={() => onRunScenario(2)}
            type="button"
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer transition-colors ${
              activeScenario === 2
                ? 'bg-[#E8A33D] text-white border-[#C98420]'
                : 'bg-white hover:bg-[#F5EFE3] text-[#473B2E] border-[#D8CEBC]'
            }`}
            title="Kịch bản 2: Học sinh bắt nhầm dòng -> Cô Lam gợi ý HINT -> Sửa lại đúng"
          >
            HINT
          </button>

          <button
            onClick={onTriggerNudge}
            type="button"
            title="Thử nghiệm trạng thái Cô Lam hỏi thăm (Tutor Nudge) ngay mà không cần đợi đủ 45s"
            className="px-2 py-1 bg-white hover:bg-[#EDF7F4] text-[#377A69] border border-[#4E9B87] rounded-md text-xs font-medium cursor-pointer flex items-center gap-1"
          >
            <SparkleIcon className="w-3 h-3 text-[#E8A33D]" />
            <span>Nudge ({45 - idleTimerSeconds}s)</span>
          </button>

          {/* Nút bật/tắt toàn bộ 24 thảo luận (chuyển từ thanh chat sang F2 theo yêu cầu) */}
          {onToggleShowAllTimeline && (
            <button
              onClick={onToggleShowAllTimeline}
              type="button"
              className={`px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                showAllTimeline
                  ? 'bg-[#0e7490] text-white border-[#0891b2] shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-[#D8CEBC]'
              }`}
              title="Bật/Tắt hiển thị toàn bộ 24 thảo luận sinh viên bám sát video"
            >
              <span>💬 {showAllTimeline ? 'Đang hiện 24 tin' : 'Hiện toàn bộ (22 tin)'}</span>
            </button>
          )}

          <button
            onClick={onReset}
            type="button"
            className="px-2 py-1 bg-[#EBE4D5] hover:bg-[#DDD5C4] text-[#4A3D2F] rounded-md text-xs font-medium cursor-pointer"
            title="Làm mới bài tập hiện tại"
          >
            Reset
          </button>

          <button
            onClick={onToggleVisible}
            type="button"
            className="px-2 py-1 bg-[#F0EBE1] hover:bg-[#E2D9CC] text-[#594B3C] rounded-md text-xs font-bold border border-[#D5CBB9] cursor-pointer ml-1"
            title="Ẩn thanh test case"
          >
            ✕ Ẩn
          </button>
        </div>
      </div>
    </div>
  );
};
