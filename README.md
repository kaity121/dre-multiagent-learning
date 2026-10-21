# Nền tảng Học tập Đối chất Đa tác nhân (DRE Multi-Agent Interactive Learning)

> **Dự án Sư phạm Đột phá:** Kết hợp Học tập Đối chất (Peer Debate), Bẻ gãy Ngộ nhận (Misconception Diagnosis), và Chu trình POE / Protégé Effect trên nền tảng Trí tuệ nhân tạo Multi-Agent (OpenMAIC / OpenAI).  
> **Chủ đề bài giảng thực nghiệm:** Toán 12 — Vectơ trong không gian (Bài giảng chuẩn Thầy Nguyễn Phan Tiến).

---

## 📁 Cấu trúc Dự án (Monorepo)

```
DRE-prototype/
├── src/                      # Frontend: React + TypeScript + Tailwind CSS (Vite)
│   ├── components/           # Bộ giao diện Full-Bleed EdTech Room & 100% SVG thủ công
│   │   ├── VideoPlayerSheet.tsx    # Trạm 1: Khung phát video 16:9 & câu hỏi dừng
│   │   ├── VideoDebateSheet.tsx    # Trạm 1: Cột lớp học, chat stream & 4 bạn AI
│   │   ├── WorkingObjectSheet.tsx  # Trạm 2: Vở bài tập chẩn đoán lỗi của Bo
│   │   ├── InteractionCardSheet.tsx# Trạm 2: Sổ tay quy tắc Linh Chi & phản biện
│   │   ├── AlternativeFlowsSheet.tsx# Trạm 3 (POE) & Trạm 4 (Dạy kèm Bo)
│   │   ├── ScenarioPlayerBar.tsx   # Thanh Test Case Demo 4 Trạm (phím F2)
│   │   ├── PreClassLobbyModal.tsx  # Sảnh chờ khảo sát đầu vào 2 bước
│   │   └── MaicPeerClassroomDock.tsx# Ngăn kéo hỏi riêng 4 bạn học AI
│   ├── data/                 # Thư viện ngộ nhận & phân cảnh video 58:00 Thầy Tiến
│   ├── services/             # Cổng kết nối Backend Multi-Agent API
│   ├── types/                # Hệ thống kiểu dữ liệu sư phạm DRE
│   └── index.css             # Typography chuẩn Be Vietnam Pro & JetBrains Mono
├── backend/                  # Backend: Node.js Express Multi-Agent Gateway
│   ├── src/
│   │   ├── agents/           # 6 Agents chuẩn OpenMAIC:
│   │   │   ├── bo.js         # Bo (Bạn học cãi bướng / Sparring partner)
│   │   │   ├── colam.js      # Cô Lam (Giáo viên dẫn dắt Socratic)
│   │   │   ├── ta.js         # TA An (Trợ giảng ghim bài & đo lường)
│   │   │   ├── tri.js        # Trí (Deep Thinker - Đào sâu bản chất)
│   │   │   ├── linhchi.js    # Linh Chi (Note Taker - Ghi chú công thức)
│   │   │   ├── minhkhang.js  # Minh Khang (Inquisitive - Ẩn dụ đời sống)
│   │   │   └── assessor.js   # Assessor (Trọng tài chấm ngầm & Action Layer)
│   │   ├── orchestrator.js   # Bộ điều phối luồng đối chất FSM
│   │   └── openaiClient.js   # Kết nối OpenAI API
│   ├── server.js             # REST API server (Port 3001)
│   ├── .env.example          # Mẫu cấu hình API key
│   └── package.json
├── docs/                     # Kho tài liệu dự án tinh gọn (Xem docs/README.md)
│   ├── KICH_BAN_TEST_CASE_DEMO_5_PHUT_THAY_TIEN.md # Kịch bản Demo 5 phút tự động
│   ├── PHAN_TICH_HANH_VI_VA_DEMO_UIUX_METRICS_AN.md # Nghiên cứu hành vi & Metrics ẩn
│   └── PITCH_DECK_DRE_LEARNING_10_20_30.md # Pitch Deck 10/20/30
├── package.json              # Quản lý thư viện Frontend
└── README.md
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Cấu hình Backend (Node.js)

```bash
cd backend
npm install

# Sao chép file cấu hình mẫu và điền OpenAI API Key của bạn
cp .env.example .env
```

Mở file `backend/.env` và điền key OpenAI:
```env
PORT=3001
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BO_MODEL=gpt-6-sol
ASSESSOR_MODEL=gpt-6-sol
COLAM_MODEL=gpt-6.1-sol
```

Khởi động server Backend:
```bash
npm start
# Server chạy tại: http://localhost:3001
```

---

### 2. Cấu hình Frontend (React Vite)

Mở một cửa sổ Terminal mới tại thư mục gốc:

```bash
# Cài đặt dependencies (nếu chưa cài)
npm install

# Khởi chạy Vite dev server
npm run dev
# Ứng dụng chạy tại: http://localhost:3000
```

---

## 🌟 4 Trạm Sư phạm Cốt lõi của Hệ thống

1. **Trạm 1: Khởi động Video & Bo Đấu Đá (Video Checkpoint):** Xem video bài giảng của Thầy Tiến. Đến điểm dừng phút 37:13, video tự dừng để học sinh chẩn đoán lỗi cộng vectơ và tranh luận cùng Bo.
2. **Trạm 2: Sổ tay bắt lỗi DRE (Diagnosis & Rebuttal):** Soi bài tập giải sẵn của Bo, chẩn đoán bẫy quy tắc trừ & tách độ dài, đối chiếu sổ tay Linh Chi.
3. **Trạm 3: Thử thách POE (Predict - Observe - Explain):** Dự đoán hướng và dấu của biểu thức vectơ ngược chiều $\vec{IA} = -3\vec{IG}$ trước khi mở khóa thực nghiệm.
4. **Trạm 4: Gia sư Protégé (Teaching Effect):** Học sinh đóng vai gia sư giảng lại quy tắc hình hộp cho Bo, tự ra đề thách đấu cả lớp và tổng kết tháp Bloom.

---

## ⚡ Phím tắt & Công cụ Kiểm thử Demo
* **Phím `F2`:** Bật / Tắt thanh **Test Case Demo 4 Trạm** ở trên cùng:
  - Nút **`▶ Chạy tự động liên tục` (1 chạm):** Tự động phát tuần tự qua cả 6 chặng sư phạm.
  - Các nút nhảy nhanh: `1. Video (00:00)`, `2. Dừng (37:13)`, `3. Trạm 2`, `4. Trạm 3`, `5. Trạm 4`.
  - Nút **`💬 Hiện toàn bộ (22 tin)`**: Xem trước toàn bộ thảo luận sinh viên bám sát bảng thầy Tiến.
