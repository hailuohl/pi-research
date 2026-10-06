# 内置技能适配与可用性核查

2026-10-06；代码基线 `1bd59c75f0dcf831c16f6068e952d00fc27d75e1`。范围为当前仓库的 14 个默认内置技能与 15 份资源，不读取用户自定义技能或私人研究数据，不修改技能、服务、会话和作业。

**结论：加载机制可用，但不能认定全部技能已经适配当前项目或所有功能都可执行。** 这些是面向 Pi Research 改写并固定摘要的技能，不是直接运行 OpenResearch/ORX；部分正文仍停留在早期能力边界，会误导模型忽略现有实现或走不通授权流程。

## 已核实的运行层

- 14 个技能、15 个资源、29 个文件全部存在，磁盘清单、生成清单与内容摘要一致。
- 7 种角色共 129 次授权读取成功、38 次越权读取正确拒绝，初始化提示和技能目录一致。角色目录分别为协调者 14、文献 5、设计 10、实施 6、分析 8、审查 10、写作 7；可读技能不等于可执行其中全部工具。
- 正文肯定引用的操作名称未发现不存在的名称；这不等于所有参数示例、授权步骤或能力描述正确。
- 相关 46 项检查：45 通过、0 失败、1 跳过（Windows 不具备 POSIX 权限模式）。包括真实子进程 IPC 的固定技能读取、旧包恢复和撤销阻断；该 IPC 测试没有调用真实模型。
- 本机 Node 24.19.0，固定 Pi SDK/pi-ai 均为 0.87.1；本地 Docker daemon 可达，版本 29.8.1。未运行真实供应商模型、Docker 容器、SSH 远端或外部文献查询，因此不能据此保证真实科研任务成功。

## 逐项结果

| 技能 | 状态 | 当前结论 |
|---|---|---|
| overview 研究工作流 | 基本适配 | 工具包装、冻结、审批与证据区分正确；仍需遵守实际角色工具范围。 |
| create 研究启动 | 基本适配，补充说明 | 应补完整 config 整体替换、父修订检查与已有研究计划确认步骤。 |
| experiment-tree 实验与运行 | 基本适配 | Repair/Refill/Promote/Stop、血缘与已回答结果保护符合实现。 |
| git 代码与版本 | 需更新 | 否认当前真实 Git 提交/私有工作区及开发测试沙箱；缺工作区 ready 前置。 |
| agent-delegation 协作方法 | 核心适配，授权说明不足 | 团队批准和来源开关不能替代文献任务的固定联网授权。 |
| compute 计算环境 | 需更新 | SSH 已有受控适配器；获准的分析任务有 Task RunGrant 例外，不能概括为助手均无计算授权。 |
| instances 远程实例 | 边界说明为主 | 云实例申请、计费、销毁、交互式远程工作台未实现；应与已有受控 SSH 作业区分。 |
| evidence 证据与引用 | 基本适配 | 原文定位、任务范围和失效历史符合实现；PDF/PMC 需对应固定用户授权。 |
| reports 报告与成果 | 基本适配，环境依赖 | 草稿与固定报告/导出边界正确；实际导出、编译依赖工具和配置。 |
| figures 图表与可视化 | 方法可用，路径示例需修正 | 资源都存在，但路径简写按字面调用有 5 个失败；实际成图依赖获准环境，尚无专用通用绘图工具。 |
| paper 论文写作 | 需更新 | 当前交互主协调者可创建/准备固定文稿；用户仍配置、批准、提交构建。旧文案把部分已开放操作一概禁止。 |
| customize 技能定制 | 需更新 | 当前用户上传会自动授权加载并开启，旧正文仍要求维护者代码审查、清单重建和新发布。 |
| feedback 评价与反馈 | 基本适配 | 可记录本地产物或说明；无 issue/遥测外发工具，不应宣称已发送。 |
| lit-review 文献研究 | 需更新 | 普通交互与任务联网审批不同；缺固定 DiscoveryGrant 步骤，遗漏精确批准 DOI 例外及用户 PDF/原文检索路径。 |

## 需要优先修正的指导

1. **Git 与开发能力陈旧。** `skills/piresearch/pi-research-git/SKILL.md:8,27` 声称没有 Git commit 和开发测试沙箱。实际 `packages/workspace/git-service.ts:94–104,147–184`、`packages/development/service.ts:69–97,135–146` 与对应操作已实现。绑定 Git 工作区还须确认 ready（`git-service.ts:48–54`）。自动外部 push/rebase 等不能由本地提交能力推断。
2. **技能定制与本次界面不一致。** `pi-research-customize/SKILL.md:11–16` 否认上传替换，恢复描述也没有准确强调原固定 Bundle。当前 `packages/skills/service.ts:108–125` 支持用户原子上传/开启、同名未来配置替换；旧包和历史保留，Agent 没有管理权限。自动开启仅是用户加载授权，不能改称内容已审查或取得执行权限。
3. **文献任务流程缺授权。** `pi-research-lit-review/SKILL.md:11,38` 与 `pi-research-agent-delegation/SKILL.md:13` 未完整指明尚未派发的文献任务须用户另行准备、批准、激活固定 DiscoveryGrant。默认 confirm 主会话可产生精确 SessionAction 审批，不能把所有联网都概括为同一种授权。当前任务授权仅一次 Crossref 关键词检索或唯一精确 DOI；被明确批准的 DOI 不必先有检索命中。依据 `session-permissions.ts:38,68–74`、`discovery-grants.ts:25–37`、`connectors/service.ts:48`。
4. **计算能力与能力目录陈旧。** `pi-research-compute/SKILL.md:13–23`、`references/ssh.md:5` 与 `packages/connectors/catalog.ts:9` 仍将 SSH 记为未实现，CLI doctor 也固定 `remoteRunners:false`。实际 `packages/runners/service.ts:84,123–132,169`、`ssh.ts`、`ssh-targets.ts`、`ssh-supervisor.ts` 支持固定目标、镜像与协议的受控 SSH 作业，不等于通用远程 Shell 或实例供应。`run_submit` 的已授权 analyst Task 路径见 `registry.ts:319`、RunGrant 校验，自动分析仍没有无条件权限。
5. **论文角色边界过小。** `pi-research-paper/SKILL.md:8,22` 禁止 Agent 调用 manuscript_create/publication_prepare。实际 `registry.ts:53,199,205` 通过 publicationAccess 向有有效租约和审批条件的交互主协调者开放，`permissions.ts:5–9,14` 限定身份；writer/任务助手不能由此获得该权限。publication_configure、publication_submit、cancel 仍是用户专属（`registry.ts:204,206,208`），真实编译仍需固定环境和批准。
6. **图形资源路径有歧义。** `pi-research-figures/SKILL.md:18` 的 `references/curves.md` 可直接读取；其余 `scaling.md/comparison.md/pareto.md/matrix.md/diagram.md` 按正文写法均返回 SKILL_RESOURCE_NOT_FOUND。实际均应带 `references/` 前缀。文件和完整路径加载本身正确，不能描述为资源丢失。

用户原 PDF 获取/固定解析/页证据及本地原文检索已有代码入口，`lit-review:45,50` 的项目能力说明应更新，但 Agent 不能直接绕过用户专属下载/解析及固定 TextCorpusGrant。实例 provision、Overleaf/外部投稿、slurm/k8s/ray/hf/modal/tinker 等本次仍没有对应正式适配器，不因有指南而称可执行。

## 测试与后续边界

`tests/unit/openresearch-skills.test.mjs:13` 仍要求 Git 正文匹配“不是 Git/未实现 Git”。因此哈希和现有测试通过只证明固定加载及部分约束，并不能证明正文随实现更新。后续修复应同时更新语义回归检查；修改内置正文后须发布新的可信清单与发行，不能只编辑文件而让摘要校验失败，也不能重写旧发行或既有会话。

本次是只读核查，没有修改技能、哈希、权限或页面。报告不把用户上传后自动开启等同于内容适配审核；自定义技能需按实际正文单独核对。原日志和完整机器明细保存在 `.validation/skill-readiness-audit-20261006`，不重复提交运行日志或私有数据。
