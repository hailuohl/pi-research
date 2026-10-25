# ResearchClawBench：40 项适配评测结果

40 项均已有终态，记录截至北京时间 2026年10月25日 21:56:45。18/40 项生成最终报告并正常收尾；22 份报告得到有效评分，均分 **21.82/100**。该均分只针对可评分报告；完整 40 项总分未生成，缺报告或被阻断的任务没有填成 0 分。流程完成不代表科学结论已验证或 rubric 全部通过。

| 结果 | 项数 |
| --- | ---: |
| 流程完成 | 18 |
| 输入/源码大小预检阻断 | 6 |
| 契约或范围校验阻断 | 11 |
| 超时 | 4 |
| 有报告但缺成功 GPU 正式 Run | 1 |

22 份评分由 18 份完成报告、3 份超时报告及 1 份 GPU 未闭环报告组成。详细原始摘要见 [EVIDENCE.json](EVIDENCE.json)。

| 任务 | 执行结果 | 得分 / 100 | 最后限制码 |
| --- | --- | ---: | --- |
| Astronomy_000 | 流程完成 | 24.00 |  |
| Astronomy_001 | 流程完成 | 22.40 |  |
| Astronomy_002 | 流程完成 | 18.40 |  |
| Astronomy_003 | 流程完成 | 57.30 |  |
| Chemistry_000 | GPU 正式 Run 未完成 | 7.05 | ACTION_NOT_AUTHORIZED |
| Chemistry_001 | 契约/范围校验阻断 | — | GPU_CONTRACT_SCOPE_DENIED |
| Chemistry_002 | 流程完成 | 3.60 | ACTION_NOT_AUTHORIZED |
| Chemistry_003 | 超时 | — |  |
| Earth_000 | 流程完成 | 27.50 | INPUT_BATCH_REQUIRED |
| Earth_001 | 流程完成 | 35.63 |  |
| Earth_002 | 输入上限阻断 | — | INPUT_BATCH_REQUIRED |
| Earth_003 | 输入上限阻断 | — | INPUT_OVER_32_MIB |
| Energy_000 | 输入上限阻断 | — | INPUT_BATCH_REQUIRED |
| Energy_001 | 流程完成 | 44.80 | ACTION_NOT_AUTHORIZED |
| Energy_002 | 流程完成 | 22.95 | INPUT_BATCH_REQUIRED |
| Energy_003 | 契约/范围校验阻断 | — | DEVELOPMENT_SCOPE_DENIED |
| Information_000 | 契约/范围校验阻断 | — | GPU_CONTRACT_SCOPE_DENIED |
| Information_001 | 契约/范围校验阻断 | — | GPU_CONTRACT_SCOPE_DENIED |
| Information_002 | 契约/范围校验阻断 | — | NOT_FOUND |
| Information_003 | 输入上限阻断 | — |  |
| Life_000 | 超时 | 11.80 | ACTION_NOT_AUTHORIZED |
| Life_001 | 契约/范围校验阻断 | — | DEVELOPMENT_SCOPE_DENIED |
| Life_002 | 流程完成 | 9.60 |  |
| Life_003 | 超时 | 39.70 | INPUT_BATCH_REQUIRED |
| Material_000 | 契约/范围校验阻断 | — | GPU_CONTRACT_SCOPE_DENIED |
| Material_001 | 流程完成 | 5.80 |  |
| Material_002 | 契约/范围校验阻断 | — | GPU_CONTRACT_SCOPE_DENIED |
| Material_003 | 超时 | 12.15 | ACTION_NOT_AUTHORIZED |
| Math_000 | 流程完成 | 29.05 | ACTION_NOT_AUTHORIZED |
| Math_001 | 流程完成 | 25.90 |  |
| Math_002 | 输入上限阻断 | — | INPUT_BATCH_REQUIRED |
| Math_003 | 契约/范围校验阻断 | — | DEVELOPMENT_SCOPE_DENIED |
| Neuroscience_000 | 流程完成 | 10.00 |  |
| Neuroscience_001 | 契约/范围校验阻断 | — | GPU_CONTRACT_SCOPE_DENIED |
| Neuroscience_002 | 输入上限阻断 | — | INPUT_OVER_32_MIB |
| Neuroscience_003 | 流程完成 | 10.95 |  |
| Physics_000 | 流程完成 | 17.30 | ACTION_NOT_AUTHORIZED |
| Physics_001 | 流程完成 | 18.15 |  |
| Physics_002 | 契约/范围校验阻断 | — | DEVELOPMENT_SCOPE_DENIED |
| Physics_003 | 流程完成 | 26.10 |  |

实际参评入口是冻结 Pi Research 的 **ResearchApp + AgentHost**、原有精确审批和 Docker 作业。GPU 路径还要求独立代码审查、受审变更整合与正式 Run。科研代码与报告由参评模型生成，适配器负责接线、审批、保存及导出，没有代写科研解法。

参与者、项目代码审查员和裁判均选择 DeepSeek Flash max。较早三项的原生模型/档位事件已补做只读核验，见 [档位证据](legacy-max-verification.json)，未改写旧 evaluation 的未验证标志。请求使用 thinking enabled / reasoning_effort=max；[DeepSeek 文档](https://api-docs.deepseek.com/guides/thinking_mode/)声明 max 对应 max，并说明 thinking 模式忽略 temperature。服务端未回显本次实际 effort；重新评分也可能波动。

官方任务固定为 `7627954d0ff3fe5496cbc0675f6afbe9b6cd40f9` 的 40 项原任务，不含额外 16 项。项目冻结自 `c7e1dfaa92ef576cad307e8d6d2513fab84f7870` 及当时未提交文件；差异 SHA256 为 `07de5ff14b5eeb14dc1cd5055df945d77b04c0551a78651dde3ce6f53024fbeb`，准确文件清单保留在本地 receipt。评测期间其他批次提交不混入被测快照。

本轮是限定 Docker 审批路径的离线适配评测：CPU 主要经过开发作业，GPU 必须经过正式 Run。CPU 最多 4 项、GPU 串行；单窗口 1800 秒，hostAccess 关闭。输入、系统内存、源码和输出受协议上限约束。外部额度中断和必要适配修复使用独立审计恢复窗口，故本轮具有不同累计预算；结果适用于这些配置，不能直接用于统一预算的官方排行榜比较。

GPU 安排 11 项，其中 3 项在输入预检阻断，8 项进入路径；**科研正式 Run 成功 0 项**。真实 Pi 正式 Run 的硬件校准通过：PyTorch CUDA 12.8 得到 120，原历史重开一致，校准不计科研任务成功。6 项模型计划仅申报单卡，而容器实际可见及本轮授权集合为三卡；只读校验表明仅修正申报集合即可通过该契约预检，本轮没有自动改写模型计划或绕过拒绝。详见 [GPU 契约证据](GPU_CONTRACT_DIAGNOSTICS.json)。

原额度中断、审批拒绝及失败均保留。三项旧 CPU 会话实际沿原原生历史续接，成功作业 ID 保留。Life_003 首个产出前退出且原生文件未落盘，保留原数据库后使用新保留 attempt，不计同原生会话恢复。未开放操作保持拒绝，模型可继续允许流程或写出限制；其他硬校验保持终止。旧作业期限没有随恢复窗口延长。

裁判保留官方 rubric、权重、图片选择及聚合。v3 排除了 reasoning_content 误入评分 JSON；v3.1 仅修正文案。四份旧报告与全部图片字节和官方顺序核验未变，保留旧评分后重新评分；分差不能证明旧分污染或科研结果改善。交付脚本仅规范化行尾，AST 与运行副本一致，两个文件摘要均记录。没有筛图提高分数。

最终核对 22 份评分的模型/参数、报告摘要和总分绑定；来源补充未改变报告或 score 字节。发现 13 处图片引用无法按原报告路径解析：Life_003 7 处、Physics_000 6 处。保留模型原始报告，未修图或改路径；见 [制品核对](ARTIFACT_AUDIT.json)。队列已自然结束，实际 benchmark Node 进程和本轮运行中容器均为 0。

冻结产品干净构建通过；基础回归 2721 项中 2696 通过、25 跳过、0 失败。适配器、交付工作副本均 48/48 通过；语法、评分及队列自检、相关增量独立复核通过。首轮拒绝续跑的 RED 没有完整复现旧循环，已用五次真实旧阻断记录、旧停止分支和真实隔离审批/消息检查补证；此限制写入协议。仍适用的完整基础回归未重复执行，前端布局继续暂停。

密钥、数据库、原生对话、研究输入和大份日志不入 Git；本机原始记录保留。复现方式及版本见 [REPRODUCE.md](REPRODUCE.md)、[PROTOCOL.json](PROTOCOL.json) 和 environment/。Git 同步状态以协议的交付记录和最终提交链接为准。

Git 交付：`fb8b754d2ca046e61b22101c9b43196aa7666cee`，分支 `implementation/pr01-reproducible-baseline`，[代码与证据提交](https://github.com/hailuohl/pi-research/commit/fb8b754d2ca046e61b22101c9b43196aa7666cee)；远端已核验包含该提交。
