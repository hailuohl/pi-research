#!/usr/bin/env python3
"""Selected, assumption-aware statistics for registered task data; no scientific approval."""
from __future__ import annotations

import argparse
import math
from pathlib import Path
import warnings

import numpy as np
from scipy import stats

import alignment_common as common
import research

METHODS = {"descriptive", "mean_ci", "welch_t", "paired_t", "mann_whitney", "wilcoxon", "pearson", "spearman", "ols"}
ASSUMPTIONS = {
    "descriptive": (), "mean_ci": ("independent_observations", "mean_sampling_distribution"),
    "welch_t": ("independent_observations", "mean_sampling_distribution"),
    "paired_t": ("independent_pairs", "normal_differences"),
    "mann_whitney": ("independent_observations", "ordinal_comparable"),
    "wilcoxon": ("independent_pairs", "symmetric_differences"),
    "pearson": ("independent_observations", "linear_relationship", "bivariate_normality"),
    "spearman": ("independent_observations", "ordinal_comparable"),
    "ols": ("independent_observations", "linear_relationship", "homoscedastic_errors", "normal_errors"),
}


def finite_json(value):
    if isinstance(value, dict):
        return {str(key): finite_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, np.ndarray)):
        return [finite_json(item) for item in value]
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (np.integer, int)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return float(value) if math.isfinite(value) else None
    return value


def mean_interval(values, confidence=0.95):
    values = np.asarray(values, dtype=float)
    result = research.describe(values.tolist())
    result["ci"] = None
    result["ci_method"] = "two-sided Student t interval for the mean"
    if len(values) > 1:
        margin = float(stats.t.ppf((1 + confidence) / 2, len(values) - 1) * stats.sem(values))
        result["ci"] = [float(values.mean() - margin), float(values.mean() + margin)]
    return result


def paired_values(rows, group_column, value_column, key_column, treatment, baseline):
    if not isinstance(key_column, str) or not key_column:
        raise ValueError("Paired design requires a real key/seed column")
    arms = {}
    for group in (treatment, baseline):
        mapping = {}
        for row in rows:
            if row[group_column] != group:
                continue
            key = row[key_column].strip()
            if not key or key in mapping:
                raise ValueError("Pair keys must be non-empty and unique within each arm")
            mapping[key] = common.number(row[value_column], value_column)
        arms[group] = mapping
    if not arms[treatment] or set(arms[treatment]) != set(arms[baseline]):
        raise ValueError("Paired arms must have identical one-to-one key sets; no dropped or invented pairs")
    keys = sorted(arms[treatment])
    return np.array([arms[treatment][key] for key in keys]), np.array([arms[baseline][key] for key in keys]), keys


def compare(a, b, method, confidence=0.95, alternative="two-sided"):
    a, b = np.asarray(a, float), np.asarray(b, float)
    result = {"n_treatment": len(a), "n_baseline": len(b), "mean_treatment": float(a.mean()),
              "mean_baseline": float(b.mean()), "difference": float(a.mean() - b.mean()),
              "difference_ci": None, "statistic": None, "p_raw": None, "alternative": alternative}
    gaps = []
    if min(len(a), len(b)) < 2:
        return result, ["Insufficient repetitions: both arms require at least two observations"]
    if method in ("paired_t", "wilcoxon") and len(a) != len(b):
        raise ValueError("Paired arms require equal sizes")
    difference = a - b if method in ("paired_t", "wilcoxon") else None
    if method in ("welch_t", "paired_t"):
        if (difference is not None and np.var(difference, ddof=1) == 0) or (difference is None and np.var(a, ddof=1) == 0 and np.var(b, ddof=1) == 0):
            return result, ["Zero sample variance: inferential t result is not estimable under this workflow"]
        if method == "paired_t":
            test = stats.ttest_rel(a, b, alternative=alternative)
            se, df = float(stats.sem(difference)), len(difference) - 1
        else:
            test = stats.ttest_ind(a, b, equal_var=False, alternative=alternative)
            va, vb = float(np.var(a, ddof=1) / len(a)), float(np.var(b, ddof=1) / len(b))
            se, df = math.sqrt(va + vb), (va + vb) ** 2 / (va ** 2 / (len(a) - 1) + vb ** 2 / (len(b) - 1))
        margin = float(stats.t.ppf((1 + confidence) / 2, df) * se)
        result.update(difference_ci=[result["difference"] - margin, result["difference"] + margin],
                      ci_method="paired-difference t" if method == "paired_t" else "Welch-Satterthwaite difference t", df=float(df))
    elif method == "mann_whitney":
        if len(set(np.concatenate([a, b]))) < 2:
            return result, ["All observations identical; rank comparison has no information"]
        test = stats.mannwhitneyu(a, b, alternative=alternative, method="auto")
        result["interpretation"] = "Distribution/rank comparison; not automatically a difference in medians"
    elif method == "wilcoxon":
        if np.all(difference == 0):
            return result, ["All paired differences are zero; signed-rank result is undefined"]
        test = stats.wilcoxon(difference, alternative=alternative, zero_method="wilcox", method="auto")
        result["zero_differences"] = int(np.sum(difference == 0))
        result["interpretation"] = "Signed-rank comparison of paired differences under symmetry"
    else:
        raise ValueError("Unsupported comparison method")
    result.update(statistic=float(test.statistic), p_raw=float(test.pvalue))
    if not math.isfinite(result["statistic"]) or not math.isfinite(result["p_raw"]):
        gaps.append("Non-finite test statistic/p-value is null; no significance conclusion")
    return finite_json(result), gaps


def adjust_pvalues(pvalues, method):
    p = np.asarray(pvalues, float)
    if p.ndim != 1 or not len(p) or not np.all(np.isfinite(p)) or np.any((p < 0) | (p > 1)):
        raise ValueError("Correction requires a complete finite family of p-values in [0,1]")
    order = np.argsort(p, kind="stable")
    sorted_p, size = p[order], len(p)
    if method == "holm":
        adjusted = np.maximum.accumulate(sorted_p * np.arange(size, 0, -1))
    elif method == "bh":
        adjusted = np.minimum.accumulate((sorted_p * size / np.arange(1, size + 1))[::-1])[::-1]
    else:
        raise ValueError("Correction method must be holm or bh")
    original = np.empty(size)
    original[order] = np.minimum(1, adjusted)
    return original.tolist()


def metric(spec):
    value = spec.get("metric")
    if not isinstance(value, dict) or not all(isinstance(value.get(key), str) and value[key].strip() for key in ("name", "unit")):
        raise ValueError("metric requires an explicit name and unit")
    if value.get("direction") not in ("higher", "lower", "two_sided"):
        raise ValueError("metric.direction must be higher, lower or two_sided")
    return value


def compute(rows, spec):
    if not isinstance(spec, dict):
        raise ValueError("Statistical spec must be a JSON object")
    method = spec.get("method")
    if method not in METHODS:
        raise ValueError("Select one supported statistical method")
    measurement = metric(spec)
    confidence = common.number(spec.get("confidence", 0.95), "confidence")
    alpha = common.number(spec.get("alpha", 0.05), "alpha")
    if not 0 < confidence < 1 or not 0 < alpha < 1:
        raise ValueError("confidence and alpha must be between zero and one")
    alternative = spec.get("alternative", "two-sided")
    if alternative not in ("two-sided", "less", "greater"):
        raise ValueError("Unsupported alternative")
    columns = spec.get("columns", {})
    if not isinstance(columns, dict):
        raise ValueError("columns must be an object")
    value, group, key = columns.get("value", "value"), columns.get("group"), columns.get("key")
    if method in ("pearson", "spearman", "ols") and group:
        raise ValueError("Correlation/regression cannot silently pool selected groups; select the intended paired data source")
    required = [columns.get("x"), columns.get("y")] if method in ("pearson", "spearman", "ols") else [value]
    if method in ("welch_t", "paired_t", "mann_whitney", "wilcoxon"):
        if not group:
            raise ValueError("Comparison needs a group column")
    if group:
        required.append(group)
    if method in ("paired_t", "wilcoxon"):
        required.append(key)
    if any(not isinstance(name, str) or not name for name in required) or any(name not in rows[0] for name in required):
        raise ValueError("Missing selected statistical columns")
    if method in ("pearson", "spearman", "ols") and columns["x"] == columns["y"]:
        raise ValueError("Select distinct x and y columns")
    policy = spec.get("missing", "error")
    if policy not in ("error", "exclude"):
        raise ValueError("missing must be error or exclude")
    if policy == "exclude" and method in ("paired_t", "wilcoxon"):
        raise ValueError("Paired observations cannot be silently excluded")
    clean, excluded = [], []
    for index, row in enumerate(rows, 2):
        if any(not row[name].strip() for name in required):
            if policy == "error":
                raise ValueError("Missing selected value on row " + str(index))
            excluded.append({"row": index, "reason": "missing selected value"})
            continue
        for name in required:
            if name not in (group, key):
                common.number(row[name], name)
        clean.append(row)
    if not clean:
        raise ValueError("No usable observations")
    declared = spec.get("assumptions", {})
    if not isinstance(declared, dict):
        raise ValueError("assumptions must be an object of verified booleans")
    gaps = ["Assumption requires scientific review: " + name for name in ASSUMPTIONS[method] if declared.get(name) is not True]
    results, groups = {}, {}
    if method in ("descriptive", "mean_ci"):
        for row in clean:
            groups.setdefault(row[group] if group else "all", []).append(common.number(row[value]))
        for name, values in groups.items():
            results[name] = mean_interval(values, confidence) if method == "mean_ci" else research.describe(values)
            if method == "mean_ci" and len(values) < 2:
                gaps.append(name + ": single observation has no mean CI")
            elif method == "mean_ci" and np.ptp(values) == 0:
                gaps.append(name + ": zero sample variance does not establish absence of uncertainty")
    elif method in ("welch_t", "paired_t", "mann_whitney", "wilcoxon"):
        comparisons = spec.get("comparisons")
        if not isinstance(comparisons, list) or not comparisons:
            raise ValueError("comparisons must explicitly identify treatment and baseline")
        for comparison in comparisons:
            if not isinstance(comparison, dict):
                raise ValueError("Comparison must be an object")
            name = research.identifier(comparison.get("id", ""))
            treatment, baseline = comparison.get("treatment"), comparison.get("baseline")
            if not isinstance(treatment, str) or not isinstance(baseline, str) or treatment == baseline or name in results:
                raise ValueError("Comparison needs distinct arms and unique ID")
            keys = None
            if method in ("paired_t", "wilcoxon"):
                a, b, keys = paired_values(clean, group, value, key, treatment, baseline)
            else:
                a = [common.number(row[value]) for row in clean if row[group] == treatment]
                b = [common.number(row[value]) for row in clean if row[group] == baseline]
                if not a or not b:
                    raise ValueError("Selected comparison arm is absent")
            item, missing = compare(a, b, method, confidence, alternative)
            results[name] = {**item, "treatment": treatment, "baseline": baseline, "pair_keys": keys}
            gaps += [name + ": " + gap for gap in missing]
    else:
        x = np.array([common.number(row[columns["x"]]) for row in clean])
        y = np.array([common.number(row[columns["y"]]) for row in clean])
        if not isinstance(spec.get("x_unit"), str) or not spec["x_unit"].strip():
            raise ValueError("Correlation/regression requires explicit x_unit")
        if len(x) < 3 or np.ptp(x) == 0 or np.ptp(y) == 0:
            gaps.append("At least three variable paired observations are required")
            results = {"statistic": None, "p_raw": None, "n": len(x)}
        elif method in ("pearson", "spearman"):
            test = stats.pearsonr(x, y, alternative=alternative) if method == "pearson" else stats.spearmanr(x, y, alternative=alternative)
            results = {"statistic": float(test.statistic), "p_raw": float(test.pvalue), "n": len(x)}
            if method == "pearson" and len(x) > 3:
                results["ci"] = list(test.confidence_interval(confidence_level=confidence))
                results["ci_method"] = "Fisher transformation"
        else:
            design = np.column_stack([np.ones(len(x)), x])
            coefficients, _, rank, _ = np.linalg.lstsq(design, y, rcond=None)
            if rank != 2:
                raise ValueError("OLS design is rank deficient")
            residuals = y - design @ coefficients
            df = len(x) - 2
            variance = float(residuals @ residuals / df)
            degenerate_uncertainty = float(np.max(np.abs(residuals))) <= np.finfo(float).eps * max(1, float(np.max(np.abs(y)))) * 32
            covariance = variance * np.linalg.inv(design.T @ design)
            se = np.sqrt(np.diag(covariance))
            critical = stats.t.ppf((1 + confidence) / 2, df)
            results = {"n": len(x), "df_residual": df, "residuals": residuals.tolist(), "fitted": (design @ coefficients).tolist(),
                       "residual_variance": variance, "r_squared": float(1 - residuals @ residuals / ((y - y.mean()) @ (y - y.mean()))), "coefficients": {}}
            for index, name in enumerate(("intercept", "slope")):
                p = float(2 * stats.t.sf(abs(coefficients[index] / se[index]), df)) if se[index] > 0 and not degenerate_uncertainty else None
                results["coefficients"][name] = {"estimate": float(coefficients[index]), "standard_error": float(se[index]),
                    "ci": [float(coefficients[index] - critical * se[index]), float(coefficients[index] + critical * se[index])], "p_raw": p,
                    "unit": measurement["unit"] if name == "intercept" else measurement["unit"] + "/" + spec["x_unit"]}
                if p is None:
                    gaps.append("Zero residual uncertainty; coefficient p-value is not reported")
    correction = spec.get("correction")
    if correction is not None:
        if method not in ("welch_t", "paired_t", "mann_whitney", "wilcoxon") or not isinstance(correction, dict):
            raise ValueError("Correction requires an explicitly selected comparison family")
        if not isinstance(correction.get("family"), str) or not correction["family"].strip():
            raise ValueError("Correction needs a named family")
        if isinstance(correction.get("family_count"), bool) or not isinstance(correction.get("family_count"), int) or correction["family_count"] != len(results):
            raise ValueError("family_count must equal every test in the selected complete family")
        if correction.get("method") not in ("holm", "bh"):
            raise ValueError("Correction method must be holm or bh")
        pvalues = [item["p_raw"] for item in results.values()]
        adjusted = adjust_pvalues(pvalues, correction["method"]) if all(p is not None for p in pvalues) else [None] * len(pvalues)
        if any(p is None for p in pvalues):
            gaps.append("Correction family contains an unestimable test; no adjusted decision")
        for item, corrected in zip(results.values(), adjusted):
            item.update(p_adjusted=corrected, alpha=alpha, correction_family=correction["family"],
                        correction_method=correction["method"], reject_adjusted=(corrected < alpha if corrected is not None and not gaps else None))
    finite = finite_json(results)
    if finite != results:
        gaps.append("Non-finite statistics replaced with null")
    return {"method": method, "parameters": spec, "metric": measurement, "unit": measurement["unit"],
            "units": {"value": measurement["unit"], **({"x": spec["x_unit"]} if "x_unit" in spec else {})},
            "orientation": measurement["direction"], "n": len(clean), "rows_total": len(rows), "rows_valid": len(clean),
            "excluded": excluded, "results": finite, "groups": finite if method in ("descriptive", "mean_ci") else {},
            "gaps": list(dict.fromkeys(gaps)), "scientific_conclusion": "pending"}, clean


def analyze(ws, args):
    specpath = ws.input(args.spec, {".json"})
    source, _, path = common.source_record(ws, args.source, {"data"})
    plan, _ = common.require_analysis_scope(ws, args.plan)
    if path.suffix.lower() != ".csv":
        raise ValueError("Statistics requires a registered CSV data source")
    inputs = [specpath, path, source / "source.json", plan / "plan.json"]

    def run(out):
        _, selected_plan = common.require_analysis_scope(ws, args.plan)
        if args.source not in selected_plan.get("source_ids", []):
            raise ValueError("Analysis source is not authorized by this plan")
        _, metadata, actual = common.source_record(ws, args.source, {"data"})
        spec = common.strict_json(specpath)
        rows = common.csv_rows(actual)
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            result, clean = compute(rows, spec)
        result["gaps"] += ["Statistical warning: " + str(item.message) for item in caught]
        result.update(source=args.source, input_sha256=research.digest(actual), data_label=metadata.get("data_label"), plan=args.plan)
        research.write_json(out / "result.json", result)
        research.write_csv(out / "cleaned.csv", clean, list(rows[0]))
        return {"status": "partial" if result["gaps"] else "complete", "scientific_conclusion": "pending", "gaps": result["gaps"]}

    return common.step(ws, "analysis", args.id, {"source": args.source, "plan": args.plan}, inputs, [source, plan], run, entry=__file__)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("workspace", "task", "id", "source", "spec", "plan"):
        parser.add_argument("--" + name, required=True)
    return common.cli(analyze, parser, argv)


if __name__ == "__main__":
    raise SystemExit(main())
