# D3 — Atomic domain confirmation and one bounded continuation lineage

## Selected design

The user requested the remaining approval-continuation fix. Use one USER-only workflow_confirm operation to confirm a current brief, approve/activate a campaign, or approve/apply a fixed change and atomically register a single nonhuman session notice. The notice is system/automation, not a new human message or a broadly privileged Wakeup. Reuse ordinary coordinator tools and every existing per-tool/computation approval boundary.

Alternatives rejected: frontend confirm followed by a separate messages POST leaves the observed response-loss window; globally waking approvals.decide duplicates existing handoffs and changes unrelated approvals; adding an ordinary Wakeup requires widening automation permissions. Detailed diagnostic evidence and the selected adapter/approval-lineage protocol remain at D:/项目/pi research/tmp/approval-continuation-20261023/DESIGN.md.

## Five acceptance conditions

1. A single explicit click for each current eligible brief/campaign/change atomically commits its exact domain action and registers at most one same-root notice. Same/different HTTP-key retry, response loss and reopen reuse the same continuation and child. Historical confirmed/active/applied sources get no automatic backfill; an eligible explicit continue action may register once.
2. Reject foreign/wrong/latest/stale/version/digest/archived/task/team/derived-automatic contexts without extra notice or authority. Preserve original approvals, source snapshots, Runs, old researchRequest/requestRef and permissions. A source with any existing handoff metadata is exclusively validated/routed to that handoff, with explicit blocking and no ordinary-notice fallback.
3. Host claim/fork/heartbeat/tool boundaries validate exact source, project lifecycle, model, permission, actual human-consumption anchor and active generation. A new actual human input invalidates the old lineage; it is not steered into an active workflow notice. Two hosts cannot dispatch the initial notice twice, and paid/unknown work is not automatically restarted.
4. Normal tools still require original grants and per-action user approval. A real permission action records the workflow lineage and exact notice, and its later approved notice inherits that lineage without manufacturing a human messageId or automatic approval proof. Original notification replay and unrelated/finished action replay fail; legitimate multi-HTTP/tool and approval-resume chains continue. No expansion of AUTOMATION_TOOLS.
5. Queued/running/processed/failed/stale or readiness/admission blocking is visible for the current source and survives reopen. Missing/changed models or source/permission failures that have not claimed execution retain a clear failure, do not recapture authority and do not enter a new retry system. Domain confirmation/integration remains historical fact even if continuation cannot start. Existing permission resume, dirty handoff and Run withdrawal stay compatible.

## Implementation boundaries

Use a small fixed workflow-continuation record with source identity and actual message link, not a second execution state machine. Reuse Message.status. Add only required optional internal Message/Actor/Session/session-action fields, closed operation schemas, a narrow current-session summary projection, host/permission identity wiring and three card calls/statuses. Actual new human ACK may update lastConsumedHumanMessageId; null means unknown, not an invented request. Source bindings and block reasons must not expose prompts, credentials, permission internals or host paths through public DTOs.

The existing untracked research-handoff module is not deliverable in this batch. Use the verified read-only structural adapter described in DESIGN.md; clean compilation must not import that module. Missing/invalid existing handoff proof is explicitly blocked, never replaced. Keep all pre-existing dirty source changes intact.

Observe meaningful RED before implementation, then service atomicity/idempotence/source-boundary tests, UI single-request/context tests, real host/worker IPC with the installed Pi SDK and a local synthetic provider, permission approval-resume/new-human/model-change checks, reopen/backup checks and dirty handoff regressions. No live external model, production data, user service restart or Docker changes. Root owns fresh clean integration/build/full regression and an independent new Astra/xhigh review; the design/implementation session cannot review itself.

## Baseline and ownership

D3 implementation starts only after the withdrawal source is frozen. The current-source worktree contains that pending parent delta plus existing unrelated overlays. Record d3-input-manifest.json before edits, save exact owned before-images, and deliver only the D3 incremental patch. Root will integrate against the actual withdrawal parent commit and preserve other work. No branch creation, commits, pushes, dependency installation, service changes or additional agents by the implementer.
