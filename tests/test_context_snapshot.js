import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

import {
  buildRuntimeContext,
  AGENT_ISOLATION_POLICIES,
  TOKEN_BUDGET_LIMIT,
  estimateTokens,
  generateCitations,
  findActiveLessonPart,
} from '../backend/src/services/contextSnapshot.js';

import { dispatchMessage } from '../backend/src/services/dispatcher.js';

/**
 * ============================================================================
 * TEST SUITE: CONTEXT ISOLATION SNAPSHOT & BOARD GROUNDING (ISSUE #402 / #12)
 * ============================================================================
 */

async function runTestSuite() {
  console.log('='.repeat(70));
  console.log('  TEST SUITE: CONTEXT ISOLATION SNAPSHOT & BOARD GROUNDING (#402)');
  console.log('  Target: 37:13 (2233s) - Ví dụ 3 (Hình lập phương ABCD.A\'B\'C\'D\')');
  console.log('='.repeat(70));

  const results = [];

  function recordTest(testName, passed, details = {}) {
    results.push({ testName, passed, ...details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] ${testName}`);
    if (!passed && details.error) {
      console.error(`      Error: ${details.error}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Board Grounding at second 2233 (37:13)
  // --------------------------------------------------------------------------
  try {
    const snapshot = buildRuntimeContext({
      agentId: 'tri',
      second: 2233,
      sessionId: 'session_001',
      videoId: 'VID_VECTO_12_TIEN',
    });

    const hasLatex = snapshot.temporalContext?.blackboardLatex?.includes('BC') &&
                     snapshot.temporalContext?.blackboardLatex?.includes("DD'");
    const hasGeometry = snapshot.temporalContext?.spatialGeometry?.shapeType === 'cube' &&
                        snapshot.temporalContext?.spatialGeometry?.vertices?.includes('A') &&
                        snapshot.temporalContext?.spatialGeometry?.vertices?.includes("D'");
    const hasSpeech = Boolean(snapshot.temporalContext?.teacherSpeechNow &&
                              snapshot.temporalContext?.teacherSpeechNow.length > 20);
    const hasActivePart = snapshot.metadata?.activePart?.partId === 'part_03_box_rule_example3';

    const passed = hasLatex && hasGeometry && hasSpeech && hasActivePart;
    recordTest('1. Board Grounding at 37:13 (LaTeX, 3D Cube, ~30s Speech, Active Part)', passed, {
      blackboardLatex: snapshot.temporalContext?.blackboardLatex,
      spatialGeometry: snapshot.temporalContext?.spatialGeometry?.shapeType,
      verticesCount: snapshot.temporalContext?.spatialGeometry?.vertices?.length,
      activePartId: snapshot.metadata?.activePart?.partId,
      speechSnippet: snapshot.temporalContext?.teacherSpeechNow?.slice(0, 60),
    });
  } catch (err) {
    recordTest('1. Board Grounding at 37:13', false, { error: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 2: Context Isolation Policy - Bo MUST NOT see standard solution
  // --------------------------------------------------------------------------
  try {
    const boSnapshot = buildRuntimeContext({
      agentId: 'bo',
      second: 2233,
      sessionId: 'session_001',
      videoId: 'VID_VECTO_12_TIEN',
    });

    const isBo = boSnapshot.persona?.agentId === 'bo';
    const policyFlagFalse = boSnapshot.metadata?.isolationPolicyApplied?.hasStandardSolution === false;
    const rebuttalFlagFalse = boSnapshot.metadata?.isolationPolicyApplied?.hasRebuttalAnchor === false;
    const scaffoldingFlagFalse = boSnapshot.metadata?.isolationPolicyApplied?.hasScaffoldingHints === false;

    // Check that Bo's RAG snippets strictly omit golden answer
    const boSnippetsJoined = (boSnapshot.ragContextSnippets || []).join(' ').toLowerCase();
    const noGoldenFormula = !boSnippetsJoined.includes('cc\' = bc\'') &&
                            !boSnippetsJoined.includes('a√2') &&
                            !boSnippetsJoined.includes('vuông cân tại c');
    const hasTrapPattern = boSnippetsJoined.includes('bẫy trực giác') ||
                           boSnippetsJoined.includes('cộng đại số') ||
                           boSnippetsJoined.includes('1 + 1 = 2');

    const passed = isBo && policyFlagFalse && rebuttalFlagFalse && scaffoldingFlagFalse && noGoldenFormula && hasTrapPattern;
    recordTest('2. Context Isolation - Bo MUST NOT see standard proof / rebuttalAnchor', passed, {
      hasStandardSolution: boSnapshot.metadata?.isolationPolicyApplied?.hasStandardSolution,
      hasRebuttalAnchor: boSnapshot.metadata?.isolationPolicyApplied?.hasRebuttalAnchor,
      noGoldenFormula,
      hasTrapPattern,
      ragSnippetsCount: boSnapshot.ragContextSnippets?.length,
    });
  } catch (err) {
    recordTest('2. Context Isolation - Bo', false, { error: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 3: Context Isolation Policy - Trí sees RAG & proof, but no TA hints
  // --------------------------------------------------------------------------
  try {
    const triSnapshot = buildRuntimeContext({
      agentId: 'tri',
      second: 2233,
      sessionId: 'session_001',
      videoId: 'VID_VECTO_12_TIEN',
    });

    const isTri = triSnapshot.persona?.agentId === 'tri';
    const hasStandardSolution = triSnapshot.metadata?.isolationPolicyApplied?.hasStandardSolution === true;
    const noScaffolding = triSnapshot.metadata?.isolationPolicyApplied?.hasScaffoldingHints === false;
    const triSnippetsJoined = (triSnapshot.ragContextSnippets || []).join(' ').toLowerCase();
    const hasTheorems = triSnippetsJoined.includes('định lý') ||
                        triSnippetsJoined.includes('tam giác') ||
                        triSnippetsJoined.includes('không cùng hướng') ||
                        triSnippetsJoined.includes('vuông góc');

    const passed = isTri && hasStandardSolution && noScaffolding && hasTheorems;
    recordTest('3. Context Isolation - Trí sees RAG theorems & proof, no TA hints', passed, {
      hasStandardSolution,
      hasScaffoldingHints: triSnapshot.metadata?.isolationPolicyApplied?.hasScaffoldingHints,
      hasTheorems,
      ragSnippetsCount: triSnapshot.ragContextSnippets?.length,
    });
  } catch (err) {
    recordTest('3. Context Isolation - Trí', false, { error: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 4: Context Isolation Policy - Trợ giảng An sees scaffolding nudges
  // --------------------------------------------------------------------------
  try {
    const anSnapshot = buildRuntimeContext({
      agentId: 'an',
      second: 2233,
      sessionId: 'session_001',
      videoId: 'VID_VECTO_12_TIEN',
    });

    const isAn = anSnapshot.persona?.agentId === 'an';
    const hasScaffolding = anSnapshot.metadata?.isolationPolicyApplied?.hasScaffoldingHints === true;
    const anSnippetsJoined = (anSnapshot.ragContextSnippets || []).join(' ').toLowerCase();
    const hasNudges = anSnippetsJoined.includes('gợi ý') || anSnippetsJoined.includes('scaffolding');

    const passed = isAn && hasScaffolding && hasNudges;
    recordTest('4. Context Isolation - Trợ giảng An sees Scaffolding Nudges (Level 1 & 2)', passed, {
      hasScaffoldingHints: hasScaffolding,
      hasNudges,
      ragSnippetsCount: anSnapshot.ragContextSnippets?.length,
    });
  } catch (err) {
    recordTest('4. Context Isolation - Trợ giảng An', false, { error: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 5: Context Isolation Policy - Linh Chi (Cheat Sheet) & Minh Khang (Analogy)
  // --------------------------------------------------------------------------
  try {
    const lcSnapshot = buildRuntimeContext({
      agentId: 'linhchi',
      second: 2233,
      sessionId: 'session_001',
      videoId: 'VID_VECTO_12_TIEN',
    });
    const mkSnapshot = buildRuntimeContext({
      agentId: 'minhkhang',
      second: 2233,
      sessionId: 'session_001',
      videoId: 'VID_VECTO_12_TIEN',
    });

    const lcPassed = lcSnapshot.metadata?.isolationPolicyApplied?.hasCheatSheet === true &&
                     (lcSnapshot.ragContextSnippets || []).some(s => s.toLowerCase().includes('khẩu quyết') || s.toLowerCase().includes('sổ tay') || s.toLowerCase().includes('quy tắc'));
    const mkPassed = mkSnapshot.metadata?.isolationPolicyApplied?.hasEverydayAnalogy === true &&
                     (mkSnapshot.ragContextSnippets || []).some(s => s.toLowerCase().includes('thuyền') || s.toLowerCase().includes('thực tiễn') || s.toLowerCase().includes('ví dụ'));

    recordTest('5. Context Isolation - Linh Chi (Cheat Sheet) & Minh Khang (Analogy)', lcPassed && mkPassed, {
      linhChiHasCheatSheet: lcSnapshot.metadata?.isolationPolicyApplied?.hasCheatSheet,
      minhKhangHasEverydayAnalogy: mkSnapshot.metadata?.isolationPolicyApplied?.hasEverydayAnalogy,
    });
  } catch (err) {
    recordTest('5. Context Isolation - Linh Chi & Minh Khang', false, { error: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 6: Token Budget Limit (< 1200 Tokens for all agents)
  // --------------------------------------------------------------------------
  try {
    const agents = ['tri', 'bo', 'an', 'linhchi', 'minhkhang', 'colam'];
    const tokenEstimates = {};
    let allWithinBudget = true;

    for (const a of agents) {
      const snap = buildRuntimeContext({
        agentId: a,
        second: 2233,
        sessionId: 'session_001',
        videoId: 'VID_VECTO_12_TIEN',
      });
      const est = snap.metadata?.tokenEstimate || 0;
      tokenEstimates[a] = est;
      if (est >= TOKEN_BUDGET_LIMIT || !snap.metadata?.withinTokenBudget) {
        allWithinBudget = false;
      }
    }

    recordTest('6. Token Budget Meter (< 1200 Tokens for all agents)', allWithinBudget, {
      tokenLimit: TOKEN_BUDGET_LIMIT,
      tokenEstimates,
      allWithinBudget,
    });
  } catch (err) {
    recordTest('6. Token Budget Meter', false, { error: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 7: Citations at 37:13 (Video, Blackboard, SGK)
  // --------------------------------------------------------------------------
  try {
    const snapshot = buildRuntimeContext({
      agentId: 'tri',
      second: 2233,
      sessionId: 'session_001',
      videoId: 'VID_VECTO_12_TIEN',
    });

    const citations = snapshot.citations || [];
    const videoCit = citations.find(c => c.source === 'video' && c.timestamp === 2233);
    const bbCit = citations.find(c => c.source === 'blackboard' && c.timestamp === 2233);
    const sgkCit = citations.find(c => c.source === 'sgk');

    const passed = Boolean(videoCit && bbCit && sgkCit);
    recordTest('7. Structured Citations at 37:13 (Video, Blackboard, SGK with timestamps)', passed, {
      totalCitations: citations.length,
      hasVideoCit: Boolean(videoCit),
      videoLabel: videoCit?.label,
      hasBlackboardCit: Boolean(bbCit),
      blackboardLabel: bbCit?.label,
      hasSgkCit: Boolean(sgkCit),
      sgkLabel: sgkCit?.label,
    });
  } catch (err) {
    recordTest('7. Structured Citations at 37:13', false, { error: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 8: Full Dispatcher Chat Query at 37:13 attaches Citations & Snapshot
  // --------------------------------------------------------------------------
  try {
    const dispatchRes = await dispatchMessage({
      message: 'Sao không cộng thẳng độ dài bằng 1 + 1 = 2 luôn cho nhanh?',
      currentTime: 2233,
      recipient: 'all',
      sessionId: 'session_001',
    });

    const hasSnapshot = Boolean(dispatchRes.contextSnapshot && dispatchRes.contextSnapshot.temporalContext);
    const hasCitations = Array.isArray(dispatchRes.citations) && dispatchRes.citations.length > 0;
    const videoCitationAt3713 = dispatchRes.citations?.some(c => c.source === 'video' && c.timestamp === 2233);
    const primaryAuthor = dispatchRes.primaryResponse?.author;

    const passed = hasSnapshot && hasCitations && videoCitationAt3713;
    recordTest('8. Runtime Dispatcher at 37:13 attaches Snapshot & Clickable Citations', passed, {
      primaryAuthor,
      hasSnapshot,
      citationsCount: dispatchRes.citations?.length,
      videoCitationAt3713,
      snippetQuote: dispatchRes.citations?.[0]?.quote || dispatchRes.citations?.[0]?.label,
    });
  } catch (err) {
    recordTest('8. Runtime Dispatcher at 37:13', false, { error: err.message });
  }

  // --------------------------------------------------------------------------
  // Summary & Evidence Export
  // --------------------------------------------------------------------------
  console.log('='.repeat(70));
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const successRate = Math.round((passedCount / total) * 100);

  console.log(`  SUMMARY: ${passedCount}/${total} tests passed (${successRate}%)`);
  console.log('='.repeat(70));

  const evidenceReport = {
    epic: 'EPIC 4',
    issue: '#402 (GitHub Issue #12)',
    title: 'Context Isolation Snapshot & Board Grounding',
    timestamp: new Date().toISOString(),
    totalTests: total,
    passedCount,
    successRate: `${successRate}%`,
    tokenBudgetLimit: TOKEN_BUDGET_LIMIT,
    keyMilestone: '37:13 (Ví dụ 3 Hình lập phương)',
    results,
    status: passedCount === total ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED',
  };

  const evidencePath = path.join(__dirname, 'context_snapshot_evidence.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidenceReport, null, 2), 'utf8');
  console.log(`  Evidence saved to: ${evidencePath}`);

  if (passedCount !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
