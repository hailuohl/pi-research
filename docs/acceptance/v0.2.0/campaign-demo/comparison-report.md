# 持续研究活动 · 实测数值比较

生成时间：2026-09-26T19:06:03.220Z

这是根据数据库中实际运行和已采纳 Claim 生成的确定性记录，不是新的模型推断。进程成功不等于假设成立。

## Run 3d9884ff-cf30-4c3f-b830-421cce83ab28

执行：succeeded；完整性：complete；科研判断：pending

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`d59306e7d8fabfd3f19ca3ebef13fec16d0a4665211a3875f89fba95d6e3eb06`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.04350140148425378 | squared-target |
| r2 | 0.9622735588409816 | dimensionless |
| train_mse | 0.044989798949094585 | squared-target |

证据：[648d9716-4430-4058-8e2c-8f09fb6fceef](pi-research://evidence/648d9716-4430-4058-8e2c-8f09fb6fceef)

## Run 542c3c07-96d0-4d25-bc2e-0f65e89d24e0

执行：succeeded；完整性：complete；科研判断：pending

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`9cdc90658301831c123aed15c8e17126175c78f63ffddeb9154e1f3fbb57fb40`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.000446210591122142 | squared-target |
| r2 | 0.9996130253960532 | dimensionless |
| train_mse | 0.00045146486373746783 | squared-target |

证据：[f9643de2-73d2-4fd9-822a-9f2652543aeb](pi-research://evidence/f9643de2-73d2-4fd9-822a-9f2652543aeb)

## Run 9e8ede92-a239-44ce-ac95-6eda8406a980

执行：succeeded；完整性：complete；科研判断：pending

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`1a1f8de126ee948fa1966b2b6ba181efda3cffe03c6143ee280978c7fdd1ac1e`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.00044694689491089033 | squared-target |
| r2 | 0.9996123868391191 | dimensionless |
| train_mse | 0.0004513395510615139 | squared-target |

证据：[d6dd704f-de17-4c1c-9d1d-c2384e732c9b](pi-research://evidence/d6dd704f-de17-4c1c-9d1d-c2384e732c9b)

## Run 7327013b-7aa9-47f8-a119-f1b217f75965

执行：succeeded；完整性：complete；科研判断：pending

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`27d173b93b81e21d9706b883a702afb0b947eefd325bcf1ff379e3503ba95393`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.00044494215648380506 | squared-target |
| r2 | 0.9996141254416405 | dimensionless |
| train_mse | 0.00045152446792745733 | squared-target |

证据：[e1a5bc19-8011-4afe-9839-b5a3584591e8](pi-research://evidence/e1a5bc19-8011-4afe-9839-b5a3584591e8)

## 可追溯性与限制

曲线拟合模板使用固定合成数据，仅验证工作流，不能当作材料性能、DFT 计算或论文复现结果。引用格式由工作台的证据页解析；导出 Markdown 后保留 ID 以便回查。