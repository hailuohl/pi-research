# 研舟π通用科研工作台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. If these skills are unavailable, follow the repository's actual execution and review capabilities; do not invent tools or claim the skills were run.

**Goal:** 在现有研舟π上交付可跨会话接续的通用研究工作台，用户能理解进展、找回成果、核查比较与结论，并保留原有来源和执行边界。

**Architecture:** 复用现有会话、OperationRegistry、Store、权限、证据和执行服务。增加项目聚合读取、显式上下文与比较表，逐批接入 Agent 和成果链；不建立第二套存储、调度或科学结论真相源。

**Tech Stack:** 当前仓库的 TypeScript、Node.js、React、SQLite、Pi；版本以 package.json/lock 和 .node-version 为准，本计划不要求升级依赖。

**Spec:** [2026-10-21-general-research-design.md](../specs/2026-10-21-general-research-design.md)

## Global Constraints

- 研舟π是通用科研工作台，不预设某一学科或每项研究必须有 Run。
- 产品内 Pi 仍是唯一 Agent 执行内核；开发 Codex 与 Pi 的身份及权限独立。
- 原始材料、固定修订、已冻结报告与历史证据保持原字节；新信息产生新修订或新关联。
- 用户可浏览一个项目，不等于任意 Agent 可读取整个项目。目录可见、正文可读、工具可执行、结论可采纳是不同权限。
- 新增摘要、目录、比较表不授予运行、网络、文件写入、源码整合、发布或科学结论采纳权限。
- 旧 ResearchBrief 的摘要计算与固定引用保持兼容；不能给旧对象补默认字段后重算旧 digest。
- 新增页面按需请求有界数据，不能继续把全量新历史塞进 /state。
- 本轮交付设计文档；STATE.json 中产品任务初始全部 not_started，实施以用户启动指令为准。
- 根 AGENTS.md 优先约束工作方式；前端布局暂缓需由用户的实施启动范围解除，全面视觉重设计不在本计划内。
- 每批一个用户流程、3–5 条验收；默认一个实施者。文件、接口、共享资源独立时才并行；不要求每批使用所有模型。
- 保留当前 dirty 基线；不能从纯 HEAD 新开 worktree 后假装得到当前工作树能力。
- 不以文件存在、设计完成、组件 stub 通过或 API 200 代替实际功能验收。

## Review Focus

1. Agent 能列目录但无权读正文：GR01/GR06 增加跨项目、撤销授权及表格聚合泄漏反例。
2. 同时编辑与中途改来源：GR03/GR05/GR09 检查 CAS 冲突、草稿保留和固定版本不被替换。
3. 无 Run、无数值指标的研究：GR04/GR10 必须走通纯文献及理论/定性旅程。
4. 备份恢复和项目清理：GR03/GR05/GR09 检查数据库版本支持范围、新记录引用和受管路径。
5. 超时、取消与 unknown：GR02/GR08/R01/R02 保留真实状态，恢复不重复副作用。

## 使用本计划

实施开始先读 START_HERE，再读本节全局约束和当前任务。任务进度以 STATE.json 为准；本文件的复选框仅描述步骤，避免维护第二份进度真相。每个任务的完成必须链接验收记录，不因修改复选框变成已完成。

现有路径表示已经核对的接点；标为 Create/planned 的路径尚未实现。开工时用 rg 核对，如当前代码已存在等价能力，先验证差距，再缩小本批实现并记录依据。

每批共同执行步骤：写能暴露目标差距的测试 → 确认失败原因正确 → 最小实现 → 定向验证 → 实际用户流程 → 必要集成验证及独立复核 → 仅提交本批 → 更新状态和交接。简单文案/命名修改不机械添加镜像测试。

## 依赖与优先级

| ID | 用户可感知交付 | 前置依赖 | 需求 | 优先级 |
|---|---|---|---|---|
| GR00 | 对齐可实施的当前基线和范围 | 用户启动 | 全局 | P0 |
| GR01 | 无需向模型索要历史卡即可找回资料/成果 | GR00 | F01 | P0 |
| GR02 | 看懂当前工作、待决定事项及最近成果 | GR01 | F02 | P0 |
| GR03 | 保存研究方向与决定，并显式跨会话接续 | GR02 | F03 | P0 |
| GR04 | 不同研究方式使用适合的计划提示 | GR03 | F04 | P1 |
| GR05 | 手工创建并核查有来源的比较表 | GR01 | F05 | P1 |
| GR06 | 在固定材料范围内由 Agent 辅助提取 | GR04, GR05 | F06 | P1 |
| GR07 | 看清支持、反证、条件与缺口 | GR05, GR03 | F07 | P1 |
| GR08 | 理解确认动作及连续工作的真实控制范围 | GR02, GR03 | F08 | P1 |
| GR09 | 修改、固定、复用并导出研究成果 | GR06, GR07, GR08 | F09 | P1 |
| GR10 | 三类旅程、旧项目及重开交付收口 | GR01–GR09 | 全局 | P1 |
| R01 | 计算启动准备失败后可以继续调度 | GR00；问题仍存在时 | INV-07 | 条件 P0 |
| R02 | 宿主命令长执行有明确最终回执 | GR00；问题仍存在时 | INV-07 | 条件 P0 |

默认选择顺序按表中的 GR 编号。R01/R02 若已确认影响当前批次，先解决该阻断；只读目录等无依赖批次无需等待。条件任务可记 not_applicable，但必须有当前证据，不能凭“没有跑到”跳过。

## GR00：实施前基线、范围及验证路径

**用户流程：** 后续 Codex 在真实当前工作树上继续，保留原有改动并知道下一项工作。

**Files:**
- Read: 根及适用的 AGENTS.md、package.json、.node-version、本方案、STATE.json。
- Modify: docs/codex/general-research/STATE.json、HANDOFF.md；创建实际批次的精简验收记录。
- 不修改业务源码；仅在已授权实施且有具体必要时建立包含当前改动的隔离工作副本。

**Interfaces:** consumes 当前代码与启动授权；produces 实施基线、文件归属、验证工具状态、可执行的 GR01 范围。

- [ ] 核对真实 HEAD、分支、工作树和正在运行的任务；比较 BASELINE.json 的选定文件摘要，不因不同就回退源码。
- [ ] 将当前批次可能触及的 dirty 内容分为已有、拟新增、冲突待判定，记录本批允许改动范围。
- [ ] 确认启动授权是否含本方案前端入口；缺少时继续可做的后端/只读部分，将具体前端任务列为授权阻塞，不要求重复授权已明确范围。
- [ ] 核对真实构建/测试脚本及浏览器能力，记录旧浏览器脚本是否使用失效入口。不得假设存在 test:browser。
- [ ] 只读重查 R01/R02 的当前代码。必要的隔离复现属于相应 R 任务，避免在 GR00 重跑整库验证。
- [ ] 记录 nextTaskId=GR01、选定基线和执行方式；此后按依赖推进。

**Acceptance:** A00.1 基线同时包括 HEAD 和所选工作树摘要；A00.2 原有改动无丢失且文件归属明确；A00.3 授权与工具缺口真实记录；A00.4 产品任务状态仍准确，未把规划标为实现。

**Validation:** `git status --short`、`git diff --name-only`、`git diff --cached --name-only`、核对包脚本。输出应是可解释的实际状态，不要求仓库变干净。

## GR01：稳定资料与成果入口

**Files:**
- Create/planned: packages/project-hub/types.ts、catalog.ts、adapters.ts。
- Create/planned: packages/contracts/operations/project-hub-schemas.ts。
- Modify: packages/contracts/operations/registry.ts、inputs.ts、outputs.ts；packages/research-app.ts。
- Create/planned: apps/web/src/project-library.tsx；Modify: apps/web/src/conversation-panel-layout.tsx、conversation-panel.tsx、app.tsx 中必要入口。
- Test/planned: tests/unit/project-catalog.test.mjs、tests/integration/project-catalog-http.test.mjs。

**Interfaces:** `ProjectCatalogService.list(actor: Actor, projectId: string, input: CatalogQuery): Page<CatalogItem>`；`pin(actor, projectId, input: CatalogPinInput): CatalogPreferenceReceipt`。首批支持 document、artifact、report，后续新增类型通过 adapter 扩展；所有 DTO 来自 project-hub/types.ts。

- [ ] 写失败测试 `owner_lists_existing_objects_without_history_action`，断言已有 Document/Artifact/Report 不需要新建 Agent 历史请求即可列出并打开正确 ID。
- [ ] 写失败反例 `catalog_does_not_leak_private_or_cross_project_content` 和 `catalog_cursor_binds_filters`；包括内部原生会话 artifact 不进入普通目录。
- [ ] 实现查询、过滤、keyset cursor 和 owner-only 操作；按设计默认30/最大100条，不发送正文。
- [ ] 复用原文献/报告预览，增加稳定入口、搜索和类型过滤。输入和刷新失败保留已有列表并显示错误，不能把失败当空项目。
- [ ] 验证重复收藏幂等、切项目、归档只读及旧对象无新字段的情况。
- [ ] 完成真实浏览器 B01，按 V-GATE 集成并复核，提交本批文件并记录来源映射。

**Acceptance:** A01.1 三类既有对象可直接找回；A01.2 预览定位固定对象且错误状态准确；A01.3 分页/筛选无跨项目泄漏；A01.4 刷新和重进项目可继续使用，旧流程正常。

**Focused command:** `npm run build` 后 `node --test --test-concurrency=1 tests/unit/project-catalog.test.mjs tests/integration/project-catalog-http.test.mjs`。预期所有本批测试通过，未就绪外部路径不得被计算为通过。

## GR02：项目概览与真实进展

**Files:**
- Create/planned: packages/project-hub/overview.ts、apps/web/src/project-overview.tsx、research-progress.tsx。
- Modify: project-hub/types.ts、project-hub-schemas.ts、registry.ts、apps/web/src/workbench.tsx；adapters.ts补brief/run。
- Read/reuse: packages/policy/research-automation.ts、research-handoff.ts；apps/web/src/chat-workflows.tsx、permission-actions.tsx、research-action-cards.tsx。
- Test/planned: tests/unit/project-overview.test.mjs、tests/integration/project-overview-http.test.mjs。

**Interfaces:** `ProjectOverviewService.inspect(actor: Actor, projectId: string): ProjectOverviewDTO`；输出 activeDirections、progress、pendingDecisions、recentResults、sourceWarnings，均引用真实对象。

- [ ] 写失败测试 `overview_deduplicates_same_approval_and_links_real_targets`，一个批准在多组件出现时只计一次。
- [ ] 写反例 `unknown_execution_remains_unknown`、`empty_project_has_no_invented_research_goal`。
- [ ] 实现读取投影及有界摘要；不新增 job 状态机、不让 overview 改动原任务状态。
- [ ] 在现有容器展示概览和链接；将工程状态、研究结果、审查范围分开说明。
- [ ] 真实浏览器 B02 核对等待、拒绝、unknown 和重开后的状态，再做本批验证与复核。

**Acceptance:** A02.1 用户可看懂当前工作和一个具体下一步；A02.2 所有计数/状态能回查真实对象且不重复；A02.3 unknown 不误报完成或失败；A02.4 无上下文的旧项目仍可用。

**Focused command:** `node --test --test-concurrency=1 tests/unit/project-overview.test.mjs tests/integration/project-overview-http.test.mjs`，先构建当前修改。

## GR03：项目上下文、决定及跨会话接续

**Files:**
- Create/planned: packages/project-hub/context.ts、decisions.ts、apps/web/src/project-context.tsx。
- Modify: project-hub/types.ts、schemas/registry；packages/policy/research-handoff.ts 的准确绑定接点；既有会话接续 UI；adapters.ts补project-decision。
- Read/integrate: packages/research-workflows/briefs.ts、decision-service.ts、packages/storage/backup.ts、project-purge.ts、packages/policy/lifecycle.ts。
- Test/planned: tests/unit/project-context.test.mjs、tests/integration/project-context-resume.test.mjs、tests/integration/project-context-backup.test.mjs。

**Interfaces:** `ProjectContextService.propose/adopt/bind/inspect(actor, projectId, input)`；`ProjectDecisionService.propose/decide/list(actor, projectId, input)`。修订和指针结构按设计第6节，不复制或替代 ResearchBrief。

- [ ] 写失败测试 `new_context_does_not_change_old_brief_digest`；记录原 brief 固定引用，再建立项目上下文，断言原字节/摘要/已绑定 Run 均不变。
- [ ] 写反例 `context_compare_and_swap_preserves_both_drafts`、`binding_does_not_transfer_grants`、`new_draft_does_not_replace_adopted_context`。
- [ ] 追加上下文修订、决定及头指针；事务内 CAS、幂等、事件和生命周期核验，科学内容改动产生新修订。
- [ ] 实现owner保存提议/采纳/历史及“基于此继续”的固定引用预览；模型建议可由用户保存，首版不自动持久化Agent上下文。用户确认项目方向不代替 Brief.confirm 或科学 Claim 采纳。
- [ ] 在临时数据上完成备份→恢复→新记录引用检查及项目归档/恢复；有新数据库迁移时同步 backup 版本支持及 purge 结构校验。
- [ ] 真实浏览器 B03 跨会话恢复与并发冲突，完成验证、独立关键复核和交接。

**Acceptance:** A03.1 可保留多个方向并明确采纳当前上下文；A03.2 两窗口冲突保留草稿且不静默覆盖；A03.3 新会话明确继承内容但不继承旧授权；A03.4 旧 brief/报告不变；A03.5 备份恢复和归档后引用正确。

**Focused command:** `node --test --test-concurrency=1 tests/unit/project-context.test.mjs tests/integration/project-context-resume.test.mjs tests/integration/project-context-backup.test.mjs tests/unit/research-brief.test.mjs`，先构建。

## GR04：通用研究类型与方法覆盖

**Files:**
- Create/planned: packages/research-workflows/work-profiles.ts、apps/web/src/research-work-profile.tsx。
- Modify: research-brief 相关 schema/registry、apps/web/src/chat-workflows.tsx；必要的受管技能资源按现有发行规则处理。
- Read/reuse: briefs.ts、method-contracts.ts、planning-claims.ts、packages/skills/runtime.ts、packages/research-tools/dispatcher.ts。
- Test/planned: tests/unit/research-work-profiles.test.mjs、tests/integration/research-work-profiles-http.test.mjs。

**Interfaces:** `ResearchWorkProfileService.set/inspect(actor, projectId, input)`；WorkType、ResearchDepth、MethodCoverage 与设计 F04 的字符串一致，ProfileSelection 独立绑定固定 BriefRef。

- [ ] 写失败测试 `literature_and_theoretical_profiles_need_no_run_or_metric`，使用非数值判断标准完成计划创建与确认。
- [ ] 写反例 `profile_selection_does_not_upgrade_method_coverage_or_permissions`、`old_brief_digest_is_unchanged`。
- [ ] 实现可组合工作类型及覆盖说明；普通问答可不选类型，不强制构造长计划。
- [ ] 对照已有深度验证的数值方法，明确其适用范围；新增方法提示不宣称已具备自动验证器。
- [ ] 校验提示、方法读取及 UI 在既有权限和技能版本固定机制下工作；涉及技能发行时沿正式生成/验证流程，不在普通build中重写信任摘要。
- [ ] 真实浏览器 B04 完成非计算研究路径，再验证原实验计划路径未退化。

**Acceptance:** A04.1 至少两种非实验研究可创建并确认计划；A04.2 类型影响建议但不改变授权；A04.3 旧计划与数值方法兼容；A04.4 用户能辨别协助、结构化及机器检查覆盖。

**Focused command:** `node --test --test-concurrency=1 tests/unit/research-work-profiles.test.mjs tests/integration/research-work-profiles-http.test.mjs tests/unit/research-brief.test.mjs tests/unit/research-plans.test.mjs`，先构建。

## GR05：可核查的手工比较表

**Files:**
- Create/planned: packages/evidence-tables/types.ts、service.ts、revisions.ts；packages/contracts/operations/evidence-table-schemas.ts。
- Create/planned: apps/web/src/comparison-table.tsx。
- Modify: registry/inputs/outputs、ResearchApp、project-hub/adapters.ts；必要的 storage 完整性接点。
- Test/planned: tests/unit/comparison-table.test.mjs、tests/integration/comparison-table-http.test.mjs、tests/integration/comparison-table-backup.test.mjs。

**Interfaces:** `ComparisonTableService.create/inspect/structureUpdate/upsertCells/reviewCell/freeze(actor, projectId, input)`；ComparisonCellDraft、Column、CellStatus、CellReview 与设计第6.3节一致。结构修订与表头CAS版本分开，行列停用保留历史。

- [ ] 写失败测试 `manual_two_by_two_table_preserves_exact_evidence_links`，创建至少2行2列并能定位每格来源。
- [ ] 写反例 `zero_missing_not_applicable_are_distinct`、`old_column_answer_requires_recheck_after_question_change`、`concurrent_edit_keeps_original_snapshot`。
- [ ] 实现 draft/structure revision/cell revision/head/snapshot，行列定义修改产生修订，停用保留历史；按设计限制输入、分页、事务与幂等。首批userOnly，不开放Agent全表读取。
- [ ] 实现表格编辑、状态选择、引用预览和核对；数值单位与条件保留，不自动得出排名结论。
- [ ] 校验源失效、备份恢复、归档和新记录清理引用；完整来源核验复用 EvidenceService。
- [ ] 实现freeze的selectedRowIds/selectedColumnRevisionIds和固定snapshot读取；完成真实浏览器B05，冻结后修改草稿，确认旧子集快照内容不变，再复核和提交。

**Acceptance:** A05.1 自定义行列可保存并重开；A05.2 缺失语义与0准确保留；A05.3 引用可回查且失效不被掩盖；A05.4 冲突保留草稿与旧快照；A05.5 备份恢复后表格结构和引用一致。

**Focused command:** `node --test --test-concurrency=1 tests/unit/comparison-table.test.mjs tests/integration/comparison-table-http.test.mjs tests/integration/comparison-table-backup.test.mjs`，先构建。

## GR06：固定范围的 Agent 辅助提取

**Files:**
- Create/planned: packages/evidence-tables/extraction.ts。
- Modify: table schemas/registry、packages/research-tools/definitions.ts、dispatcher.ts、packages/policy/permissions.ts、session-permissions.ts。
- Modify: packages/domain/types.ts、packages/collaboration/team-service.ts、results.ts、packages/research-app.ts 的宿主Task/Attempt绑定及最终候选提交接点。
- Modify: comparison-table.tsx、research-action-cards.tsx 的任务预览与结果采纳。
- Test/planned: tests/unit/comparison-extraction-scope.test.mjs、tests/integration/comparison-extraction-flow.test.mjs。

**Interfaces:** `ComparisonExtractionService.prepare/inspect/readForTask/submitForTask/applyCandidates(actor, projectId, input)`；operation命名统一为设计第7节的evidence_table_extraction_*。prepare 产生准确范围提案；Task只提交候选，owner通过applyCandidates写入正式单元格。复用现有Agent执行，不创建新Worker或调度循环。

- [ ] 写失败测试 `extractor_can_write_only_selected_cells_from_authorized_sources`，固定表、行、列修订和资料集合。
- [ ] 写反例 `table_summary_cannot_leak_ungranted_quotes`、`revocation_invalidates_inflight_candidate_admission`、`retry_deduplicates_same_cell_source_revision`、`model_cannot_mark_cell_verified`。
- [ ] 按设计6.6划分单行、同一sourceScope、最多5格的chunk；冻结列定义、分片映射与来源。宿主创建Task专用binding/chunk字段，planDigest/inputDigest绑定范围；通用agent_delegate不接受这些字段。
- [ ] 为TeamService接入claim/active/assertRetry/submit验证；绑定当前Task/Attempt/generation/lease/模型/权限/生命周期。来源授权不适用于任务会话时阻塞，不复制owner全文绕过。
- [ ] 对artifact/evidence/text search/task result及快照/幂等回放取权限与sourceScope交集；验证fullAccess不能绕过范围，任务角色不能调用正式upsert/review。
- [ ] 接入小样本预览、候选保存、用户核对及明确扩展范围；默认2–5条为操作建议，可由用户修改。
- [ ] 每片每Attempt只做一次最终submit，在TeamService提交事务中保存candidate及TaskResult；completed/partial/blocked均结束Attempt。partial之后必须沿既有显式retry继续，不自动重派blocked任务。
- [ ] 从独立candidate记录与历史TaskResult恢复已提交候选，不依赖retry会清空的Task.result；已提交格不重复，未提交项允许重算，差异候选追加版本。逐格运行中checkpoint后置。
- [ ] 核验maxTasksPerTeam/预算和协作开关；超限要求明确缩小批次，关闭时不建队、不activate、不新claim，保留手工流程及原draining语义。
- [ ] 完成离线契约验证和真实浏览器 B06；真实Pi关键路径使用已授权额度与隔离研究样本，环境未就绪则记录blocked，不冒充live通过。

**Acceptance:** A06.1 在明确资料与列范围内生成候选；A06.2 无权材料及其他单元格无法读写；A06.3 中断/显式重试不重复已提交候选，未提交项可重算且协作关闭不暗派发；A06.4 模型不能自授核对或采纳状态；A06.5 更改列或撤销来源不会沿用旧候选的有效性。

**Focused command:** `node --test --test-concurrency=1 tests/unit/comparison-extraction-scope.test.mjs tests/integration/comparison-extraction-flow.test.mjs tests/unit/research-handoff-contention.test.mjs`，先构建。Live验收命令在实际fixture建立后记录，不能把普通npm test当live。

## GR07：证据关系与分歧矩阵

**Files:**
- Create/planned: packages/evidence/relations.ts、apps/web/src/evidence-matrix.tsx。
- Modify: evidence-table schemas/registry、project-hub/adapters.ts补evidence/claim、既有 Evidence/Claim UI入口。
- Read/integrate: packages/evidence/service.ts、acceptance.ts、invalidation.ts。
- Test/planned: tests/unit/evidence-relations.test.mjs、tests/integration/evidence-matrix-http.test.mjs。

**Interfaces:** `EvidenceRelationService.propose/withdraw/listMatrix/freezeMatrix(actor, projectId, input)`；relation值为support/contradict/background/method/qualify。输入包含固定主张内容摘要及证据绑定摘要；矩阵current/snapshot读取明确区分。

- [ ] 写失败测试 `support_and_contradiction_can_coexist_for_same_claim`，断言不同关系不自动覆盖。
- [ ] 写反例 `relation_does_not_accept_claim`、`changed_claim_requires_relation_recheck`、`revoked_source_blocks_new_valid_export`。
- [ ] 实现关系修订和矩阵投影，复用Claim原采纳和有效性校验；不创建可信度总分。freezeMatrix固定单个Claim、选定最多500条关系修订及状态、固定证据和digest，保存evidence-matrix-snapshot。
- [ ] 接入比较表与Claim界面，展示支持、反证、条件与缺口，并可打开固定证据。
- [ ] 真实浏览器B07冻结矩阵后修改Claim/关系，再查旧snapshot仍是原内容；检查失效提示，验证原Claim采纳路径没有被绕过。

**Acceptance:** A07.1 同一主张的相反证据可同时保存；A07.2 每条关系有理由和固定依据；A07.3 标签与条数不自动接受结论；A07.4 主张或来源变化需复核且历史保留。

**Focused command:** `node --test --test-concurrency=1 tests/unit/evidence-relations.test.mjs tests/integration/evidence-matrix-http.test.mjs tests/unit/scientific-claims-workflow.test.mjs`，先构建。

## GR08：可理解的行动摘要与连续工作控制

**Files:**
- Create/planned: apps/web/src/research-action-summary.tsx；仅确需共用时新增packages/project-hub/action-summary.ts。
- Modify: permission-actions.tsx、chat-workflows.tsx、host-access-control.tsx、research-progress.tsx。
- Read/reuse: packages/policy/research-automation.ts、host-access.ts、现有各对象控制操作。
- Test/planned: tests/unit/research-action-summary.test.mjs、tests/integration/research-progress-controls.test.mjs。

**Interfaces:** `summarizeResearchAction(input: ValidatedActionDTO): ActionSummaryDTO` 为确定性映射；`availableActions` 来自服务端真实能力，不是前端推测的权限。

- [ ] 写测试 `summary_matches_exact_fixed_operation`，修改固定输入时摘要必须随之变化，旧确认不能适用新操作。
- [ ] 写反例 `campaign_pause_does_not_claim_all_runs_stopped`、`unknown_command_keeps_reconciliation_action`、`permissions_change_invalidates_stale_action`。
- [ ] 用结构化输入生成做什么/来源/影响/产物/停止条件；未知资源估计显示未估算，完整参数与差异可展开。
- [ ] 将暂停、恢复、取消路由到原对象；保留项目级多智能体的作用范围说明和现有权限模式。
- [ ] 验证R01/R02是否影响本批的真实执行路径，适用且未解决时先完成条件任务。
- [ ] 完成浏览器 B08：拒绝、暂停、恢复、效果未知和重开；确认没有重复提交副作用。

**Acceptance:** A08.1 常规操作无需读JSON即可理解范围；A08.2 精确内容仍可核对；A08.3 控制按钮只执行真实支持的动作；A08.4 unknown/撤销/中断后状态准确且不重复执行。

**Focused command:** `node --test --test-concurrency=1 tests/unit/research-action-summary.test.mjs tests/integration/research-progress-controls.test.mjs tests/unit/research-automation.test.mjs`，先构建。

## GR09：成果修改、固定引用和有界导出

**Files:**
- Create/planned: packages/publications/research-table-export.ts、apps/web/src/research-artifact-editor.tsx。
- Modify: packages/publications/reports.ts、export.ts 及相关schema；apps/web/src/report-view.tsx；project-hub目录adapter补manuscript。
- Read/integrate: packages/storage/backup.ts、project-purge.ts、已有workspace写入/产物归档接口。
- Test/planned: tests/unit/research-table-export.test.mjs、tests/integration/research-results-reuse.test.mjs、tests/integration/research-results-restore.test.mjs。

**Interfaces:** `ResearchTableExportService.export(actor, projectId, {snapshotRef,format,requestKey})` 返回现有产物/导出回执；ResearchSnapshotRef的kind为comparison-table/evidence-matrix，含id/digest；format为json/csv/markdown。编辑固定报告时通过既有workspace/产物能力创建新Markdown草稿。

- [ ] 写失败测试 `editing_result_creates_new_draft_and_preserves_fixed_report`。
- [ ] 写反例 `export_uses_one_fixed_snapshot`、`csv_preserves_zero_and_missing_metadata`、`stale_source_cannot_generate_new_valid_report`、`restored_snapshot_keeps_references`。
- [ ] 实现针对明确对象与版本的局部修改，冲突时保留草稿；新稿不自动成为已审阅或已采纳成果。
- [ ] 为报告绑定两类固定快照；表格子集先经freeze选定行列，矩阵先固定选定关系，export只读取已固定范围。复用原来源失效和导出流程，不新增裸导出目录或任意文件路径字段。
- [ ] 完成JSON、CSV、Markdown选定范围导出；对CSV公式前缀做安全文本处理，附manifest表达状态/引用/不支持信息；格式能力明确。
- [ ] 临时数据备份→异地恢复→回查→适用的离线清理；真实浏览器B09核对下载的实际字节及历史报告不变。

**Acceptance:** A09.1 局部修改形成新版本且原报告不变；A09.2 新成果能回查固定比较与证据；A09.3 导出只包含所选固定范围，缺失语义完整；A09.4 并发编辑保留草稿；A09.5 恢复后引用与历史有效性正确。

**Focused command:** `node --test --test-concurrency=1 tests/unit/research-table-export.test.mjs tests/integration/research-results-reuse.test.mjs tests/integration/research-results-restore.test.mjs`，先构建。

## GR10：通用旅程与版本收口

**Files:**
- Modify: 本期实际触及的关键流程；现有CI配置按已实现验证入口接入。
- Create/planned: tests/integration/general-research-journeys.test.mjs；真实浏览器记录放当前批次验收目录。
- Modify: README.md及适用能力说明，只更新已经通过验收的范围；STATE.json/HANDOFF.md。

**Interfaces:** consumes GR01–GR09 的实际实现与证据；produces 可发布的能力清单、未覆盖清单、可恢复的交付版本，不新增产品架构。

- [ ] 完成J1文献综合、J2数据分析、J3理论或定性旅程；至少一个没有Run，至少一个有相反证据或无定论结果。
- [ ] 完成B10中途重开、切项目、单/多智能体、旧项目及导出回查；关闭协作后以手工与既有主会话辅助完成研究业务目标，不要求同一自动提取模式。截图和下载内容绑定当前构建。
- [ ] 核对单元/集成/live/browser证据分别覆盖什么；修复影响验收的阻断，不扩成全仓重构。
- [ ] 按V-GATE完成集成回归、干净构建和独立复核；只对后续修改影响的部分补验。
- [ ] 按根AGENTS完成本批提交、私密远端同步及目标SHA核对；更新实际能力说明。
- [ ] 将所有任务状态归结为done、not_applicable或明确blocked；核心任务有blocked时不得宣称完整方案已交付。

**Acceptance:** A10.1 三类不同旅程完成且无需伪造实验字段；A10.2 重开与旧数据兼容；A10.3 结果/依据/版本/失效回查完整；A10.4 当前快照验证和独立复核无阻断；A10.5 交付和未覆盖范围真实。

**Validation:** 当前根脚本 `npm run typecheck`、`npm test`、`npm run verify:build`；按影响范围运行parity/upgrade/live，并记录未运行原因。同一快照已有本批有效全量证据时可引用，不机械重复。

## R01：启动准备失败的调度恢复（条件任务）

**Files:** packages/runners/service.ts；Test/planned: tests/unit/run-launch-preparation-failure.test.mjs；复用tests/unit/run-scheduling.test.mjs。

**接口不变。** 修复launching标记所有退出路径的清理与失败状态处理，不重写调度器。

- [ ] 先核对问题是否仍存在；隔离数据中使control路径创建失败，再修复该故障并重新tick。
- [ ] 将原故障写成回归测试，失败必须显示作业被遗留launching或无法继续，不接受仅检查Set.delete被调用的镜像断言。
- [ ] 用统一生命周期清理覆盖mkdir/open/spawn等实际失败边界，保留真实错误和既有证据。
- [ ] 验证下一作业及恢复后的原作业可按明确状态继续；并发重复tick不双启动。
- [ ] 定向测试、必要集成及独立复核；记录是否适用与根因。

**Acceptance:** AR01.1 故障显式可见；AR01.2 清除故障后可恢复调度；AR01.3 不双启动且不丢历史。

## R02：宿主命令与Worker RPC最终回执（条件任务）

**Files:** apps/agent-worker/index.ts；packages/policy/host-access.ts；packages/scheduler/agent-host.ts；Create/planned: packages/policy/host-command-limits.ts（无副作用的共享时限规则）；Test/planned: tests/integration/host-command-rpc-deadline.test.mjs。

**选定最小方案：** 保留现有HostCommand同步返回契约及持久host-command记录。抽出经验证的执行时限规则（当前默认30000ms、范围1–60000ms），Worker仅对宿主命令计算有界观察期限：执行预算＋现有停止确认上界＋传输余量。当前Windows停止路径最多10秒taskkill观察再4秒close观察，可用14000ms停止预算；另设有名、可测的5000ms传输余量，上界79000ms。普通工具仍沿原期限。Host保留原输入、权限、租约与最终状态检查，不凭Worker输入免校验。超出观察期限、断连或撤销时通过原host-command ID和适用的owner检查界面核对，不能再次执行以“找回”结果。实现期若原停止路径已变化，先按新路径更新共享预算及反例，而非机械使用旧常数。

- [ ] 用受控长命令或时钟fixture证明超过RPC窗口但仍在允许范围的命令会怎样结束；核对迟到响应与取消。
- [ ] 编写回归测试：合法长命令拿到真实最终结果，超出deadline的请求保持明确终态或unknown，重试不重复执行。
- [ ] 实施共享预算与Worker观察期限，保持原HostCommand返回结构、权限和执行范围；用同callId/requestDigest复查原记录，撤权后不向已失效Agent泄露旧输出。
- [ ] 定向集成验证及独立关键复核，记录未覆盖的真实平台差异。

**Acceptance:** AR02.1 合法长命令结果不丢；AR02.2 超时/取消语义准确；AR02.3 迟到结果与重试不会重复副作用。

## 完成每一批时

仅在3–5条验收满足、必要检查通过、复核针对当前快照无阻断时设为done。更新STATE.json的evidenceRefs、verification、review、commit、remoteStatus和nextAction；HANDOFF保留下一步可执行动作。正式提交后按根AGENTS推送并核对远端，不把其他dirty内容混入。

如果缺环境、授权或真实数据，写清阻塞及解除条件；继续不依赖它的已授权任务。全部依赖被阻塞或本计划完成时停止，不自动扩展新平台能力。
