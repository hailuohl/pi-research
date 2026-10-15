# PubMed → PMC OA 全文：本批结果

新增可用能力：所有者可对 PubMed PMID 显式选择 `oa-full-text`，经 PMID→PMCID 核对后取得 PMC 开放获取 JATS；保存两份原始 XML、来源版本、许可及派生文本。固定文档标为 `provider-text`，不声称 PDF 页映射。真实记录 `34285670` 成功固定为 `PMC8270360.1`；两步 EFetch 各计量一次。

剩余工作：外部 Linux/Slurm 实测暂无授权环境，PR14 与前端布局仍按原计划后续。JATS 表格文本提取和许可相邻标签间空格列入后续待办；原始 XML 已完整保留。

验收：非 OA、身份/版本/许可/XML 异常和来源关闭均拒绝发布；旧摘要与检索/失败历史、关闭来源后的新全文可重开回查，跨项目读取拒绝。浏览器已回看全文、派生文本与历史；未重复提交真实任务。原有 20 条非设置记录逐条摘要未变。独立复核提出的 XML 序言/属性阻断已用先失败后通过的回归修复。

验证：干净构建通过；全量回归 815 通过、22 跳过、0 失败；XML/OA 定向 4 通过，文献界面定向 13 通过。Pi、Docker 与外部 SSH 不在本批关键路径；缺少外部环境的实测按用户要求跳过。机器摘要见 [evidence.json](evidence.json)，原始日志留在本地 `.validation/pmc-full-text/`。

代码提交：[204a8d02ac02512d8477b4f3c097721c56fd2750](https://github.com/hailuohl/pi-research/commit/204a8d02ac02512d8477b4f3c097721c56fd2750)，分支 `implementation/pr01-reproducible-baseline`；私有远端已核对包含该提交。
