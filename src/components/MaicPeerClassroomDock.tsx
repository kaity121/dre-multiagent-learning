import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  BoAvatar, 
  TriDeepThinkerAvatar, 
  LinhChiNoteTakerAvatar, 
  MinhKhangInquisitiveAvatar, 
  SoundSpeakerIcon, 
  HeatmapFlameIcon,
  SparkleIcon,
  PushPin,
  WashiTape,
  CheckCircleIcon
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

export interface MaicPeerClassroomDockProps {
  currentMode: string;
  currentState?: string;
  lessonTopic?: string;
  errorStepIndex?: number;
  onSelectPeerPerspective?: (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang') => void;
}

interface PeerChatMessage {
  sender: 'user' | 'peer';
  text: string;
}

export const MaicPeerClassroomDock: React.FC<MaicPeerClassroomDockProps> = ({
  currentMode,
  currentState = 'INIT',
  lessonTopic = 'Quy tắc toán học',
  errorStepIndex = 2,
  onSelectPeerPerspective,
}) => {
  const [activePeerModal, setActivePeerModal] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang' | 'heatmap' | null>(null);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(sound.getEnabled());
  const [peerChatInput, setPeerChatInput] = useState<string>('');
  
  // Interactive mini chat history for each peer
  const [chatHistories, setChatHistories] = useState<Record<'bo' | 'tri' | 'linhchi' | 'minhkhang', PeerChatMessage[]>>({
    bo: [
      { sender: 'peer', text: 'Tớ thấy biểu thức có số giống nhau ở cả tử và mẫu thì cứ gạch phăng đi cho nhanh! Cậu chỉ ra xem tớ sai ở đâu nào?' }
    ],
    tri: [
      { sender: 'peer', text: 'Chào cậu! Cậu có thắc mắc gì về bản chất tại sao quy tắc toán học lại hoạt động như vậy không? Cứ hỏi tớ nhé!' }
    ],
    linhchi: [
      { sender: 'peer', text: 'Tớ đã tóm tắt sẵn các công thức và điều kiện xác định quan trọng rồi! Cậu cần tra cứu phần nào?' }
    ],
    minhkhang: [
      { sender: 'peer', text: 'Toán học không hề khô khan đâu! Cậu thấy bước nào khó hiểu, tớ sẽ lấy ví dụ đời sống minh họa cho xem!' }
    ]
  });

  const handleToggleSound = () => {
    const next = sound.toggle();
    setIsSoundOn(next);
    if (next) sound.playPencilTap();
  };

  const handleOpenPeer = (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang') => {
    sound.playBubblePop();
    setActivePeerModal(peerId);
    setPeerChatInput('');
    if (onSelectPeerPerspective) {
      onSelectPeerPerspective(peerId);
    }
  };

  const handleSendPeerMessage = (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang', customText?: string) => {
    const textToSend = (customText || peerChatInput).trim();
    if (!textToSend) return;

    sound.playPencilTap();
    setPeerChatInput('');

    // Append user message
    setChatHistories(prev => ({
      ...prev,
      [peerId]: [...prev[peerId], { sender: 'user', text: textToSend }]
    }));

    // Auto-reply in character
    setTimeout(() => {
      sound.playBubblePop();
      let reply = '';
      const lower = textToSend.toLowerCase();

      if (peerId === 'bo') {
        if (lower.includes('nhân') || lower.includes('cộng') || lower.includes('đổi dấu') || lower.includes('mẫu') || lower.includes('sai')) {
          reply = 'Ơ... cậu nói thế làm tớ hơi giật mình rồi đấy! Phép cộng không phải phép nhân nên không gạch ngang được hả? Để tớ kiểm tra lại xem!';
        } else {
          reply = 'Haha cậu giải thích thế tớ chưa phục đâu! Thử cho một ví dụ bằng số cụ thể chứng minh xem nào!';
        }
      } else if (peerId === 'tri') {
        reply = 'Một câu hỏi đào sâu rất hay! Bản chất toán học ở đây là tính bảo toàn giá trị biểu thức. Nếu ta chia hay nhân mẫu số với một số bằng 0, phép tính sẽ vô nghĩa ngay!';
      } else if (peerId === 'linhchi') {
        reply = 'Ghi nhớ công thức vàng nhé: Quy đồng mẫu thức phải tìm Mẫu thức chung (MTC), sau đó nhân cả tử và mẫu với nhân tử phụ tương ứng! Đừng quên điều kiện xác định!';
      } else if (peerId === 'minhkhang') {
        reply = 'Dễ hiểu lắm! Cậu cứ tưởng tượng phân số như việc gộp 2 miếng bánh pizza khác cỡ. Phải cắt về cùng một kích cỡ phần nhỏ (mẫu số chung) thì mới đếm tổng được chứ!';
      }

      setChatHistories(prev => ({
        ...prev,
        [peerId]: [...prev[peerId], { sender: 'peer', text: reply }]
      }));
    }, 450);
  };

  return (
    <div className="w-full bg-[#FAF6EE] border-x border-b border-[#DDD3C4] px-2.5 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs select-none">
      {/* Zone 1: MAIC Living Peer Roster (Bộ tứ bạn học MAIC) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-[11px] font-mono uppercase font-bold text-[#8A755D] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D] animate-ping" />
          <span>Bạn học MAIC:</span>
        </span>

        {/* Peer 1: Bo (Class Clown / Fallacy Sparring) */}
        <button
          type="button"
          onClick={() => handleOpenPeer('bo')}
          className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFF4DE] hover:bg-[#FFE8BD] border border-[#E8A33D] text-[#7A4B12] font-handwriting font-bold transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer active:scale-95"
          title="Bấm để nghe Bo cãi & nhắn tin phản biện trực tiếp với Bo"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden bg-white shrink-0 border border-[#E8A33D]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="46" fill="#FFF4DE" />
              <path d="M26 42 C24 24, 38 18, 50 18 C62 18, 76 24, 74 42 Z" fill="#423429" />
              <circle cx="50" cy="52" r="22" fill="#FFE5CC" />
              <circle cx="40" cy="50" r="3" fill="#2B211A" />
              <circle cx="60" cy="50" r="3" fill="#2B211A" />
              <path d="M44 60 Q50 64 56 60" stroke="#382920" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span className="text-xs">Bo (Phản biện)</span>
        </button>

        {/* Peer 2: Trí (Deep Thinker / In-depth Discussion) */}
        <button
          type="button"
          onClick={() => handleOpenPeer('tri')}
          className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EDF2FF] hover:bg-[#DCE6FF] border border-[#7B9BE6] text-[#24428C] font-handwriting font-bold transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer active:scale-95"
          title="Bấm để nhắn tin hỏi Trí đào sâu câu hỏi 'Tại sao lại như vậy?'"
        >
          <TriDeepThinkerAvatar className="w-5 h-5" />
          <span className="text-xs">Trí (Đào sâu)</span>
        </button>

        {/* Peer 3: Linh Chi (Note Taker / Cheat Sheet) */}
        <button
          type="button"
          onClick={() => handleOpenPeer('linhchi')}
          className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFF0F5] hover:bg-[#FFE0EB] border border-[#F29BB7] text-[#8C2852] font-handwriting font-bold transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer active:scale-95"
          title="Bấm để nhắn tin xin Sổ tay bỏ túi & tóm tắt công thức từ Linh Chi"
        >
          <LinhChiNoteTakerAvatar className="w-5 h-5" />
          <span className="text-xs">Linh Chi (Ghi chú)</span>
        </button>

        {/* Peer 4: Minh Khang (Inquisitive Mind / Practical Analogy) */}
        <button
          type="button"
          onClick={() => handleOpenPeer('minhkhang')}
          className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E0F7FA] hover:bg-[#C8F1F7] border border-[#4DD0E1] text-[#006064] font-handwriting font-bold transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer active:scale-95"
          title="Bấm để nhắn tin hỏi Minh Khang liên hệ ví dụ đời sống trực quan"
        >
          <MinhKhangInquisitiveAvatar className="w-5 h-5" />
          <span className="text-xs">Minh Khang (Trực quan)</span>
        </button>
      </div>

      {/* Zone 2: MAIC Session Controller HUD & Tactile Audio Controls */}
      <div className="flex items-center gap-2">
        {/* Misconception Heatmap Button */}
        <button
          type="button"
          onClick={() => {
            sound.playPencilTap();
            setActivePeerModal('heatmap');
          }}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF8EB] hover:bg-[#FFF0D4] border border-[#E8C582] text-[#8C5D19] font-handwriting font-bold transition-all cursor-pointer hover:scale-105"
          title="Xem Bản đồ nhiệt các bẫy ngộ nhận thường gặp (MAIC Behavioral Analytics)"
        >
          <HeatmapFlameIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
          <span className="text-xs">Bản đồ nhiệt ngộ nhận</span>
        </button>

        {/* Sound toggle button (Superr tactile stationery sound) */}
        <button
          type="button"
          onClick={handleToggleSound}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all cursor-pointer text-xs font-mono font-bold ${
            isSoundOn 
              ? 'bg-[#EAF6ED] text-[#24613B] border-[#72C18E]' 
              : 'bg-white text-[#8A7D6F] border-[#D8CEBE]'
          }`}
          title={isSoundOn ? 'Âm thanh xúc giác: ĐANG BẬT (Bấm để tắt)' : 'Âm thanh xúc giác: ĐANG TẮT (Bấm để bật)'}
        >
          <SoundSpeakerIcon isMuted={!isSoundOn} className="w-3.5 h-3.5" />
          <span className="text-[11px]">{isSoundOn ? 'Âm thanh' : 'Tắt âm'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: Interactive Peer Hot Take & Real-time Mini Chat */}
      {/* ========================================================================= */}
      {activePeerModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
          onClick={() => setActivePeerModal(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#FFFDF7] p-4 sm:p-6 rounded-2xl border-2 border-[#2B1A07] shadow-2xl space-y-3 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner washi tape */}
            <WashiTape variant="blue" className="absolute -top-3 left-10 w-24 -rotate-2" />

            {/* Modal Header by Peer */}
            {activePeerModal === 'bo' && (
              <div className="flex items-center gap-3 border-b border-[#E8DFC8] pb-2.5">
                <BoAvatar size="sm" expression="skeptical" />
                <div>
                  <h3 className="font-handwriting font-bold text-lg text-[#2B1A07]">
                    Nhắn tin trao đổi cùng Bo (Class Clown)
                  </h3>
                  <p className="text-[11px] font-mono text-[#8C5D19]">
                    Vai trò MAIC: Đấu trí phản biện, lật tẩy bẫy tư duy trực giác
                  </p>
                </div>
              </div>
            )}

            {activePeerModal === 'tri' && (
              <div className="flex items-center gap-3 border-b border-[#E8DFC8] pb-2.5">
                <TriDeepThinkerAvatar className="w-10 h-10" />
                <div>
                  <h3 className="font-handwriting font-bold text-lg text-[#24428C]">
                    Nhắn tin trao đổi cùng Trí (Deep Thinker)
                  </h3>
                  <p className="text-[11px] font-mono text-[#4B6CB7]">
                    Vai trò MAIC: Thảo luận sâu (ID), đào sâu câu hỏi cốt lõi
                  </p>
                </div>
              </div>
            )}

            {activePeerModal === 'linhchi' && (
              <div className="flex items-center gap-3 border-b border-[#E8DFC8] pb-2.5">
                <LinhChiNoteTakerAvatar className="w-10 h-10" />
                <div>
                  <h3 className="font-handwriting font-bold text-lg text-[#8C2852]">
                    Sổ tay & Chat cùng Linh Chi (Note Taker)
                  </h3>
                  <p className="text-[11px] font-mono text-[#E27396]">
                    Vai trò MAIC: Tóm tắt bài học (CM), cung cấp công thức chuẩn
                  </p>
                </div>
              </div>
            )}

            {activePeerModal === 'minhkhang' && (
              <div className="flex items-center gap-3 border-b border-[#E8DFC8] pb-2.5">
                <MinhKhangInquisitiveAvatar className="w-10 h-10" />
                <div>
                  <h3 className="font-handwriting font-bold text-lg text-[#006064]">
                    Nhắn tin trao đổi cùng Minh Khang (Inquisitive Mind)
                  </h3>
                  <p className="text-[11px] font-mono text-[#0097A7]">
                    Vai trò MAIC: Đưa ví dụ đời thực, hình tượng hóa toán học
                  </p>
                </div>
              </div>
            )}

            {activePeerModal === 'heatmap' && (
              <div className="flex items-center gap-2 border-b border-[#E8DFC8] pb-2">
                <HeatmapFlameIcon className="w-5 h-5 text-[#E8A33D]" />
                <div>
                  <h3 className="font-handwriting font-bold text-lg text-[#2B1A07]">
                    Bản Đồ Nhiệt Ngộ Nhận (MAIC Behavioral Analytics)
                  </h3>
                  <p className="text-[11px] font-mono text-[#8C5D19]">
                    Dữ liệu tổng hợp từ 500+ học sinh và các ca cãi ngẫu nhiên của Bo
                  </p>
                </div>
              </div>
            )}

            {/* Modal Body for Heatmap */}
            {activePeerModal === 'heatmap' ? (
              <div className="space-y-2 text-xs font-handwriting py-1 flex-1 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-[#FFF5E6] border border-[#FAD7A0] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#8C5D19]">Bước 1: Phân tích tử và mẫu thành nhân tử</p>
                    <p className="text-[#6B5A4B] text-[11px]">Lỗi quên đặt nhân tử chung ra ngoài</p>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-[#FFE8CC] text-[#D97706]">
                    32% vướng
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#FFEBE6] border border-[#F8B4A5] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#B91C1C]">Bước 2: Rút gọn số hạng tự do (Bẫy của Bo!)</p>
                    <p className="text-[#6B5A4B] text-[11px]">Gạch bỏ số giống nhau ở phép cộng không đổi dấu</p>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626]">
                    74% vướng 🔥
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#15803D]">Bước 3: Viết kết quả tối giản</p>
                    <p className="text-[#6B5A4B] text-[11px]">Hầu hết làm đúng khi vượt qua bước 2</p>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                    14% vướng
                  </span>
                </div>
              </div>
            ) : (
              /* Modal Body for 4 PEERS: Interactive Mini Chat Room */
              <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
                {/* Chat Message Stream */}
                <div className="flex-1 overflow-y-auto max-h-[220px] p-2.5 bg-[#FAF7F0] rounded-xl border border-[#E8DEC8] space-y-2">
                  {(chatHistories[activePeerModal] || []).map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] p-2.5 rounded-xl text-xs font-handwriting leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#4E9B87] text-white rounded-br-xs'
                          : activePeerModal === 'bo'
                          ? 'bg-[#FFF2D9] text-[#4A3215] border border-[#F2D7A5] rounded-bl-xs'
                          : activePeerModal === 'tri'
                          ? 'bg-[#EEF4FF] text-[#15326E] border border-[#C5D7FF] rounded-bl-xs'
                          : activePeerModal === 'linhchi'
                          ? 'bg-[#FFF0F5] text-[#6E1C3E] border border-[#FAD0DE] rounded-bl-xs'
                          : 'bg-[#E0F7FA] text-[#00484A] border border-[#B2EBF2] rounded-bl-xs'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap gap-1.5 text-[11px] font-handwriting">
                  <span className="text-[#8A755D] self-center">Hỏi nhanh:</span>
                  {activePeerModal === 'bo' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSendPeerMessage('bo', 'Phép cộng không được gạch tùy tiện như phép nhân đâu Bo!')}
                        className="px-2 py-0.5 bg-white border border-[#E8A33D] rounded-full text-[#8C5D19] hover:bg-[#FFF4DE] cursor-pointer"
                      >
                        "Phép cộng không gạch được!"
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendPeerMessage('bo', 'Nếu x = 2 thì cách làm của cậu ra kết quả sai hoàn toàn!')}
                        className="px-2 py-0.5 bg-white border border-[#E8A33D] rounded-full text-[#8C5D19] hover:bg-[#FFF4DE] cursor-pointer"
                      >
                        "Thử thay số x = 2 xem!"
                      </button>
                    </>
                  )}

                  {activePeerModal === 'tri' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSendPeerMessage('tri', 'Tại sao mẫu số chứa biến thì bắt buộc phải đặt ĐKXĐ khác 0?')}
                        className="px-2 py-0.5 bg-white border border-[#7B9BE6] rounded-full text-[#24428C] hover:bg-[#EDF2FF] cursor-pointer"
                      >
                        "Tại sao phải đặt ĐKXĐ?"
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendPeerMessage('tri', 'Nếu mẫu bằng 0 thì biểu thức sẽ như thế nào?')}
                        className="px-2 py-0.5 bg-white border border-[#7B9BE6] rounded-full text-[#24428C] hover:bg-[#EDF2FF] cursor-pointer"
                      >
                        "Nếu mẫu bằng 0 thì sao?"
                      </button>
                    </>
                  )}

                  {activePeerModal === 'linhchi' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSendPeerMessage('linhchi', 'Quy tắc đổi dấu phân số khi mẫu âm là gì vậy Chi?')}
                        className="px-2 py-0.5 bg-white border border-[#F29BB7] rounded-full text-[#8C2852] hover:bg-[#FFF0F5] cursor-pointer"
                      >
                        "Quy tắc đổi dấu mẫu âm?"
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendPeerMessage('linhchi', 'Nhắc lại các bước quy đồng mẫu thức chuẩn với!')}
                        className="px-2 py-0.5 bg-white border border-[#F29BB7] rounded-full text-[#8C2852] hover:bg-[#FFF0F5] cursor-pointer"
                      >
                        "Các bước quy đồng chuẩn?"
                      </button>
                    </>
                  )}

                  {activePeerModal === 'minhkhang' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSendPeerMessage('minhkhang', 'Ví dụ cắt bánh pizza quy đồng mẫu số là như thế nào Khang?')}
                        className="px-2 py-0.5 bg-white border border-[#4DD0E1] rounded-full text-[#006064] hover:bg-[#E0F7FA] cursor-pointer"
                      >
                        "Ví dụ cắt bánh pizza?"
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendPeerMessage('minhkhang', 'Còn ví dụ đổi tiền mệnh giá khác nhau thì sao?')}
                        className="px-2 py-0.5 bg-white border border-[#4DD0E1] rounded-full text-[#006064] hover:bg-[#E0F7FA] cursor-pointer"
                      >
                        "Ví dụ đổi tiền cùng mệnh giá?"
                      </button>
                    </>
                  )}
                </div>

                {/* Chat Input Field */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={peerChatInput}
                    onChange={(e) => setPeerChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendPeerMessage(activePeerModal);
                    }}
                    placeholder={`Nhắn tin trao đổi cùng ${
                      activePeerModal === 'bo' ? 'Bo' : activePeerModal === 'tri' ? 'Trí' : activePeerModal === 'linhchi' ? 'Linh Chi' : 'Minh Khang'
                    }...`}
                    className="flex-1 bg-white border border-[#D5CBB9] rounded-xl px-3 py-1.5 text-xs font-handwriting text-[#2B1A07] outline-none focus:border-[#4E9B87]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendPeerMessage(activePeerModal)}
                    disabled={!peerChatInput.trim()}
                    className="px-3 py-1.5 bg-[#4E9B87] hover:bg-[#3D8270] disabled:opacity-40 text-white font-handwriting font-bold text-xs rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  sound.playPencilTap();
                  setActivePeerModal(null);
                }}
                className="px-4 py-1.5 bg-[#2B1A07] hover:bg-[#452D14] text-white font-handwriting font-bold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
