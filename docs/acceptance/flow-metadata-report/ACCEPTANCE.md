# 本批验收：固定 DOI 元数据进入可回查报告

范围：复用已验收的 Task PaperRead 与 DocumentVersion，所有者经现有后端 API 登记两个精确元数据片段、审阅一条仅关于 DOI/题名的 Claim，并生成和导出固定报告。不重新获取论文、不运行模型/计算，不把元数据当论文全文或科学结果。现有接口能完成时不改产品代码。

1. **成功路径。** 从同一 DocumentVersion 的原始 Crossref 响应与派生元数据中各登记一个精确片段；Claim 同时引用两项 Evidence，限制写明“书目元数据、未读全文”。所有者采纳后创建报告和本地成果包，报告引用回到原 Evidence/Artifact 的 ID 与摘要。
2. **失败边界。** 错误项目、无效文本区间或未采纳 Claim 不能形成有效报告；不接受将 `metadata` 伪装为全文或已知 PDF 页码。失败不改写原 Task、PaperRead、DocumentVersion 或外部请求记录。
3. **来源与导出。** 导出包内有报告、两项 Evidence 的精确引文以及原始/派生元数据的确切字节；包含 DOI/题名和来源限制，不包含密钥、原生对话或未获准私有数据。本批网络请求、模型用量和 Run 数量均不增加。
4. **重开与历史。** 关闭重开后报告/包、Claim、Evidence、DocumentVersion、Artifact 仍按原 ID/摘要可读且有效；原 Task/Attempt/Grant/原生会话字节保留。只验后端关键路径；若无需产品代码改动，复用上批全量回归/干净构建证据并做本批针对性核对。
