# PMC OA 表格行文字进入固定派生全文：本批验收条件

1. 所有者显式重新获取 PMID `34285670` 的 PMC OA 全文时，仍先核对 PMID/PMCID、开放获取标记和许可，并保存 JATS 原始 XML；新的派生文本按来源顺序保留表标题与表格行的单元格文字，使现有真实样本中的 `Embase / Ovid / Subscription-based / Indexed database / Health, biomedicine, pharmacology` 能被检索。两次 EFetch 均计量，仍标明来源文本、无 PDF 页码；不推断 `rowspan`、`colspan` 或科学结论。
2. 异常 XML、身份或许可不符、来源关闭和请求额度不足继续拒绝发布；原有非表格段落不因表格处理重复或丢失。仅提取可读文字，不执行表格内链接、脚本或文件路径。
3. 此次获取生成新 `DocumentVersion`，不改写旧 PMC 原文、旧语料命中、已生成报告/包或之前失败任务；关闭来源并重开后新旧版本仍按各自摘要回查，跨项目读取拒绝。
4. 浏览器一次从新文档进入显式本地语料、用上述表格词项查到来源片段并返回确切新版本；不触发 Pi、Docker 或 PDF 解析，前端布局不调整。
