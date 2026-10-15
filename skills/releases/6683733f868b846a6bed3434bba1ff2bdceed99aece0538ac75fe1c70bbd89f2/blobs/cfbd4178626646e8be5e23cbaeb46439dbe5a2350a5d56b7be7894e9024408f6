---
name: pi-research-experiment-tree
description: "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping."
---

# 实验树与持续研究

## provisional 与已回答
基线和每个子实验都代表问题。缺依赖等错误可能尚未回答，允许在受控范围内修复；差结果也是结果，已回答后只能派生子实验。OOM/超时是否是答案取决于假设是否关于内存/时间。程序失败不自动等于“未回答”，退出成功不自动支持假设。

本项目以 answerDisposition、integrity、state、judgment 分开保存。数值结果保护源码；模糊结果交用户基于真实日志评议。保留失败产物，不能删除失败目录来让历史干净。

## 树形语义
宽度表示同一个决策的备选；深度表示已经选择保留的结果。建 X 为 Y 的子节点前，明确 Y 已建立什么、X 在其上改变什么。答不出来且两者是平行选项，就放同一轮而不是串联。

查看 `campaign_inspect` 的轮次/成员/观测。第一轮可基于基线，后续基于被保留节点。固定入口和环境，变化写进版本化源码/配置；不同合同的数值不能无说明合并排名。

## 每次完成后的四步判断
1. `run_inspect` 读取状态与实际产物；`run_logs`、`artifact_read` 检查真实指标和有效配置。日志截断不代表没有。
2. 按 Campaign 重新核对全部尚未处理的终态，不能只处理刚到达通知提到的一个 Run。等待信号不是状态真相。
3. `campaign_decision_submit` 提出下列之一，附观测与理由：
   - Repair：没有回答问题；受现有修复次数限制，授权不等于已修代码或重跑。
   - Refill：当前轮补充同父候选，给出具体改动、对照和停止条件。
   - Promote：在必要结果与有效审查齐备后保留一个父实验，下一轮向下派生。
   - Stop：目标达成、资源不足或当前方向不值得继续，说明已完成与未完成。
4. 决策由用户批准，正式计算继续单独批准；不把决策批准复用为无限计算预算。

## 等待与失败
`run_submit` 后可以结束回合。宿主保存通知，按设置自动分析或等待用户；不启动阻塞 Shell、忙轮询或依赖一个无限 Promise。研究暂停不等于取消已有作业。

团队/活动受配额、修复次数、轮数和过期审批控制。达到限制就交用户，不靠更换错误名、节点或供应商绕开。停止时保存有证据的结果记录；每次改变实验的回复列明节点问题、运行状态、真实结果与下一步，普通解释不强制生成实验摘要。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-experiment-tree/SKILL.md`（blob `e888fc9d179ddfae87c4a0732224cf354a9c5430`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
