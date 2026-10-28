// File: src/components/PreClassLobbyModal.tsx
import React, { useState } from 'react';
import { 
  TutorLamAvatar, 
  BoCircleAvatar, 
  TriDeepThinkerAvatar, 
  LinhChiNoteTakerAvatar, 
  MinhKhangInquisitiveAvatar,
  CheckCircleIcon
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

interface PreClassLobbyModalProps {
  onCompleteLobby: (learnerName: string, level: string) => void;
  onClose?: () => void;
  initialName?: string;
  initialLevel?: string;
}

export const PreClassLobbyModal: React.FC<PreClassLobbyModalProps> = ({ 
  onCompleteLobby,
  onClose,
  initialName = '',
  initialLevel = 'learned_needs_consolidation'
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLevel, setSelectedLevel] = useState<string>(initialLevel);
  const [learnerName, setLearnerName] = useState<string>(initialName);

  const handleNextFromStep1 = () => {
    sound.playPageFlip();
    setStep(2);
  };

  const handleEnterClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerName.trim()) return;
    sound.playSuccessChime();
    onCompleteLobby(learnerName.trim(), selectedLevel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-4xl bg-white border border-[#E2EAD2] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER CHUẨN LIME SOFT */}
        <div className="px-6 py-4 bg-[#121712] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C8F169] animate-pulse" />
            <span className="font-bold text-sm tracking-wide text-white">
              DRE Learning · Lớp học Tương tác Đa tác nhân (Toán 12)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-full text-stone-200 border border-white/10">
              Bước {step}/2: {step === 1 ? 'Khảo sát đầu vào' : 'Sảnh chờ lớp học'}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                title="Đóng sảnh chờ"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* NỘI DUNG TỪNG BƯỚC */}
        {step === 1 ? (
          // BƯỚC 1: KHẢO SÁT ĐỘ KHÓ
          <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4 max-w-2xl mx-auto w-full">
              
              {/* Lời chào của Trợ giảng An */}
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] shadow-2xs">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E2EAD2] flex items-center justify-center shrink-0">
                  <TutorLamAvatar size="sm" className="scale-75" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#121712]">Trợ giảng An · Trợ giảng AI</div>
                  <h2 className="font-extrabold text-base sm:text-lg text-[#121712] mt-0.5">
                    Bạn đã học bài Vectơ trong không gian chưa?
                  </h2>
                  <p className="text-xs text-stone-600 mt-1">
                    An sẽ chọn độ khó câu hỏi khởi đầu và các điểm dừng bắt lỗi (Checkpoint) phù hợp nhất với câu trả lời của bạn.
                  </p>
                </div>
              </div>

              {/* 3 Lựa chọn trình độ */}
              <div className="space-y-2.5">
                {[
                  {
                    id: 'new_learner',
                    title: 'Mới học',
                    desc: 'Lần đầu gặp bài này, cần giảng kỹ định nghĩa cơ bản và quy tắc gốc.',
                  },
                  {
                    id: 'learned_needs_consolidation',
                    title: 'Đã học',
                    desc: 'Đã học trên lớp, cần củng cố, săn bẫy ngộ nhận và luyện tập phản biện.',
                  },
                  {
                    id: 'reviewing',
                    title: 'Đang ôn luyện',
                    desc: 'Đang ôn thi, muốn vào thẳng các câu hỏi khó và thử thách nâng cao mức Sáng tạo.',
                  },
                ].map((item) => {
                  const isSelected = selectedLevel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sound.playPencilTap();
                        setSelectedLevel(item.id);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#121712] text-white border-[#121712] ring-1 ring-[#121712] shadow-xs'
                          : 'bg-white hover:bg-stone-50 border-[#E2EAD2] text-[#121712]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-[#121712]'}`}>
                          {item.title}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>{item.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#C8F169] border-[#C8F169] text-[#121712]' : 'border-stone-300'
                      }`}>
                        {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-[#121712]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Bước 1 */}
            <div className="pt-4 border-t border-[#E2EAD2] flex items-center justify-between max-w-2xl mx-auto w-full">
              <button
                type="button"
                onClick={() => {
                  setSelectedLevel('learned_needs_consolidation');
                  handleNextFromStep1();
                }}
                className="text-xs font-semibold text-stone-600 hover:text-black underline cursor-pointer"
              >
                Bỏ qua, dùng mặc định
              </button>
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-6 py-2.5 bg-[#C8F169] hover:bg-[#B8E356] text-[#121712] font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-sm transition-colors border border-[#A6D83B]"
              >
                Tiếp tục ➔
              </button>
            </div>
          </div>
        ) : (
          // BƯỚC 2: SẢNH CHỜ LỚP HỌC
          <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Cột trái: Preview phòng học & Danh sách bạn AI đang chờ */}
              <div className="md:col-span-6 bg-[#121712] text-white p-5 rounded-3xl border border-stone-800 space-y-4 shadow-xl">
                <div className="w-full h-40 rounded-2xl bg-stone-900 flex items-center justify-center border border-white/10 relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-[#C8F169] text-[#121712] font-extrabold text-2xl flex items-center justify-center shadow-md">
                    {learnerName ? learnerName.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 text-[10px] font-mono text-stone-200">
                    Sảnh chờ · Sẵn sàng điểm danh
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <BoCircleAvatar className="w-6 h-6 rounded-full ring-2 ring-[#121712]" />
                    <TriDeepThinkerAvatar className="w-6 h-6 rounded-full bg-white ring-2 ring-[#121712]" />
                    <LinhChiNoteTakerAvatar className="w-6 h-6 rounded-full bg-white ring-2 ring-[#121712]" />
                    <MinhKhangInquisitiveAvatar className="w-6 h-6 rounded-full bg-white ring-2 ring-[#121712]" />
                  </div>
                  <span className="text-xs text-white font-medium">
                    Bo, Trí, Linh Chi & Minh Khang đang chờ trong lớp
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed border-t border-stone-800 pt-2.5">
                  Video bài giảng của thầy Tiến chạy liên tục. Bình luận nằm cạnh video, không che bảng đen. Muốn hỏi bài cứ bấm Giơ tay.
                </p>
              </div>

              {/* Cột phải: Thông tin bài học & Ô nhập tên */}
              <div className="md:col-span-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#121712] bg-[#F3F8E8] px-2.5 py-0.5 rounded-full border border-[#E2EAD2]">
                    Bạn được mời vào lớp
                  </span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#121712] tracking-tight">
                    Vectơ Trong Không Gian
                  </h1>
                  <p className="text-xs text-stone-600">
                    Toán 12 (SGK Mới) · Thầy Nguyễn Phan Tiến · 4 Trạm tương tác
                  </p>
                </div>

                {/* Danh sách mục tiêu P1 -> P4 */}
                <div className="p-4 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] space-y-2">
                  <span className="text-xs font-bold text-[#121712] block">Sau buổi học, bạn sẽ nắm vững:</span>
                  <div className="space-y-1.5 text-xs text-[#121712]">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-white text-[#121712] font-mono text-[10px] font-bold border border-[#E2EAD2]">P1</span>
                      <span>Nhận diện vectơ, giá và điều kiện cùng phương, cùng hướng.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-white text-[#121712] font-mono text-[10px] font-bold border border-[#E2EAD2]">P2</span>
                      <span>Áp dụng quy tắc 3 điểm, quy tắc hình bình hành và hình hộp.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-white text-[#121712] font-mono text-[10px] font-bold border border-[#E2EAD2]">P3</span>
                      <span>Tránh bẫy tách độ dài |a+b| = |a|+|b| tại mốc 37:13 (kết quả √2).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-white text-[#121712] font-mono text-[10px] font-bold border border-[#E2EAD2]">P4</span>
                      <span>Sửa lỗi quy tắc hiệu "Chung đầu - Lộn ngược" (OA − OB = BA).</span>
                    </div>
                  </div>
                </div>

                {/* Form nhập tên */}
                <form onSubmit={handleEnterClass} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#121712]">
                      Tên của bạn <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={learnerName}
                      onChange={(e) => setLearnerName(e.target.value)}
                      placeholder="Ví dụ: Minh Khuê"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E2EAD2] rounded-xl text-xs text-[#121712] outline-none focus:border-[#121712] shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={!learnerName.trim()}
                      className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm text-[#121712] flex items-center justify-center gap-2 transition-all ${
                        learnerName.trim()
                          ? 'bg-[#C8F169] hover:bg-[#B8E356] cursor-pointer shadow-md border border-[#A6D83B]'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-200'
                      }`}
                    >
                      <CheckCircleIcon className="w-4 h-4 text-[#121712]" />
                      <span>Vào lớp học ngay</span>
                    </button>
                    <span className="text-xs text-stone-500 italic shrink-0">Không cần tài khoản</span>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
