---
name: pi-research-overview
description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference."
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

## 工具速查

下列 JSON 均是当前 Pi 工具的 `input` 对象；有写操作时请求键/身份由宿主协议管理，不放入 input。示例的占位 ID 必须替换为真实上一步输出，不能将示例当成功回执。

| 工作 | 入口与边界 |
|---|---|
| 探索项目 | `project_inspect({input:{}})`；`workspace_list({input:{source:"session"}})`；主协调者可显式读 project 来源 |
| 读取固定实验 | `experiment_source_list` / `experiment_source_read`，必须 experimentId+revision 或 snapshotId；workspace source=project 不是所选实验 |
| 查 Run | Agent 用 project_inspect / run_inspect；分页 run_list 是用户入口，不能假设 Agent 可用 |
| 日志与证据 | run_logs(runId,cursor,stream,identity)、artifact_read、evidence_read；详情读 pi-research-evidence |
| 创建变体 | experiment_plan_submit(title,hypothesis,parentId,expectedParentRevision,config)；新代码走 change_proposal_prepare / reviewed_change_prepare 及用户整合 |
| Git | workspace_prepare_from_revision、workspace_history_inspect/diff/commit/operation/set_mode；受管会话分支。项目默认本地，用户创建时可选GitHub私密源码同步，由宿主管理；本地提交完成不等于远端成功，详情读pi-research-git |
| 正式运行 | run_prepare 固定意向 → 用户单独批准 → run_submit → run_inspect/run_logs；取消由用户运行面板 |
| 开发检查 | development_prepare/submit/inspect/logs/cancel；单独开发授权，不能替代正式 Run |
| 协作 | collaboration_plan_submit 或同义 agent_delegate 提交有界计划；task_inspect/task_result_read；主协调者专用 |
| 文献 | literature_discover、paper_read、literature_search；先读 pi-research-lit-review，主协调者保留主检索排序策略；Task 网络需 DiscoveryGrant |
| 文稿 | publication_templates、manuscript_create、publication_prepare 等按 pi-research-paper；交互主协调者可准备，提交构建及最终报告仍用户入口 |
| 技能与模板 | research_skill_list/read；用户 skill_package_upload 原子上传并开启；publication_templates及publication_template_import/inspect/read提供跨项目个人模板，用户设置上传/查看，交互主协调者生成入库仍遵守动作批准 |
| 成果 | Agent artifact_create 保存草稿；用户 report_create/inspect/reference_read/export 固定报告与本地成果包；外部成果发布是产品缺口 |
| 产品反馈 | 按 pi-research-feedback 保存脱敏草稿；没有自动发送维护团队入口 |

`host_execute` 仅限用户明确开启本机完全访问的交互主协调会话，argv 原样执行、不自动 Shell 拼接。它不是默认 Shell；所有领域审批、正式 Run、网络发现/证据/发布动作仍走领域入口，不能借它绕过工具拒绝。

## 模块与按需资源

`research_skill_read({input:{skillId:"pi-research-experiment-tree"}})` 读取一个模块；资源用完整相对路径，例如 `{input:{skillId:"pi-research-compute",resource:"references/local.md"}}`。资源只读，不自动执行代码或安装依赖，版本摘要不符就停止。缺失资源不能回退为任意磁盘文件。

- pi-research-create：新项目、论文复现、根/父节点与固定合同。
- pi-research-experiment-tree：provisional、堆叠小扇形、逐完成循环、四种决策、修复和停止。
- pi-research-git：受管 worktree、改代码、提交、固定源码比较与历史。
- pi-research-agent-delegation：自包含简报、权限、独立写域、结果验收与恢复。
- pi-research-compute：本地 local（含固定示例）、Docker 与 SSH；NVIDIA显式设备选择；先确定后端再读一个参考。
- pi-research-evidence：输出设计、日志分段、指标/原文与效力。
- pi-research-reports：持久草稿、固定报告、本地导出与组织。
- pi-research-figures：写绘图代码前读取，再选择对应图种参考。
- pi-research-paper：固定文稿、模板、LaTeX 构建与论文审查。
- pi-research-customize：用户技能导入/上传开启、固定版本，以及跨项目个人模板上传/查看和Agent生成入库。
- pi-research-feedback：有意义问题的脱敏、本地记录、重复和发送边界。
- pi-research-lit-review：主协调者跨来源检索、排序、定向阅读。

## 典型流程

只读定向：connector_status → project_inspect → 读取 pi-research-experiment-tree → 用真实 experimentId/revision 读源码 → 对真实 runId 调 run_inspect/run_logs，不能从状态或记忆推导结果。

驱动研究：读取固定父源码/config → 一个决策的一轮假设 → 建同父子实验（或私有代码实现、开发测试、独立审查、人工整合）→ run_prepare → 用户批准 → run_submit → 结束当前回合。宿主通知后重新读全部获准 Run/活动，处理尚未处理的终态，读日志/产物/差异，再决定 repair、refill、promote 或 stop。通知是信号，实际记录才是状态真相；空队列且无下一候选时退出，不忙轮询。

可前向检查的具体曲线拟合流程见 pi-research-create 的“当前示例：实验到报告”。只有实测才写成功：未运行、未测试、未编译及环境阻断必须明示；技能方法本身不证明真实模型自主科研已验收。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `SKILL.md`（blob `904b26802cf62d7ba84fa99f3c2c804026cd9e46`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
