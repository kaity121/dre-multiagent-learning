// File: src/components/AlternativeFlowsSheet.tsx
import React, { useState } from 'react';
import { LearningMode, SilentLearningRecord } from '../types/dre';
import { 
  BoAvatar, 
  TutorLamAvatar, 
  TriDeepThinkerAvatar, 
  LinhChiNoteTakerAvatar, 
  MinhKhangInquisitiveAvatar,
  RubberStampSuccess,
  SparkleIcon,
  CheckCircleIcon,
  SwordsDebateIcon,
  GoldenStarIcon,
  BrainIcon,
  TeacherHatIcon,
  ChalkboardIcon,
  LightningZapIcon
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

const StepBadge = ({ num }: { num: string }) => (
  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#1B4338] text-white font-mono text-[11px] font-bold shrink-0">
    {num}
  </span>
);

interface AlternativeFlowsSheetProps {
  mode: LearningMode;
  onSwitchMode: (mode: LearningMode) => void;
  onPoeTopicChange?: (topic: string) => void;
  learningRecords?: SilentLearningRecord[];
}

export const AlternativeFlowsSheet: React.FC<AlternativeFlowsSheetProps> = ({
  mode,
  onSwitchMode,
  learningRecords = [],
}) => {
  const [poePrediction, setPoePrediction] = useState<'bo_camp' | 'tri_camp' | null>(null);
  const [poeExplanation, setPoeExplanation] = useState<string>('');
  const [poeCompleted, setPoeCompleted] = useState<boolean>(false);

  const [selectedTeachStyle, setSelectedTeachStyle] = useState<'khang' | 'chi' | null>(null);
  const [customCreatedEquation, setCustomCreatedEquation] = useState<string>("AB + AD + AA' = AC'");
  
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
        reason: "Biểu thức của bạn chưa có dấu bằng (=) nên chưa tạo thành một đẳng thức vectơ hoàn chỉnh! Bạn bổ sung vế phải nhé",
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
  // TRẠM 3: POE (HIỂN THỊ TUẦN TỰ, KHÔNG HỘP LỒNG HỘP, KHÔNG LỘ ĐÁP ÁN TRƯỚC!)
  // =========================================================================
  if (mode === 'predict_poe') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-4">
        {/* CỘT TRÁI (7/12): BƯỚC 1 (DỰ ĐOÁN) & BƯỚC 2 (QUAN SÁT THỰC NGHIỆM) */}
        <div className="lg:col-span-7 p-3 sm:p-5 space-y-4 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-md">
              Trạm 3 · Thử thách Dự đoán – Quan sát – Giải thích (POE)
            </span>
            <h2 className="font-bold text-base sm:text-lg text-[#1E242B] leading-snug pt-1">
              Ví dụ 8 (Phút 1:30:30): Cho điểm I thuộc đoạn thẳng AG sao cho độ dài{' '}
              <span className="font-mono text-[#92400E]">IA = 3·IG</span>. Hãy biểu diễn{' '}
              <span className="font-mono text-[#1B4338]">vectơ IA</span> theo{' '}
              <span className="font-mono text-[#1B4338]">vectơ IG</span>:
            </h2>
          </div>

          {/* BƯỚC 1: CHỌN PHE BO HOẶC PHE TRÍ */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#374151]">
              <StepBadge num="1" />
              <span>BƯỚC 1 (PREDICT): Khi chuyển từ độ dài đoạn thẳng sang vectơ, bạn chọn phe ai?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setPoePrediction('bo_camp');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                  poePrediction === 'bo_camp'
                    ? 'bg-[#FFFBF2] border-[#D97706] border-2 shadow-2xs'
                    : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#92400E]">
                  <BoAvatar size="sm" className="scale-75 -ml-2 shrink-0" />
                  <span>Phe Bo: IA = 3·IG (Số dương +3)</span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  “Đoạn IA gấp 3 lần đoạn IG thì gắn mũi tên vectơ vào vẫn là IA = 3·IG thôi!”
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setPoePrediction('tri_camp');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                  poePrediction === 'tri_camp'
                    ? 'bg-[#F5F8FF] border-[#2563EB] border-2 shadow-2xs'
                    : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#1E40AF]">
                  <TriDeepThinkerAvatar className="w-8 h-8 shrink-0" />
                  <span>Phe Trí: IA = −3·IG (Số âm −3)</span>
                </div>
                <p className="text-xs text-[#374151] leading-relaxed">
                  “Vì I nằm giữa A và G nên hai vectơ IA và IG ngược hướng nhau, bắt buộc phải có dấu trừ!”
                </p>
              </button>
            </div>
          </div>

          {/* BƯỚC 2: CHỈ HIỆN SAU KHI ĐÃ CHỌN DỰ ĐOÁN Ở BƯỚC 1 */}
          {poePrediction && (
            <div className="p-4 rounded-xl bg-[#F2FCFE] border border-[#22D3EE] space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <MinhKhangInquisitiveAvatar className="w-8 h-8 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#155E75]">
                    <StepBadge num="2" />
                    <span>BƯỚC 2 (OBSERVE) — Thực nghiệm kiểm chứng của Minh Khang:</span>
                  </div>
                  <p className="text-[11px] text-[#0E7490] mt-0.5">
                    Thay thử vào đẳng thức trọng tâm tứ diện <code>IA + 3·IG = 0</code> (ở phút 1:30:10):
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-[#F8B4A5] text-[#9B1C1C]">
                  <div className="font-bold">Nếu IA = +3·IG (Phe Bo):</div>
                  <div>3·IG + 3·IG = 6·IG ≠ 0 (Sai!)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#4E9B87] text-[#1B4338]">
                  <div className="font-bold">Nếu IA = −3·IG (Phe Trí):</div>
                  <div>(−3·IG) + 3·IG = 0 (Chuẩn xác!)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (5/12): BƯỚC 3 (KHÓA LẠI KHI CHƯA ĐOÁN BƯỚC 1 ĐỂ KHÔNG LỘ ĐÁP ÁN!) */}
        <div className="lg:col-span-5 p-3 sm:p-5 flex flex-col justify-between overflow-y-auto no-scrollbar">
          {!poePrediction ? (
            <div className="my-auto p-6 rounded-xl bg-[#FAF8F5] border border-dashed border-[#D8CEBC] text-center space-y-2">
              <StepBadge num="3" />
              <div className="font-bold text-sm text-[#1E242B]">
                Bước 3 (Explain) đang chờ bạn dự đoán
              </div>
              <p className="text-xs text-[#6E6254] max-w-xs mx-auto leading-relaxed">
                Hãy chọn <strong>Phe Bo</strong> hoặc <strong>Phe Trí</strong> ở Bước 1 bên trái trước khi mở khóa phần giải thích nguyên lý nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <LinhChiNoteTakerAvatar className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#9D174D] flex items-center gap-1.5">
                    <StepBadge num="3" />
                    <span>BƯỚC 3 (EXPLAIN): Giải thích nguyên lý</span>
                  </h3>
                  <p className="text-[11px] text-[#6E6254]">
                    Cùng Linh Chi & Trí chốt lại quy tắc nhân vectơ với một số
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF5F9] border border-[#F472B6]/60 text-xs text-[#4A152B] leading-relaxed">
                <strong>Sổ tay Linh Chi (Phút 1:06:30):</strong> Với <code>a = k·b</code>: Độ dài tỉ lệ theo <code>|k|</code>, còn dấu của <code>k</code> dương khi cùng hướng và <strong>âm khi ngược hướng</strong>!
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1E242B]">
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
                      className="quick-prompt-box w-full bg-[#FAF8F5] hover:bg-[#EBF7F3] border border-[#E2D9C8] rounded-lg text-[#1E242B] text-left cursor-pointer transition-colors"
                    >
                      Chọn nhanh: “{sample}”
                    </button>
                  ))}
                </div>

                <textarea
                  value={poeExplanation}
                  onChange={(e) => setPoeExplanation(e.target.value)}
                  rows={2}
                  placeholder="Nhập hoặc chọn lập luận ở trên..."
                  className="w-full p-2.5 bg-white border border-[#D8CEBC] rounded-lg text-xs text-[#1E242B] outline-none focus:border-[#1B4338]"
                />

                <button
                  type="button"
                  onClick={() => {
                    sound.playSuccessChime();
                    setPoeCompleted(true);
                  }}
                  className="w-full py-2.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs sm:text-sm rounded-lg cursor-pointer"
                >
                  Chốt kết luận cùng Trí & Minh Khang ➔
                </button>
              </div>

              {poeCompleted && (
                <div className="p-3 rounded-xl bg-[#EBF7F3] border border-[#2E6859] flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[#1B4338]">
                    Đã nắm vững bản chất!
                  </span>
                  <button
                    type="button"
                    onClick={() => onSwitchMode('protege_teaching')}
                    className="px-3 py-1.5 bg-[#E8A33D] text-[#1E242B] font-bold text-xs rounded-lg cursor-pointer shrink-0"
                  >
                    Sang Trạm 4 ➔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRẠM 4: GIA SƯ NHÍ & TỰ RA ĐỀ (PHẲNG, THOÁNG, KHÔNG HỘP LỒNG HỘP)
  // =========================================================================
  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-4">
      {/* =========================================================================
          SPOTLIGHT: HỘI ĐỒNG THẨM ĐỊNH GỒM CẢ 4 BẠN HỌC VÀ CÔ LAM
          MỤC TIÊU NHẬN THỨC (BLOOM): EVALUATE -> CREATE
      ========================================================================= */}
      <div className="bg-[#FAF8F5] border border-[#E2D9C8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE8DC] pb-2.5">
          <div className="flex items-center gap-2">
            <SwordsDebateIcon className="w-5 h-5 text-[#1B4338]" />
            <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wide text-[#1B4338]">
              Vai trò chủ đạo (Spotlight): Hội đồng thẩm định gồm cả 4 bạn học và Cô Lam
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold border border-[#F59E0B]/30">
            <GoldenStarIcon className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Mục tiêu nhận thức (Bloom):</span>
            <span className="font-mono underline">Evaluate ➔ Create</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* 1. Cô Lam */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E2D9C8] flex flex-col items-center text-center space-y-1 shadow-2xs hover:border-[#1B4338] transition-colors">
            <TutorLamAvatar size="sm" />
            <span className="font-bold text-xs text-[#1B4338]">Cô Lam</span>
            <span className="text-[10px] text-[#6E6254] leading-tight">Cố vấn Socratic & Tổng kết Bloom</span>
          </div>

          {/* 2. Bo */}
          <div className={`p-2.5 rounded-xl bg-white border flex flex-col items-center text-center space-y-1 shadow-2xs transition-colors ${
            selectedTeachStyle ? 'border-[#E8A33D] bg-[#FFFBF2]' : 'border-[#E2D9C8]'
          }`}>
            <BoAvatar size="sm" expression={selectedTeachStyle ? 'happy' : 'skeptical'} />
            <span className="font-bold text-xs text-[#92400E]">Bo</span>
            <span className="text-[10px] text-[#6E6254] leading-tight">Bạn học tiếp thu & Biến đổi bước đầu</span>
          </div>

          {/* 3. Linh Chi */}
          <div className={`p-2.5 rounded-xl bg-white border flex flex-col items-center text-center space-y-1 shadow-2xs transition-colors ${
            createValidationState.status !== 'idle' ? 'border-[#DB2777] bg-[#FFF5F9]' : 'border-[#E2D9C8]'
          }`}>
            <LinhChiNoteTakerAvatar className="w-8 h-8" />
            <span className="font-bold text-xs text-[#9D174D]">Linh Chi</span>
            <span className="text-[10px] text-[#6E6254] leading-tight">Thư ký kiểm định cấu trúc đẳng thức</span>
          </div>

          {/* 4. Minh Khang */}
          <div className={`p-2.5 rounded-xl bg-white border flex flex-col items-center text-center space-y-1 shadow-2xs transition-colors ${
            selectedTeachStyle === 'khang' ? 'border-[#0891B2] bg-[#F2FCFE]' : 'border-[#E2D9C8]'
          }`}>
            <MinhKhangInquisitiveAvatar className="w-8 h-8" />
            <span className="font-bold text-xs text-[#155E75]">Minh Khang</span>
            <span className="text-[10px] text-[#6E6254] leading-tight">Tác giả Khẩu quyết thực tế</span>
          </div>

          {/* 5. Trí */}
          <div className={`p-2.5 rounded-xl bg-white border flex flex-col items-center text-center space-y-1 shadow-2xs transition-colors ${
            createValidationState.status === 'pass_create' ? 'border-[#2563EB] bg-[#F5F8FF]' : 'border-[#E2D9C8]'
          }`}>
            <TriDeepThinkerAvatar className="w-8 h-8" />
            <span className="font-bold text-xs text-[#1E40AF]">Trí</span>
            <span className="text-[10px] text-[#6E6254] leading-tight">Deep Thinker kiểm chứng vế phải</span>
          </div>
        </div>
      </div>

      {/* HAI NHIỆM VỤ CỐT LÕI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* =========================================================================
            NHIỆM VỤ 1 (CỘT TRÁI — HIỆU ỨNG PROTÉGÉ: ĐÚC KẾT BÍ KÍP GIẢNG BÀI CHO BO)
        ========================================================================= */}
        <div className="lg:col-span-6 p-4 sm:p-5 bg-white border border-[#E2D9C8] rounded-2xl shadow-xs space-y-4">
          <div className="space-y-1 border-b border-[#EFE8DC] pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1B4338] bg-[#EBF7F3] px-2.5 py-0.5 rounded-md">
                Nhiệm vụ 1 · Cột trái (Hiệu ứng Protégé)
              </span>
              <span className="text-xs font-semibold text-[#8A7D6F]">(Bloom: Evaluate)</span>
            </div>
            <h2 className="font-bold text-base sm:text-lg text-[#1E242B] pt-0.5">
              Đúc kết bí kíp giảng bài cho Bo
            </h2>
          </div>

          {/* Bo nhờ học sinh */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D5]">
            <BoAvatar size="sm" expression={selectedTeachStyle ? 'happy' : 'skeptical'} className="shrink-0 scale-90 -ml-1" />
            <div className="text-xs text-[#2F2923] leading-relaxed">
              <div className="font-bold text-[#92400E] mb-1">Bo nhờ học sinh:</div>
              “Bạn chọn giúp mình <strong>1 quy tắc cốt lõi dễ nhớ nhất</strong> để phân biệt rõ quy tắc cộng nối tiếp, quy tắc trừ chung gốc và cách tính độ dài tổng hai vectơ với nhé!”
            </div>
          </div>

          {/* 2 lựa chọn phương pháp giảng giải */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('khang');
              }}
              className={`w-full p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                selectedTeachStyle === 'khang'
                  ? 'bg-[#F2FCFE] border-[#0891B2] border-2 shadow-2xs'
                  : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#155E75]">
                  <MinhKhangInquisitiveAvatar className="w-7 h-7 shrink-0" />
                  <span>Khẩu quyết thực tế của Minh Khang</span>
                </div>
                {selectedTeachStyle === 'khang' && (
                  <span className="text-[11px] font-bold text-[#0891B2] bg-[#E0F2FE] px-2 py-0.5 rounded">Đã chọn</span>
                )}
              </div>
              <p className="text-xs text-[#374151] leading-relaxed pl-9">
                “Cộng là nối đuôi đi tiếp: <code className="font-mono text-[#0E7490] font-semibold">OA + AB = OB</code>. Trừ chung gốc O là lộn ngược điểm sau lên trước: <code className="font-mono text-[#0E7490] font-semibold">OA − OB = BA</code>. Khi tính độ dài tổng hai vectơ, phải gom về 1 vectơ duy nhất rồi mới đo độ dài, cấm cộng từng đoạn đại số rời!”
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('chi');
              }}
              className={`w-full p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                selectedTeachStyle === 'chi'
                  ? 'bg-[#FFF5F9] border-[#DB2777] border-2 shadow-2xs'
                  : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#9D174D]">
                  <LinhChiNoteTakerAvatar className="w-7 h-7 shrink-0" />
                  <span>Quy tắc thế vectơ của Linh Chi</span>
                </div>
                {selectedTeachStyle === 'chi' && (
                  <span className="text-[11px] font-bold text-[#DB2777] bg-[#FCE7F3] px-2 py-0.5 rounded">Đã chọn</span>
                )}
              </div>
              <p className="text-xs text-[#374151] leading-relaxed pl-9">
                “Khi tính độ dài tổng hai vectơ vuông góc <code className="font-mono text-[#9D174D] font-semibold">|BC + DD'|</code>, tuyệt đối không được tách thành 1 + 1 = 2! Phải thế <code className="font-mono text-[#9D174D] font-semibold">DD' = CC'</code> để gom nối đuôi thành <code className="font-mono text-[#9D174D] font-semibold">|BC'| = a√2</code> (đường chéo hình vuông).”
              </p>
            </button>
          </div>

          {/* Bo tiếp thu và xác nhận đã nắm vững quy tắc */}
          {selectedTeachStyle && (
            <div className="p-4 rounded-xl bg-[#EBF7F3] border border-[#2E6859] space-y-2.5 animate-in fade-in duration-150 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <BoAvatar size="sm" expression="happy" className="shrink-0 scale-90 -ml-1" />
                  <div className="text-xs text-[#1B4338] leading-relaxed">
                    <span className="font-bold block text-sm mb-1 text-[#1B4338]">
                      Bo tiếp thu và xác nhận đã nắm vững quy tắc:
                    </span>
                    “Mình đã hiểu sâu và nắm vững quy tắc rồi! Ghi nhớ tuyệt đối: Không bao giờ tách độ dài tùy tiện, trừ chung gốc thì lộn ngược điểm sau lên trước! Cảm ơn gia sư nhé!”
                  </div>
                </div>
                <RubberStampSuccess className="scale-75 shrink-0" />
              </div>
              <div className="pt-2 border-t border-[#BFE6DC] flex items-center justify-between text-[11px] text-[#2D6A5B]">
                <div className="flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-[#2E6859] shrink-0" />
                  <span>Học sinh hoàn thành xuất sắc vai trò Gia sư nhí (Hiệu ứng Protégé).</span>
                </div>
                <span className="px-2 py-0.5 bg-[#2E6859] text-white rounded font-mono font-bold text-[10px]">
                  BLOOM: EVALUATE PASSED
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            NHIỆM VỤ 2 (CỘT PHẢI — CẤP ĐỘ BLOOM CREATE: TỰ THIẾT KẾ ĐỀ TOÁN THÁCH ĐẤU)
        ========================================================================= */}
        <div className="lg:col-span-6 p-4 sm:p-5 bg-white border border-[#E2D9C8] rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="space-y-1 border-b border-[#EFE8DC] pb-3">
              <div className="flex items-center justify-between">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-md">
                  Nhiệm vụ 2 · Cột phải (Cấp độ Bloom Create)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#DC2626]/10 text-[10px] font-bold text-[#DC2626]">
                  Thách đấu cả lớp
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1E242B] pt-0.5">
                Tự thiết kế đề toán thách đấu nhóm bạn
              </h3>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Học sinh tự nhập một đẳng thức vectơ không gian mới vào ô thiết kế đề (ví dụ:{' '}
              <code className="font-mono text-[#1B4338] font-bold bg-[#EBF7F3] px-1.5 py-0.5 rounded">
                AB + AD + AA' = AC'
              </code>) và nhấn <strong>Gửi đề thách đấu cả lớp</strong>.
            </p>

            {/* MẪU ĐIỀN SẴN (PRESETS) */}
            <div className="space-y-1.5 bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE3D5]">
              <div className="text-[11px] font-bold text-[#6E6254] flex items-center justify-between">
                <span>Chọn nhanh đề mẫu điền sẵn (1 chạm demo):</span>
                <span className="text-[10px] text-[#A89C8D]">Bấm để điền mẫu ngay</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setCustomCreatedEquation("AB + AD + AA' = AC'");
                    handleValidateCreatedProblem(undefined, "AB + AD + AA' = AC'");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#EBF7F3] border border-[#D8CEBC] hover:border-[#1B4338] text-left cursor-pointer transition-all text-xs"
                >
                  <div className="font-mono font-bold text-[#1B4338]">AB + AD + AA' = AC'</div>
                  <div className="text-[10px] text-[#6E6254]">Đẳng thức hình hộp (Hợp lệ)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setCustomCreatedEquation("AB + AD + AA'");
                    handleValidateCreatedProblem(undefined, "AB + AD + AA'");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FFF5F5] border border-[#F8B4A5] hover:border-[#DC2626] text-left cursor-pointer transition-all text-xs"
                >
                  <div className="font-mono font-bold text-[#9B1C1C]">AB + AD + AA'</div>
                  <div className="text-[10px] text-[#B91C1C]">Thử lỗi: Thiếu dấu = (Trường hợp 1)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setCustomCreatedEquation("GA + GB + GC + GD = 0");
                    handleValidateCreatedProblem(undefined, "GA + GB + GC + GD = 0");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F5F8FF] border border-[#D8CEBC] hover:border-[#2563EB] text-left cursor-pointer transition-all text-xs"
                >
                  <div className="font-mono font-bold text-[#1E40AF]">GA + GB + GC + GD = 0</div>
                  <div className="text-[10px] text-[#6E6254]">Trọng tâm tứ diện (Hợp lệ)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setCustomCreatedEquation("IA + IB = 0");
                    handleValidateCreatedProblem(undefined, "IA + IB = 0");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FEF8DC] border border-[#D8CEBC] hover:border-[#D9A716] text-left cursor-pointer transition-all text-xs"
                >
                  <div className="font-mono font-bold text-[#7A5B05]">IA + IB = 0</div>
                  <div className="text-[10px] text-[#6E6254]">Trung điểm không gian (Hợp lệ)</div>
                </button>
              </div>
            </div>

            {/* FORM NHẬP TỰ DO & NÚT GỬI */}
            <form onSubmit={handleValidateCreatedProblem} className="space-y-2">
              <input
                type="text"
                value={customCreatedEquation}
                onChange={(e) => setCustomCreatedEquation(e.target.value)}
                placeholder="Nhập đẳng thức vectơ không gian (ví dụ: AB + AD + AA' = AC')..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEBC] rounded-xl font-mono text-xs sm:text-sm text-[#1E242B] outline-none focus:border-[#1B4338] shadow-2xs"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#E8A33D] hover:bg-[#D9932B] text-[#1E242B] font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Gửi đề thách đấu cả lớp</span>
                <span>➔</span>
              </button>
            </form>

            {/* LUỒNG THẨM ĐỊNH TỰ ĐỘNG CỦA CÁC TÁC NHÂN */}

            {/* TRƯỜNG HỢP 1: ĐỀ THIẾU DỮ KIỆN / KHÔNG CÓ DẤU = */}
            {createValidationState.status === 'fail_create' && (
              <div className="p-4 rounded-xl bg-[#FFF5F5] border border-[#F8B4A5] space-y-3 animate-in fade-in duration-150 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#FDD8D8] pb-2">
                  <span className="font-bold text-xs text-[#9B1C1C] flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Trường hợp 1: Đề thiếu dữ kiện</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#DC2626] text-white font-mono text-[10px] font-bold">
                    Trạng thái: Fail Create ➔ Yêu cầu bổ sung dữ kiện
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <LinhChiNoteTakerAvatar className="w-8 h-8 shrink-0" />
                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-[#9D174D]">Linh Chi phát hiện lỗi cấu trúc và phản hồi:</div>
                    <p className="text-[#7F1D1D] leading-relaxed bg-white/80 p-2.5 rounded-lg border border-[#F8B4A5]">
                      “{createValidationState.reason}”
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPencilTap();
                      const fixed = `${customCreatedEquation.trim()} = AC'`;
                      setCustomCreatedEquation(fixed);
                      handleValidateCreatedProblem(undefined, fixed);
                    }}
                    className="px-3 py-1.5 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 text-[#9B1C1C] font-semibold text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    Bổ sung nhanh "= AC'" để tạo đẳng thức hoàn chỉnh ➔
                  </button>
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP 2: ĐỀ HỢP LỆ — ĐỦ HAI VẾ VÀ DẤU = */}
            {createValidationState.status === 'pass_create' && (
              <div className="p-4 rounded-xl bg-[#F4FBF7] border border-[#2E6859] space-y-3.5 animate-in fade-in duration-150 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#CBEADF] pb-2">
                  <span className="font-bold text-xs text-[#1B4338] flex items-center gap-1.5">
                    <CheckCircleIcon className="w-4 h-4 text-[#1B4338]" />
                    <span>Trường hợp 2: Đề hợp lệ (Đủ hai vế và dấu =)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1B4338] text-white font-mono text-[10px] font-bold">
                    Pass Create (Đạt Bloom Create)
                  </span>
                </div>

                <div className="space-y-3">
                  {/* BƯỚC 1: LINH CHI XÁC NHẬN CẤU TRÚC ĐỀ HỢP LỆ */}
                  <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-[#D5EFE6]">
                    <LinhChiNoteTakerAvatar className="w-7 h-7 shrink-0" />
                    <div className="text-xs text-[#2F2923] leading-relaxed">
                      <span className="font-bold text-[#9D174D] block text-[11px] mb-0.5">
                        Linh Chi xác nhận cấu trúc đề hợp lệ:
                      </span>
                      “Đẳng thức có đầy đủ vế trái <code className="font-mono font-semibold text-[#1B4338]">{createValidationState.lhs}</code>, dấu bằng (=) và vế phải <code className="font-mono font-semibold text-[#1B4338]">{createValidationState.rhs}</code>. Cấu trúc toán học hoàn chỉnh!”
                    </div>
                  </div>

                  {/* BƯỚC 2: BO THỰC HIỆN BIẾN ĐỔI BƯỚC ĐẦU THEO QUY TẮC HÌNH BÌNH HÀNH */}
                  <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-[#D5EFE6]">
                    <BoAvatar size="sm" expression="happy" className="shrink-0 scale-75 -ml-2 -mt-1" />
                    <div className="text-xs text-[#2F2923] leading-relaxed">
                      <span className="font-bold text-[#92400E] block text-[11px] mb-0.5">
                        Bo thực hiện biến đổi bước đầu theo quy tắc hình bình hành:
                      </span>
                      {createValidationState.lhs.includes("AB") && createValidationState.lhs.includes("AD") ? (
                        <>
                          “Áp dụng quy tắc hình bình hành ở đáy ABCD, ta có: <code className="font-mono font-bold text-[#1B4338]">AB + AD = AC</code>. Khi đó vế trái thu gọn lại thành: <code className="font-mono font-bold text-[#1B4338]">AC + AA'</code>...”
                        </>
                      ) : (
                        <>
                          “Áp dụng quy tắc hình bình hành & cộng vectơ cho vế trái: Ta nhóm các vectơ chung gốc <code className="font-mono font-bold text-[#1B4338]">{createValidationState.lhs}</code> để tiến hành rút gọn từng bước...”
                        </>
                      )}
                    </div>
                  </div>

                  {/* BƯỚC 3: TRÍ KIỂM CHỨNG KẾT QUẢ VẾ PHẢI VÀ CÔNG NHẬN HỌC SINH ĐẠT CẤP ĐỘ CREATE */}
                  <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-[#D5EFE6]">
                    <TriDeepThinkerAvatar className="w-7 h-7 shrink-0" />
                    <div className="text-xs text-[#2F2923] leading-relaxed">
                      <span className="font-bold text-[#1E40AF] block text-[11px] mb-0.5">
                        Trí kiểm chứng kết quả vế phải và công nhận học sinh đạt cấp độ Create (Pass Create):
                      </span>
                      {createValidationState.lhs.includes("AB") && createValidationState.rhs.includes("AC'") ? (
                        <>
                          “Trong mặt phẳng chéo (ACC'A'), ACC'A' là hình bình hành nên <code className="font-mono font-bold text-[#1B4338]">AC + AA' = AC'</code>. Kết quả vế trái biến đổi ra đúng vế phải <code className="font-mono font-bold text-[#1B4338]">AC'</code>! Đẳng thức chính xác tuyệt đối.”
                        </>
                      ) : (
                        <>
                          “Các bước biến đổi hoàn toàn nhất quán về logic và đồng nhất với vế phải <code className="font-mono font-bold text-[#1B4338]">{createValidationState.rhs}</code>! Đẳng thức chính xác tuyệt đối.”
                        </>
                      )}
                    </div>
                  </div>

                  {/* CÔ LAM VÀ HỘI ĐỒNG TỔNG KẾT */}
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-[#EBF7F3] rounded-lg border border-[#2E6859]">
                    <div className="flex items-center gap-2">
                      <TutorLamAvatar size="sm" className="scale-75 -ml-1 shrink-0" />
                      <div className="text-xs text-[#1B4338] font-bold">
                        Cô Lam & Hội đồng: Chúc mừng bạn đã hoàn thành xuất sắc cấp độ Bloom Create!
                      </div>
                    </div>
                    <RubberStampSuccess className="scale-75 shrink-0" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NÚT XEM TỔNG KẾT HÀNH TRÌNH */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playSuccessChime();
                setShowFinalBloomReport(prev => !prev);
              }}
              className="w-full py-2.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <SparkleIcon className="w-4 h-4 text-[#F5D65D]" />
              <span>{showFinalBloomReport ? 'Ẩn Bảng Tổng kết Hành trình' : 'Hoàn thành 4 Trạm · Xem Tổng kết Hành trình & Hồ sơ Bloom'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BẢNG TỔNG KẾT HÀNH TRÌNH & HỒ SƠ CHẨN ĐOÁN BLOOM (DUAL-VIEW VISUALIZATION)
          - DÀNH CHO HỌC SINH: Không bị tự ti, truyền cảm hứng, growth mindset
          - DÀNH CHO GIẢNG VIÊN: Đơn giản, thực chiến, ra quyết định sư phạm nhanh
      ========================================================================= */}
      {showFinalBloomReport && (
        <div className="mx-3 sm:mx-5 mb-6 bg-[#FAF8F5] border-2 border-[#1B4338] rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150 shadow-md">
          {/* HEADER CHUYỂN ĐỔI GÓC NHÌN */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2D9C8] pb-4">
            <div className="flex items-center gap-3">
              <TutorLamAvatar size="sm" className="shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4338] bg-[#EBF7F3] px-2.5 py-0.5 rounded-md">
                    Toán 12 · Bài 1.1: Vectơ trong không gian (Thầy Nguyễn Phan Tiến)
                  </span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#1E242B] pt-0.5">
                  {showTeacherAnalytics
                    ? 'Bảng Thống kê Sư phạm & Quản trị Lớp học (Teacher Analytics)'
                    : 'Hành trình Trưởng thành & Bản đồ Năng lực (Student Growth View)'}
                </h3>
              </div>
            </div>

            {/* TAB SELECTOR: HỌC SINH VS GIẢNG VIÊN */}
            <div className="flex items-center bg-[#ECE4D4] p-1 rounded-xl gap-1 text-xs font-semibold shadow-inner">
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setShowTeacherAnalytics(false);
                }}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                  !showTeacherAnalytics
                    ? 'bg-white text-[#1B4338] font-bold shadow-xs'
                    : 'text-[#6E6254] hover:text-[#1E242B]'
                }`}
              >
                <GoldenStarIcon className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Góc nhìn Học sinh (Khích lệ)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setShowTeacherAnalytics(true);
                }}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                  showTeacherAnalytics
                    ? 'bg-[#1B4338] text-white font-bold shadow-xs'
                    : 'text-[#6E6254] hover:text-[#1E242B]'
                }`}
              >
                <ChalkboardIcon className="w-3.5 h-3.5" />
                <span>Góc nhìn Giảng viên (Đơn giản)</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              VIEW 1: DÀNH CHO HỌC SINH (KHÔNG TỰ TI, GIÀU ĐỘNG LỰC, GROWTH MINDSET)
          ========================================================================= */}
          {!showTeacherAnalytics ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* LỜI NHẮN NHỦ ẤM ÁP TỪ CÔ LAM & BO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#EBF7F3] border border-[#2E6859] flex items-start gap-3 shadow-2xs">
                  <TutorLamAvatar size="sm" className="scale-75 -ml-2 shrink-0" />
                  <div className="text-xs text-[#1B4338] leading-relaxed">
                    <span className="font-bold block text-sm mb-0.5 text-[#1B4338]">
                      Cô Lam nhắn nhủ:
                    </span>
                    “Thầy cô rất tự hào về con! Mọi vấp váp ban đầu ở điểm dừng 37:13 chỉ là bước đệm quý giá để con hiểu sâu bản chất toán học. Con đã dũng cảm đối chất, làm chủ thực nghiệm và thậm chí tự thiết kế được đề toán mới!”
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FFFBF2] border border-[#E8A33D] flex items-start gap-3 shadow-2xs">
                  <BoAvatar size="sm" expression="happy" className="scale-75 -ml-2 shrink-0" />
                  <div className="text-xs text-[#92400E] leading-relaxed">
                    <span className="font-bold block text-sm mb-0.5 text-[#92400E]">
                      Lời cảm ơn từ Bo:
                    </span>
                    “Cảm ơn bạn gia sư nhí nhiều lắm! Nhờ bạn chỉ giáo khẩu quyết và quy tắc thế mà từ nay mình không bao giờ sợ bị lừa ở các câu hỏi bẫy vectơ nữa. Bạn giảng bài dễ hiểu hơn cả sách giáo khoa!”
                  </div>
                </div>
              </div>

              {/* BẢN ĐỒ THÁP NĂNG LỰC BLOOM TĂNG TIẾN (GROWTH STAIRCASE) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrainIcon className="w-4 h-4 text-[#1B4338]" />
                    <span className="font-bold text-xs sm:text-sm text-[#1E242B]">
                      Tháp Năng lực Bloom con đã chinh phục thành công:
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#1B4338] bg-[#EBF7F3] px-2 py-0.5 rounded">
                    100% Mastered · Không còn góc khuất ngộ nhận
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                  {/* Bậc 1 & 2 */}
                  <div className="p-3 rounded-xl bg-white border border-[#E2D9C8] hover:border-[#1B4338] transition-all space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#6E6254] bg-[#F5EFE6] px-1.5 py-0.5 rounded">
                        Bậc 1 & 2
                      </span>
                      <CheckCircleIcon className="w-4 h-4 text-[#1B4338]" />
                    </div>
                    <div className="font-bold text-xs text-[#1E242B]">Thấu hiểu nền tảng</div>
                    <p className="text-[11px] text-[#6E6254] leading-snug">
                      Phân biệt rành mạch giữa độ dài vô hướng và hướng của vectơ không gian.
                    </p>
                    <div className="text-[10px] font-bold text-[#1B4338] pt-1">
                      🌱 Vững chắc nền móng
                    </div>
                  </div>

                  {/* Bậc 3 */}
                  <div className="p-3 rounded-xl bg-white border border-[#E2D9C8] hover:border-[#155E75] transition-all space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#155E75] bg-[#E0F2FE] px-1.5 py-0.5 rounded">
                        Bậc 3: Apply
                      </span>
                      <CheckCircleIcon className="w-4 h-4 text-[#155E75]" />
                    </div>
                    <div className="font-bold text-xs text-[#1E242B]">Vận dụng linh hoạt</div>
                    <p className="text-[11px] text-[#6E6254] leading-snug">
                      Gom vectơ theo quy tắc nối tiếp & quy tắc thế để tính độ dài đường chéo.
                    </p>
                    <div className="text-[10px] font-bold text-[#155E75] pt-1">
                      📐 Thuần thục kỹ năng
                    </div>
                  </div>

                  {/* Bậc 4 */}
                  <div className="p-3 rounded-xl bg-white border border-[#E2D9C8] hover:border-[#92400E] transition-all space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                        Bậc 4: Analyze
                      </span>
                      <CheckCircleIcon className="w-4 h-4 text-[#92400E]" />
                    </div>
                    <div className="font-bold text-xs text-[#1E242B]">Thám tử bắt lỗi</div>
                    <p className="text-[11px] text-[#6E6254] leading-snug">
                      Phát hiện chính xác lỗi quên lộn ngược thứ tự đỉnh trong quy tắc trừ của Bo.
                    </p>
                    <div className="text-[10px] font-bold text-[#92400E] pt-1">
                      🔍 Tinh tường & thấu đáo
                    </div>
                  </div>

                  {/* Bậc 5 */}
                  <div className="p-3 rounded-xl bg-white border border-[#E2D9C8] hover:border-[#9D174D] transition-all space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#9D174D] bg-[#FCE7F3] px-1.5 py-0.5 rounded">
                        Bậc 5: Evaluate
                      </span>
                      <CheckCircleIcon className="w-4 h-4 text-[#9D174D]" />
                    </div>
                    <div className="font-bold text-xs text-[#1E242B]">Phản biện sắc bén</div>
                    <p className="text-[11px] text-[#6E6254] leading-snug">
                      Bẻ gãy bẫy ngây thơ |a+b| = |a|+|b| tại phút 37:13 bằng tam giác vuông & POE.
                    </p>
                    <div className="text-[10px] font-bold text-[#9D174D] pt-1">
                      🛡️ Bản lĩnh vững vàng
                    </div>
                  </div>

                  {/* Bậc 6 */}
                  <div className="p-3 rounded-xl bg-[#FFFBF2] border-2 border-[#E8A33D] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                        Bậc 6: Create
                      </span>
                      <GoldenStarIcon className="w-4 h-4 text-[#D97706]" />
                    </div>
                    <div className="font-bold text-xs text-[#92400E]">Kiến tạo toán học</div>
                    <p className="text-[11px] text-[#4B5563] leading-snug">
                      Tự sáng tạo bài toán đẳng thức hình hộp mới và bảo vệ thành công trước lớp!
                    </p>
                    <div className="text-[10px] font-bold text-[#B45309] pt-1">
                      🌟 Đỉnh cao nhận thức
                    </div>
                  </div>
                </div>
              </div>

              {/* THẺ SIÊU NĂNG LỰC: PROTÉGÉ RETENTION BOOST (+40% GHI NHỚ) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#EBF7F3] to-[#F2FCFE] border border-[#2E6859] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B4338] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <TeacherHatIcon className="w-5 h-5 text-[#F5D65D]" />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1B4338]">
                        Siêu năng lực: Protégé Retention Boost (+40% Trí nhớ Dài hạn)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#1B4338] text-white font-mono text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[#374151] leading-relaxed">
                      Khoa học sư phạm chứng minh: Khi con dạy lại cho Bo ở Trạm 4, não bộ đã chuyển hóa tri thức từ trí nhớ ngắn hạn sang <strong>trí nhớ dài hạn vĩnh viễn</strong>. Con sẽ không bao giờ quên bài học này khi đi thi!
                    </p>
                  </div>
                </div>
                <RubberStampSuccess className="scale-75 shrink-0" />
              </div>
            </div>
          ) : (
            /* =========================================================================
                VIEW 2: DÀNH CHO GIẢNG VIÊN (ĐƠN GIẢN, THỰC CHIẾN, RA QUYẾT ĐỊNH NHANH)
            ========================================================================= */
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* 3 THẺ KPI SƯ PHẠM CỐT LÕI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E2D9C8] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#6E6254] uppercase tracking-wide">
                    Tỷ lệ Vượt Bẫy Ngộ nhận
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1B4338]">
                    100% <span className="text-xs font-normal text-[#4E9B87]">(4/4 Trạm)</span>
                  </div>
                  <p className="text-[11px] text-[#6E6254]">
                    Đã xóa bỏ hoàn toàn bẫy cộng đại số |a+b| và bẫy chiều quy tắc trừ.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E2D9C8] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#6E6254] uppercase tracking-wide">
                    Đỉnh Nhận thức Bloom
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#D97706]">
                    Level 6 <span className="text-xs font-normal text-[#B45309]">(Create — Tối đa)</span>
                  </div>
                  <p className="text-[11px] text-[#6E6254]">
                    Năng lực tự thiết kế bài toán đẳng thức vectơ không gian chuẩn tắc.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E2D9C8] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#6E6254] uppercase tracking-wide">
                    Khả năng Duy trì (Retention)
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#2563EB]">
                    +40% <span className="text-xs font-normal text-[#3B82F6]">(Protégé Effect)</span>
                  </div>
                  <p className="text-[11px] text-[#6E6254]">
                    Trạng thái ACTIVE nhờ hoàn tất nhiệm vụ gia sư nhí dạy kèm cho Bo.
                  </p>
                </div>
              </div>

              {/* [1] BẢN ĐỒ ĐÁNH GIÁ 6 CẤP ĐỘ NHẬN THỨC (BLOOM'S TAXONOMY DIAGNOSTICS) */}
              <div className="bg-white rounded-xl border border-[#E2D9C8] overflow-hidden shadow-2xs">
                <div className="bg-[#FAF8F5] px-4 py-2.5 border-b border-[#E2D9C8] flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm text-[#1E242B] flex items-center gap-1.5">
                    <BrainIcon className="w-4 h-4 text-[#1B4338]" />
                    <span>[1] BẢN ĐỒ ĐÁNH GIÁ 6 CẤP ĐỘ NHẬN THỨC (BLOOM'S TAXONOMY DIAGNOSTICS)</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#1B4338] bg-[#EBF7F3] px-2 py-0.5 rounded">
                    Khảo sát chuẩn hoá
                  </span>
                </div>

                <div className="divide-y divide-[#EFE8DC] text-xs">
                  {/* L1 & L2 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors">
                    <div className="space-y-0.5 sm:w-1/3">
                      <div className="font-bold text-[#1E242B]">Level 1 & 2: Remember & Understand</div>
                      <div className="text-[11px] text-[#6E6254]">Định nghĩa vectơ không gian & độ dài</div>
                    </div>
                    <div className="sm:w-1/4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-[#EBF7F3] text-[#1B4338] font-mono font-bold text-[11px] border border-[#BFE6DC]">
                        CONSOLIDATED
                      </span>
                    </div>
                    <div className="text-[11px] text-[#4B5563] sm:w-5/12">
                      Đã nắm vững định nghĩa, hướng và các quy tắc cơ bản không bị nhầm lẫn.
                    </div>
                  </div>

                  {/* L3 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors">
                    <div className="space-y-0.5 sm:w-1/3">
                      <div className="font-bold text-[#1E242B]">Level 3: Apply (Vận dụng)</div>
                      <div className="text-[11px] text-[#6E6254]">Quy tắc nối tiếp & quy tắc thế vectơ</div>
                    </div>
                    <div className="sm:w-1/4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-[#EBF7F3] text-[#1B4338] font-mono font-bold text-[11px] border border-[#BFE6DC]">
                        CONSOLIDATED
                      </span>
                    </div>
                    <div className="text-[11px] text-[#4B5563] sm:w-5/12">
                      Áp dụng đúng quy tắc thế để gom hai vectơ vuông góc về đường chéo chính.
                    </div>
                  </div>

                  {/* L4 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors">
                    <div className="space-y-0.5 sm:w-1/3">
                      <div className="font-bold text-[#1E242B]">Level 4: Analyze (Bắt lỗi sai)</div>
                      <div className="text-[11px] text-[#6E6254]">Quy tắc trừ chung gốc ở Bước 2 bài Bo</div>
                    </div>
                    <div className="sm:w-1/4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#92400E] font-mono font-bold text-[11px] border border-[#FDE68A]">
                        THOROUGH
                      </span>
                    </div>
                    <div className="text-[11px] text-[#4B5563] sm:w-5/12">
                      Bắt trúng lỗi sai quy tắc hiệu: OA − OB phải bằng BA (không phải AB).
                    </div>
                  </div>

                  {/* L5 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors">
                    <div className="space-y-0.5 sm:w-1/3">
                      <div className="font-bold text-[#1E242B]">Level 5: Evaluate (Phản biện)</div>
                      <div className="text-[11px] text-[#6E6254]">Bẻ gãy bẫy độ dài tổng tại phút 37:13</div>
                    </div>
                    <div className="sm:w-1/4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-[#FCE7F3] text-[#9D174D] font-mono font-bold text-[11px] border border-[#FBCFE8]">
                        SHARP_REBUTTAL
                      </span>
                    </div>
                    <div className="text-[11px] text-[#4B5563] sm:w-5/12">
                      Bẻ gãy bẫy ngộ nhận |a+b| = |a|+|b| bằng đối chứng tam giác vuông và POE.
                    </div>
                  </div>

                  {/* L6 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors">
                    <div className="space-y-0.5 sm:w-1/3">
                      <div className="font-bold text-[#1E242B]">Level 6: Create (Tự ra đề mới)</div>
                      <div className="text-[11px] text-[#6E6254]">Thiết kế đẳng thức vectơ không gian</div>
                    </div>
                    <div className="sm:w-1/4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-[#E0E7FF] text-[#3730A3] font-mono font-bold text-[11px] border border-[#C7D2FE]">
                        PASSED
                      </span>
                    </div>
                    <div className="text-[11px] text-[#4B5563] sm:w-5/12">
                      Thiết kế chuẩn: <code className="font-mono text-[#1B4338] font-bold">AB + AD + AA' = AC'</code> và vượt qua kiểm định của cả lớp.
                    </div>
                  </div>

                  {/* Retention Boost */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors">
                    <div className="space-y-0.5 sm:w-1/3">
                      <div className="font-bold text-[#1E242B]">Protégé Retention Boost</div>
                      <div className="text-[11px] text-[#6E6254]">Đúc kết bí kíp dạy kèm lại cho Bo</div>
                    </div>
                    <div className="sm:w-1/4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-[#DCFCE7] text-[#15803D] font-mono font-bold text-[11px] border border-[#BBF7D0]">
                        ACTIVE
                      </span>
                    </div>
                    <div className="text-[11px] text-[#4B5563] sm:w-5/12">
                      Đã đúc kết bí kíp cho bạn học, gia tăng hiệu quả lưu trữ tri thức dài hạn.
                    </div>
                  </div>
                </div>
              </div>

              {/* [2] NHẬT KÝ THỰC THI HỆ THỐNG (AGENT ACTION LAYER & EVENT LOGS) */}
              <div className="bg-white rounded-xl border border-[#E2D9C8] overflow-hidden shadow-2xs">
                <div className="bg-[#FAF8F5] px-4 py-2.5 border-b border-[#E2D9C8] flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm text-[#1E242B] flex items-center gap-1.5">
                    <LightningZapIcon className="w-4 h-4 text-[#D97706]" />
                    <span>[2] NHẬT KÝ THỰC THI HỆ THỐNG (AGENT ACTION LAYER & EVENT LOGS)</span>
                  </span>
                  <span className="text-[11px] text-[#6E6254]">
                    6/6 Sự kiện sư phạm đã xác thực
                  </span>
                </div>

                <div className="p-3 sm:p-4 space-y-2.5">
                  {[
                    {
                      num: "1",
                      station: "Trạm 1 · 37:13",
                      action: "create_review_task",
                      target: "VID_VECTO_12",
                      detail: "Test nhánh Skip: skipped_not_mastered (Kiểm tra phản xạ bẫy ban đầu)"
                    },
                    {
                      num: "2",
                      station: "Trạm 1 · 37:13",
                      action: "create_learning_record",
                      target: "VID_VECTO_12",
                      detail: "Bloom: Evaluate | Sharp Rebuttal (Bẻ gãy ngộ nhận độ dài của Bo)"
                    },
                    {
                      num: "3",
                      station: "Trạm 1 · 37:13",
                      action: "update_mastery_state",
                      target: "MASTERED",
                      detail: "Đã mở khóa quy tắc vàng Cô Lam & công nhận mức độ làm chủ kiến thức"
                    },
                    {
                      num: "4",
                      station: "Trạm 2 · VD 10",
                      action: "create_learning_record",
                      target: "ALG_VECTO_SUB",
                      detail: "Bloom: Analyze | Thorough Diagnosis (Bắt trúng lỗi quy tắc hiệu ở Bước 2)"
                    },
                    {
                      num: "5",
                      station: "Trạm 3 · VD 08",
                      action: "create_learning_record",
                      target: "POE_VECTO_DIR",
                      detail: "Bloom: Evaluate | Ngược hướng hệ số âm k = -3 (Thực nghiệm POE thành công)"
                    },
                    {
                      num: "6",
                      station: "Trạm 4 · Create",
                      action: "create_learning_record",
                      target: "CUSTOM_EQ_3D",
                      detail: "Bloom: Create | Passed Validation (Hội đồng 5 tác nhân phê duyệt đề mới)"
                    }
                  ].map((evt) => (
                    <div
                      key={evt.num}
                      className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5] flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#1B4338] text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {evt.num}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-bold text-[10px]">
                              {evt.station}
                            </span>
                            <code className="font-mono font-bold text-[#1B4338]">{evt.action}</code>
                            <span className="text-[#8A7D6F]">➔</span>
                            <span className="font-mono font-semibold text-[#0E7490]">{evt.target}</span>
                          </div>
                          <p className="text-[11px] text-[#4B5563] mt-1 leading-snug">{evt.detail}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#15803D] font-mono font-bold shrink-0 bg-[#DCFCE7] px-2 py-0.5 rounded">
                        RECORDED
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KHUYẾN NGHỊ SƯ PHẠM NHANH CHO GIẢNG VIÊN */}
              <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] flex items-start gap-3">
                <TeacherHatIcon className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                <div className="text-xs text-[#166534] leading-relaxed">
                  <span className="font-bold block text-sm mb-0.5 text-[#15803D]">
                    Khuyến nghị Sư phạm Tiếp theo của Hệ thống:
                  </span>
                  Học sinh đã hoàn thành trọn vẹn tháp nhận thức Bloom (từ Thấu hiểu đến Sáng tạo đề mới) và đạt điểm bão hòa nhận thức về Vectơ trong không gian. <strong>Khuyến nghị:</strong> Mở khóa chuyên đề tiếp theo (Tích vô hướng trong không gian & Hệ tọa độ Oxyz) hoặc phân công học sinh làm <strong>Trưởng nhóm Peer Tutor</strong> hỗ trợ các bạn còn vướng ngộ nhận.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
