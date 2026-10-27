// Regressions found while reviewing PR #24 with real learner phrasing.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { verifyVectorAlgebra, extractVectorExpr, extractClaimFromText } from '../src/tools/tool_verify_vector_algebra.js';
import { calculateDotProduct } from '../src/tools/tool_calculate_dot_product.js';
import { checkTimelineCollision } from '../src/tools/tool_timeline_collision_checker.js';
import { executeTool } from '../src/tools/index.js';

// The roundtable imports the OpenAI client, which needs a key to construct.
process.env.OPENAI_API_KEY ||= 'test-key';
const { runRoundtable } = await import('../src/services/roundtable.js');

describe('claim extraction from learner questions', () => {
  it('reads "bằng bao nhiêu" as a question, not as the vector BA', () => {
    const q = "BC + DD' bằng bao nhiêu ạ?";
    assert.equal(extractClaimFromText(q), null);
    const r = verifyVectorAlgebra({ expr: extractVectorExpr(q), claim: extractClaimFromText(q) });
    assert.equal(r.isValid, null);
  });

  it('keeps "could not judge" as null through executeTool, so no "Khớp chuẩn" badge', () => {
    const call = executeTool('tool_verify_vector_algebra', { expr: "|BC + DD'|", claim: null });
    assert.equal(call.isValid, null);
    assert.equal(executeTool('tool_verify_vector_algebra', { expr: "|BC + DD'|", claim: '2a' }).isValid, false);
    assert.equal(executeTool('tool_verify_vector_algebra', { expr: "|BC + DD'|", claim: 'a√2' }).isValid, true);
  });

  it('still reads an uppercase vector name as a claim', () => {
    assert.equal(extractClaimFromText("BC + DD' bằng BC' đúng không"), "BC'");
  });

  it('does not attribute what Bo said to the learner', () => {
    assert.equal(extractClaimFromText("Bo nói BC + DD' bằng 2a, sai đúng không?"), null);
  });

  it('keeps the trailing a in "căn 3 a"', () => {
    const claim = extractClaimFromText("AB + AD + AA' bằng căn 3 a");
    assert.equal(claim, 'căn3a');
    assert.equal(verifyVectorAlgebra({ side: '2', expr: "|AB + AD + AA'|", claim }).isValid, true);
  });

  it('understands vectors written in words', () => {
    assert.equal(extractVectorExpr("vectơ BC cộng vectơ DD' là gì"), "|BC + DD'|");
  });
});

describe('dot product with a zero vector', () => {
  it('accepts a dot product of 0 and rejects any other value', () => {
    assert.equal(calculateDotProduct({ uMag: 0, vMag: 2, claimValue: '0', claimType: 'dot_product' }).isValid, true);
    assert.equal(calculateDotProduct({ uMag: 0, vMag: 2, claimValue: '10', claimType: 'dot_product' }).isValid, false);
    assert.equal(calculateDotProduct({ uMag: 0, vMag: 2, claimValue: 'không âm' }).isValid, true);
  });

  it('rejects any angle because the angle is undefined', () => {
    assert.equal(calculateDotProduct({ uMag: 0, vMag: 2, angleDeg: 0, claimValue: '0', claimType: 'angle' }).isValid, false);
  });
});

describe('reversing a vector changes the angle (MISC_VEC_017)', () => {
  it('angle(-u, v) = 180° - angle(u, v)', () => {
    const r = calculateDotProduct({ uMag: 2, vMag: 3, angleDeg: 60, reverseU: true, claimValue: '60', claimType: 'angle' });
    assert.equal(r.angleDeg, 120);
    assert.equal(r.isValid, false);
    assert.equal(r.dotProduct, -3);
  });
});

describe('a debate chained to its checkpoint is one pause', () => {
  it('does not report a collision between the checkpoint and the chained debate', () => {
    const events = [
      { id: 'pq02_checkpoint_3713', at_s: 2233, type: 'checkpoint' },
      { id: 'sc_bo_debate_3713', at_s: 2235, type: 'rebuttal', chainedTo: 'pq02_checkpoint_3713' },
    ];
    assert.equal(checkTimelineCollision({ events }).collisions.length, 0);
    const unchained = events.map(({ chainedTo, ...e }) => e);
    assert.equal(checkTimelineCollision({ events: unchained }).collisions.length, 1);
  });
});

describe('roundtable verifies angle and dot-product traps with the dot-product tool', () => {
  for (const [id, expected] of [
    ['MISC_VEC_017', false],
    ['MISC_VEC_018', false],
    ['MISC_VEC_019', false],
  ]) {
    it(`${id}: Trí calls tool_calculate_dot_product and rejects Bo`, async () => {
      const draft = await runRoundtable(id, { useLLM: false });
      const call = draft.deterministic_tool_calls.find((c) => c.toolName === 'tool_calculate_dot_product');
      assert.ok(call, 'dot-product tool was called');
      assert.equal(call.output.isValid, expected);
    });
  }
});
