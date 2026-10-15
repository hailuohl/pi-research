# PMC OA 表格行进入固定派生文本：本批结果

新增可用能力：新获取的 PMC JATS 全文可按原顺序保留表格行文字。真实 PMID `34285670` 的新 `DocumentVersion` 固定 `pmc-jats-text-v2`，可在本地语料检索到 `Embase / Ovid / Subscription-based / Indexed database / Health, biomedicine, pharmacology`，并回到确切新文档。原始 XML 与旧版同为 136,774 字节、摘要相同；派生文本摘要分别固定。仍无 PDF 页码，不推断跨行列或科学结论。

历史兼容：首次验收发现新算法误使旧报告变为 `PMC_SOURCE_INVALID`，失败副本保留。修复后旧 DocumentVersion **不补写标记**，沿原 v1 算法核验；新获取经 `paper-read` 显式冻结 v2。最终副本中旧报告刷新后保持 `verified/current`，新旧文档和搜索历史并存，旧 54 条非设置记录摘要未变。

剩余工作：本批只覆盖可读的行/单元格文字，不还原 `rowspan`、`colspan`、嵌套表格语义或 PDF/图结构。其他 PR01–14 缺口继续按一条用户流程分批推进；前端布局仍暂缓。

验证：真实获取两次 HTTP；浏览器完成新旧身份选择、表格词项检索、精确回跳与刷新。集成全量回归 837 通过、0 失败、22 跳过；必要兼容修复后最终干净构建及受影响的 50 项通过，独立复核无阻断。机器摘要见 [evidence.json](evidence.json)，原始响应和日志留在本地 `.validation/pmc-table-text/`。

代码提交：[c95b7746e92cc3733e9bbbdb65df4853addf145c](https://github.com/hailuohl/pi-research/commit/c95b7746e92cc3733e9bbbdb65df4853addf145c)，分支 `implementation/pr01-reproducible-baseline`；私有远端已核对包含该提交。
