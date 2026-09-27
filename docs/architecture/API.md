# HTTP API · 本地 Alpha

默认前缀 `http://127.0.0.1:4317/api`。除 `GET /health` 外均需 `Authorization: Bearer <本地令牌>`。非 GET 请求必须带 `Content-Type: application/json` 和 `Idempotency-Key`。同键同载荷返回原结果，同键不同载荷冲突。需要版本的操作必须携带 `expectedVersion`，文件更新还需 `expectedDigest`（创建新文件为 null）。

## 主要接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/bootstrap` | 项目、模型配置、运行时真实配置状态、能力矩阵 |
| GET | `/events?after=<seq>` | 持久化事件游标（不是 SSE） |
| POST | `/projects` | `{name, description?, template: "empty" 或 "curve-fit"}` |
| POST | `/projects/import` | `{name, sourcePath}`；仅本机所有者，副本导入 |
| GET | `/projects/:id/state` | 同一数据库中的项目业务状态 |
| GET / POST | `/projects/:id/files` | 查询路径或写 `{path,content,expectedDigest}` |
| PATCH | `/projects/:id/collaboration-settings` | `{expectedVersion,enabled,...}` |
| POST | `/sessions` | `{projectId,title}` |
| GET / POST | `/sessions/:id/messages` | 历史或 `{content,mode:"prompt"/"steer"/"follow_up"}` |
| POST | `/sessions/:id/interrupt` | 停止 Agent，不取消 Run |
| POST | `/sessions/:id/branch` | `{messageId}`；不回滚实验历史 |
| POST | `/experiments` | `{projectId,title,hypothesis,parentId?,config?,contract?}` |
| POST | `/experiments/:id/children` | 从固定父实验派生；继承契约 |
| GET / POST | `/experiments/:id/files` | 实验文件；写入需版本、内容哈希且未冻结 |
| POST | `/run-intents` | `{experimentId}`；生成快照、清单与待批准对象 |
| POST | `/approvals/:id/decide` | `{expectedVersion,approved}`；只有用户可批准 |
| POST | `/run-intents/:id/submit` | 提交已批准快照，同意图不重复创建 Run |
| GET | `/runs/:id` / `.../logs` / `.../manifest` | 状态、日志游标与实际清单 |
| POST | `/runs/:id/cancel` | 取消指定正式运行 |
| POST | `/sessions/:id/teams` | `{goal,tasks,budget}`；仅提交协作计划 |
| POST | `/teams/:id/activate` | 已批准的团队进入调度 |
| POST | `/teams/:id/pause` / `.../resume` / `.../disable-delegation` | 生命周期控制 |
| POST | `/teams/:id/directives` | `{kind,content,taskIds?}`；kind=steer/follow_up/revise |
| POST | `/tasks/:id/retry` / `.../cancel` / `.../manual-review` | 明确的人工任务操作 |
| POST | `/artifacts` / `/evidence` / `/claims` | 持久化产物、定位证据、结论候选 |
| GET | `/artifacts/:id/content` | 已鉴权下载；不执行上传 HTML/SVG |
| POST | `/reports` | `{projectId,title,runIds?,claimIds?}`；仅终态运行/已采纳结论 |
| POST | `/literature-search` | `{projectId,query,limit?}`；Crossref元数据，非全文 |
| POST | `/settings/model` | `{provider,model,thinking}`；没有 API Key 字段 |

工具调用不允许客户端自称 `user` 或提交任意角色身份。Worker 的 Actor、任务、租约和允许工具由控制服务建立。

## 团队任务输入

```json
{
  "goal": "读取指定证据并独立审查",
  "budget": 6,
  "tasks": [
    {"key":"analysis","role":"analyst","objective":"核对指标与单位","dependencies":[],"critical":true,"inputEvidenceIds":["实际存在的证据ID"]},
    {"key":"review","role":"reviewer","objective":"审查分析和原始证据","dependencies":[],"reviewOf":"analysis"},
    {"key":"write","role":"writer","objective":"整理已验收成果","dependencies":["analysis","review"]}
  ]
}
```

以上 JSON 只展示结构；`inputEvidenceIds` 必须替换为本项目真实引用。Reviewer 使用 `reviewOf` 读取待审查成果，不能同时依赖被审查任务已验收，否则产生审查死锁并被服务端拒绝。

错误返回 `{error:{code,message,details?}}`，常见码包含 `APPROVAL_REQUIRED`、`APPROVAL_STALE`、`VERSION_CONFLICT`、`FILE_VERSION_CONFLICT`、`EXPERIMENT_FROZEN`、`MULTI_AGENT_DISABLED`、`TASK_SCOPE_DENIED`、`LEASE_EXPIRED`、`BUDGET_EXCEEDED`、`PI_NOT_INSTALLED`、`RUNNER_UNAVAILABLE`。未实现功能返回真实错误，不返回模拟成功。

## v0.2 活动与结果队列增量

所有变更仍经同一个本地所有者认证、幂等处理与业务服务；`expectedVersion` 从最新 GET 或项目 snapshot 取得。

| 方法 | 路径 | 输入/返回 |
|---|---|---|
| POST | `/campaigns` | `{projectId,rootSessionId,baselineExperimentId,goal,primaryMetric?,autoAnalyze?,limits?}` → 活动草案与独立approvalId |
| GET | `/campaigns/:id` | 活动版本、轮次、固定模型及限制 |
| GET | `/campaigns/:id/members` / `rounds` / `observations` / `decisions` | 同项目对应业务记录 |
| POST | `/campaigns/:id/activate` / `pause` / `resume` | `{expectedVersion}`；activate必须先批准活动 |
| POST | `/campaigns/:id/stop` | `{expectedVersion,reason}`；不取消Run |
| POST | `/campaigns/:id/members` | `{expectedVersion,intentId,required?:true,repairDecisionId?}`；同节点修复重跑需Repair决定 |
| POST | `/campaigns/:id/decisions` | `{expectedVersion,action,reason,observationIds,selectedRunId?,candidates?}`；只提出决定 |
| GET | `/campaign-decisions/:id` | 提案内容、输入摘要、审批、应用结果 |
| POST | `/campaign-decisions/:id/apply` | `{expectedVersion}`；批准后应用，不自动批准后续Run |
| GET | `/wakeups/:id` | 持久化通知、阻塞原因、次数、预留引用 |
| POST | `/wakeups/:id/request` / `retry` / `cancel` | `{}`；显式用户动作，retry不释放旧的未知用量 |

`limits`：maxRounds=4，maxCandidatesPerRound=6，maxUnansweredRunsPerNode=2，maxConsecutiveRegressions=3，maxAnalysisAttempts=12，deadline可选。它们是产品默认策略，不是科研通用定律。

`candidates` 每项为 `{title,hypothesis,config}`。Refill至少一个候选，Promote可为空；Repair和Stop不带候选。Promote必须指定被引用的真实selectedRunId，并等待全部必需成员有终态观察。

`GET /projects/:id/state` 新增 `campaigns/rounds/members/observations/decisions/wakeups`。`budgets` 兼容原 `teamId` 项并新增 `campaignId` 项。

`POST /sessions/:id/teams` 新增 `autoSummarize:boolean`，缺省false；批准后的模型由计划锁定。

Pi工具增加 `campaign_inspect`、`campaign_enroll`、`campaign_decision_submit`。自动分析只允许inspect/decision，不能enroll。不存在Agent自批准或应用决定工具。

新增错误包括：CAMPAIGN_NOT_ACTIVE、CAMPAIGN_DEADLINE、CANDIDATE_LIMIT、ROUND_LIMIT、ROUND_INCOMPLETE、REPAIR_APPROVAL_REQUIRED、RESULT_ALREADY_ANSWERED、OBSERVATION_STALE、AUTOMATION_SCOPE_DENIED、AUTOMATION_TOOL_DENIED、WAKEUP_STALE、WAKEUP_NOT_RETRYABLE。

## v0.2.1 增量

- `POST /change-proposals`：projectId、baseExperimentId、expectedRevision、title、hypothesis、changes[]。每项包含 path、expectedDigest（新增为null）、artifactId（删除为null）。返回固定提案、approvalId、candidateSnapshot、testsStatus=not_run。
- `GET /change-proposals/:id/diff`：读取固定前后文本、每文件摘要；浏览器把文本作为文本展示，不执行内容。
- `POST /change-proposals/:id/apply`：用户专属；批准、基准版本、输入任务验收和摘要均通过后创建新子实验，重复应用返回同一实验。不运行代码。
- `POST /runs/:id/outcome-review`：用户专属；expectedVersion、disposition=answered|unanswered、reason。记录问题回答边界，不改变运行成功状态或指标。
- 原项目state新增changeProposals数组。原审查操作可在多人冲突后人工裁决，但应先处理所有已配置审查，并满足产物合同。
- 新Agent工具artifact_read（受任务授权限制，UTF-8分页）、session_notice_read（自己的宿主通知）、change_proposal_prepare（仅交互式主协调者）。主协调者新增私有workspace_write；不开放项目共享写、Shell或自动审批。

写操作仍需令牌、同源检查、Idempotency-Key以及适用的版本检查。错误包括REVIEW_DEADLOCK、TASK_OUTPUT_MISSING、TASK_OUTPUT_INVALID、CHANGE_BASE_STALE、CHANGE_PROPOSAL_CORRUPTED、RESULT_REVIEW_REQUIRED、LEGACY_OPERATION_AMBIGUOUS。
