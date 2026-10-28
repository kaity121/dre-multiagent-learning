# Knowledge base DRE: Bài 6 - Vectơ trong không gian

**Nguồn:** Toán 12, tập một, Kết nối tri thức với cuộc sống; Bài 6 thuộc Chương II, trang in 45–59 (trang PDF 47–61).

**Trạng thái:** đã đối chiếu nguồn và tự kiểm tra toán; chờ giáo viên duyệt. Ngộ nhận, phản ví dụ và bài biến thể do tác giả KB biên soạn, chưa có dữ liệu tần suất lỗi học sinh. Không phải bản chép SGK.

## Phạm vi và lưu ý

- Đọc trực tiếp ảnh các trang 45–59; PDF không có lớp văn bản trích xuất được.
- Phát biểu chuẩn được diễn đạt lại, không chép toàn văn sách.
- 20 ngộ nhận là giả thuyết sư phạm tự soạn; không có số liệu tần suất mắc lỗi.
- Tọa độ trong bằng chứng kiểm tra là công cụ nội bộ, không yêu cầu học sinh học Bài 7–8.
- Chưa đối chiếu transcript/video: video timestamp phải để null.
- Không tuyên bố tương thích sẵn với pipeline.ts chưa được cung cấp trong workspace.

**Quy ước đặc biệt của đúng bản SGK:** vectơ không được coi cùng hướng mọi vectơ (tr.48); góc với vectơ không được phép nhận giá trị tùy ý từ 0° tới 180° (tr.55). Tuyệt đối không dùng công thức cos với mẫu bằng 0.

## I. Kiến thức chuẩn hóa

### KN_VEC_001 - Vectơ, độ dài và giá

Vectơ biểu diễn đoạn thẳng có hướng; độ dài là khoảng cách hai đầu. Với vectơ khác không, giá là đường thẳng đi qua hai đầu.

$$\|\overrightarrow{AB}\|=AB$$

**Điều kiện:** Không gán một giá duy nhất cho vectơ không.

**Nguồn:** trang 46; Mục 1: khung định nghĩa và Chú ý.

### KN_VEC_002 - Cùng phương và hướng

Hai vectơ khác không cùng phương khi giá song song hoặc trùng nhau; khi ấy chúng cùng hướng hoặc ngược hướng.

$$\vec u\parallel\vec v$$

**Điều kiện:** Đối với vectơ không dùng quy ước ở KN_VEC_005.

**Nguồn:** trang 47; Mục 1: khung khái niệm.

### KN_VEC_003 - Hai vectơ bằng nhau

Hai vectơ bằng nhau khi cùng hướng và cùng độ dài; điểm đặt không bắt buộc giống nhau.

$$\vec u=\vec v$$

**Điều kiện:** Chỉ bằng độ dài chưa đủ; trường hợp không xét theo quy ước.

**Nguồn:** trang 47; Mục 1: khung khái niệm.

### KN_VEC_004 - Đại diện duy nhất tại điểm gốc

Với một điểm O và một vectơ u cho trước, có đúng một điểm M biểu diễn u với gốc O.

$$\overrightarrow{OM}=\vec u$$

**Điều kiện:** Nếu u bằng không thì M trùng O.

**Nguồn:** trang 47; Chú ý cuối trang.

### KN_VEC_005 - Vectơ không và quy ước hướng

Vectơ có hai đầu trùng nhau là vectơ không, có độ dài 0. Sách quy ước nó cùng hướng, do đó cùng phương, với mọi vectơ; mọi vectơ không bằng nhau.

$$\overrightarrow{AA}=\vec0,\quad\|\vec0\|=0$$

**Điều kiện:** Quy ước cùng hướng không cho phép suy ra một góc duy nhất với vectơ không.

**Nguồn:** trang 48; Hai gạch đầu dòng đầu trang.

### KN_VEC_006 - Tổng và quy tắc ba điểm

Dựng hai vectơ nối đuôi; vectơ từ đầu thứ nhất tới cuối thứ hai là tổng.

$$\overrightarrow{AB}+\overrightarrow{BC}=\overrightarrow{AC}$$

**Điều kiện:** A, B, C tùy ý; khi dời vectơ phải bảo toàn hướng và độ dài.

**Nguồn:** trang 49; Mục 2a: định nghĩa và Nhận xét.

### KN_VEC_007 - Quy tắc hình bình hành

Hai vectơ cạnh xuất phát từ cùng đỉnh của hình bình hành có tổng là vectơ đường chéo xuất phát từ đỉnh đó.

$$\overrightarrow{AB}+\overrightarrow{AD}=\overrightarrow{AC}$$

**Điều kiện:** ABCD là hình bình hành theo thứ tự các đỉnh.

**Nguồn:** trang 49; Nhận xét thứ hai.

### KN_VEC_008 - Tính chất phép cộng

Phép cộng vectơ có tính giao hoán, kết hợp và phần tử không.

$$\vec u+\vec v=\vec v+\vec u;\ (\vec u+\vec v)+\vec w=\vec u+(\vec v+\vec w);\ \vec u+\vec0=\vec u$$

**Điều kiện:** Mọi vectơ trong không gian.

**Nguồn:** trang 50; Chú ý đầu trang.

### KN_VEC_009 - Quy tắc hình hộp

Tổng ba vectơ cạnh xuất phát từ một đỉnh của hình hộp bằng vectơ đường chéo không gian xuất phát từ đỉnh đó.

$$\overrightarrow{AB}+\overrightarrow{AD}+\overrightarrow{AA\prime}=\overrightarrow{AC\prime}$$

**Điều kiện:** ABCD.A′B′C′D′ là hình hộp, các đỉnh có dấu phẩy tương ứng; không cần hình hộp chữ nhật.

**Nguồn:** trang 50; HĐ4 và khung Quy tắc hình hộp.

### KN_VEC_010 - Vectơ đối

Vectơ đối giữ độ dài, đảo hướng khi khác không; tổng một vectơ với vectơ đối bằng không. Vectơ không đối với chính nó.

$$-\overrightarrow{AB}=\overrightarrow{BA};\ \vec u+(-\vec u)=\vec0$$

**Điều kiện:** Đảo hướng không làm đổi độ dài.

**Nguồn:** trang 51; Mục 2b: định nghĩa và Chú ý.

### KN_VEC_011 - Hiệu và quy tắc chung gốc

Trừ một vectơ là cộng vectơ đối. Với hai vectơ chung gốc, lấy đầu cuối của vectơ trừ nối tới đầu cuối của vectơ bị trừ.

$$\vec u-\vec v=\vec u+(-\vec v);\ \overrightarrow{OB}-\overrightarrow{OA}=\overrightarrow{AB}$$

**Điều kiện:** O, A, B tùy ý.

**Nguồn:** trang 51; Khung định nghĩa hiệu và Nhận xét.

### KN_VEC_012 - Nhân số thực với vectơ

Hệ số dương giữ hướng, hệ số âm đảo hướng; độ dài được nhân với trị tuyệt đối của hệ số.

$$\|k\vec u\|=|k|\|\vec u\|$$

**Điều kiện:** Khi nói giữ/đảo hướng theo định nghĩa: k khác 0 và u khác không.

**Nguồn:** trang 53; Mục 3: khung định nghĩa.

### KN_VEC_013 - Tích bằng vectơ không

Nhân với số 0 hoặc nhân vectơ không đều cho vectơ không; tích bằng không khi ít nhất một thừa số bằng không.

$$k\vec u=\vec0\iff k=0\ \text{hoặc}\ \vec u=\vec0$$

**Điều kiện:** Không được khử vectơ không để kết luận hệ số bằng 0.

**Nguồn:** trang 53; Chú ý ngay sau định nghĩa.

### KN_VEC_014 - Điều kiện cùng phương

Khi v khác không, u cùng phương với v khi và chỉ khi có số thực k sao cho u bằng k lần v.

$$\vec u=k\vec v$$

**Điều kiện:** Vectơ làm cơ sở v phải khác không; k có thể bằng 0.

**Nguồn:** trang 53; Chú ý thứ ba.

### KN_VEC_015 - Tính chất nhân số với vectơ

Phép nhân số với vectơ có tính kết hợp, phân phối theo tổng số và theo tổng vectơ; 1 giữ nguyên, -1 tạo vectơ đối.

$$h(k\vec u)=(hk)\vec u;\ (h+k)\vec u=h\vec u+k\vec u;\ k(\vec u+\vec v)=k\vec u+k\vec v$$

**Điều kiện:** h, k thực; u, v tùy ý.

**Nguồn:** trang 53; Chú ý cuối trang.

### KN_VEC_016 - Trọng tâm tam giác

Trọng tâm tam giác được biểu diễn bằng trung bình ba vectơ vị trí với gốc tùy ý.

$$\overrightarrow{OA}+\overrightarrow{OB}+\overrightarrow{OC}=3\overrightarrow{OG}$$

**Điều kiện:** G là trọng tâm tam giác ABC; O tùy ý.

**Nguồn:** trang 54; Ví dụ 8 và Chú ý.

### KN_VEC_017 - Trọng tâm tứ diện

Với G là trọng tâm mặt BCD, trọng tâm I của tứ diện nằm trên AG, chia đoạn theo AI=3IG và có tổng bốn vectơ tới đỉnh bằng không.

$$\overrightarrow{IA}+\overrightarrow{IB}+\overrightarrow{IC}+\overrightarrow{ID}=\vec0$$

**Điều kiện:** I nằm trong đoạn AG; AI, IG trong tỉ số là độ dài. Suy ra IA=-3IG theo vectơ.

**Nguồn:** trang 54; Luyện tập 8 và chú thích Hình 2.19.

### KN_VEC_018 - Góc giữa hai vectơ

Dời hai vectơ khác không về cùng gốc; góc giữa hai tia đại diện nằm từ 0 đến 180 độ. Sách cho phép góc với vectơ không nhận giá trị tùy ý trong khoảng đó.

$$0^\circ\leq(\vec u,\vec v)\leq180^\circ$$

**Điều kiện:** Góc xác định duy nhất khi cả hai vectơ khác không. Không chia cho độ dài bằng 0.

**Nguồn:** trang 55; Mục 4a: khung định nghĩa và Chú ý.

### KN_VEC_019 - Tích vô hướng

Tích vô hướng cho một số bằng tích hai độ dài nhân cos góc; nếu có vectơ không, tích bằng 0 theo quy ước.

$$\vec u\cdot\vec v=\|\vec u\|\|\vec v\|\cos\theta$$

**Điều kiện:** Công thức góc dùng hai vectơ khác không; quy ước xử lý riêng trường hợp không.

**Nguồn:** trang 56; Mục 4b: định nghĩa và Chú ý đầu.

### KN_VEC_020 - Vuông góc, bình phương và công thức cos

Hai vectơ khác không vuông góc khi tích vô hướng bằng 0. Bình phương vô hướng một vectơ bằng bình phương độ dài; suy góc bằng chia cho hai độ dài khi chúng dương.

$$\vec u\cdot\vec v=0\iff\vec u\perp\vec v;\ \vec u\cdot\vec u=\|\vec u\|^2;\ \cos\theta=\frac{\vec u\cdot\vec v}{\|\vec u\|\|\vec v\|}$$

**Điều kiện:** Điều kiện khác không áp dụng cho mệnh đề vuông góc và công thức góc theo SGK; đẳng thức bình phương đúng cho mọi u.

**Nguồn:** trang 56; Ba Chú ý sau định nghĩa.

### KN_VEC_021 - Tính chất tích vô hướng

Tích vô hướng giao hoán, tương thích với nhân số và phân phối đối với phép cộng.

$$\vec u\cdot\vec v=\vec v\cdot\vec u;\ (k\vec u)\cdot\vec v=k(\vec u\cdot\vec v);\ \vec u\cdot(\vec v+\vec w)=\vec u\cdot\vec v+\vec u\cdot\vec w$$

**Điều kiện:** Không suy ra tính kết hợp của ba vectơ; không chia cho vectơ.

**Nguồn:** trang 57; Nhận xét đầu trang.

### KN_VEC_022 - Độ dài tổng và hiệu: công thức suy ra

Khai triển bình phương tổng hoặc hiệu cho công thức độ dài có số hạng chéo.

$$\|\vec u\pm\vec v\|^2=\|\vec u\|^2+\|\vec v\|^2\pm2\vec u\cdot\vec v$$

**Điều kiện:** Đây là hệ quả tự suy ra từ Bài 6, không phải khung định lý chép nguyên văn.

**Nguồn:** trang 56, 57; Suy từ bình phương vô hướng và tính phân phối.

### KN_VEC_023 - Độ dài tổng trong hình lập phương

Trong lập phương cạnh 1, tổng BC và DD′ là vectơ đường chéo của một mặt nên có độ dài căn 2.

$$\overrightarrow{BC}+\overrightarrow{DD\prime}=\overrightarrow{AD\prime};\quad\|\overrightarrow{AD\prime}\|=\sqrt2$$

**Điều kiện:** Cạnh bằng 1 theo ví dụ gốc; cạnh a>0 cho a√2 là bài biến thể.

**Nguồn:** trang 49; Ví dụ 3.

### KN_VEC_024 - Công của lực không đổi

Công của lực không đổi trên độ dời là tích vô hướng lực với độ dời; với độ lớn lực và độ dời cố định, công lớn nhất khi cùng hướng.

$$W=\vec F\cdot\vec s=Fs\cos\theta$$

**Điều kiện:** Lực không đổi; F tính bằng N, s bằng m, công bằng J.

**Nguồn:** trang 57; Vận dụng 4.

## II. 20 ngộ nhận, phản ví dụ và bài biến thể

### MISC_VEC_001 - Độ dài không xác định vectơ

**Bẫy của Bo:** Hai vectơ dài bằng nhau thì bằng nhau.

**Cơ chế lỗi:** Bỏ qua hướng.

**Kiến thức đúng:** Cần cùng hướng và cùng độ dài.

**Căn cứ:** KN_VEC_001, KN_VEC_003; trang 46, 47.

**Phản ví dụ:** AB và AD là hai cạnh vuông góc của hình vuông cạnh 2. Hai độ dài bằng 2 nhưng hai vectơ không bằng nhau.

**Kiểm tra:** Hai cạnh vuông góc, cùng độ dài dương không thể cùng hướng.

**Gợi ý tăng dần:**

1. Em đang so sánh độ dài hay vectơ?
2. Hai mũi tên có cùng hướng không?
3. Nêu đủ hai điều kiện để bằng nhau.

**Bài biến thể EX_VEC_001:** Hình vuông ABCD cạnh 3: AB và AD có bằng nhau theo vectơ không?

**Đáp án nội bộ:** Không.

**Lập luận:** Hai cạnh có độ dài 3 nhưng vuông góc, nên không cùng hướng.

**Tiêu chí vượt qua ngộ nhận:** Nêu được cùng độ dài chưa đủ.; Chỉ ra hướng khác nhau..

### MISC_VEC_002 - Điểm đặt khác vẫn có thể bằng nhau

**Bẫy của Bo:** Hai vectơ bằng nhau phải có cùng điểm đầu.

**Cơ chế lỗi:** Đồng nhất đại diện hình vẽ với vectơ.

**Kiến thức đúng:** Hai đại diện có thể đặt tại các điểm khác nhau.

**Căn cứ:** KN_VEC_003, KN_VEC_004; trang 47, 48.

**Phản ví dụ:** ABCD là hình bình hành không suy biến. AB=DC theo vectơ dù A khác D.

**Kiểm tra:** Với P=0,Q=p,S=q,R=p+q, SR=p=PQ.

**Gợi ý tăng dần:**

1. Hãy xét hai cạnh đối.
2. AB và DC có cùng hướng không?
3. Điểm đặt có trong điều kiện bằng nhau không?

**Bài biến thể EX_VEC_002:** Trong hình bình hành PQRS, hãy tìm một vectơ bằng PQ có điểm đầu S.

**Đáp án nội bộ:** SR.

**Lập luận:** Hai cạnh đối PQ và SR cùng hướng và cùng độ dài.

**Tiêu chí vượt qua ngộ nhận:** Giữ đúng thứ tự đầu cuối..

### MISC_VEC_003 - Cùng phương không đồng nghĩa cùng hướng

**Bẫy của Bo:** Cùng phương thì luôn cùng hướng.

**Cơ chế lỗi:** Bỏ khả năng ngược hướng.

**Kiến thức đúng:** Hai vectơ khác không cùng phương có thể cùng hoặc ngược hướng.

**Căn cứ:** KN_VEC_002; trang 47.

**Phản ví dụ:** u khác không và v=-2u. u,v cùng phương nhưng ngược hướng.

**Kiểm tra:** Với u là mũi tên đơn vị, -4u có chiều ngược và độ dài 4.

**Gợi ý tăng dần:**

1. Cùng phương nói về giá hay chiều?
2. Hệ số -2 làm gì với chiều?
3. Hãy kể cả hai khả năng hướng.

**Bài biến thể EX_VEC_003:** Cho u khác không, v=-4u. Phân loại phương và hướng.

**Đáp án nội bộ:** Cùng phương, ngược hướng.

**Lập luận:** Hệ số âm đảo chiều; độ dài nhân 4.

**Tiêu chí vượt qua ngộ nhận:** Phân biệt được phương và hướng..

### MISC_VEC_004 - Quy tắc ba điểm bị đảo kết quả

**Bẫy của Bo:** AB+BC=CA theo vectơ.

**Cơ chế lỗi:** Đọc ngược đầu cuối của tổng.

**Kiến thức đúng:** AB+BC=AC.

**Căn cứ:** KN_VEC_006; trang 49.

**Phản ví dụ:** A,B,C thẳng hàng theo thứ tự, AB=1, BC=2. AC dài 3 cùng hướng đi, CA ngược hướng.

**Kiểm tra:** Tổng các độ dời liên tiếp là độ dời từ P đến S.

**Gợi ý tăng dần:**

1. Hành trình bắt đầu ở đâu?
2. Sau AB rồi BC, em đến đâu?
3. Vectơ tổng phải có đầu A và cuối nào?

**Bài biến thể EX_VEC_004:** Rút gọn PQ+QR+RS theo vectơ.

**Đáp án nội bộ:** PS.

**Lập luận:** Ghép PQ+QR=PR, rồi PR+RS=PS.

**Tiêu chí vượt qua ngộ nhận:** Chỉ đúng đầu đầu tiên và cuối cuối cùng..

### MISC_VEC_005 - Cộng độ dài thay cho độ dài tổng

**Bẫy của Bo:** Độ dài tổng hai vectơ luôn bằng tổng độ dài.

**Cơ chế lỗi:** Áp dụng phép cộng số vào đại lượng có hướng.

**Kiến thức đúng:** Phải dựng vectơ tổng rồi tính độ dài; bằng tổng độ dài chỉ khi hai vectơ khác không cùng hướng, hoặc có vectơ không.

**Căn cứ:** KN_VEC_006, KN_VEC_007, KN_VEC_023; trang 49.

**Phản ví dụ:** Hai cạnh vuông góc cùng độ dài 1. Độ dài tổng là √2, không phải 2.

**Kiểm tra:** Pythagore: 2²+2²=8; √8=2√2.

**Gợi ý tăng dần:**

1. Em đang cộng vectơ hay cộng độ dài?
2. Dời hai vectơ để dựng đường chéo được không?
3. Dùng định lý nào cho đường chéo hình vuông?

**Bài biến thể EX_VEC_005:** Lập phương ABCD.A′B′C′D′ cạnh 2: tính độ dài BC+DD′ theo vectơ.

**Đáp án nội bộ:** 2√2.

**Lập luận:** BC=AD; AD+DD′=AD′; đường chéo mặt ADD′A′ dài 2√2.

**Tiêu chí vượt qua ngộ nhận:** Dựng đúng tổng.; Giải thích vì sao không cộng 2+2..

### MISC_VEC_006 - Cộng ba cạnh mà thiếu điều kiện hình hộp

**Bẫy của Bo:** AB+AD+AA′ cho đường chéo không gian của mọi cấu hình tám điểm.

**Cơ chế lỗi:** Bỏ giả thiết hình hộp và quan hệ đỉnh.

**Kiến thức đúng:** Quy tắc cần hình hộp với đỉnh tương ứng; tại gốc A dùng AB, AD, AA′.

**Căn cứ:** KN_VEC_009; trang 50.

**Phản ví dụ:** Trong một hình hộp giữ A,B,D,A′, nhưng thay C′ bằng một điểm E khác C′. Tổng vẫn tới C′ ban đầu, không tới E tùy ý.

**Kiểm tra:** Đặt A=0,B=p,D=q,A′=r: BA+BC+BB′=-p+q+r=BD′.

**Gợi ý tăng dần:**

1. Hình đang có giả thiết hình hộp chưa?
2. Ba cạnh đi ra từ đỉnh nào?
3. Đỉnh đối diện tương ứng là đỉnh nào?

**Bài biến thể EX_VEC_006:** Hình hộp ABCD.A′B′C′D′: rút gọn BA+BC+BB′.

**Đáp án nội bộ:** BD′.

**Lập luận:** Áp dụng quy tắc hình hộp tại B với ba cạnh BA, BC, BB′.

**Tiêu chí vượt qua ngộ nhận:** Nêu hình hộp.; Chọn đúng đỉnh đối diện B là D′..

### MISC_VEC_007 - Hiệu chung gốc bị đảo chiều

**Bẫy của Bo:** OA-OB=AB theo vectơ.

**Cơ chế lỗi:** Nhớ công thức nhưng đảo thứ tự.

**Kiến thức đúng:** OA-OB=BA.

**Căn cứ:** KN_VEC_011; trang 51.

**Phản ví dụ:** O=A, A khác B. OA-OB=0-AB=BA.

**Kiểm tra:** Với S=0,P=p,Q=q, hiệu p-q là QP.

**Gợi ý tăng dần:**

1. Vectơ nào bị trừ?
2. Thử đặt O trùng A.
3. Hiệu phải đi từ đầu cuối của vectơ trừ đến đâu?

**Bài biến thể EX_VEC_007:** Rút gọn SP-SQ theo vectơ.

**Đáp án nội bộ:** QP.

**Lập luận:** SP-SQ=SP+QS=QS+SP=QP.

**Tiêu chí vượt qua ngộ nhận:** Xác định đúng vectơ từ Q đến P..

### MISC_VEC_008 - Đổi thứ tự trừ không đổi kết quả

**Bẫy của Bo:** u-v=v-u với mọi vectơ.

**Cơ chế lỗi:** Gán tính giao hoán của phép cộng cho phép trừ.

**Kiến thức đúng:** u-v=-(v-u); hai hiệu chỉ bằng nhau khi u=v.

**Căn cứ:** KN_VEC_010, KN_VEC_011; trang 51.

**Phản ví dụ:** u khác không, v=0. u-v=u còn v-u=-u, khác nhau.

**Kiểm tra:** u-(-u)=2u; -u-u=-2u.

**Gợi ý tăng dần:**

1. Phép trừ số có giao hoán không?
2. Chọn v bằng không thử xem.
3. Hai hiệu liên hệ bằng dấu nào?

**Bài biến thể EX_VEC_008:** Biết AB khác không: so sánh AB-BA và BA-AB.

**Đáp án nội bộ:** Lần lượt 2AB và -2AB.

**Lập luận:** BA=-AB; thay vào hai hiệu.

**Tiêu chí vượt qua ngộ nhận:** Nêu hai kết quả đối nhau..

### MISC_VEC_009 - Độ dài hiệu bằng hiệu độ dài

**Bẫy của Bo:** Độ dài u-v luôn bằng độ dài u trừ độ dài v.

**Cơ chế lỗi:** Bỏ hướng và bỏ tính không âm.

**Kiến thức đúng:** Phải tính vectơ hiệu trước; hiệu hai độ dài không thay thế được độ dài hiệu.

**Căn cứ:** KN_VEC_011, KN_VEC_022; trang 51, 56, 57.

**Phản ví dụ:** u,v vuông góc cùng dài 1. Độ dài u-v là √2 trong khi 1-1=0.

**Kiểm tra:** Bình phương độ dài hiệu bằng 9+16=25.

**Gợi ý tăng dần:**

1. Độ dài có thể âm không?
2. Hai vectơ bằng độ dài có chắc bằng nhau?
3. Dựng u+(-v) trong trường hợp vuông góc.

**Bài biến thể EX_VEC_009:** u,v vuông góc, độ dài 3 và 4. Tính độ dài u-v.

**Đáp án nội bộ:** 5.

**Lập luận:** u và -v vuông góc; Pythagore cho √(9+16)=5.

**Tiêu chí vượt qua ngộ nhận:** Nêu lý do góc vuông.; Không lấy 3-4 hoặc |3-4|..

### MISC_VEC_010 - Vectơ đối có độ dài âm

**Bẫy của Bo:** Vectơ đối của u có độ dài âm.

**Cơ chế lỗi:** Nhầm dấu chỉ hướng với dấu của độ dài.

**Kiến thức đúng:** Vectơ đối có cùng độ dài; dấu âm đảo hướng.

**Căn cứ:** KN_VEC_001, KN_VEC_010; trang 46, 51.

**Phản ví dụ:** u có độ dài 3. -u có độ dài 3, không phải -3.

**Kiểm tra:** Khoảng cách AB=BA=5.

**Gợi ý tăng dần:**

1. Độ dài là khoảng cách có thể âm không?
2. Dấu trừ tác động lên hướng thế nào?
3. So sánh độ dài AB và BA.

**Bài biến thể EX_VEC_010:** Cho AB=5 theo độ dài. Tính độ dài -AB theo vectơ và mô tả hướng.

**Đáp án nội bộ:** Độ dài 5; ngược hướng AB.

**Lập luận:** -AB=BA; BA và AB có cùng khoảng cách hai đầu.

**Tiêu chí vượt qua ngộ nhận:** Tách độ dài và hướng..

### MISC_VEC_011 - Hệ số âm vẫn giữ hướng

**Bẫy của Bo:** k u luôn cùng hướng với u khi k khác 0.

**Cơ chế lỗi:** Chỉ nhớ trường hợp hệ số dương.

**Kiến thức đúng:** Với u khác không: k>0 giữ hướng; k<0 đảo hướng.

**Căn cứ:** KN_VEC_012; trang 53.

**Phản ví dụ:** u khác không và k=-3. -3u ngược hướng u.

**Kiểm tra:** Theo định nghĩa nhân số âm với vectơ, không cần tọa độ.

**Gợi ý tăng dần:**

1. Hệ số đang dương hay âm?
2. So sánh u và -u trước.
3. Nhân tiếp độ dài với 3 có đổi chiều lần nữa không?

**Bài biến thể EX_VEC_011:** IA=-3IG theo vectơ, IG khác không. So sánh hướng và độ dài IA, IG.

**Đáp án nội bộ:** Ngược hướng; IA dài gấp 3 IG.

**Lập luận:** Dấu âm đảo hướng, trị tuyệt đối 3 cho tỉ số độ dài.

**Tiêu chí vượt qua ngộ nhận:** Nêu riêng hướng và hệ số độ dài..

### MISC_VEC_012 - Bỏ trị tuyệt đối khi nhân độ dài

**Bẫy của Bo:** Độ dài ku bằng k lần độ dài u với mọi k thực.

**Cơ chế lỗi:** Bỏ dấu trị tuyệt đối.

**Kiến thức đúng:** Độ dài ku=|k| độ dài u.

**Căn cứ:** KN_VEC_012; trang 53.

**Phản ví dụ:** k=-2, độ dài u=3. Độ dài ku=6, không phải -6.

**Kiểm tra:** 3/2×4=6.

**Gợi ý tăng dần:**

1. Kết quả độ dài có được âm không?
2. Số nào diễn tả mức phóng to không phụ thuộc chiều?
3. Hãy dùng |k|.

**Bài biến thể EX_VEC_012:** Độ dài u=4. Tính độ dài (-3/2)u.

**Đáp án nội bộ:** 6.

**Lập luận:** |-3/2|×4=6.

**Tiêu chí vượt qua ngộ nhận:** Dùng trị tuyệt đối của hệ số..

### MISC_VEC_013 - Tích bằng không thì hệ số bằng không

**Bẫy của Bo:** k u=0 thì k=0.

**Cơ chế lỗi:** Khử vectơ mà chưa biết nó khác không.

**Kiến thức đúng:** k=0 hoặc u=0; chỉ khi u khác không mới suy k=0.

**Căn cứ:** KN_VEC_013; trang 53.

**Phản ví dụ:** k=5,u=0. Tích bằng không dù k không bằng 0.

**Kiểm tra:** Quy ước k0=0 và tính chất tích bằng không ở trang 53.

**Gợi ý tăng dần:**

1. Có trường hợp vectơ ban đầu bằng không không?
2. Thử k=5 và u=0.
3. Cần thêm điều kiện nào để khử u?

**Bài biến thể EX_VEC_013:** Giải k u=0 trong hai trường hợp u khác không và u bằng không.

**Đáp án nội bộ:** u khác không: k=0; u bằng không: mọi k thực.

**Lập luận:** Tách hai trường hợp theo điều kiện tích bằng không.

**Tiêu chí vượt qua ngộ nhận:** Không bỏ trường hợp u=0..

### MISC_VEC_014 - Phân phối thiếu một số hạng

**Bẫy của Bo:** k(u+v)=ku+v với mọi k.

**Cơ chế lỗi:** Chỉ nhân số hạng đầu.

**Kiến thức đúng:** k(u+v)=ku+kv.

**Căn cứ:** KN_VEC_015; trang 53.

**Phản ví dụ:** u=0,v khác không,k=2. Vế trái 2v, vế phải v.

**Kiểm tra:** (-2)×(-3)=6.

**Gợi ý tăng dần:**

1. Có bao nhiêu số hạng trong ngoặc?
2. Thử u bằng không.
3. Hệ số k phải tác động lên vectơ nào?

**Bài biến thể EX_VEC_014:** Rút gọn -2(u-3v).

**Đáp án nội bộ:** -2u+6v.

**Lập luận:** Phân phối -2 vào cả u và -3v.

**Tiêu chí vượt qua ngộ nhận:** Đúng cả hai hệ số và dấu..

### MISC_VEC_015 - Trọng tâm tam giác thiếu hệ số 3

**Bẫy của Bo:** OA+OB+OC=OG khi G là trọng tâm tam giác ABC.

**Cơ chế lỗi:** Nhầm tổng với trung bình.

**Kiến thức đúng:** Tổng bằng 3OG.

**Căn cứ:** KN_VEC_016; trang 54.

**Phản ví dụ:** Chọn O trùng A, tam giác không suy biến. AB+AC=3AG, không phải AG.

**Kiểm tra:** 6/3=2.

**Gợi ý tăng dần:**

1. G chia trung tuyến theo tỉ số nào?
2. Trọng tâm là trung bình mấy đỉnh?
3. Đổi từ trung bình thành tổng cần hệ số gì?

**Bài biến thể EX_VEC_015:** G là trọng tâm tam giác PQR. Biết OP+OQ+OR=6v theo vectơ. Tìm OG.

**Đáp án nội bộ:** OG=2v.

**Lập luận:** 3OG=6v; nhân hai vế với 1/3.

**Tiêu chí vượt qua ngộ nhận:** Sử dụng hệ số 3..

### MISC_VEC_016 - Tỉ số độ dài áp thẳng sang vectơ trọng tâm

**Bẫy của Bo:** I nằm trên AG và AI=3IG theo độ dài nên IA=3IG theo vectơ.

**Cơ chế lỗi:** Giữ tỉ số độ dài nhưng bỏ chiều ngược tại I.

**Kiến thức đúng:** IA=-3IG theo vectơ; AI=3IG theo vectơ.

**Căn cứ:** KN_VEC_017, KN_VEC_012; trang 53, 54.

**Phản ví dụ:** A,I,G theo thứ tự trên đường thẳng, AI=3,IG=1. IA và IG ngược hướng, độ dài tỉ số 3.

**Kiểm tra:** 12/4=3; 3×3=9.

**Gợi ý tăng dần:**

1. Từ I đi tới A và tới G có cùng chiều không?
2. Điểm I nằm ở đâu trên AG?
3. Hệ số cần dấu nào để biểu diễn ngược hướng?

**Bài biến thể EX_VEC_016:** I là trọng tâm tứ diện, G là trọng tâm mặt BCD. Biết AG=12. Tính AI,IG và viết IA theo IG.

**Đáp án nội bộ:** AI=9; IG=3; IA=-3IG theo vectơ.

**Lập luận:** AI=3IG và AG=4IG; suy ra IG=3, AI=9; đảo AI thành IA đổi dấu.

**Tiêu chí vượt qua ngộ nhận:** Đúng tỉ số 3:1.; Đúng dấu âm..

### MISC_VEC_017 - Đảo một vectơ không đổi góc

**Bẫy của Bo:** Góc giữa u và -v luôn bằng góc giữa u và v.

**Cơ chế lỗi:** Nhầm góc đường thẳng với góc vectơ.

**Kiến thức đúng:** Với hai vectơ khác không, đảo một vectơ làm góc θ thành 180°-θ.

**Căn cứ:** KN_VEC_018; trang 55, 56.

**Phản ví dụ:** u,v cùng hướng khác không. Góc ban đầu 0°, sau đảo là 180°.

**Kiểm tra:** 180-60=120.

**Gợi ý tăng dần:**

1. Góc đang xét giữa tia có hướng hay đường thẳng?
2. Thử hai vectơ cùng hướng.
3. Hai góc khi đảo một tia có tổng bao nhiêu?

**Bài biến thể EX_VEC_017:** u,v khác không có góc 60°. Tính góc u,-v.

**Đáp án nội bộ:** 120°.

**Lập luận:** Giữ gốc chung, đảo tia đại diện v; góc mới bù với 60°.

**Tiêu chí vượt qua ngộ nhận:** Giữ đúng khoảng 0°–180°..

### MISC_VEC_018 - Gán góc cố định cho vectơ không

**Bẫy của Bo:** Vectơ không cùng hướng mọi vectơ nên góc với mọi vectơ bắt buộc là 0°.

**Cơ chế lỗi:** Dùng quy ước hướng để suy góc duy nhất.

**Kiến thức đúng:** SGK cho phép góc với vectơ không nhận giá trị tùy ý từ 0° đến 180°; không dùng công thức cos có mẫu bằng 0.

**Căn cứ:** KN_VEC_005, KN_VEC_018, KN_VEC_020; trang 48, 55, 56.

**Phản ví dụ:** u=0,v khác không. Mẫu độ dài u nhân độ dài v bằng 0; không tính được cos bằng phép chia.

**Kiểm tra:** Mẫu bằng 0, phép chia không hợp lệ.

**Gợi ý tăng dần:**

1. Định nghĩa góc đầu tiên yêu cầu gì?
2. Hãy đọc riêng Chú ý về vectơ không.
3. Có thể chia cho độ dài u lúc này không?

**Bài biến thể EX_VEC_018:** Với u=0 và v khác không: tính u·v và hỏi có xác định duy nhất góc bằng thương tích vô hướng không.

**Đáp án nội bộ:** u·v=0; không xác định duy nhất bằng công thức thương.

**Lập luận:** Dùng quy ước tích bằng 0; công thức cos không áp dụng vì mẫu bằng 0.

**Tiêu chí vượt qua ngộ nhận:** Nêu đúng quy ước sách.; Không tính 0/0=0..

### MISC_VEC_019 - Tích vô hướng luôn không âm hoặc là vectơ

**Bẫy của Bo:** Tích vô hướng là vectơ và luôn không âm.

**Cơ chế lỗi:** Nhầm phép nhân vectơ với độ dài; bỏ dấu cos.

**Kiến thức đúng:** Tích vô hướng là số, có thể âm; chỉ u·u luôn không âm.

**Căn cứ:** KN_VEC_019, KN_VEC_020; trang 56.

**Phản ví dụ:** v=-u, độ dài u=2. u·v=-4, một số âm.

**Kiểm tra:** cos120°=-1/2; 2×3×(-1/2)=-3.

**Gợi ý tăng dần:**

1. Tên vô hướng cho biết kiểu kết quả nào?
2. Cos 180° bằng bao nhiêu?
3. So sánh u·u với u·(-u).

**Bài biến thể EX_VEC_019:** Độ dài u=2,v=3,góc 120°. Tính u·v và kiểu kết quả.

**Đáp án nội bộ:** -3; là số thực.

**Lập luận:** 2×3×cos120°=6×(-1/2)=-3.

**Tiêu chí vượt qua ngộ nhận:** Nêu kết quả vô hướng.; Xét dấu của cos..

### MISC_VEC_020 - Bình phương tổng bỏ số hạng chéo

**Bẫy của Bo:** Độ dài u+v bình phương luôn bằng độ dài u bình phương cộng độ dài v bình phương.

**Cơ chế lỗi:** Áp dụng Pythagore khi chưa vuông góc.

**Kiến thức đúng:** Cần thêm 2u·v; bỏ được khi tích vô hướng bằng 0.

**Căn cứ:** KN_VEC_020, KN_VEC_021, KN_VEC_022; trang 56, 57.

**Phản ví dụ:** u=v và độ dài u=1. Vế trái 4; tổng bình phương riêng bằng 2.

**Kiểm tra:** 4+9+6=19.

**Gợi ý tăng dần:**

1. Em đã biết hai vectơ vuông góc chưa?
2. Khai triển (u+v)·(u+v).
3. Hai tích chéo cộng lại thành gì?

**Bài biến thể EX_VEC_020:** Độ dài u=2,v=3,góc 60°. Tính độ dài u+v.

**Đáp án nội bộ:** √19.

**Lập luận:** Bình phương bằng 4+9+2×2×3×1/2=19.

**Tiêu chí vượt qua ngộ nhận:** Có số hạng chéo.; Lấy căn không âm..

## III. Dùng ngay cho Roundtable

JSON là dữ liệu nội dung độc lập, chưa phải LessonScriptPackage của repository. Tầng tích hợp cần ánh xạ vào contract thực tế. Không cần vector database để thử dữ liệu này.

1. Lọc knowledge/misconceptions theo topic, tags hoặc ID.
2. Luôn giữ các knowledge_ids và source_refs khi xây context.
3. Đưa bẫy cho Bo; đưa kiến thức đúng và bằng chứng cho agent kiểm tra.
4. Chỉ hiển thị gợi ý theo mức; giữ đáp án và lời giải trong ngữ cảnh nội bộ.
5. Lưu bản sinh ra ở trạng thái draft; giáo viên duyệt riêng.

### Tình huống ưu tiên

Dùng MISC_VEC_005 + EX_VEC_005 + KN_VEC_006/007/023. Ví dụ gốc SGK cạnh 1; biến thể cạnh 2; demo tổng quát cạnh a>0. Timestamp video chưa xác minh nên để null.

- **bo:** Hai cạnh đều dài a, vậy tổng hai vectơ này dài 2a, đúng không?
- **tri:** Bo đang cộng vectơ hay cộng độ dài? Em thử dời BC để nối đuôi với DD′ nhé.
- **linhchi:** Gợi ý: hãy tìm một vectơ bằng BC có điểm cuối D.
- **colam:** Sau khi em dựng được tổng, hãy nói rõ vì sao được dùng định lý Pythagore.

**Chốt nội bộ:** BC=AD; BC+DD′=AD′; độ dài a√2. AD′ cũng bằng BC′ theo vectơ, nên không bác lời giải tương đương.

### Chạy truy vấn thử

```bash
python query_kb.py --id MISC_VEC_005
python query_kb.py --query "cộng độ dài vectơ" --limit 3
python query_kb.py --id MISC_VEC_018
```

Script xuất context nội bộ cho các agent; không đưa nguyên output này ra giao diện học sinh. Các lượt thoại trong gói chỉ là mẫu biên soạn, không phải log gọi LLM/tool thật.

## IV. Nghiệm thu nội dung

- 24 mục tri thức có nguồn trang cụ thể.
- 20 ngộ nhận liên kết tri thức; mỗi mục có một phản ví dụ, ba gợi ý và tiêu chí giải quyết.
- 20 bài biến thể có đáp án và lập luận.
- Có quy tắc tách thông tin hiển thị học sinh và thông tin nội bộ.
- Có kiểm tra ID, liên kết, số trang và tính toán đại diện.
- Cần giáo viên duyệt độ phù hợp sư phạm trước khi gắn approved.
