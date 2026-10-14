# 学习与训练曲线

Copyright (c) 2026 alphaXiv. 方法指引适配，MIT 许可见 [../../LICENSES/alphaXiv-MIT.txt](../../LICENSES/alphaXiv-MIT.txt)。入口见 [../chart-suite.md](../chart-suite.md)。

输入为 variant,seed,x,value。x.quantity 只能是 optimizer_steps/tokens/samples/flops/wall_time，标签与单位描述该真实计数。comparison_basis 必须明确：same_config 可用步数；batch_change 只接受真实tokens/samples；model_change 用FLOPs，或tokens并为每variant报告正model_sizes；efficiency必须真实wall_time和hardware说明。换轴名不能伪造计算量。

按全部实际 seed 聚合，不挑好种子。先求所有运行共同到达区间，再只在区间内线性插值；不使用np.interp范围外夹值制造早停平尾。均值线附逐点95% Student t CI及每variant n，同时保留全部实际个体原线。声明 assumptions.independent_seeds:true 仅在实际核验后使用；单种子无CI且partial。

measurement_kind 为 training_loss 或 evaluation。仅training_loss允许 ema_alpha∈(0,1]；原始个体曲线仍淡显示，图注记录算法/参数。评估指标禁止平滑，以免制造未测量评估。CI来自所声明显示变换后的种子曲线，不把阴影当原始离散观测。

曲线公平横轴、共同覆盖、提前停止、实际种子n、平滑声明和个体分歧都须核对。baseline灰色，图例置数据区外；太多曲线拆图，不把字体降到5pt以下。科学解释和实际视觉检查独立保持pending。
