# PaperRead 转为不可变文档版本

所有者现在可经公开后端操作 `document_from_paper`，把已有 PaperRead 直接固定为 DocumentVersion。真实验收使用上一批 Pi 读取的 Anscombe DOI 元数据：原始 Crossref 响应作为 `original`，已保存的元数据作为 `derivedText`，原 DOI、Task 与 DiscoveryGrant 归属继续可回查。文档明确为 `metadata`，物理页定位为 `unavailable`；没有冒称论文全文。

本机 HTTP 调用创建 DocumentVersion `79ddac00-bcd3-43eb-9f98-73d5e27b39dd`。同键重复得到同一 ID；同键换输入冲突，跨项目拒绝。转换没有新增外部请求、模型调用、Run 或 Artifact。关闭重开后文档及原始/派生字节可读，原 Task、Grant、PaperRead 等 9 条冻结记录与原生会话摘要未变。撤销后新转换拒绝、已完成文档保留由相关回归覆盖。

这完成的是 PR10 中“任务读取结果进入文档版本”的后端一步；其他来源、PDF 解析质量与原 PR01–14 的剩余范围继续按需分批。前端不在本批验收范围。精简机器证据见 [evidence.json](evidence.json)；原始日志与原生对话留本地 `.validation`。

验证：851 项通过、0 失败、22 项环境可选检查跳过；干净构建 471 个文件一致，独立权限与数据保留复核无阻断。
