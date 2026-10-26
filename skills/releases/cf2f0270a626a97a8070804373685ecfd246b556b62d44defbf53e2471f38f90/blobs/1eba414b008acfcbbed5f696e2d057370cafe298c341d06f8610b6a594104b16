# 单输入线性与二次回归：固定协议和证据输出

适用于同一数值输入的一次、二次多项式回归，以共同测试记录的RMSE差为目标。采用`paired-rmse-plan-v2`和`outputProfile:"paired-evidence-only-v1"`；其它模型按统计分析资源选择能力，不能为套模板改研究问题。实际读取本资源或显式选择本输出profile后，本主协调会话不能降级消除要求。读取不批准执行，也不改变旧协议或其它科研流程。

## 输入与共享实现

实际读取获准原始输入和字典，固定正式输入path/digest、预测/响应字段、去重/缺失、划分与科学限制。只允许合成开发时，不得复制、抽取或改名真实记录充当合成输入。调用`research_fixture_prepare`：

```json
{"input":{"profile":"numeric-regression-v1","outputProfile":"paired-evidence-only-v1"}}
```

工具返回固定`fixtureRef`、`inputPath`和`inputFormat`。用`artifact_read`读夹具原文；它是JSON对象，数组在`/rows`，不是顶层数组，也不靠挂载路径扩展名识别。行字段为`rowId`、`partition`（train/test）、`x`、`observed`。保留固定划分和原数字。宿主独立生成夹具，不接收数据数组、拟合参数或生成脚本；重试复用首次版本。夹具只检查管道，不能推断真实效果、阈值、功效或保证精度。

正式CSV与开发JSON可用不同输入适配器；后续fit、predict、指标、序列化调用同一实现。完成并保存共享实现文件，再用实际path/entryPoint声明它。来源记录中的digest是该文件字节的SHA256，可在运行时读取自身源码计算；它不是整个snapshot的sourceDigest。独立审查仍核对实际调用链，不能用声明替代代码。

## 编译与保存完整协议

`research_method_compile`的`specification`含`version:1`、真实`literatureSources`及以下`quantitative`字段；路径、字段名、单位和阈值按研究选择：

- `type:"comparison"`、`template:"paired-rmse-plan-v2"`、`outputProfile:"paired-evidence-only-v1"`。
- `outcomeUnit`、`minimumGain`、`metrics:{baselineRmse,candidateRmse,gain}`，三个值是平铺指标JSON中的不同键名。
- `witness:{artifactPath,recordsPointer,idField,observedField,baselinePredictionField,candidatePredictionField}`，映射原始test-only预测；如`artifactPath:"analysis.json"`、`recordsPointer:"/testPredictions"`。
- `developmentData:{mode:"host-synthetic-only",profile:"numeric-regression-v1",fixtureRef,inputArgumentIndex}`；fixtureRef原样来自工具，命令`["python","compare.py",inputPath]`的数据参数位置为2。
- `plan.formalInput:{path,digest,predictorField,outcomeField}`来自实际读取的正式输入。
- `plan.models:{baseline:{family:"polynomial",degree:1},candidate:{family:"polynomial",degree:2}}`。
- `plan.preprocessing:{duplicates,missing,scaling:"training-only"}`；duplicates为`retain`/`drop-exact`，missing为`reject`/`drop-complete-case`。
- `plan.split:{testFraction,seed}`固定正式单次划分，不看结果选择；开发沿夹具分配。
- `precisionGate:null`表示宽度仅描述；有预定精度判据时填`{maxHalfWidth:正有限数}`，单位同RMSE。非null时超界先判inconclusive，再走增益分支。所有实际判据须进入结构化协议。
- `provenanceArtifact:"fit-provenance.json"`及`fitImplementation:{path:"compare.py",entryPoint:"shared_fit_predict"}`固定真实实现。

新profile不接收`decisionOutputs`。完整返回`protocol`原样保存为唯一`protocol.md`。研究笔记可记录数据质量、文献层级、竞争解释和假设；这些文字仍须与实际规则和结果一致。

回读当前协议、实现及笔记后，`research_brief_save`沿`draftFiles`提供真实readId，加`draftRoles:[{path,role}]`；role是`protocol`/`implementation`/`notes`，覆盖全部草稿且恰好一个protocol。`methodContract.protocolPath`指向生成协议。规则或文件改变须重新保存、回读和确认适用版本，不能自述“已核对”代替凭证。

## 一份闭合的程序输出合同

候选程序只写以下三个JSON文件，成功stdout/stderr均为空。日志也是输出，不能在那里另发统计量或判定。失败诊断会原样保留。

1. `metrics.json`：恰好三个绑定键、有限JSON数字，分别为baseline RMSE、candidate RMSE、正向差；不含额外计数、CI或标签。开发`metricArtifact`指向它。
2. `witness.artifactPath`：只含recordsPointer所需祖先对象及原始预测数组。每行恰好四个映射字段，ID非空且唯一，响应与两预测有限；不得另塞metrics/verdict或解释。例如`{"testPredictions":[{"rowId":"...","observed":1,"baselinePrediction":0.8,"candidatePrediction":0.9}]}`。
3. `provenanceArtifact`：闭合形状如下，不能增加任意诊断或文字字段：

```json
{"trainRowIds":["..."],"normalization":{"predictor":{"center":0,"scale":1}},"models":{"baseline":{"coefficients":[0,1]},"candidate":{"coefficients":[0,1,0.1]}},"implementation":{"path":"compare.py","entryPoint":"shared_fit_predict","digest":"源码文件的64位SHA256"}}
```

center有限，scale正有限，系数有限，按常数项到高次项排列；作用于`x'=(x-center)/scale`，预测直接在原响应量纲中，无响应缩放。使用实际训练参数，不能填示例数值。训练ID须完整对应开发夹具train集合，预测ID及observed须对应test集合。

`expectedArtifacts`列上述三个候选路径。路径彼此不同且不能占用宿主保留路径。全部输出枚举并归档；未知文件、未知字段、非空成功日志会使检查失败，原件保留供诊断，不会被静默过滤成成功。该限制只适用于此有界profile。

宿主复算后统一生成`methods-results.json`及既有方法附件，并导出`methods-facts.json`、`methods-facts.md`和test-only `predictions.csv`。候选程序不要写这些保留文件。CSV与事实块来自同一已验证见证/判据；CI、SE、宽度和判定不在程序中另算另一套。所有输出仍受正常大小预算。

## 运行、实质审查与交付

开发命令使用返回的`inputPath`。宿主注入唯一夹具，准备、启动、归档和重开核对固定来源；仍需正常批准。正式Run使用另外获准的冻结真实输入，不把开发夹具集合套到正式数据；两阶段沿同一指标、区间和判据实现。

新审查清单包括固定brief全文、全部候选文件、实际产物及完整日志、宿主事实和边界例。全部读完只证明范围覆盖，不能证明科学正确。审查者沿五个评估领域，对每个开放表面定位科学断言，并与实际fact/rule/case作对照；用实际结果或边界反例检查泛化规则。任何科学冲突或未解决的关键缺口都须reject/revise，不能因宿主主结果正确而把同批错误文字降为非阻断或留待正式Run。

协议和事实块只证明所列受支持计算。实际训练来源、共享代码、单位意义、独立实体、独立测试对、有限矩、近似区间适用性与领域效用仍需独立科学核对。相同DOI只关联报告候选，不推定同一研究；study身份未知不记为零研究。

正式结果后读取对应`methods-facts.md`，在报告复用其运行身份、阶段、数值和判定限定，避免手抄另一份数字。自由解释与最终报告的准确版本仍须按原预算独立审查；开发accept不覆盖最终报告。合成检查不是科研发现，操作门槛不是已验证领域效用，区间宽度不是事前功效或保证精度。
