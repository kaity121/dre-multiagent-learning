import { MisconceptionItem } from '../types/dre';

export const MISCONCEPTION_LIBRARY: MisconceptionItem[] = [
  {
    id: 'MISC_VECTO_12',
    topic: 'ToÃ¡n 12: VectÆ¡ trong khÃ´ng gian â€” Báº«y quy táº¯c trá»« & tÃ¡ch Ä‘á»™ dÃ i (Tháº§y Nguyá»…n Phan Tiáº¿n)',
    level: 'intermediate',
    levelLabel: 'ToÃ¡n 12 (SGK Má»›i)',
    workingObject: {
      title: "VÃ­ dá»¥ 10 (PhÃºt 1:40:10): Cho lÄƒng trá»¥ ABC.A'B'C'. Äáº·t AA'âƒ— = aâƒ—, ABâƒ— = bâƒ—, ACâƒ— = câƒ—. HÃ£y biá»ƒu diá»…n vectÆ¡ B'Câƒ— theo aâƒ—, bâƒ—, câƒ—:",
      steps: [
        { stepNumber: 1, content: "ChÃ¨n Ä‘iá»ƒm A vÃ o vectÆ¡ B'Câƒ— theo quy táº¯c hiá»‡u (Chung Ä‘áº§u A):" },
        { stepNumber: 2, content: "B'Câƒ— = AB'âƒ— âˆ’ ACâƒ— (Láº¥y Ä‘iá»ƒm trÆ°á»›c trá»« Ä‘iá»ƒm sau)" },
        { stepNumber: 3, content: "VÃ¬ AB'âƒ— = AA'âƒ— + ABâƒ— = aâƒ— + bâƒ— nÃªn B'Câƒ— = aâƒ— + bâƒ— âˆ’ câƒ—" }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Quy táº¯c hiá»‡u (QuÃªn "Chung Ä‘áº§u - Lá»™n ngÆ°á»£c")',
    errorDescription: "Ãp dá»¥ng sai quy táº¯c hiá»‡u khi chÃ¨n Ä‘iá»ƒm A: B'Câƒ— pháº£i báº±ng ACâƒ— âˆ’ AB'âƒ— (sau trá»« trÆ°á»›c), nhÆ°ng Bo láº¡i viáº¿t ngÆ°á»£c thÃ nh AB'âƒ— âˆ’ ACâƒ—.",
    standardExplanation: "Theo kháº©u quyáº¿t \"Chung Ä‘áº§u - Lá»™n ngÆ°á»£c\" cá»§a tháº§y Tiáº¿n á»Ÿ phÃºt [57:02]: B'Câƒ— = ACâƒ— âˆ’ AB'âƒ— = câƒ— âˆ’ (aâƒ— + bâƒ—) = câƒ— âˆ’ aâƒ— âˆ’ bâƒ—.",
    hintLevel1: 'HÃ£y nhá»› kháº©u quyáº¿t quy táº¯c hiá»‡u á»Ÿ phÃºt [57:02]: "Chung Ä‘áº§u A thÃ¬ pháº£i Lá»˜N NGÆ¯á»¢C thá»© tá»± hai Ä‘iá»ƒm cuá»‘i!"',
    hintLevel2: "Vá»›i B'Câƒ—, khi chÃ¨n Ä‘iá»ƒm A lÃ m gá»‘c chung thÃ¬ Ä‘iá»ƒm C (Ä‘á»©ng sau) pháº£i viáº¿t trÆ°á»›c hay Ä‘iá»ƒm B' (Ä‘á»©ng trÆ°á»›c) viáº¿t trÆ°á»›c?",
    nudgeStarter: "á»ž bÆ°á»›c 2, theo quy táº¯c hiá»‡u chung Ä‘áº§u lá»™n ngÆ°á»£c thÃ¬ B'Câƒ— pháº£i báº±ng ",
    keywords: ['lá»™n ngÆ°á»£c', 'ac - ab', 'sau trá»« trÆ°á»›c', 'ngÆ°á»£c dáº¥u', 'c - a - b', 'chung Ä‘áº§u'],
    linhChiCheatSheet: {
      title: "ðŸ“ Sá»• tay Quy táº¯c Hiá»‡u VectÆ¡ (Tháº§y Nguyá»…n Phan Tiáº¿n)",
      rules: [
        "1. Kháº©u quyáº¿t 'Chung Ä‘áº§u - Lá»™n ngÆ°á»£c' (57:02): OAâƒ— âˆ’ OBâƒ— = BAâƒ— (Äiá»ƒm sau B viáº¿t trÆ°á»›c, Ä‘iá»ƒm trÆ°á»›c A viáº¿t sau).",
        "2. ChÃ¨n Ä‘iá»ƒm A vÃ o B'Câƒ—: B'Câƒ— = ACâƒ— âˆ’ AB'âƒ— = câƒ— âˆ’ (aâƒ— + bâƒ—) = câƒ— âˆ’ aâƒ— âˆ’ bâƒ—.",
        "3. Chuyá»ƒn trá»« thÃ nh cá»™ng vectÆ¡ Ä‘á»‘i: B'Câƒ— = B'Bâƒ— + BCâƒ— = âˆ’AA'âƒ— + (ACâƒ— âˆ’ ABâƒ—) = âˆ’aâƒ— + câƒ— âˆ’ bâƒ—."
      ],
      commonTrap: "Cáº¡m báº«y Bo hay máº¯c: Tháº¥y B' Ä‘á»©ng trÆ°á»›c C nÃªn viáº¿t B'Câƒ— = AB'âƒ— âˆ’ ACâƒ— (quÃªn lá»™n ngÆ°á»£c vá»‹ trÃ­ sau trá»« trÆ°á»›c)."
    }
  },
  {
    id: 'MISC_001',
    topic: 'PhÆ°Æ¡ng trÃ¬nh báº­c 2, nháº§m dáº¥u khi chuyá»ƒn váº¿',
    level: 'beginner',
    levelLabel: 'Má»›i há»c láº§n Ä‘áº§u',
    workingObject: {
      title: 'Giáº£i phÆ°Æ¡ng trÃ¬nh: xÂ² âˆ’ 5x + 6 = 0',
      steps: [
        { stepNumber: 1, content: 'xÂ² âˆ’ 5x + 6 = 0' },
        { stepNumber: 2, content: '(x âˆ’ 2)(x âˆ’ 3) = 0' },
        { stepNumber: 3, content: 'x = 2 hoáº·c x = âˆ’3' }
      ]
    },
    errorStepIndex: 3,
    errorType: 'TÃ­nh toÃ¡n (dáº¥u khi chuyá»ƒn váº¿)',
    errorDescription: 'Nháº§m dáº¥u khi chuyá»ƒn váº¿ â€” quÃªn Ä‘á»•i dáº¥u khi giáº£i (x âˆ’ a) = 0.',
    standardExplanation: 'Khi (x âˆ’ 3) = 0, cá»™ng 3 vÃ o hai váº¿ thÃ¬ x = 3, khÃ´ng pháº£i x = âˆ’3.',
    hintLevel1: 'Thá»­ nhÃ¬n láº¡i bÆ°á»›c chuyá»ƒn váº¿ á»Ÿ dÃ²ng cuá»‘i xem sao?',
    hintLevel2: 'Khi (x âˆ’ 3) = 0, em cá»™ng 3 vÃ o cáº£ hai váº¿ thÃ¬ Ä‘Æ°á»£c gÃ¬?',
    keywords: ['x = 3', 'Ä‘á»•i dáº¥u', 'chuyá»ƒn váº¿', 'dÆ°Æ¡ng 3', '+3', 'báº±ng 3', 'cá»™ng 3', 'dáº¥u cá»™ng', 'pháº£i lÃ  3'],
    nudgeStarter: 'Bo bá»‹ nháº§m dáº¥u khi chuyá»ƒn váº¿ '
  },
  {
    id: 'MISC_002',
    topic: 'PhÃ¢n sá»‘, cá»™ng sai máº«u sá»‘',
    level: 'beginner',
    levelLabel: 'Má»›i há»c láº§n Ä‘áº§u',
    workingObject: {
      title: 'TÃ­nh phÃ©p cá»™ng phÃ¢n sá»‘: 1/3 + 1/4',
      steps: [
        { stepNumber: 1, content: '1/3 + 1/4' },
        { stepNumber: 2, content: '= (1+1) / (3+4)' },
        { stepNumber: 3, content: '= 2/7' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'PhÆ°Æ¡ng phÃ¡p (quy Ä‘á»“ng)',
    errorDescription: 'Cá»™ng trá»±c tiáº¿p tá»­ vÃ  máº«u, khÃ´ng quy Ä‘á»“ng máº«u sá»‘ trÆ°á»›c.',
    standardExplanation: 'Pháº£i quy Ä‘á»“ng máº«u sá»‘ chung (12) trÆ°á»›c: 1/3 = 4/12, 1/4 = 3/12, rá»“i má»›i cá»™ng tá»­: 7/12.',
    hintLevel1: 'Hai phÃ¢n sá»‘ nÃ y cÃ³ cÃ¹ng máº«u sá»‘ chÆ°a nhá»‰?',
    hintLevel2: 'Máº«u sá»‘ chung nhá» nháº¥t cá»§a 3 vÃ  4 lÃ  bao nhiÃªu?',
    keywords: ['quy Ä‘á»“ng', 'máº«u sá»‘', 'máº«u chung', '7/12', 'cÃ¹ng máº«u', 'máº«u sá»‘ chung', 'nhÃ¢n cáº£ tá»­ vÃ  máº«u'],
    nudgeStarter: 'Bo quÃªn quy Ä‘á»“ng máº«u sá»‘ trÆ°á»›c khi cá»™ng '
  },
  {
    id: 'MISC_003',
    topic: 'Luá»¹ thá»«a, nhÃ¢n sá»‘ mÅ© thay vÃ¬ cá»™ng',
    level: 'beginner',
    levelLabel: 'Má»›i há»c láº§n Ä‘áº§u',
    workingObject: {
      title: 'TÃ­nh tÃ­ch hai luá»¹ thá»«a: 2Â³ Ã— 2Â²',
      steps: [
        { stepNumber: 1, content: '2Â³ Ã— 2Â²' },
        { stepNumber: 2, content: '= 2^(3Ã—2)' },
        { stepNumber: 3, content: '= 2â¶ = 64' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Quy táº¯c (cá»™ng vs nhÃ¢n sá»‘ mÅ©)',
    errorDescription: 'NhÃ¢n hai sá»‘ mÅ© vá»›i nhau thay vÃ¬ cá»™ng, khi nhÃ¢n hai luá»¹ thá»«a cÃ¹ng cÆ¡ sá»‘.',
    standardExplanation: 'Khi nhÃ¢n hai luá»¹ thá»«a cÃ¹ng cÆ¡ sá»‘, ta cá»™ng sá»‘ mÅ©: 2^(3+2) = 2âµ = 32.',
    hintLevel1: 'Quy táº¯c nhÃ¢n hai luá»¹ thá»«a cÃ¹ng cÆ¡ sá»‘ lÃ  gÃ¬ â€” cá»™ng hay nhÃ¢n sá»‘ mÅ©?',
    hintLevel2: 'Thá»­ viáº¿t 2Â³ Ã— 2Â² ra dáº¡ng nhÃ¢n Ä‘áº§y Ä‘á»§ (2Ã—2Ã—2Ã—2Ã—2) vÃ  Ä‘áº¿m xem cÃ³ bao nhiÃªu sá»‘ 2.',
    keywords: ['cá»™ng sá»‘ mÅ©', '3+2', '2^5', 'cÃ¹ng cÆ¡ sá»‘', 'luá»¹ thá»«a', 'lÅ©y thá»«a', 'phÃ©p nhÃ¢n sá»‘ mÅ©'],
    nudgeStarter: 'Bo bá»‹ nháº§m giá»¯a nhÃ¢n vÃ  cá»™ng sá»‘ mÅ© '
  },
  {
    id: 'MISC_004',
    topic: 'Thá»© tá»± thá»±c hiá»‡n phÃ©p tÃ­nh (BODMAS/PEMDAS)',
    level: 'beginner',
    levelLabel: 'Má»›i há»c láº§n Ä‘áº§u',
    workingObject: {
      title: 'TÃ­nh giÃ¡ trá»‹ biá»ƒu thá»©c: 3 + 4 Ã— 2',
      steps: [
        { stepNumber: 1, content: '3 + 4 Ã— 2' },
        { stepNumber: 2, content: '= 7 Ã— 2' },
        { stepNumber: 3, content: '= 14' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'Quy táº¯c (Æ°u tiÃªn phÃ©p tÃ­nh)',
    errorDescription: 'TÃ­nh cá»™ng trÆ°á»›c nhÃ¢n, bá» qua thá»© tá»± Æ°u tiÃªn phÃ©p tÃ­nh.',
    standardExplanation: 'Pháº£i nhÃ¢n trÆ°á»›c: 4 Ã— 2 = 8, rá»“i má»›i cá»™ng: 3 + 8 = 11.',
    hintLevel1: 'Trong biá»ƒu thá»©c nÃ y, phÃ©p tÃ­nh nÃ o cáº§n lÃ m trÆ°á»›c â€” cá»™ng hay nhÃ¢n?',
    hintLevel2: 'Quy táº¯c lÃ  nhÃ¢n/chia trÆ°á»›c, cá»™ng/trá»« sau, trá»« khi cÃ³ dáº¥u ngoáº·c.',
    keywords: ['nhÃ¢n trÆ°á»›c', 'cá»™ng sau', '4x2', '4 Ã— 2', 'thá»© tá»± Æ°u tiÃªn', 'Æ°u tiÃªn phÃ©p tÃ­nh', 'nhÃ¢n chia trÆ°á»›c'],
    nudgeStarter: 'Bo tÃ­nh sai thá»© tá»± Æ°u tiÃªn phÃ©p nhÃ¢n '
  },
  {
    id: 'MISC_005',
    topic: 'Há»‡ phÆ°Æ¡ng trÃ¬nh, tháº¿ sai giÃ¡ trá»‹',
    level: 'intermediate',
    levelLabel: 'ÄÃ£ há»c rá»“i',
    workingObject: {
      title: 'Giáº£i há»‡: x + y = 10 vÃ  x âˆ’ y = 2',
      steps: [
        { stepNumber: 1, content: 'x + y = 10 ; x âˆ’ y = 2' },
        { stepNumber: 2, content: 'Cá»™ng hai phÆ°Æ¡ng trÃ¬nh: 2x = 12 â†’ x = 6' },
        { stepNumber: 3, content: 'Tháº¿ vÃ o pt (1): y = 10 âˆ’ 6 = 4, váº­y y = 6' }
      ]
    },
    errorStepIndex: 3,
    errorType: 'ChÃ©p sá»‘ (khÃ´ng pháº£i phÆ°Æ¡ng phÃ¡p)',
    errorDescription: 'TÃ­nh Ä‘Ãºng y = 4 nhÆ°ng chÃ©p nháº§m káº¿t quáº£ cuá»‘i thÃ nh y = 6 (lá»—i chÃ©p sá»‘, khÃ´ng pháº£i lá»—i phÆ°Æ¡ng phÃ¡p).',
    standardExplanation: 'PhÃ©p tÃ­nh 10 âˆ’ 6 = 4 lÃ  Ä‘Ãºng, nhÆ°ng Bo ghi nháº§m Ä‘Ã¡p sá»‘ cuá»‘i cÃ¹ng thÃ nh 6 thay vÃ¬ 4.',
    hintLevel1: 'Thá»­ tÃ­nh láº¡i 10 âˆ’ 6 xem cÃ³ khá»›p vá»›i sá»‘ Bo ghi á»Ÿ cuá»‘i khÃ´ng?',
    hintLevel2: 'Bo tÃ­nh ra 4 nhÆ°ng láº¡i káº¿t luáº­n y = 6 kÃ¬a!',
    keywords: ['chÃ©p nháº§m', 'y = 4', 'y=4', 'káº¿t luáº­n', '4 chá»© khÃ´ng pháº£i 6', 'ghi nháº§m', '10-6=4', '10 âˆ’ 6'],
    nudgeStarter: 'Bo tÃ­nh Ä‘Ãºng nhÆ°ng chÃ©p nháº§m sá»‘ cuá»‘i '
  },
  {
    id: 'MISC_006',
    topic: 'RÃºt gá»n biá»ƒu thá»©c, sai dáº¥u khi phÃ¡ ngoáº·c',
    level: 'intermediate',
    levelLabel: 'ÄÃ£ há»c rá»“i',
    workingObject: {
      title: 'RÃºt gá»n biá»ƒu thá»©c: 5x âˆ’ (3x âˆ’ 2)',
      steps: [
        { stepNumber: 1, content: '5x âˆ’ (3x âˆ’ 2)' },
        { stepNumber: 2, content: '= 5x âˆ’ 3x âˆ’ 2' },
        { stepNumber: 3, content: '= 2x âˆ’ 2' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'TÃ­nh toÃ¡n (dáº¥u khi phÃ¡ ngoáº·c)',
    errorDescription: 'KhÃ´ng Ä‘á»•i dáº¥u sá»‘ háº¡ng thá»© hai trong ngoáº·c khi phÃ¡ ngoáº·c cÃ³ dáº¥u trá»« Ä‘áº±ng trÆ°á»›c.',
    standardExplanation: 'Khi phÃ¡ ngoáº·c cÃ³ dáº¥u trá»« Ä‘áº±ng trÆ°á»›c, pháº£i Ä‘á»•i dáº¥u má»i sá»‘ háº¡ng bÃªn trong: 5x âˆ’ 3x + 2 = 2x + 2.',
    hintLevel1: 'Khi trÆ°á»›c ngoáº·c cÃ³ dáº¥u trá»«, cÃ¡c sá»‘ trong ngoáº·c cÃ³ cáº§n Ä‘á»•i dáº¥u khÃ´ng?',
    hintLevel2: 'Thá»­ phÃ¡ ngoáº·c báº±ng cÃ¡ch nhÃ¢n âˆ’1 vÃ o tá»«ng sá»‘ háº¡ng trong ngoáº·c xem.',
    keywords: ['phÃ¡ ngoáº·c', 'Ä‘á»•i dáº¥u', '+2', 'cá»™ng 2', 'dáº¥u trá»« Ä‘áº±ng trÆ°á»›c', '2x + 2', 'nhÃ¢n trá»« 1', 'nhÃ¢n -1'],
    nudgeStarter: 'Bo quÃªn Ä‘á»•i dáº¥u khi phÃ¡ ngoáº·c cÃ³ dáº¥u trá»« '
  },
  {
    id: 'MISC_007',
    topic: 'Pháº§n trÄƒm, nháº§m cÆ¡ sá»Ÿ tÃ­nh pháº§n trÄƒm',
    level: 'advanced',
    levelLabel: 'Äang Ã´n luyá»‡n',
    workingObject: {
      title: 'BÃ i toÃ¡n giÃ¡ bÃ¡n sau hai láº§n giáº£m vÃ  tÄƒng 20%',
      steps: [
        { stepNumber: 1, content: 'GiÃ¡ gá»‘c 200.000Ä‘, giáº£m 20%, sau Ä‘Ã³ tÄƒng láº¡i 20%.' },
        { stepNumber: 2, content: 'Giáº£m 20%: 200.000 Ã— 0.8 = 160.000Ä‘' },
        { stepNumber: 3, content: 'TÄƒng 20%: 160.000 + 20% cá»§a 200.000 = 160.000 + 40.000 = 200.000Ä‘' }
      ]
    },
    errorStepIndex: 3,
    errorType: 'KhÃ¡i niá»‡m (cÆ¡ sá»Ÿ tÃ­nh %)',
    errorDescription: 'TÃ­nh 20% tÄƒng thÃªm dá»±a trÃªn giÃ¡ gá»‘c ban Ä‘áº§u (200.000Ä‘) thay vÃ¬ dá»±a trÃªn giÃ¡ Ä‘Ã£ giáº£m (160.000Ä‘) â€” sai cÆ¡ sá»Ÿ tÃ­nh pháº§n trÄƒm.',
    standardExplanation: '20% tÄƒng pháº£i tÃ­nh trÃªn giÃ¡ hiá»‡n táº¡i lÃ  160.000Ä‘, tá»©c 160.000 Ã— 1.2 = 192.000Ä‘, khÃ´ng quay láº¡i giÃ¡ gá»‘c.',
    hintLevel1: '20% tÄƒng thÃªm nÃ y nÃªn tÃ­nh trÃªn giÃ¡ nÃ o â€” giÃ¡ gá»‘c hay giÃ¡ Ä‘Ã£ giáº£m?',
    hintLevel2: 'Háº¡n cháº¿ can thiá»‡p â€” hÃ£y suy nghÄ© vá» giÃ¡ cÆ¡ sá»Ÿ táº¡i thá»i Ä‘iá»ƒm tÄƒng.',
    keywords: ['160.000', '160k', 'giÃ¡ má»›i', 'giÃ¡ Ä‘Ã£ giáº£m', '192.000', '192k', 'cÆ¡ sá»Ÿ tÃ­nh', 'trÃªn giÃ¡ 160'],
    nudgeStarter: 'Bo tÃ­nh pháº§n trÄƒm trÃªn sai cÆ¡ sá»Ÿ giÃ¡ '
  },
  {
    id: 'MISC_008',
    topic: 'Báº¥t phÆ°Æ¡ng trÃ¬nh, quÃªn Ä‘á»•i chiá»u khi nhÃ¢n sá»‘ Ã¢m',
    level: 'advanced',
    levelLabel: 'Äang Ã´n luyá»‡n',
    workingObject: {
      title: 'Giáº£i báº¥t phÆ°Æ¡ng trÃ¬nh: âˆ’2x > 6',
      steps: [
        { stepNumber: 1, content: 'âˆ’2x > 6' },
        { stepNumber: 2, content: 'Chia hai váº¿ cho âˆ’2: x > âˆ’3' },
        { stepNumber: 3, content: 'Váº­y nghiá»‡m lÃ  x > âˆ’3' }
      ]
    },
    errorStepIndex: 2,
    errorType: 'KhÃ¡i niá»‡m (Ä‘á»•i chiá»u bpt)',
    errorDescription: 'Chia cáº£ hai váº¿ cho sá»‘ Ã¢m nhÆ°ng khÃ´ng Ä‘á»•i chiá»u báº¥t Ä‘áº³ng thá»©c.',
    standardExplanation: 'Khi chia (hoáº·c nhÃ¢n) cáº£ hai váº¿ báº¥t phÆ°Æ¡ng trÃ¬nh cho má»™t sá»‘ Ã¢m, pháº£i Ä‘á»•i chiá»u dáº¥u báº¥t Ä‘áº³ng thá»©c: x < âˆ’3.',
    hintLevel1: 'Khi chia hai váº¿ báº¥t phÆ°Æ¡ng trÃ¬nh cho má»™t sá»‘ Ã¢m, cÃ³ quy táº¯c Ä‘áº·c biá»‡t nÃ o khÃ´ng?',
    hintLevel2: 'Chia cho sá»‘ Ã¢m thÃ¬ dáº¥u so sÃ¡nh pháº£i tháº¿ nÃ o?',
    keywords: ['Ä‘á»•i chiá»u', 'Ä‘á»•i dáº¥u báº¥t Ä‘áº³ng thá»©c', 'nhá» hÆ¡n', 'chia sá»‘ Ã¢m', 'báº¥t Ä‘áº³ng thá»©c', 'x < -3', 'chiá»u dáº¥u'],
    nudgeStarter: 'Bo quÃªn Ä‘á»•i chiá»u dáº¥u báº¥t Ä‘áº³ng thá»©c khi chia sá»‘ Ã¢m '
  }
];

