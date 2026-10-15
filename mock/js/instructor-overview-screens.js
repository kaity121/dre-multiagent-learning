/* instructor-overview-screens.js — Giảng viên: teaching overview (KPIs, to-do,
   biggest sticking point, how the AI classroom teaches) and learning reports
   (per-class table + Bloom level reference). */
(function () {
  const App = window.App, D = App.data;
  const { h, fmt, icon, avatar } = App.util;

  const BLOOM_DESC = [
    'Nhắc lại định nghĩa, ký hiệu, đơn vị',
    'Giải thích bằng lời của mình, nhận ra ví dụ',
    'Dùng công thức cho một tình huống cụ thể',
    'So sánh, tìm chỗ sai trong một lập luận',
    'Chọn phe và bảo vệ bằng lý do',
    'Tự đặt bài toán / ví dụ mới'
  ];
  App.BLOOM_DESC = BLOOM_DESC;

  function weakest() {
    const c = D.DASH.concepts.reduce((a, b) => (b.pass < a.pass ? b : a));
    return { part: D.partByN(c.part), pass: c.pass, review: c.review };
  }

  /* ================= Overview ================= */
  App.screens.overview = function (root) {
    const S = App.state;
    const open = S.classes.filter(c => c.status === 'open');
    const drafts = S.classes.filter(c => c.status === 'draft');
    const learners = open.reduce((a, c) => a + (c.learners || 0), 0);
    const completed = open.reduce((a, c) => a + (c.completed || 0), 0);
    const w = weakest();
    const hs = D.DASH.hotspots[0];

    const todo = [];
    const job = App.build.job;
    if (job && job.status === 'running') todo.push(['clock', 'Đang dựng lớp “' + job.title + '”', 'Hệ thống sẽ báo khi xong — bạn có thể làm việc khác.', 'Xem tiến trình', '#/gv/build']);
    if (job && job.status === 'error') todo.push(['alert', 'Dựng lớp “' + job.title + '” gặp lỗi', 'Một giai đoạn cần thử lại; phần đã xong được giữ nguyên.', 'Thử lại', '#/gv/build']);
    drafts.forEach(c => todo.push(['edit', 'Duyệt kịch bản “' + c.title + '”', S.script.length + ' tương tác do AI soạn đang chờ bạn duyệt trước khi mở lớp.', 'Duyệt kịch bản', '#/gv/review/' + c.id]));
    open.filter(c => !c.learners).forEach(c => todo.push(['link', 'Gửi link lớp “' + c.title + '”', 'Lớp đã mở nhưng chưa có học viên nào vào học.', 'Lấy link', '#/gv/dash/' + c.id]));
    todo.push(['target', 'Xem lại concept “' + w.part.concept + '”', 'Chỉ ' + w.pass + '% học viên đạt poll, ' + w.review + ' em cần xem lại.', 'Xem điểm kẹt', '#/gv/dash/ddh']);

    const stat = (num, label, hint) => h('div', { class: 'card metric od-stat' }, h('span', { class: 'metric-num' }, num), h('span', { class: 'metric-label' }, label), hint ? h('span', { class: 'metric-hint' }, hint) : null);

    root.append(App.appBar(), h('main', { class: 'page', id: 'main' },
      h('div', { class: 'page-head' },
        h('div', null, h('div', { class: 'crumb' }, 'Tổng quan giảng dạy · Học kỳ I'), h('h1', { tabindex: '-1' }, 'Chào thầy Minh'),
          h('p', { class: 'muted' }, 'Video đứng yên, lớp học thay đổi: mỗi video được dựng thành một buổi học có bạn học AI và trợ giảng.')),
        h('a', { class: 'btn btn--primary', href: '#/gv/new' }, icon('plus'), 'Tạo lớp mới')),
      h('div', { class: 'metrics metrics--4' },
        stat(String(open.length), 'Lớp đang mở', drafts.length ? drafts.length + ' lớp nháp chờ duyệt' : null),
        stat(String(learners), 'Học viên đã vào học', null),
        stat(learners ? Math.round(completed / learners * 100) + '%' : '—', 'Hoàn thành buổi học', completed + '/' + learners + ' học viên'),
        stat(w.pass + '%', 'Đạt ở concept yếu nhất', w.part.concept)),
      h('div', { class: 'ov-grid' },
        h('section', { class: 'card card-pad', 'aria-labelledby': 'todo-h' },
          h('h2', { id: 'todo-h' }, 'Việc cần làm'),
          h('ul', { class: 'todo-list' }, todo.map(([ic, title, desc, cta, href]) => h('li', { class: 'todo' },
            h('span', { class: 'todo-ic', 'aria-hidden': 'true' }, icon(ic)),
            h('div', { class: 'od-field od-fill' }, h('strong', null, title), h('span', { class: 'small muted' }, desc)),
            h('a', { class: 'btn btn--sm', href }, cta))))),
        h('section', { class: 'card card-pad', 'aria-labelledby': 'hot-h' },
          h('h2', { id: 'hot-h' }, 'Điểm kẹt lớn nhất tuần này'),
          h('p', { class: 'muted small', style: 'margin-top:4px' }, 'Dao động điều hoà · ' + fmt(hs.s) + '–' + fmt(hs.e) + ' · ' + D.partByN(hs.part).concept),
          h('h3', { style: 'margin-top:16px' }, 'Học viên hỏi nhiều nhất'),
          h('ul', { class: 'qlist' }, hs.questions.map(q => h('li', null, h('span', null, q.q), h('b', { class: 'od-nowrap' }, q.n + ' lượt')))),
          h('div', { class: 'od-row', style: 'margin-top:16px;justify-content:flex-end' }, h('a', { class: 'btn btn--primary btn--sm', href: '#/gv/dash/ddh' }, 'Mở dashboard hiểu bài')))),
      h('section', { class: 'card card-pad', style: 'margin-top:16px', 'aria-labelledby': 'how-h' },
        h('h2', { id: 'how-h' }, 'Lớp học AI dạy học viên như thế nào'),
        h('div', { class: 'how-grid' },
          h('div', { class: 'how' }, h('div', { class: 'how-cast' }, avatar('na', 'sm'), avatar('khoa', 'sm'), avatar('thu', 'sm')),
            h('strong', null, 'Ba vai trong lớp'),
            h('p', { class: 'small muted' }, 'Na hỏi “vì sao”, Khoa cố tình hiểu sai để học viên sửa, chị Thư trả lời bám video và slide kèm mốc giây.')),
          h('div', { class: 'how' }, h('span', { class: 'todo-ic' }, icon('clock')),
            h('strong', null, 'Nhịp không làm phiền'),
            h('p', { class: 'small muted' }, 'Video chạy liên tục; tối đa một lần dừng mỗi part; không chèn gì trong ' + D.OPENING + ' giây đầu part.')),
          h('div', { class: 'how' }, h('span', { class: 'todo-ic' }, icon('target')),
            h('strong', null, 'Leo thang Bloom'),
            h('p', { class: 'small muted' }, 'Trả lời đúng → câu khó hơn ở part sau; sai → xem lại có dẫn dắt, xem bạn làm mẫu rồi thử lại.'))),
        bloomLadder())));
  };

  function bloomLadder() {
    return h('ol', { class: 'bloom-ladder', 'aria-label': 'Sáu mức Bloom' }, D.BLOOM.map((b, i) => h('li', null,
      h('span', { class: 'bloom-step' }, String(i + 1)), h('div', { class: 'od-field' }, h('strong', null, b), h('span', { class: 'small muted' }, BLOOM_DESC[i])))));
  }

  /* ================= Learning reports ================= */
  App.screens.reports = function (root) {
    const S = App.state;
    const w = weakest();
    const rows = S.classes.map(c => {
      const hasData = c.status === 'open' && c.learners;
      return h('tr', null,
        h('td', null, h('strong', null, c.title), h('br'), h('span', { class: 'small muted' }, c.subject)),
        h('td', null, h('span', { class: 'tag ' + (c.status === 'open' ? 'tag--ok' : c.status === 'draft' ? 'tag--warn' : 'tag--accent') }, c.status === 'open' ? 'Đã mở' : c.status === 'draft' ? 'Nháp' : 'Đang dựng')),
        h('td', { class: 'mono' }, hasData ? String(c.learners) : '—'),
        h('td', { class: 'mono' }, hasData ? Math.round(c.completed / c.learners * 100) + '%' : '—'),
        h('td', null, hasData ? w.part.concept + ' (' + w.pass + '% đạt)' : h('span', { class: 'muted' }, 'Chưa có dữ liệu')),
        h('td', null, c.status === 'open' ? h('a', { class: 'btn btn--sm', href: '#/gv/dash/' + c.id }, 'Xem báo cáo')
          : c.status === 'draft' ? h('a', { class: 'btn btn--sm', href: '#/gv/review/' + c.id }, 'Duyệt kịch bản') : h('a', { class: 'btn btn--sm', href: '#/gv/build' }, 'Xem tiến trình')));
    });
    root.append(App.appBar(), h('main', { class: 'page', id: 'main' },
      h('div', { class: 'page-head' },
        h('div', null, h('div', { class: 'crumb' }, 'Báo cáo học tập'), h('h1', { tabindex: '-1' }, 'Học viên hiểu tới đâu'),
          h('p', { class: 'muted' }, 'Mỗi lớp có heatmap nhầm lẫn trên timeline video, câu hỏi thường gặp và mức Bloom đạt được theo concept.'))),
      h('section', { class: 'card card-pad' }, h('div', { class: 'table-scroll' },
        h('table', { class: 'ctable' },
          h('thead', null, h('tr', null, ['Lớp', 'Trạng thái', 'Học viên', 'Hoàn thành', 'Concept yếu nhất', ''].map(t => h('th', null, t || h('span', { class: 'sr-only' }, 'Thao tác'))))),
          h('tbody', null, rows)))),
      h('section', { class: 'card card-pad', style: 'margin-top:16px', 'aria-labelledby': 'bl-h' },
        h('h2', { id: 'bl-h' }, 'Thang Bloom dùng trong báo cáo'),
        h('p', { class: 'small muted', style: 'margin-top:4px' }, 'Mỗi tương tác trong kịch bản được gắn một mức; mức cao nhất học viên trả lời đúng là mức đạt được của concept.'),
        bloomLadder())));
  };
})();
