# Repair baseline and isolated adoption experiment

**Goal:** Fix F21–F25 in the supplied v0.2.1, freeze v0.2.2, then derive a separate v0.3.0-experimental for a measured literature-evidence enhancement.
**Architecture:** Pi remains the only agent kernel. SQLite and the existing services remain authoritative. Read-only evidence processing cannot authorize runs or validate scientific claims.
**Spec:** docs/specs (unaltered original design files); the user's further audit F21–F25, B01–B07.
**Execution:** Implement inline in a new local Git repository; no external push or change to the original ZIP.

## Global constraints
- Keep every input archive untouched; preserve a complete fixed-only source/dist/test ZIP before adding any enhancement.
- New side effects require current project/plan authorization. Historic artifacts, completed operations and reports are not erased.
- Authorization checks must execute inside the same SQLite write transaction as the protected state change.
- A historical accepted result is not necessarily a currently usable result.
- Do not install another agent framework or claim live Pi/Docker/research verification from fixtures.

## Review focus
Paused retry vs explicit resume; stale approval vs fresh leases; archive vs queued/submitting work; reviewer invalidation vs claims and change proposals; no runnable task vs active status. Cover service and API boundaries, negative and positive controls, restart and historical preservation.

## Task 1 — lifecycle repair
Files: packages/policy/lifecycle.ts, packages/collaboration/team-service.ts, packages/workspace/projects.ts, packages/runners/service.ts, apps/runner-supervisor/index.ts; tests/unit/lifecycle-regressions.test.mjs.
- [x] Write failing tests for B02/B05 (retry preserves pause; stale plan never dispatches) and B03 (archive blocks prepare/submit/launch).
- [x] Run `node --test tests/unit/lifecycle-regressions.test.mjs`, save red evidence.
- [x] Add `assertProjectWritable(store, projectId)`, repeat plan authorization at activation/resume/claim; retry only reopens partial work when not explicitly paused.
- [x] Make archive and submission atomic; revoke outstanding approvals, keep history, cancel queued messages and prevent supervisor launch for archived projects.
- [x] Rebuild and run full suite; commit verified changes.

## Task 2 — semantic validity repair
Files: packages/evidence/acceptance.ts, packages/evidence/service.ts, packages/domain/types.ts, packages/publications/reports.ts, packages/workspace/change-proposals.ts, packages/collaboration/team-service.ts.
- [x] Write B06/B07 failures including downstream and cross-team evidence dependencies; assert historical report bytes remain unchanged.
- [x] Bind task-backed claims and proposals to immutable acceptance snapshots with result, input and review provenance.
- [x] Propagate revise across dependent results AND reviewer-to-target acceptance. Expire relevant bindings, not historical files.
- [x] Check bindings at report creation, proposal application and new Run preparation; reject unverifiable legacy task-backed claims until explicit renewed acceptance.
- [x] Rebuild, full suite, positive controls for unrelated task revisions and user-only artifacts; commit.

## Task 3 — stalled review repair and freeze
- [x] Write B01 failure; add structured paused reason and one persistent non-model notification when no task can advance.
- [x] Reviewer retry retains pause until explicit resume; manual resolution remains available without faking reviewer success.
- [x] Validate HTTP flows, whole suite and portable dist; record commands, limits and source hashes.
- [x] Release fixed-only v0.2.2 and tag it; derive a distinct experimental copy/branch.

## Task 4 — selective adoption experiment
- [x] Recheck official PaperQA low-level evidence retrieval and Aviary environment-style evaluation sources with pinned provenance.
- [x] Implement ONLY an opt-in local text evidence retrieval workflow: authorized immutable sources, bounded chunking, lexical retrieval and diversification, source offsets, explicit insufficient-coverage state; no hidden LLM/provider call.
- [x] Expose the same service through user API, Pi tools and UI; do not change default execution authority or install a second runtime.
- [x] Clearly distinguish method-level reimplementation from actual PaperQA package integration; preserve licensing/attribution if code is adapted.
- [x] Test authorization, source typing, invalidation, restart and no-match cases. Compare on shared deterministic tasks, not claims of model intelligence.
- [x] Release enhanced ZIP, fixed→enhanced patch, machine-readable comparison and unchanged-fixed manifest.
