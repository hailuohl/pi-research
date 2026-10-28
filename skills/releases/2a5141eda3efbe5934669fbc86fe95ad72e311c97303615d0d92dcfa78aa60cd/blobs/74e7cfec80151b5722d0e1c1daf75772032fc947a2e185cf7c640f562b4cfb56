---
name: pi-research-agent-delegation
description: "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team."
---

# 有边界的助手委派

先确认项目已开启协作。开关只允许委派，不自动批准计算、增加费用或发布。简单问题由主会话完成，不为展示多人而拆分。文献主检索循环、候选排序和最终研究判断留在主协调者；助手可做已界定资料的独立整理。

## 自包含简报
用 `collaboration_plan_submit` 提交目标和任务图：每个任务有 key、role、objective、dependencies、inputEvidenceIds、required、critical、reviewOf（必要时）、expectedOutputs 和 acceptanceRuleIds。给出必需文件名称、类型、格式、非空要求；自然语言写“生成报告”不等于机器验收合同。

助手从独立上下文开始，不能假设能看主聊天或任意项目资料。只交付必要输入、上游引用、禁止事项、完成标准。新网络来源需用户启用；不能把整个未授权库交给文献助手。

## 批准后调度
主协调者有委派提案工具，助手没有递归委派权限。工具返回持久化标识，不在一次调用中等待所有助手。Session、工作区、尝试和租约分别保存。查询用 `task_inspect` / `task_result_read`，不进行无尽轮询。

依赖的是结果验收，不是助手停止输出；Reviewer 读已提交目标，不要求其先被接受。审查等待关系必须无环。所有声明审查者齐备后才能采纳；冲突是 disputed，不是多数票或最后写入获胜。

## 返回成果
结果必须带实际产物和证据。助手报告 completed 后仍需服务校验。原文、摘要、猜测、实测指标分别标注。主会话看结果也看原始出处；代码通过独立提案人工整合，不共享写目录。

## 人工介入和恢复
重试一个助手不会恢复整个暂停团队；恢复需当前批准有效。用户改变前提会撤销相关采纳、Claim 和交接依据。审查失败需要明确等待人工/重试，不伪装 active 正在推进。关闭协作停止新委派，已有收尾可見，正式 Run 单独监管。

默认不新增付费综合；用户可在团队计划选择并批准自动总结。自动总结仍是受限读取和提案，不继承交互主会话的计算/委派权限。报告队列状态不等于模型已完成科研分析。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-agent-delegation/SKILL.md`（blob `2cb9938569dca476c99c108df491835eadc19b65`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
