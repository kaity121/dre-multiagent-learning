// File: src/components/InteractionCardSheet.tsx
import React, { useState, useEffect } from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { AgentAvatar } from './AgentAvatar';
import { Vec, MathView, FormattedMathText } from './MathVector';
import { sound } from '../utils/soundEffects';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  MousePointerClick
} from 'lucide-react';

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
  onSwitchToStation3?: () => void;
  onAcceptNudgeHint?: () => void;
  onDismissNudge?: () => void;
  tutorFeedbackOverride?: string | null;
  probeQuestionOverride?: string | null;
  boSpeechOverride?: string | null;
  isLoadingAi?: boolean;
  hintLevel?: number;
}

const cleanText = (str?: string | null) => (str ? str.replace(/\u20d7/g, '').replace(/[\u{1F300}-\u{1F9FF}\u2600-\u26FF]/gu, '').trim() : '');

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
  onSwitchToStation3,
  tutorFeedbackOverride,
  boSpeechOverride,
  isLoadingAi = false,
  hintLevel = 0,
}) => {
  // Sổ tay Linh Chi: Mặc định mở để học viên đối chiếu công thức và cân bằng chiều cao 2 cột
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(true);

  useEffect(() => {
    if (currentState === 'HINT' || currentState === 'CLOSE') {
      setIsCheatSheetOpen(true);
    }
  }, [currentState]);

  return (
    <div className="w-full flex flex-col justify-start space-y-3.5">
      {/* PHẦN 1: SỔ TAY ĐỐI CHIẾU LINH CHI (Card cấp 1, TONE LIME SOFT) */}
      <div className="p-4 bg-white border border-[#E2EAD2] rounded-[16px] space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <AgentAvatar role="linhchi" size={32} tooltip />
            <div className="min-w-0">
              <span className="font-bold text-[#121712] text-sm block truncate">
                Sổ tay quy tắc chuẩn · Linh Chi
              </span>
              <p className="text-xs text-stone-600 truncate">
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
            className="h-8 px-3 bg-white hover:bg-stone-50 text-[#121712] border border-stone-300 font-semibold text-xs rounded-full cursor-pointer flex items-center gap-1.5 transition shrink-0 shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isCheatSheetOpen ? 'Thu gọn' : 'Xem bí kíp'}</span>
            {isCheatSheetOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* NỘI DUNG SỔ TAY KHI MỞ RA (Khối cấp 2) */}
        {isCheatSheetOpen && (
          <div className="pt-2.5 border-t border-[#E2EAD2] space-y-2.5 animate-in fade-in duration-150 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-700 block">
                Quy tắc hiệu chung gốc (Khẩu quyết Thầy Tiến):
              </span>
              <div className="bg-[#F3F8E8] p-3 rounded-[12px] border border-[#E2EAD2] overflow-x-auto no-scrollbar font-medium">
                {currentState === 'IDLE' || currentState === 'MARKED' ? (
                  <div className="space-y-1">
                    <MathView
                      tex="\overrightarrow{OA} - \overrightarrow{OB} = \overrightarrow{BA}"
                      className="text-xs sm:text-sm font-bold text-[#2563EB]"
                    />
                    <p className="text-xs text-stone-600 mt-1">
                      "Chung đầu – Lộn ngược: Điểm sau B viết lên trước, điểm trước A viết ra sau."
                    </p>
                  </div>
                ) : lesson.id === 'MISC_VECTO_12' ? (
                  <MathView
                    tex="\overrightarrow{B'C} = \overrightarrow{AC} - \overrightarrow{AB'} = \vec{c} - (\vec{a} + \vec{b}) = \vec{c} - \vec{a} - \vec{b}"
                    className="text-xs sm:text-sm font-bold text-[#121712]"
                  />
                ) : (
                  <p className="leading-relaxed">{cleanText(lesson.standardExplanation)}</p>
                )}
              </div>
            </div>

            {(currentState === 'HINT' || currentState === 'BO_CHALLENGE' || currentState === 'CLOSE') && (
              <div className="p-3 bg-amber-50/80 rounded-[12px] border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Lưu ý bẫy:</span> {cleanText(lesson.hintLevel1)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PHẦN 2: TƯƠNG TÁC ĐỘNG THEO TỪNG BƯỚC (Card cấp 1) */}
      <div className="space-y-3.5">
        {/* TRẠNG THÁI 1: CHƯA CHỌN BƯỚC NÀO (Không lặp lại danh sách 3 bước) */}
        {currentState === 'IDLE' && (
          <div className="p-6 rounded-[16px] bg-white border border-[#E2EAD2] text-center space-y-3.5 shadow-xs">
            <div className="w-11 h-11 rounded-full bg-[#F3F8E8] border border-[#E2EAD2] text-[#121712] flex items-center justify-center mx-auto">
              <MousePointerClick className="w-5 h-5 text-stone-700" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#121712] text-balance">Chưa chọn bước giải cần bắt lỗi</h3>
              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                Hãy bấm trực tiếp vào 1 trong 3 bước giải ở cột bên trái để bắt đầu phân tích và chỉ ra lỗi sai của Bo.
              </p>
            </div>

            {/* Lời dặn dò phương pháp của Cô Lam */}
            <div className="p-3 rounded-[12px] bg-[#F3F8E8] border border-[#E2EAD2] flex items-center gap-3 text-xs text-stone-700 text-left mt-1">
              <AgentAvatar role="colam" size={32} tooltip />
              <div className="leading-relaxed">
                <span className="font-bold text-[#121712]">Lời dặn của Cô Lam:</span> Quan sát kỹ chiều mũi tên của vectơ <Vec role="target">B'C</Vec> và quy tắc trừ hai vectơ chung gốc A để phát hiện lỗi của Bo!
              </div>
            </div>
          </div>
        )}

        {/* TRẠNG THÁI 2: ĐÃ CHỌN BƯỚC */}
        {(currentState === 'MARKED' || currentState === 'EXPLAIN_PROMPT' || currentState === 'TUTOR_NUDGE') && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {selectedStep === 1 && lesson.id === 'MISC_VECTO_12' ? (
              <div className="p-5 rounded-[16px] bg-white border border-[#E2EAD2] text-[#121712] space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#121712]">
                  <AgentAvatar role="colam" size={32} tooltip />
                  <span>Gợi ý Cô Lam · Bước 1 của Bo hoàn toàn đúng hướng</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  Ý tưởng chèn điểm A vào vectơ <Vec role="target">B'C</Vec> là chuẩn mực để đưa về 3 vectơ cơ sở. Lỗi sai nằm ở <strong>công thức biến đổi quy tắc hiệu</strong> ở dòng tiếp theo!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    onSelectStep?.(2);
                  }}
                  className="w-full py-3 bg-[#121712] hover:bg-black text-white font-bold text-xs sm:text-sm rounded-[14px] cursor-pointer transition shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Chuyển sang kiểm tra Bước 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-[16px] bg-white border border-[#E2EAD2] space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-[#121712]">
                    Phân tích lỗi sai ở Bước {selectedStep}:
                  </span>
                  {lesson.nudgeStarter && (
                    <button
                      type="button"
                      onClick={() => onExplanationChange(cleanText(lesson.nudgeStarter))}
                      className="px-3 py-1 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-[#121712] text-xs font-semibold whitespace-nowrap cursor-pointer transition shadow-2xs shrink-0"
                    >
                      Điền mẫu câu gợi ý
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
                  className="w-full p-3.5 bg-white border border-stone-300 rounded-[14px] text-xs sm:text-sm text-[#121712] outline-none focus:border-[#121712] focus:ring-2 focus:ring-[#121712]/10 transition"
                />

                {/* NÚT CHÍNH DUY NHẤT: NỀN XANH CHANH (#C8F169), CHỮ ĐEN, ĐẬM */}
                <button
                  type="button"
                  disabled={isLoadingAi}
                  onClick={() => {
                    sound.playStampThud();
                    onSubmitExplanation();
                  }}
                  className="w-full py-3.5 bg-[#C8F169] hover:bg-[#bbf054] disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed text-[#121712] font-black text-xs sm:text-sm rounded-[14px] cursor-pointer transition shadow-xs flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isLoadingAi ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin shrink-0" />
                      <span>Đang phân tích lời giải...</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi phân tích & Kiểm tra bước đã chọn</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                {/* Gợi ý lập luận từ Cô Lam */}
                <div className="p-3 rounded-[12px] bg-[#F3F8E8] border border-[#E2EAD2] flex items-center gap-2.5 text-xs text-stone-700">
                  <AgentAvatar role="colam" size={28} tooltip />
                  <div className="leading-relaxed">
                    <span className="font-bold text-[#121712]">Mẹo lập luận:</span> Nhắc Bo nhớ khẩu quyết "Chung đầu – Lộn ngược" khi trừ hai vectơ để Bo tâm phục khẩu phục!
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRẠNG THÁI 3: CHỌN NHẦM BƯỚC ĐÚNG (HINT) */}
        {currentState === 'HINT' && (
          <div className="p-5 rounded-[16px] bg-white border border-amber-200 text-[#121712] space-y-3 shadow-xs animate-in fade-in duration-150">
            <div className="font-bold text-sm text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Bước {selectedStep} này Bo làm đúng rồi! Bạn kiểm tra lại các bước còn lại nhé:</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {cleanText(tutorFeedbackOverride || lesson.hintLevel1)}
            </p>
            <button
              type="button"
              onClick={onRetryLesson}
              className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-[#121712] font-bold text-xs rounded-full cursor-pointer transition shadow-xs"
            >
              Chọn lại bước khác
            </button>
          </div>
        )}

        {/* TRẠNG THÁI 4: CHỌN ĐÚNG BƯỚC SAI -> BO CÃI LẠI */}
        {currentState === 'BO_CHALLENGE' && (
          <div className="p-5 rounded-[16px] bg-white border border-[#E2EAD2] space-y-3.5 shadow-xs animate-in fade-in duration-150">
            <div className="p-4 bg-[#121712] text-white rounded-[14px] flex items-start gap-3">
              <AgentAvatar role="bo" size={36} tooltip />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold text-[#C8F169] block mb-1">
                  Bạn bắt trúng Bước {selectedStep} rồi, nhưng Bo vẫn thắc mắc:
                </span>
                <span className="text-stone-200">
                  "{boSpeechOverride ? (
                    <FormattedMathText text={cleanText(boSpeechOverride)} />
                  ) : (
                    <FormattedMathText text={cleanText(lesson.errorDescription)} />
                  )}"
                </span>
              </div>
            </div>

            {tutorFeedbackOverride && (
              <div className="p-3 rounded-[12px] bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed flex items-center gap-2 animate-in fade-in duration-150">
                <AgentAvatar role="colam" size={28} tooltip />
                <div className="flex-1">
                  <span className="font-bold">Gợi ý Cô Lam: </span>
                  {cleanText(tutorFeedbackOverride)}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => onRebuttalChange?.(cleanText(lesson.standardExplanation))}
              className="w-full text-left p-3 rounded-[12px] bg-stone-50 hover:bg-[#F3F8E8] border border-stone-200 hover:border-stone-400 text-stone-800 text-xs sm:text-sm cursor-pointer font-medium transition"
            >
              Chọn nhanh: "Quy tắc hiệu chung đầu A thì phải lộn ngược điểm sau lên trước: B'C = AC – AB'."
            </button>

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
                placeholder="Gõ lời giải thích chốt hạ cho Bo (hoặc bấm chọn nhanh)..."
                className="flex-1 px-4 py-2.5 bg-white border border-stone-300 rounded-[12px] text-xs sm:text-sm text-[#121712] outline-none focus:border-[#121712] focus:ring-2 focus:ring-[#121712]/10"
              />
              <button
                type="button"
                disabled={isLoadingAi || !rebuttalText.trim()}
                onClick={() => {
                  sound.playSuccessChime();
                  onSubmitRebuttal?.();
                }}
                className="px-5 py-2.5 bg-[#C8F169] hover:bg-[#bbf054] disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed text-[#121712] font-black text-xs sm:text-sm rounded-[12px] cursor-pointer shrink-0 flex items-center gap-1.5 transition shadow-xs"
              >
                {isLoadingAi ? (
                  <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin shrink-0" />
                ) : (
                  <>
                    <span>Gửi</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TRẠNG THÁI 5: HOÀN THÀNH SỬA LỖI (CLOSE) */}
        {currentState === 'CLOSE' && (
          <div className="p-5 rounded-[16px] bg-white border border-[#C8F169] space-y-4 shadow-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AgentAvatar role="colam" size={32} tooltip />
                <span className="font-extrabold text-sm sm:text-base text-[#121712]">
                  Chẩn đoán & Sửa lỗi thành công!
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#16A34A] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>ĐÚNG RỒI</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed bg-[#F3F8E8] p-3.5 rounded-[12px] border border-[#E2EAD2]">
              {cleanText(tutorFeedbackOverride || lesson.standardExplanation)}
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playTabSwitch();
                  if (onSwitchToStation3) {
                    onSwitchToStation3();
                  } else {
                    onNextLesson();
                  }
                }}
                className="w-full py-3.5 px-4 bg-[#C8F169] hover:bg-[#bbf054] text-[#121712] font-black text-xs sm:text-sm rounded-[14px] cursor-pointer flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99]"
              >
                <span>Tiến lên Trạm 3 · Đoán kết quả (POE)</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onNextLesson}
                  className="flex-1 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-xs rounded-full cursor-pointer flex items-center justify-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đổi bài tiếp theo</span>
                </button>
                <button
                  type="button"
                  onClick={onRetryLesson}
                  className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-xs rounded-full cursor-pointer transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Làm lại</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
