// File: src/components/WorkingObjectSheet.tsx
import React from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { BoAvatar, BoCircleAvatar, CheckCircleIcon } from './HandmadeArtwork';
import { Vec, PrismVectorDiagram, MathColorLegend, FormattedMathText } from './MathVector';
import { sound } from '../utils/soundEffects';

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
  const renderStepContent = (stepNum: number, defaultContent: string) => {
    if (lesson.id === 'MISC_VECTO_12') {
      if (stepNum === 1) {
        return (
          <span>
            Chèn điểm A vào vectơ <Vec role="target">B'C</Vec> theo quy tắc hiệu chung gốc A:
          </span>
        );
      }
      if (stepNum === 2) {
        return (
          <span className="text-xs sm:text-sm">
            <Vec role="target">B'C</Vec> = <Vec role="reference">AB'</Vec> − <Vec role="reference">AC</Vec>{' '}
            <span className="text-xs text-stone-500 font-normal">(Lấy điểm trước trừ điểm sau)</span>
          </span>
        );
      }
      if (stepNum === 3) {
        return (
          <span className="text-xs sm:text-sm">
            Vì <Vec role="reference">AB'</Vec> = <Vec role="reference">AA'</Vec> + <Vec role="reference">AB</Vec> = <Vec role="reference">a</Vec> + <Vec role="reference">b</Vec> nên{' '}
            <Vec role="target">B'C</Vec> = <Vec role="reference">a</Vec> + <Vec role="reference">b</Vec> − <Vec role="reference">c</Vec>
          </span>
        );
      }
    }
    return <span className="font-medium text-stone-800">{cleanText(defaultContent)}</span>;
  };

  return (
    <div className="w-full flex flex-col justify-start space-y-3.5">
      {/* Vở bài tập của Bo */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFFBF2] border border-[#F0E6D2]">
        <div className="flex flex-col items-center shrink-0">
          <BoCircleAvatar className="w-9 h-9 shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[#8A4B08]">
            {isCompleted ? 'Bo đã sửa lại bài giải:' : 'Vở bài tập của Bo:'}
          </div>
          <p className="text-xs text-stone-700 leading-snug mt-1">
            "{boSpeechOverride ? (
              <FormattedMathText text={cleanText(boSpeechOverride)} />
            ) : (
              'Mình giải xong 3 bước dưới đây rồi, bạn kiểm tra giúp mình xem có dòng nào bị nhầm không nhé!'
            )}"
          </p>
        </div>
      </div>

      {/* Đề bài Thực hành + Chú giải màu sắc */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#0e7490] bg-[#ecfeff] border border-[#a5f3fc] px-2.5 py-0.5 rounded-md">
            Đề bài thực hành
          </span>
          <MathColorLegend />
        </div>
        <h2 className="font-bold text-xs sm:text-sm text-stone-900 leading-relaxed">
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
      </div>

      {/* HÌNH VẼ TRỰC QUAN KHÔNG GIAN: LĂNG TRỤ TAM GIÁC VỚI CÁC MŨI TÊN VECTƠ ĐA SẮC */}
      {lesson.id === 'MISC_VECTO_12' && (
        <PrismVectorDiagram className="animate-in fade-in duration-150" />
      )}

      {/* Hướng dẫn chọn bước giải */}
      <div className="flex items-center justify-between text-xs text-stone-600 font-medium pt-0.5">
        <span>Bấm trực tiếp vào bước giải bạn phát hiện có lỗi sai:</span>
        <span className="text-[11px] text-stone-400">Chọn 1 trong 3 bước</span>
      </div>

      {/* Danh sách 3 bước giải của Bo */}
      <div className="space-y-2">
        {lesson.workingObject.steps.map((step) => {
          const isSelected = selectedStep === step.stepNumber;
          const isErrorStep = step.stepNumber === lesson.errorStepIndex;

          let cardStyle = 'bg-white hover:bg-stone-50 border-stone-200 text-stone-900';
          let badgeStyle = 'bg-stone-100 text-stone-700';

          if (isSelected) {
            if (isCompleted && isErrorStep) {
              cardStyle = 'bg-emerald-50/80 border-emerald-500 border-2 text-emerald-950 shadow-xs';
              badgeStyle = 'bg-emerald-600 text-white';
            } else if (currentState === 'HINT' && !isErrorStep) {
              cardStyle = 'bg-amber-50/70 border-amber-500 border-2 text-amber-950';
              badgeStyle = 'bg-amber-600 text-white';
            } else {
              cardStyle = 'bg-amber-50/40 border-amber-500 border-2 text-stone-900 shadow-2xs';
              badgeStyle = 'bg-amber-600 text-white';
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
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${cardStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${badgeStyle}`}>
                    Bước {step.stepNumber}
                  </span>
                  <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-tighter">
                    {step.stepNumber === 1 ? 'Phương pháp' : step.stepNumber === 2 ? 'Biến đổi' : 'Kết luận'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-xs sm:text-sm font-medium leading-relaxed">
                  {renderStepContent(step.stepNumber, step.content)}
                </div>
              </div>

              <div className="text-xs font-semibold shrink-0">
                {isSelected ? (
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    {isCompleted && isErrorStep && <CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
                    <span>Đã chọn</span>
                  </span>
                ) : (
                  <span className="text-stone-500 hover:text-stone-900 flex items-center gap-1">
                    <span>Chọn</span>
                    <span>➔</span>
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
