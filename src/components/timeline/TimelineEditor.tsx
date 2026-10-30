import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Edit3,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DRELessonSchema, PauseQuestion, ScenarioItem } from '../../types/lesson';
import { exportApprovedLessonJSON } from '../../utils/lessonAdapter';
import { lessonStore } from '../../store/lessonStore';
import { checkTimelineCollisions, checkTimelineCollisionsSync, CollisionWarning, CANONICAL_MIN_GAP_S } from './collisionChecker';
import {
  BoCircleAvatar,
  TriDeepThinkerAvatar,
  LinhChiNoteTakerAvatar,
  TutorLamCircleAvatar,
  TaAvatar,
} from '../HandmadeArtwork';
import { FormattedMathText } from '../MathVector';
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

// 6-level Bloom Pip Progress Meter (Typography >= 11px)
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
              className={`h-2.5 w-3 rounded-xs transition-colors ${isFilled ? 'bg-[#121712]' : 'bg-stone-200'
                }`}
            />
          );
        })}
      </div>
      <span className="text-[11px] font-bold text-stone-800 font-mono tracking-tight ml-1">
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
      const s = new URLSearchParams(window.location.search);
      if (s.get('resolved') === '1') {
        const resolvedLesson = JSON.parse(JSON.stringify(initialLesson)) as DRELessonSchema;
        const p2 = resolvedLesson.parts.find((p) => p.id === 'part-02');
        if (p2) {
          (p2.scenarios || []).forEach((sc) => {
            if ((sc.agent || '').toLowerCase().includes('bo')) sc.timestamp = 2253;
          });
        }
        return resolvedLesson;
      }
      if (s.get('mockup') === '1' || s.get('fresh') === '1') {
        return initialLesson;
      }
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
    return initialLesson;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [warnings, setWarnings] = useState<CollisionWarning[]>(() => checkTimelineCollisionsSync(initialLesson));
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('part');
      if (p && initialLesson.parts.some((pt) => pt.id === p)) return p;
    }
    const p2 = initialLesson.parts.find((pt) => pt.id === 'part-02');
    if (p2) return p2.id;
    return initialLesson.parts[0]?.id || '';
  });

  // Playhead scrubber position (seconds) - defaults to selected part's first question/scenario or 2233s (37:13)
  const [playheadSec, setPlayheadSec] = useState<number>(() => {
    let targetPartId = 'part-02';
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('part');
      if (p && initialLesson.parts.some((pt) => pt.id === p)) targetPartId = p;
    }
    const initialPart = initialLesson.parts.find((pt) => pt.id === targetPartId) || initialLesson.parts[0];
    if (initialPart?.pause_questions?.[0]?.timestamp) {
      return initialPart.pause_questions[0].timestamp;
    }
    if (initialPart?.scenarios?.[0]?.timestamp) {
      return initialPart.scenarios[0].timestamp;
    }
    return 2233;
  });

  // Selected item on timeline or table
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    isQuestion: boolean;
  }>(() => {
    let targetPartId = 'part-02';
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('part');
      if (p && initialLesson.parts.some((pt) => pt.id === p)) targetPartId = p;
    }
    const initialPart = initialLesson.parts.find((pt) => pt.id === targetPartId) || initialLesson.parts[0];
    if (initialPart?.pause_questions?.[0]) {
      return { id: initialPart.pause_questions[0].id, isQuestion: true };
    }
    if (initialPart?.scenarios?.[0]) {
      return { id: initialPart.scenarios[0].id, isQuestion: false };
    }
    return { id: 'pq-02', isQuestion: true };
  });

  const editorSectionRef = useRef<HTMLDivElement>(null);

  // Detail panel side-over drawer
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('drawer') === '1';
    }
    return false;
  });

  // Lưu draftLesson vào localStorage khi có chỉnh sửa
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
        e.returnValue = 'Bạn có các thay đổi kịch bản chưa được xuất bản. Bạn có chắc muốn rời đi?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const activePart =
    draftLesson.parts.find((p) => p.id === selectedPartId) || draftLesson.parts[0] || {
      id: 'part-01',
      title: 'Phần 1: Khởi động & Quy tắc hình trong không gian (00:00 - 21:00)',
      duration: 1260,
      pause_questions: [],
      scenarios: [],
    };

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
    const preferredOrder = ['Trí', 'Bo', 'Cô Lam', 'An'];
    const agentList = preferredOrder.filter((a) => agentSet.has(a));

    const partsDurationSummary = draftLesson.parts
      .map((p) => formatTime(p.duration || 0))
      .join(' + ');

    return {
      totalQuestions: totalQuestionsCount,
      totalActiveQuestions: questionsCount,
      totalActiveScenarios: scenariosCount,
      bloomCoverage: Math.max(1, Math.min(6, bloomSet.size)),
      highestBloom: highest,
      allAgentsSummary: agentList.length > 0 ? agentList.join(' · ') : 'Trí · Bo · Cô Lam',
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
    updates: Partial<PauseQuestion> & { bo_trap?: string; teacher_rule?: string }
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

  const handleShiftBo = () => {
    sound.playSuccessChime();
    setDraftLesson((prev) => {
      const updatedParts = prev.parts.map((part) => {
        if (part.id !== 'part-02') return part;
        return {
          ...part,
          scenarios: (part.scenarios || []).map((s) =>
            (s.agent || '').toLowerCase().includes('bo') && (s.timestamp === 2240 || s.timestamp < 2253)
              ? { ...s, timestamp: 2253 }
              : s
          ),
        };
      });
      return { ...prev, parts: updatedParts };
    });
    setIsDirty(true);
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

    // Đồng bộ lập tức vào Store dùng chung (Zustand/Context sync localStorage)
    lessonStore.approveAndPublish(approved);

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

  // Currently focused item for inspector card / detail drawer
  const focusedQuestion = useMemo(() => {
    if (!selectedItem.isQuestion) return null;
    return (activePart?.pause_questions || []).find((q) => q.id === selectedItem.id);
  }, [activePart, selectedItem]);

  const focusedScenario = useMemo(() => {
    if (selectedItem.isQuestion) return null;
    return (activePart?.scenarios || []).find((s) => s.id === selectedItem.id);
  }, [activePart, selectedItem]);

  // Liên kết tự động bẫy của Bo và lời chốt của Cô Lam trong cùng phân đoạn
  const linkedBoScenario = useMemo(() => {
    return (activePart?.scenarios || []).find((s) => (s.agent || '').toLowerCase().includes('bo'));
  }, [activePart]);

  const linkedTeacherScenario = useMemo(() => {
    return (activePart?.scenarios || []).find((s) => {
      const a = (s.agent || '').toLowerCase();
      return a.includes('lam') || a.includes('trí') || a.includes('tri');
    });
  }, [activePart]);

  const getItemWarning = (itemId: string) => {
    return warnings.find((w) => w.itemIds.includes(itemId));
  };

  // Chuẩn hóa Part-relative & Absolute timestamps cho thước đo Part 2
  const durationSec = activePart.duration || 1260;
  const partIndex = draftLesson.parts.findIndex((p) => p.id === activePart.id);
  const partStartSec = useMemo(() => {
    if (partIndex <= 0) return 0;
    return draftLesson.parts.slice(0, partIndex).reduce((sum, p) => sum + (p.duration || 0), 0);
  }, [draftLesson.parts, partIndex]);
  const partEndSec = partStartSec + durationSec;

  // Khi initialLesson thay đổi (chuyển draft từ War Room), cập nhật lại draftLesson
  useEffect(() => {
    setDraftLesson(initialLesson);
  }, [initialLesson]);

  // Đồng bộ selectedItem và playheadSec khi đổi phân đoạn (activePart)
  useEffect(() => {
    const itemInPart =
      (activePart.pause_questions || []).some((q) => q.id === selectedItem.id) ||
      (activePart.scenarios || []).some((s) => s.id === selectedItem.id);

    if (!itemInPart) {
      if (activePart.pause_questions && activePart.pause_questions.length > 0) {
        const firstQ = activePart.pause_questions[0];
        setSelectedItem({ id: firstQ.id, isQuestion: true });
        setPlayheadSec(firstQ.timestamp);
      } else if (activePart.scenarios && activePart.scenarios.length > 0) {
        const firstS = activePart.scenarios[0];
        setSelectedItem({ id: firstS.id, isQuestion: false });
        setPlayheadSec(firstS.timestamp);
      } else {
        setPlayheadSec(partStartSec);
      }
    }
  }, [activePart.id, activePart.pause_questions, activePart.scenarios, selectedItem.id, partStartSec]);

  const minuteTicks = useMemo(() => {
    if (activePart.id === 'part-02') {
      return [1260, 1800, 2400, 3000, 3600, 3990];
    }
    const ticks: number[] = [partStartSec];
    const stepSec = 300;
    let s = Math.ceil((partStartSec + 60) / stepSec) * stepSec;
    while (s < partEndSec - 120) {
      ticks.push(s);
      s += stepSec;
    }
    if (!ticks.includes(partEndSec)) {
      ticks.push(partEndSec);
    }
    return ticks;
  }, [activePart.id, partStartSec, partEndSec]);

  const playheadPercent = Math.min(
    99,
    Math.max(1, ((playheadSec - partStartSec) / durationSec) * 100)
  );

  // Track 2: Bo scenarios (Bẫy ngộ nhận)
  const boScenarios = useMemo(() => {
    return (activePart.scenarios || []).filter((s) => (s.agent || '').toLowerCase().includes('bo'));
  }, [activePart.scenarios]);

  // Track 3: Trí & Cô Lam (Phản biện & Chốt quy tắc)
  const debateAndRuleScenarios = useMemo(() => {
    return (activePart.scenarios || []).filter((s) => !(s.agent || '').toLowerCase().includes('bo'));
  }, [activePart.scenarios]);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newSec = Math.round(partStartSec + ratio * durationSec);
    setPlayheadSec(newSec);
    sound.playPencilTap();
  };

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

  // Select an item and scroll to the inspector editor
  const handleSelectItem = (id: string, isQuestion: boolean, timestamp: number) => {
    sound.playTabSwitch();
    setSelectedItem({ id, isQuestion });
    setPlayheadSec(timestamp);
  };

  return (
    <div id="timeline-section" className="w-full space-y-6 overflow-x-hidden">
      {/* =========================================================================
          PAGE HEADER: BẢN THẢO -> ĐÃ DUYỆT + 1 NÚT CHÍNH DUY NHẤT "PHÊ DUYỆT & ĐƯA VÀO LỚP HỌC"
          ========================================================================= */}
      <div className="bg-white border border-[#E2EAD2] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#F3F8E8] text-[#121712] border border-[#E2EAD2]">
              Giáo án tương tác
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 border ${draftLesson.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 text-amber-950 border-amber-300'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${draftLesson.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                  }`}
              />
              <span>{draftLesson.status === 'approved' ? 'Đã phê duyệt' : 'Bản thảo (Draft)'}</span>
            </span>
            {isDirty && (
              <span className="text-[11px] font-semibold text-amber-950 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                Có thay đổi chưa xuất bản
              </span>
            )}
          </div>
          <h1
            style={{ fontSize: '26px', lineHeight: '34px' }}
            className="text-2xl sm:text-3xl font-extrabold text-[#121712] tracking-tight leading-tight"
          >
            {draftLesson.title || 'Biên tập dòng thời gian tương tác'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 truncate max-w-4xl">
            {draftLesson.description ||
              'Kiểm duyệt và tinh chỉnh các mốc câu hỏi dừng, kịch bản tranh luận đa tác nhân và thang nhận thức Bloom.'}
          </p>
        </div>

        {/* NÚT CHÍNH DUY NHẤT: PHÊ DUYỆT & ĐƯA VÀO LỚP HỌC (LIME SOFT CHUẨN #C8F169, CHỮ ĐEN) */}
        <div className="shrink-0 flex items-center">
          <button
            id="btn-approve-open"
            type="button"
            onClick={() => setShowApproveModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#C8F169] hover:bg-[#bbf055] text-[#121712] font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all transform active:scale-95 cursor-pointer border border-[#b4e64f]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#121712]" />
            <span>Phê duyệt & Đưa vào lớp học</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          BENTO 4 Ô TRẮNG BO 24PX: SỐ LIỆU SƯ PHẠM ĐA PHÂN ĐOẠN
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento 1: Tổng thời lượng */}
        <div className="bg-white border border-[#E2EAD2] rounded-[24px] p-5 shadow-xs flex items-center gap-4 hover:border-stone-300 transition">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-700">
            <Clock className="w-6 h-6 text-stone-700" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
              Tổng thời lượng
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#121712] font-mono">
              {formatTime(totalDuration)}
            </div>
            <div className="text-[11px] text-stone-600 mt-0.5 leading-snug" title={`Cả ${draftLesson.parts.length} phần (${partsDurationSummary})`}>
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
            <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
              Câu hỏi dừng
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#121712] font-mono">
              {totalActiveQuestions} <span className="text-xs font-normal text-stone-600">mốc kích hoạt</span>
            </div>
            <div className="text-[11px] text-stone-600 mt-0.5 leading-snug">
              Cả {draftLesson.parts.length} phần (Đang bật {totalActiveQuestions}/{totalQuestions})
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              Ngộ nhận chính 0.85 · giả thuyết nhóm, chưa đo
            </div>
          </div>
        </div>

        {/* Bento 3: Lượt thoại tác tử */}
        <div className="bg-white border border-[#E2EAD2] rounded-[24px] p-5 shadow-xs flex items-center gap-4 hover:border-stone-300 transition">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-700">
            <MessageSquare className="w-6 h-6 text-stone-700" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
              Lượt thoại tác tử
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#121712] font-mono">
              {totalActiveScenarios} <span className="text-xs font-normal text-stone-600">lượt thoại</span>
            </div>
            <div className="text-[11px] text-stone-600 mt-0.5 leading-snug" title={`Cả ${draftLesson.parts.length} phần (${allAgentsSummary})`}>
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
            <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
              Tháp Bloom
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#121712] font-mono">
              {bloomCoverage}/6 <span className="text-xs font-normal text-stone-600">cấp độ</span>
            </div>
            <div className="text-[11px] text-stone-800 font-semibold truncate mt-0.5">
              Cao nhất: {highestBloom.short} (L{highestBloom.index})
            </div>
          </div>
        </div>
      </div>

      {/* CẢNH BÁO VA CHẠM NHỊP ĐỘ (< 20S) KHỚP 100% TRANG 3 MOCKUP */}
      {(() => {
        const activeWarnings = warnings.filter((w) => {
          if (w.partId) return w.partId === activePart.id;
          if (w.itemIds && w.itemIds.length > 0) {
            return w.itemIds.some((id) =>
              (activePart.pause_questions || []).some((q) => q.id === id) ||
              (activePart.scenarios || []).some((s) => s.id === id)
            );
          }
          return false;
        });

        if (activeWarnings.length === 0) return null;

        return (
          <div className="p-4 sm:p-5 bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-[#7C2D12] shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-[#C2410C] shrink-0" />
                <span>PHÁT HIỆN {activeWarnings.length} ĐIỂM CẢNH BÁO VA CHẠM NHỊP ĐỘ SƯ PHẠM (&lt; {CANONICAL_MIN_GAP_S}S):</span>
              </div>
              {activeWarnings.map((w, idx) => (
                <div key={idx} className="text-xs leading-relaxed font-medium">
                  {w.message}
                </div>
              ))}
            </div>
            <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
              <button
                type="button"
                onClick={handleShiftBo}
                className="px-4 py-2 rounded-full border border-[#EA580C] bg-white hover:bg-orange-50 text-[#7C2D12] font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Dời Bo tới 37:33
              </button>
              <span className="text-[11px] text-[#9A3412]">
                Kiểm tra cục bộ · ngưỡng 20 giây
              </span>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          BỐ CỤC MULTI-TRACK TIMELINE (DÒNG THỜI GIAN ĐA LUỒNG):
          - THƯỚC ĐO NHỊP SƯ PHẠM (5M RULER) RÕ NÉT VỚI VẠCH CHIA MỖI PHÚT
          - TRACK 1: ĐIỂM DỪNG (CHECKPOINTS)
          - TRACK 2: BẪY NGỘ NHẬN CỦA BO (MISCONCEPTIONS)
          - TRACK 3: PHẢN BIỆN CỦA TRÍ & CHỐT QUY TẮC CÔ LAM
          ========================================================================= */}
      <div className="bg-white border border-[#E2EAD2] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        {/* Header cụm timeline: Chọn phân đoạn (Parts) + Playhead info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-600" />
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Dòng thời gian tương tác đa luồng (Multi-Track Timeline)
            </span>
            <span className="text-[11px] text-stone-500 font-mono ml-1">
              (Thước đo {formatTime(partStartSec)} – {formatTime(partStartSec + durationSec)})
            </span>
          </div>

          {/* Part selector pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 mr-1">Phân đoạn:</span>
            {draftLesson.parts.map((p) => {
              const isSelected = p.id === activePart.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    sound.playTabSwitch();
                    setSelectedPartId(p.id);
                    const pIndex = draftLesson.parts.findIndex((pt) => pt.id === p.id);
                    const pStart = draftLesson.parts.slice(0, pIndex).reduce((sum, pt) => sum + (pt.duration || 0), 0);
                    const pFirstQ = p.pause_questions?.[0]?.timestamp;
                    setPlayheadSec(pFirstQ ?? pStart);
                  }}
                  className={`h-7 px-3.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${isSelected
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
        <div className="space-y-3.5 select-none">
          {/* 1. THƯỚC ĐO NHỊP SƯ PHẠM (5M RULER) RÕ NÉT CÓ VẠCH CHIA MỐC THỜI GIAN */}
          <div className="flex items-center gap-3">
            <div className="w-32 sm:w-36 shrink-0 text-right pr-2 text-xs font-bold text-stone-700 font-mono">
              {formatTime(playheadSec)} / {formatTime(totalDuration)}
            </div>
            <div
              className="flex-1 relative h-8 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer overflow-hidden shadow-2xs"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const newSec = Math.round(partStartSec + ratio * durationSec);
                setPlayheadSec(newSec);
                sound.playPencilTap();
              }}
              title="Nhấn vào thước đo để định vị Playhead"
            >
              {/* Vạch chia mốc tuyệt đối chuẩn theo phân đoạn */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                {minuteTicks.map((sec, idx) => {
                  const percent = ((sec - partStartSec) / durationSec) * 100;
                  const isPlayheadNear = Math.abs(sec - playheadSec) < 25;
                  const isFirst = idx === 0;
                  const isLast = idx === minuteTicks.length - 1;
                  return (
                    <div
                      key={sec}
                      className={`absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none ${isFirst
                          ? 'items-start translate-x-0 pl-1'
                          : isLast
                            ? 'items-end -translate-x-full pr-1'
                            : 'items-center -translate-x-1/2'
                        }`}
                      style={{ left: `${percent}%` }}
                    >
                      <div className="w-px h-2 bg-stone-400" />
                      <span
                        className={`text-[11px] text-stone-700 font-mono font-bold leading-none mb-0.5 transition-opacity ${isPlayheadNear ? 'opacity-0' : 'opacity-100'
                          }`}
                      >
                        {formatTime(sec)}
                      </span>
                      <div className="w-px h-1.5 bg-stone-300" />
                    </div>
                  );
                })}
              </div>

              {/* Playhead Marker on Ruler */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#121712] z-30 transition-all pointer-events-none"
                style={{
                  left: `${playheadPercent}%`,
                }}
              >
                <div className="absolute -top-1 -translate-x-1/2 w-3.5 h-3.5 bg-[#121712] rounded-xs rotate-45 ring-2 ring-[#C8F169]" />
              </div>
            </div>
          </div>

          {/* 2. TRACK 1: ĐIỂM DỪNG (CHECKPOINTS) */}
          <div className="flex items-center gap-3">
            <div className="w-32 sm:w-36 shrink-0 text-right pr-2 text-xs font-bold text-stone-800 truncate flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span>Track 1 · Điểm dừng</span>
            </div>
            <div 
              onClick={handleTrackClick}
              title="Nhấn vào thanh Track 1 để định vị thời gian"
              className="flex-1 h-14 bg-white border border-[#E2EAD2] rounded-2xl relative overflow-hidden flex items-center px-1 shadow-2xs cursor-pointer"
            >
              {(activePart.pause_questions || []).map((q) => {
                const isSelected = selectedItem.isQuestion && selectedItem.id === q.id;
                const posPercent = Math.min(100, Math.max(0, ((q.timestamp - partStartSec) / durationSec) * 100));
                const translateClass = posPercent > 88 ? '-translate-x-full' : posPercent < 12 ? 'translate-x-0' : '-translate-x-1/2';
                const hasWarning = !!getItemWarning(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectItem(q.id, true, q.timestamp)}
                    className={`absolute z-10 top-2 bottom-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${translateClass} ${isSelected
                        ? 'bg-[#121712] text-white ring-2 ring-[#C8F169] z-20 scale-105'
                        : q.is_active
                          ? 'bg-[#F9FAFB] text-stone-800 border border-stone-200 hover:bg-stone-100'
                          : 'bg-stone-100 text-stone-400 border border-stone-200 line-through opacity-60'
                      }`}
                    style={{ left: `${posPercent}%` }}
                    title={`Câu hỏi dừng: ${q.question} (${formatTime(q.timestamp)}) - Nhấn để biên tập chi tiết`}
                  >
                    <HelpCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C8F169]' : 'text-stone-700'}`} />
                    <span className="font-mono font-bold text-xs">{formatTime(q.timestamp)}</span>
                    <span className={`text-[11px] ${isSelected ? 'text-[#C8F169]' : 'text-stone-600'}`}>
                      Điểm dừng
                    </span>
                    {hasWarning && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-ping" title="Cảnh báo va chạm nhịp độ < 20s" />
                    )}
                  </button>
                );
              })}

              {/* Playhead line through track 1 */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#121712]/30 pointer-events-none z-0"
                style={{
                  left: `${playheadPercent}%`,
                }}
              />
            </div>
          </div>

          {/* 3. TRACK 2: BẪY NGỘ NHẬN CỦA BO (MISCONCEPTIONS) */}
          <div className="flex items-center gap-3">
            <div className="w-32 sm:w-36 shrink-0 text-right pr-2 text-xs font-bold text-stone-800 truncate flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Track 2 · Bẫy của Bo</span>
            </div>
            <div 
              onClick={handleTrackClick}
              title="Nhấn vào thanh Track 2 để định vị thời gian"
              className="flex-1 h-14 bg-white border border-[#E2EAD2] rounded-2xl relative overflow-hidden flex items-center px-1 shadow-2xs cursor-pointer"
            >
              {boScenarios.map((s) => {
                const isSelected = !selectedItem.isQuestion && selectedItem.id === s.id;
                const posPercent = Math.min(100, Math.max(0, ((s.timestamp - partStartSec) / durationSec) * 100));
                const translateClass = posPercent > 88 ? '-translate-x-full' : posPercent < 12 ? 'translate-x-0' : '-translate-x-1/2';
                const hasWarning = !!getItemWarning(s.id);

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectItem(s.id, false, s.timestamp)}
                    className={`absolute z-10 top-2 bottom-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${translateClass} ${isSelected
                        ? 'bg-[#121712] text-white ring-2 ring-[#C8F169] z-20 scale-105'
                        : s.is_active
                          ? 'bg-[#F9FAFB] text-stone-800 border border-stone-200 hover:bg-stone-100'
                          : 'bg-stone-100 text-stone-400 border border-stone-200 opacity-60 line-through'
                      }`}
                    style={{ left: `${posPercent}%` }}
                    title={`Bo gài bẫy ngộ nhận: "${s.dialogue}" (${formatTime(s.timestamp)})`}
                  >
                    <AgentAvatarBadge agentName="Bo" size="w-5 h-5" />
                    <span className="font-mono font-bold text-xs">{formatTime(s.timestamp)}</span>
                    <span className={`text-[11px] font-medium truncate max-w-[130px] ${isSelected ? 'text-[#C8F169]' : 'text-stone-700'}`}>
                      Bo · Bẫy trực giác
                    </span>
                    {hasWarning && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-ping" title="Cảnh báo va chạm nhịp độ < 20s" />
                    )}
                  </button>
                );
              })}

              {/* Playhead line through track 2 */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#121712]/30 pointer-events-none z-0"
                style={{
                  left: `${playheadPercent}%`,
                }}
              />
            </div>
          </div>

          {/* 4. TRACK 3: PHẢN BIỆN CỦA TRÍ & CHỐT QUY TẮC CÔ LAM */}
          <div className="flex items-center gap-3">
            <div className="w-32 sm:w-36 shrink-0 text-right pr-2 text-xs font-bold text-stone-800 truncate flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-700 shrink-0" />
              <span>Track 3 · Trí & Cô Lam</span>
            </div>
            <div 
              onClick={handleTrackClick}
              title="Nhấn vào thanh Track 3 để định vị thời gian"
              className="flex-1 h-14 bg-white border border-[#E2EAD2] rounded-2xl relative overflow-hidden flex items-center px-1 shadow-2xs cursor-pointer"
            >
              {debateAndRuleScenarios.map((s) => {
                const isSelected = !selectedItem.isQuestion && selectedItem.id === s.id;
                const posPercent = Math.min(100, Math.max(0, ((s.timestamp - partStartSec) / durationSec) * 100));
                const translateClass = posPercent > 88 ? '-translate-x-full' : posPercent < 12 ? 'translate-x-0' : '-translate-x-1/2';
                const hasWarning = !!getItemWarning(s.id);
                const isTeacher = (s.agent || '').toLowerCase().includes('lam');

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectItem(s.id, false, s.timestamp)}
                    className={`absolute z-10 top-2 bottom-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${translateClass} ${isSelected
                        ? 'bg-[#121712] text-white ring-2 ring-[#C8F169] z-20 scale-105'
                        : s.is_active
                          ? 'bg-[#F9FAFB] text-stone-800 border border-stone-200 hover:bg-stone-100'
                          : 'bg-stone-100 text-stone-400 border border-stone-200 opacity-60 line-through'
                      }`}
                    style={{ left: `${posPercent}%` }}
                    title={`${s.agent}: "${s.dialogue}" (${formatTime(s.timestamp)})`}
                  >
                    <AgentAvatarBadge agentName={s.agent} size="w-5 h-5" />
                    <span className="font-mono font-bold text-xs">{formatTime(s.timestamp)}</span>
                    <span className={`text-[11px] font-medium truncate max-w-[140px] ${isSelected ? 'text-[#C8F169]' : 'text-stone-700'}`}>
                      {isTeacher ? 'Cô Lam · Chốt quy tắc' : `${s.agent} · Phản biện`}
                    </span>
                    {hasWarning && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-ping" title="Cảnh báo va chạm nhịp độ < 20s" />
                    )}
                  </button>
                );
              })}

              {/* Playhead line through track 3 */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#121712]/30 pointer-events-none z-0"
                style={{
                  left: `${playheadPercent}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE INSPECTOR & EDITOR (THẺ BIÊN TẬP CHI TIẾT & BẢNG PHẤN 16:9)
          CẬP NHẬT TỨC THÌ KHI CLICK VÀO ĐIỂM DỪNG / KỊCH BẢN TRÊN TIMELINE
          ========================================================================= */}
      <div ref={editorSectionRef} className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (5/12): KHUNG XEM TRƯỚC BẢNG PHẤN 16:9 (BLACKBOARD PREVIEW) */}
        <div className="lg:col-span-5 bg-[#141A14] border-2 border-[#243324] rounded-3xl p-5 text-white flex flex-col justify-between shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8F169] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
                Bảng Phấn Thầy Tiến · Mốc {formatTime(playheadSec)}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#C8F169] font-mono text-[11px] font-bold">
              1080p HD
            </span>
          </div>

          {/* Vùng Bảng Phấn 16:9 với KaTeX mượt mà không tràn viền */}
          <div className="relative aspect-video rounded-2xl bg-[#0D130E] border border-[#243324] p-4 flex flex-col justify-between overflow-hidden shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span className="font-semibold text-stone-300">Toán 12: Vectơ Không Gian</span>
              <span className="font-mono text-[#C8F169] bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                {formatTime(playheadSec)}
              </span>
            </div>

            {/* Công thức toán trung tâm KaTeX có overflow-x-auto */}
            <div className="py-3 px-2 text-center space-y-2 overflow-x-auto">
              <div className="text-base sm:text-lg font-serif font-bold text-emerald-300 tracking-wide">
                <FormattedMathText
                  text="\[ |\overrightarrow{BC} + \overrightarrow{DD'}| = \sqrt{2} \neq 2 \]"
                />
              </div>
              <div className="text-xs text-stone-200 font-sans leading-relaxed px-2">
                {focusedQuestion ? (
                  <span>{focusedQuestion.question}</span>
                ) : (
                  <span>Cho hình lập phương ABCD.A'B'C'D' cạnh 1. Độ dài tổng |BC + DD'| bằng bao nhiêu?</span>
                )}
              </div>
              <div className="text-xs text-stone-300 italic font-sans">
                "Thầy Tiến: Lưu ý độ dài của tổng khác tổng hai độ dài!"
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-800">
              <span className="truncate max-w-[200px]">Ví dụ 3: Hình lập phương ABCD.A'B'C'D'</span>
              <span className="text-[#C8F169] font-mono">Cạnh = 1</span>
            </div>
          </div>

          {/* Nút xem trước mốc trên Video Player */}
          {onSeekVideo && (
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                onSeekVideo(playheadSec);
              }}
              className="w-full py-2.5 rounded-full bg-[#C8F169] hover:bg-[#bbf055] text-[#121712] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs border border-[#b4e64f]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Xem trước mốc này trên Video Player ({formatTime(playheadSec)})</span>
            </button>
          )}
        </div>

        {/* CỘT PHẢI (7/12): THẺ CHI TIẾT BIÊN TẬP TỨC THÌ (INTERACTIVE EDITOR CARD) */}
        <div className="lg:col-span-7 bg-white border border-[#E2EAD2] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-stone-800" />
              <h3 className="font-bold text-base text-[#121712]">
                Biên tập chi tiết điểm tương tác
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-stone-600 bg-[#F3F8E8] px-2.5 py-1 rounded-full border border-[#E2EAD2]">
                {selectedItem.isQuestion ? 'Điểm dừng kiểm tra' : 'Lượt thoại tác tử'}
              </span>
            </div>
          </div>

          {/* Nếu đang chọn Câu hỏi dừng (Checkpoint) */}
          {focusedQuestion && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#F8FAF4] border border-[#E2EAD2] p-3.5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <TutorLamCircleAvatar className="w-8 h-8 shrink-0 ring-1 ring-stone-300 rounded-full" />
                  <div>
                    <div className="text-xs font-bold text-[#121712]">Điểm dừng kiểm tra (Checkpoint)</div>
                    <div className="text-[11px] text-stone-600 font-mono">
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
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${focusedQuestion.is_active
                        ? 'bg-[#121712] border-[#121712] text-[#C8F169]'
                        : 'bg-white border-stone-300 hover:border-stone-400 text-transparent'
                      }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Mốc thời gian */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                  Mốc thời gian (Giây & Định dạng 00:00)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={partStartSec}
                    max={partEndSec}
                    value={focusedQuestion.timestamp}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleUpdateQuestion(activePart.id, focusedQuestion.id, { timestamp: val });
                      setPlayheadSec(val);
                    }}
                    className="w-28 px-3 py-1.5 rounded-xl border border-stone-300 text-sm font-mono font-bold focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none text-[#121712]"
                  />
                  <span className="text-xs font-mono font-bold text-stone-700">
                    = {formatTime(focusedQuestion.timestamp)}
                  </span>
                </div>
              </div>

              {/* Thang nhận thức Bloom */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
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
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${isSelected
                            ? 'bg-[#121712] text-white shadow-2xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                          }`}
                      >
                        <span className="font-mono">L{lvl.index}</span>
                        <span className="truncate">{lvl.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nội dung câu hỏi dừng */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                  Nội dung câu hỏi dừng của giáo viên
                </label>
                <textarea
                  rows={3}
                  value={focusedQuestion.question}
                  onChange={(e) =>
                    handleUpdateQuestion(activePart.id, focusedQuestion.id, {
                      question: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm leading-relaxed focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none resize-none font-sans text-[#121712]"
                  placeholder="Nhập nội dung câu hỏi dừng sư phạm..."
                />
              </div>

              {/* Phương án gài bẫy ngộ nhận của Bo (Liên kết sư phạm) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                    <BoCircleAvatar className="w-4 h-4 rounded-full ring-1 ring-stone-300" />
                    <span>Phương án gài bẫy ngộ nhận của Bo</span>
                  </label>
                  <span className="text-[11px] text-stone-500 font-mono">Bẫy trực giác</span>
                </div>
                <input
                  type="text"
                  value={
                    linkedBoScenario?.dialogue ||
                    "Tách trực tiếp thành tổng hai độ dài: |BC| + |DD'| = 1 + 1 = 2!"
                  }
                  onChange={(e) => {
                    if (linkedBoScenario) {
                      handleUpdateScenario(activePart.id, linkedBoScenario.id, {
                        dialogue: e.target.value,
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-sans focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none text-[#121712]"
                  placeholder="Nhập phương án hoặc lời thoại gài bẫy ngộ nhận của Bo..."
                />
              </div>

              {/* Lời chốt quy tắc của Cô Lam */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                    <TutorLamCircleAvatar className="w-4 h-4 rounded-full ring-1 ring-stone-300" />
                    <span>Lời chốt quy tắc của Cô Lam</span>
                  </label>
                  <span className="text-[11px] text-stone-500 font-mono">Quy tắc sư phạm</span>
                </div>
                <input
                  type="text"
                  value={
                    linkedTeacherScenario?.dialogue ||
                    "Quy tắc vàng: Phải đưa về hai vectơ nối tiếp BC + CC' = BC' rồi mới tính độ dài!"
                  }
                  onChange={(e) => {
                    if (linkedTeacherScenario) {
                      handleUpdateScenario(activePart.id, linkedTeacherScenario.id, {
                        dialogue: e.target.value,
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-sans focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none text-[#121712]"
                  placeholder="Nhập lời chốt kiến thức trọng tâm của Cô Lam..."
                />
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(activePart.id, focusedQuestion.id, true)}
                  className="px-3.5 py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Xoá vĩnh viễn điểm tương tác này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xoá điểm này</span>
                </button>
                <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                  <span>Đã lưu bản thảo tự động</span>
                </span>
              </div>
            </div>
          )}

          {/* Nếu đang chọn Kịch bản thoại của tác tử (Scenario) */}
          {focusedScenario && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#F8FAF4] border border-[#E2EAD2] p-3.5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AgentAvatarBadge agentName={focusedScenario.agent} size="w-8 h-8" />
                  <div>
                    <div className="text-xs font-bold text-[#121712]">
                      Tác tử tương tác: {focusedScenario.agent}
                    </div>
                    <div className="text-[11px] text-stone-600 font-mono">
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
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${focusedScenario.is_active
                        ? 'bg-[#121712] border-[#121712] text-[#C8F169]'
                        : 'bg-white border-stone-300 hover:border-stone-400 text-transparent'
                      }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Mốc thời gian */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                  Mốc thời gian (Giây & Định dạng 00:00)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={partStartSec}
                    max={partEndSec}
                    value={focusedScenario.timestamp}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleUpdateScenario(activePart.id, focusedScenario.id, { timestamp: val });
                      setPlayheadSec(val);
                    }}
                    className="w-28 px-3 py-1.5 rounded-xl border border-stone-300 text-sm font-mono font-bold focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none text-[#121712]"
                  />
                  <span className="text-xs font-mono font-bold text-stone-700">
                    = {formatTime(focusedScenario.timestamp)}
                  </span>
                </div>
              </div>

              {/* Thang nhận thức Bloom */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
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
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${isSelected
                            ? 'bg-[#121712] text-white shadow-2xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                          }`}
                      >
                        <span className="font-mono">L{lvl.index}</span>
                        <span className="truncate">{lvl.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lời thoại kịch bản */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                  Lời thoại tương tác của {focusedScenario.agent}
                </label>
                <textarea
                  rows={3}
                  value={focusedScenario.dialogue}
                  onChange={(e) =>
                    handleUpdateScenario(activePart.id, focusedScenario.id, {
                      dialogue: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm leading-relaxed focus:border-[#121712] focus:ring-1 focus:ring-[#121712] outline-none resize-none font-sans text-[#121712]"
                  placeholder="Nhập lời thoại tương tác của tác tử..."
                />
              </div>

              {/* Điều kiện kích hoạt */}
              {focusedScenario.trigger_condition && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wide">
                    Điều kiện kích hoạt sư phạm
                  </label>
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 leading-relaxed">
                    {focusedScenario.trigger_condition}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(activePart.id, focusedScenario.id, false)}
                  className="px-3.5 py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Xoá vĩnh viễn điểm tương tác này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xoá điểm này</span>
                </button>
                <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                  <span>Đã lưu bản thảo tự động</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          BẢNG KỊCH BẢN RỘNG ĐỦ (FULL WIDTH): DANH SÁCH TƯƠNG TÁC SƯ PHẠM
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
                      onClick={() => handleSelectItem(q.id, true, q.timestamp)}
                      className={`group transition-colors cursor-pointer ${isSelected
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
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#7C2D12] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FDBA74]">
                            <AlertCircle className="w-3 h-3 text-[#C2410C]" />
                            <span>Cảnh báo nhịp độ (&lt;20s)</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <TutorLamCircleAvatar className="w-7 h-7 shrink-0 ring-1 ring-stone-300 rounded-full" />
                          <div>
                            <div className="font-bold text-xs text-[#121712]">Trợ giảng AI</div>
                            <span className="text-[11px] font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                              Câu hỏi dừng
                            </span>
                          </div>
                        </div>
                      </td>

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
                          className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center transition cursor-pointer border ${q.is_active
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
                            onClick={() => handleSelectItem(q.id, true, q.timestamp)}
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
                      onClick={() => handleSelectItem(s.id, false, s.timestamp)}
                      className={`group transition-colors cursor-pointer ${isSelected
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
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#7C2D12] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FDBA74]">
                            <AlertCircle className="w-3 h-3 text-[#C2410C]" />
                            <span>Cảnh báo nhịp độ (&lt;20s)</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <AgentAvatarBadge agentName={s.agent} size="w-7 h-7" />
                          <div>
                            <div className="font-bold text-xs text-[#121712]">{s.agent}</div>
                            <span className="text-[11px] font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                              Kịch bản thoại
                            </span>
                          </div>
                        </div>
                      </td>

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
                          className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center transition cursor-pointer border ${s.is_active
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
                            onClick={() => handleSelectItem(s.id, false, s.timestamp)}
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
          MODAL XÁC NHẬN PHÊ DUYỆT & ĐƯA VÀO LỚP HỌC (LIME SOFT CHUẨN)
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
                  Phê duyệt giáo án & Đưa vào lớp học
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
              <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#FDBA74] text-[#7C2D12] text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
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
                <span>Xác nhận duyệt & Đưa vào lớp học</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
