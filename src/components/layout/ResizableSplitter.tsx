import React, { useRef, useState, useCallback } from 'react';

interface ResizableSplitterProps {
  id: string;
  label: string;
  valueNow: number;
  valueMin: number;
  valueMax: number;
  onDelta: (deltaX: number) => void;
  onReset: () => void;
  onStep: (step: number) => void;
  className?: string;
}

export const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
  id,
  label,
  valueNow,
  valueMin,
  valueMax,
  onDelta,
  onReset,
  onStep,
  className = '',
}) => {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    setIsActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) >= 1) {
      onDelta(deltaX);
      startXRef.current = e.clientX;
    }
  }, [onDelta]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsActive(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const stepSize = e.shiftKey ? 32 : 16;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onStep(-stepSize);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onStep(stepSize);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onStep(-1000); // Snap to min
    } else if (e.key === 'End') {
      e.preventDefault();
      onStep(1000); // Snap to max
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onReset();
    }
  }, [onStep, onReset]);

  return (
    <div
      id={id}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(valueNow)}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${label} (Nhấp đúp để về mặc định, dùng phím mũi tên để dịch)`}
      className={`hidden lg:flex w-3 shrink-0 items-center justify-center cursor-col-resize select-none relative z-20 group outline-none focus-visible:ring-2 focus-visible:ring-[#C8F169] rounded-full transition-all ${className}`}
    >
      {/* Vùng thanh nét mảnh chuẩn Lime Soft */}
      <div
        className={`w-1 rounded-full transition-all duration-150 ${
          isActive
            ? 'h-36 bg-[#121712] ring-2 ring-[#C8F169] scale-110 shadow-sm'
            : isHovered
            ? 'h-28 bg-[#C8F169] scale-105'
            : 'h-16 bg-[#E2EAD2] group-hover:bg-[#C8F169]'
        }`}
      />
      
      {/* 2 điểm chấm gợi ý kéo thả */}
      <div
        className={`absolute flex flex-col gap-1 pointer-events-none transition-opacity duration-150 ${
          isHovered || isActive ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="w-1 h-1 rounded-full bg-[#121712]" />
        <span className="w-1 h-1 rounded-full bg-[#121712]" />
      </div>
    </div>
  );
};
