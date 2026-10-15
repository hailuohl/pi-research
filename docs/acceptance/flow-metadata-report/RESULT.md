# 固定 DOI 元数据进入报告与成果包

已复用上一批真实 PaperRead 和 DocumentVersion：所有者从 Crossref 原始响应登记 DOI 原文片段，从派生元数据登记题名片段，并采纳一条仅关于两者书目关联的 Claim。报告 `8eda4fb0-f34a-47c7-8365-08156c6c3dbd` 当前完整且有效；本地成果包含 `report.md`、清单和两份按原摘要命名的确切 Artifact 字节。报告明确注明只核对书目元数据，未读全文，也未验证论文科学结论。

错误项目、越界文本区间和未采纳 Claim 均未形成有效报告；`metadata` 文档请求 PDF 解析返回 `DOCUMENT_NOT_PDF`，未生成作业。关闭重开后，报告、两项 Evidence、Claim、导出包及原 DocumentVersion 可按原 ID/摘要读取，7 条旧记录和原生会话字节不变；网络请求、模型用量和 Run 均无新增。[机器证据](evidence.json)仅保存 ID、摘要和状态。验收脚本最初漏处理 tar 条目的 `./` 前缀，随后只读现有导出回执完成核对，没有重提交报告或导出。

本批未改产品代码，沿用上一批 [文档转换](../flow-paper-document/RESULT.md)在提交 `a9af1ab` 上的全量回归、干净构建和独立复核。当前报告通过 Evidence/Artifact 固定原始及派生字节；跨项目自包含的 DocumentVersion 快照仍属后续范围。前端布局和 PR14 桌面/团队协作继续暂缓，其余 PR01–14 按原计划推进。
