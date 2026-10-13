import React from 'react';

/**
 * Handcrafted Scrapbook & Sketchbook Art Components
 * Palette:
 * Background cream #FAF6EE, Bo Amber #E8A33D, Cô Lam Teal #4E9B87, Moss Green #6B9E5C, Sticky Yellow #F5D65D
 * 100% custom SVGs - Zero standard OS emoji dependencies!
 */

// Superr.ai Storybook Style Bo Portrait (Warm, authentic hand-drawn kid character)
export const BoAvatar: React.FC<{ 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
  expression?: 'confident' | 'skeptical' | 'embarrassed' | 'happy' | 'normal';
  showLabel?: boolean;
}> = ({ size = 'md', className = '', expression = 'confident', showLabel = true }) => {
  const config = {
    sm: {
      wrapper: 'w-16 min-w-[64px]',
      padding: 'p-1.5 pb-2',
      imageAspect: 'w-full aspect-square',
      text: 'text-[10px] mt-1',
      tape: '-top-2 left-2 w-7 h-3',
    },
    md: {
      wrapper: 'w-20 min-w-[80px]',
      padding: 'p-2 pb-2.5',
      imageAspect: 'w-full aspect-square',
      text: 'text-xs mt-1.5',
      tape: '-top-2.5 left-2.5 w-8 h-3.5',
    },
    lg: {
      wrapper: 'w-28 min-w-[112px]',
      padding: 'p-2.5 pb-3',
      imageAspect: 'w-full aspect-square',
      text: 'text-sm mt-2',
      tape: '-top-3 left-3 w-10 h-4',
    },
  }[size];

  const labelText =
    size === 'sm'
      ? (expression === 'skeptical' ? 'Bo thắc mắc' : expression === 'embarrassed' ? 'Bo hiểu' : 'Bo')
      : (expression === 'skeptical' ? 'Bo nghi vấn' : expression === 'embarrassed' ? 'Bo hiểu rồi' : 'Bo');

  return (
    <div className={`relative inline-flex flex-col items-center justify-between bg-white ${config.padding} border border-[#DDD3C4] rounded-lg shadow-sm transition-transform hover:rotate-0 -rotate-1 shrink-0 ${config.wrapper} ${className}`}>
      {/* Small warm washi tape tag at top */}
      <div className={`absolute ${config.tape} bg-[#E8A33D]/80 rounded-xs rotate-[-2deg] shadow-2xs z-10`} />

      <div className={`${config.imageAspect} bg-[#FFF9EE] rounded-md flex items-center justify-center overflow-hidden border border-[#F2E5D0] shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Warm background tint */}
          <circle cx="50" cy="50" r="46" fill="#FFF4DE" />

          {/* Superr-style character: Warm amber hoodie body */}
          <path d="M24 82 C24 68, 76 68, 76 82 L78 98 L22 98 Z" fill="#E8963D" />
          <path d="M42 74 L50 82 L58 74" fill="#D47B22" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="10" rx="3" fill="#FADBC0" />

          {/* Ears */}
          <ellipse cx="28" cy="48" rx="5" ry="7" fill="#FADBC0" />
          <ellipse cx="72" cy="48" rx="5" ry="7" fill="#FADBC0" />

          {/* Head (Hand-drawn organic oval) */}
          <ellipse cx="50" cy="48" rx="22" ry="20" fill="#FFE5CC" />

          {/* Storybook messy hair with textured fringe */}
          <path d="M26 42 C24 24, 38 18, 50 18 C62 18, 76 24, 74 42 C70 34, 62 30, 54 30 C46 30, 42 34, 34 32 C30 36, 28 38, 26 42 Z" fill="#423429" />
          <path d="M38 28 C42 22, 48 20, 52 24" stroke="#2B211A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M54 22 C60 20, 66 24, 68 28" stroke="#2B211A" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Soft rosy cheeks (Superr-style pastel blush) */}
          <ellipse cx="36" cy="54" rx="4.5" ry="3" fill="#F59E7A" opacity="0.5" />
          <ellipse cx="64" cy="54" rx="4.5" ry="3" fill="#F59E7A" opacity="0.5" />

          {/* Expression-dependent eyes & eyebrows */}
          {expression === 'skeptical' ? (
            <g>
              {/* Questioning raised eyebrows */}
              <path d="M33 38 Q38 34 43 38" stroke="#382920" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M57 41 Q62 43 67 40" stroke="#382920" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              {/* Eyes looking sideways with doubt */}
              <circle cx="39" cy="46" r="3.2" fill="#2B211A" />
              <circle cx="38" cy="45" r="1" fill="#FFFFFF" />
              <circle cx="61" cy="46" r="3.2" fill="#2B211A" />
              <circle cx="60" cy="45" r="1" fill="#FFFFFF" />

              {/* Doubtful wavy mouth */}
              <path d="M43 58 Q49 55 57 58" stroke="#382920" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </g>
          ) : expression === 'embarrassed' ? (
            <g>
              {/* Cute sweatdrop */}
              <path d="M74 34 C72 32, 70 35, 70 38 C70 41, 74 44, 76 41 C78 39, 76 35, 74 34 Z" fill="#78C6E2" />

              {/* Worry eyebrows */}
              <path d="M35 40 Q40 43 44 40" stroke="#382920" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M56 40 Q60 43 65 40" stroke="#382920" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Wide apologetic eyes */}
              <circle cx="40" cy="47" r="3.6" fill="#2B211A" />
              <circle cx="39" cy="45.5" r="1.2" fill="#FFFFFF" />
              <circle cx="60" cy="47" r="3.6" fill="#2B211A" />
              <circle cx="59" cy="45.5" r="1.2" fill="#FFFFFF" />

              {/* Sheepish smile */}
              <path d="M43 59 Q50 64 57 58" stroke="#382920" strokeWidth="2.4" strokeLinecap="round" fill="#E86A58" />
            </g>
          ) : (
            <g>
              {/* Friendly open smile & clear eyes */}
              <path d="M35 39 Q40 37 44 40" stroke="#382920" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M56 40 Q60 37 65 39" stroke="#382920" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              <circle cx="40" cy="46" r="3.4" fill="#2B211A" />
              <circle cx="39" cy="45" r="1" fill="#FFFFFF" />
              <circle cx="60" cy="46" r="3.4" fill="#2B211A" />
              <circle cx="59" cy="45" r="1" fill="#FFFFFF" />

              {/* Warm gentle smile */}
              <path d="M43 57 Q50 63 57 57" stroke="#382920" strokeWidth="2.4" strokeLinecap="round" fill="#E86A58" />
            </g>
          )}

          {/* Cute button nose */}
          <path d="M49 51 Q50 53 51 51" stroke="#B87848" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {showLabel && (
        <span className={`${config.text} text-center font-bold text-[#92400E] whitespace-nowrap leading-none select-none tracking-tight`}>
          {labelText}
        </span>
      )}
    </div>
  );
};


// Super Cute Cô Lam Polaroid Portrait (Gentle, warm, charming young teacher)
export const TutorLamAvatar: React.FC<{ 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
  showLabel?: boolean;
}> = ({ size = 'md', className = '', showLabel = true }) => {
  const config = {
    sm: {
      wrapper: 'w-16 min-w-[64px]',
      padding: 'p-1.5 pb-2',
      imageAspect: 'w-full aspect-square',
      text: 'text-[10px] mt-1',
      tape: '-top-2 right-1 w-7 h-3',
    },
    md: {
      wrapper: 'w-20 min-w-[80px]',
      padding: 'p-2 pb-2.5',
      imageAspect: 'w-full aspect-square',
      text: 'text-xs mt-1.5',
      tape: '-top-2.5 right-1.5 w-8 h-3.5',
    },
    lg: {
      wrapper: 'w-28 min-w-[112px]',
      padding: 'p-2.5 pb-3',
      imageAspect: 'w-full aspect-square',
      text: 'text-sm mt-2',
      tape: '-top-3 right-2 w-10 h-4',
    },
  }[size];

  return (
    <div className={`relative inline-flex flex-col items-center justify-between bg-white ${config.padding} border border-[#E3DDD1] rounded-lg shadow-sm transition-transform hover:rotate-0 rotate-1 shrink-0 ${config.wrapper} ${className}`}>
      {/* Pastel washi tape at top corner */}
      <div className={`absolute ${config.tape} z-10 bg-[#A9C8E0]/90 border-l border-r border-white/70 shadow-2xs rotate-3`} />

      <div className={`${config.imageAspect} bg-[#EEF8F5] rounded-md flex items-center justify-center overflow-hidden border border-[#D5EFE7] shrink-0`}>
        {/* Adorable Cute Cô Lam SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Gentle soft mint aura */}
          <circle cx="50" cy="50" r="44" fill="#E0F3ED" />

          {/* Gentle bun / neat hairstyle with hair clip */}
          <path d="M22 52 C20 28, 38 16, 50 16 C66 16, 80 28, 78 52 C74 44, 68 36, 56 36 C42 36, 32 44, 22 52 Z" fill="#2B3632" />
          {/* Cute small hair bun on top */}
          <circle cx="50" cy="14" r="8" fill="#2B3632" />
          {/* Cute leaf hair pin in teal */}
          <path d="M62 26 C68 22, 70 28, 62 28 Z" fill="#4E9B87" />

          {/* Face */}
          <path d="M28 46 C28 72, 72 72, 72 46 C72 42, 28 42, 28 46 Z" fill="#FFF0E3" />

          {/* Cute round glasses */}
          <g>
            <circle cx="39" cy="50" r="7.5" stroke="#4E9B87" strokeWidth="2.2" fill="white" fillOpacity="0.4" />
            <circle cx="61" cy="50" r="7.5" stroke="#4E9B87" strokeWidth="2.2" fill="white" fillOpacity="0.4" />
            <path d="M46.5 50 L53.5 50" stroke="#4E9B87" strokeWidth="2" />

            {/* Gentle smiling curved eyes behind glasses */}
            <path d="M35 50 Q39 46 43 50" stroke="#2B3632" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <path d="M57 50 Q61 46 65 50" stroke="#2B3632" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </g>

          {/* Soft peach blush */}
          <ellipse cx="33" cy="58" rx="4.5" ry="3" fill="#F49E9E" opacity="0.45" />
          <ellipse cx="67" cy="58" rx="4.5" ry="3" fill="#F49E9E" opacity="0.45" />

          {/* Warm comforting teacher smile */}
          <path d="M44 61 Q50 67 56 61" stroke="#2B3632" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Cute teal scarf & white collar */}
          <path d="M32 76 C38 72, 62 72, 68 76 L72 88 L28 88 Z" fill="#4E9B87" />
          <path d="M46 75 L50 82 L54 75" fill="#FFFFFF" />
        </svg>
      </div>

      {showLabel && (
        <span className={`${config.text} text-center font-bold text-[#1B4338] whitespace-nowrap leading-none select-none tracking-tight`}>
          Cô Lam
        </span>
      )}
    </div>
  );
};

// Rubber Stamp for CLOSE (moss-green #6B9E5C)
export const RubberStampSuccess: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center justify-center p-2.5 border-3 border-dashed border-[#6B9E5C] text-[#6B9E5C] rounded-md font-bold tracking-wider uppercase rotate-[-6deg] bg-[#6B9E5C]/12 select-none shadow-xs ${className}`}>
    <div className="flex items-center gap-1.5 px-1 py-0.5 border border-[#6B9E5C]">
      <svg className="w-4 h-4 text-[#6B9E5C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-xs font-mono font-bold tracking-widest">ĐÚNG RỒI</span>
      <svg className="w-3 h-3 text-[#6B9E5C]" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </div>
  </div>
);

// Gentle lightbulb icon for HINT (soft yellow #F5D65D, no red alert)
export const GentleLightbulb: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    <line x1="12" y1="2" x2="12" y2="4" stroke="#F5D65D" strokeWidth="2.5" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#F5D65D" strokeWidth="2.5" />
    <line x1="19.78" y1="4.22" x2="18.36" y2="5.64" stroke="#F5D65D" strokeWidth="2.5" />
  </svg>
);

// Half-filled circle doodle for PROBE state (amber #E8A33D, indicates "almost there", no X)
export const HalfFilledCircle: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#E8A33D" strokeWidth="2.2" strokeDasharray="2 1" />
    <path d="M12 3 A9 9 0 0 0 12 21 Z" fill="#E8A33D" opacity="0.6" />
  </svg>
);

// Decorative push-pin
export const PushPin: React.FC<{ color?: string; className?: string }> = ({ color = '#4E9B87', className = '' }) => (
  <div className={`w-5 h-5 relative ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
      <circle cx="12" cy="8" r="6" fill={color} />
      <path d="M12 14 L12 22" stroke="#5E6875" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="6" r="2" fill="white" opacity="0.4" />
    </svg>
  </div>
);

// Washi Tape Strip
export const WashiTape: React.FC<{ variant?: 'blue' | 'pink' | 'yellow' | 'green'; className?: string }> = ({ 
  variant = 'blue', 
  className = '' 
}) => {
  const bg = variant === 'blue' 
    ? 'washi-tape-blue' 
    : variant === 'pink' 
    ? 'washi-tape-pink' 
    : variant === 'green'
    ? 'washi-tape-green'
    : 'washi-tape-yellow';
  return (
    <div className={`h-4.5 rounded-[1px] opacity-90 ${bg} ${className}`} />
  );
};

// -------------------------------------------------------------
// CUSTOM HANDMADE ICONS (Replacing OS system emojis!)
// -------------------------------------------------------------

// Hand-drawn Pencil / Crayon icon
export const PencilIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="#F5D65D" fillOpacity="0.3" />
    <path d="m15 5 4 4" />
    <path d="m4 20 2-2" />
  </svg>
);

// Hand-drawn Coffee Mug (For "Tạm dừng, quay lại sau")
export const CoffeeMugIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" fill="#FAF6EE" />
    <line x1="6" y1="1" x2="6" y2="4" strokeDasharray="1 1" />
    <line x1="10" y1="1" x2="10" y2="4" strokeDasharray="1 1" />
    <line x1="14" y1="1" x2="14" y2="4" strokeDasharray="1 1" />
  </svg>
);

// Hand-drawn Sparkle Star Icon
export const SparkleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
  </svg>
);

// Hand-drawn Magnifying Glass Icon
export const MagnifyIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" fill="#FFF8EB" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="3" />
    <path d="M8 10a3 3 0 0 1 3-3" stroke="#E8A33D" strokeWidth="1.8" />
  </svg>
);

// Hand-drawn Open Book Icon
export const OpenBookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="#FFFBEA" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="#FFFBEA" />
  </svg>
);

// Hand-drawn Clapperboard / Scenario Reel Icon
export const ClapperboardIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#FAF6EE" />
    <path d="M2 8h20" />
    <path d="m6 4 3 4" />
    <path d="m11 4 3 4" />
    <path d="m16 4 3 4" />
  </svg>
);

// Hand-drawn Cute Pointing Finger Doodle
export const HandPointIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 11V6a2 2 0 0 0-4 0v5" />
    <path d="M14 10V4a2 2 0 0 0-4 0v7" />
    <path d="M10 10.5V2a2 2 0 0 0-4 0v11" />
    <path d="M6 8a2 2 0 0 0-4 0v6a8 8 0 0 0 8 8h3a7 7 0 0 0 7-7v-3a2 2 0 0 0-4 0" />
  </svg>
);

// Hand-drawn Bookmark Tag
export const BookmarkTagIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" fill="#F5D65D" fillOpacity="0.4" />
  </svg>
);

// Hand-drawn Check Circle (No red/no cross)
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// Hand-drawn Spiral Binder Rings (Visual indicator of notebook book spine)
export const NotebookSpineRings: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-col justify-between py-4 select-none ${className}`}>
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="relative w-8 h-4 my-1 flex items-center justify-center">
        {/* Binder hole left */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#3D352E] shadow-inner" />
        {/* Metal ring loop */}
        <div className="absolute inset-x-0 h-3 border-2 border-[#8A7E73] rounded-full bg-gradient-to-r from-[#D5CCC0] via-[#F2EDE4] to-[#786E64] shadow-xs" />
        {/* Binder hole right */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#3D352E] shadow-inner" />
      </div>
    ))}
  </div>
);

// Video Play Icon (Hand-drawn look)
export const VideoPlayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

// Video Pause Icon
export const VideoPauseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

// Chalkboard / Blackboard Icon
export const ChalkboardIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="3" width="20" height="14" rx="2" fill="#2B3632" />
    <line x1="2" y1="21" x2="22" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

// Question Stamp ("Dừng lại suy ngẫm" in vintage amber stamp)
export const QuestionStamp: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5D65D]/95 text-[#6B4B12] border-2 border-dashed border-[#D4A328] rounded-xs font-handwriting font-bold shadow-xs rotate-[-3deg] select-none ${className}`}>
    <span className="text-base font-mono">?</span>
    <span className="text-xs uppercase tracking-wider">Dừng lại suy ngẫm</span>
  </div>
);

// Swords / Debate Clash Icon
export const SwordsDebateIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="21" y2="19" />
  </svg>
);

// Hand Stop / "Khoan đã cô ơi!" Icon
export const HandStopIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 11V6a2 2 0 0 0-4 0v5" />
    <path d="M14 10V4a2 2 0 0 0-4 0v7" />
    <path d="M10 10.5V2a2 2 0 0 0-4 0v11" />
    <path d="M6 8a2 2 0 0 0-4 0v6a8 8 0 0 0 8 8h3a7 7 0 0 0 7-7v-3a2 2 0 0 0-4 0" />
  </svg>
);

// Hand-drawn Compass Icon (For Flow guide)
export const CompassIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#4E9B87" fillOpacity="0.4" />
  </svg>
);

// Hand-drawn Brain / AI Inspector Icon
export const BrainIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z" />
  </svg>
);

// Hand-drawn Lightning / Fast AI Zap Icon
export const LightningZapIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// Hand-drawn Golden Star Icon (Replacing ⭐ unicode)
export const GoldenStarIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="#F5D65D" stroke="#D4A328" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Hand-drawn Dice Icon (For POE bet)
export const DiceIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#FFF9EC" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="16" cy="8" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

// Hand-drawn Graduation / Teacher Hat Icon (For Protégé)
export const TeacherHatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="#4E9B87" fillOpacity="0.3" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

// Hand-drawn Pin Tack Icon (Replacing pin tack)
export const PinTackIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 17v5M9 3h6l-1 7h3l-5 7-5-7h3L9 3z" fill="#E8A33D" fillOpacity="0.4" />
  </svg>
);

// Hand-drawn Link Chain Icon for custom video URL attachment
export const LinkChainIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// Superr.ai Wooden Pencil Attached to Notebook Spine/Edge
export const WoodenPencil: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative flex flex-col items-center select-none pointer-events-none drop-shadow-md ${className}`} style={{ width: '18px' }}>
    {/* Pencil Tip (Graphite lead + wood cone) */}
    <svg viewBox="0 0 20 28" className="w-full">
      {/* Wood cone */}
      <polygon points="10,0 2,28 18,28" fill="#F4D3A1" stroke="#D1A76E" strokeWidth="1" />
      {/* Graphite point */}
      <polygon points="10,0 6,10 14,10" fill="#2E2B27" />
    </svg>
    {/* Pencil Body (Warm yellow/mustard hexagonal wood) */}
    <div className="w-[14px] h-48 bg-gradient-to-r from-[#D9822B] via-[#F5B041] to-[#E08A27] border-x border-[#B26414] relative flex justify-center">
      {/* Pencil facet highlight stripe */}
      <div className="w-[2px] h-full bg-white/40" />
      {/* Subtle brand imprint */}
      <span className="absolute bottom-12 text-[7px] font-mono tracking-widest text-[#783E0A] rotate-90 select-none opacity-70">
        2B · DRE
      </span>
    </div>
    {/* Metal Ferrule (Silver ferrule ring) */}
    <div className="w-[14px] h-4 bg-gradient-to-r from-[#9E9E9E] via-[#E0E0E0] to-[#757575] border-y border-[#616161] flex flex-col justify-around py-0.5">
      <div className="w-full h-[1px] bg-black/30" />
      <div className="w-full h-[1px] bg-black/30" />
    </div>
    {/* Pink Rubber Eraser */}
    <div className="w-[14px] h-5 bg-[#F28B82] rounded-b-md border border-[#D96B62]" />
  </div>
);

// Classroom Live TA Avatar (Trợ giảng An: Kính tròn thư sinh, áo xanh mint phong cách tranh vẽ Superr)
export const TaAvatar: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <div className={`rounded-full bg-[#E8F5F1] border border-[#4E9B87] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${className}`}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <circle cx="20" cy="20" r="19" fill="#EBF7F3" />
      {/* Hair */}
      <path d="M10 18 C10 8, 30 8, 30 18 C28 14, 24 13, 20 13 C16 13, 12 14, 10 18 Z" fill="#2D3B36" />
      {/* Head */}
      <circle cx="20" cy="20" r="9" fill="#FFE5D1" />
      {/* Glasses */}
      <circle cx="17" cy="19" r="3" stroke="#2E6859" strokeWidth="1.2" fill="white" fillOpacity="0.4" />
      <circle cx="23" cy="19" r="3" stroke="#2E6859" strokeWidth="1.2" fill="white" fillOpacity="0.4" />
      <line x1="20" y1="19" x2="20" y2="19" stroke="#2E6859" strokeWidth="1.2" />
      {/* Eyes & Smile */}
      <circle cx="17" cy="19" r="1" fill="#2D3B36" />
      <circle cx="23" cy="19" r="1" fill="#2D3B36" />
      <path d="M18 24 Q20 26 22 24" stroke="#2D3B36" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Mint collar */}
      <path d="M11 36 C13 29, 27 29, 29 36 Z" fill="#4E9B87" />
    </svg>
  </div>
);

// Classmate Avatar (Bạn học trong lớp: Vẽ mặt bạn học chibi Superr sinh động với tóc tém / tóc búi)
export const ClassmateAvatar: React.FC<{ name?: string; className?: string }> = ({ name = 'Bạn học', className = 'w-6 h-6' }) => {
  const isFemale = name.includes('Phương') || name.includes('Mai') || name.includes('Linh');
  return (
    <div className={`rounded-full bg-[#FFF5E6] border border-[#F2C078] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${className}`}>
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="19" fill={isFemale ? '#FFF0F5' : '#FFF9EB'} />
        {/* Hair */}
        {isFemale ? (
          <g>
            <circle cx="10" cy="14" r="3.5" fill="#4A3428" />
            <circle cx="30" cy="14" r="3.5" fill="#4A3428" />
            <path d="M11 20 C10 10, 30 10, 29 20 C26 15, 23 14, 20 14 C17 14, 14 15, 11 20 Z" fill="#4A3428" />
          </g>
        ) : (
          <path d="M11 18 C11 9, 29 9, 29 18 C26 14, 24 13, 20 13 C16 13, 14 14, 11 18 Z" fill="#382C26" />
        )}
        {/* Face */}
        <circle cx="20" cy="20" r="8.5" fill="#FFE8D6" />
        {/* Blushing cheeks */}
        <circle cx="15" cy="22" r="1.5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="25" cy="22" r="1.5" fill="#FCA5A5" opacity="0.6" />
        {/* Cute eyes & Smile */}
        <circle cx="16.5" cy="19.5" r="1.1" fill="#2E2825" />
        <circle cx="23.5" cy="19.5" r="1.1" fill="#2E2825" />
        <path d="M18 23 Q20 25 22 23" stroke="#2E2825" strokeWidth="1" strokeLinecap="round" fill="none" />
        {/* Colorful shirt */}
        <path d="M11 36 C13 29, 27 29, 29 36 Z" fill={isFemale ? '#F472B6' : '#60A5FA'} />
      </svg>
    </div>
  );
};


// Live Chat Stream Icon
export const LiveChatStreamIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="14" y2="13" />
  </svg>
);

// Sound Speaker Icon (for tactile stationery audio toggle)
export const SoundSpeakerIcon: React.FC<{ isMuted?: boolean; className?: string }> = ({ isMuted = false, className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.2" />
    {isMuted ? (
      <line x1="23" y1="9" x2="17" y2="15" strokeWidth="2.5" />
    ) : (
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
    )}
  </svg>
);

// MAIC Peer 1: Trí (Deep Thinker - Suy ngẫm sâu)
export const TriDeepThinkerAvatar: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`rounded-full bg-[#EBF0FF] border-1.5 border-[#4B6CB7] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${className}`}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <circle cx="20" cy="20" r="19" fill="#EDF2FF" />
      {/* Neat parted hair */}
      <path d="M10 18 C10 8, 30 7, 30 18 C28 12, 23 11, 20 12 C16 11, 12 12, 10 18 Z" fill="#1E2A38" />
      <circle cx="20" cy="20" r="8.5" fill="#FFE8D6" />
      {/* Focused thoughtful eyes looking slightly up */}
      <circle cx="16.5" cy="18.5" r="1.3" fill="#1E2A38" />
      <circle cx="23.5" cy="18.5" r="1.3" fill="#1E2A38" />
      <path d="M15 15.5 Q17 14.5 19 16" stroke="#1E2A38" strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M21 16 Q23 14.5 25 15.5" stroke="#1E2A38" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Small calm mouth */}
      <path d="M18.5 23.5 L21.5 23.5" stroke="#1E2A38" strokeWidth="1.2" strokeLinecap="round" />
      {/* Deep navy sweater */}
      <path d="M10 36 C12 28, 28 28, 30 36 Z" fill="#3B5998" />
    </svg>
  </div>
);

// MAIC Peer 2: Linh Chi (Note Taker - Ghi chép tóm tắt)
export const LinhChiNoteTakerAvatar: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`rounded-full bg-[#FFF0F5] border-1.5 border-[#E27396] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${className}`}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <circle cx="20" cy="20" r="19" fill="#FFF2F6" />
      {/* Cute twin bob hair */}
      <circle cx="10" cy="15" r="3.5" fill="#3D261D" />
      <circle cx="30" cy="15" r="3.5" fill="#3D261D" />
      <path d="M10 20 C10 9, 30 9, 30 20 C26 14, 23 13, 20 13 C17 13, 14 14, 10 20 Z" fill="#3D261D" />
      {/* Pink hair pin */}
      <circle cx="12" cy="12" r="1.5" fill="#E27396" />
      <circle cx="20" cy="20" r="8.5" fill="#FFEFE5" />
      {/* Rosy cheeks */}
      <circle cx="15" cy="22" r="1.8" fill="#FCA5A5" opacity="0.6" />
      <circle cx="25" cy="22" r="1.8" fill="#FCA5A5" opacity="0.6" />
      {/* Friendly bright eyes & smile */}
      <circle cx="16.5" cy="19" r="1.2" fill="#2E2825" />
      <circle cx="23.5" cy="19" r="1.2" fill="#2E2825" />
      <path d="M18 23.5 Q20 25.5 22 23.5" stroke="#2E2825" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Coral shirt */}
      <path d="M10 36 C12 28, 28 28, 30 36 Z" fill="#EA7A8E" />
    </svg>
  </div>
);

// MAIC Peer 3: Minh Khang (Inquisitive Mind - Tò mò thực tế)
export const MinhKhangInquisitiveAvatar: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`rounded-full bg-[#E0F7FA] border-1.5 border-[#0097A7] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${className}`}>
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <circle cx="20" cy="20" r="19" fill="#E6FAFC" />
      {/* Messy curly hair */}
      <path d="M10 18 C9 8, 31 8, 30 18 C28 13, 24 11, 20 12 C16 11, 12 13, 10 18 Z" fill="#423429" />
      <circle cx="14" cy="9" r="2.5" fill="#423429" />
      <circle cx="20" cy="7" r="2.5" fill="#423429" />
      <circle cx="26" cy="9" r="2.5" fill="#423429" />
      <circle cx="20" cy="20" r="8.5" fill="#FFE8D6" />
      {/* Wide curious eyes */}
      <circle cx="16.5" cy="19" r="1.5" fill="#2E2825" />
      <circle cx="16" cy="18.5" r="0.5" fill="white" />
      <circle cx="23.5" cy="19" r="1.5" fill="#2E2825" />
      <circle cx="23" cy="18.5" r="0.5" fill="white" />
      {/* Excited open smile */}
      <path d="M18 23 Q20 26 22 23" stroke="#2E2825" strokeWidth="1.2" strokeLinecap="round" fill="#E86A58" />
      {/* Teal hoodie */}
      <path d="M10 36 C12 28, 28 28, 30 36 Z" fill="#00A896" />
    </svg>
  </div>
);

// Heatmap / Misconception Flame Icon
export const HeatmapFlameIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" fill="#E8A33D" fillOpacity="0.4" />
  </svg>
);

// Flag / Report Icon for AI Ethics
export const FlagReportIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

// Coffee Cup Icon (Tạm dừng)
export const CoffeeCupIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
  </svg>
);

// Bookmark Ribbon Icon
export const BookmarkRibbonIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);





