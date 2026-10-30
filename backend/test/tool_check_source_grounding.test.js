/**
 * tool_check_source_grounding.test.js
 *
 * Test suite cho tool_check_source_grounding:
 * 1. Bài toán vectơ (VID_VECTO_12_TIEN):
 *    - "|BC + DD'| = 1 + 1 = 2" -> contradicted, isValid: false, citation ở 2233s.
 *    - "|BC + DD'| = căn 2" -> supported, isValid: true, citation ở 2233s.
 * 2. Bài môn khác (Trí tuệ nhân tạo - VID_AI_INTRO_01):
 *    - Học có giám sát cần nhãn ground truth -> supported, isValid: true, citation ở 120s.
 *    - Dữ liệu chưa gán nhãn có thể huấn luyện Supervised Learning -> contradicted, isValid: false, citation ở 120s.
 *    - Overfitting kiểm soát bằng Early Stopping -> supported, isValid: true, citation ở 300s.
 * 3. Ngoại phạm vi (Out of domain / Not in source):
 *    - Phát biểu về lịch sử hoặc ẩm thực trong bài AI/Toán -> not_in_source, isValid: null, citations rỗng.
 * 4. Chống ảo giác (Anti-hallucination):
 *    - Mọi quote trong citations BẮT BUỘC là chuỗi con của transcript/blackboard trong bài giảng.
 * 5. Tích hợp DeterministicToolCall & executeTool:
 *    - Đăng ký vào TOOLS_REGISTRY, trả về đúng định dạng DeterministicToolCall với isValid: null được bảo toàn.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkSourceGrounding } from '../src/tools/tool_check_source_grounding.js';
import { executeTool, TOOLS_REGISTRY } from '../src/tools/index.js';
import { getLessonIndex } from '../src/services/lessonIndex.js';

describe('tool_check_source_grounding - Subject-Agnostic Source Verification', () => {

  describe('1. Math 12 Vector Geometry (VID_VECTO_12_TIEN)', () => {
    it('phát hiện ngộ nhận cộng độ dài "|BC + DD\'| = 2" là contradicted tại 2233s (37:13)', () => {
      const result = checkSourceGrounding({
        claim: "|BC + DD'| = |BC| + |DD'| = 1 + 1 = 2",
        lessonId: 'VID_VECTO_12_TIEN',
        aroundSecond: 2233,
      });

      assert.equal(result.verdict, 'contradicted');
      assert.equal(result.isValid, false);
      assert.ok(result.citations.length > 0, 'Phải có ít nhất 1 citation trích dẫn');
      const cit = result.citations.find(c => c.second === 2233 || c.sourceId === 'seg_37_13');
      assert.ok(cit, 'Citation phải chỉ đúng mốc 2233s hoặc seg_37_13');
      assert.ok(cit.quote.includes("không được tách") || cit.quote.includes("1 + 1 = 2"));
    });

    it('xác nhận phát biểu đúng độ dài căn 2 là supported tại 2233s', () => {
      const result = checkSourceGrounding({
        claim: "Độ dài vectơ BC + DD' bằng a căn 2 (kết quả chuẩn căn 2)",
        lessonId: 'VID_VECTO_12_TIEN',
        aroundSecond: 2233,
      });

      assert.equal(result.verdict, 'supported');
      assert.equal(result.isValid, true);
      assert.ok(result.citations.length > 0);
      assert.equal(result.citations[0].second, 2233);
    });
  });

  describe('2. Non-Math Subject: AI Introduction (VID_AI_INTRO_01)', () => {
    it('xác nhận định nghĩa Học có giám sát (Supervised Learning) cần nhãn là supported tại 120s', () => {
      const result = checkSourceGrounding({
        claim: "Học có giám sát (Supervised Learning) bắt buộc phải có nhãn ground truth",
        lessonId: 'VID_AI_INTRO_01',
        aroundSecond: 120,
      });

      assert.equal(result.verdict, 'supported');
      assert.equal(result.isValid, true);
      assert.ok(result.citations.length > 0);
      assert.equal(result.citations[0].second, 120);
      assert.ok(result.citations[0].quote.includes("Supervised Learning") || result.citations[0].quote.includes("ground truth"));
    });

    it('bác bỏ phát biểu sai về dữ liệu chưa gán nhãn cho Supervised Learning là contradicted tại 120s', () => {
      const result = checkSourceGrounding({
        claim: "Dữ liệu chưa gán nhãn có thể dùng để huấn luyện mô hình Supervised Learning bình thường",
        lessonId: 'VID_AI_INTRO_01',
        aroundSecond: 120,
      });

      assert.equal(result.verdict, 'contradicted');
      assert.equal(result.isValid, false);
      assert.ok(result.citations.length > 0);
      assert.equal(result.citations[0].second, 120);
    });

    it('xác nhận phương pháp chống Overfitting bằng Early Stopping tại 300s', () => {
      const result = checkSourceGrounding({
        claim: "Để khắc phục hiện tượng Overfitting, giải pháp phổ biến là dùng Regularization hoặc Early Stopping",
        lessonId: 'VID_AI_INTRO_01',
        aroundSecond: 300,
      });

      assert.equal(result.verdict, 'supported');
      assert.equal(result.isValid, true);
      assert.ok(result.citations.length > 0);
      assert.equal(result.citations[0].second, 300);
      assert.ok(result.citations[0].quote.includes("Early Stopping") || result.citations[0].quote.includes("Regularization"));
    });
  });

  describe('3. Out of Domain & Empty Queries (not_in_source)', () => {
    it('trả về not_in_source và isValid: null khi phát biểu không có trong bài giảng', () => {
      const result = checkSourceGrounding({
        claim: "Chiến dịch Điện Biên Phủ diễn ra vào năm 1954 trên đồi A1",
        lessonId: 'VID_AI_INTRO_01',
      });

      assert.equal(result.verdict, 'not_in_source');
      assert.equal(result.isValid, null);
      assert.deepEqual(result.citations, []);
      assert.ok(result.reason.includes('ngoài nội dung bài'));
    });

    it('trả về not_in_source khi claim rỗng hoặc không có chuỗi hợp lệ', () => {
      const result = checkSourceGrounding({
        claim: '   ',
        lessonId: 'VID_AI_INTRO_01',
      });

      assert.equal(result.verdict, 'not_in_source');
      assert.equal(result.isValid, null);
    });
  });

  describe('4. Anti-Hallucination: Citations must be strict substrings of source pool', () => {
    it('mọi citation quote được trả về phải là chuỗi con chính xác của tài liệu bài giảng', () => {
      const lesson = getLessonIndex('VID_AI_INTRO_01');
      assert.ok(lesson, 'Phải tải được lesson index');

      // Tạo pool văn bản từ toàn bộ segments của bài
      const fullTextPool = lesson.segments.map(s => `${s.audioTranscript} ${s.blackboardText} ${s.speaker}`).join('\n');

      const claimsToTest = [
        "Học có giám sát Supervised Learning nhãn ground truth",
        "Overfitting hiện tượng học vẹt Regularization Early Stopping",
        "Dữ liệu chưa gán nhãn KHÔNG THỂ dùng để huấn luyện Supervised Learning",
      ];

      for (const claim of claimsToTest) {
        const res = checkSourceGrounding({
          claim,
          lessonId: 'VID_AI_INTRO_01',
        });

        for (const citation of res.citations) {
          assert.ok(
            fullTextPool.includes(citation.quote),
            `Quote [${citation.quote}] vi phạm chống ảo giác: không tồn tại trong source pool!`
          );
        }
      }
    });
  });

  describe('5. DeterministicToolCall & executeTool Registration', () => {
    it('được đăng ký thành công trong TOOLS_REGISTRY', () => {
      assert.equal(typeof TOOLS_REGISTRY['tool_check_source_grounding'], 'function');
    });

    it('executeTool bảo toàn isValid: null khi trả về not_in_source', () => {
      const toolCall = executeTool('tool_check_source_grounding', {
        claim: "Công thức làm bánh mì baguette kiểu Pháp theo truyền thống Paris",
        lessonId: 'VID_AI_INTRO_01',
      });

      assert.equal(toolCall.toolName, 'tool_check_source_grounding');
      assert.equal(toolCall.isValid, null, 'executeTool phải giữ nguyên isValid: null (PR #25 specification)');
      assert.equal(toolCall.output.verdict, 'not_in_source');
      assert.ok(typeof toolCall.timestampMs === 'number');
    });

    it('executeTool trả về isValid: false khi phát hiện contradicted', () => {
      const toolCall = executeTool('tool_check_source_grounding', {
        claim: "|BC + DD'| = 1 + 1 = 2",
        lessonId: 'VID_VECTO_12_TIEN',
        aroundSecond: 2233,
      });

      assert.equal(toolCall.toolName, 'tool_check_source_grounding');
      assert.equal(toolCall.isValid, false);
      assert.equal(toolCall.output.verdict, 'contradicted');
    });

    it('executeTool trả về isValid: true khi phát hiện supported', () => {
      const toolCall = executeTool('tool_check_source_grounding', {
        claim: "Supervised Learning yêu cầu nhãn ground truth",
        lessonId: 'VID_AI_INTRO_01',
        aroundSecond: 120,
      });

      assert.equal(toolCall.toolName, 'tool_check_source_grounding');
      assert.equal(toolCall.isValid, true);
      assert.equal(toolCall.output.verdict, 'supported');
    });
  });
});
