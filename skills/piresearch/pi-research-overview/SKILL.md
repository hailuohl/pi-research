---
name: pi-research-overview
description: "Use when starting, resuming, or handing over research in Pi Research."
---

# Pi Research 科研入口

本技能是 OpenResearch 总览的受控接口改写，不是 ORX CLI 兼容层。先读取 `connector_status`，再按当前工作读取一个相关技能。技能不签发权限，不能扩大当前工具清单；没有工具的能力不能用文字模拟成功。

## 四条研究规则
1. 实验问题已被回答后保护定义，包括差结果；查看是否回答、进程状态、产物完整性与科学判断四个维度。不能仅用退出码判断能否原地修改。
2. 同树的运行入口、环境和评价合同固定。变体进入代码/配置；修改合同需新比较边界，不能在命令参数里暗换数据或方法。
3. 修改自己的工作区，登记不可变文件，通过 `change_proposal_prepare` 和用户批准进入子实验。不把私有文件路径直接当正式证据。
4. 同轮可比较方案同父；下一轮建立在保留结果上。不要把所有新假设永远挂在根，也不要为增加树深把互不依赖选项串成链。

## 按目的加载
| 当前工作 | research_skill_read 的 skillId |
|---|---|
| 启动/导入项目、选择基线 | pi-research-create |
| 轮次、结果、Repair/Refill/Promote/Stop | pi-research-experiment-tree |
| 修改/审查/交接代码 | pi-research-git |
| 创建协作计划或解释助手结果 | pi-research-agent-delegation |
| 固定快照、运行和取消 | pi-research-compute |
| 论文检索与阅读 | pi-research-lit-review |
| 指标、引用和原始产物 | pi-research-evidence |
| 报告与持久成果 | pi-research-reports |
| 绘图脚本和科研图形 | pi-research-figures |
| 论文草稿 | pi-research-paper |
| 技能模板、外部机器、产品问题 | customize / instances / feedback 对应技能 |

所有工具参数放入 `input` 对象；工具返回的 ID 才可作后续引用。Project、Experiment、Run、Session、Task 不是同一种对象，禁止互换。

## 最小可检查流程
`project_inspect` 查看已授权对象 → 读取原文/代码 → 提出具体问题与对照 → `experiment_plan_submit` 建立草案 → 用户核对 → 代码产物及批准交接 → `run_prepare` → 单独 Run 审批 → `run_submit` → 结束当前等待回合 → 收到宿主通知后 `run_inspect` / `run_logs` → 核对所有新终态 → 决策提案 → 报告。

审批不可在工具中无限等待；不轮询到耗尽上下文。暂停、重试、恢复分别遵守服务端状态，旧批准和旧审查不能复用为新授权。没有原文、未运行、未测试、未编译，都应明确写出。主模型尚未验证时，不得把本技能或固定脚本示例称作自主科研验收。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `SKILL.md`（blob `904b26802cf62d7ba84fa99f3c2c804026cd9e46`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
