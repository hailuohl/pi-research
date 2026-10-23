# 通用多智能体思考档位分配

用户已于本会话批准实现通用方案、验证并提交推送。前端布局继续暂缓。

目标：主 Pi 在现有协作规划中，从当前模型真实存在且用户允许的自定义档位中，为助手选择档位；不改变主会话、供应商、模型、权限或既有运行额度。

## 验收条件（全批共用）

1. 任意合法自定义档位 ID、任意列表顺序都可使用，不硬编码模型或等级；多档、单档、无策略、无可解析能力均有明确行为。未知或未获允许的显式选择拒绝，不静默替换。
2. 仅助手任务选档。主会话 ModelConfig 和原权限保持；团队计划、Task、Session、DiscoveryGrant、RunGrant 使用同一冻结选择，篡改会被拒绝。
3. 批准前由宿主冻结有效执行配置；派发及每次新模型请求核对。有效映射改变阻断新执行，不能通过重试换档；显示名称等不影响执行的变化不误伤任务。
4. 旧无新字段的计划、授权及摘要保持兼容；重试、重开和历史保留选择。策略只含逻辑标识及用途，可在不同数据目录导入，不带绝对路径、凭据或运行数据库。
5. 复用现有配置管理和研究对话操作，前端布局不改；相关回归、完整回归、干净构建及独立 Astra xhigh 复核有证据，交付只提交本批差异并推送当前工作分支。

## 决策

- 采用主 Pi 在已有计划调用中选择，不增加选档模型或服务，不按名称、Pi 枚举或数组顺序推断强弱。
- 策略独立于 ModelDefinition/ModelConfig，按 provider/model/restoreEpoch 绑定，保存 candidates:[{id,purpose}]。空候选表示清除/关闭；缺省保持继承。模型无可调档位仍按原方式工作。
- 使用现有 GET/POST /settings/model-management，新增 model.thinking-policy action；策略有独立版本，不因用途修改而增加执行目录版本。GET 返回脱敏策略用于导出，同一保存接口用于导入并重新验证目标目录。
- project_inspect 为交互主协调者返回当前模型可用候选和策略版本；不暴露凭据。不使用 legacy availableSelections() 的全量 Pi 枚举作为真实候选，需从实际目录或受管定义解析。
- TaskSpec 增 thinking?:string 与必要的简短选择理由字段。仅显式选择需要宿主异步准备；未选择的旧入口严格继承，不为旧记录补写字段。
- 异步 SDK/目录准备在事务外，TeamService.create 保持同步；末尾接收宿主 prepared 参数。正常 collaboration_plan_submit/agent_delegate 与 HTTP teams 入口 await 准备。通用任务图中的 reviewer 适用相同选择；服务端专用审查入口没有选择时继续继承。
- team-plan 条件保存 host-only taskModels，包含每项任务最终 ModelConfig、脱敏有效映射和摘要；纳入 planDigest 和任务授权的 teamPlanDigest。客户端不能提供宿主快照。
- 共用冻结任务模型解析入口用于 claim 与两种 TaskGrant，保留 restoreEpoch。新计划检查 Task 与冻结规范一致；旧计划原样返回 plan.model。
- 摘要覆盖影响所选执行的映射、模型/档位浅覆盖参数、API、有效 SDK 元数据和版本等；排除凭据、名称、排序和不影响所选执行的其他配置。冻结摘要不是供应商实际执行强度的证明。
- Worker/宿主精简记录请求自定义 ID、Pi 适配值、实际推理参数摘要及配置摘要。已有 HTTP 管理入口阻止失效后的新请求；已经发出的请求不重复发送。
- 已知且确定的 SDK 档位适配不一概拒绝：分别冻结请求 Pi 值与实际适配值，Worker 核对后者，保留原有显式 wire 参数覆盖。自定义 ID 不变；只有实际结果偏离冻结定义才阻断，避免要求用户修改既有合法配置。
- 不做运行中自动升降档，不增加权限或依赖，不修改原数据和服务，不重写旧摘要。

## 环境与交付

主仓库：D:/项目/pi research/pi-research，分支 implementation/pr01-reproducible-baseline。
隔离副本：D:/项目/pi research/tmp/thinking-allocation-20261023-a38598ae/repo。
基线 HEAD：2f7b3eb1c64f6580108de0b7d49ca22b114c69f1，另含工作区已有源码变更；原始文件副本与 SHA256 清单在隔离副本同级 baseline/、baseline-files.json。
所有实现只在隔离副本；主代理按本批增量集成，其他在途差异不暂存、不提交。
