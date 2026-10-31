/**
 * Trường "suy_nghi" mà mọi tác nhân chat trả kèm câu nói: một bản tóm tắt ngắn vì sao tác nhân
 * trả lời như vậy, hiển thị trong hồ sơ tác nhân. Không phải chuỗi suy luận ẩn.
 */
export const SUY_NGHI_RULE = `Trường "suy_nghi": 1-2 câu tiếng Việt ngắn (tối đa ~35 từ), đúng cách xưng hô của bạn, tóm tắt điều bạn để ý trong câu của học sinh và vì sao bạn trả lời theo cách này. Đây là lời tóm tắt cho người xem, KHÔNG liệt kê từng bước suy luận, KHÔNG nêu đáp số, kết quả hay lời giải mà "dialogue" chưa nói ra.`;

const MAX_THOUGHT_CHARS = 240;

/** Rút gọn một câu "suy nghĩ" về một dòng, tối đa MAX_THOUGHT_CHARS ký tự; null khi rỗng. */
export function clipThought(text) {
  const flat = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  if (!flat) return null;
  return flat.length > MAX_THOUGHT_CHARS ? `${flat.slice(0, MAX_THOUGHT_CHARS - 1).trim()}…` : flat;
}

/** Đọc "suy_nghi" từ phản hồi LLM; trả null khi thiếu hoặc không phải chuỗi. */
export function readThought(reply) {
  return clipThought(reply?.suy_nghi);
}
