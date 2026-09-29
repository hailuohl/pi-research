# OpenAlex 显式下一页

用户现在可以在文献检索页启用 OpenAlex，提交单来源默认关键词检索，查看固定第一页，再显式取得下一页。沿用既有持久任务、来源开关和 HTTP 计次；客户端继续时只提交前页结果 ID，服务端冻结原查询、日期、上限及来源，并按[OpenAlex 分页契约](https://help.openalex.org/api/paging/)使用 `meta.next_cursor`。Crossref 原路径保持可用，DiscoveryGrant、agent 与多来源检索未被升级为 owner 分页权限。

真实浏览器与 OpenAlex 验收：`wine quality` 两页各返回 8 条元数据，第二页有 8 个新的 DOI 或 W ID，总计 2 次 HTTP。关闭 OpenAlex 后，下一页请求返回 `CONNECTOR_SETTINGS_CHANGED`，计数仍为 2；刷新后两页任务和结果仍可回查。异常游标、重复续页/重试、越界、额度或本地期限问题不会产生伪造空页或未获准的外发。截图和原日志留在本地 `.validation/openalex-pagination/`，本目录只交付[精简机器证据](evidence.json)。

本批只覆盖 owner 的 OpenAlex 单来源关键词/默认排序；游标期限是本地 4 分钟策略，不是来源保证。结果是元数据，未取得原 PDF，也不证明科学结论。bioRxiv、PubMed、alphaXiv 分页与完整覆盖评估、原 PR01–14 其他未完成范围继续后续；前端布局暂缓。

修复后相关连接器/任务检查 32/32、HTTP/UI 11/11；集中全量 797 项中 775 通过、22 跳过、0 失败；隔离干净安装、构建和类型检查通过，450 个构建文件一致。独立权限与恢复复核指出的 1 项阻断已修复，定向复核无剩余阻断。本批未重跑 Pi 或 Docker。
