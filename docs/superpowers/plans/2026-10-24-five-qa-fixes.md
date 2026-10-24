# Five browser QA fixes

> Execute only these five fixes. Main agent integrates and delivers; implementation agents do not commit, push, create agents, or start services.

Goal: repair UI-01 through UI-05 from the 2026-10-24 browser QA report without changing the frontend layout.

Spec: `D:/项目/pi research/tmp/browser-human-qa-evidence-20261024/qa-report.md` and `source-findings.md`. Original reproductions and fixed test data remain there; do not rewrite those historical results.

Constraints: preserve current uncommitted work, permissions, source freezing, approvals, recovery/history, supported successful paths, CSS and page structure. No new dependency or unrelated refactoring. Reuse current error conventions and controlled/uncontrolled document selection patterns. Build and run only relevant checks during implementation; main runs one integrated regression/build/review and browser verification.

Acceptance:
1. Settings' fixed PDF result button opens the exact document, parse result and physical page; existing history entry still works; project/document changes cannot display an unrelated stale page.
2. A missing or invalid SSH key gets an actionable input error before any remote operation; closing the form clears its obsolete error; valid key and symlink protection remain intact.
3. An unpinned Docker image is rejected with a clear fixed-sha256 requirement, not INTERNAL_ERROR; a valid fixed image still performs GPU detection.
4. Ordinary Run plus formalReportSource is rejected with a domain error and no report/approval write, rather than TypeError. Ordinary report_compose and valid formal-source validation retain their behavior; no brief or authority is fabricated.
5. A completed local Run displays local execution information, never a pending Docker preflight; Docker execution still shows its actual context/image or legitimate preflight state. Layout, classes and CSS do not change.

Implementation, each item uses a focused failing regression before its minimum fix:
- [ ] UI-01: trace settings-view/literature-view selection and DocumentPages; fix the missing location ownership and add a behavior regression. Check controlled history and project-switch cases.
- [ ] UI-02: trace SSH prepare callers and filesystem validation in packages/runners/ssh-targets.ts; handle expected missing/non-file paths without weakening lstat/symlink rules. Clear only the stale SSH form error in compute-connections.tsx. Test rejection before external calls.
- [ ] UI-03: trace the Docker image preflight and GPU service boundary. Use the existing domain validation mechanism for this expected bad input and display its message. Test no execution for the rejected input plus the existing successful validation tests.
- [ ] UI-04: trace the ordinary Run through formal report validation and fixedResearchBrief. Add the earliest appropriate missing-reference guard using the existing error family; do not absorb the large pre-existing formal-report changes into this fix. Test the original missing-brief case and retain successful report tests.
- [ ] UI-05: in workbench Run details, distinguish local receipt from Docker receipt with minimal conditional content; preserve existing markup/classes/CSS. Verify both rendered cases.

Validation and delivery owned by main:
- [ ] Check only batch delta against the captured dirty baseline and integrate without overwriting unrelated edits.
- [ ] Run full `npm test`, `npm run typecheck` and `npm run verify:build`; keep pass/fail/unrun evidence separate.
- [ ] Start only an isolated localhost test instance, then use actual browser clicks/inputs to repeat all five original cases. Retain old histories and test successful alternatives, including fixed GPU detection and ordinary report composition.
- [ ] Independent Sol/high review of the frozen integrated delta and evidence (Astra if a real authority/data-retention design issue emerges).
- [ ] Commit only this batch's source/tests/necessary docs on the current branch and push to the verified private hailuohl/pi-research repository. Do not stage unrelated dirty changes.
