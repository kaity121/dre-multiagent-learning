# Kiến Trúc Hệ Thống DRE Multi-Agent Interactive Learning

Tài liệu này mô tả kiến trúc 4 tầng của DRE (Diagnose - Repair - Explain) và định hướng mở rộng đa môn học (EPIC 7). Tên kiểu dữ liệu và route được lấy từ mã nguồn; nếu có khác biệt, mã nguồn là chuẩn (`src/types/pipeline.ts`, `src/types/lesson.ts`, `src/types/reasoning.ts`, `backend/server.js`).

Mỗi mục được gắn một trong ba trạng thái: **Đã triển khai** (có trong mã nguồn), **Fixture** (chạy trên dữ liệu ghi sẵn), **Mục tiêu** (định hướng, chưa được chứng minh).

---

## 1. Tổng Quan Kiến Trúc 4 Tầng

```
+-------------------------------------------------------------------------+
| TẦNG 4: GIAO DIỆN NGƯỜI DÙNG & ĐIỀU KHIỂN SHOWCASE                      |
| React 19 + Vite 8 | Lime Soft Tokens (#C8F169 & #121712)                |
| Resizable Splitter | Inspector Drawer | Timeline Editor | Showcase HUD  |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ HTTP / SSE (qua proxy /api của Vite)
                                    ▼
+-------------------------------------------------------------------------+
| TẦNG 3: ĐIỀU PHỐI RUNTIME & KÊNH SỰ KIỆN                                |
| Runtime Intent Dispatcher (/api/runtime/dispatch, /api/chat/classroom)  |
| SSE /api/roundtable/stream (hiện phát lại fixture)                      |
| Deterministic tools (/api/tools/execute)                                |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Tool invocation
                                    ▼
+-------------------------------------------------------------------------+
| TẦNG 2: HỘI ĐỒNG TÁC NHÂN (ROUNDTABLE COUNCIL)                          |
| Bo · Trí · An · Cô Lam · Assessor · Linh Chi · Minh Khang               |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Contracts & fixtures
                                    ▼
+-------------------------------------------------------------------------+
| TẦNG 1: HỢP ĐỒNG DỮ LIỆU & NGUỒN TRI THỨC                               |
| src/types/pipeline.ts · src/types/lesson.ts · mock/*.json fixtures      |
| Misconception KB (backend/src/data/dre_vector_kb.json)                  |
+-------------------------------------------------------------------------+
```

---

## 2. Chi Tiết Các Tầng

### 2.1. Tầng 1: Hợp đồng dữ liệu & nguồn tri thức (Đã triển khai)

Các hợp đồng trung tâm trong `src/types/pipeline.ts` (fixture tương ứng nằm trong `mock/`, kiểm bằng `npm run validate:fixtures`):

- `CognitiveEventStream`: `videoId`, `videoTitle`, `teacherName`, `subject`, `durationSeconds`, `sourceClip?` (`parentVideoId`, `startSecond`, `endSecond`), `processedBy?` (`mode: 'live' | 'pre_indexed' | 'authored'`, model, độ trễ, `fallbackReason?`), `segments: CognitiveTimelineSegment[]`.
- `DeterministicToolCall`: `toolName` (`tool_verify_vector_algebra` | `tool_query_misconception_kb` | `tool_timeline_collision_checker` | `tool_evaluate_bloom_level`), `input`, `output`, `isValid: boolean | null` (`null` nghĩa là công cụ không phán định được, không có nghĩa là sai), `timestampMs`.
- `AgentReasoningEvent` (hợp đồng backend/fixture): `id`, `runId?`, `eventType` (`thought` | `tool_call` | `tool_result` | `debate_turn` | `cross_check_verdict` | `checkpoint_created`), `agentId: AgentRole`, `agentDisplayName`, `secondTarget?`, `content`, `toolCall?: DeterministicToolCall`, `timestamp` (chuỗi ISO). Hợp đồng này **không** có trường `toolResult` hay `crossCheck` riêng.
- `ReasoningEvent` (kiểu hiển thị của UI, `src/types/reasoning.ts`): `eventType` (`thinking` | `speaking` | `tool_call` | `tool_result` | `cross_check_verdict` | `done`), `agent`, `timestamp` (ms), `phase?`, `toolCall?`, `toolResult?`, `crossCheck?`, `metadata?`. `src/services/reasoningAdapter.ts` chuyển đổi: `thought → thinking`, `debate_turn → speaking`, `checkpoint_created → speaking`. `done` chỉ do marker kết thúc của UI replay hoặc sự kiện SSE `complete` sinh ra. Tên tác tử và tên công cụ không nhận diện được sẽ được giữ nguyên (`unknown_tool`), không đoán.
- **Hai lược đồ giáo án** (cần hợp nhất trong tương lai):
  - `DRELessonSchema` trong `src/types/pipeline.ts` (hợp đồng pipeline): `lesson_id`, `version`, `status` (`draft` | `under_review` | `approved`), `title`, `subject`, `video_url`, `video_duration_s`, `sources`, `parts: LessonPart[]`. Mỗi `LessonPart` gồm `part_id`, `start_s`, `end_s`, `concept`, `context`, `goals`, `source_refs`, `pause_questions` (có `options`, `correct_option_ids`), `scenarios` (`InteractiveScenario`, có `enabled?`).
  - `DRELessonSchema` trong `src/types/lesson.ts` (dùng bởi Timeline Editor): `lesson_id`, `title`, `description?`, `status` (`draft` | `approved` | `archived`), `parts` (`id`, `title`, `duration`, `video_url`, `pause_questions` với `timestamp`/`question`/`expected_answers`/`is_active`, `scenarios` với `is_active`).
- **Điểm dừng (checkpoint)**: `src/utils/lessonAdapter.ts` chuyển giáo án đã duyệt sang `VideoLessonItem` của lớp học trên một trục thời gian tuyệt đối (giây). Mốc chuẩn là 37:13 (`CANONICAL_CHECKPOINT_S = 2233`), giới hạn ở `CANONICAL_MAX_DURATION_S = 5880`. Chỉ các câu hỏi và kịch bản đang bật mới được dùng. Khi giáo viên tắt hoặc xóa mọi câu hỏi dừng, `checkpointTimestamp = NO_CHECKPOINT_S (-1)` và trình phát không dừng bài; mọi nơi so sánh thời gian phải kiểm tra `hasCheckpoint()` trước. Bình luận nền của bài trong thư viện được giữ lại trong `timelineComments`.
- **Chuẩn hóa KaTeX**: `src/utils/sanitizeKatex.ts` lọc các ký tự lỗi đã biết (ví dụ `⃗`) trong fixture trước khi hiển thị.
- **Kho ngộ nhận**: `backend/src/data/dre_vector_kb.json` (nạp bởi `backend/src/services/knowledgeBase.js`) chứa các ngộ nhận điển hình (ví dụ `MISC_VEC_005`: cộng thẳng độ dài thay vì tìm vectơ tổng), làm ngữ cảnh RAG cho tác tử.

### 2.2. Tầng 2: Hội đồng tác nhân phản biện chéo

Thay vì dựa vào một mô hình đơn lẻ, DRE dùng nhiều tác tử có vai trò sư phạm riêng (`AgentRole` = `bo` | `tri` | `linhchi` | `minhkhang` | `an` | `colam` | `assessor`). Mục tiêu của thiết kế là giảm sai sót toán học bằng cách kiểm kết quả tính toán qua công cụ tất định (**Mục tiêu**: chưa có số liệu đo mức giảm).

- **Bo**: bạn học mang định kiến trực quan, đưa ra cách giải tắt sai để kích thích người học phản biện.
- **Trí**: phản biện lập luận của Bo và gọi công cụ kiểm chứng.
- **An**: trợ giảng, đưa gợi ý theo bậc khi người học gặp khó.
- **Cô Lam**: giáo viên, chốt quy tắc vàng sau khi học sinh và Bo đối thoại.
- **Assessor**: đánh giá chất lượng phản biện; Bloom và độ do dự chỉ có giá trị khi backend trả về số đo.
- **Linh Chi, Minh Khang**: bạn học phụ trợ trong luồng chat lớp học.
- **Các pha suy luận**: UI định nghĩa 4 nhãn pha (`PhaseType` = `extract` | `rag` | `roundtable` | `bloom`). Fixture hiện tại (`RT_math_12_vecto_01_part03`) chỉ chứa sự kiện của pha bàn tròn; quy trình đầy đủ 4 pha (trích xuất → truy hồi → bàn tròn → đánh giá) là **Mục tiêu**.

### 2.3. Tầng 3: Điều phối runtime & kênh sự kiện

- **Bộ điều phối (Đã triển khai)**: `POST /api/runtime/dispatch` và `POST /api/chat/classroom` (`backend/src/services/dispatcher.js`). Phân loại ý định theo heuristic, tùy chọn có LLM (`useLLM`), chọn tác tử trả lời và gắn kết quả công cụ vào câu trả lời.
- **Phiên lớp học (Đã triển khai)**: `/api/chat/classroom` nhận `sessionId`. Nếu thiếu, server cấp một id mới và trả về trong phản hồi. Client (`VideoDebateSheet`) giữ id này cho các lượt chat tiếp theo của cùng bài học và chỉ đặt lại khi đổi bài, để gợi ý và lịch sử hội thoại được nối tiếp.
- **SSE `GET /api/roundtable/stream` (Fixture)**: gửi sự kiện `reasoning_event` cho từng phần tử của `mock/mock_reasoning_events.json`, sau đó gửi `complete` kèm `mock/lesson.json`. Route chỉ dùng tham số `streamDelayMs`; client có gửi `videoId`, `partNumber`, `useLLM` nhưng server hiện bỏ qua. Bàn tròn chạy trực tiếp (`backend/src/services/roundtable.js`) chưa được nối vào route này (**Mục tiêu**).
- **Công cụ tất định (Đã triển khai)**, gọi qua `POST /api/tools/execute` với `{ toolName, inputArgs }`:
  - `tool_verify_vector_algebra`: kiểm đại số vectơ bằng tọa độ 3D.
  - `tool_query_misconception_kb`: tra cứu kho ngộ nhận.
  - `tool_timeline_collision_checker`: cảnh báo hai mốc cách nhau dưới 20 giây (trừ mốc nối tiếp chủ ý) hoặc rơi vào 15 giây khởi động.
  - `tool_evaluate_bloom_level`: gắn mức Bloom cho câu hỏi.
  - `tool_check_source_grounding`: đối chiếu một khẳng định với nguồn bài giảng (EPIC 7). Công cụ này có ở backend nhưng chưa nằm trong union `DeterministicToolCall.toolName`.

### 2.4. Tầng 4: Giao diện & bộ điều khiển Showcase

- **Lime Soft Design System**: nền `#F3F8E8`, viền `#E2EAD2`, điểm nhấn `#C8F169`, chữ `#121712`. Cỡ chữ tối thiểu 11px trong các thành phần mới. Độ tương phản theo WCAG AA là **Mục tiêu**; chưa có kiểm toán WCAG.
- **Resizable Splitter**: kéo thả giữa cột Video, Thảo luận AI và Inspector; có pointer capture, các bố cục chọn nhanh và lưu vào `localStorage`.
- **Inspector Drawer**: 4 khối (Điều phối, Ngữ cảnh hiển thị/ẩn, Suy nghĩ ngầm và câu thoại, Đánh giá). Trường không có số đo thật được gắn nhãn "(Chưa đo / Mô phỏng)".
- **War Room**: mặc định dùng `ReplaySource` (fixture); có nút chuyển sang kênh SSE ở trên.
- **Showcase 1-Click (`useShowcaseController`, `ShowcaseHUD`)**: `F2` chạy tour 4 trạm khoảng 23 giây. `?showcase=1` tự khởi chạy đúng một lần và không tự bật lại sau khi người dùng dừng hoặc tạm dừng. Trạm 1 chọn phương án bẫy theo id ổn định và chỉ gửi phản biện sau khi bước trả lời đã xong. Xem [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md).

---

## 3. Mở Rộng Đa Môn Học (EPIC 7)

Mục tiêu là tách Lõi dùng chung khỏi các Gói môn học cắm ngoài.

```
+-------------------------------------------------------------------------+
|                          DRE CORE ENGINE                                |
|  Runtime Dispatcher · Roundtable Council · Collision Checker            |
|  Bloom Evaluator · SSE Gateway · Source Grounding Arbiter               |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Nạp chỉ mục bài giảng
                                    ▼
+-------------------------------------------------------------------------+
|                  GÓI MÔN HỌC (SUBJECT PACKS)                            |
|  [Toán 12]  VID_VECTO_12_TIEN   — có chỉ mục bài giảng                  |
|  [AI / CS]  VID_AI_INTRO_01     — có chỉ mục bài giảng (clip 60s)       |
|  [Ngữ Văn], [Sinh học], ...     — Mục tiêu, chưa có dữ liệu             |
+-------------------------------------------------------------------------+
```

### 3.1. Thành phần backend liên quan (thuộc cụm PR backend; nhánh tích hợp UI không xác minh lại)
1. **Prompt thị giác trung lập** (`backend/src/services/clipExtractor.js`, Issue #28): prompt nhận diện slide, bảng, biểu đồ và văn bản thay vì giả định bảng phấn Toán. Kiểm bởi `backend/test/clipExtractor.test.js`.
2. **Điều phối bám nguồn** (`backend/src/services/dispatcher.js`, Issue #30): persona tạo theo môn học; phân biệt câu hỏi trong nguồn và ngoài nguồn (`not_in_source`); Trí dùng `tool_check_source_grounding` để bác bẫy của Bo dựa trên nguồn có mốc thời gian.
3. **Dữ liệu kiểm chứng đa môn** (Issue #31): `backend/src/data/lesson-index/VID_AI_INTRO_01.json`, `backend/assets/clips/ai-ml-intro-60s.json`, test `backend/test/dispatcher_subject_agnostic.test.js`. Test kiểm rằng câu trả lời cho bài AI không chứa danh sách từ khóa Toán bị cấm, và luồng Toán 12 ở mốc 37:13 vẫn giữ hành vi cũ. Đây là test backend, không phải kiểm thử E2E trên trình duyệt.
