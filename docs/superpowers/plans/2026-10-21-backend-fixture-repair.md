# 后端失败夹具修复 Implementation Plan

> **For agentic workers:** 按项目 AGENTS.md 分批实施、每批集中独立复核；主代理直接处理短小串行修改，明确的角色夹具实施可交 Luna/max。子代理不提交、推送或自行扩批。

**Goal:** 修复已记录的三个后端失败，保持现有权限、固定来源、交付证明和历史保留约束。

**Architecture:** 三个失败均来自过期测试前提。分为“正式审查 SDK 读取”和“合法科研会话准备实验与 Run”两条流程；不修改生产接口。对尚未跟踪且依赖在途功能的测试，只提交本批精确补丁及证据，不纳入原功能的其他未完成实现。

**Tech Stack:** Node 24.19.0、node:test、现有固定 Pi SDK、SQLite/Host IPC。

**Spec:** [前批失败证据](../../qa/2026-10-21-thinking-strength-menu.md)及用户要求“把剩下的3项后端失败也排查修复，按流程分批处理，前端布局继续暂缓”。

## Global Constraints

- 前端布局继续暂缓；不修改生产权限、schema、依赖、超时或包体上限。
- 不删除或削弱既有断言；保留其他执行者在途内容，实施默认至多一名代理。
- 基线 `fbec2ae3eb29ee2d42a190148feb686ca50a02cc`；当前测试及生产文件哈希保存在 `.validation/backend-fixture-repair-20261021/baseline.json`。
- 本次作为上轮全量失败后的必要修复：测试夹具变化只重验受影响检查，复用仍适用的全量通过项及干净构建证据；若必须修改生产接口、依赖或环境，重新确定相应验证集。
- 每批验收后主代理只暂存本批文件，提交并推送现有私密仓库工作分支；未跟踪原功能不得伪称已作为独立可运行源代码入库。

## Review Focus

1. SDK 的真实广告 schema 与夹具读取输入一致，由批次一的真实 SDK/Host 用例验证。
2. 失败、错误摘要/token、pending 和撤权读取不得计作交付，复用并核对既有 closeout/routing 检查。
3. designer 必须来自真实已 claim 的会话，批次二使用 `startTeam/spec/actor`，断言会话身份。
4. reviewer 角色必须由 `sessions.create(actor,pid,input,internal)` 第四参设置，批次二保留原来源拒绝断言。
5. 新 ready 简报、零额外 intent/approval 及重开后的固定历史，由批次二的 brief-runs 文件覆盖。

## 批次一：正式审查 SDK 固定目标读取

**Files:** 工作区修改 `tests/integration/formal-review-batch-ipc.test.mjs` 的固定 SDK 用例；新增本批补丁与 QA 记录。不暂存整份未跟踪原测试。

**Interfaces:** 使用 `formalReportReviews.prepare/inspect` 返回的 `targets[].readInput` 生成分页调用，保留 `formalReviewTargets(...).read()` 的精确页界和既有 end/交付断言。

**验收：** SDK 顺序读取超过九个目标并正常结束；摘要/交付/持久化读取相符且无额外 Run；错误、越权、stale/pending 不计交付；既有大正文直接 IPC、30 秒边界与读取历史保持。

- [x] 核对当前广告 schema 与原失败，保存基线和精确修改差异。
- [x] 仅将旧 kind/path SDK 输入改为实际公开的 readInput，显式校验定位输入存在。
- [x] 运行该集成文件全部用例；按相关性核对 closeout/routing/重开检查或有效旧证据。
- [x] 冻结补丁及测试哈希，独立 Astra/xhigh 只读复核；必要修复仅复查受影响部分。
- [x] 主代理提交可应用补丁、计划与 QA 记录并推送，明确未跟踪源文件的集成边界。已核对远端 `bc6f86131984d3528b59492c38d436f4f89ac736`。

## 批次二：合法科研会话准备实验与 Run

**Files:** 修改已跟踪 `tests/unit/research-brief-runs.test.mjs`；工作区修改未跟踪 `tests/unit/scientific-claims-workflow.test.mjs` 的 metric source 用例，远端仅交付其精确补丁。

**Interfaces:** `startTeam(s,[spec(key,{role:'designer'})])` 后 `actor(app.teams.claim(team.id))`；`sessions.create(USER,pid,{}, {role:'reviewer'})`；沿用 `researchBriefs.save/confirm` 与 `runs.prepare`。

**验收：** 真实 designer 的子实验不直接绑定简报，但祖先 Run 必须使用当前已确认根；新 ready 未确认时拒绝且不新增 intent/approval；真实 reviewer 及非法指标来源保持原拒绝；schema/pin/parent/active-root 与权限前置条件不削弱；固定引用重开后保留。

- [x] 保存并复用两项原失败证据，先核实夹具会话角色与 task/attempt 对应关系。
- [x] 用真实 designer claim 替换伪造根身份；补新 ready 拒绝、零副作用和确认后新 revision 断言。
- [x] 将 reviewer 角色移至第四参并断言实际 role，保留 `METHOD_METRICS_SOURCE_DENIED` 等既有断言。
- [x] 旧 d18 pin 使用自身支持的 claims v1：关闭默认编译、移除 v2 专用 assessments、显式断言实际 pin 和 method-contract-v5，再保留旧来源拒绝与显式指标批准断言。该前提缺陷在修复 reviewer 后才可达，不修改生产 guard。
- [x] 运行 brief-runs 全文件、scientific-claims-workflow 的 metric source 相关用例，复用仍有效的其他通过项。
- [x] 独立 Astra/xhigh 复核权限、错误优先级、零副作用与历史保留，主代理核对实际差异。

批次二提交／推送的实际 SHA、分支、GitHub 链接以 `.validation/backend-fixture-repair-20261021/batch2-delivery.json` 回执记录，源文件与补丁边界见该批 QA。
