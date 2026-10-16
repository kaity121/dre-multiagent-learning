// File: src/components/VideoPlayerSheet.tsx
import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, RebuttalSticker } from '../types/dre';
import { VIDEO_LESSON_LIBRARY } from '../data/videoLessons';
import { 
  BoAvatar,
  HandStopIcon, 
  LinkChainIcon, 
  RubberStampSuccess,
  CheckCircleIcon
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// ============================================================================
// BỘ CUSTOM SVG ICONS ĐỒNG BỘ FIGMA & BLU1606 MOCK (ZERO EMOJI)
// ============================================================================
const BoltCheckpointIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M13 2L4.5 13.5H11.5L10.5 22L19.5 10.5H12.5L13 2Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const ChaptersBookIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4 5.5C4 4.67 4.67 4 5.5 4H11V19H5.5C4.67 19 4 19.67 4 20.5V5.5Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M12 5.5C12 4.39543 12.8954 3.5 14 3.5H19.5C20.0523 3.5 20.5 3.94772 20.5 4.5V18.5C20.5 19.0523 20.0523 19.5 19.5 19.5H14C12.8954 19.5 12 20.3954 12 21.5M12 5.5C12 4.39543 11.1046 3.5 10 3.5H4.5C3.94772 3.5 3.5 3.94772 3.5 4.5V18.5C3.5 19.0523 3.94772 19.5 4.5 19.5H10C11.1046 19.5 12 20.3954 12 21.5M12 5.5V21.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CollapseToChatSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14 4V20" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7.5 9.5L11 12L7.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockWaitSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Rewind30sSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4.5 10.5C5.5 6.8 8.9 4 13 4C17.97 4 22 8.03 22 13C22 17.97 17.97 22 13 22C9.2 22 5.95 19.65 4.63 16.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 5.5V10.8H9.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchMagnifierIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 16L20.5 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ThumbUpReactionSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M7 11V19C7 19.5523 6.55228 20 6 20H4C3.44772 20 3 19.5523 3 19V12C3 11.4477 3.44772 11 4 11H7ZM7 11L10.5 4.5C11.3284 4.5 12.5 5.17157 12.5 6.5V9.5H18.5C19.6046 9.5 20.3652 10.5489 20.0528 11.6085L18.3528 18.6085C18.1322 19.4274 17.3895 20 16.5414 20H7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ConfusedReactionSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 10.6 13.8 11.3 12.8 11.8C12.3 12.05 12 12.5 12 13.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="1" fill="currentColor" />
  </svg>
);

const TagArgumentIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M3.5 12.2V5.5C3.5 4.39543 4.39543 3.5 5.5 3.5H12.2C12.73 3.5 13.24 3.71 13.61 4.09L19.91 10.39C20.69 11.17 20.69 12.44 19.91 13.22L13.22 19.91C12.44 20.69 11.17 20.69 10.39 19.91L4.09 13.61C3.71 13.24 3.5 12.73 3.5 12.2Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

interface VideoPlayerSheetProps {
  lesson: VideoLessonItem;
  phase: VideoCheckpointPhase;
  currentTime: number;
  isPlaying: boolean;
  isLoadingAi?: boolean;
  liveBoDialogue?: string | null;
  liveCoLamDialogue?: string | string[] | null;
  isQuizCollapsedToChat?: boolean;
  onToggleCollapseQuiz?: (collapsed: boolean) => void;
  onSendContextualQuestion?: (questionText: string) => void;
  onQuickReaction?: (type: 'understood' | 'confused') => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onTriggerFreeze: () => void;
  onJumpToCheckpoint: () => void;
  onSwitchVideoLesson?: (lesson: VideoLessonItem) => void;
  onAnswerCheckpoint?: (answerText: string) => void;
  onSubmitRebuttal?: (rebuttalText: string, isEffective: boolean) => void;
  onResumeVideo?: () => void;
  onSkipCheckpoint?: () => void;
}

const cleanText = (str?: string) => (str ? str.replace(/\u20d7/g, '') : '');

const extractYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.trim().match(regExp);
  return match ? match[1] : null;
};

export const VideoPlayerSheet: React.FC<VideoPlayerSheetProps> = ({
  lesson,
  currentTime,
  isPlaying,
  isLoadingAi = false,
  liveBoDialogue,
  isQuizCollapsedToChat = false,
  onToggleCollapseQuiz,
  onSendContextualQuestion,
  onQuickReaction,
  onTogglePlay,
  onSeek,
  onTriggerFreeze,
  onJumpToCheckpoint,
  onSwitchVideoLesson,
  onAnswerCheckpoint,
  onSubmitRebuttal,
  onResumeVideo,
  onSkipCheckpoint,
}) => {
  const defaultYtId = lesson.youtubeId || extractYouTubeId(lesson.videoUrl) || 'phvpqxLNTUQ';
  const [activeYoutubeId, setActiveYoutubeId] = useState<string>(defaultYtId);

  const [internalPhase, setInternalPhase] = useState<VideoCheckpointPhase>('WATCHING');
  const [rebuttalFeedback, setRebuttalFeedback] = useState<string | null>(null);
  const [customRebuttal, setCustomRebuttal] = useState<string>('');

  const [isOverlayDrawerOpen, setIsOverlayDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'chapters' | 'transcript'>('chapters');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Giơ tay hỏi theo ngữ cảnh từ mock blu1606
  const [isRaiseHandModalOpen, setIsRaiseHandModalOpen] = useState<boolean>(false);
  const [raiseHandCustomText, setRaiseHandCustomText] = useState<string>('');
  const [reactionToast, setReactionToast] = useState<string | null>(null);

  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('https://www.youtube.com/watch?v=phvpqxLNTUQ');

  const ytPlayerRef = useRef<any>(null);
  const playerContainerId = useRef<string>(`yt-player-${Math.random().toString(36).slice(2, 8)}`);
  const hasAutoPausedAtCheckpointRef = useRef<boolean>(false);

  useEffect(() => {
    const newYtId = lesson.youtubeId || extractYouTubeId(lesson.videoUrl) || 'phvpqxLNTUQ';
    setActiveYoutubeId(newYtId);
    setInternalPhase('WATCHING');
    setRebuttalFeedback(null);
    onToggleCollapseQuiz?.(false);
    hasAutoPausedAtCheckpointRef.current = false;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById({ videoId: newYtId, startSeconds: 0 });
    }
  }, [lesson.id, lesson.youtubeId, lesson.videoUrl]);

  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
      ytPlayerRef.current = new window.YT.Player(playerContainerId.current, {
        videoId: activeYoutubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === 1) {
              const sec = Math.floor(ytPlayerRef.current?.getCurrentTime?.() || 0);
              if (sec < lesson.checkpointTimestamp - 2) {
                hasAutoPausedAtCheckpointRef.current = false;
              }
              if (!isPlaying) onTogglePlay();
            } else if (event.data === 2 && isPlaying) {
              onTogglePlay();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => initPlayer();
    }
  }, [activeYoutubeId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (
        ytPlayerRef.current &&
        typeof ytPlayerRef.current.getCurrentTime === 'function' &&
        typeof ytPlayerRef.current.getPlayerState === 'function'
      ) {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) {
          const sec = Math.floor(ytPlayerRef.current.getCurrentTime());
          onSeek(sec);

          if (sec < lesson.checkpointTimestamp - 2) {
            hasAutoPausedAtCheckpointRef.current = false;
          }

          if (
            sec >= lesson.checkpointTimestamp &&
            sec <= lesson.checkpointTimestamp + 4 &&
            !hasAutoPausedAtCheckpointRef.current
          ) {
            hasAutoPausedAtCheckpointRef.current = true;
            ytPlayerRef.current.pauseVideo();
            sound.playBubblePop();
            setInternalPhase('CHECKPOINT_REACHED');
            setIsOverlayDrawerOpen(false);
            onToggleCollapseQuiz?.(false);
            onJumpToCheckpoint();
          }
        }
      }
    }, 400);
    return () => clearInterval(timer);
  }, [lesson.checkpointTimestamp, onSeek, onJumpToCheckpoint]);

  const handleSeekBoth = (targetSec: number) => {
    sound.playPencilTap();
    const validSec = Math.max(0, targetSec);
    if (validSec < lesson.checkpointTimestamp - 2) {
      hasAutoPausedAtCheckpointRef.current = false;
    }
    onSeek(validSec);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(validSec, true);
    }
  };

  const handleTriggerCheckpointNow = () => {
    hasAutoPausedAtCheckpointRef.current = true;
    setIsOverlayDrawerOpen(false);
    setIsRaiseHandModalOpen(false);
    onToggleCollapseQuiz?.(false);
    handleSeekBoth(lesson.checkpointTimestamp);
    if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
    setInternalPhase('CHECKPOINT_REACHED');
    onJumpToCheckpoint();
  };

  const handleSelectQuizOption = (opt: {
    id: string;
    label: string;
    isStandardBest: boolean;
    feedback: string;
  }) => {
    sound.playPencilTap();
    setRebuttalFeedback(null);
    setInternalPhase('BO_DEBATE');
    onAnswerCheckpoint?.(cleanText(opt.label));
  };

  const handleStickerClick = (sticker: RebuttalSticker) => {
    sound.playStampThud();
    setRebuttalFeedback(cleanText(sticker.feedback));
    if (sticker.isEffective) {
      sound.playSuccessChime();
      setInternalPhase('BO_CONCEDED');
    }
    onSubmitRebuttal?.(cleanText(sticker.text), sticker.isEffective);
  };

  const handleCustomRebuttalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRebuttal.trim()) return;
    sound.playStampThud();
    sound.playSuccessChime();
    setInternalPhase('BO_CONCEDED');
    onSubmitRebuttal?.(customRebuttal.trim(), true);
    setCustomRebuttal('');
  };

  const handleResumeAfterQuiz = () => {
    hasAutoPausedAtCheckpointRef.current = true;
    setInternalPhase('WATCHING');
    onToggleCollapseQuiz?.(false);
    setRebuttalFeedback(null);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      ytPlayerRef.current.seekTo(lesson.checkpointTimestamp + 5, true);
      ytPlayerRef.current.playVideo();
    }
    onResumeVideo?.();
  };

  const handleSendRaiseHandQuestion = (questionText: string) => {
    if (!questionText.trim()) return;
    sound.playBubblePop();
    onSendContextualQuestion?.(questionText.trim());
    setRaiseHandCustomText('');
    setIsRaiseHandModalOpen(false);
    onTriggerFreeze();
  };

  const handleReactionClick = (type: 'understood' | 'confused') => {
    sound.playPencilTap();
    onQuickReaction?.(type);
    if (type === 'understood') {
      setReactionToast('Đã ghi nhận: Bạn nắm vững đoạn này');
    } else {
      setReactionToast('Trợ giảng An & Minh Khang đã ghim hỗ trợ bên cột phải');
      if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
      onTriggerFreeze();
    }
    setTimeout(() => setReactionToast(null), 2600);
  };

  const handleApplyYoutubeLink = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYouTubeId(inputUrl);
    if (!ytId) return;
    setActiveYoutubeId(ytId);
    const matchedLesson = VIDEO_LESSON_LIBRARY.find((l) => l.youtubeId === ytId || l.id === 'VID_VECTO_12');
    if (matchedLesson && onSwitchVideoLesson) {
      onSwitchVideoLesson({ ...matchedLesson, youtubeId: ytId, videoUrl: inputUrl });
    }
    setIsAttachModalOpen(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const chapters = lesson.chapters || [];
  const transcriptCues = lesson.transcriptCues || [];
  const currentChapter = [...chapters].reverse().find((ch) => currentTime >= ch.startSecond) || chapters[0];
  const filteredCues = transcriptCues.filter(
    (c) =>
      cleanText(c.text).toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleanText(c.formula).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const boDebateSpeech = cleanText(liveBoDialogue || lesson.boArgument.speech);
  const isCheckpointActive =
    internalPhase === 'CHECKPOINT_REACHED' ||
    internalPhase === 'BO_DEBATE' ||
    internalPhase === 'BO_CONCEDED' ||
    internalPhase === 'CO_LAM_CLOSURE';

  const showFullQuizOverlay = isCheckpointActive && !isQuizCollapsedToChat && !isOverlayDrawerOpen && !isRaiseHandModalOpen;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#111614] rounded-xl overflow-hidden border border-[#C9B99F] shadow-sm">
      {/* 1. VÙNG VIDEO YOUTUBE + CÁC LỚP OVERLAY THÔNG MINH */}
      <div className="relative flex-1 w-full bg-black overflow-hidden">
        <div id={playerContainerId.current} className="w-full h-full" />

        {/* Toast phản hồi nhanh khi bấm [Đã hiểu] / [Chưa rõ] */}
        {reactionToast && (
          <div className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-full yt-frosted-glass text-white text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>{reactionToast}</span>
          </div>
        )}

        {/* PILL NỔI KHI THU GỌN CÂU HỎI XUỐNG CHAT (TÍNH NĂNG ĐỘT PHÁ TỪ MOCK BLU1606) */}
        {isCheckpointActive && isQuizCollapsedToChat && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 yt-frosted-glass text-white px-3.5 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap">
            <span className="flex items-center gap-1.5 font-semibold text-[#F5D65D]">
              <ClockWaitSvg className="w-3.5 h-3.5 text-[#F5D65D]" />
              <span>Câu hỏi đang chờ ({formatTime(lesson.checkpointTimestamp)})</span>
            </span>

            <span className="text-white/25">|</span>

            <button
              type="button"
              onClick={() => {
                handleSeekBoth(Math.max(0, lesson.checkpointTimestamp - 30));
                if (ytPlayerRef.current?.playVideo) ytPlayerRef.current.playVideo();
              }}
              className="hover:text-[#7DD3FC] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Rewind30sSvg className="w-3.5 h-3.5" />
              <span>Lùi 30 giây</span>
            </button>

            <span className="text-white/25">|</span>

            <button
              type="button"
              onClick={() => {
                sound.playBubblePop();
                if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
                onToggleCollapseQuiz?.(false);
              }}
              className="px-2.5 py-0.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#081C15] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <SearchMagnifierIcon className="w-3 h-3" />
              <span>Mở lại câu hỏi</span>
            </button>
          </div>
        )}

        {/* MODAL GIƠ TAY HỎI THEO NGỮ CẢNH ĐOẠN VIDEO (CONTEXTUAL RAISE HAND DIALOG) */}
        {isRaiseHandModalOpen && (
          <div className="absolute inset-x-4 bottom-4 z-30 dre-frosted-light text-[#1E242B] rounded-2xl p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/40 flex items-center justify-center">
                  <HandStopIcon className="w-4 h-4 text-[#D97706]" />
                </span>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#1E242B]">
                    Bạn đang hỏi về đoạn [{formatTime(currentTime)}] · {cleanText(currentChapter?.title || 'Ví dụ 3 hình lập phương')}
                  </h4>
                  <p className="text-[11px] text-[#6E6254]">
                    Chọn nhanh câu hỏi thường gặp hoặc tự gõ thắc mắc để cả nhóm và Trợ giảng An giải đáp:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRaiseHandModalOpen(false)}
                className="w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 text-xs font-bold cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Tại sao độ dài tổng hai vectơ không bằng tổng hai độ dài (1 + 1 = 2)?",
                "Quy tắc thế vectơ DD' thành CC' trong hình lập phương dùng như thế nào?"
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendRaiseHandQuestion(q)}
                  className="p-2.5 rounded-xl bg-white hover:bg-[#EBF7F3] border border-[#D8CEBC] hover:border-[#2E6859] text-left text-xs font-medium text-[#1E242B] cursor-pointer transition-all flex items-start gap-2"
                >
                  <TagArgumentIcon className="w-3.5 h-3.5 text-[#1B4338] shrink-0 mt-0.5" />
                  <span className="leading-snug">“{q}”</span>
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendRaiseHandQuestion(raiseHandCustomText);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={raiseHandCustomText}
                onChange={(e) => setRaiseHandCustomText(e.target.value)}
                placeholder={`Nhập câu hỏi của bạn tại mốc [${formatTime(currentTime)}]...`}
                className="flex-1 px-3 py-2 bg-white border border-[#D8CEBC] rounded-xl text-xs outline-none focus:border-[#1B4338]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs rounded-xl cursor-pointer shrink-0"
              >
                Gửi vào lớp ➔
              </button>
            </form>
          </div>
        )}

        {/* KHAY KÍNH MỜ "PHÂN CẢNH (CÓ THUMBNAIL YOUTUBE THẬT) | BẢN CHÉP LỜI" */}
        {isOverlayDrawerOpen && (
          <div className="absolute top-3 bottom-3 right-3 w-[320px] sm:w-[350px] bg-[#121615]/92 backdrop-blur-2xl text-white rounded-2xl border border-white/10 shadow-2xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-3 duration-150">
            <div className="px-4 pt-3.5 pb-3 border-b border-white/10 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[13px] text-white/95 tracking-tight">
                  Nội dung bài giảng
                </span>
                <button
                  type="button"
                  onClick={() => setIsOverlayDrawerOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs cursor-pointer flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.07] border border-white/[0.06] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setDrawerTab('chapters')}
                  className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                    drawerTab === 'chapters'
                      ? 'bg-white text-[#121615] font-semibold shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Phân cảnh ({chapters.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('transcript')}
                  className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                    drawerTab === 'transcript'
                      ? 'bg-white text-[#121615] font-semibold shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Bản chép lời
                </button>
              </div>

              {drawerTab === 'transcript' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 text-xs">
                  <SearchMagnifierIcon className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm công thức, lời giảng..."
                    className="bg-transparent outline-none w-full text-xs text-white placeholder-white/40"
                  />
                </div>
              )}
            </div>

            {drawerTab === 'chapters' && (
              <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-2">
                {chapters.map((ch, idx) => {
                  const isCurrentChap = currentChapter?.id === ch.id;
                  const cleanTitle = cleanText(ch.title).replace(/^\d+\.\s*/, '');
                  const ytThumbUrl = `https://img.youtube.com/vi/${activeYoutubeId}/hqdefault.jpg`;

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        handleSeekBoth(ch.startSecond);
                        if (ch.hasCheckpoint) handleTriggerCheckpointNow();
                      }}
                      className={`w-full text-left p-2 rounded-xl cursor-pointer transition-all flex items-center gap-3 group ${
                        isCurrentChap
                          ? 'bg-white/[0.14] ring-2 ring-[#10B981]'
                          : 'hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="relative w-20 h-12 rounded-lg bg-black/60 overflow-hidden shrink-0 border border-white/15">
                        <img
                          src={ytThumbUrl}
                          alt={cleanTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 opacity-85 group-hover:opacity-100"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[9px] font-bold text-white">
                          {formatTime(ch.startSecond)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs leading-snug line-clamp-2 ${
                            isCurrentChap ? 'font-bold text-white' : 'font-medium text-white/85 group-hover:text-white'
                          }`}
                        >
                          <span className="text-[#10B981] font-mono mr-1">{idx + 1}.</span>
                          {cleanTitle}
                        </div>

                        {ch.formulaPreview && (
                          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white/[0.08] font-mono text-[10px] text-[#F5D65D]">
                            <span>{cleanText(ch.formulaPreview)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {drawerTab === 'transcript' && (
              <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-1">
                {filteredCues.map((cue) => {
                  const isActive = currentTime >= cue.start && currentTime <= cue.end;
                  return (
                    <button
                      key={cue.id}
                      type="button"
                      onClick={() => {
                        handleSeekBoth(cue.start);
                        if (cue.tag === 'checkpoint') handleTriggerCheckpointNow();
                      }}
                      className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive ? 'bg-white/[0.14] ring-1 ring-white/20' : 'hover:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`font-mono text-[11px] shrink-0 mt-0.5 ${
                          isActive ? 'text-[#34D399] font-semibold' : 'text-white/45'
                        }`}
                      >
                        {formatTime(cue.start)}
                      </span>
                      <div className="flex-1 min-w-0 leading-relaxed text-white/90 text-xs">
                        <p className={isActive ? 'text-white font-medium' : 'text-white/80'}>
                          {cleanText(cue.text)}
                        </p>
                        {cue.formula && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.06] border border-white/10 rounded-md font-mono text-[10px] text-[#F5D65D]">
                            <span>{cleanText(cue.formula)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* THẺ CÂU HỎI DỪNG TẠI 37:13 (TÍCH HỢP NÚT [THU XUỐNG CHAT · XEM VIDEO] TỪ MOCK BLU1606) */}
        {showFullQuizOverlay && (
          <div className="absolute inset-x-4 bottom-4 z-20 dre-frosted-light text-[#1E242B] rounded-xl p-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-2 mb-2.5">
              <span className="px-2.5 py-1 rounded-full bg-[#1B4338] text-white font-semibold text-xs flex items-center gap-1.5">
                <BoltCheckpointIcon className="w-3.5 h-3.5 text-[#F5D65D]" />
                <span>
                  {internalPhase === 'CHECKPOINT_REACHED' && `Câu hỏi dừng tại [${formatTime(lesson.checkpointTimestamp)}]`}
                  {internalPhase === 'BO_DEBATE' && 'Bo phản biện lựa chọn của bạn'}
                  {(internalPhase === 'BO_CONCEDED' || internalPhase === 'CO_LAM_CLOSURE') && 'Chốt quy tắc trọng tâm'}
                </span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    onToggleCollapseQuiz?.(true);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#EBF7F3] hover:bg-[#D5EFE6] border border-[#2E6859]/40 text-[#1B4338] font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <CollapseToChatSvg className="w-3.5 h-3.5 text-[#1B4338]" />
                  <span>Thu xuống chat · xem video</span>
                </button>
                {internalPhase === 'CHECKPOINT_REACHED' && (
                  <button
                    type="button"
                    onClick={onSkipCheckpoint || handleResumeAfterQuiz}
                    className="text-xs font-medium text-[#6E6254] hover:text-black underline cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                )}
              </div>
            </div>

            {internalPhase === 'CHECKPOINT_REACHED' && (
              <div className="space-y-2.5">
                <p className="font-semibold text-xs sm:text-sm text-[#142923] leading-relaxed">
                  {cleanText(lesson.checkpointQuestion.prompt)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {lesson.checkpointQuestion.options.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectQuizOption(opt)}
                      className="p-2.5 rounded-lg border border-black/15 bg-white hover:bg-[#F4FBF8] hover:border-[#2E6859] text-left text-xs font-medium transition-all cursor-pointer flex items-start gap-2 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#1B4338] text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                        {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                      </span>
                      <span className="leading-snug text-[#1E242B]">{cleanText(opt.label)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {internalPhase === 'BO_DEBATE' && (
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#FFF9EB] border border-[#E8A33D]/50">
                  <BoAvatar size="sm" expression="skeptical" className="shrink-0 scale-90" />
                  <div className="text-xs text-[#2F2923] leading-relaxed">
                    <span className="font-bold text-[#8C5D19] mr-1">Bo thắc mắc:</span>
                    “{boDebateSpeech}”
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {lesson.rebuttalStickers.map((stk) => (
                    <button
                      key={stk.id}
                      type="button"
                      disabled={isLoadingAi}
                      onClick={() => handleStickerClick(stk)}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-white hover:bg-[#EDF7F4] border border-[#4E9B87] text-xs font-medium text-[#1E3B33] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2 leading-snug">
                        <TagArgumentIcon className="w-3.5 h-3.5 text-[#2E6859] shrink-0" />
                        <span>“{cleanText(stk.text)}”</span>
                      </span>
                      <span className="text-[11px] font-semibold text-[#2E6859] shrink-0">Gửi ➔</span>
                    </button>
                  ))}
                </div>

                {rebuttalFeedback && (
                  <div className="text-xs text-[#8C5D19] font-medium">
                    {rebuttalFeedback}
                  </div>
                )}

                <form onSubmit={handleCustomRebuttalSubmit} className="flex gap-1.5">
                  <input
                    type="text"
                    value={customRebuttal}
                    onChange={(e) => setCustomRebuttal(e.target.value)}
                    placeholder="Hoặc tự nhập lập luận toán học của bạn..."
                    className="flex-1 px-3 py-1.5 bg-white border border-black/15 rounded-lg text-xs outline-none focus:border-[#2E6859]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#1B4338] text-white font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Gửi
                  </button>
                </form>
              </div>
            )}

            {(internalPhase === 'BO_CONCEDED' || internalPhase === 'CO_LAM_CLOSURE') && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <RubberStampSuccess className="scale-75 shrink-0" />
                  <span className="font-semibold text-xs text-[#1B4338]">
                    {cleanText(lesson.teacherClosure.goldenRule)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResumeAfterQuiz}
                  className="px-4 py-1.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs rounded-lg cursor-pointer shrink-0"
                >
                  Tiếp tục bài giảng
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. THANH BAR ĐÁY VIDEO: PHÂN CẢNH + PHẢN XẠ NHANH + CÂU HỎI DỪNG + GIƠ TAY HỎI */}
      <div className="bg-[#161D1A] px-3 py-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsOverlayDrawerOpen((prev) => {
                const next = !prev;
                if (next) setIsRaiseHandModalOpen(false);
                return next;
              });
            }}
            className={`px-3 py-1 rounded-full font-medium text-xs flex items-center gap-1.5 border cursor-pointer transition-all max-w-[230px] ${
              isOverlayDrawerOpen
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
          >
            <ChaptersBookIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {currentChapter ? cleanText(currentChapter.title) : 'Nội dung bài giảng'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsAttachModalOpen(true)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0"
          >
            <LinkChainIcon className="w-3.5 h-3.5 text-[#F5D65D]" />
            <span>Đổi link</span>
          </button>
        </div>

        {/* Cụm phải: Phản xạ nhanh (Đã hiểu / Chưa rõ) + Câu hỏi dừng + Giơ tay hỏi */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleReactionClick('understood')}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Đã hiểu đoạn này"
          >
            <ThumbUpReactionSvg className="w-3.5 h-3.5 text-[#34D399]" />
            <span className="hidden xl:inline">Đã hiểu</span>
          </button>

          <button
            type="button"
            onClick={() => handleReactionClick('confused')}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Chưa rõ đoạn này"
          >
            <ConfusedReactionSvg className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span className="hidden xl:inline">Chưa rõ</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerCheckpointNow}
            className="px-3 py-1 rounded-full bg-[#E8A33D] hover:bg-[#D9932B] text-[#1A140B] font-semibold text-xs cursor-pointer flex items-center gap-1"
          >
            <BoltCheckpointIcon className="w-3.5 h-3.5" />
            <span>Câu hỏi dừng ({formatTime(lesson.checkpointTimestamp)})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playPencilTap();
              if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
              setIsOverlayDrawerOpen(false);
              setIsRaiseHandModalOpen((prev) => !prev);
            }}
            className={`px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
              isRaiseHandModalOpen
                ? 'bg-[#D97706] text-white'
                : 'bg-white/95 hover:bg-white text-[#1E242B]'
            }`}
          >
            <HandStopIcon className={`w-3.5 h-3.5 ${isRaiseHandModalOpen ? 'text-white' : 'text-[#D97706]'}`} />
            <span>Giơ tay</span>
          </button>
        </div>
      </div>

      {/* Modal Dán link YouTube */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-[#E2D9C8] rounded-xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-2">
              <h3 className="font-bold text-base text-[#1E242B]">Dán link YouTube bài giảng</h3>
              <button type="button" onClick={() => setIsAttachModalOpen(false)} className="text-sm font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleApplyYoutubeLink} className="space-y-3">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=phvpqxLNTUQ"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D8CEBC] rounded-lg font-mono text-xs outline-none focus:border-[#1B4338]"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#1B4338] text-white font-semibold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircleIcon className="w-4 h-4 text-white" />
                <span>Phát Video & Đồng bộ kịch bản</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
