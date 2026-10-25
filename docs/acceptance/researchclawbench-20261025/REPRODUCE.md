# 本机复现与结果位置

本批使用本机冻结源码、已准备的官方输入和摘要固定的 Docker 镜像。Git 保存适配器、测试、协议和精简证据；完整冻结快照、研究输入、报告、凭据及原生历史仍在本地。仅从远端 checkout 不能重建当时的未提交源码和基础镜像。

本地根目录：`D:\项目\pi research\tmp\researchclawbench-20261025`。

- `project-snapshot.json`：3407 个冻结源文件的原始 receipt；完整文件摘要见 PROTOCOL。
- `prepared-tasks.json`：40 项原始输入的位置及文件摘要。
- `runs-max/<task>/attempt-*/workspace/report/report.md`：模型报告。
- `workspace/code/`、`outputs/`、`report/images/`：已核验的源码和输出导出。
- `evaluation.json`：作业、审批、来源摘要、恢复窗口和评分绑定。
- `recovery-history/`、`scoring-history/`：原失败、报告和评分版本。
- `private/`：含凭据、数据库和原生对话，禁止纳入 Git 或附件。

当前完整队列运行时不要启动第二份。以下命令用于未来复现，另建输出根目录以保留现有结果。密钥只通过本地配置路径读取。

```powershell
$evalRoot = 'D:\项目\pi research\tmp\researchclawbench-20261025'
$modelFile = 'D:\项目\pi research\pi-research\.validation\experiment-dialogue\preview-data\model-connections.json'
$taskInput = (Get-Content "$evalRoot\prepared-tasks.json" -Raw | ConvertFrom-Json | Where-Object task_id -eq 'Earth_001').workspace
$protocol = Get-Content 'D:\项目\pi research\pi-research\docs\acceptance\researchclawbench-20261025\PROTOCOL.json' -Raw | ConvertFrom-Json
node "$evalRoot\project-snapshot\scripts\benchmark-researchclaw.mjs" --repo-root "$evalRoot\project-snapshot" --project-provenance "$evalRoot\project-snapshot.json" --benchmark-root "$evalRoot\upstream" --output-dir "$evalRoot\runs-reproduce" --model-config $modelFile --task Earth_001 --workspace $taskInput --image $protocol.resources.cpuImage --timeout-seconds 1800
```

GPU 路径额外传入 `--gpu-image` 和三次 `--gpu-device`，值必须与 PROTOCOL 的已授权可见设备集合一致。CPU 路径的正式 Run 未在本批启用。两份 [Docker 构建记录](environment/Dockerfile.cpu) / [GPU 构建记录](environment/Dockerfile.gpu) 依赖本机基础镜像，且安装命令有浮动版本；准确被测环境以镜像 digest、已保存的版本清单为准，不承诺重新构建得到同一摘要。

原会话恢复仍传入相同 repo、benchmark、provenance、model-config、task、image 和 GPU 参数，并以 `--resume-attempt` 指向原目录；只选择一个恢复策略：

- `--retry-message-id FAILED_USER_MESSAGE_ID`：精确失败消息，含有/无 effect 和旧期限检查。
- `--dead-host-followup`：只支持已证明原进程退出的单协调者 CPU 历史；其他自动工作来源会阻断。
- `--rejected-action-id REJECTED_ACTION_ID`：只处理本次最后的未开放操作拒绝，不执行旧动作，也不复活旧授权。

恢复会增加独立审计窗口；不会重新导入数据、重置模型或延长旧作业 manifest 的期限。原进程尚在或状态未知时不应重复启动。创建 `attempt/stop-requested` 可请求该 attempt 正常收尾；不要结束存在子进程的队列父进程。

评分独立执行：

```powershell
& "$evalRoot\judge-venv\Scripts\python.exe" -X utf8 'D:\项目\pi research\pi-research\scripts\score-researchclaw.py' --benchmark-root "$evalRoot\upstream" --model-config $modelFile --workspace '完整 attempt 路径\workspace'
```

评分前保留已有 score/status/evaluation，报告或图片发生变化后不能复用旧分。不得筛掉中间图片改善分数。评分失败或缺报告不填造 0 分。

本次检查：`node --test tests/unit/benchmark-researchclaw.test.mjs`；裁判 `--self-check`；在上述本地根目录运行 batch 脚本 `--self-check`。batch 可用任务局部环境变量 `RCB_SUPERVISOR_INSTANCE` 隔离 control/state。跨实例资源总额由主代理约束；仅在对子进程和实际作业对账后确认 attention，provider 重置 nonce 不可重复使用。
