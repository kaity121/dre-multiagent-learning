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

  // Mặc định khởi đầu ở trạng thái WATCHING
  const [internalPhase, setInternalPhase] = useState<VideoCheckpointPhase>(phase || 'WATCHING');
  const [, setSelectedOption] = useState<{
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
  // Cờ kiểm soát tự động dừng đúng 1 lần khi chạm mốc checkpoint (tránh lặp vô hạn sau khi bấm Xem tiếp)
  const hasAutoPausedAtCheckpointRef = useRef<boolean>(false);

  // Luôn đồng bộ khi prop phase thay đổi từ App.tsx
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
            // Khi học sinh bấm Play trên YouTube
            if (event.data === 1) {
              const sec = Math.floor(ytPlayerRef.current?.getCurrentTime?.() || 0);
              // Chỉ reset về WATCHING khi học sinh tua về trước mốc checkpoint ít nhất 3 giây!
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

  // BỘ RÌNH BẮT GIÂY THẬT TỪ YOUTUBE (Mỗi 400ms): Chạm mốc 37:13 là TỰ ĐỘNG DỪNG VIDEO NGAY!
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

          // Nếu học sinh tua về trước mốc checkpoint -> Cho phép tự dừng lại khi chạm mốc
          if (sec < lesson.checkpointTimestamp - 3) {
            hasAutoPausedAtCheckpointRef.current = false;
          }

          // KÍCH HOẠT TỰ ĐỘNG DỪNG KHI CHẠM MỐC CHECKPOINT (37:13 -> 37:16)
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

  // Khi bấm nút "Tới câu hỏi 37:13"
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

  // Pha hoạt động: ưu tiên trạng thái nào khác WATCHING
  const activePhase = internalPhase !== 'WATCHING' ? internalPhase : (phase !== 'WATCHING' ? phase : 'WATCHING');
  const isCheckpointActive =
    activePhase === 'CHECKPOINT_REACHED' ||
    activePhase === 'BO_DEBATE' ||
    activePhase === 'BO_CONCEDED' ||
    activePhase === 'CO_LAM_CLOSURE';
  const showQuizOverlay = isCheckpointActive && !isQuizMinimized && !isOverlayDrawerOpen;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#111614] rounded-xl overflow-hidden border border-[#C9B99F] shadow-sm">
      {/* ========================================================================= */}
      {/* 1. VÙNG VIDEO YOUTUBE SẠCH 100% (KHÔNG VẼ NÚT ĐÈ LÊN CHỮ CỦA YOUTUBE!)    */}
      {/* ========================================================================= */}
      <div className="relative flex-1 w-full bg-black overflow-hidden">
        <div id={playerContainerId.current} className="w-full h-full" />

        {/* KHAY KÍNH MỜ "PHÂN CẢNH | BẢN CHÉP LỜI" */}
        {isOverlayDrawerOpen && (
          <div className="absolute top-2 bottom-2 right-2 w-[290px] sm:w-[320px] yt-frosted-glass text-white rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-3 duration-150">
            <div className="p-2.5 border-b border-white/10 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white/95">Trong video này</span>
                <button
                  type="button"
                  onClick={() => setIsOverlayDrawerOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDrawerTab('chapters')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                    drawerTab === 'chapters' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  Phân cảnh ({chapters.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('transcript')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                    drawerTab === 'transcript' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  Bản chép lời
                </button>
              </div>

              {drawerTab === 'transcript' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs">
                  <span className="opacity-70">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm công thức, lời giảng..."
                    className="bg-transparent outline-none w-full text-xs text-white placeholder-white/50"
                  />
                </div>
              )}
            </div>

            {drawerTab === 'chapters' && (
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1 text-xs">
                {chapters.map((ch) => {
                  const isCurrentChap = currentChapter?.id === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        handleSeekBoth(ch.startSecond);
                        if (ch.hasCheckpoint) handleTriggerCheckpointNow();
                      }}
                      className={`p-2 rounded-lg cursor-pointer transition-all flex items-center gap-2.5 ${
                        isCurrentChap ? 'bg-white/20 border-l-3 border-[#F5D65D]' : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="w-14 h-9 rounded bg-black/50 border border-white/15 text-[#F5D65D] font-mono text-[10px] font-bold flex items-center justify-center text-center p-1 shrink-0">
                        {cleanText(ch.formulaPreview) || formatTime(ch.startSecond)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white/95 leading-snug text-xs truncate">
                          {cleanText(ch.title)}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-[#38BDF8]/20 text-[#7DD3FC] font-mono text-[10px] font-bold">
                          {formatTime(ch.startSecond)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {drawerTab === 'transcript' && (
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1 text-xs">
                {filteredCues.map((cue) => {
                  const isActive = currentTime >= cue.start && currentTime <= cue.end;
                  return (
                    <div
                      key={cue.id}
                      onClick={() => {
                        handleSeekBoth(cue.start);
                        if (cue.tag === 'checkpoint') handleTriggerCheckpointNow();
                      }}
                      className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        isActive ? 'bg-white/20 border-l-3 border-[#38BDF8]' : 'hover:bg-white/10'
                      }`}
                    >
                      <span className="px-1.5 py-0.5 rounded bg-[#38BDF8]/20 text-[#7DD3FC] font-mono text-[10px] font-bold shrink-0">
                        {formatTime(cue.start)}
                      </span>
                      <div className="flex-1 leading-snug text-white/90 text-xs">
                        <span>{cleanText(cue.text)}</span>
                        {cue.formula && (
                          <div className="mt-1 px-2 py-0.5 bg-black/40 border border-[#F5D65D]/40 rounded font-mono text-[10px] font-bold text-[#F5D65D]">
                            📐 {cleanText(cue.formula)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* THẺ QUIZ NỔI TRONG SUỐT KHI VIDEO DỪNG TẠI 37:13 */}
        {showQuizOverlay && (
          <div className="absolute inset-x-4 bottom-4 z-20 dre-frosted-light text-[#2F2923] rounded-xl p-3.5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/10 pb-1.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F5D65D] text-[#2F2923] font-handwriting font-bold text-xs">
                {activePhase === 'CHECKPOINT_REACHED' && `⚡ Điểm dừng kiểm tra độ tập trung [${formatTime(lesson.checkpointTimestamp)}]`}
                {activePhase === 'BO_DEBATE' && '⚔️ Bo nhảy vào phản đối lựa chọn của em!'}
                {(activePhase === 'BO_CONCEDED' || activePhase === 'CO_LAM_CLOSURE') && '🌟 Đã thông suốt bản chất!'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuizMinimized(true)}
                  className="px-2.5 py-0.5 rounded-full bg-black/10 hover:bg-black/15 text-[#2F2923] font-handwriting font-bold text-xs cursor-pointer"
                  title="Tạm ẩn để nhìn bảng thầy"
                >
                  👁️ Nhìn bảng thầy
                </button>
                {activePhase === 'CHECKPOINT_REACHED' && (
                  <button
                    type="button"
                    onClick={onSkipCheckpoint || handleResumeAfterQuiz}
                    className="text-xs font-handwriting text-[#6E6254] hover:text-black underline cursor-pointer"
                  >
                    Bỏ qua ➔
                  </button>
                )}
              </div>
            </div>

            {activePhase === 'CHECKPOINT_REACHED' && (
              <div className="space-y-2">
                <p className="font-bold text-xs sm:text-sm text-[#1E3B33] leading-snug">
                  {cleanText(lesson.checkpointQuestion.prompt)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {lesson.checkpointQuestion.options.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectQuizOption(opt)}
                      className="p-2.5 rounded-lg border border-black/15 bg-white hover:bg-[#FFF8EB] hover:border-[#E8A33D] text-left text-xs font-handwriting transition-all cursor-pointer flex items-start gap-2 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#EFE8DA] text-[#3B3026] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                      </span>
                      <span className="leading-snug text-[#2F2923]">{cleanText(opt.label)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activePhase === 'BO_DEBATE' && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-[#FFF8EB] border border-[#E8A33D]/60">
                  <BoAvatar size="sm" expression="skeptical" className="shrink-0 scale-90" />
                  <div className="text-xs font-handwriting text-[#3E342B] leading-snug">
                    <span className="font-bold text-[#8C5D19] mr-1">🧒 Bo cãi:</span>
                    “{boDebateSpeech}”
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {lesson.rebuttalStickers.map((stk) => (
                    <button
                      key={stk.id}
                      type="button"
                      disabled={isLoadingAi}
                      onClick={() => handleStickerClick(stk)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#EDF7F4] border border-[#4E9B87] text-xs font-handwriting text-[#1E3B33] flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="leading-snug">🏷️ “{cleanText(stk.text)}”</span>
                      <span className="text-[10px] font-mono font-bold text-[#2E6859] shrink-0">Phản biện ➔</span>
                    </button>
                  ))}
                </div>

                {rebuttalFeedback && (
                  <div className="text-[11px] font-handwriting text-[#8C5D19] font-bold">
                    💡 {rebuttalFeedback}
                  </div>
                )}

                <form onSubmit={handleCustomRebuttalSubmit} className="flex gap-1.5">
                  <input
                    type="text"
                    value={customRebuttal}
                    onChange={(e) => setCustomRebuttal(e.target.value)}
                    placeholder="Hoặc tự gõ lý lẽ của em..."
                    className="flex-1 px-2.5 py-1 bg-white border border-black/15 rounded-lg text-xs font-handwriting outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#E8A33D] text-black font-handwriting font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Gửi
                  </button>
                </form>
              </div>
            )}

            {(activePhase === 'BO_CONCEDED' || activePhase === 'CO_LAM_CLOSURE') && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <RubberStampSuccess className="scale-75 shrink-0" />
                  <span className="font-handwriting font-bold text-xs text-[#2E6859]">
                    {cleanText(lesson.teacherClosure.goldenRule)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResumeAfterQuiz}
                  className="px-3.5 py-1.5 bg-[#4E9B87] text-white font-handwriting font-bold text-xs rounded-lg cursor-pointer shrink-0"
                >
                  Phát tiếp video ➔
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. THANH BAR TỐI GIẢN NẰM DƯỚI CHÂN VIDEO (KHÔNG BAO GIỜ CHE YOUTUBE!)    */}
      {/* ========================================================================= */}
      <div className="bg-[#18201D] px-3 py-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs shrink-0">
        {/* Trái: Nút mở Phân cảnh & Bản chép lời + Đổi link */}
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
            className={`px-3 py-1 rounded-full font-medium text-xs flex items-center gap-1.5 border cursor-pointer transition-all max-w-[270px] ${
              isOverlayDrawerOpen
                ? 'bg-white text-black border-white font-bold'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
          >
            <span className="truncate">
              📖 {currentChapter ? cleanText(currentChapter.title) : 'Phân cảnh & Bản chép lời'}
            </span>
            <span className="font-bold shrink-0">❯</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAttachModalOpen(true)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/85 border border-white/10 text-[11px] font-handwriting flex items-center gap-1 cursor-pointer shrink-0"
          >
            <LinkChainIcon className="w-3 h-3 text-[#F5D65D]" />
            <span>Đổi link</span>
          </button>
        </div>

        {/* Phải: Nút Tua sát 37:10 (để xem video tự dừng ở 37:13) + Mở Quiz + Khoan đã cô ơi */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              // Tua tới trước mốc dừng 3 giây (37:10) và phát để Giám khảo thấy tới 37:13 video TỰ ĐỘNG DỪNG!
              hasAutoPausedAtCheckpointRef.current = false;
              setInternalPhase('WATCHING');
              setIsOverlayDrawerOpen(false);
              const preRoll = Math.max(0, lesson.checkpointTimestamp - 3);
              handleSeekBoth(preRoll);
              if (ytPlayerRef.current?.playVideo) ytPlayerRef.current.playVideo();
            }}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#8CE6CF] border border-[#4E9B87]/50 font-handwriting text-[11px] cursor-pointer hidden sm:inline-block"
            title="Phát từ 37:10 để xem đến đúng 37:13 video tự động dừng và bật câu hỏi"
          >
            ▶ Thử tự dừng (37:10 ➔ 37:13)
          </button>

          <button
            type="button"
            onClick={() => {
              if (isQuizMinimized) {
                setIsQuizMinimized(false);
              } else {
                handleTriggerCheckpointNow();
              }
            }}
            className="px-2.5 py-1 rounded-full bg-[#E8A33D] hover:bg-[#D9932B] text-black font-handwriting font-bold text-xs cursor-pointer shadow-xs"
          >
            ⚡ {isQuizMinimized ? 'Mở lại câu hỏi' : 'Câu hỏi'} ({formatTime(lesson.checkpointTimestamp)})
          </button>

          <button
            type="button"
            onClick={() => {
              if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
              onTriggerFreeze();
            }}
            className="px-2.5 py-1 rounded-full bg-[#FFF8EB] hover:bg-white text-[#7B4E12] font-handwriting font-bold text-xs border border-[#E8A33D] flex items-center gap-1 cursor-pointer"
          >
            <HandStopIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
            <span>Khoan đã cô!</span>
          </button>
        </div>
      </div>

      {/* Modal Dán link YouTube */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8DFD0] pb-2">
              <h3 className="font-handwriting font-bold text-lg text-[#2F2923]">Dán link YouTube bài giảng</h3>
              <button type="button" onClick={() => setIsAttachModalOpen(false)} className="text-sm font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleApplyYoutubeLink} className="space-y-2.5">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=phvpqxLNTUQ"
                className="w-full px-3 py-2 bg-white border border-[#D8CEBC] rounded-lg font-mono text-xs outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#4E9B87] text-white font-handwriting font-bold text-sm rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircleIcon className="w-4 h-4 text-white" />
                <span>Phát Video & Đồng bộ ➔</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
