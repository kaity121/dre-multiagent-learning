# DRE: review UX theo nghiệp vụ, lớp đơn giản và lớp agent log

Ngày 31/10/2026 · nhánh `fix/ui-design-findings`

Báo cáo này tổng hợp ba nguồn:
- [ux-desktop-261031-0106-journey-review.md](./ux-desktop-261031-0106-journey-review.md): đi hành trình học trên desktop.
- [ux-newbie-mobile-261031-0106-review.md](./ux-newbie-mobile-261031-0106-review.md): người mới, điện thoại, trạng thái lỗi, trợ năng.
- Bản đồ nghiệp vụ → UI, dựng bằng cách đọc code.

Mã lỗi như `V-02`, `S4-01` trỏ về hai báo cáo chi tiết, nơi có bước tái hiện, `file:line` và ảnh chụp. Business rule (sư phạm, cách chấm) được giữ nguyên.

## Kết luận

Backend của DRE đã có một quy trình agent khá đầy đủ:
- trích xuất video;
- bàn tròn soạn giáo án;
- dispatcher chọn agent và gọi tool kiểm chứng;
- context snapshot cách ly theo phiên;
- evaluator Bloom.

UI hiện kể câu chuyện này **ngược** với mong muốn hai lớp:

1. **Lớp đơn giản của học sinh bị lộ ruột.** Học sinh thấy RAG, POE, Dispatcher, Assessor, "Soi não", "Mô phỏng", mức Bloom B6. Menu ⋯ mở thẳng công cụ giáo viên. Inspector còn để lộ nguồn đáp án.
2. **Lớp agent log lại không phản ánh agent thật.** Phần lớn log là fixture phát lại hoặc dữ liệu demo cứng. Khi backend lỗi, chat và Soi não lặng lẽ trả nội dung soạn sẵn mang tên các bạn AI, không gắn nhãn nào. Ba bảng (Inspector, Soi não modal, War Room) cùng chiếu một thứ theo ba cách.
3. **Phía giáo viên gần như vô hình.**
   - Ingest clip không có UI.
   - Bàn tròn nằm sau menu ⋯ và mặc định phát fixture.
   - "Xuất bản" chỉ ghi vào localStorage của một trình duyệt.
   - API drafts và evaluator ở backend chưa được UI gọi tới.

Vì vậy, việc cần làm trước tiên không phải là sửa từng nút. Cần dựng lại khung: **một câu chuyện cho học sinh**, **một Agent Map cho người muốn xem agent làm gì**, và **một lối riêng cho giáo viên**. Sau đó mới đóng các lỗi cụ thể.

---

## 1. Nghiệp vụ → UI: đang khớp đến đâu

### 1.1. Luồng giáo viên: soạn bài từ video

| Bước nghiệp vụ | Backend | UI hiện tại | Khoảng trống |
|---|---|---|---|
| 1. Đưa clip vào, AI đọc lời giảng và bảng | `POST /api/extract/clip` và SSE `/clip/:name/stream`. Có 4 stage có tên: Whisper, keyframe, đọc bảng, hợp nhất. | **Không có UI.** | Đây là màn có sẵn dữ liệu tiến trình thật để làm "progress dạng block", nhưng chưa ai gọi. |
| 2. Bàn tròn agent soạn điểm dừng và câu hỏi | `/api/roundtable/stream` có nhánh live. Tool quyết định duyệt hay bác, và ghi lại nguồn gốc (live, replay hay fixture). | War Room nằm sau ⋯, mặc định là fixture. Nút "Nạp trước dữ liệu mẫu". | Live chỉ bật được bằng toggle hoặc `?stream=live`. Người xem không biết đang xem thật hay giả. |
| 3. Giáo viên duyệt bản nháp | `GET /api/roundtable/drafts` | Timeline Editor (sau ⋯). Banner dẫn sang đó ghi nhầm là "Trạm 3". | Editor đọc bản nháp từ sự kiện `done`, không đọc API drafts. |
| 4. Xuất bản cho lớp | Chưa có endpoint publish. | Ghi localStorage và tải về một file JSON. | Không chia sẻ được cho học sinh ở máy khác. |

### 1.2. Luồng học sinh: học từ video

| Khoảnh khắc nghiệp vụ | Backend | UI hiện tại | Khoảng trống |
|---|---|---|---|
| Xem video cùng 4 bạn AI | `/api/chat/classroom` (dispatcher, tool, citation, sessionId) | Trạm 1, chat thật | Chat sai người trả lời (`C-01`). Gửi trùng tin (`C-02`). Markdown và LaTeX thô (`C-03`). Backend lỗi thì trả câu mẫu (`S4-01`). |
| Dừng ở 37:13 và trả lời | `/api/session/*`, `/api/runtime/dispatch` | Với bài vectơ, đường trả lời **cứng ở client** (`App.tsx:1096-1101`) | Sai không được báo "chưa đúng" (`V-03`). Bo khen đáp án sai. Phản biện rỗng vẫn qua (`V-04`). |
| Bác bỏ Bo, Cô Lam chốt quy tắc | dispatcher, tool kiểm chứng | Có | Không thấy được *vì sao* Trí đúng. Kết quả tool không được dẫn ra cho học sinh. |
| Trạm 2 Sổ tay, Trạm 3 Đoán, Trạm 4 Dạy kèm | `/api/evaluator/assess`, `/action`, `/certify-station4` | **Toàn bộ là dữ liệu cục bộ hoặc demo** (`demoLesson.ts`) | Evaluator và chứng nhận Bloom ở backend chưa được nối. "Báo cáo Bloom" là số cứng. |
| Lưu tiến độ | `/api/session/:id/export` | localStorage | Reload hoặc Tạm dừng thì video về 00:00 và mất chat, dù popup báo đã lưu (`P-01`, `S4-09`). |

### 1.3. Ba bảng agent log đang chồng nhau

| Bảng | Mở bằng | Dữ liệu |
|---|---|---|
| InspectorDrawer ("Soi não") | Nút header, Alt+I, menu ⋯ | Lượt phát lại, cộng với lượt dựng ở client rồi vá bằng kết quả dispatch |
| MultiAgentInspectorModal (cũng tên "Soi não") | Menu ⋯ "…Context Snapshot (#402)" | Snapshot thật. Lỗi thì **lặng lẽ** sinh snapshot giả. Token cứng là 437. Nhãn "● Live Grounded" luôn hiện. |
| War Room | Menu ⋯, `?view=warroom` | Mặc định là fixture `mock_reasoning_events.json` |
| RoundtableStreamConsole | **Không được gắn vào màn nào** | Là bảng duy nhất đọc run thật qua `/api/roundtable/runs` |

---

## 2. Năm nguyên nhân gốc

Gần 80 lỗi trong hai báo cáo chi tiết quy về năm nguyên nhân dưới đây. Sửa theo nguyên nhân thì nhiều lỗi tự đóng cùng lúc.

### N1. Không có câu chuyện người dùng, chỉ có các "trạm"

Người mới vào thẳng bài học. Onboarding và sảnh chờ được làm tốt nhưng chỉ hiện khi có `?onboarding=1` hoặc `?lobby=1` (`S1-01`, `L-01`). Header có 8 nút nhãn khó hiểu (`S1-03`). Tên trạm ("Đoán", "Dạy kèm", POE) không nói học sinh sẽ làm gì. Xong một bước thì không biết bước tiếp theo (`S1-02`, `S3-01`).

### N2. Hai lớp bị trộn: lộ ruột ở chỗ cần sạch, giả ở chỗ cần thật

Ở lớp học sinh:
- Học sinh gặp thuật ngữ nội bộ (`C-04`, `S2-07`, `S5-07`).
- Inspector để lộ nguồn đáp án (`H-01`).
- Có hai nút "Tạm dừng" khác nghĩa (`S3-02`).

Ở lớp agent log, người muốn xem agent làm gì lại thấy:
- fixture;
- snapshot giả;
- token cứng;
- nhãn "Live" luôn bật.

### N3. UI không nói thật về trạng thái

- Backend lỗi mà chat vẫn trả lời bằng câu mẫu (`S4-01`, Blocker).
- Popup báo đã lưu nhưng thực tế không lưu (`P-01`).
- "Trí đang soạn tin…" treo mãi (`S4-03`).
- Nhắn cho Bo thì Trí trả lời (`C-01`).
- Demo 1-Click chiếm màn hình và tự chọn đáp án sai (`V-09`).

### N4. Khoảnh khắc cốt lõi (điểm dừng 37:13) thiếu phản hồi

Đây là "aha moment" của sản phẩm, nhưng:
- trả lời sai thì không được báo chưa đúng;
- Bo khen đáp án sai;
- phản biện rỗng vẫn qua;
- trên điện thoại, câu hỏi bị đẩy khỏi màn hình (`V-03`, `V-04`, `S2-04`).

### N5. Điện thoại và trợ năng chưa được thiết kế

Trên điện thoại:
- header tràn;
- trang rộng 848px nên phải cuộn ngang;
- ô chat nằm cách đầu trang khoảng 1.600px (`S2-01`…`S2-03`).

Về trợ năng: onboarding không giữ focus, Esc không đóng được (`S5-01`), và tin nhắn chat không được đọc to cho trình đọc màn hình (`S5-02`).

Thêm một lỗi chặn: dialog "Đổi link" không đóng được (`V-02`).

---

## 3. Đề xuất khung: hai lớp, một lối giáo viên

### 3.1. Lớp đơn giản cho học sinh: kể đúng một câu chuyện

Thay "4 trạm" bằng một **thanh tiến trình theo khoảnh khắc nghiệp vụ**. Business rule không đổi, chỉ đổi cách kể:

```
[Xem bài] ── [Dừng 37:13: bạn chọn] ── [Bo cãi, bạn bác] ── [Cô Lam chốt] ── [Luyện thêm] ── [Kết quả]
   Trạm 1          Trạm 1                    Trạm 1              Trạm 1        Trạm 2–3       Trạm 4
```

- **Lần đầu vào:**
  - Mặc định bật sảnh chờ hiện có (tên, trình độ), rút còn 2 bước, có nút "Bỏ qua".
  - Sau đó là một dòng hướng dẫn: "Xem video, đến 37:13 lớp sẽ dừng để cùng giải".
- **Header:**
  - Rút còn 3 thứ: tên bài, tiến trình, menu tài khoản.
  - Gom Âm thanh, Đổi bài, Tạm dừng vào menu tài khoản.
  - Ẩn Demo 1-Click và công cụ giáo viên khỏi học sinh. Chỉ hiện khi có `?demo` hoặc vai trò giáo viên.
- **Chat:**
  - Mỗi tin chỉ hiện người nói, nội dung đã render KaTeX, và tối đa một **chip bằng chứng** ngắn: `✓ đã kiểm bằng tọa độ`, `📍 37:13`.
  - Bấm vào chip thì mở Agent Map đúng lượt đó, bằng popup chứ không phải một drawer mờ bên cạnh.
- **Điểm dừng 37:13:** là một màn hình riêng (sheet toàn màn trên điện thoại), làm đủ bốn nhịp:
  1. Chọn đáp án.
  2. Nhận phản hồi đúng hoặc sai ngay.
  3. Bo phản biện. Ô phản biện bắt buộc có nội dung, gợi ý mở dần.
  4. Cô Lam chốt quy tắc vàng.
- **Trạng thái thật:**
  - Khi không gọi được AI, hiện banner "Mất kết nối với lớp AI, đang thử lại".
  - Không để câu mẫu đội tên các bạn AI.
  - "Đang soạn" có timeout khoảng 20 giây, kèm nút Thử lại.
- **Kết quả (Trạm 4):** chỉ hiện những gì đo được, bằng ngôn ngữ người học. Ví dụ: "Bạn đã tự bác được ngộ nhận cộng độ dài" thay vì "B6 · protégé".

### 3.2. Lớp agent log: một Agent Map duy nhất

Gộp InspectorDrawer, MultiAgentInspectorModal, War Room và RoundtableStreamConsole thành **một bề mặt**, dựng theo kiểu Agent Map bạn đã chọn ở dự án Preflight: tiêu đề làn nằm ngang, các lần chạy con xếp bên dưới, lưới ô kẻ rõ.

```
 Lượt #7 · "Tại sao |a+b| ≠ 1+1=2?" · 2.4s · 1 820 tok · live
 ┌──────────────┬────────────────┬──────────────────┬───────────────┐
 │ Hiểu câu hỏi │ Lấy ngữ cảnh   │ Kiểm chứng       │ Trả lời       │
 ├──────────────┼────────────────┼──────────────────┼───────────────┤
 │ Dispatcher   │ Snapshot 37:13 │ verify_vector ✓  │ Trí           │
 │ intent: hỏi  │ bảng + lời GV  │ |BC+DD'| = a√2   │ "Hai vectơ…"  │
 │ khái niệm    │ KB MISC_VEC_005│ grounding: có    │ 2 citation    │
 │ 0.98 · 120ms │ 640 tok        │ 30ms             │ 1.1s · 900tok │
 └──────────────┴────────────────┴──────────────────┴───────────────┘
   bấm một ô → xem input/output JSON, prompt, nguồn trích dẫn
```

- **Ba chế độ trên cùng một khung:**
  - *Lượt chat*: đi theo từng câu trả lời ở lớp học sinh.
  - *Bàn tròn soạn bài*: phía giáo viên, 4 pha.
  - *Trích xuất video*: 4 stage có sẵn ở backend.
- **Mỗi block hiện:**
  - agent hoặc tool;
  - input và output;
  - citation (giây video, id trong KB);
  - thời gian, token, model;
  - nhãn **live / fallback / replay** lấy từ backend, không hardcode.
- **Nguyên tắc trung thực:**
  - Bỏ snapshot giả không nhãn, token cứng 437 và "● Live Grounded" luôn bật.
  - Không có dữ liệu thì ghi "không có". Không mô phỏng.
- **Phân quyền:** học sinh chỉ thấy phần đã được làm sạch (citation và kết quả tool), không thấy nguồn đáp án. Bản đầy đủ dành cho vai trò giáo viên hoặc demo.
- **Backend cần bổ sung:**
  - Dispatcher hiện trả về verdict, toolCalls, citations, contextSnapshot, nhưng chưa có token, độ trễ hay trace theo bước. Cần trả thêm một mảng `trace[]` (bước, agent, ms, tokens, provenance) cho mỗi lượt.
  - Phía bàn tròn và extract đã có sự kiện theo stage. Chỉ cần thêm `ms` và `tokens`.

### 3.3. Lối riêng cho giáo viên

Thêm một chế độ "Giáo viên", dẫn bằng vai trò ở sảnh chờ thay vì menu ⋯. Chế độ này đi đúng bốn bước nghiệp vụ trên cùng một trang có thanh bước:

1. **Đưa video vào:** gọi `/api/extract/clip`. Hiện 4 stage chạy dạng block và đường truyền dữ liệu.
2. **Hội đồng AI soạn bài:** SSE live, xem trực tiếp trên Agent Map ở chế độ bàn tròn.
3. **Duyệt bản nháp:** đọc bằng Timeline Editor từ `/api/roundtable/drafts`.
4. **Xuất bản:** nút đổi trạng thái `draft → approved`. Cần một endpoint publish mới, là việc nhỏ ở backend.

---

## 4. Danh sách sửa theo ưu tiên

### P0: chặn hoặc làm sai lệch trải nghiệm (sửa trước demo)

| # | Việc | Mã lỗi |
|---|---|---|
| 1 | Dialog "Đổi link" không đóng được. Đưa vào portal phía trên chat, Esc và bấm nền đều đóng được. | V-02 |
| 2 | Bỏ câu mẫu đội tên AI khi backend lỗi. Thay bằng banner mất kết nối và nút thử lại. | S4-01, S4-02 |
| 3 | Đáp đúng người: nhắn riêng cho Bo thì Bo trả lời. | C-01 |
| 4 | Điểm dừng 37:13: báo "chưa đúng" khi chọn sai, Bo không khen đáp án sai, chặn phản biện rỗng. | V-03, V-04 |
| 5 | Lưu và khôi phục thật vị trí video và chat. Nếu không lưu được thì bỏ câu "đã lưu". | P-01, S4-09 |
| 6 | "Đang soạn" có timeout, nút Hủy và Thử lại. | S4-03 |
| 7 | Điện thoại: header gọn, hết cuộn ngang, ô chat cố định ở đáy, điểm dừng là sheet toàn màn. | S2-01…S2-04 |

### P1: câu chuyện và hai lớp

| # | Việc | Mã lỗi |
|---|---|---|
| 8 | Mặc định bật sảnh chờ hoặc onboarding cho người mới, cho phép bỏ qua, giữ focus, Esc đóng được. | S1-01, L-01, S5-01 |
| 9 | Thanh tiến trình theo khoảnh khắc. Đổi tên trạm sang lời người học. Có nút "Bước tiếp theo". | S1-02, S3-01 |
| 10 | Lọc thuật ngữ trong UI học sinh (RAG, POE, Dispatcher, Assessor, B6, protégé, Soi não, Mô phỏng…). | C-04, S2-07, S5-07 |
| 11 | Render markdown và KaTeX trong chat và chip nguồn. | C-03 |
| 12 | Chip gợi ý gửi xong thì xóa ô nhập. Chặn gửi trùng. | C-02 |
| 13 | Ẩn công cụ giáo viên và Demo 1-Click khỏi học sinh. Học sinh không được thấy nguồn đáp án. | H-01, V-09 |
| 14 | Gộp 3 bảng agent log thành Agent Map (mục 3.2). Bỏ dữ liệu giả không nhãn. | Bản đồ mục 1.3 |
| 15 | Một nút "Tạm dừng" duy nhất. Showcase có nút Thoát rõ ràng và dọn sạch khi kết thúc. | S3-02, S3-03 |

### P2: hoàn thiện

| # | Việc | Mã lỗi |
|---|---|---|
| 16 | Đồng bộ trạm với lịch sử trình duyệt để nút Back đi lùi một trạm. | S4-07 |
| 17 | Tin chat dùng `aria-live`, ô chat có nhãn, trang có heading, focus nhìn rõ. | S5-02…S5-05 |
| 18 | Giới hạn độ dài tin nhắn, có bộ đếm ký tự. | S4-04 |
| 19 | "Giơ tay" không chèn tiền tố thô vào ô nhập. | S2-09 |
| 20 | Dọn code chết: `RoundtableStreamConsole` (sau khi gộp vào Agent Map), `PauseOverlay`, `normalizeTurn`, hai `AgentAvatar`, hai client stream, các wrapper evaluator chưa dùng. | Bản đồ mục 5 |

Các mục còn lại (nhãn nhỏ, vùng chạm dưới 44px, copy không đồng nhất giữa ba nơi chọn trình độ…) đã có đủ trong hai báo cáo chi tiết.

---

## 5. Lộ trình đề xuất

1. **Ổn định (P0, khoảng 1 ngày):** sửa 7 mục P0. Chỉ đụng UI và một chút luồng client, không đổi backend.
2. **Câu chuyện học sinh (P1 #8–#13, #15):** onboarding mặc định, thanh tiến trình, lọc thuật ngữ, render toán, ẩn công cụ nội bộ.
3. **Agent Map:**
   - Backend thêm `trace[]` cho dispatcher, thêm `ms` và `tokens` cho sự kiện bàn tròn và extract.
   - Frontend dựng Agent Map một bề mặt, rồi thay 4 bảng cũ.
4. **Lối giáo viên:** màn 4 bước nối extract, bàn tròn live, drafts, publish.
5. **Nối Trạm 2–4 vào evaluator backend** thay cho dữ liệu demo. Phần này chạm business rule chấm điểm nên cần bạn chốt trước.

## 6. Câu hỏi cần bạn chốt

1. Có làm chế độ "Giáo viên" riêng (mục 3.3) trong phase này không, hay chỉ làm lớp học sinh và Agent Map trước?
2. Học sinh có được mở Agent Map bản rút gọn (citation và kết quả tool) không, hay Agent Map chỉ dành cho giáo viên và demo?
3. Trạm 2–4 đang chạy dữ liệu demo. Giữ nguyên để demo, hay nối vào evaluator backend? Việc nối chạm vào cách chấm.
4. Khi demo không có mạng, có cần một chế độ offline *có gắn nhãn rõ* không? Hiện tại là fallback im lặng.
5. Thứ tự làm: theo đúng lộ trình mục 5, hay ưu tiên Agent Map trước vì đó là điểm khác biệt khi pitch?
