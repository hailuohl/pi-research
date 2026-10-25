# Batch 2A: delivered attachment text to fixed research input

This is a bounded part of the already-approved 512 MiB workflow. The benchmark chat explicitly finished and delivered at `55187dc6d5a1c1c2fba9767b7ccf31fbbc58ffac`; the isolated worktree was fast-forwarded to that commit. The main checkout still contains other uncommitted work and is read-only context, not material to stage wholesale. Do not message the benchmark chat.

## One user flow

An owner streams a supported text/data original through batch 1, attaches its document ID to a normal root conversation, and the coordinator reads that exact attachment in bounded pages. Successful SDK delivery is acknowledged against the exact result. A new research brief may freeze the source with explicit whole-text or dataset-reference semantics. Reopening preserves the same source and history.

## Acceptance

1. Streamed text/data attachments up to the configured default 512 MiB are bindable/readable by the existing authorized coordinator scope. Native media/provider caps are separate. New byte pagination is explicitly versioned; legacy UTF-16 requests retain their meaning.
2. Each page uses bounded source/index I/O, returns exact original Unicode bytes and fixed digest/range metadata, and rechecks attachment/project/session authority. Wrong source, replacement, corruption, queue removal, stale generation and revoked authority fail.
3. New page receipts start pending; only a successful matching SDK result digest/call/session/generation confirmation marks delivered. Failed, truncated, transformed, late or stale results cannot count. EOF is not evidence of prior coverage. Cached requests do not manufacture new reading facts.
4. New whole-text sources require complete delivered coverage before freeze. A dataset reference is explicit, requires actual delivered inspection and full host SHA-256 verification, and never claims model whole-text reading. Both modes preserve original document/artifact identity and enter the brief/approval fingerprint; legacy sources are never silently reclassified.
5. Freeze and validation use bounded verification/reference storage instead of reloading/copying the full dataset. Methods consume source metadata lazily; only inputs actually needing an existing bounded structured parser load those bytes. Cross-project denial, stale-source rejection, reopen, backup/restore and old records remain correct.

## Implementation boundaries

- Reuse batch-1 fixed text/CAS/index/integrity helpers. Extract a host-only fixed-source descriptor/range adapter if needed; never bypass the existing attachment authorization by opening a user pathname or changing owner-only document APIs into generally authorized agent APIs.
- Extend `session_attachment_read` with an explicit new protocol/source digest and purpose selection. Preserve old defaults/BOM/cursor semantics. Keep results structured and below the page budget. Do not truncate the final JSON string.
- Reuse the working main checkout's already-written result-delivery algorithm as read-only reference where applicable; port only this batch's required generic delivery mechanics into the committed baseline. Do not copy unrelated compact-review/scientific changes, modify the main checkout or stage its uncommitted patches.
- Introduce as little new state as required: fixed-source page receipt/delivery identity and an immutable binding used by source-input freezing. Reading coverage is based on actual returned and acknowledged ranges, not claims from the model. New records are project-owned and compatible with existing maintenance.
- Keep `workspace_read`, generic `artifact_read` and existing draft/reviewer legacy protocols compatible. Their remaining large-file migration is batch 2B; this batch does not claim those limits are removed.
- No new dependency, frontend layout changes, global configuration changes, service restart, provider re-evaluation or changes to benchmark artifacts. One implementer owns this coupled flow; root owns integration, final validation, independent Astra review and commit/push.

## Expected files

Existing attachment definitions/contracts, `packages/pi-adapter/attachments.ts`, document fixed-source adapter, source-input/brief/method-contract services and schemas, `packages/contracts/operations/registry.ts`, worker/host SDK result ACK, narrowly necessary policy classifications, and focused new unit/integration/HTTP/IPC tests. Any wider effect or unavoidable new operation requires a root scope ruling first. Reuse existing caller/test patterns; do not weaken old assertions.

## Validation and delivery

Failing-before-fix tests for a real >32 MiB attached source, exact Unicode/boundary pages, altered/failed ACK, missing middle coverage, explicit partial dataset freeze, changed source and reopen. Parent capacity checks include a 512 MiB dataset reference without whole-file buffering or whole-text model delivery. Run related checks during development, then one integrated full regression/clean build and independent Astra/xhigh review, reusing unchanged batch-1 evidence where still applicable. Commit/push only accepted batch files on the existing private branch.
