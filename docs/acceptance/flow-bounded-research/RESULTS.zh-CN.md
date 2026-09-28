# 固定研究方案、受审修复与有界下一轮

2026-09-29。本批完成“固定方案 → 无结果失败 → 真实 Pi 私有修复 → 单独批准开发测试 → 独立审查 → 批准整合 → 正式 Run → 固定来源的第二轮 → 比较并停止”。这是一份确定性合成数据的软件验收，不是外部科学发现，也不证明多 Agent 优于单 Agent。完整 PR01–14 继续保留。

## 新增可用能力

研究活动的原生表单现在固定假设、实际对照、变化因素、父源码、数据/切分、主/保护指标、重复依据及成功、无结论和停止条件。修改产生新方案修订；服务端绑定精确来源、实际观测及原批准身份。Refill 沿当前轮固定父来源派生，Promote 沿所选实测 Run 的版本派生，不能用项目目录或可变父目录代替。

决定批准只准备候选。需要实现的候选通过已有私有工作区、开发测试、独立审查、受审整合后接入活动，正式 Run 仍另行批准。Repair 保留失败 Run，形成修复子实验并与旧式原节点重试共用次数上限；必须先明确评议为 unanswered，有测量或有意义的非零退出不能机械认定为无结果。

比较使用真实归档指标和契约单位，不能把失败补成有效测量。已应用方案、未应用历史与当前有效性分别保留；晚到结果会使待批准提案过期。报告可纳入最多5个活动，自动包含它们的实际观测及对照，冻结 `research/<campaignId>.json` 和 `plans/<planId>.json`。旧记录不会被追认成新方案。

## 真实流程与结果

活动 `04cb3e03…` 最多2轮、每轮6候选、同修复链2次尝试，自动分析关闭；分析尝试额度为2，不是货币额度。三份方案分别是 `ac89a09f…`（Refill）、`8aef0c53…`（Repair）和 `1643eb42…`（Promote），最后另行批准 Stop。项目原配置为一阶，选定对照固定源码为二阶；项目文件未被候选覆盖。

| Run | 配置与来源 | 实际结果 | 持出 MSE（squared-target） |
|---|---|---|---:|
| `ca819399…` | 既有二阶固定对照，不重新运行 | succeeded / complete | 0.000050345031695457565 |
| `18d75977…` | 从二阶来源只改为999阶 | failed / incomplete，明确评议 unanswered | 无 |
| `4265e905…` | 失败来源的受审三阶修复子实验 | succeeded / complete | 0.00005135731444943983 |
| `85360021…` | 从三阶实测 Run 固定源码只改为四阶 | succeeded / complete | 0.000051416001308461135 |

所有候选保留同一240行合成 CSV 和前180训练/后60测试切分。999阶在输入检查处抛出 `ValueError: not enough data points`，没有 metrics/model/predictions。浏览器读取真实 stderr 后，使用相同 owner HTTP 评议入口记录 unanswered；原生 prompt 对话框未自动化，不把这一步说成全程 UI 操作。

真实 `zai-coding-cn / glm-5.3` 在私有会话 `ad469e07…` 将配置改为3阶，调整按配置检查的协议测试并增加点数不足用例，`main.py` 与 `data.csv` 原字节保持不变。测试请求 `49ac9d20…` 单独批准，实际 CPU Docker 作业 `eb2d707a…` 运行 `python -m unittest -v test_main.py`，6项通过、退出码0、完整。固定镜像为 `python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f`，context为 `desktop-linux`。

审查 `fd38b591…` 另行批准，由不同真实会话 `5e553104…` 读取4项必需证据和固定源码，提交 completed / accept，任务 accepted，原生会话以成功 `task_result_submit` 回执结束。实现与审查会话均 idle；5+3条 SDK 用量观察不是HTTP请求数或账单。Reviewer 曾因缺少 input 字段收到1条工具错误，之后正常完成，错误回执保留。其摘要误称 stderr 为空；实际 stderr 保存6项 unittest 输出，原审查不改写，以归档日志和退出码为准。新增边界测试只断言 ValueError，尚不能单独区分点数检查与后续奇异矩阵检查；不据此声称充分测试覆盖。详见[原审查结果](review-result.json)及[执行证据](live-evidence.json)。

受审整合只包含 config.json 和 test_main.py。四阶候选继承三阶源码后另改参数，报告明确将三阶开发测试/审查标为祖先来源，未追认为四阶测试。两项新成功结果的 MSE 都略高于二阶对照，因此没有声称改善。活动按2轮上限停止，所有科研判断仍为 pending。

## 固定交付与边界验证

[报告](report.md)为 `d6b1a226-aea6-4469-bda5-b2fabbfb6232`，当前 current / verified。[离线成果包](bounded-research.tar.gz)为 **71,348字节**，SHA-256 `35573fb10691b2f0c9d0f7f7e429ea096454010851d4c3e86d8502385ba6b70c`。实际解包57个条目，55个固定文件逐项与[清单](package-manifest.json)、方案/比较引用、原始源码和产物字节一致。包中含失败记录及修复来源；没有重新编译旧论文。

HTTP与CLI的 `report_inspect`、`campaign_plan_inspect`、`campaign_comparison` 返回一致；带鉴权的归档下载与交付文件逐字节相同，见[传输核验](transport-evidence.json)。浏览器完成方案表单、四种决定、测试/审查/整合/Run批准、固定JSON读取、活动与精确失败Run回跳；桌面和390px可用，报告及活动刷新恢复原选择，见[浏览器记录](browser-evidence.json)、[窄屏报告](report-mobile.png)和[比较页](comparison-mobile.png)。浏览器下载落点和独立 console error 清单未另验。

隔离副本撤销修复审查的原批准后，已应用方案 stale，新报告报 `PLAN_INPUT_STALE`，新导出报 `REPORT_STALE`。普通派生孙实验在撤销前能准备并单独批准 RunIntent，撤销后新的 prepare 和现成 intent 的 submit 均报 `APPROVAL_STALE`，不是仅因活动停止而拒绝。历史正文、固定引用及原包可读且字节不变，上一批论文报告 `a41b281c…` 仍 current / verified；主验收库不改。见[撤销证据](revocation-evidence.json)。

另一隔离副本以真实既有对照建立零分析额度活动；手动请求后4次派发（含数据库重开）均被持久阻断，无模型用量、Worker准入、尝试、预算预留或 Run 新增。该项是服务级预算边界验收，没有调用付费模型，见[额度证据](budget-evidence.json)。活动分析额度不包含本批单独授权的实现/Reviewer会话，不能据“分析已用0”推断没有模型费用。

## 兼容、环境与验证

基线433条旧记录中，副本仅2条、原库仅1条 workspace-lease 正常变化，旧业务记录及10份原生会话文件原字节保持不变；本批仅新增3个正式Run，0个编译作业。原优化计划、锁文件、冻结技能发行与编译器目录没有改动。

验收副本最初遗漏受管 Git 对象，旧父提交无法解析，私有会话保持排队且模型未启动；从原仓库只读复制对象到副本并核对父提交后，通过既有恢复入口继续，原仓库不改，见[环境恢复](environment-recovery.json)。三阶/四阶 supervisor 启动各遇到2/5次 SQLite锁错误，后续恢复并完成，未重复数值执行；原日志私有保留、摘要与次数见[验证详情](verification.json)。锁等待与重复深度来源校验的性能优化留到后续，不扩大本批。

最终全量 **672项：650 pass、0 fail、22 skip**；干净安装、构建、类型检查通过，**385个dist文件一致**。首轮唯一失败是旧传输测试漏列4个仅用户操作，已精确修正测试分类，未放宽权限；单项复验及最终全量通过。独立审查关闭了正式Run来源绕过、轮父来源漂移、混合Repair额度、晚到结果、跨活动数据来源、观测篡改及精确Run回跳问题，无本批阻断。

方案中的数据产物是固定声明输入，尚不证明程序逐项实际消费；重复数大于1显示需进一步核验，不制造重复实验结果。完整 WorkingGrant/RunGrant/DiscoveryGrant、单/多 Agent 收益评估、其余PR08矩阵、文献/技能后续能力、远程后端与分发仍在原计划中。
