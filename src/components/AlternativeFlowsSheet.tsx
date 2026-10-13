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
  // States cho Trạm 3: POE (Sân khấu của Trí & Minh Khang)
  const [poePrediction, setPoePrediction] = useState<'bo_camp' | 'tri_camp' | null>(null);
  const [poeExplanation, setPoeExplanation] = useState<string>('');
  const [poeCompleted, setPoeCompleted] = useState<boolean>(false);

  // States cho Trạm 4: Gia sư nhí & Tự tạo đề (Bloom Create)
  const [selectedTeachStyle, setSelectedTeachStyle] = useState<'khang' | 'chi' | null>(null);
  const [customCreatedEquation, setCustomCreatedEquation] = useState<string>('x(x - 4) = 2x');
  const [createValidationMsg, setCreateValidationMsg] = useState<{ isValid: boolean; text: string } | null>(null);
  const [showFinalBloomReport, setShowFinalBloomReport] = useState<boolean>(false);
  const [showTeacherAnalytics, setShowTeacherAnalytics] = useState<boolean>(false);

  // Kiểm tra đề toán học sinh tự tạo (Test Case 7 & 8 trong Pitch Deck: Thiếu dấu '=' -> Fail Create)
  const handleValidateCreatedProblem = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playStampThud();
    const eq = customCreatedEquation.trim();
    if (!eq.includes('=')) {
      setCreateValidationMsg({
        isValid: false,
        text: '🌸 Linh Chi nhắc nhẹ: Biểu thức của cậu chưa có dấu bằng (=) nên chưa phải là một phương trình! Cậu bổ sung vế phải nhé (Fail Create -> Yêu cầu bổ sung dữ kiện).'
      });
      return;
    }
    setCreateValidationMsg({
      isValid: true,
      text: `🎉 Đề toán "${eq}" hoàn toàn hợp lệ! 🧒 Bo giải thử: Chuyển hết sang vế trái và đặt nhân tử chung để không bị mất nghiệm x = 0! 👓 Trí xác nhận: Đủ điều kiện và nghiệm (Pass Create)!`
    });
  };

  // =========================================================================
  // TRẠM 3: ĐOÁN KẾT QUẢ (POE) — SÂN KHẤU CỦA TRÍ (ĐÀO SÂU) & MINH KHANG (THỰC NGHIỆM)
  // =========================================================================
  if (mode === 'predict_poe') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start relative z-10">
        {/* Cột Trái (7/12): Bước 1 (Đặt cược Bo vs Trí) & Bước 2 (Phòng thí nghiệm của Minh Khang) */}
        <div className="lg:col-span-7 bg-[#FFFDF7] border-2 border-[#DDD6C8] rounded-md p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8DFD0] pb-2.5">
            <div>
              <span className="px-2 py-0.5 rounded bg-[#FEF8DC] border border-[#D9A716] text-[#7A5B05] font-handwriting font-bold text-xs">
                🔮 TRẠM 3: PREDICT – OBSERVE – EXPLAIN (POE)
              </span>
              <h2 className="font-handwriting font-bold text-xl text-[#2F2923] mt-1">
                Biến thể nâng cao: Giải phương trình phân thức  <span className="font-mono text-[#8C5D19]">x(x − 2) / x = 3</span>
              </h2>
            </div>
          </div>

          {/* 1. PREDICT: ĐẶT CƯỢC GIỮA PHE BO VÀ PHE TRÍ */}
          <div className="space-y-2">
            <div className="text-xs font-handwriting font-bold text-[#5C4F42]">
              1️⃣ BƯỚC 1 (PREDICT): Khi đưa chữ x xuống dưới mẫu số, Bo và Trí tranh cãi gay gắt. Em đứng về phe ai?
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setPoePrediction('bo_camp');
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer space-y-1 ${
                  poePrediction === 'bo_camp'
                    ? 'bg-[#FFF8EB] border-[#E8A33D] shadow-sm'
                    : 'bg-white hover:bg-[#FAF6EE] border-[#DFD7C7]'
                }`}
              >
                <div className="flex items-center gap-2 font-handwriting font-bold text-sm text-[#8C5D19]">
                  <BoAvatar size="sm" className="scale-75 -ml-2" />
                  <span>Phe Bo: Vẫn có 2 nghiệm (x = 0; x = 5)</span>
                </div>
                <p className="text-xs font-handwriting text-[#4A3D31]">
                  “Nhân chéo x lên vế phải thì lại quay về bài cũ x(x − 2) = 3x thôi, chắc chắn vẫn 2 nghiệm!”
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setPoePrediction('tri_camp');
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer space-y-1 ${
                  poePrediction === 'tri_camp'
                    ? 'bg-[#EDF2FF] border-[#24428C] shadow-sm'
                    : 'bg-white hover:bg-[#FAF6EE] border-[#DFD7C7]'
                }`}
              >
                <div className="flex items-center gap-2 font-handwriting font-bold text-sm text-[#24428C]">
                  <TriDeepThinkerAvatar className="w-8 h-8 shrink-0" />
                  <span>Phe Trí: Chỉ còn 1 nghiệm duy nhất (x = 5)</span>
                </div>
                <p className="text-xs font-handwriting text-[#15326E]">
                  “Vì x nằm ở mẫu số nên ĐKXĐ là x ≠ 0! Nghiệm x = 0 bị loại ngay từ vòng gửi xe!”
                </p>
              </button>
            </div>
          </div>

          {/* 2. OBSERVE: MÁY KIỂM CHỨNG THỰC NGHIỆM CỦA MINH KHANG */}
          {poePrediction && (
            <div className="p-3.5 rounded-lg bg-[#E0F7FA]/70 border-2 border-[#4DD0E1] space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <MinhKhangInquisitiveAvatar className="w-8 h-8 shrink-0" />
                <div>
                  <div className="font-handwriting font-bold text-sm text-[#006064]">
                    2️⃣ BƯỚC 2 (OBSERVE) — Phòng Thí Nghiệm Thay Số của Minh Khang:
                  </div>
                  <div className="text-[11px] font-handwriting text-[#00484A]">
                    “Để tớ bấm máy thay từng giá trị x = 5 và x = 0 vào biểu thức gốc x(x − 2) / x = 3 cho cả lớp quan sát nhé!”
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs pt-1">
                <div className="p-2.5 rounded bg-white border border-[#6B9E5C] text-[#1E3B18]">
                  <div className="font-bold">✅ Thử với x = 5:</div>
                  <div>5(5 − 2) / 5 = 15 / 5 = 3</div>
                  <div className="text-[11px] text-[#2E6859] mt-0.5">➔ Hợp lệ! (Nhận x = 5)</div>
                </div>
                <div className="p-2.5 rounded bg-[#FFF0F0] border border-[#E53E3E] text-[#9B1C1C]">
                  <div className="font-bold">⚡ Thử với x = 0:</div>
                  <div>0(0 − 2) / 0 = 0 / 0</div>
                  <div className="text-[11px] font-bold mt-0.5">➔ LỖI CHIA CHO 0 (Loại x = 0!)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cột Phải (5/12): Bước 3 (Explain cùng Trí & Linh Chi) */}
        <div className="lg:col-span-5 bg-[#FFFDF7] border-2 border-[#DDD6C8] rounded-md p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#E8DFD0] pb-2">
            <LinhChiNoteTakerAvatar className="w-8 h-8" />
            <div>
              <h3 className="font-handwriting font-bold text-base text-[#8C2852]">
                3️⃣ BƯỚC 3 (EXPLAIN): Chốt sự khác biệt
              </h3>
              <p className="text-[11px] font-handwriting text-[#7A6D5E]">
                Linh Chi & Trí mời em rút ra kết luận từ thí nghiệm của Minh Khang
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#FFF0F5] border border-[#F29BB7] text-xs font-handwriting text-[#4A152B]">
            <strong>🌸 Sổ tay Linh Chi nhắc nhớ:</strong> Ở Trạm 1, phương trình <code>x(x − 2) = 3x</code> không có mẫu số nên nhận cả <code>x = 0</code>. Còn ở bài biến thể này, chữ <code>x</code> nằm dưới mẫu số!
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-handwriting font-bold text-[#2F2923]">
              Vì sao ở bài này ta lại được phép rút gọn x để chỉ còn nghiệm duy nhất x = 5?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Vì x nằm ở mẫu số nên ĐKXĐ bắt buộc là x ≠ 0, do đó loại nghiệm x = 0!',
                'Khi đã có ĐKXĐ x ≠ 0 thì phép chia cả tử và mẫu cho x là hoàn toàn hợp lệ!'
              ].map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setPoeExplanation(sample);
                  }}
                  className="px-2.5 py-1 bg-[#FAF6EE] hover:bg-[#FFF8EB] border border-[#D8CEBC] rounded text-xs font-handwriting text-left cursor-pointer"
                >
                  🏷️ Chọn nhanh: “{sample}”
                </button>
              ))}
            </div>

            <textarea
              value={poeExplanation}
              onChange={(e) => setPoeExplanation(e.target.value)}
              rows={3}
              placeholder="Gõ hoặc bấm chọn lý giải của em ở trên..."
              className="w-full p-2.5 bg-white border border-[#D8CEBC] rounded text-xs font-handwriting outline-none focus:border-[#4E9B87]"
            />

            <button
              type="button"
              onClick={() => {
                sound.playSuccessChime();
                setPoeCompleted(true);
              }}
              className="w-full py-2 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-sm rounded shadow-xs cursor-pointer"
            >
              Chốt kết luận cùng Trí & Minh Khang ➔
            </button>
          </div>

          {poeCompleted && (
            <div className="p-3 rounded bg-[#EDF7F4] border-2 border-[#4E9B87] space-y-2 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="font-handwriting font-bold text-sm text-[#2E6859]">
                  🌟 Trí & Minh Khang vỗ tay công nhận!
                </span>
                <button
                  type="button"
                  onClick={() => onSwitchMode('protege_teaching')}
                  className="px-3 py-1 bg-[#E8A33D] text-black font-handwriting font-bold text-xs rounded cursor-pointer"
                >
                  Sang Trạm 4: Làm chủ ➔
                </button>
              </div>
              <p className="text-xs font-handwriting text-[#1E3B33]">
                Em đã phân biệt cực kỳ sắc sảo giữa phương trình nguyên và phương trình chứa ẩn ở mẫu!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRẠM 4: GIA SƯ NHÍ & RA ĐỀ THÁCH ĐẤU CẢ NHÓM (PROTÉGÉ + BLOOM CREATE)
  // =========================================================================
  return (
    <div className="space-y-4 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Cột Trái (7/12): Giảng bài cho Bo bằng tuyệt chiêu của Minh Khang hoặc Linh Chi */}
        <div className="lg:col-span-7 bg-[#FFFDF7] border-2 border-[#DDD6C8] rounded-md p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#E8DFD0] pb-2">
            <div>
              <span className="px-2 py-0.5 rounded bg-[#EBF7E7] border border-[#5FA04E] text-[#2B6121] font-handwriting font-bold text-xs">
                🎓 TRẠM 4: GIA SƯ NHÍ & SÁNG TẠO ĐỀ TOÁN
              </span>
              <h2 className="font-handwriting font-bold text-xl text-[#2F2923] mt-1">
                Nhiệm vụ 1: Giúp Bo tổng kết quy tắc chống sập bẫy
              </h2>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FFF8EB] border border-[#F0D5A3]">
            <BoAvatar size="sm" />
            <div className="text-xs sm:text-sm font-handwriting text-[#3E342B]">
              <div className="font-bold text-[#8C5D19]">🧒 Bo cầu cứu:</div>
              “Cậu ơi, học xong 3 trạm rồi mà tớ vẫn sợ đi thi lại quen tay gạch bừa chữ x ở hai vế. Cậu chọn giúp tớ 1 bí kíp dễ nhớ nhất của <strong>Minh Khang</strong> hoặc <strong>Linh Chi</strong> để tớ dán lên bàn học với!”
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('khang');
              }}
              className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all space-y-1 ${
                selectedTeachStyle === 'khang'
                  ? 'bg-[#E0F7FA] border-[#006064] shadow-sm'
                  : 'bg-white hover:bg-[#FAF6EE] border-[#DFD7C7]'
              }`}
            >
              <div className="flex items-center gap-2 font-handwriting font-bold text-sm text-[#006064]">
                <MinhKhangInquisitiveAvatar className="w-7 h-7" />
                <span>Cách 1: Mẹo thử số 0 của Minh Khang</span>
              </div>
              <p className="text-xs font-handwriting text-[#00484A]">
                “Cứ thấy hai vế có chung chữ x, hãy nhẩm thay ngay x = 0 vào. Thấy 0 = 0 là phải giữ chặt nghiệm x = 0, cấm gạch x!”
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playPencilTap();
                setSelectedTeachStyle('chi');
              }}
              className={`p-3 rounded-lg border-2 text-left cursor-pointer transition-all space-y-1 ${
                selectedTeachStyle === 'chi'
                  ? 'bg-[#FFF0F5] border-[#8C2852] shadow-sm'
                  : 'bg-white hover:bg-[#FAF6EE] border-[#DFD7C7]'
              }`}
            >
              <div className="flex items-center gap-2 font-handwriting font-bold text-sm text-[#8C2852]">
                <LinhChiNoteTakerAvatar className="w-7 h-7" />
                <span>Cách 2: Khung 3 bước của Linh Chi</span>
              </div>
              <p className="text-xs font-handwriting text-[#4A152B]">
                “Luôn chuyển hết sang vế trái đổi dấu cho vế phải bằng 0, sau đó đặt nhân tử chung A(x)·B(x) = 0!”
              </p>
            </button>
          </div>

          {selectedTeachStyle && (
            <div className="p-3 rounded bg-[#F2F8F0] border border-[#6B9E5C] text-xs font-handwriting text-[#1E3B18] flex items-center justify-between">
              <span>🧒 <strong>Bo giác ngộ:</strong> “Quá đỉnh! Tớ chép bí kíp này dán ngay góc bàn học rồi!”</span>
              <RubberStampSuccess className="scale-75" />
            </div>
          )}
        </div>

        {/* Cột Phải (5/12): Nhiệm vụ 2 — Tự ra đề thách đấu cả nhóm (Optional Challenge cho mức Create) */}
        <div className="lg:col-span-5 bg-[#FFFDF7] border-2 border-[#DDD6C8] rounded-md p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8DFD0] pb-2">
            <h3 className="font-handwriting font-bold text-base text-[#2F2923]">
              ✍️ Nhiệm vụ 2: Tự ra đề thách đấu 4 bạn
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#FFF8EB] border border-[#E8A33D] text-[10px] font-handwriting font-bold text-[#8C5D19]">
              Thử thách sáng tạo
            </span>
          </div>

          <p className="text-xs font-handwriting text-[#5C4F42] leading-snug">
            Em hãy tự sáng tạo một phương trình tích tương tự (Ví dụ: <code>x(x − 4) = 2x</code>) để <strong>Linh Chi</strong> kiểm tra đề và <strong>Bo & Trí</strong> giải thử nhé!
          </p>

          <form onSubmit={handleValidateCreatedProblem} className="space-y-2">
            <input
              type="text"
              value={customCreatedEquation}
              onChange={(e) => setCustomCreatedEquation(e.target.value)}
              placeholder="Nhập phương trình do em tự sáng tạo..."
              className="w-full px-3 py-2 bg-white border-2 border-[#D8CEBC] rounded font-mono text-xs text-[#2F2923] outline-none focus:border-[#4E9B87]"
            />
            <button
              type="submit"
              className="w-full py-2 bg-[#E8A33D] hover:bg-[#D9932B] text-black font-handwriting font-bold text-sm rounded shadow-xs cursor-pointer"
            >
              Gửi đề thách đấu cả lớp 🚀
            </button>
          </form>

          {createValidationMsg && (
            <div
              className={`p-3 rounded border text-xs font-handwriting leading-snug ${
                createValidationMsg.isValid
                  ? 'bg-[#EDF7F4] border-[#4E9B87] text-[#1E3B33]'
                  : 'bg-[#FFF5F5] border-[#E53E3E] text-[#9B1C1C]'
              }`}
            >
              {createValidationMsg.text}
            </div>
          )}

          {/* NÚT MỞ BẢNG TỔNG KẾT HÀNH TRÌNH 4 TRẠM & HỒ SƠ BLOOM (Chỉ mở khi xong 4 chặng!) */}
          <div className="pt-2 border-t border-[#E8DFD0]">
            <button
              type="button"
              onClick={() => {
                sound.playSuccessChime();
                setShowFinalBloomReport(prev => !prev);
              }}
              className="w-full py-2.5 bg-[#2F2923] hover:bg-[#453C33] text-[#F5D65D] font-handwriting font-bold text-sm rounded-lg shadow cursor-pointer flex items-center justify-center gap-2"
            >
              <SparkleIcon className="w-4 h-4 text-[#F5D65D]" />
              <span>{showFinalBloomReport ? 'Ẩn Tổng kết Hành trình' : '🏆 Hoàn thành 4 Trạm · Xem Tổng kết Hành trình'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BẢNG TỔNG KẾT HÀNH TRÌNH & HỒ SƠ BLOOM / ACTION LAYER (CHỈ HIỆN Ở CUỐI!) */}
      {/* ========================================================================= */}
      {showFinalBloomReport && (
        <div className="bg-[#FFFDF7] border-2 border-[#4E9B87] rounded-xl p-5 shadow-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DFD0] pb-3">
            <div className="flex items-center gap-3">
              <TutorLamAvatar size="sm" />
              <div>
                <h3 className="font-handwriting font-bold text-xl text-[#2E6859]">
                  Chúc mừng em đã hoàn thành trọn vẹn lộ trình 4 Trạm!
                </h3>
                <p className="text-xs font-handwriting text-[#5C4F42]">
                  Không chấm điểm áp lực — Đây là những kỹ năng tư duy em đã tự mình chinh phục hôm nay.
                </p>
              </div>
            </div>

            {/* Công tắc chuyển đổi sang Góc nhìn Giáo viên / Giám khảo (Show Bloom & Action JSON) */}
            <button
              type="button"
              onClick={() => setShowTeacherAnalytics(prev => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border cursor-pointer transition-colors ${
                showTeacherAnalytics
                  ? 'bg-[#2F2923] text-[#5EEAD4] border-[#2F2923]'
                  : 'bg-white text-[#5C4F42] border-[#D8CEBC] hover:bg-[#FAF6EE]'
              }`}
            >
              {showTeacherAnalytics ? '👩🏫 Đang bật: Góc nhìn Giáo viên (Bloom & Action Log)' : '👩🏫 Bật Góc nhìn Giáo viên / Analytics'}
            </button>
          </div>

          {/* Chế độ 1: Ngôn ngữ khích lệ nhẹ nhàng cho Học sinh */}
          {!showTeacherAnalytics ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-handwriting">
              <div className="p-3 rounded-lg bg-[#EDF7F4] border border-[#4E9B87]">
                <div className="font-bold text-[#2E6859] text-sm mb-1">✅ Trạm 1: Tỉnh táo trước bẫy</div>
                <p>Em đã nhận diện đúng điều kiện xác định và không bị Bo dụ chia hai vế cho biến x.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#FFF8EB] border border-[#E8A33D]">
                <div className="font-bold text-[#8C5D19] text-sm mb-1">✅ Trạm 2: Mắt thần soi lỗi</div>
                <p>Cùng Sổ tay của Linh Chi chỉ ra chính xác dòng biến đổi sai dấu trong vở của Bo.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#E0F7FA] border border-[#4DD0E1]">
                <div className="font-bold text-[#006064] text-sm mb-1">✅ Trạm 3: Tư duy thực nghiệm</div>
                <p>Đồng hành cùng Trí & Minh Khang kiểm chứng sự khác biệt khi x nằm ở mẫu số.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#F2F8F0] border border-[#6B9E5C]">
                <div className="font-bold text-[#2B6121] text-sm mb-1">🌟 Trạm 4: Gia sư nhí</div>
                <p>Truyền đạt lại bí kíp cho Bo và tự thiết kế được bài toán biến thể hợp lệ!</p>
              </div>
            </div>
          ) : (
            /* Chế độ 2: Bảng Chẩn đoán 6 mức Bloom & Action Layer Log dành cho Giáo viên / Giám khảo */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#1C1917] text-[#FAF7F2] font-mono space-y-2">
                <div className="text-[#F5D65D] font-bold">📊 BẢN ĐỒ CHẨN ĐOÁN NHẬN THỨC (BLOOM'S TAXONOMY)</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span>• Remember & Understand (Trạm 1 - ĐKXĐ & Quy tắc):</span><span className="text-[#34D399] font-bold">ĐẠT (Consolidated)</span></div>
                  <div className="flex justify-between"><span>• Apply & Analyze (Trạm 2 - Tách bước & Bắt lỗi sai):</span><span className="text-[#34D399] font-bold">ĐẠT (Thorough)</span></div>
                  <div className="flex justify-between"><span>• Evaluate (Trạm 1 & 3 - Phản biện theo tiêu chí):</span><span className="text-[#34D399] font-bold">ĐẠT (Sharp Rebuttal)</span></div>
                  <div className="flex justify-between"><span>• Create (Trạm 4 - Thiết kế phương trình biến thể):</span><span className="text-[#5EEAD4] font-bold">{createValidationMsg?.isValid ? 'ĐẠT (Valid Problem)' : 'Đang thử nghiệm'}</span></div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#1C1917] text-[#FAF7F2] font-mono space-y-2">
                <div className="text-[#5EEAD4] font-bold">⚡ AGENT ACTION LAYER LOGS (GHI DỮ LIỆU THẬT)</div>
                <div className="space-y-1 text-[11px] max-h-[110px] overflow-y-auto">
                  <div>1. <code>create_learning_record</code> ➔ <code>{`{ lesson: "VID_001", bloom: "Evaluate" }`}</code></div>
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
