// DỮ LIỆU MẪU DEMO - sẽ thay bằng lesson.json/session json sinh từ script người dùng upload
import { DRELessonSchema } from '../types/lesson';
import { InspectorTurn, ReasoningEvent } from '../types/reasoning';

// =========================================================================
// 1. THÔNG TIN BÀI HỌC VECTƠ TRONG KHÔNG GIAN DÙNG CHUNG
// =========================================================================
export const DEMO_LESSON_INFO = {
  subject: 'Toán 12 (SGK Mới)',
  lessonTitle: 'Toán 12 · Vectơ trong không gian',
  teacherName: 'Thầy Nguyễn Phan Tiến',
  videoDurationLabel: '1h38m',
  videoDurationSeconds: 5880,
  fullTopicChip: 'Toán 12 · Vectơ trong không gian · Thầy Nguyễn Phan Tiến',
  timelineMilestones: [
    { time: '00:00', title: 'Khởi động', desc: 'Định nghĩa & Giá vectơ trong không gian' },
    { time: '21:00', title: 'Quy tắc hình', desc: 'Quy tắc 3 điểm & Quy tắc hình bình hành' },
    { time: '37:13', title: 'Câu hỏi dừng', desc: 'Bẫy độ dài |a+b| ≤ |a| + |b|' },
    { time: '1:06:30', title: 'Quy tắc thế', desc: 'Nhân vectơ với một số trong không gian' },
    { time: '1:30:30', title: 'Dự đoán POE', desc: 'Biểu diễn vectơ IA = -3·IG (ngược hướng)' },
    { time: '1:40:10', title: 'Lăng trụ', desc: 'Biểu diễn vectơ B\'C theo 3 vectơ không đồng phẳng' },
  ]
};

// =========================================================================
// 2. HẰNG SỐ THÁP BLOOM 6 BẬC DÙNG CHUNG TOÀN ỨNG DỤNG
// Chuẩn hóa tên: Nhớ, Hiểu, Vận dụng, Phân tích, Đánh giá, Sáng tạo
// Dòng phụ: Ghi nhớ, Thấu hiểu, Vận dụng, Bắt lỗi sai ở Trạm 2, Phản biện bẫy |a+b| tại 37:13, Tự ra đề ở Trạm 4
// =========================================================================
export const BLOOM_TAXONOMY = [
  {
    index: 1,
    level: 'Bậc 1',
    code: 'remember',
    skill: 'Nhớ',
    skillSub: 'Ghi nhớ',
    short: 'Nhớ',
    fullLabel: 'Nhớ (Remember · L1)',
    desc: 'Nắm vững định nghĩa vectơ, phương vectơ, hướng và quy ước độ dài trong không gian',
    stationActivity: 'Khởi động định nghĩa & Giá vectơ'
  },
  {
    index: 2,
    level: 'Bậc 2',
    code: 'understand',
    skill: 'Hiểu',
    skillSub: 'Thấu hiểu',
    short: 'Hiểu',
    fullLabel: 'Hiểu (Understand · L2)',
    desc: 'Phân biệt phương, hướng & dấu hệ số tỉ lệ khi nhân vectơ với một số',
    stationActivity: 'Quy tắc 3 điểm & Hình bình hành'
  },
  {
    index: 3,
    level: 'Bậc 3',
    code: 'apply',
    skill: 'Vận dụng',
    skillSub: 'Vận dụng',
    short: 'Vận dụng',
    fullLabel: 'Vận dụng (Apply · L3)',
    desc: 'Áp dụng quy tắc hình bình hành đáy & quy tắc hình hộp để rút gọn biểu thức',
    stationActivity: 'Rút gọn đẳng thức vectơ không gian'
  },
  {
    index: 4,
    level: 'Bậc 4',
    code: 'analyze',
    skill: 'Phân tích',
    skillSub: 'Bắt lỗi sai ở Trạm 2',
    short: 'Phân tích',
    fullLabel: 'Phân tích (Analyze · L4)',
    desc: 'Phát hiện lỗi sai đảo điểm ở quy tắc hiệu chung gốc (OA - OB = BA) trong bài giải của Bo',
    stationActivity: 'Bắt lỗi sai ở Trạm 2'
  },
  {
    index: 5,
    level: 'Bậc 5',
    code: 'evaluate',
    skill: 'Đánh giá',
    skillSub: 'Phản biện bẫy |a+b| tại 37:13',
    short: 'Đánh giá',
    fullLabel: 'Đánh giá (Evaluate · L5)',
    desc: 'Bẻ gãy bẫy trực giác tách độ dài tổng |a+b| = |a|+|b| tại mốc 37:13 và bảo vệ lập luận',
    stationActivity: 'Phản biện bẫy |a+b| tại 37:13'
  },
  {
    index: 6,
    level: 'Bậc 6',
    code: 'create',
    skill: 'Sáng tạo',
    skillSub: 'Tự ra đề ở Trạm 4',
    short: 'Sáng tạo',
    fullLabel: 'Sáng tạo (Create · L6)',
    desc: "Tự thiết kế đề toán thách đấu AB + AD + AA' = AC' chuẩn xác, được Hội đồng thẩm định phê duyệt",
    stationActivity: 'Tự ra đề ở Trạm 4'
  }
];

// =========================================================================
// 3. DỮ LIỆU GIÁO ÁN VECTƠ TOÀN DIỆN CHO TIMELINE EDITOR (L1 -> L6)
// =========================================================================
export const DEMO_LESSON_SCHEMA: DRELessonSchema = {
  lesson_id: 'lesson_dre_vector_12',
  title: 'Toán 12 · Vectơ trong không gian · Thầy Nguyễn Phan Tiến',
  description: 'Giáo án tương tác sư phạm Đa tác tử DRE: Khám phá vectơ không gian, quy tắc hình hộp và bẻ gãy bẫy trực giác độ dài.',
  status: 'draft',
  parts: [
    {
      id: 'part-01',
      title: 'Phần 1: Khởi động & Quy tắc hình trong không gian (00:00 - 21:00)',
      duration: 1260,
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pause_questions: [
        {
          id: 'pq-01',
          timestamp: 300,
          question: 'Trong không gian, hai vectơ cùng phương khi và chỉ khi giá của chúng có quan hệ gì?',
          bloom_level: 'Nhớ (Remember · L1)',
          expected_answers: [
            'Giá của chúng song song hoặc trùng nhau',
            'Song song hoặc trùng'
          ],
          is_active: true,
          type: 'active'
        }
      ],
      scenarios: [
        {
          id: 'sc-01',
          timestamp: 120,
          agent: 'Trí',
          trigger_condition: 'Học sinh vừa xem xong phần giới thiệu giá của vectơ',
          dialogue: 'Các bạn lưu ý nhé: Trong không gian 3 chiều, hai đường thẳng không cắt nhau chưa chắc đã song song đâu, chúng có thể chéo nhau đấy!',
          bloom_level: 'Hiểu (Understand · L2)',
          is_active: true,
          type: 'passive'
        },
        {
          id: 'sc-02',
          timestamp: 900,
          agent: 'Bo',
          trigger_condition: 'Khi thầy Tiến giảng về quy tắc ba điểm OA + AB = OB',
          dialogue: 'A, quy tắc nối tiếp này giống hệt trong mặt phẳng! Cứ điểm cuối của vectơ này nối vào điểm đầu của vectơ kia là triệt tiêu được!',
          bloom_level: 'Vận dụng (Apply · L3)',
          is_active: true,
          type: 'passive'
        }
      ]
    },
    {
      id: 'part-02',
      title: 'Phần 2: Bẫy trực giác độ dài vectơ và Quy tắc thế (21:00 - 1:06:30)',
      duration: 2730,
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pause_questions: [
        {
          id: 'pq-02',
          timestamp: 2233,
          question: 'Cho hình lập phương ABCD.A\'B\'C\'D\' cạnh 1. Độ dài tổng |BC + DD\'| bằng bao nhiêu? Có bằng 1 + 1 = 2 không?',
          bloom_level: 'Đánh giá (Evaluate · L5)',
          expected_answers: [
            '|BC + DD\'| = √2 ≈ 1.414, không bằng 2 vì hai vectơ vuông góc nhau.',
            'Căn 2 (≈ 1.414)'
          ],
          is_active: true,
          type: 'active'
        }
      ],
      scenarios: [
        {
          id: 'sc-03',
          timestamp: 1800,
          agent: 'Trí',
          trigger_condition: 'Trước mốc dừng 37:13',
          dialogue: 'Chuẩn bị đến bài toán bẫy kinh điển của thầy Tiến rồi! Mọi người chú ý: Độ dài của tổng khác với tổng độ dài nhé!',
          bloom_level: 'Phân tích (Analyze · L4)',
          is_active: true,
          type: 'passive'
        },
        {
          id: 'sc-04',
          timestamp: 2240,
          agent: 'Bo',
          trigger_condition: 'Sau khi học sinh đối mặt với câu hỏi dừng 37:13',
          dialogue: 'Ối, nhìn thấy cạnh BC = 1 và DD\' = 1 làm mình cứ tưởng cộng đại 1 + 1 = 2 luôn cho xong!',
          bloom_level: 'Đánh giá (Evaluate · L5)',
          is_active: true,
          type: 'passive'
        }
      ]
    },
    {
      id: 'part-03',
      title: 'Phần 3: Dự đoán POE & Săn bẫy vectơ ngược hướng (1:06:30 - 1:30:30)',
      duration: 1440,
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pause_questions: [
        {
          id: 'pq-03',
          timestamp: 5430,
          question: 'Cho điểm I thuộc đoạn AG sao cho IA = 3·IG. Khi biểu diễn vectơ IA theo vectơ IG, dấu của hệ số k là dương hay âm?',
          bloom_level: 'Phân tích (Analyze · L4)',
          expected_answers: [
            'Hệ số mang dấu âm (k = -3) vì vectơ IA và vectơ IG ngược hướng.',
            'k = -3 (ngược hướng)'
          ],
          is_active: true,
          type: 'active'
        }
      ],
      scenarios: [
        {
          id: 'sc-05',
          timestamp: 5400,
          agent: 'Bo',
          trigger_condition: 'Khi bước vào trạm POE',
          dialogue: 'Độ dài IA gấp 3 lần IG thì gắn mũi tên vectơ vào vẫn phải là IA = 3·IG chứ, sao lại có dấu trừ được?',
          bloom_level: 'Hiểu (Understand · L2)',
          is_active: true,
          type: 'passive'
        }
      ]
    },
    {
      id: 'part-04',
      title: 'Phần 4: Gia sư nhí & Tự ra đề đẳng thức hình hộp (1:30:30 - 1:38:00)',
      duration: 450,
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      pause_questions: [
        {
          id: 'pq-04',
          timestamp: 5800,
          question: 'Em hãy viết một đẳng thức biểu diễn quy tắc hình hộp xuất phát từ đỉnh A của hình hộp ABCD.A\'B\'C\'D\'.',
          bloom_level: 'Sáng tạo (Create · L6)',
          expected_answers: [
            'AB + AD + AA\' = AC\'',
            'AC\' = AB + AD + AA\''
          ],
          is_active: true,
          type: 'active'
        }
      ],
      scenarios: [
        {
          id: 'sc-06',
          timestamp: 5850,
          agent: 'Cô Lam',
          trigger_condition: 'Sau khi đề toán thách đấu được Hội đồng thẩm định phê duyệt',
          dialogue: 'Xuất sắc lắm các em! Các em đã làm chủ trọn vẹn từ định nghĩa nền tảng đến sáng tạo đề toán không gian!',
          bloom_level: 'Sáng tạo (Create · L6)',
          is_active: true,
          type: 'passive'
        }
      ]
    }
  ]
};

// =========================================================================
// 4. DỮ LIỆU LƯỢT THOẠI TÁC TỬ MẪU CHO INSPECTOR DRAWER
// Đồng bộ 100% nội dung Vectơ, phân tích bẫy 37:13 và quy tắc hiệu
// =========================================================================
export const DEMO_INSPECTOR_TURNS: InspectorTurn[] = [
  {
    turnId: 'turn-01',
    agent: 'Trí',
    routing: {
      intent: 'Giải thích vì sao |a+b| ≠ |a|+|b| khi hai vectơ không cùng hướng',
      selectedAgent: 'Trí',
      confidence: 0.96,
      reason: 'Câu hỏi của học sinh yêu cầu giải thích bẫy trực giác độ dài vectơ tại mốc 37:13.'
    },
    context: {
      observedSegment: 'Phân đoạn bài giảng (37:13, bẫy độ dài |BC + DD\'|)',
      problemEntities: ['Hình lập phương ABCD.A\'B\'C\'D\' cạnh 1', 'Vectơ BC', 'Vectơ DD\' vuông góc BC', 'Đường chéo BC\' = √2'],
      misconceptionDetected: 'Đồng nhất độ dài vectơ tổng với tổng độ dài đại số (|a + b| = |a| + |b| = 1 + 1 = 2)'
    },
    thought:
      'Học sinh và Bo đang có phản xạ cộng độ dài đại số trực tiếp: |BC + DD\'| = 1 + 1 = 2. Cần phân tích bản chất hình học: BC và DD\' vuông góc nhau trong không gian, do đó phải thay DD\' = CC\' để nối tiếp thành BC + CC\' = BC\'. Độ dài là cạnh huyền tam giác vuông BCC\', bằng √2 ≈ 1.414.',
    speech:
      'Chào bạn! Ở mốc 37:13, vectơ BC và DD\' vuông góc nhau trong không gian. Khi dời vectơ DD\' thành vectơ bằng nó là CC\', ta có BC + CC\' = BC\'. Độ dài đường chéo là √2 chứ không thể bằng 1 + 1 = 2 đâu nhé!',
    assessor: {
      bloomBefore: 'Hiểu (Understand · L2)',
      bloomAfter: 'Phân tích (Analyze · L4)',
      hesitationScore: 0.18,
      matchedPoints: ['Phát hiện hai vectơ vuông góc', 'Áp dụng phép tịnh tiến vectơ thế DD\' = CC\'', 'Tính đúng độ dài đường chéo √2'],
      missingPoints: ['Chưa giải thích dấu bằng của bất đẳng thức tam giác']
    }
  },
  {
    turnId: 'turn-02',
    agent: 'Bo',
    routing: {
      intent: 'Đặt câu hỏi thắc mắc về quy tắc hiệu chung gốc (OA - OB)',
      selectedAgent: 'Bo',
      confidence: 0.89,
      reason: 'Bo bộc lộ ngộ nhận kinh điển về thứ tự điểm đầu/cuối trong phép trừ vectơ.'
    },
    context: {
      observedSegment: 'Sổ tay bắt lỗi (Bước 2: Quy tắc hiệu)',
      problemEntities: ['Phép trừ chung gốc: OA - OB', 'Ngộ nhận viết thành AB thay vì BA'],
      misconceptionDetected: 'Nhầm lẫn thứ tự điểm ngọn khi thực hiện phép trừ hai vectơ chung gốc'
    },
    thought:
      'Mình nhìn thấy chữ A đứng trước chữ B trong biểu thức OA - OB nên quen tay viết luôn thành AB. Tại sao cô Lam lại bảo phải lộn ngược điểm B lên trước thành BA nhỉ?',
    speech:
      'Khoan đã Trí ơi! Nếu lấy OA trừ OB thì mình thấy chữ A đứng trước chữ B mà, sao công thức lại bắt đảo ngược điểm B lên trước thành vectơ BA vậy?',
    assessor: {
      bloomBefore: 'Nhớ (Remember · L1)',
      bloomAfter: 'Hiểu (Understand · L2)',
      hesitationScore: 0.22,
      matchedPoints: ['Nhận biết biểu thức chung gốc O', 'Thẳng thắn đặt nghi vấn về quy ước thứ tự'],
      missingPoints: ['Chưa chứng minh lại bằng quy tắc cộng nối tiếp OB + BA = OA']
    }
  },
  {
    turnId: 'turn-03',
    agent: 'Cô Lam',
    routing: {
      intent: 'Tổng kết đánh giá sư phạm & Khẩu quyết nhớ quy tắc hiệu',
      selectedAgent: 'Cô Lam',
      confidence: 0.99,
      reason: 'Giải tỏa thắc mắc của Bo, chốt khẩu quyết tư duy và khen ngợi năng lực tự ra đề.'
    },
    context: {
      observedSegment: 'Gia sư nhí & Hội đồng thẩm định (Trạm 4)',
      problemEntities: ['Khẩu quyết quy tắc trừ', 'Đẳng thức hình hộp AB + AD + AA\' = AC\'', 'Đạt Bậc 6 Tháp Bloom'],
      misconceptionDetected: 'Đã khắc phục hoàn toàn mọi ngộ nhận nền tảng'
    },
    thought:
      'Bo đã chạm đúng vào bản chất: OA - OB = OA + (-OB) = OA + BO = BO + OA = BA. Khẩu quyết "Phép trừ chung gốc: Điểm sau lên trước" của Linh Chi sẽ giúp các em nhớ suốt đời. Đồng thời ở Trạm 4 học sinh đã tự ra đề xuất sắc đạt chuẩn Hội đồng.',
    speech:
      'Cô Lam khen câu hỏi của Bo rất thực tế! Hãy nhớ khẩu quyết: "Phép trừ chung gốc, lộn ngược sau lên trước", vì OB + BA = OA. Và ở Trạm 4, bạn gia sư nhí đã tự thiết kế đề toán AB + AD + AA\' = AC\' xuất sắc đạt chuẩn Hội đồng!',
    assessor: {
      bloomBefore: 'Đánh giá (Evaluate · L5)',
      bloomAfter: 'Sáng tạo (Create · L6)',
      hesitationScore: 0.05,
      matchedPoints: ['Đúc kết khẩu quyết sư phạm', 'Khắc phục triệt để bẫy ngộ nhận trừ vectơ', 'Phê duyệt đẳng thức hình hộp tự ra đề'],
      missingPoints: []
    }
  }
];

// =========================================================================
// 5. DỮ LIỆU WAR ROOM REASONING EVENTS ĐỒNG BỘ SANG VECTƠ
// =========================================================================
export const DEMO_REASONING_EVENTS: ReasoningEvent[] = [
  {
    id: 'evt-001',
    timestamp: 1729000000000,
    agent: 'Dispatcher',
    eventType: 'thinking',
    phase: 'extract',
    content: 'Phát hiện câu hỏi của học sinh về bẫy độ dài vectơ tại mốc 37:13: |BC + DD\'|. Kích hoạt bộ trích xuất quan hệ hình học không gian.'
  },
  {
    id: 'evt-002',
    timestamp: 1729000000800,
    agent: 'Dispatcher',
    eventType: 'tool_call',
    phase: 'extract',
    toolCall: {
      toolName: 'tool_extract_problem_entities',
      args: {
        text: 'Cho hình lập phương ABCD.A\'B\'C\'D\' cạnh 1. Tính độ dài |BC + DD\'|...'
      }
    }
  },
  {
    id: 'evt-003',
    timestamp: 1729000001500,
    agent: 'Dispatcher',
    eventType: 'tool_result',
    phase: 'extract',
    toolResult: {
      toolName: 'tool_extract_problem_entities',
      status: 'success',
      result: {
        entities: [
          'Hình lập phương ABCD.A\'B\'C\'D\' cạnh 1',
          'Vectơ BC và Vectơ DD\' chéo nhau và vuông góc',
          'Phép tịnh tiến thế DD\' = CC\''
        ],
        targetTheorem: 'Vector Addition & Triangle Inequality in Space'
      }
    }
  },
  {
    id: 'evt-004',
    timestamp: 1729000002200,
    agent: 'An',
    eventType: 'thinking',
    phase: 'rag',
    content: 'Truy hồi SGK Toán 12 (SGK Mới) - Chương I: Vectơ trong không gian. Bài giảng Thầy Nguyễn Phan Tiến.'
  },
  {
    id: 'evt-005',
    timestamp: 1729000002900,
    agent: 'An',
    eventType: 'tool_call',
    phase: 'rag',
    toolCall: {
      toolName: 'tool_rag_curriculum_search',
      args: {
        query: 'Bất đẳng thức tam giác vectơ và quy tắc thế hình hộp trong không gian',
        grade: 12
      }
    }
  },
  {
    id: 'evt-006',
    timestamp: 1729000003600,
    agent: 'An',
    eventType: 'tool_result',
    phase: 'rag',
    toolResult: {
      toolName: 'tool_rag_curriculum_search',
      status: 'success',
      result: {
        snippet: '|a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Trong hình lập phương, BC và DD\' vuông góc nên độ dài tổng bằng √2 ≈ 1.414.'
      }
    }
  },
  {
    id: 'evt-007',
    timestamp: 1729000004300,
    agent: 'Tri',
    eventType: 'thinking',
    phase: 'generate',
    content: 'Phát hiện bẫy trực giác của Bo (1 + 1 = 2). Chuẩn bị lời thoại phản biện chỉ ra phép thế DD\' = CC\' để nối tiếp BC + CC\' = BC\'.'
  },
  {
    id: 'evt-008',
    timestamp: 1729000005000,
    agent: 'CoLam',
    eventType: 'thinking',
    phase: 'evaluate',
    content: 'Đánh giá học sinh đã vượt qua bẫy độ dài ở Trạm 1 và sẵn sàng bước vào Trạm 2 (Sổ tay bắt lỗi hiệu vectơ).'
  }
];

// =========================================================================
// 6. DỮ LIỆU TỔNG KẾT SƯ PHẠM CHO TAB GIÁO VIÊN
// =========================================================================
export const DEMO_TEACHER_SUMMARY = {
  learnerName: 'Lê Minh An',
  className: 'Lớp 12A1',
  lessonTopic: 'Bài 1.1 Vectơ trong không gian',
  studentInfoPrefix: 'Học sinh: ',

  card1Title: 'Chỉ số làm chủ',
  masteryScore: '92%',
  masteryNote: 'Vượt chuẩn đầu ra môn Toán 12',

  card2Title: 'Thời gian học',
  learningTime: '4m 50s',
  learningTimeNote: 'Đúng tiến độ kịch bản sư phạm',

  card3Title: 'Tỉ lệ phản biện',
  rebuttalRate: '100%',
  rebuttalNote: 'Bẻ gãy trọn vẹn 2 ngộ nhận điển hình',

  tableTitle: 'Kết quả chẩn đoán nhận thức (Tháp Bloom)',
  evaluationScope: 'Toàn diện 6 cấp độ',
  colStepTitle: 'Bậc',
  colSkillTitle: 'Năng lực',
  colEvidenceTitle: 'Bằng chứng quan sát sư phạm',
  colStatusTitle: 'Trạng thái',

  diagnosticRows: [
    {
      step: 'Bậc 1',
      skill: 'Nhớ',
      skillSub: 'Ghi nhớ',
      evidence: 'Nắm vững định nghĩa vectơ, giá vectơ và quy ước độ dài trong không gian.',
      status: 'Làm chủ'
    },
    {
      step: 'Bậc 2',
      skill: 'Hiểu',
      skillSub: 'Thấu hiểu',
      evidence: 'Phân biệt rõ ràng giữa hai vectơ cùng hướng và ngược hướng khi xác định dấu hệ số tỉ lệ.',
      status: 'Làm chủ'
    },
    {
      step: 'Bậc 3',
      skill: 'Vận dụng',
      skillSub: 'Vận dụng',
      evidence: 'Áp dụng chính xác quy tắc 3 điểm, hình bình hành và hình hộp để tính toán tổng vectơ.',
      status: 'Đạt'
    },
    {
      step: 'Bậc 4',
      skill: 'Phân tích',
      skillSub: 'Bắt lỗi sai ở Trạm 2',
      evidence: 'Phát hiện và chỉ ra chính xác lỗi sai đảo điểm ở quy tắc hiệu chung gốc (OA - OB = BA) trong bài giải của Bo.',
      status: 'Đạt'
    },
    {
      step: 'Bậc 5',
      skill: 'Đánh giá',
      skillSub: 'Phản biện bẫy |a+b| tại 37:13',
      evidence: 'Bẻ gãy bẫy trực giác tách độ dài tổng |a + b| = |a| + |b| tại mốc video 37:13 và bảo vệ lập luận trước Bo.',
      status: 'Đạt'
    },
    {
      step: 'Bậc 6',
      skill: 'Sáng tạo',
      skillSub: 'Tự ra đề ở Trạm 4',
      evidence: "Tự thiết kế đề toán thách đấu AB + AD + AA' = AC' chuẩn xác, được Hội đồng thẩm định phê duyệt.",
      status: 'Xuất sắc'
    }
  ],

  interventionTitle: 'Điểm cần can thiệp & lưu ý',
  interventionNotes: [
    'Học sinh từng do dự tại Bước 2 do áp dụng sai quy tắc hiệu chung gốc (nhầm thứ tự điểm đầu/cuối trong OA − OB = BA). Cần chú ý khi giao bài tập có các phép trừ vectơ.',
    'Khả năng phản biện của học sinh sắc bén khi giải thích cho Bo ở Trạm 4, nhưng còn lúng túng ở khâu gõ ký hiệu vectơ toán học.'
  ],

  nextActionTitle: 'Gợi ý hành động tiếp theo cho giáo viên',
  nextActionSuggestions: [
    'Giao thêm 2 bài tập biến thể với hình chóp có đáy là hình thang để củng cố kỹ năng dựng vectơ bằng nhau.',
    'Khuyến khích học sinh tiếp tục đóng vai gia sư nhí kèm bạn Bo trong các chủ đề tích vô hướng tiếp theo.'
  ],

  restartCycleBtn: '↺ Bắt đầu chu trình học mới (Trạm 1)',
  exportPdfBtn: 'Xuất phiếu báo cáo học tập (PDF)'
};
