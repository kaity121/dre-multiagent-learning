/* classroom.js — learner classroom (Phòng học): fixed video stage, Zoom-style
   right panel (participants · single chat · transcript · "Gửi tới" composer),
   fixed bottom bar, simulated video clock and the script engine that fires
   passive comments / whisper / @Bạn question / poll. Flows live in
   classroom-flows.js and talk to the room through the `api` object. */
(function () {
  const App = window.App, D = App.data, P = D.PEOPLE;
  const { h, fmt, wait, icon, avatar, initialOf } = App.util;
  const F = () => App.roomFlows;
  let DUR = D.LESSON.duration;

  // Chat layout (dock mode, docked width, floating position/size) survives a page reload.
  const CHAT_KEY = 'lv-chat-layout-v1';
  function loadChatLayout() {
    try {
      const v = JSON.parse(localStorage.getItem(CHAT_KEY) || 'null');
      if (!v) return {};
      const o = {};
      if (['docked', 'floating', 'hidden'].indexOf(v.chatMode) >= 0) o.chatMode = v.chatMode;
      if (v.chatW > 0) o.chatW = v.chatW;
      if (v.float && v.float.w > 0 && v.float.h > 0) o.float = { x: +v.float.x || 0, y: +v.float.y || 0, w: +v.float.w, h: +v.float.h };
      return o;
    } catch (e) { return {}; }
  }
  function saveChatLayout(R) {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify({ chatMode: R.chatMode, chatW: R.chatW, float: R.float })); } catch (e) { /* storage blocked: session-only */ }
  }

  App.screens.room = function (root) {
    const S = App.state;
    const jump = App.takeJump();
    if (!S.learner.name) S.learner.name = 'Minh Anh';
    let R;
    if (jump && jump.state === 'review') R = createRoom('review', jump);
    else if (!jump && S.session && !S.session.ended) R = S.session;
    else { R = createRoom('live', jump); S.session = R; }
    root.append(R.el);
    R.api.start();
    return () => R.api.suspend();
  };

  function createRoom(mode, jump) {
    const S = App.state;
    const R = {
      mode, jump, t: 0, playing: false, phase: 'rollcall', fired: new Set(), task: null, waiting: [], held: [], replyQueue: [], lastPassiveT: -99,
      hand: false, wasPlaying: false, replay: null, confused: {}, remediated: {}, ended: false, started: false, suspended: false,
      timer: null, newCount: 0, present: 0, statusText: '', statusKind: '', composer: null, moodIdx: -1, whisperEl: null, part: 1, transcriptIdx: -1,
      rate: 1, chatMode: 'docked', chatW: 460, float: null, unread: 0
    };
    Object.assign(R, loadChatLayout());
    if (mode === 'live') S.results = { concepts: { 1: { status: 'unchecked', bloom: null }, 2: { status: 'unchecked', bloom: null }, 3: { status: 'unchecked', bloom: null }, 4: { status: 'unchecked', bloom: null } } };

    /* ---------- Title bar ---------- */
    const partNo = h('span', { class: 'rt-partno' });
    const goal = h('span', { class: 'rt-goal' });
    const status = h('span', { class: 'rt-status', role: 'status' });
    const leaveBtn = h('button', { class: 'btn btn--sm btn--on-dark', onclick: onLeave }, mode === 'review' ? 'Về tổng kết' : 'Rời lớp');
    const title = h('header', { class: 'room-title' }, h('div', { class: 'rt-left' }, partNo, goal), status);

    /* ---------- Video stage: unified player (sim / file / YouTube), inline controls, task overlay ---------- */
    let media = App.player.create(S.videoSource);
    const isReal = () => media.kind !== 'sim';
    if (!isReal() && App.timeline.isFitted()) App.timeline.reset();
    DUR = D.LESSON.duration;
    const mediaBox = h('div', { class: 'vp-media' }, media.el);
    // Transparent shield: clicks toggle play and the YouTube UI never takes over.
    const shield = h('div', { class: 'vp-shield', 'aria-hidden': 'true', onclick: () => togglePlay() });
    const ovCard = h('div', { class: 'vo-card', role: 'dialog', 'aria-label': 'Câu hỏi trong giờ học' });
    const ovInput = h('div', { class: 'vo-input', hidden: true });
    const ovBar = h('div', { class: 'vo-bar' }, h('span', { class: 'od-fill' }, 'Câu hỏi đang chờ bạn trả lời'),
      h('button', { class: 'btn btn--sm btn--on-dark', onclick: () => collapseTask() }, icon('chat', 'ic--sm'), 'Thu xuống chat · xem video'));
    const overlay = h('div', { class: 'vo', hidden: true }, h('div', { class: 'vo-inner' }, ovBar, ovCard, ovInput));
    // Shown while a question is folded into the chat so the learner can rewatch first.
    const pill = h('div', { class: 'vo-pill', hidden: true, role: 'status' }, icon('clock', 'ic--sm'), h('span', { class: 'od-fill' }, 'Câu hỏi đang chờ'),
      h('button', { class: 'btn btn--sm', onclick: () => { if (canSeek()) userSeek(Math.max(0, R.t - 30)); play(); } }, icon('back10', 'ic--sm'), 'Lùi 30 giây'),
      h('button', { class: 'btn btn--sm btn--primary', onclick: () => expandTask() }, 'Mở lại câu hỏi'));
    const frame = h('div', { class: 'video-frame' }, mediaBox, shield, overlay, pill);
    const stage = h('section', { class: 'room-stage', 'aria-label': 'Video bài giảng' }, frame);
    function watchMedia() {
      if (!isReal()) return;
      const m = media;
      m.ready.then(() => { if (m !== media) return; refit(media.duration()); media.setRate(R.rate); media.seek(R.t); if (R.playing) media.play(); renderMute(); })
        .catch(err => fallbackToSim(err && err.message ? err.message : 'lỗi không xác định'));
    }
    function fallbackToSim(reason) {
      if (!isReal()) return;
      media = App.player.sim();
      mediaBox.innerHTML = ''; mediaBox.append(media.el);
      if (App.timeline.isFitted()) { const k = App.timeline.baseDuration() / D.LESSON.duration; App.timeline.reset(); R.t = R.t * k; relayout(); }
      App.toast('Không phát được video (' + reason + '). Lớp chuyển sang video mô phỏng.');
      renderVideo(); renderMute(); updateControls();
    }
    function moveTo(t) { R.t = t; if (isReal()) media.seek(t); }
    // Fit the whole lesson timeline to the real video length (YouTube / file).
    function refit(d) {
      if (!(d > 30) || Math.abs(d - D.LESSON.duration) < 1) return;
      const k = d / D.LESSON.duration;
      App.timeline.fit(d);
      R.t = Math.min(R.t * k, d);
      relayout();
      App.toast('Kịch bản đã căn theo độ dài video: ' + fmt(d) + '.');
    }
    function relayout() {
      DUR = D.LESSON.duration;
      segs.forEach(s => { s.el.style.flex = String(s.p.end - s.p.start); });
      markEls.forEach(mk => { mk.el.style.left = (mk.ev.t / DUR * 100) + '%'; });
      tl.setAttribute('aria-valuemax', String(DUR));
      transcript.querySelectorAll('.tline').forEach(b => { const l = D.TRANSCRIPT[+b.dataset.i]; if (l && b.firstChild) b.firstChild.textContent = fmt(l.t); });
      renderVideo();
    }
    function collapseTask() {
      const tk = R.task; if (!tk) return;
      tk.collapsed = true; tk.returnT = R.t; tk.foldedStatus = R.statusText;
      hideOverlay(tk);
      tk.m.classList.add('is-open');
      pill.hidden = false;
      setStatus('Đang xem video · câu hỏi vẫn chờ bạn trả lời');
      tk.m.scrollIntoView({ block: 'nearest' });
    }
    function expandTask() {
      const tk = R.task; pill.hidden = true;
      if (!tk) return;
      R.playing = false;
      if (tk.returnT != null && Math.abs(R.t - tk.returnT) > 0.5) moveTo(tk.returnT);
      setStatus(tk.foldedStatus || '');
      showOverlay(tk);
      renderVideo();
    }

    /* ---------- Participants ---------- */
    const tiles = {};
    const countEl = h('b', null, '0');
    const row = h('div', { class: 'people-row' });
    ['na', 'khoa', 'thu', 'me'].forEach(id => { tiles[id] = makeTile(id); row.append(tiles[id].el); });
    const peek = h('button', { class: 'whisper-peek', hidden: true, onclick: () => openWhisper() });
    const people = h('div', { class: 'people' },
      h('div', { class: 'people-head' }, icon('users', 'ic--sm'), h('span', null, 'Người tham gia ', countEl), h('span', null, '· Na, Khoa, chị Thư là AI')),
      row, peek);

    function makeTile(id) {
      const name = id === 'me' ? S.learner.name : P[id].name;
      const av = h('span', { class: 'av av--' + id, 'aria-hidden': 'true' }, id === 'me' ? initialOf(name) : P[id].initial);
      const mood = h('span', { class: 'tile-mood', hidden: true });
      const hand = h('span', { class: 'tile-hand', hidden: true }, icon('hand'));
      const badge = h('span', { class: 'tile-badge', hidden: true }, '1');
      const state = h('span', { class: 'tile-state od-truncate' }, 'chưa vào');
      const el = h('button', { class: 'tile is-absent', type: 'button', onclick: () => onTile(id) },
        h('span', { class: 'tile-av' }, av, mood, hand, badge), h('span', { class: 'tile-name od-truncate', title: name }, name), state);
      const t = { el, av, mood, hand, badge, state, flags: { speaking: false, typing: false, hand: false, whisper: false }, moodKey: null, present: false };
      return t;
    }
    function renderTile(id) {
      const t = tiles[id], f = t.flags;
      t.el.classList.toggle('is-absent', !t.present && !t.left);
      t.el.classList.toggle('is-left', !!t.left);
      t.el.classList.toggle('is-speaking', f.speaking);
      t.el.classList.toggle('is-typing', f.typing);
      t.hand.hidden = !f.hand;
      t.badge.hidden = !f.whisper;
      t.mood.hidden = !t.moodKey || !t.present || !!t.left;
      if (t.moodKey) { t.mood.innerHTML = ''; t.mood.append(icon(t.moodKey)); }
      const label = t.left ? 'đã rời lớp' : !t.present ? 'chưa vào' : f.hand ? 'đang giơ tay' : f.typing ? 'đang gõ…' : f.speaking ? 'đang nói' : f.whisper ? 'nhắn riêng bạn' : t.moodKey ? D.MOOD_LABEL[t.moodKey] : id === 'me' ? 'đang học' : 'đang nghe';
      t.state.textContent = id === 'me' ? 'bạn · ' + label : label;
      const who = id === 'me' ? S.learner.name + ' (bạn)' : P[id].name + ', ' + P[id].role;
      t.el.setAttribute('aria-label', who + ' — ' + label);
    }
    function setTile(id, patch) { Object.assign(tiles[id].flags, patch); renderTile(id); }
    function setMood(id, key) { tiles[id].moodKey = key; renderTile(id); }
    function present(id) { tiles[id].present = true; R.present++; countEl.textContent = String(R.present); renderTile(id); updateTitle(); }
    function leaveTile(id) { tiles[id].left = true; R.present--; countEl.textContent = String(R.present); renderTile(id); }
    const speakTimers = {};
    function speak(id) {
      setTile(id, { speaking: true });
      clearTimeout(speakTimers[id]);
      speakTimers[id] = setTimeout(() => setTile(id, { speaking: false }), 2500);
    }
    function onTile(id) {
      if (id === 'na' && tiles.na.flags.whisper) { openWhisper(); return; }
      if (id === 'me') return;
      toSel.value = id; updateComposer(); ta.focus();
    }
    function openWhisper() {
      if (!R.whisperEl) return;
      showTab('chat');
      R.whisperEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const b = R.whisperEl.querySelector('.msg-chips button:not(:disabled)');
      if (b) b.focus({ preventScroll: true });
    }

    /* ---------- Tabs: Lớp học · Transcript ---------- */
    const tabChat = h('button', { class: 'tab', role: 'tab', id: 'tab-chat', 'aria-selected': 'true', 'aria-controls': 'pane-chat', onclick: () => showTab('chat') }, 'Lớp học');
    const tabDot = h('span', { class: 'tab-dot', hidden: true, 'aria-label': 'có tin mới' });
    tabChat.append(tabDot);
    const tabTr = h('button', { class: 'tab', role: 'tab', id: 'tab-tr', 'aria-selected': 'false', 'aria-controls': 'pane-tr', tabindex: '-1', onclick: () => showTab('tr') }, 'Transcript');
    const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Nội dung panel' }, tabChat, tabTr);
    tabs.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const toTr = document.activeElement === tabChat; showTab(toTr ? 'tr' : 'chat'); (toTr ? tabTr : tabChat).focus(); } });
    const chat = h('div', { class: 'chat', id: 'pane-chat', role: 'log', 'aria-live': 'polite', 'aria-label': 'Chat lớp học', tabindex: '0' });
    const transcript = h('div', { class: 'transcript', id: 'pane-tr', role: 'tabpanel', 'aria-labelledby': 'tab-tr', hidden: true });
    const newPill = h('button', { class: 'newpill', hidden: true, onclick: () => { chat.scrollTop = chat.scrollHeight; } });
    function showTab(which) {
      const isChat = which === 'chat';
      chat.hidden = !isChat; transcript.hidden = isChat;
      tabChat.setAttribute('aria-selected', String(isChat)); tabTr.setAttribute('aria-selected', String(!isChat));
      tabChat.tabIndex = isChat ? 0 : -1; tabTr.tabIndex = isChat ? -1 : 0;
      if (isChat) { tabDot.hidden = true; updatePill(); } else { newPill.hidden = true; scrollTranscript(); }
    }
    let lastPart = 0;
    D.TRANSCRIPT.forEach((l, i) => {
      const p = D.partAt(l.t);
      if (p.n !== lastPart) { transcript.append(h('div', { class: 'tline-part' }, 'Part ' + p.n + ' · ' + p.title)); lastPart = p.n; }
      transcript.append(h('button', { class: 'tline', 'data-i': i, onclick: () => userSeek(l.t) }, h('span', { class: 'mono' }, fmt(l.t)), h('span', null, l.text)));
    });
    function scrollTranscript() {
      const cur = transcript.querySelector('.tline.is-current');
      if (cur && !transcript.hidden) cur.scrollIntoView({ block: 'nearest' });
    }
    function updateTranscript() {
      let idx = -1;
      for (let i = 0; i < D.TRANSCRIPT.length; i++) if (D.TRANSCRIPT[i].t <= R.t) idx = i;
      if (idx === R.transcriptIdx) return;
      R.transcriptIdx = idx;
      transcript.querySelectorAll('.tline').forEach(b => b.classList.toggle('is-current', +b.dataset.i === idx));
      scrollTranscript();
    }

    /* ---------- Chat primitives ---------- */
    const atBottom = () => chat.scrollHeight - chat.scrollTop - chat.clientHeight < 48;
    chat.addEventListener('scroll', () => { if (atBottom()) { R.newCount = 0; newPill.hidden = true; } });
    function updatePill() {
      if (R.newCount > 0 && !atBottom() && !chat.hidden) {
        newPill.innerHTML = ''; newPill.append(R.newCount + ' tin mới', icon('down', 'ic--sm')); newPill.hidden = false;
      } else newPill.hidden = true;
    }
    function add(node, into) {
      if (into) {
        const stickIn = atBottom();
        groupWithPrev(node, into); into.append(node);
        if (stickIn && !into.hidden) chat.scrollTop = chat.scrollHeight;
        return node;
      }
      groupWithPrev(node, chat);
      const stick = atBottom();
      chat.append(node);
      if (stick) chat.scrollTop = chat.scrollHeight;
      else R.newCount++;
      if (chat.hidden) tabDot.hidden = false;
      if (R.chatMode === 'hidden') { R.unread++; renderBadge(); }
      updatePill();
      return node;
    }
    // Zoom / Skype style: consecutive plain messages from the same sender stack under one
    // name + avatar instead of repeating the header on every bubble.
    const CARD = /\bmsg--(task|whisper|mine-task)\b/;
    function groupWithPrev(node, box) {
      if (!node.classList || !node.classList.contains('msg') || CARD.test(node.className)) return;
      let prev = box.lastElementChild;
      while (prev && prev.classList.contains('typing')) prev = prev.previousElementSibling;
      if (prev && prev.classList.contains('msg') && !CARD.test(prev.className) && prev.dataset.who === node.dataset.who) { node.classList.add('is-cont'); prev.classList.add('has-next'); }
    }
    function rich(str) {
      // [mm:ss] or [mm:ss–mm:ss] inside text become clickable seek links
      const out = [];
      const re = /\[(\d\d:\d\d)(?:–(\d\d:\d\d))?\]/g;
      let last = 0, m;
      while ((m = re.exec(str))) {
        if (m.index > last) out.push(str.slice(last, m.index));
        const s = App.util.parseTime(m[1]), e = m[2] ? App.util.parseTime(m[2]) : null;
        out.push(e != null ? tsRange(s, e) : tsBtn(s));
        last = re.lastIndex;
      }
      if (last < str.length) out.push(str.slice(last));
      return out;
    }
    // Loom-style video timestamp chip: play glyph + time, click to seek.
    function tsBtn(t) { return h('button', { class: 'ts', type: 'button', 'aria-label': 'Tua video tới ' + fmt(t), title: 'Tua video tới ' + fmt(t), onclick: () => userSeek(t) }, icon('play', 'ts-ic'), fmt(t)); }
    function tsRange(s, e) {
      return h('button', { class: 'ts', type: 'button', 'aria-label': 'Xem lại ' + fmt(s) + ' đến ' + fmt(e), title: 'Xem lại đoạn này', onclick: () => (R.mode === 'review' ? startReplay(s, e, null, 'ôn lại') : userSeek(s)) }, icon('replay', 'ts-ic'), fmt(s) + '–' + fmt(e));
    }
    function msg(o) {
      const who = o.who;
      const name = who === 'me' ? 'Bạn' : P[who].name;
      const m = h('article', { class: 'msg msg--' + (o.kind || 'normal'), 'data-who': who });
      const tagCls = o.tag === 'Nhắn riêng' ? ' msg-tag--dm' : o.tag === 'Giơ tay' ? ' msg-tag--hand' : '';
      const head = h('div', { class: 'msg-head' }, h('span', { class: 'msg-who' }, name),
        o.to ? h('span', { class: 'msg-to' }, '→ ' + o.to) : null,
        o.tag ? h('span', { class: 'msg-tag' + tagCls }, o.tag === 'Giơ tay' ? [icon('hand', 'ic--sm'), ' Giơ tay'] : o.tag) : null,
        o.t != null ? tsBtn(o.t) : null);
      const mention = o.ping ? [h('span', { class: 'mention' + (o.ping === 'me' ? ' mention--me' : '') }, '@' + (o.ping === 'me' ? 'Bạn' : P[o.ping].name)), ' '] : null;
      const body = h('div', { class: 'msg-body' }, mention, o.body || rich(o.text || ''));
      const quote = o.quote ? h('div', { class: 'msg-quote' }, icon('reply', 'ic--sm'),
        h('span', { class: 'msg-quote-who' }, o.quote.who === 'me' ? 'Bạn' : P[o.quote.who].name),
        h('span', { class: 'msg-quote-text' }, o.quote.text)) : null;
      const main = h('div', { class: 'msg-main' }, o.step ? h('div', { class: 'msg-step' }, o.step) : null, head, quote, body);
      m.append(avatar(who, o.inThread ? 'xs' : 'sm'), main);
      m.main = main; m.body = body;
      m.classList.add('is-enter');
      main.addEventListener('animationend', (e) => { if (e.target === main) m.classList.remove('is-enter'); });
      return m;
    }
    // Messenger-style typing bubble: avatar + grey bubble with three bouncing dots.
    function typingNode(who, inThread) {
      return h('div', { class: 'typing', role: 'status', 'aria-label': P[who].name + ' đang gõ' }, avatar(who, inThread ? 'xs' : 'sm'),
        h('div', { class: 'typing-main' }, h('span', { class: 'typing-name' }, P[who].name + ' đang gõ'),
          h('span', { class: 'typing-bubble', 'aria-hidden': 'true' }, h('i', null), h('i', null), h('i', null))));
    }
    // How long someone "types" before a message lands: grows with length, like a person.
    function typeMs(text) { return S.sim.slowAI ? 3500 : Math.max(1200, Math.min(900 + (text || '').length * 20, 2800)); }
    function say(who, text, o) { o = o || {}; const m = msg(Object.assign({ who, text }, o)); add(m, o.into); if (who !== 'me') speak(who); return m; }
    function sys(text) { return add(h('div', { class: 'sys' }, text)); }
    function divider(text) { return add(h('div', { class: 'divider' }, text)); }
    function chips(list) {
      return h('div', { class: 'msg-chips' }, list.map(c => h('button', {
        class: 'chip' + (c.primary ? ' chip--primary' : '') + (c.ghost ? ' chip--ghost' : ''), type: 'button',
        onclick: (e) => { if (c.mark !== false) e.currentTarget.classList.add('is-chosen'); c.onClick(e); }
      }, c.label)));
    }
    async function aiReply(who, text, o) {
      o = o || {};
      const typing = typingNode(who, !!o.into);
      const onVideo = o.kind === 'task' && !o.into && !R.task && !R.replay;
      if (onVideo) {
        ovCard.innerHTML = ''; ovInput.hidden = true;
        ovCard.append(h('div', { class: 'vo-typing' }, avatar(who, 'sm'), h('span', null, P[who].name + ' đang gõ…')));
        overlay.hidden = false; frame.classList.add('has-overlay'); requestAnimationFrame(avoidOverlay);
      } else { await wait(o.readDelay != null ? o.readDelay : 500); add(typing, o.into); }
      setTile(who, { typing: true });
      const slow = S.sim.slowAI;
      await wait(typeMs(text));
      typing.remove();
      setTile(who, { typing: false });
      const m = msg(Object.assign({ who, text: slow ? (o.fallback || D.FALLBACK[who]) : text }, o));
      if (slow) m.main.append(h('div', { class: 'msg-note' }, icon('info', 'ic--sm'), 'Câu dự phòng soạn sẵn — AI phản hồi quá chậm'));
      add(m, o.into);
      speak(who);
      return m;
    }
    // Thread replies arrive a few video-seconds after the comment, like a live chat,
    // instead of appearing all at once (see the replyQueue flush in tick()).
    const REPLY_GAP = 6;
    const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
    const REACT_NAME = { '👍': 'Thích', '❤️': 'Yêu thích', '😂': 'Haha', '😮': 'Wow', '😢': 'Buồn', '🙏': 'Cảm ơn' };
    // A comment is "typed" first (who is typing, ~1–1.6 s) and then lands as a bubble,
    // so new comments read like people writing rather than lines popping in.
    function passive(ev) {
      R.lastPassiveT = R.t;
      const typing = typingNode(ev.who, false);
      add(typing); setTile(ev.who, { typing: true });
      setTimeout(() => {
        typing.remove(); setTile(ev.who, { typing: false });
        const m = msg({ who: ev.who, kind: 'passive', t: ev.t, text: ev.text });
        const th = attachThread(m, [], ev.who);
        add(m);
        speak(ev.who);
        (ev.thread || []).forEach((r, i) => R.replyQueue.push({ at: R.t + REPLY_GAP * (i + 1), r, th }));
        R.replyQueue.sort((a, b) => a.at - b.at);
      }, typeMs(ev.text));
    }
    function attachThread(m, replies, rootWho, replyAs) {
      const list = h('div', { class: 'thread-list', hidden: true });
      const sum = h('button', { class: 'thread-sum', type: 'button', 'aria-expanded': 'false', hidden: !replies.length });
      // Zoom Team Chat order: message → "N phản hồi ⌄" + reaction chip → replies (indented) → reply box.
      // Hover toolbar (Instagram / Messenger / Zoom): reply-in-thread and like, as icons beside the bubble.
      const replyBox = h('div', { class: 'thread-reply', hidden: true });
      // "Đang trả lời @Khoa" bar: set by "Trả lời" on a reply, or automatically when someone pings you.
      let target = null, mineCount = 0, usedAs = false;
      const replyTo = h('div', { class: 'reply-to', hidden: true });
      function setTarget(r, focus) {
        target = r; replyTo.innerHTML = '';
        if (r) {
          replyTo.append(icon('reply', 'ic--sm'), h('span', { class: 'reply-to-label' }, 'Đang trả lời ', h('b', null, '@' + P[r.who].name)),
            h('span', { class: 'reply-to-text' }, r.text),
            h('button', { class: 'icon-btn reply-to-x', type: 'button', 'aria-label': 'Bỏ trả lời @' + P[r.who].name, title: 'Bỏ', onclick: () => { setTarget(null); input.focus(); } }, icon('x', 'ic--sm')));
        }
        replyTo.hidden = !r;
        input.placeholder = r ? 'Trả lời @' + P[r.who].name + '…' : 'Trả lời trong thread…';
        if (r) setOpen(true, focus);
      }
      function threadMsg(r) {
        return threadMeta(msg({ who: r.who, text: r.text, inThread: true, ping: r.ping, quote: r.quote }), r);
      }
      function threadMeta(mm, r) {
        if (r.who === 'me') return mm;
        if (r.ping === 'me') mm.classList.add('is-ping-me');
        mm.main.append(h('div', { class: 'msg-meta' }, h('button', { class: 'msg-act msg-act--reply', type: 'button',
          'aria-label': 'Trả lời ' + P[r.who].name, onclick: () => setTarget(r, true) }, icon('reply', 'ic--sm'), 'Trả lời')));
        return mm;
      }
      const input = h('input', { class: 'input', placeholder: 'Trả lời trong thread…', 'aria-label': 'Trả lời trong thread' });
      replyBox.append(avatar('me', 'xs'), input,
        h('button', { class: 'icon-btn thread-send', type: 'button', 'aria-label': 'Gửi trả lời', title: 'Gửi', onclick: sendReply }, icon('send', 'ic--sm')));
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sendReply(); } });
      const renderSum = () => {
        const who = []; replies.forEach(r => { if (who.indexOf(r.who) < 0) who.push(r.who); });
        sum.innerHTML = '';
        sum.append(h('span', { class: 'thread-avs', 'aria-hidden': 'true' }, who.slice(0, 3).map(w => avatar(w, 'xs'))),
          h('span', { class: 'thread-count' }, replies.length + ' phản hồi'), icon('down', 'ic--sm thread-caret'));
        sum.hidden = !replies.length;
      };
      replies.forEach(r => list.append(threadMsg(r)));
      function setOpen(v, focus) {
        list.hidden = !v; replyBox.hidden = !v; if (!v) replyTo.hidden = true; else if (target) replyTo.hidden = false;
        sum.setAttribute('aria-expanded', String(v)); sum.classList.toggle('is-open', v);
        if (v && focus) input.focus();
      }
      sum.addEventListener('click', () => setOpen(list.hidden));
      // Reactions (Messenger set) as Zoom-style chips "❤️ 1" under the message; tap a chip to toggle yours.
      const rx = reactionChips();
      const chips = rx.chips, toggleReact = (e) => rx.toggle('me', e);
      const picker = h('div', { class: 'react-picker', role: 'menu', hidden: true, 'aria-label': 'Chọn cảm xúc' },
        REACTIONS.map(e => h('button', { class: 'react-opt', type: 'button', role: 'menuitem', 'aria-label': REACT_NAME[e], title: REACT_NAME[e],
          onclick: () => { toggleReact(e); closePicker(); } }, e)));
      const reactBtn = h('button', { class: 'msg-act', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': 'Thả cảm xúc', title: 'Thả cảm xúc',
        onclick: () => (picker.hidden ? openPicker() : closePicker()) }, icon('smile', 'ic--sm'));
      function openPicker() {
        picker.hidden = false; reactBtn.setAttribute('aria-expanded', 'true');
        const f = picker.querySelector('button'); if (f) f.focus({ preventScroll: true });
        setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
      }
      function closePicker() { picker.hidden = true; reactBtn.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', outside, true); }
      function outside(ev) { if (!picker.contains(ev.target) && ev.target !== reactBtn && !reactBtn.contains(ev.target)) closePicker(); }
      picker.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { closePicker(); reactBtn.focus(); } });
      // Zoom meeting-chat action row, always visible under the bubble: "↩ Trả lời" + add reaction.
      const replyAct = h('button', { class: 'msg-act msg-act--reply', type: 'button', onclick: () => { setTarget(null); setOpen(true, true); } }, icon('reply', 'ic--sm'), 'Trả lời');
      const actions = h('div', { class: 'msg-meta' }, replyAct, h('span', { class: 'react-wrap' }, reactBtn, picker), chips, sum);
      async function sendReply() {
        const v = input.value.trim(); if (!v) { input.focus(); return; }
        input.value = '';
        const tgt = target; setTarget(null);
        const mine = tgt ? { who: 'me', text: v, ping: tgt.who, quote: { who: tgt.who, text: tgt.text } } : { who: 'me', text: v }; replies.push(mine);
        const mm = msg(Object.assign({ inThread: true }, mine));
        // Chips-only row so the AI classmates can react to your thread reply too.
        const mrx = reactionChips(); mm.main.append(h('div', { class: 'msg-meta' }, mrx.chips));
        add(mm, list); renderSum();
        S.director.answers++;
        // Whoever you replied to answers (pinging you back); otherwise the comment's author.
        const responder = tgt ? tgt.who : replyAs ? replyAs.who : rootWho === 'me' ? 'na' : rootWho;
        const n = mineCount++;
        botReact(mrx, v, [responder]);
        const text = replyAs && !usedAs && responder === replyAs.who ? (usedAs = true, replyAs.text) : D.THREAD_REPLY[responder][n % D.THREAD_REPLY[responder].length];
        const ans = { who: responder, ping: 'me', text, quote: { who: 'me', text: v } };
        const am = await aiReply(responder, text, { into: list, inThread: true, ping: 'me', quote: ans.quote });
        decorate(am, ans); replies.push(ans); renderSum();
        // Every other reply, a second classmate joins in and pings the one who just answered.
        if (n % 2 === 0) {
          const other = responder === 'na' ? 'khoa' : 'na';
          if (tiles[other].left || R.ended) return;
          const ct = D.THREAD_CHIME[other][Math.floor(n / 2) % D.THREAD_CHIME[other].length];
          const chime = { who: other, ping: responder, text: ct };
          const cm = await aiReply(other, ct, { into: list, inThread: true, ping: responder, readDelay: 900 });
          decorate(cm, chime); replies.push(chime); renderSum();
        }
      }
      // aiReply builds a plain bubble; give it the same "Trả lời" action as scripted replies.
      function decorate(node, r) {
        threadMeta(node, r);
        if (r.ping === 'me') setTarget(r, false);
      }
      renderSum();
      m.main.append(actions, h('div', { class: 'thread' }, list, replyTo, replyBox));
      // A scheduled reply lands in the thread and opens it so the exchange is visible.
      function push(r) {
        if (list.hidden) setOpen(true);
        replies.push(r); add(threadMsg(r), list); renderSum();
        // Someone asked you directly: pre-select them so your next thread reply answers them.
        if (r.ping === 'me' && !target) setTarget(r, false);
      }
      let chain = Promise.resolve();
      return {
        push,
        // Scheduled reply: typing bubble first, then the message; queued so replies in one
        // thread arrive one after another instead of overlapping.
        reply(r) {
          const run = async () => {
            if (R.ended) return;
            if (list.hidden) setOpen(true);
            const typing = typingNode(r.who, true);
            add(typing, list); setTile(r.who, { typing: true });
            await wait(typeMs(r.text));
            typing.remove(); setTile(r.who, { typing: false });
            push(r); speak(r.who);
            await wait(400);
          };
          chain = chain.then(run, run);
          return chain;
        },
        // Someone else (Na/Khoa) adds a reaction to this message.
        react(who, e) { rx.add(who, e); }
      };
    }

    /* ---------- Reaction chips: "❤️ 2" with a hover/focus tooltip listing who reacted ---------- */
    function reactorNames(set) {
      const ids = [...set].sort((a, b) => (a === 'me' ? -1 : b === 'me' ? 1 : 0));
      return ids.map(id => (id === 'me' ? 'Bạn' : P[id].name)).join(', ');
    }
    function reactionChips() {
      const chips = h('span', { class: 'react-chips' });
      const by = new Map();
      function set(e) { if (!by.has(e)) by.set(e, new Set()); return by.get(e); }
      function render(pop) {
        chips.innerHTML = '';
        REACTIONS.forEach(e => {
          const s = by.get(e); if (!s || !s.size) return;
          const isMine = s.has('me');
          const tip = e + ' ' + REACT_NAME[e] + ' · ' + reactorNames(s);
          const chip = h('button', { class: 'react-chip' + (isMine ? ' is-mine' : '') + (pop === e ? ' is-pop' : ''), type: 'button',
            'aria-pressed': String(isMine), 'data-tip': tip,
            'aria-label': tip + (isMine ? ' · bấm để bỏ cảm xúc của bạn' : ' · bấm để thả cùng'),
            onclick: () => toggle('me', e) },
            h('span', { class: 'react-emoji', 'aria-hidden': 'true' }, e), h('span', { class: 'react-count' }, String(s.size)));
          chips.append(chip);
        });
      }
      function toggle(who, e) { const s = set(e); if (s.has(who)) s.delete(who); else s.add(who); render(s.has(who) ? e : null); }
      function add(who, e) { const s = set(e); if (s.has(who)) return; s.add(who); render(e); }
      return { chips, toggle, add };
    }
    // Na and Khoa react to the learner's messages after a short, staggered pause; the reactor's tile lights up.
    function pickReact(who, text) {
      if (/cảm ơn|thanks|tks/i.test(text)) return '🙏';
      if (/haha|hihi|=\)\)|:\)\)/i.test(text)) return '😂';
      if (/\?/.test(text)) return who === 'na' ? '😮' : '👍';
      return who === 'na' ? '❤️' : '👍';
    }
    function botReact(target, text, skip) {
      const who = ['khoa', 'na'].filter(id => !(skip || []).includes(id) && !tiles[id].left);
      who.forEach((id, i) => {
        wait(1200 + i * 1100 + Math.round(Math.random() * 400)).then(() => {
          if (R.ended) return;
          (target.react ? target.react(id, pickReact(id, text)) : target.add(id, pickReact(id, text)));
          speak(id);
        });
      });
    }

    /* ---------- Tasks (@Bạn): only one open at a time ---------- */
    function openTask(m, o) {
      o = o || {};
      const prevStatus = R.statusText;
      R.task = { m, pause: o.pause !== false, onText: o.onText || null, label: o.label, placeholder: o.placeholder, status: o.status || R.statusText };
      m.classList.add('is-open');
      if (R.task.pause) pause();
      if (o.status) setStatus(o.status);
      R.composer = o.onText ? { label: o.label, placeholder: o.placeholder, onText: o.onText } : null;
      updateComposer(); updateControls();
      showOverlay(R.task);
      // A system task that arrives while the learner's hand is up waits its turn (one @Bạn at a time).
      if (R.hand && !o.hand) { deferTask(); setStatus(prevStatus); }
    }
    function closeTask() {
      if (!R.task) return;
      const m = R.task.m;
      if (R.task.collapsed && R.task.returnT != null) { R.playing = false; moveTo(R.task.returnT); }
      pill.hidden = true;
      hideOverlay(R.task);
      m.classList.remove('is-open'); m.classList.add('is-done');
      m.querySelectorAll('.msg-chips button, .poll button, .poll input, .side-pick button, .side-pick input').forEach(b => { b.disabled = true; });
      R.task = null; R.composer = null;
      updateComposer(); updateControls();
    }
    function deferTask() {
      if (!R.task) return;
      const tk = R.task;
      if (tk.collapsed && tk.returnT != null) { R.playing = false; moveTo(tk.returnT); }
      tk.collapsed = false; pill.hidden = true;
      hideOverlay(tk);
      tk.status = R.statusText;
      tk.m.classList.remove('is-open'); tk.m.classList.add('is-waiting'); tk.m.setAttribute('inert', '');
      tk.note = h('div', { class: 'msg-waiting-note' }, icon('clock', 'ic--sm'), 'Tạm hoãn — sẽ quay lại sau khi bạn hạ tay');
      tk.m.main.append(tk.note);
      R.waiting.push(tk); R.task = null; R.composer = null;
      updateComposer();
    }
    function restoreTask() {
      const tk = R.waiting.pop(); if (!tk) return false;
      tk.m.classList.remove('is-waiting'); tk.m.removeAttribute('inert'); tk.m.classList.add('is-open');
      if (tk.note) tk.note.remove();
      R.task = tk; R.composer = tk.onText ? { label: tk.label, placeholder: tk.placeholder, onText: tk.onText } : null;
      setStatus(tk.status || '');
      updateComposer(); updateControls();
      showOverlay(tk);
      return true;
    }
    // @Bạn tasks are lifted onto the paused video; a placeholder keeps their spot in the chat log.
    function showOverlay(tk) {
      tk.collapsed = false; pill.hidden = true;
      if (!tk.ph) tk.ph = h('div', { class: 'msg-ph' }, icon('info', 'ic--sm'), 'Đang hiện trên màn video');
      if (tk.m.parentNode && tk.m.parentNode !== ovCard) tk.m.parentNode.insertBefore(tk.ph, tk.m);
      else if (!tk.ph.parentNode) add(tk.ph);
      ovCard.innerHTML = ''; ovCard.append(tk.m);
      ovInput.innerHTML = ''; ovInput.hidden = !tk.onText;
      if (tk.onText) {
        const inp = h('input', { class: 'input', placeholder: tk.placeholder || 'Trả lời…', 'aria-label': tk.label || 'Câu trả lời của bạn' });
        const send = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } inp.value = ''; tk.onText(v); };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); } });
        ovInput.append(inp, h('button', { class: 'btn btn--primary btn--sm', onclick: send }, icon('send', 'ic--sm'), 'Gửi'));
      }
      overlay.hidden = !!R.replay; frame.classList.toggle('has-overlay', !R.replay);
      requestAnimationFrame(avoidOverlay); updateComposer();
      setTimeout(() => { if (overlay.hidden) return; const f = ovCard.querySelector('button:not(:disabled), input:not(:disabled)'); if (f) f.focus({ preventScroll: true }); }, 60);
    }
    function hideOverlay(tk) {
      if (tk && tk.m.parentNode === ovCard) { if (tk.ph && tk.ph.parentNode) tk.ph.replaceWith(tk.m); else chat.append(tk.m); }
      else if (tk && tk.ph && tk.ph.parentNode) tk.ph.remove();
      ovCard.innerHTML = ''; ovInput.innerHTML = ''; ovInput.hidden = true;
      overlay.hidden = true; frame.classList.remove('has-overlay');
      restoreChatSpot(); updateComposer();
    }

    /* ---------- Composer ("Gửi tới") ---------- */
    const target = h('div', { class: 'cmp-target', hidden: true });
    const toSel = h('select', { class: 'cmp-to', id: 'cmp-to', 'aria-label': 'Gửi tới', title: 'Gửi tới', onchange: () => updateComposer() },
      h('option', { value: 'all' }, 'Cả lớp'), h('option', { value: 'na' }, 'Na (nhắn riêng)'), h('option', { value: 'khoa' }, 'Khoa (nhắn riêng)'), h('option', { value: 'thu' }, 'chị Thư (nhắn riêng)'));
    let stamp = true, stampT = null;
    const tsChip = h('button', { class: 'cmp-ts', type: 'button', 'aria-pressed': 'true', onclick: () => { stamp = !stamp; tsChip.setAttribute('aria-pressed', String(stamp)); updateStamp(); } });
    const ta = h('textarea', { class: 'cmp-input', rows: 2, 'aria-label': 'Nội dung tin nhắn' });
    const sendBtn = h('button', { class: 'cmp-send', type: 'button', 'aria-label': 'Gửi', title: 'Gửi (Enter)', onclick: (e) => onSend(e) }, icon('send', 'ic--sm'));
    const toLabel = h('label', { class: 'cmp-label', for: 'cmp-to' }, 'Tới:');
    toSel.hidden = true; toSel.tabIndex = -1;   // kept as the value store; the visible control is the menu below
    const toBtnText = h('span', { class: 'to-btn-text' });
    const toBtn = h('button', { class: 'to-btn', type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': 'Gửi tới', onclick: () => (toMenu.hidden ? openTo() : closeTo()) },
      toBtnText, icon('down', 'ic--sm'));
    const toMenu = h('div', { class: 'to-menu', role: 'listbox', 'aria-label': 'Gửi tới', hidden: true });
    const toPick = h('div', { class: 'to-pick' }, toBtn, toMenu);
    function syncTo() {
      const opt = toSel.options[toSel.selectedIndex];
      toBtnText.textContent = opt ? opt.textContent : 'Cả lớp';
      toMenu.innerHTML = '';
      [...toSel.options].forEach(o => {
        const sel = o.value === toSel.value;
        toMenu.append(h('button', { class: 'to-opt' + (sel ? ' is-selected' : ''), type: 'button', role: 'option', 'aria-selected': String(sel),
          onclick: () => { toSel.value = o.value; closeTo(); updateComposer(); toBtn.focus(); } },
          o.value === 'all' ? h('span', { class: 'to-ic' }, icon('users', 'ic--sm')) : avatar(o.value, 'xs'),
          h('span', { class: 'to-opt-text' }, o.textContent), sel ? icon('check', 'ic--sm to-check') : null));
      });
    }
    function openTo() {
      syncTo(); toMenu.hidden = false; toBtn.setAttribute('aria-expanded', 'true');
      const cur = toMenu.querySelector('.is-selected') || toMenu.querySelector('button'); if (cur) cur.focus({ preventScroll: true });
      setTimeout(() => document.addEventListener('pointerdown', outsideTo, true), 0);
    }
    function closeTo() { toMenu.hidden = true; toBtn.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', outsideTo, true); }
    function outsideTo(e) { if (!toPick.contains(e.target)) closeTo(); }
    toMenu.addEventListener('keydown', (e) => {
      const items = [...toMenu.querySelectorAll('.to-opt')]; const i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); closeTo(); toBtn.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
    });
    const head = h('div', { class: 'cmp-head' }, toLabel, toSel, toPick, target, tsChip);
    const foot = h('div', { class: 'cmp-foot' }, h('span', { class: 'cmp-hint' }, 'Enter để gửi · Shift+Enter xuống dòng'), sendBtn);
    const composer = h('div', { class: 'composer', role: 'form', 'aria-label': 'Gửi tin nhắn' }, h('div', { class: 'cmp-box' }, head, ta, foot));
    // The box grows with the text (up to ~4 lines) like Zoom's chat input; send lights up once there is text.
    function fitInput() {
      ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
      sendBtn.classList.toggle('is-ready', !!ta.value.trim());
    }
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); onSend(e); } });
    ta.addEventListener('input', () => { if (!ta.value) stampT = null; else if (stampT == null) stampT = R.t; updateStamp(); fitInput(); });
    function updateStamp() {
      const t = stampT != null ? stampT : R.t;
      tsChip.innerHTML = ''; tsChip.append(icon('clock', 'ic--sm'), fmt(t));
      tsChip.title = stamp ? 'Bình luận gắn mốc ' + fmt(t) + ' — bấm để bỏ' : 'Không gắn mốc giây — bấm để gắn lại';
      tsChip.setAttribute('aria-label', stamp ? 'Gắn mốc ' + fmt(t) + ' vào bình luận — bấm để bỏ' : 'Không gắn mốc giây — bấm để gắn lại');
    }
    // The composer answers a pending question only when that question is NOT already showing its own input on the video.
    function composerTarget() {
      const c = R.composer;
      if (c && R.task && !overlay.hidden && R.task.m.parentNode === ovCard) return null;
      return c;
    }
    function updateComposer() {
      const c = composerTarget();
      composer.classList.toggle('is-targeted', !!c);
      target.hidden = !c;
      toPick.hidden = !!c; toLabel.hidden = !!c; syncTo();
      target.innerHTML = '';
      if (c) {
        tsChip.hidden = true;
        target.title = c.label;
        target.append(icon('send', 'ic--sm'), h('span', { class: 'od-truncate' }, c.label));
        ta.placeholder = c.placeholder || 'Trả lời…';
      } else {
        const to = toSel.value;
        ta.placeholder = to === 'all' ? 'Bình luận với cả lớp…' : 'Nhắn riêng ' + P[to].name + '…';
        tsChip.hidden = to !== 'all';
      }
    }
    function onSend(e) {
      e.preventDefault();
      const text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      ta.value = ''; fitInput(); const t = stampT != null ? stampT : R.t; stampT = null; updateStamp();
      const c = composerTarget(); if (c) { c.onText(text); return; }
      const to = toSel.value;
      if (to === 'all') {
        const m = msg({ who: 'me', kind: 'mine', t: stamp ? t : null, text });
        const th = attachThread(m, [], 'me');
        add(m); chat.scrollTop = chat.scrollHeight;
        S.director.answers++;
        // Na answers in the thread of your message after a short read pause.
        wait(400).then(async () => {
          await th.reply({ who: 'na', text: D.CLASS_REPLY.na });
          if (R.ended) return; await wait(900);
          if (!tiles.khoa.left) await th.reply({ who: 'khoa', ping: 'na', text: D.CLASS_CHIME.khoa });
          if (R.ended) return; await wait(900);
          await th.reply({ who: 'na', ping: 'me', text: D.CLASS_CHIME.na });
        });
        botReact(th, text);
      } else {
        add(msg({ who: 'me', kind: 'whisper', tag: 'Nhắn riêng', to: P[to].name, text })); chat.scrollTop = chat.scrollHeight;
        aiReply(to, D.DM_REPLY[to], { kind: 'whisper', tag: 'Nhắn riêng', to: 'Bạn' });
      }
    }

    /* ---------- Inline player controls (YouTube-style, on the bottom edge of the video) ---------- */
    function togglePlay() { if (R.playing) pause(); else if (!R.replay) play(); }
    const playBtn = h('button', { class: 'vc-btn', onclick: togglePlay });
    const backBtn = h('button', { class: 'vc-btn', 'aria-label': 'Lùi 10 giây', title: 'Lùi 10 giây', onclick: () => { if (canSeek()) userSeek(Math.max(0, R.t - 10)); } }, icon('back10'));
    const fwdBtn = h('button', { class: 'vc-btn', 'aria-label': 'Tới 10 giây', title: 'Tới 10 giây', onclick: () => { if (canSeek()) userSeek(Math.min(DUR - 1, R.t + 10)); } }, icon('fwd10'));
    const segs = D.PARTS.map(p => {
      const fill = h('span', { class: 'tl-seg-fill' });
      const el = h('div', { class: 'tl-seg', style: 'flex:' + (p.end - p.start), title: 'Part ' + p.n + ' · ' + p.title }, fill, h('span', { class: 'tl-seg-label' }, 'P' + p.n + ' · ' + p.title));
      return { p, el, fill };
    });
    const tlHead = h('span', { class: 'tl-head' });
    const tlRange = h('span', { class: 'tl-range', hidden: true });
    const tlHover = h('span', { class: 'tl-hover', hidden: true });
    const markEls = S.script.filter(e => e.enabled && e.kind !== 'comment').map(e => ({ ev: e, el: h('span', { class: 'tl-mark tl-mark--' + e.kind, style: 'left:' + (e.t / DUR * 100) + '%' }) }));
    const track = h('div', { class: 'tl-track' }, segs.map(s => s.el), markEls.map(mk => mk.el), tlRange, tlHead);
    const tl = h('div', { class: 'tl', role: 'slider', tabindex: '0', 'aria-label': 'Thanh thời gian video, chia theo part', 'aria-valuemin': 0, 'aria-valuemax': DUR }, track, tlHover);
    const timeEl = h('span', { class: 'tl-time' });
    const muteBtn = h('button', { class: 'vc-btn', onclick: () => { if (!isReal()) return; media.setMuted(!media.isMuted()); renderMute(); } });
    const vol = h('input', { type: 'range', min: 0, max: 100, value: 100, class: 'vc-vol', 'aria-label': 'Âm lượng',
      oninput: (e) => { if (!isReal()) return; media.setVolume(e.target.value / 100); media.setMuted(+e.target.value === 0); renderMute(); } });
    function renderMute() {
      const muted = !isReal() || media.isMuted();
      muteBtn.innerHTML = ''; muteBtn.append(icon(muted ? 'mute' : 'volume'));
      const label = !isReal() ? 'Video mô phỏng không có tiếng' : muted ? 'Bật tiếng' : 'Tắt tiếng';
      muteBtn.setAttribute('aria-label', label); muteBtn.title = label;
      muteBtn.disabled = vol.disabled = !isReal();
      srcTag.textContent = App.player.label(isReal() ? S.videoSource : null);
    }
    const speedSel = h('select', { class: 'vc-speed', 'aria-label': 'Tốc độ phát', title: 'Tốc độ phát',
      onchange: (e) => { R.rate = +e.target.value; if (isReal()) media.setRate(R.rate); } },
      [0.75, 1, 1.25, 1.5, 2].map(r => h('option', { value: r, selected: r === 1 }, r + '×')));
    const fsBtn = h('button', { class: 'vc-btn', 'aria-label': 'Toàn màn hình', title: 'Toàn màn hình', onclick: () => {
      const deny = () => App.toast('Khung xem hiện tại không cho phép toàn màn hình.');
      try { if (document.fullscreenElement) document.exitFullscreen(); else if (frame.requestFullscreen) frame.requestFullscreen().catch(deny); else deny(); } catch (e) { deny(); }
    } }, icon('fullscreen'));
    const srcTag = h('span', { class: 'vc-src' });
    const vc = h('div', { class: 'vc', role: 'group', 'aria-label': 'Điều khiển video' }, tl,
      h('div', { class: 'vc-row' }, playBtn, backBtn, fwdBtn, muteBtn, vol, timeEl, h('span', { class: 'od-fill' }), srcTag, speedSel, fsBtn));
    frame.append(vc);
    let idleTimer = null;
    function wake() {
      frame.classList.remove('is-idle'); clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (R.playing && !frame.contains(document.activeElement)) frame.classList.add('is-idle'); }, 2500);
    }
    frame.addEventListener('mousemove', wake); frame.addEventListener('focusin', wake);
    const tFromX = (x) => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(DUR - 1, (x - r.left) / r.width * DUR)); };
    tl.addEventListener('click', (e) => { if (canSeek()) userSeek(tFromX(e.clientX)); });
    tl.addEventListener('mousemove', (e) => { const r = track.getBoundingClientRect(); const t = tFromX(e.clientX); tlHover.hidden = false; tlHover.textContent = fmt(t) + ' · Part ' + D.partAt(t).n; tlHover.style.left = (e.clientX - r.left) + 'px'; });
    tl.addEventListener('mouseleave', () => { tlHover.hidden = true; });
    tl.addEventListener('keydown', (e) => {
      if (!canSeek()) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); userSeek(Math.min(DUR - 1, R.t + 5)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); userSeek(Math.max(0, R.t - 5)); }
    });
    const canSeek = () => R.phase !== 'rollcall' && !R.replay && !R.ended;

    /* ---------- Class action row (below the video) ---------- */
    const thumbBtn = h('button', { class: 'act-btn', 'aria-label': 'Thả cảm xúc Hay', onclick: onThumb }, icon('thumb'), h('span', { class: 'lbl' }, 'Hay'));
    const confBtn = h('button', { class: 'act-btn', 'aria-label': 'Báo đoạn này khó hiểu', onclick: onConfused }, icon('confused'), h('span', { class: 'lbl' }, 'Khó hiểu'));
    const handBtn = h('button', { class: 'act-btn act-btn--hand', 'aria-pressed': 'false', onclick: () => (R.hand ? F().lowerHandFromBar(api) : F().hand(api)) }, icon('hand'), h('span', null, 'Giơ tay'));
    const partInfo = h('div', { class: 'act-part' });
    const chatBadge = h('span', { class: 'act-badge', hidden: true });
    const chatBtn = h('button', { class: 'act-btn', 'aria-pressed': 'true', onclick: () => setChatMode(R.chatMode === 'docked' || R.chatMode === 'floating' ? 'hidden' : 'docked') },
      icon('chat'), h('span', { class: 'lbl' }, 'Chat'), chatBadge);
    const peopleCount = h('span', { class: 'act-count' });
    const peopleBtn = h('button', { class: 'act-btn', 'aria-pressed': 'true', 'aria-label': 'Người tham gia', onclick: togglePeople },
      icon('users'), h('span', { class: 'lbl' }, 'Người tham gia'), peopleCount);
    function togglePeople() {
      const show = people.hidden || R.chatMode === 'hidden';
      people.hidden = !show; peopleBtn.setAttribute('aria-pressed', String(show));
      if (show && R.chatMode === 'hidden') setChatMode('docked');
    }
    const leaveBarBtn = h('button', { class: 'act-leave', type: 'button', onclick: onLeave }, icon('leave', 'ic--sm'), mode === 'review' ? 'Về tổng kết' : 'Rời lớp');
    const bar = h('footer', { class: 'room-bar' }, partInfo,
      h('div', { class: 'act-group' }, thumbBtn, confBtn, handBtn, peopleBtn, chatBtn), h('div', { class: 'act-end' }, leaveBarBtn));
    function renderBadge() { chatBadge.hidden = !R.unread; chatBadge.textContent = R.unread > 9 ? '9+' : String(R.unread); }

    function onThumb() {
      if (R.phase === 'rollcall') return;
      thumbBtn.classList.add('is-sent'); thumbBtn.querySelector('.lbl').textContent = 'Đã gửi';
      setMood('me', 'nod');
      setTimeout(() => { thumbBtn.classList.remove('is-sent'); thumbBtn.querySelector('.lbl').textContent = 'Hay'; }, 1600);
    }
    function onConfused() {
      if (R.phase === 'rollcall') return;
      const n = D.partAt(R.t).n;
      R.confused[n] = (R.confused[n] || 0) + 1;
      confBtn.classList.add('is-sent'); confBtn.querySelector('.lbl').textContent = 'Đã ghi nhận';
      setMood('me', 'frown');
      bloomShift(-1);
      setTimeout(() => { confBtn.classList.remove('is-sent'); confBtn.querySelector('.lbl').textContent = 'Khó hiểu'; }, 1600);
      const p = D.partByN(n);
      if (R.mode === 'live' && R.confused[n] >= 3 && !R.remediated[n] && !R.task && !R.hand && R.t >= p.start + D.OPENING) F().confusedOffer(api);
    }

    /* ---------- Clock & engine ---------- */
    function renderVideo() {
      if (!isReal()) App.lecture.render(media.el, R.t, { poster: R.phase === 'rollcall', focus: R.replay ? R.replay.focus : null });
      const cp = D.partAt(R.t);
      partInfo.textContent = R.phase === 'rollcall' ? 'Điểm danh' : 'Part ' + cp.n + '/4 · ' + cp.title;
      segs.forEach(s => {
        const pct = Math.max(0, Math.min(1, (R.t - s.p.start) / (s.p.end - s.p.start)));
        s.fill.style.width = (pct * 100) + '%';
        s.el.classList.toggle('is-current', R.t >= s.p.start && R.t < s.p.end);
      });
      tlHead.style.left = (R.t / DUR * 100) + '%';
      tl.setAttribute('aria-valuenow', String(Math.floor(R.t)));
      tl.setAttribute('aria-valuetext', fmt(R.t) + ', Part ' + D.partAt(R.t).n);
      tl.setAttribute('aria-disabled', String(!canSeek()));
      timeEl.textContent = fmt(R.t) + ' / ' + fmt(DUR);
      if (stampT == null && !ta.value) updateStamp();
      updateTranscript();
    }
    function tick() {
      if (!R.playing || R.suspended) return;
      const prev = R.t;
      let next = isReal() ? Math.max(prev, Math.min(media.time(), DUR)) : Math.min(prev + 0.1 * R.rate * S.sim.speed, DUR);
      if (R.replay) {
        if (next >= R.replay.e) { R.t = R.replay.e; renderVideo(); endReplay(); return; }
        R.t = next; renderVideo(); return;
      }
      R.t = next;
      if (R.mode === 'live') processEvents(prev, next);
      renderVideo();
      if (R.t >= DUR && R.playing) { pause(); if (R.mode === 'review') setStatus('Hết video'); }
    }
    function processEvents(prev, next) {
      updatePart(true);
      // moods
      for (let i = R.moodIdx + 1; i < D.MOODS.length && D.MOODS[i].t <= next; i++) {
        R.moodIdx = i;
        ['na', 'khoa', 'thu'].forEach(id => { if (D.MOODS[i][id]) setMood(id, D.MOODS[i][id]); });
      }
      // held passive comments (spacing ≥ 20 s, paused while an @Bạn is open)
      if (R.held.length && !R.task && !R.hand && R.t - R.lastPassiveT >= 12) passive(R.held.shift());
      while (R.replyQueue.length && R.replyQueue[0].at <= R.t) { const q = R.replyQueue.shift(); q.th.reply(q.r); }
      const events = S.script.filter(e => e.enabled && !R.fired.has(e.id) && e.t > prev && e.t <= next).sort((a, b) => a.t - b.t);
      for (const ev of events) {
        // A folded question is still open: stop before the next question instead of stacking two.
        if (R.task && R.task.collapsed && (ev.kind === 'poll' || ev.kind === 'question')) { expandTask(); break; }
        R.fired.add(ev.id);
        if (ev.kind === 'comment') {
          if (R.task || R.hand || R.t - R.lastPassiveT < 12) R.held.push(ev); else passive(ev);
        } else if (ev.kind === 'whisper') F().whisper(api, ev);
        else if (ev.kind === 'question') { R.t = ev.t; F().active(api, ev); }
        else if (ev.kind === 'poll') { R.t = ev.t; F().poll(api, ev); }
        if (!R.playing) break;
      }
      // a part whose poll was disabled by the instructor still needs a boundary at the end of the lesson
      if (R.t >= DUR && !R.ended && !R.task) F().endClass(api);
    }
    function updatePart(announce) {
      const p = D.partAt(R.t);
      if (p.n === R.part && R.phase !== 'rollcall') return;
      if (R.replay) return;
      const changed = p.n !== R.part;
      R.part = p.n;
      if (announce && changed) divider('Part ' + p.n + ' · ' + p.title);
      updateTitle();
    }
    function updateTitle() {
      if (R.phase === 'rollcall') { partNo.textContent = 'Điểm danh'; goal.textContent = R.present + '/4 đã vào lớp'; return; }
      if (R.mode === 'review') { partNo.textContent = 'Ôn lại'; goal.textContent = R.replay ? R.replay.label : 'Các đoạn cần xem lại'; return; }
      const p = D.partByN(R.part);
      partNo.textContent = 'Part ' + p.n + '/4';
      goal.textContent = 'Mục tiêu: ' + p.goal;
    }
    function setStatus(text, kind) { R.statusText = text || ''; R.statusKind = kind || ''; updateControls(); }
    function clearStatus() { setStatus(''); }
    function updateControls() {
      let text = R.statusText, kind = R.statusKind;
      if (R.replay) { text = 'Đang xem lại ' + fmt(R.replay.s) + '–' + fmt(R.replay.e) + (R.replay.label ? ' · ' + R.replay.label : ''); kind = 'replay'; }
      else if (!text) {
        if (R.phase === 'rollcall') text = 'Điểm danh — video chưa chạy';
        else if (R.ended) text = 'Tan lớp';
        else if (R.hand) text = 'Tạm dừng — bạn đang giơ tay';
        else if (R.playing) text = 'Đang phát';
        else text = 'Tạm dừng';
      }
      if (!kind) kind = R.playing ? 'playing' : 'paused';
      status.className = 'rt-status is-' + kind;
      status.innerHTML = ''; status.append(h('span', { class: 'rt-dot', 'aria-hidden': 'true' }), text);
      status.title = text;
      const blocked = R.phase === 'rollcall' || R.ended || (!R.playing && ((R.task && R.task.pause && !R.task.collapsed) || R.hand));
      if (isReal()) { if (R.playing) media.play(); else media.pause(); }
      if (!R.playing) frame.classList.remove('is-idle');
      playBtn.innerHTML = '';
      playBtn.append(icon(R.playing ? 'pause' : 'play'));
      playBtn.title = R.playing ? 'Tạm dừng' : 'Phát';
      playBtn.setAttribute('aria-label', R.playing ? 'Tạm dừng video' : 'Phát video');
      playBtn.disabled = !!(blocked && !R.playing) || !!R.replay;
      if (blocked && !R.playing && R.task) playBtn.title = 'Trả lời câu hỏi trên màn hình để video chạy tiếp';
      backBtn.disabled = fwdBtn.disabled = !canSeek();
      chatBtn.setAttribute('aria-pressed', String(R.chatMode !== 'hidden'));
      chatBtn.setAttribute('aria-label', R.chatMode === 'hidden' ? 'Mở chat' : 'Ẩn chat');
      handBtn.setAttribute('aria-pressed', String(R.hand));
      handBtn.querySelector('span').textContent = R.hand ? 'Hạ tay' : 'Giơ tay';
      handBtn.disabled = R.phase === 'rollcall' || R.ended || R.mode === 'review';
      /* raise-hand shortcut lives on the action bar (Giơ tay) */
      thumbBtn.disabled = confBtn.disabled = R.phase === 'rollcall' || R.ended || R.mode === 'review';
      tlRange.hidden = !R.replay;
      if (R.replay) { tlRange.style.left = (R.replay.s / DUR * 100) + '%'; tlRange.style.width = ((R.replay.e - R.replay.s) / DUR * 100) + '%'; }
      tl.setAttribute('aria-disabled', String(!canSeek()));
      updateTitle();
    }
    function play() {
      if (R.suspended || R.ended || R.phase === 'rollcall') return;
      if (R.hand || (R.task && R.task.pause && !R.task.collapsed)) return;
      if (R.t >= DUR) return;
      R.playing = true; updateControls();
    }
    function pause() { R.playing = false; updateControls(); }
    function resume() { clearStatus(); if (!restoreTask()) play(); }
    function seekTo(t, history) {
      const fwd = t > R.t;
      moveTo(t);
      if (fwd) {
        S.script.filter(e => e.t <= t && !R.fired.has(e.id)).sort((a, b) => a.t - b.t).forEach(e => {
          R.fired.add(e.id);
          if (!history || !e.enabled) return;
          if (e.part !== R.part) { R.part = e.part; divider('Part ' + e.part + ' · ' + D.partByN(e.part).title); }
          if (e.kind === 'comment') passive(e);
          else if (e.kind === 'poll' || e.kind === 'question') { sys((e.kind === 'poll' ? 'Poll' : 'Câu hỏi của Khoa') + ' Part ' + e.part + ' · bạn đã trả lời đúng'); record(e.part, 'pass', e.poll ? e.poll.bloom : e.bloom); }
        });
      }
      for (let i = 0; i < D.MOODS.length && D.MOODS[i].t <= t; i++) { if (i > R.moodIdx) { R.moodIdx = i; ['na', 'khoa', 'thu'].forEach(id => { if (D.MOODS[i][id]) setMood(id, D.MOODS[i][id]); }); } }
      updatePart(true);
      renderVideo();
    }
    function userSeek(t) { if (!canSeek() && R.mode !== 'review') return; seekTo(t, false); }
    let replayResolve = null;
    function startReplay(s, e, focus, label) {
      return new Promise(resolve => {
        R.replay = { s, e, focus, label, returnT: R.t, wasPlaying: R.playing };
        replayResolve = resolve;
        overlay.hidden = true; frame.classList.remove('has-overlay');
        moveTo(s); R.playing = true;
        renderVideo(); updateControls(); updateComposer();
      });
    }
    function endReplay() {
      const rp = R.replay; R.replay = null; R.playing = false;
      if (R.mode === 'live') moveTo(rp.returnT);
      if (R.task && R.task.m.parentNode === ovCard) { overlay.hidden = false; frame.classList.add('has-overlay'); requestAnimationFrame(avoidOverlay); }
      renderVideo(); updateControls(); updateComposer();
      if (replayResolve) { const r = replayResolve; replayResolve = null; r(); }
    }
    function bloomShift(d) { S.director.bloom = Math.max(0, Math.min(5, S.director.bloom + d)); App.refreshDrawer(); }
    function record(n, status, bloom) {
      const c = S.results.concepts[n] || { status: 'unchecked', bloom: null };
      c.status = status;
      if (bloom != null) c.bloom = c.bloom == null ? bloom : Math.max(c.bloom, bloom);
      S.results.concepts[n] = c;
    }
    function nextPart() {
      const p = D.partAt(R.t);
      clearStatus();
      if (p.n >= 4 || R.t >= DUR - 1) { F().endClass(api); return; }
      moveTo(p.end);
      updatePart(true); renderVideo();
      if (!restoreTask()) play();
    }

    /* ---------- Rollcall & jumps ---------- */
    async function rollcall() {
      R.phase = 'rollcall'; renderVideo(); updateControls();
      present('me'); sys(S.learner.name + ' đã vào lớp');
      const greet = async (who, text, back) => {
        const m = await aiReply(who, text, { fallback: text });
        attachThread(m, [], who, { who, text: back });
        return m;
      };
      await wait(400); present('na');
      await greet('na', 'Chào ' + S.learner.name + '! Tớ là Na, bạn học AI. Tớ hay hỏi “vì sao” lắm.', 'Rất vui được học cùng cậu! Chỗ nào khó cứ nhắn riêng tớ nhé.');
      await wait(300); present('khoa');
      await greet('khoa', 'Tớ là Khoa, cũng là AI. Tớ hay bắt bẻ và có thể sai — thấy tớ sai cứ sửa nhé.', 'Hehe, nhớ sửa thẳng tay khi tớ sai đấy!');
      await wait(300); present('thu');
      await greet('thu', 'Chị là Thư, trợ giảng AI. Chị trả lời bám đúng video và slide của thầy Minh, có mốc giây để bạn kiểm chứng.', 'Chào bạn! Lát có gì chưa rõ cứ bấm Giơ tay, chị trả lời kèm mốc giây.');
      await greet('thu', 'Hôm nay mình học ' + D.LESSON.title + ': 4 part, khoảng 8 phút rưỡi. Video chạy liên tục; muốn hỏi gì cứ bấm Giơ tay. Part 1: ' + D.PARTS[0].goal.toLowerCase() + '.', 'Ok bạn, mình bắt đầu nhé!');
      add(h('p', { class: 'msg-hint', style: 'padding:0 16px' }, 'Bấm “Trả lời” dưới mỗi lời chào để chào lại cả lớp.'));
      await wait(900);
      R.phase = 'live'; R.part = 1; updateTitle();
      ['na', 'khoa', 'thu'].forEach(id => setMood(id, 'nod')); R.moodIdx = 0;
      divider('Part 1 · ' + D.PARTS[0].title);
      play();
    }
    function quickJoin() {
      ['me', 'na', 'khoa', 'thu'].forEach(present);
      R.phase = 'live';
      sys(S.learner.name + ' đã vào lớp · điểm danh xong');
      divider('Part 1 · ' + D.PARTS[0].title);
      R.part = 1;
    }
    function startJump() {
      const j = R.jump ? R.jump.state : null;
      R.jump = null;
      if (R.mode === 'review') {
        ['me', 'na', 'khoa', 'thu'].forEach(present); R.phase = 'live';
        const ranges = (jumpRanges || []);
        say('thu', 'Mình cùng ôn các đoạn cần xem lại nhé. Bấm vào mốc để xem lại đúng đoạn đó:');
        ranges.forEach(r => add(h('div', { class: 'sys' }, r.label + ' · ', tsRange(r.s, r.e))));
        if (ranges[0]) startReplay(ranges[0].s, ranges[0].e, D.REMED[ranges[0].part].focus, ranges[0].label).then(() => {
          const m = say('thu', 'Xem xong đoạn ôn. Còn đoạn nào muốn xem lại thì bấm mốc ở trên nhé.', { kind: 'task', tag: '@Bạn' });
          m.main.append(chips([{ label: 'Về tổng kết', primary: true, onClick: () => App.go('hv/summary') }]));
        });
        return;
      }
      if (!j || j === 'rollcall') { rollcall(); return; }
      quickJoin();
      const at = { learning: 140, whisper: 166, hand: 208, aiError: 208, active: 386, poll1: 112, split: 262, remed: 268.5, end: 509 }[j] || 0;
      seekTo(at, true);
      if (j === 'hand') { F().hand(api); return; }
      if (j === 'aiError') { S.sim.netFail = true; App.refreshDrawer(); F().hand(api, { preset: 'Sao ω có đơn vị rad/s ạ?' }); return; }
      if (j === 'remed') {
        R.fired.add('p2'); moveTo(269); renderVideo();
        sys('Poll Part 2 · bạn chọn B (2π rad/s) — chưa đúng');
        bloomShift(-1);
        F().remediation(api, 2, { onDone: () => nextPart() });
        return;
      }
      if (j === 'end') { moveTo(DUR); renderVideo(); F().endClass(api); return; }
      play();
    }
    const jumpRanges = jump && jump.ranges;

    function onLeave() {
      if (R.mode === 'review') { App.go('hv/summary'); return; }
      if (R.ended) { App.go('hv/summary'); return; }
      App.confirmDialog({ title: 'Rời lớp?', body: 'Video dừng ở ' + fmt(R.t) + '. Mở lại link lớp để tiếp tục đúng chỗ này.', ok: 'Rời lớp', cancel: 'Ở lại' })
        .then(ok => { if (ok) { pause(); App.go('hv/join'); } });
    }

    /* ---------- Chat panel: docked (resizable) · floating (drag + resize) · hidden ---------- */
    const popBtn = h('button', { class: 'icon-btn', onclick: () => setChatMode(R.chatMode === 'floating' ? 'docked' : 'floating') });
    const hideBtn = h('button', { class: 'icon-btn', 'aria-label': 'Đóng chat', title: 'Đóng chat', onclick: () => setChatMode('hidden') }, icon('x'));
    const panelHead = h('div', { class: 'panel-head' }, h('span', { class: 'panel-grip', 'aria-hidden': 'true' }, icon('grip')),
      h('div', { class: 'panel-title od-fill' }, h('strong', null, 'Chat'), h('span', { class: 'panel-sub' }, 'Lớp học · Dao động điều hoà')), popBtn, hideBtn);
    const resizer = h('div', { class: 'panel-resizer', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical', 'aria-label': 'Kéo để đổi độ rộng chat (phím mũi tên trái/phải)' });
    const panel = h('aside', { class: 'room-panel', 'aria-label': 'Lớp học' }, resizer, panelHead, people, tabs,
      h('div', { class: 'panel-body' }, chat, transcript, newPill), composer);
    function setChatW(w) { R.chatW = Math.max(320, Math.min(760, w)); R.el.style.setProperty('--chat-w', R.chatW + 'px'); }
    resizer.addEventListener('pointerdown', (e) => {
      if (R.chatMode !== 'docked') return;
      e.preventDefault(); resizer.setPointerCapture(e.pointerId); R.el.classList.add('is-resizing');
      const move = (ev) => setChatW(R.el.getBoundingClientRect().right - ev.clientX);
      const up = () => { resizer.removeEventListener('pointermove', move); resizer.removeEventListener('pointerup', up); R.el.classList.remove('is-resizing'); saveChatLayout(R); };
      resizer.addEventListener('pointermove', move); resizer.addEventListener('pointerup', up);
    });
    resizer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setChatW(R.chatW + 24); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setChatW(R.chatW - 24); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') saveChatLayout(R);
    });
    function applyFloat() {
      const f = R.float;
      // keep a restored window reachable on a smaller screen
      f.w = Math.max(320, Math.min(f.w, window.innerWidth - 16)); f.h = Math.max(Math.min(420, window.innerHeight - 16), Math.min(f.h, window.innerHeight - 16));
      f.x = Math.max(8, Math.min(f.x, window.innerWidth - f.w - 8)); f.y = Math.max(8, Math.min(f.y, window.innerHeight - f.h - 8));
      panel.style.left = f.x + 'px'; panel.style.top = f.y + 'px'; panel.style.width = f.w + 'px'; panel.style.height = f.h + 'px';
    }
    // Floating chat steps aside when an on-video question card would sit under it, then returns.
    // R.floatAuto holds the spot the user chose; a manual drag meanwhile clears it (user wins).
    function avoidOverlay() {
      if (R.chatMode !== 'floating' || !R.float || overlay.hidden) return;
      const c = ovCard.parentNode.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      if (!c.width || p.right <= c.left || p.left >= c.right || p.bottom <= c.top || p.top >= c.bottom) return;
      const fr = frame.getBoundingClientRect();
      const w = p.width, W = window.innerWidth, gap = 12;
      const spots = [fr.right + gap, fr.left - gap - w, c.right + gap, c.left - gap - w];
      let x = spots.find(v => v >= 8 && v + w <= W - 8);
      if (x == null) x = c.left > W - c.right ? 8 : W - w - 8;
      if (!R.floatAuto) R.floatAuto = { x: R.float.x, y: R.float.y };
      R.float.x = x;
      panel.classList.add('is-gliding');
      applyFloat();
      setTimeout(() => panel.classList.remove('is-gliding'), 260);
    }
    function restoreChatSpot() {
      if (!R.floatAuto) return;
      const back = R.floatAuto; R.floatAuto = null;
      if (R.chatMode !== 'floating' || !R.float) return;
      R.float.x = back.x; R.float.y = back.y;
      panel.classList.add('is-gliding');
      applyFloat();
      setTimeout(() => panel.classList.remove('is-gliding'), 260);
    }
    // The floating window stays fully on screen when the browser window shrinks.
    window.addEventListener('resize', () => {
      if (R.el && R.el.isConnected && R.chatMode === 'floating' && R.float) applyFloat();
    });
    if (window.ResizeObserver) {
      let rt = null;
      new ResizeObserver(() => {
        if (R.chatMode !== 'floating' || !R.float || !panel.offsetWidth) return;
        clearTimeout(rt);
        rt = setTimeout(() => { R.float.w = panel.offsetWidth; R.float.h = panel.offsetHeight; saveChatLayout(R); }, 300);
      }).observe(panel);
    }
    panelHead.addEventListener('pointerdown', (e) => {
      if (R.chatMode !== 'floating' || e.target.closest('button')) return;
      e.preventDefault(); panelHead.setPointerCapture(e.pointerId);
      R.float.w = panel.offsetWidth; R.float.h = panel.offsetHeight;
      const sx = e.clientX, sy = e.clientY, ox = R.float.x, oy = R.float.y;
      const move = (ev) => {
        R.float.x = ox + ev.clientX - sx;
        R.float.y = oy + ev.clientY - sy;
        applyFloat();
      };
      const up = () => { panelHead.removeEventListener('pointermove', move); panelHead.removeEventListener('pointerup', up); R.floatAuto = null; saveChatLayout(R); };
      panelHead.addEventListener('pointermove', move); panelHead.addEventListener('pointerup', up);
    });
    function setChatMode(mode) {
      if (R.floatAuto && R.float) { R.float.x = R.floatAuto.x; R.float.y = R.floatAuto.y; R.floatAuto = null; }
      if (R.chatMode === 'floating' && R.float) { R.float.w = panel.offsetWidth || R.float.w; R.float.h = panel.offsetHeight || R.float.h; }
      R.chatMode = mode;
      R.el.classList.toggle('chat-floating', mode === 'floating');
      R.el.classList.toggle('chat-hidden', mode === 'hidden');
      panel.hidden = mode === 'hidden';
      if (mode === 'floating') {
        if (!R.float) R.float = { w: 460, h: Math.max(420, Math.min(680, window.innerHeight - 160)), x: window.innerWidth - 484, y: 72 };
        applyFloat();
        requestAnimationFrame(avoidOverlay);
      } else { panel.style.left = panel.style.top = panel.style.width = panel.style.height = ''; }
      if (mode !== 'hidden') { R.unread = 0; renderBadge(); }
      popBtn.innerHTML = '';
      popBtn.append(icon(mode === 'floating' ? 'dock' : 'popout'));
      const pl = mode === 'floating' ? 'Gắn chat lại bên phải' : 'Bật chat ra cửa sổ nổi';
      popBtn.setAttribute('aria-label', pl); popBtn.title = pl;
      updateControls();
      saveChatLayout(R);
      if (mode !== 'hidden') chat.scrollTop = chat.scrollHeight;
    }

    /* ---------- Assemble ---------- */
    chat.setAttribute('role', 'log'); chat.setAttribute('aria-labelledby', 'tab-chat');
    R.el = h('div', { class: 'room' + (mode === 'review' ? ' room--review' : '') }, title, stage, panel, bar);
    if (mode === 'review') { composer.hidden = true; }

    const api = {
      state: R, tiles, msg, add, say, sys, chips, aiReply, rich, tsRange, openTask, closeTask, deferTask, restoreTask,
      pause, play, resume, setStatus, clearStatus, startReplay, bloomShift, record, nextPart, speak, setTile,
      leaveTile, t: () => R.t, part: () => D.partAt(R.t), style: () => S.learner.style, name: () => S.learner.name,
      setWhisperPeek(text) { peek.hidden = !text; peek.innerHTML = ''; if (text) peek.append(icon('send', 'ic--sm'), h('span', { class: 'od-truncate' }, 'Na nhắn riêng: ' + text)); },
      focusComposer() { ta.focus(); },
      start() {
        R.suspended = false;
        clearInterval(R.timer);
        R.timer = setInterval(tick, 100);
        setChatW(R.chatW); setChatMode(R.chatMode); renderMute(); watchMedia();
        renderVideo(); updateComposer(); updateStamp(); updateControls();
        ['na', 'khoa', 'thu', 'me'].forEach(renderTile);
        if (!R.started) { R.started = true; startJump(); }
        else if (!R.ended) setStatus('Tạm dừng — bấm Phát để học tiếp');
      },
      suspend() { R.suspended = true; R.playing = false; clearInterval(R.timer); if (isReal()) media.pause(); }
    };
    R.api = api;
    return R;
  }
})();
