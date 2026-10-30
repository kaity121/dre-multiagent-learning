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
      <div className="relative w-full max-w-lg bg-white border border-[#E2EAD2] rounded-3xl p-6 shadow-2xl space-y-5 text-[#121712]">
        
        {/* Header: Avatar Cô Lam gọn đẹp + Tiêu đề rõ nét */}
        <div className="flex items-center gap-3.5">
          <TutorLamAvatar size="sm" />
          <div>
            <h2 className="font-extrabold text-xl text-[#121712] tracking-tight">
              Gấp sổ nghỉ tay một lát nhé!
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Tự học là một chặng đường dài, mệt thì cứ dừng lại nghỉ ngơi.
            </p>
          </div>
        </div>

        {/* Thẻ thông tin bài đang học dở */}
        <div className="p-4 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#121712]">
              Đang học dở bài:
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#E2EAD2] text-[#121712] font-mono text-[11px] font-semibold">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã lưu vào máy</span>
            </span>
          </div>

          <div className="font-bold text-sm sm:text-base text-[#121712] leading-snug">
            {displayTitle}
          </div>

          <p className="text-xs text-stone-700 italic leading-relaxed bg-white p-2.5 rounded-xl border border-[#E2EAD2]">
            Vị trí video và tiến độ các trạm đã được lưu trong trình duyệt này. Tin nhắn trong khung lớp học không được lưu. Khi nào sẵn sàng, bạn quay lại học tiếp cùng nhóm nhé.
          </p>

          {formattedSavedTime && (
            <div className="text-right font-mono text-[11px] text-stone-500">
              Lưu lúc: {formattedSavedTime}
            </div>
          )}
        </div>

        {/* Cụm nút hành động */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleResume}
            className="w-full py-2.5 px-4 rounded-xl bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors border border-[#A6D83B]"
          >
            <CoffeeCupIcon className="w-4 h-4 text-[#121712]" />
            <span>Quay lại học tiếp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleResume();
              handleOpenDrawer();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F3F8E8] hover:bg-[#E2EAD2] border border-[#E2EAD2] text-[#121712] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <OpenBookIcon className="w-4 h-4 text-[#121712]" />
            <span>Xem danh sách bài</span>
          </button>
        </div>

        {/* Nút reset nhỏ ở đáy */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-stone-500 hover:text-[#DC2626] underline cursor-pointer transition-colors"
          >
            Xoá bản lưu & bắt đầu lại từ đầu
          </button>
        </div>

      </div>
    </div>
  );
};

export const PauseOverlay = PauseModal;
