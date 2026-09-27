import React from 'react';
import { BoAvatar, TutorLamAvatar, WashiTape, PushPin, SparkleIcon } from './HandmadeArtwork';
import { LearnerLevel } from '../types/dre';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onStart: () => void;
  selectedLevel: LearnerLevel;
  onSelectLevel: (lvl: LearnerLevel) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStart,
  selectedLevel = 'beginner',
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-[#FAF6EE] border-2 border-[#DFD7C7] rounded-sm p-6 sm:p-8 sketchbook-shadow notebook-sheet rotate-[-0.5deg]">
        {/* Close button if user re-opened modal via help button */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3 right-10 text-[#8C8074] hover:text-[#3B3224] font-mono text-sm px-1.5 py-0.5 rounded-xs hover:bg-[#EBE2D0] cursor-pointer"
            title="Đóng cửa sổ"
          >
            ✕
          </button>
        )}

        {/* Decorative Washi Tapes at Corners */}
        <WashiTape variant="blue" className="absolute -top-2.5 left-10 w-24 -rotate-2" />
        <WashiTape variant="pink" className="absolute -top-2.5 right-12 w-20 rotate-3" />
        <PushPin color="#4E9B87" className="absolute top-3 right-4" />

        {/* Header / Journal Title */}
        <div className="text-center mb-6 pt-2">
          <span className="inline-block px-3.5 py-1 bg-[#F5D65D] text-[#3A3225] font-handwriting text-sm font-bold shadow-xs rotate-[-1deg] border border-[#ECD055]">
            Sổ tay thử nghiệm DRE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2E2925] tracking-tight mt-2 font-handwriting">
            Chào mừng em đến với góc học Toán!
          </h1>
          <p className="text-xs text-[#73685E] mt-1 font-handwriting">
            Không thi cử · Không sợ sai · Cùng Bo soi lỗi và học sâu hơn
          </p>
        </div>

        {/* Center: Bo & Cô Lam Polaroids Side-by-Side (CUTE CHIBI ARTWORK) */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 my-4 py-2">
          <div className="text-center">
            <BoAvatar size="lg" className="-rotate-3 hover:rotate-0 transition-transform" />
            <div className="mt-2 text-sm font-handwriting font-bold text-[#A86E18]">
              Bo (Bạn học AI)
            </div>
            <div className="text-xs text-[#786D62] font-handwriting italic max-w-[130px] leading-tight">
              &ldquo;Tớ đôi khi tính nhầm á, cậu soi giúp tớ nha!&rdquo;
            </div>
          </div>

          <div className="text-center">
            <TutorLamAvatar size="lg" className="rotate-2 hover:rotate-0 transition-transform" />
            <div className="mt-2 text-sm font-handwriting font-bold text-[#377A69]">
              Cô Lam (Giáo viên AI)
            </div>
            <div className="text-xs text-[#786D62] font-handwriting italic max-w-[130px] leading-tight">
              &ldquo;Cứ từ từ suy nghĩ, cô luôn ở cạnh hỗ trợ em.&rdquo;
            </div>
          </div>
        </div>

        {/* Torn Notebook Paper Card with Intro Text */}
        <div className="my-5 p-4 bg-[#FFFDF7] border border-[#E8DFC9] rounded-xs shadow-xs relative">
          <div className="absolute -top-2.5 left-4 text-xs font-handwriting text-[#9E9080] bg-[#FFFDF7] px-1 font-bold">
            Lời nhắn nhủ
          </div>
          <p className="font-handwriting text-lg sm:text-xl text-[#3C352E] leading-relaxed">
            &ldquo;Bo là bạn học AI của em — Bo sẽ đôi khi giải bài sai đó! Nhiệm vụ của em là 
            <span className="bg-[#F5D65D]/65 px-1.5 mx-0.5 rounded-xs font-bold text-[#2A231C]"> tìm ra chỗ Bo sai </span> 
            và giải thích vì sao. Cô Lam sẽ giúp em nếu bí.&rdquo;
          </p>
        </div>

        {/* Level Selection */}
        <div className="mb-6">
          <div className="text-xs font-handwriting font-bold text-[#6B5E52] mb-2 flex items-center justify-between">
            <span>Chọn mức độ bài học:</span>
            <span className="text-xs text-[#8C8074] font-normal">Có thể đổi bất cứ lúc nào</span>
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
                  className={`px-2 py-2 text-xs font-handwriting font-bold text-center rounded-xs transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8A33D] text-white border-[#C98420] shadow-xs rotate-[-0.5deg]'
                      : 'bg-white/80 text-[#54483C] border-[#DED7C9] hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Single sticker-style "Bắt đầu" button in amber */}
        <div className="text-center pt-2">
          <button
            onClick={onStart}
            type="button"
            className="w-full sm:w-auto px-8 py-3 bg-[#E8A33D] hover:bg-[#D9932E] active:scale-98 text-white font-handwriting text-2xl font-bold tracking-wide rounded-xs border-2 border-[#C98420] shadow-md transition-all rotate-[-0.5deg] hover:rotate-0 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Bắt đầu mở sổ học ngay</span>
            <SparkleIcon className="w-5 h-5 text-white" />
          </button>
          <div className="text-xs text-[#8A7E73] font-handwriting mt-2">
            Không cần tài khoản · Tự động ghi nhớ trên máy của em · Riêng tư 100%
          </div>
        </div>
      </div>
    </div>
  );
};
