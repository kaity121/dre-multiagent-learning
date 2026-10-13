// File: src/data/videoLessons.ts
import { VideoLessonItem } from '../types/dre';

export const VIDEO_LESSON_LIBRARY: VideoLessonItem[] = [
  {
    id: 'VID_VECTO_12',
    title: 'Bài 1.1: Vectơ Trong Không Gian - Toán 12 (SGK Mới) || Thầy Nguyễn Phan Tiến',
    subject: 'Hình học 12',
    duration: 9503, // 2 giờ 38 phút 23 giây (9503 giây)
    checkpointTimestamp: 2233, // Dừng tại 37:13 (2233s) - Ngay chỗ bẫy tính độ dài tổng 2 vectơ!
    youtubeId: 'phvpqxLNTUQ',
    videoUrl: 'https://www.youtube.com/watch?v=phvpqxLNTUQ',
    blackboardTitle: "Ví dụ 3 (36:44): Cho hình lập phương cạnh 1. Tính |BC + DD'|",
    lectureNotes: [
      '[00:00] Phần 1: Định nghĩa Vectơ trong không gian là một đoạn thẳng có hướng.',
      '[02:24] Lưu ý: Đoạn thẳng AB = BA, nhưng vectơ AB ≠ BA vì ngược hướng nhau.',
      '[05:31] Vectơ-không (0): Điểm đầu trùng điểm cuối (AA, BB), độ dài bằng 0, cùng phương cùng hướng với mọi vectơ.',
      '[11:30] Hai vectơ bằng nhau khi và chỉ khi chúng CÙNG HƯỚNG và CÙNG ĐỘ DÀI.',
      ' [22:30] Quy tắc 3 điểm (Nối tiếp): OA + AB = OB & Quy tắc hình bình hành: AB + AD = AC.',
      "[30:13] Quy tắc hình hộp: AB + AD + AA' = AC' (Đường chéo hình lập phương cạnh a là a√3).",
      " [36:44] Ví dụ 3: Cho hình lập phương ABCD.A'B'C'D' cạnh bằng 1. Tính |BC + DD'|."
    ],
    // 1. ĐÚNG 9 PHÂN CẢNH (CHAPTERS) Y HỆT ẢNH YOUTUBE CỦA BẠN
    chapters: [
      {
        id: 'chap_vt_1',
        title: '1. Định Nghĩa Vectơ & Giá Của Vectơ',
        startSecond: 0, // 00:00
        formulaPreview: 'AB ≠ BA'
      },
      {
        id: 'chap_vt_2',
        title: '2. Vectơ-không (0) & Hai Vectơ Cùng Phương',
        startSecond: 331, // 05:31
        formulaPreview: 'AA = 0'
      },
      {
        id: 'chap_vt_3',
        title: '3. Hai Vectơ Bằng Nhau & Ví Dụ Hình Lăng Trụ',
        startSecond: 690, // 11:30
        formulaPreview: 'AB = CD'
      },
      {
        id: 'chap_vt_4',
        title: '4. Tổng Của Hai Vectơ (Quy tắc 3 điểm & Hình bình hành)',
        startSecond: 1350, // 22:30
        formulaPreview: 'OA + AB = OB'
      },
      {
        id: 'chap_vt_5',
        title: '5. Quy Tắc Hình Hộp & Điểm Dừng Bẫy Độ Dài (37:13)',
        startSecond: 1813, // 30:13
        hasCheckpoint: true,
        formulaPreview: 'Quiz tại 37:13'
      },
      {
        id: 'chap_vt_6',
        title: '6. Hiệu Của Hai Vectơ ("Chung Đầu Lộn Ngược")',
        startSecond: 3134, // 52:14
        formulaPreview: 'OA − OB = BA'
      },
      {
        id: 'chap_vt_7',
        title: '7. Tích Của Vectơ Với 1 Số & Bẫy Số 0 Nhân Vectơ',
        startSecond: 3951, // 1:05:51
        formulaPreview: '0 · a = 0'
      },
      {
        id: 'chap_vt_8',
        title: '8. Quy Tắc Trung Tuyến & Trọng Tâm Tứ Diện',
        startSecond: 4365, // 1:12:45
        formulaPreview: 'GA+GB+GC=0'
      },
      {
        id: 'chap_vt_9',
        title: '9. Dạng 1 & 2: Chứng Minh Đẳng Thức & Phân Tích Vectơ',
        startSecond: 7004, // 1:56:44
        formulaPreview: 'Chèn điểm'
      }
    ],
    // 2. BẢN CHÉP LỜI TỪNG GIÂY KÈM MINH KHANG ANALOGY & LINH CHI NOTE
    transcriptCues: [
      {
        id: 'vt_cue_1',
        start: 0,
        end: 47,
        speaker: 'Cô Lam',
        text: 'Bài 1: Vectơ trong không gian. Khái niệm vectơ trong không gian hoàn toàn tương tự như ở lớp 10 các em đã học.',
        minhKhangAnalogy: 'Minh Khang: Ở lớp 10 mình vẽ mũi tên trên mặt bàn phẳng (2D), còn lên lớp 12 mình gắn thêm chiều cao trong phòng học (3D) thôi, bản chất mũi tên không đổi!',
        linhChiNote: 'Linh Chi: Vectơ không gian 3D giữ nguyên mọi định nghĩa về điểm đầu, điểm cuối và độ dài như hình học phẳng lớp 10.'
      },
      {
        id: 'vt_cue_2',
        start: 48,
        end: 143,
        speaker: 'Cô Lam',
        text: 'Vectơ trong không gian là một đoạn thẳng có hướng. Ký hiệu AB với A là điểm đầu, B là điểm cuối.',
        formula: 'AB (A: Điểm đầu → B: Điểm cuối)',
        tag: 'formula',
        minhKhangAnalogy: 'Minh Khang: Giống như tấm vé máy bay ghi "Đà Nẵng → Hà Nội" vậy! A là sân bay cất cánh (điểm đầu), B là sân bay hạ cánh (điểm cuối).',
        linhChiNote: 'Ghi chú công thức: Vectơ ký hiệu bằng 2 chữ cái in hoa có mũi tên trên đầu (AB) hoặc 1 chữ thường (a, b, x, y).'
      },
      {
        id: 'vt_cue_3',
        start: 144,
        end: 182,
        speaker: 'Cô Lam',
        text: 'Lưu ý cực kỳ quan trọng (02:24): Đoạn thẳng AB và BA thì bằng nhau, nhưng vectơ AB thì KHÁC vectơ BA vì đi ngược hướng nhau!',
        formula: 'Đoạn AB = BA nhưng AB ≠ BA',
        tag: 'trap',
        minhKhangAnalogy: 'Minh Khang: Đi từ Nhà tới Trường (AB) và đi từ Trường về Nhà (BA) có cùng quãng đường dài 2km, nhưng hướng đi ngược nhau hoàn toàn nên 2 vectơ này khác nhau (thậm chí là đối nhau)!',
        linhChiNote: 'Bẫy cần tránh: Đoạn thẳng không quan tâm chiều (AB = BA), nhưng Vectơ bắt buộc xét chiều mũi tên (AB = −BA).'
      },
      {
        id: 'vt_cue_4',
        start: 183,
        end: 330,
        speaker: 'Cô Lam',
        text: 'Độ dài vectơ ký hiệu là |AB| = AB. Còn Giá của vectơ là đường thẳng d đi qua điểm đầu và điểm cuối (như cái giá đỡ vectơ).',
        formula: '|AB| = AB (Độ dài luôn ≥ 0)',
        tag: 'formula',
        minhKhangAnalogy: 'Minh Khang: "Giá" của vectơ giống như đường ray tàu hỏa kéo dài vô tận đi qua 2 ga A và B, còn vectơ AB là đoàn tàu nằm trên đường ray đó!',
        linhChiNote: 'Ghi chú: Ký hiệu |AB| đọc là "Độ dài của vectơ AB" (không đọc là trị tuyệt đối). Hai vectơ cùng phương khi 2 đường ray (giá) của chúng song song hoặc trùng nhau.'
      },
      {
        id: 'vt_cue_5',
        start: 331,
        end: 689,
        speaker: 'Cô Lam',
        text: 'Khi điểm đầu trùng điểm cuối (AA, BB), ta có vectơ-không (0). Độ dài |0| = 0 và nó cùng phương, cùng hướng với MỌI vectơ!',
        formula: 'AA = BB = 0 (Cùng hướng mọi vectơ)',
        tag: 'rule',
        minhKhangAnalogy: 'Minh Khang: Vectơ 0 là đứng im tại chỗ (chỉ là 1 dấu chấm). Vì qua 1 dấu chấm vẽ được vô số đường thẳng theo mọi hướng, nên nó "hòa đồng" cùng phương, cùng hướng với tất cả các vectơ khác!',
        linhChiNote: 'Quy ước đặc biệt: |0| = 0. Vectơ 0 cùng phương và cùng hướng với mọi vectơ trong không gian.'
      },
      {
        id: 'vt_cue_6',
        start: 690,
        end: 1349,
        speaker: 'Cô Lam',
        text: 'Phần 2 (11:30): Hai vectơ bằng nhau khi và chỉ khi chúng CÙNG HƯỚNG và CÙNG ĐỘ DÀI. Muốn xét hướng phải xét cùng phương trước!',
        formula: 'AB = CD ⇔ Cùng hướng & |AB| = |CD|',
        tag: 'rule',
        minhKhangAnalogy: 'Minh Khang: Trong hình lăng trụ hay hình hộp, các cạnh bên (AA\', BB\', CC\') giống như các cây cột nhà dựng song song, cao bằng nhau và cùng chỉ xuống dưới nên chúng bằng nhau hết!',
        linhChiNote: 'Điều kiện bằng nhau (Đủ 2 ý): 1) Cùng hướng (giá song song/trùng nhau + cùng chiều mũi tên) VÀ 2) Cùng độ dài.'
      },
      {
        id: 'vt_cue_7',
        start: 1350,
        end: 1645,
        speaker: 'Cô Lam',
        text: 'Quy tắc 3 điểm (24:44): Điểm cuối thằng này nối tiếp điểm đầu thằng kia: OA + AB = OB.',
        formula: 'OA + AB = OB (Nối tiếp A - A)',
        tag: 'formula',
        minhKhangAnalogy: 'Minh Khang: Đúng ví dụ thầy Tiến ở phút [24:58] nè: Đi từ Nhà (O) qua Nhà người yêu (A), rồi từ Nhà người yêu (A) đi đến Trường (B)  Kết quả cuối cùng là đi từ Nhà đến Trường (OB)!',
        linhChiNote: 'Quy tắc 3 điểm (Cộng nối tiếp): Điểm cuối của vectơ thứ nhất trùng với điểm đầu của vectơ thứ hai thì triệt tiêu điểm giữa: OA + AB = OB.'
      },
      {
        id: 'vt_cue_8',
        start: 1646,
        end: 1812,
        speaker: 'Cô Lam',
        text: 'Quy tắc hình bình hành (27:26): Hai vectơ chung gốc A sẽ cộng lại ra đường chéo ở giữa: AB + AD = AC.',
        formula: 'AB + AD = AC (Chung gốc A)',
        tag: 'formula',
        minhKhangAnalogy: 'Minh Khang: Giống như kéo giương cây cung ở đỉnh A theo hai cánh cung AB và AD, mũi tên sẽ bắn vọt thẳng ra đường chéo chính giữa AC!',
        linhChiNote: 'Phân biệt rõ: Nối tiếp (AB + BC = AC) dùng cho tam giác; còn Chung gốc (AB + AD = AC) dùng cho Hình bình hành ABCD.'
      },
      {
        id: 'vt_cue_9',
        start: 1813,
        end: 2203,
        speaker: 'Cô Lam',
        text: 'Quy tắc hình hộp (31:40): Tổng 3 vectơ chung gốc A theo 3 chiều (dài, rộng, cao) bằng vectơ đường chéo chính: AB + AD + AA\' = AC\'.',
        formula: 'AB + AD + AA\' = AC\'',
        tag: 'rule',
        minhKhangAnalogy: 'Minh Khang: Nhìn vào góc phòng học của cậu (đỉnh A): Đi dọc theo mép tường trái (AB) + mép tường phải (AD) + cột tường thẳng đứng (AA\') sẽ bắn xuyên tâm căn phòng tới góc đối diện AC\'!',
        linhChiNote: 'Công thức giải nhanh (41:06): Đường chéo hình vuông cạnh a là a√2; Đường chéo chính hình lập phương cạnh a là a√3.'
      },
      {
        id: 'vt_cue_10',
        start: 2204,
        end: 2395,
        speaker: 'Cô Lam',
        text: 'Ví dụ 3 (36:44 - Điểm dừng 37:13): Hình lập phương cạnh 1. Tính |BC + DD\'|. Cấm tách thành 1 + 1 = 2! Phải thay DD\' = CC\' để được |BC\'| = √2.',
        formula: '|BC + DD\'| = |BC + CC\'| = |BC\'| = √2',
        tag: 'checkpoint',
        minhKhangAnalogy: 'Minh Khang: Thầy Tiến gọi đây là "Tìm người phù hợp" (38:30)! BC kết thúc ở C mà DD\' lại bắt đầu ở D (không nối tiếp được). Ta đổi DD\' thành anh em song sinh của nó là CC\' thì nối được C với C ngay!',
        linhChiNote: 'Quy tắc bắt buộc khi tính độ dài tổng |a + b|: Bước 1: Dùng quy tắc thế vectơ/3 điểm gom bên trong thành 1 vectơ duy nhất. Bước 2: Tính độ dài đoạn thẳng đó bằng Pytago.'
      },
      {
        id: 'vt_cue_11',
        start: 2396,
        end: 3950,
        speaker: 'Cô Lam',
        text: 'Phương pháp chèn điểm (42:04 - "Đua đòi") & Quy tắc hiệu (57:02 - "Chung đầu lộn ngược"): OA − OB = BA.',
        formula: 'OA − OB = BA (Chung đầu O, lộn ngược)',
        tag: 'rule',
        minhKhangAnalogy: 'Minh Khang: Nhớ 2 câu thần chú của thầy Tiến: 1) Chèn điểm là "Đua đòi" (vế phải có điểm gì, vế trái đòi chèn điểm đó vào). 2) Phép trừ có chung điểm đầu O thì lộn ngược đít lên đầu: OA − OB = BA!',
        linhChiNote: 'Sổ tay biến đổi: Cách 1: Đổi trừ thành cộng vectơ đối (−CC\' = +C\'C). Cách 2: Chung gốc thì lấy điểm sau viết trước: AC − AB\' = B\'C.'
      },
      {
        id: 'vt_cue_12',
        start: 3951,
        end: 9503,
        speaker: 'Cô Lam',
        text: 'Tích của một số với vectơ (1:05:51) & Quy tắc Trọng tâm (1:12:45): Số 0 · a = 0. Trọng tâm G tam giác BCD: AB + AC + AD = 3AG.',
        formula: 'G là trọng tâm △BCD ⇒ AB + AC + AD = 3AG',
        tag: 'rule',
        minhKhangAnalogy: 'Minh Khang: Cẩn thận bẫy trắc nghiệm ở phút [1:09:14]: Số 0 nhân với vectơ a phải sinh ra một VECTƠ (là 0 có mũi tên trên đầu), ai khoanh đáp án số 0 trơ trọi là mất điểm!',
        linhChiNote: 'Bộ 3 công thức Trọng tâm & Trung điểm:\n• M là trung điểm BC ⇒ AB + AC = 2AM\n• G là trọng tâm △BCD ⇒ GB + GC + GD = 0 và AB + AC + AD = 3AG\n• I là trọng tâm tứ diện ABCD ⇒ IA + IB + IC + ID = 0.'
      }
    ],
    // 3. SỔ TAY & CHAT RIÊNG CỦA 4 BẠN HỌC (KHỚP 100% VỚI LỜI GIẢNG THẦY TIẾN)
    peerContext: {
      bo: {
        hotTake: "Ở phút [37:05], đề bắt tính |BC + DD'| với cạnh hình lập phương bằng 1. Tớ tách luôn dấu trị tuyệt đối ra thành |BC| + |DD'| = 1 + 1 = 2! Sao thầy Tiến lại bảo tớ sai?!",
        quickPrompts: [
          'Độ dài tổng 2 vectơ có bằng tổng 2 độ dài đâu Bo!',
          "Phải thay DD' bằng CC' để nối đuôi thành BC' chứ!"
        ],
        defaultReply: "Ơ... phải gom BC + CC' thành đường chéo mặt bên BC' rồi mới tính độ dài Pytago ra √2 hả?! Hèn gì tớ tách ra 1 + 1 = 2 bị thầy mắng!"
      },
      tri: {
        edgeCaseNote: "Góc đào sâu của Trí (Bloom Analyze): Bất đẳng thức tam giác cho vectơ: |a + b| ≤ |a| + |b|. Dấu \"=\" chỉ xảy ra khi a và b CÙNG HƯỚNG! Ở đây BC nằm ngang còn DD' dựng đứng (vuông góc nhau) nên không bao giờ tách thành 1 + 1 = 2 được!",
        quickPrompts: [
          'Khi nào thì |a + b| mới bằng |a| + |b| hả Trí?',
          'Tại sao muốn xét cùng hướng thì bắt buộc phải xét cùng phương trước?'
        ],
        defaultReply: 'Đúng như thầy Tiến nhấn mạnh ở phút [15:04]: Hai vectơ muốn xét cùng hướng hay ngược hướng thì giá của chúng phải song song hoặc trùng nhau (cùng phương) trước đã!'
      },
      linhchi: {
        cheatSheetTitle: 'Sổ tay Công thức Vàng (Bài 1.1 - Thầy Tiến)',
        cheatSheetBullets: [
          '1. Quy tắc 3 điểm (Nối tiếp - 25:28): OA + AB = OB (Cuối anh này là đầu anh kia).',
          '2. Quy tắc Hình bình hành (27:26): AB + AD = AC (Chung gốc A bắn ra đường chéo).',
          "3. Quy tắc Hình hộp (32:11): AB + AD + AA' = AC'.",
          '4. Quy tắc Trừ (57:02 - Chung đầu lộn ngược): OA − OB = BA.',
          '5. Đường chéo hình vuông cạnh a là a√2; Đường chéo hình lập phương cạnh a là a√3.'
        ],
        quickPrompts: [
          'Cho tớ xin công thức Trung tuyến và Trọng tâm ở phút 1:12:45!',
          'Cách thế vectơ "tìm người phù hợp" ở phút 38:30 là sao Chi?'
        ],
        defaultReply: 'Ở phút [1:12:45]: Nếu M là trung điểm BC thì AB + AC = 2AM. Nếu G là trọng tâm tam giác BCD thì GB + GC + GD = 0 và AB + AC + AD = 3AG nhé!'
      },
      minhkhang: {
        analogyTitle: 'Ẩn dụ Đời sống cực dễ nhớ trong bài giảng',
        analogyContent: '• Cộng nối tiếp (24:58): Đi từ Nhà (O) → Nhà người yêu (A) → Trường (B) = Đi từ Nhà đến Trường (OB).\n• Quy tắc hình bình hành (27:31): Kéo 2 cạnh dây cung AB và AD thì mũi tên bắn thẳng ra đường chéo AC!\n• Phương pháp chèn điểm (42:11): "Đua đòi" — Vế phải có điểm gì thì vế trái chèn điểm đó vào!',
        quickPrompts: [
          "Giải thích tại sao |BC + DD'| = √2 bằng đường đi thực tế đi Khang!",
          'Thần chú "Chung đầu lộn ngược" dùng thế nào?'
        ],
        defaultReply: "Tưởng tượng cậu đi ngang 1 mét từ B đến C, rồi đi thẳng đứng lên 1 mét từ C lên C' (vì DD' = CC'). Khoảng cách chim bay từ B tới C' chính là cạnh huyền tam giác vuông: √(1² + 1²) = √2 mét chứ sao bằng 2 mét được!"
      }
    },
    // 4. CHECKPOINT QUIZ TẠI PHÚT 37:13 (GIÂY 2233) & MÀN TRANH BIỆN VỚI BO
    checkpointQuestion: {
      prompt: "Tại [36:44], cho hình lập phương ABCD.A'B'C'D' có cạnh bằng 1. Độ dài của tổng hai vectơ |BC + DD'| bằng bao nhiêu và tính thế nào?",
      options: [
        {
          id: 'opt_1',
          label: "Thay DD' = CC' để nối tiếp: |BC + CC'| = |BC'| = √(1² + 1²) = √2",
          isStandardBest: true,
          feedback: 'Chính xác 100%! Nhưng Bo vẫn đang cãi là tách ra 1 + 1 = 2 nhanh hơn kìa, hãy bẻ gãy ngụy biện của Bo nhé!',
          remediationSecond: 2258
        },
        {
          id: 'opt_2',
          label: "Tách trực tiếp thành tổng hai độ dài: |BC| + |DD'| = 1 + 1 = 2",
          isStandardBest: false,
          feedback: 'Sập bẫy kinh điển mà thầy Tiến vừa cảnh báo ở [37:13] rồi! Không được tách độ dài của tổng thành tổng hai độ dài!',
          remediationSecond: 2225
        },
        {
          id: 'opt_3',
          label: 'Dùng công thức đường chéo hình lập phương: Bằng √3',
          isStandardBest: false,
          feedback: "√3 là đường chéo chính AC' (tổng của 3 vectơ AB + AD + AA' ở câu b phút 40:00), còn đây chỉ là đường chéo mặt bên BC' thôi nhé!",
          remediationSecond: 2375
        }
      ]
    },
    boArgument: {
      speech: "Ủa sao cậu phải đổi DD' thành CC' chi cho mệt vậy?! Tớ thấy |BC + DD'| thì cứ tách thẳng ra thành |BC| + |DD'| = 1 + 1 = 2 luôn trong 1 nốt nhạc chứ sao lại ra √2?!",
      shortcutClaim: "Tách |a + b| thành |a| + |b| = 1 + 1 = 2",
      fallacyType: 'Ngộ nhận tách dấu độ dài tổng hai vectơ'
    },
    rebuttalStickers: [
      {
        id: 'stk_vt_1',
        text: "Không được tách |a + b| thành |a| + |b|! Phải gom 2 vectơ trong dấu độ dài thành 1 vectơ duy nhất (BC + CC' = BC') trước rồi mới tính độ dài!",
        isEffective: true,
        bloomLevel: 'Evaluate',
        feedback: 'Chuẩn xác từng chữ như lời thầy Tiến ở phút [37:21]! Phải thu gọn thành 1 vectơ trước khi lấy độ dài.'
      },
      {
        id: 'stk_vt_2',
        text: "Vì BC (nằm ngang) và DD' = CC' (thẳng đứng) vuông góc với nhau, nên tổng của chúng là đường chéo hình vuông BC' có độ dài Pytago là √(1² + 1²) = √2!",
        isEffective: true,
        bloomLevel: 'Analyze',
        feedback: "Phân tích hình học không gian cực kỳ sắc bén! Đánh trúng bản chất tam giác vuông BCC'."
      },
      {
        id: 'stk_vt_3',
        text: 'Tại vì trong hình lập phương lúc nào cộng hai cạnh lại cũng phải lấy căn bậc hai.',
        isEffective: false,
        bloomLevel: 'Remember',
        feedback: "Chưa chặt chẽ rồi! Nếu hai vectơ cùng hướng thì độ dài tổng vẫn bằng tổng độ dài đấy. Hãy giải thích theo quy tắc nối tiếp BC + CC' = BC' nhé!"
      }
    ],
    boConcession: {
      speech: "Ối giời ơi, đúng ha! Đi ngang 1 bước từ B sang C rồi đi lên 1 bước từ C lên C' thì đường chéo BC' phải là √2 chứ làm sao bằng 2 được! Từ nay tớ chừa cái tật tự ý tách dấu độ dài vectơ!",
      realizationNote: 'Bo đã hiểu: Muốn tính |a + b|, bắt buộc phải biến đổi tổng bên trong thành 1 vectơ duy nhất trước.'
    },
    teacherClosure: {
      speech: 'Rất tuyệt vời! Như thầy Tiến vừa nhấn mạnh ở phút [37:21], khi gặp biểu thức độ dài của tổng nhiều vectơ, các em bắt buộc phải dùng quy tắc 3 điểm hoặc quy tắc hình hộp để gom chúng về 1 vectơ duy nhất rồi mới tính độ dài đoạn thẳng đó!',
      goldenRule: 'Quy tắc vàng: |a + b| ≠ |a| + |b|. Luôn thu gọn biểu thức bên trong thành 1 vectơ duy nhất (nhờ quy tắc nối tiếp / hình bình hành / hình hộp) trước khi tính độ dài!'
    },
    freezeNote: "Gợi ý tại [38:14]: Vì BC kết thúc bằng điểm C còn DD' bắt đầu bằng điểm D (chưa nối tiếp nhau), em hãy thay DD' bằng vectơ CC' (vì hai cạnh bên hình lập phương song song và bằng nhau) để tạo thành BC + CC' = BC' nhé!",
    timelineComments: [
      {
        id: 'vt_pin',
        second: 0,
        author: 'Trợ giảng An',
        role: 'ta',
        text: 'Ghim bài 1.1: 1) Muốn xét cùng hướng phải cùng phương trước. 2) Cộng nối tiếp: Cuối anh này là đầu anh kia. 3) Cấm tách |a + b| = |a| + |b|!',
        isPinned: true
      },
      {
        id: 'vt_c1',
        second: 144,
        author: 'Linh Chi',
        role: 'classmate',
        text: 'Phút [02:24]: Nhớ ghi sổ nha cả lớp, đoạn thẳng AB = BA nhưng vectơ AB ≠ BA vì ngược chiều mũi tên!'
      },
      {
        id: 'vt_c2',
        second: 380,
        author: 'Trí',
        role: 'classmate',
        text: 'Phút [06:20]: Điểm đặc biệt của vectơ-không (0) là điểm đầu trùng điểm cuối nên nó cùng phương, cùng hướng với MỌI vectơ!'
      },
      {
        id: 'vt_c3',
        second: 1498,
        author: 'Minh Khang',
        role: 'classmate',
        text: 'Phút [24:58]: Ví dụ thầy Tiến dễ nhớ thật: Đi từ Nhà (O) → Nhà người yêu (A) → Trường (B) thì chốt lại là OA + AB = OB!'
      },
      {
        id: 'vt_c4',
        second: 2205,
        author: 'Bo Ngây Ngô',
        role: 'classmate',
        text: "Ủa câu Ví dụ 3 ở [36:44] tính |BC + DD'| thì cứ tách ra 1 + 1 = 2 luôn cho khỏe chứ ghép vectơ chi cho mệt ta? "
      },
      {
        id: 'vt_c5',
        second: 2225,
        author: 'Trí',
        role: 'classmate',
        text: '@Bo Coi chừng sập bẫy ở [37:13] kìa Bo! Hai vectơ vuông góc nhau mà cậu dám cộng độ dài 1 + 1 = 2 hả?'
      }
    ]
  },
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
        formulaPreview: 'Quiz tại 00:50'
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
      { id: 'c3_2', title: 'Phần 2: Điểm dừng Quiz — Chia hai vế cho −2', startSecond: 45, hasCheckpoint: true, formulaPreview: 'Quiz tại 00:45' },
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
      { id: 'tc3_pin', second: 0, author: 'Trợ giảng An', role: 'ta', text: 'Lưu ý: Nhân/chia số âm vào hai vế bất phương trình thì phải ĐỔI CHIỀU dấu so sánh!', isPinned: true },
      { id: 'tc3_1', second: 19, author: 'Bo Ngây Ngô', role: 'classmate', text: 'Lấy 6 chia −2 ra −3, vậy x > −3 thôi, nhanh gọn!' },
      { id: 'tc3_2', second: 30, author: 'Trí', role: 'classmate', text: '@Bo Cậu thử thay x = 0 vào xem 0 có lớn hơn 6 không mà kết luận x > −3?' }
    ]
  }
];
