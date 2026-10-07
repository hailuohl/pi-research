---
name: pi-research-agent-delegation
description: "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local."
---

# 有边界的助手委派

Pi助手是同项目Team里的独立Task/Attempt/Session，收到不可变最小简报和独立工作区，不是上游agent spawn的新顶层聊天。计划提案立即返回持久Team/Task标识，助手停止和结果验收不是同一件事。主协调者保留范围、最终研究判断与整合责任。

## 选择清楚、独立的任务

独立代码调查、对已完成结果的整理、限定证据检查可委派；正在进行的实验循环中短小串行步骤主会话自己做。按不确定性、影响、上下文和可验证性划界，不为展示团队而拆任务。来源、数据库、端口、构建、正式作业目标都是共享资源，两工作“文件不同”不自动独立。

**不委派主文献检索循环。** pi-research-lit-review的主协调者负责查看合并候选、排序和定向追问；literature Task可做已固定资料的独立阅读/整理，不能把完整检索判断交给它。技能文本不能恢复助手递归委派权限。

## 自包含简报

助手初始看不到当前全部对话。objective写明当前项目语境、真实实验ID/revision/来源摘要、具体问题/指标/单位、获准证据、可编辑文件、计算/网络约束、预期实际输出、失败/停止条件与完成定义。只传必要内容，不复制.env、密钥、私有研究库或所有聊天。task_context_read用于助手读取自己的冻结简报，task_progress_report只记录进展，不能变成完成验收。

简报围绕本轮已有输入与缺少的产物：源码任务固定父来源和允许文件、交付真实差异及检查证据；分析任务固定终态Run/证据、交付比较和限制；写作任务固定已验收结论、交付可读取的正文。沿用主协调者确定的验收条件，缺必要输入时报告blocked，不让助手自行扩批或用示例数据填缺口。

collaboration_plan_submit（或同义agent_delegate）输入有goal、tasks、budget、autoSummarize；任务字段key、role、objective及可选dependencies、required、critical、inputEvidenceIds、reviewOf、expectedOutputs、acceptanceRuleIds、skillIds。skillIds用完整pi-research-*名称。模型/harness不能靠上游--model/--harness旗标指定；当前计划schema没有这些字段，模型按用户项目角色设置，缺配置由用户补齐。

下面示例是对已完成且已授权结果的“分析→独立审查→写作”计划；需先把placeholder替换为真实输入证据ID、在objective补上具体对照/指标，budget按用户实际额度调整：

```json
{"input":{"goal":"核查已完成运行并整理有限结论","budget":8,"autoSummarize":true,"tasks":[{"key":"analysis","role":"analyst","objective":"只读指定终态运行与证据，核查有效配置、指标单位和限制；不准备或启动计算","dependencies":[],"critical":true,"inputEvidenceIds":["<真实证据ID>"],"expectedOutputs":[{"kind":"analysis","schemaId":"report","required":true,"minBytes":1}],"acceptanceRuleIds":["artifact-required","evidence-required","claims-evidenced"]},{"key":"review","role":"reviewer","objective":"独立核对analysis固定成果及真实证据，发现冲突或缺口则reject/disputed；不改源码或运行服务","dependencies":[],"reviewOf":"analysis","inputEvidenceIds":["<真实证据ID>"],"acceptanceRuleIds":["evidence-required"]},{"key":"write","role":"writer","objective":"仅整理已验收分析与审查，产生报告草稿并保留限制","dependencies":["analysis","review"],"expectedOutputs":[{"kind":"report","schemaId":"report","required":true,"minBytes":1}],"acceptanceRuleIds":["artifact-required"]}]}}
```

natural language“写报告”不是机器产物合同；expectedOutputs需匹配输出kind/schemaId，非空/证据/claims验收规则依据任务适用性。不要给无artifact_create权限的reviewer强行要求它登记新产物；结构化review与verdict由task_result_submit提供。

## 分支与计算保护

- 从自己的固定来源准备工作区，绝不给助手主会话正在写的worktree。源变化按受管Git/WorkingGrant文件边界记录，冻结实验任何会话都不能改。
- 助手更改不会自动合并；主协调者检查真实diff/测试，用户批准整合成子实验。开发测试、独立代码审查、整合、正式Run是分离权限。
- 没计算授权就明确“不运行”；analyst只有run_submit权限，但必须匹配用户批准的Task RunGrant清单/尝试，不能新建RunIntent、换清单或改契约。预算/协作开关本身不批准计算。
- literature联网必须用户针对该Task另行准备、批准并激活DiscoveryGrant，冻结源、搜索/目标、格式、请求尝试/响应字节及期限；只能固定literature_discover/paper_read入口，不能把协作批准或来源开关说成网络许可。任务级literature_search不替代此授权。
- implementer/writer开发检查按自己源码/WorkingGrant和development批准，不用正式Run结果掩盖没做测试；reviewer默认只读。

## 批准、调度与结果验收

项目协作开关允许提案，用户还须批准有界团队计划后宿主调度；助手不能agent_delegate/collaboration_plan_submit，也不能自创建更多助手。计划拒绝、配额耗尽、依赖未验收时主会话自己处理/等待/补前置，不重复派相同任务。

autoSummarize:true预留一次原主会话综合额度，批准后结束可唤醒原对话；false无此综合承诺。不是上游--no-wake的永久独立顶层会话，不能猜唤醒已发生。查询task_inspect({input:{teamId:"<真实Team ID>"}})及task_result_read({input:{taskId:"<实际Task ID>"}})，用宿主通知推进，不持续忙轮询或一次工具等待整队。

依赖的是**结果验收**，不是助手execution已结束。reviewOf指向已提交的固定结果，不能要求被审任务先accepted造成死锁；审查/依赖图须无环。所有必需审查通过且前提当前才采纳；相反意见是disputed，不靠多数票/最后写入获胜。

助手task_result_submit只提交结构化summary、outcome:completed/partial/blocked、真实evidenceIds/artifactIds、claims（statement+evidenceIds+limitations）、unresolvedQuestions；reviewer必须verdict:accept/reject/disputed，提交后结束任务。completed是声明，服务仍核查实际文件、非空类型、证据定位与审查条件。主协调者读取原始证据，不把实施者总结当独立验证。

主协调者先回读task_result_read的验收状态，再用artifact_read/evidence_read核对实际内容、来源与缺口；源码成果另外核对固定差异及开发检查。非空/格式验收不证明科学结论正确。文件缺失、证据失效或结果partial/blocked时，保留可回读材料与未决项，补齐必需验收前不用于后续结论；未经核对的助手总结不能据以选赢家、准备正式Run或写入报告结论。

## 失败、恢复与关闭

重试一个助手不会恢复整队，观察超时不等任务失败；先查原attempt/session再决定恢复。用户前提变化会使采纳、Claim、交接/审查失效；旧accepted不能作当前真相。审查失败标明待人工/重试，不伪称active仍推进。

恢复需批准有效、来源/计划/指令版本与租约当前，不能用旧身份扩大权限。关闭协作停止新委派，不自动取消正式Run；已有结束与失败历史保留。自动综合仅受限读取/提案，不继承交互主会话计算、委派、host_execute权限。通知队列或助手存在不意味着模型已完成科学分析。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-agent-delegation/SKILL.md`（blob `2cb9938569dca476c99c108df491835eadc19b65`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
