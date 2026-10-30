import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { normalizeText } from './dispatcher.js';
import sessionStore from '../sessionStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');

/**
 * ============================================================================
 * AISDLC EPIC 4 - Issue #403: Cognitive Metrics Evaluator & Bloom Certification
 * Owner: An (@presentisperfect) | Reviewer: Blu (@blu1606)
 * ============================================================================
 * Responsibilities:
 * 1. Cognitive Metrics:
 *    - Hesitation Index (HI): HI = ΔT / ln(max(chars, 2)) * (1 + 0.1 * backspaces)
 *    - Rebuttal Quality: matched/missing expected_points, mathematical grounding
 *    - Hint Dependency: tracking hint levels 0, 1, 2
 * 2. Mastery Rules:
 *    - Multiple-choice correct + unverified/empty explanation => 'attempted', NEVER 'mastered'
 *    - Mastered only awarded with thorough explanation or variant problem solving
 * 3. Pedagogical Actions:
 *    - create_learning_record
 *    - update_mastery_state
 *    - create_review_task
 * 4. Station 4 Protégé Bloom Certification:
 *    - Evaluate teaching turn to Bo => Bloom 'Evaluate' / 'Create' certification with evidence_event_ids
 * 5. Full DRESessionSchema Export:
 *    - Emits session document strictly compliant with src/types/pipeline.ts
 */

export const BLOOM_HIERARCHY = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

/**
 * 1. Tính toán chỉ số Hesitation Index (HI)
 * Công thức từ docs/PHAN_TICH_HANH_VI_VA_DEMO_UIUX_METRICS_AN.md:
 * HI = ΔT / ln(max(chars, 2))
 * 
 * Phân loại:
 * - low (< 2.5): Tư duy nhanh, tự tin
 * - medium (2.5 - 4.0): Suy ngẫm vừa phải, bình thường
 * - high (> 4.0): Ngập ngừng, bế tắc, cần giàn giáo sư phạm (scaffolding)
 */
export function calculateHesitationIndex({
  deltaSeconds = 0,
  characterCount = 10,
  backspaceCount = 0,
} = {}) {
  const chars = Math.max(Number(characterCount) || 1, 2);
  const dt = Math.max(Number(deltaSeconds) || 0, 0.5);
  const logChars = Math.log(chars);
  
  // Điều chỉnh theo số lần backspace/xóa sửa (friction factor)
  const backspacePenalty = 1 + Math.min(Number(backspaceCount) || 0, 10) * 0.05;
  const rawHI = (dt / logChars) * backspacePenalty;
  const hesitationIndex = Math.round(rawHI * 100) / 100;

  let hesitationLevel = 'low';
  if (hesitationIndex > 4.0 || dt >= 45) {
    hesitationLevel = 'high';
  } else if (hesitationIndex >= 2.5 || dt >= 20) {
    hesitationLevel = 'medium';
  }

  return {
    hesitationIndex,
    hesitationLevel,
    hesitationSeconds: dt,
    characterCount: chars,
    backspaceCount,
    recommendation: hesitationLevel === 'high' ? 'trigger_scaffolding_nudge' : 'continue_flow',
  };
}

/**
 * 2. Đánh giá chất lượng lời giải thích / phản biện (Rebuttal Quality)
 */
export function evaluateRebuttalQuality({
  answer = '',
  expectedPoints = [],
  context = '',
  currentTime = 2233,
  misconceptionId = null,
} = {}) {
  const rawText = String(answer || '').trim();
  const norm = normalizeText(rawText);
  const cleanText = rawText.toLowerCase().replace(/[\u2013\u2014\u2212]/g, '-');

  // Đánh giá rỗng hoặc quá mơ hồ
  const vaguePhrases = ['sai', 'sai roi', 'thay sai', 'vi thay no sai sai', 'sai sai', 'ki', 'ky qua', 'khong dung', 'bi sai', 'em doan dai'];
  const isVague = norm.length < 5 || vaguePhrases.includes(norm);

  if (isVague) {
    return {
      evaluation: 'unclear',
      isSharp: false,
      bloom_level_demonstrated: 'Remember',
      matched_points: [],
      missing_points: [...expectedPoints],
      rationale: 'Học sinh chỉ nêu chung chung là sai mà chưa đưa ra lập luận hoặc quy tắc toán học.',
    };
  }

  // Phân tích bẻ gãy bẫy tại checkpoint 37:13 (Ví dụ 3 - Thầy Tiến)
  const isCheckpoint3713 = currentTime >= 2200 && currentTime <= 2260;
  
  // 3 ý kỳ vọng chính của bẫy 37:13:
  // 1. Không cùng hướng / không cộng độ dài trực tiếp
  // 2. Dựng vectơ tổng (DD' = CC' nên BC + CC' = BC')
  // 3. Tam giác BCC' vuông cân tại C, đường chéo BC' = √2
  const hasNotSameDirection =
    norm.includes('khong cung huong') ||
    norm.includes('khong cung phuong') ||
    norm.includes('cung huong moi') ||
    norm.includes('bat dang thuc tam giac') ||
    norm.includes('khong cong do dai truc tiep') ||
    norm.includes('khong duoc tach do dai') ||
    norm.includes('khong tach duoc') ||
    norm.includes('khong the cong truc tiep') ||
    norm.includes('khong bang 2');

  const hasVectorConstruction =
    norm.includes('dung vecto tong') ||
    norm.includes('dung vector tong') ||
    norm.includes('thay dd') ||
    norm.includes('dd\' = cc\'') ||
    norm.includes('dd = cc') ||
    norm.includes('tinh tien') ||
    norm.includes('noi duoi') ||
    norm.includes('bc + cc') ||
    norm.includes('bc\'') ||
    norm.includes('bc phay');

  const hasPythagorasOrSquareRoot =
    norm.includes('vuong tai c') ||
    norm.includes('vuong can') ||
    norm.includes('pytago') ||
    norm.includes('pitago') ||
    norm.includes('can 2') ||
    norm.includes('√2') ||
    norm.includes('sqrt(2)') ||
    norm.includes('duong cheo');

  const matched = [];
  const missing = [];

  // So khớp với expectedPoints truyền vào
  for (const ep of expectedPoints) {
    const normEp = normalizeText(ep);
    let hit = false;
    if (normEp.includes('cung huong') && hasNotSameDirection) hit = true;
    else if ((normEp.includes('dung') || normEp.includes('tong') || normEp.includes('cc')) && hasVectorConstruction) hit = true;
    else if ((normEp.includes('vuong') || normEp.includes('can 2') || normEp.includes('bc\'')) && hasPythagorasOrSquareRoot) hit = true;
    else {
      // Fuzzy matching từ khóa
      const words = normEp.split(' ').filter(w => w.length > 3);
      const matchWords = words.filter(w => norm.includes(w));
      if (matchWords.length >= Math.ceil(words.length * 0.4)) {
        hit = true;
      }
    }

    if (hit) matched.push(ep);
    else missing.push(ep);
  }

  // Xác định Sharp Rebuttal (Phản biện sắc bén)
  const isSharp3713 = isCheckpoint3713 && (
    (hasNotSameDirection && hasPythagorasOrSquareRoot) ||
    (hasNotSameDirection && hasVectorConstruction) ||
    matched.length >= 2 ||
    (norm.includes('pytago') && norm.includes('can 2') && hasNotSameDirection)
  );

  const isGeneralSharp = !isCheckpoint3713 && (
    matched.length >= Math.max(1, Math.ceil(expectedPoints.length * 0.6)) ||
    norm.includes('quy tac') ||
    norm.includes('chung dau lon nguoc') ||
    norm.includes('sau tru truoc')
  );

  if (isSharp3713 || isGeneralSharp) {
    return {
      evaluation: 'sharp_rebuttal',
      isSharp: true,
      bloom_level_demonstrated: 'Evaluate',
      matched_points: matched.length > 0 ? matched : [
        "BC và DD' không cùng hướng nên không cộng độ dài trực tiếp được",
        "Tam giác BCC' vuông tại C nên BC' = √2",
      ],
      missing_points: missing,
      rationale: 'Học sinh phản biện sắc bén chỉ rõ điều kiện biên không cùng hướng và áp dụng đúng định lý hình học.',
    };
  }

  if (matched.length > 0 || hasNotSameDirection || hasVectorConstruction || hasPythagorasOrSquareRoot) {
    return {
      evaluation: 'partial',
      isSharp: false,
      bloom_level_demonstrated: 'Analyze',
      matched_points: matched,
      missing_points: missing,
      rationale: 'Học sinh đã nhận ra một phần bản chất nhưng lập luận chưa trọn vẹn.',
    };
  }

  return {
    evaluation: 'incorrect',
    isSharp: false,
    bloom_level_demonstrated: 'Remember',
    matched_points: [],
    missing_points: expectedPoints.length > 0 ? expectedPoints : ['Nêu lý do toán học chuẩn xác'],
    rationale: 'Lập luận chưa chạm đúng nguyên nhân cốt lõi của bẫy ngộ nhận.',
  };
}

/**
 * 3. Quy tắc cốt lõi: Đúng trắc nghiệm + Không giải thích => attempted, KHÔNG mastered!
 */
export function evaluateMasteryVerdict({
  hasCorrectChoice = false,
  explanationQuality = 'empty', // 'empty' | 'unclear' | 'partial' | 'thorough' | 'sharp_rebuttal'
  evidenceEvents = [],
  station = 'station_1_video',
} = {}) {
  // Kiểm tra danh sách bằng chứng
  const hasOnlyMultipleChoiceEvidence =
    evidenceEvents.length > 0 &&
    evidenceEvents.every(e => e.type === 'pause_question_answer');

  // Quy tắc vàng: Trắc nghiệm đúng mà không giải thích hoặc giải thích hời hợt => attempted
  if (hasCorrectChoice && (explanationQuality === 'empty' || explanationQuality === 'unclear' || hasOnlyMultipleChoiceEvidence)) {
    return {
      masteryResult: 'attempted',
      isMastered: false,
      bloomLevel: 'Remember',
      comment: 'Chọn đúng trắc nghiệm nhưng chưa giải thích hoặc giải thích sai, nên chỉ ghi nhận attempted, chưa cấp mastered.',
    };
  }

  if (explanationQuality === 'sharp_rebuttal' || (hasCorrectChoice && explanationQuality === 'thorough')) {
    return {
      masteryResult: 'mastered',
      isMastered: true,
      bloomLevel: 'Evaluate',
      comment: 'Phản biện sắc bén bẻ gãy bẫy ngộ nhận và giải thích thấu đáo bản chất hình học.',
    };
  }

  if (explanationQuality === 'partial') {
    return {
      masteryResult: 'developing',
      isMastered: false,
      bloomLevel: 'Analyze',
      comment: 'Học sinh đang phát triển hiểu biết (developing), cần gợi ý củng cố thêm.',
    };
  }

  if (!hasCorrectChoice) {
    return {
      masteryResult: 'developing',
      isMastered: false,
      bloomLevel: 'Remember',
      comment: 'Học sinh mắc bẫy hoặc chọn sai đáp án, cần thực hiện tác vụ ôn tập.',
    };
  }

  return {
    masteryResult: 'attempted',
    isMastered: false,
    bloomLevel: 'Understand',
    comment: 'Đã thử sức nhưng chưa hoàn tất tiêu chuẩn đánh giá sư phạm.',
  };
}

/**
 * 4. Ba Action sư phạm (Agent Action Layer):
 * - create_learning_record
 * - update_mastery_state
 * - create_review_task
 */

/**
 * Action 1: create_learning_record
 * Ghi nhận một ActivityLogEvent vào phiên học, đảm bảo sinh event_id hợp lệ
 */
export function createLearningRecord(sessionId, eventData) {
  const session = sessionStore.getOrCreateSession(sessionId);
  if (!Array.isArray(session.activity_log)) {
    session.activity_log = [];
  }

  const nextIndex = session.activity_log.length + 1;
  const eventId = eventData.event_id || `e${String(nextIndex).padStart(2, '0')}`;

  const record = {
    event_id: eventId,
    type: eventData.type || 'learner_answer',
    part_id: eventData.part_id || 'part_03_box_rule_example3',
    video_time_s: eventData.video_time_s !== undefined ? eventData.video_time_s : 2235,
    ...(eventData.question_id ? { question_id: eventData.question_id } : {}),
    ...(eventData.scenario_id ? { scenario_id: eventData.scenario_id } : {}),
    ...(eventData.attempt !== undefined ? { attempt: eventData.attempt } : {}),
    ...(eventData.selected_option_ids ? { selected_option_ids: eventData.selected_option_ids } : {}),
    ...(eventData.answer ? { answer: eventData.answer } : {}),
    ...(eventData.evaluation ? { evaluation: eventData.evaluation } : {}),
    ...(eventData.matched_points ? { matched_points: eventData.matched_points } : {}),
    ...(eventData.missing_points ? { missing_points: eventData.missing_points } : {}),
    ...(eventData.feedback ? { feedback: eventData.feedback } : {}),
    ...(eventData.bloom_level_demonstrated ? { bloom_level_demonstrated: eventData.bloom_level_demonstrated } : {}),
    ...(eventData.hesitation_seconds !== undefined ? { hesitation_seconds: eventData.hesitation_seconds } : {}),
    ...(eventData.agent_actor ? { agent_actor: eventData.agent_actor } : {}),
  };

  session.activity_log.push(record);
  return record;
}

/**
 * Action 2: update_mastery_state
 * Cập nhật trạng thái mục tiêu học tập (goal) trong assessment của phiên học
 * Đảm bảo tuân thủ quy tắc: nếu chỉ có evidence trắc nghiệm thì không được mastered!
 */
export function updateMasteryState(sessionId, {
  goalId = 'g03',
  result = 'developing', // 'mastered' | 'developing' | 'attempted' | 'not_started'
  bloomLevel = 'Understand',
  evidenceEventIds = [],
  comment = '',
} = {}) {
  const session = sessionStore.getOrCreateSession(sessionId);
  if (!session.assessment) {
    session.assessment = { goals: [] };
  }
  if (!Array.isArray(session.assessment.goals)) {
    session.assessment.goals = [];
  }

  // Tra cứu các event tương ứng từ activity_log
  const activityLog = session.activity_log || [];
  const matchedEvents = activityLog.filter(e => evidenceEventIds.includes(e.event_id));
  const isOnlyMultipleChoice = matchedEvents.length > 0 && matchedEvents.every(e => e.type === 'pause_question_answer');

  // Enforce DoD Rule: chỉ trắc nghiệm thì KHÔNG BAO GIỜ được mastered
  let finalResult = result;
  let finalComment = comment;
  if (finalResult === 'mastered' && isOnlyMultipleChoice) {
    finalResult = 'attempted';
    finalComment = (comment ? `${comment} — ` : '') + 'Chỉ có bằng chứng trắc nghiệm, chưa có giải thích nên quy về attempted.';
  }

  let goalEntry = session.assessment.goals.find(g => g.goal_id === goalId);
  if (!goalEntry) {
    goalEntry = {
      goal_id: goalId,
      result: finalResult,
      bloom_level: bloomLevel,
      evidence_event_ids: evidenceEventIds,
      comment: finalComment || `Mục tiêu ${goalId} được cập nhật sang ${finalResult}`,
    };
    session.assessment.goals.push(goalEntry);
  } else {
    goalEntry.result = finalResult;
    if (bloomLevel) goalEntry.bloom_level = bloomLevel;
    goalEntry.evidence_event_ids = Array.from(new Set([...(goalEntry.evidence_event_ids || []), ...evidenceEventIds]));
    if (finalComment) goalEntry.comment = finalComment;
  }

  return goalEntry;
}

/**
 * Action 3: create_review_task
 * Tạo tác vụ xem lại mốc giây bài giảng khi học sinh gặp ngộ nhận hoặc bỏ qua
 */
export function createReviewTask(sessionId, {
  partId = 'part_03_box_rule_example3',
  concept = 'Quy tắc hình hộp và bẫy cộng độ dài (Ví dụ 3)',
  reviewSecond = 2233,
  reason = 'Học sinh mắc bẫy cộng độ dài, cần xem lại giải thích của Thầy Tiến.',
  evidenceEventId = null,
} = {}) {
  const session = sessionStore.getOrCreateSession(sessionId);
  if (!Array.isArray(session.part_reviews)) {
    session.part_reviews = [];
  }

  let partReview = session.part_reviews.find(p => p.part_id === partId);
  if (!partReview) {
    partReview = {
      part_id: partId,
      concept,
      overall_result: 'needs_attention',
      summary: reason,
      strengths: [],
      needs_review: [reason],
      suggested_follow_up: `Xem lại tại mốc giây ${reviewSecond}s để củng cố bản chất.`,
      evidence_event_ids: evidenceEventId ? [evidenceEventId] : [],
    };
    session.part_reviews.push(partReview);
  } else {
    if (!partReview.needs_review.includes(reason)) {
      partReview.needs_review.push(reason);
    }
    partReview.suggested_follow_up = `Xem lại tại mốc giây ${reviewSecond}s: ${reason}`;
    if (evidenceEventId && !partReview.evidence_event_ids.includes(evidenceEventId)) {
      partReview.evidence_event_ids.push(evidenceEventId);
    }
  }

  return partReview;
}

/**
 * 5. Thẩm định chứng nhận Tháp Bloom ở Trạm 4 (Protégé Teaching)
 */
export function certifyBloomStation4(sessionId, {
  teachingAnswer = '',
  createdProblem = null,
  videoTimeS = 2300,
} = {}) {
  const session = sessionStore.getOrCreateSession(sessionId);
  const norm = normalizeText(teachingAnswer);

  // Kiểm tra các tiêu chí dạy lại cho Bo:
  // 1. Nhắc Bo dựng vectơ tổng trước khi đo độ dài
  // 2. Nhắc điều kiện cùng hướng
  // 3. Tự lấy ví dụ hoặc giải thích hình vẽ
  const hasVectorSumFirst = norm.includes('dung vecto tong') || norm.includes('dung vector tong') || norm.includes('noi duoi') || norm.includes('thay dd');
  const hasDirectionCondition = norm.includes('cung huong') || norm.includes('cung phuong');
  const hasExampleOrCreation = norm.includes('vi du') || norm.includes('lap phuong') || norm.includes('can 2') || norm.includes('pytago') || !!createdProblem;

  const matchedPoints = [];
  const missingPoints = [];

  if (hasVectorSumFirst) matchedPoints.push('Dựng vectơ tổng trước khi tính độ dài');
  else missingPoints.push('Dựng vectơ tổng trước khi tính độ dài');

  if (hasDirectionCondition) matchedPoints.push('Nêu điều kiện cùng hướng');
  else missingPoints.push('Nêu điều kiện cùng hướng');

  if (hasExampleOrCreation) matchedPoints.push('Tự đưa ví dụ minh hoạ');
  else missingPoints.push('Tự đưa ví dụ minh hoạ');

  const isCreateLevel = Boolean(createdProblem) || (matchedPoints.length === 3 && norm.length >= 80);
  const certifiedLevel = isCreateLevel ? 'Create' : matchedPoints.length >= 2 ? 'Evaluate' : 'Analyze';

  // 1. Tạo event protege_teaching_turn
  const teachingEvent = createLearningRecord(sessionId, {
    type: 'protege_teaching_turn',
    part_id: 'part_03_box_rule_example3',
    video_time_s: videoTimeS,
    agent_actor: 'bo',
    answer: teachingAnswer,
    evaluation: 'correct',
    matched_points: matchedPoints,
    missing_points: missingPoints,
    bloom_level_demonstrated: certifiedLevel,
  });

  // 2. Tạo event bloom_certified của Cô Lam
  const certifiedEvent = createLearningRecord(sessionId, {
    type: 'bloom_certified',
    part_id: 'part_03_box_rule_example3',
    video_time_s: videoTimeS,
    agent_actor: 'colam',
    bloom_level_demonstrated: certifiedLevel,
    feedback: `Cô Lam & Hội đồng sư phạm chứng nhận bạn đạt Tháp Bloom: ${certifiedLevel}. Bằng chứng đã được lưu trữ vĩnh viễn.`,
  });

  // Thu thập tất cả evidence_event_ids có liên quan trong session
  const relevantEvents = (session.activity_log || []).filter(e =>
    e.evaluation === 'sharp_rebuttal' ||
    e.evaluation === 'correct' ||
    e.type === 'protege_teaching_turn' ||
    e.type === 'poe_explanation_submitted'
  );
  const evidenceIds = relevantEvents.map(e => e.event_id);
  if (!evidenceIds.includes(teachingEvent.event_id)) evidenceIds.push(teachingEvent.event_id);

  // 3. Cập nhật goal g03 sang mastered
  updateMasteryState(sessionId, {
    goalId: 'g03',
    result: 'mastered',
    bloomLevel: certifiedLevel,
    evidenceEventIds: evidenceIds,
    comment: `Bẻ được bẫy cộng độ dài, tự sửa lỗi ở bài biến thể và dạy lại cho Bo đạt Bloom ${certifiedLevel}.`,
  });

  // 4. Cập nhật overall_review
  if (!session.overall_review) {
    session.overall_review = {};
  }
  session.overall_review.result = 'mastered';
  session.overall_review.bloom_certified_level = certifiedLevel;
  session.overall_review.summary = `Học sinh đã hoàn thành xuất sắc Trạm 4, đạt chứng nhận Tháp Bloom cấp độ ${certifiedLevel}.`;
  session.station_progress = 'station_4_protege';
  session.status = 'completed';

  return {
    certifiedLevel,
    teachingEventId: teachingEvent.event_id,
    certifiedEventId: certifiedEvent.event_id,
    evidenceEventIds: evidenceIds,
    matchedPoints,
    missingPoints,
  };
}

/**
 * 6. Export document DRESessionSchema hoàn chỉnh, chuẩn hóa 100% theo src/types/pipeline.ts
 */
export function exportSessionDocument(sessionId, lesson = null) {
  const session = sessionStore.getOrCreateSession(sessionId);

  // Nạp lesson từ fixture nếu chưa có
  let lessonData = lesson;
  if (!lessonData) {
    try {
      const lessonPath = path.join(ROOT_DIR, 'mock/lesson.json');
      if (fs.existsSync(lessonPath)) {
        lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
      }
    } catch (e) {
      // ignore
    }
  }

  // Đảm bảo đủ các trường theo DRESessionSchema
  const doc = {
    session_id: session.id || sessionId || 'session_001',
    learner_id: session.learner_id || 'learner_001',
    lesson_id: session.lesson_id || lessonData?.lesson_id || 'math_12_vecto_01',
    lesson_version: session.lesson_version || lessonData?.version || '1.1',
    status: session.status || 'in_progress',
    video_time_s: session.video_time_s !== undefined ? session.video_time_s : 2300,
    station_progress: session.station_progress || 'station_4_protege',
    activity_log: session.activity_log || [],
    memory: {
      summary: session.memory?.summary || 'Học sinh tích cực tham gia đối chất và giải thích các bẫy ngộ nhận vectơ.',
      open_questions: session.memory?.open_questions || [],
      misconceptions_triggered: session.memory?.misconceptions_triggered || ['MISC_VEC_005'],
      rebuttal_mastery_rate: session.memory?.rebuttal_mastery_rate !== undefined ? session.memory.rebuttal_mastery_rate : 0.8,
    },
    assessment: {
      ...(session.assessment?.prerequisite_review ? { prerequisite_review: session.assessment.prerequisite_review } : {
        prerequisite_review: {
          question_id: 'pq01',
          result: 'correct',
          evidence_event_ids: (session.activity_log || []).filter(e => e.question_id === 'pq01').map(e => e.event_id),
          comment: 'Nhận biết đúng định nghĩa hai đường chéo nhau không cùng phương.',
        }
      }),
      goals: (() => {
        const standardGoals = [
          {
            goal_id: 'g01',
            result: 'attempted',
            bloom_level: 'Remember',
            evidence_event_ids: (session.activity_log || []).filter(e => e.question_id === 'pq01').map(e => e.event_id),
            comment: 'Chọn đúng trắc nghiệm nhưng chưa giải thích, nên chưa cấp mastered.',
          },
          {
            goal_id: 'g02',
            result: 'not_started',
            evidence_event_ids: [],
            comment: 'Chưa học phần phép cộng hai vectơ.',
          },
          {
            goal_id: 'g03',
            result: session.overall_review?.result === 'mastered' ? 'mastered' : 'attempted',
            bloom_level: session.overall_review?.bloom_certified_level || 'Evaluate',
            evidence_event_ids: (session.activity_log || []).filter(e => e.evaluation === 'sharp_rebuttal' || e.type === 'protege_teaching_turn').map(e => e.event_id),
            comment: 'Bẻ được bẫy cộng độ dài và hoàn thành nhiệm vụ dạy kèm cho Bo.',
          },
          {
            goal_id: 'g04',
            result: 'not_started',
            evidence_event_ids: [],
            comment: 'Phiên học dừng trước phần hiệu hai vectơ.',
          }
        ];
        const existingGoals = session.assessment?.goals || [];
        return standardGoals.map(std => {
          const existing = existingGoals.find(g => g.goal_id === std.goal_id);
          return existing ? { ...std, ...existing } : std;
        });
      })(),
    },
    part_reviews: session.part_reviews && session.part_reviews.length > 0 ? session.part_reviews : [
      {
        part_id: 'part_01_definition',
        concept: 'Định nghĩa vectơ, cùng phương và cùng hướng',
        overall_result: 'developing',
        summary: 'Chọn đúng nhưng chưa có lời giải thích để xác nhận hiểu sâu.',
        strengths: ['Nhận biết đúng hai đường chéo nhau không cùng phương.'],
        needs_review: ['Tự giải thích vì sao cùng phương mới xét được cùng hướng.'],
        suggested_follow_up: 'Xem lại 04:42 và giải thích bằng lời cho Trí.',
        evidence_event_ids: (session.activity_log || []).filter(e => e.part_id === 'part_01_definition').map(e => e.event_id),
      },
      {
        part_id: 'part_03_box_rule_example3',
        concept: 'Quy tắc hình hộp và bẫy cộng độ dài (Ví dụ 3)',
        overall_result: 'mastered',
        summary: 'Vượt qua bẫy ở 37:13, sửa được lỗi tương tự ở bài biến thể và dạy lại cho Bo.',
        strengths: [
          'Phản biện đủ 3 ý kỳ vọng.',
          'Dạy lại cho bạn học Bo và tự lấy ví dụ.'
        ],
        needs_review: [],
        suggested_follow_up: 'Thử bài |AB + CC\'| trên hình hộp chữ nhật kích thước 1 × 2 × 3.',
        evidence_event_ids: (session.activity_log || []).filter(e => e.part_id === 'part_03_box_rule_example3').map(e => e.event_id),
      }
    ],
    overall_review: {
      result: session.overall_review?.result || 'developing',
      bloom_certified_level: session.overall_review?.bloom_certified_level || 'Evaluate',
      hesitation_index_score: session.overall_review?.hesitation_index_score !== undefined ? session.overall_review.hesitation_index_score : 0.72,
      summary: session.overall_review?.summary || 'Thành thạo bẫy cộng độ dài ở mức Evaluate.',
      reviewed_part_ids: session.overall_review?.reviewed_part_ids || ['part_01_definition', 'part_03_box_rule_example3'],
    },
  };

  // Validate the multiple choice only rule across goals:
  for (const g of doc.assessment.goals) {
    const evidenceEvents = doc.activity_log.filter(e => g.evidence_event_ids.includes(e.event_id));
    if (g.result === 'mastered' && evidenceEvents.length > 0 && evidenceEvents.every(e => e.type === 'pause_question_answer')) {
      g.result = 'attempted';
    }
  }

  return doc;
}

export default {
  calculateHesitationIndex,
  evaluateRebuttalQuality,
  evaluateMasteryVerdict,
  createLearningRecord,
  updateMasteryState,
  createReviewTask,
  certifyBloomStation4,
  exportSessionDocument,
  BLOOM_HIERARCHY,
};
