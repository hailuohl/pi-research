# Approved, unsubmitted RunIntent withdrawal

## Intent and boundaries

The user requested the remaining D4 repair. Provide a visible, USER-only way to withdraw one ordinary manual approval before Run submission. Reuse approval status stale and the existing operation receipt system. Do not delete or rewrite the intent/manifest, cancel a Run, revoke a group grant, add a new RunIntent state, or change generic approvals.stale.

## Acceptance

1. The current active coordinator dialogue can withdraw exactly its own prepared intent with an approved ordinary approval. Require exact intent ID/version, approval ID/version and manifest digest; atomically mark only that approval stale and record an audit event. No source/runtime availability check is required to remove authority.
2. Submitted intents or any existing Run cannot be withdrawn. Withdrawal versus RunSubmit shares the existing SQLite writer transaction: withdrawal first prevents submission; submission first preserves its Run and rejects withdrawal. No sibling approval/grant, queue reservation or historical Run changes.
3. Deny pending/rejected/stale approvals, wrong project/dialogue/bindings/versions/digests, archived/deleted/task/non-coordinator contexts, and all RunGrant/workingGrant/fullAccess/automatic-derived authority, in the service and API. Existing grant revocation and Run cancellation remain separate controls.
4. Same idempotency key replays the original receipt without duplicate events or writes, including response loss and reopen. A new stale-version request conflicts. Retain the original approval decision timestamp, intent version, manifest bytes and previous Runs across reopen.
5. The card exposes a clearly labeled withdrawal action only for the eligible exact approved intent, including a locally queued continuation whose Run is not yet submitted. Captured/deferred callbacks recheck the same context and version; no message or Run is created. Successful withdrawal removes submit/withdraw actions after refresh. Pending rejection and valid confirmation/retry still work.

## Minimal design

- Add one USER-only, session-required, key-required operation run_intent_withdraw, with closed input {intentId,expectedVersion,approvalId,expectedApprovalVersion,manifestDigest} and a small receipt {intentId,approvalId,manifestDigest,approvalStatus:'stale',approvalVersion}.
- Implement a narrow RunService method using userOnly/scope/assertProjectWritable and the existing transaction. Verify direct rootSessionId ownership, active non-task coordinator, prepared && !runId, matching ordinary approved approval subjectKind/scope/digest/versions. Update only the exact approval and append one safe audit event. Do not expose approvals.stale(subjectId).
- Wire existing operation schemas, registry and USER catalog/example as required by existing conventions; agent authorization must reject this operation, including raw dispatcher invocation. No migration, new grant, dependency or status.
- Add one component-owned withdrawal handler beside existing rejection/continuation. Capture exact tuples, use the existing in-flight exclusion, and send a stable bounded idempotency key. Do not depend only on React busy state, or loosen existing metadata guards. Keep the action visible for an eligible queued-but-unsubmitted intent; server transaction remains authoritative.

## Delivery and validation

Use meaningful RED tests, then service/operation/HTTP or CLI checks, two-connection/process submission-race evidence, response-loss/reopen tests and existing UI boundary/retry checks. Synthetic fixtures only, no live worker/model/daemon. Root integrates exact hunks into dirty main and clean delivery, runs browser key paths, clean build and fresh full regression, then independent Astra/xhigh review. Commit/push exact batch files only after acceptance; record actual statuses, hashes and runtime model metadata limits. D3 is a separate batch and must not mutate shared files during this implementation.
