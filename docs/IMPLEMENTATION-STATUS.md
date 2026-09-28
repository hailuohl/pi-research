# 实施状态

目标保持完整：依据原优化实施计划，基于 v0.3.1 完成真实科研闭环与 PR01–14。按用户最新要求，改为[按用户流程交付](DELIVERY-FLOWS.zh-CN.md)。首条“读取指定源码→真实 Pi 实现→开发测试→独立审查→批准整合→正式运行→结果回查”已通过本机浏览器真实验收；这不等于 PR01–14 全部完成。每批先固定验收，开发只跑相关测试，集成末尾统一验证和审查；非阻断发现不扩大本批。

| 关卡 | 当前状态 | 仍需完成 |
|---|---|---|
| PR01 | 构建、固定来源、双版回归、SDK 契约、无依赖启动已验；智谱真实工具调用及首条科研闭环已验 | 更广任务与环境仍需逐项验收；上游 M0 页面基线仍为空 |
| PR02 | 101 个统一 Registry 动作契约；文献、技能、固定文稿与独立批准构建共用受控接口 | 前端全面类型消费随 PR09，不能以单条旅程替代所有传输及边界场景验收 |
| PR03 | 指定版本/CAS、范围读取、文件差异、工作区与团队来源绑定、撤销及回滚检查通过；真实 Pi 从指定二阶来源实现，一阶项目副本保持不变 | 跨进程硬崩溃后的文件系统与数据库对账随 PR05/07完善 |
| PR04 | SandboxJob/DevelopmentTask、固定容器 Python、隔离/取消/服务关闭/worker 恢复与源码绑定已验；浏览器人工审批、首次失败、同原生 Pi 会话修复及重新批准后 5/5 开发测试已实测 | 宿主硬配额、自动清理及更广目标环境随后续关卡 |
| PR05 | 显式启用受管项目 Git、独立 worktree、完整源码差异/模式、提交与持久回执恢复已接入；工作台私有源码入口及测试/审查/提案/Git/CAS 关联已进入首条闭环 | 完整并发/迁移矩阵进一步验收；本条闭环不代表 PR05 所有场景已完成 |
| PR06 | trusted-example 与 Docker 真实适配器已接入；非白名单 Python 正式 Run、单独批准、归档及不重复恢复已实测 | GPU/其他目标另验；当前只证明本机 Linux CPU Docker 路径 |
| PR07 | 共享计算队列覆盖正式/开发/文档解析/文稿构建；Worker 槽位、资源配置、有界日志及事件恢复已验。文稿 worker 同容器恢复、取消和共享额度已实测；文献未知网络请求不自动重放 | HTTP 请求级全局限流、其余历史实体分页/虚拟化、原生 Pi 记录恢复预检与完整性能迁移、硬磁盘配额和其他目标仍待验 |
| PR08 | Root Pi 与另一个真实 Pi reviewer 完成独立审查闭环；Worker 持久槽位、实际退出后释放及项目/团队并发边界已验 | 完整有界授权、资源与故障矩阵，以及单/多 Agent 效益对照；一次审查通过不证明多 Agent 收益 |
| PR09 | 实现/测试/审查/整合、报告引用、调度、日志、文献及页段回跳已实测；文稿编辑/批准/PDF、报告精确回跳和绘图代码/CSV 原文回查已验，桌面/390px 与报告刷新恢复通过 | 浏览器下载实际落盘和本地文件选择器尚未验收；文稿页码刷新回第 1 页。本批未单独采集 console errors；完整类型/构建迁移、大历史列表及其他页面仍保留 |
| PR10 | 核心流程已验：四源实网成功、PubMed 网络失败单列；不可变 DocumentVersion、arXiv v1/v2、v1 隔离解析 15 页及页段回查完成。中文/扫描页、共享配额、恢复留证；文档证据已进入固定报告和离线包 | PubMed 环境、OpenAlex/bioRxiv 原 PDF 实网、自动结构抽取、完整跨源分页/覆盖评估、显式文档语料及 Agent 细粒度文档授权仍待完成 |
| PR11 | 技能审阅/撤销、固定 bundle、能力预检和回滚已实现；内置旧发行29文件归档、显式升级/精确回滚及旧复合包读取已验，真实IPC证明在途与Host重开保持旧版；paper/reports指导已更新，latex预检可用，先前真实Pi/容器生成PNG/CSV | 原生 UI 上传、二进制资源、完整 diagram/paper 工作流、其余指南更新、其他后端和大历史分页仍保留。先前 Pi 会话保存代码/请求后 aborted，不伪称会话成功完成；本批升级未调用模型 |
| PR12 | 固定报告/PDF 页段、不可变文稿、隔离三引擎/Bib 构建、错误定位/PDF 预览已验；文稿 PDF/源文件/图形源码与同作业数据进入报告成果包，实际解包逐字节核对；原 Run 指标/来源和旧报告兼容 | 完整论文写作、图形逐点数值关系及更多模板/diagram 能力仍待完成；执行来源关联不等于科学数值证明。未发布到远端 |
| PR13 | 待实施 | SSH→Slurm 等真实后端、远程工作台，按目标分别验收 |
| PR14 | 待实施 | 迁移/完整备份、显式发布、同步冲突、桌面和团队分发；SQLite 备份之外还需验证独立 CAS 与原生会话文件 |

最近证据：[内置技能升级与历史绑定回查](acceptance/flow-builtin-skills/RESULTS.zh-CN.md)、[旧项目与字节比对](acceptance/flow-builtin-skills/live-evidence.json)及[真实 IPC](acceptance/flow-builtin-skills/ipc-evidence.json)。旧668发行14模块、29文件与原提交一致；新2a5141发行只更新paper/reports。浏览器升级、精确回滚、再次升级时保留自定义v1，旧原生会话保持原70f72324包，新会话显式paper固定ec658764；刷新/390px路径通过。

内置升级批次全量 **576 pass / 0 fail / 22 skip（共598）**；之后旧配置回执兼容修复相关 **8/8**，实际 **3 条旧回执原样回放**。最终干净构建 **371 个文件一致**，独立复核无未解决阻断。真实IPC证明在途及Host重开保持旧版、未知包fork前拒绝；重试与损坏拒绝由领域测试另证。副本初缺5个相对CAS文件被正确拒绝，补入原始摘要字节后通过。原库95条记录未改，副本94条旧记录不变，唯一配置记录按显式操作变化，原生Pi文件摘要保持不变。本批无新模型调用或编译。

上一批[固定文稿进入报告与离线成果包](acceptance/flow-publication-report/RESULTS.zh-CN.md)、[实际解包](acceptance/flow-publication-report/live-evidence.json)与[浏览器回查](acceptance/flow-publication-report/browser-evidence.json)保留。报告 `134330d1…` 绑定原文稿/构建/PDF、绘图脚本和同作业 CSV，200,914 字节包实际解包 25 个条目，23 个固定文件与原字节一致；桌面/390px、精确文稿回跳与刷新通过。

文稿交付批次统一回归 **563 pass / 0 fail / 22 skip（共 585）**；之后 CSV/TSV 预览修复相关 **22/22**，最终干净构建 **368 文件一致**。固定批准身份 P2 已修复并独立关闭，CSV 回查修复亦复核通过。主验收原 91 条记录不变；旧真实 Run 报告在备份上仍 verified/current，173 条旧记录保持原字节。单独撤销副本证明历史可读、新报告/新导出拒绝。本批无新模型请求、重新编译或远端发布。

上一批[固定文稿、隔离构建与错误回查](acceptance/flow-publication/RESULTS.zh-CN.md)、[真实构建](acceptance/flow-publication/live-evidence.json)与[浏览器](acceptance/flow-publication/browser-evidence.json)保留。缺图真实失败准确定位 `main.tex:13`；保留中间中文溢出版本，修订断行后生成 2 页、35,395 字节、3 轮收敛的[实际 PDF](acceptance/flow-publication/compiled-document.pdf)。固定图形绑定此前 Sandbox 来源，未冒称正式 Run 或科学结果；批准失效的历史 PDF 保持原字节。

文稿批次统一回归 **546 pass / 0 fail / 22 skip（共 568）**，最后能力目录元数据修正后相关 **17/17**；最终干净构建 **368 个 dist 文件一致**。最终镜像 18 个实际探针、前一镜像同容器恢复/共享额度/取消与超时分别留证，独立复核无本批阻断。旧 52 条记录不变，新增模型请求 0。XeLaTeX 中文已验；Lua 中文字体在 768 MiB 下被杀并准确失败。输出监控不是宿主硬磁盘配额。

上一批[技能审阅、固定版本与启动预检](acceptance/flow-skills/RESULTS.zh-CN.md)、[真实 Pi/容器记录](acceptance/flow-skills/live-evidence.json)与[真实 IPC](acceptance/flow-skills/ipc-evidence.json)保留。v1/v2 ZIP 经 CLI 导入，浏览器审阅/启用/选择、配置回滚与撤销通过；原生文件选择器提交尚未确认。真实 Pi 保存 v1 代码与批准请求后 aborted；保存的固定作业经浏览器批准后成功且完整，生成 480×320 PNG、21 点 CSV，源码/产物摘要和数值独立核对。撤销后的新会话 generation=0、Worker/model records=0。

技能批次统一回归 **521 pass / 0 fail / 3 skip**；随后新增真实 IPC **1/1**，无产品源码变化。干净构建 **352 个 dist 文件一致**。原生 SDK `/skill:` 绕过摘要读取的 P2 已关闭并经真实离线 SDK/独立复核；旧 78 条文档记录保持不变，历史报告仍 current/verified。完整 PR11 与论文执行器没有因此宣称完成。

上一批[PDF 页段进入报告与交付](acceptance/flow-document-report/RESULTS.zh-CN.md)、[真实包核验](acceptance/flow-document-report/live-evidence.json)及[浏览器](acceptance/flow-document-report/browser-evidence.json)保留。报告 `604044d4…` 保留原 PDF、来源/许可、解析与精确区间，浏览器 v1 和中文页段回跳/刷新通过；1,303,750 字节成果包实际解包 11 个条目，9 个固定文件字节一致。原 57 条文档记录未改；旧真实运行报告在备份库中仍 current/verified。

文档报告批次最终统一回归 **501 pass / 0 fail / 3 skip**；干净安装/构建/类型检查通过，**339 个 dist 文件一致**。二进制随机路径误报已修复；可读宿主路径和凭据仍拒绝，有限检测边界留证。独立只读审查无本批阻断。没有新增模型调用、PDF 解析或远程发布。

上一批[文献任务、固定原文与页定位](acceptance/flow-documents/RESULTS.zh-CN.md)、[五源实网](acceptance/flow-documents/provider-evidence.json)、[容器](acceptance/flow-documents/parser-runtime-evidence.json)及[浏览器与原件核验](acceptance/flow-documents/browser-evidence.json)保留。真实 arXiv v1/v2 分别保存，v1 解析 15 页且内容版本标记匹配；v2 尚未解析。浏览器完成批准解析、页图回查、中文证据 `[38,41)` 精确回跳及刷新恢复。固定原件、36 个页产物与三条证据通过摘要核验；schema 1/2/3→1/2/3/4/5 的备份迁移保持 173 条旧记录字节不变。

文献批次统一回归 **490 pass / 0 fail / 3 skip**；之后精确区间 UI 修复另经相关 **13 项、15 项**及浏览器复核，没有重复无关全量。最终干净安装、构建与类型检查通过，**339 个 dist 文件完全一致**。首次解析及首次全量失败的原因和修复留证，独立审查的两项阻断已关闭。本批没有新增模型调用。PubMed 请求在 HTTP 响应前失败；未知图表结构/OCR、未完成报告来源链均明确展示，未称 PR10 全部完成。

上一批[长任务日志与断线恢复](acceptance/flow-events/RESULTS.zh-CN.md)、[真实执行](acceptance/flow-events/runtime-evidence.json)、[浏览器记录](acceptance/flow-events/browser-evidence.json)及[规模/查询计划](acceptance/flow-events/performance-evidence.json)保留。Docker 正式和开发日志各 1,595,543 字节，跨页 UTF-8 读取与原始摘要一致。关闭控制器后恢复同容器，未重复启动。浏览器验证有界回查、两流、按需展开及实际服务断连/重连；两个明确标注的 IPC 夹具验证切会话、刷新及最终消息替换，不冒充新模型调用。173 条旧记录在独立备份迁移中全部字节不变。

日志批次最终统一回归 **463 pass / 0 fail / 3 skip**，真实 Docker 日志/恢复 **1/1**；独立复核无当批阻断。干净安装、构建与类型检查成功，**311 个 dist 文件完全一致**。Host UTF-16 截断边界作为非阻断项保留；页面已明确标示新发生的内容截断。该批没有新增真实模型请求。

上一批[资源调度验收](acceptance/flow-scheduler/RESULTS.zh-CN.md)、[真实执行](acceptance/flow-scheduler/runtime-evidence.json)、[浏览器记录](acceptance/flow-scheduler/browser-evidence.json)及[规模/查询计划](acceptance/flow-scheduler/performance-evidence.json)保留。两控制进程共享 1 核预算，正式 Run 运行时开发测试排队；控制服务重开后保持同一容器，随后两项成功且完整。浏览器显式配置、等待与释放、结果回查、刷新及 390px 键盘操作通过。迁移前备份保留，旧 145 条记录中 144 条字节不变，1 条原 Git 租约正常续期；历史源码/批准/Run/报告不改写。

资源调度批次最终统一回归 **441 pass / 0 fail / 3 skip**；正式 Docker live **8/8**、开发 Docker live **12/12**、共享调度 live **1/1** 通过。首次开发 live 测试在关闭 Host 后缺少持续驱动，已只修等待循环并重跑，失败证据保留。两项 P2 修复并独立复核关闭；当批干净构建 **303 个 dist 文件完全一致**。Worker 验证使用标明的真实 IPC 子进程 fixture，没有新增模型调用，不把 Worker 上限当作 HTTP 并发或账单上限。

上一批[报告回查与离线交付](acceptance/flow-report/RESULTS.zh-CN.md)、[执行证据](acceptance/flow-report/live-evidence.json)及[浏览器证据](acceptance/flow-report/browser-evidence.json)保留。真实浏览器从 Run `ca819399…` 生成报告 `28b4360a…`，已验证指标定位与原始 metrics、固定 `main.py`、开发测试 `0748…` 的 stderr 和独立审查 `4b2e…`。准确 Run 跳转、刷新恢复与 390px 键盘通路通过，console errors=0。

本地[成果包](acceptance/flow-report/research-result.tar.gz)为 **17,148 字节**，SHA-256：`6d30ce67b4ecfc24235947e52233adaf0f134d5cc8ccdd575af67d2e0948dd0d`。真实解包的 **20 个文件**与清单及当前固定引用逐字节一致；仅本地交付，未远程发布。

报告批次统一全量在当批 P2 收口修复前完成：**413 pass / 0 fail / 3 skip**。宿主路径导出 P2 修复后，受影响报告/导出 **14 项**及 HTTP/schema **9 项**通过，未重复无关全量；当批 clean build **290 个文件完全一致**。P2 已只读复核关闭，但有限敏感内容/宿主路径检测不保证识别任意混淆编码。

上一批[实现、测试与独立审查闭环](acceptance/flow-implementation/RESULTS.zh-CN.md)及[真实执行记录](acceptance/flow-implementation/live-evidence.json)保留当时的 395/0/3 与 280 文件构建结果。固定模型为 `zai-coding-cn / glm-5.3`，正式 Run 实测 MSE 为 `0.000050345031695457565`；候选 `b8f9aaa5…` 在测试、审查、提案和 Run 中一致，项目 degree=1 文件未修改。

[正式运行与结果回查](acceptance/flow-run/RESULTS.zh-CN.md)、[源码准备与真实 Pi](acceptance/flow-source/RESULTS.zh-CN.md)、[PR04](acceptance/pr04/RESULTS.zh-CN.md)、[PR03](acceptance/pr03/RESULTS.zh-CN.md)、[PR02 首批](acceptance/pr02/RESULTS.zh-CN.md)和[PR01](acceptance/pr01/RESULTS.zh-CN.md)保留当时结果。首条真实旅程通过，不意味着整体计划完成，也不凭示例指标宣称科学发现。

下一批推进新版论文技能的真实写作、编译与审查链。PR07 其余并发/历史分页等保留，不继续围绕已完成页面打磨非阻断细节。PR01–14 原范围全部保留，包括 PR08 多 Agent 效益、PR09 完整迁移、PR10 剩余文献能力、PR11 剩余技能能力、PR12 论文、PR13 远端及 PR14 分发。

尚待核验：浏览器下载事件按 5 秒有界等待仍超时，本地下载路径未确认；上述服务端验证包已保存，可直接本地交付。远端/GPU 仍缺环境。浏览器坐标点击错位已用原生键盘完成，不作为产品功能缺失。非阻断后续项：reviewer 摘要误将空 stdout 归为 stderr；原始 stderr 确有 5 tests / OK，后续改进精确引用，本批不重做审查。
