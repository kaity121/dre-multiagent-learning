// File: src/components/AlternativeFlowsSheet.tsx
import React, { useState } from 'react';
import { LearningMode, SilentLearningRecord } from '../types/dre';
import { 
  BoAvatar, 
  BoCircleAvatar,
  TutorLamAvatar,
  TutorLamCircleAvatar,
  TriDeepThinkerAvatar, 
  LinhChiNoteTakerAvatar, 
  MinhKhangInquisitiveAvatar,
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
import { Vec, MathView, SegmentVectorDiagram, BoxVectorDiagram } from './MathVector';
import { sound } from '../utils/soundEffects';

const StepBadge = ({ num }: { num: string | number }) => (
  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#1B4338] text-white font-mono text-[11px] font-bold shrink-0">
    {num}
  </span>
);

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
  const [showFinalBloomReport, setShowFinalBloomReport] = useState<boolean>(false);
  const [showTeacherAnalytics, setShowTeacherAnalytics] = useState<boolean>(false);

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
          {/* CỘT TRÁI: ĐỀ BÀI + HÌNH VẼ ĐOẠN THẲNG VECTƠ + BƯỚC 1 PREDICT + BƯỚC 2 OBSERVE */}
          <div className="space-y-3.5">
            <div>
              <span className="inline-block text-xs font-bold text-amber-900 bg-amber-100/70 border border-amber-200/90 px-3 py-1 rounded-full">
                TRẠM 3 · THỬ THÁCH DỰ ĐOÁN – QUAN SÁT – GIẢI THÍCH (POE)
              </span>
            </div>

            <h2 className="font-bold text-xs sm:text-sm text-stone-900 leading-snug">
              Ví dụ 8 (Phút 1:30:30): Cho điểm I thuộc đoạn thẳng AG sao cho độ dài IA = 3 · IG. Hãy biểu diễn vectơ <Vec role="target">IA</Vec> theo vectơ <Vec role="reference">IG</Vec>:
            </h2>

            {/* HÌNH VẼ MINH HỌA TRỰC QUAN ĐOẠN THẲNG VECTƠ A - I - G */}
            <SegmentVectorDiagram className="animate-in fade-in duration-150" />

            {/* Bước 1: Dự đoán (Predict) */}
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                <StepBadge num={1} />
                <span>BƯỚC 1 (PREDICT): Khi chuyển từ độ dài đoạn thẳng sang vectơ, bạn chọn phe ai?</span>
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
                      ? 'bg-amber-50/70 border-[#E8A33D] border-2 shadow-xs'
                      : 'bg-white hover:bg-stone-50 border-stone-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BoCircleAvatar className="w-7 h-7 shrink-0" />
                    <span className="font-bold text-xs text-amber-900 leading-tight">
                      Phe Bo: IA = 3·IG (Dương +3)
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed italic">
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
                      ? 'bg-blue-50/70 border-blue-600 border-2 shadow-xs'
                      : 'bg-white hover:bg-stone-50 border-stone-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TriDeepThinkerAvatar className="w-7 h-7 shrink-0" />
                    <span className="font-bold text-xs text-blue-900 leading-tight">
                      Phe Trí: IA = −3·IG (Âm −3)
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed italic">
                    "Vì I nằm giữa A và G nên hai vectơ IA và IG ngược hướng, bắt buộc có dấu trừ!"
                  </p>
                </button>
              </div>
            </div>

            {/* Bước 2: Quan sát thực nghiệm kiểm chứng (Observe) */}
            {poePrediction !== null && (
              <div className="p-3 rounded-2xl bg-cyan-50/50 border border-cyan-200/90 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-950">
                  <MinhKhangInquisitiveAvatar className="w-5 h-5 shrink-0" />
                  <StepBadge num={2} />
                  <span>BƯỚC 2 (OBSERVE) — Thực nghiệm kiểm chứng của Minh Khang:</span>
                </div>
                <p className="text-xs text-cyan-900/90 leading-snug">
                  Thay thử vào đẳng thức trọng tâm tứ diện IA + 3·IG = 0 (ở phút 1:30:10):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="p-2 rounded-xl bg-white border border-rose-200 text-rose-700 space-y-0.5">
                    <div className="font-bold text-rose-800">Nếu IA = +3·IG (Phe Bo):</div>
                    <div className="text-[11px]">3·IG + 3·IG = 6·IG ≠ 0 (Sai!)</div>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 space-y-0.5">
                    <div className="font-bold text-emerald-900">Nếu IA = −3·IG (Phe Trí):</div>
                    <div className="text-[11px]">(-3·IG) + 3·IG = 0 (Chuẩn xác!)</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: BƯỚC 3 EXPLAIN */}
          <div>
            {poePrediction === null ? (
              <div className="p-8 rounded-2xl bg-stone-50/70 border border-stone-200/80 text-center flex flex-col items-center justify-center space-y-2.5 min-h-[260px] shadow-2xs">
                <StepBadge num={3} />
                <h3 className="font-bold text-sm sm:text-base text-stone-800 pt-1">
                  Bước 3 (Explain) đang chờ bạn dự đoán
                </h3>
                <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                  Hãy chọn Phe Bo hoặc Phe Trí ở Bước 1 bên trái trước khi mở khóa phần giải thích nguyên lý nhé!
                </p>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <LinhChiNoteTakerAvatar className="w-6 h-6 shrink-0" />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                      <StepBadge num={3} />
                      <span>BƯỚC 3 (EXPLAIN): Giải thích nguyên lý</span>
                    </h3>
                    <p className="text-[10px] text-stone-500">
                      Cùng Linh Chi & Trí chốt lại quy tắc nhân vectơ với một số
                    </p>
                  </div>
                </div>

                {/* Sổ tay Linh Chi */}
                <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-200/80 text-xs text-rose-950 leading-relaxed space-y-1">
                  <span className="font-bold text-rose-900 block">Sổ tay Linh Chi (Phút 1:06:30):</span>
                  <p>
                    Với <MathView tex="\vec{a} = k\vec{b}" />: Độ dài tỉ lệ theo |k|, còn dấu của k dương khi cùng hướng và <strong className="text-rose-900">âm khi ngược hướng!</strong>
                  </p>
                </div>

                {/* Câu hỏi và lựa chọn */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-800 leading-snug">
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
                        className="w-full p-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-left cursor-pointer transition-colors text-xs leading-relaxed shadow-2xs font-medium"
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
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 outline-none focus:border-stone-500"
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
                        ? 'bg-[#1B4338] hover:bg-[#285E4F] text-white cursor-pointer shadow-md'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Chốt kết luận cùng Trí & Minh Khang</span>
                    <span>➔</span>
                  </button>

                  {poeCompleted && (
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
                      <span className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        <span>Đã chốt nguyên lý thành công!</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onSwitchMode('protege_teaching')}
                        className="px-3 py-1 bg-[#0e7490] hover:bg-[#0891b2] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Sang Trạm 4 ➔
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
      {/* =========================================================================
          SPOTLIGHT: HỘI ĐỒNG THẨM ĐỊNH (COMPACT SLIM BAR - TIẾT KIỆM DIỆN TÍCH)
          MỤC TIÊU NHẬN THỨC (BLOOM): EVALUATE -> CREATE
      ========================================================================= */}
      {isCouncilHidden ? (
        <div className="flex items-center justify-between px-3 py-1 bg-stone-100/70 border border-stone-200/80 rounded-lg text-xs">
          <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1.5">
            <SwordsDebateIcon className="w-3.5 h-3.5 text-stone-400" />
            <span>Hội đồng thẩm định đa tác nhân (Đã ẩn để tối ưu diện tích)</span>
          </span>
          <button
            type="button"
            onClick={() => setIsCouncilHidden(false)}
            className="text-[11px] font-bold text-[#1B4338] hover:underline cursor-pointer"
          >
            Hiện lại ➔
          </button>
        </div>
      ) : (
        <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-xl px-3 py-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <SwordsDebateIcon className="w-3.5 h-3.5 text-[#1B4338] shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wide text-[#1B4338]">
                Hội đồng thẩm định:
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* 1. Cô Lam */}
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-stone-200 text-xs shadow-2xs hover:border-[#1B4338] transition-colors cursor-default"
                title="Cô Lam: Cố vấn Socratic & Tổng kết"
              >
                <TutorLamCircleAvatar className="w-5 h-5" />
                <span className="font-bold text-[#1B4338] text-[11px]">Cô Lam</span>
                <span className="hidden xl:inline text-[10px] text-stone-400 font-medium">(Cố vấn)</span>
              </div>

              {/* 2. Bo */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border text-xs shadow-2xs transition-colors cursor-default ${
                  selectedTeachStyle ? 'border-[#E8A33D] bg-amber-50 text-amber-900 ring-1 ring-[#E8A33D]' : 'border-stone-200 text-stone-700'
                }`}
                title="Bo: Học sinh tiếp thu & Biến đổi"
              >
                <BoCircleAvatar className="w-5 h-5" />
                <span className="font-bold text-[11px]">Bo</span>
                <span className="hidden xl:inline text-[10px] text-stone-400 font-medium">(Học sinh)</span>
              </div>

              {/* 3. Linh Chi */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border text-xs shadow-2xs transition-colors cursor-default ${
                  createValidationState.status !== 'idle' ? 'border-pink-400 bg-pink-50 text-pink-900 ring-1 ring-pink-400' : 'border-stone-200 text-stone-700'
                }`}
                title="Linh Chi: Thư ký thẩm định cấu trúc"
              >
                <LinhChiNoteTakerAvatar className="w-5 h-5" />
                <span className="font-bold text-[11px]">Linh Chi</span>
                <span className="hidden xl:inline text-[10px] text-stone-400 font-medium">(Cấu trúc)</span>
              </div>

              {/* 4. Minh Khang */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border text-xs shadow-2xs transition-colors cursor-default ${
                  selectedTeachStyle === 'khang' ? 'border-sky-500 bg-sky-50 text-sky-900 ring-1 ring-sky-500' : 'border-stone-200 text-stone-700'
                }`}
                title="Minh Khang: Khẩu quyết trực quan thực tế"
              >
                <MinhKhangInquisitiveAvatar className="w-5 h-5" />
                <span className="font-bold text-[11px]">Minh Khang</span>
                <span className="hidden xl:inline text-[10px] text-stone-400 font-medium">(Trực quan)</span>
              </div>

              {/* 5. Trí */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border text-xs shadow-2xs transition-colors cursor-default ${
                  createValidationState.status === 'pass_create' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600' : 'border-stone-200 text-stone-700'
                }`}
                title="Trí: Deep Thinker kiểm chứng vế phải"
              >
                <TriDeepThinkerAvatar className="w-5 h-5" />
                <span className="font-bold text-[11px]">Trí</span>
                <span className="hidden xl:inline text-[10px] text-stone-400 font-medium">(Kiểm chứng)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-300">
              <GoldenStarIcon className="w-3 h-3 text-amber-600" />
              <span>Bloom:</span>
              <span className="font-mono underline">Evaluate ➔ Create</span>
            </div>

            <button
              type="button"
              onClick={() => setIsCouncilHidden(true)}
              className="text-stone-400 hover:text-stone-700 text-xs px-1.5 py-0.5 rounded hover:bg-stone-200/60 transition-colors cursor-pointer"
              title="Ẩn thanh hội đồng để tăng diện tích hiển thị"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* HAI CỘT NHIỆM VỤ CỐT LÕI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* =========================================================================
            CỘT TRÁI: NHIỆM VỤ 1 (HIỆU ỨNG PROTÉGÉ — ĐÚC KẾT BÍ KÍP GIẢNG BÀI CHO BO)
        ========================================================================= */}
        <div className="p-4 sm:p-5 bg-white border border-stone-200/90 rounded-2xl shadow-2xs space-y-3.5">
          <div className="border-b border-stone-200/80 pb-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1B4338] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Nhiệm vụ 1 · Hiệu ứng Protégé
              </span>
              <span className="text-xs font-semibold text-stone-500">(Bloom: Evaluate)</span>
            </div>
            <h2 className="font-bold text-xs sm:text-sm text-stone-900 leading-snug pt-1">
              Giúp Bo đúc kết bí kíp cộng &amp; trừ Vectơ không gian
            </h2>
          </div>

          {/* Lời nhờ của Bo */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FFFBF2] border border-[#F0E6D2]">
            <BoCircleAvatar className="w-8 h-8 shrink-0" />
            <div className="text-xs text-stone-700 leading-relaxed">
              <span className="font-bold text-[#8A4B08] block mb-0.5">Bo nhờ bạn chỉ giáo:</span>
              "Bạn chọn giúp mình 1 bí kíp dễ nhớ nhất của <strong>Minh Khang</strong> hoặc <strong>Linh Chi</strong> để đi thi không bao giờ bị nhầm quy tắc nối tiếp và quy tắc trừ nhé!"
            </div>
          </div>

          {/* 2 thẻ phong cách: Minh Khang (Blue) vs Linh Chi (Pink) */}
          <div className="space-y-3">
            {/* Cách 1: Minh Khang (Xanh Blue) */}
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('khang');
              }}
              className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                selectedTeachStyle === 'khang'
                  ? 'bg-sky-50/90 border-sky-500 border-2 shadow-xs ring-2 ring-sky-200/50'
                  : 'bg-white hover:bg-sky-50/30 border-stone-200 hover:border-sky-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <MinhKhangInquisitiveAvatar className="w-7 h-7 shrink-0" />
                  <span className={`font-bold text-xs sm:text-sm ${
                    selectedTeachStyle === 'khang' ? 'text-sky-950 font-extrabold' : 'text-stone-900'
                  }`}>
                    Cách 1: Khẩu quyết Minh Khang
                  </span>
                </div>
                {selectedTeachStyle === 'khang' && (
                  <span className="text-[11px] font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-in fade-in">
                    <CheckCircleIcon className="w-3 h-3 text-sky-600" />
                    <span>Đang chọn (Blue)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-700 leading-relaxed pl-9">
                “Cộng là nối đuôi đi tiếp: <code className="font-mono text-sky-900 font-semibold">OA + AB = OB</code>. Trừ chung gốc O là lộn ngược điểm sau lên trước: <code className="font-mono text-sky-900 font-semibold">OA − OB = BA</code>. Khi tính độ dài tổng hai vectơ, tuyệt đối cấm tách 1 + 1 = 2!”
              </p>
            </button>

            {/* Cách 2: Linh Chi (Hồng Pink) */}
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('chi');
              }}
              className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                selectedTeachStyle === 'chi'
                  ? 'bg-pink-50/90 border-pink-400 border-2 shadow-xs ring-2 ring-pink-200/50'
                  : 'bg-white hover:bg-pink-50/30 border-stone-200 hover:border-pink-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <LinhChiNoteTakerAvatar className="w-7 h-7 shrink-0" />
                  <span className={`font-bold text-xs sm:text-sm ${
                    selectedTeachStyle === 'chi' ? 'text-pink-950 font-extrabold' : 'text-stone-900'
                  }`}>
                    Cách 2: Quy tắc thế Linh Chi
                  </span>
                </div>
                {selectedTeachStyle === 'chi' && (
                  <span className="text-[11px] font-bold text-pink-800 bg-pink-100 border border-pink-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-in fade-in">
                    <CheckCircleIcon className="w-3 h-3 text-pink-600" />
                    <span>Đang chọn (Pink)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-700 leading-relaxed pl-9">
                “Khi tính |<Vec>BC</Vec> + <Vec>DD'</Vec>|, cấm tách thành 1 + 1 = 2! Phải thế <Vec>DD'</Vec> = <Vec>CC'</Vec> để gom về 1 vectơ duy nhất |<Vec>BC'</Vec>| = √2.”
              </p>
            </button>
          </div>

          {/* Bo tiếp thu & xác nhận đạt Bloom Evaluate */}
          {selectedTeachStyle && (
            <div className={`p-3.5 rounded-xl border space-y-2 animate-in fade-in duration-150 shadow-2xs ${
              selectedTeachStyle === 'khang' ? 'bg-sky-50/80 border-sky-200' : 'bg-pink-50/80 border-pink-200'
            }`}>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <BoCircleAvatar className="w-7 h-7 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className={`font-bold block text-xs mb-0.5 ${selectedTeachStyle === 'khang' ? 'text-sky-900' : 'text-pink-900'}`}>
                      {selectedTeachStyle === 'khang' ? 'Bo tiếp thu bí kíp Xanh Blue của Minh Khang:' : 'Bo tiếp thu bí kíp Hồng Pink của Linh Chi:'}
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
              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-600">
                <span className="flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hoàn thành vai trò Gia sư nhí (Protégé Effect).</span>
                </span>
                <span className="px-2 py-0.5 bg-[#1B4338] text-white rounded font-mono font-bold text-[10px]">
                  BLOOM: EVALUATE PASSED
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            CỘT PHẢI: NHIỆM VỤ 2 (CẤP ĐỘ BLOOM CREATE: TỰ THIẾT KẾ ĐỀ TOÁN THÁCH ĐẤU)
        ========================================================================= */}
        <div className="p-4 sm:p-5 bg-white border border-stone-200/90 rounded-2xl shadow-2xs space-y-3.5">
          <div className="border-b border-stone-200/80 pb-2.5 flex items-center justify-between">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                Nhiệm vụ 2 · Cấp độ Bloom Create
              </span>
              <h3 className="font-bold text-xs sm:text-sm text-stone-900 leading-snug pt-1">
                Tự thiết kế đề toán thách đấu nhóm bạn
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-md">
              Mức Create
            </span>
          </div>

          {/* HÌNH MINH HỌA QUY TẮC HÌNH HỘP TRỰC QUAN */}
          <BoxVectorDiagram className="animate-in fade-in duration-150" />

          {/* HƯỚNG DẪN TỰ THIẾT KẾ ĐẲNG THỨC */}
          <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <span>Dùng các vectơ cạnh và đường chéo để tự tạo một đẳng thức hoàn chỉnh:</span>
            <span className="text-[10px] text-stone-400 font-medium">Bấm các nút bên dưới để ghép</span>
          </div>

          {/* FORM NHẬP ĐẲNG THỨC */}
          <form onSubmit={(e) => handleValidateCreatedProblem(e)} className="space-y-2">
            <input
              type="text"
              value={customCreatedEquation}
              onChange={(e) => setCustomCreatedEquation(e.target.value)}
              placeholder="Nhập đẳng thức thách đấu (ví dụ: AB + AD + AA' = ...)"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-mono text-xs text-stone-900 outline-none focus:border-[#1B4338] shadow-2xs"
            />

            {/* Dải nút hỗ trợ nhập liệu nhanh */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[10px] text-stone-500 font-medium">Chọn nhanh:</span>
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
                  className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-sky-50 border border-stone-200 text-stone-800 text-[11px] font-semibold cursor-pointer"
                >
                  <Vec>{v}</Vec>
                </button>
              ))}
              {[' + ', ' = '].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setCustomCreatedEquation((prev) => prev.trim() + op)}
                  className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 text-[11px] font-bold cursor-pointer"
                >
                  {op.trim()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomCreatedEquation("AB + AD + AA' = AC'")}
                className="ml-auto px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-medium cursor-pointer"
              >
                Mẫu chuẩn
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#E8A33D] hover:bg-[#d9932b] text-stone-900 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>Gửi đề thách đấu cả lớp</span>
              <span>➔</span>
            </button>
          </form>

          {/* TRƯỜNG HỢP 1: FAIL CREATE — THIẾU DẤU = HOẶC VẾ PHẢI */}
          {createValidationState.status === 'fail_create' && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 space-y-2 animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <LinhChiNoteTakerAvatar className="w-7 h-7 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-950 leading-relaxed">
                  <span className="font-bold text-rose-900 block text-[11px] mb-0.5">
                    Linh Chi nhắc cấu trúc đề:
                  </span>
                  <p className="bg-white/80 p-2 rounded-lg border border-rose-200 text-xs">
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
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold text-xs rounded-lg cursor-pointer transition-colors"
              >
                Bổ sung nhanh "= AC'" để tạo đẳng thức hoàn chỉnh ➔
              </button>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: PASS CREATE — HỘI ĐỒNG THẨM ĐỊNH PHÊ DUYỆT 3 BƯỚC */}
          {createValidationState.status === 'pass_create' && (
            <div className="p-3.5 rounded-xl bg-[#F4FBF7] border border-emerald-300 space-y-2.5 animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-bold text-xs text-[#1B4338] flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-[#1B4338]" />
                  <span>Đề hợp lệ: Đủ hai vế và dấu =</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#1B4338] text-white font-mono text-[10px] font-bold">
                  Bloom: Create Passed
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Bước 1: Linh Chi */}
                <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-emerald-100">
                  <LinhChiNoteTakerAvatar className="w-6 h-6 shrink-0 mt-0.5" />
                  <p className="text-stone-700">
                    <strong className="text-pink-900">Linh Chi:</strong> “Đẳng thức có đầy đủ vế trái <code className="font-mono text-[#1B4338]">{createValidationState.lhs}</code>, dấu = và vế phải <code className="font-mono text-[#1B4338]">{createValidationState.rhs}</code>. Cấu trúc chuẩn xác!”
                  </p>
                </div>

                {/* Bước 2: Bo */}
                <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-emerald-100">
                  <BoCircleAvatar className="w-6 h-6 shrink-0 mt-0.5" />
                  <p className="text-stone-700">
                    <strong className="text-amber-900">Bo:</strong> “Áp dụng quy tắc hình bình hành đáy ABCD: <code className="font-mono text-[#1B4338]">AB + AD = AC</code>. Rút gọn thành <code className="font-mono text-[#1B4338]">AC + AA'</code>...”
                  </p>
                </div>

                {/* Bước 3: Trí */}
                <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-emerald-100">
                  <TriDeepThinkerAvatar className="w-6 h-6 shrink-0 mt-0.5" />
                  <p className="text-stone-700">
                    <strong className="text-blue-900">Trí:</strong> “Trong mặt phẳng chéo ACC'A', <code className="font-mono text-[#1B4338]">AC + AA' = AC'</code>. Trùng khớp hoàn hảo với vế phải!”
                  </p>
                </div>

                {/* Cô Lam & Hội đồng */}
                <div className="flex items-center justify-between gap-2 p-2 bg-[#EBF7F3] rounded-lg border border-[#2E6859]">
                  <div className="flex items-center gap-2">
                    <TutorLamAvatar size="sm" className="scale-75 -ml-1 shrink-0" />
                    <span className="text-xs text-[#1B4338] font-bold">
                      Cô Lam &amp; Hội đồng: Chúc mừng bạn đã hoàn thành xuất sắc cấp độ Bloom Create!
                    </span>
                  </div>
                  <RubberStampSuccess className="scale-75 shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* NÚT XEM TỔNG KẾT HÀNH TRÌNH */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                sound.playSuccessChime();
                setShowFinalBloomReport(true);
              }}
              className="w-full py-2.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <SparkleIcon className="w-4 h-4 text-amber-300" />
              <span>Hoàn thành 4 Trạm · Xem Tổng kết Hành trình &amp; Hồ sơ Bloom</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DUAL-VIEW: GÓC NHÌN HỌC SINH (GROWTH) & GÓC NHÌN GIẢNG VIÊN (ANALYTICS)
      ========================================================================= */}
      {showFinalBloomReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* HEADER CHUYỂN ĐỔI GÓC NHÌN DUAL-VIEW */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
              <div className="flex items-center gap-3">
                <TutorLamAvatar size="sm" className="shrink-0" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4338] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Toán 12 · Vectơ trong không gian (Thầy Nguyễn Phan Tiến)
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-stone-900 pt-1">
                    {showTeacherAnalytics
                      ? 'Bảng Thống kê Sư phạm & Quản trị Lớp học (Teacher Analytics)'
                      : 'Hành trình Trưởng thành & Bản đồ Năng lực (Student Growth View)'}
                  </h3>
                </div>
              </div>

              {/* DUAL-VIEW TOGGLE BUTTONS */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setShowTeacherAnalytics(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                    !showTeacherAnalytics ? 'bg-white text-[#1B4338] shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <GoldenStarIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Học sinh (Khích lệ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTeacherAnalytics(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                    showTeacherAnalytics ? 'bg-[#1B4338] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ChalkboardIcon className="w-3.5 h-3.5" />
                  <span>Giáo viên (Analytics)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFinalBloomReport(false)}
                  className="w-7 h-7 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-xs font-bold cursor-pointer flex items-center justify-center transition-colors ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* TAB 1: GÓC NHÌN HỌC SINH (STUDENT GROWTH VIEW) */}
            {!showTeacherAnalytics ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Lời nhắn nhủ ấm áp từ Cô Lam & Bo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-300 flex items-start gap-3 shadow-2xs">
                    <TutorLamAvatar size="sm" className="scale-75 -ml-2 shrink-0" />
                    <div className="text-xs text-[#1B4338] leading-relaxed">
                      <strong className="block text-sm mb-0.5">Cô Lam nhắn nhủ:</strong>
                      “Thầy cô rất tự hào về con! Con đã trải qua đủ các nấc thang nhận thức: từ vấp bẫy trực giác tại 37:13, đối chất bẻ gãy ngộ nhận, đến tự tin tự thiết kế đề toán mới cho nhóm bạn!”
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 flex items-start gap-3 shadow-2xs">
                    <BoCircleAvatar className="w-8 h-8 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <strong className="block text-sm mb-0.5">Lời cảm ơn từ Bo:</strong>
                      “Cảm ơn bạn gia sư nhí nhiều lắm! Nhờ bạn chỉ giáo khẩu quyết và quy tắc thế mà từ nay mình không bao giờ sợ bị lừa ở các câu hỏi bẫy vectơ nữa!”
                    </div>
                  </div>
                </div>

                {/* THÁP NĂNG LỰC TĂNG TIẾN 5 BẬC */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span className="flex items-center gap-1.5">
                      <BrainIcon className="w-4 h-4 text-[#1B4338]" />
                      <span>Tháp Năng lực Bloom con đã chinh phục:</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      100% Mastered · Toàn diện 4 Trạm
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    {[
                      { num: "Bậc 1-2", title: "Thấu hiểu", desc: "Nắm vững định nghĩa & quy tắc cộng trừ", color: "border-stone-200" },
                      { num: "Bậc 3", title: "Vận dụng", desc: "Áp dụng quy tắc hình bình hành & hình hộp", color: "border-stone-200" },
                      { num: "Bậc 4", title: "Bắt lỗi sai", desc: "Soi ra lỗi hiệu vectơ ở Trạm 2", color: "border-stone-200" },
                      { num: "Bậc 5", title: "Phản biện", desc: "Bẻ gãy bẫy ngộ nhận độ dài tại 37:13", color: "border-stone-200" },
                      { num: "Bậc 6", title: "Sáng tạo", desc: "Tự ra đề toán đạt chuẩn Hội đồng phê duyệt", color: "border-emerald-300 bg-emerald-50/40" }
                    ].map((step, idx) => (
                      <div key={idx} className={`p-2.5 rounded-xl border ${step.color} bg-white shadow-2xs space-y-1`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {step.num}
                          </span>
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="font-bold text-xs text-stone-900">{step.title}</div>
                        <p className="text-[11px] text-stone-500 leading-snug">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 HUY HIỆU VINH DANH */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-around gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <GoldenStarIcon className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-stone-800">Gia sư nhí xuất sắc</span>
                  </div>
                  <span className="text-stone-300">|</span>
                  <div className="flex items-center gap-2">
                    <SparkleIcon className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-stone-800">Bẻ gãy ngộ nhận 37:13</span>
                  </div>
                  <span className="text-stone-300">|</span>
                  <div className="flex items-center gap-2">
                    <TeacherHatIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-stone-800">Nhà sáng tạo đề toán</span>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: GÓC NHÌN GIẢNG VIÊN (TEACHER ANALYTICS VIEW) */
              <div className="space-y-4 animate-in fade-in duration-150 font-mono">
                {/* 3 THẺ KPI SỐ LIỆU */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-center">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">Chỉ số làm chủ kiến thức</span>
                    <span className="text-xl font-extrabold text-emerald-900">92%</span>
                    <span className="text-[10px] text-emerald-700 block">Vượt ngưỡng chuẩn đầu ra</span>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-300 text-center">
                    <span className="text-[11px] font-bold text-sky-800 uppercase block">Thời gian hoàn thành</span>
                    <span className="text-xl font-extrabold text-sky-900">4m 50s</span>
                    <span className="text-[10px] text-sky-700 block">Đúng chuẩn kịch bản 5 phút</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-center">
                    <span className="text-[11px] font-bold text-amber-800 uppercase block">Tỷ lệ phản biện thành công</span>
                    <span className="text-xl font-extrabold text-amber-900">100%</span>
                    <span className="text-[10px] text-amber-700 block">Bẻ gãy trúng 2 ngộ nhận</span>
                  </div>
                </div>

                {/* Khung Terminal Kết quả Chẩn đoán chuẩn mực 100% */}
                <div className="rounded-2xl bg-[#14181C] text-[#F3F4F6] p-4 sm:p-5 text-[11px] sm:text-xs leading-relaxed space-y-4 border border-stone-800 shadow-inner">
                  <div className="text-center font-bold text-[#F5D65D] pb-3 border-b border-stone-700/80">
                    <div className="tracking-wide uppercase text-xs sm:text-sm">
                      KẾT QUẢ CHẨN ĐOÁN NHẬN THỨC &amp; THỐNG KÊ LỚP HỌC (TEACHER ANALYTICS VIEW - TRẠM 4)
                    </div>
                    <div className="text-stone-400 font-normal text-[11px] mt-0.5">
                      Bài học: Toán 12 — Bài 1.1: Vectơ trong không gian (Thầy Nguyễn Phan Tiến)
                    </div>
                  </div>

                  {/* [1] BẢN ĐỒ ĐÁNH GIÁ 6 CẤP ĐỘ NHẬN THỨC */}
                  <div className="space-y-1.5">
                    <div className="text-[#F5D65D] font-bold border-b border-stone-700/60 pb-1">
                      [1] BẢN ĐỒ ĐÁNH GIÁ 6 CẤP ĐỘ NHẬN THỨC (BLOOM'S TAXONOMY DIAGNOSTICS)
                    </div>
                    <div className="space-y-1 pl-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-stone-300">• Level 1 &amp; 2 (Remember &amp; Understand) :</span>
                        <span><strong className="text-emerald-400">CONSOLIDATED</strong> <span className="text-stone-400">(Đã nắm vững định nghĩa &amp; quy tắc)</span></span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-stone-300">• Level 3     (Apply - Vận dụng)      :</span>
                        <span><strong className="text-emerald-400">CONSOLIDATED</strong> <span className="text-stone-400">(Áp dụng đúng quy tắc nối tiếp &amp; thế)</span></span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-stone-300">• Level 4     (Analyze - Bắt lỗi sai) :</span>
                        <span><strong className="text-emerald-400">THOROUGH</strong> <span className="text-stone-400">(Bắt trúng lỗi quy tắc hiệu Bước 2)</span></span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-stone-300">• Level 5     (Evaluate - Phản biện)  :</span>
                        <span><strong className="text-amber-300">SHARP_REBUTTAL</strong> <span className="text-stone-400">(Bẻ gãy bẫy |a+b| = |a|+|b| tại 37:13)</span></span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-stone-300">• Level 6     (Create - Tự ra đề mới) :</span>
                        <span><strong className="text-teal-300">PASSED</strong> <span className="text-stone-400">(Thiết kế chuẩn: AB + AD + AA' = AC')</span></span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-stone-300">• Protégé Retention Boost             :</span>
                        <span><strong className="text-sky-300">ACTIVE</strong> <span className="text-stone-400">(Đã đúc kết bí kíp dạy lại cho Bo)</span></span>
                      </div>
                    </div>
                  </div>

                  {/* [2] NHẬT KÝ THỰC THI HỆ THỐNG */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[#5EEAD4] font-bold border-b border-stone-700/60 pb-1">
                      [2] NHẬT KÝ THỰC THI HỆ THỐNG (AGENT ACTION LAYER &amp; EVENT LOGS)
                    </div>
                    <div className="space-y-1 pl-1 text-stone-300">
                      <div>1. [Trạm 1 - 37:13] <span className="text-amber-400 font-semibold">create_review_task</span>     ➔ VID_VECTO_12 (Test nhánh Skip: skipped_not_mastered)</div>
                      <div>2. [Trạm 1 - 37:13] <span className="text-teal-400 font-semibold">create_learning_record</span> ➔ VID_VECTO_12 (Bloom: Evaluate | Sharp Rebuttal)</div>
                      <div>3. [Trạm 1 - 37:13] <span className="text-emerald-400 font-semibold">update_mastery_state</span>   ➔ MASTERED (Đã mở khóa quy tắc vàng Cô Lam)</div>
                      <div>4. [Trạm 2 - VD 10] <span className="text-teal-400 font-semibold">create_learning_record</span> ➔ ALG_VECTO_SUB (Bloom: Analyze | Thorough Diagnosis)</div>
                      <div>5. [Trạm 3 - VD 08] <span className="text-teal-400 font-semibold">create_learning_record</span> ➔ POE_VECTO_DIR (Bloom: Evaluate | Ngược hướng k = -3)</div>
                      <div>6. [Trạm 4 - Create] <span className="text-teal-400 font-semibold">create_learning_record</span> ➔ CUSTOM_EQ_3D (Bloom: Create | Passed Validation)</div>
                    </div>
                  </div>
                </div>

                {/* KHUYẾN NGHỊ SƯ PHẠM */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 font-sans leading-relaxed">
                  <strong>Khuyến nghị Sư phạm:</strong> Học sinh đã hoàn thành xuất sắc toàn bộ 6 bậc Bloom. Có thể mở khóa chuyên đề nâng cao tiếp theo (Tích vô hướng &amp; Hệ tọa độ Oxyz) hoặc phân công làm <strong>Trưởng nhóm Peer Tutor</strong> hỗ trợ các bạn còn vướng ngộ nhận.
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playBubblePop();
                      const reportText = `================================================================================
KẾT QUẢ CHẨN ĐOÁN NHẬN THỨC & THỐNG KÊ LỚP HỌC (TEACHER ANALYTICS VIEW - TRẠM 4)
Bài học: Toán 12 — Bài 1.1: Vectơ trong không gian (Thầy Nguyễn Phan Tiến)
================================================================================

[1] BẢN ĐỒ ĐÁNH GIÁ 6 CẤP ĐỘ NHẬN THỨC (BLOOM'S TAXONOMY DIAGNOSTICS)
--------------------------------------------------------------------------------
• Level 1 & 2 (Remember & Understand) : CONSOLIDATED    (Đã nắm vững định nghĩa & quy tắc)
• Level 3     (Apply - Vận dụng)      : CONSOLIDATED    (Áp dụng đúng quy tắc nối tiếp & thế)
• Level 4     (Analyze - Bắt lỗi sai) : THOROUGH        (Bắt trúng lỗi quy tắc hiệu Bước 2)
• Level 5     (Evaluate - Phản biện)  : SHARP_REBUTTAL  (Bẻ gãy bẫy |a+b| = |a|+|b| tại 37:13)
• Level 6     (Create - Tự ra đề mới) : PASSED          (Thiết kế chuẩn: AB + AD + AA' = AC')
• Protégé Retention Boost             : ACTIVE          (Đã đúc kết bí kíp dạy lại cho Bo)

[2] NHẬT KÝ THỰC THI HỆ THỐNG (AGENT ACTION LAYER & EVENT LOGS)
--------------------------------------------------------------------------------
1. [Trạm 1 - 37:13] create_review_task     ➔ VID_VECTO_12 (Test nhánh Skip: skipped_not_mastered)
2. [Trạm 1 - 37:13] create_learning_record ➔ VID_VECTO_12 (Bloom: Evaluate | Sharp Rebuttal)
3. [Trạm 1 - 37:13] update_mastery_state   ➔ MASTERED (Đã mở khóa quy tắc vàng Cô Lam)
4. [Trạm 2 - VD 10] create_learning_record ➔ ALG_VECTO_SUB (Bloom: Analyze | Thorough Diagnosis)
5. [Trạm 3 - VD 08] create_learning_record ➔ POE_VECTO_DIR (Bloom: Evaluate | Ngược hướng k = -3)
6. [Trạm 4 - Create] create_learning_record ➔ CUSTOM_EQ_3D (Bloom: Create | Passed Validation)
================================================================================`;
                      navigator.clipboard.writeText(reportText);
                      alert('Đã sao chép toàn bộ kết quả chẩn đoán vào Clipboard!');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold cursor-pointer border border-stone-200 flex items-center gap-1.5 transition-colors font-sans"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-stone-600">
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                    <span>Sao chép kết quả Terminal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFinalBloomReport(false)}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors font-sans"
                  >
                    Đóng báo cáo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
