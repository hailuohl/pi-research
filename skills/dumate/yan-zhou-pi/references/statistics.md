# 选定统计方法

入口：`python scripts/statistics_workflow.py --workspace <workspace> --task T1 --id A1 --source D1 --spec inputs/statistics.json --plan P1`。
D1 必须是计划 source_ids 内已经登记的 CSV data 来源。`materials_only` 计划拒绝新分析。产物为 `analysis/A1/result.json` 和 `cleaned.csv`；原输入不写回。result 保留 source/input_sha256/data_label/plan、参数、实际 n、单位、指标好方向、计算结果和 gaps，科学解释始终 pending。

只执行 `method` 指定的方法：

| method | 数据与结果 | 必须声明/核验的假设 |
|---|---|---|
| descriptive | value；n/mean/median/min/max/sample_sd | 描述统计，无显著性推断 |
| mean_ci | value，可按 group 分组；均值 t 区间 | independent_observations、mean_sampling_distribution |
| welch_t | 明确 treatment/baseline；差值、Welch 自由度/95%区间/p | independent_observations、mean_sampling_distribution |
| paired_t | value/group/key；配对差值 t 区间/p | independent_pairs、normal_differences |
| mann_whitney | 独立组的秩/分布检验 | independent_observations、ordinal_comparable |
| wilcoxon | 配对差值 signed-rank | independent_pairs、symmetric_differences |
| pearson | 实际 x/y 行配对；相关/p，n>3时 Fisher CI | independent_observations、linear_relationship、bivariate_normality |
| spearman | 实际 x/y 行配对；秩相关/p | independent_observations、ordinal_comparable |
| ols | x/y；截距/斜率/单位/标准误/t CI/p、残差、拟合值/R² | independent_observations、linear_relationship、homoscedastic_errors、normal_errors |

示意 spec（字段必须换成实际设计）：

```json
{
  "method": "welch_t",
  "metric": {"name": "实际指标", "unit": "dimensionless", "direction": "higher"},
  "columns": {"value": "value", "group": "variant"},
  "comparisons": [{"id": "contrast1", "treatment": "actual_method", "baseline": "actual_baseline"}],
  "confidence": 0.95,
  "alpha": 0.05,
  "alternative": "two-sided",
  "missing": "error",
  "assumptions": {"independent_observations": true, "mean_sampling_distribution": true}
}
```

配对检验把 columns.key 指向实际 seed/subject ID。每臂键唯一且两臂键集合完全相等；不能按行顺序假配对、丢掉未匹配数据或使用 missing=exclude。独立设计不会因相同 seed 字符串自动变成配对。

相关和回归仅接受明确 x/y 列与 x_unit，例如 `columns:{"x":"tokens","y":"loss"}, x_unit:"tokens"`；metric.unit 是 y 单位。禁止传 group 后静默合并不同组。需要分组分析时明确选择对应数据来源并建立独立版本。

只有核验过的 assumptions 填 true；缺项或 false 保留计算并返回 partial，不能当作科学审阅通过。样本不足、Welch两臂均零方差/配对差值零方差、相关常数列、Wilcoxon全零差值、非有限计算和真实 SciPy warnings 分别进入 gaps。Welch仅一臂为常数时仍按实际另一臂方差计算差值区间，真实warning仍保留。非有限结果写 JSON null；单观测无均值 CI；没有可估计区间时不伪造误差须或显著性。

多个比较需要完整检验族，在同一 spec.comparisons 列出每项，并加：

```json
{"correction":{"method":"holm","family":"实际同一问题检验族","family_count":3}}
```

也支持 `bh`。family_count 必须等于实际族内全部比较数，不能把筛选后的显著项当族；每项保留 p_raw、p_adjusted、alpha、族名、校正方法。任何族内检验不可估计时校正决定为空且 partial。统计检验与科学结论分开；Mann–Whitney 不自动等于中位数差，Wilcoxon 需要差值对称性。

稿件沿旧接口选择 analysis_ids，通过 `[value:A1:results/contrast1/difference]` 引用实算有限数值；不能引用 null、bool 或科学待审状态充当量值。重开、来源变更、跨任务、代码哈希、新版本、失败保留和锁规则沿 planning/common。
