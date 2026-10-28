# 📊 BÁO CÁO TỔNG HỢP TIẾN ĐỘ DỰ ÁN DRE LEARNING & CHIẾN LƯỢC HOÀN THIỆN DEMO

> **Định hướng cốt lõi:** *Ưu tiên tính hoàn thiện, liền mạch và sẵn sàng trình diễn trước — Không nhồi nhét tính năng kỹ thuật quá phức tạp, tập trung làm mượt mọi điểm chạm để quay video demo và báo cáo thuyết phục.*

---

## PHẦN I: NHỮNG GÌ ĐÃ TÌM HIỂU & NGHIÊN CỨU TRONG TUẦN QUA

### 1. Kiến trúc Đa tác nhân (Multi-Agent) trong Lớp học Online
* **Mô hình OpenMAIC (Tsinghua arXiv:2409.03512):**
  * Giải quyết triệt để vấn đề lớp học trực tuyến bị "chết" (học sinh dễ mất tập trung, buồn ngủ, bỏ ngang sau 5–10 phút).
  * Xây dựng phòng học tương tác với **4 bạn học AI mang tính cách và vai trò riêng biệt** cùng học với người dùng:
    * **Bo:** Bạn học hay mắc bẫy nhận thức, suy luận tắt (`1 + 1 = 2`), cãi bướng để kích thích tranh luận.
    * **Trí:** Tư duy logic, đào sâu bản chất toán học, bất đẳng thức và điều kiện biên.
    * **Linh Chi:** Ghi chép cẩn thận, tóm tắt công thức chuẩn SGK và mẹo nhớ.
    * **Minh Khang:** Ẩn dụ trực quan sinh động gắn liền với đời sống (cầu thang, máy bay, đường ray).
    * **Trợ giảng An & Cô Lam:** Giữ nhịp lớp học, ghim kiến thức trọng tâm và làm trọng tài chốt quy tắc vàng sư phạm.

### 2. Khung Lý thuyết Sư phạm & Phân tích Logic Kịch bản
* **Thang đo nhận thức Bloom (6 Cấp độ) & Khung ICAP:**
  * Chuyển hóa người học từ thụ động (*Passive*) $\rightarrow$ Tương tác kiến tạo (*Interactive*).
  * Thiết kế chuỗi 4 Trạm học tập liên hoàn leo thang nhận thức:
    * **Trạm 1 (Remember / Evaluate):** Video bám sát Thầy Tiến, câu hỏi dừng tại `37:13` bẻ gãy bẫy cộng độ dài $|a+b| = 1 + 1 = 2$.
    * **Trạm 2 (Analyze):** Đổi vai trò sang "chấm bài" cho Bo, bắt lỗi sai quy tắc trừ vectơ ở Bước 2.
    * **Trạm 3 (Predict / Evaluate - POE):** Dự đoán hướng vectơ trọng tâm, đối chiếu thực nghiệm 3D để rút ra hệ số $k = -3$.
    * **Trạm 4 (Create & Protégé Effect):** Đúc kết bí kíp dạy lại cho Bo và tự tay thiết kế phương trình vectơ trong không gian 3 chiều.
* **Định hướng công nghệ:**
  * Giữ hệ thống tinh gọn, ổn định, **không phụ thuộc vào dịch vụ bên thứ ba phức tạp (đã loại bỏ ý tưởng ElevenLabs)**, tập trung toàn lực vào trải nghiệm mượt mà của 4 Trạm.

---

## PHẦN II: TÌNH HÌNH CODING HIỆN TẠI (HIỆN TRẠNG ỨNG DỤNG)

Ứng dụng hiện đang chạy ổn định tại `http://localhost:3000`, biên dịch `npm run build` thành công 100% không có lỗi TypeScript hay cú pháp.

### 1. Giao diện Người dùng (Frontend Modern SaaS)
* **Hiện đại hóa toàn diện giao diện (Loại bỏ phong cách sổ tay thủ công):**
  * Nền toàn trang chuyển sang **Slate-50 (`#F8FAFC`)** phẳng, tối giản, thanh lịch chuẩn EdTech quốc tế.
  * Header kiểu **Glassmorphism mờ nhẹ**, tích hợp đầy đủ: Logo DRE trong suốt, 4 nút chuyển Trạm, chọn trình độ học viên, đổi bài và nút tạm dừng.
  * Thẻ làm bài phẳng, bo góc hiện đại, không còn băng dính washi tape hay ghim bấm rườm rà.
* **Hệ thống Âm thanh Xúc giác (Web Audio API):**
  * Đã đưa **Nút bật/tắt Âm thanh** trực tiếp lên thanh Header với đèn báo hiệu trực quan.
  * Tích hợp đầy đủ các âm thanh tương tác: chuyển trạm (`playTabSwitch`), tin nhắn pop (`playBubblePop`), chuông cảnh báo câu hỏi dừng (`playCheckpointAlert`), đóng dấu chốt đáp án (`playStampThud`) và chuông mừng hoàn thành (`playSuccessChime`).

### 2. Luồng Tương tác & Trải nghiệm 4 Trạm (Đã kết nối tự nhiên)
* **Trạm 1 (Video & Bo cãi):**
  * Video YouTube Thầy Tiến phát mượt, tự động dừng đúng mốc bẫy Ví dụ 3 (`37:13`).
  * Tính năng **"Thu xuống chat"**: Giải phóng màn hình video để vừa xem bài giảng vừa làm bài.
  * Trí giải thích bản chất sau 350ms, Bo tiếp lời sau 950ms; video tiếp tục phát bình thường không bị đứng hình.
  * Hết bài tại `2:38:23`: Tự động hiện thiệp tạm biệt lớp học và có nút bấm chuyển thẳng sang Trạm 2.
* **Trạm 2 $\rightarrow$ Trạm 3:** Bắt lỗi sai của Bo xong xuất hiện nút: `[🔮 Tiến lên Trạm 3: Thử thách POE ➔]`.
* **Trạm 3 $\rightarrow$ Trạm 4:** Chốt xong nguyên lý POE xuất hiện nút: `[🎓 Tiến lên Trạm 4: Dạy kèm Bo & Tự ra đề ➔]`.
* **Trạm 4 $\rightarrow$ Báo cáo Bloom:** Hoàn thành tạo đề bài có nút: `[✦ Xem Báo cáo Tổng kết Hành trình ➔]`.
* **Khắc phục triệt để lỗi Modal bị kẹt:**
  * Modal "Hỏi riêng 4 bạn AI" đã có **Click Backdrop để đóng**, phím **`Esc` để đóng** và nút **`Đóng`** rõ ràng.
  * Chiều cao modal khống chế tối đa `85vh`, phần header dính chặt (`sticky top-0`) không bao giờ bị trôi khỏi màn hình.
  * Khay bài giảng trong video cũng đã có lớp nền click ra ngoài là đóng ngay lập tức.

### 3. Backend & Cơ chế Chạy Offline Fallback
* Backend Express (`port 3001`) cấu hình model `gpt-6-sol` và `gpt-6.1-sol`.
* **Cơ chế Fallback 100%:** Khi quay demo hoặc báo cáo không có backend/mạng, toàn bộ kịch bản 4 Trạm vẫn tự động chạy hoàn hảo từ dữ liệu kịch bản nội bộ.

---

## PHẦN III: HƯỚNG PHÁT TRIỂN & KẾ HOẠCH HOÀN THIỆN TUẦN TỚI

| STT | Nhiệm vụ trọng tâm | Chi tiết thực hiện | Tiêu chí hoàn thành |
| :---: | :--- | :--- | :--- |
| **1** | **Rà soát & Polish Trải nghiệm Cuộn / Tương tác** | • Kiểm tra lại trên các độ phân giải màn hình khác nhau (Laptop 14", 15.6", màn hình ngoài).<br>• Đảm bảo không có bất kỳ popup hay drawer nào bị che khuất hoặc khó đóng.<br>• Giữ thanh chat luôn tự động cuộn mượt xuống tin nhắn mới nhất. | Trải nghiệm mượt mà, không gặp bất kỳ lỗi kẹt giao diện nào khi bấm nhanh. |
| **2** | **Tập dượt Kịch bản Quay Demo 3–5 Phút** | • Đi theo đúng từng thao tác trong file [`KICH_BAN_TEST_CASE_DEMO_5_PHUT_THAY_TIEN.md`](./KICH_BAN_TEST_CASE_DEMO_5_PHUT_THAY_TIEN.md).<br>• Dùng phím tắt `F2` (Scenario Bar) để nhảy nhanh các mốc quan trọng (0:00 $\rightarrow$ 37:13 $\rightarrow$ 2:38:23) giúp tiết kiệm thời gian quay. | Quay được 1 video demo liên hoàn 4 Trạm sắc nét, đúng thời lượng, lời thoại ăn khớp thao tác. |
| **3** | **Đóng gói Trang Báo cáo Teacher Analytics** | • Đảm bảo khi kết thúc Trạm 4, bảng Báo cáo Bloom mở lên hiển thị đầy đủ kết quả 6 bậc và các dòng nhật ký.<br>• Nút *Sao chép kết quả* và nút *Bắt đầu chu trình mới* hoạt động chuẩn xác để có thể dùng số liệu này cho slide thuyết trình. | Có ảnh chụp / dữ liệu báo cáo trực quan để đưa thẳng vào tài liệu báo cáo/slide. |
| **4** | **Kiểm tra tính độc lập khi Demo Offline** | • Thử nghiệm ngắt mạng hoặc tắt Backend để chắc chắn toàn bộ luồng demo vẫn bấm được từ đầu đến cuối mà không bị lỗi mạng. | 100% an tâm khi mang máy đi thuyết trình trực tiếp trước hội đồng. |

---

## PHẦN IV: CHIẾN LƯỢC HOÀN THIỆN & TỐI ƯU HÓA BẢN DEMO

### 1. Có Nên Làm Script Demo Dài Hơn Không?
👉 **KHÔNG NÊN làm script dài hơn 5 phút!**

* **Lý do thực tế:**
  * **Quy chuẩn chấm điểm / Pitching:** Thầy cô, hội đồng hoặc ban giám khảo thường chỉ có từ **3 đến 5 phút** để xem một video demo. Video dài hơn 5 phút rất dễ bị tua lướt, làm loãng các tính năng "ăn tiền" nhất.
  * **Rủi ro khi quay:** Script càng dài, khả năng bấm nhầm hoặc nói vấp càng cao, khiến bạn phải quay lại nhiều lần.
  * **Quy luật "Value Density" (Mật độ giá trị):** Đỉnh cao của một bản demo không nằm ở thời lượng dài, mà nằm ở việc **mỗi 30 giây người xem lại phải ồ lên trước một tính năng thông minh**.

Thay vì làm script dài hơn, **hướng đi chuẩn xác là làm kịch bản "chắc tay" và "đắt giá" hơn trong đúng khung 4m30s - 5m00s**.

---

### 2. 5 Hướng Hoàn Thiện Đắt Giá Cho Bản Demo (Không Cần Code Thêm Tính Năng)

#### 🎯 Hướng 1: Cấu trúc Video theo công thức "30s Problem ➔ 4m Solution ➔ 30s Proof"
Đừng mở đầu bằng việc bấm thao tác màn hình ngay, hãy dẫn dắt như một sản phẩm thương mại hoàn chỉnh:
* **0:00 - 0:30 (Đặt vấn đề nhức nhối):**
  * *Lời thoại mẫu:* "Học qua video bài giảng dài hơn 2 tiếng thường khiến học sinh cô đơn, thụ động và dễ bỏ cuộc sau 10 phút. DRE Learning ra đời để biến bài giảng thụ động của Thầy Tiến thành một phòng học đối thoại đa tác nhân thời gian thực."
* **0:30 - 4:15 (Trình diễn liên hoàn 4 Trạm):**
  * Trạm 1: Điểm dừng bẫy trực giác $1+1=2$ + Thu xuống chat + Bẻ gãy cãi cùn của Bo.
  * Trạm 2: Đổi vai trò sang làm "người chấm bài" bắt lỗi sai quy tắc trừ.
  * Trạm 3: Thực nghiệm khoa học POE đoán hướng vectơ trọng tâm.
  * Trạm 4: Gia sư nhí dạy lại cho Bo và tự ra đề mới.
* **4:15 - 5:00 (Bằng chứng sư phạm - Proof):**
  * Mở Bảng Teacher Analytics: Show 6 bậc Bloom đạt chuẩn và 6 nhật ký hệ thống làm bằng chứng định lượng thuyết phục hội đồng.

#### 🎯 Hướng 2: Chuẩn bị 2 Kịch bản Linh hoạt (Bản 3 phút & Bản 5 phút)
* **Bản 5 phút (Full Showcase - Để nộp video quay sẵn):** Đi đủ cả 4 Trạm như kịch bản hiện tại.
* **Bản 3 phút (Elevator Pitch - Dùng khi đứng thuyết trình trực tiếp trên lớp):**
  * Nhảy thẳng từ Trạm 1 (`37:13`) $\rightarrow$ Bẻ gãy Bo $\rightarrow$ Nhảy sang Trạm 2 bắt lỗi $\rightarrow$ Mở Báo cáo Bloom cuối. Bỏ qua Trạm 3 để tiết kiệm thời gian, tập trung nói sâu về tính năng tương tác đa tác nhân.

#### 🎯 Hướng 3: Nâng cấp Trải nghiệm Visual khi Quay Màn hình
1. **Bật hiệu ứng Highlight con trỏ chuột:** Dùng các app quay màn hình (như OBS, Camtasia, hoặc phần mềm chuột ScreenPointer) để khi click chuột có vòng tròn phát sáng màu vàng/xanh. Giám khảo nhìn vào sẽ biết ngay bạn đang click vào đâu.
2. **Ẩn thanh công cụ kiểm thử khi quay chính thức:** Nhấn phím `F2` để ẩn thanh Scenario Bar ở đáy màn hình giúp giao diện sạch sẽ 100% như người dùng thật. Chỉ khi cần nhảy mốc thì bấm nhẹ `F2` hoặc dùng phím tắt.
3. **Phóng to trình duyệt lên mức chuẩn (100% hoặc 90%):** Nhấn `Ctrl + 0` trên trình duyệt để tỷ lệ hiển thị đạt độ cân đối và sắc nét nhất.

#### 🎯 Hướng 4: Chuẩn bị Sẵn Bộ "Câu hỏi Phản biện" khi Hội đồng / Thầy cô Hỏi Xoáy
Khi demo xong, ban giám khảo thường sẽ hỏi 2 câu kinh điển này:
1. **Hỏi:** *"Nếu học sinh hỏi câu linh tinh hoặc hỏi ngoài bài thì AI xử lý thế nào?"*
   * **Trả lời:** *"DRE có cơ chế Guardrails: Trợ giảng An và Trí sẽ nhẹ nhàng nhắc nhở và dẫn dắt học sinh quay lại trọng tâm bài toán hiện tại, từ chối trả lời lan man để không làm loãng giờ học."*
2. **Hỏi:** *"AI có bị ảo giác (hallucination) nói sai kiến thức toán không?"*
   * **Trả lời:** *"Hệ thống áp dụng kiến trúc phân tầng: Các công thức cốt lõi (Ground Truth) được ghim từ sách giáo khoa và bài giảng của Thầy Tiến; LLM chỉ đóng vai trò tạo giọng điệu tranh luận và khích lệ tư duy phản biện nên hoàn toàn đảm bảo tính chính xác sư phạm."*

#### 🎯 Hướng 5: Voiceover Script Căn Giờ Chuẩn Xác
* Chuẩn bị sẵn một bản lời thoại thuyết minh (Voiceover Script) căn chuẩn đúng từng giây từ 0:00 đến 4:45 để người quay chỉ việc bật app lên, nhìn theo đọc và bấm chuột là có ngay video demo hoàn hảo.
