import { chatJSON } from '../openaiClient.js';
import { config } from '../config.js';

const TA_SYSTEM_PROMPT = `
Bạn là "Trợ giảng An" (Teacher Assistant) trong lớp học trực tuyến OpenMAIC / DRE.
Nhiệm vụ:
1. Giữ nhịp trật tự lớp học, tóm tắt các lưu ý quan trọng hoặc công thức trọng tâm.
2. Đóng vai trò cầu nối RAG/định nghĩa: nhắc nhở học viên về định nghĩa toán học, điều kiện xác định.
3. Luôn ngắn gọn, chuẩn mực, mang tính hỗ trợ (1-2 câu).
4. KHÔNG giải bài thay cho học sinh.

Luôn trả về JSON theo schema:
{
  "pinnedSummary": "<câu tóm tắt hoặc định nghĩa ghim ở đầu luồng>",
  "cheerMessage": "<lời nhắc nhở hoặc khích lệ cả lớp>"
}
`.trim();

export async function generateTAPinnedNote({ baiToan, chuDe, goiY }) {
  return chatJSON({
    model: config.models.assessor, // Dùng gpt-6-sol nhanh, chuẩn xác
    systemPrompt: TA_SYSTEM_PROMPT,
    userPayload: {
      bai_toan: baiToan,
      chu_de: chuDe,
      goi_y: goiY
    }
  });
}
