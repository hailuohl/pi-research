# Pi 上午运行报错解决方案与实施计划

> **For agentic workers:** 实施时按项目 AGENTS.md 选择执行者，使用 superpowers:subagent-driven-development 或 superpowers:executing-plans；以下复选项全部是待执行工作。本次交付仅为方案，不代表修复、测试或部署已经完成。

**Goal:** 改善文献检索、原文证据登记、研究计划绑定稿件和 PDF 编译四条流程的可靠性，让失败可解释、可恢复，并保留严格的来源校验和历史记录。

**Architecture:** 沿用 ConnectorTransport、EvidenceService、DraftReadService、固定文稿编译镜像及现有安全诊断链。检索统一有界期限；引用和草稿问题优先完善调用顺序与恢复提示；编译通过更新锁定依赖和内容摘要发布新镜像。每批只交付一条可走通的流程。

**Tech Stack:** 现有 Node.js 22.19+、TypeScript、node:test、SQLite JSON records、Pi SDK 0.87.1、Python 和 Linux/amd64 Docker；不新增应用依赖。

**Spec:** 本文“设计决策”和各批“方案”是实现依据；文中的新参数、错误码和测试均为待实施提案。

日期：2026-10-26，北京时间。代码基线：`c7e1dfaa92ef576cad307e8d6d2513fab84f7870`；当前分支：`implementation/pr01-reproducible-baseline`。工作区存在其他任务的未提交改动，远端分支也正由其他任务推进；本文以本机所核对源码为方案依据。实施前重新核对实际版本及相关差异，不直接回退到该提交覆盖当前代码，也不把本方案复核当作新远端代码的实施验收。

## 事实依据与设计决策

上午实际活动为 10:46–11:17。8 轮 Agent 正常结束；9 次工具失败由 6 次检索全源失败、2 次精确引文不匹配、1 次草稿未绑定组成；此外有 2 次编译失败，第三次在同一镜像成功生成 12 页 PDF。

| 问题 | 已核实的触发条件 | 本次推荐路线 |
| --- | --- | --- |
| 检索失败 | 六条请求用时约 12.1–12.3 秒，4 条已收到 HTTP 200；12 秒期限同时覆盖排队和网络，超时与取消共用错误码 | 分开整体期限与发送后的网络期限，贯通外层 RPC，补阶段观测及安全提示 |
| 引文拒绝 | 模型改变了原文换行，或合并了 `under-` 换行 `lying` | 保留逐字匹配，明确一次失败后的回读恢复步骤，复用已有分页读取 |
| 稿件拒绝 | `main.tex` 已回读，但之前确认的计划 `draftFiles=[]`，未绑定新增稿件 | 保留绑定校验，补“写入、回读、更新计划、合法确认、冻结稿件”的完整顺序 |
| 编译失败 | 固定镜像缺 `ctex.sty` 和 `pzdr` 字体度量文件，字体错误误标为图片错误 | 增补锁定依赖、真实编译验证、准确诊断，保留旧镜像与旧作业清单 |

仅延长底层超时不能解决外层 30 秒先放弃的问题；仅重复提示词不能覆盖被泛化隐藏的草稿错误；放松原文匹配或自动替换计划会破坏现有来源约束。推荐以上针对现有缺口的组合方案。

检索的历史日志未保存 abort 来源或各阶段耗时，因此“12 秒期限中止”是高置信判断，不能追溯认定每一次究竟慢在排队、响应头还是正文。新增观测用于今后的准确定位，不改写历史为已知原因。

## 全局约束

- 前端布局继续暂缓；只使用现有聊天通知、活动记录和结果诊断呈现错误。
- 保留现有角色、来源开关、DiscoveryGrant、会话动作批准、租约、额度、幂等及内容授权检查；延长等待不延长任何授权期限。
- 不自动归一化并采纳引文，不猜 offset，不把模糊匹配当作原始证据。
- 不在 `manuscript_create` 中补写、自动确认或覆盖旧研究计划；旧计划、稿件、编译结果和原始日志保留。
- 不新增透明网络重试。再次请求须先核对原操作终态、现有授权和预算；结果未知时不重复副作用。
- 不在作业运行时安装 TeX 包、联网下载字体或改用宿主编译；新镜像继续使用锁定包、固定摘要和无网络运行。
- 不透传任意异常正文、DomainError.details、认证头、完整带参数 URL 或私密文件路径。
- 每个实施批次由主代理统一验收、检查实际差异、独立复核和提交推送；不混入其他在途改动。

## Review Focus

1. 外层普通工具 RPC、批准恢复工具与底层期限是否一致，避免宿主完成后 Worker 已放弃。
2. 多查询、多来源共用 3 个槽位时，队列必须有界，超载能准确终止，不无限增加并发。
3. 错误恢复不能授予受保护全文读取权限，也不能把当前工作区变更追溯到固定历史计划。
4. 发布新的技能和编译内容摘要后，旧会话、旧作业及旧结果继续按其原固定身份处理。
5. 非主文件错误位置、字体错误、残留 PDF 和过期回读不能被错误地显示为成功或可直接使用。

上述五项分别纳入对应批次验收，不另开泛化审计。

## 实施顺序与批次边界

| 顺序 | 独立交付流程 | 执行与复核安排 |
| --- | --- | --- |
| 1 | 从文献检索到成功、部分结果或准确失败回查 | Sol/high 实施；涉及批准恢复、额度边界的集成由独立 Astra/xhigh 复核 |
| 2 | 从中文稿件到固定镜像编译和准确诊断 | Sol/high 实施；原作业保留与恢复由独立 Astra/xhigh 复核 |
| 3 | 从正文回读到精确引文登记和失败恢复 | Sol/high 实施；独立 Sol/high 复核；若改变内容权限路径则升级 Astra/xhigh |
| 4 | 从新草稿到计划绑定、合法确认和稿件冻结 | Sol/high 实施；独立 Astra/xhigh 复核 |

默认一次只有一个实施代理。该表是未来实施安排，不是已经启动的实施任务，也不是对实际模型与档位的核验。当前方案分析已分别请求 Sol/high 和 Astra/high，接口未回显实际运行模型/档位。

## 批次一 文献检索的期限与诊断

### 方案

将“整个检索还能等多久”和“开始发送后网络请求还能等多久”分开。保留现有 ConnectorService 所持 transport 实例的共享并发上限 3；排队与 NCBI 发送前限速计入整体期限，获槽位、完成限速及 beforeSend 检查后开始网络计时，响应头与完整正文读取计入单 HTTP 网络期限。每次等待、发送、分块读取及持久化前继续检查授权和取消状态。旧 literature_search 当前为每次调用创建独立 transport，本批保持该实例边界，不宣称全进程或跨入口共用三个槽位。

推荐初始参数如下，实施时以虚拟时钟和一次真实慢响应试验校准；这些值不是已经测得的最优值。

| 层级 | 现状 | 推荐初始值 |
| --- | --- | --- |
| 普通 transport 默认期限 | 12 秒 | 保持 12 秒，避免顺带改变其他调用 |
| 检索专用单 HTTP 网络期限 | 使用默认 12 秒且覆盖排队 | 显式传入 30 秒，实际发送前开始 |
| 一次检索整体期限 | 18 秒 | 65 秒，覆盖排队、串行 HTTP 子请求及解析；终态收敛和持久化使用外层余量 |
| `literature_search` / `literature_discover` Worker RPC | 30 秒 | 75 秒，为宿主收尾留余量 |
| `paper_read` 整体 / RPC | 60 / 80 秒 | 保持现状，仍包含排队，不另开无限正文预算 |
| `session_action_resume` RPC | 30 秒 | 80 秒，覆盖其合法恢复的检索或原文读取 |

`session_action_execute` 当前只执行固定文本操作，不为此扩大其期限或可执行操作。`session_action_resume` 仍只能消费绑定的原批准操作；延长等待不能变成一个通用执行入口。

65 秒总体上限并不保证任意负载全部成功。例如五个工具调用各查五个来源时，25 条 HTTP 共享 3 个槽位，晚排队的请求仍可能超时。它们应明确报告排队或整体期限耗尽，保留其他已成功结果，不提高并发上限或自动重试掩盖超载。

### 接口与记录

沿用现有 transport 方法与 AbortController，不新建调度框架。为检索增加内部期限策略，单 HTTP 可用期限取网络上限与剩余整体期限的较小值。保留普通调用默认 12 秒及 `paper_read` 的 60 秒整体契约，调用方不能自行传入任意外部无限期限。

对新失败区分以下稳定错误码；历史 `CONNECTOR_CANCELLED` 继续按“超时或取消，原因未细分”读取。

| 情况 | 提议错误码 | 用户应收到的信息 |
| --- | --- | --- |
| 等待槽位时整体期限耗尽 | `CONNECTOR_QUEUE_TIMEOUT` | 等待可用连接超时，本次未取得完整结果 |
| 已发送后响应头或正文超过网络期限 | `CONNECTOR_TIMEOUT` | 来源响应超时，HTTP 200 不代表正文完成 |
| 多 HTTP 工作流用完整体期限 | `CONNECTOR_OPERATION_TIMEOUT` | 本次检索总时限耗尽；已成功来源按现有 partial 规则处理 |
| 外部调用方明确取消 | `CONNECTOR_CANCELLED` | 请求已取消 |
| 所有来源失败 | `CONNECTOR_ALL_FAILED` | 全部来源失败，不能据此断言没有论文 |

abort 原因由触发端记录，防止后续 `validate()` 把期限中止再次改写为泛化取消。权限撤销、来源配置改变等既有 DomainError 保持其真实代码，且任何失败状态都不得继续发布返回正文。

`connector-call` 复用现有 JSON record，按需追加 `sentAt`、`headersAt`、`finishedAt`、`receivedBytes`、`failureStage`；复用既有 `startedAt`、`httpStatus`、`error`。排队/响应/总耗时由时间戳计算。旧记录缺字段显示 unknown，不补造阶段时间。只记录来源枚举、阶段枚举、时间、字节数和状态，不记录凭据或完整 URL。阶段观测只在发送、响应头及终态等有限边界更新；receivedBytes 在内存累加、终态落盘，不逐块写库。旧 literature_search 接入中途观测后，收尾必须在事务内读取最新 record version 再更新，不能复用预留时的 call.version 造成自有观测引发版本冲突。

保留当前“先预留一次 HTTP 尝试再执行”的额度语义；即使排队取消也不在本批私自退款或改变历史计数。旧 `literature_search` 接入 signal 与期限时保留原返回结构、幂等 scope 和冻结授权，不简单转调另一入口。

多来源返回继续使用现有 `partial`；HTTP 200 后正文中断不得被保存为完整论文或成功检索。全失败提示通过 `tool-diagnostic.ts` 的静态白名单形成，原始来源异常不透传。

整体期限后的收尾规则必须独立实现：将调用方取消、授权校验与本次自有 deadline 分开。单来源网络超时不废弃其他完整来源；65 秒自有 deadline 到期只停止未完成外部工作，在独立重新检查 caller signal、授权、租约、来源设置版本和项目生命周期均有效后，才可将此前完整且已通过解析/大小/来源检查的成功来源收敛为 partial，并注明覆盖不全。不得删除现有最终校验来达成保存，必须保留上述独立校验及持久化事务内复验。所有收尾均须在 75 秒 RPC 上限内返回。

没有成功来源时，自有整体 deadline 已耗尽优先返回 CONNECTOR_OPERATION_TIMEOUT；仅各来源失败而总体期限未到返回 CONNECTOR_ALL_FAILED。外部取消始终不发布结果，返回 CONNECTOR_CANCELLED；权限、来源、版本或生命周期失效保持对应既有精确 DomainError，优先阻止发布，不因自有 deadline 耗尽降级成可采纳的 partial。旧单源 literature_search 和 owner 分页入口保持原完整回执契约，不凭部分字节制造部分论文或下一页游标。

### 文件与测试

主要修改：`packages/connectors/transport.ts`、`packages/connectors/service.ts`、`packages/literature/service.ts`、`apps/agent-worker/index.ts`、`packages/pi-adapter/tool-diagnostic.ts`；旧入口信号接线按实际调用修改 `packages/contracts/operations/registry.ts`。新增可选观测字段还须同步 `packages/policy/discovery-grant-types.ts`、`packages/contracts/operations/discovery-grant-schemas.ts`、`packages/contracts/operations/outputs.ts` 和 `ConnectorService.observations` 的投影，不能只写库而被输出 schema 拒绝或丢弃。

优先扩展已有 `tests/unit/paper-read-resilience.test.mjs` 的虚拟时钟及响应流夹具、`tests/unit/openresearch-connectors.test.mjs`、`tests/unit/tool-error-diagnostics.test.mjs` 和 `tests/unit/discovery-grants.test.mjs`。复用 `tests/integration/tool-rpc-timeout.test.mjs` 及 `tests/fixtures/tool-rpc-clock-worker.mjs` 验证普通调用和批准恢复路径的 Worker/Host 接线，时钟夹具同时识别新的 75 秒计时器；不另建重复的 RPC 测试框架。

保留“普通 transport 13 秒响应应失败”原断言，另加“检索显式 30 秒配置下 13 秒完整响应成功”和“超过 30 秒网络期限失败”。不能删除旧断言把默认行为变化藏起来。

### 本批验收

1. 模拟 5 条检索 HTTP 共用 3 槽、每条 15 秒完整返回，按推荐期限分两轮完成；短流程不等待满额期限。
2. 覆盖排队超时、响应头未到、HTTP 200 后正文中断、整体期限耗尽和主动取消；错误码、阶段和持久化记录相符。
3. 多来源有成功时保留 partial；覆盖“一个来源先成功、另一个耗尽整体期限”的安全收尾，以及同样场景下 caller 取消/撤权绝不发布的对照；全失败代码准确，失败流不产生完整原文 Artifact，没有隐式重试或额外 HTTP 次数。
4. 普通检索、旧 `literature_search` 和合法 `session_action_resume` 均不被旧 30 秒 RPC 提前截断；撤销批准、租约和额度限制仍阻止效果。
5. 旧日志重开可读；`paper_read` 的 20 秒成功、65 秒失败、排队共享 60 秒、主动取消及权限回归保持。

### 实施步骤

- [ ] 用现有虚拟时钟夹具先补原错误复现和阶段分类失败测试，确认修复前失败原因。
- [ ] 完成 transport、检索服务、旧入口和外层 RPC 的最小接线，并新增安全诊断。
- [ ] 构建对应改动后运行上述定向测试，记录真实通过、失败和未运行项。
- [ ] 在隔离项目做一次真实 Pi 检索及既有结果回查；不重复收费调用以凑成功次数。
- [ ] 主代理集中验收、独立关键复核，通过后只提交本批文件并推送。

## 批次二 固定编译镜像与真实诊断

### 方案

沿用锁定 Debian 包的维护流程，增补 `texlive-lang-chinese` 与 `texlive-fonts-recommended` 及其必需依赖。Debian trixie 官方文件列表分别列出了 `ctex.sty` 与 `pzdr.tfm`；现有镜像内有 Noto CJK 字体，不代表同时包含中文宏包或 TeX 字体度量文件。

- [texlive-lang-chinese 文件列表](https://packages.debian.org/trixie/all/texlive-lang-chinese/filelist)
- [texlive-fonts-recommended 文件列表](https://packages.debian.org/trixie/all/texlive-fonts-recommended/filelist)

上述官方列表证明包归属，不能替代项目固定 Debian snapshot 的实际解析与镜像内检查。实施时继续使用项目的冻结仓库时点、版本、包大小和 SHA-256 锁，不直接安装当前最新包，不引入 `texlive-full`。

发布流程依次为：更新请求包集合；执行已有 `--resolve` 维护流程并审阅新锁；下载验证；构建新镜像；做最小中文及 hyperref 编译；生成成功收据；最后通过现有配置入口选择新镜像。

下载 cache 保留原文件。为本次 Docker 构建准备仅包含新 lock 所列 `.deb` 的隔离 staging，避免旧缓存残留与 Dockerfile 的精确文件集合校验冲突；不清空共享缓存。保留按内容摘要保存的旧、新成功收据，`latest.json` 仅在新镜像验证成功后更新。

协议仍使用 `latex-document-v1`、`formatVersion:1`，通过既有 `lockDigest/scriptDigest/dockerfileDigest/profileDigest` 区分新内容。协议格式没变，不额外切换全局 profileId；否则现有输出校验器的全局常量比较会给旧在途作业带来兼容问题。

旧 prepared、queued、running 作业继续引用其原 manifest 和原镜像；不为它们更换依赖或重发批准。旧结果按原摘要回查。新准备操作必须匹配当前本机编译 profile 与已保存镜像配置；配置未更新时明确报告不匹配，不能偷偷沿用旧镜像。旧源或授权真正失效仍按既有规则阻止执行。

### 环境验证与诊断

镜像构建成功后，在该镜像内检查 `kpsewhich ctex.sty`、`kpsewhich pzdr.tfm`、`kpsewhich hyperref.sty`，并实际编译同一份含中文、数学公式、`ctex`、`hyperref` 和超链接的最小稿件。文件存在检查与真实编译都要通过；运行作业继续禁网、禁 shell escape，并沿用资源上限。

该验证属于镜像发布验证，不建立任意用户 TeX 的静态依赖解析器。以后遇到不在镜像支持范围的包，返回准确诊断，由明确的依赖维护流程发布新镜像；不自动删掉用户稿件功能或临时安装。

改进 `build.py` 的诊断顺序：先识别字体/TFM/映射文件缺失，再识别 `.sty/.cls` 宏包缺失，只有明确图片扩展名或明确图像加载错误才标 `missing_image`，最后回退 `tex_error`。同时覆盖 `! LaTeX Error: File ... not found` 这种不带标准文件位置前缀的日志。

提议新增诊断码 `missing_font`，保留现有 `missing_package`、`missing_image`、`tex_error`。保持原始错误文本在受控编译日志中；对外只使用现有安全展示和相对源码位置。依赖库中的第 4887 行不能显示成 `main.tex:4887`；无法安全归属用户源码时 `file=null`，提示为编译依赖内部位置。

保留历史作业级 `PUBLICATION_PARSER_FAILED` 兼容码，本批不重写旧记录或引入一套全新 job 状态。显示和模型读取结果时优先解释结构化编译诊断；该统称不能被翻译成“PDF 解析器坏了”。失败、非收敛或不完整作业继续不发布残留 PDF。

### 文件与测试

主要修改：`scripts/setup-document-build.mjs`、`scripts/document-build/debian-packages.lock.json`、`scripts/document-build/build.py`、`scripts/document-build/README.md`。仅在 staging 或标签需要时修改现有 Dockerfile；模板指导沿 `skills/piresearch/pi-research-paper/references/build-and-review.md` 维护。

扩展 `tests/unit/latex-runtime.test.mjs`、`tests/unit/latex-runtime-live.test.mjs`、`tests/unit/publication-build.test.mjs`、`tests/live/publication-build-live.test.mjs`。新增 `scripts/document-build/test_build.py`，用 Python 标准库测试三个脱敏最小日志夹具和真实诊断函数，不启动编译作业；测试导入方式遵守脚本现有入口约束。该 Python 定向检查需显式运行并记录，不能用 npm 回归的成功替代它。

### 本批验收

1. 新镜像内 `ctex.sty`、`pzdr.tfm` 可定位；固定最小中文 + hyperref 稿件真实编译成功且无 error 诊断，生成 PDF 和页图。
2. 两个上午原始错误形态分别归类宏包与字体缺失，真实缺图片仍归类图片，库行号不误指用户主文件。
3. 同一固定源码在旧缺依赖镜像保留原失败、新镜像创建新作业成功；两份日志、manifest 和 image digest 各自完整保留。
4. 镜像升级后旧作业仍按原冻结镜像恢复或收尾，旧 PDF 重开可读；新任务未匹配配置时安全阻止准备。
5. 依赖锁、标签、文件摘要校验通过；损坏 cache、构建失败、非收敛、取消或残留 PDF 都不能被记为发布成功。

### 实施步骤

- [ ] 先用最小日志复现字体误分类、ctex 泛化诊断和库行号误导，加入失败断言。
- [ ] 增补锁定包、构建 staging 和发布检查；完成诊断分类修复，不扩大运行权限。
- [ ] 运行诊断和 publication 定向测试；实际解析固定 snapshot 并记录锁变更、下载量和镜像摘要。
- [ ] 用隔离数据目录做中文稿编译、失败诊断和旧作业/结果回查；执行新镜像真实验收。
- [ ] 主代理集中验收、独立关键复核后提交推送；新镜像配置切换与用户当前作业协调，保留可回溯的旧镜像。

## 批次三 精确引文的可恢复调用流程

### 方案

保持 `EvidenceService.register` 的逐字定位、重复片段拒绝和 UTF-16 offset 校验。此次两次拒绝是正确行为，改善目标是减少模型重复猜测，让一次明确失败后有正确恢复路径。

复用 `artifact_read` 分页、`evidence_register` 和 `evidence_read`：先读取获准正文并保留 JSON 字符串中的真实换行；从同一固定 Artifact 的实际返回内容复制唯一完整句子；登记后回读 quote 与 locator。解释性改写在研究叙述中完成，不能写进 exactQuote。

`EVIDENCE_QUOTE_NOT_FOUND` 后执行明确的恢复步骤：停止凭记忆重写句子，重新读取该 Artifact 的相关分页，复制原文中的空格、换行和断词，再提交一次经过核对的调用。若读取范围内没有该句，则选择实际存在且支持同一论点的引文，或报告证据不足。若错误引文来自已批准的固定会话动作，不能改参数后继续消费旧 actionId；核对原动作终态后，新引文沿当前权限模式提交新的准确请求，不重放 failed/unknown 旧动作。

恢复说明增加上午这两种具体反例：`demonstrate` 后原有换行不能挪到 `a` 后；`under-\nlying` 不能合成 `underlying`。重复片段要求扩展唯一上下文；不要建议交互协调者传 offset 绕过其既有 exactQuote 要求。

首轮不新增模糊搜索、自动纠错、候选引文工具或新证据 schema。现有读取接口已能完成正确操作；优先增强运行时工具描述与静态错误指引，再通过一条真实恢复链验证。

错误恢复不自动返回额外原文片段，不透传任意 details。读取仍走原有内容授权：PDF/PMC 受保护全文必须使用其获准检索/证据入口，不能因为 quote 失败就变成可用 `artifact_read` 的来源。

### 文件与测试

主要修改：`packages/research-tools/definitions.ts`、`packages/pi-adapter/tool-diagnostic.ts`，仅在协调指令确需统一时修改 `packages/pi-adapter/options.ts`；技能说明更新 `skills/piresearch/pi-research-evidence/SKILL.md` 和实际持有引用操作指导的现有参考文件。同步检查 `artifact_read` 描述，说明返回的 UTF-16 cursor、digest 与原样正文如何共同用于回读，避免只改登记工具的一句泛化提示。

复用 `tests/integration/approval-evidence-resume.test.mjs` 的精确引用拒绝用例，扩展 `tests/unit/tool-error-diagnostics.test.mjs`、`tests/unit/text-evidence.test.mjs`。生产匹配算法原则上保持不动，不为了测试增加一份重复的归一化匹配实现。

### 本批验收

1. 原始带换行引文成功；改动换行和合并连字符两种输入仍拒绝，且不新增 Evidence。
2. 失败通知包含准确安全提示；经过原入口回读、原样登记、evidence_read 的恢复链成功，保存 locator 对应原文字节。
3. 重复引文、错误 offset、中文/emoji 的 UTF-16 边界行为保持正确，不猜第一个匹配。
4. 来源撤回、跨会话/项目、受保护 PDF/PMC 不因恢复指引扩大读取权限；错误消息不夹带原文或敏感路径。
5. 旧证据重开仍按原摘要、locator 和引文验证，新技能发行不改旧固定 bundle。

### 实施步骤

- [ ] 先补“错误后按返回指引可恢复”的缺口测试，复用已有精确拒绝回归。
- [ ] 完善具体恢复文字与工具说明，不降低匹配要求或默认授予内容权限。
- [ ] 执行定向测试，再用隔离来源做一次真实 Pi 引用恢复；记录结果，不承诺模型从此绝不出错。
- [ ] 按既有技能发行流程生成新版本；已固定旧 bundle 的会话继续保留原身份。
- [ ] 主代理集中验收、独立复核后提交推送。

## 批次四 草稿与研究计划绑定的恢复流程

### 方案

保留新操作的 `capture → assertCurrent` 校验。需要修复的是工具指导和错误解释，不能将“已经读过”误当作“已确认计划已经绑定”。

标准调用顺序为：`workspace_write` 保存最新稿件；`workspace_read` 取得其真实 digest 与 draftReadId；回读当前计划；以当前 latestId/expectedRevisionId 保存包含完整 draftFiles 的新 ready 修订；按既有模式取得确认结果；确认当前修订后再冻结新稿件。每次修改已绑定稿件后，都需回读新写入版本并更新计划绑定。

confirm 模式按现有交互等待用户确认；合法 fullAccess 自动确认仅沿已有 automatic-approvals 证明链进行。不能新建一种隐式确认，也不能把已经合法自动确认的结果再强行要求人工重复批准。

首轮在 `tool-diagnostic.ts` 收录现有 `BRIEF_DRAFT_READ_REQUIRED`、`BRIEF_DRAFT_READ_STALE`、`BRIEF_DRAFT_CHANGED`、`BRIEF_DRAFT_WORKSPACE_CHANGED`、`BRIEF_DRAFT_ENCODING_INVALID`，提供固定恢复文字，并在 `manuscript_create`、`research_brief_save`、`workspace_read` 描述及论文技能中写明上述顺序。编码不一致时先核对完整 UTF-8 保存与读取，不把受截断或编码损坏的内容制造成成功回读凭据。

| 状态 | 应如何恢复 |
| --- | --- |
| 当前计划未包含新增草稿 | 核对已有回读凭据，创建绑定草稿清单的新计划修订 |
| 没有最新写入的有效回读凭据 | 先真实 workspace_read，再保存新计划修订 |
| 已回读后再次写入，包括同字节重写 | 使用新写入版本的回读凭据，不复用旧 readId |
| 文件被外部修改、删除或工作区替换 | 重新核对当前实际文件与工作区，修复并保存回读，再更新计划 |

其中 `READ_REQUIRED` 只说明当前计划缺少相应草稿声明，静态提示不得断言“完全没有读过”。先通过现有 workspace/brief 读取接口判断，避免为这一次故障新建一套草稿状态 API。

不直接开放 `missingDraftFiles` 原始 details，不显示未经白名单处理的路径。若实施验证发现现有查询确实不足以恢复，再单独提出有限字段方案并做权限评审，不在本批顺带扩展数据出口。

`capture` 校验新操作的当前工作区；`assertReference` 校验固定历史计划。两者用途不同，保留这个区分，不能为了修复新稿绑定把全部历史结果强制迁移到最新工作区。

### 文件与测试

主要修改：`packages/pi-adapter/tool-diagnostic.ts`、`packages/research-tools/definitions.ts`、`skills/piresearch/pi-research-paper/SKILL.md`、`skills/piresearch/pi-research-paper/references/build-and-review.md`。`briefs.ts`、`draft-reads.ts` 和 `build-service.ts` 原校验保持，仅在必要的错误表达范围内触及。

复用 `tests/unit/scientific-method-checkpoints.test.mjs`、`tests/unit/scientific-review-protocol.test.mjs`、`tests/unit/research-brief-flow.test.mjs`、`tests/unit/publication-build.test.mjs`、`tests/unit/tool-error-diagnostics.test.mjs`、`tests/integration/research-brief-http.test.mjs` 和 `tests/integration/publication-dialogue-http.test.mjs`。技能发行复用 `tests/unit/builtin-skill-releases.test.mjs`、`tests/unit/skill-runtime-binding.test.mjs`，自动确认使用 `tests/unit/automatic-approvals.test.mjs` 的真实证明链夹具，不能用测试直接 confirm(USER) 冒充自动路径。

### 本批验收

1. 重现“已确认空 draftFiles → 新增且回读 main.tex → manuscript_create 拒绝”；提示说明计划未绑定，而非断言未读取。
2. 复用有效最新 readId，保存并合法确认新计划修订后创建稿件成功；旧计划和旧稿件完整保留。
3. 旧 readId、跨会话 readId、同字节重写、外部变更、工作区替换仍拒绝；不能自动更换 sourceDigest 或引用旧稿。
4. confirm、合法 fullAccess 自动确认、批准撤销与版本冲突分别按现有契约处理，不新增自动确认权限。
5. 重开会话后已完成稿件与历史固定计划仍可核验；升级新技能不覆写历史归档或自动重绑旧会话。

### 实施步骤

- [ ] 先补“已有回读但计划未绑定”的精确复现和安全提示测试，保留原拒绝断言。
- [ ] 完成静态恢复诊断、工具调用顺序和技能指导，不自动修改计划或草稿。
- [ ] 运行检查点、稿件及对话定向测试，覆盖两种确认模式和历史重开。
- [ ] 发布新技能版本，验证旧会话可从运行时诊断获得恢复指导而不更换其固定 bundle。
- [ ] 主代理集中验收、独立关键复核后提交推送。

## 集成验证 发布和恢复

上述四批独立推进；每批先固定并沿用其 3–5 条验收条件。开发时只跑相关检查；集成时主代理集中做适用的全量回归、干净构建与一次独立复核。若后续必要修复改变公共接口、依赖或运行环境，重跑受影响验证，不能直接沿用已失效证据。

常规定向测试使用构建后的真实 dist：`npm run build` 后执行 `node --test --test-concurrency=1` 并逐项列出本批测试文件；全量使用 `npm run test:core`，干净构建使用现有 `npm run verify:build`。脚本可能很长，执行时观察原进程，不因观察超时重复启动。

真实 Pi、Docker 和浏览器只测本批关键路径，使用隔离数据目录与脱敏最小来源，不操作上午真实研究记录。live 环境不可用或测试跳过时记录 not_run/skip，不能记作通过。原始日志留在原处，只保存精简的验收结果、摘要和引用。

上线前记录实际提交 SHA、启动命令、相关 dist 摘要、技能发行摘要和编译镜像摘要，明确本次运行的代码与环境身份。代码提交与服务启动是两个动作；推送代码不代表运行中的进程已经更新。需要切换服务时先核对在途作业，不擅自重启用户使用中的服务。

代码恢复使用正常后续提交，不 reset、强推或重写历史。镜像恢复通过已有配置入口显式选择经匹配校验的配置；不能只把 image 指回旧版而忽略本机 profileDigest 匹配要求。所有历史记录保持原始失败或成功状态，新尝试创建新记录。

## 本次方案交付状态

- 已完成：原始诊断与当前调用链核对、官方 Debian 文件归属核对、四批实施方案和验收条件。
- 待完成：所有实现复选项、回归测试、真实 Pi 与 Docker 验收、运行环境切换。
- 未改动：业务源码、依赖锁、编译镜像、模型配置、运行数据库和技能固定归档。
- 有意暂缓：通用网络重试框架、模糊引文采纳、新草稿状态 API、任意 TeX 依赖解析器、前端布局调整。
