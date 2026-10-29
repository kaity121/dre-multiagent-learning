import React from 'react';
import {
  BoCircleAvatar,
  TriDeepThinkerAvatar,
  LinhChiNoteTakerAvatar,
  MinhKhangInquisitiveAvatar,
  TutorLamCircleAvatar,
  TaAvatar,
  ClassmateAvatar,
} from './HandmadeArtwork';

export type AgentRoleKey =
  | 'bo' | 'Bo'
  | 'tri' | 'Tri' | 'Trí'
  | 'linhchi' | 'lc' | 'LC' | 'Linh Chi'
  | 'minhkhang' | 'mk' | 'MK' | 'Minh Khang'
  | 'colam' | 'cl' | 'CL' | 'tutor_lam' | 'Cô Lam'
  | 'an' | 'ta' | 'ta_an' | 'Trợ giảng An'
  | 'classmate' | 'student';

export interface AgentAvatarProps {
  role: AgentRoleKey | string;
  size?: 24 | 28 | 32 | 36 | 40 | number | string;
  tooltip?: string | boolean;
  className?: string;
  onClick?: () => void;
}

const AGENT_METADATA: Record<string, { name: string; title: string }> = {
  bo: { name: 'Bo', title: 'Bo · Phản biện & Bẫy trực giác' },
  tri: { name: 'Trí', title: 'Trí · Đào sâu & Lý giải logic' },
  linhchi: { name: 'Linh Chi', title: 'Linh Chi · Ghi sổ tay & Quy tắc chuẩn' },
  minhkhang: { name: 'Minh Khang', title: 'Minh Khang · Trực quan & Liên hệ đời sống' },
  colam: { name: 'Cô Lam', title: 'Cô Lam · Giáo viên hướng dẫn & Chốt kiến thức' },
  an: { name: 'Trợ giảng An', title: 'Trợ giảng An · Hỗ trợ & Ghim trọng tâm' },
};

function normalizeRole(role: string): string {
  const r = role.toLowerCase().trim();
  if (r === 'bo' || r.includes('bo')) return 'bo';
  if (r === 'tri' || r === 'trí' || r.includes('tri') || r.includes('trí')) return 'tri';
  if (r === 'lc' || r === 'linhchi' || r === 'linh chi' || r.includes('chi')) return 'linhchi';
  if (r === 'mk' || r === 'minhkhang' || r === 'minh khang' || r.includes('khang')) return 'minhkhang';
  if (r === 'cl' || r === 'colam' || r === 'cô lam' || r === 'tutor_lam' || r.includes('lam')) return 'colam';
  if (r === 'an' || r === 'ta' || r === 'ta_an' || r.includes('trợ giảng')) return 'an';
  return 'classmate';
}

function getSizeClass(size?: number | string): string {
  if (typeof size === 'number') {
    if (size <= 24) return 'w-6 h-6';
    if (size <= 28) return 'w-7 h-7';
    if (size <= 32) return 'w-8 h-8';
    if (size <= 36) return 'w-9 h-9';
    return 'w-10 h-10';
  }
  if (typeof size === 'string' && (size.startsWith('w-') || size.includes(' '))) {
    return size;
  }
  return 'w-8 h-8';
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  role,
  size = 32,
  tooltip,
  className = '',
  onClick,
}) => {
  const normKey = normalizeRole(role);
  const sizeClass = getSizeClass(size);
  const meta = AGENT_METADATA[normKey];

  let tooltipText: string | undefined = undefined;
  if (typeof tooltip === 'string') {
    tooltipText = tooltip;
  } else if (tooltip === true && meta) {
    tooltipText = meta.title;
  }

  const combinedClass = `${sizeClass} ${className} shrink-0`.trim();

  const renderInnerAvatar = () => {
    switch (normKey) {
      case 'bo':
        return <BoCircleAvatar className="w-full h-full" />;
      case 'tri':
        return <TriDeepThinkerAvatar className="w-full h-full" />;
      case 'linhchi':
        return <LinhChiNoteTakerAvatar className="w-full h-full" />;
      case 'minhkhang':
        return <MinhKhangInquisitiveAvatar className="w-full h-full" />;
      case 'colam':
        return <TutorLamCircleAvatar className="w-full h-full" />;
      case 'an':
        return <TaAvatar className="w-full h-full" />;
      default:
        return <ClassmateAvatar name={role} className="w-full h-full" />;
    }
  };

  return (
    <div
      className={combinedClass}
      title={tooltipText}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {renderInnerAvatar()}
    </div>
  );
};
