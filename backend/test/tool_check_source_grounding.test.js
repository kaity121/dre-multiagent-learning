import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { executeTool } from '../src/tools/index.js';
import { checkSourceGrounding } from '../src/tools/tool_check_source_grounding.js';

describe('Deterministic Tool: tool_check_source_grounding (#27)', () => {
  test('Math lesson: |BC + DD\'| = 1 + 1 = 2 is contradicted with citation at 37:13', () => {
    const res = executeTool('tool_check_source_grounding', {
      claim: "|BC + DD'| = 1 + 1 = 2",
      lessonId: 'VID_VECTO_12_TIEN',
      aroundSecond: 2233,
    });

    assert.equal(res.toolName, 'tool_check_source_grounding');
    assert.equal(res.output.verdict, 'contradicted');
    assert.equal(res.isValid, false);
    assert.ok(res.output.citations.length >= 1);
    assert.equal(res.output.citations[0].second, 2233);
    assert.match(res.output.reason, /không được tách độ dài/i);
  });

  test('Math lesson: |BC + DD\'| = căn 2 is supported with citation', () => {
    const res = executeTool('tool_check_source_grounding', {
      claim: "|BC + DD'| = |BC'| = căn 2",
      lessonId: 'VID_VECTO_12_TIEN',
      aroundSecond: 2233,
    });

    assert.equal(res.output.verdict, 'supported');
    assert.equal(res.isValid, true);
    assert.ok(res.output.citations.length >= 1);
  });

  test('Non-math lesson (AI): Supervised Learning requires ground truth labels is supported', () => {
    const res = executeTool('tool_check_source_grounding', {
      claim: 'Supervised Learning bat buoc phai co nhan ground truth',
      lessonId: 'VID_AI_INTRO_01',
      aroundSecond: 120,
    });

    assert.equal(res.output.verdict, 'supported');
    assert.equal(res.isValid, true);
    assert.ok(res.output.citations.length >= 1);
    assert.equal(res.output.citations[0].second, 120);
  });

  test('Non-math lesson (AI): Unlabeled data can train Supervised Learning is contradicted', () => {
    const res = executeTool('tool_check_source_grounding', {
      claim: 'Du lieu chua can nhan van hoc duoc Supervised Learning',
      lessonId: 'VID_AI_INTRO_01',
      aroundSecond: 120,
    });

    assert.equal(res.output.verdict, 'contradicted');
    assert.equal(res.isValid, false);
    assert.ok(res.output.citations.length >= 1);
  });

  test('Out-of-domain query is not_in_source with isValid: null', () => {
    const res = executeTool('tool_check_source_grounding', {
      claim: 'Hôm nay trời mưa nhiều ở thành phố',
      lessonId: 'VID_AI_INTRO_01',
    });

    assert.equal(res.output.verdict, 'not_in_source');
    assert.equal(res.isValid, null);
    assert.equal(res.output.citations.length, 0);
  });
});
