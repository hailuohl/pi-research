# 合成 RMSE 调试实测夹具

这四份 Python 文件取自真实 Docker 绿灯作业的固定源码。`metric.py` 是真实 Pi 修改分母后的版本；`baseline_metric.py` 故意保留原缺陷。这里验证软件回归，不使用科研数据或支持科学结论。

同一组检查包含单观测、双观测和空输入拒绝。RMSE 定义为 `sqrt(sum((observed-predicted)^2)/N)`。

```text
python check_metric.py baseline_metric.py
```

预期退出 1：单观测除零，双观测数值断言失败，空输入检查通过。

```text
python check_metric.py metric.py
```

预期退出 0，三项通过。`audit_regression.py` 在同一进程安排中用相同测试分别执行旧源码和修复源码，验证原始错误与修复成功，并将实际命令、退出码、源码/测试摘要和输出保存至 `PI_OUTPUT_DIR/red-green.json`。`PI_OUTPUT_DIR` 必须是实际可写输出目录；受管 Docker 检查由宿主提供 `/output`，不会把工作目录文件自动当作声明产物。

应用中先准备 `python check_metric.py metric.py` 的修复前检查；完成准确批准并观察原作业后，再修改私有 `metric.py`，准备 `python audit_regression.py`，声明 `expectedArtifacts:["red-green.json"]`，另行准确批准。实测使用已有镜像 `pi-regression-methods@sha256:f9ce79cbb5c0345507763834b6e7597912b939006bf949a5f38fd96d8eb56b12`、desktop-linux、1 CPU、512 MiB、64 PID、60 秒及禁网，不在作业内安装依赖。

真实过程、原始独立审查的漏读及之后补审的边界见 [实测记录](../../docs/acceptance/flow-research-code-debugging-live-20261021/RESULT.md)。示例 README 是事后复现说明；原场景 README 和完整候选仍保存在实测固定归档中。
