# 固定 PMC 全文进入本地语料：本批结果

新增可用能力：所有者可将已固定的 PMC OA 全文显式加入本地语料，以词项检索派生原文，从片段回到确切的 `DocumentVersion`。命中保留 XML、文本和来源版本绑定，并标明无 PDF 页码。浏览器对 `PMC8270360.1` 完成选择、检索、回跳和刷新；关闭检索并重开后，历史命中与证据仍可读。

剩余工作：PMC 文本证据尚不能进入报告/成果包，现明确返回 `REPORT_PROVIDER_TEXT_UNSUPPORTED`，待完整 XML/许可来源链另批实现。Pi 会话的 PMC 语料授权未开放；现有 PDF 授权保持原范围。前端布局仍暂缓，外部 SSH/Slurm 实测按可用环境后续处理。

验收：网络获取不自动入语料；非 OA、普通摘要、缺失许可、错绑、跨项目与 Agent 读取被拒绝。移出或关闭来源会阻断新检索及回放，已保存结果按固定身份保留。真实流程新增 HTTP、模型和计算调用均为 0；隔离副本的旧 34 条记录摘要未变。独立复核发现并关闭普通证据绕过 PMC 报告限制的阻断，普通 PubMed 摘要和用户文本报告仍可用。

验证：最终干净构建通过；集中回归首次 822 通过、1 项旧断言失败、22 跳过，该断言在必要修复中更新；随后受影响的 57 项全通过，界面定向 5 项通过。机器摘要见 [evidence.json](evidence.json)，原始日志保留在本地 `.validation/pmc-local-corpus/`。

代码提交：[4cff0dfd9a91ca850b2bc9e306d27ad6e7d75824](https://github.com/hailuohl/pi-research/commit/4cff0dfd9a91ca850b2bc9e306d27ad6e7d75824)，分支 `implementation/pr01-reproducible-baseline`；私有远端已核对包含该提交。
