import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  HelpCircle,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
  Layers,
  Check,
  Sliders,
  AlertCircle,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { DRELessonSchema, PauseQuestion, ScenarioItem } from '../../types/lesson';
import { exportApprovedLessonJSON } from '../../utils/lessonAdapter';
import { checkTimelineCollisions, CollisionWarning } from './collisionChecker';
import {
  BoCircleAvatar,
  TriDeepThinkerAvatar,
  LinhChiNoteTakerAvatar,
  TutorLamCircleAvatar,
  TaAvatar,
} from '../HandmadeArtwork';
import { sound } from '../../utils/soundEffects';

interface TimelineEditorProps {
  initialLesson: DRELessonSchema;
  onApproveSuccess?: (approvedLesson: DRELessonSchema) => void;
  onSeekVideo?: (seconds: number) => void;
}

// Tháp Bloom chuẩn 6 cấp độ nhận thức
const BLOOM_LEVELS = [
  { index: 1, code: 'remember', label: 'Nhớ (Remember)', short: 'Nhớ' },
  { index: 2, code: 'understand', label: 'Hiểu (Understand)', short: 'Hiểu' },
  { index: 3, code: 'apply', label: 'Vận dụng (Apply)', short: 'Vận dụng' },
  { index: 4, code: 'analyze', label: 'Phân tích (Analyze)', short: 'Phân tích' },
  { index: 5, code: 'evaluate', label: 'Đánh giá (Evaluate)', short: 'Đánh giá' },
  { index: 6, code: 'create', label: 'Sáng tạo (Create)', short: 'Sáng tạo' },
];

function getBloomInfo(bloomStr?: string) {
  if (!bloomStr) return BLOOM_LEVELS[1];
  const lower = bloomStr.toLowerCase();
  if (lower.includes('nhớ') || lower.includes('remember')) return BLOOM_LEVELS[0];
  if (lower.includes('hiểu') || lower.includes('understand')) return BLOOM_LEVELS[1];
  if (lower.includes('vận dụng cao') || lower.includes('apply high')) return BLOOM_LEVELS[3];
  if (lower.includes('vận dụng') || lower.includes('apply')) return BLOOM_LEVELS[2];
  if (lower.includes('phân tích') || lower.includes('analyze')) return BLOOM_LEVELS[3];
  if (lower.includes('đánh giá') || lower.includes('evaluate')) return BLOOM_LEVELS[4];
  if (lower.includes('sáng tạo') || lower.includes('create')) return BLOOM_LEVELS[5];
  return BLOOM_LEVELS[1];
}

// 6-level Bloom Pip Progress Meter
const BloomPipMeter: React.FC<{ bloomStr?: string }> = ({ bloomStr }) => {
  const info = getBloomInfo(bloomStr);
  return (
    <div className="flex items-center gap-1.5" title={`Tháp Bloom: Cấp độ ${info.index}/6 - ${info.label}`}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6].map((lvl) => {
          const isFilled = lvl <= info.index;
          return (
            <span
              key={lvl}
              className={`h-2.5 w-3 rounded-xs transition-colors ${
                isFilled ? 'bg-[#121712]' : 'bg-stone-200'
              }`}
            />
          );
        })}
      </div>
      <span className="text-xs font-bold text-stone-800 font-mono tracking-tight ml-1">
        L{info.index} · {info.short}
      </span>
    </div>
  );
};

// Component Avatar Tác Tử theo tên với viền trung tính thống nhất
const AgentAvatarBadge: React.FC<{ agentName: string; size?: string }> = ({ agentName, size = 'w-6 h-6' }) => {
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
  if (norm.includes('an')) {
    return <TaAvatar className={`${size} shrink-0 ring-1 ring-stone-300 rounded-full`} />;
  }
  return <TutorLamCircleAvatar className={`${size} shrink-0 ring-1 ring-stone-300 rounded-full`} />;
};

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  initialLesson,
  onApproveSuccess,
  onSeekVideo,
}) => {
  const DRAFT_STORAGE_KEY = `dre_timeline_draft_${initialLesson.lesson_id || 'VID_VECTO_12'}`;

  const [draftLesson, setDraftLesson] = useState<DRELessonSchema>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.lesson_id === initialLesson.lesson_id || !parsed.lesson_id)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load draft from localStorage', err);
      }
    }
    // If collision simulation requested via URL (?collision=1), inject a collision (180s and 183s)
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('collision') === '1') {
      const cloned = JSON.parse(JSON.stringify(initialLesson)) as DRELessonSchema;
      if (cloned.parts && cloned.parts[0] && cloned.parts[0].scenarios) {
        // Adjust scenario 2 to 303s (only 3s after question at 300s) to trigger collision warning
        const sc = cloned.parts[0].scenarios.find((s) => s.id === 'sc-02') || cloned.parts[0].scenarios[0];
        if (sc) {
          sc.timestamp = 303;
          sc.dialogue = 'Lưu ý ngay: Phải kiểm tra điều kiện cùng phương trước khi thực hiện cộng vectơ!';
        }
      }
      return cloned;
    }
    return initialLesson;
  });
  const [isDirty, setIsDirty] = useState(false);
  const [warnings, setWarnings] = useState<CollisionWarning[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('part');
      if (p && initialLesson.parts.some((pt) => pt.id === p)) return p;
    }
    return initialLesson.parts[0]?.id || '';
  });

  // Playhead scrubber position (seconds) - defaults to 180s (3 phút)
  const [playheadSec, setPlayheadSec] = useState<number>(180);

  // Selected item on timeline or table
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    isQuestion: boolean;
  }>({ id: 'pq-01', isQuestion: true });

  // Lưu draftLesson vào localStorage khi có chỉnh sửa (P2 Fix)
  useEffect(() => {
    if (isDirty && typeof window !== 'undefined') {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftLesson));
      } catch (err) {
        console.warn('Failed to save draft to localStorage', err);
      }
    }
  }, [draftLesson, isDirty]);

  // Cảnh báo trước khi rời trang nếu chưa lưu kịch bản
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);


  // Detail panel as a dedicated side-over drawer (so the table keeps 100% full width)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('drawer') === '1';
    }
    return false;
  });

  const activePart =
    draftLesson.parts.find((p) => p.id === selectedPartId) || draftLesson.parts[0] || {
      id: 'part-01',
      title: 'Phần 1: Khởi động & Quy tắc hình trong không gian (00:00 - 21:00)',
      duration: 1260,
      pause_questions: [],
      scenarios: [],
    };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Bạn có các thay đổi kịch bản chưa được lưu. Bạn có chắc muốn rời đi?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    let isMounted = true;
    checkTimelineCollisions(draftLesson).then((res) => {
      if (isMounted) {
        setWarnings(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [draftLesson, activePart]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Metrics calculation across all parts
  const totalDuration = useMemo(() => {
    return draftLesson.parts.reduce((sum, p) => sum + (p.duration || 0), 0);
  }, [draftLesson.parts]);

  const { totalQuestions, totalActiveQuestions, totalActiveScenarios, bloomCoverage, highestBloom, allAgentsSummary, partsDurationSummary } = useMemo(() => {
    let questionsCount = 0;
    let totalQuestionsCount = 0;
    let scenariosCount = 0;
    const bloomSet = new Set<number>();
    const agentSet = new Set<string>();
    let maxBloomLevel = 1;

    draftLesson.parts.forEach((p) => {
      totalQuestionsCount += (p.pause_questions || []).length;
      (p.pause_questions || []).forEach((q) => {
        if (q.is_active) {
          questionsCount++;
          const info = getBloomInfo(q.bloom_level);
          bloomSet.add(info.index);
          if (info.index > maxBloomLevel) maxBloomLevel = info.index;
        }
      });
      (p.scenarios || []).forEach((s) => {
        if (s.agent) agentSet.add(s.agent);
        if (s.is_active) {
          scenariosCount++;
          const info = getBloomInfo(s.bloom_level);
          bloomSet.add(info.index);
          if (info.index > maxBloomLevel) maxBloomLevel = info.index;
        }
      });
    });

    const highest = BLOOM_LEVELS.find((b) => b.index === maxBloomLevel) || BLOOM_LEVELS[2];
    const agentList = Array.from(agentSet);

    const partsDurationSummary = draftLesson.parts
      .map((p) => formatTime(p.duration || 0))
      .join(' + ');

    return {
      totalQuestions: totalQuestionsCount,
      totalActiveQuestions: questionsCount,
      totalActiveScenarios: scenariosCount,
      bloomCoverage: Math.max(1, Math.min(6, bloomSet.size)),
      highestBloom: highest,
      allAgentsSummary: agentList.length > 0 ? agentList.join(' · ') : 'Bo · Trí · An',
      partsDurationSummary,
    };
  }, [draftLesson.parts]);

  // Handlers for updating & toggling
  const handleToggleQuestion = (partId: string, questionId: string) => {
    sound.playPencilTap();
    setDraftLesson((prev) => {
      const updatedParts = prev.parts.map((part) => {
        if (part.id !== partId) return part;
        return {
          ...part,
          pause_questions: (part.pause_questions || []).map((q) =>
            q.id === questionId ? { ...q, is_active: !q.is_active } : q
          ),
        };
      });
      return { ...prev, parts: updatedParts };
    });
    setIsDirty(true);
  };

  const handleToggleScenario = (partId: string, scenarioId: string) => {
    sound.playPencilTap();
    setDraftLesson((prev) => {
      const updatedParts = prev.parts.map((part) => {
        if (part.id !== partId) return part;
        return {
          ...part,
          scenarios: (part.scenarios || []).map((s) =>
            s.id === scenarioId ? { ...s, is_active: !s.is_active } : s
          ),
        };
      });
      return { ...prev, parts: updatedParts };
    });
    setIsDirty(true);
  };

  const handleUpdateQuestion = (
    partId: string,
    questionId: string,
    updates: Partial<PauseQuestion>
  ) => {
    setDraftLesson((prev) => {
      const updatedParts = prev.parts.map((part) => {
        if (part.id !== partId) return part;
        return {
          ...part,
          pause_questions: (part.pause_questions || []).map((q) =>
            q.id === questionId ? { ...q, ...updates } : q
          ),
        };
      });
      return { ...prev, parts: updatedParts };
    });
    setIsDirty(true);
  };

  const handleUpdateScenario = (
    partId: string,
    scenarioId: string,
    updates: Partial<ScenarioItem>
  ) => {
    setDraftLesson((prev) => {
      const updatedParts = prev.parts.map((part) => {
        if (part.id !== partId) return part;
        return {
          ...part,
          scenarios: (part.scenarios || []).map((s) =>
            s.id === scenarioId ? { ...s, ...updates } : s
          ),
        };
      });
      return { ...prev, parts: updatedParts };
    });
    setIsDirty(true);
  };

  const handleDeleteItem = (partId: string, itemId: string, isQuestion: boolean) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá điểm tương tác này khỏi giáo án?')) return;
    sound.playPaperRustle();
    setDraftLesson((prev) => {
      const updatedParts = prev.parts.map((part) => {
        if (part.id !== partId) return part;
        if (isQuestion) {
          return {
            ...part,
            pause_questions: (part.pause_questions || []).filter((q) => q.id !== itemId),
          };
        } else {
          return {
            ...part,
            scenarios: (part.scenarios || []).filter((s) => s.id !== itemId),
          };
        }
      });
      return { ...prev, parts: updatedParts };
    });
    setIsDirty(true);
    if (selectedItem.id === itemId) {
      setIsDetailDrawerOpen(false);
    }
  };

  const handleConfirmApprove = () => {
    sound.playSuccessChime();
    const approved: DRELessonSchema = {
      ...draftLesson,
      status: 'approved',
    };
    const jsonStr = exportApprovedLessonJSON(approved);

    try {
      localStorage.setItem(`dre_approved_lesson_${approved.lesson_id}`, jsonStr);
    } catch (_e) {
      console.warn('LocalStorage is full or disabled.');
    }

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approved_lesson_${approved.lesson_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsDirty(false);
    setShowApproveModal(false);
    onApproveSuccess?.(approved);
  };

  // Currently focused item for detail drawer
  const focusedQuestion = useMemo(() => {
    if (!selectedItem.isQuestion) return null;
    return (activePart?.pause_questions || []).find((q) => q.id === selectedItem.id);
  }, [activePart, selectedItem]);

  const focusedScenario = useMemo(() => {
    if (selectedItem.isQuestion) return null;
    return (activePart?.scenarios || []).find((s) => s.id === selectedItem.id);
  }, [activePart, selectedItem]);

  const getItemWarning = (itemId: string) => {
    return warnings.find((w) => w.itemIds.includes(itemId));
  };

  // Generate markers every 5 minutes (00:00, 05:00, 10:00...), prevent overlapping timestamps at ends
  const durationSec = activePart.duration || 1260;
  const minuteTicks = useMemo(() => {
    const stepSec = 300; // 5 minutes
    const ticks: number[] = [0];
    for (let s = stepSec; s < durationSec - 120; s += stepSec) {
      ticks.push(s);
    }
    if (durationSec > 120) {
      ticks.push(durationSec);
    }
    return ticks;
  }, [durationSec]);

  // Unified & Chronologically Sorted Rows for Interaction Table
  const sortedTimelineRows = useMemo(() => {
    type UnifiedRow =
      | { type: 'question'; item: PauseQuestion; timestamp: number }
      | { type: 'scenario'; item: ScenarioItem; timestamp: number };

    const rows: UnifiedRow[] = [
      ...(activePart.pause_questions || []).map((q) => ({
        type: 'question' as const,
        item: q,
        timestamp: q.timestamp,
      })),
      ...(activePart.scenarios || []).map((s) => ({
        type: 'scenario' as const,
        item: s,
        timestamp: s.timestamp,
      })),
    ];

    return rows.sort((a, b) => a.timestamp - b.timestamp);
  }, [activePart.pause_questions, activePart.scenarios]);

  const cleanFormula = (str: string) => {
    return (str || '').replace(/\\vec\{([A-Za-z]+)\}/g, '$1').replace(/\\vec\s*([A-Za-z]+)/g, '$1');
  };

  return (
    <div id="timeline-section" className="w-full space-y-6">
      {/* =========================================================================
          PAGE HEADER: BẢN THẢO -> ĐÃ DUYỆT + 1 NÚT CHÍNH DUY NHẤT "PHÊ DUYỆT & MỞ LỚP"
          ========================================================================= */}
      <div className="bg-white border border-[#E2EAD2] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F3F8E8] text-[#121712] border border-[#E2EAD2]">
              Giáo án tương tác
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 border ${
                draftLesson.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  draftLesson.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span>{draftLesson.status === 'approved' ? 'Đã phê duyệt' : 'Bản thảo (Draft)'}</span>
            </span>
            {isDirty && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                • Có thay đổi chưa xuất bản
              </span>
            )}
          </div>
          <h1
            style={{ fontSize: '26px', lineHeight: '34px' }}
            className="text-2xl sm:text-3xl font-extrabold text-[#121712] tracking-tight leading-tight"
          >
            {draftLesson.title || 'Biên tập dòng thời gian tương tác'}
          </h1>
          <p className="text-sm text-stone-600 truncate max-w-4xl">
            {draftLesson.description ||
              'Kiểm duyệt và tinh chỉnh các mốc câu hỏi dừng, kịch bản tranh luận đa tác nhân và thang nhận thức Bloom.'}
          </p>
        </div>

        {/* NÚT CHÍNH DUY NHẤT: PHÊ DUYỆT & MỞ LỚP (LIME SOFT CHUẨN #C8F169, CHỮ ĐEN) */}
        <div className="shrink-0 flex items-center">
          <button
            id="btn-approve-open"
            type="button"
            onClick={() => setShowApproveModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#C8F169] hover:bg-[#bbf055] text-[#121712] font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all transform active:scale-95 cursor-pointer border border-[#b4e64f]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#121712]" />
            <span>Phê duyệt & mở lớp</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          BENTO 4 Ô TRẮNG BO 24PX: ICON TRUNG TÍNH, SỐ LIỆU THỰC "CẢ 2 PHẦN"
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento 1: Tổng thời lượng */}
        <div className="bg-white border border-[#E2EAD2] rounded-[24px] p-5 shadow-xs flex items-center gap-4 hover:border-stone-300 transition">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-700">
            <Clock className="w-6 h-6 text-stone-700" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Tổng thời lượng
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#121712] font-mono">
              {formatTime(totalDuration)}
            </div>
            <div className="text-xs text-stone-600 truncate mt-0.5" title={`Cả ${draftLesson.parts.length} phần (${partsDurationSummary})`}>
              Cả {draftLesson.parts.length} phần ({partsDurationSummary})
            </div>
          </div>
        </div>

        {/* Bento 2: Số câu hỏi dừng */}
        <div className="bg-white border border-[#E2EAD2] rounded-[24px] p-5 shadow-xs flex items-center gap-4 hover:border-stone-300 transition">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-700">
            <HelpCircle className="w-6 h-6 text-stone-700" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Câu hỏi dừng
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#121712] font-mono">
              {totalActiveQuestions} <span className="text-xs font-normal text-stone-600">mốc kích hoạt</span>
            </div>
            <div className="text-xs text-stone-600 truncate mt-0.5">
              Cả {draftLesson.parts.length} phần (Đang bật {totalActiveQuestions}/{totalQuestions})
            </div>
          </div>
        </div>

        {/* Bento 3: Lượt thoại tác tử */}
        <div className="bg-white border border-[#E2EAD2] rounded-[24px] p-5 shadow-xs flex items-center gap-4 hover:border-stone-300 transition">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-700">
            <MessageSquare className="w-6 h-6 text-stone-700" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Lượt thoại tác tử
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#121712] font-mono">
              {totalActiveScenarios} <span className="text-xs font-normal text-stone-600">lượt thoại</span>
            </div>
            <div className="text-xs text-stone-600 truncate mt-0.5" title={`Cả ${draftLesson.parts.length} phần (${allAgentsSummary})`}>
              Cả {draftLesson.parts.length} phần ({allAgentsSummary})
            </div>
          </div>
        </div>

        {/* Bento 4: Tháp Bloom cao nhất */}
        <div className="bg-white border border-[#E2EAD2] rounded-[24px] p-5 shadow-xs flex items-center gap-4 hover:border-stone-300 transition">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-700">
            <BarChart3 className="w-6 h-6 text-stone-700" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Tháp Bloom
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#121712] font-mono">
              {bloomCoverage}/6 <span className="text-xs font-normal text-stone-600">cấp độ</span>
            </div>
            <div className="text-xs text-stone-800 font-semibold truncate mt-0.5">
              Cao nhất: {highestBloom.short} (L{highestBloom.index})
            </div>
          </div>
        </div>
      </div>

      {/* CẢNH BÁO XUNG ĐỘT TIMELINE NẾU CÓ */}
      {warnings.length > 0 && (
        <div className="p-4 bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl space-y-2 text-[#9A3412]">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-[#EA580C] shrink-0" />
            <span>Phát hiện {warnings.length} điểm xung đột Timeline cần lưu ý:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-1.5 pl-2 leading-relaxed font-medium">
                <span className="font-bold text-[#EA580C]">•</span>
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TIMELINE THẬT: THƯỚC ĐO CHIA VẠCH MỖI PHÚT, PLAYHEAD, 3 TRACK BO TRÒN
          ========================================================================= */}
      <div className="bg-white border border-[#E2EAD2] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        {/* Header cụm timeline: Chọn phân đoạn (Parts) + Playhead info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-600" />
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Dòng thời gian tương tác đa rãnh
            </span>
            <span className="text-xs text-stone-500 font-mono ml-1">
              (Thước đo 00:00 – {formatTime(durationSec)})
            </span>
          </div>

          {/* Part selector pills & Optional Debug Collision Simulator Button */}
          <div className="flex flex-wrap items-center gap-2">
            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1' && (
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setDraftLesson((prev) => {
                    const cloned = JSON.parse(JSON.stringify(prev)) as DRELessonSchema;
                    const p1 = cloned.parts[0];
                    if (p1 && p1.scenarios) {
                      const sc = p1.scenarios.find((s) => s.id === 'sc-02') || p1.scenarios[0];
                      if (sc) {
                        sc.timestamp = sc.timestamp === 183 ? 240 : 183;
                      }
                    }
                    return cloned;
                  });
                }}
                className="h-7 px-3 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 bg-[#FFF7ED] text-[#C2410C] hover:bg-[#FFEDD5] border border-[#FED7AA]"
                title="Nhấn để bật / tắt mô phỏng xung đột thời gian (<5s)"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mô phỏng va chạm (&lt;5s)</span>
              </button>
            )}

            <span className="text-xs font-semibold text-stone-600 mr-1 ml-1">Phân đoạn:</span>
            {draftLesson.parts.map((p) => {
              const isSelected = p.id === activePart.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    sound.playTabSwitch();
                    setSelectedPartId(p.id);
                  }}
                  className={`h-7 px-3.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#121712] text-white shadow-2xs'
                      : 'bg-[#F3F8E8] text-stone-800 hover:text-black border border-[#E2EAD2]'
                  }`}
                >
                  <span>{p.title.split(':')[0] || p.title}</span>
                  <span className="text-[11px] opacity-75 font-mono">({formatTime(p.duration)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cụm Ruler & Tracks Container */}
        <div className="space-y-3 select-none">
          {/* 1. THƯỚC ĐO THỜI GIAN: CHIA VẠCH CHUẨN MỖI PHÚT (00:00, 01:00, 02:00...) */}
          <div className="flex items-center gap-3">
            <div className="w-28 sm:w-32 shrink-0 text-right pr-2 text-xs font-bold text-stone-700 font-mono">
              {formatTime(playheadSec)} / {formatTime(durationSec)}
            </div>
            <div
              className="flex-1 relative h-7 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const newSec = Math.round(ratio * durationSec);
                setPlayheadSec(newSec);
                sound.playPencilTap();
              }}
              title="Nhấn vào thước đo để định vị Playhead"
            >
              {/* Vạch chia mỗi phút (không bị cắt ở mép, ẩn mốc khi playhead đè lên) */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                {minuteTicks.map((sec) => {
                  const percent = (sec / durationSec) * 100;
                  const isPlayheadNear = Math.abs(sec - playheadSec) < 25;
                  const isFirst = sec === 0;
                  const isLast = sec === durationSec;
                  return (
                    <div
                      key={sec}
                      className={`absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none ${
                        isFirst
                          ? 'items-start translate-x-0 pl-1'
                          : isLast
                          ? 'items-end -translate-x-full pr-1'
                          : 'items-center -translate-x-1/2'
                      }`}
                      style={{ left: `${percent}%` }}
                    >
                      <div className="w-px h-1.5 bg-stone-300" />
                      <span
                        className={`text-[10px] text-stone-600 font-mono font-bold leading-none mb-0.5 transition-opacity ${
                          isPlayheadNear ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        {formatTime(sec)}
                      </span>
                      <div className="w-px h-1 bg-stone-300" />
                    </div>
                  );
                })}
              </div>

              {/* Playhead Marker on Ruler (khớp vạch thời gian) */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#121712] z-30 transition-all pointer-events-none"
                style={{
                  left: `${Math.min(99, Math.max(1, (playheadSec / durationSec) * 100))}%`,
                }}
              >
                <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-[#121712] rounded-xs rotate-45 ring-2 ring-[#C8F169]" />
              </div>
            </div>
          </div>

          {/* 2. TRACK 1: VIDEO CHÍNH (PHÂN ĐOẠN VIDEO BÀI GIẢNG) */}
          <div className="flex items-center gap-3">
            <div className="w-28 sm:w-32 shrink-0 text-right pr-2 text-xs font-bold text-stone-700 truncate">
              Track 1 · Video
            </div>
            <div className="flex-1 h-9 bg-[#F3F8E8] border border-[#E2EAD2] rounded-xl relative flex items-center px-3 overflow-hidden shadow-2xs">
              <span className="relative z-10 text-xs font-bold text-[#121712] truncate flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">{activePart.title}</span>
                <span className="text-stone-600 font-mono text-[11px] font-normal">
                  (00:00 – {formatTime(durationSec)})
                </span>
              </span>

              {/* Playhead line through track 1 (1px hairline behind label) */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#121712]/30 pointer-events-none z-0"
                style={{
                  left: `${Math.min(99, Math.max(1, (playheadSec / durationSec) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* 3. TRACK 2: CÂU HỎI DỪNG (CHIP GỌN ĐẸP, KHÔNG TRÀN KHUNG) */}
          <div className="flex items-center gap-3">
            <div className="w-28 sm:w-32 shrink-0 text-right pr-2 text-xs font-bold text-stone-700 truncate flex items-center justify-end gap-1">
              <span>Track 2 · Câu hỏi</span>
            </div>
            <div className="flex-1 h-12 bg-white border border-[#E2EAD2] rounded-xl relative overflow-hidden flex items-center px-1 shadow-2xs">
              {(activePart.pause_questions || []).map((q) => {
                const isSelected = selectedItem.isQuestion && selectedItem.id === q.id;
                const posPercent = Math.min(
                  90,
                  Math.max(2, (q.timestamp / durationSec) * 100)
                );
                const hasWarning = !!getItemWarning(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      sound.playTabSwitch();
                      setSelectedItem({ id: q.id, isQuestion: true });
                      setPlayheadSec(q.timestamp);
                      setIsDetailDrawerOpen(true);
                    }}
                    className={`absolute z-10 top-2 bottom-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#121712] text-white ring-2 ring-[#C8F169] z-20 scale-105'
                        : q.is_active
                        ? 'bg-[#F9FAFB] text-stone-800 border border-stone-200 hover:bg-stone-100'
                        : 'bg-stone-100 text-stone-400 border border-stone-200 line-through opacity-60'
                    }`}
                    style={{ left: `${posPercent}%` }}
                    title={`Câu hỏi dừng: ${q.question} (${formatTime(q.timestamp)}) - Nhấn để xem chi tiết`}
                  >
                    <HelpCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C8F169]' : 'text-stone-700'}`} />
                    <span className="font-mono font-bold text-xs">{formatTime(q.timestamp)}</span>
                    <span className={`text-[11px] ${isSelected ? 'text-[#C8F169]' : 'text-stone-600'}`}>
                      Câu hỏi
                    </span>
                    {hasWarning && (
                      <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
                    )}
                  </button>
                );
              })}

              {/* Playhead line through track 2 (1px hairline behind chips) */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#121712]/30 pointer-events-none z-0"
                style={{
                  left: `${Math.min(99, Math.max(1, (playheadSec / durationSec) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* 4. TRACK 3: KỊCH BẢN TÁC TỬ (AVATAR TRÒN CỦA BO, TRÍ, LINH CHI, LAM) */}
          <div className="flex items-center gap-3">
            <div className="w-28 sm:w-32 shrink-0 text-right pr-2 text-xs font-bold text-stone-700 truncate">
              Track 3 · Kịch bản
            </div>
            <div className="flex-1 h-12 bg-white border border-[#E2EAD2] rounded-xl relative overflow-hidden flex items-center px-1 shadow-2xs">
              {(activePart.scenarios || []).map((s) => {
                const isSelected = !selectedItem.isQuestion && selectedItem.id === s.id;
                const posPercent = Math.min(
                  90,
                  Math.max(2, (s.timestamp / durationSec) * 100)
                );
                const hasWarning = !!getItemWarning(s.id);

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      sound.playTabSwitch();
                      setSelectedItem({ id: s.id, isQuestion: false });
                      setPlayheadSec(s.timestamp);
                      setIsDetailDrawerOpen(true);
                    }}
                    className={`absolute z-10 top-2 bottom-2 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#121712] text-white ring-2 ring-[#C8F169] z-20 scale-105'
                        : s.is_active
                        ? 'bg-[#F9FAFB] text-stone-800 border border-stone-200 hover:bg-stone-100'
                        : 'bg-stone-100 text-stone-400 border border-stone-200 opacity-60 line-through'
                    }`}
                    style={{ left: `${posPercent}%` }}
                    title={`${s.agent}: "${s.dialogue}" (${formatTime(s.timestamp)}) - Nhấn để xem chi tiết`}
                  >
                    <AgentAvatarBadge agentName={s.agent} size="w-5 h-5" />
                    <span className="font-mono font-bold text-xs">{formatTime(s.timestamp)}</span>
                    <span className={`text-[11px] ${isSelected ? 'text-[#C8F169]' : 'text-stone-600'}`}>
                      {s.agent}
                    </span>
                    {hasWarning && (
                      <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
                    )}
                  </button>
                );
              })}

              {/* Playhead line through track 3 (1px hairline behind chips) */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#121712]/30 pointer-events-none z-0"
                style={{
                  left: `${Math.min(99, Math.max(1, (playheadSec / durationSec) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BẢNG KỊCH BẢN RỘNG ĐỦ (FULL WIDTH): CỘT NỘI DUNG RỘNG, KHÔNG BỊ NÉN
          SẮP XẾP CHUẨN XÁC THEO THỨ TỰ THỜI GIAN (TIMESTAMP ASCENDING)
          ========================================================================= */}
      <div className="w-full bg-white border border-[#E2EAD2] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#121712]">
              Danh sách tương tác sư phạm
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Toàn bộ câu hỏi dừng và lời thoại phản biện trong phân đoạn được sắp xếp theo mốc thời gian.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-stone-700 bg-[#F3F8E8] px-3.5 py-1.5 rounded-full border border-[#E2EAD2]">
              {activePart.title.split(':')[0]} · Thời lượng: {formatTime(durationSec)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAF4] text-stone-700 font-bold text-xs uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4 font-mono w-28 whitespace-nowrap">Thời gian</th>
                <th className="py-3.5 px-4 w-44 whitespace-nowrap">Chủ thể</th>
                <th className="py-3.5 px-4">Nội dung câu hỏi / kịch bản thoại</th>
                <th className="py-3.5 px-4 w-44 whitespace-nowrap">Tháp Bloom</th>
                <th className="py-3.5 px-3 text-center w-20 whitespace-nowrap">Kích hoạt</th>
                <th className="py-3.5 px-3 text-center w-24 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sortedTimelineRows.map((row) => {
                if (row.type === 'question') {
                  const q = row.item;
                  const isSelected = selectedItem.isQuestion && selectedItem.id === q.id;
                  const warning = getItemWarning(q.id);

                  return (
                    <tr
                      key={q.id}
                      onClick={() => {
                        sound.playTabSwitch();
                        setSelectedItem({ id: q.id, isQuestion: true });
                        setPlayheadSec(q.timestamp);
                        setIsDetailDrawerOpen(true);
                      }}
                      className={`group transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F3F8E8] font-medium'
                          : 'hover:bg-stone-50'
                      } ${!q.is_active ? 'opacity-50' : ''}`}
                    >
                      <td className="py-4 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{formatTime(q.timestamp)}</span>
                          <span className="text-xs text-stone-500 font-normal">({q.timestamp}s)</span>
                        </div>
                        {warning && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#C2410C] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FED7AA]">
                            <AlertCircle className="w-3 h-3 text-[#EA580C]" />
                            <span>Xung đột mốc (&lt;5s)</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <TutorLamCircleAvatar className="w-7 h-7 shrink-0 ring-1 ring-stone-300 rounded-full" />
                          <div>
                            <div className="font-bold text-xs text-[#121712]">Trợ giảng AI</div>
                            <span className="text-[10px] font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                              Câu hỏi dừng
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột Nội dung rộng rãi, không bị nén, khử LaTeX escape thô */}
                      <td className="py-4 px-4">
                        <p className="text-sm text-stone-800 leading-relaxed font-sans">
                          {cleanFormula(q.question)}
                        </p>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <BloomPipMeter bloomStr={q.bloom_level} />
                      </td>

                      <td
                        className="py-4 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={q.is_active}
                          onClick={() => handleToggleQuestion(activePart.id, q.id)}
                          className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center transition cursor-pointer border ${
                            q.is_active
                              ? 'bg-[#121712] border-[#121712] text-[#C8F169]'
                              : 'bg-white border-stone-300 hover:border-stone-400 text-transparent'
                          }`}
                          title="Bật/Tắt câu hỏi dừng này"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </td>

                      <td
                        className="py-4 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem({ id: q.id, isQuestion: true });
                              setPlayheadSec(q.timestamp);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-[#121712] hover:bg-stone-100 transition cursor-pointer"
                            title="Chỉnh sửa chi tiết"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(activePart.id, q.id, true)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xoá câu hỏi dừng này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                } else {
                  const s = row.item;
                  const isSelected = !selectedItem.isQuestion && selectedItem.id === s.id;
                  const warning = getItemWarning(s.id);

                  return (
                    <tr
                      key={s.id}
                      onClick={() => {
                        sound.playTabSwitch();
                        setSelectedItem({ id: s.id, isQuestion: false });
                        setPlayheadSec(s.timestamp);
                        setIsDetailDrawerOpen(true);
                      }}
                      className={`group transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F3F8E8] font-medium'
                          : 'hover:bg-stone-50'
                      } ${!s.is_active ? 'opacity-50' : ''}`}
                    >
                      <td className="py-4 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{formatTime(s.timestamp)}</span>
                          <span className="text-xs text-stone-500 font-normal">({s.timestamp}s)</span>
                        </div>
                        {warning && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#C2410C] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FED7AA]">
                            <AlertCircle className="w-3 h-3 text-[#EA580C]" />
                            <span>Xung đột mốc (&lt;5s)</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <AgentAvatarBadge agentName={s.agent} size="w-7 h-7" />
                          <div>
                            <div className="font-bold text-xs text-[#121712]">{s.agent}</div>
                            <span className="text-[10px] font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                              Kịch bản thoại
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột Nội dung rộng rãi */}
                      <td className="py-4 px-4">
                        <p className="text-sm text-stone-800 leading-relaxed font-sans italic">
                          "{cleanFormula(s.dialogue)}"
                        </p>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <BloomPipMeter bloomStr={s.bloom_level} />
                      </td>

                      <td
                        className="py-4 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={s.is_active}
                          onClick={() => handleToggleScenario(activePart.id, s.id)}
                          className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center transition cursor-pointer border ${
                            s.is_active
                              ? 'bg-[#121712] border-[#121712] text-[#C8F169]'
                              : 'bg-white border-stone-300 hover:border-stone-400 text-transparent'
                          }`}
                          title="Bật/Tắt kịch bản này"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </td>

                      <td
                        className="py-4 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem({ id: s.id, isQuestion: false });
                              setPlayheadSec(s.timestamp);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-[#121712] hover:bg-stone-100 transition cursor-pointer"
                            title="Chỉnh sửa chi tiết"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(activePart.id, s.id, false)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xoá kịch bản này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          PANEL CHI TIẾT SƯ PHẠM DẠNG DRAWER TRƯỢT PHẢI (SLIDE-OVER DRAWER)
          KHÔNG LÀM CHẬT BẢNG, CÓ THỂ ĐÓNG BẰNG NÚT [X]
          ========================================================================= */}
      {isDetailDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
          {/* Backdrop mờ nhẹ */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDetailDrawerOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-lg bg-white border-l border-[#E2EAD2] shadow-2xl p-6 sm:p-7 overflow-y-auto space-y-5 z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-stone-800" />
                <h3 className="font-bold text-base text-[#121712]">
                  Biên tập chi tiết điểm tương tác
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition cursor-pointer"
                title="Đóng panel chi tiết"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* VIDEO CONTEXT PREVIEW CARD (P2 FIX: KHỚP MỐC VIDEO THẦY TIẾN & BẢNG PHẤN) */}
            <div className="bg-[#121712] border border-[#121712] rounded-2xl p-4 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C8F169] animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Ngữ cảnh video tại mốc {formatTime(playheadSec)}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[#C8F169] font-mono text-[11px] font-bold">
                  {playheadSec}s
                </span>
              </div>

              {/* Khung mô phỏng bảng phấn 16:9 với công thức toán KaTeX */}
              <div className="relative aspect-video rounded-xl bg-stone-900 border border-stone-800 overflow-hidden flex flex-col justify-between p-3.5 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-medium text-stone-300">Bảng phấn Thầy Tiến</span>
                  <span className="font-mono text-[#C8F169] bg-stone-800 px-1.5 py-0.5 rounded">1080p HD</span>
                </div>
                <div className="text-center py-2 space-y-1">
                  <div className="text-base font-serif font-bold text-emerald-300">
                    {focusedQuestion?.question || "|BC + DD'| = ?"}
                  </div>
                  <div className="text-xs text-stone-300 italic">
                    "Thầy Tiến: Cộng độ dài DD' đấy bằng là 1 + 1 bằng..."
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800">
                  <span>Chương 1: Vectơ không gian</span>
                  <span>Ví dụ 3: Hình lập phương ABCD.A'B'C'D'</span>
                </div>
              </div>

              {onSeekVideo && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    onSeekVideo(playheadSec);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#C8F169] hover:bg-[#bbf055] text-[#121712] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Xem trước mốc này trên Video Player ({formatTime(playheadSec)})</span>
                </button>
              )}
            </div>

            {/* Chi tiết câu hỏi dừng */}
            {focusedQuestion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-stone-50 border border-stone-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <TutorLamCircleAvatar className="w-8 h-8 shrink-0 ring-1 ring-stone-300 rounded-full" />
                    <div>
                      <div className="text-xs font-bold text-[#121712]">Điểm dừng kiểm tra (checkpoint)</div>
                      <div className="text-xs text-stone-600 font-mono">
                        Mốc video: {formatTime(focusedQuestion.timestamp)} · ID: {focusedQuestion.id}
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleToggleQuestion(activePart.id, focusedQuestion.id)}
                    className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none"
                  >
                    <span className="text-stone-700">Kích hoạt:</span>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={focusedQuestion.is_active}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                        focusedQuestion.is_active
                          ? 'bg-[#121712] border-[#121712] text-[#C8F169]'
                          : 'bg-white border-stone-300 hover:border-stone-400 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Mốc thời gian */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Mốc thời gian (Giây & Định dạng 00:00)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={durationSec}
                      value={focusedQuestion.timestamp}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleUpdateQuestion(activePart.id, focusedQuestion.id, { timestamp: val });
                        setPlayheadSec(val);
                      }}
                      className="w-28 px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono font-bold focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none text-[#121712]"
                    />
                    <span className="text-xs font-mono font-bold text-stone-600">
                      = {formatTime(focusedQuestion.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Thang nhận thức Bloom */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Thang nhận thức Bloom (6 mức)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BLOOM_LEVELS.map((lvl) => {
                      const isSelected =
                        getBloomInfo(focusedQuestion.bloom_level).index === lvl.index;
                      return (
                        <button
                          key={lvl.index}
                          type="button"
                          onClick={() =>
                            handleUpdateQuestion(activePart.id, focusedQuestion.id, {
                              bloom_level: lvl.label,
                            })
                          }
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#121712] text-white shadow-2xs'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                          }`}
                        >
                          <span className="font-mono text-xs">L{lvl.index}</span>
                          <span className="truncate">{lvl.short}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nội dung câu hỏi dừng */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Nội dung câu hỏi dừng
                  </label>
                  <textarea
                    rows={4}
                    value={focusedQuestion.question}
                    onChange={(e) =>
                      handleUpdateQuestion(activePart.id, focusedQuestion.id, {
                        question: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 text-sm leading-relaxed focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none resize-none font-sans text-[#121712]"
                    placeholder="Nhập câu hỏi dừng sư phạm..."
                  />
                </div>

                {/* Đáp án mong đợi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Đáp án chuẩn dự kiến (Expected Answers)
                  </label>
                  <div className="space-y-1.5">
                    {(focusedQuestion.expected_answers || []).map((ans, idx) => (
                      <div
                        key={idx}
                        className="px-3.5 py-2 bg-[#F3F8E8] border border-[#E2EAD2] rounded-xl text-xs font-mono text-[#121712] flex items-center justify-between"
                      >
                        <span>{ans}</span>
                        <Check className="w-4 h-4 text-emerald-700" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(activePart.id, focusedQuestion.id, true)}
                    className="px-4 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Xoá vĩnh viễn điểm tương tác này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xoá điểm này</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDetailDrawerOpen(false)}
                    className="px-5 py-2.5 rounded-full bg-[#121712] hover:bg-black text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    Xong (Lưu đóng)
                  </button>
                </div>
              </div>
            )}

            {/* Chi tiết kịch bản thoại */}
            {focusedScenario && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-stone-50 border border-stone-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <AgentAvatarBadge agentName={focusedScenario.agent} size="w-8 h-8" />
                    <div>
                      <div className="text-xs font-bold text-[#121712]">
                        Tác tử: {focusedScenario.agent}
                      </div>
                      <div className="text-xs text-stone-600 font-mono">
                        Mốc kích hoạt: {formatTime(focusedScenario.timestamp)} · ID: {focusedScenario.id}
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleToggleScenario(activePart.id, focusedScenario.id)}
                    className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none"
                  >
                    <span className="text-stone-700">Kích hoạt:</span>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={focusedScenario.is_active}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                        focusedScenario.is_active
                          ? 'bg-[#121712] border-[#121712] text-[#C8F169]'
                          : 'bg-white border-stone-300 hover:border-stone-400 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Mốc thời gian */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Mốc thời gian (Giây & Định dạng 00:00)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={durationSec}
                      value={focusedScenario.timestamp}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleUpdateScenario(activePart.id, focusedScenario.id, { timestamp: val });
                        setPlayheadSec(val);
                      }}
                      className="w-28 px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono font-bold focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none text-[#121712]"
                    />
                    <span className="text-xs font-mono font-bold text-stone-600">
                      = {formatTime(focusedScenario.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Thang nhận thức Bloom */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Thang nhận thức Bloom (6 mức)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BLOOM_LEVELS.map((lvl) => {
                      const isSelected =
                        getBloomInfo(focusedScenario.bloom_level).index === lvl.index;
                      return (
                        <button
                          key={lvl.index}
                          type="button"
                          onClick={() =>
                            handleUpdateScenario(activePart.id, focusedScenario.id, {
                              bloom_level: lvl.label,
                            })
                          }
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#121712] text-white shadow-2xs'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                          }`}
                        >
                          <span className="font-mono text-xs">L{lvl.index}</span>
                          <span className="truncate">{lvl.short}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lời thoại kịch bản */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Lời thoại tương tác của {focusedScenario.agent}
                  </label>
                  <textarea
                    rows={4}
                    value={focusedScenario.dialogue}
                    onChange={(e) =>
                      handleUpdateScenario(activePart.id, focusedScenario.id, {
                        dialogue: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 text-sm leading-relaxed focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none resize-none font-sans text-[#121712]"
                    placeholder="Nhập lời thoại của tác tử..."
                  />
                </div>

                {/* Điều kiện kích hoạt */}
                {focusedScenario.trigger_condition && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Điều kiện kích hoạt
                    </label>
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 leading-relaxed">
                      {focusedScenario.trigger_condition}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(activePart.id, focusedScenario.id, false)}
                    className="px-4 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Xoá vĩnh viễn điểm tương tác này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xoá điểm này</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDetailDrawerOpen(false)}
                    className="px-5 py-2.5 rounded-full bg-[#121712] hover:bg-black text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    Xong (Lưu đóng)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL XÁC NHẬN PHÊ DUYỆT & MỞ LỚP (LIME SOFT CHUẨN)
          ========================================================================= */}
      {showApproveModal && (
        <div id="approve-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="modal-card bg-white border border-[#E2EAD2] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#121712]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#121712]">
                  Phê duyệt giáo án & mở lớp học
                </h3>
                <p className="text-xs text-stone-600">
                  Xác nhận kiểm duyệt sư phạm và đóng gói kịch bản tương tác
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAF4] rounded-2xl border border-[#E2EAD2] text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-stone-700">Số phân đoạn bài học:</span>
                <span className="font-bold text-[#121712] font-mono">
                  {draftLesson.parts.length} phân đoạn (Cả {draftLesson.parts.length} phần)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-700">Tổng thời lượng bài giảng:</span>
                <span className="font-bold text-[#121712] font-mono">{formatTime(totalDuration)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-700">Câu hỏi dừng đang bật:</span>
                <span className="font-bold text-[#121712] font-mono">{totalActiveQuestions} mốc</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-700">Lượt thoại tác tử đang bật:</span>
                <span className="font-bold text-[#121712] font-mono">{totalActiveScenarios} lượt thoại</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                <span className="text-stone-800 font-bold">Tháp Bloom cao nhất:</span>
                <span className="font-bold text-stone-900 font-mono">
                  {highestBloom.short} (L{highestBloom.index} · {bloomCoverage}/6 cấp độ)
                </span>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Vẫn còn {warnings.length} cảnh báo timeline. Nếu bạn đã kiểm tra tính sư phạm, vẫn có thể tiến hành phê duyệt xuất bản.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-6 py-2.5 rounded-full bg-[#C8F169] hover:bg-[#bbf055] text-[#121712] font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer border border-[#b4e64f]"
              >
                <Check className="w-4 h-4 text-[#121712]" />
                <span>Xác nhận duyệt & xuất bản</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
