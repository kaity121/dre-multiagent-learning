import type { ReasoningEvent } from '../../types/reasoning';

/**
 * View model for the War Room reasoning log: filters events, joins each tool call with its result,
 * and groups consecutive events of one agent into a lane.
 */

export type LogCategory = 'reasoning' | 'tool' | 'reply';

export const CATEGORY_LABELS: Record<LogCategory, string> = {
  reasoning: 'Suy luận',
  tool: 'Công cụ',
  reply: 'Trả lời',
};

/** Identity colours from DESIGN.md "Agent Identity"; agents outside that roster use ink-faint. */
const AGENT_COLORS: Record<string, string> = {
  'Cả lớp': '#0e7490',
  Bo: '#b45309',
  'Trí': '#1d4ed8',
  'Linh Chi': '#059669',
  'Minh Khang': '#7c3aed',
  An: '#0f766e',
  'Cô Lam': '#3D4739',
};
const FALLBACK_AGENT_COLOR = '#5B6657';

export function agentColor(agent: string): string {
  return AGENT_COLORS[agent] ?? FALLBACK_AGENT_COLOR;
}

export function categoryOf(event: ReasoningEvent): LogCategory | null {
  switch (event.eventType) {
    case 'thinking':
      return 'reasoning';
    case 'tool_call':
    case 'tool_result':
      return 'tool';
    case 'speaking':
    case 'cross_check_verdict':
      return 'reply';
    default:
      return null;
  }
}

export type LogItem =
  | { kind: 'event'; event: ReasoningEvent }
  /** A tool call and, once it arrived, the result event that answers it. */
  | { kind: 'tool'; call: ReasoningEvent | null; result: ReasoningEvent | null };

export interface LogLane {
  key: string;
  agent: string;
  items: LogItem[];
  firstTimestamp: number;
  lastTimestamp: number;
}

export interface LogFilters {
  /** Empty means every agent. */
  agents: ReadonlySet<string>;
  /** Empty means every category. */
  categories: ReadonlySet<LogCategory>;
}

function toolNameOf(event: ReasoningEvent): string {
  return event.toolCall?.toolName || event.toolResult?.toolName || '';
}

/**
 * Pairs every tool_call with the first later, unclaimed tool_result of the same agent and tool
 * (or the same callId). Returns call index -> result index; unmatched results stay standalone.
 */
export function pairToolResults(events: ReasoningEvent[]): Map<number, number> {
  const pairs = new Map<number, number>();
  const claimed = new Set<number>();
  events.forEach((evt, i) => {
    if (evt.eventType !== 'tool_call') return;
    const callId = evt.toolCall?.callId;
    const name = toolNameOf(evt);
    for (let j = i + 1; j < events.length; j++) {
      const cand = events[j];
      if (claimed.has(j) || cand.eventType !== 'tool_result') continue;
      const sameId = Boolean(callId) && cand.toolResult?.callId === callId;
      const sameTool = cand.agent === evt.agent && (!toolNameOf(cand) || toolNameOf(cand) === name);
      if (sameId || sameTool) {
        pairs.set(i, j);
        claimed.add(j);
        break;
      }
    }
  });
  return pairs;
}

export function buildLanes(events: ReasoningEvent[], filters: LogFilters): LogLane[] {
  const pairs = pairToolResults(events);
  const pairedResults = new Set(pairs.values());
  const lanes: LogLane[] = [];

  events.forEach((evt, i) => {
    const category = categoryOf(evt);
    if (category === null) return; // `done` is rendered outside the lanes
    if (filters.categories.size && !filters.categories.has(category)) return;
    if (filters.agents.size && !filters.agents.has(evt.agent)) return;
    if (evt.eventType === 'tool_result' && pairedResults.has(i)) return;

    let item: LogItem;
    if (evt.eventType === 'tool_call') {
      const resultIndex = pairs.get(i);
      item = { kind: 'tool', call: evt, result: resultIndex === undefined ? null : events[resultIndex] };
    } else if (evt.eventType === 'tool_result') {
      item = { kind: 'tool', call: null, result: evt };
    } else {
      item = { kind: 'event', event: evt };
    }

    const last = lanes[lanes.length - 1];
    if (last && last.agent === evt.agent) {
      last.items.push(item);
      last.lastTimestamp = evt.timestamp;
    } else {
      lanes.push({ key: evt.id || `lane-${i}`, agent: evt.agent, items: [item], firstTimestamp: evt.timestamp, lastTimestamp: evt.timestamp });
    }
  });
  return lanes;
}

/** Events that show up as their own log item: a result merged into its call card is not counted twice. */
function visibleItems(events: ReasoningEvent[]): ReasoningEvent[] {
  const merged = new Set(pairToolResults(events).values());
  return events.filter((evt, i) => categoryOf(evt) !== null && !merged.has(i));
}

/** Agents in order of first appearance, with how many log items each produced. */
export function agentCounts(events: ReasoningEvent[]): { agent: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const evt of visibleItems(events)) counts.set(evt.agent, (counts.get(evt.agent) ?? 0) + 1);
  return [...counts].map(([agent, count]) => ({ agent, count }));
}

export function categoryCounts(events: ReasoningEvent[]): Record<LogCategory, number> {
  const counts: Record<LogCategory, number> = { reasoning: 0, tool: 0, reply: 0 };
  for (const evt of visibleItems(events)) {
    const c = categoryOf(evt);
    if (c) counts[c] += 1;
  }
  return counts;
}

/** "+mm:ss" relative to the first event of the run. */
export function formatOffset(timestamp: number, base: number): string {
  const sec = Number.isFinite(timestamp - base) ? Math.max(0, Math.round((timestamp - base) / 1000)) : 0;
  return `+${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0).replace('.', ',')} s`;
}

function shortValue(value: unknown, max: number): string {
  let text: string;
  if (Array.isArray(value)) text = value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
  else if (value && typeof value === 'object') text = JSON.stringify(value);
  else text = String(value);
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** "key: value · key: value" for a tool's input, each value clipped. */
export function summarizeArgs(args: Record<string, unknown> | undefined, maxPerValue = 48): string {
  if (!args) return '';
  return Object.entries(args)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${shortValue(v, maxPerValue)}`)
    .join(' · ');
}

/** One line for a tool result: the agent's own note first, otherwise the result's reason or value. */
export function summarizeResult(result: ReasoningEvent | null, max = 160): string {
  if (!result) return '';
  if (result.content?.trim()) return shortValue(result.content, max);
  const payload = result.toolResult;
  if (payload?.error) return shortValue(payload.error, max);
  const value = payload?.result;
  if (value && typeof value === 'object' && typeof (value as { reason?: unknown }).reason === 'string') {
    return shortValue((value as { reason: string }).reason, max);
  }
  return value === undefined ? '' : shortValue(value, max);
}

/** First sentence or line of a thought, for its collapsed one-line form. */
export function firstLine(text: string | undefined, max = 140): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  const sentence = clean.match(/^.*?[.!?…](\s|$)/)?.[0]?.trim() ?? clean;
  return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence;
}
