# Cluster C integration: tools + roundtable (PR #38, #32, #34)

Branch: `integrate/c-roundtable` (from `origin/main` d4dabb9). Not pushed; no GitHub comments posted.

## Merges

| Order | PR | Branch | Conflicts and resolution |
|---|---|---|---|
| 1 | #38 | feat/301-deterministic-tools-followup | Clean. |
| 2 | #32 | feat/302-roundtable-orchestrator | `tool_verify_vector_algebra.js`: kept #38, the newer tools follow-up. `server.js`: combined the listen guard with `export default`. The entry check now compares resolved paths (case-insensitive on Windows), replacing `argv[1].endsWith('server')`. |
| 3 | #34 | feat/303-roundtable-stream | #34 is built on an older #32 head and a stale merge of main. The tools file took #38's side. `server.js` was rebuilt from HEAD (main + #38 + #32 classroom/dispatcher routes) plus #34's stream/runs/drafts section. That also drops the duplicate early `/api/roundtable/run` and `/api/tools` registrations that shadowed the newer handlers. `dreBackendApi.ts` keeps main's `AgentCitation` typing and evaluator helpers, which the auto-merge had dropped, and takes #34's run types. |

## Blockers

| Source | Finding | Status | Fix |
|---|---|---|---|
| #32 P1 | `useLLM` never calls a model; the verdict ignores tool output | Fixed | Bo, Trí, Linh Chi, Minh Khang and Cô Lam lines go through `openaiClient.chatJSON` when `useLLM` is set and a key is configured (the chat client is injectable for tests). The approve/reject decision is made only by `assessTrapProposal` from the tool result. It rejects correct answers, unverifiable claims and wrong-but-unrealistic claims. It approves only claims matching the misconception's error mechanism, recomputed with the same tool (length sum for MISC_VEC_005, a dropped box edge for MISC_VEC_006, an exact-ID KB hit for conceptual traps). The loop is bounded at 3 rounds, and the last round uses the canonical trap, still tool-checked. Each part and the lesson carry `generation` (`llm`/`mixed`/`deterministic`/`deterministic_fallback`, `fallbackReason`, per-turn source). |
| #32 P1 | Short clip (65s) gave reversed parts and 915/2015s checkpoints; the question did not match the clip | Fixed | Parts come from the actual duration, out-of-range segments are ignored, and empty parts are dropped. Warmup is scaled for short parts and checkpoints are clamped to `[start+warmup, end)`. The misconception is detected from segment content. The committed short drafts were regenerated: VID_SHORT_60S is 0..65 with a checkpoint at 37s on `BC + DD'`, and CLIP_DEMO_60S_TIEN_EX3 is 0..60 with a checkpoint at 29s. |
| #32 P1 | `videoId` path traversal | Fixed | `assertSafeVideoId` (`^[A-Za-z0-9_-]{1,80}$`) runs before any work. `resolveDraftPath` requires the file to sit directly in the module-relative drafts directory. The SSE and generate routes answer 400 before opening the stream. |
| #32 P2 | Skip reopens the checkpoint | Already fixed in #32 (c4ae24e) | Verified: player ticks call `onSeek(sec)` without the manual flag. |
| #34 | Completion emits the legacy package and claims teacher approval | Fixed | Live and replay `done`/`complete` carry `lesson` as a `DRELessonSchema` with `status: 'draft'`, plus `approval.approvedByTeacher: false`. The legacy `ApprovedLessonPackage` types #34 re-added to `pipeline.ts` were removed again. The console shows "Bản nháp — chờ giáo viên duyệt". |
| #34 | Client subscribes to both aliases, so callbacks fire twice | Fixed | The client consumes only `reasoning_event`; the server still emits the aliases for older listeners. |
| #34 | Fallback replaces an error with fixture playback while the UI says LIVE; histories get mixed | Fixed | The server sends `provenance` in `session_start`/`done`/`complete` (live or replay, with `source: fixture/recorded_run`). The client falls back to the bundled fixture only if the backend was never reached, and announces `fallback_fixture` via `onSession` first. A dropped live run raises an error instead of appending fixture events. The hook resets history per session and the console labels the real provenance. `getRoundtableRun` no longer swaps in fixture data on failure. |
| #34 | Recorder/draft paths depend on cwd | Fixed | `runRecorder` was already module-relative. The default stream and drafts routes in `server.js` now use module-relative paths, and the recorder no longer falls back to an array file as a run. |
| #34 | Full generation still writes after abort | Fixed | `isAborted` is checked between phases and parts and before the write; aborted runs return null and write nothing (tested before and during the run). |
| #34 | Part wrapper read `scriptScenario`/`speech` | Fixed | The ad-hoc wrapper was replaced by `buildLessonDraft` over the part result. |
| #24/#38 | zero-vector `norm_sum_squared`, `reverseU` claimType, NaN angle, `bao nhiêu`/side/Bo-quote parsing, session-less IDs, verified timeline links | Hold in the merged tree | Re-probed after integration; the regression tests from #38 pass. |
| New | `tool_verify_vector_algebra` accepted a vector-name claim on length alone (`BC = AB` reported valid) | Fixed | Without `|...|`, coordinates must match; regression test added. |
| New | Importing `openaiClient.js` threw without `OPENAI_API_KEY`, so tests needed a key | Fixed | The client is constructed lazily; `isLLMConfigured()` was added. |

## Validation (no paid API calls)

- `npm --prefix backend test`: 103/103 pass (24 suites), including the new `backend/test/roundtable-cross-check.test.js` and the extended SSE tests.
- `node tests/test_roundtable_orchestrator.js`: 22/22.
- `node backend/test-roundtable-stream.js`: 64/64. Its old assertion that the replay draft arrives with `approvedByTeacher: true` was replaced by draft semantics, and the malformed-payload case now expects 400.
- `node scripts/validate-fixtures.mjs`: 10/10. The replay fixture and committed drafts are now type-checked against `pipeline.ts`, and the long draft also passes the pacing rules.
- `npx tsc --noEmit` (root `lint`): no errors. `vite build`: succeeds.
- Tests write drafts to a temp `DRE_DRAFTS_DIR`, so runs no longer rewrite committed drafts. `node backend/src/scripts/regenerate-roundtable-artifacts.js` regenerates the drafts and the replay fixture.

## Concerns

- The live LLM path is covered only with an injected fake client; no real-model run was made (no paid calls).
- Part 1's trap ("chéo nhau → cùng phương") is mapped to MISC_VEC_001, whose KB entry is about equal length rather than skew lines. The KB has no matching entry, so grounding is honest about the ID but not the wording. It needs a KB entry or a different trap.
- The checkpoint question, options and cheat sheet stay authored per misconception (listed as `templatedFields`); only the dialogue is generated.
- `POST /api/roundtable/runs` (from #34) persists an arbitrary request body as a run; it is unauthenticated, as are the other routes.
- The Socratic draft pacing for clips under 60s cannot satisfy main's 60s part-opening rule, so short drafts are only type-validated.
