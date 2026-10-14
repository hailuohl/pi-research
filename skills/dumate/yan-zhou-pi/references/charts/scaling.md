# 尺度律

Copyright (c) 2026 alphaXiv. 方法及纯计算grid-fit适配，MIT 许可见 [../../LICENSES/alphaXiv-MIT.txt](../../LICENSES/alphaXiv-MIT.txt)。入口见 [../chart-suite.md](../chart-suite.md)。

输入 family,n_params,loss,fit；fit严格为0/1，参数数和loss均为真实正值。拟合 `L(N)=E+A·N^(-α)`，不固定E=0，也不拟合log(L−E)。扫描α，对每α在L空间求E/A的最小二乘；为数值条件把N相对几何均值缩放，最终仍报告实际单位的A。只接纳0≤E<min(loss)、A>0。

至少4个可比运行、4个不同尺度。spec.comparability必须明确 same_data/same_tokenizer/same_evaluation 与 rationale；mechanism_interval说明单一机制拟合区间。欠训练、warmup或另一瓶颈点可画空心但不得混拟合，excluded_reasons按原CSV行号逐项说明。小于一个数量级保留趋势图但partial，不能默认声称尺度律。

alpha_limits默认[0.02,1.5]；边界解partial。bootstrap_draws默认200（100–10000）、bootstrap_seed明确可复现；重采样退化或无物理解不计有效样本，报告实际valid/requested和minimum_valid。有效数不足时αCI=null并partial，不伪造区间。E接近零/min(loss)报告边界未约束，不把它当已测量不可约下限。

图内报告方程、α95% bootstrap区间和拟合n；附实际L残差面板，按家族形状+颜色区分，纳入实心/排除空心。实测拟合范围实线，spec.predict_to范围外虚线和阴影；预测不当观测。残差系统曲率、可比性与边界的科学判断仍需独立阅读，程序不会自动批准尺度律。
