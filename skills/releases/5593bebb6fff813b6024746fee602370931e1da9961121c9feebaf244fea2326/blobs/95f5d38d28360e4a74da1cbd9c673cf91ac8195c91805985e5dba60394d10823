# 热图、扫描与混淆矩阵

回答二维测量网格的结构。颜色不擅长精确比较近值，适合一次识别全局模式；如果读者只需要细微数值差，考虑其他图。

## 先判断是否需热图

3×4网格常可用4条各3点的折线，直接从轴读值更清楚。约5×5以上，或真正对称的混淆/相关矩阵（任意尺寸）适合热图。

| 数据 | 色图 | 要点 |
|---|---|---|
| loss/accuracy/count等有自然低端的量 | viridis / `SEQUENTIAL` | 感知均匀并适合灰阶 |
| 有符号差值/相关/相对基线delta | RdBu_r / `DIVERGING` | 自定 `vmin=-max|x|,vmax=max|x|`，零为中点 |
| 任意 | 禁用jet/rainbow/hsv | 会在人为亮带制造结构 |

不能让有符号色图自动把数据中点当零。色条是轴，标量名及单位，与图等高；多面板同量用统一norm和一个共享色条，不能独立autoscale后暗示可比。

## 混淆矩阵

归一化并说明：类别不平衡下原始计数会放大大类；行归一化为每真实类recall，列归一化对应precision。约12×12以内可标数，更多用色条。类别顺序按频次、语义分组或与比较对象一致；字母序会打散有意义块。`aspect="equal"` 保持正方形。无样本类是未定义，须NaN而非0 recall；图注报告各类support，3样本的1.00不同于3000样本。

## 常见错误

| 错误 | 处理 |
|---|---|
| 单元格平滑 | `interpolation="nearest"` |
| 轴仅0/1/2索引 | 显示实际值；log分布注明 |
| 深色格看不见字 | `annotate_matrix` 按亮度选黑/白 |
| 最优格需读者找 | 框/标记最优 |
| NaN当最低值 | 给失败/缺失明确颜色并图注解释 |
| 两图两套色条自动缩放 | 统一norm，一个色条 |

## 完整模板：超参扫描

`figs/sweep.py` 输入 `figs/sweep.csv`（`lr,batch_size,loss`）。空loss为失败/未完成，保留NaN并灰色，与糟糕但真实的值区分；全空时停止不画假结果。

完整可复制模板：[examples/sweep.py](../examples/sweep.py)。

## 完整模板：混淆矩阵

保存 `figs/confusion.py`，输入 `figs/confusion.npy`（true×predicted原始counts），classes改为真实类别。按行归一化，零support类保留NaN；图注写归一化与各类support。
完整可复制模板：[examples/confusion.py](../examples/confusion.py)。

使用 research_skill_read 的本技能ID和 `resource:"examples/sweep.py"` 或 `resource:"examples/confusion.py"` 读取完整代码；实际参数放input内。

## 验收

- 网格规模/对称性适合热图；顺序有依据。
- 幅值用连续色图，有符号以零对称；统一且标单位的色条。
- 实际轴值、nearest、无平滑；失败与坏值可区别。
- 混淆归一化方式和support写图注，无样本不当零。
- 审查文字、打印尺寸并看实际图。

来源/版权见 [../PROVENANCE.md](../PROVENANCE.md) 与 [../LICENSE](../LICENSE)。执行与归档边界沿 SKILL.md，不由模板授予。
