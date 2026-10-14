# 复杂文稿与同源交付

本流程只使用当前任务明确选定的来源、证据和已完成结果。不会重算分析、获取新来源或使用外部模型。旧 `research.py`、article 格式器和旧限定修订核对器保持原字节。

先注册期刊版式，或使用默认单栏 article。新稿输入为 `inputs/` 下的 UTF-8 Markdown 和 paper_context JSON；已有稿使用原 manuscript ID。正文标记继续使用 `[@S1]`、`[evidence:E1]`、`[claim:C1]`、`[value:A1:groups/A/mean]` 和独立一段 `[figure:F1]`。只选择当前任务 receipt 验证通过的记录。

新复杂稿的数值路径还支持列表的0起始规范索引，例如 `[value:A1:results/contrast1/difference_ci/0]` 与 `/1` 绑定实算区间端点。负索引、前导零、越界、null或bool拒绝；不从图上估读或手抄区间。冻结旧helper的路径合同保持。

```text
python scripts/document_workflow.py --workspace 工作区 --task T1 --id V1 --context inputs/context.json --body inputs/body.md --template J1
python scripts/document_workflow.py --workspace 工作区 --task T1 --id F2 --paper V2 --template J1
```

直接输入 context/body 在 `manuscript/V1` 保存；从已存 manuscript 排版在 `formatted/F2` 保存。第二种方式先验证原稿，正文/来源映射必须一致。省略模板时优先沿用修订稿保存的规范模板或原稿规范模板；普通新稿使用默认 article。旧 article 的版式参数作为新的明确版式保存，原 PDF 不替换。

主机需要已有 Pandoc、XeLaTeX、python-docx、lxml、Pillow、pypdf；XeLaTeX 的固定包包括 fix-cm、fontspec、amsmath、amssymb、graphicx、geometry、longtable、array、fancyhdr、hyperref。fix-cm使数学上下标采用实际所需字号，避免5.5pt等尺寸被替代。默认字体是 Times New Roman、SimSun。文字按实际中西文分段选择声明字体，含中文时使用 XeTeX 原生 Unicode 断行；不依赖 xeCJK，不把中文交给不含字形的拉丁字体。章节样式、列表、删线和跨行单元格使用固定可信宏，不额外依赖 titlesec/enumitem/ulem/multirow；跨行文字超出保留行高会记录排版警告。缺工具、字体、包或转换不支持时保持真实失败，不自动安装或联网下载。程序从 PATH 查找，或由主机调用者给 `--pandoc`、`--xelatex` 的已信任可执行文件路径。稿件和模板无权选择执行程序或选项。

## 同一个结构的三种输出

Markdown 解析为一个文档树。引用、证据和结果标记只在文字节点中解析；公式内的 `[1,2]` 不被误判为手写引用，数学中不能放研究标记。引用按实际出现顺序生成，脚注和表格中也适用。图只能来自实际选定 figure 记录，按原打印尺寸插入；超出版式列宽失败，不能自动缩放后冒称原尺寸。

Pandoc 在 sandbox 模式将该树写为 DOCX，禁用 raw HTML/raw TeX、用户 filter、Lua、defaults、路径和任意资源输入。公式必须成为原生 OMML；表格使用 Word 表格结构，脚注使用真实 footnotes 部件。选定图在路径和图像验证后由 python-docx 插入，不为了图片关闭 sandbox。

PDF 数学从实际 DOCX 的 OMML 结构生成安全 TeX，包括分式、根式、上下标、求和/积分与上下限、矩阵、分段定界、多行方程、重音及上下括号。原始公式字符串不进入 TeX 引擎；每个变量/文本被转义，只有代码定义的命令可生成。未知数学结构或 Pandoc 转换警告立即失败，不能降级成原 TeX 字符串、公式图片或省略公式。

正文、表格、脚注、标题和页眉页脚也从同一结构转义生成 TeX。引擎只加载代码指定的固定包，关闭 shell escape 与自动安装；不执行用户 .cls/.sty、宏文件或编译选项。安装位置/字体文件由主机信任，输入文件不获得主机额外权限。此流程的安全性来自不执行原始用户 TeX，不能称作任意 TeX 的操作系统沙箱。

保留 `draft-source.md`、`paper_context.json`、`document.json`、`manuscript.md/.docx/.pdf/.tex`、`references.bib`、实际图、`reference.docx`、`template.json`、`citation-map.json`、`structure-map.json`、`build.json` 和 `layout-manifest.json`。源稿、引用表、图和模板摘要可以回查。BIB 是同源参考资料，不启动外部文献处理器。公式绑定清单记录原公式 SHA、真实 OMML 导出的安全结构和 DOCX/PDF 摘要。

## 内部目标、链接与公式编号

中文自动标题 ID（例如 `## 摘要` 的 `摘要`）以及 Header/Span/Div/代码/表格上的明确 ID 都按 Unicode NFC 规范化，限制长度及字符，全稿必须唯一。`[见方法](#方法)` 等内部链接必须指向实际目标，重复/悬空立即失败。链接本身不接受其它属性；需要定位链接附近时使用带 ID 的 span。保留中文原 ID，以稳定 ASCII 摘要名写入 DOCX 书签和 PDF 目标，不能因字形或转义改变目标身份。

只有显式标注的独立 display 公式按正文出现顺序编号；未标注公式不自动编号。两种写法选一种，不重复定义同一标签：

```markdown
$$E=mc^2 \label{eq:能量}$$

参见公式 \eqref{eq:能量}，编号也可写作 $\ref{eq:能量}$。

::: {#eq:matrix}
$$\begin{pmatrix}1&2\\3&4\end{pmatrix}$$
:::

参见 \eqref{eq:matrix}。
```

`eq:` 容器必须只包含一个 display 公式；`\ref` 显示数字，`\eqref` 显示括号数字，均是指向公式的真实内部链接。支持正文中的命令以及单独 inline math 引用；混在其它公式运算中的引用、手工 `\tag`、inline 公式标签和其它无法完整保全的形式明确拒绝，不静默丢弃。

标签在转换前从原数学语法中解析并剥离，PDF 命令仅使用代码生成的编号与安全目标；不会执行用户原始 `\label`/`\ref`。DOCX 保留原生 OMML 和实际编号文字，PDF 显示同一编号。`crossreferences.json` 记录原 ID、输出目标、数字和链接，以及最终 DOCX 书签/超链接、PDF 命名目标/GoTo 注释的实际核对结果。MD 保留原 ID、标签及动态引用以供继续编辑；原始 draft-source 字节另行原样保留。

## 状态与交付

生成 actual PDF 不等于科学或视觉通过。排版警告记入 gaps，生成状态为 partial；科学、视觉和独立审阅分别保持 pending/not_performed。逐页打开当前 PDF，读取当前 DOCX 并核对公式、表格跨页、脚注、引用、图和字体；报告实际被检查文件的摘要。不能用原稿 PDF 检查批准新格式。

旧版本、失败目录、receipt 和锁处理沿用原 helper。相同 ID 只在输入、依赖、模块代码、程序字节及参数都未变时复用；改变任何一项使用新 ID。未知 pending/锁先查原进程，不自动删除或重启。

最终外发继续使用新的 publication 副本，保留校验原件，核对平台导出后的实际字节与内容。不要把内部 AST、日志或审查说明插入论文正文。独立 agent 和图像输入只有真实平台证据才算完成，本地转换和本会话自查都不能替代。

## 官方依据

[Pandoc 手册](https://pandoc.org/MANUAL.html)说明 DOCX 使用 OMML，支持引用 DOCX 的版式属性；其 sandbox 不覆盖 PDF 引擎和 filter。本流程不执行用户提供的 filter/PDF 参数，PDF 输入由受限结构重新生成。
