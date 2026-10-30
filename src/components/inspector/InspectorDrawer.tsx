import React, { useEffect, useState } from 'react';
import {
  Eye,
  Check,
  X,
  ArrowRight,
  Lock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { InspectorTurn } from '../../types/reasoning';
import { DEMO_INSPECTOR_TURNS } from '../../demo/demoLesson';
import { sound } from '../../utils/soundEffects';

export const API_BASE_URL =
  ((globalThis as any).process?.env?.REACT_APP_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  '/api';

interface InspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  turns?: InspectorTurn[];
  activeTurnIndex?: number;
  isReplay?: boolean;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  isOpen,
  onClose,
  turns: propTurns,
  activeTurnIndex: propActiveIndex,
  isReplay: propIsReplay,
}) => {
  const [turns, setTurns] = useState<InspectorTurn[]>(DEMO_INSPECTOR_TURNS);
  // Mặc định chọn Lượt 4: Bo phản biện sắc bén ở 37:13 (index 3)
  const [selectedIndex, setSelectedIndex] = useState<number>(3);

  useEffect(() => {
    if (propTurns && propTurns.length > 0) {
      setTurns(propTurns);
      if (propActiveIndex !== undefined && propActiveIndex >= 0 && propActiveIndex < propTurns.length) {
        setSelectedIndex(propActiveIndex);
      } else {
        // Mặc định luôn tìm lượt Bo 37:13 hoặc lượt cuối
        const boTurnIdx = propTurns.findIndex((t) => t.turnId === 'turn-04' || (t.agent === 'Bo' && t.timestampStr === '37:13'));
        setSelectedIndex(boTurnIdx >= 0 ? boTurnIdx : propTurns.length - 1);
      }
    } else {
      setTurns(DEMO_INSPECTOR_TURNS);
      setSelectedIndex(3); // Lượt 4 trong DEMO_INSPECTOR_TURNS
    }
  }, [propTurns, propActiveIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isInput) return;

      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTurn = turns[selectedIndex] || turns[3] || turns[0] || ({} as any);
  const dispatcher = currentTurn.dispatcher || {
    intent: '—',
    selectedAgent: '—',
    confidence: undefined,
    reason: '—',
    isEvaluated: false,
  };
  const contextView = currentTurn.contextView || {
    boardSnippet: "| BC + DD' |",
    teacherSpeech: 'Đã chép lời',
    ragKnowledge: 'MISC_VEC_005',
    hiddenItem: 'Lời giải chuẩn của bài',
    visibleContext: [],
    hiddenContext: [],
  };
  const assessor = currentTurn.assessor || {
    matchedSummary: '—',
    matchedPoints: [],
    missingPoints: [],
    verdictLabel: '—',
    bloomBefore: undefined,
    bloomAfter: undefined,
    bloomLevel: undefined,
    hesitationScore: undefined,
    hesitationLabel: '—',
    isEvaluated: false,
  };

  const confidenceNum = typeof dispatcher.confidence === 'number' ? dispatcher.confidence : undefined;
  const confidencePercent = confidenceNum !== undefined ? Math.round(confidenceNum * 100) : 0;
  const confidenceFormatted = confidenceNum !== undefined ? confidenceNum.toFixed(2).replace('.', ',') : '—';

  const isReplayMode = propIsReplay !== undefined
    ? propIsReplay
    : (!currentTurn.turnId?.startsWith('live-') && selectedIndex < 4);

  return (
    <aside
      id="inspector-drawer-panel"
      className="w-full bg-white border border-[#E2EAD2] rounded-3xl shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-120px)] min-h-[560px] sticky top-20 text-[#121712]"
      role="complementary"
      aria-label="Soi não tác nhân"
    >
      {/* 1. Header: Biểu tượng mắt lime + Tiêu đề + Cờ Replay / Live + Nút đóng */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-white border-b border-[#E2EAD2] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#C8F169] border border-[#A6D83B] flex items-center justify-center text-[#121712] shrink-0">
            <Eye className="w-5 h-5 text-[#121712]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#121712] leading-tight m-0">
              Soi não tác nhân
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-stone-600 font-medium">
                Lượt #{currentTurn.turnNumber || selectedIndex + 1} · {currentTurn.timestampStr || '37:13'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-tight border flex items-center gap-1 ${
                isReplayMode
                  ? 'bg-amber-50 text-amber-950 border-amber-300'
                  : 'bg-emerald-50 text-emerald-950 border-emerald-300'
              }`}>
                {isReplayMode ? (
                  <>
                    <RotateCcw className="w-2.5 h-2.5 text-amber-800" />
                    <span>Replay</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-emerald-700 animate-pulse" />
                    <span>Trực tiếp (Live)</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-100 text-stone-600 flex items-center justify-center transition cursor-pointer shrink-0"
          title="Đóng khung soi não (Alt+I)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Dải chọn lượt thoại: Tua lại + Các chip Lượt 1 -> Lượt 4 */}
      <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#F8FAF4] border-b border-[#E2EAD2] shrink-0 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-stone-700 whitespace-nowrap mr-1">
          Tua lại
        </span>
        {turns.map((turn, idx) => {
          const isSelected = selectedIndex === idx;
          const label = `Lượt ${turn.turnNumber || idx + 1}`;
          return (
            <button
              key={turn.turnId || idx}
              type="button"
              onClick={() => {
                sound.playTabSwitch();
                setSelectedIndex(idx);
              }}
              className={`h-7 px-3 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#121712] text-white shadow-2xs'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200'
              }`}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Vùng thân cuộn: 4 khối đánh số 1 đến 4 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
        {/* =========================================================================
            KHỐI 1: ĐIỀU PHỐI (INTENT ROUTING DISPATCHER)
            ========================================================================= */}
        <div className="bg-white border border-[#E2EAD2] rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#121712] text-[#C8F169] text-xs flex items-center justify-center font-bold shrink-0">
              1
            </span>
            <span className="font-bold text-xs text-[#121712] uppercase tracking-wider">
              ĐIỀU PHỐI (DISPATCHER)
            </span>
          </div>

          {/* Hàng chip: Ý định -> Tác nhân được chọn */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#F3F8E8] border border-[#E2EAD2] text-xs font-bold text-[#121712]">
              {dispatcher.intent}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="px-2.5 py-1 rounded-full bg-[#F3F8E8] border border-[#E2EAD2] text-xs font-bold text-[#121712] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {dispatcher.selectedAgent && dispatcher.selectedAgent !== '—' ? dispatcher.selectedAgent[0] : '—'}
              </span>
              <span>{dispatcher.selectedAgent && dispatcher.selectedAgent !== '—' ? `${dispatcher.selectedAgent} được chọn` : '—'}</span>
            </span>
          </div>

          {/* Thanh độ tin cậy + Số */}
          <div className="flex items-center gap-2.5">
            <div className="h-2 flex-1 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div
                className="h-full bg-[#C8F169] rounded-full transition-all duration-300"
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#121712] shrink-0 tabular-nums whitespace-nowrap">
              {confidenceFormatted}
              <span className="text-[11px] text-stone-500 font-normal ml-1">
                {(dispatcher as any)?.isEvaluated ? '' : '(Chưa đo / Mô phỏng)'}
              </span>
            </span>
          </div>

          {/* Lý do điều phối cụ thể */}
          <p className="text-xs text-stone-700 leading-relaxed m-0 break-words">
            <strong className="text-[#121712]">Lý do:</strong> {dispatcher.reason}
          </p>
        </div>

        {/* =========================================================================
            KHỐI 2: CONTEXT SNAPSHOT (TÁC NHÂN NHÌN THẤY GÌ - ISSUE #16)
            ========================================================================= */}
        <div className="bg-white border border-[#E2EAD2] rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#121712] text-[#C8F169] text-xs flex items-center justify-center font-bold shrink-0">
              2
            </span>
            <span className="font-bold text-xs text-[#121712] uppercase tracking-wider">
              {currentTurn.agent.toUpperCase()} NHÌN THẤY GÌ (CONTEXT SNAPSHOT)
            </span>
          </div>

          {/* 3 ô nhỏ thông tin */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[#F8FAF4] border border-[#E2EAD2] flex flex-col justify-between">
              <span className="text-xs text-stone-500 font-medium leading-tight mb-1 block">
                Bảng phấn {currentTurn.timestampStr || '37:13'}
              </span>
              <span className="text-xs font-bold text-[#121712] italic block">
                {contextView.boardSnippet || "| BC + DD' |"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F8FAF4] border border-[#E2EAD2] flex flex-col justify-between">
              <span className="text-xs text-stone-500 font-medium leading-tight mb-1 block">
                Lời thầy, 30 giây gần nhất
              </span>
              <span className="text-xs font-bold text-[#121712] block">
                {contextView.teacherSpeech || 'Đã chép lời'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F8FAF4] border border-[#E2EAD2] flex flex-col justify-between">
              <span className="text-xs text-stone-500 font-medium leading-tight mb-1 block">
                Tri thức tra cứu (RAG)
              </span>
              <span className="text-xs font-bold text-[#121712] block truncate" title={contextView.ragKnowledge}>
                {contextView.ragKnowledge || 'MISC_VEC_005'}
              </span>
            </div>
          </div>

          {/* Danh sách ngữ cảnh được nhìn thấy (Visible Context) */}
          {contextView.visibleContext && contextView.visibleContext.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-stone-600 block uppercase tracking-wider">
                Ngữ cảnh được cấp quyền nhìn thấy:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {contextView.visibleContext.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#F8FAF4] border border-[#E2EAD2] text-xs text-stone-800 font-medium flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#121712]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách ngữ cảnh cách ly bảo vệ (Hidden Context Arrays) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-stone-600 block uppercase tracking-wider">
              Ngữ cảnh cách ly bảo vệ (Không rò rỉ lời giải):
            </span>
            {(contextView.hiddenContext && contextView.hiddenContext.length > 0
              ? contextView.hiddenContext
              : [contextView.hiddenItem || 'Lời giải chuẩn của bài']
            ).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 px-3 rounded-xl border border-dashed border-[#E2EAD2] bg-white"
              >
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="line-through">{item}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#121712] text-white text-[11px] font-bold shrink-0">
                  Ẩn với {currentTurn.agent || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            KHỐI 3: SUY NGHĨ NGẦM CỦA TÁC NHÂN (CANONICAL THOUGHTS)
            ========================================================================= */}
        <div className="bg-[#F3F8E8] border border-[#E2EAD2] rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#121712] text-[#C8F169] text-xs flex items-center justify-center font-bold shrink-0">
              3
            </span>
            <span className="font-bold text-xs text-[#121712] uppercase tracking-wider">
              SUY NGHĨ NGẦM CỦA {currentTurn.agent.toUpperCase()}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans italic m-0">
            “{currentTurn.thought}”
          </p>

          <div className="border-t border-[#E2EAD2]" />

          <p className="text-xs text-stone-700 leading-relaxed m-0">
            <strong className="text-[#121712]">Câu thoại cuối:</strong> “{currentTurn.speech}”
          </p>
        </div>

        {/* =========================================================================
            KHỐI 4: CHẤM NGẦM (ASSESSOR & MISSING POINTS - ISSUE #16)
            ========================================================================= */}
        <div className="bg-[#121712] border border-[#121712] rounded-2xl p-4 shadow-sm text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C8F169] text-[#121712] text-xs flex items-center justify-center font-bold shrink-0">
                4
              </span>
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                CHẤM NGẦM & ĐÁNH GIÁ NHẬN THỨC
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C8F169] text-[#121712] text-xs font-bold">
              {assessor.verdictLabel || 'Phản biện sắc bén'}
            </span>
          </div>

          {/* Hai cột: Ý đạt được & Tháp Bloom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-white block">
                {assessor.matchedSummary ||
                  `Đạt ${assessor.matchedPoints?.length || 0}/${
                    (assessor.matchedPoints?.length || 0) + (assessor.missingPoints?.length || 0)
                  } ý cần có`}
              </span>
              <div className="space-y-1 text-xs text-stone-300">
                {(assessor.matchedPoints || []).map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-1.5 leading-snug">
                    <Check className="w-3.5 h-3.5 text-[#C8F169] shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              {/* HIỂN THỊ MISSING POINTS RÕ RÀNG (ISSUE #16) */}
              {assessor.missingPoints && assessor.missingPoints.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide block">
                    Ý còn thiếu cần bổ sung:
                  </span>
                  <div className="space-y-1">
                    {assessor.missingPoints.map((pt, pIdx) => (
                      <div
                        key={`miss-${pIdx}`}
                        className="flex items-center gap-1.5 leading-snug text-amber-200 bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-500/40 text-xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>Thiếu: {pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-stone-400 block font-medium">
                Tháp Bloom
              </span>
              <span className="text-xs font-bold text-white block leading-snug">
                {assessor.bloomBefore && assessor.bloomAfter
                  ? `${assessor.bloomBefore} → ${assessor.bloomAfter}`
                  : (assessor.bloomBefore || assessor.bloomAfter || '—')}
              </span>
              {/* 6 vạch Tháp Bloom */}
              <div className="flex items-center gap-1 pt-1.5">
                {[1, 2, 3, 4, 5, 6].map((lvl) => {
                  const targetLevel = typeof assessor.bloomLevel === 'number' ? assessor.bloomLevel : 0;
                  const isReached = lvl <= targetLevel;
                  return (
                    <div
                      key={lvl}
                      className={`h-1.5 flex-1 rounded-full ${
                        isReached ? 'bg-[#C8F169]' : 'bg-stone-700'
                      }`}
                      title={targetLevel > 0 ? `Bậc ${lvl}` : 'Chưa đo'}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dòng độ do dự */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800">
            <span className="text-stone-300">
              Do dự: <strong className="text-white">{typeof assessor.hesitationScore === 'number' ? (assessor.hesitationLabel || 'thấp') : '—'}</strong>
              <span className="text-[11px] text-stone-400 font-normal ml-1">
                {(assessor as any)?.isEvaluated ? '(Đã đo)' : '(Chưa đo / Mô phỏng)'}
              </span>
            </span>
            <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
              <div
                className="h-full bg-[#C8F169] rounded-full"
                style={{ width: `${typeof assessor.hesitationScore === 'number' ? Math.round(assessor.hesitationScore * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
