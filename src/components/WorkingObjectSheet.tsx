// File: src/components/WorkingObjectSheet.tsx
import React from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { BoAvatar, CheckCircleIcon } from './HandmadeArtwork';
import { Vec, PrismVectorDiagram } from './MathVector';
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

  // Render nội dung từng bước giải với ký hiệu Vectơ chuẩn xác
  const renderStepContent = (stepNum: number, defaultContent: string) => {
    if (lesson.id === 'MISC_VECTO_12') {
      if (stepNum === 1) {
        return (
          <span>
            Chèn điểm A vào vectơ <Vec className="text-[#0e7490]">B'C</Vec> theo quy tắc hiệu (Chung gốc A):
          </span>
        );
      }
      if (stepNum === 2) {
        return (
          <span className="font-mono text-xs sm:text-sm">
            <Vec className="text-rose-700">B'C</Vec> = <Vec className="text-slate-800">AB'</Vec> − <Vec className="text-slate-800">AC</Vec>{' '}
            <span className="font-sans text-xs text-slate-500 font-normal">(Lấy điểm trước trừ điểm sau)</span>
          </span>
        );
      }
      if (stepNum === 3) {
        return (
          <span className="font-mono text-xs sm:text-sm">
            Vì <Vec>AB'</Vec> = <Vec>AA'</Vec> + <Vec>AB</Vec> = <Vec>a</Vec> + <Vec>b</Vec> nên{' '}
            <Vec className="text-rose-700">B'C</Vec> = <Vec>a</Vec> + <Vec>b</Vec> − <Vec>c</Vec>
          </span>
        );
      }
    }
    return cleanText(defaultContent);
  };

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
            {lesson.id === 'MISC_VECTO_12' ? (
              <span>
                Ví dụ 10 (Phút 1:40:10): Cho lăng trụ ABC.A'B'C'. Đặt <Vec>a</Vec> = <Vec>AA'</Vec>,{' '}
                <Vec>b</Vec> = <Vec>AB</Vec>, <Vec>c</Vec> = <Vec>AC</Vec>. Hãy biểu diễn vectơ{' '}
                <Vec className="text-rose-700 font-bold">B'C</Vec> theo <Vec>a</Vec>, <Vec>b</Vec>, <Vec>c</Vec>:
              </span>
            ) : (
              cleanText(lesson.workingObject.title)
            )}
          </h2>
        </div>

        {/* HÌNH MINH HỌA TRỰC QUAN KHÔNG GIAN CHO TRẠM 2 (LĂNG TRỤ TAM GIÁC) */}
        {lesson.id === 'MISC_VECTO_12' && (
          <PrismVectorDiagram className="animate-in fade-in duration-150" />
        )}

        {/* Danh sách các bước giải của Bo */}
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-medium text-[#6E6254] flex items-center justify-between">
            <span>Bấm trực tiếp vào bước giải bạn phát hiện có lỗi sai:</span>
            <span className="text-[11px] text-slate-400">Chọn 1 trong 3 bước</span>
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
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${badgeStyle}`}>
                      Bước {step.stepNumber}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">
                      {step.stepNumber === 1 ? 'Phương pháp' : step.stepNumber === 2 ? 'Biến đổi' : 'Kết luận'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium leading-relaxed">
                    {renderStepContent(step.stepNumber, step.content)}
                  </div>
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
      <div className="pt-3 flex items-center justify-between text-xs text-[#8A7D6F]">
        <span>Chủ đề: {cleanText(lesson.errorType)}</span>
        <span>Đối chiếu với Sổ tay của Linh Chi ở cột bên phải ➔</span>
      </div>
    </div>
  );
};
