# 完整图形入口

`python scripts/chart_suite.py --workspace <workspace> --task T1 --id F1 --source D1 --spec inputs/chart.json --plan P1`。

先登记明确选择的实际 data 来源、建立允许分析的计划；D1 必须在 P1.source_ids 中。一个 F1 同时生成 `analysis/F1/result.json` 和 `figures/F1/manifest.json`，保持旧 paper_context 的 source/analysis/figure 绑定和 `[value:F1:results/... ]` 有限数值引用。没有 Run 树、数据库或隐式联网。

所有计算从锁内核验的实际输入完成；图使用 result.json 的实算结果。PNG/SVG/PDF 均为5.5英寸 TEXT 打印宽度，SVG/PDF 保留矢量元素。manifest 记录实际数据和结果摘要、原文 data_label、各臂/各线实际 n、CI 方法、图注、字体来源/字形子集哈希、严格 audit、真实渲染 warnings 和 visual_check:pending。字体从本机既有字体选取，不安装、不改冻结风格。

图注只放来源、样本、方法、单位和实际限制；科学/视觉/独立审阅状态保留在manifest和检查记录，不作为内部流程说明写入论文。

所有图（含diagram）在局部保存范围把SVG文字转为矢量路径，避免依赖进程内字体家族；PDF仍为矢量输出。源数据、chart-spec.json和diagram-source.json保持可编辑，修改后使用新版本重新生成。

图种和 schema：

| kind | 注册数据字段 | spec 要点 | 方法参考 |
|---|---|---|---|
| benchmarks | benchmark,method,score CSV | methods/benchmarks固定顺序；method_families 完整映射；非负、完整网格、零基线 | [比较](charts/comparison.md) |
| ablation | variant,seed,value CSV | baseline；design independent/paired；适用 assumptions | [比较](charts/comparison.md) |
| curves | variant,seed,x,value CSV | x quantity/单位/好方向；comparison_basis；measurement_kind；可选训练loss EMA | [曲线](charts/curves.md) |
| scaling | family,n_params,loss,fit CSV | comparability、机制理由、逐行排除理由、bootstrap参数/外推终点 | [尺度律](charts/scaling.md) |
| pareto | method,setting,seed,x,y CSV | 两轴单位/方向；实际budgets、单位和可比性说明；可选log | [权衡](charts/pareto.md) |
| sweep | x,y,value CSV，可选面板列 | 两轴实际量/单位；missing空值灰；所有面板共享 norm | [矩阵](charts/matrix.md) |
| confusion | true,predicted,count CSV 或 classes/counts JSON | classes实际顺序/理由；counts/row/column normalize；稀疏CSV显式missing_counts=zero | [矩阵](charts/matrix.md) |
| distribution | group,value CSV | 共享histogram bins；summary box/violin；显示全部原始点 | [分布](#原始分布与散点) |
| diagram | nodes/edges JSON data来源 | source_id/evidence_ids/provenance；flow LR/TB；唯一contribution | [方法图](charts/diagram.md) |
| scatter | 任意x/y CSV列 | x/y.column、量名/单位/方向；可选linear/log | [分布](#原始分布与散点) |

数值指标声明 `metric:{"name":"实际量","unit":"实际单位或dimensionless","direction":"higher|lower|two_sided"}`。curves/sweep 的 x/y 轴、scatter/pareto 两轴用相同声明；散点可设置 column。不替用户推断指标好方向。名字、实际列、中文标签、预算、类别和数据必须与真实来源一致。

示意散点 spec：

```json
{
  "kind":"scatter",
  "x":{"column":"tokens","name":"实际训练tokens","unit":"tokens","direction":"lower"},
  "y":{"column":"loss","name":"实际评估loss","unit":"dimensionless","direction":"lower"}
}
```

## 原始分布与散点

distribution 输出共享边界的直方图与 box/violin 两面板，叠加实际原始观测；summary 默认 box，bins 可为1–200整数或 fd/sturges/auto。violin 每组至少两项且有变异，否则拒绝并要求选 box。箱体和密度不是均值置信区间，n 与原始点不能省略。

scatter 显示全部选定实际行配对；不自动拟合、不聚合、不暗示独立重复。重合坐标可能覆盖但 n 为输入行数。log 轴必须真实正值。中文标签使用同一字体校准和真实glyph warning审计。

## 失败、重开与稿件边界

缺列/重复记录/不适用设计/无共同覆盖/全空扫描/未授权来源/跨任务/来源改变/缺依赖均失败并保留历史；样本不足、未核验假设、计算或渲染 warnings、audit问题产生 partial。程序完成、科学解释、实际视觉审阅、独立复核是四件不同的事；warning/partial 图不能当作可入稿图。

先看实际打印尺寸PNG和PDF，再以独立审阅决定可否使用。改参数/代码/输入使用新版本，不能覆盖旧产物或通过忽略warning获得pass。图的 chart-spec.json 可编辑；diagram 还保存 diagram-source.json。字体 subset 和精简机器证据留在当前任务，不重复复制原始日志。

六类方法沿 alphaXiv MIT 指引适配；归属与许可见 [../LICENSES/alphaXiv-MIT.txt](../LICENSES/alphaXiv-MIT.txt)。新入口不执行外部 TeX 图代码。
