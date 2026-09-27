# Pi Research 优化实施计划

日期：2026-09-27。对象：v0.2.3-fixed-skills 与 v0.3.1-experimental-skills。

**目标：**在保留 Pi 唯一执行内核与现有可靠性修复的前提下，先完成一条真实“读取指定源码—实现—开发测试—独立审查—批准—运行—结果回查”链，再扩展到完整 OpenResearch 固定基准范围。

**范围：**本文件是计划，不代表这些任务已实现或已通过验收。优先级 P0/P1/P2 是实施顺序，不是安全漏洞评级。工期按关卡推进，不预先承诺固定周数。

**来源依据：**同次《Pi Research 与 OpenResearch：源码、架构差距与优化计划》；原始设计 M0–M9；上游固定提交 `3037f727e80e0ab20c61a87c613a50dde009a835`。不要用移动的main替换本计划基准。

## 一、全局约束

- 不重写为Rust，不引入第二个Agent框架，不依赖ORX服务或CLI。
- 前端、CLI、Pi工具调用相同领域动作；权限、批准、幂等、版本和状态在服务端验证。
- 归档/撤销/失效后的新副作用必须被阻止；历史结果和合法幂等响应仍保留。
- Git提交、源码快照、测试结果、正式Run、审查与报告可相互定位，不用可变工作目录替代正式证据。
- 开发测试、正式实验与文档构建复用基础设施，但不混为同一业务对象。
- 本地数据仍属于用户；不自动推送上游、上传全文或公开成果。
- 原两版ZIP冻结保留；共同修复进入共同核心，增强项由独立功能配置开关控制，默认行为不静默变化。
- 每项功能分别标记：代码存在、配置可用、契约测试、目标环境集成、真实用户旅程；不能合并成一个“已完成”。

## 二、PR与依赖总表

| PR | 优先级 | 交付目标 | 前置依赖 | 主要验收 |
|---|---|---|---|---|
| 01 | P0 | 固定对标矩阵、干净构建与真实Pi最小接入 | 无 | 可重建，两版共享回归；固定SDK真实工具调用/恢复 |
| 02 | P0 | 统一OperationRegistry和输入/输出Schema | 01 | API/CLI/Pi错误与权限一致；每工具有精确Schema |
| 03 | P0 | 指定实验源码读取、准备工作区与差异 | 02 | 模型读取的是选定子实验，而不是项目初始副本 |
| 04 | P0 | SandboxJob/DevelopmentTask与开发测试 | 02、03 | 小型Python代码真实测试、失败诊断、结果绑定源码 |
| 05 | P0 | GitWorkspace与源码版本迁移 | 03 | 独立worktree、冻结提交保护、差异、无自动push |
| 06 | P0 | RunnerAdapter及通用Docker真实验收 | 02、04 | 非白名单Python任务真实运行、取消、断线对账 |
| 07 | P1 | 日志、存储、事件与资源调度 | 02、06 | 有界I/O、无全量队列扫描、可配置配额和公平推进 |
| 08 | P1 | 有界授权与真实单/多Agent科研闭环 | 04、05、06；07的额度部分 | 方案→实际实现/测试→审批→运行→下一轮，可恢复 |
| 09 | P1 | 工作台类型/路由/图与证据联动 | 02；随03–08逐页接入 | 同一完整用户旅程在浏览器完成 |
| 10 | P1 | 文献实网验收与DocumentVersion | 02、07的长任务机制 | 原始论文版本/页定位/无全文状态和源开关正确 |
| 11 | P1 | 受管技能/模板生命周期 | 02、04、10 | 导入审查、能力依赖、包固定与回滚，不自动授权执行 |
| 12 | P2 | LaTeX构建、成果包与可点击报告 | 04、09、10 | 真实PDF、错误定位、数字图表回查 |
| 13 | P2 | SSH→Slurm、远程工作台及其他后端 | 06、07、08 | 每个后端真实提交、日志、取消、网络恢复 |
| 14 | P2 | 发布、同步、备份迁移、桌面与团队版 | 05、09、12、13中的目标部分 | 旧数据兼容、显式发布、同步冲突与分发验证 |

PR01–06优先，PR09的基础迁移可平行开展，不等待所有后端。原版全范围保留在PR13–14的子清单，不能把“暂缓”写成“不需要”。单人开发时仍按这些边界提交，不同时扩大全部模块。

## 三、逐项实施计划

### PR01：让“可以运行”与“可重复构建”分别有证据

**修改/新增：**`package.json`、锁文件、`scripts/build.mjs`、`scripts/setup-pi.mjs`、`packages/pi-adapter/runtime.ts`；新增 `tests/parity/`、`tests/live/` 和 `docs/reference-baseline/`。

**实施：**
1. 记录原两包和固定上游的提交/哈希，建立每一项用户能力到文件/接口/测试的矩阵。对齐等级用 exact/equivalent/intentional-deviation；实现状态单独记录。
2. 选择符合Pi0.87.1实际engines的Node精确版本，锁开发依赖、SDK和生成资源；不再让全局tsc与锁文件类型不一致成为日常构建方式。
3. 在干净允许联网环境执行 `npm ci`、构建、类型检查和两份现有完整测试；给预构建包另做无依赖启动。
4. 建立真实Pi最小测试：发送一个小问题、只读工具、受控私有写入、流输出、引导、中止、关闭后按确切会话文件恢复。记录实际模型、原生会话、工具事件和用量。
5. 假Worker保持在确定性测试层，不能据此给live项打勾。没有凭据时live明确未执行/需要授权，不伪造成功。

**完成标准：**同一源代码与锁文件可重建；SDK调用不是any契约模拟；失败能区分缺包、模型不存在、凭据/接口错误和权限拒绝。M0尚未录制的原版页面明确留空，不补假截图。

### PR02：一次定义，贯穿工具、HTTP和CLI

**修改/新增：**`packages/contracts/operations/`、`research-tools/definitions.ts`、`dispatcher.ts`、`apps/agent-worker/index.ts`、server routes、CLI参数解析。

**建议接口（本项目新增设计，不是Pi现有API）：**

```text
OperationSpec:
  id / inputSchema / outputSchema
  authorize(actor, input, state)
  idempotencyPolicy / preconditions
  execute(context, input)
```

**实施：**优先迁移run_prepare/run_submit、workspace_read/write、change_proposal_prepare、task_result_submit、paper_read。定义必需字段、枚举、长度、未知字段策略；生成Pi JSON Schema和客户端类型；把例子由schema校验。沿用已存在的lifecycle、AcceptanceRecord和稳定幂等，不另写一套授权。

**测试：**相同非法请求经HTTP、CLI、工具得到同一业务错误；额外experimentId不能被未知字段静默误用；归档、stale approval、过期lease、重放、交叉项目、只读动作均有负例；响应通过输出schema。

**回退：**旧API版本保留薄兼容转换，不能同时存在两条不同业务规则。

### PR03：让Agent真正拿到它要修改的那一版代码

**修改/新增：**`workspace/experiments.ts`、`workspace/files.ts`、`pi-adapter/sessions.ts`、`research-tools/*`；新增 `workspace/source-access.ts`。

**建议动作：**`experiment_source_list`、`experiment_source_read`、`experiment_source_diff`、`workspace_prepare_from_revision`。

**实施：**输入必须是项目内experimentRevision或snapshot ID。读工具返回路径、版本、hash和范围；准备工作区时从固定源初始化，并记录来源。助手只读被分配的来源；主协调者也不能用任意绝对路径绕过。

**关键验收：**本轮复现项目中初始degree=1、子实验degree=2。指定子实验读取得到2，返回其源码digest；默认project读取仍是1且语义明确；失效提案/跨项目/路径穿越被拒；生成代码后不会覆盖冻结源。

**价值：**这一步可先基于当前内容快照实现，不应被完整Git改造长期阻塞。

### PR04：受控开发测试，而非开放宿主Shell

**新增：**`packages/execution/`、`packages/development/`、`apps/execution-worker/`；扩展permission/approval/task/events。

**建议Job合同：**purpose、inputSnapshot、command argv、environmentImageDigest、mounts、resources、deadline、networkPolicy、expectedArtifacts、grantId。执行返回稳定job handle，不阻塞一个工具直到长测试结束。

**实施：**固定镜像、只读源/数据、独立可写工作/输出、有限CPU/RAM/PID/时间、禁网默认值；实际状态由执行服务监管。stdout/stderr、exit、测试报告归档；测试结果保存sourceDigest和测试命令。失败也保留资料。

**测试：**用户授权的小型Python脚本能运行单元测试；故意语法错误和断言失败准确回报；越权写主仓库/读取密钥/访问网络失败；超时取消杀完自己的进程组；浏览器断线不让Job丢失；源代码变化使旧测试记录不能自动通过新提案验收。

**不做：**把所有调试尝试挂成新科学实验节点；把测试通过直接解释成科学假设成立。

### PR05：Git负责代码历史，CAS继续负责可执行快照

**新增/改动：**`workspace/git-service.ts`、`workspace/leases.ts`、SourceRevision模型、change-proposals、项目导入和迁移。

**实施：**受信宿主执行参数化Git命令，无shell拼接和自动远端push；项目仓库导入记录remote/commit；Session从选定revision创建独立worktree；每分支单写入者。查看差异、提交、整合只形成新子节点，不重写冻结历史。

**安全/兼容：**禁用或审核hooks/外部filters；子模块、LFS和未跟踪文件显式政策。保存文件模式，稳定清单参与hash。旧内容快照导入为新历史节点，保留原摘要和时间，不能假称过去已存在Git提交。

**测试：**并发checkout互斥；dirty worktree不能悄悄漏文件；两个补丁冲突不覆盖；冻结分支不可rebase；创建Git节点后SQL失败可识别孤立事务并恢复；原历史Run读取不变。

### PR06：验证第一种通用运行器

**修改：**`runners/service.ts`、`contracts.ts`、`runner-supervisor`；新增 `runners/adapter.ts`、`runners/docker.ts`、JobHandle/ComputeTarget。

**建议接口：**capabilities/preflight/stage/submit/inspect/readLogs/collect/cancel/reconcile。RunService管理权威业务；adapter只处理外部事实。

**实施：**先把现有trusted-example变成适配器以保留回归，再完成Docker。长环境探测不在SQLite写事务中。提交使用稳定操作标识；响应丢失先查外部handle，不盲目再起Job。完整性来自归档结果清单。

**验收：**不是随包哈希白名单的小型Python研究任务，在固定容器中真实产出指标和文件；可停止、重启控制服务、查询日志；提交响应丢失不重复Job；缺必需文件不显示complete；模型/数据源摘要一致。GPU路径要另在有GPU的目标环境验收，CPU通过不代表GPU通过。

### PR07：从原型定时全量扫描变成可解释的资源调度

**修改：**storage/store、scheduler/agent-host、wakeups、runner日志、web event消费；新增版本化迁移和资源预留表。

**实施：**
- 保留SQLite WAL，但为状态/目标/队列字段建立可查询索引或投影表，历史JSON可渐进保留。
- 短事务原子领取/租约/fence；网络、spawn、文件hash移出写锁后，执行前再次验证版本。
- 事件用于唤醒，定期reconcile做兜底；持久化cursor，不把事件通知当完整事实。
- 分开模型HTTP并发、Agent活跃会话、正式运行CPU/RAM/GPU配额。未知Job继续占用其资源，不被算作零；多个目标下只阻塞关联容量。
- 日志seek范围读取、分块/轮转，显式超限策略与错误。不得悄悄丢输出后标完整。
- SSE采用节流、背压和断线cursor补拉；大记录分页，UI虚拟列表。

**测试：**取消与完成竞争、两个调度者、过期Worker、新事件丢失和重复都可恢复；日志读取操作的实际读取字节有上界；长队列定向查询而非读取所有历史；unknown的目标A不阻止独立目标B。配置中的有效并发应在UI准确显示。

**性能证据：**固定数据规模报告p50/p95、内存、DB锁等待和积压；无基准前不承诺倍数。

### PR08：有界研究，不是取消审批

**修改：**research-workflows、collaboration、policy/grants、tool registry、real research evals。

**实施：**在现有Campaign/Decision上增加ExperimentPlanRevision，明确假设、对照、变化因素、数据/切分、主/保护指标、重复依据、成功/无结论/停止。Repair调用真实开发测试路径；Refill/Promote沿正确父源码构造候选。

**授权设计：**WorkingGrant只允许指定私有源码与有限测试；RunGrant绑定已知冻结清单或有限、可验证参数集合；DiscoveryGrant绑定来源、资料与请求范围；发布单独授权。未知新代码不得靠“开启自动研究”得到无限正式计算许可。

**测试：**单Agent完整真实任务先通过，再两个助手＋审查；同模型/数据/预算比较。多个运行先后完成不漏观察；预算不足停在明确状态；审查冲突不放行；撤销输入使下游提案和报告失效；有意义的非零退出结果不可原地改写。默认安全审批行为保持兼容。

### PR09：工作台从对象控制台转为研究流程

**修改：**正式React/ReactDOM依赖、真实类型、构建配置、路由/状态层；拆分App；增加图形树、差异、日志和EvidenceResolver。

**实施：**先保持现有布局/能力，把真实API/类型和构建现代化；之后按“开始研究→确认方案→准备实现→执行→比较→下一轮→成果”组织。工程ID放高级详情，不要求用户手填大段JSON。树布局与实验血缘分开，列表/键盘路径保留。

**证据联动：**报告中的引用用类型化ID解析至固定版本；无效引用不能变成任意URL；HTML/SVG/PDF用受控预览，避免XSS和文件路径泄漏。状态、版本、effective quotas从服务端生成，不硬编码旧版本文案。

**验收：**浏览器真开页面、发送/引导/中止、批准Run、看日志、打开对应源码/证据、刷新恢复；桌面和至少一个窄屏；主路径键盘可操作；无console错误。不能用React元素树或HTTP200代替浏览器验收。

### PR10：文献连接不是只返回文字

**修改：**connectors/*、literature facade、evidence/document-service、binary ingest/parse worker、论文查看UI。

**实施：**逐一实测现有5源；解析schema、认证、日期、分页、限流记录在provider contract；settings enabled和target health分开。原始PDF/文本按digest入库，DocumentVersion保存论文ID/明确版本、来源和获取时间。解析后保留页/段/表/图定位与质量，不知道页码就标unknown。

**测试：**alphaXiv指定版本不被最新版本偷换；摘要不能标全文；检索中撤销授权不登记可用结果；PDF嵌入脚本与路径不可执行；页图原文回查；失败保留成功源；网络文件不自动加入增强版获准语料。中文/扫描件和版权许可分别验证，OCR不是默认替代全文读取。

**A/B：**原始与派生摘要分开，检索相关性不写成科学信度；本地词项/MMR保持可关闭，不宣称等于完整PaperQA。

### PR11：技能包可管理、可固定、可回滚

**新增：**SkillPackageRevision、ReviewRecord、CapabilityRequirement、启用配置和回滚操作；扩展skills service与UI。

**实施：**上传SKILL/资源后做路径/压缩包/大小/许可证检查，用户审阅；内容哈希冻结。仅文本授权不允许执行脚本。技能声明所需工具/后端/数据权限；启动前预检，不可执行时说明缺什么。TaskAttempt固定bundleId，恢复不悄悄换新版。

**验收：**污染导入仓库的.pi/AGENTS不被自动加载；同名替换不会改变运行中的任务；撤销后禁止新启动，历史仍能解释；diagram/figure/paper等需要执行器的技能分别用真实产物验收，而不是只数文件个数。

### PR12：报告和论文是真实产物链

**新增：**publications/document-build、template registry、export package、图/表/脚本引用关系。

**实施：**TeX任务禁用shell escape，隔离文件系统与网络；固定依赖和引擎；识别pdfLaTeX/XeLaTeX/LuaLaTeX，处理bibtex/biber与多轮引用；sourceDigest与PDF绑定。图表生成也留数据/代码/运行来源。

**测试：**正确文稿实际编译；缺图/缺包/引用不收敛/超时有准确状态与行号；文件存在但hadErrors不能视为验收成功；报告点击数值跳转原Run和源产物；导出不含凭据或可变未批准文件。

### PR13：真实远程执行和远程工作台分别验收

**第一批：**SSH，随后Slurm；适配器继承共同Runner契约，快照上传校验，远端稳定handle，流式日志、产物收集，取消与断网对账。

**第二批：**Kubernetes、Ray、HF Jobs、Modal、Tinker及托管计算分别实现。每个都有能力矩阵和自己的认证/取消语义，不用文档占位冒充支持。Tinker等控制器类取消必须区分本地控制器与已被远端接受的请求。

**远程工作台：**远端数据库/Pi/工作区完整驻留，用户通过认证隧道访问；不能将“本地控制远端Job”叫完整远程工作台。断浏览器不取消运行。

**验收：**真实自有测试机/授权账户执行提交、查看日志、收集、取消、网络中断、排队/抢占/容量错误；终态与实际Job数量核对。Mock只用于契约，不给live项打勾。

### PR14：分发、迁移与外部协作

**实施拆分：**
- 存储URI/相对资源键迁移，备份导出/恢复和中断恢复。
- 显式准备发布内容、检查敏感数据、指定目标/可见性批准，然后Git发布。
- Overleaf关联、上传新项目、Git双向同步、实时通道分别显示；有冲突请用户选择，不静默覆盖。
- 桌面安装、更新和回滚最后验证真实OS；远程多用户在身份授权体系完备后增加，不把回环单用户令牌直接暴露公网。
- 自有托管账户/组织/实例/资源目录/账本与清理是独立服务项目，不由连接器数量替代。

**验收：**旧项目、会话和Run不因升级丢失或被重跑；迁移中断能回退；发布后验证链接/目标；无账户能力时返回明确不足；各平台真机安装验证。没有完成的完整对齐项保持待办。

## 四、最终放行清单

满足下列条件才能把一个能力从“已写代码”升级为“目标环境可用”：

| 维度 | 放行要求 |
|---|---|
| 来源 | 代码、SDK、模型、数据、技能、镜像等版本可定位 |
| 安全 | 当前权限与批准有效；跨项目、路径、旧lease和注入负例通过 |
| 可复现 | 源快照与实际执行一致；原始输出保存，正式数值不来自模拟 |
| 恢复 | 中断、重复事件、响应丢失、取消竞争不产生未解释的新副作用 |
| 用户体验 | 真正浏览器路径可完成；失败/等待状态可解释 |
| 科研语义 | 不把退出码、LLM投票、相似度和文件存在当结论正确 |
| 对齐 | exact/equivalent/intentional-deviation逐项有证据，不给未经定义的总完成百分比 |

## 五、短期取舍

最先做PR01–06与必要的PR09页面：真实Pi、精确工具Schema、指定实验源码、受控测试、Git/快照、通用Runner。先证明一次完整非白名单研究任务，再开展PR08的真实多Agent收益评测。

暂缓但不删除：全部云后端并行开发、实时Overleaf、完整托管账户、桌面外观、更多模型与技能数量。原有修复、默认授权限制和双版本对照继续保留。
