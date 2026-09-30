# 含任务授权和报告的真实科研库异址恢复

现有离线 CLI 已能备份并异址恢复最近完成的后端科研链：两项 Task DiscoveryGrant、真实 Crossref 请求与 PaperRead、DocumentVersion、Evidence/Claim、报告/成果包，以及两份原生 Pi 会话。源库空闲后执行 `backup create → verify → restore --relocate`，新副本保持离线；备份清单为 v2，11 个文件、434,169 字节，令牌和模型配置未打包。

恢复后逐条核对 **63 条记录**、4 个 Artifact 和 2 份原生会话的 ID 与摘要，全部与源库一致；两项 Grant 仍各永久计次 1 次，报告仍为 `current`。在恢复副本重放原文档转换与报告导出 Key，只返回原 DocumentVersion 和成果包 ID，未新增网络请求、模型调用或 Run。对已存在目标的恢复被 `BACKUP_TARGET_EXISTS` 拒绝，原库和恢复副本均未被覆盖。[机器证据](evidence.json)只保留摘要与状态，完整私有备份及日志仍在本机忽略目录。

本批覆盖**新增科研实体**在 PR14 离线异址迁移中的实际保留，不重做此前旧数据 A→B→C 验收，也不把恢复副本当第二活动控制器。当前仍限同平台、离线迁移；PR13 外部 SSH/Slurm 主机暂无，远程 live 项未验证，前端及 PR14 桌面/团队协作继续暂缓。

产品代码未改，复用此前 [PaperRead 转文档](../flow-paper-document/RESULT.md)提交 `a9af1ab` 的全量回归、干净构建与独立复核；本批新增的是实际备份、校验、恢复、重开及失败目标检查。
