import React, { useState, useEffect } from 'react';
import { 
  PushPin, 
  WashiTape, 
  BrainIcon, 
  LightningZapIcon, 
  ChalkboardIcon,
  TeacherHatIcon
} from './HandmadeArtwork';
import { fetchContextSnapshot } from '../services/dreBackendApi';
import type { AgentRuntimeContext, AgentCitation, AgentRole } from '../types/pipeline';

interface MultiAgentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendLive?: boolean;
  lastSessionId?: string | null;
  lastBoSpeech?: string | null;
  lastCoLamSpeech?: string | null;
  currentMode?: string;
  currentVideoSecond?: number;
  onSeekVideo?: (second: number) => void;
}

type AgentKey = 'tri' | 'bo' | 'linhchi' | 'minhkhang' | 'an' | 'colam';

interface AgentTabMeta {
  id: AgentKey;
  role: AgentRole;
  name: string;
  roleTitle: string;
  persona: string;
  avatarBg: string;
  borderBadge: string;
}

const AGENT_TABS: AgentTabMeta[] = [
  {
    id: 'tri',
    role: 'tri',
    name: 'Trí',
    roleTitle: 'Hệ 2 (Logic & Biên)',
    persona: 'RAG định lý, kiểm chứng tọa độ 3D, không lộ gợi ý trợ giảng',
    avatarBg: '#1B4338',
    borderBadge: 'border-emerald-600 bg-emerald-50 text-emerald-800',
  },
  {
    id: 'bo',
    role: 'bo',
    name: 'Bo',
    roleTitle: 'Hệ 1 (Trực giác & Bẫy ngộ nhận)',
    persona: 'Gài bẫy ngộ nhận, BỊ CÁCH LY hoàn toàn khỏi đáp án chuẩn & rebuttalAnchor',
    avatarBg: '#E8A33D',
    borderBadge: 'border-amber-600 bg-amber-50 text-amber-900',
  },
  {
    id: 'linhchi',
    role: 'linhchi',
    name: 'Linh Chi',
    roleTitle: 'Hệ thống hóa (Cheat Sheet)',
    persona: 'Công thức tóm tắt, quy tắc 3 bước, checklist kiểm tra nhanh',
    avatarBg: '#2563EB',
    borderBadge: 'border-blue-600 bg-blue-50 text-blue-800',
  },
  {
    id: 'minhkhang',
    role: 'minhkhang',
    name: 'Minh Khang',
    roleTitle: 'Trực quan (Đời sống)',
    persona: 'Ẩn dụ căn phòng học 3D, cầu thang thẳng đứng, thực tế dễ hình dung',
    avatarBg: '#7C3AED',
    borderBadge: 'border-purple-600 bg-purple-50 text-purple-800',
  },
  {
    id: 'an',
    role: 'an',
    name: 'Trợ giảng An',
    roleTitle: 'Scaffolding (Nudges)',
    persona: 'Gợi ý nấc 1 & nấc 2, quan sát độ ngập ngừng, không tiết lộ đáp án ngay',
    avatarBg: '#0D9488',
    borderBadge: 'border-teal-600 bg-teal-50 text-teal-800',
  },
  {
    id: 'colam',
    role: 'colam',
    name: 'Cô Lam',
    roleTitle: 'Giáo viên (Director)',
    persona: 'Toàn quyền truy cập unredacted context, chốt chuẩn hóa Bloom',
    avatarBg: '#DC2626',
    borderBadge: 'border-red-600 bg-red-50 text-red-800',
  },
];

const formatTimestamp = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const MultiAgentInspectorModal: React.FC<MultiAgentInspectorModalProps> = ({
  isOpen,
  onClose,
  isBackendLive = false,
  lastSessionId,
  currentVideoSecond = 2233,
  onSeekVideo,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>('tri');
  const [inspectSecond, setInspectSecond] = useState<number>(currentVideoSecond || 2233);
  const [snapshot, setSnapshot] = useState<AgentRuntimeContext | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pingStatus, setPingStatus] = useState<{
    loading: boolean;
    latencyMs?: number;
    model?: string;
    error?: string;
  } | null>(null);

  // Sync inspectSecond when modal opens with new video time
  useEffect(() => {
    if (isOpen && currentVideoSecond) {
      setInspectSecond(currentVideoSecond);
    }
  }, [isOpen, currentVideoSecond]);

  // Load snapshot whenever selectedAgent or inspectSecond changes
  useEffect(() => {
    if (!isOpen) return;
    loadSnapshot(selectedAgent, inspectSecond);
  }, [isOpen, selectedAgent, inspectSecond]);

  const loadSnapshot = async (agent: AgentKey, sec: number) => {
    setLoading(true);
    try {
      const snap = await fetchContextSnapshot(agent, sec, lastSessionId || 'session_001');
      if (snap) {
        setSnapshot(snap);
      } else {
        setSnapshot(generateLocalFallbackSnapshot(agent, sec));
      }
    } catch {
      setSnapshot(generateLocalFallbackSnapshot(agent, sec));
    } finally {
      setLoading(false);
    }
  };

  const handleTestPing = async () => {
    setPingStatus({ loading: true });
    try {
      const res = await fetch('http://localhost:3001/api/health-llm');
      const data = await res.json();
      if (data.ok) {
        setPingStatus({
          loading: false,
          latencyMs: data.latencyMs,
          model: data.model,
        });
      } else {
        setPingStatus({
          loading: false,
          error: data.error || 'Lỗi kiểm tra',
        });
      }
    } catch (e: any) {
      setPingStatus({
        loading: false,
        error: e.message || 'Không kết nối được server cổng 3001',
      });
    }
  };

  if (!isOpen) return null;

  const activeTabMeta = AGENT_TABS.find((t) => t.id === selectedAgent) || AGENT_TABS[0];
  const tokenCount = (snapshot as any)?.metadata?.tokenEstimate || 437;
  const isWithinBudget = tokenCount <= 1200;
  const tokenPct = Math.min(100, Math.round((tokenCount / 1200) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#FAF8F3] border-4 border-[#DDD5C5] rounded-xl p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <WashiTape variant="blue" className="absolute -top-3 left-10 w-28 -rotate-2" />
        <PushPin color="#4E9B87" className="absolute top-3 right-4" />

        {/* 1. Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8DFC8] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#1B4338] text-white flex items-center justify-center text-sm shadow-xs">
              <BrainIcon className="w-5 h-5 text-[#8CE6CF]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg text-stone-900 tracking-tight">
                  Soi Não Multi-Agent AI (Context Isolation Inspector)
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold">
                  Issue #402 / Board Grounding
                </span>
              </div>
              <p className="text-xs text-stone-600 font-sans">
                Đóng gói ngữ cảnh thời gian thực tại giây T, cách ly thông tin theo chính sách sư phạm (DoD &lt; 1200 tokens)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 font-bold cursor-pointer text-sm shadow-2xs transition-colors"
            title="Đóng bảng soi não"
          >
            ✕
          </button>
        </div>

        {/* 2. Top Banner: Timestamp Selector & Token Meter */}
        <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs mb-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Timestamp picker & quick jumps */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-stone-700 flex items-center gap-1">
              <ChalkboardIcon className="w-4 h-4 text-[#1B4338]" />
              <span>Mốc video T:</span>
            </span>
            <div className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-lg border border-stone-300 font-mono font-bold text-stone-900">
              <span>{formatTimestamp(inspectSecond)}</span>
              <span className="text-[10px] text-stone-500">({inspectSecond}s)</span>
            </div>

            {/* Quick jump pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setInspectSecond(2233)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer transition-colors ${
                  inspectSecond === 2233
                    ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
                title="Mốc 37:13 - Ví dụ 3 (Bẫy cộng đại số |BC + DD'|)"
              >
                🎯 37:13 (Ví dụ 3)
              </button>
              <button
                type="button"
                onClick={() => setInspectSecond(1813)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer transition-colors ${
                  inspectSecond === 1813
                    ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
                title="Mốc 30:13 - Quy tắc hình hộp"
              >
                📦 30:13 (Hình hộp)
              </button>
              <button
                type="button"
                onClick={() => setInspectSecond(320)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer transition-colors ${
                  inspectSecond === 320
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
                title="Mốc 05:20 - Quy tắc 3 điểm"
              >
                📐 05:20 (Quy tắc 3 điểm)
              </button>
            </div>
          </div>

          {/* Token Budget Gauge (< 1200 Tokens) */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="font-mono font-bold text-xs text-stone-900">
                  {tokenCount} / 1200 Tokens
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                    isWithinBudget ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isWithinBudget ? '✅ Đạt chuẩn DoD' : '⚠️ Vượt ngân sách'}
                </span>
              </div>
              <div className="w-36 h-2 bg-stone-200 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all ${
                    isWithinBudget ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${tokenPct}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestPing}
              disabled={pingStatus?.loading}
              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-mono text-[11px] rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
              title="Kiểm tra kết nối LLM backend"
            >
              <LightningZapIcon className="w-3 h-3 text-amber-600" />
              <span>{pingStatus?.loading ? 'Ping...' : 'Ping LLM'}</span>
            </button>
          </div>
        </div>

        {/* 3. Agent Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3 shrink-0 no-scrollbar">
          {AGENT_TABS.map((tab) => {
            const isSelected = selectedAgent === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedAgent(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shrink-0 shadow-2xs ${
                  isSelected
                    ? `${tab.borderBadge} font-bold ring-2 ring-[#1B4338]/30 shadow-xs scale-102`
                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                  style={{ backgroundColor: tab.avatarBg }}
                >
                  {tab.name[0]}
                </span>
                <span>{tab.name}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">({tab.roleTitle.split(' ')[0]})</span>
              </button>
            );
          })}
        </div>

        {/* 4. Inspector Main Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs select-text">
          {loading ? (
            <div className="py-12 text-center text-stone-500 font-mono flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#1B4338] border-t-transparent rounded-full animate-spin" />
              <span>Đang tải Context Isolation Snapshot...</span>
            </div>
          ) : snapshot ? (
            <>
              {/* Card 1: Context Isolation Matrix for selected Agent */}
              <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    <span>🛡️ Chính sách cách ly ngữ cảnh (Context Isolation Policy)</span>
                    <span className="font-mono text-stone-400 font-normal">· {activeTabMeta.name}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeTabMeta.borderBadge}`}>
                    {activeTabMeta.roleTitle}
                  </span>
                </div>
                <p className="text-[11.5px] text-stone-600 italic">
                  &ldquo;{activeTabMeta.persona}&rdquo;
                </p>

                {/* Isolation status flags */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className={`p-2 rounded-lg border text-center ${
                    selectedAgent === 'bo' 
                      ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-stone-500">Lời giải chuẩn</div>
                    <div className="text-xs font-semibold mt-0.5">
                      {selectedAgent === 'bo' ? '❌ Bị cấm (Redacted)' : '✅ Được phép thấy'}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border text-center ${
                    selectedAgent === 'bo' 
                      ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-stone-500">Rebuttal Anchor</div>
                    <div className="text-xs font-semibold mt-0.5">
                      {selectedAgent === 'bo' ? '❌ Bị xóa (Ẩn hoàn toàn)' : '✅ Thấy điểm tựa'}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border text-center ${
                    selectedAgent === 'an' || selectedAgent === 'colam'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-stone-500">Gợi ý Scaffolding</div>
                    <div className="text-xs font-semibold mt-0.5">
                      {selectedAgent === 'an' || selectedAgent === 'colam' ? '✅ Nấc 1 & Nấc 2' : '❌ Không can thiệp'}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border text-center ${
                    selectedAgent === 'linhchi'
                      ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                      : selectedAgent === 'minhkhang'
                      ? 'bg-purple-50 border-purple-200 text-purple-900 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-stone-500">Tài nguyên bổ trợ</div>
                    <div className="text-xs font-semibold mt-0.5">
                      {selectedAgent === 'linhchi' ? '📋 Cheat Sheet' : selectedAgent === 'minhkhang' ? '💡 Ẩn dụ đời sống' : '📚 RAG sách giáo khoa'}
                    </div>
                  </div>
                </div>

                {/* Important alert for Bo */}
                {selectedAgent === 'bo' && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                    <span className="text-amber-600 text-sm font-bold">⚠️</span>
                    <div>
                      <strong className="font-bold">Đảm bảo triết lý &ldquo;Nudges, not answers&rdquo;:</strong> Bo hoạt động như một bạn học Hệ 1 bộc trực. Bo tuyệt đối không nhìn thấy công thức chuẩn <code className="bg-amber-100 px-1 py-0.2 rounded font-mono text-amber-950">|BC + DD&apos;| = a√2</code> để tránh tiết lộ trước lời giải cho học sinh.
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Bảng Phấn Tại Giây T (Board Grounding) */}
              <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    <span>🎯 Bảng phấn tại giây T (Board Grounding)</span>
                    <span className="px-1.5 py-0.2 rounded bg-stone-100 font-mono text-[10px] text-stone-600">
                      T = {formatTimestamp(inspectSecond)}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">
                    Phần học: {snapshot.metadata?.activePart?.title || snapshot.metadata?.activePart?.partId || 'Quy tắc hình hộp (Ví dụ 3)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Left: LaTeX trên bảng */}
                  <div className="p-2.5 rounded-lg bg-stone-900 text-emerald-300 font-mono text-xs space-y-1">
                    <div className="text-[10px] text-stone-400 font-sans uppercase font-bold flex items-center justify-between">
                      <span>LaTeX trên bảng đen:</span>
                      <span className="text-emerald-400">● Live Grounded</span>
                    </div>
                    <div className="p-2 bg-stone-950 rounded border border-emerald-500/30 text-emerald-200 text-sm font-bold">
                      {snapshot.temporalContext?.blackboardLatex || '|\\vec{BC} + \\vec{DD\'}|'}
                    </div>
                    <div className="text-[10.5px] text-stone-300 italic">
                      Giây: {snapshot.temporalContext?.second || inspectSecond}s
                    </div>
                  </div>

                  {/* Right: Không gian 3D */}
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-800 space-y-1">
                    <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center justify-between">
                      <span>Mô hình hình học không gian 3D:</span>
                      <span className="font-mono text-cyan-700">
                        {snapshot.temporalContext?.spatialGeometry?.shapeType || 'cube'}
                      </span>
                    </div>
                    <div className="text-[11px] leading-relaxed text-stone-700">
                      <div><strong>Đỉnh:</strong> {snapshot.temporalContext?.spatialGeometry?.vertices?.join(', ') || "A, B, C, D, A', B', C', D'"}</div>
                      <div><strong>Vectơ nổi bật:</strong> {snapshot.temporalContext?.spatialGeometry?.highlightedVectors?.join(', ') || "BC, DD', CC', BC'"}</div>
                      <div><strong>Mô tả:</strong> {snapshot.temporalContext?.spatialGeometry?.actionDescription || "Hình lập phương cạnh 1, tam giác BCC' vuông cân tại C, đường chéo BC' = √2"}</div>
                    </div>
                  </div>
                </div>

                {/* Lời giảng giáo viên trong ~30s gần nhất */}
                <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-stone-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
                    <TeacherHatIcon className="w-3.5 h-3.5 text-amber-700" />
                    <span>Lời giảng giáo viên trong 30s gần nhất:</span>
                  </div>
                  <p className="font-sans italic text-xs text-stone-700 leading-relaxed">
                    &ldquo;{snapshot.temporalContext?.teacherSpeechNow || 'Thầy Tiến đang hướng dẫn phân tích vectơ rời nhau trên hình lập phương...'}&rdquo;
                  </p>
                </div>
              </div>

              {/* Card 3: RAG Snippets từ Knowledge Base */}
              <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    <span>📚 Knowledge Base RAG Snippets</span>
                    <span className="px-1.5 py-0.2 rounded bg-stone-100 font-mono text-[10px] text-stone-600">
                      {(snapshot.ragContextSnippets || []).length} mục
                    </span>
                  </span>
                  <span className="text-[10.5px] text-stone-500">
                    Lọc theo thẩm quyền của {activeTabMeta.name}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(snapshot.ragContextSnippets || []).map((snippetText, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#1B4338] mb-0.5">
                        <span>RAG #{rIdx + 1}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-stone-700">
                        {snippetText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Citations List */}
              <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    <span>📌 Danh mục trích dẫn đính kèm (Structured Citations)</span>
                  </span>
                  <span className="text-[10.5px] text-stone-500">
                    Bấm để tua video trực tiếp
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(snapshot.citations || []).map((c, cIdx) => {
                    const isVideo = c.source === 'video';
                    const isBlackboard = c.source === 'blackboard';
                    const hasSeek = typeof c.timestamp === 'number';
                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => {
                          if (hasSeek && onSeekVideo) {
                            onSeekVideo(c.timestamp);
                            onClose();
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors shadow-2xs ${
                          hasSeek
                            ? isVideo
                              ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 cursor-pointer'
                              : isBlackboard
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                              : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100 cursor-pointer'
                            : 'bg-stone-50 border-stone-300 text-stone-700 cursor-default'
                        }`}
                        title={c.quote ? `${c.label}: "${c.quote}"` : c.label}
                      >
                        <span>{isVideo ? '🎬' : isBlackboard ? '📋' : '📖'}</span>
                        <span className="font-semibold">{c.label}</span>
                        {hasSeek && (
                          <span className="font-mono text-[10px] opacity-75">
                            ({formatTimestamp(c.timestamp)})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-stone-500">
              Không thể tải snapshot cho mốc thời gian này.
            </div>
          )}
        </div>

        {/* 5. Footer Buttons */}
        <div className="mt-3 pt-3 border-t border-[#E8DFC8] flex items-center justify-between text-xs text-stone-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isBackendLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-mono text-[11px]">
              {isBackendLive ? 'Backend Live Port 3001' : 'Offline Simulation Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSnapshot(selectedAgent, inspectSecond)}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Làm mới snapshot
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1B4338] hover:bg-[#143229] text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              Đóng bảng soi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Local Fallback Snapshot Generator (when backend server is offline or unreachable)
 */
function generateLocalFallbackSnapshot(agent: AgentKey, sec: number): AgentRuntimeContext {
  const isBo = agent === 'bo';
  const isAn = agent === 'an';
  const isLinhChi = agent === 'linhchi';
  const isMinhKhang = agent === 'minhkhang';

  const blackboardLatex = Math.abs(sec - 2233) <= 120 
    ? '|\\vec{BC} + \\vec{DD\'}|'
    : sec >= 1800 
    ? '\\vec{AC\'} = \\vec{AB} + \\vec{AD} + \\vec{AA\'}'
    : '\\vec{AB} + \\vec{BC} = \\vec{AC}';

  const teacherSpeech = Math.abs(sec - 2233) <= 120
    ? 'Ở Ví dụ 3 câu a: tính độ dài vectơ BC cộng DD\'. Chú ý hai vectơ này không cùng gốc, hãy tìm một cạnh bên bằng DD\' và có gốc C...'
    : 'Thầy đang phân tích quy tắc hình hộp và các đẳng thức vectơ cơ bản trong không gian 3 chiều.';

  const ragContextSnippets: string[] = [];
  if (!isBo) {
    ragContextSnippets.push(
      'Định lý cộng vectơ: Để tính tổng hai vectơ không cùng gốc, tịnh tiến một vectơ sao cho điểm đầu trùng với điểm cuối của vectơ kia: AB + BC = AC.'
    );
    ragContextSnippets.push(
      'Bất đẳng thức tam giác: |u + v| <= |u| + |v|. Dấu bằng chỉ xảy ra khi u, v cùng hướng. Tuyệt đối không được tùy tiện tách |a + b| = |a| + |b|.'
    );
  } else {
    ragContextSnippets.push(
      'Bẫy trực giác của Bo: Cho rằng |BC + DD\'| = |BC| + |DD\'| = 1 + 1 = 2 (sai lầm cộng đại số độ dài).'
    );
    ragContextSnippets.push(
      'Mục tiêu của Bo: Thách thức học sinh chỉ ra tại sao phép cộng 1 + 1 lại bị thầy Tiến gạch bỏ trên bảng.'
    );
  }

  const citations: AgentCitation[] = [
    {
      source: 'video',
      label: 'Ví dụ 3 (37:13)',
      quote: "Độ dài |BC + DD'| = |BC + CC'| = |BC'| = √2",
      timestamp: 2233,
      timeFormatted: '37:13',
    },
    {
      source: 'blackboard',
      label: 'Bảng phấn 37:13',
      quote: '|\\vec{BC} + \\vec{DD\'}|',
      timestamp: 2233,
      timeFormatted: '37:13',
    },
    {
      source: 'sgk',
      label: 'SGK Hình học 12 trang 48',
      quote: 'Quy tắc tam giác & vectơ bằng nhau trong không gian',
      timestamp: 1350,
      timeFormatted: '22:30',
    },
  ];

  return {
    persona: {
      agentId: agent,
      systemPrompt: isBo
        ? 'Bạn là Bo, bạn học Hệ 1 bộc trực thích làm tắt.'
        : 'Bạn là Trí, bạn học Hệ 2 kiểm chứng logic.',
      speechStyle: isBo ? 'Hệ 1 bộc trực' : 'Hệ 2 logic',
    },
    temporalContext: {
      second: sec,
      blackboardLatex,
      teacherSpeechNow: teacherSpeech,
      spatialGeometry: {
        shapeType: 'cube',
        vertices: ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"],
        highlightedVectors: ['BC', "DD'", "CC'", "BC'"],
        actionDescription: "Hình lập phương cạnh 1, tam giác BCC' vuông cân tại C, đường chéo BC' = √2",
      },
    },
    dialogueHistory: [
      { speaker: 'Bạn học', text: 'Sao không cộng thẳng độ dài bằng 1 + 1 = 2 luôn cho nhanh?' },
      { speaker: 'Bo', text: 'Ủa đúng rồi đó, độ dài cạnh là 1 thì cộng lại bằng 2 chứ gì nữa?' },
    ],
    ragContextSnippets,
    learnerCognitiveState: {
      hesitationLevel: 'low',
      currentBloomLevel: 'Apply',
      activeMisconceptionId: 'MISC_VEC_005',
    },
    citations,
    metadata: {
      tokenEstimate: isBo ? 385 : 437,
      withinTokenBudget: true,
      activePart: {
        partId: 'part_03_box_rule_example3',
        title: 'Quy Tắc Hình Hộp & Điểm Dừng Bẫy Độ Dài [37:13]',
      },
      isolationPolicyApplied: {
        agent,
        hasStandardSolution: !isBo,
        hasRebuttalAnchor: !isBo,
        hasScaffoldingHints: isAn,
        hasCheatSheet: isLinhChi,
        hasEverydayAnalogy: isMinhKhang,
      },
    },
  };
}
