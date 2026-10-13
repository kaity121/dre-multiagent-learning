// File: src/components/VideoDebateSheet.tsx
import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, TimelineComment } from '../types/dre';
import { 
  TaAvatar,
  ClassmateAvatar,
  VideoPlayIcon,
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

  // Gửi tin nhắn vào luồng lớp học (Kèm ngữ cảnh Transcript tại giây hiện tại)
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

    // Tìm câu thoại hiện tại trong video để các Agent trả lời khớp 100% ngữ cảnh
    const activeCue = lesson.transcriptCues?.find(c => currentTime >= c.start && currentTime <= c.end);
    const contextInfo = activeCue ? `(Đoạn ${activeCue.speaker} vừa nói: "${activeCue.text}")` : '';

    const lower = text.toLowerCase();
    let replyAuthor = 'Trí (Đào sâu)';
    let replyText = '';
    let replyRole: 'classmate' | 'ta' = 'classmate';

    if (lower.includes('bo') || lower.includes('@bo')) {
      replyAuthor = 'Bo Ngây Ngô';
      replyText = lesson.peerContext?.bo.defaultReply || `Tớ vẫn thấy cách rút gọn nhanh ở đoạn này tiện hơn mà! ${contextInfo}`;
    } else if (lower.includes('chi') || lower.includes('@linh chi')) {
      replyAuthor = 'Linh Chi';
      replyText = lesson.peerContext?.linhchi.defaultReply || `Tớ đã ghi công thức chuẩn của đoạn này vào Sổ tay rồi đó!`;
    } else if (lower.includes('khang') || lower.includes('@minh khang')) {
      replyAuthor = 'Minh Khang';
      replyText = lesson.peerContext?.minhkhang.defaultReply || `Cứ thử thay số cụ thể vào hai vế là kiểm chứng được ngay!`;
    } else if (lower.includes('an') || lower.includes('gợi ý')) {
      replyAuthor = 'Trợ giảng An';
      replyRole = 'ta';
      replyText = lesson.freezeNote;
    } else {
      replyAuthor = 'Trí';
      replyText = lesson.peerContext?.tri.defaultReply || `Bản chất ở đây là phải xét điều kiện xác định trước khi chia hai vế nhé!`;
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
    }, 450);
  };

  const defaultComments = lesson.timelineComments || [];
  const visibleTimelineComments = phase === 'WATCHING'
    ? defaultComments.filter(c => !c.isPinned && c.second <= Math.max(currentTime, 12))
    : defaultComments.filter(c => !c.isPinned);

  const allStreamComments = [...visibleTimelineComments, ...liveChatMessages];
  const pinnedComment = defaultComments.find(c => c.isPinned);

  return (
    <div className="relative w-full bg-[#FFFDF7] border-2 border-[#DDD6C8] rounded-md p-3.5 shadow-sm flex flex-col justify-between h-full min-h-[430px]">
      
      {/* 1. HEADER LỚP HỌC TRỰC TUYẾN */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8DFD0] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E53E3E] animate-pulse" />
          <span className="font-handwriting font-bold text-base text-[#3E342B] flex items-center gap-1.5">
            <LiveChatStreamIcon className="w-4 h-4 text-[#C97A13]" />
            <span>Lớp Học Trực Tuyến (6 Agents)</span>
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#7A6D5E] bg-[#F2EDE2] px-2 py-0.5 rounded-xs font-semibold">
          {phase === 'WATCHING' ? '🔴 Đang nghe giảng' : '⚡ Đang thảo luận'}
        </span>
      </div>

      {/* 2. THẺ GHIM CỦA TRỢ GIẢNG AN + NÚT GỢI Ý 3 TẦNG (SCAFFOLDING) */}
      {pinnedComment && (
        <div className="mb-2.5 p-2.5 bg-[#FFF9EB] border border-[#F0D5A3] rounded-xs shadow-2xs shrink-0 space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <TaAvatar className="w-5 h-5 shrink-0" />
              <span className="text-xs font-handwriting font-bold text-[#8C5D19]">
                {pinnedComment.author} · Ghim kiến thức
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setTaHintTier((prev) => (prev + 1) % 4);
              }}
              className="px-2 py-0.5 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-[11px] rounded cursor-pointer"
            >
              💡 Xin gợi ý ({taHintTier}/3)
            </button>
          </div>
          <p className="text-xs font-handwriting text-[#4A3D31] leading-snug">
            {pinnedComment.text}
          </p>
          {taHintTier > 0 && (
            <div className="p-2 bg-white rounded border border-[#E8A33D] text-xs font-handwriting text-[#2E6859]">
              {taHintTier === 1 && '🔹 Gợi ý Tầng 1 (Nhận diện): Hãy kiểm tra xem biểu thức chứa ẩn x có thể bằng 0 hay không.'}
              {taHintTier === 2 && `🔹 Gợi ý Tầng 2 (Chiến lược): ${lesson.freezeNote}`}
              {taHintTier === 3 && '🔹 Gợi ý Tầng 3 (Ví dụ tương tự): Với y(y − 1) = 2y, ta chuyển vế thành y(y − 3) = 0 để có đủ 2 nghiệm y = 0 và y = 3.'}
            </div>
          )}
        </div>
      )}

      {/* 3. LUỒNG CHAT RỘNG RÃI (Không còn bị hộp Quiz chèn ép ở đáy!) */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 max-h-[260px]">
        {allStreamComments.map((msg) => (
          <div
            key={msg.id}
            className={`group flex items-start gap-2 p-2 rounded-xs border transition-colors ${
              msg.author.includes('Bo')
                ? 'bg-[#FFF9EE] border-[#F0D5A3] border-l-3 border-l-[#E8A33D]'
                : msg.role === 'ta'
                ? 'bg-[#EEF8F5] border-[#BCE1D7] border-l-3 border-l-[#4E9B87]'
                : 'bg-white border-[#EFE8DC]'
            }`}
          >
            {msg.role === 'ta' ? (
              <TaAvatar className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <ClassmateAvatar name={msg.author} className="w-5 h-5 mt-0.5 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-handwriting font-bold text-[#3E342B]">
                  {msg.author}
                </span>
                <span className="text-[9px] font-mono text-[#8C5D19]/75 bg-[#F4EDE0] px-1 rounded-xs">
                  🤖 AI
                </span>
                {/* Bấm vào số giây trong tin nhắn để tua Video! */}
                <button
                  type="button"
                  onClick={() => onSeekVideo?.(msg.second)}
                  className="text-[10px] font-mono text-[#2E6859] hover:underline font-bold ml-auto cursor-pointer"
                  title="Bấm để tua video tới giây này"
                >
                  ▶ 0:{msg.second.toString().padStart(2, '0')}
                </button>

                <button
                  type="button"
                  onClick={() => setReportedMessageIds(prev => new Set(prev).add(msg.id))}
                  className="text-[10px] opacity-0 group-hover:opacity-100 text-[#A89885] hover:text-[#C93B2B] cursor-pointer"
                >
                  <FlagReportIcon className="w-3 h-3" />
                </button>
              </div>

              {reportedMessageIds.has(msg.id) ? (
                <p className="text-[11px] font-handwriting text-[#C93B2B] italic mt-0.5">
                  (Đã ghi nhận báo cáo kiểm duyệt)
                </p>
              ) : (
                <p className="text-xs font-handwriting text-[#4E4135] mt-0.5 leading-snug">
                  {msg.text}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatStreamEndRef} />
      </div>

      {/* 4. KHI HỌC SINH BẤM "KHOAN ĐÃ CÔ ƠI!" */}
      {phase === 'STUDENT_FREEZE' && (
        <div className="my-2 p-2.5 bg-[#FFF8EB] border border-[#E8A33D] rounded-xs space-y-2">
          <div className="text-xs font-handwriting font-bold text-[#8C5D19] flex items-center gap-1">
            <HandStopIcon className="w-3.5 h-3.5" />
            <span>Khoan đã cô ơi! Em muốn dừng vì:</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'not_understand', label: 'Chưa hiểu rõ' },
              { id: 'too_fast', label: 'Nói hơi nhanh' },
              { id: 'take_notes', label: 'Muốn ghi chép' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedFreezeIntent(item.id as any)}
                className={`px-2 py-1 text-[11px] font-handwriting rounded border cursor-pointer ${
                  selectedFreezeIntent === item.id
                    ? 'bg-[#E8A33D] text-white font-bold border-[#C98420]'
                    : 'bg-white text-[#54483C] border-[#DED7C9]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-handwriting text-[#4E4135] bg-white p-2 rounded border border-[#F0D5A3]">
            💡 {lesson.freezeNote}
          </p>
          <button
            onClick={onDismissFreeze}
            type="button"
            className="w-full py-1.5 bg-[#4E9B87] text-white font-handwriting font-bold text-xs rounded cursor-pointer flex items-center justify-center gap-1"
          >
            <VideoPlayIcon className="w-3.5 h-3.5" />
            <span>Tiếp tục bài giảng ➔</span>
          </button>
        </div>
      )}

      {/* 5. ĐÁY CỘT PHẢI: TAG NHANH 4 BẠN & Ô NHẬP CHAT */}
      <div className="pt-2 border-t border-[#EFE8DC] shrink-0 space-y-1.5">
        <div className="flex items-center gap-1 flex-wrap text-[11px] font-handwriting">
          <span className="text-[#8C7A68]">Tag nhanh:</span>
          {['@Bo', '@Trí', '@Linh Chi', '@Minh Khang'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setUserChatInput(prev => `${tag} ${prev}`)}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#DDD3C4] text-[#4E4135] font-bold cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={userChatInput}
            onChange={(e) => setUserChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendUserChatMessage()}
            placeholder="Thảo luận cùng @Bo, @Trí, @Linh Chi..."
            className="flex-1 bg-white border border-[#DFD6C7] rounded-xs px-2.5 py-1.5 text-xs font-handwriting text-[#3E342B] outline-none focus:border-[#E8A33D]"
          />
          <button
            onClick={handleSendUserChatMessage}
            type="button"
            className="px-3 py-1.5 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-xs rounded-xs cursor-pointer"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};
