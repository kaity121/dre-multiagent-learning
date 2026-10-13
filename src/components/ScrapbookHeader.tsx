// File: src/components/ScrapbookHeader.tsx
import React, { useState } from 'react';
import { MisconceptionItem, LearningMode } from '../types/dre';
import { 
  OpenBookIcon, 
  CoffeeCupIcon, 
  SoundSpeakerIcon,
  BookmarkRibbonIcon
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

interface ScrapbookHeaderProps {
  currentLesson: MisconceptionItem;
  currentMode?: LearningMode;
  isBackendLive?: boolean;
  onSelectMode?: (mode: LearningMode) => void;
  onOpenPause: () => void;
  onOpenLessonDrawer: () => void;
  onOpenHelp: () => void;
  onOpenAiInspector?: () => void;
  onOpenFlowGuide?: () => void;
}

const cleanText = (str?: string) => (str ? str.replace(/\u20d7/g, '') : '');

export const ScrapbookHeader: React.FC<ScrapbookHeaderProps> = ({
  currentLesson,
  currentMode = 'video_clash',
  onSelectMode,
  onOpenPause,
  onOpenLessonDrawer,
}) => {
  const [isSoundOn, setIsSoundOn] = useState<boolean>(sound.getEnabled());

  const handleToggleSound = () => {
    const next = sound.toggle();
    setIsSoundOn(next);
    if (next) sound.playPencilTap();
  };

  return (
    <header className="w-full bg-[#FAF8F5] border-b border-[#E2D9C8] px-4 py-2 shrink-0 select-none">
      <div className="w-[96vw] max-w-[1600px] mx-auto flex items-center justify-between gap-3">
        
        {/* CỤM TRÁI: Logo DRE Learning + Nhãn cấp độ bài học (Đã xóa sạch nút GPT-6 Live!) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectMode?.('video_clash')}
            className="flex items-center gap-2.5 cursor-pointer group text-left"
            title="DRE Learning Platform"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E8A33D] text-white font-extrabold text-base flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              D
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#1E242B]">
              DRE Learning
            </span>
          </button>

          {/* Nhãn bài học hiện tại */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FEF3C7] border border-[#F59E0B]/40 text-[#92400E] text-xs font-semibold">
            <BookmarkRibbonIcon className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
            <span>
              {cleanText(currentLesson.id)} · {cleanText(currentLesson.levelLabel)}
            </span>
          </div>
        </div>

        {/* CỤM PHẢI: Bật/Tắt Âm thanh + Đổi bài (khi ở Trạm 2) + Tạm dừng */}
        <div className="flex items-center gap-2">
          {/* Nút bật/tắt âm thanh xúc giác */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
              isSoundOn
                ? 'bg-[#EBF7F3] text-[#1B4338] border-[#99D5C4]'
                : 'bg-white text-[#8A7D6F] border-[#D8CEBE]'
            }`}
            title={isSoundOn ? 'Âm thanh: Đang bật' : 'Âm thanh: Đang tắt'}
          >
            <SoundSpeakerIcon isMuted={!isSoundOn} className="w-4 h-4" />
          </button>

          {/* Nút đổi bài tập (Chỉ hiện khi đang ở Trạm 2 - Sổ tay bắt lỗi) */}
          {currentMode === 'worksheet' && (
            <button
              type="button"
              onClick={onOpenLessonDrawer}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#D8CEBE] text-[#1E242B] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <OpenBookIcon className="w-3.5 h-3.5 text-[#1B4338]" />
              <span>Đổi bài ({currentLesson.id})</span>
            </button>
          )}

          {/* Nút Tạm dừng */}
          <button
            type="button"
            onClick={onOpenPause}
            className="px-3.5 py-1.5 rounded-full bg-[#EBF7F3] hover:bg-[#D9F0E8] border border-[#2E6859] text-[#1B4338] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <CoffeeCupIcon className="w-3.5 h-3.5 text-[#1B4338]" />
            <span>Tạm dừng</span>
          </button>
        </div>

      </div>
    </header>
  );
};
