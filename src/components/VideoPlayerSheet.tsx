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
// BỘ ICON SVG TỰ THIẾT KẾ ĐỘC QUYỀN (ZERO KEYBOARD EMOJI)
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

const EyeBoardIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M2.5 12C4.2 7.6 7.8 5 12 5C16.2 5 19.8 7.6 21.5 12C19.8 16.4 16.2 19 12 19C7.8 19 4.2 16.4 2.5 12Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const SearchMagnifierIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 16L20.5 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

const FormulaGeometryIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4 19.5L19.5 4V19.5H4Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
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
  phase,
  currentTime,
  isPlaying,
  isLoadingAi = false,
  liveBoDialogue,
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

  const [internalPhase, setInternalPhase] = useState<VideoCheckpointPhase>(phase || 'WATCHING');
  const [selectedOption, setSelectedOption] = useState<{
    id: string;
    label: string;
    isStandardBest: boolean;
    feedback: string;
  } | null>(null);
  const [rebuttalFeedback, setRebuttalFeedback] = useState<string | null>(null);
  const [customRebuttal, setCustomRebuttal] = useState<string>('');

  const [isOverlayDrawerOpen, setIsOverlayDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'chapters' | 'transcript'>('chapters');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isQuizMinimized, setIsQuizMinimized] = useState<boolean>(false);

  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('https://www.youtube.com/watch?v=phvpqxLNTUQ');

  const ytPlayerRef = useRef<any>(null);
  const playerContainerId = useRef<string>(`yt-player-${Math.random().toString(36).slice(2, 8)}`);
  const hasAutoPausedAtCheckpointRef = useRef<boolean>(false);

  // Đồng bộ khi prop phase thay đổi từ App.tsx
  useEffect(() => {
    if (phase) {
      setInternalPhase(phase);
      if (phase === 'CHECKPOINT_REACHED' || phase === 'BO_DEBATE') {
        setIsQuizMinimized(false);
      }
    }
  }, [phase]);

  useEffect(() => {
    const newYtId = lesson.youtubeId || extractYouTubeId(lesson.videoUrl) || 'phvpqxLNTUQ';
    setActiveYoutubeId(newYtId);
    setInternalPhase('WATCHING');
    setSelectedOption(null);
    setRebuttalFeedback(null);
    setIsQuizMinimized(false);
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
              if (sec < lesson.checkpointTimestamp - 3) {
                hasAutoPausedAtCheckpointRef.current = false;
                setInternalPhase('WATCHING');
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

  // Tự động dừng video khi chạy chạm mốc Checkpoint (37:13)
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

          if (sec < lesson.checkpointTimestamp - 3) {
            hasAutoPausedAtCheckpointRef.current = false;
          }

          if (
            sec >= lesson.checkpointTimestamp &&
            sec <= lesson.checkpointTimestamp + 4 &&
            !hasAutoPausedAtCheckpointRef.current
          ) {
            hasAutoPausedAtCheckpointRef.current = true;
            if (ytPlayerRef.current?.pauseVideo) {
              ytPlayerRef.current.pauseVideo();
            }
            sound.playBubblePop();
            setInternalPhase('CHECKPOINT_REACHED');
            setIsOverlayDrawerOpen(false);
            setIsQuizMinimized(false);
            onJumpToCheckpoint();
          }
        }
      }
    }, 400);
    return () => clearInterval(timer);
  }, [lesson.checkpointTimestamp, onSeek, onJumpToCheckpoint]);

  const handleSeekBoth = (targetSec: number) => {
    sound.playPencilTap();
    if (targetSec < lesson.checkpointTimestamp - 3) {
      hasAutoPausedAtCheckpointRef.current = false;
    }
    onSeek(targetSec);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(targetSec, true);
    }
  };

  const handleTriggerCheckpointNow = () => {
    hasAutoPausedAtCheckpointRef.current = true;
    setIsOverlayDrawerOpen(false);
    setIsQuizMinimized(false);
    setInternalPhase('CHECKPOINT_REACHED');
    handleSeekBoth(lesson.checkpointTimestamp);
    setTimeout(() => {
      if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
    }, 150);
    onJumpToCheckpoint();
  };

  const handleSelectQuizOption = (opt: {
    id: string;
    label: string;
    isStandardBest: boolean;
    feedback: string;
  }) => {
    sound.playPencilTap();
    setSelectedOption(opt);
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
    setSelectedOption(null);
    setRebuttalFeedback(null);
    setIsQuizMinimized(false);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      ytPlayerRef.current.seekTo(lesson.checkpointTimestamp + 5, true);
      ytPlayerRef.current.playVideo();
    }
    onResumeVideo?.();
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

  const activePhase = internalPhase !== 'WATCHING' ? internalPhase : (phase !== 'WATCHING' ? phase : 'WATCHING');
  const isCheckpointActive =
    activePhase === 'CHECKPOINT_REACHED' ||
    activePhase === 'BO_DEBATE' ||
    activePhase === 'BO_CONCEDED' ||
    activePhase === 'CO_LAM_CLOSURE';
  const showQuizOverlay = isCheckpointActive && !isQuizMinimized && !isOverlayDrawerOpen;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#111614] rounded-xl overflow-hidden border border-[#C9B99F] shadow-sm">
      {/* 1. VÙNG VIDEO YOUTUBE SẠCH 100% */}
      <div className="relative flex-1 w-full bg-black overflow-hidden">
        <div id={playerContainerId.current} className="w-full h-full" />

        {/* KHAY KÍNH MỜ "PHÂN CẢNH | BẢN CHÉP LỜI" — CHUẨN TỐI GIẢN COURSERA / APPLE */}
        {isOverlayDrawerOpen && (
          <div className="absolute top-3 bottom-3 right-3 w-[320px] sm:w-[350px] bg-[#121615]/90 backdrop-blur-2xl text-white rounded-2xl border border-white/10 shadow-2xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-3 duration-150">
            
            {/* Header + Segmented Pill Tabs */}
            <div className="px-4 pt-3.5 pb-3 border-b border-white/10 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[13px] text-white/95 tracking-tight">
                  Nội dung bài giảng
                </span>
                <button
                  type="button"
                  onClick={() => setIsOverlayDrawerOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs cursor-pointer flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Thanh chuyển tab dạng Segmented Control đồng bộ */}
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

            {/* TAB 1: DANH SÁCH PHÂN CẢNH TỐI GIẢN (Bỏ cục đen thô kệch, đọc trọn câu!) */}
            {drawerTab === 'chapters' && (
              <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-1">
                {chapters.map((ch, idx) => {
                  const isCurrentChap = currentChapter?.id === ch.id;
                  // Bỏ số "1. ", "2. " ở đầu chuỗi nếu đã có cột số thứ tự riêng
                  const cleanTitle = cleanText(ch.title).replace(/^\d+\.\s*/, '');

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        handleSeekBoth(ch.startSecond);
                        if (ch.hasCheckpoint) handleTriggerCheckpointNow();
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-start gap-3 group ${
                        isCurrentChap
                          ? 'bg-white/[0.14] ring-1 ring-white/20'
                          : 'hover:bg-white/[0.06]'
                      }`}
                    >
                      {/* Cột trái: Số thứ tự mảnh & hiện đại */}
                      <span
                        className={`w-5 h-5 rounded-md font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isCurrentChap
                            ? 'bg-[#10B981] text-[#0B1310] font-bold'
                            : 'bg-white/[0.08] text-white/60 group-hover:text-white/90'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {/* Cột giữa: Tên chương (Đọc trọn vẹn 2 dòng) + Pill công thức nhẹ nhàng */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs leading-snug line-clamp-2 ${
                            isCurrentChap ? 'font-semibold text-white' : 'font-medium text-white/85 group-hover:text-white'
                          }`}
                        >
                          {cleanTitle}
                        </div>

                        {ch.formulaPreview && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 font-mono text-[10px] text-white/75">
                            {ch.hasCheckpoint && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F5D65D]" />
                            )}
                            <span>{cleanText(ch.formulaPreview)}</span>
                          </div>
                        )}
                      </div>

                      {/* Cột phải: Thời gian căn lề phải sạch mắt */}
                      <span
                        className={`font-mono text-[11px] shrink-0 mt-0.5 ${
                          isCurrentChap ? 'text-[#34D399] font-semibold' : 'text-white/45 group-hover:text-white/75'
                        }`}
                      >
                        {formatTime(ch.startSecond)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 2: BẢN CHÉP LỜI TỪNG GIÂY */}
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
                        isActive
                          ? 'bg-white/[0.14] ring-1 ring-white/20'
                          : 'hover:bg-white/[0.06]'
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

        {/* THẺ QUIZ NỔI TRONG SUỐT KHI VIDEO DỪNG TẠI 37:13 */}
        {showQuizOverlay && (
          <div className="absolute inset-x-4 bottom-4 z-20 dre-frosted-light text-[#1E242B] rounded-xl p-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/10 pb-2 mb-2.5">
              <span className="px-2.5 py-1 rounded-full bg-[#1B4338] text-white font-semibold text-xs flex items-center gap-1.5">
                <BoltCheckpointIcon className="w-3.5 h-3.5 text-[#F5D65D]" />
                <span>
                  {activePhase === 'CHECKPOINT_REACHED' && `Câu hỏi dừng tại [${formatTime(lesson.checkpointTimestamp)}]`}
                  {activePhase === 'BO_DEBATE' && 'Bo phản biện lựa chọn của bạn'}
                  {(activePhase === 'BO_CONCEDED' || activePhase === 'CO_LAM_CLOSURE') && 'Chốt quy tắc trọng tâm'}
                </span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuizMinimized(true)}
                  className="px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 text-[#2F2923] font-medium text-xs cursor-pointer flex items-center gap-1"
                  title="Tạm ẩn để nhìn bảng thầy"
                >
                  <EyeBoardIcon className="w-3.5 h-3.5 text-[#2E6859]" />
                  <span>Nhìn bảng</span>
                </button>
                {activePhase === 'CHECKPOINT_REACHED' && (
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

            {activePhase === 'CHECKPOINT_REACHED' && (
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

            {activePhase === 'BO_DEBATE' && (
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

            {(activePhase === 'BO_CONCEDED' || activePhase === 'CO_LAM_CLOSURE') && (
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

      {/* 2. THANH BAR TỐI GIẢN DƯỚI CHÂN VIDEO (100% CUSTOM SVG ICON) */}
      <div className="bg-[#161D1A] px-3 py-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              setIsOverlayDrawerOpen((prev) => {
                const next = !prev;
                if (next) setIsQuizMinimized(true);
                return next;
              });
            }}
            className={`px-3 py-1 rounded-full font-medium text-xs flex items-center gap-1.5 border cursor-pointer transition-all max-w-[280px] ${
              isOverlayDrawerOpen
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
          >
            <ChaptersBookIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {currentChapter ? cleanText(currentChapter.title) : 'Phân cảnh & Bản chép lời'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsAttachModalOpen(true)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <LinkChainIcon className="w-3.5 h-3.5 text-[#F5D65D]" />
            <span>Đổi link</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isQuizMinimized) {
                setIsQuizMinimized(false);
              } else {
                handleTriggerCheckpointNow();
              }
            }}
            className="px-3 py-1 rounded-full bg-[#E8A33D] hover:bg-[#D9932B] text-[#1A140B] font-semibold text-xs cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <BoltCheckpointIcon className="w-3.5 h-3.5" />
            <span>{isQuizMinimized ? 'Mở lại câu hỏi' : 'Câu hỏi dừng'} ({formatTime(lesson.checkpointTimestamp)})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
              onTriggerFreeze();
            }}
            className="px-3 py-1 rounded-full bg-white/95 hover:bg-white text-[#1E242B] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <HandStopIcon className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Giơ tay hỏi</span>
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
