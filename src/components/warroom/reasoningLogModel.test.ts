import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ReasoningEvent } from '../../types/reasoning';
import {
  buildLanes,
  pairToolResults,
  agentColor,
  formatDuration,
  summarizeArgs,
  summarizeResult,
  firstLine,
  categoryCounts,
  type LogCategory,
} from './reasoningLogModel';

let seq = 0;
const ev = (agent: string, eventType: ReasoningEvent['eventType'], extra: Partial<ReasoningEvent> = {}): ReasoningEvent => ({
  id: `e${++seq}`,
  timestamp: 1000 * seq,
  agent,
  eventType,
  ...extra,
});
const call = (agent: string, toolName: string) => ev(agent, 'tool_call', { toolCall: { toolName, args: { x: 1 } } });
const result = (agent: string, toolName: string, content = '') =>
  ev(agent, 'tool_result', { content, toolResult: { toolName, status: 'success' } });
const none = { agents: new Set<string>(), categories: new Set<LogCategory>() };
const shape = (lanes: ReturnType<typeof buildLanes>) => lanes.map((l) => `${l.agent}:${l.items.length}`);

test('a tool call joins the next result of the same agent and tool, and the result leaves the lane', () => {
  const events = [ev('Bo', 'thinking'), call('Bo', 'kb'), call('Trí', 'verify'), result('Trí', 'verify'), result('Bo', 'kb')];
  assert.deepEqual([...pairToolResults(events)], [[1, 4], [2, 3]]);
  const lanes = buildLanes(events, none);
  assert.deepEqual(shape(lanes), ['Bo:2', 'Trí:1']);
  const boTool = lanes[0].items[1];
  assert.equal(boTool.kind === 'tool' ? boTool.result?.id : null, events[4].id);
});

test('consecutive events of one agent share a lane; another agent starts a new one', () => {
  const events = [ev('Bo', 'thinking'), ev('Bo', 'speaking'), ev('Trí', 'cross_check_verdict'), ev('Bo', 'speaking'), ev('Cô Lam', 'done')];
  assert.deepEqual(shape(buildLanes(events, none)), ['Bo:2', 'Trí:1', 'Bo:1']);
});

test('filters by agent and category; lanes merge across hidden events', () => {
  const events = [ev('Bo', 'thinking'), ev('Trí', 'thinking'), ev('Bo', 'speaking'), call('Bo', 'kb'), result('Bo', 'kb')];
  assert.deepEqual(shape(buildLanes(events, { agents: new Set(['Bo']), categories: new Set() })), ['Bo:3']);
  assert.deepEqual(shape(buildLanes(events, { agents: new Set(), categories: new Set<LogCategory>(['tool']) })), ['Bo:1']);
  // The call and its merged result are one tool item.
  assert.deepEqual(categoryCounts(events), { reasoning: 2, tool: 1, reply: 1 });
});

test('an unmatched result stays visible on its own', () => {
  const lanes = buildLanes([result('An', 'rag', 'found 2')], none);
  assert.equal(lanes[0].items[0].kind, 'tool');
});

test('formatting helpers', () => {
  assert.equal(agentColor('Bo'), '#b45309');
  assert.equal(agentColor('Assessor'), '#5B6657');
  assert.equal(formatDuration(320), '320 ms');
  assert.equal(formatDuration(1800), '1,8 s');
  assert.equal(formatDuration(-1), '');
  assert.equal(summarizeArgs({ latex: '|BC|', tags: ['a', 'b'], empty: '' }), 'latex: |BC| · tags: a, b');
  const withReason = ev('Bo', 'tool_result', { toolResult: { toolName: 't', status: 'success', result: { reason: 'ok 1' } } });
  assert.equal(summarizeResult(withReason), 'ok 1');
  assert.equal(summarizeResult(null), '');
  assert.equal(firstLine('Câu một. Câu hai.'), 'Câu một.');
});
