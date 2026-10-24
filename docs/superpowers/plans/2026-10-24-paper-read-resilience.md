# Paper reading resilience implementation plan

> **For agentic workers:** Use the assigned implementation agent for this single batch; the primary agent owns integration, verification and Git delivery.

**Goal:** Show safe, specific literature failures and allow a complete paper read up to 60 seconds while retaining exact source quotations.

**Architecture:** Keep the existing connector service, transport and static diagnostic allowlist. Share one 60,000 ms paper budget between the outer operation and transport; give the actual Agent Worker that budget plus 20,000 ms for delivery. Preserve existing defaults for other operations and avoid retries.

**Tech stack:** TypeScript, Node.js 24.19.0, node:test.

**Spec:** User-approved follow-up to the 2026-10-24 diagnosis: complete error hints, extend and unify paper timeouts, retain exact quotation validation, verify, commit and push.

## Constraints and acceptance

1. An HTTP 200 response whose body completes after the previous 12/18 second limits succeeds within the 60 second paper budget, publishing only complete text. The actual Agent Worker must not abandon that operation at its former 30 second RPC deadline.
2. The total paper deadline includes queueing and all provider requests. Expiry cannot publish a partial paper or artifacts.
3. Caller cancellation, revocation, fixed hosts and response-size limits remain effective; other connector operation budgets stay unchanged.
4. Expected paper/connector failures retain their error code and a fixed recovery hint without echoing raw messages, credentials, URLs or private source text.
5. Exact quotation, ambiguity, offsets, BOM, pagination and saved-history checks retain their existing behavior.

## Task: repair and verify one paper-reading flow

Files: `packages/connectors/{service,transport}.ts`, `packages/pi-adapter/tool-diagnostic.ts`, `apps/agent-worker/index.ts`, focused connector/worker regression tests, and corresponding distribution files.

- [x] Add behavioral regression tests; run them against the original implementation and retain the expected failure evidence.
- [x] Apply the smallest compatible fix without touching evidence registration or dependencies; pass the focused connector, operation and quotation checks.
- [x] Integrate only owned files, run the full regression and a clean reproducible build in the isolated source snapshot, then obtain one independent review of the same snapshot; recheck the necessary Worker repair separately.
- [x] Inspect the staged changes and pending history for unrelated/private data. Git delivery uses the existing branch of the verified private repository; the final delivery record contains its confirmed commit identity.

## Isolation and delegation

Baseline: `705d7867cac8b972361ac0a0f482bc694aaf28a6`. The implementation snapshot is an archive of this commit; it excludes the primary checkout's unrelated pending changes and local runtime data. Only owned files are copied back after hashes and differences are checked. No production service restart is part of this batch.

The additional Worker RPC deadline was found during final caller inspection. Its necessary repair uses a second isolated snapshot while the first snapshot finishes the full regression; only affected checks and a fresh clean build need repeating, since unrelated tool deadlines and public contracts do not change.

Implementation requests GPT-6.1 Sol / high. Independent review requests a fresh session at the project-required model/effort. The spawn interface accepts these parameters but does not echo resolved runtime model/effort; record them as requested, not independently verified.

## Verification result

- Full regression after the initial integration: `npm run build` then `npm run test:core`, 2,513 passed, 25 skipped, zero failed or cancelled (2,538 total). This was run against the clean commit baseline plus this batch, not the checkout's unrelated pending changes.
- After the necessary Worker repair: 19 affected connector/Worker/IPC checks passed in the final candidate; 17 key checks passed against the primary checkout with its existing Worker changes preserved. The primary checkout also passed server TypeScript compilation. Unaffected full-regression results remain applicable.
- Existing focused connector/operation diagnostics: 48 passed. Exact quote, schema, BOM/pagination, historical approval and coordinator quotation checks: 5 passed. Evidence registration code was not changed.
- Final clean verification: fresh `npm ci`, build and typecheck all exited zero; all 755 distribution files matched. No dependency or lockfile changes.
- One independent Sol/high session reviewed the integrated candidate, then rechecked only the necessary Worker delta; no code blockers remain. Worker source and generated-file staging excludes existing process/review/recovery changes. Actual index hashes were recorded separately from snapshot hashes where Git normalized CRLF to LF.
- Expected failures were observed before repair at the old 12-second, 18-second and 30-second limits and for missing safe error hints. RPC timing is virtual; the production Worker, pinned Pi SDK, IPC and loopback HTTP are real.

Machine logs remain in the two original isolated verification directories. No external paper-provider request was replayed and no existing production service was restarted. Current paper-provider paths use one HTTP request; future multi-request total-budget behavior is supported by the same outer signal and was reviewed statically rather than exercised by an invented provider path.
