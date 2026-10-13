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
    }, 350);
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
    <div className="relative w-full h-full flex flex-col justify-between pl-1 sm:pl-3 overflow-hidden">
      {/* 1. HEADER TỐI GIẢN */}
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
          className="px-2.5 py-1 bg-[#F4FBF8] hover:bg-[#E1F3EC] text-[#1B4338] border border-[#BCE1D4] font-semibold text-xs rounded-full cursor-pointer flex items-center gap-1"
        >
          <GentleLightbulb className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Gợi ý ({taHintTier}/3)</span>
        </button>
      </div>

      {/* 2. THANH GHIM TRỌNG TÂM MỎNG GỌN (Không chiếm diện tích như cục gạch cũ) */}
      {pinnedComment && (
        <div className="my-2 rounded-lg bg-[#1B4338] text-white px-3 py-2 shrink-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded bg-[#F5D65D] text-[#1B4338] font-bold text-[10px] uppercase">
              Ghim
            </span>
            <span className="text-[11px] font-semibold text-[#8CE6CF]">
              {pinnedComment.author}:
            </span>
          </div>
          <p className="text-xs text-white/95 leading-snug">
            {cleanText(pinnedComment.text)}
          </p>
          {taHintTier > 0 && (
            <div className="mt-1 p-2 bg-white text-[#1B4338] rounded text-xs font-medium">
              {taHintTier === 1 && 'Gợi ý 1: Kiểm tra điểm cuối của BC và điểm đầu của DD\' đã trùng nhau chưa.'}
              {taHintTier === 2 && `Gợi ý 2: ${cleanText(lesson.freezeNote)}`}
              {taHintTier === 3 && 'Gợi ý 3: Thay DD\' = CC\' thì BC + CC\' = BC\' (đường chéo hình vuông cạnh 1 bằng căn 2).'}
            </div>
          )}
        </div>
      )}

      {/* 3. LUỒNG CHAT PHẲNG, THOÁNG (KHÔNG ĐÓNG HỘP VIỀN NẶNG NỀ!) */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[#F2ECE1] my-1 pr-0.5">
        {allStreamComments.map((msg) => (
          <div key={msg.id} className="py-2.5 flex items-start gap-2.5">
            <ClassmateAvatar name={msg.author} className="w-6 h-6 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold truncate ${msg.author.includes('Bo') ? 'text-[#B45309]' : 'text-[#1E242B]'}`}>
                  {msg.author}
                </span>
                <button
                  type="button"
                  onClick={() => onSeekVideo?.(msg.second)}
                  className="text-[11px] font-mono text-[#2E6859] hover:underline font-medium cursor-pointer shrink-0"
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

      {/* 4. HỘP GIƠ TAY TẠI GIÂY HIỆN TẠI */}
      {phase === 'STUDENT_FREEZE' && (
        <div className="my-1.5 p-3 bg-[#FFFBF2] border border-[#E8A33D] rounded-xl space-y-2 shrink-0">
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
                className={`py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                  selectedFreezeIntent === item.id
                    ? 'bg-[#1E242B] text-white border-[#1E242B]'
                    : 'bg-white text-[#374151] border-[#E2D9C8]'
                }`}
              >
                {item.label}
              </button>
            ))}
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
            className="px-3.5 py-1.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs rounded-lg cursor-pointer"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};
