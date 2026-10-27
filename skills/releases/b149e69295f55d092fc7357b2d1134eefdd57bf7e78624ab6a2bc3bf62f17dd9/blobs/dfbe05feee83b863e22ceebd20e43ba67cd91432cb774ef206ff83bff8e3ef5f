# SSH：固定目标的受信 Linux Docker 监管器（CPU / NVIDIA）

仅当用户选择自己的服务器或当前固定contract runner=ssh时读取。Pi不提供通用SSH Shell或已有container执行入口；当前SSH通过受信监管协议在固定Linux Docker目标创建受控CPU或NVIDIA容器。云和实例范围已排除；已验CPU回环不等于任意外部主机成功。

## 目标设置与认证

用户用资源与调度页面或已有本机CLI ssh-target configure/probe/list/get（具体参数按CLI help）固定别名、host/user/port、identityFile、knownHostsFile、规范绝对Linux remoteRoot。Agent无配置/探测这些私有目标的工具，不读取私钥或把宿主路径写入公开意向/产物。新运行（CPU或NVIDIA）均需已部署匹配版本的/usr/local/lib/pi-research/ssh-runner-gpu.py和可用Linux Docker，目标显式gpuProtocol:true；CPU不要求显卡。设置页面与常规CLI配置使用新版协议。原ssh-runner.py不覆盖，旧已启动handle继续原协议观察/取消/归档；旧queued意向或Run不可新启动，须先取消旧等待记录、更新目标并重新准备批准。用户核对SSH身份后再gpu_target_probe核对固定镜像中的设备；Agent可execution_environment_list读脱敏目录。本技能不自动部署/安装/启动服务。

当前连接显式使用固定身份文件、固定known_hosts和严格host-key校验，BatchMode/IdentitiesOnly、关闭IdentityAgent、ForwardAgent及转发、用户SSH config不自动加载。宿主配置对身份/known_hosts文件校验摘要，Agent不接触文件内容。身份/密钥文件变化使目标失效，须用户核实，不能关闭主机密钥检查。

目标配置版本变化、引擎或监管协议摘要变化都要重新探测；已有等待/运行/unknown作业时不能改配置redirect它。主机可认证不意味着容器/镜像/监管器就绪，必须核对已选择固定目标及固定image。

## 合同与提交

contract示意（全部占位须替换真实已核验值）：

```json
{"runner":"ssh","sshTargetId":"<用户已配置探测的目标ID>","image":"<真实repo>@sha256:<真实64位摘要>","command":["python","main.py"],"environment":{},"datasetVersion":"<实际数据版本>","evaluationProtocolVersion":"<实际协议版本>","metrics":{"loss":{"unit":"<真实单位>","direction":"min"}},"expectedArtifacts":["metrics.json","predictions.csv"],"timeoutSeconds":300,"cpus":1,"memoryMb":1024,"pids":128,"workMb":256,"logBytes":16777216,"outputBytes":134217728,"networkPolicy":"none"}
```

NVIDIA另加gpu:{vendor:"nvidia",deviceIds:["<已核对完整GPU-UUID>"]}；仅请求固定UUID，设备变化/不可用拒绝，无静默CPU替代。共享数据目录按UUID跨本地/Docker/SSH预留，unknown不释放；不管理应用之外占用。

ssh不能传dockerContext，docker不能传sshTargetId。首次基线确定、子节点固定继承，不用临时host/--container/--no-container/--flavor替换契约。这些flag没有入口；受控Docker层的镜像必须固定摘要。

run_prepare固定实际源码/数据/config、image、资源与目标/hostKey/config/engine/protocol摘要；用户批准此清单后run_submit。远端接收精确源文件与摘要，经原handle记录及固定容器执行；不能在远端直接训练或以SSH命令绕过清单。无需GitHubpush。

## 环境和产物

环境准备在用户已有固定镜像及提交脚本里，command始终同一argv；当前environment必须空，不能source远端宿主Conda、挂载HOME/凭据或把环境变量当变体。必要软件/路径需确实存在于执行镜像，main.py应按固定OUTPUT_DIR=/output写必需产物，不能写宿主路径。

CPU容器显式NVIDIA_VISIBLE_DEVICES=void、CUDA_VISIBLE_DEVICES=-1，不继承镜像的GPU开启配置；GPU容器显式使用获准完整UUID。已创建但尚未启动的CPU容器也须具备禁GPU设置，否则拒绝启动，不重建旁路。

容器是监管器创建的受控实例，禁网、只读根、非特权用户65534、cap-drop/no-new-privileges、有限CPU/RAM/PID/时间/work/log/output，不挂Docker socket。主机用户需合法Docker访问，Agent无sudo/用户切换/Podman/通用远程生命周期权限。禁止用“已有container”旁路获得更宽挂载/网络。

前置是当前Python3受信监管器、固定Docker引擎、可用镜像和规范remoteRoot，不走tar/Conda/现有container Shell流程，不使用任意缓存路径。实际控制与输出由原handle/宿主记录定位，远端返回受限日志、指标、声明产物和摘要；缺失/超限使完整性不足，不能当完整成功。

## 通知、取消与恢复

交互主协调者使用 run_inspect(includeScheduling:true) 读取单 Run：worker_active 表示有效监管租约；recovery_backoff/due 表示按原 handle 恢复对账；target_changed 或 legacy_target_unknown 需要用户核实固定身份。Agent不调用探测；Task/wakeup仍用无标志查询。完整工具例子和原因表见主技能。

run_submit返回不是远端完成；宿主监管器观察/持久化，再通知或按批准autoAnalyze分析。不要杀监管器、不要用新SSH会话/新目标重复启动同作业。

正式取消由用户运行面板请求，按原SSH handle与确认containerId取消受管容器；不是按全局进程组误伤无关作业。取消状态由监管实现确认，网络失败/paused/引擎不可用先保留cancelling/unknown，用户恢复目标条件后对账。容器停止/丢失/身份变更读真实错误，不自动重建已启动容器或声称取消完成。

提交/观察中断可能服务器已启动：SSH_STATE_UNKNOWN仅表示观察中断，不能当失败。保留原唯一handle、manifest/engine/protocol/container身份与资源预留，按原记录观察；不是观察超时就改PID或重复run_submit。CPU旧协议保持原路径及已有已启动handle；新CPU/GPU运行使用独立新版监管器，恢复仍匹配原handle固定协议。不得替换活跃监管器来强迫升级，新运行需用户核对相应协议。目标变化不能redirect已有Run。

## 范围与验证

已有SSH→Linux Docker的CPU隔离回环、嵌套源码与同handle恢复验证记录；外部主机、GPU运算或另一个image未由CPU记录证明。本次仅按真实探测/Run状态交付，缺权限/环境报告具体限制，不把连接失败说成后端未实现，不转供应商CLI。

保留固定来源、准备、主机与容器就绪区分、监管、取消和恢复方法；按需读取不授予代码执行或安装权限。
