# Pi Research 0.3.1-experimental

**可试用本地科研后端 · Pi 唯一 Agent 执行内核**

本开发副本基于 v0.3.1 按 [优化实施计划](docs/IMPLEMENTATION-PLAN.zh-CN.md) 持续推进。原 ZIP 保持冻结；版本号沿用源包身份，不代表新发布。当前进度见 [实施状态](docs/IMPLEMENTATION-STATUS.md)，证据见 [PR01](docs/acceptance/pr01/RESULTS.zh-CN.md)、[PR02 首批](docs/acceptance/pr02/RESULTS.zh-CN.md) 与 [能力矩阵](docs/reference-baseline/PR01.md)。

当前状态（2026-10-01文档核对）：[后端收口](docs/acceptance/flow-backend-readiness/RESULT.md)与用户授权拟定的[分组红酒试用](docs/acceptance/flow-wine-grouped-trial/RESULT.md)均已交付，本地后端阶段已完成，转入按需维护。[试用清单](docs/BACKEND-READINESS.zh-CN.md)列明入口、证据与限制。2026-10-02按用户新指示完成[前端布局重设计](docs/acceptance/flow-frontend-redesign/RESULT.md)：会话为主入口，辅助资料与成果从工作区工具打开，实验支持节点树图与列表。固定文稿、编译批准及最终报告仍沿用户操作；PR14桌面/团队协作暂缓；更多授权、远端、GPU与成果发布/同步按需求和环境触发，PR01–14长期范围保留。

历史目标（2026-09-29）：曾要求对齐OpenResearch前端，并把桌面分发及自建托管范围移出当时排期。该排期由上面的当前阶段目标取代；已有成果与在途改动继续保留。

多智能体模式在研究对话输入框旁切换，同一项目共享设置。开启后，主 Pi 从当前对话任务生成有界分工，用户批准后执行，结果回到原会话综合；关闭后停止新助手分配，已有结果保留。无需手填协作目标、任务 JSON 或预算。见[对话协作验收](docs/acceptance/flow-chat-collaboration/RESULT.md)。

由 0.3.0-experimental 独立派生。保留既有实验、审批、快照、协作、Campaign 与有效性修复；新增受管技能目录和五源文献接口。不是完整 OpenResearch 替代品，也不是所有后端已连接的生产系统。

## 启动

核心 Node.js ≥22.19.0；可重复开发构建固定 Node.js **24.19.0**、npm **11.17.0**。包内有 dist，运行核心无需先安装 npm 依赖。

```bash
node dist/apps/cli/index.js doctor
node dist/apps/server/index.js
```

前端由锁定的 React/ReactDOM 19.3.0 和真实类型声明构建，发布目录中的本地 main.js 已包含运行时，无CDN依赖；开发时使用 `npm ci` 与 `npm run build`。旧vendor仅保留为字节固定的参考基线，不再发布或加载。见[工作台迁移验收](docs/acceptance/flow-react-workbench/RESULTS.zh-CN.md)。

已在本地 `.env` 配置 Pi 供应商、模型和密钥时，用 `node --env-file=.env dist/apps/server/index.js` 启动以加载配置；不要提交 `.env`。

直接打开终端显示的本机地址，无需本地访问令牌。旧控制服务需在无活动模型任务时重启以加载此改动；供应商 API 密钥仍留本地。左侧新增 **技能与连接器**：可以查看/读取技能、启用文献来源、检索、读取论文内容与查看获取历史。启用来源不等于自动检索；打开页面仅访问本地服务。

## 实际提供

- 14个技能模块（13个上游主题＋总览），15份兼容/方法参考；按角色和发布哈希加载，项目未知技能不会自动执行。
- alphaXiv关键词/语义候选与提取文本、OpenAlex元数据/摘要、bioRxiv候选/摘要、PubMed候选/摘要、Crossref元数据。四个新来源默认关闭；Crossref保留原默认。
- API、CLI、Pi工具与工作台共用同一业务服务；不调用ORX。原始文本/响应单独保存，不把摘要说成全文。
- 当前 132 个操作通过 OperationRegistry 统一验证输入/输出、权限与幂等；包括固定源码、测试/审查、有限授权、文献/文档、文稿/报告、历史分页和资源配置。可通过 `GET /api/operations` 查看定义，或 `operation <id> --project <id> --input <JSON>` 调用；大输入可改用 `--input-file <JSON文件>`。owner HTTP 的 sessionId 不授予Agent身份，现有批准边界保持。
- 支持指定实验 revision 或 snapshotId 读取固定源码、查看文件差异并准备私有工作区；助手继承已批准团队的固定来源。项目工作区与所选实验明确区分。
- 保留原有默认关闭的本地文本检索、精确重复分组和可选MMR；新获取的论文不会自动加入本地检索白名单。

**实现与审查** 页已支持选择实验固定版本、准备私有 Git 工作区、查看/保存代码、批准开发测试、阅读日志、启动独立审查并批准完整源码差异。通过后创建新子实验，再到 **实验与运行** 单独批准正式 Run、回查指标与固定源码。真实 Pi、失败修复、Docker 测试及正式运行的完整浏览器路径见[首条闭环验收](docs/acceptance/flow-implementation/RESULTS.zh-CN.md)。

同页的 **私有实现与有限测试授权（WorkingGrant）** 可一次批准指定文件、固定测试范围和最多提交次数；每次测试仍冻结源码并保留派生批准，失败/取消/未知均计次，重复提交不重复消耗。到期只关闭未来使用，撤销会阻断依赖交付，历史记录保留。目前用于绑定固定来源的主协调会话，修改范围或续期需新专用会话；正式Run、审查、整合、网络与发布仍单独批准。见[简短验收记录](docs/acceptance/flow-working-grant/RESULTS.zh-CN.md)。

**实验与运行** 页的 RunGrant 可一次批准明确的冻结清单集合、指定协调会话、期限和最多提交次数。激活仅派生精确批准，显式提交才计次；未列清单不自动加入，重放同一清单不重复计算。到期保留已完成证据，撤销阻断新来源使用，旧逐次审批仍兼容。见[冻结运行授权验收](docs/acceptance/flow-run-grant/RESULTS.zh-CN.md)。

**报告与成果** 页可从所选 Run、已采纳结论和固定文稿构建生成报告，点击指标回查证据、源码、开发测试和审查；PDF 证据可返回固定原页/字符区间并下载原件与页图。最多纳入 20 个成功且来源有效的文稿构建，支持仅文稿报告，精确回跳其修订/作业/PDF，并回查图形生成代码、声明输入和同作业输出；这些关联不等于逐点科学数值已验证。显式生成的本地 `tar.gz` 包保留文稿 PDF、可编辑源文件、图形来源及文献原 PDF/引用页/解析与许可记录；许可未知不会被改成已获再分发许可。来源失效后保留历史原文并阻止新报告/新导出，旧报告兼容。CSV/TSV 即使原来按通用二进制归档，也可经摘要和严格 UTF-8 检查作纯文本回查，原字节不改。导出需要原生 `tar`，压缩在数据库写锁之外执行，原始输入及清单最多 30 MiB、压缩包最多 32 MiB；可编辑路径和按摘要存放的文件都计入上限，超限不静默省略。见[文稿成果包实物](docs/acceptance/flow-publication-report/RESULTS.zh-CN.md)与[文献页段交付](docs/acceptance/flow-document-report/RESULTS.zh-CN.md)。

同页新增 **固定文稿与隔离构建**：从 pdfLaTeX/XeLaTeX/LuaLaTeX 基础模板或文件创建不可变修订，绑定既有图形产物，单独批准构建后查看诊断、源文件行号、PDF 页图与下载。已知图形保留 Run/Sandbox 来源，未知来源不补造；编译失败或不完整不会显示可用 PDF，来源失效后保留历史结果并标明状态。先在本机显式执行 `node scripts/setup-document-build.mjs desktop-linux`，再在页面填入生成的固定镜像配置；完整步骤和资源限制见[编译器说明](scripts/document-build/README.md)。运行时不联网装包；三引擎与 BibTeX/Biber 已实测，中文推荐本批验过的 XeLaTeX 设置，LuaLaTeX 大型中文字体在 768 MiB 预算下失败。每份文稿最多 64 文件、合计 16 MiB；单文本 2 MiB、单图/PDF 8 MiB，只接受受限相对文件名。编译通过不代表科学审查或排版检查通过，见[文稿验收与实际 PDF](docs/acceptance/flow-publication/RESULTS.zh-CN.md)。

文稿主文件也可直接选择已归档的 TeX 产物：页面核对并保留原 artifactId 与摘要，提供只读预览，冻结修订时继续绑定该原件。Reviewer 必须提交明确意见；任务结果“已验收”与审查 verdict 分开显示。真实 Pi 已完成核心写作、固定 TeX、独立批准编译、独立审查及报告/成果包回查，见[真实论文写作验收](docs/acceptance/flow-paper-writing/RESULTS.zh-CN.md)。该批四个任务结果均已提交并验收，但四个原生 Pi 会话保留 failed／模型请求中止记录，不应视为会话成功。

任务成功提交后，Worker 保留 `task_result_submit` 回执并正常结束当前 SDK turn，Host 不再中止已完成的任务。新一轮真实 Pi 任务已验证结果 completed/accepted、原生会话 idle 且无错；用户停止仍记录为 interrupted，原生 aborted 输出保留，用量不能据此算作零。见[正常结束与取消验收](docs/acceptance/flow-worker-finish/RESULTS.zh-CN.md)。

**固定论文审查** 可从成功且来源有效的文稿构建准备，另经用户批准，由只读 Reviewer 对固定输入提交 `accept`、`reject` 或 `disputed`；审查范围不继承 root 的源码来源，也不能读取派生 Run，且不能产生科学 Claim。同一构建的全部审查自动冻结进新报告及成果包的 `reviews/<id>.json`；没有审查时仍可导出，但明确标为未审查。审查新增、变更或撤销会使新格式旧报告过期并阻止新导出，已生成的历史字节保留。两项针对同一真实 PDF 的智谱审查已通过；首项原生提交回执超时仍保留原记录，第二项以成功回执正常结束。详见[论文审查绑定验收](docs/acceptance/flow-publication-review/RESULTS.zh-CN.md)。

**资源与调度** 页可配置共享作业数、CPU/内存预算和排队上限，查看服务端计算的占用、可用额度与等待原因。正式 Run、开发测试、文档解析和文稿构建共享持久预留；共享同一 SQLite 的控制服务不能各自重复分配额度。Docker context 按真实引擎归并，首次使用或切换引擎可显式“核对 Docker 目标”；不重绑旧作业。未知作业继续占位，终态释放。Pi Worker 另设全局上限，同时服从项目/团队上限，任务提交后等待进程实际退出才释放；Worker 数量不等于模型 HTTP 并发。默认正式/开发各 1 槽、解析/文稿各固定 1 槽，共享计算总槽 2、Worker 2；CPU/内存/排队预算默认未设置，不代表硬件空闲。详见[调度验收](docs/acceptance/flow-scheduler/RESULTS.zh-CN.md)。

左侧会话目录支持按标题/标识及角色分页查找。聊天消息默认每页10条，旧页刷新保持，长正文可分段回查；查看历史时先返回最新页再发送。项目快照只携带最近30个会话及明确选中的会话，旧来源入口仍由服务端验证归属。见[历史会话验收](docs/acceptance/flow-session-history/RESULTS.zh-CN.md)。

长任务日志按 **64 KiB 有界窗口**回查，字节游标支持大日志和跨页中文/emoji；文件身份变化时显式重新读取。开发日志仅在展开时读取。工作台用带鉴权的 SSE 唤醒、按项目事件补拉和 20 秒权威状态兜底恢复连接；刷新及切会话从一致快照恢复当前输出，不重放旧回答或自动重试作业。截断/省略明确标示，完整历史分页仍在后续范围。详见[日志与断线恢复验收](docs/acceptance/flow-events/RESULTS.zh-CN.md)。

**文献任务与原文** 页支持持久检索/获取、32 MiB 内原始 PDF/文本导入、不可变 DocumentVersion、原始响应与派生摘要分离，以及固定解析器的单独批准。PDF 在隔离 Docker 中生成页图/文本，文档作业共享计算预算；证据按固定版本、物理页和 UTF-16 区间回查，刷新后保留位置。解析镜像需显式运行[setup 指引](scripts/pdf-parser/README.md)后配置，不自动安装或开启来源。[PubMed摘要](docs/acceptance/flow-pubmed-abstract/RESULTS.zh-CN.md)、[PubMed续页](docs/acceptance/flow-remaining-source-pagination/RESULTS.zh-CN.md)、[PMC原文](docs/acceptance/flow-pmc-oa-fulltext/RESULTS.zh-CN.md)与[显式文档语料](docs/acceptance/flow-document-corpus/RESULTS.zh-CN.md)已有证据；bioRxiv成功续页/原PDF、OpenAlex原件与完整表图/OCR仍受限或待验。见[文献与文档验收](docs/acceptance/flow-documents/RESULTS.zh-CN.md)和[当前后端边界](docs/BACKEND-READINESS.zh-CN.md)。

**技能版本与启动预检** 支持用户导入 UTF-8 技能/资源或受限 ZIP、固定摘要审阅、启用/回滚和撤销。最多 64 文件，文本每个 128 KiB，展开/压缩各 2 MiB，每项目 128 修订；ZIP64、加密、链接和项目配置路径拒绝。文本授权不允许执行脚本。内置发行可显式升级或回滚，已有会话/TaskAttempt 不随配置变化，重试不自动升级。旧版本按原字节归档，未知/损坏版本拒绝加载；原生 SDK `/skill:` 展开继续关闭。启动检查实际工具、数据与固定后端；缺少唯一版本依据时保留原生文件并阻塞恢复。见[内置升级](docs/acceptance/flow-builtin-skills/RESULTS.zh-CN.md)、[原生ZIP上传](docs/acceptance/flow-skill-native-upload/RESULTS.zh-CN.md)、[二进制资源](docs/acceptance/flow-skill-binary/RESULTS.zh-CN.md)和[diagram产物](docs/acceptance/flow-diagram/RESULTS.zh-CN.md)。核心写作/审查已有证据，新领域模板或执行能力仅由实际任务触发；页面重构仍暂缓。

**研究活动** 页可填写不可变研究方案，明确实际对照、变化因素、数据切分、指标、重复依据与停止条件。参数候选从固定父源码派生，下一轮使用所选实测 Run 的来源；无结果修复先经私有实现、开发测试、独立审查和批准整合，保留失败 Run 并共用修复次数上限。决定批准只准备候选，正式 Run 另行批准。活动比较与方案可冻结进报告及离线包，来源撤销后阻止新运行/新交付；旧方案与包保留。数据与成功条件是待验证声明，不自动证明实验实际使用了每份数据或科研假设成立。见[有界研究验收](docs/acceptance/flow-bounded-research/RESULTS.zh-CN.md)。

## 读取技能

```bash
node dist/apps/cli/index.js skills
node dist/apps/cli/index.js skills pi-research-lit-review
```

以上命令读取当前内置发行；会话的受控技能读取遵循该会话固定的 bundle。维护发布流程见[发行归档说明](skills/releases/README.md)，普通构建或启动不会重建信任摘要。

Pi适配代码把受管目录/总览和按需读取工具接入Worker。实际模型调用仍需安装固定SDK与配置自己的密钥：

```bash
npm run setup:pi
```

`setup:pi` 现在从根目录已提交的 `package-lock.json` 执行 `npm ci`，同时安装固定 SDK 与构建工具；不再临时生成未受版本管理的锁文件。优先使用根目录 SDK；仅根目录未安装时兼容查找 `.pi-runtime`，旧目录内容不会被自动覆盖。固定 Pi SDK 为 0.87.1；没有 SDK 时不会返回模拟模型回答。

## 开发验证

```bash
npm ci
npm run typecheck
npm test
npm run test:parity
npm run verify:build
npm run test:live
```

`test:live` 默认明确跳过。需要在进程环境配置 `PI_LIVE_TEST=1`、`PI_PROVIDER`、`PI_MODEL`、`PI_API_KEY` 后才能调用真实模型（会使用供应商额度）；测试不会读取个人全局 Pi 凭据。真实 SDK 离线契约检查包含在 `npm test` 中，但不算 live 通过。两版冻结业务源码回归可用 `npm run test:baseline -- <0.2.3源码目录> <0.3.1源码目录>`，副本、测试补丁摘要和原始日志保存在 `.validation/`。

## 文献配置

界面开启所需来源，也可用 `connector-config --project ID --enable openalex,pubmed`。可选宿主环境变量 OPENALEX_API_KEY、NCBI_API_KEY、NCBI_EMAIL 见 .env.example；不要把密钥写进Agent提示词。默认项目HTTP请求上限100，计入失败/未知尝试，不是账单硬上限。

## 说明与验证

- [当前阶段目标与完成状态](docs/PROJECT-GOAL.zh-CN.md)
- [后端入口、可用范围与环境限制](docs/BACKEND-READINESS.zh-CN.md)
- [实际任务结果、人工步骤及CLI回查](docs/acceptance/flow-wine-grouped-trial/RESULT.md) · [机器证据](docs/acceptance/flow-wine-grouped-trial/evidence.json)
- [适配细节、技能及连接器映射](docs/openresearch/ADAPTATION.md)
- [验证记录与未验收项](docs/openresearch/VALIDATION.md)
- [升级与双版本并排对比](docs/openresearch/UPGRADE.md)
- [本次版本来源](docs/openresearch/edition.json)
- [许可证/修改说明](THIRD_PARTY_NOTICES.md)
- [上一个版本README（历史）](docs/openresearch/previous-README.md)

各阶段证据按实际范围保留：智谱Pi、本机CPU Docker、有限授权、PubMed摘要/PMC原文、固定文档/文稿、Wine与Anscombe比较及备份迁移已有记录；其他原PDF来源、自动root唤醒、GPU/外部远端仍受限或待验。用户授权主代理拟定的[分组红酒任务](docs/acceptance/flow-wine-grouped-trial/RESULT.md)已完成真实后端试用，当前转入按需维护，不循环追加示例。完整前端、桌面/团队暂缓；自建托管范围长期独立保留，不能称本阶段已实现。准确入口与科学/环境限制以[后端清单](docs/BACKEND-READINESS.zh-CN.md)为准。
