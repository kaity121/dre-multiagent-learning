import { MisconceptionItem, EvaluationResult } from '../types/dre';

/**
 * Rule-based pedagogical evaluator for DRE prototype
 * Evaluates whether the selected step is correct and the explanation quality
 */
export function evaluateStepAndExplanation(
  lesson: MisconceptionItem,
  selectedStep: number,
  explanation: string
): EvaluationResult {
  const isCorrectStep = selectedStep === lesson.errorStepIndex;

  if (!isCorrectStep) {
    return {
      isCorrectStep: false,
      explanationQuality: 'off-track',
      feedbackTutor: `Dòng đó chưa phải chỗ cần soi đâu. ${lesson.hintLevel1}`,
      reactionBo: 'Ủa dòng đó tớ thấy tính vẫn chuẩn mà ta, cậu xem kỹ lại mấy dòng khác xem?'
    };
  }

  const cleanText = explanation.trim().toLowerCase();

  // Check for very vague/insufficient explanation
  const vaguePhrases = ['sai', 'sai rồi', 'thấy sai', 'vì thấy nó sai sai', 'sai sai', 'kì', 'kỳ quá', 'không đúng', 'bị sai'];
  const isVague = cleanText.length < 12 || vaguePhrases.some(p => cleanText === p);

  if (isVague) {
    return {
      isCorrectStep: true,
      explanationQuality: 'partial',
      feedbackTutor: `Gần đúng rồi đó! Em thử nói rõ hơn xem — ${getProbeQuestion(lesson)}`,
      reactionBo: 'Ủa, chỗ đó tớ có làm gì sai thật hả cậu?'
    };
  }

  // Strip out trivial references like "dòng 3", "bước 3", "dòng 2" before matching
  const textWithoutStepReferences = cleanText
    .replace(/(dòng|bước|dong|buoc)\s*\d+/gi, '')
    .trim();

  // Check for presence of key conceptual words
  const matchCount = lesson.keywords.filter(kw => textWithoutStepReferences.includes(kw.toLowerCase())).length;

  // Genuine pedagogical assessment: Must have at least 1 conceptual keyword or mathematical rule match
  if (matchCount > 0) {
    return {
      isCorrectStep: true,
      explanationQuality: 'thorough',
      feedbackTutor: `Chính xác! Bo đã ${lesson.errorDescription.toLowerCase()} Em vừa giải thích rất rõ ràng.`,
      reactionBo: getBoConcession(lesson)
    };
  }

  return {
    isCorrectStep: true,
    explanationQuality: 'partial',
    feedbackTutor: `Gần đúng rồi đó! Em thử nói rõ hơn xem — ${getProbeQuestion(lesson)}`,
    reactionBo: getBoChallenge(lesson)
  };
}

function getProbeQuestion(lesson: MisconceptionItem): string {
  switch (lesson.id) {
    case 'MISC_001':
      return 'quy tắc gì khiến dấu bị đổi khi chuyển vế?';
    case 'MISC_002':
      return 'muốn cộng hai phân số khác mẫu thì phải làm gì trước?';
    case 'MISC_003':
      return 'quy tắc nhân hai luỹ thừa cùng cơ số là cộng hay nhân số mũ?';
    case 'MISC_004':
      return 'phép tính nhân và phép tính cộng, phép nào cần làm trước?';
    case 'MISC_005':
      return 'kết quả phép tính 10 − 6 là bao nhiêu, Bo đã chép số mấy?';
    case 'MISC_006':
      return 'khi trước ngoặc có dấu trừ, các số hạng trong ngoặc đổi dấu thế nào?';
    case 'MISC_007':
      return '20% tăng thêm này nên tính trên giá ban đầu hay giá đã giảm?';
    case 'MISC_008':
      return 'khi chia cả hai vế cho số âm thì dấu so sánh phải đổi thế nào?';
    default:
      return 'quy tắc toán học áp dụng ở bước này là gì?';
  }
}

export function getBoChallenge(lesson: MisconceptionItem): string {
  switch (lesson.id) {
    case 'MISC_001':
      return 'Ủa cậu ơi, (x − 3) = 0 thì x = −3 chứ, số 3 đang có dấu trừ đằng trước mà, sao lại thành dương được?';
    case 'MISC_002':
      return 'Ủa tử cộng tử, mẫu cộng mẫu 1/3 + 1/4 = 2/7 vừa nhanh vừa gọn, tự nhiên quy đồng mẫu chi cho cực vậy?';
    case 'MISC_003':
      return 'Ủa 2³ × 2² là phép nhân mà cậu, số mũ nhân nhau 3 × 2 = 6 mới chuẩn chứ sao lại tự nhiên cộng số mũ?';
    case 'MISC_004':
      return 'Ủa đọc từ trái qua phải thì 3 + 4 = 7 rồi nhân 2 = 14 chứ sao tự nhiên lại nhảy cóc nhân trước?';
    case 'MISC_005':
      return 'Ủa x = 6 thì tớ thấy số 6 đẹp nên chép luôn y = 6 cho đối xứng, tính toán chi nhiều!';
    case 'MISC_006':
      return 'Ủa phá ngoặc thì cứ xoá dấu ngoặc đi thôi, tự nhiên đổi dấu −2 thành +2 làm chi cho rắc rối vậy?';
    case 'MISC_007':
      return 'Ủa giảm 20% rồi lại tăng 20% thì huề vốn 200.000đ chứ sao nữa cậu!';
    case 'MISC_008':
      return 'Ủa đề bài là dấu lớn hơn > cơ mà, sao nghiệm của cậu lại quay ngoắt thành dấu nhỏ hơn <? Tự nhiên đổi chiều dấu là sao?';
    default:
      return 'Ủa tớ thấy làm thế này nhanh hơn nhiều mà? Cậu chỉ ra xem tớ sai chỗ nào?';
  }
}

export function getBoConcession(lesson: MisconceptionItem): string {
  switch (lesson.id) {
    case 'MISC_001':
      return 'Ơ đúng ha! Khi cộng 3 vào cả hai vế thì (x − 3) + 3 = 0 + 3 nên x = 3! Tớ chuyển vế mà quên đổi dấu!';
    case 'MISC_002':
      return 'Ơ đúng thật! Mẫu số khác nhau thì phần chia không bằng nhau, phải quy đồng mẫu trước mới cộng được!';
    case 'MISC_003':
      return 'À tớ hiểu rồi! 2³ là 3 số 2, 2² là 2 số 2, nhân lại là 5 số 2 tức 2⁵, phải cộng số mũ chứ không phải nhân!';
    case 'MISC_004':
      return 'Ừ ha! Phép nhân là phép cộng lặp lại, có độ ưu tiên cao hơn nên luôn phải nhân chia trước, cộng trừ sau!';
    case 'MISC_005':
      return 'Ái chà, tớ chép ẩu quá! 10 − 6 = 4 mà tay lại chép thành 6, cảm ơn cậu đã soi ra!';
    case 'MISC_006':
      return 'A đúng rồi! Dấu trừ đằng trước ngoặc là nhân với −1, nên −1 × (−2) phải đổi dấu thành +2!';
    case 'MISC_007':
      return 'Ơ đúng thật! 20% tăng là tính trên 160k đã giảm chứ không phải giá gốc 200k ban đầu, vậy là 192k!';
    case 'MISC_008':
      return 'À tớ nhớ rồi! Khi chia cho số âm −2 thì chiều bất đẳng thức bị đảo ngược, nên > phải đổi thành < !';
    default:
      return 'Ơ đúng ha! Cậu giải thích rất chuẩn xác, tớ tâm phục khẩu phục rồi!';
  }
}

export function evaluateRebuttalOffline(
  lesson: MisconceptionItem,
  rebuttal: string
): { isSharp: boolean; boReaction: string; tutorFeedback: string } {
  const clean = rebuttal.trim().toLowerCase();
  
  // Real semantic match: Check against keywords and conceptual tokens
  const matchCount = lesson.keywords.filter(kw => clean.includes(kw.toLowerCase())).length;
  const isSharp = matchCount > 0 || clean.includes('quy tắc') || clean.includes('bản chất') || clean.includes('vì') && clean.length > 15;

  if (isSharp) {
    return {
      isSharp: true,
      boReaction: getBoConcession(lesson),
      tutorFeedback: `Rất sắc sảo! Em đã chỉ ra đúng bản chất: ${lesson.standardExplanation}`
    };
  }

  return {
    isSharp: false,
    boReaction: 'Ủa nhưng giải thích như vậy tớ vẫn chưa thông lắm, cậu nói rõ hơn chút nữa đi?',
    tutorFeedback: lesson.hintLevel1
  };
}
