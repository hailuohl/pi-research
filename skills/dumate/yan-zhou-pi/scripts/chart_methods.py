"""Pure calculations behind the chart suite, separate from rendering and approval.

The scaling grid fit adapts alphaXiv's example (Copyright (c) 2026 alphaXiv).
MIT license: ../LICENSES/alphaXiv-MIT.txt. The original notice remains in the
copied references; no software demonstration values are imported as results.
"""
from __future__ import annotations

import math
import numpy as np

import alignment_common as common
import research
import statistics_workflow as statistics

KINDS = {"benchmarks", "ablation", "curves", "scaling", "pareto", "sweep", "confusion", "distribution", "diagram", "scatter"}


def order(spec, field, actual):
    selected = spec.get(field, sorted(set(actual)))
    if not isinstance(selected, list) or not selected or any(not isinstance(name, str) or not name.strip() for name in selected) or len(selected) != len(set(selected)) or set(selected) != set(actual):
        raise ValueError(field + " must list each actual category exactly once")
    return selected


def columns(rows, names, *, missing=()):
    if not rows or not set(names).issubset(rows[0]):
        raise ValueError("Missing chart columns: " + ", ".join(names))
    for row in rows:
        if any(not isinstance(row[name], str) or (name not in missing and not row[name].strip()) for name in names):
            raise ValueError("Missing required chart value")


def axis(spec, name):
    selected = spec.get(name)
    if not isinstance(selected, dict) or not all(isinstance(selected.get(field), str) and selected[field].strip() for field in ("name", "unit")):
        raise ValueError(name + " requires a quantity name and explicit unit")
    if selected.get("direction") not in ("higher", "lower", "two_sided"):
        raise ValueError(name + " requires higher/lower/two_sided direction")
    return selected


def benchmarks(rows, spec):
    columns(rows, ("benchmark", "method", "score"))
    methods = order(spec, "methods", [row["method"] for row in rows])
    names = order(spec, "benchmarks", [row["benchmark"] for row in rows])
    families = spec.get("method_families")
    if not isinstance(families, dict) or set(families) != set(methods) or any(not isinstance(value, str) or not value for value in families.values()):
        raise ValueError("Every benchmark method requires an explicit family")
    values = {}
    for row in rows:
        key = (row["benchmark"], row["method"])
        if key in values:
            raise ValueError("Duplicate benchmark/method score; aggregate only with an explicit statistical method")
        values[key] = common.number(row["score"], "score")
        if values[key] < 0:
            raise ValueError("Zero-baseline benchmark bars require nonnegative scores; use ablation for signed effects")
    if set(values) != {(name, method) for name in names for method in methods}:
        raise ValueError("Benchmark comparison must contain the complete fixed method grid")
    return {"methods": methods, "benchmarks": names, "families": families,
            "scores": {name: {method: values[name, method] for method in methods} for name in names},
            "n": len(rows), "ci_method": "none; one reported score per benchmark/method"}, []


def ablation(rows, spec):
    columns(rows, ("variant", "seed", "value"))
    variants = order(spec, "variants", [row["variant"] for row in rows])
    baseline = spec.get("baseline")
    if baseline not in variants or len(variants) < 2:
        raise ValueError("Ablation requires an existing baseline and at least one alternative")
    design = spec.get("design")
    if design not in ("independent", "paired"):
        raise ValueError("Ablation design must explicitly be independent or paired")
    seen, arms = set(), {name: [] for name in variants}
    for row in rows:
        key = row["variant"], row["seed"]
        if key in seen:
            raise ValueError("Duplicate variant/seed; repetitions must represent distinct runs")
        seen.add(key)
        arms[row["variant"]].append(common.number(row["value"]))
    method = "paired_t" if design == "paired" else "welch_t"
    assumptions = spec.get("assumptions", {})
    gaps = ["Assumption requires scientific review: " + name for name in statistics.ASSUMPTIONS[method] if assumptions.get(name) is not True]
    effects = {}
    for name in variants:
        if name == baseline:
            continue
        if design == "paired":
            a, b, keys = statistics.paired_values(rows, "variant", "value", "seed", name, baseline)
        else:
            a, b, keys = arms[name], arms[baseline], None
        effects[name], missing = statistics.compare(a, b, method)
        effects[name]["pair_keys"] = keys
        gaps += [name + ": " + item for item in missing]
    return {"baseline": baseline, "design": design, "effects": effects, "arms": {name: statistics.mean_interval(values) for name, values in arms.items()},
            "n": len(rows), "ci_method": "paired difference t 95%" if design == "paired" else "Welch-Satterthwaite difference t 95%"}, gaps


def curves(rows, spec):
    columns(rows, ("variant", "seed", "x", "value"))
    xaxis = axis(spec, "x")
    variants = order(spec, "variants", [row["variant"] for row in rows])
    quantity = xaxis.get("quantity")
    basis = spec.get("comparison_basis")
    if quantity not in ("optimizer_steps", "tokens", "samples", "flops", "wall_time") or basis not in ("same_config", "batch_change", "model_change", "efficiency"):
        raise ValueError("Curves require a real x quantity and explicit comparison_basis")
    if basis == "batch_change" and quantity not in ("tokens", "samples"):
        raise ValueError("Changed batch/sequence configurations require actual tokens or samples")
    if basis == "model_change":
        if quantity not in ("flops", "tokens"):
            raise ValueError("Model-size comparisons require FLOPs or tokens with actual model sizes")
        sizes = spec.get("model_sizes", {})
        if quantity == "tokens" and (set(sizes) != set(variants) or any(common.number(value, "model_size") <= 0 for value in sizes.values())):
            raise ValueError("Token comparison across sizes requires a positive actual model size for every variant")
    if basis == "efficiency" and (quantity != "wall_time" or not isinstance(spec.get("hardware"), str) or not spec["hardware"].strip()):
        raise ValueError("Efficiency comparison requires actual wall time and hardware description")
    runs = {}
    for row in rows:
        identity = row["variant"], row["seed"]
        points = runs.setdefault(identity, {})
        x = common.number(row["x"], "x")
        if x in points:
            raise ValueError("Duplicate x for one variant/seed")
        points[x] = common.number(row["value"], "value")
    if any(len(points) < 2 for points in runs.values()):
        raise ValueError("Each curve run needs two or more actual x values")
    lower = max(min(points) for points in runs.values())
    upper = min(max(points) for points in runs.values())
    if lower >= upper:
        raise ValueError("Runs have no common coverage interval; extrapolation is forbidden")
    requested = spec.get("grid")
    if requested is None:
        grid = sorted({x for points in runs.values() for x in points if lower <= x <= upper})
    else:
        if not isinstance(requested, list):
            raise ValueError("Curve grid must be an ordered numeric list")
        grid = [common.number(x, "grid") for x in requested]
        if len(grid) < 2 or any(a >= b for a, b in zip(grid, grid[1:])) or grid[0] < lower or grid[-1] > upper:
            raise ValueError("Curve grid must lie strictly ordered within common coverage")
    ema = spec.get("ema_alpha")
    if ema is not None:
        ema = common.number(ema, "ema_alpha")
        if spec.get("measurement_kind") != "training_loss" or not 0 < ema <= 1:
            raise ValueError("EMA is only supported for training_loss with alpha in (0,1]")
    if spec.get("measurement_kind") not in ("training_loss", "evaluation"):
        raise ValueError("Curve measurement_kind must explicitly be training_loss or evaluation")
    groups, gaps = {}, []
    if spec.get("assumptions", {}).get("independent_seeds") is not True:
        gaps.append("Seed independence requires scientific review")
    for name in variants:
        individuals, interpolated = [], []
        for (variant, seed), points in sorted(runs.items()):
            if variant != name:
                continue
            x = sorted(points)
            values = np.array([points[point] for point in x], float)
            visible = values.copy()
            if ema is not None:
                for index in range(1, len(visible)):
                    visible[index] = ema * values[index] + (1 - ema) * visible[index - 1]
            individuals.append({"seed": seed, "x": x, "raw": values.tolist(), "display": visible.tolist()})
            interpolated.append(np.interp(grid, x, visible))
        matrix = np.array(interpolated)
        summaries = [statistics.mean_interval(matrix[:, index]) for index in range(len(grid))]
        groups[name] = {"n": len(matrix), "mean": matrix.mean(axis=0).tolist(), "ci": [item["ci"] for item in summaries], "individuals": individuals}
        if len(matrix) < 2:
            gaps.append(name + ": single seed has no confidence interval")
    return {"variants": variants, "grid": grid, "common_coverage": [lower, upper], "groups": groups, "ema_alpha": ema,
            "n": len(runs), "ci_method": "pointwise two-sided 95% Student t mean intervals across seeds; linear interpolation inside common coverage"}, gaps


def fit_power_law(n, loss, alpha_limits=(0.02, 1.5), grid_size=800):
    """alphaXiv MIT grid-fit, rescaled for conditioning; residuals are in L."""
    n, loss = np.asarray(n, float), np.asarray(loss, float)
    scale = float(np.exp(np.log(n).mean()))
    best = None
    alphas = np.linspace(alpha_limits[0], alpha_limits[1], grid_size)
    for alpha in alphas:
        design = np.column_stack([np.ones(len(n)), (n / scale) ** -alpha])
        coef, _, rank, _ = np.linalg.lstsq(design, loss, rcond=None)
        if rank < 2 or coef[0] < 0 or coef[0] >= min(loss) or coef[1] <= 0:
            continue
        sse = float(np.sum((design @ coef - loss) ** 2))
        if best is None or sse < best[0]:
            best = sse, float(coef[0]), float(coef[1] * scale ** alpha), float(alpha)
    if best is None:
        raise ValueError("No fit with 0 <= E < min(loss) and positive A")
    return {"sse": best[0], "E": best[1], "A": best[2], "alpha": best[3],
            "alpha_at_boundary": best[3] in (float(alphas[0]), float(alphas[-1]))}


def scaling(rows, spec):
    columns(rows, ("family", "n_params", "loss", "fit"))
    if spec["metric"]["direction"] != "lower":
        raise ValueError("Loss scaling requires a lower-is-better metric")
    comparable = spec.get("comparability", {})
    if not isinstance(comparable, dict) or not all(comparable.get(name) is True for name in ("same_data", "same_tokenizer", "same_evaluation")) or not isinstance(comparable.get("rationale"), str) or not comparable["rationale"].strip():
        raise ValueError("Scaling fit requires explicit data/tokenizer/evaluation comparability and rationale")
    if not isinstance(spec.get("mechanism_interval"), str) or not spec["mechanism_interval"].strip():
        raise ValueError("Scaling fit requires a mechanism interval justification")
    points, fitted, excluded = [], [], []
    reasons = spec.get("excluded_reasons", {})
    for index, row in enumerate(rows, 2):
        if row["fit"] not in ("0", "1"):
            raise ValueError("Scaling fit column must be 0 or 1")
        point = {"row": index, "family": row["family"], "n_params": common.number(row["n_params"]), "loss": common.number(row["loss"]), "fit": row["fit"] == "1"}
        if point["n_params"] <= 0 or point["loss"] <= 0:
            raise ValueError("Scaling n_params and loss must be positive")
        points.append(point)
        if point["fit"]:
            fitted.append(point)
        else:
            reason = reasons.get(str(index))
            if not isinstance(reason, str) or not reason.strip():
                raise ValueError("Each excluded scaling row requires its own reason")
            excluded.append({**point, "reason": reason})
    if len(fitted) < 4 or len({point["n_params"] for point in fitted}) < 4:
        raise ValueError("Scaling law requires at least four comparable runs at distinct scales")
    n, loss = np.array([point["n_params"] for point in fitted]), np.array([point["loss"] for point in fitted])
    limits = spec.get("alpha_limits", [0.02, 1.5])
    if not isinstance(limits, list) or len(limits) != 2:
        raise ValueError("alpha_limits must contain two positive ordered values")
    limits = [common.number(value, "alpha_limit") for value in limits]
    if not 0 < limits[0] < limits[1] <= 5:
        raise ValueError("alpha_limits must be positive ordered and at most 5")
    fit = fit_power_law(n, loss, limits)
    draws, seed = spec.get("bootstrap_draws", 200), spec.get("bootstrap_seed", 0)
    if isinstance(draws, bool) or not isinstance(draws, int) or not 100 <= draws <= 10000 or isinstance(seed, bool) or not isinstance(seed, int) or seed < 0:
        raise ValueError("bootstrap_draws must be 100–10000 and seed a nonnegative integer")
    rng = np.random.default_rng(seed)
    alphas = []
    for _ in range(draws):
        indexes = rng.integers(0, len(n), len(n))
        if len(set(n[indexes])) < 3:
            continue
        try:
            alphas.append(fit_power_law(n[indexes], loss[indexes], limits)["alpha"])
        except ValueError:
            continue
    gaps = []
    minimum = max(25, math.ceil(draws / 4))
    interval = np.percentile(alphas, [2.5, 97.5]).tolist() if len(alphas) >= minimum else None
    if interval is None:
        gaps.append("Insufficient valid scaling bootstrap draws: " + str(len(alphas)) + "/" + str(draws))
    if fit["alpha_at_boundary"]:
        gaps.append("Alpha reaches its search boundary; fit is not constrained")
    floor_boundary = fit["E"] < min(loss) * 0.01 or min(loss) - fit["E"] < min(loss) * 0.01
    if floor_boundary:
        gaps.append("Irreducible floor E approaches a physical boundary; not a measured floor")
    if max(n) / min(n) < 10:
        gaps.append("Fit range spans less than one order of magnitude; scaling-law interpretation remains unverified")
    predict_to = common.number(spec.get("predict_to", max(n)), "predict_to")
    if predict_to < max(n):
        raise ValueError("predict_to cannot truncate the fitted range")
    residuals = (loss - (fit["E"] + fit["A"] * n ** -fit["alpha"])).tolist()
    return {"points": points, "fit": fit, "alpha_ci": interval, "floor_at_boundary": floor_boundary,
            "fit_n": len(fitted), "fit_range": [float(min(n)), float(max(n))], "predict_to": predict_to,
            "excluded": excluded, "residuals": [{"n_params": float(x), "residual": value} for x, value in zip(n, residuals)],
            "bootstrap": {"requested": draws, "valid": len(alphas), "minimum_valid": minimum, "seed": seed},
            "n": len(rows), "ci_method": "run bootstrap percentile alpha 95% interval; fit least squares on L"}, gaps


def nondominated(points, x_direction, y_direction):
    coordinates = np.array([[point["x"], point["y"]] for point in points])
    costs = coordinates * np.array([1 if x_direction == "lower" else -1, 1 if y_direction == "lower" else -1])
    keep = []
    for index, candidate in enumerate(costs):
        dominates = np.all(costs <= candidate, axis=1) & np.any(costs < candidate, axis=1)
        if not dominates.any():
            keep.append(index)
    return sorted(keep, key=lambda index: (points[index]["x"], points[index]["y"]))


def pareto(rows, spec):
    columns(rows, ("method", "setting", "seed", "x", "y"))
    xaxis, yaxis = axis(spec, "x"), axis(spec, "y")
    if "two_sided" in (xaxis["direction"], yaxis["direction"]):
        raise ValueError("Pareto directions must each be higher or lower")
    methods = order(spec, "methods", [row["method"] for row in rows])
    budgets = spec.get("budgets")
    if not isinstance(budgets, dict) or set(budgets) != set(methods):
        raise ValueError("Pareto requires explicit per-method scanning budgets")
    if not isinstance(spec.get("budget_unit"), str) or not spec["budget_unit"].strip() or not isinstance(spec.get("budget_comparability"), str) or not spec["budget_comparability"].strip():
        raise ValueError("Pareto budget unit and comparability/explanation are required")
    for value in budgets.values():
        if common.number(value, "budget") <= 0:
            raise ValueError("Scanning budgets must be positive")
    points, seen = [], set()
    for row in rows:
        identity = row["method"], row["setting"], row["seed"]
        if identity in seen:
            raise ValueError("Duplicate method/setting/seed")
        seen.add(identity)
        points.append({"method": row["method"], "setting": row["setting"], "seed": row["seed"], "x": common.number(row["x"]), "y": common.number(row["y"])})
    frontiers, settings = {}, {}
    for method in methods:
        selected = [point for point in points if point["method"] == method]
        frontiers[method] = [selected[index] for index in nondominated(selected, xaxis["direction"], yaxis["direction"])]
        settings[method] = len({point["setting"] for point in selected})
        if spec["budget_unit"] == "settings" and common.number(budgets[method]) != settings[method]:
            raise ValueError("Declared settings budget must match actual measured setting count")
    for field in ("x", "y"):
        if spec.get(field + "_scale", "linear") not in ("linear", "log"):
            raise ValueError("Axis scale must be linear or log")
        if spec.get(field + "_scale") == "log" and any(point[field] <= 0 for point in points):
            raise ValueError("Log axis requires positive actual values")
    return {"methods": methods, "points": points, "frontiers": frontiers, "settings": settings,
            "budgets": budgets, "n": len(points), "ci_method": "none; all actual setting/seed points retained; frontier segments are visual guides"}, []


def sweep(rows, spec):
    columns(rows, ("x", "y", "value"), missing=("value",))
    axis(spec, "x"), axis(spec, "y")
    panel_column = spec.get("panel_column")
    if panel_column:
        columns(rows, (panel_column,))
    panels = sorted({row[panel_column] if panel_column else "all" for row in rows})
    xs = sorted({common.number(row["x"]) for row in rows})
    ys = sorted({common.number(row["y"]) for row in rows})
    lookup = {}
    measured = []
    for row in rows:
        key = row[panel_column] if panel_column else "all", common.number(row["x"]), common.number(row["y"])
        if key in lookup:
            raise ValueError("Duplicate panel/x/y sweep cell")
        value = common.number(row["value"], "value") if row["value"].strip() else None
        lookup[key] = value
        if value is not None:
            measured.append(value)
    if not measured:
        raise ValueError("Sweep has no measured cells; do not render an all-empty result")
    norm = spec.get("norm", {})
    if not isinstance(norm, dict) or not isinstance(norm.get("signed", False), bool):
        raise ValueError("norm must declare signed as a boolean")
    signed = norm.get("signed", False)
    bound = max(abs(value) for value in measured)
    vmin = common.number(norm.get("vmin", -bound if signed else min(measured)), "vmin")
    vmax = common.number(norm.get("vmax", bound if signed else max(measured)), "vmax")
    if vmin == vmax:
        vmin, vmax = (vmin - 0.5, vmax + 0.5)
    if vmin >= vmax or (signed and not math.isclose(vmin, -vmax)) or any(value < vmin or value > vmax for value in measured):
        raise ValueError("Shared norm must cover every panel and signed norm must be symmetric around zero")
    matrices = {panel: [[lookup.get((panel, x, y)) for x in xs] for y in ys] for panel in panels}
    missing = sum(value is None for matrix in matrices.values() for row in matrix for value in row)
    return {"panels": panels, "x": xs, "y": ys, "matrices": matrices, "norm": {"signed": signed, "vmin": vmin, "vmax": vmax},
            "missing_cells": missing, "n": len(measured), "ci_method": "none; blank/unobserved cells are undefined (grey)"}, []


def confusion(data, spec):
    classes = spec.get("classes")
    if not isinstance(classes, list) or not classes or any(not isinstance(value, str) or not value for value in classes) or len(classes) != len(set(classes)):
        raise ValueError("Confusion classes must be an explicit unique ordered list")
    if not isinstance(spec.get("class_order_rationale"), str) or not spec["class_order_rationale"].strip():
        raise ValueError("Class order rationale is required")
    if isinstance(data, dict):
        if data.get("classes") != classes:
            raise ValueError("Counts matrix classes must match the selected actual order")
        counts = data.get("counts")
        if not isinstance(counts, list) or any(not isinstance(row, list) or any(isinstance(value, bool) for value in row) for row in counts):
            raise ValueError("Counts must be a numeric matrix, not booleans")
        raw = np.asarray(counts, dtype=float)
    else:
        columns(data, ("true", "predicted", "count"))
        raw = np.zeros((len(classes), len(classes)))
        seen = set()
        for row in data:
            if row["true"] not in classes or row["predicted"] not in classes:
                raise ValueError("CSV contains a class outside the selected order")
            key = classes.index(row["true"]), classes.index(row["predicted"])
            if key in seen:
                raise ValueError("Duplicate true/predicted count")
            seen.add(key)
            raw[key] = common.number(row["count"], "count")
        if len(seen) != len(classes) ** 2 and spec.get("missing_counts") != "zero":
            raise ValueError("Sparse counts require explicit missing_counts=zero convention")
    if raw.shape != (len(classes), len(classes)) or not np.all(np.isfinite(raw)) or np.any(raw < 0) or np.any(raw != np.floor(raw)) or raw.sum() == 0:
        raise ValueError("Confusion needs a nonempty true-by-predicted matrix of finite nonnegative integer counts")
    mode = spec.get("normalize")
    if mode not in ("counts", "row", "column"):
        raise ValueError("normalize must be counts, row or column")
    support, predicted = raw.sum(axis=1), raw.sum(axis=0)
    values = raw.copy()
    gaps = []
    if mode != "counts":
        denominator = support[:, None] if mode == "row" else predicted[None, :]
        values = np.divide(raw, denominator, out=np.full_like(raw, np.nan), where=denominator > 0)
        if np.any(denominator == 0):
            gaps.append("Zero-support normalization is undefined and retained as null/grey")
    return {"classes": classes, "counts": raw.astype(int).tolist(), "matrix": statistics.finite_json(values), "normalize": mode,
            "support": {name: int(count) for name, count in zip(classes, support)}, "predicted_support": {name: int(count) for name, count in zip(classes, predicted)},
            "n": int(raw.sum()), "ci_method": "none; row normalization=recall, column normalization=precision"}, gaps


def distribution(rows, spec):
    columns(rows, ("group", "value"))
    groups = order(spec, "groups", [row["group"] for row in rows])
    mode = spec.get("summary", "box")
    if mode not in ("box", "violin"):
        raise ValueError("Distribution summary must be box or violin")
    values = {group: [common.number(row["value"]) for row in rows if row["group"] == group] for group in groups}
    bins = spec.get("bins", "fd")
    if isinstance(bins, bool) or not ((isinstance(bins, int) and 1 <= bins <= 200) or (isinstance(bins, str) and bins in ("fd", "sturges", "auto"))):
        raise ValueError("Histogram bins must be 1–200 or fd/sturges/auto")
    edges = np.histogram_bin_edges([value for arm in values.values() for value in arm], bins=bins)
    gaps = []
    if mode == "violin" and any(len(arm) < 2 or np.ptp(arm) == 0 for arm in values.values()):
        raise ValueError("Violin density requires at least two distinct values per group; select box for degenerate samples")
    return {"groups": groups, "values": values, "summary": mode, "bin_edges": edges.tolist(),
            "summaries": {group: research.describe(arm) for group, arm in values.items()}, "n": len(rows),
            "ci_method": "none; histogram plus raw points and box/violin describe distribution, not mean uncertainty"}, gaps


def scatter(rows, spec):
    xaxis, yaxis = axis(spec, "x"), axis(spec, "y")
    xcolumn, ycolumn = xaxis.get("column", "x"), yaxis.get("column", "y")
    if xcolumn == ycolumn:
        raise ValueError("Scatter requires different x and y columns")
    columns(rows, (xcolumn, ycolumn))
    points = [{"x": common.number(row[xcolumn]), "y": common.number(row[ycolumn])} for row in rows]
    for name in ("x", "y"):
        if spec.get(name + "_scale", "linear") not in ("linear", "log") or (spec.get(name + "_scale") == "log" and any(point[name] <= 0 for point in points)):
            raise ValueError("Log axes require strictly positive data")
    return {"points": points, "n": len(points), "ci_method": "none; selected raw pairs, no fit or test"}, []


def diagram(data, spec):
    if not isinstance(data, dict) or not isinstance(data.get("nodes"), list) or not data["nodes"] or not isinstance(data.get("edges"), list):
        raise ValueError("Diagram source requires nodes and edges lists")
    direction = spec.get("flow", "LR")
    if direction not in ("LR", "TB"):
        raise ValueError("Diagram flow must be LR or TB")
    identifiers = []
    for node in data["nodes"]:
        if not isinstance(node, dict) or not isinstance(node.get("id"), str) or not node["id"] or not isinstance(node.get("label"), str) or not node["label"].strip():
            raise ValueError("Diagram nodes need unique id and text label")
        identifiers.append(node["id"])
        if node.get("type", "compute") not in ("compute", "data", "stage"):
            raise ValueError("Unsupported diagram node type")
    if len(identifiers) != len(set(identifiers)) or spec.get("contribution") not in identifiers:
        raise ValueError("Diagram needs unique nodes and exactly one selected contribution")
    adjacency, incoming = {name: [] for name in identifiers}, {name: 0 for name in identifiers}
    seen = set()
    for edge in data["edges"]:
        if not isinstance(edge, dict) or edge.get("from") not in identifiers or edge.get("to") not in identifiers or edge["from"] == edge["to"]:
            raise ValueError("Diagram edge endpoints must be distinct actual nodes")
        identity = edge["from"], edge["to"], edge.get("feedback", False)
        if identity in seen or not isinstance(edge.get("feedback", False), bool):
            raise ValueError("Duplicate edge or invalid feedback marker")
        seen.add(identity)
        if not edge.get("feedback", False):
            adjacency[edge["from"]].append(edge["to"])
            incoming[edge["to"]] += 1
        if not isinstance(edge.get("label", ""), str):
            raise ValueError("Edge label must be text")
    layer, ready = {}, [name for name in identifiers if incoming[name] == 0]
    for name in ready:
        layer[name] = 0
    visited = []
    while ready:
        name = ready.pop(0)
        visited.append(name)
        for target in adjacency[name]:
            layer[target] = max(layer.get(target, 0), layer[name] + 1)
            incoming[target] -= 1
            if incoming[target] == 0:
                ready.append(target)
    if len(visited) != len(identifiers):
        raise ValueError("Forward flow must be acyclic; explicitly mark meaningful feedback edges")
    positions = {}
    for level in sorted(set(layer.values())):
        names = [name for name in identifiers if layer[name] == level]
        for slot, name in enumerate(names):
            positions[name] = [level, slot - (len(names) - 1) / 2]
    return {"nodes": data["nodes"], "edges": data["edges"], "positions": positions, "flow": direction,
            "contribution": spec["contribution"], "n": len(identifiers), "ci_method": "none; provenance-labelled method schematic, no measured effect"}, []


def compute(data, spec):
    if not isinstance(spec, dict) or spec.get("kind") not in KINDS:
        raise ValueError("Select a supported chart kind")
    kind = spec["kind"]
    if kind not in ("diagram", "scatter", "pareto", "confusion"):
        statistics.metric(spec)
    result, gaps = globals()[kind](data, spec)
    return statistics.finite_json(result), gaps
