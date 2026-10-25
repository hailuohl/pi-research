# 512 MiB files implementation plan

> **For agentic workers:** Use subagent-driven-development for one implementation batch at a time. The primary agent owns integration, full validation, independent review, commits and pushes.

**Goal:** Deliver the approved configurable 512 MiB original-file workflow without losing authorization, exact evidence or historical compatibility.

**Architecture:** Stream originals into the existing content-addressed store, validate before publication, and read bounded ranges from fixed sources. Keep provider limits separate. Integrate the shared reader through the existing operations and delivery ACK, preserving exact source and cursor semantics.

**Tech Stack:** Existing Node.js/TypeScript, filesystem, SQLite, HTTP and pinned Pi SDK; no new dependency.

**Spec:** `docs/superpowers/specs/2026-10-25-large-files-design.md` (approved chat scope).

## Global constraints

- Default single ordinary text/data original: 512 * 1024 * 1024 bytes; deployment configuration is validated and shared by accepting paths.
- Existing project/task/permission/source checks and original SHA-256 evidence remain authoritative.
- Work only in the isolated worktree; do not modify or commit the primary checkout's in-flight changes.
- Commit and push each accepted batch to `origin/implementation/pr01-reproducible-baseline`; no force push, history rewrite or unrelated staging.
- Agent model/effort is explicitly requested; mark runtime configuration unverified if not echoed. One implementer; independent Astra xhigh review for integrity/retention changes.

## Review focus

- Interrupted upload and duplicate/idempotent retry must not publish partial originals or lose the existing document.
- UTF-8/UTF-16 boundaries, a single line larger than a page, and BOM must not drop, repeat or normalize original content.
- Same-size overwrite/replacement, corrupt index and cross-project reference must fail without converting metadata into an integrity proof.
- SDK delivery truncation or missing ACK must not promote a partial read to complete coverage.
- Old readers and restore/backup paths must preserve historical semantics and fixed references.

## Batch 1: import -> bounded fixed-source page -> reopen

Files: add focused policy and streamed fixed-text storage modules under `packages/storage/`; extend `packages/documents/service.ts`; add an HTTP route module and narrowly integrate `apps/server/http.ts`; add unit/integration/capacity tests and concise API documentation. Avoid unrelated schema/registry/worker changes in this batch.

Interfaces: ordinary owner document acquisition remains the existing `DocumentVersion` and artifact IDs. Add a streaming owner acquisition API, returning the same immutable document descriptor; add a fixed-digest paged text response with explicit byte or UTF-16 cursor unit, source digest, actual end and complete flag. New routes must authenticate/lifecycle-check using existing owner/project guards. Configuration must report its actual byte limit. The implementer may settle internal helper names after reading existing conventions, without broadening scope.

- [x] Add tests that fail on existing 32 MiB/full-buffer behavior, invalid UTF-8, cross-project read, interrupted stream and configured exceedance.
- [x] Implement the policy, streamed temporary-to-CAS publication, full SHA-256/encoding validation and trustworthy range index. Publish only completed validated sources.
- [x] Implement document streaming acquisition and paged read transport. Keep existing small JSON operations compatible and media/provider policies explicit.
- [x] Validate page I/O/memory, exact content, digest/cursor and reopen; run 100/300/512 MiB cases plus over-limit. Keep large raw fixtures outside version control.
- [x] Primary validation and independent Astra review; fix the unowned-CAS blocker and rerun affected storage/maintenance/capacity/clean-build checks. See `docs/acceptance/large-files-batch1/RESULT.md` for actual counts and snapshot scope.

The primary agent records this batch's commit/push SHA and verified remote branch in the delivery message. Subsequent batches wait for the user's other chat “运行 ResearchClawBench 评测” to finish, as explicitly requested; do not message that chat or alter its in-flight core code.

## Batch 2: controlled reading -> fixed inputs

- [ ] Add regression tests for creation character/byte mismatch, workspace page coverage, large artifact exact quotes and failed delivery.
- [ ] Replace whole-string reader contracts with source/range contracts where required; extend existing exact SDK ACK to relevant read receipts.
- [ ] Integrate workspace, attachment, artifact, draft and source-input consumers; retain old cursor semantics and bind new records to fixed source/version.
- [ ] Validate one complete input-freeze flow including partial reads, revocation and reopen. Apply the common integration/review/commit/push gate.

## Batch 3: fixed input -> run -> archive -> review

- [ ] Add failure-exposing tests for the 16/32/64 MiB downstream gates and large output handling.
- [ ] Stream snapshot/data copy and artifact collection with existing validation/redaction, and retain exact data/source manifests.
- [ ] Route fixed run/review reads through bounded sources, retaining actual source/quote coverage and existing reviewer separation.
- [ ] Validate the authorized dataset execution/archive/review workflow; apply the common integration/review/commit/push gate.

## Batch 4: documents/search and model budget

- [ ] Add tests for bounded multi-batch document/index processing and intact structured responses under a small context budget.
- [ ] Make parsing/indexing bounded and resumable with explicit complete/partial state; retain configured CPU/memory/time/provider limits.
- [ ] Bound text delivery before receipt generation, preserving complete metadata and full artifact references; reuse Pi truncation functions only where exact-range semantics permit.
- [ ] Validate the complete document-to-evidence and long-conversation recovery paths; apply the common integration/review/commit/push gate.

## Verification record

Commands, actual results, snapshot SHA/diff hashes and model/effort request status are recorded in each batch acceptance note. Existing checks are reused unless later changes invalidate them. No live provider or Docker result is claimed from offline fixtures.
