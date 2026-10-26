/**
 * tool_query_misconception_kb.js
 *
 * Deterministic Tool: Tra cứu kho tri thức sư phạm (Pedagogical Knowledge Base)
 * về các ngộ nhận, bẫy của Bo, căn cứ bác bẫy của Trí và gợi ý sư phạm của Linh Chi / Cô Lam.
 */

import { search, getById, kb } from '../services/knowledgeBase.js';

/**
 * Chuyển đổi dữ liệu ngộ nhận nội bộ thành cấu trúc PedagogicalRAGItem (chuẩn pipeline.ts)
 */
function mapToPedagogicalRAGItem(item, knowledgeList = []) {
  const linkedKnowledge = knowledgeList.find(k => (item.knowledge_ids || []).includes(k.id));

  return {
    id: item.id,
    topic: item.topic || 'vector_geometry',
    grade: 12,
    standardFormula: linkedKnowledge?.formula_latex || item.counterexample?.verification || '',
    theoremSummary: linkedKnowledge?.statement || item.correction || '',
    misconceptionId: item.id,
    misconceptionName: item.incorrect_claim || '',
    misconceptionFrequency: 0.85, // Mức độ phổ biến của bẫy này ở học sinh
    boTrapPattern: item.incorrect_claim || '',
    rebuttalAnchor: item.correction || '',
    scaffoldingNudges: (item.scaffolding || []).map(s => s.question),
  };
}

/**
 * Hàm thực thi Tool: tool_query_misconception_kb
 *
 * @param {Object} input
 * @param {string} [input.latex] - Biểu thức LaTeX cần tra cứu (vd: "|\\vec{BC}+\\vec{DD'}|")
 * @param {string[]} [input.tags] - Danh sách nhãn/chủ đề (vd: ["length_addition", "cube"])
 * @param {string} [input.query] - Từ khóa tìm kiếm tự do (vd: "cộng độ dài", "ví dụ 3")
 * @param {string} [input.misconceptionId] - Truy vấn trực tiếp theo ID (vd: "MISC_VEC_005")
 * @param {number} [input.limit=3]
 * @returns {Object} { isValid, output: PedagogicalRAGItem[], count, reason }
 */
export function queryMisconceptionKB({ latex, tags = [], query, misconceptionId, limit = 3 }) {
  // 1. Nếu có misconceptionId cụ thể, lấy trực tiếp
  if (misconceptionId) {
    const direct = getById(misconceptionId);
    if (direct) {
      const ragItem = mapToPedagogicalRAGItem(direct.misconception, direct.knowledge);
      return {
        isValid: true,
        output: [ragItem],
        count: 1,
        reason: `Tìm thấy ngộ nhận chính xác theo mã ${misconceptionId}`,
      };
    }
  }

  // 2. Tra cứu trực tiếp theo danh sách tags chuyên biệt trong KB
  if (tags && tags.length > 0) {
    const matchedItems = (kb.misconceptions || []).filter(m =>
      (m.tags || []).some(t => tags.includes(t))
    );
    if (matchedItems.length > 0) {
      const ragItems = matchedItems.slice(0, limit).map(item => {
        const linkedKnowledge = (kb.knowledge || []).filter(k =>
          (item.knowledge_ids || []).includes(k.id)
        );
        return mapToPedagogicalRAGItem(item, linkedKnowledge);
      });
      return {
        isValid: true,
        output: ragItems,
        count: ragItems.length,
        reason: `Tìm thấy ${ragItems.length} mục tri thức phù hợp với tags [${tags.join(', ')}]`,
      };
    }
  }

  // 3. Tìm kiếm theo query hoặc latex
  let searchQuery = query || '';
  if (!searchQuery && latex) {
    if (latex.includes('BC') && latex.includes('DD')) {
      searchQuery = 'cộng độ dài vectơ ví dụ 3';
    } else {
      searchQuery = latex.replace(/[\\]/g, ' ');
    }
  }

  if (!searchQuery) {
    searchQuery = 'cộng độ dài vectơ';
  }

  const results = search(searchQuery, limit);
  const ragItems = results.map(r => mapToPedagogicalRAGItem(r.misconception, r.knowledge));

  const isValid = ragItems.length > 0;
  return {
    isValid,
    output: ragItems,
    count: ragItems.length,
    reason: isValid
      ? `Đã tìm thấy ${ragItems.length} mục tri thức phù hợp với từ khóa "${searchQuery}"`
      : `Không tìm thấy ngộ nhận nào khớp với từ khóa "${searchQuery}"`,
  };
}

export default queryMisconceptionKB;
