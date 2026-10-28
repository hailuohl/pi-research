---
name: pi-research-compute
description: "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run."
---

# 固定快照与计算连接

先用 `connector_status` 查看实际能力。记录显示 implemented 不等于目标环境实测成功。凭据存在也不是用户授权改用该供应商。

## 通用运行合同
1. `run_prepare` 固化入口、环境、源码/配置/数据版本、指标与预期产物，返回 RunIntent 和独立审批对象。
2. 只有用户批准当前清单后，交互主协调者可 `run_submit`；助手和自动分析没有计算授权。提交立即返回，不占一个长工具调用等待。
3. `run_inspect` / `run_logs` 读取实际作业；已批准代码提案不等于已批准计算。项目归档、前提撤销、清单变化时禁止新运行。
4. 停止 Agent 不取消 Run；用户在运行面板显式取消。不要声称连接断开就已远程取消。

## 当前后端
| 后端 | 状态 | 可读参考 |
|---|---|---|
| trusted-example | 受信随包数值示例已测试；只接受固定入口哈希 | references/local.md |
| docker | 已有受控执行代码，真实容器未验收 | references/local.md |
| ssh、slurm、k8s、ray、hf、modal、tinker | 本次未实现正式适配器；不能调用外部 CLI 绕过 | 对应 references/*.md |
| managed-compute | 没有自有账户/资源目录或实例服务 | references/openresearch.md |

技能只描述下一步需要的合同，不会使上述不可用后端变成可用。禁止直接运行训练命令、SSH、云 CLI 或下载执行脚本规避审批。不能以“同为本机”把任意代码塞进受信示例。

## 等待、恢复、证据
提交后结束当前回合；宿主负责持久化监管/唤醒。收到通知重新核对所有终态，不等待整批才分析，也不把单条通知当完整结果集。unknown 时先对账原意图，不盲目重提；超时指未观察到变化时不能报告实验失败。

比较同一固定协议。运行失败保留原始输出，按是否回答问题决定修复或冻结。归档完整性以最终必需产物清单为准，缺失/超限文件不能静默跳过。CPU/GPU/内存、模型调用和 Agent 个数分别预算，不能把两名助手解释为两张 GPU。没有通用资源实测时只提供带假设的需求，不报虚构吞吐。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-compute/SKILL.md`（blob `60566d92cd5e86f1d6684d731444af512531ea0c`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
