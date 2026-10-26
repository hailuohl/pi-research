# Workspace delivery receipt implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for this single coherent batch. Root owns design rulings, integration, independent review, final validation and commit/push.

**Goal:** Require actual SDK delivery for new workspace source/draft acceptance while retaining original accepted history.

**Architecture:** Extend workspace_read with an explicit small byte-page branch and pending receipts in existing kinds. Reuse host SDK ACK and current write/source validation, add one persistent legacy input selection, and separate fresh acceptance from exact stored historical contexts. Bound preimage capture and comparison without changing legacy journal formats.

**Tech Stack:** Existing Node.js/TypeScript, SQLite, filesystem and pinned Pi SDK; no dependency or layout work.

**Spec:** `docs/superpowers/specs/2026-10-26-large-files-batch2d.md`.

## Scope and ownership

- Delivery worktree only, baseline `aa79bb4557029936f0e77c376a4644a6789067b3`; main dirty checkout/service remain untouched. Root owns this spec/plan and acceptance docs.
- Continue the same Astra/high task that produced the readonly design; no second implementer or duplicate design. Expected source boundaries: draft-reads/source-inputs, stable workspace reads/preimage recovery, operation input/output/Registry/catalog, host ACK, brief/current-reference and permission/continuation callers. Existing record kinds and helpers take priority over a new generic framework.
- Keep the same five spec conditions for all tests and review. No new large writer/adoption/CAS-history publication, no dependency, no generated argument/JSON/WorkingGrant budget increase. 2C fixed source selection and receipt semantics remain.

## Steps

- [x] Read the exact spec, readonly DESIGN and root RULINGS in tmp/batch2d; confirm current baseline. Trace all validate/preview/freeze/confirm/current-capture/history and host ACK callers before changing shared signatures.
- [x] Write failure-exposing tests for both host-success-without-ACK paths, clarifying-anchor bypass, gaps/default-vs-page cache, same-byte writeVersion, legacy accepted versus unaccepted migration, preimage growth and recovery comparison. Keep original RED logs outside Git.
- [x] Implement stable bounded default/page reads, immutable first-receipt binding and pending rows. Wire fresh save/cache and actual SDK offer/delivery for both token kinds. Reuse common byte limit/geometry and ordinary actor gates; do not recordWrite while reading.
- [x] Add persistent effective legacy source selection and matching fingerprints, strict fresh draft/source acceptance, trusted server-loaded historical current checks and unchanged fixed-reference behavior. Audit clarifying and method preview consumers, Owner/manual semantics and exact approved-action recovery.
- [x] Implement bounded new content/metadata preimages and streamed write/recovery comparisons with original identity/conflict/journal protections. Keep old journal payload format/decoding and do not claim a 512 MiB writer. Run related recovery tests, not only new reader tests.
- [x] Extend existing checkpoints/review/source-input/attachment/operation contract tests and a pinned SDK/local provider fixture for default and paged project+draft -> ready/confirm/reopen, exact approval recovery, normal retry and missing/transformed ACK. Cover compatibility with fixed dataset-reference inputs without fake whole-dataset reading. Update concise API docs.
- [x] Run appropriate related checks and build; freeze actual source/test/generated hashes and hand off commands/results/RED evidence/remaining risks. Root then performs one full regression, clean build and independent Astra/xhigh review; repairs revalidate affected paths. Root commits/pushes exact accepted files and verifies remote containment.

## Verification limits

Direct service unit helpers prove state transitions, not real SDK delivery. Do not report mocked Docker, external providers or browser validation as run. Existing 2C 512 MiB evidence remains applicable unless a change invalidates it; this batch has no 512 MiB draft capacity claim. Root decides any necessary capacity repeat from actual changed paths rather than rerunning completed gates automatically.
