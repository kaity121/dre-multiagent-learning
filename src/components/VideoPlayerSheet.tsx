// File: src/components/VideoPlayerSheet.tsx
import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, RebuttalSticker } from '../types/dre';
import { VIDEO_LESSON_LIBRARY } from '../data/videoLessons';
import { 
  BoAvatar,
  PushPin, 
  VideoPlayIcon, 
  VideoPauseIcon, 
  HandStopIcon, 
  ChalkboardIcon, 
  LinkChainIcon, 
  RubberStampSuccess,
  GoldenStarIcon,
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

// Xóa ký tự mũi tên Unicode gây lỗi ô vuông (Tofu box)
const cleanText = (str?: string) => (str ? str.replace(/\u20d7/g, '') : '');

// Tách YouTube Video ID từ bất kỳ link YouTube nào (kể cả link có &list=...)
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
  liveCoLamDialogue,
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
  // Mặc định lấy video thầy Nguyễn Phan Tiến (phvpqxLNTUQ) làm video chính
  const defaultYtId = lesson.youtubeId || extractYouTubeId(lesson.videoUrl) || 'phvpqxLNTUQ';
  const [activeYoutubeId, setActiveYoutubeId] = useState<string>(defaultYtId);

  // State nội bộ (Local Phase Fallback) đảm bảo bấm đáp án A/B/C là chuyển sang BO_DEBATE ngay lập tức, không bao giờ bị đứng yên!
  const [internalPhase, setInternalPhase] = useState<VideoCheckpointPhase>(phase);
  const [selectedOption, setSelectedOption] = useState<{
    id: string;
    label: string;
    isStandardBest: boolean;
    feedback: string;
  } | null>(null);
  const [rebuttalFeedback, setRebuttalFeedback] = useState<string | null>(null);
  const [customRebuttal, setCustomRebuttal] = useState<string>('');

  // Khay mờ Phân cảnh & Bản chép lời đè góc phải Video
  const [isOverlayDrawerOpen, setIsOverlayDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'chapters' | 'transcript'>('chapters');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isQuizMinimized, setIsQuizMinimized] = useState<boolean>(false);

  // Modal dán link YouTube
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('https://www.youtube.com/watch?v=phvpqxLNTUQ');

  // YouTube Player API Ref để điều khiển Play / Pause / Tua từng giây thật
  const ytPlayerRef = useRef<any>(null);
  const playerContainerId = useRef<string>(`yt-player-${Math.random().toString(36).slice(2, 8)}`);
  const activeCueRef = useRef<HTMLDivElement | null>(null);

  // Đồng bộ phase từ App.tsx (nếu có thay đổi từ bên ngoài)
  useEffect(() => {
    setInternalPhase(phase);
  }, [phase]);

  // Cập nhật YouTube ID khi đổi bài học
  useEffect(() => {
    const newYtId = lesson.youtubeId || extractYouTubeId(lesson.videoUrl) || 'phvpqxLNTUQ';
    setActiveYoutubeId(newYtId);
    setSelectedOption(null);
    setRebuttalFeedback(null);
    setIsQuizMinimized(false);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById({
        videoId: newYtId,
        startSeconds: lesson.checkpointTimestamp || 0,
      });
    }
  }, [lesson.id, lesson.youtubeId, lesson.videoUrl]);

  // Khởi tạo YouTube IFrame API thật để hiện mặt thầy & giọng thầy + bắt đúng từng giây
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
          start: currentTime || 0,
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING === 1
            if (event.data === 1 && !isPlaying) {
              onTogglePlay();
            } else if (event.data === 2 && isPlaying) {
              // YT.PlayerState.PAUSED === 2
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
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }
  }, [activeYoutubeId]);

  // Poll thời gian thực từ YouTube Player mỗi 500ms để đồng bộ thanh thời gian & tự dừng ở Checkpoint!
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        ytPlayerRef.current &&
        typeof ytPlayerRef.current.getCurrentTime === 'function' &&
        typeof ytPlayerRef.current.getPlayerState === 'function'
      ) {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) {
          // Đang phát thật trên YouTube
          const sec = Math.floor(ytPlayerRef.current.getCurrentTime());
          onSeek(sec);

          // Nếu chạm mốc giây Checkpoint -> Tự động Pause video thầy Tiến và bật Quiz!
          if (
            Math.abs(sec - lesson.checkpointTimestamp) <= 1 &&
            internalPhase === 'WATCHING'
          ) {
            ytPlayerRef.current.pauseVideo();
            setInternalPhase('CHECKPOINT_REACHED');
            setIsOverlayDrawerOpen(false);
            setIsQuizMinimized(false);
            onJumpToCheckpoint();
          }
        }
      }
    }, 600);
    return () => clearInterval(timer);
  }, [lesson.checkpointTimestamp, internalPhase, onSeek, onJumpToCheckpoint]);

  // Hàm tua cả State lẫn tua trực tiếp Video YouTube của thầy Tiến!
  const handleSeekBoth = (targetSec: number) => {
    sound.playPencilTap();
    onSeek(targetSec);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(targetSec, true);
    }
  };

  // Hàm Play/Pause đồng bộ cả YouTube Player thật
  const handleTogglePlayBoth = () => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === 1) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    }
    onTogglePlay();
  };

  // XỬ LÝ KHI HỌC SINH BẤM CHỌN ĐÁP ÁN A, B, C (KHÔNG BAO GIỜ ĐỨNG YÊN NỮA!)
  const handleSelectQuizOption = (opt: {
    id: string;
    label: string;
    isStandardBest: boolean;
    feedback: string;
  }) => {
    sound.playPencilTap();
    setSelectedOption(opt);
    setRebuttalFeedback(null);

    // Chuyển ngay lập tức sang pha BO_DEBATE (Biến hình mượt tại chỗ!)
    setInternalPhase('BO_DEBATE');

    // Gọi callback lên App.tsx nếu có
    onAnswerCheckpoint?.(cleanText(opt.label));
  };

  // XỬ LÝ KHI HỌC SINH BẤM STICKER PHẢN BIỆN LẠI BO
  const handleStickerClick = (sticker: RebuttalSticker) => {
    sound.playStampThud();
    setRebuttalFeedback(cleanText(sticker.feedback));

    if (sticker.isEffective) {
      sound.playSuccessChime();
      setInternalPhase('BO_CONCEDED');
    }
    onSubmitRebuttal?.(cleanText(sticker.text), sticker.isEffective);
  };

  // XỬ LÝ KHI HỌC SINH TỰ GÕ LÝ LẼ PHẢN BIỆN
  const handleCustomRebuttalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRebuttal.trim()) return;
    sound.playStampThud();
    const lower = customRebuttal.toLowerCase();
    const isEffective =
      lower.includes('0') ||
      lower.includes('mất nghiệm') ||
      lower.includes('chia') ||
      lower.includes('âm') ||
      lower.includes('đổi chiều') ||
      lower.includes('căn') ||
      lower.includes('nối tiếp') ||
      lower.includes('cc') ||
      lower.includes('pytago') ||
      customRebuttal.trim().length > 15;

    if (isEffective) {
      sound.playSuccessChime();
      setRebuttalFeedback('Lập luận rất chặt chẽ! Bo đã tâm phục khẩu phục!');
      setInternalPhase('BO_CONCEDED');
    } else {
      setRebuttalFeedback('Bo vẫn chưa phục! Em hãy nêu rõ quy tắc nối tiếp vectơ hoặc điều kiện toán học nhé.');
    }
    onSubmitRebuttal?.(customRebuttal.trim(), isEffective);
    setCustomRebuttal('');
  };

  // XỬ LÝ KHI BẤM "TIẾP TỤC XEM VIDEO" SAU KHI XONG QUIZ
  const handleResumeAfterQuiz = () => {
    setInternalPhase('WATCHING');
    setSelectedOption(null);
    setRebuttalFeedback(null);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      // Nhích qua giây checkpoint 2s để không bị dừng lặp lại
      ytPlayerRef.current.seekTo(lesson.checkpointTimestamp + 2, true);
      ytPlayerRef.current.playVideo();
    }
    onResumeVideo?.();
  };

  // XỬ LÝ KHI DÁN LINK YOUTUBE MỚI
  const handleApplyYoutubeLink = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYouTubeId(inputUrl);
    if (!ytId) return;

    setActiveYoutubeId(ytId);
    // Nếu dán link thầy Tiến (phvpqxLNTUQ), tự động nạp bộ dữ liệu đầy đủ 9 phân cảnh của thầy Tiến!
    const matchedLesson = VIDEO_LESSON_LIBRARY.find(
      (l) => l.youtubeId === ytId || l.id === 'VID_VECTO_12'
    );
    if (matchedLesson && onSwitchVideoLesson) {
      onSwitchVideoLesson({
        ...matchedLesson,
        youtubeId: ytId,
        videoUrl: inputUrl,
      });
    }
    setIsAttachModalOpen(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const chapters = lesson.chapters || [];
  const transcriptCues = lesson.transcriptCues || [];

  const currentChapter =
    [...chapters].reverse().find((ch) => currentTime >= ch.startSecond) || chapters[0];

  const filteredCues = transcriptCues.filter(
    (c) =>
      cleanText(c.text).toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleanText(c.formula).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const boDebateSpeech = cleanText(liveBoDialogue || lesson.boArgument.speech);
  const coLamClosureSpeech = cleanText(
    Array.isArray(liveCoLamDialogue)
      ? liveCoLamDialogue.join(' ')
      : liveCoLamDialogue || lesson.teacherClosure.speech
  );

  const isCheckpointActive =
    internalPhase === 'CHECKPOINT_REACHED' ||
    internalPhase === 'BO_DEBATE' ||
    internalPhase === 'BO_CONCEDED' ||
    internalPhase === 'CO_LAM_CLOSURE';

  const showQuizOverlay = isCheckpointActive && !isQuizMinimized && !isOverlayDrawerOpen;

  return (
    <div className="relative w-full bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-sm p-3 sketchbook-shadow notebook-sheet">
      <PushPin color="#4E9B87" className="absolute top-2.5 right-3 z-10" />

      {/* THANH CÔNG CỤ TRÊN ĐẦU VIDEO: DÁN LINK LÀ HIỆN VIDEO THẦY NGAY */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#E8DFD0]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-handwriting font-bold text-xs bg-[#4E9B87]/15 text-[#2E6859] px-2.5 py-0.5 rounded-xs border border-[#4E9B87]/30 flex items-center gap-1">
            <ChalkboardIcon className="w-3.5 h-3.5 text-[#2E6859]" />
            <span className="truncate max-w-[260px] sm:max-w-[350px]">{cleanText(lesson.title)}</span>
          </span>

          <button
            type="button"
            onClick={() => setIsAttachModalOpen(true)}
            className="px-2.5 py-0.5 bg-[#FFF5DC] hover:bg-[#FCEAC1] text-[#7A4C0B] border border-[#E3C382] rounded-xs font-handwriting font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <LinkChainIcon className="w-3.5 h-3.5 text-[#C97A13]" />
            <span>🔗 Dán link YouTube / Đổi bài</span>
          </button>
        </div>

        {/* Nút nhảy thẳng tới giây 37:13 của thầy Tiến để test Quiz */}
        <button
          onClick={() => {
            setIsOverlayDrawerOpen(false);
            setIsQuizMinimized(false);
            handleSeekBoth(lesson.checkpointTimestamp);
            if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
              ytPlayerRef.current.pauseVideo();
            }
            setInternalPhase('CHECKPOINT_REACHED');
            onJumpToCheckpoint();
          }}
          type="button"
          className="text-xs font-handwriting font-bold text-[#8C5D19] bg-[#FFF5DC] hover:bg-[#F5D65D]/40 px-2.5 py-0.5 border border-[#E8A33D] rounded-xs cursor-pointer"
        >
          ⚡ Tới câu hỏi dừng ({formatTime(lesson.checkpointTimestamp)})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* KHUNG VIDEO YOUTUBE THẬT (HIỆN MẶT THẦY & GIỌNG THẦY GIẢNG + CÁC LỚP PHỤ TRỢ) */}
      {/* ========================================================================= */}
      <div className="relative bg-black border-4 border-[#4A3B2C] rounded-md overflow-hidden shadow-inner h-[390px] sm:h-[430px] flex flex-col justify-between text-white">
        
        {/* Trình phát YouTube thật (Mặt thầy Tiến & Giọng thầy giảng) */}
        <div className="relative flex-1 w-full bg-black overflow-hidden">
          <div id={playerContainerId.current} className="w-full h-full" />
        </div>

        {/* ========================================================================= */}
        {/* LỚP PHỤ TRỢ 1: KHAY MỜ "PHÂN CẢNH | BẢN CHÉP LỜI" ĐÈ GÓC PHẢI VIDEO      */}
        {/* ========================================================================= */}
        {isOverlayDrawerOpen && (
          <div className="absolute top-2 bottom-12 right-2 w-[310px] sm:w-[345px] bg-[#FAF6EE]/96 backdrop-blur-md text-[#2F2923] rounded-lg border-2 border-[#2F2923] shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-150">
            <div className="p-2.5 border-b border-[#E5DEC9] bg-white space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#2F2923]">Trong video này</span>
                <button
                  type="button"
                  onClick={() => setIsOverlayDrawerOpen(false)}
                  className="w-6 h-6 rounded-full bg-[#EFE8DA] hover:bg-[#E2D9C8] text-[#2F2923] font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDrawerTab('chapters')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                    drawerTab === 'chapters'
                      ? 'bg-[#2F2923] text-white'
                      : 'bg-[#EFE8DA] text-[#5C5043] hover:bg-[#E2D9C8]'
                  }`}
                >
                  Phân cảnh ({chapters.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('transcript')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                    drawerTab === 'transcript'
                      ? 'bg-[#2F2923] text-white'
                      : 'bg-[#EFE8DA] text-[#5C5043] hover:bg-[#E2D9C8]'
                  }`}
                >
                  Bản chép lời
                </button>
              </div>

              {drawerTab === 'transcript' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F3EFE6] border border-[#DFD7C7] text-xs">
                  <span className="text-[#8A7D6F]">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm công thức hoặc lời thầy giảng..."
                    className="bg-transparent outline-none w-full text-xs text-[#2F2923]"
                  />
                </div>
              )}
            </div>

            {/* Danh sách Phân cảnh (Ấn vào là video YouTube của thầy Tiến tua thẳng tới đó!) */}
            {drawerTab === 'chapters' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
                {chapters.map((ch) => {
                  const isCurrentChap = currentChapter?.id === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        handleSeekBoth(ch.startSecond);
                        if (ch.hasCheckpoint) {
                          setIsOverlayDrawerOpen(false);
                          setIsQuizMinimized(false);
                          setInternalPhase('CHECKPOINT_REACHED');
                          onJumpToCheckpoint();
                        }
                      }}
                      className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center gap-2.5 ${
                        isCurrentChap
                          ? 'bg-[#FFF8EB] border-[#E8A33D] border-l-4 shadow-2xs'
                          : 'bg-white hover:bg-[#FFFDF7] border-[#E5DEC9]'
                      }`}
                    >
                      <div className="w-16 h-10 rounded bg-[#1E2B24] text-[#F5D65D] font-mono text-[10px] font-bold flex items-center justify-center text-center p-1 shrink-0">
                        {cleanText(ch.formulaPreview) || formatTime(ch.startSecond)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#2F2923] leading-snug text-xs">
                          {cleanText(ch.title)}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-[#E0F2FE] text-[#0369A1] font-mono text-[10px] font-bold">
                          {formatTime(ch.startSecond)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Danh sách Bản chép lời từng giây (Ấn vào giây nào là video thầy Tiến nhảy tới giây đó!) */}
            {drawerTab === 'transcript' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
                {filteredCues.map((cue) => {
                  const isActive = currentTime >= cue.start && currentTime <= cue.end;
                  return (
                    <div
                      key={cue.id}
                      ref={isActive ? activeCueRef : null}
                      onClick={() => {
                        handleSeekBoth(cue.start);
                        if (cue.tag === 'checkpoint') {
                          setIsOverlayDrawerOpen(false);
                          setIsQuizMinimized(false);
                          setInternalPhase('CHECKPOINT_REACHED');
                          onJumpToCheckpoint();
                        }
                      }}
                      className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#E0F2FE] border-l-4 border-[#0284C7] font-semibold'
                          : 'hover:bg-black/5'
                      }`}
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-bold shrink-0 ${
                          isActive ? 'bg-[#0284C7] text-white' : 'bg-[#E0F2FE] text-[#0369A1]'
                        }`}
                      >
                        {formatTime(cue.start)}
                      </span>
                      <div className="flex-1 leading-snug text-[#2F2923]">
                        <span>{cleanText(cue.text)}</span>
                        {cue.formula && (
                          <div className="mt-1 px-2 py-0.5 bg-[#FFF8EB] border border-[#E8A33D]/50 rounded font-mono text-[11px] font-bold text-[#8C5D19]">
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

        {/* ========================================================================= */}
        {/* LỚP PHỤ TRỢ 2: THẺ QUIZ & BO TRANH BIỆN (CHỌN XONG CHUYỂN PHA NGAY!)      */}
        {/* ========================================================================= */}
        {showQuizOverlay && (
          <div className="absolute inset-x-3 bottom-12 z-20 bg-[#FFFDF7]/96 backdrop-blur-md text-[#2F2923] border-2 border-[#E8A33D] rounded-lg p-3.5 shadow-2xl animate-in slide-in-from-bottom-4 duration-150">
            
            {/* Header của thẻ Quiz */}
            <div className="flex items-center justify-between border-b border-[#E8DFD0] pb-1.5 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#F5D65D] text-[#3B3224] font-handwriting font-bold text-xs">
                  {internalPhase === 'CHECKPOINT_REACHED' && `⚡ Điểm dừng tại [${formatTime(lesson.checkpointTimestamp)}]`}
                  {internalPhase === 'BO_DEBATE' && '⚔️ Bo nhảy ra cãi lại lựa chọn của em!'}
                  {(internalPhase === 'BO_CONCEDED' || internalPhase === 'CO_LAM_CLOSURE') && '🌟 Chốt kiến thức & Mở khóa video'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuizMinimized(true)}
                  className="px-2 py-0.5 rounded bg-[#EFE8DA] hover:bg-[#E2D9C8] text-[#4A3D31] font-handwriting font-bold text-xs cursor-pointer"
                >
                  👁️ Tạm ẩn để nhìn bảng thầy
                </button>
                {internalPhase === 'CHECKPOINT_REACHED' && (
                  <button
                    type="button"
                    onClick={onSkipCheckpoint || handleResumeAfterQuiz}
                    className="text-xs font-handwriting text-[#8A7D6F] hover:text-[#2F2923] underline cursor-pointer"
                  >
                    Bỏ qua ➔
                  </button>
                )}
              </div>
            </div>

            {/* PHA 1: CHỌN ĐÁP ÁN A, B, C */}
            {internalPhase === 'CHECKPOINT_REACHED' && (
              <div className="space-y-2">
                <p className="font-bold text-xs sm:text-sm text-[#1E3B33]">
                  {cleanText(lesson.checkpointQuestion.prompt)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {lesson.checkpointQuestion.options.map((opt, idx) => {
                    const letter = idx === 0 ? 'A' : idx === 1 ? 'B' : 'C';
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectQuizOption(opt)}
                        className="p-2.5 rounded border-2 bg-white hover:bg-[#FFF8EB] hover:border-[#E8A33D] border-[#DFD6C7] text-left text-xs font-handwriting transition-all cursor-pointer flex items-start gap-2 shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#EFE8DA] text-[#3B3026] font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <span className="leading-snug text-[#2F2923]">{cleanText(opt.label)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHA 2: NGAY KHI BẤM ĐÁP ÁN -> CHUYỂN MƯỢT SANG BO CÃI & STICKER PHẢN BIỆN! */}
            {internalPhase === 'BO_DEBATE' && (
              <div className="space-y-2">
                {/* Báo kết quả lựa chọn vừa bấm */}
                {selectedOption && (
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-handwriting font-bold flex items-center justify-between ${
                      selectedOption.isStandardBest
                        ? 'bg-[#EDF7F4] text-[#2E6859] border border-[#4E9B87]'
                        : 'bg-[#FFF5F5] text-[#9B1C1C] border border-[#F8B4A5]'
                    }`}
                  >
                    <span>
                      {selectedOption.isStandardBest
                        ? `✅ Em đã chọn đúng: "${cleanText(selectedOption.label)}"`
                        : `⚠️ Em vừa chọn: "${cleanText(selectedOption.label)}" — ${cleanText(selectedOption.feedback)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInternalPhase('CHECKPOINT_REACHED')}
                      className="text-[11px] underline ml-2 shrink-0 cursor-pointer"
                    >
                      Chọn lại
                    </button>
                  </div>
                )}

                {/* Lời cãi của Bo */}
                <div className="flex items-start gap-2.5 p-2 rounded bg-[#FFF8EB] border border-[#F0D5A3]">
                  <BoAvatar size="sm" expression="skeptical" className="shrink-0" />
                  <div className="text-xs font-handwriting text-[#3E342B] leading-snug">
                    <div className="font-bold text-[#8C5D19] mb-0.5">
                      🧒 Bo nhảy vào tranh cãi ({cleanText(lesson.boArgument.fallacyType)}):
                    </div>
                    “{boDebateSpeech}”
                  </div>
                </div>

                {/* Các Sticker phản biện để học sinh bấm khuất phục Bo */}
                <div className="space-y-1">
                  <div className="text-[11px] font-handwriting font-bold text-[#5C4F42]">
                    👇 Bấm chọn 1 lý lẽ toán học để bẻ gãy lập luận của Bo:
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {lesson.rebuttalStickers.map((stk) => (
                      <button
                        key={stk.id}
                        type="button"
                        disabled={isLoadingAi}
                        onClick={() => handleStickerClick(stk)}
                        className="w-full text-left px-2.5 py-1.5 rounded bg-white hover:bg-[#EDF7F4] border border-[#4E9B87] text-xs font-handwriting text-[#1E3B33] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <span className="leading-snug">🏷️ “{cleanText(stk.text)}”</span>
                        <span className="text-[10px] font-mono font-bold text-[#2E6859] shrink-0">
                          Gửi phản biện ➔
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {rebuttalFeedback && (
                  <div className="px-2.5 py-1 rounded bg-[#FFF5DC] border border-[#E8A33D] text-xs font-handwriting text-[#8C5D19]">
                    💡 {rebuttalFeedback}
                  </div>
                )}

                <form onSubmit={handleCustomRebuttalSubmit} className="flex gap-1.5">
                  <input
                    type="text"
                    value={customRebuttal}
                    onChange={(e) => setCustomRebuttal(e.target.value)}
                    placeholder="Hoặc tự gõ lý lẽ của em để thuyết phục Bo..."
                    className="flex-1 px-2.5 py-1 bg-white border border-[#D8CEBC] rounded text-xs font-handwriting outline-none focus:border-[#E8A33D]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#E8A33D] hover:bg-[#D9932B] text-black font-handwriting font-bold text-xs rounded cursor-pointer"
                  >
                    Gửi
                  </button>
                </form>
              </div>
            )}

            {/* PHA 3: BO TÂM PHỤC KHẨU PHỤC & PHÁT TIẾP VIDEO THẦY TIẾN */}
            {(internalPhase === 'BO_CONCEDED' || internalPhase === 'CO_LAM_CLOSURE') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RubberStampSuccess className="scale-75" />
                    <span className="font-handwriting font-bold text-sm text-[#2E6859]">
                      Bo đã tâm phục khẩu phục! Cô Lam chốt quy tắc:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResumeAfterQuiz}
                    className="px-3.5 py-1.5 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-xs rounded shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <VideoPlayIcon className="w-3.5 h-3.5" />
                    <span>Phát tiếp video thầy giảng ➔</span>
                  </button>
                </div>

                <p className="text-xs font-handwriting text-[#8C5D19] italic">
                  🧒 Bo: “{cleanText(lesson.boConcession.speech)}”
                </p>

                <div className="p-2 bg-[#EDF7F4] rounded border border-[#4E9B87]/40 text-xs font-mono text-[#1E5749] font-bold flex items-center gap-1.5">
                  <GoldenStarIcon className="w-4 h-4 text-[#D4A328] shrink-0" />
                  <span>{cleanText(lesson.teacherClosure.goldenRule)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nút mở lại thẻ Quiz khi đang tạm ẩn để nhìn bảng thầy */}
        {isCheckpointActive && (isQuizMinimized || isOverlayDrawerOpen) && (
          <button
            type="button"
            onClick={() => {
              setIsOverlayDrawerOpen(false);
              setIsQuizMinimized(false);
            }}
            className="absolute bottom-13 left-3 z-20 px-3 py-1 bg-[#E8A33D] text-black font-handwriting font-bold text-xs rounded-full shadow-lg cursor-pointer"
          >
            ⚡ Mở lại Câu hỏi dừng ({formatTime(lesson.checkpointTimestamp)})
          </button>
        )}

        {/* ========================================================================= */}
        {/* THANH ĐIỀU KHIỂN PHỤ TRỢ DƯỚI ĐÁY VIDEO (NÚT PHÂN CẢNH MỜ + KHOAN ĐÃ CÔ) */}
        {/* ========================================================================= */}
        <div className="bg-[#141C18] px-3 py-2 border-t border-white/15 flex items-center justify-between gap-2 text-xs z-20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleTogglePlayBoth}
              type="button"
              className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded cursor-pointer shrink-0"
            >
              {isPlaying ? <VideoPauseIcon className="w-3.5 h-3.5" /> : <VideoPlayIcon className="w-3.5 h-3.5" />}
            </button>

            <span className="font-mono text-[11px] text-white/90 shrink-0">
              {formatTime(currentTime)} / {formatTime(lesson.duration)}
            </span>

            {/* NÚT VIÊN THUỐC MỜ KIỂU YOUTUBE: Bấm mở Phân cảnh & Bản chép lời */}
            <button
              type="button"
              onClick={() => {
                setIsOverlayDrawerOpen((prev) => {
                  const next = !prev;
                  if (next) setIsQuizMinimized(true);
                  return next;
                });
              }}
              className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white font-medium text-xs flex items-center gap-1.5 truncate cursor-pointer border border-white/20"
            >
              <span className="truncate">
                📖 {currentChapter ? cleanText(currentChapter.title) : 'Phân cảnh & Bản chép lời'}
              </span>
              <span className="text-[#F5D65D] font-bold shrink-0">❯</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
                ytPlayerRef.current.pauseVideo();
              }
              onTriggerFreeze();
            }}
            type="button"
            className="px-2.5 py-1 bg-[#FFF8EB] hover:bg-white text-[#7B4E12] font-handwriting font-bold text-xs rounded flex items-center gap-1 cursor-pointer shrink-0"
          >
            <HandStopIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
            <span>✋ Khoan đã cô ơi!</span>
          </button>
        </div>
      </div>

      {/* Modal Dán link YouTube (Dán link thầy Tiến vào là chạy ngay!) */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-md p-5 sketchbook-shadow notebook-sheet space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8DFD0] pb-2">
              <h3 className="font-handwriting font-bold text-lg text-[#2F2923]">
                Dán link YouTube bài giảng
              </h3>
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="text-sm font-bold text-[#6E6357] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyYoutubeLink} className="space-y-2.5">
              <label className="block text-xs font-handwriting font-bold text-[#54483C]">
                Link YouTube (Mặc định: Bài 1.1 Vectơ Không Gian - Thầy Nguyễn Phan Tiến):
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=phvpqxLNTUQ"
                className="w-full px-3 py-2 bg-white border-2 border-[#D8CEBC] rounded font-mono text-xs outline-none focus:border-[#4E9B87]"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-sm rounded cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircleIcon className="w-4 h-4 text-white" />
                <span>Phát Video & Đồng bộ 9 Phân cảnh + 6 Agent ➔</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
