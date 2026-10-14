# 二维扫描与混淆矩阵

Copyright (c) 2026 alphaXiv. 方法指引适配，MIT 许可见 [../../LICENSES/alphaXiv-MIT.txt](../../LICENSES/alphaXiv-MIT.txt)。入口见 [../chart-suite.md](../chart-suite.md)。

sweep 输入 x,y,value；可指定panel_column。空value或尚未观测的格点是undefined/灰色，坏但真实数值保留自身颜色；nan/inf字符串是坏输入，不能变灰掩盖。所有面板全空失败；某个全空面板在其他面板有测量时仍保持灰色。实际轴值显示，无插值/平滑，nearest单元格。

所有同量面板用一个共享norm和一个量名/单位色条。norm.signed:true使用零对称RdBu_r；否则使用viridis。可显式vmin/vmax但必须覆盖全部实际值，不能裁色域制造比较。非two_sided指标框出实际最优格；two_sided不擅自判断单向最优。

confusion 输入 true,predicted,count长CSV，或已登记JSON `{classes:[实际类], counts:[true×predicted矩阵]}`。classes和class_order_rationale显式固定实际顺序；不自动字母排序。计数非负整数且总support>0；长CSV重复单元格拒绝，缺格只有显式missing_counts=zero才补零。

normalize为counts/row/column；row为每真实类recall，column为precision。报告真实类support及预测support；零support分母保留NaN/null灰色并partial，不能画成零recall。正方形aspect，nearest，不平滑。小矩阵按颜色亮度放黑/白数值，大矩阵不强行密标。

小而非对称网格可用曲线更清楚；精确近值比较应改数值表。共享norm、灰色未定义、实际类别与support、审计和打印尺寸视觉检查都要核验。
