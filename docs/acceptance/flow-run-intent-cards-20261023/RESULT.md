# D4 — Identify and reject the exact pending Run

## Changes

- Same-title formal cards directly show short intent ID, source/manifest digests, file count and the unchanged frozen argv as JSON; repeated argument spaces remain visible.
- Ordinary pending rejection reuses the exact existing approval ID/version and rechecks project, subject, scope, digest and active dialogue. It does not queue a message, submit a Run, create another intent, revoke a grant or delete history.
- Confirmation keeps existing RunGrant/task and retry-key behavior, with captured approval/context guards around deferred actions and the approval response.
- Browser acceptance exposed a 20px mobile drawer scrollport. Two narrow-container CSS rules temporarily give tasks the conversation workspace without unmounting drafts/messages; closing restores the original draft, positive scroll and focus. Desktop geometry is unchanged.
- Three existing UI fixtures now include actual Run/approval metadata; all existing assertions remain intact.

## Validation

- Clean batch-only build passed; final directly affected UI checks passed 63/63. Current-source overlay checks passed 64/64, including one pre-existing overlay-only test not included in this delivery.
- Meaningful RED evidence covers indistinguishable cards, missing rejection, automatic approval arriving during confirmation, argument spacing, the 20px mobile scrollport and the incomplete old approval fixture.
- Real headless Edge/Playwright on the final clean build at 1440x1000 and 390x844: exact rejection, no additional message/Run, unchanged sibling pending approval, refresh and fresh app/database/browser reopen all passed. Card identity/command fit; Escape/X restore draft, scroll 120 -> 120 and trigger focus. Console errors/warnings, page errors and HTTP 500: zero.
- Independent Astra/xhigh review covers approval boundaries and the necessary CSS/fixture follow-up. No approved-intent withdrawal, migration, new dependency or blanket continuation behavior.

Raw evidence: D:/项目/pi research/tmp/remaining-defects-20261023 (d4-review.md, d4-packaging-*.log, browser-d4/clean-delivery-final/browser-evidence.json). Browser plugin was unavailable; bundled Playwright and an isolated Edge profile were used. Each synthetic server disabled model hosting and compute monitoring and was closed afterward.

Combined full regression: 2439 tests, 2413 passed, 1 failed, 25 skipped, none cancelled (exit 1). Its only failure was the old chat-collaboration fixture lacking actual approval metadata. That already-reviewed fixture-only repair preserved all assertions and passed the exact targeted recheck 1/1; final batch UI checks passed 63/63. All 1125 captured runtime inputs stayed byte-identical throughout the full run. The raw full invocation is not labeled all-green, and it was not repeated after this fixture-only correction.

Real Pi confirmation/execution was not attempted because no model was configured in the isolated fixture; precise confirmation and idempotent message retry are covered by focused tests.
