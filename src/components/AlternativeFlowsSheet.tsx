// File: src/components/AlternativeFlowsSheet.tsx
import React, { useState } from 'react';
import { LearningMode, SilentLearningRecord } from '../types/dre';
import { 
  RubberStampSuccess,
  SparkleIcon,
  CheckCircleIcon,
  ChartSticker,
  SwordsDebateIcon,
  GoldenStarIcon,
  BrainIcon,
  TeacherHatIcon,
  ChalkboardIcon,
  LightningZapIcon
} from './HandmadeArtwork';
import { AgentAvatar } from './AgentAvatar';
import { Vec, MathView, SegmentVectorDiagram, BoxVectorDiagram } from './MathVector';
import { sound } from '../utils/soundEffects';
import { RotateCcw } from 'lucide-react';
import { DEMO_TEACHER_SUMMARY, DEMO_LESSON_INFO, BLOOM_TAXONOMY } from '../demo/demoLesson';

const StepBadge = ({ num }: { num: string | number }) => (
  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#121712] text-[#C8F169] font-mono text-[11px] font-bold shrink-0">
    {num}
  </span>
);

// =========================================================================
// DỮ LIỆU MẪU - Đọc trực tiếp từ fixture chuẩn duy nhất src/demo/demoLesson.ts
// =========================================================================
export const MOCK_TEACHER_SUMMARY = DEMO_TEACHER_SUMMARY;

interface AlternativeFlowsSheetProps {
  mode: LearningMode;
  onSwitchMode: (mode: LearningMode) => void;
  onPoeTopicChange?: (topic: string) => void;
  onPoeCompletedChange?: (completed: boolean) => void;
  learningRecords?: SilentLearningRecord[];
}

export const AlternativeFlowsSheet: React.FC<AlternativeFlowsSheetProps> = ({
  mode,
  onSwitchMode,
  onPoeCompletedChange,
  learningRecords = [],
}) => {
  // Trạm 3 (POE): Dự đoán (Predict) -> Quan sát (Observe) -> Giải thích (Explain)
  const [poePrediction, setPoePrediction] = useState<'bo_camp' | 'tri_camp' | null>(null);
  const [poeExplanation, setPoeExplanation] = useState<string>('');
  const [poeCompleted, setPoeCompleted] = useState<boolean>(false);

  // Trạm 4 (Gia sư nhí & Tự ra đề)
  const [selectedTeachStyle, setSelectedTeachStyle] = useState<'khang' | 'chi' | null>(null);
  const [customCreatedEquation, setCustomCreatedEquation] = useState<string>('');
  const [isCouncilHidden, setIsCouncilHidden] = useState<boolean>(false);

  type CreateValidationState = 
    | { status: 'idle' }
    | { status: 'fail_create'; reason: string; enteredEquation: string }
    | { status: 'pass_create'; enteredEquation: string; lhs: string; rhs: string };

  const [createValidationState, setCreateValidationState] = useState<CreateValidationState>({ status: 'idle' });
  const [showFinalBloomReport, setShowFinalBloomReport] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('summary') === '1' || s.get('summary') === 'student' || s.get('summary') === 'teacher') return true;
    }
    return false;
  });
  const [showTeacherAnalytics, setShowTeacherAnalytics] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search);
      if (s.get('summary') === 'teacher' || s.get('view') === 'teacher_summary') return true;
    }
    return false;
  });
  const [hasMoreContent, setHasMoreContent] = useState<boolean>(true);

  const handleModalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setHasMoreContent(scrollTop + clientHeight < scrollHeight - 10);
  };

  const handleValidateCreatedProblem = (e?: React.FormEvent, equationOverride?: string) => {
    if (e) e.preventDefault();
    const rawEq = (equationOverride !== undefined ? equationOverride : customCreatedEquation).trim();

    // Trường hợp 1: Đề thiếu dữ kiện / Không có dấu =
    if (!rawEq.includes('=')) {
      sound.playStampThud();
      setCreateValidationState({
        status: 'fail_create',
        reason: "Biểu thức của bạn chưa có dấu bằng (=) nên chưa tạo thành một đẳng thức vectơ hoàn chỉnh! Bạn bổ sung vế phải nhé",
        enteredEquation: rawEq || "(Chưa nhập)"
      });
      return;
    }

    const parts = rawEq.split('=');
    const lhs = parts[0].trim();
    const rhs = parts.slice(1).join('=').trim();

    if (!lhs || !rhs) {
      sound.playStampThud();
      setCreateValidationState({
        status: 'fail_create',
        reason: "Biểu thức của bạn chưa đủ hai vế trái và phải của đẳng thức! Hãy bổ sung đầy đủ nhé",
        enteredEquation: rawEq
      });
      return;
    }

    const cleanRhs = rhs.replace(/[\s\u20d7\\vec{}]/g, '').replace(/→/g, '');

    // Phát hiện lỗi vế phải
    if (cleanRhs !== "AC'" && cleanRhs !== "0") {
      sound.playStampThud();
      setCreateValidationState({
        status: 'fail_create',
        reason: `Vế phải chứa ký hiệu "${rhs}" chưa chính xác! Vế phải của quy tắc hình hộp xuất phát từ đỉnh A phải là đường chéo chính AC'.`,
        enteredEquation: rawEq
      });
      return;
    }

    // Trường hợp 2: Đề hợp lệ — Đủ hai vế và dấu =
    sound.playSuccessChime();
    setCreateValidationState({
      status: 'pass_create',
      enteredEquation: rawEq,
      lhs,
      rhs
    });
  };

  // =========================================================================
  // TRẠM 3: POE (BỐ CỤC 2 CỘT CÂN ĐỐI, CÓ HÌNH VẼ ĐOẠN THẲNG VECTƠ TRỰC QUAN)
  // =========================================================================
  if (mode === 'predict_poe') {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* CỘT TRÁI: ĐỀ BÀI + HÌNH VẼ ĐOẠN THẲNG VECTƠ + CHÚ GIẢI SƯ PHẠM */}
          <div className="p-5 sm:p-6 bg-white border border-[#E2EAD2] rounded-3xl shadow-xs space-y-4">
            <div>
              <span className="inline-block text-xs font-bold text-[#121712] bg-[#F3F8E8] border border-[#E2EAD2] px-3 py-1 rounded-full">
                Trạm 3 · Thử thách dự đoán – Quan sát – Giải thích (POE)
              </span>
            </div>

            <h2 className="font-bold text-sm sm:text-base text-[#121712] leading-snug">
              Ví dụ 8 (Phút 1:30:30): Cho điểm I thuộc đoạn thẳng AG sao cho độ dài IA = 3 · IG. Hãy biểu diễn vectơ <Vec role="target">IA</Vec> theo vectơ <Vec role="reference">IG</Vec>:
            </h2>

            {/* HÌNH VẼ MINH HỌA TRỰC QUAN ĐOẠN THẲNG VECTƠ A - I - G */}
            <SegmentVectorDiagram showVectorArrows={poePrediction !== null} className="animate-in fade-in duration-150" />

            {/* Thẻ ghi chú sư phạm bổ trợ cân đối cột trái */}
            <div className="p-4 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] space-y-2 text-xs text-[#121712]">
              <div className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#121712]" />
                <span>Gợi ý phương pháp từ Cô Lam:</span>
              </div>
              <p className="leading-relaxed text-stone-700">
                Khi chuyển từ hệ thức độ dài đoạn thẳng sang hệ thức vectơ, ta phải xác định cả hai yếu tố:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-stone-700">
                <li><strong>Độ dài tỉ lệ:</strong> Tỉ số độ dài giữa hai đoạn thẳng xác định độ lớn của hệ số.</li>
                <li><strong>Hướng vectơ:</strong> Điểm I nằm giữa A và G, do đó vectơ <Vec role="target">IA</Vec> và vectơ <Vec role="reference">IG</Vec> có hướng như thế nào?</li>
              </ul>
            </div>
          </div>

          {/* CỘT PHẢI: GOM BƯỚC 1, 2, 3 VÀO 1 THẺ DỌC THỐNG NHẤT */}
          <div className="p-5 sm:p-6 bg-white border border-[#E2EAD2] rounded-3xl shadow-xs space-y-5">
            {/* BƯỚC 1: DỰ ĐOÁN (PREDICT) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#121712]">
                <StepBadge num={1} />
                <span>Bước 1 · Dự đoán: Khi chuyển sang vectơ, bạn chọn phe ai?</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phe Bo */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setPoePrediction('bo_camp');
                  }}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                    poePrediction === 'bo_camp'
                      ? 'bg-[#121712] text-white border-[#121712] shadow-xs ring-1 ring-[#121712]'
                      : 'bg-white hover:bg-stone-50 border-[#E2EAD2] shadow-2xs text-[#121712]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AgentAvatar role="bo" size={28} tooltip />
                      <span className={`font-bold text-xs leading-tight ${poePrediction === 'bo_camp' ? 'text-white' : 'text-[#121712]'}`}>
                        Phe Bo: IA = 3·IG
                      </span>
                    </div>
                    {poePrediction === 'bo_camp' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C8F169] text-[#121712] text-[10px] font-bold">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed italic ${poePrediction === 'bo_camp' ? 'text-stone-300' : 'text-stone-600'}`}>
                    "Đoạn IA gấp 3 lần IG thì gắn mũi tên vectơ vào vẫn là IA = 3·IG thôi!"
                  </p>
                </button>

                {/* Phe Trí */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setPoePrediction('tri_camp');
                  }}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                    poePrediction === 'tri_camp'
                      ? 'bg-[#121712] text-white border-[#121712] shadow-xs ring-1 ring-[#121712]'
                      : 'bg-white hover:bg-stone-50 border-[#E2EAD2] shadow-2xs text-[#121712]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AgentAvatar role="tri" size={28} tooltip />
                      <span className={`font-bold text-xs leading-tight ${poePrediction === 'tri_camp' ? 'text-white' : 'text-[#121712]'}`}>
                        Phe Trí: IA = −3·IG
                      </span>
                    </div>
                    {poePrediction === 'tri_camp' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C8F169] text-[#121712] text-[10px] font-bold">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed italic ${poePrediction === 'tri_camp' ? 'text-stone-300' : 'text-stone-600'}`}>
                    "Vì I nằm giữa A và G nên hai vectơ IA và IG ngược hướng, bắt buộc có dấu trừ!"
                  </p>
                </button>
              </div>
            </div>

            {/* BƯỚC 2: QUAN SÁT (OBSERVE) */}
            {poePrediction === null ? (
              <div className="p-3.5 rounded-2xl bg-[#F3F8E8]/40 border border-dashed border-[#E2EAD2] flex items-center gap-2.5 text-stone-400 text-xs font-semibold">
                <StepBadge num={2} />
                <span>Bước 2 · Quan sát (Mở khóa sau khi chọn phe ở Bước 1)</span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-[#121712]">
                  <AgentAvatar role="minhkhang" size={24} tooltip />
                  <StepBadge num={2} />
                  <span>Bước 2 · Quan sát — Thực nghiệm kiểm chứng của Minh Khang:</span>
                </div>
                <p className="text-xs text-[#121712] leading-snug">
                  Thay thử vào đẳng thức trọng tâm tứ diện IA + 3·IG = 0 (ở phút 1:30:10):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-[#121712] space-y-1">
                    <div className="font-bold text-rose-700">Nếu IA = +3·IG (Phe Bo):</div>
                    <div className="text-xs text-stone-600 font-mono">3·IG + 3·IG = 6·IG ≠ 0 (Sai!)</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-[#C8F169] text-[#121712] space-y-1">
                    <div className="font-bold text-emerald-800">Nếu IA = −3·IG (Phe Trí):</div>
                    <div className="text-xs text-stone-600 font-mono">(-3·IG) + 3·IG = 0 (Chuẩn xác!)</div>
                  </div>
                </div>
              </div>
            )}

            {/* BƯỚC 3: GIẢI THÍCH (EXPLAIN) */}
            {poePrediction === null ? (
              <div className="p-3.5 rounded-2xl bg-[#F3F8E8]/40 border border-dashed border-[#E2EAD2] flex items-center gap-2.5 text-stone-400 text-xs font-semibold">
                <StepBadge num={3} />
                <span>Bước 3 · Giải thích nguyên lý (Mở khóa sau khi thực hiện Dự đoán)</span>
              </div>
            ) : (
              <div className="space-y-3 pt-1 border-t border-[#E2EAD2] animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <AgentAvatar role="linhchi" size={24} tooltip />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-[#121712] flex items-center gap-1.5">
                      <StepBadge num={3} />
                      <span>Bước 3 · Giải thích: Giải thích nguyên lý</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Cùng Linh Chi & Trí chốt lại quy tắc nhân vectơ với một số
                    </p>
                  </div>
                </div>

                {/* Sổ tay Linh Chi */}
                <div className="p-3 rounded-xl bg-[#F3F8E8] border border-[#E2EAD2] text-xs text-[#121712] leading-relaxed space-y-1">
                  <span className="font-bold text-[#121712] block">Sổ tay Linh Chi (Phút 1:06:30):</span>
                  <p>
                    Với <MathView tex="\vec{a} = k\vec{b}" />: Độ dài tỉ lệ theo |k|, còn dấu của k dương khi cùng hướng và <strong>âm khi ngược hướng!</strong>
                  </p>
                </div>

                {/* Câu hỏi và lựa chọn */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#121712] leading-snug">
                    Vì sao từ độ dài IA = 3·IG khi viết dưới dạng vectơ lại là IA = −3·IG?
                  </label>

                  <div className="space-y-1.5">
                    {[
                      'Vì I nằm giữa A và G nên hai vectơ IA và IG ngược hướng nhau, hệ số tỉ lệ phải mang dấu âm (k = −3).',
                      'Độ dài IA gấp 3 lần IG nhưng mũi tên từ I tới A ngược chiều với mũi tên từ I tới G.'
                    ].map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          sound.playPencilTap();
                          setPoeExplanation(sample);
                        }}
                        className="w-full p-2.5 bg-white hover:bg-stone-50 border border-[#E2EAD2] rounded-xl text-[#121712] text-left cursor-pointer transition-colors text-xs leading-relaxed shadow-2xs font-medium"
                      >
                        Chọn nhanh: "{sample}"
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={poeExplanation}
                    onChange={(e) => setPoeExplanation(e.target.value)}
                    rows={2}
                    placeholder="Nhập hoặc chọn lập luận ở trên..."
                    className="w-full p-2.5 bg-white border border-[#E2EAD2] rounded-xl text-xs text-[#121712] outline-none focus:border-[#121712]"
                  />

                  <button
                    type="button"
                    disabled={!poeExplanation.trim()}
                    onClick={() => {
                      sound.playSuccessChime();
                      setPoeCompleted(true);
                      onPoeCompletedChange?.(true);
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                      poeExplanation.trim()
                        ? 'bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] border border-[#A6D83B] cursor-pointer shadow-md'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-200'
                    }`}
                  >
                    <span>Chốt kết luận cùng Trí & Minh Khang</span>
                    <span>➔</span>
                  </button>

                  {poeCompleted && (
                    <div className="p-3.5 rounded-xl bg-[#F3F8E8] border border-[#E2EAD2] text-[#121712] text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in duration-150 shadow-xs">
                      <span className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4 text-[#121712] shrink-0" />
                        <span>Đã chốt nguyên lý POE thành công! (Bậc 5: Đánh giá &amp; Phản biện)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTabSwitch();
                          onSwitchMode('protege_teaching');
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-[#121712] hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Tiến lên Trạm 4: Dạy kèm Bo & Tự ra đề ➔</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRẠM 4: GIA SƯ NHÍ & TỰ RA ĐỀ (HỘI ĐỒNG 5 TÁC NHÂN, PROTÉGÉ & DUAL-VIEW)
  // =========================================================================
  return (
    <div className="w-full space-y-4">
      {/* HỘI ĐỒNG THẨM ĐỊNH (TINH GỌN, CHUẨN LIME SOFT, KHÔNG CHIP BLOOM / NÚT X THỪA) */}
      <div className="bg-[#F3F8E8] border border-[#E2EAD2] rounded-2xl px-4 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <SwordsDebateIcon className="w-4 h-4 text-[#121712] shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wide text-[#121712]">
              Hội đồng thẩm định:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Cô Lam */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#E2EAD2] text-xs shadow-2xs cursor-default"
              title="Cô Lam: Cố vấn Socratic & Tổng kết"
            >
              <AgentAvatar role="colam" size={24} tooltip />
              <span className="font-bold text-[#121712] text-xs">Cô Lam</span>
              <span className="hidden sm:inline text-stone-500 font-normal">(Cố vấn)</span>
            </div>

            {/* 2. Bo */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border text-xs shadow-2xs cursor-default ${
                selectedTeachStyle ? 'border-[#121712] bg-[#121712] text-white ring-1 ring-[#121712]' : 'border-[#E2EAD2] text-[#121712]'
              }`}
              title="Bo: Học sinh tiếp thu & Biến đổi"
            >
              <AgentAvatar role="bo" size={24} tooltip />
              <span className={`font-bold text-xs ${selectedTeachStyle ? 'text-white' : 'text-[#121712]'}`}>Bo</span>
              <span className={`hidden sm:inline font-normal ${selectedTeachStyle ? 'text-stone-300' : 'text-stone-500'}`}>(Học sinh)</span>
            </div>

            {/* 3. Linh Chi */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border text-xs shadow-2xs cursor-default ${
                createValidationState.status !== 'idle' ? 'border-[#121712] bg-[#121712] text-white ring-1 ring-[#121712]' : 'border-[#E2EAD2] text-[#121712]'
              }`}
              title="Linh Chi: Thư ký thẩm định cấu trúc"
            >
              <AgentAvatar role="linhchi" size={24} tooltip />
              <span className={`font-bold text-xs ${createValidationState.status !== 'idle' ? 'text-white' : 'text-[#121712]'}`}>Linh Chi</span>
              <span className={`hidden sm:inline font-normal ${createValidationState.status !== 'idle' ? 'text-stone-300' : 'text-stone-500'}`}>(Cấu trúc)</span>
            </div>

            {/* 4. Minh Khang */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border text-xs shadow-2xs cursor-default ${
                selectedTeachStyle === 'khang' ? 'border-[#121712] bg-[#121712] text-white ring-1 ring-[#121712]' : 'border-[#E2EAD2] text-[#121712]'
              }`}
              title="Minh Khang: Khẩu quyết trực quan thực tế"
            >
              <AgentAvatar role="minhkhang" size={24} tooltip />
              <span className={`font-bold text-xs ${selectedTeachStyle === 'khang' ? 'text-white' : 'text-[#121712]'}`}>Minh Khang</span>
              <span className={`hidden sm:inline font-normal ${selectedTeachStyle === 'khang' ? 'text-stone-300' : 'text-stone-500'}`}>(Trực quan)</span>
            </div>

            {/* 5. Trí */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border text-xs shadow-2xs cursor-default ${
                createValidationState.status === 'pass_create' ? 'border-[#121712] bg-[#121712] text-white ring-1 ring-[#121712]' : 'border-[#E2EAD2] text-[#121712]'
              }`}
              title="Trí: Deep Thinker kiểm chứng vế phải"
            >
              <AgentAvatar role="tri" size={24} tooltip />
              <span className={`font-bold text-xs ${createValidationState.status === 'pass_create' ? 'text-white' : 'text-[#121712]'}`}>Trí</span>
              <span className={`hidden sm:inline font-normal ${createValidationState.status === 'pass_create' ? 'text-stone-300' : 'text-stone-500'}`}>(Kiểm chứng)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white text-[#121712] text-xs font-bold border border-[#E2EAD2]">
            5 tác nhân sẵn sàng thẩm định
          </span>
        </div>
      </div>

      {/* THẺ ĐEN BLOOM LEVEL: CHỈ SỐ LỚN & RÕ RÀNG */}
      <div className="bg-[#121712] text-white p-3 sm:p-3.5 rounded-2xl border border-[#121712] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C8F169] text-[#121712] flex items-center justify-center font-extrabold text-lg shrink-0 shadow-xs">
            B6
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#C8F169] font-bold">
              Cấp độ nhận thức hiện tại
            </div>
            <div className="font-extrabold text-sm sm:text-base text-white">
              Bậc 5 (Đánh giá &amp; Phản biện) ➔ Bậc 6 (Sáng tạo đề toán mới)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-stone-300 block">Tiến độ Trạm 4</span>
            <span className="text-xs font-bold text-[#C8F169]">2/2 Thử thách</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/20">
            Lớp học sẵn sàng
          </span>
        </div>
      </div>

      {/* HAI CỘT NHIỆM VỤ CỐT LÕI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* =========================================================================
            CỘT TRÁI: NHIỆM VỤ 1 (HIỆU ỨNG PROTÉGÉ — ĐÚC KẾT BÍ KÍP GIẢNG BÀI CHO BO)
        ========================================================================= */}
        <div className="p-4 sm:p-5 bg-white border border-[#E2EAD2] rounded-2xl shadow-xs space-y-3">
          <div className="border-b border-[#E2EAD2] pb-2">
            <div className="flex items-center justify-between">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#121712] bg-[#F3F8E8] px-2 py-0.5 rounded-md border border-[#E2EAD2]">
                Nhiệm vụ 1 · Hiệu ứng Protégé
              </span>
              <span className="text-xs font-semibold text-stone-500">Bậc 5: Đánh giá</span>
            </div>
            <h2 className="font-bold text-sm sm:text-base text-[#121712] leading-snug pt-0.5">
              Giúp Bo đúc kết bí kíp cộng &amp; trừ vectơ không gian
            </h2>
          </div>

          {/* Lời nhờ của Bo */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F3F8E8] border border-[#E2EAD2]">
            <AgentAvatar role="bo" size={28} tooltip />
            <div className="text-xs text-[#121712] leading-relaxed">
              <span className="font-bold text-[#121712] block mb-0.5">Bo nhờ bạn chỉ giáo:</span>
              "Bạn chọn giúp mình 1 bí kíp dễ nhớ nhất của <strong>Minh Khang</strong> hoặc <strong>Linh Chi</strong> để đi thi không bao giờ bị nhầm quy tắc nối tiếp và quy tắc trừ nhé!"
            </div>
          </div>

          {/* 2 thẻ phong cách: Minh Khang vs Linh Chi */}
          <div className="space-y-2">
            {/* Cách 1: Minh Khang */}
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('khang');
              }}
              className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                selectedTeachStyle === 'khang'
                  ? 'bg-[#121712] text-white border-[#121712] shadow-xs ring-1 ring-[#121712]'
                  : 'bg-white hover:bg-stone-50 border-[#E2EAD2] shadow-2xs text-[#121712]'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <AgentAvatar role="minhkhang" size={24} tooltip />
                  <span className={`font-bold text-xs sm:text-sm ${
                    selectedTeachStyle === 'khang' ? 'text-white' : 'text-[#121712]'
                  }`}>
                    Cách 1: Khẩu quyết Minh Khang
                  </span>
                </div>
                {selectedTeachStyle === 'khang' && (
                  <span className="text-xs font-bold text-[#121712] bg-[#C8F169] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-in fade-in">
                    <CheckCircleIcon className="w-3 h-3 text-[#121712]" />
                    <span>Đang chọn</span>
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed pl-8 ${selectedTeachStyle === 'khang' ? 'text-stone-300' : 'text-stone-600'}`}>
                “Cộng là nối đuôi đi tiếp: <span className="font-semibold text-inherit">OA + AB = OB</span>. Trừ chung gốc O là lộn ngược điểm sau lên trước: <span className="font-semibold text-inherit">OA − OB = BA</span>. Khi tính độ dài tổng hai vectơ, tuyệt đối cấm tách 1 + 1 = 2!”
              </p>
            </button>

            {/* Cách 2: Linh Chi */}
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('chi');
              }}
              className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                selectedTeachStyle === 'chi'
                  ? 'bg-[#121712] text-white border-[#121712] shadow-xs ring-1 ring-[#121712]'
                  : 'bg-white hover:bg-stone-50 border-[#E2EAD2] shadow-2xs text-[#121712]'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <AgentAvatar role="linhchi" size={24} tooltip />
                  <span className={`font-bold text-xs sm:text-sm ${
                    selectedTeachStyle === 'chi' ? 'text-white' : 'text-[#121712]'
                  }`}>
                    Cách 2: Quy tắc thế Linh Chi
                  </span>
                </div>
                {selectedTeachStyle === 'chi' && (
                  <span className="text-xs font-bold text-[#121712] bg-[#C8F169] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-in fade-in">
                    <CheckCircleIcon className="w-3 h-3 text-[#121712]" />
                    <span>Đang chọn</span>
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed pl-8 ${selectedTeachStyle === 'chi' ? 'text-stone-300' : 'text-stone-600'}`}>
                “Khi tính |<Vec>BC</Vec> + <Vec>DD'</Vec>|, cấm tách thành 1 + 1 = 2! Phải thế <Vec>DD'</Vec> = <Vec>CC'</Vec> để gom về 1 vectơ duy nhất |<Vec>BC'</Vec>| = √2.”
              </p>
            </button>
          </div>

          {/* Bo tiếp thu */}
          {selectedTeachStyle && (
            <div className="p-3 rounded-xl bg-[#F3F8E8] border border-[#E2EAD2] space-y-2 animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <AgentAvatar role="bo" size={32} tooltip />
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold block text-xs mb-0.5 text-[#121712]">
                      {selectedTeachStyle === 'khang' ? 'Bo tiếp thu bí kíp của Minh Khang:' : 'Bo tiếp thu bí kíp của Linh Chi:'}
                    </span>
                    <p className="text-stone-700">
                      {selectedTeachStyle === 'khang'
                        ? '“Hiểu rồi! Cộng là nối đuôi nhau đi tiếp, còn trừ chung gốc O thì lộn ngược điểm sau lên trước! Cảm ơn gia sư nhé!”'
                        : '“Nhớ như in rồi! Phải thế vectơ bằng nhau rồi mới gom lại, tuyệt đối cấm tách 1 + 1 = 2! Cảm ơn bạn!”'}
                    </p>
                  </div>
                </div>
                <RubberStampSuccess className="scale-75 shrink-0" />
              </div>
              <div className="pt-2 border-t border-[#E2EAD2] flex items-center justify-between text-xs text-[#121712]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hoàn thành vai trò Gia sư nhí (Hiệu ứng Protégé).</span>
                </span>
                <span className="px-2.5 py-0.5 bg-[#121712] text-[#C8F169] rounded-md font-mono font-bold text-xs">
                  BẬC 5: ĐÃ ĐẠT
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            CỘT PHẢI: NHIỆM VỤ 2 (CẤP ĐỘ BLOOM CREATE: TỰ THIẾT KẾ ĐỀ TOÁN THÁCH ĐẤU)
        ========================================================================= */}
        <div className="p-4 sm:p-5 bg-white border border-[#E2EAD2] rounded-2xl shadow-xs space-y-2.5">
          <div className="border-b border-[#E2EAD2] pb-2 flex items-center justify-between">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#121712] bg-[#F3F8E8] px-2 py-0.5 rounded-md border border-[#E2EAD2]">
                Nhiệm vụ 2 · Cấp độ Sáng tạo
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[#121712] leading-snug pt-0.5">
                Tự thiết kế đề toán thách đấu nhóm bạn
              </h3>
            </div>
            <span className="text-xs font-bold text-[#121712] bg-[#F3F8E8] border border-[#E2EAD2] px-2 py-0.5 rounded-md">
              Bậc 6: Sáng tạo
            </span>
          </div>

          {/* HÌNH MINH HỌA QUY TẮC HÌNH HỘP TRỰC QUAN */}
          <BoxVectorDiagram className="animate-in fade-in duration-150" />

          {/* HƯỚNG DẪN TỰ THIẾT KẾ ĐẲNG THỨC */}
          <div className="flex items-center justify-between text-xs text-stone-600 bg-[#F3F8E8] p-2.5 rounded-xl border border-[#E2EAD2]">
            <span>Dùng các vectơ cạnh và đường chéo để tự tạo một đẳng thức hoàn chỉnh:</span>
            <span className="text-xs text-stone-500 font-medium">Bấm các nút bên dưới để ghép</span>
          </div>

          {/* FORM NHẬP ĐẲNG THỨC (PHÔNG CHỮ CHUẨN, KHÔNG MONO) */}
          <form onSubmit={(e) => handleValidateCreatedProblem(e)} className="space-y-2.5">
            <input
              type="text"
              value={customCreatedEquation}
              onChange={(e) => setCustomCreatedEquation(e.target.value)}
              placeholder="Nhập đẳng thức thách đấu (ví dụ: AB + AD + AA' = ...)"
              className="w-full px-4 py-2.5 bg-white border border-[#E2EAD2] rounded-xl font-sans text-xs sm:text-sm text-[#121712] outline-none focus:border-[#121712] shadow-2xs"
            />

            {/* Dải nút hỗ trợ nhập liệu nhanh */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-xs text-stone-500 font-medium">Chọn nhanh:</span>
              {['AB', 'AD', "AA'", "AC'"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setCustomCreatedEquation((prev) => {
                      const trimmed = prev.trim();
                      if (!trimmed) return v;
                      if (trimmed.endsWith('+') || trimmed.endsWith('=')) return `${prev} ${v}`;
                      return `${prev} + ${v}`;
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#F3F8E8] hover:bg-[#E2EAD2] border border-[#E2EAD2] text-[#121712] text-xs font-semibold cursor-pointer"
                >
                  <Vec>{v}</Vec>
                </button>
              ))}
              {[' + ', ' = '].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setCustomCreatedEquation((prev) => prev.trim() + op)}
                  className="px-2.5 py-1 rounded-lg bg-[#F3F8E8] hover:bg-[#E2EAD2] border border-[#E2EAD2] text-[#121712] text-xs font-bold cursor-pointer"
                >
                  {op.trim()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomCreatedEquation("AB + AD + AA' = AC'")}
                className="ml-auto px-3 py-1 rounded-lg bg-[#F3F8E8] hover:bg-[#E2EAD2] border border-[#E2EAD2] text-[#121712] text-xs font-semibold cursor-pointer"
              >
                Mẫu chuẩn
              </button>
            </div>

            {/* NÚT THÁCH ĐẤU: NÚT PHỤ VIỀN NỔI BẬT (SECONDARY OUTLINED) */}
            <button
              type="submit"
              className="w-full py-2.5 border-2 border-[#121712] hover:bg-stone-50 text-[#121712] font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors shadow-2xs bg-white flex items-center justify-center gap-2"
            >
              <span>Gửi đề thách đấu cả lớp</span>
              <span>➔</span>
            </button>
          </form>

          {/* TRƯỜNG HỢP 1: FAIL CREATE */}
          {createValidationState.status === 'fail_create' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-2.5 animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AgentAvatar role="linhchi" size={28} tooltip />
                <div className="text-xs text-rose-950 leading-relaxed">
                  <span className="font-bold text-rose-900 block text-xs mb-0.5">
                    Linh Chi nhắc cấu trúc đề:
                  </span>
                  <p className="bg-white/90 p-2.5 rounded-xl border border-rose-200 text-xs">
                    “{createValidationState.reason}”
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  const fixed = `${customCreatedEquation.trim()} = AC'`;
                  setCustomCreatedEquation(fixed);
                  handleValidateCreatedProblem(undefined, fixed);
                }}
                className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Bổ sung nhanh "= AC'" để tạo đẳng thức hoàn chỉnh ➔
              </button>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: PASS CREATE */}
          {createValidationState.status === 'pass_create' && (
            <div className="p-4 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] space-y-3 animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E2EAD2] pb-2">
                <span className="font-bold text-xs text-[#121712] flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-[#121712]" />
                  <span>Đề hợp lệ: Đủ hai vế và dấu =</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#121712] text-[#C8F169] font-mono text-xs font-bold">
                  BẬC 6: SÁNG TẠO ĐẠT CHUẨN
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Bước 1: Linh Chi */}
                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#E2EAD2]">
                  <AgentAvatar role="linhchi" size={24} tooltip />
                  <p className="text-[#121712]">
                    <strong className="text-stone-900">Linh Chi:</strong> “Đẳng thức có đầy đủ vế trái <span className="font-bold">{createValidationState.lhs}</span>, dấu = và vế phải <span className="font-bold">{createValidationState.rhs}</span>. Cấu trúc chuẩn xác!”
                  </p>
                </div>

                {/* Bước 2: Bo */}
                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#E2EAD2]">
                  <AgentAvatar role="bo" size={24} tooltip />
                  <p className="text-[#121712]">
                    <strong className="text-stone-900">Bo:</strong> “Áp dụng quy tắc hình bình hành đáy ABCD: <span className="font-bold">AB + AD = AC</span>. Rút gọn thành <span className="font-bold">AC + AA'</span>...”
                  </p>
                </div>

                {/* Bước 3: Trí */}
                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#E2EAD2]">
                  <AgentAvatar role="tri" size={24} tooltip />
                  <p className="text-[#121712]">
                    <strong className="text-stone-900">Trí:</strong> “Trong mặt phẳng chéo ACC'A', <span className="font-bold">AC + AA' = AC'</span>. Trùng khớp hoàn hảo với vế phải!”
                  </p>
                </div>

                {/* Cô Lam & Hội đồng */}
                <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-[#E2EAD2]">
                  <div className="flex items-center gap-2">
                    <AgentAvatar role="colam" size={24} tooltip />
                    <span className="text-xs text-[#121712] font-bold">
                      Cô Lam &amp; Hội đồng: Chúc mừng bạn đã hoàn thành xuất sắc cấp độ Sáng tạo!
                    </span>
                  </div>
                  <RubberStampSuccess className="scale-75 shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* DUY NHẤT 1 NÚT CHÍNH XANH CHANH: XEM TỔNG KẾT HÀNH TRÌNH */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playSuccessChime();
                setShowFinalBloomReport(true);
              }}
              className="w-full py-3.5 bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] font-extrabold text-sm rounded-2xl cursor-pointer transition-all shadow-sm border border-[#A6D83B] flex items-center justify-center gap-2"
            >
              <SparkleIcon className="w-4 h-4 text-[#121712]" />
              <span>Xem tổng kết hành trình</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DUAL-VIEW: GÓC NHÌN HỌC SINH (GROWTH) & GÓC NHÌN GIẢNG VIÊN (ANALYTICS)
          CHUẨN HÓA LIME SOFT 6 BẬC, HEADER & FOOTER CỐ ĐỊNH, THÂN CUỘN
      ========================================================================= */}
      {showFinalBloomReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-5xl bg-white border border-[#E2EAD2] rounded-3xl sm:rounded-[32px] shadow-[0_24px_60px_rgba(18,23,18,0.18)] flex flex-col max-h-[88vh] overflow-hidden font-['Be_Vietnam_Pro',system-ui,sans-serif] text-[#121712]">
            
            {/* 1. HEADER CỐ ĐỊNH (SHRINK-0) */}
            <div className="shrink-0 px-5 py-3 sm:px-7 sm:py-3.5 border-b border-[#E2EAD2] flex flex-wrap items-center justify-between gap-3 sm:gap-6 bg-white z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <AgentAvatar role="colam" size={40} tooltip />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold tracking-wider text-[#4A5540] bg-[#F3F8E8] rounded-full px-3 py-0.5 self-start inline-block border border-[#E2EAD2]">
                    {DEMO_LESSON_INFO.fullTopicChip}
                  </span>
                  <h1
                    id="modal-summary-title"
                    style={{ fontSize: '30px', lineHeight: 1.15 }}
                    className="font-extrabold text-[#121712] m-0"
                  >
                    {showTeacherAnalytics ? 'Bảng thống kê sư phạm' : 'Hành trình trưởng thành'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <div role="group" aria-label="Chọn góc nhìn" className="flex items-center bg-[#EAF1D8] rounded-full p-1 border border-[#E2EAD2]">
                  <button
                    type="button"
                    onClick={() => setShowTeacherAnalytics(false)}
                    aria-pressed={!showTeacherAnalytics}
                    className={`border-0 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold min-h-[38px] sm:min-h-[42px] cursor-pointer transition-all ${
                      !showTeacherAnalytics ? 'bg-[#121712] text-white shadow-xs' : 'bg-transparent text-[#121712] hover:text-black font-semibold'
                    }`}
                  >
                    Học sinh
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTeacherAnalytics(true)}
                    aria-pressed={showTeacherAnalytics}
                    className={`border-0 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold min-h-[38px] sm:min-h-[42px] cursor-pointer transition-all ${
                      showTeacherAnalytics ? 'bg-[#121712] text-white shadow-xs' : 'bg-transparent text-[#121712] hover:text-black font-semibold'
                    }`}
                  >
                    Giáo viên
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFinalBloomReport(false)}
                  aria-label="Đóng"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#E2EAD2] bg-white flex items-center justify-center hover:bg-stone-50 cursor-pointer transition-colors shrink-0"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#121712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 2. THÂN MODAL CUỘN BÊN TRONG (CÓ THANH CUỘN MẢNH VÀ DẤU HIỆU GRADIENT ĐÁY) */}
            <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
              <div 
                onScroll={handleModalScroll}
                className="flex-1 overflow-y-auto scrollbar-thin [scrollbar-width:thin] [scrollbar-color:#E2EAD2_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#E2EAD2] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#C8F169] [&::-webkit-scrollbar-track]:bg-transparent p-3 sm:p-4 lg:p-4 space-y-3"
              >
                {!showTeacherAnalytics ? (
                  /* =========================================================================
                     TAB 1: GÓC NHÌN HỌC SINH (6 BẬC NHẤT QUÁN, L6 GỌN GÀNG, THANG BẬC HIỆN ĐỦ Ở 1280X720)
                  ========================================================================= */
                  <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3 items-stretch animate-in fade-in duration-150">
                    
                    {/* CỘT TRÁI (LEFT COLUMN) */}
                    <div className="flex flex-col gap-3">
                      {/* Hero dark card: Thu gọn chiều cao để vừa khung 1280x720 */}
                      <div className="bg-[#121712] text-white rounded-2xl sm:rounded-[22px] p-3.5 sm:p-4 flex items-stretch justify-between gap-3">
                        <div className="flex flex-col justify-between py-0.5">
                          <span className="text-xs font-semibold tracking-wider text-[#B9C4A8] uppercase">
                            MỨC BLOOM CAO NHẤT
                          </span>
                          <div className="text-[44px] sm:text-[52px] lg:text-[60px] font-extrabold text-[#C8F169] leading-none my-0.5 tracking-tight">
                            L6
                          </div>
                          <div>
                            <div className="text-base sm:text-lg font-bold text-white">Sáng tạo</div>
                            <div className="text-xs text-[#B9C4A8]">Toàn diện cả 4 trạm</div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 justify-center min-w-[130px] sm:min-w-[145px]">
                          <div className="bg-[#1F271F] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 px-3">
                            <div className="text-xl sm:text-2xl font-extrabold text-white leading-tight">4/4</div>
                            <div className="text-xs text-[#B9C4A8]">trạm hoàn thành</div>
                          </div>
                          <div className="bg-[#1F271F] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 px-3">
                            <div className="text-xl sm:text-2xl font-extrabold text-white leading-tight">3</div>
                            <div className="text-xs text-[#B9C4A8]">huy hiệu đạt được</div>
                          </div>
                        </div>
                      </div>

                      {/* Tháp Bloom (6 Cột nhất quán, chiều cao tối ưu để thấy trọn vẹn ở 1280x720) */}
                      <div className="bg-[#F3F8E8] border border-[#E2EAD2] rounded-2xl sm:rounded-[22px] p-3.5 sm:p-4 pb-4 sm:pb-5 flex flex-col gap-2.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="m-0 text-sm sm:text-base font-extrabold text-[#121712]">
                            Tháp Bloom
                          </h2>
                          <span className="text-xs font-bold bg-[#C8F169] text-[#121712] rounded-full px-2.5 py-0.5 border border-[#A6D83B]">
                            Đạt 6/6 bậc
                          </span>
                        </div>

                        <div className="grid grid-cols-6 gap-1 sm:gap-1.5 items-end flex-1 pt-1">
                          {BLOOM_TAXONOMY.map((item, idx) => {
                            const barHeights = [
                              'h-[28px] sm:h-[34px]',
                              'h-[44px] sm:h-[52px]',
                              'h-[60px] sm:h-[70px]',
                              'h-[76px] sm:h-[88px]',
                              'h-[92px] sm:h-[106px]',
                              'h-[108px] sm:h-[124px]',
                            ];
                            const isL6 = item.index === 6;
                            return (
                              <div key={item.index} className="flex flex-col gap-1 justify-end h-full">
                                <div
                                  className={`${barHeights[idx]} rounded-lg p-1 px-1.5 flex items-center justify-between ${
                                    isL6
                                      ? 'bg-[#121712] text-[#C8F169]'
                                      : 'bg-[#C8F169] text-[#121712]'
                                  }`}
                                >
                                  <span className="text-xs font-bold whitespace-nowrap">{item.level}</span>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={isL6 ? '#C8F169' : '#121712'}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M20 6 9 17l-5-5" />
                                  </svg>
                                </div>
                                <div className="text-xs font-bold text-[#121712] mt-0.5">{item.skill}</div>
                                <div
                                  className={`text-[11px] font-semibold leading-tight ${
                                    isL6 ? 'text-[#68765A]' : 'text-[#4A5540]'
                                  }`}
                                >
                                  {item.skillSub}
                                </div>
                                <div className="text-[11px] sm:text-xs leading-snug text-[#3F4A36] pt-0.5 min-h-[30px]">
                                  {item.desc}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* CỘT PHẢI (RIGHT COLUMN) */}
                    <div className="flex flex-col gap-3">
                      {/* Badges card (Huy hiệu đạt được) */}
                      <div className="bg-white border border-[#E2EAD2] rounded-2xl sm:rounded-[22px] p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-2xs">
                        <h2 className="m-0 text-sm sm:text-base font-extrabold text-[#121712]">
                          Huy hiệu đạt được
                        </h2>

                        <div className="flex items-center gap-2.5">
                          <div aria-hidden="true" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C8F169] flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#121712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-[#121712]">Gia sư nhí xuất sắc</span>
                            <span className="text-xs text-[#4A5540]">Trạm 4 · hiệu ứng Protégé</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div aria-hidden="true" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C8F169] flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#121712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-[#121712]">Bẻ gãy ngộ nhận 37:13</span>
                            <span className="text-xs text-[#4A5540]">Trạm 1 · bẫy trực giác</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div aria-hidden="true" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C8F169] flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#121712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 10 12 5 2 10l10 5 10-5z" />
                              <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-[#121712]">Nhà sáng tạo đề toán</span>
                            <span className="text-xs text-[#4A5540]">Trạm 4 · tự ra đề cho cả lớp</span>
                          </div>
                        </div>
                      </div>

                      {/* Messages card (Lời nhắn nhủ từ Cô Lam & Bo) */}
                      <div className="bg-white border border-[#E2EAD2] rounded-2xl sm:rounded-[22px] p-3 sm:p-3.5 flex flex-col gap-2 flex-1 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                          <AgentAvatar role="colam" size={32} tooltip />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm font-bold text-[#121712]">Cô Lam nhắn nhủ</span>
                            <p className="m-0 text-xs sm:text-[13px] leading-relaxed text-[#2B3326]">
                              “Thầy cô rất tự hào về con! Con đã trải qua đủ các nấc thang nhận thức: từ vấp bẫy trực giác tại 37:13, đối chất bẻ gãy ngộ nhận, đến tự tin tự thiết kế đề toán mới cho nhóm bạn!”
                            </p>
                          </div>
                        </div>

                        <div className="h-px bg-[#E2EAD2]" />

                        <div className="flex items-start gap-2.5">
                          <AgentAvatar role="bo" size={32} tooltip />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm font-bold text-[#121712]">Lời cảm ơn từ Bo</span>
                            <p className="m-0 text-xs sm:text-[13px] leading-relaxed text-[#2B3326]">
                              “Cảm ơn bạn gia sư nhí nhiều lắm! Nhờ bạn chỉ giáo khẩu quyết và quy tắc thế mà từ nay mình không bao giờ sợ bị lừa ở các câu hỏi bẫy vectơ nữa!”
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* =========================================================================
                     TAB 2: GÓC NHÌN GIÁO VIÊN (DỮ LIỆU TỪ MOCK_TEACHER_SUMMARY, BẬC 1 DÒNG, THẤY 2 THẺ DƯỚI)
                  ========================================================================= */
                  <div className="space-y-2.5 animate-in fade-in duration-150">
                    {/* HÀNG 3 THẺ SỐ LIỆU */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Thẻ 1: Nhấn nền đen */}
                      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#121712] text-white border border-[#121712] shadow-sm flex flex-col justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#C8F169] block mb-0.5">
                          {MOCK_TEACHER_SUMMARY.card1Title}
                        </span>
                        <div className="text-[28px] sm:text-[32px] font-extrabold text-[#C8F169] leading-none my-0.5">
                          {MOCK_TEACHER_SUMMARY.masteryScore}
                        </div>
                        <span className="text-xs text-stone-300 block">
                          {MOCK_TEACHER_SUMMARY.masteryNote}
                        </span>
                      </div>

                      {/* Thẻ 2: Nền kem #F3F8E8 */}
                      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] text-[#121712] shadow-2xs flex flex-col justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-0.5">
                          {MOCK_TEACHER_SUMMARY.card2Title}
                        </span>
                        <div className="text-[28px] sm:text-[32px] font-extrabold text-[#121712] leading-none my-0.5">
                          {MOCK_TEACHER_SUMMARY.learningTime}
                        </div>
                        <span className="text-xs text-stone-600 block">
                          {MOCK_TEACHER_SUMMARY.learningTimeNote}
                        </span>
                      </div>

                      {/* Thẻ 3: Nền kem #F3F8E8 */}
                      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] text-[#121712] shadow-2xs flex flex-col justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-0.5">
                          {MOCK_TEACHER_SUMMARY.card3Title}
                        </span>
                        <div className="text-[28px] sm:text-[32px] font-extrabold text-[#121712] leading-none my-0.5">
                          {MOCK_TEACHER_SUMMARY.rebuttalRate}
                        </div>
                        <span className="text-xs text-stone-600 block">
                          {MOCK_TEACHER_SUMMARY.rebuttalNote}
                        </span>
                      </div>
                    </div>

                    {/* BẢNG 6 HÀNG: KẾT QUẢ CHẨN ĐOÁN NHẬN THỨC (CỘT BẬC NỚI RỘNG, WHITESPACE-NOWRAP) */}
                    <div className="bg-white border border-[#E2EAD2] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-2">
                      <div className="border-b border-[#E2EAD2] pb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-sm sm:text-base font-extrabold text-[#121712] m-0">
                            {MOCK_TEACHER_SUMMARY.tableTitle}
                          </h2>
                          <span className="text-xs text-stone-500">
                            {MOCK_TEACHER_SUMMARY.studentInfoPrefix}{MOCK_TEACHER_SUMMARY.learnerName} · {MOCK_TEACHER_SUMMARY.className} · {MOCK_TEACHER_SUMMARY.lessonTopic}
                          </span>
                        </div>
                        <span className="text-xs font-bold bg-[#C8F169] text-[#121712] px-2.5 py-0.5 rounded-full border border-[#A6D83B]">
                          {MOCK_TEACHER_SUMMARY.evaluationScope}
                        </span>
                      </div>

                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-[#E2EAD2] text-stone-500 font-semibold text-xs sm:text-sm">
                              <th className="py-1.5 pr-3 w-24 whitespace-nowrap">{MOCK_TEACHER_SUMMARY.colStepTitle}</th>
                              <th className="py-1.5 pr-3 w-28 whitespace-nowrap">{MOCK_TEACHER_SUMMARY.colSkillTitle}</th>
                              <th className="py-1.5 pr-3">{MOCK_TEACHER_SUMMARY.colEvidenceTitle}</th>
                              <th className="py-1.5 text-right w-24 whitespace-nowrap">{MOCK_TEACHER_SUMMARY.colStatusTitle}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2EAD2]/60">
                            {MOCK_TEACHER_SUMMARY.diagnosticRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-[#F3F8E8]/50 transition-colors">
                                <td className="py-2 pr-3 font-bold text-[#121712] whitespace-nowrap">
                                  <span className="px-2.5 py-0.5 rounded-md bg-[#F3F8E8] border border-[#E2EAD2] whitespace-nowrap inline-block text-xs sm:text-sm font-bold leading-normal">
                                    {row.step}
                                  </span>
                                </td>
                                <td className="py-2 pr-3 font-semibold text-[#121712] whitespace-nowrap">
                                  <div className="font-bold text-sm text-[#121712]">{row.skill}</div>
                                  <div className="text-xs text-stone-500 font-normal">{row.skillSub}</div>
                                </td>
                                <td className="py-2 pr-3 text-sm text-stone-700 leading-normal">
                                  {row.evidence}
                                </td>
                                <td className="py-2 text-right whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                                    row.status === 'Xuất sắc' 
                                      ? 'bg-[#121712] text-[#C8F169] border-[#121712]'
                                      : row.status === 'Làm chủ'
                                      ? 'bg-[#C8F169] text-[#121712] border-[#A6D83B]'
                                      : 'bg-[#F3F8E8] text-[#121712] border-[#E2EAD2]'
                                  }`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    <span>{row.status}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2 THẺ SƯ PHẠM: ĐIỂM CẦN CAN THIỆP & GỢI Ý HÀNH ĐỘNG TIẾP THEO (HIỂN THỊ RÕ RÀNG Ở 1920X1080) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {/* Thẻ 1: Điểm cần can thiệp */}
                      <div className="bg-white border border-[#E2EAD2] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#121712] bg-[#F3F8E8] px-2.5 py-0.5 rounded-lg border border-[#E2EAD2] self-start inline-flex">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#121712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{MOCK_TEACHER_SUMMARY.interventionTitle}</span>
                        </div>
                        <ul className="space-y-1 text-sm text-stone-700 leading-normal pl-1 list-disc list-inside">
                          {MOCK_TEACHER_SUMMARY.interventionNotes.map((note, nIdx) => (
                            <li key={nIdx}>{note}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Thẻ 2: Gợi ý hành động tiếp theo */}
                      <div className="bg-[#F3F8E8] border border-[#E2EAD2] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#121712] bg-white px-2.5 py-0.5 rounded-lg border border-[#E2EAD2] self-start inline-flex">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#121712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                          <span>{MOCK_TEACHER_SUMMARY.nextActionTitle}</span>
                        </div>
                        <ul className="space-y-1 text-sm text-stone-700 leading-normal pl-1 list-disc list-inside">
                          {MOCK_TEACHER_SUMMARY.nextActionSuggestions.map((sug, sIdx) => (
                            <li key={sIdx}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dấu hiệu cuộn: Gradient mờ ở đáy khi còn nội dung cuộn bên dưới */}
              <div 
                aria-hidden="true" 
                className={`pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent transition-opacity duration-200 z-10 ${
                  hasMoreContent ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>

            {/* 3. FOOTER CỐ ĐỊNH (SHRINK-0) */}
            <div className="shrink-0 px-5 py-3.5 sm:px-8 sm:py-4 border-t border-[#E2EAD2] bg-white flex flex-wrap items-center justify-between gap-3 z-10">
              {showTeacherAnalytics ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTabSwitch();
                      setShowFinalBloomReport(false);
                      onSwitchMode('video_clash');
                    }}
                    className="px-4 py-2 sm:px-5 sm:h-12 rounded-2xl bg-[#F3F8E8] hover:bg-[#E2EAD2] text-[#121712] text-xs sm:text-sm font-bold cursor-pointer border border-[#E2EAD2] transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-[#121712]" />
                    <span>Bắt đầu chu trình học mới (Trạm 1)</span>
                  </button>

                  <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowFinalBloomReport(false)}
                      className="border border-[#121712] bg-white text-[#121712] rounded-2xl px-5 sm:px-6 h-10 sm:h-12 text-xs sm:text-[15px] font-semibold hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      Đóng báo cáo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTeacherAnalytics(false)}
                      className="border-0 bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] rounded-2xl px-5 sm:px-6 h-10 sm:h-12 text-xs sm:text-[15px] font-extrabold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>Xem góc nhìn học sinh</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#121712" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-end gap-2 sm:gap-3 ml-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowFinalBloomReport(false)}
                    className="border border-[#121712] bg-white text-[#121712] rounded-2xl px-5 sm:px-6 h-10 sm:h-12 text-xs sm:text-[15px] font-semibold hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTeacherAnalytics(true)}
                    className="border-0 bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] rounded-2xl px-5 sm:px-6 h-10 sm:h-12 text-xs sm:text-[15px] font-extrabold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>Xem góc nhìn giáo viên</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#121712" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
