# 实施状态

## 当前状态：本地后端阶段完成，按需维护（2026-10-01核对）

当前状态依据 [项目目标](PROJECT-GOAL.zh-CN.md) 和 [实施计划](IMPLEMENTATION-PLAN.zh-CN.md)：后端收口及实际任务试用已完成，新任务按需维护，只补实际阻断。PR01–14长期范围保留；前端布局和PR14桌面/团队协作暂缓。环境待验项保留未证明范围。

产品底座与公开状态证据来自 `b4249f3`，最新实际任务交付为 [12921e8](https://github.com/hailuohl/pi-research/commit/12921e80f9a7f87c9abf0a639b238a4737db6931)。两者分别说明软件能力和任务表现；以下“已验”仅证明记录中的具体路径，不等于PR全范围完成。

后端入口和“可用/受限/需求触发/环境待验/暂缓”详见 [试用清单](BACKEND-READINESS.zh-CN.md)。当前输入、输出与工具目录均为132项；公开能力元数据已按后批实测纠正，自动root唤醒仍缺真实Pi证据。用户已授权主代理拟定实际任务，[分组红酒试用](acceptance/flow-wine-grouped-trial/RESULT.md)完成两项真实Run、一次Pi分析、Stop、报告与CLI/重开回查；必要批准、耗时、用量、局限和保留证据已记录。当前阶段转入按需维护，长期范围不因此算作已完成。

| 范围 | 当前证据与可用边界 | 后续触发条件 |
|---|---|---|
| PR01–06 | 已有构建/Pi、指定源码、受控开发测试、Git/CAS及本机CPU Docker底座 | 只补实际版本、恢复或任务阻断；GPU/其他目标不在CPU证据范围 |
| PR07 | 会话、日志/事件恢复及 [Run](acceptance/flow-run-history-page/RESULT.md)/[报告](acceptance/flow-report-history-page/RESULT.md) 游标入口已验；旧项目state仍全量读取多类历史 | 大项目实际卡顿/读取量、磁盘增长或恢复问题触发修复；不机械为每种实体加分页 |
| PR08 | 主协调三类Grant、[Task Crossref发现](acceptance/flow-task-discovery-grant/RESULT.md)、[精确DOI读取](acceptance/flow-task-doi-retrieval/RESULT.md)及 [analyst Task RunGrant](acceptance/flow-task-run-grant/RESULT.md)已验 | WorkingGrant仍限主协调会话；Task扩展、更多来源/角色、参数范围语言及多Agent收益按实际需求启动 |
| PR09 | 既有React/API路径与历史证据保留 | 前端布局及全面重构暂缓；当前只验后端 |
| PR10 | 固定PDF/页段、语料授权、[PubMed摘要](acceptance/flow-pubmed-abstract/RESULTS.zh-CN.md)、PMC原文/表格文本、[PaperRead转文档](acceptance/flow-paper-document/RESULT.md)已验 | PDF阅读顺序/表图结构仍未知；复杂表格语义未恢复；[bioRxiv/OpenAlex原PDF](acceptance/flow-biorxiv-original-pdf/RESULTS.zh-CN.md)保留环境待验 |
| PR11–12 | 技能审阅/固定/回滚、[静态资源](acceptance/flow-skill-binary/RESULTS.zh-CN.md)、[diagram](acceptance/flow-diagram/RESULTS.zh-CN.md)、Wine/Anscombe比较/图表/可编辑论文及 [独立文稿审查](acceptance/flow-anscombe-paper-review/RESULTS.zh-CN.md)已有证据 | 新模板、图表或领域写作以真实任务所需为限；审查接受不证明科学结论 |
| PR13 | [SSH隔离回环](acceptance/flow-ssh-run/RESULTS.zh-CN.md)及 [嵌套源码修复](acceptance/flow-ssh-nested-umask/RESULT.md)已验；2026-10-07执行后端收敛为本地受信示例、Docker、SSH | 外部SSH目标仍按实际环境验收；其他后端、实例与云资源管理、完整远程工作台部署已移出计划 |
| PR14 | 离线备份、异址迁移与 [新增科研实体恢复](acceptance/flow-rich-backup-restore/RESULT.md)已验；当前限同平台、单活动副本 | 产品Git发布、Overleaf、跨平台恢复按需；桌面与团队协作暂缓 |

后端收口与本次用户授权拟定的真实任务均已交付。新任务仍需明确论文/代码/数据、协议与交付；不循环追加示例、授权变体或无需求工程矩阵。前端/桌面/团队暂缓，环境待验和长期范围继续保留。

## 2026-09-29及更早的历史状态快照

以下原文、旧“最新/下一批”表述和旧统计为历史记录，保留以解释当时范围；不覆盖上面的当前排期和新增交付，也不能直接用作当前待办。

用户范围调整（2026-09-29，最新）：桌面安装包、自动更新及应用版本回滚，自建账户、组织、托管实例和用量账本服务已从目标移除。用户重新要求模仿OpenResearch前端；布局与关键交互纳入PR09，按真实页面和一条流程分批对齐，不整体重做。PR01–14编号保留，现有权限、预算、数据恢复、技能回滚及在途改动保留。具体范围以[修订实施计划](IMPLEMENTATION-PLAN.zh-CN.md)为准。

本次仅修订目标与交付顺序，没有新增软件能力或重跑科研作业。下文旧批次记录及其“完整范围/下一批”表述是当时记录；当前排期以修订计划和最新批次为准，原证据不改写。

当前进展：[异址迁移](acceptance/flow-data-relocation/RESULTS.zh-CN.md)已完成固定验收：真实旧数据A→B→C、历史/产物回查、同一原生Pi ID在C续接及一次单独批准的Docker开发测试均有实测；原件和冻结批准身份保留。Docker首次启动故障仍留证。下一批按PR09对齐本机OpenResearch的一条前端流程；桌面分发和自建托管账户服务已移出目标。

上一交付：[离线完整备份与原址恢复](acceptance/flow-data-backup/RESULTS.zh-CN.md)及[机器证据](acceptance/flow-data-backup/evidence.json)。真实旧项目48文件、52条记录及原生Pi历史保持，schema5→8后仅新增容量记录；浏览器分页/刷新通过，无新Pi/计算。全量742通过、0失败、22跳过，447文件干净构建一致，独立复核无阻断。

新增交付：[受控文本写入恢复](acceptance/flow-text-write-recovery/RESULTS.zh-CN.md)与[机器证据](acceptance/flow-text-write-recovery/evidence.json)。提交前/后强制终止与外部冲突路径实测通过，709条旧记录在备份迁移后原字节保持。全量733通过/0失败/22跳过；复核竞态修复后相关13通过/1平台跳过，最终441文件干净构建一致。前端布局暂缓、未提交改动保留；原控制器未重启，保护在新启动进程中生效。原PR01–14剩余范围继续推进。

当前目标：基于 v0.3.1 和 Pi 唯一执行内核，对齐 OpenResearch 的科研能力及主要前端布局/交互，继续[按用户流程交付](DELIVERY-FLOWS.zh-CN.md)。首条“读取指定源码→真实 Pi 实现→开发测试→独立审查→批准整合→正式运行→结果回查”与异址迁移已验收；复用这些成果，下一批按PR09对齐本机参照的一条浏览器流程，再补真实论文/代码复现、实测比较与图表论文交付。额外工程矩阵按需排期；不把单/多Agent收益提升当作功能验收前提。

| 关卡 | 当前状态 | 剩余或按需范围（按流程排期，不是每批前置） |
|---|---|---|
| PR01 | 构建、固定来源、双版回归、SDK 契约、无依赖启动已验；智谱真实工具调用及首条科研闭环已验 | 固定上游交互曾仅静态核对；本机实例版本/源码定位及一条主流程的真实前端页面基线待本批记录 |
| PR02 | 125 个统一 Registry 动作契约；文献、技能、固定文稿、独立批准构建、论文审查、固定研究方案及有限私有实现/运行/文献发现授权共用受控接口 | 前端全面类型消费随 PR09，不能以单条旅程替代所有传输及边界场景验收 |
| PR03 | 指定版本/CAS、范围读取、文件差异、工作区与团队来源绑定、撤销及回滚检查通过；真实 Pi 从指定二阶来源实现，一阶项目副本保持不变。受控文本写入已补持久恢复：真实强制终止后区分提交/未提交，外部修改隔离，旧审批/快照/记录保持 | 目录替换等其他文件系统事务、更多文件系统与迁移恢复矩阵随 PR05/07/14 完善；旧控制器需在无在途任务时更新 |
| PR04 | SandboxJob/DevelopmentTask、固定容器 Python、隔离/取消/服务关闭/worker 恢复与源码绑定已验；浏览器人工审批、首次失败、同原生 Pi 会话修复及重新批准后 5/5 开发测试已实测 | 宿主硬配额、自动清理及更广目标环境随后续关卡 |
| PR05 | 显式启用受管项目 Git、独立 worktree、完整源码差异/模式、提交与持久回执恢复已接入；工作台私有源码入口及测试/审查/提案/Git/CAS 关联已进入首条闭环 | 完整并发/迁移矩阵进一步验收；本条闭环不代表 PR05 所有场景已完成 |
| PR06 | trusted-example 与 Docker 真实适配器已接入；非白名单 Python 正式 Run、单独批准、归档及不重复恢复已实测 | GPU/其他目标另验；当前只证明本机 Linux CPU Docker 路径 |
| PR07 | 会话目录/消息页已按索引及稳定游标读取；5001会话/20000消息固定规模查询实测，UTF-8原文窗口与旧记录迁移保持已验。模型HTTP请求级共享限流已真实验收：2 Worker、1 HTTP槽位，两请求依次200、无重叠；暂停/取消/unknown/跨控制器及流式释放已检查，独立于Worker和计算配额。共享计算队列覆盖正式/开发/文档解析/文稿构建；Worker 槽位、资源配置、有界日志及事件恢复已验。文稿 worker 同容器恢复、取消和共享额度已实测；真实新任务提交后原生会话正常 idle，用户取消仍为 interrupted/aborted | 其他SDK传输与更多供应商HTTP实测、其余历史实体分页/虚拟化、完整性能迁移、硬磁盘配额和其他目标仍待验；超时前在途异步操作仍依赖原租约边界 |
| PR08 | 主协调会话DiscoveryGrant已验：固定Crossref检索及命中读取，真实Pi两次HTTP成功、越界/超额拒绝，刷新保留；后台原授权、并发计次、发送期限及撤销传播已检查。主协调会话RunGrant固定清单集合已验：2清单额度1、真实运行成功、超额拒绝与同Run回执重放；主协调会话WorkingGrant已真实验收：一次批准精确私有文件与固定测试范围，2次提交先失败后修复成功，越界/超额拒绝、刷新保留；固定方案/对照/来源、受审修复、两轮比较与停止已真实验收；999阶失败保留，真实Pi修复至3阶，经实际6项测试/独立审查/整合后Run，再从该Run来源运行4阶并停止；方案和比较进入报告/包，来源撤销阻断新运行及交付 | Task级授权、RunGrant参数范围语言、其余授权/资源/故障矩阵及单/多Agent收益对照仍待完成；当前只证明合成数据的软件流程，未证明科学有效性或多Agent收益 |
| PR09 | 旧会话检索、历史双向分页、长消息窗口与刷新锚点已验。React/ReactDOM、本地构建和多条真实浏览器流程已迁移与验收 | **新增优先：**基于本机OpenResearch版本和一条真实流程，逐页对齐布局与交互。完整API类型、大历史列表、下载落盘及部分窄屏问题按真实旅程影响排期；不重做已验收的流程 |
| PR10 | 核心流程已验：四源实网成功、PubMed 网络失败单列；不可变 DocumentVersion、arXiv v1/v2、v1 隔离解析 15 页及页段回查完成。中文/扫描页、共享配额、恢复留证；文档证据已进入固定报告和离线包 | PubMed 环境、OpenAlex/bioRxiv 原 PDF 实网、自动结构抽取、完整跨源分页/覆盖评估、显式文档语料及 Agent 细粒度文档授权仍待完成 |
| PR11 | 技能审阅/撤销、固定 bundle、能力预检和回滚已实现；内置旧发行29文件归档、显式升级/精确回滚及旧复合包读取已验，真实IPC证明在途与Host重开保持旧版；新版 paper 经真实 Pi 写作、修订及独立审查，固定源产物直接进入文稿构建；新任务正常结束已验 | 上批四个 Pi 会话的 failed/中止历史保留；原生 UI 上传、二进制资源、diagram/更广科学写作、其余指南更新、其他后端和大历史分页仍待完成 |
| PR12 | 固定报告/PDF 页段、不可变文稿、隔离三引擎/Bib 构建、错误定位/PDF 预览已验；真实模型 TeX 原 ID 经独立批准生成3页 PDF；研究方案与比较JSON进入固定报告/包；同构建全部论文审查冻结进新报告及成果包，审查新增/变更/撤销会阻止过期报告的新导出，旧格式报告兼容 | 更广科学写作、图形逐点数值关系及更多模板/diagram 能力仍待完成。执行来源关联与审查接受均不等于科学数值证明；未发布到远端 |
| PR13 | 待实施 | SSH→Slurm 等真实后端、远程工作台，按目标分别验收 |
| PR14 | 离线完整备份、校验与原址恢复已验。异址URI与旧路径映射已实现；真实A→B→C、新文件/产物、历史回查及原生文件保留已验，冻结记录不重写，认证不打包；Git/有限授权迁移有集成测试 | 本批真实Pi续接和Docker执行待环境恢复，沿既定条件收尾；其他平台、目录事务恢复、Git发布与Overleaf同步按需。桌面分发与自建托管账户/组织/实例/账本已移出目标。仅离线、同平台、单活动副本，不支持覆盖式恢复 |

最近交付：[历史会话分页短记录](acceptance/flow-session-history/RESULTS.zh-CN.md)和[机器证据](acceptance/flow-session-history/evidence.json)。原真实Pi会话13条内容逐项匹配，历史页刷新保持；长窗口另用明确测试通知验收，无新模型或计算。707条旧记录的业务数据及18份原生文件保持。754项首次全量仅空消息兼容失败，修复后相关13+1通过；438文件最终干净构建一致。目录状态自动刷新、其他实体分页及完整性能矩阵继续保留。

上一批交付：[正式React工作台简短结果](acceptance/flow-react-workbench/RESULTS.zh-CN.md)及[机器证据](acceptance/flow-react-workbench/evidence.json)。真实Pi单次消息、切换、旧报告引用与断线恢复通过，正常与恢复后控制台0错误；旧业务记录及17份原生历史保持。714通过、0失败、22跳过，430文件干净构建一致。窄屏聊天溢出与业务API完整类型仍保留；未重启模型或计算。

上一批交付：[模型HTTP排队简短结果](acceptance/flow-model-http/RESULTS.zh-CN.md)和[单份机器证据](acceptance/flow-model-http/evidence.json)。两个真实Pi会话共享一个HTTP槽位，两次200且无重叠，均正常idle；浏览器设置、排队和刷新保留通过。旧业务记录与15份原生历史不变；712通过、0失败、22跳过，430文件干净构建一致。未启动Docker。SSH目标信息尚待提供，不阻断其他本地范围。

上一批交付：[DiscoveryGrant简短结果](acceptance/flow-discovery-grant/RESULTS.zh-CN.md)与[单份机器证据](acceptance/flow-discovery-grant/evidence.json)。固定两次HTTP实测成功，真实Pi正常idle、刷新保留元数据和计次；到期/撤销/并发/后台恢复相关检查通过。集中回归唯一清单遗漏修正后合计700通过、0未解决失败、22跳过；424文件干净构建一致。旧业务记录与14份原生历史不变；Task级授权及原计划其余缺口继续。额度拒绝详情和状态文案留PR09待办。

上一批交付：[RunGrant简短结果](acceptance/flow-run-grant/RESULTS.zh-CN.md)和[单份机器证据](acceptance/flow-run-grant/evidence.json)。一次批准有限冻结集合、永久计次及下游撤销已通过实际关键路径；同时修复实测IPC退出顺序阻断，回执复验没有重跑已成功的Run。该批原始结果保留；当前DiscoveryGrant已在上述最新批次完成，不重复WorkingGrant。

上一批交付：[WorkingGrant简短结果](acceptance/flow-working-grant/RESULTS.zh-CN.md)与[单份机器证据](acceptance/flow-working-grant/evidence.json)。按4条固定条件完成指定私有文件、固定测试范围和有限提交次数；真实Pi/Docker/浏览器只走一次关键路径，原始日志留在验收库。后续每批沿用一条流程、相关开发检查、集成集中验证和轻量交付，原PR01–14及已有成果保留。

上一批证据：[固定研究方案与有界修复](acceptance/flow-bounded-research/RESULTS.zh-CN.md)、[真实执行与解包](acceptance/flow-bounded-research/live-evidence.json)、[撤销验证](acceptance/flow-bounded-research/revocation-evidence.json)及[零额度阻断](acceptance/flow-bounded-research/budget-evidence.json)。当前新增108个统一动作中的4个owner操作，原生表单固定方案、来源与停止条件，Repair走私有实现/真实测试/独立审查/批准整合，Promote沿所选实测Run来源进入下一轮。决定不批准正式计算，失败Run保留且修复次数不能借子节点重置。

实际新增3个Run（999阶无结果失败、3阶受审修复、4阶第二轮），复用既有2阶对照；三项有效MSE分别约5.035e-5、5.136e-5、5.142e-5 squared-target，两项候选未改善。活动2/2轮明确停止，科研判断仍pending；真实实现/reviewer均idle，5+3条SDK观察不等于HTTP数或账单。报告d6b1a226…包含3份固定方案与比较，成果包71,348字节、57条目/55固定文件实际解包一致。撤销修复审查原批准后，新报告/新包及普通后代Run入口均拒绝，旧字节保留；旧论文报告仍current/verified。基线433条旧记录仅副本2条/原库1条lease变化，旧业务记录和10份原生文件不变，无新编译。

最终全量 **650 pass / 0 fail / 22 skip（672项）**，干净安装/构建/类型检查 **385个文件一致**，独立复核无本批阻断。验收副本遗漏Git对象已单独恢复；三阶/四阶supervisor曾遇2/5次SQLite锁错误后完成且未重复执行。Reviewer“stderr为空”的摘要误述和ValueError边界测试区分度限制原样留证，不据accept推断科学正确。完整授权、性能矩阵、单/多Agent对照、其他原PR01–14范围继续推进。

上一批证据：[固定论文审查与成果包绑定](acceptance/flow-publication-review/RESULTS.zh-CN.md)、[实际执行与包核验](acceptance/flow-publication-review/live-evidence.json)及[撤销副本](acceptance/flow-publication-review/revocation-evidence.json)。精确成功构建经另次批准交给只读 Reviewer，固定输入、授权和任务结果；两项针对同一原 3 页 PDF 的真实智谱审查均为 accept/current、会话 idle。首项有 4 次 RPC 超时，结果落盘但原生无成功提交回执；修正 Host 的逐 delta 深校验后，第二项无超时并以成功回执结束。17 条 SDK 用量观察不等于 HTTP 请求数。全部同构建审查自动进入新报告与 `reviews/<id>.json` 包文件；无审查可导出但明确未审查，审查不能生成 Claim。

本批成果包 **1,319,676 字节**，SHA-256 `4b3d8fa95dd1a067c73cce7b5de5b52cb3ed2a4a0189f46ef9b1bc5c3a4f58e1`，38 条目中 36 个固定文件逐字节匹配。隔离副本撤销第二项批准后，原报告 stale，新导出被拒，旧正文和旧包原字节保留；旧幂等回执只重放历史包，主副本仍 current。旧 353 条记录中除原库与副本各一条 workspace-lease 正常变化外，352 条不变；8 个旧原生文件摘要不变，无新数值 Run 或编译。最终全量 **626 pass / 0 fail / 22 skip（共648）**、干净构建 **378 个文件一致**；修复前的 645 项全量保留为历史而非最终结果。相关契约/领域/开发/报告/UI/Host 检查通过，独立审查发现的授权、UI 竞态与 Host 缓存读取问题均已关闭。旧稿摘要短写措辞和 4 处排版警告仍保留；模型未目视 PDF，本批未作新科学判断。

上一批[助手正常结束与用户取消](acceptance/flow-worker-finish/RESULTS.zh-CN.md)及[真实执行记录](acceptance/flow-worker-finish/live-evidence.json)保留。Worker 在成功 `task_result_submit` 回执后结束 SDK turn，Host 不再 abort 已完成任务。真实智谱任务 `b46443b4…` 为 completed/accepted，原生会话 `63fe7ff0…` idle、无错，最后保留提交回执；4 条 SDK 用量观察不等于 HTTP 请求数或账单。另一次用户停止使新 root 会话 `e1e62038…` 为 interrupted、generation 2，941 条 delta 与原生 aborted 记录保留，不据此声称用量为零。旧 327 条记录中，原库与副本各仅同一条 workspace-lease 正常变化，其余 326 条不变；6 个旧原生文件保留，含上批 4 个 failed 会话。旧报告仍 current/verified，无新增数值 Run。

正常结束批次全量 **603 pass / 0 fail / 22 skip（共625）**；相关 **59/59**，最终干净构建 **371 个文件一致**，独立代码复核无阻断。真实输出中的 MSE 科学计数数值正确，但“无量纲”措辞与原契约 `squared-target` 不一致，保留为非阻断内容问题，未做科学验收。超时后的新请求被拒绝；超时前在途异步操作仍按原租约检查，并未统一撤销。

上一批[真实论文草稿、编译与独立审查](acceptance/flow-paper-writing/RESULTS.zh-CN.md)、[实际执行与包核验](acceptance/flow-paper-writing/live-evidence.json)及[浏览器记录](acceptance/flow-paper-writing/browser-evidence.json)保留。真实 Pi 初稿经 disputed 审查和主代理目视检查后修订，再由新会话给出技术范围 accept；原审查796字符说明不完整，缺失部分未补造。修订稿保留原 artifactId，单独批准编译生成[3页 PDF](acceptance/flow-paper-writing/document.pdf)，保留4处排版警告和摘要短写措辞问题。报告纳入原 Run、源文件与协议，1,285,237字节包实际解包32条目，30个固定文件逐字节一致。普通论文审查单独留证，不混称包内原 Run 的代码审查。

论文写作批次全量 **583 pass / 0 fail / 22 skip（共605）**；窄屏完整摘要显示修正后相关 **22/22**，最终干净构建 **371个文件一致**，独立代码复核无本批阻断。四项模型任务保存 completed 结果、finished attempt，但四个原生会话均为 failed/模型请求已中止，未改写成功；24条用量观察不等于24次HTTP请求。原库173条记录和两个原生文件不变；副本172条旧记录不变、1条工作区租约正常续期，另在 compute_limits 表显式将副本共享内存512改为1024 MiB。无新增数值Run，原科研判断仍 pending。

上一批[内置技能升级与历史绑定回查](acceptance/flow-builtin-skills/RESULTS.zh-CN.md)、[旧项目与字节比对](acceptance/flow-builtin-skills/live-evidence.json)及[真实 IPC](acceptance/flow-builtin-skills/ipc-evidence.json)保留。旧668发行14模块、29文件与原提交一致；新2a5141发行只更新paper/reports。浏览器升级、精确回滚、再次升级时保留自定义v1，旧原生会话保持原70f72324包，新会话显式paper固定ec658764；刷新/390px路径通过。

内置升级批次全量 **576 pass / 0 fail / 22 skip（共598）**；之后旧配置回执兼容修复相关 **8/8**，实际 **3 条旧回执原样回放**。最终干净构建 **371 个文件一致**，独立复核无未解决阻断。真实IPC证明在途及Host重开保持旧版、未知包fork前拒绝；重试与损坏拒绝由领域测试另证。副本初缺5个相对CAS文件被正确拒绝，补入原始摘要字节后通过。原库95条记录未改，副本94条旧记录不变，唯一配置记录按显式操作变化，原生Pi文件摘要保持不变。本批无新模型调用或编译。

上一批[固定文稿进入报告与离线成果包](acceptance/flow-publication-report/RESULTS.zh-CN.md)、[实际解包](acceptance/flow-publication-report/live-evidence.json)与[浏览器回查](acceptance/flow-publication-report/browser-evidence.json)保留。报告 `134330d1…` 绑定原文稿/构建/PDF、绘图脚本和同作业 CSV，200,914 字节包实际解包 25 个条目，23 个固定文件与原字节一致；桌面/390px、精确文稿回跳与刷新通过。

文稿交付批次统一回归 **563 pass / 0 fail / 22 skip（共 585）**；之后 CSV/TSV 预览修复相关 **22/22**，最终干净构建 **368 文件一致**。固定批准身份 P2 已修复并独立关闭，CSV 回查修复亦复核通过。主验收原 91 条记录不变；旧真实 Run 报告在备份上仍 verified/current，173 条旧记录保持原字节。单独撤销副本证明历史可读、新报告/新导出拒绝。本批无新模型请求、重新编译或远端发布。

上一批[固定文稿、隔离构建与错误回查](acceptance/flow-publication/RESULTS.zh-CN.md)、[真实构建](acceptance/flow-publication/live-evidence.json)与[浏览器](acceptance/flow-publication/browser-evidence.json)保留。缺图真实失败准确定位 `main.tex:13`；保留中间中文溢出版本，修订断行后生成 2 页、35,395 字节、3 轮收敛的[实际 PDF](acceptance/flow-publication/compiled-document.pdf)。固定图形绑定此前 Sandbox 来源，未冒称正式 Run 或科学结果；批准失效的历史 PDF 保持原字节。

文稿批次统一回归 **546 pass / 0 fail / 22 skip（共 568）**，最后能力目录元数据修正后相关 **17/17**；最终干净构建 **368 个 dist 文件一致**。最终镜像 18 个实际探针、前一镜像同容器恢复/共享额度/取消与超时分别留证，独立复核无本批阻断。旧 52 条记录不变，新增模型请求 0。XeLaTeX 中文已验；Lua 中文字体在 768 MiB 下被杀并准确失败。输出监控不是宿主硬磁盘配额。

上一批[技能审阅、固定版本与启动预检](acceptance/flow-skills/RESULTS.zh-CN.md)、[真实 Pi/容器记录](acceptance/flow-skills/live-evidence.json)与[真实 IPC](acceptance/flow-skills/ipc-evidence.json)保留。v1/v2 ZIP 经 CLI 导入，浏览器审阅/启用/选择、配置回滚与撤销通过；原生文件选择器提交尚未确认。真实 Pi 保存 v1 代码与批准请求后 aborted；保存的固定作业经浏览器批准后成功且完整，生成 480×320 PNG、21 点 CSV，源码/产物摘要和数值独立核对。撤销后的新会话 generation=0、Worker/model records=0。

技能批次统一回归 **521 pass / 0 fail / 3 skip**；随后新增真实 IPC **1/1**，无产品源码变化。干净构建 **352 个 dist 文件一致**。原生 SDK `/skill:` 绕过摘要读取的 P2 已关闭并经真实离线 SDK/独立复核；旧 78 条文档记录保持不变，历史报告仍 current/verified。完整 PR11 与论文执行器没有因此宣称完成。

上一批[PDF 页段进入报告与交付](acceptance/flow-document-report/RESULTS.zh-CN.md)、[真实包核验](acceptance/flow-document-report/live-evidence.json)及[浏览器](acceptance/flow-document-report/browser-evidence.json)保留。报告 `604044d4…` 保留原 PDF、来源/许可、解析与精确区间，浏览器 v1 和中文页段回跳/刷新通过；1,303,750 字节成果包实际解包 11 个条目，9 个固定文件字节一致。原 57 条文档记录未改；旧真实运行报告在备份库中仍 current/verified。

文档报告批次最终统一回归 **501 pass / 0 fail / 3 skip**；干净安装/构建/类型检查通过，**339 个 dist 文件一致**。二进制随机路径误报已修复；可读宿主路径和凭据仍拒绝，有限检测边界留证。独立只读审查无本批阻断。没有新增模型调用、PDF 解析或远程发布。

上一批[文献任务、固定原文与页定位](acceptance/flow-documents/RESULTS.zh-CN.md)、[五源实网](acceptance/flow-documents/provider-evidence.json)、[容器](acceptance/flow-documents/parser-runtime-evidence.json)及[浏览器与原件核验](acceptance/flow-documents/browser-evidence.json)保留。真实 arXiv v1/v2 分别保存，v1 解析 15 页且内容版本标记匹配；v2 尚未解析。浏览器完成批准解析、页图回查、中文证据 `[38,41)` 精确回跳及刷新恢复。固定原件、36 个页产物与三条证据通过摘要核验；schema 1/2/3→1/2/3/4/5 的备份迁移保持 173 条旧记录字节不变。

文献批次统一回归 **490 pass / 0 fail / 3 skip**；之后精确区间 UI 修复另经相关 **13 项、15 项**及浏览器复核，没有重复无关全量。最终干净安装、构建与类型检查通过，**339 个 dist 文件完全一致**。首次解析及首次全量失败的原因和修复留证，独立审查的两项阻断已关闭。本批没有新增模型调用。PubMed 请求在 HTTP 响应前失败；未知图表结构/OCR、未完成报告来源链均明确展示，未称 PR10 全部完成。

上一批[长任务日志与断线恢复](acceptance/flow-events/RESULTS.zh-CN.md)、[真实执行](acceptance/flow-events/runtime-evidence.json)、[浏览器记录](acceptance/flow-events/browser-evidence.json)及[规模/查询计划](acceptance/flow-events/performance-evidence.json)保留。Docker 正式和开发日志各 1,595,543 字节，跨页 UTF-8 读取与原始摘要一致。关闭控制器后恢复同容器，未重复启动。浏览器验证有界回查、两流、按需展开及实际服务断连/重连；两个明确标注的 IPC 夹具验证切会话、刷新及最终消息替换，不冒充新模型调用。173 条旧记录在独立备份迁移中全部字节不变。

日志批次最终统一回归 **463 pass / 0 fail / 3 skip**，真实 Docker 日志/恢复 **1/1**；独立复核无当批阻断。干净安装、构建与类型检查成功，**311 个 dist 文件完全一致**。Host UTF-16 截断边界作为非阻断项保留；页面已明确标示新发生的内容截断。该批没有新增真实模型请求。

上一批[资源调度验收](acceptance/flow-scheduler/RESULTS.zh-CN.md)、[真实执行](acceptance/flow-scheduler/runtime-evidence.json)、[浏览器记录](acceptance/flow-scheduler/browser-evidence.json)及[规模/查询计划](acceptance/flow-scheduler/performance-evidence.json)保留。两控制进程共享 1 核预算，正式 Run 运行时开发测试排队；控制服务重开后保持同一容器，随后两项成功且完整。浏览器显式配置、等待与释放、结果回查、刷新及 390px 键盘操作通过。迁移前备份保留，旧 145 条记录中 144 条字节不变，1 条原 Git 租约正常续期；历史源码/批准/Run/报告不改写。

资源调度批次最终统一回归 **441 pass / 0 fail / 3 skip**；正式 Docker live **8/8**、开发 Docker live **12/12**、共享调度 live **1/1** 通过。首次开发 live 测试在关闭 Host 后缺少持续驱动，已只修等待循环并重跑，失败证据保留。两项 P2 修复并独立复核关闭；当批干净构建 **303 个 dist 文件完全一致**。Worker 验证使用标明的真实 IPC 子进程 fixture，没有新增模型调用，不把 Worker 上限当作 HTTP 并发或账单上限。

上一批[报告回查与离线交付](acceptance/flow-report/RESULTS.zh-CN.md)、[执行证据](acceptance/flow-report/live-evidence.json)及[浏览器证据](acceptance/flow-report/browser-evidence.json)保留。真实浏览器从 Run `ca819399…` 生成报告 `28b4360a…`，已验证指标定位与原始 metrics、固定 `main.py`、开发测试 `0748…` 的 stderr 和独立审查 `4b2e…`。准确 Run 跳转、刷新恢复与 390px 键盘通路通过，console errors=0。

本地[成果包](acceptance/flow-report/research-result.tar.gz)为 **17,148 字节**，SHA-256：`6d30ce67b4ecfc24235947e52233adaf0f134d5cc8ccdd575af67d2e0948dd0d`。真实解包的 **20 个文件**与清单及当前固定引用逐字节一致；仅本地交付，未远程发布。

报告批次统一全量在当批 P2 收口修复前完成：**413 pass / 0 fail / 3 skip**。宿主路径导出 P2 修复后，受影响报告/导出 **14 项**及 HTTP/schema **9 项**通过，未重复无关全量；当批 clean build **290 个文件完全一致**。P2 已只读复核关闭，但有限敏感内容/宿主路径检测不保证识别任意混淆编码。

上一批[实现、测试与独立审查闭环](acceptance/flow-implementation/RESULTS.zh-CN.md)及[真实执行记录](acceptance/flow-implementation/live-evidence.json)保留当时的 395/0/3 与 280 文件构建结果。固定模型为 `zai-coding-cn / glm-5.3`，正式 Run 实测 MSE 为 `0.000050345031695457565`；候选 `b8f9aaa5…` 在测试、审查、提案和 Run 中一致，项目 degree=1 文件未修改。

[正式运行与结果回查](acceptance/flow-run/RESULTS.zh-CN.md)、[源码准备与真实 Pi](acceptance/flow-source/RESULTS.zh-CN.md)、[PR04](acceptance/pr04/RESULTS.zh-CN.md)、[PR03](acceptance/pr03/RESULTS.zh-CN.md)、[PR02 首批](acceptance/pr02/RESULTS.zh-CN.md)和[PR01](acceptance/pr01/RESULTS.zh-CN.md)保留当时结果。首条真实旅程通过，不意味着整体计划完成，也不凭示例指标宣称科学发现。

下一批按 PR08 推进有界的下一轮方案→批准测试运行→结果比较与停止。WorkingGrant/RunGrant/DiscoveryGrant、多 Agent 收益对照及其他 PR01–14 范围保留；PR07 其余并发/历史分页、PR09 完整迁移、PR10 剩余文献、PR11 剩余技能、PR12 剩余写作、PR13 远端与 PR14 分发仍未完成。

尚待核验：浏览器下载事件按 5 秒有界等待仍超时，本地下载路径未确认；上述服务端验证包已保存，可直接本地交付。远端/GPU 仍缺环境。浏览器坐标点击错位已用原生键盘完成，不作为产品功能缺失。非阻断后续项：reviewer 摘要误将空 stdout 归为 stderr；原始 stderr 确有 5 tests / OK，后续改进精确引用，本批不重做审查。
