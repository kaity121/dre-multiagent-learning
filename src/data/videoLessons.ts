// File: src/data/videoLessons.ts
import { VideoLessonItem } from '../types/dre';

export const VECTO_12_THAY_TIEN_LESSON: VideoLessonItem = {
  id: 'VID_VECTO_12',
  title: 'Bài 1.1: Vectơ Trong Không Gian - Toán 12 (SGK Mới) || Thầy Nguyễn Phan Tiến',
  topic: 'Toán 12: Vectơ trong không gian — Định nghĩa, Tổng & Hiệu hai Vectơ',
  subject: 'Hình học 12',
  youtubeId: 'phvpqxLNTUQ',
  videoUrl: 'https://www.youtube.com/watch?v=phvpqxLNTUQ',
  duration: 9503, // 2 giờ 38 phút 23 giây (2:38:23)
  durationSeconds: 9503,
  checkpointTimestamp: 2233, // 37:13 (Đúng lúc thầy Tiến dừng giải Ví dụ 3 câu a trên bảng)
  lectureEndSecond: 9503, // 2:38:23 (Mốc giây kết thúc toàn bộ video bài giảng Thầy Tiến để hiện tạm biệt và chuyển Trạm 2)
  blackboardTitle: "Ví dụ 3 (36:44): Cho hình lập phương ABCD.A'B'C'D' cạnh bằng 1. Tính |BC + DD'|",
  lectureNotes: [
    '[00:00] Phần 1: Định nghĩa Vectơ trong không gian là một đoạn thẳng có hướng.',
    '[02:24] Lưu ý: Đoạn thẳng AB = BA, nhưng vectơ AB ≠ BA vì ngược hướng nhau.',
    '[05:31] Vectơ-không (0): Điểm đầu trùng điểm cuối (AA, BB), cùng phương cùng hướng với mọi vectơ.',
    '[11:30] Hai vectơ bằng nhau khi và chỉ khi chúng CÙNG HƯỚNG và CÙNG ĐỘ DÀI.',
    '[22:30] Quy tắc 3 điểm (Nối tiếp): OA + AB = OB & Quy tắc hình bình hành: AB + AD = AC.',
    "[30:13] Quy tắc hình hộp: AB + AD + AA' = AC' (Đường chéo hình hộp).",
    "[36:44] Ví dụ 3: Cho hình lập phương ABCD.A'B'C'D' cạnh bằng 1. Tính |BC + DD'|."
  ],

  // 9 Phân cảnh chuẩn xác theo tiến trình bảng viết của thầy Tiến
  chapters: [
    {
      id: 'chap_1',
      title: '1. Định Nghĩa Vectơ & Giá Của Vectơ',
      startSecond: 0,
      formulaPreview: 'AB ≠ BA',
    },
    {
      id: 'chap_2',
      title: '2. Vectơ-không (0) & Hai Vectơ Cùng Phương, Cùng Hướng',
      startSecond: 331, // 05:31
      formulaPreview: 'AA = 0',
    },
    {
      id: 'chap_3',
      title: '3. Hai Vectơ Bằng Nhau & Ví Dụ Hình Lăng Trụ, Hình Hộp',
      startSecond: 690, // 11:30
      formulaPreview: 'AB = CD',
    },
    {
      id: 'chap_4',
      title: '4. Tổng Của Hai Vectơ (Quy tắc 3 điểm & Hình bình hành)',
      startSecond: 1350, // 22:30
      formulaPreview: 'OA + AB = OB',
    },
    {
      id: 'chap_5',
      title: '5. Quy Tắc Hình Hộp & Điểm Dừng Bẫy Độ Dài [37:13]',
      startSecond: 1813, // 30:13
      formulaPreview: 'Điểm dừng 37:13',
      hasCheckpoint: true,
    },
    {
      id: 'chap_6',
      title: '6. Hiệu Của Hai Vectơ ("Chung Đầu - Lộn Ngược")',
      startSecond: 3134, // 52:14
      formulaPreview: 'OA - OB = BA',
    },
    {
      id: 'chap_7',
      title: '7. Tích Của Vectơ Với 1 Số & Bẫy Ngược Hướng',
      startSecond: 3990, // 1:06:30
      formulaPreview: 'IA = -3·IG',
    },
    {
      id: 'chap_8',
      title: '8. Trọng Tâm Tứ Diện & Ví Dụ 8 (1:30:30)',
      startSecond: 4910, // 1:21:50
      formulaPreview: 'GA+GB+GC+GD=0',
    },
    {
      id: 'chap_9',
      title: '9. Dạng 1 & 2: Chứng Minh Đẳng Thức & Phân Tích Vectơ (Ví dụ 10)',
      startSecond: 5800, // 1:36:40
      formulaPreview: "B'C = c - a - b",
    },
  ],

  // Bản chép lời từng chặng nửa đầu video để phục vụ nút [Giơ tay hỏi] bất kỳ lúc nào
  transcriptCues: [
    {
      id: 'cue_1',
      start: 0,
      end: 330,
      speaker: 'Thầy Tiến',
      text: 'Vectơ trong không gian là một đoạn thẳng có hướng. Điểm đầu A, điểm cuối B ký hiệu là vectơ AB. Đường thẳng đi qua điểm đầu và điểm cuối gọi là giá của vectơ.',
      formula: 'Vectơ AB ≠ Vectơ BA (Ngược hướng)',
      linhChiNote: 'Đoạn thẳng thì AB = BA, nhưng vectơ có mũi tên chỉ hướng nên vectơ AB và vectơ BA là hai vectơ đối nhau!',
      minhKhangAnalogy: 'Giống như vé máy bay từ Đà Nẵng (A) ra Hà Nội (B) hoàn toàn khác với chiều bay từ Hà Nội (B) về Đà Nẵng (A)!',
    },
    {
      id: 'cue_2',
      start: 331,
      end: 689,
      speaker: 'Thầy Tiến',
      text: 'Hai vectơ được gọi là cùng phương nếu giá của chúng song song hoặc trùng nhau. Khi đã cùng phương thì mới xét đến cùng hướng hay ngược hướng.',
      formula: 'Cùng phương <=> Giá song song hoặc trùng nhau',
      linhChiNote: 'Quy tắc bắt buộc: Phải kiểm tra CÙNG PHƯƠNG trước, rồi mới được kết luận CÙNG HƯỚNG hay NGƯỢC HƯỚNG.',
      minhKhangAnalogy: 'Giống như 2 chiếc xe chạy trên 2 làn đường song song: Lúc đó ta mới xét xem 2 xe chạy cùng chiều hay ngược chiều nhau!',
    },
    {
      id: 'cue_3',
      start: 690,
      end: 1349,
      speaker: 'Thầy Tiến',
      text: 'Hai vectơ bằng nhau khi và chỉ khi chúng có cùng hướng và cùng độ dài. Trong hình lăng trụ tam giác hoặc hình hộp, các cạnh bên song song và bằng nhau.',
      formula: 'Vectơ a = Vectơ b <=> Cùng hướng & |a| = |b|',
      linhChiNote: "Trong hình hộp ABCD.A'B'C'D': Ta luôn có AA' = BB' = CC' = DD' và AB = DC = D'C' = A'B'.",
      minhKhangAnalogy: "Cứ tìm các cạnh song song, bằng nhau và đánh mũi tên cùng chiều trên hình hộp là ra các vectơ bằng nhau ngay!",
    },
    {
      id: 'cue_4',
      start: 1350,
      end: 1812,
      speaker: 'Thầy Tiến',
      text: 'Quy tắc 3 điểm (nối tiếp): Cho 3 điểm O, A, B bất kỳ, ta luôn có vectơ OA + vectơ AB = vectơ OB. Quy tắc hình bình hành: AB + AD = AC (chung gốc A).',
      formula: 'OA + AB = OB  |  AB + AD = AC',
      linhChiNote: 'Phân biệt nhanh: Nối đuôi nhau (cuối anh này là đầu anh kia) -> Quy tắc 3 điểm. Chung điểm đầu A -> Quy tắc hình bình hành.',
      minhKhangAnalogy: 'Đi từ Nhà (O) ghé qua Tiệm trà sữa (A) rồi tới Trường (B) thì kết quả dịch chuyển cuối cùng chính là từ Nhà (O) tới Trường (B)!',
    },
    {
      id: 'cue_5',
      start: 1813,
      end: 2190,
      speaker: 'Thầy Tiến',
      text: "Quy tắc hình hộp: Cho hình hộp ABCD.A'B'C'D'. Tổng của 3 vectơ xuất phát từ 1 đỉnh (2 cạnh đáy + 1 cạnh bên) bằng vectơ đường chéo chính xuất phát từ đỉnh đó.",
      formula: "AB + AD + AA' = AC'",
      linhChiNote: "Công thức vàng của hình hộp chung gốc A: AB + AD + AA' = AC' (với AC' là đường chéo xuyên qua tâm hình hộp).",
      minhKhangAnalogy: 'Giống như trong phòng học: Đi dọc tường (AB) + đi ngang phòng (AD) + bay thẳng lên trần nhà (AA\') thì chạm đúng góc chéo trên trần (AC\')!',
    },
    {
      id: 'cue_6',
      start: 2191,
      end: 3133,
      tag: 'checkpoint',
      speaker: 'Thầy Tiến',
      text: "Ví dụ 3 (37:13): Cho hình lập phương ABCD.A'B'C'D' cạnh bằng 1. Tính độ dài |BC + DD'|. Chú ý: Tuyệt đối không được tách thành |BC| + |DD'| = 1 + 1 = 2!",
      formula: "|BC + DD'| = |BC + CC'| = |BC'| = √2",
      linhChiNote: "Bắt buộc phải gom tổng 2 vectơ về 1 vectơ duy nhất trước khi lấy độ dài: Thay DD' = CC' để được BC + CC' = BC', suy ra |BC'| = √(1² + 1²) = √2.",
      minhKhangAnalogy: "Đi ngang 1 đơn vị (BC) rồi đi thẳng đứng lên 1 đơn vị (CC') tạo thành tam giác vuông cân cạnh 1, nên đường chéo BC' phải là √2 ≈ 1,41 chứ không phải bằng 1 + 1 = 2!",
    },
    {
      id: 'cue_7',
      start: 3134,
      end: 3989,
      speaker: 'Thầy Tiến',
      text: 'Hiệu của hai vectơ: Quy tắc trừ hai vectơ chung gốc O ("Chung đầu - Lộn ngược"): Vectơ OA trừ vectơ OB bằng vectơ BA (lấy điểm sau viết trước, điểm trước viết sau).',
      formula: 'OA - OB = BA (Chung gốc O -> Lộn ngược B lên trước A)',
      linhChiNote: "Mẹo chống nhầm ở Trạm 2: Muốn chèn điểm A vào vectơ B'C theo quy tắc hiệu, phải viết B'C = AC - AB' (đảo C lên trước B').",
      minhKhangAnalogy: 'Cứ nhớ khẩu quyết của thầy Tiến ở mốc 52:14: "Chung đầu - Lộn ngược", thấy dấu trừ chung gốc O là đảo đuôi lên đầu ngay!',
    },
  ],

  // =========================================================================
  // =========================================================================
  // LUỒNG THẢO LUẬN DÀY ĐẶC (ĐẶC BIỆT RÔM RẢ TRONG 5 PHÚT ĐẦU: 00:00 -> 05:30)
  // =========================================================================
  timelineComments: [
    {
      id: 'pin_an',
      second: 0,
      author: 'Trợ giảng An',
      role: 'ta',
      isPinned: true,
      text: 'Ghim trọng tâm Bài 1.1: (1) Xét cùng phương trước khi xét cùng hướng; (2) Quy tắc nối tiếp OA + AB = OB; (3) Đến mốc [37:13], để ý xem hai vectơ trong đề có cùng hướng không trước khi tính độ dài.',
    },

    // =======================================================================
    // PHÚT 00:00 -> 01:15: MỞ ĐẦU & KẾT NỐI KIẾN THỨC LỚP 10 LÊN KHÔNG GIAN 3D
    // =======================================================================
    {
      id: 'c_00_1',
      second: 8, // 0:08
      author: 'Trợ giảng An',
      role: 'ta',
      text: 'Chào cả lớp! Hôm nay chúng ta bắt đầu Chương 2 Hình học 12 (SGK mới): Vectơ trong không gian cùng thầy Nguyễn Phan Tiến. Các bạn mở sổ tay chuẩn bị nhé!',
    },
    {
      id: 'c_00_2',
      second: 22, // 0:22
      author: 'Bo',
      role: 'classmate',
      text: 'Nghe tới "Hình không gian" kết hợp với "Vectơ" là thấy hơi hồi hộp rồi đó. Không biết có khác nhiều so với hồi lớp 10 không mọi người?',
    },
    {
      id: 'c_00_3',
      second: 38, // 0:38
      author: 'Minh Khang',
      role: 'classmate',
      text: '@Bo Yên tâm đi! Hồi lớp 10 mình vẽ vectơ trên một mặt giấy phẳng 2D, còn lên lớp 12 là nhấc mũi tên đó ra không gian 3 chiều như căn phòng học của mình thôi.',
      replyTo: {
        id: 'c_00_2',
        author: 'Bo',
        text: 'Nghe tới "Hình không gian" kết hợp với "Vectơ" là thấy hơi hồi hộp rồi đó. Không biết có khác nhiều so với hồi lớp 10 không mọi người?',
      },
    },
    {
      id: 'c_00_4',
      second: 55, // 0:55
      author: 'Trí',
      role: 'classmate',
      text: 'Đúng rồi. Thầy Tiến vừa nhắc ở [0:50] kìa: Gần như toàn bộ định nghĩa, phép cộng, phép trừ vectơ ở lớp 10 đều được giữ nguyên bản chất khi đưa lên không gian 3D.',
    },

    // =======================================================================
    // PHÚT 01:15 -> 02:50: ĐỊNH NGHĨA VECTƠ, ĐIỂM ĐẦU - ĐIỂM CUỐI & ĐỘ DÀI
    // =======================================================================
    {
      id: 'c_01_1',
      second: 78, // 1:18
      author: 'Linh Chi',
      role: 'classmate',
      text: 'Mục 1 [1:18] — Định nghĩa: Vectơ trong không gian là một đoạn thẳng có hướng. Ký hiệu vectơ AB thì A là điểm đầu (gốc), B là điểm cuối (ngọn).',
    },
    {
      id: 'c_01_2',
      second: 102, // 1:42
      author: 'Bo',
      role: 'classmate',
      text: 'Khoan đã, nếu hai điểm A và B cố định trong không gian thì đoạn thẳng AB với BA là một, vậy vectơ AB với vectơ BA cũng bằng nhau luôn chứ nhỉ?',
    },
    {
      id: 'c_01_3',
      second: 120, // 2:00
      author: 'Trí',
      role: 'classmate',
      text: '@Bo Khác hoàn toàn nhé! Đoạn thẳng thì không phân biệt chiều nên AB = BA. Nhưng vectơ có mũi tên chỉ hướng: AB là đi từ A đến B, còn BA là đi ngược từ B về A.',
      replyTo: {
        id: 'c_01_2',
        author: 'Bo',
        text: 'Khoan đã, nếu hai điểm A và B cố định trong không gian thì đoạn thẳng AB với BA là một, vậy vectơ AB với vectơ BA cũng bằng nhau luôn chứ nhỉ?',
      },
    },
    {
      id: 'c_01_4',
      second: 138, // 2:18
      author: 'Minh Khang',
      role: 'classmate',
      text: '@Bo Cứ liên tưởng vé máy bay từ Đà Nẵng (A) ra Hà Nội (B) khác hẳn chiều bay từ Hà Nội (B) về Đà Nẵng (A) là không bao giờ nhầm gốc với ngọn!',
      replyTo: {
        id: 'c_01_2',
        author: 'Bo',
        text: 'Khoan đã, nếu hai điểm A và B cố định trong không gian thì đoạn thẳng AB với BA là một, vậy vectơ AB với vectơ BA cũng bằng nhau luôn chứ nhỉ?',
      },
    },
    {
      id: 'c_01_5',
      second: 158, // 2:38
      author: 'Linh Chi',
      role: 'classmate',
      text: 'Ghi chú thêm ở [2:38]: Độ dài của vectơ AB (ký hiệu |AB|) là khoảng cách giữa điểm đầu A và điểm cuối B. Nên về độ dài thì |AB| = |BA| = đoạn thẳng AB.',
    },
    {
      id: 'c_01_6',
      second: 175, // 2:55
      author: 'Bo',
      role: 'classmate',
      text: 'À hiểu rồi! Tức là vectơ AB ≠ vectơ BA (vì ngược chiều mũi tên), nhưng khi đóng dấu giá trị tuyệt đối tính độ dài thì |AB| = |BA|. Ghi vào sổ ngay!',
    },

    // =======================================================================
    // PHÚT 02:55 -> 04:15: KHÁI NIỆM "GIÁ CỦA VECTƠ"
    // =======================================================================
    {
      id: 'c_03_1',
      second: 195, // 3:15
      author: 'Bo',
      role: 'classmate',
      text: 'Ở [3:15] thầy Tiến vừa viết thuật ngữ "Giá của vectơ". Sao lại gọi là cái giá vậy mọi người? Nghe hơi trừu tượng.',
    },
    {
      id: 'c_03_2',
      second: 212, // 3:32
      author: 'Linh Chi',
      role: 'classmate',
      text: '@Bo Định nghĩa chuẩn thầy đang ghi trên bảng ở [3:32] nè: Đường thẳng đi qua điểm đầu A và điểm cuối B của vectơ AB được gọi là "giá" của vectơ đó.',
    },
    {
      id: 'c_03_3',
      second: 230, // 3:50
      author: 'Minh Khang',
      role: 'classmate',
      text: 'Nhìn đường nét đứt thầy Tiến vừa kéo dài hai đầu qua A và B kìa Bo! Nếu vectơ AB là đoàn tàu hỏa thì đường thẳng chứa nó chính là "đường ray" (giá) đỡ đoàn tàu đó.',
    },
    {
      id: 'c_03_4',
      second: 248, // 4:08
      author: 'Trí',
      role: 'classmate',
      text: 'Và nhờ có cái "đường ray" (giá) này thì sang mục tiếp theo mình mới định nghĩa được thế nào là hai vectơ cùng phương trong không gian 3 chiều.',
    },

    // =======================================================================
    // PHÚT 04:15 -> 05:30: HAI VECTƠ CÙNG PHƯƠNG & BẪY ĐƯỜNG THẲNG CHÉO NHAU
    // =======================================================================
    {
      id: 'c_04_1',
      second: 265, // 4:25
      author: 'Linh Chi',
      role: 'classmate',
      text: 'Mục [4:25] — Hai vectơ cùng phương: Là hai vectơ có giá song song hoặc trùng nhau. Mọi người nhớ đủ cả 2 trường hợp: SONG SONG hoặc TRÙNG NHAU nhé!',
    },
    {
      id: 'c_04_2',
      second: 282, // 4:42
      author: 'Bo',
      role: 'classmate',
      text: 'Nếu trong không gian có 2 vectơ nằm trên 2 đường thẳng chéo nhau (không cắt cũng không song song) thì mình gọi là hai vectơ ngược hướng được không?',
    },
    {
      id: 'c_04_3',
      second: 298, // 4:58
      author: 'Trí',
      role: 'classmate',
      text: '@Bo Tuyệt đối không nhé! Hai đường thẳng chéo nhau thì giá của chúng không song song cũng không trùng nhau, nên hai vectơ đó KHÔNG cùng phương.',
    },
    {
      id: 'c_04_4',
      second: 312, // 5:12
      author: 'Trợ giảng An',
      role: 'ta',
      text: 'Câu hỏi của Bo ở [4:42] rất hay! Cả lớp lưu ý quy tắc tiên quyết: Hai vectơ PHẢI CÙNG PHƯƠNG trước, sau đó ta mới xét tiếp chúng cùng hướng hay ngược hướng.',
    },
    {
      id: 'c_04_5',
      second: 328, // 5:28
      author: 'Minh Khang',
      role: 'classmate',
      text: 'Giống như 2 chiếc xe phải chạy trên cùng một con đường hoặc 2 làn đường song song (cùng phương), lúc đó mới so sánh được là chạy cùng chiều hay ngược chiều!',
    },

    // =======================================================================
    // PHÚT 05:31 -> 11:30: VECTƠ-KHÔNG (0) & CÙNG HƯỚNG, NGƯỢC HƯỚNG
    // =======================================================================
    {
      id: 'c_05_1',
      second: 380, // 6:20
      author: 'Trí',
      role: 'classmate',
      text: 'Phút [06:20]: Điểm đặc biệt của vectơ-không (AA = BB = 0) là điểm đầu trùng điểm cuối nên độ dài bằng 0 và quy ước nó cùng phương, cùng hướng với MỌI vectơ.',
    },
    {
      id: 'c_05_1b',
      second: 435, // 7:15
      author: 'Bo',
      role: 'classmate',
      text: 'Ủa, từ C về A thì vẫn là 1 đoạn dài mà, giống như tớ tới trường rồi về nhà cũng đi 1 đoạn dài mà, chứ đâu phải là 0?',
    },
    {
      id: 'c_05_1c',
      second: 455, // 7:35
      author: 'Trí',
      role: 'classmate',
      text: '@Bo Phải phân biệt rạch ròi QUÃNG ĐƯỜNG với ĐỘ DỜI! Đi từ Nhà (A) đến Trường rồi về Nhà, đồng hồ xe vẫn đo quãng đường s > 0. Nhưng về VECTƠ ĐỘ DỜI: điểm đầu là A, điểm cuối là A, nên vectơ tổng bằng vectơ AA = vectơ 0!',
      replyTo: {
        id: 'c_05_1b',
        author: 'Bo',
        text: 'Ủa, từ C về A thì vẫn là 1 đoạn dài mà, giống như tớ tới trường rồi về nhà cũng đi 1 đoạn dài mà, chứ đâu phải là 0?',
      },
    },
    {
      id: 'c_05_1d',
      second: 475, // 7:55
      author: 'Minh Khang',
      role: 'classmate',
      text: '@Bo Chuẩn luôn Trí! Giống bạn chạy máy tập gym 5km mồ hôi nhễ nhại, nhưng bước xuống máy thì vị trí vẫn ở phòng tập (độ dời = 0)! Vectơ chỉ nhìn điểm đầu và điểm cuối thôi.',
      replyTo: {
        id: 'c_05_1b',
        author: 'Bo',
        text: 'Ủa, từ C về A thì vẫn là 1 đoạn dài mà, giống như tớ tới trường rồi về nhà cũng đi 1 đoạn dài mà, chứ đâu phải là 0?',
      },
    },
    {
      id: 'c_05_2',
      second: 550, // 9:10
      author: 'Linh Chi',
      role: 'classmate',
      text: 'Tóm tắt bảng phân loại ở [09:10]: Hai vectơ cùng phương chỉ có 2 khả năng xảy ra: hoặc CÙNG HƯỚNG (mũi tên chỉ cùng chiều), hoặc NGƯỢC HƯỚNG.',
    },

    // =======================================================================
    // PHÚT 11:30 -> 22:30: HAI VECTƠ BẰNG NHAU & VÍ DỤ LĂNG TRỤ, HÌNH HỘP
    // =======================================================================
    {
      id: 'c_08',
      second: 740, // 12:20
      author: 'Linh Chi',
      role: 'classmate',
      text: 'Định nghĩa hai vectơ bằng nhau [12:20]: Vectơ a = vectơ b khi và chỉ khi thỏa mãn đồng thời 2 điều kiện: (1) Cùng hướng và (2) Cùng độ dài (|a| = |b|).',
    },
    {
      id: 'c_09',
      second: 930, // 15:30
      author: 'Bo',
      role: 'classmate',
      text: "Ở Ví dụ 1 hình lăng trụ tam giác ABC.A'B'C' [15:30], cạnh AB với B'C' đều nằm ở mặt đáy cả, vậy vectơ AB = vectơ B'C' đúng không?",
    },
    {
      id: 'c_10',
      second: 960, // 16:00
      author: 'Minh Khang',
      role: 'classmate',
      text: "@Bo Nhìn kỹ hình lăng trụ tam giác nha! AB và B'C' không hề song song (không cùng phương). Vectơ AB chỉ bằng vectơ A'B' thôi, còn cạnh bên thì AA' = BB' = CC'.",
    },
    {
      id: 'c_11',
      second: 1180, // 19:40
      author: 'Trí',
      role: 'classmate',
      text: 'Kinh nghiệm làm trắc nghiệm Ví dụ 2 [19:40]: Trong hình hộp ABCD.A\'B\'C\'D\', cứ 1 vectơ cạnh (như AB) sẽ có đúng 3 vectơ cạnh khác bằng nó (DC, A\'B\', D\'C\').',
    },

    // =======================================================================
    // PHÚT 22:30 -> 30:13: QUY TẮC 3 ĐIỂM & QUY TẮC HÌNH BÌNH HÀNH
    // =======================================================================
    {
      id: 'c_12',
      second: 1380, // 23:00
      author: 'Linh Chi',
      role: 'classmate',
      text: 'Sang phần Phép cộng vectơ [23:00]: Quy tắc 3 điểm (nối tiếp) OA + AB = OB. Điểm cuối của vectơ thứ nhất phải trùng với điểm đầu của vectơ thứ hai.',
    },
    {
      id: 'c_13',
      second: 1498, // 24:58
      author: 'Minh Khang',
      role: 'classmate',
      text: 'Ví dụ thực tế ở [24:58] rất dễ nhớ: Đi từ Nhà (O) ghé qua điểm A rồi tới Trường (B), thì độ dịch chuyển tổng cộng chính là đi từ Nhà tới Trường: OA + AB = OB.',
    },
    {
      id: 'c_14',
      second: 1680, // 28:00
      author: 'Trí',
      role: 'classmate',
      text: 'Phân biệt rõ ở [28:00]: Nối đuôi (OA + AB) thì dùng quy tắc 3 điểm. Còn CHUNG GỐC A (AB + AD) trong hình bình hành ABCD thì tổng là vectơ đường chéo AC.',
    },

    // =======================================================================
    // PHÚT 30:13 -> 40:00: QUY TẮC HÌNH HỘP & ĐIỂM DỪNG BẪY ĐỘ DÀI [37:13]
    // =======================================================================
    {
      id: 'c_15',
      second: 1850, // 30:50
      author: 'Linh Chi',
      role: 'classmate',
      text: "Công thức trọng tâm lớp 12 ở [30:50] — Quy tắc hình hộp: Tổng 3 vectơ chung gốc A (2 cạnh đáy + 1 cạnh bên) bằng vectơ đường chéo chính: AB + AD + AA' = AC'.",
    },
    {
      id: 'c_16',
      second: 1980, // 33:00
      author: 'Minh Khang',
      role: 'classmate',
      text: "Hình dung trong phòng học ở [33:00]: Đi dọc tường (AB) + đi ngang sàn (AD) + lên thẳng trần nhà (AA') sẽ chạm đúng góc đối diện trên trần (AC').",
    },
    {
      id: 'c_17',
      second: 2205, // 36:45 (Ngay trước điểm dừng 37:13)
      author: 'Bo',
      role: 'classmate',
      text: "Ở Ví dụ 3 [36:45], hình lập phương cạnh bằng 1, đề bắt tính |BC + DD'|. Mình tách thẳng thành |BC| + |DD'| = 1 + 1 = 2 luôn cho nhanh được không?",
    },
    {
      id: 'c_18',
      second: 2225, // 37:05 (Sát nút điểm dừng 37:13)
      author: 'Trí',
      role: 'classmate',
      text: '@Bo Cẩn thận mắc bẫy ở [37:13]! Hai vectơ vuông góc nhau không thể cộng đại số độ dài 1 + 1 = 2 được. Thầy Tiến đang dừng lại giải thích trên bảng kìa!',
      citations: [
        {
          source: 'video',
          label: 'Ví dụ 3 (37:13)',
          snippet: "Độ dài |BC + DD'| = |BC + CC'| = |BC'| = √2",
          timestamp: 2233,
        },
        {
          source: 'blackboard',
          label: 'Bảng phấn 37:13',
          snippet: "|\\vec{BC} + \\vec{DD'}|",
          timestamp: 2233,
        },
        {
          source: 'sgk',
          label: 'SGK Hình học 12',
          snippet: 'Quy tắc tam giác & vectơ bằng nhau trong không gian',
        },
      ],
    },
    {
      id: 'c_19',
      second: 2340, // 39:00 (Câu b Ví dụ 3 ngay sau điểm dừng)
      author: 'Linh Chi',
      role: 'classmate',
      text: "Sang câu b ở [39:00]: Tính |AB + AD + AA'| thì áp dụng trực tiếp quy tắc hình hộp bằng |AC'| = căn(1² + 1² + 1²) = căn 3.",
    },

    // =======================================================================
    // PHÚT 45:00 -> 58:00: QUY TẮC HIỆU HAI VECTƠ (NỐI SANG TRẠM 2)
    // =======================================================================
    {
      id: 'c_20',
      second: 3150, // 52:30
      author: 'Linh Chi',
      role: 'classmate',
      text: 'Phút [52:30]: Chuyển sang phần HIỆU CỦA HAI VECTƠ. Phần này rất hay nhầm thứ tự điểm, mọi người lưu ý để áp dụng ở Trạm 2 nhé.',
    },
    {
      id: 'c_21',
      second: 3422, // 57:02
      author: 'Minh Khang',
      role: 'classmate',
      text: 'Quy tắc trừ chung gốc O của thầy Tiến ở [57:02]: "Chung đầu - Lộn ngược" — OA - OB = BA (chung gốc O thì đảo điểm B lên viết trước điểm A).',
    },
    {
      id: 'c_22',
      second: 3480, // 58:00
      author: 'Bo',
      role: 'classmate',
      text: 'Quy tắc trừ OA - OB = BA ở [58:00] dễ nhầm thứ tự thật, mình rất hay quen tay viết xuôi thành AB khi phân tích vectơ.',
    },
    {
      id: 'c_end_1',
      second: 9480, // 2:38:00
      author: 'Linh Chi',
      role: 'classmate',
      text: 'Thầy Tiến chuẩn bị kết thúc bài giảng rồi cả lớp ơi! Các bạn mở sổ tay chuẩn bị qua Trạm 2 luyện tập nhé.',
    },
    {
      id: 'c_end_2',
      second: 9500, // 2:38:20
      author: 'Minh Khang',
      role: 'classmate',
      text: 'Xem xong 2 tiếng rưỡi bài giảng này thấy hình không gian dễ hiểu hơn hẳn!',
    },
    {
      id: 'c_end_3',
      second: 9503, // 2:38:23
      author: 'Trợ giảng An',
      role: 'ta',
      text: 'Chúc mừng cả lớp đã hoàn thành toàn bộ bài giảng Video Trạm 1! Mời các bạn chuyển sang Trạm 2 (Sổ tay bắt lỗi) để kiểm tra độ nhạy bén nào.',
    },
  ],

  // Câu hỏi dừng đột ngột tại mốc 37:13 (Ví dụ 3 câu a)
  checkpointQuestion: {
    prompt: "Cho hình lập phương ABCD.A'B'C'D' có cạnh bằng 1. Độ dài của tổng hai vectơ |BC + DD'| bằng bao nhiêu và tính thế nào?",
    options: [
      {
        id: 'opt_a',
        label: "Thay DD' = CC' để nối tiếp: |BC + CC'| = |BC'| = √(1² + 1²) = √2",
        isStandardBest: true,
        feedback: "Chính xác! Phải đưa về hai vectơ nối tiếp BC + CC' = BC' rồi mới tính độ dài đường chéo mặt bên.",
      },
      {
        id: 'opt_b',
        label: "Tách trực tiếp thành tổng hai độ dài: |BC| + |DD'| = 1 + 1 = 2",
        isStandardBest: false,
        feedback: 'Sập bẫy giống Bo rồi! Tuyệt đối không được tách độ dài của tổng thành tổng hai độ dài.',
      },
      {
        id: 'opt_c',
        label: "Dùng công thức đường chéo hình lập phương: Bằng √3",
        isStandardBest: false,
        feedback: "Chưa đúng! Khi nào cộng đủ 3 kích thước |AB + AD + AA'| mới ra đường chéo chính √3.",
      },
    ],
  },

  boArgument: {
    speech: "Ủa sao cậu phải đổi DD' thành CC' chi cho cực vậy?! Tớ thấy |BC + DD'| thì cứ tách thẳng ra thành |BC| + |DD'| = 1 + 1 = 2 luôn trong 1 nốt nhạc chứ sao lại ra √2?!",
  },

  rebuttalStickers: [
    {
      id: 'stk_1',
      text: "Cấm tách |a + b| = |a| + |b|! Phải thế DD' = CC' để gom về 1 vectơ BC' rồi mới tính Pytago ra √2.",
      isEffective: true,
      feedback: "Bo tâm phục khẩu phục! Phải gom biểu thức trong trị tuyệt đối thành 1 vectơ duy nhất trước.",
    },
    {
      id: 'stk_2',
      text: "Đi ngang 1m (BC) rồi đi thẳng đứng lên 1m (CC') thì đường chéo mặt bên BC' phải là cạnh huyền √2m!",
      isEffective: true,
      feedback: 'Ví dụ thực tế quá chuẩn! Hai vectơ vuông góc nhau nên phải dùng định lý Pytago.',
    },
    {
      id: 'stk_3',
      text: 'Tại vì bài hình học không gian nào của thầy Tiến cũng phải có căn bậc hai trong đáp án.',
      isEffective: false,
      feedback: 'Bo chưa chịu đâu! Lý do này là đoán mò, bạn hãy dùng quy tắc nối tiếp vectơ để giải thích cho Bo nhé!',
    },
  ],

  boConcession: {
    speech: "Ối giời ơi đúng ha! Đi ngang 1 bước rồi đi thẳng lên 1 bước thì khoảng cách chéo phải là √2! Tớ chừa tật tách bừa |a + b| = |a| + |b| rồi!",
  },

  teacherClosure: {
    goldenRule: "Quy tắc vàng [37:13]: Tuyệt đối không tách |a + b| = |a| + |b|. Luôn thu gọn biểu thức bên trong thành 1 vectơ duy nhất trước khi tính độ dài!",
  },

  freezeNote: "Ở Ví dụ 3 [36:44], hai vectơ BC và DD' đang rời nhau. Hãy tìm một cạnh bên bằng với DD' nhưng có điểm đầu trùng với điểm C (chính là CC') để áp dụng quy tắc nối tiếp BC + CC' = BC'!",

  peerContext: {
    bo: {
      hotTake: "Mình cứ thấy |BC + DD'| là muốn tách thẳng ra 1 + 1 = 2, còn gặp phép trừ OA - OB là quen tay viết xuôi thành AB luôn!",
      defaultReply: "Ơ... phải thế DD' = CC' để nối đuôi thành BC' rồi dùng Pytago ra √2 hả? Hèn gì thầy Tiến gạch chéo số 2 trên bảng!",
      quickPrompts: [
        "Sao cậu lại tách |BC + DD'| = 1 + 1 = 2?",
        'Chỗ nào trong bài này cậu dễ bị lừa nhất?',
      ],
    },
    tri: {
      edgeCaseNote: 'Cần nhớ 2 điều kiện biên: 1) Hai vectơ chỉ xét cùng hướng/ngược hướng khi đã cùng phương. 2) |a + b| = |a| + |b| chỉ xảy ra khi a và b cùng hướng!',
      defaultReply: "Chính xác! Vì BC và DD' vuông góc nhau trong không gian nên |BC + DD'| < |BC| + |DD'| theo bất đẳng thức tam giác.",
      quickPrompts: [
        'Khi nào thì |a + b| mới bằng |a| + |b|?',
        'Vì sao phải xét cùng phương trước khi xét cùng hướng?',
      ],
    },
    linhchi: {
      cheatSheetTitle: 'Sổ tay 4 Quy tắc Trọng tâm Nửa đầu Video (Thầy Tiến)',
      cheatSheetBullets: [
        '1. Quy tắc 3 điểm (Nối tiếp - 23:00): OA + AB = OB (Cuối anh trước trùng đầu anh sau).',
        '2. Quy tắc hình bình hành (Chung gốc - 28:00): AB + AD = AC.',
        "3. Quy tắc hình hộp (Chung gốc 3D - 30:50): AB + AD + AA' = AC' (Đường chéo chính).",
        '4. Quy tắc hiệu ("Chung đầu - Lộn ngược" - 57:02): OA - OB = BA (Điểm sau viết trước).',
      ],
      defaultReply: "Mình đã ghi rõ ở phút [36:55]: Muốn tính |BC + DD'|, bước 1 thay DD' = CC', bước 2 cộng nối tiếp BC + CC' = BC', bước 3 tính |BC'| = √2!",
      quickPrompts: [
        'Tóm tắt giúp mình 4 công thức nửa đầu video với!',
        'Khẩu quyết "Chung đầu - Lộn ngược" ở phút 57:02 là gì?',
      ],
    },
    minhkhang: {
      analogyTitle: 'Góc Liên tưởng Thực tế của Minh Khang',
      analogyContent: "Hãy tưởng tượng hình lập phương như một căn phòng cạnh 1m:\n• Đi dọc chân tường từ B đến C (1m).\n• Leo thẳng đứng từ C lên trần C' (1m).\n• Khoảng cách đường chéo trên bức tường BC' chính là cạnh huyền tam giác vuông: √(1² + 1²) = √2m!",
      defaultReply: 'Cứ hình dung bạn đi bộ ngang 1m rồi đi lên cầu thang 1m thì khoảng cách chim bay là đường chéo √2m chứ không thể là 2m được!',
      quickPrompts: [
        'Giải thích quy tắc hình hộp bằng hình ảnh căn phòng đi!',
        'Làm sao nhớ nhanh quy tắc 3 điểm OA + AB = OB?',
      ],
    },
  },
};

export const VIDEO_LESSON_LIBRARY: VideoLessonItem[] = [
  VECTO_12_THAY_TIEN_LESSON,
  {
    id: 'VID_001',
    title: 'Toán 9: Giải phương trình tích x(x − 2) = 3x & Cạm bẫy chia biến số',
    subject: 'Đại số 9',
    duration: 110,
    checkpointTimestamp: 50,
    youtubeId: 'd_kO9xGZfI8',
    videoUrl: 'https://www.youtube.com/watch?v=d_kO9xGZfI8',
    blackboardTitle: 'Bài toán: Giải phương trình x(x − 2) = 3x',
    lectureNotes: [
      'Cô Lam: "Chào cả lớp! Hôm nay cô trò mình cùng xem một phương trình nhìn thì rất quen thuộc."',
      'Cô Lam viết lên bảng: x(x − 2) = 3x',
      'Cô Lam: "Cả hai vế đều xuất hiện nhân tử x. Nhiều bạn rất thích làm một thao tác rút gọn nhanh chóng..."',
      'Cô Lam dừng phấn: "Em và Bo thử tìm nghiệm của phương trình này xem sao nhé!"',
      'Thử thế x = 0 vào đề bài: 0(0 − 2) = 3(0) ⇔ 0 = 0 (Luôn đúng! Vậy x = 0 là 1 nghiệm).',
      'Cách giải chuẩn: Chuyển 3x sang vế trái đổi dấu: x(x − 2) − 3x = 0 ⇔ x(x − 5) = 0 ⇒ x = 0 hoặc x = 5.'
    ],

    // 1. PHÂN CẢNH KIỂU YOUTUBE CHAPTERS
    chapters: [
      {
        id: 'chap_1',
        title: 'Phần 1: Mở đầu & Phân tích hai vế phương trình',
        startSecond: 0,
        formulaPreview: 'x(x − 2) = 3x'
      },
      {
        id: 'chap_2',
        title: 'Phần 2: Cạm bẫy chia 2 vế cho x của Bo',
        startSecond: 24,
        formulaPreview: 'Chia cho x  Mất nghiệm?'
      },
      {
        id: 'chap_3',
        title: 'Phần 3: Điểm dừng suy ngẫm & Đối chất cùng Bo',
        startSecond: 50,
        hasCheckpoint: true,
        formulaPreview: 'Điểm dừng 00:50'
      },
      {
        id: 'chap_4',
        title: 'Phần 4: Chuyển vế đặt nhân tử chung & Chốt quy tắc',
        startSecond: 66,
        formulaPreview: 'x(x − 5) = 0  S = {0; 5}'
      }
    ],

    // 2. BẢN CHÉP LỜI TỪNG GIÂY (CHUẨN COURSERA & YOUTUBE - ẤN ĐỂ TUA)
    transcriptCues: [
      {
        id: 'cue_1',
        start: 0,
        end: 11,
        speaker: 'Cô Lam',
        text: 'Chào cả lớp! Hôm nay cô trò mình cùng xử lý một phương trình nhìn cực kỳ quen thuộc nhưng 70% học sinh bị mất điểm.',
      },
      {
        id: 'cue_2',
        start: 12,
        end: 23,
        speaker: 'Bảng Phấn',
        text: 'Cô Lam viết đề bài lên bảng: Giải phương trình nghiệm thực sau:',
        formula: 'x(x − 2) = 3x',
        tag: 'formula'
      },
      {
        id: 'cue_3',
        start: 24,
        end: 35,
        speaker: 'Cô Lam',
        text: 'Quan sát hai vế: Cả vế trái x(x − 2) và vế phải 3x đều có nhân tử x. Nhiều bạn thấy vậy liền chia cả hai vế cho x.',
      },
      {
        id: 'cue_4',
        start: 36,
        end: 49,
        speaker: 'Bo',
        text: 'Ủa cô ơi, hai bên đều có x thì mình gạch phăng chữ x đi còn x − 2 = 3, suy ra x = 5 luôn cho nhanh chứ chuyển vế chi cho cực ạ?',
        formula: 'Bẫy của Bo: x − 2 = 3 ⇒ x = 5',
        tag: 'trap'
      },
      {
        id: 'cue_5',
        start: 50,
        end: 65,
        speaker: 'Cô Lam',
        text: '[ĐIỂM DỪNG SUY NGẪM]: Theo em, phương trình x(x − 2) = 3x có nghiệm là gì và nên giải thế nào để không sót nghiệm?',
        tag: 'checkpoint'
      },
      {
        id: 'cue_6',
        start: 66,
        end: 85,
        speaker: 'Cô Lam',
        text: 'Hãy kiểm tra thử x = 0: Thay vào ta có 0(0 − 2) = 3(0) hay 0 = 0 (Luôn đúng!). Nếu chia hai vế cho x, ta đã vô tình chia cho 0 và làm bay mất nghiệm x = 0!',
        formula: 'Thử x = 0: 0 = 0 (Thỏa mãn!)',
        tag: 'formula'
      },
      {
        id: 'cue_7',
        start: 86,
        end: 110,
        speaker: 'Cô Lam',
        text: 'Quy tắc vàng: Chuyển 3x sang vế trái thành −3x rồi đặt x làm nhân tử chung: x(x − 2 − 3) = 0 ⇔ x(x − 5) = 0. Ta thu được đủ 2 nghiệm x = 0 hoặc x = 5!',
        formula: 'x(x − 5) = 0 ⇔ x = 0 hoặc x = 5',
        tag: 'rule'
      }
    ],

    // 3. SỔ TAY & CHAT RIÊNG ĐỒNG BỘ 100% VỚI BÀI PHƯƠNG TRÌNH TÍCH
    peerContext: {
      bo: {
        hotTake: 'Tớ thấy cả 2 vế của x(x − 2) = 3x đều có chữ x. Cứ gạch phăng x ở hai bên là ra x − 2 = 3 ⇒ x = 5 trong 2 giây! Cậu chứng minh tớ sai đi?',
        quickPrompts: [
          'Nếu x = 0 thì phép chia cho x có nghĩa không Bo?',
          'Cậu thay thử x = 0 vào đề bài xem hai vế có bằng nhau không!'
        ],
        defaultReply: 'Ơ... cậu bảo thay x = 0 vào thì vế trái = 0, vế phải cũng = 0 á? Ủa vậy x = 0 cũng là nghiệm thật hả?!'
      },
      tri: {
        edgeCaseNote: 'Góc soi điều kiện biên (Bloom Analyze): Trong phép chia A / B, điều kiện bắt buộc là B ≠ 0. Vì ẩn x chưa biết bằng bao nhiêu nên x hoàn toàn có thể bằng 0!',
        quickPrompts: [
          'Tại sao chuyển vế thì bảo toàn nghiệm còn chia hai vế lại mất nghiệm?',
          'Khi nào thì mới được phép chia hai vế cho biểu thức chứa x?'
        ],
        defaultReply: 'Câu hỏi rất sắc bén! Phép cộng/trừ cùng một biểu thức vào 2 vế luôn xác định với mọi x ∈ ℝ. Còn phép chia chỉ tương đương khi ta đã xét riêng trường hợp nhân tử đó bằng 0!'
      },
      linhchi: {
        cheatSheetTitle: 'Sổ tay Phương trình tích A(x)·B(x) = 0',
        cheatSheetBullets: [
          'Bước 1: Chuyển tất cả các hạng tử sang vế trái, vế phải bằng 0 (Nhớ đổi dấu: +3x chuyển sang thành −3x).',
          'Bước 2: Đặt nhân tử chung x ra ngoài: x(x − 2 − 3) = 0 ⇔ x(x − 5) = 0.',
          'Bước 3: Cho từng nhân tử bằng 0: x = 0 hoặc x − 5 = 0 ⇒ S = {0; 5}.',
          '️ Cấm kỵ: Tuyệt đối không gạch bỏ nhân tử chứa ẩn x ở hai vế!'
        ],
        quickPrompts: [
          'Cho tớ xem lại 3 bước đưa về phương trình tích chuẩn!',
          'Tại sao chuyển 3x sang trái lại thành x(x − 5) = 0?'
        ],
        defaultReply: 'Cậu nhìn Bước 2 trên Sổ tay của tớ nhé: Khi chuyển +3x sang trái ta có x(x − 2) − 3x = 0. Đặt x chung thì bên trong ngoặc còn (x − 2 − 3) = (x − 5) đó!'
      },
      minhkhang: {
        analogyTitle: 'Ẩn dụ Đời sống & Hình ảnh Đồ thị',
        analogyContent: 'Hãy tưởng tượng hai vế y = x(x − 2) (đường cong Parabol) và y = 3x (đường thẳng). Nếu vẽ lên mặt phẳng tọa độ, đường thẳng cắt đường cong tại ĐÚNG 2 ĐIỂM là gốc tọa độ (0;0) và điểm (5;15). Làm như Bo là chặt đứt mất 1 giao điểm ở gốc tọa độ rồi!',
        quickPrompts: [
          'Giải thích kiểu chiếc cân thăng bằng cho bài này thế nào Khang?',
          'Làm sao kiểm tra nhanh xem mình có bị sót nghiệm không?'
        ],
        defaultReply: 'Cực dễ luôn! Cứ mỗi lần thấy cả 2 vế có chung chữ x, cậu nhẩm thay ngay số 0 vào chữ x. Thấy 0 = 0 đúng cái rụp là biết ngay x = 0 là một nghiệm bỏ túi rồi!'
      }
    },

    // 4. CHECKPOINT QUIZ & BO DEBATE
    checkpointQuestion: {
      prompt: 'Theo em, phương trình x(x − 2) = 3x có nghiệm là gì và nên biến đổi thế nào?',
      options: [
        {
          id: 'opt_1',
          label: 'Chuyển vế đặt nhân tử chung: x(x − 5) = 0 → Nghiệm là x = 0 hoặc x = 5',
          isStandardBest: true,
          feedback: 'Chính xác về mặt kết quả! Nhưng Bo vẫn chưa phục cách chuyển vế đâu, hãy bẻ gãy lý lẽ của Bo nhé!',
          remediationSecond: 86
        },
        {
          id: 'opt_2',
          label: 'Chia cả 2 vế cho x: x − 2 = 3 → Nghiệm duy nhất là x = 5',
          isStandardBest: false,
          feedback: 'Coi chừng! Em vừa rơi vào bẫy chia cho biến số chưa khác 0 giống hệt Bo, làm mất nghiệm x = 0 rồi!',
          remediationSecond: 24
        },
        {
          id: 'opt_3',
          label: 'Phương trình vô nghiệm vì x ở hai vế tự triệt tiêu hết',
          isStandardBest: false,
          feedback: 'Thay thử x = 5 vào hai vế đều bằng 15 mà! Hãy xem lại bước chuyển vế nhé.',
          remediationSecond: 12
        }
      ]
    },
    boArgument: {
      speech: 'Ủa sao phải chuyển vế đặt nhân tử chung chi cho dài dòng vậy cậu? Cứ chia luôn cả 2 vế cho x như câu (B) ra x − 2 = 3 ⇒ x = 5 nhanh gấp đôi mà?!',
      shortcutClaim: 'Chia cả 2 vế cho x để rút gọn nhanh',
      fallacyType: 'Chia cho biến số chưa khác 0 (Làm mất nghiệm)'
    },
    rebuttalStickers: [
      {
        id: 'stk_1',
        text: 'Vì x có thể bằng 0! Toán học cấm chia hai vế cho một biểu thức chưa biết khác 0 hay chưa.',
        isEffective: true,
        bloomLevel: 'Evaluate',
        feedback: 'Lập luận cực kỳ sắc bén (Đạt mức Evaluate)! Đánh trúng điều kiện tồn tại của phép chia.'
      },
      {
        id: 'stk_2',
        text: 'Nếu gạch x ở hai vế đi là cậu đã làm bay mất nghiệm x = 0 rồi (thay x = 0 vào được 0 = 0 luôn đúng)!',
        isEffective: true,
        bloomLevel: 'Analyze',
        feedback: 'Phản chứng tuyệt vời (Đạt mức Analyze)! Đưa ra ngay nghiệm x = 0 bị bỏ sót.'
      },
      {
        id: 'stk_3',
        text: 'Tại vì cô giáo bắt phải chuyển vế sang bên trái chứ không được chia.',
        isEffective: false,
        bloomLevel: 'Remember',
        feedback: 'Bo chưa phục đâu! Hãy giải thích bằng lý do toán học (điều kiện của x hoặc nghiệm bị mất) nhé.'
      }
    ],
    boConcession: {
      speech: 'Á đù, đúng ha! Thay x = 0 vào đề bài thì 0(0 − 2) = 3(0) ⇔ 0 = 0 đúng thật! Hóa ra chia cho x là tớ tự tay vứt đi nghiệm x = 0! Tớ phục cậu sát đất luôn!',
      realizationNote: 'Bo đã hiểu: Chia hai vế cho ẩn x làm mất nghiệm x = 0.'
    },
    teacherClosure: {
      speech: 'Xuất sắc! Em không chỉ chọn đúng mà còn giải thích rất rõ bản chất toán học để giúp Bo nhận ra lỗi sai.',
      goldenRule: 'Quy tắc vàng: Tuyệt đối KHÔNG chia cả hai vế của phương trình cho một biểu thức chứa ẩn khi chưa xét trường hợp nó bằng 0!'
    },
    freezeNote: 'Gợi ý từ Cô Lam: Ở phương trình x(x − 2) = 3x, trước khi muốn chia hai vế cho x, em hãy tự hỏi: "Lỡ x = 0 thì có chia cho 0 được không?"',
    timelineComments: [
      {
        id: 'tc_pin',
        second: 0,
        author: 'Trợ giảng An',
        role: 'ta',
        text: 'Nhắc bài: Luôn để ý điều kiện xác định và đặt nhân tử chung trước khi rút gọn!',
        isPinned: true
      },
      {
        id: 'tc_1',
        second: 12,
        author: 'Linh Chi',
        role: 'classmate',
        text: 'Tớ chép đề vào sổ tay rồi nhé: Giải phương trình x(x − 2) = 3x.'
      },
      {
        id: 'tc_2',
        second: 24,
        author: 'Minh Khang',
        role: 'classmate',
        text: 'Em đoán phải chuyển 3x sang vế trái thành −3x rồi mới đặt nhân tử chung x ra ngoài.'
      },
      {
        id: 'tc_3',
        second: 36,
        author: 'Bo Ngây Ngô',
        role: 'classmate',
        text: 'Ủa sao không chia x cho nhanh? 2 bên đều có x mà ta, gạch cái rẹt là xong! '
      },
      {
        id: 'tc_4',
        second: 42,
        author: 'Trí',
        role: 'classmate',
        text: '@Bo Khoan đã! Thế nếu x = 0 thì phép chia cho x của cậu có hợp lệ không?'
      },
      {
        id: 'tc_5',
        second: 48,
        author: 'Trợ giảng An',
        role: 'ta',
        text: 'Sắp tới câu hỏi suy ngẫm của Cô Lam ở 00:50, cả lớp chuẩn bị đối chất với Bo nhé!'
      }
    ]
  },

  // BÀI SỐ 2: BẤT PHƯƠNG TRÌNH (ĐỂ ĐỔI BÀI DEMO)
  {
    id: 'VID_003',
    title: 'Toán 8: Bất phương trình −2x > 6 & Cạm bẫy quên đổi chiều khi chia số âm',
    subject: 'Đại số 8',
    duration: 90,
    checkpointTimestamp: 45,
    youtubeId: '1F2bF2h7-U8',
    videoUrl: 'https://www.youtube.com/watch?v=1F2bF2h7-U8',
    blackboardTitle: 'Bài toán: Giải bất phương trình −2x > 6',
    lectureNotes: [
      'Cô Lam: "Hôm nay ta xét bất phương trình bậc nhất có hệ số của x là một số âm."',
      'Cô Lam viết lên bảng: −2x > 6',
      'Cô Lam: "Để tìm x, ta cần chia cả hai vế của bất phương trình cho −2. Nhưng hãy cẩn thận với chiều của dấu >!"'
    ],
    chapters: [
      { id: 'c3_1', title: 'Phần 1: Nhận diện hệ số âm trước ẩn x', startSecond: 0, formulaPreview: '−2x > 6' },
      { id: 'c3_2', title: 'Phần 2: Điểm dừng suy ngẫm — Chia hai vế cho −2', startSecond: 45, hasCheckpoint: true, formulaPreview: 'Điểm dừng 00:45' },
      { id: 'c3_3', title: 'Phần 3: Quy tắc đổi chiều bất đẳng thức', startSecond: 60, formulaPreview: 'x < −3' }
    ],
    transcriptCues: [
      { id: 'q3_1', start: 0, end: 18, speaker: 'Cô Lam', text: 'Chào các em, cùng quan sát bất phương trình −2x > 6. Hệ số đi với x ở đây là −2 (một số âm).', formula: '−2x > 6', tag: 'formula' },
      { id: 'q3_2', start: 19, end: 44, speaker: 'Bo', text: 'Quá dễ luôn cô ơi! Giống phương trình thôi, lấy 6 chia cho −2 là ra x > −3!', formula: 'Bẫy của Bo: x > −3', tag: 'trap' },
      { id: 'q3_3', start: 45, end: 59, speaker: 'Cô Lam', text: '[ĐIỂM DỪNG SUY NGẪM]: Khi chia cả hai vế của −2x > 6 cho −2, tập nghiệm đúng là gì?', tag: 'checkpoint' },
      { id: 'q3_4', start: 60, end: 90, speaker: 'Cô Lam', text: 'Khi nhân hoặc chia cả hai vế của bất phương trình cho một số âm, ta BẮT BUỘC phải đổi chiều dấu bất đẳng thức từ > sang <, vậy nghiệm là x < −3!', formula: 'x < −3', tag: 'rule' }
    ],
    peerContext: {
      bo: {
        hotTake: 'Tớ thấy −2x > 6 thì cứ lấy 6 chia (−2) được −3, giữ nguyên dấu > là x > −3 thôi! Sao lại phải đổi chiều?',
        quickPrompts: ['Cậu thử lấy x = 0 (lớn hơn −3) thay vào −2x > 6 xem có đúng không!', 'Chia cho số âm khác chia cho số dương thế nào?'],
        defaultReply: 'Ủa thay x = 0 vào thì −2(0) > 6 ⇔ 0 > 6 (Vô lý!). Sao kỳ vậy ta?!'
      },
      tri: {
        edgeCaseNote: 'Bản chất trên trục số: Nhân hoặc chia cho số âm là phép lấy đối xứng qua gốc tọa độ 0, làm đảo ngược toàn bộ thứ tự lớn/bé!',
        quickPrompts: ['Tại sao nhân số âm lại làm đảo chiều trên trục số?'],
        defaultReply: 'Ví dụ 2 < 5, nhưng khi nhân (−1) vào hai vế thì −2 lại lớn hơn −5 (vì nợ 2 đồng ít hơn nợ 5 đồng)!'
      },
      linhchi: {
        cheatSheetTitle: 'Sổ tay Quy tắc dấu Bất phương trình',
        cheatSheetBullets: [
          '1. Cộng/Trừ hai vế với cùng một số: GIỮ NGUYÊN chiều.',
          '2. Nhân/Chia hai vế với số DƯƠNG (> 0): GIỮ NGUYÊN chiều.',
          '3. Nhân/Chia hai vế với số ÂM (< 0): BẮT BUỘC ĐỔI CHIỀU (> thành <).'
        ],
        quickPrompts: ['Khi nào giữ chiều, khi nào đổi chiều bất phương trình?'],
        defaultReply: 'Cậu nhớ mục số 3 trong sổ tay nhé: Cứ nhân hoặc chia cho số ÂM là phải lật ngược dấu so sánh lại ngay!'
      },
      minhkhang: {
        analogyTitle: 'Ẩn dụ Tiền bạc & Khoảng nợ',
        analogyContent: 'Bạn A có 10k, bạn B có 20k thì A < B. Nhưng nếu đổi sang "khoảng nợ" (nhân với dấu âm): Nợ 10k (−10) lại giàu hơn nợ 20k (−20), tức là −10 > −20!',
        quickPrompts: ['Lấy ví dụ thử số cụ thể cho bài −2x > 6 đi Khang!'],
        defaultReply: 'Nếu lấy x = −4 (nhỏ hơn −3), nhân với −2 ta được (−2)·(−4) = +8 > 6 (Chuẩn luôn!).'
      }
    },
    checkpointQuestion: {
      prompt: 'Khi giải bất phương trình −2x > 6, bước biến đổi nào dưới đây là đúng?',
      options: [
        { id: 'opt_1', label: 'Chia 2 vế cho −2 và ĐỔI CHIỀU bất đẳng thức: x < −3', isStandardBest: true, feedback: 'Chuẩn xác! Hãy giải thích cho Bo hiểu vì sao phải đổi chiều nhé!' },
        { id: 'opt_2', label: 'Chia 2 vế cho −2 và GIỮ NGUYÊN chiều: x > −3', isStandardBest: false, feedback: 'Coi chừng! Chia cho số âm mà không đổi chiều là sập bẫy của Bo rồi!' }
      ]
    },
    boArgument: {
      speech: 'Ủa sao tự nhiên đang dấu lớn (>) cậu lại lật ngược thành dấu bé (<) vậy? Tớ thấy cứ giữ nguyên x > −3 mới thuận mắt chứ!',
      shortcutClaim: 'Chia hai vế cho −2 giữ nguyên dấu >',
      fallacyType: 'Quên đổi chiều khi chia số âm'
    },
    rebuttalStickers: [
      { id: 's3_1', text: 'Vì −2 là số âm! Khi chia hai vế bất phương trình cho số âm thì bắt buộc phải đổi chiều từ > sang <.', isEffective: true, bloomLevel: 'Evaluate', feedback: 'Chính xác tuyệt đối!' },
      { id: 's3_2', text: 'Thử lấy x = 0 (thỏa mãn x > −3 của Bo) thay vào đề bài được 0 > 6 (Vô lý ngay!).', isEffective: true, bloomLevel: 'Analyze', feedback: 'Phản ví dụ bằng số cực kỳ thuyết phục!' }
    ],
    boConcession: {
      speech: 'Trời đất, thay x = 0 vào ra 0 > 6 sai lè thật! Từ nay thấy chia cho số âm là tớ lật dấu liền!',
      realizationNote: 'Bo đã nhớ quy tắc đổi chiều khi nhân/chia số âm.'
    },
    teacherClosure: {
      speech: 'Rất tốt! Cả lớp luôn nhớ kiểm tra dấu của hệ số trước khi chia hai vế bất phương trình nhé.',
      goldenRule: 'Quy tắc vàng: Nhân hoặc chia hai vế bất phương trình cho SỐ ÂM thì phải ĐỔI CHIỀU bất đẳng thức!'
    },
    freezeNote: 'Gợi ý: Số −2 mang dấu âm. Hãy thử lấy 1 giá trị x cụ thể thay vào để kiểm tra chiều của bất đẳng thức.',
    timelineComments: [
      { id: 'tc3_pin', second: 0, author: 'Trợ giảng An', role: 'ta', text: 'Lưu ý: Khi nhân hay chia hai vế bất phương trình, hãy để ý dấu của số mình dùng.', isPinned: true },
      { id: 'tc3_1', second: 19, author: 'Bo Ngây Ngô', role: 'classmate', text: 'Lấy 6 chia −2 ra −3, vậy x > −3 thôi, nhanh gọn!' },
      { id: 'tc3_2', second: 30, author: 'Trí', role: 'classmate', text: '@Bo Cậu thử thay x = 0 vào xem 0 có lớn hơn 6 không mà kết luận x > −3?' }
    ]
  }
];
