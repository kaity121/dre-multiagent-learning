// File: src/components/MathVector.tsx
import React, { useMemo } from 'react';
import katex from 'katex';

export type VectorRole = 'reference' | 'target' | 'correct' | 'default';

// ============================================================================
// BỘ NHỚ ĐỆM KATEX TOÀN CỤC (GLOBAL IN-MEMORY KATEX CACHE)
// Loại bỏ 100% việc re-parse và biên dịch KaTeX trùng lặp, truy xuất tức thì 0ms!
// ============================================================================
const katexCache = new Map<string, string>();

export const renderKatexCached = (tex: string, display: boolean = false): string => {
  if (!tex) return '';
  const key = `${display ? 'D:' : 'I:'}${tex}`;
  const hit = katexCache.get(key);
  if (hit !== undefined) return hit;

  try {
    const html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      output: 'html',
    });
    katexCache.set(key, html);
    return html;
  } catch {
    return tex;
  }
};

/**
 * Component render công thức toán học KaTeX chuẩn quốc tế (MathML + SVG)
 * Không bị lệch baseline, không bị xô lệch font, chuẩn xác trên mọi độ phân giải.
 */
export const MathView: React.FC<{
  tex: string;
  display?: boolean;
  className?: string;
}> = React.memo(({ tex, display = false, className = '' }) => {
  const html = useMemo(() => renderKatexCached(tex, display), [tex, display]);

  return (
    <span
      className={`math-inline ${display ? 'block my-2 text-center' : 'inline align-baseline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export interface VecProps {
  children?: React.ReactNode;
  name?: string;
  role?: VectorRole;
  className?: string;
}

/**
 * Component hiển thị ký hiệu Vectơ chuẩn xác bằng KaTeX (\overrightarrow / \vec)
 * 
 * HỆ THỐNG MÀU SẮC & TÍN HIỆU TOÁN HỌC:
 * - role="reference" (Xanh lam #0284c7): Vectơ tham chiếu / cơ sở (a, b, c, AA', AB, AC)
 * - role="target" (Đỏ thắm #dc2626): Đối tượng đang phân tích / Vectơ cần tìm (B'C, IA)
 * - role="correct" (Xanh lá #16a34a): Bước hoặc đẳng thức đã xác minh đúng
 */
export const Vec: React.FC<VecProps> = React.memo(({
  children,
  name,
  role = 'default',
  className = '',
}) => {
  const raw = String(name || children || '').trim();

  const tex = useMemo(() => {
    if (!raw) return '';
    const clean = raw.replace(/\u20d7/g, '');

    // Single lowercase letter -> \vec{a}
    if (/^[a-z]$/.test(clean)) {
      return `\\vec{${clean}}`;
    }

    // Vectors with 2+ uppercase letters and possible primes like AA', B'C, AC' -> \overrightarrow{...}
    return `\\overrightarrow{${clean}}`;
  }, [raw]);

  const html = useMemo(() => renderKatexCached(tex, false), [tex]);

  const roleClass =
    role === 'reference'
      ? 'vec-ref text-[#0284c7]'
      : role === 'target'
      ? 'vec-target text-[#dc2626]'
      : role === 'correct'
      ? 'vec-correct text-[#16a34a]'
      : '';

  return (
    <span
      className={`vec-token ${roleClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

/**
 * Component tự động phân tích và render văn bản chứa công thức KaTeX
 * Hỗ trợ các cú pháp: \(...\), $...$, \[...\], $$...$$, hoặc các lệnh \vec / \overrightarrow rải rác
 */
export const FormattedMathText: React.FC<{
  text: string;
  className?: string;
}> = React.memo(({ text, className = '' }) => {
  const tokens = useMemo(() => {
    if (!text) return [];
    const normalized = text
      .replace(/d6c2([A-Za-z0-9'′]+)/gi, '\\overrightarrow{$1}')
      .replace(/d6c2/gi, '\\vec{}');
    // Tách theo các khối phân cách KaTeX chuẩn
    const regex = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$(?:\\.|[^$\n])+\$)/g;
    const rawParts = normalized.split(regex);
    const result: Array<{ type: 'text' | 'inline' | 'display' | 'raw_latex'; content: string }> = [];

    for (const part of rawParts) {
      if (!part) continue;

      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        result.push({ type: 'display', content: part.slice(2, -2).trim() });
      } else if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        result.push({ type: 'display', content: part.slice(2, -2).trim() });
      } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
        result.push({ type: 'inline', content: part.slice(2, -2).trim() });
      } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        result.push({ type: 'inline', content: part.slice(1, -1).trim() });
      } else {
        // Kiểm tra xem có lệnh \vec / \overrightarrow rời rạc không bọc dấu không
        if (/\\(?:vec|overrightarrow)\b/.test(part)) {
          const subRegex = /((?:\\[a-zA-Z]+(?:\{[^}]*\}|\[[^\]]*\])*\s*(?:[=+\-−·*/]\s*)?)+)/g;
          const subParts = part.split(subRegex);
          for (const sub of subParts) {
            if (!sub) continue;
            if (/\\(?:vec|overrightarrow)\b/.test(sub)) {
              result.push({ type: 'raw_latex', content: sub.trim() });
            } else {
              result.push({ type: 'text', content: sub });
            }
          }
        } else {
          result.push({ type: 'text', content: part });
        }
      }
    }
    return result;
  }, [text]);

  if (!text) return null;

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        if (token.type === 'display') {
          return <MathView key={index} tex={token.content} display={true} />;
        }
        if (token.type === 'inline' || token.type === 'raw_latex') {
          return <MathView key={index} tex={token.content} display={false} />;
        }
        return <React.Fragment key={index}>{token.content}</React.Fragment>;
      })}
    </span>
  );
});

/**
 * Bảng chú giải Màu sắc Toán học trực quan, ngắn gọn (Color Legend)
 * - Lam: Vectơ cơ sở đề đã cho (a, b, c)
 * - Đỏ: Vectơ mục tiêu cần tìm (B'C)
 * - Lá: Đẳng thức đã xác minh đúng
 */
export const MathColorLegend: React.FC<{ className?: string }> = React.memo(({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] select-none text-slate-600 ${className}`}>
      <span className="flex items-center gap-1 font-medium text-[#0284c7]">
        <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
        <span>Lam: Đã cho</span>
      </span>
      <span className="text-slate-300">·</span>
      <span className="flex items-center gap-1 font-medium text-[#dc2626]">
        <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
        <span>Đỏ: Cần tìm</span>
      </span>
      <span className="text-slate-300">·</span>
      <span className="flex items-center gap-1 font-medium text-[#16a34a]">
        <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
        <span>Lá: Đã đúng</span>
      </span>
    </div>
  );
});

/**
 * 1. HÌNH VẼ TRỰC QUAN TRẠM 2: LĂNG TRỤ TAM GIÁC ABC.A'B'C'
 * Hệ thống hóa màu sắc theo chuẩn sư phạm:
 * - Xanh lam (#0284c7): 3 Vectơ cơ sở a = AA', b = AB, c = AC
 * - Đỏ thắm (#dc2626): Vectơ mục tiêu B'C cần biểu diễn
 * - Xanh lá (#16a34a): Công thức chuẩn sau khi xác minh
 */
export const PrismVectorDiagram: React.FC<{ className?: string }> = React.memo(({ className = '' }) => {
  return (
    <div className={`p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs select-none space-y-2 ${className}`}>
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
          <span>Hình học không gian: Lăng trụ tam giác ABC.A'B'C'</span>
        </span>
        <span className="text-[10px] font-semibold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
          Minh họa Ví dụ 10 (SGK Toán 12)
        </span>
      </div>

      <div className="relative w-full aspect-[16/9] max-h-[140px] flex items-center justify-center my-1 bg-[#FAF8F5]/60 rounded-xl p-1 border border-slate-100">
        <svg viewBox="0 0 340 220" className="w-full h-full max-w-[340px] drop-shadow-xs">
          <defs>
            {/* Markers đầu mũi tên đồng bộ màu */}
            <marker id="prism-arrow-ref" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
            </marker>
            <marker id="prism-arrow-target" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626" />
            </marker>
          </defs>

          {/* Đáy trên A'B'C' */}
          <polygon points="70,50 200,30 250,75" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          
          {/* Đáy dưới ABC */}
          <polygon points="70,170 200,150 250,195" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Các cạnh bên */}
          <line x1="200" y1="30" x2="200" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="250" y1="75" x2="250" y2="195" stroke="#94a3b8" strokeWidth="1.5" />

          {/* VECTƠ CƠ SỞ 1: a = AA' (XANH LAM - THAM CHIẾU) */}
          <line x1="70" y1="170" x2="70" y2="52" stroke="#0284c7" strokeWidth="2.4" markerEnd="url(#prism-arrow-ref)" />
          <rect x="14" y="103" width="56" height="18" rx="4" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="18" y="116" fill="#0284c7" fontSize="10.5" fontWeight="bold">◈ a = AA'</text>

          {/* VECTƠ CƠ SỞ 2: b = AB (XANH LAM - NÉT ĐỨT VÌ KHUẤT) */}
          <line x1="70" y1="170" x2="195" y2="150" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#prism-arrow-ref)" />
          <rect x="120" y="163" width="52" height="18" rx="4" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="124" y="176" fill="#0284c7" fontSize="10.5" fontWeight="bold">◈ b = AB</text>

          {/* VECTƠ CƠ SỞ 3: c = AC (XANH LAM) */}
          <line x1="70" y1="170" x2="245" y2="195" stroke="#0284c7" strokeWidth="2.2" markerEnd="url(#prism-arrow-ref)" />
          <rect x="150" y="196" width="52" height="18" rx="4" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="154" y="209" fill="#0284c7" fontSize="10.5" fontWeight="bold">◈ c = AC</text>

          {/* VECTƠ ĐỐI TƯỢNG PHÂN TÍCH: B'C (ĐỎ THẮM - NỔI BẬT NHẤT) */}
          <line x1="200" y1="30" x2="250" y2="192" stroke="#dc2626" strokeWidth="3" markerEnd="url(#prism-arrow-target)" />
          <rect x="232" y="102" width="62" height="20" rx="4" fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
          <text x="236" y="116" fill="#dc2626" fontSize="11" fontWeight="extrabold">★ B'C (?)</text>

          {/* Tên các đỉnh */}
          <circle cx="70" cy="50" r="3.5" fill="#334155" />
          <text x="56" y="45" fill="#1e293b" fontSize="12" fontWeight="bold">A'</text>

          <circle cx="200" cy="30" r="4.5" fill="#dc2626" />
          <text x="202" y="24" fill="#dc2626" fontSize="13" fontWeight="extrabold">B'</text>

          <circle cx="250" cy="75" r="3.5" fill="#334155" />
          <text x="256" y="78" fill="#1e293b" fontSize="12" fontWeight="bold">C'</text>

          <circle cx="70" cy="170" r="4.5" fill="#0284c7" />
          <text x="54" y="184" fill="#0284c7" fontSize="13" fontWeight="extrabold">A</text>

          <circle cx="200" cy="150" r="3.5" fill="#334155" />
          <text x="204" y="162" fill="#1e293b" fontSize="12" fontWeight="bold">B</text>

          <circle cx="250" cy="195" r="4.5" fill="#dc2626" />
          <text x="256" y="202" fill="#dc2626" fontSize="13" fontWeight="extrabold">C</text>
        </svg>
      </div>

      {/* Thông tin vectơ cơ sở & đối tượng (Gọn gàng, không lộ đáp án) */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
        <span>◈ Vectơ cơ sở: a = AA', b = AB, c = AC</span>
        <span className="font-semibold text-[#dc2626]">★ Cần phân tích: B'C theo a, b, c</span>
      </div>
    </div>
  );
});

/**
 * 2. HÌNH VẼ TRỰC QUAN TRẠM 3: TRỤC ĐOẠN THẲNG A - I - G
 * Hệ thống hóa màu sắc:
 * - Xanh lam (#0284c7): Cung độ dài IA = 3 phần (Hình học vô hướng)
 * - Đỏ thắm (#dc2626): Cảnh báo bẫy Bo (vectơ cùng hướng nhầm lẫn)
 * - Xanh lá (#16a34a): Vectơ đúng ngược hướng IA = -3*IG
 */
export const SegmentVectorDiagram: React.FC<{ 
  className?: string;
  showVectorArrows?: boolean;
}> = React.memo(({ className = '', showVectorArrows = false }) => {
  return (
    <div className={`p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs select-none space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
          <span>Trực quan hóa đoạn thẳng: Điểm I chia đoạn AG thành 4 phần</span>
        </span>
        <span className="text-[10px] font-bold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
          ◈ Tỉ lệ độ dài: IA = 3·IG
        </span>
      </div>

      <div className="relative w-full aspect-[20/7] max-h-[140px] flex items-center justify-center bg-[#FAF8F5] rounded-xl p-2 border border-[#EAE3D5]">
        <svg viewBox="0 0 400 130" className="w-full h-full max-w-[380px]">
          <defs>
            <marker id="arrow-left-ia" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="#dc2626" />
            </marker>
            <marker id="arrow-right-ig" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
            </marker>
          </defs>

          {/* 1. Trục đoạn thẳng chính từ A (40) đến G (360) */}
          <line x1="40" y1="65" x2="360" y2="65" stroke="#64748b" strokeWidth="2.5" />

          {/* Các vạch chia 4 phần đều nhau (khoảng cách 80px) */}
          {[40, 120, 200, 280, 360].map((x, idx) => (
            <line key={idx} x1={x} y1="58" x2={x} y2="72" stroke="#94a3b8" strokeWidth="2" />
          ))}

          {/* Cung độ dài IA = 3 phần (Xanh lam - độ dài tham chiếu) */}
          <path d="M 40 46 C 40 32, 280 32, 280 46" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" />
          <rect x="135" y="18" width="92" height="18" rx="4" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="140" y="31" fill="#0284c7" fontSize="10.5" fontWeight="bold">◈ Độ dài IA = 3 phần</text>

          {/* Cung độ dài IG = 1 phần (Xanh lam) */}
          <path d="M 280 46 C 280 32, 360 32, 360 46" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" />
          <rect x="296" y="18" width="58" height="18" rx="4" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="300" y="31" fill="#0284c7" fontSize="10.5" fontWeight="bold">IG = 1 phần</text>

          {/* Điểm A */}
          <circle cx="40" cy="65" r="5" fill="#1e293b" />
          <text x="35" y="85" fill="#0f172a" fontSize="13" fontWeight="extrabold">A</text>

          {/* Điểm I (Nằm giữa - đối tượng phân tích) */}
          <circle cx="280" cy="65" r="6" fill="#dc2626" />
          <text x="277" y="86" fill="#dc2626" fontSize="14" fontWeight="extrabold">I</text>

          {/* Điểm G */}
          <circle cx="360" cy="65" r="5" fill="#1e293b" />
          <text x="355" y="85" fill="#0f172a" fontSize="13" fontWeight="extrabold">G</text>

          {/* MŨI TÊN VECTƠ CHỈ HIỂN THỊ KHI HỌC SINH ĐÃ SANG BƯỚC QUAN SÁT/GIẢI THÍCH (TRÁNH LỘ ĐÁP ÁN Ở BƯỚC DỰ ĐOÁN) */}
          {showVectorArrows && (
            <>
              {/* MŨI TÊN VECTƠ IA (SANG TRÁI - ĐỎ THẮM / ĐỐI TƯỢNG PHÂN TÍCH) */}
              <line x1="270" y1="102" x2="48" y2="102" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#arrow-left-ia)" />
              <rect x="95" y="93" width="124" height="18" rx="4" fill="#dc2626" />
              <text x="100" y="106" fill="#ffffff" fontSize="10.5" fontWeight="bold">← Vectơ IA (Sang trái)</text>

              {/* MŨI TÊN VECTƠ IG (SANG PHẢI - XANH LAM / CƠ SỞ THAM CHIẾU) */}
              <line x1="290" y1="102" x2="352" y2="102" stroke="#0284c7" strokeWidth="2.5" markerEnd="url(#arrow-right-ig)" />
              <rect x="286" y="93" width="76" height="18" rx="4" fill="#0284c7" />
              <text x="290" y="106" fill="#ffffff" fontSize="10.5" fontWeight="bold">Vectơ IG →</text>
            </>
          )}
        </svg>
      </div>

      <div className={`grid ${showVectorArrows ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2 text-xs pt-0.5`}>
        <div className="p-2.5 rounded-lg bg-sky-50/80 border border-sky-200 text-sky-950 leading-relaxed">
          <span className="font-bold block text-[11px] text-[#0284c7]">◈ Tỉ lệ độ dài hình học:</span>
          <span>Đoạn thẳng IA gấp 3 lần đoạn IG: <MathView tex="IA = 3 \cdot IG" /></span>
        </div>
        {showVectorArrows && (
          <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 leading-relaxed animate-in fade-in duration-150">
            <span className="font-bold block text-[11px] text-[#16a34a]">✓ Kết luận vectơ (Ngược hướng):</span>
            <span>Hai vectơ ngược hướng nên có dấu trừ: <MathView tex="\overrightarrow{IA} = -3\overrightarrow{IG}" /></span>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * 3. HÌNH VẼ TRỰC QUAN TRẠM 4: QUY TẮC HÌNH HỘP
 * - Xanh lam (#0284c7): 3 cạnh xuất phát từ đỉnh A (AB, AD, AA')
 * - Đỏ thắm (#dc2626): Đường chéo chính AC'
 * - Xanh lá (#16a34a): Đẳng thức tổng đã xác minh đúng
 */
export const BoxVectorDiagram: React.FC<{ className?: string }> = React.memo(({ className = '' }) => {
  return (
    <div className={`p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs select-none space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
          <span>Hình học không gian: Quy tắc hình hộp</span>
        </span>
        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
          ◈ 3 vectơ cạnh chung gốc A &amp; đường chéo AC'
        </span>
      </div>

      <div className="relative w-full aspect-[16/9] max-h-[155px] flex items-center justify-center bg-[#FAF8F5]/60 rounded-xl p-1 border border-slate-100">
        <svg viewBox="0 0 320 180" className="w-full h-full max-w-[280px]">
          <defs>
            <marker id="box-arrow-ref" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
            </marker>
            <marker id="box-arrow-target" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626" />
            </marker>
          </defs>

          {/* Các mặt sau nét đứt */}
          <line x1="50" y1="130" x2="130" y2="130" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="50" y1="130" x2="50" y2="50" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="50" y1="130" x2="90" y2="160" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />

          {/* 3 Vectơ cơ sở xuất phát từ đỉnh A (XANH LAM) */}
          {/* AB */}
          <line x1="50" y1="130" x2="165" y2="130" stroke="#0284c7" strokeWidth="2.2" markerEnd="url(#box-arrow-ref)" />
          <rect x="100" y="112" width="48" height="16" rx="3" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="104" y="124" fill="#0284c7" fontSize="10" fontWeight="bold">◈ AB</text>

          {/* AD */}
          <line x1="50" y1="130" x2="96" y2="158" stroke="#0284c7" strokeWidth="2.2" markerEnd="url(#box-arrow-ref)" />
          <rect x="68" y="146" width="48" height="16" rx="3" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="72" y="158" fill="#0284c7" fontSize="10" fontWeight="bold">◈ AD</text>

          {/* AA' */}
          <line x1="50" y1="130" x2="50" y2="54" stroke="#0284c7" strokeWidth="2.2" markerEnd="url(#box-arrow-ref)" />
          <rect x="8" y="82" width="48" height="16" rx="3" fill="#f0f9ff" stroke="#bae6fd" />
          <text x="12" y="94" fill="#0284c7" fontSize="10" fontWeight="bold">◈ AA'</text>

          {/* Các cạnh khung hộp */}
          <polygon points="100,160 220,160 220,80 100,80" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
          <polygon points="50,50 170,50 220,80 100,80" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="170" y1="50" x2="170" y2="130" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="170" y1="130" x2="220" y2="160" stroke="#94a3b8" strokeWidth="1.2" />

          {/* ĐƯỜNG CHÉO CHÍNH AC' (ĐỎ THẮM - ĐỐI TƯỢNG PHÂN TÍCH) */}
          <line x1="50" y1="130" x2="214" y2="82" stroke="#dc2626" strokeWidth="2.8" markerEnd="url(#box-arrow-target)" />
          <rect x="122" y="85" width="48" height="18" rx="4" fill="#fef2f2" stroke="#fecaca" />
          <text x="126" y="98" fill="#dc2626" fontSize="10.5" fontWeight="bold">★ AC' (?)</text>

          {/* Đỉnh A và C' */}
          <circle cx="50" cy="130" r="4.5" fill="#0284c7" />
          <text x="36" y="138" fill="#0284c7" fontSize="12" fontWeight="bold">A</text>

          <circle cx="220" cy="80" r="4.5" fill="#dc2626" />
          <text x="226" y="84" fill="#dc2626" fontSize="12" fontWeight="bold">C'</text>
        </svg>
      </div>
    </div>
  );
});
