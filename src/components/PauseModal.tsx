import React from 'react';
import { WashiTape, PushPin, TutorLamAvatar, CoffeeMugIcon, OpenBookIcon, CheckCircleIcon } from './HandmadeArtwork';

interface PauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetOrChange: () => void;
  topicTitle: string;
  savedTimestamp?: number;
  onClearSavedProgress?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onClose,
  onResetOrChange,
  topicTitle,
  savedTimestamp,
  onClearSavedProgress,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/35 backdrop-blur-xs">
      <div className="relative max-w-md w-full bg-[#FAF6EE] border-2 border-[#DFD7C7] rounded-sm p-6 sketchbook-shadow notebook-sheet rotate-1">
        {/* Decorative corner tape */}
        <WashiTape variant="blue" className="absolute -top-2.5 left-8 w-20 rotate-[-3deg]" />
        <PushPin color="#4E9B87" className="absolute top-3 right-4" />

        <div className="flex items-center gap-3 mb-4">
          <TutorLamAvatar size="sm" className="rotate-[-2deg]" />
          <div>
            <h2 className="text-2xl font-bold font-handwriting text-[#2D453E]">
              Gấp sổ nghỉ tay một lát nhé!
            </h2>
            <p className="text-xs text-[#6F645A] font-handwriting">
              Tự học là một chặng đường dài, mệt thì cứ dừng lại.
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#FFFDF7] border border-[#EBE3D3] rounded-xs mb-5">
          <div className="flex items-center justify-between text-xs text-[#8A7C6E] font-handwriting font-bold mb-1">
            <span>Đang học dở bài:</span>
            <span className="text-[11px] font-mono text-[#2E6859] bg-[#E8F5F1] px-2 py-0.5 rounded-full border border-[#BCE1D7] flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3 text-[#2E6859]" />
              <span>Đã lưu vào máy</span>
            </span>
          </div>
          <div className="text-sm font-semibold text-[#3C342C]">
            {topicTitle}
          </div>
          <p className="text-sm font-handwriting text-[#3D695D] mt-2 italic">
            &ldquo;Vị trí của em và mọi câu chữ đã được lưu vào bộ nhớ trình duyệt. Khi nào sẵn sàng, em quay lại học tiếp cùng Bo và cô nhé.&rdquo;
          </p>
          {savedTimestamp && (
            <div className="text-[10px] text-[#A69784] font-mono mt-1 text-right">
              Lưu lúc: {new Date(savedTimestamp).toLocaleTimeString('vi-VN')}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 px-4 py-2.5 bg-[#4E9B87] hover:bg-[#438775] text-white font-handwriting text-base font-bold rounded-xs border border-[#377A69] shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CoffeeMugIcon className="w-4 h-4 text-white" />
            <span>Quay lại học tiếp</span>
          </button>
          <button
            onClick={onResetOrChange}
            type="button"
            className="px-4 py-2.5 bg-white hover:bg-[#F3EFE6] text-[#54483C] font-handwriting text-sm font-bold rounded-xs border border-[#DED7C9] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <OpenBookIcon className="w-3.5 h-3.5 text-[#8A7246]" />
            <span>Xem danh sách bài</span>
          </button>
        </div>

        {onClearSavedProgress && (
          <div className="mt-3 text-center">
            <button
              onClick={onClearSavedProgress}
              type="button"
              className="text-xs font-handwriting text-[#A39281] hover:text-[#7A6B5C] underline cursor-pointer"
            >
              Xoá bản lưu &amp; bắt đầu lại từ đầu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
