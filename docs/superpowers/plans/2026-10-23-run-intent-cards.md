# Run Intent Card Identification and Rejection Plan

**Goal:** Distinguish same-title formal Run cards and let the user reject the exact ordinary pending intent in place.

**Authorization:** User resumed frontend work and requested remaining approved fixes. This is D4's small information/rejection change, not approved-intent withdrawal or D3 global continuation.

## Acceptance

1. Same-title cards visibly identify short intent ID, source/manifest digest and file count; display frozen argv as exact JSON, with usable desktop/mobile wrapping.
2. Reject only the selected ordinary pending approval ID/version with current subject/project/scope/digest; do not send continuation messages, create Run/intent or alter history.
3. Automatic, RunGrant/task/foreign, queued/submitted/approved, archived/busy, changed-version and deferred/unmounted contexts cannot use this rejection action or bypass existing confirm guards.
4. Refresh/reopen preserves the original rejected intent and precise source, and valid existing confirmation still queues only its own exact ID/digest.
5. At 390x844, the open task drawer must have enough visible room for card identity and exact command, with reachable actions and no horizontal clipping. Closing via Escape or X restores draft, positive message scroll and trigger focus. At 1440x1000, desktop geometry is unchanged.

## Minimal Implementation and Checks

- Own apps/web/src/chat-workflows.tsx and directly related unit tests. Browser acceptance exposed an existing 20px mobile drawer content area that blocked identification; a necessary two-rule narrow-container correction in apps/web/public/chat-messages.css temporarily gives tasks the workspace without unmounting message/composer state. Reuse short, existing card styles and decide(false). The global perform has no context fence; a small component-owned reject method must capture/recheck the exact context tuple before the request.
- Preserve existing RunGrant and confirmation/automatic gates; add only necessary method-entry protection. Do not add backend states, revoke APIs, authorization fallbacks, dependencies or redesign unrelated areas.
- Write behavior regressions first, observe product RED, implement minimally, then run focused UI tests. Fixtures must carry actual approval metadata rather than weakening a guard to accept sparse data. New variables are descriptive, with no new inline comments.
- Implementation uses a separate current-source overlay and separate dist; no shared builds/ports/databases with D2. Main agent integrates only this delta, tests the browser journey on an isolated server, and obtains independent Astra/xhigh review before committing/pushing this batch.
