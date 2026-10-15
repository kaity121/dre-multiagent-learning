/* instructor-screens.js — Giảng viên: class list, upload, staged class build,
   script review (edit / toggle / delete, synced timeline), publish confirm,
   understanding dashboard (heatmap, event markers, drill-down). */
(function () {
  const App = window.App, D = App.data, P = D.PEOPLE;
  const { h, fmt, parseTime, icon, avatar } = App.util;
  const KIND = { comment: 'Bình luận', whisper: 'Thì thầm (không dừng video)', question: 'Hỏi @Bạn · dừng video', poll: 'Poll cả lớp · dừng video' };
  const STATUS = { open: ['Đã mở', 'tag--ok'], draft: ['Nháp', 'tag--warn'], building: ['Đang dựng', 'tag--accent'] };

  /* ================= Home: class list ================= */
  App.screens.home = function (root) {
    const S = App.state;
    const banner = h('div');
    const page = h('main', { class: 'page', id: 'main' },
      h('div', { class: 'page-head' },
        h('div', null, h('h1', { tabindex: '-1' }, 'Lớp của tôi'),
          h('p', { class: 'muted' }, 'Đưa video bài giảng vào, hệ thống dựng lớp có bạn học AI. Bạn duyệt kịch bản trước khi mở lớp.')),
        h('a', { class: 'btn btn--primary', href: '#/gv/new' }, icon('plus'), 'Tạo lớp mới')),
      banner,
      h('ul', { class: 'class-list' }, S.classes.map(classRow)),
      h('p', { class: 'muted small', style: 'margin-top:24px' }, 'Xem trải nghiệm học viên: ',
        h('a', { href: '#/hv/join' }, 'mở link lớp “Dao động điều hoà”')));
    root.append(App.appBar(), page);

    function renderBanner(job) {
      banner.innerHTML = '';
      if (!job) return;
      if (job.status === 'running') {
        const done = job.stages.filter(s => s.status === 'done').length;
        banner.append(h('div', { class: 'banner banner--info', role: 'status' }, icon('clock'),
          h('span', { class: 'od-fill' }, 'Đang dựng lớp “' + job.title + '” — ' + done + '/4 giai đoạn. Bạn sẽ được báo khi xong.'),
          h('a', { class: 'btn btn--sm', href: '#/gv/build' }, 'Xem tiến trình')));
      } else if (job.status === 'error') {
        banner.append(h('div', { class: 'banner banner--warn', role: 'alert' }, icon('alert'),
          h('span', { class: 'od-fill' }, 'Dựng lớp “' + job.title + '” gặp lỗi ở một giai đoạn. Các giai đoạn đã xong được giữ nguyên.'),
          h('a', { class: 'btn btn--sm', href: '#/gv/build' }, 'Xem & thử lại')));
      }
    }
    renderBanner(App.build.job);
    return App.build.on(renderBanner);
  };

  function classRow(c) {
    const st = STATUS[c.status] || STATUS.draft;
    const meta = c.status === 'open'
      ? (c.learners ? c.learners + ' học viên · ' + c.completed + ' hoàn thành' : 'Chưa có học viên nào học')
      : c.status === 'building' ? 'Hệ thống đang dựng lớp' : 'Chưa mở — cần duyệt kịch bản';
    const actions = [];
    if (c.status === 'open') {
      actions.push(h('a', { class: 'btn btn--sm', href: '#/gv/review/' + c.id }, 'Kịch bản'));
      actions.push(h('a', { class: 'btn btn--sm btn--primary', href: '#/gv/dash/' + c.id }, 'Xem học viên hiểu tới đâu'));
    } else if (c.status === 'draft') {
      actions.push(h('a', { class: 'btn btn--sm btn--primary', href: '#/gv/review/' + c.id }, 'Duyệt kịch bản'));
    } else {
      actions.push(h('a', { class: 'btn btn--sm', href: '#/gv/build' }, 'Xem tiến trình'));
    }
    return h('li', { class: 'card class-row' },
      h('span', { class: 'class-thumb', 'aria-hidden': 'true' }, icon('video')),
      h('div', null,
        h('div', { class: 'class-title od-truncate' }, c.title),
        h('div', { class: 'class-meta' }, h('span', { class: 'tag ' + st[1] }, st[0]), h('span', null, c.subject), h('span', null, meta)),
        h('div', { class: 'class-ped' }, icon('target', 'ic--sm'), h('span', null, '4 part · 4 concept · video ' + fmt(D.LESSON.duration) + ' · Bloom từ Nhớ tới Phân tích'))),
      h('div', { class: 'class-actions' }, actions));
  }

  /* ================= Upload ================= */
  App.screens.upload = function (root) {
    const S = App.state;
    const jump = App.takeJump();
    const st = { title: 'Dao động điều hoà — lớp 12A2', video: null, doc: null, status: 'empty', progress: 0, error: '' };
    if (jump && jump.state === 'fileError') { st.status = 'error'; st.error = 'Không đọc được “bai-giang.mov”: file bị hỏng hoặc không phải video. Hãy chọn file MP4, MOV hoặc WebM.'; }
    let timer = null;

    const titleInput = h('input', { class: 'input', id: 'cls-title', value: st.title, oninput: (e) => { st.title = e.target.value; renderFooter(); } });
    const videoInput = h('input', { type: 'file', accept: 'video/*', class: 'sr-only', id: 'video-file', onchange: (e) => pickFile(e.target.files[0]) });
    const docInput = h('input', { type: 'file', accept: '.pdf,.ppt,.pptx', class: 'sr-only', id: 'doc-file', onchange: (e) => { const f = e.target.files[0]; if (f) { st.doc = f.name; renderDoc(); } } });
    const videoBox = h('div');
    const docBox = h('div');
    const footer = h('div', { class: 'actions-bar' });

    function pickFile(f) {
      if (!f) return;
      if (!/^video\//.test(f.type)) { st.status = 'error'; st.error = 'Không đọc được “' + f.name + '”: đây không phải file video. Hãy chọn file MP4, MOV hoặc WebM.'; renderVideo(); return; }
      startUpload({ name: f.name, duration: '—', source: { kind: 'file', url: URL.createObjectURL(f), name: f.name } });
    }
    function startUpload(v) {
      st.video = v; st.status = 'uploading'; st.progress = 0; st.error = '';
      renderVideo(); renderFooter();
      clearInterval(timer);
      timer = setInterval(() => {
        st.progress = Math.min(100, st.progress + 12);
        const bar = videoBox.querySelector('.progress > span');
        if (bar) bar.style.width = st.progress + '%';
        const pct = videoBox.querySelector('[data-pct]');
        if (pct) pct.textContent = st.progress + '%';
        if (st.progress >= 100) { clearInterval(timer); st.status = 'ready'; renderVideo(); renderFooter(); }
      }, 220);
    }
    function renderVideo() {
      videoBox.innerHTML = '';
      if (st.status === 'empty' || st.status === 'error') {
        const zone = h('div', { class: 'dropzone' + (st.status === 'error' ? ' is-error' : '') },
          icon(st.status === 'error' ? 'alert' : 'upload'),
          h('strong', null, st.status === 'error' ? 'Không đọc được video' : 'Kéo thả video bài giảng vào đây'),
          st.status === 'error' ? h('p', { class: 'field-error', role: 'alert' }, st.error) : h('p', { class: 'muted small' }, 'MP4, MOV hoặc WebM · tối đa 2 GB'),
          h('label', { class: 'btn', for: 'video-file' }, st.status === 'error' ? 'Chọn video khác' : 'Chọn video'));
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('is-drag'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('is-drag'));
        zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('is-drag'); pickFile(e.dataTransfer.files[0]); });
        videoBox.append(zone,
          h('p', { class: 'muted small', style: 'margin-top:12px' }, 'Hoặc dùng video đã chuẩn bị cho buổi demo:'),
          h('div', { class: 'sample-list' }, D.SAMPLE_VIDEOS.map(v => h('button', { class: 'sample', type: 'button', onclick: () => startUpload(Object.assign({}, v, { source: { kind: 'sim' } })) },
            icon('video'), h('span', { class: 'od-fill' }, v.name), h('span', { class: 'muted mono' }, v.duration)))),
          h('p', { class: 'muted small', style: 'margin-top:16px' }, 'Hoặc dán link YouTube của bài giảng:'),
          ytRow());
      } else {
        const uploading = st.status === 'uploading';
        videoBox.append(h('div', { class: 'file-row' }, icon('video'),
          h('div', { class: 'od-fill od-stack', style: '--od-gap:6px' },
            h('span', { class: 'od-truncate', style: 'font-weight:600' }, st.video.name),
            uploading ? h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Đang tải lên', 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('span', { style: 'width:' + st.progress + '%' }))
              : h('span', { class: 'muted small' }, st.video.source && st.video.source.kind === 'youtube' ? 'Đã liên kết YouTube · phát trực tiếp từ YouTube trong lớp' : 'Đã tải lên · thời lượng ' + st.video.duration)),
          uploading ? h('span', { class: 'muted small mono', 'data-pct': '' }, st.progress + '%')
            : h('button', { class: 'btn btn--sm btn--ghost', onclick: () => { st.video = null; st.status = 'empty'; renderVideo(); renderFooter(); } }, 'Đổi video')));
      }
    }
    function ytRow() {
      const inp = h('input', { class: 'input', id: 'yt-link', value: st.ytDraft || '', placeholder: 'https://www.youtube.com/watch?v=…', 'aria-label': 'Link YouTube', 'aria-describedby': 'yt-err' });
      const err = h('div', { class: 'field-error', id: 'yt-err', role: 'alert' });
      const use = () => {
        st.ytDraft = inp.value;
        const id = App.player.parseYouTube(inp.value);
        if (!id) { err.textContent = 'Link chưa đúng. Dán link dạng youtube.com/watch?v=… hoặc youtu.be/…'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
        clearInterval(timer);
        st.video = { name: 'YouTube · ' + id, duration: 'theo YouTube', source: { kind: 'youtube', id } };
        st.status = 'ready'; st.error = '';
        renderVideo(); renderFooter();
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); use(); } });
      return h('div', { class: 'od-stack', style: '--od-gap:6px;margin-top:8px' },
        h('div', { class: 'od-row' }, h('div', { class: 'od-fill' }, inp), h('button', { class: 'btn', onclick: use }, icon('link', 'ic--sm'), 'Dùng link')), err);
    }
    function renderDoc() {
      docBox.innerHTML = '';
      if (st.doc) {
        docBox.append(h('div', { class: 'file-row' }, icon('file'), h('span', { class: 'od-fill od-truncate' }, st.doc),
          h('button', { class: 'btn btn--sm btn--ghost', 'aria-label': 'Bỏ tài liệu ' + st.doc, onclick: () => { st.doc = null; renderDoc(); } }, icon('x'), 'Bỏ')));
      } else {
        docBox.append(h('div', { class: 'od-row' },
          h('label', { class: 'btn', for: 'doc-file' }, icon('plus'), 'Thêm slide / PDF'),
          h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => { st.doc = 'slide-dao-dong-dieu-hoa.pdf (12 trang)'; renderDoc(); } }, 'Dùng slide mẫu')));
      }
    }
    function renderFooter() {
      footer.innerHTML = '';
      const ready = st.status === 'ready' && st.title.trim();
      footer.append(
        h('a', { class: 'btn btn--ghost', href: '#/gv/classes' }, 'Huỷ'),
        h('button', { class: 'btn btn--primary', disabled: !ready, onclick: startBuild }, 'Dựng lớp'));
      if (!ready) footer.prepend(h('span', { class: 'muted small od-fill', style: 'align-self:center' }, st.status === 'uploading' ? 'Đang tải video lên…' : 'Chọn video bài giảng để dựng lớp.'));
    }
    function startBuild() {
      const source = (st.video && st.video.source) || { kind: 'sim' };
      const cls = { id: 'new' + Date.now().toString(36), title: st.title.trim(), subject: 'Vật lý 12', status: 'building', learners: 0, completed: 0, hasDoc: !!st.doc, source };
      S.videoSource = source; S.session = null;
      S.classes.unshift(cls);
      App.build.start(cls);
      App.go('gv/build');
    }

    renderVideo(); renderDoc(); renderFooter();
    root.append(App.appBar(), h('main', { class: 'page page--narrow', id: 'main' },
      h('div', { class: 'crumb' }, h('a', { href: '#/gv/classes' }, 'Lớp của tôi'), ' / Tạo lớp mới'),
      h('h1', { tabindex: '-1' }, 'Tạo lớp mới'),
      h('p', { class: 'muted', style: 'margin-top:4px' }, 'Video là học liệu cố định. Na, Khoa và chị Thư được dựng quanh đúng video này và tài liệu bạn đính kèm.'),
      h('div', { class: 'card card-pad', style: 'margin-top:24px' },
        h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'cls-title' }, 'Tên lớp'), titleInput),
        h('section', { class: 'section', 'aria-labelledby': 'v-h' }, h('h2', { id: 'v-h' }, 'Video bài giảng ', h('span', { class: 'req' }, '*')), videoInput, videoBox),
        h('section', { class: 'section', 'aria-labelledby': 'd-h' }, h('h2', { id: 'd-h' }, 'Tài liệu giảng viên ', h('span', { class: 'muted small' }, '(tuỳ chọn)')),
          h('p', { class: 'field-help' }, 'Có slide/PDF thì chị Thư trích được số trang khi trả lời học viên. Không có thì chỉ trích mốc giây video.'),
          docInput, docBox)),
      footer));
    return () => clearInterval(timer);
  };

  /* ================= Build progress ================= */
  App.screens.build = function (root) {
    const jump = App.takeJump();
    if (!App.build.job || (jump && jump.state === 'fresh')) {
      let cls = App.state.classes.find(c => c.status === 'building');
      if (!cls) { cls = { id: 'new-demo', title: 'Dao động điều hoà — lớp 12A2', subject: 'Vật lý 12', status: 'building', learners: 0, completed: 0 }; App.state.classes.unshift(cls); }
      App.build.start(cls);
    }
    const body = h('div');
    const titleEl = h('h1', { tabindex: '-1' });
    root.append(App.appBar(), h('main', { class: 'page page--narrow', id: 'main' },
      h('div', { class: 'crumb' }, h('a', { href: '#/gv/classes' }, 'Lớp của tôi'), ' / Dựng lớp'), titleEl, body));

    function render(job) {
      titleEl.textContent = job.status === 'done' ? 'Lớp đã dựng xong' : 'Đang dựng lớp “' + job.title + '”';
      body.innerHTML = '';
      if (job.status === 'done') {
        const n = App.state.script.length;
        body.append(h('div', { class: 'banner banner--ok', role: 'status', style: 'margin-top:16px' }, icon('check'),
          h('span', { class: 'od-fill' }, h('strong', null, 'Lớp đã dựng xong — duyệt ' + n + ' tương tác'), h('br'), h('span', { class: 'small' }, '4 part · Na, Khoa, chị Thư đã có kịch bản. Học viên chưa thấy gì cho tới khi bạn mở lớp.')),
          h('a', { class: 'btn btn--primary', href: '#/gv/review/' + job.classId }, 'Duyệt kịch bản')));
      } else {
        body.append(h('p', { class: 'muted', style: 'margin-top:4px' }, 'Thường mất vài phút. Bạn có thể rời trang — chúng tôi sẽ báo khi xong.'));
      }
      body.append(progressCard(job));
      body.append(h('ol', { class: 'card card-pad stages', style: 'margin-top:12px', 'aria-live': 'polite' }, job.stages.map((s, i) => stageItem(job, s, i))));
      if (job.status !== 'done') body.append(h('div', { class: 'actions-bar' },
        h('a', { class: 'btn', href: '#/' }, 'Rời đi, báo tôi khi xong')));
    }
    // Time-based progress: every stage has an estimated duration (ms). Finished stages count fully,
    // the running stage counts by elapsed time (capped at 97% of its estimate until it really ends).
    function progressNow(job) {
      const total = job.stages.reduce((a, s) => a + s.ms, 0);
      let elapsed = 0;
      job.stages.forEach(s => {
        if (s.status === 'done') elapsed += s.ms;
        else if (s.status === 'run' && s.startedAt) elapsed += Math.min(Date.now() - s.startedAt, s.ms * 0.97);
      });
      if (job.status === 'done') elapsed = total;
      return { pct: Math.round(elapsed / total * 100), left: Math.max(0, total - elapsed) };
    }
    function leftText(ms) {
      const s = Math.max(1, Math.ceil(ms / 1000));
      return 'Còn khoảng ' + (s >= 60 ? Math.floor(s / 60) + ' phút ' + (s % 60 ? (s % 60) + ' giây' : '') : s + ' giây');
    }
    let prog = null;
    function progressCard(job) {
      const n = job.stages.length;
      const cur = job.stages[Math.min(job.current, n - 1)];
      const caption = job.status === 'done' ? 'Đã xong cả ' + n + ' giai đoạn'
        : job.status === 'error' ? 'Dừng ở giai đoạn ' + (job.current + 1) + '/' + n + ' · ' + cur.label
        : 'Giai đoạn ' + (job.current + 1) + '/' + n + ' · ' + cur.label;
      prog = { pct: h('strong', { class: 'build-progress-pct od-nowrap' }), left: h('span', { class: 'build-progress-left od-nowrap' }),
        fill: h('span'), bar: null };
      prog.bar = h('div', { class: 'progress build-progress-bar', role: 'progressbar', 'aria-label': 'Tiến độ dựng lớp', 'aria-valuemin': '0', 'aria-valuemax': '100' }, prog.fill);
      const card = h('div', { class: 'card card-pad build-progress' + (job.status === 'error' ? ' is-error' : job.status === 'done' ? ' is-done' : ''), style: 'margin-top:16px' },
        h('div', { class: 'build-progress-head' },
          h('div', { class: 'od-field od-fill' },
            h('span', { class: 'build-progress-label' }, 'Tiến độ dựng lớp'),
            h('span', { class: 'build-progress-caption' }, caption)),
          prog.pct),
        prog.bar, prog.left);
      tickProgress();
      return card;
    }
    function tickProgress() {
      const job = App.build.job;
      if (!prog || !job) return;
      const p = progressNow(job);
      prog.pct.textContent = p.pct + '%';
      prog.fill.style.width = p.pct + '%';
      prog.bar.setAttribute('aria-valuenow', String(p.pct));
      prog.left.textContent = job.status === 'done' ? 'Hoàn tất' : job.status === 'error' ? 'Đã dừng — chờ bạn thử lại giai đoạn lỗi' : leftText(p.left) + ' (ước tính)';
    }
    const ticker = setInterval(tickProgress, 250);
    function stageItem(job, s, i) {
      const label = { wait: 'Chờ', run: 'Đang chạy', done: 'Xong', error: 'Lỗi' }[s.status];
      const ic = s.status === 'done' ? icon('check', 'ic--sm') : s.status === 'error' ? icon('alert', 'ic--sm') : s.status === 'run' ? icon('dot', 'ic--sm') : h('span', { class: 'small' }, String(i + 1));
      return h('li', { class: 'stage stage--' + s.status },
        h('span', { class: 'stage-ic', 'aria-hidden': 'true' }, ic),
        h('div', null,
          h('div', { class: 'stage-title' }, s.label),
          h('div', { class: 'stage-detail' }, s.detail),
          s.key === 'cast' && s.status !== 'wait' ? h('div', { class: 'cast' }, ['na', 'khoa', 'thu'].map(p => {
            const inn = job.cast.indexOf(p) >= 0;
            return h('span', { class: 'cast-item' + (inn ? ' is-in' : '') }, avatar(p, 'xs'), P[p].name + (inn ? ' đã nhận kịch bản' : ' đang chờ'));
          })) : null,
          s.status === 'error' ? h('div', { class: 'stage-error', role: 'alert' }, icon('alert', 'ic--sm'),
            h('span', null, 'Không rút được concept từ đoạn 03:10–03:40 (âm thanh nhỏ). Hai giai đoạn sau chưa chạy; giai đoạn đã xong được giữ nguyên.'),
            h('button', { class: 'btn btn--sm', onclick: () => App.build.retry() }, icon('retry', 'ic--sm'), 'Thử lại giai đoạn này')) : null),
        h('span', { class: 'stage-status' }, label));
    }
    render(App.build.job);
    const off = App.build.on(render);
    return () => { clearInterval(ticker); off(); };
  };

  /* ================= Review script ================= */
  App.screens.review = function (root, params) {
    const S = App.state;
    const jump = App.takeJump();
    const cls = S.classes.find(c => c.id === params[0]) || S.classes[0];
    const keptNotice = S.reviewDirty;
    let selected = S.script[0] ? S.script[0].id : null;
    let editing = null, confirmDel = null;

    const head = h('div');
    const listCol = h('div', { class: 'review-list-col' });
    // A class built from a YouTube link / video file is reviewed on that video, and its script is
    // fitted to the video's real length (proportional rescale of every timestamp).
    const source = cls.source || { kind: 'sim' };
    let previewMedia = source.kind === 'sim' ? null : App.player.create(source);
    let fitState = previewMedia ? 'loading' : 'sim', fitError = '';
    if (!previewMedia && App.timeline.isFitted()) App.timeline.reset();
    // Loom-style player: interactions are avatar pins on the timeline and comment bubbles on the video.
    const rp = App.reviewPlayer.create({
      media: previewMedia,
      items: () => S.script,
      kindLabel: (it) => KIND[it.kind],
      selected: () => selected,
      onSelect: (id) => select(id, true),
      onReach: (id) => { selected = id; markSelectedRow(id); },
      onEdit: (id) => { selected = id; editing = id; confirmDel = null; renderList(); scrollToRow(id); focusEdit(); },
      onToggle: (id) => { const it = item(id); if (it) toggle(it); }
    });
    const main = h('main', { class: 'page', id: 'main', style: 'max-width:1440px' },
      h('div', { class: 'crumb' }, h('a', { href: '#/gv/classes' }, 'Lớp của tôi'), ' / ' + cls.title),
      head,
      h('div', { class: 'review-wrap review-wrap--loom' },
        h('div', { class: 'review-player-col' }, rp.el),
        listCol));
    root.append(App.appBar(), main);

    const item = (id) => S.script.find(x => x.id === id);
    const enabledCount = () => S.script.filter(x => x.enabled).length;
    function markDirty() { S.reviewDirty = true; renderHead(); }

    function renderHead() {
      head.innerHTML = '';
      const st = STATUS[cls.status] || STATUS.draft;
      head.append(h('div', { class: 'review-head' },
        h('div', { class: 'od-fill' },
          h('h1', { tabindex: '-1' }, 'Duyệt kịch bản'),
          h('div', { class: 'review-meta' }, h('span', { class: 'tag ' + st[1] }, st[0]), h('span', null, cls.title),
            h('span', null, '4 part · ' + S.script.length + ' tương tác · ' + enabledCount() + ' đang bật'),
            S.reviewDirty ? h('span', { class: 'tag tag--warn', role: 'status' }, 'Có thay đổi chưa lưu') : h('span', { class: 'tag', role: 'status' }, icon('check', 'ic--sm'), 'Đã lưu'))),
        h('button', { class: 'btn', disabled: !S.reviewDirty, onclick: () => { S.reviewDirty = false; renderHead(); App.toast('Đã lưu bản nháp kịch bản'); } }, 'Lưu nháp'),
        h('button', { class: 'btn btn--primary', onclick: openPublish }, cls.status === 'open' ? 'Cập nhật lớp' : 'Mở lớp')));
      const label = App.player.label(source);
      if (fitState === 'loading') head.append(h('div', { class: 'banner banner--info', role: 'status' }, icon('clock'),
        h('span', { class: 'od-fill' }, 'Đang đo độ dài ' + label + ' để căn kịch bản theo đúng video…')));
      if (fitState === 'fitted') head.append(h('div', { class: 'banner banner--ok', role: 'status' }, icon('check'),
        h('span', { class: 'od-fill' }, h('strong', null, 'Kịch bản đã căn theo độ dài ' + label + ': ' + fmt(D.LESSON.duration) + '.'), ' Bản soạn gốc dài ' + fmt(App.timeline.baseDuration()) +
          '; mọi mốc (part, tương tác, đoạn xem lại) được co giãn theo tỉ lệ ×' + App.timeline.factor().toFixed(2) + '. Bấm một dòng để xem đúng đoạn trên video, sửa mốc nếu cần.')));
      if (fitState === 'failed' || fitState === 'nodur') head.append(h('div', { class: 'banner banner--warn', role: 'alert' }, icon('alert'),
        h('span', { class: 'od-fill' }, 'Không đo được độ dài video' + (fitError ? ' (' + fitError + ')' : '') + '. Kịch bản giữ theo bản soạn gốc ' + fmt(App.timeline.baseDuration()) + ' và xem trước bằng video mô phỏng.')));
      if (keptNotice) head.append(h('div', { class: 'banner banner--warn' }, icon('info'), h('span', { class: 'od-fill' }, 'Các thay đổi chưa lưu từ lần trước vẫn được giữ.')));
      if (cls.status === 'open') head.append(h('div', { class: 'banner banner--info' }, icon('info'),
        h('span', { class: 'od-fill' }, 'Lớp đang mở. Thay đổi chỉ áp dụng cho học viên vào lớp sau khi bạn bấm “Cập nhật lớp” (giả định — câu hỏi mở trong PRODUCT.md).')));
    }

    function renderList() {
      listCol.innerHTML = '';
      D.PARTS.forEach(p => {
        const rows = S.script.filter(x => x.part === p.n).sort((a, b) => a.t - b.t);
        listCol.append(h('section', { class: 'card part-group', 'aria-labelledby': 'ph' + p.n },
          h('div', { class: 'part-head' }, h('h2', { id: 'ph' + p.n }, 'Part ' + p.n + ' · ' + p.title),
            h('span', { class: 'muted small mono' }, fmt(p.start) + '–' + fmt(p.end)),
            h('span', { class: 'part-goal' }, 'Mục tiêu: ' + p.goal + ' · không chèn tương tác trong ' + D.OPENING + ' giây đầu')),
          rows.length ? h('ul', { class: 'irows' }, rows.map(rowFor)) : h('p', { class: 'muted small', style: 'padding:16px' }, 'Không có tương tác nào trong part này.')));
      });
    }
    function rowFor(it) {
      if (editing === it.id) return editRow(it);
      if (confirmDel === it.id) return h('li', { class: 'irow-confirm', role: 'alert' },
        h('span', { class: 'od-fill' }, 'Xoá tương tác lúc ' + fmt(it.t) + ' (' + P[it.who].name + ')? Muốn giữ lại nhưng ẩn với học viên thì dùng “Tắt”.'),
        h('button', { class: 'btn btn--sm', onclick: () => { confirmDel = null; renderList(); } }, 'Huỷ'),
        h('button', { class: 'btn btn--sm btn--danger-solid', onclick: () => doDelete(it) }, 'Xoá'));
      const tags = [h('span', { class: 'tag' }, 'Bloom: ' + D.BLOOM[it.bloom]),
        h('span', { class: 'tag ' + (it.mode === 'passive' ? '' : 'tag--accent') }, it.mode === 'passive' ? 'Bị động' : 'Chủ động')];
      if (!it.enabled) tags.push(h('span', { class: 'tag tag--outline' }, 'Đã tắt'));
      const text = it.kind === 'poll' ? it.text + ' (' + it.poll.options.length + ' lựa chọn)' : it.text;
      return h('li', { class: 'irow' + (it.enabled ? '' : ' is-off') + (selected === it.id ? ' is-selected' : ''), id: 'row-' + it.id },
        h('button', { class: 'ts', onclick: () => select(it.id), 'aria-label': 'Xem trước tại ' + fmt(it.t) }, fmt(it.t)),
        h('span', { class: 'irow-who' }, avatar(it.who, 'xs'), h('span', { class: 'od-truncate' }, P[it.who].name)),
        h('button', { class: 'irow-text', onclick: () => select(it.id) }, h('span', { class: 'irow-kind' }, KIND[it.kind]), h('span', { class: 'od-clamp-2' }, text)),
        h('span', { class: 'irow-tags' }, tags),
        h('span', { class: 'irow-ctrl' },
          h('button', { class: 'switch', role: 'switch', 'aria-checked': String(it.enabled), 'aria-label': (it.enabled ? 'Tắt' : 'Bật') + ' tương tác lúc ' + fmt(it.t), onclick: () => toggle(it) }),
          rowMenu(it)));
    }
    function rowMenu(it) {
      const det = h('details', { class: 'menu' });
      const close = () => det.removeAttribute('open');
      det.append(h('summary', { 'aria-label': 'Thao tác cho tương tác lúc ' + fmt(it.t) }, icon('more')),
        h('div', { class: 'menu-list' },
          h('button', { onclick: () => { close(); editing = it.id; confirmDel = null; renderList(); focusEdit(); } }, icon('edit', 'ic--sm'), 'Sửa'),
          h('button', { onclick: () => { close(); toggle(it); } }, icon(it.enabled ? 'eye' : 'check', 'ic--sm'), it.enabled ? 'Tắt' : 'Bật'),
          h('button', { class: 'btn--danger', onclick: () => { close(); confirmDel = it.id; editing = null; renderList(); } }, icon('trash', 'ic--sm'), 'Xoá')));
      det.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); det.querySelector('summary').focus(); } });
      return det;
    }
    function editRow(it) {
      const p = D.partByN(it.part);
      const ta = h('textarea', { class: 'textarea', id: 'ed-text', rows: 3 }, it.text);
      const tIn = h('input', { class: 'input mono', id: 'ed-time', value: fmt(it.t), style: 'width:110px', 'aria-describedby': 'ed-time-help ed-time-err' });
      const tErr = h('div', { class: 'field-error', id: 'ed-time-err', role: 'alert' });
      const cErr = h('div', { class: 'field-error', role: 'alert' });
      function validTime() {
        const t = parseTime(tIn.value);
        let msg = '';
        if (t == null) msg = 'Mốc phải có dạng mm:ss, ví dụ 02:15.';
        else if (t < p.start || t >= p.end) msg = 'Mốc nằm ngoài Part ' + p.n + ' (' + fmt(p.start) + '–' + fmt(p.end) + ').';
        else if (t < p.start + D.OPENING) msg = 'Không chèn tương tác trong ' + D.OPENING + ' giây đầu part (' + fmt(p.start) + '–' + fmt(p.start + D.OPENING) + ').';
        tErr.textContent = msg; tIn.setAttribute('aria-invalid', String(!!msg));
        return msg ? null : t;
      }
      tIn.addEventListener('blur', validTime);
      function save() {
        const t = validTime();
        const txt = ta.value.trim();
        cErr.textContent = txt ? '' : 'Nội dung không được để trống.';
        ta.setAttribute('aria-invalid', String(!txt));
        if (t == null || !txt) return;
        it.t = t; it.text = txt; editing = null; selected = it.id;
        App.timeline.rememberEdit(it);
        markDirty(); renderList(); renderTimeline();
        const b = document.querySelector('#row-' + it.id + ' .ts'); if (b) b.focus();
      }
      const li = h('li', { class: 'irow-edit' },
        h('div', { class: 'od-row' }, avatar(it.who, 'xs'), h('strong', null, 'Sửa ' + KIND[it.kind].split(' ·')[0].toLowerCase() + ' của ' + P[it.who].name)),
        h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'ed-text' }, it.kind === 'poll' ? 'Câu hỏi poll' : 'Nội dung'), ta, cErr),
        h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'ed-time' }, 'Mốc giây'),
          h('div', { class: 'od-row' }, tIn, h('span', { class: 'field-help', id: 'ed-time-help' }, 'Trong Part ' + p.n + ': ' + fmt(p.start + D.OPENING) + '–' + fmt(p.end - 1))), tErr),
        h('div', { class: 'od-row', style: 'justify-content:flex-end' },
          h('button', { class: 'btn btn--sm', onclick: () => { editing = null; renderList(); } }, 'Huỷ'),
          h('button', { class: 'btn btn--sm btn--primary', onclick: save }, 'Lưu thay đổi')));
      li.addEventListener('keydown', (e) => { if (e.key === 'Escape') { editing = null; renderList(); } });
      return li;
    }
    function focusEdit() { const ta = document.getElementById('ed-text'); if (ta) ta.focus(); }
    function toggle(it) {
      it.enabled = !it.enabled; markDirty(); renderList(); renderTimeline();
      const sw = document.querySelector('#row-' + it.id + ' .switch'); if (sw) sw.focus();
    }
    function doDelete(it) {
      const idx = S.script.indexOf(it);
      S.script.splice(idx, 1); confirmDel = null;
      if (selected === it.id) selected = S.script[0] ? S.script[0].id : null;
      markDirty(); renderList(); renderTimeline();
      App.toast('Đã xoá tương tác lúc ' + fmt(it.t), { label: 'Hoàn tác', onClick: () => { S.script.splice(idx, 0, it); renderList(); renderTimeline(); renderHead(); } });
    }
    function select(id, scroll) {
      selected = id; editing = null;
      renderList(); rp.focusItem(id);
      if (scroll) scrollToRow(id, true);
    }
    function scrollToRow(id, focusTs) {
      const r = document.getElementById('row-' + id);
      if (!r) return;
      r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (focusTs) { const b = r.querySelector('.ts'); if (b) b.focus({ preventScroll: true }); }
    }
    // During playback only the highlight moves, so an open edit row keeps what was typed.
    function markSelectedRow(id) {
      listCol.querySelectorAll('.irow.is-selected').forEach(r => r.classList.remove('is-selected'));
      const r = document.getElementById('row-' + id);
      if (r) { r.classList.add('is-selected'); r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    }

    function renderTimeline() { rp.refresh(); }

    function openPublish() {
      const on = enabledCount(), off = S.script.length - on;
      App.dialog((dlg, close) => {
        const body = h('div', { class: 'dlg-body' });
        const actions = h('div', { class: 'dlg-actions' });
        function confirmView() {
          body.innerHTML = ''; actions.innerHTML = '';
          body.append(h('h2', null, (cls.status === 'open' ? 'Cập nhật lớp “' : 'Mở lớp “') + cls.title + '”?'),
            h('ul', { class: 'summary-list' },
              h('li', null, h('span', null, 'Số part'), h('b', null, '4')),
              h('li', null, h('span', null, 'Tương tác đang bật'), h('b', null, String(on))),
              h('li', null, h('span', null, 'Tương tác đã tắt (học viên không thấy)'), h('b', null, String(off)))),
            h('p', { class: 'muted small' }, 'Sau khi mở, học viên vào lớp bằng link. Na, Khoa và chị Thư dùng đúng kịch bản bạn vừa duyệt.'));
          actions.append(h('button', { class: 'btn', onclick: close }, 'Quay lại duyệt'),
            h('button', { class: 'btn btn--primary', onclick: published }, cls.status === 'open' ? 'Cập nhật lớp' : 'Mở lớp'));
        }
        function published() {
          cls.status = 'open'; S.reviewDirty = false;
          const link = 'https://lop.video/' + cls.id + '-12a2';
          const input = h('input', { class: 'input mono', value: link, readonly: true, 'aria-label': 'Link lớp cho học viên', onfocus: (e) => e.target.select() });
          body.innerHTML = ''; actions.innerHTML = '';
          body.append(h('div', { class: 'od-row' }, h('span', { class: 'stage-ic', style: 'background:var(--ok);border-color:var(--ok);color:#fff' }, icon('check', 'ic--sm')), h('h2', null, 'Lớp đã mở')),
            h('p', { class: 'muted' }, 'Gửi link này cho học viên. Bạn sẽ thấy lớp hiểu tới đâu trong Dashboard khi có người học.'),
            h('div', { class: 'link-field' }, input,
              h('button', { class: 'btn', onclick: (e) => { const b = e.currentTarget; (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => { b.textContent = 'Đã chép'; }, () => { input.select(); b.textContent = 'Nhấn Ctrl+C'; }); } }, icon('copy', 'ic--sm'), 'Chép link')));
          actions.append(h('button', { class: 'btn', onclick: () => { close(); App.go('gv/classes'); } }, 'Về danh sách lớp'),
            h('button', { class: 'btn btn--primary', onclick: () => { close(); App.go('hv/join'); } }, 'Xem như học viên'));
          renderHead();
          const first = actions.querySelector('button'); if (first) first.focus();
        }
        confirmView();
        dlg.append(body, actions);
      });
    }

    renderHead(); renderList(); renderTimeline();
    if (previewMedia) previewMedia.ready.then(() => {
      const d = previewMedia.duration();
      if (d > 30) { App.timeline.fit(d); fitState = 'fitted'; } else fitState = 'nodur';
      renderHead(); renderList(); renderTimeline();
    }).catch(err => {
      fitState = 'failed'; fitError = err && err.message ? err.message : '';
      previewMedia = null;
      rp.useSim();
      if (App.timeline.isFitted()) App.timeline.reset();
      renderHead(); renderList(); renderTimeline();
    });
    if (jump && jump.state === 'publish') openPublish();
    return () => rp.destroy();
  };

  /* ================= Dashboard ================= */
  App.screens.dash = function (root, params) {
    const S = App.state;
    const cls = S.classes.find(c => c.id === params[0]) || S.classes[0];
    // Dashboard data was recorded on the prepared 08:30 lesson timeline.
    if (App.timeline.isFitted()) App.timeline.reset();
    const main = h('main', { class: 'page', id: 'main' });
    root.append(App.appBar(), main);
    main.append(h('div', { class: 'crumb' }, h('a', { href: '#/gv/classes' }, 'Lớp của tôi'), ' / ' + cls.title + ' / Học viên hiểu tới đâu'));

    if (!cls.learners) {
      const link = 'https://lop.video/' + cls.id + '-12a2';
      main.append(h('h1', { tabindex: '-1' }, cls.title + ' — chưa có dữ liệu'),
        h('div', { class: 'card empty', style: 'margin-top:24px' }, icon('users'),
          h('h2', null, 'Chưa có học viên nào học lớp này'),
          h('p', { class: 'muted', style: 'max-width:460px' }, 'Heatmap nhầm lẫn, câu hỏi thường gặp và mức Bloom theo concept sẽ hiện ở đây khi học viên bắt đầu học.'),
          h('div', { class: 'link-field', style: 'width:min(460px,100%)' }, h('input', { class: 'input mono', value: link, readonly: true, 'aria-label': 'Link lớp' }),
            h('button', { class: 'btn', onclick: (e) => { if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {}); e.currentTarget.textContent = 'Đã chép'; } }, 'Chép link')),
          h('a', { class: 'btn btn--ghost', href: '#/gv/review/' + cls.id }, 'Xem lại kịch bản')));
      return;
    }

    const filters = { confused: true, pollWrong: true, hand: true };
    const TYPE = { confused: ['Khó hiểu', 'confused'], pollWrong: ['Poll sai', 'poll'], hand: ['Giơ tay', 'hand'] };
    const dur = D.LESSON.duration;
    const total = (b) => (filters.confused ? b.confused : 0) + (filters.pollWrong ? b.pollWrong : 0) + (filters.hand ? b.hand : 0);
    const peak = D.BINS.reduce((a, b) => (b.confused + b.hand + b.pollWrong > a.confused + a.hand + a.pollWrong ? b : a));
    const peakPart = D.partAt(peak.s);
    let sel = peak;

    const preview = App.lecture.create('Xem trước video tại điểm nóng');
    const tip = h('div', { class: 'tooltip', hidden: true, role: 'tooltip' });
    document.body.append(tip);
    const heat = h('div');
    const drill = h('section', { class: 'card card-pad drill', 'aria-live': 'polite' });

    main.append(
      h('div', { class: 'dash-head' },
        h('h1', { tabindex: '-1' }, 'Lớp kẹt nhiều nhất ở ' + fmt(peak.s) + ' — ' + peakPart.concept),
        h('p', { class: 'muted', style: 'margin-top:6px' }, D.DASH.learners + ' học viên · ' + D.DASH.completed + ' hoàn thành · cập nhật ' + cls.updated)),
      h('div', { class: 'dash-tools' },
        h('span', { class: 'small muted' }, 'Hiện sự kiện:'),
        Object.keys(TYPE).map(k => h('label', { class: 'filter' }, h('input', { type: 'checkbox', checked: true, onchange: (e) => { filters[k] = e.target.checked; renderHeat(); renderDrill(); } }), icon(TYPE[k][1], 'ic--sm'), TYPE[k][0])),
        h('span', { class: 'od-fill' }),
        h('a', { class: 'btn btn--sm', href: '#/gv/review/' + cls.id }, icon('edit', 'ic--sm'), 'Sửa kịch bản')),
      h('section', { class: 'card heat-card', 'aria-label': 'Heatmap nhầm lẫn trên timeline video' }, heat),
      h('div', { class: 'dash-grid' }, drill, conceptTable()));

    function color(v, max) {
      if (!v) return '#eef0f3';
      const steps = ['#d4e7f7', '#a9cdee', '#6fa8dc', '#3a78bf', '#1d4e8f'];
      return steps[Math.min(4, Math.floor(v / (max + 0.001) * 5))];
    }
    function renderHeat() {
      heat.innerHTML = '';
      const max = Math.max.apply(null, D.BINS.map(total));
      const markers = h('div', { class: 'heat-markers', 'aria-hidden': 'true' },
        D.DASH.events.filter(e => filters[e.type]).map(e => h('span', { class: 'heat-marker heat-marker--' + e.type, style: 'left:' + (e.t / dur * 100) + '%' }, icon(TYPE[e.type][1]), String(e.n))));
      const strip = h('div', { class: 'heat-strip', role: 'group', 'aria-label': 'Các đoạn 10 giây, bấm để xem chi tiết' }, D.BINS.map(b => {
        const v = total(b);
        const label = fmt(b.s) + '–' + fmt(b.e) + ': ' + b.confused + ' khó hiểu, ' + b.hand + ' giơ tay, ' + b.pollWrong + ' poll sai';
        const btn = h('button', { class: 'heat-bin' + (sel === b ? ' is-selected' : ''), style: '--heat:' + color(v, max), 'aria-label': label, 'aria-pressed': String(sel === b),
          onclick: () => { sel = b; renderHeat(); renderDrill(); } });
        const show = (x, y) => { tip.hidden = false; tip.textContent = label; tip.style.left = Math.min(x + 12, window.innerWidth - 300) + 'px'; tip.style.top = (y - 40) + 'px'; };
        btn.addEventListener('mousemove', (e) => show(e.clientX, e.clientY));
        btn.addEventListener('mouseleave', () => { tip.hidden = true; });
        btn.addEventListener('focus', () => { const r = btn.getBoundingClientRect(); show(r.left, r.top); });
        btn.addEventListener('blur', () => { tip.hidden = true; });
        return btn;
      }));
      heat.append(markers, strip,
        h('div', { class: 'heat-parts' }, D.PARTS.map(p => h('span', { style: 'flex:' + (p.end - p.start), title: 'Part ' + p.n + ' · ' + p.title }, 'Part ' + p.n + ' · ' + p.title))),
        h('div', { class: 'heat-legend' }, 'Ít', ['#d4e7f7', '#a9cdee', '#6fa8dc', '#3a78bf', '#1d4e8f'].map(c => h('i', { style: 'background:' + c })), 'Nhiều sự kiện nhầm lẫn · rê chuột hoặc dùng Tab để xem số liệu, bấm để xem chi tiết'));
    }
    function renderDrill() {
      drill.innerHTML = '';
      const p = D.partAt(sel.s);
      const hs = D.DASH.hotspots.find(x => sel.s >= x.s && sel.s < x.e);
      const cs = D.DASH.concepts.find(c => c.part === p.n);
      App.lecture.render(preview, sel.s + 5);
      const sum = cs.bloom.reduce((a, b) => a + b, 0);
      drill.append(
        h('h2', null, fmt(sel.s) + '–' + fmt(sel.e) + ' · Part ' + p.n),
        h('p', { class: 'muted small' }, 'Concept: ' + p.concept),
        h('div', { class: 'drill-stats' },
          h('div', { class: 'stat od-stat' }, h('span', { class: 'stat-num' }, String(sel.confused)), h('span', { class: 'stat-label' }, 'lượt Khó hiểu')),
          h('div', { class: 'stat od-stat' }, h('span', { class: 'stat-num' }, String(sel.hand)), h('span', { class: 'stat-label' }, 'lượt giơ tay')),
          h('div', { class: 'stat od-stat' }, h('span', { class: 'stat-num' }, String(sel.pollWrong)), h('span', { class: 'stat-label' }, 'poll sai'))),
        h('div', { class: 'preview-video', style: 'margin-bottom:8px' }, preview),
        h('div', { class: 'od-row', style: 'margin-bottom:16px' }, h('span', { class: 'small muted od-fill' }, 'Khung hình tại ' + fmt(sel.s + 5)),
          h('button', { class: 'ts', onclick: () => App.lecture.render(preview, sel.s) }, 'Tua tới ' + fmt(sel.s))),
        h('h3', null, 'Câu học viên đã hỏi ở đoạn này'),
        hs ? h('ul', { class: 'qlist' }, hs.questions.map(q => h('li', null, h('span', null, q.q), h('b', { class: 'od-nowrap' }, q.n + ' lượt'))))
          : h('p', { class: 'muted small', style: 'margin-top:6px' }, 'Chưa có câu hỏi nào ở đoạn này.'),
        h('h3', { style: 'margin-top:16px' }, 'Mức Bloom lớp đạt — ' + p.concept),
        h('div', { class: 'bloom-bars' }, cs.bloom.map((n, i) => h('div', { class: 'bloom-bar' }, h('span', null, D.BLOOM[i]),
          h('span', { class: 'track' }, h('span', { style: 'width:' + (n / sum * 100) + '%' })), h('span', { class: 'mono' }, String(n))))));
    }
    function conceptTable() {
      return h('section', { class: 'card card-pad' }, h('h2', null, 'Theo concept'),
        h('div', { class: 'table-scroll', style: 'margin-top:12px' }, h('table', { class: 'ctable' },
          h('thead', null, h('tr', null, h('th', null, 'Concept'), h('th', null, 'Đạt poll'), h('th', null, 'Bloom phổ biến'), h('th', null, 'Cần xem lại'), h('th', null, h('span', { class: 'sr-only' }, 'Thao tác')))),
          h('tbody', null, D.DASH.concepts.map(c => {
            const p = D.partByN(c.part);
            const top = c.bloom.indexOf(Math.max.apply(null, c.bloom));
            return h('tr', null, h('td', null, h('strong', null, p.concept), h('br'), h('span', { class: 'muted small' }, 'Part ' + p.n)),
              h('td', { class: 'mono' }, c.pass + '%'), h('td', null, D.BLOOM[top]), h('td', null, c.review + ' HV'),
              h('td', null, h('button', { class: 'btn btn--sm', onclick: () => { sel = D.BINS.find(b => b.s >= p.start + D.OPENING) || D.BINS[0]; const hs = D.DASH.hotspots.find(x => x.part === p.n); if (hs) sel = D.BINS.find(b => b.s >= hs.s) || sel; renderHeat(); renderDrill(); drill.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }, 'Xem')));
          })))));
    }
    renderHeat(); renderDrill();
    return () => tip.remove();
  };
})();
