import { config } from '../config.js';
import { chatJSON } from '../openaiClient.js';
import { search as searchKb, getById as getKbById } from './knowledgeBase.js';
import { boChallenge, boRespondToRebuttal } from '../agents/bo.js';
import { coLamChotKienThuc, coLamConsult } from '../agents/colam.js';
import { triDeepThink } from '../agents/tri.js';
import { linhChiTakeNotes } from '../agents/linhchi.js';
import { minhKhangAnalogy } from '../agents/minhkhang.js';
import { taScaffoldSupport } from '../agents/ta.js';

/**
 * ============================================================================
 * AISDLC EPIC 4 - Issue #401: Runtime Intent Classifier & Dynamic Routing Dispatcher
 * Owner: An (@presentisperfect) | Reviewer: Blu (@blu1606)
 * ============================================================================
 */

export const INTENT_AGENT_MAP = {
  ask_formula_mnemonic: 'linhchi',
  ask_deep_concept: 'tri',
  challenge_shortcut_fallacy: 'bo',
  ask_scaffolding_help: 'an',
  sharp_rebuttal: 'bo', // primary is bo (concede), follow-up is colam (close)
  general_classroom_chitchat: 'minhkhang',
};

const AGENT_DISPLAY_NAMES = {
  bo: 'Bo',
  tri: 'Trí',
  linhchi: 'Linh Chi',
  minhkhang: 'Minh Khang',
  an: 'Trợ giảng An',
  colam: 'Cô Lam',
};

/**
 * Chuẩn hóa chuỗi tiếng Việt để so khớp regex / keyword chính xác
 */
function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Kiểm tra xem phản biện của học sinh có lý lẽ / căn cứ toán học thực sự hay không
 */
export function hasSubstantiatedMathReason(normText) {
  const norm = String(normText || '').toLowerCase();
  const mathReasonPatterns = [
    /cung huong/,
    /nguoc huong/,
    /nguoc chieu/,
    /khong bang 2/,
    /khong bang/,
    /bat dang thuc tam giac/,
    /tong hai canh/,
    /can 2/,
    /a\s*can\s*2/,
    /a\s*sqrt\s*2/,
    /goc giua/,
    /vecto doi/,
    /duong cheo/,
    /hinh binh hanh/,
    /trung diem/,
    /do dai tong chi bang tong do dai khi/,
    /khong the lay 1\s*\+\s*1/,
    /phai doi vecto/,
    /phai tinh vecto tong truoc/,
    /phai tong hop vecto/,
    /phai dung quy tac/,
    /do dai tong luon nho hon/,
  ];
  return mathReasonPatterns.some((pattern) => pattern.test(norm));
}

/**
 * TẦNG 1: Heuristic / Regex Fast-Path Classifier (0ms latency)
 */
export function classifyHeuristic(message, recipient = 'all') {
  const rawLower = String(message || '').toLowerCase().trim();
  const norm = normalizeText(message);

  // 1. Direct @mention overrides
  if (recipient === 'bo' || rawLower.includes('@bo') || /\b(chao bo|hoi bo|bo oi)\b/.test(rawLower)) {
    return {
      detectedIntent: 'challenge_shortcut_fallacy',
      dispatchedAgent: 'bo',
      confidence: 0.99,
      reasoning: 'Học sinh chủ động gọi tên hoặc chọn trao đổi với Bo (@bo).',
      fastPath: true,
    };
  }
  if (recipient === 'linhchi' || rawLower.includes('@linhchi') || /\b(linh chi|chi oi)\b/.test(rawLower)) {
    return {
      detectedIntent: 'ask_formula_mnemonic',
      dispatchedAgent: 'linhchi',
      confidence: 0.99,
      reasoning: 'Học sinh yêu cầu sổ tay ghi chép hoặc hỏi trực tiếp Linh Chi (@linhchi).',
      fastPath: true,
    };
  }
  if (recipient === 'tri' || rawLower.includes('@tri') || /\b(tri oi|hoi tri)\b/.test(rawLower)) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.99,
      reasoning: 'Học sinh hỏi trực tiếp bạn học Trí (@tri) để đào sâu bản chất.',
      fastPath: true,
    };
  }
  if (recipient === 'minhkhang' || rawLower.includes('@minhkhang') || /\b(minh khang|khang oi)\b/.test(rawLower)) {
    return {
      detectedIntent: 'general_classroom_chitchat',
      dispatchedAgent: 'minhkhang',
      confidence: 0.99,
      reasoning: 'Học sinh hỏi trực tiếp Minh Khang (@minhkhang) về ví dụ đời sống.',
      fastPath: true,
    };
  }
  if (recipient === 'an' || rawLower.includes('@an') || /\b(tro giang|ta an|an oi)\b/.test(rawLower)) {
    return {
      detectedIntent: 'ask_scaffolding_help',
      dispatchedAgent: 'an',
      confidence: 0.99,
      reasoning: 'Học sinh gọi Trợ giảng An (@an) xin định hướng/gợi ý.',
      fastPath: true,
    };
  }
  if (recipient === 'colam' || rawLower.includes('@colam') || /\b(co lam|thua co|co oi)\b/.test(rawLower)) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'colam',
      confidence: 0.95,
      reasoning: 'Học sinh hỏi Cô Lam (@colam) chốt bài.',
      fastPath: true,
    };
  }

  // 2. Câu hỏi thắc mắc / đối chiếu đúng sai / hỏi ý kiến -> KHÔNG PHẢI là sharp_rebuttal
  const isQuestioningRightWrong =
    /\b(dung hay|ai dung|ai sai|dung khong|sai khong|co dung khong|em noi|thac mac|giai thich cho|sao lai|the nao)\b/.test(norm) ||
    /\b(bo dung|bo co dung|bo sai khong|vay thi bo)\b/.test(norm);
  if (isQuestioningRightWrong) {
    if (norm.includes('thac mac') || norm.includes('giai thich cho')) {
      return {
        detectedIntent: 'challenge_shortcut_fallacy',
        dispatchedAgent: 'bo',
        confidence: 0.95,
        reasoning: 'Học sinh hỏi Bo đang thắc mắc chỗ nào để cùng trao đổi, Bo sẽ nêu câu hỏi bẫy ngộ nhận.',
        fastPath: true,
      };
    }
    if (norm.includes('em noi') || norm.includes('em tra loi') || norm.includes('dung khong co') || norm.includes('thua co')) {
      return {
        detectedIntent: 'ask_deep_concept',
        dispatchedAgent: 'colam',
        confidence: 0.95,
        reasoning: 'Học sinh hỏi Cô Lam xác nhận câu trả lời của mình có đúng không.',
        fastPath: true,
      };
    }
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.95,
      reasoning: 'Học sinh hỏi phân xử đúng/sai giữa các quan điểm, chuyển cho Trí phân tích bản chất.',
      fastPath: true,
    };
  }

  // 3. Phân biệt câu hỏi bản chất (ask_deep_concept) trước nếu có từ để hỏi nghi vấn
  const isQuestioningWhy = /\b(tai sao|vi sao|khi nao|lam sao de|ban chat|y nghia)\b/.test(norm);
  if (isQuestioningWhy) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.96,
      reasoning: 'Học sinh đặt câu hỏi nghi vấn tại sao/khi nào để đào sâu bản chất toán học.',
      fastPath: true,
    };
  }

  // 4. Keyword patterns: sharp_rebuttal (Phản biện sắc bén bẻ gãy bẫy Bo)
  const rebuttalPatterns = [
    /\b(bo sai roi|bo sai bet|bo nham|ban sai roi|cau sai roi)\b/,
    /\b(sai roi bo|sai roi ban|sai roi cau)\b/,
    /khong bang 2/,
    /khong bang/,
    /nguoc huong/,
    /cung huong moi bang/,
    /sau tru truoc/,
    /nguoc chieu/,
    /lon nguoc/,
    /bat dang thuc tam giac/,
    /tong hai canh phai lon hon/,
    /vecto doi/,
    /be gay/,
    /bang vecto 0/,
  ];
  if (rebuttalPatterns.some((pattern) => pattern.test(norm))) {
    if (hasSubstantiatedMathReason(norm)) {
      return {
        detectedIntent: 'sharp_rebuttal',
        dispatchedAgent: 'bo',
        confidence: 0.95,
        reasoning: 'Học sinh đưa ra lý lẽ phản biện sắc bén có dẫn chứng toán học chỉ rõ lỗi sai hoặc điều kiện biên của bẫy.',
        fastPath: true,
      };
    } else {
      return {
        detectedIntent: 'challenge_shortcut_fallacy',
        dispatchedAgent: 'bo',
        confidence: 0.95,
        reasoning: 'Học sinh bảo Bo sai nhưng chưa nêu lý do/chứng minh toán học, chuyển Bo phản biện lại.',
        fastPath: true,
        unsubstantiatedRebuttal: true,
      };
    }
  }

  // 4. Keyword patterns: ask_scaffolding_help (Bế tắc, xin gợi ý)
  const scaffoldingPatterns = [
    /goi y/,
    /bi qua/,
    /chua hieu/,
    /cuu em/,
    /khong biet lam/,
    /kho qua/,
    /bat dau tu dau/,
    /buoc 1/,
    /chua ro/,
    /help/,
    /scaffold/,
  ];
  if (scaffoldingPatterns.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'ask_scaffolding_help',
      dispatchedAgent: 'an',
      confidence: 0.93,
      reasoning: 'Học sinh gặp khó khăn, xin gợi ý từng bước mà không muốn nhận đáp án trực tiếp.',
      fastPath: true,
    };
  }

  // 5. Keyword patterns: ask_formula_mnemonic (Hỏi công thức, sổ tay, checklist)
  const formulaPatterns = [
    /cong thuc/,
    /so tay/,
    /meo nho/,
    /ghi nho/,
    /quy tac 3 diem/,
    /quy tac hinh hop/,
    /quy tac hinh binh hanh/,
    /quy tac tru/,
    /checklist/,
    /dieu kien xac dinh/,
    /dkxd/,
    /tich vo huong bang gi/,
  ];
  if (formulaPatterns.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'ask_formula_mnemonic',
      dispatchedAgent: 'linhchi',
      confidence: 0.92,
      reasoning: 'Học sinh hỏi công thức chuẩn, quy tắc hoặc cần mở sổ tay ghi nhớ của Linh Chi.',
      fastPath: true,
    };
  }

  // 6. Keyword patterns: challenge_shortcut_fallacy (Làm tắt, ngộ nhận sai)
  const shortcutPatterns = [
    /cong dai/,
    /lay luon/,
    /the so/,
    /bam may/,
    /casio/,
    /ve hinh chi/,
    /cho nhanh/,
    /cho le/,
    /lam tat/,
    /do met/,
    /1\s*\+\s*1\s*=\s*2/,
  ];
  if (shortcutPatterns.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'challenge_shortcut_fallacy',
      dispatchedAgent: 'bo',
      confidence: 0.92,
      reasoning: 'Học sinh đưa ra cách làm tắt hoặc rơi vào ngộ nhận; chuyển cho Bo làm đồng minh ngộ nhận.',
      fastPath: true,
    };
  }

  // 7. Keyword patterns: ask_deep_concept (Đào sâu bản chất, giải thích giùm)
  const deepConceptPatterns = [
    /chung minh/,
    /giai thich gium/,
    /giai thich giup/,
    /giai thich ho/,
    /dieu kien bien/,
    /vecto chi phuong/,
    /goc giua hai vecto/,
  ];
  if (deepConceptPatterns.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.92,
      reasoning: 'Học sinh đặt câu hỏi đào sâu nguyên lý "tại sao" và bản chất hình học không gian.',
      fastPath: true,
    };
  }

  // 8. Keyword patterns: general_classroom_chitchat (Giao lưu ngoài lề / đời sống)
  const chitchatPatterns = [
    /chao/,
    /hello/,
    /hi ca lop/,
    /an com/,
    /troi dep/,
    /met qua/,
    /vui qua/,
    /thay tien/,
    /doi song/,
    /thuc te/,
    /vi du ngoai doi/,
  ];
  if (chitchatPatterns.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'general_classroom_chitchat',
      dispatchedAgent: 'minhkhang',
      confidence: 0.90,
      reasoning: 'Học sinh trò chuyện giao lưu ngoài lề hoặc hỏi về ví dụ đời sống thực tế.',
      fastPath: true,
    };
  }

  // Default fallback for heuristic: Trí đào sâu nếu có dấu hỏi, ngược lại chuyển Minh Khang
  if (rawLower.includes('?')) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.70,
      reasoning: 'Câu hỏi nghi vấn chưa phân loại rõ, mặc định định tuyến đến Trí để phân tích bản chất.',
      fastPath: false,
    };
  }

  return {
    detectedIntent: 'general_classroom_chitchat',
    dispatchedAgent: 'minhkhang',
    confidence: 0.65,
    reasoning: 'Trao đổi lớp học thông thường.',
    fastPath: false,
  };
}

/**
 * TẦNG 2: LLM Intent Classifier với Few-Shot Prompting
 */
export async function classifyWithLLM(message, currentTime = 2233) {
  const m = Math.floor(currentTime / 60);
  const s = Math.floor(currentTime % 60);
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  const CLASSIFIER_PROMPT = `
Bạn là "Runtime Intent Classifier & Dynamic Routing Dispatcher" cho lớp học AI đa tác nhân DRE Toán 12 (bài giảng Thầy Nguyễn Phan Tiến).
Nhiệm vụ: Phân tích ý định sư phạm của học sinh và chọn ĐÚNG bạn học AI phù hợp nhất.

DANH SÁCH 6 LOẠI Ý ĐỊNH (LearnerIntentType) VÀ AGENT TƯƠNG ỨNG:
1. "ask_formula_mnemonic" -> "linhchi": Học sinh hỏi công thức chuẩn, quy tắc (quy tắc 3 điểm, hình hộp, hình bình hành), mẹo nhớ nhanh, checklist.
2. "ask_deep_concept" -> "tri": Học sinh hỏi "tại sao", hỏi bản chất hình học, điều kiện biên, bất đẳng thức tam giác, tích vô hướng.
3. "challenge_shortcut_fallacy" -> "bo": Học sinh đưa ra cách làm tắt, ngộ nhận sai (lấy 1+1=2, cộng trực tiếp độ dài, bấm máy tính cho lẹ).
4. "ask_scaffolding_help" -> "an": Học sinh bế tắc ("bí quá", "chưa hiểu", "cho em gợi ý", "bắt đầu từ đâu").
5. "sharp_rebuttal" -> "bo": Học sinh phản biện sắc bén, chỉ ra Bo sai ở đâu, giải thích được nguyên nhân gốc.
6. "general_classroom_chitchat" -> "minhkhang" (hoặc "bo"): Trò chuyện ngoài lề lớp học, hỏi ví dụ thực tế đời sống.

CÂU MẪU THAM KHẢO (FEW-SHOT):
- "Linh Chi cho mình xin công thức cộng vectơ hình bình hành" -> {"detectedIntent": "ask_formula_mnemonic", "dispatchedAgent": "linhchi", "confidence": 0.98, "reasoning": "Hỏi công thức quy tắc hình bình hành"}
- "Tại sao độ dài tổng không bằng tổng độ dài vậy bạn?" -> {"detectedIntent": "ask_deep_concept", "dispatchedAgent": "tri", "confidence": 0.96, "reasoning": "Hỏi bản chất đại số và hình học của độ dài"}
- "Cứ lấy độ dài cộng thẳng cho nhanh, vẽ hình chi cho mệt" -> {"detectedIntent": "challenge_shortcut_fallacy", "dispatchedAgent": "bo", "confidence": 0.95, "reasoning": "Đưa ra cách làm tắt sai lầm"}
- "Em bí quá chưa biết bắt đầu từ đâu, cho em xin một gợi ý với" -> {"detectedIntent": "ask_scaffolding_help", "dispatchedAgent": "an", "confidence": 0.97, "reasoning": "Học sinh xin gợi ý bậc thang"}
- "Bo sai rồi, độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi!" -> {"detectedIntent": "sharp_rebuttal", "dispatchedAgent": "bo", "confidence": 0.99, "reasoning": "Phản biện chính xác điều kiện biên của bẫy Bo"}
- "Hôm nay trời đẹp ghê ha các bạn" -> {"detectedIntent": "general_classroom_chitchat", "dispatchedAgent": "minhkhang", "confidence": 0.95, "reasoning": "Giao lưu ngoài lề lớp học"}

QUY TẮC BẮT BUỘC:
- Luôn trả về ĐÚNG JSON:
{
  "detectedIntent": "ask_formula_mnemonic" | "ask_deep_concept" | "challenge_shortcut_fallacy" | "ask_scaffolding_help" | "sharp_rebuttal" | "general_classroom_chitchat",
  "dispatchedAgent": "bo" | "tri" | "linhchi" | "minhkhang" | "an" | "colam",
  "confidence": 0.0 - 1.0,
  "reasoning": "<1 câu ngắn giải thích lý do chọn>"
}
`.trim();

  return chatJSON({
    model: config.models.assessor, // Dùng gpt-6-sol nhanh, chuẩn xác
    systemPrompt: CLASSIFIER_PROMPT,
    userPayload: {
      student_message: message,
      current_time: timeStr,
    },
    temperature: 0.1,
  });
}

/**
 * Điều phối chính: Kết hợp Hybrid 2 tầng (Fast Heuristic -> LLM Classifier -> Safe Fallback)
 */
export async function classifyLearnerIntent({ message, currentTime = 2233, recipient = 'all', useLLM = true }) {
  // 1. Kiểm tra Fast-Path trước (0ms latency cho @mention và keyword rõ ràng)
  const heuristic = classifyHeuristic(message, recipient);
  if (heuristic.fastPath || !useLLM) {
    return heuristic;
  }

  // 2. Chạy LLM Classifier cho câu văn tự do
  try {
    const verdict = await classifyWithLLM(message, currentTime);
    const validIntents = Object.keys(INTENT_AGENT_MAP);
    if (verdict && validIntents.includes(verdict.detectedIntent)) {
      return {
        detectedIntent: verdict.detectedIntent,
        dispatchedAgent: verdict.dispatchedAgent || INTENT_AGENT_MAP[verdict.detectedIntent],
        confidence: typeof verdict.confidence === 'number' ? verdict.confidence : 0.90,
        reasoning: verdict.reasoning || 'Định tuyến bằng LLM Few-Shot Intent Classifier.',
        llmUsed: true,
      };
    }
  } catch (err) {
    console.warn('[Dispatcher] LLM classification fallback to heuristic:', err.message);
  }

  // 3. Fallback an toàn nếu LLM lỗi hoặc trả về sai cấu trúc
  return {
    ...heuristic,
    fallbackUsed: true,
  };
}

/**
 * RUNTIME DISPATCHER ENGINE:
 * Nhận message -> phân loại intent -> truy vấn RAG -> gọi Agent tương ứng -> trả kết quả hoàn chỉnh
 * Có cơ chế Graceful Fallback hoàn toàn, không bao giờ crash nếu OpenAI gặp sự cố / offline!
 */
export async function dispatchMessage({
  message,
  currentTime = 2233,
  lessonTitle = 'Toán 12 — Vectơ trong không gian',
  sessionId = null,
  recipient = 'all',
  useLLM = true,
}) {
  const t0 = Date.now();

  // 1. Phân loại Intent & Chọn Agent
  const verdict = await classifyLearnerIntent({
    message,
    currentTime,
    recipient,
    useLLM,
  });

  // 2. Truy vấn RAG Knowledge Base để lấy ngữ cảnh sư phạm
  let kbMatch = null;
  const searchHits = searchKb(message, 1);
  if (searchHits && searchHits.length > 0) {
    kbMatch = searchHits[0];
  } else if (currentTime >= 2100 && currentTime <= 2400) {
    kbMatch = getKbById('MISC_VEC_005');
  }

  const m = Math.floor(currentTime / 60);
  const s = Math.floor(currentTime % 60);
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  const mathProblem = kbMatch?.misconception?.title || lessonTitle;
  const targetAgent = verdict.dispatchedAgent;

  let primaryResponse = null;
  let followUpResponse = null;

  // 3. Thực thi Agent theo Ý định với Try-Catch an toàn
  if (verdict.detectedIntent === 'sharp_rebuttal') {
    // CHUỖI LIÊN HOÀN (Chained Sequence): Bo nhận thua -> Cô Lam chốt kiến thức
    let boText = 'Ủa... ừ ha! Cậu nói đúng rồi, tớ quên mất điều kiện cùng hướng! Phục cậu thật đó!';
    let coLamText = 'Rất xuất sắc! Bạn đã chỉ ra chính xác bản chất bất đẳng thức tam giác trong vectơ. Cả lớp nhớ ghi quy tắc vàng này vào vở nhé!';

    if (useLLM) {
      try {
        const boResult = await boRespondToRebuttal({
          baiToan: mathProblem,
          phanBienHocVien: message,
          danhGiaPhanBien: 'sac_ben',
        });
        if (boResult?.dialogue) boText = boResult.dialogue;

        const coLamResult = await coLamChotKienThuc({
          baiToan: mathProblem,
          giaiThichChuan: kbMatch?.misconception?.correction || 'Độ dài của tổng hai vectơ chỉ bằng tổng độ dài khi hai vectơ cùng hướng.',
        });
        if (coLamResult?.dialogue) coLamText = coLamResult.dialogue;
      } catch (err) {
        console.warn('[Dispatcher] LLM agent call fallback to safe template:', err.message);
      }
    }

    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.bo,
      avatarId: 'bo',
      text: boText,
    };

    followUpResponse = {
      author: AGENT_DISPLAY_NAMES.colam,
      avatarId: 'colam',
      text: coLamText,
    };
  } else if (targetAgent === 'linhchi' || verdict.detectedIntent === 'ask_formula_mnemonic') {
    let lcText = 'Tớ mở sổ tay cho cậu xem này: Hãy nhớ kiểm tra thứ tự điểm và quy tắc chèn điểm chung gốc nhé!';
    let cheatSheet = ['Bước 1: Xác định điểm gốc chung', 'Bước 2: Áp dụng quy tắc hình bình hành hoặc 3 điểm', 'Bước 3: Kiểm tra hướng vectơ'];

    if (useLLM) {
      try {
        const lcResult = await linhChiTakeNotes({
          baiToan: mathProblem,
          chuDe: lessonTitle,
          cauHoiHocVien: message,
        });
        if (lcResult?.dialogue) lcText = lcResult.dialogue;
        if (lcResult?.cheatSheetSteps) cheatSheet = lcResult.cheatSheetSteps;
      } catch (err) {
        console.warn('[Dispatcher] Linh Chi LLM fallback:', err.message);
      }
    }

    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.linhchi,
      avatarId: 'linhchi',
      text: lcText,
      cheatSheetSteps: cheatSheet,
    };
  } else if (targetAgent === 'an' || verdict.detectedIntent === 'ask_scaffolding_help') {
    let anText = 'Đừng nản nhé! Gợi ý nhỏ cho bạn: Hãy thử vẽ phác hai vectơ chung gốc hoặc xem lại điều kiện cùng hướng xem sao!';
    let step = 'Vẽ hình minh hoạ hai vectơ trên mặt phẳng nháp';

    if (useLLM) {
      try {
        const taResult = await taScaffoldSupport({
          baiToan: mathProblem,
          chuDe: lessonTitle,
          cauHoiHocVien: message,
          goiY1: kbMatch?.misconception?.scaffolding?.[0]?.question || 'Thử xem hai vectơ này có cùng hướng hay không?',
          goiY2: kbMatch?.misconception?.scaffolding?.[1]?.question || 'Quan sát tam giác tạo bởi hai vectơ.',
          level: 1,
        });
        if (taResult?.dialogue) anText = taResult.dialogue;
        if (taResult?.suggestedStep) step = taResult.suggestedStep;
      } catch (err) {
        console.warn('[Dispatcher] TA An LLM fallback:', err.message);
      }
    }

    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.an,
      avatarId: 'an',
      text: anText,
      suggestedStep: step,
    };
  } else if (targetAgent === 'bo' || verdict.detectedIntent === 'challenge_shortcut_fallacy') {
    const norm = normalizeText(message);
    const isAskingBoConfusion = norm.includes('thac mac') || norm.includes('giai thich cho') || norm.includes('cau nao') || norm.includes('hoi gi');
    const isUnsubstantiated = verdict.unsubstantiatedRebuttal || (/\b(sai roi|bo sai|ban sai|nham roi)\b/.test(norm) && !hasSubstantiatedMathReason(norm));

    let boText = 'Cứ lấy số cộng vào cho lẹ, hơi đâu vẽ hình chi cho rắc rối đúng không cậu? Nhưng coi chừng Thầy Tiến gài bẫy đó nha!';
    let mode = 'shortcut_fallacy';

    if (isAskingBoConfusion) {
      boText = 'A, cậu hỏi đúng lúc ghê! Tớ đang lấn cấn ở Ví dụ 3 nè: Cạnh hình lập phương bằng 1, thì |BC| = 1, |DD\'| = 1, sao mình không cộng thẳng 1 + 1 = 2 luôn cho nhanh, mà Thầy Tiến lại phải dời vectơ rồi tính đường chéo làm gì cho cực vậy cậu?';
      mode = 'misconception_inquiry';
    } else if (isUnsubstantiated) {
      boText = 'Ủa, tớ sai chỗ nào cơ chứ? Cậu chỉ bảo "sai rồi" mà không chỉ ra lý do tại sao sai thì tớ chưa phục đâu nha! Cậu chứng minh thử xem tại sao |BC + DD\'| không bằng 1 + 1 = 2 xem nào?';
      mode = 'skeptic_pushback';
    } else if (useLLM) {
      try {
        const boResult = await boChallenge({
          baiToan: mathProblem,
          cauTraLoiHocVien: message,
          danhGia: 'dung',
          loaiBay: 'shortcut_fallacy',
          giaiThichChuan: kbMatch?.misconception?.correction || 'Cộng độ dài trực tiếp là sai lầm phổ biến.',
        });
        if (boResult?.dialogue) boText = boResult.dialogue;
        if (boResult?.mode) mode = boResult.mode;
      } catch (err) {
        console.warn('[Dispatcher] Bo LLM fallback:', err.message);
      }
    }

    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.bo,
      avatarId: 'bo',
      text: boText,
      mode,
    };
  } else if (targetAgent === 'colam') {
    let coLamText = 'Cô khen ngợi tinh thần học hỏi và câu trả lời rất tự tin của em nhé! Khi em nắm vững nguyên lý bất đẳng thức tam giác và hướng của vectơ, em sẽ nhận diện được ngay những lỗi ngộ nhận như của bạn Bo. Cố gắng phát huy nhé!';
    let bloomResult = null;

    if (useLLM) {
      try {
        const clRes = await coLamConsult({
          cauHoiHocVien: message,
          baiToan: mathProblem,
          chuDe: lessonTitle,
        });
        if (clRes?.dialogue) coLamText = clRes.dialogue;
        if (clRes?.toolCall) bloomResult = clRes.toolCall;
      } catch (err) {
        console.warn('[Dispatcher] Co Lam LLM fallback:', err.message);
      }
    }

    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.colam,
      avatarId: 'colam',
      text: coLamText,
      toolCall: bloomResult,
    };
  } else if (targetAgent === 'minhkhang' || verdict.detectedIntent === 'general_classroom_chitchat') {
    let mkText = 'Chào bạn nha! Cùng tập trung vào bài giảng của Thầy Tiến nào, phần này cực kỳ quan trọng cho kỳ thi đó!';
    let analogy = 'Dòng nước đẩy thuyền chạy xuôi dòng hoặc ngược dòng';

    if (useLLM) {
      try {
        const mkResult = await minhKhangAnalogy({
          baiToan: mathProblem,
          chuDe: lessonTitle,
          cauHoiHocVien: message,
        });
        if (mkResult?.dialogue) mkText = mkResult.dialogue;
        if (mkResult?.realLifeAnalogy) analogy = mkResult.realLifeAnalogy;
      } catch (err) {
        console.warn('[Dispatcher] Minh Khang LLM fallback:', err.message);
      }
    }

    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.minhkhang,
      avatarId: 'minhkhang',
      text: mkText,
      realLifeAnalogy: analogy,
    };
  } else {
    // Default to Trí (Deep Thinker)
    const norm = normalizeText(message);
    const isAskingWhoIsRight = /\b(dung hay sai|ai dung|ai sai|bo dung khong|bo co dung khong)\b/.test(norm);
    let triText = isAskingWhoIsRight
      ? 'Bo sai rồi bạn nhé! Bo đã mắc ngộ nhận cộng trực tiếp độ dài: |BC + DD\'| = 1 + 1 = 2. Thực tế, theo bất đẳng thức tam giác, |a + b| <= |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Ở đây BC và DD\' vuông góc nhau nên phải dời vectơ và tính đường chéo ra √2 mới đúng!'
      : 'Theo tớ, bản chất của phép toán này nằm ở hướng của vectơ. Vectơ vừa có độ lớn vừa có hướng, nên |a + b| <= |a| + |b|, dấu bằng chỉ xảy ra khi a và b cùng hướng.';
    let concept = 'Bất đẳng thức tam giác trong vectơ';

    if (useLLM) {
      try {
        const triResult = await triDeepThink({
          baiToan: mathProblem,
          chuDe: lessonTitle,
          cauHoiHocVien: message,
          loiBoGiai: kbMatch?.misconception?.incorrect_claim || 'Cộng trực tiếp độ dài 1 + 1 = 2',
        });
        if (triResult?.dialogue) triText = triResult.dialogue;
        if (triResult?.focusConcept) concept = triResult.focusConcept;
      } catch (err) {
        console.warn('[Dispatcher] Tri LLM fallback:', err.message);
      }
    }

    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.tri,
      avatarId: 'tri',
      text: triText,
      focusConcept: concept,
    };
  }

  const latencyMs = Date.now() - t0;

  return {
    ok: true,
    verdict,
    primaryResponse,
    followUpResponse,
    ragContextUsed: kbMatch
      ? {
          misconceptionId: kbMatch.misconception.id,
          title: kbMatch.misconception.title,
          correction: kbMatch.misconception.correction,
        }
      : null,
    latencyMs,
    currentTimeStr: timeStr,
    timestamp: new Date().toISOString(),
  };
}

export default {
  INTENT_AGENT_MAP,
  classifyHeuristic,
  classifyWithLLM,
  classifyLearnerIntent,
  dispatchMessage,
};
