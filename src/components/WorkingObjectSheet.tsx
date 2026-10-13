// File: src/components/WorkingObjectSheet.tsx
import React from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { BoAvatar, CheckCircleIcon } from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

interface WorkingObjectSheetProps {
  lesson: MisconceptionItem;
  currentState: DREState;
  selectedStep: number | null;
  onSelectStep: (stepNumber: number) => void;
  boSpeechOverride?: string | null;
}

const cleanText = (str?: string | null) => (str ? str.replace(/\u20d7/g, '') : '');

export const WorkingObjectSheet: React.FC<WorkingObjectSheetProps> = ({
  lesson,
  currentState,
  selectedStep,
  onSelectStep,
  boSpeechOverride,
}) => {
  const isCompleted = currentState === 'CLOSE';

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 sm:p-4 space-y-4">
      <div className="space-y-4">
        {/* Lời nhắn gọn gàng của Bo */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D5]">
          <BoAvatar
            size="sm"
            expression={isCompleted ? 'happy' : currentState === 'BO_CHALLENGE' ? 'skeptical' : 'normal'}
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[#92400E]">
              {isCompleted ? 'Bo đã sửa lại bài:' : 'Vở bài tập của Bo:'}
            </div>
            <p className="text-xs sm:text-sm text-[#1E242B] leading-snug mt-0.5">
              “{cleanText(boSpeechOverride) || 'Mình giải xong 3 bước dưới đây rồi, bạn kiểm tra giúp mình xem có dòng nào bị nhầm không nhé!'}”
            </p>
          </div>
        </div>

        {/* Đề bài Toán rõ ràng, sang trọng */}
        <div className="space-y-1">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1B4338] bg-[#EBF7F3] px-2.5 py-0.5 rounded-md">
            Đề bài thực hành
          </span>
          <h2 className="font-bold text-sm sm:text-base text-[#1E242B] leading-relaxed pt-1">
            {cleanText(lesson.workingObject.title)}
          </h2>
        </div>

        {/* Danh sách các bước giải của Bo (Font Plus Jakarta Sans sạch đẹp, dễ đọc) */}
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-medium text-[#6E6254]">
            Bấm trực tiếp vào bước giải bạn phát hiện có lỗi sai:
          </div>

          {lesson.workingObject.steps.map((step) => {
            const isSelected = selectedStep === step.stepNumber;
            const isErrorStep = step.stepNumber === lesson.errorStepIndex;

            let cardStyle = 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8] text-[#1E242B]';
            let badgeStyle = 'bg-[#F3EFE6] text-[#5C5043]';

            if (isSelected) {
              if (isCompleted && isErrorStep) {
                cardStyle = 'bg-[#EBF7F3] border-[#2E6859] border-2 text-[#142923]';
                badgeStyle = 'bg-[#1B4338] text-white';
              } else if (currentState === 'HINT' && !isErrorStep) {
                cardStyle = 'bg-[#FFF5F5] border-[#F8B4A5] border-2 text-[#9B1C1C]';
                badgeStyle = 'bg-[#E53E3E] text-white';
              } else {
                cardStyle = 'bg-[#FFFBF2] border-[#D97706] border-2 text-[#1E242B] shadow-2xs';
                badgeStyle = 'bg-[#D97706] text-white';
              }
            }

            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  onSelectStep(step.stepNumber);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${cardStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 ${badgeStyle}`}>
                    Bước {step.stepNumber}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed">
                    {cleanText(step.content)}
                  </span>
                </div>

                <span className="text-xs font-semibold text-[#6E6254] shrink-0">
                  {isSelected ? (
                    <span className="text-[#D97706] font-bold flex items-center gap-1">
                      {isCompleted && isErrorStep && <CheckCircleIcon className="w-4 h-4 text-[#1B4338]" />}
                      <span>Đã chọn</span>
                    </span>
                  ) : (
                    'Chọn ➔'
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chú thích nhẹ ở chân cột trái */}
      <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#8A7D6F]">
        <span>Chủ đề: {cleanText(lesson.errorType)}</span>
        <span>Đối chiếu với Sổ tay của Linh Chi ở cột bên phải ➔</span>
      </div>
    </div>
  );
};
