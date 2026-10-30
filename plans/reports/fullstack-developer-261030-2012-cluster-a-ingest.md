# Cluster A (ingest) integration report

Branch `integrate/a-ingest`, created from `origin/main` (d4dabb9). It is local only and has not been pushed.

## Merges (`--no-ff`, in order)

| PR | Head | Result |
|----|------|--------|
| #22 pre-indexed lesson loader | 518a948 | One conflict in `backend/package.json` (the two `scripts` entries were in a different order). I kept main's order. |
| #23 live clip extractor | 04018cd | Clean |
| #41 subject-agnostic vision prompt | 8be8f04 | Clean |

`git fetch` was blocked in this sandbox. I checked `gh pr list` instead, and the local `origin/*` refs match all three PR heads.

## Reviewer blockers

| Blocker | Status | Fix |
|---------|--------|-----|
| #22: at second 2233 the board formula equates vector BC' with the scalar sqrt(2) | Fixed | The authored source is `mock/mock_cognitive_stream_vecto12.json`. I split the formula into a vector equality, `\vec{BC} + \vec{DD'} = \vec{BC} + \vec{CC'} = \vec{BC'}`, and a separate norm equality, `\|\vec{BC} + \vec{DD'}\| = \|\vec{BC'}\| = ... = \sqrt{2}`. I then regenerated the index with `scripts/build-lesson-index.ts`; apart from that formula, the output is byte-identical. |
| #22: the only math-data check was that DD' appears | Fixed | `backend/test/lessonIndex.test.js` now rejects any board equation that mixes vector and scalar sides. It runs on the index, the authored mock and the clip fallback fixture. It also checks the shape of Example 3 and that the 1 + 1 = 2 fallacy stays labelled SAI. |
| #23: `resolveClip` accepts directories; hashing and setup sit outside the try; Express 4 async rejections are not caught | Fixed | `resolveClip` now accepts only regular `.mp4` files and rejects names that are not strings. Routes go through `asyncRoute` to a router error handler that returns 400, 404 or 500 as JSON, or an SSE `error` event once the stream is open. The route validates the request and reads the sidecar before the SSE stream opens. Hashing, the cache read and creating the work folder now happen inside the fallback path. |
| #23: `Promise.all` + `finally` clean up while the other branch is still running | Fixed | A shared AbortController, wired into ffmpeg `execFile` and the OpenAI requests, cancels the other branch on the first failure. `settleAll` uses `allSettled`, so every branch settles before the terminal error, the fallback and the cleanup. No new stage starts after cancellation. |
| #41 | No reviews posted | My own review found contract drift. The extractor emits `shapeType: 'diagram'` and `diagramDescription`, which were missing from `src/types/pipeline.ts`; I added both as optional fields. A non-numeric `roi.xFrom` or a non-string `subject` from a sidecar was not guarded; it now is. The demo-clip live test now passes the sidecar's ROI, because #41 changed the default ROI to full frame. |

Other hardening: if the cache write fails, the live result is still returned.

## Tests

- `backend npm test`: 46 tests, 43 pass, 0 fail. Three demo-clip tests skip because the MP4 is not committed.
- New injected-media tests run without ffmpeg or the MP4. They cover the full run, an asymmetric failure (the work folder still exists while the slow branch runs), abort propagation, one failing keyframe read, ROI selection and a setup failure.
- New `backend/test/extractRoute.test.js` covers `{"clip":"."}` returning 404, a bad `clip` field returning 400, and a handler failure returning a controlled 500; it confirms the server keeps serving after each. It also checks that the SSE route validates before streaming.
- Mutation check: putting `Promise.all` back makes the asymmetric-failure test fail.
- Root `tsc --noEmit` (`npm run lint`) passes, and `npm run validate:fixtures` reports all 6 fixtures OK.

## Concerns

- I have not verified real ffmpeg, Whisper or vision runs, or the live SSE stream end to end; no MP4 or API key was used.
- Errors raised outside a named stage (setup, a corrupt cache) are still reported under stage `fuse`, which was the existing behaviour.
