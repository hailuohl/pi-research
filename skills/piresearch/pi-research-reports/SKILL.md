---
name: pi-research-reports
description: "Use when producing a report, comparison, durable research note, or end-of-round handoff."
---

# 持久研究成果

交付实际文件而非只在聊天描述“已经保存”。查看已有相关产物，选择描述性题名与研究主题组织，不创建大量空目录，也不擅自重排旧的已发布成果。

## 现有两条路径
- Agent：在获准的私有工作区用 `workspace_write` 写草稿，或用 `artifact_create` 保存正文/CSV/脚本等实际 UTF-8 内容，返回路径或 artifactId。草稿登记不自动采纳其中结论，也不是固定用户报告。
- 用户：在工作台 **报告与成果** 显式选择真实 Run、已采纳 Claim 和/或成功完整且来源有效的固定文稿构建，`report_create` 重新验证来源并生成固定 Markdown 报告；可显式 `report_export` 生成本地 `tar.gz` 成果包。跨合同的指标不能直接当同条件比较。

写作助手先用 `task_result_read` / `evidence_read` / `artifact_read` 读取授权输入，引用实际证据 ID。没有 claim_read 工具时，不从别人的措辞猜测哪些结论已被正式采纳；用任务交付范围和用户明确选择，未验证内容标为候选。Agent 不调用 `report_create` 或 `report_export` 等用户专属操作。

## 记录内容
说明问题、数据、固定契约、实际运行、比较边界、失败与未尝试、解释和限制。数值来自原始运行而非记忆；模型总结注明派生性质。把图所用数据、脚本、图形版本和引用关联，不拿示例曲线代表科研结果。固定文稿的图形执行来源不等于逐点科学数值已验证，Sandbox 图形不能冒充正式 Run。

## 文件组织与限制
可在私有工作区按主题建立源文件，通过产物工具登记。没有“写入任意 artifacts 路径即自动成为可发布成果”的隐式行为，也没有原生富引用 `<file>` 渲染保证。回复给实际路径或产物 ID 和用途，用户通过工作台查看。

绘图前读 figures；论文读 paper。现有开发测试和正式 Run 可在单独批准的固定环境中执行，必须依据实际状态与产物交付；没有批准不能转为任意宿主脚本执行。仅保存 .tex/.py 仍是源码草稿，不能说 PDF、图已经生成。用户单独批准的固定文稿构建可产生 PDF 与页图，固定报告可包含其源文件、PDF、来源与批准身份；新导出要求来源仍有效，失效后的历史正文和引用保留。对旧成果作修改须新版本和新引用，不覆盖历史。外部发布仍未实现。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-reports/SKILL.md`（blob `313d3ca61372e5f2e101cac6e78828393d03ad87`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
