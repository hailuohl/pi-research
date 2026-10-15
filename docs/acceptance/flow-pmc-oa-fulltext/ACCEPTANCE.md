# PubMed PMID 到 PMC OA 全文：本批验收条件

1. 所有者显式选新格式 `oa-full-text` 请求 PMID `34285670`；服务端通过固定的 PubMed EFetch 核对 PMID→PMCID，再从 PMC EFetch 取得 `PMC8270360.1` 的 JATS XML。两次 HTTP 均计量；仅在原文确认同一 PMID/PMCID、开放获取标记和许可后，发布绑定原始响应摘要、来源版本与可读派生文本的 DocumentVersion，并标为 `provider-text`、无 PDF 页映射。
2. 非 OA、缺失或矛盾的 PMID/PMCID/版本/许可、异常 XML/实体、超限响应或来源关闭时，不发布可用全文；失败保留已发生的 HTTP 计数。旧 `provider-text` 摘要授权或工具调用不能暗中升级为新格式。
3. 关闭来源和重开后，已完成的 OA 原件与文本仍可按固定摘要读取；原 PubMed 摘要 DocumentVersion、既有检索及失败历史保持原身份，不重跑旧任务。跨项目读取拒绝。
4. 工作台可明确选择 OA 全文并回看原文/许可及“无 PDF 页映射”；本批不声称 PDF 页码、科研结论或自动再分发，也不调用 Pi 或 Docker。
