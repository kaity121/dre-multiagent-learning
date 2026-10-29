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
// Dòng phụ là hoạt động ở trạm: Khởi động & Nhận diện, Quy tắc 3 điểm, Quy tắc hình hộp, Bắt lỗi ở Trạm 2, Phản biện mốc 37:13, Tự ra đề Trạm 4
// =========================================================================
export const BLOOM_TAXONOMY = [
  {
    index: 1,
    level: 'Bậc 1',
    code: 'remember',
    skill: 'Nhớ',
    skillSub: 'Khởi động & Nhận diện',
    short: 'Nhớ',
    fullLabel: 'Nhớ (Remember · L1)',
    desc: 'Nắm chắc định nghĩa vectơ và giá vectơ trong không gian',
    stationActivity: 'Khởi động & Nhận diện'
  },
  {
    index: 2,
    level: 'Bậc 2',
    code: 'understand',
    skill: 'Hiểu',
    skillSub: 'Quy tắc 3 điểm',
    short: 'Hiểu',
    fullLabel: 'Hiểu (Understand · L2)',
    desc: 'Thấu hiểu bản chất phương, hướng và phép cộng nối tiếp',
    stationActivity: 'Quy tắc 3 điểm & Nối tiếp'
  },
  {
    index: 3,
    level: 'Bậc 3',
    code: 'apply',
    skill: 'Vận dụng',
    skillSub: 'Quy tắc hình hộp',
    short: 'Vận dụng',
    fullLabel: 'Vận dụng (Apply · L3)',
    desc: 'Áp dụng hình bình hành đáy và hình hộp để rút gọn biểu thức',
    stationActivity: 'Quy tắc hình hộp & Rút gọn'
  },
  {
    index: 4,
    level: 'Bậc 4',
    code: 'analyze',
    skill: 'Phân tích',
    skillSub: 'Bắt lỗi ở Trạm 2',
    short: 'Phân tích',
    fullLabel: 'Phân tích (Analyze · L4)',
    desc: 'Vạch rõ sai lầm đảo điểm ở quy tắc hiệu OA - OB = BA',
    stationActivity: 'Bắt lỗi sai ở Trạm 2'
  },
  {
    index: 5,
    level: 'Bậc 5',
    code: 'evaluate',
    skill: 'Đánh giá',
    skillSub: 'Phản biện mốc 37:13',
    short: 'Đánh giá',
    fullLabel: 'Đánh giá (Evaluate · L5)',
    desc: 'Bẻ gãy bẫy tách độ dài |a+b| và bảo vệ vững lập luận',
    stationActivity: 'Phản biện bẫy |a+b| tại 37:13'
  },
  {
    index: 6,
    level: 'Bậc 6',
    code: 'create',
    skill: 'Sáng tạo',
    skillSub: 'Tự ra đề Trạm\u00A04',
    short: 'Sáng tạo',
    fullLabel: 'Sáng tạo (Create · L6)',
    desc: 'Thiết lập đề toán thách đấu hình hộp mới đạt chuẩn',
    stationActivity: 'Tự ra đề ở Trạm\u00A04'
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
// 4 lượt liên hoàn, đồng bộ 100% Vectơ 12 mốc 37:13 (Lượt 4 là mặc định)
// =========================================================================
export const DEMO_INSPECTOR_TURNS: InspectorTurn[] = [
  {
    turnId: 'turn-01',
    turnNumber: 1,
    timestamp: 1729000000000,
    timestampStr: '00:00',
    agent: 'Trí',
    dispatcher: {
      intent: 'Nhận diện định nghĩa vectơ',
      selectedAgent: 'Trí',
      confidence: 0.95,
      reason: 'Học sinh bắt đầu bài giảng, cần Trí hỗ trợ phân biệt khái niệm phương và hướng của vectơ.'
    },
    contextView: {
      boardSnippet: 'Vectơ trong không gian',
      teacherSpeech: 'Đã chép lời',
      ragKnowledge: 'SGK Toán 12',
      hiddenItem: 'Lời giải bài tập cuối giờ',
      visibleContext: [
        'Bảng phấn: Khái niệm vectơ & phương hướng',
        'Lời thầy: Nhắc lại kiến thức lớp 10',
        'Tri thức tra cứu: SGK Toán 12 Mới'
      ],
      hiddenContext: ['Lời giải bài tập cuối giờ (Ẩn với Trí)']
    },
    thought:
      'Học sinh đã nắm chắc định nghĩa phương và hướng. Cần hướng dẫn chú ý giá của vectơ trong không gian.',
    speech:
      'Chào bạn! Trong không gian, hai vectơ cùng phương khi giá của chúng song song hoặc trùng nhau.',
    assessor: {
      matchedSummary: 'Đạt 3/3 ý cần có',
      matchedPoints: ['Nhận biết định nghĩa vectơ', 'Xác định đúng phương của vectơ', 'Phân biệt hướng và độ dài'],
      missingPoints: [],
      verdictLabel: 'Đạt chuẩn nhận diện',
      bloomBefore: 'Bậc 1 Nhớ',
      bloomAfter: 'Bậc 1 Nhớ',
      bloomLevel: 1,
      hesitationScore: 0.1,
      hesitationLabel: 'thấp'
    }
  },
  {
    turnId: 'turn-02',
    turnNumber: 2,
    timestamp: 1729000001000,
    timestampStr: '21:00',
    agent: 'Minh Khang',
    dispatcher: {
      intent: 'Quy tắc 3 điểm nối tiếp',
      selectedAgent: 'Minh Khang',
      confidence: 0.92,
      reason: 'Học sinh thắc mắc về cách cộng nối tiếp nhiều vectơ trong hình lập phương.'
    },
    contextView: {
      boardSnippet: 'AB + BC = AC',
      teacherSpeech: 'Đã chép lời',
      ragKnowledge: 'Không dùng',
      hiddenItem: 'Lời giải chuẩn của bài',
      visibleContext: [
        'Bảng phấn 21:00: Quy tắc 3 điểm nối tiếp',
        'Lời thầy: Điểm cuối của vectơ này là điểm đầu của vectơ kia',
        'Tri thức tra cứu: Không dùng'
      ],
      hiddenContext: ['Lời giải chuẩn của bài (Ẩn với Minh Khang)']
    },
    thought:
      'Ví von đi từ A đến B rồi từ B đến C giống như bắt xe buýt liên tỉnh nối chuyến.',
    speech:
      'Cậu cứ tưởng tượng đi từ Hà Nội đến Đà Nẵng rồi từ Đà Nẵng vào Sài Gòn, tổng quãng đường chính là từ Hà Nội vào Sài Gòn luôn!',
    assessor: {
      matchedSummary: 'Đạt 3/3 ý cần có',
      matchedPoints: ['Hiểu bản chất nối tiếp', 'Áp dụng vào hình hộp', 'Rút gọn chính xác'],
      missingPoints: [],
      verdictLabel: 'Thấu hiểu nguyên lý',
      bloomBefore: 'Bậc 1 Nhớ',
      bloomAfter: 'Bậc 2 Hiểu',
      bloomLevel: 2,
      hesitationScore: 0.12,
      hesitationLabel: 'thấp'
    }
  },
  {
    turnId: 'turn-03',
    turnNumber: 3,
    timestamp: 1729000002000,
    timestampStr: '37:10',
    agent: 'Bo',
    dispatcher: {
      intent: 'Bộc lộ bẫy trực giác tách độ dài',
      selectedAgent: 'Bo',
      confidence: 0.88,
      reason: 'Bo đưa ra dự đoán ban đầu dựa trên trực giác số học 1 + 1 = 2.'
    },
    contextView: {
      boardSnippet: '|BC + DD\'|',
      teacherSpeech: 'Đã chép lời',
      ragKnowledge: 'Không dùng',
      hiddenItem: 'Lời giải chuẩn của bài',
      visibleContext: [
        'Bảng phấn 37:10: |BC + DD\'| trong hình lập phương cạnh 1',
        'Lời thầy: Câu hỏi dừng tương tác 37:13',
        'Tri thức tra cứu: Không dùng'
      ],
      hiddenContext: ['Lời giải chuẩn của bài (Ẩn với Bo)']
    },
    thought:
      'BC = 1, DD\' = 1 thì tổng phải là 2 chứ. Cứ cộng thẳng hai số độ dài là xong mà.',
    speech:
      'Tớ nghĩ độ dài |BC + DD\'| bằng 1 + 1 = 2 chứ, vì cạnh hình lập phương đều bằng 1 mà!',
    assessor: {
      matchedSummary: 'Đạt 1/3 ý cần có',
      matchedPoints: ['Nhận biết độ dài mỗi cạnh'],
      missingPoints: ['Chưa xét hướng của hai vectơ', 'Nhầm lẫn độ dài tổng với tổng độ dài'],
      verdictLabel: 'Mắc bẫy trực giác',
      bloomBefore: 'Bậc 2 Hiểu',
      bloomAfter: 'Bậc 3 Vận dụng',
      bloomLevel: 3,
      hesitationScore: 0.45,
      hesitationLabel: 'trung bình'
    }
  },
  {
    turnId: 'turn-04',
    turnNumber: 4,
    timestamp: 1729000003000,
    timestampStr: '37:13',
    agent: 'Bo',
    dispatcher: {
      intent: 'Phản biện sắc bén',
      selectedAgent: 'Bo',
      confidence: 0.91,
      reason: 'Học sinh chỉ ra DD\' = CC\', tức là vectơ đang bị cộng sai hướng.'
    },
    contextView: {
      boardSnippet: '| BC + DD\' |',
      teacherSpeech: 'Đã chép lời',
      ragKnowledge: 'SGK Toán 12 · Bất đẳng thức tam giác',
      hiddenItem: 'Lời giải chuẩn của bài',
      visibleContext: [
        'Bảng phấn 37:13: | BC + DD\' |',
        'Lời thầy, 30 giây gần nhất: Đã chép lời',
        'Tri thức tra cứu: SGK Toán 12 (Tr. 24)'
      ],
      hiddenContext: ['Lời giải chuẩn của bài (Ẩn với Bo)']
    },
    thought:
      'Ờ ha… dời DD\' về C thì thành BC\'. Mình cộng độ dài chứ không cộng hướng. Chịu thua.',
    speech:
      'Ờ ha… tớ cộng nhầm hướng rồi. Chịu thua, cậu đúng.',
    assessor: {
      matchedSummary: 'Đạt 3/3 ý cần có',
      matchedPoints: [
        'Chỉ ra giả định sai',
        'Dùng bằng chứng trên bảng',
        'Khắc phục ngộ nhận độ dài'
      ],
      missingPoints: [],
      verdictLabel: 'Phản biện sắc bén',
      bloomBefore: 'Bậc 3 Vận dụng',
      bloomAfter: 'Bậc 4 Phân tích',
      bloomLevel: 4,
      hesitationScore: 0.15,
      hesitationLabel: 'thấp'
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
    phase: 'roundtable',
    content: 'Phát hiện bẫy trực giác của Bo (1 + 1 = 2). Chuẩn bị lời thoại phản biện chỉ ra phép thế DD\' = CC\' để nối tiếp BC + CC\' = BC\'.'
  },
  {
    id: 'evt-008',
    timestamp: 1729000005000,
    agent: 'CoLam',
    eventType: 'thinking',
    phase: 'bloom',
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
      skillSub: 'Khởi động & Nhận diện',
      evidence: 'Nắm vững định nghĩa vectơ, giá vectơ và quy ước độ dài trong không gian.',
      status: 'Làm chủ'
    },
    {
      step: 'Bậc 2',
      skill: 'Hiểu',
      skillSub: 'Quy tắc 3 điểm',
      evidence: 'Phân biệt rõ ràng giữa hai vectơ cùng hướng và ngược hướng khi xác định dấu hệ số tỉ lệ.',
      status: 'Làm chủ'
    },
    {
      step: 'Bậc 3',
      skill: 'Vận dụng',
      skillSub: 'Quy tắc hình hộp',
      evidence: 'Áp dụng chính xác quy tắc 3 điểm, hình bình hành và hình hộp để tính toán tổng vectơ.',
      status: 'Đạt'
    },
    {
      step: 'Bậc 4',
      skill: 'Phân tích',
      skillSub: 'Bắt lỗi ở Trạm 2',
      evidence: 'Phát hiện và chỉ ra chính xác lỗi sai đảo điểm ở quy tắc hiệu chung gốc (OA - OB = BA) trong bài giải của Bo.',
      status: 'Đạt'
    },
    {
      step: 'Bậc 5',
      skill: 'Đánh giá',
      skillSub: 'Phản biện mốc 37:13',
      evidence: 'Bẻ gãy bẫy trực giác tách độ dài tổng |a + b| = |a| + |b| tại mốc video 37:13 và bảo vệ lập luận trước Bo.',
      status: 'Đạt'
    },
    {
      step: 'Bậc 6',
      skill: 'Sáng tạo',
      skillSub: 'Tự ra đề Trạm 4',
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
