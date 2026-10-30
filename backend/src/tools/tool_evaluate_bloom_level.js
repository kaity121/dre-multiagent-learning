/**
 * tool_evaluate_bloom_level.js
 *
 * Deterministic Tool: Đánh giá cấp độ nhận thức theo Thang đo Bloom (Bloom's Taxonomy)
 * cho các câu hỏi kiểm tra, checkpoint hoặc bài tập sư phạm do Cô Lam / Roundtable sinh ra.
 *
 * Cải tiến theo Issue #29 (DoD):
 * 1. Dùng ranh giới từ (word boundary) thay vì so khớp chuỗi con tự do (.includes).
 *    - "Nêu tính chất..." -> thuộc Remember / Understand, không bị từ "tính" của Apply bắt nhầm.
 *    - "Giải thích..." -> thuộc Understand, không bị từ "giải" của Apply bắt nhầm.
 * 2. Loại bỏ các cụm hardcode gắn với demo (như "tại sao bo sai").
 * 3. Hỗ trợ rubric 6 mức phổ quát cho mọi môn học (Toán, Văn, Sinh, Sử, AI).
 */

const BLOOM_LEVELS = {
  Remember: { 
    score: 1, 
    keywords: ['phát biểu', 'nêu', 'nhắc lại', 'công thức nào', 'liệt kê', 'định nghĩa', 'ký hiệu', 'tên gọi'] 
  },
  Understand: { 
    score: 2, 
    keywords: ['giải thích', 'tại sao', 'ý nghĩa', 'minh hoạ', 'hiểu thế nào', 'tóm tắt', 'nêu tính chất', 'tính chất', 'bản chất'] 
  },
  Apply: { 
    score: 3, 
    keywords: ['tính độ dài', 'tính toán', 'áp dụng', 'tìm độ dài', 'xác định vectơ', 'thực hiện phép tính', 'áp dụng công thức', 'tính'] 
  },
  Analyze: { 
    score: 4, 
    keywords: ['phân tích', 'chỉ ra lỗi', 'sai ở đâu', 'bẫy ngộ nhận', 'ngộ nhận', 'so sánh', 'phản ví dụ', 'phân biệt', 'tìm điểm sai'] 
  },
  Evaluate: { 
    score: 5, 
    keywords: ['đánh giá', 'thẩm định', 'lập luận nào đúng', 'phản biện', 'chứng minh bác bỏ', 'tiêu chí', 'nhận xét'] 
  },
  Create: { 
    score: 6, 
    keywords: ['thiết kế', 'đề xuất', 'tổng quát hoá', 'xây dựng', 'sáng tạo bài toán', 'mở rộng'] 
  },
};

/**
 * Kiểm tra xem từ/cụm từ khoá có xuất hiện dưới dạng ranh giới từ trong văn bản không
 */
function matchesWordBoundary(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s|[.,!?;:()""'])${escaped}($|\\s|[.,!?;:()""'])`, 'i');
  return regex.test(text);
}

/**
 * Hàm thực thi Tool: tool_evaluate_bloom_level
 *
 * @param {Object} input
 * @param {string} input.question - Nội dung câu hỏi cần thẩm định Bloom
 * @param {string[]} [input.expected_points] - Các ý chính học sinh cần đạt
 * @param {string} [input.context] - Ngữ cảnh bài học
 * @returns {Object} { isValid, level, score, indicatorsFound, rationale, suggestions }
 */
export function evaluateBloomLevel({ question, expected_points = [], context = '' } = {}) {
  if (!question) {
    throw new Error('Cần cung cấp nội dung câu hỏi (question) để đánh giá Bloom.');
  }

  const textToScan = `${question} ${expected_points.join(' ')} ${context}`.toLowerCase();

  // ĐẶC THÙ TRANH CHẤP "tính chất" vs "tính" / "giải thích" vs "giải":
  // Nếu câu chứa "tính chất" mà không có cụm tính toán số học, không để "tính" đơn lẻ kích hoạt Apply.
  const hasTinhChat = matchesWordBoundary(textToScan, 'tính chất') || matchesWordBoundary(textToScan, 'nêu tính chất');
  const hasGiaiThich = matchesWordBoundary(textToScan, 'giải thích');

  let matchedLevel = 'Understand'; // Mặc định sư phạm trung hòa
  let maxMatchedScore = 2;
  const indicatorsFound = [];

  // Quét từ khóa theo rubric từng cấp độ với regex ranh giới từ
  for (const [level, meta] of Object.entries(BLOOM_LEVELS)) {
    const hits = meta.keywords.filter(kw => {
      if (kw === 'tính' && (hasTinhChat || hasGiaiThich)) return false;
      return matchesWordBoundary(textToScan, kw);
    });

    if (hits.length > 0) {
      indicatorsFound.push({ level, hits, score: meta.score });
      if (meta.score > maxMatchedScore) {
        maxMatchedScore = meta.score;
        matchedLevel = level;
      }
    }
  }

  // Đánh giá sư phạm
  let rationale = `Câu hỏi thuộc cấp độ ${matchedLevel} (Mức ${maxMatchedScore}/6).`;
  if (matchedLevel === 'Analyze') {
    rationale += ' Câu hỏi yêu cầu học sinh phân tích đào sâu phát hiện lỗi sai, so sánh hoặc làm rõ bản chất.';
  } else if (matchedLevel === 'Apply') {
    rationale += ' Câu hỏi tập trung vào kỹ năng vận dụng, tính toán hoặc thực thi theo quy trình chuẩn.';
  } else if (matchedLevel === 'Evaluate') {
    rationale += ' Câu hỏi đòi hỏi khả năng thẩm định, phản biện hoặc đánh giá tính đúng sai của lập luận.';
  } else if (matchedLevel === 'Remember') {
    rationale += ' Câu hỏi kiểm tra khả năng ghi nhớ và tái hiện định nghĩa, ký hiệu hoặc thông tin trực tiếp.';
  } else {
    rationale += ' Câu hỏi hướng đến việc diễn giải, giải thích bản chất khái niệm.';
  }

  return {
    isValid: true,
    level: matchedLevel,
    score: maxMatchedScore,
    indicatorsFound: indicatorsFound.map(i => `${i.level}: [${i.hits.join(', ')}]`),
    rationale,
    suggestions: maxMatchedScore < 3
      ? 'Có thể nâng cao chất lượng câu hỏi bằng cách hỏi thêm lý do tại sao hoặc yêu cầu chỉ ra bước sai.'
      : 'Cấp độ tư duy phù hợp với chuẩn bài học tương tác sâu (DRE).',
  };
}

export default evaluateBloomLevel;
