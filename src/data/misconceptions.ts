import { MisconceptionItem } from '../types/dre';

export const MISCONCEPTION_LIBRARY: MisconceptionItem[] = [
  {
    id: 'MISC_VECTO_12',
    topic: 'Toán 12: Vectơ trong không gian — Bẫy quy tắc trừ & tách độ dài (Thầy Nguyễn Phan Tiến)',
    level: 'intermediate',
    levelLabel: 'Toán 12 (SGK Mới)',
    workingObject: {
      title: "Ví dụ 10 (Phút 1:40:10): Cho lăng trụ ABC.A'B'C'. Đặt AA'⃗ = a⃗, AB⃗ = b⃗, AC⃗ = c⃗. Hãy biểu diễn vectơ B'C⃗ theo a⃗, b⃗, c⃗:",
      steps: [
        { stepNumber: 1, content: "Chèn điểm A vào vectơ B'C⃗ theo quy tắc hiệu (Chung đầu A):" },
        { stepNumber: 2, content: "B'C⃗ = AB'⃗ − AC⃗ (Lấy điểm trước trừ điểm sau)" },
        { stepNumber: 3, content: "Vì AB'⃗ = AA'⃗ + AB⃗ = a⃗ + b⃗ nên B'C⃗ = a⃗ + b⃗ − c⃗" }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Quy tắc hiệu (Quên "Chung đầu - Lộn ngược")',
    errorDescription: "Áp dụng sai quy tắc hiệu khi chèn điểm A: B'C⃗ phải bằng AC⃗ − AB'⃗ (sau trừ trước), nhưng Bo lại viết ngược thành AB'⃗ − AC⃗.",
    standardExplanation: "Theo khẩu quyết \"Chung đầu - Lộn ngược\" của thầy Tiến ở phút [57:02]: B'C⃗ = AC⃗ − AB'⃗ = c⃗ − (a⃗ + b⃗) = c⃗ − a⃗ − b⃗.",
    hintLevel1: 'Hãy nhớ khẩu quyết quy tắc hiệu ở phút [57:02]: "Chung đầu A thì phải LỘN NGƯỢC thứ tự hai điểm cuối!"',
    hintLevel2: "Với B'C⃗, khi chèn điểm A làm gốc chung thì điểm C (đứng sau) phải viết trước hay điểm B' (đứng trước) viết trước?",
    nudgeStarter: "Ở bước 2, theo quy tắc hiệu chung đầu lộn ngược thì B'C⃗ phải bằng ",
    keywords: ['lộn ngược', 'ac - ab', 'sau trừ trước', 'ngược dấu', 'c - a - b', 'chung đầu'],
    linhChiCheatSheet: {
      title: "📝 Sổ tay Quy tắc Hiệu Vectơ (Thầy Nguyễn Phan Tiến)",
      rules: [
        "1. Khẩu quyết 'Chung đầu - Lộn ngược' (57:02): OA⃗ − OB⃗ = BA⃗ (Điểm sau B viết trước, điểm trước A viết sau).",
        "2. Chèn điểm A vào B'C⃗: B'C⃗ = AC⃗ − AB'⃗ = c⃗ − (a⃗ + b⃗) = c⃗ − a⃗ − b⃗.",
        "3. Chuyển trừ thành cộng vectơ đối: B'C⃗ = B'B⃗ + BC⃗ = −AA'⃗ + (AC⃗ − AB⃗) = −a⃗ + c⃗ − b⃗."
      ],
      commonTrap: "Cạm bẫy Bo hay mắc: Thấy B' đứng trước C nên viết B'C⃗ = AB'⃗ − AC⃗ (quên lộn ngược vị trí sau trừ trước)."
    }
  },
  {
    id: 'MISC_001',
    topic: 'Phương trình bậc 2, nhầm dấu khi chuyển vế',
    level: 'beginner',
    levelLabel: 'Mới học lần đầu',
    workingObject: {
      title: 'Giải phương trình: x² − 5x + 6 = 0',
      steps: [
        { stepNumber: 1, content: 'x² − 5x + 6 = 0' },
        { stepNumber: 2, content: '(x − 2)(x − 3) = 0' },
        { stepNumber: 3, content: 'x = 2 hoặc x = −3' }
      ]
    },
    errorStepIndex: 3,
    errorType: 'Tính toán (dấu khi chuyển vế)',
    errorDescription: 'Nhầm dấu khi chuyển vế — quên đổi dấu khi giải (x − a) = 0.',
    standardExplanation: 'Khi (x − 3) = 0, cộng 3 vào hai vế thì x = 3, không phải x = −3.',
    hintLevel1: 'Thử nhìn lại bước chuyển vế ở dòng cuối xem sao?',
    hintLevel2: 'Khi (x − 3) = 0, em cộng 3 vào cả hai vế thì được gì?',
    keywords: ['x = 3', 'đổi dấu', 'chuyển vế', 'dương 3', '+3', 'bằng 3', 'cộng 3', 'dấu cộng', 'phải là 3'],
    nudgeStarter: 'Bo bị nhầm dấu khi chuyển vế '
  },
  {
    id: 'MISC_002',
    topic: 'Phân số, cộng sai mẫu số',
    level: 'beginner',
    levelLabel: 'Mới học lần đầu',
    workingObject: {
      title: 'Tính phép cộng phân số: 1/3 + 1/4',
      steps: [
        { stepNumber: 1, content: '1/3 + 1/4' },
        { stepNumber: 2, content: '= (1+1) / (3+4)' },
        { stepNumber: 3, content: '= 2/7' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Phương pháp (quy đồng)',
    errorDescription: 'Cộng trực tiếp tử và mẫu, không quy đồng mẫu số trước.',
    standardExplanation: 'Phải quy đồng mẫu số chung (12) trước: 1/3 = 4/12, 1/4 = 3/12, rồi mới cộng tử: 7/12.',
    hintLevel1: 'Hai phân số này có cùng mẫu số chưa nhỉ?',
    hintLevel2: 'Mẫu số chung nhỏ nhất của 3 và 4 là bao nhiêu?',
    keywords: ['quy đồng', 'mẫu số', 'mẫu chung', '7/12', 'cùng mẫu', 'mẫu số chung', 'nhân cả tử và mẫu'],
    nudgeStarter: 'Bo quên quy đồng mẫu số trước khi cộng '
  },
  {
    id: 'MISC_003',
    topic: 'Luỹ thừa, nhân số mũ thay vì cộng',
    level: 'beginner',
    levelLabel: 'Mới học lần đầu',
    workingObject: {
      title: 'Tính tích hai luỹ thừa: 2³ × 2²',
      steps: [
        { stepNumber: 1, content: '2³ × 2²' },
        { stepNumber: 2, content: '= 2^(3×2)' },
        { stepNumber: 3, content: '= 2⁶ = 64' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Quy tắc (cộng vs nhân số mũ)',
    errorDescription: 'Nhân hai số mũ với nhau thay vì cộng, khi nhân hai luỹ thừa cùng cơ số.',
    standardExplanation: 'Khi nhân hai luỹ thừa cùng cơ số, ta cộng số mũ: 2^(3+2) = 2⁵ = 32.',
    hintLevel1: 'Quy tắc nhân hai luỹ thừa cùng cơ số là gì — cộng hay nhân số mũ?',
    hintLevel2: 'Thử viết 2³ × 2² ra dạng nhân đầy đủ (2×2×2×2×2) và đếm xem có bao nhiêu số 2.',
    keywords: ['cộng số mũ', '3+2', '2^5', 'cùng cơ số', 'luỹ thừa', 'lũy thừa', 'phép nhân số mũ'],
    nudgeStarter: 'Bo bị nhầm giữa nhân và cộng số mũ '
  },
  {
    id: 'MISC_004',
    topic: 'Thứ tự thực hiện phép tính (BODMAS/PEMDAS)',
    level: 'beginner',
    levelLabel: 'Mới học lần đầu',
    workingObject: {
      title: 'Tính giá trị biểu thức: 3 + 4 × 2',
      steps: [
        { stepNumber: 1, content: '3 + 4 × 2' },
        { stepNumber: 2, content: '= 7 × 2' },
        { stepNumber: 3, content: '= 14' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Quy tắc (ưu tiên phép tính)',
    errorDescription: 'Tính cộng trước nhân, bỏ qua thứ tự ưu tiên phép tính.',
    standardExplanation: 'Phải nhân trước: 4 × 2 = 8, rồi mới cộng: 3 + 8 = 11.',
    hintLevel1: 'Trong biểu thức này, phép tính nào cần làm trước — cộng hay nhân?',
    hintLevel2: 'Quy tắc là nhân/chia trước, cộng/trừ sau, trừ khi có dấu ngoặc.',
    keywords: ['nhân trước', 'cộng sau', '4x2', '4 × 2', 'thứ tự ưu tiên', 'ưu tiên phép tính', 'nhân chia trước'],
    nudgeStarter: 'Bo tính sai thứ tự ưu tiên phép nhân '
  },
  {
    id: 'MISC_005',
    topic: 'Hệ phương trình, thế sai giá trị',
    level: 'intermediate',
    levelLabel: 'Đã học rồi',
    workingObject: {
      title: 'Giải hệ: x + y = 10 và x − y = 2',
      steps: [
        { stepNumber: 1, content: 'x + y = 10 ; x − y = 2' },
        { stepNumber: 2, content: 'Cộng hai phương trình: 2x = 12 → x = 6' },
        { stepNumber: 3, content: 'Thế vào pt (1): y = 10 − 6 = 4, vậy y = 6' }
      ]
    },
    errorStepIndex: 3,
    errorType: 'Chép số (không phải phương pháp)',
    errorDescription: 'Tính đúng y = 4 nhưng chép nhầm kết quả cuối thành y = 6 (lỗi chép số, không phải lỗi phương pháp).',
    standardExplanation: 'Phép tính 10 − 6 = 4 là đúng, nhưng Bo ghi nhầm đáp số cuối cùng thành 6 thay vì 4.',
    hintLevel1: 'Thử tính lại 10 − 6 xem có khớp với số Bo ghi ở cuối không?',
    hintLevel2: 'Bo tính ra 4 nhưng lại kết luận y = 6 kìa!',
    keywords: ['chép nhầm', 'y = 4', 'y=4', 'kết luận', '4 chứ không phải 6', 'ghi nhầm', '10-6=4', '10 − 6'],
    nudgeStarter: 'Bo tính đúng nhưng chép nhầm số cuối '
  },
  {
    id: 'MISC_006',
    topic: 'Rút gọn biểu thức, sai dấu khi phá ngoặc',
    level: 'intermediate',
    levelLabel: 'Đã học rồi',
    workingObject: {
      title: 'Rút gọn biểu thức: 5x − (3x − 2)',
      steps: [
        { stepNumber: 1, content: '5x − (3x − 2)' },
        { stepNumber: 2, content: '= 5x − 3x − 2' },
        { stepNumber: 3, content: '= 2x − 2' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Tính toán (dấu khi phá ngoặc)',
    errorDescription: 'Không đổi dấu số hạng thứ hai trong ngoặc khi phá ngoặc có dấu trừ đằng trước.',
    standardExplanation: 'Khi phá ngoặc có dấu trừ đằng trước, phải đổi dấu mọi số hạng bên trong: 5x − 3x + 2 = 2x + 2.',
    hintLevel1: 'Khi trước ngoặc có dấu trừ, các số trong ngoặc có cần đổi dấu không?',
    hintLevel2: 'Thử phá ngoặc bằng cách nhân −1 vào từng số hạng trong ngoặc xem.',
    keywords: ['phá ngoặc', 'đổi dấu', '+2', 'cộng 2', 'dấu trừ đằng trước', '2x + 2', 'nhân trừ 1', 'nhân -1'],
    nudgeStarter: 'Bo quên đổi dấu khi phá ngoặc có dấu trừ '
  },
  {
    id: 'MISC_007',
    topic: 'Phần trăm, nhầm cơ sở tính phần trăm',
    level: 'advanced',
    levelLabel: 'Đang ôn luyện',
    workingObject: {
      title: 'Bài toán giá bán sau hai lần giảm và tăng 20%',
      steps: [
        { stepNumber: 1, content: 'Giá gốc 200.000đ, giảm 20%, sau đó tăng lại 20%.' },
        { stepNumber: 2, content: 'Giảm 20%: 200.000 × 0.8 = 160.000đ' },
        { stepNumber: 3, content: 'Tăng 20%: 160.000 + 20% của 200.000 = 160.000 + 40.000 = 200.000đ' }
      ]
    },
    errorStepIndex: 3,
    errorType: 'Khái niệm (cơ sở tính %)',
    errorDescription: 'Tính 20% tăng thêm dựa trên giá gốc ban đầu (200.000đ) thay vì dựa trên giá đã giảm (160.000đ) — sai cơ sở tính phần trăm.',
    standardExplanation: '20% tăng phải tính trên giá hiện tại là 160.000đ, tức 160.000 × 1.2 = 192.000đ, không quay lại giá gốc.',
    hintLevel1: '20% tăng thêm này nên tính trên giá nào — giá gốc hay giá đã giảm?',
    hintLevel2: 'Hạn chế can thiệp — hãy suy nghĩ về giá cơ sở tại thời điểm tăng.',
    keywords: ['160.000', '160k', 'giá mới', 'giá đã giảm', '192.000', '192k', 'cơ sở tính', 'trên giá 160'],
    nudgeStarter: 'Bo tính phần trăm trên sai cơ sở giá '
  },
  {
    id: 'MISC_008',
    topic: 'Bất phương trình, quên đổi chiều khi nhân số âm',
    level: 'advanced',
    levelLabel: 'Đang ôn luyện',
    workingObject: {
      title: 'Giải bất phương trình: −2x > 6',
      steps: [
        { stepNumber: 1, content: '−2x > 6' },
        { stepNumber: 2, content: 'Chia hai vế cho −2: x > −3' },
        { stepNumber: 3, content: 'Vậy nghiệm là x > −3' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Khái niệm (đổi chiều bpt)',
    errorDescription: 'Chia cả hai vế cho số âm nhưng không đổi chiều bất đẳng thức.',
    standardExplanation: 'Khi chia (hoặc nhân) cả hai vế bất phương trình cho một số âm, phải đổi chiều dấu bất đẳng thức: x < −3.',
    hintLevel1: 'Khi chia hai vế bất phương trình cho một số âm, có quy tắc đặc biệt nào không?',
    hintLevel2: 'Chia cho số âm thì dấu so sánh phải thế nào?',
    keywords: ['đổi chiều', 'đổi dấu bất đẳng thức', 'nhỏ hơn', 'chia số âm', 'bất đẳng thức', 'x < -3', 'chiều dấu'],
    nudgeStarter: 'Bo quên đổi chiều dấu bất đẳng thức khi chia số âm '
  }
];
