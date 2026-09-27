import React from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { 
  BoAvatar, 
  WashiTape, 
  PushPin, 
  RubberStampSuccess, 
  HandPointIcon,
  CheckCircleIcon
} from './HandmadeArtwork';

interface WorkingObjectSheetProps {
  lesson: MisconceptionItem;
  currentState: DREState;
  selectedStep: number | null;
  onSelectStep: (stepNumber: number) => void;
  boSpeechOverride?: string | null;
}

export const WorkingObjectSheet: React.FC<WorkingObjectSheetProps> = ({
  lesson,
  currentState,
  selectedStep,
  onSelectStep,
  boSpeechOverride,
}) => {
  // Determine Bo speech bubble text
  let boSpeech = boSpeechOverride;
  if (!boSpeech) {
    if (currentState === 'BO_CHALLENGE' || currentState === 'AWAITING_REBUTTAL') {
      boSpeech = 'Ủa nhưng tớ thấy làm thế này nhanh hơn nhiều mà? Cậu chỉ ra xem tớ sai chỗ nào?';
    } else if (currentState === 'CLOSE') {
      boSpeech = 'Ơ, đúng ha! Cảm ơn cậu, tớ sẽ nhớ kỹ hơn.';
    } else if (currentState === 'PROBE') {
      boSpeech = 'Ủa, chỗ đó tớ có làm gì sai thật hả cậu?';
    } else if (currentState === 'HINT') {
      boSpeech = 'Dòng đó tớ kiểm tra kỹ rồi mà ta? Cậu xem lại các dòng khác thử xem!';
    } else {
      boSpeech = 'Tớ giải xong rồi nè, chắc đúng á. Cậu xem giúp tớ với?';
    }
  }

  const isClosed = currentState === 'CLOSE';

  return (
    <div className="relative w-full bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-sm p-3.5 sm:p-5 sketchbook-shadow notebook-sheet rotate-[-0.6deg] transition-transform hover:rotate-0">
      {/* Top Corner Washi Tape & PushPin */}
      <WashiTape variant="blue" className="absolute -top-2.5 left-10 w-28 -rotate-2" />
      <PushPin color="#E8A33D" className="absolute top-3 right-4" />

      {/* Rubber Stamp when successfully solved */}
      {isClosed && (
        <div className="absolute top-4 right-12 z-20 animate-in fade-in zoom-in-90 duration-300">
          <RubberStampSuccess />
        </div>
      )}

      {/* Bo's Section: Cute Polaroid + Handcrafted Speech Bubble */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-3.5 border-b border-[#E8DFD0] mb-3.5">
        <BoAvatar 
          size="sm" 
          expression={
            currentState === 'BO_CHALLENGE' || currentState === 'AWAITING_REBUTTAL'
              ? 'skeptical'
              : currentState === 'CLOSE'
              ? 'embarrassed'
              : 'confident'
          }
          className="-rotate-3 shrink-0" 
        />

        {/* Hand-drawn speech bubble */}
        <div className="relative flex-1 bg-[#FFF9EC] p-3.5 sm:p-4 rounded-sm border-2 border-[#F0D5A3] shadow-xs">
          {/* Bubble tail on left for desktop / top for mobile */}
          <div className="hidden sm:block absolute top-1/2 -left-2.5 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-r-8 border-r-[#F0D5A3]" />
          <div className="sm:hidden absolute -top-2 left-5 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-b-8 border-b-[#F0D5A3]" />

          <p className="font-handwriting text-lg sm:text-xl text-[#3E342B] leading-snug">
            &ldquo;{boSpeech}&rdquo;
          </p>
          <div className="text-xs text-[#A67527] font-handwriting font-bold mt-1.5 flex items-center gap-1">
            <span>— Bo</span>
            <span className="text-[#B5863B] font-normal">(Bài giải của tớ ở dưới nè)</span>
          </div>
        </div>
      </div>

      {/* Math Worksheet Title */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-handwriting font-bold text-sm text-[#7B6E61] bg-[#EFE8DA] px-2.5 py-0.5 rounded-xs border border-[#DFD5C2]">
            Đề bài
          </span>
          <span className="text-sm font-semibold text-[#4A3D2F]">
            {lesson.workingObject.title}
          </span>
        </div>
        <p className="text-xs text-[#87796D] font-handwriting italic">
          Bấm vào dòng em nghi ngờ là sai để bắt đầu soi lỗi:
        </p>
      </div>

      {/* Numbered Solution Steps in Clear Printed Academic Typography */}
      <div className="space-y-2 sm:space-y-2.5">
        {lesson.workingObject.steps.map((step) => {
          const isSelected = selectedStep === step.stepNumber;
          const isErrorStep = step.stepNumber === lesson.errorStepIndex;

          let stepContainerClasses = 'bg-white border-[#DFD7C9] text-[#29231E] hover:border-[#C4B7A2]';
          let highlightStroke = null;

          if (isSelected) {
            if (isClosed && isErrorStep) {
              // CLOSE: Moss green styling
              stepContainerClasses = 'bg-[#F2F8F0] border-[#6B9E5C] text-[#243B1F] font-semibold';
              highlightStroke = (
                <div className="absolute inset-0 pointer-events-none border-2 border-[#6B9E5C] rounded-xs bg-[#6B9E5C]/12 flex items-center justify-end pr-3">
                  <span className="px-2 py-0.5 bg-[#6B9E5C] text-white text-xs font-handwriting font-bold rounded-xs flex items-center gap-1 shadow-2xs">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                    <span>Đúng vị trí sai</span>
                  </span>
                </div>
              );
            } else if (currentState === 'HINT') {
              // HINT: Selected wrong step, faint fading amber highlighter
              stepContainerClasses = 'bg-[#FAF7F0] border-[#DFD7C9] opacity-80';
              highlightStroke = (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#DFD7C9] rounded-xs bg-amber-50/20" />
              );
            } else {
              // MARKED / EXPLAIN_PROMPT / PROBE: Amber highlighter stroke
              stepContainerClasses = 'bg-[#FFF9EE] border-[#E8A33D] text-[#332512] font-medium shadow-xs';
              highlightStroke = (
                <div className="absolute inset-0 pointer-events-none border-2 border-[#E8A33D] rounded-xs bg-[#E8A33D]/15 flex items-center justify-end pr-3">
                  <span className="px-2 py-0.5 bg-[#E8A33D] text-white text-xs font-handwriting font-bold rounded-xs shadow-2xs rotate-[-1deg]">
                    Dòng đang soi
                  </span>
                </div>
              );
            }
          }

          return (
            <button
              key={step.stepNumber}
              onClick={() => onSelectStep(step.stepNumber)}
              type="button"
              className={`relative w-full text-left p-2 sm:p-2.5 rounded-xs border-2 transition-all cursor-pointer group flex items-start gap-2.5 ${stepContainerClasses}`}
            >
              {highlightStroke}

              {/* Step Number Tag */}
              <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xs shrink-0 select-none ${
                isSelected 
                  ? isClosed && isErrorStep
                    ? 'bg-[#6B9E5C] text-white' 
                    : 'bg-[#E8A33D] text-white'
                  : 'bg-[#EFE9DD] text-[#5C5043] group-hover:bg-[#E4DBCB]'
              }`}>
                Bước {step.stepNumber}
              </span>

              {/* Math Expression (Printed clean font, strictly legible) */}
              <div className="flex-1 font-mono text-sm sm:text-base tracking-wide pt-0.5 select-text">
                {step.content}
              </div>

              {/* Subtle hover prompt */}
              {!isSelected && (
                <span className="text-xs font-handwriting text-[#9C8F80] group-hover:text-[#524436] shrink-0 self-center hidden sm:flex items-center gap-1">
                  <span>Bấm để chọn</span>
                  <HandPointIcon className="w-3.5 h-3.5 text-[#A6998A]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tactile footer scribble */}
      <div className="mt-5 pt-3 border-t border-dashed border-[#DFD7C9] flex items-center justify-between text-xs text-[#8C7F72]">
        <span className="font-handwriting">
          * Đừng lo bấm nhầm, Cô Lam luôn ở đây hướng dẫn em!
        </span>
        <span className="font-mono text-[11px]">
          Loại: {lesson.errorType}
        </span>
      </div>
    </div>
  );
};
