# Kiến Trúc Hệ Thống DRE Multi-Agent Interactive Learning

Tài liệu này mô tả kiến trúc tổng thể 4 tầng (4-Tier Architecture) của hệ thống DRE (Diagnose - Repair - Explain), đồng thời trình bày định hướng mở rộng đa môn học (Subject-Agnostic) theo EPIC 7.

---

## 1. Tổng Quan Kiến Trúc 4 Tầng (4-Tier Architecture)

Hệ thống DRE được thiết kế theo kiến trúc phân tầng rõ ràng, phân tách giữa lớp hợp đồng dữ liệu, lớp hội đồng tác nhân trí tuệ nhân tạo, lớp điều phối thời gian thực và lớp giao diện người dùng:

```
+-------------------------------------------------------------------------+
| TẦNG 4: GIAO DIỆN NGƯỜI DÙNG & ĐIỀU KHIỂN SHOWCASE                      |
| React 19 + Vite 8 | Lime Soft Tokens (#C8F169 & #121712)                |
| Resizable Splitter | Inspector Drawer | Timeline Editor | Showcase HUD  |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ HTTP / SSE / REST
                                    ▼
+-------------------------------------------------------------------------+
| TẦNG 3: ĐIỀU PHỐI THỜI GIAN THỰC & PHÁT LUỒNG TRỰC TIẾP                 |
| Runtime Intent Classifier & Dynamic Dispatcher (/api/runtime/dispatch)  |
| Server-Sent Events (SSE) Live Stream (/api/roundtable/stream)           |
| Bộ công cụ tất định: Vector Algebra, RAG KB, Collision, Bloom Evaluator |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Event Sourcing / Tool Invocation
                                    ▼
+-------------------------------------------------------------------------+
| TẦNG 2: HỘI ĐỒNG TÁC NHÂN PHẢN BIỆN CHÉO (ROUNDTABLE COUNCIL)           |
| Bo (Gài bẫy ngộ nhận)      <--Tranh luận-->  Trí (Đào sâu & Kiểm toán)  |
| An (Điều phối sư phạm)     <--Chốt kiến-->   Cô Lam (Giám đốc sư phạm)  |
| Assessor (Chấm ngầm nhận thức)              Linh Chi & Minh Khang       |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Schema Validation
                                    ▼
+-------------------------------------------------------------------------+
| TẦNG 1: HỢP ĐỒNG DỮ LIỆU & NGUỒN TRI THỨC (INGESTION & CONTRACTS)       |
| src/types/pipeline.ts (CognitiveEventStream, LessonCheckpointDraft)    |
| Chuẩn hóa dữ liệu PR #21 (Sanitized KaTeX, Deterministic JSON Fixtures) |
| Kho tri thức ngộ nhận chuyên sâu (DRE Vector Misconception KB)          |
+-------------------------------------------------------------------------+
```

---

## 2. Chi Tiết Các Tầng Chức Năng

### 2.1. Tầng 1: Hợp đồng dữ liệu & Nguồn tri thức (Data Contracts & Ingestion)

Tầng 1 đóng vai trò là nền móng vững chắc, bảo đảm mọi thành phần trong hệ thống giao tiếp thông qua các hợp đồng dữ liệu được định nghĩa chặt chẽ:

- **src/types/pipeline.ts**: Định nghĩa các kiểu dữ liệu trung tâm:
  - `CognitiveEventStream`: Luồng sự kiện nhận thức gồm các giai đoạn nối tiếp (`stages`).
  - `DeterministicToolCall`: Chuẩn hóa kết quả gọi công cụ tất định với các trường bắt buộc: `toolName`, `input`, `output`, `isValid`, `timestampMs`.
  - `ReasoningEvent`: Cấu trúc sự kiện suy luận đa tác tử gồm các kiểu `thought`, `debate_turn`, `tool_call`, `tool_result`, `checkpoint_created`.
  - `DRELessonSchema`: Cấu trúc bài giảng hoàn chỉnh tích hợp các điểm dừng (`checkpoints`), bẫy ngộ nhận (`misconceptions`) và khảo sát Bloom.
- **Chuẩn hóa KaTeX & Dọn dẹp ký tự rác**: Toàn bộ chuỗi LaTeX toán học được xử lý qua bộ lọc `sanitizeKatex.ts`, loại bỏ tuyệt đối ký tự Unicode lỗi (ví dụ: `\u20d7`, `d6c2`) trước khi nạp vào hệ thống.
- **Kho tri thức ngộ nhận (Misconception KB)**: Lưu trữ danh sách các ngộ nhận toán học điển hình (ví dụ: `MISC_VEC_005` - Cộng trực tiếp độ dài vectơ thay vì tìm vectơ tổng), cung cấp ngữ cảnh RAG chính xác cho AI.

### 2.2. Tầng 2: Hội đồng tác nhân phản biện chéo (Multi-Agent Roundtable Council)

DRE không dựa vào một mô hình LLM đơn lẻ mà vận hành một hội đồng đa tác tử có vai trò sư phạm riêng biệt để triệt tiêu ảo giác toán học:

- **Bo (Bạn học gài bẫy)**: Đóng vai học sinh mang định kiến trực quan, liên tục đưa ra các phương án giải tắt sai lầm để kích thích người học phản biện.
- **Trí (Nhà tư duy sâu / Deep Thinker)**: Phản biện sắc bén các lập luận sai của Bo, truy xuất bản chất hình học không gian và gọi công cụ kiểm chứng đại số vectơ.
- **An (Trợ giảng điều phối)**: Theo dõi nhịp độ học tập, phân tầng gợi ý bậc thang (Scaffolding Level 1 -> Level 2) khi học sinh gặp khó khăn.
- **Cô Lam (Giám đốc sư phạm)**: Giáo viên chủ trì, tổng kết quy tắc vàng trên nền bảng phấn và chốt kiến thức sau khi học sinh và Bo đã đối thoại.
- **Assessor (Trọng tài chấm ngầm)**: Giám sát lượt thoại ngầm, đánh giá chất lượng phản biện của học sinh (sắc bén hay chưa rõ), đo lường mức độ do dự và xếp hạng Tháp Bloom.
- **Quy trình 4 pha suy luận (4-Phase Protocol)**:
  1. *Pha 1 (Trích xuất)*: Phân tích thực thể hình học và miền giá trị của bài toán.
  2. *Pha 2 (Truy hồi)*: RAG tra cứu kho tri thức ngộ nhận liên quan.
  3. *Pha 3 (Bàn tròn)*: Tranh luận chéo giữa Trí và Bo để sàng lọc bẫy chất lượng nhất.
  4. *Pha 4 (Đánh giá)*: Đánh giá độ phù hợp theo Tháp Bloom và phê duyệt điểm dừng.

### 2.3. Tầng 3: Điều phối thời gian thực & Phát luồng trực tiếp (Runtime & Streaming)

Tầng 3 kết nối giữa logic nghiệp vụ backend và trải nghiệm tương tác frontend:

- **Runtime Intent Classifier & Dynamic Dispatcher (`/api/runtime/dispatch`)**:
  - Phân loại ý định người học theo cơ chế lai (Heuristic + LLM Classifier).
  - Tự động định tuyến tin nhắn đến đúng tác tử phù hợp nhất (Bo, Trí, An, Cô Lam).
  - Tích hợp công cụ kiểm chứng tất định để bơm kết quả tính toán chính xác vào lời thoại của tác tử.
- **Server-Sent Events (SSE) Live Stream (`/api/roundtable/stream`)**:
  - Phát trực tiếp luồng suy nghĩ, tranh biện và gọi công cụ từ backend lên giao diện War Room theo thời gian thực.
  - Hỗ trợ các tham số `videoId`, `partNumber`, `streamDelayMs`, `useLLM`.
- **Bộ công cụ tất định (Deterministic Tools Layer)**:
  - `tool_verify_vector_algebra`: Xác thực đại số vectơ và quy tắc hình hộp bằng tọa độ 3D thực.
  - `tool_query_misconception_kb`: Tra cứu tri thức ngộ nhận tương thích chuẩn RAG.
  - `tool_timeline_collision_checker`: Kiểm tra nhịp sư phạm, ngăn chặn 2 điểm dừng cách nhau < 20 giây hoặc rơi vào 15 giây khởi động (warmup).
  - `tool_evaluate_bloom_level`: Đánh giá mức độ nhận thức câu hỏi từ Nhớ, Hiểu đến Phân tích, Đánh giá.

### 2.4. Tầng 4: Giao diện người dùng & Bộ điều khiển Showcase (UI & Showcase Controller)

Giao diện phía client được tối ưu hóa theo triết lý Lime Soft EdTech:

- **Lime Soft Design System**:
  - Màu nền chủ đạo: Kem sáng `#F3F8E8`.
  - Đường viền thẻ: Xanh xám nhẹ `#E2EAD2`.
  - Điểm nhấn thu hút: Xanh chanh `#C8F169`.
  - Màu chữ & nền tương phản cao: Đen mun `#121712`.
  - Cỡ chữ tối thiểu: 12px, tỷ lệ tương phản đạt chuẩn WCAG AA (>= 4.5:1).
- **Thanh chia kích thước đa chiều (Resizable Splitter)**:
  - Cho phép người học kéo thả linh hoạt giữa cột Video, cột Thảo luận AI và cột Soi não tác nhân.
  - Cơ chế pointer capture chống kẹt chuột, các nút chọn nhanh bố cục (Video rộng, Mặc định, Chat rộng) và lưu trữ trạng thái qua `localStorage`.
- **Thanh tra nhận thức Inspector Drawer**:
  - Trực quan hóa 4 khối phân tích chuyên sâu cho nhà nghiên cứu và giáo viên.
  - Minh bạch hóa sự cách ly ngữ cảnh (Visible Context vs Hidden Context có biểu tượng ổ khóa ẩn với Bo).
- **Bộ điều khiển Showcase 1-Click (ShowcaseHUD & useShowcaseController)**:
  - Hỗ trợ phím tắt `F2` tự động trình diễn toàn bộ 4 Trạm trong 23 giây.
  - Hiển thị thanh Mini-HUD nổi định vị tại giữa đáy màn hình với đèn tín hiệu trực tiếp, bộ đếm ngược và nút điều hướng.

---

## 3. Định Hướng Mở Rộng Đa Môn Học (Subject-Agnostic theo EPIC 7)

Hệ thống DRE đã hiện thực hóa kiến trúc bóc tách giữa Lõi dùng chung (Core Engine) và các Gói chuyên môn cắm ngoài (Pluggable Subject Packs) theo quyết định phương án B của PO:

```
+-------------------------------------------------------------------------+
|                          DRE CORE ENGINE                                |
|  FSM State Machine · Multi-Agent Debate Council · Runtime Dispatcher    |
|  Pacing Collision Checker · Bloom Evaluator · SSE Streaming Gateway     |
|  Source Grounding Arbiter (tool_check_source_grounding)                 |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Nạp bối cảnh (Context Ingestion)
                                    ▼
+-------------------------------------------------------------------------+
|                  PLUGGABLE SUBJECT PACKS (GÓI CHUYÊN MÔN)               |
|                                                                         |
|  [Toán 12 Pack]       [Ngữ Văn Pack]      [Sinh Học Pack]   [AI / CS]   |
|  - Hình lập phương    - Phân tích thơ     - Di truyền học   - Thuật toán|
|  - Tọa độ 3D          - Văn học hiện thực - ADN & Tế bào    - Độ phức tạp|
|  - Vector Tool        - Trích dẫn Tool    - Sinh học Tool   - Python Run|
+-------------------------------------------------------------------------+
```

### 3.1. Các thành phần đã triển khai (Triển khai hoàn tất Issue #28, #30, #31)
1. **Prompt thị giác trung lập & Nhận diện đa bố cục (`backend/services/clipExtractor.js` - Issue #28)**:
   - Thay thế prompt gắn cứng bảng phấn Toán bằng prompt đa môn nhận diện cả slide bài thuyết trình, bảng đen, biểu đồ và văn bản OCR.
   - Hỗ trợ cấu hình vùng quan tâm (ROI) linh hoạt theo từng môn học.
2. **Bộ điều phối bám nguồn & Persona động (`backend/services/dispatcher.js` - Issue #30)**:
   - Persona prompts được tạo động theo `subjectId`, `subjectName` và `domainTerms`.
   - Phân biệt rõ câu hỏi trong nguồn và ngoài nguồn (`not_in_source`).
   - Tích hợp công cụ trọng tài nguồn `tool_check_source_grounding`: Trí sử dụng để phản biện bẫy của Bo dựa trên tài liệu bài giảng có trích dẫn mốc thời gian.
3. **Bộ dữ liệu kiểm chứng đa môn (`backend/fixtures/VID_AI_INTRO_01.json` & `dispatcher_subject_agnostic.test.js` - Issue #31)**:
   - Kiểm thử đầu-cuối bài giảng Trí tuệ nhân tạo (Machine Learning).
   - Kiểm định tự động: 0% từ khóa vectơ (`vecto`, `vector`, `hình lập phương`, `đường chéo`...) xuất hiện trong câu trả lời môn khác.
   - Bảo đảm backward compatibility 100%: Bài giảng Toán 12 Thầy Tiến tại 37:13 không bị ảnh hưởng.
