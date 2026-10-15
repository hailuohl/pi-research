# Execution ledger — 2026-09-27 workflow repair
Baseline: supplied v0.2.0; 122/122 tests passed in this session.
Ruling: use local extracted isolated repository; no existing remote or user workspace modified.
Ruling: use available Node types for verification when package registry DNS is unavailable; record exact versions, do not claim npm ci.
Final review will be author self-review (no independent subagent tool available).

Task 1 complete: 8 new regression tests RED 0/8 -> GREEN 8/8; full suite 130/130. Reviews aggregate all declared reviewers; supported output schemas are explicitly enumerated.

Task 2 complete: 7 new failures reproduced, archive/report/freeze regressions GREEN 8/8; full suite 138/138. Measured failed runs are frozen; raw process state is retained.

Task 3: complete — stable tool-operation replay across worker leases, finished-result response recovery, and durable host notice delivery. Seven new regression failures reproduced; eight new cases now pass, full suite 146/146. Context IPC uses an explicitly labelled test worker, not a live Pi/model call. At-least-once context delivery is intentional; acknowledgements do not imply exactly-once model requests.

Task 4 (handoff services): 8/8 RED→GREEN; full suite154/154. Ruling: add a minimal immutable file-to-new-child proposal, with human integration approval and independent task acceptance, not a general Git merge. Reviewers gain scoped artifact_read; main coordinator gains private workspace_write. Arbitrary code still requires the unverified Docker path, and no sandbox-test success is claimed. A user or coordinator selects the base explicitly after task acceptance; no implicit merge or unapproved experiment copy.

Task 4: complete — file handoff, scoped artifact read, private coordinator writes, HTTP and UI entry. Three HTTP/component regressions reproduced then passed; full suite157/157. A controlled real curve-fit Run executed the integrated config after a separate Run approval. Component checks are not browser visual tests.

Task 5: complete — additional workflow findings: partial output now blocks explicitly with bounded retry, reviewers are blocked when their source failed, legacy acceptance-stage cycles pause with an actionable reason before spending budget, and legacy autoaccept is re-gated before dispatch. Four RED→GREEN cases; full suite161/161. A suite failure exposed error-precedence drift for partial manual review, fixed without deleting the regression test.

Task 6: complete — OpenResearch answered-vs-exit semantics: valid finite measurements protect code even on failed exit; unmeasured/invalid output waits for explicit user outcome review. Outcome review does not change execution success, artifact integrity or hypothesis judgment. An OOM/NaN-like result can be retained as an answer or confirmed as an implementation failure. Six new regressions and one component test RED→GREEN; full suite168/168. Ruling: conservative extra review for ambiguous failure, rather than asking the model to self-certify no result. Two existing Repair tests now explicitly record the user's no-answer review before testing the original bounded Repair behavior; no tests removed or skipped.

Final review: self-review (no subagent/reviewer tool). Found noncanonical path aliases in handoff; added RED→GREEN regression. Added a post-preflight byte-copy fault injection: first injection also affected preflight and was not a valid reproduction of that narrower gap; constrained it to readStableFile, temporarily removed the digest guard, observed failure, then restored guard and observed pass. Existing deletion behavior retained with a passing control. Full suite171/171. Per-file digest is rechecked after read, in addition to preflight snapshot validation.

Verification: fresh build + full suite171/171 and strict typecheck passed after version stamp. Fixed dependency npm ci still blocked by EAI_AGAIN; compiler5.8.3 and available Node types25.1.0 used, lock declares24.0.4. Browser first navigation is still blocked by managed policy; no bypass, no screenshot or live model success claim. Same-path v0.2.0→v0.2.1 upgrade probe passed with4 unchanged Run records and unchanged report. Final artifact packaging/portable checks recorded under docs/acceptance.

Rulings: explicit output contracts are enforced, but absent legacy contracts are not guessed from task prose. Ambiguous outcomes now require explicit user review; this is intentionally stricter than model-only classification. A file handoff is not Git integration and has no development-test evidence. Skills and original design files remain untouched; workflow comparison reads a fixed official upstream commit, not a full UI parity run.

Deferred minor/remaining work: older React16 and dense application components; pagination/indexing for growing state; richer clickable evidence UI; generic sandbox tests and role input/source grants; no real Pi/provider, Docker, Windows/WSL or remote-backend certification. None is labelled production-ready in the capability matrix.
