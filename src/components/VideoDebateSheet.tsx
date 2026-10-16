// File: src/components/VideoDebateSheet.tsx
import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, TimelineComment } from '../types/dre';
import { 
  ClassmateAvatar,
  BoAvatar,
  TriDeepThinkerAvatar,
  LinhChiNoteTakerAvatar,
  MinhKhangInquisitiveAvatar,
  HandStopIcon,
  GentleLightbulb
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

// ============================================================================
// CUSTOM SVG ICONS CHO CỘT LỚP HỌC TƯƠNG TÁC (ZERO EMOJI)
// ============================================================================
const ClockBadgeSvg = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExpandBackToVideoSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M15 9L9 15M9 15H14M9 15V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface VideoDebateSheetProps {
  lesson: VideoLessonItem;
  phase: VideoCheckpointPhase;
  currentTime?: number;
  isBackendLive?: boolean;
  isLoadingAi?: boolean;
  liveBoDialogue?: string | null;
  liveCoLamDialogue?: string | string[] | null;
  liveHintDialogue?: string | null;
  isQuizCollapsedToChat?: boolean;
  onExpandQuizBackToVideo?: () => void;
  externalQuestionTrigger?: { id: number; text: string } | null;
  onSeekVideo?: (second: number) => void;
  onAnswerCheckpoint: (answerText: string) => void;
  onSubmitRebuttal: (rebuttalText: string, isEffective: boolean) => void;
  onResumeVideo: () => void;
  onDismissFreeze: () => void;
  onSkipCheckpoint?: () => void;
}

type RecipientTarget = 'all' | 'bo' | 'tri' | 'linhchi' | 'minhkhang';

const cleanText = (str?: string) =>
  str
    ? str
        .replace(/\u20d7/g, '')
        .replace(/📌|📝|🔍|😂|🤔|🟢|🌸|🧒|👓|⚡/g, '')
        .trim()
    : '';

export const VideoDebateSheet: React.FC<VideoDebateSheetProps> = ({
  lesson,
  phase,
  currentTime = 0,
  isQuizCollapsedToChat = false,
  onExpandQuizBackToVideo,
  externalQuestionTrigger,
  onSeekVideo,
  onAnswerCheckpoint,
  onDismissFreeze,
}) => {
  const [liveChatMessages, setLiveChatMessages] = useState<TimelineComment[]>([]);
  const [userChatInput, setUserChatInput] = useState<string>('');
  const [recipient, setRecipient] = useState<RecipientTarget>('all');
  const [activePeerNote, setActivePeerNote] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang' | null>(null);
  const [selectedFreezeIntent, setSelectedFreezeIntent] = useState<'not_understand' | 'too_fast' | 'take_notes'>('not_understand');
  const [taHintTier, setTaHintTier] = useState<number>(0);

  const chatStreamEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLiveChatMessages([]);
    setTaHintTier(0);
    setActivePeerNote(null);
  }, [lesson.id]);

  useEffect(() => {
    chatStreamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lesson.timelineComments, currentTime, liveChatMessages, phase, isQuizCollapsedToChat]);

  // Nhận câu hỏi từ Modal Giơ tay bên Video gửi sang
  useEffect(() => {
    if (externalQuestionTrigger && externalQuestionTrigger.text) {
      handleSendUserChatMessage(externalQuestionTrigger.text, 'all');
    }
  }, [externalQuestionTrigger?.id]);

  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSendUserChatMessage = (overrideText?: string, overrideRecipient?: RecipientTarget) => {
    const text = (overrideText ?? userChatInput).trim();
    if (!text) return;

    const target = overrideRecipient ?? recipient;
    const recipientLabel =
      target === 'bo'
        ? ' (tới Bo)'
        : target === 'tri'
        ? ' (tới Trí)'
        : target === 'linhchi'
        ? ' (tới Linh Chi)'
        : target === 'minhkhang'
        ? ' (tới Minh Khang)'
        : '';

    const newMsg: TimelineComment = {
      id: `user_${Date.now()}`,
      second: currentTime,
      author: `Bạn${recipientLabel}`,
      role: 'classmate',
      text,
    };

    setLiveChatMessages((prev) => [...prev, newMsg]);
    if (!overrideText) setUserChatInput('');

    const lower = text.toLowerCase();
    let replyAuthor = 'Trí';
    let replyText = '';

    if (target === 'bo' || lower.includes('bo') || lower.includes('@bo')) {
      replyAuthor = 'Bo';
      replyText =
        cleanText(lesson.peerContext?.bo.defaultReply) ||
        "Mình cứ tưởng |BC + DD'| tách thành 1 + 1 = 2 được, hóa ra phải thế DD' = CC' để nối tiếp thành đường chéo BC' bằng căn 2!";
    } else if (target === 'linhchi' || lower.includes('chi') || lower.includes('thế') || lower.includes('công thức')) {
      replyAuthor = 'Linh Chi';
      replyText =
        cleanText(lesson.peerContext?.linhchi.defaultReply) ||
        "Theo phút [36:55] của thầy Tiến: Hai vectơ BC và DD' rời nhau nên ta thay DD' = CC' (hai cạnh bên hình lập phương), khi đó BC + CC' = BC' (đường chéo mặt bên cạnh 1 nên bằng căn 2).";
    } else if (target === 'minhkhang' || lower.includes('khang') || lower.includes('tại sao')) {
      replyAuthor = 'Minh Khang';
      replyText =
        cleanText(lesson.peerContext?.minhkhang.defaultReply) ||
        'Tưởng tượng bạn đi bộ ngang 1m từ B sang C, rồi leo thang thẳng đứng 1m từ C lên C\'. Khoảng cách chim bay BC\' là cạnh huyền căn(1² + 1²) = căn 2m chứ không phải 2m!';
    } else {
      replyAuthor = 'Trí';
      replyText =
        cleanText(lesson.peerContext?.tri.defaultReply) ||
        'Bản chất là bất đẳng thức tam giác: |a + b| chỉ bằng |a| + |b| khi hai vectơ cùng hướng. Ở đây BC và DD\' vuông góc nhau nên phải dùng Pytago!';
    }

    setTimeout(() => {
      sound.playBubblePop();
      setLiveChatMessages((prev) => [
        ...prev,
        {
          id: `reply_${Date.now()}`,
          second: currentTime,
          author: replyAuthor,
          role: 'classmate',
          text: replyText,
        },
      ]);
    }, 350);
  };

  const defaultComments = lesson.timelineComments || [];
  const visibleTimelineComments = defaultComments.filter((c) => !c.isPinned);
  const allStreamComments = [...visibleTimelineComments, ...liveChatMessages];
  const pinnedComment = defaultComments.find((c) => c.isPinned);

  const activeCue =
    lesson.transcriptCues?.find((c) => currentTime >= c.start && currentTime <= c.end) ||
    [...(lesson.transcriptCues || [])].reverse().find((c) => currentTime >= c.start) ||
    lesson.transcriptCues?.[0];

  const peopleRoster = [
    { id: 'bo' as const, name: 'Bo', status: currentTime >= 2200 ? 'nghi vấn 1+1=2' : 'gật gù' },
    { id: 'tri' as const, name: 'Trí', status: 'đào sâu' },
    { id: 'linhchi' as const, name: 'Linh Chi', status: 'ghi sổ tay' },
    { id: 'minhkhang' as const, name: 'M.Khang', status: 'trực quan' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between pl-1 sm:pl-3 overflow-hidden select-none">
      {/* 1. HEADER + HÀNG PEOPLE ROW (CHUẨN THIẾT KẾ FIGMA / BLU1606) */}
      <div className="pb-2 border-b border-[#EFE8DC] space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="font-bold text-xs sm:text-sm text-[#1E242B]">
              Lớp học · 5/5 đang học
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playPencilTap();
              setTaHintTier((prev) => (prev + 1) % 4);
            }}
            className="px-2.5 py-0.5 bg-[#F4FBF8] hover:bg-[#E1F3EC] text-[#1B4338] border border-[#BCE1D4] font-semibold text-[11px] rounded-full cursor-pointer flex items-center gap-1"
          >
            <GentleLightbulb className="w-3 h-3 text-[#D97706]" />
            <span>Gợi ý ({taHintTier}/3)</span>
          </button>
        </div>

        {/* Hàng People Row: Bấm vào ai để xem nhanh Sổ tay & chuyển sang nhắn riêng cho người đó */}
        <div className="grid grid-cols-5 gap-1 pt-0.5">
          {peopleRoster.map((p) => {
            const isSelected = activePeerNote === p.id || recipient === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setRecipient((prev) => (prev === p.id ? 'all' : p.id));
                  setActivePeerNote((prev) => (prev === p.id ? null : p.id));
                }}
                className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                  isSelected
                    ? 'bg-[#EBF7F3] border-[#2E6859] shadow-2xs'
                    : 'bg-[#FAF8F5] hover:bg-white border-[#EAE3D5]'
                }`}
                title={`Bấm để xem sổ tay hoặc nhắn riêng cho ${p.name}`}
              >
                <div className="relative">
                  {p.id === 'bo' && <BoAvatar size="sm" className="w-6 h-6 scale-75 -my-1" />}
                  {p.id === 'tri' && <TriDeepThinkerAvatar className="w-6 h-6" />}
                  {p.id === 'linhchi' && <LinhChiNoteTakerAvatar className="w-6 h-6" />}
                  {p.id === 'minhkhang' && <MinhKhangInquisitiveAvatar className="w-6 h-6" />}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-white" />
                </div>
                <span className="font-bold text-[10px] text-[#1E242B] truncate w-full mt-0.5">
                  {p.name}
                </span>
                <span className="text-[9px] text-[#6E6254] truncate w-full leading-tight">
                  {p.status}
                </span>
              </button>
            );
          })}

          {/* Ô thứ 5: Học viên (Bạn) */}
          <div className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D5] text-center flex flex-col items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[#1B4338] text-white font-bold text-[10px] flex items-center justify-center">
              Bạn
            </div>
            <span className="font-bold text-[10px] text-[#1E242B] mt-0.5">Học viên</span>
            <span className="text-[9px] text-[#10B981] font-medium leading-tight">đang học</span>
          </div>
        </div>

        {/* Hộp Sổ tay mở nhanh khi click vào 1 bạn trên People Row */}
        {activePeerNote && (
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#D8CEBC] text-xs space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-[#1B4338]">
                Góc ghi chú của {peopleRoster.find((x) => x.id === activePeerNote)?.name}:
              </span>
              <button
                type="button"
                onClick={() => setActivePeerNote(null)}
                className="text-[10px] text-[#6E6254] hover:text-black cursor-pointer font-bold"
              >
                Đóng ✕
              </button>
            </div>
            <p className="text-[11px] text-[#374151] leading-relaxed">
              {activePeerNote === 'linhchi' &&
                cleanText(lesson.peerContext?.linhchi.cheatSheetBullets.join(' · ') || 'Quy tắc nối tiếp: OA + AB = OB. Quy tắc hình hộp: AB + AD + AA\' = AC\'.')}
              {activePeerNote === 'minhkhang' &&
                cleanText(lesson.peerContext?.minhkhang.analogyContent || 'Đi ngang 1m rồi đi lên 1m thì khoảng cách đường chéo là căn 2m.')}
              {activePeerNote === 'tri' &&
                cleanText(lesson.peerContext?.tri.edgeCaseNote || 'Muốn xét hai vectơ cùng hướng hay ngược hướng thì phải kiểm tra cùng phương trước.')}
              {activePeerNote === 'bo' &&
                cleanText(lesson.peerContext?.bo.hotTake || 'Mình hay quen tay tách thẳng |a + b| = |a| + |b| cho nhanh.')}
            </p>
          </div>
        )}
      </div>

      {/* 2. THANH GHIM TRỌNG TÂM MỎNG GỌN CỦA TRỢ GIẢNG AN */}
      {pinnedComment && (
        <div className="my-1.5 rounded-lg bg-[#1B4338] text-white px-3 py-2 shrink-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded bg-[#F5D65D] text-[#1B4338] font-bold text-[9px] uppercase">
              Ghim
            </span>
            <span className="text-[11px] font-semibold text-[#8CE6CF]">
              {pinnedComment.author} · Kèm mốc giây kiểm chứng:
            </span>
          </div>
          <p className="text-[11px] text-white/95 leading-snug">
            {cleanText(pinnedComment.text)}
          </p>
          {taHintTier > 0 && (
            <div className="mt-1 p-2 bg-white text-[#1B4338] rounded text-[11px] font-medium">
              {taHintTier === 1 && "Gợi ý 1 [36:44]: Kiểm tra điểm cuối của BC và điểm đầu của DD' đã nối tiếp nhau chưa."}
              {taHintTier === 2 && `Gợi ý 2 [36:55]: ${cleanText(lesson.freezeNote)}`}
              {taHintTier === 3 && "Gợi ý 3 [37:13]: Thay DD' = CC' thì BC + CC' = BC' (đường chéo hình vuông cạnh 1 bằng căn 2)."}
            </div>
          )}
        </div>
      )}

      {/* 3. LUỒNG CHAT LỚP HỌC PHẲNG, THOÁNG */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[#F2ECE1] my-1 pr-0.5 select-text">
        {allStreamComments.map((msg) => (
          <div key={msg.id} className="py-2 flex items-start gap-2">
            <ClassmateAvatar name={msg.author} className="w-6 h-6 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold truncate ${msg.author.includes('Bo') ? 'text-[#B45309]' : 'text-[#1E242B]'}`}>
                  {msg.author}
                </span>
                <button
                  type="button"
                  onClick={() => onSeekVideo?.(msg.second)}
                  className="text-[10px] font-mono text-[#2E6859] hover:underline font-semibold cursor-pointer shrink-0"
                >
                  {formatSec(msg.second)}
                </button>
              </div>
              <p className="text-xs text-[#4B5563] mt-0.5 leading-relaxed">
                {cleanText(msg.text)}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatStreamEndRef} />
      </div>

      {/* 4. THẺ CÂU HỎI ĐANG CHỜ THU GỌN TRONG LUỒNG CHAT (KHI BẤM [THU XUỐNG CHAT · XEM VIDEO]) */}
      {isQuizCollapsedToChat && (
        <div className="my-1.5 p-3 rounded-xl bg-[#FFFBF2] border-2 border-[#E8A33D] space-y-2 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#92400E] flex items-center gap-1">
              <ClockBadgeSvg className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Câu hỏi dừng [{formatSec(lesson.checkpointTimestamp)}]</span>
            </span>
            <button
              type="button"
              onClick={onExpandQuizBackToVideo}
              className="px-2 py-0.5 rounded bg-[#1B4338] text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <ExpandBackToVideoSvg className="w-3 h-3" />
              <span>Mở rộng trên Video</span>
            </button>
          </div>
          <p className="text-xs font-semibold text-[#1E242B] leading-snug">
            {cleanText(lesson.checkpointQuestion.prompt)}
          </p>
          <div className="space-y-1">
            {lesson.checkpointQuestion.options.map((opt, idx) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onAnswerCheckpoint(cleanText(opt.label));
                  onExpandQuizBackToVideo?.();
                }}
                className="w-full p-1.5 rounded-lg bg-white hover:bg-[#EBF7F3] border border-[#E2D9C8] text-left text-[11px] font-medium text-[#1E242B] flex items-center gap-2 cursor-pointer"
              >
                <span className="w-4 h-4 rounded bg-[#1B4338] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                </span>
                <span className="truncate">{cleanText(opt.label)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. HỘP HỖ TRỢ NHANH KHI ĐANG DỪNG GIƠ TAY */}
      {phase === 'STUDENT_FREEZE' && !isQuizCollapsedToChat && (
        <div className="my-1.5 p-2.5 bg-[#FFFBF2] border border-[#E8A33D] rounded-xl space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-[#8C5D19]">
            <span className="flex items-center gap-1.5">
              <HandStopIcon className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Hỗ trợ tại [{formatSec(currentTime)}]</span>
            </span>
            <button
              type="button"
              onClick={onDismissFreeze}
              className="text-[#1B4338] hover:underline font-semibold text-[11px] cursor-pointer"
            >
              Đóng ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {([
              { id: 'not_understand', label: 'Giải thích' },
              { id: 'take_notes', label: 'Công thức' },
              { id: 'too_fast', label: 'Lùi 10s' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedFreezeIntent(item.id);
                  if (item.id === 'too_fast') onSeekVideo?.(Math.max(0, currentTime - 10));
                }}
                className={`py-1 text-[11px] font-semibold rounded-lg border cursor-pointer transition-all ${
                  selectedFreezeIntent === item.id
                    ? 'bg-[#1E242B] text-white border-[#1E242B]'
                    : 'bg-white text-[#374151] border-[#E2D9C8]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-[#1E242B] bg-white p-2 rounded-lg border border-[#EFE8DC] leading-relaxed">
            {selectedFreezeIntent === 'not_understand' && cleanText(activeCue?.minhKhangAnalogy || lesson.freezeNote)}
            {selectedFreezeIntent === 'take_notes' && cleanText(activeCue?.linhChiNote || activeCue?.text)}
            {selectedFreezeIntent === 'too_fast' && `Đã lùi video về mốc [${formatSec(Math.max(0, currentTime - 10))}] để bạn nghe lại.`}
          </p>
        </div>
      )}

      {/* 6. BỘ GÕ COMPOSER ĐA NĂNG (CHỌN NGƯỜI NHẬN + BADGE THỜI GIAN + PILL HỎI NHANH) */}
      <div className="pt-2 border-t border-[#EFE8DC] space-y-1.5 shrink-0">
        {/* Dải Pill câu hỏi gợi ý nhanh */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            'Chưa hiểu đoạn này',
            "Tại sao đổi DD' = CC'?",
            'Khi nào dùng quy tắc hiệu?'
          ].map((quickPrompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendUserChatMessage(quickPrompt)}
              className="px-2 py-0.5 rounded-full bg-[#FAF8F5] hover:bg-[#EBF7F3] border border-[#E2D9C8] text-[10px] font-medium text-[#374151] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {quickPrompt}
            </button>
          ))}
        </div>

        {/* Thanh chọn người nhận (Gửi tới: Cả lớp / Nhắn riêng) + Mốc thời gian thực */}
        <div className="flex items-center justify-between text-[11px] text-[#6E6254] px-0.5">
          <div className="flex items-center gap-1">
            <span>Gửi tới:</span>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value as RecipientTarget)}
              className="bg-[#FAF8F5] border border-[#D8CEBC] rounded-md px-1.5 py-0.5 font-semibold text-[#1E242B] outline-none cursor-pointer text-[11px]"
            >
              <option value="all">Cả lớp</option>
              <option value="bo">Bo (Nhắn riêng)</option>
              <option value="tri">Trí (Nhắn riêng)</option>
              <option value="linhchi">Linh Chi (Nhắn riêng)</option>
              <option value="minhkhang">Minh Khang (Nhắn riêng)</option>
            </select>
          </div>

          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#2E6859] bg-[#F4FBF8] px-1.5 py-0.5 rounded border border-[#BCE1D4]">
            <ClockBadgeSvg className="w-3 h-3" />
            <span>Tại {formatSec(currentTime)}</span>
          </span>
        </div>

        {/* Ô nhập tin nhắn */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={userChatInput}
            onChange={(e) => setUserChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendUserChatMessage()}
            placeholder={
              recipient === 'all'
                ? 'Bình luận với cả lớp...'
                : `Nhắn riêng cho ${peopleRoster.find((p) => p.id === recipient)?.name}...`
            }
            className="flex-1 bg-[#FAF8F5] border border-[#E2D9C8] rounded-lg px-3 py-1.5 text-xs text-[#1E242B] outline-none focus:border-[#1B4338]"
          />
          <button
            onClick={() => handleSendUserChatMessage()}
            type="button"
            className="px-3.5 py-1.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs rounded-lg cursor-pointer transition-colors"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};
