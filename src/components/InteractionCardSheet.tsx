// File: src/components/InteractionCardSheet.tsx
import React from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { 
  TutorLamAvatar, 
  BoAvatar, 
  LinhChiNoteTakerAvatar, 
  RubberStampSuccess, 
  CheckCircleIcon 
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

interface InteractionCardSheetProps {
  lesson: MisconceptionItem;
  currentState: DREState;
  selectedStep: number | null;
  explanationText: string;
  rebuttalText?: string;
  onExplanationChange: (text: string) => void;
  onRebuttalChange?: (text: string) => void;
  onSubmitExplanation: () => void;
  onSubmitRebuttal?: () => void;
  onRequestHint: () => void;
  onNextLesson: () => void;
  onRetryLesson: () => void;
  onAcceptNudgeHint?: () => void;
  onDismissNudge?: () => void;
  tutorFeedbackOverride?: string | null;
  probeQuestionOverride?: string | null;
  boSpeechOverride?: string | null;
  isLoadingAi?: boolean;
  hintLevel?: number;
}

const cleanText = (str?: string) =>
  str
    ? str
        .replace(/\u20d7/g, '')
        .replace(/🌸|📝|⚠️|💡/g, '')
        .trim()
    : '';

export const InteractionCardSheet: React.FC<InteractionCardSheetProps> = ({
  lesson,
  currentState,
  selectedStep,
  explanationText,
  rebuttalText = '',
  onExplanationChange,
  onRebuttalChange,
  onSubmitExplanation,
  onSubmitRebuttal,
  onNextLesson,
  onRetryLesson,
  tutorFeedbackOverride,
  boSpeechOverride,
  isLoadingAi = false,
}) => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-2 sm:p-4 space-y-4">
      {/* PHẦN LUÔN HIỆN Ở TRÊN: TỜ SỔ TAY ĐỐI CHIẾU QUY TẮC CỦA LINH CHI */}
      <div className="p-4 bg-[#FFF5F9] border border-[#F472B6]/60 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinhChiNoteTakerAvatar className="w-6 h-6 shrink-0" />
            <span className="font-bold text-[#9D174D] text-xs sm:text-sm">
              Sổ tay Quy tắc chuẩn của Linh Chi
            </span>
          </div>
          <span className="text-[10px] font-semibold bg-white text-[#9D174D] px-2 py-0.5 rounded-md border border-[#FBCFE8]">
            Gợi ý đối chiếu
          </span>
        </div>

        <p className="text-xs text-[#1E242B] leading-relaxed">
          • <strong>Quy tắc chuẩn:</strong> {cleanText(lesson.standardExplanation)}
        </p>
        <p className="text-xs text-[#9D174D] font-medium">
          • <strong>Lưu ý bẫy:</strong> {cleanText(lesson.hintLevel1)}
        </p>
      </div>

      {/* PHẦN TƯƠNG TÁC ĐỘNG Ở DƯỚI THEO TỪNG BƯỚC */}
      <div className="flex-1 flex flex-col justify-center">
        {/* TRẠNG THÁI 1: CHƯA CHỌN BƯỚC SAI (Gọn gàng, không lặp chữ thừa) */}
        {currentState === 'IDLE' && (
          <div className="p-5 rounded-xl bg-[#FAF8F5] border border-dashed border-[#D8CEBC] text-center space-y-1.5">
            <div className="font-bold text-sm text-[#1E242B]">
              Bước 1: Chọn dòng bị sai ở cột bên trái
            </div>
            <p className="text-xs text-[#6E6254]">
              Hãy đối chiếu Sổ tay của Linh Chi ở trên với 3 bước giải của Bo bên trái và bấm vào bước bạn phát hiện có lỗi.
            </p>
          </div>
        )}

        {/* TRẠNG THÁI 2: ĐÃ CHỌN BƯỚC -> NHẬP HOẶC CHỌN LÝ DO */}
        {(currentState === 'MARKED' || currentState === 'EXPLAIN_PROMPT' || currentState === 'TUTOR_NUDGE') && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E242B]">
                Bước 2: Vì sao Bước {selectedStep} của Bo chưa đúng?
              </span>
              {lesson.nudgeStarter && (
                <button
                  type="button"
                  onClick={() => onExplanationChange(cleanText(lesson.nudgeStarter))}
                  className="quick-prompt-pill bg-white hover:bg-[#EBF7F3] border border-[#D8CEBC] text-[#1B4338] cursor-pointer"
                >
                   Điền mẫu câu gợi ý
                </button>
              )}
            </div>

            <textarea
              value={explanationText}
              onChange={(e) => onExplanationChange(e.target.value)}
              rows={3}
              placeholder="Nhập lý do toán học hoặc bấm 'Điền mẫu câu gợi ý' ở trên..."
              className="w-full p-3 bg-white border border-[#D8CEBC] rounded-xl text-xs text-[#1E242B] outline-none focus:border-[#1B4338]"
            />

            <button
              type="button"
              onClick={() => {
                sound.playStampThud();
                onSubmitExplanation();
              }}
              className="w-full py-2.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
            >
              Kiểm tra bước đã chọn ➔
            </button>
          </div>
        )}

        {/* TRẠNG THÁI 3: CHỌN NHẦM BƯỚC ĐÚNG */}
        {currentState === 'HINT' && (
          <div className="p-4 rounded-xl bg-[#FFF5F5] border border-[#F8B4A5] space-y-2.5 animate-in fade-in duration-150">
            <div className="font-bold text-xs text-[#9B1C1C]">
              Bước {selectedStep} này Bo làm đúng rồi! Bạn kiểm tra lại các bước còn lại nhé:
            </div>
            <p className="text-xs text-[#374151] leading-relaxed">
              {cleanText(tutorFeedbackOverride || lesson.hintLevel1)}
            </p>
            <button
              type="button"
              onClick={onRetryLesson}
              className="px-3.5 py-1.5 bg-white border border-[#F8B4A5] text-[#9B1C1C] font-semibold text-xs rounded-lg cursor-pointer"
            >
              Chọn lại bước khác
            </button>
          </div>
        )}

        {/* TRẠNG THÁI 4: CHỌN ĐÚNG BƯỚC SAI -> BO CÃI LẠI */}
        {currentState === 'BO_CHALLENGE' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-3 rounded-xl bg-[#FFFBF2] border border-[#F3DFA8] flex items-start gap-2.5">
              <BoAvatar size="sm" expression="skeptical" className="shrink-0 scale-90" />
              <div className="text-xs text-[#2F2923] leading-relaxed">
                <span className="font-bold text-[#92400E] block mb-0.5">
                  Bạn bắt trúng Bước {selectedStep} rồi, nhưng Bo vẫn thắc mắc:
                </span>
                “{cleanText(boSpeechOverride || lesson.errorDescription)}”
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onRebuttalChange?.(cleanText(lesson.standardExplanation))}
                className="quick-prompt-box rounded-lg bg-[#FAF8F5] hover:bg-[#EBF7F3] border border-[#D8CEBC] text-[#1E242B] cursor-pointer text-left"
              >
                Chọn nhanh quy tắc chuẩn của Linh Chi để giải thích cho Bo
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={rebuttalText}
                onChange={(e) => onRebuttalChange?.(e.target.value)}
                placeholder="Gõ lời giải thích chốt hạ cho Bo..."
                className="flex-1 px-3 py-2 bg-white border border-[#D8CEBC] rounded-xl text-xs outline-none focus:border-[#1B4338]"
              />
              <button
                type="button"
                disabled={isLoadingAi}
                onClick={() => {
                  sound.playSuccessChime();
                  onSubmitRebuttal?.();
                }}
                className="px-4 py-2 bg-[#1B4338] text-white font-semibold text-xs rounded-xl cursor-pointer shrink-0"
              >
                Gửi
              </button>
            </div>
          </div>
        )}

        {/* TRẠNG THÁI 5: HOÀN THÀNH SỬA LỖI */}
        {currentState === 'CLOSE' && (
          <div className="p-4 rounded-xl bg-[#EBF7F3] border border-[#2E6859] space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TutorLamAvatar size="sm" className="scale-90 shrink-0" />
                <span className="font-bold text-sm text-[#1B4338]">
                  Chẩn đoán & Sửa lỗi thành công!
                </span>
              </div>
              <RubberStampSuccess className="scale-75 shrink-0" />
            </div>

            <p className="text-xs text-[#1E3B33] leading-relaxed">
              {cleanText(tutorFeedbackOverride || lesson.standardExplanation)}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onNextLesson}
                className="flex-1 py-2 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>Chuyển sang bài tiếp theo ➔</span>
              </button>
              <button
                type="button"
                onClick={onRetryLesson}
                className="px-3 py-2 bg-white border border-[#2E6859] text-[#1B4338] font-semibold text-xs rounded-lg cursor-pointer"
              >
                Làm lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
