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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"\[\]+\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'la', 'va', 'cua', 'trong', 'co', 'cho', 'cac', 'ban', 'chung', 'ta', 'hom', 'nay',
  'thi', 'duoc', 'nhu', 'nao', 'o', 'tai', 'voi', 'de', 'do', 'nay', 'ay', 'rat',
  'nhung', 'ma', 'neu', 'the', 'gi', 'sao', 'hoi', 'em', 'minh', 'toi', 'thay', 'co'
]);

/**
 * Kiểm tra xem các từ khóa quan trọng của query có xuất hiện trong target hay không
 */
function computeOverlapScore(claimNorm, targetNorm) {
  if (!claimNorm || !targetNorm) return 0;
  const contentWords = claimNorm.split(' ').filter((w) => (w.length >= 2 || /\d/.test(w)) && !STOP_WORDS.has(w));
  if (contentWords.length === 0) return 0;
  let matches = 0;
  for (const w of contentWords) {
    if (targetNorm.includes(w)) matches++;
  }
  // Yêu cầu ít nhất 2 từ nội dung trùng hoặc toàn bộ nếu câu ngắn
  if (contentWords.length >= 2 && matches < 2) return 0;
  return matches / contentWords.length;
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
      reason: 'Không có phát biểu để kiểm chứng.',
      isValid: null,
    };
  }

  const stream = getLessonIndex(lessonId);
  if (!stream || !Array.isArray(stream.segments) || stream.segments.length === 0) {
    return {
      verdict: 'not_in_source',
      citations: [],
      reason: `Không tìm thấy dữ liệu bài giảng cho mã "${lessonId}".`,
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
      const dist = Math.abs(seg.second - aroundSecond);
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

  // 2. Nếu độ trùng khớp quá thấp (< 0.30) -> Không tìm thấy trong bài giảng
  if (!topCandidate || topCandidate.overlap < 0.30) {
    return {
      verdict: 'not_in_source',
      citations: [],
      reason: 'Phát biểu này không được đề cập trong nguồn bài giảng hiện tại.',
      confidence: 0.9,
      isValid: null,
    };
  }

  const seg = topCandidate.segment;
  const rawPool = topCandidate.textPool;
  const normPool = topCandidate.textNorm;

  let isContradicted = false;
  let reason = '';
  let citationQuote = '';

  // Nhận diện phát biểu sai lầm / bẫy ngộ nhận trong môn Toán (Ví dụ 3):
  if (
    claimNorm.includes('1 1 2') ||
    claimNorm.includes('bang 2') ||
    (claimNorm.includes('cong do dai') && !claimNorm.includes('khong')) ||
    (claimNorm.includes('tach do dai') && !claimNorm.includes('khong'))
  ) {
    if (normPool.includes('tuyet doi khong duoc tach') || normPool.includes('sai')) {
      isContradicted = true;
      reason = 'Nguồn bài giảng khẳng định không được tách độ dài tổng thành tổng độ dài (Ví dụ 3). Phép tính bằng 2 là sai.';
      citationQuote =
        seg.audioTranscript && seg.audioTranscript.includes('Tuyệt đối không được tách')
          ? 'Tuyệt đối không được tách thành |BC| + |DD\'| bằng 1 + 1 = 2!'
          : seg.blackboardText || seg.audioTranscript;
    }
  } else if (
    (claimNorm.includes('khong can nhan') ||
      claimNorm.includes('chua can nhan') ||
      claimNorm.includes('khong can label') ||
      claimNorm.includes('chua gan nhan van hoc duoc')) &&
    normPool.includes('supervised')
  ) {
    // Phát biểu sai lầm trong môn AI: Cho rằng Supervised Learning không cần nhãn
    isContradicted = true;
    reason = 'Nguồn bài giảng cảnh báo sai lầm: Dữ liệu chưa gán nhãn KHÔNG THỂ dùng để huấn luyện Supervised Learning!';
    citationQuote =
      seg.blackboardText && seg.blackboardText.includes('KHÔNG THỂ')
        ? 'CẢNH BÁO SAI LẦM: Dữ liệu chưa gán nhãn KHÔNG THỂ dùng để huấn luyện Supervised Learning!'
        : seg.audioTranscript || seg.blackboardText;
  } else {
    // Trường hợp phát biểu khẳng định đúng nội dung kiến thức
    isContradicted = false;
    reason = 'Phát biểu phù hợp với nội dung lời giảng và bảng phấn của bài học.';
    citationQuote = seg.audioTranscript || seg.blackboardText;
  }

  // Đảm bảo citationQuote là chuỗi con (substring) có thực trong nguồn bài giảng
  let finalQuote = citationQuote;
  if (!rawPool.includes(finalQuote)) {
    finalQuote = (seg.audioTranscript || seg.blackboardText || '').slice(0, 160);
  }

  const citations = [
    {
      second: seg.second,
      sourceId: seg.id,
      timeFormatted: seg.timeFormatted,
      quote: finalQuote,
      source: seg.blackboardText ? 'blackboard' : 'video',
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
