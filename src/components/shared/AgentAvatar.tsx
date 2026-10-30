import React from 'react';
import { AgentState } from '../../types/reasoning';
import {
  BoCircleAvatar,
  TriDeepThinkerAvatar,
  LinhChiNoteTakerAvatar,
  TutorLamCircleAvatar,
  TaAvatar,
  MinhKhangInquisitiveAvatar,
} from '../HandmadeArtwork';
import { Brain, Mic, Wrench, Clock } from 'lucide-react';

interface AgentAvatarProps {
  name: string;
  state?: AgentState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const stateConfig: Record<
  AgentState,
  { label: string; badgeBg: string; textColor: string; icon: React.ReactNode; ringClass: string }
> = {
  speaking: {
    label: 'Đang phát biểu',
    badgeBg: 'bg-[#121712] text-[#C8F169]',
    textColor: 'text-stone-900 font-bold',
    icon: <Mic className="w-3 h-3 text-[#C8F169]" />,
    ringClass: 'ring-2 ring-[#C8F169] ring-offset-2 shadow-sm scale-105',
  },
  thinking: {
    label: 'Đang suy luận',
    badgeBg: 'bg-stone-800 text-stone-100',
    textColor: 'text-stone-800 font-medium',
    icon: <Brain className="w-3 h-3 text-stone-200" />,
    ringClass: 'ring-2 ring-stone-400 ring-offset-1',
  },
  tool_calling: {
    label: 'Gọi công cụ',
    badgeBg: 'bg-stone-800 text-stone-100',
    textColor: 'text-stone-800 font-medium',
    icon: <Wrench className="w-3 h-3 text-stone-200" />,
    ringClass: 'ring-2 ring-stone-400 ring-offset-1',
  },
  idle: {
    label: 'Chờ lượt',
    badgeBg: 'bg-stone-200 text-stone-600',
    textColor: 'text-stone-500',
    icon: <Clock className="w-2.5 h-2.5 text-stone-500" />,
    ringClass: 'ring-1 ring-stone-300 opacity-80',
  },
};

// Illustrated SVG avatar for Dispatcher
const DispatcherAvatar: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`rounded-full bg-[#EEF2FF] border border-[#6366F1] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${className}`}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <circle cx="20" cy="20" r="19" fill="#F5F7FF" />
      <path d="M11 18 C11 8, 29 8, 29 18 C27 13, 23 12, 20 12 C17 12, 13 13, 11 18 Z" fill="#312E81" />
      <circle cx="20" cy="20" r="9" fill="#FFE8D6" />
      {/* Headset wire & earphone */}
      <path d="M12 20 A8 8 0 0 1 28 20" stroke="#4F46E5" strokeWidth="1.5" fill="none" />
      <circle cx="11.5" cy="20" r="2.5" fill="#4F46E5" />
      <circle cx="28.5" cy="20" r="2.5" fill="#4F46E5" />
      <path d="M28.5 20 Q28.5 24 24 25" stroke="#4F46E5" strokeWidth="1.2" fill="none" />
      <circle cx="23.5" cy="25" r="1.2" fill="#4F46E5" />
      {/* Eyes & Smile */}
      <circle cx="16.5" cy="19" r="1.2" fill="#1E1B4B" />
      <circle cx="23.5" cy="19" r="1.2" fill="#1E1B4B" />
      <path d="M18 23.5 Q20 25 22 23.5" stroke="#1E1B4B" strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M11 36 C13 29, 27 29, 29 36 Z" fill="#4F46E5" />
    </svg>
  </div>
);

// Illustrated SVG avatar for Assessor
const AssessorAvatar: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`rounded-full bg-[#FEF3C7] border border-[#D97706] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${className}`}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <circle cx="20" cy="20" r="19" fill="#FFFBEB" />
      <path d="M10 17 C10 8, 30 8, 30 17 C28 13, 24 12, 20 12 C16 12, 12 13, 10 17 Z" fill="#78350F" />
      <circle cx="20" cy="20" r="9" fill="#FFE5D1" />
      {/* Academic glasses */}
      <rect x="13.5" y="17" width="5.5" height="4.5" rx="1.5" stroke="#92400E" strokeWidth="1.2" fill="white" fillOpacity="0.5" />
      <rect x="21" y="17" width="5.5" height="4.5" rx="1.5" stroke="#92400E" strokeWidth="1.2" fill="white" fillOpacity="0.5" />
      <line x1="19" y1="19.2" x2="21" y2="19.2" stroke="#92400E" strokeWidth="1.2" />
      <circle cx="16.2" cy="19.2" r="1" fill="#78350F" />
      <circle cx="23.7" cy="19.2" r="1" fill="#78350F" />
      <path d="M18 24 Q20 25.5 22 24" stroke="#78350F" strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M11 36 C13 29, 27 29, 29 36 Z" fill="#D97706" />
    </svg>
  </div>
);

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  name,
  state = 'idle',
  size = 'md',
  showLabel = true,
}) => {
  const currentConfig = stateConfig[state] || stateConfig.idle;
  const norm = (name || '').toLowerCase();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base font-bold',
  }[size];

  const renderArtwork = () => {
    if (norm.includes('bo')) {
      return <BoCircleAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
    }
    if (norm.includes('trí') || norm.includes('tri')) {
      return <TriDeepThinkerAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
    }
    if (norm.includes('chi')) {
      return <LinhChiNoteTakerAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
    }
    if (norm.includes('an')) {
      return <TaAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
    }
    if (norm.includes('blu') || norm.includes('khang')) {
      return <MinhKhangInquisitiveAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
    }
    if (norm.includes('dispatcher') || norm.includes('điều phối')) {
      return <DispatcherAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
    }
    if (norm.includes('assessor') || norm.includes('thẩm định') || norm.includes('đánh giá')) {
      return <AssessorAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
    }
    if (norm.includes('cô lam') || norm.includes('lam')) {
      return <TutorLamCircleAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
    }
    return <DispatcherAvatar className={`${sizeClasses} shrink-0 rounded-full transition-all`} />;
  };

  return (
    <div
      className="flex flex-col items-center gap-1.5 select-none"
      title={`${name}: ${currentConfig.label}`}
    >
      <div className="relative">
        <div className={`rounded-full transition-all duration-200 ${currentConfig.ringClass}`}>
          {renderArtwork()}
        </div>
        {size !== 'sm' && (
          <span
            className={`absolute -bottom-1 -right-1 p-0.5 rounded-full flex items-center justify-center shadow-xs border border-white ${currentConfig.badgeBg}`}
            aria-label={currentConfig.label}
          >
            {currentConfig.icon}
          </span>
        )}
      </div>
      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-bold text-[#121712] leading-tight">{name}</p>
          <span className={`text-xs block mt-0.5 ${currentConfig.textColor}`}>
            {currentConfig.label}
          </span>
        </div>
      )}
    </div>
  );
};
