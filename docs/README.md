# 📚 Trung tâm Tài liệu Dự án DRE Learning

> Thư mục này tập hợp các tài liệu sư phạm, kịch bản test case và slide thuyết trình chuẩn hóa của dự án **Nền tảng Học tập Đối chất Đa tác nhân (DRE Multi-Agent Interactive Learning)**.

---

## 📌 Danh mục Tài liệu Hoạt động (Active Documentation)

### 1. 🎬 Kịch bản Demo & Test Case Sư phạm
* **[KICH_BAN_TEST_CASE_DEMO_5_PHUT_THAY_TIEN.md](./KICH_BAN_TEST_CASE_DEMO_5_PHUT_THAY_TIEN.md)**
  * **Kịch bản Demo 5 phút (Toán 12: Thầy Nguyễn Phan Tiến):** Hướng dẫn bấm 1 chạm (hoặc phím F2) để chạy tự động liên hoàn qua 4 trạm:
    - *Trạm 1 (00:00 -> 37:13):* Bắt lỗi bẫy cộng vectơ $\vec{BC} + \vec{DD'} \neq \vec{BD'}$ và đối chất cùng Bo.
    - *Trạm 2:* Vở bài tập chẩn đoán bẫy quy tắc trừ & tách độ dài.
    - *Trạm 3:* Thử thách POE dự đoán vectơ ngược chiều $\vec{IA} = -3\vec{IG}$.
    - *Trạm 4:* Dạy kèm Bo quy tắc hình hộp và tổng kết tháp Bloom.

### 2. 🧠 Nghiên cứu Hành vi Sư phạm & Metrics Ẩn
* **[PHAN_TICH_HANH_VI_VA_DEMO_UIUX_METRICS_AN.md](./PHAN_TICH_HANH_VI_VA_DEMO_UIUX_METRICS_AN.md)**
  * Phân tích hành vi đối chất của học sinh THCS/THPT.
  * 7 chỉ số đo lường ngầm của Trợ giảng AI An (Hidden Pedagogical Metrics: Hesitation Index, Rebuttal Mastery Rate, Scaffolding Needs...).

### 3. 🎯 Pitch Deck Thuyết trình Dự án
* **[PITCH_DECK_DRE_LEARNING_10_20_30.md](./PITCH_DECK_DRE_LEARNING_10_20_30.md)**
  * Kịch bản Pitch Deck 10 slides chuẩn Guy Kawasaki (10/20/30 Rule) trình bày bài toán ngộ nhận toán học và mô hình xã hội học tập đa tác nhân (Multi-Agent Classroom).

### 4. 👥 Phân công Trách nhiệm & Quyền sở hữu Mã nguồn (Codeowners)
* **[TEAM_RESPONSIBILITIES_AND_OWNERSHIP.md](./TEAM_RESPONSIBILITIES_AND_OWNERSHIP.md)**
  * Phân định module và luồng làm việc giữa 4 thành viên: Blu (`@blu1606` - Lead & Reviewer), Khuê (`@kaity121` - UI/UX Lead), Hiếu (`@aprlx21` - Video Scriptwriting) và An (`@presentisperfect` - Online Response & Context).
  * Quy tắc review PR tự động thông qua [`.github/CODEOWNERS`](../.github/CODEOWNERS).

### 5. 🏗️ Kiến trúc Hệ thống AISDLC & Danh mục Epics (Vibe Coding Roadmap)
* **[AISDLC_ARCHITECTURE_AND_EPICS.md](./AISDLC_ARCHITECTURE_AND_EPICS.md)**
  * Đặc tả hệ thống Tools & Skills (Factual Grounding & Vector Math Verifier).
  * Luồng hoạt động End-to-End 4 giai đoạn từ Ingestion đến Classroom.
  * Danh mục 14 Sub-issues phân rã theo 6 Epics sẵn sàng cho song song hóa vibe coding.

---

## 🧭 Quy định Quản lý Tài liệu
* Chỉ lưu trữ các tài liệu bám sát kiến trúc và giao diện hiện hành.
* Các báo cáo tuần tạm thời hoặc bản vẽ nháp cũ đã được tinh lọc để giữ repository tinh gọn, dễ bảo trì.
