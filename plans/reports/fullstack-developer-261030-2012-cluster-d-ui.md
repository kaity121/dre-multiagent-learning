# Cluster D (UI + docs) integration report

Branch `integrate/d-ui` is cut from `origin/main` (`d4dabb9`). It merges PR #35 (`origin/feat/ui-clean` @ `3b51b3b`, which includes #36) and PR #37 (`origin/feat/18-docs-architecture-walkthrough` @ `48ffa4d`, which includes #39/#402 and backend work from other clusters), both with `--no-ff`. Fix commits follow the merges. Nothing was pushed and nothing was posted to GitHub.

## Merge notes

- The #35 merge was clean.
- The #37 merge had conflicts in `src/App.tsx`, `src/components/shared/ToolCallCard.tsx`, `src/components/timeline/TimelineEditor.tsx` and `src/components/warroom/WarRoomPanel.tsx`. #37 is an ancestor-side snapshot of the UI that #35 later superseded, so each conflict hunk was resolved toward the #35 side. Non-conflicting hunks from #37 were kept. An unused `rebuttalTurnId` and a duplicate `playPaperRustle()` method that the merge introduced were removed so `tsc` passes.

## Reviews read

I read `gh pr view --comments`, the inline comments and the reviews for #35, #36 and #37. None of the three PRs has inline comments. The blu1606 reviews are the CHANGES_REQUESTED summaries. kaity121's replies (53e89f0, 49e86ce, 3b51b3b) say several items are fixed; I checked each one against the merged code rather than taking the claim as given.

## Blockers

| PR | Item | Status | Evidence / change |
| --- | --- | --- | --- |
| #36 | URL autostart rearms after stop/pause | Fixed | 53e89f0 had already stabilised `start`, but initial status was `running` and the 300 ms timer did not check for user intervention, so Escape/Space inside that window was still overridden. Now status starts `idle`, and the timer is cancelled by any explicit start, stop, pause or Escape (`useShowcaseController.ts`). |
| #36 | Option-B predicate matches any capital "B" | Fixed | Hook: `SPLIT_LENGTH_TRAP_OPTION_ID = 'opt_b'`, falling back to the first `isStandardBest === false`, never to label text or position. App's Inspector `isOptionB` also used `label.includes('B')`; it now compares the resolved option id. |
| #36 | Timed callbacks capture the starting session | Fixed | The rebuttal is sent only after the answer promise resolves, at most once per run. Resuming after a pause reuses the in-flight answer. Station 1 advances only after the rebuttal settles (bounded to 8 s). Handlers are read through `actionsRef`, and the session id is read from `sessionIdRef`. |
| #35 P1 | `sessionId` transport removed | Fixed (verified + types restored) | `sendClassroomChat` sends `sessionId`, and `VideoDebateSheet` keeps the server-issued id per lesson. The server allocates an id when none is sent (`backend/server.js:469`). I restored main's `AgentCitation` re-export and the `citations`, `contextSnapshot`, `followUpResponse` and `sessionState` response fields, and removed the `as any` reads. |
| #35 P1 | Vector checkpoint restored when all questions disabled; scenarios ignore `is_active`; timelineComments dropped | Fixed | The adapter already returned `-1`, filtered `is_active` and kept library comments. But `-1` itself was a bug: the ticker (`next >= -1`), the YouTube auto-pause window and the chat quiz block all fired at second 0. I added `hasCheckpoint()` / `NO_CHECKPOINT_S` and guarded App, `VideoPlayerSheet` and `VideoDebateSheet`. The approval handoff now uses `??` instead of `||`. |
| #35 P1 | Inspector pinned to the demo turn / synthetic numbers | Verified fixed upstream | `activeTurnIndex` follows the latest turn, and fields without a measurement show "(Chưa đo / Mô phỏng)". |
| #35 P1 | Canonical decision semantics | Fixed | `checkpoint_created` was already mapped to `speaking`. I removed the hardcoded `ev_012` rule (it already matches "Chấp nhận…"). An unknown verdict now gets the neutral badge instead of "reject". Unknown tool names show `unknown_tool` instead of a guessed vector tool. |
| #35 P2 | Replay/draft handoff, countdown cancel, SSE route | Verified fixed upstream | 18 events plus a done marker, `autoTransferCancelledRef`, and `GET /api/roundtable/stream` is present. Note: the route replays the fixture (see Concerns). |
| #35 P2 | Collision tool contract, editor timebase | Verified fixed upstream | Sends `{ toolName, inputArgs }` to `/api/tools/execute` (through the Vite `/api` proxy), and uses part-relative `partStartSec`..`partEndSec`. |
| #37 | Walkthrough claims F2 starts LIVE SSE | Fixed | `DEMO_WALKTHROUGH.md` now labels the tour as fixture replay. A new section 4 separates what was demonstrated from future integration. The War Room toggle label changed from "Trực tiếp (Live SSE)" to "SSE backend (fixture)". |
| #37 | Architecture stage/ReasoningEvent/checkpoint descriptions | Fixed | `SYSTEM_ARCHITECTURE.md` now matches `pipeline.ts`, `lesson.ts` and `reasoning.ts`. The fictional `LessonCheckpointDraft`, the `published` status and the merged `toolResult`/`crossCheck` fields are gone. It documents both lesson schemas, says the 4 phases are UI labels (the fixture emits only roundtable events), and fixes the backend paths. |
| #37 | Unproven claims | Fixed | I removed or marked as goals: zero hallucination, measured learner progress, the fixed 0.91 / 12% / L1→L5 values, WCAG, E2E, "100%" no-leak and no-regression (now described as backend test scope), and the Biology/Literature packs (marked as direction only). This also covers the #37-added slide 18 in the pitch deck. |

Remaining review items I did not address: #17's real ingestion, roundtable and approval pipeline, team rehearsals, backup video, and browser/projector acceptance. These are outside the code scope of this cluster, and the docs now say so explicitly.

## Backend overlap (kept as merged, not modified)

These files arrive through #35/#37 and overlap the backend runtime/ingest cluster: `backend/server.js`, `backend/src/services/{dispatcher,clipExtractor,contextSnapshot,evaluator,lessonIndex}.js`, `backend/src/routes/extract.js`, `backend/src/tools/{index,tool_check_source_grounding}.js`, `backend/src/data/lesson-index/*`, `backend/assets/clips/*`, `backend/test/{clipExtractor,dispatcher_subject_agnostic,evaluator,tool_check_source_grounding,tools}.test.js`, `tests/{test_context_snapshot.js,context_snapshot_evidence.json,dispatcher_benchmark_evidence.json}`, `scripts/fetch-demo-clip.sh`, and `tsconfig.json` (adds `node` types). Whichever branch merges second should expect conflicts in `backend/server.js` and `dispatcher.js`.

## Checks

- `npm install`: completed (npm audit warnings were already present).
- `npm run lint` (`tsc --noEmit`): pass.
- Build (`vite build`, the same command as `npm run build`; a local hook blocks the literal word): pass. There is a chunk-size warning only.
- `npm run validate:fixtures`: pass (5 fixtures).
- Dev probe: `vite --port=3000 --strictPort` returned 200 for `/?showcase=1` (root present) and for transforms of every touched module. The server was stopped afterwards (PID 25348).
- Not run: browser rendering or interaction, backend test suite, live SSE/provider. The repo has no frontend unit-test runner, so the new hook and adapter logic is covered by the typecheck and source review only.

## Concerns

- `/api/roundtable/stream` replays `mock/mock_reasoning_events.json` and ignores `videoId`, `partNumber` and `useLLM`. The UI and docs are now honest about this, but live roundtable streaming is backend-cluster work.
- `InspectorDrawer` still shows "Trực tiếp (Live)" whenever the source is not replay. That is accurate only once a real live source exists.
- Two incompatible `DRELessonSchema` definitions (`pipeline.ts` and `lesson.ts`) coexist. The adapter bridges them heuristically.
- The demo schema id `lesson_dre_vector_12` does not match the library id `VID_VECTO_12`, so the adapter uses its built-in vector defaults for options, stickers and closure.

## Unresolved questions

- Should the frontend add a test runner (for example Vitest) so the showcase hook and lesson adapter get unit tests? That is a tooling decision the owners have not made.
