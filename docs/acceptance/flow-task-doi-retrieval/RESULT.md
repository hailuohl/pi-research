# 文献任务按 DOI 精确读取

所有者现在可为一项尚未派发的 `literature` Task 单独批准一个 Crossref DOI 的元数据读取：零检索、一次 HTTP、固定响应上限与期限。Grant 和 Team 分别批准后，真实任务才取得授权；上一批关键词 Task Grant 与旧主协调 Grant 继续可用。

真实 Pi 对 DOI `10.1080/00031305.1973.10478966` 只发出一条 Crossref 精确请求，返回题名 **Graphs in Statistical Analysis** 和相同 DOI。原始响应、元数据产物、PaperRead、ConnectorCall 与 Task/Attempt 均可按原 Grant 回查；任务结果明确标记 `metadata`、`fullTextRead=false`，没有把元数据当作论文全文或科学证明。错误 DOI/来源、混合授权、旧检索入口、身份或批准失效及额度耗尽的发送前限制通过相关检查；失败请求仍占用额度。

关闭服务并重开后，本次所有 ID、产物字节与原生会话可读，上一批 7 条冻结记录和原生会话摘要不变。全量回归 850 通过、0 失败、22 项环境可选检查跳过；干净构建 471 个文件与当前产物一致，独立权限复核无阻断。精简机器证据见 [evidence.json](evidence.json)；原始日志和原生对话留在本地 `.validation`。本批不验前端。

原 PR01–14 中其他授权范围、科研后端与缺少外部主机的远端验收继续按计划分批推进。
