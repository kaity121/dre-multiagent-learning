# 📘 AISDLC SYSTEM ARCHITECTURE & TASK ROADMAP
## Nền tảng Học tập Đối chất Đa tác nhân (DRE Multi-Agent Cognitive Classroom)

> **Tài liệu định hướng kiến trúc & quy hoạch nhiệm vụ:**  
> Kết hợp Multi-Agent Collaboration, Khung Pedagogical RAG, Hệ thống Deterministic Tools/Skills và danh mục Epics & Issues theo chuẩn **Mục đích - Outcome - Ví dụ định hướng** (giữ nguyên technical keywords chuẩn quốc tế).

---

## 🏛️ PHẦN I: KIẾN TRÚC TỔNG THỂ & KHUNG PEDAGOGICAL RAG

Hệ thống được thiết kế theo 3 trụ cột AI-native:
1. **Multimodal Grounding:** Dữ liệu đầu vào bám chặt vào bảng phấn & lời giảng của thầy giáo qua Audio STT (Whisper) và Keyframe OCR (Gemini Vision).
2. **Pedagogical RAG (Retrieval-Augmented Generation):** Kho tri thức chuẩn (SGK Toán 12 mới + Thư viện ngộ nhận học sinh + Ngân hàng bài tập biến thể) làm mỏ neo kiến thức (Grounding anchor) để Agent không bị ảo giác.
3. **Multi-Agent Social Dynamics:** Mô phỏng phòng học xã hội với các bạn học AI có tính cách, thiên kiến nhận thức và công cụ kiểm chứng riêng.

```
                               ┌────────────────────────────────────────────────────────┐
                               │             PEDAGOGICAL KNOWLEDGE BASE (RAG)           │
                               │  • SGK Toán 12 GDPT 2018 (Định nghĩa, Tính chất)       │
                               │  • Thư viện 50+ Ngộ nhận nhận thức (Misconception KB)  │
                               │  • Ngân hàng bài tập biến thể & Phản ví dụ kinh điển   │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ (Semantic Search / Embedding)
                                                           ▼
┌───────────────────────────┐                  ┌────────────────────────────────────────┐
│     MULTIMODAL INPUT      │                  │       MULTI-AGENT COLLABORATION        │
│ • Video bài giảng         │ ───────────────► │ • Bo (Hệ 1: Trực giác ngộ nhận)        │
│ • Audio (Whisper STT)     │ (Context Stream) │ • Trí (Hệ 2: Logic suy diễn & ĐKXĐ)    │
│ • Keyframes (Gemini OCR)  │                  │ • Linh Chi (Scaffold & Sổ tay mẹo)     │
└───────────────────────────┘                  │ • Cô Lam (Director & Thẩm định Bloom)  │
                                               └───────────────────┬────────────────────┘
                                                                   │ (Deterministic Tools)
                                                                   ▼
                                               ┌────────────────────────────────────────┐
                                               │         DETERMINISTIC TOOLS LAYER      │
                                               │ • Tool kiểm chứng đại số vectơ         │
                                               │ • Tool tính khoảng cách thoại (Pacing) │
                                               │ • Tool chấm bậc Tháp Bloom             │
                                               └───────────────────┬────────────────────┘
                                                                   │
                                                                   ▼
                                               ┌────────────────────────────────────────┐
                                               │       DUAL-ENGINE CLASSROOM RUNTIME    │
                                               │ • Passive Ambient Stream (0 Token)     │
                                               │ • Active Intent Dispatcher & Inspector │
                                               └────────────────────────────────────────┘
```

---

## 🔍 PHẦN II: KHUNG PEDAGOGICAL RAG SYSTEM

RAG được tích hợp ở cả 2 giai đoạn vòng đời của bài giảng:

### 1. RAG trong Giai đoạn Scriptwriting Pipeline
* **Mục đích:** Khi AI phân tích video đến mốc Thầy Tiến giảng *Quy tắc hình hộp* hay *Ví dụ 3 độ dài*, Agent truy vấn kho tri thức để lấy ra ngộ nhận học sinh hay mắc và bài toán phản chứng.
* **Cơ chế:** 
  - Query vector được sinh từ `blackboardLatex` + `speechKeywords`.
  - Hệ thống truy vấn Kho tri thức Ngộ nhận (Misconception KB) $\rightarrow$ Lấy ra bẫy kinh điển: *"Cộng đại số trực tiếp độ dài $|\vec{u} + \vec{v}| = |\vec{u}| + |\vec{v}|$"*.
  - Truy vấn kho SGK $\rightarrow$ Lấy ra định lý và phản ví dụ minh họa $\rightarrow$ Nạp thẳng vào prompt của Bo và Linh Chi.

### 2. RAG trong Giai đoạn Classroom Runtime
* **Mục đích:** Khi học sinh gõ câu hỏi mở hoặc thắc mắc ngoài kịch bản (ví dụ: *"Nếu góc giữa hai vectơ bằng 120 độ thì độ dài tính sao ạ?"*).
* **Cơ chế:** 
  - Runtime Dispatcher trích xuất ý định câu hỏi $\rightarrow$ Truy vấn kho công thức Toán 12 $\rightarrow$ Trích đoạn lý thuyết về *Tích vô hướng và Công thức góc giữa hai vectơ*.
  - Đóng gói đoạn trích này vào Context của **Trí** hoặc **Linh Chi** để giải đáp chính xác, tự nhiên và bám sát chương trình.

---

## 📋 PHẦN III: QUY HOẠCH CHI TIẾT EPICS & ISSUES

---

### 🌟 EPIC 0: FOUNDATION CONTRACTS & MOCK FIXTURES
**Assignee phụ trách:** Blu (`@blu1606`)

#### 📌 Issue #001: `core: Xây dựng Contracts trao đổi dữ liệu & Standalone Mock Fixtures`
* **Assignee:** `@blu1606`
* **Mục đích (Why):** Thiết lập Contract Interfaces về cấu trúc dữ liệu dùng chung giữa 4 thành viên, giúp mỗi người có thể độc lập code và test module của mình ngay từ giờ đầu tiên mà không phải đợi backend chạy thật.
* **Outcome mong đợi (What Done Looks Like):**
  - Một bộ TypeScript interfaces hoàn chỉnh mô tả: `CognitiveEventStream`, `LessonScriptPackage`, `AgentRuntimeContext`.
  - Hai file mock fixtures chuẩn: `mock_cognitive_stream_vecto12.json` (58 phút Thầy Tiến) và `mock_short_clip_sample.json` (clip demo 60s).
* **Ví dụ định hướng (Example Guidance):**
  - *Ví dụ Interfaces:*
    ```typescript
    export interface CognitiveTimelineSegment {
      second: number;
      audioTranscript: string;
      blackboardLatex: string;
      spatialDrawing?: string;
      trapRiskLevel?: 'none' | 'medium' | 'high';
    }
    ```
* **Tiêu chí nghiệm thu (DoD):** Dự án compile sạch sẽ (`npm run lint`), cả 3 thành viên import mock data vào module của họ chạy độc lập không lỗi.

---

### 🎥 EPIC 1: MULTIMODAL INGESTION & COGNITIVE EXTRACTION
**Assignee phụ trách:** Blu (`@blu1606`)

#### 📌 Issue #101: `ingest: Xây dựng Multimodal Context Extractor cho clip ngắn 60s (Whisper STT & Gemini Vision OCR)`
* **Assignee:** `@blu1606`
* **Mục đích (Why):** Trình diễn trực tiếp năng lực công nghệ AI: xem video ngắn, nhận diện giọng nói và đọc chữ viết/hình vẽ không gian trên bảng phấn trong vài giây trước mắt ban giám khảo.
* **Outcome mong đợi (What Done Looks Like):**
  - Nhập vào một video clip ngắn (khoảng 60s) $\rightarrow$ Hệ thống tự động bóc tách và trả về danh sách `Timestamped Events` gồm lời nói của giáo viên và công thức toán học/hình vẽ trên bảng phấn.
* **Ví dụ định hướng (Example Guidance):**
  - Audio: Whisper API / Gemini Audio.
  - Video Keyframe: Cắt keyframe khi có scene change hoặc biến thiên delta pixel, gọi Gemini 2.5 Flash Vision với prompt:
    `"Trích xuất chữ viết bảng phấn, công thức LaTeX và cấu trúc hình học 3D (ví dụ: hình lập phương ABCD.A'B'C'D')."`
* **Tiêu chí nghiệm thu (DoD):** Xử lý clip 60 giây hoàn tất trong < 10 giây; kết quả hiển thị chuẩn xác LaTeX và text lời giảng.

#### 📌 Issue #102: `ingest: Xây dựng Hybrid Pre-indexed Lesson Loader cho bài giảng dài`
* **Assignee:** `@blu1606`
* **Mục đích (Why):** Tránh việc phải xử lý video dài 58 phút trực tiếp trong lúc demo (tốn 15 phút và dễ timeout), đảm bảo tốc độ trình diễn bài giảng lớn đạt 100 điểm mượt mà.
* **Outcome mong đợi (What Done Looks Like):**
  - Khi người dùng chọn bài giảng Thầy Tiến, toàn bộ dữ liệu bóc tách được nạp lên bộ nhớ trong tích tắc (< 1 giây), sẵn sàng kích hoạt các luồng tiếp theo.
* **Tiêu chí nghiệm thu (DoD):** Chuyển đổi giữa các bài giảng dài tức thì, không giật lag.

---

### 📚 EPIC 2: PEDAGOGICAL KNOWLEDGE BASE & RAG ENGINE
**Assignee phụ trách:** Hiếu (`@aprlx21`) & An (`@presentisperfect`)

#### 📌 Issue #201: `rag: Xây dựng Pedagogical Knowledge Base & Semantic Query Service (Toán 12 & Misconceptions)`
* **Assignee:** `@aprlx21` & `@presentisperfect`
* **Mục đích (Why):** Cung cấp mỏ neo tri thức chính xác để các Agent tra cứu, đảm bảo câu hỏi, bẫy ngộ nhận và câu trả lời bám sát chương trình GDPT 2018 và tâm lý học nhận thức sinh viên.
* **Outcome mong đợi (What Done Looks Like):**
  - Một kho tri thức có cấu trúc kèm Semantic Search / Tagging API: Nhập vào chủ đề bài học và hành vi học sinh $\rightarrow$ Trả về định nghĩa SGK chuẩn, cạm bẫy ngộ nhận tương ứng và phản ví dụ đối chứng.
* **Ví dụ định hướng (Example Guidance):**
  - Tra cứu theo vector embeddings hoặc semantic tags: `topic: "vecto_trong_khong_gian"`, `trap_type: "length_addition"` $\rightarrow$ trả về bẫy `MISC_VEC_003` và gợi ý giàn giáo cho Trợ giảng An.
* **Tiêu chí nghiệm thu (DoD):** Hàm truy vấn trả về đúng bẫy ngộ nhận khi đưa vào từ khóa *"cộng độ dài vectơ"* hoặc *"ví dụ 3 hình lập phương"*.

---

### 🤖 EPIC 3: MULTI-AGENT COLLABORATIVE SCRIPTWRITER & CROSS-CHECKING
**Assignee phụ trách:** Hiếu (`@aprlx21`)

#### 📌 Issue #301: `tools: Hiện thực hóa Deterministic Tools phục vụ Agent kiểm chứng toán học & Pacing kịch bản`
* **Assignee:** `@aprlx21`
* **Mục đích (Why):** Trang bị cho Agent các công cụ xác định (deterministic tools) để kiểm tra sự thật khách quan, ngăn chặn tình trạng ảo giác toán học (hallucination).
* **Outcome mong đợi (What Done Looks Like):**
  - Các hàm kiểm chứng độc lập mà Agent có thể gọi thông qua Function Calling:
    1. `tool_verify_vector_algebra`: Kiểm chứng quy tắc vectơ và đẳng thức toán học.
    2. `tool_timeline_collision_checker`: Đánh giá khoảng cách phát ngôn trên trục thời gian để lời thoại không đè lên nhau.
    3. `tool_query_misconception_kb`: Tra cứu kho RAG tri thức ngộ nhận.
* **Tiêu chí nghiệm thu (DoD):** Agent gọi tool nhận về kết quả JSON chính xác và biết dùng kết quả đó để điều chỉnh lời thoại.

#### 📌 Issue #302: `agent: Thiết kế buồng họp A2A Scriptwriting Roundtable có rà soát chéo giữa Bo và Trí`
* **Assignee:** `@aprlx21`
* **Mục đích (Why):** Biến khâu viết kịch bản thành một cuộc họp thảo luận đa tác nhân thực thụ: các Agent có thiên kiến và vai trò nhận thức riêng, đối chất và rà soát chéo lẫn nhau.
* **Outcome mong đợi (What Done Looks Like):**
  - Quy trình sinh kịch bản tự động: Bo đề xuất bẫy nhận thức từ bảng phấn $\rightarrow$ Trí gọi tool rà soát chéo tính logic $\rightarrow$ Linh Chi đề xuất mẹo ghi nhớ $\rightarrow$ Cô Lam thẩm định bậc Bloom và gắn điểm dừng Checkpoint.
* **Tiêu chí nghiệm thu (DoD):** Kịch bản sinh ra có tính liên kết chặt chẽ, lời thoại tự nhiên, có bẫy ngộ nhận và khớp chính xác với từng mốc giây bài giảng.

#### 📌 Issue #303: `stream: Xây dựng cơ chế Server-Sent Events (SSE) phát trực tiếp Live Reasoning Stream & Tool Calls về UI`
* **Assignee:** `@aprlx21`
* **Mục đích (Why):** Trực quan hóa "não bộ" của Agent để người dùng và ban giám khảo nhìn thấy các Agent đang suy luận, tranh cãi và gọi tool trong thời gian thực.
* **Outcome mong đợi (What Done Looks Like):**
  - Luồng sự kiện thời gian thực (Event Stream) bắn các thông điệp: Suy nghĩ ngầm (`thought`), lượt gọi tool (`tool_call`), kết quả xác thực (`tool_result`) và phát ngôn chốt (`dialogue`) về giao diện.
* **Tiêu chí nghiệm thu (DoD):** Giao diện nhận được stream sự kiện liên tục không bị gián đoạn, hiển thị từng bước tư duy của Agent.

---

### 🧠 EPIC 4: RUNTIME PEDAGOGICAL DISPATCHER & CONTEXT ISOLATION
**Assignee phụ trách:** An (`@presentisperfect`)

#### 📌 Issue #401: `runtime: Xây dựng Intent Classifier & Dynamic Routing Dispatcher điều phối Agent chuyên biệt`
* **Assignee:** `@presentisperfect`
* **Mục đích (Why):** Khi học sinh tương tác bất kỳ (hỏi câu hỏi, tranh biện, xin gợi ý), hệ thống tự động phân tích và chọn đúng bạn học AI phù hợp nhất để trả lời thay vì một chatbot trả lời chung chung.
* **Outcome mong đợi (What Done Looks Like):**
  - Một bộ định tuyến thông minh phân loại ý định người học và gán đúng vai: Hỏi công thức $\rightarrow$ Linh Chi; Hỏi bản chất $\rightarrow$ Trí; Đưa ra cách làm tắt $\rightarrow$ Bo; Bế tắc $\rightarrow$ Trợ giảng An; Phản biện xuất sắc $\rightarrow$ Bo nhận thua và Cô Lam chốt bài.
* **Tiêu chí nghiệm thu (DoD):** Định tuyến chính xác ít nhất 90% các câu hỏi mẫu thử nghiệm sang đúng nhân vật tương ứng.

#### 📌 Issue #402: `runtime: Đóng gói Context Isolation Snapshot bám sát bảng phấn tại giây hiện tại (Board Grounding)`
* **Assignee:** `@presentisperfect`
* **Mục đích (Why):** Đảm bảo khi Agent trả lời học sinh, Agent nhìn thấy chính xác những gì đang diễn ra trên bảng và lời thầy nói tại đúng giây đó, tránh trả lời chung chung hoặc lạc đề.
* **Outcome mong đợi (What Done Looks Like):**
  - Cơ chế đóng gói "Ảnh chụp ngữ cảnh" (Context Snapshot) tức thời gồm: Nội dung bảng phấn tại giây hiện tại, 30 giây bài giảng gần nhất, lịch sử chat gần đây và kho RAG liên quan.
* **Tiêu chí nghiệm thu (DoD):** Agent phản hồi trích dẫn đúng dữ kiện bảng phấn tại giây đang dừng, không bị nhầm sang bài toán khác.

#### 📌 Issue #403: `evaluator: Xây dựng bộ đo Cognitive Metrics và thẩm định chứng nhận Tháp Bloom`
* **Assignee:** `@presentisperfect`
* **Mục đích (Why):** Đo lường tiến bộ thực sự của học sinh thông qua phản biện và cấp chứng nhận năng lực theo thang đo Bloom.
* **Outcome mong đợi (What Done Looks Like):**
  - Hệ thống tính toán ngầm các chỉ số: Hesitation Index (thời gian ngập ngừng trước khi trả lời), Rebuttal Quality (độ sắc bén khi bắt bẻ Bo), và cấp chứng chỉ Tháp Bloom khi học sinh hoàn thành Trạm 4 (dạy kèm Bo).
* **Tiêu chí nghiệm thu (DoD):** Trả về điểm số và cấp độ Bloom tương ứng sau mỗi lượt đối chất của học sinh.

---

### 🎨 EPIC 5: TEACHER STUDIO UI & MULTI-AGENT OBSERVABILITY
**Assignee phụ trách:** Khuê (`@kaity121`)

#### 📌 Issue #501: `ui: Thiết kế Multi-Agent War Room Live Console trực quan hóa suy nghĩ và Tool Calls`
* **Assignee:** `@kaity121`
* **Mục đích (Why):** Tạo ấn tượng thị giác mạnh mẽ (WOW factor) cho người dùng/giám khảo khi xem các Agent "họp bàn" biên kịch.
* **Outcome mong đợi (What Done Looks Like):**
  - Một bảng điều khiển trực quan (War Room Live Monitor) hiển thị các hoạt động của Agent: Avatar đổi trạng thái khi đang suy nghĩ, hiển thị hộp gọi Tool với icon và kết quả rà soát chéo dạng visual sinh động.
* **Tiêu chí nghiệm thu (DoD):** Dữ liệu stream từ backend được render mượt mà, hiển thị rõ ràng từng bước tranh luận giữa Bo, Trí, Linh Chi.

#### 📌 Issue #502: `ui: Xây dựng Multi-Track Timeline Editor cho giảng viên kiểm duyệt và chỉnh sửa kịch bản`
* **Assignee:** `@kaity121`
* **Mục đích (Why):** Cung cấp công cụ trực quan để giảng viên kiểm duyệt và chỉnh sửa kịch bản ngay trên dòng thời gian video.
* **Outcome mong đợi (What Done Looks Like):**
  - Thanh Timeline đa rãnh trực quan bên dưới video:
    * Rãnh 1: Ảnh chụp thu nhỏ bảng phấn (Thumbnails).
    * Rãnh 2: Các điểm dừng câu hỏi (Checkpoints).
    * Rãnh 3: Dòng bình luận của các bạn AI (Peer comments).
  - Cho phép click vào từng mốc để nghe/xem trước, sửa câu từ trực tiếp và nút **[✓ Duyệt kịch bản]**.
* **Tiêu chí nghiệm thu (DoD):** Tương tác kéo tua mượt mà, hiển thị đầy đủ các sự kiện sư phạm trên trục thời gian.

#### 📌 Issue #503: `ui: Nâng cấp Agent Inspector Modal soi não ngầm của Agent trong phòng học 4 Trạm (Thought Stream)`
* **Assignee:** `@kaity121`
* **Mục đích (Why):** Giúp người xem "soi não" Agent trong lúc học sinh đang học ở phòng 4 Trạm, chứng minh AI đang xử lý thời gian thực.
* **Outcome mong đợi (What Done Looks Like):**
  - Người demo có thể bật tab/modal "Agent Inspector" (hoặc nhấn phím tắt) để xem suy nghĩ nội tâm (`<thought>`) của Bo khi học sinh đưa ra câu trả lời, thấy Assessor chấm điểm và cập nhật Tháp Bloom trực tiếp.
* **Tiêu chí nghiệm thu (DoD):** Hiển thị tức thời suy nghĩ ngầm của Agent ngay khi học sinh gửi phản biện.

---

### 🏆 EPIC 6: SHOWCASE AUTOMATION & PITCH READINESS
**Assignee phụ trách:** Blu (`@blu1606`) & Toàn team

#### 📌 Issue #601: `demo: Xây dựng 1-Click Automated Showcase Controller liên hoàn 4 Trạm (Phím tắt F2)`
* **Assignee:** `@blu1606` + Toàn team
* **Mục đích (Why):** Đảm bảo luồng demo mượt mà 100% trong 5 phút khi thuyết trình trước ban giám khảo, không bị rủi ro thao tác tay lúng túng.
* **Outcome mong đợi (What Done Looks Like):**
  - Một thanh điều khiển kịch bản demo (phím tắt F2): Cho phép nhảy ngay đến Clip Live 60s $\rightarrow$ Bật War Room $\rightarrow$ Đổ kịch bản xuống Timeline $\rightarrow$ Nhảy đến mốc 37:13 Trạm 1 $\rightarrow$ Tự động gõ phản biện mẫu để kích hoạt Bo $\rightarrow$ Mở chứng nhận Trạm 4.
* **Tiêu chí nghiệm thu (DoD):** Chạy trơn tru từ đầu đến cuối mà không cần reload trang hay cấu hình phức tạp.

#### 📌 Issue #602: `docs: Đồng bộ hóa Pitch Deck, System Architecture Documentation & Demo Walkthrough`
* **Assignee:** `@blu1606`
* **Mục đích (Why):** Đồng bộ toàn bộ tài liệu dự án, slide thuyết trình và video demo làm nổi bật giá trị cốt lõi: Multi-Agent có Tools, Pedagogical RAG và Tiết kiệm 80% chi phí.
* **Tiêu chí nghiệm thu (DoD):** Slide pitch deck và tài liệu kỹ thuật phản ánh chính xác các tính năng đã hiện thực hóa.

---

## 📊 PHẦN IV: BẢNG TỔNG HỢP PHÂN CÔNG & ASSIGNEE

| Mã Issue | Tên Issue (Kèm Keywords Kỹ thuật) | Epic (Tiếng Anh) | Assignee |
| :--- | :--- | :--- | :--- |
| **#001** | Xây dựng Contracts trao đổi dữ liệu & Standalone Mock Fixtures | `EPIC 0: FOUNDATION CONTRACTS` | **Blu (`@blu1606`)** |
| **#101** | Xây dựng Multimodal Context Extractor cho clip ngắn 60s (Whisper STT & Gemini Vision OCR) | `EPIC 1: MULTIMODAL INGESTION` | **Blu (`@blu1606`)** |
| **#102** | Xây dựng Hybrid Pre-indexed Lesson Loader cho bài giảng dài | `EPIC 1: MULTIMODAL INGESTION` | **Blu (`@blu1606`)** |
| **#201** | Xây dựng Pedagogical Knowledge Base & Semantic Query Service (Toán 12 & Misconceptions) | `EPIC 2: PEDAGOGICAL RAG` | **Hiếu (`@aprlx21`) & An (`@presentisperfect`)** |
| **#301** | Hiện thực hóa Deterministic Tools phục vụ Agent kiểm chứng toán học & Pacing kịch bản | `EPIC 3: MULTI-AGENT SCRIPTWRITER` | **Hiếu (`@aprlx21`)** |
| **#302** | Thiết kế buồng họp A2A Scriptwriting Roundtable có rà soát chéo giữa Bo và Trí | `EPIC 3: MULTI-AGENT SCRIPTWRITER` | **Hiếu (`@aprlx21`)** |
| **#303** | Xây dựng cơ chế Server-Sent Events (SSE) phát trực tiếp Live Reasoning Stream & Tool Calls về UI | `EPIC 3: MULTI-AGENT SCRIPTWRITER` | **Hiếu (`@aprlx21`)** |
| **#401** | Xây dựng Intent Classifier & Dynamic Routing Dispatcher điều phối Agent chuyên biệt | `EPIC 4: RUNTIME DISPATCHER` | **An (`@presentisperfect`)** |
| **#402** | Đóng gói Context Isolation Snapshot bám sát bảng phấn tại giây hiện tại (Board Grounding) | `EPIC 4: RUNTIME DISPATCHER` | **An (`@presentisperfect`)** |
| **#403** | Xây dựng bộ đo Cognitive Metrics và thẩm định chứng nhận Tháp Bloom | `EPIC 4: RUNTIME DISPATCHER` | **An (`@presentisperfect`)** |
| **#501** | Thiết kế Multi-Agent War Room Live Console trực quan hóa suy nghĩ và Tool Calls | `EPIC 5: TEACHER STUDIO UI` | **Khuê (`@kaity121`)** |
| **#502** | Xây dựng Multi-Track Timeline Editor cho giảng viên kiểm duyệt và chỉnh sửa kịch bản | `EPIC 5: TEACHER STUDIO UI` | **Khuê (`@kaity121`)** |
| **#503** | Nâng cấp Agent Inspector Modal soi não ngầm của Agent trong phòng học 4 Trạm (Thought Stream) | `EPIC 5: TEACHER STUDIO UI` | **Khuê (`@kaity121`)** |
| **#601** | Xây dựng 1-Click Automated Showcase Controller liên hoàn 4 Trạm (Phím tắt F2) | `EPIC 6: SHOWCASE AUTOMATION` | **Blu (`@blu1606`) + All** |
| **#602** | Đồng bộ hóa Pitch Deck, System Architecture Documentation & Demo Walkthrough | `EPIC 6: SHOWCASE AUTOMATION` | **Blu (`@blu1606`)** |
