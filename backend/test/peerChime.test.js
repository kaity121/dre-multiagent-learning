import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConversationContext,
  dispatchMessage,
  generatePeerChime,
  opensByNaming,
  pickPeerChime,
  routeReplyToAddressee,
} from '../src/services/dispatcher.js';

const base = {
  primaryAgent: 'tri',
  detectedIntent: 'ask_deep_concept',
  hasFollowUp: false,
  isMathLesson: true,
};

test('a classmate chimes in on every second learner turn only', () => {
  assert.equal(pickPeerChime({ ...base, learnerTurn: 1 }), null);
  assert.equal(pickPeerChime({ ...base, learnerTurn: 2 }), 'minhkhang');
  assert.equal(pickPeerChime({ ...base, learnerTurn: 3 }), null);
  assert.equal(pickPeerChime({ ...base, learnerTurn: 4 }), 'linhchi');
  assert.equal(pickPeerChime({ ...base, learnerTurn: 6 }), 'bo');
  assert.equal(pickPeerChime({ ...base, learnerTurn: 8 }), 'minhkhang');
});

test('the chiming classmate is never the one who just answered', () => {
  assert.equal(pickPeerChime({ ...base, primaryAgent: 'minhkhang', learnerTurn: 2 }), 'linhchi');
  assert.equal(pickPeerChime({ ...base, primaryAgent: 'linhchi', learnerTurn: 2 }), 'minhkhang');
});

test('no chime when someone already follows up, or for Bo, Trợ giảng An, Cô Lam, small talk and off-topic turns', () => {
  const turn = { learnerTurn: 2 };
  assert.equal(pickPeerChime({ ...base, ...turn, hasFollowUp: true }), null);
  assert.equal(pickPeerChime({ ...base, ...turn, primaryAgent: 'bo' }), null);
  assert.equal(pickPeerChime({ ...base, ...turn, primaryAgent: 'colam' }), null);
  assert.equal(pickPeerChime({ ...base, ...turn, primaryAgent: 'an', detectedIntent: 'ask_scaffolding_help' }), null);
  assert.equal(pickPeerChime({ ...base, ...turn, isSmallTalk: true }), null);
  assert.equal(pickPeerChime({ ...base, ...turn, isOffTopic: true }), null);
  assert.equal(pickPeerChime({ ...base, ...turn, detectedIntent: 'general_classroom_chitchat' }), null);
  assert.equal(pickPeerChime({ ...base, ...turn, isMathLesson: false }), null);
  assert.equal(pickPeerChime({ ...base, learnerTurn: undefined }), null);
});

test('offline chime pings the answering peer and replies to that answer', async () => {
  const chime = await generatePeerChime({
    chimeAgent: 'minhkhang',
    primaryResponse: { author: 'Trí', avatarId: 'tri', text: 'Vectơ có hướng nên AB khác BA.' },
    message: 'vectơ AB có bằng BA không',
    conversationContext: null,
    mathProblem: 'Vectơ',
    lessonTitle: 'Vectơ',
    currentTime: 109,
    useLLM: false,
  });
  assert.equal(chime.author, 'Minh Khang');
  assert.equal(chime.kind, 'peer_chime');
  assert.deepEqual(chime.repliesTo, { author: 'Trí', avatarId: 'tri' });
  assert.match(chime.text, /^@Trí /);
  assert.deepEqual(chime.citations, []);
});

test("Bo's offline chime is honest confusion and gives nothing away about the checkpoint", async () => {
  const chime = await generatePeerChime({
    chimeAgent: 'bo',
    primaryResponse: { author: 'Trí', avatarId: 'tri', text: 'Xem hai vectơ có cùng hướng không đã.' },
    message: 'sao lại phải xét hướng',
    conversationContext: null,
    mathProblem: 'Vectơ',
    lessonTitle: 'Vectơ',
    currentTime: 2200,
    useLLM: false,
  });
  assert.match(chime.text, /^@Trí /);
  assert.doesNotMatch(chime.text, /√2|căn 2|không cùng hướng|cộng được/i);
});

test('the second learner turn of a session carries a peer chime that answers the primary reply', async () => {
  const sessionId = `chime_test_${Date.now()}`;
  const ask = (message) => dispatchMessage({ message, currentTime: 109, useLLM: false, sessionId });

  const first = await ask('Vì sao vectơ lại cần có hướng vậy?');
  assert.notEqual(first.followUpResponse?.kind, 'peer_chime');

  const second = await ask('Vì sao độ dài vectơ lại không phụ thuộc hướng?');
  const chime = second.followUpResponse;
  assert.equal(second.primaryResponse.avatarId, 'tri');
  assert.equal(chime?.kind, 'peer_chime');
  assert.notEqual(chime.avatarId, second.primaryResponse.avatarId);
  assert.equal(chime.repliesTo.author, second.primaryResponse.author);
  assert.ok(chime.text.startsWith(`@${second.primaryResponse.author}`));
});

test('an existing follow-up wins over the peer chime', async () => {
  const sessionId = `chime_keep_${Date.now()}`;
  await dispatchMessage({ message: 'Vì sao vectơ lại cần có hướng vậy?', currentTime: 109, useLLM: false, sessionId });
  // A vector-equality claim already gets Minh Khang's scripted follow-up after Trí.
  const res = await dispatchMessage({ message: 'vectơ AB bằng BA y như đoạn thẳng mà', currentTime: 109, useLLM: false, sessionId });
  assert.ok(res.followUpResponse?.text);
  assert.notEqual(res.followUpResponse.kind, 'peer_chime');
});

test('replying inside a thread tells the agent which message started the thread', () => {
  const ctx = buildConversationContext({
    threadRoot: { author: 'Bo', text: 'Vectơ AB với BA có bằng nhau không?' },
    replyTo: { author: 'Trí', text: 'Khác hoàn toàn, vectơ có hướng.' },
    chatHistory: [
      { author: 'Bo', text: 'Vectơ AB với BA có bằng nhau không?' },
      { author: 'Trí', text: 'Khác hoàn toàn, vectơ có hướng.' },
    ],
  });
  assert.match(ctx, /Thread này bắt đầu từ tin của Bo: "Vectơ AB với BA có bằng nhau không\?"/);
  assert.match(ctx, /đang trả lời tin của Trí/);
  assert.match(ctx, /Các tin trong thread này:\nBo: /);
});

test('replying to the thread root itself does not repeat the root line', () => {
  const root = { author: 'Bo', text: 'Vectơ AB với BA có bằng nhau không?' };
  const ctx = buildConversationContext({ threadRoot: root, replyTo: root, chatHistory: [root] });
  assert.doesNotMatch(ctx, /Thread này bắt đầu/);
  assert.match(ctx, /đang trả lời tin của Bo/);
});

test('a reply to Trí that mentions "ngược hướng" goes to Trí, not to Bo\'s rebuttal', async () => {
  const res = await dispatchMessage({
    message: 'Vậy nếu ngược hướng thì độ dài của hai vectơ đó có khác nhau không cậu?',
    currentTime: 125,
    recipient: 'tri',
    useLLM: false,
    replyTo: { author: 'Trí', text: 'Vectơ có mũi tên chỉ hướng: AB đi từ A đến B, còn BA đi ngược lại.' },
  });
  assert.equal(res.primaryResponse.avatarId, 'tri');
  assert.notEqual(res.primaryResponse.mode, 'skeptic_pushback');
});

test('the same words sent to the whole class without a reply keep their usual routing', async () => {
  const verdict = routeReplyToAddressee(
    { detectedIntent: 'challenge_shortcut_fallacy', dispatchedAgent: 'bo', unsubstantiatedRebuttal: true },
    { recipient: 'all', replyTo: { author: 'Trí', text: 'x' } },
  );
  assert.equal(verdict.dispatchedAgent, 'bo');
  const toBo = routeReplyToAddressee(
    { detectedIntent: 'challenge_shortcut_fallacy', dispatchedAgent: 'bo' },
    { recipient: 'bo', replyTo: { author: 'Bo', text: 'x' } },
  );
  assert.equal(toBo.dispatchedAgent, 'bo');
  const noReply = routeReplyToAddressee({ detectedIntent: 'sharp_rebuttal', dispatchedAgent: 'bo' }, { recipient: 'tri' });
  assert.equal(noReply.dispatchedAgent, 'bo');
});

test('with a model available, a threaded reply to Trí gets his own answer instead of a keyword-canned one', () => {
  const canned = { detectedIntent: 'ask_deep_concept', dispatchedAgent: 'tri', isVectorEqualityTopic: true };
  const replyTo = { author: 'Trí', text: 'Vectơ có hướng.' };
  const live = routeReplyToAddressee(canned, { recipient: 'tri', replyTo, useLLM: true });
  assert.equal(live.dispatchedAgent, 'tri');
  assert.equal(live.isVectorEqualityTopic, undefined);
  assert.equal(live.routedToReplyAddressee, true);
  // Offline the canned answer is still the best available text.
  assert.equal(routeReplyToAddressee(canned, { recipient: 'tri', replyTo, useLLM: false }), canned);
  // Not a reply: unchanged.
  assert.equal(routeReplyToAddressee(canned, { recipient: 'tri', useLLM: true }), canned);
});

test('a follow-up that opens by naming the speaker is marked as answering them', async () => {
  assert.equal(opensByNaming('Chuẩn đó Trí! Cứ liên tưởng vé máy bay', 'Trí'), true);
  assert.equal(opensByNaming('Khoan đã Bo ơi! Tớ phải đính chính', 'Bo'), true);
  assert.equal(opensByNaming('Bởi vì hai vectơ ngược hướng', 'Bo'), false);
  assert.equal(opensByNaming('Cô nhắc cả lớp tập trung theo dõi bài giảng nhé, Trí nói rất hay', 'Trí'), false);

  const res = await dispatchMessage({ message: 'vectơ AB bằng BA y như đoạn thẳng mà', currentTime: 109, useLLM: false });
  assert.equal(res.followUpResponse.author, 'Minh Khang');
  assert.deepEqual(res.followUpResponse.repliesTo, { author: 'Trí', avatarId: 'tri' });
});

test('terminal escapes from model output never reach the chat', async () => {
  const chime = await generatePeerChime({
    chimeAgent: 'linhchi',
    primaryResponse: { author: 'Trí', avatarId: 'tri', text: 'x' },
    message: 'y',
    conversationContext: null,
    mathProblem: 'Vectơ',
    lessonTitle: 'Vectơ',
    currentTime: 100,
    useLLM: false,
  });
  assert.doesNotMatch(chime.text, /\u001b/);
});
