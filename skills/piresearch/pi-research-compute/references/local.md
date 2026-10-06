# local 兼容边界

依据已读取的上游 orx-compute 总览改写；不是宣称已获取或移植完整后端实现。

trusted-example 只运行随包固定数值程序，源码哈希不同即拒绝。Docker 代码需要固定镜像摘要，禁止网络和超权限挂载，尚未真实容器验收。走 run_prepare → 用户批准 → run_submit；日志、取消与产物由现有 Runner 监管。CPU/内存限制不是 GPU 调度。改变源码必须新批准，关闭会话不删除 Run。

先查 connector_status。不可用就报告未实现，不回退调用 ORX、供应商 CLI 或任意 Shell。
