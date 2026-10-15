---
name: pi-research-paper
description: "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。"
---

# 首次请求就交付真实论文文件

本项目已有固定文稿和隔离编译：源码、引擎、镜像与资产先固定，经用户批准后由已有容器构建流程执行。

不要只在聊天里写大纲。在获准私有工作区创建 `paper.tex`；同项目多稿可用 `<topic>.tex`。`workspace_write` 创建时 `expectedDigest:null`，修改先读当前内容和digest。写实际章节和限制，不把未测结果写成完成；用 `artifact_create` 登记实际UTF-8源码，返回真实路径/产物ID。Pi Research 不依赖上游“保存即自动编译”或 `<file>` 标签；固定文稿与PDF要走下方当前流程。

## 写preamble前先找模板

先 `publication_templates`（`{"input":{}}`），查看个人模板库及三种内置基础入口：`article-pdflatex`、`article-xelatex`、`article-lualatex`。内置入口以 `main.tex` 为主文件且默认 `bibliography:none`，不是会议/期刊模板全集。个人模板由设置上传或交互主协调Agent通过 `publication_template_import` 保存，跨项目可选用；每次导入有独立固定ID，同名不覆盖。要生成或保存模板，先读pi-research-customize。

选定后用 `publication_template_inspect({templateId})` 核对引擎、主文件和文件清单，再按需 `publication_template_read({templateId,path})` 读取实际文件。文本有content及contentBase64，二进制使用contentBase64；纳入当前稿件的完整files，不传其他项目artifactId。`manuscript_create` 可记录该templateId并冻结实际文件；历史稿件不依赖模板后续状态。用户仅在工作区提供模板时，仍用 `workspace_list/read` 读取明确授权的cls/sty/bst/入口TeX，不假定有 `.orx/latex-templates/`。

- 用户仅提供一套明确模板：直接沿用，不重复确认。
- 多套且请求未指定：列出名称让用户选；可以继续整理已知正文。
- 未提供专用模板：按所需引擎选择基础入口或以下起始模板。

用户模板的类、样式、bst与依赖文件一起复制到获准文稿相对路径并纳入 `files`；从它自己的入口TeX开始。保留documentclass、包、章节、页边距、字体和匿名规则，只替换占位正文。缺包/文件应明确诊断，不能为了编译成功悄悄改成默认article。个人模板库和项目中授权的模板文件均可使用，技能文本不自动安装class。

## 可复制的起始TeX

完整可编译软件示例见 [assets/starter-main.tex](assets/starter-main.tex)，与 [assets/starter-refs.bib](assets/starter-refs.bib) 均能由 `research_skill_read` 精确resource读取。示例不会冒充研究结论；已有图 `figs/loss_curve.pdf` 才引用，否则显式显示尚未生成。实际交付前替换软件说明、标题、作者、正文和示例引用，并将需要的真实图资产冻结进去。

```latex
\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{amsmath,amssymb,amsthm}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{listings}
\usepackage{natbib}
\usepackage[hidelinks]{hyperref}
\newtheorem{theorem}{Theorem}
\newtheorem{lemma}[theorem]{Lemma}
\title{Research manuscript draft}
\author{Author to be supplied}
\date{\today}
\begin{document}
\maketitle
\begin{abstract}
State the question, actual evidence, and limitations. Results not yet measured.
\end{abstract}
\section{Introduction}
Define the claim and scope without inventing evidence.
\section{Method}
\begin{equation}\label{eq:loss}
L = \frac{1}{n}\sum_{i=1}^{n}\ell_i
\end{equation}
Equation~\eqref{eq:loss} defines notation, not a measured result.
\section{Results}
Not measured. Replace this paragraph only after reading actual evidence.
\section{Limitations}
Record single-seed results, missing comparisons, and source limitations.
\end{document}
```

每个环境都有定义包，不能凭空发明宏：

| 环境/命令 | 必要包/定义 |
|---|---|
| theorem/lemma/proof | amsthm；theorem/lemma还需newtheorem |
| lstlisting | listings |
| align/equation*/text | amsmath |
| toprule/midrule | booktabs |
| includegraphics | graphicx |
| url/href | hyperref |
| citet/citep | natbib；普通cite不必额外包 |

只加载使用的包。abstract后用section/subsection。引用公式加label，用eqref；不引用的公式用星号环境。所有浮动图表加label，用 `Table~\ref{tab:main}`，不用“下表”，因为它会浮动。

## 引擎必须显式匹配

通常pdfLaTeX；fontspec/unicode-math/系统OpenType字体需要XeLaTeX或LuaLaTeX。源码第一行可写 `% !TeX program = lualatex` 告知读者，但本项目实际引擎由 `manuscript_create.engine` 固定，注释不能替代该字段。没有此需求时不加引擎提示。中文正文通常需相应中文包/字体与合适引擎，不能声称基础英文pdflatex模板默认支持全部中文。上游关于microtype功能与引擎的建议以实际所选包能力为准，不能凭注释推断配置已满足。

## 图和表

制作图前读 figures，按打印尺寸、图注和矢量要求执行；TikZ方法图也通过当前固定文稿编译。图名必须实际存在、扩展名明确，且相对于 `mainFile`：

```latex
\begin{figure}[t]
\centering
\includegraphics[width=\linewidth]{figs/loss_curve.pdf}
\caption{Replace with a verified claim, seed count, and interval definition.}
\label{fig:loss}
\end{figure}

\begin{table}[t]
\centering
\begin{tabular}{ll}\toprule
Method & Result \\\midrule
Baseline & Not measured \\\bottomrule
\end{tabular}
\caption{Measurement status, not fabricated metrics.}\label{tab:main}
\end{table}
```

检查图真实字节并冻结，不仅检查某个可变路径曾存在。图和生成脚本保留关联；缺图会构建失败，不能猜一个include路径。

## 引用与参考文献策略

优先简洁的内联 `thebibliography`（固定 `bibliography:"none"`），避免外部参考管理器依赖：

```latex
% 这是上游的软件引用格式示例，使用前核对原始文献与版本。
\begin{thebibliography}{9}
\bibitem[Kaplan et al.(2020)]{kaplan2020}
Kaplan et al. Scaling laws for neural language models. 2020.
\end{thebibliography}
```

该方式不需BibTeX/Biber，但交叉引用仍可能需要多遍TeX，不能保证一次遍历解决所有引用。`[Author(Year)]` 是natbib叙述引用的标签，每项须有；不知作者时用已知短标题，不编造姓名。

- `\citet{kaplan2020}` 作为句子主语：Kaplan et al. (2020)…
- `\citep{kaplan2020}` 作括号：…(Kaplan et al.,2020)。
- natbib的普通 `\cite` 通常为叙述型，`GRPO~\cite{x}` 不自动给括号；括号用citep。

需要独立bib时，natbib+`\bibliographystyle{plainnat}`+`\bibliography{refs}` 使用 **BibTeX**，冻结 `bibliography:"bibtex"` 和真实 `refs.bib`。biblatex按backend采用Biber时选择 `bibliography:"biber"`，使用其匹配命令；不能混natbib与biblatex流程。`auto` 由构建器检测但仍须查看真实诊断。这里修正上游把natbib的bibliography误写成biber round trip的错误，保留实际引文方法。

按 lit-review 先discover再paper_read实际阅读。作者、年份、标题、版本均从返回记录核对；元数据只用于识别，不能支持未读方法。编造引用比没有引用更差。

## 每个结果来自来源

表中的测量值必须来自真实Run，用run_inspect/run_logs/evidence_read核对；论文报告值与自己测量分列并标原文。不写看似真实的占位数，没测量写Not measured。编译通过不证明科学结论、排版或来源正确。

## 当前可执行的固定文稿流程

这些是项目工具的参数示例，ID必须替换成实际返回值，所有研究参数放input内。

1. **主协调者或用户冻结源码**。交互主协调者可 `manuscript_create`，必须有当前已确认研究计划，evidenceIds仅取其获准子集；自动唤醒或writer/Task不能冒用协调者。writer可在授权范围写草稿/返回资产，由主协调者接收。先artifact_create真实TeX，再冻结：

```json
{"input":{"title":"Research manuscript draft","engine":"pdflatex","mainFile":"main.tex","bibliography":"none","templateId":"article-pdflatex","evidenceIds":[],"files":[{"path":"main.tex","artifactId":"actual-tex-artifact-id"}]}}
```

   上述JSON是主协调者示例；用户入口不传 `evidenceIds`，其固定证据引用规则不同。用实际 `artifactId` 或实际字节的 `contentBase64`，每个文件恰好指定一种来源；`artifact_create`不存PDF等二进制。图片可用获准作业的真实artifactId。全量文件清单最多64项；不要只上传main.tex遗漏cls/sty/bib/图。新修订用 `previousRevisionId` 连历史，不能覆盖冻结版本。Agent不伪造rootSessionId或researchBrief字段，宿主绑定。
2. **读取/配置构建环境**。主协调者可 `publication_status`；未配置时由用户 `publication_configure`，包含expectedVersion、dockerContext、固定imageDigest。缺包或字体明确交回环境配置，不自动安装，不用host_execute编稿绕过。
3. **准备构建**。用户或原交互主协调者 `publication_prepare`：`{"input":{"revisionId":"actual-revision-id"}}`。这仅准备固定待批job，不编译。
4. **用户单独批准和提交**。用户通过审批入口批准精确构建，再 `publication_submit`：`{"input":{"jobId":"actual-job-id"}}`；Agent不能configure/approve/submit/cancel。
5. **读取实际终态**。同主协调者/用户 `publication_inspect`，再以真实resultId调用 `publication_result`；核对state、integrity、status、hadErrors、converged、diagnostics、pdf、previews、sourceValidity。只有成功、完整、收敛且无错误才称“已编译PDF”。存在PDF并非成功证明。

主协调者可准备 `publication_review_prepare` 审精确成功构建，同样需用户批准启动独立审查；只审本主会话文稿，不能把无权的PDF/PMC证据塞入审查。读取review状态与意见，任务完成不等于审查通过。

## 失败诊断、重开与历史

先读真实diagnostics/logs，TeX日志第一条 `!` 常指出根因及行号；修源码/缺包/图路径，不用后续连串错误替代首因。宏未定义、包缺失、引擎不符、参考文献未解决、超时或非收敛分别处理。修复产生新稿修订和新待批构建；旧批准不覆盖新字节。unknown先查持久job，不重复提交；cancel/retry由用户按实际入口处理。

未构建交付“真实草稿，尚未编译”；构建失败保留源码与诊断，不称成稿。有引擎/镜像缺口明确报告，不声称存在Overleaf按钮。成功后仍打开实际PDF及页图检查打印尺寸、缺字、图/表位置和引用。来源stale时保留历史PDF，但不可当当前有效成果纳入新报告；manuscript_list/inspect/source_read和build_list回查原版本，不悄悄换最新文件。

多人编辑先读当前源码摘要，冲突不覆盖。Pi Research没有上游Overleaf双向同步或成果远端自动发布/投稿；用户可自行在授权范围导出并另行使用外部工具，这不是本技能已实现的自动流程。跨项目个人模板库已提供固定版本复用，区别于上游同名替换。

## 读取固定编译页做视觉检查

交互主协调者先用 publication_result 取得实际成功、完整且 sourceValidity=current 的固定结果，再选实际 pageNumber。新工具只接受自己当前会话文稿的固定结果页；以下 tool 仅标明名字，实际参数保留 {input:…} 封装。占位 ID 必须替换为真实结果 ID。

```json
{"tool":"publication_page_image_read","input":{"publicationResultId":"<实际publication-build-result.id>","pageNumber":1}}
```

所有可执行模式均需用户批准这个准确页送给当前目的模型并加入本会话；之后的模型请求及合法重开可能重复发送这页。readOnly 不执行此动作。收到 APPROVAL_REQUIRED 就结束回合，等原准确卡批准后按原参数重试；不能从批准编译推断批准图片外发。

只有工具成功并将真实 PNG 送达支持 image 的所选模型，才写该页的视觉观察。逐页核对裁切、图注/图例遮挡、字体、轴标签/单位、面板次序及版心。编译成功不是已视觉检查，单页意见不是看过整份 PDF；缺信息或模型不支持时明确未看。视觉意见也不替代原始数据、引用和独立审查的科学核对。

固定 PNG 原始字节保留，不自动缩放/重渲染；单页 <=4 MiB、两边 <=1600px，会话实际图片合计 <=16 MiB。Task/wakeup 不使用此工具。原文 PDF 页需另按 pi-research-lit-review 的固定文档/解析与页范围批准；PMC非PDF不自动生成页图，不能把文稿页许可当原文查看入口。

每次后续模型请求都会重新核对准确批准、当前会话/目的模型、权限版本、模型目录摘要和来源/CAS。模型目录变化、撤权、来源失效、历史缺引用或字节损坏时停止新的外发，保留原始 native history，不删图或自动重新授权；需要新的会话与准确批准。已经发送的内容不能撤回，不能承诺远端回收。目录中的其他模型变化也会使旧图片批准失效。

修正版必须保存为新的固定稿并重新实际编译，再看新结果对应页；旧页图不能当新稿布局。最终报告引用这个固定结果以及明确的已看页与未看范围。

## 来源

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835，`agent-skills/orx-paper/SKILL.md`，blob `46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa`，MIT，Copyright (c) 2026 alphaXiv。保留模板、结构、图/引用、引擎与错误方法，替换实际工具、存储、角色和构建状态；版权完整文本见 figures/LICENSE 与仓库third_party/openresearch/LICENSE。技能与软件示例不授予权限。
