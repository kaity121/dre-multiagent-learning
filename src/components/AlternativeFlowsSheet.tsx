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
import { sound } from '../utils/soundEffects';

// ============================================================================
// BỘ CUSTOM SVG ICONS TỰ VẼ CHO TRẠM 3 & TRẠM 4 (ZERO KEYBOARD EMOJI)
// ============================================================================
const StepNumberBadgeSvg = ({ num }: { num: string }) => (
  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#1B4338] text-white font-mono text-[11px] font-bold shrink-0 shadow-2xs">
    {num}
  </span>
);

const PoeCompassSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" />
    <path d="M15.5 8.5L13.2 13.2L8.5 15.5L10.8 10.8L15.5 8.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const LabFlaskSvg = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 3.5H15M10.5 3.5V8.5L5.2 17.2C4.4 18.5 5.3 20.2 6.9 20.2H17.1C18.7 20.2 19.6 18.5 18.8 17.2L13.5 8.5V3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 15H16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const TagChipSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3.5 12V5.5C3.5 4.4 4.4 3.5 5.5 3.5H12L20 11.5L12.5 19L3.5 12Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="8" cy="8" r="1.4" fill="currentColor" />
  </svg>
);

const NoteBookFlowerSvg = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.5 8.5H15.5M8.5 12H15.5M8.5 15.5H12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const GradCapSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 4L2.5 9L12 14L21.5 9L12 4Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M6.5 11.5V16.5C6.5 18.2 9 19.5 12 19.5C15 19.5 17.5 18.2 17.5 16.5V11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const TrophyCupSvg = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M7 4H17V10C17 12.76 14.76 15 12 15C9.24 15 7 12.76 7 10V4Z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 15V19.5M8.5 19.5H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 6H4.5V8.5C4.5 10.2 5.6 11.5 7 11.5M17 6H19.5V8.5C19.5 10.2 18.4 11.5 17 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ChartAnalyticsSvg = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 16V12M12 16V8M16 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const WarningTriangleSvg = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 4L2.8 19.5H21.2L12 4Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12 10V14M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
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
  // States cho Trạm 3: POE (Đồng bộ Bài Vectơ không gian của Thầy Tiến - Ví dụ 8 phút 1:30:30)
  const [poePrediction, setPoePrediction] = useState<'bo_camp' | 'tri_camp' | null>(null);
  const [poeExplanation, setPoeExplanation] = useState<string>('');
  const [poeCompleted, setPoeCompleted] = useState<boolean>(false);

  // States cho Trạm 4: Gia sư nhí & Tự tạo đề Vectơ (Bloom Create)
  const [selectedTeachStyle, setSelectedTeachStyle] = useState<'khang' | 'chi' | null>(null);
  const [customCreatedEquation, setCustomCreatedEquation] = useState<string>("AB + AD + AA' = AC'");
  const [createValidationMsg, setCreateValidationMsg] = useState<{ isValid: boolean; text: string } | null>(null);
  const [showFinalBloomReport, setShowFinalBloomReport] = useState<boolean>(false);
  const [showTeacherAnalytics, setShowTeacherAnalytics] = useState<boolean>(false);

  // Kiểm tra đẳng thức vectơ học sinh tự tạo (Test Case 7 & 8 trong Pitch Deck: Thiếu dấu '=' -> Fail Create)
  const handleValidateCreatedProblem = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playStampThud();
    const eq = customCreatedEquation.trim();
    if (!eq.includes('=')) {
      setCreateValidationMsg({
        isValid: false,
        text: 'Linh Chi nhắc nhẹ: Biểu thức vectơ của bạn chưa có dấu bằng (=) nên chưa tạo thành một đẳng thức cần chứng minh! Bạn bổ sung vế phải nhé (Fail Create -> Yêu cầu bổ sung dữ kiện).'
      });
      return;
    }
    setCreateValidationMsg({
      isValid: true,
      text: `Đẳng thức vectơ "${eq}" hoàn toàn hợp lệ! Bo giải thử: Áp dụng quy tắc hình bình hành AB + AD = AC, sau đó cộng nối tiếp với AA' = CC' ta được AC + CC' = AC'! Trí xác nhận: Đủ điều kiện và kết quả chuẩn (Pass Create)!`
    });
  };

  // =========================================================================
  // TRẠM 3: ĐOÁN KẾT QUẢ (POE) — ĐỒNG BỘ BÀI VECTƠ THẦY TIẾN (PHÚT 1:30:30)
  // =========================================================================
  if (mode === 'predict_poe') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative z-10">
        {/* Cột Trái (7/12): Bước 1 (Đặt cược Bo vs Trí) & Bước 2 (Phòng thí nghiệm của Minh Khang) */}
        <div className="lg:col-span-7 bg-[#FFFDF7] border border-[#E2D9C8] rounded-xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="border-b border-[#EFE8DC] pb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FEF8DC] border border-[#D9A716] text-[#7A5B05] font-bold text-xs">
                <PoeCompassSvg className="w-3.5 h-3.5 text-[#B3870E]" />
                <span>TRẠM 3: PREDICT – OBSERVE – EXPLAIN (POE)</span>
              </span>
              <h2 className="font-bold text-base sm:text-lg text-[#1E242B] mt-1.5 leading-snug">
                Ví dụ 8 (Phút 1:30:30): Cho điểm I nằm trên đoạn thẳng AG sao cho độ dài{' '}
                <span className="font-mono text-[#8C5D19]">IA = 3·IG</span>. Hãy biểu diễn{' '}
                <span className="font-mono text-[#1B4338]">vectơ IA</span> theo{' '}
                <span className="font-mono text-[#1B4338]">vectơ IG</span>:
              </h2>
            </div>

            {/* 1. PREDICT: ĐẶT CƯỢC GIỮA PHE BO VÀ PHE TRÍ */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#374151]">
                <StepNumberBadgeSvg num="1" />
                <span>BƯỚC 1 (PREDICT): Khi chuyển từ độ dài đoạn thẳng sang đẳng thức vectơ, bạn đứng về phe ai?</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setPoePrediction('bo_camp');
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer space-y-1.5 ${
                    poePrediction === 'bo_camp'
                      ? 'bg-[#FFFBF2] border-[#D97706] shadow-xs'
                      : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-[#92400E]">
                    <BoAvatar size="sm" className="scale-75 -ml-2 shrink-0" />
                    <span>Phe Bo: IA = 3·IG (Số dương +3)</span>
                  </div>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    “Đề bài ghi rõ đoạn IA gấp 3 lần đoạn IG rồi, cứ thêm dấu vectơ vào là thành IA = 3·IG thôi chứ nghĩ ngợi gì!”
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setPoePrediction('tri_camp');
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer space-y-1.5 ${
                    poePrediction === 'tri_camp'
                      ? 'bg-[#F5F8FF] border-[#2563EB] shadow-xs'
                      : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1E40AF]">
                    <TriDeepThinkerAvatar className="w-8 h-8 shrink-0" />
                    <span>Phe Trí: IA = −3·IG (Số âm −3)</span>
                  </div>
                  <p className="text-xs text-[#374151] leading-relaxed">
                    “Vì điểm I nằm giữa A và G nên tia IA hướng lên trên còn tia IG hướng xuống dưới (ngược hướng nhau), bắt buộc phải có dấu trừ!”
                  </p>
                </button>
              </div>
            </div>

            {/* 2. OBSERVE: PHÒNG THÍ NGHIỆM TRỰC QUAN CỦA MINH KHANG */}
            {poePrediction && (
              <div className="p-3.5 rounded-xl bg-[#F2FCFE] border border-[#22D3EE] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <MinhKhangInquisitiveAvatar className="w-8 h-8 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#155E75]">
                      <StepNumberBadgeSvg num="2" />
                      <span>BƯỚC 2 (OBSERVE) — Thực nghiệm trục tọa độ của Minh Khang:</span>
                    </div>
                    <p className="text-[11px] text-[#0E7490] mt-0.5">
                      Đặt điểm I tại gốc 0 trên thước thẳng đứng: Điểm A ở vạch +3 (phía trên), điểm G ở vạch −1 (phía dưới):
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-[#FFF5F5] border border-[#F8B4A5] text-[#9B1C1C] space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <WarningTriangleSvg className="w-3.5 h-3.5 shrink-0" />
                      <span>Nếu thay IA = +3·IG (Theo Bo):</span>
                    </div>
                    <div>IA + 3·IG = 3·IG + 3·IG = 6·IG ≠ 0</div>
                    <div className="text-[11px] font-sans font-semibold">➔ Mâu thuẫn với tính chất trọng tâm tứ diện!</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#EBF7F3] border border-[#4E9B87] text-[#1B4338] space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>Nếu thay IA = −3·IG (Theo Trí):</span>
                    </div>
                    <div>IA + 3·IG = (−3·IG) + 3·IG = 0</div>
                    <div className="text-[11px] font-sans font-semibold">➔ Khớp 100% đẳng thức trọng tâm tứ diện!</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải (5/12): Bước 3 (Explain cùng Trí & Linh Chi) */}
        <div className="lg:col-span-5 bg-[#FFFDF7] border border-[#E2D9C8] rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 border-b border-[#EFE8DC] pb-2.5">
              <LinhChiNoteTakerAvatar className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#9D174D] flex items-center gap-1.5">
                  <StepNumberBadgeSvg num="3" />
                  <span>BƯỚC 3 (EXPLAIN): Chốt nguyên lý</span>
                </h3>
                <p className="text-[11px] text-[#6E6254]">
                  Linh Chi & Trí mời bạn rút ra kết luận từ thí nghiệm của Minh Khang
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF5F9] border border-[#F472B6]/60 text-xs text-[#4A152B] leading-relaxed">
              <div className="font-bold text-[#9D174D] flex items-center gap-1.5 mb-1">
                <NoteBookFlowerSvg className="w-3.5 h-3.5 shrink-0" />
                <span>Sổ tay Linh Chi nhắc nhớ (Phút 1:06:30):</span>
              </div>
              Khi nhân vectơ với một số thực <code>k</code>: Độ lớn tỉ lệ theo <code>|k|</code>, còn dấu của <code>k</code> phụ thuộc vào việc hai vectơ <strong>cùng hướng (k &gt; 0)</strong> hay <strong>ngược hướng (k &lt; 0)</strong>!
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1E242B]">
                Vì sao từ độ dài IA = 3·IG khi chuyển sang vectơ lại bắt buộc là IA = −3·IG?
              </label>

              <div className="space-y-1.5">
                {[
                  'Vì điểm I nằm giữa A và G nên hai vectơ IA và IG ngược hướng nhau, do đó hệ số k phải âm (k = −3)!',
                  'Độ dài IA gấp 3 lần IG nhưng chiều mũi tên từ I lên A ngược với chiều từ I xuống G nên IA = −3·IG!'
                ].map((sample, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      sound.playPencilTap();
                      setPoeExplanation(sample);
                    }}
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EBF7F3] border border-[#E2D9C8] hover:border-[#2E6859] rounded-lg text-xs text-[#1E242B] text-left cursor-pointer flex items-start gap-2 transition-colors"
                  >
                    <TagChipSvg className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                    <span className="leading-snug">Chọn nhanh: “{sample}”</span>
                  </button>
                ))}
              </div>

              <textarea
                value={poeExplanation}
                onChange={(e) => setPoeExplanation(e.target.value)}
                rows={2}
                placeholder="Nhập hoặc bấm chọn lập luận của bạn ở trên..."
                className="w-full p-2.5 bg-white border border-[#D8CEBC] rounded-lg text-xs text-[#1E242B] outline-none focus:border-[#1B4338]"
              />

              <button
                type="button"
                onClick={() => {
                  sound.playSuccessChime();
                  setPoeCompleted(true);
                }}
                className="w-full py-2.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                Chốt kết luận cùng Trí & Minh Khang ➔
              </button>
            </div>
          </div>

          {poeCompleted && (
            <div className="p-3 rounded-xl bg-[#EBF7F3] border border-[#2E6859] space-y-1.5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#1B4338] flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-[#1B4338]" />
                  <span>Trí & Minh Khang xác nhận lập luận chuẩn xác!</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSwitchMode('protege_teaching')}
                  className="px-3 py-1 bg-[#E8A33D] hover:bg-[#D9932B] text-[#1E242B] font-bold text-xs rounded-lg cursor-pointer"
                >
                  Sang Trạm 4 ➔
                </button>
              </div>
              <p className="text-xs text-[#1E3B33]">
                Bạn đã nắm vững cả 2 yếu tố của vectơ: Độ lớn (gấp 3 lần) và Hướng (ngược chiều mang dấu âm).
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRẠM 4: GIA SƯ NHÍ & SÁNG TẠO ĐỀ VECTƠ (PROTÉGÉ + BLOOM CREATE)
  // =========================================================================
  return (
    <div className="space-y-4 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Cột Trái (7/12): Giảng bài cho Bo bằng tuyệt chiêu của Minh Khang hoặc Linh Chi */}
        <div className="lg:col-span-7 bg-[#FFFDF7] border border-[#E2D9C8] rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="border-b border-[#EFE8DC] pb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EBF7F3] border border-[#2E6859] text-[#1B4338] font-bold text-xs">
                <GradCapSvg className="w-3.5 h-3.5 text-[#1B4338]" />
                <span>TRẠM 4: GIA SƯ NHÍ & SÁNG TẠO ĐỀ TOÁN</span>
              </span>
              <h2 className="font-bold text-base sm:text-lg text-[#1E242B] mt-1.5">
                Nhiệm vụ 1: Giúp Bo tổng kết bí kíp cộng & trừ Vectơ không gian
              </h2>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FFFBF2] border border-[#F3DFA8]">
              <BoAvatar size="sm" className="shrink-0" />
              <div className="text-xs text-[#2F2923] leading-relaxed">
                <div className="font-bold text-[#92400E] mb-0.5">Bo nhờ bạn chỉ giáo:</div>
                “Học xong bài của thầy Tiến rồi mà mình vẫn hay nhầm giữa <strong>Quy tắc nối tiếp</strong> và <strong>Quy tắc trừ chung đầu</strong>. Bạn chọn giúp mình 1 bí kíp dễ nhớ nhất của <strong>Minh Khang</strong> hoặc <strong>Linh Chi</strong> nhé!”
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setSelectedTeachStyle('khang');
                }}
                className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all space-y-1.5 ${
                  selectedTeachStyle === 'khang'
                    ? 'bg-[#F2FCFE] border-[#0891B2] shadow-xs'
                    : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#155E75]">
                  <MinhKhangInquisitiveAvatar className="w-7 h-7 shrink-0" />
                  <span>Cách 1: Khẩu quyết của Minh Khang</span>
                </div>
                <p className="text-xs text-[#374151] leading-relaxed">
                  “Phép cộng là nối đuôi đi tiếp (OA + AB = OB). Còn phép trừ chung gốc O thì lộn ngược điểm cuối lên đầu (OA − OB = BA)!”
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setSelectedTeachStyle('chi');
                }}
                className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all space-y-1.5 ${
                  selectedTeachStyle === 'chi'
                    ? 'bg-[#FFF5F9] border-[#DB2777] shadow-xs'
                    : 'bg-white hover:bg-[#FAF8F5] border-[#E2D9C8]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#9D174D]">
                  <LinhChiNoteTakerAvatar className="w-7 h-7 shrink-0" />
                  <span>Cách 2: Khung 3 quy tắc của Linh Chi</span>
                </div>
                <p className="text-xs text-[#374151] leading-relaxed">
                  “Nếu chưa nối tiếp (như BC + DD'), hãy thay DD' bằng vectơ bằng nó là CC' để tạo thành BC + CC' = BC' rồi mới tính độ dài!”
                </p>
              </button>
            </div>

            {selectedTeachStyle && (
              <div className="p-3 rounded-xl bg-[#EBF7F3] border border-[#2E6859] text-xs text-[#1B4338] font-medium flex items-center justify-between">
                <span>
                  <strong>Bo đã hiểu sâu:</strong> “Quá rõ ràng! Mình đã ghi nhớ quy tắc này vào sổ tay để không bao giờ tách bừa dấu độ dài nữa!”
                </span>
                <RubberStampSuccess className="scale-75 shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải (5/12): Nhiệm vụ 2 — Tự ra đề thách đấu cả nhóm (Bloom Create) */}
        <div className="lg:col-span-5 bg-[#FFFDF7] border border-[#E2D9C8] rounded-xl p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-2.5">
              <h3 className="font-bold text-sm sm:text-base text-[#1E242B]">
                Nhiệm vụ 2: Tự ra đề thách đấu 4 bạn
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] border border-[#F59E0B]/40 text-[10px] font-bold text-[#92400E]">
                Thử thách sáng tạo
              </span>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Bạn hãy nhập một đẳng thức Vectơ trong hình hộp hoặc tứ diện (Ví dụ:{' '}
              <code className="font-mono text-[#1B4338] font-semibold">AB + AD + AA' = AC'</code>) để{' '}
              <strong>Linh Chi</strong> kiểm tra cấu trúc đề và <strong>Bo & Trí</strong> giải thử nhé!
            </p>

            <form onSubmit={handleValidateCreatedProblem} className="space-y-2">
              <input
                type="text"
                value={customCreatedEquation}
                onChange={(e) => setCustomCreatedEquation(e.target.value)}
                placeholder="Nhập đẳng thức vectơ do bạn tự thiết kế..."
                className="w-full px-3 py-2 bg-white border border-[#D8CEBC] rounded-lg font-mono text-xs text-[#1E242B] outline-none focus:border-[#1B4338]"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#E8A33D] hover:bg-[#D9932B] text-[#1E242B] font-bold text-xs sm:text-sm rounded-lg shadow-2xs cursor-pointer transition-colors"
              >
                Gửi đề thách đấu cả lớp ➔
              </button>
            </form>

            {createValidationMsg && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  createValidationMsg.isValid
                    ? 'bg-[#EBF7F3] border-[#2E6859] text-[#1B4338]'
                    : 'bg-[#FFF5F5] border-[#F8B4A5] text-[#9B1C1C]'
                }`}
              >
                {createValidationMsg.text}
              </div>
            )}
          </div>

          {/* NÚT MỞ BẢNG TỔNG KẾT HÀNH TRÌNH 4 TRẠM & HỒ SƠ BLOOM */}
          <div className="pt-2 border-t border-[#EFE8DC]">
            <button
              type="button"
              onClick={() => {
                sound.playSuccessChime();
                setShowFinalBloomReport(prev => !prev);
              }}
              className="w-full py-2.5 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              <TrophyCupSvg className="w-4 h-4 text-[#F5D65D]" />
              <span>{showFinalBloomReport ? 'Ẩn Tổng kết Hành trình' : 'Hoàn thành 4 Trạm · Xem Tổng kết Hành trình'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BẢNG TỔNG KẾT HÀNH TRÌNH & HỒ SƠ BLOOM / ACTION LAYER (CUỐI TRẠM 4)       */}
      {/* ========================================================================= */}
      {showFinalBloomReport && (
        <div className="bg-white border-2 border-[#1B4338] rounded-xl p-4 sm:p-5 shadow-lg space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE8DC] pb-3">
            <div className="flex items-center gap-3">
              <TutorLamAvatar size="sm" />
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[#1B4338]">
                  Chúc mừng bạn đã hoàn thành trọn vẹn lộ trình 4 Trạm!
                </h3>
                <p className="text-xs text-[#6E6254]">
                  Tổng kết các cột mốc tư duy bạn đã chinh phục trong bài Vectơ trong không gian.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTeacherAnalytics(prev => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer flex items-center gap-1.5 transition-colors ${
                showTeacherAnalytics
                  ? 'bg-[#1E242B] text-[#5EEAD4] border-[#1E242B]'
                  : 'bg-[#FAF8F5] text-[#1E242B] border-[#D8CEBC] hover:bg-[#EFE8DC]'
              }`}
            >
              <ChartAnalyticsSvg className="w-3.5 h-3.5" />
              <span>{showTeacherAnalytics ? 'Đang bật: Góc nhìn Giáo viên (Bloom & Action Log)' : 'Bật Góc nhìn Giáo viên / Analytics'}</span>
            </button>
          </div>

          {!showTeacherAnalytics ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#EBF7F3] border border-[#99D5C4] space-y-1">
                <div className="font-bold text-[#1B4338] flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Trạm 1: Phản xạ với bẫy</span>
                </div>
                <p className="text-[#374151] leading-relaxed">
                  Không bị Bo dụ tách dấu độ dài tổng hai vectơ thành 1 + 1 = 2, tính chuẩn đường chéo mặt bên bằng căn 2.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FFFBF2] border border-[#F3DFA8] space-y-1">
                <div className="font-bold text-[#92400E] flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Trạm 2: Chẩn đoán lỗi sai</span>
                </div>
                <p className="text-[#374151] leading-relaxed">
                  Đối chiếu Sổ tay của Linh Chi để phát hiện lỗi quên lộn ngược thứ tự điểm trong quy tắc trừ vectơ.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F2FCFE] border border-[#A5F3FC] space-y-1">
                <div className="font-bold text-[#155E75] flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Trạm 3: Thực nghiệm POE</span>
                </div>
                <p className="text-[#374151] leading-relaxed">
                  Cùng Trí & Minh Khang phân biệt rõ tỉ số độ dài (luôn dương) và hệ số nhân hai vectơ ngược hướng (mang dấu âm).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F8FF] border border-[#C7D2FE] space-y-1">
                <div className="font-bold text-[#1E40AF] flex items-center gap-1.5">
                  <SparkleIcon className="w-3.5 h-3.5" />
                  <span>Trạm 4: Làm chủ & Sáng tạo</span>
                </div>
                <p className="text-[#374151] leading-relaxed">
                  Đúc kết bí kíp cho Bo và tự thiết kế được đẳng thức vectơ không gian hợp lệ cho cả nhóm.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#181C20] text-[#F3F4F6] font-mono space-y-2">
                <div className="text-[#F5D65D] font-bold">BẢN ĐỒ CHẨN ĐOÁN NHẬN THỨC (BLOOM'S TAXONOMY)</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span>• Remember & Understand (Trạm 1 - Định nghĩa & Nối tiếp):</span><span className="text-[#34D399] font-bold">ĐẠT (Consolidated)</span></div>
                  <div className="flex justify-between"><span>• Apply & Analyze (Trạm 2 - Bắt lỗi quy tắc hiệu):</span><span className="text-[#34D399] font-bold">ĐẠT (Thorough)</span></div>
                  <div className="flex justify-between"><span>• Evaluate (Trạm 1 & 3 - Phản biện hướng & độ dài):</span><span className="text-[#34D399] font-bold">ĐẠT (Sharp Rebuttal)</span></div>
                  <div className="flex justify-between"><span>• Create (Trạm 4 - Thiết kế đẳng thức vectơ mới):</span><span className="text-[#5EEAD4] font-bold">{createValidationMsg?.isValid ? 'ĐẠT (Valid Equation)' : 'Đang thử nghiệm'}</span></div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#181C20] text-[#F3F4F6] font-mono space-y-2">
                <div className="text-[#5EEAD4] font-bold">AGENT ACTION LAYER LOGS (GHI DỮ LIỆU THẬT)</div>
                <div className="space-y-1 text-[11px] max-h-[110px] overflow-y-auto no-scrollbar">
                  <div>1. <code>create_learning_record</code> ➔ <code>{`{ lesson: "VID_VECTO_12", bloom: "Evaluate" }`}</code></div>
                  <div>2. <code>update_mastery_state</code> ➔ <code>status: "MASTERED" (Verified via Rebuttal)</code></div>
                  {learningRecords.map((rec, i) => (
                    <div key={rec.id}>
                      {i + 3}. <code>{rec.actionName}</code> ➔ <code>{rec.detail} ({rec.status})</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
