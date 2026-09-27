import React, { useState, useEffect } from 'react';
import { MisconceptionItem, DREState } from '../types/dre';
import { 
  BoAvatar,
  TutorLamAvatar, 
  WashiTape, 
  PushPin, 
  GentleLightbulb, 
  HalfFilledCircle,
  PencilIcon,
  MagnifyIcon,
  SparkleIcon,
  HandPointIcon,
  SwordsDebateIcon
} from './HandmadeArtwork';

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
  onAcceptNudgeHint: () => void;
  onDismissNudge: () => void;
  tutorFeedbackOverride?: string | null;
  probeQuestionOverride?: string | null;
  boSpeechOverride?: string | null;
  isLoadingAi?: boolean;
  hintLevel?: number;
}

export const InteractionCardSheet: React.FC<InteractionCardSheetProps> = ({
  lesson,
  currentState,
  selectedStep,
  explanationText,
  rebuttalText = '',
  onExplanationChange,
  onRebuttalChange = () => {},
  onSubmitExplanation,
  onSubmitRebuttal = () => {},
  onRequestHint,
  onNextLesson,
  onRetryLesson,
  onAcceptNudgeHint,
  onDismissNudge,
  tutorFeedbackOverride,
  probeQuestionOverride,
  boSpeechOverride,
  isLoadingAi = false,
  hintLevel = 0,
}) => {
  const [hintCount, setHintCount] = useState(0);

  // Reset hint count when lesson changes
  useEffect(() => {
    setHintCount(0);
  }, [lesson.id]);

  const canSubmit = explanationText.trim().length > 0;

  return (
    <div className="relative w-full bg-[#FAF6EE] border-2 border-[#DCD3C3] rounded-sm p-3.5 sm:p-5 sketchbook-shadow notebook-sheet rotate-[0.5deg] transition-transform hover:rotate-0 flex flex-col justify-between min-h-[350px] sm:min-h-[400px]">
      {/* Top Corner Washi Tape & Pin */}
      <WashiTape variant="pink" className="absolute -top-2.5 right-8 w-24 rotate-3" />
      <PushPin color="#4E9B87" className="absolute top-3 left-4" />

      {/* STATE 1: IDLE */}
      {currentState === 'IDLE' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
          <div className="w-12 h-12 rounded-full bg-[#FFF5DC] border-2 border-[#ECD9B5] flex items-center justify-center shadow-xs mb-2 rotate-[-4deg]">
            <MagnifyIcon className="w-6 h-6 text-[#E8A33D]" />
          </div>
          <h2 className="font-handwriting text-xl sm:text-2xl font-bold text-[#3B3227] mb-1.5">
            Góc quan sát của em
          </h2>
          <p className="font-handwriting text-base text-[#786B5D] max-w-xs leading-relaxed">
            &ldquo;Bấm vào bất kỳ dòng nào em nghĩ là Bo đã giải sai ở trang bên trái để bắt đầu nhé.&rdquo;
          </p>
          <div className="mt-4 px-3 py-1.5 bg-[#FFF9EC] border border-[#ECD9B5] rounded-xs text-xs text-[#8A744C] font-handwriting flex items-center gap-2">
            <GentleLightbulb className="w-4 h-4 shrink-0 text-[#E8A33D]" />
            <span>Gợi ý: Đọc từng bước một cách cẩn thận xem quy tắc chuyển vế hoặc tính toán có bị nhầm dấu không.</span>
          </div>
        </div>
      )}

      {/* STATE 2 & 3: MARKED or EXPLAIN_PROMPT */}
      {(currentState === 'MARKED' || currentState === 'EXPLAIN_PROMPT') && (
        <div className="flex-1 flex flex-col">
          {/* Muted System Prompt Note */}
          <div className="bg-[#FFFDF7] p-2.5 sm:p-3 border-l-3 border-[#E8A33D] rounded-xs shadow-2xs mb-2.5">
            <div className="text-[11px] font-mono text-[#8F7D6B] uppercase tracking-wider mb-0.5">
              Bước {selectedStep} đã được chọn
            </div>
            <p className="font-handwriting text-base sm:text-lg text-[#3A3127] italic">
              &ldquo;Bạn vừa chọn dòng này. Vì sao bạn nghĩ chỗ này sai?&rdquo;
            </p>
          </div>

          {/* Sticky-note-style Input Card (pale yellow #F5D65D tint) */}
          <div className="relative flex-1 bg-[#FFFBEA] border border-[#EADB88] p-3 rounded-xs shadow-xs mb-3 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-handwriting font-bold text-xs sm:text-sm text-[#8A7129] flex items-center gap-1.5">
                <PencilIcon className="w-3.5 h-3.5 text-[#C49B28]" />
                <span>Mẩu giấy giải thích của em:</span>
              </span>
              <span className="text-[11px] text-[#A69764] font-mono">
                {explanationText.length} ký tự
              </span>
            </div>

            <textarea
              value={explanationText}
              onChange={(e) => onExplanationChange(e.target.value)}
              placeholder="Gõ giải thích của bạn ở đây… (Ví dụ: Chỗ này phải đổi dấu thành x = 3 vì...)"
              className="flex-1 w-full bg-transparent resize-none outline-none font-sans text-xs sm:text-sm text-[#2F2922] placeholder-[#A89D8B] leading-relaxed"
              rows={2}
              autoFocus
            />

            {/* Helper reassurance text */}
            <div className="pt-1.5 border-t border-[#F2E59E] text-[11px] font-handwriting text-[#7E7051] italic">
              &ldquo;Không sao nếu chưa chắc — cứ thử giải thích theo cách em hiểu.&rdquo;
            </div>
          </div>

          {/* Action Buttons: Solid Amber "Gửi giải thích" + Outlined Teal "Xin gợi ý" */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={onSubmitExplanation}
                disabled={!canSubmit}
                type="button"
                className={`w-full sm:flex-1 px-4 py-2 rounded-xs font-handwriting text-base font-bold transition-all shadow-xs rotate-[-0.5deg] active:scale-98 flex items-center justify-center gap-1.5 ${
                  canSubmit
                    ? 'bg-[#E8A33D] hover:bg-[#D9932E] text-[#241B0E] border-2 border-[#C98420] cursor-pointer'
                    : 'bg-[#EFE8D8] text-[#9E9484] border border-[#DDD3C0] cursor-not-allowed'
                }`}
              >
                <span>Gửi giải thích</span>
                <PencilIcon className="w-3.5 h-3.5 text-[#4A3515]" />
              </button>

              <button
                onClick={() => {
                  if (!canSubmit) return;
                  setHintCount(c => c + 1);
                  onRequestHint();
                }}
                disabled={!canSubmit}
                type="button"
                title={!canSubmit ? "Hãy thử tự gõ lý do theo cách em hiểu trước khi xin gợi ý nhé!" : "Nhận gợi ý từ Cô Lam"}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-xs font-handwriting text-base font-bold transition-all flex items-center justify-center gap-1.5 ${
                  canSubmit
                    ? 'bg-white hover:bg-[#EDF7F4] text-[#377A69] border-2 border-[#4E9B87] cursor-pointer'
                    : 'bg-[#F0EAE0] text-[#A39786] border border-[#DDD3C0] cursor-not-allowed opacity-60'
                }`}
              >
                <GentleLightbulb className={`w-3.5 h-3.5 ${canSubmit ? 'text-[#4E9B87]' : 'text-[#A39786]'}`} />
                <span>Xin gợi ý</span>
              </button>
            </div>

            {!canSubmit && (
              <p className="text-[11px] font-handwriting text-[#8A7B6B] italic text-center sm:text-right pt-0.5">
                (Hãy thử gõ vài chữ giải thích trước khi mở gợi ý từ Cô Lam nhé)
              </p>
            )}

            {hintCount > 0 && (
              <div className="p-3 bg-[#EDF7F4] border border-[#BCE1D7] rounded-xs text-xs font-handwriting text-[#2A594D]">
                Cô Lam gợi ý: {hintCount === 1 ? lesson.hintLevel1 : (lesson.hintLevel2 || lesson.hintLevel1)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE: BO_CHALLENGE & AWAITING_REBUTTAL (The Real Peer Clash!) */}
      {(currentState === 'BO_CHALLENGE' || currentState === 'AWAITING_REBUTTAL') && (
        <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
          <div className="space-y-3.5">
            {/* Header ribbon */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD0]">
              <span className="font-handwriting font-bold text-sm text-[#4E4135] flex items-center gap-1.5">
                <SwordsDebateIcon className="w-4 h-4 text-[#E8A33D]" />
                <span>Bo phản bác &amp; Tranh biện trực tiếp</span>
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs bg-[#F5D65D]/40 text-[#735118]">
                {hintLevel > 0 ? `Lượt phản biện ${hintLevel + 1}/2` : 'Lượt phản biện 1/2'}
              </span>
            </div>

            {/* AI Generation State indicator */}
            {isLoadingAi && (
              <div className="flex items-center gap-3 p-3 bg-[#FFFBF0] border-2 border-dashed border-[#E8A33D] rounded-xs animate-pulse">
                <div className="w-5 h-5 border-2 border-[#E8A33D] border-t-transparent rounded-full animate-spin shrink-0" />
                <div className="text-xs font-handwriting text-[#8C5D19]">
                  <strong>Assessor &amp; Bo (GPT-4o)</strong> đang phân tích lập luận của em...
                </div>
              </div>
            )}

            {/* Bo's Skeptical Challenge Card */}
            <div className="flex items-start gap-3 bg-[#FFF8EB] p-3.5 sm:p-4 rounded-sm border-2 border-[#E8A33D] shadow-xs relative">
              <BoAvatar size="md" expression="skeptical" className="-rotate-3 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-handwriting font-bold text-sm text-[#8C5D19]">Bo bắt bẻ &amp; không phục:</span>
                  <span className="text-[11px] font-mono text-[#A36D19] bg-[#F5D65D]/50 px-1.5 py-0.5 rounded-xs">
                    Bẫy ngụy biện
                  </span>
                </div>
                <p className="font-handwriting text-base sm:text-lg text-[#3E342B] mt-1 leading-snug">
                  &ldquo;{boSpeechOverride || 'Ủa nhưng tớ thấy làm thế này nhanh hơn nhiều mà? Cậu chỉ ra xem tớ sai chỗ nào?'}&rdquo;
                </p>
              </div>
            </div>

            {/* Cô Lam coaching hint if rebuttal was not sharp yet */}
            {hintLevel > 0 && tutorFeedbackOverride ? (
              <div className="flex items-start gap-2.5 p-3 bg-[#EEF8F5] border-2 border-[#4E9B87] rounded-xs text-xs font-handwriting text-[#244E41]">
                <TutorLamAvatar size="sm" className="shrink-0 -rotate-2" />
                <div>
                  <div className="font-bold text-[#205546]">Cô Lam gợi ý thêm cho em:</div>
                  <p className="mt-0.5 text-sm">{tutorFeedbackOverride}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EEF8F5] border border-[#D5EFE7] rounded-xs text-xs font-handwriting text-[#2B574B]">
                <TutorLamAvatar size="sm" className="scale-60 -translate-x-1" />
                <span>
                  <strong>Cô Lam:</strong> &ldquo;Lý lẽ của Bo nghe rất bướng bỉnh! Em hãy phản biện để chỉ ra chỗ sơ hở toán học cho Bo thấy nào!&rdquo;
                </span>
              </div>
            )}

            {/* Rebuttal Textarea */}
            <div className="relative bg-[#FFFBEA] border border-[#EADB88] p-3.5 rounded-xs shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-1.5 text-xs text-[#8A7129]">
                <span className="font-handwriting font-bold text-sm flex items-center gap-1.5">
                  <PencilIcon className="w-3.5 h-3.5 text-[#C49B28]" />
                  <span>Lý lẽ phản biện của em đáp trả Bo:</span>
                </span>
                <span className="font-mono text-[11px] text-[#A69764]">
                  {rebuttalText.length} ký tự
                </span>
              </div>
              <textarea
                value={rebuttalText}
                onChange={(e) => onRebuttalChange(e.target.value)}
                placeholder="Gõ lý lẽ phản biện để Bo tâm phục khẩu phục (Ví dụ: Vì khi chuyển vế đổi dấu...)"
                disabled={isLoadingAi}
                className="w-full bg-transparent resize-none outline-none font-sans text-xs sm:text-sm text-[#2F2922] placeholder-[#A89D8B] leading-relaxed"
                rows={2}
                autoFocus
              />
            </div>
          </div>

          {/* Action Button: Gửi phản biện */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={onSubmitRebuttal}
              disabled={!rebuttalText.trim() || isLoadingAi}
              type="button"
              className="w-full sm:flex-1 px-4 py-2 bg-[#E8A33D] hover:bg-[#D9932E] disabled:opacity-50 text-[#241B0E] font-handwriting text-base font-bold rounded-xs border-2 border-[#C98420] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Gửi phản biện cho Bo</span>
              <PencilIcon className="w-3.5 h-3.5 text-[#4A3515]" />
            </button>
            <button
              onClick={onRequestHint}
              type="button"
              className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-[#EDF7F4] text-[#377A69] border border-[#4E9B87] rounded-xs font-handwriting text-sm font-bold cursor-pointer"
            >
              Cô Lam trợ giúp
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: CLOSE (Đúng hoàn toàn) */}
      {currentState === 'CLOSE' && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Cute Tutor Lam Polaroid */}
            <div className="flex items-start gap-3 pb-3 border-b border-[#E8DFD0]">
              <TutorLamAvatar size="sm" className="rotate-2 shrink-0" />
              <div className="flex-1 bg-[#EDF7F4] p-3 rounded-sm border-2 border-[#C2E5DC] shadow-xs relative">
                <div className="font-handwriting text-xs font-bold text-[#2E6859] mb-0.5">
                  Cô Lam nhận xét:
                </div>
                <p className="font-handwriting text-base sm:text-lg text-[#1E3B33] leading-snug">
                  &ldquo;{tutorFeedbackOverride || `Chính xác! Bo đã ${lesson.errorDescription.toLowerCase()} Em vừa giải thích rất rõ ràng.`}&rdquo;
                </p>
                <div className="mt-2 text-xs text-[#3E7062] bg-white/80 p-2 rounded-xs border border-[#CDEAE2] font-sans">
                  <strong>Quy tắc chuẩn:</strong> {lesson.standardExplanation}
                </div>
              </div>
            </div>

            {/* Learner's Submitted Explanation Card */}
            <div className="bg-[#FFFDF7] p-2.5 border border-[#E0D7C5] rounded-xs">
              <span className="text-[11px] font-handwriting text-[#7E7060]">Lời giải thích của em:</span>
              <p className="text-xs font-mono text-[#362D24] mt-0.5 italic">
                &ldquo;{explanationText}&rdquo;
              </p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={onNextLesson}
              type="button"
              className="w-full sm:flex-1 px-4 py-2 bg-[#4E9B87] hover:bg-[#3D8371] text-white font-handwriting text-base font-bold rounded-xs border-2 border-[#32695B] shadow-xs transition-all rotate-[-0.5deg] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Bài tiếp theo</span>
              <SparkleIcon className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={onRetryLesson}
              type="button"
              className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-[#F3EFE6] text-[#524436] font-handwriting text-xs font-bold rounded-xs border border-[#DDD3C0] transition-colors cursor-pointer"
            >
              Làm lại bài này
            </button>
          </div>
        </div>
      )}

      {/* STATE 5: PROBE (Đúng vị trí, giải thích chưa đủ ý) */}
      {currentState === 'PROBE' && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Cô Lam Encouraging Note */}
            <div className="flex items-start gap-4 pb-3 border-b border-[#E8DFD0]">
              <TutorLamAvatar size="md" className="rotate-2 shrink-0" />
              <div className="flex-1 bg-[#FFF9EC] p-3.5 sm:p-4 rounded-sm border-2 border-[#F0D5A3] shadow-xs">
                <div className="flex items-center gap-1.5 font-handwriting text-sm font-bold text-[#A86E18] mb-1">
                  <HalfFilledCircle className="w-4 h-4" />
                  <span>Cô Lam hướng dẫn thêm:</span>
                </div>
                <p className="font-handwriting text-lg sm:text-xl text-[#3E342B] leading-relaxed">
                  &ldquo;{probeQuestionOverride || `Gần đúng rồi đó! Em thử nói rõ hơn xem — quy tắc gì khiến dấu hoặc kết quả ở bước ${selectedStep} bị sai?`}&rdquo;
                </p>
              </div>
            </div>

            {/* Reopened Sticky Input Box with previous answer prefilled */}
            <div className="bg-[#FFFBEA] border border-[#EADB88] p-3.5 rounded-xs shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#82713A] mb-1">
                <span className="font-handwriting font-bold text-sm flex items-center gap-1">
                  <PencilIcon className="w-3.5 h-3.5 text-[#A88B2E]" />
                  <span>Bổ sung thêm giải thích của em:</span>
                </span>
                <span className="text-[11px] font-handwriting text-[#998852]">Chỉnh sửa câu trả lời cũ</span>
              </div>
              <textarea
                value={explanationText}
                onChange={(e) => onExplanationChange(e.target.value)}
                placeholder="Nói rõ hơn một chút theo gợi ý của Cô Lam nhé..."
                className="w-full bg-transparent resize-none outline-none font-sans text-sm text-[#2F2922] placeholder-[#A89D8B] leading-relaxed"
                rows={3}
                autoFocus
              />
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={onSubmitExplanation}
              type="button"
              className="w-full sm:flex-1 px-5 py-2.5 bg-[#E8A33D] hover:bg-[#D9932E] text-[#241B0E] font-handwriting text-lg font-bold rounded-xs border-2 border-[#C98420] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Gửi lại giải thích</span>
              <PencilIcon className="w-4 h-4 text-[#4A3515]" />
            </button>
            <button
              onClick={onRequestHint}
              type="button"
              className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-[#EDF7F4] text-[#377A69] border border-[#4E9B87] rounded-xs font-handwriting text-base font-bold cursor-pointer"
            >
              Gợi ý thêm
            </button>
          </div>
        </div>
      )}

      {/* STATE 6: HINT (Sai vị trí) */}
      {currentState === 'HINT' && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Tutor Lam with Gentle Redirection (No red, no X, no 'SAI') */}
            <div className="flex items-start gap-4 pb-4 border-b border-[#E8DFD0]">
              <TutorLamAvatar size="md" className="rotate-1 shrink-0" />
              <div className="flex-1 bg-[#FAF6EE] p-4 rounded-sm border-2 border-[#E0D7C5] shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <GentleLightbulb className="w-5 h-5 text-[#E8A33D]" />
                  <span className="font-handwriting text-sm font-bold text-[#56493B]">
                    Gợi ý nhỏ từ Cô Lam:
                  </span>
                </div>
                <p className="font-handwriting text-lg sm:text-xl text-[#322A21] leading-relaxed">
                  &ldquo;Dòng đó chưa phải chỗ cần soi đâu. {lesson.hintLevel1}&rdquo;
                </p>
                <div className="mt-2.5 text-xs text-[#7A6D5E] font-handwriting italic">
                  Vết khoanh cũ đã được tẩy nhẹ. Em hãy nhìn lại bài giải ở trang bên trái và bấm vào một dòng khác nhé!
                </div>
              </div>
            </div>

            {/* Encouraging card */}
            <div className="p-3.5 bg-[#FFFDF7] border border-[#DFD6C4] rounded-xs text-xs font-handwriting text-[#6E6050] flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-[#E8A33D] shrink-0" />
              <span>Không sao cả! Việc thử và phát hiện mình chưa tìm đúng chỗ là một phần rất tự nhiên khi học.</span>
            </div>
          </div>

          <div className="pt-3 text-center">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#4A3F33] text-xs font-handwriting font-bold border border-[#D5CCBA] rounded-xs shadow-2xs">
              <HandPointIcon className="w-4 h-4 text-[#8C7E70]" />
              <span>Hãy bấm chọn lại một dòng khác trên đề bài</span>
            </div>
          </div>
        </div>
      )}

      {/* STATE 7: TUTOR_NUDGE (Học viên im lặng / băn khoăn quá lâu) */}
      {currentState === 'TUTOR_NUDGE' && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Small note card sliding in with teal washi-tape */}
            <div className="relative bg-[#EDF7F4] border-2 border-[#A8DACD] p-5 rounded-xs shadow-md">
              <WashiTape variant="blue" className="absolute -top-2.5 left-6 w-20 rotate-[-1deg]" />
              
              <div className="flex items-center gap-3 mb-2">
                <TutorLamAvatar size="sm" className="rotate-[-2deg]" />
                <span className="font-handwriting font-bold text-base text-[#2E6859]">
                  Cô Lam ghé thăm:
                </span>
              </div>

              <p className="font-handwriting text-lg sm:text-xl text-[#1C3E35] leading-relaxed mb-3">
                &ldquo;Em đang suy nghĩ à? Không sao, cứ từ từ. Cần cô gợi ý thêm không?&rdquo;
              </p>

              <div className="text-xs text-[#477A6D] font-handwriting italic">
                Lời nhắn thân mật: Cứ thoải mái gõ suy nghĩ bất kỳ, hoặc nhận gợi ý nếu thấy hơi mông lung nhé.
              </div>
            </div>

            {/* Input preview */}
            <div className="bg-[#FFFBEA] border border-[#EADB88] p-3 rounded-xs text-xs text-[#6F6030]">
              <span className="font-medium font-handwriting">Nội dung em đang viết:</span>
              <p className="mt-1 font-mono text-xs text-[#383017]">
                {explanationText || '(Chưa gõ gì)'}
              </p>
            </div>
          </div>

          {/* Two paper-tag buttons: "Cần gợi ý" and "Để em tự làm tiếp" */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onAcceptNudgeHint}
              type="button"
              className="w-full sm:flex-1 px-4 py-2.5 bg-[#4E9B87] hover:bg-[#3D8371] text-white font-handwriting text-lg font-bold rounded-xs border border-[#32695B] shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <GentleLightbulb className="w-4 h-4 text-white" />
              <span>Cần gợi ý</span>
            </button>
            <button
              onClick={onDismissNudge}
              type="button"
              className="w-full sm:flex-1 px-4 py-2.5 bg-transparent hover:bg-white/60 text-[#4E4135] font-handwriting text-base font-bold rounded-xs border-0 underline transition-colors cursor-pointer"
            >
              Để em tự làm tiếp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
