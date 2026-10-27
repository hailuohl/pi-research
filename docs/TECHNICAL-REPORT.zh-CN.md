# 研舟π 技术报告

报告基线：当前工作副本，提交 `f458634`（Pi SDK 1.2.0 升级批），包版本 `0.3.2-experimental`（README 标题沿用源包身份 `0.3.1-experimental`，见 [CHANGELOG](../CHANGELOG.md)）。撰写日期：2026-10-27。

本报告描述当前代码的实际形态、能力与边界，汇总已有验收证据；不新增验收声明。逐项证据以 [acceptance 目录](acceptance/)（124 条 flow 记录）与 [BACKEND-READINESS](BACKEND-READINESS.zh-CN.md) 为准。

## 1. 项目概述

研舟π（包名 `pi-research`）是一个**本地优先、过程可追溯的多智能体科研工作台**，以 Pi 作为唯一 Agent 执行内核。核心思路：模型的每一步有副作用动作（源码、测试、运行、文献获取、文稿编译、成果导出）都经过统一契约验证、用户显式批准，并以不可变的固定版本（修订、快照、意图清单）留证，事后可按稳定 ID 回查。

- 定位：单机本地系统，服务仅绑定本机回环；不是托管服务，也不是 OpenResearch 的完整替代品。
- 项目自身采用 MIT 许可；第三方组件见 [开源及第三方资源使用清单](THIRD-PARTY-RESOURCES.zh-CN.md) 与 [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md)。
- 由 `0.3.0-experimental` 独立派生，保留 0.2.x 的实验、审批、快照、协作、Campaign 与有效性修复。
- 当前阶段状态：本地后端阶段已完成并转入按需维护；前端布局完整重构、桌面分发与团队产品协作暂缓（见 [PROJECT-GOAL](PROJECT-GOAL.zh-CN.md)）。

## 2. 运行环境与启动

| 项 | 值 |
|---|---|
| 核心运行时 | Node.js ≥ 22.19.0；可重复开发构建固定 Node 24.18.0（`.nvmrc`）、npm 11.17.0 |
| 默认端口 | 4317（`PORT` 可改） |
| 数据目录 | `<项目>/.pi-research`（`PI_DATA_DIR` 可指向独立目录） |
| 模型配置 | `PI_PROVIDER` / `PI_MODEL` / `PI_API_KEY`，本地 `.env`，不入库 |
| 预构建产物 | 仓库含 `dist/`，核心与工作台可直接运行，无需先安装 npm 依赖 |

```bash
node dist/apps/cli/index.js doctor          # 启动自检：工具、数据、固定后端
node dist/apps/server/index.js              # 控制服务 + 工作台（本机回环）
npm run setup:pi                            # 按根目录锁定文件安装固定 Pi SDK 1.2.0
```

没有 Pi SDK 时系统不会伪造模型回答；真实模型调用需自行配置供应商凭据。

## 3. 系统架构

### 3.1 应用层（apps/）

| 应用 | 职责 |
|---|---|
| `server` | 控制服务：HTTP API、工作台静态资源、SSE 事件唤醒、调度入口 |
| `cli` | 命令行：`doctor`、`operation`、`skills`、`demo-campaign`、`backup` 等 |
| `web` | 工作台前端（React 19.3.0，本地打包，无 CDN 依赖） |
| `agent-worker` | 本地 Pi 主会话/助手 Worker，承载真实模型任务 |
| `execution-worker` | 计算执行 Worker（本地受信示例、Docker、SSH） |
| `literature-worker` | 文献检索/获取任务 |
| `document-worker` | 文档解析作业（隔离 Docker 内跑固定 PDF 解析镜像） |
| `publication-worker` | 文稿编译作业（隔离 Docker 内跑固定 TeX 镜像） |
| `runner-supervisor` | 受监督的正式 Run 进程（超时、输出与退出码捕获） |

### 3.2 领域包（packages/，21 个）

围绕统一领域模型分层：`domain`（核心实体）、`contracts`（操作契约与校验）、`storage`（持久化与 CAS）、`runtime`/`scheduler`（进程与调度）、`pi-adapter`（Pi SDK 适配）、`execution`/`runners`（计算后端）、`literature`/`connectors`（五源文献）、`documents`/`text-evidence`（文档版本、证据定位与本地检索）、`development`（私有实现/测试/审查流程）、`publications`（文稿/报告/成果包）、`collaboration`（团队/任务/授权）、`skills`（技能目录与版本）、`policy`、`evidence`、`research-tools`、`research-workflows`、`workspace`（项目工作区与 GitHub 源码同步）。

### 3.3 统一操作契约（OperationRegistry）

全部业务入口收敛到一个操作注册表：当前工作副本实测 **163 个操作**（`GET /api/operations` 可查；README 的 134、后端清单的 144 为更早时点数字）。每个操作声明：

- 精确输入/输出 Schema（TypeBox）；
- 权限（仅用户 / 限定 Agent 角色与项目）；
- 幂等策略（只读 / 幂等键 / 版本与摘要乐观并发 `expectedVersion`、`expectedDigest`）；
- 前置条件（来源有效、版本未冻结等）。

四类入口（工作台 HTTP、CLI `operation`、Pi 工具、内部调用）共用同一注册表；HTTP 的 `sessionId` 只选择工作区，不授予 Agent 身份，无法通过 HTTP 伪造 Pi 角色、任务或租约。

### 3.4 Pi 适配层与多智能体

- 固定 Pi SDK 1.2.0（`@earendil-works/pi-ai`、`pi-coding-agent` 及五个子包 override），适配层逐项核对 SDK 接口（ModelRuntime、SessionManager、createAgentSession、resourceLoader 等），离线真实 SDK 契约测试纳入 `npm test`。
- 受管技能目录与按需读取工具接入 Worker；会话固定技能 bundle，读取资源不执行代码。
- 多智能体协作：研究对话输入框旁切换；开启后主 Pi 从当前任务生成**有界分工**，用户批准后执行，结果回原会话综合；关闭后停止新分配，已有结果保留。无需手填协作目标或预算 JSON。
- 2026-10 起解除单次运行 12 轮 / 40 次工具调用 / 5 分钟的固定上限；任务可持续至完成或手动停止，工具超时、权限校验与故障处理仍生效。

### 3.5 执行后端与隔离沙箱

执行后端 2026-10-07 收敛为**本地受信示例、Docker、SSH** 三类（其余后端及占位已移除）：

- 正式 Run：批准冻结清单后在 Docker 沙箱执行（非 root、只读根文件系统、无额外 capability、资源限额）；`runner-supervisor` 统一捕获退出码与输出。
- PDF 解析（profile `pdfium-text-form-images-v3`）：pypdfium2 + Pillow 固定 wheel 哈希、镜像 digest 固定、构建时断网；有严格页数/对象数/时长限额，不做 OCR，不声明阅读顺序或科学正确性。
- 文稿编译（profile `latex-document-v1`）：Debian trixie 快照锁定的 257 个包（TeX Live 三引擎 pdflatex/xelatex/lualatex、BibTeX/Biber、Poppler、Latin Modern 与 Noto CJK 字体），`--network none` 安装与运行；引擎参数禁 shell 转义与 Lua socket/ffi，并有针对性伪造探针。
- GPU：契约与设备接线属需求触发范围，尚未接入。

### 3.6 前端工作台

React/ReactDOM 19.3.0 由 esbuild 打包进 `dist/web/assets/main.js`，运行时无 CDN 与外部字体依赖。会话为主入口；实验支持节点树图与列表；日志按 64 KiB 有界窗口回查（字节游标，正确处理中文/emoji 跨页）；断线用带鉴权 SSE 唤醒 + 按项目事件补拉 + 20 秒权威状态兜底，不重放旧回答。输入框支持消息排队/编辑/删除、文献来源勾选（站点图标）、附件（每条消息最多 5 份 PDF/TXT/MD、每份 32 MiB）与会话级模型选择。

### 3.7 数据与持久化

本地数据目录内含业务数据库、内容寻址（CAS）来源对象、原生 Pi 会话历史、项目 Git 历史与技能发行归档。关键不变量：实验修订与快照不可变；Run 以批准时冻结的清单执行；文档导入形成不可变 DocumentVersion；技能旧版本按原字节归档。CLI `backup create/verify/restore --offline` 支持全量离线备份、校验与异址恢复重开。

## 4. 核心功能与流程

| 功能域 | 说明 | 证据 |
|---|---|---|
| 研究对话 | 对话直接发起研究活动、实现与审查、变更提案；空闲即执行，运行中排队 | [对话工作流](acceptance/flow-dialogue-workflows/RESULT.md)、[消息队列](acceptance/flow-composer-queue/RESULT.md) |
| 实验与运行 | Pi 读取固定修订配置→提交候选参数→核验父修订→冻结运行清单；用户确认后提交并回查真实状态；RunGrant 一次批准冻结清单集合、期限与计次 | [实验对话](acceptance/flow-experiment-dialogue/RESULT.md)、[RunGrant](acceptance/flow-run-grant/RESULTS.zh-CN.md) |
| 实现与审查 | 固定源码→私有 Git 工作区→开发测试→独立审查→批准完整差异→新子实验→正式 Run；WorkingGrant 一次批准指定文件、固定测试范围与提交次数 | [首条闭环](acceptance/flow-implementation/RESULTS.zh-CN.md)、[WorkingGrant](acceptance/flow-working-grant/RESULTS.zh-CN.md) |
| 文献与文档 | 五源（alphaXiv/OpenAlex/bioRxiv/PubMed·PMC/Crossref；仅 Crossref 默认开）；持久检索/获取任务、不可变 DocumentVersion、原始响应与派生摘要分离；32 MiB 内原件导入；固定解析器单独批准；证据按固定版本/物理页/UTF-16 区间回查 | [文献与文档](acceptance/flow-documents/RESULTS.zh-CN.md) |
| 报告与成果 | 从成功 Run 与已采纳结论构建报告，指标回查证据/源码/测试/审查；本地 `tar.gz` 成果包含文稿 PDF、可编辑源、图形来源与文献原件及许可记录；审查新增/变更会阻止旧格式新导出 | [成果包](acceptance/flow-publication-report/RESULTS.zh-CN.md) |
| 固定文稿与编译 | 不可变文稿修订、绑定图形产物、独立批准编译；三引擎 + BibTeX/Biber；诊断/行号/页图回查；可选用已归档 TeX 产物作主文件 | [文稿](acceptance/flow-publication/RESULTS.zh-CN.md)、[论文写作](acceptance/flow-paper-writing/RESULTS.zh-CN.md) |
| 固定论文审查 | 只读 Reviewer 对固定输入提交 accept/reject/disputed；不继承 root 源码来源、不能读派生 Run、不能产生科学 Claim；审查自动冻结进新报告 | [审查绑定](acceptance/flow-publication-review/RESULTS.zh-CN.md) |
| 技能系统 | 13 个内置技能（12 上游主题＋总览）、24 份按需资源（2 计算、20 图表、2 文稿模板）；用户可导入技能/资源/受限 ZIP，固定摘要审阅、启用/回滚/撤销；最多 64 文件、每项目 128 修订 | [技能生命周期](acceptance/flow-skills/RESULTS.zh-CN.md)、[内置升级](acceptance/flow-builtin-skills/RESULTS.zh-CN.md) |
| 有界研究活动 | 不可变研究方案（对照、因素、切分、指标、停止条件）；候选从固定父源码派生；失败修复走私有实现→测试→审查→批准整合，共用修复次数上限 | [有界研究](acceptance/flow-bounded-research/RESULTS.zh-CN.md) |
| 环境与凭据 | 本机私密配置保存变量（API 密钥等），页面只显已设置状态；新进程取当前值，不自动外发到 Docker/SSH；变更不影响运行中进程 | [环境](acceptance/flow-environment/RESULT.md) |
| 备份与迁移 | 离线全量备份/校验/异址恢复，迁移后仅新副本活动 | [备份](acceptance/flow-data-backup/RESULTS.zh-CN.md)、[异址续研](acceptance/flow-data-relocation/RESULTS.zh-CN.md) |
| 源码远端同步 | 项目可选私密 GitHub 同步（中文拼音 slug、固定账号/仓库/SHA、祖先完整性检查）；真实 Git 与 CLI 只读已验，远端写入使用隔离模拟 | [验收范围](acceptance/flow-github-project/ACCEPTANCE.md) |

## 5. 安全与权限模型

1. **本地边界**：服务仅监听本机回环，`local-owner-only`；Host 白名单、同源 Origin 与 Fetch Metadata 校验；工作台直开本机地址，无需访问令牌；不把服务暴露到局域网。
2. **身份不可伪造**：Agent 的 Actor、任务、租约和允许工具由控制服务建立；客户端不能自称 `user` 或提交任意角色；owner HTTP 请求不授予 Agent 权限。
3. **用户是唯一批准人**：所有有副作用的阶段（测试、整合、正式 Run、编译、审查、导出、Grant）都需要用户显式批准；模型判断不替代授权。
4. **有界授权**：WorkingGrant / RunGrant / DiscoveryGrant 把"批准一次"限定为精确的文件集合、冻结清单、来源范围、期限与提交计次；到期只关未来使用，撤销阻断依赖交付，历史记录保留。
5. **固定与可回查**：源码修订、实验快照、Run 清单、文档版本、技能版本、文稿修订均不可变；结果按固定 ID、页码、字符区间回查，原始响应与派生摘要分离存放。
6. **沙箱隔离**：解析与编译镜像非 root、只读根、无 capability、无网络；引擎禁 shell 转义/Lua socket；不挂载宿主凭据或 Docker socket；编译产物必须同时满足退出码、封闭 schema、无错误且收敛、字节/摘要校验才算成功。
7. **凭据管理**：供应商密钥只存本机（`.env` 或环境页私密配置），不进提示词、不提交仓库、不自动转发给 Docker/SSH 目标；文献密钥仅控制服务使用。

## 6. 技术栈摘要

| 层 | 技术 |
|---|---|
| 语言/类型 | TypeScript 5.8.3（Node 原生测试运行器，无外部测试框架） |
| Agent 内核 | Pi SDK 1.2.0（`@earendil-works/*`，MIT），供应商经 SDK（实测智谱） |
| 前端 | React/ReactDOM 19.3.0（MIT，esbuild 本地打包，无 CDN） |
| 运行时依赖 | `pinyin-pro`（GitHub slug 拼音化）；`marked` 为保留声明，当前源码无直接引用 |
| 隔离执行 | Docker（Linux/amd64）：pypdfium2 5.13.0 + Pillow 11.3.0 解析镜像；Debian trixie 257 包 TeX 编译镜像 |
| 外部接口 | Crossref、PubMed/PMC、OpenAlex、alphaXiv、bioRxiv（可选密钥，默认除 Crossref 外关闭） |

完整版本、许可证与来源见 [开源及第三方资源使用清单](THIRD-PARTY-RESOURCES.zh-CN.md)。

## 7. 验证与质量保障

```bash
npm ci && npm run typecheck && npm test && npm run test:parity && npm run verify:build
PI_LIVE_TEST=1 PI_PROVIDER=.. PI_MODEL=.. PI_API_KEY=.. npm run test:live   # 显式选择加入
```

- 测试规模：unit + integration + parity 共 278 个测试文件；最近一次全量回归记录为 **1923 通过 / 25 跳过 / 0 失败**（2026-10-13 打包记录，基线 `15d0a646`）；0.3.2 批（`f458634`，Pi SDK 1.2.0 升级）记录离线真实 SDK 契约测试与全量测试通过。
- `test:live` 默认跳过，需进程环境显式开启并使用自己的供应商额度；不读取全局 Pi 凭据。
- 双版本冻结业务源码回归：`npm run test:baseline -- <0.2.3源码> <0.3.1源码>`。
- 验收模式：每批固定 3–5 条验收条件（成功、越界/失败、重开/历史保留），证据存 [acceptance/](acceptance/)；真实 Pi、Docker、浏览器只验本批关键路径。
- 干净构建：`verify:build` 校验 661 份构建产物；打包逐文件 SHA256 与解压运行检查（见 [打包说明](../打包说明.md)）。

## 8. 当前能力边界

沿用 [BACKEND-READINESS](BACKEND-READINESS.zh-CN.md) 的分类（该清单为准确入口）：

- **可用**：对话驱动的研究/实现/审查/实验闭环、五源文献与文档证据链、报告与成果包、技能生命周期、离线备份迁移、有界授权、历史分页回查。
- **受限**：PDF 阅读顺序/表图结构/扫描 OCR；PMC 复杂表格语义；部分历史总览未分页；SDK 用量观察不等于真实账单。
- **需求触发**：更多 Task 授权、RunGrant 参数语言、新技能/模板、压力/恢复矩阵、成果对外发布、Overleaf、GPU 契约。
- **环境待验**：bioRxiv/OpenAlex 原 PDF（曾遇 429/缺凭据）、自动 root 唤醒（仅 IPC 证据）、外部 SSH 目标（仅隔离回环证据）。
- **暂缓**：前端布局完整重构、桌面分发/更新/回滚、团队产品协作（PR14）。

明确不宣称：编译通过不等于排版或科学审查通过；数据与成功条件是待验证声明；`accept` 审查结论不证明科学正确；许可未知不改写为已获再分发许可。

## 9. 版本沿革

| 版本 | 日期 | 要点 |
|---|---|---|
| 0.2.0 | 2026-09-27 | Campaign/轮次/提案审批、主会话唤醒队列、研究活动 API |
| 0.2.1 | 2026-09-27 | 审查等待环、跨租约幂等、结果冻结等缺陷修复 |
| 0.3.0-experimental | — | 派生基线（本副本的独立派生来源） |
| 0.3.1-experimental | 2026-09-27 | OpenResearch 技能与五源文献连接器适配；271 项测试 |
| 0.3.2-experimental | 2026-10-15 | Pi SDK 0.87.1→1.2.0，适配层逐项核对，Node 固定 24.18.0，会话格式 v3 |

当前工作副本在 0.3.2 基线上按 [实施计划](IMPLEMENTATION-PLAN.zh-CN.md) 持续推进，各批验收记录见 [IMPLEMENTATION-STATUS](IMPLEMENTATION-STATUS.md)。
