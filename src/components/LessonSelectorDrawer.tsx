// File: src/components/LessonSelectorDrawer.tsx
import React, { useEffect } from 'react';
import { MisconceptionItem } from '../types/dre';
import { MISCONCEPTION_LIBRARY } from '../data/misconceptions';
import { OpenBookIcon, BookmarkTagIcon } from './HandmadeArtwork';

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
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('lessons') === 'bai9' || s.get('scroll') === 'bottom' || s.get('bai9') === '1') {
        setTimeout(() => {
          const el = document.getElementById('lesson-drawer-list');
          if (el) el.scrollTop = el.scrollHeight;
        }, 150);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const beginnerLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'beginner');
  const intermediateLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'intermediate');
  const advancedLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'advanced');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md bg-white border-l border-[#E2EAD2] h-full overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2EAD2] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] flex items-center justify-center text-[#121712] shrink-0">
              <OpenBookIcon className="w-4 h-4 text-[#121712]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#121712]">
                  Sổ bài tập ({MISCONCEPTION_LIBRARY.length} bài)
                </span>
                <span className="px-2.5 py-0.5 bg-[#F3F8E8] text-xs font-bold text-[#121712] rounded-full border border-[#E2EAD2]">
                  Toán Cấp 2–3
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-normal">
                Chọn bài tập để giải và chẩn đoán lỗi cùng Bo & Cô Lam
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F3F8E8] hover:bg-[#E2EAD2] text-[#121712] text-xs font-bold cursor-pointer transition-colors shrink-0 border border-[#E2EAD2]"
          >
            ✕
          </button>
        </div>

        {/* Categories */}
        <div id="lesson-drawer-list" className="flex-1 space-y-5 overflow-y-auto pr-0.5 no-scrollbar">
          
          {/* Section: Mới học lần đầu */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-0.5">
              <span className="w-2 h-2 rounded-full bg-[#121712]" />
              <span className="text-xs font-bold text-[#121712] uppercase tracking-wider">
                Mới học lần đầu ({beginnerLessons.length} bài)
              </span>
            </div>
            <div className="space-y-2">
              {beginnerLessons.map((item, idx) => {
                const isActive = item.id === currentLessonId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectLesson(item);
                      onClose();
                    }}
                    type="button"
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs cursor-pointer shadow-2xs group ${
                      isActive
                        ? 'bg-[#121712] text-white border-[#121712] ring-1 ring-[#121712] shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-[#E2EAD2] text-[#121712]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-mono font-bold text-xs flex items-center gap-1 ${
                        isActive ? 'text-[#C8F169]' : 'text-[#121712]'
                      }`}>
                        <BookmarkTagIcon className="w-3.5 h-3.5" />
                        <span>Bài {idx + 1}</span>
                      </span>
                      <span className={`text-[11px] font-medium ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                        {item.errorType}
                      </span>
                    </div>
                    <div className={`font-semibold leading-snug ${isActive ? 'text-white' : 'text-[#121712]'}`}>
                      {item.topic}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Đã học rồi */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-0.5">
              <span className="w-2 h-2 rounded-full bg-[#121712]" />
              <span className="text-xs font-bold text-[#121712] uppercase tracking-wider">
                Đã học rồi ({intermediateLessons.length} bài)
              </span>
            </div>
            <div className="space-y-2">
              {intermediateLessons.map((item, idx) => {
                const isActive = item.id === currentLessonId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectLesson(item);
                      onClose();
                    }}
                    type="button"
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs cursor-pointer shadow-2xs group ${
                      isActive
                        ? 'bg-[#121712] text-white border-[#121712] ring-1 ring-[#121712] shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-[#E2EAD2] text-[#121712]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-mono font-bold text-xs flex items-center gap-1 ${
                        isActive ? 'text-[#C8F169]' : 'text-[#121712]'
                      }`}>
                        <BookmarkTagIcon className="w-3.5 h-3.5" />
                        <span>Bài {beginnerLessons.length + idx + 1}</span>
                      </span>
                      <span className={`text-[11px] font-medium ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                        {item.errorType}
                      </span>
                    </div>
                    <div className={`font-semibold leading-snug ${isActive ? 'text-white' : 'text-[#121712]'}`}>
                      {item.topic}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Đang ôn luyện */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-0.5">
              <span className="w-2 h-2 rounded-full bg-[#121712]" />
              <span className="text-xs font-bold text-[#121712] uppercase tracking-wider">
                Đang ôn luyện ({advancedLessons.length} bài)
              </span>
            </div>
            <div className="space-y-2">
              {advancedLessons.map((item, idx) => {
                const isActive = item.id === currentLessonId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectLesson(item);
                      onClose();
                    }}
                    type="button"
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs cursor-pointer shadow-2xs group ${
                      isActive
                        ? 'bg-[#121712] text-white border-[#121712] ring-1 ring-[#121712] shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-[#E2EAD2] text-[#121712]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-mono font-bold text-xs flex items-center gap-1 ${
                        isActive ? 'text-[#C8F169]' : 'text-[#121712]'
                      }`}>
                        <BookmarkTagIcon className="w-3.5 h-3.5" />
                        <span>Bài {beginnerLessons.length + intermediateLessons.length + idx + 1}</span>
                      </span>
                      <span className={`text-[11px] font-medium ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                        {item.errorType}
                      </span>
                    </div>
                    <div className={`font-semibold leading-snug ${isActive ? 'text-white' : 'text-[#121712]'}`}>
                      {item.topic}
                    </div>
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
