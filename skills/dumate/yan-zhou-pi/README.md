# 研舟π科研助手 · 包装修订1.0.3

独立DuMate组合Skill。运行只需当前可用Python 3.10+及对应功能的库；无需原仓库或服务。安装zip的根目录放 `SKILL.md`、`references/`、`scripts/`、`assets/`、`LICENSES/`。不打包工作区或运行日志。

1.0.3增加独立原始配对散点图，保留1.0.2的article排版及科学核对/限定修订。原 `research.py`、`figstyle.py`及receipt格式保持1.0.0原字节，既有格式器和修订核对器也保持，可继续校验旧产物；旧安装包、稿件和交付记录保留。新图和新稿另存，不替换旧成果。更新安装和原生导出必须另外实测，不能用脚本测试代替平台验收。

## 最短操作

下文 `python` 代表平台当前已提供的Python，`包目录`代表本Skill所在目录，`工作区`代表用户明确选择的目录；替换这些占位路径后执行。JSON和正文通过平台文件工具创建为 `inputs/` 中的明确文件。脚本没有任意下载、shell代理、依赖安装或删除命令。

```text
python 包目录/scripts/research.py --workspace 工作区 preflight
python 包目录/scripts/research.py --workspace 工作区 --task T1 init --question 当前研究问题
python 包目录/scripts/research.py --workspace 工作区 search --id L1 --query 检索词 --rows 10
python 包目录/scripts/research.py --workspace 工作区 register --id S1 --file inputs/article.pdf --metadata inputs/article.json
python 包目录/scripts/research.py --workspace 工作区 extract --id X1 --source S1
python 包目录/scripts/research.py --workspace 工作区 evidence --id E1 --extraction X1 --spec inputs/quote.json
python 包目录/scripts/research.py --workspace 工作区 claim --id C1 --spec inputs/claim.json
python 包目录/scripts/research.py --workspace 工作区 register --id D1 --file inputs/data.csv --metadata inputs/data.json
python 包目录/scripts/research.py --workspace 工作区 analyze --id A1 --source D1 --column value --group group --unit dimensionless --missing error
python 包目录/scripts/research.py --workspace 工作区 figure --id F1 --analysis A1
python 包目录/scripts/research.py --workspace 工作区 manuscript --id V1 --context inputs/paper_context.json --body inputs/draft.md
python 包目录/scripts/research.py --workspace 工作区 verify --id O1 --paper V1 --checks inputs/checks.json
python 包目录/scripts/format_paper.py --workspace 工作区 --task T1 --paper V1 --id V2
python 包目录/scripts/research.py --workspace 工作区 status
```

`--task`默认T1；不同任务显式指定。文献型稿可省分析/绘图，未阅读原件时只交候选与提纲。`search`只提供Crossref候选元数据，PDF由当前授权工具合法取得。来源登记要求明确选择理由；候选不自动入稿。

## 文件契约

来源JSON：`title`, `authors`, `year`, `content_level`, `selection_reason`, `license` 都是字符串；可附 `doi`, `url`, `data_label`。内容层级只能是 `full_text`, `abstract`, `metadata`, `data`。未知作者/年份/许可明确填 `unknown`，不补造。登记前核对候选的DOI/题名与原件。

摘录JSON：`{"anchor":"实际text.json中的锚点","quote":"实际段落中的连续原话","limitations":"适用限制"}`。段落分割固定在提取结果中；PDF页号是物理页，不猜印刷页码。解析无文字层会保留partial缺口。视觉观察另留当前任务的页面查看记录与转述，不调用摘录命令伪装原话。

主张JSON：`{"text":"当前主张","evidence_ids":["E1"],"conditions":"条件","conflicts":"反例/冲突","section":"章节"}`。映射不等于语义支持；必须实际阅读后判断。

稿件上下文JSON：`{"title":"当前题名","selected_sources":["S1","D1"],"evidence_ids":["E1"],"claim_ids":["C1"],"analysis_ids":["A1"],"figure_ids":["F1"]}`。数组只填本稿实际选定内容；无对应能力用空数组。此结构不内置任何论文。

Markdown正文中 `[@S1]` 是选定文献引用，`[evidence:E1]` / `[claim:C1]` 是支持映射，`[value:A1:groups/实际组名/mean]` 是脚本实际数值，独立一段 `[figure:F1]` 插入当前图。结果键采用 `/` 路径；组名含 `/` 时用另一个明确列/组名版本，不猜路径。引用按出现顺序编号，仅真正被引用的文献进入参考文献；数据来源通过分析清单回查。正文不要手写参考文献表。

检查JSON按 `scientific`, `figure_visual`, `pdf_visual` 分别记录：`{"status":"pass|fail|pending|not_run","notes":"实际检查范围和发现","reviewed_sha256":{"tasks/T1/manuscript/V1/manuscript.md":"实际SHA256"}}`。科学检查包含当前稿md；图像检查包含稿目录中的每张PNG；PDF检查包含当前实际PDF。只有实际打开和检查对应材料后写pass。检查覆盖不全、摘要不匹配会拒绝。没有提供检查记录的交付明确partial；不能将生成成功当作科学或视觉检查通过。

## 依赖与重开

检索、文本、CSV分析和校验用标准库。PDF读取需要 `pypdf`，绘图需要 `numpy` / `matplotlib`，DOCX需要 `python-docx`，PDF导出需要 `reportlab`；article后排版另需已有的 `Pillow`读取图尺寸。已有Noto可变字体的常规/粗体实例化使用已有 `fontTools`，不可用会明确回退并记partial，不自动安装。原稿简版导出缺库时保留Markdown及真实缺口；后排版缺必需库会保留失败尝试，不能称DOCX/PDF完成。

`format_paper.py`只读指定原稿、选定上下文、引用映射及图，重新解析并与原Markdown逐字核对，使用原helper共享唯一写锁，在 `tasks/<task>/formatted/<id>/` 创建新版本。复制原MD、context、map和PNG原字节；同一解析正文输出DOCX/PDF，`layout-manifest.json`记录格式器/来源/输出摘要、实际字体及待检查状态。原helper的 `verify --paper`仍只处理manuscript原稿；formatted新PDF须单独实际查看并记录当前文件摘要。生成完成不等于科学或视觉检查通过。

版式为A4、四边25mm、单栏，正文11pt/13.6pt、首行17pt，题名居中17.28pt，摘要10pt/12pt，黑色编号章节14.4pt/12pt，底部居中页码。Word字号只支持半磅，题名/一级节取最近的17.5pt/14.5pt，实际值记入清单；PDF使用17.28pt/14.4pt。摘要和参考文献不编号，列表逐项换行；标题原文字完整保留，不猜剥离数字。图按原manifest打印宽度及真实纵横比居中，超过160mm正文宽度会失败，不自动缩放。Word英文用Times New Roman；本机已有Noto Serif SC时中文采用它，否则宋体，章节为粗体。PDF使用已有Windows Noto Serif SC与FontTools，先按本稿实际字符做内存子集，再实例化400常规/700粗体；各子集face名字独立，实际名字和权重记入清单。不下载、不打包或落盘完整字体。常规实例失败时明确回退STSong-Light，粗体失败时保持常规并记缺口；存在字体缺口的新格式生成记partial，不能称版式全部通过。英文采用Times。这不是相同TeX字形、分页或投稿模板的逐像素复刻。不支持复杂数学、Markdown表格、代码块或脚注；需用已核实的编辑工具另存并重新校验，不伪称已排好。

所有步骤在 `tasks/<id>/<kind>/<version>/` 保存独立receipt、任务身份及输入/代码/输出摘要。步骤、输出和依赖只接受当前真实任务，拒绝任务目录别名、跨任务junction及复制来的其它任务receipt；用户明确选择的输入仅在inputs内。重复相同命令只在校验通过后回读；输入、参数、样式或脚本改变要求新版本。

普通失败保留为 `.failed-*`；脚本捕获的中断在写下真实终态后保留为 `.interrupted-*`，不会假称产物完成。状态查询分别列出失败、中断和工作区未确认的 `.pending-*`。尚有pending时拒绝所有写入及已完成步骤的复用；残留锁也阻止写入。若中断终态无法保存，pending和锁继续保留，必须人工核对原进程与产物，脚本不自动抢占、清理或声称已检查进程。已知失败/中断重试仍保留旧记录；变更输入、参数或方法时选择新步骤版本。摘要不是防篡改签名，任务文件需受用户正常权限保护。

结果目录是科研材料而非安装包。默认交付仅稿件、引用映射和用到的PNG；不复制来源PDF、CSV或原生对话。既有输入、稿件和失败记录一直保留。

平台附件导出可能改变文件元数据及字节摘要。不要直接导出receipt覆盖的原件；按 [论文交付](references/manuscript.md) 创建独立发布副本，保留原件清单，再核对平台处理后的实际交付清单。

## 开发检查

在包的独立副本运行 `python -m unittest discover -s tests -v`。测试仅建立明确标注的合成夹具，统计答案独立可知；没有默认示例论文。真实DuMate安装、平台权限及页面检查由实际测试单独记录。


## 科学核对与限定修订补充

科学核对方法、检查记录和限定修订接口见 [scientific-review.md](references/scientific-review.md)。新增 `scripts/check_revision.py` 仅用标准库，复用冻结helper的任务边界、摘要和唯一锁；两稿均先由原 `manuscript` 命令生成，再按原稿SHA256和明确位置的old/new清单核对新源码。原helper、统计/绘图、旧稿和排版工作不改。

核对通过仅表示修改范围逐字节匹配，不自动批准科学结论、独立审阅或新DOCX/PDF页面。相同输入可校验后复用；旧记录不覆盖新稿。不改变当前平台安装，发行补充包与实际安装/调用状态分别记录。

## 原始配对散点图

两个已选数值列需要逐行展示时，读取 [scatter.md](references/scatter.md) 并用 `plot_scatter.py`。同一ID对应配对提取analysis和真实figure两份版本；其row_count可用原正文数值标记，PNG及图注可用原figure标记入稿。保持原始行、不重跑已有分组统计，不增加拟合、CI或显著性结论。原图种和已有article交付继续有效。
