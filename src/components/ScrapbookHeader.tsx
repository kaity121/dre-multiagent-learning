import React, { useState } from 'react';
import { MisconceptionItem, LearningMode } from '../types/dre';
import { 
  CoffeeMugIcon, 
  OpenBookIcon, 
  BookmarkTagIcon, 
  SwordsDebateIcon, 
  SparkleIcon,
  CompassIcon,
  LightningZapIcon,
  SoundSpeakerIcon
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

interface ScrapbookHeaderProps {
  currentLesson: MisconceptionItem;
  currentMode: LearningMode;
  isBackendLive?: boolean;
  onSelectMode: (mode: LearningMode) => void;
  onOpenPause: () => void;
  onOpenLessonDrawer: () => void;
  onOpenHelp: () => void;
  onOpenAiInspector?: () => void;
  onOpenFlowGuide?: () => void;
}

export const ScrapbookHeader: React.FC<ScrapbookHeaderProps> = ({
  currentLesson,
  currentMode,
  isBackendLive = false,
  onSelectMode,
  onOpenPause,
  onOpenLessonDrawer,
  onOpenHelp,
  onOpenAiInspector,
  onOpenFlowGuide,
}) => {
  const [isMuted, setIsMuted] = useState(!sound.getEnabled());

  const handleToggleSound = () => {
    const next = sound.toggle();
    setIsMuted(!next);
    if (next) sound.playPencilTap();
  };
  return (
    <header className="w-full border-b border-[#D8D0C0] bg-[#FAF6EE]/95 backdrop-blur-xs px-3 sm:px-6 py-2 sticky top-0 z-30 shadow-2xs">
      <div className="w-[92vw] max-w-[1520px] mx-auto flex flex-col gap-2">
        {/* Top Row: Brand & Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* Zone 1: Wordmark & Lesson Badge & AI Status Pill */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenHelp}
              className="flex items-center gap-2 group text-left cursor-pointer"
              title="Xem lại hướng dẫn ban đầu"
            >
              <span className="w-8 h-8 rounded-xs bg-[#E8A33D] text-white flex items-center justify-center font-handwriting font-bold text-xl shadow-xs group-hover:rotate-6 transition-transform">
                D
              </span>
              <span className="font-handwriting font-bold text-2xl sm:text-3xl text-[#2F2923] tracking-tight">
                DRE Learning
              </span>
            </button>

            {/* Sticky note for current lesson */}
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5D65D] text-[#3B3224] text-xs font-handwriting font-bold rotate-[-1deg] border border-[#ECD055] shadow-2xs">
                <BookmarkTagIcon className="w-3.5 h-3.5 text-[#8A6818]" />
                <span>{currentLesson.id} · {currentLesson.levelLabel}</span>
              </span>

              {/* Live AI Status Pill */}
              <button
                type="button"
                onClick={onOpenAiInspector}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                style={{
                  backgroundColor: isBackendLive ? '#EDF7F2' : '#FFF8EB',
                  borderColor: isBackendLive ? '#6B9E5C' : '#E8A33D',
                  color: isBackendLive ? '#2B5E22' : '#8C5D19',
                }}
                title="Bấm để mở Bảng Soi Luồng Multi-Agent AI (Live Inspector)"
              >
                <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-[#6B9E5C] animate-pulse' : 'bg-[#E8A33D]'}`} />
                <span className="flex items-center gap-1">
                  {isBackendLive && <LightningZapIcon className="w-3 h-3 text-[#2B5E22]" />}
                  <span>{isBackendLive ? 'GPT-6 Live (Bấm soi)' : 'Kịch bản mẫu (Offline)'}</span>
                </span>
              </button>
            </div>
          </div>

          {/* Zone 2: Sound Toggle, Switch lesson and Pause */}
          <div className="flex items-center gap-2">
            {/* Quick Tactile Audio Mute Toggle */}
            <button
              onClick={handleToggleSound}
              type="button"
              className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                !isMuted 
                  ? 'bg-[#EBF7F2] text-[#2F6859] border-[#66B89F] shadow-2xs hover:scale-105' 
                  : 'bg-white text-[#9E9080] border-[#DDD3C4]'
              }`}
              title={!isMuted ? 'Âm thanh xúc giác: BẬT (Bấm để tắt)' : 'Âm thanh xúc giác: TẮT (Bấm để bật)'}
            >
              <SoundSpeakerIcon isMuted={isMuted} className="w-4 h-4" />
            </button>

            {currentMode === 'worksheet' && (
              <button
                onClick={() => {
                  sound.playPageFlip();
                  onOpenLessonDrawer();
                }}
                type="button"
                className="px-3 py-1.5 bg-white hover:bg-[#F3EFE6] text-[#42372C] rounded-xl border border-[#D5CCBC] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer font-handwriting text-sm hover:-translate-y-0.5 active:scale-95"
              >
                <OpenBookIcon className="w-4 h-4 text-[#8A7246]" />
                <span>Đổi bài ({currentLesson.id})</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playPencilTap();
                onOpenPause();
              }}
              type="button"
              className="px-3.5 py-1 bg-[#FAF6EE] hover:bg-[#F0EBE0] active:scale-95 text-[#377A69] font-medium text-xs sm:text-sm rounded-xl border-2 border-[#4E9B87] transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:-translate-y-0.5"
              title="Lưu vị trí và nghỉ ngơi"
            >
              <CoffeeMugIcon className="w-4 h-4 text-[#4E9B87]" />
              <span className="font-handwriting text-sm sm:text-base font-bold text-[#2E6859]">Tạm dừng</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

