import React, { useState, useEffect } from 'react';
import { 
  BoAvatar, 
  TutorLamAvatar, 
  WashiTape, 
  PushPin, 
  RubberStampSuccess, 
  SparkleIcon,
  VideoPlayIcon,
  CheckCircleIcon,
  ChalkboardIcon,
  GentleLightbulb,
  PinTackIcon,
  GoldenStarIcon
} from './HandmadeArtwork';

export interface AlternativeFlowsSheetProps {
  mode: 'predict_poe' | 'protege_teaching';
  onSwitchMode: (mode: 'worksheet' | 'video_clash' | 'predict_poe' | 'protege_teaching') => void;
  onPoeTopicChange?: (topic: string) => void;
}

// POE Lesson Definition
interface PoeLesson {
  id: string;
  badge: string;
  grade: string;
  title: string;
  equation: string;
  teacherPrompt: string;
  boQuote: string;
  boChoice: 'A' | 'B';
  options: {
    key: 'A' | 'B';
    label: string;
    sublabel: string;
    isCorrect: boolean;
  }[];
  observeSteps: {
    stepNum: number;
    title: string;
    detail: string;
    highlight?: string;
  }[];
  blackboardSummary: string;
  explainWin: {
    boSpeech: string;
    teacherSpeech: string;
    ruleSummary: string;
  };
  explainLose: {
    boSpeech: string;
    teacherSpeech: string;
    ruleSummary: string;
  };
  microRepair: {
    prompt: string;
    options: { key: 'A' | 'B'; text: string; isCorrect: boolean }[];
    explanation: string;
  };
}

const POE_LESSON_LIBRARY: PoeLesson[] = [
  {
    id: 'poe-1',
    badge: 'Bài 1: Phá ngoặc có dấu trừ',
    grade: 'Toán 8 · Phá ngoặc & Đổi dấu',
    title: 'Phá ngoặc có dấu trừ đằng trước biểu thức đại số',
    equation: 'B = 7x − (2x − 5)',
    teacherPrompt: 'Trước khi cô đặt bút viết dòng tiếp theo, hai đứa thử cá cược dự đoán xem: khi phá ngoặc có dấu trừ đằng trước, số 5 sẽ mang dấu CỘNG (+) hay dấu ÂM (−)?',
    boQuote: 'Tớ chọn Dấu Âm (−5)! Trong ngoặc có sẵn dấu trừ thì cứ hạ xuống thôi, sao mà biến thành dấu cộng được! Cậu dám cược khác tớ không?',
    boChoice: 'A',
    options: [
      {
        key: 'A',
        label: 'Cược Phương án A (Giống Bo):',
        sublabel: 'B = 5x − 5 (Giữ nguyên dấu −5)',
        isCorrect: false,
      },
      {
        key: 'B',
        label: 'Cược Phương án B (Khác Bo):',
        sublabel: 'B = 5x + 5 (Đổi dấu thành +5)',
        isCorrect: true,
      },
    ],
    observeSteps: [
      {
        stepNum: 1,
        title: 'Biểu thức ban đầu',
        detail: 'B = 7x − (2x − 5)',
      },
      {
        stepNum: 2,
        title: 'Quy tắc dấu ngoặc',
        detail: 'Trước ngoặc có dấu trừ: đổi dấu TẤT CẢ các số hạng: +(2x) ➔ −2x, và −(5) ➔ +5',
        highlight: '−(−5) = +5',
      },
      {
        stepNum: 3,
        title: 'Rút gọn các đơn thức đồng dạng',
        detail: 'B = 7x − 2x + 5 = 5x + 5',
        highlight: 'Kết quả chính xác: 5x + 5',
      },
    ],
    blackboardSummary: 'B = 7x − (2x − 5) = 7x − 2x + 5 = 5x + 5',
    explainWin: {
      boSpeech: 'Ối dồi ôi, biến thành +5 thật kìa! Tớ thua cược đứt đuôi rồi! Sao cậu nhớ được quy tắc đổi dấu −(−5) = +5 chuẩn thế?',
      teacherSpeech: 'Tuyệt vời! Huy đã áp dụng chính xác quy tắc phá ngoặc: Khi trước ngoặc có dấu trừ, mọi số hạng bên trong đều phải đổi dấu. Bo nhớ khao kem Huy nhé!',
      ruleSummary: 'Quy tắc vàng: −(a − b) = −a + b. Đừng quên đổi dấu cả số thứ hai!',
    },
    explainLose: {
      boSpeech: 'Haha, hoá ra cậu cũng chọn giống tớ à? Hai đứa mình cùng dính bẫy hạ nguyên dấu −5 xuống rồi!',
      teacherSpeech: 'Đừng buồn nhé hai bạn nhỏ! Đây là lỗi kinh điển mà hơn 80% học sinh đều mắc phải khi mới học. Hãy nhớ: dấu trừ đằng trước tác động lên TẤT CẢ các số trong ngoặc: −(2x − 5) = −2x + 5!',
      ruleSummary: 'Lưu ý cốt lõi: Dấu trừ trước ngoặc đảo dấu TOÀN BỘ bên trong, không được giữ nguyên!',
    },
    microRepair: {
      prompt: 'Thử tài sửa sai ngay: Biểu thức C = 8x − (3x − 4) sau khi phá ngoặc sẽ là:',
      options: [
        { key: 'A', text: 'C = 5x − 4', isCorrect: false },
        { key: 'B', text: 'C = 5x + 4', isCorrect: true },
      ],
      explanation: 'Chính xác! −(−4) đổi dấu thành +4, do đó 8x − 3x + 4 = 5x + 4!',
    },
  },
  {
    id: 'poe-2',
    badge: 'Bài 2: Chia cho biến số',
    grade: 'Toán 8 · Phương trình tích',
    title: 'Cạm bẫy chia cho biến số trong phương trình tích',
    equation: 'x(x − 3) = 2(x − 3)',
    teacherPrompt: 'Trước khi cô trình bày lời giải chi tiết, hai bạn thử dự đoán xem phương trình này có bao nhiêu nghiệm: chỉ có 1 nghiệm duy nhất hay có 2 nghiệm?',
    boQuote: 'Tớ cược chỉ có 1 nghiệm duy nhất là x = 2! Cả 2 vế đều có cụm (x − 3), tớ chia triệt tiêu luôn là ra x = 2 cực nhanh!',
    boChoice: 'A',
    options: [
      {
        key: 'A',
        label: 'Cược Phương án A (Giống Bo):',
        sublabel: 'Chỉ có 1 nghiệm x = 2 (Chia triệt tiêu cho x − 3)',
        isCorrect: false,
      },
      {
        key: 'B',
        label: 'Cược Phương án B (Khác Bo):',
        sublabel: 'Có 2 nghiệm: x = 2 hoặc x = 3 (Đặt nhân tử chung)',
        isCorrect: true,
      },
    ],
    observeSteps: [
      {
        stepNum: 1,
        title: 'Phương trình ban đầu',
        detail: 'x(x − 3) = 2(x − 3)',
      },
      {
        stepNum: 2,
        title: 'Cảnh báo cạm bẫy',
        detail: 'CẤM chia cả 2 vế cho (x − 3) vì ta chưa biết (x − 3) có khác 0 hay không! Nếu chia sẽ làm mất nghiệm.',
        highlight: 'Không được chia cho biểu thức chứa biến!',
      },
      {
        stepNum: 3,
        title: 'Chuyển vế & Phân tích nhân tử',
        detail: 'x(x − 3) − 2(x − 3) = 0  ➔  (x − 3)(x − 2) = 0',
      },
      {
        stepNum: 4,
        title: 'Tập nghiệm đầy đủ',
        detail: 'x − 3 = 0 hoặc x − 2 = 0  ➔  x = 3 hoặc x = 2',
        highlight: 'Phương trình có 2 nghiệm: x = 2 và x = 3',
      },
    ],
    blackboardSummary: 'x(x − 3) − 2(x − 3) = 0  ➔  (x − 3)(x − 2) = 0  ➔  x = 2 hoặc x = 3',
    explainWin: {
      boSpeech: 'Úi chà! Ra là còn nghiệm x = 3 nữa à?! Tớ chia triệt tiêu làm bay màu mất một nghiệm rồi! Cậu tỉnh táo thật đấy!',
      teacherSpeech: 'Rất xuất sắc! Huy đã nhớ lời dặn: Không được tự ý chia hai vế cho biểu thức chứa biến vì có thể làm mất nghiệm x = 3!',
      ruleSummary: 'Nguyên tắc bất di bất dịch: Luôn chuyển vế đặt nhân tử chung, không chia cho biến!',
    },
    explainLose: {
      boSpeech: 'Aizaaa, hai đứa mình cùng dính bẫy chia cả hai vế cho (x − 3) rồi! Tự dưng làm mất toi nghiệm x = 3!',
      teacherSpeech: 'Đừng lo lắng! Đây là cái bẫy kinh điển nhất trong chương Phương trình tích. Khi hai vế có chung một biểu thức chứa biến, hãy luôn chuyển vế sang trái và đặt nhân tử chung.',
      ruleSummary: 'Bài học sống còn: Khi gặp A · B = C · B, hãy chuyển vế thành B(A − C) = 0!',
    },
    microRepair: {
      prompt: 'Thử lại nhanh: Phương trình x(x − 5) = 4(x − 5) có tập nghiệm là:',
      options: [
        { key: 'A', text: 'Chỉ có x = 4', isCorrect: false },
        { key: 'B', text: 'Có 2 nghiệm: x = 4 và x = 5', isCorrect: true },
      ],
      explanation: 'Chuẩn luôn! Chuyển vế đặt nhân tử chung (x − 5)(x − 4) = 0 cho ta 2 nghiệm là x = 4 và x = 5!',
    },
  },
  {
    id: 'poe-3',
    badge: 'Bài 3: Lũy thừa số âm',
    grade: 'Toán 7 · Lũy thừa số hữu tỉ',
    title: 'Phân biệt lũy thừa có ngoặc và không ngoặc của số âm',
    equation: 'So sánh: (−4)²  và  −4²',
    teacherPrompt: 'Trước khi cô viết kết quả tính toán lên bảng, hai bạn dự đoán xem: (−4)² và −4² có cùng ra kết quả là +16 hay không?',
    boQuote: 'Tớ cược là Bằng nhau: Cả hai đều bằng +16! Số âm mà có mũ chẵn thì luôn biến thành số dương, ai học toán cũng biết!',
    boChoice: 'A',
    options: [
      {
        key: 'A',
        label: 'Cược Phương án A (Giống Bo):',
        sublabel: 'Cả hai đều bằng +16 (Mũ 2 luôn ra số dương)',
        isCorrect: false,
      },
      {
        key: 'B',
        label: 'Cược Phương án B (Khác Bo):',
        sublabel: '(−4)² = +16, còn −4² = −16 (Khác nhau)',
        isCorrect: true,
      },
    ],
    observeSteps: [
      {
        stepNum: 1,
        title: 'Tính biểu thức có ngoặc (−4)²',
        detail: '(−4)² = (−4) × (−4) = +16 (Cơ số là toàn bộ số âm −4)',
        highlight: '(−4)² = 16',
      },
      {
        stepNum: 2,
        title: 'Tính biểu thức không ngoặc −4²',
        detail: '−4² = −(4 × 4) = −16 (Lũy thừa ưu tiên tính trước, dấu trừ ở ngoài giữ nguyên!)',
        highlight: '−4² = −16',
      },
      {
        stepNum: 3,
        title: 'Kết luận so sánh',
        detail: '(−4)² ≠ −4² vì +16 khác −16',
        highlight: '(−4)² = +16  và  −4² = −16',
      },
    ],
    blackboardSummary: '(−4)² = (−4)·(−4) = +16   ≠   −4² = −(4·4) = −16',
    explainWin: {
      boSpeech: 'Ủa alo?! Một cái dương một cái âm kìa! Tớ nhìn lướt qua cứ tưởng có mũ 2 là auto dương, cậu tinh mắt ghê!',
      teacherSpeech: 'Hoan hô Huy! Dấu ngoặc đơn có vai trò cực kỳ quan trọng: nó quyết định dấu trừ có tham gia vào phép nâng lên lũy thừa hay không.',
      ruleSummary: 'Ghi nhớ: (−a)² = a² (dấu trừ trong ngoặc), còn −a² = −(a²) (dấu trừ ở ngoài)!',
    },
    explainLose: {
      boSpeech: 'Huhu, tớ với cậu đều bị cái mũ 2 đánh lừa rồi! Không có ngoặc thì dấu trừ nằm trơ trọi ở ngoài!',
      teacherSpeech: 'Rất nhiều bạn cũng nhầm lẫn như hai đứa. Nhớ nhé: khi không có ngoặc, phép lũy thừa được ưu tiên thực hiện trước, sau đó mới gắn dấu trừ vào kết quả.',
      ruleSummary: 'Chốt kiến thức: Muốn bình phương cả số âm, bắt buộc phải bỏ trong ngoặc đơn!',
    },
    microRepair: {
      prompt: 'Thử tính nhanh: Giá trị của biểu thức −5² là bao nhiêu?',
      options: [
        { key: 'A', text: '−25', isCorrect: true },
        { key: 'B', text: '+25', isCorrect: false },
      ],
      explanation: 'Chính xác! Vì không có ngoặc, ta tính 5² = 25 rồi đặt dấu trừ đằng trước ➔ kết quả là −25!',
    },
  },
];

export const AlternativeFlowsSheet: React.FC<AlternativeFlowsSheetProps> = ({
  mode,
  onSwitchMode,
  onPoeTopicChange,
}) => {
  // Current POE Lesson
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const currentPoe = POE_LESSON_LIBRARY[selectedLessonIndex];

  // POE Phase: 'PREDICT' -> 'OBSERVE' -> 'EXPLAIN'
  const [poePhase, setPoePhase] = useState<'PREDICT' | 'OBSERVE' | 'EXPLAIN'>('PREDICT');
  const [studentBet, setStudentBet] = useState<'A' | 'B' | null>(null);
  const [observeProgressStep, setObserveProgressStep] = useState<number>(0);
  const [microAnswer, setMicroAnswer] = useState<'A' | 'B' | null>(null);

  // Notify parent of topic change for top ribbon sync
  useEffect(() => {
    if (mode === 'predict_poe' && onPoeTopicChange) {
      onPoeTopicChange(`${currentPoe.grade} · ${currentPoe.equation}`);
    }
  }, [mode, selectedLessonIndex, currentPoe, onPoeTopicChange]);

  // Protégé Teaching States
  const [teachingText, setTeachingText] = useState('');
  const [isBoUnderstood, setIsBoUnderstood] = useState(false);

  // Handle switching POE lesson
  const handleSwitchPoeLesson = (index: number) => {
    setSelectedLessonIndex(index);
    setPoePhase('PREDICT');
    setStudentBet(null);
    setObserveProgressStep(0);
    setMicroAnswer(null);
  };

  // Step into OBSERVE phase
  const handleStartObserve = () => {
    if (!studentBet) return;
    setPoePhase('OBSERVE');
    setObserveProgressStep(currentPoe.observeSteps.length);
  };

  // Step into EXPLAIN phase
  const handleProceedToExplain = () => {
    setPoePhase('EXPLAIN');
  };

  // Reset current POE
  const handleResetCurrentPoe = () => {
    setPoePhase('PREDICT');
    setStudentBet(null);
    setObserveProgressStep(0);
    setMicroAnswer(null);
  };

  const isWin = studentBet === (currentPoe.options.find(o => o.isCorrect)?.key);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
      {/* Left Sheet: Setup / Predict / Bet Recap */}
      <div className="lg:col-span-7">
        <div className="relative w-full bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-sm p-5 sm:p-7 sketchbook-shadow notebook-sheet rotate-[-0.5deg]">
          <WashiTape variant="blue" className="absolute -top-2.5 left-10 w-28 -rotate-2" />
          <PushPin color="#4E9B87" className="absolute top-3 right-4" />

          {mode === 'predict_poe' ? (
            /* ================= POE FLOW (LEFT SHEET) ================= */
            <div className="space-y-4">
              {/* Header with POE Lesson Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E8DFD0]">
                <div className="flex items-center gap-2">
                  <span className="font-handwriting font-bold text-sm bg-[#F5D65D]/50 text-[#705219] px-2.5 py-0.5 rounded-xs border border-[#F5D65D]">
                    {currentPoe.badge}
                  </span>
                  <span className="text-xs font-mono text-[#8C7E70]">{currentPoe.grade}</span>
                </div>

                {/* Lesson Switcher Buttons */}
                <div className="flex items-center gap-1">
                  {POE_LESSON_LIBRARY.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => handleSwitchPoeLesson(idx)}
                      type="button"
                      className={`text-xs px-2 py-0.5 rounded-xs border font-handwriting cursor-pointer transition-all ${
                        selectedLessonIndex === idx
                          ? 'bg-[#4E9B87] text-white font-bold border-[#3A7564]'
                          : 'bg-white text-[#6B5E51] border-[#DFD7C9] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      Bài {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase Step Indicator Pills */}
              <div className="grid grid-cols-3 gap-2 py-1 font-handwriting text-xs text-center">
                <div className={`py-1 rounded-xs border transition-colors ${
                  poePhase === 'PREDICT' 
                    ? 'bg-[#FFF8EB] border-[#E8A33D] font-bold text-[#8C5D19]' 
                    : 'bg-white/60 border-[#DFD7C9] text-[#8C7E70]'
                }`}>
                  1. Dự đoán (Predict)
                </div>
                <div className={`py-1 rounded-xs border transition-colors ${
                  poePhase === 'OBSERVE' 
                    ? 'bg-[#EEF8F5] border-[#4E9B87] font-bold text-[#1F453B]' 
                    : 'bg-white/60 border-[#DFD7C9] text-[#8C7E70]'
                }`}>
                  2. Quan sát (Observe)
                </div>
                <div className={`py-1 rounded-xs border transition-colors ${
                  poePhase === 'EXPLAIN' 
                    ? 'bg-[#F2EDFF] border-[#8A63D2] font-bold text-[#4B2F89]' 
                    : 'bg-white/60 border-[#DFD7C9] text-[#8C7E70]'
                }`}>
                  3. Đối chiếu (Explain)
                </div>
              </div>

              {/* Cô Lam's Question Prompt */}
              <div className="p-4 bg-[#242F2B] text-white rounded-xs border border-white/10 space-y-2">
                <div className="text-xs font-handwriting text-[#8CE6CF] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6B9E5C]" />
                  <span>Cô Lam tạm dừng trước khi viết lời giải:</span>
                </div>
                <div className="text-lg font-mono text-[#FFF9EC] font-bold">
                  {currentPoe.equation}
                </div>
                <p className="font-handwriting text-sm text-[#C5D8D0] leading-relaxed">
                  &ldquo;{currentPoe.teacherPrompt}&rdquo;
                </p>
              </div>

              {/* Bo's Naive / Confident Prediction */}
              <div className="flex items-start gap-3 bg-[#FFF8EB] p-3.5 rounded-sm border-2 border-[#E8A33D]/60 shadow-2xs">
                <BoAvatar size="sm" expression="confident" className="shrink-0 -rotate-2" />
                <div>
                  <div className="text-xs font-handwriting font-bold text-[#8C5D19]">Bo tự tin cá cược:</div>
                  <p className="font-handwriting text-base text-[#3E342B] mt-0.5">
                    &ldquo;{currentPoe.boQuote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Student's Betting Choice Buttons */}
              <div className="space-y-2">
                <div className="text-xs font-handwriting font-bold text-[#6B5E51] flex items-center justify-between">
                  <span>Lựa chọn dự đoán của em (Predict):</span>
                  {studentBet && (
                    <span className="text-[#3A7564] font-bold flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-[#3A7564]" />
                      <span>Đã chọn Phương án {studentBet}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentPoe.options.map((opt) => {
                    const isSelected = studentBet === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          if (poePhase === 'PREDICT') {
                            setStudentBet(opt.key);
                          }
                        }}
                        disabled={poePhase !== 'PREDICT'}
                        type="button"
                        className={`p-3 rounded-xs border-2 text-left font-handwriting text-base cursor-pointer transition-all ${
                          isSelected
                            ? opt.key === 'A'
                              ? 'bg-[#FFF8EB] border-[#E8A33D] font-bold text-[#3B2F24] shadow-xs'
                              : 'bg-[#EEF8F5] border-[#4E9B87] font-bold text-[#1F453B] shadow-xs'
                            : 'bg-white border-[#DFD7C9] text-[#5A4E42] hover:bg-[#FAF7F2]'
                        } ${poePhase !== 'PREDICT' ? 'opacity-85 cursor-default' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{opt.label}</span>
                          {isSelected && (
                            <span className="text-xs font-mono font-bold flex items-center gap-1 text-[#8C5D19]">
                              <GoldenStarIcon className="w-3 h-3 text-[#E8A33D]" />
                              <span>Cược của em</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono font-semibold text-[#665747] mt-1">
                          {opt.sublabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button depending on Phase */}
              {poePhase === 'PREDICT' && (
                <button
                  onClick={handleStartObserve}
                  disabled={!studentBet}
                  type="button"
                  className="w-full py-2.5 bg-[#4E9B87] hover:bg-[#3D8270] disabled:opacity-40 text-white font-handwriting font-bold text-base rounded-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <VideoPlayIcon className="w-4 h-4" />
                  <span>Xác nhận cược &amp; Vào xem Cô Lam giải (Observe) ➔</span>
                </button>
              )}

              {poePhase === 'OBSERVE' && (
                <div className="p-3 bg-[#EEF8F5] border border-[#A7DDD0] rounded-xs flex items-center justify-between font-handwriting text-xs text-[#1F453B]">
                  <span>Đang ở phòng quan sát bảng phấn của Cô Lam...</span>
                  <button
                    onClick={() => setPoePhase('PREDICT')}
                    type="button"
                    className="underline text-[#2E6859] font-bold hover:text-[#193F35] cursor-pointer"
                  >
                    Đổi lại cược
                  </button>
                </div>
              )}

              {poePhase === 'EXPLAIN' && (
                <div className="p-3 bg-[#FAF7F2] border border-[#DFD7C9] rounded-xs font-handwriting text-xs text-[#6B5E51] flex items-center justify-between">
                  <span>Trận cược hoàn tất. Xem phân tích chi tiết ở trang bên phải!</span>
                  <button
                    onClick={handleResetCurrentPoe}
                    type="button"
                    className="underline text-[#8C5D19] font-bold hover:text-[#5C3D10] cursor-pointer"
                  >
                    Dự đoán lại bài này
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ================= PROTEGE TEACHING FLOW ================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD0]">
                <span className="font-handwriting font-bold text-sm bg-[#4E9B87]/20 text-[#22574A] px-2.5 py-0.5 rounded-xs border border-[#4E9B87]/40">
                  Flow 3: Học viên làm gia sư giảng bài cho Bo (Protégé Effect)
                </span>
                <span className="text-xs font-mono text-[#8C7E70]">Toán 7 · Quy đồng mẫu số</span>
              </div>

              {/* Bo gets confused and asks for peer help */}
              <div className="flex items-start gap-3 bg-[#FFF8EB] p-4 rounded-sm border-2 border-[#E8A33D] shadow-xs">
                <BoAvatar size="md" expression="embarrassed" className="shrink-0 -rotate-3" />
                <div>
                  <div className="text-xs font-handwriting font-bold text-[#8C5D19]">Bo cầu cứu:</div>
                  <p className="font-handwriting text-base sm:text-lg text-[#3E342B] mt-0.5 leading-snug">
                    &ldquo;Huy ơi! Đoạn Cô Lam cộng phân số <strong>1/3 + 1/4</strong>, cô giảng lướt qua nhanh quá tớ lú luôn rồi! Sao cô không lấy (1+1)/(3+4) = 2/7 cho nhanh mà tự nhiên lại biến thành 4/12 + 3/12 chi cho rắc rối vậy?&rdquo;
                  </p>
                </div>
              </div>

              {/* Cô Lam delegates to learner */}
              <div className="flex items-center gap-2.5 bg-[#EEF8F5] p-3 rounded-xs border border-[#D5EFE7]">
                <TutorLamAvatar size="sm" className="shrink-0" />
                <p className="text-xs font-handwriting text-[#234F42]">
                  <strong>Cô Lam:</strong> &ldquo;Huy đã nắm chắc quy tắc cộng phân số rồi đúng không? Em hãy đóng vai gia sư giải thích lại cho Bo hiểu vì sao không được cộng thẳng mẫu số nhé!&rdquo;
                </p>
              </div>

              {/* Concept reminder helper */}
              <div className="p-3 bg-white rounded-xs border border-[#DFD7C9] text-xs font-handwriting text-[#6E6152] space-y-1">
                <div className="font-bold text-[#42372C] flex items-center gap-1.5">
                  <GentleLightbulb className="w-3.5 h-3.5 text-[#E8A33D]" />
                  <span>Gợi ý cho gia sư:</span>
                </div>
                <p>Hãy liên tưởng đến việc chia cái bánh: 1/3 cái bánh to hơn 1/4 cái bánh, hai miếng kích thước khác nhau thì không thể gộp số miếng lại được!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sheet: The Resolution / Observe Chalkboard / Explain */}
      <div className="lg:col-span-5">
        <div className="relative w-full bg-[#FAF6EE] border-2 border-[#DDD6C8] rounded-sm p-5 sm:p-6 sketchbook-shadow notebook-sheet rotate-[0.5deg]">
          <WashiTape variant="yellow" className="absolute -top-2.5 right-10 w-24 rotate-1" />
          <PushPin color="#E8A33D" className="absolute top-3 left-4" />

          {mode === 'predict_poe' ? (
            /* ================= POE RIGHT SHEET ================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD0]">
                <span className="text-xs font-handwriting font-bold text-[#7A6D5E]">
                  {poePhase === 'PREDICT' && 'Phòng niêm phong kết quả (Locked)'}
                  {poePhase === 'OBSERVE' && 'Bảng phấn thực nghiệm (Observe)'}
                  {poePhase === 'EXPLAIN' && 'Kết quả đối chiếu & Giải thích (Explain)'}
                </span>
                <span className="text-[11px] font-mono text-[#8C7E70]">
                  {poePhase === 'PREDICT' && <span className="bg-[#FFF4DF] px-2 py-0.5 rounded-full text-[#8C5D19] border border-[#F0D5A3]">Chờ đặt cược</span>}
                  {poePhase === 'OBSERVE' && <span className="bg-[#EBF7F4] px-2 py-0.5 rounded-full text-[#23584A] border border-[#BDE7DC] font-bold">Đang hé lộ...</span>}
                  {poePhase === 'EXPLAIN' && (
                    <span className="bg-[#EEF8F5] px-2 py-0.5 rounded-full text-[#1F453B] border border-[#4E9B87]/40 font-bold inline-flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3 text-[#4E9B87]" />
                      <span>Hoàn thành</span>
                    </span>
                  )}
                </span>
              </div>

              {/* ---------------- PHASE 1: PREDICT (LOCKED / WAITING) ---------------- */}
              {poePhase === 'PREDICT' && (
                <div className="py-12 px-4 text-center text-xs font-handwriting text-[#8A7D6F] space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#FFF5DC] border-2 border-dashed border-[#E8A33D] flex items-center justify-center text-2xl text-[#E8A33D] font-mono">
                    ?
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-[#4E4135]">
                      Kết quả đang được niêm phong!
                    </p>
                    <p className="max-w-xs mx-auto text-[#736556]">
                      {studentBet 
                        ? `Em đã chọn Phương án ${studentBet}! Hãy bấm nút "Vào xem Cô Lam giải (Observe)" ở trang bên trái để hé lộ bảng phấn!` 
                        : 'Hãy chọn cược Phương án A (giống Bo) hoặc B (khác Bo) ở trang bên trái trước khi xem kết quả.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ---------------- PHASE 2: OBSERVE (CHALKBOARD REVEAL) ---------------- */}
              {poePhase === 'OBSERVE' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-xs font-handwriting text-[#2A5E51] font-bold bg-[#EEF8F5] p-2.5 rounded-xs border border-[#CDECE3]">
                    <ChalkboardIcon className="w-4 h-4 text-[#4E9B87]" />
                    <span>Cô Lam hạ bút giải từng bước trên bảng:</span>
                  </div>

                  {/* Chalkboard Card */}
                  <div className="p-4 bg-[#23302B] rounded-xs border-2 border-[#394C45] text-white space-y-3 shadow-inner">
                    <div className="text-[11px] font-mono text-[#8CE6CF] uppercase tracking-wider pb-1.5 border-b border-white/10 flex justify-between">
                      <span>Bảng phấn Cô Lam</span>
                      <span>{currentPoe.grade}</span>
                    </div>

                    <div className="space-y-2.5">
                      {currentPoe.observeSteps.map((step, idx) => (
                        <div key={step.stepNum} className="text-xs font-mono space-y-0.5 animate-in fade-in slide-in-from-left duration-200">
                          <div className="text-[#8CE6CF] font-handwriting text-[11px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6B9E5C]" />
                            <span>Bước {step.stepNum}: {step.title}</span>
                          </div>
                          <div className="text-[#FFF9EC] text-sm pl-3 font-semibold bg-black/20 p-1.5 rounded-xs border-l-2 border-[#E8A33D]">
                            {step.detail}
                          </div>
                          {step.highlight && (
                            <div className="text-[11px] font-handwriting text-[#F5D65D] pl-3 italic">
                              ➜ {step.highlight}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/10 text-xs font-mono text-center text-[#FFE9AD] font-bold">
                      ĐÁP ÁN: {currentPoe.blackboardSummary}
                    </div>
                  </div>

                  {/* Proceed to Explain Button */}
                  <button
                    onClick={handleProceedToExplain}
                    type="button"
                    className="w-full py-2.5 bg-[#E8A33D] hover:bg-[#D9932B] text-white font-handwriting font-bold text-sm rounded-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Đã quan sát xong ➔ Đối chiếu &amp; Xem Bo phản ứng (Explain)</span>
                  </button>
                </div>
              )}

              {/* ---------------- PHASE 3: EXPLAIN (DEBATE & MICRO-REPAIR) ---------------- */}
              {poePhase === 'EXPLAIN' && (
                <div className="space-y-3.5 animate-in fade-in duration-300">
                  {/* Win / Loss Rubber Stamp */}
                  <div className="flex justify-center">
                    {isWin ? (
                      <RubberStampSuccess />
                    ) : (
                      <div className="inline-flex items-center justify-center p-2.5 border-3 border-dashed border-[#E8A33D] text-[#8C5D19] rounded-md font-bold tracking-wider uppercase rotate-[-4deg] bg-[#FFF8EB] select-none shadow-xs">
                        <div className="flex items-center gap-1.5 px-1 py-0.5 border border-[#E8A33D]">
                          <SparkleIcon className="w-3 h-3 text-[#E8A33D]" />
                          <span className="text-xs font-mono font-bold tracking-widest">CÙNG MẮC BẪY VỚI BO</span>
                          <SparkleIcon className="w-3 h-3 text-[#E8A33D]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Blackboard Recap */}
                  <div className="p-2.5 bg-[#242F2B] text-white rounded-xs border border-white/10 font-mono text-xs">
                    <div className="text-[#8CE6CF] font-handwriting font-bold mb-0.5 text-[11px]">Kết quả trên bảng:</div>
                    <div className="text-xs font-bold text-[#FFF3D6]">
                      {currentPoe.blackboardSummary}
                    </div>
                  </div>

                  {/* Bo's Dynamic Reaction based on Win/Lose */}
                  <div className="p-3 bg-[#FFF8EB] border border-[#F0D5A3] rounded-xs flex items-start gap-2.5">
                    <BoAvatar 
                      size="sm" 
                      expression={isWin ? 'embarrassed' : 'skeptical'} 
                      className="shrink-0" 
                    />
                    <div>
                      <div className="text-xs font-handwriting font-bold text-[#8C5D19]">Bo phản ứng:</div>
                      <p className="font-handwriting text-sm text-[#3E342B] mt-0.5">
                        &ldquo;{isWin ? currentPoe.explainWin.boSpeech : currentPoe.explainLose.boSpeech}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Cô Lam's Educational Feedback */}
                  <div className="p-3 bg-[#EEF8F5] border border-[#D5EFE7] rounded-xs text-xs font-handwriting text-[#244F42]">
                    <strong>Cô Lam:</strong> &ldquo;{isWin ? currentPoe.explainWin.teacherSpeech : currentPoe.explainLose.teacherSpeech}&rdquo;
                    <div className="mt-1.5 p-1.5 bg-white/70 rounded-xs border border-[#CDECE3] font-bold text-[#1D4A3D] flex items-center gap-1.5">
                      <PinTackIcon className="w-3.5 h-3.5 text-[#E8A33D] shrink-0" />
                      <span>{isWin ? currentPoe.explainWin.ruleSummary : currentPoe.explainLose.ruleSummary}</span>
                    </div>
                  </div>

                  {/* Interactive Micro-Repair Quiz: Try it right away! */}
                  <div className="p-3 bg-white border border-[#DFD7C9] rounded-xs space-y-2">
                    <div className="text-xs font-handwriting font-bold text-[#42372C] flex items-center gap-1.5">
                      <SparkleIcon className="w-3.5 h-3.5 text-[#E8A33D]" />
                      <span>{currentPoe.microRepair.prompt}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {currentPoe.microRepair.options.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setMicroAnswer(opt.key)}
                          type="button"
                          className={`p-2 rounded-xs border text-center font-mono text-xs cursor-pointer transition-colors ${
                            microAnswer === opt.key
                              ? opt.isCorrect
                                ? 'bg-[#EEF8F5] border-[#4E9B87] font-bold text-[#1F453B]'
                                : 'bg-[#FFF8EB] border-[#E8A33D] font-bold text-[#8C5D19]'
                              : 'bg-[#FAF7F2] border-[#DFD7C9] text-[#5C4F42] hover:bg-white'
                          }`}
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>

                    {microAnswer && (
                      <div className="text-xs font-handwriting p-2 rounded-xs bg-[#F7F4EE] border border-[#E3DDD1]">
                        {microAnswer === (currentPoe.microRepair.options.find(o => o.isCorrect)?.key) ? (
                          <div className="text-[#256150] font-bold flex items-center gap-1">
                            <CheckCircleIcon className="w-3.5 h-3.5 text-[#4E9B87]" />
                            <span>{currentPoe.microRepair.explanation}</span>
                          </div>
                        ) : (
                          <div className="text-[#8C5D19]">
                            Chưa chính xác rồi! Hãy xem lại quy tắc ở bảng Cô Lam phía trên nhé!
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation / Next Actions */}
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    {selectedLessonIndex < POE_LESSON_LIBRARY.length - 1 ? (
                      <button
                        onClick={() => handleSwitchPoeLesson(selectedLessonIndex + 1)}
                        type="button"
                        className="flex-1 py-2 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-xs rounded-xs shadow-xs cursor-pointer"
                      >
                        Thử thách POE tiếp theo: Bài {selectedLessonIndex + 2} ➔
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSwitchPoeLesson(0)}
                        type="button"
                        className="flex-1 py-2 bg-[#4E9B87] hover:bg-[#3D8270] text-white font-handwriting font-bold text-xs rounded-xs shadow-xs cursor-pointer"
                      >
                        Quay lại Bài 1 ➔
                      </button>
                    )}

                    <button
                      onClick={() => onSwitchMode('video_clash')}
                      type="button"
                      className="py-2 px-3 bg-[#E8A33D] hover:bg-[#D9932B] text-white font-handwriting font-bold text-xs rounded-xs shadow-xs cursor-pointer"
                    >
                      Thử Chế độ Video Tranh luận ➔
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================= PROTEGE TEACHING (RIGHT SHEET) ================= */
            <div className="space-y-4">
              <div className="text-xs font-handwriting font-bold text-[#7A6D5E] pb-2 border-b border-[#E8DFD0]">
                Lời giải thích của gia sư:
              </div>

              {!isBoUnderstood ? (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={teachingText}
                    onChange={(e) => setTeachingText(e.target.value)}
                    placeholder="Gõ lời giải thích cho Bo (ví dụ: Vì 1/3 và 1/4 khác mẫu số, hai miếng bánh không đều nhau nên phải quy đồng về cùng mẫu số 12 mới cộng được...)"
                    className="w-full p-3 bg-white border border-[#D8CEBC] rounded-xs font-handwriting text-sm text-[#2E2825] focus:outline-none focus:border-[#4E9B87]"
                  />

                  {/* Quick explanation helper tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setTeachingText('Vì mẫu số khác nhau, hai miếng bánh không đều nhau nên phải quy đồng về mẫu 12 mới cộng được!')}
                      type="button"
                      className="text-xs font-handwriting bg-[#FFF8EB] hover:bg-[#FCEFD5] text-[#8C5D19] px-2 py-1 border border-[#F0D5A3] rounded-xs cursor-pointer"
                    >
                      + Gợi ý về miếng bánh
                    </button>
                    <button
                      onClick={() => setTeachingText('Cộng phân số bắt buộc phải cùng mẫu số, nếu không kết quả 2/7 nhỏ hơn cả 1/3 là vô lý!')}
                      type="button"
                      className="text-xs font-handwriting bg-[#EEF8F5] hover:bg-[#DFEFE9] text-[#2E6859] px-2 py-1 border border-[#D5EFE7] rounded-xs cursor-pointer"
                    >
                      + Gợi ý về tính vô lý
                    </button>
                  </div>

                  <button
                    onClick={() => setIsBoUnderstood(true)}
                    disabled={!teachingText.trim()}
                    type="button"
                    className="w-full py-2.5 bg-[#4E9B87] hover:bg-[#3D8270] disabled:opacity-40 text-white font-handwriting font-bold text-base rounded-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Gửi lời giảng cho Bo ➔
                  </button>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex justify-center">
                    <RubberStampSuccess />
                  </div>

                  {/* Bo gets the insight */}
                  <div className="p-3.5 bg-[#FFF9EC] border border-[#F0D5A3] rounded-xs flex items-start gap-3">
                    <BoAvatar size="sm" expression="happy" className="shrink-0" />
                    <div>
                      <div className="text-xs font-handwriting font-bold text-[#8C5D19]">Bo sáng mắt ra:</div>
                      <p className="font-handwriting text-sm text-[#3E342B] mt-0.5">
                        &ldquo;Aaaa tớ hiểu rồi! 1/3 cái bánh to đùng, 1/4 nhỏ hơn, lấy (1+1)/(3+4) = 2/7 thì tự nhiên bánh bị bé đi! Phải quy về cùng mẫu 12 mới biết tổng cộng là bao nhiêu phần! Cậu giải thích dễ hiểu hơn sách nhiều!&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#EEF8F5] border border-[#D5EFE7] rounded-xs text-xs font-handwriting text-[#224E41]">
                    <strong>Cô Lam:</strong> &ldquo;Khi em có thể dạy lại cho người khác hiểu, em đã thực sự làm chủ kiến thức đó. Tuyệt vời lắm gia sư nhí!&rdquo;
                  </div>

                  <button
                    onClick={() => {
                      setIsBoUnderstood(false);
                      setTeachingText('');
                      onSwitchMode('video_clash');
                    }}
                    type="button"
                    className="w-full py-2 bg-[#E8A33D] hover:bg-[#D9932B] text-white font-handwriting font-bold text-sm rounded-xs shadow-xs cursor-pointer"
                  >
                    Quay lại Chế độ Video Checkpoint ➔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
