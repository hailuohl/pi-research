# 本批验收：文献任务按已知 DOI 精确读取元数据

范围：所有者为一项尚未派发的 `literature` Task 冻结一个 Crossref DOI 的 `provider-text` 读取，沿用 Task DiscoveryGrant、Team 独立批准、ConnectorCall 永久计次和现有 Crossref `/works/{doi}` 精确入口。只交付这条后端流程；不扩展到其他来源、全文、前端或新额度系统。

1. **冻结与批准。** Task Grant 仅允许一个规范化的 Crossref DOI 目标、零检索、一次 HTTP、固定响应字节上限和到期时间；原 Team 计划、TaskSpec、角色、模型和两份批准身份保持绑定。Grant 与 Team 分别批准前，不启动模型或网络。
2. **真实精确读取。** 获准 Task 的实际 Session/Attempt 对批准 DOI 调用 `paper_read`，只外发一次 Crossref 精确地址；返回 DOI 必须等于目标。原始响应、元数据产物、PaperRead、ConnectorCall 和任务结果按同一 Grant 与尝试身份可回查，未取得全文或科学证据不冒称已验证。
3. **越界与失败。** 换 DOI/来源、借检索入口或其他 Task/会话、失去 Grant 标记、撤销/到期、Team 原批准或 TaskSpec 变化、额度耗尽，均在新增外发前拒绝。失败或未知请求占用这一次额度，不自动重试。上一批关键词 Task Grant、旧主协调会话 Grant 和未绑定任务的原行为保持兼容。
4. **重开与历史。** 关闭并重开控制对象后，同一 Task、Attempt、Grant、请求、资料原件和原生会话按原 ID/摘要可读；上一批不相关历史不改写。开发只跑相关检查，集成后一次全量回归、干净构建与独立权限复核；真实 Pi/HTTP 仅验这一条关键路径，前端不验。
