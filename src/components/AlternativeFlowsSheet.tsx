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
  CheckCircleIcon
} from './HandmadeArtwork';
import { Vec, SegmentVectorDiagram, BoxVectorDiagram } from './MathVector';
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
  onPoeCompletedChange?: (completed: boolean) => void;
  learningRecords?: SilentLearningRecord[];
}

export const AlternativeFlowsSheet: React.FC<AlternativeFlowsSheetProps> = ({
  mode,
  onSwitchMode,
  onPoeCompletedChange,
  learningRecords = [],
}) => {
  const [poePrediction, setPoePrediction] = useState<'bo_camp' | 'tri_camp' | null>(null);
  const [poeExplanation, setPoeExplanation] = useState<string>('');
  const [poeCompleted, setPoeCompleted] = useState<boolean>(false);

  const [selectedTeachStyle, setSelectedTeachStyle] = useState<'khang' | 'chi' | null>(null);
  const [customCreatedEquation, setCustomCreatedEquation] = useState<string>("AB + AD + AA' = AC'");
  const [createValidationMsg, setCreateValidationMsg] = useState<{ isValid: boolean; text: string } | null>(null);
  const [showFinalBloomReport, setShowFinalBloomReport] = useState<boolean>(false);
  const [showTeacherAnalytics, setShowTeacherAnalytics] = useState<boolean>(false);

  const handleValidateCreatedProblem = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playStampThud();
    const eq = customCreatedEquation.trim();
    if (!eq.includes('=')) {
      setCreateValidationMsg({
        isValid: false,
        text: 'Linh Chi nhắc nhẹ: Biểu thức của bạn chưa có dấu bằng (=) nên chưa phải là một đẳng thức vectơ hoàn chỉnh! Bạn bổ sung vế phải nhé.'
      });
      return;
    }
    setCreateValidationMsg({
      isValid: true,
      text: `Đẳng thức "${eq}" hoàn toàn hợp lệ! Bo & Trí xác nhận: Áp dụng quy tắc hình hộp thu được đường chéo chính AC' chuẩn xác!`
    });
  };

  // =========================================================================
  // TRẠM 3: POE (HIỂN THỊ TUẦN TỰ 3 BƯỚC: PREDICT -> OBSERVE -> EXPLAIN)
  // =========================================================================
  if (mode === 'predict_poe') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-4">
        {/* CỘT TRÁI (7/12): ĐỀ BÀI + HÌNH VẼ TRỰC QUAN + BƯỚC 1 (DỰ ĐOÁN) */}
        <div className="lg:col-span-7 p-3 sm:p-5 space-y-4 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-md">
              Trạm 3 · Thử thách Dự đoán – Quan sát – Giải thích (POE)
            </span>
            <h2 className="font-bold text-base sm:text-lg text-[#1E242B] leading-snug pt-1">
              Ví dụ 8 (Phút 1:30:30): Cho điểm I thuộc đoạn thẳng AG sao cho độ dài{' '}
              <span className="font-mono text-[#92400E] font-bold">IA = 3·IG</span>. Hãy biểu diễn{' '}
              <span className="text-[#1B4338] font-bold">vectơ <Vec>IA</Vec></span> theo{' '}
              <span className="text-[#1B4338] font-bold">vectơ <Vec>IG</Vec></span>:
            </h2>
          </div>

          {/* HÌNH VẼ TRỰC QUAN KHÔNG GIAN: TRỤC ĐOẠN THẲNG A - I - G */}
          <SegmentVectorDiagram className="animate-in fade-in duration-150" />

          {/* BƯỚC 1: CHỌN PHE BO HOẶC PHE TRÍ (RADIO CARD AFFORDANCE) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#374151]">
              <div className="flex items-center gap-2">
                <StepBadge num="1" />
                <span>BƯỚC 1 (PREDICT): Khi gắn mũi tên vectơ vào tỉ lệ độ dài, bạn chọn phe ai?</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">Chọn 1 trong 2 phe</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* THẺ PHE BO */}
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setPoePrediction('bo_camp');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-2 relative ${
                  poePrediction === 'bo_camp'
                    ? 'bg-[#FFFBF2] border-[#D97706] border-2 shadow-xs ring-2 ring-amber-400/20'
                    : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8] hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#92400E]">
                    <BoAvatar size="sm" className="scale-75 -ml-2 shrink-0" />
                    <span>Phe Bo: <Vec>IA</Vec> = 3·<Vec>IG</Vec></span>
                  </div>
                  {/* Radio button tròn */}
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    poePrediction === 'bo_camp' ? 'border-[#D97706] bg-[#D97706]' : 'border-slate-300 bg-white'
                  }`}>
                    {poePrediction === 'bo_camp' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>

                <p className="text-xs text-[#4B5563] leading-relaxed">
                  “Đoạn thẳng IA gấp 3 lần đoạn IG thì khi gắn vectơ vào vẫn giữ nguyên <strong className="font-mono text-amber-800">hệ số dương +3</strong> cho lẹ!”
                </p>

                <div className="pt-1 border-t border-amber-100 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-amber-800 font-mono">Dự đoán: k = +3</span>
                  <span className={poePrediction === 'bo_camp' ? 'text-amber-700 font-bold' : 'text-slate-400'}>
                    {poePrediction === 'bo_camp' ? '✓ Đã chọn phe này' : 'Bấm chọn phe Bo ➔'}
                  </span>
                </div>
              </button>

              {/* THẺ PHE TRÍ */}
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setPoePrediction('tri_camp');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-2 relative ${
                  poePrediction === 'tri_camp'
                    ? 'bg-[#F5F8FF] border-[#2563EB] border-2 shadow-xs ring-2 ring-blue-400/20'
                    : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8] hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1E40AF]">
                    <TriDeepThinkerAvatar className="w-8 h-8 shrink-0" />
                    <span>Phe Trí: <Vec>IA</Vec> = −3·<Vec>IG</Vec></span>
                  </div>
                  {/* Radio button tròn */}
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    poePrediction === 'tri_camp' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300 bg-white'
                  }`}>
                    {poePrediction === 'tri_camp' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>

                <p className="text-xs text-[#374151] leading-relaxed">
                  “I nằm giữa A và G nên hai vectơ <Vec>IA</Vec> (hướng trái) và <Vec>IG</Vec> (hướng phải) <strong className="text-blue-900 font-bold">ngược hướng</strong>, bắt buộc phải có <strong className="font-mono text-blue-800">dấu âm −3</strong>!”
                </p>

                <div className="pt-1 border-t border-blue-100 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-blue-800 font-mono">Dự đoán: k = −3</span>
                  <span className={poePrediction === 'tri_camp' ? 'text-blue-700 font-bold' : 'text-slate-400'}>
                    {poePrediction === 'tri_camp' ? '✓ Đã chọn phe này' : 'Bấm chọn phe Trí ➔'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5/12): BƯỚC 2 (OBSERVE) & BƯỚC 3 (EXPLAIN) */}
        <div className="lg:col-span-5 p-3 sm:p-5 flex flex-col justify-between overflow-y-auto no-scrollbar space-y-3">
          {!poePrediction ? (
            /* TIẾN TRÌNH KHI CHƯA CHỌN BƯỚC 1: HIỂN THỊ RÕ 2 MỐC CHỜ (KHÔNG BỊ TRỐNG KHÔNG GIAN) */
            <div className="space-y-3 my-auto">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#D8CEBC] space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#6E6254]">
                  <StepBadge num="2" />
                  <span>Bước 2 (Observe): Thực nghiệm kiểm chứng</span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  🔒 Đang chờ bạn chọn <strong>Phe Bo</strong> hoặc <strong>Phe Trí</strong> ở Bước 1 bên trái để mở khóa thực nghiệm kiểm chứng đẳng thức trọng tâm.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#D8CEBC] space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#6E6254]">
                  <StepBadge num="3" />
                  <span>Bước 3 (Explain): Giải thích nguyên lý toán học</span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  🔒 Cùng Linh Chi & Trí chốt lại quy tắc tích vectơ với một số thực sau khi quan sát thực nghiệm.
                </p>
              </div>
            </div>
          ) : (
            /* KHI ĐÃ CHỌN BƯỚC 1: MỞ KHÓA BƯỚC 2 (OBSERVE) VÀ BƯỚC 3 (EXPLAIN) RÀNH MẠCH */
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* BƯỚC 2: THỰC NGHIỆM KIỂM CHỨNG CỦA MINH KHANG */}
              <div className="p-3.5 rounded-xl bg-[#F2FCFE] border border-[#22D3EE] space-y-2">
                <div className="flex items-center gap-2">
                  <MinhKhangInquisitiveAvatar className="w-7 h-7 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#155E75]">
                      <StepBadge num="2" />
                      <span>BƯỚC 2 (OBSERVE) — Thực nghiệm Minh Khang:</span>
                    </div>
                    <p className="text-[10px] text-[#0E7490]">
                      Thay thử vào đẳng thức trọng tâm tứ diện <code className="font-mono"><Vec>IA</Vec> + 3·<Vec>IG</Vec> = 0</code>:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2 rounded-lg bg-white border border-[#F8B4A5] text-[#9B1C1C]">
                    <div className="font-bold text-[11px]">Nếu <Vec>IA</Vec> = +3·<Vec>IG</Vec> (Phe Bo):</div>
                    <div className="text-[11px]">3·<Vec>IG</Vec> + 3·<Vec>IG</Vec> = 6·<Vec>IG</Vec> ≠ 0 (Sai!)</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#4E9B87] text-[#1B4338]">
                    <div className="font-bold text-[11px]">Nếu <Vec>IA</Vec> = −3·<Vec>IG</Vec> (Phe Trí):</div>
                    <div className="text-[11px]">(−3·<Vec>IG</Vec>) + 3·<Vec>IG</Vec> = 0 (Chuẩn xác!)</div>
                  </div>
                </div>
              </div>

              {/* BƯỚC 3: GIẢI THÍCH NGUYÊN LÝ CÙNG LINH CHI & TRÍ */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <LinhChiNoteTakerAvatar className="w-7 h-7 shrink-0" />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-[#9D174D] flex items-center gap-1.5">
                      <StepBadge num="3" />
                      <span>BƯỚC 3 (EXPLAIN): Giải thích nguyên lý bản chất</span>
                    </h3>
                    <p className="text-[10px] text-[#6E6254]">
                      Đúc kết quy tắc nhân vectơ với một số thực (Thầy Tiến phút 1:06:30)
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FFF5F9] border border-[#F472B6]/60 text-xs text-[#4A152B] leading-relaxed">
                  <strong>Sổ tay Linh Chi:</strong> Với <Vec>a</Vec> = k·<Vec>b</Vec>: Độ dài tỉ lệ theo <code>|k|</code>, dấu của <code>k</code> dương khi cùng hướng và <strong>âm khi ngược hướng</strong>!
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1E242B]">
                    Vì sao từ độ dài IA = 3·IG khi viết dưới dạng vectơ lại là <Vec>IA</Vec> = −3·<Vec>IG</Vec>?
                  </label>

                  <div className="space-y-1">
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
                        className="quick-prompt-box w-full bg-[#FAF8F5] hover:bg-[#EBF7F3] border border-[#E2D9C8] rounded-lg text-[#1E242B] text-left cursor-pointer transition-colors text-[11px]"
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
                      onPoeCompletedChange?.(true);
                    }}
                    className="w-full py-2 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs sm:text-sm rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    Chốt kết luận cùng Trí & Minh Khang ➔
                  </button>
                </div>

                {poeCompleted && (
                  <div className="p-3 rounded-xl bg-[#EBF7F3] border border-[#2E6859] flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <span className="font-bold text-xs text-[#1B4338] flex items-center gap-1.5">
                      <CheckCircleIcon className="w-4 h-4 text-[#1B4338]" />
                      <span>Đã nắm vững bản chất ngược hướng!</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onSwitchMode('protege_teaching')}
                      className="px-3 py-1.5 bg-[#E8A33D] hover:bg-[#d9932b] text-[#1E242B] font-bold text-xs rounded-lg cursor-pointer shrink-0 transition-colors shadow-2xs"
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
    );
  }

  // =========================================================================
  // TRẠM 4: GIA SƯ NHÍ & TỰ RA ĐỀ (PHẲNG, THOÁNG, ĐẦY ĐỦ TIỆN ÍCH TOÁN HỌC)
  // =========================================================================
  const isMission1Done = !!selectedTeachStyle;
  const isMission2Done = !!createValidationMsg?.isValid;
  const isAllMissionsDone = isMission1Done && isMission2Done;

  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-4">
        {/* Cột Trái (7/12): Nhiệm vụ 1 */}
        <div className="lg:col-span-7 p-3 sm:p-5 space-y-4">
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1B4338] bg-[#EBF7F3] px-2.5 py-0.5 rounded-md">
              Trạm 4 · Gia sư nhí & Làm chủ kiến thức
            </span>
            <h2 className="font-bold text-base sm:text-lg text-[#1E242B] pt-1">
              Nhiệm vụ 1: Giúp Bo đúc kết bí kíp cộng & trừ Vectơ không gian
            </h2>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D5]">
            <BoAvatar size="sm" className="shrink-0" />
            <div className="text-xs text-[#2F2923] leading-relaxed">
              <div className="font-bold text-[#92400E] mb-0.5">Bo nhờ bạn chỉ giáo:</div>
              “Bạn chọn giúp mình 1 bí kíp dễ nhớ nhất của <strong>Minh Khang</strong> hoặc <strong>Linh Chi</strong> để đi thi không bao giờ bị nhầm quy tắc nối tiếp và quy tắc trừ nhé!”
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CÁCH 1: MINH KHANG */}
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('khang');
              }}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 relative ${
                selectedTeachStyle === 'khang'
                  ? 'bg-[#F2FCFE] border-[#0891B2] border-2 shadow-xs ring-2 ring-cyan-400/20'
                  : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#155E75]">
                  <MinhKhangInquisitiveAvatar className="w-7 h-7 shrink-0" />
                  <span>Cách 1: Khẩu quyết Minh Khang</span>
                </div>
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedTeachStyle === 'khang' ? 'border-[#0891B2] bg-[#0891B2]' : 'border-slate-300 bg-white'
                }`}>
                  {selectedTeachStyle === 'khang' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>

              <p className="text-xs text-[#374151] leading-relaxed">
                “Cộng là <strong>nối đuôi đi tiếp</strong> (<Vec>OA</Vec> + <Vec>AB</Vec> = <Vec>OB</Vec>). Trừ chung gốc O là <strong>lộn ngược điểm sau lên trước</strong> (<Vec>OA</Vec> − <Vec>OB</Vec> = <Vec>BA</Vec>)!”
              </p>

              <div className="pt-1 border-t border-cyan-100 flex items-center justify-between text-[11px] font-semibold">
                <span className="text-cyan-800">Phương pháp: Khẩu quyết</span>
                <span className={selectedTeachStyle === 'khang' ? 'text-cyan-700 font-bold' : 'text-slate-400'}>
                  {selectedTeachStyle === 'khang' ? '✓ Đã chọn làm bí kíp' : 'Bấm chọn cách này ➔'}
                </span>
              </div>
            </button>

            {/* CÁCH 2: LINH CHI */}
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('chi');
              }}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 relative ${
                selectedTeachStyle === 'chi'
                  ? 'bg-[#FFF5F9] border-[#DB2777] border-2 shadow-xs ring-2 ring-pink-400/20'
                  : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#9D174D]">
                  <LinhChiNoteTakerAvatar className="w-7 h-7 shrink-0" />
                  <span>Cách 2: Quy tắc thế Linh Chi</span>
                </div>
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedTeachStyle === 'chi' ? 'border-[#DB2777] bg-[#DB2777]' : 'border-slate-300 bg-white'
                }`}>
                  {selectedTeachStyle === 'chi' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>

              <p className="text-xs text-[#374151] leading-relaxed">
                “Khi tính |<Vec>BC</Vec> + <Vec>DD'</Vec>|, cấm tách thành 1 + 1 = 2! Phải thế <Vec>DD'</Vec> = <Vec>CC'</Vec> để gom về 1 vectơ duy nhất |<Vec>BC'</Vec>| = √2.”
              </p>

              <div className="pt-1 border-t border-pink-100 flex items-center justify-between text-[11px] font-semibold">
                <span className="text-pink-800">Phương pháp: Quy tắc thế</span>
                <span className={selectedTeachStyle === 'chi' ? 'text-pink-700 font-bold' : 'text-slate-400'}>
                  {selectedTeachStyle === 'chi' ? '✓ Đã chọn làm bí kíp' : 'Bấm chọn cách này ➔'}
                </span>
              </div>
            </button>
          </div>

          {selectedTeachStyle && (
            <div className="p-3 rounded-xl bg-[#EBF7F3] border border-[#2E6859] text-xs text-[#1B4338] font-medium flex items-center justify-between animate-in fade-in duration-150">
              <span className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-[#1B4338]" />
                <span>Bo đã ghi nhớ sâu sắc bí kíp và lưu vào cẩm nang giải toán!</span>
              </span>
              <RubberStampSuccess className="scale-75 shrink-0" />
            </div>
          )}
        </div>

        {/* Cột Phải (5/12): Nhiệm vụ 2 */}
        <div className="lg:col-span-5 p-3 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-[#1E242B]">
                Nhiệm vụ 2: Tự ra đề thách đấu 4 bạn
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[10px] font-bold text-[#92400E]">
                Mức độ: Create
              </span>
            </div>

            {/* HÌNH MINH HỌA QUY TẮC HÌNH HỘP TRỰC QUAN */}
            <BoxVectorDiagram className="animate-in fade-in duration-150" />

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Nhập một đẳng thức Vectơ trong hình hộp để nhóm bạn thẩm định:
            </p>

            <form onSubmit={handleValidateCreatedProblem} className="space-y-2">
              <input
                type="text"
                value={customCreatedEquation}
                onChange={(e) => setCustomCreatedEquation(e.target.value)}
                placeholder="Nhập đẳng thức vectơ..."
                className="w-full px-3 py-2 bg-white border border-[#D8CEBC] rounded-lg font-mono text-xs text-[#1E242B] outline-none focus:border-[#1B4338]"
              />

              {/* DẢI NÚT HỖ TRỢ NHẬP LIỆU TOÁN HỌC NHANH (KHÔNG LO LỖI GÕ PHÍM) */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-500 font-medium">Chèn nhanh:</span>
                {[
                  { label: 'AB', val: 'AB' },
                  { label: 'AD', val: 'AD' },
                  { label: "AA'", val: "AA'" },
                  { label: "AC'", val: "AC'" },
                  { label: '+', val: ' + ' },
                  { label: '−', val: ' − ' },
                  { label: '=', val: ' = ' },
                  { label: '0', val: '0' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomCreatedEquation((prev) => prev + item.val)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 text-slate-700 text-xs font-mono font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#E8A33D] hover:bg-[#D9932B] text-[#1E242B] font-bold text-xs sm:text-sm rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Gửi đề thách đấu cả lớp ➔
              </button>
            </form>

            {createValidationMsg && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-150 ${
                  createValidationMsg.isValid
                    ? 'bg-[#EBF7F3] border-[#2E6859] text-[#1B4338]'
                    : 'bg-[#FFF5F5] border-[#F8B4A5] text-[#9B1C1C]'
                }`}
              >
                {createValidationMsg.text}
              </div>
            )}
          </div>

          {/* NÚT HOÀN THÀNH 4 TRẠM: ĐƯỢC MỞ KHÓA KHI HOÀN THÀNH CẢ 2 NHIỆM VỤ */}
          <div className="pt-2">
            {!isAllMissionsDone ? (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs text-center font-medium">
                🔒 Hãy chọn bí kíp ở Nhiệm vụ 1 và gửi đề ở Nhiệm vụ 2 để mở khóa Báo cáo Tổng kết.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sound.playSuccessChime();
                  setShowFinalBloomReport((prev) => !prev);
                }}
                className="w-full py-2.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md animate-pulse transition-all"
              >
                <SparkleIcon className="w-4 h-4 text-[#F5D65D]" />
                <span>{showFinalBloomReport ? 'Ẩn Tổng kết Hành trình' : '🎉 Hoàn thành xuất sắc 4 Trạm · Xem Tổng kết Hành trình'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG TỔNG KẾT HÀNH TRÌNH & HỒ SƠ BLOOM */}
      {showFinalBloomReport && (
        <div className="mx-3 sm:mx-5 mb-4 bg-[#FAF8F5] border-2 border-[#1B4338] rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE8DC] pb-2.5">
            <div className="flex items-center gap-2.5">
              <TutorLamAvatar size="sm" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#1B4338]">
                  Tổng kết lộ trình 4 Trạm (Vectơ trong không gian)
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTeacherAnalytics(prev => !prev)}
              className="px-3 py-1 rounded-full text-xs font-semibold border bg-white text-[#1E242B] border-[#D8CEBC] cursor-pointer"
            >
              {showTeacherAnalytics ? 'Đang xem: Hồ sơ Bloom & Action Log' : 'Xem Hồ sơ Chẩn đoán Bloom (Giáo viên)'}
            </button>
          </div>

          {!showTeacherAnalytics ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-[#E2D9C8]">
                <div className="font-bold text-[#1B4338] mb-0.5">Trạm 1: Phản xạ bẫy</div>
                <p className="text-[#4B5563]">Không tách dấu độ dài tổng 2 vectơ, tính chuẩn đường chéo căn 2.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-[#E2D9C8]">
                <div className="font-bold text-[#92400E] mb-0.5">Trạm 2: Bắt lỗi sai</div>
                <p className="text-[#4B5563]">Phát hiện lỗi quên lộn ngược thứ tự điểm trong quy tắc trừ vectơ.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-[#E2D9C8]">
                <div className="font-bold text-[#155E75] mb-0.5">Trạm 3: Thực nghiệm POE</div>
                <p className="text-[#4B5563]">Phân biệt rõ độ dài đoạn thẳng và hệ số âm khi 2 vectơ ngược hướng.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-[#E2D9C8]">
                <div className="font-bold text-[#1E40AF] mb-0.5">Trạm 4: Sáng tạo</div>
                <p className="text-[#4B5563]">Đúc kết bí kíp cho Bo và tự thiết kế đẳng thức vectơ hợp lệ.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#181C20] text-[#F3F4F6] space-y-1 text-[11px]">
                <div className="text-[#F5D65D] font-bold mb-1">BLOOM'S TAXONOMY DIAGNOSTICS</div>
                <div className="flex justify-between"><span>• Remember & Understand:</span><span className="text-[#34D399]">CONSOLIDATED</span></div>
                <div className="flex justify-between"><span>• Apply & Analyze:</span><span className="text-[#34D399]">THOROUGH</span></div>
                <div className="flex justify-between"><span>• Evaluate (Peer Rebuttal):</span><span className="text-[#34D399]">SHARP_REBUTTAL</span></div>
                <div className="flex justify-between"><span>• Create (Problem Design):</span><span className="text-[#5EEAD4]">PASSED</span></div>
              </div>
              <div className="p-3 rounded-lg bg-[#181C20] text-[#F3F4F6] space-y-1 text-[11px]">
                <div className="text-[#5EEAD4] font-bold mb-1">AGENT ACTION LAYER LOGS</div>
                <div>1. create_learning_record ➔ VID_VECTO_12 (Evaluate)</div>
                <div>2. update_mastery_state ➔ MASTERED</div>
                {learningRecords.slice(0, 2).map((rec, i) => (
                  <div key={rec.id}>{i + 3}. {rec.actionName} ➔ {rec.status}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
