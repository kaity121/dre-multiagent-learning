// Agent Map: one popup that shows, for a single turn, how the class of agents got to its answer.
// Four lanes (Hiểu câu hỏi → Lấy ngữ cảnh → Kiểm chứng → Trả lời) joined by connector lines,
// and a detail panel for the selected block. Modal: portal, focus trap, Escape, focus restore.
import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Database,
  EyeOff,
  MessageCircle,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import type { InspectorTurn } from '../../types/reasoning';
import { AgentAvatar } from '../AgentAvatar';
import { FormattedMathText } from '../MathVector';
import { LANES, buildAgentMapTurn, type AgentMapTurn, type LaneId, type MapBlock } from './agentMapModel';

export interface AgentMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  turns: InspectorTurn[];
  /** Turn to show first; defaults to the latest. */
  focusTurnId?: string | null;
  onSeekVideo?: (second: number) => void;
}

const LANE_ICON: Record<LaneId, React.ReactNode> = {
  understand: <CircleHelp className="h-[18px] w-[18px]" aria-hidden="true" />,
  context: <Database className="h-[18px] w-[18px]" aria-hidden="true" />,
  verify: <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />,
  answer: <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />,
};

const formatSec = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
const cleanText = (s?: string) => (s ? s.replace(/⃗/g, '') : '');

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export const AgentMapDialog: React.FC<AgentMapDialogProps> = ({ isOpen, onClose, turns, focusTurnId, onSeekVideo }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const [index, setIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Pick the focused (or latest) turn every time the dialog opens.
  useEffect(() => {
    if (!isOpen) return;
    const found = focusTurnId ? turns.findIndex((t) => t.turnId === focusTurnId) : -1;
    setIndex(found >= 0 ? found : Math.max(0, turns.length - 1));
    setSelectedBlockId(null);
  }, [isOpen, focusTurnId]); // eslint-disable-line react-hooks/exhaustive-deps

  const turn: AgentMapTurn | null = useMemo(() => {
    const t = turns[Math.min(index, turns.length - 1)];
    return t ? buildAgentMapTurn(t) : null;
  }, [turns, index]);

  const allBlocks = useMemo(() => (turn ? LANES.flatMap((l) => turn.lanes[l.id]) : []), [turn]);
  const selected = allBlocks.find((b) => b.id === selectedBlockId) ?? turn?.lanes.answer[0] ?? allBlocks[0] ?? null;

  // Modal plumbing: remember the opener, lock page scroll, focus the close button.
  useEffect(() => {
    if (!isOpen) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [isOpen]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  const go = (delta: number) => {
    setIndex((i) => Math.min(turns.length - 1, Math.max(0, i + delta)));
    setSelectedBlockId(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-stretch justify-center bg-[#121712]/45 p-0 sm:items-center sm:p-4 lg:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="flex h-full w-full max-w-[1500px] flex-col overflow-hidden bg-[#F7FAF0] shadow-[0_24px_64px_-16px_rgba(18,23,18,0.45)] sm:h-[min(92vh,900px)] sm:rounded-3xl"
      >
        {/* Header line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#E2EAD2] bg-white px-4 py-3 sm:px-6">
          <h2 id={titleId} className="flex items-center gap-2.5 text-[22px] font-bold text-[#121712]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8F169]">
              <MapGlyph />
            </span>
            Agent Map
          </h2>
          {turn && (
            <p className="order-3 min-w-0 basis-full text-[15px] text-[#121712] sm:order-none sm:basis-auto sm:flex-1 sm:text-right">
              {[
                typeof turn.number === 'number' ? <span key="n" className="font-bold tabular-nums">Lượt #{turn.number}</span> : null,
                turn.question ? <span key="q" className="text-[#3D4739]">“{truncate(turn.question, 80)}”</span> : null,
                turn.timeLabel ? <span key="t" className="tabular-nums text-[#3D4739]">tại {turn.timeLabel}</span> : null,
                typeof turn.latencyMs === 'number' ? (
                  <span key="l" className="tabular-nums font-semibold">
                    {turn.latencyMs < 1000 ? `${Math.round(turn.latencyMs)} ms` : `${(turn.latencyMs / 1000).toFixed(1)} s`}
                  </span>
                ) : null,
              ]
                .filter(Boolean)
                .map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="mx-2 text-[#8C9A80]" aria-hidden="true">·</span>}
                    {part}
                  </React.Fragment>
                ))}
            </p>
          )}
          <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index <= 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2EAD2] bg-white text-[#121712] transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-[#121712] disabled:opacity-40"
              aria-label="Lượt trước"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="min-w-[56px] text-center text-[13px] tabular-nums text-[#4A5546]" aria-live="polite">
              {turns.length > 0 ? `${Math.min(index, turns.length - 1) + 1}/${turns.length}` : '0/0'}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={index >= turns.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2EAD2] bg-white text-[#121712] transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-[#121712] disabled:opacity-40"
              aria-label="Lượt sau"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#121712] text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]"
              aria-label="Đóng Agent Map"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {!turn ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-[16px] text-[#3D4739]">
            Chưa có lượt nào. Hãy hỏi lớp một câu trong khung chat, rồi mở lại Agent Map.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5 lg:overflow-y-auto">
              <LaneCanvas turn={turn} selectedId={selected?.id ?? null} onSelect={setSelectedBlockId} />
              {turn.answer && (
                <section aria-label="Câu trả lời" className="rounded-2xl border border-[#E2EAD2] bg-white p-4">
                  <div className="mb-2 flex items-center gap-2.5">
                    <AgentAvatar role={turn.agent} size="w-9 h-9 shrink-0" />
                    <div>
                      <p className="text-[15px] font-bold text-[#121712]">{turn.agent}</p>
                      <p className="text-[12px] text-[#4A5546]">{turn.agentRole}</p>
                    </div>
                  </div>
                  <div className="max-w-[75ch] text-[15px] leading-relaxed text-[#121712]">
                    <FormattedMathText text={cleanText(turn.answer)} />
                  </div>
                </section>
              )}
            </div>
            <DetailPanel turn={turn} block={selected} onSeekVideo={onSeekVideo} onClose={onClose} />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

const MapGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
    <circle cx="5" cy="6" r="2.5" stroke="#121712" strokeWidth="2" />
    <circle cx="19" cy="6" r="2.5" stroke="#121712" strokeWidth="2" />
    <circle cx="12" cy="18" r="2.5" stroke="#121712" strokeWidth="2" />
    <path d="M7.5 6h9M6.3 8.2l4.4 7.6M17.7 8.2l-4.4 7.6" stroke="#121712" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Lane columns on a faint grid, blocks staggered left to right, joined by elbow connectors. */
const LaneCanvas: React.FC<{ turn: AgentMapTurn; selectedId: string | null; onSelect: (id: string) => void }> = ({
  turn,
  selectedId,
  onSelect,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef(new Map<string, HTMLButtonElement>());
  const [paths, setPaths] = useState<Array<{ d: string; x1: number; y1: number; x2: number; y2: number }>>([]);

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.innerWidth < 1024) {
      setPaths([]);
      return;
    }
    const base = canvas.getBoundingClientRect();
    const heads = LANES.map((l) => turn.lanes[l.id][0]).filter((b): b is MapBlock => Boolean(b));
    const next: typeof paths = [];
    for (let i = 0; i < heads.length - 1; i++) {
      const a = blockRefs.current.get(heads[i].id)?.getBoundingClientRect();
      const b = blockRefs.current.get(heads[i + 1].id)?.getBoundingClientRect();
      if (!a || !b) continue;
      const x1 = a.right - base.left;
      const y1 = a.top + a.height / 2 - base.top;
      const x2 = b.left - base.left;
      const y2 = b.top + b.height / 2 - base.top;
      const mid = x1 + (x2 - x1) / 2;
      const r = Math.min(10, Math.abs(y2 - y1) / 2, Math.abs(mid - x1));
      const dir = y2 >= y1 ? 1 : -1;
      const d =
        Math.abs(y2 - y1) < 1
          ? `M${x1},${y1} H${x2}`
          : `M${x1},${y1} H${mid - r} Q${mid},${y1} ${mid},${y1 + r * dir} V${y2 - r * dir} Q${mid},${y2} ${mid + r},${y2} H${x2}`;
      next.push({ d, x1, y1, x2, y2 });
    }
    setPaths(next);
  }, [turn]);

  useLayoutEffect(() => {
    measure();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div
      ref={canvasRef}
      className="relative rounded-2xl border border-[#E2EAD2] bg-white [background-image:linear-gradient(#EEF3E4_1px,transparent_1px),linear-gradient(90deg,#EEF3E4_1px,transparent_1px)] [background-size:24px_24px]"
    >
      <div className="flex flex-col lg:flex-row">
        {LANES.map((lane, li) => {
          const blocks = turn.lanes[lane.id];
          const empty = blocks.length === 0;
          // Staircase offset counts only lanes that have blocks, so the line reads left to right.
          const step = LANES.slice(0, li).filter((l) => turn.lanes[l.id].length > 0).length;
          return (
            <section
              key={lane.id}
              aria-label={lane.title}
              className={`border-[#E2EAD2] ${li > 0 ? 'border-t lg:border-l lg:border-t-0' : ''} ${empty ? 'lg:w-[150px] lg:flex-none' : 'lg:min-w-0 lg:flex-1'}`}
            >
              <h3 className="flex items-center justify-center gap-2 border-b border-[#E2EAD2] bg-[#FBFDF7]/90 px-3 py-3 text-[15px] font-bold text-[#121712]">
                {LANE_ICON[lane.id]}
                {lane.title}
              </h3>
              <div className="flex flex-col gap-3 p-3 lg:min-h-[260px]">
                {!empty && <div className="hidden lg:block" style={{ height: step * 52 }} aria-hidden="true" />}
                {empty ? (
                  <p className="rounded-lg border border-dashed border-[#D5DFC4] bg-white/80 px-2 py-1.5 text-center text-[12px] text-[#5B6657]">
                    Không dùng
                  </p>
                ) : (
                  blocks.map((block) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      selected={block.id === selectedId}
                      onSelect={() => onSelect(block.id)}
                      refCb={(el) => {
                        if (el) blockRefs.current.set(block.id, el);
                        else blockRefs.current.delete(block.id);
                      }}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
      {paths.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {paths.map((p, i) => (
            <g key={i}>
              <path d={p.d} fill="none" stroke="#9CCB3B" strokeWidth="2" />
              <circle cx={p.x1} cy={p.y1} r="4" fill="#121712" />
              <circle cx={p.x2} cy={p.y2} r="4" fill="#121712" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
};

const BlockCard: React.FC<{ block: MapBlock; selected: boolean; onSelect: () => void; refCb: (el: HTMLButtonElement | null) => void }> = ({
  block,
  selected,
  onSelect,
  refCb,
}) => {
  const icon =
    block.kind === 'agent' ? (
      <AgentAvatar role={block.title} size="w-9 h-9 shrink-0" />
    ) : (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF5DD] text-[#2F5A12]">
        {block.kind === 'dispatcher' ? <CircleHelp className="h-5 w-5" aria-hidden="true" /> : block.kind === 'context' ? <BookOpen className="h-5 w-5" aria-hidden="true" /> : block.kind === 'tool' ? <Wrench className="h-5 w-5" aria-hidden="true" /> : <ShieldCheck className="h-5 w-5" aria-hidden="true" />}
      </span>
    );
  return (
    <button
      ref={refCb}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative z-10 flex w-full items-start gap-2.5 rounded-xl border bg-white p-3 text-left shadow-[0_2px_6px_-2px_rgba(18,23,18,0.12)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712] ${
        selected ? 'border-[#121712] ring-2 ring-[#C8F169]' : 'border-[#DCE5CB] hover:border-[#9FB27F]'
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[14px] font-bold text-[#121712] ${block.kind === 'tool' ? 'font-mono text-[13px]' : ''}`}>{block.title}</span>
        {block.subtitle && <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-[#3D4739]"><FormattedMathText text={cleanText(block.subtitle)} /></span>}
        {block.metric && (
          <span className={`mt-1 block text-[12px] font-semibold tabular-nums ${block.tone === 'warn' ? 'text-[#9A3412]' : block.tone === 'ok' ? 'text-[#2F6B1E]' : 'text-[#4A5546]'}`}>
            {block.metric}
          </span>
        )}
      </span>
    </button>
  );
};

const DetailPanel: React.FC<{ turn: AgentMapTurn; block: MapBlock | null; onSeekVideo?: (s: number) => void; onClose: () => void }> = ({
  turn,
  block,
  onSeekVideo,
  onClose,
}) => (
  <aside
    aria-label="Chi tiết khối đang chọn"
    className="flex w-full shrink-0 flex-col gap-4 border-t border-[#E2EAD2] bg-white p-4 sm:p-5 lg:w-[380px] lg:overflow-y-auto lg:border-l lg:border-t-0"
  >
    <section>
      <h3 className="mb-2 text-[15px] font-bold text-[#121712]">Thông tin tác nhân</h3>
      <div className="flex items-center gap-3">
        <AgentAvatar role={turn.agent} size="w-12 h-12 shrink-0" />
        <div>
          <p className="text-[16px] font-bold text-[#121712]">{turn.agent}</p>
          <p className="text-[13px] leading-snug text-[#4A5546]">{turn.agentRole}</p>
        </div>
      </div>
    </section>

    {block && (
      <section className="rounded-2xl border border-[#E2EAD2] bg-[#FBFDF7] p-3.5">
        <h3 className="text-[14px] font-bold text-[#121712]">
          Khối đang chọn: <span className={block.kind === 'tool' ? 'font-mono text-[13px]' : ''}>{block.title}</span>
        </h3>
        <FieldList title="Đầu vào" items={block.input} />
        <FieldList title="Đầu ra" items={block.output} />
        {block.input.length === 0 && block.output.length === 0 && (
          <p className="mt-2 text-[13px] text-[#4A5546]">Lượt này không ghi lại dữ liệu chi tiết cho khối này.</p>
        )}
      </section>
    )}

    <section>
      <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-[#121712]">
        <Wrench className="h-4 w-4" aria-hidden="true" />
        Công cụ đã dùng
      </h3>
      {turn.tools.length === 0 ? (
        <p className="text-[13px] text-[#4A5546]">Lượt này không gọi công cụ kiểm chứng.</p>
      ) : (
        <ul className="grid gap-2">
          {turn.tools.map((t, i) => (
            <li key={i} className="rounded-xl border border-[#E2EAD2] p-2.5">
              <p className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[13px] font-semibold text-[#121712]">{t.name}</span>
                {t.verdict && (
                  <span className={`shrink-0 text-[12px] font-semibold ${t.verdict === 'ok' ? 'text-[#2F6B1E]' : 'text-[#9A3412]'}`}>
                    {t.verdict === 'ok' ? 'Khớp' : 'Không khớp'}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-[#3D4739]">{t.summary ?? t.friendlyName}</p>
            </li>
          ))}
        </ul>
      )}
    </section>

    <section>
      <h3 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-[#121712]">
        <Database className="h-4 w-4" aria-hidden="true" />
        Ngữ cảnh đã dùng
      </h3>
      {turn.contextItems.length === 0 ? (
        <p className="text-[13px] text-[#4A5546]">Không có ngữ cảnh được ghi lại.</p>
      ) : (
        <ul className="grid gap-1.5">
          {turn.contextItems.map((c, i) => (
            <li key={i} className="rounded-lg bg-[#F7FAF0] px-2.5 py-1.5 text-[13px] leading-snug text-[#121712]">
              <FormattedMathText text={cleanText(c)} />
            </li>
          ))}
        </ul>
      )}
      {turn.hiddenContextCount > 0 && (
        <p className="mt-2 flex items-start gap-2 text-[13px] leading-snug text-[#4A5546]">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {turn.hiddenContextCount} mục ngữ cảnh bị ẩn với tác nhân này, để tác nhân không nhìn thấy lời giải.
        </p>
      )}
    </section>

    <section>
      <h3 className="mb-2 text-[15px] font-bold text-[#121712]">Trích dẫn</h3>
      {turn.citations.length === 0 ? (
        <p className="text-[13px] text-[#4A5546]">Câu trả lời này không kèm trích dẫn.</p>
      ) : (
        <ol className="grid gap-2">
          {turn.citations.map((c, i) => {
            const canSeek = typeof c.timestamp === 'number' && Boolean(onSeekVideo);
            const body = (
              <>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E9F2D8] text-[12px] font-bold">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-[#121712]"><FormattedMathText text={cleanText(c.label)} /></span>
                  {c.snippet && <span className="mt-0.5 block text-[13px] leading-snug text-[#3D4739]"><FormattedMathText text={cleanText(c.snippet)} /></span>}
                </span>
                {typeof c.timestamp === 'number' && <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#2F5A12]">{formatSec(c.timestamp)}</span>}
              </>
            );
            return (
              <li key={i}>
                {canSeek ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSeekVideo!(c.timestamp!);
                    }}
                    className="flex w-full items-start gap-2.5 rounded-xl border border-[#E2EAD2] p-2.5 text-left transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-[#121712]"
                    title={`Tua bài giảng tới ${formatSec(c.timestamp!)}`}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#E2EAD2] p-2.5">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  </aside>
);

const FieldList: React.FC<{ title: string; items: { label: string; value: string; mono?: boolean }[] }> = ({ title, items }) =>
  items.length === 0 ? null : (
    <div className="mt-2.5">
      <p className="text-[12px] font-semibold text-[#4A5546]">{title}</p>
      <dl className="mt-1 grid gap-1.5">
        {items.map((f, i) => (
          <div key={i} className="text-[13px] leading-snug">
            <dt className="inline font-semibold text-[#121712]">{f.label}: </dt>
            <dd className={`inline break-words text-[#3D4739] ${f.mono ? 'font-mono text-[12px]' : ''}`}>{f.mono ? cleanText(f.value) : <FormattedMathText text={cleanText(f.value)} />}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
