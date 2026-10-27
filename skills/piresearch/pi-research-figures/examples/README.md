# 绘图示例与输入合同

这些示例从工作目录的 `figs/` 读取数据。把所需脚本及 `assets/pi_figstyle.py` 复制到该目录，从父目录执行 `python figs/<脚本>.py`。默认产出同名 PDF/SVG；`PI_OUTPUT_DIR` 优先于 `OUTPUT_DIR`，此时 `figs/<名称>` 是输出根内的相对路径，不改变输入位置。

| 脚本 | 输入字段 | 输出 stem | 解释 |
| --- | --- | --- | --- |
| loss_curve.py | loss_curve.csv: variant,seed,step,value | figs/loss_curve | 按 variant 对齐独立 seed，在共同覆盖范围内插值到首 seed 网格；均值及点态 95% t 区间，灰色 baseline 与末端 n 标签 |
| scaling.py | scaling.csv: family,n_params,loss,fit | figs/scaling | 所有 fit=1 行联合拟合 L=E+A*N^(-alpha)，E>=0、A>0；原 loss 尺度最小平方、alpha 行 bootstrap、heldout 空心点、明确外推至 PREDICT_TO 与百分比残差面板 |
| benchmarks.py | benchmarks.csv: benchmark,method,score | figs/benchmarks | 配置 METHODS=[(name,group)]/BENCHMARKS；base 灰、prior 蓝系、ours 红系，Accuracy (%)；缺格留空，不推断 CI |
| ablation.py | ablation.csv: variant,seed,value | figs/ablation | REFERENCE 默认 baseline、HIGHLIGHT 默认 ours；按独立组差值排序并标正负号，Welch 95% 区间及各臂真实 n |
| pareto.py | pareto.csv: method,setting,seed,kl,reward | figs/pareto | METHODS 配置每方法颜色与 marker，显示全部原始 run 淡色点，逐方法画原始点前沿；标明设置数/实际 run 数 |
| sweep.py | sweep.csv: lr,batch_size,loss | figs/sweep | 学习率降序、batch 升序；空 loss/未列组合留空，全缺失拒绝；最小有限 loss 格加边框 |
| confusion.py | confusion.npy: true×predicted 非负整数 counts | figs/confusion | 按真实类别行归一化，0 总计行留空，原 counts 不变；classes 默认 ent/neut/contra，形状不匹配提示配置 |
| method.tex | 无数值输入 | 编译目标目录中的 method.pdf | standalone/TikZ/amsmath、Latin Modern矢量字体、阶段分组、反馈虚线 |

`benchmarks.py` 内的类别顺序已覆盖自带软件夹具，真实研究数据使用前应按研究设计修改；遇到未声明类别明确拒绝，避免默默漏掉方法。所有数值图的单位应在真实研究使用前核对，不能从软件示例推断测量定义。

`software-demo-data.py` 只在隔离临时目录运行，生成标有 SOFTWARE DEMONSTRATION 的合成输入，不能作为科研结果；若目标已有任一输入即拒绝覆盖。脚本不自动生成或改写真实研究数据。

TikZ 示例含完整前导，可执行 `pdflatex -halt-on-error -output-directory figs figs/method.tex`；已有文稿可复制 `assets/pi-tikz-preamble.tex`，正文用 `research box/data/method/muted/flow/feedback/edge label/stage`。颜色使用 `piBlue/piOrange/piGreen/piInk/piGray`。检查实际 PDF 的尺寸和文字，不仅检查退出码。

基础调用：`use_style()` 后用 `figure()` 或 `figure_grid()`；`band` 使用均值区间；`label_ends` 按实际渲染字高放置直接标签；`si_ticks` 格式化数量级；`annotate_matrix` 跳过非有限格。`save` 默认写 PDF/SVG 并关闭 Figure，可用 `close=False` 留待进一步检查。

公开加载接口：loss_curve.load(path) 返回 {variant:(steps,runs[n_seeds,n_steps])}；scaling.load(path) 按原行序返回 (n_params,loss,fitted,family) 四个数组；sweep.load(path) 返回 (学习率降序列表,batch 升序列表,NaN 网格)；ablation.load(path) 返回 {variant:np.array}；benchmarks.load(path) 返回 {method:{benchmark:float}}，method_colors() 返回 {method:hex}。各脚本保留 DATA 常量。scaling.fit_power_law(n,loss) 返回 (E,A,alpha)，bootstrap_alpha(n,loss,draws=200,seed=0) 返回 alpha 的 2.5/97.5 分位，PREDICT_TO 默认 1e11。

Pareto 另保留 load(path)->{method:(kl数组,reward数组,不同setting数)}，METHODS 默认 GRPO=(blue,o)、ES=(red,D)，颜色与形状共同区分方法。尺度律百分比残差定义为 100*(observed-fitted)/observed。save 的普通审查提示仅报告；审查异常打印 FAILED 后重新抛出，已写文件保留，close 参数仍生效。输出根下的 stem 禁止任何冒号。
