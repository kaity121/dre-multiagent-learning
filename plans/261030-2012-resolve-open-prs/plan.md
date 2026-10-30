# Resolve open PRs into one testable integration branch

Status: done (2026-10-30) — landed via integration PR

## Outcome
One local branch `integrate/all` based on `origin/main` that contains every open PR (except #2, a test-only PR), with reviewer blockers fixed, conflicts resolved, backend tests, `npm run lint` and `npm run build` passing. Nothing is pushed or merged on GitHub without user approval.

## Clusters (ancestry-derived)
| Cluster | PRs (merge order) | Branch |
|---|---|---|
| A ingest | #22 -> #23 -> #41 | integrate/a-ingest |
| B runtime | #39 -> #42, #40 | integrate/b-runtime |
| C tools/roundtable | #38, #32 -> #34 | integrate/c-roundtable |
| D UI/docs | #36 -> #35 -> #37 | integrate/d-ui |
| Final | A, B, C, D | integrate/all |

## Acceptance criteria
- Each review blocker (CHANGES_REQUESTED / P1 / P2 comments) is fixed or explicitly reported as not fixable with reason.
- `cd backend && npm test`, root `npm run lint`, `npm run build`, `npm run validate:fixtures` pass on integrate/all.
- Reports in `plans/reports/`.
