---
name: pi-research-paper
description: "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。"
---

# 从写作目标到真实论文交付

首次写作请求就保存真实 TeX 文件，不只返回大纲。按用户目标和现有证据写正文；没有实测结果也可交付草稿，但明确标注尚未测量、缺少对照或引用限制。保存源码、固定稿件、编译成功、视觉检查和科学核对是分别报告的状态。

**论文写作、科学审查或限定修订前，必须读取 [references/scientific-review.md](references/scientific-review.md)**：核对原始数值、比较方向、单位、检验与校正族，区分优化目标、事后评价和机制；限定修订固定原稿与获准替换清单，保存后实际回读并核对真实 diff，缺少比较能力不得声称逐字保留已验证。

## 1. 先选模板

交互主协调者先用 `publication_templates`（`{"input":{}}`）查看真实目录，按用户指定的模板/投稿样式、正文语言和引擎约束筛选。已有明确选择就沿用；发现实际不兼容或环境缺口时保留该选择并说明问题，不自动替换模板。未指定时，只有一套适用个人模板就直接使用，没有适用个人模板就选择匹配引擎的 builtin。仅有多个真实适用且样式仍需用户决定的候选时询问，并继续整理已知正文。内置基础入口为 `article-pdflatex`、`article-xelatex` 或 `article-lualatex`，主文件均为 `main.tex`、默认 `bibliography:none`；三种引擎入口不自动构成三种待选投稿样式，也不是会议/期刊模板全集。语言/字体要求仍须核对实际文件和环境，不能因选了引擎就称兼容。

主协调者用 `publication_template_inspect` 核对固定 ID、引擎、主文件和清单，再用 `publication_template_read` 读取入口及实际需要的完整配套文件。参数均放在 `input` 中，例如 `{"input":{"templateId":"actual-template-id","path":"main.tex"}}`。正文文本有 `content`，所有文件有 `contentBase64`。目录清单不能代替真实文件字节。

从模板自己的入口 TeX 开始，沿用 `documentclass`、cls/sty/bst、包、页边距、字体和匿名规则；只替换占位正文。配套文件保留相对路径并一并冻结。用户在工作区提供的模板用 `workspace_list/read` 读取明确授权的入口和配套文件。缺包或文件应诊断，不为得到 PDF 悄悄改成默认 article。交互主协调者生成、入库或复用个人模板前读 `pi-research-customize`。

writer 没有 `publication_templates`、`publication_template_inspect/read`，也不能读取 coordinator-only 的 `pi-research-customize`。由主协调者完成选择与字节核对，通过既有获准任务输入交接真实入口、配套文件产物和固定模板 ID/引擎/路径；writer 用 `task_context_read` 核对交接、`artifact_read` 读取获准文本文件，再保存草稿。二进制配套由主协调者保留真实字节与路径供固定稿件使用，不要求 writer 用文本工具读图。缺入口或依赖就交回具体缺口，不自行调用模板工具、按清单重造文件或退回 starter。下述固定稿件、构建及页图动作也由具备相应权限的交互主协调者处理。

## 2. 写正文并保存源码

在获准私有工作区保存 `paper.tex` 或明确的主题文件；`workspace_write` 创建用 `expectedDigest:null`，修改先读当前内容和 digest，冲突不覆盖。用 `artifact_create` 登记实际 UTF-8 TeX/BIB 文本并保留真实产物 ID；二进制图不能通过该工具保存。Pi Research 不依赖上游“保存即自动编译”或 `<file>` 标签。

无专用模板时复用 [assets/starter-main.tex](assets/starter-main.tex)，按需用 `research_skill_read` 读取精确 resource。它包含章节、公式、表、图缺失提示和内联 `thebibliography`；[assets/starter-refs.bib](assets/starter-refs.bib) 供独立 BibTeX 使用。两者都是软件示例，不是科研结果：实际稿件替换标题、作者、示例正文和引用，只引用真实存在的图。

正文围绕问题、方法、结果、解释和限制组织，规模随任务调整。测量值用 `run_inspect`/`run_logs`/`evidence_read` 核对；原论文报告值与本项目实测分列并标来源，没测量写 `Not measured`。引用先按 `pi-research-lit-review` 实际阅读，核对作者、年份、标题和版本；元数据不能支持未读方法。

摘要、章节正文、图表标题和图注面向读者，使用有含义的科学或实验名称，如“二次曲线拟合基线”，不默认插入内部 Run/Task/合同/审批/快照编号、散列或工具调试经过。方法中写清可复现的数据、参数和评价协议，流程故障只有影响结果解释时才写其科学后果；不能因去掉内部编号而隐藏真实负结果、科学局限或未验证条件。

保留真实文献引用、DOI、数据登录号和必要且可解析的代码/数据版本。正常变量、单位和专业缩写不是内部编号，缩写首次解释。追溯 ID 保留在已有 `evidenceIds`、文件/产物绑定与构建/审查记录；确需人工核对时另列独立来源记录，逐项对应正文中的实验名称，不默认追加到论文摘要或正文。只有实际存在且能交付的文件/链接才可称补充材料或代码/数据入口；当前工具无法关联或导出时如实说明，不编造可用链接。

只加载所用包：theorem/lemma/proof 需 amsthm，前两者还需 `newtheorem`；align/eqref/text 需 amsmath，lstlisting 需 listings，toprule 需 booktabs，includegraphics 需 graphicx，url/href 需 hyperref。公式、浮动图表加 label，并以 `\eqref`、`Table~\ref` 等引用，避免“下表”随浮动失效。

引擎由 `manuscript_create.engine` 固定。通常使用 pdfLaTeX；fontspec/unicode-math/系统 OpenType 字体需要 XeLaTeX 或 LuaLaTeX，中文还需匹配包和字体。`% !TeX program` 注释不能替代引擎字段，也不能证明环境已有字体。

参考文献可用 starter-main.tex 的内联 `thebibliography`，固定 `bibliography:"none"`；不需 BibTeX/Biber，但交叉引用仍可能需要多遍 TeX。natbib 的 `\citet` 用于叙述引用、`\citep` 用于括号引用，每项需匹配作者/年份标签；不编造作者。需要独立 bib 时，natbib + `\bibliographystyle{plainnat}` + `\bibliography{refs}` 使用 `bibliography:"bibtex"` 并冻结真实 `refs.bib`。biblatex 按 backend 用 `biber`，不混用两套命令；`auto` 仍须检查真实诊断。

## 3. 准备图表与资产

制作图前读 `pi-research-figures`，复用已有图形代码，按最终打印尺寸和真实数据生成；TikZ 方法图随稿编译。核对每个图、表数据和引用文件的真实字节、来源与相对 `mainFile` 的路径，再纳入固定文件清单。不能猜 include 路径或仅凭可变路径曾存在就交付。

保留图与数据、生成脚本、源码版本及真实 Run/开发作业的关联。文稿允许的 TeX、数据和图资产可冻结进 `files`；Python 生成脚本保留在固定 Run 源码或独立文本产物并关联，不能塞进文稿不支持的扩展名。原图解释遵循 lit-review 的原文阅读方法，不用生成的相似图替代原证据。

## 4. 固定完整稿件

交互主协调者用 `manuscript_create` 固定当前已确认研究计划下的完整源码与资产，`evidenceIds` 仅取其获准子集。用户入口的引用字段规则不同；writer/Task 可在授权范围准备草稿，不能冒用协调者冻结文稿。每个文件指定真实 `artifactId` 或实际字节的 `contentBase64` 之一，不能漏 cls/sty/bst/bib/图或借用其他项目资产。

**固定稿件、准备构建、读取诊断、页图检查、独立审查或修订前，必须读取 [references/build-and-review.md](references/build-and-review.md)**，其中给出当前参数、角色、批准和状态处理。新修订用真实 `previousRevisionId` 连到旧稿，不覆盖冻结版本。

## 5. 构建并核对结果

读取 `publication_status` 核对环境，由用户配置固定镜像；主协调者准备精确构建后交用户单独批准和提交。排队或运行中按持久 job 等待，unknown 先核对原 job，不重复提交。缺包、字体或镜像交回环境配置，不自动安装，也不用 `host_execute` 绕过文稿构建。

从 `publication_inspect` 和真实 `publication_result` 核对作业、完整性、诊断、收敛和来源有效性。只有真实成功、完整、收敛且无错误才称“已编译 PDF”；存在 PDF 文件或退出码 0 不能单独证明成功。失败仍交付源码与诊断，未构建写“真实草稿，尚未编译”。

## 6. 检查并修订

默认模型具备图片识别能力。按参考中的准确页批准流程，让实际成功结果的 PNG 到达当前目的模型后直接检查版面；记录固定 result ID 和实际看过的页，单页观察不能扩大为全文验收。实际工具拒绝或图片未到达时如实记录未看，不绕过校验。视觉检查不证明数据、引用、统计或结论正确。

独立审查使用精确成功结果，另行批准并读取真实意见；执行完成不等于通过。修订后创建新固定稿、重新实际编译，再看新结果对应页；旧 PDF/页图不能代表新稿。旧模板、稿件、作业和意见按原 ID 回读，来源 stale 的历史结果保留但不能冒充当前有效成果。

## 7. 交付

返回可打开或导出的真实 TeX/BIB、配套资产和实际固定稿件/结果引用，分别说明：

- 源码与模板版本、图表及其数据/脚本来源。
- 编译状态；失败诊断或尚未配置/批准的具体缺口。
- 实际视觉检查页及未看范围、独立审查状态。
- 科学证据支持的结论与尚未验证部分。

本项目没有上游 Overleaf 双向同步、自动远端发布或投稿。用户另行导出使用外部工具不等于本技能已实现自动流程。

## 来源

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835，`agent-skills/orx-paper/SKILL.md`，blob `46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa`，MIT，Copyright (c) 2026 alphaXiv。保留模板、结构、图/引用、引擎与错误方法，替换实际工具、存储、角色和构建状态；版权完整文本见 [figures/LICENSE](../pi-research-figures/LICENSE) 与仓库 third_party/openresearch/LICENSE。技能与软件示例不授予权限。
