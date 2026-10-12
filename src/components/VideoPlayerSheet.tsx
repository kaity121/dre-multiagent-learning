import React, { useState, useRef, useEffect } from 'react';
import { VideoLessonItem, VideoCheckpointPhase } from '../types/dre';
import { VIDEO_LESSON_LIBRARY } from '../data/videoLessons';
import { 
  TutorLamAvatar, 
  WashiTape, 
  PushPin, 
  VideoPlayIcon, 
  VideoPauseIcon, 
  HandStopIcon, 
  QuestionStamp, 
  ChalkboardIcon, 
  GentleLightbulb, 
  LinkChainIcon, 
  SparkleIcon, 
  CheckCircleIcon,
  PinTackIcon
} from './HandmadeArtwork';

interface VideoPlayerSheetProps {
  lesson: VideoLessonItem;
  phase: VideoCheckpointPhase;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onTriggerFreeze: () => void;
  onJumpToCheckpoint: () => void;
  onSwitchVideoLesson?: (lesson: VideoLessonItem) => void;
}

// Pre-set sample educational math videos from YouTube that match our curriculum
const SAMPLE_YOUTUBE_VIDEOS = [
  {
    targetLessonId: 'VID_003',
    title: 'Toán 8: Bất phương trình & Cạm bẫy nhân chia số âm',
    mathProblem: '−2x > 6',
    url: 'https://www.youtube.com/watch?v=1F2bF2h7-U8',
    id: '1F2bF2h7-U8',
    grade: 'Đại số 8',
    checkpointSec: 55,
    tag: 'Bất phương trình'
  },
  {
    targetLessonId: 'VID_001',
    title: 'Toán 9: Giải phương trình tích & Cạm bẫy chia khử ẩn x',
    mathProblem: 'x(x − 2) = 3x',
    url: 'https://www.youtube.com/watch?v=d_kO9xGZfI8',
    id: 'd_kO9xGZfI8',
    grade: 'Đại số 9',
    checkpointSec: 50,
    tag: 'Phương trình tích'
  },
  {
    targetLessonId: 'VID_002',
    title: 'Toán 7: Quy tắc dấu ngoặc & Đổi dấu trong biểu thức',
    mathProblem: '5x − (3x − 2)',
    url: 'https://www.youtube.com/watch?v=Z61hNn2Dq-c',
    id: 'Z61hNn2Dq-c',
    grade: 'Đại số 7',
    checkpointSec: 45,
    tag: 'Phá ngoặc'
  },
  {
    targetLessonId: 'VID_004',
    title: 'Toán 6: Phép cộng phân số & Cạm bẫy cộng gộp mẫu số',
    mathProblem: '1/3 + 1/4',
    url: 'https://www.youtube.com/watch?v=8q3H7yP-6dY',
    id: '8q3H7yP-6dY',
    grade: 'Số học 6',
    checkpointSec: 40,
    tag: 'Phân số'
  }
];

export const VideoPlayerSheet: React.FC<VideoPlayerSheetProps> = ({
  lesson,
  phase,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  onTriggerFreeze,
  onJumpToCheckpoint,
  onSwitchVideoLesson,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [hasTriggeredCheckpoint, setHasTriggeredCheckpoint] = useState<boolean>(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Sync isPlaying state with HTML5 video element
  useEffect(() => {
    if (videoElementRef.current) {
      if (isPlaying && videoElementRef.current.paused) {
        videoElementRef.current.play().catch(() => {});
      } else if (!isPlaying && !videoElementRef.current.paused) {
        videoElementRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync playback speed
  useEffect(() => {
    if (videoElementRef.current) {
      videoElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Keyboard shortcut listener: Space to play/pause, 'K' to trigger "Khoan đã cô ơi!"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'KeyK') {
        e.preventDefault();
        onTriggerFreeze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTriggerFreeze]);

  // Reset checkpoint trigger state when lesson changes
  useEffect(() => {
    setHasTriggeredCheckpoint(false);
  }, [lesson.id]);

  // Handle HTML5 video time update
  const handleHtml5TimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const time = Math.floor(e.currentTarget.currentTime);
    onSeek(time);

    // Auto trigger checkpoint only once unless reset or seeked back
    if (time >= lesson.checkpointTimestamp && phase === 'WATCHING' && !hasTriggeredCheckpoint) {
      setHasTriggeredCheckpoint(true);
      if (videoElementRef.current) {
        videoElementRef.current.pause();
      }
      onJumpToCheckpoint();
    }
  };

  // Custom Video URL States (YouTube / MP4)
  const [videoSourceType, setVideoSourceType] = useState<'chalkboard' | 'youtube' | 'mp4'>('chalkboard');
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [customMp4Url, setCustomMp4Url] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [selectedDebateTopicId, setSelectedDebateTopicId] = useState<string>('VID_003');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Custom User-Defined Math Problem for arbitrary video
  const [isCustomProblemMode, setIsCustomProblemMode] = useState<boolean>(false);
  const [customMathEquation, setCustomMathEquation] = useState<string>('−3x < 9');
  const [customBoFallacy, setCustomBoFallacy] = useState<string>('Bo cãi: Chia cho −3 thì x < −3 chứ không đổi dấu');

  // Extract YouTube ID from any standard format
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.trim().match(regExp);
    return match ? match[1] : null;
  };

  // Switch to a preset sample lesson (matches video + debate text 100%)
  const handleSelectSample = (sample: typeof SAMPLE_YOUTUBE_VIDEOS[0]) => {
    const matchedLesson = VIDEO_LESSON_LIBRARY.find(l => l.id === sample.targetLessonId);
    if (matchedLesson) {
      const syncedLesson: VideoLessonItem = {
        ...matchedLesson,
        videoUrl: sample.url
      };
      onSwitchVideoLesson?.(syncedLesson);
    }
    setYoutubeVideoId(sample.id);
    setCustomMp4Url(null);
    setVideoSourceType('youtube');
    setCustomTitle(sample.title);
    setUrlError(null);
    setIsAttachModalOpen(false);
  };

  // Apply custom video URL with synchronized debate topic
  const handleApplyCustomUrl = () => {
    const targetUrl = inputUrl.trim();
    if (!targetUrl) {
      setUrlError('Vui lòng dán đường link YouTube hoặc file video MP4!');
      return;
    }

    const ytId = extractYouTubeId(targetUrl);
    const isMp4 = targetUrl.endsWith('.mp4') || targetUrl.includes('.mp4?') || targetUrl.startsWith('http');

    if (!ytId && !isMp4) {
      setUrlError('Không nhận diện được định dạng link YouTube hoặc MP4. Bạn thử kiểm tra lại đường dẫn nhé!');
      return;
    }

    // Determine the matched or custom debate scenario
    let targetLesson: VideoLessonItem;

    if (isCustomProblemMode) {
      // User entered a custom math problem
      targetLesson = {
        id: `CUSTOM_${Date.now()}`,
        title: `Video bài giảng: ${customMathEquation}`,
        subject: 'Toán học tương tác',
        duration: 180,
        checkpointTimestamp: 45,
        videoUrl: targetUrl,
        blackboardTitle: `Bài toán trong video: ${customMathEquation}`,
        lectureNotes: [
          `Cô Lam giảng bài: "${customMathEquation}"`,
          `Quan sát kỹ các bước biến đổi của bài toán: ${customMathEquation}`,
          'Cô Lam dừng lại: "Em và Bo cùng tính bước này xem sao nhé!"'
        ],
        checkpointQuestion: {
          prompt: `Theo em, kết quả bước giải bài toán "${customMathEquation}" là gì?`,
          options: [
            {
              id: 'opt_1',
              label: `Cách giải đúng chuẩn cho bài toán ${customMathEquation}`,
              isStandardBest: true,
              feedback: 'Chính xác! Bạn đã nắm vững bản chất toán học của bài này.'
            },
            {
              id: 'opt_2',
              label: `Cách làm sai theo suy luận: ${customBoFallacy}`,
              isStandardBest: false,
              feedback: 'Coi chừng! Đây chính là cạm bẫy mà Bo đang mắc phải.'
            }
          ]
        },
        boArgument: {
          speech: `Ủa Huy ơi! Cậu làm dài dòng thế? Bài này tớ thấy: ${customBoFallacy}! Làm thế vừa nhanh vừa dễ hiểu chứ sao?`,
          shortcutClaim: 'Lập luận rút gọn sai lầm',
          fallacyType: 'Cạm bẫy toán học trong video'
        },
        rebuttalStickers: [
          {
            id: 'reb_1',
            text: 'Cậu làm sai bản chất rồi, cần tuân thủ đúng quy tắc toán học!',
            isEffective: true,
            feedback: 'Rất chính xác!'
          },
          {
            id: 'reb_2',
            text: 'Hãy kiểm tra lại điều kiện và dấu của các số hạng!',
            isEffective: true,
            feedback: 'Chuẩn mực!'
          }
        ],
        boConcession: {
          speech: `A ha! Ra là vậy, tớ hiểu vì sao cách làm đó bị sơ hở rồi! Cậu chỉ ra đúng bản chất bài toán ${customMathEquation} luôn!`,
          realizationNote: `Bo đã hiểu bản chất bài toán: ${customMathEquation}`
        },
        teacherClosure: {
          speech: `Rất tốt! Cả hai em đã có một cuộc tranh luận rất sắc sảo về bài toán ${customMathEquation}!`,
          goldenRule: `Quy tắc vàng: Luôn kiểm tra kỹ các bước biến đổi khi giải ${customMathEquation}!`
        },
        freezeNote: `Tóm tắt đoạn vừa xem: Bài toán ${customMathEquation}. Hãy lưu ý cạm bẫy: ${customBoFallacy}.`
      };
    } else {
      // User matched with one of the standard lessons
      const matched = VIDEO_LESSON_LIBRARY.find(l => l.id === selectedDebateTopicId) || VIDEO_LESSON_LIBRARY[0];
      targetLesson = {
        ...matched,
        videoUrl: targetUrl
      };
    }

    // Inform parent App to update currentVideoLesson so right debate sheet matches 100%!
    onSwitchVideoLesson?.(targetLesson);

    if (ytId) {
      setYoutubeVideoId(ytId);
      setCustomMp4Url(null);
      setVideoSourceType('youtube');
    } else {
      setCustomMp4Url(targetUrl);
      setYoutubeVideoId(null);
      setVideoSourceType('mp4');
    }

    setCustomTitle(targetLesson.title);
    setUrlError(null);
    setIsAttachModalOpen(false);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Chalkboard line reveals as video progresses
  const notesCount = lesson.lectureNotes.length;
  const progressRatio = Math.min(1, currentTime / lesson.checkpointTimestamp);
  const visibleNotesCount = Math.max(1, Math.min(notesCount, Math.ceil(progressRatio * notesCount)));

  return (
    <div className="relative w-full bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-sm p-3 sm:p-3.5 sketchbook-shadow notebook-sheet rotate-[-0.2deg] transition-transform hover:rotate-0">
      {/* Top washi tape & pin */}
      <WashiTape variant="blue" className="absolute -top-2.5 left-8 w-24 -rotate-1 z-10" />
      <PushPin color="#4E9B87" className="absolute top-2.5 right-3 z-10" />

      {/* Video Lesson Header with Custom URL button */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-[#E8DFD0]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-handwriting font-bold text-xs bg-[#4E9B87]/15 text-[#2E6859] px-2 py-0.5 rounded-xs border border-[#4E9B87]/30 flex items-center gap-1">
            <ChalkboardIcon className="w-3.5 h-3.5 text-[#2E6859]" />
            <span>Video Bài Giảng Tương Tác</span>
          </span>

          {/* Button: Gắn link video học thử */}
          <button
            onClick={() => {
              setIsAttachModalOpen(true);
              setUrlError(null);
            }}
            type="button"
            className="px-2.5 py-0.5 bg-[#FFF5DC] hover:bg-[#FCEAC1] text-[#7A4C0B] border border-[#E3C382] rounded-xs font-handwriting font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
            title="Dán link YouTube hoặc video MP4 và đồng bộ kịch bản tranh luận cùng Bo"
          >
            <LinkChainIcon className="w-3.5 h-3.5 text-[#C97A13]" />
            <span>{videoSourceType === 'chalkboard' ? '🔗 Gắn link video & Đồng bộ tranh biện' : 'Đổi video / chủ đề khác'}</span>
          </button>

          {videoSourceType !== 'chalkboard' && (
            <span className="text-[11px] font-mono text-[#2E6859] bg-[#E8F5F1] px-2 py-0.5 rounded-full border border-[#BCE1D7] flex items-center gap-1 font-bold">
              <CheckCircleIcon className="w-3 h-3 text-[#2E6859]" />
              <span>Khớp kịch bản: {lesson.title.split('&')[0]}</span>
            </span>
          )}
        </div>

        {/* Quick jump to question button */}
        <button
          onClick={onJumpToCheckpoint}
          type="button"
          className="text-xs font-handwriting text-[#B87A1E] hover:underline flex items-center gap-1 cursor-pointer bg-[#FFF5DC] px-2 py-0.5 border border-[#F2DCA5] rounded-xs"
          title="Tua nhanh tới điểm dừng câu hỏi"
        >
          <span>Tới câu hỏi suy ngẫm (00:{lesson.checkpointTimestamp})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ATTACH VIDEO MODAL (Synchronized video & debate scenario) */}
      {/* ========================================================================= */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#FAF6EE] border-3 border-[#DDD6C8] rounded-sm p-5 sm:p-6 sketchbook-shadow notebook-sheet rotate-[0.2deg]">
            <WashiTape variant="pink" className="absolute -top-3 left-10 w-28 -rotate-2" />
            <button
              onClick={() => setIsAttachModalOpen(false)}
              type="button"
              className="absolute top-3 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#EFE8DA] hover:bg-[#E2D8C5] text-[#54483C] font-mono font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E8DFD0]">
              <div className="p-1.5 rounded-xs bg-[#FFF5DC] border border-[#F0D5A3]">
                <LinkChainIcon className="w-5 h-5 text-[#E8A33D]" />
              </div>
              <div>
                <h3 className="font-handwriting font-bold text-lg text-[#3B3026]">
                  Gắn link video & Đồng bộ kịch bản tranh luận
                </h3>
                <p className="text-xs font-handwriting text-[#7C6E60]">
                  Đảm bảo video bên trái và phần tóm tắt văn bản / câu hỏi Bo cãi bên phải <strong>khớp nhau 100%</strong>.
                </p>
              </div>
            </div>

            {/* SECTION 1: 1-CLICK PRE-SET TEST VIDEOS (MATCHES 100%) */}
            <div className="space-y-2 mb-4 p-3 bg-[#FFFBF0] border-2 border-[#F0D5A3] rounded-xs">
              <div className="text-xs font-handwriting font-bold text-[#8C5D19] flex items-center gap-1.5">
                <SparkleIcon className="w-4 h-4 text-[#E8A33D]" />
                <span>Cách 1: Chọn nhanh video mẫu (Khớp sẵn 100% Video & Kịch bản Bo cãi):</span>
              </div>

              <div className="space-y-1.5">
                {SAMPLE_YOUTUBE_VIDEOS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    type="button"
                    className="w-full text-left p-2.5 rounded-xs border border-[#E3D3BD] bg-white hover:bg-[#FFF5DC] hover:border-[#E8A33D] transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#3B3026] group-hover:text-[#8C5D19] flex items-center gap-1.5">
                        <PinTackIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
                        <span>{sample.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#7A6A5A] mt-0.5 pl-5">
                        Bài toán trong video: <strong>{sample.mathProblem}</strong> · {sample.grade}
                      </div>
                    </div>
                    <span className="text-xs font-handwriting font-bold text-[#E8A33D] shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                      Khớp bài này ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 2: CUSTOM URL ATTACHMENT WITH TOPIC MAPPING */}
            <div className="space-y-3 pt-3 border-t-2 border-dashed border-[#E8DFD0]">
              <div className="text-xs font-handwriting font-bold text-[#473B2E] flex items-center gap-1.5">
                <LinkChainIcon className="w-4 h-4 text-[#4E9B87]" />
                <span>Cách 2: Dán đường link video tùy ý của bạn (YouTube / MP4):</span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#6B5E50] mb-1 font-semibold">
                  URL Video YouTube hoặc MP4:
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setUrlError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-white border-2 border-[#D8CEBC] focus:border-[#E8A33D] rounded-xs px-3 py-2 text-xs font-mono text-[#2B231D] outline-none"
                />
              </div>

              {/* Topic Alignment Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-handwriting font-bold text-[#54483B]">
                  <span>Chọn chủ đề để khớp tóm tắt & câu hỏi của Bo:</span>
                  <button
                    onClick={() => setIsCustomProblemMode(prev => !prev)}
                    type="button"
                    className="text-xs text-[#2E6859] underline cursor-pointer hover:text-[#1B4B3F]"
                  >
                    {isCustomProblemMode ? 'Chọn từ danh mục có sẵn' : 'Tự gõ bài toán của video'}
                  </button>
                </div>

                {!isCustomProblemMode ? (
                  <select
                    value={selectedDebateTopicId}
                    onChange={(e) => setSelectedDebateTopicId(e.target.value)}
                    className="w-full bg-white border-2 border-[#D8CEBC] rounded-xs p-2 text-xs font-handwriting text-[#332A22] outline-none focus:border-[#E8A33D]"
                  >
                    <option value="VID_003">Toán 8: Bất phương trình &amp; Đổi chiều số âm (−2x &gt; 6)</option>
                    <option value="VID_001">Toán 9: Giải phương trình tích &amp; Khử ẩn x (x(x − 2) = 3x)</option>
                    <option value="VID_002">Toán 7: Quy tắc dấu ngoặc &amp; Đổi dấu âm (5x − (3x − 2))</option>
                    <option value="VID_004">Toán 6: Phép cộng phân số khác mẫu (1/3 + 1/4)</option>
                    <option value="VID_005">Toán 7: Quy tắc nhân luỹ thừa cùng cơ số (2³ × 2²)</option>
                  </select>
                ) : (
                  <div className="space-y-2 p-2.5 bg-white border-2 border-[#E8A33D]/60 rounded-xs animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-mono text-[#7A6A5A] mb-0.5">
                        Tên bài toán trong video của bạn:
                      </label>
                      <input
                        type="text"
                        value={customMathEquation}
                        onChange={(e) => setCustomMathEquation(e.target.value)}
                        placeholder="Ví dụ: Giải phương trình 3x − 5 = x + 7"
                        className="w-full bg-[#FAF6EE] border border-[#D8CEBC] rounded-xs p-1.5 text-xs font-mono text-[#2B231D] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#7A6A5A] mb-0.5">
                        Luận điểm Bo cãi cùn (ngộ nhận mà học sinh hay mắc):
                      </label>
                      <input
                        type="text"
                        value={customBoFallacy}
                        onChange={(e) => setCustomBoFallacy(e.target.value)}
                        placeholder="Ví dụ: Chuyển vế hạ số xuống không cần đổi dấu"
                        className="w-full bg-[#FAF6EE] border border-[#D8CEBC] rounded-xs p-1.5 text-xs font-handwriting text-[#2B231D] outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {urlError && (
                <p className="text-xs text-[#B83E28] font-handwriting font-bold">
                  {urlError}
                </p>
              )}

              <button
                onClick={handleApplyCustomUrl}
                type="button"
                className="w-full py-2.5 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-sm rounded-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4 text-white" />
                <span>Áp dụng video & Đồng bộ kịch bản tranh luận ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIDEO PLAYER ARENA: YOUTUBE EMBED OR CHALKBOARD SIMULATOR */}
      {/* ========================================================================= */}
      <div className="relative bg-[#1E2623] border-3 sm:border-4 border-[#3D352E] rounded-sm p-2.5 sm:p-3 text-white shadow-inner overflow-hidden">
        {/* Vintage Film Strip Holes (Top) */}
        <div className="flex justify-between items-center px-1 pb-1.5 border-b border-white/10 opacity-60 select-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-3 h-1.5 rounded-xs bg-white/20" />
          ))}
        </div>

        {/* ------------------- CASE 1: YOUTUBE EMBED ------------------- */}
        {videoSourceType === 'youtube' && youtubeVideoId && (
          <div className="py-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-[#8CE6CF] pb-1 border-b border-white/10">
              <span className="truncate pr-2 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E8A33D] animate-ping shrink-0" />
                <span>{customTitle || lesson.title}</span>
              </span>
              <button
                onClick={() => setVideoSourceType('chalkboard')}
                type="button"
                className="text-[11px] text-[#F5D65D] hover:underline cursor-pointer shrink-0"
              >
                ↩ Quay lại Bảng phấn
              </button>
            </div>

            {/* YouTube IFrame Player */}
            <div className="relative w-full aspect-video rounded-xs overflow-hidden border border-white/20 bg-black shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=1&rel=0`}
                title={customTitle || 'YouTube Video Bài Giảng'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Interactive Call to Action Banner directly below the video */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#FFF8EB] border-2 border-[#E8A33D] rounded-xs shadow-xs text-xs font-handwriting">
              <div className="flex items-center gap-1.5 text-[#8C5D19]">
                <SparkleIcon className="w-4 h-4 text-[#E8A33D] shrink-0" />
                <span className="font-bold">Đang xem video giảng bài. Đến đoạn có cạm bẫy, bấm nút bên cạnh:</span>
              </div>
              <button
                onClick={onJumpToCheckpoint}
                type="button"
                className="py-1.5 px-3 bg-[#E8A33D] hover:bg-[#D9932B] text-white font-handwriting font-bold text-xs rounded-xs shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <HandStopIcon className="w-3.5 h-3.5" />
                <span>Dừng lại tranh luận cùng Bo ngay ➔</span>
              </button>
            </div>

            {/* Synchronization Guarantee Note */}
            <div className="p-2 bg-[#283530] border border-white/10 rounded-xs text-[11px] font-mono text-[#8CE6CF] flex items-center justify-between">
              <span>Đã đồng bộ tranh biện với bài toán: <strong>{lesson.blackboardTitle}</strong></span>
              <span className="text-[#F5D65D]">Khớp 100% tóm tắt ➔</span>
            </div>
          </div>
        )}

        {/* ------------------- CASE 2: DIRECT MP4 VIDEO ------------------- */}
        {videoSourceType === 'mp4' && customMp4Url && (
          <div className="py-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-[#8CE6CF] pb-1 border-b border-white/10">
              <span className="truncate pr-2 font-bold">{customTitle || lesson.title}</span>
              <button
                onClick={() => setVideoSourceType('chalkboard')}
                type="button"
                className="text-[11px] text-[#F5D65D] hover:underline cursor-pointer shrink-0"
              >
                ↩ Quay lại Bảng phấn
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-xs overflow-hidden border border-white/20 bg-black">
              <video
                ref={videoElementRef}
                src={customMp4Url}
                controls
                autoPlay={isPlaying}
                onTimeUpdate={handleHtml5TimeUpdate}
                onPlay={() => {
                  if (!isPlaying) onTogglePlay();
                }}
                onPause={() => {
                  if (isPlaying) onTogglePlay();
                }}
                className="w-full h-full"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#FFF8EB] border-2 border-[#E8A33D] rounded-xs shadow-xs text-xs font-handwriting">
              <div className="flex items-center gap-1.5 text-[#8C5D19]">
                <SparkleIcon className="w-4 h-4 text-[#E8A33D] shrink-0" />
                <span>Bấm nút khi gặp câu hỏi để Bo cùng tranh luận:</span>
              </div>
              <button
                onClick={onJumpToCheckpoint}
                type="button"
                className="py-1.5 px-3 bg-[#E8A33D] hover:bg-[#D9932B] text-white font-handwriting font-bold text-xs rounded-xs shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <HandStopIcon className="w-3.5 h-3.5" />
                <span>Dừng lại tranh luận cùng Bo ngay ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------- CASE 3: CHALKBOARD SIMULATOR (Default) ------------------- */}
        {videoSourceType === 'chalkboard' && (
          <div className="relative py-2.5 min-h-[180px] sm:min-h-[220px] flex flex-col justify-between">
            {/* Top Classroom Bar: Cô Lam mini badge + Lesson Topic */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E0F3ED] border border-[#4E9B87] overflow-hidden flex items-center justify-center shrink-0">
                  <TutorLamAvatar size="sm" className="scale-75 -translate-y-1" />
                </div>
                <div>
                  <div className="text-[11px] font-handwriting text-[#8CE6CF] font-bold">Cô Lam đang giảng:</div>
                  <div className="text-xs sm:text-sm font-semibold text-[#F3EFE6] leading-tight">{lesson.blackboardTitle}</div>
                </div>
              </div>

              {/* Checkpoint Status Indicator */}
              {phase === 'CHECKPOINT_REACHED' || phase === 'BO_DEBATE' || phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE' ? (
                <QuestionStamp className="scale-80" />
              ) : isPlaying ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-[#8CE6CF] bg-[#4E9B87]/20 px-2 py-0.5 rounded-full border border-[#4E9B87]/40">
                  <span className="w-2 h-2 rounded-full bg-[#6B9E5C] animate-pulse" />
                  Đang phát
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[#E8A33D] bg-[#E8A33D]/20 px-2 py-0.5 rounded-full border border-[#E8A33D]/40">
                  Tạm dừng
                </span>
              )}
            </div>

            {/* Chalkboard Written Notes (Appear dynamically with video time) */}
            <div className="flex-1 bg-[#242F2B] p-2.5 sm:p-3 rounded-xs border border-white/5 space-y-1.5 font-handwriting text-sm sm:text-base text-[#E8F0EC]">
              {lesson.lectureNotes.slice(0, visibleNotesCount).map((note, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-300"
                >
                  <span className="text-[#8CE6CF] select-none mt-1 shrink-0">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </span>
                  <p className={idx === visibleNotesCount - 1 ? 'text-[#FFF3D6] font-bold' : 'text-[#C5D8D0]'}>
                    {note}
                  </p>
                </div>
              ))}

              {/* Live question overlay when checkpoint is active */}
              {(phase === 'CHECKPOINT_REACHED' || phase === 'BO_DEBATE' || phase === 'BO_CONCEDED' || phase === 'CO_LAM_CLOSURE') && (
                <div className="mt-4 p-3 bg-[#E8A33D]/15 border border-[#E8A33D]/40 rounded-xs animate-in zoom-in-95 duration-300">
                  <div className="text-xs uppercase tracking-wider font-mono text-[#F5D65D] font-bold flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#F5D65D]" />
                    <span>Câu hỏi suy ngẫm trên bảng:</span>
                  </div>
                  <div className="font-semibold text-[#FFFDF8] text-base">
                    {lesson.checkpointQuestion.prompt}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vintage Film Strip Holes (Bottom) */}
        <div className="flex justify-between items-center px-1 pt-2 border-t border-white/10 opacity-60 select-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-3 h-2 rounded-xs bg-white/20" />
          ))}
        </div>

        {/* Standard Video Player Control Bar for Chalkboard mode */}
        {videoSourceType === 'chalkboard' && (
          <div className="mt-3 pt-3 border-t border-white/15 flex flex-col gap-2">
            {/* Progress Timeline Slider with Checkpoint Pin */}
            <div className="relative flex items-center">
              {/* Checkpoint Flag Pin on timeline */}
              <div 
                className="absolute -top-3.5 z-10 -translate-x-1/2 cursor-pointer flex flex-col items-center group"
                style={{ left: `${(lesson.checkpointTimestamp / lesson.duration) * 100}%` }}
                onClick={onJumpToCheckpoint}
                title={`Điểm dừng câu hỏi tại ${formatTime(lesson.checkpointTimestamp)}`}
              >
                <span className="text-[10px] font-mono text-[#F5D65D] bg-[#2E2825] px-1 rounded-xs border border-[#F5D65D] shadow-xs group-hover:scale-110 transition-transform">
                  ?
                </span>
                <div className="w-0.5 h-3 bg-[#F5D65D]" />
              </div>

              <input
                type="range"
                min="0"
                max={lesson.duration}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E8A33D]"
              />
            </div>

            {/* Controls: Play, Time, Speed, Freeze */}
            <div className="flex items-center justify-between text-xs font-mono text-[#C5D8D0]">
              <div className="flex items-center gap-3">
                {/* Play / Pause Button */}
                <button
                  onClick={onTogglePlay}
                  type="button"
                  className="p-1.5 bg-[#FAF6EE] hover:bg-white text-[#2B3632] rounded-xs shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
                  title={isPlaying ? 'Tạm dừng video' : 'Tiếp tục phát video'}
                >
                  {isPlaying ? <VideoPauseIcon className="w-3.5 h-3.5" /> : <VideoPlayIcon className="w-3.5 h-3.5" />}
                </button>

                {/* Timestamp */}
                <span>
                  {formatTime(currentTime)} / {formatTime(lesson.duration)}
                </span>

                {/* Speed Toggle */}
                <button
                  onClick={() => setPlaybackSpeed(s => s === 1 ? 1.5 : 1)}
                  type="button"
                  className="px-2 py-0.5 rounded-xs bg-white/10 hover:bg-white/20 text-[11px] text-[#F3EFE6] cursor-pointer"
                >
                  {playbackSpeed}x
                </button>
              </div>

              {/* "Khoan đã cô ơi!" Button (Student-initiated freeze: Mouse, Touch, Keyboard 'K') */}
              <button
                onClick={onTriggerFreeze}
                type="button"
                className="px-2.5 py-1 bg-[#FFF8EB] hover:bg-white text-[#7B4E12] font-handwriting font-bold text-xs rounded-xs border border-[#F0D5A3] shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                title="Dừng video để xem tóm tắt hoặc đặt câu hỏi (Phím tắt: K)"
              >
                <HandStopIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
                <span>Khoan đã cô ơi!</span>
                <kbd className="hidden sm:inline-block px-1 py-0.2 bg-[#EBE3D0] text-[#5C4F42] rounded-xs text-[10px] font-mono font-bold">K</kbd>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet Note Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-[#7A6D5E] font-handwriting">
        <span className="flex items-center gap-1.5">
          <GentleLightbulb className="w-4 h-4 text-[#E8A33D] shrink-0" />
          <span>Video bên trái và kịch bản tóm tắt / tranh biện của Bo bên phải luôn được đồng bộ 100%.</span>
        </span>
        <span className="text-[#326759] font-bold">Lớp học tương tác 360°</span>
      </div>
    </div>
  );
};
