# Pi Research v0.2.1 implementation and review plan

Goal: repair the supplied v0.2.0 audit findings without replacing the Pi-only architecture or weakening approvals.
Authority: original design files under docs; audit A01–A12; OpenResearch fixed reference 3037f727e80e0ab20c61a87c613a50dde009a835.
Execution: local isolated copy on fix/workflow-021; no remote writes, paid model calls, or user data changes.

## Constraints
- Keep stable business operation IDs separate from worker lease fencing.
- Never let a model self-approve missing outputs or override conflicting independent review.
- Required run artifacts must be immutable regular files before integrity=complete.
- Measured results freeze their experiment regardless of process exit; uncertain outcomes require explicit human judgment.
- Code integration is proposed, inspected, explicitly approved and applied to a new child, never silently shared.
- Preserve original design bytes. Dist and source must both be rebuilt and verified.

## Tasks and gates
1. Collaboration: tests/unit/audit-collaboration.test.mjs; event-level dependency validation, review aggregation, output contracts and explicit blocked states. RED then GREEN and full suite.
2. Run integrity: tests/unit/audit-integrity.test.mjs; bounded stable file collection, required artifact check, measurement-aware freeze, shared result verification in reports/observations. RED then GREEN.
3. Recovery: tests/unit/audit-recovery.test.mjs and IPC context regression; stable replay with ownership/fencing checks, host notification synchronization. RED then GREEN.
4. Implementation handoff: tests/unit/change-proposals.test.mjs; scoped artifact_read, coordinator private editing, immutable ChangeProposal, approved child-experiment creation and API/UI. No arbitrary host shell.
5. OpenResearch parity: fixed-source evidence covering answered-node freeze, fixed contract, sibling/descendant rounds, evidence inspection, delegation brief/output/read/review and wakeup reconciliation. Record remaining gaps rather than claim full parity.
6. Full build/typecheck/test, portable ZIP test, real numerical demo, allowed browser check; write explicit limitations and upgrade/revalidation command.

## Review focus
- Old v0.2 records must not silently acquire acceptance or lose provenance.
- Forged actor/expired lease can replay only own already-committed response, not new work.
- Multi-review conflicts and acceptance-stage cycles must not release downstream work.
- Filesystem and SQLite are not one transaction; integration staging must survive/reject failure safely.
- Context synchronization cannot convert task data into higher-priority model instructions.
