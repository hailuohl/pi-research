# 本机 local、固定示例与 Docker

本参考适配上游 local 指南；只在用户选择本机或当前已确认contract使用本机时读取。Pi不提供上游任意本机脱离监管执行入口，也不自动替换所选后端。当前支持用户配置的local正式Run、固定示例、Linux Docker正式Run/CPU开发检查、日志与取消/恢复；NVIDIA是明确设备选择。环境探测记录不等于本次运算成功。

## 本机共享资源与固定示例

本机计算与其他工作共享CPU、RAM、磁盘，队列/资源上限需核对。优先用于小规模/CPU工作；大作业仍在当前受支持且用户指定的本机/SSH边界内，不能自行转云。实例和云由用户排除；NVIDIA按已核对完整UUID选择，未知占用不可绕过。

trusted-example只执行随包examples/curve-fit/experiment.mjs的精确入口哈希及EXAMPLE_CONTRACT。固定command:["node","experiment.mjs"]、environment:{}、数据synthetic-quadratic-v1、协议deterministic-split-180-60-v1、mse/r2/train_mse、产物metrics.json/predictions.csv/model.json、1 CPU/256 MiB/30秒。config只允许polynomialDegree(0–5)、ridge(0–10)及可选sleepMs(0–10000)、omitMetrics(bool)。它不是任意宿主沙箱，改入口不能用示例runner执行；示例数据不是论文复现或材料结论。

run_prepare冻结实验源快照后用户批准、run_submit实际排队；不要在worktree直接调用node experiment.mjs宣称正式Run。Run工作/控制位置来自宿主记录，不沿用上游local-runs路径，也不硬编码数据目录。

## 本地正式执行与NVIDIA

用户在资源与调度保存local_runtime_configure的id/executable/expectedVersion；只使用本机已有程序，不安装依赖。Agent用execution_environment_list读取脱敏目录：运行环境ID、版本、摘要和平台；公开manifest不含可执行程序绝对路径。配置变更使旧意向失效，活动Run使用中的配置不可替换。

首根contract使用runner:"local"、localRuntimeId:"<真实ID>"、command:["<同一ID>","main.py"]，environment:{}、networkPolicy:"host"；数据/协议/指标/产物及CPU/RAM/timeout仍完整声明。入口是参数数组，不走Shell。源码从获准快照执行，输出写PI_OUTPUT_DIR。local拥有当前用户权限，没有文件或网络隔离，CPU/RAM只是调度预算，不能把它称为安全沙箱；固定示例保持原专用规则。

NVIDIA先由用户gpu_target_probe核对local目标及已保存Python运行环境；需要已有驱动和Python可访问CUDA Driver。GPU正式contract另加gpu:{vendor:"nvidia",deviceIds:["<已核对的完整GPU-UUID>"]}。运行传入明确CUDA_VISIBLE_DEVICES，启动前验证身份；设备缺失/变更拒绝，不回退其他GPU或CPU。程序需要的PyTorch等库必须已在用户选择的环境中具备；探测成功不证明训练库兼容或实验成功。其他电脑仍可用CPU、Docker或SSH。

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

## 与上游差异及来源

上游local是机器自身环境的detached进程、无flavor/host/image/timeout选项，抽出源码再执行，取消进程组、orx supervise监管。本项目保留固定源码/非worktree训练/共享资源/监管/取消方法，改为受管local、固定示例或Linux Docker，显式CPU/NVIDIA、清单资源/身份/批准/恢复；不存在orx supervise、local-runs路径或无审批任意宿主执行。

基于alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835的agent-skills/orx-compute/references/local.md，blob e0c1df9c6a516dfc0fd2d3bf82206ad8a0592e45，MIT，Copyright (c) 2026 alphaXiv。本地改写不是上游原版执行认证；资源只按需读取，不授予执行/安装权限。
