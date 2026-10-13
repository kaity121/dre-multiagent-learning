// File: src/components/VideoPlayerSheet.tsx
import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase, RebuttalSticker } from '../types/dre';
import { VIDEO_LESSON_LIBRARY } from '../data/videoLessons';
import { 
  TutorLamAvatar, 
  BoAvatar,
  WashiTape, 
  PushPin, 
  VideoPlayIcon, 
  VideoPauseIcon, 
  HandStopIcon, 
  ChalkboardIcon, 
  LinkChainIcon, 
  SparkleIcon, 
  CheckCircleIcon,
  RubberStampSuccess,
  GoldenStarIcon
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

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
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [videoSourceType, setVideoSourceType] = useState<'chalkboard' | 'youtube'>('chalkboard');
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('');

  // Khay mờ Phân cảnh & Bản chép lời kiểu YouTube đè trên Video
  const [isOverlayDrawerOpen, setIsOverlayDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'chapters' | 'transcript'>('transcript');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Nút "Giữ để nhìn bảng" khi Quiz đang hiện giữa màn hình
  const [isPeekingBoard, setIsPeekingBoard] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [customRebuttal, setCustomRebuttal] = useState<string>('');

  const activeCueRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedOptionId(null);
    setCustomRebuttal('');
  }, [lesson.id]);

  // Tự cuộn dòng transcript đang đọc
  useEffect(() => {
    if (isOverlayDrawerOpen && drawerTab === 'transcript') {
      activeCueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentTime, isOverlayDrawerOpen, drawerTab]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Tìm phân cảnh (Chapter) và câu thoại (Transcript Cue) tại giây hiện tại
  const chapters = lesson.chapters || [];
  const transcriptCues = lesson.transcriptCues || [];

  const currentChapter = [...chapters]
    .reverse()
    .find((ch) => currentTime >= ch.startSecond) || chapters[0];

  const currentCue = transcriptCues.find(
    (c) => currentTime >= c.start && currentTime <= c.end
  ) || transcriptCues[transcriptCues.length - 1];

  const filteredCues = transcriptCues.filter((c) =>
    c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.formula && c.formula.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectQuizOption = (optId: string, label: string) => {
    sound.playPencilTap();
    setSelectedOptionId(optId);
    onAnswerCheckpoint?.(label);
  };

  const handleStickerClick = (sticker: RebuttalSticker) => {
    sound.playStampThud();
    onSubmitRebuttal?.(sticker.text, sticker.isEffective);
  };

  const handleCustomRebuttalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRebuttal.trim()) return;
    sound.playStampThud();
    const lower = customRebuttal.toLowerCase();
    const isEffective = lower.includes('0') || lower.includes('mất nghiệm') || lower.includes('chia') || lower.includes('âm') || lower.includes('đổi chiều');
    onSubmitRebuttal?.(customRebuttal.trim(), isEffective);
    setCustomRebuttal('');
  };

  const boDebateSpeech = liveBoDialogue || lesson.boArgument.speech;
  const coLamClosureSpeech = Array.isArray(liveCoLamDialogue)
    ? liveCoLamDialogue.join(' ')
    : (liveCoLamDialogue || lesson.teacherClosure.speech);

  const isQuizOverlayVisible =
    (phase === 'CHECKPOINT_REACHED' || phase === 'BO_DEBATE' || phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE') &&
    !isPeekingBoard;

  return (
    <div className="relative w-full bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-sm p-3 sketchbook-shadow notebook-sheet">
      <PushPin color="#4E9B87" className="absolute top-2.5 right-3 z-10" />

      {/* Thanh công cụ mỏng trên đầu Video */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#E8DFD0]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-handwriting font-bold text-xs bg-[#4E9B87]/15 text-[#2E6859] px-2.5 py-0.5 rounded-xs border border-[#4E9B87]/30 flex items-center gap-1">
            <ChalkboardIcon className="w-3.5 h-3.5 text-[#2E6859]" />
            <span>{lesson.title}</span>
          </span>

          {/* Chuyển nhanh giữa Bảng phấn đồng bộ & YouTube Video thật */}
          <button
            type="button"
            onClick={() => setVideoSourceType(prev => prev === 'chalkboard' ? 'youtube' : 'chalkboard')}
            className="px-2.5 py-0.5 bg-white hover:bg-[#FFF5DC] text-[#5C4F42] border border-[#D8CEBC] rounded-xs font-handwriting font-bold text-xs cursor-pointer"
          >
            {videoSourceType === 'chalkboard' ? '🎬 Xem Video YouTube gốc' : '📋 Xem Bảng phấn tương tác'}
          </button>

          <button
            type="button"
            onClick={() => setIsAttachModalOpen(true)}
            className="px-2 py-0.5 bg-[#FFF5DC] hover:bg-[#FCEAC1] text-[#7A4C0B] border border-[#E3C382] rounded-xs font-handwriting font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <LinkChainIcon className="w-3 h-3 text-[#C97A13]" />
            <span>Đổi link / Bài mẫu</span>
          </button>
        </div>

        <button
          onClick={onJumpToCheckpoint}
          type="button"
          className="text-xs font-handwriting font-bold text-[#8C5D19] bg-[#FFF5DC] hover:bg-[#F5D65D]/40 px-2.5 py-0.5 border border-[#E8A33D] rounded-xs cursor-pointer"
        >
          ⚡ Tới câu hỏi dừng ({formatTime(lesson.checkpointTimestamp)})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* KHUNG VIDEO CHÍNH (CÓ KHAY MỜ PHÂN CẢNH/CHÉP LỜI & THẺ QUIZ MƯỢT TẠI CHỖ) */}
      {/* ========================================================================= */}
      <div className="relative bg-[#18221E] border-4 border-[#4A3B2C] rounded-md overflow-hidden shadow-inner min-h-[360px] sm:min-h-[410px] flex flex-col justify-between text-white">
        
        {/* NỘI DUNG VIDEO BÊN DƯỚI (YouTube IFrame hoặc Bảng phấn) */}
        {videoSourceType === 'youtube' && lesson.youtubeId ? (
          <div className="relative w-full h-[330px] sm:h-[360px] bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${lesson.youtubeId}?enablejsapi=1&rel=0`}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          /* Bảng phấn Cô Lam đồng bộ từng giây với Transcript */
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
            {/* Header nhỏ trên bảng */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#E0F3ED] border border-[#4E9B87] overflow-hidden flex items-center justify-center shrink-0">
                  <TutorLamAvatar size="sm" className="scale-75 -translate-y-1" />
                </div>
                <div>
                  <span className="text-[11px] font-handwriting text-[#8CE6CF] font-bold block leading-none">
                    Cô Lam đang giảng:
                  </span>
                  <span className="text-sm font-bold text-[#F5D65D]">{lesson.blackboardTitle}</span>
                </div>
              </div>

              {/* Nút bật/tắt nhanh Bản chép lời ngay góc trên bảng */}
              <button
                type="button"
                onClick={() => setIsOverlayDrawerOpen(prev => !prev)}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-handwriting text-[#FFFDF7] border border-white/15 cursor-pointer flex items-center gap-1.5"
              >
                <span>📖 {isOverlayDrawerOpen ? 'Đóng Bản chép lời' : 'Phân cảnh & Bản chép lời'}</span>
              </button>
            </div>

            {/* Phấn viết trên bảng theo từng giây */}
            <div className="my-auto py-3 space-y-2.5">
              {transcriptCues.map((cue) => {
                const isPassedOrCurrent = currentTime >= cue.start;
                const isCurrent = currentTime >= cue.start && currentTime <= cue.end;
                if (!isPassedOrCurrent) return null;

                return (
                  <div
                    key={cue.id}
                    onClick={() => onSeek(cue.start)}
                    className={`group flex items-start gap-2.5 p-1.5 rounded transition-all cursor-pointer ${
                      isCurrent ? 'bg-white/10 border-l-3 border-[#F5D65D]' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <span className="px-1.5 py-0.5 rounded bg-black/40 text-[#8CE6CF] font-mono text-[11px] font-bold shrink-0 group-hover:bg-[#E8A33D] group-hover:text-black">
                      {formatTime(cue.start)}
                    </span>
                    <div className="flex-1 text-xs sm:text-sm font-handwriting leading-snug">
                      <strong className="text-[#F5D65D] mr-1">{cue.speaker}:</strong>
                      <span className="text-[#F4F1EA]">{cue.text}</span>
                      {cue.formula && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-black/50 border border-[#F5D65D]/40 font-mono text-xs text-[#F5D65D] font-bold inline-block mt-0.5">
                          {cue.formula}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hộp Phụ đề nổi ở đáy bảng giống Coursera */}
            {currentCue && (
              <div className="mx-auto max-w-2xl w-full bg-black/75 px-4 py-1.5 rounded text-center text-xs sm:text-sm font-handwriting text-[#FFFDF7] border border-white/10">
                <span className="text-[#F5D65D] font-bold mr-1">[{formatTime(currentCue.start)}] {currentCue.speaker}:</span>
                <span>“{currentCue.text}”</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. KHAY MỜ "PHÂN CẢNH | BẢN CHÉP LỜI" ĐÈ LÊN GÓC PHẢI VIDEO (CHUẨN YOUTUBE) */}
        {/* ========================================================================= */}
        {isOverlayDrawerOpen && (
          <div className="absolute top-2 bottom-12 right-2 w-[310px] sm:w-[340px] bg-[#FAF6EE]/95 backdrop-blur-md text-[#2F2923] rounded-lg border-2 border-[#D8CEBC] shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
            {/* Header Khay mờ + 2 Nút Pill Đen/Trắng chuẩn YouTube */}
            <div className="p-3 border-b border-[#E5DEC9] bg-white/80 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#2F2923]">Trong video này</span>
                <button
                  type="button"
                  onClick={() => setIsOverlayDrawerOpen(false)}
                  className="w-6 h-6 rounded-full hover:bg-[#EFE8DA] text-[#5C5043] font-bold text-xs cursor-pointer"
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

              {/* Thanh tìm kiếm trong video khi ở tab Bản chép lời */}
              {drawerTab === 'transcript' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F3EFE6] border border-[#DFD7C7] text-xs">
                  <span className="text-[#8A7D6F]">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm công thức hoặc lời giảng..."
                    className="bg-transparent outline-none w-full text-xs text-[#2F2923] placeholder-[#8A7D6F]"
                  />
                </div>
              )}
            </div>

            {/* Danh sách Phân cảnh (Chapters) */}
            {drawerTab === 'chapters' && (
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs">
                {chapters.map((ch) => {
                  const isCurrentChap = currentChapter?.id === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        onSeek(ch.startSecond);
                        if (ch.hasCheckpoint) onJumpToCheckpoint();
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-2.5 ${
                        isCurrentChap
                          ? 'bg-[#FFF8EB] border-[#E8A33D] border-l-4 shadow-2xs'
                          : 'bg-white hover:bg-[#FFFDF7] border-[#E5DEC9]'
                      }`}
                    >
                      <div className="w-16 h-11 rounded bg-[#1E2B24] text-[#F5D65D] font-mono text-[10px] font-bold flex items-center justify-center text-center p-1 shrink-0">
                        {ch.formulaPreview || formatTime(ch.startSecond)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#2F2923] leading-snug">{ch.title}</div>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0369A1] font-mono text-[10px] font-bold">
                          {formatTime(ch.startSecond)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Danh sách Bản chép lời từng giây (Ấn vào để tua chuẩn YouTube/Coursera) */}
            {drawerTab === 'transcript' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
                {filteredCues.map((cue) => {
                  const isActive = currentTime >= cue.start && currentTime <= cue.end;
                  return (
                    <div
                      key={cue.id}
                      ref={isActive ? activeCueRef : null}
                      onClick={() => {
                        onSeek(cue.start);
                        if (cue.tag === 'checkpoint') onJumpToCheckpoint();
                      }}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#E0F2FE]/70 border-l-4 border-[#0284C7] font-semibold'
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
                        <span className="text-[#6E6357] font-bold mr-1">{cue.speaker}:</span>
                        <span>{cue.text}</span>
                        {cue.formula && (
                          <div className="mt-1 px-2 py-0.5 bg-[#FFF8EB] border border-[#E8A33D]/50 rounded font-mono text-[11px] font-bold text-[#8C5D19]">
                            📐 {cue.formula}
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
        {/* 2. THẺ NỔI IN-VIDEO QUIZ & BO DEBATE (BIẾN HÌNH MƯỢT TẠI CHỖ TRÊN VIDEO)   */}
        {/* ========================================================================= */}
        {isQuizOverlayVisible && (
          <div className="absolute inset-x-3 bottom-13 z-20 bg-[#FFFDF7]/98 backdrop-blur-md text-[#2F2923] border-2 border-[#E8A33D] rounded-lg p-3.5 sm:p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            
            {/* Thanh tiêu đề chung của Thẻ nổi: Có nút Giữ để nhìn bảng & Bỏ qua */}
            <div className="flex items-center justify-between border-b border-[#E8DFD0] pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#F5D65D] text-[#3B3224] font-handwriting font-bold text-xs">
                  {phase === 'CHECKPOINT_REACHED' && `⚡ Câu hỏi dừng tại [${formatTime(lesson.checkpointTimestamp)}]`}
                  {phase === 'BO_DEBATE' && '⚔️ Bo nhảy vào phản đối lựa chọn của em!'}
                  {(phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE') && '🌟 Chốt kiến thức cùng Cô Lam'}
                </span>
                <span className="text-xs font-mono font-bold text-[#2E6859] hidden sm:inline">
                  {lesson.blackboardTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={() => setIsPeekingBoard(true)}
                  onMouseUp={() => setIsPeekingBoard(false)}
                  onMouseLeave={() => setIsPeekingBoard(false)}
                  onClick={() => setIsPeekingBoard(prev => !prev)}
                  className="px-2 py-0.5 rounded bg-[#EFE8DA] hover:bg-[#E2D9C8] text-[#4A3D31] font-handwriting font-bold text-xs cursor-pointer"
                  title="Tạm ẩn thẻ câu hỏi để nhìn rõ bảng phấn phía sau"
                >
                  👁️ Nhìn bảng
                </button>
                {phase === 'CHECKPOINT_REACHED' && (
                  <button
                    type="button"
                    onClick={onSkipCheckpoint || onResumeVideo}
                    className="text-xs font-handwriting text-[#8A7D6F] hover:text-[#2F2923] underline cursor-pointer"
                  >
                    Bỏ qua ➔
                  </button>
                )}
              </div>
            </div>

            {/* BƯỚC 1: CHỌN ĐÁP ÁN A, B, C */}
            {phase === 'CHECKPOINT_REACHED' && (
              <div className="space-y-2">
                <p className="font-bold text-xs sm:text-sm text-[#1E3B33]">
                  {lesson.checkpointQuestion.prompt}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {lesson.checkpointQuestion.options.map((opt, idx) => {
                    const letter = idx === 0 ? 'A' : idx === 1 ? 'B' : 'C';
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectQuizOption(opt.id, opt.label)}
                        className={`p-2.5 rounded border-2 text-left text-xs font-handwriting transition-all cursor-pointer flex items-start gap-2 ${
                          selectedOptionId === opt.id
                            ? 'bg-[#FFF8EB] border-[#E8A33D] font-bold shadow-xs'
                            : 'bg-white hover:bg-[#FAF6EE] border-[#DFD6C7]'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-[#EFE8DA] text-[#3B3026] font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <span className="leading-snug text-[#2F2923]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BƯỚC 2: BIẾN HÌNH TẠI CHỖ SANG BO TRANH BIỆN (Không bị cắt chữ truncate!) */}
            {phase === 'BO_DEBATE' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 rounded bg-[#FFF8EB] border border-[#F0D5A3]">
                  <BoAvatar size="sm" expression="skeptical" className="shrink-0" />
                  <div className="text-xs sm:text-sm font-handwriting text-[#3E342B] leading-snug">
                    <div className="font-bold text-[#8C5D19] text-xs mb-0.5">
                      🧒 Bo cãi bướng ({lesson.boArgument.fallacyType}):
                    </div>
                    “{boDebateSpeech}”
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-handwriting font-bold text-[#5C4F42]">
                    👇 Bấm chọn 1 lý lẽ sắc bén để thuyết phục Bo (Hoặc tự gõ ở dưới):
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {lesson.rebuttalStickers.map((stk) => (
                      <button
                        key={stk.id}
                        type="button"
                        disabled={isLoadingAi}
                        onClick={() => handleStickerClick(stk)}
                        className="w-full text-left px-3 py-1.5 rounded bg-white hover:bg-[#EDF7F4] border border-[#4E9B87] text-xs font-handwriting text-[#1E3B33] flex items-center justify-between gap-2 cursor-pointer shadow-2xs transition-colors"
                      >
                        <span className="leading-snug">🏷️ “{stk.text}”</span>
                        <span className="text-[10px] font-mono font-bold text-[#2E6859] shrink-0">Phản biện ➔</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleCustomRebuttalSubmit} className="flex gap-1.5 pt-0.5">
                  <input
                    type="text"
                    value={customRebuttal}
                    onChange={(e) => setCustomRebuttal(e.target.value)}
                    placeholder="Hoặc tự gõ lý lẽ của em để bẻ gãy lập luận của Bo..."
                    className="flex-1 px-2.5 py-1 bg-white border border-[#D8CEBC] rounded text-xs font-handwriting outline-none focus:border-[#E8A33D]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#E8A33D] hover:bg-[#D9932B] text-white font-handwriting font-bold text-xs rounded cursor-pointer"
                  >
                    Gửi lý lẽ
                  </button>
                </form>
              </div>
            )}

            {/* BƯỚC 3: BO TÂM PHỤC KHẨU PHỤC & CÔ LAM CHỐT QUY TẮC VÀNG */}
            {(phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RubberStampSuccess className="scale-75" />
                    <span className="font-handwriting font-bold text-sm text-[#2E6859]">
                      Bo đã tâm phục khẩu phục! Cô Lam chốt quy tắc vàng:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onResumeVideo}
                    className="px-3.5 py-1.5 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-xs rounded shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <VideoPlayIcon className="w-3.5 h-3.5" />
                    <span>Tiếp tục xem video ➔</span>
                  </button>
                </div>

                <p className="text-xs font-handwriting text-[#244E41] leading-snug">
                  “{coLamClosureSpeech}”
                </p>

                <div className="p-2 bg-[#EDF7F4] rounded border border-[#4E9B87]/40 text-xs font-mono text-[#1E5749] font-bold flex items-center gap-1.5">
                  <GoldenStarIcon className="w-4 h-4 text-[#D4A328] shrink-0" />
                  <span>{lesson.teacherClosure.goldenRule}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nút mở lại thẻ Quiz nếu học sinh đang bấm "Nhìn bảng" */}
        {isPeekingBoard && (
          <button
            type="button"
            onClick={() => setIsPeekingBoard(false)}
            className="absolute bottom-14 right-4 z-20 px-3 py-1.5 bg-[#E8A33D] text-black font-handwriting font-bold text-xs rounded-full shadow-lg cursor-pointer"
          >
            ⚡ Mở lại thẻ Câu hỏi & Tranh biện
          </button>
        )}

        {/* ========================================================================= */}
        {/* 3. THANH ĐIỀU KHIỂN ĐÁY VIDEO + NÚT MỜ "PHÂN CẢNH / CHÉP LỜI" KIỂU YOUTUBE */}
        {/* ========================================================================= */}
        <div className="bg-black/80 px-3 py-2 border-t border-white/10 space-y-1.5 z-20">
          {/* Thanh tua tiến trình có vạch chia Chapter và điểm dừng ? */}
          <div className="relative flex items-center">
            <div
              className="absolute -top-3 z-10 -translate-x-1/2 cursor-pointer"
              style={{ left: `${(lesson.checkpointTimestamp / lesson.duration) * 100}%` }}
              onClick={onJumpToCheckpoint}
              title="Điểm dừng câu hỏi"
            >
              <span className="w-4 h-4 rounded-full bg-[#F5D65D] text-black font-mono text-[10px] font-bold flex items-center justify-center shadow">
                ?
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={lesson.duration}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-[#E8A33D]"
            />
          </div>

          {/* Hàng nút dưới cùng: Play + Giây + NÚT VIÊN THUỐC MỜ KIỂU YOUTUBE + Khoan đã cô ơi */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={onTogglePlay}
                type="button"
                className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded cursor-pointer shrink-0"
              >
                {isPlaying ? <VideoPauseIcon className="w-3.5 h-3.5" /> : <VideoPlayIcon className="w-3.5 h-3.5" />}
              </button>

              <span className="font-mono text-[11px] text-white/90 shrink-0">
                {formatTime(currentTime)} / {formatTime(lesson.duration)}
              </span>

              {/* NÚT MỜ PHÂN CẢNH & BẢN CHÉP LỜI Y HỆT KHUNG ĐỎ TRONG ẢNH YOUTUBE CỦA BẠN */}
              <button
                type="button"
                onClick={() => setIsOverlayDrawerOpen(prev => !prev)}
                className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white font-medium text-xs flex items-center gap-1.5 truncate cursor-pointer border border-white/15 transition-colors"
                title="Bấm để mở Phân cảnh & Bản chép lời từng giây"
              >
                <span className="truncate">
                  {currentChapter ? currentChapter.title : 'Xem Phân cảnh & Bản chép lời'}
                </span>
                <span className="text-[#F5D65D] font-bold shrink-0">❯</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPlaybackSpeed(s => s === 1 ? 1.25 : 1)}
                type="button"
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-mono text-[11px] cursor-pointer"
              >
                {playbackSpeed}x
              </button>

              <button
                onClick={onTriggerFreeze}
                type="button"
                className="px-2.5 py-1 bg-[#FFF8EB] hover:bg-white text-[#7B4E12] font-handwriting font-bold text-xs rounded flex items-center gap-1 cursor-pointer"
              >
                <HandStopIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
                <span>Khoan đã cô ơi!</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal đổi nhanh bài giảng / gắn link */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-md p-5 sketchbook-shadow notebook-sheet space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8DFD0] pb-2">
              <h3 className="font-handwriting font-bold text-lg text-[#2F2923]">
                Chọn bài giảng Video mẫu hoặc Dán link YouTube
              </h3>
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="text-sm font-bold text-[#6E6357] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {VIDEO_LESSON_LIBRARY.map((vid) => (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => {
                    onSwitchVideoLesson?.(vid);
                    setIsAttachModalOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded bg-white hover:bg-[#FFF8EB] border border-[#D8CEBC] text-xs cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#2F2923]">{vid.title}</div>
                    <div className="text-[11px] text-[#7A6D5E] font-mono mt-0.5">
                      Có sẵn {vid.chapters?.length || 0} phân cảnh & {vid.transcriptCues?.length || 0} mốc giây
                    </div>
                  </div>
                  <span className="font-handwriting font-bold text-[#4E9B87]">Chọn ➔</span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E8DFD0] space-y-2">
              <label className="block text-xs font-handwriting font-bold text-[#54483C]">
                Hoặc dán link YouTube bất kỳ:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-2.5 py-1.5 bg-white border border-[#D8CEBC] rounded text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVideoSourceType('youtube');
                    setIsAttachModalOpen(false);
                  }}
                  className="px-3 py-1.5 bg-[#4E9B87] text-white font-handwriting font-bold text-xs rounded cursor-pointer"
                >
                  Gắn link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
