# SSH 执行边界

依据已读取的上游 orx-compute 总览改写；不是宣称已获取或移植完整后端实现。

SSH 通过用户配置并探测的目标连接受信 Linux Docker 监管器，不是在远端任意执行 Shell。用户在本机 ssh-target configure/probe 固定目标别名、身份引用、known_hosts 与远端工作根；私钥和宿主路径留在私有配置，不进入 Agent、公开 RunIntent 或成果。严格校验固定主机密钥，不自动选择其他目标。

run_prepare 冻结源码、固定镜像摘要、资源与目标/引擎/监管协议摘要，经用户批准后 run_submit。远端容器禁网、只读根、非特权用户及有限 CPU/内存、PID、时间和输出，不传宿主环境、密钥或 Docker socket。日志、指标与声明产物按摘要回到原 Run；缺失或超限不能记作完整成功。

SSH→Linux Docker 的 CPU 隔离回环、嵌套源码和同 handle 恢复已有实测，不证明外部主机或 GPU。提交或观察中断时保留 unknown 与资源预留，按原唯一 handle、容器及固定目标对账，不用旧 PID 或重复提交猜测。网络断开不等于失败或取消；停止 Agent 不取消 Run。旧协议只允许身份匹配的已终态历史只读回查，新运行须重新验证当前协议。

先查 connector_status，再核对目标配置和运行条件。缺条件时说明具体限制，不把连接失败称为后端未实现，不回退调用 ORX、外部 CLI 或任意 Shell 绕过审批。
