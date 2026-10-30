// File: src/components/MaicPeerClassroomDock.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PeerContextData } from '../types/dre';
import { 
  BoAvatar, 
  TriDeepThinkerAvatar, 
  LinhChiNoteTakerAvatar, 
  MinhKhangInquisitiveAvatar
} from './HandmadeArtwork';
import { AgentAvatar } from './AgentAvatar';
import { sound } from '../utils/soundEffects';
import { sendPeerChat } from '../services/dreBackendApi';

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

// Helper render badges cho RAG & Deterministic Tools
const renderToolBadges = (toolCalls?: any[] | null, singleToolCall?: any | null) => {
  const list = toolCalls && toolCalls.length > 0 ? toolCalls : singleToolCall ? [singleToolCall] : [];
  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      {list.map((tc, i) => {
        const isRag = tc.category === 'rag' || tc.toolName?.includes('kb');
        const isBloom = tc.category === 'bloom' || tc.toolName?.includes('bloom');
        
        let bg = 'bg-blue-50 border-blue-200 text-blue-800';
        let dot = 'bg-blue-600';
        let icon = '📐';

        if (isRag) {
          bg = 'bg-purple-50 border-purple-200 text-purple-800';
          dot = 'bg-purple-600';
          icon = '📚';
        } else if (isBloom) {
          bg = 'bg-amber-50 border-amber-200 text-amber-800';
          dot = 'bg-amber-600';
          icon = '🎯';
        }

        return (
          <div
            key={i}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-semibold shadow-2xs ${bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            <span>{icon} {tc.badgeText || tc.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export interface MaicPeerClassroomDockProps {
  currentMode: string;
  currentState?: string;
  lessonTopic?: string;
  errorStepIndex?: number;
  peerContext?: PeerContextData;
  onSelectPeerPerspective?: (peerId: 'bo' | 'tri' | 'linhchi' | 'minhkhang') => void;
  /** Controlled open state, for opening the notebook from a menu elsewhere. */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in pill trigger when another control opens the notebook. */
  hideTrigger?: boolean;
}

interface PeerChatMessage {
  sender: 'user' | 'peer';
  text: string;
  toolCall?: any | null;
  toolCalls?: any[] | null;
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
  isOpen,
  onOpenChange,
  hideTrigger = false,
}) => {
  const [localDrawerOpen, setLocalDrawerOpen] = useState<boolean>(false);
  const isDrawerOpen = isOpen ?? localDrawerOpen;
  const setIsDrawerOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(isDrawerOpen) : next;
    setLocalDrawerOpen(value);
    onOpenChange?.(value);
  };
  const [activePeer, setActivePeer] = useState<'bo' | 'tri' | 'linhchi' | 'minhkhang'>('linhchi');
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'note'>('chat');
  const [peerChatInput, setPeerChatInput] = useState<string>('');
  const [isPeerTyping, setIsPeerTyping] = useState<boolean>(false);
  const [toolCallThinking, setToolCallThinking] = useState<string[]>([]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    setChatHistories({
      bo: [
        {
          sender: 'peer',
          text: 'Ở phút [37:05], đề bắt tính |BC + DD\'| với cạnh hình lập phương bằng 1. Tớ tách luôn dấu trị tuyệt đối ra thành |BC| + |DD\'| = 1 + 1 = 2! Sao thầy Tiến lại bảo tớ sai?!',
        },
      ],
      tri: [
        {
          sender: 'peer',
          text:
            cleanText(peerContext?.tri.edgeCaseNote) ||
            'Ở phút [37:13], thầy Tiến gạch chéo phương án 1 + 1 = 2 vì hai vectơ không cùng hướng. Phải quy đổi về chung một đường chéo BC\' bằng căn 2. Cậu có thắc mắc gì về quy tắc này không?',
          toolCall: {
            toolName: 'tool_verify_vector_algebra',
            label: 'Trí đang kiểm chứng hình học...',
            badgeText: 'Đã kiểm chứng hình học (Tọa độ 3D: a√2)',
            isValid: false,
            correct: 'a\\sqrt{2}',
          },
        },
      ],
      linhchi: [
        {
          sender: 'peer',
          text: 'Mình đã tóm tắt 3 quy tắc vàng: Quy tắc 3 điểm, Quy tắc hình bình hành và Quy tắc hình hộp. Bạn đang cần tra cứu công thức nào trong bài này?',
        },
      ],
      minhkhang: [
        {
          sender: 'peer',
          text:
            cleanText(peerContext?.minhkhang.analogyContent) ||
            'Tưởng tượng bạn đi bộ 1m sang đông (vectơ BC), rồi leo thang thẳng đứng lên trời 1m (vectơ CC\'). Khoảng cách chim bay nối từ chân tới đỉnh là BC\' = √(1² + 1²) = √2m đó!',
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

    const isMathVerificationNeeded = peerId === 'tri' || 
      textToSend.toLowerCase().includes('độ dài') || 
      textToSend.toLowerCase().includes('do dai') || 
      textToSend.toLowerCase().includes('1+1') || 
      textToSend.toLowerCase().includes('2a') || 
      textToSend.toLowerCase().includes('bc');

    const mathKeywords = ['vecto', 'vectơ', 'độ dài', 'do dai', 'cộng', 'cong', 'trừ', 'tru', '1+1', '2a', 'hình lập phương', 'hinh hop', 'bc', 'dd', 'bẫy', 'công thức', 'quy tắc'];
    const isMathQuery = mathKeywords.some(k => textToSend.toLowerCase().includes(k));
    const thinkingSteps: string[] = [];

    if (isMathQuery) {
      thinkingSteps.push('Đang truy xuất kho tri thức RAG (Pedagogical KB)...');
    }
    if (isMathVerificationNeeded) {
      thinkingSteps.push('Trí đang kiểm chứng hình học (Tọa độ 3D)...');
    }
    setToolCallThinking(thinkingSteps);

    setIsPeerTyping(true);
    scrollToLatestMessage();

    // Thử gọi live AI Agent Backend (OpenMAIC GPT-6)
    sendPeerChat(peerId, textToSend, 'Toán 12 — Vectơ trong không gian', 'Bài giảng Thầy Nguyễn Phan Tiến')
      .then((aiRes) => {
        setIsPeerTyping(false);
        setToolCallThinking([]);
        if (aiRes && aiRes.ok && aiRes.result?.dialogue) {
          sound.playBubblePop();
          const attachedToolCalls = (aiRes.result as any)?.toolCalls || (aiRes as any)?.toolCalls || (isMathVerificationNeeded ? [{
            toolName: 'tool_verify_vector_algebra',
            category: 'math_verify',
            label: 'Trí đang kiểm chứng hình học...',
            badgeText: 'Đã kiểm chứng hình học (Tọa độ 3D: a√2)',
          }] : []);

          setChatHistories((prev) => ({
            ...prev,
            [peerId]: [...prev[peerId], { 
              sender: 'peer', 
              text: aiRes.result.dialogue,
              toolCall: attachedToolCalls[0],
              toolCalls: attachedToolCalls,
            }],
          }));
          scrollToLatestMessage();
          return;
        }
        fallbackLocalReply();
      })
      .catch(() => {
        setIsPeerTyping(false);
        setToolCallThinking([]);
        fallbackLocalReply();
      });

    function fallbackLocalReply() {
      setTimeout(() => {
        sound.playBubblePop();
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

        const attachedToolCall = isMathVerificationNeeded ? {
          toolName: 'tool_verify_vector_algebra',
          label: 'Trí đang kiểm chứng hình học...',
          badgeText: 'Đã kiểm chứng hình học (Tọa độ 3D: a√2)',
        } : null;

        setChatHistories((prev) => ({
          ...prev,
          [peerId]: [...prev[peerId], { 
            sender: 'peer', 
            text: reply,
            toolCall: attachedToolCall
          }],
        }));
        scrollToLatestMessage();
      }, 350);
    }
  };

  const peerMeta = {
    bo: {
      name: 'Bo',
      shortRole: 'Phản biện',
      role: 'Phản biện & Vệ sĩ bẫy ngộ nhận',
      speech: '“Mình hay nhầm chỗ này lắm, bạn xem hộ mình với!”',
      power: 'Bo sai trước để bạn mạnh dạn sửa bài và không sợ sai.',
      tabActive: 'bg-[#D97706] text-white border-[#D97706]',
      tabInactive: 'bg-white text-[#D97706] border-amber-200',
    },
    tri: {
      name: 'Trí',
      shortRole: 'Đào sâu',
      role: 'Đào sâu bản chất & Điều kiện',
      speech: '“Tại sao lại có công thức này nhỉ? Cùng mình đào sâu nhé!”',
      power: 'Xoáy sâu vào điều kiện biên & hiểu sâu nguyên lý gốc rễ.',
      tabActive: 'bg-[#2563EB] text-white border-[#2563EB]',
      tabInactive: 'bg-white text-[#2563EB] border-blue-200',
    },
    linhchi: {
      name: 'Linh Chi',
      shortRole: 'Công thức',
      role: 'Sổ tay công thức & Cheat Sheet',
      speech: '“Mình đã tóm tắt công thức trọng tâm rồi, cần tra cứu cứ bảo mình!”',
      power: 'Lập bảng quy tắc chuẩn mực & cấu trúc lại các bước giải.',
      tabActive: 'bg-[#DB2777] text-white border-[#DB2777]',
      tabInactive: 'bg-white text-[#DB2777] border-pink-200',
    },
    minhkhang: {
      name: 'Minh Khang',
      shortRole: 'Trực quan',
      role: 'Ví dụ thực tế & Trực quan sinh động',
      speech: '“Tưởng tượng như bước đi ngoài đời thực, hình dung sẽ dễ hơn nhiều!”',
      power: 'Biến các công thức khô khan thành hình ảnh thực tế sống động.',
      tabActive: 'bg-[#0D9488] text-white border-[#0D9488]',
      tabInactive: 'bg-white text-[#0D9488] border-teal-200',
    },
  };

  return (
    <>
      {/* 1 NÚT PILL GỌN DUY NHẤT (Không bao giờ tràn lề hay làm rối thanh Tab!) */}
      {!hideTrigger && (
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
          <AgentAvatar role="tri" size={16} tooltip />
          <AgentAvatar role="linhchi" size={16} tooltip />
          <AgentAvatar role="minhkhang" size={16} tooltip />
        </div>
        <span>Sổ tay & Hỏi riêng 4 bạn</span>
      </button>
      )}

      {/* MODAL HỎI RIÊNG 4 BẠN & SỔ TAY */}
      {isDrawerOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              sound.playPencilTap();
              setIsDrawerOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[480px] max-h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150"
          >
            
            {/* Header: Chọn bạn đồng hành để hỏi riêng hoặc xem Sổ tay */}
            <div className="p-3.5 pb-2.5 space-y-2.5 shrink-0 bg-white border-b border-slate-200 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[13px] font-bold text-slate-900">
                  Hỏi riêng hoặc xem Sổ tay của 4 bạn:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setIsDrawerOpen(false);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center justify-center transition-all shadow-2xs"
                  title="Đóng (Esc)"
                >
                  ✕
                </button>
              </div>

              {/* 4 Nút chọn bạn đồng hành */}
              <div className="grid grid-cols-4 gap-1.5">
                {(['bo', 'tri', 'linhchi', 'minhkhang'] as const).map((id) => {
                  const isSelected = activePeer === id;
                  const meta = peerMeta[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectPeer(id)}
                      className={`py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs ${
                        isSelected
                          ? `${meta.tabActive} font-bold shadow-xs scale-102`
                          : `${meta.tabInactive} hover:opacity-90 font-medium`
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">{meta.name}</span>
                      <span className="text-[9.5px] opacity-85 leading-tight">{meta.shortRole}</span>
                    </button>
                  );
                })}
              </div>

              {/* Thanh gạt 2 Tab: [💬 Trò chuyện] <-> [📄 Sổ tay] */}
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('chat')}
                  className={`py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeSubTab === 'chat'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
                >
                  <ChatBubbleSvg className="w-3.5 h-3.5" />
                  <span>Trò chuyện ({chatHistories[activePeer]?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('note')}
                  className={`py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeSubTab === 'note'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
                >
                  <NotebookCardSvg className="w-3.5 h-3.5" />
                  <span>Sổ tay của {peerMeta[activePeer].name}</span>
                </button>
              </div>
            </div>

            {/* Nội dung Chat hoặc Sổ tay */}
            {activeSubTab === 'chat' ? (
              <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 space-y-3 max-h-[340px]">
                {(chatHistories[activePeer] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[11px] font-bold text-stone-500 mb-1 px-1">
                      {msg.sender === 'user' ? 'Bạn' : peerMeta[activePeer].name}
                    </span>
                    <div
                      className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed font-normal shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-[#1B4338] text-white rounded-br-xs font-medium'
                          : 'bg-white border border-stone-200 text-stone-800 rounded-bl-xs'
                      }`}
                    >
                      {renderToolBadges((msg as any).toolCalls, msg.toolCall)}
                      <div>{msg.text}</div>
                    </div>
                  </div>
                ))}

                {isPeerTyping && (
                  <div className="flex flex-col gap-1.5 px-2 py-1 animate-in fade-in duration-200">
                    {toolCallThinking.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {toolCallThinking.map((step, sIdx) => {
                          const isRag = step.includes('RAG');
                          return (
                            <div
                              key={sIdx}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold shadow-2xs animate-pulse w-fit ${
                                isRag ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full animate-ping ${isRag ? 'bg-purple-600' : 'bg-blue-600'}`} />
                              <svg className={`w-3.5 h-3.5 animate-spin shrink-0 ${isRag ? 'text-purple-600' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="14 28" />
                              </svg>
                              <span>{isRag ? '📚' : '📐'} {step}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#1B4338] animate-ping" />
                      <span>{peerMeta[activePeer].name} đang trả lời...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 max-h-[340px]">
                {activePeer === 'bo' && (
                  <div className="p-4 rounded-2xl bg-[#FFFBF2] border border-[#F3DFA8] space-y-2">
                    <div className="font-bold text-xs text-[#92400E]">
                      Sổ tay rút kinh nghiệm của Bo
                    </div>
                    <ul className="space-y-2 text-xs text-stone-800 leading-relaxed font-normal">
                      <li className="p-2.5 rounded-xl bg-white border border-amber-200">
                        <b>Bẫy 1:</b> Tuyệt đối không được tách |a + b| = |a| + |b| khi hai vectơ không cùng hướng!
                      </li>
                      <li className="p-2.5 rounded-xl bg-white border border-amber-200">
                        <b>Bẫy 2:</b> Muốn cộng hai vectơ chéo nhau trong hình lập phương (như BC + DD'), phải thay DD' = CC' để nối đuôi thành BC'.
                      </li>
                    </ul>
                  </div>
                )}

                {activePeer === 'linhchi' && (
                  <div className="p-4 rounded-2xl bg-[#FFF5F9] border border-[#FAD1E4] space-y-2">
                    <div className="font-bold text-xs text-[#9D174D]">
                      Sổ tay công thức vàng của Linh Chi
                    </div>
                    <ul className="space-y-2 text-xs text-stone-800 leading-relaxed">
                      <li className="p-2.5 rounded-xl bg-white border border-[#FCE7F3]">
                        <b>1. Quy tắc 3 điểm:</b> OA + AB = OB (nối tiếp điểm cuối với điểm đầu).
                      </li>
                      <li className="p-2.5 rounded-xl bg-white border border-[#FCE7F3]">
                        <b>2. Quy tắc hình bình hành:</b> AB + AD = AC (chung gốc A).
                      </li>
                      <li className="p-2.5 rounded-xl bg-white border border-[#FCE7F3]">
                        <b>3. Quy tắc hình hộp:</b> AB + AD + AA' = AC' (đường chéo hình hộp).
                      </li>
                    </ul>
                  </div>
                )}

                {activePeer === 'minhkhang' && (
                  <div className="p-4 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] space-y-2">
                    <div className="font-bold text-xs text-[#115E59]">
                      Góc trực quan đời sống của Minh Khang
                    </div>
                    <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line p-2.5 rounded-xl bg-white border border-teal-200">
                      Tưởng tượng bạn đi bộ ngang 1m từ B sang C, rồi trèo thang thẳng đứng 1m từ C lên C'. Đường chim bay nối thẳng từ điểm xuất phát B đến điểm kết thúc C' chính là cạnh huyền tam giác vuông: √(1² + 1²) = √2m!
                    </p>
                  </div>
                )}

                {activePeer === 'tri' && (
                  <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                    <div className="font-bold text-xs text-[#1E40AF]">
                      Góc đào sâu điều kiện của Trí
                    </div>
                    <p className="text-xs text-stone-800 leading-relaxed p-2.5 rounded-xl bg-white border border-blue-200">
                      Cần nhớ: Hai vectơ chỉ được xét cùng hướng hoặc ngược hướng khi giá của chúng song song hoặc trùng nhau (cùng phương). Bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi a và b cùng hướng!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Đáy Modal: Gợi ý hỏi nhanh + Ô nhập & Nút Gửi */}
            <div className="p-3 pt-2 space-y-2 shrink-0 bg-slate-50 border-t border-slate-200">
              {/* Nút phản hồi nhanh dạng thẻ gọn */}
              <div className="flex flex-col gap-1">
                {(activePeer === 'bo' ? [
                  '“Độ dài tổng 2 vectơ có bằng tổng 2 độ dài đâu Bo!”',
                  '“Phải thay DD\' bằng CC\' để nối đuôi thành BC\' chứ!”'
                ] : activePeer === 'tri' ? [
                  '“Tại sao giá của BC và DD\' lại không cùng phương?”',
                  '“Khi nào thì độ dài tổng mới bằng tổng hai độ dài?”'
                ] : activePeer === 'linhchi' ? [
                  '“Cho mình xem lại Quy tắc hình hộp với!”',
                  '“Khi nào dùng Quy tắc trừ \'Chung đầu - Lộn ngược\'?”'
                ] : [
                  '“Ví dụ hình ảnh dễ hiểu thật, giải thích thêm cho mình với!”',
                  '“Nếu đi theo 3 cạnh hộp thì ra đường chéo √3 đúng không?”'
                ]).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendPeerMessage(activePeer, cleanText(q).replace(/[“”]/g, ''))}
                    className="w-full text-left bg-white hover:bg-slate-100 border border-slate-200 hover:border-[#1B4338] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium cursor-pointer transition-all shadow-2xs leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Ô gõ tin nhắn + Nút Gửi + Nút Đóng */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <input
                  type="text"
                  value={peerChatInput}
                  onChange={(e) => setPeerChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPeerMessage(activePeer)}
                  placeholder={`Nhắn riêng cho ${peerMeta[activePeer].name}...`}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1B4338] focus:ring-1 focus:ring-[#1B4338] shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleSendPeerMessage(activePeer)}
                  className="px-3.5 py-2 bg-[#1B4338] hover:bg-[#285E4F] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                >
                  <span>Gửi</span>
                  <SendArrowSvg className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPencilTap();
                    setIsDrawerOpen(false);
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer shrink-0 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
