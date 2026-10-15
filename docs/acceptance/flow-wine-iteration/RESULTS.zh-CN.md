# 真实红酒数据的实测比较与停止

在上一批固定的 [UCI Wine Quality 红酒数据](https://archive.ics.uci.edu/dataset/186/wine)上，本批先固定一份按行索引散列排序的 `split.json`：1,279 行训练、320 行测试。训练集均值对照经单独批准的真实 Docker Run 得到 MSE **0.532809**、MAE **0.629476**。Pi 实际读取该 Run 的原始指标与固定源码，在精确文件 WorkingGrant 下只修改 `mean_baseline.py`，提出一个仅用训练行拟合的 alcohol 一元最小二乘候选。Pi 读取了拆分文件开头 300 字节，完整索引由程序在固定快照中读取。

候选经 WorkingGrant 派生的一次开发测试成功，并通过绑定该测试结果的单文件变更提案、整合批准生成同契约子实验。候选的正式 Run 再获单独批准，完整实测 MSE **0.400966**、MAE **0.511689**。两次 Run 的 CSV、拆分、镜像、网络策略与指标单位相同，只有模型代码不同。独立从原 CSV 重算全部 **640 行归档预测**及 MSE/MAE，与两次 Run 一致。原论文表 1 Run 和报告仍 current/verified。

研究活动保存两项 verified 观测、固定比较方案和获批准的 **Stop** 决定：在本次拆分上候选 MSE 降低约 **0.131843**、MAE 降低约 **0.117787**；本批只做一个候选，后续需另定问题与授权。比较报告 current/verified，可回到两次 Run、同一拆分、实际源码及开发测试。浏览器看到两项实测、停止原因和新旧报告，刷新后仍可读。

**解释限制：**拆分索引互斥，但 **320 条测试记录中有 91 条完整记录也出现在训练集**。本结果只是这个固定拆分的观测，不能称为独立样本上的泛化改进、因果发现或 [Cortez 等人论文](https://projects.csail.mit.edu/wiki/pub/Evodesign/SensoryEvaluationsDatabase/winequality09.pdf)的 SVM 复现。产品内方案修订是在两次 Run 后随 Stop 决定保存，不能称为事前注册。研究活动已停止；另行批准的 WorkingGrant 用了 1/2 次提交，剩余 1 次仍受原期限和精确文件范围约束。本批没有接受新的科学 Claim，也没有对外发布。

本批仅使用已有产品代码；未机械重跑全量回归或干净构建。独立 Astra 只读复核未发现执行或权限链阻断，指出上述重复记录与方案时序局限。[机器证据](evidence.json)只保留固定身份和必要数字；私有源码、原 CSV、模型会话及原始日志留在本机 `.validation/wine-iteration-flow/` 与验收数据目录，前端布局仍暂缓。
