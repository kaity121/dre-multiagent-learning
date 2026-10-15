/* learner-entry-screens.js — Học viên: join gate (name only), two calibration
   screens, class summary after "Tan lớp", and the completed state. */
(function () {
  const App = window.App, D = App.data;
  const { h, fmt, icon, avatar, initialOf } = App.util;
  const learnerBar = () => App.appBar({ role: 'Học viên', home: '#/hv/join' });

  /* ================= Join gate ================= */
  App.screens.join = function (root) {
    const S = App.state;
    const sess = S.session && !S.session.ended && S.session.started ? S.session : null;
    const selfAv = h('span', { class: 'av av--me av--lg', 'aria-hidden': 'true' }, initialOf(S.learner.name || 'B'));
    const selfLabel = h('span', { class: 'label' }, S.learner.name || 'Bạn');
    const err = h('div', { class: 'field-error', id: 'name-err', role: 'alert' });
    const input = h('input', { class: 'input', id: 'learner-name', value: S.learner.name, autocomplete: 'name', 'aria-required': 'true', 'aria-describedby': 'name-err', placeholder: 'Ví dụ: Minh Anh' });
    const go = h('button', { class: 'btn btn--primary', type: 'button', disabled: !S.learner.name.trim(), onclick: () => enter() }, 'Vào lớp');
    input.addEventListener('input', () => {
      const v = input.value.trim();
      go.disabled = !v;
      selfAv.textContent = initialOf(v || 'B');
      selfLabel.textContent = v || 'Bạn';
      if (v) { err.textContent = ''; input.removeAttribute('aria-invalid'); }
    });
    input.addEventListener('blur', () => { if (!input.value.trim()) { err.textContent = 'Nhập tên để vào lớp — tên chỉ dùng để bạn học AI gọi bạn.'; input.setAttribute('aria-invalid', 'true'); } });
    function enter() {
      const v = input.value.trim();
      if (!v) { err.textContent = 'Nhập tên để vào lớp.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      S.learner.name = v; S.session = null;
      App.go('hv/calibrate/1');
    }
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); enter(); } });
    const form = h('div', { class: 'gate-form', role: 'form', 'aria-label': 'Vào lớp' },
      h('div', null, h('div', { class: 'crumb' }, 'Bạn được mời vào lớp'), h('h1', { tabindex: '-1' }, D.LESSON.title),
        h('div', { class: 'lesson-meta', style: 'margin-top:6px' }, h('span', null, D.LESSON.subject), h('span', null, '· ' + D.LESSON.teacher), h('span', null, '· 4 part'), h('span', null, '· khoảng 8 phút rưỡi'))),
      h('div', { class: 'goal-box' }, h('div', { class: 'goal-title' }, 'Sau buổi học, bạn sẽ:'),
        h('ol', { class: 'goal-list' }, D.PARTS.map(p => h('li', null, h('span', { class: 'goal-n' }, 'P' + p.n), h('span', null, p.goal))))),
      sess ? h('div', { class: 'banner banner--info', style: 'margin:0' }, icon('clock'),
        h('span', { class: 'od-fill' }, 'Bạn đang học dở ở Part ' + D.partAt(sess.t).n + ' · ' + fmt(sess.t) + '.'),
        h('button', { class: 'btn btn--sm btn--primary', type: 'button', onclick: () => App.go('hv/room') }, 'Tiếp tục')) : null,
      h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'learner-name' }, 'Tên của bạn ', h('span', { class: 'req', 'aria-hidden': 'true' }, '*')), input, err),
      h('div', { class: 'od-row' }, go, h('span', { class: 'muted small' }, sess ? 'Vào lớp sẽ bắt đầu lại từ đầu.' : 'Không cần tài khoản.')));
    root.append(learnerBar(), h('main', { class: 'gate', id: 'main' },
      h('div', { class: 'card gate-card' },
        h('div', { class: 'gate-preview', 'aria-label': 'Xem trước ô của bạn' },
          h('div', { class: 'self-tile' }, selfAv, selfLabel),
          h('div', { class: 'waiting-peers' }, avatar('na', 'sm'), avatar('khoa', 'sm'), avatar('thu', 'sm'),
            h('span', { class: 'waiting-text' }, 'Na, Khoa (bạn học AI) và chị Thư (trợ giảng AI) đang chờ trong lớp')),
          h('p', { class: 'small', style: 'color:var(--stage-muted)' }, 'Video chạy liên tục. Bình luận nằm cạnh video, không che bài giảng. Muốn hỏi thì giơ tay.')),
        form)));
  };

  /* ================= Calibration (2 screens) ================= */
  const CALIB = {
    1: { key: 'level', q: 'Bạn đã học bài này chưa?', sub: 'Chị chọn độ khó câu hỏi khởi đầu theo câu trả lời của bạn.', options: [
      { v: 'new', title: 'Mới học', desc: 'Lần đầu gặp bài này', bars: 1 },
      { v: 'hoc', title: 'Đã học', desc: 'Đã học trên lớp, cần củng cố', bars: 2 },
      { v: 'on', title: 'Đang ôn luyện', desc: 'Ôn thi, muốn luyện câu khó hơn', bars: 3 }] },
    2: { key: 'style', q: 'Bạn thích chị giải thích kiểu nào?', sub: 'Chị Thư và Na sẽ trả lời theo kiểu này. Đổi được khi hỏi “Cho ví dụ khác”.', options: [
      { v: 'short', title: 'Ngắn gọn', desc: 'Một hai câu, vào thẳng ý chính', glyph: 'Aa' },
      { v: 'example', title: 'Ví dụ đời thường', desc: 'Liên hệ xích đu, đồng hồ, xe đạp…', glyph: '≈' },
      { v: 'formula', title: 'Từng bước công thức', desc: 'Bước 1, bước 2… kèm công thức', glyph: 'ƒ' }] }
  };
  App.screens.calibrate = function (root, params) {
    const S = App.state;
    if (!S.learner.name) { App.go('hv/join'); return; }
    const n = +params[0], c = CALIB[n];
    const go = () => {
      if (n === 1) App.go('hv/calibrate/2');
      else { S.director.bloom = App.LEVEL_START_BLOOM[S.learner.level]; S.session = null; App.go('hv/room'); }
    };
    const skip = () => { S.learner.level = 'hoc'; S.learner.style = 'example'; S.director.bloom = 1; S.session = null; App.toast('Dùng mặc định: Đã học · Ví dụ đời thường'); App.go('hv/room'); };
    const list = h('fieldset', { class: 'choice-list' }, h('legend', { class: 'sr-only' }, c.q),
      c.options.map(o => h('label', { class: 'choice' },
        h('input', { type: 'radio', name: c.key, value: o.v, checked: S.learner[c.key] === o.v, onchange: () => { S.learner[c.key] = o.v; } }),
        o.bars ? h('span', { class: 'level-ic', 'aria-hidden': 'true' }, [1, 2, 3].map(i => h('i', { class: i <= o.bars ? 'on' : '' })))
          : h('span', { class: 'style-ic', 'aria-hidden': 'true' }, o.glyph),
        h('span', { class: 'od-field' }, h('span', { class: 'choice-title' }, o.title), h('span', { class: 'choice-desc' }, o.desc)),
        h('span', { class: 'choice-check', 'aria-hidden': 'true' }, icon('check', 'ic--sm')))));
    root.append(learnerBar(), h('main', { class: 'calib', id: 'main' },
      h('div', { class: 'calib-top' },
        h('button', { class: 'btn btn--sm btn--ghost', 'aria-label': 'Quay lại', onclick: () => App.go(n === 1 ? 'hv/join' : 'hv/calibrate/1') }, icon('back')),
        h('div', { class: 'calib-progress', role: 'progressbar', 'aria-label': 'Hiệu chỉnh', 'aria-valuemin': 1, 'aria-valuemax': 2, 'aria-valuenow': n, 'aria-valuetext': 'Bước ' + n + ' trên 2' },
          h('span', { style: 'width:' + (n * 50) + '%' })),
        h('span', { class: 'small muted' }, n + '/2')),
      h('div', { class: 'calib-main' },
        h('div', { class: 'asker' }, avatar('thu'),
          h('div', { class: 'asker-bubble' }, h('div', { class: 'small muted' }, 'chị Thư · trợ giảng AI'), h('h1', { tabindex: '-1' }, c.q), h('p', { class: 'muted small', style: 'margin-top:4px' }, c.sub))),
        list),
      h('div', { class: 'calib-foot' }, h('div', { class: 'calib-foot-inner' },
        h('button', { class: 'btn btn--ghost', onclick: skip }, 'Bỏ qua, dùng mặc định'),
        h('button', { class: 'btn btn--primary', onclick: go }, n === 1 ? 'Tiếp tục' : 'Vào phòng học')))));
  };

  /* ================= Summary ================= */
  function demoResults(allPass) {
    return { concepts: {
      1: { status: 'pass', bloom: 1 },
      2: allPass ? { status: 'pass', bloom: 2 } : { status: 'review', bloom: 1 },
      3: { status: 'pass', bloom: 2 },
      4: allPass ? { status: 'pass', bloom: 3 } : { status: 'unchecked', bloom: null } } };
  }
  App.screens.summary = function (root) {
    const S = App.state;
    const jump = App.takeJump();
    if (jump && jump.state === 'demo') S.results = demoResults(false);
    if (jump && jump.state === 'allPass') S.results = demoResults(true);
    if (!S.results) S.results = demoResults(false);
    if (S.session) S.session.ended = true;
    const C = S.results.concepts;
    const ok = D.PARTS.filter(p => C[p.n] && C[p.n].status === 'pass');
    const review = D.PARTS.filter(p => !C[p.n] || C[p.n].status !== 'pass');
    const topBloom = Math.max.apply(null, D.PARTS.map(p => (C[p.n] && C[p.n].bloom != null ? C[p.n].bloom : -1)));
    const ranges = review.map(p => ({ part: p.n, s: D.REMED[p.n].replay[0], e: D.REMED[p.n].replay[1], label: p.concept }));

    const scale = (b) => h('div', { class: 'bloom-scale', role: 'img', 'aria-label': b == null ? 'Chưa đạt mức Bloom nào' : 'Mức Bloom cao nhất: ' + D.BLOOM[b] + ', ' + (b + 1) + ' trên 6' },
      D.BLOOM.map((_, i) => h('i', { class: b != null && i <= b ? 'on' : '' })), h('span', null, b == null ? 'chưa kiểm tra' : 'Cao nhất: ' + D.BLOOM[b]));
    const reviewRow = (p) => {
      const r = D.REMED[p.n], c = C[p.n];
      return h('div', { class: 'crow' },
        h('div', null, h('div', { class: 'crow-name' }, p.concept), h('div', { class: 'small muted' }, 'Part ' + p.n + (c && c.status === 'unchecked' ? ' · chưa làm câu kiểm tra (đã tua qua hoặc bỏ qua)' : ' · chưa trả lời đúng sau khi bù hiểu')), scale(c ? c.bloom : null)),
        h('button', { class: 'ts', onclick: () => App.jump('hv/room', { state: 'review', ranges: [{ part: p.n, s: r.replay[0], e: r.replay[1], label: p.concept }] }), 'aria-label': 'Xem lại ' + fmt(r.replay[0]) + ' đến ' + fmt(r.replay[1]) }, fmt(r.replay[0]) + '–' + fmt(r.replay[1])));
    };
    const okRow = (p) => h('div', { class: 'crow' },
      h('div', null, h('div', { class: 'crow-name' }, p.concept), h('div', { class: 'small muted' }, 'Part ' + p.n), scale(C[p.n].bloom)),
      h('span', { class: 'tag tag--ok' }, icon('check', 'ic--sm'), 'Đã hiểu'));

    root.append(learnerBar(), h('main', { class: 'page page--narrow', id: 'main' },
      h('div', { class: 'crumb' }, 'Tan lớp · ' + D.LESSON.title),
      h('h1', { tabindex: '-1' }, review.length ? 'Bạn đã hiểu ' + ok.length + '/4 concept' : 'Bạn đã hiểu cả 4 concept'),
      h('p', { class: 'muted', style: 'margin-top:4px' }, 'Na, Khoa và chị Thư đã tổng hợp theo concept của bài. Mốc giây bấm được để xem lại đúng đoạn.'),
      h('div', { class: 'metrics' },
        h('div', { class: 'card metric od-stat' }, h('span', { class: 'metric-num' }, ok.length + '/4'), h('span', { class: 'metric-label' }, 'Concept đã hiểu')),
        h('div', { class: 'card metric od-stat' }, h('span', { class: 'metric-num' }, topBloom >= 0 ? D.BLOOM[topBloom] : '—'), h('span', { class: 'metric-label' }, 'Mức Bloom cao nhất')),
        h('div', { class: 'card metric od-stat' }, h('span', { class: 'metric-num' }, String(ranges.length)), h('span', { class: 'metric-label' }, 'Mốc nên xem lại'))),
      h('section', { class: 'card cgroup', 'aria-labelledby': 'g-ok' },
        h('div', { class: 'cgroup-head' }, h('h2', { id: 'g-ok', class: 'od-fill' }, 'Đã hiểu'), h('span', { class: 'tag tag--ok' }, String(ok.length))),
        ok.length ? ok.map(okRow) : h('p', { class: 'muted small', style: 'padding:14px 20px' }, 'Chưa có concept nào — không sao, bắt đầu từ các mốc bên dưới nhé.')),
      review.length ? h('section', { class: 'card cgroup', 'aria-labelledby': 'g-rv' },
        h('div', { class: 'cgroup-head' }, h('h2', { id: 'g-rv', class: 'od-fill' }, 'Cần xem lại'), h('span', { class: 'tag tag--warn' }, String(review.length))),
        review.map(reviewRow)) : null,
      h('div', { class: 'actions-bar' },
        review.length ? h('button', { class: 'btn', onclick: () => App.jump('hv/room', { state: 'review', ranges }) }, icon('replay', 'ic--sm'), 'Xem lại đoạn cần ôn') : null,
        h('button', { class: 'btn btn--primary', onclick: () => App.go('hv/done') }, 'Hoàn thành'))));
  };

  App.screens.done = function (root) {
    root.append(learnerBar(), h('main', { class: 'page page--narrow', id: 'main' },
      h('div', { class: 'card empty' }, icon('check'),
        h('h1', { tabindex: '-1' }, 'Đã hoàn thành buổi học'),
        h('p', { class: 'muted', style: 'max-width:440px' }, 'Kết quả đã được ghi lại cho giảng viên. Bạn có thể mở lại link lớp để xem lại bất cứ lúc nào.'),
        h('div', { class: 'od-row' }, h('a', { class: 'btn', href: '#/hv/summary' }, 'Xem lại tổng kết'), h('a', { class: 'btn btn--primary', href: '#/hv/join' }, 'Về trang lớp')))));
  };
})();
