import { DRELessonSchema as LegacyLessonSchema, TimelineComment } from '../types/lesson';
import { VideoLessonItem as ClassroomVideoLessonItem, TimelineComment as ClassroomComment } from '../types/dre';
import { sanitizeFixtureData } from './sanitizeKatex';
import { VIDEO_LESSON_LIBRARY } from '../data/videoLessons';

export interface AdaptedLessonResult {
  videoLesson: ClassroomVideoLessonItem;
  timelineComments: TimelineComment[];
}

// ============================================================================
// HỆ QUY CHIẾU THỜI GIAN CHUẨN DUY NHẤT (CANONICAL SINGLE TIMEBASE IN SECONDS)
// TUYỆT ĐỐI KHÔNG CỘNG DỒN PART OFFSET VÀO MỐC THỜI GIAN ĐÃ LÀ ABSOLUTE FIXTURE
// ============================================================================
export const CANONICAL_MAX_DURATION_S = 5880; // 1h38m00s (Chuẩn thời lượng bài giảng Thầy Tiến)
export const CANONICAL_CHECKPOINT_S = 2233;   // 37:13 (Đúng mốc dừng Ví dụ 3 Thầy Tiến)

/** Sentinel checkpointTimestamp for a lesson whose teacher disabled/deleted every pause question. */
export const NO_CHECKPOINT_S = -1;

/**
 * True when the lesson has an active checkpoint. Consumers must check this
 * before comparing playback time with checkpointTimestamp, otherwise the
 * NO_CHECKPOINT_S sentinel would trigger the checkpoint at second 0.
 */
export function hasCheckpoint(lesson: { checkpointTimestamp: number } | null | undefined): boolean {
  return !!lesson && Number.isFinite(lesson.checkpointTimestamp) && lesson.checkpointTimestamp >= 0;
}

/**
 * Chuyển đổi DRELessonSchema (từ Editor hoặc Pipeline Fixture) sang VideoLessonItem của Classroom Player.
 * Đảm bảo:
 * 1. Single source of truth cho timestamp (tính bằng seconds), giữ đúng mốc 37:13 (2233s), không vượt quá 5880s.
 * 2. Giữ nguyên toàn vẹn nội dung của các bài toán phương trình (VID_001), bất đẳng thức (VID_003),
 *    tuyệt đối không ghi đè thành câu hỏi vector cố định nếu đề bài là phương trình hoặc bất đẳng thức.
 */
export function adaptLessonToPlayer(rawLesson: any): ClassroomVideoLessonItem {
  const lesson = sanitizeFixtureData(rawLesson);
  const lessonId = lesson.lesson_id || lesson.id || 'lesson_vecto_12';

  // Đối chiếu với thư viện bài học chuẩn để bảo tồn dữ liệu chuyên biệt nếu có
  const matchedLib = VIDEO_LESSON_LIBRARY.find((l) => l.id === lessonId || l.id === lesson.id);

  // Tổng thời lượng: giới hạn không vượt quá CANONICAL_MAX_DURATION_S (5880s)
  const totalDuration = Math.min(
    lesson.video_duration_s || (matchedLib ? matchedLib.duration : CANONICAL_MAX_DURATION_S),
    CANONICAL_MAX_DURATION_S
  );

  // Mốc checkpoint chuẩn: Ưu tiên mốc của lesson, sau đó đến matchedLib, mặc định 2233s (37:13)
  const targetCheckpointTime = Math.min(
    typeof lesson.checkpointTimestamp === 'number'
      ? lesson.checkpointTimestamp
      : matchedLib
      ? matchedLib.checkpointTimestamp
      : CANONICAL_CHECKPOINT_S,
    totalDuration
  );

  // Thu thập tất cả câu hỏi dừng và lời thoại từ các phân đoạn
  const allQuestions: any[] = [];
  let detectedBoDialogue = '';

  (lesson.parts || []).forEach((part: any) => {
    (part.pause_questions || []).forEach((q: any) => {
      if (q.is_active !== false) {
        allQuestions.push(q);
      }
    });

    (part.scenarios || []).forEach((s: any) => {
      if (s.is_active !== false && (s.actor_id === 'bo' || s.agent === 'Bo') && (s.bo_fallacy_statement || s.dialogue)) {
        if (!detectedBoDialogue) {
          detectedBoDialogue = s.bo_fallacy_statement || s.dialogue;
        }
      }
    });
  });

  // Tìm câu hỏi dừng khớp nhất với mốc checkpoint mong đợi (trong phạm vi 15 giây hoặc câu hỏi bậc cao)
  const matchedQuestion = allQuestions.find((q) => {
    const qt = typeof q.at_s === 'number' ? q.at_s : q.timestamp;
    return typeof qt === 'number' && Math.abs(qt - targetCheckpointTime) <= 15;
  }) || allQuestions.find((q) => {
    const lvl = (q.bloom_level || '').toLowerCase();
    return lvl.includes('đánh giá') || lvl.includes('evaluate') || lvl.includes('phân tích') || lvl.includes('analyze');
  }) || allQuestions[0];

  const hasActiveQuestions = allQuestions.length > 0;
  const detectedCheckpointTimestamp = hasActiveQuestions && matchedQuestion
    ? Math.min(
        typeof matchedQuestion.at_s === 'number' ? matchedQuestion.at_s : matchedQuestion.timestamp,
        totalDuration
      )
    : NO_CHECKPOINT_S;

  // Xây dựng danh sách phương án lựa chọn (Options)
  let mappedOptions = !hasActiveQuestions
    ? []
    : matchedQuestion?.options && Array.isArray(matchedQuestion.options)
    ? matchedQuestion.options.map((opt: any, oIdx: number) => ({
        id: opt.option_id || opt.id || `opt_${oIdx}`,
        label: opt.text || opt.label || '',
        isStandardBest: opt.is_correct ?? opt.isStandardBest ?? (oIdx === 0),
        feedback: opt.explanation || opt.feedback || '',
      }))
    : matchedLib
    ? matchedLib.checkpointQuestion.options
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

  // Nội dung câu hỏi dừng: Không ghi đè câu hỏi phương trình/bất đẳng thức thành vector, tôn trọng trạng thái tắt của giáo viên
  const checkpointPrompt = !hasActiveQuestions
    ? ''
    : matchedQuestion?.question ||
      matchedQuestion?.prompt ||
      (matchedLib ? matchedLib.checkpointQuestion.prompt : "Cho hình lập phương ABCD.A'B'C'D' có cạnh bằng 1. Độ dài của tổng hai vectơ |BC + DD'| bằng bao nhiêu và tính thế nào?");

  // Lời thoại bẫy của Bo
  const boSpeech = detectedBoDialogue ||
    (matchedLib ? matchedLib.boArgument.speech : "Ủa sao cậu phải đổi DD' thành CC' chi cho cực vậy?! Tớ thấy |BC + DD'| thì cứ tách ra thành |BC| + |DD'| = 1 + 1 = 2 luôn chứ sao lại ra √2?!");

  // Nhãn dán phản biện (Rebuttal Stickers)
  const rebuttalStickers = matchedLib
    ? matchedLib.rebuttalStickers
    : [
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
      ];

  // Bo nhận thua (Concession)
  const boConcession = matchedLib
    ? matchedLib.boConcession
    : {
        speech: "Ối giời ơi đúng ha! Đi ngang 1 bước rồi đi thẳng lên 1 bước thì khoảng cách chéo phải là √2! Tớ chừa tật tách bừa |a + b| = |a| + |b| rồi!",
      };

  // Lời chốt sư phạm của Cô Lam (Teacher Closure)
  const teacherClosure = matchedLib
    ? matchedLib.teacherClosure
    : {
        goldenRule: "Quy tắc vàng [37:13]: Tuyệt đối không tách |a + b| = |a| + |b|. Luôn thu gọn biểu thức bên trong thành 1 vectơ duy nhất trước khi tính độ dài!",
      };

  return {
    id: lessonId,
    title: lesson.title || (matchedLib ? matchedLib.title : 'Bài 1.1: Vectơ Trong Không Gian'),
    duration: totalDuration,
    checkpointTimestamp: detectedCheckpointTimestamp,
    lectureEndSecond: totalDuration,
    videoUrl: lesson.video_url || (matchedLib ? matchedLib.videoUrl : 'https://www.youtube.com/watch?v=phvpqxLNTUQ'),
    youtubeId: matchedLib?.youtubeId || 'phvpqxLNTUQ',
    checkpointQuestion: {
      prompt: checkpointPrompt,
      options: mappedOptions,
    },
    boArgument: {
      speech: boSpeech,
    },
    rebuttalStickers,
    boConcession,
    teacherClosure,
    peerContext: matchedLib?.peerContext,
    transcriptCues: matchedLib?.transcriptCues,
    chapters: matchedLib?.chapters,
    freezeNote: matchedLib?.freezeNote || "Thầy Tiến chuẩn bị giải Ví dụ 3 câu a trên bảng. Hãy cùng Bo thảo luận cách tính độ dài tổng hai vectơ!",
    timelineComments: classroomCommentsFor(lesson, matchedLib),
  };
}

const roleFor = (author: string): ClassroomComment['role'] =>
  /Lam/.test(author) ? 'teacher' : /Trợ giảng/.test(author) ? 'ta' : 'classmate';

/**
 * Class chat for an approved lesson: the ambient comments recorded for the lecture that is
 * actually played (matched by lesson id, else by the YouTube video the player falls back to),
 * plus the lesson's own active agent scenarios. Pause questions are not chat messages.
 */
export function classroomCommentsFor(lesson: any, matchedLib?: ClassroomVideoLessonItem): ClassroomComment[] {
  const playedYoutubeId = matchedLib?.youtubeId || 'phvpqxLNTUQ';
  const ambientLib = matchedLib || VIDEO_LESSON_LIBRARY.find((l) => l.youtubeId === playedYoutubeId);
  const comments: ClassroomComment[] = [...(ambientLib?.timelineComments || [])];
  const seen = new Set(comments.map((c) => c.id));

  for (const part of lesson?.parts || []) {
    for (const sc of part.scenarios || []) {
      const active = sc.is_active ?? sc.enabled !== false;
      const text = typeof (sc.dialogue || sc.question) === 'string' ? (sc.dialogue || sc.question).trim() : '';
      const id = sc.id || sc.scenario_id;
      const second = typeof sc.at_s === 'number' ? sc.at_s : typeof sc.timestamp === 'number' ? sc.timestamp : null;
      if (!active || !text || !id || second === null || seen.has(id)) continue;
      const author =
        sc.agent ||
        ({ colam: 'Cô Lam', bo: 'Bo', tri: 'Trí', linhchi: 'Linh Chi', minhkhang: 'Minh Khang' } as Record<string, string>)[sc.actor_id] ||
        'Trợ giảng An';
      seen.add(id);
      comments.push({ id, second: Math.max(0, second), author, role: roleFor(author), text });
    }
  }
  return comments.sort((a, b) => a.second - b.second);
}

/**
 * Chuyển đổi các câu hỏi dừng và kịch bản trong lesson thành danh sách bình luận trên timeline.
 * SỬA LỖI P1/P2 REVIEW:
 * Single Source of Truth tính bằng seconds.
 * TUYỆT ĐỐI KHÔNG cộng dồn part offset vào mốc thời gian đã là absolute fixture.
 * Giữ đúng mốc 37:13 (2233s) và giới hạn trong CANONICAL_MAX_DURATION_S (5880s).
 */
export function adaptLessonToTimelineComments(rawLesson: any): TimelineComment[] {
  const lesson = sanitizeFixtureData(rawLesson);
  const lessonId = lesson.lesson_id || lesson.id || 'lesson_vecto_12';
  const matchedLib = VIDEO_LESSON_LIBRARY.find((l) => l.id === lessonId || l.id === lesson.id);

  const comments: TimelineComment[] = [];
  const maxDuration = Math.min(lesson.video_duration_s || CANONICAL_MAX_DURATION_S, CANONICAL_MAX_DURATION_S);

  // Gộp đầy đủ các ambient comments (43 bình luận nền) từ VIDEO_LESSON_LIBRARY (matchedLib)
  if (matchedLib && Array.isArray(matchedLib.timelineComments)) {
    matchedLib.timelineComments.forEach((c: any) => {
      comments.push({
        id: c.id,
        partId: c.partId || 'part-01',
        timestamp: typeof c.second === 'number' ? c.second : (c.timestamp || 0),
        author: c.author || 'Bạn học',
        content: c.text || c.content || '',
        type: 'passive',
        isActive: true,
        metadata: {
          role: c.role,
          isPinned: c.isPinned,
          toolCall: c.toolCall,
          toolCalls: c.toolCalls,
        },
      });
    });
  }

  const existingIds = new Set(comments.map((c) => c.id));

  (lesson.parts || []).forEach((part: any) => {
    if (part.pause_questions && Array.isArray(part.pause_questions)) {
      part.pause_questions.forEach((q: any) => {
        const rawTime = typeof q.at_s === 'number' ? q.at_s : typeof q.timestamp === 'number' ? q.timestamp : 0;
        // Sử dụng timestamp tuyệt đối chuẩn (không cộng dồn partStart)
        const resolvedTimestamp = Math.min(Math.max(0, rawTime), maxDuration);

        const qId = q.id || q.question_id;
        const qObj: TimelineComment = {
          id: qId,
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
        };
        if (existingIds.has(qId)) {
          const idx = comments.findIndex((c) => c.id === qId);
          if (idx >= 0) comments[idx] = qObj;
        } else {
          existingIds.add(qId);
          comments.push(qObj);
        }
      });
    }

    if (part.scenarios && Array.isArray(part.scenarios)) {
      part.scenarios.forEach((s: any) => {
        const rawTime = typeof s.at_s === 'number' ? s.at_s : typeof s.timestamp === 'number' ? s.timestamp : 0;
        const resolvedTimestamp = Math.min(Math.max(0, rawTime), maxDuration);

        const sId = s.id || s.scenario_id;
        const sObj: TimelineComment = {
          id: sId,
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
        };
        if (existingIds.has(sId)) {
          const idx = comments.findIndex((c) => c.id === sId);
          if (idx >= 0) comments[idx] = sObj;
        } else {
          existingIds.add(sId);
          comments.push(sObj);
        }
      });
    }
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
