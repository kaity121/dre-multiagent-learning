# Báo cáo UX - Hành trình học sinh mới (desktop 1366x800)

- Ngày: 2026-10-31 (giờ 01:06)
- Nhánh: fix/ui-design-findings
- Phạm vi: vai học sinh lớp 12 chưa biết gì, dùng lần đầu. Đánh giá usability, rõ ràng, luồng, phản hồi, điểm kẹt, lỗi, copy, thứ bậc thị giác. Không đánh giá logic sư phạm/chấm điểm.
- Phương pháp: điều khiển Chrome headless qua DevTools Protocol (cổng 9341), click thật bằng chuột, nhập bằng Input.insertText, chụp ảnh từng bước và tự xem lại. Ghi console/network. Đã gọi LLM khoảng 9 lần (ước lượng theo số request `/api/chat/classroom`, `/api/session/*`, `/api/runtime/dispatch`).
- Thư mục ảnh bằng chứng: `C:/Users/LENOVO/AppData/Local/Temp/claude/d--CODE-Hackathon-FPT-Prompt2Building-dre-multiagent-learning/8ce24eb1-ec43-4b66-95bf-ae18e7c2517c/scratchpad/ux-desktop/shots/` (tên file ghi trong từng mục, ví dụ `07-chat-wide.png`).
- Không sửa file mã nguồn nào.

## Tóm tắt

Giao diện có nhiều chức năng đẹp (chẩn đoán sai lầm, POE, mở hỏi riêng, bản tổng kết, màn hình tạm dừng có copy tốt). Vấn đề chính: người mới không biết bắt đầu từ đâu, thuật ngữ nội bộ (RAG, POE, Bloom, protégé, "Soi não") lộ ra khắp nơi, công cụ nội bộ/dev nằm ngay trong menu học sinh, một số lỗi logic làm sai người nói (DM gửi Bo nhưng Trí trả lời), và mất trạng thái khi tạm dừng/tải lại.

Mức độ: **Blocker** = không đi tiếp được, không có đường thoát; **High** = làm sai hoặc gây hiểu nhầm lớn, hoặc mất dữ liệu người dùng nghĩ đã lưu; **Medium** = gây khựng, khó hiểu; **Low** = tinh chỉnh.

## Top 10 ưu tiên

1. **V-02 (Blocker)** Hộp "Dán link YouTube bài giảng" (nút "Đổi link") không đóng được: bị cột chat che, nút ✕ nằm ngoài tầm nhìn, Esc và bấm nền đều không đóng. Chỉ còn tải lại trang.
2. **P-01 (High)** "Tạm dừng → Quay lại học tiếp" và tải lại trang: video quay về 00:00, lịch sử chat mất, nhưng modal ghi "Vị trí của bạn và mọi ghi chú đã được lưu". Dữ liệu lưu `videoCurrentTime: "0"`.
3. **C-02 (High)** Chip gợi ý gửi tin nhưng không xóa ô nhập; câu cũ (kèm tiền tố "[Tại 03:52]") còn nằm trong ô, bấm Gửi là gửi trùng.
4. **C-01 (High)** Chọn "Bo" rồi gửi riêng, câu trả lời hiện tên **Trí**. Lỗi logic hiển thị người nói.
5. **V-03 / V-04 (High)** Checkpoint 37:13: chọn sai không có dòng "Sai rồi" rõ ràng; "Bo cãi" còn khen đáp án sai. Gửi phản biện khi để trống vẫn chuyển sang bước "Cô Lam chốt", không báo lỗi.
6. **C-04 / S4-01 (High)** Thuật ngữ nội bộ không giải thích: "Đang truy xuất kho tri thức RAG (Pedagogical KB)", "POE", "Bậc 5 (Đánh giá & Phản biện)", "Hiệu ứng protégé", "Phe Bo/Phe Trí", "Bẫy ngộ nhận", "Lam: Đã cho".
7. **C-03 (High)** Lộ markdown/LaTeX thô: `**cùng hướng, cùng độ dài**`, nguồn "Bảng phấn 00:08: \vec{AB}", "Sai lệch (CC' ≠ a\sqrt{2})".
8. **H-01 (High)** Menu "⋯" có mục "CÔNG CỤ GIÁO VIÊN & NỘI BỘ" (Timeline Editor, War Room, Inspector, Soi não Agent). Inspector hiện cả "Ngữ cảnh được cấp quyền" và "Bảng phấn 37:13", lộ cơ chế nội bộ cho học sinh.
9. **L-01 (High)** Vào trang gốc, học sinh vào thẳng bài giảng, không hỏi tên/trình độ, không hướng dẫn 4 trạm. Màn hình chào (lobby) chỉ hiện khi có `?lobby=1`, và nó làm khá tốt.
10. **V-09 (High)** "Demo 1-Click (F2)" chiếm toàn bộ màn hình trong vài giây, tự chọn đáp án sai, mở phản biện. Bấm "Thoát" để lại thẻ phản biện treo, không rõ trạng thái.

---

## A. Màn hình đầu và vào lớp

**L-01 - High - Người mới không có hướng dẫn, không được hỏi tên/trình độ**
- Vị trí: `src/App.tsx` khởi tạo `isLoggedIn` (khoảng dòng 480-486) mặc định `true`, trừ khi có `?lobby=1`. `isOnboardingOpen` (khoảng 413-419) chỉ bật với `?onboarding=1`. Lobby (`PreClassLobbyModal`, khoảng 1500) chỉ render khi `!isLoggedIn`.
- Trải nghiệm: mở `http://localhost:3000/` lần đầu, thấy ngay video + chat + 7 nút header + 4 tab trạm. Không biết bấm gì trước. Tagline nhỏ góc phải "Trạm 1: Xem video & Phản biện bẫy trực giác" không giải thích trạm nghĩa là gì.
- Ảnh: `01-landing.png`.
- Gợi ý: nếu chưa có `dre_learner_profile` trong localStorage thì hiện lobby. Trên video thêm 3 bước ngắn: "1 Xem video - 2 Hỏi bạn bè - 3 Trả lời checkpoint 37:13".

**L-02 - Medium - Lobby có ưu điểm nhưng có thuật ngữ và mặc định chưa phù hợp**
- Vị trí: `src/components/PreClassLobbyModal.tsx` (bước 1 và 2).
- Trải nghiệm: "Trợ giảng An · Trợ giảng AI", "Checkpoint", "Bước 1/2: Khảo sát đầu vào". Lựa chọn mặc định "Đã học" cho học sinh vốn chưa học bài này. Bước 2 có "Sau buổi học, bạn sẽ nắm vững" và ô tên rất rõ, nên giữ.
- Ảnh: `55-lobby.png`, `57-lobby-step2.png`.
- Gợi ý: đổi tên "Checkpoint" thành "câu hỏi dừng"; mặc định chọn "Mới học" hoặc không chọn sẵn.

---

## B. Video, checkpoint và phản hồi nhanh

**V-01 - Medium - Video và nhãn thời gian không khớp, khung YouTube chiếm chỗ**
- Vị trí: `src/App.tsx:2083` ("Thầy Nguyễn Phan Tiến · 1h 38m"). Video YouTube thực tế dài `2:38:23`. Thời điểm ghi trong thẻ bài học (ví dụ "Phút 1:40:10", "Phút 1:30:30") không giải thích cùng mốc với thanh video.
- Trải nghiệm: YouTube hiện tiêu đề riêng, "Video khác", nút chia sẻ và CC. Người dùng không biết nên xem trong khung app hay trong YouTube.
- Ảnh: `02-video-after-play.png`, `32-station3-poe.png`.
- Gợi ý: sửa thời lượng hiển thị theo video thật. Ghi mốc dạng "Ví dụ 8 - 01:30:30 trong video" hoặc đổi thành số mục. Ẩn bớt chrome YouTube (`modestbranding`, `controls` tùy chọn) hoặc dùng nhãn rõ hơn.

**V-02 - Blocker - Hộp "Dán link YouTube bài giảng" không đóng được**
- Vị trí: `src/components/VideoPlayerSheet.tsx:1268-1280` (`fixed inset-0 z-50`, card `max-w-md`). Nút "Đổi link" ở thanh dưới video (khoảng dòng 2000).
- Tái hiện: ở Trạm 1 bấm "Đổi link". Hộp hiện ở vị trí lệch, nửa bên phải bị cột chat che (chat vẫn hiện trên lớp phủ). Nút ✕ và nửa nút "Phát Video & Đồng bộ kịch bản" nằm dưới cột chat. Esc không đóng, bấm vùng nền không đóng. Chỉ tải lại trang mới thoát.
- Trải nghiệm: học sinh bị kẹt. Đây cũng là chức năng của giáo viên, không nên có ở giao diện học sinh.
- Ảnh: `50-doi-link-open.png`, `52-current-link-dialog.png`, `53-after-backdrop-click.png`, `54-after-x-click.png`.
- Gợi ý: đưa hộp vào portal ở `document.body` với z-index cao hơn cột chat; thêm Esc và nút đóng luôn hiện; ẩn chức năng đổi link sau cờ giáo viên.

**V-03 - High - Trả lời checkpoint sai không rõ là sai**
- Vị trí: `src/components/VideoPlayerSheet.tsx` (khối "Bo phản biện bạn", chữ "Bo cãi:" khoảng dòng 1000-1100).
- Tái hiện: 37:13, chọn B (đáp án sai), bấm "Xác nhận đáp án". Không có dòng "Chưa đúng". Ngay sau đó màn hình hiện "Bo cãi: 'Chuẩn bài, tớ cũng thích cách cậu tách...'" với tiêu đề "Bo phản biện bạn". Học sinh mới không biết mình đúng hay sai.
- Ảnh: `20-quiz-wrong-feedback.png`, `20b-quiz-wrong-feedback-2s.png`.
- Gợi ý: hiển thị ngay một dòng phản hồi ("Chưa đúng. Đáp án đúng là A vì...") rồi mới đến phần phản biện. Đổi "phản biện" thành "Cãi lại Bo" hoặc có chú thích "Phản biện = nêu lý do bạn không đồng ý".

**V-04 - High - "Gửi phản biện" để trống vẫn chuyển bước, không báo lỗi**
- Vị trí: `VideoPlayerSheet.tsx:1119-1164`.
- Tái hiện: ở bước phản biện không chọn lập luận nào, bấm "Gửi phản biện". Màn hình chuyển sang "Cô Lam chốt quy tắc trọng tâm" và nút "Tiếp tục bài giảng". Lập luận của học sinh không được ghi nhận, không có thông báo.
- Ảnh: `21-debate-empty-send.png`.
- Gợi ý: vô hiệu hóa nút khi chưa có nội dung, hoặc báo "Hãy chọn một lập luận hoặc tự viết lý do".

**V-05 - Medium - "Bỏ qua" checkpoint không nói hậu quả, pill chồng lên YouTube**
- Vị trí: `VideoPlayerSheet.tsx:692-705` (pill "Câu hỏi đang chờ · 37:13 | Lùi 30 giây | Mở lại câu hỏi").
- Tái hiện: ở câu hỏi 37:13, bấm "Bỏ qua". Video chạy tiếp (37:15) và pill đè lên tiêu đề YouTube. Không rõ câu hỏi đã bị bỏ hay vẫn còn chờ, và không rõ có ảnh hưởng gì.
- Ảnh: `24-after-bo-qua.png`, `25-reopen-quiz.png`.
- Gợi ý: sau "Bỏ qua", hiển thị "Đã bỏ qua câu này. Bạn có thể mở lại ở mục Câu hỏi dừng" và đặt pill ngoài vùng tiêu đề video.

**V-06 - Medium - Giơ tay: hai thẻ cùng lúc, video không dừng, tên trợ giảng không khớp**
- Vị trí: thẻ "Bạn đang hỏi về đoạn [3:52]" (`VideoPlayerSheet.tsx:735`, có "Trợ giảng An") và thẻ "Hỗ trợ tại [3:52]" (`VideoDebateSheet.tsx:1559`).
- Tái hiện: bấm "Giơ tay" trong lúc video đang chạy. Hai thẻ hiện cùng lúc, video vẫn chạy phía sau. Ô nhập đã bị điền sẵn "[Tại 03:52] Thế DD' = CC'..." (xem C-02).
- Ảnh: `16-giotay.png`, `17-giotay-8s.png`.
- Gợi ý: một thẻ duy nhất. Tạm dừng video khi mở thẻ. Xóa phần điền sẵn không có chủ ý.

**V-07 - Medium - "Đã hiểu / Chưa rõ" chỉ là toast 2,5 giây**
- Vị trí: `src/App.tsx:124-131` (`handleQuickReaction`, `setTimeout(...2500)`).
- Tái hiện: bấm "Đã hiểu" hoặc "Chưa rõ". Toast "Đã ghi nhận: ..." hiện rồi biến mất. Không có đường đi nào sang chat, không thấy giáo viên hay bạn bè, không có cách hủy. Nút đang bấm không hiện rõ trạng thái đã chọn.
- Ảnh: `14-after-da-hieu.png`, `15-after-chua-ro.png`.
- Gợi ý: ghi thành một dòng trong lớp ("Bạn báo: chưa rõ ở 37:13"), có trạng thái nút rõ và cho bỏ chọn.

**V-08 - Low - Cùng một khái niệm, ba tên**
- "Câu hỏi dừng" (nút), "Điểm dừng" (thẻ timeline), "Checkpoint" (lobby), "Câu hỏi đang chờ" (pill). Gợi ý: chọn một tên, ví dụ "Câu hỏi dừng".

**V-09 - High - Demo 1-Click tự chạy, chọn đáp án sai, không thoát sạch**
- Vị trí: `src/App.tsx:1550-1568` (nút F2), HUD `ShowcaseHUD`.
- Tái hiện: bấm "Demo 1-Click (F2)". Sau ~4 giây video đã nhảy tới 37:13, đáp án B được chọn sẵn, thanh HUD "SHOWCASE DEMO · BƯỚC 1/4" đè lên thanh điều khiển video. Bấm "Thoát (Esc)" thì thẻ phản biện vẫn còn trên màn hình, không rõ trạng thái.
- Ảnh: `59-demo-started.png`, `60-demo-stopped.png`.
- Gợi ý: chuyển Demo sang route ẩn (ví dụ `?demo=1`) hoặc yêu cầu xác nhận. Khi thoát, đưa giao diện về trạng thái trước khi chạy.

---

## C. Chat lớp học

**C-01 - High - Tin nhắn riêng gửi Bo nhưng Trí trả lời**
- Vị trí: `src/components/VideoDebateSheet.tsx:413` (`let replyAuthor = 'Trí';` làm mặc định).
- Tái hiện: chọn "Bo" trong danh sách người nhận (hàng composer hiện "Nhắn riêng cho Bo..."). Gửi "Bo ơi, vectơ là gì vậy? Mình mới học nên chưa hiểu lắm." Tin trả lời hiện nhãn **"Trí 0:31"**.
- Ảnh: `05-dm-bo-sent-immediate.png`, `06-dm-bo-after-12s.png`, `07-chat-wide.png`.
- Gợi ý: tác giả trả lời phải là người nhận. Nếu người đó không trả lời được, hiện "Bo đang bận" hoặc để người khác có ghi chú rõ ("Trí trả lời thay").

**C-02 - High - Chip gợi ý không xóa ô nhập, dễ gửi trùng**
- Vị trí: `VideoDebateSheet.tsx:1632-1636` (chip gọi `setUserChatInput(item.full)` rồi `handleSendUserChatMessage(item.full, 'all')`); `VideoDebateSheet.tsx:409` (`if (!overrideText) setUserChatInput('')` nên không xóa khi gửi bằng chip).
- Tái hiện: bấm chip "Thế DD' = CC' nối tiếp?". Tin đã vào lớp, nhưng cùng câu đó còn nằm trong ô nhập. Bấm Gửi là gửi trùng. Ngoài ra chip luôn gửi cho "Cả lớp" (`'all'`) dù người nhận đang chọn là Bo.
- Ảnh: `12-chip-clicked.png`, `13-chip-reply.png`.
- Gợi ý: xóa ô nhập khi gửi bằng chip, và giữ người nhận đang chọn.

**C-03 - High - Markdown và LaTeX thô hiện trong tin nhắn và nguồn**
- Tái hiện: trả lời của Linh Chi hiện nguyên `**cùng hướng, cùng độ dài**` (dấu sao). Chip nguồn "Đã kiểm chứng hình học: Sai lệch (CC' ≠ a\sqrt{2})" và "Bảng phấn 00:08: \vec{AB}" hiện nguyên lệnh LaTeX. Có một chip nguồn chỉ có biểu tượng, không có chữ (cạnh "SGK Toán 12", ảnh 14).
- Ảnh: `14-after-da-hieu.png`, `22-after-continue.png`.
- Gợi ý: render markdown và KaTeX trong tin nhắn và nhãn nguồn. Ẩn chip nguồn nếu không có nhãn.

**C-04 - High - Thuật ngữ nội bộ trong trạng thái và nhãn**
- Trạng thái AI: "Đang truy xuất kho tri thức RAG (Pedagogical KB)...". Nhãn: "Bám nguồn: Khớp bài giảng", "Bẫy ngộ nhận", "Đào sâu bản chất", "Trực quan đời sống", "Gợi ý giải bài", "Giáo viên chủ trì", "nghi vấn 1+1=2", "Trợ giảng".
- Gợi ý: "Đang tìm trong bài giảng và sách giáo khoa...", "Trích từ bài giảng 01:18", "Trí - hay hỏi về bản chất", "Cô Lam - giáo viên". Giữ thuật ngữ kỹ thuật trong công cụ giáo viên.
- Ảnh: `05-dm-bo-sent-immediate.png`, `08-recipient-menu-wide.png`.

**C-05 - Medium - Câu hỏi ngoài lề vẫn kèm nguồn bài giảng**
- Tái hiện: gửi "Trưa nay mình đói quá, các bạn ăn gì chưa?" cho cả lớp. Trả lời của Minh Khang có 3 nguồn ("Bảng phấn 01:18: AB = BA", "SGK Toán 12...") không liên quan. Người dùng có thể hiểu là câu trả lời đã được kiểm chứng.
- Ảnh: `11-offtopic-reply.png`.
- Gợi ý: chỉ hiện nguồn khi câu trả lời có căn cứ.

**C-06 - Medium - Trang tự cuộn sau khi gửi tin**
- Tái hiện: sau khi gửi tin (hoặc chip), cả trang cuộn xuống. Header vẫn cố định nhưng video và tiêu đề bị đẩy lên, nhiều khi học sinh không thấy mình vừa gửi gì.
- Ảnh: `05-dm-bo-sent-immediate.png`, `12-chip-clicked.png`.
- Gợi ý: không cuộn cả trang, chỉ cuộn vùng chat.

**C-07 - Medium - Phản hồi khi AI chậm hoặc lỗi là âm thầm**
- Vị trí: `src/App.tsx:771`: `console.warn('[DRE Worksheet] Backend rebuttal error or timeout, falling back immediately: ...')`.
- Trải nghiệm: khi backend quá 3,5 giây, hệ thống trả lời mẫu có sẵn và không báo gì. Người dùng không biết câu nào của AI, câu nào là mẫu.
- Gợi ý: hiện nhãn nhỏ "Trả lời tạm thời" khi dùng nội dung dự phòng.

**C-08 - Low - Danh sách người nhận bị cắt**
- Vị trí: danh sách người nhận và hàng "4 bạn đồng hành" khi bật "Video rộng" (ảnh 58). Tên bị cắt ("Linh ...", "Minh ...", "Trợ giảng ..."), và phần mô tả vai trò bị xuống dòng lộn xộn.
- Gợi ý: đủ rộng để hiện tên đầy đủ, hoặc chỉ hiện tên, vai trò để trong tooltip.

**Điểm tốt giữ lại (chat):** có hiệu ứng "Bo đang suy nghĩ & soạn tin..."; có nhãn "Đang truy xuất..."; hỏi riêng bằng modal 4 tab (`47-so-tay-hoi-rieng.png`) rõ và gọn.

---

## D. Trạm 2 - Sổ tay (chẩn đoán lỗi)

**S2-01 - High - Tên trạm không khớp nội dung**
- Tab "2 · Sổ tay", nhưng nội dung là "Chẩn đoán & Bắt lỗi bài giải Bo" (tiêu đề góc phải). Trong đó lại có "Sổ tay quy tắc chuẩn · Linh Chi". Từ "Sổ tay" có hai nghĩa.
- Ảnh: `26-station2-sotay.png`.
- Gợi ý: đặt tên trạm theo việc học sinh làm, ví dụ "2 · Bắt lỗi".

**S2-02 - Medium - Chú thích màu và câu chỉ dẫn khó hiểu**
- "Lam: Đã cho · Đỏ: Cần tìm · Lá: Đã đúng". "Chọn bước giải bạn phát hiện có lỗi sai: 1 trong 3 bước". "Khẩu quyết thầy Tiến", "Chung đầu - Lộn ngược". Học sinh không biết "Lam" là màu gì.
- Gợi ý: "Xanh: đề cho - Đỏ: cần tìm - Xanh lá: đúng". Đổi "Khẩu quyết" thành "Quy tắc nhớ nhanh".

**S2-03 - Medium (cần xác minh) - Gửi phân tích với ô trống vẫn chuyển bước**
- Tái hiện: chọn Bước 2, để trống ô "Phân tích lỗi sai ở Bước 2", bấm "Gửi phân tích & Kiểm tra bước đã chọn". Màn hình sang "Bạn bắt trúng Bước 2 rồi" mà học sinh chưa viết gì. Chưa rõ có tự điền nội dung mẫu không.
- Vị trí: `src/components/InteractionCardSheet.tsx:238`.
- Ảnh: `28-station2-empty-send.png`.
- Gợi ý: vô hiệu hóa nút khi ô trống, hoặc cho biết rõ đã dùng mẫu.

**S2-04 - Medium - Thuật ngữ cuối trạm**
- "Tiến lên Trạm 3 · Đoán kết quả (POE)" ngay sau khi thành công. "POE" không được giải thích.
- Ảnh: `31-station2-after-12s.png`.

---

## E. Trạm 3 - Đoán (POE)

**S3-01 - High - Kết quả đúng/sai hiện trước khi học sinh tự giải thích**
- Tái hiện: chọn "Phe Bo" ở Bước 1. Bước 2 hiện ngay "Nếu IA = +3·IG (Phe Bo): ... (Sai!)" và "(Chuẩn xác!)". Bước 3 đã có sẵn câu trả lời mẫu để chọn nhanh. Học sinh chỉ đọc chứ không tự suy luận.
- Gợi ý: để Bước 2 hiện sau khi học sinh tự ghi quan sát, hoặc có nút "Xem kết quả".

**S3-02 - Medium - Nhãn sơ đồ bị tràn**
- "← Vectơ IA (Sang trái)" tràn khỏi hộp; "Độ dài IA = 3 phần" đè lên đường cong.
- Ảnh: `34-station3-bottom.png`.

**S3-03 - Medium - Nút "Chốt kết luận" bị khóa không có lý do**
- Nút xám "Chốt kết luận cùng Trí & Minh Khang" không nói phải làm gì để mở.
- Gợi ý: "Chọn một lập luận ở trên để tiếp tục".

**S3-04 - Low - Nhãn "Chọn nhanh:" trên đáp án**
- Các câu trả lời có tiền tố "Chọn nhanh:" nghe như gợi ý, trong khi chúng là đáp án.
- Ảnh: `33-station3-step1-chosen.png`.

**S3-05 - Medium - "Phe Bo / Phe Trí"**
- "Phe" là từ không tự nhiên. Gợi ý: "Bạn tin Bo đúng hay Trí đúng?"

---

## F. Trạm 4 - Dạy kèm

**S4-01 - High - Quá nhiều thuật ngữ trong phần đầu trang**
- "B6", "CẤP ĐỘ NHẬN THỨC HIỆN TẠI", "Bậc 5 (Đánh giá & Phản biện) → Bậc 6 (Sáng tạo đề toán mới)", "Hiệu ứng protégé", "2/2 Thử thách", "Lớp học sẵn sàng", "HỘI ĐỒNG THẨM ĐỊNH: Cô Lam (Cố vấn), Bo (Học sinh), Linh Chi (Cấu trúc), Minh Khang (Trực quan), Trí (Kiểm chứng)", "5 tác nhân sẵn sàng thẩm định".
- Ảnh: `36-station4.png`, `42-after-reload.png`.
- Gợi ý: "Bạn đang ở mức: Vận dụng → Sáng tạo". "Tác nhân" đổi thành "người". Hội đồng đưa xuống cuối, không chiếm đầu trang.

**S4-02 - Medium (cần xác minh) - Nhiệm vụ 1 không thấy điều khiển hoàn thành**
- "Giúp Bo đúc kết bí kíp cộng & trừ vectơ" có hai thẻ "Cách 1/Cách 2" nhưng không thấy ô nhập hay nút. Nhiệm vụ 2 thì có đầy đủ. Chưa kiểm tra xem các thẻ có bấm được không.
- Ảnh: `36-station4.png`.

**S4-03 - High - Gửi đề thách đấu rỗng báo lỗi sai nội dung**
- Tái hiện: ô nhập trống, bấm "Gửi đề thách đấu cả lớp". Linh Chi nhắc: "Biểu thức của bạn chưa có dấu bằng (=)...". Ô trống nên không có "biểu thức" nào.
- Vị trí: `src/components/AlternativeFlowsSheet.tsx:93`.
- Ảnh: `37-station4-empty-challenge.png`.
- Gợi ý: "Bạn chưa nhập đẳng thức" và đưa con trỏ vào ô nhập.

**S4-04 - Medium - Nút ký hiệu vectơ không nhãn**
- Các nút "AB", "AD", "AA'", "AC'", "+", "=" và nút "Mẫu chuẩn" không có chú thích. "Bấm các nút bên dưới để ghép" không cho biết kết quả hiện ở đâu.

**S4-05 - Medium - Modal tổng kết (Hành trình trưởng thành)**
- Dùng được: nút "Đóng" và "Xem góc nhìn giáo viên" rõ; chuyển Học sinh/Giáo viên rõ. Vấn đề: "MỨC BLOOM CAO NHẤT L6", "Tháp Bloom", "Đạt 6/6 bậc", "Protégé", chữ trong tháp Bloom quá nhỏ (khoảng 10-11px), khó đọc trên 1366px.
- Ảnh: `39-station4-summary-click.png`.

---

## G. Header, công cụ và điều hướng

**H-01 - High - Công cụ nội bộ hiện trong menu học sinh**
- Vị trí: `src/App.tsx` khối "TẦNG 1: LOGO + CÔNG CỤ GIÁO VIÊN + CỤM TIỆN ÍCH" (khoảng dòng 1527) và menu "⋯".
- Tái hiện: bấm "⋯": "CÔNG CỤ GIÁO VIÊN & NỘI BỘ": Timeline Editor, Phòng điều hành (War Room), Thanh tra lượt thoại (Inspector, Alt+I), Soi não Agent & Context Snapshot #402.
- Inspector "Soi não tác nhân" hiện "Điều phối (Dispatcher)", "0,91", "Bo nhìn thấy gì (Context Snapshot)", "Bảng phấn 37:13", "Tri thức tra cứu: SGK Toán 12", và "Lời giải chuẩn của bài (Ẩn với Bo)" bị gạch. Học sinh xem được cơ chế và đáp án, dù nhãn ghi là ẩn với Bo.
- Ảnh: `43-more-menu.png`, `46-inspector-from-menu.png`.
- Gợi ý: chỉ hiện các công cụ này khi có cờ giáo viên (ví dụ `?mode=teacher`). Không đưa dữ liệu đáp án vào payload của giao diện học sinh.

**H-02 - High - Thanh đầu quá đông, nhiều nhãn lạ**
- Có 8 nút (Demo 1-Click (F2), Âm thanh, Sổ tay & Hỏi riêng 4 bạn, Đã học, Đổi bài, Tạm dừng, Soi não Alt+I, ⋯) cộng 4 tab trạm, cộng thanh tiến độ. "Soi não" có màu đen nổi bật nhất nhưng là công cụ nội bộ. "Đã học" không rõ là đánh dấu đã xong bài hay không (chưa thử bấm). Tên "Đổi bài" mở "Sổ bài tập".
- Ảnh: `01-landing.png`.
- Gợi ý: gộp thành "Học" (trạm, tạm dừng, đổi bài) và "Giáo viên" (demo, soi não, công cụ). Bỏ phím tắt khỏi nhãn.

**H-03 - Medium (cần xác minh) - Nút "Soi não" không có phản hồi rõ**
- Tái hiện: bấm "Soi não" trên thanh đầu, không thấy panel nào (`44-soi-nao.png`). Mở qua "⋯ > Thanh tra lượt thoại" thì có panel (`46-inspector-from-menu.png`). Hai đường vào khác hành vi. Cần kiểm tra lại trong lượt chạy có dữ liệu.

**H-04 - Medium - "Bố cục cột (380px)" và chế độ hiển thị**
- Nhãn "BỐ CỤC CỘT (380PX)", "Video rộng / Mặc định / Chat rộng" dùng đơn vị kỹ thuật.
- Khi chọn "Video rộng", cột chat còn 280px. Nút "Mở rộng", chip "Gợi ý", tên người đều bị cắt (`58-video-wide.png`).
- Gợi ý: bỏ số px khỏi nhãn; đặt chiều rộng tối thiểu cho cột chat (khoảng 340px); đưa "Mở rộng" xuống hàng khác khi hẹp.

**H-05 - High - Danh sách bài tập lẫn bài không cùng khóa, nhãn "đã học" sai**
- Vị trí: drawer "Sổ bài tập (9 bài) · Toán Cấp 2-3" (nút "Đổi bài").
- Tái hiện: mở "Đổi bài". Danh sách có "Phương trình bậc 2", "Phân số, cộng sai mẫu số", "Luỹ thừa", "BODMAS/PEMDAS", và chủ đề vectơ. Bài đang học là "Bài 5" nhưng nằm ở mục "ĐÃ HỌC RỒI (3 BÀI)". Tên "Toán Cấp 2-3" không khớp "Toán 12".
- Ảnh: `40-doi-bai.png`.
- Gợi ý: nhóm theo khóa/chương; đánh dấu "Đang học"; thống nhất tên "Đổi bài" và tiêu đề drawer.

**H-06 - High - Xóa bản lưu không có xác nhận**
- Vị trí: `src/components/PauseModal.tsx:122` ("Xoá bản lưu & bắt đầu lại từ đầu"), `src/App.tsx:2381-2385` (`localStorage.removeItem` và `handleRetryLesson()` chạy ngay).
- Trải nghiệm: link nhỏ, gạch chân ngay dưới hai nút chính. Bấm là xóa tiến độ ngay, không hỏi lại.
- Gợi ý: hộp xác nhận hai bước; đặt nút này cùng hàng với nút phụ, không gây nhầm.

**H-07 - Low - Tiếng Anh xen lẫn**
- "Replay", "Timeline Editor", "War Room", "Inspector", "Context Snapshot", "Dispatcher", "Demo 1-Click", "Pedagogical KB", "Agent". Gợi ý: dịch hoặc ẩn khỏi giao diện học sinh.

**H-08 - Low - Modal "Tạm dừng" có copy tốt**
- "Gấp sổ nghỉ tay một lát nhé!", "Đã lưu vào máy", "Quay lại học tiếp" đều rõ. Giữ. Nhưng xem P-01 về "Lưu lúc" và nội dung lưu.
- Ảnh: `41-tam-dung.png`.

---

## P. Trạng thái và lưu dữ liệu

**P-01 - High - Tạm dừng và tải lại trang làm mất vị trí video và chat**
- Vị trí: modal "Gấp sổ nghỉ tay" (`src/components/PauseModal.tsx:81` "Vị trí của bạn và mọi ghi chú đã được lưu vào bộ nhớ trình duyệt..."). Dữ liệu trong `localStorage["dre_saved_session_v1"]` có `"videoCurrentTime":"0"`. Không thấy tin nhắn lớp nào trong dữ liệu lưu.
- Tái hiện: xem tới 37:21, bấm "Tạm dừng" (modal ghi "Lưu lúc 01:16:42"), bấm "Quay lại học tiếp" rồi tải lại trang. Trạm 1 quay về 00:00, khung chat trống, không còn câu trả lời nào. Trạm 2-4 vẫn giữ tiến độ (có dấu tick).
- Ảnh: `41-tam-dung.png`, `42-after-reload.png`, `49-tab1-retry.png`.
- Gợi ý: lưu `videoCurrentTime` từ player và seek khi khôi phục; lưu lịch sử chat; hoặc sửa copy thành "Đã lưu tiến độ trạm, không lưu vị trí video".

**P-02 - Low - Health check gọi liên tục**
- `src/App.tsx:613-620` gọi `checkBackendHealth()` (`GET /api/misconceptions`) mỗi 4 giây. Trong một phiên ngắn đã có 100+ request. Không ảnh hưởng người dùng trực tiếp, nhưng nên dùng endpoint nhẹ hơn hoặc giãn chu kỳ.

---

## Điểm tốt giữ lại

- Chuỗi trạm có dấu tick khi hoàn thành (`2 · Sổ tay ✓`, `3 · Đoán ✓`, `4 · Dạy kèm ✓`).
- Trạm 2 có thông báo thành công rõ: "Chẩn đoán & Sửa lỗi thành công! ĐÚNG RỒI".
- Hỏi riêng có 4 tab người (mỗi người một màu), gọn và rõ.
- Lobby bước 2 có lời hứa học được gì và nút "Vào lớp học ngay" bị khóa đến khi có tên.
- Modal tổng kết có toggle Học sinh/Giáo viên.

## Chưa kiểm tra được hoặc còn giới hạn

- Chưa gửi giơ tay, hỏi riêng có trả lời, và chưa thử lượt phản biện có nội dung thật. Lý do: tiết kiệm lượt gọi LLM (ngân sách khoảng 12 lượt).
- Chưa thử nút "Đã học" (đánh dấu hoàn thành hay không), "Âm thanh", và "Đổi bài" sang một bài khác (Bài 1) để xem có nạp video không.
- Chưa xem khung Giáo viên, War Room, Timeline Editor.
- Chưa thử mobile, và chưa xem hành vi khi backend tắt (chỉ thấy cảnh báo trong console).
- Chưa xem video vượt quá 37:21 hay các mốc 1:06:30.
- Lần thử "Soi não" trên thanh đầu chưa đủ để kết luận (H-03).
- Gửi phân tích rỗng ở Trạm 2 (S2-03) cần kiểm tra lại để biết có dùng nội dung mẫu không.
- Toàn bộ kết quả dựa trên một phiên Chrome sạch, không có dữ liệu cũ.

## Câu hỏi còn mở

- Nhóm sản phẩm có muốn học sinh mới luôn vào lobby không, hay vẫn giữ mặc định vào thẳng bài giảng?
- Với P-01: đâu là hành vi đúng khi "Quay lại học tiếp": tiếp tục đúng giây đang dừng, hay bắt đầu lại trạm?
- "Bo cãi" có cố ý khen đáp án sai không? Đây là vấn đề sư phạm nên không đánh giá, nhưng cần xác nhận để viết copy phản hồi.
