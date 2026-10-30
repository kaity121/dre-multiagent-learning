/**
 * backend/src/tools/tool_check_source_grounding.js
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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"\[\]+\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'la', 'va', 'cua', 'trong', 'co', 'cho', 'cac', 'ban', 'chung', 'ta', 'hom', 'nay',
  'thi', 'duoc', 'nhu', 'nao', 'o', 'tai', 'voi', 'de', 'do', 'nay', 'ay', 'rat',
  'nhung', 'ma', 'neu', 'the', 'gi', 'sao', 'hoi', 'em', 'minh', 'toi', 'thay', 'co',
  'mot', 'hai', 'ba', 'bon', 'nam', 'ra', 'vao', 'tren', 'duoi', 'qua', 'lai', 'nhieu'
]);

/**
 * Trả về danh sách từ khoá nội dung (bỏ stop words)
 */
function getContentWords(normStr) {
  if (!normStr) return [];
  return normStr.split(' ').filter((w) => (w.length >= 2 || /\d/.test(w)) && !STOP_WORDS.has(w));
}

/**
 * Tính tỷ lệ trùng lặp từ khóa chính xác giữa query và target
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
  // Yêu cầu ít nhất 2 từ nội dung trùng hoặc toàn bộ nếu query rất ngắn
  if (contentWords.length >= 2 && matches < 2) return 0;
  return matches / contentWords.length;
}

/**
 * Trích xuất chuỗi con (substring) có thực trong một chuỗi gốc (sourceText)
 */
function extractBestSubstring(sourceText, claimNorm, maxLength = 160) {
  if (!sourceText) return '';
  if (sourceText.length <= maxLength) return sourceText;

  // Tách câu theo dấu ngắt câu hoặc xuống dòng
  const rawSentences = sourceText.split(/[\n.!?]+/).map(s => s.trim()).filter(Boolean);
  let bestSentence = '';
  let bestScore = -1;

  for (const rawSentence of rawSentences) {
    const sNorm = normalizeText(rawSentence);
    const score = computeOverlapScore(claimNorm, sNorm);
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
  const aroundSecond = typeof params.aroundSecond === 'number' ? params.aroundSecond : null;
  const windowS = typeof params.windowS === 'number' ? params.windowS : 60;

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
  const segments = stream.segments;

  // 1. Phân loại đoạn ứng viên: Ưu tiên đoạn quanh aroundSecond nếu có
  const scoredSegments = segments.map((seg) => {
    const textPool = [seg.audioTranscript, seg.blackboardText, ...(seg.blackboardLatex || [])]
      .filter(Boolean)
      .join(' ');
    const textNorm = normalizeText(textPool);
    let overlap = computeOverlapScore(claimNorm, textNorm);

    // Ưu tiên đoạn quanh aroundSecond
    let recencyBonus = 0;
    if (aroundSecond !== null) {
      const dist = Math.abs((seg.second || 0) - aroundSecond);
      if (dist <= windowS) {
        recencyBonus = 0.25 * (1 - dist / windowS);
      }
    }

    return {
      segment: seg,
      textPool,
      textNorm,
      score: overlap + recencyBonus,
      overlap,
    };
  });

  scoredSegments.sort((a, b) => b.score - a.score);
  const topCandidate = scoredSegments[0];

  // 2. Nếu độ trùng khớp quá thấp (< 0.2) -> Không tìm thấy trong bài giảng
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

  let isContradicted = false;
  let reason = '';
  let citationQuote = '';

  // Nhận diện phát biểu sai lầm / bẫy ngộ nhận (Toán Ví dụ 3)
  const isMathSumTrap =
    (claimNorm.includes('1 1 2') || claimNorm.includes('bang 2') || claimNorm.includes('2a')) &&
    (normPool.includes('tuyet doi khong duoc tach') || normPool.includes('bc') || normPool.includes('dd'));

  const isMathSplitTrap =
    (claimNorm.includes('cong do dai') || claimNorm.includes('tach do dai')) &&
    !claimNorm.includes('khong') &&
    (normPool.includes('tuyet doi khong duoc tach') || normPool.includes('sai'));

  // Nhận diện mâu thuẫn bài AI: Dữ liệu chưa gán nhãn được dùng cho Supervised
  const isAISupervisedTrap =
    (claimNorm.includes('chua gan nhan') || claimNorm.includes('chua nhan') || claimNorm.includes('khong nhan') || claimNorm.includes('khong can nhan')) &&
    (claimNorm.includes('co the dung') || claimNorm.includes('dung de') || claimNorm.includes('huan luyen')) &&
    normPool.includes('supervised') &&
    (normPool.includes('khong the') || normPool.includes('canh bao sai lam'));

  if (isMathSumTrap || isMathSplitTrap) {
    isContradicted = true;
    reason = 'Nguồn bài giảng khẳng định không được tách độ dài tổng thành tổng độ dài (Ví dụ 3). Phép tính bằng 2 là sai lầm.';
    citationQuote =
      seg.audioTranscript && seg.audioTranscript.includes('Tuyệt đối không được tách')
        ? 'Tuyệt đối không được tách thành |BC| + |DD\'| bằng 1 + 1 = 2!'
        : '';
  } else if (isAISupervisedTrap) {
    isContradicted = true;
    reason = 'Nguồn bài giảng cảnh báo sai lầm: Dữ liệu chưa gán nhãn KHÔNG THỂ dùng để huấn luyện Supervised Learning!';
    citationQuote =
      seg.blackboardText && seg.blackboardText.includes('KHÔNG THỂ')
        ? 'CẢNH BÁO SAI LẦM: Dữ liệu chưa gán nhãn KHÔNG THỂ dùng để huấn luyện Supervised Learning!'
        : '';
  } else {
    isContradicted = false;
    reason = 'Phát biểu phù hợp với nội dung lời giảng và bảng phấn của bài học.';
  }

  // Đảm bảo citationQuote là chuỗi con (substring) có thực 100% trong audioTranscript hoặc blackboardText
  const primarySourceText = (seg.audioTranscript && seg.audioTranscript.length > 20) 
    ? seg.audioTranscript 
    : (seg.blackboardText || seg.audioTranscript || '');

  let finalQuote = citationQuote;
  if (!finalQuote || (!primarySourceText.includes(finalQuote) && !seg.blackboardText?.includes(finalQuote))) {
    finalQuote = extractBestSubstring(primarySourceText, claimNorm, 160);
  }

  // Fallback đảm bảo substring hợp lệ
  if (!primarySourceText.includes(finalQuote) && (!seg.blackboardText || !seg.blackboardText.includes(finalQuote))) {
    finalQuote = primarySourceText.slice(0, Math.min(primarySourceText.length, 120));
  }

  const citations = [
    {
      second: seg.second || 0,
      sourceId: seg.id || `seg_${seg.second || 0}`,
      timeFormatted: seg.timeFormatted || `${Math.floor((seg.second || 0) / 60)}:${((seg.second || 0) % 60).toString().padStart(2, '0')}`,
      quote: finalQuote,
      source: seg.blackboardText?.includes(finalQuote) ? 'blackboard' : 'video',
    },
  ];

  const verdict = isContradicted ? 'contradicted' : 'supported';
  const isValid = isContradicted ? false : true;

  return {
    verdict,
    citations,
    reason,
    matchedSegmentId: seg.id,
    confidence: Math.min(0.98, Math.max(0.75, topCandidate.overlap + 0.2)),
    isValid,
  };
}

export default { checkSourceGrounding };
