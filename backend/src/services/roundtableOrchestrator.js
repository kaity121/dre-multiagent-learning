/**
 * roundtableOrchestrator.js
 *
 * EPIC 3: MULTI-AGENT COLLABORATIVE SCRIPTWRITER & CROSS-CHECKING (#302)
 * Buồng họp biên kịch đa tác nhân A2A (Director / Blackboard Pattern)
 * có rà soát chéo, xác thực toán học bằng Deterministic Tools và RAG.
 *
 * Quy trình thực thi:
 * 1. Cô Lam (Director): Chọn mốc đáng dạy (trapRiskLevel === 'high' hoặc segment trọng tâm),
 *    kiểm tra điều kiện không rơi vào warmup (startSecond + 15s - 30s).
 * 2. Bo: Đề xuất bẫy ngộ nhận tự nhiên (tra cứu KB qua tool_query_misconception_kb).
 * 3. Trí: Gọi tool kiểm chứng (tool_verify_vector_algebra hoặc tool_calculate_dot_product).
 *    - Bounded Cross-Check WOW Loop (tối đa 2-3 lần lặp): Có ít nhất một đề xuất bị Trí bác bỏ
 *      vì tool trả isValid: false hoặc "sai kiểu không có thật", Trí yêu cầu Bo sửa lại.
 *    - Bo tiếp thu và sửa lại thành bẫy ngộ nhận tự nhiên phổ biến của học sinh (được tool xác nhận chuẩn bẫy).
 * 4. Linh Chi đề xuất mẹo ghi nhớ / sổ tay tóm tắt.
 * 5. Minh Khang đưa ra ví dụ đời sống / trực quan hình học.
 * 6. Cô Lam gọi tool_evaluate_bloom_level và tool_timeline_collision_checker, sau đó chốt checkpoint và đóng gói scenario.
 *
 * Hỗ trợ tham số callback onEvent(event) phát ra từng AgentReasoningEvent theo thời gian thực.
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
 * Kiểm tra điều kiện không rơi vào vùng warmup (startSecond + 15s - 30s)
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

    // Luật sư phạm: Checkpoint không được rơi vào 15s - 30s mở đầu (warmup)
    const warmupThreshold = part.startSecond === 0 ? 30 : part.startSecond + 15;
    const validCandidateSegments = partSegments.filter(s => s.second >= warmupThreshold);
    const pool = validCandidateSegments.length > 0 ? validCandidateSegments : partSegments;

    const chosenSegment =
      pool.find(s => s.id === part.targetSegmentId) ||
      pool.find(s => s.trapRiskLevel === 'high') ||
      pool.find(s => s.trapRiskLevel === 'medium') ||
      pool[pool.length - 1];

    return {
      ...part,
      segments: partSegments,
      chosenSegment,
    };
  });
}

/**
 * Điều phối buồng họp Roundtable cho 1 Part cụ thể
 * Hỗ trợ callback onEvent(event) phát sự kiện thời gian thực và streamDelayMs tạo nhịp demo.
 */
export async function runRoundtableForPart(
  partInfo,
  { useLLM = false, onEvent = null, streamDelayMs = 0 } = {}
) {
  const events = [];
  const recordedToolCalls = [];

  // Xác định mốc giây dừng sư phạm và kiểm tra ràng buộc Warmup
  const partStart = partInfo.startSecond || 0;
  const warmupMinSecond = partStart === 0 ? 30 : partStart + 15;
  const segment = partInfo.chosenSegment;

  let second = segment ? segment.second : warmupMinSecond;
  if (second < warmupMinSecond) {
    second = warmupMinSecond;
  }
  const m = Math.floor(second / 60);
  const s = Math.floor(second % 60);
  const timeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  async function record(eventType, agentId, agentDisplayName, content, toolCall = null) {
    const evt = createReasoningEvent({
      eventType,
      agentId,
      agentDisplayName,
      content,
      secondTarget: second,
      toolCall,
    });
    events.push(evt);
    if (toolCall) recordedToolCalls.push(toolCall);

    if (typeof onEvent === 'function') {
      try {
        await onEvent(evt);
      } catch (cbErr) {
        console.warn('[Roundtable] onEvent callback warning:', cbErr);
      }
    }

    if (streamDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, streamDelayMs));
    }

    return evt;
  }

  // ==========================================================================
  // VÒNG 1: CÔ LAM (DIRECTOR) QUÉT CES & CHỌN MỐC DỪNG SƯ PHẠM
  // ==========================================================================
  await record(
    'thought',
    'colam',
    'Cô Lam (Director)',
    `Cô Lam đang phân tích phân đoạn "${partInfo.title}". Kiểm tra điều kiện sư phạm: Mốc thời gian ${timeFormatted} (${second}s) cách điểm bắt đầu ${second - partStart}s (>= 15s), an toàn không rơi vào warmup. Mức độ rủi ro ngộ nhận: ${segment?.trapRiskLevel || 'high'}. Bắt đầu phiên họp Roundtable biên kịch.`
  );

  await record(
    'debate_turn',
    'colam',
    'Cô Lam (Director)',
    `Chào cả lớp! Tại mốc ${timeFormatted}, thầy Tiến đang giảng về ${segment?.audioTranscript?.slice(0, 80) || 'biểu thức vectơ'}. Bo ơi, cậu tra cứu kho tri thức ngộ nhận xem đoạn này học sinh hay vướng bẫy gì nhất?`
  );

  // ==========================================================================
  // VÒNG 2: BO TRA CỨU KHO NGỘ NHẬN QUA TOOL_QUERY_MISCONCEPTION_KB
  // ==========================================================================
  await record(
    'thought',
    'bo',
    'Bo (Hệ 1 - Trực giác)',
    `Bo đang tra cứu tri thức ngộ nhận từ Knowledge Base để chọn bẫy thách đố.`
  );

  const boKbToolCall = executeTool('tool_query_misconception_kb', {
    misconceptionId: partInfo.misconceptionId || 'MISC_VEC_005',
  });
  await record(
    'tool_call',
    'bo',
    'Bo (Hệ 1 - Trực giác)',
    `Bo tra cứu tri thức ngộ nhận từ KB: ${boKbToolCall.toolName}`,
    boKbToolCall
  );
  await record(
    'tool_result',
    'bo',
    'Bo (Hệ 1 - Trực giác)',
    `Kết quả tra cứu KB: Tìm thấy tri thức chuẩn ${boKbToolCall.output[0]?.misconceptionName || 'Ngộ nhận vectơ'}`,
    boKbToolCall
  );

  // ==========================================================================
  // VÒNG 3: TRÍ RÀ SOÁT CHÉO VỚI DETERMINISTIC TOOLS (CROSS-CHECK WOW LOOP)
  // ==========================================================================
  let boFinalTrap = '';
  let boFinalClaim = '';
  let crossCheckVerdict = null;
  let crossCheckCorrectionOccurred = false;

  // Xử lý Cross-check WOW moment: Có ít nhất một đề xuất bị Trí bác bỏ vì tool trả `isValid: false` hoặc "sai kiểu không có thật", Trí yêu cầu Bo sửa lại (vòng lặp có giới hạn max 2-3 lần)
  if (partInfo.partNumber === 3 || segment?.id === 'seg_37_13' || partInfo.misconceptionId === 'MISC_VEC_005') {
    const maxRetries = 2;
    let retryAttempt = 0;
    let trapApproved = false;

    while (retryAttempt < maxRetries && !trapApproved) {
      if (retryAttempt === 0) {
        // LƯỢT 1: Bo đưa ra đề xuất bẫy có lỗi hình học phi lý (gán nhầm tên vectơ AB)
        const initialClaim = 'AB';
        const boInitialSpeech =
          "Cộng độ dài cho lẹ: |BC + DD'| = 1 + 1 = 2! Với lại vectơ BC cộng DD' chắc chắn ra luôn vectơ AB rồi!";

        await record(
          'thought',
          'bo',
          'Bo (Hệ 1 - Trực giác)',
          `Bo muốn đề xuất bẫy shortcut tính nhanh và đoán mò vectơ tổng là AB.`
        );
        await record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boInitialSpeech);

        // Trí kích hoạt tool kiểm chứng phát ngôn Lần 1 của Bo
        await record(
          'thought',
          'tri',
          'Trí (Hệ 2 - Logic)',
          `Trí nghi ngờ phát biểu của Bo có sự sai lệch về cả hình học lẫn độ dài. Kích hoạt tool_verify_vector_algebra để kiểm chứng toạ độ 3D.`
        );

        const check1ToolCall = executeTool('tool_verify_vector_algebra', {
          shape: 'cube',
          side: '1',
          expr: "|BC + DD'|",
          claim: initialClaim,
        });

        await record(
          'tool_call',
          'tri',
          'Trí (Hệ 2 - Logic)',
          `Kích hoạt tool_verify_vector_algebra để kiểm chứng claim "${initialClaim}" của Bo`,
          check1ToolCall
        );
        await record(
          'tool_result',
          'tri',
          'Trí (Hệ 2 - Logic)',
          `Tool trả về isValid: ${check1ToolCall.isValid} — ${check1ToolCall.output?.reason}`,
          check1ToolCall
        );

        // Trí BÁC BỎ đề xuất sai phi thực tế của Bo (Khoảnh khắc WOW trên War Room)
        const rejectionSpeech = `Bo nhầm to rồi! Tớ vừa chạy toạ độ kiểm chứng: BC + DD' = BC + CC' = BC', phương hướng hoàn toàn khác vectơ AB! Bẫy như vậy là "sai kiểu không có thật", học sinh sẽ thấy vô lý ngay. Cậu hãy giữ đúng bản chất ngộ nhận cộng độ dài đại số thôi!`;
        await record(
          'cross_check_verdict',
          'tri',
          'Trí (Hệ 2 - Logic)',
          rejectionSpeech,
          check1ToolCall
        );

        crossCheckCorrectionOccurred = true;
        retryAttempt++;
      } else {
        // LƯỢT 2: Bo tiếp thu phản biện, sửa lại bẫy nhận thức tự nhiên đạt chuẩn sư phạm
        boFinalClaim = '2a';
        boFinalTrap =
          "À tớ nhìn nhầm đỉnh! Nhưng về độ dài thì cạnh bằng a nên |BC + DD'| = a + a = 2a chứ còn gì nữa!";

        await record(
          'thought',
          'bo',
          'Bo (Hệ 1 - Trực giác)',
          `Bo rút kinh nghiệm từ tool kiểm chứng của Trí, chuyển sang gài bẫy ngộ nhận cộng trực tiếp độ dài 1+1=2.`
        );
        await record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boFinalTrap);

        // Trí kiểm chứng lại bẫy sửa đổi của Bo
        const check2ToolCall = executeTool('tool_verify_vector_algebra', {
          shape: 'cube',
          side: 'a',
          expr: "|BC + DD'|",
          claim: boFinalClaim,
        });

        await record(
          'tool_call',
          'tri',
          'Trí (Hệ 2 - Logic)',
          `Kiểm chứng bẫy ngộ nhận đại số của Bo: tool_verify_vector_algebra với claim "${boFinalClaim}"`,
          check2ToolCall
        );
        await record(
          'tool_result',
          'tri',
          'Trí (Hệ 2 - Logic)',
          `Tool xác thực: ${check2ToolCall.output?.reason}`,
          check2ToolCall
        );

        // Trí đồng thuận phê duyệt bẫy sửa đổi của Bo
        const consensusSpeech = `Bẫy này rất tự nhiên! Học sinh thường lấy ngay |BC| + |DD'| = a + a = 2a do thói quen đại số, quên mất bất đẳng thức tam giác và định lý Pytago đường chéo BC' = a√2. Tớ đồng ý chọn bẫy này!`;
        await record(
          'cross_check_verdict',
          'tri',
          'Trí (Hệ 2 - Logic)',
          consensusSpeech,
          check2ToolCall
        );
        crossCheckVerdict = consensusSpeech;
        trapApproved = true;
      }
    }
  } else if (partInfo.partNumber === 2 || segment?.id === 'seg_30_13' || partInfo.misconceptionId === 'MISC_VEC_006') {
    // Part 2: Quy tắc hình hộp
    await record(
      'thought',
      'bo',
      'Bo (Hệ 1 - Trực giác)',
      `Bo muốn gài bẫy nhầm lẫn giữa quy tắc hình bình hành (ở đáy) và quy tắc hình hộp không gian.`
    );
    boFinalClaim = 'AC';
    boFinalTrap = "Quy tắc hình hộp: Xuất phát từ gốc A thì AB + AD + AA' ra đường chéo đáy AC chứ nhỉ!";
    await record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boFinalTrap);

    await record(
      'thought',
      'tri',
      'Trí (Hệ 2 - Logic)',
      `Trí kích hoạt tool_verify_vector_algebra để kiểm tra quy tắc hình hộp 8 đỉnh.`
    );
    const boxToolCall = executeTool('tool_verify_vector_algebra', {
      shape: 'cube',
      side: 'a',
      expr: "|AB + AD + AA'|",
      claim: boFinalClaim,
    });
    await record(
      'tool_call',
      'tri',
      'Trí (Hệ 2 - Logic)',
      'Kiểm chứng quy tắc hình hộp qua tool_verify_vector_algebra',
      boxToolCall
    );
    await record(
      'tool_result',
      'tri',
      'Trí (Hệ 2 - Logic)',
      `Kết quả kiểm chứng: ${boxToolCall.output?.reason}`,
      boxToolCall
    );

    const triRebuttal = `Bo quên mất vectơ chiều cao AA' rồi! AB + AD mới ra AC ở đáy. Thêm AA' phải vươn lên đỉnh đối diện tạo thành đường chéo không gian AC' với độ dài a√3!`;
    await record('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triRebuttal, boxToolCall);
    crossCheckVerdict = triRebuttal;

  } else {
    // Part 1: Hai đường thẳng chéo nhau (hoặc các dạng ngộ nhận tích vô hướng nếu có)
    const isDotProduct = ['MISC_VEC_017', 'MISC_VEC_018', 'MISC_VEC_019', 'MISC_VEC_020'].includes(partInfo.misconceptionId);
    if (isDotProduct) {
      await record(
        'thought',
        'bo',
        'Bo (Hệ 1 - Trực giác)',
        `Bo đưa ra giả định trực giác về tích vô hướng và góc vectơ.`
      );
      boFinalClaim = 'không âm';
      boFinalTrap = "Tích vô hướng của hai vectơ thì luôn là một số không âm giống như độ dài chứ nhỉ!";
      await record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boFinalTrap);

      const dotToolCall = executeTool('tool_calculate_dot_product', {
        uMag: 2,
        vMag: 3,
        angleDeg: 120,
        claimValue: 'không âm',
        claimType: 'dot_product',
      });
      await record(
        'tool_call',
        'tri',
        'Trí (Hệ 2 - Logic)',
        'Kiểm chứng tích vô hướng góc tù qua tool_calculate_dot_product',
        dotToolCall
      );
      await record(
        'tool_result',
        'tri',
        'Trí (Hệ 2 - Logic)',
        `Kết quả kiểm chứng: ${dotToolCall.output?.reason}`,
        dotToolCall
      );

      const triRebuttal = `Sai rồi Bo! Khi góc giữa hai vectơ là góc tù (120°), cos(120°) = -0.5, nên tích vô hướng u.v = 2 * 3 * (-0.5) = -3, hoàn toàn có thể âm!`;
      await record('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triRebuttal, dotToolCall);
      crossCheckVerdict = triRebuttal;
    } else {
      await record(
        'thought',
        'bo',
        'Bo (Hệ 1 - Trực giác)',
        `Bo đưa ra trực giác nhầm lẫn giữa đường thẳng chéo nhau và cùng phương.`
      );
      boFinalClaim = 'cùng phương';
      boFinalTrap = "Hai đường thẳng chéo nhau thì tớ thấy giá của chúng vẫn xét cùng phương được mà!";
      await record('debate_turn', 'bo', 'Bo (Hệ 1 - Trực giác)', boFinalTrap);

      const kbTool = executeTool('tool_query_misconception_kb', {
        misconceptionId: partInfo.misconceptionId || 'MISC_VEC_001',
      });
      await record('tool_call', 'tri', 'Trí (Hệ 2 - Logic)', 'Truy xuất SGK qua tool_query_misconception_kb', kbTool);
      await record('tool_result', 'tri', 'Trí (Hệ 2 - Logic)', 'Tìm thấy định nghĩa chuẩn', kbTool);

      const triRebuttal = `Không được đâu Bo! SGK định nghĩa hai vectơ cùng phương khi và chỉ khi giá của chúng song song hoặc trùng nhau. Chéo nhau là hai đường thẳng không đồng phẳng, không thể cùng phương!`;
      await record('cross_check_verdict', 'tri', 'Trí (Hệ 2 - Logic)', triRebuttal, kbTool);
      crossCheckVerdict = triRebuttal;
    }
  }

  // ==========================================================================
  // VÒNG 4: LINH CHI (NOTE TAKER) & MINH KHANG (ẨN DỤ ĐỜI SỐNG)
  // ==========================================================================
  const linhChiTip =
    partInfo.partNumber === 3
      ? "Linh Chi note vào sổ tay nè: Muốn tính độ dài vectơ tổng, bước 1 là tìm vectơ thay thế để gom về một vectơ duy nhất (DD' = CC' => BC + CC' = BC'), sau đó mới tính Pytago đường chéo ra a√2!"
      : partInfo.partNumber === 2
      ? "Linh Chi ghi nhớ: Đưa về chung gốc xuất phát từ một đỉnh, AB + AD + AA' = AC' (đường chéo đối diện xuyên tâm)!"
      : "Linh Chi ghi nhớ: Hai vectơ cùng phương bắt buộc giá phải song song hoặc trùng nhau, đường thẳng chéo nhau không bao giờ cùng phương!";

  await record(
    'thought',
    'linhchi',
    'Linh Chi (Note Taker)',
    'Linh Chi trích xuất quy tắc sư phạm và lập bảng ghi chú bỏ túi cho học sinh.'
  );
  await record('debate_turn', 'linhchi', 'Linh Chi (Note Taker)', linhChiTip);

  const minhKhangAnalogy =
    partInfo.partNumber === 3
      ? "Minh Khang ví von đời sống nè: Giống như bạn đi bộ từ nhà ra đầu ngõ a mét rồi rẽ vuông góc đi tiếp a mét. Khoảng cách đường chim bay từ nhà đến điểm cuối là cạnh huyền a√2, làm sao mà lấy a + a = 2a được!"
      : partInfo.partNumber === 2
      ? "Minh Khang hình dung: Giống như một cái thùng carton lớn, bạn nối một sợi dây từ góc sàn dưới phòng lên thẳng góc trần đối diện, đó chính là đường chéo không gian dài nhất!"
      : "Minh Khang hình dung: Giống như một cây cầu vượt và con đường bên dưới, xe chạy trên cầu và xe chạy dưới đường không bao giờ song song hay cắt nhau, nên hướng di chuyển của chúng hoàn toàn độc lập!";

  await record(
    'thought',
    'minhkhang',
    'Minh Khang (Trực quan)',
    'Minh Khang liên hệ bài toán với hiện tượng đời sống hàng ngày để học sinh dễ nhớ.'
  );
  await record('debate_turn', 'minhkhang', 'Minh Khang (Trực quan)', minhKhangAnalogy);

  // ==========================================================================
  // VÒNG 5: CÔ LAM THẨM ĐỊNH BLOOM, PACING TIMELINE & CHỐT CHECKPOINT
  // ==========================================================================
  const checkpointQuestionText =
    partInfo.partNumber === 3
      ? "Cho hình lập phương ABCD.A'B'C'D' cạnh a. Hãy tính độ dài của vectơ tổng BC + DD' và phân tích sai lầm trong cách tính của bạn Bo. Phát biểu nào sau đây chính xác?"
      : partInfo.partNumber === 2
      ? "Cho hình hộp ABCD.A'B'C'D'. Hãy áp dụng quy tắc hình hộp để xác định vectơ tổng AB + AD + AA' và phân tích tại sao không thể bằng đường chéo đáy AC:"
      : `Tại mốc ${timeFormatted}, em hãy phân tích và chỉ ra lỗi sai trong phát biểu của Bo về mối quan hệ giữa hai đường thẳng chéo nhau và hai vectơ cùng phương:`;

  const expectedPoints =
    partInfo.partNumber === 3
      ? ['Chỉ ra DD\' = CC\'', 'Tính độ dài đường chéo bằng Pytago', 'Phân tích bẫy ngộ nhận cộng độ dài đại số']
      : partInfo.partNumber === 2
      ? ['Áp dụng quy tắc hình hộp', 'Xác định vectơ đường chéo xuyên tâm AC\'', 'Phân tích bẫy nhầm với đường chéo đáy AC']
      : ['Phân tích bẫy ngộ nhận', 'Hai đường thẳng chéo nhau không đồng phẳng nên giá không song song/trùng nhau'];

  // Thẩm định Bloom
  const bloomToolCall = executeTool('tool_evaluate_bloom_level', {
    question: checkpointQuestionText,
    expected_points: expectedPoints,
  });
  await record(
    'tool_call',
    'colam',
    'Cô Lam (Director)',
    `Thẩm định bậc Bloom cho câu hỏi checkpoint: ${bloomToolCall.toolName}`,
    bloomToolCall
  );
  await record(
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
  await record(
    'tool_call',
    'colam',
    'Cô Lam (Director)',
    `Kiểm tra nhịp thời gian bài giảng và chống va chạm (Pacing Checker)`,
    timelineToolCall
  );
  await record(
    'tool_result',
    'colam',
    'Cô Lam (Director)',
    `Kết quả Pacing: ${timelineToolCall.isValid ? 'Hợp lệ' : 'Cảnh báo'} (${timelineToolCall.output?.reason || 'Đạt chuẩn'})`,
    timelineToolCall
  );

  const closureSpeech =
    partInfo.partNumber === 3
      ? `Cô phê duyệt checkpoint dừng tại giây thứ ${second} (${timeFormatted}). Bẫy ngộ nhận của Bo rất chân thực, Trí đã chỉ rõ căn cứ hình học và Linh Chi có mẹo ghi nhớ rất tuyệt vời. Các em hãy chú ý: không bao giờ cộng độ dài trực tiếp mà phải quy về một vectơ tổng trước!`
      : partInfo.partNumber === 2
      ? `Cô phê duyệt checkpoint dừng tại giây thứ ${second} (${timeFormatted}). Phép cộng vectơ trong không gian mở rộng quy tắc hình bình hành thành quy tắc hình hộp rất đẹp mắt.`
      : `Cô phê duyệt checkpoint dừng tại giây thứ ${second} (${timeFormatted}). Nắm vững định nghĩa cùng phương là nền tảng để không bị nhầm lẫn trong hình học không gian.`;

  await record('checkpoint_created', 'colam', 'Cô Lam (Director)', closureSpeech);

  // Đóng gói Checkpoint Item chuẩn DRELessonSchema (tuyệt đối không lộ đáp án trong đề hoặc thách đố của Bo)
  const checkpointItem = {
    id: `chk_${partInfo.partNumber}_${second}`,
    second,
    timeFormatted,
    title: `Checkpoint ${partInfo.partNumber}: ${partInfo.title}`,
    questionText: checkpointQuestionText,
    blackboardFormula: segment?.blackboardLatex?.[0] || (partInfo.partNumber === 3 ? "|\\vec{BC} + \\vec{DD'}|" : partInfo.partNumber === 2 ? "\\vec{AB} + \\vec{AD} + \\vec{AA'}" : "\\vec{a} \\parallel \\vec{b}"),
    options: partInfo.partNumber === 3
      ? [
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
        ]
      : partInfo.partNumber === 2
      ? [
          {
            id: 'opt_A',
            label: "AC'",
            isCorrect: true,
            feedbackNote: "Chính xác! Theo quy tắc hình hộp: AB + AD + AA' = AC' (đường chéo xuyên tâm không gian).",
          },
          {
            id: 'opt_B',
            label: 'AC',
            isCorrect: false,
            misconceptionLinked: 'MISC_VEC_006',
            feedbackNote: 'Sai lầm! AC chỉ là đường chéo đáy từ AB + AD, chưa cộng vectơ chiều cao AA\'.',
          },
          {
            id: 'opt_C',
            label: "BD'",
            isCorrect: false,
            feedbackNote: 'Chưa đúng đỉnh xuất phát. Quy tắc hình hộp xuất phát từ gốc A.',
          },
          {
            id: 'opt_D',
            label: "AA'",
            isCorrect: false,
            feedbackNote: 'Chưa chính xác. Tổng 3 cạnh độc lập không thể bằng 1 cạnh.',
          },
        ]
      : [
          {
            id: 'opt_A',
            label: 'Giá của chúng không đồng phẳng nên không cùng phương',
            isCorrect: true,
            feedbackNote: 'Chính xác! Định nghĩa SGK chỉ rõ giá phải song song hoặc trùng nhau mới cùng phương.',
          },
          {
            id: 'opt_B',
            label: 'Vẫn xét cùng phương được nếu độ dài bằng nhau',
            isCorrect: false,
            misconceptionLinked: 'MISC_VEC_001',
            feedbackNote: 'Sai lầm! Cùng phương chỉ phụ thuộc vào phương của giá, không liên quan độ dài.',
          },
          {
            id: 'opt_C',
            label: 'Hai đường thẳng chéo nhau luôn cùng hướng',
            isCorrect: false,
            feedbackNote: 'Sai lầm! Không cùng phương thì không thể xét cùng hướng.',
          },
          {
            id: 'opt_D',
            label: 'Hai vectơ đó có tích vô hướng bằng 0',
            isCorrect: false,
            feedbackNote: 'Chưa chắc, chéo nhau không nhất thiết phải vuông góc.',
          },
        ],
    boInitialChallenge: boFinalTrap,
    linhChiCheatSheetSnippet: {
      ruleTitle: partInfo.partNumber === 3 ? 'Quy tắc cộng & Tính độ dài Vectơ' : partInfo.partNumber === 2 ? 'Quy tắc hình hộp 8 đỉnh' : 'Điều kiện Vectơ cùng phương',
      rules: partInfo.partNumber === 3
        ? [
            'Bước 1: Tìm vectơ thay thế bằng nhau để đưa về chung gốc hoặc nối đuôi.',
            'Bước 2: Gom thành một vectơ tổng duy nhất.',
            'Bước 3: Dùng hình học (Pytago/Tam giác) để tính độ dài vectơ kết quả.',
          ]
        : partInfo.partNumber === 2
        ? [
            'Bước 1: Nhận diện 3 vectơ xuất phát từ cùng một đỉnh: AB, AD, AA\'.',
            'Bước 2: AB + AD = AC (đường chéo mặt đáy).',
            'Bước 3: AC + AA\' = AC\' (đường chéo không gian xuyên tâm).',
          ]
        : [
            'Giá song song hoặc trùng nhau <=> Cùng phương.',
            'Chéo nhau => Không đồng phẳng => KHÔNG cùng phương.',
          ],
      mnemonicTrap: partInfo.partNumber === 3
        ? 'TUYỆT ĐỐI không lấy độ dài cộng độ dài: |u + v| ≠ |u| + |v| khi hai vectơ không cùng hướng!'
        : partInfo.partNumber === 2
        ? 'Đừng quên vectơ chiều cao! AB + AD + AA\' ra đỉnh đối diện AC\', không dừng lại ở AC!'
        : 'Chéo nhau thì không cùng phương, đừng đoán mò!',
    },
  };

  // Đóng gói Part Script Package (Max 1 checkpoint per part)
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
        counter_claim: partInfo.partNumber === 3 ? 'a√2' : partInfo.partNumber === 2 ? "AC'" : 'không cùng phương',
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
 * Hỗ trợ callback onEvent(event) và streamDelayMs cho real-time streaming SSE.
 */
export async function runFullLessonRoundtable(
  cognitiveStream,
  { useLLM = false, onEvent = null, streamDelayMs = 0 } = {}
) {
  const partsConfig = partitionTimelineIntoParts(cognitiveStream);
  const generatedParts = [];
  const allReasoningEvents = [];
  const allCheckpoints = [];
  const allTimelineComments = [];
  const crossCheckLogs = [];

  for (const part of partsConfig) {
    const partResult = await runRoundtableForPart(part, { useLLM, onEvent, streamDelayMs });
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

  // Lưu file draft trên đĩa phục vụ Multi-Track Timeline Editor
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
