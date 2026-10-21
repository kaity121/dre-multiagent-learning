# DRE Backend — gọi GPT API thật (không còn rule-based)

Backend cho cơ chế Diagnose–Repair–Explain: Bo (bạn học) thách thức, Cô Lam (giáo
viên) làm trọng tài, Assessor chấm ngầm — cả ba đều gọi OpenAI thật, không còn
kịch bản viết sẵn.

## Cài đặt

```bash
npm install
cp .env.example .env   # rồi điền OPENAI_API_KEY thật vào .env
```

## Chạy thử nhanh (không cần frontend)

```bash
npm run test:cli
```

Script sẽ hỏi bạn chọn 1 misconceptionId (MISC_001 → MISC_008), rồi cho bạn
nhập câu trả lời và phản biện ngay trên terminal, in ra lời thoại thật của
Bo/Cô Lam/Assessor.

## Chạy server thật (cho frontend gọi vào)

```bash
npm start
```

Server chạy ở `http://localhost:3001` (đổi qua biến `PORT` trong `.env`).

### API

| Endpoint | Method | Body | Ứng với bước trong luồng |
|---|---|---|---|
| `/api/misconceptions` | GET | — | liệt kê các bài có sẵn |
| `/api/session/start` | POST | `{ misconceptionId }` | Bước 1: Cô Lam khởi động checkpoint |
| `/api/session/:id/answer` | POST | `{ cauTraLoi }` | Bước 2-5: Assessor chấm → chọn bẫy → Bo thách thức |
| `/api/session/:id/rebuttal` | POST | `{ phanBien }` | Bước 6-8: Assessor chấm phản biện → concede/hint/chốt |
| `/api/ta/pinned/:id` | GET | — | TA An: Ghim tóm tắt & lời nhắc nhở lớp học |
| `/api/peer/:peerId/chat` | POST | `{ message, topic }` | Chat trực tiếp 1-1 với Trí, Linh Chi, Minh Khang, Bo qua GPT-6 Sol |

Gọi `/rebuttal` lặp lại cho tới khi response trả `"done": true`.

## Cấu trúc thư mục

```
src/
  config.js          model routing (Bo/Trí/Linh Chi/Minh Khang/Assessor dùng gpt-6-sol, Cô Lam dùng gpt-6.1-sol)
  openaiClient.js     wrapper gọi Chat Completions, ép JSON, parse an toàn
  contentLibrary.js   8 bài mẫu MISC_001-008 (có field monHoc để sau này thêm môn khác)
  sessionStore.js     lưu trạng thái phiên — hiện tại in-memory, thay bằng DB khi cần
  agents/bo.js        persona Bo — lượt thách thức + lượt phản ứng sau khi bị bẻ lại
  agents/colam.js     persona Cô Lam — khởi động / can thiệp gợi ý / chốt kiến thức
  agents/ta.js        persona TA An — ghim tóm tắt, nhắc nhở định nghĩa, giữ nhịp học
  agents/tri.js       persona Trí — Deep Thinker đào sâu bản chất toán học & điều kiện biên
  agents/linhchi.js   persona Linh Chi — Note Taker ghi chú công thức chuẩn & sổ tay bỏ túi
  agents/minhkhang.js persona Minh Khang — Inquisitive Mind với ẩn dụ đời sống trực quan
  agents/assessor.js  chấm câu trả lời gốc + chấm phản biện, tách riêng để giữ ổn định
  orchestrator.js     FSM nối tất cả lại theo đúng luồng 8 bước đã thiết kế
server.js             Express API
test-cli.js           chạy thử toàn luồng qua terminal
```

## Điểm cần biết khi mở rộng tiếp

- **Thêm môn khác (nhóm 12-16 đã bàn):** chỉ cần thêm entry mới vào
  `contentLibrary.js` với field `monHoc` khác (VD: "Vật lý", "Ngữ văn"), đổi
  `baiToan`/`giaiThichChuan`/`goiY1`/`goiY2` cho phù hợp — KHÔNG cần đụng vào
  orchestrator hay prompt của Bo/Cô Lam, vì chúng vốn đã domain-agnostic.
- **Learner model xuyên buổi học (nhóm 17-19):** hiện `sessionStore.js` chỉ
  sống trong 1 phiên, không nhớ giữa các lần mở app. Khi làm tới, thay Map
  bằng bảng DB có thêm `userId` + lịch sử các misconceptionId đã gặp.
- **Độ lì của Bo tăng dần theo trình độ:** hiện `loaiBay` được chọn ngẫu
  nhiên 50/50 giữa `shortcut_fallacy`/`edge_case_skeptic` khi đúng. Có thể
  thay bằng logic dựa trên lịch sử thắng/thua của học viên (đọc từ learner
  model) thay vì `Math.random()`.
- **An toàn:** `.env` chứa API key thật — đã thêm vào chỗ để bạn tự thêm
  `.gitignore` (`echo ".env" >> .gitignore`) trước khi push code lên git.
