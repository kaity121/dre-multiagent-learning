// File: src/components/VideoDebateSheet.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
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

const ChevronDownSvg = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckMiniSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RECIPIENT_OPTIONS: { id: RecipientTarget; label: string; sublabel: string; color: string }[] = [
  { id: 'all', label: 'Cả lớp', sublabel: 'Công khai', color: '#0e7490' },
  { id: 'bo', label: 'Bo', sublabel: 'Nhắn riêng', color: '#ea580c' },
  { id: 'tri', label: 'Trí', sublabel: 'Nhắn riêng', color: '#0891b2' },
  { id: 'linhchi', label: 'Linh Chi', sublabel: 'Nhắn riêng', color: '#db2777' },
  { id: 'minhkhang', label: 'Minh Khang', sublabel: 'Nhắn riêng', color: '#0284c7' },
];

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
  learnerName?: string;
  showAllTimeline?: boolean;
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
  learnerName = 'Bạn',
  showAllTimeline = false,
}) => {
  const [liveChatMessages, setLiveChatMessages] = useState<TimelineComment[]>([]);
  const [userChatInput, setUserChatInput] = useState<string>('');
  const [recipient, setRecipient] = useState<RecipientTarget>('all');
  const [isRecipientOpen, setIsRecipientOpen] = useState(false);
  const recipientDropdownRef = useRef<HTMLDivElement | null>(null);
  const [activePeerNote, setActivePeerNote] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang' | null>(null);
  const [selectedFreezeIntent, setSelectedFreezeIntent] = useState<'not_understand' | 'too_fast' | 'take_notes'>('not_understand');
  const [taHintTier, setTaHintTier] = useState<number>(0);

  const chatStreamEndRef = useRef<HTMLDivElement | null>(null);
  const prevCommentsCountRef = useRef<number>(0);

  // Close custom recipient dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(e.target as Node)) {
        setIsRecipientOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setLiveChatMessages([]);
    setTaHintTier(0);
    setActivePeerNote(null);
    prevCommentsCountRef.current = 0;
  }, [lesson.id]);

  const [activeTab, setActiveTab] = useState<'chat' | 'transcript'>('chat');

  const defaultComments = useMemo(() => {
    return (lesson.timelineComments || []).slice().sort((a, b) => a.second - b.second);
  }, [lesson.timelineComments]);

  const unpinnedComments = useMemo(() => {
    return defaultComments.filter((c) => !c.isPinned);
  }, [defaultComments]);

  // Luồng chat hiển thị đúng theo mốc thời gian thực của video:
  // - Khi chưa chạy (currentTime = 0): Hiển thị 2 tin nhắn mở đầu (<= 35s) để lớp học có lời chào thân thiện.
  // - Khi video phát: Chỉ xuất hiện các tin nhắn đã diễn ra tới currentTime (không nhảy cóc trước tương lai).
  // - Nếu bật nút "Hiện tất cả thảo luận": Xem toàn bộ 24 tin nhắn.
  const visibleTimelineComments = useMemo(() => {
    if (showAllTimeline) return unpinnedComments;
    const threshold = Math.max(35, currentTime);
    return unpinnedComments.filter((c) => c.second <= threshold);
  }, [showAllTimeline, unpinnedComments, currentTime]);

  const allStreamComments = useMemo(() => {
    return [...visibleTimelineComments, ...liveChatMessages];
  }, [visibleTimelineComments, liveChatMessages]);
  const pinnedComment = defaultComments.find((c) => c.isPinned);

  useEffect(() => {
    if (allStreamComments.length > prevCommentsCountRef.current) {
      chatStreamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCommentsCountRef.current = allStreamComments.length;
  }, [allStreamComments.length]);

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
      author: `${learnerName || 'Bạn'}${recipientLabel}`,
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



  const [hoveredPeer, setHoveredPeer] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang' | null>(null);

  const activeCue =
    lesson.transcriptCues?.find((c) => currentTime >= c.start && currentTime <= c.end) ||
    [...(lesson.transcriptCues || [])].reverse().find((c) => currentTime >= c.start) ||
    lesson.transcriptCues?.[0];

  const peopleRoster = [
    {
      id: 'bo' as const,
      name: 'Bo',
      initial: 'B',
      avClass: 'av--na',
      status: currentTime >= 2200 ? 'nghi vấn 1+1=2' : 'gật gù',
      tagline: 'Hay nhầm lẫn & Bẫy ngộ nhận',
      speech: '“Mình hay nhầm chỗ này lắm, bạn xem hộ mình với!”',
      power: 'Bo sai trước để bạn mạnh dạn sửa bài và không sợ sai.',
      color: '#b4531a',
    },
    {
      id: 'tri' as const,
      name: 'Trí',
      initial: 'T',
      avClass: 'av--khoa',
      status: 'đào sâu',
      tagline: 'Đào sâu bản chất & Điều kiện',
      speech: '“Tại sao lại có công thức này nhỉ? Cùng mình đào sâu nhé!”',
      power: 'Xoáy sâu vào điều kiện biên & hiểu sâu nguyên lý gốc rễ.',
      color: '#2563eb',
    },
    {
      id: 'linhchi' as const,
      name: 'Linh Chi',
      initial: 'C',
      avClass: 'av--thu',
      status: 'ghi sổ tay',
      tagline: 'Ghi sổ tay & Cheat Sheet',
      speech: '“Mình đã tóm tắt công thức trọng tâm rồi, cần tra cứu cứ bảo mình!”',
      power: 'Lập bảng quy tắc chuẩn mực & cấu trúc lại các bước giải.',
      color: '#db2777',
    },
    {
      id: 'minhkhang' as const,
      name: 'M. Khang',
      initial: 'K',
      avClass: 'av--me',
      status: 'trực quan',
      tagline: 'Trực quan & Đời sống',
      speech: '“Tưởng tượng như bước đi ngoài đời thực, hình dung sẽ dễ hơn nhiều!”',
      power: 'Biến các công thức khô khan thành hình ảnh thực tế sống động.',
      color: '#0891b2',
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-white">
      {/* 1. PEOPLE ROW CHUẨN THIẾT KẾ BLU1606 (GỌN GÀNG, AVATAR TRÒN, ZERO CỒNG KỀNH) */}
      <div className="people">
        <div className="people-head flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shrink-0 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-800 truncate">
              Người tham gia: <b>4 bạn AI</b>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playPencilTap();
              setTaHintTier((prev) => (prev + 1) % 4);
            }}
            className="px-2 py-0.5 bg-[#ecfeff] hover:bg-[#cffafe] text-[#0e7490] border border-[#a5f3fc] font-semibold text-[11px] rounded-full cursor-pointer flex items-center gap-1 shrink-0"
          >
            <GentleLightbulb className="w-3 h-3 text-[#d97706]" />
            <span>Gợi ý ({taHintTier}/3)</span>
          </button>
        </div>

        {/* Dòng Onboarding 1 bước ngắn gọn */}
        <div className="px-3 pb-1 text-[10px] text-slate-500 leading-tight flex items-center gap-1">
          <span className="text-[#0e7490] font-bold shrink-0">Biệt đội 4 bạn:</span>
          <span className="truncate">Cùng vướng mắc &amp; tranh biện qua từng bài giảng</span>
        </div>

        {/* 4 Avatar tròn tinh giản, hover hiện giải mã 10s, click để nhắn riêng hoặc xem sổ tay */}
        <div className="people-row relative">
          {peopleRoster.map((p) => {
            const isSelected = recipient === p.id;
            return (
              <div
                key={p.id}
                className="relative flex-1 min-w-0"
                onMouseEnter={() => setHoveredPeer(p.id)}
                onMouseLeave={() => setHoveredPeer(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setRecipient((prev) => (prev === p.id ? 'all' : p.id));
                    setActivePeerNote((prev) => (prev === p.id ? null : p.id));
                  }}
                  className={`tile w-full transition-all cursor-pointer ${
                    isSelected ? 'bg-cyan-50/80 ring-2 ring-[#0e7490] shadow-xs' : 'hover:bg-slate-50'
                  }`}
                  title={`${p.name} (${p.tagline})`}
                >
                  <span className="tile-av">
                    <span className={`av ${p.avClass}`}>{p.initial}</span>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-white" />
                  </span>
                  <span className="tile-name truncate">{p.name}</span>
                  <span className="tile-state truncate">{p.status}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* TOOLTIP NỔI KHI HOVER VÀO TỪNG BẠN (ĐỤC TRẮNG HÀI HÒA THEO YÊU CẦU UX) */}
        {hoveredPeer && (
          <div className="mx-3 my-1.5 p-2.5 rounded-xl bg-white/95 backdrop-blur-md text-slate-800 text-xs space-y-1 shadow-lg border border-cyan-200/90 animate-in fade-in duration-100">
            {(() => {
              const hp = peopleRoster.find((x) => x.id === hoveredPeer);
              if (!hp) return null;
              return (
                <>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#0e7490] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hp.color }} />
                      <span>{hp.name} · {hp.tagline}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Bấm để nhắn riêng</span>
                  </div>
                  <p className="text-[11px] text-slate-700 italic font-medium leading-snug">
                    {hp.speech}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight pt-0.5 font-normal">
                    ⚡ {hp.power}
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* Sổ tay mở nhanh khi click vào 1 bạn (dạng whisper peek gọn gàng) */}
        {activePeerNote && !hoveredPeer && (
          <div className="whisper-peek mx-3 mb-2 animate-in fade-in duration-150">
            <span className="font-bold text-[11px]">
              Ghi chú của {peopleRoster.find((x) => x.id === activePeerNote)?.name}:
            </span>
            <span className="od-fill text-[11px] truncate">
              {activePeerNote === 'linhchi' && 'OA + AB = OB · Quy tắc hình hộp AB + AD + AA\' = AC\''}
              {activePeerNote === 'minhkhang' && 'Đi ngang 1m leo lên 1m -> đường chéo căn(1² + 1²) = √2m'}
              {activePeerNote === 'tri' && 'Cần kiểm tra cùng phương trước khi xét cùng/ngược hướng'}
              {activePeerNote === 'bo' && '|a + b| chỉ bằng |a| + |b| khi cùng hướng!'}
            </span>
            <button
              type="button"
              onClick={() => setActivePeerNote(null)}
              className="font-bold text-[11px] cursor-pointer text-slate-500 hover:text-black"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. TABS CHUẨN BLU1606: LỚP HỌC · TRANSCRIPT */}
      <div className="tabs" role="tablist">
        <button
          type="button"
          className="tab"
          aria-selected={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        >
          Lớp học
        </button>
        <button
          type="button"
          className="tab"
          aria-selected={activeTab === 'transcript'}
          onClick={() => setActiveTab('transcript')}
        >
          Transcript
        </button>
      </div>

      {/* 3. NỘI DUNG PANEL: CHAT HOẶC TRANSCRIPT */}
      {activeTab === 'transcript' ? (
        <div className="transcript flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
          {lesson.transcriptCues?.map((cue, idx) => {
            const isCurrent = currentTime >= cue.start && currentTime <= cue.end;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSeekVideo?.(cue.start)}
                className={`tline w-full text-left p-2 rounded-lg transition-colors flex items-start gap-2.5 cursor-pointer ${
                  isCurrent ? 'bg-cyan-50 font-semibold text-cyan-900 border border-cyan-200' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="ts shrink-0 text-xs font-mono">{formatSec(cue.start)}</span>
                <span className="text-xs leading-relaxed">{cleanText(cue.text)}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Ghim Trợ giảng An nhỏ gọn, không chiếm diện tích */}
          {pinnedComment && (
            <div className="mx-3 mt-2 p-2 rounded-lg bg-[#0e7490] text-white shrink-0 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-cyan-200">
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 font-extrabold">Ghim</span>
                <span>{pinnedComment.author} · {formatSec(pinnedComment.second)}</span>
              </div>
              <p className="leading-snug text-white/95">{cleanText(pinnedComment.text)}</p>
              {taHintTier > 0 && (
                <div className="mt-1 p-1.5 bg-white text-slate-800 rounded font-medium text-[11px]">
                  {taHintTier === 1 && "Gợi ý 1: Kiểm tra điểm cuối của BC và điểm đầu của DD' đã nối tiếp chưa."}
                  {taHintTier === 2 && `Gợi ý 2: ${cleanText(lesson.freezeNote)}`}
                  {taHintTier === 3 && "Gợi ý 3: Thay DD' = CC' thì BC + CC' = BC' (đường chéo bằng √2)."}
                </div>
              )}
            </div>
          )}

          {/* Luồng tin nhắn chat */}
          <div className="chat flex-1 overflow-y-auto no-scrollbar p-3 space-y-2 select-text">
            {allStreamComments.map((msg) => {
              const isBo = msg.author.includes('Bo');
              const isMe = msg.author.includes('Bạn');
              const isChi = msg.author.includes('Linh Chi');
              const isKhang = msg.author.includes('Khang');
              const isTri = msg.author.includes('Trí');
              const isAn = msg.author.includes('An');

              const avColor = isBo
                ? 'av--na'
                : isMe
                ? 'av--me'
                : isChi
                ? 'av--thu'
                : isKhang
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : isAn
                ? 'bg-cyan-600 text-white'
                : 'av--khoa';

              const isNearCurrentTime = Math.abs(currentTime - msg.second) <= 20;

              return (
                <div
                  key={msg.id}
                  className={`msg transition-colors rounded-lg p-1.5 ${
                    isNearCurrentTime ? 'bg-cyan-50/70 ring-1 ring-cyan-200/60' : ''
                  }`}
                >
                  <span className={`av av--sm ${avColor}`}>
                    {msg.author.charAt(0)}
                  </span>
                  <div className="msg-main">
                    <div className="msg-head">
                      <span
                        className={`msg-who ${
                          isBo
                            ? 'text-[#b4531a]'
                            : isChi
                            ? 'text-[#9d174d]'
                            : isKhang
                            ? 'text-[#b45309]'
                            : isTri
                            ? 'text-[#0369a1]'
                            : 'text-[#111827]'
                        }`}
                      >
                        {msg.author}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSeekVideo?.(msg.second)}
                        className="ts"
                        title={`Tua video tới ${formatSec(msg.second)}`}
                      >
                        {formatSec(msg.second)}
                      </button>
                    </div>
                    <div className="msg-body">{cleanText(msg.text)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={chatStreamEndRef} />
          </div>
        </div>
      )}

      {/* 4. THẺ CÂU HỎI ĐANG CHỜ THU GỌN TRONG LUỒNG CHAT (KHI BẤM [THU XUỐNG CHAT · XEM VIDEO]) */}
      {isQuizCollapsedToChat && (
        <div className="my-1.5 p-3 rounded-xl bg-cyan-50/70 border-2 border-[#0e7490] space-y-2 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#0e7490] flex items-center gap-1.5">
              <ClockBadgeSvg className="w-3.5 h-3.5 text-[#0e7490]" />
              <span>Câu hỏi dừng [{formatSec(lesson.checkpointTimestamp)}]</span>
            </span>
            <button
              type="button"
              onClick={onExpandQuizBackToVideo}
              className="px-2.5 py-1 rounded-lg bg-[#0e7490] hover:bg-[#0891b2] text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <ExpandBackToVideoSvg className="w-3 h-3 text-white" />
              <span>Mở rộng trên Video</span>
            </button>
          </div>
          <p className="text-xs font-bold text-slate-900 leading-snug">
            {cleanText(lesson.checkpointQuestion.prompt)}
          </p>
          <div className="space-y-1.5">
            {lesson.checkpointQuestion.options.map((opt, idx) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onAnswerCheckpoint(cleanText(opt.label));
                  onExpandQuizBackToVideo?.();
                }}
                className="w-full p-2 rounded-lg bg-white hover:bg-cyan-100/70 border border-cyan-200 text-left text-[11px] font-medium text-slate-800 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs group"
              >
                <span className="w-4 h-4 rounded bg-[#0e7490] group-hover:bg-[#0891b2] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors">
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
              <span style={{ color: '#92400E' }}>Hỗ trợ tại [{formatSec(currentTime)}]</span>
            </span>
            <button
              type="button"
              onClick={onDismissFreeze}
              className="font-bold text-xs cursor-pointer px-1.5 py-0.5 rounded hover:bg-amber-100"
              style={{ color: '#92400E' }}
            >
              Đóng ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {([
              { id: 'not_understand', label: 'Giải thích' },
              { id: 'take_notes', label: 'Công thức' },
              { id: 'too_fast', label: 'Lùi 10s' },
            ] as const).map((item) => {
              const isSelected = selectedFreezeIntent === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedFreezeIntent(item.id);
                    if (item.id === 'too_fast') onSeekVideo?.(Math.max(0, currentTime - 10));
                  }}
                  className="py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all shadow-2xs"
                  style={
                    isSelected
                      ? { color: '#ffffff', backgroundColor: '#0f172a', borderColor: '#0f172a' }
                      : { color: '#1e293b', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-[#1E242B] bg-white p-2.5 rounded-lg border border-[#EFE8DC] leading-relaxed font-medium">
            {selectedFreezeIntent === 'not_understand' && cleanText(activeCue?.minhKhangAnalogy || lesson.freezeNote)}
            {selectedFreezeIntent === 'take_notes' && cleanText(activeCue?.linhChiNote || activeCue?.text)}
            {selectedFreezeIntent === 'too_fast' && `Đã lùi video về mốc [${formatSec(Math.max(0, currentTime - 10))}] để bạn nghe lại.`}
          </p>
        </div>
      )}

      {/* 6. BỘ GÕ COMPOSER ĐA NĂNG (CHỌN NGƯỜI NHẬN TÙY BIẾN + BADGE THỜI GIAN + PILL HỎI NHANH) */}
      <div className="pt-2 space-y-2 shrink-0">
        {/* Dải Pill câu hỏi gợi ý nhanh (cuộn ngang mượt mà, font nhỏ gọn đồng bộ) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            'Chưa hiểu đoạn này',
            "Tại sao đổi DD' = CC'?",
            'Khi nào dùng quy tắc hiệu?'
          ].map((quickPrompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendUserChatMessage(quickPrompt)}
              className="quick-prompt-pill border border-slate-200/90 bg-slate-50/90 hover:bg-cyan-50 hover:border-cyan-300 text-slate-700 hover:text-[#0e7490] whitespace-nowrap shrink-0 cursor-pointer transition-all shadow-2xs"
            >
              {quickPrompt}
            </button>
          ))}
        </div>

        {/* Thanh chọn người nhận tùy biến (Custom Dropdown đẹp mắt) + Mốc thời gian thực */}
        <div className="flex items-center justify-between text-xs text-slate-700 px-0.5 font-medium relative">
          <div className="flex items-center gap-1.5" ref={recipientDropdownRef}>
            <span className="text-slate-600 font-semibold text-xs shrink-0">Gửi tới:</span>

            <div className="relative">
              {(() => {
                const currentOpt = RECIPIENT_OPTIONS.find((r) => r.id === recipient) || RECIPIENT_OPTIONS[0];
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRecipientOpen((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isRecipientOpen
                          ? 'bg-cyan-50 border-[#0e7490] text-[#0e7490] ring-1 ring-[#0e7490]'
                          : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: currentOpt.color }}
                      />
                      <span>{currentOpt.label}</span>
                      {currentOpt.id !== 'all' && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({currentOpt.sublabel})
                        </span>
                      )}
                      <ChevronDownSvg
                        className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                          isRecipientOpen ? 'rotate-180 text-[#0e7490]' : ''
                        }`}
                      />
                    </button>

                    {/* POPUP MENU TÙY BIẾN (KHÔNG BỊ XANH DƯƠNG WINDOWS, BO GÓC TRÒN XỊN XÒ) */}
                    {isRecipientOpen && (
                      <div className="absolute bottom-full mb-1.5 left-0 z-40 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-1.5 min-w-[200px] space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-100">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                          Chọn đối tượng gửi
                        </div>
                        {RECIPIENT_OPTIONS.map((opt) => {
                          const isSelected = recipient === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                sound.playPencilTap();
                                setRecipient(opt.id);
                                setIsRecipientOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-cyan-50/90 text-[#0e7490] font-bold border border-cyan-200 shadow-2xs'
                                  : 'hover:bg-slate-50 text-slate-700 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: opt.color }}
                                />
                                <span className="truncate">{opt.label}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({opt.sublabel})
                                </span>
                              </div>
                              {isSelected && (
                                <CheckMiniSvg className="w-3.5 h-3.5 text-[#0e7490] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg border border-cyan-200 bg-cyan-50/70 text-[#0e7490] shadow-2xs">
            <ClockBadgeSvg className="w-3 h-3 text-[#0e7490]" />
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
                : `Nhắn riêng cho ${peopleRoster.find((p) => p.id === recipient)?.name || 'bạn học'}...`
            }
            className="flex-1 border border-slate-300 focus:border-[#0e7490] focus:ring-1 focus:ring-[#0e7490] rounded-xl px-3 py-2 text-xs font-medium outline-none bg-white text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all"
          />
          <button
            onClick={() => handleSendUserChatMessage()}
            type="button"
            className="px-4 py-2 font-bold text-xs rounded-xl cursor-pointer transition-all bg-[#0e7490] hover:bg-[#0891b2] text-white shadow-xs flex items-center justify-center shrink-0"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};
