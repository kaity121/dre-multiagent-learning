# 🎬 KỊCH BẢN TEST CASE DEMO LIÊN HOÀN 4 TRẠM (5 PHÚT)
**Chủ đề:** Nửa đầu Bài giảng Thầy Nguyễn Phan Tiến (`00:00 -> 58:00`) · Hình học 12 — Vectơ trong không gian  
**Mục tiêu Demo:** Trình diễn tính năng giải quyết lớp học "chết" bằng 24 thảo luận đa tác nhân dày đặc, Điểm dừng Video tại `37:13`, Tính năng Thu xuống Chat, và Luồng sư phạm liên hoàn sang Trạm 2, 3, 4.

---

### 📌 PHẦN 1: Thảo luận Sôi nổi Nửa đầu Video (`00:00 -> 36:45`)

### ⚡ TC_01A: Luồng Thảo luận Sôi nổi 5 Phút Đầu (`00:00 -> 05:30`) Đồng Bộ Thời Gian Thực

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_01A` |
| **Tên Test Case** | Kiểm thử luồng thảo luận sôi nổi thời gian thực bám sát video (Phòng chống Dropout sớm 5 phút đầu) |
| **Module** | Video Player & Interactive Timeline Chat Engine |
| **Tiền điều kiện (Pre-conditions)** | 1. Ứng dụng đã chạy tại `http://localhost:3000`.<br>2. Bài học hiện tại là: Toán 12 — Bài 1.1: Vectơ trong không gian (Thầy Nguyễn Phan Tiến).<br>3. Video đang ở trạng thái bắt đầu (`currentTime = 0:00`). |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1 — Tải trang & kiểm tra trạng thái ban đầu tại `0:00` (Trước khi bấm Play):**
  - **Thao tác:** Nhấn phím `F5` hoặc tải lại trang web.
  - **Kiểm tra UI/UX:**
    - Video ở mốc `0:00`, chưa tự động phát.
    - Cột Chat bên phải: Chỉ hiển thị duy nhất **Thông điệp ghim của Trợ giảng An** (`Ghim trọng tâm Bài 1.1...`) và dòng nhắc trạng thái trống: *"Chưa có tin nhắn nào trước mốc này. Bấm phát video để bắt đầu cùng 4 bạn AI!"*.
    - **Xác minh quan trọng:** Tuyệt đối KHÔNG được rò rỉ bất kỳ bình luận nào của các giây tương lai (`0:08`, `0:22`, `1:18`...). Luồng chat sạch sẽ 100%.

* **Bước 2 — Bấm Play video và quan sát tin nhắn nảy lên đồng bộ theo từng giây thực tế:**
  - **Thao tác:** Bấm nút **Play** trên video (hoặc nhấn phím `Space`). Video bắt đầu đếm giây từ `0:00` chạy dần lên.
  - **Quan sát & Đối chiếu từng mốc giây:**
    - ⏱ **`0:08`** ➔ **Trợ giảng An** nảy tin nhắn chào lớp: *"Chào cả lớp! Hôm nay chúng ta bắt đầu Chương 2 Hình học 12 (SGK mới): Vectơ trong không gian cùng thầy Nguyễn Phan Tiến. Các bạn mở sổ tay chuẩn bị nhé!"*
    - ⏱ **`0:22`** ➔ **Bo** nảy tin nhắn bộc bạch lo lắng: *"Nghe tới 'Hình không gian' kết hợp với 'Vectơ' là thấy hơi hồi hộp rồi đó. Không biết có khác nhiều so với hồi lớp 10 không mọi người?"*
    - ⏱ **`0:38`** ➔ **Minh Khang** nảy tin nhắn giải thích không gian 3D: *"@Bo Yên tâm đi! Hồi lớp 10 mình vẽ vectơ trên một mặt giấy phẳng 2D, còn lên lớp 12 là nhấc mũi tên đó ra không gian 3 chiều như căn phòng học của mình thôi."*
    - ⏱ **`0:55`** ➔ **Trí** nảy tin nhắn tiếp lời thầy Tiến: *"Đúng rồi. Thầy Tiến vừa nhắc ở [0:50] kìa: Gần như toàn bộ định nghĩa, phép cộng, phép trừ vectơ ở lớp 10 đều được giữ nguyên bản chất khi đưa lên không gian 3D."*
    - ⏱ **`1:18`** ➔ **Linh Chi** nảy tin nhắn định nghĩa vectơ: *"Mục 1 [1:18] — Định nghĩa: Vectơ trong không gian là một đoạn thẳng có hướng. Ký hiệu vectơ AB thì A là điểm đầu (gốc), B là điểm cuối (ngọn)."*
    - ⏱ **`1:42`** ➔ **Bo** thắc mắc bẫy nhận thức: *"Khoan đã, nếu hai điểm A và B cố định trong không gian thì đoạn thẳng AB với BA là một, vậy vectơ AB với vectơ BA cũng bằng nhau luôn chứ nhỉ?"*
    - ⏱ **`2:00`** ➔ **Trí** phân biệt: *"@Bo Khác hoàn toàn nhé! Đoạn thẳng thì không phân biệt chiều nên AB = BA. Nhưng vectơ có mũi tên chỉ hướng: AB là đi từ A đến B, còn BA là đi ngược từ B về A."*
    - ⏱ **`2:18`** ➔ **Minh Khang** minh họa trực quan máy bay: *"Ví von thực tế: Chuyến bay từ Đà Nẵng (A) ra Hà Nội (B) hoàn toàn khác với chuyến bay từ Hà Nội (B) về Đà Nẵng (A). Vectơ AB và vectơ BA là hai vectơ đối nhau!"*
    - ⏱ **`2:38`** ➔ **Linh Chi** chốt độ dài: *"Còn về độ dài thì đúng như Bo nghĩ: Độ dài của vectơ AB hay BA đều chính là độ dài đoạn thẳng AB (|vectơ AB| = |vectơ BA| = AB). Thầy đang viết công thức ở [2:35] đó."*
    - ⏱ **`2:55`** ➔ **Bo** gật gù: *"À hiểu rồi! Hướng thì ngược nhau nhưng độ dài thì bằng nhau. Ghi chú lại liền!"*
    - ⏱ **`3:15`** ➔ **Bo** hỏi tiếp khi thầy Tiến vẽ đường thẳng qua A, B: *"Ủa thầy đang vẽ đường thẳng nét đứt đi qua hai điểm A, B kìa. Cái đó gọi là 'Giá của vectơ' hả mọi người? Nghe như cái giá đỡ sách vậy."*
    - ⏱ **`3:32`** ➔ **Linh Chi** trích định nghĩa SGK: *"Chuẩn rồi Bo! Định nghĩa: Đường thẳng đi qua điểm đầu và điểm cuối của vectơ được gọi là GIÁ của vectơ đó."*
    - ⏱ **`3:50`** ➔ **Minh Khang** ví von đường ray xe lửa: *"Tưởng tượng vectơ là đoàn tàu hỏa đang chạy, thì đường thẳng chứa nó chính là đường ray! Đường ray đó chính là giá của vectơ."*
    - ⏱ **`4:08`** ➔ **Trí** giải thích vai trò của Giá: *"Chính nhờ khái niệm 'Giá' này mà lát nữa thầy Tiến mới định nghĩa được hai vectơ cùng phương đó Bo."*
    - ⏱ **`4:25`** ➔ **Linh Chi** tóm tắt 2 trường hợp cùng phương: *"Mục 2 [4:20]: Hai vectơ được gọi là CÙNG PHƯƠNG nếu giá của chúng song song hoặc trùng nhau."*
    - ⏱ **`4:42`** ➔ **Bo** đặt câu hỏi bẫy kinh điển: *"Nếu hai vectơ nằm trên hai đường thẳng chéo nhau trong không gian thì có gọi là ngược hướng không cả lớp?"*
    - ⏱ **`4:58`** ➔ **Trí** bẻ gãy bẫy: *"@Bo Tuyệt đối không nhé! Nếu giá của chúng chéo nhau thì chúng KHÔNG CÙNG PHƯƠNG, mà đã không cùng phương thì KHÔNG ĐƯỢC XÉT cùng hướng hay ngược hướng!"*
    - ⏱ **`5:12`** ➔ **Trợ giảng An** chốt quy tắc vàng sư phạm: *"Trí nói rất chính xác! Quy tắc sống còn của Chương 2: Bắt buộc hai vectơ phải CÙNG PHƯƠNG trước, sau đó mới được xét đến CÙNG HƯỚNG hay NGƯỢC HƯỚNG."*
    - ⏱ **`5:28`** ➔ **Minh Khang** chốt hình tượng giao thông: *"Giống như 2 chiếc xe: Phải chạy trên cùng một con đường hoặc 2 làn đường song song thì mới nói là chạy cùng chiều hay ngược chiều được!"*

* **Bước 3 — Kiểm tra tương tác tua video (Interactive Timestamp Seeking):**
  - **Thao tác:** Nhấp chuột vào nhãn timestamp màu xanh `[4:42]` trong tin nhắn của Bo hoặc `[1:18]` trong tin nhắn của Linh Chi.
  - **Kiểm tra UI/UX:** Video tức thời tua chính xác về giây `282` (`4:42`) hoặc `78` (`1:18`). Toàn bộ bình luận trước mốc thời gian đó vẫn được bảo toàn hiển thị đầy đủ.

---

### ⚡ TC_01B: Người Dùng Nhập Tin Nhắn Vào Khung Chat & Nhận Phản Hồi Đa Tác Nhân (TC_API_USER_INPUT_CHAT_01)

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_01B` (Tương đương mã API: `TC_API_USER_INPUT_CHAT_01`) |
| **Tên Test Case** | Kiểm thử luồng học sinh gửi câu hỏi/bình luận qua Composer và nhận phản hồi đa tác nhân thông minh |
| **Module** | Interactive Classroom & Composer Engine |
| **Tiền điều kiện (Pre-conditions)** | 1. Video đang mở tại bài học Vectơ trong không gian.<br>2. Ô soạn thảo tin nhắn (Composer) ở chân cột chat hiển thị sẵn sàng với placeholder *"Nhập câu hỏi hoặc thảo luận cùng lớp..."*.<br>3. Mốc thời gian video hiện tại là `37:13` (giây `2233`). |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1 — Chọn đối tượng nhận tin (Recipient Target):**
  - **Thao tác:** Bấm vào nút dropdown đối tượng ở đầu thanh soạn tin (mặc định là `🔵 Cả lớp ▾`).
  - **Kiểm tra UI:** Menu mở ra gồm 5 tùy chọn: `🔵 Cả lớp`, `🟠 Bo`, `🟣 Trí`, `🌸 Linh Chi`, `🔷 Minh Khang`. Người kiểm thử để mặc định `🔵 Cả lớp` (hoặc chọn `🟠 Bo`).

* **Bước 2 — Nhập nội dung câu hỏi vào ô Input:**
  - **Thao tác:** Click chuột vào ô văn bản và nhập chính xác chuỗi câu hỏi:  
    `"Tại sao độ dài tổng hai vectơ không bằng tổng hai độ dài (1 + 1 = 2) được vậy mọi người?"`
  - **Dữ liệu đầu vào (Input Payload):**
    ```json
    {
      "input_source": "composer_box",
      "timestamp_attached": 2233,
      "recipient_target": "all",
      "raw_text": "Tại sao độ dài tổng hai vectơ không bằng tổng hai độ dài (1 + 1 = 2) được vậy mọi người?"
    }
    ```

* **Bước 3 — Bấm nút Gửi tin nhắn:**
  - **Thao tác:** Bấm nút xanh `Gửi ➤` (hoặc nhấn phím `Enter` trên bàn phím).

#### Kết Quả Kỳ Vọng UI/UX & Hệ Thống Đa Tác Nhân (Expected Results):
1. **Phản hồi tức thì của người dùng (0ms):**
   - Tin nhắn của học sinh xuất hiện ngay lập tức ở cuối luồng chat:
     - Tác giả: `Bạn` (hoặc tên học sinh đang đăng nhập).
     - Timestamp đính kèm: `37:13`.
     - Nội dung: *"Tại sao độ dài tổng hai vectơ không bằng tổng hai độ dài (1 + 1 = 2) được vậy mọi người?"*.
   - Ô soạn thảo tự động xóa trắng (`clear input`) và giữ nguyên con trỏ sẵn sàng nhập tiếp.

2. **Phản hồi của Tác nhân AI bạn học (Đa tác nhân thời gian thực chạy GPT-6 Sol):**
   - Hệ thống phát âm thanh pop nhẹ (`sound.playBubblePop()`).
   - **Tác nhân 1 — Trí (Độ trễ ~350ms):** Giải thích cặn kẽ bản chất toán học:
     - Tác giả: `Trí` (huy hiệu Bạn học).
     - Timestamp: `37:13`.
     - Lời thoại: *"Bản chất ở [37:13] là bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Ở đây BC và DD' vuông góc nhau trong không gian nên bắt buộc phải gom thành BC' rồi tính độ dài bằng định lý Pytago ra √2 (khoảng 1.41) chứ không thể bằng 1 + 1 = 2 được bạn nhé!"*.
   - **Tác nhân 2 — Bo (Độ trễ ~950ms):** Tiếp lời tạo không khí thảo luận lớp học sôi nổi:
     - Tác giả: `Bo` (huy hiệu Bạn học).
     - Timestamp: `37:13`.
     - Lời thoại: *"Đó cũng là điều tớ từng thắc mắc đấy! Tớ cứ tưởng nhìn thấy hai cạnh bằng 1 thì cộng đại 1 + 1 = 2 luôn cho nhanh, nghe Trí giải thích Pytago mới sáng tỏ!"*.

3. **Tiêu chí Kiểm thử & Sự kiện Hệ thống (Assertion & Event Logs):**
   - Trạng thái: `PASSED`.
   - Độ trễ phản hồi đo lường: `< 400ms` (Trí) và `< 1000ms` (Bo).
   - Event Logs ghi nhận:
     - `learner_question_submitted` (kèm text và timestamp `2233`).
     - `peer_agent_reply_generated` (Agent `Trí` và `Bo`).
     - `auto_scroll_to_bottom` (Luồng chat tự động cuộn mượt xuống đáy).

---

### ⚡ TC_01C: Nhảy Tới Mốc Quy Tắc 3 Điểm & Quy Tắc Hình Hộp (`22:30 -> 33:00`)

| Mã TC | Tên Test Case & Chức năng | Thao tác Kiểm thử Cụ thể (Step-by-step) | Kết quả UI/UX Kỳ vọng | Event Log |
| :--- | :--- | :--- | :--- | :--- |
| **TC_01C** | **Tua nhanh đến các mốc công thức nền tảng trước câu hỏi dừng** | **Bước 1:** Bấm vào timestamp `24:58` trên tin nhắn của Minh Khang.<br>**Bước 2:** Bấm vào timestamp `30:50` trên tin nhắn của Linh Chi. | - Tại `24:58`: Video phát đúng cảnh Thầy Tiến dạy Quy tắc 3 điểm: $\vec{OA} + \vec{AB} = \vec{OB}$ (ví von Nhà $\rightarrow$ Tiệm trà sữa $\rightarrow$ Trường).<br>- Tại `30:50`: Video phát cảnh Quy tắc hình hộp $\vec{AB} + \vec{AD} + \vec{AA'} = \vec{AC'}$. | `timeline_cue_navigated` (`cue_id: cue_4_and_5`) |

---

## 📌 PHẦN 2: "Câu hỏi Dừng" tại `37:13` & Thu Xuống Chat

### ⚡ TC_02A: Tự Động Kích Hoạt Câu Hỏi Dừng Đột Ngột Tại `37:13`

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_02A` |
| **Tên Test Case** | Tự động kích hoạt Điểm Dừng Video (Freeze Checkpoint) tại mốc `37:13` của Thầy Tiến |
| **Tiền điều kiện** | Video phát đến mốc `36:45` hoặc người dùng bấm nút `Câu hỏi dừng` trên thanh công cụ. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1:** Để video phát tự nhiên từ `36:45` qua `37:05` (hoặc bấm nút vàng `Câu hỏi dừng` trên thanh điều khiển dưới video).
* **Bước 2:** Quan sát khoảnh khắc kim giây video chạm đúng mốc `37:13` (giây `2233`).

#### Kết Quả Kỳ Vọng UI/UX:
- Đúng giây `37:13`, video **ngay lập tức dừng phát (Pause)** ngay tại khoảnh khắc Thầy Tiến gạch chéo phép tính sai `1 + 1 = 2` trên bảng.
- Thẻ **"KIỂM TRA NHANH: VÍ DỤ 3"** tự động bật lên nổi bật giữa màn hình video.
- Thẻ hiển thị rõ:
  - Đề bài: Tính độ dài tổng hai vectơ $\vert{}\vec{BC} + \vec{DD'}\vert{}$ trong hình lập phương cạnh bằng 1.
  - 3 Phương án lựa chọn A, B, C (dạng nút Radio).
  - Nút xám `Bỏ qua câu hỏi (Skip)`.
  - Nút xanh dương có icon thu nhỏ `Thu xuống chat · xem video`.
  - Nút xanh lá `Gửi đáp án`.

---

### ⚡ TC_02B: Thao Tác "Thu Xuống Chat" Để Vừa Xem Video Vừa Làm Bài

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_02B` |
| **Tên Test Case** | Thu nhỏ thẻ câu hỏi xuống luồng Chat để giải phóng màn hình video (`dock_quiz_to_chat`) |
| **Tiền điều kiện** | Thẻ câu hỏi dừng đang hiển thị giữa màn hình video tại `37:13`. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1 — Bấm nút Thu xuống chat:**
  - Nhấp chuột vào nút **`Thu xuống chat · xem video`** trên modal câu hỏi.
* **Bước 2 — Quan sát màn hình Video:**
  - Modal biến mất khỏi trung tâm video.
  - Màn hình video hoàn toàn thông thoáng để học sinh theo dõi bài giảng.
  - Một thanh Pill cảnh báo nhỏ gọn xuất hiện phía dưới video:  
    `[⚠️ Câu hỏi đang chờ (37:13) | ↺ Lùi 30 giây | ⤢ Mở lại câu hỏi]`.
* **Bước 3 — Quan sát Cột Chat bên phải:**
  - Khối **`ChatSavedQuizBlock`** được chèn cố định vào luồng chat ngay sau tin nhắn của Trí `[37:05]`.
  - Thẻ hiển thị trọn vẹn tiêu đề, 3 nút Radio A, B, C, nút Bỏ qua và nút Gửi.
* **Bước 4 — Bấm `↺ Lùi 30 giây`:**
  - Video tua lại mốc `36:43` và tiếp tục phát để học sinh nghe lại đoạn thầy Tiến phân tích.

---

### ⚡ TC_02C: Nhánh Kiểm Thử Bỏ Qua Câu Hỏi (Skip Branch - Chẩn Đoán Lỗ Hổng)

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_02C` |
| **Tên Test Case** | Học sinh chọn Bỏ qua câu hỏi và hệ thống đánh dấu trạng thái SKIPPED |
| **Tiền điều kiện** | Khối câu hỏi đang hiển thị trên video hoặc trong khung chat. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1:** Bấm nút **`Bỏ qua câu hỏi (Skip)`** (trên video hoặc trong chat).
* **Kết Quả Kỳ Vọng UI/UX:**
  - Thẻ câu hỏi cập nhật trạng thái: Có nhãn *"Bạn đã bỏ qua câu hỏi này"* ở góc trái.
  - Bên dưới thẻ xuất hiện bong bóng phản hồi của học sinh: *"Bỏ qua câu này"*.
  - Các nút Radio vẫn cho phép học sinh tích chọn lại và bấm `Gửi đáp án` bất cứ lúc nào.
  - Video được mở khóa cho phép phát tiếp.
  - Event Log sinh ra: `create_review_task ➔ VID_VECTO_12 (Test nhánh Skip: skipped_not_mastered)`.

---

### ⚡ TC_02D: Chọn Đáp Án A & Đối Chất Bẻ Gãy Bẫy Cùng Bo (Level 5 Bloom - Evaluate)

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_02D` |
| **Tên Test Case** | Chọn đáp án chính xác A và tương tác đối chất phản biện bẻ gãy bẫy Bo cãi bướng |
| **Tiền điều kiện** | Thẻ câu hỏi dừng đang ở trạng thái chờ trả lời. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1 — Chọn đáp án A:**
  - Tích chọn Radio **Đáp án A:** `Thay DD' = CC' để nối tiếp: |BC + CC'| = |BC'| = √(1² + 1²) = √2`.
* **Bước 2 — Bấm Gửi đáp án:**
  - Bấm nút xanh lá **`Gửi đáp án`**.
* **Bước 3 — Màn hình đối chất xuất hiện:**
  - Màn hình chuyển sang giao diện Đối chất với **Bo**. Bo cãi bướng: *"Ủa sao phải đổi DD' thành CC' cho rắc rối vậy? Đề cho cạnh bằng 1 thì |BC| = 1, |DD'| = 1, cộng thẳng 1 + 1 = 2 luôn cho rồi!"*.
* **Bước 4 — Bấm chọn Sticker Phản biện số 1:**
  - Nhấp chuột vào thẻ **Sticker 1:** *"Cấm tách \|a + b\| = \|a\| + \|b\|! Phải thế DD' = CC' để gom về 1 vectơ BC' rồi mới tính Pytago ra √2"*.
* **Bước 5 — Bo tâm phục khẩu phục & Cô Lam chốt Quy tắc vàng:**
  - Bo gãi đầu nhận sai: *"À ra vậy! Vuông góc nên phải Pytago chứ không được cộng đại số... Giờ thì tớ thấm rồi!"*.
  - **Trợ giảng Cô Lam** đóng dấu huy hiệu: **QUY TẮC VÀNG SƯ PHẠM ĐÃ MỞ KHÓA**.
  - Video tự động phát tiếp.
  - Event Log sinh ra:  
    `create_learning_record ➔ VID_VECTO_12 (Bloom: Evaluate | Sharp Rebuttal)`  
    `update_mastery_state ➔ MASTERED (Đã mở khóa quy tắc vàng Cô Lam)`.

---

### ⚡ TC_02E: Kết Thúc Video Bài Giảng Tại `2:38:23` (9503s) & Tự Động Chuyển Trạm 2

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_02E` |
| **Tên Test Case** | Kết thúc trọn vẹn 2 giờ 38 phút bài giảng Thầy Tiến, hiển thị thiệp tạm biệt lớp học và đếm ngược 3s chuyển sang Trạm 2 |
| **Tiền điều kiện** | Video chạy tới mốc `2:38:23` (9503s) hoặc người kiểm thử bấm nút `🎬 Hết video (2:38:23)` trên thanh Scenario Player Bar. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1 — Kích hoạt mốc kết thúc bài giảng:**
  - Bấm nút **`🎬 Hết video (2:38:23)`** trên thanh Scenario Player Bar ở đáy màn hình (hoặc bấm tổ hợp phím `F2` để mở thanh công cụ và tua tới cuối video).
* **Bước 2 — Quan sát UI/UX luồng kết thúc bài:**
  - Video dừng phát khi hoàn tất 9503 giây (`2:38:23`).
  - Dưới chân luồng chat, **Thiệp Tạm Biệt & Chúc Mừng** xuất hiện với avatar Bo vẫy tay và lời dặn dò của Linh Chi:
    - *"Buổi học Vectơ 12 cùng Thầy Tiến đã kết thúc trọn vẹn! Cảm ơn bạn đã đồng hành cùng lớp học."*
  - Đồng hồ đếm ngược **3 giây** tự động hiển thị: `[Tự động chuyển Trạm 2 sau 3... 2... 1...]`.
  - Phát âm thanh lật trang sách (`sound.playPageFlip()`).
  - Giao diện mượt mà chuyển hướng sang **Trạm 2: Sổ tay bắt lỗi sai**.
* **Tiêu chí Kiểm thử:**
  - Tuyệt đối KHÔNG hiển thị thiệp kết thúc trước mốc `2:38:23`.
  - Chuyển trạm tự động sau 3 giây chính xác.

---

### ⚡ TC_03: Trạm 2 — Sổ Tay Bắt Lỗi Sai (Level 4 Bloom - Analyze)

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_03` |
| **Tên Test Case** | Học sinh bắt lỗi sai quy tắc hiệu trong bài làm của Bo tại Ví dụ 10 |
| **Tiền điều kiện** | Hoàn thành Trạm 1 hoặc bấm chuyển sang tab `Trạm 2: Sổ tay bắt lỗi`. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1:** Bấm vào tab **`Trạm 2: Sổ tay bắt lỗi`** trên thanh điều hướng đỉnh trang.
* **Bước 2:** Bấm mở **Sổ tay Linh Chi** để xem khẩu quyết *"Chung đầu - Lộn ngược"* của Thầy Tiến ở phút `57:02`.
* **Bước 3:** Quan sát bài giải Ví dụ 10 trong vở của Bo. Nhấp chuột chọn dòng **Bước 2**:  
  `B'C = AB' - AC` (Bo viết xuôi theo thói quen).
* **Bước 4:** Nhập nội dung chẩn đoán sửa thành `AC - AB' = c - a - b` và bấm nút **`[Gửi phân tích]`**.

#### Kết Quả Kỳ Vọng UI/UX & Event Log:
- Hệ thống báo: **BẮT TRÚNG LỖI SAI!**
- Điểm chẩn đoán nhận thức đạt **Level 4 Bloom: Analyze (Thorough Diagnosis)**.
- Event Log: `create_learning_record ➔ ALG_VECTO_SUB (Bloom: Analyze | Thorough Diagnosis)`.

---

### ⚡ TC_04: Trạm 3 — Đoán Kết Quả POE (Level 5 Bloom - Evaluate)

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_04` |
| **Tên Test Case** | Đoán hướng và độ dài vectơ trọng tâm tứ diện theo mô hình POE (Predict - Observe - Explain) |
| **Tiền điều kiện** | Bấm chuyển sang tab `Trạm 3: Đoán kết quả (POE)`. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1 (Predict - Dự đoán):** Tại cột bên trái, bấm chọn **Phe Trí** ($\vec{IA} = -3\vec{IG}$ vì hai vectơ ngược hướng, hệ số âm $k = -3$).
* **Bước 2 (Observe - Thực nghiệm):** Bấm nút mở **Hộp thực nghiệm kiểm chứng 3D**, quan sát mô hình vector trọng tâm triệt tiêu bằng $0$.
* **Bước 3 (Explain - Kết luận):** Mở khóa Bước 3 bên phải và chốt định lý cùng Linh Chi.

#### Kết Quả Kỳ Vọng UI/UX & Event Log:
- Đạt danh hiệu **Nhà thực nghiệm chuẩn xác**.
- Điểm chẩn đoán đạt **Level 5 Bloom: Evaluate (Ngược hướng k = -3)**.
- Event Log: `create_learning_record ➔ POE_VECTO_DIR (Bloom: Evaluate | Ngược hướng k = -3)`.

---

### ⚡ TC_05: Trạm 4 — Dạy Kèm Bo (Protégé) & Tự Ra Đề (Level 6 Bloom - Create)

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_05` |
| **Tên Test Case** | Đúc kết bí kíp dạy lại cho Bo và tự thiết kế bài toán đẳng thức không gian 3D |
| **Tiền điều kiện** | Bấm chuyển sang tab `Trạm 4: Dạy kèm Bo`. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1 (Nhiệm vụ 1 — Protégé Retention Boost):**
  - Tại cột trái, click chọn thẻ bí kíp của **Minh Khang (Xanh Blue - 3 chiều phòng học)** hoặc **Linh Chi (Hồng Pink - Công thức quy tắc hình hộp)** để lưu vào cẩm nang cho Bo.
  - UI hiển thị nhãn: `Protégé Retention Boost: ACTIVE`.
* **Bước 2 (Nhiệm vụ 2 — Tự thiết kế bài toán Level 6 Create):**
  - Tại cột phải, click vào ô nhập công thức hoặc bấm nút bấm nhanh **`[Mẫu chuẩn]`**.
  - Nội dung đẳng thức: `AB + AD + AA' = AC'`.
  - Bấm nút **`[Gửi đề thách đấu cả lớp ➔]`**.

#### Kết Quả Kỳ Vọng UI/UX & Event Log:
- Cả 4 bạn AI vỗ tay tán thưởng bài toán chuẩn xác.
- Đạt cấp độ nhận thức tối cao: **Level 6 Bloom: Create (Passed Validation)**.
- Event Log: `create_learning_record ➔ CUSTOM_EQ_3D (Bloom: Create | Passed Validation)`.

---

### ⚡ TC_06: Báo Cáo Chẩn Đoán Bloom & Thống Kê Giảng Viên (Teacher Analytics View)

| Thuộc tính | Chi tiết Đặc tả Test Case |
| :--- | :--- |
| **Mã Test Case** | `TC_06` |
| **Tên Test Case** | Xuất Báo cáo Sư phạm Tổng kết Toàn diện 4 Trạm & Đối chiếu 6 Cấp độ Bloom |
| **Tiền điều kiện** | Đã thực hiện xong các bước ở Trạm 1, 2, 3, 4. |

#### Các Bước Thực Hiện Chi Tiết (Test Steps):
* **Bước 1:** Tại cuối màn hình Trạm 4, bấm nút xanh đậm **`[✦ Hoàn thành 4 Trạm · Xem Tổng kết Hành trình]`**.
* **Bước 2:** Modal **Báo cáo Sư phạm & Hồ sơ Bloom (Teacher Analytics View)** mở ra toàn màn hình.
* **Bước 3:** Kiểm tra đối chiếu bảng 6 cấp độ Bloom và danh sách 6 sự kiện Agent Action Layer.

#### Kết Quả Kỳ Vọng UI/UX (Khớp 100% Báo Cáo):
- Đủ 6 cấp độ Bloom:
  - Level 1 & 2: `CONSOLIDATED`
  - Level 3: `CONSOLIDATED`
  - Level 4: `THOROUGH`
  - Level 5: `SHARP_REBUTTAL`
  - Level 6: `PASSED`
  - Protégé Retention Boost: `ACTIVE`
- Đủ 6 dòng Agent Action Logs theo đúng thứ tự thời gian.

```json
{
  "test_case_id": "TC_API_USER_INPUT_CHAT_01",
  "test_name": "Kiểm thử luồng người dùng nhập tin nhắn và nhận phản hồi đa tác nhân thời gian thực",
  "module": "Interactive Classroom & Composer Engine",
  "pre_conditions": {
    "session_id": "SESSION_VECTO_12_THAY_TIEN",
    "learner_name": "Minh Khuê",
    "current_video_timestamp": 2233,
    "active_checkpoint": "37:13",
    "selected_recipient": "all"
  },
  "user_input_payload": {
    "input_source": "composer_box",
    "timestamp_attached": 2233,
    "recipient_target": "all",
    "raw_text": "Tại sao độ dài tổng hai vectơ không bằng tổng hai độ dài (1 + 1 = 2) được vậy mọi người?",
    "cleaned_text": "Tại sao độ dài tổng hai vectơ không bằng tổng hai độ dài (1 + 1 = 2) được vậy mọi người?"
  },
  "expected_system_actions": [
    {
      "step": 1,
      "action": "append_user_message_to_stream",
      "expected_output": {
        "id": "user_msg_1729150000",
        "author": "Bạn",
        "role": "classmate",
        "second": 2233,
        "text": "Tại sao độ dài tổng hai vectơ không bằng tổng hai độ dài (1 + 1 = 2) được vậy mọi người?"
      }
    },
    {
      "step": 2,
      "action": "trigger_peer_agent_response",
      "delay_seconds": 0.35,
      "responding_agent": "Trí",
      "expected_output": {
        "id": "peer_reply_tri_1729150000",
        "author": "Trí",
        "role": "classmate",
        "second": 2233,
        "text": "Bản chất ở [37:13] là bất đẳng thức tam giác: |a + b| ≤ |a| + |b|, dấu bằng chỉ xảy ra khi hai vectơ cùng hướng. Ở đây BC và DD' vuông góc nhau trong không gian nên bắt buộc phải gom thành BC' rồi tính độ dài bằng định lý Pytago ra √2 (khoảng 1.41) chứ không thể bằng 1 + 1 = 2 được bạn nhé!"
      }
    },
    {
      "step": 3,
      "action": "trigger_peer_agent_debate_followup",
      "delay_seconds": 0.95,
      "responding_agent": "Bo",
      "expected_output": {
        "id": "peer_reply_bo_1729150000",
        "author": "Bo",
        "role": "classmate",
        "second": 2233,
        "text": "Đó cũng là điều tớ từng thắc mắc đấy! Tớ cứ tưởng nhìn thấy hai cạnh bằng 1 thì cộng đại 1 + 1 = 2 luôn cho nhanh, nghe Trí giải thích Pytago mới sáng tỏ!"
      }
    }
  ],
  "assertion_results": {
    "status": "PASSED",
    "latency_ms": 342,
    "event_logs_recorded": [
      "learner_question_submitted",
      "private_or_public_message_broadcasted",
      "peer_agent_reply_generated",
      "ta_scaffolding_triggered"
    ]
  }
}
```
