// File: src/data/videoLessons.ts
import { VideoLessonItem } from '../types/dre';

export const VIDEO_LESSON_LIBRARY: VideoLessonItem[] = [
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
        formulaPreview: 'Chia cho x ➔ Mất nghiệm?'
      },
      {
        id: 'chap_3',
        title: 'Phần 3: Điểm dừng suy ngẫm & Đối chất cùng Bo',
        startSecond: 50,
        hasCheckpoint: true,
        formulaPreview: '⚡ Quiz tại 00:50'
      },
      {
        id: 'chap_4',
        title: 'Phần 4: Chuyển vế đặt nhân tử chung & Chốt quy tắc',
        startSecond: 66,
        formulaPreview: 'x(x − 5) = 0 ➔ S = {0; 5}'
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
        text: '⚡ [ĐIỂM DỪNG SUY NGẪM]: Theo em, phương trình x(x − 2) = 3x có nghiệm là gì và nên giải thế nào để không sót nghiệm?',
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
        edgeCaseNote: '🔍 Góc soi điều kiện biên (Bloom Analyze): Trong phép chia A / B, điều kiện bắt buộc là B ≠ 0. Vì ẩn x chưa biết bằng bao nhiêu nên x hoàn toàn có thể bằng 0!',
        quickPrompts: [
          'Tại sao chuyển vế thì bảo toàn nghiệm còn chia hai vế lại mất nghiệm?',
          'Khi nào thì mới được phép chia hai vế cho biểu thức chứa x?'
        ],
        defaultReply: 'Câu hỏi rất sắc bén! Phép cộng/trừ cùng một biểu thức vào 2 vế luôn xác định với mọi x ∈ ℝ. Còn phép chia chỉ tương đương khi ta đã xét riêng trường hợp nhân tử đó bằng 0!'
      },
      linhchi: {
        cheatSheetTitle: '📝 Sổ tay Phương trình tích A(x)·B(x) = 0',
        cheatSheetBullets: [
          'Bước 1: Chuyển tất cả các hạng tử sang vế trái, vế phải bằng 0 (Nhớ đổi dấu: +3x chuyển sang thành −3x).',
          'Bước 2: Đặt nhân tử chung x ra ngoài: x(x − 2 − 3) = 0 ⇔ x(x − 5) = 0.',
          'Bước 3: Cho từng nhân tử bằng 0: x = 0 hoặc x − 5 = 0 ⇒ S = {0; 5}.',
          '⚠️ Cấm kỵ: Tuyệt đối không gạch bỏ nhân tử chứa ẩn x ở hai vế!'
        ],
        quickPrompts: [
          'Cho tớ xem lại 3 bước đưa về phương trình tích chuẩn!',
          'Tại sao chuyển 3x sang trái lại thành x(x − 5) = 0?'
        ],
        defaultReply: 'Cậu nhìn Bước 2 trên Sổ tay của tớ nhé: Khi chuyển +3x sang trái ta có x(x − 2) − 3x = 0. Đặt x chung thì bên trong ngoặc còn (x − 2 − 3) = (x − 5) đó!'
      },
      minhkhang: {
        analogyTitle: '🍕 Ẩn dụ Đời sống & Hình ảnh Đồ thị',
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
        text: '📌 Nhắc bài: Luôn để ý điều kiện xác định và đặt nhân tử chung trước khi rút gọn!',
        isPinned: true
      },
      {
        id: 'tc_1',
        second: 12,
        author: 'Linh Chi',
        role: 'classmate',
        text: '📝 Tớ chép đề vào sổ tay rồi nhé: Giải phương trình x(x − 2) = 3x.'
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
        text: 'Ủa sao không chia x cho nhanh? 2 bên đều có x mà ta, gạch cái rẹt là xong! 🤔'
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
      { id: 'c3_2', title: 'Phần 2: Điểm dừng Quiz — Chia hai vế cho −2', startSecond: 45, hasCheckpoint: true, formulaPreview: '⚡ Quiz tại 00:45' },
      { id: 'c3_3', title: 'Phần 3: Quy tắc đổi chiều bất đẳng thức', startSecond: 60, formulaPreview: 'x < −3' }
    ],
    transcriptCues: [
      { id: 'q3_1', start: 0, end: 18, speaker: 'Cô Lam', text: 'Chào các em, cùng quan sát bất phương trình −2x > 6. Hệ số đi với x ở đây là −2 (một số âm).', formula: '−2x > 6', tag: 'formula' },
      { id: 'q3_2', start: 19, end: 44, speaker: 'Bo', text: 'Quá dễ luôn cô ơi! Giống phương trình thôi, lấy 6 chia cho −2 là ra x > −3!', formula: 'Bẫy của Bo: x > −3', tag: 'trap' },
      { id: 'q3_3', start: 45, end: 59, speaker: 'Cô Lam', text: '⚡ [ĐIỂM DỪNG SUY NGẪM]: Khi chia cả hai vế của −2x > 6 cho −2, tập nghiệm đúng là gì?', tag: 'checkpoint' },
      { id: 'q3_4', start: 60, end: 90, speaker: 'Cô Lam', text: 'Khi nhân hoặc chia cả hai vế của bất phương trình cho một số âm, ta BẮT BUỘC phải đổi chiều dấu bất đẳng thức từ > sang <, vậy nghiệm là x < −3!', formula: 'x < −3', tag: 'rule' }
    ],
    peerContext: {
      bo: {
        hotTake: 'Tớ thấy −2x > 6 thì cứ lấy 6 chia (−2) được −3, giữ nguyên dấu > là x > −3 thôi! Sao lại phải đổi chiều?',
        quickPrompts: ['Cậu thử lấy x = 0 (lớn hơn −3) thay vào −2x > 6 xem có đúng không!', 'Chia cho số âm khác chia cho số dương thế nào?'],
        defaultReply: 'Ủa thay x = 0 vào thì −2(0) > 6 ⇔ 0 > 6 (Vô lý!). Sao kỳ vậy ta?!'
      },
      tri: {
        edgeCaseNote: '🔍 Bản chất trên trục số: Nhân hoặc chia cho số âm là phép lấy đối xứng qua gốc tọa độ 0, làm đảo ngược toàn bộ thứ tự lớn/bé!',
        quickPrompts: ['Tại sao nhân số âm lại làm đảo chiều trên trục số?'],
        defaultReply: 'Ví dụ 2 < 5, nhưng khi nhân (−1) vào hai vế thì −2 lại lớn hơn −5 (vì nợ 2 đồng ít hơn nợ 5 đồng)!'
      },
      linhchi: {
        cheatSheetTitle: '📝 Sổ tay Quy tắc dấu Bất phương trình',
        cheatSheetBullets: [
          '1. Cộng/Trừ hai vế với cùng một số: GIỮ NGUYÊN chiều.',
          '2. Nhân/Chia hai vế với số DƯƠNG (> 0): GIỮ NGUYÊN chiều.',
          '3. Nhân/Chia hai vế với số ÂM (< 0): BẮT BUỘC ĐỔI CHIỀU (> thành <).'
        ],
        quickPrompts: ['Khi nào giữ chiều, khi nào đổi chiều bất phương trình?'],
        defaultReply: 'Cậu nhớ mục số 3 trong sổ tay nhé: Cứ nhân hoặc chia cho số ÂM là phải lật ngược dấu so sánh lại ngay!'
      },
      minhkhang: {
        analogyTitle: '💰 Ẩn dụ Tiền bạc & Khoảng nợ',
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
      { id: 'tc3_pin', second: 0, author: 'Trợ giảng An', role: 'ta', text: '📌 Lưu ý: Nhân/chia số âm vào hai vế bất phương trình thì phải ĐỔI CHIỀU dấu so sánh!', isPinned: true },
      { id: 'tc3_1', second: 19, author: 'Bo Ngây Ngô', role: 'classmate', text: 'Lấy 6 chia −2 ra −3, vậy x > −3 thôi, nhanh gọn!' },
      { id: 'tc3_2', second: 30, author: 'Trí', role: 'classmate', text: '@Bo Cậu thử thay x = 0 vào xem 0 có lớn hơn 6 không mà kết luận x > −3?' }
    ]
  }
];
