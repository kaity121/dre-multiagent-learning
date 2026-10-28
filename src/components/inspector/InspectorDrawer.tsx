import React, { useEffect, useState } from 'react';
import {
  Compass,
  Eye,
  MessageSquare,
  Award,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertCircle,
  Brain,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { InspectorTurn } from '../../types/reasoning';
import { normalizeTurn } from './normalizeTurn';
import { DEMO_INSPECTOR_TURNS } from '../../demo/demoLesson';
import {
  BoCircleAvatar,
  TriDeepThinkerAvatar,
  LinhChiNoteTakerAvatar,
  TutorLamCircleAvatar,
} from '../HandmadeArtwork';
import { sound } from '../../utils/soundEffects';

export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  '/api';

interface InspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  turns?: InspectorTurn[];
  activeTurnIndex?: number;
}

const AgentAvatarBadge: React.FC<{ agentName: string; size?: string }> = ({
  agentName,
  size = 'w-6 h-6',
}) => {
  const norm = (agentName || '').toLowerCase();
  if (norm.includes('bo')) {
    return <BoCircleAvatar className={`${size} shrink-0 ring-1 ring-stone-300 rounded-full`} />;
  }
  if (norm.includes('trí') || norm.includes('tri')) {
    return <TriDeepThinkerAvatar className={`${size} shrink-0 ring-1 ring-stone-300 rounded-full`} />;
  }
  if (norm.includes('chi')) {
    return <LinhChiNoteTakerAvatar className={`${size} shrink-0 ring-1 ring-stone-300 rounded-full`} />;
  }
  return <TutorLamCircleAvatar className={`${size} shrink-0 ring-1 ring-stone-300 rounded-full`} />;
};

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  isOpen,
  onClose,
  turns: propTurns,
  activeTurnIndex: propActiveIndex,
}) => {
  const [turns, setTurns] = useState<InspectorTurn[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Accordion open/close states (mặc định mở cả 4 để hiển thị đầy đủ thông tin)
  const [openSections, setOpenSections] = useState({
    dispatcher: true,
    context: true,
    thought: true,
    assessor: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    sound.playPencilTap();
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (propTurns && propTurns.length > 0) {
      setTurns(propTurns);
      if (propActiveIndex !== undefined) {
        setSelectedIndex(propActiveIndex);
      } else {
        setSelectedIndex(propTurns.length - 1);
      }
    } else {
      // Dữ liệu mẫu lượt thoại tác tử (Toán 12 - Vectơ trong không gian) từ fixture demoLesson
      setTurns(DEMO_INSPECTOR_TURNS);
      setSelectedIndex(0);
    }
  }, [propTurns, propActiveIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const currentTurn = turns[selectedIndex] || turns[0];
  const confidence = currentTurn?.dispatcher?.confidence ?? 0.85;
  const hesitation = currentTurn?.assessor?.hesitationScore ?? 0.2;

  return (
    <div id="inspector-drawer" className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
      {/* Backdrop mờ nhẹ */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container: Nền trắng sáng hoàn toàn, viền chuẩn #E2EAD2 */}
      <div
        className="relative w-full max-w-xl md:max-w-2xl bg-white border-l border-[#E2EAD2] shadow-2xl flex flex-col z-10 transition-transform duration-200"
        role="dialog"
        aria-labelledby="inspector-drawer-title"
      >
        {/* Header Drawer Sáng Chuẩn Lime Soft */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-[#E2EAD2] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] flex items-center justify-center text-[#121712]">
              <SlidersHorizontal className="w-5 h-5 text-[#121712]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="inspector-drawer-title" className="text-base font-bold text-[#121712] tracking-tight">
                  Thanh tra lượt thoại tác tử (Inspector)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#121712] text-[#C8F169] tracking-wide">
                  Trực tiếp
                </span>
              </div>
              <p className="text-xs text-stone-700 font-medium mt-0.5">
                <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 text-stone-800 font-semibold">Phím tắt: Alt+I</span>
                <span className="ml-2">Giám sát điều phối, ngữ cảnh & đánh giá sư phạm</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition cursor-pointer"
            title="Đóng Inspector (Alt+I)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Turn Selector Strip: Hàng chọn lượt thoại trung tính */}
        <div className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-[#F8FAF4] border-b border-[#E2EAD2] shrink-0 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wide whitespace-nowrap mr-1">
            Lượt thoại:
          </span>
          {turns.map((turn, idx) => {
            const isSelected = selectedIndex === idx;
            const timeTag = idx === 0 ? '+1.2s' : idx === 1 ? '+2.8s' : '+4.0s';
            return (
              <button
                key={turn.turnId || idx}
                type="button"
                onClick={() => {
                  sound.playTabSwitch();
                  setSelectedIndex(idx);
                }}
                className={`h-8 px-3.5 rounded-full text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#121712] text-white shadow-2xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <AgentAvatarBadge agentName={turn.agent} size="w-4 h-4" />
                <span>
                  #{idx + 1} {turn.agent}
                </span>
                <span className={`text-[11px] font-mono ${isSelected ? 'text-[#C8F169]' : 'text-stone-500'}`}>
                  {timeTag}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4 Accordion Sections: Nền trắng sáng đồng nhất, không nền pastel riêng */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* =========================================================================
              PHẦN 1: DISPATCHER (ĐIỀU PHỐI LƯỢT)
              ========================================================================= */}
          <div className="bg-white border border-[#E2EAD2] rounded-2xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('dispatcher')}
              className="w-full flex items-center justify-between p-4 bg-[#FDFEFA] hover:bg-stone-50 transition cursor-pointer text-left border-b border-stone-100"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-stone-800 shrink-0" />
                <span className="text-sm font-bold text-[#121712]">
                  1. Điều phối lượt thoại (Dispatcher)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full">
                  {(confidence * 100).toFixed(0)}% tin cậy
                </span>
                {openSections.dispatcher ? (
                  <ChevronUp className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                )}
              </div>
            </button>

            {openSections.dispatcher && (
              <div className="p-4 space-y-3.5 text-sm">
                <div>
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    Ý định người học (Intent)
                  </div>
                  <div className="text-sm font-bold text-[#121712]">
                    {currentTurn?.dispatcher?.intent || 'Chưa định tuyến ý định'}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-stone-100">
                  <span className="text-xs font-semibold text-stone-500">Tác tử được chỉ định:</span>
                  <div className="flex items-center gap-2 font-bold text-[#121712]">
                    <AgentAvatarBadge
                      agentName={currentTurn?.dispatcher?.selectedAgent || currentTurn?.agent}
                      size="w-5 h-5"
                    />
                    <span>{currentTurn?.dispatcher?.selectedAgent || currentTurn?.agent}</span>
                  </div>
                </div>

                {/* Thanh tiến độ độ tin cậy (Confidence Progress Bar) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-stone-600">Độ tin cậy điều phối:</span>
                    <span className="font-mono font-bold text-[#121712]">
                      {(confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                    <div
                      className="h-full bg-[#121712] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, confidence * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 leading-relaxed">
                  <strong className="text-stone-900 block mb-0.5">Lý do điều phối:</strong>
                  {currentTurn?.dispatcher?.reason ||
                    'Tác tử được phân công dựa trên độ khớp chuyên môn sư phạm và bối cảnh học tập.'}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              PHẦN 2: CONTEXT VIEW (NGỮ CẢNH ĐƯỢC THẤY / BỊ CHE)
              ========================================================================= */}
          <div className="bg-white border border-[#E2EAD2] rounded-2xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('context')}
              className="w-full flex items-center justify-between p-4 bg-[#FDFEFA] hover:bg-stone-50 transition cursor-pointer text-left border-b border-stone-100"
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-stone-800 shrink-0" />
                <span className="text-sm font-bold text-[#121712]">
                  2. Ngữ cảnh quan sát (Context View)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
                  Bộ lọc an toàn
                </span>
                {openSections.context ? (
                  <ChevronUp className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                )}
              </div>
            </button>

            {openSections.context && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {/* Cột 1: Phần Agent được thấy (Check xanh lá ngữ nghĩa trên nền trung tính) */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-[#16A34A] uppercase tracking-wide">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      </div>
                      <span>Phần tác tử được thấy</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-700 pl-1">
                      {(currentTurn?.contextView?.visibleContext || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-[#16A34A] font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cột 2: Phần bị che / ẩn (X đỏ ngữ nghĩa trên nền trung tính) */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-[#DC2626] uppercase tracking-wide">
                      <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-[#DC2626]" />
                      </div>
                      <span>Phần bị che / ẩn (Shield)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-700 pl-1">
                      {(currentTurn?.contextView?.hiddenContext || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-[#DC2626] font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              PHẦN 3: THOUGHT & SPEECH (SUY NGHĨ NỘI TÂM & PHÁT NGÔN)
              ========================================================================= */}
          <div className="bg-white border border-[#E2EAD2] rounded-2xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('thought')}
              className="w-full flex items-center justify-between p-4 bg-[#FDFEFA] hover:bg-stone-50 transition cursor-pointer text-left border-b border-stone-100"
            >
              <div className="flex items-center gap-2.5">
                <Brain className="w-5 h-5 text-stone-800 shrink-0" />
                <span className="text-sm font-bold text-[#121712]">
                  3. Suy nghĩ nội tâm & Thoại (Thought & Speech)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
                  2 tầng tư duy
                </span>
                {openSections.thought ? (
                  <ChevronUp className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                )}
              </div>
            </button>

            {openSections.thought && (
              <div className="p-4 space-y-3.5 text-sm">
                {/* Độc thoại suy nghĩ nội bộ */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                    <span>Độc thoại nội tâm (Internal Monologue):</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 italic text-sm leading-relaxed font-sans">
                    {currentTurn?.thought}
                  </div>
                </div>

                {/* Phát ngôn công khai */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#121712] uppercase tracking-wide">
                    <MessageSquare className="w-3.5 h-3.5 text-[#121712]" />
                    <span>Phát ngôn ra ngoài cho học sinh (Spoken Dialogue):</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F3F8E8] border border-[#E2EAD2] text-sm font-bold text-[#121712] leading-relaxed font-sans">
                    "{currentTurn?.speech}"
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              PHẦN 4: ASSESSOR (ĐÁNH GIÁ SƯ PHẠM & THANG BLOOM)
              ========================================================================= */}
          <div className="bg-white border border-[#E2EAD2] rounded-2xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('assessor')}
              className="w-full flex items-center justify-between p-4 bg-[#FDFEFA] hover:bg-stone-50 transition cursor-pointer text-left border-b border-stone-100"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-stone-800 shrink-0" />
                <span className="text-sm font-bold text-[#121712]">
                  4. Đánh giá sư phạm (Assessor)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full">
                  Hesitation: {hesitation}
                </span>
                {openSections.assessor ? (
                  <ChevronUp className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                )}
              </div>
            </button>

            {openSections.assessor && (
              <div className="p-4 space-y-4 text-sm">
                {/* Dịch chuyển Bloom: 2 chip nối bằng mũi tên */}
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                    Dịch chuyển mức nhận thức Bloom
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3.5 py-1.5 rounded-full bg-white border border-stone-300 text-xs font-bold text-stone-800 shadow-2xs">
                      {currentTurn?.assessor?.bloomBefore || 'Nhớ (L1)'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400" />
                    <span className="px-3.5 py-1.5 rounded-full bg-[#121712] text-white text-xs font-bold shadow-2xs ring-2 ring-[#C8F169]">
                      {currentTurn?.assessor?.bloomAfter || 'Hiểu & Vận dụng (L2-L3)'}
                    </span>
                  </div>
                </div>

                {/* Hesitation Score Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-stone-600">Độ do dự của người học (Hesitation Score):</span>
                    <span className="font-mono font-bold text-stone-800">
                      {hesitation} / 1.0
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        hesitation > 0.6 ? 'bg-amber-500' : 'bg-[#121712]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, hesitation * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Điểm đạt & Điểm còn thiếu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#16A34A] uppercase tracking-wide">
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Điểm đạt được:</span>
                    </div>
                    <ul className="space-y-1 text-stone-700 pl-1">
                      {(currentTurn?.assessor?.matchedPoints || []).map((p, i) => (
                        <li key={i} className="flex items-start gap-1 leading-relaxed">
                          <span className="text-[#16A34A] font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-700 uppercase tracking-wide">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Điểm còn thiếu:</span>
                    </div>
                    <ul className="space-y-1 text-stone-700 pl-1">
                      {(currentTurn?.assessor?.missingPoints || []).map((p, i) => (
                        <li key={i} className="flex items-start gap-1 leading-relaxed">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
