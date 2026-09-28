# Pi Research 0.3.1-experimental

**增强试验派生版 · OpenResearch 技能与文献连接器适配**

本开发副本基于 v0.3.1 按 [优化实施计划](docs/IMPLEMENTATION-PLAN.zh-CN.md) 持续推进。原 ZIP 保持冻结；版本号沿用源包身份，不代表新发布。当前进度见 [实施状态](docs/IMPLEMENTATION-STATUS.md)，证据见 [PR01](docs/acceptance/pr01/RESULTS.zh-CN.md)、[PR02 首批](docs/acceptance/pr02/RESULTS.zh-CN.md) 与 [能力矩阵](docs/reference-baseline/PR01.md)。

由 0.3.0-experimental 独立派生。保留既有实验、审批、快照、协作、Campaign 与有效性修复；新增受管技能目录和五源文献接口。不是完整 OpenResearch 替代品，也不是所有后端已连接的生产系统。

## 启动

核心 Node.js ≥22.19.0；可重复开发构建固定 Node.js **24.19.0**、npm **11.17.0**。包内有 dist，运行核心无需先安装 npm 依赖。

```bash
node dist/apps/cli/index.js doctor
node dist/apps/server/index.js
```

已在本地 `.env` 配置 Pi 供应商、模型和密钥时，用 `node --env-file=.env dist/apps/server/index.js` 启动以加载配置；不要提交 `.env`。

打开终端显示的本地地址，不要泄露访问令牌。左侧新增 **技能与连接器**：可以查看/读取技能、启用文献来源、检索、读取论文内容与查看获取历史。启用来源不等于自动检索；打开页面仅访问本地服务。

## 实际提供

- 14个技能模块（13个上游主题＋总览），15份兼容/方法参考；按角色和发布哈希加载，项目未知技能不会自动执行。
- alphaXiv关键词/语义候选与提取文本、OpenAlex元数据/摘要、bioRxiv候选/摘要、PubMed候选/摘要、Crossref元数据。四个新来源默认关闭；Crossref保留原默认。
- API、CLI、Pi工具与工作台共用同一业务服务；不调用ORX。原始文本/响应单独保存，不把摘要说成全文。
- 63 个操作（包含固定源码、开发测试、Git、独立审查、受审整合、报告交付及容量配置）通过 OperationRegistry 统一验证、权限与幂等处理，具有精确输入/输出 Schema。可通过 `GET /api/operations` 查看定义，或 `operation <id> --project <id> --input <JSON>` 调用；报告生成/导出与容量配置保留用户权限，不因统一接口扩大 Agent 权限。
- 支持指定实验 revision 或 snapshotId 读取固定源码、查看文件差异并准备私有工作区；助手继承已批准团队的固定来源。项目工作区与所选实验明确区分。
- 保留原有默认关闭的本地文本检索、精确重复分组和可选MMR；新获取的论文不会自动加入本地检索白名单。

**实现与审查** 页已支持选择实验固定版本、准备私有 Git 工作区、查看/保存代码、批准开发测试、阅读日志、启动独立审查并批准完整源码差异。通过后创建新子实验，再到 **实验与运行** 单独批准正式 Run、回查指标与固定源码。真实 Pi、失败修复、Docker 测试及正式运行的完整浏览器路径见[首条闭环验收](docs/acceptance/flow-implementation/RESULTS.zh-CN.md)。

**报告与成果** 页可从所选 Run 生成固定报告，点击指标回查原始证据，查看对应源码、开发测试和审查，再显式生成本地 `tar.gz` 成果包。来源撤销后保留历史原文并阻止新导出；旧版报告明确标示没有固定引用绑定。导出需要原生 `tar`，压缩在数据库写锁之外执行，原始输入及清单最多 30 MiB、压缩包最多 32 MiB。包内保留逻辑文件模式，Windows 导出后在支持执行权限的平台按清单恢复。报告/PDF 编译仍属后续范围，详见[报告交付验收](docs/acceptance/flow-report/RESULTS.zh-CN.md)。

**资源与调度** 页可配置共享作业数、CPU/内存预算和排队上限，查看服务端计算的占用、可用额度与等待原因。正式 Run 和开发测试共享持久预留；共享同一 SQLite 的控制服务不能各自重复分配额度。Docker context 按真实引擎归并，首次使用或切换引擎可显式“核对 Docker 目标”；不重绑旧作业。未知作业继续占位，终态释放。Pi Worker 另设全局上限，同时服从项目/团队上限，任务提交后等待进程实际退出才释放；Worker 数量不等于模型 HTTP 并发。默认正式/开发各 1 槽、计算总槽 2、Worker 2；CPU/内存/排队预算默认未设置，不代表硬件空闲。详见[调度验收](docs/acceptance/flow-scheduler/RESULTS.zh-CN.md)。

长任务日志按 **64 KiB 有界窗口**回查，字节游标支持大日志和跨页中文/emoji；文件身份变化时显式重新读取。开发日志仅在展开时读取。工作台用带鉴权的 SSE 唤醒、按项目事件补拉和 20 秒权威状态兜底恢复连接；刷新及切会话从一致快照恢复当前输出，不重放旧回答或自动重试作业。截断/省略明确标示，完整历史分页仍在后续范围。详见[日志与断线恢复验收](docs/acceptance/flow-events/RESULTS.zh-CN.md)。

## 读取技能

```bash
node dist/apps/cli/index.js skills
node dist/apps/cli/index.js skills pi-research-lit-review
```

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

- [适配细节、技能及连接器映射](docs/openresearch/ADAPTATION.md)
- [验证记录与未验收项](docs/openresearch/VALIDATION.md)
- [升级与双版本并排对比](docs/openresearch/UPGRADE.md)
- [本次版本来源](docs/openresearch/edition.json)
- [许可证/修改说明](THIRD_PARTY_NOTICES.md)
- [上一个版本README（历史）](docs/openresearch/previous-README.md)

各阶段测试记录单独留存，不把历史发布包结果当作当前验收。本机智谱 Pi、Linux CPU Docker 和首条浏览器科研闭环已实测；真实文献联网、其他供应商/GPU/远程环境仍需各自验收。远程计算、Git发布、Overleaf、LaTeX编译/实例申请保留在后续计划中。
