# PR02 补齐与 PR03 验证记录

日期：2026-09-28。开发基线：`a43a1ad`。继续基于 v0.3.1 源码推进完整计划；本记录不代表 PR04–14 或真实多 Agent 科研闭环已完成。

## 已实现

PR02 的剩余 26 个旧工具已迁入 Registry。连同原有 7 个和本次 4 个源码动作，现在有 **37 套**输入/输出 Schema、类型推导和统一执行定义。Dispatcher 只保留目录、授权和转发。适用的旧 HTTP/CLI 写入口是薄转换；旧查询和论文读取幂等记录可识别，异步网络不进入 SQLite 写事务。合法主协调者进度报告保留，USER 不能假冒宿主任务身份。全局受管技能的无项目 CLI 查询仍调用同一只读 SkillService。

PR03 提供：

| 动作 | 输入与输出 |
|---|---|
| experiment_source_list | `{experimentId,revision}` 或 `{snapshotId}`；返回文件清单与固定来源元数据 |
| experiment_source_read | 同一选择器加 path/cursor/limit；返回文件摘要、内容、范围和 complete |
| experiment_source_diff | 两个选择器 from/to；返回 added/modified/deleted 和前后摘要 |
| workspace_prepare_from_revision | 选择器与外层 sessionId；从固定来源初始化空私有工作区并绑定来源 |

`snapshotId` 是项目范围内的 SourceRevision 记录标识，不是文件系统路径，也不是可随意引用的全局 CAS 摘要。输出包含 `experimentId/revision/sourceDigest`；读取还包含 `path/digest/size/cursor/end/content`，不返回内部根路径。cursor/end 是 UTF-16 字符位置，limit 默认 16000、上限 64000。diff 是文件级差异清单；需要正文时分别读取两个固定版本，未声称提供 Git 逐行 diff。

实验创建、合法源码写入、已批准子实验整合会保存不可变 CAS 版本。旧数据没有版本记录时，读取返回 NOT_FOUND；用户显式 prepare 当前 revision 才会保存 `observed-now` 记录。没有过去版本证据时拒绝猜测，不用可变当前目录冒充历史源码。空草稿也可留存源码版本，正式 Run 仍拒绝空工作区。

同一来源重复 prepare 不重置本地编辑；非空或已绑定不同来源的工作区不能被覆盖。需要另一个版本时使用新会话。初始化的来源通过宿主通知进入下一次 Pi 提示，`project_inspect` 提供当前实验 revision，避免模型猜版本。团队把选定来源纳入 planDigest，任务上下文和私有副本固定到该来源；源码中的 `task-context.json` 保留为项目文件，权威任务上下文来自数据库和 IPC。

## 撤销、恢复与执行边界

- 源码读取的权限、来源有效性和 lease 在缓存返回前重查。跨项目、越界路径、混合选择器、被撤销来源和篡改 CAS 会被拒绝。
- 来源是任务验收依据的一部分。撤销通过已有失效闭包传播到绑定来源的团队、任务、审查、提案和多层已整合子实验；即使后续提案选择了干净 baseline，也不能洗掉来源依赖。旧的无来源任务验收摘要保持兼容。
- 正在运行的助手来源失效后，宿主和工具入口均停止接收新副作用。原产物和既有运行历史保留可读。
- 运行器在 queued→submitting 的实际监管入口重新检查来源、批准、意向和清单绑定。已排队但尚未启动的失效作业取消；已启动或完成运行不会被重写成另一个实验结论。
- 文件补偿绑定最外层 SQLite 事务：回滚前逆序恢复，真正提交后才清理备份。工作区初始化、实验修订、项目/私有文本写入均覆盖；若发现事务外文件修改，拒绝覆盖并报恢复错误。
- 上述补偿解决正常同步失败，尚不等于断电或进程硬崩溃后的完整跨文件系统事务恢复。后者保留在 PR05/07，不以单测代替目标环境验收。

## 本次验证

Windows、Node 24.19.0、npm 11.17.0；依赖锁未变。

| 检查 | 证据 |
|---|---|
| 完整单元/集成回归 | [321/321，0 fail、0 skip](tests.txt) |
| 类型检查 | [通过](typecheck.txt) |
| 基线、资源固定、无依赖启动 | [4/4](parity.txt) |
| 独立干净安装/构建/类型检查及 dist 全文件对比 | [225 个文件的集合与 SHA-256 一致](clean-build-summary.json)、[文件清单](dist-manifest.json) |
| 来源/撤销/回滚/真实 supervisor 定向检查 | [21/21](targeted.txt) |
| 真实 Pi 模型 | [未启用，0 pass、1 skip](live.txt) |

关键测试确实创建了 degree=1 的项目及 degree=2 的子实验：HTTP、CLI、Pi Dispatcher 得到同一份 degree=2 代码和摘要，旧 project 读取仍为 1；私有工作区改为 3 不覆盖冻结源。这里的 Pi Dispatcher 是真实业务分派路径，不是供应商模型调用。

新增测试还覆盖：已撤销来源的缓存、跨团队多跳失效、外层 Registry 事件失败后文件与数据库同步恢复、同名任务上下文文件、已完成真实 Run 不变，以及独立 supervisor 进程拒绝失效队列且未生成 stdout/metrics/实验进程。普通数值示例的真实运行回归仍通过；这不代表通用 Docker 或任意 Python 已验收。

独立审查发现并修复了源码撞名、嵌套事务回滚、主协调者进度兼容和多跳已整合来源撤销问题。来源与队列运行前检查分别复审。未编造截图、模型用量或科学结论。

## 使用

以下占位 ID 从项目/实验/会话列表取得；SOURCE_REVISION 是明确的正整数。

```powershell
node dist/apps/cli/index.js operation experiment_source_read --project PROJECT_ID --input '{"experimentId":"EXPERIMENT_ID","revision":SOURCE_REVISION,"path":"config.json"}'
node dist/apps/cli/index.js operation workspace_prepare_from_revision --project PROJECT_ID --session SESSION_ID --input '{"experimentId":"EXPERIMENT_ID","revision":SOURCE_REVISION}' --key UNIQUE_REQUEST_ID
npm run typecheck
npm test
npm run test:parity
npm run verify:build
```

下一步是 PR04 的开发测试。Docker CLI 已安装，但本次探测 Linux engine 不在运行；未运行通用容器任务。实际模型、浏览器完整旅程、GitWorkspace、Python 沙箱以及远程/论文/分发关卡仍依原计划继续。
