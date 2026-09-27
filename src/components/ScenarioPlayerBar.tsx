import React from 'react';
import { ClapperboardIcon, SparkleIcon } from './HandmadeArtwork';

interface ScenarioPlayerBarProps {
  isVisible: boolean;
  onToggleVisible: () => void;
  onRunScenario: (scenarioNumber: 1 | 2 | 3) => void;
  onTriggerNudge: () => void;
  onTriggerVideoScenario?: () => void;
  onReset: () => void;
  activeScenario: number | null;
  idleTimerSeconds: number;
}

export const ScenarioPlayerBar: React.FC<ScenarioPlayerBarProps> = ({
  isVisible,
  onToggleVisible,
  onRunScenario,
  onTriggerNudge,
  onTriggerVideoScenario,
  onReset,
  activeScenario,
  idleTimerSeconds,
}) => {
  // If not in debug mode or not visible, render absolutely nothing
  if (!isVisible) return null;

  return (
    <div className="w-full bg-[#FAF4E8] border-b border-[#E3D8C6] px-4 py-1.5 text-xs shadow-2xs animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-handwriting font-bold text-sm text-[#4E4135] flex items-center gap-1.5">
                <ClapperboardIcon className="w-4 h-4 text-[#8A7246]" />
                <span>Kịch bản kiểm thử (Pilot Test):</span>
              </span>
              <span className="text-[11px] text-[#807262] font-handwriting hidden sm:inline">
                (Tự động hiện khi có ?debug=1)
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Quick Trigger for the requested Video & Bo Clash Feature */}
              {onTriggerVideoScenario && (
                <button
                  onClick={onTriggerVideoScenario}
                  type="button"
                  className="px-3 py-1 rounded-xs border text-xs font-handwriting font-bold transition-all cursor-pointer bg-[#4E9B87] hover:bg-[#3D8270] text-white border-[#3A7564] shadow-xs flex items-center gap-1.5"
                >
                  <ClapperboardIcon className="w-3.5 h-3.5" />
                  <span>Test: Video & Bo Đấu Đá</span>
                </button>
              )}

              <button
                onClick={() => onRunScenario(1)}
                type="button"
                className={`px-3 py-1 rounded-xs border text-xs font-handwriting font-bold transition-all cursor-pointer ${
                  activeScenario === 1
                    ? 'bg-[#E8A33D] text-white border-[#C98420] shadow-2xs rotate-[-1deg]'
                    : 'bg-white hover:bg-[#F5EFE3] text-[#473B2E] border-[#D8CEBC]'
                }`}
              >
                Bộ 1: Đúng ngay (CLOSE)
              </button>

              <button
                onClick={() => onRunScenario(2)}
                type="button"
                className={`px-3 py-1 rounded-xs border text-xs font-handwriting font-bold transition-all cursor-pointer ${
                  activeScenario === 2
                    ? 'bg-[#E8A33D] text-white border-[#C98420] shadow-2xs rotate-[-1deg]'
                    : 'bg-white hover:bg-[#F5EFE3] text-[#473B2E] border-[#D8CEBC]'
                }`}
              >
                Bộ 2: HINT → Sửa đúng
              </button>

              <button
                onClick={() => onRunScenario(3)}
                type="button"
                className={`px-3 py-1 rounded-xs border text-xs font-handwriting font-bold transition-all cursor-pointer ${
                  activeScenario === 3
                    ? 'bg-[#E8A33D] text-white border-[#C98420] shadow-2xs rotate-[-1deg]'
                    : 'bg-white hover:bg-[#F5EFE3] text-[#473B2E] border-[#D8CEBC]'
                }`}
              >
                Bộ 3: PROBE → NUDGE
              </button>

              {/* Quick trigger for 45s Tutor Nudge test */}
              <button
                onClick={onTriggerNudge}
                type="button"
                title="Thử nghiệm trạng thái Cô Lam hỏi thăm (Tutor Nudge) ngay mà không cần đợi đủ 45s"
                className="px-2.5 py-1 bg-white hover:bg-[#EDF7F4] text-[#377A69] border border-[#4E9B87] rounded-xs text-xs font-handwriting font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <SparkleIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
                <span>Thử Nudge ({45 - idleTimerSeconds}s)</span>
              </button>

              <button
                onClick={onReset}
                type="button"
                className="px-2.5 py-1 bg-[#EBE4D5] hover:bg-[#DDD5C4] text-[#4A3D2F] rounded-xs text-xs font-handwriting font-bold cursor-pointer"
                title="Làm mới bài tập hiện tại"
              >
                Tự do thử
              </button>

              {/* Collapse/hide button */}
              <button
                onClick={onToggleVisible}
                type="button"
                className="px-2.5 py-1 bg-[#F0EBE1] hover:bg-[#E2D9CC] text-[#594B3C] rounded-xs text-xs font-handwriting font-bold border border-[#D5CBB9] cursor-pointer ml-1"
                title="Thu gọn thanh QA để demo"
              >
                ✕ Thu gọn
              </button>
            </div>
          </div>
        </div>
  );
};


