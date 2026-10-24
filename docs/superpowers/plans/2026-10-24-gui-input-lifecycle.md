# GUI input and lifecycle regression fix plan

> **For agentic workers:** Execute the two scoped fixes below; the root agent integrates and validates once.

**Goal:** Keep provider configuration and project archive/history/trash/restore free of invalid validation and avoidable background read errors.

**Architecture:** Keep existing backend validation and lifecycle rejection boundaries. Correct the provider HTML pattern; scope component reads to their UI lifecycle with AbortController and preserve archived approval history. No dependency or layout changes.

**Tech Stack:** React class components, TypeScript, Node test runner, existing api AbortSignal support.

**Spec:** User-approved fixes from the 2026-10-24 diagnosis and supplied GUI evidence ZIP. Only the two confirmed defects; UX items 3–5 retain existing behavior.

## Constraints and acceptance

1. Provider IDs accept ASCII alphanumeric first characters and remaining alphanumeric/dot/underscore/hyphen up to 100 characters; reject blanks, Chinese, invalid first characters and excess length. Native Chrome validation has no invalid-pattern console error.
2. Opening archived project history emits no attachment-types request or misleading upload error; returning to editable state restores capability reads.
3. Permission/component reads are cancelled on unmount/session/state invalidation; stale or aborted responses cannot overwrite current state. Normal current-view failures still surface. Stop permission polling during project management changes before the server transitions.
4. Archived permission/actions history remains readable; archived controls remain disabled. Trash/restore retains history and backend 409/410 enforcement.
5. Preserve all unrelated in-flight work; stage only this patch, run relevant tests, one final full regression and clean build, independent Astra/xhigh review, commit/push current branch and verify remote SHA.

## Review focus

- Archive while a capability read is pending, then unarchive the same mounted session.
- A permission read/interval overlaps opening project management and trash/restore.
- Aborted requests settle after a session switch and cannot replace current error/history.
- Archived history still contains previously recorded actions.
- Real request failures remain visible and the read loop resumes when the view becomes active.

## Task 1 — provider validation (root)

Files: apps/web/src/model-management-view.tsx; tests/unit/settings-management-ui.test.mjs; focused browser regression under tests/e2e.

- [x] Add behavioral v-mode provider pattern regression and watch it fail on existing input.
- [x] Align HTML pattern with existing backend charset and first-character restriction.
- [x] Verify unit boundaries and real Chrome validity/console assertion.

## Task 2 — component read lifecycle (Sol/high)

Files: composer-controls.tsx, host-access-control.tsx, permission-actions.tsx, and minimal parent props in workbench.tsx/app.tsx if needed; related unit tests only.

- [x] Reproduce archived capability fetch, uncancelled child reads and management-transition polling with tests.
- [x] Reuse api(path, body, method, signal), AbortController and existing epoch guards. Preserve archived permission history. Suspend reads before management mutations and resume afterwards.
- [x] Run relevant red/green tests; root owns builds/full regression and browser flow.

## Delivery

- [x] Review actual scoped delta and generated assets; integrate without other in-flight changes.
- [x] Full regression, clean build and critical browser path, then one independent review.
- [x] Record outcomes and requested/runtime model status. Git delivery follows on the existing branch; record SHA and remote verification in the final delivery record.
