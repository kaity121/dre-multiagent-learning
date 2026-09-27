import React from 'react';
import { MisconceptionItem, LearningMode } from '../types/dre';
import { 
  CoffeeMugIcon, 
  OpenBookIcon, 
  BookmarkTagIcon, 
  SwordsDebateIcon, 
  SparkleIcon,
  CompassIcon,
  LightningZapIcon
} from './HandmadeArtwork';

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
  return (
    <header className="w-full border-b border-[#D8D0C0] bg-[#FAF6EE]/95 backdrop-blur-xs px-3 sm:px-6 py-2 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
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
                  <span>{isBackendLive ? 'GPT-4o Live (Bấm soi)' : 'Kịch bản mẫu (Offline)'}</span>
                </span>
              </button>
            </div>
          </div>

          {/* Zone 2: Switch lesson and Pause */}
          <div className="flex items-center gap-2">
            {currentMode === 'worksheet' && (
              <button
                onClick={onOpenLessonDrawer}
                type="button"
                className="px-3 py-1.5 bg-white hover:bg-[#F3EFE6] text-[#42372C] rounded-xs border border-[#D5CCBC] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer font-handwriting text-sm"
              >
                <OpenBookIcon className="w-4 h-4 text-[#8A7246]" />
                <span>Đổi bài ({currentLesson.id})</span>
              </button>
            )}

            <button
              onClick={onOpenPause}
              type="button"
              className="px-3 py-1 bg-[#FAF6EE] hover:bg-[#F0EBE0] active:scale-98 text-[#377A69] font-medium text-xs sm:text-sm rounded-xs border-2 border-dashed border-[#4E9B87] transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
              title="Lưu vị trí và nghỉ ngơi"
            >
              <CoffeeMugIcon className="w-4 h-4 text-[#4E9B87]" />
              <span className="font-handwriting text-sm sm:text-base font-bold text-[#2E6859]">Tạm dừng</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Tactile Learning Flow Switcher Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-handwriting">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[#8A7D6F] font-bold shrink-0 mr-1 select-none">
              Trạm học tập:
            </span>

            {/* Station 1: Video Checkpoint & Bo Debate (Khởi động) */}
            <button
              onClick={() => onSelectMode('video_clash')}
              type="button"
              className={`px-2.5 py-1 rounded-xs border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                currentMode === 'video_clash'
                  ? 'bg-[#4E9B87] text-white font-bold border-[#3A7564] rotate-1'
                  : 'bg-white/80 text-[#5C4F42] border-[#DFD6C4] hover:bg-white'
              }`}
              title="Khởi động bài học bằng video tương tác và tranh luận bẻ gãy ngộ nhận với Bo"
            >
              <SwordsDebateIcon className="w-3.5 h-3.5" />
              <span>1. Video &amp; Bo cãi (Khởi động)</span>
              <span className="text-[10px] bg-[#F5D65D] text-[#5C4010] px-1 py-0.2 rounded-full font-bold">Hot</span>
            </button>

            {/* Station 2: Worksheet DRE (Luyện tập) */}
            <button
              onClick={() => onSelectMode('worksheet')}
              type="button"
              className={`px-2.5 py-1 rounded-xs border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                currentMode === 'worksheet'
                  ? 'bg-[#E8A33D] text-white font-bold border-[#C98420] -rotate-1'
                  : 'bg-white/80 text-[#5C4F42] border-[#DFD6C4] hover:bg-white'
              }`}
              title="Luyện tập tự tay soi bài giải của Bo, phát hiện bước sai và giải thích bản chất"
            >
              <OpenBookIcon className="w-3.5 h-3.5" />
              <span>2. Sổ tay bắt lỗi (Luyện tập)</span>
            </button>

            {/* Station 3: Predict-Observe-Explain (Thử thách) */}
            <button
              onClick={() => onSelectMode('predict_poe')}
              type="button"
              className={`px-2.5 py-1 rounded-xs border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                currentMode === 'predict_poe'
                  ? 'bg-[#F5D65D] text-[#4A3710] font-bold border-[#D4A328] -rotate-1'
                  : 'bg-white/80 text-[#5C4F42] border-[#DFD6C4] hover:bg-white'
              }`}
              title="Cá cược kết quả trước khi xem đáp án của Cô Lam để rèn luyện tư duy phản xạ"
            >
              <SparkleIcon className="w-3.5 h-3.5" />
              <span>3. Đoán kết quả (Thử thách)</span>
            </button>

            {/* Station 4: Protégé Teaching (Làm chủ) */}
            <button
              onClick={() => onSelectMode('protege_teaching')}
              type="button"
              className={`px-2.5 py-1 rounded-xs border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                currentMode === 'protege_teaching'
                  ? 'bg-[#6B9E5C] text-white font-bold border-[#4F7842] rotate-1'
                  : 'bg-white/80 text-[#5C4F42] border-[#DFD6C4] hover:bg-white'
              }`}
              title="Đóng vai gia sư giảng giải cho Bo khi bạn học bị lú để làm chủ kiến thức sâu sắc nhất"
            >
              <span>4. Dạy kèm Bo (Làm chủ)</span>
            </button>
          </div>

          {/* Guide Button */}
          <button
            onClick={onOpenFlowGuide}
            type="button"
            className="text-[11px] font-mono text-[#377A69] hover:underline flex items-center gap-1.5 shrink-0 bg-[#EDF7F4] px-2.5 py-1 border border-[#BCE1D7] rounded-xs cursor-pointer shadow-2xs"
            title="Xem lộ trình học chuẩn và sự phối hợp giữa 4 trạm"
          >
            <CompassIcon className="w-3.5 h-3.5 text-[#377A69]" />
            <span>Flow học như thế nào?</span>
          </button>
        </div>
      </div>
    </header>
  );
};

