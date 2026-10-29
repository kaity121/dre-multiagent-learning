# Proposal & Architectural Blueprint: Runtime Intent Classifier & Dynamic Routing Dispatcher
**Mã công việc:** Issue #401 (GitHub Issue #11)  
**Phân hệ:** `EPIC 4: RUNTIME PEDAGOGICAL DISPATCHER & CONTEXT ISOLATION`  
**Chịu trách nhiệm (Owner):** An (`@presentisperfect`)  
**Người duyệt (Reviewer):** Blu (`@blu1606`)  
**Ngày khởi tạo:** 26/10/2026  

---

## 1. Bối cảnh & Tầm nhìn (Context & Vision)

Nền tảng **DRE Multi-Agent Learning** biến video bài giảng cố định (Toán 12 — *Vectơ trong không gian*, Thầy Nguyễn Phan Tiến, ~58 phút) thành một **lớp học đa tác nhân sống động**:
* **Ambient Script (0 Token):** Kịch bản lớp học (Bo, Trí, Linh Chi, Minh Khang, Cô Lam) chạy đồng bộ theo timeline video hoàn toàn ở client, không tiêu tốn token LLM khi học sinh chỉ xem bài giảng.
* **Active Runtime Engine (Climax của buổi Demo):** Khi học sinh **tự gõ tin nhắn** (hỏi công thức, thắc mắc bản chất, phản biện bẫy của Bo, hoặc xin gợi ý), hệ thống **tuyệt đối không được trả lời như một chatbot AI chung chung**.
* **Triết lý sư phạm:** *"Nudges, not answers"* — AI không giải bài thay, mà đóng vai những người bạn học và giáo viên cùng lớp để kích hoạt tư duy phản biện (Chu trình DRE: *Diagnose $\rightarrow$ Repair $\rightarrow$ Explain*).

---

## 2. Vấn đề Cốt lõi & Mục tiêu (Problem & Goal)

### Vấn đề hiện tại:
* Endpoint `/api/peer/:peerId/chat` yêu cầu người dùng phải tự bấm chọn trước người muốn chat trên giao diện.
* Nếu học sinh gõ vào khung chat chung ("all"), hệ thống chỉ kiểm tra từ khóa sơ sài hoặc mặc định chuyển cho Trí, chưa phân tích được **ý định sư phạm ngầm** (pedagogical intent) của câu hỏi.

### Mục tiêu của Issue #401:
Xây dựng một bộ **Intent Classifier & Dynamic Routing Dispatcher** tại Backend để:
1. Tự động lắng nghe câu học sinh gõ + thời điểm video hiện tại (`currentTime`) + trạng thái phiên học.
2. Phân loại chuẩn xác vào 1 trong 6 ý định học tập (`LearnerIntentType`).
3. Điều phối (dispatch) tới **đúng bạn học AI mang tính cách tương ứng**:
   * Hỏi công thức $\rightarrow$ **Linh Chi** (Sổ tay tóm tắt).
   * Hỏi bản chất "vì sao" $\rightarrow$ **Trí** (Hệ 2, RAG tri thức, bất đẳng thức tam giác).
   * Làm tắt / ngộ nhận $\rightarrow$ **Bo** (Đồng minh ngộ nhận, gài sâu hơn).
   * Bế tắc, xin gợi ý $\rightarrow$ **Trợ giảng An** (Gợi ý bậc thang Cấp 1 $\rightarrow$ Cấp 2, không giải hộ).
   * Phản biện sắc bén bẻ gãy bẫy $\rightarrow$ **Bo nhận thua** $\rightarrow$ **Cô Lam chốt quy tắc vàng**.
   * Chém gió ngoài lề $\rightarrow$ **Minh Khang / Bo** kéo về bài học.
4. Hỗ trợ học sinh gõ trực tiếp `@mention` (`@bo`, `@tri`, `@linhchi`, `@colam`, `@an`) để override trực tiếp nếu muốn.
5. Đảm bảo độ trễ thấp, có cơ chế **fallback an toàn** (không bao giờ đơ hay sập trước Ban giám khảo).

---

## 3. Bảng Ánh Xạ Ý Định Sư Phạm (Intent & Routing Matrix)

| # | Ý định (`LearnerIntentType`) | Tác nhân chính (`AgentRole`) | Chuỗi tác nhân tiếp theo (Chained Sequence) | Hành vi sư phạm & Giọng điệu | Ví dụ câu học sinh |
|---|---|---|---|---|---|
| 1 | `ask_formula_mnemonic` | `linhchi` | — | Lật mở sổ tay quy tắc, công thức chuẩn, mẹo nhớ ngắn gọn | *"Linh Chi ơi cho mình xin công thức cộng vectơ hình bình hành với"* |
| 2 | `ask_deep_concept` | `tri` | `minhkhang` *(tùy chọn 1 câu ví von ngắn)* | Đào sâu bản chất, bất đẳng thức tam giác, điều kiện biên, tra cứu RAG | *"Tại sao độ dài vectơ tổng lại không bằng tổng độ dài từng vectơ vậy bạn?"* |
| 3 | `challenge_shortcut_fallacy` | `bo` | — | Đồng tình ngộ nhận, đưa ra lập luận cẩu thả để học sinh giật mình tự sửa | *"Lấy luôn 1 + 1 = 2 cho lẹ chứ vẽ hình chi cho mệt mỏi"* |
| 4 | `ask_scaffolding_help` | `an` (Trợ giảng) | — | Scaffold phân tầng (Cấp 1: câu hỏi gợi mở; Cấp 2: điều kiện hình học), không lộ đáp số | *"Em bí quá không biết bắt đầu từ đâu, cho em xin một gợi ý với"* |
| 5 | `sharp_rebuttal` | `bo` | `colam` *(bắt buộc)* | Bo tâm phục khẩu phục nhận thua $\rightarrow$ Cô Lam lập tức xuất hiện chốt quy tắc vàng | *"Bo sai rồi, $|\vec{a}+\vec{b}| \le |\vec{a}|+|\vec{b}|$, chỉ bằng khi cùng hướng thôi!"* |
| 6 | `general_classroom_chitchat` | `minhkhang` hoặc `bo` | — | Hóm hỉnh, dùng ví dụ đời sống hoặc kéo sự chú ý về bảng thầy Tiến | *"Hôm nay trời đẹp ghê ha các bạn"* |

---

## 4. Kiến trúc Kỹ thuật Chi tiết (Architectural Design)

### 4.1. Kiến trúc Hybrid 2 tầng (Two-Tier Hybrid Dispatcher)

```
[Tin nhắn của học sinh] + [currentTime] + [Session State]
                      │
                      ▼
         ┌─────────────────────────┐
         │ TẦNG 1: HEURISTIC FAST  │
         │ - Kiểm tra @mention     │
         │ - Regex từ khóa mạnh    │
         └────────────┬────────────┘
                      │
         ┌────────────┴────────────┐
         │ Tìm thấy match rõ ràng? │
         └──────┬───────────┬──────┘
             Có │           │ Không
                ▼           ▼
        ┌──────────────┐   ┌────────────────────────────────┐
        │ Fast Verdict │   │ TẦNG 2: FEW-SHOT LLM CLASSIFIER│
        │ (0ms latency)│   │ Model: GPT-6 / Sol (temp: 0.1) │
        └───────┬──────┘   └────────────────┬───────────────┘
                │                           │
                │              ┌────────────┴────────────┐
                │              │ LLM OK & Conf >= 0.6?   │
                │              └──────┬───────────┬──────┘
                │                  Có │           │ Lỗi / Timeout / Conf thấp
                │                     ▼           ▼
                │             ┌──────────────┐   ┌───────────────────┐
                │             │ LLM Verdict  │   │ FALLBACK AN TOÀN  │
                │             │ (Structured) │   │ (Trí / Trợ giảng) │
                │             └───────┬──────┘   └─────────┬─────────┘
                │                     │                    │
                ▼                     ▼                    ▼
     ═════════════════════════════════════════════════════════════════════
                       ROUTING & EXECUTION ENGINE
     ═════════════════════════════════════════════════════════════════════
                                      │
                                      ▼
                   Tra cứu RAG Knowledge Base (Issue #201)
                                      │
                                      ▼
                  Thực thi Agent đơn hoặc Chuỗi Agent:
                  - Đơn: Linh Chi / Trí / Bo / TA An
                  - Chuỗi: Bo nhận thua ──> Cô Lam chốt bài
                                      │
                                      ▼
             Payload trả về Client (Verdict + Content + Log)
```

### 4.2. Khế ước Dữ liệu (Data Contracts theo `src/types/pipeline.ts`)

```typescript
export type LearnerIntentType = 
  | 'ask_formula_mnemonic'
  | 'ask_deep_concept'
  | 'challenge_shortcut_fallacy'
  | 'ask_scaffolding_help'
  | 'sharp_rebuttal'
  | 'general_classroom_chitchat';

export interface IntentRoutingVerdict {
  detectedIntent: LearnerIntentType;
  dispatchedAgent: AgentRole;     // 'bo' | 'tri' | 'linhchi' | 'minhkhang' | 'an' | 'colam'
  confidence: number;            // 0.0 -> 1.0
  reasoning: string;             // Lý do chọn agent (phục vụ Inspector Modal #16)
  matchedKeywords?: string[];
  fallbackUsed?: boolean;
}

export interface DispatcherResponse {
  ok: boolean;
  verdict: IntentRoutingVerdict;
  primaryResponse: {
    author: string;
    avatarId: AgentRole;
    text: string;
  };
  followUpResponse?: {
    author: string;
    avatarId: AgentRole;
    text: string;
  } | null;
  ragContextUsed?: {
    misconceptionId?: string;
    title?: string;
  } | null;
  timestamp: string;
}
```

---

## 5. API Specification

### Endpoint: `POST /api/runtime/dispatch`
Khung chat và các trạm học tập sẽ gọi endpoint này khi học sinh gửi tin nhắn.

#### Request Body:
```json
{
  "message": "Bo nói sai rồi, vectơ đối nhau thì độ dài bằng nhau nhưng hướng ngược nhau!",
  "currentTime": 2233,
  "lessonId": "LESSON_VEC_01",
  "sessionId": "sess_123456"
}
```

#### Response Body (Thành công):
```json
{
  "ok": true,
  "verdict": {
    "detectedIntent": "sharp_rebuttal",
    "dispatchedAgent": "bo",
    "confidence": 0.96,
    "reasoning": "Học sinh chỉ rõ định nghĩa vectơ đối nhau và trực tiếp bẻ gãy khẳng định sai của Bo."
  },
  "primaryResponse": {
    "author": "Bo",
    "avatarId": "bo",
    "text": "Ủa... ừ ha, mình quên mất vụ ngược hướng! Vậy tổng của chúng nó bằng vectơ-không chứ đâu phải bằng 2 lần được..."
  },
  "followUpResponse": {
    "author": "Cô Lam",
    "avatarId": "colam",
    "text": "Rất chính xác! Hai vectơ đối nhau có tổng bằng vectơ-không. Cả lớp ghi nhớ quy tắc này vào sổ tay nhé!"
  },
  "ragContextUsed": {
    "misconceptionId": "MISC_VEC_005",
    "title": "Cộng trực tiếp độ dài hai vectơ"
  },
  "timestamp": "2026-10-26T21:15:00.000Z"
}
```

---

## 6. Kế hoạch Kiểm thử & Tiêu chuẩn Nghiệm thu (DoD)

### 6.1. Bộ Dataset Benchmark (24 câu mẫu đa dạng)
File: `tests/test_dispatcher.js` sẽ kiểm tra 24 câu hỏi mẫu chia đều 6 nhóm ý định:

1. **`ask_formula_mnemonic` (4 câu):**
   * *"Cho mình xin lại công thức cộng vectơ hình bình hành"* $\rightarrow$ `linhchi`
   * *"Quy tắc 3 điểm áp dụng như thế nào vậy bạn"* $\rightarrow$ `linhchi`
   * *"Linh Chi ơi có mẹo nào nhớ nhanh công thức trọng tâm không"* $\rightarrow$ `linhchi`
   * *"Xem giúp mình sổ tay công thức tích vô hướng với"* $\rightarrow$ `linhchi`

2. **`ask_deep_concept` (4 câu):**
   * *"Tại sao $|\vec{a} + \vec{b}|$ lại khác $|\vec{a}| + |\vec{b}|$ vậy bạn?"* $\rightarrow$ `tri`
   * *"Bản chất hình học của phép trừ hai vectơ chung gốc là gì?"* $\rightarrow$ `tri`
   * *"Khi nào thì dấu bằng trong bất đẳng thức tam giác xảy ra?"* $\rightarrow$ `tri`
   * *"Trí ơi giải thích giùm mình ý nghĩa của vectơ chỉ phương"* $\rightarrow$ `tri`

3. **`challenge_shortcut_fallacy` (4 câu):**
   * *"Cứ lấy độ dài cộng đại vào nhau cho nhanh cần gì vẽ hình"* $\rightarrow$ `bo`
   * *"Bài này bấm máy tính Casio thế số vào là ra liền"* $\rightarrow$ `bo`
   * *"Vectơ trong không gian cũng y chang như hình học phẳng thôi mà"* $\rightarrow$ `bo`
   * *"Cứ thấy dấu trừ là đổi thành dấu cộng rồi đảo chữ cái lại"* $\rightarrow$ `bo`

4. **`ask_scaffolding_help` (4 câu):**
   * *"Em bí quá chưa hiểu đề bài nói gì, cho em xin gợi ý với"* $\rightarrow$ `an`
   * *"Trợ giảng ơi bài này nên áp dụng quy tắc nào trước ạ"* $\rightarrow$ `an`
   * *"Mình làm mãi không ra câu này, có ai gợi ý bước 1 không"* $\rightarrow$ `an`
   * *"Gợi ý giúp mình câu này với"* $\rightarrow$ `an`

5. **`sharp_rebuttal` (4 câu):**
   * *"Bo sai rồi, $|\vec{AB} + \vec{BC}| = |\vec{AC}|$ chứ không bằng $AB + BC$!"* $\rightarrow$ `bo` & `colam`
   * *"Bạn cộng trực tiếp độ dài là sai quy tắc cộng vectơ rồi nhé"* $\rightarrow$ `bo` & `colam`
   * *"Độ dài của tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi Bo ơi"* $\rightarrow$ `bo` & `colam`
   * *"Khẳng định của Bo không đúng vì tam giác thì tổng 2 cạnh phải lớn hơn cạnh thứ 3"* $\rightarrow$ `bo` & `colam`

6. **`general_classroom_chitchat` (4 câu):**
   * *"Hôm nay lớp học đông vui quá ha các bạn"* $\rightarrow$ `minhkhang`
   * *"Mấy bạn ăn cơm chưa, học mệt quá"* $\rightarrow$ `bo`
   * *"Thầy Tiến giảng bài cuốn ghê"* $\rightarrow$ `minhkhang`
   * *"Minh Khang có ví dụ thực tế nào về vectơ vận tốc không"* $\rightarrow$ `minhkhang`

### 6.2. Tiêu chí Hoàn thành (Definition of Done):
- [x] Độ chính xác định tuyến đạt **$\ge 90\%$** trên bộ test benchmark 24 câu.
- [x] Phản xạ tại trạm dừng 37:13: Gõ phản biện đúng $\rightarrow$ Bo nhận thua và Cô Lam chốt bài.
- [x] Trả về đầy đủ `IntentRoutingVerdict` với `confidence` và `reasoning` rõ ràng.
- [x] Cơ chế fallback kích hoạt khi LLM lỗi/offline mà không làm crash server.
- [x] File test tự động `node tests/test_dispatcher.js` chạy độc lập với exit code 0.

---

## 7. Cấu trúc File & Các bước Triển khai

```
backend/
├── src/
│   ├── services/
│   │   ├── dispatcher.js          # [MỚI] Module Intent Classifier & Routing Dispatcher
│   │   └── knowledgeBase.js       # [ĐÃ CÓ] RAG Service phục vụ context cho Trí & Cô Lam
│   └── agents/
│       ├── bo.js                  # [CẬP NHẬT] Thêm hàm thừa nhận phản biện sắc bén
│       ├── colam.js               # [CẬP NHẬT] Thêm hàm chốt quy tắc vàng sau phản biện
│       ├── tri.js                 # [ĐÃ CÓ]
│       ├── linhchi.js             # [ĐÃ CÓ]
│       ├── minhkhang.js           # [ĐÃ CÓ]
│       └── ta.js                  # [ĐÃ CÓ] Trợ giảng An scaffolding
├── server.js                      # [CẬP NHẬT] Đăng ký POST /api/runtime/dispatch
tests/
└── test_dispatcher.js             # [MỚI] Test suite benchmark 24 câu hỏi
```
