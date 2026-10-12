import { VideoLessonItem } from '../types/dre';

export const VIDEO_LESSON_LIBRARY: VideoLessonItem[] = [
  {
    id: 'VID_001',
    title: 'Giải phương trình tích & Cạm bẫy chia cho biến số',
    subject: 'Toán Đại số 8-9',
    duration: 180, // 3:00
    checkpointTimestamp: 50, // 0:50
    blackboardTitle: 'Bài toán: Giải phương trình  x(x − 2) = 3x',
    lectureNotes: [
      'Cô Lam: "Chào hai đứa! Hôm nay cô trò mình cùng xem một phương trình nhìn thì rất quen thuộc."',
      'Cô Lam viết lên bảng: x(x − 2) = 3x',
      'Cô Lam: "Cả hai vế đều xuất hiện x. Nhiều bạn rất thích làm một thao tác nhanh chóng..."',
      'Cô Lam dừng phấn: "Huy và Bo thử tìm nghiệm của phương trình này xem sao nhé!"'
    ],
    timelineComments: [
      {
        id: 'tc_101',
        second: 5,
        author: 'Trợ giảng An',
        role: 'ta',
        text: '📌 Nhắc bài: Luôn để ý điều kiện xác định và phân tích nhân tử trước khi biến đổi!',
        isPinned: true
      },
      {
        id: 'tc_102',
        second: 12,
        author: 'Bo Ngây Ngô',
        role: 'classmate',
        text: 'Phương trình này nhìn quen quá, có x ở cả 2 vế kìa cô ơi! 🤩'
      },
      {
        id: 'tc_103',
        second: 24,
        author: 'Minh Phương',
        role: 'classmate',
        text: 'Em đoán phải chuyển vế sang trái rồi mới đặt thừa số chung.'
      },
      {
        id: 'tc_104',
        second: 36,
        author: 'Bo Ngây Ngô',
        role: 'classmate',
        text: 'Ủa sao không chia x cho nhanh? 2 bên đều có x mà ta? 🤔'
      },
      {
        id: 'tc_105',
        second: 48,
        author: 'Trợ giảng An',
        role: 'ta',
        text: 'Sắp tới câu hỏi suy ngẫm của Cô Lam, cả lớp chuẩn bị trả lời nhé!'
      }
    ],
    checkpointQuestion: {
      prompt: 'Theo em, phương trình x(x − 2) = 3x có nghiệm là gì và nên giải thế nào?',
      options: [
        {
          id: 'opt_1',
          label: 'Chuyển vế đặt nhân tử chung: x(x − 5) = 0 → Nghiệm là x = 0 hoặc x = 5',
          isStandardBest: true,
          feedback: 'Chính xác! Chuyển 3x sang vế trái để đưa về phương trình tích.'
        },
        {
          id: 'opt_2',
          label: 'Chia cả 2 vế cho x: x − 2 = 3 → Nghiệm duy nhất là x = 5',
          isStandardBest: false,
          feedback: 'Coi chừng! Chia cho x sẽ làm mất nghiệm x = 0!'
        },
        {
          id: 'opt_3',
          label: 'Phương trình vô nghiệm vì x triệt tiêu hết',
          isStandardBest: false,
          feedback: 'Chưa đúng, x không triệt tiêu hết.'
        }
      ]
    },
    boArgument: {
      speech: 'Ủa Huy ơi! Cậu làm dài dòng thế? Hai vế đều có "x" mà, chia cả 2 vế cho x một phát là còn (x − 2) = 3, suy ra x = 5 luôn! Vừa nhanh vừa gọn, tự nhiên mất công chuyển vế chi cho cực vậy?',
      shortcutClaim: 'Chia 2 vế cho x để khử ẩn',
      fallacyType: 'Chia cho biến số khi chưa biết biến có bằng 0 hay không'
    },
    rebuttalStickers: [
      {
        id: 'reb_1',
        text: 'Vì x có thể bằng 0, không được chia cho 0!',
        isEffective: true,
        feedback: 'Chuẩn xác! Quy tắc tối cao của số học là không bao giờ chia cho số 0.'
      },
      {
        id: 'reb_2',
        text: 'Nếu chia cho x cậu sẽ làm mất tiêu nghiệm x = 0!',
        isEffective: true,
        feedback: 'Rất sắc sảo! Thử thay x = 0 vào 0(0-2) = 3(0) thấy đúng ngay.'
      },
      {
        id: 'reb_3',
        text: 'Chỉ vì cô giáo bắt phải làm vậy thôi!',
        isEffective: false,
        feedback: 'Đây là lý lẽ áp đặt, Bo sẽ không phục đâu. Cần chỉ ra bản chất toán học!'
      }
    ],
    boConcession: {
      speech: 'Á à... đúng rồi! Số 0 không chia được! Thay x = 0 vào phương trình gốc: 0 · (−2) = 0 và 3 · 0 = 0, hai vế bằng nhau chằn chặn! Suýt nữa thì tớ làm mất toi một nghiệm rồi. Công nhận cậu cẩn thận thật!',
      realizationNote: 'Bo đã hiểu: Không được chia cho ẩn số vì ẩn số có thể bằng 0'
    },
    teacherClosure: {
      speech: 'Chính xác! Hai đứa nhớ kỹ nhé: Tuyệt đối không được tự ý chia hai vế của phương trình cho một biến số khi chưa chắc chắn biến đó khác 0. Luôn chuyển vế đưa về phương trình tích A · B = 0!',
      goldenRule: 'Quy tắc vàng: Muốn chia cho một biểu thức, biểu thức đó PHẢI KHÁC 0!'
    },
    freezeNote: 'Tóm tắt đoạn vừa xem: Phương trình x(x − 2) = 3x có chứa nhân tử x ở cả hai vế. Để không làm mất nghiệm, luôn chuyển toàn bộ sang một vế rồi phân tích đa thức thành nhân tử.'
  },
  {
    id: 'VID_002',
    title: 'Quy tắc dấu ngoặc & Bẫy dấu âm nguy hiểm',
    subject: 'Toán Đại số 7-8',
    duration: 160,
    checkpointTimestamp: 45,
    blackboardTitle: 'Bài toán: Rút gọn biểu thức  A = 5x − (3x − 2)',
    lectureNotes: [
      'Cô Lam: "Dấu ngoặc đơn giản nhưng là nơi học sinh hay mất điểm nhất trong bài thi!"',
      'Cô Lam viết biểu thức: A = 5x − (3x − 2)',
      'Cô Lam: "Đằng trước ngoặc là một dấu trừ. Bây giờ chúng ta phá ngoặc như thế nào?"',
      'Cô Lam quay lại: "Huy và Bo cùng tính nhanh bước rút gọn này nhé!"'
    ],
    checkpointQuestion: {
      prompt: 'Khi phá ngoặc biểu thức 5x − (3x − 2), kết quả chính xác là:',
      options: [
        {
          id: 'opt_1',
          label: 'A = 5x − 3x + 2 = 2x + 2',
          isStandardBest: true,
          feedback: 'Chính xác! Dấu trừ đằng trước đổi dấu −2 thành +2.'
        },
        {
          id: 'opt_2',
          label: 'A = 5x − 3x − 2 = 2x − 2',
          isStandardBest: false,
          feedback: 'Coi chừng! Bạn quên đổi dấu số hạng thứ hai bên trong ngoặc!'
        },
        {
          id: 'opt_3',
          label: 'A = 5x + 3x − 2 = 8x − 2',
          isStandardBest: false,
          feedback: 'Sai dấu của 3x rồi.'
        }
      ]
    },
    boArgument: {
      speech: 'Ủa sao của cậu lại là cộng 2 (+2)? Trong ngoặc người ta ghi rõ ràng là "- 2" mà! Phá ngoặc thì hạ số đó xuống thôi chứ, phải là 5x − 3x − 2 = 2x − 2 mới đúng chứ cậu? Sao lại tự ý biến trừ thành cộng?',
      shortcutClaim: 'Phá ngoặc giữ nguyên dấu số hạng thứ hai',
      fallacyType: 'Không đổi dấu khi trước ngoặc có dấu trừ'
    },
    rebuttalStickers: [
      {
        id: 'reb_1',
        text: 'Dấu trừ trước ngoặc giống như nhân (−1) với từng số bên trong!',
        isEffective: true,
        feedback: 'Chuẩn! (−1) × (−2) = +2, quy tắc nhân hai số âm!'
      },
      {
        id: 'reb_2',
        text: 'Quy tắc trong SGK: Đổi dấu TẤT CẢ các số hạng khi trước ngoặc là dấu trừ!',
        isEffective: true,
        feedback: 'Rất rõ ràng! Đổi dấu 3x thành −3x, và −2 thành +2.'
      },
      {
        id: 'reb_3',
        text: 'Cậu nhìn đáp án tớ đi, đáp án tớ lúc nào chả chuẩn!',
        isEffective: false,
        feedback: 'Bo cần được giải thích về mặt toán học, không phải so sánh ai đúng hơn!'
      }
    ],
    boConcession: {
      speech: 'Ủa... đúng rồi ha! Dấu trừ nhân với trừ 2 thì thành cộng 2: −(−2) = +2! Hèn chi bài kiểm tra 15 phút tuần trước tớ cứ bị cô trừ 1 điểm câu này mãi mà không hiểu vì sao!',
      realizationNote: 'Bo đã hiểu: -(a - b) = -a + b'
    },
    teacherClosure: {
      speech: 'Rất tốt! Dấu trừ trước ngoặc chính là kẻ đổi dấu: Dương hóa âm, âm hóa dương. Em đã giúp Bo gỡ được một lỗi kinh điển trong các bài kiểm tra!',
      goldenRule: 'Quy tắc phá ngoặc: Trước ngoặc dấu trừ (−) → Đổi dấu TOÀN BỘ số hạng bên trong!'
    },
    freezeNote: 'Tóm tắt: Biểu thức -(A - B) luôn bằng -A + B. Hãy tưởng tượng có con số (-1) nhân phân phối vào từng hạng tử.'
  },
  {
    id: 'VID_003',
    title: 'Bất phương trình & Bẫy nhân chia số âm',
    subject: 'Toán Đại số 8-9',
    duration: 170,
    checkpointTimestamp: 55,
    blackboardTitle: 'Bài toán: Giải bất phương trình  −2x > 6',
    lectureNotes: [
      'Cô Lam: "Bất phương trình khác phương trình ở chỗ nào? Chính là ở chiều của dấu!"',
      'Cô Lam viết: −2x > 6',
      'Cô Lam: "Muốn tìm x, ta cần chia cả hai vế cho −2."',
      'Cô Lam: "Vậy nghiệm của bất phương trình là gì? Cả lớp cùng làm nhé!"'
    ],
    timelineComments: [
      {
        id: 'tc_301',
        second: 4,
        author: 'Trợ giảng An',
        role: 'ta',
        text: '📌 Chú ý: Trọng tâm bài là chiều của bất đẳng thức khi nhân/chia số âm!',
        isPinned: true
      },
      {
        id: 'tc_302',
        second: 15,
        author: 'Bo Ngây Ngô',
        role: 'classmate',
        text: 'Chia 6 cho −2 thì ra −3 quá dễ rồi cô ơi! 🚀'
      },
      {
        id: 'tc_303',
        second: 28,
        author: 'Minh Phương',
        role: 'classmate',
        text: 'Khoan Bo ơi, nhớ vụ số âm đổi chiều chưa, bài trước mới bị trừ điểm đấy!'
      },
      {
        id: 'tc_304',
        second: 42,
        author: 'Bo Ngây Ngô',
        role: 'classmate',
        text: 'Ủa sao phải đổi dấu? Dấu lớn hơn thì cứ để lớn hơn chứ ta? 🤔'
      },
      {
        id: 'tc_305',
        second: 52,
        author: 'Trợ giảng An',
        role: 'ta',
        text: 'Đến đoạn câu hỏi dừng! Cả lớp chọn đáp án để giải thích cho Bo nhé.'
      }
    ],
    checkpointQuestion: {
      prompt: 'Nghiệm của bất phương trình −2x > 6 là:',
      options: [
        {
          id: 'opt_1',
          label: 'x < −3  (Đổi chiều dấu từ ">" thành "<")',
          isStandardBest: true,
          feedback: 'Chính xác! Chia cho số âm bắt buộc phải đổi chiều dấu bất đẳng thức.'
        },
        {
          id: 'opt_2',
          label: 'x > −3  (Giữ nguyên chiều dấu ">")',
          isStandardBest: false,
          feedback: 'Coi chừng! Chia cho số âm mà không đổi chiều sẽ bị sai nghiệm.'
        },
        {
          id: 'opt_3',
          label: 'x > 3',
          isStandardBest: false,
          feedback: '6 chia cho −2 phải bằng −3.'
        }
      ]
    },
    boArgument: {
      speech: 'Ủa đề bài là dấu lớn hơn ">" cơ mà, sao nghiệm của cậu lại quay ngoắt thành dấu nhỏ hơn "<"? Cậu chia 6 cho −2 thì được −3, giữ nguyên dấu thì phải là x > −3 chứ! Tự nhiên đổi chiều dấu là sao ta?',
      shortcutClaim: 'Chia 2 vế nhưng giữ nguyên chiều bất đẳng thức',
      fallacyType: 'Quên đổi chiều khi nhân hoặc chia cho số âm'
    },
    rebuttalStickers: [
      {
        id: 'reb_1',
        text: 'Thử x = 0 (lớn hơn −3): −2(0) = 0 > 6 là vô lý hoàn toàn!',
        isEffective: true,
        feedback: 'Phản chứng quá xuất sắc! 0 > 6 là sai, chứng tỏ x > −3 là nghiệm sai.'
      },
      {
        id: 'reb_2',
        text: 'Quy tắc cơ bản: Nhân hoặc chia số âm PHẢI đổi chiều bất đẳng thức!',
        isEffective: true,
        feedback: 'Quy tắc chuẩn mực trong sách giáo khoa.'
      },
      {
        id: 'reb_3',
        text: 'Tớ đoán thế thôi chứ không biết giải thích!',
        isEffective: false,
        feedback: 'Hãy dùng một số cụ thể để phản chứng cho Bo thấy!'
      }
    ],
    boConcession: {
      speech: 'Á à... thử x = 0 vào thấy 0 > 6 là sai bét luôn! Phải lấy x < −3 (ví dụ x = −4) thì −2 · (−4) = 8 > 6 mới đúng! Hóa ra nhân chia số âm nó đảo ngược toàn bộ trục số! Giờ tớ mới thực sự hiểu bản chất!',
      realizationNote: 'Bo đã hiểu: Phép nhân chia số âm đảo ngược chiều trên trục số'
    },
    teacherClosure: {
      speech: 'Tuyệt vời! Cách lấy số thử phản chứng của Huy cực kỳ thuyết phục. Bo đã tâm phục khẩu phục rồi đấy!',
      goldenRule: 'Quy tắc vàng BPT: Nhân hoặc chia cả hai vế với số ÂM → BẮT BUỘC ĐỔI CHIỀU DẤU!'
    },
    freezeNote: 'Tóm tắt: Khi a > b thì -a < -b. Do đó chia cho số âm đảo ngược thứ tự lớn bé trên trục số.'
  },
  {
    id: 'VID_004',
    title: 'Phép cộng phân số & Cạm bẫy cộng gộp mẫu số',
    subject: 'Toán Số học 6-7',
    duration: 150,
    checkpointTimestamp: 40,
    blackboardTitle: 'Bài toán: Tính  1/3 + 1/4',
    lectureNotes: [
      'Cô Lam: "Hôm nay cô trò mình ôn lại phép tính cộng hai phân số nhé!"',
      'Cô Lam viết lên bảng: 1/3 + 1/4',
      'Cô Lam: "Hai phân số này có mẫu số khác nhau. Chúng ta phải làm gì trước tiên?"',
      'Cô Lam: "Huy và Bo hãy tính nhanh xem kết quả ra bao nhiêu nhé!"'
    ],
    checkpointQuestion: {
      prompt: 'Kết quả chính xác của phép tính 1/3 + 1/4 là:',
      options: [
        {
          id: 'opt_1',
          label: '7/12 (Quy đồng mẫu chung 12: 4/12 + 3/12)',
          isStandardBest: true,
          feedback: 'Chính xác! Bắt buộc phải quy đồng mẫu số chung trước khi cộng tử.'
        },
        {
          id: 'opt_2',
          label: '2/7 (Cộng tử với tử 1+1=2, mẫu với mẫu 3+4=7)',
          isStandardBest: false,
          feedback: 'Cạm bẫy kinh điển! Không bao giờ được cộng trực tiếp hai mẫu số với nhau.'
        },
        {
          id: 'opt_3',
          label: '1/7',
          isStandardBest: false,
          feedback: 'Chưa chính xác.'
        }
      ]
    },
    boArgument: {
      speech: 'Ủa Huy ơi! Cậu làm quy đồng 12 chi cho dài dòng vậy? Cứ lấy tử cộng tử: 1+1=2, mẫu cộng mẫu: 3+4=7, ra luôn 2/7 vừa nhanh vừa gọn! Quy tắc cộng thì cứ cộng hết lại chứ sao?',
      shortcutClaim: 'Cộng thẳng tử với tử, mẫu với mẫu',
      fallacyType: 'Cộng mẫu số thay vì quy đồng mẫu chung'
    },
    rebuttalStickers: [
      {
        id: 'reb_1',
        text: '1/3 cái bánh to hơn 2/7 cái bánh rồi, cộng thêm 1/4 sao lại bé hơn được!',
        isEffective: true,
        feedback: 'Lý lẽ trực quan tuyệt vời! 1/3 > 2/7, cộng thêm số dương không thể ra số bé hơn.'
      },
      {
        id: 'reb_2',
        text: 'Hai miếng bánh khác kích thước thì không thể gộp số miếng trực tiếp được!',
        isEffective: true,
        feedback: 'Hình tượng chia bánh rất chuẩn xác về mặt bản chất đơn vị phân số.'
      },
      {
        id: 'reb_3',
        text: 'SGK bảo quy đồng thì phải quy đồng!',
        isEffective: false,
        feedback: 'Hãy giải thích vì sao cần quy đồng để Bo hiểu bản chất!'
      }
    ],
    boConcession: {
      speech: 'Ơ... đúng thật! 1/3 cái bánh đã to hơn 2/7 rồi, cộng thêm 1/4 mà lại thành 2/7 thì bánh bị teo đi à! Phải cắt thành các miếng bằng nhau kích thước 1/12 thì mới đếm được tổng số miếng! Cậu giải thích trực quan ghê!',
      realizationNote: 'Bo đã hiểu: Mẫu số là kích thước phần chia, phải quy về cùng kích thước mới cộng được'
    },
    teacherClosure: {
      speech: 'Rất xuất sắc! Phân số đại diện cho số phần chia. Muốn cộng các phần với nhau, chúng bắt buộc phải có cùng kích thước (tức là cùng mẫu số).',
      goldenRule: 'Quy tắc cộng phân số: BẮT BUỘC quy đồng về cùng mẫu số chung rồi mới cộng tử số!'
    },
    freezeNote: 'Tóm tắt: Phép cộng phân số khác mẫu a/b + c/d = (ad + bc) / bd. Không bao giờ được cộng gộp mẫu số.'
  },
  {
    id: 'VID_005',
    title: 'Quy tắc luỹ thừa & Bẫy nhân hai số mũ',
    subject: 'Toán Đại số 7',
    duration: 140,
    checkpointTimestamp: 40,
    blackboardTitle: 'Bài toán: Rút gọn biểu thức  2³ × 2²',
    lectureNotes: [
      'Cô Lam: "Hôm nay chúng ta cùng ôn luyện quy tắc nhân hai luỹ thừa cùng cơ số."',
      'Cô Lam viết: 2³ × 2²',
      'Cô Lam: "Hai luỹ thừa này có cùng cơ số là 2."',
      'Cô Lam: "Hai đứa thử tính nhanh kết quả nhé!"'
    ],
    checkpointQuestion: {
      prompt: 'Kết quả rút gọn của biểu thức 2³ × 2² là:',
      options: [
        {
          id: 'opt_1',
          label: '2⁵ = 32 (Cộng số mũ: 3 + 2 = 5)',
          isStandardBest: true,
          feedback: 'Chính xác! Nhân hai luỹ thừa cùng cơ số: giữ nguyên cơ số, CỘNG số mũ.'
        },
        {
          id: 'opt_2',
          label: '2⁶ = 64 (Nhân số mũ: 3 × 2 = 6)',
          isStandardBest: false,
          feedback: 'Coi chừng nhầm lẫn giữa quy tắc nhân luỹ thừa và luỹ thừa của luỹ thừa!'
        },
        {
          id: 'opt_3',
          label: '4⁵ = 1024',
          isStandardBest: false,
          feedback: 'Không được nhân cơ số với nhau khi đang có số mũ.'
        }
      ]
    },
    boArgument: {
      speech: 'Ủa ở giữa là dấu nhân (×) mà, sao cậu lại lấy số mũ cộng (+) lại? Dấu nhân thì phải nhân số mũ chứ: 3 × 2 = 6, ra 2⁶ mới đúng phép toán chứ cậu?',
      shortcutClaim: 'Lấy số mũ nhân với nhau khi nhân hai luỹ thừa',
      fallacyType: 'Nhân số mũ thay vì cộng số mũ'
    },
    rebuttalStickers: [
      {
        id: 'reb_1',
        text: 'Viết ra dạng nhân: (2×2×2) × (2×2), đếm tổng cộng có 5 số 2, tức là 2⁵!',
        isEffective: true,
        feedback: 'Cách khai triển bản chất tuyệt đối chính xác! 3 số 2 nhân thêm 2 số 2 là 5 số 2.'
      },
      {
        id: 'reb_2',
        text: '2³ = 8, 2² = 4, 8 × 4 = 32 = 2⁵, còn 2⁶ = 64 là sai bét!',
        isEffective: true,
        feedback: 'Tính giá trị cụ thể để phản chứng rất thuyết phục.'
      },
      {
        id: 'reb_3',
        text: 'Vì công thức ghi thế!',
        isEffective: false,
        feedback: 'Cần phân tích bản chất phép đếm số thừa số.'
      }
    ],
    boConcession: {
      speech: 'À há! (2×2×2) là 3 số, nhân thêm (2×2) là 2 số nữa, gộp lại có 5 số 2 đang nhân nhau! Thảo nào số mũ là 3 + 2 = 5 chứ không phải nhân! Tớ nhớ bản chất rồi!',
      realizationNote: 'Bo đã hiểu: Nhân luỹ thừa cùng cơ số là cộng gộp số lượng thừa số'
    },
    teacherClosure: {
      speech: 'Chính xác! Luỹ thừa chỉ là cách viết tắt của phép nhân nhiều thừa số bằng nhau. Khi nhân thêm, ta chỉ việc cộng dồn số lượng thừa số lại!',
      goldenRule: 'Quy tắc luỹ thừa: aᵐ × aⁿ = aᵐ⁺ⁿ (Giữ nguyên cơ số, CỘNG số mũ)!'
    },
    freezeNote: 'Tóm tắt: Nhân cùng cơ số thì CỘNG số mũ. Chỉ NHÂN số mũ khi là luỹ thừa của luỹ thừa: (aᵐ)ⁿ = aᵐⁿ.'
  }
];
