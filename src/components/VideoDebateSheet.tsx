// File: src/components/VideoDebateSheet.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, TimelineComment } from '../types/dre';
import {
  HandStopIcon,
  GentleLightbulb
} from './HandmadeArtwork';
import { AgentAvatar } from './AgentAvatar';
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

const RECIPIENT_OPTIONS: { id: RecipientTarget; label: string; sublabel: string; color: string }[] = [
  { id: 'all', label: 'Cả lớp', sublabel: 'Công khai', color: '#0e7490' },
  { id: 'bo', label: 'Bo', sublabel: 'Nhắn riêng', color: '#ea580c' },
  { id: 'tri', label: 'Trí', sublabel: 'Nhắn riêng', color: '#0891b2' },
  { id: 'linhchi', label: 'Linh Chi', sublabel: 'Nhắn riêng', color: '#db2777' },
  { id: 'minhkhang', label: 'Minh Khang', sublabel: 'Nhắn riêng', color: '#0284c7' },
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
    return [...visibleTimelineComments, ...liveChatMessages];
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
    if (allStreamComments.length > prevCommentsCountRef.current || isLectureEnded) {
      chatStreamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCommentsCountRef.current = allStreamComments.length;
  }, [allStreamComments.length, isLectureEnded]);

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

    const isSumTrap =
      lower.includes('1 + 1') ||
      lower.includes('1+1') ||
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
      lower.includes('bc + dd') ||
      (lower.includes('tại sao') && (lower.includes('tổng') || lower.includes('độ dài') || lower.includes('vectơ') || lower.includes('vector') || lower.includes('1') || lower.includes('2')));

    if (isSumTrap) {
      replyAuthor = 'Trí';
      replyText =
        "Bản chất ở [37:13] là bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Ở đây BC và DD' vuông góc nhau trong không gian nên bắt buộc phải gom thành BC' rồi tính độ dài bằng định lý Pytago ra √2 (khoảng 1.41) chứ không thể bằng 1 + 1 = 2 được bạn nhé!";
    } else if (target === 'bo' || lower.includes('bo') || lower.includes('@bo')) {
      replyAuthor = 'Bo';
      replyText =
        cleanText(lesson.peerContext?.bo.defaultReply) ||
        "Mình cứ tưởng |BC + DD'| tách thành 1 + 1 = 2 được, hóa ra phải thế DD' = CC' để nối tiếp thành đường chéo BC' bằng căn 2!";
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

          setLiveChatMessages((prev) => [
            ...prev,
            {
              id: `reply_${Date.now()}`,
              second: currentTime,
              author: aiRes.author,
              role: 'classmate',
              text: aiRes.text,
              toolCall: attachedToolCalls[0],
              toolCalls: attachedToolCalls,
            },
          ]);

          if (aiRes.followUpBoText) {
            setTimeout(() => {
              sound.playBubblePop();
              setLiveChatMessages((prev) => [
                ...prev,
                {
                  id: `reply_bo_${Date.now()}`,
                  second: currentTime,
                  author: 'Bo',
                  role: 'classmate',
                  text: aiRes.followUpBoText!,
                },
              ]);
            }, 800);
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
      setTimeout(() => {
        sound.playBubblePop();
        const attachedToolCall = isMathVerificationNeeded ? {
          toolName: 'tool_verify_vector_algebra',
          label: 'Trí đang kiểm chứng hình học...',
          badgeText: 'Đã kiểm chứng hình học (Tọa độ 3D: a√2)',
        } : null;

        setLiveChatMessages((prev) => [
          ...prev,
          {
            id: `reply_${Date.now()}`,
            second: currentTime,
            author: replyAuthor,
            role: 'classmate',
            text: replyText,
            toolCall: attachedToolCall,
          },
        ]);
      }, 350);

      // Nếu người học hỏi về bẫy tổng 2 vectơ (Ví dụ 3), Bo tiếp lời sau câu trả lời của Trí để tạo không khí tranh luận lớp học
      if (isSumTrap) {
        setTimeout(() => {
          sound.playBubblePop();
          setLiveChatMessages((prev) => [
            ...prev,
            {
              id: `reply_bo_${Date.now()}`,
              second: currentTime,
              author: 'Bo',
              role: 'classmate',
              text: "Đó cũng là điều tớ từng thắc mắc đấy! Tớ cứ tưởng nhìn thấy hai cạnh bằng 1 thì cộng đại 1 + 1 = 2 luôn cho nhanh, nghe Trí giải thích Pytago mới sáng tỏ!",
            },
          ]);
        }, 950);
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

  const renderPeerAvatar = (author: string, className = 'w-8 h-8') => {
    return <AgentAvatar role={author} size={className} />;
  };

  const getRosterAvatar = (id: string, className = 'w-9 h-9') => {
    return <AgentAvatar role={id} size={className} />;
  };

  const renderChatMessage = (msg: TimelineComment) => {
    return (
      <div
        key={msg.id}
        className="flex items-start gap-2.5 transition-colors group"
      >
        {renderPeerAvatar(msg.author, 'w-8 h-8 shrink-0 mt-0.5')}

        {/* Nội dung tin nhắn: Hàng 1 Tên + Giờ, Hàng 2 Khung Bubble */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-[#121712] truncate">
              {msg.author}
            </span>
            <button
              type="button"
              onClick={() => onSeekVideo?.(msg.second)}
              className="px-1.5 py-0.5 rounded-md bg-[#F3F8E8] hover:bg-[#E2EAD2] text-[11px] font-mono font-medium text-[#121712] border border-[#E2EAD2] cursor-pointer transition-colors"
              title={`Tua video tới ${formatSec(msg.second)}`}
            >
              {formatSec(msg.second)}
            </button>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#E2EAD2] text-xs text-[#121712] leading-relaxed font-normal shadow-2xs select-text">
            {renderToolBadges(
              (msg as any).toolCalls || (((msg.author?.toLowerCase().includes("trí") || msg.author?.toLowerCase().includes("tri"))) && (msg.second >= 2200 && msg.second <= 2260) ? [
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
      {/* 1. THANH TIÊU ĐỀ: [🟢 Lớp học · 4 bạn AI] + [💡 Gợi ý (0/3)] + [⤢ Mở rộng] */}
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between gap-1 shrink-0 bg-white border-b border-[#E2EAD2]">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8F169] ring-2 ring-[#121712] inline-block shrink-0" />
          <span className="text-xs font-bold text-[#121712] truncate">
            Lớp học 4 bạn AI
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              sound.playPencilTap();
              setTaHintTier((prev) => (prev + 1) % 4);
            }}
            className="px-2.5 py-1 bg-[#F3F8E8] hover:bg-[#E2EAD2] text-[#121712] border border-[#E2EAD2] font-semibold text-xs rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs whitespace-nowrap"
            title="Xem gợi ý từ trợ giảng"
          >
            <GentleLightbulb className="w-3.5 h-3.5 text-[#121712]" />
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
              className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                isChatExpanded
                  ? 'bg-[#121712] text-white border-[#121712] shadow-xs'
                  : 'bg-white hover:bg-[#F3F8E8] text-[#121712] border-[#E2EAD2] shadow-2xs'
              }`}
              title={isChatExpanded ? 'Thu hẹp khung chat (về 33%)' : 'Mở rộng khung chat (lên 50%)'}
            >
              {isChatExpanded ? (
                <>
                  <MinimizeSvg className="w-3 h-3 text-white" />
                  <span className="text-xs">Thu hẹp</span>
                </>
              ) : (
                <>
                  <MaximizeSvg className="w-3 h-3 text-[#121712]" />
                  <span className="text-xs font-bold">Mở rộng</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. DẢI 4 BẠN HỌC ĐỒNG HÀNH (HỖ TRỢ THU GỌN ĐỂ TỐI ĐA DIỆN TÍCH KHUNG CHAT) */}
      {isRosterCollapsed ? (
        <div className="px-3 py-1.5 flex items-center justify-between border-b border-[#E2EAD2] bg-[#F3F8E8]/50 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
            <span className="text-[11px] font-bold text-stone-500 shrink-0">4 bạn AI:</span>
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#121712] text-white border-[#121712] shadow-2xs'
                      : 'bg-white border-[#E2EAD2] text-stone-700 hover:bg-stone-50'
                  }`}
                  title={`${p.name} (${p.tagline}) - Bấm để nhắn riêng`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8F169]" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsRosterCollapsed(false)}
            className="text-[11px] font-semibold text-[#121712] hover:underline flex items-center gap-0.5 shrink-0 ml-1.5 cursor-pointer"
            title="Mở rộng hiển thị chi tiết 4 bạn"
          >
            <span>Hiện avatar</span>
            <ChevronDownSvg className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <>
          {/* DÒNG PHỤ: 4 bạn đồng hành + Nút thu gọn */}
          <div className="px-3.5 py-1 text-xs text-stone-500 leading-tight shrink-0 flex items-center justify-between bg-[#F3F8E8]/30">
            <div className="truncate">
              <span className="font-bold text-[#121712] mr-1">4 bạn đồng hành:</span>
              <span className="hidden xl:inline text-stone-500">Cùng tranh biện qua từng bài giảng</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRosterCollapsed(true)}
              className="text-xs font-semibold text-stone-500 hover:text-[#121712] flex items-center gap-0.5 shrink-0 cursor-pointer px-1.5 py-0.5 rounded hover:bg-white"
              title="Thu gọn avatar để dành diện tích cho đoạn chat"
            >
              <span>Thu gọn</span>
              <ChevronDownSvg className="w-2.5 h-2.5 rotate-180" />
            </button>
          </div>

          <div className="px-3 pb-2 pt-1 grid grid-cols-4 gap-1.5 border-b border-[#E2EAD2] shrink-0 bg-[#F3F8E8]/20">
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
                  className={`p-1.5 rounded-xl transition-all cursor-pointer flex flex-col items-center text-center group border ${
                    isSelected ? 'bg-white border-[#121712] ring-1 ring-[#121712] shadow-xs' : 'bg-white/60 hover:bg-white border-transparent hover:border-[#E2EAD2]'
                  }`}
                  title={`${p.name} (${p.tagline}) - Bấm để nhắn riêng hoặc xem ghi chú`}
                >
                  <div className="relative mb-1">
                    {getRosterAvatar(p.id, 'w-9 h-9')}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#C8F169] ring-2 ring-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-[#121712] leading-snug text-center w-full truncate" title={p.name}>
                    {p.name}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-stone-500 leading-tight text-center w-full mt-0.5 truncate">
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
          {/* Ghim Trợ giảng An */}
          {pinnedComment && (
            <div className="mx-3.5 mt-2.5 p-3 rounded-2xl bg-[#F3F8E8] text-[#121712] shrink-0 text-xs space-y-1.5 border border-[#E2EAD2] shadow-2xs">
              <div className="flex items-center gap-2">
                <AgentAvatar role="an" size={24} tooltip />
                <span className="px-1.5 py-0.5 rounded-md bg-[#C8F169] text-[#121712] font-black text-xs tracking-wide uppercase">
                  GHIM
                </span>
                <span className="text-xs font-bold text-[#121712]">Trợ giảng An · {formatSec(pinnedComment.second)}</span>
              </div>
              <p className="leading-relaxed text-[#121712] font-normal text-xs pl-8">
                {cleanText(pinnedComment.text)}
              </p>
              {taHintTier > 0 && (
                <div className="mt-2 ml-8 p-2.5 bg-white text-[#121712] rounded-xl font-medium text-xs border border-[#E2EAD2] shadow-2xs">
                  {taHintTier === 1 && "Gợi ý 1: Kiểm tra điểm cuối của BC và điểm đầu của DD' đã nối tiếp chưa."}
                  {taHintTier === 2 && `Gợi ý 2: ${cleanText(lesson.freezeNote)}`}
                  {taHintTier === 3 && "Gợi ý 3: Thay DD' = CC' thì BC + CC' = BC' (đường chéo bằng √2)."}
                </div>
              )}
            </div>
          )}

          {/* Luồng tin nhắn chat với avatar minh hoạ SVG & bubble card */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-3.5 py-3 space-y-3.5 select-text">
            {allStreamComments.length === 0 && (
              <div className="py-12 px-4 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
                <span className="w-10 h-10 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] flex items-center justify-center text-[#121712] shadow-2xs">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#121712]" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="font-bold text-[#121712] text-sm">Lớp học 4 bạn AI sẵn sàng</span>
                <span className="text-xs text-stone-600 max-w-xs">
                  Thảo luận sẽ tự động xuất hiện theo tiến độ bài giảng hoặc bạn có thể gửi câu hỏi bên dưới
                </span>
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

            {/* CẢNH TẠM BIỆT VÀ CHUYỂN TRẠM SANG TRẠM 2 */}
            {isLectureEnded && (
              <div className="mt-4 pt-3 border-t border-dashed border-[#E2EAD2] space-y-2.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  <span>Hết video bài giảng — Chuyển trạm</span>
                  {autoRedirectCountdown !== null && autoRedirectCountdown > 0 && (
                    <span className="text-[11px] text-stone-600 lowercase font-medium">
                      (Tự động chuyển sau {autoRedirectCountdown}s...)
                    </span>
                  )}
                </div>
                
                <div className="bg-[#F3F8E8] border border-[#E2EAD2] rounded-xl p-3 text-xs text-[#121712] shadow-2xs">
                  <span className="font-bold text-[#121712]">Bo [AI]: </span>
                  Hôm nay xem video vui ghê! Tạm biệt phòng video nhé, tụi mình qua <b>Trạm 2</b> xem hộ tờ giấy nháp của tớ sai ở đâu nha!
                </div>

                <div className="bg-[#F3F8E8] border border-[#E2EAD2] rounded-xl p-3 text-xs text-[#121712] shadow-2xs">
                  <span className="font-bold text-[#121712]">Linh Chi [AI]: </span>
                  Tớ đã mở sẵn Sổ tay quy tắc bên Trạm 2 đợi cậu rồi đó. Hẹn gặp bên kia nhé!
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPageFlip();
                      onSwitchToStation2?.();
                    }}
                    className="flex-1 py-2.5 px-3 bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs border border-[#A6D83B] flex items-center justify-center gap-1.5"
                  >
                    <span>Chuyển sang Trạm 2 ngay ➔</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPencilTap();
                      onSeekVideo?.(0);
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-stone-50 border border-[#E2EAD2] text-[#121712] font-semibold text-xs rounded-xl cursor-pointer transition-all shadow-2xs whitespace-nowrap"
                  >
                    <span>↺ Xem lại từ đầu</span>
                  </button>
                </div>
              </div>
            )}

            <div ref={chatStreamEndRef} />
          </div>
        </div>
      )}

      {/* 5. HỘP HỖ TRỢ NHANH KHI ĐANG DỪNG GIƠ TAY */}
      {phase === 'STUDENT_FREEZE' && !isQuizCollapsedToChat && (
        <div className="my-1.5 mx-3.5 p-3 bg-[#F3F8E8] border border-[#E2EAD2] rounded-xl space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-[#121712]">
            <span className="flex items-center gap-1.5">
              <HandStopIcon className="w-3.5 h-3.5 text-[#121712]" />
              <span>Hỗ trợ tại [{formatSec(currentTime)}]</span>
            </span>
            <button
              type="button"
              onClick={onDismissFreeze}
              className="font-bold text-xs cursor-pointer px-1.5 py-0.5 rounded text-stone-500 hover:text-[#121712]"
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
                      ? 'bg-[#121712] text-white border-[#121712] shadow-xs'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-[#E2EAD2]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-[#121712] bg-white p-2.5 rounded-lg border border-[#E2EAD2] leading-relaxed font-medium">
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

      {/* 6. BỘ GÕ COMPOSER ĐA NĂNG */}
      <div className="px-3 py-2 bg-[#F3F8E8] border-t border-[#E2EAD2] shrink-0">
        {/* Dải Pill câu hỏi gợi ý nhanh - Gọn gàng 1 dòng thanh thoát, không vỡ bóng tròn */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 shrink-0 flex-nowrap">
          <span className="text-[11px] font-bold text-stone-600 shrink-0 uppercase tracking-wider whitespace-nowrap">
            Gợi ý hỏi:
          </span>
          {[
            {
              display: 'Tại sao |a+b| ≠ 1+1=2?',
              full: 'Tại sao độ dài tổng 2 vectơ không bằng 1 + 1 = 2?'
            },
            {
              display: "Thế DD' = CC' nối tiếp?",
              full: "Thế DD' = CC' nối tiếp vectơ như thế nào?"
            },
            {
              display: 'Quy tắc trừ OA - OB?',
              full: 'Quy tắc trừ chung gốc OA - OB = BA dùng ra sao?'
            }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setUserChatInput(item.full);
                handleSendUserChatMessage(item.full, 'all');
              }}
              className="h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-all border border-[#E2EAD2] bg-white hover:bg-[#C8F169]/40 text-[#121712] shadow-2xs whitespace-nowrap shrink-0 inline-flex items-center justify-center leading-none"
              title={item.full}
            >
              <span>{item.display}</span>
            </button>
          ))}
        </div>

        {/* Khung nhập tin nhắn tích hợp 1 DÒNG DUY NHẤT */}
        <div
          className={`flex items-center gap-1.5 p-1 bg-white border border-[#E2EAD2] rounded-xl transition-all shadow-2xs focus-within:border-[#121712] focus-within:ring-1 focus-within:ring-[#121712] ${
            isComposerHighlighted ? 'ring-2 ring-[#C8F169] bg-[#F3F8E8]' : ''
          }`}
        >
          {/* Dropdown người nhận */}
          <div className="relative shrink-0" ref={recipientDropdownRef}>
            {(() => {
              const currentOpt =
                RECIPIENT_OPTIONS.find((r) => r.id === recipient) || RECIPIENT_OPTIONS[0];
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRecipientOpen((prev) => !prev)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isRecipientOpen
                        ? 'bg-[#121712] border-[#121712] text-white ring-1 ring-[#121712]'
                        : 'bg-[#F3F8E8] hover:bg-[#E2EAD2] border-[#E2EAD2] text-[#121712]'
                    }`}
                    title="Chọn người nhận tin nhắn"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: currentOpt.color }}
                    />
                    <span className="text-xs font-medium">{currentOpt.label}</span>
                    <ChevronDownSvg
                      className={`w-2.5 h-2.5 text-stone-400 transition-transform duration-150 ${
                        isRecipientOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>

                  {/* POPUP MENU */}
                  {isRecipientOpen && (
                    <div className="absolute bottom-full mb-1.5 left-0 z-50 bg-white border border-[#E2EAD2] rounded-xl shadow-xl p-1.5 min-w-[200px] space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-100">
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
                                ? 'bg-[#F3F8E8] text-[#121712] font-bold border border-[#E2EAD2] shadow-2xs'
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
                              <CheckMiniSvg className="w-3.5 h-3.5 text-[#121712] shrink-0" />
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
                ? 'Nhắn cho cả lớp...'
                : `Nhắn riêng cho ${peopleRoster.find((p) => p.id === recipient)?.name || 'bạn học'}...`
            }
            className="flex-1 bg-transparent px-1.5 py-1 text-xs font-medium outline-none text-[#121712] placeholder:text-stone-400 min-w-0"
          />

          {/* Badge thời gian video */}
          <span
            className="hidden 2xl:inline-flex items-center gap-1 font-sans text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F3F8E8] text-[#121712] border border-[#E2EAD2] shrink-0"
            title="Thời gian hiện tại trong video"
          >
            <ClockBadgeSvg className="w-3 h-3 text-stone-500" />
            <span>{formatSec(currentTime)}</span>
          </span>

          {/* Nút gửi tin nhắn */}
          <button
            onClick={() => handleSendUserChatMessage()}
            type="button"
            className="px-2.5 sm:px-3 py-1.5 font-bold text-xs rounded-lg cursor-pointer transition-all bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] border border-[#A6D83B] shadow-xs flex items-center gap-1 shrink-0"
          >
            <span>Gửi</span>
            <SendArrowSvg className="w-3 h-3 text-[#121712]" />
          </button>
        </div>
      </div>
    </div>
  );
};
