# DRE: hướng dẫn demo từng bước và ghi chú thuyết trình kỹ thuật

Bản tổng hợp các tính năng làm trong phiên 30–31/10/2026, branch `feat/story-spine-layout` (chưa push, chưa merge).

Câu chuyện của demo: học sinh **Chẩn đoán** chỗ sai (Diagnose), **Sửa** lỗi của bạn AI (Repair), rồi **Giải thích** lại (Explain). Mọi câu nói của AI đều mở ra xem được: ai trả lời, đã thấy những gì, đã kiểm chứng bằng công cụ nào.

---

## Chuẩn bị trước khi demo

1. Chạy backend:
   ```bash
   cd backend
   node server.js
   ```
   Backend chạy ở cổng `3001`. File `backend/.env` cần có khóa OpenAI và dòng `CHAT_REASONING_EFFORT=low` để trả lời nhanh hơn.
2. Chạy frontend:
   ```bash
   npx vite --port=3000
   ```
   Rồi mở http://localhost:3000.
3. Dùng cửa sổ ẩn danh hoặc xóa dữ liệu trang để bắt đầu một phiên sạch. App lưu tiến độ trong trình duyệt.
4. Màn hình nên đặt 1440×900 trở lên.

---

## Kịch bản demo từng bước

### Bước 1. Vào lớp: một câu chuyện, một tuyến hành trình

- Cột trái là **tuyến hành trình 7 ga**: Xem bài → Bo sai ở 37:13 → Chẩn đoán → Bác Bo → Cô Lam chốt → Luyện tập (Trạm 2, Trạm 3) → Dạy lại Bo.
- **Nút tròn số trạm** trên thanh trên cùng mở dropdown 4 trạm.
- Dưới video có thẻ **"Việc của bạn bây giờ"**, nói việc cần làm tiếp theo trong một câu.
- Ý cần nói: người học không lạc, lúc nào cũng biết mình đang ở đâu và phải làm gì.

### Bước 2. Hỏi lớp và trả lời trong thread

1. Gõ "xin chào cả lớp" vào ô **Nhắn cho cả lớp…**.
   - Tin của bạn nằm bên phải, viền lime.
   - Bộ điều phối chọn đúng **một** bạn AI trả lời.
2. Rê chuột vào câu trả lời, bấm **Trả lời**. Thread mở ra ngay dưới tin gốc.
3. Gõ "cảm ơn nhé" rồi gửi.
   - Bạn AI trả lời nối tiếp chính câu chuyện trước đó.
   - Câu cảm ơn **không** gắn chip "có nguồn", vì câu xã giao không dựa vào bài giảng.
4. Thu gọn thread: còn dòng "2 phản hồi ⌄" kèm avatar xếp chồng.
5. Hỏi một câu về bài, ví dụ "vectơ AB có bằng vectơ BA không".
   - Câu trả lời có chip **"Có nguồn bài giảng"**.
   - Bảng phấn trích đúng "vectơ AB ≠ vectơ BA".

### Bước 3. Dừng ở 37:13: chẩn đoán

1. Bấm **Tới điểm dừng 37:13**.
   - Video dừng đúng 37:13, không chạy ngầm.
   - Cột trái chuyển sang ga **Chẩn đoán**.
2. Trong chat:
   - Bo đưa cách tính tắt 1 + 1 = 2.
   - Trí tỏ ra nghi ngờ nhưng không lộ đáp án.
   - Cô Lam gợi một câu ngắn.
3. Thẻ việc hiện 3 cách tính. Chọn một cách rồi bấm **Xác nhận đáp án**. Thẻ hiện trạng thái đang chấm trong lúc chờ.

### Bước 4. Bác Bo: bàn đối chất 3 ô

- Video thu thành dải mỏng. Thẻ việc mở thành 3 ô: **Bo nói · Lượt của bạn · Cô Lam chốt**.
- **Chọn sai** thì Bo hùa theo bạn. **Chọn đúng** thì Bo gài bẫy bằng một cách tính tắt hoặc một trường hợp biên. Cả hai đi đúng FSM 8 bước trong slide.
- Gợi ý mở theo thứ tự, chỉ nhắc hướng chứ không cho đáp án.
- Viết phản biện rồi bấm **Gửi phản biện**. Backend chấm ngầm thành *sắc bén* hoặc *chưa rõ*.
- Bấm **Hiện video**: video hiện lại đúng khung hình 37:13, không còn màn đen.

### Bước 5. Cô Lam chốt và đi tiếp

- Bo nhận sai. Cô Lam chốt quy tắc vàng: |a + b| ≤ |a| + |b|, dấu bằng chỉ khi hai vectơ cùng hướng.
- Ga **Cô Lam chốt** có dấu ✓. Bấm **Sang Trạm 2 · Sổ tay**.

### Bước 6. Luyện tập: tiến độ trung thực

- Ở Trạm 2, cột trái sáng ga **Luyện tập**, chấm "Trạm 2" ở trạng thái đang làm. Ga "Dạy lại Bo" vẫn chưa mở.
- **Tháp Bloom** ở trang tổng kết chỉ tính các bậc đã thật sự đạt ("Đạt N/6 bậc"):

| Bậc | Đạt được khi |
|---|---|
| 1–2 | Bắt đầu xem video |
| 3 | Trả lời câu hỏi 37:13 |
| 4 | Xong Trạm 2 |
| 5 | Bác được Bo |
| 6 | Xong đề tự ra ở Trạm 4 |

- Bậc chưa đạt để mờ, có dòng "Mở khi xong Trạm 2" hoặc tương tự.

### Bước 7. Agent Map: minh bạch AI

1. Bấm chip bằng chứng dưới một câu trả lời, hoặc nút **Agent Map** trên thanh trên cùng.
2. Agent Map chia mỗi lượt thành 4 làn: **Hiểu câu hỏi → Lấy ngữ cảnh → Kiểm chứng → Trả lời**.
3. Bấm một block để xem đầu vào và đầu ra.
4. Mục **Ngữ cảnh đã dùng** liệt kê:
   - Tin bạn đang trả lời.
   - Số tin trong lịch sử chat được gửi kèm.
   - Các nguồn bài giảng.
   - Phần bị ẩn với tác nhân, để tác nhân không thấy lời giải.

### Bước 8. War Room cho giáo viên *(đang hoàn thiện)*

- Thẻ **Nguồn bài học**:
  - Upload video thật, hoặc chọn một clip đã có.
  - Bấm **Phân tích**, tiến trình chạy theo các bước thật: chép lời → đọc bảng phấn → tra kho tri thức → bàn tròn.
- **Dòng suy luận**:
  - Mỗi tác nhân một làn màu.
  - Bước "đang nghĩ" thu gọn thành một dòng khi xong.
  - Mỗi lần gọi công cụ là một thẻ gồm tên, đầu vào, kết quả và thời gian.
- **Chấm quyết định** bằng OpenAI Decisions API, cho từng đoạn video:
  - Mức rủi ro bẫy.
  - Ngộ nhận khớp trong kho tri thức.
  - Bậc Bloom.
  - Có nên đặt điểm dừng không.

---

## Ghi chú thuyết trình kỹ thuật

### Kiến trúc tổng
- Frontend: React 19, TypeScript, Vite 8, Tailwind 4.
- Backend: Express ở cổng 3001, gọi OpenAI (`gpt-6-sol`).
- Mọi phản hồi đều chạy được ở hai chế độ: backend thật, và dữ liệu dự phòng khi backend lỗi hoặc quá giờ. Giao diện không gắn nhãn "mock".
- Hai lớp giao diện:
  - Lớp học sạch cho người học.
  - Lớp minh bạch để xem log tác tử: Agent Map, bảng soi chi tiết (Alt+I), War Room.

### Luồng đa tác tử
- **Bộ điều phối ý định**, chạy 2 tầng:
  - Tầng 1 bắt bằng luật: @mention và mẫu câu quen.
  - Tầng 2 nhờ LLM phân loại.
  - Mỗi câu hỏi chọn đúng **một** tác nhân: Trí (bản chất, kiểm chứng), Linh Chi (mẹo nhớ), Minh Khang (ví dụ đời sống, trò chuyện), Trợ giảng An (gợi ý theo bậc), Cô Lam (chốt).
- **FSM 8 bước** cho điểm dừng 37:13, gồm các API `session/start`, `answer`, `rebuttal`:
  - Bo có các mode `misconception_ally`, `shortcut_fallacy`, `edge_case_skeptic`.
  - Phản biện được chấm `sac_ben` hoặc `chua_ro`.
- **Cô lập ngữ cảnh theo vai**: Bo không bao giờ nhận được lời giải chuẩn; Trí thấy định lý; An thấy các bậc gợi ý.
- **Công cụ tất định** thay cho việc tin lời LLM:
  - `tool_verify_vector_algebra`: tính |BC + DD'| trên tọa độ hình lập phương.
  - `tool_check_source_grounding`: đối chiếu câu nói với bài giảng.
  - `tool_query_misconception_kb`: tra kho tri thức ngộ nhận.

### Ngữ cảnh hội thoại và trích nguồn (làm trong phiên này)
- Mỗi câu chat gửi kèm `replyTo` (tin đang trả lời) và `chatHistory` (6 tin gần nhất).
- `buildConversationContext` gói hai thứ này thành trường `boi_canh_hoi_thoai` trong payload của cả 5 tác nhân.
- Câu xã giao chỉ được coi là xã giao khi thỏa đồng thời: ý định là trò chuyện, không khớp kho tri thức, và công cụ đối chiếu nguồn trả `not_in_source`. Khi đó không trích nguồn, không hiện bước đối chiếu. Một câu sai về nội dung bài vẫn được giữ nguồn.
- Trích bảng phấn ưu tiên dòng có vectơ (`pickBoardLatex`). Tác nhân thì nhận toàn bộ bảng.
- Nhãn mốc ghi "đoạn từ 01:18" khi học sinh hỏi giữa một đoạn bài giảng.
- Có 7 test backend mới cho các hành vi trên. Tổng backend pass 202/202.

### Thread trong chat
- Kiểu `TimelineComment` có thêm trường `threadRootId`.
- Tin trả lời nằm dưới tin gốc. Nếu tin gốc đang không hiển thị (ví dụ sau khi tua lùi), tin trả lời rơi về luồng chính để không bị mất.
- Mỗi thread có trạng thái mở/đóng, bản nháp và đích trả lời riêng. Hiệu ứng "đang gõ" hiện ngay trong thread.

### Video
- YouTube IFrame API. Trình phát luôn được giữ mount để không mất trạng thái.
- Sửa hai lỗi:
  - Trước đây code dừng rồi mới tua. Với trình phát chưa phát lần nào, lệnh tua lại tự bật phát, nên video chạy ngầm sau bàn đối chất. Giờ code tua trước rồi mới dừng.
  - Khi video mở lại sau lúc bị thu cao về 0, app tua lại đúng giây hiện tại để khung hình được vẽ lại, không còn màn đen.

### Tiến độ trung thực
- `journeyModel` ánh xạ trạm sang ga trên cột trái:
  - Video theo FSM.
  - Trạm 2 và Trạm 3 vào ga "Luyện tập".
  - Trạm 4 vào ga "Dạy lại Bo".
- `bloomProgress` tính bậc Bloom từ sự kiện thật. Thẻ tổng kết cũng không còn ghi cứng "6/6".
- Có test cho các ánh xạ (20 test frontend pass).

### Hiệu năng
- `CHAT_REASONING_EFFORT=low` làm thời gian trả lời đáp án giảm từ 10,4 xuống 5,6 giây.
- Phiên checkpoint được khởi tạo chạy nền từ sớm.
- Timeout: 20 giây cho session, 12 giây cho trả lời và phản biện. Quá giờ thì chuyển sang dữ liệu dự phòng mà không báo lỗi.

### OpenAI Decisions API *(đang tích hợp)*
- Endpoint riêng `POST /v1/decisions`, model `gpt-6-luna`.
- Mỗi request gửi tối đa 400 câu hỏi, loại `score` (chấm theo mức) hoặc `choice` (chọn phương án). Mỗi câu trả về điểm, phân phối xác suất và độ tin cậy.
- Trong DRE, mỗi đoạn video sau khi tách được chấm 4 câu: mức rủi ro bẫy, ngộ nhận khớp, bậc Bloom, có nên đặt điểm dừng.
- Câu bị từ chối giữ trạng thái "chưa rõ". Lỗi truy cập thì hiện "chưa chấm được", không bịa điểm.
- Lý do dùng Decisions: điểm có cấu trúc, kiểm tra được, và tài liệu nói nhanh hơn Responses khoảng 10 lần (chưa đo tại dự án).

### Kiểm thử và chất lượng
- `tsc` sạch, build OK.
- Backend pass 202/202 test. Frontend pass 20 test cho model hành trình và Agent Map.
- Mỗi thay đổi giao diện đều được kiểm bằng Chrome headless qua CDP: chụp màn hình và chạy đúng luồng bấm của người học.
- Bộ dò thiết kế impeccable: 0 lỗi chặn. Hệ thiết kế ghi trong `DESIGN.md` (Lime Soft) và `PRODUCT.md`.

---

## Còn mở
- War Room (upload, dòng suy luận mới), AI trả lời nhau trong thread, và avatar kiểu Zoom vẫn đang làm.
- Thẻ tổng kết còn ghi cứng "3 huy hiệu" và lời chốt cuối buổi.
- Tiến độ Trạm 3 và Trạm 4 mất khi tải lại trang.
- Backend chưa deploy. Bản trên Vercel mới chỉ có frontend.
