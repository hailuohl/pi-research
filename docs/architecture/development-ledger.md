# 开发记录
计划：docs/superpowers/plans/2026-09-25-local-research-core.md

实施依据是 docs/specs 下两份原文；范围未替换，未覆盖项在 capability-matrix.json 中保留。
Ruling: 无可用 npm 网络，采用 Node 内置模块和离线 React；代价是 UI 基线较旧、Pi 实包/供应商验证须用户环境完成。
Ruling: 无可用独立审查子 Agent，最终采用作者单独自审 + 自动化测试，不声称独立代码审查。

Task 1/2: 20/20 tests passed (`npm test`), including 8 actual detached-process Runner cases. Initial Runner test harness missing brace corrected before running assertions; it was a test syntax error, not evidence of a product failure.
Task 3: collaboration tests written before services; currently fail because SessionService/TeamService not yet implemented. No LLM calls made.

Task 3: 13/13 collaboration state tests passed; total suite 33/33 at checkpoint. Task leases, independent review, drain and rejection are exercised with explicit deterministic test inputs, not model-generated work.
Task 4: scoped tool dispatcher, report generation, Pi 0.87.1 Worker and coordinator scheduler implemented. Pi unavailable in this environment; option/permission tests do not validate the installed SDK.
Task 5: HTTP auth, cross-origin protection, idempotent mutations and a real HTTP-to-Runner flow added. DNS rebinding test corrected to use node:http because fetch did not forward the supplied Host header. Local entrypoint root-path defect corrected before browser test.

Task 5/6: React workbench and CLI implemented; browser launch reached managed-policy navigation denial. No screenshot or visual-fidelity claim. Core HTTP tests do not substitute browser E2E.
Task 7: final test suite 60/60 passed, typecheck and production build passed. Standalone CLI demo actually ran 4 immutable approved numerical experiments and generated a report. Pi was not installed; no model calls were made.
Final review: self-review (no subagent tool). Scoped resources, source import, secret-file exclusions, SDK error handling, metadata idempotency, comparison protocol filtering and retry-dependent recovery received additional RED→GREEN tests.
Final: fixed downstream remained blocked after successful prerequisite retry — retry-regression.test.mjs RED→GREEN, suite 60/60.
Final: Ruling: Browser policy blocks local URLs — retain blocked status and ship an unverified E2E script, do not bypass managed security — cost: UI/runtime and visual defects may remain.
Final: Ruling: No real model credentials or installed SDK — ship version-pinned integration code, not a fake Agent — cost: live SDK/provider incompatibilities remain possible.
Final: minor (deferred): modern React upgrade, UI accessibility/keyboard/visual audit, and precise full-domain schema expansion require subsequent validation. These are visible release limitations, not hidden completed features.
Release: kept local feature branch; no push, PR, merge, external deployment or remote account changes.

Packaging regression: first extracted-distribution suite was 59/60. Reproduced supervisor crash from cross-process heartbeat/cancel VERSION_CONFLICT. Added heartbeat-regression.test.mjs (RED→GREEN), atomic heartbeat/start-state writes and fresh reconciliation check. Final full suite 61/61 and 20/20 real cancellation stress rounds passed. Earlier 60/60 checkpoints remain historical, not the final release gate.
