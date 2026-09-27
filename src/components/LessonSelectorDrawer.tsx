import React from 'react';
import { MisconceptionItem } from '../types/dre';
import { MISCONCEPTION_LIBRARY } from '../data/misconceptions';
import { WashiTape, OpenBookIcon, BookmarkTagIcon } from './HandmadeArtwork';

interface LessonSelectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lesson: MisconceptionItem) => void;
  currentLessonId: string;
}

export const LessonSelectorDrawer: React.FC<LessonSelectorDrawerProps> = ({
  isOpen,
  onClose,
  onSelectLesson,
  currentLessonId,
}) => {
  if (!isOpen) return null;

  const beginnerLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'beginner');
  const intermediateLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'intermediate');
  const advancedLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'advanced');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#2C2A29]/35 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#FAF6EE] h-full overflow-y-auto p-5 sm:p-6 border-l-2 border-[#D8D0C0] shadow-xl notebook-sheet flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E0D8C8] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <OpenBookIcon className="w-6 h-6 text-[#A86E18]" />
            <span className="font-handwriting font-bold text-2xl text-[#2F2A24]">
              Sổ bài tập (8 bài)
            </span>
            <span className="px-2 py-0.5 bg-[#F5D65D] text-xs font-handwriting font-bold rounded-xs border border-[#ECD055]">
              Toán Cấp 2-3
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-xs text-[#6B5F54] hover:bg-[#EBE4D5] text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#706457] font-handwriting mb-4">
          Chọn một bài bất kỳ để cùng bạn Bo giải và chẩn đoán lỗi. Toàn bộ 8 bài đã được chuẩn hóa theo Misconception Library.
        </p>

        {/* Categories */}
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {/* Section: Mới học lần đầu */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <WashiTape variant="yellow" className="w-10 h-3" />
              <span className="text-xs font-handwriting font-bold text-[#805715] uppercase tracking-wider">
                Mới học lần đầu (4 bài)
              </span>
            </div>
            <div className="space-y-2">
              {beginnerLessons.map((item) => {
                const isActive = item.id === currentLessonId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectLesson(item);
                      onClose();
                    }}
                    type="button"
                    className={`w-full text-left p-3 rounded-xs border transition-all text-xs cursor-pointer ${
                      isActive
                        ? 'bg-[#FFF7E8] border-[#E8A33D] font-medium shadow-xs rotate-[-0.5deg]'
                        : 'bg-white hover:bg-[#FFFDF7] border-[#DFD7C7] text-[#42372C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-[#A86E18] flex items-center gap-1">
                        <BookmarkTagIcon className="w-3 h-3 text-[#A86E18]" />
                        <span>{item.id}</span>
                      </span>
                      <span className="text-[11px] text-[#7A6F62] font-handwriting font-semibold">{item.errorType}</span>
                    </div>
                    <div className="font-medium text-[#2E2822]">{item.topic}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Đã học rồi */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <WashiTape variant="blue" className="w-10 h-3" />
              <span className="text-xs font-handwriting font-bold text-[#326759] uppercase tracking-wider">
                Đã học rồi (2 bài)
              </span>
            </div>
            <div className="space-y-2">
              {intermediateLessons.map((item) => {
                const isActive = item.id === currentLessonId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectLesson(item);
                      onClose();
                    }}
                    type="button"
                    className={`w-full text-left p-3 rounded-xs border transition-all text-xs cursor-pointer ${
                      isActive
                        ? 'bg-[#EDF7F4] border-[#4E9B87] font-medium shadow-xs rotate-[-0.5deg]'
                        : 'bg-white hover:bg-[#FFFDF7] border-[#DFD7C7] text-[#42372C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-[#377A69] flex items-center gap-1">
                        <BookmarkTagIcon className="w-3 h-3 text-[#377A69]" />
                        <span>{item.id}</span>
                      </span>
                      <span className="text-[11px] text-[#7A6F62] font-handwriting font-semibold">{item.errorType}</span>
                    </div>
                    <div className="font-medium text-[#2E2822]">{item.topic}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Đang ôn luyện */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <WashiTape variant="pink" className="w-10 h-3" />
              <span className="text-xs font-handwriting font-bold text-[#7E4C56] uppercase tracking-wider">
                Đang ôn luyện (2 bài)
              </span>
            </div>
            <div className="space-y-2">
              {advancedLessons.map((item) => {
                const isActive = item.id === currentLessonId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectLesson(item);
                      onClose();
                    }}
                    type="button"
                    className={`w-full text-left p-3 rounded-xs border transition-all text-xs cursor-pointer ${
                      isActive
                        ? 'bg-[#FDF2F4] border-[#C27D8B] font-medium shadow-xs rotate-[-0.5deg]'
                        : 'bg-white hover:bg-[#FFFDF7] border-[#DFD7C7] text-[#42372C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-[#944D5C] flex items-center gap-1">
                        <BookmarkTagIcon className="w-3 h-3 text-[#944D5C]" />
                        <span>{item.id}</span>
                      </span>
                      <span className="text-[11px] text-[#7A6F62] font-handwriting font-semibold">{item.errorType}</span>
                    </div>
                    <div className="font-medium text-[#2E2822]">{item.topic}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
