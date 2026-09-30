# 本批验收：含任务授权与报告的真实科研库异址恢复

范围：对本机已完成的科研库做一次离线 CLI 备份、校验与异址恢复。源库含两项 Task DiscoveryGrant、真实 Crossref PaperRead、DocumentVersion、已采纳 Claim、报告、导出包和原生 Pi 会话。沿用现有 PR14 备份/URI 迁移机制；不启动新 Pi、Docker、浏览器或外部 HTTP，恢复副本保持离线，不重做旧 A→B→C 验收。

1. **成功备份。** 在确认源控制器及作业均已终态后，CLI `backup create/verify` 产生可核对清单，固定数据库、Artifact 和原生会话；`access.token`、模型配置与 SSH 私有目标不入包。源库记录及实体字节不变。
2. **隔离恢复。** CLI 对不存在的新目录执行 `backup restore --relocate`；重开后按原 ID 回查 Task/Attempt/Grant、永久 HTTP 计次、PaperRead、DocumentVersion、两项 Evidence、Claim、报告和导出包，摘要及内容与源库相同，报告保持当前有效。
3. **失败边界。** 目标已存在或备份清单无效时恢复拒绝，不覆盖既有目标或更改源库；未知/越界引用仍由现有校验拒绝。不通过恢复重新提交任务、HTTP 请求、模型或 Run。
4. **历史与交付。** 源库与恢复副本关闭重开后，原生会话字节、全部既有记录和必要 Artifact 摘要保留；副本不与源库同时作为活动控制器。只交付简短结果和机器证据，原备份留忽略目录。无产品代码改动时复用上一批已完成的全量回归、干净构建和独立复核，前端不验。
