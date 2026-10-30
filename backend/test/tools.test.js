/**
 * backend/test/tools.test.js
 *
 * Unit tests cho bộ Deterministic Tools của Multi-Agent Scriptwriter Roundtable.
 * Kiểm tra các yêu cầu:
 * 1. tool_verify_vector_algebra:
 *    - Case cạnh a (claim "2a" -> false, "a\\sqrt{2}" -> true, a√2, căn 2, BC', unparseable)
 *    - Case cạnh side = 2 (claim "2\\sqrt{2}", "2√2" -> true; claim "4" -> false)
 *    - Case không có claim (chỉ tính độ dài |BC + DD'| = a√2, isValid: null, không phán sai)
 *    - Trích xuất expr và claim từ câu hỏi tự do, hỗ trợ chữ ("vectơ BC cộng vectơ DD'"), tránh nuốt "ba" trong "bằng bao nhiêu"
 * 2. tool_calculate_dot_product:
 *    - Tính tích vô hướng u.v = |u||v|cos(theta)
 *    - Góc tù 120° cho tích vô hướng âm (MISC_VEC_019)
 *    - Đảo chiều u và -v đổi góc bù 180° - theta (MISC_VEC_017)
 *    - Vectơ không: tích vô hướng = 0 (đúng), góc không xác định, không dính lỗi includes('0') với '10' (MISC_VEC_018)
 *    - Bình phương tổng bỏ số hạng chéo (MISC_VEC_020)
 * 3. tool_query_misconception_kb: Tra cứu KB theo latex hoặc tags trả về PedagogicalRAGItem
 * 4. tool_timeline_collision_checker:
 *    - Phát hiện vi phạm minGapS (< 20s) và warmup period
 *    - Cho phép sự kiện nối tiếp trong cùng một mốc dừng (checkpoint 37:13 + debate turn cách 2s)
 * 5. tool_evaluate_bloom_level: Thẩm định thang đo Bloom chính xác
 * 6. executeTool trả về cấu trúc DeterministicToolCall đúng chuẩn contract
 * 7. runRoundtable tích hợp trơn tru với MISC_VEC_005, MISC_VEC_017, MISC_VEC_020
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { 
  verifyVectorAlgebra, 
  extractVectorExpr, 
  extractClaimFromText 
} from '../src/tools/tool_verify_vector_algebra.js';
import { calculateDotProduct } from '../src/tools/tool_calculate_dot_product.js';
import { queryMisconceptionKB } from '../src/tools/tool_query_misconception_kb.js';
import { checkTimelineCollision } from '../src/tools/tool_timeline_collision_checker.js';
import { evaluateBloomLevel } from '../src/tools/tool_evaluate_bloom_level.js';
import { executeTool, OPENAI_TOOL_DEFINITIONS } from '../src/tools/index.js';
import { runRoundtable } from '../src/services/roundtable.js';

describe('Deterministic Tools - Unit Tests', () => {

  // ==========================================================================
  // 1. tool_verify_vector_algebra
  // ==========================================================================
  describe('tool_verify_vector_algebra', () => {
    it('Case Ví dụ 3 (Bẫy Bo): |BC + DD\'| với claim "2a" phải trả về isValid: false và kết quả đúng là a\\sqrt{2}', () => {
      const result = verifyVectorAlgebra({
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: '2a',
      });

      assert.strictEqual(result.isValid, false, 'Claim "2a" phải bị đánh giá là false');
      assert.strictEqual(result.correct, 'a\\sqrt{2}', 'Kết quả chuẩn phải là a\\sqrt{2}');
      assert.ok(result.reason.includes("BC + DD' = BC + CC' = BC'"), 'Reason phải chỉ ra quy tắc tam giác và đường chéo');
      assert.strictEqual(result.claimValue, 2);
      assert.ok(Math.abs(result.calculatedValue - Math.SQRT2) < 0.001);
      assert.ok(result.steps.length > 0, 'Phải có các bước phân tích sư phạm');
    });

    it('Xác thực đúng: |BC + DD\'| với claim "a\\sqrt{2}" phải trả về isValid: true', () => {
      const result = verifyVectorAlgebra({
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: 'a\\sqrt{2}',
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.correct, 'a\\sqrt{2}');
      assert.ok(result.reason.includes('chính xác'));
    });

    it('Hỗ trợ tham số side = 2 (Bài tập EX_VEC_005 trong KB): claim "2\\sqrt{2}" và "2√2" phải isValid: true', () => {
      for (const variant of ['2\\sqrt{2}', '2√2', '2 căn 2', '2.828']) {
        const result = verifyVectorAlgebra({
          shape: 'cube',
          side: '2',
          expr: "|BC + DD'|",
          claim: variant,
        });

        assert.strictEqual(result.isValid, true, `Cạnh 2 với claim "${variant}" phải được công nhận là true`);
        assert.strictEqual(result.correct, '2\\sqrt{2}');
      }

      // Claim sai với side = 2: 2 + 2 = 4
      const wrongResult = verifyVectorAlgebra({
        shape: 'cube',
        side: '2',
        expr: "|BC + DD'|",
        claim: '4',
      });
      assert.strictEqual(wrongResult.isValid, false);
      assert.strictEqual(wrongResult.correct, '2\\sqrt{2}');
    });

    it('Hỗ trợ chế độ chỉ tính giá trị khi học sinh không khẳng định claim: isValid: null, không phán sai', () => {
      const result = verifyVectorAlgebra({
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: null,
      });

      assert.strictEqual(result.isValid, null, 'Không có claim thì isValid phải là null');
      assert.strictEqual(result.correct, 'a\\sqrt{2}');
      assert.ok(result.reason.includes('giá trị độ dài chính xác'));
    });

    it('Trích xuất tự động expr và claim từ câu hỏi tự do của học sinh', () => {
      const q1 = "BC + DD' dài bao nhiêu ạ?";
      assert.strictEqual(extractVectorExpr(q1), "|BC + DD'|");
      assert.strictEqual(extractClaimFromText(q1), null);

      const q2 = "BC + DD' bằng 2a đúng không?";
      assert.strictEqual(extractVectorExpr(q2), "|BC + DD'|");
      assert.strictEqual(extractClaimFromText(q2), "2a");

      const q3 = "Cho hình lập phương, AB + AD + AA' ra a√3 hả bạn?";
      assert.strictEqual(extractVectorExpr(q3), "|AB + AD + AA'|");
      assert.strictEqual(extractClaimFromText(q3), "a√3");
    });

    it('Tránh nuốt từ "ba" trong câu hỏi "bằng bao nhiêu" thành vectơ BA', () => {
      const question = "BC + DD' bằng bao nhiêu ạ?";
      assert.strictEqual(extractClaimFromText(question), null, 'Không được gán chữ "ba" thành vectơ BA');

      const claimBA = "BC + DD' bằng BA";
      assert.strictEqual(extractClaimFromText(claimBA), "BA", 'Vẫn phải nhận diện đúng khi học sinh claim vectơ BA');
    });

    it('Hỗ trợ biểu thức vectơ viết bằng chữ "vectơ BC cộng vectơ DD\'"', () => {
      const text = "vectơ BC cộng vectơ DD' bằng bao nhiêu?";
      assert.strictEqual(extractVectorExpr(text), "|BC + DD'|");
    });

    it('Hỗ trợ ký hiệu căn đa dạng: a√2, √2a, căn 2, a căn 2 đều nhận diện đúng isValid: true', () => {
      for (const variant of ['a√2', '√2a', 'căn 2', 'a căn 2', 'sqrt(2)']) {
        const result = verifyVectorAlgebra({
          shape: 'cube',
          side: 'a',
          expr: "|BC + DD'|",
          claim: variant,
        });

        assert.strictEqual(result.isValid, true, `Biến thể "${variant}" phải được nhận diện là đúng`);
        assert.ok(Math.abs(result.claimValue - Math.SQRT2) < 0.001);
      }
    });

    it('Hỗ trợ claim là tên vectơ tương đương: BC\' trả về isValid: true', () => {
      const result = verifyVectorAlgebra({
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: "BC'",
      });

      assert.strictEqual(result.isValid, true, 'Claim "BC\'" phải được công nhận là đáp án đúng');
      assert.ok(result.reason.includes("BC'"), 'Reason phải nêu rõ vectơ tương đương');
    });

    it('Claim là tên vectơ sai: AB trả về isValid: false', () => {
      const result = verifyVectorAlgebra({
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: 'AB',
      });

      assert.strictEqual(result.isValid, false, 'Claim "AB" phải bị đánh giá là false');
    });

    it('Claim không parse được hoặc phát biểu tổng quát trả về isValid: null (unparseable_claim) chứ không gán sai', () => {
      const result = verifyVectorAlgebra({
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: '|a + b| = |a| + |b|',
      });

      assert.strictEqual(result.isValid, null, 'Phát biểu tổng quát phải trả về isValid: null');
      assert.strictEqual(result.claimValue, null);
      assert.ok(result.reason.includes('unparseable_claim'), 'Phải gắn cờ unparseable_claim trong reason');
    });

    it('Xác thực quy tắc hình hộp: AB + AD + AA\' = AC\' có độ dài a\\sqrt{3}', () => {
      const result = verifyVectorAlgebra({
        shape: 'cube',
        side: 'a',
        expr: "|AB + AD + AA'|",
        claim: 'a\\sqrt{3}',
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.correct, 'a\\sqrt{3}');
    });
  });

  // ==========================================================================
  // 2. tool_calculate_dot_product
  // ==========================================================================
  describe('tool_calculate_dot_product', () => {
    it('Tính đúng tích vô hướng góc tù 120° ra giá trị âm (MISC_VEC_019)', () => {
      const result = calculateDotProduct({
        uMag: 2,
        vMag: 3,
        angleDeg: 120,
        claimValue: 'không âm',
      });

      assert.strictEqual(result.isValid, false, 'Claim tích vô hướng luôn không âm phải bị phán false');
      assert.strictEqual(result.dotProduct, -3);
      assert.ok(result.reason.includes('< 0') || result.reason.includes('âm'));
    });

    it('Xác nhận tính đúng tích vô hướng góc 60°: u=2, v=4 -> u.v = 2*4*cos(60°) = 4', () => {
      const result = calculateDotProduct({
        uMag: 2,
        vMag: 4,
        angleDeg: 60,
        claimValue: '4',
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.dotProduct, 4);
    });

    it('Vectơ không (MISC_VEC_018): dot_product với claim 0 là true, không dính lỗi với số 10', () => {
      // Tích vô hướng với vectơ không = 0 là đúng
      const validZero = calculateDotProduct({
        uMag: 0,
        vMag: 2,
        claimValue: '0',
        claimType: 'dot_product',
      });
      assert.strictEqual(validZero.isValid, true);
      assert.strictEqual(validZero.dotProduct, 0);

      // Claim 10 không được coi là 0 (tránh lỗi includes('0'))
      const wrongTen = calculateDotProduct({
        uMag: 0,
        vMag: 2,
        claimValue: '10',
        claimType: 'dot_product',
      });
      assert.strictEqual(wrongTen.isValid, false);

      // Với góc: SGK cho phép tùy ý từ 0° đến 180°, gán góc cố định (0°) là sai (MISC_VEC_018)
      const invalidAngle = calculateDotProduct({
        uMag: 0,
        vMag: 3,
        angleDeg: 0,
        claimValue: '0',
        claimType: 'angle',
      });
      assert.strictEqual(invalidAngle.isZeroVector, true);
      assert.strictEqual(invalidAngle.isValid, false);
      assert.ok(invalidAngle.reason.includes('tùy ý') || invalidAngle.reason.includes('0° đến 180°'));

      // Phát biểu đúng quy ước SGK: tùy ý từ 0° đến 180° -> true
      const validArbitrary = calculateDotProduct({
        uMag: 0,
        vMag: 3,
        claimValue: 'tùy ý từ 0° đến 180°',
        claimType: 'angle',
      });
      assert.strictEqual(validArbitrary.isValid, true);
      assert.ok(validArbitrary.reason.includes('tùy ý từ 0° đến 180°'));
    });

    it('MISC_VEC_017: Đảo một vectơ thì góc bù angle(-u, v) = 180° - theta', () => {
      // Ban đầu theta = 60°. Bo claim sau khi đảo góc vẫn là 60° -> false
      const boBusted = calculateDotProduct({
        uMag: 2,
        vMag: 3,
        angleDeg: 60,
        claimValue: '60',
        claimType: 'reverse_angle',
        isReversed: true,
      });

      assert.strictEqual(boBusted.isValid, false, 'Bo claim góc không đổi phải bị bác bỏ');
      assert.strictEqual(boBusted.reversedAngleDeg, 120);
      assert.ok(boBusted.reason.includes('120°'));

      // Claim đúng góc bù 120° -> true
      const correctClaim = calculateDotProduct({
        uMag: 2,
        vMag: 3,
        angleDeg: 60,
        claimValue: '120',
        claimType: 'reverse_angle',
        isReversed: true,
      });
      assert.strictEqual(correctClaim.isValid, true);
      assert.strictEqual(correctClaim.reversedAngleDeg, 120);
    });

    it('MISC_VEC_020: Bình phương tổng bỏ số hạng chéo |u+v|^2', () => {
      // u=2, v=3, theta=60° -> |u+v|^2 = 4 + 9 + 2*2*3*0.5 = 19
      // Bo bỏ số hạng chéo: 2^2 + 3^2 = 13 -> false
      const boTrap = calculateDotProduct({
        uMag: 2,
        vMag: 3,
        angleDeg: 60,
        claimValue: '13',
        claimType: 'norm_sum_squared',
      });

      assert.strictEqual(boTrap.isValid, false);
      assert.strictEqual(boTrap.correct, '19');
      assert.ok(boTrap.reason.includes('bỏ quên số hạng chéo') || boTrap.reason.includes('19'));

      // Claim đúng 19 -> true
      const correctClaim = calculateDotProduct({
        uMag: 2,
        vMag: 3,
        angleDeg: 60,
        claimValue: '19',
        claimType: 'norm_sum_squared',
      });
      assert.strictEqual(correctClaim.isValid, true);
      assert.strictEqual(correctClaim.correct, '19');
    });
  });

  // ==========================================================================
  // 3. tool_query_misconception_kb
  // ==========================================================================
  describe('tool_query_misconception_kb', () => {
    it('Tra cứu ngộ nhận theo misconceptionId: MISC_VEC_005 trả về PedagogicalRAGItem chuẩn', () => {
      const result = queryMisconceptionKB({
        misconceptionId: 'MISC_VEC_005',
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.count, 1);
      const item = result.output[0];
      assert.strictEqual(item.id, 'MISC_VEC_005');
      assert.ok(item.boTrapPattern.length > 0, 'Phải có boTrapPattern');
      assert.ok(item.rebuttalAnchor.length > 0, 'Phải có rebuttalAnchor');
      assert.ok(Array.isArray(item.scaffoldingNudges), 'scaffoldingNudges phải là mảng');
    });

    it('Tra cứu theo biểu thức LaTeX hoặc tags về phép cộng độ dài', () => {
      const result = queryMisconceptionKB({
        latex: '|\\vec{BC}+\\vec{DD\'}|',
        tags: ['length_addition'],
      });

      assert.strictEqual(result.isValid, true);
      assert.ok(result.output.length >= 1);
    });
  });

  // ==========================================================================
  // 4. tool_timeline_collision_checker
  // ==========================================================================
  describe('tool_timeline_collision_checker', () => {
    it('Phát hiện va chạm thời gian nếu khoảng cách giữa 2 sự kiện < 20s độc lập', () => {
      const result = checkTimelineCollision({
        events: [
          { id: 'ev_1', at_s: 30, actor_id: 'bo', type: 'comment' },
          { id: 'ev_2', at_s: 42, actor_id: 'tri', type: 'comment' },
        ],
        minGapS: 20,
      });

      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.collisions.length, 1);
      assert.strictEqual(result.collisions[0].gapS, 12);
      assert.ok(result.suggestions.length > 0);
    });

    it('Phát hiện sự kiện can thiệp quá sớm trong 15s đầu bài giảng', () => {
      const result = checkTimelineCollision({
        events: [
          { id: 'ev_intro', at_s: 8, actor_id: 'bo', type: 'comment' },
          { id: 'ev_normal', at_s: 40, actor_id: 'tri', type: 'comment' },
        ],
        warmupPeriodS: 15,
      });

      assert.strictEqual(result.isValid, false);
      assert.ok(result.warnings.some(w => w.at_s === 8));
    });

    it('Hợp lệ khi các sự kiện cách nhau >= 20s và sau warmup', () => {
      const result = checkTimelineCollision({
        events: [
          { id: 'ev_1', at_s: 30, actor_id: 'bo', type: 'comment' },
          { id: 'ev_2', at_s: 55, actor_id: 'tri', type: 'comment' },
          { id: 'ev_3', at_s: 85, actor_id: 'colam', type: 'checkpoint' },
        ],
        minGapS: 20,
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.collisions.length, 0);
      assert.strictEqual(result.warnings.length, 0);
    });

    it('Bỏ qua va chạm cho chuỗi tương tác nối tiếp cùng mốc dừng: checkpoint 37:13 (2233s) và Bo (2235s, cách 2s)', () => {
      const result = checkTimelineCollision({
        events: [
          { id: 'colam_stop_point', at_s: 2233, actor_id: 'colam', type: 'checkpoint' },
          { id: 'bo_challenge_turn', at_s: 2235, actor_id: 'bo', type: 'comment' },
        ],
        minGapS: 20,
      });

      assert.strictEqual(result.isValid, true, 'Sự kiện debate nối tiếp checkpoint cách 2s phải hợp lệ');
      assert.strictEqual(result.collisions.length, 0);
    });

    it('Bỏ qua va chạm khi có cờ isChained hoặc cùng groupId', () => {
      const result = checkTimelineCollision({
        events: [
          { id: 'turn_1', at_s: 50, actor_id: 'bo', type: 'comment', groupId: 'stop_1' },
          { id: 'turn_2', at_s: 52, actor_id: 'tri', type: 'comment', groupId: 'stop_1' },
        ],
        minGapS: 20,
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.collisions.length, 0);
    });
  });

  // ==========================================================================
  // 5. tool_evaluate_bloom_level
  // ==========================================================================
  describe('tool_evaluate_bloom_level', () => {
    it('Đánh giá câu hỏi phân tích sai lầm bẫy ngộ nhận ở mức Analyze', () => {
      const result = evaluateBloomLevel({
        question: 'Tại sao Bo lại sai khi cộng trực tiếp độ dài |BC| + |DD\'|? Hãy phân tích lỗi sai và chỉ ra bẫy.',
        expected_points: ['Chỉ ra DD\' = CC\'', 'Áp dụng tam giác vuông BCC\''],
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.level, 'Analyze');
      assert.ok(result.score >= 4);
    });

    it('Đánh giá câu hỏi tính toán cụ thể ở mức Apply', () => {
      const result = evaluateBloomLevel({
        question: 'Hãy tính độ dài của vectơ tổng BC + DD\' trong hình lập phương cạnh a.',
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.level, 'Apply');
      assert.strictEqual(result.score, 3);
    });
  });

  // ==========================================================================
  // 6. executeTool & DeterministicToolCall Contract Compliance
  // ==========================================================================
  describe('executeTool & DeterministicToolCall Contract', () => {
    it('executeTool bọc kết quả thành DeterministicToolCall đầy đủ các trường chuẩn', () => {
      const toolCall = executeTool('tool_verify_vector_algebra', {
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: '2a',
      });

      assert.strictEqual(toolCall.toolName, 'tool_verify_vector_algebra');
      assert.strictEqual(toolCall.isValid, false);
      assert.ok(typeof toolCall.timestampMs === 'number');
      assert.ok(toolCall.input && toolCall.input.claim === '2a');
      assert.ok(toolCall.output && toolCall.output.correct === 'a\\sqrt{2}');
    });

    it('Tất cả 5 tools đều có schema JSON Schema trong OPENAI_TOOL_DEFINITIONS', () => {
      assert.strictEqual(OPENAI_TOOL_DEFINITIONS.length, 5);
      const names = OPENAI_TOOL_DEFINITIONS.map(t => t.function.name);
      assert.ok(names.includes('tool_verify_vector_algebra'));
      assert.ok(names.includes('tool_calculate_dot_product'));
      assert.ok(names.includes('tool_query_misconception_kb'));
      assert.ok(names.includes('tool_timeline_collision_checker'));
      assert.ok(names.includes('tool_evaluate_bloom_level'));
    });
  });

  // ==========================================================================
  // 7. runRoundtable Integration với các loại bẫy toán
  // ==========================================================================
  describe('runRoundtable Integration', () => {
    it('Chạy Roundtable với MISC_VEC_005 (Độ dài lập phương)', async () => {
      const draft = await runRoundtable('MISC_VEC_005', { useLLM: false });
      assert.strictEqual(draft.status, 'draft');
      assert.ok(draft.deterministic_tool_calls.some(tc => tc.toolName === 'tool_verify_vector_algebra'));
      assert.ok(draft.dialogues.length >= 4);
    });

    it('Chạy Roundtable với MISC_VEC_017 (Đảo vectơ đổi góc)', async () => {
      const draft = await runRoundtable('MISC_VEC_017', { useLLM: false });
      assert.strictEqual(draft.status, 'draft');
      const dotTool = draft.deterministic_tool_calls.find(tc => tc.toolName === 'tool_calculate_dot_product');
      assert.ok(dotTool, 'Phải kích hoạt tool_calculate_dot_product');
      assert.strictEqual(dotTool.isValid, false, 'Bẫy của Bo phải bị bác bỏ');
    });

    it('Chạy Roundtable với MISC_VEC_020 (Bình phương tổng bỏ số hạng chéo)', async () => {
      const draft = await runRoundtable('MISC_VEC_020', { useLLM: false });
      assert.strictEqual(draft.status, 'draft');
      const dotTool = draft.deterministic_tool_calls.find(tc => tc.toolName === 'tool_calculate_dot_product');
      assert.ok(dotTool, 'Phải kích hoạt tool_calculate_dot_product');
      assert.strictEqual(dotTool.isValid, false, 'Bẫy bỏ số hạng chéo của Bo phải bị bác bỏ');
    });
  });
});
