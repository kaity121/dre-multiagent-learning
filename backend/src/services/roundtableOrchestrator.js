/**
 * roundtableOrchestrator.js
 *
 * EPIC 3: MULTI-AGENT COLLABORATIVE SCRIPTWRITER & CROSS-CHECKING (#302)
 * Buồng họp biên kịch đa tác nhân A2A (Director / Blackboard Pattern)
 * có rà soát chéo, xác thực toán học bằng Deterministic Tools và RAG.
 *
 * Quy trình mỗi Part:
 * 1. Cô Lam (Director) chọn mốc dừng trong phạm vi Part (sau vùng warmup, trước khi Part kết thúc).
 * 2. Bo tra cứu KB rồi đề xuất bẫy ngộ nhận (sinh bằng model khi useLLM + có OPENAI_API_KEY).
 * 3. Trí chạy Deterministic Tool trên đề xuất của Bo. Quyết định bác bỏ / đồng thuận do kết quả
 *    tool quyết định, không do lượt lặp hay do model:
 *      - tool xác nhận claim ĐÚNG          -> bác bỏ (đáp án đúng không phải bẫy)
 *      - tool không kiểm chứng được        -> bác bỏ
 *      - claim sai nhưng không khớp cơ chế ngộ nhận (tính lại bằng tool) -> bác bỏ ("sai kiểu không có thật")
 *      - claim sai và khớp cơ chế ngộ nhận -> đồng thuận
 *    Vòng lặp có giới hạn (MAX_CROSS_CHECK_ROUNDS); lượt cuối dùng bẫy chuẩn tất định, vẫn qua tool.
 * 4. Linh Chi (mẹo ghi nhớ), Minh Khang (ví dụ trực quan), Cô Lam thẩm định Bloom + nhịp timeline rồi chốt checkpoint.
 *
 * Mọi lời thoại sinh bằng model đều có bản tất định dự phòng; nguồn gốc từng lượt được ghi trong
 * `generation` (mode: 'llm' | 'mixed' | 'deterministic' | 'deterministic_fallback').
 *
 * Đầu ra: gói làm việc theo Part (reasoning events, checkpoint, scenarios) và `lesson` theo
 * DRELessonSchema (src/types/pipeline.ts) ở trạng thái 'draft' — chỉ giáo viên (#15) mới duyệt.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeTool } from '../tools/index.js';
import { chatJSON, isLLMConfigured } from '../openaiClient.js';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DRAFTS_DIR = path.join(__dirname, '../data/drafts');

const SHORT_CLIP_MAX_SECONDS = 300;
const MAX_CROSS_CHECK_ROUNDS = 3;
const LLM_TIMEOUT_MS = 30000;
const EPSILON = 0.05;
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const LESSON_VERSION = '0.1.0-draft';
const TEMPLATED_FIELDS = ['checkpoint_question', 'checkpoint_options', 'cheat_sheet', 'expected_points'];

// ============================================================================
// Draft storage
// ============================================================================

/** Drafts directory, resolved from this module (not the process cwd). DRE_DRAFTS_DIR overrides it. */
export function getDraftsDir() {
  return path.resolve(process.env.DRE_DRAFTS_DIR || DEFAULT_DRAFTS_DIR);
}

/**
 * videoId becomes part of a file name, so only a plain identifier is accepted; anything else
 * (separators, "..", spaces, unicode) is rejected instead of being silently rewritten.
 */
export function assertSafeVideoId(videoId) {
  const raw = String(videoId ?? '').trim();
  if (!SAFE_ID_PATTERN.test(raw)) {
    throw new Error(
      `[Security Alert] videoId không hợp lệ (chỉ chấp nhận A-Z, a-z, 0-9, "_" và "-", tối đa 80 ký tự): ${JSON.stringify(raw).slice(0, 100)}`
    );
  }
  return raw;
}

/** Absolute draft path for a videoId, guaranteed to sit directly inside the drafts directory. */
export function resolveDraftPath(videoId) {
  const safeId = assertSafeVideoId(videoId);
  const draftsDir = getDraftsDir();
  const draftPath = path.resolve(draftsDir, `lesson_draft_${safeId}.json`);
  if (path.dirname(draftPath) !== draftsDir) {
    throw new Error(`[Security Alert] Đường dẫn draft thoát khỏi thư mục drafts: ${safeId}`);
  }
  return draftPath;
}

function writeDraftFile(videoId, draftPackage) {
  const draftPath = resolveDraftPath(videoId);
  fs.mkdirSync(path.dirname(draftPath), { recursive: true });
  fs.writeFileSync(draftPath, JSON.stringify(draftPackage, null, 2), 'utf-8');
  return draftPath;
}

// ============================================================================
// Shared helpers
// ============================================================================

function createReasoningEvent({ eventType, agentId, agentDisplayName, content, secondTarget, toolCall = null }) {
  return {
    id: `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType,
    agentId,
    agentDisplayName,
    secondTarget,
    content,
    toolCall: toolCall || undefined,
    timestamp: new Date().toISOString(),
  };
}

function formatTime(second) {
  const m = Math.floor(second / 60);
  const s = Math.floor(second % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function kbItems(toolCall) {
  const items = toolCall?.output?.output;
  return Array.isArray(items) ? items : [];
}

function segmentText(segment) {
  if (!segment) return '';
  return [segment.audioTranscript, segment.blackboardText, ...(segment.blackboardLatex || [])]
    .filter(Boolean)
    .join(' ');
}

const RISK_RANK = { high: 3, medium: 2, low: 1, none: 0 };

// ============================================================================
// Trap specifications (one per supported misconception)
// ============================================================================

const AGENTS = {
  colam: 'Cô Lam (Director)',
  bo: 'Bo (Hệ 1 - Trực giác)',
  tri: 'Trí (Hệ 2 - Logic)',
  linhchi: 'Linh Chi (Note Taker)',
  minhkhang: 'Minh Khang (Trực quan)',
};

/**
 * `naturalMisconception(claim, toolCall)` recomputes, with the same tool, the value a learner
 * reaches through the misconception's error mechanism and returns true when Bo's wrong claim matches it.
 */
const TRAP_SPECS = {
  MISC_VEC_005: {
    concept: 'Bài tập Tính toán độ dài & Bẫy cộng độ dài',
    toolName: 'tool_verify_vector_algebra',
    expr: "|BC + DD'|",
    terms: ['BC', "DD'"],
    toolArgs(claim) {
      return { shape: 'cube', side: 'a', expr: this.expr, claim };
    },
    // Error mechanism: adding lengths, |BC| + |DD'|.
    naturalMisconception(claim, toolCall) {
      const claimValue = toolCall?.output?.claimValue;
      if (typeof claimValue !== 'number') return false;
      const lengthSum = this.terms.reduce((sum, term) => {
        const termResult = executeTool('tool_verify_vector_algebra', { shape: 'cube', side: 'a', expr: `|${term}|` });
        return sum + Number(termResult.output?.calculatedValue || 0);
      }, 0);
      return Math.abs(claimValue - lengthSum) < EPSILON;
    },
    proposals: [
      {
        claim: 'AB',
        thought: 'Bo muốn đề xuất bẫy shortcut tính nhanh và đoán mò vectơ tổng là AB.',
        speech: "Cộng độ dài cho lẹ: |BC + DD'| = 1 + 1 = 2! Với lại vectơ BC cộng DD' chắc chắn ra luôn vectơ AB rồi!",
      },
      {
        claim: '2a',
        thought: 'Bo chuyển sang bẫy ngộ nhận cộng trực tiếp độ dài hai cạnh.',
        speech: "À tớ nhìn nhầm đỉnh! Nhưng về độ dài thì cạnh bằng a nên |BC + DD'| = a + a = 2a chứ còn gì nữa!",
      },
    ],
    approvalSpeech:
      "Bẫy này rất tự nhiên! Học sinh thường lấy ngay |BC| + |DD'| = a + a = 2a do thói quen đại số, quên mất bất đẳng thức tam giác và định lý Pytago đường chéo BC' = a√2. Tớ đồng ý chọn bẫy này!",
    counterClaim: 'a√2',
    questionText:
      "Cho hình lập phương ABCD.A'B'C'D' cạnh a. Hãy tính độ dài của vectơ tổng BC + DD' và phân tích sai lầm trong cách tính của bạn Bo. Phát biểu nào sau đây chính xác?",
    blackboardFormula: "|\\vec{BC} + \\vec{DD'}|",
    expectedPoints: ["Chỉ ra DD' = CC'", 'Tính độ dài đường chéo bằng Pytago', 'Phân tích bẫy ngộ nhận cộng độ dài đại số'],
    options: [
      { id: 'opt_A', label: 'a√2', isCorrect: true, feedbackNote: "Chính xác! Vì DD' = CC' nên BC + DD' = BC', tam giác BCC' vuông tại C có đường chéo a√2." },
      { id: 'opt_B', label: '2a', isCorrect: false, misconceptionLinked: 'MISC_VEC_005', feedbackNote: "Sai lầm! Em đang cộng trực tiếp độ dài |BC| + |DD'| = 2a giống bạn Bo. Cần quy về vectơ tổng trước!" },
      { id: 'opt_C', label: 'a', isCorrect: false, feedbackNote: 'Chưa chính xác. Độ dài tổng hai vectơ vuông góc không thể bằng độ dài một cạnh.' },
      { id: 'opt_D', label: 'a√3', isCorrect: false, feedbackNote: 'Sai lầm. a√3 là độ dài đường chéo không gian của hình lập phương (quy tắc hình hộp), không phải đường chéo mặt bên.' },
    ],
    linhChiTip:
      "Linh Chi note vào sổ tay nè: Muốn tính độ dài vectơ tổng, bước 1 là tìm vectơ thay thế để gom về một vectơ duy nhất (DD' = CC' => BC + CC' = BC'), sau đó mới tính Pytago đường chéo ra a√2!",
    minhKhangAnalogy:
      'Minh Khang ví von đời sống nè: Giống như bạn đi bộ từ nhà ra đầu ngõ a mét rồi rẽ vuông góc đi tiếp a mét. Khoảng cách đường chim bay từ nhà đến điểm cuối là cạnh huyền a√2, làm sao mà lấy a + a = 2a được!',
    closureSpeech: (second, time) =>
      `Cô chốt checkpoint dừng tại giây thứ ${second} (${time}) và gửi bản nháp để giáo viên duyệt. Các em chú ý: không bao giờ cộng độ dài trực tiếp mà phải quy về một vectơ tổng trước!`,
    cheatSheet: {
      ruleTitle: 'Quy tắc cộng & Tính độ dài Vectơ',
      rules: [
        'Bước 1: Tìm vectơ thay thế bằng nhau để đưa về chung gốc hoặc nối đuôi.',
        'Bước 2: Gom thành một vectơ tổng duy nhất.',
        'Bước 3: Dùng hình học (Pytago/Tam giác) để tính độ dài vectơ kết quả.',
      ],
      mnemonicTrap: 'TUYỆT ĐỐI không lấy độ dài cộng độ dài: |u + v| ≠ |u| + |v| khi hai vectơ không cùng hướng!',
    },
  },

  MISC_VEC_006: {
    concept: 'Phép toán Vectơ & Quy tắc Hình hộp',
    toolName: 'tool_verify_vector_algebra',
    expr: "AB + AD + AA'",
    terms: ['AB', 'AD', "AA'"],
    toolArgs(claim) {
      return { shape: 'cube', side: 'a', expr: this.expr, claim };
    },
    // Error mechanism: applying the parallelogram rule and dropping one edge of the box.
    naturalMisconception(claim) {
      for (let skip = 0; skip < this.terms.length; skip++) {
        const partialExpr = this.terms.filter((_, i) => i !== skip).join(' + ');
        const partial = executeTool('tool_verify_vector_algebra', { shape: 'cube', side: 'a', expr: partialExpr, claim });
        if (partial.isValid === true) return true;
      }
      return false;
    },
    proposals: [
      {
        claim: 'AC',
        thought: 'Bo muốn gài bẫy nhầm lẫn giữa quy tắc hình bình hành (ở đáy) và quy tắc hình hộp không gian.',
        speech: "Quy tắc hình hộp: Xuất phát từ gốc A thì AB + AD + AA' ra đường chéo đáy AC chứ nhỉ!",
      },
    ],
    approvalSpeech:
      "Bo quên mất vectơ chiều cao AA' rồi! AB + AD mới ra AC ở đáy. Thêm AA' phải vươn lên đỉnh đối diện tạo thành đường chéo không gian AC' với độ dài a√3! Đây đúng là chỗ học sinh hay nhầm, tớ đồng ý dùng làm bẫy.",
    counterClaim: "AC'",
    questionText:
      "Cho hình hộp ABCD.A'B'C'D'. Hãy áp dụng quy tắc hình hộp để xác định vectơ tổng AB + AD + AA' và phân tích tại sao không thể bằng đường chéo đáy AC:",
    blackboardFormula: "\\vec{AB} + \\vec{AD} + \\vec{AA'}",
    expectedPoints: ['Áp dụng quy tắc hình hộp', "Xác định vectơ đường chéo xuyên tâm AC'", 'Phân tích bẫy nhầm với đường chéo đáy AC'],
    options: [
      { id: 'opt_A', label: "AC'", isCorrect: true, feedbackNote: "Chính xác! Theo quy tắc hình hộp: AB + AD + AA' = AC' (đường chéo xuyên tâm không gian)." },
      { id: 'opt_B', label: 'AC', isCorrect: false, misconceptionLinked: 'MISC_VEC_006', feedbackNote: "Sai lầm! AC chỉ là đường chéo đáy từ AB + AD, chưa cộng vectơ chiều cao AA'." },
      { id: 'opt_C', label: "BD'", isCorrect: false, feedbackNote: 'Chưa đúng đỉnh xuất phát. Quy tắc hình hộp xuất phát từ gốc A.' },
      { id: 'opt_D', label: "AA'", isCorrect: false, feedbackNote: 'Chưa chính xác. Tổng 3 cạnh độc lập không thể bằng 1 cạnh.' },
    ],
    linhChiTip: "Linh Chi ghi nhớ: Đưa về chung gốc xuất phát từ một đỉnh, AB + AD + AA' = AC' (đường chéo đối diện xuyên tâm)!",
    minhKhangAnalogy:
      'Minh Khang hình dung: Giống như một cái thùng carton lớn, bạn nối một sợi dây từ góc sàn dưới phòng lên thẳng góc trần đối diện, đó chính là đường chéo không gian dài nhất!',
    closureSpeech: (second, time) =>
      `Cô chốt checkpoint dừng tại giây thứ ${second} (${time}) và gửi bản nháp để giáo viên duyệt. Phép cộng vectơ trong không gian mở rộng quy tắc hình bình hành thành quy tắc hình hộp.`,
    cheatSheet: {
      ruleTitle: 'Quy tắc hình hộp 8 đỉnh',
      rules: [
        "Bước 1: Nhận diện 3 vectơ xuất phát từ cùng một đỉnh: AB, AD, AA'.",
        'Bước 2: AB + AD = AC (đường chéo mặt đáy).',
        "Bước 3: AC + AA' = AC' (đường chéo không gian xuyên tâm).",
      ],
      mnemonicTrap: "Đừng quên vectơ chiều cao! AB + AD + AA' ra đỉnh đối diện AC', không dừng lại ở AC!",
    },
  },

  MISC_VEC_001: {
    concept: 'Khái niệm & Phương hướng Vectơ trong không gian',
    toolName: 'tool_query_misconception_kb',
    toolArgs() {
      return { misconceptionId: 'MISC_VEC_001' };
    },
    // Conceptual trap: no coordinate check exists, so the KB lookup must return this exact entry.
    kbGrounded: true,
    proposals: [
      {
        claim: 'cùng phương',
        thought: 'Bo đưa ra trực giác nhầm lẫn giữa đường thẳng chéo nhau và cùng phương.',
        speech: 'Hai đường thẳng chéo nhau thì tớ thấy giá của chúng vẫn xét cùng phương được mà!',
      },
    ],
    approvalSpeech:
      'Không được đâu Bo! SGK định nghĩa hai vectơ cùng phương khi và chỉ khi giá của chúng song song hoặc trùng nhau. Chéo nhau là hai đường thẳng không đồng phẳng, không thể cùng phương! Nhưng đây là chỗ nhiều bạn nhầm thật, tớ đồng ý dùng làm bẫy.',
    counterClaim: 'không cùng phương',
    questionText: (time) =>
      `Tại mốc ${time}, em hãy phân tích và chỉ ra lỗi sai trong phát biểu của Bo về mối quan hệ giữa hai đường thẳng chéo nhau và hai vectơ cùng phương:`,
    blackboardFormula: '\\vec{a} \\parallel \\vec{b}',
    expectedPoints: ['Phân tích bẫy ngộ nhận', 'Hai đường thẳng chéo nhau không đồng phẳng nên giá không song song/trùng nhau'],
    options: [
      { id: 'opt_A', label: 'Giá của chúng không đồng phẳng nên không cùng phương', isCorrect: true, feedbackNote: 'Chính xác! Định nghĩa SGK chỉ rõ giá phải song song hoặc trùng nhau mới cùng phương.' },
      { id: 'opt_B', label: 'Vẫn xét cùng phương được nếu độ dài bằng nhau', isCorrect: false, misconceptionLinked: 'MISC_VEC_001', feedbackNote: 'Sai lầm! Cùng phương chỉ phụ thuộc vào phương của giá, không liên quan độ dài.' },
      { id: 'opt_C', label: 'Hai đường thẳng chéo nhau luôn cùng hướng', isCorrect: false, feedbackNote: 'Sai lầm! Không cùng phương thì không thể xét cùng hướng.' },
      { id: 'opt_D', label: 'Hai vectơ đó có tích vô hướng bằng 0', isCorrect: false, feedbackNote: 'Chưa chắc, chéo nhau không nhất thiết phải vuông góc.' },
    ],
    linhChiTip: 'Linh Chi ghi nhớ: Hai vectơ cùng phương bắt buộc giá phải song song hoặc trùng nhau, đường thẳng chéo nhau không bao giờ cùng phương!',
    minhKhangAnalogy:
      'Minh Khang hình dung: Giống như một cây cầu vượt và con đường bên dưới, xe chạy trên cầu và xe chạy dưới đường không bao giờ song song hay cắt nhau, nên hướng di chuyển của chúng hoàn toàn độc lập!',
    closureSpeech: (second, time) =>
      `Cô chốt checkpoint dừng tại giây thứ ${second} (${time}) và gửi bản nháp để giáo viên duyệt. Nắm vững định nghĩa cùng phương là nền tảng để không bị nhầm lẫn trong hình học không gian.`,
    cheatSheet: {
      ruleTitle: 'Điều kiện Vectơ cùng phương',
      rules: ['Giá song song hoặc trùng nhau <=> Cùng phương.', 'Chéo nhau => Không đồng phẳng => KHÔNG cùng phương.'],
      mnemonicTrap: 'Chéo nhau thì không cùng phương, đừng đoán mò!',
    },
  },

  MISC_VEC_019: {
    concept: 'Tích vô hướng của hai vectơ',
    toolName: 'tool_calculate_dot_product',
    toolArgs(claim) {
      return { uMag: 2, vMag: 3, angleDeg: 120, claimValue: claim, claimType: 'dot_product' };
    },
    // Error mechanism: treating the dot product like a length (never negative); any wrong claim of that kind qualifies.
    naturalMisconception(claim) {
      return /không\s*âm|>=\s*0|≥\s*0|dương/i.test(String(claim));
    },
    proposals: [
      {
        claim: 'không âm',
        thought: 'Bo đưa ra giả định trực giác về tích vô hướng và góc vectơ.',
        speech: 'Tích vô hướng của hai vectơ thì luôn là một số không âm giống như độ dài chứ nhỉ!',
      },
    ],
    approvalSpeech:
      'Sai rồi Bo! Khi góc giữa hai vectơ là góc tù (120°), cos(120°) = -0.5, nên tích vô hướng u.v = 2 * 3 * (-0.5) = -3, hoàn toàn có thể âm! Bẫy này rất tự nhiên vì học sinh hay đồng nhất tích vô hướng với độ dài, tớ đồng ý.',
    counterClaim: '-3',
    questionText:
      'Cho hai vectơ u, v có |u| = 2, |v| = 3 và góc giữa chúng bằng 120°. Bạn Bo cho rằng tích vô hướng luôn không âm. Em hãy tính u.v và nhận xét:',
    blackboardFormula: '\\vec{u} \\cdot \\vec{v} = |\\vec{u}| |\\vec{v}| \\cos(\\theta)',
    expectedPoints: ['Áp dụng công thức tích vô hướng', 'Tính cos 120° = -1/2', 'Kết luận tích vô hướng có thể âm'],
    options: [
      { id: 'opt_A', label: '-3', isCorrect: true, feedbackNote: 'Chính xác! u.v = 2 · 3 · cos120° = -3.' },
      { id: 'opt_B', label: '3', isCorrect: false, misconceptionLinked: 'MISC_VEC_019', feedbackNote: 'Sai lầm! Em đã bỏ dấu của cos 120°, tích vô hướng có thể âm.' },
      { id: 'opt_C', label: '6', isCorrect: false, feedbackNote: 'Chưa chính xác. Đây là tích độ dài, chưa nhân cos của góc.' },
      { id: 'opt_D', label: 'Một vectơ có độ dài 6', isCorrect: false, feedbackNote: 'Sai lầm! Tích vô hướng là một số, không phải vectơ.' },
    ],
    linhChiTip: 'Linh Chi ghi nhớ: Tích vô hướng là một SỐ, dấu của nó theo dấu của cos góc giữa hai vectơ!',
    minhKhangAnalogy: 'Minh Khang hình dung: Kéo vali ngược chiều đi tới thì lực kéo đang "cản" chuyển động, công sinh ra là âm!',
    closureSpeech: (second, time) =>
      `Cô chốt checkpoint dừng tại giây thứ ${second} (${time}) và gửi bản nháp để giáo viên duyệt. Dấu của tích vô hướng phụ thuộc vào góc giữa hai vectơ.`,
    cheatSheet: {
      ruleTitle: 'Tích vô hướng',
      rules: ['u.v = |u||v|cos(u, v).', 'Góc tù => cos âm => tích vô hướng âm.'],
      mnemonicTrap: 'Tích vô hướng không phải độ dài, nó có thể âm!',
    },
  },
};

export const SUPPORTED_MISCONCEPTION_IDS = Object.keys(TRAP_SPECS);

function getTrapSpec(misconceptionId) {
  const spec = TRAP_SPECS[misconceptionId];
  if (!spec) {
    throw new Error(
      `Chưa có kịch bản bẫy được kiểm chứng cho ${misconceptionId}. Hỗ trợ: ${SUPPORTED_MISCONCEPTION_IDS.join(', ')}`
    );
  }
  return { ...spec, misconceptionId };
}

// ============================================================================
// Partitioning (bounded by the input duration and content)
// ============================================================================

const CONTENT_RULES = [
  {
    misconceptionId: 'MISC_VEC_005',
    matches: (tags, text) => tags.includes('length_addition_fallacy') || (/\bBC\b/.test(text) && /DD'/.test(text)),
  },
  {
    misconceptionId: 'MISC_VEC_006',
    matches: (tags, text) => tags.includes('box_rule') || /hình hộp/i.test(text),
  },
  {
    misconceptionId: 'MISC_VEC_019',
    matches: (tags, text) => tags.includes('negative_dot') || /tích vô hướng/i.test(text),
  },
  {
    misconceptionId: 'MISC_VEC_001',
    matches: (tags, text) => tags.includes('skew_lines_trap') || tags.includes('collinear_condition') || /cùng phương|chéo nhau/i.test(text),
  },
];

/** Picks the misconception from the segment that will be paused on, then from the rest of the part. */
export function detectMisconceptionId(segments, preferredSegment, fallbackId) {
  const ordered = preferredSegment ? [preferredSegment, ...segments.filter(s => s !== preferredSegment)] : segments;
  for (const segment of ordered) {
    const tags = segment.pedagogicalTags || [];
    const text = segmentText(segment);
    const rule = CONTENT_RULES.find(r => r.matches(tags, text));
    if (rule) return rule.misconceptionId;
  }
  return fallbackId;
}

/** Warmup before the first allowed checkpoint: 30s at lesson start, 15s otherwise, at most a quarter of a short part. */
export function computeWarmupSeconds(startSecond, endSecond) {
  const nominal = startSecond === 0 ? 30 : 15;
  return Math.max(0, Math.min(nominal, Math.floor((endSecond - startSecond) * 0.25)));
}

function resolveDuration(cognitiveStream, segments) {
  const declared = Number(cognitiveStream?.durationSeconds);
  if (Number.isFinite(declared) && declared > 0) return Math.floor(declared);
  const lastSecond = segments.reduce((max, s) => Math.max(max, Number(s.second) || 0), -1);
  if (lastSecond >= 0) return lastSecond + 1;
  throw new Error('CognitiveEventStream thiếu durationSeconds hợp lệ và không có segment nào để suy ra thời lượng.');
}

function buildPart({ partNumber, startSecond, endSecond, segments, fallbackMisconceptionId }) {
  const warmupSeconds = computeWarmupSeconds(startSecond, endSecond);
  const pool = segments.filter(s => s.second >= startSecond + warmupSeconds && s.second < endSecond);
  const chosenSegment = pool.reduce((best, s) => {
    if (!best) return s;
    return (RISK_RANK[s.trapRiskLevel] || 0) > (RISK_RANK[best.trapRiskLevel] || 0) ? s : best;
  }, null);
  const misconceptionId = detectMisconceptionId(segments, chosenSegment, fallbackMisconceptionId);
  const spec = getTrapSpec(misconceptionId);
  const checkpointSecond = chosenSegment
    ? chosenSegment.second
    : Math.min(startSecond + warmupSeconds, endSecond - 1);

  return {
    partNumber,
    title: `Phần ${partNumber}: ${spec.concept}`,
    startSecond,
    endSecond,
    warmupSeconds,
    misconceptionId,
    segments,
    chosenSegment,
    targetSegmentId: chosenSegment?.id,
    checkpointSecond,
  };
}

/**
 * Splits a CognitiveEventStream into lesson parts that stay inside [0, durationSeconds):
 * clips up to 5 minutes become one part; longer lectures get three parts, and parts without any
 * segment are dropped because there is no content to pause on.
 */
export function partitionTimelineIntoParts(cognitiveStream) {
  const rawSegments = Array.isArray(cognitiveStream?.segments) ? cognitiveStream.segments : [];
  const duration = resolveDuration(cognitiveStream, rawSegments.filter(s => Number.isFinite(Number(s?.second))));
  const segments = rawSegments
    .filter(s => s && Number.isFinite(Number(s.second)) && s.second >= 0 && s.second < duration)
    .sort((a, b) => a.second - b.second);

  if (duration <= SHORT_CLIP_MAX_SECONDS) {
    return [buildPart({ partNumber: 1, startSecond: 0, endSecond: duration, segments, fallbackMisconceptionId: 'MISC_VEC_001' })];
  }

  const boundary1 = Math.min(900, Math.floor(duration / 3));
  const boundary2 = Math.min(2000, Math.floor((duration * 2) / 3));
  const ranges = [
    { startSecond: 0, endSecond: boundary1, fallbackMisconceptionId: 'MISC_VEC_001' },
    { startSecond: boundary1, endSecond: boundary2, fallbackMisconceptionId: 'MISC_VEC_006' },
    { startSecond: boundary2, endSecond: duration, fallbackMisconceptionId: 'MISC_VEC_005' },
  ].map(range => ({
    ...range,
    segments: segments.filter(s => s.second >= range.startSecond && s.second < range.endSecond),
  }));

  const withContent = ranges.filter(r => r.segments.length > 0);
  if (withContent.length === 0) {
    return [buildPart({ partNumber: 1, startSecond: 0, endSecond: duration, segments, fallbackMisconceptionId: 'MISC_VEC_001' })];
  }
  return withContent.map((range, index) => buildPart({ ...range, partNumber: index + 1 }));
}

function resolvePartCheckpointSecond(partInfo) {
  const start = Number(partInfo.startSecond) || 0;
  const end = Number(partInfo.endSecond);
  if (!Number.isFinite(end) || end <= start) {
    throw new Error(`Part ${partInfo.partNumber} có khoảng thời gian không hợp lệ: ${start}..${partInfo.endSecond}`);
  }
  const warmup = computeWarmupSeconds(start, end);
  const candidate = Number.isFinite(partInfo.checkpointSecond)
    ? partInfo.checkpointSecond
    : partInfo.chosenSegment
    ? partInfo.chosenSegment.second
    : start + warmup;
  return Math.max(start + warmup, Math.min(candidate, end - 1));
}

// ============================================================================
// Generation (LLM when requested and configured, deterministic fallback otherwise)
// ============================================================================

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Model không phản hồi sau ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Tracks where every generated line came from. `llm.chatJSON` can be injected (tests, other providers);
 * otherwise the shared OpenAI client is used only when a key is configured.
 */
function createGenerationContext({ useLLM, llm }) {
  const requested = Boolean(useLLM);
  const injected = typeof llm?.chatJSON === 'function';
  const configured = injected || isLLMConfigured();
  const call = injected ? llm.chatJSON : chatJSON;
  const turns = [];

  return {
    requested,
    active: requested && configured,
    async generate({ agentId, purpose, model, systemPrompt, userPayload, accept, fallback }) {
      if (requested && configured) {
        try {
          const result = await withTimeout(call({ model, systemPrompt, userPayload }), LLM_TIMEOUT_MS);
          const accepted = accept(result);
          if (accepted) {
            turns.push({ agentId, purpose, source: 'llm', model });
            return { ...accepted, source: 'llm' };
          }
          turns.push({ agentId, purpose, source: 'deterministic_fallback', model, reason: 'invalid_model_output' });
        } catch (err) {
          turns.push({ agentId, purpose, source: 'deterministic_fallback', model, reason: 'llm_call_failed', error: err.message });
        }
      } else {
        turns.push({
          agentId,
          purpose,
          source: requested ? 'deterministic_fallback' : 'deterministic',
          reason: requested ? 'llm_not_configured' : undefined,
        });
      }
      return { ...fallback, source: requested ? 'deterministic_fallback' : 'deterministic' };
    },
    noteDeterministic(agentId, purpose, reason) {
      turns.push({ agentId, purpose, source: requested ? 'deterministic_fallback' : 'deterministic', reason });
    },
    summary() {
      return summarizeGeneration(requested, configured, turns);
    },
  };
}

function summarizeGeneration(requested, configured, turns) {
  const llmTurns = turns.filter(t => t.source === 'llm').length;
  let mode = 'deterministic';
  if (requested) {
    if (llmTurns === turns.length && llmTurns > 0) mode = 'llm';
    else if (llmTurns > 0) mode = 'mixed';
    else mode = 'deterministic_fallback';
  }
  const failure = turns.find(t => t.reason === 'llm_call_failed' || t.reason === 'invalid_model_output');
  return {
    requestedMode: requested ? 'llm' : 'deterministic',
    mode,
    isFallback: requested && mode !== 'llm',
    fallbackReason: !requested ? null : !configured ? 'llm_not_configured' : failure ? failure.reason : null,
    llmTurns,
    totalTurns: turns.length,
    turns,
    // Always taken from the reviewed per-misconception templates, never generated.
    templatedFields: TEMPLATED_FIELDS,
  };
}

/** Merges per-part generation summaries into one lesson-level summary. */
function mergeGeneration(parts) {
  const turns = parts.flatMap(p => p.generation?.turns || []);
  const requested = parts.some(p => p.generation?.requestedMode === 'llm');
  const configured = !parts.some(p => p.generation?.fallbackReason === 'llm_not_configured');
  return summarizeGeneration(requested, configured, turns);
}

function personaSystemPrompt(agentId, task) {
  const personas = {
    bo: 'Bạn là "Bo" (Hệ 1 - Trực giác, lém lỉnh) trong buồng họp biên kịch A2A môn Toán 12.',
    tri: 'Bạn là "Trí" (Hệ 2 - Logic, nghiêm cẩn) trong buồng họp biên kịch A2A môn Toán 12.',
    linhchi: 'Bạn là "Linh Chi" (Note Taker, cẩn thận, tóm tắt quy tắc) trong buồng họp biên kịch A2A môn Toán 12.',
    minhkhang: 'Bạn là "Minh Khang" (ví dụ trực quan đời sống) trong buồng họp biên kịch A2A môn Toán 12.',
    colam: 'Bạn là "Cô Lam" (Director, ấm áp, dẫn dắt Socratic "nudges, not answers") trong buồng họp biên kịch A2A môn Toán 12.',
  };
  return `${personas[agentId]}\n${task}\nChỉ trả về JSON hợp lệ theo đúng định dạng được yêu cầu, viết bằng tiếng Việt.`;
}

const acceptText = field => result => {
  const value = typeof result?.[field] === 'string' ? result[field].trim() : '';
  return value && value.length <= 600 ? { text: value } : null;
};

// ============================================================================
// Cross-check: tool-controlled verdict
// ============================================================================

/**
 * Decides whether Bo's proposal is usable as a trap. The decision only reads the tool result
 * (and recomputations with the same tool); a model may phrase the verdict but never decides it.
 */
export function assessTrapProposal(spec, claim, toolCall) {
  if (spec.kbGrounded) {
    // An unknown id falls back to keyword search, so only an exact-id lookup that returns this entry first counts.
    const first = kbItems(toolCall)[0];
    const grounded =
      toolCall?.input?.misconceptionId === spec.misconceptionId &&
      (first?.misconceptionId || first?.id) === spec.misconceptionId;
    return grounded
      ? { approved: true, code: 'kb_grounded_misconception' }
      : { approved: false, code: 'unverifiable' };
  }
  if (!toolCall || toolCall.isValid === null || toolCall.isValid === undefined) {
    return { approved: false, code: 'unverifiable' };
  }
  if (toolCall.isValid === true) {
    return { approved: false, code: 'claim_is_correct' };
  }
  return spec.naturalMisconception(claim, toolCall)
    ? { approved: true, code: 'natural_misconception' }
    : { approved: false, code: 'unrealistic_error' };
}

function rejectionSpeech(assessment, claim, toolCall) {
  const correct = toolCall?.output?.correct || toolCall?.output?.dotProduct;
  const reason = toolCall?.output?.reason || '';
  switch (assessment.code) {
    case 'claim_is_correct':
      return `Tớ bác bỏ đề xuất này: tool xác nhận "${claim}" là đáp án ĐÚNG${correct ? ` (${correct})` : ''}, nên nó không phải bẫy ngộ nhận. Bo cần đưa ra một cách làm sai mà học sinh hay mắc thật.`;
    case 'unverifiable':
      return `Tớ bác bỏ đề xuất "${claim}" vì tool không kiểm chứng được nó (${reason || 'không phân tích được phát biểu'}). Bẫy phải là một phát biểu kiểm chứng được.`;
    default:
      return `Bo nhầm to rồi! Tớ vừa chạy tool kiểm chứng: ${reason} Đề xuất "${claim}" sai nhưng không theo cơ chế ngộ nhận nào của học sinh, bẫy như vậy là "sai kiểu không có thật", học sinh sẽ thấy vô lý ngay. Cậu hãy giữ đúng bản chất ngộ nhận thôi!`;
  }
}

async function proposeTrap({ spec, round, feedback, generation, partInfo }) {
  const deterministic = spec.proposals[Math.min(round, spec.proposals.length - 1)];
  const isFinalRound = round === MAX_CROSS_CHECK_ROUNDS - 1;

  // The last round always uses the canonical trap so a run converges on a tool-verified result.
  if (isFinalRound && generation.active) {
    generation.noteDeterministic('bo', `trap_proposal_round_${round + 1}`, 'final_round_canonical_trap');
    return { ...spec.proposals[spec.proposals.length - 1], source: 'deterministic_fallback' };
  }

  return generation.generate({
    agentId: 'bo',
    purpose: `trap_proposal_round_${round + 1}`,
    model: config.models.bo,
    systemPrompt: personaSystemPrompt(
      'bo',
      `Đề xuất MỘT phát biểu gài bẫy ngộ nhận tự nhiên cho phần "${partInfo.title}" (ngộ nhận ${spec.misconceptionId}). ` +
        (spec.expr ? `Bài toán: tính ${spec.expr} trong hình lập phương cạnh a. ` : '') +
        'Phát biểu phải SAI nhưng giống lỗi học sinh hay mắc thật. ' +
        'Trả về JSON: { "thought": "suy nghĩ", "claim": "giá trị ngắn hoặc tên vectơ, ví dụ 2a hoặc AC", "speech": "câu nói của Bo" }'
    ),
    userPayload: {
      round: round + 1,
      partTitle: partInfo.title,
      teacherSays: segmentText(partInfo.chosenSegment).slice(0, 400),
      previousVerdict: feedback,
    },
    accept: result => {
      const claim = typeof result?.claim === 'string' ? result.claim.trim() : '';
      const speech = typeof result?.speech === 'string' ? result.speech.trim() : '';
      if (!claim || claim.length > 40 || !speech || speech.length > 600) return null;
      const thought = typeof result.thought === 'string' && result.thought.trim() ? result.thought.trim() : `Bo đề xuất bẫy "${claim}".`;
      return { claim, speech, thought };
    },
    fallback: deterministic,
  });
}

async function runCrossCheck({ spec, partInfo, generation, record }) {
  const rounds = [];
  let feedback = null;

  for (let round = 0; round < MAX_CROSS_CHECK_ROUNDS; round++) {
    const proposal = await proposeTrap({ spec, round, feedback, generation, partInfo });
    await record('thought', 'bo', proposal.thought);
    await record('debate_turn', 'bo', proposal.speech);

    await record('thought', 'tri', `Trí kích hoạt ${spec.toolName} để kiểm chứng đề xuất "${proposal.claim}" của Bo.`);
    const toolCall = executeTool(spec.toolName, spec.toolArgs(proposal.claim));
    await record('tool_call', 'tri', `Kích hoạt ${spec.toolName} với claim "${proposal.claim}"`, toolCall);
    await record(
      'tool_result',
      'tri',
      `Tool trả về isValid: ${toolCall.isValid} — ${toolCall.output?.reason || 'đã truy xuất dữ liệu'}`,
      toolCall
    );

    const assessment = assessTrapProposal(spec, proposal.claim, toolCall);
    const fallbackSpeech = assessment.approved ? spec.approvalSpeech : rejectionSpeech(assessment, proposal.claim, toolCall);
    const verdict = await generation.generate({
      agentId: 'tri',
      purpose: `cross_check_verdict_round_${round + 1}`,
      model: config.models.tri,
      systemPrompt: personaSystemPrompt(
        'tri',
        `Quyết định đã được chốt bởi kết quả tool: ${assessment.approved ? 'ĐỒNG THUẬN chọn bẫy (nói rõ "tớ đồng ý" và vì sao bẫy tự nhiên)' : 'BÁC BỎ đề xuất (nói rõ "tớ bác bỏ")'} — mã lý do "${assessment.code}". ` +
          'Không được đổi quyết định này. Diễn đạt ngắn gọn (2-3 câu), dựa đúng vào output của tool. Trả về JSON: { "speech": "..." }'
      ),
      userPayload: { boClaim: proposal.claim, boSpeech: proposal.speech, verdict: assessment, toolOutput: toolCall.output },
      accept: acceptText('speech'),
      fallback: { text: fallbackSpeech },
    });
    await record('cross_check_verdict', 'tri', verdict.text, toolCall);

    rounds.push({
      round: round + 1,
      claim: proposal.claim,
      proposalSource: proposal.source,
      toolName: toolCall.toolName,
      toolIsValid: toolCall.isValid,
      verdict: assessment.approved ? 'approved' : 'rejected',
      reasonCode: assessment.code,
    });

    if (assessment.approved) {
      return { approved: true, claim: proposal.claim, trapSpeech: proposal.speech, verdictSpeech: verdict.text, rounds };
    }
    feedback = { rejectedClaim: proposal.claim, reasonCode: assessment.code, toolReason: toolCall.output?.reason || null };
  }

  return { approved: false, rounds };
}

// ============================================================================
// Roundtable per part
// ============================================================================

/**
 * Runs the roundtable for one part. Supports onEvent(event) for real-time streaming,
 * streamDelayMs for demo pacing, isAborted() to stop early (returns null) and an injectable llm.chatJSON.
 */
export async function runRoundtableForPart(
  partInfo,
  { useLLM = false, onEvent = null, streamDelayMs = 0, isAborted = () => false, llm = null } = {}
) {
  const spec = getTrapSpec(partInfo.misconceptionId || 'MISC_VEC_005');
  const generation = createGenerationContext({ useLLM, llm });
  const events = [];
  const recordedToolCalls = [];
  const aborted = () => typeof isAborted === 'function' && isAborted();

  const partStart = Number(partInfo.startSecond) || 0;
  const second = resolvePartCheckpointSecond(partInfo);
  const timeFormatted = formatTime(second);
  const segment = partInfo.chosenSegment;

  async function record(eventType, agentId, content, toolCall = null) {
    const evt = createReasoningEvent({
      eventType,
      agentId,
      agentDisplayName: AGENTS[agentId],
      content,
      secondTarget: second,
      toolCall,
    });
    events.push(evt);
    if (toolCall) recordedToolCalls.push(toolCall);

    if (typeof onEvent === 'function') {
      try {
        await onEvent(evt);
      } catch (cbErr) {
        console.warn('[Roundtable] onEvent callback warning:', cbErr);
      }
    }
    if (streamDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, streamDelayMs));
    }
    return evt;
  }

  // 1. Cô Lam chọn mốc dừng
  await record(
    'thought',
    'colam',
    `Cô Lam đang phân tích phân đoạn "${partInfo.title}". Mốc ${timeFormatted} (${second}s) nằm trong Part ${partStart}s..${partInfo.endSecond}s, cách đầu Part ${second - partStart}s (sau vùng warmup). Mức độ rủi ro ngộ nhận: ${segment?.trapRiskLevel || 'không rõ'}.`
  );
  await record(
    'debate_turn',
    'colam',
    `Chào cả lớp! Tại mốc ${timeFormatted}, thầy đang giảng về ${segment?.audioTranscript?.slice(0, 80) || partInfo.title}. Bo ơi, cậu tra cứu kho tri thức ngộ nhận xem đoạn này học sinh hay vướng bẫy gì nhất?`
  );
  if (aborted()) return null;

  // 2. Bo tra cứu KB
  await record('thought', 'bo', 'Bo đang tra cứu tri thức ngộ nhận từ Knowledge Base để chọn bẫy thách đố.');
  const boKbToolCall = executeTool('tool_query_misconception_kb', { misconceptionId: spec.misconceptionId });
  const kbHit = kbItems(boKbToolCall).find(item => (item.misconceptionId || item.id) === spec.misconceptionId);
  await record('tool_call', 'bo', `Bo tra cứu tri thức ngộ nhận từ KB: ${boKbToolCall.toolName}`, boKbToolCall);
  await record(
    'tool_result',
    'bo',
    kbHit
      ? `Kết quả tra cứu KB: ${spec.misconceptionId} — ${kbHit.misconceptionName}`
      : `Kết quả tra cứu KB: không tìm thấy mục ${spec.misconceptionId}, bẫy phải dựa hoàn toàn vào tool kiểm chứng.`,
    boKbToolCall
  );
  if (aborted()) return null;

  // 3. Rà soát chéo Bo <-> Trí do tool quyết định
  const crossCheck = await runCrossCheck({ spec, partInfo, generation, record });
  if (!crossCheck.approved) {
    throw new Error(
      `Không tìm được bẫy được tool xác nhận cho Part ${partInfo.partNumber} (${spec.misconceptionId}) sau ${MAX_CROSS_CHECK_ROUNDS} lượt.`
    );
  }
  const crossCheckCorrectionOccurred = crossCheck.rounds.some(r => r.verdict === 'rejected');
  if (aborted()) return null;

  // 4. Linh Chi & Minh Khang
  await record('thought', 'linhchi', 'Linh Chi trích xuất quy tắc sư phạm và lập bảng ghi chú bỏ túi cho học sinh.');
  const linhChi = await generation.generate({
    agentId: 'linhchi',
    purpose: 'mnemonic_tip',
    model: config.models.linhChi,
    systemPrompt: personaSystemPrompt('linhchi', 'Viết 1-2 câu mẹo ghi nhớ quy tắc đúng, KHÔNG nêu đáp số. Trả về JSON: { "tip": "..." }'),
    userPayload: { concept: spec.concept, trap: crossCheck.trapSpeech, rules: spec.cheatSheet.rules },
    accept: acceptText('tip'),
    fallback: { text: spec.linhChiTip },
  });
  await record('debate_turn', 'linhchi', linhChi.text);

  await record('thought', 'minhkhang', 'Minh Khang liên hệ bài toán với hiện tượng đời sống hàng ngày để học sinh dễ nhớ.');
  const minhKhang = await generation.generate({
    agentId: 'minhkhang',
    purpose: 'real_world_analogy',
    model: config.models.bo,
    systemPrompt: personaSystemPrompt('minhkhang', 'Đưa ra 1-2 câu ví dụ đời sống minh hoạ vì sao bẫy sai. Trả về JSON: { "analogy": "..." }'),
    userPayload: { concept: spec.concept, trap: crossCheck.trapSpeech },
    accept: acceptText('analogy'),
    fallback: { text: spec.minhKhangAnalogy },
  });
  await record('debate_turn', 'minhkhang', minhKhang.text);
  if (aborted()) return null;

  // 5. Cô Lam thẩm định Bloom, pacing và chốt checkpoint
  const questionText = typeof spec.questionText === 'function' ? spec.questionText(timeFormatted) : spec.questionText;

  const bloomToolCall = executeTool('tool_evaluate_bloom_level', { question: questionText, expected_points: spec.expectedPoints });
  await record('tool_call', 'colam', `Thẩm định bậc Bloom cho câu hỏi checkpoint: ${bloomToolCall.toolName}`, bloomToolCall);
  await record(
    'tool_result',
    'colam',
    `Mức Bloom thẩm định: ${bloomToolCall.output?.level} (Điểm: ${bloomToolCall.output?.score}/6)`,
    bloomToolCall
  );

  const stopEventId = `stop_${second}`;
  const timelineToolCall = executeTool('tool_timeline_collision_checker', {
    events: [
      { id: stopEventId, at_s: second, actor_id: 'colam', type: 'checkpoint' },
      { id: `bo_challenge_${second + 2}`, at_s: second + 2, actor_id: 'bo', type: 'comment', chainedTo: stopEventId },
    ],
    minGapS: 20,
    warmupPeriodS: computeWarmupSeconds(partStart, partInfo.endSecond),
    maxCheckpoints: 1,
  });
  await record('tool_call', 'colam', 'Kiểm tra nhịp thời gian bài giảng và chống va chạm (Pacing Checker)', timelineToolCall);
  await record(
    'tool_result',
    'colam',
    `Kết quả Pacing: ${timelineToolCall.isValid ? 'Hợp lệ' : 'Cảnh báo'} (${timelineToolCall.output?.reason || 'Đạt chuẩn'})`,
    timelineToolCall
  );

  const closure = await generation.generate({
    agentId: 'colam',
    purpose: 'checkpoint_closure',
    model: config.models.coLam,
    systemPrompt: personaSystemPrompt(
      'colam',
      `Chốt checkpoint tại giây ${second} (${timeFormatted}) bằng 1-2 câu, nói rõ đây là bản nháp chờ giáo viên duyệt, không nêu đáp số. Trả về JSON: { "speech": "..." }`
    ),
    userPayload: { concept: spec.concept, trap: crossCheck.trapSpeech, verdict: crossCheck.verdictSpeech },
    accept: acceptText('speech'),
    fallback: { text: spec.closureSpeech(second, timeFormatted) },
  });
  await record('checkpoint_created', 'colam', closure.text);
  if (aborted()) return null;

  const checkpointItem = {
    id: `chk_${partInfo.partNumber}_${second}`,
    second,
    timeFormatted,
    title: `Checkpoint ${partInfo.partNumber}: ${partInfo.title}`,
    questionText,
    blackboardFormula: segment?.blackboardLatex?.[0] || spec.blackboardFormula,
    options: spec.options.map(o => ({ ...o })),
    boInitialChallenge: crossCheck.trapSpeech,
    linhChiCheatSheetSnippet: { ...spec.cheatSheet, rules: [...spec.cheatSheet.rules] },
  };

  return {
    partNumber: partInfo.partNumber,
    title: partInfo.title,
    startSecond: partStart,
    endSecond: partInfo.endSecond,
    misconceptionId: spec.misconceptionId,
    sourceSegmentIds: (partInfo.segments || []).map(s => s.id).filter(Boolean),
    contextSegmentId: segment?.id || null,
    context: segment?.audioTranscript || '',
    checkpointSecond: second,
    status: 'draft',
    checkpoint: checkpointItem,
    expectedPoints: [...spec.expectedPoints],
    bloomLevel: bloomToolCall.output?.level || null,
    scenarios: [
      { actor: 'colam', role: 'Pedagogical Director', dialogue: closure.text },
      { actor: 'bo', role: 'Sparring Partner (Hệ 1)', dialogue: crossCheck.trapSpeech, claim: crossCheck.claim, intentional_error: true },
      { actor: 'tri', role: 'Deep Thinker (Hệ 2)', dialogue: crossCheck.verdictSpeech, counter_claim: spec.counterClaim },
      { actor: 'linhchi', role: 'Note Taker', dialogue: linhChi.text },
      { actor: 'minhkhang', role: 'Visualizer', dialogue: minhKhang.text },
    ],
    crossCheckRounds: crossCheck.rounds,
    deterministic_tool_calls: recordedToolCalls,
    reasoning_events: events,
    crossCheckCorrectionOccurred,
    generation: generation.summary(),
  };
}

// ============================================================================
// DRELessonSchema draft (src/types/pipeline.ts)
// ============================================================================

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

function buildSources(segments, duration) {
  return segments.map((s, i) => {
    const content = [s.audioTranscript, s.blackboardText].filter(Boolean).join('\n');
    const source = {
      source_id: s.id || `seg_${s.second}`,
      type: s.blackboardLatex?.length ? 'blackboard' : 'transcript',
      start_s: s.second,
      end_s: i + 1 < segments.length ? segments[i + 1].second : duration,
      content,
    };
    if (s.blackboardLatex?.length) source.latex = [...s.blackboardLatex];
    const g = s.spatialGeometry;
    if (g && g.shapeType && Array.isArray(g.vertices) && Array.isArray(g.highlightedVectors) && typeof g.actionDescription === 'string') {
      source.geometry_meta = g;
    }
    return source;
  });
}

function buildLessonPart(part, sourceIds) {
  const n = part.partNumber;
  const cp = part.checkpoint;
  const bloom = BLOOM_LEVELS.includes(part.bloomLevel) ? part.bloomLevel : 'Analyze';
  const correctOptionIds = cp.options.filter(o => o.isCorrect).map(o => o.id);
  const byActor = actor => part.scenarios.find(s => s.actor === actor)?.dialogue || '';
  const at = offset => Math.min(part.checkpointSecond + offset, part.endSecond);

  const scenarios = [
    {
      scenario_id: `p${n}_sc_bo_trap`,
      at_s: at(2),
      actor_id: 'bo',
      interaction_type: 'bo_trap_bait',
      bloom_level: bloom,
      question: byActor('bo'),
      expected_points: [...part.expectedPoints],
      misconception_target: part.misconceptionId,
      bo_fallacy_statement: byActor('bo'),
      pause_video: true,
      wait_timeout_s: 60,
      on_correct: 'bo_concedes',
      on_incorrect: 'deepen_bo_challenge',
      on_timeout: 'offer_hint_or_skip',
    },
    {
      scenario_id: `p${n}_sc_linhchi_hint`,
      at_s: at(4),
      actor_id: 'linhchi',
      interaction_type: 'scaffold_hint',
      bloom_level: bloom,
      question: byActor('linhchi'),
      expected_points: [...part.expectedPoints],
      misconception_target: part.misconceptionId,
      linhchi_cheat_sheet_ref: cp.linhChiCheatSheetSnippet?.ruleTitle,
      pause_video: true,
      wait_timeout_s: 45,
      on_correct: 'confirm_and_resume',
      on_incorrect: 'open_cheat_sheet',
      on_timeout: 'ta_nudge_resume',
    },
  ];
  // Passive follow-ups after the pause, kept 20s apart and inside the part.
  [
    ['tri', 25],
    ['minhkhang', 45],
  ].forEach(([actor, offset]) => {
    if (part.checkpointSecond + offset <= part.endSecond) {
      scenarios.push({
        scenario_id: `p${n}_sc_${actor}_comment`,
        at_s: part.checkpointSecond + offset,
        actor_id: actor,
        interaction_type: 'passive_comment',
        question: byActor(actor),
        expected_points: [],
        misconception_target: part.misconceptionId,
        pause_video: false,
        wait_timeout_s: 0,
        on_correct: 'confirm_and_resume',
        on_incorrect: 'hint_then_explain_and_resume',
        on_timeout: 'ta_nudge_resume',
      });
    }
  });

  return {
    part_id: `part_${n}`,
    start_s: part.startSecond,
    end_s: part.endSecond,
    concept: part.title,
    context: part.context || part.title,
    goals: part.expectedPoints.map((description, i) => ({ goal_id: `p${n}_goal_${i + 1}`, description, bloom_target: bloom })),
    source_refs: part.sourceSegmentIds.filter(id => sourceIds.has(id)),
    pause_questions: [
      {
        question_id: `p${n}_q_checkpoint`,
        at_s: part.checkpointSecond,
        purpose: 'checkpoint_misconception_test',
        question_type: 'multiple_choice',
        question: cp.questionText,
        blackboard_formula: cp.blackboardFormula,
        options: cp.options.map(o => {
          const option = { option_id: o.id, text: o.label, is_correct: o.isCorrect };
          if (o.misconceptionLinked) option.misconception_linked = o.misconceptionLinked;
          return option;
        }),
        correct_option_ids: correctOptionIds,
        explanation: cp.options.find(o => o.isCorrect)?.feedbackNote || '',
        max_attempts: 2,
        allow_skip: true,
        on_correct: 'trigger_bo_challenge',
        on_incorrect: 'offer_scaffolding',
        on_skip: 'flag_unmastered',
        misconception_id: part.misconceptionId,
      },
    ],
    scenarios,
  };
}

/**
 * Builds the roundtable output as a DRELessonSchema in 'draft' status. Approval belongs to the
 * teacher review flow (#15), so this producer never emits 'under_review' or 'approved'.
 */
export function buildLessonDraft(cognitiveStream, partResults) {
  const rawSegments = Array.isArray(cognitiveStream?.segments) ? cognitiveStream.segments : [];
  const duration = resolveDuration(cognitiveStream, rawSegments.filter(s => Number.isFinite(Number(s?.second))));
  const segments = rawSegments
    .filter(s => s && Number.isFinite(Number(s.second)) && s.second >= 0 && s.second < duration)
    .sort((a, b) => a.second - b.second);
  const sources = buildSources(segments, duration);
  const sourceIds = new Set(sources.map(s => s.source_id));
  const videoId = String(cognitiveStream?.videoId || 'VECTO12');

  return {
    lesson_id: `lesson_${videoId}_draft`,
    version: LESSON_VERSION,
    status: 'draft',
    title: cognitiveStream?.videoTitle || 'Bài 1.1: Vectơ Trong Không Gian',
    subject: cognitiveStream?.subject || 'Toán 12',
    video_url: typeof cognitiveStream?.videoUrl === 'string' ? cognitiveStream.videoUrl : '',
    video_duration_s: duration,
    sources,
    parts: partResults.map(part => buildLessonPart(part, sourceIds)),
  };
}

// ============================================================================
// Full lesson
// ============================================================================

/**
 * Runs the roundtable for every part and writes the draft to the drafts directory.
 * Returns null without writing anything when isAborted() becomes true.
 */
export async function runFullLessonRoundtable(
  cognitiveStream,
  { useLLM = false, onEvent = null, streamDelayMs = 0, isAborted = () => false, llm = null, persist = true } = {}
) {
  const videoId = cognitiveStream?.videoId === undefined || cognitiveStream?.videoId === null || cognitiveStream?.videoId === ''
    ? 'VECTO12'
    : cognitiveStream.videoId;
  // Validate the storage key before any work so an unsafe id never reaches generation or the write.
  const safeVideoId = assertSafeVideoId(videoId);
  const aborted = () => typeof isAborted === 'function' && isAborted();

  const partsConfig = partitionTimelineIntoParts(cognitiveStream);
  const generatedParts = [];

  for (const part of partsConfig) {
    if (aborted()) return null;
    const partResult = await runRoundtableForPart(part, { useLLM, onEvent, streamDelayMs, isAborted, llm });
    if (partResult === null || aborted()) return null;
    generatedParts.push(partResult);
  }

  if (generatedParts.length === 0) {
    throw new Error('Roundtable không sinh được Part nào từ CognitiveEventStream.');
  }

  const allCheckpoints = generatedParts.map(p => p.checkpoint);
  const crossCheckLogs = generatedParts
    .filter(p => p.crossCheckCorrectionOccurred)
    .map(p => ({
      partNumber: p.partNumber,
      checkpointSecond: p.checkpointSecond,
      rounds: p.crossCheckRounds,
      description: 'Trí bác bỏ đề xuất của Bo dựa trên kết quả tool, Bo sửa lại cho tới khi tool xác nhận bẫy khớp cơ chế ngộ nhận.',
    }));
  const allTimelineComments = generatedParts.flatMap(p =>
    p.scenarios.map((sc, idx) => ({
      id: `cmt_${p.partNumber}_${sc.actor}_${idx}`,
      second: Math.min(p.checkpointSecond + (sc.actor === 'colam' ? 0 : sc.actor === 'bo' ? 2 : 4), p.endSecond),
      author: AGENTS[sc.actor]?.split(' (')[0] || sc.actor,
      role: sc.actor === 'colam' ? 'teacher' : 'classmate',
      avatarId: sc.actor,
      text: sc.dialogue,
      isPinned: sc.actor === 'colam',
    }))
  );

  const lesson = buildLessonDraft({ ...cognitiveStream, videoId: safeVideoId }, generatedParts);
  const generation = mergeGeneration(generatedParts);

  const draftPackage = {
    lessonId: lesson.lesson_id,
    status: 'draft',
    title: lesson.title,
    teacherName: cognitiveStream.teacherName || 'Thầy Nguyễn Phan Tiến',
    subject: lesson.subject,
    durationSeconds: lesson.video_duration_s,
    approval: { status: 'draft', approvedByTeacher: false, reviewedBy: null, approvedAt: null },
    generation,
    lesson,
    parts: generatedParts,
    checkpoints: allCheckpoints,
    timelineComments: allTimelineComments,
    crossCheckLogs,
    allReasoningEvents: generatedParts.flatMap(p => p.reasoning_events),
    pedagogicalSummary: {
      totalParts: generatedParts.length,
      totalCheckpoints: allCheckpoints.length,
      totalTrapsIdentified: generatedParts.length,
      bloomMasteryTarget: 'Analyze (Mức 4/6)',
      approvedByTeacher: false,
      generatedAt: new Date().toISOString(),
    },
  };

  if (aborted()) return null;
  if (persist) {
    writeDraftFile(safeVideoId, draftPackage);
  }
  return draftPackage;
}

export default {
  runRoundtableForPart,
  runFullLessonRoundtable,
  partitionTimelineIntoParts,
  buildLessonDraft,
  assessTrapProposal,
};
