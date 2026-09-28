# 实施状态

目标保持完整：依据原优化实施计划，基于 v0.3.1 完成真实科研闭环与 PR01–14。按用户最新要求，改为[按用户流程交付](DELIVERY-FLOWS.zh-CN.md)。首条“读取指定源码→真实 Pi 实现→开发测试→独立审查→批准整合→正式运行→结果回查”已通过本机浏览器真实验收；这不等于 PR01–14 全部完成。每批先固定验收，开发只跑相关测试，集成末尾统一验证和审查；非阻断发现不扩大本批。

| 关卡 | 当前状态 | 仍需完成 |
|---|---|---|
| PR01 | 构建、固定来源、双版回归、SDK 契约、无依赖启动已验；智谱真实工具调用及首条科研闭环已验 | 更广任务与环境仍需逐项验收；上游 M0 页面基线仍为空 |
| PR02 | 58 个统一 Registry 动作契约；报告创建、核验、类型化引用读取和离线导出已接入，测试/审查/整合进入真实浏览器闭环 | 前端全面类型消费随 PR09，不能以单条旅程替代所有传输及边界场景验收 |
| PR03 | 指定版本/CAS、范围读取、文件差异、工作区与团队来源绑定、撤销及回滚检查通过；真实 Pi 从指定二阶来源实现，一阶项目副本保持不变 | 跨进程硬崩溃后的文件系统与数据库对账随 PR05/07完善 |
| PR04 | SandboxJob/DevelopmentTask、固定容器 Python、隔离/取消/服务关闭/worker 恢复与源码绑定已验；浏览器人工审批、首次失败、同原生 Pi 会话修复及重新批准后 5/5 开发测试已实测 | 宿主硬配额、自动清理及更广目标环境随后续关卡 |
| PR05 | 显式启用受管项目 Git、独立 worktree、完整源码差异/模式、提交与持久回执恢复已接入；工作台私有源码入口及测试/审查/提案/Git/CAS 关联已进入首条闭环 | 完整并发/迁移矩阵进一步验收；本条闭环不代表 PR05 所有场景已完成 |
| PR06 | trusted-example 与 Docker 真实适配器已接入；非白名单 Python 正式 Run、单独批准、归档及不重复恢复已实测 | GPU/其他目标另验；当前只证明本机 Linux CPU Docker 路径 |
| PR07 | 待实施 | 查询索引、事件恢复、配额调度、有界日志和性能证据 |
| PR08 | Root Pi 实现与另一个真实 Pi reviewer 会话完成一次独立审查闭环，明确 verdict 与必需证据绑定 | 完整有界授权、资源与故障矩阵，以及单/多 Agent 效益对照；一次审查通过不证明多 Agent 收益 |
| PR09 | 实现/测试/审查/整合闭环与报告引用回查已实测；报告精确 Run 跳转、刷新恢复和 390px 键盘通路通过，浏览器 console errors=0 | 浏览器下载实际落盘仍未确认；完整类型/构建迁移及其他页面仍保留 |
| PR10 | 待实施 | 五源实网、DocumentVersion、原始 PDF/页定位 |
| PR11 | 待实施 | 技能导入审查、固定、回滚、能力预检与真实产物 |
| PR12 | 不可变 Markdown、固定引用清单、失效状态核验、指标/源码/测试/审查回查及本地 tar.gz 成果包已实测 | 论文写作、隔离 LaTeX/PDF 构建及原计划其他范围仍待完成；未发布到远端 |
| PR13 | 待实施 | SSH→Slurm 等真实后端、远程工作台，按目标分别验收 |
| PR14 | 待实施 | 迁移/备份、显式发布、同步冲突、桌面和团队分发 |

最近证据：[报告回查与离线交付](acceptance/flow-report/RESULTS.zh-CN.md)、[执行证据](acceptance/flow-report/live-evidence.json)及[浏览器证据](acceptance/flow-report/browser-evidence.json)。真实浏览器从 Run `ca819399…` 生成报告 `28b4360a…`，已验证指标定位与原始 metrics、固定 `main.py`、开发测试 `0748…` 的 stderr 和独立审查 `4b2e…`。准确 Run 跳转、刷新恢复与 390px 键盘通路通过，console errors=0。

本地[成果包](acceptance/flow-report/research-result.tar.gz)为 **17,148 字节**，SHA-256：`6d30ce67b4ecfc24235947e52233adaf0f134d5cc8ccdd575af67d2e0948dd0d`。真实解包的 **20 个文件**与清单及当前固定引用逐字节一致；仅本地交付，未远程发布。

本批统一全量在 P2 收口修复前完成：**413 pass / 0 fail / 3 skip**。宿主路径导出 P2 修复后，受影响报告/导出 **14 项**及 HTTP/schema **9 项**通过，未重复无关全量；最终 clean build **290 个文件完全一致**。P2 已只读复核关闭，但有限敏感内容/宿主路径检测不保证识别任意混淆编码。

上一批[实现、测试与独立审查闭环](acceptance/flow-implementation/RESULTS.zh-CN.md)及[真实执行记录](acceptance/flow-implementation/live-evidence.json)保留当时的 395/0/3 与 280 文件构建结果。固定模型为 `zai-coding-cn / glm-5.3`，正式 Run 实测 MSE 为 `0.000050345031695457565`；候选 `b8f9aaa5…` 在测试、审查、提案和 Run 中一致，项目 degree=1 文件未修改。

[正式运行与结果回查](acceptance/flow-run/RESULTS.zh-CN.md)、[源码准备与真实 Pi](acceptance/flow-source/RESULTS.zh-CN.md)、[PR04](acceptance/pr04/RESULTS.zh-CN.md)、[PR03](acceptance/pr03/RESULTS.zh-CN.md)、[PR02 首批](acceptance/pr02/RESULTS.zh-CN.md)和[PR01](acceptance/pr01/RESULTS.zh-CN.md)保留当时结果。首条真实旅程通过，不意味着整体计划完成，也不凭示例指标宣称科学发现。

下一批建议按原 P1 优先级推进 PR07 可靠性/配额/事件及 PR10 前置长任务能力，先固定“资源调度：明确排队、容量和恢复”的用户流程验收，不继续围绕主闭环打磨非阻断微小 UI。PR01–14 原范围全部保留，包括 PR08 多 Agent 效益、PR09 完整迁移、PR10 文献、PR11 技能、PR12 论文、PR13 远端及 PR14 分发。

尚待核验：浏览器下载事件按 5 秒有界等待仍超时，本地下载路径未确认；上述服务端验证包已保存，可直接本地交付。远端/GPU 仍缺环境。浏览器坐标点击错位已用原生键盘完成，不作为产品功能缺失。非阻断后续项：reviewer 摘要误将空 stdout 归为 stderr；原始 stderr 确有 5 tests / OK，后续改进精确引用，本批不重做审查。
