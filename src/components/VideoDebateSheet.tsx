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
import { FormattedMathText } from './MathVector';
import { ChatSavedQuizBlock } from './ChatSavedQuizBlock';
import { sound } from '../utils/soundEffects';
import { sendClassroomChat } from '../services/dreBackendApi';

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

const MaximizeSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MinimizeSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 14h6v6M20 10h-6V4M10 14l-7 7M14 10l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SendArrowSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type RecipientTarget = 'all' | 'bo' | 'tri' | 'linhchi' | 'minhkhang' | 'an' | 'colam';

const RECIPIENT_OPTIONS: { id: RecipientTarget; label: string; sublabel: string; color: string }[] = [
  { id: 'all', label: 'Cả lớp', sublabel: 'Công khai', color: '#0e7490' },
  { id: 'bo', label: 'Bo', sublabel: 'Bẫy ngộ nhận', color: '#b45309' },
  { id: 'tri', label: 'Trí', sublabel: 'Đào sâu bản chất', color: '#1d4ed8' },
  { id: 'linhchi', label: 'Linh Chi', sublabel: 'Sổ tay công thức', color: '#059669' },
  { id: 'minhkhang', label: 'Minh Khang', sublabel: 'Trực quan đời sống', color: '#7c3aed' },
  { id: 'an', label: 'Trợ giảng An', sublabel: 'Gợi ý giải bài', color: '#0f766e' },
  { id: 'colam', label: 'Cô Lam', sublabel: 'Giáo viên chủ trì', color: '#991b1b' },
];

// Helper render badges cho RAG & Deterministic Tools
const renderToolBadges = (toolCalls?: any[] | null, singleToolCall?: any | null) => {
  const list = toolCalls && toolCalls.length > 0 ? toolCalls : singleToolCall ? [singleToolCall] : [];
  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      {list.map((tc, i) => {
        const isRag = tc.category === 'rag' || tc.toolName?.includes('kb');
        const isBloom = tc.category === 'bloom' || tc.toolName?.includes('bloom');
        
        let bg = 'bg-blue-50 border-blue-200 text-blue-800';
        let dot = 'bg-blue-600';
        let icon = '📐';

        if (isRag) {
          bg = 'bg-purple-50 border-purple-200 text-purple-800';
          dot = 'bg-purple-600';
          icon = '📚';
        } else if (isBloom) {
          bg = 'bg-amber-50 border-amber-200 text-amber-800';
          dot = 'bg-amber-600';
          icon = '🎯';
        }

        return (
          <div
            key={i}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-semibold shadow-2xs ${bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
            <span>{icon} {tc.badgeText || tc.label}</span>
          </div>
        );
      })}
    </div>
  );
};

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
  isQuizSkipped?: boolean;
  onSetQuizSkipped?: (skipped: boolean) => void;
  savedSelectedOptionId?: string | null;
  onSetSavedSelectedOptionId?: (optId: string | null) => void;
  onExpandQuizBackToVideo?: () => void;
  externalQuestionTrigger?: { id: number; text: string } | null;
  onSeekVideo?: (second: number) => void;
  onAnswerCheckpoint: (answerText: string, optionId?: string) => void;
  onSubmitRebuttal: (rebuttalText: string, isEffective: boolean) => void;
  onResumeVideo: () => void;
  onDismissFreeze: () => void;
  onSkipCheckpoint?: () => void;
  learnerName?: string;
  showAllTimeline?: boolean;
  chatFocusRequest?: { id: number; prefix: string } | null;
  isChatExpanded?: boolean;
  onToggleChatExpanded?: () => void;
  onSwitchToStation2?: () => void;
}

const cleanText = (str?: string) =>
  str
    ? str
        .replace(/d6c2([A-Za-z0-9'′]+)/gi, 'vectơ $1')
        .replace(/d6c2/gi, 'vectơ ')
        .replace(/\u20d7/g, '')
        .replace(/📌|📝|🔍|😂|🤔|🟢|🌸|🧒|👓|⚡/g, '')
        .trim()
    : '';

interface TypingAgentInfo {
  name: string;
  avatarBg: string;
  initial: string;
  text: string;
}

const getAgentMeta = (author: string): TypingAgentInfo => {
  if (author.includes('Bo')) {
    return { name: 'Bo', avatarBg: 'bg-[#D97706]', initial: 'B', text: 'Bo đang suy nghĩ & soạn tin...' };
  }
  if (author.includes('Trí')) {
    return { name: 'Trí', avatarBg: 'bg-[#2563EB]', initial: 'T', text: 'Trí đang suy luận & soạn tin...' };
  }
  if (author.includes('Linh Chi')) {
    return { name: 'Linh Chi', avatarBg: 'bg-[#059669]', initial: 'L', text: 'Linh Chi đang tra sổ tay & soạn tin...' };
  }
  if (author.includes('Cô Lam')) {
    return { name: 'Cô Lam', avatarBg: 'bg-[#9333EA]', initial: 'L', text: 'Cô Lam đang chuẩn bị dặn dò & chốt bài...' };
  }
  if (author.includes('Trợ giảng') || author.includes('An')) {
    return { name: 'Trợ giảng An', avatarBg: 'bg-[#047857]', initial: 'A', text: 'Trợ giảng An đang soạn gợi ý...' };
  }
  return { name: 'Minh Khang', avatarBg: 'bg-[#DC2626]', initial: 'K', text: 'Minh Khang đang liên hệ thực tế & soạn tin...' };
};

export const VideoDebateSheet: React.FC<VideoDebateSheetProps> = ({
  lesson,
  phase,
  currentTime = 0,
  isQuizCollapsedToChat = false,
  isQuizSkipped = false,
  onSetQuizSkipped,
  savedSelectedOptionId,
  onSetSavedSelectedOptionId,
  onExpandQuizBackToVideo,
  externalQuestionTrigger,
  onSeekVideo,
  onAnswerCheckpoint,
  onDismissFreeze,
  onSkipCheckpoint,
  learnerName = 'Bạn',
  showAllTimeline = false,
  chatFocusRequest,
  isChatExpanded = false,
  onToggleChatExpanded,
  onSwitchToStation2,
}) => {
  const [liveChatMessages, setLiveChatMessages] = useState<TimelineComment[]>([]);
  const [toolCallThinking, setToolCallThinking] = useState<string[]>([]);
  const [userChatInput, setUserChatInput] = useState<string>('');
  const [recipient, setRecipient] = useState<RecipientTarget>('all');
  const [replyingToComment, setReplyingToComment] = useState<TimelineComment | null>(null);
  const [typingAgent, setTypingAgent] = useState<TypingAgentInfo | null>(null);
  const [isRecipientOpen, setIsRecipientOpen] = useState(false);
  const recipientDropdownRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const activeTranscriptCueRef = useRef<HTMLButtonElement | null>(null);
  const [isComposerHighlighted, setIsComposerHighlighted] = useState(false);
  const [activePeerNote, setActivePeerNote] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang' | null>(null);
  const [selectedFreezeIntent, setSelectedFreezeIntent] = useState<'not_understand' | 'too_fast' | 'take_notes'>('not_understand');
  const [taHintTier, setTaHintTier] = useState<number>(0);
  const [isRosterCollapsed, setIsRosterCollapsed] = useState<boolean>(false);

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
    setReplyingToComment(null);
    setTypingAgent(null);
    prevCommentsCountRef.current = 0;
  }, [lesson.id]);

  const [activeTab, setActiveTab] = useState<'chat' | 'transcript'>('chat');

  const defaultComments = useMemo(() => {
    return (lesson.timelineComments || []).slice().sort((a, b) => a.second - b.second);
  }, [lesson.timelineComments]);

  const unpinnedComments = useMemo(() => {
    return defaultComments.filter((c) => !c.isPinned);
  }, [defaultComments]);

  // Luồng tin nhắn chat nảy ra chuẩn xác theo tiến độ video thời gian thực (currentTime):
  // - Khi mới vào lớp / chưa bấm phát video (currentTime <= 0): Tuyệt đối KHÔNG hiện tin nhắn tương lai,
  //   chỉ hiển thị tin ghim mở đầu của Trợ giảng An và thông điệp rỗng hướng dẫn bấm Play.
  // - Khi bắt đầu bật video chạy: Video chạy đến đúng mốc giây nào (>= 8s, 22s...) thì tin nhắn tương ứng mới nảy lên luồng chat.
  const progressiveComments = useMemo(() => {
    if (!currentTime || currentTime <= 0) return [];
    return unpinnedComments.filter((c) => c.second <= currentTime);
  }, [unpinnedComments, currentTime]);

  const visibleTimelineComments = showAllTimeline ? unpinnedComments : progressiveComments;

  const allStreamComments = useMemo(() => {
    const combined = [...visibleTimelineComments, ...liveChatMessages];
    // Sắp xếp tin nhắn theo tiến trình thời gian video: mốc giây nhỏ hơn nằm trên, mốc giây lớn hơn nằm dưới
    return combined.slice().sort((a, b) => {
      if (a.second !== b.second) {
        return a.second - b.second;
      }
      return 0; // Giữ nguyên thứ tự nếu cùng mốc giây (tin nhắn của Bạn trước, AI trả lời sau)
    });
  }, [visibleTimelineComments, liveChatMessages]);
  const pinnedComment = defaultComments.find((c) => c.isPinned);

  // Mốc giây kết thúc bài học được cấu hình trong JSON (lesson.lectureEndSecond, mặc định 9503 = 2:38:23)
  const endSecond = lesson.lectureEndSecond ?? 9503;

  // Xác định khi nào hết video bài giảng theo đúng mốc giây cấu hình trong JSON:
  // - Tuyệt đối không bật khi mới tải trang hoặc chưa phát video (currentTime <= 0)
  // - Tuyệt đối không bật trước mốc kết thúc 2:38:23 (9503 giây)
  // - Chỉ bật khi video thực sự chạy tới đúng mốc giây kết thúc bài quy định trong JSON (currentTime >= endSecond)
  const isLectureEnded = useMemo(() => {
    if (!currentTime || currentTime <= 0) return false;
    return currentTime >= endSecond;
  }, [currentTime, endSecond]);

  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number | null>(null);
  const redirectedOnceRef = useRef<boolean>(false);

  useEffect(() => {
    if (isLectureEnded && !redirectedOnceRef.current) {
      setTimeout(() => {
        chatStreamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);

      setAutoRedirectCountdown(3);
      const timer = setInterval(() => {
        setAutoRedirectCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            redirectedOnceRef.current = true;
            sound.playPageFlip();
            onSwitchToStation2?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (!isLectureEnded) {
      redirectedOnceRef.current = false;
      setAutoRedirectCountdown(null);
    }
  }, [isLectureEnded, onSwitchToStation2]);

  useEffect(() => {
    if (allStreamComments.length > prevCommentsCountRef.current || isLectureEnded || typingAgent) {
      chatStreamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCommentsCountRef.current = allStreamComments.length;
  }, [allStreamComments.length, isLectureEnded, typingAgent]);

  // Nhận câu hỏi từ Modal Giơ tay bên Video gửi sang
  useEffect(() => {
    if (externalQuestionTrigger && externalQuestionTrigger.text) {
      handleSendUserChatMessage(externalQuestionTrigger.text, 'all');
    }
  }, [externalQuestionTrigger?.id]);

  // Luồng Giơ tay hợp nhất: Tự động focus vào ô chat và điền tiền tố ngữ cảnh [Tại mm:ss]
  useEffect(() => {
    if (chatFocusRequest) {
      setActiveTab('chat');
      setUserChatInput((prev) => {
        if (!prev) return chatFocusRequest.prefix;
        if (prev.startsWith('[Tại')) {
          return prev.replace(/^\[Tại\s+[^\]]+\]\s*/, chatFocusRequest.prefix);
        }
        return `${chatFocusRequest.prefix}${prev}`;
      });
      setIsComposerHighlighted(true);
      setTimeout(() => {
        chatInputRef.current?.focus();
        const len = chatInputRef.current?.value.length || 0;
        chatInputRef.current?.setSelectionRange(len, len);
      }, 60);
      const timer = setTimeout(() => setIsComposerHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [chatFocusRequest?.id]);

  // Tự động cuộn theo tiến độ bài giảng khi mở tab Bản chép lời
  useEffect(() => {
    if (activeTab === 'transcript') {
      activeTranscriptCueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentTime, activeTab]);

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

    const currentReplyTo = replyingToComment
      ? {
          id: replyingToComment.id,
          author: replyingToComment.author,
          text: replyingToComment.text,
        }
      : null;

    const newMsg: TimelineComment = {
      id: `user_${Date.now()}`,
      second: currentTime,
      author: `${learnerName || 'Bạn'}${recipientLabel}`,
      role: 'classmate',
      text,
      replyTo: currentReplyTo,
    };

    setLiveChatMessages((prev) => [...prev, newMsg]);
    if (!overrideText) setUserChatInput('');
    setReplyingToComment(null);

    const lower = text.toLowerCase();
    let replyAuthor = 'Trí';
    let replyText = '';

    const isOffTopic =
      lower.includes('quả bóng vàng') ||
      lower.includes('qua bong vang') ||
      lower.includes('ballon') ||
      lower.includes('bóng đá') ||
      lower.includes('bong da') ||
      lower.includes('ronaldo') ||
      lower.includes('messi') ||
      lower.includes('bellingham') ||
      lower.includes('vinicius') ||
      lower.includes('mbappe') ||
      lower.includes('champions league') ||
      lower.includes('ngoại hạng anh') ||
      lower.includes('chính trị') ||
      lower.includes('tổng thống') ||
      lower.includes('trump') ||
      lower.includes('biden') ||
      lower.includes('game') ||
      lower.includes('liên quân');

    const isSumTrap =
      lower.includes('1 + 1') ||
      lower.includes('1+1') ||
      lower.includes('chân lý') ||
      lower.includes('chan ly') ||
      lower.includes('không bằng') ||
      lower.includes('ko bằng') ||
      lower.includes('k bằng') ||
      lower.includes('khong bang') ||
      lower.includes('tổng 2') ||
      lower.includes('tong 2') ||
      lower.includes('tổng hai') ||
      lower.includes('bằng 2') ||
      lower.includes('bằng 1') ||
      lower.includes('bang 1') ||
      lower.includes('bang 2') ||
      lower.includes('tách') ||
      lower.includes('tach') ||
      lower.includes('gạch bỏ') ||
      lower.includes('gach bo') ||
      lower.includes('gạch') ||
      lower.includes('bc + dd') ||
      (lower.includes('tại sao') && (lower.includes('tổng') || lower.includes('độ dài') || lower.includes('vectơ') || lower.includes('vector') || lower.includes('1') || lower.includes('2')));

    const isLineOfVector =
      lower.includes('giá là') ||
      lower.includes('gia la') ||
      lower.includes('giá của') ||
      lower.includes('gia cua') ||
      lower.includes('sao gọi là giá') ||
      lower.includes('sao lai goi la gia') ||
      lower.includes('giá đỗ') ||
      lower.includes('gia do') ||
      (lower.includes('giá') && (lower.includes('vecto') || lower.includes('vector') || lower.includes('độ dài') || lower.includes('giá trị')));

    const isWhyNeedVectors =
      lower.includes('đoạn thẳng cho khỏe') ||
      lower.includes('doan thang cho khoe') ||
      lower.includes('dùng vector làm gì') ||
      lower.includes('dung vector lam gi') ||
      lower.includes('dùng vecto làm gì') ||
      lower.includes('dung vecto lam gi') ||
      lower.includes('học lại đâu có gì mới') ||
      lower.includes('hoc lai dau co gi moi') ||
      lower.includes('khác gì với bài cũ') ||
      lower.includes('khac gi voi bai cu');

    const isZeroVector =
      lower.includes('đâu phải là 0') ||
      lower.includes('dau phai la 0') ||
      lower.includes('chứ đâu phải là 0') ||
      lower.includes('chu dau phai la 0') ||
      lower.includes('sao lại là 0') ||
      lower.includes('sao lai la 0') ||
      lower.includes('sao lại bằng 0') ||
      lower.includes('sao lai bang 0') ||
      (lower.includes('về a') && lower.includes('đoạn')) ||
      (lower.includes('ve a') && lower.includes('doan')) ||
      (lower.includes('trường') && lower.includes('về nhà')) ||
      (lower.includes('truong') && lower.includes('ve nha')) ||
      (lower.includes('quãng đường') && lower.includes('0')) ||
      (lower.includes('quang duong') && lower.includes('0'));

    const isDistracted =
      lower.includes('đi chơi') ||
      lower.includes('di choi') ||
      lower.includes('học hành gì') ||
      lower.includes('hoc hanh gi') ||
      lower.includes('nghỉ thôi') ||
      lower.includes('nghi thoi') ||
      lower.includes('chán quá') ||
      lower.includes('chan qua') ||
      lower.includes('lười') ||
      lower.includes('luoi') ||
      lower.includes('bỏ học') ||
      lower.includes('bo hoc') ||
      lower.includes('không học nữa') ||
      lower.includes('khong hoc nua');

    const isVectorEquality =
      lower.includes('ab ba') ||
      lower.includes('ba ab') ||
      lower.includes('vecto ab') ||
      lower.includes('vector ab') ||
      lower.includes('vectơ ab') ||
      lower.includes('ab = ba') ||
      lower.includes('ab bằng ba') ||
      lower.includes('ab bang ba') ||
      lower.includes('đoạn thẳng ab') ||
      lower.includes('doan thang ab') ||
      lower.includes('quãng đường cũng chừng đó') ||
      lower.includes('quang duong') ||
      lower.includes('giống hệt nhau') ||
      lower.includes('giong het nhau') ||
      lower.includes('bằng nhau y như vậy') ||
      lower.includes('bang nhau y nhu vay') ||
      (lower.includes('ab') && lower.includes('ba') && (lower.includes('giống') || lower.includes('giong') || lower.includes('bằng') || lower.includes('bang') || lower.includes('một') || lower.includes('mot')));

    const isTrivializingOrBored =
      lower.includes('quan trọng gì đâu') ||
      lower.includes('quan trong gi dau') ||
      lower.includes('có gì đâu mà') ||
      lower.includes('co gi dau ma') ||
      lower.includes('đơn giản quá') ||
      lower.includes('don gian qua') ||
      lower.includes('dễ quá') ||
      lower.includes('de qua') ||
      lower.includes('giống hệt thôi') ||
      lower.includes('giong het thoi') ||
      lower.includes('giống hệt lớp 10') ||
      lower.includes('giong het lop 10');

    if (isOffTopic) {
      replyAuthor = 'Minh Khang';
      const isBallon = lower.includes('quả bóng vàng') || lower.includes('qua bong vang') || lower.includes('ballon');
      replyText = isBallon
        ? 'À về Quả Bóng Vàng thì làng túc cầu vẫn luôn tranh luận sôi nổi giữa các siêu sao như Bellingham, Vinicius, Mbappe hay Rodri... Nhưng mà cậu ơi! Trận cầu đinh lúc này là bài giảng Vectơ không gian của Thầy Tiến kìa! Cùng tập trung xem tiếp ví dụ của Thầy Tiến để không bị "thủng lưới" trong bài kiểm tra nhé!'
        : 'Chủ đề này nghe thú vị ghê! Nhưng tụi mình đang trong tiết học trực tiếp của Thầy Tiến nè, bài này nhiều bẫy lắm, ráng tập trung theo dõi nốt ví dụ rồi lát nữa tha hồ bàn luận nhé bạn!';
    } else if (isSumTrap) {
      if (target === 'bo' || lower.includes('@bo')) {
        replyAuthor = 'Bo';
        replyText = 'Ủa... lúc đầu tớ cũng nghĩ 1 + 1 = 2 là chân lý hiển nhiên thì cứ thế mà cộng độ dài cho lẹ! Ai ngờ bị Thầy Tiến gạch bỏ cái rụp... Cậu nghe Trí giải thích lý do này:';
      } else {
        replyAuthor = 'Trí';
        replyText =
          'Trong số học thông thường thì 1 + 1 = 2 đúng là chân lý! Nhưng trong VECTƠ, Thầy Tiến gạch bỏ biểu thức |BC + DD\'| = 1 + 1 = 2 vì độ dài của tổng KHÔNG ĐƯỢC tách tuỳ tiện thành tổng hai độ dài:\nTheo bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng "chân lý" đó CHỈ XẢY RA KHI hai vectơ a và b CÙNG HƯỚNG!\nTrong Ví dụ 3, BC và DD\' vuông góc nhau trong không gian. Muốn tính độ dài, bắt buộc phải thay DD\' = CC\' để nối tiếp thành BC + CC\' = BC\', sau đó áp dụng định lý Pytago tính đường chéo mặt bên: |BC\'| = √(1² + 1²) = √2 (khoảng 1.41) chứ tuyệt đối không thể bằng 2 được bạn nhé!';
      }
    } else if (isLineOfVector) {
      if (lower.includes('giá đỗ') || lower.includes('gia do')) {
        replyAuthor = 'Bo';
        replyText = 'Haha giá đỗ xào thịt bò thì ngon chứ trong hình học không có giá đỗ đâu nha bạn ơi! 😂 Tớ từng bị Thầy Tiến nhắc nhở chỗ này nè:';
      } else {
        replyAuthor = 'Trí';
        replyText =
          'Nhầm to rồi bạn ơi! Trong toán học, "GIÁ" của vectơ KHÔNG PHẢI là "giá trị" đại số và cũng KHÔNG PHẢI là "độ dài" của vectơ!\nĐịnh nghĩa chuẩn của SGK nè: Giá của vectơ AB là ĐƯỜNG THẲNG đi qua hai điểm A và B (đường thẳng mang vectơ đó). Đường thẳng này kéo dài vô tận về hai phía, còn vectơ AB chỉ là một đoạn thẳng có hướng nằm trên đường thẳng đó thôi bạn nhé!';
      }
    } else if (isWhyNeedVectors) {
      replyAuthor = 'Trí';
      replyText =
        'Câu hỏi rất thực tế! Nếu chỉ dùng đoạn thẳng, bạn chỉ biết khoảng cách giữa hai điểm nhưng hoàn toàn KHÔNG BIẾT hướng chuyển động hay lực tác dụng: Đi từ Hà Nội vào Đà Nẵng khác hẳn bay ngược lại dù đoạn thẳng như nhau.\nĐặc biệt trong không gian 3D, vật thể có thêm chiều cao (trục Oz). Vectơ chính là công cụ duy nhất giúp định vị chính xác độ dời, lực đẩy động cơ hay quỹ đạo máy bay trong không gian 3 chiều mà đoạn thẳng vô hướng không thể làm được!';
    } else if (isZeroVector) {
      replyAuthor = 'Trí';
      replyText =
        'Câu hỏi của bạn cực kỳ sắc sảo và chạm đúng bản chất vật lý! Bạn cần phân biệt rạch ròi giữa QUÃNG ĐƯỜNG và ĐỘ DỜI (vectơ):\n1. Về QUÃNG ĐƯỜNG (vô hướng): Khi bạn đi từ Nhà (A) đến Trường (B) rồi từ Trường về Nhà (A), đồng hồ xe vẫn đo được độ dài đã đi (quãng đường s = |AB| + |BA| > 0).\n2. Nhưng về ĐỘ DỜI (vectơ): Vectơ chỉ quan tâm đến vị trí điểm đầu và điểm cuối! Điểm xuất phát là Nhà (A), điểm kết thúc cũng là Nhà (A). Vectơ tổng là vectơ AB + vectơ BA = vectơ AA = vectơ 0! Vectơ-không ở đây cho thấy sau cả hành trình khép kín, vị trí tổng thể của bạn không hề bị dịch chuyển so với ban đầu!';
    } else if (isDistracted) {
      if (target === 'bo' || lower.includes('bo') || lower.includes('@bo')) {
        replyAuthor = 'Bo';
        replyText =
          'Haha nghe rủ đi chơi tớ cũng ham lắm! Nhưng thôi chết, bài này Thầy Tiến bảo là trọng tâm thi THPT Quốc Gia đó, trốn học là lát nữa làm bài tập toang liền. Ráng ở lại học nốt bài này với tớ đi cậu!';
      } else {
        replyAuthor = 'Minh Khang';
        replyText =
          'Khoan đi chơi bạn ơi! Tưởng tượng vectơ như lực đẩy động cơ máy bay vậy, nắm được hướng và độ lớn là giải quyết bài toán mượt mà ngay. Cố gắng theo dõi nốt ví dụ của Thầy Tiến rồi tụi mình xả hơi sau cũng chưa muộn mà!';
      }
    } else if (isVectorEquality) {
      if (target === 'bo' || lower.includes('@bo')) {
        replyAuthor = 'Bo';
        replyText =
          "Ủa... lúc đầu tớ cũng nghĩ hệt như cậu đó! Thấy A với B cố định thì đoạn thẳng AB với BA bằng nhau, nên tưởng vectơ AB với BA cũng bằng nhau luôn cho tiện. Ai dè bị Trí với Thầy Tiến 'bắt bài' liền: Vectơ là đoạn thẳng CÓ HƯỚNG! Cậu nghe Trí giải thích bản chất này:";
      } else {
        replyAuthor = 'Trí';
        replyText =
          'Khoan đã bạn ơi, nhầm to rồi nhé! Đoạn thẳng AB và BA là một vì đoạn thẳng không phân biệt thứ tự (quãng đường |AB| = |BA|). Nhưng VECTƠ là đoạn thẳng CÓ HƯỚNG! Vectơ AB có gốc là A, ngọn là B; còn vectơ BA có gốc là B, ngọn là A. Hai vectơ này NGƯỢC HƯỚNG nhau (vectơ AB = - vectơ BA), nên vectơ AB ≠ vectơ BA bạn nhé!';
      }
    } else if (isTrivializingOrBored) {
      replyAuthor = 'Trí';
      replyText =
        'Bạn thấy giống lớp 10 nên nghĩ nó đơn giản đúng không? Vậy tớ đố bạn câu này để xem không gian 3D khác biệt thế nào nhé: Trong 2D hai đường thẳng không cắt nhau thì song song. Nhưng trong không gian 3D căn phòng bạn ngồi, hai đường thẳng CHÉO NHAU (không song song, không cắt nhau) thì góc giữa hai vectơ của chúng được tính thế nào? Và liệu hai vectơ có thể VUÔNG GÓC dù không bao giờ chạm nhau không?';
    } else if (target === 'bo' || lower.includes('bo') || lower.includes('@bo')) {
      replyAuthor = 'Bo';
      replyText =
        currentTime >= 1800
          ? (cleanText(lesson.peerContext?.bo.defaultReply) || "Mình cứ tưởng |BC + DD'| tách thành 1 + 1 = 2 được, hóa ra phải thế DD' = CC' để nối tiếp thành đường chéo BC' bằng căn 2!")
          : 'Tớ thấy phần vectơ không gian này có nhiều chỗ hay bị lừa lắm nha! Cậu nhớ chú ý chiều mũi tên với các quy tắc Thầy Tiến vừa dạy nghen!';
    } else if (lower.includes('hiệu') || lower.includes('phép trừ') || lower.includes('trừ') || lower.includes('oa - ob')) {
      replyAuthor = 'Linh Chi';
      replyText =
        "Quy tắc hiệu dùng khi trừ hai vectơ CHUNG ĐẦU (ví dụ OA - OB = BA). Bạn nhớ khẩu quyết vàng của thầy Tiến ở phút [57:02]: 'Chung đầu - Lộn ngược' — lấy điểm đứng sau (B) lộn lên trước điểm đứng trước (A) nhé!";
    } else if (lower.includes("dd'") || lower.includes("cc'") || lower.includes('tại sao đổi') || lower.includes('đổi dd')) {
      if (target === 'minhkhang' || lower.includes('khang')) {
        replyAuthor = 'Minh Khang';
        replyText =
          cleanText(lesson.peerContext?.minhkhang.defaultReply) ||
          "Tưởng tượng bạn đi bộ ngang 1m (BC) rồi leo cầu thang thẳng đứng 1m (CC'). Khoảng cách chim bay BC' là cạnh huyền căn(1² + 1²) = căn 2m chứ không phải 2m!";
      } else {
        replyAuthor = 'Linh Chi';
        replyText =
          "Ở phút [36:55], hai vectơ BC và DD' đang rời nhau! Muốn dùng quy tắc 3 điểm (nối tiếp), điểm cuối của anh trước phải là điểm đầu của anh sau. Vì DD' = CC' (hai cạnh bên hình lập phương bằng nhau và cùng hướng) nên thế DD' bằng CC' để được BC + CC' = BC'!";
      }
    } else if (lower.includes('cùng phương') || lower.includes('giá của')) {
      replyAuthor = 'Trí';
      replyText =
        "Đúng vậy! Hai vectơ chỉ xét cùng hướng hay ngược hướng khi chúng đã CÙNG PHƯƠNG (tức là giá song song hoặc trùng nhau). Hai đường thẳng chéo nhau thì không cùng phương nên không có chiều cùng hay ngược!";
    } else if (lower.includes('3 điểm') || lower.includes('nối tiếp') || lower.includes('hình bình hành') || lower.includes('hình hộp')) {
      replyAuthor = 'Linh Chi';
      replyText =
        "Nối đuôi nhau (điểm cuối anh này là điểm đầu anh kia): OA + AB = OB. Chung gốc xuất phát: Trong hình bình hành AB + AD = AC; trong hình hộp AB + AD + AA' = AC' (đường chéo xuyên tâm)!";
    } else if (target === 'linhchi' || lower.includes('chi') || lower.includes('thế') || lower.includes('công thức')) {
      replyAuthor = 'Linh Chi';
      replyText =
        cleanText(lesson.peerContext?.linhchi.defaultReply) ||
        "Theo phút [36:55] của thầy Tiến: Hai vectơ BC và DD' rời nhau nên ta thay DD' = CC' (hai cạnh bên hình lập phương), khi đó BC + CC' = BC' (đường chéo mặt bên cạnh 1 nên bằng căn 2).";
    } else if (target === 'minhkhang' || lower.includes('khang') || lower.includes('cầu thang')) {
      replyAuthor = 'Minh Khang';
      replyText =
        cleanText(lesson.peerContext?.minhkhang.defaultReply) ||
        'Tưởng tượng bạn đi bộ ngang 1m từ B sang C, rồi leo thang thẳng đứng 1m từ C lên C\'. Khoảng cách chim bay BC\' là cạnh huyền căn(1² + 1²) = căn 2m chứ không phải 2m!';
    } else if (lower.includes('chưa hiểu') || lower.includes('đoạn này')) {
      if (currentTime >= 3100) {
        replyAuthor = 'Trí';
        replyText = "Đoạn này thầy Tiến đang giảng về Hiệu hai vectơ (phép trừ) ở phút [57:02]. Trọng tâm là công thức OA - OB = BA (lộn ngược điểm B lên trước điểm A)!";
      } else if (currentTime >= 1800) {
        replyAuthor = 'Trí';
        replyText = cleanText(lesson.peerContext?.tri.defaultReply) || "Bản chất ở [37:13] là bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Ở đây BC và DD' vuông góc nhau trong không gian nên bắt buộc phải gom thành BC' rồi tính độ dài!";
      } else {
        replyAuthor = 'Linh Chi';
        replyText = activeCue?.formula ? `Ở đoạn này công thức trọng tâm là: ${activeCue.formula}. Bạn chú ý điểm đầu và điểm cuối của từng vectơ nhé!` : "Đoạn này thầy đang giới thiệu các khái niệm nền tảng về vectơ trong không gian. Bạn có thể bấm vào sổ tay của các bạn để xem mẹo nhớ!";
      }
    } else {
      if (currentTime >= 2100) {
        replyAuthor = 'Trí';
        replyText = 'Ở đoạn này thầy Tiến đang giải Ví dụ 3: Tuyệt đối không được tách độ dài |a + b| = |a| + |b| nhé!';
      } else if (currentTime >= 1300) {
        replyAuthor = 'Linh Chi';
        replyText = 'Ở đoạn này trọng tâm là Quy tắc 3 điểm (nối tiếp) OA + AB = OB và quy tắc hình bình hành AB + AD = AC!';
      } else {
        replyAuthor = 'Minh Khang';
        replyText = 'Đoạn này thầy Tiến đang giới thiệu khái niệm nền tảng: Vectơ là đoạn thẳng có hướng, nhớ kiểm tra cùng phương trước khi xét cùng/ngược hướng nhé!';
      }
    }

    // Xác định tên bạn học AI sẽ trả lời trước để hiển thị trạng thái đang soạn tin (Live Typing Indicator)
    const initialRespondentName =
      target === 'bo'
        ? 'Bo'
        : target === 'tri'
        ? 'Trí'
        : target === 'linhchi'
        ? 'Linh Chi'
        : target === 'minhkhang'
        ? 'Minh Khang'
        : target === 'colam'
        ? 'Cô Lam'
        : target === 'an'
        ? 'Trợ giảng An'
        : isOffTopic || isDistracted
        ? 'Minh Khang'
        : (target === 'all' && (isSumTrap || isLineOfVector || isWhyNeedVectors))
        ? replyAuthor
        : lower.includes('bo') || lower.includes('@bo')
        ? 'Bo'
        : 'Trí';

    setTypingAgent(getAgentMeta(initialRespondentName));

    const isMathVerificationNeeded = target === 'tri' || 
      text.toLowerCase().includes('độ dài') || 
      text.toLowerCase().includes('do dai') || 
      text.toLowerCase().includes('1+1') || 
      text.toLowerCase().includes('2a') || 
      text.toLowerCase().includes('bc');

    const mathKeywords = ['vecto', 'vectơ', 'độ dài', 'do dai', 'cộng', 'cong', 'trừ', 'tru', '1+1', '2a', 'hình lập phương', 'hinh hop', 'bc', 'dd', 'bẫy', 'công thức', 'quy tắc'];
    const isMathQuery = mathKeywords.some(k => text.toLowerCase().includes(k));
    const thinkingSteps: string[] = [];

    if (isMathQuery) {
      thinkingSteps.push('Đang truy xuất kho tri thức RAG (Pedagogical KB)...');
    }
    if (isMathVerificationNeeded) {
      thinkingSteps.push('Trí đang kiểm chứng hình học (Tọa độ 3D)...');
    }
    setToolCallThinking(thinkingSteps);

    // Thử gọi live Multi-Agent AI Backend (Knowledge Base RAG & GPT-6)
    sendClassroomChat(text, currentTime, target)
      .then((aiRes) => {
        setToolCallThinking([]);
        if (aiRes && aiRes.ok && aiRes.text) {
          sound.playBubblePop();
          const attachedToolCalls = (aiRes as any)?.toolCalls || (isMathVerificationNeeded ? [{
            toolName: 'tool_verify_vector_algebra',
            category: 'math_verify',
            label: 'Trí đang kiểm chứng hình học...',
            badgeText: 'Đã kiểm chứng hình học (Tọa độ 3D: a√2)',
          }] : []);

          const isPrimaryTeacher = aiRes.author.includes('Cô Lam');
          const isPrimaryTa = aiRes.author.includes('Trợ giảng');
          const primaryRole = isPrimaryTeacher ? 'teacher' : isPrimaryTa ? 'ta' : 'classmate';

          setLiveChatMessages((prev) => [
            ...prev,
            {
              id: `reply_${Date.now()}`,
              second: currentTime,
              author: aiRes.author,
              role: primaryRole,
              text: aiRes.text,
              toolCall: attachedToolCalls[0],
              toolCalls: attachedToolCalls,
              replyTo: {
                id: newMsg.id,
                author: newMsg.author,
                text: newMsg.text,
              },
            },
          ]);

          const followUp = (aiRes as any)?.followUpResponse;
          const followUpText = followUp?.text || aiRes.followUpBoText;
          if (followUpText) {
            const followUpAuthor = followUp?.author || 'Cô Lam';
            setTypingAgent(getAgentMeta(followUpAuthor));
            const isFollowUpTeacher = followUpAuthor.includes('Cô Lam');
            const isFollowUpTa = followUpAuthor.includes('Trợ giảng');
            const followUpRole = isFollowUpTeacher ? 'teacher' : isFollowUpTa ? 'ta' : 'classmate';
            setTimeout(() => {
              sound.playBubblePop();
              setTypingAgent(null);
              setLiveChatMessages((prev) => [
                ...prev,
                {
                  id: `reply_followup_${Date.now()}`,
                  second: currentTime,
                  author: followUpAuthor,
                  role: followUpRole,
                  text: followUpText,
                  replyTo: {
                    id: newMsg.id,
                    author: newMsg.author,
                    text: newMsg.text,
                  },
                },
              ]);
            }, 800);
          } else {
            setTypingAgent(null);
          }
          return;
        }
        // Fallback sang phản hồi định tuyến nội bộ nếu backend không phản hồi
        runLocalReplySimulation();
      })
      .catch(() => {
        setToolCallThinking([]);
        runLocalReplySimulation();
      });

    function runLocalReplySimulation() {
      // Xác định bạn học kế tiếp sẽ tiếp lời
      let localFollowAuthor = '';
      let localFollowText = '';

      if (isOffTopic) {
        localFollowAuthor = 'Cô Lam';
        localFollowText = 'Cô thấy lớp mình bàn luận rất rôm rả! Tuy nhiên hình học không gian đòi hỏi trí tưởng tượng và sự tập trung cao độ. Cả lớp cùng hướng mắt lên màn hình tiếp tục theo dõi bài giảng của Thầy Tiến nhé!';
      } else if (isSumTrap) {
        if (target === 'bo' || lower.includes('@bo')) {
          localFollowAuthor = 'Trí';
          localFollowText = 'Trong số học thông thường thì 1 + 1 = 2 đúng là chân lý! Nhưng trong VECTƠ, Thầy Tiến gạch bỏ biểu thức |BC + DD\'| = 1 + 1 = 2 vì độ dài của tổng KHÔNG ĐƯỢC tách tuỳ tiện thành tổng hai độ dài:\nTheo bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng "chân lý" đó CHỈ XẢY RA KHI hai vectơ a và b CÙNG HƯỚNG!\nTrong Ví dụ 3, BC và DD\' vuông góc nhau trong không gian. Muốn tính độ dài, bắt buộc phải thay DD\' = CC\' để nối tiếp thành BC + CC\' = BC\', sau đó áp dụng định lý Pytago tính đường chéo mặt bên: |BC\'| = √(1² + 1²) = √2 (khoảng 1.41) chứ tuyệt đối không thể bằng 2 được bạn nhé!';
        } else {
          localFollowAuthor = 'Cô Lam';
          localFollowText = 'Trí giải thích rất chuẩn xác! Các em cần ghi nhớ thật kỹ: Tuyệt đối không được nhầm lẫn giữa phép cộng đại số thông thường và độ dài của tổng vectơ. Dấu bằng |a + b| = |a| + |b| chỉ đúng khi hai vectơ cùng hướng thôi nhé!';
        }
      } else if (isLineOfVector) {
        if (lower.includes('giá đỗ') || lower.includes('gia do')) {
          localFollowAuthor = 'Linh Chi';
          localFollowText = 'Giá của vectơ AB là đường thẳng vô hạn đi qua hai điểm A và B nhé các bạn. Từ Hán-Việt "giá" ở đây có nghĩa là cái giá đỡ, đường thẳng mang vectơ nằm trên đó!';
        } else {
          localFollowAuthor = 'Minh Khang';
          localFollowText = 'Tớ lấy ví dụ cho dễ nhớ nè: Tưởng tượng con tàu chạy từ ga A đến ga B là vectơ AB (có hướng đi và độ dài hành trình). Còn hai thanh ray kéo dài tít tắp trên mặt đất chính là GIÁ của vectơ đó! Con tàu chỉ chạy trên thanh ray ấy thôi!';
        }
      } else if (isWhyNeedVectors) {
        localFollowAuthor = 'Minh Khang';
        localFollowText = 'Chuẩn luôn! Giống như bạn mở Google Maps ấy, nếu bản đồ chỉ hiện đoạn thẳng thì bạn đâu biết phải quẹo hướng nào. Mũi tên vectơ màu xanh chỉ đường mới giúp bạn đi đúng hướng đến đích được chứ!';
      } else if (isZeroVector) {
        localFollowAuthor = 'Minh Khang';
        localFollowText = 'Chuẩn luôn Trí ơi! Giống như bạn chạy bộ trên máy tập gym 5km: mồ hôi nhễ nhại, tiêu hao 300 calo (quãng đường 5km), nhưng bước xuống máy thì vị trí bạn vẫn đứng yên trong phòng tập (vectơ độ dời = 0)! Vectơ chỉ nhìn điểm đầu và điểm cuối thôi bạn ơi!';
      } else if (isDistracted) {
        localFollowAuthor = 'Cô Lam';
        localFollowText = 'Cô nghe thấy có bạn rủ nhau đi chơi đấy nhé! Kiến thức vectơ không gian lớp 12 này ban đầu có vẻ hơi trừu tượng, nhưng chỉ cần kiên nhẫn nắm chắc các quy tắc là các em sẽ thấy rất thú vị và tự tin. Cố gắng lên nào, cả lớp cùng tập trung theo dõi tiếp bài giảng của Thầy Tiến nhé!';
      } else if (isVectorEquality) {
        localFollowAuthor = target === 'bo' || lower.includes('@bo') ? 'Trí' : 'Minh Khang';
        localFollowText = target === 'bo' || lower.includes('@bo')
          ? 'Đoạn thẳng không phân biệt thứ tự nên độ dài |AB| = |BA|. Nhưng VECTƠ có điểm đầu và điểm cuối: vectơ AB đi từ A đến B, còn vectơ BA đi từ B về A. Hai vectơ này ngược hướng nhau (vectơ AB = - vectơ BA) nên không thể bằng nhau được bạn nhé!'
          : 'Chuẩn đó Trí! Cứ liên tưởng vé máy bay từ Đà Nẵng (A) ra Hà Nội (B) thì đưa bạn ra Thủ đô, còn bay từ Hà Nội (B) về Đà Nẵng (A) là về ngắm biển. Quãng đường bằng nhau nhưng bay ngược hướng là tới hai nơi hoàn toàn khác nhau liền!';
      } else if (isTrivializingOrBored) {
        localFollowAuthor = 'Cô Lam';
        localFollowText = 'Cô rất thích sự tự tin của em! Nhưng không gian 3 chiều mở ra một thế giới hình học hoàn toàn mới và rất nhiều điều kỳ thú. Cùng kiên nhẫn theo dõi tiếp bài giảng của Thầy Tiến để khám phá nhé!';
      }

      setTimeout(() => {
        sound.playBubblePop();
        const attachedToolCall = isMathVerificationNeeded ? {
          toolName: 'tool_verify_vector_algebra',
          label: 'Trí đang kiểm chứng hình học...',
          badgeText: 'Đã kiểm chứng hình học (Tọa độ 3D: a√2)',
        } : null;

        const isPrimaryTeacher = replyAuthor.includes('Cô Lam');
        const isPrimaryTa = replyAuthor.includes('Trợ giảng');
        const primaryRole = isPrimaryTeacher ? 'teacher' : isPrimaryTa ? 'ta' : 'classmate';

        setLiveChatMessages((prev) => [
          ...prev,
          {
            id: `reply_${Date.now()}`,
            second: currentTime,
            author: replyAuthor,
            role: primaryRole,
            text: replyText,
            toolCall: attachedToolCall,
            replyTo: {
              id: newMsg.id,
              author: newMsg.author,
              text: newMsg.text,
            },
          },
        ]);

        if (localFollowAuthor && localFollowText) {
          setTypingAgent(getAgentMeta(localFollowAuthor));
        } else {
          setTypingAgent(null);
        }
      }, 350);

      if (localFollowAuthor && localFollowText) {
        setTimeout(() => {
          sound.playBubblePop();
          setTypingAgent(null);
          const isFollowUpTeacher = localFollowAuthor.includes('Cô Lam');
          const isFollowUpTa = localFollowAuthor.includes('Trợ giảng');
          const followRole = isFollowUpTeacher ? 'teacher' : isFollowUpTa ? 'ta' : 'classmate';

          setLiveChatMessages((prev) => [
            ...prev,
            {
              id: `reply_local_follow_${Date.now()}`,
              second: currentTime,
              author: localFollowAuthor,
              role: followRole,
              text: localFollowText,
              replyTo: {
                id: newMsg.id,
                author: newMsg.author,
                text: newMsg.text,
              },
            },
          ]);
        }, 850);
      }
    }
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
      name: 'Minh Khang',
      initial: 'K',
      avClass: 'av--me',
      status: 'trực quan',
      tagline: 'Trực quan & Đời sống',
      speech: '“Tưởng tượng như bước đi ngoài đời thực, hình dung sẽ dễ hơn nhiều!”',
      power: 'Biến các công thức khô khan thành hình ảnh thực tế sống động.',
      color: '#0891b2',
    },
  ];

  // Điều kiện hiển thị và lưu Thẻ Câu Hỏi vĩnh viễn trong luồng chat:
  // (Chỉ xuất hiện khi bật xem toàn bộ HOẶC video đã chạy qua mốc câu hỏi 37:13)
  const shouldShowSavedQuizInChat =
    showAllTimeline ||
    (currentTime > 0 &&
      (currentTime >= lesson.checkpointTimestamp ||
        isQuizCollapsedToChat ||
        isQuizSkipped ||
        Boolean(savedSelectedOptionId) ||
        phase === 'BO_DEBATE' ||
        phase === 'BO_CONCEDED' ||
        phase === 'CO_LAM_CLOSURE'));

  const quizStatus: 'PENDING' | 'SKIPPED' | 'ANSWERED' = isQuizSkipped
    ? 'SKIPPED'
    : (savedSelectedOptionId || phase === 'BO_DEBATE' || phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE')
    ? 'ANSWERED'
    : 'PENDING';

  // Tách tin nhắn thành 2 phần: Trước 37:13 (trước câu hỏi) và Sau 37:13 (sau câu hỏi)
  const preCheckpointComments = useMemo(() => {
    return allStreamComments.filter((c) => c.second < lesson.checkpointTimestamp);
  }, [allStreamComments, lesson.checkpointTimestamp]);

  const postCheckpointComments = useMemo(() => {
    return allStreamComments.filter((c) => c.second >= lesson.checkpointTimestamp);
  }, [allStreamComments, lesson.checkpointTimestamp]);

  const renderChatMessage = (msg: TimelineComment) => {
    const isBo = msg.author.trim() === 'Bo' || msg.author.includes('Bo');
    const isChi = msg.author.includes('Linh Chi');
    const isKhang = msg.author.includes('Khang');
    const isTri = msg.author.includes('Trí');
    const isCoLam = msg.author.includes('Cô Lam');
    const isTaAn = msg.author.includes('Trợ giảng An');
    const isMe = msg.author.includes('Bạn') || (learnerName && msg.author.startsWith(learnerName));

    const initialLetter = isCoLam
      ? 'L'
      : isTaAn
      ? 'A'
      : isBo
      ? 'B'
      : isTri
      ? 'T'
      : isChi
      ? 'C'
      : isKhang
      ? 'K'
      : isMe
      ? 'Bạn'
      : msg.author.charAt(0);

    const avatarBg = isCoLam
      ? '#991b1b' // Đỏ đô ấm áp nhà giáo
      : isTaAn
      ? '#0f766e' // Xanh mòng két trợ giảng
      : isBo
      ? '#b45309'
      : isTri
      ? '#1d4ed8'
      : isChi
      ? '#059669'
      : isKhang
      ? '#7c3aed'
      : '#0f766e';

    return (
      <div
        key={msg.id}
        className="flex items-start gap-2.5 transition-colors group"
      >
        {/* Avatar tròn với chữ cái in hoa (Khớp Ảnh 4) */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 mt-0.5 shadow-2xs"
          style={{ backgroundColor: avatarBg }}
        >
          {initialLetter}
        </div>

        {/* Nội dung tin nhắn: Hàng 1 Tên + Giờ, Hàng 2 Khung Bubble xám nhạt */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-stone-900 truncate">
              {msg.author}
            </span>
            {isCoLam && (
              <span className="px-1.5 py-0.2 rounded bg-red-100 text-[10px] font-semibold text-red-800">
                Giáo viên
              </span>
            )}
            {isTaAn && (
              <span className="px-1.5 py-0.2 rounded bg-teal-100 text-[10px] font-semibold text-teal-800">
                Trợ giảng
              </span>
            )}
            <button
              type="button"
              onClick={() => onSeekVideo?.(msg.second)}
              className="px-1.5 py-0.2 rounded bg-stone-100 hover:bg-stone-200 text-[10px] font-mono text-stone-500 hover:text-stone-900 cursor-pointer transition-colors"
              title={`Tua video tới ${formatSec(msg.second)}`}
            >
              {formatSec(msg.second)}
            </button>
            {/* Nút Trả lời nhanh khi hover tin nhắn */}
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setReplyingToComment(msg);
                const matchedOpt = RECIPIENT_OPTIONS.find(
                  (o) => o.id !== 'all' && msg.author.toLowerCase().includes(o.label.toLowerCase())
                );
                if (matchedOpt) setRecipient(matchedOpt.id);
                chatInputRef.current?.focus();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.2 rounded text-[10px] font-semibold text-stone-500 hover:text-[#1B4338] hover:bg-stone-200/60 cursor-pointer flex items-center gap-0.5 ml-auto"
              title={`Trả lời tin nhắn của ${msg.author}`}
            >
              <span>↩ Trả lời</span>
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-800 leading-relaxed font-normal shadow-2xs select-text">
            {/* Trích dẫn tin nhắn đang được phản hồi (Quote chip) */}
            {msg.replyTo && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-lg bg-stone-200/60 border border-stone-300/70 text-[10.5px] text-stone-700 font-medium max-w-full overflow-hidden">
                <span className="text-[#1B4338] font-mono text-xs font-bold">↩</span>
                <span className="font-bold text-[#1B4338] shrink-0">@{msg.replyTo.author}:</span>
                <span className="truncate italic text-stone-600">"{cleanText(msg.replyTo.text)}"</span>
              </div>
            )}
            {renderToolBadges(
              (msg as any).toolCalls || (isTri && (msg.second >= 2200 && msg.second <= 2260) ? [
                {
                  toolName: 'tool_query_misconception_kb',
                  category: 'rag',
                  badgeText: 'RAG: MISC_VEC_005 (Cộng độ dài thay cho độ dài tổng)',
                },
                {
                  toolName: 'tool_verify_vector_algebra',
                  category: 'math_verify',
                  badgeText: 'Đã kiểm chứng hình học (Tọa độ 3D: a√2)',
                }
              ] : null),
              msg.toolCall
            )}
            <div>
              <FormattedMathText text={cleanText(msg.text)} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-white font-sans">
      {/* 1. THANH TIÊU ĐỀ: [🟢 Người tham gia: 4 bạn AI] + [💡 Gợi ý (0/3)] + [⤢ Mở rộng chat] */}
      <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between gap-2 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0 animate-pulse" />
          <span className="text-xs font-bold text-stone-900 truncate">
            Người tham gia: <span className="font-bold">4 bạn AI</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              sound.playPencilTap();
              setTaHintTier((prev) => (prev + 1) % 4);
            }}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded-lg cursor-pointer flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
            title="Xem gợi ý từ trợ giảng"
          >
            <GentleLightbulb className="w-3 h-3 text-amber-600" />
            <span>Gợi ý ({taHintTier}/3)</span>
          </button>

          {/* Nút Mở rộng / Thu hẹp khung chat */}
          {onToggleChatExpanded && (
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                onToggleChatExpanded();
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isChatExpanded
                  ? 'bg-[#1B4338] text-white border-[#1B4338] shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-[#1B4338] border-stone-300 shadow-2xs'
              }`}
              title={isChatExpanded ? 'Thu hẹp khung chat (về 33%)' : 'Mở rộng khung chat (lên 50%)'}
            >
              {isChatExpanded ? (
                <>
                  <MinimizeSvg className="w-3 h-3" />
                  <span className="text-[11px]">Thu hẹp</span>
                </>
              ) : (
                <>
                  <MaximizeSvg className="w-3 h-3 text-[#1B4338]" />
                  <span className="text-[11px] font-bold">Mở rộng chat</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. DẢI 4 BẠN HỌC ĐỒNG HÀNH (HỖ TRỢ THU GỌN ĐỂ TỐI ĐA DIỆN TÍCH KHUNG CHAT) */}
      {isRosterCollapsed ? (
        <div className="px-3 py-1.5 flex items-center justify-between border-b border-stone-200 bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
            <span className="text-[10px] font-bold text-stone-500 shrink-0">4 bạn AI:</span>
            {peopleRoster.map((p) => {
              const isSelected = recipient === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setRecipient((prev) => (prev === p.id ? 'all' : p.id));
                    setActivePeerNote((prev) => (prev === p.id ? null : p.id));
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100 border-[#E8A33D] text-amber-900 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                  title={`${p.name} (${p.tagline}) - Bấm để nhắn riêng`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsRosterCollapsed(false)}
            className="text-[10px] font-semibold text-[#1B4338] hover:underline flex items-center gap-0.5 shrink-0 ml-1.5 cursor-pointer"
            title="Mở rộng hiển thị chi tiết 4 bạn"
          >
            <span>Hiện avatar</span>
            <ChevronDownSvg className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <>
          {/* DÒNG PHỤ: Biệt đội 4 bạn + Nút thu gọn */}
          <div className="px-3.5 pb-1 text-[11px] text-stone-500 leading-tight shrink-0 flex items-center justify-between">
            <div className="truncate">
              <span className="font-bold text-[#1B4338] mr-1">Biệt đội 4 bạn:</span>
              <span className="hidden sm:inline">Cùng vướng mắc &amp; tranh biện qua từng bài giảng</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRosterCollapsed(true)}
              className="text-[10px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-0.5 shrink-0 cursor-pointer px-1.5 py-0.5 rounded hover:bg-stone-100"
              title="Thu gọn avatar để dành diện tích cho đoạn chat"
            >
              <span>Thu gọn</span>
              <ChevronDownSvg className="w-2.5 h-2.5 rotate-180" />
            </button>
          </div>

          <div className="px-3 pb-2.5 grid grid-cols-4 gap-1.5 border-b border-stone-200 shrink-0">
            {peopleRoster.map((p) => {
              const isSelected = recipient === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setHoveredPeer(p.id)}
                  onMouseLeave={() => setHoveredPeer(null)}
                  onClick={() => {
                    sound.playPencilTap();
                    setRecipient((prev) => (prev === p.id ? 'all' : p.id));
                    setActivePeerNote((prev) => (prev === p.id ? null : p.id));
                  }}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer flex flex-col items-center text-center group ${
                    isSelected ? 'bg-amber-50/90 ring-1.5 ring-[#E8A33D] shadow-2xs' : 'hover:bg-stone-50'
                  }`}
                  title={`${p.name} (${p.tagline}) - Bấm để nhắn riêng hoặc xem ghi chú`}
                >
                  <div className="relative mb-1">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-2xs transition-transform group-hover:scale-105"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.initial}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 leading-tight truncate w-full">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-stone-500 leading-tight truncate w-full mt-0.5">
                    {p.status}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* TOOLTIP NỔI KHI HOVER VÀO TỪNG BẠN (THÔNG TIN MÔ TẢ NGẮN / SUPERPOWER) */}
      {hoveredPeer && (
        <div className="mx-3.5 my-1.5 p-2.5 rounded-xl bg-white/98 backdrop-blur-md text-stone-800 text-xs space-y-1.5 shadow-lg border border-amber-200/90 animate-in fade-in duration-100 shrink-0">
          {(() => {
            const hp = peopleRoster.find((x) => x.id === hoveredPeer);
            if (!hp) return null;
            return (
              <>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#1B4338] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hp.color }} />
                    <span>{hp.name} · {hp.tagline}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">Bấm để nhắn riêng</span>
                </div>
                <p className="text-[11px] text-stone-700 italic font-medium leading-snug">
                  {hp.speech}
                </p>
                <div className="text-[10px] text-stone-500 leading-tight border-t border-stone-100 pt-1 font-normal flex items-center gap-1">
                  <GentleLightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{hp.power}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Ghi chú nhanh khi bấm vào 1 bạn (Whisper peek) */}
      {activePeerNote && (
        <div className="mx-3.5 mt-2 p-2.5 bg-[#FFFBF2] border border-[#E8A33D]/50 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-100 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-[#92400E] shrink-0">
              {peopleRoster.find((x) => x.id === activePeerNote)?.name}:
            </span>
            <span className="text-stone-700 truncate font-normal">
              {activePeerNote === 'linhchi' && 'OA + AB = OB · Quy tắc hình hộp AB + AD + AA\' = AC\''}
              {activePeerNote === 'minhkhang' && 'Đi ngang 1m leo lên 1m -> đường chéo căn(1² + 1²) = √2m'}
              {activePeerNote === 'tri' && 'Cần kiểm tra cùng phương trước khi xét cùng/ngược hướng'}
              {activePeerNote === 'bo' && '|a + b| chỉ bằng |a| + |b| khi cùng hướng!'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActivePeerNote(null)}
            className="text-stone-400 hover:text-stone-800 font-bold text-xs cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. THANH TAB CHUẨN ẢNH 4: [Lớp học] · [Bản chép lời] */}
      <div className="px-3.5 pt-2 flex items-center gap-5 border-b border-stone-200 shrink-0 bg-white">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`pb-2 text-xs font-bold cursor-pointer transition-colors relative ${
            activeTab === 'chat'
              ? 'text-stone-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-stone-900'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          Lớp học
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transcript')}
          className={`pb-2 text-xs font-bold cursor-pointer transition-colors relative ${
            activeTab === 'transcript'
              ? 'text-stone-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-stone-900'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          Bản chép lời
        </button>
      </div>

      {/* 4. NỘI DUNG PANEL: CHAT HOẶC TRANSCRIPT */}
      {activeTab === 'transcript' ? (
        <div className="transcript flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5 bg-stone-50/50">
          <div className="text-[11px] font-bold text-stone-500 px-1 pb-1">
            BẢN CHÉP LỜI THEO TIẾN ĐỘ BÀI GIẢNG:
          </div>
          {lesson.transcriptCues?.map((cue, idx) => {
            const isCurrent = currentTime >= cue.start && currentTime <= cue.end;
            return (
              <button
                key={idx}
                type="button"
                ref={isCurrent ? activeTranscriptCueRef : null}
                onClick={() => onSeekVideo?.(cue.start)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border ${
                  isCurrent
                    ? 'bg-[#FFFBF2] font-semibold text-stone-900 border-[#E8A33D] shadow-2xs'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200/80'
                }`}
              >
                <span className="shrink-0 text-xs font-mono font-bold text-[#E8A33D]">{formatSec(cue.start)}</span>
                <span className="text-xs leading-relaxed font-normal">{cleanText(cue.text)}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Ghim Trợ giảng An (Khớp 100% Ảnh 4) */}
          {pinnedComment && (
            <div className="mx-3.5 mt-2.5 p-3 rounded-xl bg-[#143830] text-white shrink-0 text-xs space-y-1 shadow-sm border border-[#143830]">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                <span className="px-1.5 py-0.5 rounded bg-[#F5D65D] text-stone-900 font-extrabold">
                  GHIM
                </span>
                <span className="text-white">TRỢ GIẢNG AN · {formatSec(pinnedComment.second)}</span>
              </div>
              <p className="leading-relaxed text-white/95 font-normal text-xs">
                {cleanText(pinnedComment.text)}
              </p>
              {taHintTier > 0 && (
                <div className="mt-2 p-2 bg-white text-stone-800 rounded-lg font-medium text-xs border border-stone-200">
                  {taHintTier === 1 && "Gợi ý 1: Kiểm tra điểm cuối của BC và điểm đầu của DD' đã nối tiếp chưa."}
                  {taHintTier === 2 && `Gợi ý 2: ${cleanText(lesson.freezeNote)}`}
                  {taHintTier === 3 && "Gợi ý 3: Thay DD' = CC' thì BC + CC' = BC' (đường chéo bằng √2)."}
                </div>
              )}
            </div>
          )}

          {/* Luồng tin nhắn chat với avatar chữ cái & bubble card (Khớp 100% Ảnh 4) */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-3.5 py-3 space-y-3.5 select-text">
            {allStreamComments.length === 0 && (
              <div className="py-12 px-4 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
                <span className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-[#1B4338] shadow-2xs">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="font-semibold text-stone-600">Bấm phát video để bắt đầu cùng 4 bạn AI</span>
                <span className="text-[11px] text-stone-400">Các tin nhắn trao đổi sẽ tự động nảy lên theo từng mốc giây bài giảng</span>
              </div>
            )}
            {preCheckpointComments.map(renderChatMessage)}

            {/* THẺ CÂU HỎI KIỂM TRA NHANH ĐƯỢC CHÈN CỐ ĐỊNH TẠI ĐÚNG MỐC 37:13 NGAY SAU TIN NHẮN 37:05 CỦA TRÍ */}
            {shouldShowSavedQuizInChat && (
              <ChatSavedQuizBlock
                lesson={lesson}
                status={quizStatus}
                savedSelectedOptionId={savedSelectedOptionId}
                onSeekToCheckpoint={(sec) => onSeekVideo?.(sec)}
                onSubmitAnswerFromChat={(opt) => {
                  onSetSavedSelectedOptionId?.(opt.id);
                  onSetQuizSkipped?.(false);
                  onAnswerCheckpoint?.(cleanText(opt.label), opt.id);
                }}
                onSkipFromChat={() => {
                  onSetQuizSkipped?.(true);
                  onSkipCheckpoint?.();
                }}
              />
            )}

            {postCheckpointComments.map(renderChatMessage)}

            {toolCallThinking.length > 0 && (
              <div className="flex flex-col gap-1.5 p-2 rounded-xl animate-in fade-in duration-200">
                {toolCallThinking.map((step, sIdx) => {
                  const isRag = step.includes('RAG');
                  return (
                    <div
                      key={sIdx}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-2xs animate-pulse w-fit ${
                        isRag ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full animate-ping ${isRag ? 'bg-purple-600' : 'bg-blue-600'}`} />
                      <svg className={`w-3.5 h-3.5 animate-spin shrink-0 ${isRag ? 'text-purple-600' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="14 28" />
                      </svg>
                      <span>{isRag ? '📚' : '📐'} {step}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CẢNH TẠM BIỆT VÀ CHUYỂN TRẠM SANG TRẠM 2 (CHUẨN TRẢI NGHIỆM TỪ MOCK/) */}
            {isLectureEnded && (
              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 space-y-2.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Hết video bài giảng — Chuyển trạm</span>
                  {autoRedirectCountdown !== null && autoRedirectCountdown > 0 && (
                    <span className="text-[11px] text-emerald-700 lowercase font-medium">
                      (Tự động chuyển sau {autoRedirectCountdown}s...)
                    </span>
                  )}
                </div>
                
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-xs text-slate-700 shadow-2xs">
                  <span className="font-bold text-amber-800">Bo [AI]: </span>
                  Hôm nay xem video vui ghê! Tạm biệt phòng video nhé, tụi mình qua <b>Trạm 2</b> xem hộ tờ giấy nháp của tớ sai ở đâu nha! 👋
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-slate-700 shadow-2xs">
                  <span className="font-bold text-emerald-800">Linh Chi [AI]: </span>
                  Tớ đã mở sẵn Sổ tay quy tắc bên Trạm 2 đợi cậu rồi đó. Hẹn gặp bên kia nhé!
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPageFlip();
                      onSwitchToStation2?.();
                    }}
                    className="flex-1 py-2.5 px-3 bg-[#1B4338] hover:bg-[#285E4F] text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Chuyển sang Trạm 2 ngay ➔</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPencilTap();
                      onSeekVideo?.(0);
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-xs rounded-xl cursor-pointer transition-all shadow-2xs whitespace-nowrap"
                  >
                    <span>↺ Xem lại từ đầu</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Typing Indicator */}
            {typingAgent && (
              <div className="flex items-center gap-2.5 px-3 py-2 bg-stone-50/90 rounded-2xl border border-stone-200/90 w-fit animate-in fade-in duration-200 shadow-2xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${typingAgent.avatarBg}`}>
                  {typingAgent.initial}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                  <span>{typingAgent.text}</span>
                  <span className="flex items-center gap-0.5 ml-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={chatStreamEndRef} />
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
                  className={`py-1 text-[11px] font-semibold rounded-lg border cursor-pointer transition-all shadow-2xs ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white hover:bg-amber-50/60 text-slate-700 border-amber-200/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-[#1E242B] bg-white p-2.5 rounded-lg border border-[#EFE8DC] leading-relaxed font-medium">
            {selectedFreezeIntent === 'not_understand' && (
              currentTime >= 2200 && currentTime <= 2260 && phase === 'STUDENT_FREEZE'
                ? 'Gợi ý: Cần quy đổi hai vectơ về chung một đường chéo trước khi tính độ dài, tuyệt đối không tách rời 1 + 1 = 2!'
                : cleanText(activeCue?.minhKhangAnalogy || lesson.freezeNote)
            )}
            {selectedFreezeIntent === 'take_notes' && cleanText(activeCue?.linhChiNote || activeCue?.text)}
            {selectedFreezeIntent === 'too_fast' && `Đã lùi video về mốc [${formatSec(Math.max(0, currentTime - 10))}] để bạn nghe lại.`}
          </p>
        </div>
      )}

      {/* 6. BỘ GÕ COMPOSER ĐA NĂNG (GỢI Ý HỎI DEMO 1 CHẠM + DROPDOWN NGƯỜI NHẬN + INPUT + GIỜ + GỬI) */}
      <div className="px-3 py-2 bg-[#FAF8F5] border-t border-stone-200/90 shrink-0">
        {/* Dải Pill câu hỏi gợi ý nhanh hỗ trợ quay Demo 1 chạm (bấm là gửi ngay và Trí + Bo phản hồi) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1.5">
          <span className="text-[10px] font-bold text-stone-400 shrink-0 uppercase tracking-wider">
            Gợi ý hỏi:
          </span>
          {[
            'Tại sao độ dài tổng 2 vectơ không bằng 1 + 1 = 2?',
            'Về nhà rồi thì quãng đường dài mà sao vectơ tổng lại bằng 0?',
            "Thế DD' = CC' nối tiếp vectơ như thế nào?",
            'Quy tắc trừ chung gốc OA - OB = BA dùng ra sao?',
          ].map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setUserChatInput(promptText);
                handleSendUserChatMessage(promptText, 'all');
              }}
              className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-all border border-stone-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-stone-700 hover:text-[#1B4338] shadow-2xs"
              title="Bấm để gửi nhanh câu hỏi này vào lớp học và kích hoạt Trí giải thích"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Banner hiển thị tin nhắn đang trả lời */}
        {replyingToComment && (
          <div className="flex items-center justify-between px-2.5 py-1 mb-1.5 rounded-lg bg-emerald-50/95 border border-emerald-300/80 text-xs text-[#1B4338] shadow-2xs animate-in fade-in duration-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-emerald-700 font-bold text-xs">↩</span>
              <span className="font-bold shrink-0">Đang trả lời @{replyingToComment.author}:</span>
              <span className="truncate text-stone-600 italic">"{cleanText(replyingToComment.text)}"</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingToComment(null)}
              className="p-0.5 hover:bg-emerald-200/60 rounded text-emerald-800 text-xs font-bold cursor-pointer shrink-0 ml-1.5"
              title="Hủy trả lời"
            >
              ✕
            </button>
          </div>
        )}

        {/* Khung nhập tin nhắn tích hợp 1 DÒNG DUY NHẤT (Dropdown người nhận + Input + Badge giờ + Gửi) */}
        <div
          className={`flex items-center gap-1.5 p-1 bg-white border border-stone-200/90 rounded-xl transition-all shadow-2xs focus-within:border-[#1B4338] focus-within:ring-1 focus-within:ring-[#1B4338] ${
            isComposerHighlighted ? 'ring-2 ring-[#1B4338] bg-stone-50' : ''
          }`}
        >
          {/* Dropdown người nhận tích hợp bên trái ô gõ */}
          <div className="relative shrink-0" ref={recipientDropdownRef}>
            {(() => {
              const currentOpt =
                RECIPIENT_OPTIONS.find((r) => r.id === recipient) || RECIPIENT_OPTIONS[0];
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRecipientOpen((prev) => !prev)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isRecipientOpen
                        ? 'bg-amber-50/80 border-[#E8A33D] text-amber-900 ring-1 ring-[#E8A33D]'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                    }`}
                    title="Chọn người nhận tin nhắn"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: currentOpt.color }}
                    />
                    <span className="text-[11px] font-medium">{currentOpt.label}</span>
                    <ChevronDownSvg
                      className={`w-2.5 h-2.5 text-stone-400 transition-transform duration-150 ${
                        isRecipientOpen ? 'rotate-180 text-stone-800' : ''
                      }`}
                    />
                  </button>

                  {/* POPUP MENU TÙY BIẾN */}
                  {isRecipientOpen && (
                    <div className="absolute bottom-full mb-1.5 left-0 z-50 bg-white border border-stone-200 rounded-xl shadow-xl p-1.5 min-w-[200px] space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-100">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 mb-1">
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
                                ? 'bg-[#FFFBF2] text-[#1B4338] font-bold border border-[#E8A33D]/40 shadow-2xs'
                                : 'hover:bg-stone-50 text-stone-700 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: opt.color }}
                              />
                              <span className="truncate">{opt.label}</span>
                              <span className="text-[10px] text-stone-400 font-normal">
                                ({opt.sublabel})
                              </span>
                            </div>
                            {isSelected && (
                              <CheckMiniSvg className="w-3.5 h-3.5 text-[#1B4338] shrink-0" />
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

          {/* Ô nhập tin nhắn */}
          <input
            ref={chatInputRef}
            type="text"
            value={userChatInput}
            onChange={(e) => setUserChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendUserChatMessage()}
            placeholder={
              recipient === 'all'
                ? 'Hỏi @Bo, @Trí, @Linh Chi...'
                : `Nhắn riêng cho ${peopleRoster.find((p) => p.id === recipient)?.name || 'bạn học'}...`
            }
            className="flex-1 bg-transparent px-1.5 py-1 text-xs font-medium outline-none text-stone-900 placeholder:text-stone-400 min-w-0"
          />

          {/* Badge thời gian video */}
          <span
            className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 shrink-0"
            title="Thời gian hiện tại trong video"
          >
            <ClockBadgeSvg className="w-2.5 h-2.5 text-stone-500" />
            <span>{formatSec(currentTime)}</span>
          </span>

          {/* Nút gửi tin nhắn */}
          <button
            onClick={() => handleSendUserChatMessage()}
            type="button"
            className="px-3.5 py-1.5 font-bold text-xs rounded-lg cursor-pointer transition-all bg-[#1B4338] hover:bg-[#285E4F] text-white shadow-xs flex items-center gap-1 shrink-0"
          >
            <span>Gửi</span>
            <SendArrowSvg className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
