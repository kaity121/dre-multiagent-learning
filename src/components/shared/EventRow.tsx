import React, { useId, useState } from 'react';
import { ReasoningEvent } from '../../types/reasoning';
import { Brain, ChevronDown, Scale } from 'lucide-react';
import { firstLine } from '../warroom/reasoningLogModel';

interface EventRowProps {
  event: ReasoningEvent;
  /** "+mm:ss" since the first event of the run. */
  offset: string;
  /** True for the newest event of a run that is still going. */
  isLive?: boolean;
}

type Verdict = 'agree' | 'disagree' | 'partial' | 'unknown';

function verdictOf(event: ReasoningEvent): Verdict {
  const cc = event.crossCheck;
  if (cc?.verdict) return cc.verdict;
  // Without a structured verdict, trust only an explicit metadata verdict or a leading verdict phrase.
  const meta = typeof event.metadata?.verdict === 'string' ? event.metadata.verdict : '';
  const text = (event.content || '').trim();
  if (meta === 'agree' || /^(chấp nhận|đồng ý|đồng thuận)/i.test(text)) return 'agree';
  if (meta === 'disagree' || /^(bác|từ chối|không đồng ý|chưa đồng thuận)/i.test(text)) return 'disagree';
  return 'unknown';
}

const VERDICT_LABEL: Record<Verdict, string> = {
  agree: 'Đồng thuận',
  disagree: 'Bác bỏ',
  partial: 'Đồng ý một phần',
  unknown: 'Phán quyết',
};

const Offset: React.FC<{ value: string }> = ({ value }) => (
  <span className="ml-auto shrink-0 font-mono text-[11px] text-[#5B6657] tabular-nums">{value}</span>
);

/** Thought: live while the agent is still on it, then a one-line summary that expands. */
const ThinkingRow: React.FC<EventRowProps> = ({ event, offset, isLive }) => {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const text = event.content?.trim() || '';

  if (isLive) {
    return (
      <div className="rounded-xl bg-[#F7FAF0] border border-[#E2EAD2] px-3 py-2.5" aria-live="polite">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#3D4739]">
          <span className="relative flex w-2 h-2" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-[#3D4739] opacity-40 motion-safe:animate-ping" />
            <span className="relative w-2 h-2 rounded-full bg-[#3D4739]" />
          </span>
          đang nghĩ…
          <Offset value={offset} />
        </div>
        {text && <p className="mt-1.5 text-[13px] leading-relaxed text-[#3D4739] whitespace-pre-wrap">{text}</p>}
      </div>
    );
  }

  const summary = firstLine(text);
  const expandable = summary !== text.replace(/\s+/g, ' ').trim();
  return (
    <div className="rounded-xl hover:bg-[#F7FAF0] transition-colors">
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        aria-expanded={expandable ? open : undefined}
        aria-controls={expandable ? bodyId : undefined}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-[#121712] ${expandable ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Brain className="w-3.5 h-3.5 text-[#5B6657] shrink-0" aria-hidden="true" />
        <span className="text-xs font-semibold text-[#4A5546] shrink-0">Suy luận</span>
        <span className={`text-[13px] text-[#3D4739] min-w-0 ${open ? '' : 'truncate'}`}>{open ? '' : summary}</span>
        {expandable && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#5B6657] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        )}
        <Offset value={offset} />
      </button>
      {open && (
        <p id={bodyId} className="px-3 pb-2 pl-[2.1rem] text-[13px] leading-relaxed text-[#3D4739] whitespace-pre-wrap">
          {text}
        </p>
      )}
    </div>
  );
};

export const EventRow: React.FC<EventRowProps> = (props) => {
  const { event, offset } = props;

  if (event.eventType === 'thinking') return <ThinkingRow {...props} />;

  if (event.eventType === 'cross_check_verdict') {
    const cc = event.crossCheck;
    const verdict = verdictOf(event);
    const pill =
      verdict === 'agree'
        ? 'border border-[#B7DB6A] bg-[#F7FBEF] text-[#1F4D12]'
        : verdict === 'disagree'
          ? 'bg-[#121712] text-white'
          : 'border border-[#D5DFC4] bg-white text-[#3D4739]';
    return (
      <div className="rounded-xl border border-[#D5DFC4] bg-white px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Scale className="w-3.5 h-3.5 text-[#4A5546]" aria-hidden="true" />
          <span className="text-xs font-semibold text-[#4A5546]">Phản biện chéo</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pill}`}>{VERDICT_LABEL[verdict]}</span>
          {cc?.targetAgent && <span className="text-xs text-[#4A5546]">với ý của {cc.targetAgent}</span>}
          {typeof cc?.confidence === 'number' && (
            <span className="text-xs text-[#4A5546] tabular-nums">· tin cậy {Math.round(cc.confidence * 100)}%</span>
          )}
          <Offset value={offset} />
        </div>
        <p className="text-sm leading-relaxed text-[#121712] whitespace-pre-wrap">{cc?.critique || event.content}</p>
        {cc?.counterProposal && (
          <p className="text-[13px] leading-relaxed text-[#3D4739]">
            <span className="font-semibold text-[#121712]">Đề xuất:</span> {cc.counterProposal}
          </p>
        )}
      </div>
    );
  }

  if (event.eventType === 'speaking') {
    return (
      <div className="px-3 py-2 rounded-xl bg-white">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-[#4A5546]">Trả lời</span>
          <Offset value={offset} />
        </div>
        <p className="text-sm leading-relaxed text-[#121712] whitespace-pre-wrap">{event.content}</p>
      </div>
    );
  }

  return null;
};
