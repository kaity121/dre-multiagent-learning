// File: src/components/WorkingObjectSheet.tsx
import React from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { BoCircleAvatar } from './HandmadeArtwork';
import { Vec, PrismVectorDiagram, MathColorLegend, FormattedMathText } from './MathVector';
import { sound } from '../utils/soundEffects';
import { Check, ArrowRight } from 'lucide-react';

interface WorkingObjectSheetProps {
  lesson: MisconceptionItem;
  currentState: DREState;
  selectedStep: number | null;
  onSelectStep: (stepNumber: number) => void;
  boSpeechOverride?: string | null;
}

const cleanText = (str?: string | null) => (str ? str.replace(/\u20d7/g, '') : '');

export const WorkingObjectSheet: React.FC<WorkingObjectSheetProps> = React.memo(({
  lesson,
  currentState,
  selectedStep,
  onSelectStep,
  boSpeechOverride,
}) => {
  const isCompleted = currentState === 'CLOSE';

  // Render nội dung từng bước giải với ký hiệu Vectơ chuẩn xác
  const renderStepContent = (stepNum: number, defaultContent: string, isSelected: boolean) => {
    if (lesson.id === 'MISC_VECTO_12') {
      if (stepNum === 1) {
        return (
          <span className={isSelected ? 'text-white' : 'text-[#121712]'}>
            Chèn điểm A vào vectơ <Vec role="target">B'C</Vec> theo quy tắc hiệu chung gốc A:
          </span>
        );
      }
      if (stepNum === 2) {
        return (
          <span className={`text-sm ${isSelected ? 'text-white' : 'text-[#121712]'}`}>
            <Vec role="target">B'C</Vec>
            <span className="mx-2 font-bold text-inherit">=</span>
            <Vec role="reference">AB'</Vec>
            <span className="mx-2 font-bold text-inherit">−</span>
            <Vec role="reference">AC</Vec>{' '}
            <span className={`text-xs ml-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'} font-normal`}>
              (Lấy điểm trước trừ điểm sau)
            </span>
          </span>
        );
      }
      if (stepNum === 3) {
        return (
          <span className={`text-sm ${isSelected ? 'text-white' : 'text-[#121712]'}`}>
            Vì <Vec role="reference">AB'</Vec>
            <span className="mx-2 font-bold text-inherit">=</span>
            <Vec role="reference">AA'</Vec>
            <span className="mx-2 font-bold text-inherit">+</span>
            <Vec role="reference">AB</Vec>
            <span className="mx-2 font-bold text-inherit">=</span>
            <Vec role="reference">a</Vec>
            <span className="mx-2 font-bold text-inherit">+</span>
            <Vec role="reference">b</Vec> nên{' '}
            <Vec role="target">B'C</Vec>
            <span className="mx-2 font-bold text-inherit">=</span>
            <Vec role="reference">a</Vec>
            <span className="mx-2 font-bold text-inherit">+</span>
            <Vec role="reference">b</Vec>
            <span className="mx-2 font-bold text-inherit">−</span>
            <Vec role="reference">c</Vec>
          </span>
        );
      }
    }
    return <span className={`font-medium ${isSelected ? 'text-white' : 'text-[#121712]'}`}>{cleanText(defaultContent)}</span>;
  };

  return (
    <div className="w-full flex flex-col justify-start space-y-3.5">
      {/* Khối bạn học Bo (Tone Lime Soft, Card cấp 1) */}
      <div className="flex items-center gap-3 p-3.5 rounded-[16px] bg-white border border-[#E2EAD2] shadow-xs">
        <div className="shrink-0">
          <BoCircleAvatar className="w-9 h-9 shrink-0 rounded-full border border-amber-300 shadow-2xs" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[#121712] uppercase tracking-wider">
            {isCompleted ? 'Bo đã sửa lại bài giải chuẩn xác:' : 'Bài làm của bạn học Bo (Chờ chẩn đoán):'}
          </div>
          <p className="text-xs sm:text-sm text-stone-700 leading-snug mt-0.5 font-medium">
            "{boSpeechOverride ? (
              <FormattedMathText text={cleanText(boSpeechOverride)} />
            ) : (
              'Mình giải xong 3 bước dưới đây rồi, bạn kiểm tra giúp mình xem có dòng nào bị nhầm không nhé!'
            )}"
          </p>
        </div>
      </div>

      {/* Đề bài Thực hành + Hình vẽ trực quan lăng trụ (Card cấp 1) */}
      <div className="bg-white rounded-[16px] p-4.5 border border-[#E2EAD2] shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-stone-100">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-stone-700 bg-[#F3F8E8] px-3 py-1 rounded-full border border-[#E2EAD2]">
            Đề bài thực hành
          </span>
          <MathColorLegend />
        </div>
        <h2 className="font-bold text-xs sm:text-sm text-[#121712] leading-relaxed">
          {lesson.id === 'MISC_VECTO_12' ? (
            <span>
              Ví dụ 10 (Phút 1:40:10): Cho lăng trụ ABC.A'B'C'. Đặt <Vec role="reference">a</Vec> = <Vec role="reference">AA'</Vec>,{' '}
              <Vec role="reference">b</Vec> = <Vec role="reference">AB</Vec>, <Vec role="reference">c</Vec> = <Vec role="reference">AC</Vec>. Hãy biểu diễn vectơ mục tiêu{' '}
              <Vec role="target">B'C</Vec> theo <Vec role="reference">a</Vec>, <Vec role="reference">b</Vec>, <Vec role="reference">c</Vec>:
            </span>
          ) : (
            cleanText(lesson.workingObject.title)
          )}
        </h2>

        {/* HÌNH VẼ TRỰC QUAN KHÔNG GIAN: LĂNG TRỤ TAM GIÁC (Gọn gàng, thấy ngay không cần cuộn) */}
        {lesson.id === 'MISC_VECTO_12' && (
          <div className="pt-1">
            <PrismVectorDiagram className="animate-in fade-in duration-150" />
          </div>
        )}
      </div>

      {/* Hướng dẫn chọn bước giải */}
      <div className="flex items-center justify-between text-xs text-stone-700 font-bold px-1 pt-0.5">
        <span>Chọn bước giải bạn phát hiện có lỗi sai:</span>
        <span className="text-xs text-stone-500 font-normal">1 trong 3 bước</span>
      </div>

      {/* Danh sách 3 bước giải của Bo (Card cấp 1, tối thiểu 12px) */}
      <div className="space-y-2">
        {lesson.workingObject.steps.map((step) => {
          const isSelected = selectedStep === step.stepNumber;
          const isErrorStep = step.stepNumber === lesson.errorStepIndex;

          let cardClasses = 'bg-white hover:bg-stone-50/90 border border-[#E2EAD2] text-[#121712] shadow-xs';
          let badgeClasses = 'bg-stone-100 text-stone-700 font-bold';

          if (isSelected) {
            if (isCompleted && isErrorStep) {
              cardClasses = 'bg-[#121712] text-white border-2 border-emerald-500 shadow-md';
              badgeClasses = 'bg-emerald-500 text-white font-black';
            } else {
              // Khối focus: GẦN ĐEN (#121712), badge XANH CHANH (#C8F169)
              cardClasses = 'bg-[#121712] text-white border-2 border-[#121712] shadow-md ring-2 ring-[#C8F169]/40';
              badgeClasses = 'bg-[#C8F169] text-[#121712] font-black';
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
              className={`w-full text-left p-3.5 rounded-[14px] transition-all cursor-pointer flex items-center justify-between gap-4 ${cardClasses}`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs tracking-tight ${badgeClasses}`}>
                    Bước {step.stepNumber}
                  </span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>
                    {step.stepNumber === 1 ? 'Phương pháp' : step.stepNumber === 2 ? 'Biến đổi' : 'Kết luận'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-xs sm:text-sm leading-relaxed">
                  {renderStepContent(step.stepNumber, step.content, isSelected)}
                </div>
              </div>

              <div className="text-xs font-bold shrink-0">
                {isSelected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8F169] text-[#121712]">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Đã chọn</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-stone-500 hover:text-stone-900 font-medium">
                    <span>Chọn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
