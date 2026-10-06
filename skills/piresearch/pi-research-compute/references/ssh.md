# SSH：固定目标的受信 Linux Docker 监管器（当前CPU）

仅当用户选择自己的服务器或当前固定contract runner=ssh时读取。Pi不是上游通用SSH Shell/已有container执行层；当前SSH通过受信监管协议在固定Linux Docker目标创建受控CPU容器。云和实例范围已排除，GPU资源分配尚未接入；已验CPU回环不等于任意外部主机成功。

## 目标设置与认证

用户用已有本机CLI ssh-target configure/probe/list/get（具体参数按CLI help）固定别名、host/user/port、identityFile、knownHostsFile、规范绝对Linux remoteRoot。Agent无配置/探测这些私有目标的工具，不读取私钥或把宿主路径写入公开意向/产物。目标需已部署匹配版本的/usr/local/lib/pi-research/ssh-runner.py和可用Linux Docker；本技能不自动部署/安装/启动服务。

当前连接显式使用固定身份文件、固定known_hosts和严格host-key校验，BatchMode/IdentitiesOnly、关闭IdentityAgent、ForwardAgent及转发、用户SSH config不自动加载。与上游“SSH config、key和agent，不读取私钥”不同：Pi宿主配置对身份/known_hosts文件校验摘要，Agent不接触文件内容。身份/密钥文件变化使目标失效，须用户核实，不能关闭主机密钥检查。

目标配置版本变化、引擎或监管协议摘要变化都要重新探测；已有等待/运行/unknown作业时不能改配置redirect它。主机可认证不意味着容器/镜像/监管器就绪，必须核对已选择固定目标及固定image。

## 合同与提交

contract示意（全部占位须替换真实已核验值）：

```json
{"runner":"ssh","sshTargetId":"<用户已配置探测的目标ID>","image":"<真实repo>@sha256:<真实64位摘要>","command":["python","main.py"],"environment":{},"datasetVersion":"<实际数据版本>","evaluationProtocolVersion":"<实际协议版本>","metrics":{"loss":{"unit":"<真实单位>","direction":"min"}},"expectedArtifacts":["metrics.json","predictions.csv"],"timeoutSeconds":300,"cpus":1,"memoryMb":1024,"pids":128,"workMb":256,"logBytes":16777216,"outputBytes":134217728,"networkPolicy":"none"}
```

ssh不能传dockerContext，docker不能传sshTargetId。首次基线确定、子节点固定继承，不用临时host/--container/--no-container/--flavor替换契约。上游这些flag在Pi没有入口；镜像在此受控Docker层是必需摘要，与上游SSH --image不支持的含义不同。

run_prepare固定实际源码/数据/config、image、资源与目标/hostKey/config/engine/protocol摘要；用户批准此清单后run_submit。远端接收精确源文件与摘要，经原handle记录及固定容器执行；不能在远端直接训练或以SSH命令绕过清单。无需GitHubpush。

## 环境和产物

环境准备在用户已有固定镜像及提交脚本里，command始终同一argv；当前environment必须空，不能source远端宿主Conda、挂载HOME/凭据或把环境变量当变体。必要软件/路径需确实存在于执行镜像，main.py应按固定OUTPUT_DIR=/output写必需产物，不能写宿主路径。

容器是监管器创建的受控实例，禁网、只读根、非特权用户65534、cap-drop/no-new-privileges、有限CPU/RAM/PID/时间/work/log/output，不挂Docker socket。主机用户需合法Docker访问，Agent无sudo/用户切换/Podman/通用远程生命周期权限。禁止用“已有container”旁路获得更宽挂载/网络。

上游要求Bash/tar/setsid --wait/已运行Linux container及绝对可写HOME，本项目不走tar/Conda/现有container Shell流程；前置是当前Python3受信监管器、固定Docker引擎、可用镜像和规范remoteRoot。不照搬~/.orx/runs或container HOME缓存路径。实际控制与输出由原handle/宿主记录定位，远端返回受限日志、指标、声明产物和摘要；缺失/超限使完整性不足，不能当完整成功。

## 通知、取消与恢复

run_submit返回不是远端完成；宿主监管器观察/持久化，再通知或按批准autoAnalyze分析。不要杀监管器、不要用新SSH会话/新目标重复启动同作业。

正式取消由用户运行面板请求，按原SSH handle与确认containerId取消受管容器；不是按全局进程组误伤无关作业。不承诺上游固定TERM五秒/KILL细节；Pi由监管实现确认状态，网络失败/paused/引擎不可用先保留cancelling/unknown，用户恢复目标条件后对账。容器停止/丢失/身份变更读真实错误，不自动重建已启动容器或声称取消完成。

提交/观察中断可能服务器已启动：SSH_STATE_UNKNOWN仅表示观察中断，不能当失败。保留原唯一handle、manifest/engine/protocol/container身份与资源预留，按原记录观察；不是观察超时就改PID或重复run_submit。旧监管协议只允许匹配身份且已终态的status/result历史只读回查，新运行必须用户重新验证当前协议。目标变化不能redirect已有Run。

## 范围、验证及来源

已有SSH→Linux Docker的CPU隔离回环、嵌套源码与同handle恢复验证记录；外部主机/GPU/另一个image未由该记录证明。本次仅按真实探测/Run状态交付，缺权限/环境报告具体限制，不把连接失败说成后端未实现，不转ORX/provider CLI。

基于alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835的agent-skills/orx-compute/references/ssh.md，blob 7f35e7366a630b60e0f86e2ca628e27eb8a3fd2b，MIT，Copyright (c) 2026 alphaXiv。本地适配保留固定来源/准备/主机与容器就绪区分/监管/取消/恢复方法，改变上游执行模型；按需读取不授予代码执行/安装权限。
