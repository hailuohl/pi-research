---
name: pi-research-paper
description: "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs."
---

# 论文草稿与真实文件

在允许写入的私有工作区创建 .tex，并用 artifact_create 登记源码。不要仅回复论文大纲冒充文件。当前 **未实现 LaTeX 编译、PDF 预览和 Overleaf 同步**；正文已保存不等于可编译论文已交付。不得指引用户点击不存在的 Overleaf 按钮。

## 模板优先
先读取用户已提供并授权的模板；唯一明确模板可沿用，多模板按用户已选择的版本，不猜测。保留 documentclass、页面规则、匿名模式和节结构，不为省事换成默认样式。缺模板文件或编译包明确说明。

## 源码结构
abstract 后按 section/subsection 组织。需引用的公式有 label，用 eqref；图表有 label 和相对路径，路径对应真实文件。用 amsmath 提供数学环境、amsthm 提供定理证明、booktabs 提供表格横线、graphicx 插图；宏必须定义。需要 fontspec/unicode-math 时说明 XeLaTeX/LuaLaTeX，不能默认为 pdfLaTeX 已可用。

## 引用与结果
通过 lit-review 检索、paper_read 阅读；只以实际读到内容作主张级支撑。作者、年份、题名来自返回记录，不填想象的参考文献。natbib 的叙述引用和括号引用区分；BibTeX/Biber 的编译流程取决于所选模板，当前均未运行，不能说“已消除全部引用错误”。

每个结果来自真实 Run 或明确区分的论文报告值。没有测量就写未测量，不放看起来真实的占位数。图先读 figures；保存图生成脚本和数据关系，引用现有图，不能凭空 includegraphics。

## 编译/协作边界
将来有编译器时检查真实日志第一条错误并修复，实际编译成功才报成功。此版本可交付标明“未编译”的源码和依赖需求。多人编辑先读最新摘要，冲突不覆盖；没有双向同步实现时不声称实时接收作者修改。自动发布、投稿、建立外部项目均需独立能力与用户授权。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-paper/SKILL.md`（blob `46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
