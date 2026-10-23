# 助手思考档位自动分配

选档复用当前模型已有的自定义等级 ID。模型名称、等级名称、Pi 档位和列表顺序都不表示统一强弱关系。主 Pi 根据用户保存的用途说明，在原协作规划中为助手选择；主会话的供应商、模型和思考选择不变。

## 配置方式

前端布局暂缓。配置通过原有模型管理接口或已有 CLI request 命令保存，不需要改连接凭据或执行参数。

1. 对运行中的本地服务执行 `node dist/apps/cli/index.js request GET /settings/model-management`。HTTP 对应 `GET /api/settings/model-management`。
2. 从返回的模型目录确认实际等级 ID、模型 restoreEpoch（未设置按 0），并读取目录 version 与该模型已有 thinkingPolicies 项的 version（首次按 0）。
3. 向同一路径 POST `model.thinking-policy` 管理命令。示例中的供应商、模型、等级及版本都必须替换成目标环境的真实值：

```json
{
  "expectedVersion": 0,
  "expectedPolicyVersion": 0,
  "action": "model.thinking-policy",
  "provider": "provider-id",
  "model": "model-id",
  "value": {
    "schemaVersion": 1,
    "provider": "provider-id",
    "model": "model-id",
    "restoreEpoch": 0,
    "candidates": [
      {"id": "existing-level-a", "purpose": "用于明确字段提取与资料归类"},
      {"id": "existing-level-b", "purpose": "用于相互依赖的分析与独立核查"}
    ]
  }
}
```

候选成员表示允许自动选择的范围，顺序不表示排名。用途应描述实际适用条件，不能授予联网、命令、计算或发布权限。空 candidates 表示关闭该模型自动选档；用途和策略有独立版本，不改变执行目录版本。

## 使用与边界

在开启多智能体的研究对话中，主 Pi 用 project_inspect 读取 thinkingPolicy。返回 null 时保持原继承行为；legacy 候选会标明保存时已验证、准备计划时重验，不能把目录声明当作刚完成供应商实测。

有合适候选时，主 Pi 在现有分工任务中设置 thinking 和 thinkingReason；用户仍批准完整团队计划。无合适候选时继承主会话档位。未知或未允许的显式 ID 会拒绝，不静默修复。单档或无可解析调节能力的模型仍可按原方式执行。

新计划由宿主冻结最终任务模型和有效映射。改动所选执行参数后，后续派发或新模型请求会被拒绝，需要重新准备计划；不影响当前已发请求的结果收尾。单纯修改名称、用途等不改变所选执行的内容不会使计划失效。失败重试沿用原选择，不在运行中自动升级。

普通任务图中的 reviewer 适用同一机制。原有服务端固定审查入口未指定任务档位时继续继承，不改其已有同步契约。

## 换电脑或模型

从 GET 响应的 thinkingPolicies 中导出单条策略，仅保留 schemaVersion、provider、model、restoreEpoch、candidates。该对象不包含路径、endpoint、密钥或运行数据库。

目标电脑先配置可接入的同一模型，再读取目标目录/策略版本，将便携对象放入上述 POST 的 value 导入。目标端重新验证 ID 和恢复身份；若等级 ID 不同，应按目标模型真实等级明确重建映射。供应商凭据在目标端单独配置，不通过策略迁移。

新模型使用它自己的候选及用途，不复制其他模型的等级含义。模型协议必须已有适配，或另行增加适配器；没有思考调节接口的模型不会被伪造等级。

## 记录说明

选择记录、Pi 适配结果和实际请求参数摘要用于核对配置与发出的请求。供应商内部是否按某种强度执行，未回显时仍未知。旧计划、历史和授权不补写新字段、不改旧摘要；主会话配置不受选档影响。
