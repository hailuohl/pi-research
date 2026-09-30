# 红酒质量：分组隔离后的实际比较

用户授权主代理拟定任务后，本批复用 [UCI Wine Quality](https://archive.ics.uci.edu/dataset/186/wine+quality) 的固定红酒CSV和已有两份模型源码，完成 owner HTTP→两项正式CPU Docker Run→真实Pi只读分析→批准Stop→固定报告→CLI与重开回查。1,599行按11项理化测量分为1,359组；训练1,279行/1,080组，测试320行/279组，输入组交集为0。固定协议、seed和split在两项Run前保存；旧划分及其91条重复测试记录的限制仍保留。

| 模型 | 测试MSE（quality-squared） | 测试MAE（quality） |
|---|---:|---:|
| 训练均值 | 0.7694585652 | 0.7317142299 |
| alcohol一元OLS | 0.6158488790 | 0.6032308651 |

候选MSE降低 **19.9633%**、MAE降低 **17.5592%**，达到事前“至少降低5%且MAE不变差”的判据；活动已按一个候选的范围停止。报告 `541db0b4-24e4-4e60-b867-e2d88c2d0d49` 为 verified/current，34条固定引用可回查CSV、split、协议、源码与两项Run。Pi Task `025430bb-9fba-47ea-9dfc-e4923e30aff4` 实际读取六项固定输入，提交独立分析产物 `51ba48ba-609a-4545-87bf-9cdc523acc39`，原生会话正常idle；分析按其Task/产物ID单独回查，没有采纳新的科学Claim。

在本机仓库目录可直接回查：

```powershell
node dist/apps/cli/index.js operation report_inspect --project d5764510-a270-413c-8cc1-dfb3008c8e3c --data .validation/wine-grouped-trial/data --input-file .validation/wine-grouped-trial/report-inspect-input.json
```

本次主代理代用户经owner接口完成 **6项独立批准**：固定候选整合、Campaign、两项Run、只读分析Team、Stop。数值HTTP流程26.018秒，两项容器执行分别4.519/4.490秒；Pi分析41.346秒；截至报告生成的流程耗时约11分17秒，包含编排与复核等待。SDK保存3条用量观察，合计报告36,024 tokens（包含21,504 cache-read tokens），不等于已核验HTTP次数或账单；实际费用未取得。

独立Decimal重算核对全部640条预测，最大差小于1e-15，并核对批准/清单/父来源和归档。未批准Run、跨项目读取均拒绝；回执重放与重开仍为原ID，14项产物原字节、旧库332条记录和8份在途文件保持。核验脚本最初漏读原生工具参数的input层，CLI初次用了错误project ID；修正核验/调用后通过，已成功Run和Pi没有重复执行。精简身份与摘要见 [evidence.json](evidence.json)，原数据、协议/split、源码、预测、原生对话与日志留本机任务库。

限制：这是按观测特征分组的一份固定划分；同组内重复行仍计权，数据没有葡萄酒/酒庄/年份身份，不能证明所有潜在相关性已隔离。质量评分为有序等级，本结果不支持外部泛化、置信区间、因果或Cortez论文SVM复现，也不能与旧随机索引划分直接比增益。产品plan revision随Stop保存，但前瞻协议Artifact与Run源文件在执行前已冻结。没有新模型代码/产品源码，未重复旧开发测试、全量回归或干净构建；旧测试绑定不冒认为新split已测试。当前阶段转入按需维护；前端及长期目标继续按原计划保留。
