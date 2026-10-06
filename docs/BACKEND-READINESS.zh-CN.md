# 本地科研后端：试用入口与边界

文档核对日期：2026-10-01；底座为 v0.3.1，产品状态证据来自 `b4249f3`，实际任务交付为 `12921e8`。本地后端阶段已完成，当前转入按需维护；最近任务见[分组红酒记录](acceptance/flow-wine-grouped-trial/RESULT.md)及[机器证据](acceptance/flow-wine-grouped-trial/evidence.json)。范围依据 [实施计划](IMPLEMENTATION-PLAN.zh-CN.md) 与 [项目目标](PROJECT-GOAL.zh-CN.md)，旧批次统计只描述当时范围。“可用”表示链接中的具体路径已有证据，仍需本机配置与有效批准，不表示每个供应商、输入或目标都已验收。

`reference-baseline` 下的固定上游/早期能力矩阵以及旧批次“下一批”是历史来源与当时证据维度；当前排期与后端状态以本清单及实施计划为准，不能把原始快照中的未验状态当作后续功能尚未交付。

2026-10-07执行后端范围调整：只保留本地受信示例、Docker、SSH；其他执行后端、远程实例技能及占位、云资源管理和完整远程工作台部署已从当前目录和计划移除。默认内置技能为13个、参考资源8份。既有会话与显式旧配置继续按原固定版本读取，历史记录不重写。

## 统一入口

本地启动：`node --env-file=.env dist/apps/server/index.js`；已有控制器或作业活动时沿原进程继续，不为收口重启。模型配置和密钥留本地。未使用 `.env` 时可直接运行 `node dist/apps/server/index.js`，是否可调用模型由运行时状态决定。

- `GET /api/health`：源包身份 `0.3.1-experimental` 与 `local-owner-only`，不代表功能全范围或新发布。
- 直接访问本机的 `GET /api/bootstrap`、`GET /api/capabilities`：运行时状态与已保存的能力验证范围；能力清单不是当前模型/计算目标探测。
- `GET /api/operations`：当前 **132** 项精确输入/输出契约。owner 使用 `POST /api/operations/<id>`，请求为 `{projectId, sessionId?, input}`；写操作提供 `Idempotency-Key`。这里的 `sessionId` 只选择工作区，不授予 Agent 身份。
- CLI：`node dist/apps/cli/index.js operation <id> --project <id> --input-file <JSON文件> [--session <id>] [--key <id>] [--data <数据目录>]`。Pi 使用同一 Registry，由 Host 派发真实角色、Task/Attempt 与租约，无法通过 owner HTTP 请求伪造。

服务限本地回环、Host 白名单、同源 Origin 与 Fetch Metadata 边界；工作台无需访问令牌。科研数据、数据库、原生会话和认证文件保留本机；源码远端备份不等于科研成果对外发布。

## 可用与受限清单

| 分类 | 可走通的后端入口 | 已证明范围与证据 |
|---|---|---|
| 可用 | `experiment_source_list/read/diff`、`workspace_prepare_from_revision` | 指定实验修订与CAS来源，不覆盖项目初始副本；[源码与实现](acceptance/flow-implementation/RESULTS.zh-CN.md)，[真实证据](acceptance/flow-implementation/live-evidence.json) |
| 可用 | `development_prepare/submit/inspect/logs`、`development_review_prepare`、`reviewed_change_prepare`；批准后 `run_prepare/submit/inspect/logs` | 固定源码→隔离测试→独立审查→批准新子实验→正式CPU Docker运行；测试、整合、正式运行各自批准。[首条闭环](acceptance/flow-implementation/RESULTS.zh-CN.md) 与 [正式Run](acceptance/flow-run/formal-live-evidence.json) |
| 可用（有限） | `working_grant_*`、`run_grant_*`、`discovery_grant_*` | 主协调会话的精确私有文件/固定测试、冻结RunIntent集合、来源/请求范围及永久计次；[Working](acceptance/flow-working-grant/RESULTS.zh-CN.md)、[Run](acceptance/flow-run-grant/RESULTS.zh-CN.md)、[Discovery](acceptance/flow-discovery-grant/RESULTS.zh-CN.md)，各目录保留 `evidence.json` |
| 可用（有限） | Team中的 `literature_discover` / `paper_read` 与 `discovery_grant_prepare({taskId})`；`analyst` 的 `run_submit` 与 `run_grant_prepare({taskId})` | Task仅支持单项Crossref默认关键词/精确DOI元数据，以及analyst冻结Run集合；Grant与Team分别批准。[Task发现](acceptance/flow-task-discovery-grant/RESULT.md)、[DOI](acceptance/flow-task-doi-retrieval/RESULT.md)、[Task Run](acceptance/flow-task-run-grant/RESULT.md)及各自机器证据 |
| 可用（来源有限） | `connector_status`、`literature_task_create/inspect/cancel/retry`、`document_from_paper`、`document_list/inspect`、`document_parse_prepare/submit`、`document_pages/page_read` | 文献持久任务与Team Task是不同对象。元数据/摘要不算全文；指定arXiv PDF、PubMed摘要、PMC OA版本原件/派生文本已有证据；[文档核心](acceptance/flow-documents/RESULTS.zh-CN.md)、[PubMed摘要](acceptance/flow-pubmed-abstract/RESULTS.zh-CN.md)、[PMC原文](acceptance/flow-pmc-oa-fulltext/RESULTS.zh-CN.md)、[表格派生文本](acceptance/flow-pmc-table-text/RESULTS.zh-CN.md)、[PaperRead转文档](acceptance/flow-paper-document/RESULT.md) |
| 可用（显式授权） | `text_corpus_grant_*`、`text_evidence_search`、`evidence_register/read` | 固定文档文本进入获准语料，原文与定位可回查，网络取得的文档不自动加入白名单；[文档语料](acceptance/flow-document-corpus/RESULTS.zh-CN.md)、[PMC Agent授权](acceptance/flow-pmc-agent-grant/RESULTS.zh-CN.md)。后者为受控Agent身份验收，未冒称真实Pi检索 |
| 可用 | `campaign_plan_inspect`、`campaign_candidate_prepare`、`campaign_candidate_attach`、`campaign_comparison`、`campaign_decision_submit` | 固定方案、实测比较、失败保留与明确停止；[Wine](acceptance/flow-wine-iteration/RESULTS.zh-CN.md)、[Anscombe](acceptance/flow-anscombe-comparison/RESULTS.zh-CN.md)。Wine固定拆分存在重复记录；Anscombe只有11点留一评估，不能据此声称外部泛化或科学发现 |
| 可用（有限） | `skill_package_import`、`skill_package_review`、`skill_bundle_configure`、`skill_package_revoke`、`research_skill_read` | 固定技能版本、声明依赖、启用/回滚及历史保留；[技能生命周期](acceptance/flow-skills/RESULTS.zh-CN.md)、[内置升级](acceptance/flow-builtin-skills/RESULTS.zh-CN.md)、[二进制资源](acceptance/flow-skill-binary/RESULTS.zh-CN.md)、[diagram](acceptance/flow-diagram/RESULTS.zh-CN.md)。资源审阅不授予脚本执行权限 |
| 可用（有限） | `manuscript_create`、`publication_prepare/submit/result`、`publication_review_prepare/inspect/list`、`report_create/inspect/reference_read/export` | 固定Docker镜像的三引擎/Bib编译、图表与可编辑TeX/PDF、独立文本审查和本地成果包；[Anscombe交付](acceptance/flow-anscombe-paper/RESULTS.zh-CN.md)、[真实Pi审查](acceptance/flow-anscombe-paper-review/RESULTS.zh-CN.md)。编译成功/accept不证明排版与科学正确；失效来源禁止新交付，旧字节保留 |
| 可用（有界入口） | `session_list`、`session_view`、`session_message_read`、`run_list`→`run_inspect`、`report_list`→`report_inspect`；`model_http_inspect/configure`、`compute_queue_inspect`、`compute_capacity_configure`、`agent_capacity_inspect/configure` | 会话/Run/报告稳定分页、UTF-8日志窗口、事件恢复、模型HTTP/Worker/计算分别计量；[会话](acceptance/flow-session-history/RESULTS.zh-CN.md)、[Run分页](acceptance/flow-run-history-page/RESULT.md)、[报告分页](acceptance/flow-report-history-page/RESULT.md)、[HTTP配额](acceptance/flow-model-http/RESULTS.zh-CN.md)、[调度](acceptance/flow-scheduler/RESULTS.zh-CN.md) |
| 可用（离线同平台） | CLI `backup create --data <dir> --out <backup> --offline`、`backup verify --from <backup>`、`backup restore --data <new-dir> --from <backup> --offline --relocate` | 全库/CAS/原生Pi/Git历史校验与异址重开；目标必须不存在，迁移后仅新副本活动。[原址恢复](acceptance/flow-data-backup/RESULTS.zh-CN.md)、[异址续研](acceptance/flow-data-relocation/RESULTS.zh-CN.md)、[新增实体恢复](acceptance/flow-rich-backup-restore/RESULT.md) |
| 受限 | `GET /api/projects/:id/state` 与连接器历史总览 | 多类历史仍全量读取；文档/连接器部分列表仅最近30项，不能据此判断旧ID不存在。有界Run/报告入口不等于总览已分页，实际大项目阻断再修 |
| 受限 | PDF/PMC结构、用量与科学解释 | PDF阅读顺序/表图结构与扫描OCR仍有限；PMC表格文本不恢复复杂网格语义。SDK用量观察不等于HTTP次数/真实账单，未取得实际账单不估算费用 |
| 需求触发 | 更多Task授权、RunGrant参数语言、新技能/模板、压力/恢复矩阵、产品Git发布/Overleaf | WorkingGrant仍限主协调会话；现有流程能满足任务时不扩权。发布/同步需要明确内容、目标与授权，当前代码备份仓库不是成果发布入口 |
| 环境待验 | bioRxiv/OpenAlex原PDF、自动root唤醒、外部SSH目标 | [bioRxiv 429/OpenAlex缺凭据](acceptance/flow-biorxiv-original-pdf/RESULTS.zh-CN.md)；自动唤醒目前只有IPC证据。SSH已有[隔离回环](acceptance/flow-ssh-run/RESULTS.zh-CN.md)和[嵌套源码修复](acceptance/flow-ssh-nested-umask/RESULT.md)，不证明外部主机 |
| 需求触发，尚未接入 | GPU资源声明与设备分配 | 当前正式运行契约只有CPU、内存等资源；需要补充GPU契约、容器设备接线及目标环境验收，不属于新增执行后端 |
| 暂缓 | PR09前端布局/完整重构；PR14桌面/更新/应用回滚/团队产品协作 | 用户恢复后另定范围。已有内部Team/Reviewer工作流保留 |

## 按需维护：新任务所需输入

1. 论文DOI/链接或本地代码、数据路径；固定版本/提交，允许读取的文件与许可/隐私限制。
2. 研究问题、对照、数据拆分、主指标/单位、成功与停止条件；已有协议则沿用，尚未确定则先保存限制。
3. 本批只选一项交付：基线复现、一个候选的实测比较、报告，或图表/可编辑论文/本地包；只执行所需步骤。
4. 可用CPU Docker/其他目标、次数与时间预算；模型配置留本地，缺环境步骤单列。

必要人工操作由所选流程决定：启用外部来源/固定输入；批准精确开发/正式运行或有界Grant；需要委派时另批Team；整合/文档解析/文稿构建/成果外发仍按现有门槛。保存批准ID及原输入/源码/测试/Run/比较/交付物ID，记录实际耗时、用量与失败。首次收口时尚无新的任务；随后用户授权主代理拟定，[分组红酒任务](acceptance/flow-wine-grouped-trial/RESULT.md)已完成真实HTTP/CLI/Pi试用并记录表现。新任务按需启动，实际账单仍未知。

本机试用成果使用短记录里的独立数据目录与固定ID回查。代码仓库不是完整科研数据备份；分组红酒任务的数据库、原始输入/产物和原生会话保留在本机数据目录，不随代码克隆取得，沿已有离线备份/恢复流程保存。
