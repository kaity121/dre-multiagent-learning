# Tổng kết: layout "Tuyến hành trình dọc" và video DRE

Ngày 31/10/2026 · branch `feat/story-spine-layout`. Chưa push, chưa merge.

## Kết quả

- **UI mới đã dựng và chạy được với backend thật.** Học sinh đi trọn hành trình bằng thao tác bấm thật ở 1440×900: xem bài → dừng 37:13 → chọn đáp án → đối chất với Bo → Cô Lam chốt → Trạm 2 → Agent Map.
- **Kiểm tra:** `tsc` sạch, build OK, backend 195/195 test, unit test frontend đều pass, impeccable detect 0 lỗi chặn.
- **Review cuối của impeccable:** mọi mục đã sửa đều được chấm đạt, trừ một điểm phải công khai (xem "Còn mở").
- **Video:** `D:\CODE\Hackathon\hoantien\projects\dre-tvc\output\dre-tvc-v5.mp4`. 79,85 giây, 1920×1080, giọng Blaze, nhạc CC0, −14 LUFS. Toàn bộ ảnh lấy từ app thật.
- **Hướng dẫn sử dụng:** `docs/guide/HUONG_DAN_SU_DUNG.md`, 7 bước, ảnh chụp app thật, kèm ảnh tổng hợp.
- **Hệ thiết kế:** `DESIGN.md` và `PRODUCT.md`, cùng hợp đồng thiết kế ở `.impeccable/surfaces/src-app-tsx.md`.

## Quyết định tôi đã tự chốt (mỗi quyết định một commit, revert được)

| Quyết định | Commit |
|---|---|
| Chọn sai thì Bo hùa theo (`misconception_ally`), giữ đúng FSM 8 bước trong slide, không đổi thành "chọn lại" | `7a3f9a2`, `f86638a` |
| Điểm dừng 37:13 có mục riêng `MISC_VECTO_12_CP3713` ở backend. Mã cũ `MISC_001` là bài đại số. | `46b0a9f` |
| Session bắt đầu chạy nền từ sớm. Timeout: 20 giây cho session, 12 giây cho trả lời và phản biện. Quá giờ thì lặng lẽ dùng dữ liệu demo. | `7a3f9a2` |
| `CHAT_REASONING_EFFORT=low`, trả lời đúng từ 10,4 giây xuống 5,6 giây. Chỉ đặt trong `backend/.env` của máy demo; mặc định giữ nguyên. | `a28478a` |
| Lời mở đầu của Cô Lam tối đa 2 câu, có guard chặn câu lộ đáp án hoặc chứa chỉ thị cho bạn khác | `09c88f0` |
| Tin ghim của Trợ giảng An và câu 37:05 của Trí không còn lộ đáp án | `8c2e4a8`, `36801f3` |
| Màu nhận diện 7 bạn AI được ghi vào DESIGN.md. Cô Lam đổi từ đỏ sang mực trung tính, vì đỏ chỉ dành cho bước sai của Bo. | `969ace3` |

## Còn mở

- **Seed bốc thăm bố cục không xác nhận được.** Lúc bốc thăm, dòng seed reference không được lưu. Việc bốc thăm có diễn ra (chia 3 bố cục, bố cục dẫn đầu là "Tuyến hành trình dọc"), nhưng không kiểm lại được. Theo quy trình impeccable, vì điểm này mà kết luận cuối là "fix" chứ không phải "ship". Chỉ có thể công khai, không sửa được về sau.
- **Độ trễ trên backend thật:** trả lời mất khoảng 5–7 giây, phản biện khoảng 10–12 giây. Trong lúc chờ, thẻ có hiện trạng thái đang chấm.
- **Trạm 2–4 chưa được làm lại.** Nội dung giữ nguyên, chỉ đặt vào khung mới, nên vẫn còn thuật ngữ như "HỘI ĐỒNG THẨM ĐỊNH", "B6", "PROTÉGÉ" (xem các báo cáo UX).
- **Video chưa ai nghe thử.** Phát âm "DRE" mới chỉ kiểm bằng chép lời ngược.
- **276 cảnh báo advisory của impeccable**, phần lớn nằm ở công cụ giáo viên và CSS cũ không còn dùng.

## Chi phí

Khoảng 40 lần gọi LLM (gpt-6-sol, effort low hoặc mặc định) cho kiểm thử, cộng khoảng 40 lần gọi Blaze TTS/STT. Ước tính dưới mức 10 USD. Tôi không xem được hóa đơn nên không có số chính xác.
