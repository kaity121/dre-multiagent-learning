# Kien Truc He Thong DRE Multi-Agent Interactive Learning

Tai lieu nay mo ta kien truc tong the 4 tang (4-Tier Architecture) cua he thong DRE (Diagnose - Repair - Explain), dong thoi trinh bay dinh huong mo rong da mon hoc (Subject-Agnostic) theo EPIC 7.

---

## 1. Tong Quan Kien Truc 4 Tang (4-Tier Architecture)

He thong DRE duoc thiet ke theo kien truc phan tang ro rang, phan tach giua lop hop dong du lieu, lop hoi dong tac nhan tri tue nhan tao, lop dieu phoi thoi gian thuc va lop giao dien nguoi dung:

```
+-------------------------------------------------------------------------+
| TANG 4: GIAO DIEN NGUOI DUNG & DIEU KHIEN SHOWCASE                      |
| React 19 + Vite 8 | Lime Soft Tokens (#C8F169 & #121712)                |
| Resizable Splitter | Inspector Drawer | Timeline Editor | Showcase HUD  |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ HTTP / SSE / REST
                                    ▼
+-------------------------------------------------------------------------+
| TANG 3: DIEU PHOI THOI GIAN THUC & PHAT LUONG TRUC TIEP                 |
| Runtime Intent Classifier & Dynamic Dispatcher (/api/runtime/dispatch)  |
| Server-Sent Events (SSE) Live Stream (/api/roundtable/stream)           |
| Bo cong cu tat dinh: Vector Algebra, RAG KB, Collision, Bloom Evaluator |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Event Sourcing / Tool Invocation
                                    ▼
+-------------------------------------------------------------------------+
| TANG 2: HOI DONG TAC NHAN PHAN BIEN CHEO (ROUNDTABLE COUNCIL)           |
| Bo (Gay bay ngo nhan)      <--Tranh luan-->  Tri (Dao sau & Kiem toan)  |
| An (Dieu phoi su pham)     <--Chot kien-->   Co Lam (Giam doc su pham)  |
| Assessor (Cham ngam nhan thuc)              Linh Chi & Minh Khang       |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Schema Validation
                                    ▼
+-------------------------------------------------------------------------+
| TANG 1: HOP DONG DU LIEU & NGUON TRI THUC (INGESTION & CONTRACTS)       |
| src/types/pipeline.ts (CognitiveEventStream, LessonCheckpointDraft)    |
| Chuan hoa du lieu PR #21 (Sanitized KaTeX, Deterministic JSON Fixtures) |
| Kho tri thuc ngo nhan chuyen sau (DRE Vector Misconception KB)          |
+-------------------------------------------------------------------------+
```

---

## 2. Chi Tiet Cac Tang Chuc Nang

### 2.1. Tang 1: Hop dong du lieu & Nguon tri thuc (Data Contracts & Ingestion)

Tang 1 dong vai tro la nen mong vung chac, dam bao moi thanh phan trong he thong giao tiep thong qua cac hop dong du lieu duoc dinh nghia chat che:

- **src/types/pipeline.ts**: Dinh nghia cac kieu du lieu trung tam:
  - `CognitiveEventStream`: Luong su kien nhan thuc gom cac giai doan noi tiep (`stages`).
  - `DeterministicToolCall`: Chuẩn hoa ket qua goi cong cu tat dinh voi cac truong bat buoc: `toolName`, `input`, `output`, `isValid`, `timestampMs`.
  - `ReasoningEvent`: Cau truc su kien suy luan da tac tu gom cac kieu `thought`, `debate_turn`, `tool_call`, `tool_result`, `checkpoint_created`.
  - `DRELessonSchema`: Cau truc bai giang hoan chinh tich hop cac diem dung (`checkpoints`), bay ngo nhan (`misconceptions`) va khao sat Bloom.
- **Chuan hoa KaTeX & Don dep ky tu rac**: Toan bo chuoi LaTeX toan hoc duoc xu ly qua bo loc `sanitizeKatex.ts`, loai bo tuyet doi ky tu Unicode loi (vi du: `\u20d7`, `d6c2`) truoc khi nap vao he thong.
- **Kho tri thuc ngo nhan (Misconception KB)**: Luu tru danh sach cac ngộ nhan toan hoc dien hinh (vi du: `MISC_VEC_005` - Cong truc tiep do dai vecto thay vi tim vecto tong), cung cap ngu canh RAG chinh xac cho AI.

### 2.2. Tang 2: Hoi dong tac nhan phan bien cheo (Multi-Agent Roundtable Council)

DRE khong dua vao mot mo hinh LLM don le ma van hanh mot hoi dong da tac tu co vai tro su pham rieng biet de tranh ao giac:

- **Bo (Ban hoc gay bay)**: Dong vai hoc sinh mang dinh kien truc quan, lien tuc dua ra cac phuong an giai tat sai lam de kich thich nguoi hoc phan bien.
- **Tri (Nha tu duy sau / Deep Thinker)**: Phan bien sac ben cac lap luan sai cua Bo, truy xuat ban chat hinh hoc khong gian va goi cong cu kiem chung dai so vecto.
- **An (Tro giang dieu phoi)**: Theo doi nhip do hoc tap, phan tang goi y bac thang (Scaffolding Level 1 -> Level 2) khi hoc sinh gap kho khan.
- **Co Lam (Giam doc su pham)**: Giao vien chu tri, tong ket quy tac vang tren nen bang phan va chot kien thuc sau khi hoc sinh va Bo da doi thoai.
- **Assessor (Trong tai cham ngam)**: Giam sat luot thoai ngam, danh gia chat luong phan bien cua hoc sinh (sac ben hay chua ro), do luong muc do do du va xep hang Thap Bloom.
- **Quy trinh 4 pha suy luan (4-Phase Protocol)**:
  1. *Pha 1 (Trich xuat)*: Phan tich thuc the hinh hoc va mien gia tri cua bai toan.
  2. *Pha 2 (Truy hoi)*: RAG tra cuu kho tri thuc ngo nhan lien quan.
  3. *Pha 3 (Ban tron)*: Tranh luan cheo giua Tri va Bo de sang loc bay chat luong nhat.
  4. *Pha 4 (Danh gia)*: Danh gia do phu hop theo Thap Bloom va phe duyet diem dung.

### 2.3. Tang 3: Dieu phoi thoi gian thuc & Phat luong truc tiep (Runtime & Streaming)

Tang 3 ket noi giua logic nghiep vu backend va trai nghiem tuong tac frontend:

- **Runtime Intent Classifier & Dynamic Dispatcher (`/api/runtime/dispatch`)**:
  - Phan loai y dinh nguoi hoc theo co che lai (Heuristic + LLM Classifier).
  - Tu dong dinh tuyen tin nhan den dung tac tu phu hop nhat (Bo, Tri, An, Co Lam).
  - Tich hop cong cu kiem chung tat dinh de bom ket qua tinh toan chinh xac vao loi thoai cua tac tu.
- **Server-Sent Events (SSE) Live Stream (`/api/roundtable/stream`)**:
  - Phat truc tiep luong suy nghi, tranh bien va goi cong cu tu backend len giao dien War Room theo thoi gian thuc.
  - Ho tro cac tham so `videoId`, `partNumber`, `streamDelayMs`, `useLLM`.
- **Bo cong cu tat dinh (Deterministic Tools Layer)**:
  - `tool_verify_vector_algebra`: Xac thuc dai so vecto va quy tac hinh hop bang toa do 3D thuc.
  - `tool_query_misconception_kb`: Tra cuu tri thuc ngo nhan tuong thich chuan RAG.
  - `tool_timeline_collision_checker`: Kiem tra nhip su pham, ngan chan 2 diem dung cach nhau < 20 giay hoac roi vao 15 giay khoi dong (warmup).
  - `tool_evaluate_bloom_level`: Danh gia muc do nhan thuc cau hoi tu Nho, Hieu den Phan tich, Danh gia.

### 2.4. Tang 4: Giao dien nguoi dung & Bo dieu khien Showcase (UI & Showcase Controller)

Giao dien phia client duoc toi uu hoa theo triet ly Lime Soft EdTech:

- **Lime Soft Design System**:
  - Mau nen chu dao: Kem sang `#F3F8E8`.
  - Duong vien the: Xanh xam nhe `#E2EAD2`.
  - Diem nhan thu hut: Xanh chanh `#C8F169`.
  - Mau chu & nen tuong phan cao: Den mun `#121712`.
  - Co chu toi thieu: 12px, ty le tuong phan dat chuan WCAG AA (>= 4.5:1).
- **Thanh chia kich thuoc da chieu (Resizable Splitter)**:
  - Cho phep nguoi hoc keo tha linh hoat giua cot Video, cot Thao luan AI va cot Soi nao tac nhan.
  - Co che pointer capture chong kẹt chuot, cac nut chon nhanh bo cuc (Video rong, Mac dinh, Chat rong) va luu tru trang thai qua `localStorage`.
- **Thanh tra nhan thuc Inspector Drawer**:
  - Truc quan hoa 4 khoi phan tich chuyen sau cho nha nghien cuu va giao vien.
  - Minh bach hoa su cach ly ngu canh (Visible Context vs Hidden Context co bieu tuong o khoa an voi Bo).
- **Bo dieu khien Showcase 1-Click (ShowcaseHUD & useShowcaseController)**:
  - Ho tro phim tat `F2` tu dong trinh dien toan bo 4 Tram trong 23 giay.
  - Hien thi thanh Mini-HUD noi dinh vi tai giua day man hinh voi den tin hieu truc tiep, bo dem nguoc va nut dieu huong.

---

## 3. Dinh Huong Mo Rong Da Mon Hoc (Subject-Agnostic theo EPIC 7)

He thong DRE dang tien hanh chuan hoa kien truc tach roi lom cot loi va cac goi chuyen mon:

```
+-------------------------------------------------------------------------+
|                          DRE CORE ENGINE                                |
|  FSM State Machine · Multi-Agent Debate Council · Runtime Dispatcher    |
|  Pacing Collision Checker · Bloom Evaluator · SSE Streaming Gateway     |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Nap boi canh (Context Ingestion)
                                    ▼
+-------------------------------------------------------------------------+
|                  PLUGGABLE SUBJECT PACKS (GOI CHUYEN MON)               |
|                                                                         |
|  [Toan 12 Pack]       [Ngu Van Pack]      [Sinh Hoc Pack]   [AI / CS]   |
|  - Hinh lap phuong    - Phan tich tho     - Di truyen hoc   - Thuat toan|
|  - Toa do 3D          - Van hoc hien thuc - ADN & Te bao    - Do phuc tap|
|  - Vector Tool        - Trich dan Tool    - Sinh hoc Tool   - Python Run|
+-------------------------------------------------------------------------+
```

### 3.1. Nguyen ly tach roi Core Engine
- **Loi he thong khong phu thuoc mon hoc**: FSM dieu phoi doi thoai, chu trinh tranh luan giua Bo va Tri, thanh tra luot thoai Inspector va bo kiem tra nhip su pham deu hoat dong doc lap voi noi dung giang day.
- **Subject Pack Interface**: Moi mon hoc chi can dinh nghia:
  1. `misconceptions.json`: Danh muc cac loi tu duy hay gap cua hoc sinh trong mon hoc do.
  2. `lecture_timeline.json`: Phân doan video bai giang va cac moc dung de xuat.
  3. `verifier_tools`: Cong cu kiem chung dac thu cua mon hoc (vi du: bo phan tich ngu phap doi voi Ngu Van, bo mo phong gen doi voi Sinh Hoc).

### 3.2. Lo trinh chuyen doi
- **Giai doan 1 (Hien tai)**: Hoan thien va on dinh tren goi chuyen mon Toan 12 (Vecto trong khong gian - Thay Tien).
- **Giai doan 2 (EPIC 7 - Issue #30 & #31)**: Dong goi Subject Pack thanh module doc lap, chuan hoa co che tai dong (Dynamic Pack Loader) cho phep nguoi dung nạp bat ky video bai giang nao vao he thong.
