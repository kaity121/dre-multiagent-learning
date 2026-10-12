import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, RebuttalSticker, TimelineComment } from '../types/dre';
import { 
  BoAvatar, 
  TutorLamAvatar, 
  TaAvatar,
  ClassmateAvatar,
  WashiTape, 
  PushPin, 
  RubberStampSuccess, 
  SwordsDebateIcon,
  VideoPlayIcon,
  SparkleIcon,
  CheckCircleIcon,
  GoldenStarIcon,
  HandStopIcon,
  LiveChatStreamIcon,
  PinTackIcon,
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
  isBackendLive = false,
  isLoadingAi = false,
  liveBoDialogue,
  liveCoLamDialogue,
  liveHintDialogue,
  onAnswerCheckpoint,
  onSubmitRebuttal,
  onResumeVideo,
  onDismissFreeze,
  onSkipCheckpoint,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [customRebuttalText, setCustomRebuttalText] = useState<string>('');
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  // Live Chat Stream: user comments in the stream
  const [liveChatMessages, setLiveChatMessages] = useState<TimelineComment[]>([]);
  const [userChatInput, setUserChatInput] = useState<string>('');
  const chatStreamEndRef = useRef<HTMLDivElement | null>(null);

  // Reported messages tracking for AI Ethics
  const [reportedMessageIds, setReportedMessageIds] = useState<Set<string>>(new Set());

  // Intent Picker for "Khoan đã cô ơi!"
  const [selectedFreezeIntent, setSelectedFreezeIntent] = useState<'not_understand' | 'too_fast' | 'take_notes' | 'other'>('not_understand');

  // Auto-scroll chat stream as new messages arrive
  useEffect(() => {
    chatStreamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lesson.timelineComments, currentTime, liveChatMessages]);

  // Tactile celebration chime when Bo concedes the debate
  useEffect(() => {
    if (phase === 'BO_CONCEDED') {
      sound.playSuccessChime();
    }
  }, [phase]);

  // Handle student selecting an answer at checkpoint
  const handleSelectAnswer = (optionId: string) => {
    sound.playPencilTap();
    setSelectedOptionId(optionId);
    const opt = lesson.checkpointQuestion.options.find(o => o.id === optionId);
    onAnswerCheckpoint(opt ? opt.label : optionId);
  };

  // Handle rebuttal click
  const handleSelectRebuttalSticker = (sticker: RebuttalSticker) => {
    sound.playStampThud();
    setCustomRebuttalText(sticker.text);
    setActiveFeedback(sticker.feedback);
    onSubmitRebuttal(sticker.text, sticker.isEffective);
  };

  // Handle custom text submit
  const handleSendCustomRebuttal = () => {
    if (!customRebuttalText.trim()) return;
    sound.playStampThud();
    const lower = customRebuttalText.toLowerCase();
    const isEffective = lower.includes('0') || lower.includes('bằng 0') || lower.includes('mất nghiệm') || lower.includes('chia') || lower.includes('âm') || lower.includes('đổi dấu') || lower.includes('đổi chiều');
    const feedback = isEffective 
      ? 'Lý lẽ phản biện rất sắc bén! Bạn đã chỉ ra được bản chất toán học.'
      : 'Cần phân tích cụ thể hơn để Bo hiểu vì sao cách làm đó bị sơ hở!';
    setActiveFeedback(feedback);
    onSubmitRebuttal(customRebuttalText, isEffective);
  };

  // Handle user posting a message in the ambient live chat
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

    // If message mentions a classmate or asks for help, have that classmate reply!
    const lower = text.toLowerCase();
    let replyAuthor = '';
    let replyText = '';
    let replyRole: 'classmate' | 'ta' = 'classmate';

    if (lower.includes('bo') || lower.includes('@bo')) {
      replyAuthor = 'Bo (Phản biện)';
      replyText = 'Tớ đây! Tớ vẫn bảo lưu ý kiến là gạch cho nhanh, trừ khi cậu chứng minh được tớ tính sai!';
    } else if (lower.includes('trí') || lower.includes('@trí')) {
      replyAuthor = 'Trí (Đào sâu)';
      replyText = 'Góc nhìn hay đấy! Bản chất ở đây là quy tắc nhân chia cùng một số khác 0 để bảo toàn tỉ số.';
    } else if (lower.includes('linh chi') || lower.includes('@linh chi') || lower.includes('chi')) {
      replyAuthor = 'Linh Chi (Ghi chú)';
      replyText = 'Tớ vừa ghi lại công thức này vào sổ rồi: A/B + C/D = (A.D + B.C) / (B.D)!';
    } else if (lower.includes('khang') || lower.includes('@khang')) {
      replyAuthor = 'Minh Khang (Trực quan)';
      replyText = 'Chuẩn luôn! Giống như việc đổi tiền 50k và 20k về cùng tiền lẻ 10k thì mới cộng được ấy!';
    } else if (lower.includes('cô') || lower.includes('an') || lower.includes('trợ giảng')) {
      replyAuthor = 'Trợ giảng An';
      replyRole = 'ta';
      replyText = 'Chào em, cô Lam đang giảng ở mốc này, em hãy chú ý kỹ câu hỏi checkpoint nhé!';
    }

    if (replyAuthor) {
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
      }, 550);
    }
  };

  // Handle reporting AI comment (AI Ethics)
  const handleReportComment = (msgId: string) => {
    setReportedMessageIds(prev => new Set(prev).add(msgId));
  };

  const boDebateSpeech = liveBoDialogue || lesson.boArgument.speech;
  const boConcessionSpeech = liveBoDialogue || lesson.boConcession.speech;
  const coLamClosureSpeech = Array.isArray(liveCoLamDialogue) 
    ? liveCoLamDialogue.join(' ') 
    : (liveCoLamDialogue || lesson.teacherClosure.speech);

  // Filter timeline comments that should appear up to current video time
  const defaultComments = lesson.timelineComments || [];
  const visibleTimelineComments = phase === 'WATCHING'
    ? defaultComments.filter(c => c.second <= Math.max(currentTime, 8))
    : defaultComments;

  // Combine script comments with live user comments
  const allStreamComments = [...visibleTimelineComments, ...liveChatMessages];

  // Pinned TA or Teacher Note
  const pinnedComment = defaultComments.find(c => c.isPinned);

  return (
    <div className="relative w-full bg-[#FFFDF7] border-2 border-[#DDD6C8] rounded-md p-3 sm:p-3.5 shadow-sm flex flex-col justify-between">

      <div>
        {/* Stream Header (YouTube Live / Zoom Style) */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E8DFD0]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E53E3E] animate-pulse" />
            <span className="font-handwriting font-bold text-base text-[#3E342B] flex items-center gap-1.5">
              <LiveChatStreamIcon className="w-4 h-4 text-[#C97A13]" />
              <span>Lớp Học Trực Tuyến</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#7A6D5E] bg-[#F2EDE2] px-2 py-0.5 rounded-xs font-semibold">
              {phase === 'WATCHING' && '🔴 Live Stream'}
              {phase === 'CHECKPOINT_REACHED' && '⏸ Câu hỏi dừng'}
              {phase === 'BO_DEBATE' && '⚔️ Bo tranh biện'}
              {phase === 'BO_CONCEDED' && '✨ Bo chịu thua'}
              {phase === 'CO_LAM_CLOSURE' && '⭐ Chốt bài'}
              {phase === 'STUDENT_FREEZE' && '✋ Đang tạm dừng'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PINNED COMMENT AT TOP (TA AN'S PEDAGOGICAL HIGHLIGHT - Minimal flat card) */}
        {/* ========================================================================= */}
        {pinnedComment && (
          <div className="mb-3 p-2.5 bg-[#FFF9EB] border border-[#F0D5A3] rounded-xs shadow-2xs flex items-start gap-2">
            <TaAvatar className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-handwriting font-bold text-[#8C5D19]">
                  {pinnedComment.author} <span className="text-[9px] font-mono px-1 py-0.2 bg-[#E8A33D]/20 text-[#8C5D19] rounded-xs">Ghim</span>
                </span>
                <span className="text-[10px] font-mono text-[#A89885]">Ghim bài</span>
              </div>
              <p className="text-xs font-handwriting text-[#4A3D31] mt-0.5 leading-snug">
                {pinnedComment.text}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHAT STREAM (YouTube Live / Zoom Style with flat speech bubbles) */}
        {/* ========================================================================= */}
        <div className="max-h-[140px] sm:max-h-[160px] overflow-y-auto space-y-1.5 pr-1 pb-1.5 border-b border-[#EFE8DC]">
          {allStreamComments.length === 0 ? (
            <div className="text-center py-6 text-xs font-handwriting text-[#9E8F7F]">
              Đang chờ các bạn vào lớp...
            </div>
          ) : (
            allStreamComments.map((msg) => (
              <div 
                key={msg.id}
                className={`group flex items-start gap-2 p-1.5 rounded-xs transition-colors ${
                  msg.author.includes('Bo') 
                    ? 'bg-[#FFF9EE] border-l-2 border-[#E8A33D]' 
                    : msg.role === 'ta'
                    ? 'bg-[#EEF8F5] border-l-2 border-[#4E9B87]'
                    : 'bg-white/80 hover:bg-white'
                }`}
              >
                {msg.role === 'ta' ? (
                  <TaAvatar className="w-5 h-5 mt-0.5 shrink-0" />
                ) : msg.author.includes('Bo') ? (
                  <div className="w-5 h-5 rounded-full bg-[#FFE8CC] border border-[#FFA94D] flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                    <svg viewBox="0 0 40 40" className="w-full h-full">
                      <circle cx="20" cy="20" r="19" fill="#FFF4DE" />
                      {/* Bo hair */}
                      <path d="M10 18 C10 8, 30 8, 30 18 C27 13, 23 12, 20 12 C17 12, 13 13, 10 18 Z" fill="#423429" />
                      {/* Bo face */}
                      <circle cx="20" cy="20" r="8.5" fill="#FFE5CC" />
                      <circle cx="15" cy="22" r="1.5" fill="#F59E7A" opacity="0.6" />
                      <circle cx="25" cy="22" r="1.5" fill="#F59E7A" opacity="0.6" />
                      {/* Eyes & smile */}
                      <circle cx="16.5" cy="19.5" r="1.2" fill="#2B211A" />
                      <circle cx="23.5" cy="19.5" r="1.2" fill="#2B211A" />
                      <path d="M18 23 Q20 25 22 23" stroke="#2B211A" strokeWidth="1" strokeLinecap="round" fill="none" />
                      {/* Amber hoodie */}
                      <path d="M11 36 C13 29, 27 29, 29 36 Z" fill="#E8963D" />
                    </svg>
                  </div>
                ) : (
                  <ClassmateAvatar name={msg.author} className="w-5 h-5 mt-0.5 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-handwriting font-bold text-[#3E342B]">
                      {msg.author}
                    </span>
                    <span className="text-[9px] font-mono text-[#8C5D19]/70 bg-[#F4EDE0] px-1 rounded-xs">
                      🤖 AI
                    </span>
                    <span className="text-[10px] font-mono text-[#A89885] ml-auto">
                      00:{msg.second.toString().padStart(2, '0')}
                    </span>
                    
                    {/* AI Ethics: Flag/Report Button on hover */}
                    <button
                      type="button"
                      onClick={() => handleReportComment(msg.id)}
                      className={`text-[10px] p-0.5 rounded cursor-pointer transition-opacity ${
                        reportedMessageIds.has(msg.id) 
                          ? 'text-[#C93B2B] opacity-100' 
                          : 'text-[#A89885] opacity-0 group-hover:opacity-100 hover:text-[#C93B2B]'
                      }`}
                      title={reportedMessageIds.has(msg.id) ? 'Đã báo cáo tin này' : 'Báo cáo nội dung AI không phù hợp'}
                    >
                      <FlagReportIcon className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {reportedMessageIds.has(msg.id) ? (
                    <p className="text-[11px] font-handwriting text-[#C93B2B] italic mt-0.5">
                      (Nội dung đã được ghi nhận báo cáo và đang kiểm duyệt)
                    </p>
                  ) : (
                    <p className="text-xs font-handwriting text-[#4E4135] mt-0.5 leading-snug break-words">
                      {msg.text}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatStreamEndRef} />
        </div>

        {/* Quick Tag Pills for Classroom Chat (Nhắn chọn 1 trong 4 bạn học) */}
        <div className="flex items-center gap-1.5 pt-1.5 pb-1 text-[11px] font-handwriting">
          <span className="text-[#8C7A68]">Nhắn cho bạn:</span>
          {['@Bo', '@Trí', '@Linh Chi', '@Minh Khang'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setUserChatInput(prev => prev ? `${prev} ${tag} ` : `${tag} `);
              }}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#DDD3C4] text-[#4E4135] cursor-pointer shadow-2xs hover:scale-105 active:scale-95 transition-all font-bold"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Ambient chat input box (student can type into stream anytime) */}
        <div className="flex items-center gap-1.5 pb-2">
          <input
            type="text"
            value={userChatInput}
            onChange={(e) => setUserChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendUserChatMessage();
            }}
            placeholder="Nhắn vào luồng (ví dụ: @Bo tại sao lại gạch?)..."
            className="flex-1 bg-white border border-[#DFD6C7] rounded-xs px-2.5 py-1 text-xs font-handwriting text-[#3E342B] outline-none focus:border-[#E8A33D]"
          />
          <button
            onClick={handleSendUserChatMessage}
            type="button"
            className="px-2.5 py-1 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-xs rounded-xs cursor-pointer shadow-2xs"
          >
            Gửi
          </button>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE PEDAGOGICAL WORKSPACE (Switches based on phase) */}
        {/* ========================================================================= */}
        <div className="pt-2">
          {/* PHASE 1: WATCHING */}
          {phase === 'WATCHING' && (
            <div className="p-3 bg-[#FAF6EE] border border-[#E8DFD0] rounded-xs text-center space-y-1">
              <p className="font-handwriting text-xs text-[#5C4F42]">
                Video đang giảng bài bên trái. Bình luận của các bạn AI đang trôi theo thời gian thực.
              </p>
              <div className="text-[11px] font-mono text-[#8C5D19]">
                Mốc dừng suy ngẫm: 00:{lesson.checkpointTimestamp}s
              </div>
            </div>
          )}

          {/* PHASE 2: CHECKPOINT_REACHED */}
          {phase === 'CHECKPOINT_REACHED' && (
            <div className="space-y-2.5 p-3 bg-[#EEF8F5] border border-[#C5E8DC] rounded-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TutorLamAvatar size="sm" className="scale-75 shrink-0" />
                  <span className="font-handwriting font-bold text-xs text-[#2E6859]">
                    Cô Lam dừng video đặt câu hỏi:
                  </span>
                </div>
                {/* Skip Checkpoint Button (UX QA: Skip không ghi mastered) */}
                <button
                  type="button"
                  onClick={onSkipCheckpoint || onResumeVideo}
                  className="text-[11px] font-handwriting text-[#8A7D6F] hover:text-[#3B2F24] underline cursor-pointer"
                  title="Bỏ qua câu hỏi này và xem tiếp video"
                >
                  Bỏ qua câu hỏi ➔
                </button>
              </div>

              <p className="font-semibold text-xs text-[#1E4338] leading-snug">
                {lesson.checkpointQuestion.prompt}
              </p>
              <div className="space-y-1.5 pt-1">
                {lesson.checkpointQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectAnswer(opt.id)}
                    type="button"
                    className={`w-full text-left p-2 rounded-xs border text-xs font-handwriting flex items-start gap-2 cursor-pointer transition-all ${
                      selectedOptionId === opt.id
                        ? 'bg-[#FFF8EB] border-[#E8A33D] text-[#3B2F24] font-bold shadow-2xs'
                        : 'bg-white border-[#DFD6C7] text-[#4A3D31] hover:bg-[#FFFDF7]'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-[#D2C5B4] flex items-center justify-center shrink-0 text-[10px] font-mono font-bold">
                      {opt.id === 'opt_1' ? 'A' : opt.id === 'opt_2' ? 'B' : 'C'}
                    </span>
                    <span className="leading-snug">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PHASE 3: BO_DEBATE */}
          {phase === 'BO_DEBATE' && (
            <div className="space-y-2.5 p-3 bg-[#FFF9EC] border-2 border-[#E8A33D] rounded-xs animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-2">
                <BoAvatar size="sm" expression="skeptical" className="shrink-0 -rotate-2" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-handwriting font-bold text-xs text-[#8C5D19]">Bo tranh cãi:</span>
                    <span className="text-[9px] font-mono text-[#A36D19] bg-[#F5D65D]/40 px-1 py-0.2 rounded-xs">
                      {lesson.boArgument.fallacyType}
                    </span>
                  </div>
                  <p className="font-handwriting text-xs text-[#3E342B] mt-1 leading-snug">
                    &ldquo;{boDebateSpeech}&rdquo;
                  </p>
                </div>
              </div>

              {/* Rebuttal Quick Stickers */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-handwriting font-bold text-[#7A6D5E]">
                  Chọn lý lẽ để phản biện lại Bo:
                </div>
                {lesson.rebuttalStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleSelectRebuttalSticker(sticker)}
                    type="button"
                    disabled={isLoadingAi}
                    className="w-full text-left px-2.5 py-1.5 bg-white hover:bg-[#FFF3D6] text-[#3B2F24] border border-[#E8A33D]/60 rounded-xs font-handwriting text-xs flex items-center justify-between gap-1 shadow-2xs cursor-pointer"
                  >
                    <span className="truncate">&ldquo;{sticker.text}&rdquo;</span>
                    <span className="text-[10px] text-[#A87930] font-mono shrink-0">Phản biện ➔</span>
                  </button>
                ))}
              </div>

              {/* Custom rebuttal input */}
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={customRebuttalText}
                  onChange={(e) => setCustomRebuttalText(e.target.value)}
                  placeholder="Hoặc tự gõ lý lẽ toán học..."
                  disabled={isLoadingAi}
                  className="flex-1 bg-white border border-[#D8CEBC] rounded-xs px-2 py-1 text-xs font-handwriting text-[#2E2825] outline-none focus:border-[#E8A33D]"
                />
                <button
                  onClick={handleSendCustomRebuttal}
                  type="button"
                  disabled={!customRebuttalText.trim() || isLoadingAi}
                  className="px-2.5 py-1 bg-[#E8A33D] hover:bg-[#D9932B] disabled:opacity-50 text-white font-handwriting font-bold text-xs rounded-xs shadow-2xs cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            </div>
          )}

          {/* PHASE 4: BO_CONCEDED & CO_LAM_CLOSURE */}
          {(phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE') && (
            <div className="space-y-2.5 p-3 bg-[#EEF8F5] border-2 border-[#4E9B87] rounded-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <RubberStampSuccess className="scale-75" />
                <span className="font-handwriting font-bold text-xs text-[#2E6859]">
                  Bo đã hiểu &amp; Cô Lam chốt bài!
                </span>
              </div>
              <p className="font-handwriting text-xs text-[#244E41] leading-snug">
                &ldquo;{coLamClosureSpeech}&rdquo;
              </p>
              <div className="p-2 bg-white/90 rounded-xs border border-[#4E9B87]/30 text-[11px] font-mono text-[#1E5749] font-bold flex items-center gap-1.5">
                <GoldenStarIcon className="w-3.5 h-3.5 text-[#D4A328] shrink-0" />
                <span>{lesson.teacherClosure.goldenRule}</span>
              </div>
            </div>
          )}

          {/* PHASE 5: STUDENT_FREEZE WITH INTENT PICKER */}
          {phase === 'STUDENT_FREEZE' && (
            <div className="p-3 bg-[#FFF8EB] border border-[#E8A33D] rounded-xs space-y-2.5 animate-in fade-in duration-200">
              <div className="text-xs font-handwriting font-bold text-[#8C5D19] flex items-center gap-1">
                <HandStopIcon className="w-3.5 h-3.5 text-[#8C5D19]" />
                <span>Khoan đã cô ơi! (Tạm dừng theo yêu cầu của em)</span>
              </div>

              {/* Intent Picker for learner control */}
              <div>
                <label className="block text-[11px] font-handwriting text-[#6E5D4E] mb-1 font-semibold">
                  Em muốn dừng lại vì lý do gì?
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedFreezeIntent('not_understand')}
                    className={`px-2 py-1 text-[11px] font-handwriting rounded-xs border cursor-pointer ${
                      selectedFreezeIntent === 'not_understand'
                        ? 'bg-[#E8A33D] text-white font-bold border-[#C98420]'
                        : 'bg-white text-[#54483C] border-[#DED7C9] hover:bg-[#FFFDF7]'
                    }`}
                  >
                    Chưa hiểu rõ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFreezeIntent('too_fast')}
                    className={`px-2 py-1 text-[11px] font-handwriting rounded-xs border cursor-pointer ${
                      selectedFreezeIntent === 'too_fast'
                        ? 'bg-[#E8A33D] text-white font-bold border-[#C98420]'
                        : 'bg-white text-[#54483C] border-[#DED7C9] hover:bg-[#FFFDF7]'
                    }`}
                  >
                    Nói hơi nhanh
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFreezeIntent('take_notes')}
                    className={`px-2 py-1 text-[11px] font-handwriting rounded-xs border cursor-pointer ${
                      selectedFreezeIntent === 'take_notes'
                        ? 'bg-[#E8A33D] text-white font-bold border-[#C98420]'
                        : 'bg-white text-[#54483C] border-[#DED7C9] hover:bg-[#FFFDF7]'
                    }`}
                  >
                    Muốn ghi chép
                  </button>
                </div>
              </div>

              {/* Dynamic feedback based on intent */}
              <div className="p-2 bg-white/90 rounded-xs border border-[#F0D5A3] text-xs font-handwriting text-[#4E4135]">
                {selectedFreezeIntent === 'not_understand' && (
                  <p>💡 {lesson.freezeNote}</p>
                )}
                {selectedFreezeIntent === 'too_fast' && (
                  <p>⏳ &ldquo;Không sao em nhé! Em có thể tua lại thanh trượt vài giây hoặc giảm tốc độ xuống 0.75x để nghe kỹ hơn.&rdquo;</p>
                )}
                {selectedFreezeIntent === 'take_notes' && (
                  <p>📝 &ldquo;Cứ thong thả chép bài vào tập nhé. Khi nào sẵn sàng thì bấm tiếp tục để học tiếp.&rdquo;</p>
                )}
              </div>

              <button
                onClick={onDismissFreeze}
                type="button"
                className="w-full py-2 bg-[#4E9B87] hover:bg-[#3E806F] text-white font-handwriting font-bold text-xs rounded-xs cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <VideoPlayIcon className="w-3.5 h-3.5" />
                <span>Em đã hiểu rồi, tiếp tục bài giảng ➔</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Resume Button */}
      {(phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE') && (
        <div className="pt-2 border-t border-[#E8DFD0]">
          <button
            onClick={onResumeVideo}
            type="button"
            className="w-full py-2 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-sm rounded-xs shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <VideoPlayIcon className="w-4 h-4" />
            <span>Tiếp tục xem video bài giảng ➔</span>
          </button>
        </div>
      )}
    </div>
  );
};
