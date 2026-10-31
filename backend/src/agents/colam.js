import { chatJSON } from '../openaiClient.js';
import { config } from '../config.js';
import { executeTool } from '../tools/index.js';
import { SUY_NGHI_RULE } from './thoughtField.js';

const COLAM_SYSTEM_PROMPT = `
Bạn là "Cô Lam" — giáo viên AI chủ trì sư phạm (Pedagogical Director) trong lớp học OpenMAIC / DRE.
Giọng điệu: Điềm tĩnh, ấm áp, chuẩn mực sư phạm, đầy tính khích lệ, dùng phương pháp gợi mở Socratic.
Không bao giờ chê bai học sinh hay bạn học Bo.
Nhiệm vụ chính:
1. Thẩm định câu hỏi và hướng dẫn học sinh theo đúng Thang đo Bloom (từ Nhận biết lên Phân tích, Đánh giá).
2. Nhắc nhở tiêu chí hoàn thành bài toán (Resolution Criteria) mà không giải hộ.
3. Khen ngợi tinh thần phản biện logic của Trí và sự dũng cảm nêu thắc mắc của Bo.

Luôn trả về đúng JSON theo schema:
{
  "dialogue": "<lời Cô Lam hướng dẫn và chốt tiêu chuẩn>",
  "pedagogicalFocus": "<tiêu điểm sư phạm chính>",
  "bloomLevel": "Remember | Understand | Apply | Analyze | Evaluate | Create",
  "suy_nghi": "<tóm tắt ngắn vì sao cô hướng dẫn như vậy>"
}
${SUY_NGHI_RULE}
`.trim();

/**
 * Cô Lam tư vấn sư phạm trực tiếp cho học sinh (có sử dụng tool thẩm định Bloom)
 */
export async function coLamConsult({ cauHoiHocVien, baiToan, chuDe, boiCanhHoiThoai }) {
  // Cô Lam kích hoạt tool thẩm định mức nhận thức Bloom của câu hỏi/nhiệm vụ
  const bloomResult = executeTool('tool_evaluate_bloom_level', {
    question: cauHoiHocVien || baiToan || 'Vectơ trong không gian',
    expected_points: ['Dựng vectơ tổng', 'Áp dụng định lý Pythagore', 'Giải thích vì sao không cộng độ dài trực tiếp'],
  });

  const aiReply = await chatJSON({
    model: config.models.coLam,
    systemPrompt: COLAM_SYSTEM_PROMPT,
    userPayload: {
      cau_hoi_hoc_vien: cauHoiHocVien,
      boi_canh_hoi_thoai: boiCanhHoiThoai || undefined,
      bai_toan: baiToan,
      chu_de: chuDe,
      bloom_assessment: bloomResult.output,
    },
  });

  return {
    ...aiReply,
    toolCall: {
      toolName: bloomResult.toolName,
      status: 'completed',
      category: 'bloom',
      label: 'Cô Lam đang thẩm định chuẩn Bloom...',
      badgeText: `Chuẩn Bloom: ${bloomResult.output.level} (Mức ${bloomResult.output.score}/6)`,
      output: bloomResult.output,
    },
    toolCalls: [
      {
        toolName: bloomResult.toolName,
        status: 'completed',
        category: 'bloom',
        label: 'Cô Lam đang thẩm định chuẩn Bloom...',
        badgeText: `Chuẩn Bloom: ${bloomResult.output.level} (Mức ${bloomResult.output.score}/6)`,
        output: bloomResult.output,
      },
    ],
  };
}

// The checkpoint opening is the only line the student reads while deciding, so it has its own
// narrow prompt: open the question, never answer it, never address other agents.
const COLAM_OPENING_PROMPT = `
Bạn là "Cô Lam", giáo viên AI. Lớp vừa dừng video ở một câu hỏi.
Viết lời mở câu hỏi gửi riêng cho học sinh:
- Tối đa 2 câu ngắn, tổng cộng dưới 40 từ, giọng ấm áp.
- Chỉ mời học sinh tự nghĩ và chọn cách tính. Có thể nhắc một điều cần để ý, ở dạng câu hỏi.
- Không nêu đáp án, không nêu kết quả, không nêu cách giải, không nêu tiêu chí chấm.
- Không gọi tên hay giao việc cho bạn học khác (Trí, Bo, Linh Chi, Minh Khang, Trợ giảng An).
- Không dùng ký hiệu "..." hay "…" thay cho công thức.

Trả về đúng JSON: { "dialogue": "<lời mở>" }
`.trim();

// \b is ASCII-only, so names ending in a Vietnamese letter need Unicode-aware boundaries.
const OTHER_AGENTS = /(?<!\p{L})(Trí|Tri|Bo|Linh Chi|Minh Khang|Trợ giảng|An)(?!\p{L})/u;
const CRITERIA = /(tiêu chí|hoàn thành|resolution|criteria|thang đo bloom)/iu;
const ELIDED_FORMULA = /\|\s*(…|\.\.\.)\s*\||(…|\.\.\.)/u;
const MAX_OPENING_CHARS = 220;

/** The value the worked solution ends on (e.g. "√2"), which the opening must not give away. */
export function finalAnswerOf(giaiThichChuan = '') {
  const tail = String(giaiThichChuan).split('=').pop() || '';
  const value = tail.replace(/[.\s]+$/u, '').trim();
  return value.length > 0 && value.length <= 12 ? value : null;
}

/**
 * Enforces the opening contract on whatever the model returned: at most two sentences addressed to
 * the student, no instructions to other agents, no criteria, no elided formulas, no final answer.
 * Falls back to a plain invitation when nothing usable is left.
 */
export function shapeOpening(dialogue, { baiToan = '', answer = null } = {}) {
  const sentences = String(dialogue || '')
    .replace(/\s+/gu, ' ')
    .split(/(?<=[.!?])\s+/u)
    .map((x) => x.trim())
    .filter(Boolean);
  const kept = sentences
    .filter((x) => !OTHER_AGENTS.test(x) && !CRITERIA.test(x) && !ELIDED_FORMULA.test(x))
    .filter((x) => !(answer && x.includes(answer)))
    .slice(0, 2);
  let text = kept.join(' ');
  if (text.length > MAX_OPENING_CHARS) {
    const cut = text.slice(0, MAX_OPENING_CHARS);
    text = `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 0)).trim()}…`;
  }
  if (text) return text;
  return baiToan
    ? 'Cả lớp dừng ở đây nhé. Em hãy tự chọn cách tính trước, rồi cho cô biết vì sao em chọn như vậy.'
    : 'Cả lớp dừng ở đây nhé. Em hãy tự nghĩ trước rồi chọn câu trả lời.';
}

export async function coLamKhoiDong({ baiToan, giaiThichChuan }) {
  const reply = await chatJSON({
    model: config.models.coLam,
    systemPrompt: COLAM_OPENING_PROMPT,
    userPayload: { loai_goi: 'khoi_dong', bai_toan: baiToan },
  });
  return { ...reply, dialogue: shapeOpening(reply?.dialogue, { baiToan, answer: finalAnswerOf(giaiThichChuan) }) };
}

export async function coLamCanThiep({ baiToan, mucGoiY, goiY }) {
  return chatJSON({
    model: config.models.coLam,
    systemPrompt: COLAM_SYSTEM_PROMPT,
    userPayload: {
      loai_goi: 'can_thiep',
      bai_toan: baiToan,
      muc_goi_y: mucGoiY,
      goi_y: goiY,
    },
  });
}

export async function coLamChotKienThuc({ baiToan, giaiThichChuan }) {
  return chatJSON({
    model: config.models.coLam,
    systemPrompt: COLAM_SYSTEM_PROMPT,
    userPayload: {
      loai_goi: 'chot_kien_thuc',
      bai_toan: baiToan,
      giai_thich_chuan: giaiThichChuan,
    },
  });
}

export default {
  coLamConsult,
  coLamKhoiDong,
  coLamCanThiep,
  coLamChotKienThuc,
};
