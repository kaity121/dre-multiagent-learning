// File: src/components/LessonSelectorDrawer.tsx
import React from 'react';
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
  if (!isOpen) return null;

  const beginnerLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'beginner');
  const intermediateLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'intermediate');
  const advancedLessons = MISCONCEPTION_LIBRARY.filter(l => l.level === 'advanced');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md bg-white border-l border-slate-200/90 h-full overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[#0e7490] shrink-0">
              <OpenBookIcon className="w-4 h-4 text-[#0e7490]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900">
                  Sổ bài tập ({MISCONCEPTION_LIBRARY.length} bài)
                </span>
                <span className="px-2 py-0.2 bg-cyan-50 text-[11px] font-bold text-[#0e7490] rounded-full border border-cyan-200">
                  Toán Cấp 2-3
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                Chọn bài tập để giải và chẩn đoán lỗi cùng Bo & Cô Lam
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 space-y-5 overflow-y-auto pr-0.5 no-scrollbar">
          
          {/* Section: Mới học lần đầu */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Mới học lần đầu ({beginnerLessons.length} bài)
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
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer shadow-2xs group ${
                      isActive
                        ? 'bg-cyan-50/80 border-[#0e7490] ring-1 ring-[#0e7490] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#0e7490] flex items-center gap-1">
                        <BookmarkTagIcon className="w-3 h-3 text-[#0e7490]" />
                        <span>{item.id}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{item.errorType}</span>
                    </div>
                    <div className="font-semibold text-slate-900 leading-snug group-hover:text-[#0e7490] transition-colors">
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
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Đã học rồi ({intermediateLessons.length} bài)
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
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer shadow-2xs group ${
                      isActive
                        ? 'bg-cyan-50/80 border-[#0e7490] ring-1 ring-[#0e7490] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#0e7490] flex items-center gap-1">
                        <BookmarkTagIcon className="w-3 h-3 text-[#0e7490]" />
                        <span>{item.id}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{item.errorType}</span>
                    </div>
                    <div className="font-semibold text-slate-900 leading-snug group-hover:text-[#0e7490] transition-colors">
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
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Đang ôn luyện ({advancedLessons.length} bài)
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
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer shadow-2xs group ${
                      isActive
                        ? 'bg-cyan-50/80 border-[#0e7490] ring-1 ring-[#0e7490] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#0e7490] flex items-center gap-1">
                        <BookmarkTagIcon className="w-3 h-3 text-[#0e7490]" />
                        <span>{item.id}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{item.errorType}</span>
                    </div>
                    <div className="font-semibold text-slate-900 leading-snug group-hover:text-[#0e7490] transition-colors">
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
