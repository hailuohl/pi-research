# 本批验收：任务 PaperRead 转为不可变 DocumentVersion

范围：所有者把已完成的、受 Task DiscoveryGrant 约束的 Crossref `paper_read` 结果，通过公开后端操作转成一个不可变 DocumentVersion。沿用现有 `DocumentService.createFromPaper`、原始/派生 Artifact、同一批准身份与持久回执；不重新联网、运行模型或解析 PDF，不扩成新的文档导入框架。

1. **成功路径。** 所有者用确切 `paperReadId` 和 Idempotency-Key 调用公开操作，得到 `contentKind=metadata` 的 DocumentVersion。`original` 指向已存原始 Crossref 响应，`derivedText` 指向已存元数据，DOI、Task/Session、Grant、来源与原摘要可回查；本步网络/模型/Run 数量不变。
2. **越界与失败。** 非 owner、别的项目 PaperRead、被替换或损坏的原始/派生产物、失效授权，均不得创建新 DocumentVersion；无效输入在写入前拒绝。元数据不得被标为全文或已知 PDF 页码，失败不改写原 PaperRead。
3. **回执与撤销。** 相同 Key/输入返回同一 DocumentVersion；同 Key 不同输入冲突。Grant 撤销后禁止新的转换，已完成文档及原件仍可读取，不能通过重试复制新文档或新增外发。
4. **重开与历史。** 关闭重开后，同一 PaperRead、DocumentVersion、Artifact 字节与摘要、原 Task/Attempt/Grant/原生会话均保持；本批无新 Pi/HTTP/Docker。开发只跑相关检查，集成后一次全量回归、干净构建和独立权限/数据保留复核；前端不验。
