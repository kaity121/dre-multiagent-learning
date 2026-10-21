// File: src/components/InteractionCardSheet.tsx
import React, { useState, useEffect } from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { 
  TutorLamAvatar, 
  BoAvatar, 
  BoCircleAvatar,
  LinhChiNoteTakerAvatar, 
  RubberStampSuccess, 
  CheckCircleIcon,
  EyeSticker,
  LightbulbSticker
} from './HandmadeArtwork';
import { Vec, MathView, FormattedMathText } from './MathVector';
import { sound } from '../utils/soundEffects';

interface InteractionCardSheetProps {
  lesson: MisconceptionItem;
  currentState: DREState;
  selectedStep: number | null;
  onSelectStep?: (stepNumber: number) => void;
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

const cleanText = (str?: string | null) => (str ? str.replace(/\u20d7/g, '').replace(/🌸|📝|⚠️|💡/g, '').trim() : '');

export const InteractionCardSheet: React.FC<InteractionCardSheetProps> = React.memo(({
  lesson,
  currentState,
  selectedStep,
  onSelectStep,
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
  hintLevel = 0,
}) => {
  // Sổ tay Linh Chi: Mặc định thu gọn để rèn luyện phản xạ, học sinh bấm mở khi cần tra cứu
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);

  useEffect(() => {
    if (currentState === 'HINT' || currentState === 'CLOSE') {
      setIsCheatSheetOpen(true);
    }
  }, [currentState]);

  return (
    <div className="w-full flex flex-col justify-start space-y-3.5">
      {/* PHẦN 1: TỜ SỔ TAY ĐỐI CHIẾU CỦA LINH CHI (CÓ NÚT BẤM ĐÓNG / MỞ BÍ KÍP) */}
      <div className="p-3.5 bg-pink-50/70 border border-pink-200/90 rounded-2xl space-y-2 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <LinhChiNoteTakerAvatar className="w-6 h-6 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-rose-950 text-xs sm:text-sm block truncate">
                Sổ tay Quy tắc chuẩn của Linh Chi
              </span>
              <p className="text-[10px] text-rose-700/80 truncate">
                {isCheatSheetOpen ? 'Đang mở bí kíp đối chiếu công thức' : 'Ẩn bí kíp để bạn tự rèn luyện phản xạ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playPencilTap();
              setIsCheatSheetOpen((prev) => !prev);
            }}
            className="h-7 px-2.5 bg-white hover:bg-pink-100/60 text-rose-800 border border-pink-300 font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 whitespace-nowrap"
          >
            {isCheatSheetOpen ? (
              <span>✕ Thu gọn</span>
            ) : (
              <>
                <EyeSticker className="w-3.5 h-3.5 text-rose-700" />
                <span>Xem bí kíp</span>
              </>
            )}
          </button>
        </div>

        {/* NỘI DUNG SỔ TAY KHI MỞ RA (ĐÃ IMPORT MATHVIEW, 100% AN TOÀN, KHÔNG CRASH) */}
        {isCheatSheetOpen && (
          <div className="pt-2.5 border-t border-pink-200/70 space-y-2 animate-in fade-in duration-150 text-xs">
            <div className="text-stone-800 space-y-1.5">
              <span className="font-bold text-rose-900">• Quy tắc hiệu chung gốc (Khẩu quyết Thầy Tiến):</span>
              <div className="bg-white/90 p-2.5 rounded-xl border border-pink-100 overflow-x-auto no-scrollbar font-medium">
                {currentState === 'IDLE' || currentState === 'MARKED' ? (
                  <div className="space-y-1">
                    <MathView
                      tex="\overrightarrow{OA} - \overrightarrow{OB} = \overrightarrow{BA}"
                      className="text-xs font-bold text-[#0e7490]"
                    />
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      "Chung đầu – Lộn ngược: Điểm sau B viết lên trước, điểm trước A viết ra sau."
                    </p>
                  </div>
                ) : lesson.id === 'MISC_VECTO_12' ? (
                  <MathView
                    tex="\overrightarrow{B'C} = \overrightarrow{AC} - \overrightarrow{AB'} = \vec{c} - (\vec{a} + \vec{b}) = \vec{c} - \vec{a} - \vec{b}"
                    className="text-xs font-bold text-rose-900"
                  />
                ) : (
                  <p className="leading-relaxed">{cleanText(lesson.standardExplanation)}</p>
                )}
              </div>
            </div>

            {(currentState === 'HINT' || currentState === 'BO_CHALLENGE' || currentState === 'CLOSE') && (
              <p className="text-amber-900 text-[11px] font-medium leading-relaxed bg-amber-50/80 p-2 rounded-xl border border-amber-200/70 animate-in fade-in duration-150">
                • <strong>Lưu ý bẫy:</strong> {cleanText(lesson.hintLevel1)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* PHẦN 2: TƯƠNG TÁC ĐỘNG THEO TỪNG BƯỚC */}
      <div className="flex flex-col space-y-3">
        {/* TRẠNG THÁI 1: CHƯA CHỌN BƯỚC SAI */}
        {currentState === 'IDLE' && (
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-[#92400E] flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-xs text-stone-800">
                    Bước 1: Bắt lỗi bài giải của Bo
                  </div>
                  <p className="text-[10px] text-stone-500">
                    Đối chiếu với hình lăng trụ bên trái để phát hiện bước bị nhầm
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                Gợi ý: {Math.max(0, 3 - hintLevel)}/3 lượt
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-stone-700">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-100">
                <span className="font-bold text-stone-500 text-[11px] shrink-0">Bước 1:</span>
                <span className="text-[11px]">Chèn điểm A vào vectơ mục tiêu <Vec role="target">B'C</Vec>.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-100">
                <span className="font-bold text-stone-500 text-[11px] shrink-0">Bước 2:</span>
                <span className="text-[11px]">Quy tắc hiệu vectơ (Kiểm tra thứ tự điểm trước / sau).</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-100">
                <span className="font-bold text-stone-500 text-[11px] shrink-0">Bước 3:</span>
                <span className="text-[11px]">Thế các vectơ cơ sở <Vec role="reference">a</Vec>, <Vec role="reference">b</Vec>, <Vec role="reference">c</Vec>.</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 italic text-center pt-0.5">
              Bấm vào 1 bước giải ở cột bên trái để bắt đầu phản biện!
            </p>
          </div>
        )}

        {/* TRẠNG THÁI 2: ĐÃ CHỌN BƯỚC */}
        {(currentState === 'MARKED' || currentState === 'EXPLAIN_PROMPT' || currentState === 'TUTOR_NUDGE') && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {selectedStep === 1 && lesson.id === 'MISC_VECTO_12' ? (
              <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-stone-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] shrink-0 font-bold">!</span>
                  <span>Bước 1: Bo chỉ nêu phương pháp chèn điểm A (Hoàn toàn đúng hướng)</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Ý tưởng chèn điểm A vào vectơ <Vec role="target">B'C</Vec> là chuẩn mực để đưa về 3 vectơ cơ sở. Lỗi sai nằm ở <strong>công thức biến đổi quy tắc hiệu</strong> ở dòng tiếp theo!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    onSelectStep?.(2);
                  }}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <span>Chuyển sang kiểm tra Bước 2 ➔</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-stone-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">
                    Bước 2: Vì sao Bước {selectedStep} của Bo chưa đúng?
                  </span>
                  {lesson.nudgeStarter && (
                    <button
                      type="button"
                      onClick={() => onExplanationChange(cleanText(lesson.nudgeStarter))}
                      className="px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all shadow-2xs shrink-0"
                    >
                      <span>Điền mẫu câu gợi ý</span>
                    </button>
                  )}
                </div>

                <textarea
                  value={explanationText}
                  onChange={(e) => onExplanationChange(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      sound.playStampThud();
                      onSubmitExplanation();
                    }
                  }}
                  rows={3}
                  placeholder="Nhập lý do toán học hoặc bấm 'Điền mẫu câu gợi ý' ở trên... (Ctrl+Enter để gửi)"
                  className="w-full p-3 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 outline-none focus:border-[#1B4338] focus:ring-1 focus:ring-[#1B4338]"
                />

                <button
                  type="button"
                  disabled={isLoadingAi}
                  onClick={() => {
                    sound.playStampThud();
                    onSubmitExplanation();
                  }}
                  className="w-full py-2.5 bg-[#1B4338] hover:bg-[#285E4F] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  {isLoadingAi ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Đang phân tích lời giải...</span>
                    </>
                  ) : (
                    <span>Gửi phân tích & Kiểm tra bước đã chọn ➔</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TRẠNG THÁI 3: CHỌN NHẦM BƯỚC ĐÚNG */}
        {currentState === 'HINT' && (
          <div className="p-4 rounded-xl bg-[#FFF5F5] border border-[#F8B4A5] space-y-2.5 animate-in fade-in duration-150">
            <div className="font-bold text-xs text-[#9B1C1C]">
              Bước {selectedStep} này Bo làm đúng rồi! Bạn kiểm tra lại các bước còn lại nhé:
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
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
          <div className="p-4 rounded-2xl bg-[#FFFBF2] border border-[#F3DFA8] space-y-3 animate-in fade-in duration-150 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <BoCircleAvatar className="w-8 h-8 shrink-0 mt-0.5" />
              <div className="text-xs text-stone-800 leading-relaxed">
                <span className="font-bold text-[#92400E] block mb-0.5">
                  Bạn bắt trúng Bước {selectedStep} rồi, nhưng Bo vẫn thắc mắc:
                </span>
                "{boSpeechOverride ? (
                  <FormattedMathText text={cleanText(boSpeechOverride)} />
                ) : (
                  <FormattedMathText text={cleanText(lesson.errorDescription)} />
                )}"
              </div>
            </div>

            {tutorFeedbackOverride && (
              <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 leading-relaxed flex items-start gap-2 animate-in fade-in duration-150">
                <span className="font-bold shrink-0">💡 Gợi ý:</span>
                <span className="flex-1">{cleanText(tutorFeedbackOverride)}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onRebuttalChange?.(cleanText(lesson.standardExplanation))}
                className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 hover:border-[#1B4338] text-stone-800 text-xs cursor-pointer font-medium transition-colors"
              >
                Chọn nhanh: "Quy tắc hiệu chung đầu A thì phải lộn ngược điểm sau lên trước: B'C = AC – AB'."
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={rebuttalText}
                onChange={(e) => onRebuttalChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoadingAi && rebuttalText.trim()) {
                    sound.playSuccessChime();
                    onSubmitRebuttal?.();
                  }
                }}
                placeholder="Gõ lời giải thích chốt hạ cho Bo (hoặc chọn nhanh ở trên)..."
                className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs outline-none focus:border-[#1B4338] focus:ring-1 focus:ring-[#1B4338]"
              />
              <button
                type="button"
                disabled={isLoadingAi || !rebuttalText.trim()}
                onClick={() => {
                  sound.playSuccessChime();
                  onSubmitRebuttal?.();
                }}
                className="px-4 py-2 bg-[#1B4338] hover:bg-[#285E4F] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {isLoadingAi ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin shrink-0" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi ➔</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TRẠNG THÁI 5: HOÀN THÀNH SỬA LỖI */}
        {currentState === 'CLOSE' && (
          <div className="p-4 rounded-2xl bg-[#EBF7F3] border border-[#2E6859] space-y-3 animate-in zoom-in-95 duration-150 shadow-2xs">
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
});
