// File: src/components/ChatSavedQuizBlock.tsx
// Khối Câu hỏi Kiểm tra nhanh được LƯU TRỰC TIẾP VÀO ĐOẠN CHAT (Chuẩn UI Blu1606)
import React, { useState, useEffect } from 'react';
import { VideoLessonItem } from '../types/dre';
import { FormattedMathText } from './MathVector';

export interface ChatSavedQuizBlockProps {
  lesson: VideoLessonItem;
  status: 'PENDING' | 'SKIPPED' | 'ANSWERED';
  savedSelectedOptionId?: string | null;
  onSeekToCheckpoint: (sec: number) => void;
  onSubmitAnswerFromChat: (option: {
    id: string;
    label: string;
    isStandardBest: boolean;
    feedback: string;
  }) => void;
  onSkipFromChat: () => void;
}

export const ChatSavedQuizBlock: React.FC<ChatSavedQuizBlockProps> = ({
  lesson,
  status,
  savedSelectedOptionId,
  onSeekToCheckpoint,
  onSubmitAnswerFromChat,
  onSkipFromChat,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(savedSelectedOptionId || null);

  useEffect(() => {
    if (savedSelectedOptionId) {
      setSelectedId(savedSelectedOptionId);
    }
  }, [savedSelectedOptionId]);

  const cleanText = (str?: string) => (str ? str.replace(/\u20d7/g, '') : '');

  const formatTime = (seconds: number) => {
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedIndex = lesson.checkpointQuestion.options.findIndex((o) => o.id === selectedId);
  const selectedLetter =
    selectedIndex === 0 ? 'A' : selectedIndex === 1 ? 'B' : selectedIndex === 2 ? 'C' : '';
  const selectedOptionObj = lesson.checkpointQuestion.options.find((o) => o.id === selectedId);

  return (
    <div className="my-4 space-y-3 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* 1. Đường kẻ phân cách Part giống hệt ảnh Blu */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-bold text-slate-600 tracking-tight">
          Part 2 · Quy tắc hình hộp & Độ dài tổng vectơ
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* 2. Thẻ Câu hỏi được lưu cố định trong đoạn chat */}
      <div className="bg-white border border-slate-200/95 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3">
        {/* Header: Avatar tròn xanh cổ vịt + KIỂM TRA NHANH + @Cả lớp + ▶ 37:13 */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#0f766e] text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            C
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              KIỂM TRA NHANH · HẾT PART 2
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#0f766e]">Cô Lam</span>
              <span className="px-2 py-0.5 rounded-full bg-[#e6f4f1] text-[#0f766e] font-semibold text-[11px]">
                @Cả lớp
              </span>
              <button
                type="button"
                onClick={() => onSeekToCheckpoint(lesson.checkpointTimestamp)}
                className="px-2 py-0.5 rounded-full bg-[#e0f2fe] hover:bg-cyan-100 text-[#0369a1] font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                title="Nhảy tới mốc câu hỏi trên video"
              >
                <span className="text-[9px]">▶</span>
                <span>{formatTime(lesson.checkpointTimestamp)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Đề bài câu hỏi */}
        <p className="font-bold text-[13px] sm:text-[13.5px] text-slate-900 leading-snug">
          <FormattedMathText text={cleanText(lesson.checkpointQuestion.prompt)} />
        </p>

        {/* Danh sách các đáp án A, B, C với nút Radio tròn giống hệt Blu */}
        <div className="space-y-2">
          {lesson.checkpointQuestion.options.map((opt, idx) => {
            const letter = idx === 0 ? 'A' : idx === 1 ? 'B' : 'C';
            const isSelected = selectedId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedId(opt.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#0d6e82] bg-cyan-50/40 text-slate-900 font-semibold ring-1 ring-[#0d6e82]/30'
                    : 'border-slate-200/90 hover:border-slate-300 bg-white text-slate-800'
                }`}
              >
                {/* Nút Radio tròn */}
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'border-[#0d6e82]' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-[#0d6e82]" />}
                </span>

                {/* Nhãn A, B, C */}
                <span className="font-extrabold text-slate-600 w-3.5 shrink-0">{letter}</span>

                {/* Nội dung đáp án */}
                <span className="flex-1 leading-snug text-slate-800">
                  <FormattedMathText text={cleanText(opt.label)} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer của Thẻ: Trạng thái bên trái + Nút [Bỏ qua] & [Gửi] bên phải */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-slate-500">
            {status === 'SKIPPED' && 'Bạn đã bỏ qua câu này'}
            {status === 'ANSWERED' && `Đã lưu câu trả lời (${selectedLetter || 'A'})`}
            {status === 'PENDING' && 'Chọn 1 đáp án để thảo luận cùng lớp'}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSkipFromChat}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            >
              Bỏ qua
            </button>

            <button
              type="button"
              disabled={!selectedOptionObj}
              onClick={() => {
                if (selectedOptionObj) {
                  onSubmitAnswerFromChat(selectedOptionObj);
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                selectedOptionObj
                  ? 'bg-[#0d6e82] hover:bg-[#0e7490] text-white cursor-pointer shadow-2xs'
                  : 'bg-[#7fa8b0] text-white/95 cursor-not-allowed'
              }`}
            >
              Gửi
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bong bóng phản hồi của Học viên được lưu ngay dưới thẻ trong đoạn chat */}
      {status === 'SKIPPED' && (
        <div className="flex justify-end animate-in fade-in duration-150">
          <div className="px-4 py-2 rounded-2xl rounded-tr-xs bg-[#0d6e82] text-white font-bold text-xs shadow-2xs">
            Bỏ qua câu này
          </div>
        </div>
      )}

      {status === 'ANSWERED' && selectedOptionObj && (
        <div className="flex justify-end animate-in fade-in duration-150">
          <div className="max-w-[85%] px-4 py-2 rounded-2xl rounded-tr-xs bg-[#0d6e82] text-white font-semibold text-xs shadow-2xs leading-snug">
            Mình chọn <span className="font-extrabold">Đáp án {selectedLetter}</span>:{' '}
            <FormattedMathText text={cleanText(selectedOptionObj.label)} />
          </div>
        </div>
      )}
    </div>
  );
};
