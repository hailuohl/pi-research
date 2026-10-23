# Publication Queue Diagnostics Plan

**Goal:** Show why a manuscript build is queued and how to check its Docker connection, without changing scheduling or recovery authority.

**Scope:** D5 only. D2 output diagnostics in this workspace are completed and frozen; do not change those files. D4 cards are implemented separately with separate build outputs.

## Acceptance

1. A new unbound/unheld queued publication whose context is unavailable reports target_unavailable; both publication surfaces display the reason and a conditional Docker Desktop/context/connection hint.
2. Updating the existing queue item/context to ready updates the same job's displayed reason and removes the obsolete unavailable hint, without creating or submitting another job.
3. Existing held legacy, valid lease, recovery backoff, unknown, SSH/local reasons and resource reservations retain their ordering and meaning. Inspection never probes, binds or writes.
4. Missing paged queue items retain the existing not-loaded message and do not imply Docker failure; terminal historical builds do not get spurious waiting messages. Existing cancel/refresh remains usable.

## Minimal Changes

- Change only compute-queue.ts reason selection for !bound && !held context unavailable; preserve all earlier local/legacy/lease branches and other recovery checks.
- Reuse ComputeWait in publication-dialogue.tsx and publication-view.tsx for queued/starting/running/unknown only.
- In compute-wait.tsx, add an actionable conditional hint for actual Docker unavailable items: check selected context/connection, and only if using local Docker Desktop check that it is running. Do not infer locality from a context name.
- No new DTO, state, deadline, poller, dependency, automatic Docker startup or permanent failure transition.
- Own only the four named frontend/queue files and directly related scheduler/publication tests. Apply behavior tests first, run focused checks/build/typecheck; main agent does isolated browser QA, integration review and final full regression.
