# 助手正常提交、取消与故障状态

本批修复真实论文写作验收暴露的问题：助手成功提交结构化结果后，Host 原先会因 attempt 已 finished 而发送 abort，随后把 SDK 的中止消息记成供应商错误。现在 Worker 只在取得成功工具回执后，经过固定 SDK 原有 finishTurn 保存边界，清理后续消息队列并正常结束本轮；Host 允许该进程完成收尾。没有清除 aborted/error 历史来制造成功，也没有升级 SDK 或增加依赖。

任务 completed、partial、blocked 仍有不同的成果含义；正常结束会话不等于科学审查通过。用户取消、供应商失败、轮数/时间上限和异常退出仍保留失败或中断；未提交结构化结果的助手也不再显示空闲成功。提交后新任务写入继续受原租约限制，已有回执可幂等回放；进程确认退出前继续占 Worker 槽位。

## 真实模型与页面

浏览器批准智谱 `zai-coding-cn / glm-5.3` 任务 `b46443b4…`，读取原 Run 指标并保存[实际文本](worker-finish.txt)。结果为 completed/accepted，attempt 为 finished，会话 `63fe7ff0…` 正常回到 idle、无 lastError。原生 JSONL 最后一条是成功的 task_result_submit 回执，之后没有 assistant 消息，也没有 aborted/error assistant；Worker 槽位已释放。

文本为419字节，SHA-256 `dae279ea508a281eeb97b48afc2f4487a0b13b725cc8ab46b950f320c779c7dc`，固定产物 `40dfdaac…`。MSE 的科学计数表示与原值 `0.000050345031695457565` 相等。初次 task_context_read 缺少 input 字段被拒，模型随后正确调用；失败回执原样保留。文本还写了“无量纲”，与原 Run 契约的 squared-target 单位不一致，作为非阻断内容问题记录，未改写原件或宣称科学验收通过。

另一真实会话 `e1e62038…` 在输出过程中，通过页面“停止 Agent”取消。941条流式 delta 已观察到；停止后为 interrupted、generation=2，用户消息为 cancelled，原生 aborted 保留，没有被补成完整回答。取消后的最终宿主消息/用量被 generation 隔离，供应商用量未确认，不能说成零消耗。

浏览器完成批准、成果摘要回查和取消；刷新后分别保持已提交成果与中断状态。页面主标题显示的是协调会话，助手自身 idle 状态另外从持久数据库核验，二者不混称。见[浏览器证据](browser-evidence.json)、[已完成页面](completed-desktop.png)和[取消页面](cancelled-desktop.png)。本批未另外采集 console error 清单或重复窄屏测试。

## 验证与保留边界

相关检查 **59/59**；统一回归 **625项：603 pass、0 fail、22 skip**；干净安装、构建、类型检查完成，**371个 dist 文件一致**。独立只读代码复核无本批阻断。详见[验证记录](verification.json)。

新测试用实际固定 SDK、生产 Worker 和本机回环 SSE 验证：三种提交结果均只发一轮请求，原生回执完整，提交前排队及之后到达的控制消息不会再启动模型；拒绝提交仍可修正重试，供应商错误、用户中止与轮数限制不会变成成功。另用明确标记的真实子进程 IPC 夹具核对 Host、预算、槽位、迟到请求、缺结果和异常退出。夹具不是智谱或科研运行。

真实正常任务产生4条 SDK 用量观察，不能据此断言4次 HTTP 请求或实际账单。实网没有拦截供应商请求数；“提交后没有额外模型请求”由回环真实 SDK 测试直接计数，实网原生记录另证明在提交回执处结束。执行详情见[live-evidence.json](live-evidence.json)。

从上一批真实数据库备份验收：原库与副本各有1条旧 workspace-lease 变化，其他326条旧记录原字节不变；6份已有原生会话文件摘要不变，包括上一批4个 failed 论文会话。旧论文报告仍 current/verified，原 Run 和文稿未改，没有新增数值实验。

超时的新 stopError 标记拒绝之后到达的工具请求，但不代表统一撤销超时前已启动的异步操作；它们仍遵循既有持久化前租约校验。这一既有边界保留后续，不扩成本批新取消机制。下一批推进论文审查与成果包固定绑定及失效传播；其他 PR01–14 范围继续保留。
