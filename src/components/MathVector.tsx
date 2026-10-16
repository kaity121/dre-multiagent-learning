// File: src/components/MathVector.tsx
import React from 'react';

/**
 * Component hiển thị ký hiệu Vectơ với dấu mũi tên chuẩn xác trên đầu (LaTeX \vec{...})
 * Hoạt động mượt mà trên mọi trình duyệt, không bị lệch font hay trôi dấu.
 */
export const Vec: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <span className={`inline-flex flex-col items-center mx-0.5 align-baseline font-semibold ${className}`}>
      {/* Mũi tên vectơ thu nhỏ co giãn theo chiều dài chữ */}
      <span className="text-[10px] leading-none select-none text-current opacity-85 font-sans" style={{ marginBottom: '-3px' }}>
        →
      </span>
      <span className="font-mono tracking-tight">{children}</span>
    </span>
  );
};

/**
 * 1. HÌNH VẼ TRỰC QUAN TRẠM 2: LĂNG TRỤ TAM GIÁC ABC.A'B'C'
 * Minh họa phân tích vectơ B'C theo a = AA', b = AB, c = AC
 */
export const PrismVectorDiagram: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs select-none ${className}`}>
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0e7490]" />
          <span>Hình học không gian: Lăng trụ ABC.A'B'C'</span>
        </span>
        <span className="text-[10px] font-mono text-[#0e7490] bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100 font-semibold">
          Minh họa Ví dụ 10
        </span>
      </div>

      <div className="relative w-full aspect-[16/10] max-h-[180px] flex items-center justify-center my-1">
        <svg viewBox="0 0 340 220" className="w-full h-full max-w-[320px] drop-shadow-xs">
          <defs>
            {/* Markers cho đầu mũi tên */}
            <marker id="arrow-teal" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0e7490" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706" />
            </marker>
            <marker id="arrow-rose" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#e11d48" />
            </marker>
          </defs>

          {/* Đáy trên A'B'C' */}
          <polygon points="70,50 200,30 250,75" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          
          {/* Đáy dưới ABC */}
          <polygon points="70,170 200,150 250,195" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Cạnh bên */}
          <line x1="200" y1="30" x2="200" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="250" y1="75" x2="250" y2="195" stroke="#94a3b8" strokeWidth="1.5" />

          {/* VECTƠ CƠ SỞ: a = AA' (từ A lên A') */}
          <line x1="70" y1="170" x2="70" y2="52" stroke="#0e7490" strokeWidth="2.2" markerEnd="url(#arrow-teal)" />
          <text x="50" y="115" fill="#0e7490" fontSize="12" fontWeight="bold" fontFamily="monospace">a = AA'</text>

          {/* VECTƠ CƠ SỞ: b = AB (từ A sang B) */}
          <line x1="70" y1="170" x2="195" y2="150" stroke="#0e7490" strokeWidth="2" strokeDasharray="3 2" markerEnd="url(#arrow-teal)" />
          <text x="135" y="172" fill="#0e7490" fontSize="12" fontWeight="bold" fontFamily="monospace">b = AB</text>

          {/* VECTƠ CƠ SỞ: c = AC (từ A xuống C) */}
          <line x1="70" y1="170" x2="245" y2="195" stroke="#0e7490" strokeWidth="2" markerEnd="url(#arrow-teal)" />
          <text x="145" y="200" fill="#0e7490" fontSize="12" fontWeight="bold" fontFamily="monospace">c = AC</text>

          {/* VECTƠ MỤC TIÊU CẦN TÍNH: B'C (từ B' sang C) NỔI BẬT */}
          <line x1="200" y1="30" x2="250" y2="192" stroke="#e11d48" strokeWidth="2.8" markerEnd="url(#arrow-rose)" />
          <rect x="230" y="105" width="46" height="20" rx="4" fill="#fff1f2" stroke="#fda4af" strokeWidth="1" />
          <text x="234" y="119" fill="#e11d48" fontSize="11" fontWeight="bold" fontFamily="monospace">B'C ?</text>

          {/* Tên các đỉnh */}
          <circle cx="70" cy="50" r="3.5" fill="#334155" />
          <text x="56" y="45" fill="#1e293b" fontSize="12" fontWeight="bold">A'</text>

          <circle cx="200" cy="30" r="4.5" fill="#e11d48" />
          <text x="202" y="24" fill="#e11d48" fontSize="13" fontWeight="extrabold">B'</text>

          <circle cx="250" cy="75" r="3.5" fill="#334155" />
          <text x="256" y="78" fill="#1e293b" fontSize="12" fontWeight="bold">C'</text>

          <circle cx="70" cy="170" r="4.5" fill="#0e7490" />
          <text x="54" y="184" fill="#0e7490" fontSize="13" fontWeight="extrabold">A</text>

          <circle cx="200" cy="150" r="3.5" fill="#334155" />
          <text x="204" y="162" fill="#1e293b" fontSize="12" fontWeight="bold">B</text>

          <circle cx="250" cy="195" r="4.5" fill="#e11d48" />
          <text x="256" y="202" fill="#e11d48" fontSize="13" fontWeight="extrabold">C</text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/80 mt-1">
        <span>Gốc chung chèn điểm: <strong className="text-[#0e7490]">A</strong></span>
        <span className="font-semibold text-rose-700">Quy tắc hiệu: <Vec>B'C</Vec> = <Vec>AC</Vec> − <Vec>AB'</Vec></span>
      </div>
    </div>
  );
};

/**
 * 2. HÌNH VẼ TRỰC QUAN TRẠM 3: TRỤC ĐOẠN THẲNG A - I - G
 * Phân biệt rành mạch giữa Độ dài IA = 3·IG và Vectơ IA = −3·IG
 */
export const SegmentVectorDiagram: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs select-none space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span>Trực quan hóa đoạn thẳng: Điểm I nằm giữa A và G</span>
        </span>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Tỉ lệ: IA = 3·IG (Tổng 4 phần)
        </span>
      </div>

      <div className="relative w-full aspect-[20/7] max-h-[140px] flex items-center justify-center bg-[#FAF8F5] rounded-xl p-2 border border-[#EAE3D5]">
        <svg viewBox="0 0 400 130" className="w-full h-full max-w-[380px]">
          <defs>
            <marker id="arrow-left-ia" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="#2563eb" />
            </marker>
            <marker id="arrow-right-ig" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706" />
            </marker>
          </defs>

          {/* 1. Trục đoạn thẳng chính từ A (40) đến G (360) */}
          <line x1="40" y1="65" x2="360" y2="65" stroke="#64748b" strokeWidth="2.5" />

          {/* Các vạch chia 4 phần đều nhau (khoảng cách 80px) */}
          {/* A = 40, vạch 1 = 120, vạch 2 = 200, I = 280, G = 360 */}
          {[40, 120, 200, 280, 360].map((x, idx) => (
            <line key={idx} x1={x} y1="58" x2={x} y2="72" stroke="#94a3b8" strokeWidth="2" />
          ))}

          {/* Nhãn độ dài phía trên */}
          {/* Cung độ dài IA = 3 phần */}
          <path d="M 40 46 C 40 32, 280 32, 280 46" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 2" />
          <rect x="135" y="18" width="85" height="18" rx="4" fill="#eff6ff" stroke="#bfdbfe" />
          <text x="142" y="31" fill="#1e40af" fontSize="11" fontWeight="bold">Độ dài IA = 3 phần</text>

          {/* Cung độ dài IG = 1 phần */}
          <path d="M 280 46 C 280 32, 360 32, 360 46" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 2" />
          <rect x="296" y="18" width="56" height="18" rx="4" fill="#fffbeb" stroke="#fde68a" />
          <text x="300" y="31" fill="#b45309" fontSize="11" fontWeight="bold">IG = 1 phần</text>

          {/* 2. Điểm A, I, G */}
          {/* Điểm A */}
          <circle cx="40" cy="65" r="5" fill="#1e293b" />
          <text x="35" y="85" fill="#0f172a" fontSize="13" fontWeight="extrabold">A</text>

          {/* Điểm I (Nằm giữa) */}
          <circle cx="280" cy="65" r="6" fill="#059669" />
          <text x="277" y="86" fill="#065f46" fontSize="14" fontWeight="extrabold">I</text>

          {/* Điểm G */}
          <circle cx="360" cy="65" r="5" fill="#1e293b" />
          <text x="355" y="85" fill="#0f172a" fontSize="13" fontWeight="extrabold">G</text>

          {/* 3. MŨI TÊN VECTƠ PHÍA DƯỚI: VECTƠ IA (SANG TRÁI) */}
          <line x1="270" y1="102" x2="48" y2="102" stroke="#2563eb" strokeWidth="2.4" markerEnd="url(#arrow-left-ia)" />
          <rect x="110" y="93" width="98" height="18" rx="4" fill="#2563eb" />
          <text x="115" y="106" fill="#ffffff" fontSize="10.5" fontWeight="bold" fontFamily="monospace">← Vectơ IA (Hướng trái)</text>

          {/* MŨI TÊN VECTƠ PHÍA DƯỚI: VECTƠ IG (SANG PHẢI) */}
          <line x1="290" y1="102" x2="352" y2="102" stroke="#d97706" strokeWidth="2.4" markerEnd="url(#arrow-right-ig)" />
          <rect x="296" y="93" width="60" height="18" rx="4" fill="#d97706" />
          <text x="300" y="106" fill="#ffffff" fontSize="10.5" fontWeight="bold" fontFamily="monospace">Vectơ IG →</text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
        <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 leading-tight">
          <span className="font-bold block text-[11px] text-blue-800">1. Về độ dài (Khoảng cách):</span>
          <span>IA gấp 3 lần IG: <strong className="font-mono">IA = 3·IG</strong></span>
        </div>
        <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900 leading-tight">
          <span className="font-bold block text-[11px] text-emerald-800">2. Về hướng (Chiều mũi tên):</span>
          <span>Hai vectơ <strong>ngược hướng</strong>: <strong className="font-mono"><Vec>IA</Vec> = −3·<Vec>IG</Vec></strong></span>
        </div>
      </div>
    </div>
  );
};

/**
 * 3. HÌNH VẼ TRỰC QUAN TRẠM 4: QUY TẮC HÌNH HỘP
 * Minh họa AB + AD + AA' = AC' (Đường chéo chính của hình hộp)
 */
export const BoxVectorDiagram: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs select-none space-y-1.5">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1B4338]" />
          <span>Hình học không gian: Quy tắc hình hộp chữ nhật</span>
        </span>
        <span className="text-[10px] font-semibold text-[#1B4338] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <Vec>AB</Vec> + <Vec>AD</Vec> + <Vec>AA'</Vec> = <Vec>AC'</Vec>
        </span>
      </div>

      <div className="relative w-full aspect-[16/9] max-h-[150px] flex items-center justify-center">
        <svg viewBox="0 0 320 180" className="w-full h-full max-w-[280px]">
          <defs>
            <marker id="box-arrow-teal" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0e7490" />
            </marker>
            <marker id="box-arrow-gold" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706" />
            </marker>
          </defs>

          {/* Các mặt sau (nét đứt) */}
          <line x1="50" y1="130" x2="130" y2="130" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="50" y1="130" x2="50" y2="50" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="50" y1="130" x2="90" y2="160" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />

          {/* 3 Vectơ thành phần chung gốc A: */}
          {/* AB (ngang) */}
          <line x1="50" y1="130" x2="165" y2="130" stroke="#0e7490" strokeWidth="2" markerEnd="url(#box-arrow-teal)" />
          <text x="110" y="124" fill="#0e7490" fontSize="10.5" fontWeight="bold">AB</text>

          {/* AD (chéo trước) */}
          <line x1="50" y1="130" x2="96" y2="158" stroke="#0e7490" strokeWidth="2" markerEnd="url(#box-arrow-teal)" />
          <text x="80" y="156" fill="#0e7490" fontSize="10.5" fontWeight="bold">AD</text>

          {/* AA' (thẳng đứng) */}
          <line x1="50" y1="130" x2="50" y2="54" stroke="#0e7490" strokeWidth="2" markerEnd="url(#box-arrow-teal)" />
          <text x="32" y="90" fill="#0e7490" fontSize="10.5" fontWeight="bold">AA'</text>

          {/* Các cạnh khung hộp */}
          <polygon points="100,160 220,160 220,80 100,80" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
          <polygon points="50,50 170,50 220,80 100,80" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="170" y1="50" x2="170" y2="130" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="170" y1="130" x2="220" y2="160" stroke="#94a3b8" strokeWidth="1.2" />

          {/* ĐƯỜNG CHÉO CHÍNH AC' (Từ A(50,130) lên C'(220,80)) */}
          <line x1="50" y1="130" x2="214" y2="82" stroke="#d97706" strokeWidth="2.8" markerEnd="url(#box-arrow-gold)" />
          <rect x="120" y="85" width="48" height="18" rx="4" fill="#fffbeb" stroke="#fcd34d" />
          <text x="125" y="98" fill="#b45309" fontSize="11" fontWeight="bold">AC' (Tổng)</text>

          {/* Điểm A và C' */}
          <circle cx="50" cy="130" r="4" fill="#0e7490" />
          <text x="36" y="138" fill="#0e7490" fontSize="12" fontWeight="bold">A</text>

          <circle cx="220" cy="80" r="4" fill="#d97706" />
          <text x="226" y="84" fill="#d97706" fontSize="12" fontWeight="bold">C'</text>
        </svg>
      </div>
    </div>
  );
};
