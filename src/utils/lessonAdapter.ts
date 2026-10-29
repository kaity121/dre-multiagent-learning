import { DRELessonSchema as LegacyLessonSchema, TimelineComment } from '../types/lesson';
import { VideoLessonItem as ClassroomVideoLessonItem } from '../types/dre';
import { sanitizeFixtureData } from './sanitizeKatex';

export interface AdaptedLessonResult {
  videoLesson: ClassroomVideoLessonItem;
  timelineComments: TimelineComment[];
}

/**
 * Chuyển đổi DRELessonSchema (từ Editor hoặc Pipeline Fixture) sang VideoLessonItem của Classroom Player.
 * Đảm bảo đồng bộ 100% dữ liệu đã duyệt (Approved) về Classroom mà không bị ngắt kết nối.
 */
export function adaptLessonToPlayer(rawLesson: any): ClassroomVideoLessonItem {
  const lesson = sanitizeFixtureData(rawLesson);
  let cumulativeTime = 0;
  let detectedCheckpointTimestamp = 2233; // Default 37:13
  let detectedQuestion: any = null;
  let detectedBoDialogue = '';

  const parts = (lesson.parts || []).map((part: any, pIdx: number) => {
    const startTime = typeof part.start_s === 'number' ? part.start_s : cumulativeTime;
    const duration = part.duration || (typeof part.end_s === 'number' ? part.end_s - startTime : 0);
    const endTime = startTime + duration;
    cumulativeTime = endTime;

    // Tìm câu hỏi dừng được đánh dấu active trong part
    if (part.pause_questions && Array.isArray(part.pause_questions)) {
      part.pause_questions.forEach((q: any) => {
        if (q.is_active !== false && !detectedQuestion) {
          detectedQuestion = q;
          const rawQTime = typeof q.at_s === 'number' ? q.at_s : q.timestamp;
          if (typeof rawQTime === 'number') {
            detectedCheckpointTimestamp = rawQTime >= startTime ? rawQTime : startTime + rawQTime;
          }
        }
      });
    }

    if (part.scenarios && Array.isArray(part.scenarios)) {
      part.scenarios.forEach((s: any) => {
        if ((s.actor_id === 'bo' || s.agent === 'Bo') && (s.bo_fallacy_statement || s.dialogue)) {
          detectedBoDialogue = s.bo_fallacy_statement || s.dialogue;
        }
      });
    }

    return {
      id: part.id || part.part_id || `part-${pIdx + 1}`,
      title: part.title || part.concept || `Phần ${pIdx + 1}`,
      startTime,
      endTime,
      url: part.video_url || lesson.video_url || '',
    };
  });

  const totalDuration = lesson.video_duration_s || cumulativeTime || 9503;

  // Xây dựng options chuẩn từ detectedQuestion
  const mappedOptions = detectedQuestion?.options && Array.isArray(detectedQuestion.options)
    ? detectedQuestion.options.map((opt: any, oIdx: number) => ({
        id: opt.option_id || opt.id || `opt_${oIdx}`,
        label: opt.text || opt.label || '',
        isStandardBest: opt.is_correct ?? opt.isStandardBest ?? (oIdx === 0),
        feedback: opt.explanation || opt.feedback || '',
      }))
    : [
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
          feedback: "Tuyệt đối không được tách độ dài của tổng thành tổng hai độ dài.",
        },
        {
          id: 'opt_c',
          label: "Dùng công thức đường chéo hình lập phương: Bằng √3",
          isStandardBest: false,
          feedback: "Chưa đúng! Khi nào cộng đủ 3 kích thước mới ra đường chéo chính √3.",
        },
      ];

  return {
    id: lesson.lesson_id || 'lesson_vecto_12',
    title: lesson.title || 'Bài 1.1: Vectơ Trong Không Gian',
    duration: totalDuration,
    checkpointTimestamp: detectedCheckpointTimestamp,
    lectureEndSecond: totalDuration,
    videoUrl: lesson.video_url || 'https://www.youtube.com/watch?v=phvpqxLNTUQ',
    checkpointQuestion: {
      prompt: detectedQuestion?.question || detectedQuestion?.prompt || "Cho hình lập phương ABCD.A'B'C'D' có cạnh bằng 1. Độ dài của tổng hai vectơ |BC + DD'| bằng bao nhiêu và tính thế nào?",
      options: mappedOptions,
    },
    boArgument: {
      speech: detectedBoDialogue || "Ủa sao cậu phải đổi DD' thành CC' chi cho cực vậy?! Tớ thấy |BC + DD'| thì cứ tách ra thành |BC| + |DD'| = 1 + 1 = 2 luôn chứ sao lại ra √2?!",
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
        feedback: "Ví dụ thực tế quá chuẩn! Hai vectơ vuông góc nhau nên phải dùng định lý Pytago.",
      },
      {
        id: 'stk_3',
        text: "Tại vì bài hình học không gian nào của thầy Tiến cũng phải có căn bậc hai trong đáp án.",
        isEffective: false,
        feedback: "Bo chưa chịu đâu! Hãy dùng quy tắc nối tiếp vectơ để giải thích cho Bo nhé!",
      },
    ],
    boConcession: {
      speech: "Ối giời ơi đúng ha! Đi ngang 1 bước rồi đi thẳng lên 1 bước thì khoảng cách chéo phải là √2! Tớ chừa tật tách bừa |a + b| = |a| + |b| rồi!",
    },
    teacherClosure: {
      goldenRule: "Quy tắc vàng [37:13]: Tuyệt đối không tách |a + b| = |a| + |b|. Luôn thu gọn biểu thức bên trong thành 1 vectơ duy nhất trước khi tính độ dài!",
    },
    freezeNote: "Thầy Tiến chuẩn bị giải Ví dụ 3 câu a trên bảng. Hãy cùng Bo thảo luận cách tính độ dài tổng hai vectơ!",
  };
}

/**
 * Chuyển đổi các câu hỏi dừng và kịch bản trong lesson thành danh sách bình luận trên timeline.
 * SỬA LỖI P2: Thiết lập một hệ quy chiếu thời gian tuyệt đối (Single Timebase).
 * Nếu timestamp/at_s trong fixture đã là mốc giây tuyệt đối (>= start_s hoặc >= 100),
 * TUYỆT ĐỐI KHÔNG cộng dồn partOffset làm trôi 37:13 thành 58:13!
 */
export function adaptLessonToTimelineComments(rawLesson: any): TimelineComment[] {
  const lesson = sanitizeFixtureData(rawLesson);
  const comments: TimelineComment[] = [];
  let cumulativeTime = 0;

  (lesson.parts || []).forEach((part: any) => {
    const partStart = typeof part.start_s === 'number' ? part.start_s : cumulativeTime;
    const duration = part.duration || (typeof part.end_s === 'number' ? part.end_s - partStart : 0);

    if (part.pause_questions && Array.isArray(part.pause_questions)) {
      part.pause_questions.forEach((q: any) => {
        const rawTime = typeof q.at_s === 'number' ? q.at_s : typeof q.timestamp === 'number' ? q.timestamp : 0;
        // Kiểm tra xem thời gian đã là mốc tuyệt đối chưa (nếu >= partStart hoặc lớn hơn duration của part)
        const isAlreadyAbsolute = (typeof part.start_s === 'number' && rawTime >= part.start_s) || rawTime > (duration || 300);
        const resolvedTimestamp = isAlreadyAbsolute ? rawTime : partStart + rawTime;

        comments.push({
          id: q.id || q.question_id,
          partId: part.id || part.part_id,
          timestamp: resolvedTimestamp,
          author: 'Trợ giảng AI',
          content: q.question,
          bloomLevel: q.bloom_level,
          type: 'question',
          isActive: q.is_active ?? true,
          metadata: {
            expected_answers: q.expected_answers || (q.options ? q.options.filter((o: any) => o.is_correct).map((o: any) => o.text) : []),
            originalType: q.type || q.question_type,
            localTimestamp: rawTime,
          },
        });
      });
    }

    if (part.scenarios && Array.isArray(part.scenarios)) {
      part.scenarios.forEach((s: any) => {
        const rawTime = typeof s.at_s === 'number' ? s.at_s : typeof s.timestamp === 'number' ? s.timestamp : 0;
        const isAlreadyAbsolute = (typeof part.start_s === 'number' && rawTime >= part.start_s) || rawTime > (duration || 300);
        const resolvedTimestamp = isAlreadyAbsolute ? rawTime : partStart + rawTime;

        comments.push({
          id: s.id || s.scenario_id,
          partId: part.id || part.part_id,
          timestamp: resolvedTimestamp,
          author: s.agent || (s.actor_id === 'colam' ? 'Cô Lam' : s.actor_id === 'bo' ? 'Bo' : s.actor_id === 'tri' ? 'Trí' : s.actor_id === 'linhchi' ? 'Linh Chi' : s.actor_id === 'minhkhang' ? 'Minh Khang' : 'Trợ giảng An'),
          content: s.dialogue || s.question || '',
          bloomLevel: s.bloom_level,
          type: 'scenario',
          isActive: s.is_active ?? (s.enabled !== false),
          metadata: {
            trigger_condition: s.trigger_condition || s.interaction_type,
            originalType: s.type || s.interaction_type,
            localTimestamp: rawTime,
          },
        });
      });
    }

    cumulativeTime = partStart + duration;
  });

  return comments.sort((a, b) => a.timestamp - b.timestamp);
}

export function adaptLesson(rawLesson: any): AdaptedLessonResult {
  return {
    videoLesson: adaptLessonToPlayer(rawLesson),
    timelineComments: adaptLessonToTimelineComments(rawLesson),
  };
}

export function exportApprovedLessonJSON(lesson: any): string {
  const payload = {
    ...lesson,
    status: 'approved',
    metadata: {
      ...lesson.metadata,
      approvedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
  return JSON.stringify(payload, null, 2);
}
