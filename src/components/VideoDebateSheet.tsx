import React, { useState } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, RebuttalSticker } from '../types/dre';
import { 
  BoAvatar, 
  TutorLamAvatar, 
  WashiTape, 
  PushPin, 
  RubberStampSuccess, 
  SwordsDebateIcon,
  VideoPlayIcon,
  SparkleIcon,
  CheckCircleIcon,
  GoldenStarIcon,
  HandStopIcon
} from './HandmadeArtwork';

interface VideoDebateSheetProps {
  lesson: VideoLessonItem;
  phase: VideoCheckpointPhase;
  isBackendLive?: boolean;
  isLoadingAi?: boolean;
  liveBoDialogue?: string | null;
  liveCoLamDialogue?: string | string[] | null;
  liveHintDialogue?: string | null;
  onAnswerCheckpoint: (answerText: string) => void;
  onSubmitRebuttal: (rebuttalText: string, isEffective: boolean) => void;
  onResumeVideo: () => void;
  onDismissFreeze: () => void;
}

export const VideoDebateSheet: React.FC<VideoDebateSheetProps> = ({
  lesson,
  phase,
  isBackendLive = false,
  isLoadingAi = false,
  liveBoDialogue,
  liveCoLamDialogue,
  liveHintDialogue,
  onAnswerCheckpoint,
  onSubmitRebuttal,
  onResumeVideo,
  onDismissFreeze,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [customRebuttalText, setCustomRebuttalText] = useState<string>('');
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  // Handle student selecting an answer at checkpoint
  const handleSelectAnswer = (optionId: string) => {
    setSelectedOptionId(optionId);
    const opt = lesson.checkpointQuestion.options.find(o => o.id === optionId);
    onAnswerCheckpoint(opt ? opt.label : optionId);
  };

  // Handle rebuttal click
  const handleSelectRebuttalSticker = (sticker: RebuttalSticker) => {
    setCustomRebuttalText(sticker.text);
    setActiveFeedback(sticker.feedback);
    onSubmitRebuttal(sticker.text, sticker.isEffective);
  };

  // Handle custom text submit
  const handleSendCustomRebuttal = () => {
    if (!customRebuttalText.trim()) return;
    const lower = customRebuttalText.toLowerCase();
    const isEffective = lower.includes('0') || lower.includes('bằng 0') || lower.includes('mất nghiệm') || lower.includes('chia') || lower.includes('âm') || lower.includes('đổi dấu') || lower.includes('đổi chiều');
    const feedback = isEffective 
      ? 'Lý lẽ phản biện rất sắc bén! Bạn đã chỉ ra được bản chất toán học.'
      : 'Cần phân tích cụ thể hơn để Bo hiểu vì sao cách làm đó bị sơ hở!';
    setActiveFeedback(feedback);
    onSubmitRebuttal(customRebuttalText, isEffective);
  };

  const boDebateSpeech = liveBoDialogue || lesson.boArgument.speech;
  const boConcessionSpeech = liveBoDialogue || lesson.boConcession.speech;
  const coLamClosureSpeech = Array.isArray(liveCoLamDialogue) 
    ? liveCoLamDialogue.join(' ') 
    : (liveCoLamDialogue || lesson.teacherClosure.speech);

  return (
    <div className="relative w-full bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-sm p-3.5 sm:p-5 sketchbook-shadow notebook-sheet rotate-[0.4deg] transition-transform hover:rotate-0 flex flex-col justify-between min-h-[350px] sm:min-h-[400px]">
      {/* Decorative washi tape & pin (Pinned high on paper edge, completely free from text) */}
      <WashiTape variant="pink" className="absolute -top-2.5 right-10 w-24 rotate-2 z-10" />
      <PushPin color="#E8A33D" className="absolute -top-3.5 left-6 z-20" />

      {/* Sheet Content Area */}
      <div>
        {/* Header indicator */}
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b-2 border-dashed border-[#E8DFD0] pt-1">
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 bg-[#FFF3D6] border-2 border-[#E8A33D] rounded-xs font-handwriting font-bold text-base sm:text-lg text-[#663C00] flex items-center gap-2.5 shadow-xs rotate-[-1deg]">
              <SwordsDebateIcon className="w-5 h-5 text-[#C97A13] shrink-0" />
              <span className="tracking-wide">Góc Tranh Luận &amp; Đối Chất</span>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-xs bg-[#F5D65D]/40 text-[#735118]">
            {phase === 'WATCHING' && 'Đang theo dõi bài'}
            {phase === 'CHECKPOINT_REACHED' && 'Câu hỏi suy ngẫm'}
            {phase === 'BO_DEBATE' && 'Bo nghi vấn đấu đá!'}
            {phase === 'BO_CONCEDED' && 'Bo tâm phục khẩu phục'}
            {phase === 'CO_LAM_CLOSURE' && 'Cô Lam chốt kiến thức'}
            {phase === 'STUDENT_FREEZE' && 'Tạm dừng hỏi bài'}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* PHASE 1: WATCHING (Waiting for checkpoint) */}
        {/* ========================================================================= */}
        {phase === 'WATCHING' && (
          <div className="py-10 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-[#FFF9EC] border-2 border-dashed border-[#F0D5A3] rounded-sm max-w-sm">
              <BoAvatar size="md" className="mx-auto mb-2" />
              <p className="font-handwriting text-base text-[#4E4135] leading-relaxed">
                &ldquo;Tớ đang chăm chú nghe Cô Lam giảng bài nè. Lát tới câu hỏi cô đố, tớ với cậu cùng giải xem ai nhanh hơn nhé!&rdquo;
              </p>
              <div className="mt-3 text-xs text-[#8A7D6F] font-handwriting">
                (Video đang phát bên trái · Sắp tới điểm dừng 00:{lesson.checkpointTimestamp})
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHASE 2: CHECKPOINT_REACHED (Pose question & choose answer) */}
        {/* ========================================================================= */}
        {phase === 'CHECKPOINT_REACHED' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Cô Lam Prompt Note */}
            <div className="flex items-start gap-3 bg-[#EEF8F5] p-3.5 rounded-sm border border-[#D5EFE7]">
              <TutorLamAvatar size="sm" className="shrink-0 -rotate-2" />
              <div>
                <div className="text-xs font-handwriting font-bold text-[#326759]">Cô Lam đặt câu hỏi:</div>
                <p className="font-semibold text-sm text-[#243B33] mt-0.5">
                  {lesson.checkpointQuestion.prompt}
                </p>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5">
              <div className="text-xs font-handwriting font-bold text-[#7A6D5E]">
                Chọn phương án em nghĩ là chuẩn xác nhất:
              </div>
              {lesson.checkpointQuestion.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectAnswer(opt.id)}
                  type="button"
                  className={`w-full text-left p-3 rounded-sm border-2 transition-all font-handwriting text-base sm:text-lg flex items-start gap-2.5 cursor-pointer shadow-xs ${
                    selectedOptionId === opt.id
                      ? 'bg-[#FFF8EB] border-[#E8A33D] text-[#3B2F24] scale-[1.01]'
                      : 'bg-white border-[#DFD7C9] text-[#4A3D31] hover:border-[#C9BDAB] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border border-[#D2C5B4] flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                    {opt.id === 'opt_1' ? 'A' : opt.id === 'opt_2' ? 'B' : 'C'}
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHASE 3: BO_DEBATE (Bo challenges with shortcut fallacy) */}
        {/* ========================================================================= */}
        {phase === 'BO_DEBATE' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {/* AI Generation State indicator */}
            {isLoadingAi && (
              <div className="flex items-center gap-3 p-3 bg-[#FFFBF0] border-2 border-dashed border-[#E8A33D] rounded-xs animate-pulse">
                <div className="w-5 h-5 border-2 border-[#E8A33D] border-t-transparent rounded-full animate-spin shrink-0" />
                <div className="text-xs font-handwriting text-[#8C5D19]">
                  <strong>Bo &amp; Cô Lam (GPT-4o)</strong> đang trao đổi phản hồi lý lẽ của em...
                </div>
              </div>
            )}

            {/* Bo Polaroid with Skeptical Expression & Speech Bubble */}
            <div className="flex flex-col sm:flex-row items-start gap-3 bg-[#FFF8EB] p-3.5 sm:p-4 rounded-sm border-2 border-[#E8A33D] shadow-xs">
              <BoAvatar size="md" expression="skeptical" className="-rotate-3 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-handwriting font-bold text-sm text-[#8C5D19]">Bo nghi vấn &amp; bắt bẻ:</span>
                  <span className="text-[11px] font-mono text-[#A36D19] bg-[#F5D65D]/40 px-1.5 py-0.5 rounded-xs">
                    {lesson.boArgument.fallacyType}
                  </span>
                  {liveBoDialogue && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2B5E22] bg-[#EEF8F5] border border-[#A7DDD0] px-1.5 py-0.2 rounded-xs font-bold">
                      <SparkleIcon className="w-3 h-3 text-[#3E8573]" />
                      <span>GPT-4o-mini Live</span>
                    </span>
                  )}
                </div>
                <p className="font-handwriting text-base sm:text-lg text-[#3E342B] mt-1 leading-snug">
                  &ldquo;{boDebateSpeech}&rdquo;
                </p>
              </div>
            </div>

            {/* Cô Lam Moderator Nudge or Live Hint */}
            {liveHintDialogue ? (
              <div className="flex items-start gap-2.5 p-3 bg-[#EEF8F5] border-2 border-[#4E9B87] rounded-xs text-xs font-handwriting text-[#244E41]">
                <TutorLamAvatar size="sm" className="shrink-0 -rotate-2" />
                <div>
                  <div className="font-bold text-[#205546]">Cô Lam gợi ý thêm cho em:</div>
                  <p className="mt-0.5 text-sm">{liveHintDialogue}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EEF8F5] border border-[#D5EFE7] rounded-xs text-xs font-handwriting text-[#2B574B]">
                <TutorLamAvatar size="sm" className="scale-60 -translate-x-1" />
                <span>
                  <strong>Cô Lam:</strong> &ldquo;Lý lẽ của Bo nghe rất cám dỗ nhỉ! Huy hãy phản biện để chỉ ra chỗ sơ hở cho Bo thấy nào!&rdquo;
                </span>
              </div>
            )}

            {/* Rebuttal Quick Stickers */}
            <div className="space-y-2">
              <div className="text-xs font-handwriting font-bold text-[#7A6D5E]">
                Bấm nhãn phản biện nhanh để đấu đá lại Bo:
              </div>
              <div className="flex flex-col gap-2">
                {lesson.rebuttalStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleSelectRebuttalSticker(sticker)}
                    type="button"
                    disabled={isLoadingAi}
                    className="w-full text-left px-3 py-2 bg-white hover:bg-[#FFF8EB] text-[#3B2F24] border-2 border-dashed border-[#E8A33D]/60 hover:border-[#E8A33D] rounded-xs font-handwriting text-sm sm:text-base flex items-center justify-between gap-2 shadow-2xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <span>&ldquo;{sticker.text}&rdquo;</span>
                    <span className="text-xs text-[#A87930] font-mono shrink-0">Phản biện ➔</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Or type custom rebuttal */}
            <div className="pt-2">
              <div className="text-xs font-handwriting text-[#8A7D6F] mb-1">
                Hoặc tự gõ lý lẽ toán học của em:
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRebuttalText}
                  onChange={(e) => setCustomRebuttalText(e.target.value)}
                  placeholder="Ví dụ: Vì x có thể bằng 0, không được chia cho 0..."
                  disabled={isLoadingAi}
                  className="flex-1 bg-white border border-[#D8CEBC] rounded-xs px-3 py-1.5 font-handwriting text-sm text-[#2E2825] focus:outline-none focus:border-[#E8A33D]"
                />
                <button
                  onClick={handleSendCustomRebuttal}
                  type="button"
                  disabled={!customRebuttalText.trim() || isLoadingAi}
                  className="px-3 py-1.5 bg-[#E8A33D] hover:bg-[#D9932B] disabled:opacity-50 text-white font-handwriting font-bold text-sm rounded-xs shadow-xs cursor-pointer transition-colors"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHASE 4: BO_CONCEDED & CO_LAM_CLOSURE (Success & pedagogical synthesis) */}
        {/* ========================================================================= */}
        {(phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE') && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Rubber Stamp Success */}
            <div className="flex justify-center py-1">
              <RubberStampSuccess />
            </div>

            {/* Bo's Concession (Embarrassed expression) */}
            <div className="flex flex-col sm:flex-row items-start gap-3 bg-[#FFF9EC] p-3.5 rounded-sm border border-[#F0D5A3]">
              <BoAvatar size="md" expression="embarrassed" className="shrink-0 -rotate-2" />
              <div>
                <div className="text-xs font-handwriting font-bold text-[#8C5D19]">Bo tâm phục khẩu phục:</div>
                <p className="font-handwriting text-base sm:text-lg text-[#3E342B] mt-1 leading-snug">
                  &ldquo;{boConcessionSpeech}&rdquo;
                </p>
                <div className="mt-1.5 text-xs text-[#6B9E5C] font-handwriting font-bold flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-[#6B9E5C]" />
                  <span>{lesson.boConcession.realizationNote}</span>
                </div>
              </div>
            </div>

            {/* Cô Lam's Synthesis & Golden Rule */}
            <div className="flex flex-col sm:flex-row items-start gap-3 bg-[#EEF8F5] p-3.5 rounded-sm border-2 border-[#4E9B87]">
              <TutorLamAvatar size="md" className="shrink-0 rotate-1" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-handwriting font-bold text-[#2E6859]">Cô Lam chốt quy tắc vàng:</span>
                  {liveCoLamDialogue && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2B5E22] bg-[#EEF8F5] border border-[#A7DDD0] px-1.5 py-0.2 rounded-xs font-bold">
                      <SparkleIcon className="w-3 h-3 text-[#3E8573]" />
                      <span>GPT-4o Live</span>
                    </span>
                  )}
                </div>
                <p className="font-handwriting text-sm sm:text-base text-[#223630] leading-snug">
                  &ldquo;{coLamClosureSpeech}&rdquo;
                </p>
                <div className="p-2 bg-white/80 rounded-xs border border-[#4E9B87]/40 font-mono text-xs text-[#1E5749] font-bold flex items-center gap-1.5">
                  <GoldenStarIcon className="w-4 h-4 text-[#D4A328] shrink-0" />
                  <span>{lesson.teacherClosure.goldenRule}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHASE 5: STUDENT_FREEZE ("Khoan đã cô ơi!") */}
        {/* ========================================================================= */}
        {phase === 'STUDENT_FREEZE' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-3.5 bg-[#FFF8EB] border-2 border-[#E8A33D] rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-handwriting font-bold text-[#8C5D19] flex items-center gap-1.5">
                  <HandStopIcon className="w-4 h-4 text-[#8C5D19]" />
                  <span>Tạm dừng theo yêu cầu của em:</span>
                </span>
              </div>
              <p className="text-sm font-handwriting text-[#4E4135] leading-relaxed">
                {lesson.freezeNote}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-[#EEF8F5] p-3 rounded-xs border border-[#D5EFE7]">
              <BoAvatar size="sm" expression="confident" className="shrink-0" />
              <p className="text-xs font-handwriting text-[#3D352E]">
                <strong>Bo:</strong> &ldquo;Tớ cũng đang xem lại chỗ này nè. Đọc kỹ lại rồi mình bấm tiếp tục xem bài nhé!&rdquo;
              </p>
            </div>

            <button
              onClick={onDismissFreeze}
              type="button"
              className="w-full py-2.5 bg-[#4E9B87] hover:bg-[#3E806F] text-white font-handwriting font-bold text-base rounded-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <VideoPlayIcon className="w-4 h-4" />
              <span>Tiếp tục bài giảng ngay</span>
            </button>
          </div>
        )}
      </div>

      {/* Sheet Footer Action: Resume Video Button when closure completed */}
      {(phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE') && (
        <div className="pt-4 mt-4 border-t border-[#E8DFD0]">
          <button
            onClick={onResumeVideo}
            type="button"
            className="w-full py-2.5 bg-[#4E9B87] hover:bg-[#3D8270] active:scale-98 text-white font-handwriting font-bold text-lg rounded-xs border border-[#3A7564] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <VideoPlayIcon className="w-5 h-5" />
            <span>Tiếp tục xem video bài giảng ➔</span>
          </button>
        </div>
      )}
    </div>
  );
};
