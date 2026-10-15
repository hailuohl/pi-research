# analyst Task 的固定 RunGrant

所有者现在可为尚未派发的一项 `analyst` Task 固定两份已准备的 RunIntent 和一次提交额度。RunGrant 与 Team 分别批准后，任务才取得指定清单；它不能准备新清单、借用其他任务授权或让 owner 抢先消费 Task Grant。提交回执永久计次，Task 可按原 ID 读取它提交的 Run；旧主协调会话 Grant 和 owner 逐次批准入口保持可用。

剩余工作：PR08 的参数范围授权、其他 Task 角色与收益评测仍按原计划分批；PR13 外部 SSH/Slurm 主机尚无验收条件。前端布局和 PR14 桌面/团队协作继续暂缓。本批不把容器退出成功解释为科学结论。

真实后端验收在隔离项目中先准备 Grant、再分别批准 Grant 与 Team；准备和激活阶段没有模型或 Run。随后真实 Pi 的一次 analyst Task 尝试提交固定清单，Docker Run `succeeded/complete`，归档 6 项产物，Grant 使用 **1/1**。任务结束与服务重开后仍回查同一 Run、Task/Attempt/Grant、原生会话摘要及逐项产物字节；原哨兵项目记录和文件不变。另一清单的 owner 提交、跨项目 Grant 读取被拒，Run/use 数量保持 1。机器证据见 [evidence.json](evidence.json)，原生日志、数据库和对话留本机 `.validation`。

独立权限复核发现并关闭了缺失 Task 身份的 analyst 直调服务绕过。全量回归首次 882 项中 858 通过、1 项该漏洞回归失败、23 跳过；修复后受影响的 14 项通过，**无未解决失败**。干净构建 471 个文件一致，Astra 定向复核无阻断。本批未验前端或浏览器。
