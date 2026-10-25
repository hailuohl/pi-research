# Workspace fixed research input implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development with one implementer for this coherent batch. The primary agent owns rulings, integration, full validation, independent review and commit/push.

**Goal:** Fix a configured-size project text snapshot and freeze it as a research input after actual bounded SDK delivery.

**Architecture:** Stream the mutable project source through existing safe-path rules and the paired text publication builder. Publish immutable bindings and a separate selection, then reuse batch 2B artifact pages/ACK and existing brief/method reference plumbing. Legacy readers and history remain unchanged.

**Tech Stack:** Existing Node.js/TypeScript, filesystem, SQLite and pinned Pi SDK; no dependency.

**Spec:** `docs/superpowers/specs/2026-10-26-large-files-batch2c.md`.

## Scope and ownership

- Delivery worktree only: `D:/项目/pi research/.worktrees/large-file-512mib-20261025`; baseline `90aab4ff63f6659350cb35bed216d588d5b30b26`.
- Root owns this plan/spec and acceptance notes. One new Astra/high implementer owns the necessary source/test/API docs, never commits/pushes or starts other agents.
- Expected source boundaries: focused workspace snapshot/binding service under `packages/research-workflows/`; `source-inputs.ts` discriminator/collect/verify/fingerprint/preview; `research-app.ts`; operation inputs/outputs/Registry; tool definitions/role/session permissions; minimum shared streamed builder support for empty snapshots and current preparation deadline/worker dispatch. Reuse `artifact_text_read` ACK without rewriting its transport.
- Keep storage publication helpers/maintenance unchanged unless a demonstrated compatibility requirement needs a minimal fix; report that evidence to root. Do not copy large raw fixtures/logs into Git.

## Implementation steps (one flow, one final review)

- [x] Read spec and existing `attachment-inputs.ts`, `source-inputs.ts`, `draft-reads.ts`, workspace safe/stable readers, combined publication, 2B Registry preparation/cache and artifact ACK callers. Record only remaining necessary rulings; root already selected explicit snapshot semantics and separate draft batch.
- [x] Add failure-exposing tests for >2 MiB source capture, UTF-8 byte policy, unstable mutable file and publication cancellation/conflict; old live InputRead behavior and snapshot-after-live-edit must differ explicitly. Keep RED logs outside the repo.
- [x] Implement bounded stable acquisition and paired durable publication. Publish normal project artifact/index/textSource plus immutable workspace binding and separate selection under current authority. Cache replay validates the fixed result without reselecting or substituting the mutable current path. Apply 120/140-second preparation budgets deliberately, not generic external-effect pending/replay semantics.
- [x] Wire the explicit input discriminator, actual delivered coverage, clarifying/ready rules and matching prepare/save fingerprint. Reuse old representations when no new branch exists. Add focused success, missing/gapped/foreign/late ACK, reprepare, same-key retry, read-only, permission loss and reopen/history tests. Empty whole-text requires delivered EOF; empty dataset-reference cannot satisfy an inspected-page requirement.
- [x] Integrate role/schema/tool catalog and real service output fixtures, including the exact catalog count; do not omit the existing contract tests. Add concise API docs showing snapshot versus current live file and both purposes. Preserve bounded literature/protocol parsing and the verified-reference non-literature path.
- [x] Run related checks, including operation-schema/output suites. Extend a pinned SDK/local-provider fixture for actual prepare -> page -> ACK -> brief save -> reopen, including confirm approval and normal retry. Provide a root-only 512 MiB capacity entry with 192 MiB heap, bounded memory/body and no complete source buffering. Default fixture stays small.
- [x] Freeze source/tests/generated files; hand root exact file hashes, commands/results, original failures and unresolved blockers. Root runs one full regression, clean build, capacity and independent Astra/xhigh review; necessary fixes recheck affected paths only. Root stages exact accepted files, commits/pushes existing `implementation/pr01-reproducible-baseline`, verifies remote containment and records delivery.

## Verification focus

Use the spec's same five acceptance conditions. Pay particular attention to durable ownership after the source links but before ready, clone/foreign receipts, old fingerprint compatibility, clearing incomplete new selections during clarifying, post-save/provider-failure retry and immutable old input revisions. Do not claim external provider/Docker/browser/benchmarks from offline fixtures.
