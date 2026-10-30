/**
 * backend/test/tools.test.js
 *
 * Unit tests cho bộ Deterministic Tools của Multi-Agent Scriptwriter Roundtable.
 * Kiểm tra các yêu cầu:
 * 1. tool_verify_vector_algebra: Case Ví dụ 3 (claim "2a" -> isValid: false, claim "a\\sqrt{2}" -> isValid: true, a√2, căn 2, BC', unparseable)
 * 2. tool_query_misconception_kb: Tra cứu KB theo latex hoặc tags trả về PedagogicalRAGItem
 * 3. tool_timeline_collision_checker: Phát hiện vi phạm minGapS (< 20s) và warmup period
 * 4. tool_evaluate_bloom_level: Thẩm định thang đo Bloom chính xác
 * 5. executeTool trả về cấu trúc DeterministicToolCall đúng chuẩn contract src/types/pipeline.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { verifyVectorAlgebra } from '../src/tools/tool_verify_vector_algebra.js';
import { queryMisconceptionKB } from '../src/tools/tool_query_misconception_kb.js';
import { checkTimelineCollision } from '../src/tools/tool_timeline_collision_checker.js';
import { evaluateBloomLevel } from '../src/tools/tool_evaluate_bloom_level.js';
import { executeTool, OPENAI_TOOL_DEFINITIONS } from '../src/tools/index.js';

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
  // 2. tool_query_misconception_kb
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
  // 3. tool_timeline_collision_checker
  // ==========================================================================
  describe('tool_timeline_collision_checker', () => {
    it('Phát hiện va chạm thời gian nếu khoảng cách giữa 2 sự kiện < 20s', () => {
      const result = checkTimelineCollision({
        events: [
          { id: 'ev_1', at_s: 30, actor_id: 'bo', type: 'comment' },
          { id: 'ev_2', at_s: 42, actor_id: 'tri', type: 'comment' }, // Gap = 12s (< 20s)
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
  });

  // ==========================================================================
  // 4. tool_evaluate_bloom_level
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
  // 5. executeTool & DeterministicToolCall Contract Compliance
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

    it('Tất cả tools đều có schema JSON Schema trong OPENAI_TOOL_DEFINITIONS', () => {
      assert.ok(OPENAI_TOOL_DEFINITIONS.length >= 4);
      const names = OPENAI_TOOL_DEFINITIONS.map(t => t.function.name);
      assert.ok(names.includes('tool_verify_vector_algebra'));
      assert.ok(names.includes('tool_query_misconception_kb'));
      assert.ok(names.includes('tool_timeline_collision_checker'));
      assert.ok(names.includes('tool_evaluate_bloom_level'));
      assert.ok(names.includes('tool_check_source_grounding'));
    });
  });
});
