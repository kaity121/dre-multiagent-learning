import React, { useEffect, useState, useRef } from 'react';
import {
  ReasoningEvent,
  AgentName,
  AgentState,
  PhaseType,
  PhaseStatus,
} from '../../types/reasoning';
import { ReasoningSource } from '../../services/reasoningSource';
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
  ArrowRight
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface WarRoomPanelProps {
  source: ReasoningSource;
  defaultCollapsed?: boolean;
  onTransferDraftToTimeline?: (draftLesson?: any) => void;
}

export const WarRoomPanel: React.FC<WarRoomPanelProps> = ({
  source,
  defaultCollapsed = false,
  onTransferDraftToTimeline,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [events, setEvents] = useState<ReasoningEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('active') === '1' || s.get('completed') === '1' || s.get('full') === '1') {
        return (mockReasoningEvents as any[]) || [];
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
        'Blu': 'idle',
        'Dispatcher': 'idle',
        'Assessor': 'idle',
      };
    }
    return {
      'Trí': 'idle',
      'Bo': 'idle',
      'An': 'idle',
      'Blu': 'idle',
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
      const evt = { ...rawEvt };
      // Normalize timestamp if ISO string
      if (typeof evt.timestamp === 'string') {
        const parsed = new Date(evt.timestamp).getTime();
        if (!isNaN(parsed)) evt.timestamp = parsed;
      }
      // Normalize toolCall input to params
      if (evt.toolCall && (evt.toolCall as any).input && !evt.toolCall.params) {
        evt.toolCall.params = (evt.toolCall as any).input;
      }
      // Normalize eventType aliases from producer
      const normType = (evt.eventType || '').toLowerCase();
      if (normType === 'thought') evt.eventType = 'thinking';
      else if (normType === 'debate_turn') evt.eventType = 'speaking';

      setEvents((prev) => [...prev, evt]);

      if (evt.agent) {
        let nextState: AgentState = 'idle';
        if (normType === 'thinking' || normType === 'thought') nextState = 'thinking';
        else if (normType === 'tool_call' || normType === 'tool_calling') nextState = 'tool_calling';
        else if (normType === 'speaking' || normType === 'debate_turn' || normType === 'cross_check_verdict') nextState = 'speaking';

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
          'Blu': 'idle',
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

  const handleReset = () => {
    sound.playPaperRustle();
    source.stop();
    setEvents([]);
    setIsDone(false);
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
      'Blu': 'idle',
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
    const allEvts = (mockReasoningEvents as any[]) || [];
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
      'Blu': 'idle',
      'Dispatcher': 'idle',
      'Assessor': 'idle',
    });
  };

  return (
    <div
      id="warroom-section"
      className="w-full bg-white border border-[#E2EAD2] rounded-3xl shadow-xs overflow-hidden transition-all duration-300 mb-6"
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
              <h2
                style={{ fontSize: '26px', lineHeight: '34px' }}
                className="font-extrabold text-[#121712] tracking-tight m-0"
              >
                Phòng điều hành suy luận đa tác tử
              </h2>
              {source.isReplay() && (
                <span className="bg-[#C8F169] text-[#121712] border border-[#b4e64f] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Mô phỏng (Replay)
                </span>
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
                    Mới nhất: +{(((events[events.length - 1].timestamp - (events[0]?.timestamp || 0)) / 1000) || (events.length * 0.4)).toFixed(1)}s
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
                events.map((evt, idx) => (
                  <EventRow
                    key={evt.id || idx}
                    event={evt}
                    isLast={idx === events.length - 1}
                    baseTimestamp={events[0]?.timestamp}
                    index={idx}
                  />
                ))
              )}
              <div ref={feedBottomRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
