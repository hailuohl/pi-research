# bioRxiv / PubMed 显式续页与 alphaXiv 覆盖边界

同一文献任务流程现可对 bioRxiv（经 OpenAlex）和 PubMed 单来源默认关键词结果显式取下一页。客户端仍只提交前页结果 ID；服务端固定查询、日期、上限、来源及游标。PubMed 每个非空页的 ESearch 与 EFetch 分别计次、去重和校验，缺失 PMID 不发布部分或空结果；只访问[官方规定的前 10,000 条窗口](https://www.ncbi.nlm.nih.gov/books/NBK25499/)，偏移页不会把当前来源索引冻结成完整快照。alphaXiv 当前数组接口没有已验证的续页契约，页面明确写出有限候选窗口，不造下一页或“已穷尽”。

真实浏览器验收：bioRxiv 的一次第一页请求收到 HTTP 429，失败任务和 1 次计量保留，未重试、未发布结果。PubMed 随后实际完成 `cancer` 第一页→第二页，两页各 8 条、第二页 8 个新 PMID，ESearch/EFetch 共 4 次 HTTP；项目总计 5 次。关闭 PubMed 后下一页请求返回 `CONNECTOR_SETTINGS_CHANGED`，没有新增 HTTP；刷新后两页及 bioRxiv 失败记录仍可回查。结果是元数据/摘要，不是原 PDF 或科学结论。[机器证据](evidence.json)仅保留摘要，截图和原日志留本机 `.validation/remaining-source-pagination/`。

bioRxiv 实网成功分页仍待来源限流解除后新的显式尝试；alphaXiv 深分页及跨来源完整覆盖评估没有冒充完成。原 PR01–14 其余范围继续推进，前端布局与 PR14 桌面/团队协作暂缓。本批没有调用 Pi 或 Docker。

相关后端 40 项（含并发/失联 2 项）及 HTTP/UI 12 项通过；集中全量 813 项中 791 通过、22 跳过、0 失败；隔离干净安装、构建和类型检查通过，453 个构建文件一致。独立复核发现的 PubMed `retmax` 回显误拒短末页风险已删除冗余检查并定向复核，无剩余阻断。
