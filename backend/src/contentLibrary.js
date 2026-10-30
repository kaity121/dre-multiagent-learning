/**
 * Content Library v1 — chuyển thẳng từ dre-content-library.md.
 * Field "monHoc" và "loaiLoi" được thêm sẵn để nhóm hoạt động đa môn (12-16)
 * sau này chỉ cần thêm entry mới cùng schema, không cần đổi orchestrator/agents.
 */
export const contentLibrary = {
  MISC_001: {
    id: 'MISC_001',
    monHoc: 'Toán',
    chuDe: 'Phương trình bậc 2',
    doKho: 'Mới học lần đầu',
    loaiLoi: 'Tính toán (dấu)',
    baiToan: 'Giải phương trình: x² − 5x + 6 = 0',
    baiGiai: [
      'x² − 5x + 6 = 0',
      '(x − 2)(x − 3) = 0',
      'x = 2 hoặc x = −3',
    ],
    viTriLoiChuan: 'Bước 3',
    moTaLoi: 'Nhầm dấu khi chuyển vế — quên đổi dấu khi giải (x − a) = 0.',
    giaiThichChuan:
      'Khi (x − 3) = 0, cộng 3 vào hai vế thì x = 3, không phải x = −3.',
    goiY1: 'Thử nhìn lại bước chuyển vế ở dòng cuối xem sao?',
    goiY2: 'Khi (x − 3) = 0, em cộng 3 vào cả hai vế thì được gì?',
  },

  MISC_002: {
    id: 'MISC_002',
    monHoc: 'Toán',
    chuDe: 'Phân số',
    doKho: 'Mới học lần đầu',
    loaiLoi: 'Phương pháp (quy đồng)',
    baiToan: 'Tính: 1/3 + 1/4',
    baiGiai: ['1/3 + 1/4', '= (1+1) / (3+4)', '= 2/7'],
    viTriLoiChuan: 'Bước 2',
    moTaLoi: 'Cộng trực tiếp tử và mẫu, không quy đồng mẫu số trước.',
    giaiThichChuan:
      'Phải quy đồng mẫu số chung (12) trước: 1/3 = 4/12, 1/4 = 3/12, rồi mới cộng tử: 7/12.',
    goiY1: 'Hai phân số này có cùng mẫu số chưa nhỉ?',
    goiY2: 'Mẫu số chung nhỏ nhất của 3 và 4 là bao nhiêu?',
  },

  MISC_003: {
    id: 'MISC_003',
    monHoc: 'Toán',
    chuDe: 'Luỹ thừa',
    doKho: 'Mới học lần đầu',
    loaiLoi: 'Quy tắc (cộng vs nhân số mũ)',
    baiToan: 'Tính: 2³ × 2²',
    baiGiai: ['2³ × 2²', '= 2^(3×2)', '= 2⁶ = 64'],
    viTriLoiChuan: 'Bước 2',
    moTaLoi: 'Nhân hai số mũ với nhau thay vì cộng, khi nhân hai luỹ thừa cùng cơ số.',
    giaiThichChuan:
      'Khi nhân hai luỹ thừa cùng cơ số, ta cộng số mũ: 2^(3+2) = 2⁵ = 32.',
    goiY1: 'Quy tắc nhân hai luỹ thừa cùng cơ số là gì — cộng hay nhân số mũ?',
    goiY2: 'Thử viết 2³ × 2² ra dạng nhân đầy đủ (2×2×2×2×2) và đếm xem có bao nhiêu số 2.',
  },

  MISC_004: {
    id: 'MISC_004',
    monHoc: 'Toán',
    chuDe: 'Thứ tự thực hiện phép tính',
    doKho: 'Mới học lần đầu',
    loaiLoi: 'Quy tắc (ưu tiên phép tính)',
    baiToan: 'Tính: 3 + 4 × 2',
    baiGiai: ['3 + 4 × 2', '= 7 × 2', '= 14'],
    viTriLoiChuan: 'Bước 2',
    moTaLoi: 'Tính cộng trước nhân, bỏ qua thứ tự ưu tiên phép tính.',
    giaiThichChuan: 'Phải nhân trước: 4 × 2 = 8, rồi mới cộng: 3 + 8 = 11.',
    goiY1: 'Trong biểu thức này, phép tính nào cần làm trước — cộng hay nhân?',
    goiY2: 'Quy tắc là nhân/chia trước, cộng/trừ sau, trừ khi có dấu ngoặc.',
  },

  MISC_005: {
    id: 'MISC_005',
    monHoc: 'Toán',
    chuDe: 'Hệ phương trình',
    doKho: 'Đã học rồi',
    loaiLoi: 'Chép số (không phải phương pháp)',
    baiToan: 'Giải hệ: x + y = 10 ; x − y = 2',
    baiGiai: [
      'x + y = 10 ; x − y = 2',
      'Cộng hai phương trình: 2x = 12 → x = 6',
      'Thế vào pt (1): y = 10 − 6 = 4, vậy y = 6',
    ],
    viTriLoiChuan: 'Bước 3',
    moTaLoi: 'Tính đúng y = 4 nhưng chép nhầm kết quả cuối thành y = 6.',
    giaiThichChuan:
      'Phép tính 10 − 6 = 4 là đúng, nhưng Bo ghi nhầm đáp số cuối cùng thành 6 thay vì 4.',
    goiY1: 'Thử tính lại 10 − 6 xem có khớp với số Bo ghi ở cuối không?',
    goiY2: null,
  },

  MISC_006: {
    id: 'MISC_006',
    monHoc: 'Toán',
    chuDe: 'Rút gọn biểu thức',
    doKho: 'Đã học rồi',
    loaiLoi: 'Tính toán (dấu khi phá ngoặc)',
    baiToan: 'Rút gọn: 5x − (3x − 2)',
    baiGiai: ['5x − (3x − 2)', '= 5x − 3x − 2', '= 2x − 2'],
    viTriLoiChuan: 'Bước 2',
    moTaLoi:
      'Không đổi dấu số hạng thứ hai trong ngoặc khi phá ngoặc có dấu trừ đằng trước.',
    giaiThichChuan:
      'Khi phá ngoặc có dấu trừ đằng trước, phải đổi dấu mọi số hạng bên trong: 5x − 3x + 2 = 2x + 2.',
    goiY1: 'Khi trước ngoặc có dấu trừ, các số trong ngoặc có cần đổi dấu không?',
    goiY2: 'Thử phá ngoặc bằng cách nhân −1 vào từng số hạng trong ngoặc xem.',
  },

  MISC_007: {
    id: 'MISC_007',
    monHoc: 'Toán',
    chuDe: 'Phần trăm',
    doKho: 'Đang ôn luyện',
    loaiLoi: 'Khái niệm (cơ sở tính %)',
    baiToan: 'Giá gốc 200.000đ, giảm 20%, sau đó tăng lại 20%. Hỏi giá cuối?',
    baiGiai: [
      'Giá gốc 200.000đ, giảm 20%, sau đó tăng lại 20%.',
      'Giảm 20%: 200.000 × 0.8 = 160.000đ',
      'Tăng 20%: 160.000 + 20% của 200.000 = 160.000 + 40.000 = 200.000đ',
    ],
    viTriLoiChuan: 'Bước 3',
    moTaLoi:
      'Tính 20% tăng thêm dựa trên giá gốc ban đầu thay vì dựa trên giá đã giảm — sai cơ sở tính phần trăm.',
    giaiThichChuan:
      '20% tăng phải tính trên giá hiện tại là 160.000đ, tức 160.000 × 1.2 = 192.000đ, không quay lại giá gốc.',
    goiY1: '20% tăng thêm này nên tính trên giá nào — giá gốc hay giá đã giảm?',
    goiY2: null,
  },

  MISC_008: {
    id: 'MISC_008',
    monHoc: 'Toán',
    chuDe: 'Bất phương trình',
    doKho: 'Đang ôn luyện',
    loaiLoi: 'Khái niệm (đổi chiều bpt)',
    baiToan: 'Giải bất phương trình: −2x > 6',
    baiGiai: ['−2x > 6', 'Chia hai vế cho −2: x > −3', 'Vậy nghiệm là x > −3'],
    viTriLoiChuan: 'Bước 2',
    moTaLoi: 'Chia cả hai vế cho số âm nhưng không đổi chiều bất đẳng thức.',
    giaiThichChuan:
      'Khi chia (hoặc nhân) cả hai vế bất phương trình cho một số âm, phải đổi chiều dấu bất đẳng thức: x < −3.',
    goiY1: 'Khi chia hai vế bất phương trình cho một số âm, có quy tắc đặc biệt nào không?',
    goiY2: null,
  },

  MISC_VECTO_12: {
    id: 'MISC_VECTO_12',
    monHoc: 'Toán',
    chuDe: 'Vectơ trong không gian',
    doKho: 'Toán 12 (SGK Mới)',
    loaiLoi: 'Quy tắc hiệu (Chung đầu - Lộn ngược)',
    baiToan: "Ví dụ 10 (1:40:10): Cho lăng trụ ABC.A'B'C'. Đặt AA' = a, AB = b, AC = c. Hãy biểu diễn vectơ B'C theo a, b, c",
    baiGiai: [
      "Chèn điểm A vào vectơ B'C theo quy tắc hiệu (Chung đầu A):",
      "B'C = AB' − AC (Lấy điểm trước trừ điểm sau)",
      "Vì AB' = AA' + AB = a + b nên B'C = a + b − c"
    ],
    viTriLoiChuan: 'Bước 2',
    moTaLoi: "Áp dụng sai quy tắc hiệu: B'C phải bằng AC − AB' (sau trừ trước), nhưng Bo lại viết ngược thành AB' − AC.",
    giaiThichChuan: "Theo quy tắc hiệu chung gốc A: B'C = AC − AB' = c − (a + b) = c − a − b.",
    goiY1: 'Hãy nhớ khẩu quyết quy tắc hiệu: Chung đầu A thì phải LỘN NGƯỢC thứ tự hai điểm cuối!',
    goiY2: "Với B'C, khi chèn điểm A làm gốc chung thì điểm C (đứng sau) phải viết trước hay điểm B' (đứng trước) viết trước?",
  },

  // Câu hỏi dừng 37:13 của Trạm 1 (Ví dụ 3, thầy Nguyễn Phan Tiến), theo pause question
  // pq02_checkpoint_3713 và kịch bản sc_bo_debate_3713 trong mock/lesson.json.
  MISC_VECTO_12_CP3713: {
    id: 'MISC_VECTO_12_CP3713',
    monHoc: 'Toán',
    chuDe: 'Vectơ trong không gian',
    doKho: 'Toán 12 (SGK Mới)',
    loaiLoi: 'Tách độ dài của tổng thành tổng độ dài',
    baiToan: "Ví dụ 3 (37:13): Cho hình lập phương ABCD.A'B'C'D' cạnh bằng 1. Tính độ dài |BC + DD'|.",
    baiGiai: [
      "|BC| = 1 và |DD'| = 1 (cạnh hình lập phương)",
      "|BC + DD'| = |BC| + |DD'| = 1 + 1",
      "Vậy |BC + DD'| = 2",
    ],
    viTriLoiChuan: 'Bước 2',
    moTaLoi:
      "Tách độ dài của tổng thành tổng hai độ dài: |BC + DD'| = |BC| + |DD'| = 2, trong khi BC và DD' vuông góc, không cùng hướng.",
    giaiThichChuan:
      "Không được tách độ dài trực tiếp. Tịnh tiến DD' thành CC' để có BC + CC' = BC'. Tam giác BCC' vuông cân cạnh 1 nên |BC'| = √2.",
    goiY1: "Hai vectơ BC và DD' có cùng hướng không? Khi nào thì |a + b| mới bằng |a| + |b|?",
    goiY2: "Thử thay DD' bằng một vectơ bằng nó có điểm đầu là C. Khi đó BC cộng với vectơ ấy thành vectơ nào, dài bao nhiêu?",
  },
};

export function getMisconception(id) {
  const entry = contentLibrary[id];
  if (!entry) {
    throw new Error(`Không tìm thấy misconception với id "${id}"`);
  }
  return entry;
}

export function listMisconceptionIds() {
  return Object.keys(contentLibrary);
}
