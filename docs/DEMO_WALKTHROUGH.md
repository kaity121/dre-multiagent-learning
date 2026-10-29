# Hướng Dẫn Trình Diễn 1-Click Và Kịch Bản 4 Trạm (Showcase Walkthrough)

Tài liệu này cung cấp quy trình vận hành bộ điều khiển Showcase tự động 1-Click (Issue #17) và kịch bản thuyết trình chi tiết qua 4 Trạm trong hệ thống DRE Multi-Agent Interactive Learning.

---

## 1. Hướng Dẫn Vận Hành 1-Click

Hệ thống hỗ trợ các phương thức kích hoạt và điều khiển linh hoạt dành cho người demo, giảng viên và chuyên gia đánh giá:

### 1.1. Các phương thức kích hoạt
- **Phím tắt toàn cục F2**: Nhấn phím `F2` ở bất kỳ màn hình nào để lập tức khởi chạy chu trình trình diễn 4 Trạm tự động. Nhấn lại `F2` để dừng demo và trở về trạng thái ban đầu.
- **Nút bấm trên thanh Header**: Nhấn nút **Demo 1-Click (F2)** có biểu tượng tia sét ở góc phải thanh tiêu đề. Nút có màu xanh chanh (#C8F169), chữ đen (#121712) và chuyển sang trạng thái hoạt động khi đang demo.
- **Tham số URL tự động**: Truy cập trực tiếp địa chỉ `http://localhost:3000/?showcase=1` để trình duyệt tự động khởi chạy kịch bản ngay sau khi tải trang.

### 1.2. Các phím điều hướng trong quá trình trình diễn
- **Phím Space (Khoảng trắng)**: Tạm dừng (Pause) hoặc Tiếp tục (Resume) dòng thời gian của Trạm hiện tại. Bộ đếm ngược và thanh tiến trình sẽ đóng băng tạm thời.
- **Phím Escape (Esc)**: Thoát ngay lập tức khỏi chế độ Showcase, đóng thanh Mini-HUD và đưa hệ thống về trạng thái tiêu chuẩn.
- **Nút "Trạm kế tiếp" trên Mini-HUD**: Bỏ qua phần thời gian còn lại của trạm hiện tại và nhảy ngay sang trạm kế tiếp.

---

## 2. Kịch Bản Thuyết Trình 4 Trạm (Timing & Pitching Script)

Tổng thời lượng demo: **23 giây**. Kịch bản được chia thành 4 giai đoạn nối tiếp với lời thoại thuyết minh (Pitching Script) dành cho người trình bày.

```
00:00 ─── Trạm 1: Lớp học tương tác & Phản biện ─────── 00:07
00:07 ─── Trạm 2: Multi-Agent War Room ──────────────── 00:13
00:13 ─── Trạm 3: Multi-Track Timeline Editor ───────── 00:18
00:18 ─── Trạm 4: Đánh giá nhận thức Tháp Bloom ─────── 00:23 (Hoàn tất)
```

---

### Trạm 1: Lớp học tương tác & Phản biện bẫy nhận thức (00:00 - 00:07)

- **Thời lượng**: 7 giây.
- **Hành động hệ thống**:
  1. Giao diện đưa về chế độ Lớp học (`activeStudioView = 'classroom'`, `station = 1`).
  2. Video nhảy đến điểm dừng 37:13 (Ví dụ 3 hình lập phương của Thầy Tiến). Hộp thoại câu hỏi trắc nghiệm KaTeX xuất hiện trên khung hình.
  3. Tại giây thứ 2.2: Hệ thống tự động chọn Phương án B (`1 + 1 = 2 (Tách trực tiếp)`), kích hoạt bẫy ngộ nhận về độ dài vectơ.
  4. Tại giây thứ 4.4: Bo phát biểu lập luận sai. Học sinh gửi phản biện hình học nối tiếp vectơ DD' = CC'. Bo thừa nhận sai sót và Cô Lam chốt quy tắc vàng trên nền bảng phấn mô phỏng.
- **Lời thuyết minh dành cho người demo**:
  > "Kính thưa ban giám khảo, đây là Trạm 1: Lớp học tương tác DRE. Tại giây thứ 37:13 trong bài giảng Thầy Tiến, học sinh gặp phải ngộ nhận điển hình: tách độ dài tổng thành tổng hai độ dài. Thay vì chỉ chấm điểm đúng sai đơn thuần, DRE kích hoạt người bạn học Bo để tranh luận trực tiếp. Học sinh phải dùng lập luận hình học nối tiếp để bẻ gãy bẫy ngộ nhận, sau đó Cô Lam sẽ chuẩn hóa kiến thức bằng quy tắc vàng sư phạm."

---

### Trạm 2: Multi-Agent War Room suy luận thời gian thực (00:07 - 00:13)

- **Thời lượng**: 6 giây.
- **Hành động hệ thống**:
  1. Giao diện tự động chuyển sang màn hình Phòng điều hành suy luận (`activeStudioView = 'warroom'`).
  2. Badge tín hiệu trực tiếp nhấp nháy: `TRỰC TIẾP (LIVE SSE)` kết nối với backend qua Server-Sent Events.
  3. 4 pha suy luận (Trích xuất đề bài, Truy hồi kiến thức, Bàn tròn phản biện, Đánh giá nhận thức) chuyển trạng thái sang hoàn thành.
  4. Luồng sự kiện suy luận (thought stream) cuộn thời gian thực, hiển thị các lời gọi công cụ xác thực đại số vectơ (`tool_verify_vector_algebra`) và tra cứu tri thức RAG (`tool_query_misconception_kb`).
- **Lời thuyết minh dành cho người demo**:
  > "Trạm 2 hé lộ hậu trường trí tuệ nhân tạo: Bàn tròn suy luận War Room. Trước khi đưa nội dung đến học sinh, hội đồng AI gồm Trí, Bo, An và Cô Lam phải tự phản biện chéo nhau qua 4 pha nghiêm ngặt. Luồng dữ liệu SSE trực tiếp cho thấy Trí đào sâu bản chất hình học, Bo thử nghiệm các phương án gây nhầm lẫn, và bộ kiểm toán tất định đảm bảo tuyệt đối không có ảo giác toán học."

---

### Trạm 3: Multi-Track Timeline Editor biên tập kịch bản bài học (00:13 - 00:18)

- **Thời lượng**: 5 giây.
- **Hành động hệ thống**:
  1. Giao diện chuyển sang chế độ biên tập giáo án (`activeStudioView = 'editor'`).
  2. Hiển thị dòng thời gian đa luồng của bài giảng 58:00 với thước đo nhịp sư phạm 5 phút (5m ruler).
  3. Hộp thẻ Bento thống kê: 3 điểm dừng tương tác, 4 bẫy ngộ nhận được đánh dấu, mục tiêu Tháp Bloom L4 (Phân tích).
  4. Thẻ xem trước bối cảnh video mô phỏng bảng phấn 16:9 tích hợp công thức KaTeX và cơ chế cảnh báo va chạm thời gian (< 20s).
- **Lời thuyết minh dành cho người demo**:
  > "Tại Trạm 3, giáo viên hoàn toàn làm chủ nội dung qua Timeline Editor. Mọi điểm dừng và kịch bản tranh biện của AI được sắp xếp trực quan trên dòng thời gian đa luồng. Hệ thống tích hợp sẵn công cụ kiểm tra nhịp sư phạm giúp ngăn ngừa việc ngắt lời bài giảng quá dày đặc, cho phép giáo viên phê duyệt và chuyển giáo án vào lớp học chỉ với một cú nhấp chuột."

---

### Trạm 4: Đánh giá nhận thức Tháp Bloom & Soi não tác nhân (00:18 - 00:23)

- **Thời lượng**: 5 giây.
- **Hành động hệ thống**:
  1. Giao diện quay trở lại Lớp học và tự động mở ngăn kéo Thanh tra lượt thoại (`InspectorDrawer`).
  2. Trực quan hóa 4 khối phân tích chuyên sâu:
     - **Khối 1 (Điều phối)**: Ý định phản biện sắc bén, Bo được chọn, độ tin cậy 0.91.
     - **Khối 2 (Ngữ cảnh cách ly)**: Nội dung bảng phấn, lời thoại gần nhất và phần tri thức cách ly có ổ khóa (Ẩn với Bo).
     - **Khối 3 (Suy nghĩ ngầm)**: Luồng suy nghĩ ngầm của Bo trước khi nhận thua và câu thoại thực tế.
     - **Khối 4 (Chấm ngầm Tháp Bloom)**: Sự tiến triển từ mức Nhớ (L1) lên Đánh giá (L5), thanh đo lường độ do dự (hesitation score) 12%.
  3. Khi hết thời gian, Mini-HUD hiển thị thông báo: `SHOWCASE HOÀN TẤT - Đã chạy qua toàn bộ 4 trạm liên hoàn`.
- **Lời thuyết minh dành cho người demo**:
  > "Trạm 4 là trái tim đánh giá của DRE: Thanh tra lượt thoại Inspector. Hệ thống liên tục chấm ngầm sự tiến triển nhận thức của người học từ mức Nhớ lên mức Phản biện và Đánh giá theo Tháp Bloom. Đồng thời, giáo viên có thể soi thấu suy nghĩ ngầm bên trong của AI và kiểm tra tính cách ly thông tin, bảo đảm an toàn sư phạm tuyệt đối."

---

## 3. Bảng Tổng Hợp Thông Số Kỹ Thuật Demo

| Trạm | Tên phân hệ | Thời lượng | View Router | Sự kiện tự động chính |
| :--- | :--- | :--- | :--- | :--- |
| **Trạm 1** | Lớp học tương tác | 7s | `view=classroom&station=1` | Nhảy 37:13, chọn Phương án B, phản biện sticker, chốt Cô Lam |
| **Trạm 2** | War Room suy luận | 6s | `view=warroom` | Kích hoạt Live SSE, 4 pha biên kịch, 6 tác tử tham gia |
| **Trạm 3** | Timeline Editor | 5s | `view=editor` | Hiển thị 5m ruler, Bento metrics, Blackboard preview, phê duyệt |
| **Trạm 4** | Đánh giá Tháp Bloom | 5s | `view=classroom&inspector=1` | Mở Inspector Drawer, 4 khối nhận thức, tiến trình Bloom L1->L5 |
| **Kết thúc** | Hoàn tất Showcase | 3.5s | Không đổi | Hiện thông báo hoàn tất trên Mini-HUD, tự động trả về tiêu chuẩn |
