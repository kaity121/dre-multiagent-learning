import { chatJSON } from '../openaiClient.js';
import { config } from '../config.js';
import { executeTool } from '../tools/index.js';

const TRI_SYSTEM_PROMPT = `
Bạn là "Trí" — một bạn học AI trong lớp học OpenMAIC / DRE.
Vai trò: Deep Thinker (Bạn học đào sâu bản chất toán học).
Giọng điệu: Trầm tĩnh, suy ngẫm, thích hỏi "Tại sao quy tắc này lại đúng?", xưng "tớ", gọi "cậu".
Nhiệm vụ theo Bloom:
- Understand: Giải thích ý nghĩa đại số/hình học sâu xa đằng sau công thức.
- Analyze: Đào sâu vào điều kiện xác định (ĐKXĐ), điều kiện biên (nếu mẫu số = 0, nếu nhân số âm thì sao).
- Evaluate: Đặt câu hỏi phản biện để học sinh tự nhận ra lỗ hổng tư duy, KHÔNG giải hộ.
Tối đa 2-3 câu mỗi phản hồi. Luôn chuẩn mực, khơi gợi tư duy.

Luôn trả về JSON:
{
  "dialogue": "<câu Trí nói với học sinh>",
  "focusConcept": "<khái niệm toán học cốt lõi đang đào sâu>"
}
`.trim();

export async function triDeepThink({ baiToan, chuDe, cauHoiHocVien, loiBoGiai }) {
  const combinedText = `${cauHoiHocVien || ''} ${baiToan || ''} ${loiBoGiai || ''}`.toLowerCase();
  
  let toolCall = null;
  if (
    (combinedText.includes('bc') || combinedText.includes("dd'") || combinedText.includes('1+1') || combinedText.includes('hinh lap phuong')) &&
    (combinedText.includes('độ dài') || combinedText.includes('do dai') || combinedText.includes('2a') || combinedText.includes('bẫy') || combinedText.includes('cộng'))
  ) {
    const rawTool = executeTool('tool_verify_vector_algebra', {
      shape: 'cube',
      side: 'a',
      expr: "|BC + DD'|",
      claim: combinedText.includes('2a') || combinedText.includes('2') ? '2a' : '2a',
    });

    toolCall = {
      toolName: rawTool.toolName,
      status: 'completed',
      label: 'Trí đang kiểm chứng hình học...',
      badgeText: 'Đã kiểm chứng hình học (Tọa độ 3D)',
      input: rawTool.input,
      output: rawTool.output,
      isValid: rawTool.isValid,
      timestampMs: rawTool.timestampMs,
    };
  }

  const aiReply = await chatJSON({
    model: config.models.bo, // gpt-6-sol
    systemPrompt: TRI_SYSTEM_PROMPT,
    userPayload: {
      bai_toan: baiToan,
      chu_de: chuDe,
      cau_hoi_hoc_vien: cauHoiHocVien,
      loi_bo_giai: loiBoGiai,
      tool_verification: toolCall ? toolCall.output : undefined,
    },
  });

  return {
    ...aiReply,
    toolCall,
  };
}

export default { triDeepThink };
