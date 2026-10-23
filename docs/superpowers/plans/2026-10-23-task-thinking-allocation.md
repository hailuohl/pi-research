# 通用助手思考档位 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变主会话的前提下，按真实自定义档位和可移植用途策略分配助手思考等级。

**Architecture:** 主 Pi 复用既有协作规划选择档位；宿主校验候选、事务外准备执行定义并在批准计划内冻结。调度、两种 TaskGrant 和模型 HTTP 守卫复用同一冻结模型解析，旧记录走原继承路径。

**Tech Stack:** TypeScript、Node.js、现有 Store/SQLite、固定 Pi 0.87.1、node:test；无新增依赖。

**Spec:** docs/superpowers/specs/2026-10-23-task-thinking-allocation-design.md

## Global Constraints

- 全批沿用 Spec 中五条验收，不另建验收体系。
- 前端布局暂缓；不改主会话、模型、权限、凭据及原运行额度。
- 仅在隔离副本写入；子代理不提交/推送、不启动原项目服务、不创建其他代理。
- 开发阶段只跑相关检查，主代理集成后集中完整回归与干净构建。

## Review Focus

- 自定义 ID 与 Pi 及 wire 参数不相同、顺序无语义，使用真实 wire 拦截断言。
- legacy 模型候选不可伪造；无策略/单档/无 SDK 解析保持继承。
- 同 ID 改参数与派发后改参数要阻断下一次新 HTTP；标签变更不误伤。
- 两种 TaskGrant、重试和重开使用冻结任务模型，旧 digest 不补字段。
- 策略跨数据目录导入不带凭据/路径，失效 restoreEpoch 或候选报错。

## Task 1: 一条完整协作选档流程（单一实施者）

**Files:**
- 新建紧凑模型思考策略/准备模块（packages/pi-adapter/thinking-policy.ts）及必要共享任务模型解析模块（packages/collaboration/task-model.ts）。
- 修改 packages/pi-adapter/model-management-types.ts、model-management.ts；按现有入口保存/读取脱敏策略。
- 修改 packages/domain/types.ts、packages/collaboration/graph.ts、team-service.ts、packages/contracts/operations/inputs.ts、outputs.ts、registry.ts，以及 apps/server/routes.ts。
- 修改 packages/policy/discovery-grant-validation.ts、run-grant-validation.ts，条件加入新字段，保留旧序列化。
- 修改 packages/scheduler/agent-host.ts、model-http.ts（若需要）、apps/agent-worker/index.ts、packages/pi-adapter/options.ts、packages/research-tools/definitions.ts。
- 必要时扩展现有备份/恢复校验；不改前端布局。仅在确有类型接线必要时调整 apps/web/src/models.ts 等无布局代码。
- 新建 tests/unit/thinking-policy.test.mjs、tests/unit/task-thinking.test.mjs、tests/integration/task-thinking-runtime.test.mjs；复用现有 fixture 与 TaskGrant 检查。文件可按项目约定等价命名。

**Interfaces:**
- 策略：provider/model/restoreEpoch + 独立 version + candidates:[{id,purpose}]，通过 model.thinking-policy 管理 action 保存与导入。
- 输入：TaskSpec.thinking?:string、thinkingReason?:string；宿主快照仅由后台创建。
- prepareTaskModels(c, rootSession, tasks): Promise<PreparedTaskModels|undefined>，无显式选择返回 undefined；PreparedTaskModels.resolve(rootModel,tasks) 同步核对准备依据并返回冻结 map。
- TeamService.create 最后可选参数 preparedTaskModels，原所有调用方式保留。
- resolveTaskModel(plan,task) 读取冻结规范及 map；旧无 map 原样继承 plan.model。

- [ ] 先写真实行为回归并运行到预期失败，保存 red 日志到隔离目录同级；不要仅测源码字符串。
- [ ] 实现策略管理、真实候选读取与可移植导入；策略版本独立，未知字段/ID、目标版本失配明确拒绝。
- [ ] 实现 project_inspect 候选输出、主协调者选档指令、TaskSpec 校验和异步准备入口；不让任意客户端提交冻结 map。
- [ ] 实现新计划的 host-only 冻结和共享模型解析，接通两种 TaskGrant、claim、重试/重开兼容。
- [ ] 实现执行前/新 HTTP 前守卫与精简执行回执，复用原参数浅覆盖及 SDK 适配，不伪称供应商内部强度已核验。
- [ ] 跑相关新旧测试到 green；不得删除或削弱旧断言。报告实际文件清单、命令与结果、关键未验点及必要迁移限制。

## Task 2: 主代理集成、验证、复核和交付

- [ ] 核对实施增量与原基线，合并到当前工作分支，原在途差异保留。
- [ ] 集中运行完整 unit/integration 回归与 npm run verify:build；新问题只修必要阻断。
- [ ] 独立 Astra xhigh 只读复核同一交付快照，记录 SHA 和未提交差异哈希；必要修复后仅复验受影响部分。
- [ ] 检查本批差异及待推送提交敏感信息，确认 hailuohl/pi-research 为 private。
- [ ] 仅暂存本批文件/区块，主代理提交并推送原分支，核对远程分支包含本次 SHA。
- [ ] 写精简验收结果与机器证据引用；报告提交 SHA、分支、链接及真实验证限制。
