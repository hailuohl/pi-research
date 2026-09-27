---
name: pi-research-reports
description: "Use when producing a report, comparison, durable research note, or end-of-round handoff."
---

# 持久研究成果

交付实际文件而非只在聊天描述“已经保存”。查看已有相关产物，选择描述性题名与研究主题组织，不创建大量空目录，也不擅自重排旧的已发布成果。

## 现有两条路径
- Agent：`artifact_create` 创建正文/CSV/脚本文本，保存 title、mediaType 和内容，使用返回 artifactId 交付。它只是草稿，登记不自动采纳其中结论。
- 用户：工作台“报告与成果”选择真实 Run 与当前有效 Claim，报告服务重新验证来源，生成确定性 Markdown 记录。跨合同的指标不能直接当同条件比较。

写作助手先用 `task_result_read` / `evidence_read` / `artifact_read` 读取授权输入，引用实际证据 ID。没有 claim_read 工具时，不从别人的措辞猜测哪些结论已被正式采纳；用任务交付范围和用户明确选择，未验证内容标为候选。

## 记录内容
说明问题、数据、固定契约、实际运行、比较边界、失败与未尝试、解释和限制。数值来自原始运行而非记忆；模型总结注明派生性质。把图所用数据、脚本、图形版本和引用关联，不拿示例曲线代表科研结果。

## 文件组织与限制
可在私有工作区按主题建立源文件，通过产物工具登记。当前没有上游“写入任意 artifacts 路径即自动成为可发布成果”的隐式行为，也没有原生富引用 `<file>` 渲染保证。回复给实际产物 ID 和用途，用户通过工作台查看。

绘图前读 figures；论文读 paper。目前任意脚本执行、LaTeX 编译和发布未实现或未验收。保存 .tex/.py 只能称源码草稿，不能说 PDF、图已经生成。对旧成果作修改须新版本和新引用，不覆盖失效前历史。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-reports/SKILL.md`（blob `313d3ca61372e5f2e101cac6e78828393d03ad87`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
