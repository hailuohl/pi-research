# 已有回归库的实现与数值交叉核验

当研究已选定回归目标，需要在现有获准环境中用 scikit-learn 实现数值回归，或用 statsmodels 对同一拟合做数值交叉核验时读取本页。本页补充实现细节；研究目标、切分依据、诊断解释及科学主张仍按本技能处理。它不自动安装库、不联网、不授予数据或执行权限。

若库缺失，保留依赖缺口，由宿主选择已有且允许的执行环境；不要修改 `sys.path`、绕过受控环境或临时安装。用 quality 等序数评分作数值响应时，说明模型将相邻分值当作等距；结果仅按评分近似解释，不构成序数模型推断。

## 固定切分与拟合

先沿真实样本单位、时间和数据来源确定训练/测试切分。存在同一实体、批次、重复测量或时间关系时，按相应组或时间单位划分，不能让相关记录跨集合。degree 1 与 degree 2 使用相同记录和相同划分；无调参时可直接用预先固定的holdout，不需要为形式而交叉验证。

对原始特征用如下单一 Pipeline 拟合；标准化器只在当前训练数据上拟合，测试数据只经已拟合步骤变换。`include_bias=False` 与 `fit_intercept=True` 避免重复常数项：

```python
Pipeline([
    ("scale", StandardScaler()),
    ("poly", PolynomialFeatures(degree=degree, include_bias=False)),
    ("linear", LinearRegression(fit_intercept=True)),
])
```

交叉验证时，每折都拟合完整 Pipeline，让缩放和特征变换留在折内；两种degree复用同一组折。若分组或时间结构要求专用切分，则让切分尊重真实单位，不能因使用K折而默认独立同分布。高阶展开会快速增加设计列，拟合前核对样本量、变换后维数、秩和病态风险。

## statsmodels 数值交叉核验

只在有实际核验价值且两库均已可用时，对相同训练响应、样本顺序、训练拟合变换及列顺序建立OLS。可复用已拟合 Pipeline 中的预处理器分别变换训练和测试数据，再明确加入常数项：

```python
X_train_design = fitted_pipeline[:-1].transform(X_train)
X_test_design = fitted_pipeline[:-1].transform(X_test)
X_train_ols = sm.add_constant(X_train_design, has_constant="add")
X_test_ols = sm.add_constant(X_test_design, has_constant="add")
ols = sm.OLS(y_train, X_train_ols, missing="raise").fit()
test_prediction = ols.predict(X_test_ols)
```

不得在测试数据上重新拟合标准化器或多项式变换；单条预测也须保留二维行形状和与训练相同的列顺序。交叉核对前检查ID、行顺序、目标和设计矩阵均有限，训练/测试变换各自保留样本数且产生相同列数与顺序；不要要求多项式展开前后的列数相同。含常数项的训练设计矩阵应满秩且未呈现不可接受的病态。输入含NaN/无穷、OLS拒绝缺失、求解失败或结果非有限时，保留失败/缺口，不静默删行、删列或切换模型。

比较两个库时先确认训练变换、截距位置、特征列顺序及样本一致，再在预先声明的绝对/相对容差内比较系数和同一测试集预测。容差应适合实际精度与求解条件，不设通用的“通过”数值。预测一致仅是实现层数值核对，不是独立科学证据，也不能替代方法假设或研究审查。

## 诊断与Run证据

诊断必须来自本次真实拟合与残差，按目标检查拟合形态、影响点、异方差、设计矩阵识别性及相关结构；不以正态性检验未拒绝宣称假设成立，不因诊断不理想而静默删点或只留有利拟合。可报告HC3异方差稳健标准误，但它不修复组内/时间依赖、混杂或因果识别；不适用的检验不强行添加。

运行前沿既有Run合同声明实际产物。metrics.json保持该合同要求的平铺有限数值；测试预测/配对见证、参数与诊断、精确包版本分别放入允许且已声明的Artifact，需要时沿用现有analysis.json。闭合模板不支持的字段不得塞入metrics或日志。记录实际scikit-learn、statsmodels及数值后端版本；不照抄文档示例版本或计划版本。按项目既有Run、复算与报告流程回读产物；不另建注册表或执行入口。

多变量普通Run沿用项目已有切分和Run合同；按真实重复/分组单位划分，组不得跨训练与测试集合。同一测试集合上的固定预测可支持合同允许的row-weighted RMSE差描述，但`paired-rmse-delta-v1`的区间与判定只有在iid、非退化等适用条件成立时才可使用；同一测试集可重算本身不证明iid、置信区间或显著性。若问题属于单输入线性/二次配对比较，必须先按`paired-polynomial-comparison.md`执行完整协议，本页不能豁免或替代。

## 来源与适配

本页为中文原创适配，来源为 K-Dense-AI/scientific-agent-skills 固定commit `a1043ef544e3a100c28e70a736b6cf32554d0677` 的 `skills/statsmodels/SKILL.md` 与 `skills/scikit-learn/SKILL.md`。上游仓库许可证为MIT，两份来源文件的frontmatter标注BSD；保留两者差异，完整仓库许可见 `third_party/scientific-agent-skills/LICENSE`。statsmodels与scikit-learn各自官方软件包许可证继续适用；本页不替代它们，也不复述安装指令、上游自引或版本宣称。
