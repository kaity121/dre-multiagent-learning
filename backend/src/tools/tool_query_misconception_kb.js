/**
 * tool_query_misconception_kb.js
 *
 * Deterministic Tool: Tra cứu kho tri thức sư phạm (Pedagogical Knowledge Base)
 * về các ngộ nhận, bẫy của Bo, căn cứ bác bẫy của Trí và gợi ý sư phạm của Linh Chi / Cô Lam.
 *
 * Subject-Agnostic Core:
 * - Khi không có tham số tìm kiếm (empty query/tags/id): Trả về rỗng thay vì mặc định MISC_VEC_005.
 * - Loại bỏ gán cứng BC/DD sang Ví dụ 3 bài toán hình lập phương.
 * - misconceptionFrequency: Trả về null khi chưa đo đạc (empirical_frequency === "not_measured"), không bịa 0.85.
 */

import { search, getById, kb } from '../services/knowledgeBase.js';

/**
 * Chuyển đổi dữ liệu ngộ nhận nội bộ thành cấu trúc PedagogicalRAGItem (chuẩn pipeline.ts)
 */
function mapToPedagogicalRAGItem(item, knowledgeList = []) {
  const linkedKnowledge = knowledgeList.find(k => (item.knowledge_ids || []).includes(k.id));

  // Tần suất ngộ nhận: nếu chưa đo đạc ("not_measured"), trả về null (tránh số ảo 0.85)
  let frequency = null;
  if (typeof item.frequency === 'number') {
    frequency = item.frequency;
  } else if (item.empirical_frequency && item.empirical_frequency !== 'not_measured') {
    frequency = parseFloat(item.empirical_frequency) || null;
  }

  return {
    id: item.id,
    topic: item.topic || 'vector_geometry',
    grade: item.grade || 12,
    standardFormula: linkedKnowledge?.formula_latex || item.counterexample?.verification || '',
    theoremSummary: linkedKnowledge?.statement || item.correction || '',
    misconceptionId: item.id,
    misconceptionName: item.incorrect_claim || item.name || '',
    misconceptionFrequency: frequency,
    boTrapPattern: item.incorrect_claim || '',
    rebuttalAnchor: item.correction || '',
    scaffoldingNudges: (item.scaffolding || []).map(s => s.question),
  };
}

/**
 * Hàm thực thi Tool: tool_query_misconception_kb
 *
 * @param {Object} input
 * @param {string} [input.latex] - Biểu thức LaTeX cần tra cứu
 * @param {string[]} [input.tags] - Danh sách nhãn/chủ đề
 * @param {string} [input.query] - Từ khóa tìm kiếm tự do
 * @param {string} [input.misconceptionId] - Truy vấn trực tiếp theo ID
 * @param {number} [input.limit=3]
 * @returns {Object} { isValid, output: PedagogicalRAGItem[], count, reason }
 */
export function queryMisconceptionKB({ latex, tags = [], query, misconceptionId, limit = 3 } = {}) {
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

  // 3. Tìm kiếm theo query hoặc latex (không ép mặc định về vectơ)
  let searchQuery = (query || '').trim();
  if (!searchQuery && latex) {
    searchQuery = latex.replace(/[\\]/g, ' ').trim();
  }

  // Nếu hoàn toàn không có tiêu chí tìm kiếm nào được cung cấp: Trả về rỗng (DoD yêu cầu không mặc định)
  if (!searchQuery) {
    return {
      isValid: false,
      output: [],
      count: 0,
      reason: 'Không có từ khóa, biểu thức latex hoặc tag nào được cung cấp để tra cứu KB.',
    };
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
