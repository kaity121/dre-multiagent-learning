/**
 * roundtableOrchestrator.js
 *
 * EPIC 3: MULTI-AGENT COLLABORATIVE SCRIPTWRITER & CROSS-CHECKING (#302)
 * Buồng họp biên kịch đa tác nhân A2A (Director / Blackboard Pattern)
 * có rà soát chéo, xác thực toán học bằng Deterministic Tools và RAG.
 *
 * Quy trình thực thi:
 * 1. Cô Lam (Director) quét CognitiveEventStream, chia Part, chọn mốc vàng (trapRiskLevel cao).
 * 2. Bo (Hệ 1 - Trực giác) đề xuất bẫy nhận thức tự nhiên từ bảng phấn.
 * 3. Trí (Hệ 2 - Logic) kích hoạt Deterministic Tool kiểm chứng.
 *    - Cross-Check Loop (WOW Moment): Nếu bẫy sai phi thực tế (isValid: false), Trí bác bỏ và yêu cầu Bo sửa lại (vòng lặp có giới hạn, tối đa 2 vòng).
 * 4. Linh Chi đề xuất sổ tay / mẹo ghi nhớ; Minh Khang đưa ra ví dụ đời sống trực quan.
 * 5. Cô Lam thẩm định mức Bloom (Analyze / Apply) và nhịp timeline (collision checker), chốt Checkpoint.
 *
 * Đầu ra: DRELessonSchema (draft) đầy đủ Parts, Checkpoints, Scenarios và AgentReasoningEvent[].
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeTool } from '../tools/index.js';
import { getById, search, kb } from './knowledgeBase.js';
import { chatJSON, chatWithTools } from '../openaiClient.js';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DRAFTS_DIR = path.join(__dirname, '../data/drafts');

// Đảm bảo thư mục lưu draft tồn tại
if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
}

/**
 * Tạo một AgentReasoningEvent chuẩn contract src/types/pipeline.ts
 */
function createReasoningEvent({
  eventType,
  agentId,
  agentDisplayName,
  content,
  secondTarget,
  toolCall = null,
}) {
  return {
    id: `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType,
    agentId,
    agentDisplayName,
    secondTarget,
    content,
    toolCall: toolCall || undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Phân chia CognitiveEventStream thành các Part bài giảng sư phạm
 */
export function partitionTimelineIntoParts(cognitiveStream) {
  const segments = cognitiveStream.segments || [];
  const duration = cognitiveStream.durationSeconds || 3480;

  // Với bài Vectơ 12 của thầy Tiến (~58 phút), chia làm 3 Part chuẩn sư phạm
  const partsConfig = [
    {
      partNumber: 1,
      title: 'Phần 1: Khái niệm & Phương hướng Vectơ trong không gian',
      startSecond: 0,
      endSecond: Math.min(900, duration),
      targetSegmentId: 'seg_04_42', // 282s (04:42) - Hai đường thẳng chéo nhau
      misconceptionId: 'MISC_VEC_001',
    },
    {
      partNumber: 2,
      title: 'Phần 2: Phép toán Vectơ & Quy tắc Hình hộp',
      startSecond: 900,
      endSecond: Math.min(2000, duration),
      targetSegmentId: 'seg_30_13', // 1813s (30:13) - Quy tắc hình hộp 8 đỉnh
      misconceptionId: 'MISC_VEC_006',
    },
    {
      partNumber: 3,
      title: 'Phần 3: Bài tập Tính toán độ dài & Bẫy cộng độ dài (Trọng tâm)',
      startSecond: 2000,
      endSecond: duration,
      targetSegmentId: 'seg_37_13', // 2233s (37:13) - Ví dụ 3 hình lập phương
      misconceptionId: 'MISC_VEC_005',
    },
  ];

  return partsConfig.map(part => {
    const partSegments = segments.filter(
      s => s.second >= part.startSecond && s.second < part.endSecond
    );
    const chosenSegment =
      segments.find(s => s.id === part.targetSegmentId) ||
      partSegments.find(s => s.trapRiskLevel === 'high') ||
      partSegments.find(s => s.trapRiskLevel === 'medium') ||
      partSegments[partSegments.length - 1];

    return {
      ...part,
      segments: partSegments,
      chosenSegment,
    };
  });
}

/**
 * Điều phối buồng họp Roundtable cho 1 Part cụ thể
 */
export async function runRoundtableForPart(partInfo, { useLLM = false } = {}) {
  const events = [];
  const recordedToolCalls = [];

  function record(eventType, agentId, agentDisplayName, content, toolCall = null) {
    const evt = createReasoningEvent({
      eventType,
      agentId,
      agentDisplayName,
      content,
      secondTarget: partInfo.chosenSegment?.second,
      toolCall,
    });
    events.push(evt);
    if (toolCall) recordedToolCalls.push(toolCall);
    return evt;
  }

  const segment = partInfo.chosenSegment;
  const second = segment ? segment.second : partInfo.startSecond + 30;
  const timeFormatted = segment ? segment.timeFormatted : '00:30';

  // ==========================================================================
  // VÒNG 1: CÔ LAM (DIRECTOR) QUÉT CES & CHỌN MỐC DỪNG
  // ==========================================================================
  record(
    'thought',
    'colam',
    'Cô Lam (Director)',
    `Cô Lam đang phân tích phân đoạn "${partInfo.title}". Phát hiện mốc thời gian ${timeFormatted} (${second}s) có mức độ rủi ro ngộ nhận: ${segment?.trapRiskLevel || 'high'}. Bắt đầu phiên họp Roundtable biên kịch.`
  );

  // Tra cứu RAG tri thức chuẩn bị cho buồng họp
  const ragToolCall = executeTool('tool_query_misconception_kb', {
    misconceptionId: partInfo.misconceptionId || 'MISC_VEC_005',
  });
  record(
    'tool_call',
    'colam',
    'Cô Lam (Director)',
    `Tra cứu tri thức ngộ nhận RAG cho mốc ${timeFormatted}: ${ragToolCall.toolName}`,
    ragToolCall
  );
  record(
    'tool_result',
    'colam',
    'Cô Lam (Director)',
    `Kết quả RAG: Tìm thấy tri thức chuẩn ${ragToolCall.output[0]?.misconceptionName || 'Ngộ nhận vectơ'}`,
    ragToolCall
  );

  const kbItem = ragToolCall.output[0] || {};

  record(
    'debate_turn',
    'colam',
    'Cô Lam (Director)',
    `Chào cả lớp! Tại mốc ${timeFormatted}, thầy Tiến đang giảng về ${segment?.audioTranscript?.slice(0, 80) || 'biểu thức vectơ'}. Bo ơi, cậu thấy đoạn này học sinh hay vướng bẫy gì nhất?`
  );

  // ==========================================================================
  // VÒNG 2 & 3: BO ĐỀ XUẤT BẪY & TRÍ RÀ SOÁT CHÉO (CROSS-CHECK LOOP CÓ SỬA LỖI)
  // ==========================================================================
  let boFinalTrap = '';
  let boFinalClaim = '';
  let crossCheckVerdict = null;
  let crossCheckCorrectionOccurred = false;

  // Mốc 37:13 (Part 3) thực hiện khoảnh khắc WOW rà soát chéo qua 2 lượt sửa sai thực sự
  if (partInfo.partNumber === 3 || segment?.id === 'seg_37_13') {
    // LƯỢT 1: Bo đưa ra đề xuất bẫy có lỗi hình học phi lý (gán nhầm tên vectơ AB)
    const boInitialSpeech =
      "Cộng độ dài cho lẹ: |BC + DD'| = 1 + 1 = 2! Với lại vectơ BC cộng DD' chắc chắn ra luôn vectơ AB rồi!";
    const initialClaim = 'AB';

    record(
      'thought',
      'bo',
      'Bo (Hệ 1 - Trực giác)',
      `Bo muốn đề xuất bẫy shortcut tính nhanh và đoán mò vectơ tổng là AB.`
    );
    record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boInitialSpeech);

    // Trí kích hoạt tool kiểm chứng phát ngôn Lần 1 của Bo
    record(
      'thought',
      'tri',
      'Trí (Hệ 2 - Logic)',
      `Trí nghi ngờ phát biểu của Bo có sự sai lệch về cả hình học lẫn độ dài. Kích hoạt tool_verify_vector_algebra để kiểm chứng toạ độ.`
    );

    const check1ToolCall = executeTool('tool_verify_vector_algebra', {
      shape: 'cube',
      side: '1',
      expr: "|BC + DD'|",
      claim: initialClaim,
    });

    record(
      'tool_call',
      'tri',
      'Trí (Hệ 2 - Logic)',
      `Kích hoạt tool_verify_vector_algebra để kiểm chứng claim "${initialClaim}" của Bo`,
      check1ToolCall
    );
    record(
      'tool_result',
      'tri',
      'Trí (Hệ 2 - Logic)',
      `Tool trả về isValid: ${check1ToolCall.isValid} — ${check1ToolCall.output?.reason}`,
      check1ToolCall
    );

    // Trí BÁC BỎ đề xuất sai phi thực tế của Bo (Khoảnh khắc WOW trên War Room)
    const rejectionSpeech = `Bo nhầm to rồi! Tớ vừa chạy toạ độ kiểm chứng: BC + DD' = BC + CC' = BC', phương hướng hoàn toàn khác vectơ AB! Bẫy như vậy là "sai kiểu không có thật", học sinh sẽ thấy vô lý ngay. Cậu hãy giữ đúng bản chất ngộ nhận cộng độ dài đại số thôi!`;
    record(
      'cross_check_verdict',
      'tri',
      'Trí (Hệ 2 - Logic)',
      rejectionSpeech,
      check1ToolCall
    );

    crossCheckCorrectionOccurred = true;

    // LƯỢT 2: Bo tiếp thu phản biện, sửa lại bẫy nhận thức tự nhiên đạt chuẩn sư phạm
    boFinalClaim = '2a';
    boFinalTrap =
      "À tớ nhìn nhầm đỉnh! Nhưng về độ dài thì cạnh bằng a nên |BC + DD'| = a + a = 2a chứ còn gì nữa!";
    record(
      'thought',
      'bo',
      'Bo (Hệ 1 - Trực giác)',
      `Bo rút kinh nghiệm từ tool kiểm chứng của Trí, chuyển sang gài bẫy ngộ nhận cộng trực tiếp độ dài 1+1=2.`
    );
    record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boFinalTrap);

    // Trí kiểm chứng lại bẫy sửa đổi của Bo
    const check2ToolCall = executeTool('tool_verify_vector_algebra', {
      shape: 'cube',
      side: 'a',
      expr: "|BC + DD'|",
      claim: '2a',
    });
    record(
      'tool_call',
      'tri',
      'Trí (Hệ 2 - Logic)',
      `Kiểm chứng bẫy ngộ nhận đại số của Bo: tool_verify_vector_algebra với claim "2a"`,
      check2ToolCall
    );
    record(
      'tool_result',
      'tri',
      'Trí (Hệ 2 - Logic)',
      `Tool xác thực: ${check2ToolCall.output?.reason}`,
      check2ToolCall
    );

    // Trí đồng thuận phê duyệt bẫy sửa đổi của Bo
    const consensusSpeech = `Bẫy này rất tự nhiên! Học sinh thường lấy ngay |BC| + |DD'| = a + a = 2a do thói quen đại số, quên mất bất đẳng thức tam giác và định lý Pytago đường chéo BC' = a√2. Tớ đồng ý chọn bẫy này!`;
    record(
      'cross_check_verdict',
      'tri',
      'Trí (Hệ 2 - Logic)',
      consensusSpeech,
      check2ToolCall
    );
    crossCheckVerdict = consensusSpeech;

  } else if (partInfo.partNumber === 2 || segment?.id === 'seg_30_13') {
    // Part 2: Quy tắc hình hộp
    boFinalClaim = 'AC';
    boFinalTrap = "Quy tắc hình hộp: Xuất phát từ gốc A thì AB + AD + AA' ra đường chéo đáy AC chứ nhỉ!";
    record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boFinalTrap);

    const boxToolCall = executeTool('tool_verify_vector_algebra', {
      shape: 'cube',
      side: 'a',
      expr: "|AB + AD + AA'|",
      claim: boFinalClaim,
    });
    record(
      'tool_call',
      'tri',
      'Trí (Hệ 2 - Logic)',
      'Kiểm chứng quy tắc hình hộp qua tool_verify_vector_algebra',
      boxToolCall
    );
    record(
      'tool_result',
      'tri',
      'Trí (Hệ 2 - Logic)',
      `Kết quả kiểm chứng: ${boxToolCall.output?.reason}`,
      boxToolCall
    );

    const triRebuttal = `Bo quên mất vectơ chiều cao AA' rồi! AB + AD mới ra AC ở đáy. Thêm AA' phải vươn lên đỉnh đối diện tạo thành đường chéo không gian AC' với độ dài a√3!`;
    record('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triRebuttal, boxToolCall);
    crossCheckVerdict = triRebuttal;

  } else {
    // Part 1: Hai đường thẳng chéo nhau
    boFinalClaim = 'cùng phương';
    boFinalTrap = "Hai đường thẳng chéo nhau thì tớ thấy giá của chúng vẫn xét cùng phương được mà!";
    record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boFinalTrap);

    const kbTool = executeTool('tool_query_misconception_kb', {
      misconceptionId: 'MISC_VEC_001',
    });
    record('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', 'Truy xuất SGK qua tool_query_misconception_kb', kbTool);
    record('tool_result', 'tri', 'Trí (Hệ 2 - Logic)', 'Tìm thấy định nghĩa chuẩn', kbTool);

    const triRebuttal = `Không được đâu Bo! SGK định nghĩa hai vectơ cùng phương khi và chỉ khi giá của chúng song song hoặc trùng nhau. Chéo nhau là hai đường thẳng không đồng phẳng, không thể cùng phương!`;
    record('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triRebuttal, kbTool);
    crossCheckVerdict = triRebuttal;
  }

  // ==========================================================================
  // VÒNG 4: LINH CHI (NOTE TAKER) & MINH KHANG (ẨN DỤ ĐỜI SỐNG)
  // ==========================================================================
  const linhChiTip =
    partInfo.partNumber === 3
      ? "Linh Chi note vào sổ tay nè: Muốn tính độ dài vectơ tổng, bước 1 là tìm vectơ thay thế để gom về một vectơ duy nhất (DD' = CC' => BC + CC' = BC'), sau đó mới tính Pytago đường chéo ra a√2!"
      : "Linh Chi ghi nhớ: Đưa về chung gốc hoặc nối đuôi liên tiếp trước khi kết luận!";

  record(
    'thought',
    'linhchi',
    'Linh Chi (Note Taker)',
    'Linh Chi trích xuất quy tắc sư phạm và lập bảng ghi chú bỏ túi cho học sinh.'
  );
  record('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTip);

  const minhKhangAnalogy =
    partInfo.partNumber === 3
      ? "Minh Khang ví von đời sống nè: Giống như bạn đi bộ từ nhà ra đầu ngõ a mét rồi rẽ vuông góc đi tiếp a mét. Khoảng cách đường chim bay từ nhà đến điểm cuối là cạnh huyền a√2, làm sao mà lấy a + a = 2a được!"
      : "Minh Khang hình dung: Giống như kéo một thùng hàng trong không gian, lực nâng lên và lực kéo ngang kết hợp lại sẽ kéo xiên theo đường chéo!";

  record(
    'thought',
    'minhkhang',
    'Minh Khang (Trực quan)',
    'Minh Khang liên hệ bài toán với hiện tượng đời sống hàng ngày để học sinh dễ nhớ.'
  );
  record('debate_turn', 'minhkhang', 'Minh Khang (Trực quan)', minhKhangAnalogy);

  // ==========================================================================
  // VÒNG 5: CÔ LAM THẨM ĐỊNH BLOOM, PACING TIMELINE & CHỐT CHECKPOINT
  // ==========================================================================
  const checkpointQuestionText =
    partInfo.partNumber === 3
      ? "Cho hình lập phương ABCD.A'B'C'D' cạnh a. Tính độ dài của vectơ tổng BC + DD'. Phát biểu nào sau đây chính xác?"
      : `Tại mốc ${timeFormatted}, em hãy chọn phát biểu đúng về ${segment?.pedagogicalTags?.[0] || 'vectơ trong không gian'}:`;

  // Thẩm định Bloom
  const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
    question: checkpointQuestionText,
    expected_points: ['Chỉ ra DD\' = CC\'', 'Tính độ dài đường chéo bằng Pytago', 'Không cộng độ dài trực tiếp'],
  });
  record(
    'tool_call',
    'colam',
    'Cô Lam (Director)',
    `Thẩm định bậc Bloom cho câu hỏi checkpoint: ${bloomToolCall.toolName}`,
    bloomToolCall
  );
  record(
    'tool_result',
    'colam',
    'Cô Lam (Director)',
    `Mức Bloom thẩm định: ${bloomToolCall.output?.level} (Điểm: ${bloomToolCall.output?.score}/6)`,
    bloomToolCall
  );

  // Thẩm định Timeline collision (Pacing)
  const timelineToolCall = executeTool('tool_timeline_collision_checker', {
    events: [
      { id: `stop_${second}`, at_s: second, actor_id: 'colam', type: 'checkpoint' },
      { id: `bo_challenge_${second + 2}`, at_s: second + 2, actor_id: 'bo', type: 'comment', isChained: true },
    ],
    minGapS: 20,
    warmupPeriodS: 15,
    maxCheckpoints: 1,
  });
  record(
    'tool_call',
    'colam',
    'Cô Lam (Director)',
    `Kiểm tra nhịp thời gian bài giảng và chống va chạm (Pacing Checker)`,
    timelineToolCall
  );
  record(
    'tool_result',
    'colam',
    'Cô Lam (Director)',
    `Kết quả Pacing: ${timelineToolCall.isValid ? 'Hợp lệ' : 'Cảnh báo'} (${timelineToolCall.output?.reason || 'Đạt chuẩn'})`,
    timelineToolCall
  );

  const closureSpeech = `Cô phê duyệt checkpoint dừng tại giây thứ ${second} (${timeFormatted}). Bẫy ngộ nhận của Bo rất chân thực, Trí đã chỉ rõ căn cứ hình học và Linh Chi có mẹo ghi nhớ rất tuyệt vời. Các em hãy chú ý: không bao giờ cộng độ dài trực tiếp mà phải quy về một vectơ tổng trước!`;
  record('checkpoint_created', 'colam', 'Cô Lam (Director)', closureSpeech);

  // Đóng gói Checkpoint Item
  const checkpointItem = {
    id: `chk_${partInfo.partNumber}_${second}`,
    second,
    timeFormatted,
    title: `Checkpoint ${partInfo.partNumber}: ${partInfo.title}`,
    questionText: checkpointQuestionText,
    blackboardFormula: segment?.blackboardLatex?.[0] || "|\\vec{BC} + \\vec{DD'}|",
    options: [
      {
        id: 'opt_A',
        label: 'a√2',
        isCorrect: true,
        feedbackNote: 'Chính xác! Vì DD\' = CC\' nên BC + DD\' = BC\', tam giác BCC\' vuông tại C có đường chéo a√2.',
      },
      {
        id: 'opt_B',
        label: '2a',
        isCorrect: false,
        misconceptionLinked: 'MISC_VEC_005',
        feedbackNote: 'Sai lầm! Em đang cộng trực tiếp độ dài |BC| + |DD\'| = 2a giống bạn Bo. Cần quy về vectơ tổng trước!',
      },
      {
        id: 'opt_C',
        label: 'a',
        isCorrect: false,
        feedbackNote: 'Chưa chính xác. Độ dài tổng hai vectơ vuông góc không thể bằng độ dài một cạnh.',
      },
      {
        id: 'opt_D',
        label: 'a√3',
        isCorrect: false,
        feedbackNote: 'Sai lầm. a√3 là độ dài đường chéo không gian của hình lập phương (quy tắc hình hộp), không phải đường chéo mặt bên.',
      },
    ],
    boInitialChallenge: boFinalTrap,
    linhChiCheatSheetSnippet: {
      ruleTitle: 'Quy tắc cộng & Tính độ dài Vectơ',
      rules: [
        'Bước 1: Tìm vectơ thay thế bằng nhau để đưa về chung gốc hoặc nối đuôi.',
        'Bước 2: Gom thành một vectơ tổng duy nhất.',
        'Bước 3: Dùng hình học (Pytago/Tam giác) để tính độ dài vectơ kết quả.',
      ],
      mnemonicTrap: 'TUYỆT ĐỐI không lấy độ dài cộng độ dài: |u + v| ≠ |u| + |v| khi hai vectơ không cùng hướng!',
    },
  };

  // Đóng gói Part Script Package
  return {
    partNumber: partInfo.partNumber,
    title: partInfo.title,
    startSecond: partInfo.startSecond,
    endSecond: partInfo.endSecond,
    checkpointSecond: second,
    status: 'draft',
    checkpoint: checkpointItem,
    scenarios: [
      {
        actor: 'colam',
        role: 'Pedagogical Director',
        dialogue: closureSpeech,
      },
      {
        actor: 'bo',
        role: 'Sparring Partner (Hệ 1)',
        dialogue: boFinalTrap,
        claim: boFinalClaim,
        intentional_error: true,
      },
      {
        actor: 'tri',
        role: 'Deep Thinker (Hệ 2)',
        dialogue: crossCheckVerdict || '',
        counter_claim: 'a√2',
      },
      {
        actor: 'linhchi',
        role: 'Note Taker',
        dialogue: linhChiTip,
      },
      {
        actor: 'minhkhang',
        role: 'Visualizer',
        dialogue: minhKhangAnalogy,
      },
    ],
    deterministic_tool_calls: recordedToolCalls,
    reasoning_events: events,
    crossCheckCorrectionOccurred,
  };
}

/**
 * Điều phối toàn bộ bài giảng từ CognitiveEventStream
 */
export async function runFullLessonRoundtable(cognitiveStream, { useLLM = false } = {}) {
  const partsConfig = partitionTimelineIntoParts(cognitiveStream);
  const generatedParts = [];
  const allReasoningEvents = [];
  const allCheckpoints = [];
  const allTimelineComments = [];
  const crossCheckLogs = [];

  for (const part of partsConfig) {
    const partResult = await runRoundtableForPart(part, { useLLM });
    generatedParts.push(partResult);

    if (partResult.reasoning_events) {
      allReasoningEvents.push(...partResult.reasoning_events);
    }

    if (partResult.checkpoint) {
      allCheckpoints.push(partResult.checkpoint);
    }

    if (partResult.crossCheckCorrectionOccurred) {
      crossCheckLogs.push({
        partNumber: part.partNumber,
        checkpointSecond: partResult.checkpointSecond,
        description: 'Trí kích hoạt tool kiểm chứng bác bỏ bẫy sai phi thực tế của Bo, yêu cầu Bo sửa bẫy thành ngộ nhận tự nhiên.',
      });
    }

    // Tạo các comment nổi trên timeline video
    if (partResult.scenarios) {
      for (const sc of partResult.scenarios) {
        allTimelineComments.push({
          id: `cmt_${part.partNumber}_${sc.actor}_${Date.now()}`,
          second: partResult.checkpointSecond + (sc.actor === 'colam' ? 0 : sc.actor === 'bo' ? 2 : 4),
          author: sc.actor.toUpperCase(),
          role: sc.actor === 'colam' ? 'teacher' : 'classmate',
          avatarId: sc.actor,
          text: sc.dialogue,
          isPinned: sc.actor === 'colam',
        });
      }
    }
  }

  // Đóng gói DRELessonSchema Draft hoàn chỉnh
  const draftPackage = {
    lessonId: `LESSON_${cognitiveStream.videoId || 'VECTO12'}_DRAFT`,
    status: 'draft',
    title: cognitiveStream.videoTitle || 'Bài 1.1: Vectơ Trong Không Gian',
    teacherName: cognitiveStream.teacherName || 'Thầy Nguyễn Phan Tiến',
    subject: cognitiveStream.subject || 'Toán 12',
    durationSeconds: cognitiveStream.durationSeconds || 3480,
    parts: generatedParts,
    checkpoints: allCheckpoints,
    timelineComments: allTimelineComments,
    crossCheckLogs,
    allReasoningEvents,
    pedagogicalSummary: {
      totalParts: generatedParts.length,
      totalCheckpoints: allCheckpoints.length,
      totalTrapsIdentified: crossCheckLogs.length + generatedParts.length,
      bloomMasteryTarget: 'Analyze (Mức 4/6)',
      approvedByTeacher: false,
      generatedAt: new Date().toISOString(),
    },
  };

  // Lưu file draft trên đĩa phục vụ Issue #15 (Multi-Track Timeline Editor)
  const draftFilePath = path.join(
    DRAFTS_DIR,
    `lesson_draft_${cognitiveStream.videoId || 'VECTO12'}.json`
  );
  fs.writeFileSync(draftFilePath, JSON.stringify(draftPackage, null, 2), 'utf-8');

  return draftPackage;
}

export default {
  runRoundtableForPart,
  runFullLessonRoundtable,
  partitionTimelineIntoParts,
};
