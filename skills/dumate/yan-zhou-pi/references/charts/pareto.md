# 权衡与 Pareto 前沿

Copyright (c) 2026 alphaXiv. 方法指引适配，MIT 许可见 [../../LICENSES/alphaXiv-MIT.txt](../../LICENSES/alphaXiv-MIT.txt)。入口见 [../chart-suite.md](../chart-suite.md)。

输入 method,setting,seed,x,y，三元身份唯一。x/y各有真实量名、单位与higher/lower好方向；two_sided没有全序不能用Pareto。保留全部实际运行点和被支配点，不能先均值隐藏同设置种子散布。

方法同时使用形状和色相；仅连没有别点在两轴都至少同样好且至少一轴更好的非支配点，按x排列。连线只是视觉指南，不表示离散设置之间未运行点可达。图注明确各方法实际setting数，spec.budgets、budget_unit、budget_comparability说明实际扫描预算与不等预算理由；单位为settings时声明值必须等于实际setting数。

跨数量级成本轴可选择x_scale/y_scale为log，全部实际值须正。预算可比性、前沿稳定性及好角落是否有数据是科学问题，不能由一个漂亮前沿自动判通过。过多方法拆图，不丢被支配点或缩小字体。
