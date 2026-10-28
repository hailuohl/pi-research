---
name: pi-research-overview
description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules."
---

# Pi Research 科研入口

本项目管理本地项目、实验树、源码快照、执行与证据。总览只保留必须始终遵守的规则及入口；具体工作先按需读取对应模块。Pi是唯一Agent执行内核，不调用ORX CLI、服务或数据库。默认内置技能始终开启，技能文本不签发工具、计算、联网或发布权限。

## 四条不可破坏的研究规则

1. **节点一旦回答问题就永久冻结。** 包括根基线、差结果和不支持假设的结果。尚未建立基线/测试假设时是 provisional；修依赖、启动错误可在当前节点受控修复。已经回答则派生子实验，不能修改其源码或重写历史。状态、产物完整性、是否回答和科学判断分开核对，见 `pi-research-experiment-tree`。
2. **同树运行入口和环境是固定合同。** 子实验继承父契约，command 是 argv 数组，不是任意 Shell 字符串。不能用不同命令、环境变量或 `LR=3e-4` 暗改变体；运行镜像、数据版本、切分/评价协议、指标单位及预期产物同样要固定。基线首次执行前确定合同，见 `pi-research-create`、`pi-research-compute`。
3. **改版本化代码/配置，不改命令旋钮。** 每个选项用一条子实验，保持相同命令；`config` 提交是整体替换，先读取父固定 revision 的配置再改一个因子。私有工作区新代码要经过正式整合，私有 Git commit 不等于正式实验源码。
4. **逐轮向下生长。** 同一决策的小扇形备选同父；下一轮基于上一轮确认保留的赢家。根下无限平铺不能累积收益，互不相关选项串成单链也不是真正进展。建 X 为 Y 子节点前先说清 Y 建立了什么。

想换 command/env 或再把新轮挂在根上时，先停下核对比较边界，不把捷径当可比较实验。

## 设置与对象发现

用户从工作台创建项目，或使用当前 CLI 导入本地源码副本；模型与连接器由用户设置。没有上游 `orx login/logout`、组织、OAuth token 或云实例入口，不读取上游凭据路径。实例及云算力由用户明确排除；来源授权、研究协作授权和正式运行审批是三种不同权限。

先 `connector_status({input:{}})` 查看实际连接授权和观察；implemented 不是目标实测成功。再 `project_inspect({input:{}})` 获取当前授权项目、实验 revision、运行、证据、活动和本主会话意向。Agent 不能用它切换项目。Project、Experiment、Run、Session、Task、Artifact、Evidence ID 不能互换，全部来自真实返回。

## 按用户目标选择技能

先确定用户本轮要交付什么，再读取对应模块；不必为简单任务加载全部技能。

| 用户目标 | 技能与预期产物 |
|---|---|
| 新研究问题、研究方案、假设、设计或样本量依据 | 先按下方方法触发表读取命中的主技能及资源，再形成可检验方案；不是只有建节点或已有Run才读方法 |
| 新建、导入或复现项目 | `pi-research-create`：核对真实任务和来源，建立基线与固定合同；随包曲线拟合仅是示例 |
| 改进已有实验 | `pi-research-experiment-tree`：读取正确父修订，完成一轮同父比较，再决定修复、补选、保留或停止 |
| 实现代码、保存或核对来源 | `pi-research-git`：私有工作区、提交及正式整合；本地完成、GitHub同步入队与准确SHA/ref确认分别报告 |
| 运行、开发检查或处理等待/恢复 | `pi-research-compute`：先确定本地/Docker/SSH执行位置，再读对应参考；开发检查和正式Run分别批准，unknown不重跑 |
| 委派独立工作 | `pi-research-agent-delegation`：真实输入、输出和验收简报；主协调者核对文件与证据后才使用助手结论 |
| 查找或阅读文献、原文与图表 | `pi-research-lit-review`：主协调者保留检索排序；明确系统性筛选/综述时先读下表专用资源；固定解析、获准页图与Task DiscoveryGrant按相应参考处理 |
| 检查数据、选择统计方法、解释单位/不确定度或核查证据效力 | `pi-research-evidence`：按下表读取方法，核对真实来源、完整性与限制；项目源码不能替代固定实验或运行快照 |
| 交付研究报告 | `pi-research-reports`：Agent 读取真实证据、比较解释并保存完整 Markdown 正文；系统固定报告和本地成果包仍由用户入口生成，正文不会自动并入；操作前读取其 `references/fixed-report.md` |
| 制作科研图表 | `pi-research-figures`：先读取技能及对应图种参考，交付真实图形、代码与数据来源 |
| 撰写、构建或修订论文 | `pi-research-paper`：沿真实模板保存正文/资产、固定稿件并核查构建；提交构建仍用户入口，页图读取需准确页范围/目的模型批准 |
| 使用个人技能或模板 | `pi-research-customize`：用户技能上传开启与固定版本；跨项目模板上传/查看或获准的Agent生成入库 |
| 记录实际产品问题 | `pi-research-feedback`：可复现的脱敏描述及本地保存状态；没有自动发送维护团队入口 |

### 研究方法触发表

收到新研究问题、方案或分析要求时，按实际需求匹配下表，不要求用户点名技能。`pi-research-experiment-tree` 仅coordinator/designer/analyst/reviewer可读，`pi-research-lit-review` 除implementer外可读，`pi-research-evidence` 全角色可读。命中当前角色可读项时，须先通过 `research_skill_read` 读取主技能及对应resource，再选择方法、写方案或作判断；不可读项通过既有Task结果或主协调者交接具体方法需求，不调用被禁止入口或扩大权限。只读本题相关项，不要求八项全读，普通问答不强制走整套研究流程。

| 实际需求 | 主技能 | resource |
|---|---|---|
| 提出候选解释、竞争假设、可区分预测或反证条件 | `pi-research-experiment-tree` | `references/hypothesis-generation.md` |
| 研究/实验协议：独立单位、对照、随机化/区组、批次、重复测量或伪重复 | `pi-research-experiment-tree` | `references/experimental-design.md` |
| 样本量/独立重复依据、区间精度、事前功效、SESOI或固定预算MDE | `pi-research-experiment-tree` | `references/statistical-power.md` |
| 给定数据的建模前检查、缺失/异常/重复、实体/分组/时间泄漏与切分 | `pi-research-evidence` | `references/exploratory-data-analysis.md` |
| 模型/检验选择或比较、效应与区间、多重比较、诊断或阴性结果 | `pi-research-evidence` | `references/statistical-analysis.md` |
| 测量模型、单位换算、测量不确定度/传播、有效数字或误差条含义 | `pi-research-evidence` | `references/uncertainty-and-units.md` |
| 评价主张支持程度、偏倚/混杂、机制/因果解释或适用范围 | `pi-research-evidence` | `references/scientific-critical-thinking.md` |
| 用户明确要求系统综述、范围综述、系统性证据综合/筛选或其协议 | `pi-research-lit-review` | `references/systematic-review.md` |

例如先 `research_skill_read({input:{skillId:"pi-research-experiment-tree"}})`，再 `research_skill_read({input:{skillId:"pi-research-experiment-tree",resource:"references/statistical-power.md"}})`；同一固定会话已读且仍适用的内容可复用。普通找论文、related work或叙述性综述不触发系统筛选。缺输入、适用方法、计算或权限时记录具体缺口，不能补造样本量、功效、分析结果或已读记录；方法读取不增加权限，沿用下述固定版本与调用边界。

`host_execute` 仅限用户明确开启本机完全访问的交互主协调会话，argv 原样执行、不自动 Shell 拼接。它不是默认 Shell；所有领域审批、正式 Run、网络发现/证据/发布动作仍走领域入口，不能借它绕过工具拒绝。

## 按需读取与调用边界

`research_skill_read({input:{skillId:"pi-research-experiment-tree"}})` 读取一个模块；资源用完整相对路径，例如 `{input:{skillId:"pi-research-compute",resource:"references/local.md"}}`。资源只读，不自动执行代码或安装依赖，版本摘要不符就停止。缺失资源不能回退为任意磁盘文件。

实际 Pi 调用使用 `{input: ...}` 包装；模块示例的 `tool` 只是名称标签，不是参数。请求键/身份由宿主管理，示例占位 ID 换为真实返回，不能当成功回执。

固定实验读取必须用 experimentId+revision 或 snapshotId；主协调者可显式读取 project 输入，`workspace` 的 project 来源不是所选实验。Run按真实ID回查；交互主协调者才可使用 `includeScheduling:true` 解释单Run已保存观察，分页 `run_list` 是用户入口。正式运行准备、用户批准和提交分开，取消由用户运行面板；停止聊天不取消Run。

## 典型流程

只读定向：connector_status → project_inspect → 读取 pi-research-experiment-tree → 用真实 experimentId/revision 读源码 → 对真实 runId 调 run_inspect/run_logs，不能从状态或记忆推导结果。

驱动研究：读取固定父源码/config → 一个决策的一轮假设 → 建同父子实验（或私有代码实现、开发测试、独立审查、人工整合）→ run_prepare → 用户批准 → run_submit → 结束当前回合。宿主通知后重新读全部获准 Run/活动，处理尚未处理的终态，读日志/产物/差异，再决定 repair、refill、promote 或 stop。通知是信号，实际记录才是状态真相；空队列且无下一候选时退出，不忙轮询。

可前向检查的具体曲线拟合流程见 pi-research-create 的“当前示例：实验到报告”。只有实测才写成功：未运行、未测试、未编译及环境阻断必须明示；技能方法本身不证明真实模型自主科研已验收。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `SKILL.md`（blob `904b26802cf62d7ba84fa99f3c2c804026cd9e46`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
