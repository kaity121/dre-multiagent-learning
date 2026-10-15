/* lecture-video.js — simulated lecture video. Draws one SVG frame for any video
   time t (chalkboard + animated oscillation + board notes), so pausing,
   seeking and guided replays all behave like a real player. */
(function () {
  const App = window.App, D = App.data;
  const NS = 'http://www.w3.org/2000/svg';
  const BG = '#1f2a27', CHALK = '#eef2ee', DIM = '#9fb0aa', MASS = '#5aa9a0', HL = '#f2c94c';

  function create(label) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 1280 720');
    s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', label || 'Video bài giảng (mô phỏng) — Dao động điều hoà');
    return s;
  }

  const text = (x, y, str, size, fill, extra) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="system-ui, Segoe UI, sans-serif" ${extra || ''}>${str}</text>`;

  function spring(x0, x1, y) {
    const n = 12, amp = 18, step = (x1 - x0) / n;
    let d = `M${x0},${y}`;
    for (let i = 1; i < n; i++) d += ` L${(x0 + step * i).toFixed(1)},${y + (i % 2 ? -amp : amp)}`;
    return d + ` L${x1},${y}`;
  }

  function sceneP1(t) {
    const xm = 420 + 170 * Math.cos(Math.PI * t);
    return `<rect x="80" y="250" width="20" height="160" fill="#56635f"/>
      <path d="${spring(100, xm - 40, 330)}" stroke="${CHALK}" stroke-width="4" fill="none"/>
      <rect x="${xm - 40}" y="290" width="80" height="80" rx="6" fill="${MASS}"/>
      <line x1="200" y1="430" x2="660" y2="430" stroke="${DIM}" stroke-width="2"/>
      ${[[250, '−A'], [420, 'O'], [590, '+A']].map(([x, l]) => `<line x1="${x}" y1="420" x2="${x}" y2="440" stroke="${DIM}" stroke-width="2"/>${text(x - 14, 474, l, 28, CHALK)}`).join('')}
      <path d="M420,520 H590" stroke="${HL}" stroke-width="3" marker-end="url(#arr)"/>${text(480, 556, 'A', 28, HL)}`;
  }
  function sceneP2(t) {
    const a = Math.PI * (t - 120), cx = 400, cy = 320, r = 150;
    const px = cx + r * Math.cos(a), py = cy - r * Math.sin(a);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${DIM}" stroke-width="2" fill="none"/>
      <line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="${CHALK}" stroke-width="3"/>
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="12" fill="${MASS}"/>
      <line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="540" stroke="${DIM}" stroke-width="2" stroke-dasharray="6 6"/>
      <line x1="220" y1="540" x2="580" y2="540" stroke="${DIM}" stroke-width="2"/>
      <circle cx="${px.toFixed(1)}" cy="540" r="12" fill="${HL}"/>
      ${text(cx + 18, cy - 14, 'ω', 34, HL)}${text(230, 590, 'hình chiếu = dao động điều hoà', 22, DIM)}`;
  }
  function curve(cy, amp, phase) {
    let d = '';
    for (let i = 0; i <= 80; i++) { const u = i / 80; d += (i ? ' L' : 'M') + (90 + 640 * u).toFixed(1) + ',' + (cy - amp * Math.cos(4 * Math.PI * u + phase)).toFixed(1); }
    return d;
  }
  function sceneP3(t) {
    const u = ((t - 270) % 4) / 4, cy = 380, amp = 140, ph = Math.PI / 3;
    const x = 90 + 640 * u, y = cy - amp * Math.cos(4 * Math.PI * u + ph);
    return `<line x1="90" y1="${cy}" x2="740" y2="${cy}" stroke="${DIM}" stroke-width="2"/>
      <line x1="90" y1="200" x2="90" y2="560" stroke="${DIM}" stroke-width="2"/>
      <path d="${curve(cy, amp, ph)}" stroke="${CHALK}" stroke-width="3" fill="none"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="${MASS}"/>
      <path d="M70,${cy} V${cy - amp}" stroke="${HL}" stroke-width="3"/>${text(36, cy - amp / 2, 'A', 28, HL)}
      ${text(700, cy + 36, 't', 26, DIM)}${text(100, 196, 'x', 26, DIM)}`;
  }
  function sceneP4(t) {
    const c = Math.cos(Math.PI * t), s = Math.sin(Math.PI * t);
    const x = 410 + 200 * c, v = -s; // normalised velocity
    const arrow = 140 * v;
    let tag = '';
    if (Math.abs(c) < 0.18) tag = text(x - 50, 470, 'v max', 26, HL);
    else if (Math.abs(c) > 0.94) tag = text(x - 50, 470, 'a max, v = 0', 26, HL);
    return `<path d="${curve(250, 90, 0)}" stroke="${DIM}" stroke-width="2" fill="none"/>${text(96, 150, 'x(t)', 22, DIM)}
      <line x1="170" y1="540" x2="650" y2="540" stroke="${DIM}" stroke-width="2"/>
      ${[[210, 'biên'], [410, 'O'], [610, 'biên']].map(([px, l]) => `<line x1="${px}" y1="530" x2="${px}" y2="550" stroke="${DIM}" stroke-width="2"/>${text(px - 20, 590, l, 22, CHALK)}`).join('')}
      <circle cx="${x.toFixed(1)}" cy="540" r="16" fill="${MASS}"/>
      ${Math.abs(arrow) > 8 ? `<path d="M${x.toFixed(1)},500 H${(x + arrow).toFixed(1)}" stroke="${CHALK}" stroke-width="4" marker-end="url(#arr)"/>${text((x + arrow / 2 - 8).toFixed(1), 490, 'v', 24, CHALK)}` : ''}
      ${tag}`;
  }
  const SCENES = { 1: sceneP1, 2: sceneP2, 3: sceneP3, 4: sceneP4 };

  function board(part, t, focus) {
    const notes = D.TRANSCRIPT.filter(l => l.board && l.t >= part.start && l.t < part.end && l.t <= t);
    return notes.map((l, i) => {
      const y = 220 + i * 70;
      const on = focus && l.board === focus;
      return (on ? `<rect x="796" y="${y - 40}" width="440" height="56" rx="6" fill="none" stroke="${HL}" stroke-width="3"/>${text(800, y - 48, 'Chú ý', 18, HL, 'font-weight="700"')}` : '') +
        text(812, y, l.board, 30, on ? HL : CHALK, 'font-weight="600"');
    }).join('');
  }

  function poster() {
    return `<rect width="1280" height="720" fill="${BG}"/>
      ${text(640, 300, 'Dao động điều hoà', 72, CHALK, 'text-anchor="middle" font-weight="700"')}
      ${text(640, 360, 'Vật lý 12 · Thầy Minh · 4 part · 08:30', 28, DIM, 'text-anchor="middle"')}
      ${text(640, 450, 'Buổi học bắt đầu sau khi cả lớp điểm danh', 26, CHALK, 'text-anchor="middle"')}`;
  }

  function frame(t, o) {
    o = o || {};
    if (o.poster) return poster();
    const part = D.partAt(t);
    return `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${o.arrowFill || CHALK}"/></marker></defs>
      <rect width="1280" height="720" fill="${BG}"/>
      ${text(60, 70, D.LESSON.subject + ' · ' + D.LESSON.title + ' · Part ' + part.n, 22, DIM)}
      ${text(60, 120, part.title, 40, CHALK, 'font-weight="700"')}
      <line x1="770" y1="160" x2="770" y2="620" stroke="#33413c" stroke-width="2"/>
      ${SCENES[part.n](t)}
      ${board(part, t, o.focus)}
      <circle cx="980" cy="74" r="24" fill="#3a4a45"/>${text(970, 83, 'M', 24, CHALK, 'font-weight="700"')}
      ${text(1016, 70, D.LESSON.teacher, 22, CHALK, 'font-weight="600"')}${text(1016, 96, 'Video bài giảng (mô phỏng)', 16, DIM)}`;
  }

  function render(svg, t, o) { svg.innerHTML = frame(t, o); }

  App.lecture = { create, render };
})();
