import React, { useEffect, useState, useRef } from 'react';
import {
  ReasoningEvent,
  AgentName,
  AgentState,
  PhaseType,
  PhaseStatus,
  ToolResultPayload,
} from '../../types/reasoning';
import { ReasoningSource } from '../../services/reasoningSource';
import { mapBackendToReasoningEvent } from '../../services/reasoningAdapter';
import { PhaseStepper } from './PhaseStepper';
import { AgentStatusRow } from './AgentStatusRow';
import { EventRow } from '../shared/EventRow';
import mockReasoningEvents from '../../../mock/mock_reasoning_events.json';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Activity,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface WarRoomPanelProps {
  source: ReasoningSource;
  defaultCollapsed?: boolean;
  onTransferDraftToTimeline?: (draftLesson?: any) => void;
  onToggleStreamMode?: () => void;
  isLiveStream?: boolean;
  autoPlayReplay?: boolean;
}

export const WarRoomPanel: React.FC<WarRoomPanelProps> = ({
  source,
  defaultCollapsed = false,
  onTransferDraftToTimeline,
  onToggleStreamMode,
  isLiveStream,
  autoPlayReplay = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [events, setEvents] = useState<ReasoningEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('active') === '1' || s.get('completed') === '1' || s.get('full') === '1') {
        return ((mockReasoningEvents as any[]) || []).map(mapBackendToReasoningEvent);
      }
    }
    return [];
  });
  const [currentPhase, setCurrentPhase] = useState<PhaseType | null>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('completed') === '1' || s.get('full') === '1') {
        return 'bloom';
      }
      if (s.get('active') === '1') {
        return 'roundtable';
      }
    }
    return null;
  });
  const [phaseStatuses, setPhaseStatuses] = useState<Record<PhaseType, PhaseStatus>>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('completed') === '1' || s.get('full') === '1') {
        return {
          extract: 'completed',
          rag: 'completed',
          roundtable: 'completed',
          bloom: 'completed',
        };
      }
      if (s.get('active') === '1') {
        return {
          extract: 'completed',
          rag: 'completed',
          roundtable: 'running',
          bloom: 'pending',
        };
      }
    }
    return {
      extract: 'pending',
      rag: 'pending',
      roundtable: 'pending',
      bloom: 'pending',
    };
  });
  const [agentStates, setAgentStates] = useState<Record<AgentName, AgentState>>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('active') === '1') {
      return {
        'Trí': 'thinking',
        'Bo': 'speaking',
        'An': 'idle',
        'Dispatcher': 'idle',
        'Assessor': 'idle',
      };
    }
    return {
      'Trí': 'idle',
      'Bo': 'idle',
      'An': 'idle',
      'Dispatcher': 'idle',
      'Assessor': 'idle',
    };
  });
  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('completed') === '1' || s.get('full') === '1') return false;
      if (s.get('active') === '1') return true;
    }
    return false;
  });
  const [speed, setSpeed] = useState(1.0);
  const [isDone, setIsDone] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('completed') === '1' || s.get('full') === '1') return true;
    }
    return false;
  });

  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const autoTransferCancelledRef = useRef(false);
  const onTransferRef = useRef(onTransferDraftToTimeline);
  onTransferRef.current = onTransferDraftToTimeline;
  const eventsRef = useRef(events);
  eventsRef.current = events;

  // Effect 1: Quản lý kích hoạt đếm ngược khi hoàn thành
  useEffect(() => {
    if (!isDone) {
      autoTransferCancelledRef.current = false;
      setAutoCountdown(null);
      return;
    }
    if (isPlaying && !autoTransferCancelledRef.current) {
      setAutoCountdown((prev) => (prev === null ? 5 : prev));
    }
  }, [isDone, isPlaying]);

  // Effect 2: Đếm ngược từng giây và chuyển giao bản nháp giáo án
  useEffect(() => {
    if (!isDone || autoCountdown === null || autoTransferCancelledRef.current) {
      return;
    }

    if (autoCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (autoCountdown === 0) {
      const doneEvt = [...eventsRef.current].reverse().find((e) => (e.metadata as any)?.lesson);
      const lesson = (doneEvt?.metadata as any)?.lesson;
      onTransferRef.current?.(lesson);
      setAutoCountdown(null);
    }
  }, [isDone, autoCountdown]);

  const feedBottomRef = useRef<HTMLDivElement>(null);

  const inferPhaseFromEvent = (evt: ReasoningEvent): PhaseType | null => {
    if (evt.phase) return evt.phase;
    const toolName = (evt.toolCall?.toolName || (evt.toolCall as any)?.name || evt.toolResult?.toolName || '').toLowerCase();
    const evtType = (evt.eventType || '').toLowerCase();
    if (toolName.includes('extract') || toolName.includes('parse') || evtType.includes('extract')) return 'extract';
    if (toolName.includes('rag') || toolName.includes('search') || toolName.includes('retrieve') || evtType.includes('rag')) return 'rag';
    if (toolName.includes('roundtable') || evtType === 'cross_check_verdict' || evtType === 'debate_turn') return 'roundtable';
    if (toolName.includes('bloom') || toolName.includes('assess') || evtType === 'checkpoint_created') return 'bloom';
    return null;
  };

  useEffect(() => {
    const unsubStatus = source.onStatusChange?.((status) => {
      setIsPlaying(status.isPlaying);
      setSpeed(status.speed);
    });

    const unsubscribe = source.subscribe((rawEvt) => {
      const evt = mapBackendToReasoningEvent(rawEvt);
      const normType = evt.eventType;

      setEvents((prev) => [...prev, evt]);

      if (evt.agent) {
        let nextState: AgentState = 'idle';
        if (normType === 'thinking') nextState = 'thinking';
        else if (normType === 'tool_call') nextState = 'tool_calling';
        else if (normType === 'speaking' || normType === 'cross_check_verdict') nextState = 'speaking';

        setAgentStates((prev) => ({
          ...prev,
          [evt.agent]: nextState,
        }));
      }

      const detectedPhase = inferPhaseFromEvent(evt);
      if (detectedPhase) {
        setCurrentPhase(detectedPhase);
        setPhaseStatuses((prev) => {
          const updated = { ...prev };
          const phaseOrder: PhaseType[] = ['extract', 'rag', 'roundtable', 'bloom'];
          const currentIndex = phaseOrder.indexOf(detectedPhase);

          phaseOrder.forEach((p, idx) => {
            if (idx < currentIndex) updated[p] = 'completed';
            else if (idx === currentIndex) updated[p] = 'running';
          });
          return updated;
        });
      }

      if (evt.eventType === 'done') {
        setIsDone(true);
        setPhaseStatuses({
          extract: 'completed',
          rag: 'completed',
          roundtable: 'completed',
          bloom: 'completed',
        });
        setAgentStates({
          'Trí': 'idle',
          'Bo': 'idle',
          'An': 'idle',
          'Dispatcher': 'idle',
          'Assessor': 'idle',
        });
      }
    });

    return () => {
      unsubscribe();
      unsubStatus?.();
    };
  }, [source]);

  useEffect(() => {
    if (!isCollapsed && isPlaying) {
      feedBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, isCollapsed, isPlaying]);

  const handleTogglePlay = () => {
    sound.playPencilTap();
    if (isPlaying) {
      source.pause();
    } else {
      if (events.length === 0 || isDone) {
        setEvents([]);
        setIsDone(false);
        source.start();
      } else {
        source.resume();
      }
    }
  };

  // Tự động phát khi showcase đang chạy (chỉ phát 1 lần mỗi lần mount)
  const hasAutoPlayedRef = useRef<boolean>(false);
  useEffect(() => {
    if (autoPlayReplay && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      handleTogglePlay();
    }
  }, [autoPlayReplay]);

  const handleReset = () => {
    sound.playPaperRustle();
    source.stop();
    setEvents([]);
    setIsDone(false);
    autoTransferCancelledRef.current = false;
    setAutoCountdown(null);
    setCurrentPhase(null);
    setPhaseStatuses({
      extract: 'pending',
      rag: 'pending',
      roundtable: 'pending',
      bloom: 'pending',
    });
    setAgentStates({
      'Trí': 'idle',
      'Bo': 'idle',
      'An': 'idle',
      'Dispatcher': 'idle',
      'Assessor': 'idle',
    });
  };

  const handleChangeSpeed = (newSpeed: number) => {
    sound.playPencilTap();
    source.setSpeed(newSpeed);
  };

  // Helper to load all 18 demo events at once for rich inspection / screenshot
  const handleLoadFullDemo = () => {
    sound.playSuccessChime();
    const allEvts = ((mockReasoningEvents as any[]) || []).map(mapBackendToReasoningEvent);
    setEvents(allEvts);
    setIsDone(true);
    setCurrentPhase('bloom');
    setPhaseStatuses({
      extract: 'completed',
      rag: 'completed',
      roundtable: 'completed',
      bloom: 'completed',
    });
    setAgentStates({
      'Trí': 'idle',
      'Bo': 'speaking',
      'An': 'idle',
      'Dispatcher': 'idle',
      'Assessor': 'idle',
    });
  };

  return (
    <div className="w-full space-y-4 mb-6">
      {/* =========================================================================
          DẢI "ĐÃ NẠP SẴN" - KHỚP 100% TRANG 1 MOCKUP
          ========================================================================= */}
      <div className="w-full bg-white border border-[#E2EAD2] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-6">
          <span className="bg-[#C8F169] text-[#121712] font-extrabold text-[11px] px-3 py-1 rounded-md tracking-wider uppercase whitespace-nowrap">
            ĐÃ NẠP SẴN
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide">
              VIDEO BÀI GIẢNG
            </span>
            <span className="text-[12px] font-bold text-[#121712]">
              Bài 1.1 Vectơ trong không gian · Thầy Nguyễn Phan Tiến
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide">
              TÀI LIỆU RAG
            </span>
            <span className="text-[12px] font-bold text-[#121712]">
              SGK Toán 12 Kết nối tri thức, Tập 1 · Bài 6, tr.45–59
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide">
              KHO TRI THỨC
            </span>
            <span className="text-[12px] font-bold text-[#121712]">
              24 kiến thức · 20 ngộ nhận · 20 bài tập
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            sound.playPencilTap();
            handleReset();
            source.start();
          }}
          className="px-4 py-2 rounded-full bg-[#121712] hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer shadow-xs whitespace-nowrap"
        >
          <span>↻ Phát lại phiên họp</span>
        </button>
      </div>

      <div
        id="warroom-section"
        className="w-full bg-white border border-[#E2EAD2] rounded-3xl shadow-xs overflow-hidden transition-all duration-300"
      >
      {/* =========================================================================
          HEADER SÁNG CHUẨN LIME SOFT: THÔNG TIN PHIÊN SUY LUẬN + NÚT ĐIỀU KHIỂN
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-7 py-5 bg-[#FDFEFA] border-b border-[#E2EAD2] select-none">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-[#121712]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2.5">
                <h2
                  style={{ fontSize: '26px', lineHeight: '34px' }}
                  className="font-extrabold text-[#121712] tracking-tight m-0"
                >
                  War Room · Hội đồng AI soạn kịch bản
                </h2>
              </div>
              {source.isReplay() ? (
                <button
                  type="button"
                  onClick={onToggleStreamMode}
                  title="Nhấn để chuyển sang kênh SSE từ backend (route hiện phát lại fixture)"
                  className="bg-[#F3F8E8] hover:bg-[#E2EAD2] text-stone-700 border border-[#E2EAD2] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider cursor-pointer transition shadow-2xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-stone-400" />
                  <span>Mô phỏng (Replay)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onToggleStreamMode}
                  title="Nhấn để chuyển về chế độ Replay Mock"
                  style={{ backgroundColor: "#121712", color: "#C8F169" }} className="hover:bg-stone-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider cursor-pointer transition shadow-xs flex items-center gap-1.5 border border-[#121712]"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C8F169] animate-ping" />
                  <span style={{ color: "#C8F169" }}>SSE backend (fixture)</span>
                </button>
              )}
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Giám sát bàn tròn suy luận, tranh luận chéo và gọi công cụ thời gian thực
            </p>
          </div>
        </div>

        {/* Thanh công cụ điều khiển: Play, Reset, Speed, Collapse */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="warroom-toggle-play"
            type="button"
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer shadow-xs ${
              isPlaying || (events.length > 0 && currentPhase === 'roundtable')
                ? 'bg-[#121712] text-white hover:bg-black'
                : 'bg-[#C8F169] text-[#121712] hover:bg-[#bbf055] border border-[#b4e64f]'
            }`}
          >
            {isPlaying || (events.length > 0 && currentPhase === 'roundtable') ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Phát suy luận</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer border border-stone-200"
            title="Khởi tạo lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Segmented Speed Controller */}
          <div className="flex items-center bg-[#F3F8E8] rounded-full p-0.5 border border-[#E2EAD2]">
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleChangeSpeed(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                  speed === s
                    ? 'bg-[#121712] text-white shadow-2xs'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer border border-stone-200 flex items-center gap-1 text-xs font-bold"
            title={isCollapsed ? 'Mở rộng War Room' : 'Thu gọn War Room'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          NỘI DUNG CHÍNH WAR ROOM: STEPPER + AGENT ROSTER + VERTICAL TIMELINE
          ========================================================================= */}
      {!isCollapsed && (
        <div className="p-6 sm:p-7 space-y-6">
          {/* 1. STEPPER 4 PHA CÓ ĐƯỜNG NỐI */}
          <PhaseStepper currentPhase={currentPhase} phaseStatuses={phaseStatuses} />

          {/* 2. HÀNG AVATAR TÁC TỬ ĐỒNG BỘ */}
          <AgentStatusRow agentStates={agentStates} />

          {/* 3. DÒNG SỰ KIỆN SUY LUẬN (VERTICAL TIMELINE STREAM) */}
          <div className="bg-[#FDFEFA] rounded-3xl border border-[#E2EAD2] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-700" />
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Dòng sự kiện suy luận
                </span>
                <span className="text-xs font-mono font-bold text-stone-700 bg-[#F3F8E8] px-2.5 py-0.5 rounded-full border border-[#E2EAD2]">
                  {events.length} sự kiện
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-500 font-mono">
                {events.length > 0 && (
                  <span>
                    Mới nhất: +{(() => {
                  const t0 = events[0]?.timestamp ? (typeof events[0].timestamp === 'number' ? events[0].timestamp : new Date(events[0].timestamp).getTime()) : 0;
                  const t1 = events[events.length - 1]?.timestamp ? (typeof events[events.length - 1].timestamp === 'number' ? events[events.length - 1].timestamp : new Date(events[events.length - 1].timestamp).getTime()) : 0;
                  const diff = Math.max(0, Math.round((t1 - t0) / 1000));
                  const m = Math.floor(diff / 60).toString().padStart(2, '0');
                  const s = (diff % 60).toString().padStart(2, '0');
                  return `${m}:${s}`;
                })()}
                  </span>
                )}
                {events.length === 0 && (
                  <button
                    type="button"
                    onClick={handleLoadFullDemo}
                    className="text-stone-700 hover:text-black font-sans font-semibold underline underline-offset-2 cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-stone-800" />
                    <span>Nạp trước dữ liệu mẫu (18 sự kiện)</span>
                  </button>
                )}
              </div>
            </div>

            {/* BANNER THÔNG BÁO HOÀN TẤT & CHUYỂN CẢNH SANG TIMELINE EDITOR */}
          {isDone && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121712] text-white border-2 border-[#C8F169] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-md animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C8F169] text-[#121712] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Hoàn tất trích xuất kịch bản bài giảng</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C8F169] text-[#121712] text-[11px] font-black">
                      Sẵn sàng kiểm duyệt
                    </span>
                  </h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Tất cả các tác tử đã đạt được đồng thuận sư phạm và phân loại Tháp Bloom. Kịch bản bài học đã sẵn sàng để chuyển sang Trạm 3.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {autoCountdown !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPencilTap();
                      autoTransferCancelledRef.current = true;
                      setAutoCountdown(null);
                    }}
                    className="px-3 py-2 rounded-full border border-stone-600 hover:bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer transition"
                    title="Hủy tự động chuyển màn hình"
                  >
                    Dừng đếm ({autoCountdown}s)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    sound.playSuccessChime();
                    autoTransferCancelledRef.current = true;
                    setAutoCountdown(null);
                    const doneEvt = [...eventsRef.current].reverse().find((e) => (e.metadata as any)?.lesson);
                    const draft = (doneEvt?.metadata as any)?.lesson;
                    onTransferDraftToTimeline?.(draft);
                  }}
                  style={{ backgroundColor: '#C8F169', color: '#121712' }}
                  className="px-4 py-2.5 rounded-full bg-[#C8F169] hover:bg-[#bbf055] text-[#121712] font-black text-xs flex items-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <span style={{ color: '#121712' }}>Chuyển sang Timeline Editor (Trạm 3)</span>
                  <ArrowRight className="w-4 h-4 text-[#121712]" style={{ color: '#121712' }} />
                </button>
              </div>
            </div>
          )}

          {/* Vùng hiển thị sự kiện theo Timeline dọc */}
            <div className="space-y-1 select-text">
              {events.length === 0 ? (
                /* TRẠNG THÁI CHƯA PHÁT: NÚT PHÁT LỚN Ở TRUNG TÂM + LỜI HƯỚNG DẪN TRỰC QUAN */
                <div className="py-14 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-2xl border border-dashed border-stone-300">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-20 h-20 rounded-full bg-[#C8F169] hover:bg-[#bbf055] text-[#121712] shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-[#b4e64f]"
                    title="Nhấn để phát phiên suy luận"
                  >
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </button>

                  <div className="space-y-1.5 max-w-md">
                    <h3 className="text-base font-extrabold text-[#121712]">
                      Khởi động phiên suy luận đa tác tử
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Nhấn nút <strong>"Phát"</strong> để theo dõi trực tiếp quy trình 4 bước: Trích xuất đề bài → Truy hồi SGK → Bàn tròn tranh luận (Trí, Bo, An) → Đánh giá Tháp Bloom.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleLoadFullDemo}
                      className="px-4 py-2 rounded-full text-xs font-bold text-stone-800 bg-[#F3F8E8] hover:bg-[#eaf4d5] border border-[#E2EAD2] transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Xem toàn bộ dòng sự kiện mẫu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                events.map((evt, idx) => {
                  let matchedToolResult: ToolResultPayload | undefined;
                  if (evt.eventType === 'tool_call') {
                    const nextResult = events.slice(idx + 1).find((e) =>
                      e.eventType === 'tool_result' &&
                      (
                        (evt.toolCall?.callId && e.toolResult?.callId === evt.toolCall.callId) ||
                        (e.agent === evt.agent && (!e.toolResult?.toolName || e.toolResult.toolName === evt.toolCall?.toolName))
                      )
                    );
                    matchedToolResult = nextResult?.toolResult;
                  }
                  return (
                    <EventRow
                      key={evt.id || idx}
                      event={evt}
                      isLast={idx === events.length - 1}
                      baseTimestamp={events[0]?.timestamp}
                      index={idx}
                      matchedToolResult={matchedToolResult}
                      isDone={isDone}
                    />
                  );
                })
              )}
              <div ref={feedBottomRef} />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
