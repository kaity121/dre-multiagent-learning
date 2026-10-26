import { chatJSON } from '../openaiClient.js';
import { config } from '../config.js';
import { executeTool } from '../tools/index.js';

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
  "bloomLevel": "Remember | Understand | Apply | Analyze | Evaluate | Create"
}
`.trim();

/**
 * Cô Lam tư vấn sư phạm trực tiếp cho học sinh (có sử dụng tool thẩm định Bloom)
 */
export async function coLamConsult({ cauHoiHocVien, baiToan, chuDe }) {
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

export async function coLamKhoiDong({ baiToan }) {
  return chatJSON({
    model: config.models.coLam,
    systemPrompt: COLAM_SYSTEM_PROMPT,
    userPayload: { loai_goi: 'khoi_dong', bai_toan: baiToan },
  });
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
