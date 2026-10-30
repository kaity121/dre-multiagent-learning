import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBoardStateAt, getLessonIndex } from './lessonIndex.js';
import { search as searchKb, getById as getKbById } from './knowledgeBase.js';
import { getSession } from '../sessionStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');

/**
 * ============================================================================
 * AISDLC EPIC 4 - Issue #402: Context Isolation Snapshot (Board Grounding)
 * Owner: An (@presentisperfect) | Reviewer: Blu (@blu1606)
 * ============================================================================
 * Đóng gói "Ảnh chụp ngữ cảnh" (Context Snapshot) tức thời tại giây T:
 * 1. Bảng phấn hiện tại (LaTeX + Hình học không gian 3D + Lời thầy ~30s gần nhất)
 * 2. Part / Goal / Chương mục từ lesson.json / videoLessons.ts
 * 3. Lịch sử chat được cắt gọn trong ngân sách token (< 1200 tokens)
 * 4. RAG snippets liên quan
 * 5. Policy cô lập theo Agent (Bo tuyệt đối KHÔNG thấy lời giải chuẩn / rebuttalAnchor)
 * 6. Citations trích dẫn có mốc giây bấm được và nhãn nguồn (video / slide / SGK / bảng phấn)
 */

export const TOKEN_BUDGET_LIMIT = 1200;

export const DEFAULT_MATH_VIDEO_ID = 'VID_VECTO_12_TIEN';

/**
 * Xác định bài giảng đang học và có phải môn Toán (bài Vectơ có Knowledge Base) hay không.
 * videoId tường minh luôn được ưu tiên hơn lessonTitle (lessonTitle thường mang giá trị mặc định
 * "Toán 12" từ client cũ), và môn học được đọc từ lesson index khi bài đã được index.
 */
export function resolveLessonSubject({ videoId = null, lessonTitle = '' } = {}) {
  const normTitle = String(lessonTitle || '').toLowerCase();
  const explicitVideoId = typeof videoId === 'string' && videoId.trim() ? videoId.trim() : null;
  const effectiveVideoId =
    explicitVideoId ||
    (normTitle.includes('trí tuệ nhân tạo') || normTitle.includes('machine learning')
      ? 'VID_AI_INTRO_01'
      : DEFAULT_MATH_VIDEO_ID);

  const indexed = getLessonIndex(effectiveVideoId);
  let isMathLesson;
  if (effectiveVideoId.includes('VECTO')) {
    isMathLesson = true;
  } else if (indexed) {
    isMathLesson = `${indexed.subject || ''} ${indexed.videoTitle || ''}`.toLowerCase().includes('toán');
  } else {
    isMathLesson = normTitle.includes('toán');
  }
  return { videoId: effectiveVideoId, isMathLesson };
}

/**
 * BẢNG POLICY CÔ LẬP THEO TỪNG AGENT (Context Isolation Policy Matrix)
 */
export const AGENT_ISOLATION_POLICIES = {
  bo: {
    role: 'bo',
    personaName: 'Bo',
    speechStyle: 'Bạn học Hệ 1, trực giác, thích làm tắt, lém lỉnh, hay đặt bẫy ngộ nhận để học sinh tự phản biện',
    systemPrompt: 'Bạn là Bo, một bạn học năng động nhưng hay mắc ngộ nhận trực giác và thích làm tắt. Tuyệt đối không được tiết lộ hay biết trước lời giải chuẩn; hãy giữ vững quan điểm ngộ nhận cho đến khi học sinh đưa ra chứng minh toán học sắc bén.',
    allowedFields: [
      'persona',
      'temporalContext.second',
      'temporalContext.blackboardText',
      'temporalContext.blackboardLatex',
      'temporalContext.spatialGeometry',
      'temporalContext.teacherSpeechNow',
      'temporalContext.activeChapter',
      'dialogueHistory',
      'learnerCognitiveState.hesitationLevel',
      'misconception.id',
      'misconception.title',
      'misconception.boTrapPattern',
      'misconception.boInitialChallenge',
      'misconception.incorrect_claim',
    ],
    redactedFields: [
      'misconception.rebuttalAnchor',
      'misconception.giaiThichChuan',
      'misconception.correction',
      'misconception.standardFormula',
      'misconception.scaffoldingNudges',
      'part.expected_points',
      'part.solutionSteps',
      'vectorAlgebraVerification.correctAnswer',
      'standardProof',
    ],
    canSeeStandardSolution: false,
    canSeeScaffoldingHints: false,
  },
  tri: {
    role: 'tri',
    personaName: 'Trí',
    speechStyle: 'Bạn học Hệ 2, tư duy logic, đào sâu bản chất toán học, đối chiếu điều kiện biên và tọa độ 3D',
    systemPrompt: 'Bạn là Trí, bạn học chuyên phân tích bản chất logic và kiểm chứng toán học. Bạn nắm vững định lý, bất đẳng thức tam giác và kiểm chứng hình học 3D.',
    allowedFields: [
      'persona',
      'temporalContext',
      'dialogueHistory',
      'ragContextSnippets',
      'misconception.id',
      'misconception.title',
      'misconception.standardFormula',
      'misconception.theoremSummary',
      'misconception.correction',
      'misconception.edgeConditions',
      'vectorAlgebraVerification',
      'learnerCognitiveState.currentBloomLevel',
    ],
    redactedFields: [
      'misconception.scaffoldingNudges',
      'misconception.boTrapPacing',
    ],
    canSeeStandardSolution: true,
    canSeeScaffoldingHints: false,
  },
  an: {
    role: 'an',
    personaName: 'Trợ giảng An',
    speechStyle: 'Trợ giảng Socratic kiên nhẫn, gợi ý gián tiếp theo bậc thang (Nudges, not answers), khích lệ người học bế tắc',
    systemPrompt: 'Bạn là Trợ giảng An, chuyên cung cấp gợi ý gián tiếp từng bước (scaffolding) để người học tự tìm ra đáp án mà không giải hộ.',
    allowedFields: [
      'persona',
      'temporalContext',
      'dialogueHistory',
      'ragContextSnippets',
      'misconception.id',
      'misconception.title',
      'misconception.scaffoldingNudges',
      'learnerCognitiveState',
    ],
    redactedFields: [
      'misconception.directFinalAnswer',
    ],
    canSeeStandardSolution: false, // Không đưa đáp án trực tiếp khi đang gợi ý
    canSeeScaffoldingHints: true,
  },
  linhchi: {
    role: 'linhchi',
    personaName: 'Linh Chi',
    speechStyle: 'Sổ tay công thức, ngăn nắp, tổng hợp khẩu quyết, checklist kiểm tra từng bước',
    systemPrompt: 'Bạn là Linh Chi, chuyên mở sổ tay quy tắc, công thức toán học và các mẹo ghi nhớ cho cả lớp.',
    allowedFields: [
      'persona',
      'temporalContext',
      'dialogueHistory',
      'cheatSheet',
      'standardFormula',
      'mnemonics',
      'rules',
    ],
    redactedFields: [
      'misconception.boTrapPattern',
    ],
    canSeeStandardSolution: true,
    canSeeScaffoldingHints: false,
  },
  minhkhang: {
    role: 'minhkhang',
    personaName: 'Minh Khang',
    speechStyle: 'Trực quan đời sống, ví von sinh động, liên hệ Google Maps, máy bay, thể thao để kết nối toán học với thực tiễn',
    systemPrompt: 'Bạn là Minh Khang, chuyên đưa ra các liên hệ thực tiễn và ví von đời sống gần gũi.',
    allowedFields: [
      'persona',
      'temporalContext',
      'dialogueHistory',
      'realLifeAnalogies',
      'topicOverview',
    ],
    redactedFields: [
      'misconception.rebuttalAnchor',
      'formalProofs',
    ],
    canSeeStandardSolution: false,
    canSeeScaffoldingHints: false,
  },
  colam: {
    role: 'colam',
    personaName: 'Cô Lam',
    speechStyle: 'Giáo viên chủ trì, giọng chuẩn mực, ấm áp, chốt kiến thức cốt lõi, thẩm định năng lực Bloom',
    systemPrompt: 'Bạn là Cô Lam, giáo viên chủ nhiệm và người điều phối bài giảng. Bạn có cái nhìn toàn cảnh về mục tiêu sư phạm, thang đo Bloom và chuẩn kiến thức.',
    allowedFields: ['*'],
    redactedFields: [],
    canSeeStandardSolution: true,
    canSeeScaffoldingHints: true,
  },
  assessor: {
    role: 'assessor',
    personaName: 'Assessor (Chấm ngầm)',
    speechStyle: 'Đánh giá khách quan, thẩm định luận điểm theo thang đo Bloom và kiểm chứng logic',
    systemPrompt: 'Bạn là Assessor, làm việc ngầm để thẩm định chất lượng phản biện và xác định năng lực người học.',
    allowedFields: [
      'gradingRubric',
      'rebuttalCriteria',
      'standardSolution',
      'expectedPoints',
      'learnerAnswer',
      'learnerCognitiveState',
    ],
    redactedFields: [],
    canSeeStandardSolution: true,
    canSeeScaffoldingHints: true,
  },
};

/**
 * Đọc file JSON an toàn kèm fallback
 */
function safeReadJson(filePath, fallback = null) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.warn(`[ContextSnapshot] Cannot read ${filePath}:`, err.message);
  }
  return fallback;
}

/**
 * Ước tính số token của chuỗi văn bản hoặc đối tượng JSON
 * (Tiếng Việt có dấu trung bình ~2.8 ký tự / token)
 */
export function estimateTokens(value) {
  if (!value) return 0;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return Math.ceil(str.length / 2.8);
}

/**
 * Tải Mock Approved Lesson (mock/lesson.json)
 */
let cachedLessonPackage = null;
export function getApprovedLessonPackage() {
  if (cachedLessonPackage) return cachedLessonPackage;
  const lessonPath = path.join(ROOT_DIR, 'mock/lesson.json');
  cachedLessonPackage = safeReadJson(lessonPath, null);
  return cachedLessonPackage;
}

/**
 * Tải Mock Session State (mock/session_001.json)
 */
let cachedSessionMock = null;
export function getMockSessionState(sessionId = 'session_001') {
  if (sessionId && sessionId !== 'session_001') {
    // Phiên thật: lấy từ session store. Phiên chưa tồn tại nhận trạng thái trống riêng,
    // KHÔNG mượn bộ nhớ/Bloom/ngộ nhận của fixture session_001 (tránh rò ngữ cảnh giữa các phiên).
    try {
      return getSession(sessionId);
    } catch {
      return {
        session_id: sessionId,
        status: 'in_progress',
        activity_log: [],
        memory: { summary: '', misconceptions_triggered: [] },
        assessment: { goals: [] },
      };
    }
  }
  if (cachedSessionMock) return cachedSessionMock;
  const sessionPath = path.join(ROOT_DIR, 'mock/session_001.json');
  cachedSessionMock = safeReadJson(sessionPath, {
    session_id: 'session_001',
    status: 'in_progress',
    station_progress: 'station_1_warmup',
    activity_log: [],
    memory: { summary: 'Phiên học bắt đầu tại Trạm 1.' },
    assessment: { goals: [] },
  });
  return cachedSessionMock;
}

/**
 * Tìm Part sư phạm đang kích hoạt tại mốc giây T
 */
export function findActiveLessonPart(second) {
  const lesson = getApprovedLessonPackage();
  if (!lesson || !Array.isArray(lesson.parts)) {
    // Fallback nếu chưa nạp được lesson.json
    if (second >= 1813 && second <= 2300) {
      return {
        part_id: 'part_03_box_rule_example3',
        concept: 'Quy tắc hình hộp và bẫy cộng độ dài (Ví dụ 3)',
        context: 'Thầy Tiến hướng dẫn tính độ dài |BC + DD\'| trên hình lập phương cạnh 1.',
        goals: [{ goal_id: 'g03', description: 'Phản biện bẫy cộng độ dài trực tiếp', bloom_target: 'Evaluate' }],
        bo_fallacy_statement: '|BC + DD\'| = |BC| + |DD\'| = 2',
      };
    }
    return {
      part_id: 'part_01_definition',
      concept: 'Định nghĩa vectơ trong không gian',
      context: 'Mở rộng vectơ từ mặt phẳng lên không gian 3 chiều.',
      goals: [{ goal_id: 'g01', description: 'Nắm vững định nghĩa vectơ', bloom_target: 'Remember' }],
    };
  }

  const sec = Number(second) || 0;
  const part = lesson.parts.find((p) => sec >= p.start_s && sec <= p.end_s);
  return part || lesson.parts[lesson.parts.length - 1];
}

/**
 * Sinh danh sách Citations (mốc giây bấm được & nhãn nguồn)
 */
export function generateCitations({ second, blackboardState, activePart, misconception }) {
  const citations = [];
  const sec = Number(second) || 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const timeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  // 1. Citation Mốc Video
  if (sec >= 2100 && sec <= 2350) {
    citations.push({
      label: 'Video bài giảng Thầy Tiến (37:13 - Ví dụ 3)',
      timestamp: 2233,
      timeFormatted: '37:13',
      source: 'video',
      quote: "Ví dụ 3: Cho hình lập phương ABCD.A'B'C'D' cạnh bằng 1. Tính |BC + DD'|.",
    });
  } else if (blackboardState?.segment) {
    citations.push({
      label: `Video bài giảng Thầy Tiến (${blackboardState.segment.timeFormatted || timeFormatted})`,
      timestamp: blackboardState.segment.second || sec,
      timeFormatted: blackboardState.segment.timeFormatted || timeFormatted,
      source: 'video',
      quote: blackboardState.segment.audioTranscript || blackboardState.segment.blackboardText,
    });
  }

  // 2. Citation Bảng Phấn Hiện Tại (Blackboard Grounding)
  if (blackboardState?.segment?.blackboardLatex?.length > 0) {
    const mainLatex = blackboardState.segment.blackboardLatex[0];
    citations.push({
      label: `Bảng phấn ${blackboardState.segment.timeFormatted || timeFormatted}: ${mainLatex}`,
      timestamp: blackboardState.segment.second || sec,
      timeFormatted: blackboardState.segment.timeFormatted || timeFormatted,
      source: 'blackboard',
      quote: blackboardState.segment.blackboardText || mainLatex,
    });
  } else if (sec >= 2100 && sec <= 2350) {
    citations.push({
      label: "Bảng phấn 37:13: |\\vec{BC} + \\vec{DD'}|",
      timestamp: 2233,
      timeFormatted: '37:13',
      source: 'blackboard',
      quote: "|BC + DD'| = |BC + CC'| = |BC'| = √2",
    });
  }

  // 3. Citation SGK KNTT Toán 12
  if (sec >= 2100 && sec <= 2400 || misconception?.id === 'MISC_VEC_005') {
    citations.push({
      label: 'SGK Toán 12 KNTT (Tập 1, Bài 6, tr. 48)',
      timestamp: 1350,
      timeFormatted: '22:30',
      source: 'sgk',
      quote: 'Bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng.',
    });
  } else if (sec < 690) {
    citations.push({
      label: 'SGK Toán 12 KNTT (Tập 1, Bài 6, tr. 46)',
      timestamp: 78,
      timeFormatted: '01:18',
      source: 'sgk',
      quote: 'Vectơ trong không gian là một đoạn thẳng có hướng. AB ≠ BA vì ngược hướng.',
    });
  } else {
    citations.push({
      label: 'SGK Toán 12 KNTT (Tập 1, Bài 6, tr. 50)',
      timestamp: 3134,
      timeFormatted: '52:14',
      source: 'sgk',
      quote: 'Quy tắc hiệu: OA - OB = BA (Chung đầu - Lộn ngược).',
    });
  }

  return citations;
}

/**
 * Citations cho bài đã index nhưng chưa có SGK/Knowledge Base riêng: chỉ trích mốc video đang chiếu.
 */
export function generateSourceCitations({ second, blackboardState, stream }) {
  const seg = blackboardState?.segment;
  const quote = seg?.audioTranscript || seg?.blackboardText;
  if (!quote) return [];
  const segSecond = Number(seg.second) || Number(second) || 0;
  const timeFormatted = seg.timeFormatted
    || `${Math.floor(segSecond / 60).toString().padStart(2, '0')}:${Math.floor(segSecond % 60).toString().padStart(2, '0')}`;
  const teacher = stream?.teacherName ? `${stream.teacherName} ` : '';
  return [{
    label: `Video bài giảng ${teacher}(${timeFormatted})`,
    timestamp: segSecond,
    timeFormatted,
    source: 'video',
    quote,
  }];
}

/**
 * Xây dựng AgentRuntimeContext chuẩn theo hợp đồng src/types/pipeline.ts
 * kèm Context Isolation và Token Budgeting
 */
export function buildRuntimeContext({
  agentId = 'tri',
  second = 2233,
  sessionId = 'session_001',
  videoId = DEFAULT_MATH_VIDEO_ID,
  userMessage = '',
  chatHistory = [],
  maxHistoryTurns = 6,
}) {
  const sec = Number.isFinite(Number(second)) && Number(second) >= 0 ? Number(second) : 2233;
  const policy = AGENT_ISOLATION_POLICIES[agentId] || AGENT_ISOLATION_POLICIES.tri;
  const { videoId: lessonVideoId, isMathLesson } = resolveLessonSubject({ videoId });
  const lessonStream = getLessonIndex(lessonVideoId);
  const teacherName = lessonStream?.teacherName || 'Thầy Tiến';

  // 1. Lấy Board State tại giây T từ pre-indexed loader (Issue #6 / PR #22)
  let boardState = getBoardStateAt(lessonVideoId, sec, 30);
  if (isMathLesson && (!boardState || !boardState.segment)) {
    // Fallback từ mock_cognitive_stream_vecto12.json nếu videoId khác
    const mockCes = safeReadJson(path.join(ROOT_DIR, 'mock/mock_cognitive_stream_vecto12.json'), null);
    if (mockCes?.segments) {
      const match = mockCes.segments
        .filter((s) => s.second <= sec)
        .sort((a, b) => b.second - a.second)[0] || mockCes.segments[0];
      boardState = {
        second: sec,
        segment: match,
        recentSpeech: [{ second: match.second, speaker: match.speaker, text: match.audioTranscript }],
      };
    }
  }

  const segment = boardState?.segment || {};
  const recentSpeechTexts = (boardState?.recentSpeech || [])
    .map((s) => `${s.speaker || teacherName}: ${s.text}`)
    .join(' ');
  const teacherSpeechNow = recentSpeechTexts || segment.audioTranscript || `${teacherName} đang giảng bài trên bảng.`;

  // Định dạng công thức bảng phấn
  let blackboardLatex = '';
  if (Array.isArray(segment.blackboardLatex) && segment.blackboardLatex.length > 0) {
    blackboardLatex = segment.blackboardLatex[0];
  } else if (typeof segment.blackboardLatex === 'string') {
    blackboardLatex = segment.blackboardLatex;
  } else if (isMathLesson && sec >= 2100 && sec <= 2350) {
    blackboardLatex = "|\\vec{BC} + \\vec{DD'}|";
  }

  // 2. Lấy Part và Goal hiện tại từ lesson.json
  // lesson.json hiện chỉ mô tả bài Vectơ; bài khác lấy concept từ segment đang chiếu.
  const activePart = isMathLesson
    ? findActiveLessonPart(sec)
    : segment.id
      ? { part_id: segment.id, title: lessonStream?.videoTitle, concept: segment.blackboardText || segment.audioTranscript }
      : null;

  // 3. Lấy Trạng thái học sinh từ session store hoặc mock/session_001.json
  const sessionData = getMockSessionState(sessionId);
  const memorySummary = sessionData?.memory?.summary || 'Học sinh đang theo dõi bài giảng.';
  const currentBloomLevel = sessionData?.overall_review?.bloom_certified_level || 'Understand';
  const hesitationScore = sessionData?.overall_review?.hesitation_index_score ?? 0.5;
  const hesitationLevel = hesitationScore > 0.65 ? 'high' : hesitationScore > 0.35 ? 'medium' : 'low';
  const activeMisconceptionId = isMathLesson
    ? sessionData?.memory?.misconceptions_triggered?.[0] || 'MISC_VEC_005'
    : null;

  // 4. Lấy RAG Snippets từ Knowledge Base
  let ragContextSnippets = [];
  // Knowledge Base ngộ nhận hiện chỉ có cho bài Vectơ — không tra cho môn khác để tránh rò thuật ngữ vectơ.
  let kbEntry = isMathLesson ? getKbById(activeMisconceptionId) : null;
  if (isMathLesson && !kbEntry && userMessage) {
    const hits = searchKb(userMessage, 2);
    if (hits.length > 0) kbEntry = hits[0].misconception;
  }

  // 5. ÁP DỤNG CHÍNH SÁCH CÔ LẬP NGỮ CẢNH (Context Isolation Policy Enforcement)
  let standardFormula = '';
  let standardCorrection = '';
  let rebuttalAnchor = '';
  let scaffoldingHints = [];

  if (kbEntry) {
    standardFormula = kbEntry.standardFormula || kbEntry.formula_latex || '|a + b| ≤ |a| + |b|';
    standardCorrection = kbEntry.correction || kbEntry.giaiThichChuan || 'Độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng.';
    rebuttalAnchor = kbEntry.rebuttalAnchor || kbEntry.rebuttal_mastery_anchor || 'Chỉ ra điều kiện hai vectơ vuông góc và dùng Pytago ra √2';
    scaffoldingHints = (kbEntry.scaffolding || kbEntry.scaffoldingNudges || []).map((s) => s.question || s);
  }

  if (!isMathLesson) {
    // Bài phi Toán: chỉ bám nội dung lời giảng/bảng tại giây T. Bo vẫn không nhận nội dung chuẩn.
    const sourceText = segment.blackboardText || segment.audioTranscript || '';
    ragContextSnippets = policy.role === 'bo' || !sourceText ? [] : [`Nội dung bài giảng tại giây ${sec}: ${sourceText}`];
  } else if (policy.role === 'bo') {
    // 🛡️ BẢO VỆ TUYỆT ĐỐI CHO BO:
    // Bo KHÔNG ĐƯỢC thấy standardFormula, correction, rebuttalAnchor, standardProof!
    // Bo CHỈ thấy bẫy ngộ nhận, câu hỏi khơi mào và các nhận xét trực giác.
    ragContextSnippets = [
      `Bẫy trực giác của Bo: Cho rằng |BC + DD\'| = |BC| + |DD\'| = 1 + 1 = 2 (sai lầm cộng đại số).`,
      `Mục tiêu của Bo: Thách thức học sinh chỉ ra tại sao phép cộng 1 + 1 lại bị thầy Tiến gạch bỏ.`,
    ];
  } else if (policy.role === 'tri') {
    // Trí thấy các định lý logic chuẩn, RAG snippets, nhưng KHÔNG thấy gợi ý của trợ giảng
    ragContextSnippets = [
      `Định lý SGK: ${standardFormula} (Bất đẳng thức tam giác trong vectơ).`,
      `Điều kiện biên: Dấu bằng xảy ra khi và chỉ khi hai vectơ cùng hướng.`,
      `Phân tích hình học: BC và DD\' vuông góc trong hình lập phương. Thay DD\' = CC\' thì BC + CC\' = BC\' = √2.`,
    ];
  } else if (policy.role === 'an') {
    // Trợ giảng An thấy các nấc gợi ý scaffolding
    ragContextSnippets = [
      `Khái niệm mục tiêu: ${activePart?.concept || 'Quy tắc cộng vectơ'}.`,
      `Gợi ý cấp 1: Nhắc học sinh quan sát hướng của hai vectơ.`,
      `Gợi ý cấp 2: Gợi ý thay thế vectơ bằng nhau để nối tiếp điểm đầu và điểm cuối.`,
    ];
  } else if (policy.role === 'linhchi') {
    // Linh Chi thấy công thức và khẩu quyết ghi nhớ
    ragContextSnippets = [
      `Sổ tay công thức: Quy tắc 3 điểm (nối tiếp), Quy tắc hình bình hành (chung gốc), Quy tắc hình hộp.`,
      `Khẩu quyết: "Muốn tính độ dài của tổng, phải gom về một vectơ duy nhất trước rồi mới tính độ dài!".`,
    ];
  } else if (policy.role === 'minhkhang') {
    // Minh Khang thấy các ví dụ đời sống
    ragContextSnippets = [
      `Ví dụ thực tiễn: Đi thuyền trên sông (xuôi dòng thì cộng vận tốc, vuông góc dòng chảy thì dạt chéo).`,
      `Ứng dụng: Mũi tên chỉ đường của Google Maps và lực nâng cánh máy bay.`,
    ];
  } else {
    // Cô Lam & Assessor thấy toàn bộ không che giấu
    ragContextSnippets = [
      `Định lý chuẩn: ${standardFormula}.`,
      `Giải thích bản chất: ${standardCorrection}`,
      `Điểm chốt phản biện: ${rebuttalAnchor}`,
      `Mục tiêu Bloom: ${activePart?.goals?.[0]?.bloom_target || 'Evaluate'}.`,
    ];
  }

  // 6. Cắt tỉa Lịch sử hội thoại theo ngân sách token (N lượt gần nhất)
  let cleanHistory = Array.isArray(chatHistory) ? [...chatHistory] : [];
  if (cleanHistory.length > maxHistoryTurns) {
    cleanHistory = cleanHistory.slice(-maxHistoryTurns);
  }
  const dialogueHistory = cleanHistory.map((item) => ({
    speaker: item.author || item.speaker || 'Bạn học',
    text: item.text || item.content || '',
  }));

  // 7. Sinh Citations (mốc giây và nhãn nguồn)
  const citations = isMathLesson
    ? generateCitations({
        second: sec,
        blackboardState: boardState,
        activePart,
        misconception: kbEntry,
      })
    : generateSourceCitations({ second: sec, blackboardState: boardState, stream: lessonStream });

  // 8. Đóng gói AgentRuntimeContext hoàn chỉnh theo Contract src/types/pipeline.ts
  const runtimeContext = {
    persona: {
      agentId: policy.role,
      systemPrompt: policy.systemPrompt,
      speechStyle: policy.speechStyle,
    },
    temporalContext: {
      second: sec,
      blackboardLatex,
      teacherSpeechNow,
      spatialGeometry: segment.spatialGeometry || (isMathLesson ? {
        shapeType: 'cube',
        vertices: ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"],
        highlightedVectors: ['BC', "DD'", "CC'", "BC'"],
        actionDescription: "Hình lập phương cạnh 1, tam giác BCC' vuông cân tại C, đường chéo BC' = căn 2",
      } : null),
    },
    dialogueHistory,
    ragContextSnippets,
    learnerCognitiveState: {
      hesitationLevel,
      currentBloomLevel,
      activeMisconceptionId,
    },
  };

  // 9. Đo lường Ngân sách Token (Token Budget Verification)
  const estimatedTokens = estimateTokens({
    persona: runtimeContext.persona,
    temporalContext: runtimeContext.temporalContext,
    dialogueHistory: runtimeContext.dialogueHistory,
    ragContextSnippets: runtimeContext.ragContextSnippets,
    learnerCognitiveState: runtimeContext.learnerCognitiveState,
  });

  // Gắn Metadata phục vụ Audit, Inspector và DoD tests
  const metadata = {
    agentId: policy.role,
    videoId: lessonVideoId,
    isMathLesson,
    activePartId: activePart?.part_id || (isMathLesson ? 'part_03_box_rule_example3' : null),
    activePart: activePart ? {
      partId: activePart.part_id,
      title: activePart.title,
      concept: activePart.concept,
    } : isMathLesson ? {
      partId: 'part_03_box_rule_example3',
      title: 'Quy Tắc Hình Hộp & Điểm Dừng Bẫy Độ Dài [37:13]',
    } : null,
    isolationPolicyApplied: {
      allowedFields: policy.allowedFields,
      redactedFields: policy.redactedFields,
      hasStandardSolution: policy.canSeeStandardSolution,
      hasRebuttalAnchor: !policy.redactedFields.includes('misconception.rebuttalAnchor'),
      hasScaffoldingHints: policy.canSeeScaffoldingHints,
      hasCheatSheet: policy.allowedFields.includes('cheatSheet'),
      hasEverydayAnalogy: policy.allowedFields.includes('realLifeAnalogies'),
    },
    citations,
    memorySummary,
    tokenEstimate: estimatedTokens,
    withinTokenBudget: estimatedTokens <= TOKEN_BUDGET_LIMIT,
    tokenBudget: {
      maxTokens: TOKEN_BUDGET_LIMIT,
      estimatedTokens,
      withinBudget: estimatedTokens <= TOKEN_BUDGET_LIMIT,
    },
    timestamp: new Date().toISOString(),
  };

  return {
    ...runtimeContext,
    metadata,
    citations,
  };
}

export default {
  TOKEN_BUDGET_LIMIT,
  AGENT_ISOLATION_POLICIES,
  estimateTokens,
  getApprovedLessonPackage,
  getMockSessionState,
  findActiveLessonPart,
  generateCitations,
  generateSourceCitations,
  resolveLessonSubject,
  buildRuntimeContext,
};
