// File: src/data/videoLessons.ts
import { VideoLessonItem } from '../types/dre';

export const VIDEO_LESSON_LIBRARY: VideoLessonItem[] = [
  {
    id: 'VID_VECTO_12',
    title: 'BÃ i 1.1: VectÆ¡ Trong KhÃ´ng Gian - ToÃ¡n 12 (SGK Má»›i) || Tháº§y Nguyá»…n Phan Tiáº¿n',
    subject: 'HÃ¬nh há»c 12',
    duration: 9503, // 2 giá» 38 phÃºt 23 giÃ¢y (9503 giÃ¢y)
    checkpointTimestamp: 2233, // Dá»«ng táº¡i 37:13 (2233s) - Ngay chá»— báº«y tÃ­nh Ä‘á»™ dÃ i tá»•ng 2 vectÆ¡!
    youtubeId: 'phvpqxLNTUQ',
    videoUrl: 'https://www.youtube.com/watch?v=phvpqxLNTUQ',
    blackboardTitle: "VÃ­ dá»¥ 3 (36:44): Cho hÃ¬nh láº­p phÆ°Æ¡ng cáº¡nh 1. TÃ­nh |BCâƒ— + DD'âƒ—|",
    lectureNotes: [
      '[00:00] Pháº§n 1: Äá»‹nh nghÄ©a VectÆ¡ trong khÃ´ng gian lÃ  má»™t Ä‘oáº¡n tháº³ng cÃ³ hÆ°á»›ng.',
      '[02:24] LÆ°u Ã½: Äoáº¡n tháº³ng AB = BA, nhÆ°ng vectÆ¡ ABâƒ— â‰  BAâƒ— vÃ¬ ngÆ°á»£c hÆ°á»›ng nhau.',
      '[05:31] VectÆ¡-khÃ´ng (0âƒ—): Äiá»ƒm Ä‘áº§u trÃ¹ng Ä‘iá»ƒm cuá»‘i (AAâƒ—, BBâƒ—), Ä‘á»™ dÃ i báº±ng 0, cÃ¹ng phÆ°Æ¡ng cÃ¹ng hÆ°á»›ng vá»›i má»i vectÆ¡.',
      '[11:30] Hai vectÆ¡ báº±ng nhau khi vÃ  chá»‰ khi chÃºng CÃ™NG HÆ¯á»šNG vÃ  CÃ™NG Äá»˜ DÃ€I.',
      ' [22:30] Quy táº¯c 3 Ä‘iá»ƒm (Ná»‘i tiáº¿p): OAâƒ— + ABâƒ— = OBâƒ— & Quy táº¯c hÃ¬nh bÃ¬nh hÃ nh: ABâƒ— + ADâƒ— = ACâƒ—.',
      "[30:13] Quy táº¯c hÃ¬nh há»™p: ABâƒ— + ADâƒ— + AA'âƒ— = AC'âƒ— (ÄÆ°á»ng chÃ©o hÃ¬nh láº­p phÆ°Æ¡ng cáº¡nh a lÃ  aâˆš3).",
      " [36:44] âš¡ VÃ­ dá»¥ 3: Cho hÃ¬nh láº­p phÆ°Æ¡ng ABCD.A'B'C'D' cáº¡nh báº±ng 1. TÃ­nh |BCâƒ— + DD'âƒ—|."
    ],
    // 1. ÄÃšNG 9 PHÃ‚N Cáº¢NH (CHAPTERS) Y Há»†T áº¢NH YOUTUBE Cá»¦A Báº N
    chapters: [
      {
        id: 'chap_vt_1',
        title: '1. Äá»‹nh NghÄ©a VectÆ¡ & GiÃ¡ Cá»§a VectÆ¡',
        startSecond: 0, // 00:00
        formulaPreview: 'ABâƒ— â‰  BAâƒ—'
      },
      {
        id: 'chap_vt_2',
        title: '2. VectÆ¡-khÃ´ng (0âƒ—) & Hai VectÆ¡ CÃ¹ng PhÆ°Æ¡ng',
        startSecond: 331, // 05:31
        formulaPreview: 'AAâƒ— = 0âƒ—'
      },
      {
        id: 'chap_vt_3',
        title: '3. Hai VectÆ¡ Báº±ng Nhau & VÃ­ Dá»¥ HÃ¬nh LÄƒng Trá»¥',
        startSecond: 690, // 11:30
        formulaPreview: 'ABâƒ— = CDâƒ—'
      },
      {
        id: 'chap_vt_4',
        title: '4. Tá»•ng Cá»§a Hai VectÆ¡ (Quy táº¯c 3 Ä‘iá»ƒm & HÃ¬nh bÃ¬nh hÃ nh)',
        startSecond: 1350, // 22:30
        formulaPreview: 'OAâƒ— + ABâƒ— = OBâƒ—'
      },
      {
        id: 'chap_vt_5',
        title: '5. Quy Táº¯c HÃ¬nh Há»™p & âš¡ Äiá»ƒm Dá»«ng Báº«y Äá»™ DÃ i (37:13)',
        startSecond: 1813, // 30:13
        hasCheckpoint: true,
        formulaPreview: 'âš¡ Quiz táº¡i 37:13'
      },
      {
        id: 'chap_vt_6',
        title: '6. Hiá»‡u Cá»§a Hai VectÆ¡ ("Chung Äáº§u Lá»™n NgÆ°á»£c")',
        startSecond: 3134, // 52:14
        formulaPreview: 'OAâƒ— âˆ’ OBâƒ— = BAâƒ—'
      },
      {
        id: 'chap_vt_7',
        title: '7. TÃ­ch Cá»§a VectÆ¡ Vá»›i 1 Sá»‘ & Báº«y Sá»‘ 0 NhÃ¢n VectÆ¡',
        startSecond: 3951, // 1:05:51
        formulaPreview: '0 Â· aâƒ— = 0âƒ—'
      },
      {
        id: 'chap_vt_8',
        title: '8. Quy Táº¯c Trung Tuyáº¿n & Trá»ng TÃ¢m Tá»© Diá»‡n',
        startSecond: 4365, // 1:12:45
        formulaPreview: 'GAâƒ—+GBâƒ—+GCâƒ—=0âƒ—'
      },
      {
        id: 'chap_vt_9',
        title: '9. Dáº¡ng 1 & 2: Chá»©ng Minh Äáº³ng Thá»©c & PhÃ¢n TÃ­ch VectÆ¡',
        startSecond: 7004, // 1:56:44
        formulaPreview: 'ChÃ¨n Ä‘iá»ƒm'
      }
    ],
    // 2. Báº¢N CHÃ‰P Lá»œI Tá»ªNG GIÃ‚Y KÃˆM MINH KHANG ANALOGY & LINH CHI NOTE
    transcriptCues: [
      {
        id: 'vt_cue_1',
        start: 0,
        end: 47,
        speaker: 'CÃ´ Lam',
        text: 'BÃ i 1: VectÆ¡ trong khÃ´ng gian. KhÃ¡i niá»‡m vectÆ¡ trong khÃ´ng gian hoÃ n toÃ n tÆ°Æ¡ng tá»± nhÆ° á»Ÿ lá»›p 10 cÃ¡c em Ä‘Ã£ há»c.',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: á»ž lá»›p 10 mÃ¬nh váº½ mÅ©i tÃªn trÃªn máº·t bÃ n pháº³ng (2D), cÃ²n lÃªn lá»›p 12 mÃ¬nh gáº¯n thÃªm chiá»u cao trong phÃ²ng há»c (3D) thÃ´i, báº£n cháº¥t mÅ©i tÃªn khÃ´ng Ä‘á»•i!',
        linhChiNote: 'ðŸŒ¸ Linh Chi: VectÆ¡ khÃ´ng gian 3D giá»¯ nguyÃªn má»i Ä‘á»‹nh nghÄ©a vá» Ä‘iá»ƒm Ä‘áº§u, Ä‘iá»ƒm cuá»‘i vÃ  Ä‘á»™ dÃ i nhÆ° hÃ¬nh há»c pháº³ng lá»›p 10.'
      },
      {
        id: 'vt_cue_2',
        start: 48,
        end: 143,
        speaker: 'CÃ´ Lam',
        text: 'VectÆ¡ trong khÃ´ng gian lÃ  má»™t Ä‘oáº¡n tháº³ng cÃ³ hÆ°á»›ng. KÃ½ hiá»‡u ABâƒ— vá»›i A lÃ  Ä‘iá»ƒm Ä‘áº§u, B lÃ  Ä‘iá»ƒm cuá»‘i.',
        formula: 'ABâƒ— (A: Äiá»ƒm Ä‘áº§u â†’ B: Äiá»ƒm cuá»‘i)',
        tag: 'formula',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: Giá»‘ng nhÆ° táº¥m vÃ© mÃ¡y bay ghi "ÄÃ  Náºµng â†’ HÃ  Ná»™i" váº­y! A lÃ  sÃ¢n bay cáº¥t cÃ¡nh (Ä‘iá»ƒm Ä‘áº§u), B lÃ  sÃ¢n bay háº¡ cÃ¡nh (Ä‘iá»ƒm cuá»‘i).',
        linhChiNote: 'ðŸŒ¸ Ghi chÃº cÃ´ng thá»©c: VectÆ¡ kÃ½ hiá»‡u báº±ng 2 chá»¯ cÃ¡i in hoa cÃ³ mÅ©i tÃªn trÃªn Ä‘áº§u (ABâƒ—) hoáº·c 1 chá»¯ thÆ°á»ng (aâƒ—, bâƒ—, xâƒ—, yâƒ—).'
      },
      {
        id: 'vt_cue_3',
        start: 144,
        end: 182,
        speaker: 'CÃ´ Lam',
        text: 'LÆ°u Ã½ cá»±c ká»³ quan trá»ng (02:24): Äoáº¡n tháº³ng AB vÃ  BA thÃ¬ báº±ng nhau, nhÆ°ng vectÆ¡ ABâƒ— thÃ¬ KHÃC vectÆ¡ BAâƒ— vÃ¬ Ä‘i ngÆ°á»£c hÆ°á»›ng nhau!',
        formula: 'Äoáº¡n AB = BA nhÆ°ng ABâƒ— â‰  BAâƒ—',
        tag: 'trap',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: Äi tá»« NhÃ  tá»›i TrÆ°á»ng (ABâƒ—) vÃ  Ä‘i tá»« TrÆ°á»ng vá» NhÃ  (BAâƒ—) cÃ³ cÃ¹ng quÃ£ng Ä‘Æ°á»ng dÃ i 2km, nhÆ°ng hÆ°á»›ng Ä‘i ngÆ°á»£c nhau hoÃ n toÃ n nÃªn 2 vectÆ¡ nÃ y khÃ¡c nhau (tháº­m chÃ­ lÃ  Ä‘á»‘i nhau)!',
        linhChiNote: 'ðŸŒ¸ Báº«y cáº§n trÃ¡nh: Äoáº¡n tháº³ng khÃ´ng quan tÃ¢m chiá»u (AB = BA), nhÆ°ng VectÆ¡ báº¯t buá»™c xÃ©t chiá»u mÅ©i tÃªn (ABâƒ— = âˆ’BAâƒ—).'
      },
      {
        id: 'vt_cue_4',
        start: 183,
        end: 330,
        speaker: 'CÃ´ Lam',
        text: 'Äá»™ dÃ i vectÆ¡ kÃ½ hiá»‡u lÃ  |ABâƒ—| = AB. CÃ²n GiÃ¡ cá»§a vectÆ¡ lÃ  Ä‘Æ°á»ng tháº³ng d Ä‘i qua Ä‘iá»ƒm Ä‘áº§u vÃ  Ä‘iá»ƒm cuá»‘i (nhÆ° cÃ¡i giÃ¡ Ä‘á»¡ vectÆ¡).',
        formula: '|ABâƒ—| = AB (Äá»™ dÃ i luÃ´n â‰¥ 0)',
        tag: 'formula',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: "GiÃ¡" cá»§a vectÆ¡ giá»‘ng nhÆ° Ä‘Æ°á»ng ray tÃ u há»a kÃ©o dÃ i vÃ´ táº­n Ä‘i qua 2 ga A vÃ  B, cÃ²n vectÆ¡ ABâƒ— lÃ  Ä‘oÃ n tÃ u náº±m trÃªn Ä‘Æ°á»ng ray Ä‘Ã³!',
        linhChiNote: 'ðŸŒ¸ Ghi chÃº: KÃ½ hiá»‡u |ABâƒ—| Ä‘á»c lÃ  "Äá»™ dÃ i cá»§a vectÆ¡ AB" (khÃ´ng Ä‘á»c lÃ  trá»‹ tuyá»‡t Ä‘á»‘i). Hai vectÆ¡ cÃ¹ng phÆ°Æ¡ng khi 2 Ä‘Æ°á»ng ray (giÃ¡) cá»§a chÃºng song song hoáº·c trÃ¹ng nhau.'
      },
      {
        id: 'vt_cue_5',
        start: 331,
        end: 689,
        speaker: 'CÃ´ Lam',
        text: 'Khi Ä‘iá»ƒm Ä‘áº§u trÃ¹ng Ä‘iá»ƒm cuá»‘i (AAâƒ—, BBâƒ—), ta cÃ³ vectÆ¡-khÃ´ng (0âƒ—). Äá»™ dÃ i |0âƒ—| = 0 vÃ  nÃ³ cÃ¹ng phÆ°Æ¡ng, cÃ¹ng hÆ°á»›ng vá»›i Má»ŒI vectÆ¡!',
        formula: 'AAâƒ— = BBâƒ— = 0âƒ— (CÃ¹ng hÆ°á»›ng má»i vectÆ¡)',
        tag: 'rule',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: VectÆ¡ 0âƒ— lÃ  Ä‘á»©ng im táº¡i chá»— (chá»‰ lÃ  1 dáº¥u cháº¥m). VÃ¬ qua 1 dáº¥u cháº¥m váº½ Ä‘Æ°á»£c vÃ´ sá»‘ Ä‘Æ°á»ng tháº³ng theo má»i hÆ°á»›ng, nÃªn nÃ³ "hÃ²a Ä‘á»“ng" cÃ¹ng phÆ°Æ¡ng, cÃ¹ng hÆ°á»›ng vá»›i táº¥t cáº£ cÃ¡c vectÆ¡ khÃ¡c!',
        linhChiNote: 'ðŸŒ¸ Quy Æ°á»›c Ä‘áº·c biá»‡t: |0âƒ—| = 0. VectÆ¡ 0âƒ— cÃ¹ng phÆ°Æ¡ng vÃ  cÃ¹ng hÆ°á»›ng vá»›i má»i vectÆ¡ trong khÃ´ng gian.'
      },
      {
        id: 'vt_cue_6',
        start: 690,
        end: 1349,
        speaker: 'CÃ´ Lam',
        text: 'Pháº§n 2 (11:30): Hai vectÆ¡ báº±ng nhau khi vÃ  chá»‰ khi chÃºng CÃ™NG HÆ¯á»šNG vÃ  CÃ™NG Äá»˜ DÃ€I. Muá»‘n xÃ©t hÆ°á»›ng pháº£i xÃ©t cÃ¹ng phÆ°Æ¡ng trÆ°á»›c!',
        formula: 'ABâƒ— = CDâƒ— â‡” CÃ¹ng hÆ°á»›ng & |ABâƒ—| = |CDâƒ—|',
        tag: 'rule',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: Trong hÃ¬nh lÄƒng trá»¥ hay hÃ¬nh há»™p, cÃ¡c cáº¡nh bÃªn (AA\'âƒ—, BB\'âƒ—, CC\'âƒ—) giá»‘ng nhÆ° cÃ¡c cÃ¢y cá»™t nhÃ  dá»±ng song song, cao báº±ng nhau vÃ  cÃ¹ng chá»‰ xuá»‘ng dÆ°á»›i nÃªn chÃºng báº±ng nhau háº¿t!',
        linhChiNote: 'ðŸŒ¸ Äiá»u kiá»‡n báº±ng nhau (Äá»§ 2 Ã½): 1) CÃ¹ng hÆ°á»›ng (giÃ¡ song song/trÃ¹ng nhau + cÃ¹ng chiá»u mÅ©i tÃªn) VÃ€ 2) CÃ¹ng Ä‘á»™ dÃ i.'
      },
      {
        id: 'vt_cue_7',
        start: 1350,
        end: 1645,
        speaker: 'CÃ´ Lam',
        text: 'Quy táº¯c 3 Ä‘iá»ƒm (24:44): Äiá»ƒm cuá»‘i tháº±ng nÃ y ná»‘i tiáº¿p Ä‘iá»ƒm Ä‘áº§u tháº±ng kia: OAâƒ— + ABâƒ— = OBâƒ—.',
        formula: 'OAâƒ— + ABâƒ— = OBâƒ— (Ná»‘i tiáº¿p A - A)',
        tag: 'formula',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: ÄÃºng vÃ­ dá»¥ tháº§y Tiáº¿n á»Ÿ phÃºt [24:58] nÃ¨: Äi tá»« NhÃ  (O) qua NhÃ  ngÆ°á»i yÃªu (A), rá»“i tá»« NhÃ  ngÆ°á»i yÃªu (A) Ä‘i Ä‘áº¿n TrÆ°á»ng (B) âž” Káº¿t quáº£ cuá»‘i cÃ¹ng lÃ  Ä‘i tá»« NhÃ  Ä‘áº¿n TrÆ°á»ng (OBâƒ—)!',
        linhChiNote: 'ðŸŒ¸ Quy táº¯c 3 Ä‘iá»ƒm (Cá»™ng ná»‘i tiáº¿p): Äiá»ƒm cuá»‘i cá»§a vectÆ¡ thá»© nháº¥t trÃ¹ng vá»›i Ä‘iá»ƒm Ä‘áº§u cá»§a vectÆ¡ thá»© hai thÃ¬ triá»‡t tiÃªu Ä‘iá»ƒm giá»¯a: OAâƒ— + ABâƒ— = OBâƒ—.'
      },
      {
        id: 'vt_cue_8',
        start: 1646,
        end: 1812,
        speaker: 'CÃ´ Lam',
        text: 'Quy táº¯c hÃ¬nh bÃ¬nh hÃ nh (27:26): Hai vectÆ¡ chung gá»‘c A sáº½ cá»™ng láº¡i ra Ä‘Æ°á»ng chÃ©o á»Ÿ giá»¯a: ABâƒ— + ADâƒ— = ACâƒ—.',
        formula: 'ABâƒ— + ADâƒ— = ACâƒ— (Chung gá»‘c A)',
        tag: 'formula',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: Giá»‘ng nhÆ° kÃ©o giÆ°Æ¡ng cÃ¢y cung á»Ÿ Ä‘á»‰nh A theo hai cÃ¡nh cung AB vÃ  AD, mÅ©i tÃªn sáº½ báº¯n vá»t tháº³ng ra Ä‘Æ°á»ng chÃ©o chÃ­nh giá»¯a ACâƒ—!',
        linhChiNote: 'ðŸŒ¸ PhÃ¢n biá»‡t rÃµ: Ná»‘i tiáº¿p (ABâƒ— + BCâƒ— = ACâƒ—) dÃ¹ng cho tam giÃ¡c; cÃ²n Chung gá»‘c (ABâƒ— + ADâƒ— = ACâƒ—) dÃ¹ng cho HÃ¬nh bÃ¬nh hÃ nh ABCD.'
      },
      {
        id: 'vt_cue_9',
        start: 1813,
        end: 2203,
        speaker: 'CÃ´ Lam',
        text: 'Quy táº¯c hÃ¬nh há»™p (31:40): Tá»•ng 3 vectÆ¡ chung gá»‘c A theo 3 chiá»u (dÃ i, rá»™ng, cao) báº±ng vectÆ¡ Ä‘Æ°á»ng chÃ©o chÃ­nh: ABâƒ— + ADâƒ— + AA\'âƒ— = AC\'âƒ—.',
        formula: 'ABâƒ— + ADâƒ— + AA\'âƒ— = AC\'âƒ—',
        tag: 'rule',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: NhÃ¬n vÃ o gÃ³c phÃ²ng há»c cá»§a cáº­u (Ä‘á»‰nh A): Äi dá»c theo mÃ©p tÆ°á»ng trÃ¡i (ABâƒ—) + mÃ©p tÆ°á»ng pháº£i (ADâƒ—) + cá»™t tÆ°á»ng tháº³ng Ä‘á»©ng (AA\'âƒ—) sáº½ báº¯n xuyÃªn tÃ¢m cÄƒn phÃ²ng tá»›i gÃ³c Ä‘á»‘i diá»‡n AC\'âƒ—!',
        linhChiNote: 'ðŸŒ¸ CÃ´ng thá»©c giáº£i nhanh (41:06): ÄÆ°á»ng chÃ©o hÃ¬nh vuÃ´ng cáº¡nh a lÃ  aâˆš2; ÄÆ°á»ng chÃ©o chÃ­nh hÃ¬nh láº­p phÆ°Æ¡ng cáº¡nh a lÃ  aâˆš3.'
      },
      {
        id: 'vt_cue_10',
        start: 2204,
        end: 2395,
        speaker: 'CÃ´ Lam',
        text: 'âš¡ VÃ­ dá»¥ 3 (36:44 - Äiá»ƒm dá»«ng 37:13): HÃ¬nh láº­p phÆ°Æ¡ng cáº¡nh 1. TÃ­nh |BCâƒ— + DD\'âƒ—|. Cáº¥m tÃ¡ch thÃ nh 1 + 1 = 2! Pháº£i thay DD\'âƒ— = CC\'âƒ— Ä‘á»ƒ Ä‘Æ°á»£c |BC\'âƒ—| = âˆš2.',
        formula: '|BCâƒ— + DD\'âƒ—| = |BCâƒ— + CC\'âƒ—| = |BC\'âƒ—| = âˆš2',
        tag: 'checkpoint',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: Tháº§y Tiáº¿n gá»i Ä‘Ã¢y lÃ  "TÃ¬m ngÆ°á»i phÃ¹ há»£p" (38:30)! BCâƒ— káº¿t thÃºc á»Ÿ C mÃ  DD\'âƒ— láº¡i báº¯t Ä‘áº§u á»Ÿ D (khÃ´ng ná»‘i tiáº¿p Ä‘Æ°á»£c). Ta Ä‘á»•i DD\'âƒ— thÃ nh anh em song sinh cá»§a nÃ³ lÃ  CC\'âƒ— thÃ¬ ná»‘i Ä‘Æ°á»£c C vá»›i C ngay!',
        linhChiNote: 'ðŸŒ¸ Quy táº¯c báº¯t buá»™c khi tÃ­nh Ä‘á»™ dÃ i tá»•ng |aâƒ— + bâƒ—|: BÆ°á»›c 1: DÃ¹ng quy táº¯c tháº¿ vectÆ¡/3 Ä‘iá»ƒm gom bÃªn trong thÃ nh 1 vectÆ¡ duy nháº¥t. BÆ°á»›c 2: TÃ­nh Ä‘á»™ dÃ i Ä‘oáº¡n tháº³ng Ä‘Ã³ báº±ng Pytago.'
      },
      {
        id: 'vt_cue_11',
        start: 2396,
        end: 3950,
        speaker: 'CÃ´ Lam',
        text: 'PhÆ°Æ¡ng phÃ¡p chÃ¨n Ä‘iá»ƒm (42:04 - "Äua Ä‘Ã²i") & Quy táº¯c hiá»‡u (57:02 - "Chung Ä‘áº§u lá»™n ngÆ°á»£c"): OAâƒ— âˆ’ OBâƒ— = BAâƒ—.',
        formula: 'OAâƒ— âˆ’ OBâƒ— = BAâƒ— (Chung Ä‘áº§u O, lá»™n ngÆ°á»£c)',
        tag: 'rule',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: Nhá»› 2 cÃ¢u tháº§n chÃº cá»§a tháº§y Tiáº¿n: 1) ChÃ¨n Ä‘iá»ƒm lÃ  "Äua Ä‘Ã²i" (váº¿ pháº£i cÃ³ Ä‘iá»ƒm gÃ¬, váº¿ trÃ¡i Ä‘Ã²i chÃ¨n Ä‘iá»ƒm Ä‘Ã³ vÃ o). 2) PhÃ©p trá»« cÃ³ chung Ä‘iá»ƒm Ä‘áº§u O thÃ¬ lá»™n ngÆ°á»£c Ä‘Ã­t lÃªn Ä‘áº§u: OAâƒ— âˆ’ OBâƒ— = BAâƒ—!',
        linhChiNote: 'ðŸŒ¸ Sá»• tay biáº¿n Ä‘á»•i: CÃ¡ch 1: Äá»•i trá»« thÃ nh cá»™ng vectÆ¡ Ä‘á»‘i (âˆ’CC\'âƒ— = +C\'Câƒ—). CÃ¡ch 2: Chung gá»‘c thÃ¬ láº¥y Ä‘iá»ƒm sau viáº¿t trÆ°á»›c: ACâƒ— âˆ’ AB\'âƒ— = B\'Câƒ—.'
      },
      {
        id: 'vt_cue_12',
        start: 3951,
        end: 9503,
        speaker: 'CÃ´ Lam',
        text: 'TÃ­ch cá»§a má»™t sá»‘ vá»›i vectÆ¡ (1:05:51) & Quy táº¯c Trá»ng tÃ¢m (1:12:45): Sá»‘ 0 Â· aâƒ— = 0âƒ—. Trá»ng tÃ¢m G tam giÃ¡c BCD: ABâƒ— + ACâƒ— + ADâƒ— = 3AGâƒ—.',
        formula: 'G lÃ  trá»ng tÃ¢m â–³BCD â‡’ ABâƒ— + ACâƒ— + ADâƒ— = 3AGâƒ—',
        tag: 'rule',
        minhKhangAnalogy: 'ðŸŸ¢ Minh Khang: Cáº©n tháº­n báº«y tráº¯c nghiá»‡m á»Ÿ phÃºt [1:09:14]: Sá»‘ 0 nhÃ¢n vá»›i vectÆ¡ aâƒ— pháº£i sinh ra má»™t VECTÆ  (lÃ  0âƒ— cÃ³ mÅ©i tÃªn trÃªn Ä‘áº§u), ai khoanh Ä‘Ã¡p Ã¡n sá»‘ 0 trÆ¡ trá»i lÃ  máº¥t Ä‘iá»ƒm!',
        linhChiNote: 'ðŸŒ¸ Bá»™ 3 cÃ´ng thá»©c Trá»ng tÃ¢m & Trung Ä‘iá»ƒm:\nâ€¢ M lÃ  trung Ä‘iá»ƒm BC â‡’ ABâƒ— + ACâƒ— = 2AMâƒ—\nâ€¢ G lÃ  trá»ng tÃ¢m â–³BCD â‡’ GBâƒ— + GCâƒ— + GDâƒ— = 0âƒ— vÃ  ABâƒ— + ACâƒ— + ADâƒ— = 3AGâƒ—\nâ€¢ I lÃ  trá»ng tÃ¢m tá»© diá»‡n ABCD â‡’ IAâƒ— + IBâƒ— + ICâƒ— + IDâƒ— = 0âƒ—.'
      }
    ],
    // 3. Sá»” TAY & CHAT RIÃŠNG Cá»¦A 4 Báº N Há»ŒC (KHá»šP 100% Vá»šI Lá»œI GIáº¢NG THáº¦Y TIáº¾N)
    peerContext: {
      bo: {
        hotTake: "á»ž phÃºt [37:05], Ä‘á» báº¯t tÃ­nh |BCâƒ— + DD'âƒ—| vá»›i cáº¡nh hÃ¬nh láº­p phÆ°Æ¡ng báº±ng 1. Tá»› tÃ¡ch luÃ´n dáº¥u trá»‹ tuyá»‡t Ä‘á»‘i ra thÃ nh |BCâƒ—| + |DD'âƒ—| = 1 + 1 = 2! Sao tháº§y Tiáº¿n láº¡i báº£o tá»› sai?!",
        quickPrompts: [
          'Äá»™ dÃ i tá»•ng 2 vectÆ¡ cÃ³ báº±ng tá»•ng 2 Ä‘á»™ dÃ i Ä‘Ã¢u Bo!',
          "Pháº£i thay DD'âƒ— báº±ng CC'âƒ— Ä‘á»ƒ ná»‘i Ä‘uÃ´i thÃ nh BC'âƒ— chá»©!"
        ],
        defaultReply: "Æ ... pháº£i gom BCâƒ— + CC'âƒ— thÃ nh Ä‘Æ°á»ng chÃ©o máº·t bÃªn BC'âƒ— rá»“i má»›i tÃ­nh Ä‘á»™ dÃ i Pytago ra âˆš2 háº£?! HÃ¨n gÃ¬ tá»› tÃ¡ch ra 1 + 1 = 2 bá»‹ tháº§y máº¯ng!"
      },
      tri: {
        edgeCaseNote: "ðŸ” GÃ³c Ä‘Ã o sÃ¢u cá»§a TrÃ­ (Bloom Analyze): Báº¥t Ä‘áº³ng thá»©c tam giÃ¡c cho vectÆ¡: |aâƒ— + bâƒ—| â‰¤ |aâƒ—| + |bâƒ—|. Dáº¥u \"=\" chá»‰ xáº£y ra khi aâƒ— vÃ  bâƒ— CÃ™NG HÆ¯á»šNG! á»ž Ä‘Ã¢y BCâƒ— náº±m ngang cÃ²n DD'âƒ— dá»±ng Ä‘á»©ng (vuÃ´ng gÃ³c nhau) nÃªn khÃ´ng bao giá» tÃ¡ch thÃ nh 1 + 1 = 2 Ä‘Æ°á»£c!",
        quickPrompts: [
          'Khi nÃ o thÃ¬ |aâƒ— + bâƒ—| má»›i báº±ng |aâƒ—| + |bâƒ—| háº£ TrÃ­?',
          'Táº¡i sao muá»‘n xÃ©t cÃ¹ng hÆ°á»›ng thÃ¬ báº¯t buá»™c pháº£i xÃ©t cÃ¹ng phÆ°Æ¡ng trÆ°á»›c?'
        ],
        defaultReply: 'ÄÃºng nhÆ° tháº§y Tiáº¿n nháº¥n máº¡nh á»Ÿ phÃºt [15:04]: Hai vectÆ¡ muá»‘n xÃ©t cÃ¹ng hÆ°á»›ng hay ngÆ°á»£c hÆ°á»›ng thÃ¬ giÃ¡ cá»§a chÃºng pháº£i song song hoáº·c trÃ¹ng nhau (cÃ¹ng phÆ°Æ¡ng) trÆ°á»›c Ä‘Ã£!'
      },
      linhchi: {
        cheatSheetTitle: 'ðŸ“ Sá»• tay CÃ´ng thá»©c VÃ ng (BÃ i 1.1 - Tháº§y Tiáº¿n)',
        cheatSheetBullets: [
          '1. Quy táº¯c 3 Ä‘iá»ƒm (Ná»‘i tiáº¿p - 25:28): OAâƒ— + ABâƒ— = OBâƒ— (Cuá»‘i anh nÃ y lÃ  Ä‘áº§u anh kia).',
          '2. Quy táº¯c HÃ¬nh bÃ¬nh hÃ nh (27:26): ABâƒ— + ADâƒ— = ACâƒ— (Chung gá»‘c A báº¯n ra Ä‘Æ°á»ng chÃ©o).',
          "3. Quy táº¯c HÃ¬nh há»™p (32:11): ABâƒ— + ADâƒ— + AA'âƒ— = AC'âƒ—.",
          '4. Quy táº¯c Trá»« (57:02 - Chung Ä‘áº§u lá»™n ngÆ°á»£c): OAâƒ— âˆ’ OBâƒ— = BAâƒ—.',
          '5. ÄÆ°á»ng chÃ©o hÃ¬nh vuÃ´ng cáº¡nh a lÃ  aâˆš2; ÄÆ°á»ng chÃ©o hÃ¬nh láº­p phÆ°Æ¡ng cáº¡nh a lÃ  aâˆš3.'
        ],
        quickPrompts: [
          'Cho tá»› xin cÃ´ng thá»©c Trung tuyáº¿n vÃ  Trá»ng tÃ¢m á»Ÿ phÃºt 1:12:45!',
          'CÃ¡ch tháº¿ vectÆ¡ "tÃ¬m ngÆ°á»i phÃ¹ há»£p" á»Ÿ phÃºt 38:30 lÃ  sao Chi?'
        ],
        defaultReply: 'á»ž phÃºt [1:12:45]: Náº¿u M lÃ  trung Ä‘iá»ƒm BC thÃ¬ ABâƒ— + ACâƒ— = 2AMâƒ—. Náº¿u G lÃ  trá»ng tÃ¢m tam giÃ¡c BCD thÃ¬ GBâƒ— + GCâƒ— + GDâƒ— = 0âƒ— vÃ  ABâƒ— + ACâƒ— + ADâƒ— = 3AGâƒ— nhÃ©!'
      },
      minhkhang: {
        analogyTitle: 'ðŸ¹ áº¨n dá»¥ Äá»i sá»‘ng cá»±c dá»… nhá»› trong bÃ i giáº£ng',
        analogyContent: 'â€¢ Cá»™ng ná»‘i tiáº¿p (24:58): Äi tá»« NhÃ  (O) â†’ NhÃ  ngÆ°á»i yÃªu (A) â†’ TrÆ°á»ng (B) = Äi tá»« NhÃ  Ä‘áº¿n TrÆ°á»ng (OBâƒ—).\nâ€¢ Quy táº¯c hÃ¬nh bÃ¬nh hÃ nh (27:31): KÃ©o 2 cáº¡nh dÃ¢y cung ABâƒ— vÃ  ADâƒ— thÃ¬ mÅ©i tÃªn báº¯n tháº³ng ra Ä‘Æ°á»ng chÃ©o ACâƒ—!\nâ€¢ PhÆ°Æ¡ng phÃ¡p chÃ¨n Ä‘iá»ƒm (42:11): "Äua Ä‘Ã²i" â€” Váº¿ pháº£i cÃ³ Ä‘iá»ƒm gÃ¬ thÃ¬ váº¿ trÃ¡i chÃ¨n Ä‘iá»ƒm Ä‘Ã³ vÃ o!',
        quickPrompts: [
          "Giáº£i thÃ­ch táº¡i sao |BCâƒ— + DD'âƒ—| = âˆš2 báº±ng Ä‘Æ°á»ng Ä‘i thá»±c táº¿ Ä‘i Khang!",
          'Tháº§n chÃº "Chung Ä‘áº§u lá»™n ngÆ°á»£c" dÃ¹ng tháº¿ nÃ o?'
        ],
        defaultReply: "TÆ°á»Ÿng tÆ°á»£ng cáº­u Ä‘i ngang 1 mÃ©t tá»« B Ä‘áº¿n C, rá»“i Ä‘i tháº³ng Ä‘á»©ng lÃªn 1 mÃ©t tá»« C lÃªn C' (vÃ¬ DD'âƒ— = CC'âƒ—). Khoáº£ng cÃ¡ch chim bay tá»« B tá»›i C' chÃ­nh lÃ  cáº¡nh huyá»n tam giÃ¡c vuÃ´ng: âˆš(1Â² + 1Â²) = âˆš2 mÃ©t chá»© sao báº±ng 2 mÃ©t Ä‘Æ°á»£c!"
      }
    },
    // 4. CHECKPOINT QUIZ Táº I PHÃšT 37:13 (GIÃ‚Y 2233) & MÃ€N TRANH BIá»†N Vá»šI BO
    checkpointQuestion: {
      prompt: "Táº¡i [36:44], cho hÃ¬nh láº­p phÆ°Æ¡ng ABCD.A'B'C'D' cÃ³ cáº¡nh báº±ng 1. Äá»™ dÃ i cá»§a tá»•ng hai vectÆ¡ |BCâƒ— + DD'âƒ—| báº±ng bao nhiÃªu vÃ  tÃ­nh tháº¿ nÃ o?",
      options: [
        {
          id: 'opt_1',
          label: "Thay DD'âƒ— = CC'âƒ— Ä‘á»ƒ ná»‘i tiáº¿p: |BCâƒ— + CC'âƒ—| = |BC'âƒ—| = âˆš(1Â² + 1Â²) = âˆš2",
          isStandardBest: true,
          feedback: 'ChÃ­nh xÃ¡c 100%! NhÆ°ng Bo váº«n Ä‘ang cÃ£i lÃ  tÃ¡ch ra 1 + 1 = 2 nhanh hÆ¡n kÃ¬a, hÃ£y báº» gÃ£y ngá»¥y biá»‡n cá»§a Bo nhÃ©!',
          remediationSecond: 2258
        },
        {
          id: 'opt_2',
          label: "TÃ¡ch trá»±c tiáº¿p thÃ nh tá»•ng hai Ä‘á»™ dÃ i: |BCâƒ—| + |DD'âƒ—| = 1 + 1 = 2",
          isStandardBest: false,
          feedback: 'Sáº­p báº«y kinh Ä‘iá»ƒn mÃ  tháº§y Tiáº¿n vá»«a cáº£nh bÃ¡o á»Ÿ [37:13] rá»“i! KhÃ´ng Ä‘Æ°á»£c tÃ¡ch Ä‘á»™ dÃ i cá»§a tá»•ng thÃ nh tá»•ng hai Ä‘á»™ dÃ i!',
          remediationSecond: 2225
        },
        {
          id: 'opt_3',
          label: 'DÃ¹ng cÃ´ng thá»©c Ä‘Æ°á»ng chÃ©o hÃ¬nh láº­p phÆ°Æ¡ng: Báº±ng âˆš3',
          isStandardBest: false,
          feedback: "âˆš3 lÃ  Ä‘Æ°á»ng chÃ©o chÃ­nh AC'âƒ— (tá»•ng cá»§a 3 vectÆ¡ ABâƒ— + ADâƒ— + AA'âƒ— á»Ÿ cÃ¢u b phÃºt 40:00), cÃ²n Ä‘Ã¢y chá»‰ lÃ  Ä‘Æ°á»ng chÃ©o máº·t bÃªn BC'âƒ— thÃ´i nhÃ©!",
          remediationSecond: 2375
        }
      ]
    },
    boArgument: {
      speech: "á»¦a sao cáº­u pháº£i Ä‘á»•i DD'âƒ— thÃ nh CC'âƒ— chi cho má»‡t váº­y?! Tá»› tháº¥y |BCâƒ— + DD'âƒ—| thÃ¬ cá»© tÃ¡ch tháº³ng ra thÃ nh |BCâƒ—| + |DD'âƒ—| = 1 + 1 = 2 luÃ´n trong 1 ná»‘t nháº¡c chá»© sao láº¡i ra âˆš2?!",
      shortcutClaim: "TÃ¡ch |aâƒ— + bâƒ—| thÃ nh |aâƒ—| + |bâƒ—| = 1 + 1 = 2",
      fallacyType: 'Ngá»™ nháº­n tÃ¡ch dáº¥u Ä‘á»™ dÃ i tá»•ng hai vectÆ¡'
    },
    rebuttalStickers: [
      {
        id: 'stk_vt_1',
        text: "KhÃ´ng Ä‘Æ°á»£c tÃ¡ch |aâƒ— + bâƒ—| thÃ nh |aâƒ—| + |bâƒ—|! Pháº£i gom 2 vectÆ¡ trong dáº¥u Ä‘á»™ dÃ i thÃ nh 1 vectÆ¡ duy nháº¥t (BCâƒ— + CC'âƒ— = BC'âƒ—) trÆ°á»›c rá»“i má»›i tÃ­nh Ä‘á»™ dÃ i!",
        isEffective: true,
        bloomLevel: 'Evaluate',
        feedback: 'Chuáº©n xÃ¡c tá»«ng chá»¯ nhÆ° lá»i tháº§y Tiáº¿n á»Ÿ phÃºt [37:21]! Pháº£i thu gá»n thÃ nh 1 vectÆ¡ trÆ°á»›c khi láº¥y Ä‘á»™ dÃ i.'
      },
      {
        id: 'stk_vt_2',
        text: "VÃ¬ BCâƒ— (náº±m ngang) vÃ  DD'âƒ— = CC'âƒ— (tháº³ng Ä‘á»©ng) vuÃ´ng gÃ³c vá»›i nhau, nÃªn tá»•ng cá»§a chÃºng lÃ  Ä‘Æ°á»ng chÃ©o hÃ¬nh vuÃ´ng BC' cÃ³ Ä‘á»™ dÃ i Pytago lÃ  âˆš(1Â² + 1Â²) = âˆš2!",
        isEffective: true,
        bloomLevel: 'Analyze',
        feedback: "PhÃ¢n tÃ­ch hÃ¬nh há»c khÃ´ng gian cá»±c ká»³ sáº¯c bÃ©n! ÄÃ¡nh trÃºng báº£n cháº¥t tam giÃ¡c vuÃ´ng BCC'."
      },
      {
        id: 'stk_vt_3',
        text: 'Táº¡i vÃ¬ trong hÃ¬nh láº­p phÆ°Æ¡ng lÃºc nÃ o cá»™ng hai cáº¡nh láº¡i cÅ©ng pháº£i láº¥y cÄƒn báº­c hai.',
        isEffective: false,
        bloomLevel: 'Remember',
        feedback: "ChÆ°a cháº·t cháº½ rá»“i! Náº¿u hai vectÆ¡ cÃ¹ng hÆ°á»›ng thÃ¬ Ä‘á»™ dÃ i tá»•ng váº«n báº±ng tá»•ng Ä‘á»™ dÃ i Ä‘áº¥y. HÃ£y giáº£i thÃ­ch theo quy táº¯c ná»‘i tiáº¿p BCâƒ— + CC'âƒ— = BC'âƒ— nhÃ©!"
      }
    ],
    boConcession: {
      speech: "á»i giá»i Æ¡i, Ä‘Ãºng ha! Äi ngang 1 bÆ°á»›c tá»« B sang C rá»“i Ä‘i lÃªn 1 bÆ°á»›c tá»« C lÃªn C' thÃ¬ Ä‘Æ°á»ng chÃ©o BC' pháº£i lÃ  âˆš2 chá»© lÃ m sao báº±ng 2 Ä‘Æ°á»£c! Tá»« nay tá»› chá»«a cÃ¡i táº­t tá»± Ã½ tÃ¡ch dáº¥u Ä‘á»™ dÃ i vectÆ¡!",
      realizationNote: 'Bo Ä‘Ã£ hiá»ƒu: Muá»‘n tÃ­nh |aâƒ— + bâƒ—|, báº¯t buá»™c pháº£i biáº¿n Ä‘á»•i tá»•ng bÃªn trong thÃ nh 1 vectÆ¡ duy nháº¥t trÆ°á»›c.'
    },
    teacherClosure: {
      speech: 'Ráº¥t tuyá»‡t vá»i! NhÆ° tháº§y Tiáº¿n vá»«a nháº¥n máº¡nh á»Ÿ phÃºt [37:21], khi gáº·p biá»ƒu thá»©c Ä‘á»™ dÃ i cá»§a tá»•ng nhiá»u vectÆ¡, cÃ¡c em báº¯t buá»™c pháº£i dÃ¹ng quy táº¯c 3 Ä‘iá»ƒm hoáº·c quy táº¯c hÃ¬nh há»™p Ä‘á»ƒ gom chÃºng vá» 1 vectÆ¡ duy nháº¥t rá»“i má»›i tÃ­nh Ä‘á»™ dÃ i Ä‘oáº¡n tháº³ng Ä‘Ã³!',
      goldenRule: 'Quy táº¯c vÃ ng: |aâƒ— + bâƒ—| â‰  |aâƒ—| + |bâƒ—|. LuÃ´n thu gá»n biá»ƒu thá»©c bÃªn trong thÃ nh 1 vectÆ¡ duy nháº¥t (nhá» quy táº¯c ná»‘i tiáº¿p / hÃ¬nh bÃ¬nh hÃ nh / hÃ¬nh há»™p) trÆ°á»›c khi tÃ­nh Ä‘á»™ dÃ i!'
    },
    freezeNote: "Gá»£i Ã½ táº¡i [38:14]: VÃ¬ BCâƒ— káº¿t thÃºc báº±ng Ä‘iá»ƒm C cÃ²n DD'âƒ— báº¯t Ä‘áº§u báº±ng Ä‘iá»ƒm D (chÆ°a ná»‘i tiáº¿p nhau), em hÃ£y thay DD'âƒ— báº±ng vectÆ¡ CC'âƒ— (vÃ¬ hai cáº¡nh bÃªn hÃ¬nh láº­p phÆ°Æ¡ng song song vÃ  báº±ng nhau) Ä‘á»ƒ táº¡o thÃ nh BCâƒ— + CC'âƒ— = BC'âƒ— nhÃ©!",
    timelineComments: [
      {
        id: 'vt_pin',
        second: 0,
        author: 'Trá»£ giáº£ng An',
        role: 'ta',
        text: 'ðŸ“Œ Ghim bÃ i 1.1: 1) Muá»‘n xÃ©t cÃ¹ng hÆ°á»›ng pháº£i cÃ¹ng phÆ°Æ¡ng trÆ°á»›c. 2) Cá»™ng ná»‘i tiáº¿p: Cuá»‘i anh nÃ y lÃ  Ä‘áº§u anh kia. 3) Cáº¥m tÃ¡ch |aâƒ— + bâƒ—| = |aâƒ—| + |bâƒ—|!',
        isPinned: true
      },
      {
        id: 'vt_c1',
        second: 144,
        author: 'Linh Chi',
        role: 'classmate',
        text: 'ðŸ“ PhÃºt [02:24]: Nhá»› ghi sá»• nha cáº£ lá»›p, Ä‘oáº¡n tháº³ng AB = BA nhÆ°ng vectÆ¡ ABâƒ— â‰  BAâƒ— vÃ¬ ngÆ°á»£c chiá»u mÅ©i tÃªn!'
      },
      {
        id: 'vt_c2',
        second: 380,
        author: 'TrÃ­',
        role: 'classmate',
        text: 'ðŸ” PhÃºt [06:20]: Äiá»ƒm Ä‘áº·c biá»‡t cá»§a vectÆ¡-khÃ´ng (0âƒ—) lÃ  Ä‘iá»ƒm Ä‘áº§u trÃ¹ng Ä‘iá»ƒm cuá»‘i nÃªn nÃ³ cÃ¹ng phÆ°Æ¡ng, cÃ¹ng hÆ°á»›ng vá»›i Má»ŒI vectÆ¡!'
      },
      {
        id: 'vt_c3',
        second: 1498,
        author: 'Minh Khang',
        role: 'classmate',
        text: 'ðŸ˜‚ PhÃºt [24:58]: VÃ­ dá»¥ tháº§y Tiáº¿n dá»… nhá»› tháº­t: Äi tá»« NhÃ  (O) â†’ NhÃ  ngÆ°á»i yÃªu (A) â†’ TrÆ°á»ng (B) thÃ¬ chá»‘t láº¡i lÃ  OAâƒ— + ABâƒ— = OBâƒ—!'
      },
      {
        id: 'vt_c4',
        second: 2205,
        author: 'Bo NgÃ¢y NgÃ´',
        role: 'classmate',
        text: "á»¦a cÃ¢u VÃ­ dá»¥ 3 á»Ÿ [36:44] tÃ­nh |BCâƒ— + DD'âƒ—| thÃ¬ cá»© tÃ¡ch ra 1 + 1 = 2 luÃ´n cho khá»e chá»© ghÃ©p vectÆ¡ chi cho má»‡t ta? ðŸ¤”"
      },
      {
        id: 'vt_c5',
        second: 2225,
        author: 'TrÃ­',
        role: 'classmate',
        text: '@Bo Coi chá»«ng sáº­p báº«y á»Ÿ [37:13] kÃ¬a Bo! Hai vectÆ¡ vuÃ´ng gÃ³c nhau mÃ  cáº­u dÃ¡m cá»™ng Ä‘á»™ dÃ i 1 + 1 = 2 háº£?'
      }
    ]
  },
  {
    id: 'VID_001',
    title: 'ToÃ¡n 9: Giáº£i phÆ°Æ¡ng trÃ¬nh tÃ­ch x(x âˆ’ 2) = 3x & Cáº¡m báº«y chia biáº¿n sá»‘',
    subject: 'Äáº¡i sá»‘ 9',
    duration: 110,
    checkpointTimestamp: 50,
    youtubeId: 'd_kO9xGZfI8',
    videoUrl: 'https://www.youtube.com/watch?v=d_kO9xGZfI8',
    blackboardTitle: 'BÃ i toÃ¡n: Giáº£i phÆ°Æ¡ng trÃ¬nh x(x âˆ’ 2) = 3x',
    lectureNotes: [
      'CÃ´ Lam: "ChÃ o cáº£ lá»›p! HÃ´m nay cÃ´ trÃ² mÃ¬nh cÃ¹ng xem má»™t phÆ°Æ¡ng trÃ¬nh nhÃ¬n thÃ¬ ráº¥t quen thuá»™c."',
      'CÃ´ Lam viáº¿t lÃªn báº£ng: x(x âˆ’ 2) = 3x',
      'CÃ´ Lam: "Cáº£ hai váº¿ Ä‘á»u xuáº¥t hiá»‡n nhÃ¢n tá»­ x. Nhiá»u báº¡n ráº¥t thÃ­ch lÃ m má»™t thao tÃ¡c rÃºt gá»n nhanh chÃ³ng..."',
      'CÃ´ Lam dá»«ng pháº¥n: "Em vÃ  Bo thá»­ tÃ¬m nghiá»‡m cá»§a phÆ°Æ¡ng trÃ¬nh nÃ y xem sao nhÃ©!"',
      'Thá»­ tháº¿ x = 0 vÃ o Ä‘á» bÃ i: 0(0 âˆ’ 2) = 3(0) â‡” 0 = 0 (LuÃ´n Ä‘Ãºng! Váº­y x = 0 lÃ  1 nghiá»‡m).',
      'CÃ¡ch giáº£i chuáº©n: Chuyá»ƒn 3x sang váº¿ trÃ¡i Ä‘á»•i dáº¥u: x(x âˆ’ 2) âˆ’ 3x = 0 â‡” x(x âˆ’ 5) = 0 â‡’ x = 0 hoáº·c x = 5.'
    ],

    // 1. PHÃ‚N Cáº¢NH KIá»‚U YOUTUBE CHAPTERS
    chapters: [
      {
        id: 'chap_1',
        title: 'Pháº§n 1: Má»Ÿ Ä‘áº§u & PhÃ¢n tÃ­ch hai váº¿ phÆ°Æ¡ng trÃ¬nh',
        startSecond: 0,
        formulaPreview: 'x(x âˆ’ 2) = 3x'
      },
      {
        id: 'chap_2',
        title: 'Pháº§n 2: Cáº¡m báº«y chia 2 váº¿ cho x cá»§a Bo',
        startSecond: 24,
        formulaPreview: 'Chia cho x âž” Máº¥t nghiá»‡m?'
      },
      {
        id: 'chap_3',
        title: 'Pháº§n 3: Äiá»ƒm dá»«ng suy ngáº«m & Äá»‘i cháº¥t cÃ¹ng Bo',
        startSecond: 50,
        hasCheckpoint: true,
        formulaPreview: 'âš¡ Quiz táº¡i 00:50'
      },
      {
        id: 'chap_4',
        title: 'Pháº§n 4: Chuyá»ƒn váº¿ Ä‘áº·t nhÃ¢n tá»­ chung & Chá»‘t quy táº¯c',
        startSecond: 66,
        formulaPreview: 'x(x âˆ’ 5) = 0 âž” S = {0; 5}'
      }
    ],

    // 2. Báº¢N CHÃ‰P Lá»œI Tá»ªNG GIÃ‚Y (CHUáº¨N COURSERA & YOUTUBE - áº¤N Äá»‚ TUA)
    transcriptCues: [
      {
        id: 'cue_1',
        start: 0,
        end: 11,
        speaker: 'CÃ´ Lam',
        text: 'ChÃ o cáº£ lá»›p! HÃ´m nay cÃ´ trÃ² mÃ¬nh cÃ¹ng xá»­ lÃ½ má»™t phÆ°Æ¡ng trÃ¬nh nhÃ¬n cá»±c ká»³ quen thuá»™c nhÆ°ng 70% há»c sinh bá»‹ máº¥t Ä‘iá»ƒm.',
      },
      {
        id: 'cue_2',
        start: 12,
        end: 23,
        speaker: 'Báº£ng Pháº¥n',
        text: 'CÃ´ Lam viáº¿t Ä‘á» bÃ i lÃªn báº£ng: Giáº£i phÆ°Æ¡ng trÃ¬nh nghiá»‡m thá»±c sau:',
        formula: 'x(x âˆ’ 2) = 3x',
        tag: 'formula'
      },
      {
        id: 'cue_3',
        start: 24,
        end: 35,
        speaker: 'CÃ´ Lam',
        text: 'Quan sÃ¡t hai váº¿: Cáº£ váº¿ trÃ¡i x(x âˆ’ 2) vÃ  váº¿ pháº£i 3x Ä‘á»u cÃ³ nhÃ¢n tá»­ x. Nhiá»u báº¡n tháº¥y váº­y liá»n chia cáº£ hai váº¿ cho x.',
      },
      {
        id: 'cue_4',
        start: 36,
        end: 49,
        speaker: 'Bo',
        text: 'á»¦a cÃ´ Æ¡i, hai bÃªn Ä‘á»u cÃ³ x thÃ¬ mÃ¬nh gáº¡ch phÄƒng chá»¯ x Ä‘i cÃ²n x âˆ’ 2 = 3, suy ra x = 5 luÃ´n cho nhanh chá»© chuyá»ƒn váº¿ chi cho cá»±c áº¡?',
        formula: 'Báº«y cá»§a Bo: x âˆ’ 2 = 3 â‡’ x = 5',
        tag: 'trap'
      },
      {
        id: 'cue_5',
        start: 50,
        end: 65,
        speaker: 'CÃ´ Lam',
        text: 'âš¡ [ÄIá»‚M Dá»ªNG SUY NGáºªM]: Theo em, phÆ°Æ¡ng trÃ¬nh x(x âˆ’ 2) = 3x cÃ³ nghiá»‡m lÃ  gÃ¬ vÃ  nÃªn giáº£i tháº¿ nÃ o Ä‘á»ƒ khÃ´ng sÃ³t nghiá»‡m?',
        tag: 'checkpoint'
      },
      {
        id: 'cue_6',
        start: 66,
        end: 85,
        speaker: 'CÃ´ Lam',
        text: 'HÃ£y kiá»ƒm tra thá»­ x = 0: Thay vÃ o ta cÃ³ 0(0 âˆ’ 2) = 3(0) hay 0 = 0 (LuÃ´n Ä‘Ãºng!). Náº¿u chia hai váº¿ cho x, ta Ä‘Ã£ vÃ´ tÃ¬nh chia cho 0 vÃ  lÃ m bay máº¥t nghiá»‡m x = 0!',
        formula: 'Thá»­ x = 0: 0 = 0 (Thá»a mÃ£n!)',
        tag: 'formula'
      },
      {
        id: 'cue_7',
        start: 86,
        end: 110,
        speaker: 'CÃ´ Lam',
        text: 'Quy táº¯c vÃ ng: Chuyá»ƒn 3x sang váº¿ trÃ¡i thÃ nh âˆ’3x rá»“i Ä‘áº·t x lÃ m nhÃ¢n tá»­ chung: x(x âˆ’ 2 âˆ’ 3) = 0 â‡” x(x âˆ’ 5) = 0. Ta thu Ä‘Æ°á»£c Ä‘á»§ 2 nghiá»‡m x = 0 hoáº·c x = 5!',
        formula: 'x(x âˆ’ 5) = 0 â‡” x = 0 hoáº·c x = 5',
        tag: 'rule'
      }
    ],

    // 3. Sá»” TAY & CHAT RIÃŠNG Äá»’NG Bá»˜ 100% Vá»šI BÃ€I PHÆ¯Æ NG TRÃŒNH TÃCH
    peerContext: {
      bo: {
        hotTake: 'Tá»› tháº¥y cáº£ 2 váº¿ cá»§a x(x âˆ’ 2) = 3x Ä‘á»u cÃ³ chá»¯ x. Cá»© gáº¡ch phÄƒng x á»Ÿ hai bÃªn lÃ  ra x âˆ’ 2 = 3 â‡’ x = 5 trong 2 giÃ¢y! Cáº­u chá»©ng minh tá»› sai Ä‘i?',
        quickPrompts: [
          'Náº¿u x = 0 thÃ¬ phÃ©p chia cho x cÃ³ nghÄ©a khÃ´ng Bo?',
          'Cáº­u thay thá»­ x = 0 vÃ o Ä‘á» bÃ i xem hai váº¿ cÃ³ báº±ng nhau khÃ´ng!'
        ],
        defaultReply: 'Æ ... cáº­u báº£o thay x = 0 vÃ o thÃ¬ váº¿ trÃ¡i = 0, váº¿ pháº£i cÅ©ng = 0 Ã¡? á»¦a váº­y x = 0 cÅ©ng lÃ  nghiá»‡m tháº­t háº£?!'
      },
      tri: {
        edgeCaseNote: 'ðŸ” GÃ³c soi Ä‘iá»u kiá»‡n biÃªn (Bloom Analyze): Trong phÃ©p chia A / B, Ä‘iá»u kiá»‡n báº¯t buá»™c lÃ  B â‰  0. VÃ¬ áº©n x chÆ°a biáº¿t báº±ng bao nhiÃªu nÃªn x hoÃ n toÃ n cÃ³ thá»ƒ báº±ng 0!',
        quickPrompts: [
          'Táº¡i sao chuyá»ƒn váº¿ thÃ¬ báº£o toÃ n nghiá»‡m cÃ²n chia hai váº¿ láº¡i máº¥t nghiá»‡m?',
          'Khi nÃ o thÃ¬ má»›i Ä‘Æ°á»£c phÃ©p chia hai váº¿ cho biá»ƒu thá»©c chá»©a x?'
        ],
        defaultReply: 'CÃ¢u há»i ráº¥t sáº¯c bÃ©n! PhÃ©p cá»™ng/trá»« cÃ¹ng má»™t biá»ƒu thá»©c vÃ o 2 váº¿ luÃ´n xÃ¡c Ä‘á»‹nh vá»›i má»i x âˆˆ â„. CÃ²n phÃ©p chia chá»‰ tÆ°Æ¡ng Ä‘Æ°Æ¡ng khi ta Ä‘Ã£ xÃ©t riÃªng trÆ°á»ng há»£p nhÃ¢n tá»­ Ä‘Ã³ báº±ng 0!'
      },
      linhchi: {
        cheatSheetTitle: 'ðŸ“ Sá»• tay PhÆ°Æ¡ng trÃ¬nh tÃ­ch A(x)Â·B(x) = 0',
        cheatSheetBullets: [
          'BÆ°á»›c 1: Chuyá»ƒn táº¥t cáº£ cÃ¡c háº¡ng tá»­ sang váº¿ trÃ¡i, váº¿ pháº£i báº±ng 0 (Nhá»› Ä‘á»•i dáº¥u: +3x chuyá»ƒn sang thÃ nh âˆ’3x).',
          'BÆ°á»›c 2: Äáº·t nhÃ¢n tá»­ chung x ra ngoÃ i: x(x âˆ’ 2 âˆ’ 3) = 0 â‡” x(x âˆ’ 5) = 0.',
          'BÆ°á»›c 3: Cho tá»«ng nhÃ¢n tá»­ báº±ng 0: x = 0 hoáº·c x âˆ’ 5 = 0 â‡’ S = {0; 5}.',
          'âš ï¸ Cáº¥m ká»µ: Tuyá»‡t Ä‘á»‘i khÃ´ng gáº¡ch bá» nhÃ¢n tá»­ chá»©a áº©n x á»Ÿ hai váº¿!'
        ],
        quickPrompts: [
          'Cho tá»› xem láº¡i 3 bÆ°á»›c Ä‘Æ°a vá» phÆ°Æ¡ng trÃ¬nh tÃ­ch chuáº©n!',
          'Táº¡i sao chuyá»ƒn 3x sang trÃ¡i láº¡i thÃ nh x(x âˆ’ 5) = 0?'
        ],
        defaultReply: 'Cáº­u nhÃ¬n BÆ°á»›c 2 trÃªn Sá»• tay cá»§a tá»› nhÃ©: Khi chuyá»ƒn +3x sang trÃ¡i ta cÃ³ x(x âˆ’ 2) âˆ’ 3x = 0. Äáº·t x chung thÃ¬ bÃªn trong ngoáº·c cÃ²n (x âˆ’ 2 âˆ’ 3) = (x âˆ’ 5) Ä‘Ã³!'
      },
      minhkhang: {
        analogyTitle: 'ðŸ• áº¨n dá»¥ Äá»i sá»‘ng & HÃ¬nh áº£nh Äá»“ thá»‹',
        analogyContent: 'HÃ£y tÆ°á»Ÿng tÆ°á»£ng hai váº¿ y = x(x âˆ’ 2) (Ä‘Æ°á»ng cong Parabol) vÃ  y = 3x (Ä‘Æ°á»ng tháº³ng). Náº¿u váº½ lÃªn máº·t pháº³ng tá»a Ä‘á»™, Ä‘Æ°á»ng tháº³ng cáº¯t Ä‘Æ°á»ng cong táº¡i ÄÃšNG 2 ÄIá»‚M lÃ  gá»‘c tá»a Ä‘á»™ (0;0) vÃ  Ä‘iá»ƒm (5;15). LÃ m nhÆ° Bo lÃ  cháº·t Ä‘á»©t máº¥t 1 giao Ä‘iá»ƒm á»Ÿ gá»‘c tá»a Ä‘á»™ rá»“i!',
        quickPrompts: [
          'Giáº£i thÃ­ch kiá»ƒu chiáº¿c cÃ¢n thÄƒng báº±ng cho bÃ i nÃ y tháº¿ nÃ o Khang?',
          'LÃ m sao kiá»ƒm tra nhanh xem mÃ¬nh cÃ³ bá»‹ sÃ³t nghiá»‡m khÃ´ng?'
        ],
        defaultReply: 'Cá»±c dá»… luÃ´n! Cá»© má»—i láº§n tháº¥y cáº£ 2 váº¿ cÃ³ chung chá»¯ x, cáº­u nháº©m thay ngay sá»‘ 0 vÃ o chá»¯ x. Tháº¥y 0 = 0 Ä‘Ãºng cÃ¡i rá»¥p lÃ  biáº¿t ngay x = 0 lÃ  má»™t nghiá»‡m bá» tÃºi rá»“i!'
      }
    },

    // 4. CHECKPOINT QUIZ & BO DEBATE
    checkpointQuestion: {
      prompt: 'Theo em, phÆ°Æ¡ng trÃ¬nh x(x âˆ’ 2) = 3x cÃ³ nghiá»‡m lÃ  gÃ¬ vÃ  nÃªn biáº¿n Ä‘á»•i tháº¿ nÃ o?',
      options: [
        {
          id: 'opt_1',
          label: 'Chuyá»ƒn váº¿ Ä‘áº·t nhÃ¢n tá»­ chung: x(x âˆ’ 5) = 0 â†’ Nghiá»‡m lÃ  x = 0 hoáº·c x = 5',
          isStandardBest: true,
          feedback: 'ChÃ­nh xÃ¡c vá» máº·t káº¿t quáº£! NhÆ°ng Bo váº«n chÆ°a phá»¥c cÃ¡ch chuyá»ƒn váº¿ Ä‘Ã¢u, hÃ£y báº» gÃ£y lÃ½ láº½ cá»§a Bo nhÃ©!',
          remediationSecond: 86
        },
        {
          id: 'opt_2',
          label: 'Chia cáº£ 2 váº¿ cho x: x âˆ’ 2 = 3 â†’ Nghiá»‡m duy nháº¥t lÃ  x = 5',
          isStandardBest: false,
          feedback: 'Coi chá»«ng! Em vá»«a rÆ¡i vÃ o báº«y chia cho biáº¿n sá»‘ chÆ°a khÃ¡c 0 giá»‘ng há»‡t Bo, lÃ m máº¥t nghiá»‡m x = 0 rá»“i!',
          remediationSecond: 24
        },
        {
          id: 'opt_3',
          label: 'PhÆ°Æ¡ng trÃ¬nh vÃ´ nghiá»‡m vÃ¬ x á»Ÿ hai váº¿ tá»± triá»‡t tiÃªu háº¿t',
          isStandardBest: false,
          feedback: 'Thay thá»­ x = 5 vÃ o hai váº¿ Ä‘á»u báº±ng 15 mÃ ! HÃ£y xem láº¡i bÆ°á»›c chuyá»ƒn váº¿ nhÃ©.',
          remediationSecond: 12
        }
      ]
    },
    boArgument: {
      speech: 'á»¦a sao pháº£i chuyá»ƒn váº¿ Ä‘áº·t nhÃ¢n tá»­ chung chi cho dÃ i dÃ²ng váº­y cáº­u? Cá»© chia luÃ´n cáº£ 2 váº¿ cho x nhÆ° cÃ¢u (B) ra x âˆ’ 2 = 3 â‡’ x = 5 nhanh gáº¥p Ä‘Ã´i mÃ ?!',
      shortcutClaim: 'Chia cáº£ 2 váº¿ cho x Ä‘á»ƒ rÃºt gá»n nhanh',
      fallacyType: 'Chia cho biáº¿n sá»‘ chÆ°a khÃ¡c 0 (LÃ m máº¥t nghiá»‡m)'
    },
    rebuttalStickers: [
      {
        id: 'stk_1',
        text: 'VÃ¬ x cÃ³ thá»ƒ báº±ng 0! ToÃ¡n há»c cáº¥m chia hai váº¿ cho má»™t biá»ƒu thá»©c chÆ°a biáº¿t khÃ¡c 0 hay chÆ°a.',
        isEffective: true,
        bloomLevel: 'Evaluate',
        feedback: 'Láº­p luáº­n cá»±c ká»³ sáº¯c bÃ©n (Äáº¡t má»©c Evaluate)! ÄÃ¡nh trÃºng Ä‘iá»u kiá»‡n tá»“n táº¡i cá»§a phÃ©p chia.'
      },
      {
        id: 'stk_2',
        text: 'Náº¿u gáº¡ch x á»Ÿ hai váº¿ Ä‘i lÃ  cáº­u Ä‘Ã£ lÃ m bay máº¥t nghiá»‡m x = 0 rá»“i (thay x = 0 vÃ o Ä‘Æ°á»£c 0 = 0 luÃ´n Ä‘Ãºng)!',
        isEffective: true,
        bloomLevel: 'Analyze',
        feedback: 'Pháº£n chá»©ng tuyá»‡t vá»i (Äáº¡t má»©c Analyze)! ÄÆ°a ra ngay nghiá»‡m x = 0 bá»‹ bá» sÃ³t.'
      },
      {
        id: 'stk_3',
        text: 'Táº¡i vÃ¬ cÃ´ giÃ¡o báº¯t pháº£i chuyá»ƒn váº¿ sang bÃªn trÃ¡i chá»© khÃ´ng Ä‘Æ°á»£c chia.',
        isEffective: false,
        bloomLevel: 'Remember',
        feedback: 'Bo chÆ°a phá»¥c Ä‘Ã¢u! HÃ£y giáº£i thÃ­ch báº±ng lÃ½ do toÃ¡n há»c (Ä‘iá»u kiá»‡n cá»§a x hoáº·c nghiá»‡m bá»‹ máº¥t) nhÃ©.'
      }
    ],
    boConcession: {
      speech: 'Ã Ä‘Ã¹, Ä‘Ãºng ha! Thay x = 0 vÃ o Ä‘á» bÃ i thÃ¬ 0(0 âˆ’ 2) = 3(0) â‡” 0 = 0 Ä‘Ãºng tháº­t! HÃ³a ra chia cho x lÃ  tá»› tá»± tay vá»©t Ä‘i nghiá»‡m x = 0! Tá»› phá»¥c cáº­u sÃ¡t Ä‘áº¥t luÃ´n!',
      realizationNote: 'Bo Ä‘Ã£ hiá»ƒu: Chia hai váº¿ cho áº©n x lÃ m máº¥t nghiá»‡m x = 0.'
    },
    teacherClosure: {
      speech: 'Xuáº¥t sáº¯c! Em khÃ´ng chá»‰ chá»n Ä‘Ãºng mÃ  cÃ²n giáº£i thÃ­ch ráº¥t rÃµ báº£n cháº¥t toÃ¡n há»c Ä‘á»ƒ giÃºp Bo nháº­n ra lá»—i sai.',
      goldenRule: 'Quy táº¯c vÃ ng: Tuyá»‡t Ä‘á»‘i KHÃ”NG chia cáº£ hai váº¿ cá»§a phÆ°Æ¡ng trÃ¬nh cho má»™t biá»ƒu thá»©c chá»©a áº©n khi chÆ°a xÃ©t trÆ°á»ng há»£p nÃ³ báº±ng 0!'
    },
    freezeNote: 'Gá»£i Ã½ tá»« CÃ´ Lam: á»ž phÆ°Æ¡ng trÃ¬nh x(x âˆ’ 2) = 3x, trÆ°á»›c khi muá»‘n chia hai váº¿ cho x, em hÃ£y tá»± há»i: "Lá»¡ x = 0 thÃ¬ cÃ³ chia cho 0 Ä‘Æ°á»£c khÃ´ng?"',
    timelineComments: [
      {
        id: 'tc_pin',
        second: 0,
        author: 'Trá»£ giáº£ng An',
        role: 'ta',
        text: 'ðŸ“Œ Nháº¯c bÃ i: LuÃ´n Ä‘á»ƒ Ã½ Ä‘iá»u kiá»‡n xÃ¡c Ä‘á»‹nh vÃ  Ä‘áº·t nhÃ¢n tá»­ chung trÆ°á»›c khi rÃºt gá»n!',
        isPinned: true
      },
      {
        id: 'tc_1',
        second: 12,
        author: 'Linh Chi',
        role: 'classmate',
        text: 'ðŸ“ Tá»› chÃ©p Ä‘á» vÃ o sá»• tay rá»“i nhÃ©: Giáº£i phÆ°Æ¡ng trÃ¬nh x(x âˆ’ 2) = 3x.'
      },
      {
        id: 'tc_2',
        second: 24,
        author: 'Minh Khang',
        role: 'classmate',
        text: 'Em Ä‘oÃ¡n pháº£i chuyá»ƒn 3x sang váº¿ trÃ¡i thÃ nh âˆ’3x rá»“i má»›i Ä‘áº·t nhÃ¢n tá»­ chung x ra ngoÃ i.'
      },
      {
        id: 'tc_3',
        second: 36,
        author: 'Bo NgÃ¢y NgÃ´',
        role: 'classmate',
        text: 'á»¦a sao khÃ´ng chia x cho nhanh? 2 bÃªn Ä‘á»u cÃ³ x mÃ  ta, gáº¡ch cÃ¡i ráº¹t lÃ  xong! ðŸ¤”'
      },
      {
        id: 'tc_4',
        second: 42,
        author: 'TrÃ­',
        role: 'classmate',
        text: '@Bo Khoan Ä‘Ã£! Tháº¿ náº¿u x = 0 thÃ¬ phÃ©p chia cho x cá»§a cáº­u cÃ³ há»£p lá»‡ khÃ´ng?'
      },
      {
        id: 'tc_5',
        second: 48,
        author: 'Trá»£ giáº£ng An',
        role: 'ta',
        text: 'Sáº¯p tá»›i cÃ¢u há»i suy ngáº«m cá»§a CÃ´ Lam á»Ÿ 00:50, cáº£ lá»›p chuáº©n bá»‹ Ä‘á»‘i cháº¥t vá»›i Bo nhÃ©!'
      }
    ]
  },

  // BÃ€I Sá» 2: Báº¤T PHÆ¯Æ NG TRÃŒNH (Äá»‚ Äá»”I BÃ€I DEMO)
  {
    id: 'VID_003',
    title: 'ToÃ¡n 8: Báº¥t phÆ°Æ¡ng trÃ¬nh âˆ’2x > 6 & Cáº¡m báº«y quÃªn Ä‘á»•i chiá»u khi chia sá»‘ Ã¢m',
    subject: 'Äáº¡i sá»‘ 8',
    duration: 90,
    checkpointTimestamp: 45,
    youtubeId: '1F2bF2h7-U8',
    videoUrl: 'https://www.youtube.com/watch?v=1F2bF2h7-U8',
    blackboardTitle: 'BÃ i toÃ¡n: Giáº£i báº¥t phÆ°Æ¡ng trÃ¬nh âˆ’2x > 6',
    lectureNotes: [
      'CÃ´ Lam: "HÃ´m nay ta xÃ©t báº¥t phÆ°Æ¡ng trÃ¬nh báº­c nháº¥t cÃ³ há»‡ sá»‘ cá»§a x lÃ  má»™t sá»‘ Ã¢m."',
      'CÃ´ Lam viáº¿t lÃªn báº£ng: âˆ’2x > 6',
      'CÃ´ Lam: "Äá»ƒ tÃ¬m x, ta cáº§n chia cáº£ hai váº¿ cá»§a báº¥t phÆ°Æ¡ng trÃ¬nh cho âˆ’2. NhÆ°ng hÃ£y cáº©n tháº­n vá»›i chiá»u cá»§a dáº¥u >!"'
    ],
    chapters: [
      { id: 'c3_1', title: 'Pháº§n 1: Nháº­n diá»‡n há»‡ sá»‘ Ã¢m trÆ°á»›c áº©n x', startSecond: 0, formulaPreview: 'âˆ’2x > 6' },
      { id: 'c3_2', title: 'Pháº§n 2: Äiá»ƒm dá»«ng Quiz â€” Chia hai váº¿ cho âˆ’2', startSecond: 45, hasCheckpoint: true, formulaPreview: 'âš¡ Quiz táº¡i 00:45' },
      { id: 'c3_3', title: 'Pháº§n 3: Quy táº¯c Ä‘á»•i chiá»u báº¥t Ä‘áº³ng thá»©c', startSecond: 60, formulaPreview: 'x < âˆ’3' }
    ],
    transcriptCues: [
      { id: 'q3_1', start: 0, end: 18, speaker: 'CÃ´ Lam', text: 'ChÃ o cÃ¡c em, cÃ¹ng quan sÃ¡t báº¥t phÆ°Æ¡ng trÃ¬nh âˆ’2x > 6. Há»‡ sá»‘ Ä‘i vá»›i x á»Ÿ Ä‘Ã¢y lÃ  âˆ’2 (má»™t sá»‘ Ã¢m).', formula: 'âˆ’2x > 6', tag: 'formula' },
      { id: 'q3_2', start: 19, end: 44, speaker: 'Bo', text: 'QuÃ¡ dá»… luÃ´n cÃ´ Æ¡i! Giá»‘ng phÆ°Æ¡ng trÃ¬nh thÃ´i, láº¥y 6 chia cho âˆ’2 lÃ  ra x > âˆ’3!', formula: 'Báº«y cá»§a Bo: x > âˆ’3', tag: 'trap' },
      { id: 'q3_3', start: 45, end: 59, speaker: 'CÃ´ Lam', text: 'âš¡ [ÄIá»‚M Dá»ªNG SUY NGáºªM]: Khi chia cáº£ hai váº¿ cá»§a âˆ’2x > 6 cho âˆ’2, táº­p nghiá»‡m Ä‘Ãºng lÃ  gÃ¬?', tag: 'checkpoint' },
      { id: 'q3_4', start: 60, end: 90, speaker: 'CÃ´ Lam', text: 'Khi nhÃ¢n hoáº·c chia cáº£ hai váº¿ cá»§a báº¥t phÆ°Æ¡ng trÃ¬nh cho má»™t sá»‘ Ã¢m, ta Báº®T BUá»˜C pháº£i Ä‘á»•i chiá»u dáº¥u báº¥t Ä‘áº³ng thá»©c tá»« > sang <, váº­y nghiá»‡m lÃ  x < âˆ’3!', formula: 'x < âˆ’3', tag: 'rule' }
    ],
    peerContext: {
      bo: {
        hotTake: 'Tá»› tháº¥y âˆ’2x > 6 thÃ¬ cá»© láº¥y 6 chia (âˆ’2) Ä‘Æ°á»£c âˆ’3, giá»¯ nguyÃªn dáº¥u > lÃ  x > âˆ’3 thÃ´i! Sao láº¡i pháº£i Ä‘á»•i chiá»u?',
        quickPrompts: ['Cáº­u thá»­ láº¥y x = 0 (lá»›n hÆ¡n âˆ’3) thay vÃ o âˆ’2x > 6 xem cÃ³ Ä‘Ãºng khÃ´ng!', 'Chia cho sá»‘ Ã¢m khÃ¡c chia cho sá»‘ dÆ°Æ¡ng tháº¿ nÃ o?'],
        defaultReply: 'á»¦a thay x = 0 vÃ o thÃ¬ âˆ’2(0) > 6 â‡” 0 > 6 (VÃ´ lÃ½!). Sao ká»³ váº­y ta?!'
      },
      tri: {
        edgeCaseNote: 'ðŸ” Báº£n cháº¥t trÃªn trá»¥c sá»‘: NhÃ¢n hoáº·c chia cho sá»‘ Ã¢m lÃ  phÃ©p láº¥y Ä‘á»‘i xá»©ng qua gá»‘c tá»a Ä‘á»™ 0, lÃ m Ä‘áº£o ngÆ°á»£c toÃ n bá»™ thá»© tá»± lá»›n/bÃ©!',
        quickPrompts: ['Táº¡i sao nhÃ¢n sá»‘ Ã¢m láº¡i lÃ m Ä‘áº£o chiá»u trÃªn trá»¥c sá»‘?'],
        defaultReply: 'VÃ­ dá»¥ 2 < 5, nhÆ°ng khi nhÃ¢n (âˆ’1) vÃ o hai váº¿ thÃ¬ âˆ’2 láº¡i lá»›n hÆ¡n âˆ’5 (vÃ¬ ná»£ 2 Ä‘á»“ng Ã­t hÆ¡n ná»£ 5 Ä‘á»“ng)!'
      },
      linhchi: {
        cheatSheetTitle: 'ðŸ“ Sá»• tay Quy táº¯c dáº¥u Báº¥t phÆ°Æ¡ng trÃ¬nh',
        cheatSheetBullets: [
          '1. Cá»™ng/Trá»« hai váº¿ vá»›i cÃ¹ng má»™t sá»‘: GIá»® NGUYÃŠN chiá»u.',
          '2. NhÃ¢n/Chia hai váº¿ vá»›i sá»‘ DÆ¯Æ NG (> 0): GIá»® NGUYÃŠN chiá»u.',
          '3. NhÃ¢n/Chia hai váº¿ vá»›i sá»‘ Ã‚M (< 0): Báº®T BUá»˜C Äá»”I CHIá»€U (> thÃ nh <).'
        ],
        quickPrompts: ['Khi nÃ o giá»¯ chiá»u, khi nÃ o Ä‘á»•i chiá»u báº¥t phÆ°Æ¡ng trÃ¬nh?'],
        defaultReply: 'Cáº­u nhá»› má»¥c sá»‘ 3 trong sá»• tay nhÃ©: Cá»© nhÃ¢n hoáº·c chia cho sá»‘ Ã‚M lÃ  pháº£i láº­t ngÆ°á»£c dáº¥u so sÃ¡nh láº¡i ngay!'
      },
      minhkhang: {
        analogyTitle: 'ðŸ’° áº¨n dá»¥ Tiá»n báº¡c & Khoáº£ng ná»£',
        analogyContent: 'Báº¡n A cÃ³ 10k, báº¡n B cÃ³ 20k thÃ¬ A < B. NhÆ°ng náº¿u Ä‘á»•i sang "khoáº£ng ná»£" (nhÃ¢n vá»›i dáº¥u Ã¢m): Ná»£ 10k (âˆ’10) láº¡i giÃ u hÆ¡n ná»£ 20k (âˆ’20), tá»©c lÃ  âˆ’10 > âˆ’20!',
        quickPrompts: ['Láº¥y vÃ­ dá»¥ thá»­ sá»‘ cá»¥ thá»ƒ cho bÃ i âˆ’2x > 6 Ä‘i Khang!'],
        defaultReply: 'Náº¿u láº¥y x = âˆ’4 (nhá» hÆ¡n âˆ’3), nhÃ¢n vá»›i âˆ’2 ta Ä‘Æ°á»£c (âˆ’2)Â·(âˆ’4) = +8 > 6 (Chuáº©n luÃ´n!).'
      }
    },
    checkpointQuestion: {
      prompt: 'Khi giáº£i báº¥t phÆ°Æ¡ng trÃ¬nh âˆ’2x > 6, bÆ°á»›c biáº¿n Ä‘á»•i nÃ o dÆ°á»›i Ä‘Ã¢y lÃ  Ä‘Ãºng?',
      options: [
        { id: 'opt_1', label: 'Chia 2 váº¿ cho âˆ’2 vÃ  Äá»”I CHIá»€U báº¥t Ä‘áº³ng thá»©c: x < âˆ’3', isStandardBest: true, feedback: 'Chuáº©n xÃ¡c! HÃ£y giáº£i thÃ­ch cho Bo hiá»ƒu vÃ¬ sao pháº£i Ä‘á»•i chiá»u nhÃ©!' },
        { id: 'opt_2', label: 'Chia 2 váº¿ cho âˆ’2 vÃ  GIá»® NGUYÃŠN chiá»u: x > âˆ’3', isStandardBest: false, feedback: 'Coi chá»«ng! Chia cho sá»‘ Ã¢m mÃ  khÃ´ng Ä‘á»•i chiá»u lÃ  sáº­p báº«y cá»§a Bo rá»“i!' }
      ]
    },
    boArgument: {
      speech: 'á»¦a sao tá»± nhiÃªn Ä‘ang dáº¥u lá»›n (>) cáº­u láº¡i láº­t ngÆ°á»£c thÃ nh dáº¥u bÃ© (<) váº­y? Tá»› tháº¥y cá»© giá»¯ nguyÃªn x > âˆ’3 má»›i thuáº­n máº¯t chá»©!',
      shortcutClaim: 'Chia hai váº¿ cho âˆ’2 giá»¯ nguyÃªn dáº¥u >',
      fallacyType: 'QuÃªn Ä‘á»•i chiá»u khi chia sá»‘ Ã¢m'
    },
    rebuttalStickers: [
      { id: 's3_1', text: 'VÃ¬ âˆ’2 lÃ  sá»‘ Ã¢m! Khi chia hai váº¿ báº¥t phÆ°Æ¡ng trÃ¬nh cho sá»‘ Ã¢m thÃ¬ báº¯t buá»™c pháº£i Ä‘á»•i chiá»u tá»« > sang <.', isEffective: true, bloomLevel: 'Evaluate', feedback: 'ChÃ­nh xÃ¡c tuyá»‡t Ä‘á»‘i!' },
      { id: 's3_2', text: 'Thá»­ láº¥y x = 0 (thá»a mÃ£n x > âˆ’3 cá»§a Bo) thay vÃ o Ä‘á» bÃ i Ä‘Æ°á»£c 0 > 6 (VÃ´ lÃ½ ngay!).', isEffective: true, bloomLevel: 'Analyze', feedback: 'Pháº£n vÃ­ dá»¥ báº±ng sá»‘ cá»±c ká»³ thuyáº¿t phá»¥c!' }
    ],
    boConcession: {
      speech: 'Trá»i Ä‘áº¥t, thay x = 0 vÃ o ra 0 > 6 sai lÃ¨ tháº­t! Tá»« nay tháº¥y chia cho sá»‘ Ã¢m lÃ  tá»› láº­t dáº¥u liá»n!',
      realizationNote: 'Bo Ä‘Ã£ nhá»› quy táº¯c Ä‘á»•i chiá»u khi nhÃ¢n/chia sá»‘ Ã¢m.'
    },
    teacherClosure: {
      speech: 'Ráº¥t tá»‘t! Cáº£ lá»›p luÃ´n nhá»› kiá»ƒm tra dáº¥u cá»§a há»‡ sá»‘ trÆ°á»›c khi chia hai váº¿ báº¥t phÆ°Æ¡ng trÃ¬nh nhÃ©.',
      goldenRule: 'Quy táº¯c vÃ ng: NhÃ¢n hoáº·c chia hai váº¿ báº¥t phÆ°Æ¡ng trÃ¬nh cho Sá» Ã‚M thÃ¬ pháº£i Äá»”I CHIá»€U báº¥t Ä‘áº³ng thá»©c!'
    },
    freezeNote: 'Gá»£i Ã½: Sá»‘ âˆ’2 mang dáº¥u Ã¢m. HÃ£y thá»­ láº¥y 1 giÃ¡ trá»‹ x cá»¥ thá»ƒ thay vÃ o Ä‘á»ƒ kiá»ƒm tra chiá»u cá»§a báº¥t Ä‘áº³ng thá»©c.',
    timelineComments: [
      { id: 'tc3_pin', second: 0, author: 'Trá»£ giáº£ng An', role: 'ta', text: 'ðŸ“Œ LÆ°u Ã½: NhÃ¢n/chia sá»‘ Ã¢m vÃ o hai váº¿ báº¥t phÆ°Æ¡ng trÃ¬nh thÃ¬ pháº£i Äá»”I CHIá»€U dáº¥u so sÃ¡nh!', isPinned: true },
      { id: 'tc3_1', second: 19, author: 'Bo NgÃ¢y NgÃ´', role: 'classmate', text: 'Láº¥y 6 chia âˆ’2 ra âˆ’3, váº­y x > âˆ’3 thÃ´i, nhanh gá»n!' },
      { id: 'tc3_2', second: 30, author: 'TrÃ­', role: 'classmate', text: '@Bo Cáº­u thá»­ thay x = 0 vÃ o xem 0 cÃ³ lá»›n hÆ¡n 6 khÃ´ng mÃ  káº¿t luáº­n x > âˆ’3?' }
    ]
  }
];

