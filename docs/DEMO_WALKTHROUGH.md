# Huong Dan Trinh Dien 1-Click Va Kich Ban 4 Tram (Showcase Walkthrough)

Tai lieu nay cung cap quy trinh van hanh bo dieu khien Showcase tu dong 1-Click (Issue #17) va kich ban thuyet trinh chi tiet qua 4 Tram trong he thong DRE Multi-Agent Interactive Learning.

---

## 1. Huong Dan Van Hanh 1-Click

He thong ho tro cac phuong thuc kich hoat va dieu khien linh hoat danh cho nguoi demo, giang vien va chuyen gia danh gia:

### 1.1. Cac phuong thuc kich hoat
- **Phim tat toan cuc F2**: Nhan phim `F2` o bat ky man hinh nao de lap tuc khoi chay chu trinh trinh dien 4 Tram tu dong. Nhan lai `F2` de dung demo va tro ve trang thai ban dau.
- **Nut bam tren thanh Header**: Nhan nut **Demo 1-Click (F2)** co bieu tuong tia set o goc phai thanh tieu de. Nut co mau xanh chanh (#C8F169), chu den (#121712) va chuyen sang trang thai hoat dong khi dang demo.
- **Tham so URL tu dong**: Truy cap truc tiep dia chi `http://localhost:3000/?showcase=1` de trinh duyet tu dong khoi chay kịch ban ngay sau khi tai trang.

### 1.2. Cac phim dieu huong trong qua trinh trinh dien
- **Phim Space (Khoang trang)**: Tam dung (Pause) hoac Tiep tuc (Resume) dong thoi gian cua Tram hien tai. Bo dem nguoc va thanh tien trinh se dong bang tam thoi.
- **Phim Escape (Esc)**: Thoat ngay lap tuc khoi che do Showcase, dong thanh Mini-HUD va dua he thong ve trang thai tieu chuan.
- **Nut "Tram ke tiep" tren Mini-HUD**: Bo qua phan thoi gian con lai cua tram hien tai va nhay ngay sang tram ke tiep.

---

## 2. Kich Ban Thuyet Trinh 4 Tram (Timing & Pitching Script)

Tong thoi luong demo: **23 giay**. Kich ban duoc chia thanh 4 giai doan noi tiep voi loi thoai thuyet minh (Pitching Script) danh cho nguoi trinh bay.

```
00:00 ─── Tram 1: Lop hoc tuong tac & Phan bien ─────── 00:07
00:07 ─── Tram 2: Multi-Agent War Room ──────────────── 00:13
00:13 ─── Tram 3: Multi-Track Timeline Editor ───────── 00:18
00:18 ─── Tram 4: Danh gia nhan thuc Thap Bloom ─────── 00:23 (Hoan tat)
```

---

### Tram 1: Lop hoc tuong tac & Phan bien bay nhan thuc (00:00 - 00:07)

- **Thoi luong**: 7 giay.
- **Hanh dong he thong**:
  1. Giao dien dua ve che do Lop hoc (`activeStudioView = 'classroom'`, `station = 1`).
  2. Video nhay den diem dung 37:13 (Vi du 3 hinh lap phuong cua Thay Tien). Hop thoai cau hoi trac nghiem KaTeX xuat hien tren khung hinh.
  3. Tai giay thu 2.2: He thong tu dong chon Phuong an B (`1 + 1 = 2 (Tach truc tiep)`), kich hoat bay ngo nhan ve do dai vecto.
  4. Tai giay thu 4.4: Bo phat bieu lap luan sai. Hoc sinh gui phan bien hinh hoc noi tiep vecto DD' = CC'. Bo thua nhan sai sot va Co Lam chot quy tac vang tren nen bang phan mo phong.
- **Loi thuyet minh danh cho nguoi demo**:
  > "Kinh thua ban giam khao, day la Tram 1: Lop hoc tuong tac DRE. Tai giay thu 37:13 trong bai giang Thay Tien, hoc sinh gap phai ngo nhan dien hinh: tach do dai tong thanh tong hai do dai. Thay vi chi cham diem dung sai don thuan, DRE kich hoat nguoi ban hoc Bo de tranh luan truc tiep. Hoc sinh phai dung lap luan hinh hoc noi tiep de be gay bay ngo nhan, sau do Co Lam se chuan hoa kien thuc bang quy tac vang su pham."

---

### Tram 2: Multi-Agent War Room suy luan thoi gian thuc (00:07 - 00:13)

- **Thoi luong**: 6 giay.
- **Hanh dong he thong**:
  1. Giao dien tu dong chuyen sang man hinh Phong dieu hanh suy luan (`activeStudioView = 'warroom'`).
  2. Badge tin hieu truc tiep nhap nhay: `TRUC TIEP (LIVE SSE)` ket noi voi backend qua Server-Sent Events.
  3. 4 pha suy luan (Trich xuat de bai, Truy hoi kien thuc, Ban tron phan bien, Danh gia nhan thuc) chuyen trang thai sang hoan thanh.
  4. Luong su kien suy luan (thought stream) cuon thoi gian thuc, hien thi cac loi goi cong cu xac thuc dai so vecto (`tool_verify_vector_algebra`) va tra cuu tri thuc RAG (`tool_query_misconception_kb`).
- **Loi thuyet minh danh cho nguoi demo**:
  > "Tram 2 he lo hau truong tri tue nhan tao: Ban tron suy luan War Room. Truoc khi dua noi dung den hoc sinh, hoi dong AI gom Tri, Bo, An va Co Lam phai tu phan bien cheo nhau qua 4 pha nghiem ngat. Luong du lieu SSE truc tiep cho thay Tri dao sau ban chat hinh hoc, Bo thu nghiem cac phuong an gay nham lan, va bo kiem toan tat dinh dam bao tuyet doi khong co ao giac toan hoc."

---

### Tram 3: Multi-Track Timeline Editor bien tap kịch ban bai hoc (00:13 - 00:18)

- **Thoi luong**: 5 giay.
- **Hanh dong he thong**:
  1. Giao dien chuyen sang che do bien tap giao an (`activeStudioView = 'editor'`).
  2. Hien thi dong thoi gian da luong cua bai giang 58:00 voi thuoc do nhip su pham 5 phut (5m ruler).
  3. Hop the Bento thong ke: 3 diem dung tuong tac, 4 bay ngo nhan duoc danh dau, muc tieu Thap Bloom L4 (Phan tich).
  4. The xem truoc boi canh video mo phong bang phan 16:9 tich hop cong thuc KaTeX va co che canh bao va cham thoi gian (< 20s).
- **Loi thuyet minh danh cho nguoi demo**:
  > "Tai Tram 3, giao vien hoan toan lam chu noi dung qua Timeline Editor. Moi diem dung va kich ban tranh bien cua AI duoc sap xep truc quan tren dong thoi gian da luong. He thong tich hop san cong cu kiem tra nhip su pham giup ngan ngua viec ngat loi bai giang qua day dac, cho phep giao vien phe duyet va chuyen giao an vao lop hoc chi voi mot cu nhap chuot."

---

### Tram 4: Danh gia nhan thuc Thap Bloom & Soi nao tac nhan (00:18 - 00:23)

- **Thoi luong**: 5 giay.
- **Hanh dong he thong**:
  1. Giao dien quay tro lai Lop hoc va tu dong mo ngan keo Thanh tra luot thoai (`InspectorDrawer`).
  2. Truc quan hoa 4 khoi phan tich chuyen sau:
     - **Khoi 1 (Dieu phoi)**: Y dinh phan bien sac ben, Bo duoc chon, do tin cay 0.91.
     - **Khoi 2 (Ngu canh cach ly)**: Noi dung bang phan, loi thoai gan nhat va phan tri thuc cach ly co o khoa (An voi Bo).
     - **Khoi 3 (Suy nghi ngam)**: Luong suy nghi ngam cua Bo truoc khi nhan thua va cau thoai thuc te.
     - **Khoi 4 (Cham ngam Thap Bloom)**: Su tien trien tu muc Nho (L1) len Danh gia (L5), thanh do luong do du (hesitation score) 12%.
  3. Khi het thoi gian, Mini-HUD hien thi thong bao: `SHOWCASE HOAN TAT - Da chay qua toan bo 4 tram lien hoan`.
- **Loi thuyet minh danh cho nguoi demo**:
  > "Tram 4 la trai tim danh gia cua DRE: Thanh tra luot thoai Inspector. He thong lien tuc cham ngam su tien trien nhan thuc cua nguoi hoc tu muc Nho len muc Phan bien va Danh gia theo Thap Bloom. Dong thoi, giao vien co the soi thau suy nghi ngam ben trong cua AI va kiem tra tinh cach ly thong tin, bao dam an toan su pham tuyet doi."

---

## 3. Bang Tong Hop Thong So Ky Thuat Demo

| Tram | Ten phan he | Thoi luong | View Router | Su kien tu dong chinh |
| :--- | :--- | :--- | :--- | :--- |
| **Tram 1** | Lop hoc tuong tac | 7s | `view=classroom&station=1` | Nhay 37:13, chon Phuong an B, phan bien sticker, chot Co Lam |
| **Tram 2** | War Room suy luan | 6s | `view=warroom` | Kich hoat Live SSE, 4 pha bien kich, 6 tac tu tham gia |
| **Tram 3** | Timeline Editor | 5s | `view=editor` | Hien thi 5m ruler, Bento metrics, Blackboard preview, phe duyet |
| **Tram 4** | Danh gia Thap Bloom | 5s | `view=classroom&inspector=1` | Mo Inspector Drawer, 4 khoi nhan thuc, tien trinh Bloom L1->L5 |
| **Ket thuc** | Hoan tat Showcase | 3.5s | Khong doi | Hien thong bao hoan tat tren Mini-HUD, tu dong tra ve tieu chuan |
