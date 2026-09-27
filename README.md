# Nền tảng Học tập Đối chất Đa tác nhân (DRE Multi-Agent Interactive Learning)

> **Dự án Sư phạm Đột phá:** Kết hợp Học tập Đối chất (Peer Debate), Bẻ gãy Ngộ nhận (Misconception Diagnosis), và Chu trình POE / Protégé Effect trên nền tảng Trí tuệ nhân tạo Multi-Agent (GPT-4o).  
> **Định hướng chiến lược:** Hạt nhân nhận thức & kịch bản hội thoại sư phạm cho dự án Lớp học Thực tế Ảo VR 360°.

---

## 📁 Cấu trúc Dự án (Monorepo)

```
DRE-prototype/
├── src/                      # Frontend: React + TypeScript + Tailwind CSS (Vite)
│   ├── components/           # Bộ giao diện Sổ tay Scrapbook & 100% SVG thủ công
│   ├── data/                 # Ngân hàng 8 bài toán cạm bẫy & bài giảng video
│   ├── services/             # Cổng kết nối Backend Multi-Agent API
│   └── types/                # Hệ thống kiểu dữ liệu sư phạm DRE
├── backend/                  # Backend: Node.js Express Multi-Agent Gateway
│   ├── src/
│   │   ├── agents/           # 3 Agents: Bo (Bạn học), Cô Lam (Giáo viên), Assessor (Chấm điểm)
│   │   ├── orchestrator.js   # Bộ điều phối luồng đối chất
│   │   └── openaiClient.js   # Kết nối OpenAI API (GPT-4o & GPT-4o-mini)
│   ├── server.js             # REST API server (Port 3001)
│   ├── .env.example          # Mẫu cấu hình API key
│   └── package.json
├── BAO_CAO_TIEN_DO.md        # Báo cáo tiến độ chi tiết của dự án
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
ASSESSOR_MODEL=gpt-4o-mini
BO_MODEL=gpt-4o-mini
COLAM_MODEL=gpt-4o
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

1. **Trạm 1: Khởi động Video & Bo Đấu Đá (Video Checkpoint):** Xem video bài giảng (hỗ trợ video mẫu hoặc dán bất kỳ link YouTube / MP4 nào). Đến điểm cạm bẫy, video tự dừng để học sinh và bạn Bo cùng tranh luận.
2. **Trạm 2: Vở bài tập DRE (Diagnosis & Rebuttal):** Soi bài tập giải sẵn của Bo, chẩn đoán dòng sai và đưa ra lời giải thích phản biện.
3. **Trạm 3: Thử thách POE (Predict - Observe - Explain):** Cá cược phương án trước khi cô giáo hé lộ bảng phấn giải chi tiết, đối chiếu kết quả và làm quiz sửa sai nhanh.
4. **Trạm 4: Gia sư Protégé (Teaching Effect):** Bo cầu cứu vì chưa hiểu bài, học sinh đóng vai gia sư giảng giải lại để khắc sâu kiến thức.

---

## 🔒 Bảo mật Thông tin (Security Note)

* File `backend/.env` chứa API Key đã được bảo vệ tuyệt đối trong `.gitignore` và **không bao giờ được đẩy lên GitHub**.
* Người dùng mới clone dự án chỉ cần tạo file `backend/.env` từ `.env.example` và điền key của riêng mình.
