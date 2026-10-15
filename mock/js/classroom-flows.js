/* classroom-flows.js — in-class flows, all rendered as messages in the single
   chat: whisper from Na, Khoa's @Bạn question (live-style reaction), raise
   hand → chị Thư answer with citations, end-of-part poll with simultaneous
   reveal and split-side re-vote, 3-step remediation, class end.
   Each flow uses the room `api` (A) defined in classroom.js. */
(function () {
  const App = window.App, D = App.data, P = D.PEOPLE;
  const { h, fmt, wait, icon } = App.util;
  const L = 'ABC';
  const F = App.roomFlows = {};

  /* ---------- Whisper (Nhắn riêng) — never pauses the video ---------- */
  F.whisper = function (A, ev) {
    const S = App.state, R = A.state;
    const m = A.msg({ who: 'na', kind: 'whisper', tag: 'Nhắn riêng', to: 'Bạn', t: ev.t, text: ev.text });
    const c = A.chips([
      { label: 'Hiểu rồi', onClick: () => reply('Hiểu rồi', 'Hay quá! Lát poll cậu chỉ tớ với nhé.') },
      { label: 'Chưa lắm', onClick: () => reply('Chưa lắm', 'Tớ cũng thế. Thử giơ tay hỏi chị Thư xem — chị trả lời đúng đoạn đang xem.', true) },
      { label: 'Để sau', ghost: true, onClick: () => { S.director.skips++; App.refreshDrawer(); reply('Để sau', 'Ok, lúc nào cần thì nhắn tớ nhé.'); } }
    ]);
    m.main.append(c, h('p', { class: 'msg-hint' }, 'Video vẫn chạy — trả lời lúc nào cũng được, bỏ qua cũng không sao.'));
    A.add(m); A.speak('na');
    A.setTile('na', { whisper: true }); A.setWhisperPeek(ev.text);
    R.whisperEl = m;
    async function reply(label, text, offerHand) {
      c.querySelectorAll('button').forEach(b => { b.disabled = true; });
      A.setTile('na', { whisper: false }); A.setWhisperPeek(null);
      m.classList.add('is-done');
      if (label !== 'Để sau') S.director.answers++;
      A.say('me', label, { kind: 'whisper', tag: 'Nhắn riêng', to: 'Na' });
      const r = await A.aiReply('na', text, { kind: 'whisper', tag: 'Nhắn riêng', to: 'Bạn' });
      if (offerHand) r.main.append(A.chips([{ label: 'Giơ tay hỏi chị Thư', onClick: () => F.hand(A) }]));
    }
  };

  /* ---------- Khoa asks @Bạn (end-of-part check of Part 3) ---------- */
  function judge(txt) {
    const t = txt.toLowerCase();
    if (/sai|không đúng|không phải|(^|\D)5(\D|$)|năm|ω|omega|tần số góc/.test(t)) return 'correct';
    if (/đúng|4π|4pi|phải|chuẩn/.test(t)) return 'wrong';
    return 'unclear';
  }
  F.active = function (A, ev) {
    const S = App.state;
    const status = 'Tạm dừng — Khoa đang hỏi bạn';
    ask(A.msg({ who: ev.who, kind: 'task', tag: '@Bạn', t: ev.t, text: ev.text }), [{ label: 'Đúng' }, { label: 'Sai' }]);
    function ask(m, opts) {
      m.main.append(A.chips(opts.map(o => ({ label: o.label, onClick: () => answer(o.label) })).concat([{ label: 'Để sau', ghost: true, onClick: skip }])),
        h('p', { class: 'msg-hint' }, 'Hoặc gõ câu trả lời ở ô bên dưới.'));
      if (!m.isConnected) A.add(m);
      A.speak(ev.who);
      A.openTask(m, { pause: true, status, label: 'Trả lời Khoa', placeholder: 'Trả lời Khoa…', onText: answer });
    }
    async function answer(txt) {
      A.closeTask(); A.say('me', txt); S.director.answers++;
      const v = judge(txt);
      if (v === 'correct') {
        const lead = /ω|omega|tần số góc/i.test(txt) ? 'Ừ ha, 4π đi kèm t nên là ω. ' : 'Ơ, tớ nhầm thật. ';
        await A.aiReply('khoa', lead + 'Vậy biên độ là 5 cm, số đứng trước cos. Cảm ơn cậu đã sửa cho tớ!', { fallback: 'Để tớ nghĩ lại… Có lẽ cậu đúng: biên độ là 5 cm.' });
        A.record(3, 'pass', 2); A.bloomShift(1);
        await A.aiReply('na', 'Chuẩn! Tớ cũng vừa định nói thế.');
        await wait(500);
        A.nextPart();
      } else if (v === 'unclear') {
        const m = await A.aiReply('khoa', 'Tớ chưa hiểu ý cậu lắm. Vậy theo cậu biên độ là bao nhiêu?', { kind: 'task', tag: '@Bạn' });
        ask(m, [{ label: '5 cm' }, { label: '4π' }]);
      } else {
        A.record(3, 'review', null); A.bloomShift(-1);
        await A.aiReply('khoa', 'Đó, tớ biết mà! … Mà khoan, Na vừa bảo 5 mới là biên độ. Mình cùng xem lại cho chắc nhé.');
        F.remediation(A, 3, { onDone: () => A.nextPart() });
      }
    }
    async function skip() {
      A.closeTask(); A.say('me', 'Để sau'); S.director.skips++; App.refreshDrawer();
      await A.aiReply('khoa', 'Ok, để tớ tự xem lại. Cậu cứ học tiếp nhé.');
      A.nextPart();
    }
  };

  /* ---------- Raise hand (Giơ tay) ---------- */
  function afterHand(A) {
    const R = A.state;
    A.clearStatus();
    if (!A.restoreTask() && R.wasPlaying) A.play();
  }
  function lowerHand(A, note) {
    const R = A.state;
    R.hand = false; A.setTile('me', { hand: false });
    if (note) A.sys(note);
    afterHand(A);
  }
  F.lowerHandFromBar = function (A) {
    const R = A.state;
    if (!R.hand) return;
    if (R.task) A.closeTask();
    lowerHand(A, 'Bạn đã hạ tay');
  };
  F.hand = function (A, o) {
    o = o || {};
    const R = A.state, S = App.state;
    if (R.hand || R.replay || R.phase === 'rollcall' || R.ended || R.mode !== 'live') return;
    R.wasPlaying = R.playing;
    if (R.task) A.deferTask();
    R.hand = true; A.setTile('me', { hand: true }); A.pause();
    S.director.asks++; A.bloomShift(-1);
    const t = A.t(), part = A.part(), ans = D.ANSWERS[part.n];
    const s0 = Math.max(part.start, Math.floor(t / 5) * 5 - 10), s1 = Math.min(part.end, s0 + 20);
    const handStatus = 'Tạm dừng — bạn đang giơ tay';
    const opts = { forceDefault: false };
    const ctx = h('div', { class: 'ctx-card' }, h('span', { class: 'ctx-label' }, 'Bạn đang hỏi về'),
      h('span', { class: 'ctx-seg' }, 'Đoạn ', A.tsRange(s0, s1), ' · ' + part.concept));
    const m = A.msg({ who: 'me', kind: 'mine-task', tag: 'Giơ tay', body: ctx });
    m.main.append(h('p', { class: 'msg-hint' }, 'Câu học viên hay hỏi ở đoạn này — chọn một câu hoặc gõ câu của bạn bên dưới. Chị Thư tìm câu trả lời bám đúng video và slide.'),
      A.chips(App.qa.popular(part.n, 3).map(e => ({ label: e.q, onClick: () => send(e.q) })).concat([{ label: 'Hạ tay', ghost: true, onClick: () => { A.closeTask(); lowerHand(A, 'Bạn đã hạ tay'); } }])));
    A.add(m);
    m.scrollIntoView({ block: 'nearest' });
    A.openTask(m, { pause: true, hand: true, status: handStatus, label: 'Hỏi chị Thư về đoạn ' + fmt(s0) + '–' + fmt(s1), placeholder: 'Gõ câu hỏi của bạn…', onText: send });
    if (o.preset) send(o.preset); else A.focusComposer();

    function send(q) {
      A.closeTask();
      const qm = A.say('me', q, { kind: 'mine', tag: 'Giơ tay' });
      qm.scrollIntoView({ block: 'nearest' });
      deliver(q, qm);
    }
    async function deliver(q, qm) {
      if (S.sim.netFail) {
        S.sim.netFail = false; App.refreshDrawer();
        await wait(500);
        const err = h('div', { class: 'msg-error', role: 'alert' }, icon('alert', 'ic--sm'),
          h('span', null, 'Chưa gửi được tới chị Thư — mất kết nối. Câu hỏi của bạn vẫn được giữ.'),
          h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { err.remove(); A.closeTask(); A.setStatus(handStatus); deliver(q, qm); } }, icon('retry', 'ic--sm'), 'Gửi lại'),
          h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => { err.remove(); A.closeTask(); lowerHand(A, 'Bạn đã hạ tay — câu hỏi chưa được gửi'); } }, 'Hạ tay'));
        if (!qm) qm = A.say('me', q, { kind: 'mine', tag: 'Giơ tay' });
        qm.main.append(err);
        A.openTask(qm, { pause: true, hand: true });
        A.setStatus('Lỗi kết nối AI — câu hỏi được giữ', 'error');
        return;
      }
      const off = D.isOffTopic(q);
      // Semantic search over the bank of typical questions (offline mock, see qa-search.js).
      const hits = off ? [] : App.qa.search(q, part.n);
      const best = hits[0];
      if (!off && opts.forceDefault !== true && best && best.score < App.qa.MATCH && best.score >= App.qa.MAYBE) { clarify(q, hits.slice(0, 2)); return; }
      const hit = !off && best && best.score >= App.qa.MATCH ? best : null;
      if (opts.forceDefault === true) opts.forceDefault = false;
      const citeT = hit ? App.qa.cite(hit.entry) : ans.cite;
      const source = hit ? hit.entry.source : ans.source;
      const cite = '[' + fmt(citeT) + ']';
      const text = off
        ? 'Câu này nằm ngoài bài hôm nay — video và slide của thầy Minh chưa nói tới, nên chị không trả lời để tránh nói sai. Phần gần nhất trong bài là “' + part.concept + '”, xem ' + cite + '.'
        : (hit ? App.qa.answer(hit.entry, A.style()) : ans[A.style()]) + ' Xem ' + cite + '.';
      A.setStatus('Tạm dừng — chị Thư đang tìm trong video + slide');
      const r = await A.aiReply('thu', text, { kind: 'task', tag: '@Bạn', fallback: 'Chị cần thêm chút thời gian cho câu này. Trong lúc chờ, bạn xem lại đoạn ' + cite + ' — chỗ thầy giảng đúng ý bạn hỏi.' });
      r.main.append(off
        ? h('div', { class: 'msg-src' }, h('span', { class: 'tag tag--warn' }, 'Ngoài phạm vi video + slide'))
        : h('div', { class: 'msg-src' }, 'Nguồn:', h('span', { class: 'tag' }, icon('video', 'ic--sm'), 'video ' + fmt(citeT)), h('span', { class: 'tag' }, icon('file', 'ic--sm'), source)));
      if (hit && !S.sim.slowAI) r.main.append(h('div', { class: 'msg-match' }, icon('target', 'ic--sm'),
        h('span', null, 'Khớp câu hỏi thường gặp “' + hit.entry.q + '” · độ khớp ' + Math.round(hit.score * 100) + '% · ' + hit.entry.asked + ' học viên từng hỏi')));
      followUps(r, off);
      if (!off && !hit && ans.na && !S.sim.slowAI) { await wait(300); A.aiReply('na', ans.na); }
    }
    // Unsure match: let the learner confirm which question they meant instead of guessing.
    async function clarify(q, top) {
      A.setStatus('Tạm dừng — chị Thư cần bạn xác nhận câu hỏi');
      const r = await A.aiReply('thu', 'Chị chưa chắc ý bạn. Có phải bạn muốn hỏi một trong các câu này?', { kind: 'task', tag: '@Bạn' });
      r.main.append(A.chips(top.map(x => ({ label: x.entry.q, onClick: () => { A.closeTask(); const qm = A.say('me', x.entry.q, { kind: 'mine', tag: 'Giơ tay' }); deliver(x.entry.q, qm); } }))
        .concat([{ label: 'Không — trả lời theo đoạn đang xem', ghost: true, onClick: () => { A.closeTask(); opts.forceDefault = true; deliver(q, null); } }])));
      A.openTask(r, { pause: true, hand: true, status: 'Tạm dừng — chị Thư cần bạn xác nhận câu hỏi', label: 'Hỏi lại chị Thư', placeholder: 'Diễn đạt lại câu hỏi…', onText: (txt) => { A.closeTask(); const q2 = A.say('me', txt, { kind: 'mine', tag: 'Giơ tay' }); deliver(txt, q2); } });
    }
    function followUps(r, off) {
      const understood = { label: 'Hiểu rồi', primary: true, onClick: () => { A.closeTask(); A.say('me', 'Hiểu rồi'); S.director.answers++; lowerHand(A, 'Bạn đã hạ tay · video chạy tiếp'); } };
      const list = off
        ? [understood, { label: 'Hỏi câu khác', onClick: () => { A.closeTask(); const p = A.say('thu', 'Bạn cứ hỏi tiếp về đoạn này nhé.', { kind: 'task', tag: '@Bạn' }); A.openTask(p, { pause: true, hand: true, label: 'Hỏi chị Thư', placeholder: 'Gõ câu hỏi của bạn…', onText: send }); A.focusComposer(); } }]
        : [understood,
          { label: 'Vẫn chưa hiểu', onClick: () => { A.closeTask(); A.say('me', 'Vẫn chưa hiểu'); R.hand = false; A.setTile('me', { hand: false }); F.remediation(A, part.n, { onDone: () => afterHand(A) }); } },
          { label: 'Cho ví dụ khác', onClick: another }];
      r.main.append(A.chips(list));
      A.openTask(r, { pause: true, hand: true, status: 'Tạm dừng — chị Thư đã trả lời bạn', label: 'Hỏi thêm chị Thư', placeholder: 'Hỏi thêm về đoạn này…', onText: (txt) => { A.closeTask(); const q2 = A.say('me', txt, { kind: 'mine', tag: 'Giơ tay' }); deliver(txt, q2); } });
    }
    async function another() {
      A.closeTask(); A.say('me', 'Cho ví dụ khác');
      const r = await A.aiReply('thu', ans.another + ' Xem [' + fmt(ans.cite) + '].', { kind: 'task', tag: '@Bạn' });
      followUps(r, false);
    }
  };

  /* ---------- End-of-part poll & split-side re-vote ---------- */
  function renderResult(target, q, poll, votes, showCorrect, note) {
    target.innerHTML = '';
    const names = { me: 'Bạn', na: 'Na', khoa: 'Khoa' };
    const res = h('div', { class: 'poll-res' }, h('div', { class: 'poll-q' }, q));
    poll.options.forEach((o, i) => {
      const who = ['me', 'na', 'khoa'].filter(k => votes[k] === i);
      const pct = Math.round(who.length / 3 * 100);
      const correct = showCorrect && i === poll.correct;
      const mine = votes.me === i;
      res.append(h('div', { class: 'pres' + (correct ? ' is-correct' : '') + (mine ? ' is-mine' : '') },
        h('div', { class: 'pres-top' }, h('span', { class: 'poll-letter' }, L[i]), h('span', { class: 'od-fill' }, o),
          correct ? h('span', { class: 'tag tag--ok' }, icon('check', 'ic--sm'), 'Đáp án đúng') : null,
          showCorrect && mine && i !== poll.correct ? h('span', { class: 'tag tag--danger' }, 'Chưa đúng') : null,
          h('b', { class: 'mono' }, pct + '%')),
        h('div', { class: 'pres-bar' }, h('span', { style: 'width:' + pct + '%' })),
        h('div', { class: 'pres-who' }, who.length ? who.map(k => names[k]).join(', ') + (mine ? ' · lựa chọn của bạn' : '') : 'Chưa ai chọn')));
    });
    res.append(h('div', { class: 'poll-peers' }, note || '3 phiếu · công bố sau khi bạn chọn'));
    if (showCorrect) res.append(h('div', { class: 'poll-explain' }, poll.explain));
    target.append(res);
  }
  F.poll = function (A, ev) {
    const S = App.state, R = A.state;
    const useAlt = !!(ev.alt && S.director.bloom >= ev.alt.minBloom);
    const q = useAlt ? ev.alt.text : ev.text;
    const poll = useAlt ? ev.alt.poll : ev.poll;
    const part = D.partByN(ev.part);
    let choice = null;
    const card = h('div', { class: 'poll' });
    const m = A.msg({ who: 'thu', kind: 'task', tag: '@Cả lớp', t: ev.t, body: card, step: 'Kiểm tra nhanh · hết Part ' + part.n });
    renderChoosing();
    A.add(m); A.speak('thu');
    A.openTask(m, { pause: true, status: 'Hết Part ' + part.n + ' · Kiểm tra nhanh' });

    function renderChoosing() {
      card.innerHTML = '';
      const send = h('button', { class: 'btn btn--primary btn--sm', type: 'button', disabled: true, onclick: submit }, 'Gửi');
      const fs = h('fieldset', { class: 'poll-fs' }, h('legend', { class: 'poll-q' }, q),
        poll.options.map((o, i) => {
          const id = 'pl-' + ev.id + '-' + i;
          return h('label', { class: 'poll-opt', for: id },
            h('input', { type: 'radio', name: 'pl-' + ev.id, id, onchange: () => { choice = i; send.disabled = false; } }),
            h('span', { class: 'poll-letter' }, L[i]), h('span', null, o));
        }));
      card.append(fs, h('div', { class: 'poll-foot' }, h('span', { class: 'poll-peers' }, 'Na đang chọn… · Khoa đang chọn…'),
        h('div', { class: 'od-row' }, h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: skip }, 'Bỏ qua'), send)));
    }
    async function submit() {
      card.querySelectorAll('input, button').forEach(x => { x.disabled = true; });
      card.querySelector('.poll-peers').textContent = 'Đã gửi. Đang chờ Na và Khoa chọn…';
      S.director.answers++;
      await wait(1300);
      const split = poll.na !== poll.khoa;
      renderResult(card, q, poll, { me: choice, na: poll.na, khoa: poll.khoa }, !split);
      if (!split) { card.append(A.chips([{ label: 'Tiếp tục', primary: true, onClick: () => outcome(choice === poll.correct) }])); return; }
      A.setStatus('Lớp chia phe');
      await wait(400);
      await A.aiReply('na', poll.args.na);
      await A.aiReply('khoa', poll.args.khoa);
      sidePick();
    }
    function sidePick() {
      A.closeTask();
      let side = null;
      const rid = 'reason-' + ev.id;
      const reason = h('input', { class: 'input', id: rid, maxlength: 140, placeholder: 'Một câu lý do…', oninput: () => upd() });
      const vote = h('button', { class: 'btn btn--primary btn--sm', type: 'button', disabled: true, onclick: () => revote() }, 'Bỏ phiếu lại');
      const sideBtns = ['na', 'khoa'].map(k => h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: (e) => {
        side = k;
        sideBtns.forEach(b => { b.classList.remove('is-chosen'); b.setAttribute('aria-pressed', 'false'); });
        e.currentTarget.classList.add('is-chosen'); e.currentTarget.setAttribute('aria-pressed', 'true'); upd();
      } }, 'Phe ' + P[k].name + ' · ' + L[poll[k]]));
      function upd() { vote.disabled = !(side && reason.value.trim()); }
      reason.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !vote.disabled) { e.preventDefault(); revote(); } });
      const box = h('div', { class: 'side-pick' },
        h('div', { class: 'od-row', role: 'group', 'aria-label': 'Chọn phe' }, sideBtns),
        h('label', { class: 'field-label small', for: rid }, 'Lý do của bạn (1 câu)'),
        h('div', { class: 'msg-chips', style: 'margin-top:0' }, poll.reasons.map(r => h('button', { class: 'chip chip--ghost', type: 'button', onclick: () => { reason.value = r; upd(); } }, r))),
        reason, h('div', { class: 'od-row', style: 'justify-content:flex-end' }, vote));
      const argList = h('ul', { class: 'side-args' }, ['na', 'khoa'].map(k => h('li', null, h('strong', null, P[k].name + ' (' + L[poll[k]] + '): '), poll.args[k])));
      const m2 = A.msg({ who: 'thu', kind: 'task', tag: '@Bạn', step: 'Lớp chia phe', body: h('div', null, h('p', null, 'Na và Khoa chọn khác nhau. Bạn đứng về phe nào? Chọn phe, nói một câu lý do, rồi cả lớp bỏ phiếu lại.'), argList, box) });
      A.add(m2); A.speak('thu');
      A.openTask(m2, { pause: true, status: 'Lớp chia phe · chọn phe của bạn' });
      async function revote() {
        if (!side || !reason.value.trim()) return;
        const final = poll[side], why = reason.value.trim();
        A.closeTask();
        A.say('me', 'Phe ' + P[side].name + ': ' + why);
        S.director.answers++;
        await wait(500);
        const card2 = h('div', { class: 'poll' });
        renderResult(card2, q, poll, { me: final, na: poll.na, khoa: poll.khoa }, true, 'Kết quả bỏ phiếu lại · 3 phiếu');
        const m3 = A.msg({ who: 'thu', kind: 'task', tag: '@Bạn', step: 'Công bố sau khi bỏ phiếu lại', body: card2 });
        A.add(m3); A.openTask(m3, { pause: true, status: 'Công bố kết quả bỏ phiếu lại' });
        const sideOk = final === poll.correct;
        const reply = sideOk ? (poll.concede.who === 'na' ? 'Na' : 'Khoa') + ': “Cậu nói “' + why + '” — ' + poll.concede.text + '”'
          : (poll.na === poll.correct ? 'Na' : 'Khoa') + ': “Tớ hiểu lý do “' + why + '” của cậu, nhưng ' + poll.explain.charAt(0).toLowerCase() + poll.explain.slice(1) + '”';
        card2.append(h('p', { class: 'poll-explain' }, reply), A.chips([{ label: 'Tiếp tục', primary: true, onClick: () => outcome(sideOk) }]));
      }
    }
    async function outcome(ok) {
      if (R.task) A.closeTask();
      if (ok) {
        A.record(part.n, 'pass', poll.bloom); A.bloomShift(1);
        await A.aiReply(poll.praise.who, poll.praise.text);
        await wait(600);
        A.nextPart();
      } else {
        A.record(part.n, 'review', null); A.bloomShift(-1);
        await A.aiReply('thu', 'Chưa đúng — đáp án là ' + L[poll.correct] + '. Không sao, mình cùng xem lại cho chắc nhé.');
        F.remediation(A, part.n, { onDone: () => A.nextPart() });
      }
    }
    async function skip() {
      card.querySelector('.poll-peers').textContent = 'Bạn đã bỏ qua câu này';
      A.closeTask(); A.say('me', 'Bỏ qua câu này'); S.director.skips++; App.refreshDrawer();
      await A.aiReply('na', 'Không sao, cuối buổi cậu xem lại trong tổng kết nhé.');
      A.nextPart();
    }
  };

  /* ---------- Remediation (Bù hiểu): replay → Na explains → Khoa is wrong → recheck ---------- */
  F.remediation = function (A, n, o) {
    o = o || {};
    const S = App.state, R = A.state, rm = D.REMED[n], part = D.partByN(n);
    R.remediated[n] = true;
    const status = 'Bù hiểu · ' + part.concept;
    let attempts = 0;
    const finish = (st) => { A.record(n, st, st === 'pass' ? 1 : null); A.clearStatus(); if (o.onDone) o.onDone(); };
    const later = {
      label: 'Để sau', ghost: true, onClick: async () => {
        A.closeTask(); A.say('me', 'Để sau'); S.director.skips++; App.refreshDrawer();
        await A.aiReply('thu', 'Được, chị ghi “' + part.concept + '” vào mục Cần xem lại để bạn ôn sau nhé.');
        finish('review');
      }
    };
    const understood = () => ({ label: 'Hiểu rồi', primary: true, onClick: () => { A.closeTask(); A.say('me', 'Hiểu rồi'); recheck(); } });
    step1();

    function step1() {
      const m = A.msg({ who: 'thu', kind: 'task', tag: '@Bạn', step: 'Bù hiểu · bước 1/3 · xem lại có dẫn dắt',
        text: 'Mình xem lại [' + fmt(rm.replay[0]) + '–' + fmt(rm.replay[1]) + '] nhé, ' + rm.focusLabel + '.' });
      const c = A.chips([{ label: 'Xem lại đoạn này', primary: true, onClick: watch }, { label: 'Vẫn chưa hiểu', onClick: toStep2 }, later]);
      m.main.append(c); A.add(m); A.speak('thu');
      A.openTask(m, { pause: true, status });
      async function watch() {
        c.querySelectorAll('button').forEach(b => { b.disabled = true; });
        await A.startReplay(rm.replay[0], rm.replay[1], rm.focus, rm.focusLabel);
        A.setStatus(status);
        m.main.append(h('p', { class: 'msg-hint' }, 'Đã xem lại xong. Bạn thấy sao?'),
          A.chips([understood(), { label: 'Vẫn chưa hiểu', onClick: toStep2 }, later]));
        m.scrollIntoView({ block: 'nearest' });
      }
      function toStep2() { A.closeTask(); A.say('me', 'Vẫn chưa hiểu'); step2(); }
    }
    async function step2() {
      const m = await A.aiReply('na', rm.na[A.style()], { kind: 'task', tag: '@Bạn', step: 'Bù hiểu · bước 2/3 · Na giải thích cách khác' });
      m.main.append(A.chips([understood(), { label: 'Vẫn chưa hiểu', onClick: () => { A.closeTask(); A.say('me', 'Vẫn chưa hiểu'); step3(); } }, later]));
      A.openTask(m, { pause: true, status });
    }
    async function step3(holdText) {
      const k = rm.khoa;
      const text = holdText || (k.claim + ' Cậu chỉ giúp tớ sai ở đâu được không?');
      const m = await A.aiReply('khoa', text, { kind: 'task', tag: '@Bạn', step: 'Bù hiểu · bước 3/3 · sửa lỗi cho Khoa' });
      const opts = k.causes.map(c => ({ label: c.text, onClick: () => tryCause(c.text, c.ok) }));
      if (attempts >= 2) opts.push({ label: 'Chị Thư giải thích giúp', ghost: true, onClick: explainByThu });
      m.main.append(A.chips(opts.concat([later])), h('p', { class: 'msg-hint' }, 'Chọn một ý hoặc gõ lời sửa của bạn. Khoa giữ ý mình cho tới khi bạn chỉ đúng nguyên nhân.'));
      A.openTask(m, { pause: true, status, label: 'Sửa cho Khoa', placeholder: 'Khoa sai ở đâu?', onText: (txt) => tryCause(txt, k.keywords.some(w => txt.toLowerCase().indexOf(w) >= 0)) });
    }
    async function tryCause(txt, ok) {
      A.closeTask(); A.say('me', txt); S.director.answers++;
      const k = rm.khoa;
      if (ok) { await A.aiReply('khoa', k.concede); recheck(); return; }
      attempts++;
      if (attempts === 2) await A.aiReply('thu', 'Gợi ý: ' + k.hint);
      step3(k.hold[(attempts - 1) % k.hold.length]);
    }
    async function explainByThu() {
      A.closeTask(); A.say('me', 'Chị Thư giải thích giúp');
      await A.aiReply('thu', rm.khoa.explain);
      recheck();
    }
    function recheck() {
      const rc = rm.recheck, stamp = Date.now().toString(36);
      let choice = null;
      const card = h('div', { class: 'poll' });
      const send = h('button', { class: 'btn btn--primary btn--sm', type: 'button', disabled: true, onclick: () => submit() }, 'Gửi');
      card.append(h('fieldset', { class: 'poll-fs' }, h('legend', { class: 'poll-q' }, rc.q),
        rc.options.map((o, i) => {
          const id = 'rc-' + stamp + '-' + i;
          return h('label', { class: 'poll-opt', for: id },
            h('input', { type: 'radio', name: 'rc-' + stamp, id, onchange: () => { choice = i; send.disabled = false; } }),
            h('span', { class: 'poll-letter' }, L[i]), h('span', null, o));
        })),
        h('div', { class: 'poll-foot' }, h('span', { class: 'poll-peers' }, 'Câu khác, cùng mục tiêu: ' + part.goal.toLowerCase()), send));
      const m = A.msg({ who: 'thu', kind: 'task', tag: '@Bạn', step: 'Kiểm tra lại', body: card });
      A.add(m); A.speak('thu');
      A.openTask(m, { pause: true, status });
      function submit() {
        const ok = choice === rc.correct;
        card.querySelectorAll('input, button').forEach(x => { x.disabled = true; });
        card.append(h('div', { class: 'poll-explain' }, (ok ? 'Đúng. ' : 'Chưa đúng — đáp án là ' + L[rc.correct] + '. ') + rc.explain),
          A.chips([{ label: 'Tiếp tục', primary: true, onClick: () => after(ok) }]));
      }
      async function after(ok) {
        A.closeTask();
        if (ok) {
          A.bloomShift(1);
          await A.aiReply('thu', 'Chuẩn rồi! Mình học tiếp nhé.');
          finish('pass');
        } else {
          await A.aiReply('thu', 'Không sao. Chị ghi “' + part.concept + '” vào mục Cần xem lại, kèm đoạn [' + fmt(rm.replay[0]) + '–' + fmt(rm.replay[1]) + '] để bạn ôn sau. Mình học tiếp nhé.');
          finish('review');
        }
      }
    }
  };

  /* ---------- Many "Khó hiểu" in one part → offer remediation ---------- */
  F.confusedOffer = function (A) {
    const R = A.state, n = A.part().n;
    R.remediated[n] = true;
    R.wasPlaying = R.playing;
    const m = A.msg({ who: 'thu', kind: 'task', tag: '@Bạn', text: 'Chị thấy bạn bấm “Khó hiểu” mấy lần ở part này. Mình xem lại đoạn khó có dẫn dắt nhé?' });
    m.main.append(A.chips([
      { label: 'Xem lại cùng chị', primary: true, onClick: () => { A.closeTask(); A.say('me', 'Xem lại cùng chị'); F.remediation(A, n, { onDone: () => A.resume() }); } },
      { label: 'Để sau', ghost: true, onClick: () => { A.closeTask(); A.say('me', 'Để sau'); App.state.director.skips++; App.refreshDrawer(); A.resume(); } }]));
    A.add(m); A.speak('thu');
    A.openTask(m, { pause: true, status: 'Tạm dừng — chị Thư gợi ý xem lại' });
  };

  /* ---------- Class end (Tan lớp) ---------- */
  F.endClass = async function (A) {
    const R = A.state;
    if (R.ended) return;
    R.ended = true; A.pause(); A.clearStatus();
    A.sys('Hết bài giảng — tan lớp');
    await A.aiReply('na', 'Hôm nay vui ghê, cảm ơn ' + A.name() + ' đã học cùng tớ. Tạm biệt nhé!');
    A.leaveTile('na');
    await A.aiReply('khoa', 'Cảm ơn cậu đã kiểm tra lại tớ. Hẹn buổi sau!');
    A.leaveTile('khoa');
    const m = await A.aiReply('thu', 'Cảm ơn ' + A.name() + '. Chị đã tổng hợp những gì bạn đã hiểu và các đoạn nên xem lại.', { kind: 'task', tag: '@Bạn' });
    m.main.append(A.chips([{ label: 'Xem tổng kết', primary: true, onClick: () => App.go('hv/summary') }]));
    A.openTask(m, { pause: true, status: 'Tan lớp' });
  };
})();
