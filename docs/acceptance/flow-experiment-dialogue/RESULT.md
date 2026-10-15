# 实验由研究对话安排

2026-10-02。用户描述实验目标后，主Pi读取固定配置、创建完整参数候选、准备冻结运行意向。确认卡放在原对话，必要批准后发送同一意向的普通用户续接消息，由Pi调用run_submit及结果/日志工具。“实验与运行”撤下手工新建、派生、准备/提交、可写配置和授权表单，保留树、真实历史、只读参数、日志、取消及原会话回跳兼容。

验收条件：

1. 参数由智能体准备；experiment_plan_submit保持完整config替换语义，expectedParentRevision在writer事务内核验。新代码仍须开发测试、审查及批准整合，不能用参数草案代替实际代码交付。
2. 普通run_prepare以可信context写顶层rootSessionId，manifest/hash不改；提交和重放前验证普通意向所属根会话。Grant仍按原Task/模型/冻结集合身份，不能借归属绕过原授权。
3. 对话中确认固定intentId/digest后续接；审批成功而消息入队失败保留卡并复用消息幂等key。跨项目/会话回调不发指令；拒绝/失效不建替代意向。project_inspect仅索引当前交互根意向20项，hasMore提示，runIntentId可精确回查。
4. 实验页以树/历史为主，重开后原运行与来源保留，原队列与取消/取证路径不回归。

参数/来源、权限/Grant及工具相关48项通过；HTTP与固定Pi SDK本机SSE完整链路通过，实际Pi依次读取配置、新建候选、准备意向、等待owner确认后提交唯一Run，再按后续对话读取实测指标和日志。未调用远端供应商。独立Astra发现run_prepare USER缓存遗漏selected-root身份及legacy alias；加入request.rootSessionId并禁止有归属请求认领旧无归属回执，同根重放/跨根冲突/legacy保留测试通过，相关修复18项通过。前端相关27项通过。

集中962项中938通过、23跳过，唯一失败是移除管理表单时一并删掉了旧Experiments.onSession回跳兼容。恢复仅回调契约、未恢复管理入口，保留原测试，39项受影响UI回归通过。最终496份干净构建输出一致，类型检查通过。Astra限定复核关闭原阻断；独立Sol复核回跳兼容无阻断。按批次规则未重复无关全量。

浏览器实际确认卡、Pi提交、真实受信数值Run、日志/指标和树图更新通过；只读配置无保存按钮，完成后重开保留结果且确认提交按钮为0。390px/1280px无外层横向溢出，控制台0错误。验收预览仅本机固定SSE模型和随包确定性数值程序，1个真实Run成功/完整，mse=0.000446210591122142；不是科学优势或其他供应商/Runner的证明。原研究数据未删除，既有模型作业未重启。

旧活动无归属意向只由明确活动成员关系回查，不能覆盖另一producer根的普通归属；有效当前根RunGrant采用其原执行身份。Task-bound Grant卡只读。RunGrant管理仍userOnly，后台事件不直接启动不受限Pi；未完成时报告状态，结束后分析由正常后续对话请求。

[机器证据](evidence.json)。原日志与截图在.validation/experiment-dialogue/，最终构建在.validation/clean-build-q8pJ7y/。视觉复核见[design-qa.md](../../../design-qa.md)。
