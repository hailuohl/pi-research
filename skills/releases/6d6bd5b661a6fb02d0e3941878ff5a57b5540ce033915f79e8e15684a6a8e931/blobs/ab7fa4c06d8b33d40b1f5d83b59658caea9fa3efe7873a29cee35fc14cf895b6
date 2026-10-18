# Docker：固定 Linux 容器（CPU / NVIDIA）

只在固定 contract runner=docker 或获准 Docker 开发检查时读取。先用 execution_environment_list 读取用户已保存目录，由用户准备/核对引擎与镜像；目录不是本次连接或计算成功。正式运行通用准备、批准、提交和调度查询见主技能；不另建 provider 命令入口。

## Docker正式契约与环境准备

Docker需用户准备的可用Linux引擎及**本地已存在**固定摘要镜像，不在Run里联网拉镜像/装依赖。与上游local无image/timeout参数不同，Pi在固定contract中明确镜像与资源，不设临时运行旗标。

真实contract结构示意（不是可直接运行的镜像/数据证明，摘要取已核验镜像）：

```json
{"runner":"docker","image":"<实际repo>@sha256:<真实64位摘要>","command":["python","main.py"],"environment":{},"datasetVersion":"<实际数据版本>","evaluationProtocolVersion":"<实际协议版本>","metrics":{"loss":{"unit":"<实际单位>","direction":"min"}},"expectedArtifacts":["metrics.json","predictions.csv"],"timeoutSeconds":300,"cpus":1,"memoryMb":1024,"dockerContext":"default","pids":128,"workMb":256,"logBytes":16777216,"outputBytes":134217728,"networkPolicy":"none"}
```

main.py/predictions.csv须实际实现、config/数据和protocol必须真实；root experiment_plan_submit才设contract，子节点继承。正式资源服务支持cpus1–64、memoryMb64–65536、timeout1–86400秒、pids16–512、workMb16–1024；只有带证据的需要才扩大，不能悄悄改变已有同树合同。

GPU合同额外声明gpu；用户用gpu_target_probe核对固定context和镜像。正式容器仅请求获准UUID，检查实际DeviceRequests，不能扩大为all。不传gpu保持CPU路径，显式NVIDIA_VISIBLE_DEVICES=void、CUDA_VISIBLE_DEVICES=-1关闭GPU；开发development_*仍为CPU。已created但未启动的CPU容器缺少这些设置时拒绝启动，不重建旁路。

容器禁网、只读根、非特权65532:65532用户、cap-drop/no-new-privileges、有限CPU/内存/PID/时间/工作区/日志/输出，不传宿主env或密钥，不挂载Docker socket。固定源码只读传入，runner复制到隔离工作目录；本机Docker及开发测试写声明产物至PI_OUTPUT_DIR（/output），SSH则使用OUTPUT_DIR。只声明expectedArtifacts不会复制工作目录文件，不能假定私有worktree可写。command作为原样argv进入固定bootstrap，不自动把训练文本当Shell脚本。

## 开发Docker检查

已有development_*服务，可在自己的来源worktree检查代码；与正式Run分开。development_prepare至少command和environmentImageDigest，输入实际command argv、已核验repo@sha256镜像，必要时expectedArtifacts和有限resources（cpus1–8、memory64–8192、timeout≤600秒等）；用户批准后development_submit({input:{developmentTaskId:"<真实ID>"}})。

示例开发目的：对已存在main.py执行用户选定的最小自检命令，产生真正测试报告；不能因本参考存在就新增脚本/安装包。development_inspect/logs读取真实state/integrity/exitCode/artifactIds，development_cancel只能取消自己获准检查。WorkingGrant若开启固定editablePaths、测试命令/镜像、数据/源和maxTests；额度/字节/过期边界不能通过重建会话绕开。开发job成功不自动采纳成果、整合或批准正式Run。

## 监管、失败与恢复

宿主持久化监管器，Agent结束不取消；不要杀监管器。正式取消是用户Run面板请求，待真实cancelled和资源释放；它只处理受管作业，不应动无关程序。运行从冻结source执行，未整合会话文件不混入。

sourceDigest、manifestDigest、固定引擎/容器ID和镜像ID用于恢复；为兼容未能证明GPU隔离的旧容器，新GPU还会等待全部非终态CPU Docker作业（含开发/文档/文稿）及旧版SSH作业结束；CPU可继续调度，不按日期猜旧容器参数。unknown保留原作业与预留，确认是否已创建/启动再观察，不新建Run、不用过期PID猜取消。只接受同容器身份恢复，确认已启动容器丢失则失败，不能自动重建重跑。环境/日志/产物超限读取真实error，缺必需文件不得静默记完整；观察超时不等执行超时。

后续通知逐完成对账所有获准Run，读stdout/stderr分页、metrics/evidence、运行时source，按pi-research-experiment-tree区分未回答/冻结。两次未回答/共享设置错误停止补证据，不用扩大shape掩盖bug。

## 范围与来源

交互主协调者读取 run_inspect(includeScheduling:true) 的当前队列观察，target_unresolved/unavailable/changed 交用户核对原目标；gpu_busy 等待确认终态，不能删除 unknown 记录腾位。配额等待与实际容器失败分别解释；Task/wakeup 仍使用原 Run 查询。

从本项目 references/local.md 分离 Docker 合同与开发检查，复用既有 Linux Docker 执行能力。研究方法基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 agent-skills/orx-compute/SKILL.md（blob 60566d92cd5e86f1d6684d731444af512531ea0c）和 references/local.md（blob e0c1df9c6a516dfc0fd2d3bf82206ad8a0592e45），MIT，Copyright (c) 2026 alphaXiv。上游没有此同名 Docker 参考；这是当前项目的能力适配，资源读取不授予执行/安装权限。
