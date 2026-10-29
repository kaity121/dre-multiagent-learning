import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { createGenerator } from 'ts-json-schema-generator';

import {
  calculateHesitationIndex,
  evaluateRebuttalQuality,
  evaluateMasteryVerdict,
  createLearningRecord,
  updateMasteryState,
  createReviewTask,
  certifyBloomStation4,
  exportSessionDocument,
} from '../src/services/evaluator.js';
import sessionStore from '../src/sessionStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

describe('EPIC 4 - Issue #403: Cognitive Metrics Evaluator & Bloom Certification', () => {

  // --------------------------------------------------------------------------
  // 1. Hesitation Index (HI)
  // --------------------------------------------------------------------------
  describe('Hesitation Index (HI) Metrics', () => {
    it('Tính đúng HI với câu trả lời nhanh & tự tin (low hesitation)', () => {
      // ΔT = 5s, chars = 25 ký tự -> HI = 5 / ln(25) = 5 / 3.2188 ≈ 1.55 (low)
      const res = calculateHesitationIndex({ deltaSeconds: 5, characterCount: 25, backspaceCount: 0 });
      assert.strictEqual(res.hesitationLevel, 'low');
      assert.ok(res.hesitationIndex < 2.5, `HI phải < 2.5, thực tế: ${res.hesitationIndex}`);
      assert.strictEqual(res.recommendation, 'continue_flow');
    });

    it('Tính đúng HI khi học sinh suy ngẫm trung bình (medium hesitation)', () => {
      // ΔT = 18s, chars = 30 -> HI = 18 / ln(30) ≈ 5.29 hoặc dt = 25s
      const res = calculateHesitationIndex({ deltaSeconds: 22, characterCount: 50, backspaceCount: 2 });
      assert.ok(res.hesitationLevel === 'medium' || res.hesitationLevel === 'high');
      assert.strictEqual(res.hesitationSeconds, 22);
    });

    it('Tính đúng HI khi học sinh bế tắc / ngập ngừng lâu (high hesitation -> trigger nudge)', () => {
      // ΔT = 50s (> 45s Inactivity Nudge)
      const res = calculateHesitationIndex({ deltaSeconds: 50, characterCount: 10, backspaceCount: 5 });
      assert.strictEqual(res.hesitationLevel, 'high');
      assert.strictEqual(res.recommendation, 'trigger_scaffolding_nudge');
    });
  });

  // --------------------------------------------------------------------------
  // 2. DoD Criteria 1: "Đúng trắc nghiệm, giải thích sai" => attempted, KHÔNG mastered
  // --------------------------------------------------------------------------
  describe('DoD #1: Multiple Choice Correct without Explanation => attempted, NOT mastered', () => {
    it('Chọn đúng đáp án A nhưng không giải thích (empty) => attempted, không mastered', () => {
      const verdict = evaluateMasteryVerdict({
        hasCorrectChoice: true,
        explanationQuality: 'empty',
        evidenceEvents: [{ type: 'pause_question_answer', event_id: 'e02' }],
      });

      assert.strictEqual(verdict.masteryResult, 'attempted');
      assert.strictEqual(verdict.isMastered, false);
      assert.strictEqual(verdict.bloomLevel, 'Remember');
      assert.match(verdict.comment, /chưa giải thích/i);
    });

    it('Chọn đúng đáp án A nhưng giải thích mơ hồ/sai (unclear) => attempted, không mastered', () => {
      const verdict = evaluateMasteryVerdict({
        hasCorrectChoice: true,
        explanationQuality: 'unclear',
        evidenceEvents: [{ type: 'pause_question_answer', event_id: 'e02' }],
      });

      assert.strictEqual(verdict.masteryResult, 'attempted');
      assert.strictEqual(verdict.isMastered, false);
    });

    it('updateMasteryState tự động ép về attempted nếu toàn bộ bằng chứng chỉ là pause_question_answer', () => {
      const testSessionId = 'test_mc_session_' + Date.now();
      sessionStore.createSession({ id: testSessionId });

      // Ghi nhận một câu trắc nghiệm
      createLearningRecord(testSessionId, {
        event_id: 'e_mc_01',
        type: 'pause_question_answer',
        question_id: 'pq01',
        selected_option_ids: ['A'],
        evaluation: 'correct',
      });

      // Cố tình yêu cầu cập nhật mastered chỉ với bằng chứng trắc nghiệm
      const goalRes = updateMasteryState(testSessionId, {
        goalId: 'g01',
        result: 'mastered',
        evidenceEventIds: ['e_mc_01'],
      });

      // Hệ thống phải từ chối mastered và hạ xuống attempted!
      assert.strictEqual(goalRes.result, 'attempted');
      assert.match(goalRes.comment, /Chỉ có bằng chứng trắc nghiệm/i);
    });
  });

  // --------------------------------------------------------------------------
  // 3. DoD Criteria 2: Phản biện sắc bén tại 37:13 => sharp_rebuttal, Bloom >= Analyze, có evidence
  // --------------------------------------------------------------------------
  describe('DoD #2: Sharp Rebuttal at 37:13 Checkpoint', () => {
    it('Phản biện bẻ gãy bẫy 1+1=2 bằng điều kiện cùng hướng & tam giác vuông cân BC\' = √2', () => {
      const answer = "Không cộng 1 + 1 được vì BC và DD' không cùng hướng. DD' bằng CC' nên BC + DD' = BC + CC' = BC', mà tam giác BCC' vuông tại C nên BC' = √2.";
      const expectedPoints = [
        "BC và DD' không cùng hướng nên không cộng độ dài trực tiếp được",
        "Phải dựng một vectơ tổng (DD' = CC' nên BC + CC' = BC') trước khi lấy độ dài",
        "Tam giác BCC' vuông tại C nên BC' = √2"
      ];

      const assessment = evaluateRebuttalQuality({
        answer,
        expectedPoints,
        currentTime: 2235, // 37:15
        misconceptionId: 'MISC_VEC_005',
      });

      assert.strictEqual(assessment.evaluation, 'sharp_rebuttal');
      assert.strictEqual(assessment.isSharp, true);
      assert.strictEqual(assessment.bloom_level_demonstrated, 'Evaluate');
      assert.ok(assessment.matched_points.length >= 2, 'Phải khớp ít nhất 2 ý kỳ vọng');
    });

    it('Ghi nhận learning record cho sharp_rebuttal có đầy đủ evidence và bloom level', () => {
      const testSessionId = 'test_rebuttal_session_' + Date.now();
      sessionStore.createSession({ id: testSessionId });

      const record = createLearningRecord(testSessionId, {
        type: 'learner_answer',
        scenario_id: 'sc_bo_debate_3713',
        part_id: 'part_03_box_rule_example3',
        video_time_s: 2235,
        answer: "Không cộng được vì hai vectơ vuông góc, tổng ra căn 2 theo Pytago chứ không phải 2a!",
        evaluation: 'sharp_rebuttal',
        bloom_level_demonstrated: 'Evaluate',
        hesitation_seconds: 14,
        matched_points: [
          "BC và DD' không cùng hướng",
          "Tam giác BCC' vuông tại C nên BC' = √2"
        ],
        missing_points: [],
      });

      assert.ok(record.event_id.startsWith('e'));
      assert.strictEqual(record.evaluation, 'sharp_rebuttal');
      assert.strictEqual(record.bloom_level_demonstrated, 'Evaluate');

      // Cập nhật mastery goal với evidence này
      const goalRes = updateMasteryState(testSessionId, {
        goalId: 'g03',
        result: 'mastered',
        bloomLevel: 'Evaluate',
        evidenceEventIds: [record.event_id],
        comment: 'Phản biện sắc bén bẻ gãy bẫy cộng độ dài tại 37:13',
      });

      assert.strictEqual(goalRes.result, 'mastered');
      assert.strictEqual(goalRes.bloom_level, 'Evaluate');
      assert.ok(goalRes.evidence_event_ids.includes(record.event_id));
    });
  });

  // --------------------------------------------------------------------------
  // 4. DoD Criteria 3: Hoàn tất Trạm 4 => overall_review.bloom_certified_level được cấp kèm bằng chứng
  // --------------------------------------------------------------------------
  describe('DoD #3: Station 4 Protégé Bloom Certification', () => {
    it('Hoàn tất lượt dạy học cho Bo ở Trạm 4 => cấp chứng nhận Tháp Bloom với evidence_event_ids', () => {
      const testSessionId = 'test_station4_session_' + Date.now();
      sessionStore.createSession({ id: testSessionId });

      // Giả lập các event trước đó ở Trạm 1 & 2
      createLearningRecord(testSessionId, {
        event_id: 'e01',
        type: 'pause_question_answer',
        evaluation: 'correct',
      });
      createLearningRecord(testSessionId, {
        event_id: 'e02',
        type: 'learner_answer',
        evaluation: 'sharp_rebuttal',
      });

      // Lượt dạy cho Bo ở Trạm 4 (Protégé Effect)
      const certResult = certifyBloomStation4(testSessionId, {
        teachingAnswer: "Bo ơi, muốn tính độ dài tổng thì phải dựng vectơ tổng trước. Như BC + DD' thì thay DD' bằng CC' để nối đuôi thành BC', rồi mới dùng Pitago tam giác vuông ra căn 2. Chỉ khi hai vectơ cùng hướng mới cộng thẳng độ dài được.",
        createdProblem: {
          problem: "Cho hình lập phương ABCD.A'B'C'D' cạnh a. Tính |AB + AD + AA'|.",
          expectedResult: "a√3",
        },
        videoTimeS: 2300,
      });

      assert.strictEqual(certResult.certifiedLevel, 'Create');
      assert.ok(certResult.evidenceEventIds.length >= 2);

      const session = sessionStore.getSession(testSessionId);
      assert.strictEqual(session.overall_review.bloom_certified_level, 'Create');
      assert.strictEqual(session.overall_review.result, 'mastered');
      assert.strictEqual(session.status, 'completed');
      assert.strictEqual(session.station_progress, 'station_4_protege');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Ba Action Sư Phạm (create_learning_record, update_mastery_state, create_review_task)
  // --------------------------------------------------------------------------
  describe('Pedagogical Action Layer', () => {
    it('create_review_task tạo đúng mốc giây xem lại bài giảng và khuyến nghị sư phạm', () => {
      const testSessionId = 'test_review_session_' + Date.now();
      sessionStore.createSession({ id: testSessionId });

      const reviewTask = createReviewTask(testSessionId, {
        partId: 'part_03_box_rule_example3',
        concept: 'Quy tắc hình hộp và bẫy cộng độ dài (Ví dụ 3)',
        reviewSecond: 2233,
        reason: 'Học sinh bỏ qua hoặc chọn sai bẫy cộng độ dài, cần xem lại Thầy Tiến giảng.',
        evidenceEventId: 'e04',
      });

      assert.strictEqual(reviewTask.part_id, 'part_03_box_rule_example3');
      assert.ok(reviewTask.suggested_follow_up.includes('2233s'));
      assert.ok(reviewTask.needs_review.length > 0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. DoD Criteria 4: Output session_<id>.json hợp lệ theo DRESessionSchema (Ajv Validation)
  // --------------------------------------------------------------------------
  describe('DoD #4: Output session_<id>.json Validates strictly against DRESessionSchema', () => {
    it('Document sinh ra từ exportSessionDocument khớp 100% JSON Schema của pipeline.ts', () => {
      // 1. Tạo JSON Schema từ src/types/pipeline.ts
      const generator = createGenerator({
        path: path.join(ROOT_DIR, 'src/types/pipeline.ts'),
        tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
        type: 'DRESessionSchema',
        skipTypeCheck: true,
      });
      const schema = generator.createSchema('DRESessionSchema');
      const ajv = new Ajv({ allErrors: true, strict: false });
      const validate = ajv.compile(schema);

      // 2. Tạo một session đầy đủ các bước qua evaluator engine
      const testSessionId = 'session_dod_test_001';
      sessionStore.createSession({ id: testSessionId });

      createLearningRecord(testSessionId, {
        event_id: 'e01',
        type: 'pause_question_shown',
        part_id: 'part_01_definition',
        video_time_s: 282,
      });
      createLearningRecord(testSessionId, {
        event_id: 'e02',
        type: 'pause_question_answer',
        question_id: 'pq01',
        part_id: 'part_01_definition',
        video_time_s: 282,
        attempt: 1,
        selected_option_ids: ['A'],
        evaluation: 'correct',
        hesitation_seconds: 6,
      });
      createLearningRecord(testSessionId, {
        event_id: 'e03',
        type: 'learner_answer',
        scenario_id: 'sc_bo_debate_3713',
        part_id: 'part_03_box_rule_example3',
        video_time_s: 2235,
        answer: "Không cộng được vì hai vectơ vuông góc, đường chéo ra căn 2 theo Pytago!",
        evaluation: 'sharp_rebuttal',
        bloom_level_demonstrated: 'Evaluate',
        hesitation_seconds: 14,
        matched_points: [
          "BC và DD' không cùng hướng",
          "Tam giác BCC' vuông tại C nên BC' = √2"
        ],
        missing_points: [],
      });

      certifyBloomStation4(testSessionId, {
        teachingAnswer: "Bo ơi, muốn tính độ dài tổng thì dựng vectơ tổng trước, chỉ khi cùng hướng mới cộng thẳng được.",
        createdProblem: null,
        videoTimeS: 2300,
      });

      // 3. Export document
      const sessionDoc = exportSessionDocument(testSessionId);

      // 4. Validate bằng Ajv
      const isValid = validate(sessionDoc);
      if (!isValid) {
        console.error('Validation errors:', validate.errors);
      }
      assert.strictEqual(isValid, true, 'session document phải hợp lệ 100% với DRESessionSchema');

      // Kiểm tra các trường mấu chốt
      assert.strictEqual(sessionDoc.status, 'completed');
      assert.strictEqual(sessionDoc.station_progress, 'station_4_protege');
      assert.ok(sessionDoc.overall_review.bloom_certified_level);
      assert.ok(Array.isArray(sessionDoc.activity_log));
      assert.ok(sessionDoc.activity_log.length >= 4);

      // Kiểm tra quy tắc goal g01 chỉ có trắc nghiệm thì không được mastered
      const g01 = sessionDoc.assessment.goals.find(g => g.goal_id === 'g01');
      assert.strictEqual(g01.result, 'attempted', 'g01 chỉ có trắc nghiệm e02 nên bắt buộc là attempted');
    });
  });
});
