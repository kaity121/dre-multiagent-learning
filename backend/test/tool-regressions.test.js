// backend/test/tool-regressions.test.js
// Regressions found while reviewing PR #24/#25 with real learner phrasing and candidate head 79c9cda.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { 
  verifyVectorAlgebra, 
  extractVectorExpr, 
  extractClaimFromText 
} from '../src/tools/tool_verify_vector_algebra.js';
import { calculateDotProduct } from '../src/tools/tool_calculate_dot_product.js';
import { checkTimelineCollision } from '../src/tools/tool_timeline_collision_checker.js';
import { executeTool, OPENAI_TOOL_DEFINITIONS } from '../src/tools/index.js';
import { getById } from '../src/services/knowledgeBase.js';

// The roundtable imports the OpenAI client, which needs a key to construct.
process.env.OPENAI_API_KEY ||= 'test-key';
const { runRoundtable, buildTriPrompt, getMisconceptionVerifiableConfig } = await import('../src/services/roundtable.js');

/**
 * Caller-level badge simulation mirroring backend/server.js:280-325
 */
function simulateCallerBadge(message, currentTime = 2233) {
  const lower = String(message).toLowerCase().trim();
  let parsedExpr = extractVectorExpr(message);
  if (!parsedExpr && currentTime >= 2100 && currentTime <= 2400 && (lower.includes('bc') || lower.includes('dd') || lower.includes('độ dài') || lower.includes('do dai'))) {
    parsedExpr = "|BC + DD'|";
  }

  if (!parsedExpr) return null;

  const parsedClaim = extractClaimFromText(message);
  const sideMatch = lower.match(/(?:cạnh|side)\s*(?:bằng|=|là)?\s*(\d+(?:[.,]\d+)?)/i);
  const detectedSide = sideMatch ? sideMatch[1].replace(',', '.') : (lower.includes('cạnh 2') ? '2' : 'a');

  const vectorAlgebraTool = executeTool('tool_verify_vector_algebra', {
    shape: 'cube',
    side: detectedSide,
    expr: parsedExpr,
    claim: parsedClaim,
  });

  let badgeText = '';
  if (vectorAlgebraTool.isValid === true) {
    badgeText = `Đã kiểm chứng hình học: Khớp chuẩn (${vectorAlgebraTool.output.correct})`;
  } else if (vectorAlgebraTool.isValid === false) {
    badgeText = `Đã kiểm chứng hình học: Sai lệch (${vectorAlgebraTool.input.claim} ≠ ${vectorAlgebraTool.output.correct})`;
  } else {
    badgeText = `Đã tính toán hình học: ${vectorAlgebraTool.input.expr} = ${vectorAlgebraTool.output.correct}`;
  }

  return {
    parsedExpr,
    parsedClaim,
    detectedSide,
    toolCall: vectorAlgebraTool,
    isValid: vectorAlgebraTool.isValid,
    badgeText,
  };
}

describe('P2 Review Fixes: Caller-level claim parsing & badge generation', () => {
  it('[P2] cạnh bằng 2, BC + DD\' tính thế nào? separates side length from claim (calculation-only)', () => {
    const q = "cạnh bằng 2, BC + DD' tính thế nào?";
    assert.equal(extractClaimFromText(q), null, 'Side length 2 must not be treated as a claim');

    const result = simulateCallerBadge(q);
    assert.ok(result);
    assert.equal(result.detectedSide, '2');
    assert.equal(result.parsedClaim, null);
    assert.equal(result.isValid, null, 'isValid must be null when learner only asks for calculation');
    assert.match(result.badgeText, /Đã tính toán hình học: \|BC \+ DD'\| = 2\\sqrt\{2\}/);
    assert.doesNotMatch(result.badgeText, /Sai lệch/, 'Must not grade the given side as an answer');
    assert.doesNotMatch(result.badgeText, /Khớp chuẩn/);
  });

  it('[P2] "cạnh = 2, BC + DD\' tính thế nào?" parses side=2 and claim=null', () => {
    const q = "cạnh = 2, BC + DD' tính thế nào?";
    assert.equal(extractClaimFromText(q), null);
    const result = simulateCallerBadge(q);
    assert.equal(result.detectedSide, '2');
    assert.equal(result.isValid, null);
  });

  it('[P2] BC + DD\' bằng bao nhiêu ạ? returns isValid:null through executeTool and calculation-only badge', () => {
    const q = "BC + DD' bằng bao nhiêu ạ?";
    assert.equal(extractClaimFromText(q), null);

    const call = executeTool('tool_verify_vector_algebra', {
      expr: extractVectorExpr(q),
      claim: extractClaimFromText(q),
    });
    assert.equal(call.isValid, null, 'executeTool must preserve isValid: null, not convert to true');

    const result = simulateCallerBadge(q);
    assert.equal(result.isValid, null);
    assert.match(result.badgeText, /Đã tính toán hình học: \|BC \+ DD'\| = a\\sqrt\{2\}/);
    assert.doesNotMatch(result.badgeText, /Khớp chuẩn/, 'Must not show "Khớp chuẩn" for question-only');
  });

  it('[P2] AB + AA\' = A\'B\' returns isValid:false and does not produce a positive badge', () => {
    const q = "AB + AA' = A'B'";
    assert.equal(extractClaimFromText(q), "A'B'");

    const call = executeTool('tool_verify_vector_algebra', {
      expr: "|AB + AA'|",
      claim: "A'B'",
    });
    assert.equal(call.isValid, false, 'Vector A\'B\' is not equivalent to AB + AA\'');

    const result = simulateCallerBadge(q);
    assert.equal(result.isValid, false);
    assert.match(result.badgeText, /Đã kiểm chứng hình học: Sai lệch/);
    assert.doesNotMatch(result.badgeText, /Khớp chuẩn/);
  });

  it('Explicit answer "cạnh bằng 2 thì BC + DD\' = 2√2 hả" produces positive verification badge', () => {
    const q = "cạnh bằng 2 thì BC + DD' = 2√2 hả";
    assert.equal(extractClaimFromText(q), "2√2");

    const result = simulateCallerBadge(q);
    assert.equal(result.detectedSide, '2');
    assert.equal(result.isValid, true);
    assert.match(result.badgeText, /Đã kiểm chứng hình học: Khớp chuẩn \(2\\sqrt\{2\}\)/);
  });
});

describe('Claim extraction from learner questions (PR #25 companions)', () => {
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

describe('Dot product with a zero vector (PR #25 companions)', () => {
  it('accepts a dot product of 0 and rejects any other value', () => {
    assert.equal(calculateDotProduct({ uMag: 0, vMag: 2, claimValue: '0', claimType: 'dot_product' }).isValid, true);
    assert.equal(calculateDotProduct({ uMag: 0, vMag: 2, claimValue: '10', claimType: 'dot_product' }).isValid, false);
    assert.equal(calculateDotProduct({ uMag: 0, vMag: 2, claimValue: 'không âm' }).isValid, true);
  });

  it('rejects fixed angle 0° and accepts arbitrary angle 0° to 180° per KB (MISC_VEC_018)', () => {
    // Bo claims fixed 0° -> false per KN_VEC_018
    const rZero = calculateDotProduct({ uMag: 0, vMag: 2, angleDeg: 0, claimValue: '0', claimType: 'angle' });
    assert.equal(rZero.isValid, false);
    assert.ok(rZero.reason.includes('tùy ý từ 0° đến 180°') || rZero.reason.includes('không bắt buộc duy nhất'));
    assert.equal(rZero.correct, '0° đến 180° (tùy ý)');

    // Textbook convention: arbitrary angle from 0° to 180° -> true
    const rArbitrary = calculateDotProduct({ uMag: 0, vMag: 2, claimValue: 'tùy ý từ 0° đến 180°', claimType: 'angle' });
    assert.equal(rArbitrary.isValid, true);
  });
});

describe('Reversing a vector changes the angle (MISC_VEC_017)', () => {
  it('angle(-u, v) = 180° - angle(u, v)', () => {
    const r = calculateDotProduct({ uMag: 2, vMag: 3, angleDeg: 60, reverseU: true, claimValue: '60', claimType: 'angle' });
    assert.equal(r.angleDeg, 120);
    assert.equal(r.isValid, false);
    assert.equal(r.dotProduct, -3);
  });
});

describe('A debate chained to its checkpoint is one pause', () => {
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

describe('Roundtable verifies angle and dot-product traps with the dot-product tool', () => {
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

describe('LLM-backed Roundtable Instructions and Tool Schema (Review P1 Regression Tests)', () => {
  it('P1-1: MISC_VEC_017 prompt includes reverseU: true and rejects Bo when called with instructions', () => {
    const { misconception: misc17 } = getById('MISC_VEC_017');
    assert.ok(misc17, 'MISC_VEC_017 must exist in KB');
    const toolConfig = getMisconceptionVerifiableConfig(misc17);
    assert.equal(toolConfig.params.reverseU, true);

    const boTurn = { dialogue: 'Góc giữa u và v là 60° thì đảo một vectơ v thành -v thì góc vẫn là 60° chứ!', claim: '60' };
    const { triPrompt, forcedToolChoice } = buildTriPrompt({ misconception: misc17, boTurn, toolConfig });

    // 1. Prompt for LLM must explicitly specify reverseU: true
    assert.ok(triPrompt.includes('- reverseU: true'), 'triPrompt must instruct LLM to use reverseU: true');
    assert.equal(forcedToolChoice.function.name, 'tool_calculate_dot_product');

    // 2. If reverseU is omitted (the old bug), the tool falsely accepts Bo\'s claim
    const withoutReverse = calculateDotProduct({ uMag: 2, vMag: 3, angleDeg: 60, claimValue: '60', claimType: 'angle' });
    assert.equal(withoutReverse.isValid, true, 'Without reverseU, tool falsely confirms 60°');

    // 3. With reverseU included per prompt instruction, the tool correctly rejects Bo\'s claim
    const withReverse = calculateDotProduct({ uMag: 2, vMag: 3, angleDeg: 60, claimValue: '60', claimType: 'angle', reverseU: true });
    assert.equal(withReverse.isValid, false, 'With reverseU: true, Bo is rejected');
    assert.equal(withReverse.angleDeg, 120);
    assert.equal(withReverse.correct, '120°');
  });

  it('P1-2: Tool schema permits norm_sum_squared and MISC_VEC_020 computes 19 rejecting Bo', () => {
    const dotDef = OPENAI_TOOL_DEFINITIONS.find((t) => t.function.name === 'tool_calculate_dot_product');
    assert.ok(dotDef, 'tool_calculate_dot_product definition must exist');

    // 1. Tool schema enum must include norm_sum_squared
    const allowedModes = dotDef.function.parameters.properties.claimType.enum;
    assert.ok(allowedModes.includes('norm_sum_squared'), 'claimType enum must include norm_sum_squared');
    assert.ok(allowedModes.includes('reverse_angle'), 'claimType enum should include reverse_angle');

    // 2. Prompt for MISC_VEC_020 instructs claimType: "norm_sum_squared"
    const { misconception: misc20 } = getById('MISC_VEC_020');
    assert.ok(misc20, 'MISC_VEC_020 must exist in KB');
    const toolConfig = getMisconceptionVerifiableConfig(misc20);
    assert.equal(toolConfig.params.claimType, 'norm_sum_squared');

    const boTurn = { dialogue: '|u + v|^2 = |u|^2 + |v|^2 = 2^2 + 3^2 = 13!', claim: '13' };
    const { triPrompt } = buildTriPrompt({ misconception: misc20, boTurn, toolConfig });
    assert.ok(triPrompt.includes('- claimType: "norm_sum_squared"'), 'triPrompt must instruct claimType: norm_sum_squared');

    // 3. Executing tool with schema-constrained LLM arguments computes 19 and rejects Bo\'s 13
    const toolCall = executeTool('tool_calculate_dot_product', {
      uMag: 2,
      vMag: 3,
      angleDeg: 60,
      claimValue: '13',
      claimType: 'norm_sum_squared',
    });
    assert.equal(toolCall.isValid, false, 'Bo omitting cross term must be rejected');
    assert.equal(toolCall.output.correct, '19');
    assert.ok(toolCall.output.reason.includes('số hạng chéo'), 'Reason must explain cross term');
  });

  it('P2: Missing angleDeg in norm_sum_squared does NOT falsely validate Bo\'s claim 13', () => {
    // 1. Without angleDeg, the tool must return an error and isValid: false (never false-positive true)
    const resultNoAngle = calculateDotProduct({
      uMag: 2,
      vMag: 3,
      claimValue: '13',
      claimType: 'norm_sum_squared',
    });
    assert.equal(resultNoAngle.isValid, false, 'Missing angle must NOT validate Bo\'s claim of 13');
    assert.ok(resultNoAngle.error, 'Must report an error about missing angleDeg');
    assert.ok(resultNoAngle.reason.includes('thiếu angleDeg') || resultNoAngle.reason.includes('chưa biết góc'));

    // 2. Calling via executeTool wrapper preserves isValid: false and returns error
    const toolCall = executeTool('tool_calculate_dot_product', {
      uMag: 2,
      vMag: 3,
      claimValue: '13',
      claimType: 'norm_sum_squared',
    });
    assert.equal(toolCall.isValid, false);
    assert.ok(toolCall.output.error);

    // 3. Omitting angle in reversed angle also reports error
    const revNoAngle = calculateDotProduct({ uMag: 2, vMag: 3, reverseU: true, claimValue: '120' });
    assert.equal(revNoAngle.isValid, false);
    assert.ok(revNoAngle.error);
  });
});

describe('Runtime Dispatcher API Endpoints (POST /api/runtime/dispatch & POST /api/dispatcher/evaluate)', () => {
  it('registers both /api/runtime/dispatch and /api/dispatcher/evaluate on app', async () => {
    process.env.NODE_ENV = 'test';
    const { app } = await import('../server.js');
    const routes = app._router.stack
      .filter((r) => r.route)
      .map((r) => ({ path: r.route.path, methods: Object.keys(r.route.methods) }));

    const dispatchRoute = routes.find((r) => r.path === '/api/runtime/dispatch');
    const evaluateRoute = routes.find((r) => r.path === '/api/dispatcher/evaluate');

    assert.ok(dispatchRoute, 'POST /api/runtime/dispatch must be registered for existing callers');
    assert.ok(dispatchRoute.methods.includes('post'), 'POST method must be supported on /api/runtime/dispatch');

    assert.ok(evaluateRoute, 'POST /api/dispatcher/evaluate alias must be registered');
    assert.ok(evaluateRoute.methods.includes('post'), 'POST method must be supported on /api/dispatcher/evaluate');
  });

  it('handleRuntimeDispatch successfully dispatches valid learner messages and returns 200 payload', async () => {
    process.env.NODE_ENV = 'test';
    const { handleRuntimeDispatch } = await import('../server.js');

    let statusCode = 200;
    let responseData = null;
    const req = {
      body: {
        message: 'Cho mình xin lại công thức cộng vectơ hình bình hành',
        useLLM: false,
      },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    await handleRuntimeDispatch(req, res);
    assert.equal(statusCode, 200);
    assert.ok(responseData, 'Response data must not be empty');
    assert.equal(responseData.verdict.dispatchedAgent, 'linhchi');
    assert.ok(responseData.primaryResponse.text.length > 0);
  });

  it('handleRuntimeDispatch returns 400 when message is missing', async () => {
    process.env.NODE_ENV = 'test';
    const { handleRuntimeDispatch } = await import('../server.js');

    let statusCode = 200;
    let responseData = null;
    const req = { body: {} };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    await handleRuntimeDispatch(req, res);
    assert.equal(statusCode, 400);
    assert.equal(responseData.error, 'Thiếu message');
  });
});

describe('Review Follow-ups (Zero-vector Angle KB, Vietnamese wording vectơ, Bo bảo pattern)', () => {
  it('P1: Zero-vector angle complies with KB KN_VEC_018 allowing arbitrary 0° to 180°', () => {
    const misc18 = getById('MISC_VEC_018');
    assert.ok(misc18.misconception.correction.includes('0° đến 180°'));

    // Fixed angle claim is rejected with pedagogical explanation
    const fixedRes = calculateDotProduct({ uMag: 0, vMag: 2, angleDeg: 0, claimValue: '0', claimType: 'angle' });
    assert.equal(fixedRes.isValid, false);
    assert.ok(fixedRes.reason.includes('KN_VEC_018') || fixedRes.reason.includes('0° đến 180°'));
    assert.equal(fixedRes.correct, '0° đến 180° (tùy ý)');

    // Permissible textbook claim is accepted
    const permRes = calculateDotProduct({ uMag: 0, vMag: 2, claimValue: 'tùy ý từ 0° đến 180°', claimType: 'angle' });
    assert.equal(permRes.isValid, true);
  });

  it('P2: Vietnamese wording "vectơ" (with ơ) in dot product is rejected as non-scalar (MISC_VEC_019)', () => {
    // 1. Single word "vectơ"
    const r1 = calculateDotProduct({ uMag: 2, vMag: 3, angleDeg: 120, claimValue: 'vectơ', claimType: 'dot_product' });
    assert.equal(r1.isValid, false, 'Claim "vectơ" must be rejected');
    assert.ok(r1.reason.includes('SỐ THỰC'));

    // 2. Phrase "là một vectơ"
    const r2 = calculateDotProduct({ uMag: 2, vMag: 3, angleDeg: 120, claimValue: 'là một vectơ', claimType: 'dot_product' });
    assert.equal(r2.isValid, false, 'Claim "là một vectơ" must be rejected');
    assert.ok(r2.reason.includes('SỐ THỰC'));

    // 3. For zero vector
    const r3 = calculateDotProduct({ uMag: 0, vMag: 2, claimValue: 'ra vectơ', claimType: 'dot_product' });
    assert.equal(r3.isValid, false);
    assert.ok(r3.reason.includes('số thực'));
  });

  it('P2: "Bo bảo" in both NFC and NFD Unicode normalization is recognized as questioning Bo', () => {
    const msgNFC = 'Bo bảo BC + DD\' bằng 2a, sai đúng không?';
    const msgNFD = msgNFC.normalize('NFD');

    // Both must return null claim (not attributing Bo\'s claim to the student)
    assert.equal(extractClaimFromText(msgNFC), null, 'NFC message must not extract 2a as learner claim');
    assert.equal(extractClaimFromText(msgNFD), null, 'NFD message must not extract 2a as learner claim');

    // Also handles unaccented "Bo bao"
    assert.equal(extractClaimFromText('Bo bao BC + DD\' bang 2a'), null);

    // Also handles "theo Bo"
    assert.equal(extractClaimFromText('theo Bo thì BC + DD\' = 2a'), null);
  });

  it('P2: Respect claimType after vector reversal (dot_product accepts -3, norm_sum_squared accepts 7)', () => {
    // 1. claimType: 'dot_product' with reverseU: true
    // u=2, v=3, angle=60°, reverseU -> angle becomes 120°, cos(120°)=-0.5, dot=-3
    const dotRes = calculateDotProduct({
      uMag: 2,
      vMag: 3,
      angleDeg: 60,
      reverseU: true,
      claimType: 'dot_product',
      claimValue: '-3',
    });
    assert.equal(dotRes.isValid, true, 'claim -3 must be accepted for reversed dot_product');
    assert.equal(dotRes.dotProduct, -3);

    const dotAngleRejected = calculateDotProduct({
      uMag: 2,
      vMag: 3,
      angleDeg: 60,
      reverseU: true,
      claimType: 'dot_product',
      claimValue: '120',
    });
    assert.equal(dotAngleRejected.isValid, false, 'claim 120 (angle value) must be rejected for dot_product');

    // 2. claimType: 'norm_sum_squared' with reverseU: true
    // |u+v|^2 = 2^2 + 3^2 + 2(-3) = 4 + 9 - 6 = 7
    const normRes = calculateDotProduct({
      uMag: 2,
      vMag: 3,
      angleDeg: 60,
      reverseU: true,
      claimType: 'norm_sum_squared',
      claimValue: '7',
    });
    assert.equal(normRes.isValid, true, 'claim 7 must be accepted for reversed norm_sum_squared');
    assert.equal(normRes.correct, '7');

    const normWrongRes = calculateDotProduct({
      uMag: 2,
      vMag: 3,
      angleDeg: 60,
      reverseU: true,
      claimType: 'norm_sum_squared',
      claimValue: '13',
    });
    assert.equal(normWrongRes.isValid, false, 'omitted cross-term claim 13 must be rejected');

    // 3. Working angle controls are preserved
    const angleCorrect = calculateDotProduct({
      uMag: 2,
      vMag: 3,
      angleDeg: 60,
      reverseU: true,
      claimType: 'angle',
      claimValue: '120',
    });
    assert.equal(angleCorrect.isValid, true, 'claim 120 must be accepted for reversed angle');

    const angleBoTrap = calculateDotProduct({
      uMag: 2,
      vMag: 3,
      angleDeg: 60,
      reverseU: true,
      claimType: 'angle',
      claimValue: '60',
    });
    assert.equal(angleBoTrap.isValid, false, 'Bo unchanged angle claim 60 must be rejected');
  });

  it('P2: Keep omitted-ID runtime sessions independent in handleRuntimeDispatch', async () => {
    process.env.NODE_ENV = 'test';
    const { handleRuntimeDispatch } = await import('../server.js');
    const { getOrCreateSession } = await import('../src/sessionStore.js');

    function createMockReqRes(body) {
      let statusCode = 200;
      let responseData = null;
      return {
        req: { body },
        res: {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            responseData = data;
            return this;
          },
        },
        getStatus: () => statusCode,
        getData: () => responseData,
      };
    }

    // Call 1 without sessionId
    const call1 = createMockReqRes({
      message: 'Chào bạn Linh Chi',
      useLLM: false,
    });
    await handleRuntimeDispatch(call1.req, call1.res);
    assert.equal(call1.getStatus(), 200);
    const session1Id = call1.getData().sessionState?.id;
    assert.ok(session1Id, 'Session ID must be generated');
    assert.notEqual(session1Id, 'test_session', 'Must not default to test_session');

    // Modify session 1 hint level in store
    const storeSession1 = getOrCreateSession(session1Id);
    storeSession1.hintLevel = 3;

    // Call 2 without sessionId
    const call2 = createMockReqRes({
      message: 'Chào bạn Minh Khang',
      useLLM: false,
    });
    await handleRuntimeDispatch(call2.req, call2.res);
    assert.equal(call2.getStatus(), 200);
    const session2Id = call2.getData().sessionState?.id;
    assert.ok(session2Id, 'Session ID must be generated');
    assert.notEqual(session1Id, session2Id, 'Independent calls without sessionId must receive distinct session IDs');

    // Session 2 in store must have default hint level (0), not contaminated by session 1
    const storeSession2 = getOrCreateSession(session2Id);
    assert.equal(storeSession2.hintLevel, 0, 'Session 2 must remain independent and uncontaminated');

    // Call 3 with explicit sessionId preserves continuity
    const explicitId = `custom_session_${Date.now()}`;
    const call3 = createMockReqRes({
      message: 'Chào Trí',
      sessionId: explicitId,
      useLLM: false,
    });
    await handleRuntimeDispatch(call3.req, call3.res);
    assert.equal(call3.getData().sessionState?.id, explicitId, 'Explicit sessionId must be preserved');
  });
});
