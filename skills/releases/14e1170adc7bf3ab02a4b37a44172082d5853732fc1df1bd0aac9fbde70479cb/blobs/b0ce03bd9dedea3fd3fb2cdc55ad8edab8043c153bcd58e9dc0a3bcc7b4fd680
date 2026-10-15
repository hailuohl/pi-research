---
name: pi-research-compute
description: "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/SSH reference."
---

# 固定快照与受控计算

正式Run使用实验的不可变源码快照和固定contract；受管Git启用且就绪时清单记录对应gitCommit。传输不依赖GitHub发布，不把私有worktree中的新修改误当正式源码。

## 入口及通用合同

先connector_status、project_inspect，并用execution_environment_list读取用户已保存的运行环境/设备目录（只读，不启动探测进程）；使用真实experimentId/revision读源码/配置和合同。implemented只说明能力实现，目标连接、镜像、资源和本次成功都须实际观察。凭据存在不能自动改用另一后端。

1. **正式研究计算只走run_prepare/run_submit。** 不从worktree直接训练、不调用原始SSH、provider CLI或外部scheduler代替正式Run；它们无正式清单、来源或审批记录。host_execute即使主会话已全访问，也不能绕过领域审批。
2. **合同固定。** 基线首次明确command argv、environment、镜像摘要、数据/评价版本、metrics单位/方向和expectedArtifacts。子实验继承；变体只改版本化代码/config。不用env-prefixed命令或host环境传参。
3. **先保存并整合。** 私有Git提交不自动进入实验；整合后的实验固定源码才用于run_prepare。各后端以实际manifest源清单为准；不要求GitHub push，不捏造gitCommit。
4. **分开准备与运行。** run_prepare固定快照、审批卡与manifestDigest，只有用户批准该精确清单后，原交互主协调者可run_submit。代码提案批准不批准运行。analyst Task只能提交用户批准且绑定其尝试的RunGrant清单，不能run_prepare新清单；其他助手无正式提交权限。
5. **返回是排队而不是完成。** run_submit即刻返回真实Run，随后按run_inspect/run_logs与宿主通知推进。当前没有上游--force允许同节点任意并发的工具，不能用重复意向绕过节点在途保护。
6. **取消与会话分开。** 正式Run取消由用户在运行面板发起；没有Agent run_cancel工具。停止Agent/关闭聊天不会取消Run。development_cancel仅自己的开发检查，不取消正式Run。要确认实际cancelled及资源收尾，不能把“已请求取消”报成终止。

示例依次用于run_prepare和获批后的run_submit，ID均来自实际输出：

```json
{"input":{"experimentId":"<真实实验ID>","autoAnalyze":false}}
```

```json
{"input":{"intentId":"<实际RunIntent.id>"}}
```

autoAnalyze:true可同时准备终态后最多一次Pi结果分析任务，模型/目的地/额度进入批准；不是免费等待，也不批准后续计算。任务可有多个HTTP往返。原意向状态不明时用project_inspect的runIntentId精确回查原主会话意向；不准备新清单顶替拒绝或失效意向。

## 先确定后端，只读一个参考

| runner | 当前已实现能力 | 按需参考 |
|---|---|---|
| trusted-example | 随包固定曲线拟合、入口哈希校验，不执行任意宿主代码 | references/local.md |
| local | 用户配置的本地运行环境，固定源码正式Run；CPU或明确NVIDIA设备，当前用户权限、无文件/网络隔离 | references/local.md |
| docker | Linux Docker CPU/NVIDIA正式Run及CPU独立开发检查、日志、取消、固定容器恢复 | references/local.md |
| ssh | 用户配置/探测的固定SSH目标，经版本化受信Linux Docker监管器执行CPU/NVIDIA容器 | references/ssh.md |

调用research_skill_read，skillId:"pi-research-compute"，resource:"references/local.md"或"references/ssh.md"。只读所选指南，不自动执行资源或安装依赖。若不可读报具体资源/完整性错误，不退回任意路径/ORX指南。

其他云/集群后端、托管资源目录与实例生命周期已从当前范围移除，不加载这些参考，也不把配置凭据当恢复它们的授权。NVIDIA以完整UUID显式选择，先由用户在资源与调度核对目标；Agent只能读取已保存目录，不能探测设备/改运行环境。设备查询不等于运算成功，已有本机或SSH回环记录不外推所有主机、镜像或本次运行。“CPU限制”不意味着GPU隔离；AMD/Metal尚未支持，不得把GPU请求静默改为CPU。

## 等待、唤醒与终态对账

上游exp wait是首完成信号，exp wake是回合退出后唤醒；本项目没有Agent等价等待命令。正式监管和通知持久化在宿主，提交后结束当前回合，按已批准autoAnalyze或用户恢复推进，不启动阻塞Shell等待、不紧密轮询。

每次通知后重新project_inspect，有活动则campaign_inspect；对全部尚未处理的终态run_inspect、日志/产物验证后逐一决策，不等整批排空才分析。Agent不调用user-only run_list。空队列且无待启动候选就退出；通知只包含一次观察，不能据此遗漏分析期间已完成的Run。不要同一个Run再叠加不存在的wait/wake注册。

观察超时表示尚未得到新状态，不是执行timeout/failed。unknown或SSH传输断开先保留原作业/预留，按原handle、容器身份、固定目标/引擎/监管协议对账；不得按旧PID猜测取消，也不得重复运行。失败后读取reason/error和stderr，容量/环境问题可在边界内补前置条件，但每次重跑仍需合法意向/批准。运行启动后失败不能只改机器跳过根因；是否修同节点按pi-research-experiment-tree。

## 大小与预算

先判断任务是否需要GPU：API评价/数据准备通常CPU足够；NVIDIA需求在contract.gpu中声明vendor:"nvidia"及deviceIds完整UUID列表，不允许索引、all或重复值。不带gpu保持CPU合同。选择能装下实际模型和最小batch的已核对设备及CPU/内存。只有真实OOM或不可接受时长证据才考虑更大资源；超时只为确实长作业提高。资源变更是contract/比较边界变更，不能无说明改变同树合同。

Docker/SSH的CPU/RAM/PID/时间/工作空间/日志/输出受各自约束；local的CPU/RAM只调度记账、networkPolicy必须host，不宣称宿主硬限制或禁网。数据版本、固定来源和各后端声明的隔离不能悄悄改变。同一共享数据目录内，本地/Docker/SSH按NVIDIA UUID原子预留，unknown或租约到期不释放，确认终态才释放；不覆盖应用之外的程序。升级兼容期间，新GPU等待全部非终态CPU Docker和旧版SSH作业结束，queued/unknown也包括；不为腾位删除旧记录。新SSH的CPU/GPU运行均需独立新版helper，旧已启动handle仍按原协议核对。共享目标并行额度由真实队列控制，未知作业预留不能手工当空闲。资源估计带假设，不报虚构吞吐；达到修复/回退/预算/期限边界就停下交用户。

## 开发测试不是正式Run

当前development_*真实可用，主协调者/implementer/writer按权限可准备自己的私有源码测试；单独开发批准和WorkingGrant适用。development_prepare输入command、已存在的environmentImageDigest（repo@sha256）、可选dockerContext/resources/deadline/expectedArtifacts/dataArtifactIds，冻结精确snapshot。用户批准后development_submit输入developmentTaskId；development_inspect/logs确认state/integrity/exitCode/真实产物。不能以development job结果冒充正式假设检验；后续代码整合和Run仍另行批准。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-compute/SKILL.md`（blob `60566d92cd5e86f1d6684d731444af512531ea0c`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
