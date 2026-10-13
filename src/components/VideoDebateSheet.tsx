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

  const formatSec = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
                  ▶ {formatSec(msg.second)}
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

      {/* 4. KHI HỌC SINH BẤM "KHOAN ĐÃ CÔ ƠI!" (OpenMAIC Timestamp-Aware Director) */}
      {phase === 'STUDENT_FREEZE' && (() => {
        // Bắt chính xác câu thoại và công thức của Thầy/Cô tại giây học sinh vừa bấm dừng!
        const activeCue =
          lesson.transcriptCues?.find((c) => currentTime >= c.start && currentTime <= c.end) ||
          [...(lesson.transcriptCues || [])].reverse().find((c) => currentTime >= c.start) ||
          lesson.transcriptCues?.[0];

        return (
          <div className="my-2 p-3 bg-[#FFF8EB] border-2 border-[#E8A33D] rounded-md space-y-2.5 shadow-md animate-in zoom-in-95 duration-200">
            {/* Header báo rõ học sinh vừa giơ tay ở giây nào */}
            <div className="flex items-center justify-between border-b border-[#F0D5A3] pb-1.5">
              <div className="text-xs font-handwriting font-bold text-[#8C5D19] flex items-center gap-1.5">
                <HandStopIcon className="w-4 h-4 text-[#E8A33D]" />
                <span>✋ Em vừa giơ tay dừng bài giảng tại [{formatSec(currentTime)}]</span>
              </div>
              <span className="text-[10px] font-mono bg-[#E8A33D]/20 text-[#8C5D19] px-1.5 py-0.5 rounded font-bold">
                Phím tắt: K
              </span>
            </div>

            {/* Trích dẫn lại câu thầy/cô vừa nói ở giây đó để học sinh đối chiếu */}
            {activeCue && (
              <div className="p-2 rounded bg-[#1E2B24] text-[#F4F1EA] text-[11px] font-handwriting space-y-1">
                <div className="text-[#8CE6CF] font-mono text-[10px]">
                  Đoạn bài giảng tại [{formatSec(activeCue.start)}]:
                </div>
                <p className="italic">“{activeCue.text}”</p>
                {activeCue.formula && (
                  <div className="text-[#F5D65D] font-mono font-bold">
                    📐 {activeCue.formula}
                  </div>
                )}
              </div>
            )}

            {/* 3 Nút Điều phối Agent theo đúng Ý định của học sinh (OpenMAIC Director) */}
            <div>
              <label className="block text-[11px] font-handwriting text-[#6E5D4E] mb-1 font-bold">
                Em cần lớp học hỗ trợ gì ở đoạn [{formatSec(currentTime)}] này?
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setSelectedFreezeIntent('not_understand');
                  }}
                  className={`px-2 py-1.5 text-[11px] font-handwriting rounded border cursor-pointer transition-all ${
                    selectedFreezeIntent === 'not_understand'
                      ? 'bg-[#006064] text-white font-bold border-[#00484A] shadow-2xs'
                      : 'bg-white text-[#54483C] border-[#DED7C9] hover:bg-[#E0F7FA]'
                  }`}
                >
                  🤔 Chưa hiểu đoạn này
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setSelectedFreezeIntent('take_notes');
                  }}
                  className={`px-2 py-1.5 text-[11px] font-handwriting rounded border cursor-pointer transition-all ${
                    selectedFreezeIntent === 'take_notes'
                      ? 'bg-[#8C2852] text-white font-bold border-[#6E1C3E] shadow-2xs'
                      : 'bg-white text-[#54483C] border-[#DED7C9] hover:bg-[#FFF0F5]'
                  }`}
                >
                  📝 Tóm tắt công thức
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setSelectedFreezeIntent('too_fast');
                    // Tự động lùi video 10 giây và cho Bo nhảy vào đồng cảm!
                    const rewindSec = Math.max(0, currentTime - 10);
                    onSeekVideo?.(rewindSec);
                    setLiveChatMessages((prev) => [
                      ...prev,
                      {
                        id: `bo_empathy_${Date.now()}`,
                        second: rewindSec,
                        author: 'Bo Ngây Ngô',
                        role: 'classmate',
                        text: `Phù, may quá cậu bấm dừng ở [${formatSec(currentTime)}]! Đoạn này thầy giảng nhanh quá tớ cũng đang lú, tụi mình lùi lại 10 giây nghe kỹ lại nhé!`
                      }
                    ]);
                  }}
                  className={`px-2 py-1.5 text-[11px] font-handwriting rounded border cursor-pointer transition-all ${
                    selectedFreezeIntent === 'too_fast'
                      ? 'bg-[#E8A33D] text-white font-bold border-[#C98420] shadow-2xs'
                      : 'bg-white text-[#54483C] border-[#DED7C9] hover:bg-[#FFF8EB]'
                  }`}
                >
                  ⏪ Lùi 10s nghe lại
                </button>
              </div>
            </div>

            {/* Nội dung phản hồi động từ Minh Khang / Linh Chi / Bo theo đúng giây hiện tại */}
            <div className="p-2.5 bg-white rounded border border-[#F0D5A3] text-xs font-handwriting text-[#2F2923] space-y-1.5">
              {selectedFreezeIntent === 'not_understand' && (
                <>
                  <div className="font-bold text-[#006064]">
                    💡 Minh Khang & Cô Lam giải thích đoạn [{formatSec(currentTime)}]:
                  </div>
                  <p className="leading-snug">
                    {activeCue?.minhKhangAnalogy || lesson.freezeNote}
                  </p>
                </>
              )}

              {selectedFreezeIntent === 'take_notes' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#8C2852]">
                      📝 Thẻ Flashcard của Linh Chi tại [{formatSec(currentTime)}]:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playStampThud();
                        setLiveChatMessages((prev) => [
                          ...prev,
                          {
                            id: `pin_note_${Date.now()}`,
                            second: currentTime,
                            author: 'Linh Chi (Ghi chú)',
                            role: 'classmate',
                            text: `📌 Đã lưu vào vở đoạn [${formatSec(currentTime)}]: ${activeCue?.formula || activeCue?.text}`
                          }
                        ]);
                      }}
                      className="px-2 py-0.5 bg-[#FFF0F5] hover:bg-[#FAD0DE] text-[#8C2852] border border-[#F29BB7] rounded text-[10px] font-bold cursor-pointer"
                    >
                      📌 Đẩy vào luồng lớp học
                    </button>
                  </div>
                  <p className="leading-snug text-[#4A152B]">
                    {activeCue?.linhChiNote || activeCue?.text}
                  </p>
                </>
              )}

              {selectedFreezeIntent === 'too_fast' && (
                <p className="text-[#8C5D19] leading-snug">
                  ⏪ Đã tự động lùi video về mốc <strong>[{formatSec(Math.max(0, currentTime - 10))}]</strong>! Bạn <strong>Bo</strong> cũng vừa nhắn tin đồng cảm với em trên luồng lớp học kìa.
                </p>
              )}
            </div>

            {/* Ô hỏi trực tiếp thắc mắc của học sinh tại đúng giây dừng */}
            <div className="pt-1 border-t border-[#F0D5A3]">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={userChatInput}
                  onChange={(e) => setUserChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userChatInput.trim()) {
                      handleSendUserChatMessage();
                    }
                  }}
                  placeholder={`Hỏi thẳng về đoạn [${formatSec(currentTime)}] (VD: Sao DD' = CC' ạ?)...`}
                  className="flex-1 px-2.5 py-1 bg-white border border-[#D8CEBC] rounded text-xs font-handwriting outline-none focus:border-[#4E9B87]"
                />
                <button
                  type="button"
                  onClick={handleSendUserChatMessage}
                  className="px-2.5 py-1 bg-[#2F2923] text-[#F5D65D] font-handwriting font-bold text-xs rounded cursor-pointer shrink-0"
                >
                  Hỏi lớp
                </button>
              </div>
            </div>

            <button
              onClick={onDismissFreeze}
              type="button"
              className="w-full py-1.5 bg-[#4E9B87] hover:bg-[#3E806F] text-white font-handwriting font-bold text-xs rounded cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
            >
              <VideoPlayIcon className="w-3.5 h-3.5" />
              <span>Em đã hiểu đoạn [{formatSec(currentTime)}], phát tiếp bài giảng ➔</span>
            </button>
          </div>
        );
      })()}

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
