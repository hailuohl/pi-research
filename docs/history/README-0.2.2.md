# Pi Research v0.2.2 — 修复基线

本包仅修复 F21–F25 及对应边界，不含开源吸纳增强。新版说明见 `docs/RELEASE-0.2.2.md`；本轮验证见 `docs/acceptance/0.2.2/`。下面保留的较早版本说明、上游对照和验收日志均为历史，不是本轮重复认证。

# Pi Research

**本地优先、以 Pi 为唯一 Agent 内核的科研工作台 · v0.2.1 本地 Alpha**

本仓库按 `docs/specs/project-design.txt` 与 `docs/specs/multi-agent-design.md` 开发。它提供可实际运行的控制服务、SQLite 状态存储、受信数值实验 Runner、协作任务调度、证据与报告，以及 React 工作台源码和预构建文件。

**这不是两份设计 M0—M9 的全部完成版。** 真实 Pi 供应商调用、Docker、远程计算及浏览器端到端验收尚未通过；没有用假助手回复或模拟运行替代这些能力。完整状态见 `docs/acceptance/capability-matrix.json` 和 `docs/acceptance/verification.md`。

## v0.2.1 修复与流程补齐

修复任务审查死锁、并发审查覆盖、空产物验收、必需运行产物遗漏、报告指标与原始证据不一致、恢复幂等及已恢复会话缺少宿主通知。补充部分成果重试、旧计划校验、模糊运行结果的人工评议，以及按契约展示指标。

新增「变更提案」：用户或交互式主协调者将已验收文件产物映射到一个固定父实验，预览前后内容，批准后创建新子实验。父节点保持不变，正式计算仍要单独批准。主协调者可写自己的工作区，Reviewer 可只读已授权产物；不是开放宿主 Shell，也不宣称已实现开发沙箱测试或 Git 整合。

**任务完成不是模型口头声明，运行结束不是假设成立。** 新版本没有把实际Pi调用、Docker或浏览器未验收的项目改成已通过。

已有数据先阅读 `docs/UPGRADE-0.2.1.md`。修复及对照细节：`docs/BUGFIXES-0.2.1.md`、`docs/reference-baseline/OPENRESEARCH-COMPARISON.md`。本版记录：`docs/acceptance/verification.md`；旧版记录分别保存在 `docs/acceptance/v0.2.0/` 与 `v0.1.0/`。

## 1. 直接启动，不需要先安装 npm 依赖

核心服务要求 **Node.js ≥22.16.0**；接入固定 Pi SDK 要求 **Node.js ≥22.19.0**。本次实际测试环境是 Linux、Node.js 22.16.0。Windows 原生与 WSL 的代码路径保留，但本次没有在 Windows 上实测。

解压并进入 `pi-research` 目录：

```bash
node dist/apps/cli/index.js doctor
node dist/apps/server/index.js
```

终端会输出包含本机访问令牌的工作台地址，例如 `http://127.0.0.1:4317/#token=...`。**打开自己终端输出的完整地址**。不要把令牌分享、上传或转发。默认只监听 `127.0.0.1`，不提供公网或团队多人认证。

预构建文件已在 `dist/` 中，无须运行 `npm install`。首次启动创建 `.pi-research/`，保存数据库、项目、会话、作业、快照、证据和访问令牌。Node 的 `node:sqlite` 实验性警告在测试环境中属于已知提示，不是服务启动失败。

Windows PowerShell 也可执行上述 `node` 命令；`start.ps1` / `start.sh` 只是同一启动命令的便利入口，不会申请管理员权限或修改系统策略。

### 先验证新增的持续研究闭环

```bash
node dist/apps/cli/index.js demo-campaign
node dist/apps/server/index.js
```

`demo-campaign` 明确授权4次随包固定数值计算：基线 → Refill两个同父候选 → 根据实际mse选择父节点 → Promote到下一轮并运行一个参数变体 → Stop。记录活动、两轮血缘、3个已批准决定、4个真实Run、证据和报告。用同一数据目录打开「研究活动」查看。它不调用Pi；所有研究决定由确定性示例脚本提出，不冒充模型科研能力。

```bash
node dist/apps/cli/index.js demo-campaign --data ./test-data --json
```

### 原有实验链路示例

停止其他正在提交作业的客户端后，执行：

```bash
node dist/apps/cli/index.js demo
node dist/apps/server/index.js
```

`demo` 会明确授权并真实执行 **4 个随包受信的小型数值实验**：一阶基线、二阶候选、三阶候选，以及从实测更优候选派生的下一轮参数变体。它使用固定合成数据，保存独立源码快照、审批、日志、实测指标和 Markdown 报告。工作台可打开对应项目。

**这个命令不调用 Pi，也不执行 DFT，不是自动科研能力评测。** 它验证的是应用的真实实验链路。每次执行都会新建一个项目，不覆盖旧结果。`--json` 输出结构化结果，`--data <目录>` 选择数据目录。

```bash
node dist/apps/cli/index.js demo --data ./local-test-data --json
# 此后要打开同一组结果，需要使用同一个 PI_DATA_DIR。
```

## 2. 配置真实 Pi

当前适配层固定 `@earendil-works/pi-coding-agent` 和 `@earendil-works/pi-ai` 为 **0.87.1**，没有切换到另一套 Agent 框架。SDK 版本来自本次读取的官方包元数据；本环境不能下载并执行这个包，因此 **接口契约测试不等于真实 SDK 集成验收**。

升级到符合要求的 Node 后：

```bash
npm run setup:pi
```

脚本将 SDK 安装到独立的 `.pi-runtime/`，生成该运行时自己的 `package-lock.json`。后续按该锁文件使用 `npm ci --prefix .pi-runtime`，不要自动追随上游最新版。

复制 `.env.example` 为 `.env`，填写自己的供应商与模型 ID，以及对应 API Key。也可以在工作台“设置与能力”中配置供应商和模型；API Key 不经过项目聊天或前端表单。

```dotenv
PI_PROVIDER=你的供应商标识
PI_MODEL=该供应商实际支持的模型ID
PI_API_KEY=你自己的密钥
```

启动服务后创建新主会话，或显式将设置应用到一个未运行的主会话。已批准团队会锁定原模型配置；修改全局模型不会偷偷更换该团队正在使用的模型。

接入点包含 `createAgentSession`、持久化 SessionManager、明确模型选择、自定义工具、`steer`、`followUp`、`abort` 和消息事件。只加载宿主编写的角色指令与工具；不自动执行导入仓库的 `.pi` 扩展、技能或 `AGENTS.md`。

**不会因为缺少 Pi 或凭据而生成假回复。** SDK 缺失、Node 版本不符、未配置模型或供应商错误都会显示错误状态。`doctor` 中配置 `ready` 也不代表凭据或真实模型调用已验证。

自定义兼容供应商的模型目录路径为 `<PI_DATA_DIR>/models.json`，格式由固定 Pi SDK 决定；本版没有自定义供应商向导、OAuth 登录向导或模型连通性自动验收。

## 3. 工作台使用顺序

创建项目，选择“曲线拟合”模板。进入“实验与运行”，新建实验，填写假设与配置。点击“准备运行”建立不可变源码快照，再“批准并提交”。实际退出状态、指标完整性与科研判断分别展示；获得有效完整结果后实验冻结，后续变化必须派生子实验。

“项目工作区”支持文本浏览、编辑和基于内容哈希的冲突检查。“资料与证据”保存实际文本、产物及原文定位；“报告与成果”只汇总已有终态运行与已采纳结论，不替用户推断未发生的研究结果。

协作默认关闭。开启后，主协调者可以提出计划，也可以手动编辑一个团队计划。计划单独批准后才能调度。存在依赖时，上游必须通过验收；关键任务等待独立 Reviewer。助手不能递归创建助手，不能批准自己的计算，不能改写共享源码。关闭开关停止新委派，已授权任务收尾；未启动任务交回人工。暂停/停止 Agent 不等同于取消正式 Run。

本版的团队额度以**任务尝试次数**计量，原子预留；不是供应商 Token 或账单的硬上限。模型上报的用量另行保存，未上报、错误或未对账用量明确为未知。完整资金预算控制仍待实现。

### 持续研究与多智能体协作

在「研究活动」中新建活动，选择已有主会话与基线实验，设定轮次数和分析尝试额度。自动分析是明确的可选项；保存后批准并启动活动。在实验页准备不可变快照，再回活动页登记RunIntent，随后单独批准和提交正式运行。

真实结果落库后，活动页显示原始观测、校验状态、指标与证据。可以人工提交决定；安装并配置Pi后，也可请求或授权自动分析提出决定。决定必须批准并点击应用；新候选只是准备好的方案，仍须单独批准运行。Repair不自动修代码：手动修复临时节点、准备新清单，再在登记时选择对应修复批准。

团队完成后，新版可以按已批准计划自动调用主Pi综合成果。手动团队表单有明确的复选框；API和旧团队记录默认不自动开启。当前整个宿主的模型Worker并发上限为2，设置更高团队并发不会突破这一开发版限制。

自动分析只读分配的证据与运行，生成草稿或待批准决定，不能运行计算、继续委派、访问工作区或发布。用户消息优先；自动分析期间的steer/follow_up留到该次分析结束处理，以免权限混用。取消分析不取消Run，停止活动不丢弃已发生的结果。

尝试额度不足或模型不可用时，通知保留阻塞原因，不假装已完成。一个尝试可能包含多轮模型调用，因此不是Token/账单上限。来源改变、模型与批准不匹配或项目归档时，原通知不会继续自动花费。

### 导入本地研究代码

```bash
node dist/apps/cli/index.js import /path/to/source --name "材料研究"
```

只复制源码，不修改原目录，不导入 Git 历史；跳过 `.git`、`.env*`、`.npmrc`、`.pi`、`node_modules`、应用数据与 Pi 运行时目录。拒绝符号链接；单次导入上限 64 MiB / 5000 文件。正式快照拒绝未解析 Git LFS 指针和包含 `.gitmodules` 的目录，不会把遗漏外部依赖的快照宣称为完整。

**导入代码不等于允许在宿主机执行。** 除随包哈希校验通过的曲线拟合示例外，任意实验需要显式 Docker 契约。Docker 路径有禁网、只读源码与资源约束实现，但本次未实测；当前不推荐运行不可信代码。Git worktree、补丁整合、独立 Python 环境和 SSH 仿真接入仍未完成。

### 命令行调用同一 API

服务运行期间：

```bash
node dist/apps/cli/index.js request GET /projects
node dist/apps/cli/index.js request POST /projects --body '{"name":"研究项目"}'
```

CLI 从同一数据目录读取访问令牌，只访问回环控制服务。`--key` 可以指定幂等键。Windows 命令行对 JSON 引号的处理不同，可改用 PowerShell 对象序列化或直接使用工作台表单。

## 4. 实现范围

| 范围 | 本版状态 |
|---|---|
| SQLite 事务、事件、幂等键、乐观版本、项目/文件 | 已实现，并有自动化测试 |
| 固定契约、不可变快照、审批、冻结、真实本地运行 | 随包受信示例已实测 |
| Pi Worker、精确 Session 恢复、流式事件、受控工具 | 代码与契约测试已完成；真实 SDK/模型未验证 |
| 协作开关、DAG、租约、输入范围、结果验收、独立审查、关闭收尾 | 确定性服务测试已通过；没有真实多 Pi 科研评测 |
| React 工作台 | 源码与预构建可由 HTTP 提供；浏览器 E2E/视觉验收被环境策略阻止 |
| 文献 | Crossref 元数据接口；无全文/语义/多源检索，实网未验证 |
| 证据与 Markdown 报告 | 已实现；没有 LaTeX/PDF 编译器 |
| Campaign轮次、Repair/Refill/Promote/Stop | 持久化状态、独立审批、真实两轮数值链路与恢复已验证；不是全自动无人干预 |
| 主会话结果唤醒 | 持久化队列、只分析权限与实际子进程IPC已测；真实Pi调用与科研质量未验证 |
| Docker | 执行路径已编码，未通过真实容器测试 |
| SSH、Slurm、Kubernetes、Ray、HF Jobs、Modal、Tinker、自有托管计算 | 未实现 |
| Git 提交/发布、ChangeProposal 自动整合、Overleaf、远程工作台 | 未实现 |
| 多用户账户、桌面安装包、数据迁移升级回滚、完整对标 | 未实现 |

具体差异、验收编号与证据以 `docs/acceptance/` 为准。运行中的服务不会把未实现后端返回成“提交成功”。

## 5. 测试与开发

包内包含预构建结果。修改 TypeScript 后，联网安装固定开发依赖并构建：

```bash
npm ci
npm run typecheck
npm test
npm run build
```

根锁文件仅包含 TypeScript 5.8.3、Node 类型 24.0.4 及 undici-types 7.8.0 的固定依赖和校验值。预构建版本无需这些开发依赖。Pi Runtime 使用自己的独立锁文件。

当前发布的确定性与集成测试为122项，已通过；详细命令输出随包提供。预构建代码可直接运行 `npm run test:core`，无需安装开发依赖。确定性测试使用 Node 内置 test runner。真实 Runner 测试会启动随包的小计算与独立监管进程，不调用付费模型。Crossref 的幂等测试使用明确的响应 fixture，不应记为实网检索通过。

浏览器测试脚本在 `tests/e2e/workbench.py` 和新增的 `tests/e2e/campaign-flow.py`；后者需要测试数据目录先运行demo-campaign。需另装 Python Playwright 与 Chromium、启动一个独立测试数据目录的服务，然后设置 `PI_TEST_URL`、`PI_TEST_DATA` 再运行。`PI_CHROMIUM_EXECUTABLE` 可指定已有 Chromium。这些脚本会修改测试记录；其中原工作台脚本还会执行示例实验，**不要指向珍贵的生产数据目录**。

本次浏览器环境受组织策略阻止访问本地 URL，错误为 `net::ERR_BLOCKED_BY_ADMINISTRATOR`；没有修改或绕过该策略。因此不能把构建通过、HTTP 200 或 E2E 脚本存在当作浏览器测试通过。

## 6. 工程结构

```text
apps/server/              统一 HTTP 控制服务
apps/agent-worker/        独立 Pi SDK 执行进程
apps/runner-supervisor/   独立正式运行监管进程
apps/cli/                 同一业务服务的命令行入口
apps/web/                 React + TypeScript 工作台
packages/domain/          领域模型与状态
packages/storage/         SQLite、事务、事件与幂等
packages/workspace/       项目、文件、快照、实验
packages/policy/          权限、审批、额度预留
packages/collaboration/   团队、DAG、输入范围、验收与恢复
packages/pi-adapter/      固定版本 SDK 适配
packages/research-tools/  宿主控制的科研工具
packages/scheduler/       Worker 调度、持久化唤醒与运行对账
packages/research-workflows/ 活动、轮次、观测与有界决定
packages/runners/         执行契约与 Runner 服务
packages/evidence/        产物、引用与结论
packages/literature/      文献提供方接口
packages/publications/    确定性报告
examples/curve-fit/       实际运行的固定数值示例
skills/                  宿主角色说明（不自动信任项目技能）
docs/specs/              两份原始设计
```

## 7. 安全、数据和已知限制

本版是**单用户本地开发版，不是加固的多租户科研平台**。Pi Worker 禁用默认 Shell/文件工具，由宿主校验能力与输入范围；这不是完整操作系统沙箱。只有受信固定示例允许宿主执行。不要将服务反向代理到公网，不要运行恶意仓库，不要把数据目录加入 Git。

由于npm注册库DNS不可达，本次构建使用已安装TypeScript5.8.3和Node类型25.1.0；声明的锁文件仍为Node类型24.0.4。完整固定锁文件安装未在本环境成功，预构建代码另行无依赖验证。

UI 使用环境中可获得的离线 React 16.0.0 / ReactDOM 16.0.1 UMD，附许可证；没有 CDN 依赖。这是受构建环境限制采用的旧版前端基线，不是推荐的新项目长期依赖版本。升级到现代 React、完整无障碍与浏览器兼容验收是后续工作。

业务数据库是调度与授权事实来源，Pi Session 文件是对话来源。两者不处于一个跨文件原子事务；业务幂等键避免重复执行已登记工具副作用。外部网络服务不承诺恰好一次执行。

关闭浏览器不会取消作业。停止控制服务会停止 Agent，已启动的本地正式 Run 由独立监管进程继续；状态未知时不盲目重提交、不凭旧 PID 杀进程。操作系统重启后的无收据作业须人工核对，本版没有远程作业自动恢复能力。

备份时先让任务和运行到达稳定终态，再停止控制服务，复制整个数据目录，包括 SQLite、快照、产物、Session。不要只复制数据库。当前记录含绝对路径，**不能直接移动数据目录并声称自动迁移成功**；需要路径迁移工具后才能安全迁移。本次验证了使用原绝对数据目录读取v0.1产生的4个真实Run和报告，再加入新活动，原记录与报告不变；这不是任意数据目录迁移或同时运行两版本的支持。详细步骤见 `docs/UPGRADE-0.2.md`。

本次代码审查为作者自审和自动化测试，未经过独立审查者或第三方渗透测试。
