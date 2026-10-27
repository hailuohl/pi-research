# 本机 local 与固定示例

本参考适配上游 local 指南；只在用户选择本机或当前已确认contract使用本机时读取。Pi不提供上游任意本机脱离监管执行入口，也不自动替换所选后端。当前支持用户配置的local正式Run、固定示例、日志与取消/恢复；NVIDIA是明确设备选择。环境探测记录不等于本次运算成功。

## 本机共享资源与固定示例

本机计算与其他工作共享CPU、RAM、磁盘，队列/资源上限需核对。优先用于小规模/CPU工作；大作业仍在当前受支持且用户指定的本机/SSH边界内，不能自行转云。实例和云由用户排除；NVIDIA按已核对完整UUID选择，未知占用不可绕过。

trusted-example只执行随包examples/curve-fit/experiment.mjs的精确入口哈希及EXAMPLE_CONTRACT。固定command:["node","experiment.mjs"]、environment:{}、数据synthetic-quadratic-v1、协议deterministic-split-180-60-v1、mse/r2/train_mse、产物metrics.json/predictions.csv/model.json、1 CPU/256 MiB/30秒。config只允许polynomialDegree(0–5)、ridge(0–10)及可选sleepMs(0–10000)、omitMetrics(bool)。它不是任意宿主沙箱，改入口不能用示例runner执行；示例数据不是论文复现或材料结论。

run_prepare冻结实验源快照后用户批准、run_submit实际排队；不要在worktree直接调用node experiment.mjs宣称正式Run。Run工作/控制位置来自宿主记录，不沿用上游local-runs路径，也不硬编码数据目录。

## 本地正式执行与NVIDIA

用户在资源与调度保存local_runtime_configure的id/executable/expectedVersion；只使用本机已有程序，不安装依赖。Agent用execution_environment_list读取脱敏目录：运行环境ID、版本、摘要和平台；公开manifest不含可执行程序绝对路径。配置变更使旧意向失效，活动Run使用中的配置不可替换。

首根contract使用runner:"local"、localRuntimeId:"<真实ID>"、command:["<同一ID>","main.py"]，environment:{}、networkPolicy:"host"；数据/协议/指标/产物及CPU/RAM/timeout仍完整声明。入口是参数数组，不走Shell。源码从获准快照执行，输出写PI_OUTPUT_DIR。local拥有当前用户权限，没有文件或网络隔离，CPU/RAM只是调度预算，不能把它称为安全沙箱；固定示例保持原专用规则。

NVIDIA先由用户gpu_target_probe核对local目标及已保存Python运行环境；需要已有驱动和Python可访问CUDA Driver。GPU正式contract另加gpu:{vendor:"nvidia",deviceIds:["<已核对的完整GPU-UUID>"]}。运行传入明确CUDA_VISIBLE_DEVICES，启动前验证身份；设备缺失/变更拒绝，不回退其他GPU或CPU。程序需要的PyTorch等库必须已在用户选择的环境中具备；探测成功不证明训练库兼容或实验成功。其他电脑仍可用CPU、Docker或SSH。

Docker 正式执行或开发检查时改读 `references/docker.md`，无需同时加载两份指南。

## 从本地 CPU 基线到正式 Run

前置：用户已导入包含 main.py 的真实源码、配置名为 python 的现有运行环境，程序已按 PI_OUTPUT_DIR 输出声明文件。python 是此例的环境 ID，调用前替换为已保存真实 ID；数据/协议/指标名称也应来自实际研究。仅新根节点设合同，子实验继承合同。

```json
{"tool":"experiment_plan_submit","input":{"title":"本地基线","hypothesis":"建立固定评价基线","config":{},"contract":{"runner":"local","localRuntimeId":"python","command":["python","main.py"],"environment":{},"datasetVersion":"<实际数据版本>","evaluationProtocolVersion":"<实际协议版本>","metrics":{"loss":{"unit":"<真实单位>","direction":"min"}},"expectedArtifacts":["metrics.json","predictions.csv"],"timeoutSeconds":300,"cpus":1,"memoryMb":1024,"pids":128,"workMb":256,"logBytes":16777216,"outputBytes":134217728,"networkPolicy":"host"}}}
```

返回实际 experiment.id 后，按主技能的 run_prepare → 用户批准精确清单 → run_submit → run_inspect/run_logs 例子走通；不能对未导入源码或缺失文件使用这份合同。需要 NVIDIA 时在首次合同中加入前节 gpu 字段，deviceIds 必须逐个取自已保存且用户核对的目标目录，不能复制示例 UUID。CPU 基线已有结果后换 GPU 属于比较边界变化，不能直接改原树。目标不具备 GPU 时留在 CPU 合同或交用户选择已支持目标，不假装 GPU 请求成功。

## 监管、失败与恢复

交互主协调者用 run_inspect 的 includeScheduling:true 读取单 Run：gpu_busy 等待原预留；worker_active 继续观察；manual_recovery_required 交用户恢复原环境。目标目录是保存的观察，不在读操作中探测。具体原因与工具完整例子见主技能“读取当前调度观察”。Task/wakeup 不请求该扩展。

宿主持久化监管器，Agent结束不取消；不要杀监管器。正式取消是用户Run面板请求，待真实cancelled和资源释放；它只处理受管作业，不应动无关程序。运行从冻结source执行，未整合会话文件不混入。

sourceDigest、manifestDigest、固定引擎/容器ID和镜像ID用于恢复；为兼容未能证明GPU隔离的旧容器，新GPU还会等待全部非终态CPU Docker作业（含开发/文档/文稿）及旧版SSH作业结束；CPU可继续调度，不按日期猜旧容器参数。unknown保留原作业与预留，确认是否已创建/启动再观察，不新建Run、不用过期PID猜取消。只接受同容器身份恢复，确认已启动容器丢失则失败，不能自动重建重跑。环境/日志/产物超限读取真实error，缺必需文件不得静默记完整；观察超时不等执行超时。

后续通知逐完成对账所有获准Run，读stdout/stderr分页、metrics/evidence、运行时source，按pi-research-experiment-tree区分未回答/冻结。两次未回答/共享设置错误停止补证据，不用扩大shape掩盖bug。

## 运行边界

本地运行使用受管local或固定示例（Docker另有独立参考），固定源码，不在worktree训练，遵守共享资源、监管和取消规则；显式声明CPU/NVIDIA及清单资源，核对身份、批准和恢复记录，不允许无审批任意宿主执行。

资源只按需读取，不授予执行或安装权限。
