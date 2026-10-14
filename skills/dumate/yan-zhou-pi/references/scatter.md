# 原始配对散点图

需要展示同一观测的两个数值变量时使用。每行对应一个点，保留重复X、原行顺序及全部有效观测；不把分组均值柱图当原始分布。先明确两列、观测含义和单位，只处理本任务明确登记为data的CSV。

```text
python 包目录/scripts/plot_scatter.py --workspace 工作区 --task T1 --source D1 --x time --y value --x-unit s --y-unit dimensionless --id Scatter1
```

列名必须来自实际CSV，两列不同，单位明确。缺列、重复列名、坏行、空值、非数值、非有限值或无观测时失败；不自动排除、转换单位、汇总、排序或制造点。原CSV保持，配对提取副本和来源清单另存。原分组描述统计/均值柱图继续使用原helper，不能把其result当作原始配对点。

命令用一个版本ID另建 `analysis/Scatter1`（仅校验和提取原始配对，非推断分析）与 `figures/Scatter1`；复用冻结helper的任务边界、唯一锁、失败保留和摘要机制。前一步成功后成图失败，保留该提取记录；恢复原依赖后可校验复用，不删除重跑。输入、代码、单位或样式变化使用新ID，不覆盖已有稿、图或分析。

图按TEXT打印宽度生成PNG/SVG/PDF，轴标注量和单位，图注给出实际行数及原始配对含义。相同坐标可能重叠，n按原始行计数；不自动抖动位置或用可见点数替代样本数。没有拟合线、误差条、相关检验或因果结论；点的视觉趋势不能自动解释为统计显著、机制或总体关系。合成数据在方法及图注中保持如实标识，资料性质从所选来源读取。

接入稿件时，paper_context的selected_sources包含该数据源，analysis_ids和figure_ids均加入本次真实ID；`[value:Scatter1:row_count]`读取实际行数，独立段落 `[figure:Scatter1]` 插入真实图。沿用原manuscript和article命令另建版本；不把图或数值借入其它任务，不复用旧PDF检查批准新稿。

先读manifest的audit；warning或partial不能称脚本检查通过。实际打开图或排版后页面，核对点、标签、单位、裁切和打印可读性，只有确实看到才记录视觉结果。缺字体、缺库及看图能力如实列缺口，不自动安装。按scientific-review方法另外核对当前数据与主张，生成后仍保留pending。

方法采用本项目pi-research-figures的打印尺寸、原始观测保留、轴语义与独立视觉检查原则，复用包内MIT figstyle资产及许可；不接入Pi工具、研舟服务或新的统计执行器。
