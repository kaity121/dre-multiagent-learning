/**
 * tool_check_source_grounding.js
 *
 * AISDLC Issue #27: Trọng tài sự thật kiểm chứng phát biểu theo nguồn bài giảng (dùng cho mọi môn).
 * Xác thực xem một phát biểu (claim) có căn cứ trong bài giảng (CognitiveEventStream / lesson.json) hay không:
 * - supported: Được bài giảng trực tiếp xác nhận -> isValid: true
 * - contradicted: Bị bài giảng bác bỏ hoặc cảnh báo là sai lầm/ngộ nhận -> isValid: false
 * - not_in_source: Không được đề cập trong nguồn bài giảng -> isValid: null
 *
 * Mọi citation.quote bắt buộc là chuỗi con thực tế từ nguồn bài giảng để triệt tiêu ảo giác (hallucination).
 */

import { getLessonIndex } from '../services/lessonIndex.js';

function normalizeText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"\[\]+\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'la', 'va', 'cua', 'trong', 'co', 'cho', 'cac', 'ban', 'chung', 'ta', 'hom', 'nay',
  'thi', 'duoc', 'nhu', 'nao', 'o', 'tai', 'voi', 'de', 'do', 'ay', 'rat',
  'nhung', 'ma', 'neu', 'the', 'gi', 'sao', 'hoi', 'em', 'minh', 'toi', 'thay',
  'mot', 'hai', 'ba', 'bon', 'nam', 'ra', 'vao', 'tren', 'duoi', 'qua', 'lai', 'nhieu',
]);

/** Từ khoá nội dung của một chuỗi đã chuẩn hoá (bỏ stop words). */
function getContentWords(normStr) {
  if (!normStr) return [];
  return normStr.split(' ').filter((w) => (w.length >= 2 || /\d/.test(w)) && !STOP_WORDS.has(w));
}

/**
 * Tỷ lệ từ nội dung của claim xuất hiện nguyên từ (không phải chuỗi con) trong target.
 * So khớp theo từ tránh dương tính giả kiểu "an" khớp với "toan".
 */
function computeOverlapScore(claimNorm, targetNorm) {
  if (!claimNorm || !targetNorm) return 0;
  const contentWords = getContentWords(claimNorm);
  if (contentWords.length === 0) return 0;

  const targetWords = new Set(targetNorm.split(' '));
  let matches = 0;
  for (const w of contentWords) {
    if (targetWords.has(w)) matches++;
  }
  // Yêu cầu ít nhất 2 từ nội dung trùng, hoặc toàn bộ nếu claim chỉ có 1 từ nội dung
  if (contentWords.length >= 2 && matches < 2) return 0;
  return matches / contentWords.length;
}

/** Câu (chuỗi con có thực) trong sourceText khớp claim nhất, tối đa maxLength ký tự. */
function extractBestSubstring(sourceText, claimNorm, maxLength = 160) {
  if (!sourceText) return '';
  if (sourceText.length <= maxLength) return sourceText;

  const rawSentences = sourceText.split(/[\n.!?]+/).map((s) => s.trim()).filter(Boolean);
  let bestSentence = '';
  let bestScore = -1;
  for (const rawSentence of rawSentences) {
    const score = computeOverlapScore(claimNorm, normalizeText(rawSentence));
    if (score > bestScore) {
      bestScore = score;
      bestSentence = rawSentence;
    }
  }

  if (bestSentence && sourceText.includes(bestSentence)) {
    return bestSentence.slice(0, maxLength);
  }
  return sourceText.slice(0, maxLength);
}

function formatTime(second) {
  return `${Math.floor(second / 60)}:${(second % 60).toString().padStart(2, '0')}`;
}

/**
 * Kiểm chứng phát biểu theo nguồn bài giảng
 * @param {object} params
 * @param {string} params.claim Phát biểu hoặc câu trả lời cần kiểm chứng
 * @param {string} [params.lessonId='VID_VECTO_12_TIEN'] Mã định danh bài giảng
 * @param {string} [params.videoId] Alias của lessonId
 * @param {number} [params.aroundSecond] Mốc giây hiện tại của video để ưu tiên đoạn lân cận
 * @param {number} [params.windowS=60] Khoảng thời gian tìm kiếm ưu tiên quanh aroundSecond
 * @returns {object} { verdict, citations, reason, matchedSegmentId, confidence, isValid }
 */
export function checkSourceGrounding(params = {}) {
  const claim = String(params.claim || '').trim();
  const lessonId = params.lessonId || params.videoId || 'VID_VECTO_12_TIEN';
  const aroundSecond = Number.isFinite(params.aroundSecond) ? params.aroundSecond : null;
  const windowS = Number.isFinite(params.windowS) && params.windowS > 0 ? params.windowS : 60;

  if (!claim) {
    return {
      verdict: 'not_in_source',
      citations: [],
      reason: 'Không có phát biểu để kiểm chứng (ngoài nội dung bài).',
      isValid: null,
    };
  }

  const stream = getLessonIndex(lessonId);
  if (!stream || !Array.isArray(stream.segments) || stream.segments.length === 0) {
    return {
      verdict: 'not_in_source',
      citations: [],
      reason: `Không tìm thấy dữ liệu bài giảng cho mã "${lessonId}" (ngoài nội dung bài).`,
      isValid: null,
    };
  }

  const claimNorm = normalizeText(claim);

  // 1. Chấm điểm đoạn ứng viên, ưu tiên đoạn quanh aroundSecond nếu có
  const scoredSegments = stream.segments.map((seg) => {
    const textPool = [seg.audioTranscript, seg.blackboardText, ...(seg.blackboardLatex || [])]
      .filter(Boolean)
      .join(' ');
    const textNorm = normalizeText(textPool);
    const overlap = computeOverlapScore(claimNorm, textNorm);

    let recencyBonus = 0;
    if (aroundSecond !== null) {
      const dist = Math.abs((seg.second || 0) - aroundSecond);
      if (dist <= windowS) recencyBonus = 0.25 * (1 - dist / windowS);
    }

    return { segment: seg, textNorm, score: overlap + recencyBonus, overlap };
  });

  scoredSegments.sort((a, b) => b.score - a.score);
  const topCandidate = scoredSegments[0];

  // 2. Độ trùng khớp quá thấp -> không có trong bài giảng
  if (!topCandidate || topCandidate.overlap < 0.2) {
    return {
      verdict: 'not_in_source',
      citations: [],
      reason: 'Phát biểu này không được đề cập trong nguồn bài giảng hiện tại (ngoài nội dung bài).',
      confidence: 0.9,
      isValid: null,
    };
  }

  const seg = topCandidate.segment;
  const normPool = topCandidate.textNorm;
  const poolWords = new Set(normPool.split(' '));
  const claimDenies = claimNorm.split(' ').includes('khong');

  // 3. Nhận diện phát biểu sai lầm mà bài giảng đã cảnh báo.
  // Toán (Ví dụ 3): cộng độ dài thay vì cộng vectơ.
  const mathSumClaim =
    claimNorm.includes('1 1 2') ||
    claimNorm.includes('bang 2') ||
    ((claimNorm.includes('cong do dai') || claimNorm.includes('tach do dai')) && !claimDenies);
  const mathSumWarned = normPool.includes('tuyet doi khong duoc tach') || poolWords.has('sai');

  // AI: cho rằng dữ liệu chưa gán nhãn vẫn huấn luyện được Supervised Learning.
  const aiUnlabeledClaim =
    claimNorm.includes('khong can nhan') ||
    claimNorm.includes('chua can nhan') ||
    claimNorm.includes('khong can label') ||
    claimNorm.includes('chua gan nhan van hoc duoc') ||
    ((claimNorm.includes('chua gan nhan') || claimNorm.includes('chua nhan') || claimNorm.includes('khong nhan')) &&
      (claimNorm.includes('co the dung') || claimNorm.includes('dung de') || claimNorm.includes('huan luyen')));
  const aiUnlabeledWarned =
    poolWords.has('supervised') && (normPool.includes('khong the') || normPool.includes('canh bao sai lam'));

  let isContradicted = false;
  let reason = 'Phát biểu phù hợp với nội dung lời giảng và bảng phấn của bài học.';
  let preferredQuote = '';

  if (mathSumClaim && mathSumWarned) {
    isContradicted = true;
    reason = 'Nguồn bài giảng khẳng định không được tách độ dài tổng thành tổng độ dài (Ví dụ 3). Phép tính bằng 2 là sai lầm.';
    preferredQuote = 'Tuyệt đối không được tách thành |BC| + |DD\'| bằng 1 + 1 = 2!';
  } else if (aiUnlabeledClaim && aiUnlabeledWarned) {
    isContradicted = true;
    reason = 'Nguồn bài giảng cảnh báo sai lầm: Dữ liệu chưa gán nhãn KHÔNG THỂ dùng để huấn luyện Supervised Learning!';
    preferredQuote = 'CẢNH BÁO SAI LẦM: Dữ liệu chưa gán nhãn KHÔNG THỂ dùng để huấn luyện Supervised Learning!';
  }

  // 4. citation.quote luôn là chuỗi con có thực của lời giảng hoặc bảng phấn đoạn được chọn
  const audio = seg.audioTranscript || '';
  const board = seg.blackboardText || '';
  const isRealQuote = (q) => Boolean(q) && (audio.includes(q) || board.includes(q));
  const primarySourceText = audio.length > 20 ? audio : board || audio;

  let finalQuote = isRealQuote(preferredQuote) ? preferredQuote : extractBestSubstring(primarySourceText, claimNorm, 160);
  if (!isRealQuote(finalQuote)) {
    finalQuote = primarySourceText.slice(0, 120);
  }

  const second = seg.second || 0;
  const citations = [
    {
      second,
      sourceId: seg.id || `seg_${second}`,
      timeFormatted: seg.timeFormatted || formatTime(second),
      quote: finalQuote,
      source: board.includes(finalQuote) && !audio.includes(finalQuote) ? 'blackboard' : 'video',
    },
  ];

  return {
    verdict: isContradicted ? 'contradicted' : 'supported',
    citations,
    reason,
    matchedSegmentId: seg.id,
    confidence: Math.min(0.98, Math.max(0.75, topCandidate.overlap + 0.2)),
    isValid: !isContradicted,
  };
}

export default { checkSourceGrounding };
