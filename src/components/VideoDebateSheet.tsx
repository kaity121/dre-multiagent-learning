// File: src/components/VideoDebateSheet.tsx
import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, TimelineComment } from '../types/dre';
import { 
  ClassmateAvatar,
  HandStopIcon,
  LiveChatStreamIcon,
  GentleLightbulb
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

// ============================================================================
// CUSTOM HAND-CRAFTED SVG ICONS CHO KHUNG CHAT & HỘP GIƠ TAY (ZERO EMOJI)
// ============================================================================
const ExplainConceptSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="11" r="6" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.5 17.5H14.5M10.5 20.5H13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 8V11.5L14 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const FormulaNoteSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 8.5H16M8 12.5H16M8 16.5H12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const Rewind10sSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4.5 10.5C5.5 6.8 8.9 4 13 4C17.97 4 22 8.03 22 13C22 17.97 17.97 22 13 22C9.2 22 5.95 19.65 4.63 16.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 5.5V10.8H9.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PinRibbonSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M15 4.5L19.5 9L17.5 11L14.5 9.5L10.5 13.5L12 16.5L10 18.5L5.5 14L7.5 12L10.5 13.5L14.5 9.5L13 6.5L15 4.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M4 20L7.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
  onSeekVideo?: (second: number) => void;
  onAnswerCheckpoint: (answerText: string) => void;
  onSubmitRebuttal: (rebuttalText: string, isEffective: boolean) => void;
  onResumeVideo: () => void;
  onDismissFreeze: () => void;
  onSkipCheckpoint?: () => void;
}

// Quét sạch cả ký tự ô vuông lẫn các emoji thừa trong chuỗi data
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
  onSeekVideo,
  onDismissFreeze,
}) => {
  const [liveChatMessages, setLiveChatMessages] = useState<TimelineComment[]>([]);
  const [userChatInput, setUserChatInput] = useState<string>('');
  const [selectedFreezeIntent, setSelectedFreezeIntent] = useState<'not_understand' | 'too_fast' | 'take_notes'>('not_understand');
  const [taHintTier, setTaHintTier] = useState<number>(0);

  const chatStreamEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLiveChatMessages([]);
    setTaHintTier(0);
  }, [lesson.id]);

  useEffect(() => {
    chatStreamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lesson.timelineComments, currentTime, liveChatMessages, phase]);

  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSendUserChatMessage = () => {
    if (!userChatInput.trim()) return;
    const text = userChatInput.trim();
    const newMsg: TimelineComment = {
      id: `user_${Date.now()}`,
      second: currentTime,
      author: 'Bạn',
      role: 'classmate',
      text
    };
    setLiveChatMessages(prev => [...prev, newMsg]);
    setUserChatInput('');

    const lower = text.toLowerCase();
    let replyAuthor = 'Trí';
    let replyText = '';
    let replyRole: 'classmate' | 'ta' = 'classmate';

    if (lower.includes('bo') || lower.includes('@bo')) {
      replyAuthor = 'Bo';
      replyText = cleanText(lesson.peerContext?.bo.defaultReply) || 'Tớ vẫn thấy tách ra cộng nhanh hơn mà!';
    } else if (lower.includes('chi') || lower.includes('@linh chi')) {
      replyAuthor = 'Linh Chi';
      replyText = cleanText(lesson.peerContext?.linhchi.defaultReply) || 'Tớ đã ghi công thức chuẩn vào Sổ tay rồi đó!';
    } else if (lower.includes('khang') || lower.includes('@minh khang')) {
      replyAuthor = 'Minh Khang';
      replyText = cleanText(lesson.peerContext?.minhkhang.defaultReply) || 'Tưởng tượng đi ngang 1m rồi đi lên 1m thì đường chéo là căn 2 nhé!';
    } else {
      replyAuthor = 'Trí';
      replyText = cleanText(lesson.peerContext?.tri.defaultReply) || 'Bản chất ở đây là hai vectơ phải nối tiếp điểm đầu và điểm cuối!';
    }

    setTimeout(() => {
      sound.playBubblePop();
      setLiveChatMessages(prev => [
        ...prev,
        {
          id: `reply_${Date.now()}`,
          second: currentTime,
          author: replyAuthor,
          role: replyRole,
          text: replyText
        }
      ]);
    }, 400);
  };

  const defaultComments = lesson.timelineComments || [];
  const visibleTimelineComments = defaultComments.filter(c => !c.isPinned);
  const allStreamComments = [...visibleTimelineComments, ...liveChatMessages];
  const pinnedComment = defaultComments.find(c => c.isPinned);

  const activeCue =
    lesson.transcriptCues?.find((c) => currentTime >= c.start && currentTime <= c.end) ||
    [...(lesson.transcriptCues || [])].reverse().find((c) => currentTime >= c.start) ||
    lesson.transcriptCues?.[0];

  return (
    <div className="relative w-full h-full bg-white border border-[#E2D9C8] rounded-xl p-3.5 shadow-sm flex flex-col justify-between overflow-hidden">
      {/* 1. HEADER SANG TRỌNG, GỌN GÀNG */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#EFE8DC] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="font-bold text-sm text-[#1E242B] flex items-center gap-1.5">
            <LiveChatStreamIcon className="w-4 h-4 text-[#1B4338]" />
            <span>Thảo Luận Lớp Học</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            sound.playPencilTap();
            setTaHintTier((prev) => (prev + 1) % 4);
          }}
          className="px-2.5 py-1 bg-[#F4FBF8] hover:bg-[#E1F3EC] text-[#1B4338] border border-[#BCE1D4] font-semibold text-xs rounded-full cursor-pointer flex items-center gap-1 transition-colors"
        >
          <GentleLightbulb className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Gợi ý ({taHintTier}/3)</span>
        </button>
      </div>

      {/* 2. THẺ GHIM KIẾN THỨC NỔI BẬT (100% SVG ICON) */}
      {pinnedComment && (
        <div className="my-2 rounded-xl bg-[#1B4338] text-white border-l-4 border-[#F5D65D] p-3 shadow-sm shrink-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-[#F5D65D] text-[#1B4338] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
              <PinRibbonSvg className="w-3 h-3" />
              <span>Ghim trọng tâm</span>
            </span>
            <span className="text-xs font-semibold text-[#8CE6CF]">
              {pinnedComment.author}
            </span>
          </div>
          <p className="text-xs text-white/95 leading-relaxed pt-0.5">
            {cleanText(pinnedComment.text)}
          </p>
          {taHintTier > 0 && (
            <div className="mt-1.5 p-2 bg-white text-[#1B4338] rounded-lg text-xs font-medium">
              {taHintTier === 1 && 'Gợi ý 1: Kiểm tra điểm cuối của BC và điểm đầu của DD\' đã trùng nhau chưa.'}
              {taHintTier === 2 && `Gợi ý 2: ${cleanText(lesson.freezeNote)}`}
              {taHintTier === 3 && 'Gợi ý 3: Thay DD\' = CC\' thì BC + CC\' = BC\' (đường chéo hình vuông cạnh 1 bằng căn 2).'}
            </div>
          )}
        </div>
      )}

      {/* 3. LUỒNG CHAT HIỆN ĐẠI (ẨN SCROLLBAR) */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 my-1 pr-0.5">
        {allStreamComments.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors ${
              msg.author.includes('Bo')
                ? 'bg-[#FFFBF2] border-[#F3DFA8]'
                : 'bg-[#FAF8F5] border-[#EFEAE1]'
            }`}
          >
            <ClassmateAvatar name={msg.author} className="w-6 h-6 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1E242B] truncate">
                  {msg.author}
                </span>
                <button
                  type="button"
                  onClick={() => onSeekVideo?.(msg.second)}
                  className="text-[11px] font-mono text-[#1B4338] hover:underline font-semibold ml-auto cursor-pointer shrink-0"
                >
                  {formatSec(msg.second)}
                </button>
              </div>
              <p className="text-xs text-[#374151] mt-0.5 leading-relaxed">
                {cleanText(msg.text)}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatStreamEndRef} />
      </div>

      {/* 4. HỘP GIƠ TAY TẠI GIÂY HIỆN TẠI (ĐÃ XÓA SẠCH EMOJI BÀN PHÍM, THAY BẰNG CUSTOM SVG!) */}
      {phase === 'STUDENT_FREEZE' && (
        <div className="my-1.5 p-3 bg-[#FFFBF2] border border-[#E8A33D] rounded-xl space-y-2 shrink-0 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#8C5D19]">
            <span className="flex items-center gap-1.5">
              <HandStopIcon className="w-4 h-4 text-[#D97706]" />
              <span>Giơ tay tại [{formatSec(currentTime)}]</span>
            </span>
            <button
              type="button"
              onClick={onDismissFreeze}
              className="text-[#1B4338] hover:underline font-semibold cursor-pointer"
            >
              Xem tiếp ➔
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedFreezeIntent('not_understand')}
              className={`px-2 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer flex items-center justify-center gap-1 transition-all ${
                selectedFreezeIntent === 'not_understand'
                  ? 'bg-[#1E242B] text-white border-[#1E242B]'
                  : 'bg-white text-[#374151] border-[#E2D9C8] hover:bg-black/5'
              }`}
            >
              <ExplainConceptSvg className="w-3.5 h-3.5 shrink-0" />
              <span>Giải thích</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFreezeIntent('take_notes')}
              className={`px-2 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer flex items-center justify-center gap-1 transition-all ${
                selectedFreezeIntent === 'take_notes'
                  ? 'bg-[#1E242B] text-white border-[#1E242B]'
                  : 'bg-white text-[#374151] border-[#E2D9C8] hover:bg-black/5'
              }`}
            >
              <FormulaNoteSvg className="w-3.5 h-3.5 shrink-0" />
              <span>Công thức</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFreezeIntent('too_fast');
                onSeekVideo?.(Math.max(0, currentTime - 10));
              }}
              className={`px-2 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer flex items-center justify-center gap-1 transition-all ${
                selectedFreezeIntent === 'too_fast'
                  ? 'bg-[#1E242B] text-white border-[#1E242B]'
                  : 'bg-white text-[#374151] border-[#E2D9C8] hover:bg-black/5'
              }`}
            >
              <Rewind10sSvg className="w-3.5 h-3.5 shrink-0" />
              <span>Lùi 10s</span>
            </button>
          </div>

          <p className="text-xs text-[#1E242B] bg-white p-2 rounded-lg border border-[#EFE8DC] leading-relaxed">
            {selectedFreezeIntent === 'not_understand' && cleanText(activeCue?.minhKhangAnalogy || lesson.freezeNote)}
            {selectedFreezeIntent === 'take_notes' && cleanText(activeCue?.linhChiNote || activeCue?.text)}
            {selectedFreezeIntent === 'too_fast' && `Đã lùi video về mốc [${formatSec(Math.max(0, currentTime - 10))}] để bạn nghe lại.`}
          </p>
        </div>
      )}

      {/* 5. Ô NHẬP CHAT TỐI GIẢN */}
      <div className="pt-2 border-t border-[#EFE8DC] shrink-0">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={userChatInput}
            onChange={(e) => setUserChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendUserChatMessage()}
            placeholder="Trao đổi cùng @Bo, @Trí, @Linh Chi..."
            className="flex-1 bg-[#FAF8F5] border border-[#E2D9C8] rounded-lg px-3 py-1.5 text-xs text-[#1E242B] outline-none focus:border-[#1B4338]"
          />
          <button
            onClick={handleSendUserChatMessage}
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
