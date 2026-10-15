/* review-player.js — Loom-style player for the instructor's script review.
   The video (real YouTube / file via App.player, or the simulated lecture) sits on top of a
   part-segmented timeline. Every script interaction is an avatar pin on that timeline:
     • hover / focus a pin  → quick peek card above the pin
     • click a pin          → seek there and pin a comment bubble over the video (Sửa · Tắt/Bật)
     • while playing        → each enabled interaction pops up as a bubble for ~4 s when reached
   The screen owns the data; this component only renders and reports intents through callbacks:
     opts = { media, items(), kindLabel(it), onSelect(id), onReach(id), onEdit(id), onToggle(id) } */
(function () {
  const App = window.App, D = App.data, P = D.PEOPLE;
  const { h, fmt, icon, avatar } = App.util;
  const AUTO_MS = 4000;

  function create(opts) {
    let media = opts.media || null;          // App.player object for real video; null = simulated lecture
    const svg = App.lecture.create('Video bài giảng — xem trước kịch bản');
    let t = 0, playing = false, lastT = 0, pinned = null, autoTimer = null;

    const mediaBox = h('div', { class: 'rp-media' }, media ? media.el : svg);
    const bubbleBox = h('div', { class: 'rp-bubbles', 'aria-live': 'polite' });
    const shield = h('div', { class: 'rp-shield', 'aria-hidden': 'true', onclick: () => toggle() });
    const stage = h('div', { class: 'rp-stage' }, mediaBox, shield, bubbleBox);

    const playBtn = h('button', { class: 'rp-btn', onclick: () => toggle() });
    const back = h('button', { class: 'rp-btn', 'aria-label': 'Lùi 10 giây', title: 'Lùi 10 giây', onclick: () => seek(t - 10) }, icon('back10'));
    const fwd = h('button', { class: 'rp-btn', 'aria-label': 'Tới 10 giây', title: 'Tới 10 giây', onclick: () => seek(t + 10) }, icon('fwd10'));
    const timeEl = h('span', { class: 'rp-time mono od-nowrap' });
    const muteBtn = h('button', { class: 'rp-btn', onclick: () => { if (!media) return; media.setMuted(!media.isMuted()); renderMute(); } });
    const srcEl = h('span', { class: 'rp-src od-nowrap' });

    const pinsRow = h('div', { class: 'rp-pins' });
    const segs = h('div', { class: 'rp-segs' });
    const head = h('span', { class: 'rp-head', 'aria-hidden': 'true' });
    const track = h('div', { class: 'rp-track', role: 'slider', tabindex: '0', 'aria-label': 'Thanh thời gian video', 'aria-valuemin': '0' }, segs, head);
    const peek = h('div', { class: 'rp-peek', hidden: true, role: 'tooltip' });
    const timeline = h('div', { class: 'rp-timeline' }, pinsRow, track, peek);

    const el = h('section', { class: 'rp card', 'aria-label': 'Duyệt kịch bản trên video' },
      stage,
      h('div', { class: 'rp-bar' }, playBtn, back, fwd, timeEl, h('span', { class: 'od-fill' }), srcEl, muteBtn),
      timeline,
      h('p', { class: 'rp-hint' }, 'Mỗi ghim là một tương tác của Na, Khoa hoặc chị Thư. Rê chuột để xem nhanh, bấm để tua tới và sửa ngay trên video. Khi phát, bình luận tự hiện đúng mốc như học viên sẽ thấy.'));

    const dur = () => D.LESSON.duration;
    const pct = (x) => Math.max(0, Math.min(100, x / dur() * 100)) + '%';
    const itemById = (id) => opts.items().find(x => x.id === id);

    /* ---------- clock ---------- */
    function now() { return media ? media.time() : t; }
    const clock = setInterval(() => {
      if (!playing) return;
      t = media ? media.time() : t + 0.2;
      if (t >= dur()) { t = dur(); pause(); }
      if (!media) App.lecture.render(svg, t);
      reachCheck(lastT, t);
      lastT = t;
      renderTime();
    }, 200);
    function reachCheck(a, b) {
      if (b < a || b - a > 2) return;                         // a seek, not playback
      const hit = opts.items().filter(it => it.enabled && it.t > a && it.t <= b).pop();
      if (!hit) return;
      showBubble(hit, false);
      if (opts.onReach) opts.onReach(hit.id);
    }
    function play() { playing = true; lastT = now(); if (media) media.play(); renderPlay(); }
    function pause() { playing = false; if (media) media.pause(); renderPlay(); }
    function toggle() { playing ? pause() : play(); }
    function seek(x) {
      t = Math.max(0, Math.min(dur() - 0.5, x)); lastT = t;
      if (media) media.seek(t); else App.lecture.render(svg, t);
      renderTime();
    }

    /* ---------- bubbles ---------- */
    function bubbleFor(it, sticky) {
      const tag = it.kind === 'question' ? '@Bạn' : it.kind === 'poll' ? '@Cả lớp' : it.kind === 'whisper' ? 'Nhắn riêng' : null;
      return h('article', { class: 'rp-bubble' + (sticky ? ' is-pinned' : '') + (it.enabled ? '' : ' is-off'), style: '--c:var(--c-' + it.who + ')' },
        h('div', { class: 'rp-bubble-head' }, avatar(it.who, 'sm'),
          h('div', { class: 'od-field od-fill' },
            h('strong', null, P[it.who].name),
            h('span', { class: 'rp-bubble-kind' }, opts.kindLabel(it))),
          tag ? h('span', { class: 'msg-tag' + (it.kind === 'whisper' ? ' msg-tag--dm' : '') }, tag) : null,
          h('span', { class: 'ts' }, fmt(it.t)),
          sticky ? h('button', { class: 'rp-x', 'aria-label': 'Đóng bình luận', onclick: () => clearBubble() }, icon('x', 'ic--sm')) : null),
        h('p', { class: 'rp-bubble-text' }, it.text),
        it.kind === 'poll' ? h('ol', { type: 'A', class: 'rp-bubble-poll' }, it.poll.options.map((o, i) => h('li', null, o + (i === it.poll.correct ? ' — đáp án đúng' : '')))) : null,
        !it.enabled ? h('p', { class: 'rp-bubble-off' }, 'Đang tắt — học viên sẽ không thấy tương tác này.') : null,
        h('div', { class: 'rp-bubble-actions' },
          h('button', { class: 'btn btn--sm', onclick: () => { pause(); opts.onEdit(it.id); } }, icon('edit', 'ic--sm'), 'Sửa'),
          h('button', { class: 'btn btn--sm', onclick: () => opts.onToggle(it.id) }, icon(it.enabled ? 'eye' : 'check', 'ic--sm'), it.enabled ? 'Tắt' : 'Bật')));
    }
    function showBubble(it, sticky) {
      clearTimeout(autoTimer);
      pinned = sticky ? it.id : null;
      bubbleBox.innerHTML = '';
      bubbleBox.append(bubbleFor(it, sticky));
      if (!sticky) autoTimer = setTimeout(() => { if (!pinned) bubbleBox.innerHTML = ''; }, AUTO_MS);
      renderPins();
    }
    function clearBubble() { clearTimeout(autoTimer); pinned = null; bubbleBox.innerHTML = ''; renderPins(); }

    /* ---------- timeline ---------- */
    function renderTimeline() {
      segs.innerHTML = '';
      D.PARTS.forEach(p => segs.append(h('div', { class: 'rp-seg', style: 'flex:' + (p.end - p.start) },
        h('span', { class: 'rp-seg-label', title: 'Part ' + p.n + ' · ' + p.title }, 'Part ' + p.n + ' · ' + p.title),
        h('span', { class: 'rp-seg-fill' }))));
      track.setAttribute('aria-valuemax', String(Math.round(dur())));
      renderPins(); renderTime();
    }
    function renderPins() {
      pinsRow.innerHTML = '';
      opts.items().slice().sort((a, b) => a.t - b.t).forEach(it => {
        const pin = h('button', {
          class: 'rp-pin' + (it.enabled ? '' : ' is-off') + (pinned === it.id || opts.selected && opts.selected() === it.id ? ' is-active' : ''),
          style: 'left:' + pct(it.t) + ';--c:var(--c-' + it.who + ')',
          'aria-label': fmt(it.t) + ' · ' + P[it.who].name + ' · ' + opts.kindLabel(it) + (it.enabled ? '' : ' · đã tắt'),
          onclick: () => opts.onSelect(it.id)
        }, P[it.who].initial);
        const show = () => showPeek(it, pin);
        pin.addEventListener('mouseenter', show); pin.addEventListener('focus', show);
        pin.addEventListener('mouseleave', hidePeek); pin.addEventListener('blur', hidePeek);
        pinsRow.append(pin);
      });
    }
    function showPeek(it, pin) {
      peek.innerHTML = '';
      peek.append(h('div', { class: 'od-row', style: '--od-gap:6px' }, avatar(it.who, 'xs'), h('strong', null, P[it.who].name), h('span', { class: 'ts' }, fmt(it.t))),
        h('div', { class: 'rp-peek-kind' }, opts.kindLabel(it) + (it.enabled ? '' : ' · đã tắt')),
        h('div', { class: 'od-clamp-2' }, it.text));
      peek.hidden = false;
      const w = timeline.clientWidth, x = pinsRow.offsetLeft + pin.offsetLeft;
      peek.style.left = Math.max(150, Math.min(w - 150, x)) + 'px';
    }
    function hidePeek() { peek.hidden = true; }
    function tFromX(x) { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (x - r.left) / r.width)) * dur(); }
    track.addEventListener('pointerdown', (e) => {
      track.setPointerCapture(e.pointerId); seek(tFromX(e.clientX));
      const move = (ev) => seek(tFromX(ev.clientX));
      const up = () => { track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); };
      track.addEventListener('pointermove', move); track.addEventListener('pointerup', up);
    });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); seek(t - 5); }
      if (e.key === 'ArrowRight') { e.preventDefault(); seek(t + 5); }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    });

    function renderTime() {
      const x = now();
      timeEl.textContent = fmt(x) + ' / ' + fmt(dur());
      head.style.left = pct(x);
      track.setAttribute('aria-valuenow', String(Math.round(x)));
      track.setAttribute('aria-valuetext', fmt(x) + ' · Part ' + D.partAt(x).n);
      segs.querySelectorAll('.rp-seg').forEach((s, i) => {
        const p = D.PARTS[i];
        s.lastChild.style.width = Math.max(0, Math.min(1, (x - p.start) / (p.end - p.start))) * 100 + '%';
      });
    }
    function renderPlay() {
      playBtn.innerHTML = ''; playBtn.append(icon(playing ? 'pause' : 'play'));
      const l = playing ? 'Tạm dừng' : 'Phát'; playBtn.setAttribute('aria-label', l); playBtn.title = l;
    }
    function renderMute() {
      muteBtn.hidden = !media;
      if (!media) return;
      const m = media.isMuted();
      muteBtn.innerHTML = ''; muteBtn.append(icon(m ? 'mute' : 'volume'));
      const l = m ? 'Bật tiếng' : 'Tắt tiếng'; muteBtn.setAttribute('aria-label', l); muteBtn.title = l;
    }
    function renderSrc() { srcEl.textContent = media ? App.player.label({ kind: media.kind }) : 'Video mô phỏng'; }

    renderPlay(); renderMute(); renderSrc(); renderTimeline(); App.lecture.render(svg, 0);

    return {
      el,
      /* Seek to an interaction and pin its comment bubble on the video. */
      focusItem(id) { const it = itemById(id); if (!it) return; pause(); seek(it.t); showBubble(it, true); },
      /* Re-render after data changes (edit / toggle / delete / timeline fit). */
      refresh() {
        renderTimeline();
        if (pinned) { const it = itemById(pinned); if (it) showBubble(it, true); else clearBubble(); }
      },
      /* Real video could not load: fall back to the simulated lecture. */
      useSim() { if (media) media.pause(); media = null; mediaBox.innerHTML = ''; mediaBox.append(svg); App.lecture.render(svg, t); renderMute(); renderSrc(); },
      destroy() { clearInterval(clock); clearTimeout(autoTimer); if (media) media.pause(); }
    };
  }

  App.reviewPlayer = { create };
})();
