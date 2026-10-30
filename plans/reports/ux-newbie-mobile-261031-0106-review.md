# Đánh giá UX cho người học mới (điện thoại và máy tính)

- Ngày: 2026-10-31 (giờ Asia/Bangkok)
- Phạm vi: frontend `http://localhost:3000` (Vite dev), backend `http://localhost:3001` chạy thật, trình duyệt Chrome headless qua CDP
- Vai trò thử nghiệm: học sinh lớp 12, không rành công nghệ, chủ yếu dùng điện thoại
- Không sửa file mã nguồn nào. Mã nguồn chỉ được đọc để xác định vị trí.
- Ảnh bằng chứng: danh sách ở mục cuối (E01–E28), đều nằm trong thư mục scratchpad `ux-mobile/shots/`.

---

## 1. Top 10 ưu tiên

| # | ID | Mức | Vấn đề ngắn gọn |
|---|----|-----|-----------------|
| 1 | S4-01 | Blocker | Khi backend không kết nối được, chat tự trả lời bằng câu mẫu gán cho bạn học AI (Minh Khang, Trí...), không có thông báo nào. Học sinh tưởng AI đã trả lời thật. |
| 2 | S2-01 | Blocker | Trên điện thoại, thanh đầu trang bị tràn: nút F2 đè lên logo, các nút Đổi bài / Tạm dừng / Soi não / công cụ giáo viên nằm ngoài màn hình trong một dải cuộn ẩn, không có dấu hiệu. |
| 3 | S1-01 | High | Người dùng mới không bao giờ thấy màn hình chào mừng (onboarding) hay sảnh chờ (nhập tên, chọn trình độ). Chúng chỉ mở khi có `?onboarding=1` hoặc `?lobby=1`. Vào thẳng giữa bài học, không biết bắt đầu từ đâu. |
| 4 | S2-03 | High | Trên điện thoại, ô chat nằm cách đầu trang khoảng 1.600px, sau video, mốc thời gian và ghi chú. Học sinh phải cuộn rất lâu mới gõ được câu hỏi. |
| 5 | S2-02 | High | Trang bị tràn ngang: nội dung rộng khoảng 848px trên màn hình 390px, trang lướt ngang được. Gây cảm giác vỡ giao diện. |
| 6 | S2-04 | High | Câu hỏi dừng 37:13 trên điện thoại: khi cuộn tới thẻ câu hỏi, phần đề bài và đáp án A bị đẩy lên khuất, học sinh phải tự cuộn ngược lại trong khung video. |
| 7 | S4-03 | High | Khi phản hồi bị treo, dòng "Trí đang suy luận & soạn tin..." chạy mãi. Không có thời gian chờ, không có nút hủy, không có thông báo lỗi. |
| 8 | S5-01 | High | Hộp thoại onboarding không khóa tiêu điểm: Tab nhảy ra các nút phía sau lớp phủ. Nhấn Esc không đóng được. |
| 9 | S3-02 | High | Hai nút cùng nhãn "Tạm dừng" nhưng khác nghĩa: nút trên thanh đầu mở hộp "Gấp sổ nghỉ tay" (kèm liên kết "Xoá bản lưu & bắt đầu lại từ đầu"), nút trên thanh demo chỉ tạm dừng tour. |
| 10 | S2-07 | High | Chữ mang thuật ngữ nội bộ trước mặt học sinh lớp 12: "HỘI ĐỒNG THẨM ĐỊNH", "HIỆU ỨNG PROTÉGÉ", "B6", "Bậc 5 (Đánh giá & Phản biện)", "POE", "Soi não", "Dispatcher", "RAG", "Assessor", "Suy nghĩ ngầm". |

---

## 2. Phạm vi, môi trường và giới hạn đo

- Máy tính: 1366x800, Chrome headless mới, profile trống cho từng kịch bản.
- Điện thoại: 390x844, DPR 2, cảm ứng bật. Lưu ý: khi chạy `mobile: true`, emulation làm layout viewport phóng to (innerWidth 849, innerHeight 1836) và chặn cuộn dọc bằng bánh xe và chạm. Vì vậy các phép đo cuộn và vị trí trên điện thoại chạy lại với `mobile: false` ở 390px. Kích thước nút và văn bản vẫn đo ở 390px.
- Mọi phát hiện đều dựa trên DOM, số đo hình học và ảnh chụp. Chưa kiểm tra trên thiết bị thật.
- Chi phí LLM: đã gửi 1 tin nhắn thật trong chat (điện thoại) và chạy 3 lần showcase. Showcase gọi `/api/runtime/dispatch`, và mã backend (`backend/src/agents/*.js`) gọi OpenAI. Ước tính tổng khoảng 5–8 lời gọi LLM. Không đếm chính xác.

---

## 3. Kịch bản 1 — Lần đầu vào, máy tính 1366x800

### S1-01 · High · Onboarding và sảnh chờ không bao giờ hiện với người dùng mới
- Vị trí: `src/App.tsx:413-420` (onboarding chỉ mở khi `?onboarding=1`), `src/App.tsx:480-490` (`isLoggedIn` mặc định `true`, sảnh chờ chỉ khi `?lobby=1`).
- Tái hiện: xoá localStorage, mở `http://localhost:3000/`. Vào thẳng bài học, không có modal nào. Xoá storage rồi tải lại vẫn không có sảnh chờ, không có ô tên.
- Hậu quả: không có lời giới thiệu sản phẩm, không có bước đầu tiên, không chọn được trình độ. Hệ thống cũng không biết tên học sinh.
- Bằng chứng: E01, E06.
- Đề xuất: hiện onboarding ở lần đầu (cờ `dre_onboarded` trong localStorage, có try/catch). Sảnh chờ hiện khi chưa có `dre_learner_profile`, tên có thể bỏ qua. Thêm một dòng "Bắt đầu: 1) Xem video 2) Trả lời câu hỏi 37:13 3) Hỏi bạn học".

### S1-02 · High · Màn hình chính không chỉ đường
- Vị trí: màn hình chính, `src/App.tsx:1805` (thanh đầu), dải trạm.
- Trải nghiệm: vào là thấy 8 nút đầu trang, 4 trạm, video, mốc thời gian, chat. Không biết nên xem video trước, bấm trạm nào, hay hỏi ai.
- Bằng chứng: E01.
- Đề xuất: lần đầu hiện một thẻ ngắn "Bạn đang ở Trạm 1 · Video" với 2–3 bước. Ghi chú trạm 1–4 bằng một câu tiếng Việt đơn giản.

### S1-03 · Medium · Thanh đầu có 8 nút với nhãn khó hiểu
- Vị trí: `src/App.tsx:1565` (Demo 1-Click F2), nút "Âm thanh", "Sổ tay & Hỏi riêng 4 bạn", nút "Đã học" (App.tsx:1645), "Đổi bài", "Tạm dừng", "Soi não / Alt + I", nút biểu tượng 32x32 "Công cụ giáo viên & kỹ thuật nội bộ".
- Trải nghiệm: "Đã học" là trình độ người học, không phải trạng thái bài học. "Soi não" không nói gì về chức năng. Nút công cụ giáo viên lộ thuật ngữ "kỹ thuật nội bộ" cho học sinh.
- Bằng chứng: E01, E02.
- Đề xuất: giữ 3 nút chính (Đổi bài, Tạm dừng, Âm thanh). Đưa Demo, Soi não, công cụ giáo viên vào menu "Thêm". Đổi "Đã học" thành "Trình độ: Đã học" với nhãn rõ.

### S1-04 · Medium · Chọn trình độ ở ba nơi, copy khác nhau
- Vị trí: onboarding (`src/components/OnboardingModal.tsx`, "Mới học lần đầu / Đã học rồi / Đang ôn luyện", "Đã học rồi" được chọn sẵn), sảnh chờ (`src/components/PreClassLobbyModal.tsx:100`, mô tả dài, có "mức Sáng tạo"), nút "Đã học" trên thanh đầu.
- Trải nghiệm: học sinh không biết chọn ở đâu thì có hiệu lực. Mô tả trong sảnh chờ là thuật ngữ sư phạm.
- Bằng chứng: E02, E03.
- Đề xuất: một nơi duy nhất chọn trình độ, mô tả bằng tiếng thường ("Mình chưa học bài này", "Mình học rồi, muốn ôn lại").

### S1-05 · Medium · Sảnh chờ gọi tên trợ giảng không khớp
- Vị trí: `src/components/PreClassLobbyModal.tsx:80` ("Trợ giảng An · Trợ giảng AI"), cùng thẻ có ảnh "Cô Lam". Bước 2 hiện chữ "B" to thay cho ảnh (`PreClassLobbyModal.tsx` khối bên trái).
- Trải nghiệm: một thẻ có hai tên khác nhau (An và Cô Lam). Chữ "B" trông như lỗi ảnh.
- Bằng chứng: E03, E04.
- Đề xuất: thống nhất tên người hướng dẫn. Thay chữ "B" bằng ảnh đại diện hoặc bỏ khối đó.

### S1-06 · Medium · Nút "Vào lớp học ngay" bị vô hiệu không có lý do
- Vị trí: `src/components/PreClassLobbyModal.tsx:259`.
- Trải nghiệm: chưa nhập tên thì nút xám, không có dòng gợi ý "Nhập tên để vào lớp".
- Bằng chứng: E05.
- Đề xuất: hiện chữ gợi ý dưới ô tên hoặc đổi nhãn thành "Nhập tên để tiếp tục".

### S1-07 · Low · Nút nhỏ
- "Bỏ qua, dùng mặc định" cao khoảng 16px (`PreClassLobbyModal.tsx:151`). Nút X của onboarding 32x32 (`OnboardingModal.tsx`). Đưa lên tối thiểu 44px vùng chạm.

### S1-08 · Medium · Lưu trữ và tải lại
- Được nhớ trên máy: lớp học, trạm, trình độ, trạng thái trong `dre_saved_session_v1` (`App.tsx:475, 505-553`); độ rộng khung chat (`App.tsx:299-352`); hồ sơ người học chỉ có khi đã qua sảnh chờ (`App.tsx:490, 1507`).
- Xoá localStorage: bài học trở về mặc định `MISC_VECTO_12`, tiến độ và tên mất hẳn, không có thông báo nào cho người dùng. Phiên mới được tạo lại ngay.
- Tải lại: trạm được giữ, nhưng khung "Soi não" đóng lại.
- Đề xuất: khi xoá hoặc khôi phục tiến độ, cho một dòng thông báo. Ghi rõ việc gì được lưu ("Đã lưu vào máy này").
- Bằng chứng: E06.

### Điểm tốt (máy tính)
- Onboarding ngắn, có nút X, có nút "Bắt đầu" nổi bật, có dòng "Không cần tài khoản · Tự động ghi nhớ trên máy". Vấn đề là nó không hiện, không phải nội dung.
- Sảnh chờ có "Bỏ qua, dùng mặc định" ở bước 1.

---

## 4. Kịch bản 2 — Điện thoại 390x844

### S2-01 · Blocker · Thanh đầu trang tràn, nút ẩn trong dải cuộn
- Vị trí: `src/App.tsx:1805` (`pt-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar`), nút F2 (`App.tsx:1565`).
- Đo được: nút F2 x=32–93 đè lên logo x=16–95. Các nút "Đổi bài" x=480–548, "Tạm dừng" x=556–642, "Soi não" x=650–808, công cụ giáo viên x=816–848. Màn hình rộng 390, nên bốn nút này nằm ngoài màn hình.
- Trải nghiệm: học sinh không thấy Tạm dừng, Đổi bài, Soi não. Thanh cuộn bị ẩn, không có mũi tên hay gợi ý. Logo bị đè.
- Bằng chứng: E07, E08, E14.
- Đề xuất: trên điện thoại gom nút phụ vào menu "⋯". Đưa F2 Demo ra khỏi thanh đầu trên điện thoại. Cho logo một khoảng riêng. Nếu vẫn dùng dải cuộn, hiện thanh cuộn hoặc chấm chỉ báo.

### S2-02 · High · Trang tràn ngang
- Đo được: `document.documentElement.scrollWidth` = 848 trên viewport 390. Trang lướt ngang được (scrollX đổi thành 300 khi cuộn ngang trong thử nghiệm). Onboarding và sảnh chờ cũng tràn 848.
- Nguyên nhân: dải đầu trang và các phần tử con không được giới hạn chiều rộng. Vùng cuộn con đã có `overflow-x-auto` nhưng tràn vẫn lan ra trang.
- Bằng chứng: E08, E18.
- Đề xuất: tìm phần tử gây tràn (đã xác định là dải đầu trang) và bọc bằng `min-w-0`. Thêm `overflow-x: clip` cho body sau khi sửa.

### S2-03 · High · Ô chat bị chôn sâu trên điện thoại
- Đo được: ô nhập `Nhắn cho cả lớp...` nằm ở y ≈ 1.619 trong trang cao 1.836. Trước đó là video (~400px), thẻ câu hỏi, tiến trình bài giảng (~400px), ghi chú Cô Lam. Ô chat không cố định, không có nút "Hỏi" nổi ở đầu.
- Trải nghiệm: học sinh mở video, muốn hỏi, phải cuộn hơn một màn hình mới thấy ô chat.
- Bằng chứng: E12, E13.
- Đề xuất: trên điện thoại, ô nhập cố định ở đáy hoặc nút "Hỏi bạn" mở chat dạng sheet. Thu gọn tiến trình bài giảng mặc định.

### S2-04 · High · Câu hỏi dừng bị đẩy khỏi màn hình
- Vị trí: thẻ câu hỏi dừng 37:13 trong khung video (`src/components/VideoPlayerSheet.tsx:1078` là nút "Xác nhận đáp án"; tiêu đề "Điểm dừng tương tác" nằm trong `src/App.tsx` và `VideoPlayerSheet.tsx`).
- Trải nghiệm: sau khi bấm "Câu hỏi dừng", thẻ hiện ra với đề bài và đáp án A ở phía trên, nhưng thanh đầu che mất. Học sinh phải cuộn ngược để đọc đề.
- Ghi chú: DOM đo được cardTop=130 sau khi cuộn đúng vị trí, nhưng ảnh cho thấy đề bài bị khuất. Có thể do thẻ nằm trong khung video cuộn riêng. Cần kiểm tra lại trên thiết bị thật.
- Bằng chứng: E09, E11.
- Đề xuất: khi mở câu hỏi, cuộn sao cho đề bài nằm dưới thanh đầu (`scroll-margin-top`). Giữ đề bài dính đầu thẻ.

### S2-05 · Medium · Vùng chạm nhỏ hơn 44px
- Trạm 36px (cả máy tính và điện thoại). "Đã hiểu" / "Chưa rõ" 24px. "Gợi ý (0/3)" 26px. "Thu gọn" 20px. Chip gợi ý 28px. "Gửi" 30px. "Bỏ qua" ở sảnh chờ 16px. Nút HUD showcase 28px (`src/components/showcase/ShowcaseHUD.tsx:111`). Nút công cụ giáo viên 32x32.
- Đề xuất: tối thiểu 44px, hoặc tăng vùng chạm bằng padding trong suốt.
- Bằng chứng: E07, E10.

### S2-06 · Medium · Chữ quá nhỏ
- 9 phần tử dưới 12px: tên nhân vật (Bo, Trí, Linh Chi, Minh Khang) và mô tả (gật gù, đào sâu...) 11px; "GỢI Ý HỎI:" 11px. Thân trang 14px.
- Đề xuất: tên nhân vật tối thiểu 12px, mô tả tối thiểu 12px.

### S2-07 · High · Thuật ngữ nội bộ trong nội dung học sinh
- Trạm 4 (`src/components/AlternativeFlowsSheet.tsx:391, 499`): "HỘI ĐỒNG THẨM ĐỊNH", "CẤP ĐỘ NHẬN THỨC HIỆN TẠI", "B6", "Bậc 5 (Đánh giá & Phản biện) → Bậc 6 (Sáng tạo đề toán mới)", "NHIỆM VỤ 1 · HIỆU ỨNG PROTÉGÉ", "đúc kết bí kíp".
- Trạm 3: "Trạm 3 · Thử thách dự đoán – Quan sát – Giải thích (POE)".
- Trạm 2: "Lam: Đã cho · Đỏ: Cần tìm · Lá: Đã đúng" (chú thích màu không có ký hiệu thật).
- Đề xuất: viết lại bằng tiếng thường, ví dụ "Giúp Bo: Chọn 1 mẹo dễ nhớ nhất". Bỏ mã bậc (B6). Bỏ các chữ viết tắt không giải nghĩa.
- Bằng chứng: E10.

### S2-08 · Medium · Trả lời chat dài và có nhãn kỹ thuật
- Trả lời của Trí dài khoảng 90 chữ trong một khối (E13). Có nhãn "📐 Đã kiểm chứng hình học: Sai lệch (2 ≠ a\sqrt{2})". Chữ `a\sqrt{2}` là LaTeX thô hiển thị nguyên văn. Nhãn "📐 Bám nguồn: Khớp bài giảng".
- Nguồn nhãn: `src/components/MaicPeerClassroomDock.tsx:170`, `VideoDebateSheet.tsx:723, 847`.
- Đề xuất: render công thức bằng KaTeX hoặc chuyển về "√2". Đổi nhãn kỹ thuật thành một dòng tiếng thường, hoặc ẩn trên điện thoại.
- Bằng chứng: E13.

### S2-09 · Medium · "Giơ tay" điền sẵn tiền tố thô vào ô nhập
- Vị trí: `src/App.tsx:399` (`prefix: [Tại mm:ss] `), `VideoDebateSheet.tsx:333-340`, card "Hỗ trợ tại [0:00]" tại `VideoDebateSheet.tsx:1559`.
- Trải nghiệm: bấm "Giơ tay", ô nhập có sẵn `[Tại 00:00]`. Học sinh phải xoá tiền tố trước khi gõ. Ngoặc vuông và mã thời gian là ngôn ngữ của máy.
- Bằng chứng: E16.
- Đề xuất: hiện tiền tố như một chip "Hỏi về 00:00" nằm ngoài ô nhập. Ô nhập để trống.

### S2-10 · Medium · "Soi não" trên điện thoại mở một bảng dày đặc
- Trải nghiệm: toàn màn hình, các mục "ĐIỀU PHỐI (DISPATCHER)", "BO NHÌN THẤY GÌ (CONTEXT SNAPSHOT)", "Tri thức tra cứu (RAG)", "0,91 (Chưa đo / Mô phỏng)", "Lượt #4 · 37:13", "Replay", "Tua lại". Nút Esc đóng được (đã kiểm chứng).
- Nguồn: `src/components/inspector/InspectorDrawer.tsx:198-206`.
- Đề xuất: ẩn khỏi học sinh mặc định, chỉ hiện trong "Công cụ giáo viên".
- Bằng chứng: E15.

### S2-11 · Medium · Sảnh chờ bước 2 trên điện thoại vượt màn hình
- Trải nghiệm: thẻ cao hơn viewport. Nút chính "Vào lớp học ngay" nằm dưới màn hình, tiêu đề "Bước 2/2" bị cuộn đi. Chữ "B" lớn thay ảnh.
- Đề xuất: cho thân modal cuộn bên trong, còn nút chính dính đáy.
- Bằng chứng: E18.

### Điểm tốt (điện thoại)
- Onboarding vừa màn hình 390px, các nút mức độ 40px (E17).
- Chuyển trạm bằng chạm hoạt động. Đã đo: trạm 4 mở đúng (E10).
- Gửi tin nhắn hoạt động. Trí trả lời trong vài giây (E13).
- Video là iframe YouTube, có autoplay trong thẻ.
- Khi bấm "Giơ tay" card "Hỗ trợ" hiện ra có các nút "Giải thích / Công thức / Lùi 10s" (E16).

### Chưa kiểm thử được trên điện thoại
- Bàn phím ảo che ô nhập: headless không có bàn phím, không xác minh được.
- Thiết bị thật, iOS Safari, Android Chrome.

---

## 5. Kịch bản 3 — Chế độ showcase (`?showcase=1`)

### S3-01 · High · Hết tour thì không có bước tiếp theo, khung soi não còn mở
- Vị trí: `src/components/showcase/ShowcaseHUD.tsx` (thanh dưới), `src/hooks/useShowcaseController.ts`, khung "Soi não" (`RoundtableStreamConsole.tsx:86` nhãn "Suy nghĩ ngầm").
- Trải nghiệm: thanh báo "SHOWCASE HOÀN TẤT · Đã chạy qua toàn bộ 4 trạm" rồi biến mất sau vài giây. Không có nút "Bắt đầu học của bạn". Khung "Soi não" vẫn mở ở bên phải, có "Suy nghĩ ngầm của Assessor", "Câu thoại cuối: “”" trống, "—" ở ô điểm số.
- Bằng chứng: E22.
- Đề xuất: màn hình kết thúc với hai nút "Bắt đầu học" và "Chạy lại demo". Đóng khung soi não khi tour kết thúc. Thay "—" bằng "Chưa có dữ liệu".

### S3-02 · High · Hai nút "Tạm dừng" khác nghĩa
- Nút trên thanh đầu: mở "Gấp sổ nghỉ tay một lát nhé!" (`src/components/PauseModal.tsx:56`), có liên kết "Xoá bản lưu & bắt đầu lại từ đầu" (`PauseModal.tsx:122`). Tour vẫn chạy phía sau.
- Nút trên thanh HUD: tạm dừng tour (đã kiểm chứng: nhãn đổi thành "Tiếp tục", thời gian đứng yên).
- Trải nghiệm: học sinh bấm "Tạm dừng" trên thanh đầu để nghỉ lại thấy liên kết xoá bản lưu ngay bên dưới. Dễ mất tiến độ.
- Bằng chứng: E20 (hộp thoại mở do nhầm nút), E21 (HUD đúng).
- Đề xuất: đổi nút trên thanh đầu thành "Nghỉ" và nút HUD thành "Dừng demo". Đưa liên kết xoá bản lưu ra xa hơn và yêu cầu xác nhận.

### S3-03 · Medium · Thoát và tạm dừng
- Esc thoát tour được (đã kiểm chứng: HUD biến mất). F2 cũng thoát. Space tạm dừng (phím tắt, không có trên điện thoại).
- HUD có tiêu đề "SHOWCASE DEMO · BƯỚC 1/4" bị xuống dòng thành 4 dòng, chữ 11px.
- Chưa kiểm tra HUD trên điện thoại (`min-w-[340px]`, có thể đè nội dung).
- Đề xuất: nhãn chế độ demo ngắn hơn, có một dấu "DEMO" cố định ở góc khi đang chạy tour.

### S3-04 · Medium · Showcase gọi backend thật
- Showcase gọi `/api/session/start`, `/api/runtime/dispatch`, `/api/misconceptions`, `/api/session/.../answer`. Mỗi lần chạy có lời gọi dispatch. Đây là điều học sinh không biết khi bấm F2 hoặc "Demo 1-Click".
- Chưa kiểm tra showcase khi backend tắt.
- Đề xuất: cân nhắc chạy showcase bằng dữ liệu replay cố định, hoặc ghi rõ "Demo này gọi máy chủ". Chi phí thuộc về quyết định sản phẩm, không phải phạm vi UX.

### S3-05 · Low · Lỗi tải iframe YouTube trong showcase
- Console ghi `net::ERR_ABORTED` cho iframe `youtube.com/embed/phvpqxLNTUQ` (một lần, khi tour chạy). Không ảnh hưởng nhìn thấy được.

### Điểm tốt (showcase)
- Nhãn "SHOWCASE DEMO" rõ ràng, có chỉ số bước 1/4 đến 4/4, có thanh tiến độ.
- Tạm dừng và tiếp tục hoạt động đúng trên HUD.

---

## 6. Kịch bản 4 — Lỗi và trường hợp biên

Phương pháp: chặn `http://localhost:3001/*` bằng `Fetch.failRequest` (ConnectionRefused). Không dừng server thật. Một lần kiểm tra treo phản hồi bằng cách giữ request không cho đi tiếp, để tránh gọi LLM.

### S4-01 · Blocker · Chat trả lời bằng câu mẫu, không báo lỗi
- Vị trí: `src/components/VideoDebateSheet.tsx:711` (gọi `sendClassroomChat`), `VideoDebateSheet.tsx:~636-690` (câu mẫu theo từ khoá gán cho Minh Khang, Trí, Linh Chi), `src/services/dreBackendApi.ts:88` (bắt lỗi, chỉ ghi console.warn).
- Tái hiện: tắt backend. Gõ "Thử gửi khi server tắt", bấm Gửi. Sau ~2 giây, Minh Khang trả lời "Đoạn này thầy Tiến đang giới thiệu khái niệm nền tảng: ...". Không có thông báo, không có nhãn "ngoại tuyến".
- Trải nghiệm: học sinh tin rằng AI đã đọc câu hỏi của mình. Câu trả lời không liên quan đến câu hỏi cụ thể.
- Bằng chứng: E24. Console: "sendClassroomChat error, will fall back to local simulation".
- Đề xuất: khi gửi thất bại, hiện thông báo "Không kết nối được máy chủ. Tin nhắn chưa gửi." và giữ nội dung trong ô nhập. Không bao giờ gán câu mẫu cho một bạn học AI. Nếu muốn giữ câu mẫu, phải gắn nhãn rõ "Trả lời mẫu, không từ AI".

### S4-02 · High · Backend tắt khi tải trang không có thông báo
- Trải nghiệm: bài học vẫn hiện từ dữ liệu cục bộ. Các lời gọi `/api/misconceptions` thất bại chỉ ghi console, không có banner hay thử lại. Phần soi não và chẩn đoán trống không báo gì.
- Bằng chứng: E23.
- Đề xuất: một chỉ báo trạng thái "Mất kết nối · Thử lại" ở đầu trang.

### S4-03 · High · Đang "soạn tin" mãi không dừng
- Trải nghiệm: sau khi gửi, dòng "Trí đang suy luận & soạn tin..." chạy liên tục. Đã quan sát khi request bị giữ lại (E26). Không có thời gian chờ, không có nút hủy, không có "Gửi lại".
- Đề xuất: thời gian chờ khoảng 20–25 giây, sau đó thông báo "Chưa nhận được phản hồi. Gửi lại?". Giữ tin nhắn trong ô nhập.

### S4-04 · Medium · Tin nhắn rất dài không có giới hạn
- Đã gửi 1.256 ký tự. Ô nhập không có `maxLength` và không có bộ đếm (`VideoDebateSheet.tsx` không có thuộc tính này). Bong bóng chat hiện một khối chữ dài không ngắt, phần trích dẫn trong câu trả lời cũng dài.
- Bằng chứng: E25.
- Đề xuất: giới hạn khoảng 500 ký tự kèm bộ đếm. Cắt phần trích dẫn bằng dấu "...".

### S4-05 · Low · Gửi khi ô trống không làm gì
- Nút "Gửi" luôn bật. Bấm khi ô trống: không có request, không có thông báo.
- Đề xuất: vô hiệu hóa nút khi ô trống, hoặc đổi thành hint "Nhập câu hỏi trước".

### S4-06 · Medium · Bấm Gửi liên tục (đã kiểm tra, không lỗi nặng)
- Bấm Gửi 4 lần nhanh: không tạo bong bóng trùng lặp. Số lần xuất hiện "Spam test" là 2 (một bong bóng, một trích dẫn trong câu trả lời).
- Chưa có trạng thái "đang gửi" trên nút. Có thể bấm nhiều lần không thấy phản hồi.
- Đề xuất: nút chuyển sang trạng thái đang gửi và khóa tạm.

### S4-07 · Medium · Nút Back của trình duyệt thoát khỏi ứng dụng
- Chuyển trạm 7 lần không thêm mục lịch sử nào. Lịch sử trình duyệt chỉ có 2 mục (about:blank và trang app). Back đưa người dùng ra khỏi app.
- Đề xuất: đồng bộ trạm vào URL (`?station=2`) bằng `history.pushState`, để Back quay lại trạm trước.

### S4-08 · Low · Chuyển trạm nhanh (đã kiểm tra, không lỗi)
- Bảy lần bấm trạm liên tiếp, mỗi lần cách 120ms: kết thúc đúng ở trạm 4, nút được tô đúng.

### S4-09 · Medium · Tải lại giữa chừng
- Trạm 3 được khôi phục. Khung "Soi não" không được khôi phục (đóng lại). Việc khôi phục tin nhắn chat chưa xác minh được: thử nghiệm không tới được ô nhập ở trạm 3.
- Đề xuất: khôi phục trạng thái mở khung, hoặc để người dùng biết khung đã đóng.

---

## 7. Kịch bản 5 — Trợ năng cơ bản và thuật ngữ

### S5-01 · High · Hộp thoại onboarding không khóa tiêu điểm, Esc không đóng
- Vị trí: `src/components/OnboardingModal.tsx:26` (`role="dialog"`). Không có `aria-modal`, không có xử lý Esc, không có chuyển tiêu điểm vào hộp thoại khi mở.
- Đã kiểm chứng: Tab 12 lần, tất cả tiêu điểm nằm ngoài hộp thoại (`inDialog=false`). Nhấn Esc: hộp thoại vẫn mở.
- Đề xuất: đưa tiêu điểm vào nút đầu tiên khi mở, khóa Tab trong hộp thoại, Esc đóng và trả tiêu điểm về nút trước đó.
- Bằng chứng: E28.

### S5-02 · High · Tin nhắn chat không được đọc to
- Trang chính không có `aria-live`, `role="log"`, `role="status"` hay `role="alert"` (đếm được 0). Tin nhắn mới, dòng "đang soạn", kết quả câu hỏi dừng đều không được thông báo.
- Đề xuất: danh sách chat có `role="log" aria-live="polite"`. Dòng "đang soạn" có `role="status"`.

### S5-03 · Medium · Ô chat không có nhãn
- Ô nhập chỉ có placeholder "Nhắn cho cả lớp..." (`src/components/VideoDebateSheet.tsx:1755`). Trình đọc màn hình không biết ô này dùng để làm gì.
- Đề xuất: thêm `aria-label="Nhập câu hỏi cho lớp"`.

### S5-04 · Medium · Không có tiêu đề (heading)
- Trang chính không có `h1`, `h2`, `h3` nào hiển thị (đếm được 0). Tên bài học, tên trạm không là tiêu đề.
- Đề xuất: tên bài là `h1`, tên trạm và các khối lớn là `h2`.

### S5-05 · Low · Tiêu điểm bàn phím
- Nút trên thanh đầu và trạm có viền 2px khi có tiêu điểm (đã kiểm chứng). Điểm tốt.
- Iframe YouTube nhận 7 lần Tab mà không hiện viền tiêu điểm. Đây là hành vi bên trong iframe, nhưng vẫn làm chậm việc điều hướng.
- Bằng chứng: E28.

### S5-06 · Low · Tương phản (kiểm tra tự động, xấp xỉ)
- Thuật toán kiểm tra tương phản WCAG AA (xấp xỉ, đọc màu nền từ tổ tiên) không tìm thấy văn bản nào dưới ngưỡng ở màn hình chính. Chưa đủ để kết luận: nhiều nhãn 11px và chữ xám nhạt cần kiểm tra bằng mắt hoặc công cụ chuyên dụng.

### S5-07 · Medium · Thuật ngữ và tiếng Anh với người mới
- Liệt kê đã thấy trên màn hình: "Inspector"/"Soi não" (nhãn gốc tiếng Anh, nghĩa không rõ), "DISPATCHER", "CONTEXT SNAPSHOT", "RAG", "Replay", "Assessor", "War Room", "fixture" (trong mô tả trạm 2 của showcase: "Phát lại fixture bàn tròn suy luận đa tác tử"), "POE", "Bloom", "Protégé", "Checkpoint" (trong sảnh chờ: "bắt lỗi (Checkpoint)"), "Lượt #19", "Tháp Bloom", "Thanh tra 4 khối nhận thức".
- Đề xuất: dịch sang tiếng Việt thường, hoặc có chú thích một dòng cho mỗi thuật ngữ. "fixture" nên bỏ hoàn toàn khỏi UI.
- Bằng chứng: E15, E22, E10.

### Điểm tốt (trợ năng)
- Mọi nút đều có tên truy cập được (0 nút không tên), mọi ảnh có thuộc tính alt, `lang="vi"`.

---

## 8. Chưa kiểm thử được

- Bàn phím ảo trên điện thoại và việc che ô nhập: không mô phỏng được trong headless.
- Thiết bị thật (iOS Safari, Android Chrome): chỉ dùng emulation.
- Trình đọc màn hình (NVDA, VoiceOver, TalkBack).
- Phản hồi chậm thật 8 giây: cố ý tránh vì request sẽ tới backend và tốn LLM. Thay bằng request bị giữ lại không bao giờ được trả lời.
- Nộp đáp án câu hỏi dừng và phản hồi: chưa bấm, vì có thể kích hoạt đánh giá LLM.
- Hoàn thành sảnh chờ trên điện thoại. Chat trên máy tính (tránh tốn thêm LLM).
- Phát video YouTube thật (iframe có autoplay nhưng phụ thuộc mạng ngoài, chưa xác minh đầu-cuối).
- Khôi phục tin nhắn chat sau khi tải lại: chưa xác minh được.
- Showcase trên điện thoại và showcase khi backend tắt.
- Kiểm tra tương phản bằng công cụ chuyên dụng: chỉ có kiểm tra tự động xấp xỉ.

---

## 9. Bằng chứng (ảnh chụp)

Tất cả nằm trong thư mục: `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/`

| ID | Tên file đầy đủ | Nội dung |
|----|-----------------|----------|
| E01 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s1-01-first-load.png` | Lần đầu vào, máy tính: không có onboarding |
| E02 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s1b-02-onboarding-desktop.png` | Onboarding (`?onboarding=1`), máy tính |
| E03 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s1b-03-lobby-desktop.png` | Sảnh chờ bước 1, máy tính |
| E04 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s1c-04-lobby-step2.png` | Sảnh chờ bước 2, máy tính |
| E05 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s1d-05-lobby-empty-name-submit.png` | Nút vào lớp bị vô hiệu khi chưa nhập tên |
| E06 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s1d-07-after-clear-storage.png` | Sau khi xoá localStorage và tải lại |
| E07 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2a-01-mobile-first-load.png` | Điện thoại lần đầu: thanh đầu tràn, F2 đè logo |
| E08 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2b-02-mobile-overflow-check.png` | Kiểm tra tràn ngang |
| E09 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2c-03-mobile-after-checkpoint-tap.png` | Thẻ câu hỏi dừng trên điện thoại (cuộn tự động) |
| E10 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2c-station-4Dykm.png` | Trạm 4 trên điện thoại: thuật ngữ |
| E11 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2d-04-mobile-quiz-scrolled-top.png` | Câu hỏi dừng bị khuất đầu |
| E12 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2e-05-mobile-chat-input.png` | Vị trí ô chat trên điện thoại |
| E13 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2i-11-mobile-chat-after-16s.png` | Trả lời chat trên điện thoại, nhãn kỹ thuật, LaTeX thô |
| E14 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2j-12-mobile-header-row-scrolled-right.png` | Dải đầu trang khi cuộn ngang |
| E15 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2j-13-mobile-soi-nao-open.png` | Khung "Soi não" trên điện thoại |
| E16 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2k-16-mobile-raise-hand.png` | "Giơ tay" điền sẵn [Tại 00:00] |
| E17 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2l-37-mobile-onboarding.png` | Onboarding trên điện thoại |
| E18 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s2l-39-mobile-lobby-step2.png` | Sảnh chờ bước 2 trên điện thoại |
| E19 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s3-18-showcase-t13.png` | Showcase giây thứ 13: HUD bước 1/4 |
| E20 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s3b-22-showcase-pause-check.png` | Nút "Tạm dừng" trên thanh đầu mở hộp "Gấp sổ nghỉ tay" |
| E21 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s3c-24-showcase-hud-paused.png` | Tạm dừng đúng trên HUD |
| E22 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s3c-25-showcase-late.png` | Cuối tour: khung soi não còn mở, nội dung trống |
| E23 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s4a-26-backend-down-load.png` | Backend tắt khi tải trang: không có thông báo |
| E24 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s4a-27-backend-down-after-send.png` | Backend tắt: Minh Khang trả lời bằng câu mẫu |
| E25 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s4b-29-long-message-after-send.png` | Tin nhắn 1.256 ký tự |
| E26 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s4c-hang-35-hang-after-send-4s.png` | Typing indicator treo |
| E27 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s4c-deep-33-deep-after-reload.png` | Sau khi tải lại: trạm 3 còn, khung soi não đóng |
| E28 | `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-mobile/shots/s5-36-kbd-focus-main.png` | Tiêu điểm bàn phím trên trang chính |

Ghi chú: E02 và E03 là ảnh chụp trong lúc hộp thoại mở, nên nội dung nền đã mờ.
