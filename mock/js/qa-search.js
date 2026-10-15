/* qa-search.js — bank of typical learner questions for "Dao động điều hoà" plus an offline
   mock of semantic search, so chị Thư's answer depends on what the learner actually typed.
   No model or network: the "semantic" part is a hand-made concept dictionary
   (tần số góc ≈ omega ≈ w, biên độ ≈ A …) on top of TF-IDF cosine similarity, and the
   "fuzzy" part is typo-tolerant token matching (edit distance ≤ 1) plus character trigrams,
   which also makes typing without Vietnamese accents work.
   Cite times are on the prepared 08:30 timeline and are scaled with App.timeline.factor(). */
(function () {
  const App = window.App;

  // asked = how many learners asked something similar (mock usage data, shown as social proof)
  const BANK = [
    // Part 1 — biên độ A, chu kỳ T, tần số f
    { id: 'q-a-vs-t', part: 1, asked: 41, cite: 78, source: 'slide tr.2', q: 'Biên độ khác chu kỳ thế nào?',
      alt: ['phân biệt biên độ và chu kỳ', 'A với T khác nhau chỗ nào', 'biên độ với chu kỳ có giống nhau không'],
      short: 'Biên độ A là một khoảng cách (cm): từ vị trí cân bằng O ra tới biên. Chu kỳ T là một khoảng thời gian (s): thời gian đi hết một dao động toàn phần.',
      example: 'Xích đu lên cao tới đâu là biên độ; mất bao lâu để đi một lượt qua lại rồi về chỗ cũ là chu kỳ.' },
    { id: 'q-t-from', part: 1, asked: 33, cite: 78, source: 'slide tr.2', q: 'Một chu kỳ tính từ đâu tới đâu?',
      alt: ['dao động toàn phần là gì', 'đi từ biên này sang biên kia có phải một chu kỳ không', 'chu kỳ bắt đầu ở đâu'],
      short: 'Bắt đầu ở đâu cũng được, miễn là vật đi rồi quay về đúng vị trí đó và đúng chiều chuyển động ban đầu. Từ biên này sang biên kia mới là nửa chu kỳ.',
      example: 'Từ biên trái → biên phải → về lại biên trái là đủ một chu kỳ.' },
    { id: 'q-f', part: 1, asked: 19, cite: 96, source: 'slide tr.3', q: 'Tần số f khác chu kỳ T thế nào?',
      alt: ['f bằng 1 chia T là sao', 'tần số là gì', 'đơn vị hz là gì'],
      short: 'f là số dao động trong một giây (Hz), T là thời gian của một dao động (s). Hai đại lượng nghịch đảo nhau: f = 1/T.',
      example: 'T = 0,5 s nghĩa là mỗi giây vật dao động 2 lần, tức f = 2 Hz.' },
    { id: 'q-a-sign', part: 1, asked: 12, cite: 62, source: 'slide tr.2', q: 'Biên độ có âm được không?',
      alt: ['biên độ có thay đổi không', 'A có bao giờ bằng âm'],
      short: 'Không. Biên độ là khoảng cách nên luôn dương, và không đổi nếu bỏ qua ma sát. Li độ x mới có thể âm.',
      example: 'Vật ở bên trái O thì x âm, nhưng biên độ A vẫn là con số dương.' },

    // Part 2 — tần số góc ω
    { id: 'q-w-unit', part: 2, asked: 38, cite: 205, source: 'slide tr.4', q: 'Sao ω có đơn vị rad/s ạ?',
      alt: ['đơn vị của tần số góc', 'omega đơn vị gì', 'rad trên giây là gì'],
      short: 'ω là góc quét được trong mỗi giây trên vòng tròn tương ứng, góc đo bằng radian nên đơn vị là rad/s.',
      example: 'Kim quay được π rad mỗi giây thì ω = π rad/s.' },
    { id: 'q-2pi', part: 2, asked: 35, cite: 150, source: 'slide tr.4', q: '2π ở đâu ra ạ?',
      alt: ['tại sao lại là 2 pi', 'hai pi là gì', '2pi trong công thức omega'],
      short: '2π là góc của trọn một vòng tròn tính bằng radian. Dao động điều hoà là hình chiếu của chuyển động tròn đều, nên một dao động ứng với một vòng 2π.',
      example: 'Đi hết một vòng 2π mất T giây, nên mỗi giây quét được 2π/T — đó là ω.' },
    { id: 'q-w-vs-f', part: 2, asked: 27, cite: 225, source: 'slide tr.5', q: 'ω với f khác nhau chỗ nào?',
      alt: ['tần số góc và tần số khác gì', 'omega bằng 2 pi f', 'w với f giống nhau không'],
      short: 'Cùng một chuyển động nhưng hai cách đo: f đếm số vòng mỗi giây, ω đo góc quét mỗi giây. Vì một vòng là 2π nên ω = 2πf.',
      example: 'f = 2 Hz (2 vòng mỗi giây) thì ω = 2π × 2 = 4π rad/s.' },
    { id: 'q-w-calc', part: 2, asked: 22, cite: 248, source: 'slide tr.5', q: 'T = 2 s thì ω bằng bao nhiêu?',
      alt: ['tính omega khi biết chu kỳ', 'cách tính tần số góc', 'biết T tìm ω'],
      short: 'Dùng ω = 2π/T. Với T = 2 s: ω = 2π/2 = π rad/s.',
      example: 'T = 4 s thì ω = 2π/4 = π/2 rad/s.' },

    // Part 3 — phương trình x = A cos(ωt + φ)
    { id: 'q-phi', part: 3, asked: 36, cite: 322, source: 'slide tr.7', q: 'φ là gì ạ?',
      alt: ['pha ban đầu là gì', 'phi trong phương trình', 'phi dùng để làm gì'],
      short: 'φ là pha ban đầu: cho biết lúc t = 0 vật đang ở đâu và đi theo chiều nào. Đơn vị rad.',
      example: 'φ = 0 nghĩa là lúc t = 0 vật đang ở biên dương x = A.' },
    { id: 'q-read-eq', part: 3, asked: 31, cite: 360, source: 'slide tr.7', q: 'Đọc A, ω, φ từ phương trình thế nào?',
      alt: ['cách xác định biên độ trong phương trình', 'số nào là biên độ', 'x = 5cos(4πt + π/3) thì A bằng mấy'],
      short: 'So với mẫu x = A cos(ωt + φ): số đứng trước cos là A, hệ số đi kèm t là ω, hằng số cộng thêm là φ.',
      example: 'x = 5cos(4πt + π/3): A = 5 cm, ω = 4π rad/s, φ = π/3.' },
    { id: 'q-phase', part: 3, asked: 14, cite: 322, source: 'slide tr.7', q: 'Pha dao động khác pha ban đầu thế nào?',
      alt: ['ωt + φ là gì', 'pha là gì'],
      short: 'Pha dao động là cả biểu thức (ωt + φ), thay đổi theo thời gian. Pha ban đầu φ là giá trị của pha lúc t = 0.',
      example: 'Với x = 5cos(4πt + π/3), lúc t = 0 pha bằng π/3 — đó là pha ban đầu.' },
    { id: 'q-sin', part: 3, asked: 9, cite: 342, source: 'slide tr.8', q: 'Phương trình viết bằng sin thì sao?',
      alt: ['x = A sin thì đọc thế nào', 'đổi sin sang cos'],
      short: 'Vẫn là dao động điều hoà. Đổi về cos bằng sin α = cos(α − π/2) rồi đọc A, ω, φ như bình thường.',
      example: 'x = 3sin(2t) = 3cos(2t − π/2): A = 3, ω = 2 rad/s, φ = −π/2.' },

    // Part 4 — vận tốc, gia tốc
    { id: 'q-vmax-o', part: 4, asked: 40, cite: 434, source: 'slide tr.10', q: 'Sao ở O lại nhanh nhất?',
      alt: ['vận tốc cực đại ở đâu', 'v max ở vị trí nào', 'qua vị trí cân bằng vận tốc thế nào'],
      short: 'Lực kéo về luôn hướng về O, nên vật tăng tốc suốt quãng từ biên về O. Qua O nó bắt đầu bị hãm lại, nên tại O vận tốc lớn nhất: v max = Aω.',
      example: 'A = 4 cm, ω = 5 rad/s thì v max = 20 cm/s.' },
    { id: 'q-amax-edge', part: 4, asked: 29, cite: 470, source: 'slide tr.11', q: 'Sao ở biên gia tốc lớn nhất?',
      alt: ['gia tốc cực đại ở đâu', 'a max ở vị trí nào', 'ở biên vận tốc bằng 0 sao gia tốc lại lớn'],
      short: 'a = −ω²x, độ lớn tỉ lệ với li độ. Ở biên |x| = A lớn nhất nên |a| = Aω² lớn nhất, dù vận tốc lúc đó bằng 0.',
      example: 'Xích đu lên tới điểm cao nhất thì khựng lại (v = 0) nhưng bị kéo về mạnh nhất.' },
    { id: 'q-a-sign', part: 4, asked: 17, cite: 452, source: 'slide tr.11', q: 'Sao gia tốc có dấu trừ?',
      alt: ['a = −ω²x dấu trừ nghĩa là gì', 'gia tốc ngược dấu li độ'],
      short: 'Dấu trừ nghĩa là gia tốc luôn ngược dấu với li độ, tức luôn hướng về vị trí cân bằng O.',
      example: 'Vật ở bên phải O (x > 0) thì gia tốc hướng sang trái (a < 0).' },
    { id: 'q-derive', part: 4, asked: 11, cite: 416, source: 'slide tr.10', q: 'Đạo hàm ra vận tốc thế nào ạ?',
      alt: ['công thức vận tốc từ đâu ra', 'v bằng đạo hàm của x'],
      short: 'Vận tốc là đạo hàm của li độ theo thời gian: x = A cos(ωt + φ) → v = −Aω sin(ωt + φ). Độ lớn lớn nhất của sin là 1 nên v max = Aω.',
      example: 'x = 2cos(10t) → v = −20 sin(10t) cm/s, v max = 20 cm/s.' }
  ];

  /* ---------- text normalisation + concept dictionary ---------- */
  function fold(s) {
    return String(s || '').toLowerCase()
      .replace(/ω/g, ' omega ').replace(/π/g, ' pi ').replace(/φ/g, ' phi ').replace(/²/g, ' binh ')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
      .replace(/rad\s*\/\s*s/g, ' rads ').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  // Paraphrases collapse onto one concept token — this is what makes the mock "semantic".
  const CONCEPTS = [
    [/\b(tan so goc|omega|w)\b/g, ' c_omega '], [/\b(chu ky|chu ki)\b/g, ' c_period '], [/\bbien do\b/g, ' c_amp '],
    [/\b(tan so|hz|f)\b/g, ' c_freq '], [/\b(pha ban dau|phi)\b/g, ' c_phi '], [/\bvi tri can bang\b/g, ' c_eq '],
    [/\b(van toc|toc do|nhanh)\b/g, ' c_vel '], [/\b(gia toc)\b/g, ' c_acc '], [/\b(li do)\b/g, ' c_x '],
    [/\b(dao ham)\b/g, ' c_deriv '], [/\b(2 pi|hai pi|2pi)\b/g, ' c_2pi '], [/\b(cuc dai|lon nhat|max)\b/g, ' c_max '],
    [/\b(phuong trinh|cong thuc)\b/g, ' c_eq_form '], [/\b(don vi|rads)\b/g, ' c_unit '], [/\b(khac|phan biet|giong)\b/g, ' c_diff ']
  ];
  const STOP = new Set('la gi sao vi the nao em oi chi co khong cua va thi ma duoc nhu vay nhi de tai bao nhieu cho hoi minh ban voi o tren trong mot nay do khi ah a nhe di ra nhung con roi lai cai'.split(' '));
  function tokens(s) {
    let t = ' ' + fold(s) + ' ';
    CONCEPTS.forEach(([re, rep]) => { t = t.replace(re, rep); });
    return t.split(/\s+/).filter(w => w && !STOP.has(w));
  }

  /* ---------- index: TF-IDF over question + paraphrases ---------- */
  const docs = BANK.map(e => {
    const toks = tokens([e.q].concat(e.alt).join(' '));
    const tf = {}; toks.forEach(w => { tf[w] = (tf[w] || 0) + 1; });
    return { e, tf, texts: [e.q].concat(e.alt).map(fold) };
  });
  const df = {}; docs.forEach(d => Object.keys(d.tf).forEach(w => { df[w] = (df[w] || 0) + 1; }));
  const vocab = Object.keys(df);
  const idf = (w) => Math.log(1 + docs.length / (df[w] || 0.5));
  docs.forEach(d => { d.vec = {}; let n = 0; Object.keys(d.tf).forEach(w => { d.vec[w] = d.tf[w] * idf(w); n += d.vec[w] * d.vec[w]; }); d.norm = Math.sqrt(n) || 1; });

  function lev1(a, b) {                       // true when edit distance ≤ 1
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }
  function snap(w) {                          // typo tolerance: map an unknown word to a close known one
    if (df[w] || w.length < 4 || w.indexOf('c_') === 0) return w;
    return vocab.find(v => v.indexOf('c_') !== 0 && lev1(w, v)) || w;
  }
  function grams(s) { const t = '  ' + s + ' '; const g = new Set(); for (let i = 0; i < t.length - 2; i++) g.add(t.slice(i, i + 3)); return g; }
  function dice(a, b) { const A = grams(a), B = grams(b); let n = 0; A.forEach(x => { if (B.has(x)) n++; }); return (2 * n) / (A.size + B.size || 1); }

  /* Returns the bank ranked by similarity to `query`; score in 0..1. */
  function search(query, part) {
    const qt = tokens(query).map(snap);
    const qtf = {}; qt.forEach(w => { qtf[w] = (qtf[w] || 0) + 1; });
    let qn = 0; const qv = {};
    Object.keys(qtf).forEach(w => { qv[w] = qtf[w] * idf(w); qn += qv[w] * qv[w]; });
    qn = Math.sqrt(qn) || 1;
    const fq = fold(query);
    return docs.map(d => {
      let dot = 0; Object.keys(qv).forEach(w => { if (d.vec[w]) dot += qv[w] * d.vec[w]; });
      const cos = dot / (qn * d.norm);
      const fuzzy = Math.max.apply(null, d.texts.map(t => dice(fq, t)));
      const score = Math.min(1, 0.68 * cos + 0.32 * fuzzy + (part && d.e.part === part ? 0.06 : 0));
      return { entry: d.e, score };
    }).sort((a, b) => b.score - a.score);
  }

  App.qa = {
    BANK, search,
    MATCH: 0.34,   // confident: answer from this entry
    MAYBE: 0.2,    // unsure: offer "có phải bạn muốn hỏi…"
    // Most-asked questions of a part, used as suggestion chips when the learner raises a hand.
    popular: (part, n) => BANK.filter(e => e.part === part).sort((a, b) => b.asked - a.asked).slice(0, n || 3),
    cite: (e) => Math.round(e.cite * App.timeline.factor() * 10) / 10,
    answer: (e, style) => style === 'example' ? e.short + ' Ví dụ: ' + e.example : style === 'formula' ? e.short + ' Áp dụng: ' + e.example : e.short
  };
})();
