# Five browser QA fixes (2026-10-24–25)

Scope: the four functional findings and one display finding from UIQA-20261024. CSS, layout structure, dependencies, source freezing and approval rules are unchanged.

| Finding | Minimum repair | Browser regression |
|---|---|---|
| UI-01: settings fixed PDF result button does nothing | LiteratureView owns the complete document/parse/page location when no external selection callback is supplied; controlled history remains supported and stale project/document responses are fenced | Existing fixed PDF now displays its exact physical-page text and image. Switching to an empty test project does not expose the previous document |
| UI-02: missing SSH private key becomes an internal error and survives closing | Shared lstat validation converts only missing/non-directory paths into INVALID_INPUT, retaining ordinary-file and symlink checks; closing/cancelling clears the returned form error | A known missing test key produces an actionable path message; closing the form removes that obsolete error |
| UI-03: unpinned Docker GPU image becomes an internal error | Existing image-digest preflight now returns an input DomainError; GPU UI displays its message | A tag-only image explicitly requires sha256; the existing pinned image still performs a fresh real detection of three devices |
| UI-04: ordinary Run passed to a formal source crashes on a missing brief | Shared fixedResearchBrief rejects a missing reference before storage access | The canonical negative call returns BRIEF_REFERENCE_REQUIRED, with no report/approval/Run writes. A new ordinary report_compose then succeeds, downloads and reopens |
| UI-05: successful local Run says it is waiting for a Docker preflight | Existing receipt fields use the frozen execution backend and manifest to show local information; Docker context/image output is preserved | The old successful local Run shows local execution and its fixed runtime, without a Docker waiting label |

Validation:

- New regression file: 8 meaningful cases failed before the repair and pass after it.
- Related checks: 109 pass, 0 fail, 1 optional real-Docker source-mode test skipped. The real GPU detection above was separately exercised in the browser.
- Full integrated `npm test` on the preserved working snapshot: 2721 tests, 2696 pass, 0 fail, 0 cancelled, 25 skipped, 0 todo; exit 0. All 8 new regressions are present and passed. The 25 skipped cases are not recorded as passes.
- Clean `npm run verify:build`: npm-ci/build/typecheck exit 0; 767 files identical. Dist content manifest SHA256, using the script's compact JSON serialization: `12a2dabe449fdf6a79fa47e21bb9a3886d367a65fd67e5500db54aeee6ffb11f`.
- Clean HEAD plus only this batch: build and all 8 new regressions pass. The large pre-existing formal-report/source changes were not included in the batch.
- All five original cases were exercised by real Chrome clicks and inputs; fixed PDF rendering, fresh pinned-image detection, a new ordinary report and reopen were checked. Existing Run/report records remain unchanged. The new report download matches its stored bytes.
- Independent Sol/high review: source, RED/GREEN, delivery isolation and browser evidence initially have no blocker; final review completed; no blocking findings. Model/effort were requested; runtime metadata was not echoed.

Evidence is retained locally in the workspace's `tmp/qa-five-fixes-evidence-20261024` directory, including focused logs, per-file before/after hashes, screenshots 01–07, the exact negative tool-result metadata projection, report bytes/hash checks and independent review. Raw conversations, credentials, databases and large logs are not committed.

Limits: this is the five-finding repair regression, not another exhaustive browser sweep. A pre-existing case where an SSH request is still pending when the user closes its dialog remains a non-blocking follow-up; the repaired original case is closing after the error has returned. Live SSH authentication, GPU research loads and broader scientific-workflow branches were not newly exercised.

Delivery scope: only this batch's source, generated outputs, test and necessary documentation are selected; other working-tree changes stay outside the commit. Final SHA, branch and remote verification are recorded separately after pushing, avoiding a self-referential follow-up commit.
