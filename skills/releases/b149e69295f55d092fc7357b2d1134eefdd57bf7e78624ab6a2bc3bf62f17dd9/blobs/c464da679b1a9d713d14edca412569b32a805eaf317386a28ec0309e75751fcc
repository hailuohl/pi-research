---
name: pi-research-experiment-tree
description: "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。"
---

# 实验树与持续研究

项目是一棵问题树。根建立基线，子节点继承父代码与固定运行契约，以不同的版本化代码/配置回答一个新问题。运行入口 command 为 argv，环境、数据版本和评价协议同树固定；每个节点只有明确的研究问题才能判断是否回答。先遵守 pi-research-overview 的四条规则。

仅当计划中的 Run 要建立基线或检验项目相关研究假设时创建节点；节点上的代码改动必须服务于该基线或假设。无关清理、重构、bug 修复或依赖更新留在既有开发流程，不为它们创建实验节点。必要的 provisional 修复仍按下节受控处理；若研究问题本身是内存、运行时间或稳定性，相关测量可构成节点目的，不把例外泛化成任意维护节点。

## 按问题读取研究方法

本发行把科学批判性评价声明为研究方案的共用前置；宿主随本技能/资源的读取返回其固定正文及证据主技能约束。比较假设支持程度仍须对应实际证据，不能因前置内容已到达就自称通过审查。

先用 `research_skill_read` 读取当前会话固定版本的对应resource；coordinator、designer、analyst、reviewer均可读取本技能。只读方法不增加数据、建节点或执行权限：

| 具体触发 | resource |
|---|---|
| 从观察/研究问题提出候选解释、竞争假设、可区分预测或反证条件 | [references/hypothesis-generation.md](references/hypothesis-generation.md) |
| 分配实验单位、对照、随机化/区组、批次、多因素或重复测量，核对伪重复 | [references/experimental-design.md](references/experimental-design.md) |
| 需要多少独立样本/重复、SESOI、事前功效、固定预算MDE或重复依据 | [references/statistical-power.md](references/statistical-power.md) |

例如 `research_skill_read({input:{skillId:"pi-research-experiment-tree",resource:"references/experimental-design.md"}})`；其余使用同skillId与表中精确resource。需要哪些方法就读哪些，不默认启动额外分析。数据检查、统计解释、测量不确定度和主张评价使用全角色可读的 `pi-research-evidence` 主技能及其对应resource。方法记录沿已有研究计划/Artifact及Campaign字段，不新增schema；缺效应、方差、独立单位或执行依据保留未知，不能编造样本量、结果或预注册。

## 首次执行前

遵守当前项目 Python/依赖政策，核对实际训练/评价命令、已存在镜像及所选本地/SSH环境；只有仍未明确的执行要求才交用户补齐。持久环境准备和执行配方写进版本化脚本/固定镜像，首次基线contract固定入口，不在命令或env上扫描参数。coordinator/designer先读pi-research-create；analyst/reviewer只核对获准计划与输入，创建准备交具备权限者。执行后端方法读可用的pi-research-compute选定参考，读取不增加执行权限。

记录可检验假设、真实对照、主指标/单位、护栏、数据切分、重复次数、成功/不确定/停止条件。条件是研究声明，活动成功/助手完成不会自行证明科学成功。

## 未回答才修复，已回答永久冻结

启动错误没有建立基线或检验假设，可在当前provisional节点受控修复并重跑；新节点应代表新问题。差结果、不支持假设乃至数值异常也可能回答问题，不得为了得到好数字不断改同一已回答节点。

缺依赖、OOM、超时或bug发散通常是实现/硬件问题，除非节点正研究内存、运行时间或稳定性，此时可能就是答案。Pi分别记录state、integrity、answerDisposition和judgment：

- 有真实数值指标会触发answered和源码保护，即使进程失败也不能以failed逃避冻结。
- 无指标不自动等于unanswered；needs_review由用户基于真实日志评议，RESULT_REVIEW_REQUIRED时不能修改/重跑。
- 完整性不足不得宣称科学支持；succeeded仍可能judgment:pending/inconclusive。
- 确实未回答且原Run已终态才允许修当前节点；当前Agent不具备直接改实验源码的工具，用户入口受版本与冻结边界校验。私有工作区修改/提交不会自动覆盖它；需正式整合时派生子实验并明确关联修复历史。

**修复上限：**同节点连续两次未回答就交用户；不同错误、只重启或换后端也算修复。同一失败再命中第二节点，视为共享设置问题立即暂停定位，不再扩候选。本项目Campaign默认maxUnansweredRunsPerNode=2，科学回退默认maxConsecutiveRegressions=3；实际按用户批准limits，技能保留上述人工停止规则，不用新节点名/供应商绕开额度。

## 树形：堆叠小扇形

```text
平铺（错误）        无意义单链（错误）       堆叠小扇形
root                root                   baseline
├ a ├ b … ├ n      └ LR-2e-5               ├ LR-2e-5
                      └ LR-3e-5             └ LR-3e-5（保留）
                        └ arch-A                ├ arch-A
                          └ arch-B              └ arch-B（保留）
                                                   ├ schedule-A
                                                   └ schedule-B
```

平铺每次回到起点，收益无法积累；单链把并列选项伪装成继承，没有真实深度。宽度是一个决策的开放选项，深度是已解决且保留的决策。

建X为Y的子节点前说出Y建立什么：“Y选定LR，X保留LR改架构”是真正向下；“X/Y只是同时比较两个LR”应同父。三种LR选项可同轮三兄弟，下一轮不能再挂根。每轮读project_inspect及campaign_inspect的rounds/members/parentSource，检查是否只有一排根子节点或无意义长链。project_inspect只给索引，不假造上游branch/parent展示；父关系按固定来源/活动回查。

## 研究循环：从假设到逐完成决策

每轮交付一个可回查的候选比较与有限结论；以下产物必须来自真实读取或返回，不能用计划描述代替：

| 阶段输入 | 本步产物 | 下一步条件 |
|---|---|---|
| 真实父实验、固定revision和合同 | 完整父config、源码及本轮单一问题 | 同轮候选显式继承同一父修订；已回答父保持冻结 |
| 候选配置或私有实现 | 配置子实验，或开发证据、审查和整合后的子实验 | 重读子源码确认预期变化，私有commit不作正式来源 |
| 已整合实验与固定合同 | 精确intent、批准清单及实际Run ID | 只提交获准意向；queued/running/unknown等待原Run |
| 原Run的真实终态 | 日志、产物、有效指标和相对父的比较 | 按证据决定repair/refill/promote/stop，再保存结论与限制 |

1. **读基线源码。** experiment_source_list/read固定experimentId+revision，读config/模型及运行契约，确认参数在哪。需实现代码时按pi-research-git准备私有来源工作区，不假设当前工作区就是实验分支。
2. **只拟一轮一个决策。** 例如学习率、schedule或init选其一；每个备选说明具体改动、可测量结果和同轮对照，不混多个决策。
3. **有意选父。** 第一轮用baseline，后续用前轮确认赢家。同轮siblings从同一固定revision派生，config完整替换，expectedParentRevision防陈旧；新代码先开发/审查/整合。

方法例子（只适用于实际已有训练runner的config，随包curve-fit不接受这些字段）：从父config复制完整对象，分别把learningRate改成0.00002和0.00003；title分别“LR 2e-5”“LR 3e-5”，hypothesis说明只改LR。若真实结果支持保留3e-5，下一轮从其真实实验ID/revision复制，wider MLP只把已存在的hiddenDim从1024改2048。两轮command/env不变；配置schema不认识的字段不能凭示例添加。Pi具体可执行的二阶拟合例子见pi-research-create。

4. **实现、保存、核对证据输出。** 按pi-research-git保存真实修改，独立审查与用户整合后读子源码。运行前读取pi-research-evidence，使已固定代码输出有效配置、最终指标、summary和必要轨迹；不修改已经回答的父。
5. **准备并启动批准候选。** run_prepare固定各自intent，用户单独批准后run_submit。共享CPU/RAM/PID/目标/端口/数据都限制并行，不把助手数当GPU数；当前为本地/Docker/SSH的CPU或显式NVIDIA设备，不支持云调度；同一UUID在应用作业间共享预留，未知状态不释放。
6. **每次完成推进，不等整批。** run_submit立即返回。结束回合，由宿主持久化监管和可选唤醒/结果分析；不能捏造CLI等待。每次通知后执行下面的对账循环，处理所有尚未处理的终态。

```text
每次收到宿主通知/用户恢复：
  project_inspect；有活动则campaign_inspect
  用已记录runId逐一run_inspect，确认当前状态
  对所有尚未处理的succeeded/failed/cancelled：
    读日志/产物/源码差异
    记录该终态已处理和证据ID
    提出repair/refill/promote/stop及有界下一步
  没有在途Run且无获准待启动候选：本轮结束
  否则结束当前回合，等待下一次真实通知
```

通知是观察信号，不是状态真相：分析期间其他Run可能已完成，下一条通知不一定逐个重放。主协调者用project_inspect及campaign_inspect对账；run_list分页是用户入口，不能Agent调用。每次只处理尚未处理的终态，已有证据可复用，不重复研究同一结果。观察超时不表示Run失败，unknown先对账原Run/handle，不重提意向；空队列就结束，不能一直等到超时。

7. **当下分析。** run_inspect看state/integrity/真实metrics，run_logs和artifact/evidence读证据，experiment_source_diff及run_source_read核对相对父变化。不从status、助手总结或记忆推导胜负。

## 四种决定及停止

有活动时主协调者campaign_decision_submit提出决定，observationIds取campaign_inspect真实观测、expectedVersion取当前campaign.version，reason说明证据、限制和条件。下面是stop示例，不代表已停止：

```json
{"input":{"campaignId":"<实际campaign.id>","expectedVersion":1,"action":"stop","observationIds":["<实际observation.id>"],"reason":"已达到批准停止条件；保留真实结果与未完成项"}}
```

- **repair：**确实未回答，核对限制和用户语义判定后提修复。决定批准不代表代码修好，也不批准重跑；原节点修复能力与权限见上。
- **refill：**当前结果平庸/不确定，补当前轮同父的一个获准排队备选；不能把不确定当支持。可给candidates，config类型是完整候选对象；implementation:"reviewed-code"要求真实实现/开发/审查/整合，不用空配置假装实现。
- **promote：**有明确有效对照且满足判定条件后保留赢家；selectedRunId必须实际Run，下一轮父向下，不修改已测节点。campaign需要的experimentPlan须固定hypothesis、controlRunIds、changedFactors、dataSplit、dataArtifactIds、primaryMetric、guardrailMetrics、repetitions、successCriteria、inconclusiveCriteria、stoppingCriteria，不能用一句“赢了”替代。
- **stop：**目标达成、分支耗尽、约三次连续失败/回退、预算/期限/环境阻断；保存有证据的结果与限制。失败是实现问题则先定位，不盲目科学搜索。

决定由用户批准应用；Campaign启用额度、代码整合、开发测试和正式Run各有独立审批。主协调者不能自己批准，automatic wakeup仅获准读取/提案，不继承交互计算权限。需要的界面步骤未完成时如实写待批准。

## 描述、备注与回合交付

上游exp desc是整文覆盖，本项目没有Agent“覆盖实验描述”工具；创建时hypothesis写清问题，用户实验详情可追加备注（保留notes历史），主协调者可用现有artifact_create保存真实观察草稿。不要声称新草稿已经写入experiment.notes；若用户要修改整个描述，列为入口差异。

每个运行/修改实验的回合结束列一行：真实节点/Run、测试什么、状态/完整性、已读headline结果及限制、下一步。普通问答无需强制实验总结。停止时按pi-research-reports用描述性题名保存实际树结果草稿，最终固定报告由用户生成；保持旧节点、失败产物和失效状态可回查。
