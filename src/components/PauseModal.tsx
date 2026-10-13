// File: src/components/PauseModal.tsx
import React from 'react';
import { 
  TutorLamAvatar, 
  CoffeeCupIcon, 
  OpenBookIcon, 
  CheckCircleIcon 
} from './HandmadeArtwork';

export interface PauseModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onResume?: () => void;
  onResetOrChange?: () => void;
  onOpenLessonDrawer?: () => void;
  topicTitle?: string;
  currentLesson?: { topic?: string };
  savedTimestamp?: number;
  lastSavedTime?: string | null;
  onClearSavedProgress?: () => void;
  onResetProgress?: () => void;
}

const cleanText = (str?: string) => (str ? str.replace(/\u20d7/g, '') : '');

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onClose,
  onResume,
  onResetOrChange,
  onOpenLessonDrawer,
  topicTitle = '',
  currentLesson,
  savedTimestamp,
  lastSavedTime,
  onClearSavedProgress,
  onResetProgress,
}) => {
  if (!isOpen) return null;

  const handleResume = onResume || onClose || (() => {});
  const handleOpenDrawer = onOpenLessonDrawer || onResetOrChange || (() => {});
  const handleReset = onResetProgress || onClearSavedProgress || (() => {});
  const displayTitle = cleanText(currentLesson?.topic || topicTitle || 'Toán 12: Vectơ trong không gian');
  const formattedSavedTime = lastSavedTime || (savedTimestamp ? new Date(savedTimestamp).toLocaleTimeString('vi-VN') : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150">
      {/* Khung Modal đục đặc 100% (#FFFDF7), phẳng, bo góc hiện đại, không băng dính/đinh ghim */}
      <div className="relative w-full max-w-lg bg-[#FFFDF7] border border-[#E2D9C8] rounded-2xl p-6 shadow-2xl space-y-5 text-[#1E242B]">
        
        {/* Header: Avatar Cô Lam gọn đẹp + Tiêu đề rõ nét */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF7F3] border border-[#99D5C4] flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            <TutorLamAvatar size="sm" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-[#1E242B] tracking-tight">
              Gấp sổ nghỉ tay một lát nhé!
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6254] mt-0.5">
              Tự học là một chặng đường dài, mệt thì cứ dừng lại nghỉ ngơi.
            </p>
          </div>
        </div>

        {/* Thẻ thông tin bài đang học dở */}
        <div className="p-4 rounded-xl bg-white border border-[#E2D9C8] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7D6F]">
              Đang học dở bài:
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF7F3] border border-[#99D5C4] text-[#1B4338] font-mono text-[11px] font-semibold">
              <CheckCircleIcon className="w-3.5 h-3.5 text-[#1B4338]" />
              <span>Đã lưu vào máy</span>
            </span>
          </div>

          <div className="font-bold text-sm sm:text-base text-[#1E242B] leading-snug">
            {displayTitle}
          </div>

          <p className="text-xs text-[#2E6859] italic leading-relaxed bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EFE8DC]">
            “Vị trí của bạn và mọi ghi chú đã được lưu vào bộ nhớ trình duyệt. Khi nào sẵn sàng, bạn quay lại học tiếp cùng nhóm nhé.”
          </p>

          {formattedSavedTime && (
            <div className="text-right font-mono text-[11px] text-[#8A7D6F]">
              Lưu lúc: {formattedSavedTime}
            </div>
          )}
        </div>

        {/* Cụm nút hành động */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleResume}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2E7D67] hover:bg-[#236351] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <CoffeeCupIcon className="w-4 h-4 text-white" />
            <span>Quay lại học tiếp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleResume();
              handleOpenDrawer();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F3EFE6] hover:bg-[#E6DFD1] border border-[#D8CEBC] text-[#1E242B] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <OpenBookIcon className="w-4 h-4 text-[#5C5043]" />
            <span>Xem danh sách bài</span>
          </button>
        </div>

        {/* Nút reset nhỏ ở đáy */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-[#8A7D6F] hover:text-[#DC2626] underline cursor-pointer transition-colors"
          >
            Xoá bản lưu & bắt đầu lại từ đầu
          </button>
        </div>

      </div>
    </div>
  );
};

export const PauseOverlay = PauseModal;
