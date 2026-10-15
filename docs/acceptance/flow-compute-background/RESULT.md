# 后台计算资源检测与主 Agent 目录

2026-10-08，基线 cd9e65ca963774f8dbca4771ea93124d77dcb19b。

正式本地服务启动即检测当前 Docker context 与已信任 SSH，约20秒继续检测，关闭页面不停止；每个目标独立推进。同进程 Docker 完整观察及落盘、SSH 核验共用各自的目标门，后台遇正在核验的目标跳过，队列和手动调用等待后重新核验。服务关闭停止调度并等待探测结束；SSH错误先终止进程，未退出时升级SIGKILL，观察close后才结算。

目录纯读本机硬件与已保存运行时、Docker资源、SSH CPU/内存、CPU/GPU偏好、已核验GPU及真实Run选择标识，不暴露认证文件或SSH owner字段给Agent。交互主Agent把目标写入完整运行contract，参数config不选择后端；父契约不改，仍沿现有计划、准备、审批、提交链。未核验、失败、过期、环境准备锁或身份变化均不能宣称可调用，不自动安装、信任指纹或运行GPU容器。

仅首次尚无verified身份且无作业/安装锁的可信目标，允许在网络后重核配置、版本、attempt和空闲条件建立未来Run身份；已有固定身份、manifest、历史不改。默认测试HTTP与ResearchApp不联网，正式index显式启动监测。

验收五条覆盖服务生命周期、信任/冻结边界、安全资源目录、主Agent契约与审批、重开与页面纯读。页面默认context、Docker观察互斥、Agent契约说明及SSH物理退出四项复核阻断均已修复，有实际修前失败回归；独立Astra/xhigh对v2定向复核7/7通过，无新增阻断。

- 固定v1全量：1302项，1278通过、0失败、24跳过。必要v2后14个受影响计算/SSH/GPU/队列/审批/HTTP测试文件：114项，111通过、0失败、3跳过；适用的其余全量结果复用。
- 最终v2干净npm ci、build、typecheck均退出0，577个产物逐文件一致；UI12/12与两种SSH传输退出回归通过。
- 真实本地Docker29.8.1/Linux与自有一次性LinuxSSH：未打开页面即就绪、20秒后时间更新、helper与固定目标未改、SSH断线撤CPU且Docker继续、关闭/重开恢复已保存目标均通过；v2浏览器无需点检测，默认Docker和SSH资源自动显示。
- parity旧基线仍3通过、1失败：引用不存在的skills/openresearch/manifest.json，本批未改无关在途文档。外部SSH、真实GPU科研作业和真实模型研究结论不在本批实测范围。

非阻断后续待办：手动更换SSH引擎但旧GPU观察未过期时，gpuStatus文案可能仍verified；实际GPU能力/设备已撤销，不能据此执行。跨进程仍沿现有CAS和队列lease，未宣称新增全局串行。

v2源清单 .validation/compute-background/source-manifest-v2.json，SHA256 8678394F85906A84DD4F0E602E83BDF57DE2C2F99E5126A026458D948A066DA9。监管器原字节未改，SHA256 4B4E81DBA581B7CF7F5C8B344CF33F701BED3E3FF32CDBAC83452699455DF54C。

Sol/high实施、Astra/xhigh复核均已显式请求，运行时未回显；主代理前端、传输关闭必要修复、集成及交付，未改变主会话配置。原日志、测试运行库、认证文件和截图留在本机.validation/compute-background，不复制原始日志或凭据到Git。最终提交SHA/分支/远端链接由交付回复记录。

原4794地址已更新，15个项目/会话/实验/运行/产物记录ID与重启前一致；不打开页面也观察到本地Docker checkedAt周期更新。后台Start-Process命令自动审批被拒（仅blocked by policy），已改用可观察终端会话86631运行正式服务。
