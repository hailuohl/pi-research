# 研舟π科研助手 · 包装修订1.0.1

独立DuMate组合Skill。运行只需当前可用Python 3.10+及对应功能的库；无需原仓库或服务。安装zip的根目录放 `SKILL.md`、`references/`、`scripts/`、`assets/`、`LICENSES/`。不打包工作区或运行日志。

1.0.1仅修订平台附件发布说明；确定性脚本及receipt格式仍为1.0.0，脚本与样式摘要不变。旧1.0.0安装包、任务与交付记录保留。更新安装和原生导出必须另外实测，不能用文档修订代替平台验收。

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

检索、文本、CSV分析和校验用标准库。PDF读取需要 `pypdf`，绘图需要 `numpy` / `matplotlib`，DOCX需要 `python-docx`，PDF导出需要 `reportlab`。脚本不自动安装这些库；缺少文档库仍保存Markdown和真实导出缺口。简版DOCX/PDF支持标题、段落、图和引用；复杂数学、期刊模板、Markdown表格和脚注要用已核实的编辑工具继续处理并再次校验，不称模板排版已经完成。

所有步骤在 `tasks/<id>/<kind>/<version>/` 保存独立receipt、任务身份及输入/代码/输出摘要。步骤、输出和依赖只接受当前真实任务，拒绝任务目录别名、跨任务junction及复制来的其它任务receipt；用户明确选择的输入仅在inputs内。重复相同命令只在校验通过后回读；输入、参数、样式或脚本改变要求新版本。

普通失败保留为 `.failed-*`；脚本捕获的中断在写下真实终态后保留为 `.interrupted-*`，不会假称产物完成。状态查询分别列出失败、中断和工作区未确认的 `.pending-*`。尚有pending时拒绝所有写入及已完成步骤的复用；残留锁也阻止写入。若中断终态无法保存，pending和锁继续保留，必须人工核对原进程与产物，脚本不自动抢占、清理或声称已检查进程。已知失败/中断重试仍保留旧记录；变更输入、参数或方法时选择新步骤版本。摘要不是防篡改签名，任务文件需受用户正常权限保护。

结果目录是科研材料而非安装包。默认交付仅稿件、引用映射和用到的PNG；不复制来源PDF、CSV或原生对话。既有输入、稿件和失败记录一直保留。

平台附件导出可能改变文件元数据及字节摘要。不要直接导出receipt覆盖的原件；按 [论文交付](references/manuscript.md) 创建独立发布副本，保留原件清单，再核对平台处理后的实际交付清单。

## 开发检查

在包的独立副本运行 `python -m unittest discover -s tests -v`。测试仅建立明确标注的合成夹具，统计答案独立可知；没有默认示例论文。真实DuMate安装、平台权限及页面检查由实际测试单独记录。
