import React from 'react';
import { AgentAvatar } from './AgentAvatar';
import { LearnerLevel } from '../types/dre';
import { Sparkles, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onStart: () => void;
  selectedLevel?: LearnerLevel;
  onSelectLevel: (lvl: LearnerLevel) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStart,
  selectedLevel = 'intermediate',
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Be_Vietnam_Pro',system-ui,sans-serif] text-[#121712]">
      <div 
        role="dialog"
        aria-labelledby="onboarding-modal-title"
        className="relative max-w-[640px] w-full bg-white border border-[#E2EAD2] rounded-[32px] shadow-[0_24px_60px_rgba(18,23,18,0.18)] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header Cố Định (Shrink-0) */}
        <div className="shrink-0 px-6 pt-5 pb-3 border-b border-[#E2EAD2] relative bg-white text-center">
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full border border-[#E2EAD2] bg-white flex items-center justify-center hover:bg-stone-50 cursor-pointer transition text-stone-700"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4 text-[#121712]" />
            </button>
          )}

          <div className="pr-6 sm:pr-0">
            <span className="inline-block px-3 py-0.5 bg-[#F3F8E8] text-[#4A5540] text-xs font-semibold rounded-full border border-[#E2EAD2] mb-1.5">
              Sổ tay thử nghiệm DRE
            </span>
            <h1 
              id="onboarding-modal-title" 
              style={{ fontSize: '28px', lineHeight: 1.2 }}
              className="font-extrabold text-[#121712] tracking-tight m-0 text-balance"
            >
              Chào mừng bạn đến với góc học Toán!
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 font-normal">
              Không thi cử · Không sợ sai · Cùng Bo soi lỗi và học sâu hơn
            </p>
          </div>
        </div>

        {/* Thân Modal Cuộn Bên Trong (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 min-h-[200px]">
          {/* 2 Thẻ phẳng Bo & Cô Lam xếp ngang gọn, bo 24px */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Thẻ Bo */}
            <div className="bg-[#F3F8E8] border border-[#E2EAD2] rounded-[24px] p-3 flex items-center gap-3">
              <AgentAvatar role="bo" size={40} tooltip />
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#121712] leading-tight">Bo</div>
                <div className="text-xs font-medium text-stone-600 mt-0.5">Bạn học AI · Hay tính nhầm</div>
              </div>
            </div>

            {/* Thẻ Cô Lam */}
            <div className="bg-[#F3F8E8] border border-[#E2EAD2] rounded-[24px] p-3 flex items-center gap-3">
              <AgentAvatar role="colam" size={40} tooltip />
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#121712] leading-tight">Cô Lam</div>
                <div className="text-xs font-medium text-stone-600 mt-0.5">Giáo viên AI · Luôn đồng hành</div>
              </div>
            </div>
          </div>

          {/* Lời nhắn nhủ với vùng tô lime nhạt #E6F4BE */}
          <div className="p-3.5 rounded-2xl bg-[#FDFEFA] border border-[#E2EAD2] space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Lời nhắn nhủ
            </div>
            <p className="text-xs sm:text-sm text-[#121712] leading-relaxed m-0">
              “Bo sẽ đôi khi giải bài sai! Nhiệm vụ của bạn là{' '}
              <span className="bg-[#E6F4BE] text-[#121712] px-1.5 py-0.5 rounded-md font-bold inline-block border border-[#D4E8A3]">
                tìm ra chỗ Bo sai
              </span>{' '}
              và giải thích bản chất. Cô Lam sẽ hỗ trợ khi bạn cần gợi ý.”
            </p>
          </div>

          {/* Mức độ bài học: 3 ô phẳng, ô đang chọn nền đen chữ trắng */}
          <div id="onboarding-level-selection" className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>Chọn mức độ bài học:</span>
              <span className="font-normal text-stone-500">Có thể đổi bất cứ lúc nào</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as LearnerLevel[]).map((lvl) => {
                const label = lvl === 'beginner' ? 'Mới học lần đầu' : lvl === 'intermediate' ? 'Đã học rồi' : 'Đang ôn luyện';
                const isSelected = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => onSelectLevel(lvl)}
                    type="button"
                    className={`h-10 px-2.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center text-center ${
                      isSelected
                        ? 'bg-[#121712] text-white border-[#121712] shadow-xs'
                        : 'bg-white text-stone-800 border-[#E2EAD2] hover:bg-[#F3F8E8]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Cố Định Ghim Đáy (Fixed Footer) */}
        <div className="shrink-0 px-6 py-3.5 bg-white border-t border-[#E2EAD2] flex flex-col items-center gap-1.5">
          <button
            onClick={onStart}
            type="button"
            className="w-full h-11 sm:h-12 rounded-full bg-[#C8F169] hover:bg-[#bbee52] text-[#121712] font-extrabold text-sm sm:text-base tracking-wide border border-[#A6D83B] shadow-xs transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Bắt đầu mở sổ học ngay</span>
            <Sparkles className="w-4 h-4 text-[#121712]" />
          </button>
          <div className="text-xs text-stone-500 text-center font-normal">
            Không cần tài khoản · Tự động ghi nhớ trên máy của bạn · Riêng tư 100%
          </div>
        </div>
      </div>
    </div>
  );
};
