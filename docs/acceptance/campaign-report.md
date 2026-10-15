# 持续研究活动 · 实测数值比较

生成时间：2026-09-26T20:09:23.266Z

这是根据数据库中实际运行和已采纳 Claim 生成的确定性记录，不是新的模型推断。进程成功不等于假设成立。

## Run 6b041c5e-c7d1-491f-9061-b3ce7a5fa924

执行：succeeded；完整性：complete；科研判断：pending；问题回答状态：answered（不是假设成立的证明）

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`d59306e7d8fabfd3f19ca3ebef13fec16d0a4665211a3875f89fba95d6e3eb06`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.04350140148425378 | squared-target |
| r2 | 0.9622735588409816 | dimensionless |
| train_mse | 0.044989798949094585 | squared-target |

证据：[a01e7364-e1f0-42d8-9748-b20984bb4a15](pi-research://evidence/a01e7364-e1f0-42d8-9748-b20984bb4a15)

## Run e78c7487-8660-4901-9725-3890742d377d

执行：succeeded；完整性：complete；科研判断：pending；问题回答状态：answered（不是假设成立的证明）

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`9cdc90658301831c123aed15c8e17126175c78f63ffddeb9154e1f3fbb57fb40`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.000446210591122142 | squared-target |
| r2 | 0.9996130253960532 | dimensionless |
| train_mse | 0.00045146486373746783 | squared-target |

证据：[04f4856f-9e3d-4690-b9bd-9ecd759f35e9](pi-research://evidence/04f4856f-9e3d-4690-b9bd-9ecd759f35e9)

## Run c90869d6-e3ab-4a26-9418-963dd25b30eb

执行：succeeded；完整性：complete；科研判断：pending；问题回答状态：answered（不是假设成立的证明）

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`1a1f8de126ee948fa1966b2b6ba181efda3cffe03c6143ee280978c7fdd1ac1e`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.00044694689491089033 | squared-target |
| r2 | 0.9996123868391191 | dimensionless |
| train_mse | 0.0004513395510615139 | squared-target |

证据：[7108db69-bfaa-4b35-bed3-55c708c0862b](pi-research://evidence/7108db69-bfaa-4b35-bed3-55c708c0862b)

## Run 8876d32b-2f55-4e08-a51c-4cf4d3b1fcc1

执行：succeeded；完整性：complete；科研判断：pending；问题回答状态：answered（不是假设成立的证明）

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`27d173b93b81e21d9706b883a702afb0b947eefd325bcf1ff379e3503ba95393`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.00044494215648380506 | squared-target |
| r2 | 0.9996141254416405 | dimensionless |
| train_mse | 0.00045152446792745733 | squared-target |

证据：[e62b939e-9565-44b1-b7fa-5864f0d1c119](pi-research://evidence/e62b939e-9565-44b1-b7fa-5864f0d1c119)

## 可追溯性与限制

曲线拟合模板使用固定合成数据，仅验证工作流，不能当作材料性能、DFT 计算或论文复现结果。引用格式由工作台的证据页解析；导出 Markdown 后保留 ID 以便回查。