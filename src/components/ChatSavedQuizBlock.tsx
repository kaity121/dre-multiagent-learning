// File: src/components/ChatSavedQuizBlock.tsx
// Khối Câu hỏi Kiểm tra nhanh được LƯU TRỰC TIẾP VÀO ĐOẠN CHAT (Chuẩn UI Blu1606)
import React, { useState, useEffect } from 'react';
import { VideoLessonItem } from '../types/dre';
import { FormattedMathText } from './MathVector';
import { AgentAvatar } from './AgentAvatar';

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
    <div id="chat-saved-quiz-card" className="my-4 space-y-3 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* 1. Đường kẻ phân cách Part giống hệt ảnh Blu */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-bold text-stone-600 tracking-tight">
          Part 2 · Quy tắc hình hộp & Độ dài tổng vectơ
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {/* 2. Thẻ Câu hỏi được lưu cố định trong đoạn chat */}
      <div className="bg-white border border-[#E2EAD2] rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Header: Avatar Cô Lam + KIỂM TRA NHANH + @Cả lớp + ▶ 37:13 */}
        <div className="flex items-start gap-2.5">
          <AgentAvatar role="colam" size={32} tooltip />
          <div className="space-y-1 min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Kiểm tra nhanh · Hết Part 2
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#121712]">Cô Lam</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F3F8E8] text-[#121712] border border-[#E2EAD2] font-semibold text-xs">
                @Cả lớp
              </span>
              <button
                type="button"
                onClick={() => onSeekToCheckpoint(lesson.checkpointTimestamp)}
                className="px-2 py-0.5 rounded-full bg-[#F3F8E8] hover:bg-[#E2EAD2] text-[#121712] border border-[#E2EAD2] font-mono font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Nhảy tới mốc câu hỏi trên video"
              >
                <span className="text-[10px]">▶</span>
                <span>{formatTime(lesson.checkpointTimestamp)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Đề bài câu hỏi */}
        <p className="font-bold text-[13px] sm:text-[14px] text-[#121712] leading-snug">
          <FormattedMathText text={cleanText(lesson.checkpointQuestion.prompt)} />
        </p>

        {/* Danh sách các đáp án A, B, C */}
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
                    ? 'border-[#121712] bg-[#F3F8E8] text-[#121712] font-semibold ring-1 ring-[#121712]'
                    : 'border-[#E2EAD2] hover:border-stone-400 bg-white text-stone-800'
                }`}
              >
                {/* Nút Radio tròn */}
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'border-[#121712] bg-white' : 'border-stone-300'
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-[#121712]" />}
                </span>

                {/* Nhãn A, B, C */}
                <span className="font-bold text-stone-600 w-3.5 shrink-0">{letter}</span>

                {/* Nội dung đáp án */}
                <span className="flex-1 leading-snug text-[#121712]">
                  <FormattedMathText text={cleanText(opt.label)} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer của Thẻ: Trạng thái bên trái + Nút [Bỏ qua] & [Gửi] bên phải */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium text-stone-500">
            {status === 'SKIPPED' && 'Bạn đã bỏ qua câu này'}
            {status === 'ANSWERED' && `Đã lưu câu trả lời (${selectedLetter || 'A'})`}
            {status === 'PENDING' && 'Chọn 1 đáp án để thảo luận cùng lớp'}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSkipFromChat}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer transition-colors"
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
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${
                selectedOptionObj
                  ? 'bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] cursor-pointer shadow-xs border border-[#A6D83B]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-200'
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
          <div className="px-4 py-2 rounded-2xl rounded-tr-xs bg-[#121712] text-white font-bold text-xs shadow-2xs">
            Bỏ qua câu này
          </div>
        </div>
      )}

      {status === 'ANSWERED' && selectedOptionObj && (
        <div className="flex justify-end animate-in fade-in duration-150">
          <div className="max-w-[85%] px-4 py-2 rounded-2xl rounded-tr-xs bg-[#121712] text-white font-semibold text-xs shadow-2xs leading-snug">
            Mình chọn <span className="font-extrabold text-[#C8F169]">Đáp án {selectedLetter}</span>:{' '}
            <FormattedMathText text={cleanText(selectedOptionObj.label)} />
          </div>
        </div>
      )}
    </div>
  );
};
