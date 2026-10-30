import React from 'react';
import { PhaseType, PhaseStatus } from '../../types/reasoning';
import { Check, Loader2, Clock, AlertCircle } from 'lucide-react';

interface PhaseStepperProps {
  currentPhase: PhaseType | null;
  phaseStatuses: Record<PhaseType, PhaseStatus>;
}

const phasesConfig: { id: PhaseType; stepNum: number; label: string; description: string }[] = [
  { id: 'extract', stepNum: 1, label: 'Trích xuất đề bài', description: 'Phân tích thực thể hình học' },
  { id: 'rag', stepNum: 2, label: 'Truy hồi kiến thức', description: 'Truy cứu SGK & định lý' },
  { id: 'roundtable', stepNum: 3, label: 'Bàn tròn phản biện', description: 'Tranh luận đa tác nhân' },
  { id: 'bloom', stepNum: 4, label: 'Đánh giá nhận thức', description: 'Xếp mức Tháp Bloom L1–L6' },
];

export const PhaseStepper: React.FC<PhaseStepperProps> = ({ currentPhase, phaseStatuses }) => {
  return (
    <div className="w-full bg-[#FDFEFA] p-5 sm:p-6 rounded-3xl border border-[#E2EAD2] shadow-2xs">
      <div className="relative">
        {/* Đường nối ngang (Connecting line) chạy phía sau các vòng tròn mốc */}
        <div className="hidden sm:block absolute top-5 left-12 right-12 h-0.5 bg-stone-200 -z-0">
          <div
            className="h-full bg-[#121712] transition-all duration-500"
            style={{
              width:
                phaseStatuses.bloom === 'completed'
                  ? '100%'
                  : phaseStatuses.roundtable === 'completed' || currentPhase === 'bloom'
                  ? '75%'
                  : phaseStatuses.rag === 'completed' || currentPhase === 'roundtable'
                  ? '50%'
                  : phaseStatuses.extract === 'completed' || currentPhase === 'rag'
                  ? '25%'
                  : '0%',
            }}
          />
        </div>

        {/* 4 Mốc tiến trình */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
          {phasesConfig.map((phase, idx) => {
            const status = phaseStatuses[phase.id] || 'pending';
            const isCompleted = status === 'completed';
            const isActive = (currentPhase === phase.id || status === 'running') && !isCompleted;

            return (
              <div
                key={phase.id}
                className="flex flex-col items-center text-center p-2 rounded-2xl transition-all"
              >
                {/* Node hình tròn ở giữa */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all duration-300 shadow-2xs ${
                    isCompleted
                      ? 'bg-[#121712] text-white ring-2 ring-[#121712]'
                      : isActive
                      ? 'bg-[#C8F169] text-[#121712] ring-4 ring-[#C8F169]/40 border border-[#121712]'
                      : 'bg-white text-stone-500 border-2 border-stone-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white stroke-[2.5]" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-[#121712] animate-spin" />
                  ) : (
                    <span>0{phase.stepNum}</span>
                  )}
                </div>

                {/* Tiêu đề & mô tả */}
                <div className="mt-2.5 space-y-1">
                  <div className="text-xs sm:text-sm font-bold text-[#121712] leading-tight">
                    {phase.label}
                  </div>
                  <div className="text-xs text-stone-600 font-medium line-clamp-1">
                    {phase.description}
                  </div>

                  {/* Badge trạng thái */}
                  <div className="pt-1">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Hoàn thành</span>
                      </span>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#121712] bg-[#C8F169] px-2.5 py-0.5 rounded-full shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#121712] animate-ping" />
                        <span>Đang chạy</span>
                      </span>
                    ) : status === 'error' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Lỗi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>Chờ</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
