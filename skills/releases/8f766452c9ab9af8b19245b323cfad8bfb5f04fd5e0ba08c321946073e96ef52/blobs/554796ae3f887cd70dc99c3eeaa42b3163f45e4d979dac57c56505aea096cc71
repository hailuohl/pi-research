# 可复制绘图示例

**软件示例，不是科研结果。** 这些脚本保留上游完整模板；没有真实实验输入就不称图为研究结果。参考文档解释方法、陷阱和验收，代码以本目录为唯一版本。

读取方法：`research_skill_read`，例如 `{"input":{"skillId":"pi-research-figures","resource":"examples/loss_curve.py"}}`。另读 `assets/pi_figstyle.py`，把模块与脚本复制到获准工作区的 `figs/`；工作目录为该 `figs/` 的父目录。资源读取不会执行代码。

| 脚本 | 实际输入 | 输出stem/依赖 |
|---|---|---|
| loss_curve.py | figs/loss_curve.csv：variant,seed,step,value | figs/loss_curve；numpy/matplotlib |
| scaling.py | figs/scaling.csv：family,n_params,loss,fit | figs/scaling；numpy/matplotlib |
| benchmarks.py | figs/benchmarks.csv：benchmark,method,score；METHODS与BENCHMARKS匹配 | figs/benchmarks；numpy/matplotlib |
| ablation.py | figs/ablation.csv：variant,seed,value；含baseline | figs/ablation；numpy/matplotlib |
| pareto.py | figs/pareto.csv：method,setting,seed,kl,reward；METHODS匹配 | figs/pareto；numpy/matplotlib |
| sweep.py | figs/sweep.csv：lr,batch_size,loss；空loss为缺失 | figs/sweep；numpy/matplotlib |
| confusion.py | figs/confusion.npy：true×predicted原始counts；classes匹配 | figs/confusion；numpy/matplotlib |
| method.tex | 已包含pi-tikz-preamble，不需额外拼接 | 固定文稿mainFile=figs/method.tex；standalone/tikz/amsmath |

Python脚本的 `save()` 产生 `.pdf` 和 `.svg`，打印自动审查。本机Docker/开发测试设置 `PI_OUTPUT_DIR`，SSH设置 `OUTPUT_DIR`；样式模块自动把相对输出stem写到该根下，例如 `save(fig,"figs/loss_curve")` 生成 `/output/figs/loss_curve.pdf` 和 `.svg`。批准作业的 `expectedArtifacts` 填 `figs/loss_curve.pdf`、`figs/loss_curve.svg`，并核对真实归档；仅声明文件名不会搬运 `/work/figs`。CSV/NPY输入仍从工作目录的 `figs/` 读取；无输出变量的已获准本机运行保留相对路径行为。

命令例如 `python figs/loss_curve.py`，对应argv `['python','figs/loss_curve.py']`。使用已有开发测试/Run授权与固定环境；不得因这份README自动安装依赖、启动运行或绕过文稿编译审批。报告用途修改脚本的DATA/save相对路径及资源清单；设置输出根时拒绝绝对路径或越界stem。

样式自动审查有警告不抛异常，退出码0不能证明合格；必须读取stderr，修布局并看打印尺寸。原模板可能因真实输入标签长度、字体或环境发生碰撞，不能删审查或缩小5pt门槛来通过。

`software-demo-data.py` 只为隔离软件验证生成明确合成输入，调用时工作目录须为独立验证目录；它创建 `figs/` 下演示CSV/NPY和 `SOFTWARE-DEMONSTRATION.txt`，**不能在已有研究数据目录运行或交付作研究数据**。其覆盖文件存在时会拒绝。主代理统一运行示例，技能自身不自动执行。

TeX示意图需通过现有文稿流程编译，实际输出PDF artifact须以真实字节另行纳入论文 `figs/method.pdf`；不假定保存源码即生成旁边PDF。paper的 `assets/starter-main.tex` 是完整可复制主稿模板，可在无图时明确提示缺图，有真实图时纳入该资产进行PDF检查；外部 `.bib` 示例需用匹配BibTeX/Biber策略。

版权、准确上游文件与改动见 [../PROVENANCE.md](../PROVENANCE.md) 和 [../LICENSE](../LICENSE)。
