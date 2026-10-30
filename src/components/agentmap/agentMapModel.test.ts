import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { InspectorTurn } from '../../types/reasoning';
import { buildAgentMapTurn } from './agentMapModel';

const chatTurn: InspectorTurn = {
  turnId: 't1',
  timestamp: 0,
  turnNumber: 7,
  timestampStr: '37:13',
  agent: 'Trí',
  question: 'Tại sao |a+b| ≠ 1+1=2?',
  dispatcher: { intent: 'hỏi bản chất', selectedAgent: 'Trí', confidence: 0.98, reason: 'Câu hỏi khái niệm', isEvaluated: true },
  contextView: {
    visibleContext: ['Bảng phấn 37:13'],
    hiddenContext: ['Lời giải chuẩn'],
    boardSnippet: "|BC + DD'|",
    ragKnowledge: 'Không dùng',
  },
  dialogue: 'Độ lớn của tổng phụ thuộc vào hướng.',
  toolCalls: [
    { toolName: 'tool_verify_vector_algebra', isValid: true, badgeText: 'Đã kiểm chứng', input: { a: 1 } } as unknown as NonNullable<InspectorTurn['toolCalls']>[number],
  ],
  citations: [{ source: 'video', label: 'Ví dụ 3', timestamp: 2233 }],
  latencyMs: 120,
};

test('builds four lanes from the fields the turn carries', () => {
  const t = buildAgentMapTurn(chatTurn);
  assert.equal(t.lanes.understand[0].title, 'Dispatcher');
  assert.match(t.lanes.understand[0].metric ?? '', /0\.98/);
  assert.match(t.lanes.understand[0].metric ?? '', /120 ms/);
  assert.equal(t.lanes.context.length, 1, '"Không dùng" knowledge is not a context block');
  assert.equal(t.lanes.verify[0].title, 'tool_verify_vector_algebra');
  assert.equal(t.lanes.verify[0].tone, 'ok');
  assert.equal(t.lanes.answer[0].metric, '1 trích dẫn');
  assert.equal(t.tools[0].friendlyName, 'Kiểm tra phép tính vectơ');
});

test('hidden context is counted, never exposed', () => {
  const t = buildAgentMapTurn(chatTurn);
  assert.equal(t.hiddenContextCount, 1);
  const everything = JSON.stringify(t);
  assert.ok(!everything.includes('Lời giải chuẩn'));
});

test('missing measurements are omitted rather than invented', () => {
  const t = buildAgentMapTurn({ turnId: 't2', timestamp: 0, agent: 'Bo', speech: 'Tớ thấy 1 + 1 = 2' });
  assert.equal(t.lanes.understand.length, 0);
  assert.equal(t.lanes.verify.length, 0);
  assert.equal(t.latencyMs, undefined);
  assert.equal(t.lanes.answer[0].metric, undefined);
  assert.equal(t.answer, 'Tớ thấy 1 + 1 = 2');
});

test('a transcript placeholder is not shown as the teacher\'s words', () => {
  const t = buildAgentMapTurn({
    turnId: 't3',
    timestamp: 0,
    agent: 'Bo',
    contextView: { visibleContext: ['Lời thầy, 30 giây gần nhất: Đã chép lời', 'Bảng phấn 37:13'], hiddenContext: [], teacherSpeech: 'Đã chép lời' },
  });
  assert.equal(t.lanes.context.find((b) => b.title === 'Lời thầy giảng'), undefined);
  assert.deepEqual(t.contextItems, ['Bảng phấn 37:13']);
});

test('dispatcher intent ids are shown in plain Vietnamese', async () => {
  const { intentLabel } = await import('./agentMapModel');
  assert.equal(intentLabel('ask_deep_concept'), 'Hỏi bản chất');
  assert.equal(intentLabel('some_new_intent'), 'Câu hỏi khác');
  assert.equal(intentLabel('Phản biện lỗi nhận thức vectơ'), 'Phản biện lỗi nhận thức vectơ');
  const t = buildAgentMapTurn({ ...chatTurn, dispatcher: { ...chatTurn.dispatcher!, intent: 'ask_deep_concept' } });
  assert.equal(t.lanes.understand[0].subtitle, 'Ý định: Hỏi bản chất');
});
