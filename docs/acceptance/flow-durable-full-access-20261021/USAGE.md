# 完全访问的持续研究任务

本功能使用现有 Pi 执行内核及本机受信执行环境。前端仅更新现有权限控件的说明与授权接线，不变更布局。

## 授权与额度

旧完全访问授权保持原有 scope1 语义。需要持续研究时，先撤销旧授权，再在现有完全访问入口明确接受新范围。任务总次数和总时长的 `null` 表示无上限；正整数或零表示明确的有限额度。无限总量不改变单次实验 timeout、计算并发、资源检查、来源核验或撤权。

API 使用现有本机服务入口。先读取 `GET /sessions/{sessionId}/permissions` 中的 `hostAccess.version`，再向 `POST /sessions/{sessionId}/host-access` 提交：

```json
{
  "enabled": true,
  "expectedVersion": 0,
  "acknowledgedSameUserAccess": true,
  "acknowledgedResearchAutomation": true,
  "researchAutomationPolicy": {
    "version": 2,
    "limits": {
      "development": null,
      "run": null,
      "continuations": null,
      "durationMs": null
    },
    "recoverAfterRestart": true
  }
}
```

示例中的 `expectedVersion` 必须替换为刚读取的实际版本。有未确认宿主命令时，应先核对原进程与外部效果，再按已有流程显式接受；不能把 unknown 当作未执行。

`recoverAfterRestart: true` 允许核对后在原授权范围继续研究计算；`false` 要求明确恢复。宿主 Shell 权限仍在服务重启后失效。记录中的已用、预留和未知用量不会因恢复或追问而归零。旧任务不因新增策略自动扩权。

## 暂停、恢复与取消

通过 `GET /sessions/{sessionId}/research-continuations` 查找本会话的任务；标识也沿准确批准的 `fullAccess.continuationId` 保存。使用 `GET /research-continuations/{id}` 读取当前任务和版本，向 `POST /research-continuations/{id}` 提交 `pause`、`resume` 或 `cancel` 动作：

```json
{"action": "pause", "expectedVersion": 1}
```

版本必须来自最新读取，失败后先读取真实状态，不盲目重放。暂停阻止新的计算派发，仍获准的在途作业可结束并归档；取消与撤权不会被自动恢复条款复活。恢复只沿原任务、剩余额度、固定模型/来源继续。

Agent 使用 `research_task_checkpoint` 记录 `completed`、`waiting` 或 `needs_attention`，并引用本任务的真实 Run/开发测试记录。任务阶段完成不等于科学结论成立。已准确授权但尚未提交的准备阶段可以继续提交；没有新进展的模型恢复不重复空转。

## 失败修复和恢复边界

普通非零退出可以产生可信的技术诊断，失败记录仍保留失败及科研产物完整性状态。修复必须使用独立候选和新源码快照，经测试及适用的独立审查后产生新 Run；不得修改旧 Run、原冻结实验或受控科学契约。

恢复首先核对既有 intent、job、启动与终态回执。已有作业继续观察或补归档，不能因为响应丢失就重复启动。未知执行、伪造/不匹配回执、未确认进程退出或来源失效会阻断自动动作。程序退出后的计算断点续跑仍取决于实验本身是否保存了可核验 checkpoint；系统不会恢复旧 PID 对应的内存状态。
