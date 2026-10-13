// File: src/components/VideoDebateSheet.tsx
import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, TimelineComment } from '../types/dre';
import { 
  TaAvatar,
  ClassmateAvatar,
  HandStopIcon,
  LiveChatStreamIcon,
  FlagReportIcon
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

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

const cleanText = (str?: string) => (str ? str.replace(/\u20d7/g, '') : '');

export const VideoDebateSheet: React.FC<VideoDebateSheetProps> = ({
  lesson,
  phase,
  currentTime = 0,
  onSeekVideo,
  onDismissFreeze,
}) => {
  const [liveChatMessages, setLiveChatMessages] = useState<TimelineComment[]>([]);
  const [userChatInput, setUserChatInput] = useState<string>('');
  const [reportedMessageIds, setReportedMessageIds] = useState<Set<string>>(new Set());
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
      author: 'Bạn (Học viên)',
      role: 'classmate',
      text
    };
    setLiveChatMessages(prev => [...prev, newMsg]);
    setUserChatInput('');

    const lower = text.toLowerCase();
    let replyAuthor = 'Trí (Đào sâu)';
    let replyText = '';
    let replyRole: 'classmate' | 'ta' = 'classmate';

    if (lower.includes('bo') || lower.includes('@bo')) {
      replyAuthor = 'Bo Ngây Ngô';
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
    <div className="relative w-full h-full bg-[#FFFDF7] border border-[#DDD6C8] rounded-xl p-3 shadow-sm flex flex-col justify-between overflow-hidden">
      {/* 1. HEADER GỌN */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD0] shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#E53E3E] animate-pulse" />
          <span className="font-handwriting font-bold text-sm text-[#3E342B] flex items-center gap-1">
            <LiveChatStreamIcon className="w-3.5 h-3.5 text-[#C97A13]" />
            <span>Lớp Học Trực Tuyến (6 Agents)</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            sound.playPencilTap();
            setTaHintTier((prev) => (prev + 1) % 4);
          }}
          className="px-2 py-0.5 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-[11px] rounded-full cursor-pointer"
        >
          💡 Gợi ý ({taHintTier}/3)
        </button>
      </div>

      {/* 2. THẺ GHIM CỦA TRỢ GIẢNG AN */}
      {pinnedComment && (
        <div className="my-1.5 p-2 bg-[#FFF9EB] border border-[#F0D5A3] rounded-lg shrink-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <TaAvatar className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-handwriting font-bold text-[#8C5D19]">
              {pinnedComment.author} · Ghim kiến thức
            </span>
          </div>
          <p className="text-[11px] font-handwriting text-[#4A3D31] leading-snug">
            {cleanText(pinnedComment.text)}
          </p>
          {taHintTier > 0 && (
            <div className="p-1.5 bg-white rounded border border-[#E8A33D] text-[11px] font-handwriting text-[#2E6859]">
              {taHintTier === 1 && '🔹 Tầng 1: Kiểm tra điểm cuối của BC và điểm đầu của DD\' đã trùng nhau chưa.'}
              {taHintTier === 2 && `🔹 Tầng 2: ${cleanText(lesson.freezeNote)}`}
              {taHintTier === 3 && '🔹 Tầng 3: Thay DD\' = CC\' thì BC + CC\' = BC\' (đường chéo hình vuông cạnh 1 bằng căn 2).'}
            </div>
          )}
        </div>
      )}

      {/* 3. LUỒNG CHAT (ĐÃ GẮN no-scrollbar ẨN SẠCH THANH KÉO & MŨI TÊN!) */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 my-1 pr-0.5">
        {allStreamComments.map((msg) => (
          <div
            key={msg.id}
            className={`group flex items-start gap-2 p-2 rounded-lg border transition-colors ${
              msg.author.includes('Bo')
                ? 'bg-[#FFF9EE] border-[#F0D5A3] border-l-3 border-l-[#E8A33D]'
                : 'bg-white border-[#EFE8DC]'
            }`}
          >
            <ClassmateAvatar name={msg.author} className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-handwriting font-bold text-[#3E342B] truncate">
                  {msg.author}
                </span>
                <span className="text-[9px] font-mono text-[#8C5D19]/75 bg-[#F4EDE0] px-1 rounded">
                  AI
                </span>
                <button
                  type="button"
                  onClick={() => onSeekVideo?.(msg.second)}
                  className="text-[10px] font-mono text-[#2E6859] hover:underline font-bold ml-auto cursor-pointer shrink-0"
                >
                  ▶ {formatSec(msg.second)}
                </button>
                <button
                  type="button"
                  onClick={() => setReportedMessageIds(prev => new Set(prev).add(msg.id))}
                  className="text-[10px] opacity-0 group-hover:opacity-100 text-[#A89885] hover:text-[#C93B2B] cursor-pointer"
                >
                  <FlagReportIcon className="w-2.5 h-2.5" />
                </button>
              </div>
              <p className="text-xs font-handwriting text-[#4E4135] mt-0.5 leading-snug">
                {reportedMessageIds.has(msg.id) ? '(Đã báo cáo)' : cleanText(msg.text)}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatStreamEndRef} />
      </div>

      {/* 4. KHUNG "KHOAN ĐÃ CÔ ƠI!" THEO GIÂY */}
      {phase === 'STUDENT_FREEZE' && (
        <div className="my-1 p-2.5 bg-[#FFF8EB] border border-[#E8A33D] rounded-lg space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-xs font-handwriting font-bold text-[#8C5D19]">
            <span className="flex items-center gap-1">
              <HandStopIcon className="w-3.5 h-3.5" />
              <span>✋ Giơ tay tại [{formatSec(currentTime)}]</span>
            </span>
            <button type="button" onClick={onDismissFreeze} className="text-[#2E6859] underline cursor-pointer">
              Tiếp tục ➔
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'not_understand', label: '🤔 Giải thích' },
              { id: 'take_notes', label: '📝 Công thức' },
              { id: 'too_fast', label: '⏪ Lùi 10s' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedFreezeIntent(item.id as any);
                  if (item.id === 'too_fast') onSeekVideo?.(Math.max(0, currentTime - 10));
                }}
                className={`px-1.5 py-1 text-[11px] font-handwriting rounded border cursor-pointer ${
                  selectedFreezeIntent === item.id
                    ? 'bg-[#2F2923] text-white font-bold'
                    : 'bg-white text-[#54483C] border-[#DED7C9]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-handwriting text-[#2F2923] bg-white p-1.5 rounded border border-[#F0D5A3] leading-snug">
            {selectedFreezeIntent === 'not_understand' && cleanText(activeCue?.minhKhangAnalogy || lesson.freezeNote)}
            {selectedFreezeIntent === 'take_notes' && cleanText(activeCue?.linhChiNote || activeCue?.text)}
            {selectedFreezeIntent === 'too_fast' && `⏪ Đã lùi về [${formatSec(Math.max(0, currentTime - 10))}] để em nghe lại!`}
          </p>
        </div>
      )}

      {/* 5. Ô NHẬP CHAT GỌN Ở ĐÁY */}
      <div className="pt-1.5 border-t border-[#EFE8DC] shrink-0 space-y-1">
        <div className="flex items-center gap-1 flex-wrap text-[10px] font-handwriting">
          {['@Bo', '@Trí', '@Linh Chi', '@Minh Khang'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setUserChatInput(prev => `${tag} ${prev}`)}
              className="px-2 py-0.5 rounded-full bg-[#FAF6EE] hover:bg-[#EFE8DA] border border-[#DDD3C4] text-[#4E4135] font-bold cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={userChatInput}
            onChange={(e) => setUserChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendUserChatMessage()}
            placeholder="Thảo luận cùng lớp học..."
            className="flex-1 bg-white border border-[#DFD6C7] rounded-lg px-2.5 py-1 text-xs font-handwriting text-[#3E342B] outline-none focus:border-[#E8A33D]"
          />
          <button
            onClick={handleSendUserChatMessage}
            type="button"
            className="px-3 py-1 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-xs rounded-lg cursor-pointer"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};
