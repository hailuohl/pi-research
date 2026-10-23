# Local Runner Entry and Approval Preflight Implementation Plan

> **For agentic workers:** Use the existing project delegation rules: one Sol implementation session, then one independent Astra review after integration. Do not create additional agents or commit from a subtask.

**Goal:** Make the existing local Python scientific command executable and reject deterministically invalid new preparation requests before asking for approval.

**Architecture:** Share the approved-source entry check across preparation and both unstarted local supervisors. Reuse pure contract validation and read-only source manifests before creating a new permission approval; retain execution-time validation, immutable argv, authorization checks, and historical receipts.

**Tech Stack:** Existing TypeScript, Node 24.19.0, node:test, existing SQLite store; no new dependencies.

**Spec:** User-approved D1/D7 scope from `D:/项目/pi research/tmp/d1-d7-audit-20261023/RECHECK.md`. Other D1–D7 items are deferred to separate batches; frontend layout remains paused.

## Constraints and Acceptance

1. Preserve `[runtime,script,args]`; support only the already-used independent Python prefix flags `-I` and `-S`, keeping the exact argv and manifest digest. Node retains direct script entry. No arbitrary flag skipping or `-c`/`-m` support.
2. A new experiment's invalid contract and a new Run preparation's invalid source entry fail before the related approval, without creating a replacement intent or starting a process. Experiment creation may precede code integration and runtime configuration.
3. Keep exact parent-contract inheritance, all existing authorization/source checks, immutable approval bindings, and exactly-once successful operations. Do not normalize away a digest conflict.
4. Successful historical operation receipts remain readable after reopening or later source/runtime changes. Never restart, release, or reclassify a started/unknown job because of the new entry validation.
5. Provide a fixed actionable entry diagnostic without exposing arbitrary exceptions, executable paths, private argv or environment values. Retain old failure records and logs.

## Files and Ownership

- One implementer owns only local entry validation, both local supervisors, runner preparation, experiment contract selection, permission/operation preflight hooks, safe entry diagnostic, and their directly related tests.
- Likely files: `packages/runners/local-entry.ts`, `packages/runners/local-supervisor.ts`, `packages/runners/local-supervisor-v1.ts`, `packages/runners/service.ts`, `packages/workspace/experiments.ts`, `packages/policy/session-permissions.ts`, `packages/contracts/operations/registry.ts`, `packages/pi-adapter/tool-diagnostic.ts`, and focused tests under `tests/unit` / `tests/integration`.
- Main checkout remains untouched during implementation. The isolated current snapshot includes existing uncommitted source changes. Main agent integrates only this batch's delta and preserves all pre-existing edits.
- No change to helpers' process protocol, migrations, dependencies, scientific-method rules, frontend files, or archived skills is authorized.

## Review Focus

- Flags followed by a real approved script versus missing/unknown flag entries.
- Runtime ID aliases, Python versus Node identification, and unchanged script arguments.
- Approvals are not created for invalid new requests; real permissions are still enforced.
- Consumed/cached operations do not acquire a new dependency on current mutable files or runtime.
- Legacy unstarted work receives the same validation while started unknown work keeps its original recovery barriers.

## Task 1: Complete D1/D7 Local Preparation Flow

- [ ] Add focused regression tests and run them against the unchanged implementation; record expected product failures separately from harness failures.
- [ ] Implement a shared minimal local entry validator and pure effective-contract validation. Use `sourceManifest` where a preflight needs source metadata without publishing snapshots.
- [ ] Hook only genuinely new/unconsumed preparation effects before creating their approval. Retain actual preparation and submission rechecks. Do not dry-run a mutating preparation and roll it back.
- [ ] Use the shared entry check in both supervisors only before starting. Add fixed safe diagnostics for the known entry error.
- [ ] Run focused tests and typecheck/build in the isolated snapshot; report files, exact commands, pass/fail/skip and limitations.
- [ ] Main agent reviews and integrates the delta, checks a clean delivery snapshot, performs the applicable full regression once, and gets independent Astra/xhigh review of the frozen integrated snapshot.
- [ ] Main agent stages only completed batch changes, verifies private remote and pending history, commits to the existing working branch, pushes, and confirms the remote branch includes the commit.

## Execution Record

- Baseline: `d484f81aee44cf4270088668dcdfe981766408de`, existing working branch `implementation/pr01-reproducible-baseline`.
- Native worktree creation returned `Not a git repository` for the parent chat directory; a detached git worktree was created under the task's existing `tmp` directory instead. No branch or global setting was changed.
- Current source overlay: 998 files copied from whitelisted source/test/skill/config paths; 3364 input hashes recorded outside the repository. No live data, credentials or native conversations copied. Dependencies are a read-only-use junction to existing node_modules; build outputs are isolated.
- User authorized execution; no additional plan approval is required.
