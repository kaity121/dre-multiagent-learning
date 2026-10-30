# Hướng Dẫn Trình Diễn 1-Click Và Kịch Bản 4 Trạm (Showcase Walkthrough)

Tài liệu này mô tả bộ điều khiển Showcase 1-Click (Issue #17) và kịch bản thuyết trình 4 Trạm của DRE Multi-Agent Interactive Learning.

> **Phạm vi trung thực.** Showcase 1-Click là một **tour phát lại có kịch bản (fixture replay)** dài 23 giây qua các màn hình UI. Nó **không** chứng minh pipeline ingestion trực tiếp, bàn tròn đa tác tử chạy LLM thật, hay đo lường tiến bộ của người học. Mục 4 tách rõ phần đã trình diễn được và phần là tích hợp tương lai.

---

## 1. Hướng Dẫn Vận Hành 1-Click

### 1.1. Các phương thức kích hoạt
- **Phím tắt F2**: Nhấn `F2` để khởi chạy chu trình 4 Trạm. Nhấn lại `F2` để dừng và trở về trạng thái ban đầu.
- **Nút trên thanh Header**: Nút **Demo 1-Click (F2)** (biểu tượng tia sét) ở góc phải thanh tiêu đề.
- **Tham số URL**: Mở `http://localhost:3000/?showcase=1` (hoặc `?demo=1`) để tự khởi chạy khoảng 300 ms sau khi tải trang. Tham số này chỉ được dùng **một lần** cho mỗi lần tải trang: sau khi người demo nhấn `Esc`, `Space`, `F2` hoặc nút dừng, showcase không tự bật lại.
- **Nguồn sự kiện War Room**: Showcase luôn dùng `ReplaySource`, phát lại fixture `mock/mock_reasoning_events.json` (18 sự kiện) cộng với một marker kết thúc do UI thêm vào. Nút chuyển sang SSE trong War Room đổi nguồn sang route `GET /api/roundtable/stream`, nơi Roundtable Orchestrator chạy thật (mặc định tất định, không gọi LLM) và báo `provenance` qua frame `session_start`. Nhãn nút hiển thị đúng nguồn máy chủ báo về: `SSE backend (live)` cho phiên chạy trực tiếp, `SSE backend (replay)` khi phát lại một run đã ghi, `SSE backend (fixture)` khi phát fixture dự phòng; trước khi nhận `session_start`, nhãn là `SSE backend (chờ kết nối)`.

### 1.2. Các phím điều hướng trong khi trình diễn
- **Space**: Tạm dừng / tiếp tục trạm hiện tại (bỏ qua khi đang gõ trong ô nhập liệu).
- **Escape**: Thoát Showcase và đóng Mini-HUD.
- **Nút "Trạm kế tiếp" trên Mini-HUD**: Bỏ qua thời gian còn lại của trạm hiện tại.

---

## 2. Kịch Bản Thuyết Trình 4 Trạm

Tổng thời lượng dự kiến: **23 giây**. Trạm 1 có thể kéo dài hơn 7 giây nếu backend phản hồi chậm (xem Trạm 1).

```
00:00 ─── Trạm 1: Lớp học tương tác & Phản biện ─────── 00:07
00:07 ─── Trạm 2: War Room (phát lại fixture) ───────── 00:13
00:13 ─── Trạm 3: Multi-Track Timeline Editor ───────── 00:18
00:18 ─── Trạm 4: Inspector & Tháp Bloom ────────────── 00:23 (Hoàn tất)
```

---

### Trạm 1: Lớp học tương tác & Phản biện bẫy nhận thức (00:00 - 00:07)

- **Hành động hệ thống**:
  1. Giao diện chuyển về Lớp học (`activeStudioView = 'classroom'`, `currentMode = 'video_clash'`).
  2. Video nhảy đến điểm dừng 37:13 (Ví dụ 3, hình lập phương của Thầy Tiến) và hiện câu hỏi trắc nghiệm. Nếu giáo viên đã tắt toàn bộ câu hỏi dừng, bài học không có điểm dừng và bước này không làm gì.
  3. Tại giây 2.2: chọn phương án bẫy theo **id ổn định** `opt_b` ("Tách trực tiếp thành tổng hai độ dài: |BC| + |DD'| = 1 + 1 = 2"). Không chọn theo nội dung nhãn, vì nhãn của đáp án đúng cũng chứa chữ "BC".
  4. Phản biện được gửi **không sớm hơn giây 4.4** và **chỉ sau khi bước trả lời đã hoàn tất** (kể cả khi bước trả lời phải tạo phiên backend). Trạm 1 chỉ chuyển sang Trạm 2 khi phản biện đã xử lý xong, chờ tối đa 8 giây.
  5. Với bài `VID_VECTO_12`, lời Bo nhận thua và quy tắc vàng của Cô Lam lấy từ nội dung bài học đã biên soạn. Khi backend đang chạy, App gọi thêm `/api/runtime/dispatch` để cập nhật Inspector bằng kết quả của bộ điều phối.
- **Lời thuyết minh**:
  > "Đây là Trạm 1: Lớp học tương tác DRE. Ở mốc 37:13 của bài giảng Thầy Tiến, học sinh gặp ngộ nhận điển hình: tách độ dài của tổng thành tổng hai độ dài. Thay vì chỉ chấm đúng sai, DRE để bạn học Bo tranh luận trực tiếp. Học sinh dùng lập luận vectơ nối tiếp để bẻ bẫy, sau đó Cô Lam chốt quy tắc vàng."

---

### Trạm 2: Multi-Agent War Room, phát lại fixture (00:07 - 00:13)

- **Hành động hệ thống**:
  1. Giao diện chuyển sang War Room (`activeStudioView = 'warroom'`) và tự phát lại khi showcase đang chạy.
  2. Nguồn sự kiện là `ReplaySource` (fixture `RT_math_12_vecto_01_part03`). Các loại sự kiện trong fixture: `thought`, `tool_call`, `tool_result`, `debate_turn`, `cross_check_verdict`, `checkpoint_created`. `reasoningAdapter` chuyển chúng sang kiểu UI (`thinking`, `speaking`, ...); `checkpoint_created` hiển thị như một lượt phát biểu, **không** được coi là kết thúc.
  3. Các lượt gọi công cụ có trong fixture: `tool_query_misconception_kb`, `tool_verify_vector_algebra`, `tool_evaluate_bloom_level`, `tool_timeline_collision_checker`. Kết quả hiển thị đúng ba trạng thái `isValid` (`true` / `false` / chưa xác định).
  4. Phán quyết phản biện chéo không có trường `crossCheck` sẽ được đọc từ `metadata.verdict` hoặc cụm mở đầu ("Chấp nhận…", "Bác…"). Nếu không xác định được, UI hiện nhãn trung tính thay vì tự suy ra đồng thuận.
- **Lời thuyết minh**:
  > "Trạm 2 cho thấy hậu trường: bàn tròn suy luận War Room. Đây là bản phát lại một phiên bàn tròn đã ghi lại, trong đó Trí phản biện đề xuất của Bo và các kết quả tính toán được kiểm bằng công cụ tất định thay vì chỉ tin vào lời của mô hình. Mục tiêu của thiết kế này là giảm sai sót toán học. Chúng tôi chưa có số liệu đo mức giảm đó."

---

### Trạm 3: Multi-Track Timeline Editor (00:13 - 00:18)

- **Hành động hệ thống**:
  1. Giao diện chuyển sang trình biên tập giáo án (`activeStudioView = 'editor'`).
  2. Hiển thị dòng thời gian đa luồng theo từng phần của giáo án demo (4 phần, tổng 98:00). Thước đo chia vạch 5 phút trong phạm vi của phần đang chọn.
  3. Thẻ Bento tính từ bản nháp hiện tại: tổng thời lượng, số câu hỏi dừng đang bật / tổng số, số lượt thoại tác tử, mức Tháp Bloom cao nhất được gắn nhãn.
  4. Bộ kiểm tra va chạm cảnh báo hai mốc cách nhau dưới 20 giây (trừ các mốc được đánh dấu nối tiếp chủ ý) và mốc rơi vào 15 giây khởi động. Khi backend đang chạy, kiểm tra được gửi tới `tool_timeline_collision_checker` qua `/api/tools/execute`; nếu không, dùng bộ kiểm tra cục bộ.
- **Lời thuyết minh**:
  > "Tại Trạm 3, giáo viên làm chủ nội dung. Điểm dừng và kịch bản tranh biện của AI nằm trên dòng thời gian đa luồng, bộ kiểm tra nhịp cảnh báo khi các lần ngắt bài giảng quá dày, và giáo viên phê duyệt để đưa giáo án vào lớp học."

---

### Trạm 4: Inspector & Tháp Bloom (00:18 - 00:23)

- **Hành động hệ thống**:
  1. Giao diện quay lại Lớp học và mở ngăn kéo Inspector (`InspectorDrawer`).
  2. Inspector hiển thị 4 khối của lượt thoại mới nhất: Điều phối (ý định, tác tử được chọn, độ tin cậy), Ngữ cảnh (phần hiển thị và phần bị ẩn với Bo), Suy nghĩ ngầm và câu thoại, Đánh giá (ý đã đạt, ý còn thiếu, Bloom, độ do dự).
  3. Các trường không có số đo thật từ evaluator hoặc dispatcher được gắn nhãn **"(Chưa đo / Mô phỏng)"**. Trong showcase, độ tin cậy, Bloom và độ do dự chỉ có giá trị khi backend trả về; tour này không trình diễn tiến bộ Bloom đã đo được.
  4. Khi hết giờ, Mini-HUD hiện thông báo hoàn tất và tự trở về trạng thái thường sau 3,5 giây.
- **Lời thuyết minh**:
  > "Trạm 4 là Inspector. Giáo viên xem được vì sao bộ điều phối chọn tác tử này, tác tử được thấy và không được thấy những gì, và nó nghĩ gì trước khi nói. Ô nào chưa có số đo thật thì hệ thống ghi rõ là chưa đo, không trình bày như kết quả đánh giá."

---

### Phần mở rộng: đổi sang video môn khác (không nằm trong chu trình F2)

- **Mục tiêu**: Cho thấy lõi điều phối không gắn cứng vào môn Toán (EPIC 7, Issue #28/#30/#31).
- **Trạng thái**: Đây là **năng lực phía backend** thuộc cụm PR backend (`backend/src/services/clipExtractor.js`, `backend/src/services/dispatcher.js`, `backend/src/tools/tool_check_source_grounding.js`, chỉ mục `backend/src/data/lesson-index/VID_AI_INTRO_01.json`). Nó được kiểm bởi `backend/test/dispatcher_subject_agnostic.test.js` và `backend/test/tool_check_source_grounding.test.js`. Showcase F2 không tự chạy phần này, và nhánh tích hợp UI này cũng không xác minh lại nó.
- **Kịch bản dự kiến khi trình diễn thủ công qua API**:
  1. Câu hỏi trong bài (*"Học có giám sát bắt buộc phải có nhãn đúng không?"*): Trí trả lời và trích mốc nguồn `[02:00]`.
  2. Câu hỏi ngoài lề (*"Thời tiết ngày mai ở Sa Pa thế nào?"*): bộ điều phối trả về `not_in_source` và nhắc quay lại bài học.
  3. Bo gài bẫy (*"Dữ liệu chưa có nhãn vẫn học có giám sát được mà"*): Trí dùng `tool_check_source_grounding` để bác bẫy dựa trên nguồn bài giảng.
  4. Test backend kiểm tra rằng câu trả lời cho môn khác không chứa danh sách từ khóa Toán bị cấm (`vecto`, `vector`, `hình lập phương`, `đường chéo`, ...).

---

## 3. Bảng Tổng Hợp Thông Số Demo

| Trạm | Phân hệ | Thời lượng | Trạng thái UI | Sự kiện tự động chính |
| :--- | :--- | :--- | :--- | :--- |
| **Trạm 1** | Lớp học tương tác | 7s (chờ phản biện tối đa thêm 8s) | `activeStudioView=classroom`, `currentMode=video_clash` | Nhảy tới 37:13, chọn `opt_b`, gửi phản biện sau khi trả lời xong, Cô Lam chốt |
| **Trạm 2** | War Room | 6s | `activeStudioView=warroom` | Phát lại fixture qua `ReplaySource` |
| **Trạm 3** | Timeline Editor | 5s | `activeStudioView=editor` | Thước 5 phút, thẻ Bento, cảnh báo va chạm nhịp |
| **Trạm 4** | Inspector | 5s | `activeStudioView=classroom`, Inspector mở | 4 khối của lượt mới nhất; trường chưa đo được gắn nhãn |
| **Kết thúc** | Hoàn tất | 3,5s | Không đổi | Thông báo hoàn tất trên Mini-HUD rồi trở về trạng thái thường |

---

## 4. Đã trình diễn và tích hợp tương lai

| Hạng mục | Trạng thái trên nhánh này |
| :--- | :--- |
| Tour UI 4 trạm bằng F2 / `?showcase=1` | Đã trình diễn (fixture replay) |
| Kênh SSE `/api/roundtable/stream` | Có route; hiện phát lại file fixture, chưa phải suy luận trực tiếp |
| Ingestion video trực tiếp (STT/vision) và bàn tròn chạy LLM | Tích hợp tương lai; không có trong chu trình F2 |
| Đồng bộ phiên lớp học (`sessionId`) giữa các lượt chat | Có trong mã nguồn; chưa có kiểm thử trình duyệt |
| Đo tiến bộ Bloom / độ do dự của người học | Mục tiêu; Inspector hiện "Chưa đo" khi không có số đo |
| Giảm sai sót toán học nhờ kiểm chứng bằng công cụ | Mục tiêu thiết kế; chưa có số liệu |
| Kiểm thử E2E trên trình duyệt, kiểm toán WCAG, diễn tập của nhóm, video dự phòng | Chưa thực hiện |
