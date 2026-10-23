# D2 — Formal Run output diagnostics

## Scope

Expose the existing output-root convention in run_prepare and add one actionable, runner-correct hint when required archived regular files are missing. Put the static hint first so long missing-file lists do not truncate it. Collection, integrity, permissions and historical results are unchanged. No working-directory harvesting or stdout-to-metrics conversion.

## Acceptance evidence

- Clean delivery build: passed. Original focused collector/contract/boundary/integrity checks: 26/26 passed. Necessary truncation repair: meaningful RED, then 2/2 passed; combined remaining-change impact set: 116/116 passed.
- Current-source overlay impact checks: 51/51 passed; strengthened runner assertions subsequently passed 1/1. An earlier invocation including the scientific bearing output chain was cancelled and is not counted as passed.
- Two real synthetic local Node executions: workdir-only metrics plus stdout exited 0 but stayed incomplete and received exactly one PI_OUTPUT_DIR/expectedArtifacts repair hint; corrected output-root files exited 0, archived successfully and produced score 0.75.
- Repeated finalize and app close/reopen preserved the original incomplete Run errors and artifact IDs, with exactly two original Runs and intents.
- SSH, Docker, trusted-example and local hint selection is covered by collector tests; this does not claim real remote/container execution.

Raw logs remain outside the repository at D:/项目/pi research/tmp/remaining-defects-20261023. This batch uses fresh affected checks plus the prior baseline regression evidence; final remaining-change integration will run the combined full suite once. Independent review and delivery identifiers are recorded in EVIDENCE.json and the external delivery record.

Independent Sol/high review found a long-error truncation blocker; the one-word ordering fix and a real service-finalize regression closed it. No open D2 blockers. Requested model/effort was accepted; actual runtime values were not echoed.
