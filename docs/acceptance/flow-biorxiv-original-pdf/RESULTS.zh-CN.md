# bioRxiv 指定版本 PDF：实网验收暂跳过

新增可用能力：本批没有新增代码或已验收的 PDF 能力。现有版本固定路径对 `10.1101/322859` 的 `v2` 发起一次真实请求，bioRxiv 返回 HTTP 429；持久任务明确失败、HTTP 计量为 1，未发布 `paper-read`、`DocumentVersion` 或原件产物。不得把这一结果写成 PDF 已获取。

剩余工作：仅在来源限流解除后对**原失败任务显式重试**并完成 PDF 字节、版本保证、关闭来源/重开与浏览器回查。OpenAlex [原始内容下载需要 API key](https://help.openalex.org/access/fulltext/)，当前环境未配置，实测同样暂跳过。原 PR01–14 其他可推进范围不受这两项外部条件阻塞。

失败路径和历史保留已核对：任务错误为 `CONNECTOR_RATE_LIMITED`、来源响应 429，未自动重试或生成半成品；关闭来源并重开后，原 PMC 文档、检索和报告仍可读，旧 55 条非设置记录摘要未变。官方 bioRxiv [版本地址格式](https://www.biorxiv.org/about-biorxiv)与既有固定地址一致，但本次没有取得 PDF 字节。

验证：无产品源码变更，因此未重复全量回归或构建；浏览器、Pi、Docker 和 PDF 解析因无可用 PDF 跳过。必要机器摘要见 [evidence.json](evidence.json)，原始请求和任务记录留在本地 `.validation/biorxiv-original-pdf/`。
