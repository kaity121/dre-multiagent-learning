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
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activePeer, setActivePeer] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang'>('linhchi');
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'note'>('chat');
  const [peerChatInput, setPeerChatInput] = useState<string>('');
  const [isPeerTyping, setIsPeerTyping] = useState<boolean>(false);

  const [chatHistories, setChatHistories] = useState<Record<'bo' | 'tri' | 'linhchi' | 'minhkhang', PeerChatMessage[]>>({
    bo: [],
    tri: [],
    linhchi: [],
    minhkhang: [],
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToLatestMessage = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  useEffect(() => {
    if (isDrawerOpen && activeSubTab === 'chat') {
      scrollToLatestMessage();
    }
  }, [isDrawerOpen, activePeer, activeSubTab, chatHistories, isPeerTyping]);

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

  const handleSelectPeer = (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang') => {
    sound.playBubblePop();
    setActivePeer(peerId);
    setIsDrawerOpen(true);
    onSelectPeerPerspective?.(peerId);
  };

  const handleSendPeerMessage = (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang', customText?: string) => {
    const textToSend = (customText || peerChatInput).trim();
    if (!textToSend) return;

    sound.playPencilTap();
    setPeerChatInput('');
    setActiveSubTab('chat');

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
      shortRole: 'Gật gù / Mắc bẫy',
      role: 'Phản biện & Vệ sĩ bẫy ngộ nhận',
      speech: '“Mình hay nhầm chỗ này lắm, bạn xem hộ mình với!”',
      power: 'Bo sai trước để bạn mạnh dạn sửa bài và không sợ sai.',
      tabActive: 'bg-[#D97706] text-white border-[#D97706]',
      tabInactive: 'bg-[#FFFBF2] text-[#92400E] border-[#F3DFA8]',
    },
    tri: {
      name: 'Trí',
      shortRole: 'Đào sâu bản chất',
      role: 'Đào sâu bản chất & Điều kiện',
      speech: '“Tại sao lại có công thức này nhỉ? Cùng mình đào sâu nhé!”',
      power: 'Xoáy sâu vào điều kiện biên & hiểu sâu nguyên lý gốc rễ.',
      tabActive: 'bg-[#2563EB] text-white border-[#2563EB]',
      tabInactive: 'bg-[#F5F8FF] text-[#1E40AF] border-[#D8E2FF]',
    },
    linhchi: {
      name: 'Linh Chi',
      shortRole: 'Ghi sổ tay',
      role: 'Sổ tay công thức & Cheat Sheet',
      speech: '“Mình đã tóm tắt công thức trọng tâm rồi, cần tra cứu cứ bảo mình!”',
      power: 'Lập bảng quy tắc chuẩn mực & cấu trúc lại các bước giải.',
      tabActive: 'bg-[#DB2777] text-white border-[#DB2777]',
      tabInactive: 'bg-[#FFF5F9] text-[#9D174D] border-[#FAD1E4]',
    },
    minhkhang: {
      name: 'Minh Khang',
      shortRole: 'Trực quan đời sống',
      role: 'Ví dụ thực tế & Trực quan sinh động',
      speech: '“Tưởng tượng như bước đi ngoài đời thực, hình dung sẽ dễ hơn nhiều!”',
      power: 'Biến các công thức khô khan thành hình ảnh thực tế sống động.',
      tabActive: 'bg-[#0891B2] text-white border-[#0891B2]',
      tabInactive: 'bg-[#F2FCFE] text-[#155E75] border-[#C5EEF6]',
    },
  };

  return (
    <>
      {/* 1 NÚT PILL GỌN DUY NHẤT (Không bao giờ tràn lề hay làm rối thanh Tab!) */}
      <button
        type="button"
        onClick={() => {
          sound.playBubblePop();
          setIsDrawerOpen((prev) => !prev);
        }}
        className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
          isDrawerOpen
            ? 'bg-[#0e7490] text-white border-[#0e7490] shadow-xs'
            : 'bg-white hover:bg-[#FAF8F5] text-[#1E242B] border-[#D8CEBC] shadow-2xs'
        }`}
      >
        <div className="flex items-center -space-x-1.5">
          <TriDeepThinkerAvatar className="w-4 h-4 rounded-full bg-white ring-1 ring-[#E2D9C8]" />
          <LinhChiNoteTakerAvatar className="w-4 h-4 rounded-full bg-white ring-1 ring-[#E2D9C8]" />
          <MinhKhangInquisitiveAvatar className="w-4 h-4 rounded-full bg-white ring-1 ring-[#E2D9C8]" />
        </div>
        <span>Sổ tay & Hỏi riêng 4 bạn</span>
      </button>

      {/* NGĂN KÉO CHAT RIÊNG & SỔ TAY (Tích hợp bộ chọn 4 bạn ngay bên trong Drawer) */}
      {isDrawerOpen && (
        <div className="fixed top-14 bottom-3 right-3 z-50 w-[370px] sm:w-[400px] bg-white border border-[#1E242B]/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-150">
          
          {/* Header: Chọn nhanh 1 trong 4 bạn ngay trên đầu Drawer */}
          <div className="p-3 bg-[#FAF8F5] border-b border-[#EFE8DC] space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E242B]">
                Chọn bạn đồng hành để hỏi riêng hoặc xem Sổ tay:
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 text-[#1E242B] font-bold text-xs cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* 4 Nút chọn bạn gọn đẹp bên trong Drawer */}
            <div className="grid grid-cols-4 gap-1.5">
              {(['bo', 'tri', 'linhchi', 'minhkhang'] as const).map((id) => {
                const isSelected = activePeer === id;
                const meta = peerMeta[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectPeer(id)}
                    className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      isSelected ? `${meta.tabActive} font-bold shadow-2xs` : `${meta.tabInactive} hover:opacity-90 font-medium`
                    }`}
                  >
                    <span className="text-xs leading-none">{meta.name}</span>
                    <span className="text-[10px] opacity-85 leading-none">{meta.shortRole}</span>
                  </button>
                );
              })}
            </div>

            {/* Khẩu quyết 10s của bạn đang chọn */}
            <div className="p-2 rounded-xl bg-white border border-slate-200/90 text-xs space-y-0.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#0e7490]">{peerMeta[activePeer].role}</span>
                <span className="text-[10px] text-slate-400 font-mono">10s Guide</span>
              </div>
              <p className="text-[11px] text-slate-700 italic font-medium leading-snug">
                {peerMeta[activePeer].speech}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                ⚡ {peerMeta[activePeer].power}
              </p>
            </div>

            {/* Thanh gạt: [Trò chuyện] <-> [Sổ tay tóm tắt] */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/5 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSubTab('chat')}
                className={`py-1 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  activeSubTab === 'chat' ? 'bg-white text-[#1E242B] shadow-2xs' : 'text-[#6E6254]'
                }`}
              >
                <ChatBubbleSvg className="w-3.5 h-3.5" />
                <span>Trò chuyện ({chatHistories[activePeer]?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('note')}
                className={`py-1 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  activeSubTab === 'note' ? 'bg-white text-[#1E242B] shadow-2xs' : 'text-[#6E6254]'
                }`}
              >
                <NotebookCardSvg className="w-3.5 h-3.5" />
                <span>Sổ tay của {peerMeta[activePeer].name}</span>
              </button>
            </div>
          </div>

          {/* Nội dung Chat hoặc Sổ tay */}
          {activeSubTab === 'chat' ? (
            <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 bg-white space-y-2.5">
              {(chatHistories[activePeer] || []).map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-semibold text-[#8A7D6F] mb-0.5 px-1">
                    {msg.sender === 'user' ? 'Bạn' : peerMeta[activePeer].name}
                  </span>
                  <div
                    className={`max-w-[86%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0e7490] text-white rounded-br-xs font-medium'
                        : 'bg-[#FAF8F5] border border-[#EFE8DC] text-[#1E242B] rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isPeerTyping && (
                <div className="flex items-center gap-2 text-xs text-[#6E6254] font-medium px-2 py-1">
                  <span className="w-2 h-2 rounded-full bg-[#0e7490] animate-ping" />
                  <span>{peerMeta[activePeer].name} đang trả lời...</span>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-white space-y-3">
              {activePeer === 'linhchi' && peerContext?.linhchi && (
                <div className="p-3.5 rounded-xl bg-[#FFF5F9] border border-[#FAD1E4] space-y-2">
                  <div className="font-bold text-sm text-[#9D174D]">
                    {cleanText(peerContext.linhchi.cheatSheetTitle)}
                  </div>
                  <ul className="space-y-2 text-xs text-[#1E242B] leading-relaxed">
                    {peerContext.linhchi.cheatSheetBullets.map((b, i) => (
                      <li key={i} className="p-2 rounded-lg bg-white border border-[#FCE7F3]">
                        {cleanText(b)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activePeer === 'minhkhang' && peerContext?.minhkhang && (
                <div className="p-3.5 rounded-xl bg-[#F2FCFE] border border-[#C5EEF6] space-y-2">
                  <div className="font-bold text-sm text-[#155E75]">
                    {cleanText(peerContext.minhkhang.analogyTitle)}
                  </div>
                  <p className="text-xs text-[#1E242B] leading-relaxed whitespace-pre-line">
                    {cleanText(peerContext.minhkhang.analogyContent)}
                  </p>
                </div>
              )}

              {activePeer === 'tri' && peerContext?.tri && (
                <div className="p-3.5 rounded-xl bg-[#F5F8FF] border border-[#D8E2FF] space-y-2">
                  <div className="font-bold text-sm text-[#1E40AF]">
                    Góc phân tích điều kiện biên của Trí
                  </div>
                  <p className="text-xs text-[#1E242B] leading-relaxed">
                    {cleanText(peerContext.tri.edgeCaseNote)}
                  </p>
                </div>
              )}

              {activePeer === 'bo' && peerContext?.bo && (
                <div className="p-3.5 rounded-xl bg-[#FFFBF2] border border-[#F3DFA8] space-y-2">
                  <div className="font-bold text-sm text-[#92400E]">
                    Lập luận đi tắt của Bo
                  </div>
                  <p className="text-xs text-[#1E242B] leading-relaxed">
                    {cleanText(peerContext.bo.hotTake)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Đáy Drawer: Hỏi nhanh + Nhập câu hỏi */}
          <div className="p-3 bg-[#FAF8F5] space-y-2 shrink-0">
            <div className="flex flex-col gap-1">
              {(peerContext?.[activePeer]?.quickPrompts || [
                'Công thức trọng tâm của bài này là gì?',
                'Chỗ nào trong bài này dễ bị sập bẫy nhất?',
              ]).map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendPeerMessage(activePeer, cleanText(q))}
                  className="quick-prompt-box w-full text-left bg-white hover:bg-[#EBF7F3] border border-[#E2D9C8] rounded-lg text-[#1E242B] cursor-pointer transition-colors truncate"
                >
                  “{cleanText(q)}”
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={peerChatInput}
                onChange={(e) => setPeerChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPeerMessage(activePeer)}
                placeholder={`Nhắn riêng cho ${peerMeta[activePeer].name}...`}
                className="flex-1 bg-white border border-[#D8CEBC] rounded-xl px-3 py-2 text-xs text-[#1E242B] outline-none focus:border-[#0e7490] focus:ring-1 focus:ring-[#0e7490]"
              />
              <button
                type="button"
                onClick={() => handleSendPeerMessage(activePeer)}
                className="px-3.5 py-2 bg-[#0e7490] hover:bg-[#0891b2] text-white font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-colors shadow-xs"
              >
                <span>Gửi</span>
                <SendArrowSvg className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
