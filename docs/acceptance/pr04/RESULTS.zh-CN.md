# PR04 开发沙箱验收

日期：2026-09-28。开发基线：`d89177f`（v0.3.1 派生）。本关已实现并在本机 Linux 容器实际执行；完整优化计划仍在推进。

## 实现与调用

新增 DevelopmentTask、SandboxJob 和独立 execution-worker。`development_prepare` 固定当前会话源码、argv、镜像 digest、只读数据、资源和截止时间，并请求 `development.test` 审批。用户批准精确清单后，`development_submit` 返回稳定 jobId；`development_inspect`、`development_logs`、`development_cancel` 查询、按字节分页读日志和取消。五个操作经过同一 Registry、HTTP、CLI、Pi 工具契约；现在共有 42 套输入/输出契约。

执行由服务调度器启动，独立进程监管；工具调用不等待测试结束。只允许本机 Unix socket/named-pipe Docker context、已安装的 `image@sha256:digest` Linux 镜像；worker 不自动拉镜像。容器以 UID/GID 65532 运行，禁网、只读根目录、全部 capability 移除、no-new-privileges，源和明确授权的数据只读。工作区使用有限 tmpfs，只有专属输出目录可写入宿主。宿主不执行模型命令的 shell 字符串；容器内固定 bootstrap 按 argv 执行。

审批、来源、任务 attempt/generation 在真正启动前复核；旧 worker 不能写新 generation。提交使用持久 job/container identity，恢复先查已有容器。失联保持 unknown；确认容器消失才以 incomplete 结束。启动请求落库后尚未真正启动的模糊状态不会重跑：按已核对 ID 清除未启动容器并确认停止，取消可释放队列。恢复或日志中断不能声明完整成功。

stdout/stderr、测试报告和安全普通输出均归档，失败也留证。报告明确 `scientificConclusion: false`。成功且完整的 job 可通过 `testJobId` 绑定 ChangeProposal；prepare 和 apply 都检查精确候选源码 digest、来源授权及归档字节。私有工作区后续变化不修改历史结果；新源码不能借用旧测试。未绑定 job 的旧提案继续显示 `not_run`，没有自动批准或科学 Run。

## 实际验证

Windows / Node 24.19.0 / npm 11.17.0；Docker Desktop 4.91.0，Linux Engine 29.8.0，amd64。固定镜像：

```text
python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
```

| 检查 | 结果 |
|---|---|
| 全量单元/集成回归 | 349/349，0 fail、0 skip |
| 最后修改后的 Registry/runtime 定向回归 | 9/9 |
| 基线固定、资源与无 node_modules 启动 | 4/4 |
| 类型检查、独立干净安装及构建 | 通过；[dist 清单](dist-manifest.json)与当前预构建文件完全相同，见[构建摘要](clean-build-summary.json) |
| 真实 Docker 验收 | 12/12（父测试和 11 项子检查），0 skip；[逐 job 结果及真实日志/报告](live-results.json) |

真实验收实际执行 Python unittest 的数值断言与隔离检查：只读源/数据及根目录写入被拒，测试专用宿主密钥环境变量不进入容器，宿主 canary 文件不可读，外部网络连接失败。控制 HTTP 服务关闭后 worker 仍完成任务。故意 SyntaxError、AssertionError 均退出 1，并保留完整 stderr。

超时和取消都终止了包含 Python 子进程的所属容器，实际退出 137。杀死 worker 后恢复同一容器，输出计数仍为一次；由于日志连续性不可证明，结果是 exit 0 / failed / incomplete。杀死仅该 worker 的 Docker attach 进程后，Python 最终退出 0，也不会误报成功。缺文件、输出超限和日志超限均为 incomplete；日志上限 128 字节的测试确实只归档 128 字节 stdout。模糊启动取消确认原容器不存在且没有执行程序。

这些容器运行的是本次新增 Python 源码，不是原示例的哈希白名单运行器；测试过程中没有创建科学 Run，也没有自动生成新实验节点。完整本机数据与产物保留在 `.validation/development-live-EJ7Bka/`。验收只使用人工创建的 canary，未读取个人凭据。

```powershell
npm run build
$env:PI_DEVELOPMENT_LIVE='1'
$env:PI_DEVELOPMENT_CONTEXT='desktop-linux'
$env:PI_DEVELOPMENT_IMAGE='python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f'
node --test --test-concurrency=1 tests/live/development-live.test.mjs
```

## 环境修复与边界

本机 Docker Desktop 启动原先被遗留的零字节 socket reparse point 阻断。完全停止本次启动的 Desktop 后，将两个 socket 运行时目录保留为备份后重启；未重置镜像、卷、WSL 磁盘或凭据。备份在 `%LOCALAPPDATA%\Docker\run.pr04-backup-20260928-{110821,112612}` 和 `%LOCALAPPDATA%\docker-secrets-engine.pr04-backup-20260928-111826`。实际启动还发现 local 日志驱动的单文件轮转不能启用默认压缩，已显式设 `compress=false`，无全局 daemon 修改。

当前仅一个开发沙箱同时执行。输出采用监测停止和有界归档，尚无宿主文件系统硬配额；单文件归档上限 32 MiB，超限不报 complete。PR07 继续资源预留、硬容量治理、索引和性能验证。已结束容器与本机验收目录暂留作证据，尚无自动保留期清理。

本关验证的是服务/API/执行器；专用工作台页面与真实浏览器操作旅程属于 PR09，真实 Pi 供应商调用仍待配置。尚未宣称 Docker daemon 关闭/整机断电恢复、GPU、远程后端或正式科学 RunnerAdapter 已通过。PR05–14 及整体科研闭环目标均保持未完成。
