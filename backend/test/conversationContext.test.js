import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildConversationContext, dispatchMessage } from '../src/services/dispatcher.js';
import { generateCitations, pickBoardLatex } from '../src/services/contextSnapshot.js';

test('conversation context names the message being answered and the recent turns', () => {
  const ctx = buildConversationContext({
    replyTo: { author: 'Minh Khang', text: 'Vectơ giống như chỉ đường cho drone.' },
    chatHistory: [
      { author: 'Bo', text: 'Nghe hơi hồi hộp.' },
      { author: 'Trí', text: 'Định nghĩa giữ nguyên từ lớp 10.' },
    ],
  });
  assert.match(ctx, /đang trả lời tin của Minh Khang: "Vectơ giống như chỉ đường cho drone\."/);
  assert.match(ctx, /Bo: Nghe hơi hồi hộp\.\nTrí: Định nghĩa giữ nguyên từ lớp 10\./);
});

test('conversation context is null when there is nothing to add', () => {
  assert.equal(buildConversationContext({}), null);
  assert.equal(buildConversationContext({ chatHistory: [{ author: 'Bo', text: '' }] }), null);
});

test('conversation context keeps only the last six turns', () => {
  const chatHistory = Array.from({ length: 9 }, (_, i) => ({ author: 'Bo', text: `tin ${i}` }));
  const ctx = buildConversationContext({ chatHistory });
  assert.doesNotMatch(ctx, /tin 2\b/);
  assert.match(ctx, /tin 3[\s\S]*tin 8/);
});

test('board citation prefers the vector line over the segment contrast', () => {
  assert.equal(pickBoardLatex(['AB = BA', '\\vec{AB} \\neq \\vec{BA}']), '\\vec{AB} \\neq \\vec{BA}');
  assert.equal(pickBoardLatex(['x = 1']), 'x = 1');
});

test('video citation says "đoạn từ" when the question comes mid-segment', () => {
  const blackboardState = {
    segment: { second: 78, timeFormatted: '01:18', audioTranscript: 'Vectơ là đoạn thẳng có hướng.', blackboardLatex: ['AB = BA', '\\vec{AB} \\neq \\vec{BA}'] },
  };
  const [video, board] = generateCitations({ second: 109, blackboardState });
  assert.equal(video.label, 'Video bài giảng Thầy Tiến (đoạn từ 01:18)');
  assert.equal(board.label, 'Bảng phấn 01:18: \\vec{AB} \\neq \\vec{BA}');
  const [atStart] = generateCitations({ second: 78, blackboardState });
  assert.equal(atStart.label, 'Video bài giảng Thầy Tiến (01:18)');
});

test('small talk gets an answer but no lecture citations', async () => {
  const res = await dispatchMessage({
    message: 'cảm ơn Khang nhá',
    currentTime: 109,
    recipient: 'minhkhang',
    useLLM: false,
    replyTo: { author: 'Minh Khang', text: 'Vectơ giống như chỉ đường cho drone.' },
  });
  assert.ok(res.primaryResponse?.text);
  assert.deepEqual(res.citations, []);
  assert.deepEqual(res.primaryResponse.citations, []);
});

test('a lecture question at the same moment still carries citations', async () => {
  const res = await dispatchMessage({
    message: 'vectơ AB có bằng BA không',
    currentTime: 109,
    useLLM: false,
  });
  assert.ok(res.citations.length >= 1);
});
