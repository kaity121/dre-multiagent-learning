# Cluster B (runtime) integration report

Branch: `integrate/b-runtime` (from `origin/main` d4dabb9). Not pushed. No GitHub comments made.

## Merges (`--no-ff`, in order)

1. PR #39 `feat/402-runtime-context-isolation-snapshot`: clean.
2. PR #42 `feat/30-subject-agnostic-runtime-dispatcher`: clean.
3. PR #40 `feat/403-evaluator-bloom-cognitive-metrics`: 8 conflicts. #40's `evaluator.js`, `evaluator.test.js`, `src/utils/evaluator.ts`, `lessonIndex.js` and the lesson index JSON are byte-identical to what #42 already carries. On every conflicted hunk, #40's side was an older copy that would have reverted fixes already on main: the minute-based classroom session id, the per-lesson session id in `VideoDebateSheet`, the parameterless health probe, persona tests 33 to 35, and the JSON error middleware. I kept HEAD (#39 + #42) for those hunks and took #40's `sessionId`/`sessionState`/`citations`/`contextSnapshot` response typing. Both features are present: the Bloom/evaluator endpoints and the context snapshot plus subject-agnostic dispatch.

## Reviews

PRs #39, #40 and #42 have no human reviews or inline review comments; only Vercel deploy bot comments. There were no reviewer blockers to fix.

## Issues found in self-review and fixed

- The #42 branch replaced `src/services/dreBackendApi.ts` with a stale copy. That dropped main's `sessionId` argument to `sendClassroomChat` and the `AgentCitation` import, which caused 2 tsc errors and lost the classroom session. It also re-added `streamRoundtable`/`dispatchRuntimeMessage`, which nothing uses and which have no backend route. I restored main's client and added the `grounding`/`math_calc` tool categories plus `isValid: null`.
- `openaiClient.js` threw at import when `OPENAI_API_KEY` was unset. That crashed the offline dispatcher and evaluator suites. The client is now created lazily, so a missing key fails at the call site and the existing heuristic fallback catches it.
- Context isolation: `getMockSessionState` called `getSession()`, which throws for unknown ids, so an unknown id on `/api/runtime/context-snapshot` returned a 500. Ids it did resolve could fall through to the shared `session_001` fixture memory, Bloom level and misconceptions. Unknown ids now get an empty state of their own.
- Subject-agnostic dispatch: the default `lessonTitle` "Toán 12" overrode an explicit non-math `videoId`, which forced vector routing. Snapshots for non-math lessons also merged SGK Toán citations, cube geometry and MISC_VEC_005 RAG into dispatcher `citations`. Both are fixed: `resolveLessonSubject` is shared by the server and the dispatcher and reads the subject from the lesson index, and non-math snapshots cite only the indexed video segment. The vector lesson path is unchanged: the 37:13 demo, 35 persona tests and the 36/36 benchmark all pass.
- `second = 0` jumped to 37:13 because of `|| 2233`; it is now honoured. Grounding tool errors in the dispatcher are logged instead of swallowed.
- I added `backend/test/context_snapshot_isolation.test.js` with 9 tests.

## Validation

- `backend npm test`: 52 pass, 0 fail, 3 skipped. The skipped tests are the clipExtractor live-clip tests, which need `scripts/fetch-demo-clip.sh`.
- `node tests/test_context_snapshot.js`: 8/8. `node tests/test_dispatcher.js`: 100% (36/36).
- Root `npm run lint` (tsc): clean. `npm run validate:fixtures`: all 5 fixtures pass.
- I made no paid API calls. The regenerated evidence JSON files were reverted, because only their timestamps changed.

## Overlap with the ingest cluster (#22/#23/#41)

#42 adds `backend/src/services/clipExtractor.js`, `backend/src/routes/extract.js`, `backend/test/clipExtractor.test.js`, `scripts/fetch-demo-clip.sh`, `backend/assets/clips/*.json` and `backend/src/data/lesson-index/VID_AI_INTRO_01.json`. #39 adds `backend/src/services/lessonIndex.js` and `VID_VECTO_12_TIEN.json`. I left all of these as the PRs wrote them, without edits. Expect add/add conflicts when the ingest cluster lands. Prefer the ingest versions there, but keep `getLessonIndex`/`getBoardStateAt` exported, because `contextSnapshot.js` depends on them.

## Open questions

- The frontend still sends neither `videoId` nor `lessonTitle` to `/api/chat/classroom`. Only the vector lesson exists in the UI today, so subject-agnostic dispatch is reachable only through the API until a second lesson is added there.
