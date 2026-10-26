/**
 * tool_evaluate_bloom_level.js
 *
 * Deterministic Tool: Đánh giá cấp độ nhận thức theo Thang đo Bloom (Bloom's Taxonomy)
 * cho các câu hỏi kiểm tra, checkpoint hoặc bài tập sư phạm do Cô Lam / Roundtable sinh ra.
 *
 * Các cấp độ:
 * 1. Remember: Nhận biết, nhớ lại định nghĩa, công thức.
 * 2. Understand: Thông hiểu, giải thích bản chất, diễn giải.
 * 3. Apply: Vận dụng, tính toán cụ thể theo công thức.
 * 4. Analyze: Phân tích, chỉ ra lỗi sai, phân tích bẫy/ngộ nhận, so sánh.
 * 5. Evaluate: Đánh giá, thẩm định lập luận, phản biện giải pháp.
 * 6. Create: Sáng tạo, xây dựng bài toán mới, tổng quát hóa.
 */

const BLOOM_LEVELS = {
  Remember: { score: 1, keywords: ['phát biểu', 'nêu', 'nhắc lại', 'công thức nào', 'liệt kê', 'định nghĩa', 'ký hiệu'] },
  Understand: { score: 2, keywords: ['giải thích', 'tại sao', 'ý nghĩa', 'minh hoạ', 'hiểu thế nào', 'tóm tắt'] },
  Apply: { score: 3, keywords: ['tính', 'áp dụng', 'tìm độ dài', 'xác định vectơ', 'thực hiện phép tính', 'giải'] },
  Analyze: { score: 4, keywords: ['phân tích', 'chỉ ra lỗi', 'sai ở đâu', 'bẫy', 'ngộ nhận', 'so sánh', 'phản ví dụ', 'tại sao bo sai'] },
  Evaluate: { score: 5, keywords: ['đánh giá', 'thẩm định', 'lập luận nào đúng', 'phản biện', 'chứng minh bác bỏ', 'tiêu chí'] },
  Create: { score: 6, keywords: ['thiết kế', 'đề xuất', 'tổng quát hoá', 'xây dựng', 'sáng tạo bài toán'] },
};

/**
 * Hàm thực thi Tool: tool_evaluate_bloom_level
 *
 * @param {Object} input
 * @param {string} input.question - Nội dung câu hỏi cần thẩm định Bloom
 * @param {string[]} [input.expected_points] - Các ý chính học sinh cần đạt
 * @param {string} [input.context] - Ngữ cảnh bài học
 * @returns {Object} { isValid, level, score, indicatorsFound, rationale, suggestions }
 */
export function evaluateBloomLevel({ question, expected_points = [], context = '' }) {
  if (!question) {
    throw new Error('Cần cung cấp nội dung câu hỏi (question) để đánh giá Bloom.');
  }

  const textToScan = `${question} ${expected_points.join(' ')} ${context}`.toLowerCase();

  let matchedLevel = 'Understand'; // Mặc định
  let maxMatchedScore = 2;
  const indicatorsFound = [];

  // Quét từ khóa từ cấp cao xuống cấp thấp hoặc tìm điểm khớp mạnh nhất
  for (const [level, meta] of Object.entries(BLOOM_LEVELS)) {
    const hits = meta.keywords.filter(kw => textToScan.includes(kw));
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
    rationale += ' Câu hỏi yêu cầu học sinh đào sâu phát hiện lỗi sai hoặc bản chất hình học đằng sau bẫy ngộ nhận.';
  } else if (matchedLevel === 'Apply') {
    rationale += ' Câu hỏi tập trung vào kỹ năng tính toán và áp dụng công thức vectơ vào hình cụ thể.';
  } else if (matchedLevel === 'Evaluate') {
    rationale += ' Câu hỏi đòi hỏi khả năng thẩm định, phản biện lập luận toán học giữa các bạn học.';
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
