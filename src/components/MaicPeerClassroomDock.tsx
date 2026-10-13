// File: src/components/MaicPeerClassroomDock.tsx
import React, { useState, useEffect } from 'react';
import { PeerContextData } from '../types/dre';
import { 
  BoAvatar, 
  TriDeepThinkerAvatar, 
  LinhChiNoteTakerAvatar, 
  MinhKhangInquisitiveAvatar
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

export interface MaicPeerClassroomDockProps {
  currentMode: string;
  currentState?: string;
  lessonTopic?: string;
  errorStepIndex?: number;
  peerContext?: PeerContextData;
  onSelectPeerPerspective?: (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang') => void;
}

interface PeerChatMessage {
  sender: 'user' | 'peer';
  text: string;
}

export const MaicPeerClassroomDock: React.FC<MaicPeerClassroomDockProps> = ({
  lessonTopic = 'Phương trình tích x(x − 2) = 3x',
  peerContext,
  onSelectPeerPerspective,
}) => {
  const [activePeerDrawer, setActivePeerDrawer] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang' | null>(null);
  const [peerChatInput, setPeerChatInput] = useState<string>('');
  const [chatHistories, setChatHistories] = useState<Record<'bo' | 'tri' | 'linhchi' | 'minhkhang', PeerChatMessage[]>>({
    bo: [],
    tri: [],
    linhchi: [],
    minhkhang: [],
  });

  // Cập nhật lời chào & sổ tay của 4 bạn khớp 100% với bài học hiện tại (Không còn bị lệch sang bài quy đồng phân số!)
  useEffect(() => {
    setChatHistories({
      bo: [
        {
          sender: 'peer',
          text: peerContext?.bo.hotTake || `Ở bài "${lessonTopic}", tớ cứ làm tắt cho lẹ! Cậu tìm được chỗ nào tớ hớ không?`
        }
      ],
      tri: [
        {
          sender: 'peer',
          text: `Chào cậu! Với bài "${lessonTopic}", cậu có muốn cùng tớ kiểm tra điều kiện xác định và các trường hợp biên không?`
        }
      ],
      linhchi: [
        {
          sender: 'peer',
          text: `Tớ đã tóm tắt sẵn công thức và các bước giải chuẩn của bài "${lessonTopic}" ngay trên thẻ Sổ tay phía trên rồi nè!`
        }
      ],
      minhkhang: [
        {
          sender: 'peer',
          text: `Để tớ lấy ví dụ thực tế và hình ảnh trực quan cho bài "${lessonTopic}" để cậu nhìn phát hiểu liền nhé!`
        }
      ]
    });
  }, [lessonTopic, peerContext]);

  const handleOpenPeer = (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang') => {
    sound.playBubblePop();
    setActivePeerDrawer(prev => prev === peerId ? null : peerId);
    setPeerChatInput('');
    onSelectPeerPerspective?.(peerId);
  };

  const handleSendPeerMessage = (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang', customText?: string) => {
    const textToSend = (customText || peerChatInput).trim();
    if (!textToSend) return;

    sound.playPencilTap();
    setPeerChatInput('');

    setChatHistories(prev => ({
      ...prev,
      [peerId]: [...prev[peerId], { sender: 'user', text: textToSend }]
    }));

    setTimeout(() => {
      sound.playBubblePop();
      let reply = '';
      if (peerId === 'bo') {
        reply = peerContext?.bo.defaultReply || 'Ơ... cậu phân tích vậy làm tớ hơi giật mình rồi đó! Để tớ thử thế số kiểm tra lại xem!';
      } else if (peerId === 'tri') {
        reply = peerContext?.tri.defaultReply || 'Đúng hướng rồi! Bản chất toán học nằm ở tính tương đương của từng phép biến đổi.';
      } else if (peerId === 'linhchi') {
        reply = peerContext?.linhchi.defaultReply || 'Cậu đối chiếu với từng bước trong tờ Sổ tay màu hồng của tớ ở trên là thấy ngay chỗ cần lưu ý nhé!';
      } else {
        reply = peerContext?.minhkhang.defaultReply || 'Chuẩn luôn! Cứ quy về hình ảnh trực quan hoặc thay một con số đơn giản vào là kiểm chứng được liền!';
      }

      setChatHistories(prev => ({
        ...prev,
        [peerId]: [...prev[peerId], { sender: 'peer', text: reply }]
      }));
    }, 400);
  };

  return (
    <div className="relative w-full bg-[#FAF6EE] border-x border-b border-[#DDD3C4] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs select-none">
      {/* Thanh 4 Bạn học MAIC (Đã xóa nút Bản đồ nhiệt & nút Loa bị lặp) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-mono uppercase font-bold text-[#8A755D] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D]" />
          <span>Hỏi nhỏ ngoài lề cùng 4 bạn:</span>
        </span>

        <button
          type="button"
          onClick={() => handleOpenPeer('bo')}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-handwriting font-bold transition-all cursor-pointer ${
            activePeerDrawer === 'bo'
              ? 'bg-[#E8A33D] text-white border-[#C98420] shadow-xs'
              : 'bg-[#FFF4DE] hover:bg-[#FFE8BD] border-[#E8A33D] text-[#7A4B12]'
          }`}
        >
          <span>🟠 Bo (Phản biện)</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenPeer('tri')}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-handwriting font-bold transition-all cursor-pointer ${
            activePeerDrawer === 'tri'
              ? 'bg-[#24428C] text-white border-[#1B326B] shadow-xs'
              : 'bg-[#EDF2FF] hover:bg-[#DCE6FF] border-[#7B9BE6] text-[#24428C]'
          }`}
        >
          <TriDeepThinkerAvatar className="w-4 h-4" />
          <span>Trí (Đào sâu)</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenPeer('linhchi')}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-handwriting font-bold transition-all cursor-pointer ${
            activePeerDrawer === 'linhchi'
              ? 'bg-[#8C2852] text-white border-[#6E1C3E] shadow-xs'
              : 'bg-[#FFF0F5] hover:bg-[#FFE0EB] border-[#F29BB7] text-[#8C2852]'
          }`}
        >
          <LinhChiNoteTakerAvatar className="w-4 h-4" />
          <span>Linh Chi (Sổ tay công thức)</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenPeer('minhkhang')}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-handwriting font-bold transition-all cursor-pointer ${
            activePeerDrawer === 'minhkhang'
              ? 'bg-[#006064] text-white border-[#00484A] shadow-xs'
              : 'bg-[#E0F7FA] hover:bg-[#C8F1F7] border-[#4DD0E1] text-[#006064]'
          }`}
        >
          <MinhKhangInquisitiveAvatar className="w-4 h-4" />
          <span>Minh Khang (Ví dụ trực quan)</span>
        </button>
      </div>

      <span className="text-[11px] font-handwriting text-[#7A6D5E] hidden xl:inline">
        💡 Bấm vào bạn bất kỳ để mở Sổ tay riêng mà không che đề bài
      </span>

      {/* ========================================================================= */}
      {/* KHAY SỔ TAY & CHAT RIÊNG GÓC PHẢI (KHÔNG LÀM MỜ ĐỀ BÀI BÊN TRÁI!)        */}
      {/* ========================================================================= */}
      {activePeerDrawer && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] sm:w-[410px] bg-[#FFFDF7] border-2 border-[#2B1A07] rounded-xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom-5 duration-200">
          {/* Header của Khay Sổ Tay */}
          <div className="flex items-center justify-between border-b border-[#E8DFC8] pb-2">
            <div className="flex items-center gap-2.5">
              {activePeerDrawer === 'bo' && <BoAvatar size="sm" expression="skeptical" />}
              {activePeerDrawer === 'tri' && <TriDeepThinkerAvatar className="w-9 h-9" />}
              {activePeerDrawer === 'linhchi' && <LinhChiNoteTakerAvatar className="w-9 h-9" />}
              {activePeerDrawer === 'minhkhang' && <MinhKhangInquisitiveAvatar className="w-9 h-9" />}
              <div>
                <h3 className="font-handwriting font-bold text-base text-[#2B1A07]">
                  {activePeerDrawer === 'bo' && 'Tranh luận riêng cùng Bo'}
                  {activePeerDrawer === 'tri' && 'Đào sâu bản chất cùng Trí'}
                  {activePeerDrawer === 'linhchi' && 'Sổ tay & Chat cùng Linh Chi'}
                  {activePeerDrawer === 'minhkhang' && 'Góc Trực quan của Minh Khang'}
                </h3>
                <p className="text-[11px] font-mono text-[#7A6D5E] truncate max-w-[250px]">
                  Đang học: {lessonTopic}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivePeerDrawer(null)}
              className="w-7 h-7 rounded-full bg-[#EFE8DA] hover:bg-[#E0D6C3] text-[#2B1A07] font-bold text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* NỬA TRÊN: THẺ TUYỆT CHIÊU / SỔ TAY THẬT CỦA TỪNG BẠN (Không còn trống rỗng!) */}
          {activePeerDrawer === 'linhchi' && peerContext?.linhchi && (
            <div className="p-3 rounded-lg bg-[#FFF0F5] border border-[#F29BB7] space-y-1 text-xs">
              <div className="font-bold text-[#8C2852]">{peerContext.linhchi.cheatSheetTitle}</div>
              <ul className="space-y-1 text-[#4A152B] font-handwriting text-xs">
                {peerContext.linhchi.cheatSheetBullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {activePeerDrawer === 'minhkhang' && peerContext?.minhkhang && (
            <div className="p-3 rounded-lg bg-[#E0F7FA] border border-[#4DD0E1] space-y-1 text-xs">
              <div className="font-bold text-[#006064]">{peerContext.minhkhang.analogyTitle}</div>
              <p className="text-[#00484A] font-handwriting leading-snug">{peerContext.minhkhang.analogyContent}</p>
            </div>
          )}

          {activePeerDrawer === 'tri' && peerContext?.tri && (
            <div className="p-3 rounded-lg bg-[#EDF2FF] border border-[#7B9BE6] text-xs font-handwriting text-[#15326E]">
              {peerContext.tri.edgeCaseNote}
            </div>
          )}

          {/* NỬA DƯỚI: LUỒNG CHAT RIÊNG + NÚT HỎI NHANH ĐÚNG CHỦ ĐỀ BÀI HỌC */}
          <div className="max-h-[160px] overflow-y-auto p-2.5 bg-[#FAF7F0] rounded-lg border border-[#E8DEC8] space-y-2">
            {(chatHistories[activePeerDrawer] || []).map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] p-2 rounded-lg text-xs font-handwriting leading-snug ${
                    msg.sender === 'user'
                      ? 'bg-[#4E9B87] text-white'
                      : 'bg-white border border-[#DFD6C7] text-[#2F2923]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Gợi ý hỏi nhanh khớp 100% với bài đang học */}
          <div className="flex flex-wrap gap-1 text-[11px] font-handwriting">
            <span className="text-[#8A755D] self-center">Hỏi nhanh:</span>
            {(peerContext?.[activePeerDrawer]?.quickPrompts || [
              `Công thức cốt lõi của bài "${lessonTopic}" là gì?`,
              'Chỗ nào trong bài này dễ bị sập bẫy nhất?'
            ]).map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendPeerMessage(activePeerDrawer, q)}
                className="px-2 py-0.5 bg-white hover:bg-[#FFF8EB] border border-[#D8CEBC] rounded-full text-[#4A3D31] cursor-pointer text-left"
              >
                “{q}”
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={peerChatInput}
              onChange={(e) => setPeerChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPeerMessage(activePeerDrawer)}
              placeholder="Gõ câu hỏi riêng ngoài lề..."
              className="flex-1 bg-white border border-[#D5CBB9] rounded-lg px-2.5 py-1.5 text-xs font-handwriting outline-none focus:border-[#4E9B87]"
            />
            <button
              type="button"
              onClick={() => handleSendPeerMessage(activePeerDrawer)}
              className="px-3 py-1.5 bg-[#4E9B87] text-white font-handwriting font-bold text-xs rounded-lg cursor-pointer"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
