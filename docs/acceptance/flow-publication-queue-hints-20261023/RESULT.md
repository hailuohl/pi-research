# D5 — Explain queued publication target unavailability

## Changes

- Reuse existing ComputeWait details in the dialogue and fixed-publication viewer for active builds only.
- Distinguish a known unavailable context from an unresolved target for an unbound, unheld job. Preserve held legacy jobs, lease/backoff priority, recovery, capacity and inspection read-only behavior.
- Display conditional Docker context/connection guidance and, only for an actual unavailable Docker item, suggest starting Docker Desktop if it is the selected local backend. Missing paged details stay unknown; terminal jobs do not show a false waiting line.

## Evidence

- Clean combined build and 116/116 affected checks passed; D5-specific independent checks passed 48/48. No dependency, state, DTO, timer, automatic Docker startup or waiting deadline was added.
- Independent Sol/high code review found no blockers. Desktop full-app dialogue and both actual component browser harnesses passed. After the necessary D4 mobile drawer fix, the 390x844 full-app dialogue also passed readable/unobscured hint and reachable refresh/cancel checks.
- One synthetic revision was created, prepared, approved and submitted through the real service. Controlled probe unavailability -> readiness plus the existing refresh control updated the same queued job, retained count 1 and made no new prepare/submit request.
- Actual Docker CLI validation used an isolated HOME/USERPROFILE/config and a random nonexistent local named pipe. The production probe attempted docker info, received a missing-pipe connection failure, and the real ComputeQueue reported target_unavailable with no held reservation or target binding. User Docker configuration hashes were unchanged; no daemon or compiler was started or stopped.
- Console errors/warnings, page errors and HTTP 500 were zero. All synthetic browsers, servers and apps were closed. Raw evidence remains at D:/项目/pi research/tmp/remaining-defects-20261023 (d5-review.md, browser-d5, browser-d5-mobile-recheck).

Browser plugin was unavailable; bundled Playwright and an isolated Edge profile were used. Standalone PublicationView evidence is explicitly a real-component harness, not a nonexistent mutable full-app navigation route. The earlier TCP-context check only demonstrated endpoint-policy rejection and is not counted as a daemon failure.

Not checked: starting a real Docker engine and compiling LaTeX through recovery, or a live external Pi model. Controlled ready-state recovery is not claimed as a successful real compilation. Running user services remain untouched.

## Remaining boundaries

Combined full regression completed once: 2439 tests, 2413 passed, 1 failed, 25 skipped, none cancelled (exit 1). The only failure was the old approval fixture corrected in D4; the exact recheck passed 1/1 with every original assertion preserved. Final clean packaging build passed, and four new queue/UI behaviors passed 4/4. All 1125 captured runtime inputs stayed unchanged during the full run; within that manifest, the final package differs only in the independently reviewed fixture correction. The necessary CSS was separately built and browser-validated. No production code changed after full validation. The raw full invocation is not labeled all-green.

D1/D7, D2, D4 and D6 are separate delivered or accepted batches. D3 still requires evidence for the exact brief/proposal handoff that became idle; no global approval-wakeup patch was added. D4 only rejects ordinary pending approvals; withdrawing an already-approved intent remains outside this change. Historical failed Runs and rejected intent manifests are retained, not deleted or rewritten.
