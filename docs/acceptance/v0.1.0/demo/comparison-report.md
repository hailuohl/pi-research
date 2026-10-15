# 固定合成数据实验比较

生成时间：2026-09-25T10:39:15.734Z

这是根据数据库中实际运行和已采纳 Claim 生成的确定性记录，不是新的模型推断。进程成功不等于假设成立。

## Run 58ad3156-fbda-48f2-b5e1-6f82481aa5db

执行：succeeded；完整性：complete；科研判断：pending

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`d59306e7d8fabfd3f19ca3ebef13fec16d0a4665211a3875f89fba95d6e3eb06`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.04350140148425378 | squared-target |
| r2 | 0.9622735588409816 | dimensionless |
| train_mse | 0.044989798949094585 | squared-target |

证据：[c89848ab-a02b-40e5-9993-0d4a42fe74f8](pi-research://evidence/c89848ab-a02b-40e5-9993-0d4a42fe74f8)

## Run 4402348e-79d6-4935-a220-d83f1f38c6f8

执行：succeeded；完整性：complete；科研判断：pending

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`9cdc90658301831c123aed15c8e17126175c78f63ffddeb9154e1f3fbb57fb40`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.000446210591122142 | squared-target |
| r2 | 0.9996130253960532 | dimensionless |
| train_mse | 0.00045146486373746783 | squared-target |

证据：[cecf52c2-c715-47e6-bd9d-a1d209bac3e8](pi-research://evidence/cecf52c2-c715-47e6-bd9d-a1d209bac3e8)

## Run d3c6317a-525e-4403-bab4-f267d15950be

执行：succeeded；完整性：complete；科研判断：pending

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`1a1f8de126ee948fa1966b2b6ba181efda3cffe03c6143ee280978c7fdd1ac1e`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.00044694689491089033 | squared-target |
| r2 | 0.9996123868391191 | dimensionless |
| train_mse | 0.0004513395510615139 | squared-target |

证据：[dfc24da9-d600-4907-a96e-781635dd5bde](pi-research://evidence/dfc24da9-d600-4907-a96e-781635dd5bde)

## Run bade3d7a-68f1-4700-b2f9-956330ab7f19

执行：succeeded；完整性：complete；科研判断：pending

固定入口：`node experiment.mjs`

数据：synthetic-quadratic-v1；评估：deterministic-split-180-60-v1

快照：`27d173b93b81e21d9706b883a702afb0b947eefd325bcf1ff379e3503ba95393`

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | 0.00044494215648380506 | squared-target |
| r2 | 0.9996141254416405 | dimensionless |
| train_mse | 0.00045152446792745733 | squared-target |

证据：[9ba92695-2ba3-4da4-a576-062b2a800db0](pi-research://evidence/9ba92695-2ba3-4da4-a576-062b2a800db0)

## 可追溯性与限制

曲线拟合模板使用固定合成数据，仅验证工作流，不能当作材料性能、DFT 计算或论文复现结果。引用格式由工作台的证据页解析；导出 Markdown 后保留 ID 以便回查。