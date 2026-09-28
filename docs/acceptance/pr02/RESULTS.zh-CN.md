# PR02 首批实施与验证

本文件保留当时的范围与结果；最新实施状态见 [实施状态](../../IMPLEMENTATION-STATUS.md)。

日期：2026-09-28。基线提交：`aa5a2a1`。本记录覆盖完整计划中的第一批操作迁移，**不声明 PR02 或全项目已完成**。

## 已落地范围

`packages/contracts/operations/inputs.ts` 为全部 33 个现有 Pi 工具定义精确输入 Schema；固定对象拒绝未知字段，必需字段、枚举、数组、字符串和数值约束可检查。开放实验配置明确保留 JSON 键空间。现有服务支持的 null 默认和 `artifactId:null` 删除语义保留；Schema 自身不补默认或转换类型。服务仍负责路径、权限、审批、版本、引用关系及动态限制。

这 7 个动作的 HTTP、CLI、Pi 现在通过同一个 OperationRegistry 执行，并有严格输出 Schema：

| 操作 | 业务边界 |
|---|---|
| run_prepare | 固定实验快照，创建独立批准，不执行 |
| run_submit | 复核已批准意向；重复提交只返回既有 Run |
| workspace_read | 显式项目/会话来源；用户只读不写审计事件或操作记录 |
| workspace_write | Agent 仅写自己的会话，用户可写项目；旧摘要防覆盖 |
| change_proposal_prepare | 固定父实验与验收产物；包含明确删除，不覆盖冻结父源 |
| task_result_submit | 只接受宿主派发的有效任务身份；返回 task-result 记录 |
| paper_read | 有界来源读取、权限撤销/取消检查、跨入口幂等；本轮仅协议夹具 |

`OperationInput<N>` 和 `OperationOutput<N>` 从相同 Schema 推导；TypeScript 构建生成对应客户端声明。运行时不增加依赖，预构建核心仍可无 node_modules 启动。其他 26 个工具已有输入 Schema，但输出契约和完整 Registry 迁移保留待办。

Pi 使用同一精确 Schema。固定 SDK 0.87.1 内部会归一化 null 和转换原始参数，所以 Worker 在 SDK 的 `prepareArguments` 钩子先执行统一校验，防止把 `cursor:"12"` 等非法原始参数自动转成成功请求。真实 SDK 离线验证全部 33 个工具示例；这不是实际模型调用。

## 一致性与恢复

- HTTP/CLI 始终使用经过本机身份认证的 USER，不从 JSON 接受 actor、lease、legacy 或工具身份。Agent 的角色、项目、任务、generation、lease 和自动分析限制沿用原规则。
- 旧 run-intents、project files、change-proposals、paper 接口为薄转换。历史 HTTP 响应可被 canonical 操作识别并登记，不因换入口重新创建副作用；冲突或多个不同历史结果明确拒绝。
- 同步操作在 SQLite 写事务内先核对幂等记录与未结束的外部操作，再执行。回归用两个独立 Node 进程同时 prepare，结果只有一个 intent/approval。
- paper 的 HTTP、CLI 和 Pi 保持各自身份范围；同一 owner 操作统一键，并识别历史 `http:key`。重放仍经过连接器来源/权限检查。同进程共享在途请求；独立进程看到同键 reservation 时拒绝重复发出请求。
- 若进程中断时连接器已经保存完成收据，可以据此恢复；没有收据时保留 `OPERATION_IN_PROGRESS`，不猜测成功或盲目重新请求。完整未知状态处理、长任务调度与 UI 对账仍属 PR07 待办。
- 归档、旧 generation、过期 lease、新副作用、stale approval、跨项目访问、已结束任务的合法重放分别测试。无条件重放不能绕过当前来源开关。

## 验证结果

环境沿用 Node 24.19.0、npm 11.17.0、Windows，依赖锁文件未变。

| 检查 | 实测结果 |
|---|---|
| 完整 unit/integration 回归 | [292/292，0 fail、0 skip](tests.txt) |
| 最终改动的定向复核 | [21/21：Schema、SDK、Registry、HTTP/CLI](targeted.txt) |
| TypeScript | [通过](typecheck.txt) |
| 基线/无依赖核心检查 | [4/4](parity.txt) |
| 干净构建 | [219 个 dist 文件集合与 SHA-256 一致](clean-build-summary.json) |
| 真实 Pi live | [0 pass、1 skip，未启用真实供应商调用](live.txt) |

定向测试包括：7 操作相同非法输入经 HTTP/CLI/Pi 得到同一 code/message；用户 envelope 身份伪造；旧版幂等记录直接经新入口恢复；同键不同请求冲突；论文网络途中同键同步写入拒绝；来源撤销/取消；输出未知字段与事务回滚；任务结果重复提交；SDK 转换前严格参数校验。

独立审查发现并修复了同步并发幂等窗口、旧记录未接续、paper 键分叉、只读写事件及异步 pending 与同步请求键冲突。修复后进行定向复审，未留下已知未修复的审查发现。

## 使用与复跑

认证 HTTP 入口：`GET /api/operations` 返回已迁移 7 项定义；`POST /api/operations/<id>` 使用 `{projectId, sessionId?, input}`。写操作需要 `Idempotency-Key`，用户只读不需要。`sessionId` 只是目标会话选择，不赋予 Agent 身份。

```powershell
node dist/apps/cli/index.js operation workspace_read --project PROJECT_ID --input '{"source":"project","path":"README.md"}'
node dist/apps/cli/index.js operation run_prepare --project PROJECT_ID --input '{"experimentId":"EXPERIMENT_ID"}' --key UNIQUE_REQUEST_ID
npm run typecheck
npm test
npm run test:parity
npm run verify:build
```

完整状态和剩余关卡见 [实施状态](../../IMPLEMENTATION-STATUS.md)。本轮没有真实文献联网、实际付费模型、浏览器科研旅程或通用 Docker 验收；没有借离线/夹具结果把它们标成已完成。
