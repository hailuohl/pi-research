---
name: pi-research-paper
description: "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs."
---

# 论文草稿与真实文件

在获准的私有工作区用 `workspace_write` 创建 .tex、.bib 等文本草稿，并可用 `artifact_create` 登记实际 UTF-8 内容；交付真实路径或产物 ID，不以大纲冒充文件。**报告与成果**已有固定文稿和隔离编译：用户显式选择模板/文件、引擎与参考文献策略，创建不可变修订，配置构建环境并单独批准每次编译。Agent 不能调用这些用户专属操作，也不能把草稿说成已冻结或已编译。

## 模板优先
先读取用户已提供并授权的模板；唯一明确模板可沿用，多模板按用户已选择的版本，不猜测。保留 documentclass、页面规则、匿名模式和节结构，不为省事换成默认样式。工作台的三种基础 article 模板不是期刊模板全集；缺模板文件或编译包明确说明。

## 源码结构
abstract 后按 section/subsection 组织。需引用的公式有 label，用 eqref；图表有 label 和相对路径，路径对应真实文件。用 amsmath 提供数学环境、amsthm 提供定理证明、booktabs 提供表格横线、graphicx 插图；宏必须定义。需要 fontspec/unicode-math 时说明 XeLaTeX/LuaLaTeX，不能默认为 pdfLaTeX 已可用。

## 引用与结果
通过 lit-review 检索、paper_read 阅读；只以实际读到内容作主张级支撑。作者、年份、题名来自返回记录，不填想象的参考文献。natbib 的叙述引用和括号引用区分；BibTeX/Biber 的流程取决于所选模板和用户选定的构建策略。未查看真实诊断前，不能说“已消除全部引用错误”。

每个结果来自真实 Run 或明确区分的论文报告值。没有测量就写未测量，不放看起来真实的占位数。图先读 figures；保存图生成脚本和数据关系，引用现有图，不能凭空 includegraphics。编译成功不证明科学结论或排版已审查。

## 编译/协作边界
用户在 **报告与成果** 中冻结修订、批准隔离构建后，可查看实际作业状态、诊断、PDF 页图和下载；只有成功且完整的构建才能称已编译 PDF。来源失效后历史 PDF 仍可回查，但不能纳入新的当前报告或成果包；失败要保留实际诊断。Agent 交付草稿时注明尚未由用户构建；不可代用户执行 `manuscript_create`、`publication_configure`、`publication_prepare` 或 `publication_submit`。多人编辑先读最新摘要，冲突不覆盖；没有双向同步实现时不声称实时接收作者修改。外部投稿、Overleaf 同步和自动发布仍未实现。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-paper/SKILL.md`（blob `46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
