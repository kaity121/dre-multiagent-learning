/* core.js — shared store, hash router, DOM helpers, icons, toasts, dialog,
   build job (survives navigation), and the reviewer-only Prototype drawer. */
(function () {
  const App = window.App;
  const D = App.data;
  App.screens = {};

  // ---------- Store (in-memory; lives for the browser session) ----------
  App.state = {
    learner: { name: '', level: 'hoc', style: 'example' },
    script: D.SCRIPT.map(x => Object.assign({}, x, { enabled: true })),
    reviewDirty: false,
    classes: D.CLASSES.map(c => Object.assign({}, c)),
    sim: { speed: 1, slowAI: false, netFail: false, buildFail: false, fileFail: false },
    director: { bloom: 1, asks: 0, skips: 0, answers: 0 },
    videoSource: { kind: 'sim' },   // sim | file | youtube — what the learner classroom plays
    session: null,   // live classroom (kept so the learner can leave and resume)
    results: null    // per-concept results for the summary
  };
  App.LEVEL_START_BLOOM = { new: 0, hoc: 1, on: 2 };

  // ---------- DOM helpers ----------
  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style') el.style.cssText = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'href' && tag === 'a' && /^#\/?/.test(String(v))) {
          // In-app link: no href at all, so the host frame has nothing to intercept.
          el.setAttribute('data-go', String(v));
          el.setAttribute('role', 'link');
          el.setAttribute('tabindex', '0');
        }
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    // A <button> never submits anything; every action is an explicit click handler.
    if (tag === 'button' && !el.hasAttribute('type')) el.setAttribute('type', 'button');
    const kids = Array.prototype.slice.call(arguments, 2);
    (function add(list) {
      list.forEach(c => {
        if (c == null || c === false) return;
        if (Array.isArray(c)) add(c);
        else el.append(c.nodeType ? c : document.createTextNode(String(c)));
      });
    })(kids);
    return el;
  }
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (t) => { t = Math.max(0, Math.floor(t)); return pad(Math.floor(t / 60)) + ':' + pad(t % 60); };
  const parseTime = (s) => { const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(s || ''); if (!m || +m[2] > 59) return null; return +m[1] * 60 + +m[2]; };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const initialOf = (name) => { const w = (name || 'B').trim().split(/\s+/); return (w[w.length - 1][0] || 'B').toUpperCase(); };
  const personName = (id) => id === 'me' ? 'Bạn' : D.PEOPLE[id].name;

  const ICONS = {
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
    thumb: '<path d="M7 10v11H3V10h4z"/><path d="M7 10l4-8a2.5 2.5 0 0 1 2.5 2.5V8h5.3a2 2 0 0 1 2 2.3l-1.4 8.5a2.5 2.5 0 0 1-2.5 2.2H7"/>',
    confused: '<circle cx="12" cy="12" r="9"/><path d="M9 9.5h.01M15 9.5h.01M8.5 16c2-1.6 5-1.2 7 .3"/>',
    nod: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 14.5c2 2 5 2 7 0"/>',
    frown: '<circle cx="12" cy="12" r="9"/><path d="M8 9l2.5 1M16 9l-2.5 1M9 16c1.8-1.4 4.2-1.4 6 0"/>',
    yawn: '<circle cx="12" cy="12" r="9"/><path d="M8 10h3M13 10h3"/><circle cx="12" cy="15.5" r="2"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5z"/><path d="M14 3v5h5"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="1.5"/><path d="M16 10l5-3v10l-5-3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    retry: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    leave: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16l-4-4 4-4M5 12h11"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    poll: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    dot: '<circle cx="12" cy="12" r="4"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    back10: '<path d="M11 6L5 12l6 6"/><path d="M5 12h9a5 5 0 0 1 0 10h-2"/>',
    fwd10: '<path d="M13 6l6 6-6 6"/><path d="M19 12h-9a5 5 0 0 0 0 10h2"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5z"/>',
    popout: '<path d="M14 4h6v6M20 4l-8 8"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    dock: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M15 4v16"/>',
    minus: '<path d="M5 12h14"/>',
    grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
    reply: '<path d="M10 8L5 12l5 4"/><path d="M5 12h9a5 5 0 0 1 5 5v1"/>',
    thread: '<path d="M4 5h16v11H9l-5 4V5z"/><path d="M8 9h8M8 12h5"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 14c2 2 5 2 7 0"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  const FILLED = { play: true, dot: true };
  function icon(name, cls) {
    const span = document.createElement('span');
    span.innerHTML = '<svg class="ic' + (FILLED[name] ? ' ic--fill' : '') + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
    return span.firstChild;
  }
  function avatar(id, size, name) {
    const letter = id === 'me' ? initialOf(name || App.state.learner.name) : D.PEOPLE[id].initial;
    return h('span', { class: 'av av--' + id + (size ? ' av--' + size : ''), 'aria-hidden': 'true' }, letter);
  }

  // ---------- Toast ----------
  function toast(text, action) {
    const box = document.getElementById('toasts');
    const el = h('div', { class: 'toast', role: 'status' }, h('span', null, text),
      action ? h('button', { class: 'btn btn--sm', onclick: () => { el.remove(); action.onClick(); } }, action.label) : null,
      h('button', { class: 'btn btn--sm btn--ghost', 'aria-label': 'Đóng thông báo', onclick: () => el.remove() }, icon('x', 'ic--sm')));
    box.append(el);
    setTimeout(() => el.remove(), action ? 9000 : 4000);
  }

  // ---------- Dialog (native <dialog>: focus trap + Esc) ----------
  function dialog(build) {
    const dlg = h('dialog', { class: 'dlg' });
    const close = () => { dlg.close(); };
    dlg.addEventListener('close', () => dlg.remove());
    build(dlg, close);
    document.body.append(dlg);
    dlg.showModal();
    return dlg;
  }
  function confirmDialog(o) {
    return new Promise(resolve => {
      dialog((dlg, close) => {
        dlg.append(
          h('div', { class: 'dlg-body' }, h('h2', null, o.title), o.body ? h('p', { class: 'muted' }, o.body) : null),
          h('div', { class: 'dlg-actions' },
            h('button', { class: 'btn', onclick: () => { resolve(false); close(); } }, o.cancel || 'Huỷ'),
            h('button', { class: 'btn ' + (o.danger ? 'btn--danger-solid' : 'btn--primary'), onclick: () => { resolve(true); close(); } }, o.ok || 'Đồng ý')));
        dlg.addEventListener('cancel', () => resolve(false));
      });
    });
  }

  // ---------- App bar ----------
  function appBar(o) {
    o = o || {};
    return h('header', { class: 'appbar' },
      h('a', { class: 'brand', href: o.home || '#/' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'LV'),
        h('span', null, 'Lớp học Video'), h('span', { class: 'brand-note' }, '(tên tạm)')),
      h('div', { class: 'appbar-role' }, o.role || 'Giảng viên · Thầy Minh'));
  }

  // ---------- Build job (continues while the instructor navigates away) ----------
  const build = {
    job: null, listeners: new Set(), timers: [],
    start(cls) {
      this.clear();
      this.job = { classId: cls.id, title: cls.title, stages: D.BUILD_STAGES.map(s => Object.assign({}, s, { status: 'wait' })), cast: [], status: 'running', current: 0, failedOnce: false };
      this.run(0);
    },
    run(i) {
      const j = this.job;
      if (i >= j.stages.length) {
        j.status = 'done';
        const cls = App.state.classes.find(c => c.id === j.classId);
        if (cls) cls.status = 'draft';
        this.emit();
        if (App.currentPath !== 'gv/build') toast('Lớp “' + j.title + '” đã dựng xong — duyệt ' + App.state.script.length + ' tương tác', { label: 'Duyệt', onClick: () => App.go('gv/review/' + j.classId) });
        return;
      }
      const st = j.stages[i];
      st.status = 'run'; st.startedAt = Date.now(); j.current = i; this.emit();
      if (st.key === 'cast') ['na', 'khoa', 'thu'].forEach((p, k) => this.timers.push(setTimeout(() => { if (j.cast.indexOf(p) < 0) j.cast.push(p); this.emit(); }, 900 * (k + 1))));
      this.timers.push(setTimeout(() => {
        if (st.key === 'concept' && App.state.sim.buildFail && !j.failedOnce) { j.failedOnce = true; st.status = 'error'; j.status = 'error'; this.emit(); return; }
        st.status = 'done'; this.run(i + 1);
      }, st.ms));
    },
    retry() { const j = this.job; j.status = 'running'; this.run(j.current); },
    clear() { this.timers.forEach(clearTimeout); this.timers = []; },
    emit() { this.listeners.forEach(f => f(this.job)); },
    on(f) { this.listeners.add(f); return () => this.listeners.delete(f); }
  };

  // ---------- Router ----------
  // In-memory router: navigation never depends on default anchor behaviour or on
  // assigning location.hash (both are blocked inside some preview frames and under
  // file://). The URL is updated when allowed, purely as a bonus.
  const ROUTES = [
    [/^$/, 'overview', 'gv'], [/^gv\/classes$/, 'home', 'gv'], [/^gv\/reports$/, 'reports', 'gv'],
    [/^gv\/new$/, 'upload', 'gv'], [/^gv\/build$/, 'build', 'gv'], [/^gv\/review\/([\w-]+)$/, 'review', 'gv'], [/^gv\/dash\/([\w-]+)$/, 'dash', 'gv'],
    [/^hv\/join$/, 'join', 'hv'], [/^hv\/calibrate\/([12])$/, 'calibrate', 'hv'], [/^hv\/room$/, 'room', 'room'], [/^hv\/summary$/, 'summary', 'hv'], [/^hv\/done$/, 'done', 'hv']
  ];
  const normPath = (p) => String(p || '').replace(/^\/?#?\/?/, '').replace(/\/$/, '');
  let current = normPath(location.hash);
  let cleanup = null;
  function route() {
    const path = current;
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    document.querySelectorAll('.tooltip').forEach(t => t.remove());
    const root = document.getElementById('app');
    root.innerHTML = '';
    for (const [re, name, area] of ROUTES) {
      const m = path.match(re);
      if (!m) continue;
      App.currentPath = path;
      if (area === 'gv') {
        // Instructor screens render into a frame with the persistent sidebar.
        const body = h('div', { class: 'gv-body' });
        cleanup = App.screens[name](body, m.slice(1)) || null;
        const bar = body.querySelector('.appbar');
        root.append(bar || appBar(), h('div', { class: 'gv-layout' }, sidebar(path), body));
      } else {
        cleanup = App.screens[name](root, m.slice(1)) || null;
      }
      const target = root.querySelector('h1[tabindex="-1"]');
      if (target) target.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      refreshDrawer();
      return;
    }
    current = ''; route();
  }
  function go(path) {
    current = normPath(path);
    try { if (normPath(location.hash) !== current) history.pushState(null, '', '#/' + current); } catch (e) { /* URL locked: in-memory routing still works */ }
    route();
  }
  // Every in-app link is routed here instead of relying on the browser or the host frame.
  // Registered on window in the capture phase so a host-frame listener further down
  // the propagation path can never swallow the click before it reaches us.
  window.addEventListener('click', (e) => {
    const el = e.target && e.target.closest ? e.target.closest('[data-go], a[href^="#/"]') : null;
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    e.preventDefault();
    go(el.getAttribute('data-go') || el.getAttribute('href'));
  }, true);
  // Keyboard parity for in-app links (Enter / Space).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target && e.target.closest ? e.target.closest('[data-go]') : null;
    if (!el || el !== e.target) return;
    e.preventDefault();
    el.click();
  });
  const syncFromUrl = () => { const p = normPath(location.hash); if (p !== current) { current = p; route(); } };
  window.addEventListener('hashchange', syncFromUrl);
  window.addEventListener('popstate', syncFromUrl);
  // Surface script failures instead of failing silently (prototype aid).
  window.addEventListener('error', (e) => {
    const file = String(e.filename || '').split('/').pop();
    console.error('[prototype]', file, e.message);
    if (document.getElementById('toasts')) toast('Lỗi script ' + file + ': ' + e.message);
  });
  window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); toast('Lỗi: ' + ((e.reason && e.reason.message) || e.reason)); });

  // ---------- Instructor sidebar (persistent across instructor screens) ----------
  function sidebar(path) {
    const S = App.state;
    const drafts = S.classes.filter(c => c.status === 'draft').length;
    const item = (href, ic, label, active, badge) => h('a', { class: 'side-link' + (active ? ' is-active' : ''), href, 'aria-current': active ? 'page' : null },
      icon(ic), h('span', { class: 'od-fill' }, label), badge ? h('span', { class: 'side-badge' }, badge) : null);
    const inClass = /^gv\/(review|dash|classes|build)/.test(path);
    return h('nav', { class: 'sidebar', 'aria-label': 'Điều hướng giảng viên' },
      h('div', { class: 'side-group' }, h('div', { class: 'side-title' }, 'Giảng dạy'),
        item('#/', 'home', 'Tổng quan', path === ''),
        item('#/gv/classes', 'book', 'Lớp của tôi', inClass, drafts ? drafts + ' nháp' : null),
        item('#/gv/new', 'plus', 'Tạo lớp mới', path === 'gv/new'),
        item('#/gv/reports', 'poll', 'Báo cáo học tập', path === 'gv/reports')),
      h('div', { class: 'side-group' }, h('div', { class: 'side-title' }, 'Trải nghiệm học viên'),
        item('#/hv/join', 'eye', 'Xem như học viên', false)),
      h('div', { class: 'side-foot' },
        h('span', { class: 'av av--sm', style: '--c:#334155', 'aria-hidden': 'true' }, 'M'),
        h('div', { class: 'od-field' }, h('strong', { class: 'small' }, 'Thầy Minh'), h('span', { class: 'small muted' }, 'Tổ Vật lý · THPT'))));
  }
  App.pendingJump = null;
  function jump(path, state) { App.pendingJump = state || null; go(path); }
  function takeJump() { const j = App.pendingJump; App.pendingJump = null; return j; }

  // ---------- Prototype drawer (reviewer tool, closed by default, outside app layout) ----------
  let drawer, drawerTab, readout, roleMenu, roleLabel;
  const ensureLearner = () => { if (!App.state.learner.name) App.state.learner.name = 'Minh Anh'; };
  const roomJump = (state) => () => { ensureLearner(); App.state.session = null; jump('hv/room', { state }); };
  const JUMPS = [
    ['Giảng viên', [
      ['Tổng quan', () => go('')],
      ['Lớp của tôi', () => go('gv/classes')],
      ['Báo cáo học tập', () => go('gv/reports')],
      ['Tạo lớp — trống', () => jump('gv/new')],
      ['Tạo lớp — lỗi file video', () => jump('gv/new', { state: 'fileError' })],
      ['Dựng lớp — đang chạy', () => { App.state.sim.buildFail = false; jump('gv/build', { state: 'fresh' }); }],
      ['Dựng lớp — lỗi giai đoạn 2', () => { App.state.sim.buildFail = true; jump('gv/build', { state: 'fresh' }); }],
      ['Duyệt kịch bản', () => jump('gv/review/ddh')],
      ['Xác nhận mở lớp', () => jump('gv/review/ddh', { state: 'publish' })],
      ['Dashboard — có dữ liệu', () => jump('gv/dash/ddh')],
      ['Dashboard — chưa có dữ liệu', () => jump('gv/dash/cld')]
    ]],
    ['Học viên', [
      ['Trước khi vào lớp', () => jump('hv/join')],
      ['Hiệu chỉnh 1/2 — trình độ', () => { ensureLearner(); jump('hv/calibrate/1'); }],
      ['Hiệu chỉnh 2/2 — kiểu trả lời', () => { ensureLearner(); jump('hv/calibrate/2'); }],
      ['Phòng học — điểm danh', roomJump('rollcall')],
      ['Đang giảng (bình luận, thread)', roomJump('learning')],
      ['Thì thầm từ Na', roomJump('whisper')],
      ['Giơ tay hỏi', roomJump('hand')],
      ['Lỗi kết nối AI khi hỏi', roomJump('aiError')],
      ['Khoa hỏi @Bạn (AI phản hồi)', roomJump('active')],
      ['Poll cuối Part 1', roomJump('poll1')],
      ['Poll chia phe (Part 2)', roomJump('split')],
      ['Bù hiểu (sau poll sai)', roomJump('remed')],
      ['Tan lớp', roomJump('end')],
      ['Tổng kết', () => { ensureLearner(); jump('hv/summary', { state: 'demo' }); }],
      ['Tổng kết — đã hiểu hết', () => { ensureLearner(); jump('hv/summary', { state: 'allPass' }); }]
    ]]
  ];
  function buildDrawer() {
    // Bottom-left role switcher (prototype aid, as in the Codi reference): switch role views
    // and open the scenario drawer. Closed by default; never covers app content.
    roleLabel = h('span', { class: 'role-switch-label' });
    drawerTab = h('button', { class: 'role-switch', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': 'role-menu',
      title: 'Đổi vai trò / kịch bản thử nghiệm (Shift+P)', onclick: () => toggleRoleMenu() }, icon('users', 'ic--sm'), roleLabel, icon('down', 'ic--sm'));
    const roleItem = (role, ic, title, desc, fn) => h('button', { type: 'button', role: 'menuitemradio', 'data-role': role, onclick: () => { toggleRoleMenu(false); fn(); } },
      icon(ic), h('span', { class: 'od-field' }, h('strong', null, title), h('span', { class: 'small muted' }, desc)));
    roleMenu = h('div', { class: 'role-menu', id: 'role-menu', role: 'menu', hidden: true, 'aria-label': 'Đổi vai trò' },
      h('div', { class: 'role-menu-title' }, 'Xem giao diện theo vai trò'),
      roleItem('gv', 'book', 'Giảng viên', 'Dựng lớp, duyệt kịch bản, xem báo cáo', () => go('')),
      roleItem('hv', 'users', 'Học viên', 'Vào lớp, học cùng Na, Khoa và chị Thư', () => jump('hv/join')),
      h('div', { class: 'role-menu-sep', role: 'separator' }),
      h('button', { type: 'button', role: 'menuitem', onclick: () => { toggleRoleMenu(false); toggleDrawer(true); } }, icon('poll'),
        h('span', { class: 'od-field' }, h('strong', null, 'Kịch bản thử nghiệm'), h('span', { class: 'small muted' }, 'Nhảy tới trạng thái, giả lập lỗi, nguồn video'))));
    document.addEventListener('click', (e) => { if (!roleMenu.hidden && !roleMenu.contains(e.target) && !drawerTab.contains(e.target)) toggleRoleMenu(false); });
    readout = h('div', { class: 'proto-readout', 'aria-live': 'polite' });
    const S = App.state;
    const opt = (label, key) => h('label', { class: 'proto-opt' },
      h('input', { type: 'checkbox', 'data-key': key, checked: S.sim[key], onchange: (e) => { S.sim[key] = e.target.checked; } }), label);
    const speed = h('div', { class: 'od-row', role: 'radiogroup', 'aria-label': 'Tốc độ video' }, [1, 2, 5].map(v =>
      h('label', { class: 'proto-opt' }, h('input', { type: 'radio', name: 'proto-speed', value: v, checked: S.sim.speed === v, onchange: () => { S.sim.speed = v; } }), v + '×')));
    drawer = h('aside', { class: 'proto-panel', id: 'proto-panel', hidden: true, 'aria-label': 'Điều khiển prototype' },
      h('div', { class: 'od-row' }, h('h2', { class: 'od-fill' }, 'Điều khiển prototype'),
        h('button', { class: 'btn btn--sm btn--ghost', 'aria-label': 'Đóng', onclick: toggleDrawer }, icon('x'))),
      h('p', { class: 'proto-note' }, 'Chỉ dùng khi đánh giá UX — không thuộc giao diện sản phẩm. Nhảy thẳng tới một trạng thái hoặc giả lập lỗi.'),
      JUMPS.map(([group, items]) => h('section', null, h('h3', null, group),
        h('ul', { class: 'proto-list' }, items.map(([label, fn]) => h('li', null, h('button', { type: 'button', onclick: () => { fn(); toggleDrawer(false); } }, label)))))),
      h('section', null, h('h3', null, 'Giả lập'),
        h('div', { class: 'proto-opt' }, 'Tốc độ video:'), speed,
        opt('AI phản hồi chậm (dùng câu dự phòng)', 'slowAI'),
        opt('Lỗi mạng ở lần gửi câu hỏi kế tiếp', 'netFail'),
        opt('Lỗi ở giai đoạn “Rút concept” khi dựng lớp', 'buildFail'),
        h('p', { class: 'proto-note' }, 'Câu hỏi ngoài phạm vi: thử gõ “Thời tiết hôm nay thế nào?” khi giơ tay.')),
      h('section', null, h('h3', null, 'Nguồn video phòng học'), videoSourceBox()),
      h('section', null, h('h3', null, 'Director (theo luật)'), readout));
    document.body.append(drawerTab, roleMenu, drawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'P' && e.shiftKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) toggleDrawer();
      if (e.key === 'Escape' && !drawer.hidden) toggleDrawer(false);
      if (e.key === 'Escape' && !roleMenu.hidden) { toggleRoleMenu(false); drawerTab.focus(); }
    });
  }
  let srcNote = null;
  function videoSourceBox() {
    srcNote = h('p', { class: 'proto-note' });
    const inp = h('input', { class: 'input', placeholder: 'Dán link YouTube…', 'aria-label': 'Link YouTube cho phòng học' });
    const err = h('p', { class: 'field-error', role: 'alert' });
    const enterRoom = () => { ensureLearner(); App.state.session = null; toggleDrawer(false); jump('hv/room', { state: 'learning' }); };
    const useYt = () => {
      const id = App.player.parseYouTube(inp.value);
      if (!id) { err.textContent = 'Link YouTube chưa đúng.'; inp.focus(); return; }
      err.textContent = ''; App.state.videoSource = { kind: 'youtube', id }; enterRoom();
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); useYt(); } });
    return h('div', { class: 'od-stack' }, srcNote,
      h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { App.state.videoSource = { kind: 'sim' }; enterRoom(); } }, 'Dùng video mô phỏng'),
      h('div', { class: 'od-row' }, h('div', { class: 'od-fill' }, inp), h('button', { class: 'btn btn--sm', type: 'button', onclick: useYt }, 'Dùng')), err,
      h('p', { class: 'proto-note' }, 'Kịch bản tương tác vẫn là bài Dao động điều hoà; video khác chỉ để thử trình phát.'));
  }
  function toggleRoleMenu(force) {
    const open = typeof force === 'boolean' ? force : roleMenu.hidden;
    roleMenu.hidden = !open;
    drawerTab.setAttribute('aria-expanded', String(open));
    if (open) { const first = roleMenu.querySelector('button'); if (first) first.focus(); }
  }
  function toggleDrawer(force) {
    const open = typeof force === 'boolean' ? force : drawer.hidden;
    drawer.hidden = !open;
    if (open) { refreshDrawer(); const first = drawer.querySelector('button'); if (first) first.focus(); }
    else if (typeof force !== 'boolean') drawerTab.focus();
  }
  function refreshDrawer() {
    if (!readout) return;
    const learnerView = /^hv\//.test(App.currentPath || '');
    roleLabel.textContent = 'Vai trò: ' + (learnerView ? 'Học viên' : 'Giảng viên');
    roleMenu.querySelectorAll('[data-role]').forEach(b => b.setAttribute('aria-checked', String((b.dataset.role === 'hv') === learnerView)));
    document.body.classList.toggle('in-room', App.currentPath === 'hv/room');
    if (srcNote) srcNote.textContent = 'Đang dùng: ' + (App.state.videoSource.kind === 'youtube' ? 'YouTube · ' + App.state.videoSource.id : App.state.videoSource.kind === 'file' ? 'File · ' + (App.state.videoSource.name || '') : 'Video mô phỏng');
    const d = App.state.director;
    const type = d.asks >= 2 ? 'hay hỏi → thêm tranh luận, dạy lại Khoa' : d.skips >= 2 ? 'ít tương tác → nhiều bị động, thao tác 1 chạm' : 'cân bằng';
    readout.innerHTML = '';
    readout.append(
      h('span', null, 'Mức Bloom hiện tại: ', h('b', null, D.BLOOM[d.bloom])),
      h('span', null, 'Kiểu học viên: ', h('b', null, type)),
      h('span', null, 'Giơ tay: ' + d.asks + ' · Bỏ qua: ' + d.skips + ' · Trả lời: ' + d.answers),
      h('span', { class: 'proto-note' }, 'Đúng → leo 1 mức; sai / Khó hiểu / giơ tay → lùi 1 mức.'));
    drawer.querySelectorAll('input[data-key]').forEach(i => { i.checked = !!App.state.sim[i.dataset.key]; });
  }

  // Opening the prototype without a route lands on the learner's join screen (enter name → class).
  // The instructor overview stays reachable via the role switcher and in-app links to "#/".
  const DEFAULT_PATH = 'hv/join';
  function boot() {
    buildDrawer();
    if (!current) current = DEFAULT_PATH;
    route();
  }

  App.util = { h, fmt, parseTime, wait, icon, avatar, initialOf, personName };
  Object.assign(App, { toast, dialog, confirmDialog, appBar, build, go, jump, takeJump, boot, refreshDrawer });
})();
