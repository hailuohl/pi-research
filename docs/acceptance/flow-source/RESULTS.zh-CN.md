# 流程批次：准备实现与保存源码版本

日期：2026-09-28；基线 `5fa86bc`。验收范围在 [DELIVERY-FLOWS](../../DELIVERY-FLOWS.zh-CN.md) 固定。完整原计划保留，本批不宣称整条科研流程或全部 PR05 已完成。

## 新增可用能力

项目可以显式启用受管 Git。选定 SourceRevision 后，服务准备独立 worktree，用户或 Pi 可以查看全部获准源码差异（含 ignored/untracked、删除及执行模式），再提交为新的本地版本。准备/提交返回持久操作标识，等待期间不启动依赖工作区的模型、不接收源码写入，也不预扣助手任务预算。

实际 Git 放在应用 dataDir 的项目存储中，与本项目开发仓库无关。固定源码 ref 不重写，工作分支只前进；operation ref 保存可恢复的提交回执。SQL 发布失败后显式重试沿用同一 commit。原 dirty 目录保留，部分 checkout 仅在文件可识别为旧来源或冻结候选时恢复；其他修改报冲突，避免盲目覆盖。

Git 调用使用固定 argv 和受控配置，不执行导入项目的 hooks、filter、fsmonitor 或签名程序，不自动 push。导入从只读预检固定字节和模式，记录原 commit、去除凭据的 remote 与 dirty 语义；`.git`、凭据及运行时文件不复制。LFS 指针、子模块和链接仍明确拒绝。HTTP 重放已有导入回执不依赖原目录继续存在。

新 CAS 清单保存 100644/100755 并参与摘要；Windows 用工作区外的宿主元数据保留逻辑模式。旧清单不补字段、不改历史摘要和时间。实际 Docker 工作副本也执行相同模式；普通文件不能仅因 Windows bind mount 的权限表示被误当作可执行脚本。

CLI/API 可用入口：

```text
history-enable --project <projectId>
operation workspace_prepare_from_revision --project <projectId> --session <sessionId> --input <selector JSON> --key <requestId>
history-sync --project <projectId>
operation workspace_history_inspect --project <projectId> --session <sessionId> --input {}
operation workspace_history_diff --project <projectId> --session <sessionId> --input {}
operation workspace_history_commit --project <projectId> --session <sessionId> --input <expectedHead/message JSON> --key <requestId>
history-retry --project <projectId> --operation <failedOperationId>
```

以上是 `node dist/apps/cli/index.js` 的参数；可另加 `--data <目录>`。新工作区动作经过 Registry，用户也可通过 `/api/operations/:id` 调用。启用 Git 与失败恢复仅允许用户，分别为 `POST /api/projects/:id/git-enable`（空对象）及 `.../git-retry`（operationId）。未启用的项目保持原来源准备流程。

## 真实 Pi 环境已接通

用户提供的智谱 Coding Plan 已写入本机 Git 忽略的 `.env`，未写入版本库、测试证据或子代理任务。固定 SDK 自带的 `zai-coding-cn` 使用用户指定的 Coding 专用地址 `https://open.bigmodel.cn/api/coding/paas/v4`；选择 `glm-5.3`。专用地址与通用充值地址的区别以[智谱官方说明](https://zcode.z.ai/cn/docs/configuration)为据。

[真实调用证据](pi-live-evidence.json)记录了模型、工具事件、同一个原生会话 ID 和 SDK 返回用量。实际执行 `live_read`/`live_write`、流式文本、steer acknowledgment、恢复及 abort，结果通过。三次完成回复返回的 totalTokens 合计 1911；证据中的 cost 是 SDK 目录估算，不是 Coding Plan 的实际账单或积分。这是最小接入验收，尚未把模型驱动整条科研旅程算作通过。

## 验证与收口

- 开发阶段只运行相关源码、导入、Git、模式、工具与任务准备测试。
- [统一集成回归](integration-tests.txt)：369 通过、0 失败、2 跳过；跳过项是 Windows 无原生 POSIX chmod 与默认关闭的真实 Docker 模式测试。
- 独立收口审查发现一处 dirty 目录替换成文件的恢复阻断，已修复；[补验](git-workflow.txt)实际 Git 4/4，包括中断 checkout、同 operation 恢复、原 dirty 文件保留，以及真正不含 mode 的旧 CAS 记录。
- [Docker 模式实测](docker-modes.txt)：另行启用已通过，普通/可执行文件和含单引号、shell 符号的文件名按预期执行。
- [原基线与无依赖启动](parity.txt)通过。独立干净构建结果见同目录 `clean-build-summary.json`。

新增操作不进入 SQLite 写锁执行 Git；固定快照散列与部分文件处理仍在事务中，PR07 的锁时长和索引优化保留后续。完整跨进程分支竞争、整机中断矩阵、迁移界面与工作台证据联动尚未全部验收，不以当前测试数量代表这些能力完成。

下一批只推进闭环下一步：通用正式 Docker 运行、独立审查/批准联动和工作台结果回查。当前 Docker 与真实 Pi 环境均可用；其他后端环境另列，不阻塞本地 CPU 路径。
