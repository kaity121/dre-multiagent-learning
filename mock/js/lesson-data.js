/* lesson-data.js — prepared (offline-processed) content for the demo lesson
   "Vật lý 12 — Dao động điều hoà": parts, transcript, interaction script,
   raise-hand answers, remediation steps, instructor dashboard data.
   All content is sample data for UX validation; the instructor is fictional. */
window.App = window.App || {};
App.data = (function () {
  const PEOPLE = {
    na:   { id: 'na',   name: 'Na',      initial: 'N', role: 'Bạn học AI · tò mò, hay hỏi “vì sao”' },
    khoa: { id: 'khoa', name: 'Khoa',    initial: 'K', role: 'Bạn học AI · hay bắt bẻ, có thể sai' },
    thu:  { id: 'thu',  name: 'chị Thư', initial: 'T', role: 'Trợ giảng AI · bám video và slide' },
    me:   { id: 'me',   name: 'Bạn',     initial: 'B', role: 'Học viên' }
  };

  const LESSON = { id: 'ddh', title: 'Dao động điều hoà', subject: 'Vật lý 12', teacher: 'Thầy Minh', duration: 510, slides: 'Slide bài 1 · 12 trang' };
  const OPENING = 25; // seconds at the start of each part where nothing may be inserted

  const PARTS = [
    { n: 1, start: 0,   end: 120, title: 'Dao động điều hoà là gì?', goal: 'Nhận ra dao động điều hoà, biên độ A và chu kỳ T', concept: 'Biên độ A & chu kỳ T' },
    { n: 2, start: 120, end: 270, title: 'Tần số góc ω',             goal: 'Hiểu ω = 2π/T và đơn vị rad/s',                 concept: 'Tần số góc ω' },
    { n: 3, start: 270, end: 400, title: 'Phương trình dao động',    goal: 'Đọc được A, ω, φ từ x = A cos(ωt + φ)',          concept: 'Phương trình x = A cos(ωt + φ)' },
    { n: 4, start: 400, end: 510, title: 'Vận tốc và gia tốc',       goal: 'Tính được v max = Aω và a max = Aω²',            concept: 'Vận tốc & gia tốc cực đại' }
  ];
  const partAt = (t) => PARTS.find(p => t >= p.start && t < p.end) || PARTS[PARTS.length - 1];
  const partByN = (n) => PARTS.find(p => p.n === n);

  const BLOOM = ['Nhớ', 'Hiểu', 'Vận dụng', 'Phân tích', 'Đánh giá', 'Sáng tạo'];

  // Lecture transcript. `board` = what the teacher writes on the board at that moment.
  const TRANSCRIPT = [
    { t: 0,   text: 'Chào các em. Hôm nay mình học dao động điều hoà.' },
    { t: 12,  text: 'Nhìn con lắc lò xo này: vật đi qua đi lại quanh một vị trí.' },
    { t: 28,  text: 'Vị trí ở giữa gọi là vị trí cân bằng, ký hiệu O.', board: 'Vị trí cân bằng: O' },
    { t: 45,  text: 'Khoảng cách xa nhất từ O tới biên gọi là biên độ A.', board: 'Biên độ A (cm)' },
    { t: 62,  text: 'Biên độ luôn dương và không đổi nếu bỏ qua ma sát.' },
    { t: 78,  text: 'Thời gian vật đi hết một dao động toàn phần là chu kỳ T.', board: 'Chu kỳ T (s)' },
    { t: 96,  text: 'Số dao động trong một giây là tần số f = 1/T.', board: 'f = 1/T (Hz)' },
    { t: 110, text: 'Các em ghi lại ba đại lượng này nhé.' },
    { t: 120, text: 'Bây giờ mình nhìn chuyển động tròn đều.' },
    { t: 134, text: 'Hình chiếu của điểm chạy trên vòng tròn chính là dao động điều hoà.' },
    { t: 150, text: 'Một vòng tròn ứng với góc 2π radian.', board: '1 vòng = 2π rad' },
    { t: 168, text: 'Mỗi giây điểm quét được một góc, đó là tần số góc ω.' },
    { t: 185, text: 'Đi hết một vòng mất T giây, nên ω = 2π/T.', board: 'ω = 2π/T' },
    { t: 205, text: 'Đơn vị của ω là radian trên giây, rad/s.', board: 'Đơn vị ω: rad/s' },
    { t: 225, text: 'Đừng nhầm ω với f: f đếm số vòng, ω đo góc.', board: 'ω = 2πf' },
    { t: 248, text: 'Ví dụ T = 2 giây thì ω bằng π rad/s.' },
    { t: 270, text: 'Giờ mình viết phương trình dao động.' },
    { t: 286, text: 'x bằng A nhân cos của ωt cộng φ.', board: 'x = A cos(ωt + φ)' },
    { t: 304, text: 'A là biên độ, luôn đứng trước cos.' },
    { t: 322, text: 'ωt + φ là pha dao động, φ là pha ban đầu.', board: 'φ: pha ban đầu (rad)' },
    { t: 342, text: 'Ví dụ x = 5cos(4πt + π/3) cm.', board: 'x = 5cos(4πt + π/3)' },
    { t: 360, text: 'Vậy A = 5 cm, ω = 4π rad/s, φ = π/3.' },
    { t: 380, text: 'Các em thử tự đọc một phương trình khác.' },
    { t: 400, text: 'Cuối cùng là vận tốc và gia tốc.' },
    { t: 416, text: 'Đạo hàm x theo thời gian ta được vận tốc.', board: 'v = −Aω sin(ωt + φ)' },
    { t: 434, text: 'Vận tốc lớn nhất khi vật qua O: v max = Aω.', board: 'v max = Aω (tại O)' },
    { t: 452, text: 'Gia tốc a = −ω²x, luôn hướng về O.', board: 'a = −ω²x' },
    { t: 470, text: 'Gia tốc lớn nhất ở biên: a max = Aω².', board: 'a max = Aω² (tại biên)' },
    { t: 490, text: 'Tóm lại: ở O vật nhanh nhất, ở biên vật đổi chiều.' },
    { t: 502, text: 'Buổi sau mình làm bài tập. Chào các em.' }
  ];

  // Interaction script produced by "Dựng lớp" and edited in "Duyệt kịch bản".
  // kind: comment (passive, never pauses) · whisper (private, never pauses) ·
  //       question (@Bạn, pauses) · poll (@Cả lớp at part end, pauses).
  // Exactly one system pause per part; nothing inside the first 25 s of a part.
  const SCRIPT = [
    // Comments arrive every ~15 s of video; each thread is a short conversation (replies may
    // ping another classmate with @, and some ping the learner — ping: 'me' — to invite a reply).
    { id: 'c1a', part: 1, t: 30, who: 'na', kind: 'comment', mode: 'passive', bloom: 0, text: 'Vị trí cân bằng là chỗ vật đứng yên nếu không ai kéo hả?',
      thread: [{ who: 'thu', text: 'Đúng rồi, đó là điểm O thầy vừa ghi. Xem [00:28].' },
        { who: 'khoa', ping: 'na', text: 'Kiểu quả lắc đồng hồ lúc đứng thẳng ấy.' },
        { who: 'na', ping: 'khoa', text: 'À dễ hình dung hơn hẳn, cảm ơn nhé!' },
        { who: 'na', ping: 'me', text: 'Cậu nghĩ thêm được ví dụ đời thường nào cho vị trí cân bằng không?' }] },
    { id: 'c1', part: 1, t: 44, who: 'thu', kind: 'comment', mode: 'passive', bloom: 0, text: 'Ghi nhớ: biên độ A là khoảng cách xa nhất tính từ vị trí cân bằng O.',
      thread: [{ who: 'khoa', text: 'Vậy biên độ luôn dương ạ?' },
        { who: 'thu', ping: 'khoa', text: 'Đúng, A là khoảng cách nên luôn dương.' }] },
    { id: 'c1b', part: 1, t: 58, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 1, text: 'Kéo con lắc xa hơn thì biên độ to hơn, nhưng chu kỳ có đổi không nhỉ?',
      thread: [{ who: 'na', ping: 'khoa', text: 'Tớ đoán là không, vẫn đều đều thế.' },
        { who: 'thu', ping: 'khoa', text: 'Với dao động điều hoà, T không phụ thuộc biên độ A.' },
        { who: 'khoa', ping: 'me', text: 'Cậu có tin không? Tớ vẫn thấy hơi lạ.' }] },
    { id: 'c2', part: 1, t: 74, who: 'na', kind: 'comment', mode: 'passive', bloom: 1, text: 'Vậy xích đu đi một lượt qua lại là một chu kỳ hả?',
      thread: [{ who: 'khoa', ping: 'na', text: 'Phải đi rồi quay về đúng chỗ cũ mới tính nhé.' },
        { who: 'na', ping: 'khoa', text: 'Tức là mới sang một bên thì chỉ là nửa chu kỳ?' },
        { who: 'thu', ping: 'na', text: 'Chuẩn — một dao động toàn phần mới là T. Xem lại [01:18].' }] },
    { id: 'c2a', part: 1, t: 90, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 1, text: 'f = 1/T, vậy T càng lớn thì dao động càng chậm à?',
      thread: [{ who: 'na', ping: 'khoa', text: 'Ừ, mỗi giây ít dao động hơn.' },
        { who: 'thu', text: 'Chính xác: T lớn → f nhỏ. Xem [01:36].' },
        { who: 'khoa', ping: 'me', text: 'T = 0,5 s thì f bằng mấy, cậu tính thử xem?' }] },
    { id: 'c2b', part: 1, t: 104, who: 'thu', kind: 'comment', mode: 'passive', bloom: 0, text: 'Đơn vị: T tính bằng giây (s), f tính bằng héc (Hz).',
      thread: [{ who: 'na', text: 'Hz là số dao động mỗi giây đúng không chị?' },
        { who: 'thu', ping: 'na', text: 'Đúng rồi em.' }] },
    { id: 'p1', part: 1, t: 119, who: 'thu',  kind: 'poll', mode: 'active', bloom: 1,
      text: 'Con lắc đi từ biên trái sang biên phải rồi quay về biên trái mất 2 s. Chu kỳ T bằng bao nhiêu?',
      poll: { options: ['1 s', '2 s', '4 s'], correct: 1, na: 1, khoa: 1, bloom: 1,
        explain: 'Một dao động toàn phần là đi rồi quay về đúng vị trí cũ, nên T = 2 s.',
        praise: { who: 'na', text: 'Cả lớp chuẩn hết! Part sau tớ hỏi khó hơn đấy.' } } },

    { id: 'c3', part: 2, t: 150, who: 'na', kind: 'comment', mode: 'passive', bloom: 1, text: 'Ủa 2π ở đâu ra ta?',
      thread: [{ who: 'khoa', ping: 'na', text: 'Chắc là một vòng tròn bằng 2π rad.' },
        { who: 'na', ping: 'khoa', text: 'Sao không phải 360 độ?' },
        { who: 'thu', ping: 'na', text: 'Trong vật lý mình dùng radian: 360° = 2π rad. Xem slide tr.4 và đoạn [02:30].' },
        { who: 'na', ping: 'me', text: 'Cậu nhớ 180° bằng bao nhiêu rad không?' }] },
    { id: 'w1', part: 2, t: 175, who: 'na',   kind: 'whisper', mode: 'active', bloom: 1, text: 'Cậu hiểu chỗ ω không? Tớ hơi lơ mơ…' },
    { id: 'c3a', part: 2, t: 190, who: 'thu', kind: 'comment', mode: 'passive', bloom: 0, text: 'Ghi lại công thức chính của part này: ω = 2π/T, đơn vị rad/s.',
      thread: [{ who: 'khoa', text: 'Rad/s nghe lạ ghê, kiểu tốc độ quay hả chị?' },
        { who: 'thu', ping: 'khoa', text: 'Đúng, mỗi giây quét được bao nhiêu radian.' }] },
    { id: 'c4', part: 2, t: 205, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 3, text: 'Nghe ω giống f quá, khác gì nhau đâu?',
      thread: [{ who: 'na', ping: 'khoa', text: 'Thầy vừa bảo f đếm vòng, còn ω đo góc đó.' },
        { who: 'khoa', ping: 'na', text: 'Nhưng quay nhanh thì cả hai cùng tăng mà?' },
        { who: 'thu', ping: 'khoa', text: 'Đúng là tỉ lệ thuận: ω = 2πf. Cùng một chuyển động, hai cách đo.' },
        { who: 'khoa', ping: 'me', text: 'Cậu giải thích lại theo cách của cậu được không?' }] },
    { id: 'c4a', part: 2, t: 220, who: 'na', kind: 'comment', mode: 'passive', bloom: 2, text: 'T = 2 s thì ω = π rad/s, mình nhân 2π với 2 hả?',
      thread: [{ who: 'khoa', ping: 'na', text: 'Chia chứ, 2π chia cho 2.' },
        { who: 'na', ping: 'khoa', text: 'Ừ nhầm, chia mới đúng hì.' }] },
    { id: 'c5', part: 2, t: 236, who: 'thu', kind: 'comment', mode: 'passive', bloom: 0, text: 'Mẹo: ω = 2πf — cùng một chuyển động, hai cách đo.',
      thread: [{ who: 'na', text: 'Mẹo này dễ nhớ ghê!' }] },
    { id: 'c5a', part: 2, t: 252, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 3, text: 'Kim giây đồng hồ thì ω bằng bao nhiêu nhỉ?',
      thread: [{ who: 'na', ping: 'khoa', text: 'T = 60 s nên ω = 2π/60 = π/30 rad/s.' },
        { who: 'thu', ping: 'na', text: 'Na tính chuẩn rồi.' },
        { who: 'khoa', ping: 'me', text: 'Còn kim phút thì sao, cậu thử nhé?' }] },
    { id: 'p2', part: 2, t: 269, who: 'thu',  kind: 'poll', mode: 'active', bloom: 2,
      text: 'Chu kỳ T = 2 s. Tần số góc ω bằng bao nhiêu?',
      poll: { options: ['π rad/s', '2π rad/s', '0,5 rad/s'], correct: 0, na: 0, khoa: 1, bloom: 2,
        explain: 'ω = 2π/T = 2π/2 = π rad/s. 2π là góc của cả vòng, phải chia cho thời gian T.',
        args: { na: 'Tớ chọn A: ω = 2π/T = 2π/2 = π.', khoa: 'Tớ chọn B: một vòng là 2π mà, nên ω = 2π chứ!' },
        reasons: ['Vì phải chia 2π cho T', 'Vì một vòng là 2π rad'],
        concede: { who: 'khoa', text: 'Ừ ha, tớ quên chia cho T. 2π là góc cả vòng, không phải góc mỗi giây.' },
        praise: { who: 'na', text: 'Tranh luận vui ghê, cảm ơn cậu đã chọn phe!' } } },

    { id: 'c6', part: 3, t: 296, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 1, text: 'A đứng trước cos thì dễ rồi, còn φ để làm gì?',
      thread: [{ who: 'thu', ping: 'khoa', text: 'φ cho biết vật bắt đầu ở đâu lúc t = 0. Xem [05:22].' },
        { who: 'khoa', ping: 'thu', text: 'Vậy φ = 0 là vật bắt đầu ở biên dương ạ?' },
        { who: 'thu', ping: 'khoa', text: 'Đúng, vì cos 0 = 1 nên x = A.' }] },
    { id: 'c6a', part: 3, t: 310, who: 'thu', kind: 'comment', mode: 'passive', bloom: 0, text: 'φ đo bằng radian, giống ω nhưng không có “trên giây”.',
      thread: [{ who: 'khoa', text: 'À, vì φ chỉ là một góc, không phải tốc độ quay.' }] },
    { id: 'c7', part: 3, t: 325, who: 'na', kind: 'comment', mode: 'passive', bloom: 2, text: 'Vậy 4π là ω, không phải biên độ nhỉ?',
      thread: [{ who: 'khoa', ping: 'na', text: 'Ừ, cái đứng cạnh t là ω.' },
        { who: 'na', ping: 'me', text: 'Cậu đọc giúp tớ A và φ trong phương trình đó nhé?' }] },
    { id: 'c7c', part: 3, t: 340, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 2, text: 'Pha ban đầu có âm được không nhỉ, kiểu −π/2?',
      thread: [{ who: 'thu', ping: 'khoa', text: 'Có. φ âm hay dương tuỳ vật bắt đầu ở đâu và đang đi theo chiều nào.' },
        { who: 'khoa', ping: 'thu', text: 'Vậy là thêm một chỗ phải cẩn thận.' }] },
    { id: 'c7a', part: 3, t: 355, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 2, text: 'Thử nhé: x = 3cos(2t) thì φ bằng 0 đúng không?',
      thread: [{ who: 'na', ping: 'khoa', text: 'Đúng, không cộng gì thêm thì φ = 0.' },
        { who: 'khoa', ping: 'na', text: 'Còn ω = 2 rad/s, A = 3 luôn.' },
        { who: 'na', ping: 'me', text: 'Cậu thấy bọn tớ đọc đúng chưa?' }] },
    { id: 'c7d', part: 3, t: 370, who: 'na', kind: 'comment', mode: 'passive', bloom: 1, text: 'Tớ hay nhầm A với ω lắm, có mẹo gì không?',
      thread: [{ who: 'thu', ping: 'na', text: 'A đứng trước cos, ω đứng cạnh t. Nhìn vị trí là ra.' },
        { who: 'na', ping: 'thu', text: 'Dạ em nhớ rồi!' }] },
    { id: 'q1', part: 3, t: 395, who: 'khoa', kind: 'question', mode: 'active', bloom: 2,
      text: 'Tớ nghĩ trong x = 5cos(4πt + π/3) thì biên độ là 4π. Đúng không?' },

    { id: 'c7b', part: 4, t: 426, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 1, text: 'Đạo hàm của cos là −sin, nên v mới có dấu trừ nhỉ?',
      thread: [{ who: 'thu', ping: 'khoa', text: 'Đúng vậy. Xem cách thầy lấy đạo hàm ở [06:56].' },
        { who: 'khoa', ping: 'me', text: 'Cậu còn nhớ đạo hàm của sin không?' }] },
    { id: 'c8', part: 4, t: 440, who: 'na', kind: 'comment', mode: 'passive', bloom: 1, text: 'Giống xích đu: qua chỗ thấp nhất là nhanh nhất!',
      thread: [{ who: 'khoa', ping: 'na', text: 'Còn lên tới chỗ cao nhất thì khựng lại rồi mới quay về.' },
        { who: 'na', ping: 'khoa', text: 'Đúng, ở biên thì v = 0!' },
        { who: 'thu', text: 'Hai bạn nói chuẩn: v max tại O, v = 0 tại biên.' }] },
    { id: 'c8a', part: 4, t: 455, who: 'na', kind: 'comment', mode: 'passive', bloom: 2, text: 'a = −ω²x nghĩa là a luôn ngược dấu với x hả?',
      thread: [{ who: 'thu', ping: 'na', text: 'Đúng — gia tốc luôn hướng về O.' },
        { who: 'na', ping: 'me', text: 'Vậy ở biên dương thì a dương hay âm, cậu nghĩ sao?' }] },
    { id: 'c8b', part: 4, t: 468, who: 'khoa', kind: 'comment', mode: 'passive', bloom: 2, text: 'A = 2 cm, ω = 10 rad/s thì a max = 200 cm/s² nhỉ?',
      thread: [{ who: 'na', ping: 'khoa', text: '2 × 10² = 200, đúng rồi.' },
        { who: 'thu', ping: 'khoa', text: 'Chuẩn. Nhớ là ω bình phương nhé.' }] },
    { id: 'c9', part: 4, t: 480, who: 'thu', kind: 'comment', mode: 'passive', bloom: 0, text: 'Ghi nhớ: v max tại O, a max tại biên.',
      thread: [{ who: 'khoa', text: 'Ghi vào vở rồi chị ơi!' }] },
    { id: 'c9a', part: 4, t: 494, who: 'thu', kind: 'comment', mode: 'passive', bloom: 0, text: 'Tóm tắt: O → v max = Aω, a = 0. Biên → v = 0, a max = Aω².',
      thread: [{ who: 'na', text: 'Bài hôm nay dễ hiểu ghê!' },
        { who: 'khoa', ping: 'me', text: 'Cậu thấy phần nào khó nhất?' }] },
    { id: 'p4', part: 4, t: 508, who: 'thu',  kind: 'poll', mode: 'active', bloom: 2,
      text: 'A = 4 cm, ω = 5 rad/s. Vận tốc cực đại v max bằng bao nhiêu?',
      poll: { options: ['20 cm/s', '100 cm/s', '9 cm/s'], correct: 0, na: 0, khoa: 0, bloom: 2,
        explain: 'v max = Aω = 4 × 5 = 20 cm/s.',
        praise: { who: 'na', text: 'Chuẩn luôn! Hôm nay cậu tiến bộ ghê.' } },
      // Director rule: a learner already at Vận dụng or above gets the harder (Phân tích) variant.
      alt: { minBloom: 2, text: 'Vật đang ở biên. Nhận định nào đúng?',
        poll: { options: ['v = 0 và |a| lớn nhất', 'v lớn nhất và a = 0', 'v và a đều lớn nhất'], correct: 0, na: 0, khoa: 2, bloom: 3,
          explain: 'Ở biên vật đổi chiều nên v = 0; li độ lớn nhất nên |a| = ω²A lớn nhất.',
          args: { na: 'Tớ chọn A: ở biên vật dừng để quay đầu, nên v = 0.', khoa: 'Tớ chọn C: biên là chỗ xa nhất, chắc cái gì cũng lớn nhất!' },
          reasons: ['Vì ở biên vật đổi chiều', 'Vì biên là chỗ xa nhất'],
          concede: { who: 'khoa', text: 'À, tới biên là phải dừng để quay đầu. Tớ sai rồi.' },
          praise: { who: 'na', text: 'Câu khó mà cậu vẫn chuẩn!' } } } }
  ];

  // Raise-hand answers by part, in the three answer styles chosen at calibration.
  const ANSWERS = {
    1: { asks: ['Biên độ khác chu kỳ thế nào?', 'Một chu kỳ tính từ đâu tới đâu?'], cite: 78, source: 'slide tr.2',
      short: 'Biên độ A là khoảng cách xa nhất từ vị trí cân bằng O tới biên; chu kỳ T là thời gian đi hết một dao động toàn phần.',
      example: 'Như xích đu: chỗ xa nhất xích đu lên tới là biên độ; thời gian đi một lượt qua lại rồi về chỗ cũ là chu kỳ.',
      formula: 'Bước 1: lấy vị trí cân bằng O. Bước 2: A = khoảng cách từ O tới biên. Bước 3: T = thời gian một dao động toàn phần, f = 1/T.',
      another: 'Như quả lắc đồng hồ: mỗi lần nó đung đưa sang rồi về đúng chỗ cũ là một chu kỳ.',
      na: 'Tớ cũng hình dung như xích đu ở sân chơi ấy!' },
    2: { asks: ['Sao ω có đơn vị rad/s ạ?', '2π ở đâu ra ạ?'], cite: 185, source: 'slide tr.4',
      short: 'ω là góc quét được trong mỗi giây, nên đơn vị là rad/s. Đi hết một vòng 2π mất T giây nên ω = 2π/T.',
      example: 'Như kim đồng hồ: kim quay một vòng 2π trong một khoảng thời gian; ω là mỗi giây kim quay được bao nhiêu góc.',
      formula: 'Bước 1: 1 vòng = 2π rad. Bước 2: 1 vòng mất T giây. Bước 3: ω = 2π/T (rad/s). Ví dụ T = 2 s → ω = π rad/s.',
      another: 'Bánh xe đạp quay 1 vòng mất 2 giây thì mỗi giây quay được π rad — đó chính là ω.',
      na: 'Tớ cũng thắc mắc chỗ này. Tớ hình dung như xích đu chạy trên một vòng tròn ảo…' },
    3: { asks: ['φ là gì ạ?', 'Sao A là số đứng trước cos?'], cite: 360, source: 'slide tr.7',
      short: 'Trong x = A cos(ωt + φ): số đứng trước cos là A, hệ số đi kèm t là ω, phần cộng thêm là φ.',
      example: 'Như điền vào mẫu: ô trước cos là A, ô đi cùng t là ω, ô cộng thêm phía sau là φ.',
      formula: 'Bước 1: đặt cạnh mẫu x = A cos(ωt + φ). Bước 2: A = số trước cos. Bước 3: ω = hệ số của t. Bước 4: φ = hằng số cộng thêm.',
      another: 'x = 3cos(2t) → A = 3, ω = 2 rad/s, φ = 0.',
      na: 'À, kiểu tìm đúng ô để điền số ấy!' },
    4: { asks: ['Sao ở O lại nhanh nhất?', 'Sao ở biên gia tốc lớn nhất?'], cite: 434, source: 'slide tr.10',
      short: 'Vận tốc lớn nhất khi qua O: v max = Aω. Gia tốc lớn nhất ở biên: a max = Aω².',
      example: 'Như xích đu: qua chỗ thấp nhất là nhanh nhất, lên tới chỗ cao nhất thì khựng lại và bị kéo về mạnh nhất.',
      formula: 'Bước 1: v = −Aω sin(ωt + φ) → |v| lớn nhất bằng Aω. Bước 2: a = −ω²x → |a| lớn nhất khi |x| = A, a max = Aω².',
      another: 'A = 2 cm, ω = 10 rad/s → v max = 20 cm/s, a max = 200 cm/s².',
      na: 'Giống trượt ván trong lòng chảo luôn!' }
  };

  // Remediation ladder per concept: guided replay → Na explains → Khoa is wrong → recheck.
  const REMED = {
    1: { replay: [78, 110], focus: 'Chu kỳ T (s)', focusLabel: 'chú ý chỗ thầy nói “dao động toàn phần”',
      na: { short: 'T là thời gian của một vòng đầy đủ: đi rồi quay về đúng chỗ cũ.',
            example: 'Đếm một lượt xích đu: từ lúc rời tay mình đến lúc quay lại tay mình là một chu kỳ.',
            formula: 'T = thời gian / số dao động. 10 dao động mất 20 s → T = 2 s.' },
      khoa: { claim: 'Tớ vẫn nghĩ đi từ biên trái sang biên phải là hết một chu kỳ rồi.',
        causes: [{ text: 'Khoa mới tính nửa dao động, chưa quay về', ok: true }, { text: 'Khoa nhầm biên độ với chu kỳ', ok: false }, { text: 'Khoa đo sai thời gian', ok: false }],
        keywords: ['nửa', 'quay về', 'quay lại', 'chưa về', 'toàn phần'],
        hold: ['Nhưng tớ đo thời gian chuẩn mà, sang tới biên kia là xong một chu kỳ chứ?', 'Tớ vẫn chưa thấy tớ sai ở đâu…'],
        hint: 'để ý xem Khoa đã quay về vị trí ban đầu chưa.',
        concede: 'À đúng rồi — tớ mới đi một nửa, phải quay về chỗ cũ mới đủ một chu kỳ. Cảm ơn cậu!',
        explain: 'Một chu kỳ là đi rồi quay về đúng vị trí cũ. Từ biên này sang biên kia mới là nửa chu kỳ.' },
      recheck: { q: '10 dao động toàn phần mất 5 s. Chu kỳ T bằng bao nhiêu?', options: ['0,5 s', '2 s', '50 s'], correct: 0, explain: 'T = 5/10 = 0,5 s.' } },
    2: { replay: [150, 205], focus: 'ω = 2π/T', focusLabel: 'chú ý chỗ thầy viết ω = 2π/T',
      na: { short: 'ω = 2π chia cho thời gian một vòng. Vòng càng nhanh, ω càng lớn.',
            example: 'Kim đồng hồ quay 1 vòng (2π) mất 2 giây → mỗi giây quay π. Lấy 2π chia cho thời gian, đừng lấy nguyên 2π.',
            formula: 'ω = 2π/T. T = 2 s → ω = 2π/2 = π rad/s. Kiểm tra đơn vị: rad/s.' },
      khoa: { claim: 'Tớ vẫn nghĩ ω = 2π vì một vòng là 2π rad mà.',
        causes: [{ text: 'Khoa quên chia cho chu kỳ T', ok: true }, { text: 'Khoa nhầm rad với độ', ok: false }, { text: 'Khoa nhớ sai: 1 vòng là π', ok: false }],
        keywords: ['chia', '/t', 'cho t', 'chu kỳ', 'thời gian', 'mỗi giây'],
        hold: ['Nhưng một vòng đúng là 2π rad mà, tớ không nhầm đơn vị đâu.', 'Tớ vẫn thấy 2π hợp lý…'],
        hint: 'ω là góc trong mỗi giây — thời gian nằm ở đâu trong cách Khoa tính?',
        concede: 'Ồ, 2π là góc của cả vòng, còn ω là góc mỗi giây — phải chia cho T. Hiểu rồi!',
        explain: '2π là góc cả vòng. ω là góc mỗi giây, nên ω = 2π/T.' },
      recheck: { q: 'Một vật quay đều 1 vòng mất 4 s. ω bằng bao nhiêu?', options: ['π/2 rad/s', '4π rad/s', '2π rad/s'], correct: 0, explain: 'ω = 2π/4 = π/2 rad/s.' } },
    3: { replay: [286, 365], focus: 'x = 5cos(4πt + π/3)', focusLabel: 'chú ý vị trí của A và ω trong phương trình',
      na: { short: 'Số đứng ngay trước cos là A; số đi kèm t là ω.',
            example: 'Như điền mẫu: ô ngoài cùng trước cos là A, ô đi cùng t trong ngoặc là ω.',
            formula: 'x = 5cos(4πt + π/3): A = 5 cm (trước cos), ω = 4π rad/s (kèm t), φ = π/3.' },
      khoa: { claim: 'Tớ vẫn nghĩ 4π là biên độ vì nó là số to nhất.',
        causes: [{ text: '4π đi kèm t nên là ω; A là số trước cos', ok: true }, { text: 'Biên độ phải là π/3', ok: false }, { text: 'Phương trình viết sai', ok: false }],
        keywords: ['trước cos', 'kèm t', 'đi với t', 'vị trí', 'là ω', '5 cm'],
        hold: ['Nhưng 4π lớn hơn 5 mà, biên độ phải là số to nhất chứ?', 'Tớ vẫn nghĩ số to nhất là biên độ…'],
        hint: 'vị trí trong phương trình mới quan trọng, không phải số to hay nhỏ.',
        concede: 'À, vị trí mới quan trọng, không phải số to hay nhỏ. A = 5 cm. Cảm ơn nhé!',
        explain: 'Trong x = A cos(ωt + φ), A luôn đứng trước cos; 4π đi kèm t nên là ω.' },
      recheck: { q: 'x = 8cos(πt − π/2) cm. Biên độ A bằng bao nhiêu?', options: ['8 cm', 'π cm', 'π/2 cm'], correct: 0, explain: 'A là số đứng trước cos: 8 cm.' } },
    4: { replay: [434, 475], focus: 'v max = Aω (tại O)', focusLabel: 'chú ý vị trí O và vị trí biên',
      na: { short: 'Ở O vật nhanh nhất; ở biên vật dừng lại nên gia tốc kéo về lớn nhất.',
            example: 'Xích đu: chỗ thấp nhất bay nhanh nhất, lên cao nhất thì khựng lại.',
            formula: 'v max = Aω tại O; a max = Aω² tại biên (|x| = A).' },
      khoa: { claim: 'Tớ vẫn nghĩ ở biên vật nhanh nhất vì nó xa O nhất.',
        causes: [{ text: 'Ở biên vật đổi chiều nên v = 0', ok: true }, { text: 'Ở biên gia tốc bằng 0', ok: false }, { text: 'Vận tốc không phụ thuộc vị trí', ok: false }],
        keywords: ['đổi chiều', 'dừng', 'v = 0', 'v=0', 'bằng 0', 'quay đầu'],
        hold: ['Nhưng xa nhất thì chắc phải đi nhanh mới tới được chứ?', 'Tớ vẫn thấy ở biên phải nhanh…'],
        hint: 'ở biên, vật làm gì trước khi quay về?',
        concede: 'Đúng ha — tới biên là phải dừng để quay đầu, nên v = 0. Tớ hiểu rồi!',
        explain: 'Ở biên vật đổi chiều nên v = 0; vật nhanh nhất khi qua O.' },
      recheck: { q: 'Vật đi qua vị trí cân bằng O. Nhận định nào đúng?', options: ['v lớn nhất, a = 0', 'v = 0, a lớn nhất', 'v = 0, a = 0'], correct: 0, explain: 'Tại O: |v| = Aω lớn nhất, x = 0 nên a = 0.' } }
  };

  // Avatar expressions over time (by lecture difficulty).
  const MOODS = [
    { t: 0, na: 'nod', khoa: 'nod', thu: 'nod' },
    { t: 62, khoa: 'yawn' },
    { t: 80, na: 'frown', khoa: 'nod' },
    { t: 100, na: 'nod' },
    { t: 150, na: 'frown' },
    { t: 190, na: 'nod', khoa: 'frown' },
    { t: 250, khoa: 'nod' },
    { t: 304, khoa: 'yawn' },
    { t: 342, khoa: 'frown', na: 'frown' },
    { t: 365, na: 'nod' },
    { t: 430, khoa: 'frown' },
    { t: 470, khoa: 'nod' }
  ];
  const MOOD_LABEL = { nod: 'gật gù', frown: 'nhíu mày', yawn: 'ngáp' };

  const FALLBACK = {
    na: 'Ừm, tớ đang nghĩ… Tạm thời tớ thấy ý cậu hợp lý đấy.',
    khoa: 'Để tớ nghĩ thêm đã… Tạm thời tớ ghi nhận ý cậu.',
    thu: 'Chị cần thêm chút thời gian cho câu này. Trong lúc chờ, bạn xem lại đoạn liên quan nhé.'
  };
  const CLASS_REPLY = {
    na: 'Tớ cũng để ý chỗ đó! Đoạn này thầy giảng hơi nhanh.',
    khoa: 'Hmm, tớ chưa chắc lắm — lát poll xem ai đúng nhé.'
  };
  // A learner's thread reply gets an answer from whoever they replied to, then sometimes
  // another classmate chimes in — so threads read as conversations, not single answers.
  const THREAD_REPLY = {
    na: ['Ý hay đó! Tớ thấy cậu đúng hướng rồi.', 'À tớ hiểu rồi, cảm ơn cậu nhé!', 'Tớ cũng nghĩ giống cậu. Để tớ ghi lại.'],
    khoa: ['Hmm, nghe cũng hợp lý. Để tớ nghĩ thêm chút.', 'Ồ, vậy là tớ hiểu sai chỗ đó rồi. Cảm ơn nhé!', 'Tớ vẫn hơi nghi, lát poll xem ai đúng nhé.'],
    thu: ['Bạn nói đúng hướng rồi. Muốn chắc hơn thì bấm mốc giây ở tin gốc để xem lại đoạn thầy giảng.', 'Chính xác! Chị bổ sung: chỗ này có trong slide của thầy Minh.', 'Gần đúng rồi. Nếu còn phân vân, bấm Giơ tay để chị trả lời kèm mốc giây.']
  };
  const THREAD_CHIME = {
    na: ['Đồng ý luôn!', 'Hay ghê, tớ cũng học thêm được một ý.'],
    khoa: ['Ừ, tớ bị thuyết phục rồi đấy.', 'Thêm một ý: nhớ để ý đơn vị nữa nhé.'],
    thu: ['Cả hai bạn đều nắm được ý chính.', 'Trao đổi rất tốt, cứ tiếp tục nhé.']
  };
  // Follow-ups after Na answers a message the learner sent to the whole class.
  const CLASS_CHIME = {
    khoa: 'Tớ cũng thấy vậy, nhưng chắc phải nghe lại đoạn trước mới chắc.',
    na: 'Cậu muốn bọn tớ giải thích lại chỗ nào không? Trả lời tớ nhé!'
  };
  const DM_REPLY = {
    na: 'Tớ đọc rồi nè! Có gì khó cứ nhắn tớ, không ai thấy đâu.',
    khoa: 'Nhắn riêng tớ á? Tớ hay sai lắm đấy, cậu kiểm tra lại với chị Thư nhé.',
    thu: 'Chị nhận được rồi. Muốn chị trả lời bám đúng đoạn đang xem thì bấm Giơ tay nhé — chị sẽ trích mốc giây.'
  };
  const OFF_TOPIC = /(bóng đá|thời tiết|điện thoại|lượng tử|game|nấu|chứng khoán|crypto|tiếng anh|âm nhạc|phim)/i;
  const isOffTopic = (q) => OFF_TOPIC.test(q);

  // ---------- Instructor side ----------
  const CLASSES = [
    { id: 'ddh', title: 'Dao động điều hoà', subject: 'Vật lý 12', status: 'open', learners: 24, completed: 18, updated: '14/10' },
    { id: 'ddh-12a2', title: 'Dao động điều hoà — lớp 12A2', subject: 'Vật lý 12', status: 'draft', learners: 0, completed: 0, updated: '14/10' },
    { id: 'cld', title: 'Con lắc đơn', subject: 'Vật lý 12', status: 'open', learners: 0, completed: 0, updated: '13/10' }
  ];
  const SAMPLE_VIDEOS = [
    { name: 'dao-dong-dieu-hoa.mp4', duration: '08:30' },
    { name: 'con-lac-lo-xo.mp4', duration: '07:10' },
    { name: 'song-co.mp4', duration: '09:05' }
  ];
  const BUILD_STAGES = [
    { key: 'split',   label: 'Tách part',                        detail: 'Chia video theo từng concept / mục tiêu', ms: 2200 },
    { key: 'concept', label: 'Rút concept & mục tiêu',           detail: 'Đọc lời giảng, bảng viết và slide đính kèm', ms: 2600 },
    { key: 'cast',    label: 'Na, Khoa, chị Thư nhận kịch bản',   detail: 'Soạn bình luận, câu hỏi, poll và bước bù hiểu', ms: 3200 },
    { key: 'bloom',   label: 'Gắn mức Bloom',                    detail: 'Gắn mức Bloom và bị động / chủ động cho từng tương tác', ms: 1800 }
  ];

  // Dashboard (class "Dao động điều hoà", 24 learners). 10-second bins.
  function gauss(t, c, w, a) { return a * Math.exp(-Math.pow((t - c) / w, 2)); }
  const BINS = [];
  for (let s = 0; s < LESSON.duration; s += 10) {
    const m = s + 5;
    BINS.push({
      s, e: Math.min(s + 10, LESSON.duration),
      confused: Math.round(gauss(m, 215, 22, 13) + gauss(m, 85, 12, 5) + gauss(m, 355, 14, 4) + gauss(m, 470, 12, 3) + (m % 30 < 10 ? 1 : 0)),
      hand: Math.round(gauss(m, 205, 16, 6) + gauss(m, 355, 10, 3) + gauss(m, 80, 8, 2)),
      pollWrong: m > 260 && m < 270 ? 9 : m > 390 && m < 400 ? 4 : m > 110 && m < 120 ? 2 : m > 500 ? 3 : 0
    });
  }
  const DASH = {
    learners: 24, completed: 18,
    events: [
      { t: 85,  type: 'confused', n: 5 }, { t: 80, type: 'hand', n: 2 }, { t: 119, type: 'pollWrong', n: 2 },
      { t: 205, type: 'hand', n: 6 },     { t: 215, type: 'confused', n: 14 }, { t: 269, type: 'pollWrong', n: 9 },
      { t: 355, type: 'hand', n: 3 },     { t: 358, type: 'confused', n: 4 }, { t: 395, type: 'pollWrong', n: 4 },
      { t: 470, type: 'confused', n: 3 }, { t: 508, type: 'pollWrong', n: 3 }
    ],
    hotspots: [
      { s: 190, e: 240, part: 2, questions: [{ q: 'Sao ω có đơn vị rad/s ạ?', n: 6 }, { q: '2π ở đâu ra ạ?', n: 4 }, { q: 'ω với f khác nhau thế nào?', n: 3 }] },
      { s: 70,  e: 100, part: 1, questions: [{ q: 'Đi sang biên kia đã là một chu kỳ chưa?', n: 4 }] },
      { s: 340, e: 370, part: 3, questions: [{ q: 'Sao 4π không phải biên độ?', n: 3 }, { q: 'φ là gì ạ?', n: 2 }] },
      { s: 460, e: 480, part: 4, questions: [{ q: 'Sao ở biên gia tốc lại lớn nhất?', n: 2 }] }
    ],
    concepts: [
      { part: 1, pass: 83, review: 4,  bloom: [3, 9, 8, 3, 1, 0] },
      { part: 2, pass: 46, review: 13, bloom: [6, 11, 5, 2, 0, 0] },
      { part: 3, pass: 71, review: 7,  bloom: [2, 7, 10, 4, 1, 0] },
      { part: 4, pass: 75, review: 6,  bloom: [2, 6, 11, 4, 1, 0] }
    ]
  };

  return { PEOPLE, LESSON, OPENING, PARTS, partAt, partByN, BLOOM, TRANSCRIPT, SCRIPT, ANSWERS, REMED, MOODS, MOOD_LABEL,
    FALLBACK, CLASS_REPLY, THREAD_REPLY, THREAD_CHIME, CLASS_CHIME, DM_REPLY, isOffTopic, CLASSES, SAMPLE_VIDEOS, BUILD_STAGES, BINS, DASH };
})();
