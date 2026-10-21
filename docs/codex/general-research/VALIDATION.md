# 验收手册：通用科研工作台

本文件规定后续实施的验收方法，不是已运行测试的报告。2026-10-21 本轮仅编写设计及接续文档，未实施 GR00–GR10/R01/R02，未启动产品、执行产品测试、构建或提交产品代码；方案文档另行校验、保存并交付。任务状态以同目录 **STATE.json 为唯一权威**；本文件中的案例、命令、预期与清单不构成产品完成证据。

配套：[设计](../../superpowers/specs/2026-10-21-general-research-design.md)、[执行计划](../../superpowers/plans/2026-10-21-general-research-plan.md)、[STATE.json](STATE.json)、[BASELINE.json](BASELINE.json)、[HANDOFF.md](HANDOFF.md)。验收编号与计划 A00–A10、AR01–AR02 对齐；B01–B10 是对应的真实浏览器旅程。

## 1. V-GATE：每批集成与交付门槛

### V-GATE.0 授权、基线与资源

- 开始实施前读根及适用 AGENTS.md、当前任务、STATE 和交接。根 AGENTS 当前仍暂缓前端布局；用户启动范围须覆盖本方案必要入口与交互调整，不能把规划文档当实施授权。
- 基线同时记录仓库绝对路径、分支、HEAD、选定 dirty 文件的 SHA-256、diff 摘要与原有修改归属。当前已知 HEAD 为 `388110292f046e5f2fc7f9e52879867495df64b5`，有约 321 条普通 dirty 清单；这不是干净基线，也不是逐文件展开后的完整数量。
- 使用当前工作树或包含所需当前改动的隔离副本。从纯 HEAD 创建 worktree 会漏掉既有未提交实现，不能冒充同一基线。不 reset、clean、全仓 checkout/stash 或覆盖 unrelated 改动。
- 默认一个实施者；只有文件、接口、验证及数据库/端口/dist 等运行资源均独立才可两个。纯文档修改只做相关文档验证，不运行无关产品检查。
- 测试使用受控临时项目、临时数据库、受管临时文件与隔离服务端口。任何 destructive 生命周期、恢复和故障注入只作用于这些 fixture；不得读取 `.env`、密钥、真实 runtime DB 或私有原生对话来准备样本。

### V-GATE.1 固定本批 3–5 条验收

- 沿计划 Axx 条件验收一条用户流程，覆盖成功、越界/失败，以及适用的刷新、重开或历史保留；发现关键遗漏由主代理统一修订计划及映射。
- 测试必须能暴露真实风险：权限用未授权来源反例，恢复用中断和既有副作用记录，版本用并发冲突；不能只断言实现调用了某函数。
- 开发阶段只运行相关检查。API 200、退出码 0、文件存在、模型自报完成、组件 stub 或静态字符串断言均不能单独完成产品验收。

### V-GATE.2 当前脚本与验证层次

当前已核对根 package.json；实施时再次核对脚本和锁文件。以下只是可用入口，不能把列出命令等同实际执行：

| 命令 | 当前作用及使用方式 |
|---|---|
| `npm run typecheck` | `node scripts/build.mjs --typecheck`；类型检查不替代运行行为。 |
| `npm run build` | `node scripts/build.mjs`；供当前快照定向测试使用。 |
| `npm test` | 先 build，再以 concurrency=1 运行 unit/integration 全量集；记录真实统计和 skip。 |
| `npm run test:core` | 直接运行上述 unit/integration；须确保 dist 对应当前源码，不能拿旧 dist 验新源码。 |
| `npm run verify:build` | 干净构建验证入口；先读 scripts/verify-build.mjs 确认目录和清理行为，在独占资源或完整隔离副本运行。 |
| `npm run test:parity` | parity 集；变更 operation/schema/CLI/Pi 接入时按影响选用。 |
| `npm run test:upgrade` | 旧数据升级验证；迁移/备份/恢复兼容变化时选用。 |
| `npm run test:live` | live 集；逐项核对真实后端/模型/Docker 等前置，skip 不能算 live 通过。 |
| `npm run test:baseline` | 已有基线检查；不能替代新功能的权限、浏览器或恢复验收。 |

未核实存在 `npm run test:browser`，不可写成可用脚本。Browser 需通过实际可用的浏览器自动化或可审计手工操作；记录工具、浏览器版本、构建及路径。React stub/JS DOM/HTML 文本匹配记为组件或静态检查。离线 Pi adapter fixture 记为契约测试；只有真实 Pi 调用并取得真实执行回执才记 live。

`npm test` 已包含 build，不要求在它前面机械再跑同一构建。干净构建与开发服务不可争用共享 dist、数据库或端口；主代理安排独占窗口，或使用包含本批改动且有相同摘要的隔离副本。不擅自停止其他任务服务以腾资源。

### V-GATE.3 集成、独立复核和证据复用

- 集成后由主代理集中一次全量回归、干净构建与独立复核；真实 Pi/Docker/browser 只验本批关键路径。不要求每个子任务各跑一次全量。
- 常规独立复核使用独立 Sol 会话，显式请求 `gpt-6.1-sol/high`；权限、事务、并发恢复、数据保留使用独立 Astra 会话，通常 `gpt-6-astra/xhigh`。实施会话不能自复核；不要求换模型品牌。
- 实施分配遵根 AGENTS：明确低风险局部工作可 Luna/max；工程耦合 Sol/high；复杂正确性 Astra/high。敏感权限/恢复任务不因接口明确自动交 Luna。请求参数与可核实运行时信息分别记录；不回显写“已请求，运行时未回显”。
- 复核绑定当前 SHA 和未提交差异文件 hash；暂停被审文件写入或使用含当前变更的隔离快照。复核读取差异、相关调用链与原始验证证据，不只读取实施总结。
- 结论区分阻断、非阻断、验证缺口。必要修复后重验受影响部分，再复核受影响部分；不默认新增完整重复审查轮次。
- 同一代码、环境、fixture 和证据仍有效时复用已有结果。不因续接新会话重跑；若公共接口、依赖、迁移、构建或运行环境使旧证据失效，则重跑对应集合，必要时全量。
- 相同 change/environment/blocker fingerprint 且无新证据时不盲目重复失败检查或 review；记录解除条件并转 blocked。观察超时先查原 call_id/PID，不能重复启动原副作用。

### V-GATE.4 提交、远端与完成判定

- 根 AGENTS 已授权完成批次由主代理提交并推送私密 `hailuohl/pi-research`；首次核实目标存在且 private，目标不变时不重复索要许可。子代理不提交/推送。
- 按本批明确路径或区块暂存并审 staged diff；禁止 all-stage、force、reset、改写历史、擅自合并到默认分支。当前工作分支即使名称也是默认分支名称，也只按现有对应关系正常 push，不增加 merge。
- 检查待推送提交范围而非仅工作树，排除密钥、`.env`、认证文件、runtime DB、原生对话、无关研究数据和大原始日志。推送失败保留本地提交及现场。
- 记录产品代码commit SHA、目标分支、远端目标SHA/包含关系和链接；remoteStatus统一为not_attempted/pending/synced/failed。本地提交未同步记pending，明确失败记failed，不能称远端交付完成。不为了推送重跑已有有效测试。
- 只有对应A条件、关键路径、当前快照必要验证和独立复核满足才可done；Git交付独立记录。功能done但远端pending/failed时，整体delivery.overallStatus=incomplete并在交接明确。缺环境、授权或关键验收证据为blocked，不将skip改成pass。

## 2. 验收映射：实施计划是范围，证据是事实

下表列出每条计划 Acceptance 的具体观察点。定向测试文件均为计划中的 planned 文件；实施前核对真实位置及同义现有测试，不宣称当前已经存在或通过。完整命令采用执行计划各 GR 的 Focused command，并记录真正运行的版本，不在这里维护第二套易漂移命令表。

| 编号 | 必须证明的结果 | 证据路径/方法 |
|---|---|---|
| A00.1 | 基线含 HEAD 与所选工作树摘要。 | 只读 git status/diff/cached 清单、baseline manifest hash、选定源码摘要。 |
| A00.2 | 原有修改未丢，当前批次归属明确。 | before/after 文件归属；不要求工作树干净。 |
| A00.3 | 授权、浏览器、构建及 live 缺口如实登记。 | 工具实际可用性及范围；未启动即写未启动。 |
| A00.4 | 规划与产品状态分开。 | STATE 初始 not_started；设计完成不能替代实现证据。 |
| A01.1 | 文档/产物/报告三类既有对象直接可找回。 | catalog unit/http + B01；不先请求 Agent 历史卡。 |
| A01.2 | 预览对应固定 ID；错误状态准确。 | B01 固定文档/报告定位、不可读与读取失败反例。 |
| A01.3 | 分页/筛选不跨项目或权限范围。 | cursor 契约反例 + B01；见 N-PAGE/N-AUTH。 |
| A01.4 | 刷新重进可继续，旧流程正常。 | B01 重开、原文献/报告及收藏回查。 |
| A02.1 | 当前工作和具体下一步可理解。 | overview unit/http + B02 的实际对象跳转。 |
| A02.2 | 计数状态来自真实对象且去重。 | 重复批准 fixture、链接/源ID/计数对账。 |
| A02.3 | unknown 不误报成功或失败。 | B02 + N-UNKNOWN 原记录核对。 |
| A02.4 | 无上下文的旧项目仍可使用。 | B02 旧项目及空项目，不编造研究目标。 |
| A03.1 | 多方向保留，当前采纳明确。 | context/resume 测试 + B03 采纳/历史。 |
| A03.2 | 两窗口冲突保留草稿。 | CAS 测试 + B03 并发保存与另存。 |
| A03.3 | 明确继承内容，不继承旧授权。 | B03 绑定预览 + 新会话授权反例。 |
| A03.4 | 旧 brief/报告字节与摘要不变。 | 前后固定 fixture digest、绑定 Run 引用。 |
| A03.5 | 备份恢复/归档后引用正确。 | context-backup + N-LIFE；B03 恢复后回查。 |
| A04.1 | 至少两种非实验研究可确认计划。 | profiles unit/http + B04 文献与理论/定性。 |
| A04.2 | 类型只影响建议，不扩大权限。 | 变 profile 前后权限拒绝对照。 |
| A04.3 | 旧计划与数值方法兼容。 | brief/plans 回归 + 旧计划实际入口。 |
| A04.4 | 协助/结构化/机器检查覆盖可辨。 | B04 方法说明对照真实工具与测试覆盖。 |
| A05.1 | 自定义行列保存并重开。 | comparison unit/http + B05 至少 2×2。 |
| A05.2 | 0、未报告等缺失语义不同。 | 0/false/空字符串/六种 CellStatus 契约与 UI。 |
| A05.3 | 固定引用可查，失效不被隐藏。 | B05 + N-SOURCE；固定页段/解析ID核对。 |
| A05.4 | 并发保草稿，旧快照不变。 | CAS/idempotency + B05 冻结后再编辑。 |
| A05.5 | 恢复后表格与引用一致。 | comparison-backup + N-LIFE 全引用校验。 |
| A06.1 | 只在明确资料、行列范围产生候选。 | extraction scope/flow + B06 + N-EXTRACT。 |
| A06.2 | 无权材料、未选单元格不可读写。 | 原读取器权限交集、Task/Attempt、行列sourceScope反例。 |
| A06.3 | 中断/显式retry不重复已提交候选；未提交项可重算，协作关闭不暗派发。 | 小Task最终提交、独立candidate记录、retry幂等 + B06。 |
| A06.4 | 模型不可自授 verified/采纳。 | 候选恶意输入契约、用户核对审计。 |
| A06.5 | 改列/撤权后旧候选失效。 | admission 再核验 + N-EXTRACT 与新候选版本对照。 |
| A07.1 | 同主张相反证据并存。 | relations/matrix 测试 + B07。 |
| A07.2 | 每关系有理由与固定依据。 | 固定 Claim/Evidence digest 回查。 |
| A07.3 | 标签/条数不接受结论。 | 关系更新前后 Claim 状态与接受权限不变。 |
| A07.4 | 主张/来源变化需复核，历史保留。 | B07 改主张与撤权 + N-SOURCE。 |
| A08.1 | 日常确认无需读 JSON 理解范围。 | B08 做什么/原因/范围/影响/停止条件可见。 |
| A08.2 | 精确内容可核对。 | 展开固定输入/版本/diff，与真实操作对照。 |
| A08.3 | 按钮只控制实际支持对象。 | capabilities 测试 + B08 pause/resume/cancel 边界。 |
| A08.4 | unknown/撤销/中断准确，无重复动作。 | controls/automation + B08 + N-UNKNOWN。 |
| A09.1 | 编辑生成新版本，原报告不变。 | results-reuse + B09 前后 digest。 |
| A09.2 | 新成果回查固定比较/证据。 | 报告 source manifest 与引用定位。 |
| A09.3 | 仅所选范围，缺失语义完整。 | export unit + B09 实际下载内容/manifest。 |
| A09.4 | 并发编辑保草稿。 | 两窗口 CAS；未覆盖后写者输入。 |
| A09.5 | 恢复后引用与历史有效性正确。 | results-restore + N-LIFE；历史不自动 current。 |
| A10.1 | 三类旅程，无虚构实验字段。 | B10/J1–J3；至少一个无 Run、一个有分歧/无定论。 |
| A10.2 | 重开与旧数据兼容。 | B10/J4–J5；适用 upgrade 回归。 |
| A10.3 | 结果、依据、版本、失效均可回查。 | 固定对象链、截图、引用和下载内容。 |
| A10.4 | 当前快照必要验证/复核无阻断。 | V-GATE 全量/干净构建/独立复核记录。 |
| A10.5 | 交付和未覆盖范围真实。 | STATE/HANDOFF/能力说明/commit/remote 对账。 |
| AR01.1 | 启动准备故障显式可见。 | 临时 control mkdir/log open 故障，真实作业状态/错误。 |
| AR01.2 | 清故障后可恢复调度。 | 再 tick 后原/下一作业按状态继续，不被 launching 卡死。 |
| AR01.3 | 无双启动且保留历史。 | 竞争 tick、启动计数、作业ID/日志及历史事件。 |
| AR02.1 | 合法长命令最终结果不丢。 | 超过原 RPC 窗口的受控命令，真实最终 result/jobID。 |
| AR02.2 | 超时/取消语义准确。 | deadline 内外、取消竞争、仍运行 unknown 的终态核对。 |
| AR02.3 | 迟到结果/重试不重复副作用。 | 单一 command/jobID、幂等回执与副作用计数。 |

R01 先前有隔离故障复现，R02 先前为代码路径分析；这是既往风险线索，不能充当当前版本已修复或已验证。开工只读核对；问题已不存在需引用当前代码/回归证据后记 not_applicable。未触发问题不等于不适用。

## 3. 浏览器样本与执行纪律

准备两个完全隔离的合成项目 P-A/P-B，不使用真实研究数据。P-A 至少有 35 个目录对象覆盖 30 条默认页界、两篇已归档测试文档、固定解析/页段、一个报告、一个普通产物；P-B 有名称相同但 ID 不同的对象。另准备空项目和旧 schema fixture 项目。所有创建动作由实际支持的 UI/API/fixture 完成并记录方法，不能用修改 runtime DB 代替用户流程。

资料内容必须可断言：S1 支持、S2 反对同一示例主张；包含数值 0、false、未报告、不同单位/条件与不能判断项。为权限反例准备“元数据可见但正文未授权”“摘要可读但全文未授权”“仅行1列A允许S1、行2列B允许S2”的独立来源范围。测试内部可用稳定测试ID定位，不能把它展示成普通用户必须理解的内部代码。

Browser 记录初始构建/URL、账号或 actor 类型（不含凭据）、项目ID、浏览器版本/视口、每步操作和可见结果。截图至少覆盖关键成功、失败、重开状态；截图本身不能证明服务端拒绝，应关联 HTTP/审计或定向测试证据。下载在独立临时目录检查，记录实际文件名、字节数、SHA-256、解析结果；点击下载按钮不等于文件有效。

## 4. B01–B10：真实浏览器逐步验收

### B01 直接找回资料与成果（A01.1–A01.4）

1. 打开 P-A 主会话，直接进入“资料与成果”；不向模型索要历史卡。预期首屏列出既有 document/artifact/report，URL或选中项目仍为 P-A。
2. 以名称搜索并切换类型。预期请求有界，列表与过滤条件一致；收藏一个报告后刷新，收藏仍在。
3. 打开文档和报告，点击固定引用。预期对象ID、固定版本/解析、页段或报告ID与 fixture 一致；返回保留合理查找上下文。
4. 翻到下一页，再切换筛选/项目。预期重置旧 cursor；P-B 同名对象不会串入 P-A，列表实体不重复。
5. 模拟一次列表请求失败。预期保留已加载内容并显示重试错误；不能显示“项目为空”。重试只读请求后恢复。
6. 关闭标签并重开 P-A；预期仍能找到同一对象，历史报告正常。没有来源引用的旧对象显示真实 legacy/unknown，不伪造固定依据。

### B02 概览与真实下一步（A02.1–A02.4）

1. 打开 P-A 概览。预期研究方向、进行中工作、待决定、成果和来源警告引用真实对象，不由模型猜测。
2. 创建同一批准在多个旧组件可见的 fixture。预期待决定计数只计一次；点入跳到准确审批对象。
3. 在可控任务中拒绝批准。预期概览显示拒绝原因或可行下一步，不能仍显示正在执行；确认操作不被替代批准。
4. 查看执行效果 unknown 的 fixture。预期明确“待核对”，提供 inspect/reconcile 等真实能力，不标已完成/失败，不出现盲目重试。
5. 打开空项目、无新上下文的旧项目。预期空项目有通用起步入口，旧项目可进原会话/实验/报告，不编造目标。
6. 刷新并重开，逐项对账任务ID与计数；若概览读取失败，显示错误及旧数据时间，不把旧数据当实时成功。

### B03 上下文、决定与跨会话接续（A03.1–A03.5）

1. 从 P-A 保存方向一与方向二，查看历史。预期两份修订都存在，草稿不替换已采纳方向。
2. 显式采纳方向一，查看其计划/决定固定引用。预期“采纳方向”不被写成 Brief.confirm 或 Claim.accepted。
3. 两个标签基于同一 head 编辑不同内容，先保存窗口一，再保存窗口二。预期第二次得到可理解冲突，本地草稿未丢，可合并/另存。
4. 新建会话并选择“基于此继续”。预期先显示继承的固定上下文/计划/决定及来源；用户确认后绑定该修订。
5. 尝试读取仅旧会话授权的原文或执行旧固定 Run。预期新会话仍需原有适用授权，不能继承旧 grant。
6. 来源失效后重开。预期旧上下文可按权限回查，明确需复核，不能自动换绑“最近有效”版本。
7. 在临时环境按 N-LIFE 做备份恢复与归档/恢复，浏览器打开同一固定引用；对照旧 brief/报告字节摘要不变。

### B04 两种非实验研究与方法覆盖（A04.1–A04.4）

1. 新项目提出“比较 S1/S2 对该机制的解释”。选择文献研究与适当深度，查看计划提示；预期可用文本标准，无实验ID、数值指标或 Run 强制项。
2. 另建理论/定性研究，如“整理定义、假设与反例”。确认非数值判断标准并保存；预期计划能正式确认，不虚构运行。
3. 查看方法覆盖说明。预期协助/结构化/机器检查范围明确，未实现验证器不标为自动检验通过。
4. 改工作类型后尝试未授权联网、读取全文或运行。预期类型改变不改变原权限拒绝结果。
5. 打开旧 brief 与已有数值方法计划，核对原摘要/固定引用不变；普通问答无需强选类型或生成冗长计划。
6. 刷新、关闭重开两个新项目，预期 profile 绑定仍对应原 brief digest；输入不受支持方法时明确提示，不静默改选。

### B05 手工比较、缺失语义与冻结（A05.1–A05.5）

1. 创建至少两行两列，填写 0、未报告、条件和固定来源，保存。预期 0 不显示为空，未报告不变成否定或零。
2. 分别选择 not-read/ambiguous/not-applicable/conflicting，查看对应说明。预期状态与 value 约束一致，不把多义状态折叠成空白。
3. 点击某格引用，回到 S1 固定页段；再查看单位/样本不同的两格。预期保留条件，不自动排名。
4. 选择部分行与列修订冻结快照K1，记录准确选择；再改草稿列问题及单元格。通过snapshot读取重开K1，预期固定子集的原字节/摘要不变，旧答案提示列问题已变需复核。
5. 两窗口并发改同一格，后保存窗口得到冲突且输入保留。相同 requestKey 相同输入重试返回既有回执，不再创建修订。
6. 来源撤销/解析版本变化后重开。预期历史定位仍指旧来源，新核对/冻结按原规则受阻；不静默切换新解析。
7. 备份异地恢复后核对行列修订、cell heads、快照与引用；超限保存显示具体限制且无部分落地。

### B06 固定范围的真实 Agent 提取（A06.1–A06.5）

1. 选择小样本行、具体列修订和允许来源，查看提取提案。预期明确表修订、row/column sourceScope、固定来源及chunk映射；每Task单行、同来源集合、最多5格，宿主绑定chunkId与执行身份。超过maxTasksPerTeam/预算时明确缩小批次，不暗中建更多任务。
2. 以适用权限确认后启动真实 Pi 关键路径；记录真实 provider/model/Task/Attempt 与回执。无凭据/额度/运行条件写 blocked；不得用离线 fixture 或旧 npm test 冒充 live。
3. 查看候选 TaskResult。预期只含已选单元格的候选及来源/局限，带 bindingRef、宿主 taskId/attemptId/inputDigest；任务 Agent 未写正式单元格。由 owner 显式 apply 后才以 CAS 保存未核对内容，再逐格打开固定证据核对值。
4. 在另一标签撤销 S1 读取或修改列问题，再等待旧 Attempt 回传。预期候选 admission 再核验并拒绝/标失效，不沿用提案时的旧批准。
5. 在一个片最终提交后中断另一个片，再重开。预期先inspect真实Attempt和独立候选记录；已提交片不重做，未提交片可重算。partial结果会终结Attempt，必须沿既有显式retry继续同范围未完成格；不靠task_progress_report当候选保存，也不因Task.result被retry清空丢失历史候选。
6. 尝试读取另一行/列正文、伪造 verified、复用旧 binding 到新 Task/Attempt。预期均被服务端拒绝，包括 fullAccess；见 N-EXTRACT。
7. owner 应用并核对一个候选。预期记录真实应用/核对主体与范围，任务 Agent 不能调用正式 cells_upsert/review，不能自授 verified、采纳 Claim 或生成已审阅报告；下载或摘要也不能泄漏未授权单元格原文。
8. 关闭多智能体后尝试prepare/activate/新claim。预期不能启动批量提取，按现有draining保留结果和移交未启动任务；用户仍可手工查看、填表、核对与导出，不自动开启开关或建队。

### B07 分歧矩阵与结论边界（A07.1–A07.4）

1. 对同一固定 Claim 添加 S1/support 与 S2/contradict；填理由与条件。预期两项同时可见，不覆盖或按票数得可信度。
2. 打开每项证据。预期 Claim statement digest、Evidence binding digest、固定页段一致，可理解支持/反证适用范围。
3. 添加 background/method/qualify，预期不误归类为支持，关系数量变化不自动接受 Claim。
4. 先冻结选定关系为矩阵快照M1，核对单个固定Claim、relation修订/状态、Evidence引用与digest；再修改主张或撤回关系。预期旧关系需复核，通过snapshot读取的M1内容不变，不落到当前关系投影。
5. 撤销来源并重开矩阵；预期显示失效和历史，原 Claim 决策链仍生效，不能靠矩阵标签绕过采纳。
6. 模拟保存失败。预期关系不假报成功，重试相同请求不重复；新报告或导出重新核验来源。

### B08 行动摘要、控制边界与 unknown（A08.1–A08.4）

1. 准备一次受控写文件或研究动作。预期默认看清做什么、为何、固定输入范围、预计产物和停止条件；没有可靠估算就写未估算。
2. 展开精确参数和 diff，对照实际 operation。改变目标或版本，预期原确认失效；不能仅改摘要还沿用旧批准。
3. 拒绝操作并刷新。预期保留拒绝历史，不执行副作用；改变 readonly/confirm/autoEdit/fullAccess 不复活已拒绝或 stale 的批准。
4. 对支持暂停的 Campaign 操作暂停。预期只说明已暂停该对象，不声称所有既有 Run 都已停止；不支持的 cancel 不显示成可用按钮。
5. 恢复固定任务，验证同一 run/command/jobID。预期不新建替代运行，不重复写文件或花费额度。
6. 在控制窗口制造超时/断连但执行可能继续的情形。预期 unknown，先 inspect/reconcile；重开继续核对原 ID，不自动重试。
7. 若真实路径依赖 R01/R02 且仍存在，记阻断并先按 AR 条件处理；不以 UI 看起来正常略过执行端风险。

### B09 编辑、固定快照与真实下载（A09.1–A09.5）

1. 打开固定报告 R1，记录原摘要，选择以它创建 Markdown 草稿。预期生成新对象/版本，R1 原字节不变。
2. 修改一段并引用 K1 比较快照/矩阵，保存新版本；预期可回查固定证据，草稿不自动标已审阅/已采纳。
3. 两窗口编辑同一版本，预期后保存冲突且草稿可保留/另存。回到 R1 核对原报告未变。
4. 先将选定行列freeze为K1，或将单个Claim及选定关系freeze为M1，再用ResearchSnapshotRef选择JSON/CSV/Markdown导出。预期导出只消费该固定子集，不临时裁切活表、不混入之后草稿或其他项目数据，两类快照均可正确读取。
5. 下载到临时目录，检查实际字节/格式/摘要。JSON 保留状态及引用；CSV/Markdown 附 manifest，0/false/缺失不混淆，含逗号/换行/引号/中文仍可解析。
6. 用以 `= + - @` 开头的合成文本检查 CSV 安全文本处理和保真说明；仅检查文件，不执行单元格公式。文件名/路径不能允许目录穿越或任意宿主路径。
7. 撤销来源再请求新有效报告包，预期拒绝或明确无效；历史 R1 原文仍按现行权限可回查，不能把历史下载标成新核验成功。
8. 临时异地恢复后重开成果并核对引用/有效性；浏览器下载失败显示真实错误，不虚报“已导出”。首版不验任意第三方无损往返导入。

### B10 三类研究、长期重开与旧项目（A10.1–A10.5）

1. J1 文献综合：问题→计划→材料→比较→逐格原文→反证→决定/成果。至少保留一个争议或证据不足结论，不补造统一答案。
2. J2 数据分析：问题/数据→计划→现有授权执行→原始数据/方法→有界解释→成果。记录真实 Run/manifest/输出；无执行条件时该旅程 blocked，不能用静态数据冒充实际运行。
3. J3 理论或定性：定义/材料→推导/编码/解释→假设/反例→未解问题→笔记；全程不强制实验ID、数值主指标或 Run。
4. 在一条旅程中途关闭标签并重开项目，查看概览/上次决定/阻塞，明确选择继续。预期回到固定修订，仅在有效授权内推进。
5. 切P-A/P-B，切项目级多智能体开关；预期目录、上下文与grant不串项目。关闭后以手工表格、候选核对、原主会话授权内文本辅助和导出完成同一研究业务目标；自动批量提取不可启动，未启动任务按draining移交，不能伪装运行任务都已取消。
6. J5 旧项目：打开旧会话/文档/实验/报告，再从目录找回同一对象；旧摘要与历史内容不因新增字段被重算。
7. 检查报告、引用、固定表格/矩阵和下载相互对应；按 N-LIFE 做临时备份/恢复及适用升级回归。
8. 对照 STATE、当前快照集成证据、独立复核、提交/远端同步和能力说明。核心任务 blocked 或关键 browser/live 未覆盖时，明确未完成范围，不能宣称整套交付完成。

## 5. 必测反例与不变量

### N-AUTH：权限与派生信息

- P-A owner 的目录能力不得直接暴露为 Agent 全项目读取工具；Agent 按实际角色/会话/Task/Attempt核验，不能信任输入里的 owner/actor/projectId 标记。
- 检查同名跨项目ID、伪造 sessionId、附属助手借用主协调身份、只读审查者请求非固定范围、归档项目写入。标题、摘要、计数、引用列表、单元格rawText和来源manifest均属于可能泄漏信息。
- readonly/confirm/autoEdit/fullAccess 四模式分别验证现有真实语义；不能凭名称推导能力。fullAccess 可作用于原边界内自主执行，不能绕过专门来源、任务绑定、冻结引用或科学 Claim 采纳约束。
- 更改权限/撤销 grant 后，每页、每次原文读取、候选应用和新导出都重新检查；缓存、cursor、CatalogRef、快照ID不当访问令牌。

### N-PAGE：有界读取、cursor 与限额

- 目录默认30、最大100；检查 1/30/100/101、0/负数/非整数，query 长度200/201。超限明确报错，不截断后声称已保存完整内容。
- cursor 绑定 project、types/query/sort及读取身份范围摘要；旧 cursor 配新过滤、新项目或撤权后的身份必须拒绝或按明确规则重置。每页仍调用权限校验。
- 同 updatedAt 的记录按 kind/id 有稳定次序；客户端按实体键去重。并发新增/更新按 live-keyset 已文档化语义检查，不要求跨请求事务快照，不声称无遗漏历史快照。
- 比较表500行/30列、每次50格、UTF-8输入512KiB、explanation4000字符、value/rawText12000字符、每格20个evidence；读取行分页30/100。逐项检边界与超限整批原子性。
- 不把全量历史塞进 `/state` 或浏览器再截断；检查实际响应条数/体量与请求，不仅检查屏幕渲染数量。读取失败不误判为空。

### N-EXTRACT：严格固定 extraction binding

提取权限不是“允许这个 project”。按设计6.6，prepare 产生不可变 `EvidenceTableExtractionBinding`（record kind 为 `evidence-table-extraction-binding`），复用 TeamService，不建设通用 grant 系统。验收以下准确绑定，不能降格为任意可选输入：

1. 内容含schemaVersion、id/digest、rootSessionId、tableId/tableRevisionId、rowScopes、columnRevisionIds、sourceScopes、chunks、modelDigest、permission、lifecycleEpoch。rowScopes逐行核验，不作笛卡尔积授权。chunks固定chunkId/rowId/rowVersion/columnRevisionIds/sourceScopeIds，每片一行、同来源集合、最多5格；Task仅绑定一片，普通读取器从宿主身份获得唯一范围。
2. `sourceScopes` 仅接受 Evidence 的 evidenceId/digest/artifactId，或 DocumentVersion 的 documentVersionId/documentDigest/parseResultId/parseDigest/allowedPageNumbers/existingAccessRef。由宿主调用原授权验证器冻结，不接受裸 URL、任意文件路径或万能 CatalogRef；全表来源并集不等于每格可读全部材料。
3. 宿主Task创建写入evidenceTableExtractionId/extractionChunkId，通用TaskSpec/agent_delegate不接受；team-plan/planDigest固定binding与分片映射。TaskAttempt固定`{id,digest,chunkId}`，claim的inputs.evidenceTableExtraction/inputDigest只纳入该片行列和来源，不注入未经授权正文。
4. 在 claim/active/assertRetry/submit 及每次提取读写核验服务端 actor、Task/Attempt、team、generation/lease、plan/directive version、context-snapshot/inputDigest、模型、权限、生命周期和行列修订；输入不能自选 taskId/attemptId/generation/permission。
5. 显式retry沿用原binding/chunk，新Attempt获新generation；旧Attempt不能创建新候选，不吸收新增资料/列。每片每Attempt只最终submit一次；completed/partial/blocked均终结Attempt。专用结果校验与提交事务同时保存candidate/TaskResult；partial内已提交候选保留，未提交项可重算，不用进度事件或被清空的Task.result做恢复真相。
6. 任务只提交候选；owner applyCandidates重验来源和目标，以tableVersion及逐格expectedCellHeadVersion CAS写未核对单元格；null只表示首次创建。permission-action fingerprint含binding/chunk/版本，不给所有任务开放submit。扩大范围重新批准；现有grant不能覆盖任务会话则blocked，不能复制owner全文绕过。

允许读取集合必须逐次取交集：**binding对应行列sourceScope ∩ 当前宿主Task/Attempt有效范围 ∩ 原来源读取器当前grant/许可/contentLevel ∩ 固定项目/来源版本及生命周期限制**。由原 document/evidence/artifact 读取服务执行已有检查，提取服务不能自己拼正文或用数据库绕过。任何一项拒绝均不产生新有效候选或派生摘要。

必须构造以下反例并在候选生成、inspect、apply、摘要和导出各相关路径验证：

- 行1列A只许S1，行2列B只许S2；请求把S2引文写入A、读未选列C、通过整表摘要返回S2正文，均拒绝且不泄漏标题/引文/计数。
- 仅摘要许可却请求full-text/table/figure；有目录元数据却无原文grant；binding允许但原读取器已撤权，均拒绝。
- 伪造另一项目同ID、旧Task、已结束/取消Attempt、错误模型身份，或原Task创建新Attempt后复用旧回执；均不得凭原binding继续写。
- 在 claim→active→assertRetry→submit 分别改变 generation/lease、plan/directive version、inputDigest、权限或 lifecycleEpoch，验证每一入口拒绝；通用 agent_delegate 伪造 evidenceTableExtractionId 不能创建合法提取任务。
- fullAccess、owner创建的表格、可读旧快照、主协调委派分别尝试绕过上述绑定；预期仍满足交集。前端隐藏按钮不替代服务端拒绝。
- 分别经 artifact_read、evidence_read、text_evidence_search、task_result_read、上下游结果、快照及旧幂等回执读取，验证无间接泄漏；SessionPermissionService 的 READ 早返回不能免除提取范围校验。
- 提取中改列修订/原文解析/固定证据或撤权，再接收迟到结果；admission重新核验，不把已失效内容标为当前候选。
- 模型传入 review=verified、Claim accepted、扩大范围或新 sourceScope，直接调用正式 cells_upsert/review，或用普通任务调用提取 submit；均拒绝，未知/不允许字段按契约拒绝，不能默默应用。
- 相同binding/chunk/cell/source/columnRevision/contentDigest的重试返回既有候选；不同内容追加候选版本，不静默覆盖。相同requestKey不同输入冲突；候选与最终TaskResult同事务，失败不留孤立候选或事件。
- 已提交分片重开不丢；partial后的显式retry保留历史candidate，仅处理同范围剩余格；未提交内容允许重算。调用一次最终submit后不能继续往同Attempt增量追加；逐格运行中checkpoint不在首版。

### N-SOURCE：固定依据与历史保留

- 对照旧 brief、Run manifest、report、文稿与表快照的原始字节/摘要；新增 profile/上下文不能给旧对象补默认字段再重算摘要。
- 来源重新解析或原文件更新形成新固定引用，旧 locator 不自动指向最新内容；Claim statement改变后关系需复核。
- 已撤销/失效/不可用/unknown/legacy分别显示；历史可读不等于可产生新 current 报告或有效导出。
- 数值0、false、未报告、未读、不适用、歧义和冲突保留区别；执行成功不推导科学成功，verified 单元格不推导整表/整研究可信。

### N-LIFE：临时备份、恢复、归档和清除

1. 准备临时项目，包含上下文修订/head、决定、比较列/行/cell head/revision/snapshot、关系、关联报告与受管产物；记录对象数、项目归属和摘要清单。
2. 使用现有备份服务导出，恢复至独立空临时根和数据库，不覆盖原数据；对照实际支持版本。新增迁移时更新 backup 版本支持/完整性校验并做适用 test:upgrade。
3. 校验 head→revision、snapshot→cell/column/evidence、context→brief、report→snapshot 的完整链；历史失效状态不能恢复成 current，授权不能复活。
4. 对恢复库故意缺失修订/错digest/跨项目引用（仅隔离fixture），预期明确阻止不完整恢复或报告具体损坏，不静默丢数据后声称成功。
5. 归档后浏览可用但所有新增写入拒绝；恢复可见性不恢复过期授权。回收站/恢复沿现有策略，逐类新记录都正确归属。
6. 仅对专属临时项目测试永久清除；确认无跨项目删除、受管路径外写入/清理、悬空head/blob引用。不得在真实项目执行 purge。
7. 产品代码回退保留新科研记录；旧二进制无法安全识别新版时应预检拒绝降级，不假定可直接打开新库。

### N-UNKNOWN：超时、取消与重试

- 观察工具3秒超时、RPC观察窗口到期、浏览器断连不等于底层动作失败；记录原call_id/PID/runID/jobID，先查询真实状态。
- 通过真实受控副作用计数验证重开/重试不重复：一个文件写入、一个候选、一个命令、一个Run分别只对应既有操作；不是只检查按钮disabled。
- 取消请求、取消已确认、进程已停、结果未知要分清；Campaign pause不能声称子Run全停。迟到结果可回收并绑定原动作，不产生第二次执行。
- 无法核对时保持unknown并提供准确下一步/责任方；不因统一UI或结束批次需要将它改为failed/done。

## 6. 证据记录模板与状态转换

每批一份精简结果，原日志/截图留原处，以路径或hash引用，不复制大日志。建议证据文件放本目录 `evidence/<任务ID>/<run-id>/`；这是未来建议路径，本轮不创建虚假的运行记录。

```yaml
taskId: GR06
planRevision: <设计/计划实际版本或摘要>
recordedAt: <UTC>
baseline:
  repoRoot: <真实绝对路径>
  branch: <实际工作分支>
  head: <40位SHA>
  dirtyManifestHash: <排序后的路径/状态/选定文件摘要清单SHA256>
  selectedFileHashesRef: <选定源码摘要文件路径>
  diffRef: <本批差异位置；原有/本批归属清楚>
  excludedSensitivePaths: <类别和排除说明；不读取或复制秘密内容>
environment:
  os: <实际系统>
  node: <实际版本>
  npm: <实际版本>
  lockDigest: <实际锁文件摘要>
  fixtureRef: <隔离项目/数据库/样本准备记录，不含研究原文>
  buildFingerprint: <当前构建对应源码及环境摘要>
  services: <端口/所有者/隔离目录；无则明确无>
checks:
  - id: A06.2
    kind: unit | integration | typecheck | clean-build | browser | live | review
    actualCommand: <原样命令/浏览器操作记录路径；未运行写null>
    startedAt: <UTC或null>
    endedAt: <UTC或null>
    exitCode: <实际数值或null>
    result: pass | fail | skip | not_run
    counts: <真实passed/failed/skipped；适用时>
    logRef: <精简日志索引/原日志hash>
    reason: <skip/not_run/失败原因；不能空着冒充pass>
browser:
  journeyIds: [B06]
  browserVersion: <实际浏览器>
  viewport: <实际宽高>
  urlAndBuild: <真实URL及构建标识>
  snapshotRefs: <初始/成功/失败/重开截图路径与hash>
  stepsRef: <操作、预期、实际、对应对象ID>
  networkOrAuditRef: <证明权限拒绝/副作用次数的记录>
  downloads: <实际文件名/大小/SHA256/解析检查；没有则not_applicable及理由>
review:
  reviewerSession: <独立会话ID，不能是实施会话>
  requestedModelAndEffort: <实际请求>
  runtimeVerification: <实际回显或“已请求，运行时未回显”>
  reviewedHeadAndDirtyHash: <与上述快照匹配>
  verdict: <无阻断/有阻断/验证缺口>
  findingsRef: <文件位置、路径、证据及修复回查>
delivery:
  commit: <真实SHA或null>
  remoteBranch: <真实目标或null>
  privateVerifiedAt: <首次核验记录或已有有效记录>
  remoteContainsCommit: <true/false/unknown>
  remoteSha: <实际远端SHA或null>
  remoteStatus: <not_attempted/pending/synced/failed>
  overallStatus: <not_started/in_progress/incomplete/complete；由产品与远端状态共同判断>
blocker:
  kind: <authorization/environment/verification/review/dependency/other或null>
  fingerprint: <当前代码+环境+失败/缺口摘要>
  recoveryCondition: <什么变化后才值得重查>
nextAction: <具体动作、前提与成功条件>
```

dirtyManifestHash 是明确定义的所选清单摘要，不伪称包含未读敏感路径的全仓内容；HEAD 相同但 dirty hash 不同，需评估证据是否仍有效。提交后若树内容与被验证快照一致，可建立映射，不因SHA变化机械重跑；提交混入新内容则旧证据不能覆盖新增部分。

STATE 仅使用 `not_started / in_progress / verify_pending / review_pending / blocked / done / deferred / not_applicable`：

- not_started：未开始实施；本文和设计文件存在不改变它。
- in_progress：已授权且在执行明确任务；保存 owner/下一步，避免双重认领。
- verify_pending：实现已有，缺当前快照必要验收；不得描述为功能完成。
- review_pending：必要验证已有，待独立复核；有关键缺口应为blocked并记录原因。
- blocked：缺授权/环境/证据或有阻断；保留原阶段、fingerprint、解除条件，不重复跑无新信息的同一检查。
- done：本批3–5条验收、必要检查及独立复核满足；evidenceRefs、verification、review可追溯。implementationCommit/remoteStatus另记，功能done但远端未同步时整体delivery=incomplete。
- deferred：主代理明确延后且有范围/原因记录；不得当成通过，核心延期不能声称完整交付。
- not_applicable：仅条件任务有当前事实证明不适用；普通测试skip或没有执行到不能据此标记。

检查结果 pass/fail/skip/not_run、任务状态和产品内研究状态是三种不同维度。只在 STATE 更新任务状态；验收记录引用状态，计划复选框、HANDOFF和聊天不再维护另一份独立进度真相。

## 7. 本轮事实与后续待执行

本轮核对当前设计/计划、根AGENTS、已知脚本和相关源码，交付方案文档及文档验证。此前工程评估、旧测试通过或只读源码结论，只能以原快照和原范围引用，不能证明GR01–GR10的新服务、UI、权限、browser/live或下载已经通过。

后续实施先完成GR00和工具缺口登记，再按STATE选择下一任务。产品的真实浏览器、Pi、Docker、备份恢复、故障注入、全量测试、干净构建、独立复核及代码交付均须取得实际证据；本手册没有预填产品检查pass。
