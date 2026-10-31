import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ReasoningEvent } from '../../types/reasoning';
import { AgentAvatar } from '../shared/AgentAvatar';
import { EventRow } from '../shared/EventRow';
import { ToolCallCard } from '../shared/ToolCallCard';
import {
  agentColor,
  agentCounts,
  buildLanes,
  categoryCounts,
  CATEGORY_LABELS,
  formatOffset,
  type LogCategory,
} from './reasoningLogModel';

interface ReasoningLogProps {
  events: ReasoningEvent[];
  /** True once the run sent its `done` event. */
  isDone: boolean;
}

const CATEGORIES: LogCategory[] = ['reasoning', 'tool', 'reply'];

function toggle<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

const chipBase =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]';
const chipClass = (on: boolean) =>
  `${chipBase} ${on ? 'bg-[#121712] border-[#121712] text-white' : 'bg-white border-[#D5DFC4] text-[#3D4739] hover:bg-[#F3F8E8]'}`;

/** Reasoning and tool-call log: one lane per run of consecutive events from the same agent. */
export const ReasoningLog: React.FC<ReasoningLogProps> = ({ events, isDone }) => {
  const [agents, setAgents] = useState<ReadonlySet<string>>(new Set());
  const [categories, setCategories] = useState<ReadonlySet<LogCategory>>(new Set());

  const base = events[0]?.timestamp ?? 0;
  const lanes = useMemo(() => buildLanes(events, { agents, categories }), [events, agents, categories]);
  const roster = useMemo(() => agentCounts(events), [events]);
  const perCategory = useMemo(() => categoryCounts(events), [events]);
  const lastEvent = events[events.length - 1];
  const doneEvent = isDone ? [...events].reverse().find((e) => e.eventType === 'done') : undefined;
  const filtered = agents.size > 0 || categories.size > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc dòng sự kiện">
        {roster.map(({ agent, count }) => (
          <button
            key={agent}
            type="button"
            aria-pressed={agents.has(agent)}
            onClick={() => setAgents((s) => toggle(s, agent))}
            className={chipClass(agents.has(agent))}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agentColor(agent) }} aria-hidden="true" />
            {agent}
            <span className="tabular-nums opacity-75">{count}</span>
          </button>
        ))}
        {roster.length > 0 && <span className="w-px h-5 bg-[#E2EAD2] mx-1" aria-hidden="true" />}
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={categories.has(c)}
            onClick={() => setCategories((s) => toggle(s, c))}
            className={chipClass(categories.has(c))}
          >
            {CATEGORY_LABELS[c]}
            <span className="tabular-nums opacity-75">{perCategory[c]}</span>
          </button>
        ))}
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setAgents(new Set());
              setCategories(new Set());
            }}
            className="text-xs font-semibold text-[#2F7A3B] underline underline-offset-4 decoration-[#B7DB6A] hover:decoration-[#2F7A3B] px-1 cursor-pointer"
          >
            Bỏ lọc
          </button>
        )}
      </div>

      {lanes.length === 0 && filtered && (
        <p className="text-[13px] text-[#4A5546] py-4">Không có sự kiện nào khớp bộ lọc.</p>
      )}

      <ol className="space-y-4">
        {lanes.map((lane) => {
          const color = agentColor(lane.agent);
          return (
            <li key={lane.key} className="flex gap-3">
              <div className="flex flex-col items-center w-8 shrink-0">
                <AgentAvatar name={lane.agent} size="sm" showLabel={false} state="idle" />
                <span className="w-0.5 grow mt-1.5 rounded-full" style={{ backgroundColor: color, opacity: 0.35 }} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 pt-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                  <span className="text-[15px] font-bold text-[#121712]">{lane.agent}</span>
                  <span className="font-mono text-[11px] text-[#5B6657] tabular-nums">
                    {formatOffset(lane.firstTimestamp, base)}
                    {lane.lastTimestamp !== lane.firstTimestamp && ` – ${formatOffset(lane.lastTimestamp, base).slice(1)}`}
                  </span>
                </div>
                {lane.items.map((item) => {
                  if (item.kind === 'tool') {
                    const anchor = item.call ?? item.result;
                    return (
                      <ToolCallCard
                        key={anchor?.id}
                        call={item.call}
                        result={item.result}
                        pending={!isDone && !item.result}
                      />
                    );
                  }
                  return (
                    <EventRow
                      key={item.event.id}
                      event={item.event}
                      offset={formatOffset(item.event.timestamp, base)}
                      isLive={!isDone && item.event === lastEvent && item.event.eventType === 'thinking'}
                    />
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {doneEvent && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-[#B7DB6A] bg-[#F7FBEF]">
          <CheckCircle2 className="w-4 h-4 text-[#2F7A3B] shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-[#1F4D12]">Hoàn thành phiên suy luận</span>
          <span className="ml-auto font-mono text-[11px] text-[#1F4D12] tabular-nums">{formatOffset(doneEvent.timestamp, base)}</span>
        </div>
      )}
    </div>
  );
};
