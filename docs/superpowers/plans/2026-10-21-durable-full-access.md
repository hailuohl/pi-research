# Durable Full Access Implementation Plan

> **For agentic workers:** Use the project delegation rules and test-first implementation. The user approved implementation in this chat; no repeated approval gate is required.

**Goal:** Deliver the five acceptance conditions in the companion spec as one local research flow.

**Architecture:** Extend existing automation, wakeups and supervised local runs. Persist task authority and progress independently from temporary process leases; preserve exact snapshots, revocation and accounting.

**Tech Stack:** Existing TypeScript, Node 24.19.0, SQLite store, Pi 0.87.1; no added dependencies.

**Spec:** `docs/superpowers/specs/2026-10-21-durable-full-access-design.md`

## Global constraints

- Include the current working-source baseline; do not overwrite or commit unrelated work.
- One implementation agent owns runtime changes; root owns integration, documentation and final checks.
- Frontend layout paused; only necessary existing control wiring/copy may change.
- All new authority requires explicit new scope; old approvals keep their original semantics.

## Steps

- [x] Record existing dirty baseline and run a relevant baseline after a clean isolated build: build exit 0; 49 focused tests passed, none failed or skipped (40.4 seconds).
- [x] Write failing tests for explicit unlimited accounting and persistent automation grant/expiry; implement nullable limits and all affected admission/schema/caller wiring.
- [x] Write failing local nonzero-exit/no-metrics diagnostic and candidate-source repair tests; implement independently validated diagnostics and new frozen repair attempts, retaining scientific evidence checks.
- [x] Write failing phase-continuation and crash/restart/pause/revoke tests; implement durable task control, checkpoint deduplication, current-owner fencing and supervised execution reconciliation.
- [x] Update existing control acknowledgements/API documentation without layout changes; preserve old grants.
- [x] Run affected tests while developing. Root integrates only task changes, does one full regression and clean build, then independent Astra xhigh review of the exact snapshot; repair only blockers.
- [x] Prepare the task-only delivery snapshot and complete regression/build/independent review. Root records commit SHA, branch and verified remote inclusion in the final external delivery receipt after committing and pushing.

## Review focus

- Crash after submission but before response must not consume twice or create a second Run.
- Revoked/archived or changed-source authority cannot resume through a new owner.
- Known failed/no-metrics diagnostics must not make invalid/tampered scientific outputs acceptable.
- Two controllers and duplicate completion notifications cannot dispatch duplicate actions.
- Unknown model/compute consumption stays visible, and total-unlimited does not bypass single-job timeout or concurrency.

## Evidence and ownership

Code base HEAD: `95c3e16e6b574bbbf1b16f77b6ee2bde9a38b72d` plus the captured working tree. Snapshot hashes and original copies are outside the repository in `D:/项目/pi research/tmp/full-access-baseline-20261021/`. Native worktree creation could not resolve the parent chat directory as Git; a detached Git worktree was created from the nested repository and overlaid with the allowed current code/test/skill files.

Requested implementation: GPT-6 Astra / xhigh. Requested read-only baseline dependency analysis: GPT-6.1 Sol / high. Calls accepted; runtime model/effort metadata not echoed. No main-session model or global configuration changed.

Baseline dependency ruling: HEAD already contains automation, continuation, source revision and wakeup APIs. Uncommitted research-handoff/scientific-planning work is not a required prerequisite. Extract only this task's delta into `D:/项目/pi research/tmp/full-access-delivery-20261021/` based on clean HEAD, resolve context without importing unrelated changes, and anchor final full regression/build/review to that exact deliverable tree. Merge task changes back into the original working tree without discarding its other changes.

The remote `hailuohl/pi-research` was verified private through both connector metadata and `gh repo view`; current working branch and origin are retained. Initial index was empty and HEAD matched upstream.

Implementation evidence: 32 affected checks, 6 real local lifecycle/repair checks and 25 policy/UI/archive checks passed with no failures or skips in their recorded final runs. The earlier 62-test aggregate had three failures subsequently corrected; it is not reported as an all-green run. Final delivery-tree regression and review remain separate gates.

Compatibility ruling: keep original helper bytes and v1 supervisor semantics; new manifests bind independently versioned v2 helper and Windows launcher digests. A detached Node launcher is necessary on this Windows/libuv runtime to keep the native helper alive after the controlling supervisor exits; it adds no grant, retry or database ownership.

HEAD integration ruling: the dirty baseline's `DevelopmentService.assertDiagnostic` belongs to an unfinished development missing-output feature. Do not import that subsystem. In the self-contained delivery tree, development results still require their existing complete integrity; the new safe incomplete-result exception applies only to the verified local Run diagnostic implemented in this batch. The required local failure → successful development test → repaired Run flow is preserved, and incomplete/unknown development remains blocked.
