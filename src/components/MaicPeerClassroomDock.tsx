// File: src/components/MaicPeerClassroomDock.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PeerContextData } from '../types/dre';
import { 
  BoAvatar, 
  TriDeepThinkerAvatar, 
  LinhChiNoteTakerAvatar, 
  MinhKhangInquisitiveAvatar
} from './HandmadeArtwork';
import { sound } from '../utils/soundEffects';

// ============================================================================
// CUSTOM SVG ICONS CHO KHUNG CHAT RIÊNG (ZERO KEYBOARD EMOJI)
// ============================================================================
const ChatBubbleSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20H5.5C4.67157 20 4 19.3284 4 18.5V12Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M8.5 11H15.5M8.5 14.5H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const NotebookCardSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.5 8.5H15.5M8.5 12H15.5M8.5 15.5H12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SendArrowSvg = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4 12L20 4L13 20L11 13L4 12Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export interface MaicPeerClassroomDockProps {
  currentMode: string;
  currentState?: string;
  lessonTopic?: string;
  errorStepIndex?: number;
  peerContext?: PeerContextData;
  onSelectPeerPerspective?: (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang') => void;
  variant?: 'bar' | 'compact';
}

interface PeerChatMessage {
  sender: 'user' | 'peer';
  text: string;
}

const cleanText = (str?: string) =>
  str
    ? str
        .replace(/\u20d7/g, '')
        .replace(/📌|📝|🔍|😂|🤔|🟢|🌸|🧒|👓|⚡|🍕|💰|🏹/g, '')
        .trim()
    : '';

export const MaicPeerClassroomDock: React.FC<MaicPeerClassroomDockProps> = ({
  lessonTopic = 'Bài 1.1: Vectơ Trong Không Gian',
  peerContext,
  onSelectPeerPerspective,
  variant = 'compact',
}) => {
  const [activePeer, setActivePeer] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang' | null>(null);
  // Chuyển đổi gọn giữa tab "Chat" và tab "Sổ tay tóm tắt" để không chiếm chỗ của luồng tin nhắn!
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'note'>('chat');
  const [peerChatInput, setPeerChatInput] = useState<string>('');
  const [isPeerTyping, setIsPeerTyping] = useState<boolean>(false);

  const [chatHistories, setChatHistories] = useState<Record<'bo' | 'tri' | 'linhchi' | 'minhkhang', PeerChatMessage[]>>({
    bo: [],
    tri: [],
    linhchi: [],
    minhkhang: [],
  });

  // Ref để tự động cuộn xuống tin nhắn mới nhất 100% thời gian
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToLatestMessage = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  // Tự động cuộn mỗi khi mở hộp chat, đổi bạn học, hoặc có tin nhắn mới
  useEffect(() => {
    if (activePeer && activeSubTab === 'chat') {
      scrollToLatestMessage();
    }
  }, [activePeer, activeSubTab, chatHistories, isPeerTyping]);

  // Khởi tạo lời nhắn đầu tiên khớp với bài đang học
  useEffect(() => {
    setChatHistories({
      bo: [
        {
          sender: 'peer',
          text:
            cleanText(peerContext?.bo.hotTake) ||
            `Ở bài "${cleanText(lessonTopic)}", tớ thấy cứ tách thẳng dấu độ dài ra cộng 1 + 1 = 2 cho lẹ! Cậu chỉ ra chỗ tớ sai đi?`,
        },
      ],
      tri: [
        {
          sender: 'peer',
          text:
            cleanText(peerContext?.tri.edgeCaseNote) ||
            `Chào bạn! Cùng mình kiểm tra điều kiện cùng phương, cùng hướng và bất đẳng thức tam giác của bài "${cleanText(lessonTopic)}" nhé!`,
        },
      ],
      linhchi: [
        {
          sender: 'peer',
          text: `Mình đã ghi sẵn bộ công thức trọng tâm của bài "${cleanText(lessonTopic)}" bên tab [Sổ tay công thức] rồi. Bạn cần tra cứu quy tắc nào cứ hỏi mình nhé!`,
        },
      ],
      minhkhang: [
        {
          sender: 'peer',
          text:
            cleanText(peerContext?.minhkhang.analogyContent) ||
            `Cần ví dụ thực tế (như đường đi hay bắn cung) cho bài "${cleanText(lessonTopic)}" thì cứ hỏi mình nhé!`,
        },
      ],
    });
  }, [lessonTopic, peerContext]);

  const handleOpenPeer = (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang') => {
    sound.playBubblePop();
    if (activePeer === peerId) {
      setActivePeer(null);
    } else {
      setActivePeer(peerId);
      setActiveSubTab('chat');
      setPeerChatInput('');
      onSelectPeerPerspective?.(peerId);
    }
  };

  const handleSendPeerMessage = (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang', customText?: string) => {
    const textToSend = (customText || peerChatInput).trim();
    if (!textToSend) return;

    sound.playPencilTap();
    setPeerChatInput('');
    setActiveSubTab('chat'); // Đảm bảo luôn đang ở màn hình chat để thấy tin nhắn mới ngay

    setChatHistories((prev) => ({
      ...prev,
      [peerId]: [...prev[peerId], { sender: 'user', text: textToSend }],
    }));

    setIsPeerTyping(true);
    scrollToLatestMessage();

    setTimeout(() => {
      sound.playBubblePop();
      setIsPeerTyping(false);

      let reply = '';
      if (peerId === 'bo') {
        reply =
          cleanText(peerContext?.bo.defaultReply) ||
          'Ơ... phải gom BC + CC\' thành đường chéo mặt bên BC\' rồi mới tính Pytago ra căn 2 hả?! Hèn gì tớ tách 1 + 1 = 2 bị sai!';
      } else if (peerId === 'tri') {
        reply =
          cleanText(peerContext?.tri.defaultReply) ||
          'Chính xác! Hai vectơ muốn xét cùng hướng hay ngược hướng thì giá của chúng phải song song hoặc trùng nhau (cùng phương) trước đã.';
      } else if (peerId === 'linhchi') {
        reply =
          cleanText(peerContext?.linhchi.defaultReply) ||
          'Quy tắc chuẩn: 1) Nối tiếp: OA + AB = OB. 2) Hình bình hành: AB + AD = AC. 3) Hình hộp: AB + AD + AA\' = AC\'.';
      } else {
        reply =
          cleanText(peerContext?.minhkhang.defaultReply) ||
          'Tưởng tượng bạn đi ngang 1m từ B sang C, rồi đi thẳng đứng lên 1m từ C lên C\'. Khoảng cách chim bay BC\' là cạnh huyền căn(1² + 1²) = căn 2m!';
      }

      setChatHistories((prev) => ({
        ...prev,
        [peerId]: [...prev[peerId], { sender: 'peer', text: reply }],
      }));
      scrollToLatestMessage();
    }, 350);
  };

  const peerMeta = {
    bo: {
      name: 'Bo',
      role: 'Phản biện',
      fullRole: 'Phản biện bẫy trực giác',
      badgeBg: 'bg-[#FFF3D6] text-[#92400E] border-[#F59E0B]',
      activeBg: 'bg-[#D97706] text-white border-[#B45309]',
      headerBg: 'bg-[#FFFBF2] border-b-[#F3E3B8]',
      accentColor: '#D97706',
    },
    tri: {
      name: 'Trí',
      role: 'Đào sâu',
      fullRole: 'Đào sâu bản chất & Điều kiện',
      badgeBg: 'bg-[#EEF2FF] text-[#1E40AF] border-[#818CF8]',
      activeBg: 'bg-[#2563EB] text-white border-[#1D4ED8]',
      headerBg: 'bg-[#F5F8FF] border-b-[#D8E2FF]',
      accentColor: '#2563EB',
    },
    linhchi: {
      name: 'Linh Chi',
      role: 'Công thức',
      fullRole: 'Sổ tay công thức chuẩn',
      badgeBg: 'bg-[#FDF2F8] text-[#9D174D] border-[#F472B6]',
      activeBg: 'bg-[#DB2777] text-white border-[#BE185D]',
      headerBg: 'bg-[#FFF5F9] border-b-[#FAD1E4]',
      accentColor: '#DB2777',
    },
    minhkhang: {
      name: 'Minh Khang',
      role: 'Trực quan',
      fullRole: 'Ví dụ thực tế & Trực quan',
      badgeBg: 'bg-[#ECFEFF] text-[#155E75] border-[#22D3EE]',
      activeBg: 'bg-[#0891B2] text-white border-[#0E7490]',
      headerBg: 'bg-[#F2FCFE] border-b-[#C5EEF6]',
      accentColor: '#0891B2',
    },
  };

  const containerClasses =
    variant === 'compact'
      ? 'relative flex items-center gap-1.5 select-none'
      : 'relative w-full bg-white border border-[#E2D9C8] rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 text-xs shadow-2xs select-none';

  return (
    <div className={containerClasses}>
      {/* Thanh 4 Nút Bạn học gọn gàng trên 1 dòng duy nhất (Không bao giờ bị rớt chữ xuống dòng!) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6254] flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <span>Sổ tay 4 bạn:</span>
        </span>

        {(['bo', 'tri', 'linhchi', 'minhkhang'] as const).map((id) => {
          const isSelected = activePeer === id;
          const meta = peerMeta[id];
          const shortTag =
            id === 'bo'
              ? 'Phản biện'
              : id === 'tri'
              ? 'Đào sâu'
              : id === 'linhchi'
              ? 'Công thức'
              : 'Trực quan';

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleOpenPeer(id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                isSelected ? `${meta.activeBg} shadow-xs` : `${meta.badgeBg} hover:opacity-90`
              }`}
            >
              {/* Đủ 4 Avatar tròn đồng bộ kích thước w-4 h-4 cho cả 4 bạn */}
              {id === 'bo' && (
                <div className="w-4 h-4 rounded-full overflow-hidden bg-white shrink-0 border border-[#F59E0B]">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="48" fill="#FFF4DE" />
                    <path d="M26 42 C24 24, 38 18, 50 18 C62 18, 76 24, 74 42 Z" fill="#423429" />
                    <circle cx="50" cy="54" r="22" fill="#FFE5CC" />
                    <circle cx="41" cy="51" r="3.5" fill="#2B211A" />
                    <circle cx="59" cy="51" r="3.5" fill="#2B211A" />
                    <path d="M43 61 Q50 66 57 61" stroke="#382920" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              )}
              {id === 'tri' && <TriDeepThinkerAvatar className="w-4 h-4 shrink-0" />}
              {id === 'linhchi' && <LinhChiNoteTakerAvatar className="w-4 h-4 shrink-0" />}
              {id === 'minhkhang' && <MinhKhangInquisitiveAvatar className="w-4 h-4 shrink-0" />}

              <span>
                {meta.name} ({shortTag})
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* KHUNG CHAT RIÊNG BÊN PHẢI: CAO THOÁNG, TỰ CUỘN XUỐNG TIN NHẮN MỚI 100%!  */}
      {/* ========================================================================= */}
      {activePeer && (
        <div className="fixed top-14 bottom-3 right-3 z-50 w-[360px] sm:w-[395px] bg-white border-2 border-[#1E242B] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-150">
          
          {/* 1. HEADER + NÚT CHUYỂN NHANH [TRÒ CHUYỆN] <-> [SỔ TAY] */}
          <div className={`p-3 border-b ${peerMeta[activePeer].headerBg} shrink-0 space-y-2.5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {activePeer === 'bo' && <BoAvatar size="sm" expression="skeptical" />}
                {activePeer === 'tri' && <TriDeepThinkerAvatar className="w-8 h-8" />}
                {activePeer === 'linhchi' && <LinhChiNoteTakerAvatar className="w-8 h-8" />}
                {activePeer === 'minhkhang' && <MinhKhangInquisitiveAvatar className="w-8 h-8" />}
                <div>
                  <h3 className="font-bold text-sm text-[#1E242B]">
                    Trao đổi riêng cùng {peerMeta[activePeer].name}
                  </h3>
                  <p className="text-[11px] font-medium text-[#6E6254]">
                    Vai trò: {peerMeta[activePeer].fullRole}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePeer(null)}
                className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-[#1E242B] font-bold text-xs cursor-pointer flex items-center justify-center"
                title="Đóng cửa sổ chat riêng"
              >
                ✕
              </button>
            </div>

            {/* Thanh gạt 2 chế độ: Giúp khung chat rộng gấp đôi, không bị thẻ Sổ tay chèn ép! */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/5 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSubTab('chat')}
                className={`py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  activeSubTab === 'chat'
                    ? 'bg-white text-[#1E242B] shadow-2xs'
                    : 'text-[#6E6254] hover:text-[#1E242B]'
                }`}
              >
                <ChatBubbleSvg className="w-3.5 h-3.5" />
                <span>Trò chuyện ({chatHistories[activePeer]?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('note')}
                className={`py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  activeSubTab === 'note'
                    ? 'bg-white text-[#1E242B] shadow-2xs'
                    : 'text-[#6E6254] hover:text-[#1E242B]'
                }`}
              >
                <NotebookCardSvg className="w-3.5 h-3.5" />
                <span>Sổ tay của {peerMeta[activePeer].name}</span>
              </button>
            </div>
          </div>

          {/* 2. VÙNG NỘI DUNG CHÍNH (CHIẾM TRỌN CHIỀU CAO Ở GIỮA - TỰ ĐỘNG CUỘN MƯỢT!) */}
          {activeSubTab === 'chat' ? (
            <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 bg-[#FAF8F5] space-y-2.5">
              {(chatHistories[activePeer] || []).map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-semibold text-[#8A7D6F] mb-0.5 px-1">
                    {msg.sender === 'user' ? 'Bạn' : peerMeta[activePeer].name}
                  </span>
                  <div
                    className={`max-w-[86%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#1B4338] text-white rounded-br-xs font-medium'
                        : 'bg-white border border-[#E2D9C8] text-[#1E242B] rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isPeerTyping && (
                <div className="flex items-center gap-2 text-xs text-[#6E6254] font-medium px-2 py-1">
                  <span className="w-2 h-2 rounded-full bg-[#1B4338] animate-ping" />
                  <span>{peerMeta[activePeer].name} đang trả lời...</span>
                </div>
              )}

              {/* Điểm neo tự động trượt xuống đáy khi có tin nhắn mới */}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          ) : (
            /* Tab 2: Sổ tay công thức / Ẩn dụ của riêng bạn đó (Rộng rãi, dễ đọc) */
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-[#FAF8F5] space-y-3">
              {activePeer === 'linhchi' && peerContext?.linhchi && (
                <div className="p-3.5 rounded-xl bg-white border border-[#F472B6] space-y-2 shadow-2xs">
                  <div className="font-bold text-sm text-[#9D174D]">
                    {cleanText(peerContext.linhchi.cheatSheetTitle)}
                  </div>
                  <ul className="space-y-2 text-xs text-[#1E242B] leading-relaxed">
                    {peerContext.linhchi.cheatSheetBullets.map((b, i) => (
                      <li key={i} className="p-2 rounded-lg bg-[#FDF2F8] border border-[#FCE7F3]">
                        {cleanText(b)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activePeer === 'minhkhang' && peerContext?.minhkhang && (
                <div className="p-3.5 rounded-xl bg-white border border-[#22D3EE] space-y-2 shadow-2xs">
                  <div className="font-bold text-sm text-[#155E75]">
                    {cleanText(peerContext.minhkhang.analogyTitle)}
                  </div>
                  <p className="text-xs text-[#1E242B] leading-relaxed whitespace-pre-line">
                    {cleanText(peerContext.minhkhang.analogyContent)}
                  </p>
                </div>
              )}

              {activePeer === 'tri' && peerContext?.tri && (
                <div className="p-3.5 rounded-xl bg-white border border-[#818CF8] space-y-2 shadow-2xs">
                  <div className="font-bold text-sm text-[#1E40AF]">
                    Góc phân tích điều kiện biên của Trí
                  </div>
                  <p className="text-xs text-[#1E242B] leading-relaxed">
                    {cleanText(peerContext.tri.edgeCaseNote)}
                  </p>
                </div>
              )}

              {activePeer === 'bo' && peerContext?.bo && (
                <div className="p-3.5 rounded-xl bg-white border border-[#F59E0B] space-y-2 shadow-2xs">
                  <div className="font-bold text-sm text-[#92400E]">
                    Lập luận đi tắt của Bo trong bài này
                  </div>
                  <p className="text-xs text-[#1E242B] leading-relaxed">
                    {cleanText(peerContext.bo.hotTake)}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveSubTab('chat')}
                className="w-full py-2 rounded-xl bg-[#1B4338] text-white font-semibold text-xs cursor-pointer"
              >
                Quay lại khung Trò chuyện ➔
              </button>
            </div>
          )}

          {/* 3. ĐÁY KHUNG CHAT: GỢI Ý HỎI NHANH GỌN + Ô NHẬP TIN NHẮN */}
          <div className="p-3 bg-white border-t border-[#EFE8DC] space-y-2 shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7D6F] block">
                Bấm hỏi nhanh:
              </span>
              <div className="flex flex-col gap-1">
                {(peerContext?.[activePeer]?.quickPrompts || [
                  'Công thức trọng tâm của bài này là gì?',
                  'Chỗ nào trong bài này dễ bị sập bẫy nhất?',
                ]).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendPeerMessage(activePeer, cleanText(q))}
                    className="w-full text-left px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EBF7F3] border border-[#E2D9C8] hover:border-[#2E6859] rounded-lg text-xs text-[#1E242B] font-medium cursor-pointer transition-colors truncate"
                    title={cleanText(q)}
                  >
                    “{cleanText(q)}”
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <input
                type="text"
                value={peerChatInput}
                onChange={(e) => setPeerChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPeerMessage(activePeer)}
                placeholder={`Nhắn riêng cho ${peerMeta[activePeer].name}...`}
                className="flex-1 bg-[#FAF8F5] border border-[#D8CEBC] rounded-xl px-3 py-2 text-xs text-[#1E242B] outline-none focus:border-[#1B4338]"
              />
              <button
                type="button"
                onClick={() => handleSendPeerMessage(activePeer)}
                className="px-3.5 py-2 bg-[#1B4338] hover:bg-[#285E4F] text-white font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>Gửi</span>
                <SendArrowSvg className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
