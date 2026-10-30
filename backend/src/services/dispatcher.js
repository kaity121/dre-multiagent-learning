import { config } from '../config.js';
import { chatJSON } from '../openaiClient.js';
import { search as searchKb, getById as getKbById } from './knowledgeBase.js';
import { boChallenge, boRespondToRebuttal } from '../agents/bo.js';
import { coLamChotKienThuc, coLamConsult } from '../agents/colam.js';
import { triDeepThink } from '../agents/tri.js';
import { linhChiTakeNotes } from '../agents/linhchi.js';
import { minhKhangAnalogy } from '../agents/minhkhang.js';
import { taScaffoldSupport } from '../agents/ta.js';
import { chamPhanBien } from '../agents/assessor.js';
import { getOrCreateSession, logActivityEvent } from '../sessionStore.js';
import { executeTool } from '../tools/index.js';
import { extractVectorExpr, extractClaimFromText, extractSideFromText } from '../tools/tool_verify_vector_algebra.js';
import { buildRuntimeContext, resolveLessonSubject } from './contextSnapshot.js';

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
  encourage_study_focus: 'minhkhang',
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
export function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Kiểm tra xem phản biện của học sinh có lý lẽ / căn cứ toán học thực sự hay không.
 * ĐÃ LOẠI BỎ /khong bang/ và /khong bang 2/ để tránh Bo nhận thua tùy tiện.
 * ĐÃ THÊM kiểm tra an toàn loại trừ các phát biểu toán sai (vd: "cùng hướng thì độ dài tổng luôn bằng 0").
 */
export function hasSubstantiatedMathReason(normText) {
  const norm = String(normText || '').toLowerCase();

  // Kiểm tra an toàn: các phát biểu toán sai không được chứng nhận là sắc bén
  if (/cung huong.*(bang 0|luon bang 0)/.test(norm)) return false;
  if (/tong luon bang 0/.test(norm) && !/vecto doi/.test(norm)) return false;

  const mathReasonPatterns = [
    /cung huong moi bang/,
    /chi.*cung huong/,
    /khi.*cung huong.*(moi|thi).*bang/,
    /cung huong.*moi.*cong/,
    /bat dang thuc tam giac/,
    /tong hai canh phai lon hon/,
    /tong hai canh/,
    /can 2/,
    /a\s*can\s*2/,
    /a\s*sqrt\s*2/,
    /sqrt\s*2/,
    /2\s*sqrt\s*2/,
    /2\s*can\s*2/,
    /goc giua/,
    /vecto doi/,
    /duong cheo/,
    /mat ben/,
    /hinh hop/,
    /hinh binh hanh/,
    /trung diem/,
    /do dai tong chi bang tong do dai khi/,
    /khong the lay 1\s*\+\s*1/,
    /khong phai 1\s*\+\s*1/,
    /phai doi vecto/,
    /phai tinh vecto tong truoc/,
    /phai tong hop vecto/,
    /phai dung quy tac/,
    /do dai tong luon nho hon/,
    /vuong goc/,
    /pytago/,
    /pythagore/,
    /thay dd.*=.*cc/,
    /dd.*=.*cc/,
    /dd'.*=.*cc'/,
    /noi tiep/,
    /chieu mat ben/,
    /bang vecto 0/,
  ];
  return mathReasonPatterns.some((pattern) => pattern.test(norm));
}

/**
 * Cung cấp ngữ cảnh bài giảng theo mốc thời gian video và videoId (Issue #30)
 */
export function getVideoLectureContext(currentTime, videoId = 'VID_VECTO_12_TIEN') {
  const sec = Number(currentTime) || 0;
  if (videoId && videoId !== 'VID_VECTO_12_TIEN') {
    const stream = getLessonIndex(videoId);
    if (stream) {
      const boardState = getBoardStateAt(videoId, sec, 60);
      const seg = boardState?.segment || stream.segments?.[0];
      return {
        segment: seg?.id || 'seg_general',
        title: stream.videoTitle,
        keyConcept: seg?.blackboardText || seg?.audioTranscript || stream.subject,
        commonMisconception: seg?.trapRiskLevel === 'high' ? 'Điểm lưu ý/ngộ nhận của bài học' : undefined,
      };
    }
  }
  if (sec < 75) { // 0:00 - 1:15
    return {
      segment: 'intro_2d_to_3d',
      title: 'Giới thiệu & Mở rộng từ 2D lên 3D',
      keyConcept: 'Chiều thứ 3 (trục Z, độ cao, không gian 3 chiều)',
      commonMisconception: 'Nghĩ rằng vectơ không gian giống hệt 2D phẳng, không có gì mới.',
    };
  }
  if (sec < 175) { // 1:15 - 2:55
    return {
      segment: 'vector_definition',
      title: 'Định nghĩa Vectơ trong không gian',
      keyConcept: 'Đoạn thẳng có hướng: Điểm đầu (gốc), Điểm cuối (ngọn), Ký hiệu vectơ AB. AB ≠ BA.',
      commonMisconception: 'Nhầm đoạn thẳng vô hướng (AB = BA) với vectơ có hướng (vectơ AB = - vectơ BA).',
    };
  }
  if (sec < 255) { // 2:55 - 4:15
    return {
      segment: 'line_of_vector',
      title: 'Giá của Vectơ',
      keyConcept: 'Giá của vectơ AB là đường thẳng vô hạn đi qua hai điểm A và B. Không phải giá trị số, không phải độ dài.',
      commonMisconception: 'Nghĩ "giá" là "giá trị" hoặc "độ dài" của vectơ, hoặc đùa "giá đỗ".',
    };
  }
  if (sec < 330) { // 4:15 - 5:30
    return {
      segment: 'collinear_vectors',
      title: 'Vectơ cùng phương và cùng hướng',
      keyConcept: 'Cùng phương = giá song song hoặc trùng nhau. Chỉ khi cùng phương mới xét cùng hướng hoặc ngược hướng.',
      commonMisconception: 'Hai vectơ có đường thẳng chéo nhau trong 3D thì không cùng phương, không có khái niệm cùng hay ngược chiều.',
    };
  }
  if (sec < 690) { // 5:30 - 11:30
    return {
      segment: 'zero_vector',
      title: 'Vectơ-không và Độ dời',
      keyConcept: 'Vectơ-không có điểm đầu trùng điểm cuối (vectơ AA = 0), độ dài bằng 0. Quãng đường s > 0 nhưng độ dời = 0.',
      commonMisconception: 'Đi một vòng rồi về chỗ cũ có quãng đường > 0 nên thắc mắc tại sao vectơ lại bằng 0.',
    };
  }
  if (sec < 1350) { // 11:30 - 22:30
    return {
      segment: 'equal_vectors',
      title: 'Hai vectơ bằng nhau trong không gian',
      keyConcept: 'Hai vectơ bằng nhau khi cùng hướng VÀ cùng độ dài. Có thể tịnh tiến tự do trong không gian.',
      commonMisconception: 'Chỉ cần cùng độ dài là kết luận bằng nhau mà bỏ qua hướng.',
    };
  }
  if (sec < 2233) { // 22:30 - 37:13
    return {
      segment: 'vector_addition_rules',
      title: 'Phép cộng vectơ: Quy tắc 3 điểm & Quy tắc hình bình hành / hình hộp',
      keyConcept: 'Quy tắc 3 điểm (nối tiếp): AB + BC = AC. Quy tắc hình hộp: AB + AD + AA\' = AC\'.',
      commonMisconception: 'Cộng tuỳ tiện không đúng đỉnh chung hoặc không nối tiếp.',
    };
  }
  if (sec < 3134) { // 37:13 - 52:14
    return {
      segment: 'example_3_sum_trap',
      title: 'Ví dụ 3: Độ dài tổng vectơ & Bất đẳng thức tam giác',
      keyConcept: '|a + b| ≤ |a| + |b|, dấu bằng chỉ khi a và b cùng hướng. Không được tách độ dài tổng thành tổng hai độ dài.',
      commonMisconception: 'Nghĩ 1+1=2 là chân lý nên tách |BC + DD\'| = |BC| + |DD\'| = 1 + 1 = 2; thắc mắc sao Thầy Tiến gạch bỏ.',
    };
  }
  return { // 52:14+
    segment: 'vector_subtraction_rules',
    title: 'Phép trừ vectơ & Nhân vectơ với một số',
    keyConcept: 'Quy tắc hiệu: "Chung đầu - Lộn ngược" (AB - AC = CB).',
    commonMisconception: 'Trừ vectơ lấy nhầm ngọn trước trừ gốc sau hoặc ngược chiều.',
  };
}

/**
 * TẦNG 1: Heuristic / Regex Classifier
 * - fastPath: true CHỈ ĐƯỢC BẬT KHI có @mention rõ ràng (@bo, @tri, ...) hoặc recipient !== 'all'.
 * - Các câu tự do để fastPath: false để LLM Classifier phân loại ngữ cảnh khi useLLM = true.
 */
export function classifyHeuristic(message, recipient = 'all') {
  const rawLower = String(message || '').toLowerCase().trim();
  const norm = normalizeText(message);

  // Kiểm tra đích danh @mention hoặc người nhận riêng biệt
  const hasExplicitMention = recipient !== 'all' || /@(bo|tri|linhchi|minhkhang|an|colam)\b/i.test(rawLower);

  // 1. Nhận diện câu hỏi ngoài lề (Off-topic): Thể thao, Quả bóng vàng, Cầu thủ, Chính trị, Game, Đời sống...
  const offTopicPatterns = [
    /\b(qua bong vang|ballon d'?or|bong da|cau thu|ronaldo|messi|bellingham|vinicius|mbappe|rodri|ngoai hang anh|champions league|world cup)\b/,
    /\b(tong thong|bau cu|trump|donald trump|biden|chinh tri)\b/,
    /\b(game|choi game|lien quan|toc chien|free fire|pubg|dota|csgo|fifa)\b/,
    /\b(dien vien|ca si|idol|showbiz|rap viet|tiktok)\b/,
  ];
  if (offTopicPatterns.some((pattern) => pattern.test(norm))) {
    const isTargetingBo = recipient === 'bo' || rawLower.includes('@bo');
    return {
      detectedIntent: 'encourage_study_focus',
      dispatchedAgent: isTargetingBo ? 'bo' : 'minhkhang',
      confidence: 0.98,
      reasoning: 'Học sinh hỏi chủ đề ngoài lề (thể thao, đời sống, người nổi tiếng); Minh Khang giải đáp ngắn gọn và khéo léo kéo học sinh quay lại bài học.',
      fastPath: hasExplicitMention,
      isOffTopic: true,
    };
  }

  // 2. Nhận diện học sinh xao nhãng, rủ đi chơi, chán học, muốn bỏ cuộc -> Kéo về bài học & Khích lệ
  const distractionPatterns = [
    /\b(di choi|di net|di game|di ngu|di an|da banh|di ca phe|di luon|tron hoc)\b/,
    /\b(hoc hanh gi|hoc lam gi|khong hoc nua|nghi thoi|nghi hoc|bo hoc|nghi di)\b/,
    /\b(chan qua|chan hoc|luoi qua|luoi hoc|nan qua|met qua nghi|khong them hoc)\b/,
    /\b(bo qua di|ke di|dep di|tat video|out thoi|thoat thoi)\b/,
  ];
  if (distractionPatterns.some((pattern) => pattern.test(norm))) {
    const isTargetingBo = recipient === 'bo' || rawLower.includes('@bo') || /\bbo\s+oi\b/.test(norm) || norm.includes('voi bo');
    return {
      detectedIntent: 'encourage_study_focus',
      dispatchedAgent: isTargetingBo ? 'bo' : 'minhkhang',
      confidence: 0.98,
      reasoning: 'Học sinh có biểu hiện xao nhãng hoặc rủ đi chơi; kích hoạt Bo từ chối lém lỉnh và Cô Lam chấn chỉnh, khích lệ quay lại bài học.',
      fastPath: hasExplicitMention,
      isDistraction: true,
    };
  }

  // Direct agent targeting ưu tiên cao khi học sinh gọi đích danh tên bạn học hoặc @mention
  const isTargetLinhChi = recipient === 'linhchi' || rawLower.includes('@linhchi') || /\b(linh chi|chi oi|hoi linh chi|chao linh chi)\b/.test(norm);
  if (isTargetLinhChi) {
    return {
      detectedIntent: 'ask_formula_mnemonic',
      dispatchedAgent: 'linhchi',
      confidence: 0.99,
      reasoning: 'Học sinh yêu cầu sổ tay ghi chép hoặc hỏi trực tiếp Linh Chi (@linhchi).',
      fastPath: hasExplicitMention,
    };
  }
  const isTargetMinhKhang = recipient === 'minhkhang' || rawLower.includes('@minhkhang') || /\b(minh khang|khang oi|chao khang|chao minh khang)\b/.test(norm);
  if (isTargetMinhKhang) {
    return {
      detectedIntent: 'general_classroom_chitchat',
      dispatchedAgent: 'minhkhang',
      confidence: 0.99,
      reasoning: 'Học sinh hỏi trực tiếp Minh Khang (@minhkhang) về ví dụ đời sống.',
      fastPath: hasExplicitMention,
    };
  }
  const isTargetAn = recipient === 'an' || rawLower.includes('@an') || /\b(tro giang|ta an|an oi|chao an|chao tro giang)\b/.test(norm);
  if (isTargetAn) {
    return {
      detectedIntent: 'ask_scaffolding_help',
      dispatchedAgent: 'an',
      confidence: 0.99,
      reasoning: 'Học sinh gọi Trợ giảng An (@an) xin định hướng/gợi ý.',
      fastPath: hasExplicitMention,
    };
  }
  const isTargetCoLam = recipient === 'colam' || rawLower.includes('@colam') || /\b(co lam|thua co|co oi|chao co)\b/.test(norm);
  if (isTargetCoLam) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'colam',
      confidence: 0.95,
      reasoning: 'Học sinh hỏi Cô Lam (@colam) chốt bài.',
      fastPath: hasExplicitMention,
    };
  }

  // 3. Quy tắc / Sổ tay / Công thức -> Ưu tiên Linh Chi trước khi rơi vào các câu hỏi nghi vấn chung
  const formulaPatternsEarly = [
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
  if (formulaPatternsEarly.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'ask_formula_mnemonic',
      dispatchedAgent: 'linhchi',
      confidence: 0.92,
      reasoning: 'Học sinh hỏi công thức chuẩn, quy tắc hoặc cần mở sổ tay ghi nhớ của Linh Chi.',
      fastPath: hasExplicitMention,
    };
  }

  // 4. Nhận diện câu hỏi nghi vấn bản chất (khi nào, tại sao, vì sao) -> chuyển cho Trí
  const isQuestionWhyOrWhen = /\b(khi nao|tai sao|vi sao|sao lai|la gi)\b/.test(norm) && !norm.includes('sai') && !norm.includes('khong dung') && !norm.includes('khong bang');
  if (isQuestionWhyOrWhen) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.96,
      reasoning: 'Học sinh đặt câu hỏi nghi vấn tại sao/khi nào để đào sâu bản chất toán học.',
      fastPath: hasExplicitMention,
    };
  }

  // 5. Nhận diện phản biện bẻ gãy bẫy Bo (sharp_rebuttal)
  const rebuttalPatternsEarly = [
    /\b(bo sai roi|bo sai bet|bo nham|ban sai roi|cau sai roi)\b/,
    /\b(sai roi bo|sai roi ban|sai roi cau)\b/,
    /\b(khang dinh cua bo|bo khong dung|khong dung dau bo)\b/,
    /\b(khong phai 2a|khong the bang 2a|khong bang 2a|khong bang 2|khong the bang 2)\b/,
    /\b(sao lai bang 2a|sao lai la 2a|dau bang 2a duoc|dau bang 2 duoc)\b/,
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
  if (!isQuestionWhyOrWhen && (rebuttalPatternsEarly.some((pattern) => pattern.test(norm)) || (norm.includes('khong bang 2') && hasSubstantiatedMathReason(norm)))) {
    if (hasSubstantiatedMathReason(norm)) {
      return {
        detectedIntent: 'sharp_rebuttal',
        dispatchedAgent: 'bo',
        confidence: 0.95,
        reasoning: 'Học sinh đưa ra lý lẽ phản biện sắc bén có dẫn chứng toán học chỉ rõ lỗi sai hoặc điều kiện biên của bẫy.',
        fastPath: hasExplicitMention,
      };
    } else {
      return {
        detectedIntent: 'challenge_shortcut_fallacy',
        dispatchedAgent: 'bo',
        confidence: 0.95,
        reasoning: 'Học sinh bảo Bo sai nhưng chưa nêu lý do/chứng minh toán học, chuyển Bo phản biện lại.',
        fastPath: hasExplicitMention,
        unsubstantiatedRebuttal: true,
      };
    }
  }

  // 5. Làm tắt, ngộ nhận tắt đón đầu (challenge_shortcut_fallacy) -> Gán cho Bo
  const shortcutKeywords = [
    /cong dai/,
    /lay luon/,
    /the so/,
    /bam may/,
    /casio/,
    /ve hinh chi/,
    /cho le/,
    /lam tat/,
    /do met/,
    /khoi can/,
    /can gi/,
    /la xong/,
    /canh cong canh/,
    /cu lay/,
  ];
  if (shortcutKeywords.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'challenge_shortcut_fallacy',
      dispatchedAgent: 'bo',
      confidence: 0.92,
      reasoning: 'Học sinh đưa ra cách làm tắt hoặc rơi vào ngộ nhận; chuyển cho Bo làm đồng minh ngộ nhận.',
      fastPath: hasExplicitMention,
    };
  }

  // 6. Nhận diện ngộ nhận về "1 + 1 = 2 là chân lý" / "sao thầy gạch bỏ" / "tách ra bình thường mà" trong cộng vectơ
  const sumOnePlusOnePatterns = [
    /1\s*\+\s*1\s*=\s*2/,
    /1\s*\+\s*1/,
    /\b(chan ly|chan li)\b/,
    /\b(sao thay lai gach|sao thay gach|sao lai gach bo|sao gach bo|sao bi gach)\b/,
    /\b(tach ra binh thuong|sao khong tach|tach ra duoc ma|sao khong cong do dai|cong do dai tung cai)\b/,
  ];
  const isSumOnePlusOneTopic =
    sumOnePlusOnePatterns.some((pattern) => pattern.test(norm)) &&
    (norm.includes('1 + 1') || norm.includes('1+1') || norm.includes('chan ly') || norm.includes('gach') || norm.includes('tach'));
  if (isSumOnePlusOneTopic) {
    const isTargetingBo = recipient === 'bo' || rawLower.includes('@bo') || norm.includes('dung khong bo') || norm.includes('bo oi');
    return {
      detectedIntent: isTargetingBo ? 'challenge_shortcut_fallacy' : 'ask_deep_concept',
      dispatchedAgent: isTargetingBo ? 'bo' : 'tri',
      confidence: 0.98,
      reasoning: isTargetingBo
        ? 'Học sinh đưa ra cách làm tắt hoặc trao đổi với Bo về phép tính 1+1=2; chuyển Bo thách thức bẫy.'
        : 'Học sinh thắc mắc tại sao 1+1=2 là chân lý mà Thầy Tiến lại gạch bỏ phép tách độ dài |BC + DD\'|; Trí phân tích rạch ròi giữa số học vô hướng và bất đẳng thức tam giác trong vectơ.',
      fastPath: hasExplicitMention,
      isSumOnePlusOneTopic: true,
    };
  }

  // 5. Nhận diện ngộ nhận về "Giá của vectơ" (Line of vector): Giá là giá trị, độ dài, hoặc đùa "giá đỗ"
  const lineOfVectorPatterns = [
    /\b(gia cua vecto|gia cua vector|gia vecto|gia vector)\b/,
    /\b(gia la gia tri|gia la do dai|la do dai cua vector|la do dai cua vecto|gia la gi|sao goi la gia|sao lai goi la gia)\b/,
    /\b(gia do|gia la gia do)\b/,
  ];
  const isLineOfVectorTopic =
    lineOfVectorPatterns.some((pattern) => pattern.test(norm)) ||
    ((norm.includes('gia') || norm.includes('gia tri') || norm.includes('do dai')) && (norm.includes('vecto') || norm.includes('vector')) && (norm.includes('la gi') || norm.includes('la do dai') || norm.includes('la gia tri') || norm.includes('gia do') || norm.includes('sao goi')));
  if (isLineOfVectorTopic) {
    const isTargetingBo = recipient === 'bo' || rawLower.includes('@bo');
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: isTargetingBo ? 'bo' : 'tri',
      confidence: 0.98,
      reasoning: 'Học sinh thắc mắc hoặc ngộ nhận về "Giá của vectơ" (nhầm là giá trị/độ dài/giá đỗ); Trí hoặc Linh Chi đính chính định nghĩa đường thẳng chứa vectơ.',
      fastPath: hasExplicitMention,
      isLineOfVectorTopic: true,
    };
  }

  // 6. Nhận diện câu hỏi "Tại sao phải học vectơ" / "sao không dùng đoạn thẳng cho khỏe" / "khác gì bài cũ"
  const whyNeedVectorsPatterns = [
    /\b(dung doan thang cho khoe|sao khong dung doan thang|dung doan thang duoc roi)\b/,
    /\b(dung vector lam gi|dung vecto lam gi|hoc vector lam gi|hoc vecto lam gi|sao phai dung vecto|sao phai dung vector)\b/,
    /\b(hoc lai dau co gi moi|hoc them dau co gi moi|khac gi voi bai cu|khac gi bai cu)\b/,
  ];
  if (whyNeedVectorsPatterns.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.97,
      reasoning: 'Học sinh băn khoăn lý do cần dùng vectơ thay vì đoạn thẳng trong không gian 3 chiều; Trí phân tích bậc tự do và hướng lực/vận tốc, Minh Khang liên hệ drone/Google Maps.',
      fastPath: hasExplicitMention,
      isWhyNeedVectorsTopic: true,
    };
  }

  // 7. Nhận diện ngộ nhận về định nghĩa vectơ, hướng vectơ và so sánh đoạn thẳng với vectơ (AB vs BA)
  const vectorEqualityPatterns = [
    /\b(ab ba|ba ab)\b/,
    /\b(vecto ab|vecto ba|vector ab|vector ba)\b/,
    /\b(ab\s*=\s*ba|ba\s*=\s*ab|ab bang ba|ba bang ab)\b/,
    /\b(doan thang ab|doan thang ba)\b/,
    /\b(quang duong cung chung do|quang duong nhu nhau|quang duong bang nhau)\b/,
    /\b(giong het nhau thoi ma|bang nhau y nhu vay|bang nhau y het|nhu nhau ca thoi|nhu nhau thoi ma)\b/,
    /\b(vecto bang nhau|vector bang nhau|vecto giong nhau)\b/,
  ];
  const isVectorEqualityTopic =
    vectorEqualityPatterns.some((pattern) => pattern.test(norm)) &&
    (/\b(ab|ba|doan thang|vecto|vector|quang duong|huong|chieu|bang nhau|giong het)\b/.test(norm));
  if (isVectorEqualityTopic) {
    const isTargetingBo = recipient === 'bo' || rawLower.includes('@bo') || /\bbo\s+oi\b/.test(norm);
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: isTargetingBo ? 'bo' : 'tri',
      confidence: 0.98,
      reasoning: 'Học sinh nhầm lẫn giữa đoạn thẳng vô hướng (AB = BA) và vectơ có hướng (vectơ AB = - vectơ BA); chuyển Trí phân tích bản chất và Minh Khang/Cô Lam khích lệ, lấy ví dụ thực tế.',
      fastPath: hasExplicitMention,
      isVectorEqualityTopic: true,
    };
  }

  // 8. Nhận diện thắc mắc về Vectơ-không (Zero Vector): Hành trình khép kín, Quãng đường (s > 0) vs Vectơ Độ dời (vectơ AA = 0)
  const zeroVectorDisplacementPatterns = [
    /\b(tu c ve a|tu a ve a|ve cho cu|ve lai diem dau|ve nha)\b/,
    /\b(toi truong roi ve nha|di toi truong|di hoc roi ve)\b/,
    /\b(van la 1 doan|van la mot doan|mot doan dai|1 doan dai)\b/,
    /\b(chu dau phai la 0|sao lai la 0|sao lai bang 0|sao bang 0 duoc|dau phai bang 0|dau phai la 0)\b/,
    /\b(quang duong.*(bang 0|la 0)|do doi.*(quang duong))\b/,
    /\b(di mot vong|vong khep kin|tong vecto.*(bang 0|la 0)|vecto 0|vecto khong)\b/,
  ];
  const isZeroVectorTopic =
    zeroVectorDisplacementPatterns.some((pattern) => pattern.test(norm)) ||
    ((norm.includes('quang duong') || norm.includes('doan dai') || norm.includes('di ve') || norm.includes('di hoc')) &&
     (norm.includes('bang 0') || norm.includes('la 0') || norm.includes('phai la 0') || norm.includes('chu dau phai')));
  if (isZeroVectorTopic) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.98,
      reasoning: 'Học sinh thắc mắc tại sao hành trình khép kín lại có vectơ tổng bằng 0 dù quãng đường di chuyển khác 0; chuyển Trí phân tích rạch ròi giữa Quãng đường (đại số vô hướng) và Độ dời (vectơ).',
      fastPath: hasExplicitMention,
      isZeroVectorTopic: true,
    };
  }

  // 9. Nhận diện học sinh xem thường kiến thức, bảo dễ/chán, giống hệt lớp 10 -> Kích thích tư duy bằng nghịch lý 3D
  const trivializationPatterns = [
    /\b(quan trong gi dau|co gi dau ma|don gian qua|de qua|de ec|de ot)\b/,
    /\b(giong het thoi|giong het lop 10|giong lop 10|co khac gi dau|tuong the nao)\b/,
  ];
  if (trivializationPatterns.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.96,
      reasoning: 'Học sinh cho rằng kiến thức vectơ 3D quá đơn giản hoặc giống hệt lớp 10; Trí đưa ra câu hỏi kích thích tư duy về hai đường thẳng chéo nhau và góc giữa hai vectơ.',
      fastPath: hasExplicitMention,
      isTrivializingTopic: true,
    };
  }

  // Direct agent targeting (bắt trên norm không dấu để nhận diện chính xác "chào Bo nha", "chào Cô Lam")
  const isTargetBo = recipient === 'bo' || rawLower.includes('@bo') || /\b(chao bo|hoi bo|bo oi|gap bo|voi bo)\b/.test(norm) || (/\bbo\b/.test(norm) && !norm.includes('sai') && !norm.includes('dung') && !norm.includes('khong bang') && !norm.includes('khong the bang') && !/\b(tin bo|theo bo)\b/.test(norm));
  if (isTargetBo) {
    return {
      detectedIntent: 'challenge_shortcut_fallacy',
      dispatchedAgent: 'bo',
      confidence: 0.99,
      reasoning: 'Học sinh chủ động gọi tên hoặc chọn trao đổi với Bo (@bo).',
      fastPath: hasExplicitMention,
    };
  }
  const isTargetTri = recipient === 'tri' || rawLower.includes('@tri') || /\b(tri oi|hoi tri|chao tri)\b/.test(norm);
  if (isTargetTri) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.99,
      reasoning: 'Học sinh hỏi trực tiếp bạn học Trí (@tri) để đào sâu bản chất.',
      fastPath: hasExplicitMention,
    };
  }

  // 10. Câu hỏi thắc mắc / đối chiếu đúng sai / hỏi ý kiến -> KHÔNG PHẢI là sharp_rebuttal
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
        fastPath: hasExplicitMention,
      };
    }
    if (norm.includes('em noi') || norm.includes('em tra loi') || norm.includes('dung khong co') || norm.includes('thua co')) {
      return {
        detectedIntent: 'ask_deep_concept',
        dispatchedAgent: 'colam',
        confidence: 0.95,
        reasoning: 'Học sinh hỏi Cô Lam xác nhận câu trả lời của mình có đúng không.',
        fastPath: hasExplicitMention,
      };
    }
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.95,
      reasoning: 'Học sinh hỏi phân xử đúng/sai giữa các quan điểm, chuyển cho Trí phân tích bản chất.',
      fastPath: hasExplicitMention,
    };
  }

  // 11. Phân biệt câu hỏi bản chất (ask_deep_concept) trước nếu có từ để hỏi nghi vấn
  const isQuestioningWhy = /\b(tai sao|vi sao|khi nao|lam sao de|ban chat|y nghia)\b/.test(norm);
  if (isQuestioningWhy) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.96,
      reasoning: 'Học sinh đặt câu hỏi nghi vấn tại sao/khi nào để đào sâu bản chất toán học.',
      fastPath: hasExplicitMention,
    };
  }

  // 12. Keyword patterns: sharp_rebuttal (Phản biện bẻ gẫy bẫy Bo)
  // Đã gỡ bỏ /khong bang/ và /khong bang 2/
  const rebuttalPatterns = [
    /\b(bo sai roi|bo sai bet|bo nham|ban sai roi|cau sai roi)\b/,
    /\b(sai roi bo|sai roi ban|sai roi cau)\b/,
    /\b(khong phai 2a|khong the bang 2a|khong bang 2a)\b/,
    /\b(sao lai bang 2a|sao lai la 2a|dau bang 2a duoc)\b/,
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
        fastPath: hasExplicitMention,
      };
    } else {
      return {
        detectedIntent: 'challenge_shortcut_fallacy',
        dispatchedAgent: 'bo',
        confidence: 0.95,
        reasoning: 'Học sinh bảo Bo sai nhưng chưa nêu lý do/chứng minh toán học, chuyển Bo phản biện lại.',
        fastPath: hasExplicitMention,
        unsubstantiatedRebuttal: true,
      };
    }
  }

  // 13. Keyword patterns: ask_scaffolding_help (Bế tắc, xin gợi ý, giảng nhanh không theo kịp)
  const scaffoldingPatterns = [
    /goi y/,
    /bi qua/,
    /chua hieu/,
    /cuu em/,
    /khong biet lam/,
    /chua biet lam/,
    /chua biet/,
    /kho qua/,
    /bat dau tu dau/,
    /buoc 1/,
    /chua ro/,
    /help/,
    /scaffold/,
    /giang nhanh/,
    /noi nhanh/,
    /khong theo kip/,
    /chua theo kip/,
    /khong kip/,
    /qua nhanh/,
    /kho hieu/,
  ];
  if (scaffoldingPatterns.some((pattern) => pattern.test(norm))) {
    return {
      detectedIntent: 'ask_scaffolding_help',
      dispatchedAgent: 'an',
      confidence: 0.93,
      reasoning: 'Học sinh gặp khó khăn, xin gợi ý từng bước hoặc kêu bài giảng quá nhanh.',
      fastPath: hasExplicitMention,
    };
  }

  // 14. Keyword patterns: ask_formula_mnemonic (Hỏi công thức, sổ tay, checklist)
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
      fastPath: hasExplicitMention,
    };
  }

  // 15. Keyword patterns: challenge_shortcut_fallacy (Làm tắt, ngộ nhận sai)
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
      fastPath: hasExplicitMention,
    };
  }

  // 16. Keyword patterns: ask_deep_concept (Đào sâu bản chất, giải thích giùm)
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
      fastPath: hasExplicitMention,
    };
  }

  // 17. Keyword patterns: general_classroom_chitchat (Giao lưu ngoài lề / đời sống)
  // Đã gỡ bỏ /thay tien/ để không cướp câu "thầy Tiến giảng nhanh quá"
  const chitchatPatterns = [
    /chao/,
    /hello/,
    /hi ca lop/,
    /an com/,
    /troi dep/,
    /met qua/,
    /vui qua/,
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
      fastPath: hasExplicitMention,
    };
  }

  // Default fallback for heuristic: Trí đào sâu nếu có dấu hỏi, ngược lại chuyển Minh Khang
  if (rawLower.includes('?')) {
    return {
      detectedIntent: 'ask_deep_concept',
      dispatchedAgent: 'tri',
      confidence: 0.70,
      reasoning: 'Câu hỏi nghi vấn chưa phân loại rõ, mặc định định tuyến đến Trí để phân tích bản chất.',
      fastPath: hasExplicitMention,
    };
  }

  return {
    detectedIntent: 'general_classroom_chitchat',
    dispatchedAgent: 'minhkhang',
    confidence: 0.65,
    reasoning: 'Trao đổi lớp học thông thường.',
    fastPath: hasExplicitMention,
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
3. "challenge_shortcut_fallacy" -> "bo": Học sinh đưa ra cách làm tắt, ngộ nhận sai (lấy 1+1=2, cộng trực tiếp độ dài), hoặc chào hỏi, nói chuyện với Bo.
4. "ask_scaffolding_help" -> "an": Học sinh bế tắc ("bí quá", "chưa hiểu", "cho em gợi ý", "thầy giảng nhanh quá không theo kịp").
5. "sharp_rebuttal" -> "bo": Học sinh phản biện sắc bén, có LÝ LẼ TOÁN HỌC rõ ràng (chỉ ra góc vuông, Pytago, điều kiện cùng hướng...).
6. "general_classroom_chitchat" -> "minhkhang": Trò chuyện ngoài lề lớp học, hỏi ví dụ thực tế đời sống, tự so sánh bản thân ("em không bằng bạn Trí đâu").

CÂU MẪU THAM KHẢO (FEW-SHOT):
- "Linh Chi cho mình xin công thức cộng vectơ hình bình hành" -> {"detectedIntent": "ask_formula_mnemonic", "dispatchedAgent": "linhchi", "confidence": 0.98, "reasoning": "Hỏi công thức quy tắc hình bình hành"}
- "Tại sao độ dài tổng không bằng tổng độ dài vậy bạn?" -> {"detectedIntent": "ask_deep_concept", "dispatchedAgent": "tri", "confidence": 0.96, "reasoning": "Hỏi bản chất đại số và hình học của độ dài"}
- "Cứ lấy độ dài cộng thẳng cho nhanh, vẽ hình chi cho mệt" -> {"detectedIntent": "challenge_shortcut_fallacy", "dispatchedAgent": "bo", "confidence": 0.95, "reasoning": "Đưa ra cách làm tắt sai lầm"}
- "chào Bo nha" -> {"detectedIntent": "challenge_shortcut_fallacy", "dispatchedAgent": "bo", "confidence": 0.95, "reasoning": "Chào hỏi bạn học Bo"}
- "thầy Tiến giảng nhanh quá em không theo kịp" -> {"detectedIntent": "ask_scaffolding_help", "dispatchedAgent": "an", "confidence": 0.98, "reasoning": "Học sinh không theo kịp tốc độ, cần Trợ giảng An hỗ trợ"}
- "Em bí quá chưa biết bắt đầu từ đâu, cho em xin một gợi ý với" -> {"detectedIntent": "ask_scaffolding_help", "dispatchedAgent": "an", "confidence": 0.97, "reasoning": "Học sinh xin gợi ý bậc thang"}
- "Bo sai rồi, không bằng 2 đâu" -> {"detectedIntent": "challenge_shortcut_fallacy", "dispatchedAgent": "bo", "confidence": 0.95, "reasoning": "Nói Bo sai nhưng chưa có lý lẽ chứng minh, Bo sẽ phản bác lại"}
- "em không bằng bạn Trí đâu" -> {"detectedIntent": "general_classroom_chitchat", "dispatchedAgent": "minhkhang", "confidence": 0.92, "reasoning": "Giao lưu khiêm tốn so sánh với bạn học"}
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
  // 1. Kiểm tra Fast-Path trước (chỉ khi có @mention hoặc recipient !== 'all')
  const heuristic = classifyHeuristic(message, recipient);
  if (heuristic.fastPath) {
    return heuristic;
  }

  // 2. Chế độ offline/test hoặc useLLM: false -> dùng heuristic
  if (!useLLM) {
    return heuristic;
  }

  // 3. Chạy LLM Classifier cho câu văn tự do
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

  // 4. Fallback an toàn nếu LLM lỗi hoặc trả về sai cấu trúc
  return {
    ...heuristic,
    fallbackUsed: true,
  };
}

/**
 * RUNTIME DISPATCHER ENGINE:
 * Nhận message -> phân loại intent -> thẩm định phản biện / tools -> gọi Agent -> trả kết quả hoàn chỉnh
 */
export async function dispatchMessage({
  message,
  currentTime = 2233,
  lessonTitle = 'Toán 12 — Vectơ trong không gian',
  videoId = null,
  sessionId = null,
  recipient = 'all',
  useLLM = true,
  toolCalls = [],
  vectorAlgebraTool = null,
  groundingTool = null,
  kbMatch = null,
}) {
  const t0 = Date.now();

  const { videoId: effectiveVideoId, isMathLesson } = resolveLessonSubject({ videoId, lessonTitle });

  // 1. Phân loại Intent & Chọn Agent
  const verdict = await classifyLearnerIntent({
    message,
    currentTime,
    recipient,
    useLLM,
  });

  // 2. Truy vấn RAG Knowledge Base nếu là môn Toán và chưa được truyền từ trước
  if (!kbMatch && isMathLesson) {
    const searchHits = searchKb(message, 1);
    if (searchHits && searchHits.length > 0 && searchHits[0].score >= 2) {
      kbMatch = searchHits[0];
    }
  }

  // 3. Khởi chạy kiểm chứng bám nguồn chung (Issue #27 & #30 - dùng cho mọi môn)
  let activeGroundingTool = groundingTool || null;
  if (!activeGroundingTool) {
    try {
      activeGroundingTool = executeTool('tool_check_source_grounding', {
        claim: message,
        lessonId: effectiveVideoId,
        aroundSecond: currentTime,
      });
    } catch (err) {
      // Không chặn luồng hội thoại khi kiểm chứng bám nguồn lỗi, nhưng phải để lại dấu vết.
      console.warn('[Dispatcher] tool_check_source_grounding failed:', err?.message || err);
    }
  }

  // 4. Trích xuất biểu thức và kiểm chứng Deterministic Tool (Chỉ gọi khi là môn Toán)
  const detectedExpr = extractVectorExpr(message);
  const detectedClaim = extractClaimFromText(message);
  const detectedSide = extractSideFromText(message);
  let activeVectorAlgebraTool = vectorAlgebraTool || null;

  if (!activeVectorAlgebraTool && isMathLesson && detectedExpr) {
    try {
      const rawTool = executeTool('tool_verify_vector_algebra', {
        shape: 'cube',
        side: detectedSide,
        expr: detectedExpr,
        claim: detectedClaim || undefined,
      });
      const isCalcOnly = rawTool.output?.isValid === null;
      activeVectorAlgebraTool = {
        toolName: rawTool.toolName,
        status: 'completed',
        label: isCalcOnly ? 'Trí đang tính toán độ dài vectơ...' : 'Trí đang kiểm chứng hình học...',
        badgeText: isCalcOnly
          ? `Đã tính toán: ${rawTool.output?.correct || ''}`
          : (rawTool.isValid === true
              ? `Đã kiểm chứng hình học: Khớp chuẩn (${rawTool.output?.correct})`
              : rawTool.isValid === false
                ? `Đã kiểm chứng hình học: Sai lệch (${rawTool.input?.claim} ≠ ${rawTool.output?.correct})`
                : `Đã kiểm chứng hình học: ${rawTool.output?.correct}`),
        category: isCalcOnly ? 'math_calc' : 'math_verify',
        input: rawTool.input,
        output: rawTool.output,
        isValid: rawTool.isValid,
        timestampMs: rawTool.timestampMs,
      };
    } catch (err) {
      console.warn('[Dispatcher] Execute tool vector algebra error:', err.message);
    }
  }

  // 5. Khởi tạo/Lấy session và ghi nhận ActivityLogEvent (Issue #11 & PR #21)
  const activeSessionId = sessionId || (`session_ephemeral_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const session = getOrCreateSession(activeSessionId, { misconceptionId: kbMatch?.misconception?.id || (isMathLesson ? 'MISC_VEC_005' : 'MISC_GENERAL') });
  if (session) {
    logActivityEvent(session.id, {
      type: 'intent_routed',
      payload: {
        verdict,
        message,
        currentTime,
        recipient,
      },
    });
  }

  const m = Math.floor(currentTime / 60);
  const s = Math.floor(currentTime % 60);
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  const mathProblem = kbMatch?.misconception?.title || lessonTitle;
  const targetAgent = verdict.dispatchedAgent;

  // Đóng gói Context Isolation Snapshot bám sát bảng phấn tại giây hiện tại (Issue #402)
  const contextSnapshot = buildRuntimeContext({
    agentId: targetAgent,
    second: currentTime,
    sessionId: activeSessionId,
    userMessage: message,
    videoId: effectiveVideoId,
  });
  const citations = contextSnapshot?.citations || [];
  if (activeGroundingTool?.output?.citations?.length > 0) {
    for (const c of activeGroundingTool.output.citations) {
      if (!citations.some((existing) => existing.quote === c.quote)) {
        citations.push(c);
      }
    }
  }

  let primaryResponse = null;
  let followUpResponse = null;

  const normMessage = normalizeText(message);

  // 6. Xử lý phản hồi đa môn bám nguồn (Issue #30)
  if (!isMathLesson) {
    const groundingVerdict = activeGroundingTool?.output?.verdict || 'not_in_source';
    const citationsList = activeGroundingTool?.output?.citations || [];
    const topCitation = citationsList[0] || null;

    if (groundingVerdict === 'not_in_source' || verdict.isOffTopic) {
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.minhkhang,
        avatarId: 'minhkhang',
        text: `Câu hỏi này nằm ngoài nội dung bài giảng "${lessonTitle}". Chúng mình hãy cùng tập trung vào bài học nhé!`,
        citations: [],
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.colam,
        avatarId: 'colam',
        text: `Cô nhắc cả lớp: Hãy đặt các câu hỏi bám sát vào nội dung bài giảng "${lessonTitle}" để buổi học đạt hiệu quả cao nhất nhé!`,
        citations: [],
      };
    } else if (groundingVerdict === 'contradicted') {
      const reasonText = activeGroundingTool?.output?.reason || 'Phát biểu mâu thuẫn với nội dung bài giảng.';
      const quoteText = topCitation ? ` Theo bài giảng [${topCitation.timeFormatted}]: "${topCitation.quote}".` : '';
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.tri,
        avatarId: 'tri',
        text: `Phát biểu này chưa chính xác bạn nhé! ${reasonText}${quoteText}`,
        citations: citationsList,
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.colam,
        avatarId: 'colam',
        text: `Trí đã chỉ ra rất đúng điểm sai lầm. Cả lớp lưu ý ghi nhớ điểm mấu chốt này nhé!`,
        citations: citationsList,
      };
    } else {
      // supported
      const quoteText = topCitation ? ` Theo bài giảng ở mốc [${topCitation.timeFormatted}]: "${topCitation.quote}".` : '';
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.tri,
        avatarId: 'tri',
        text: `Đúng rồi bạn nhé! ${quoteText} Phát biểu của bạn hoàn toàn chính xác với nội dung bài học.`,
        citations: citationsList,
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.colam,
        avatarId: 'colam',
        text: `Rất tốt! Bạn đã nắm chắc kiến thức của bài học. Hãy tiếp tục phát huy nhé!`,
        citations: citationsList,
      };
    }
  } else {
    // 5. Kiểm tra trường hợp phản biện: Bo nhận thua vs Bo phản bác + TA An gợi ý bậc thang (Toán 12 Vectơ)
  const isRebuttalCandidate =
    verdict.detectedIntent === 'sharp_rebuttal' ||
    verdict.unsubstantiatedRebuttal ||
    (verdict.dispatchedAgent === 'bo' && /\b(sai|nham|khong bang 2|khong phai 2)\b/.test(normMessage));

  if (isRebuttalCandidate && !verdict.isOffTopic && !verdict.isDistraction && !verdict.isVectorEqualityTopic && !verdict.isSumOnePlusOneTopic && !verdict.isLineOfVectorTopic && !verdict.isZeroVectorTopic && !verdict.isWhyNeedVectorsTopic && !verdict.isTrivializingTopic) {
    let isSharp = false;
    let assessorNote = '';

    if (useLLM) {
      try {
        const assessResult = await chamPhanBien({
          phanBienHocVien: message,
          giaiThichChuan: kbMatch?.misconception?.correction || 'Độ dài của tổng hai vectơ chỉ bằng tổng độ dài khi hai vectơ cùng hướng.',
          moTaLoi: kbMatch?.misconception?.description || 'Cộng trực tiếp độ dài |BC + DD\'| = 1 + 1 = 2 khi hai vectơ vuông góc là sai.',
        });
        isSharp = assessResult?.danh_gia_phan_bien === 'sac_ben';
        assessorNote = assessResult?.ly_do_ngan || '';
      } catch (err) {
        console.warn('[Dispatcher] Assessor chamPhanBien error, failing safely as unclear:', err.message);
        isSharp = false;
      }
    } else {
      // Deterministic fallback
      isSharp = hasSubstantiatedMathReason(normMessage) && !verdict.unsubstantiatedRebuttal;
    }

    if (isSharp) {
      // Bo nhận thua + Cô Lam chốt kiến thức
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
        mode: 'concede',
      };

      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.colam,
        avatarId: 'colam',
        text: coLamText,
      };

      if (session) {
        session.done = true;
        logActivityEvent(session.id, {
          type: 'bo_conceded',
          payload: {
            message,
            evaluation: 'sac_ben',
            reason: assessorNote,
          },
        });
      }
    } else {
      // Bo KHÔNG nhận thua, Bo phản bác (skeptic_pushback) + Trợ giảng An gợi ý bậc thang
      const boPushback = 'Ủa, tớ sai chỗ nào cơ chứ? Cậu chỉ bảo "sai rồi" hay "không bằng 2" mà không chỉ ra lý do toán học thì tớ chưa phục đâu nha! Cậu chứng minh thử xem?';
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.bo,
        avatarId: 'bo',
        text: boPushback,
        mode: 'skeptic_pushback',
      };

      const currentHintLevel = session?.hintLevel || 0;
      if (currentHintLevel === 0) {
        let anText = kbMatch?.misconception?.scaffolding?.[0]?.question ||
          'Trợ giảng An gợi ý nhỏ cho bạn: Hãy thử vẽ phác hai vectơ chung gốc hoặc xem lại điều kiện cùng hướng xem sao nhé!';
        if (useLLM) {
          try {
            const taResult = await taScaffoldSupport({
              baiToan: mathProblem,
              chuDe: lessonTitle,
              cauHoiHocVien: message,
              goiY1: kbMatch?.misconception?.scaffolding?.[0]?.question,
              goiY2: kbMatch?.misconception?.scaffolding?.[1]?.question,
              level: 1,
            });
            if (taResult?.dialogue) anText = taResult.dialogue;
          } catch (err) {
            console.warn('[Dispatcher] TA hint level 1 fallback:', err.message);
          }
        }
        followUpResponse = {
          author: AGENT_DISPLAY_NAMES.an,
          avatarId: 'an',
          text: anText,
          hintLevel: 1,
        };
        if (session) {
          session.hintLevel = 1;
          logActivityEvent(session.id, {
            type: 'learner_answer',
            payload: {
              message,
              evaluation: 'chua_ro',
              hintLevelGiven: 1,
              taText: anText,
            },
          });
        }
      } else if (currentHintLevel === 1) {
        let anText = kbMatch?.misconception?.scaffolding?.[1]?.question ||
          'Trợ giảng An gợi ý bước 2: Vectơ DD\' có bằng vectơ CC\' không? Khi thay vào ta được vectơ tổng nào trong tam giác vuông?';
        if (useLLM) {
          try {
            const taResult = await taScaffoldSupport({
              baiToan: mathProblem,
              chuDe: lessonTitle,
              cauHoiHocVien: message,
              goiY1: kbMatch?.misconception?.scaffolding?.[0]?.question,
              goiY2: kbMatch?.misconception?.scaffolding?.[1]?.question,
              level: 2,
            });
            if (taResult?.dialogue) anText = taResult.dialogue;
          } catch (err) {
            console.warn('[Dispatcher] TA hint level 2 fallback:', err.message);
          }
        }
        followUpResponse = {
          author: AGENT_DISPLAY_NAMES.an,
          avatarId: 'an',
          text: anText,
          hintLevel: 2,
        };
        if (session) {
          session.hintLevel = 2;
          logActivityEvent(session.id, {
            type: 'learner_answer',
            payload: {
              message,
              evaluation: 'chua_ro',
              hintLevelGiven: 2,
              taText: anText,
            },
          });
        }
      } else {
        // Cấp >= 2: Cô Lam vào chốt để không rơi vào vòng lặp vô tận
        let coLamText = kbMatch?.misconception?.correction ||
          'Cô thấy các em đã nỗ lực thảo luận rất nhiều! Cô chốt lại quy tắc vàng: |a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Ở đây BC vuông góc DD\' nên |BC + DD\'| = |BC\'| = a√2 nhé!';
        followUpResponse = {
          author: AGENT_DISPLAY_NAMES.colam,
          avatarId: 'colam',
          text: coLamText,
          concluded: true,
        };
        if (session) {
          session.done = true;
          session.hintLevel = 3;
          logActivityEvent(session.id, {
            type: 'colam_concluded',
            payload: {
              message,
              coLamText,
            },
          });
        }
      }
    }
  } else if (verdict.isOffTopic) {
    const isBallonDor = normMessage.includes('qua bong vang') || normMessage.includes('ballon');
    let mkText = isBallonDor
      ? 'À về Quả Bóng Vàng thì làng túc cầu vẫn luôn tranh luận sôi nổi giữa các siêu sao như Bellingham, Vinicius, Mbappe hay Rodri... Nhưng mà cậu ơi! Trận cầu đinh lúc này là bài giảng Vectơ không gian của Thầy Tiến kìa! Cùng tập trung xem tiếp ví dụ của Thầy Tiến để không bị "thủng lưới" trong bài kiểm tra nhé!'
      : 'Chủ đề này nghe thú vị ghê! Nhưng tụi mình đang trong tiết học trực tiếp của Thầy Tiến nè, bài này nhiều bẫy lắm, ráng tập trung theo dõi nốt ví dụ rồi lát nữa tha hồ bàn luận nhé bạn!';

    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.minhkhang,
      avatarId: 'minhkhang',
      text: mkText,
    };
    followUpResponse = {
      author: AGENT_DISPLAY_NAMES.colam,
      avatarId: 'colam',
      text: 'Cô thấy lớp mình bàn luận rất rôm rả! Tuy nhiên hình học không gian đòi hỏi trí tưởng tượng và sự tập trung cao độ. Cả lớp cùng hướng mắt lên màn hình tiếp tục theo dõi bài giảng của Thầy Tiến nhé!',
    };
  } else if (verdict.isSumOnePlusOneTopic) {
    if (targetAgent === 'bo') {
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.bo,
        avatarId: 'bo',
        text: 'Ủa... lúc đầu tớ cũng nghĩ 1 + 1 = 2 là chân lý hiển nhiên thì cứ thế mà cộng độ dài cho lẹ! Ai ngờ bị Thầy Tiến gạch bỏ cái rụp... Cậu nghe Trí giải thích lý do này:',
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.tri,
        avatarId: 'tri',
        text: 'Trong số học thông thường thì 1 + 1 = 2 đúng là chân lý! Nhưng trong VECTƠ, Thầy Tiến gạch bỏ biểu thức |BC + DD\'| = 1 + 1 = 2 vì độ dài của tổng KHÔNG ĐƯỢC tách tuỳ tiện thành tổng hai độ dài:\nTheo bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng "chân lý" đó CHỈ XẢY RA KHI hai vectơ a và b CÙNG HƯỚNG!\nTrong Ví dụ 3, BC và DD\' vuông góc nhau trong không gian. Muốn tính độ dài, bắt buộc phải thay DD\' = CC\' để nối tiếp thành BC + CC\' = BC\', sau đó áp dụng định lý Pytago tính đường chéo mặt bên: |BC\'| = √(1² + 1²) = √2 (khoảng 1.41) chứ tuyệt đối không thể bằng 2 được bạn nhé!',
        focusConcept: 'Bất đẳng thức tam giác trong vectơ & Điều kiện biên của phép cộng độ dài',
      };
    } else {
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.tri,
        avatarId: 'tri',
        text: 'Trong số học thông thường thì 1 + 1 = 2 đúng là chân lý! Nhưng trong VECTƠ, Thầy Tiến gạch bỏ biểu thức |BC + DD\'| = 1 + 1 = 2 vì độ dài của tổng KHÔNG ĐƯỢC tách tuỳ tiện thành tổng hai độ dài:\nTheo bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng "chân lý" đó CHỈ XẢY RA KHI hai vectơ a và b CÙNG HƯỚNG!\nTrong Ví dụ 3, BC và DD\' vuông góc nhau trong không gian. Muốn tính độ dài, bắt buộc phải thay DD\' = CC\' để nối tiếp thành BC + CC\' = BC\', sau đó áp dụng định lý Pytago tính đường chéo mặt bên: |BC\'| = √(1² + 1²) = √2 (khoảng 1.41) chứ tuyệt đối không thể bằng 2 được bạn nhé!',
        focusConcept: 'Bất đẳng thức tam giác trong vectơ & Điều kiện biên của phép cộng độ dài',
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.colam,
        avatarId: 'colam',
        text: 'Trí giải thích rất chuẩn xác! Các em cần ghi nhớ thật kỹ: Tuyệt đối không được nhầm lẫn giữa phép cộng đại số thông thường và độ dài của tổng vectơ. Dấu bằng |a + b| = |a| + |b| chỉ đúng khi hai vectơ cùng hướng thôi nhé!',
      };
    }
  } else if (verdict.isLineOfVectorTopic) {
    const isJokingGiaDo = normMessage.includes('gia do');
    if (isJokingGiaDo) {
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.bo,
        avatarId: 'bo',
        text: 'Haha giá đỗ xào thịt bò thì ngon chứ trong hình học không có giá đỗ đâu nha bạn ơi! 😂 Tớ từng bị Thầy Tiến nhắc nhở chỗ này nè:',
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.linhchi,
        avatarId: 'linhchi',
        text: 'Giá của vectơ AB là đường thẳng vô hạn đi qua hai điểm A và B nhé các bạn. Từ Hán-Việt "giá" ở đây có nghĩa là cái giá đỡ, đường thẳng mang vectơ nằm trên đó!',
      };
    } else {
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.tri,
        avatarId: 'tri',
        text: 'Nhầm to rồi bạn ơi! Trong toán học, "GIÁ" của vectơ KHÔNG PHẢI là "giá trị" đại số và cũng KHÔNG PHẢI là "độ dài" của vectơ!\nĐịnh nghĩa chuẩn của SGK nè: Giá của vectơ AB là ĐƯỜNG THẲNG đi qua hai điểm A và B (đường thẳng mang vectơ đó). Đường thẳng này kéo dài vô tận về hai phía, còn vectơ AB chỉ là một đoạn thẳng có hướng nằm trên đường thẳng đó thôi bạn nhé!',
        focusConcept: 'Định nghĩa Giá của vectơ: Đường thẳng mang vectơ, không phải giá trị hay độ dài',
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.minhkhang,
        avatarId: 'minhkhang',
        text: 'Tớ lấy ví dụ cho dễ nhớ nè: Tưởng tượng con tàu chạy từ ga A đến ga B là vectơ AB (có hướng đi và độ dài hành trình). Còn hai thanh ray kéo dài tít tắp trên mặt đất chính là GIÁ của vectơ đó! Con tàu chỉ chạy trên thanh ray ấy thôi!',
      };
    }
  } else if (verdict.isWhyNeedVectorsTopic) {
    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.tri,
      avatarId: 'tri',
      text: 'Câu hỏi rất thực tế! Nếu chỉ dùng đoạn thẳng, bạn chỉ biết khoảng cách giữa hai điểm nhưng hoàn toàn KHÔNG BIẾT hướng chuyển động hay lực tác dụng: Đi từ Hà Nội vào Đà Nẵng khác hẳn bay ngược lại dù đoạn thẳng như nhau.\nĐặc biệt trong không gian 3D, vật thể có thêm chiều cao (trục Oz). Vectơ chính là công cụ duy nhất giúp định vị chính xác độ dời, lực đẩy động cơ hay quỹ đạo máy bay trong không gian 3 chiều mà đoạn thẳng vô hướng không thể làm được!',
      focusConcept: 'Ý nghĩa của vectơ trong không gian 3 chiều',
    };
    followUpResponse = {
      author: AGENT_DISPLAY_NAMES.minhkhang,
      avatarId: 'minhkhang',
      text: 'Chuẩn luôn! Giống như bạn mở Google Maps ấy, nếu bản đồ chỉ hiện đoạn thẳng thì bạn đâu biết phải quẹo hướng nào. Mũi tên vectơ màu xanh chỉ đường mới giúp bạn đi đúng hướng đến đích được chứ!',
    };
  } else if (verdict.isZeroVectorTopic) {
    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.tri,
      avatarId: 'tri',
      text: 'Câu hỏi của bạn cực kỳ sắc sảo và chạm đúng bản chất vật lý! Bạn cần phân biệt rạch ròi giữa QUÃNG ĐƯỜNG và ĐỘ DỜI (vectơ):\n1. Về QUÃNG ĐƯỜNG (vô hướng): Khi bạn đi từ Nhà (A) đến Trường (B) rồi từ Trường về Nhà (A), đồng hồ xe vẫn đo được độ dài đã đi (quãng đường s = |AB| + |BA| > 0).\n2. Nhưng về ĐỘ DỜI (vectơ): Vectơ chỉ quan tâm đến vị trí điểm đầu và điểm cuối! Điểm xuất phát là Nhà (A), điểm kết thúc cũng là Nhà (A). Vectơ tổng là vectơ AB + vectơ BA = vectơ AA = vectơ 0! Vectơ-không ở đây cho thấy sau cả hành trình khép kín, vị trí tổng thể của bạn không hề bị dịch chuyển so với ban đầu!',
      focusConcept: 'Bản chất vectơ-không: Phân biệt Quãng đường và Vectơ Độ dời',
    };
    followUpResponse = {
      author: AGENT_DISPLAY_NAMES.minhkhang,
      avatarId: 'minhkhang',
      text: 'Chuẩn luôn Trí ơi! Giống như bạn chạy bộ trên máy tập gym 5km: mồ hôi nhễ nhại, tiêu hao 300 calo (quãng đường 5km), nhưng bước xuống máy thì vị trí bạn vẫn đứng yên trong phòng tập (vectơ độ dời = 0)! Vectơ chỉ nhìn điểm đầu và điểm cuối thôi bạn ơi!',
    };
  } else if (verdict.isVectorEqualityTopic) {
    if (targetAgent === 'bo') {
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.bo,
        avatarId: 'bo',
        text: "Ủa... lúc đầu tớ cũng nghĩ hệt như cậu đó! Thấy A với B cố định thì đoạn thẳng AB với BA bằng nhau, nên tưởng vectơ AB với BA cũng bằng nhau luôn cho tiện. Ai dè bị Trí với Thầy Tiến 'bắt bài' liền: Vectơ là đoạn thẳng CÓ HƯỚNG! Cậu nghe Trí giải thích bản chất này:",
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.tri,
        avatarId: 'tri',
        text: 'Đoạn thẳng không phân biệt thứ tự nên độ dài |AB| = |BA|. Nhưng VECTƠ có điểm đầu và điểm cuối: vectơ AB đi từ A đến B, còn vectơ BA đi từ B về A. Hai vectơ này ngược hướng nhau (vectơ AB = - vectơ BA) nên không thể bằng nhau được bạn nhé!',
      };
    } else {
      primaryResponse = {
        author: AGENT_DISPLAY_NAMES.tri,
        avatarId: 'tri',
        text: 'Khoan đã bạn ơi, nhầm to rồi nhé! Đoạn thẳng AB và BA là một vì đoạn thẳng không phân biệt thứ tự (quãng đường |AB| = |BA|). Nhưng VECTƠ là đoạn thẳng CÓ HƯỚNG! Vectơ AB có gốc là A, ngọn là B; còn vectơ BA có gốc là B, ngọn là A. Hai vectơ này NGƯỢC HƯỚNG nhau (vectơ AB = - vectơ BA), nên vectơ AB ≠ vectơ BA bạn nhé!',
        focusConcept: 'Định nghĩa vectơ: Phân biệt đoạn thẳng vô hướng và vectơ có hướng',
      };
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.minhkhang,
        avatarId: 'minhkhang',
        text: 'Chuẩn đó Trí! Cứ liên tưởng vé máy bay từ Đà Nẵng (A) ra Hà Nội (B) thì đưa bạn ra Thủ đô, còn bay từ Hà Nội (B) về Đà Nẵng (A) là về ngắm biển. Quãng đường bằng nhau nhưng bay ngược hướng là tới hai nơi hoàn toàn khác nhau liền!',
      };
    }
  } else if (verdict.isTrivializingTopic) {
    primaryResponse = {
      author: AGENT_DISPLAY_NAMES.tri,
      avatarId: 'tri',
      text: 'Bạn thấy giống lớp 10 nên nghĩ nó đơn giản đúng không? Vậy tớ đố bạn câu này để xem không gian 3D khác biệt thế nào nhé: Trong 2D hai đường thẳng không cắt nhau thì song song. Nhưng trong không gian 3D căn phòng bạn ngồi, hai đường thẳng CHÉO NHAU (không song song, không cắt nhau) thì góc giữa hai vectơ của chúng được tính thế nào? Và liệu hai vectơ có thể VUÔNG GÓC dù không bao giờ chạm nhau không?',
      focusConcept: 'Đặc trưng không gian 3D: Hai đường thẳng chéo nhau và góc giữa hai vectơ',
    };
    followUpResponse = {
      author: AGENT_DISPLAY_NAMES.colam,
      avatarId: 'colam',
      text: 'Cô rất thích sự tự tin của em! Nhưng không gian 3 chiều mở ra một thế giới hình học hoàn toàn mới và rất nhiều điều kỳ thú. Cùng kiên nhẫn theo dõi tiếp bài giảng của Thầy Tiến để khám phá nhé!',
    };
  } else if (verdict.detectedIntent === 'encourage_study_focus') {
    let primaryText = '';
    let authorName = AGENT_DISPLAY_NAMES.minhkhang;
    let avatar = 'minhkhang';

    if (verdict.dispatchedAgent === 'bo') {
      authorName = AGENT_DISPLAY_NAMES.bo;
      avatar = 'bo';
      primaryText = 'Haha nghe rủ đi chơi tớ cũng ham lắm! Nhưng thôi chết, bài này Thầy Tiến bảo là trọng tâm thi THPT Quốc Gia đó, trốn học là lát nữa làm bài tập toang liền. Ráng ở lại học nốt bài này với tớ đi cậu!';
    } else {
      primaryText = 'Khoan đi chơi bạn ơi! Tưởng tượng vectơ như lực đẩy động cơ máy bay vậy, nắm được hướng và độ lớn là giải quyết bài toán mượt mà ngay. Cố gắng theo dõi nốt ví dụ của Thầy Tiến rồi tụi mình xả hơi sau cũng chưa muộn mà!';
    }

    const coLamEncourageText = 'Cô nghe thấy có bạn rủ nhau đi chơi đấy nhé! Kiến thức vectơ không gian lớp 12 này ban đầu có vẻ hơi trừu tượng, nhưng chỉ cần kiên nhẫn nắm chắc các quy tắc là các em sẽ thấy rất thú vị và tự tin. Cố gắng lên nào, cả lớp cùng tập trung theo dõi tiếp bài giảng của Thầy Tiến nhé!';

    primaryResponse = {
      author: authorName,
      avatarId: avatar,
      text: primaryText,
    };

    followUpResponse = {
      author: AGENT_DISPLAY_NAMES.colam,
      avatarId: 'colam',
      text: coLamEncourageText,
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
    const isPacingIssue = normMessage.includes('giang nhanh') || normMessage.includes('khong theo kip');
    if (session && !isPacingIssue) {
      session.hintLevel = (session.hintLevel || 0) + 1;
    }
    const currentHintLevel = session?.hintLevel || 1;

    let anText = isPacingIssue
      ? 'Trợ giảng An đây! Thầy Tiến đang giảng các ví dụ nền tảng, bạn đừng quá lo lắng nhé. Bạn có thể tạm dừng video một chút, mở lại đoạn 1:15 để xem định nghĩa gốc hoặc đặt câu hỏi ở đây để mình và các bạn hỗ trợ từng bước nhé!'
      : (currentHintLevel === 2
          ? (kbMatch?.misconception?.scaffolding?.[1]?.question || 'Gợi ý mức 2 cho bạn: Hai vectơ BC và DD\' vuông góc nhau trong không gian. Muốn tính độ dài đường chéo, hãy áp dụng định lý Pytago trong tam giác vuông nhé!')
          : 'Đừng nản nhé! Gợi ý nhỏ cho bạn: Hãy thử vẽ phác hai vectơ chung gốc hoặc xem lại điều kiện cùng hướng xem sao!');
    let step = currentHintLevel === 2 ? 'Áp dụng định lý Pytago tính độ dài đường chéo' : 'Vẽ hình minh hoạ hai vectơ trên mặt phẳng nháp';

    if (useLLM) {
      try {
        const taResult = await taScaffoldSupport({
          baiToan: mathProblem,
          chuDe: lessonTitle,
          cauHoiHocVien: message,
          goiY1: kbMatch?.misconception?.scaffolding?.[0]?.question || 'Thử xem hai vectơ này có cùng hướng hay không?',
          goiY2: kbMatch?.misconception?.scaffolding?.[1]?.question || 'Quan sát tam giác tạo bởi hai vectơ.',
          level: Math.min(currentHintLevel, 2),
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
      hintLevel: currentHintLevel,
    };

    if (session && !isPacingIssue) {
      logActivityEvent(session.id, {
        type: 'learner_answer',
        payload: {
          message,
          evaluation: 'chua_ro',
          hintLevelGiven: Math.min(currentHintLevel, 2),
        },
      });
    }

    if (session && currentHintLevel >= 3) {
      let coLamText = kbMatch?.misconception?.correction ||
        'Cô thấy các em đã nỗ lực thảo luận rất nhiều! Cô chốt lại quy tắc vàng: |a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Ở đây BC vuông góc DD\' nên |BC + DD\'| = |BC\'| = a√2 nhé!';
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.colam,
        avatarId: 'colam',
        text: coLamText,
        concluded: true,
      };
      session.done = true;
      session.hintLevel = 3;
      logActivityEvent(session.id, {
        type: 'colam_concluded',
        payload: {
          message,
          coLamText,
        },
      });
    }
  } else if (targetAgent === 'bo' || verdict.detectedIntent === 'challenge_shortcut_fallacy') {
    const norm = normalizeText(message);
    const isAskingBoConfusion = norm.includes('thac mac') || norm.includes('giai thich cho') || norm.includes('cau nao') || norm.includes('hoi gi');
    const isGreeting = /\b(chao|hello|hi)\b/.test(norm);

    let boText = currentTime >= 1800
      ? 'Cứ lấy số cộng vào cho lẹ, hơi đâu vẽ hình chi cho rắc rối đúng không cậu? Nhưng coi chừng Thầy Tiến gài bẫy đó nha!'
      : 'Tớ thấy phần vectơ không gian này có nhiều chỗ hay bị lừa lắm nha! Cậu nhớ chú ý chiều mũi tên với các quy tắc Thầy Tiến vừa dạy nghen!';
    let mode = 'shortcut_fallacy';

    if (isGreeting) {
      boText = 'Chào cậu nha! Tớ là Bo đây. Cậu thấy bài vectơ không gian này thế nào, có chỗ nào làm tắt nhanh như tớ không?';
      mode = 'greeting';
    } else if (isAskingBoConfusion) {
      boText = currentTime >= 1800
        ? 'A, cậu hỏi đúng lúc ghê! Tớ đang lấn cấn ở Ví dụ 3 nè: Cạnh hình lập phương bằng 1, thì |BC| = 1, |DD\'| = 1, sao mình không cộng thẳng 1 + 1 = 2 luôn cho nhanh, mà Thầy Tiến lại phải dời vectơ rồi tính đường chéo làm gì cho cực vậy cậu?'
        : 'A, cậu hỏi đúng lúc ghê! Tớ đang lấn cấn chỗ này nè: Đoạn thẳng AB với BA bằng nhau, vậy vectơ AB với vectơ BA có bằng nhau luôn không nhỉ? Cậu giải thích giùm tớ với!';
      mode = 'misconception_inquiry';
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

    // Khi Bo gài bẫy ngộ nhận hoặc đồng tình với cách làm tắt sai lệch (có ngộ nhận kbMatch),
    // Trí (Hệ 2 - Logic) sẽ tự động tiếp ứng (follow-up) để phản biện Bo và đính chính bản chất toán học
    if (!followUpResponse && !isGreeting && !isAskingBoConfusion && kbMatch?.misconception) {
      let triFollowUpText = `Khoan đã Bo ơi! Tớ phải đính chính ngay kẻo cả lớp hiểu nhầm theo: ${kbMatch.misconception.correction || 'Đừng làm tắt như vậy, phải dựa vào định nghĩa và tính chất toán học chuẩn xác!'}`;
      if (useLLM) {
        try {
          const triRes = await triDeepThink({
            baiToan: mathProblem,
            cauHoiHocVien: message,
            loiBoGiai: boText,
            vectorAlgebraTool,
          });
          if (triRes?.dialogue) triFollowUpText = triRes.dialogue;
        } catch (err) {
          console.warn('[Dispatcher] Tri follow-up LLM fallback:', err.message);
        }
      }
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.tri,
        avatarId: 'tri',
        text: triFollowUpText,
      };
    }
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
    const isFallingForBoTrap = /(a\s*ra\s*vay|cam\s*on.*ra\s*vay|thi\s*ra\s*la\s*vay|nghe\s*hop\s*ly|tin\s*bo|theo\s*bo)/i.test(normMessage);
    let mkText = (isFallingForBoTrap && kbMatch?.misconception && session && !session.done)
      ? `Khoan đã bạn ơi, đừng vội tin mẹo làm tắt của Bo nhé! ${kbMatch.misconception.correction || 'Đó là ngộ nhận sai lầm phổ biến đấy!'}`
      : normMessage.includes('khong bang ban tri') || normMessage.includes('khong bang tri')
        ? 'Đừng tự ti thế chứ bạn ơi! Mỗi người có một thế mạnh riêng mà: Trí thì đào sâu bản chất toán học, còn tớ thì khoái liên hệ đời sống thực tế nè. Tụi mình cùng học thì ai cũng tiến bộ hết á!'
        : 'Chào bạn nha! Cùng tập trung vào bài giảng của Thầy Tiến nào, phần này cực kỳ quan trọng cho kỳ thi đó!';
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
    const isVectorEqualityClaim = /\b(ab ba|ba ab|vecto ab|vector ab|ab = ba|ab bang ba|doan thang|quang duong|bang nhau y nhu|giong het nhau)\b/.test(norm);

    let triText = isVectorEqualityClaim
      ? 'Khoan đã bạn ơi, nhầm to rồi nhé! Đoạn thẳng AB và BA là một vì đoạn thẳng không phân biệt thứ tự (quãng đường |AB| = |BA|). Nhưng VECTƠ là đoạn thẳng CÓ HƯỚNG! Vectơ AB có gốc là A, ngọn là B; còn vectơ BA có gốc là B, ngọn là A. Hai vectơ này NGƯỢC HƯỚNG nhau (vectơ AB = - vectơ BA), nên vectơ AB ≠ vectơ BA bạn nhé!'
      : isAskingWhoIsRight
      ? 'Bo sai rồi bạn nhé! Bo đã mắc ngộ nhận cộng trực tiếp độ dài: |BC + DD\'| = 1 + 1 = 2. Thực tế, theo bất đẳng thức tam giác, |a + b| <= |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Ở đây BC và DD\' vuông góc nhau nên phải dời vectơ và tính đường chéo ra √2 mới đúng!'
      : 'Theo tớ, bản chất của phép toán này nằm ở hướng của vectơ. Vectơ vừa có độ lớn vừa có hướng, nên |a + b| <= |a| + |b|, dấu bằng chỉ xảy ra khi a và b cùng hướng.';
    let concept = isVectorEqualityClaim
      ? 'Định nghĩa vectơ: Phân biệt đoạn thẳng vô hướng và vectơ có hướng'
      : 'Bất đẳng thức tam giác trong vectơ';

    // Nếu có activeVectorAlgebraTool, Trí chủ động trích dẫn dữ liệu kiểm chứng chính xác
    if (activeVectorAlgebraTool && activeVectorAlgebraTool.output?.correct) {
      triText = `Theo kiểm chứng toạ độ 3D: Biểu thức ${activeVectorAlgebraTool.input.expr} có độ dài chuẩn xác là ${activeVectorAlgebraTool.output.correct}. Hai vectơ không cùng hướng nên không thể cộng độ dài số học thông thường được bạn nhé!`;
    }

    if (isVectorEqualityClaim && !followUpResponse) {
      followUpResponse = {
        author: AGENT_DISPLAY_NAMES.minhkhang,
        avatarId: 'minhkhang',
        text: 'Chuẩn đó Trí! Cứ liên tưởng vé máy bay từ Đà Nẵng (A) ra Hà Nội (B) thì đưa bạn ra Thủ đô, còn bay từ Hà Nội (B) về Đà Nẵng (A) là về ngắm biển. Quãng đường bằng nhau nhưng bay ngược hướng là tới hai nơi hoàn toàn khác nhau liền!',
      };
    }

    if (useLLM) {
      try {
        const triResult = await triDeepThink({
          baiToan: mathProblem,
          chuDe: lessonTitle,
          cauHoiHocVien: message,
          loiBoGiai: kbMatch?.misconception?.incorrect_claim || 'Cộng trực tiếp độ dài 1 + 1 = 2',
          vectorAlgebraTool: activeVectorAlgebraTool,
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
      toolCall: activeVectorAlgebraTool,
    };
  }
}

  // Khử triệt để artifact mã hóa d6c2 nếu có xuất hiện từ LLM hay chuỗi thô
  const sanitizeText = (txt) => {
    if (!txt || typeof txt !== 'string') return txt;
    return txt
      .replace(/d6c2([A-Za-z0-9'′]+)/gi, 'vectơ $1')
      .replace(/d6c2/gi, 'vectơ ');
  };

  if (primaryResponse?.text) {
    primaryResponse.text = sanitizeText(primaryResponse.text);
    if (!primaryResponse.citations) {
      primaryResponse.citations = citations;
    }
  }
  if (followUpResponse?.text) {
    followUpResponse.text = sanitizeText(followUpResponse.text);
    if (!followUpResponse.citations) {
      followUpResponse.citations = citations;
    }
  }

  const latencyMs = Date.now() - t0;

  return {
    ok: true,
    verdict,
    primaryResponse,
    followUpResponse,
    contextSnapshot,
    citations,
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
    sessionState: session
      ? {
          id: session.id,
          hintLevel: session.hintLevel,
          done: session.done,
          activityLogLength: session.activity_log?.length || 0,
        }
      : null,
  };
}

export default {
  INTENT_AGENT_MAP,
  getVideoLectureContext,
  hasSubstantiatedMathReason,
  classifyHeuristic,
  classifyWithLLM,
  classifyLearnerIntent,
  dispatchMessage,
};
