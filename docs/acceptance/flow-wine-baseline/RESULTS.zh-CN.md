# 固定论文与真实数据的表 1 基线复核

本批走通一条真实科研输入流程：固定 [Cortez 等人论文预印本](https://projects.csail.mit.edu/wiki/pub/Evodesign/SensoryEvaluationsDatabase/winequality09.pdf)原 PDF 和 [UCI Wine Quality](https://archive.ics.uci.edu/dataset/186/wine) 红酒 CSV；隔离解析 17 页。Pi 在同一原生会话实际读取第 5 页、实验源码和 CSV 开头，生成 `baseline.py`；完整 CSV 由后续容器运行读取。解析、两次开发测试和正式 Docker Run 分别批准，报告可从实测指标回到固定源码、CSV 与论文页段；浏览器刷新仍保留第 5 页的精确引用区间。

首次开发测试真实失败并保留 stderr：Pi 的布尔计数表达式抛出 `TypeError`，没有产出指标。Pi 从该失败作业读取日志，在同一原生会话只改正计数一处；新的单次批准测试成功。原失败作业、两个不同源码摘要和两次批准均保留。项目所有者核对新源码与测试快照后，将其写入实验修订 v2；正式 Run 再获单独批准。

正式 Run 使用固定的 1,599 行 CSV 和源码，完整成功，`table1_match_fraction=1`。重算的 fixed acidity 最小/最大/均值为 4.6/15.9/8.3196，alcohol 为 8.4/14.9/10.4230；按论文表 1 的一位小数精度，六项均一致。独立读取原 CSV 的预检得到同一数值。报告为 verified/current，绑定 1 个真实 Run、两个原 PDF 第 5 页证据和一个仅陈述这六项比较的本地结论。

**范围限制：**这只复核论文表 1 中红酒两个变量的描述统计，没有训练或复现论文的 SVM、神经网络或多元回归模型，也没有验证科学因果结论。PDF 由用户入口上传并以摘要固定，不声称已认证出版商版本或 DOI 身份；解析器对表格结构和阅读顺序仍标记 unknown/unverified，论文许可未知，未生成公开成果包。本批不修改产品代码或暂缓的前端布局。独立 Astra 只读复核未发现阻断这六项比较的问题；越界、失效和损坏路径沿用既有测试，本批没有重跑全量与干净构建。

机器身份、审批与运行状态见[单份机器证据](evidence.json)。私有原件、完整运行日志和原生 Pi 会话仍留在本机 `.validation/wine-baseline-flow/` 及其数据目录，不复制进本记录。
