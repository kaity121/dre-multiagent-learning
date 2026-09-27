import React from 'react';

/**
 * Handcrafted Scrapbook & Sketchbook Art Components
 * Palette:
 * Background cream #FAF6EE, Bo Amber #E8A33D, Cô Lam Teal #4E9B87, Moss Green #6B9E5C, Sticky Yellow #F5D65D
 * 100% custom SVGs - Zero standard OS emoji dependencies!
 */

// Super Cute Bo Polaroid Portrait with dynamic emotional expressions
export const BoAvatar: React.FC<{ 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
  expression?: 'confident' | 'skeptical' | 'embarrassed' | 'happy';
}> = ({ size = 'md', className = '', expression = 'confident' }) => {
  const dim = size === 'sm' ? 'w-14 h-16' : size === 'lg' ? 'w-28 h-32' : 'w-20 h-24';
  return (
    <div className={`relative inline-block bg-white p-2 pb-3.5 border border-[#E3DDD1] rounded-xs polaroid-shadow transition-transform hover:rotate-0 -rotate-2 ${dim} ${className}`}>
      {/* Handcrafted silver paperclip on top-left corner */}
      <div className="absolute -top-3.5 left-1.5 z-10 w-4 h-7 text-[#737F8E]">
        <svg viewBox="0 0 24 38" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 14V6a4 4 0 0 1 8 0v18a6 6 0 0 1-12 0V11a2.5 2.5 0 0 1 5 0v15" />
        </svg>
      </div>

      <div className="w-full h-full bg-[#FFF8EB] rounded-xs flex items-center justify-center overflow-hidden border border-[#F5E2C4]">
        {/* Adorable Chibi Bo SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Soft amber glow aura */}
          <circle cx="50" cy="50" r="44" fill={expression === 'embarrassed' ? '#FFE8E0' : '#FFF2D6'} />

          {/* Tousled cute anime/chibi hair */}
          <path d="M18 48 C16 26, 32 14, 52 14 C72 14, 84 26, 82 48 C78 40, 72 34, 62 34 C54 34, 50 38, 42 32 C34 35, 28 40, 22 48 Z" fill="#2E2825" />
          <path d="M26 34 C30 20, 44 14, 52 14 C62 14, 74 20, 74 34" stroke="#443934" strokeWidth="2" fill="none" />
          
          {/* Round ears with inner pink/warm tint */}
          <circle cx="24" cy="53" r="7" fill="#F7D3B5" />
          <circle cx="24" cy="53" r="3.5" fill="#E8B49E" />
          <circle cx="76" cy="53" r="7" fill="#F7D3B5" />
          <circle cx="76" cy="53" r="3.5" fill="#E8B49E" />

          {/* Chubby cheeks face shape */}
          <path d="M27 48 C27 72, 73 72, 73 48 C73 44, 27 44, 27 48 Z" fill="#FFE5D1" />

          {/* Dynamic expressions for debate / doubt / concession */}
          {expression === 'skeptical' ? (
            /* Skeptical Bo: Raised eyebrow, smirking doubt, questioning gaze */
            <g>
              <ellipse cx="38" cy="49" rx="5.5" ry="6" fill="#2E2825" />
              <circle cx="36" cy="47" r="2" fill="#FFFFFF" />
              <circle cx="39" cy="51" r="1" fill="#FFFFFF" />

              <ellipse cx="62" cy="50" rx="4.5" ry="5.5" fill="#2E2825" />
              <circle cx="61" cy="49" r="1.8" fill="#FFFFFF" />

              {/* Left eyebrow raised high in skepticism */}
              <path d="M31 36 Q38 32 44 37" stroke="#2E2825" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              {/* Right eyebrow pressed down in scrutiny */}
              <path d="M56 44 Q62 46 68 42" stroke="#2E2825" strokeWidth="2.8" strokeLinecap="round" fill="none" />

              {/* Skeptical smirking mouth */}
              <path d="M42 62 Q48 58 56 61" stroke="#2E2825" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            </g>
          ) : expression === 'embarrassed' ? (
            /* Embarrassed / Conceding Bo: Big sweat drop, awkward sheepish smile */
            <g>
              {/* Giant cartoon sweatdrop */}
              <path d="M72 32 C70 30, 68 34, 68 37 C68 40, 72 43, 75 40 C77 38, 74 34, 72 32 Z" fill="#88C7E0" stroke="#5DA0B8" strokeWidth="1" />

              <ellipse cx="38" cy="50" rx="6" ry="6.5" fill="#2E2825" />
              <circle cx="37" cy="47" r="2.2" fill="#FFFFFF" />
              <circle cx="40" cy="52" r="1.2" fill="#FFFFFF" />

              <ellipse cx="62" cy="50" rx="6" ry="6.5" fill="#2E2825" />
              <circle cx="61" cy="47" r="2.2" fill="#FFFFFF" />
              <circle cx="64" cy="52" r="1.2" fill="#FFFFFF" />

              {/* Worried / sheepish eyebrows */}
              <path d="M33 42 Q38 45 44 41" stroke="#2E2825" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M56 41 Q62 45 67 42" stroke="#2E2825" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              {/* Sheepish sideways smile */}
              <path d="M41 62 Q49 67 56 60" stroke="#2E2825" strokeWidth="2.8" strokeLinecap="round" fill="#E26D5C" />
            </g>
          ) : expression === 'happy' ? (
            /* Happy Bo: Eyes curved into joyful crescents */
            <g>
              <path d="M33 50 Q39 44 45 50" stroke="#2E2825" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M55 50 Q61 44 67 50" stroke="#2E2825" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M32 40 Q38 37 44 41" stroke="#2E2825" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M56 41 Q62 37 68 40" stroke="#2E2825" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M41 58 Q49 70 57 58" stroke="#2E2825" strokeWidth="2.8" strokeLinecap="round" fill="#E26D5C" />
            </g>
          ) : (
            /* Confident / default energetic Bo */
            <g>
              <ellipse cx="38" cy="50" rx="5.5" ry="6.5" fill="#2E2825" />
              <circle cx="36.5" cy="48" r="2" fill="#FFFFFF" />
              <circle cx="39.5" cy="52.5" r="1" fill="#FFFFFF" />

              <ellipse cx="62" cy="50" rx="5.5" ry="6.5" fill="#2E2825" />
              <circle cx="60.5" cy="48" r="2" fill="#FFFFFF" />
              <circle cx="63.5" cy="52.5" r="1" fill="#FFFFFF" />

              <path d="M33 41 Q38 38 43 42" stroke="#2E2825" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M57 42 Q62 38 67 41" stroke="#2E2825" strokeWidth="2.4" strokeLinecap="round" fill="none" />

              <path d="M43 59 Q50 67 57 59" stroke="#2E2825" strokeWidth="2.8" strokeLinecap="round" fill="#E26D5C" />
              <path d="M46 60 Q50 63 54 60" fill="#FFFFFF" opacity="0.8" />
            </g>
          )}

          {/* Rosy warm amber cheeks */}
          <ellipse cx="32" cy="58" rx="5" ry="3.5" fill="#E8A33D" opacity="0.45" />
          <ellipse cx="68" cy="58" rx="5" ry="3.5" fill="#E8A33D" opacity="0.45" />

          {/* Hoodie / Yellow-amber scarf */}
          <path d="M30 76 C36 71, 64 71, 70 76 L74 88 L26 88 Z" fill="#E8A33D" />
          <path d="M45 74 L50 82 L55 74" fill="#C98420" />
        </svg>
      </div>
      <div className="text-[11px] text-center font-handwriting font-bold text-[#5A4E42] mt-0.5 leading-none">
        {expression === 'skeptical' ? 'Bo (Tranh luận)' : expression === 'embarrassed' ? 'Bo (À ha...)' : 'Bo'}
      </div>
    </div>
  );
};

// Super Cute Cô Lam Polaroid Portrait (Gentle, warm, charming young teacher)
export const TutorLamAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
  const dim = size === 'sm' ? 'w-14 h-16' : size === 'lg' ? 'w-28 h-32' : 'w-20 h-24';
  return (
    <div className={`relative inline-block bg-white p-2 pb-3.5 border border-[#E3DDD1] rounded-xs polaroid-shadow transition-transform hover:rotate-0 rotate-2 ${dim} ${className}`}>
      {/* Pastel washi tape at top corner */}
      <div className="absolute -top-3 right-1.5 z-10 w-9 h-4 bg-[#A9C8E0]/90 border-l border-r border-white/70 shadow-2xs rotate-6" />

      <div className="w-full h-full bg-[#EEF8F5] rounded-xs flex items-center justify-center overflow-hidden border border-[#D5EFE7]">
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
      <div className="text-[11px] text-center font-handwriting font-bold text-[#326759] mt-0.5 leading-none">
        Cô Lam
      </div>
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


