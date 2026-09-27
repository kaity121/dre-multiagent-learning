import React from 'react';
import { PushPin, WashiTape, SwordsDebateIcon, OpenBookIcon, SparkleIcon, CompassIcon, GentleLightbulb } from './HandmadeArtwork';

interface LearningFlowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'worksheet' | 'video_clash' | 'predict_poe' | 'protege_teaching') => void;
}

export const LearningFlowGuideModal: React.FC<LearningFlowGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FAF6EE] border-4 border-[#DDD6C8] rounded-md p-6 sketchbook-shadow max-h-[90vh] overflow-y-auto">
        <WashiTape variant="yellow" className="absolute -top-3 left-10 w-28 -rotate-2" />
        <PushPin color="#E8A33D" className="absolute top-3 right-4" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8DFD0]">
          <div>
            <h2 className="font-handwriting font-bold text-2xl text-[#2F2923] flex items-center gap-2">
              <CompassIcon className="w-6 h-6 text-[#4E9B87]" />
              <span>Hướng Dẫn: Lộ Trình 4 Trạm Học Tập DRE</span>
            </h2>
            <p className="text-xs text-[#8A7D6F] font-handwriting mt-0.5">
              Học cái nào trước? 4 chế độ này phối hợp với nhau như thế nào?
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white hover:bg-[#F0EBE0] border border-[#D5CCBC] flex items-center justify-center text-[#7A6D5E] font-bold cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Recommended Journey Timeline */}
        <div className="p-3 bg-[#FFF9EC] border-2 border-dashed border-[#F0D5A3] rounded-xs mb-4 text-xs font-handwriting text-[#6E5733] leading-relaxed flex items-start gap-2">
          <GentleLightbulb className="w-4 h-4 text-[#E8A33D] shrink-0 mt-0.5" />
          <div>
            <strong>Lời khuyên sư phạm:</strong> 4 tab trên thanh công cụ đại diện cho <strong>4 Trạm của một chu trình học hoàn chỉnh</strong>. Bạn nên đi theo thứ tự từ <strong>Trạm 1 ➔ Trạm 4</strong> để đạt hiệu quả cao nhất (hoặc bấm tự do để test thử từng tính năng):
          </div>
        </div>

        {/* 4 Steps Grid / Timeline */}
        <div className="space-y-3 mb-5">
          {/* Step 1: Video Clash */}
          <div 
            onClick={() => { onSelectMode('video_clash'); onClose(); }}
            className="p-3.5 bg-white hover:bg-[#EEF8F5] border-2 border-[#DFD7C9] hover:border-[#4E9B87] rounded-xs transition-all cursor-pointer shadow-2xs group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#4E9B87] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-handwriting font-bold text-base text-[#1E4D40] group-hover:text-[#133A30]">
                  Trạm 1: Khởi động với Video &amp; Bo phản biện (Xem trước)
                </span>
                <span className="text-[11px] font-mono bg-[#4E9B87]/15 text-[#235849] px-2 py-0.5 rounded-full font-bold">
                  Bắt đầu tại đây
                </span>
              </div>
              <p className="font-handwriting text-xs text-[#5C5042] mt-1 leading-snug">
                Theo dõi video Cô Lam giảng bài ➔ Video tự động dừng lại ở cạm bẫy ➔ Bo nhảy vào tranh luận bằng trực giác sai lầm ➔ Em phản biện lại Bo để bẻ gãy ngộ nhận ban đầu.
              </p>
            </div>
          </div>

          {/* Step 2: Worksheet DRE */}
          <div 
            onClick={() => { onSelectMode('worksheet'); onClose(); }}
            className="p-3.5 bg-white hover:bg-[#FFF9EC] border-2 border-[#DFD7C9] hover:border-[#E8A33D] rounded-xs transition-all cursor-pointer shadow-2xs group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#E8A33D] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-handwriting font-bold text-base text-[#704812] group-hover:text-[#52340B]">
                  Trạm 2: Luyện tập bắt lỗi trên Sổ tay (DRE Classic)
                </span>
                <span className="text-[11px] font-mono bg-[#E8A33D]/15 text-[#8C5D19] px-2 py-0.5 rounded-full font-bold">
                  Luyện tập sâu
                </span>
              </div>
              <p className="font-handwriting text-xs text-[#5C5042] mt-1 leading-snug">
                Tự tay cầm bút soi bài tập giải sẵn của Bo ➔ Bấm vào dòng Bo làm sai (Chẩn đoán) ➔ Gõ lời giải thích nguyên nhân sai ➔ Đối chất lại khi Bo cãi cố.
              </p>
            </div>
          </div>

          {/* Step 3: POE */}
          <div 
            onClick={() => { onSelectMode('predict_poe'); onClose(); }}
            className="p-3.5 bg-white hover:bg-[#FFFDF0] border-2 border-[#DFD7C9] hover:border-[#D4A328] rounded-xs transition-all cursor-pointer shadow-2xs group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#D4A328] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-handwriting font-bold text-base text-[#6E4F10] group-hover:text-[#4F380A]">
                  Trạm 3: Thử thách cá cược kết quả (POE - Đoán &amp; Quan sát)
                </span>
                <span className="text-[11px] font-mono bg-[#F5D65D]/30 text-[#6B4B12] px-2 py-0.5 rounded-full font-bold">
                  Vận dụng nhạy bén
                </span>
              </div>
              <p className="font-handwriting text-xs text-[#5C5042] mt-1 leading-snug">
                Trước khi xem lời giải, em và Bo cá cược xem đáp án sẽ ra dấu cộng hay trừ ➔ Quan sát bảng phấn Cô Lam hé lộ ➔ Đối chiếu xem ai thắng cược và làm quiz sửa sai nhanh.
              </p>
            </div>
          </div>

          {/* Step 4: Protégé Teaching */}
          <div 
            onClick={() => { onSelectMode('protege_teaching'); onClose(); }}
            className="p-3.5 bg-white hover:bg-[#F2F8F0] border-2 border-[#DFD7C9] hover:border-[#6B9E5C] rounded-xs transition-all cursor-pointer shadow-2xs group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#6B9E5C] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
              4
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-handwriting font-bold text-base text-[#2E5E22] group-hover:text-[#1B3E13]">
                  Trạm 4: Đóng vai gia sư giảng lại cho Bo (Làm chủ đỉnh cao)
                </span>
                <span className="text-[11px] font-mono bg-[#6B9E5C]/15 text-[#24521A] px-2 py-0.5 rounded-full font-bold">
                  Làm chủ hoàn toàn
                </span>
              </div>
              <p className="font-handwriting text-xs text-[#5C5042] mt-1 leading-snug">
                Bo bị lú kiến thức và cầu cứu ➔ Em đóng vai thầy giáo/gia sư gõ lời giải thích trực quan ➔ Bo sáng mắt ra và hiểu bài (Dạy cho người khác là cách học nhớ lâu nhất).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E8DFD0] flex items-center justify-between text-xs font-handwriting text-[#8A7D6F]">
          <span>Bấm vào bất kỳ trạm nào ở trên để vào học ngay trạm đó!</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-mono text-xs rounded-xs font-bold cursor-pointer"
          >
            Đã hiểu, quay lại học
          </button>
        </div>
      </div>
    </div>
  );
};
