# Pi Research 多智能体协作模式详细设计方案

版本：设计建议 v1.0  
日期：2026-09-25  
性质：对《pi research 项目设计.txt》的增量规格，不代表功能已实现。  
范围：多智能体开关、任务拆解与协作、Pi 适配、状态与数据、权限、运行控制、工作区、证据、人工介入、前端、验收。

## 0. 结论与来源边界

建议增加“多智能体协作”选项，默认关闭；开启后，采用“主协调 Agent + 按需专家 Agent + 持久化任务依赖图 + 统一业务服务”的结构。

这不是接入第二个 Agent 框架，也不是在一个对话中模拟多个角色：所有执行实例仍使用 Pi。Pi Research 自己的控制服务负责调度、权限、预算、工作区、证据登记和恢复。原方案已经规划独立助手会话、独立工作区、授权范围和完成回传；本方案将其补成可配置、可审计、可恢复的产品能力。

来源分三类：

- 原方案约束：[S1]，包括 Pi 唯一内核、不依赖 ORX、统一业务服务、Session/Experiment/Run 分离、不可变实验快照、持久化自动研究和独立助手。
- 官方能力核对：[S2]—[S7]，用于确认 SDK、会话、子 Agent 示例与隔离边界；不是本方案所有功能的现成实现。
- 新增设计：本文件的开关语义、团队模型、任务协议、具体配置、接口、交互和测试，均为建议的应用层设计。

本方案不承诺多 Agent 一定比单 Agent 更快、更便宜或更正确；必须通过后文规定的对照评测决定哪些任务默认启用协作。

---

## 1. 产品目标与不可破坏的约束

### 1.1 产品目标

用户仍只需要提出一个科研目标。开启协作后，系统识别可拆分部分，建立有依赖关系的子任务，按授权分配给不同 Pi 会话，汇集可验证的成果，最后由主会话给出统一回答或实际成果文件。

成功标准不是“出现了几个聊天窗口”，而是任务分工有价值、完成条件可检查、工作不相互覆盖、成本有边界、结果有证据、中断后能恢复。

### 1.2 必须保持

1. 所有 Agent 使用 Pi；可以配置不同模型、工具和技能，但不自动启动 CrewAI、LangGraph、Codex 或 ORX。
2. 单 Agent 和多 Agent 调用同一套项目、实验、运行、审批、证据和成果服务。
3. Session、Task、Experiment、Run 保持不同身份，不强制一一对应。
4. 多 Agent 开关不授予额外的计算、网络、凭据、代码合并或发布权限。
5. 任何正式实验必须使用受控 Runner 和不可变 RunManifest。
6. 助手输出是待验收成果，不自动成为事实、不自动合并代码。
7. 用户可引导、暂停、调整计划和撤销未来执行；不能把撤销解释成已发生外部副作用的逆转。
8. 正常模式下只允许主协调者提出新委派，助手不能递归创建助手。

### 1.3 不在第一版实现

不实现无限递归 Agent、自发自由组队、全员群聊、角色人格市场、自动公开发布、跨项目共享原始会话，以及把任意自然语言承诺转化为执行权限。

## 2. 架构选择

| 路线 | 主要优点 | 主要问题 | 结论 |
|---|---|---|---|
| 同一会话扮演多个角色 | 开发量小 | 没有独立执行、隔离和可恢复委派 | 不能作为本功能的正式实现 |
| 固定顺序的角色工作流 | 简单、适合固定科研流程 | 无法充分表达动态拆解和条件依赖 | 作为团队模板支持 |
| 主协调者 + 按需专家 + 任务依赖图 | 既可灵活拆解，又有明确控制边界 | 需要调度、验收和恢复实现 | 推荐主架构 |

自由全互联群聊不作为默认路线。需要专家互相澄清时，通过持久化任务消息定向沟通，而不是向所有 Agent 广播完整上下文。

### 2.1 三个不同职责

- 主协调 Agent：理解目标、提出任务图、指定输入输出、分析成果、提出修改和科研决策。
- Orchestrator：普通确定性程序，不是一个 LLM；校验依赖、权限和预算，分配执行、登记结果、推进状态、恢复任务。
- 专家 Agent：在独立 Pi 会话中完成具体任务，只拥有该任务需要的能力。

主协调 Agent 不能凭一句“允许执行”绕过控制服务。协调者也不能通过修改提示词放宽用户设定的权限。

### 2.2 系统关系

```text
用户 / Web / CLI
       |
       v
ResearchControlService
       |
       +-- CollaborationService
       |      +-- 主协调 Pi 会话：提出计划、分配建议、综合结果
       |      +-- TaskGraphValidator：依赖、预算、权限、完成条件
       |      +-- Scheduler：租约、并发、唤醒、重试、取消
       |      +-- ContextBuilder：按需构建版本化简报
       |      +-- ResultValidator：验证产物、证据与任务完成条件
       |      +-- IntegrationService：变更提案、测试、受控整合
       |
       +-- Pi Worker Supervisor
       |      +-- 文献 Pi Session
       |      +-- 实验设计 Pi Session
       |      +-- 实现 / 分析 / 审查 Pi Session（按需创建）
       |
       +-- 既有业务服务
              +-- ExperimentService / ApprovalService
              +-- EvidenceService / ArtifactService
              +-- WorkspaceService / BudgetService
              +-- Runner Supervisor -> 本地 / SSH / Slurm / 其他后端
```

所有 Worker 经控制服务写业务状态，不直接修改业务数据库。Pi 会话文件只承载会话历史，不替代任务、实验和权限的权威记录。

## 3. 开关与配置语义

### 3.1 用户入口

主会话输入区显示：

```text
多智能体协作 [关闭 / 开启]   策略：按需协作   活跃上限：4
```

说明文案：

> 开启后，主助手可将可独立完成的工作交给专业助手。可能增加模型用量；不会自动增加实验执行、合并或发布权限。

关闭时仍能完成正常研究任务，也仍可在既有权限内运行多个实验；只是不能创建助手会话。

### 3.2 默认值与覆盖

配置分为三个层级：系统默认值、项目默认值、当前研究请求覆盖。新团队创建时固化有效配置，保存来源和版本。

偏好设置可被更具体的层级覆盖；安全限制取更严格交集。例如项目把可用计算目标限制为 A，单次任务不能选择 B。正在进行的团队不因项目默认设置被修改而悄悄扩大权限。

原方案 M0 对齐矩阵应把“默认关闭协作、显式切换”标为 intentional-deviation；原有并行助手能力保留，在相应模式下验收。

### 3.3 开关不是强制并行

开启代表允许委派，不代表每条消息都启动多人。建议策略：

- adaptive：主协调者提出是否委派；服务端执行硬性门槛；简单任务仍由主会话处理。
- manual：用户选择任务、角色或模板，系统仍检查依赖与权限。

第一版不提供无条件“每次强制多 Agent”默认行为；可在评测工具中提供固定协作策略用于对照实验。

### 3.4 人工参与与协作分开

默认交互级别为“确认协作计划后执行”。可由用户在设置中明确授予“低风险只读委派免确认”，但正式计算、扩大预算、共享分支修改和发布仍走各自审批。

### 3.5 运行中切换

| 操作 | 立即生效的控制 | 已有助手 | 已有正式实验 |
|---|---|---|---|
| 开启协作 | 更新本请求的委派许可 | 下一个安全边界生成/确认计划 | 不重复提交、不迁移 Job |
| 关闭协作 | 禁止新委派，未开始助手任务交回主会话处理 | 默认 drain：只完成当前已授权任务 | 默认继续，状态仍受监管 |
| 暂停研究 | 阻止新 Agent 调用和新实验提交 | 保存状态，等待恢复 | 默认继续；另有暂停/取消计算入口 |
| 停止 Agent 工作 | 请求中止活跃 Pi 操作和受控临时工具 | 进入取消/终止处理 | 不隐式取消正式计算 |
| 取消指定实验 | 调用对应 Runner 的取消流程 | 可继续汇总已有证据 | 展示真实后端状态，不预先宣称成功 |

关闭过程中显示“正在关闭：仍有 N 个助手收尾”，而不是立即声称已变成纯单 Agent。需要立即终止助手时提供独立按钮，说明临时工具与已提交外部请求的处理范围。

如果助手尚未提交的后续阶段不属于当前已授权任务，关闭之后不得借“收尾”继续新增这些阶段。

关闭协作不会取消已要求的独立审查：已开始的授权审查可以收尾；尚未开始但必须独立审查的成果，转交具备权限的用户审查或暂停等待重新授权，不能把主助手自审冒充独立审查。普通排队任务交回主会话时保留原 Task 与历史，按新尝试创建工作区和有效权限，不接管仍有旧 Worker 写入的目录。

## 4. 团队角色与最小配置

### 4.1 角色模板

| 角色 | 输入 | 输出 | 默认权限 |
|---|---|---|---|
| Coordinator 主协调者 | 用户目标、全局约束、已验收结果索引 | 任务图、综合结论、决策提案 | 调度提案、读取、请求审批；无权限自我扩张 |
| Literature 文献助手 | 问题、检索范围、已有文献索引 | 文献矩阵、原文证据、缺口 | 受控检索、阅读、证据登记 |
| Designer 实验设计助手 | 目标、证据、ResearchContract | 假设、对照、变量、停止标准 | 读取与方案提交；默认不提交正式计算 |
| Implementer 实现助手 | 已批准方案、基础快照、修改范围 | 代码变更、测试、执行准备材料 | 自己工作区读写、受限开发测试 |
| Analyst 分析助手 | 已收集运行产物、协议、单位约定 | 指标比较、图表脚本、结论候选 | 读取证据、受控数据分析、登记产物 |
| Reviewer 审查助手 | 不可变方案/代码/结果与验收标准 | 问题清单、审查结论、补验要求 | 只读审查；补实验只能提出请求 |
| Writer 写作助手 | 已采纳 Claim、证据、模板 | 报告或论文文件 | 自己成果目录写入、受控编译 |

角色是模板，不是常驻进程。一个团队可以先后使用七种角色，但同一时间只执行少量会话。研究任务不需要代码时不创建 Implementer；不需要论文时不创建 Writer。

### 4.2 首版推荐配置

下列数值只是起始产品默认值，不是经过实测的最优配置：

```yaml
multiAgent:
  enabled: false
  strategy: adaptive
  requirePlanConfirmation: true
  maxActiveAgents: 4
  maxConcurrentAssistants: 3
  maxDelegationDepth: 1
  maxTasksPerTeam: 24
  maxTaskAttempts: 2
  maxReviewRevisionRounds: 2
  requireIndependentReviewForCriticalResults: true
  allowPeerMessages: true
  allowRecursiveDelegation: false
  allowAutomaticMerge: false
  shutdownPolicy: drain

execution:
  maxConcurrentRuns: 1
  requireFormalRunApproval: true
  requireConfiguredBudgetForCostlyActions: true
  allowAutomaticPublication: false
```

定义：

- maxActiveAgents 包含主协调者；活跃是指执行推理或受控工具工作，不是存在一份持久化 Session。
- 助手最多同时占用三个活跃名额，保留主会话容量。真正的模型请求还受全局和供应商并发限制。
- 等待人工、依赖或正式 Run 的 Agent 释放活跃名额，其会话与任务状态仍保留。
- maxTaskAttempts 为单个任务版本的总尝试次数；不等于 RunAttempt，也不等于原方案的无结果实验修复次数。
- 审查修改必须创建任务/图版本；每个新版本计入团队任务与预算上限，防止借修改无限循环。
- 关键审查名额与汇总预算在开始前预留，不能让普通候选任务消耗完全部配额。
- 正式实验并发独立限制；启用四个 Agent 绝不自动改成四个 GPU 作业。

## 5. 决定何时协作

### 5.1 适合委派的任务特征

存在多个可以分别定义输入、输出与完成条件的工作；输入可以被版本化；输出能够被检查；有足够的上下文与预算；分工没有绕过真实因果依赖。

例如：不同文献来源检索、同一固定基线的两个候选方案、实现与独立审查、不同已完成 Run 的结果分析。

### 5.2 默认留在单 Agent 的情况

简单概念解释、短文本修改、下一步完全依赖当前未知结果、多人必须连续修改同一对象、无法提供独立输入或可检查输出。

不存在明确验收标准的“帮忙想一想”不能直接成为具有计算权限的任务。

### 5.3 拆解记录

主协调者提交 CollaborationPlan：

```text
目标和成功标准
为什么需要协作
任务节点、依赖、每个节点的输入输出
必需节点与可选节点
角色建议、模型配置、工具范围
预估调用、上下文和计算资源
人工确认点和停止条件
哪些工作不能并行、哪些失败会阻塞后续
```

服务端执行 Schema、无环、节点数、权限、预算、文件范围、依赖版本和审查覆盖校验。校验通过不代表科研方案正确；科研审查与用户批准仍须按风险等级执行。

## 6. 数据模型

### 6.1 保留原模型

不重建另一套 Experiment、Run、Evidence、Approval。原 Task 作为统一任务实体扩展；新增对象服务于协作关系。

| 对象 | 关键字段/用途 |
|---|---|
| AgentTeam | projectId、rootSessionId、campaignId 可选、goal、生命周期、配置快照、版本 |
| TeamPlanRevision | 任务图版本、需求版本、变更原因、批准、输入与权限摘要 |
| AgentRoleTemplate | 角色指令、技能版本、工具上限、模型策略、结果 Schema |
| AgentAssignment | teamId、role、sessionId、当前 Task、当前 TaskAttempt |
| Task 扩展 | teamId、planVersion、required、dependencies、验收规则、权限与输入版本 |
| TaskAttempt | attemptNo、worker、leaseGeneration、会话路径、工作区、模型配置、用量 |
| TaskResult | 结构化结果、产物与证据引用、来源版本、提交和验收状态 |
| ContextSnapshot | 最小任务简报、引用清单、限制、内容哈希、需求版本 |
| ChangeProposal | baseCommit、patch/文件产物哈希、受影响路径、测试、审查记录 |
| Directive | 用户新指令、影响范围、何时生效、版本与处理记录 |
| Outbox/Inbox | 可复用原事件系统；可靠投递与幂等消费 |
| BudgetReservation | 可复用预算系统；并发预留、结算和未知用量 |

核心关系：Project -> 多个 AgentTeam；Team -> 多个 Task；Task -> 多个 TaskAttempt；TaskResult 可关联零到多个 Experiment、Run 和 Evidence。

一个文献任务可能没有 Experiment；一个分析任务可能读取十个 Run；一个长期 Campaign 也可以包含多个先后创建的团队。

### 6.2 状态分层

团队生命周期建议：draft、awaiting_approval、active、paused、draining、completed、partial、failed、cancelled。

任务执行状态建议：pending、ready、queued、running、waiting_dependency、waiting_approval、waiting_run、output_submitted、failed、cancel_requested、cancelled、blocked、superseded。

结果验收单独记录：pending、validating、accepted、rejected、disputed。

因此 Pi 结束只表示当前执行停止；工具返回结果只表示输出提交；必须通过相应验收，Task 才满足依赖条件。

团队 completed 必须满足全部必需任务结果 accepted、必需 Run 与产物已对账、没有尚未处理的必需审批或未知执行。可选任务未完成时可以 partial 结束，并明确缺失内容。后台仍有计算时必须显示归属；不能把未完成作业隐藏在“完成”状态之后。

### 6.3 建议的任务与结果契约

以下接口属于 Pi Research，不是 Pi SDK API；仍需在实现时配套运行时 Schema 校验。

```typescript
type AgentRole =
  | "literature"
  | "designer"
  | "implementer"
  | "analyst"
  | "reviewer"
  | "writer";

interface InputReference {
  kind: "artifact" | "evidence" | "snapshot" | "run" | "claim";
  id: string;
  version: string;
  digest?: string;
}

interface ResearchTaskBrief {
  schemaVersion: 1;
  taskId: string;
  teamId: string;
  planVersion: number;
  directiveVersion: number;
  role: AgentRole;
  objective: string;
  required: boolean;
  dependencyIds: string[];
  inputRefs: InputReference[];
  expectedOutputs: Array<{
    kind: "report" | "dataset" | "patch" | "analysis" | "review";
    schemaId: string;
    required: boolean;
  }>;
  acceptanceRuleIds: string[];
  permissionGrantId: string;
  budgetReservationId: string;
  workspaceId: string;
  stopConditions: string[];
}

interface ResearchTaskResult {
  schemaVersion: 1;
  taskId: string;
  attemptId: string;
  planVersion: number;
  directiveVersion: number;
  inputDigest: string;
  outcome: "completed" | "partial" | "blocked";
  summary: string;
  artifactIds: string[];
  evidenceIds: string[];
  claimProposals: Array<{
    statement: string;
    evidenceIds: string[];
    limitations: string[];
  }>;
  changeProposalId?: string;
  unresolvedQuestions: string[];
  suggestedNextActions: string[];
}
```

身份、有效权限、租约、模型用量和验收状态由控制服务生成或核实，不由模型填写后直接信任。Result 的 outcome=completed 不能直接写成验收 accepted。

## 7. 任务依赖与调度

### 7.1 依赖图规则

任务图按版本保持无环。每条依赖定义“需要上游什么产物/验收结果”，不是简单等待上游对话结束。

支持必需依赖、可选依赖和条件分支。第一版只需要 all-required；后续扩展 any-accepted 或 quorum 时必须显式定义科研语义，不能机械地用多数票代表正确。

修复与研究迭代通过新任务、新版本和 ResearchRound 表达，不在同一 DAG 中添加无限回边。

### 7.2 执行顺序

1. 主协调会话提出任务图。
2. 控制服务校验，并按策略申请用户批准。
3. 事务写入团队、任务、依赖、配置快照和待发布事件。
4. Scheduler 选择依赖满足的 ready 任务，检查当前模式与权限版本。
5. 原子预留预算、资源和执行租约；创建 TaskAttempt。
6. 构建 ContextSnapshot 和隔离工作区，启动/恢复独立 Pi Session。
7. 工具请求经业务服务执行，写入幂等记录和审计。
8. Agent 提交 TaskResult；执行产物、证据和版本校验。
9. 必要时创建独立审查任务；结果被采纳后满足下游依赖。
10. 主会话综合已采纳成果，提出继续、调整、停止或最终交付。

队列优先级建议：用户控制指令和安全中止 > 已完成结果的收集与审查 > 被结果解锁的任务 > 新探索候选。同一优先级使用等待时间提升，避免低优先级任务永久饿死。

### 7.3 非阻塞委派

agent_delegate 返回已落库的 Task ID，不在一个工具调用里等待所有助手完成。主会话进入可恢复等待状态，释放活跃执行名额。结果事件到达后再由 Scheduler 唤醒。

等待 Pi Settled、等待 Task 验收、等待正式 Run 完成是三种不同等待。不得使用无限 Promise 或一条持续 Shell 命令保存全部流程状态。

### 7.4 审查失败与依赖失败

可选文献来源失败：保留其他来源，报告覆盖不足；不得声称已全量检索。

必需输入失败：相关下游 blocked；主协调者只能提出替代计划，不能伪造依赖已完成。

审查失败：创建有界修订任务，保留被拒绝版本。修改关键实验条件后要求重新批准，不能循环沿用旧批准。

## 8. Pi 接入

官方 SDK 提供独立会话、指定工作目录、模型与工具配置、事件订阅、恢复、steer/followUp 和 abort 等接入点。[S2][S3] 官方 Subagent Example 展示独立 Pi 子进程和并行/链式委派，但不是本项目审批、运行契约和恢复系统的替代品。[S4]

继续复用原方案的 ResearchAgentRuntime，并增加宿主侧操作：

```text
createAssignedSession(assignment, contextSnapshot)
restoreAssignedSession(sessionPath, assignment)
executeTask(taskAttempt)
steerTask(directive)
queueFollowUp(directive)
abortTask(reason)
collectSessionCheckpoint()
```

这些是适配层设计，不应被当作可直接导入的 Pi 函数名。

### 8.1 会话生命周期

每个独立助手拥有自己的 AgentSession、持久化 Session 路径、工具配置和工作区。同一 Session 只允许一个有效 Worker 写入。

按精确 Session 文件路径恢复；禁止在多项目多助手系统中用“恢复最近会话”猜测目标。跨项目不复用原始会话；重用进程也必须重新创建受控环境和上下文。

### 8.2 事件映射

- message_end：登记完成后的消息，而不是把不完整流当最终答案。
- agent_settled：记录该 Pi 会话不再自行继续，不等于任务验收或实验成功。
- task.result_submitted：进入结果校验。
- task.result_accepted：可以解锁相应依赖。
- run terminal observation：由 Runner 状态和产物对账确认，不由 Pi 结束事件推断。

### 8.3 资源加载

使用宿主管理的 ResourceLoader，只加载批准的技能、模板和扩展版本。导入仓库中的 .pi、AGENTS.md、技能或角色文件均先作为不可信项目内容处理，不能自动覆盖平台权限或注入可执行扩展。

角色可选不同模型，但所有模型标识必须由配置目录和连接预检查确认；不写死未经验证的具体模型。模型切换建立新的 TaskAttempt 并记录原因，不能在同一尝试中隐形切换。

官方目前另有 pi-durable 的持久化记录和存储实现。[S7] 是否复用应单独验证版本与单写入语义；它不能造成 Pi Research 业务数据库和另一套 Task 数据各自成为权威。

## 9. 上下文与消息

### 9.1 最小必要简报

ContextSnapshot 只包含任务目标、已确认限制、需要的上游摘要、版本化产物引用、完成标准、禁止事项和停止规则。长论文、日志与数据按需读取，不把全部聊天、所有论文和其他助手完整记录复制给每个 Agent。

输入引用必须可解引用；无法读取必需资料时任务应 blocked，不允许以摘要猜测原始数字。

### 9.2 共享记忆分层

项目层：用户确认的研究目标、固定协议、版本化设置和已采纳事实。

团队层：当前计划、任务状态、决策、证据索引和预算。

任务层：本任务的局部上下文、工具历史、草稿、失败记录。

模型提出的新结论进入 Claim proposal，由程序校验和科研审查后采纳；单条聊天摘要不能覆盖既有事实。相互矛盾的结果保留为 disputed，等待校验，不由“最后发言者”覆盖。

### 9.3 定向消息

提供 task_message_send，消息包含发送/接收任务、类型、正文、证据引用、需求版本和幂等键。类型限制为 clarification、finding、conflict、blocker、request。

助手间消息不能新授予权限、修改审批、改变上游验收结果或创建助手。收到其他 Agent 的“请运行某命令”仍须经过自身任务范围和工具权限检查。

关键决定必须调用结构化业务操作持久化，不能只存在于消息文本中。

## 10. 工作区、变更与实验血缘

### 10.1 工作区隔离

每个 TaskAttempt 使用独立可写目录；共享数据和固定基础快照只读。不同 Agent 不共享可写 Python 环境、输出目录或 Git 索引。

```text
workspaces/<teamId>/<taskId>/<attemptId>/
artifacts/<contentDigest>/
snapshots/<snapshotDigest>/
```

独立目录用于避免覆盖；安全边界还须由文件挂载、进程、网络和凭据限制建立。不能只把 cwd 指向新目录就认为已隔离。

允许宿主通过 worktree 管理开发副本，但不能将主仓库共享 Git 管理目录不受限暴露给不可信 Worker。Agent 可提交 patch/文件产物，由受信宿主执行版本控制操作。

正式产物由宿主收集、复制到内容寻址的不可变产物库并核对摘要；不能把仍可被助手修改的路径直接登记成正式证据。收集过程中发生内容变化应重新读取或拒绝，不接受不一致快照。

### 10.2 防止失效 Worker 继续写入

租约使用单调递增 leaseGeneration。所有业务变更与结果提交校验当前租约代次。

文件系统写入不能只靠数据库租约阻止。因此重试采用新 TaskAttempt 目录；旧 Worker 的环境必须停止或隔离，旧目录只可作为故障产物保留，不能直接成为新尝试的工作区。

### 10.3 代码整合

助手只提交 ChangeProposal，至少包含 baseCommit、patchDigest、changedPaths、测试证据、关联方案版本和审查结果。

整合流程：检查基础版本仍有效 -> 检查范围与冲突 -> 应用到独立整合工作区 -> 执行规定测试 -> 展示差异/获得所需批准 -> 宿主持有唯一写锁提交 -> 保存新快照。

基础版本已变更则重新准备提案并重新测试；不得静默覆盖。对同一共享分支的整合串行执行。

### 10.4 不混淆两种分支

实现同一功能的独立补丁可以经过审查整合。

不同科研候选应作为 Experiment 的兄弟或后继节点比较，不能把候选 A、B 的所有改动自动合并成同一个实验。由已有结果继续探索时，沿被选中父实验派生新节点。

实验按原方案的 RunManifest 和冻结规则执行；开启多人协作不得改变历史源码、配置、日志或结果。

## 11. 证据与科研审查

### 11.1 两层验证

程序验证：Schema、引用存在、版本/哈希、文件类型、指标字段、单位定义、完成标准中的机器可检查条件。

科研审查：证据是否支持论断、对照是否合理、条件是否可比、是否忽略不利结果、推断是否超出测量范围。

第一层通过不意味着第二层正确。引用真实存在也不自动证明解释正确。

### 11.2 独立审查

关键方案、正式代码与重要结论由不同 Session 审查。Reviewer 不修改生产者的成果，在其自己的审查记录中指出问题。

可让 Reviewer 在初步判断前只看任务要求和原始证据，再看生产者解释，以减少相互提示影响。这仍不构成统计意义上的独立专家证明；换角色名或换会话也不保证不同模型判断独立。

### 11.3 冲突处理

先核对原始资料、协议版本、数据范围、单位和代码；能重算的部分由受控工具重算。仍有分歧则保留 competing claims 和限制说明，必要时申请额外实验或人工判断。

不得用“多数 Agent 同意”代替实验证据。

### 11.4 写作边界

Writer 只能把 accepted Claim 和对应证据作为确定性陈述依据；proposal、disputed 和未完成测量必须明确标记。报告保存数字、图表、数据和生成脚本之间的关系，并使用原方案的类型化引用。

## 12. 权限、安全与批准

Pi 官方说明其默认没有内置文件、进程、网络和凭据权限系统，因此独立 Session 不等于安全沙箱。[S5] 工具层隔离也不自动限制仍在宿主运行的扩展。[S6]

### 12.1 能力范围

每个任务的权限由控制服务签发，绑定 projectId、teamId、taskId、attemptId、输入/方案版本、允许操作、工作区范围、计算目标、额度和有效期。请求中的 role 或 permissionGrantId 只能用于查找，不能作为自证权限。

任务权限 = 用户授权范围 ∩ 项目限制 ∩ 角色上限 ∩ 本任务范围。

### 12.2 默认限制

文献助手不接触 SSH、云计算、主仓库写权限。实现助手只写自己的工作区，并通过受控沙箱执行开发测试。Reviewer 默认为只读。Writer 无发布权限。主协调者也不能自行批准扩大额度。

正式计算凭据保留在 Runner/控制服务，不把宿主 SSH 私钥、完整 provider 凭据或用户主目录挂入 Worker。控制 Worker 的网络目标和敏感环境变量，防止绕过 run_submit 直接操作外部计算平台。

### 12.3 分离批准

协作批准：允许谁处理什么资料、使用哪些模型和大致用量。

实验批准：绑定方案、源码快照、RunManifest、目标与额度。

整合/发布批准：绑定变更内容、目标分支/仓库、可见性和具体副作用。

批准后关键条件改变，旧批准失效。已有授权可以覆盖一个明确有界的计算批次，但不能把“开启多智能体”当作无限批次批准。

### 12.4 不可信输入

论文、网页、日志、代码注释和其他助手消息均为任务数据，不是平台规则来源。预览内容需隔离，路径与压缩包需验证，产物不因有同名文件或相似标题自动覆盖。

## 13. 预算与资源

### 13.1 三套计量

模型预算：输入、输出、缓存计费、重试、协调、审查和压缩等调用；使用供应商返回的真实用量，缺失时保留估计/待对账状态。

执行资源：CPU 核数、内存、GPU 数量与显存、实例/作业数、存储和占用时长。

流程预算：总 Task 数、单任务尝试次数、审查修订轮次、研究轮次、截止时间。

模型调用并发、Agent 活跃并发和正式 Run 并发是三个不同限制。多个 Agent 可以共享一个模型推理服务；不能用 Agent 个数推导显卡占用或任务吞吐。

### 13.2 原子预留

开始任务前按可执行调用上限预留额度，不能让多个 Worker 各自看到“余额足够”后同时花掉同一额度。完成后按实际用量结算，释放剩余预留。

总账同时展示已结算用量、尚在途预留与未知待对账用量。网络异常不代表没有计费；未知请求不能立即释放全部预留再无限重试。

无法可靠计算硬成本上界的供应商，应同时使用硬调用次数/输出限制、软成本预警和超限停止规则，并明确成本估计性质，不承诺账单绝不越过估计。

### 13.3 预算用尽

停止新增昂贵动作，保留已获得结果和足够的状态摘要；需要追加预算时请求用户确认。不能为继续研究而自动切换到未授权账户、供应商或更贵模型。

默认预留终态结果收集、关键审查和最终汇总的预算。降低预算或并发时先停止新的分配，不把已在运行的外部操作伪装成瞬间消失。

## 14. 人在回路

### 14.1 用户消息分四类

引导当前任务：在下一个安全边界影响指定任务或团队。

后续指令：排队，当前任务结束后处理。

修改研究目标/约束：生成 Directive 和新需求版本，影响分析后重新规划。

执行控制：暂停、停止 Agent、取消指定 Run；通过明确控制操作执行，不依赖模型自己解释是否要停。

Pi 的 steer/followUp 用于会话交互；团队层的版本、任务失效、审批与预算同步由 Pi Research 负责。[S2]

### 14.2 需求变更传播

先保存 Directive，再计算受影响任务和下游依赖。

无关任务继续；可用新约束安全继续的任务收到版本化引导；输入或目标已不适用的任务标为 superseded/请求停止。已经发生的实验和产物保留，不删除历史。

旧版本结果不自动进入新结论；若经明确兼容性校验仍可复用，记录采纳决定和原始版本。正式运行是否取消由用户选择或预先定义策略决定。

前端显示变更影响：哪些任务保持、哪些重新规划、哪些成本已发生、哪些审批需要重做。

## 15. 失败、恢复和一致性

### 15.1 持久化事件

业务变更和 Outbox 在同一数据库事务提交。消费者使用 Inbox 或等价唯一键去重；按业务对象版本拒绝过期写入。唤醒事件只是提示，恢复时重读权威数据库，处理所有未消费的终态结果。

目标为至少一次投递 + 幂等业务处理；不宣称外部模型和计算平台天然严格恰好执行一次。

### 15.2 故障矩阵

| 故障 | 恢复规则 |
|---|---|
| Pi Worker 崩溃 | 租约到期后先核对工具副作用；按指定会话/检查点恢复或创建新尝试 |
| 控制服务重启 | 重扫活动 Team、未决 Task、Outbox、审批和正式 Run |
| 同一结果重复送达 | 幂等接受，不重复解锁、派生或提交 |
| Runner 接受但响应丢失 | 查询同一 RunIntent 和远端记录，unknown 时暂停，不盲目重提 |
| 产物已写入但未登记 | 按摘要重试登记，定期对账孤立产物 |
| Reviewer 拒绝 | 保留原结果，创建有界修订，不覆写原证据 |
| 旧 Worker 恢复联网 | 拒绝失效 leaseGeneration，隔离其旧工作区 |
| 关闭协作后收到助手结果 | 仍可收集验收，不允许借此新建助手 |
| 用户中止与实验完成竞争 | 以可查证的真实终态对账，保留取消请求及响应 |
| 主协调者不可用 | 先保存专家结果，暂停需要新决策的工作；不影响已提交 Run 的监管 |

### 15.3 数据库与会话文件分工

业务数据库是调度和授权事实来源；Pi Session 文件是会话事实来源。不能假装两者天然处于一个原子事务。

工具副作用先使用业务幂等键落库；会话恢复后重复工具调用应返回原业务结果。Session 中缺失一条已执行工具反馈，不允许据此推断操作从未执行。

### 15.4 服务生命周期

关闭浏览器不取消研究。控制服务或 Worker 停止时，不再声称仍在推理；界面显示最后在线时间和待恢复状态。正式 Run 是否继续取决于相应 Runner 的实际部署与监管能力，不由前端连接状态决定。

## 16. 前端交互

### 16.1 维持一个主会话

默认只展示主协调者给用户的计划、关键变化和最终成果。助手工具轨迹按需展开，不将所有流式 token 混入主聊天。

主视图建议：主聊天 + 协作侧栏 + 可切换任务依赖图。任务图与实验树使用不同对象 ID，不混成同一张语义不明的树。

### 16.2 协作计划卡片

展示为什么协作、角色和任务、依赖与并行部分、预计用量、风险、正式实验批准点。提供批准、修改任务、减小范围、单 Agent 执行。

### 16.3 助手卡片

显示角色、具体任务、输入版本、模型、当前执行状态、已用预算、最后心跳、关联产物、阻塞原因。操作包括查看会话、查看证据、发送引导、暂停/停止、重试。

重试显示是否创建新 TaskAttempt、是否可能重新调用付费服务、是否复用已有实验，不模糊处理。

### 16.4 进度与可观察性

并列显示“执行结束任务数”“验收通过任务数”“仍待完成实验数”，不把流式文本多少换算为进度。

图和列表均支持查看依赖、阻塞、当前版本、已过期结果。日志带 teamId/taskId/attemptId/sessionId/runId/eventId，敏感内容脱敏。

统计每角色调用量、等待时间、执行时间、审批耗时、失败重试、成本、被拒绝产物和人工介入次数。用户可追溯任务为什么分配给某角色、为什么停止。

## 17. API、工具与模块

### 17.1 API 增量

```text
GET   /projects/:id/collaboration-settings
PATCH /projects/:id/collaboration-settings
POST  /sessions/:id/teams
GET   /teams/:id
GET   /teams/:id/plan
POST  /teams/:id/plan-revisions
POST  /teams/:id/directives
POST  /teams/:id/pause
POST  /teams/:id/resume
POST  /teams/:id/disable-delegation
GET   /teams/:id/tasks
GET   /teams/:id/events?after=<cursor>
GET   /tasks/:id/result
POST  /tasks/:id/messages
POST  /tasks/:id/cancel
POST  /tasks/:id/retry
POST  /tasks/:id/results
POST  /change-proposals/:id/prepare-integration
```

审批、正式运行、发布仍复用已有对应 API。改变状态的请求必须有权限、幂等标识和适用时的 expectedVersion；身份与作用域由服务端解析。

### 17.2 工具增量

主协调者：collaboration_plan_submit、agent_delegate、task_inspect、task_result_read、task_message_send、collaboration_decision_submit。

助手：task_context_read、task_progress_report、task_result_submit、task_message_send、task_blocker_report，以及该角色获准的既有科研工具。

助手不获得 agent_delegate。为了避免一个任务卡住主会话，等待由持久化事件/状态实现，不是通用阻塞型工具。

建议错误码：MULTI_AGENT_DISABLED、DELEGATION_DEPTH_EXCEEDED、TASK_DEPENDENCY_UNSATISFIED、TASK_INPUT_STALE、TASK_RESULT_REJECTED、LEASE_EXPIRED、TEAM_DRAINING、BUDGET_RESERVATION_FAILED、WORKSPACE_CONFLICT、APPROVAL_STALE。

### 17.3 目录增量

```text
packages/collaboration/
  team-service.ts
  plan-validator.ts
  graph-service.ts
  context-builder.ts
  result-validator.ts
  directive-service.ts
  integration-service.ts
  role-registry.ts

packages/domain/             扩展 Team、Task、Attempt、Result 等对象
packages/contracts/          增加 API、工具、结果和事件 Schema
packages/pi-adapter/          扩展受控助手会话适配
packages/scheduler/           复用队列、租约、唤醒、恢复
packages/policy/              增加委派、配额、角色权限
packages/workspace/           每尝试工作区、提案、受控整合
apps/web/                    协作开关、计划卡、侧栏、任务图
skills/research-roles/        自己编写和审查的角色技能
```

不新增第二套 Runner，不维护另一份实验状态，不让前端自行决定任务成功。

## 18. 与原 M0—M9 的结合

| 原阶段 | 增量工作 | 阶段门槛 |
|---|---|---|
| M0 | 记录开关默认值、模式转换和并行助手的对齐差异 | 单/多模式的用户旅程和验收明确 |
| M1 | Team、Task 扩展、结果、权限、事件与版本模型 | 不接 LLM 也能完整推进模拟协作状态 |
| M2 | 多 Pi 会话、受控委派、恢复、消息引导 | 两个独立会话不串上下文、不越权 |
| M3 | 每尝试工作区、固定快照、变更提案、Runner 复用 | 多人修改不影响已运行实验 |
| M4 | 文献、设计、复现模板与结构化输出 | 每种角色有真实输入和可检查成果 |
| M5 | DAG、非阻塞唤醒、动态调整、资源和恢复 | 完成事件不丢、不重复派生和提交 |
| M6 | 开关、计划卡、团队侧栏、任务图和证据联动 | 用户可独立理解并控制任务状态 |
| M7—M8 | 各后端真实多任务验证、团队隔离、安装迁移 | 不把 Mock 或单机测试冒充完整支持 |
| M9 | 故障、安全、模式切换与科研收益评测 | 所有声明均有测试记录 |

### 18.1 建议交付顺序

A：关闭模式保持原行为；主协调者可创建一个只读文献助手；结果落库并在侧栏展示。

B：两个独立任务并行；结构化回传、独立审查、完整用量；仍不允许助手正式计算和自动整合。

C：任务图与持久化等待；服务重启、重复消息、取消、版本化引导。

D：接入实验设计、独立工作区、受控 Runner、预算、审批与代码整合提案。

E：材料筛选/论文复现等模板；真实科研闭环；公平的单/多 Agent 对照评测。

不能跳过可靠运行底座，直接把“多个 Agent 同时跑 Shell”作为 D 或 E 的完成证据。

## 19. 测试与验收

### 19.1 确定性测试

| 编号 | 场景 | 通过标准 |
|---|---|---|
| MA-01 | 开关关闭时调用 agent_delegate | 服务端拒绝，无助手会话创建 |
| MA-02 | 开启后处理简单问题 | 可以只用主会话，且说明没有委派 |
| MA-03 | 两个只读独立任务 | 可并行、会话隔离、产物有归属 |
| MA-04 | 同一 Session 被两个 Worker 接管 | 只有当前有效租约可写业务状态 |
| MA-05 | 助手递归委派 | 超深度/无权限请求被拒绝 |
| MA-06 | 依赖尚未验收 | 下游不得提前执行 |
| MA-07 | 输出含不存在 Evidence | 结果拒绝，无法进入正式结论 |
| MA-08 | 必需任务失败 | 阻塞依赖，不显示全部完成 |
| MA-09 | 多个结果同时/重复到达 | 每个业务结果仅验收/解锁一次 |
| MA-10 | 运行中关闭协作 | 不再新增委派，现有收尾可见 |
| MA-11 | 关闭时已有排队助手任务 | 撤销委派或显式交回主会话，不继续隐藏启动 |
| MA-12 | 停止 Agent | 不自动错误标记正式 Run 已取消 |
| MA-13 | 新需求改变输入条件 | 受影响结果失效或显式兼容复用 |
| MA-14 | 已批准清单被修改 | 原批准失效，正式提交被拒绝 |
| MA-15 | 多个任务争用预算 | 原子预留，无双重花费 |
| MA-16 | 提交响应丢失 | 对账原意图，不盲目创建第二个 Run |
| MA-17 | 旧 Worker 恢复 | 失效结果被拒绝，不污染新工作区 |
| MA-18 | 两个补丁修改同一内容 | 显示冲突，不能静默覆盖 |
| MA-19 | 两个科研候选结果不同 | 保留独立血缘，不自动合成候选 |
| MA-20 | 项目 A 会话读取项目 B 资料 | 服务端/隔离环境拒绝 |
| MA-21 | 文献/日志包含权限诱导指令 | 不改变权限或执行越权操作 |
| MA-22 | 浏览器断线并重连 | 从事件游标和快照恢复真实状态 |
| MA-23 | 没有 ORX 的环境 | 协作及研究核心路径可独立运行 |
| MA-24 | 审查循环持续失败 | 达到上限后停止并保留差异 |

这些是必须达到的验收条件，不表示当前已通过。

### 19.2 故障注入

在以下边界主动终止进程或断网：任务落库后/Worker 启动前；工具产生副作用后/结果写入会话前；外部平台接受后/返回 ID 前；产物写入后/登记前；Result accepted 后/下游事件发布前；用户撤销授权后/新工具请求前；租约过期但旧 Worker 仍存活时。

验证最终状态、工作区隔离、实际外部 Job 数量、预算结算和完整审计，而非只看界面能否重新打开。

### 19.3 真实科研对照

测试任务至少覆盖：单源阅读、小型多源综述、固定条件的论文复现、两个候选的实验比较、代码实现与独立审查、已有结果的报告生成。

对照 A：在相同模型、数据、工具、成功标准与总预算下比较单/多 Agent 的完成率、证据正确率、耗时和成本。

对照 B：在相同时间预算下比较任务质量和可验证工作量。混合模型策略单独成组，不与“协作本身收益”混算。

记录总 token、总调用、资源、关键路径耗时、审批次数、重复工作、审查发现问题数、无效或过度结论、人工修正量。多次重复并报告任务类型差异，不从单次演示得出“多 Agent 一定更强”。

## 20. 贴合科研工作台的完整示例

以下为协作结构示例，不是实际材料性能结论或已运行结果。

用户提出：研究某类二维材料用于目标绝缘特征气体检测，先梳理文献和已有数据，再做 ML 粗筛、必要的 DFT 精算，最终输出有证据的比较报告。

1. 主协调者确认/读取已有目标、候选范围、固定协议、预算和停止条件，提出协作计划。
2. 文献助手整理原文证据；数据助手以 Analyst 模板核对已有结构、数据与模型使用条件，两者在输入可独立读取时并行。
3. Designer 在必需证据到齐后提出候选和对照设计；Reviewer 审查协议与验收标准。
4. 用户批准方案；Implementer 创建版本化配置与执行材料。代码/配置发生关键变化时对相应 RunManifest 再批准。
5. Runner 执行 ML 粗筛。必要的输入准备可提前进行，但依赖 ML 结果的候选决策必须等实际结果。
6. Analyst 分析筛选证据；Coordinator 提出有限的 DFT 候选；用户或明确授权策略批准正式计算。
7. Runner 按 CPU、内存/GPU 配额执行；等待过程中 Pi 会话释放活跃名额，不占着一个长调用等待计算结束。
8. 完成一个计算后即可进行其结果收集与分析；需要完整比较集合的结论等待所有必需结果，不能凭先完成的部分宣布全局最优。
9. Reviewer 对照原始输出核查，Writer 根据被采纳的结果生成实际报告、图表和引用。
10. Coordinator 向用户给出已完成、未完成、证据、限制与是否继续的决定；后续研究按原 Campaign/ResearchRound/Experiment 规则推进。

建议任务关系：

```text
文献证据 --------+
                +-> 实验设计 -> 审查/批准 -> 实现/快照 -> ML Run
数据与模型核查 --+                                      |
                                                       v
                            候选选择/批准 <- 筛选结果分析
                                   |
                           DFT Run A / DFT Run B
                                   |
                            收集、分析、独立审查
                                   |
                              报告与主会话汇总
```

Agent 的职责是准备、分析和决策提案；长计算由 Runner 管理。多智能体的价值在于有边界地分担工作和交叉检查，不是把有因果依赖的科研步骤假装并行。

## 21. 最终交付定义

交付物应包括模式开关及转换行为、协作领域与接口 Schema、角色模板、Pi 适配、持久化调度与恢复、权限/预算、工作区与变更提案、证据验收、团队 UI、迁移文档、故障与安全测试、真实科研对照结果。

首个可展示闭环建议是：

> 开启协作 -> 批准计划 -> 两个独立 Pi 助手处理可并行任务 -> 结构化结果与证据回传 -> 独立审查 -> 主会话综合 -> 关闭协作并继续单 Agent 工作。

涉及真实实验的下一条闭环应加入不可变快照、正式批准、Runner 执行、结果分析与引用，并测试 Agent 中止而实验仍受监管。

最重要的原则：开关控制的是委派能力；任务图控制协作顺序；服务端控制权限和资源；Runner 控制正式计算；证据与验收控制最终结论。

---

## 来源

[S1] 用户上传《pi research 项目设计.txt》：L2—L8（项目边界）；L61—L118（架构及统一服务）；L218—L248（领域对象关系）；L322—L417（Pi、交互与权限）；L425—L517（工作区、快照与 Runner）；L603—L680（自动研究与独立助手）；L890—L935（测试与幂等恢复）。

[S2] Pi 官方 SDK 文档，核对于 2026-09-25：
https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/sdk.md

[S3] Pi 官方 Session Management 示例：
https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/examples/sdk/11-sessions.ts

[S4] Pi 官方 Subagent Example：
https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/examples/extensions/subagent/README.md

[S5] Pi 官方仓库 Permissions & Containerization：
https://github.com/earendil-works/pi

[S6] Pi 官方隔离环境文档：
https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/containerization.md

[S7] Pi 官方 pi-durable README：
https://raw.githubusercontent.com/earendil-works/pi/main/packages/durable/README.md

实施前固定 Pi 精确版本和依赖锁文件；上述 main 分支资料是本次设计核对依据，不应成为自动追随上游变动的发布策略。
