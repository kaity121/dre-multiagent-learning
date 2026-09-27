import { chatJSON } from '../openaiClient.js';
import { config } from '../config.js';

const ASSESSOR_SYSTEM_PROMPT = `
Bạn là bộ chấm ngầm cho một app học Toán, KHÔNG có giọng điệu nhân vật, chỉ trả JSON,
không giải thích thừa, không thân thiện, chỉ chấm chính xác.

Nhiệm vụ 1 — chấm câu trả lời gốc của học viên (field "nhiem_vu" = "cham_dap_an"):
Input: {"nhiem_vu": "cham_dap_an", "bai_toan": "...", "cau_tra_loi_hoc_vien": "...", "giai_thich_chuan": "..."}
Output: {"danh_gia": "dung" | "sai", "ly_do_ngan": "<tối đa 1 câu, nội bộ, không hiển thị cho học viên>"}
So khớp theo Ý NGHĨA toán học, không theo từ ngữ giống hệt — chấp nhận cách diễn đạt khác nếu bản chất đúng.
Nếu học viên chỉ ra đúng đáp số nhưng thiếu lập luận, vẫn coi là "dung" trừ khi bài toán yêu cầu tường trình rõ ràng.

Nhiệm vụ 2 — chấm phản biện của học viên với Bo (field "nhiem_vu" = "cham_phan_bien"):
Input: {"nhiem_vu": "cham_phan_bien", "phan_bien_hoc_vien": "...", "giai_thich_chuan": "...", "mo_ta_loi": "..."}
Output: {"danh_gia_phan_bien": "sac_ben" | "chua_ro", "ly_do_ngan": "<tối đa 1 câu, nội bộ>"}
"sac_ben" = học viên nêu đúng NGUYÊN NHÂN gốc của lỗi (không chỉ nói "sai rồi" chung chung,
phải chạm đúng vào "mo_ta_loi"). "chua_ro" nếu học viên chỉ khẳng định mà không giải thích được vì sao.

Luôn trả về đúng JSON theo đúng schema của nhiệm vụ tương ứng. Không thêm text nào ngoài JSON.
`.trim();

export async function chamDapAn({ baiToan, cauTraLoiHocVien, giaiThichChuan }) {
  const result = await chatJSON({
    model: config.models.assessor,
    systemPrompt: ASSESSOR_SYSTEM_PROMPT,
    temperature: 0.2,
    userPayload: {
      nhiem_vu: 'cham_dap_an',
      bai_toan: baiToan,
      cau_tra_loi_hoc_vien: cauTraLoiHocVien,
      giai_thich_chuan: giaiThichChuan,
    },
  });
  return result;
}

export async function chamPhanBien({ phanBienHocVien, giaiThichChuan, moTaLoi }) {
  const result = await chatJSON({
    model: config.models.assessor,
    systemPrompt: ASSESSOR_SYSTEM_PROMPT,
    temperature: 0.2,
    userPayload: {
      nhiem_vu: 'cham_phan_bien',
      phan_bien_hoc_vien: phanBienHocVien,
      giai_thich_chuan: giaiThichChuan,
      mo_ta_loi: moTaLoi,
    },
  });
  return result;
}
