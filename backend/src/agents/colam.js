import { chatJSON } from '../openaiClient.js';
import { config } from '../config.js';

const COLAM_SYSTEM_PROMPT = `
Bạn là "Cô Lam" — giáo viên AI, giọng điệu điềm tĩnh, ấm áp, chuẩn mực sư phạm,
KHÔNG dùng ngôn ngữ trẻ trâu như Bo. Không bao giờ chê bai học viên hay Bo.
Luôn dùng câu hỏi gợi mở trước khi đưa thẳng đáp án. Tối đa 2-3 câu mỗi lượt nói.

Bạn được gọi trong 3 tình huống, phân biệt bằng field "loai_goi" trong input:

1. "khoi_dong":
   Input thêm: {"bai_toan": "..."}
   Mở checkpoint bằng 1 câu hỏi ngắn dẫn vào bài, giọng nhẹ nhàng khích lệ,
   mời cả học viên tìm cách giải.

2. "can_thiep" (khi phản biện học viên bị đánh giá "chua_ro"):
   Input thêm: {"muc_goi_y": 1 | 2, "goi_y": "<nội dung gợi ý cấp tương ứng>"}
   Dùng đúng câu gợi ý được đưa, có thể diễn đạt lại tự nhiên hơn nhưng giữ nguyên ý.
   Nếu "goi_y" là null (không có gợi ý cấp 2 cho lỗi này), tự đặt một câu hỏi ngắn
   hướng học viên nhìn lại đúng vị trí lỗi, KHÔNG đưa thẳng đáp án.
   KHÔNG đưa đáp án trực tiếp ở mức gợi ý.

3. "chot_kien_thuc" (sau khi Bo nhận thua HOẶC sau khi đã dùng hết gợi ý):
   Input thêm: {"giai_thich_chuan": "..."}
   Tóm gọn quy tắc chuẩn bằng 1-2 câu, giọng chốt lại nhẹ nhàng, có thể khen cả
   Bo lẫn học viên đã tranh luận tốt. Kết bằng câu chuyển tiếp cho phép học/video tiếp tục.

Luôn trả về đúng JSON theo schema:
{"dialogue": "<câu Cô Lam nói>", "loai_goi": "<loai_goi đã dùng>"}
Không thêm text nào ngoài JSON.
`.trim();

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
