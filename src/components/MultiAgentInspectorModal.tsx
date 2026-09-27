import React, { useState } from 'react';
import { 
  SparkleIcon, 
  PushPin, 
  WashiTape, 
  BoAvatar, 
  TutorLamAvatar, 
  BrainIcon, 
  LightningZapIcon, 
  CheckCircleIcon 
} from './HandmadeArtwork';

interface MultiAgentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendLive: boolean;
  lastSessionId: string | null;
  lastBoSpeech: string | null;
  lastCoLamSpeech: string | null;
  currentMode: string;
}

export const MultiAgentInspectorModal: React.FC<MultiAgentInspectorModalProps> = ({
  isOpen,
  onClose,
  isBackendLive,
  lastSessionId,
  lastBoSpeech,
  lastCoLamSpeech,
  currentMode,
}) => {
  const [pingStatus, setPingStatus] = useState<{
    loading: boolean;
    latencyMs?: number;
    model?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    setPingStatus({ loading: true });
    try {
      const res = await fetch('http://localhost:3001/api/health-llm');
      const data = await res.json();
      if (data.ok) {
        setPingStatus({
          loading: false,
          latencyMs: data.latencyMs,
          model: data.model,
        });
      } else {
        setPingStatus({
          loading: false,
          error: data.error || 'Lỗi kiểm tra',
        });
      }
    } catch (e: any) {
      setPingStatus({
        loading: false,
        error: e.message || 'Không kết nối được server cổng 3001',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FAF6EE] border-4 border-[#DDD6C8] rounded-md p-6 sketchbook-shadow max-h-[90vh] overflow-y-auto">
        <WashiTape variant="blue" className="absolute -top-3 left-10 w-28 -rotate-2" />
        <PushPin color="#4E9B87" className="absolute top-3 right-4" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8DFD0]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#242F2B] text-white flex items-center justify-center text-sm font-mono">
              <BrainIcon className="w-5 h-5 text-[#8CE6CF]" />
            </span>
            <div>
              <h2 className="font-handwriting font-bold text-xl text-[#2F2923]">
                Bảng Soi Luồng Multi-Agent AI (Live Inspector)
              </h2>
              <p className="text-xs text-[#8A7D6F] font-mono">
                Kiểm chứng hoạt động thực tế của 3 LLM Agents chạy trên backend (Port 3001)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white hover:bg-[#F0EBE0] border border-[#D5CCBC] flex items-center justify-center text-[#7A6D5E] font-bold cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="p-3.5 bg-[#242F2B] text-white rounded-xs border border-white/10 mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${isBackendLive ? 'bg-[#6B9E5C] animate-pulse' : 'bg-[#E8A33D]'}`} />
            <div>
              <div className="text-xs font-mono font-bold text-[#8CE6CF]">
                {isBackendLive ? 'OpenAI GPT-4o Multi-Agent: HOẠT ĐỘNG THẬT 100%' : 'Chế độ Fallback offline'}
              </div>
              <div className="text-[11px] font-mono text-[#D2E3DC]">
                Backend: http://localhost:3001 · Key đã được tải vào tiến trình
              </div>
            </div>
          </div>

          <button
            onClick={handleTestPing}
            disabled={pingStatus?.loading}
            type="button"
            className="px-3 py-1.5 bg-[#4E9B87] hover:bg-[#3C8271] disabled:opacity-50 text-white font-mono text-xs rounded-xs font-bold cursor-pointer transition-colors"
          >
            {pingStatus?.loading ? (
              'Đang ping OpenAI...'
            ) : (
              <span className="flex items-center gap-1.5">
                <LightningZapIcon className="w-3.5 h-3.5 text-white" />
                <span>Bấm Ping Test OpenAI</span>
              </span>
            )}
          </button>
        </div>

        {/* Ping result notification */}
        {pingStatus && !pingStatus.loading && (
          <div className={`p-2.5 rounded-xs border text-xs font-mono mb-4 flex items-center justify-between ${
            pingStatus.error ? 'bg-[#FFF0F0] border-[#E5A8A8] text-[#9E2A2A]' : 'bg-[#EEF8F5] border-[#A7DDD0] text-[#1D5E4E]'
          }`}>
            {pingStatus.error ? (
              <span>Lỗi ping: {pingStatus.error}</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-[#2E6859]" />
                <span>OpenAI phản hồi thành công! Model: <strong>{pingStatus.model}</strong> · Độ trễ: <strong>{pingStatus.latencyMs}ms</strong></span>
              </span>
            )}
          </div>
        )}

        {/* 3 AI Agents Architecture Grid */}
        <div className="space-y-3 mb-5">
          <div className="text-xs font-handwriting font-bold text-[#6B5E51] uppercase tracking-wider">
            3 Agent AI cùng phối hợp trong mỗi lượt học:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Agent 1: Assessor */}
            <div className="p-3 bg-white border border-[#DFD7C9] rounded-xs space-y-1">
              <div className="font-mono font-bold text-[#2E6859] flex items-center justify-between">
                <span>1. Assessor Agent</span>
                <span className="text-[10px] bg-[#EEF8F5] text-[#1F453B] px-1 py-0.5 rounded-xs">gpt-4o-mini</span>
              </div>
              <p className="text-[#6E6152] font-handwriting text-xs">
                Chấm ngữ nghĩa câu trả lời (đúng/sai) không dựa theo từ khóa cố định, tự động phân loại bẫy tư duy (shortcut fallacy / edge case).
              </p>
            </div>

            {/* Agent 2: Bo */}
            <div className="p-3 bg-white border border-[#DFD7C9] rounded-xs space-y-1">
              <div className="font-mono font-bold text-[#8C5D19] flex items-center justify-between">
                <span>2. Bo Agent</span>
                <span className="text-[10px] bg-[#FFF8EB] text-[#8C5D19] px-1 py-0.5 rounded-xs">gpt-4o-mini</span>
              </div>
              <p className="text-[#6E6152] font-handwriting text-xs">
                Đóng vai bạn học AI, tự động sinh lời thách thức và phản biện cá tính dựa trên chính xác câu trả lời của em.
              </p>
            </div>

            {/* Agent 3: Cô Lam */}
            <div className="p-3 bg-white border border-[#DFD7C9] rounded-xs space-y-1">
              <div className="font-mono font-bold text-[#4B2F89] flex items-center justify-between">
                <span>3. Cô Lam Agent</span>
                <span className="text-[10px] bg-[#F2EDFF] text-[#4B2F89] px-1 py-0.5 rounded-xs">gpt-4o</span>
              </div>
              <p className="text-[#6E6152] font-handwriting text-xs">
                Giáo viên Socratic can thiệp theo nấc gợi ý và chốt bản chất toán học sâu sắc khi cuộc tranh biện kết thúc.
              </p>
            </div>
          </div>
        </div>

        {/* Live Interaction Log */}
        <div className="p-3.5 bg-white border border-[#D8CEBC] rounded-xs space-y-2.5">
          <div className="text-xs font-handwriting font-bold text-[#4E4135] flex items-center justify-between">
            <span>Dữ liệu phản hồi mới nhất từ LLM:</span>
            {lastSessionId && (
              <span className="font-mono text-[10px] text-[#8A7D6F]">Session: {lastSessionId.slice(0, 8)}...</span>
            )}
          </div>

          {lastBoSpeech ? (
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#FFF9EC] border border-[#F0D5A3] rounded-xs">
                <div className="font-mono font-bold text-[#8C5D19] text-[11px] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <LightningZapIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
                    <span>Bo vừa sinh qua GPT-4o-mini:</span>
                  </span>
                  <span className="text-[10px] text-[#4E9B87] font-bold">● Sinh động lực</span>
                </div>
                <p className="font-handwriting text-sm text-[#3E342B] italic">&ldquo;{lastBoSpeech}&rdquo;</p>
              </div>

              {lastCoLamSpeech && (
                <div className="p-2.5 bg-[#EEF8F5] border border-[#D5EFE7] rounded-xs">
                  <div className="font-mono font-bold text-[#234F42] text-[11px] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TutorLamAvatar size="sm" className="scale-60 -translate-x-1" />
                      <span>Cô Lam vừa chốt qua GPT-4o:</span>
                    </span>
                    <span className="text-[10px] text-[#4E9B87] font-bold">● Chốt kiến thức</span>
                  </div>
                  <p className="font-handwriting text-sm text-[#234F42]">&ldquo;{lastCoLamSpeech}&rdquo;</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-xs font-handwriting text-[#8A7D6F]">
              Chưa có lượt tương tác nào trong phiên này. Hãy gõ một câu giải thích ở Chế độ 1 hoặc trả lời câu hỏi ở Chế độ 2 để xem AI sinh câu trả lời trực tiếp!
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#E8DFD0] flex items-center justify-between text-xs font-handwriting text-[#8A7D6F]">
          <span>Gợi ý: Mọi câu chữ bạn gõ vào đều được LLM đọc và phân tích trực tiếp.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2E2825] text-white font-mono text-xs rounded-xs font-bold hover:bg-[#443B37] cursor-pointer"
          >
            Đóng bảng soi
          </button>
        </div>
      </div>
    </div>
  );
};
