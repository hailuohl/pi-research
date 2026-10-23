# Formal Run Output Diagnostics Plan

**Goal:** Help the agent repair missing formal Run outputs without changing archive rules or historical results.

**Approved scope:** D2 from the accepted recheck recommendations. D6 text, D4 cards and D5 queue display remain separate batches. Frontend work is now resumed by the user.

**Implementation:** Add one static backend-correct hint when required output files are missing, and expose the same convention in the existing run_prepare tool description. Reuse existing collection and validation; no new API, dependency, state, directory copying, stdout parsing or history rewrite.

## Acceptance

1. Metrics written only to workdir or stdout stay unarchived/incomplete and the error says how to write required regular files to the archive root; expectedArtifacts are relative paths.
2. Correct output files remain complete with the same metrics/evidence and no missing-output hint.
3. Local/trusted-example refer to PI_OUTPUT_DIR without assuming an absolute host path; Docker refers to PI_OUTPUT_DIR=/output; SSH refers to OUTPUT_DIR=/output. Append the hint once even when multiple outputs are missing.
4. Unsafe, invalid or missing artifacts do not become complete; existing secret masking, limits, fixed methods and missing-file diagnostics remain intact.
5. Existing terminal Run errors, archived bytes and counts stay unchanged after repeated finalize/read/reopen.

## Files and Verification

- Own only packages/runners/artifacts.ts, the run_prepare description in packages/research-tools/definitions.ts, and one focused test file under tests/unit.
- Observe a meaningful RED before implementation. Use real collector/store fixtures and assert outcomes, not source text. Use descriptive new variable names and no new inline code comments.
- Run the focused tests and relevant archive/contract/diagnostic tests in the isolated current snapshot. Main agent ports only this delta to the clean delivery snapshot and main source, builds, checks actual local failure/success and historical retention, and performs one independent Sol/high review.
- Retain raw evidence at its original task artifact path. Reuse hash-identical prior validation only where still applicable; final remaining-change integration will run one full suite.
- Main agent alone commits/pushes exact batch files to the existing private remote branch and verifies the remote commit.

## Baseline and Isolation

- HEAD 25be8132463002276eeada1d9090c65011038a40, implementation/pr01-reproducible-baseline.
- Implementation workspace: D:/项目/pi research/tmp/remaining-defects-20261023/current, with existing source overlay and read-only-use dependency junction. No live data or credentials copied.
- Clean delivery workspace is main-agent-owned at D:/项目/pi research/tmp/local-runner-preflight-20261023/delivery, safely advanced to the same HEAD.
- No product services, Docker engine, model settings or existing main dist are restarted/overwritten.
