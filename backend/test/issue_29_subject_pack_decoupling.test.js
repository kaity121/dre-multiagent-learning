/**
 * issue_29_subject_pack_decoupling.test.js
 *
 * Test suite cho [EPIC 7 - Issue #29]:
 * 1. Không còn mặc định về vectơ:
 *    - queryMisconceptionKB() rỗng -> output: [], không trả về MISC_VEC_005.
 *    - misconceptionFrequency trả về null khi empirical_frequency === "not_measured" (bỏ số giả định 0.85).
 *    - Latex lạ/không có BC DD không bị ép về Ví dụ 3.
 * 2. Subject Pack:
 *    - data/subject-packs/math/vector-12.json tồn tại, khai báo tool_verify_vector_algebra, aliases, và verifier.
 *    - getSubjectPack nạp đúng gói theo môn.
 * 3. Chặn lỗi sai-không-báo trong tool_verify_vector_algebra:
 *    - |2AB + AD| tính đúng hệ số: kết quả là a\sqrt{5}, claim 'a\sqrt{5}' -> isValid: true.
 *    - shape: 'cuboid' không có dimensions -> isValid: null + reason chứa unsupported_expression (không tự ép lập phương).
 *    - shape: 'cuboid' có dimensions [1, 2, 3] và expr |AB + AD + AA'| -> độ dài căn 14, claim 'sqrt(14)' -> isValid: true (không còn chấm sai!).
 * 4. Chấm Bloom theo ranh giới từ:
 *    - "Nêu tính chất hình học" -> Remember / Understand (không bị từ "tính" của Apply bắt nhầm).
 *    - "Giải thích vì sao kết quả này hợp lý" -> Understand (không bị từ "giải" của Apply bắt nhầm).
 *    - Không có chuỗi hardcode "tại sao bo sai".
 * 5. Roundtable chạy chọn tool theo data-driven verifier:
 *    - Chạy misconception có verifier -> gọi đúng tool.
 *    - Misconception không có verifier -> tra cứu KB (tool_query_misconception_kb), không theo mã MISC_VEC_xxx.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryMisconceptionKB } from '../src/tools/tool_query_misconception_kb.js';
import { verifyVectorAlgebra } from '../src/tools/tool_verify_vector_algebra.js';
import { evaluateBloomLevel } from '../src/tools/tool_evaluate_bloom_level.js';
import { getSubjectPack } from '../src/services/subjectPackLoader.js';
import { runRoundtable, getMisconceptionVerifiableConfig } from '../src/services/roundtable.js';
import { TOOLS_REGISTRY } from '../src/tools/index.js';

describe('Issue #29: Subject Pack Decoupling & Tool Error Guardrails', () => {

  describe('1. Gỡ bỏ mặc định về vectơ trong queryMisconceptionKB', () => {
    it('tra cứu KB khi không truyền input gì trả về mảng rỗng (không mặc định MISC_VEC_005)', () => {
      const res = queryMisconceptionKB({});
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.output.length, 0);
      assert.strictEqual(res.count, 0);
    });

    it('tra cứu KB trả về misconceptionFrequency: null khi chưa đo đạc (không bịa 0.85)', () => {
      const res = queryMisconceptionKB({ misconceptionId: 'MISC_VEC_005' });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.output.length, 1);
      const item = res.output[0];
      assert.strictEqual(item.misconceptionFrequency, null, 'Phải trả về null khi empirical_frequency là not_measured');
    });

    it('biểu thức latex không chứa BC DD không bị ép về câu truy vấn Ví dụ 3', () => {
      const res = queryMisconceptionKB({ latex: '\\vec{GA} + \\vec{GB} + \\vec{GC} + \\vec{GD}' });
      // Không bị ép về "cộng độ dài vectơ ví dụ 3"
      assert.ok(!res.reason.includes('cộng độ dài vectơ ví dụ 3'));
    });
  });

  describe('2. Subject Pack Architecture', () => {
    it('nạp gói môn toán vector-12 đầy đủ 20 ngộ nhận và tools khai báo', () => {
      const pack = getSubjectPack('math', 'vector-12');
      assert.ok(pack, 'Subject pack phải tồn tại');
      assert.strictEqual(pack.subject, 'math');
      assert.ok(Array.isArray(pack.tools) && pack.tools.includes('tool_verify_vector_algebra'));
      assert.ok(Array.isArray(pack.misconceptions) && pack.misconceptions.length >= 20);
      
      // Ngộ nhận 005 có verifier khai báo rõ ràng
      const m5 = pack.misconceptions.find(m => m.id === 'MISC_VEC_005');
      assert.ok(m5.verifier, 'MISC_VEC_005 phải khai báo verifier');
      assert.strictEqual(m5.verifier.toolName, 'tool_verify_vector_algebra');
    });
  });

  describe('3. Chặn lỗi sai-không-báo trong tool_verify_vector_algebra', () => {
    it('tính đúng biểu thức có hệ số: |2AB + AD| có độ dài a\\sqrt{5}', () => {
      const res = verifyVectorAlgebra({
        shape: 'cube',
        side: 'a',
        expr: '|2AB + AD|',
        claim: 'a\\sqrt{5}',
      });

      assert.strictEqual(res.isValid, true, 'Claim a\\sqrt{5} cho |2AB + AD| phải là hợp lệ');
      assert.strictEqual(res.correct, 'a\\sqrt{5}');
    });

    it('chặn lỗi cuboid không có kích thước cụ thể: trả về isValid: null + unsupported_expression', () => {
      const res = verifyVectorAlgebra({
        shape: 'cuboid',
        side: 'a',
        expr: '|AB + AD + AA\'|',
        claim: 'sqrt(14)',
      });

      assert.strictEqual(res.isValid, null, 'Không được tự ý ép cuboid thành cube');
      assert.ok(res.reason.includes('unsupported_expression'));
    });

    it('tính chính xác cuboid khi có kích thước cụ thể [1, 2, 3]: đường chéo |AB + AD + AA\'| = \\sqrt{14}', () => {
      const res = verifyVectorAlgebra({
        shape: 'cuboid',
        dimensions: [1, 2, 3],
        expr: '|AB + AD + AA\'|',
        claim: '\\sqrt{14}',
      });

      assert.strictEqual(res.isValid, true, 'Độ dài đường chéo 1x2x3 là sqrt(14) phải được chấm đúng!');
      assert.strictEqual(res.correct, '\\sqrt{14}');
    });
  });

  describe('4. Chấm Bloom theo ranh giới từ (Tránh dương tính giả)', () => {
    it('"Nêu tính chất..." không bị từ "tính" của Apply bắt nhầm', () => {
      const res = evaluateBloomLevel({
        question: 'Nêu tính chất hình học của trọng tâm tứ diện ABCD',
      });

      assert.notEqual(res.level, 'Apply', '"Nêu tính chất" không được phân loại là Apply');
      assert.ok(['Remember', 'Understand'].includes(res.level));
    });

    it('"Giải thích..." không bị từ "giải" của Apply bắt nhầm', () => {
      const res = evaluateBloomLevel({
        question: 'Giải thích vì sao hai vectơ đối nhau lại có tổng bằng vectơ-không',
      });

      assert.strictEqual(res.level, 'Understand', '"Giải thích..." phải thuộc cấp độ Understand');
    });

    it('câu hỏi tính toán rõ ràng nhận đúng Apply', () => {
      const res = evaluateBloomLevel({
        question: 'Hãy tính toán độ dài vectơ tổng |AB + AD| trong hình vuông cạnh a',
      });

      assert.strictEqual(res.level, 'Apply');
    });
  });

  describe('5. Roundtable Data-Driven Verifier', () => {
    it('chạy Roundtable với MISC_VEC_005 sử dụng đúng tool_verify_vector_algebra', async () => {
      const draft = await runRoundtable('MISC_VEC_005', { useLLM: false });
      assert.ok(draft);
      assert.strictEqual(draft.status, 'draft');
      const toolEvent = draft.reasoning_events.find(e => e.eventType === 'tool_call');
      assert.ok(toolEvent);
      assert.strictEqual(toolEvent.toolCall.toolName, 'tool_verify_vector_algebra');
    });

    it('chọn tool theo verifier của dữ liệu, không theo mã ngộ nhận', () => {
      const config = getMisconceptionVerifiableConfig({
        id: 'ANY_SUBJECT_001',
        incorrect_claim: 'x',
        verifier: { toolName: 'tool_calculate_dot_product', params: { uMag: 1, vMag: 1, angleDeg: 90 } },
      });
      assert.strictEqual(config.toolType, 'dot_product');
      assert.strictEqual(config.toolName, 'tool_calculate_dot_product');
      assert.deepStrictEqual(config.params, { uMag: 1, vMag: 1, angleDeg: 90 });

      // Mã MISC_VEC_005 không còn tự kéo theo tool vectơ khi dữ liệu không khai báo verifier
      const noVerifier = getMisconceptionVerifiableConfig({ id: 'MISC_VEC_005', incorrect_claim: 'y', tags: ['cube'] });
      assert.strictEqual(noVerifier.toolName, 'tool_query_misconception_kb');
    });

    it('mọi ngộ nhận khai báo verifier trong Subject Pack đều trỏ tới tool đã đăng ký', () => {
      const pack = getSubjectPack('math', 'vector-12');
      for (const m of pack.misconceptions.filter((x) => x.verifier)) {
        assert.ok(TOOLS_REGISTRY[m.verifier.toolName], `${m.id} trỏ tới tool chưa đăng ký: ${m.verifier.toolName}`);
        assert.ok(pack.tools.includes(m.verifier.toolName), `${m.id}: pack.tools thiếu ${m.verifier.toolName}`);
      }
    });

    it('getSubjectPack không trả KB vectơ cho môn khác và từ chối tên gói không an toàn', () => {
      assert.strictEqual(getSubjectPack('ai', 'intro-01'), null);
      assert.strictEqual(getSubjectPack('../math', 'vector-12'), null);
    });
  });
});
