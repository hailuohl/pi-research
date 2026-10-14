#!/usr/bin/env python3
"""Compute and draw the full task-local chart suite with bound sources and audits."""
from __future__ import annotations

import argparse
from pathlib import Path
import sys
import warnings

import numpy as np

import alignment_common as common
import chart_methods
import plot_fonts
import research

PACKAGE = Path(__file__).resolve().parents[1]
STYLE = PACKAGE / "assets" / "figstyle.py"
EXTRA = [Path(chart_methods.__file__), PACKAGE / "scripts/statistics_workflow.py", Path(plot_fonts.__file__), STYLE]


def label(axis):
    return axis["name"] + "\n(" + axis["unit"] + ")"


def provenance(ws, data, selected_plan):
    for item in [*data.get("nodes", []), *data.get("edges", [])]:
        state = item.get("provenance")
        source_id = item.get("source_id")
        evidence_ids = item.get("evidence_ids")
        if state not in ("observed", "established", "hypothesis") or source_id not in selected_plan.get("source_ids", []):
            raise ValueError("Each diagram node/edge needs a plan-authorized source and observed/established/hypothesis provenance")
        if not isinstance(evidence_ids, list) or len(evidence_ids) != len(set(evidence_ids)) or not set(evidence_ids).issubset(selected_plan.get("evidence_ids", [])):
            raise ValueError("Diagram evidence must be explicitly selected by this plan")
        _, metadata, _ = common.source_record(ws, source_id)
        if state == "observed" and metadata.get("content_level") != "data":
            raise ValueError("Observed diagram elements require a registered data source")
        if state == "established" and not evidence_ids:
            raise ValueError("Established diagram elements require verified textual evidence")
        for eid in evidence_ids:
            folder = common.extension_record(ws, "evidence", eid)
            evidence = common.strict_json(folder / "evidence.json")
            if evidence.get("source_id") != source_id or evidence.get("source_sha256") != metadata.get("sha256"):
                raise ValueError("Diagram evidence/source bindings do not agree")


def draw(result, spec, style):
    import matplotlib.pyplot as plt
    from matplotlib.colors import Normalize, TwoSlopeNorm
    from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Polygon, Rectangle

    kind, values = spec["kind"], result["results"]
    colors, markers = style.CYCLE, ("o", "s", "^", "v", "P", "X", "D", "<", ">")
    if kind == "benchmarks":
        methods, names = values["methods"], values["benchmarks"]
        families = list(dict.fromkeys(values["families"].values()))
        if len(families) > len(colors):
            raise ValueError("Too many benchmark families for distinguishable colors; split the figure")
        palette = {}
        for index, family in enumerate(families):
            members = [name for name in methods if values["families"][name] == family]
            shades = style.family(("blue", "orange", "green", "red", "purple", "cyan")[index], len(members))
            palette.update(zip(members, shades))
        fig, ax = style.figure(width=style.TEXT, ratio=0.8)
        x, width = np.arange(len(names)), 0.8 / len(methods)
        for index, method in enumerate(methods):
            bars = ax.bar(x + (index - (len(methods) - 1) / 2) * width, [values["scores"][name][method] for name in names], width,
                          color=style.BASELINE if method == spec.get("baseline") else palette[method], label=method)
            ax.bar_label(bars, fmt="%.3g", padding=2, fontsize=5)
        ax.set_xticks(x, names)
        ax.set_xlabel("Benchmark")
        ax.set_ylabel(label(spec["metric"]))
        ax.set_ylim(bottom=0)
        ax.margins(y=0.15)
        ax.legend(loc="lower left", bbox_to_anchor=(0, 1.02), ncol=min(3, len(methods)))
    elif kind == "ablation":
        names = sorted(values["effects"], key=lambda name: values["effects"][name]["difference"])
        fig, ax = style.figure(width=style.TEXT, ratio=max(0.55, len(names) * 0.12))
        ax.axvline(0, color=style.BASELINE, linewidth=0.7)
        for index, name in enumerate(names):
            item = values["effects"][name]
            interval, difference = item["difference_ci"], item["difference"]
            if interval is not None:
                ax.errorbar(difference, index, xerr=[[difference - interval[0]], [interval[1] - difference]], fmt="o", color=colors[0], capsize=2)
            else:
                ax.scatter(difference, index, marker="o", color=colors[0])
        ax.set_yticks(np.arange(len(names)), [name + " (n=" + str(values["effects"][name]["n_treatment"]) + ")" for name in names])
        ax.set_ylabel("Variant; baseline " + values["baseline"] + " (n=" + str(values["arms"][values["baseline"]]["n"]) + ")")
        ax.set_xlabel("Difference from baseline: " + label(spec["metric"]))
    elif kind == "curves":
        if len(values["variants"]) > len(colors):
            raise ValueError("Too many curve variants; split the figure")
        fig, ax = style.figure(width=style.TEXT, ratio=0.75)
        for index, name in enumerate(values["variants"]):
            arm, color = values["groups"][name], style.BASELINE if name == spec.get("baseline") else colors[index]
            for individual in arm["individuals"]:
                ax.plot(individual["x"], individual["raw"], color=color, alpha=0.18, linewidth=0.6)
                if values["ema_alpha"] is not None:
                    ax.plot(individual["x"], individual["display"], color=color, alpha=0.35, linewidth=0.6)
            ax.plot(values["grid"], arm["mean"], color=color, label=name + " (n=" + str(arm["n"]) + ")")
            if all(interval is not None and all(value is not None for value in interval) for interval in arm["ci"]):
                ax.fill_between(values["grid"], [interval[0] for interval in arm["ci"]], [interval[1] for interval in arm["ci"]], color=color, alpha=0.15, linewidth=0)
        ax.set_xlabel(label(spec["x"]))
        ax.set_ylabel(label(spec["metric"]))
        ax.legend(loc="lower left", bbox_to_anchor=(0, 1.02), ncol=min(3, len(values["variants"])))
    elif kind == "scaling":
        families = list(dict.fromkeys(point["family"] for point in values["points"]))
        if len(families) > len(markers):
            raise ValueError("Too many scaling families; split the figure")
        fig, (ax, residual) = style.figure_grid(nrows=2, ncols=1, width=style.TEXT, ratio=0.8, sharex=True, gridspec_kw={"height_ratios": [3, 1]})
        fit, (lower, upper) = values["fit"], values["fit_range"]
        curve = lambda x: fit["E"] + fit["A"] * x ** -fit["alpha"]
        measured = np.geomspace(lower, upper, 100)
        ax.plot(measured, curve(measured), color=style.BASELINE)
        if values["predict_to"] > upper:
            beyond = np.geomspace(upper, values["predict_to"], 100)
            ax.plot(beyond, curve(beyond), color=style.BASELINE, linestyle="--")
            ax.axvspan(upper, values["predict_to"], color=style.BASELINE, alpha=0.08, linewidth=0)
        for index, family in enumerate(families):
            for fitted in (True, False):
                points = [point for point in values["points"] if point["family"] == family and point["fit"] == fitted]
                if points:
                    ax.scatter([point["n_params"] for point in points], [point["loss"] for point in points], marker=markers[index],
                               facecolors=colors[index % len(colors)] if fitted else "none", edgecolors=colors[index % len(colors)], label=family if fitted else None)
        equation = "L = " + format(fit["E"], ".3g") + " + " + format(fit["A"], ".3g") + " N^(−" + format(fit["alpha"], ".3g") + ")"
        interval = values["alpha_ci"]
        equation += "\nα 95% CI: " + ("[" + ", ".join(format(value, ".3g") for value in interval) + "]" if interval else "undefined") + "; n=" + str(values["fit_n"])
        ax.text(0.02, 0.04, equation, transform=ax.transAxes, fontsize=7, va="bottom")
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.set_ylabel(label(spec["metric"]))
        ax.legend(loc="lower left", bbox_to_anchor=(0, 1.02), ncol=min(3, len(families)))
        residual.axhline(0, color=style.BASELINE, linewidth=0.6)
        residual.scatter([item["n_params"] for item in values["residuals"]], [item["residual"] for item in values["residuals"]], color=colors[0], s=8)
        residual.set_xlabel("Non-embedding parameters (count)")
        residual.set_ylabel("Residual\n(" + spec["metric"]["unit"] + ")")
        style.si_ticks(residual, "x")
    elif kind == "pareto":
        if len(values["methods"]) > min(len(colors), len(markers)):
            raise ValueError("Too many Pareto methods; split the figure")
        fig, ax = style.figure(width=style.TEXT, ratio=0.75)
        for index, name in enumerate(values["methods"]):
            points = [point for point in values["points"] if point["method"] == name]
            ax.scatter([point["x"] for point in points], [point["y"] for point in points], marker=markers[index], color=colors[index], alpha=0.3)
            frontier = values["frontiers"][name]
            ax.plot([point["x"] for point in frontier], [point["y"] for point in frontier], marker=markers[index], color=colors[index],
                    label=name + " (" + str(values["settings"][name]) + " settings)")
        ax.set_xlabel(label(spec["x"]))
        ax.set_ylabel(label(spec["y"]))
        ax.set_xscale(spec.get("x_scale", "linear"))
        ax.set_yscale(spec.get("y_scale", "linear"))
        ax.legend(loc="lower left", bbox_to_anchor=(0, 1.02), ncol=min(3, len(values["methods"])))
    elif kind in ("sweep", "confusion"):
        panels = values["panels"] if kind == "sweep" else ["all"]
        fig, axes = style.figure_grid(nrows=1, ncols=len(panels), width=style.TEXT, ratio=max(0.55, 0.85 / len(panels)), squeeze=False)
        axes = axes.ravel()
        if kind == "sweep":
            signed = values["norm"]["signed"]
            norm = TwoSlopeNorm(vmin=values["norm"]["vmin"], vcenter=0, vmax=values["norm"]["vmax"]) if signed else Normalize(values["norm"]["vmin"], values["norm"]["vmax"])
            cmap = plt.get_cmap(style.DIVERGING if signed else style.SEQUENTIAL).copy()
        else:
            norm = Normalize(0, max(max(row) for row in values["counts"])) if values["normalize"] == "counts" else Normalize(0, 1)
            cmap = plt.get_cmap(style.SEQUENTIAL).copy()
        cmap.set_bad("#B8B8B8")
        for ax, panel in zip(axes, panels):
            matrix = values["matrices"][panel] if kind == "sweep" else values["matrix"]
            matrix = np.array([[np.nan if value is None else value for value in row] for row in matrix], float)
            image = ax.imshow(matrix, interpolation="nearest", aspect="equal", cmap=cmap, norm=norm)
            if kind == "sweep":
                ax.set_xticks(range(len(values["x"])), [format(value, ".3g") for value in values["x"]])
                ax.set_yticks(range(len(values["y"])), [format(value, ".3g") for value in values["y"]])
                ax.set_xlabel(label(spec["x"]))
                ax.set_ylabel(label(spec["y"]))
                if len(panels) > 1:
                    ax.text(0, 1.02, panel, transform=ax.transAxes, va="bottom", fontsize=7)
                if np.isfinite(matrix).any() and spec["metric"]["direction"] != "two_sided":
                    good = np.nanargmax(matrix) if spec["metric"]["direction"] == "higher" else np.nanargmin(matrix)
                    best = np.unravel_index(good, matrix.shape)
                    ax.add_patch(Rectangle((best[1] - 0.48, best[0] - 0.48), 0.96, 0.96, fill=False, edgecolor="white", linewidth=1))
            else:
                ax.set_xticks(range(len(values["classes"])), values["classes"])
                ax.set_yticks(range(len(values["classes"])), values["classes"])
                ax.set_xlabel("Predicted class")
                ax.set_ylabel("True class")
            ax.grid(False)
            if max(matrix.shape) <= 12:
                style.annotate_matrix(ax, matrix, fmt="{:.0f}" if kind == "confusion" and values["normalize"] == "counts" else "{:.2g}", image=image)
        colorbar = fig.colorbar(image, ax=axes.tolist(), shrink=0.95)
        colorbar.set_label(label(spec["metric"]) if kind == "sweep" else ("Count\n(observations)" if values["normalize"] == "counts" else "Fraction\n(dimensionless)\n" + values["normalize"] + " normalized"))
    elif kind == "distribution":
        groups, data = values["groups"], [values["values"][name] for name in values["groups"]]
        if len(groups) > len(colors):
            raise ValueError("Too many distribution groups; split the figure")
        fig, (histogram, summary) = style.figure_grid(nrows=1, ncols=2, width=style.TEXT, ratio=0.55)
        for index, name in enumerate(groups):
            histogram.hist(data[index], bins=values["bin_edges"], histtype="step", color=colors[index], label=name + " (n=" + str(len(data[index])) + ")")
        histogram.set_xlabel(label(spec["metric"]))
        histogram.set_ylabel("Count (observations)")
        histogram.legend(loc="lower left", bbox_to_anchor=(0, 1.02))
        if values["summary"] == "box":
            summary.boxplot(data, tick_labels=groups, showfliers=False)
        else:
            summary.violinplot(data, positions=range(1, len(groups) + 1), showmedians=True, showextrema=True)
            summary.set_xticks(range(1, len(groups) + 1), groups)
        for index, observations in enumerate(data, 1):
            offsets = np.linspace(-0.08, 0.08, len(observations)) if len(observations) > 1 else [0]
            summary.scatter(index + np.array(offsets), observations, color=colors[index - 1], alpha=0.6, s=6)
        summary.set_xlabel("Group")
        summary.set_ylabel(label(spec["metric"]))
    elif kind == "scatter":
        fig, ax = style.figure(width=style.TEXT, ratio=0.68)
        ax.scatter([point["x"] for point in values["points"]], [point["y"] for point in values["points"]], color=colors[0])
        ax.set_xlabel(label(spec["x"]))
        ax.set_ylabel(label(spec["y"]))
        ax.set_xscale(spec.get("x_scale", "linear"))
        ax.set_yscale(spec.get("y_scale", "linear"))
    else:
        positions = values["positions"]
        levels = max(point[0] for point in positions.values()) + 1
        slots = max(point[1] for point in positions.values()) - min(point[1] for point in positions.values()) + 1
        fig, ax = style.figure(width=style.TEXT, ratio=max(0.5, slots / max(1, levels) * 0.6))
        ax.set_axis_off()
        transformed = {name: (point[0] * 1.7, -point[1] * 1.3) if values["flow"] == "LR" else (point[1] * 1.7, -point[0] * 1.3) for name, point in positions.items()}
        for node in values["nodes"]:
            x, y = transformed[node["id"]]
            color = colors[0] if node["id"] == values["contribution"] else style.MUTED
            if node.get("type") == "data":
                patch = Polygon([(x - 0.62, y - 0.3), (x + 0.62, y - 0.3), (x + 0.52, y + 0.3), (x - 0.52, y + 0.3)], facecolor=color, alpha=0.2, edgecolor=color)
            else:
                patch = FancyBboxPatch((x - 0.62, y - 0.3), 1.24, 0.6, boxstyle="round,pad=0.03", facecolor=color, alpha=0.2, edgecolor=color,
                                      linestyle="--" if node.get("type") == "stage" else "-")
            ax.add_patch(patch)
            ax.text(x, y, node["label"] + "\n[" + node["provenance"] + "]", ha="center", va="center", fontsize=7, wrap=True)
        for edge in values["edges"]:
            start, end = np.array(transformed[edge["from"]]), np.array(transformed[edge["to"]])
            vector = end - start
            vector /= np.linalg.norm(vector)
            start, end = start + vector * 0.65, end - vector * 0.65
            feedback = edge.get("feedback", False)
            ax.add_patch(FancyArrowPatch(start, end, arrowstyle="-|>", mutation_scale=7, linewidth=0.8, color=style.BASELINE,
                                        linestyle="--" if feedback else (":" if edge["provenance"] == "hypothesis" else "-"), connectionstyle="arc3,rad=0.35" if feedback else "arc3,rad=0"))
            midpoint = (start + end) / 2
            ax.text(midpoint[0], midpoint[1] + (0.25 if feedback else 0.12), edge.get("label", "") + " [" + edge["provenance"] + "]", ha="center", va="bottom", fontsize=6)
        xs, ys = zip(*transformed.values())
        ax.set_xlim(min(xs) - 0.9, max(xs) + 0.9)
        ax.set_ylim(min(ys) - 0.7, max(ys) + 0.9)
    return fig


def caption(result, spec):
    values = result["results"]
    text = "Source designation: " + str(result.get("data_label")) + ". "
    text += spec["kind"] + ("; nodes=" if spec["kind"] == "diagram" else "; n=") + str(values["n"]) + ". " + values["ci_method"] + ". "
    directions = {"higher": "higher is better", "lower": "lower is better", "two_sided": "two-sided; no one-way optimum"}
    for name in ("metric", "x", "y"):
        if isinstance(spec.get(name), dict):
            text += name + " " + spec[name]["name"] + ": " + directions[spec[name]["direction"]] + ". "
    if spec["kind"] == "ablation":
        text += "Actual arm n: " + "; ".join(name + "=" + str(item["n"]) for name, item in values["arms"].items()) + ". "
    elif spec["kind"] == "curves":
        text += "Actual seed n: " + "; ".join(name + "=" + str(item["n"]) for name, item in values["groups"].items()) + ". "
        text += "EMA alpha=" + str(values["ema_alpha"]) + "; all original individual traces retained. "
        text += "Comparison basis=" + spec["comparison_basis"] + "; x quantity=" + spec["x"]["quantity"] + ". "
        if "model_sizes" in spec:
            text += "Actual model sizes=" + str(spec["model_sizes"]) + ". "
        if "hardware" in spec:
            text += "Hardware=" + spec["hardware"] + ". "
    elif spec["kind"] == "scaling":
        text += "Mechanism interval: " + spec["mechanism_interval"] + ". Exclusions: " + str(values["excluded"]) + ". "
        text += "Bootstrap valid/requested=" + str(values["bootstrap"]["valid"]) + "/" + str(values["bootstrap"]["requested"]) + "; extrapolation dashed and shaded. E boundary=" + str(values["floor_at_boundary"]) + ". "
    elif spec["kind"] == "pareto":
        text += "Settings: " + str(values["settings"]) + "; budgets=" + str(values["budgets"]) + " " + spec["budget_unit"] + ". " + spec["budget_comparability"] + ". "
    elif spec["kind"] == "sweep":
        text += "Undefined/unfinished cells=" + str(values["missing_cells"]) + " (grey); shared normalization=" + str(values["norm"]) + ". "
    elif spec["kind"] == "confusion":
        text += "Class support=" + str(values["support"]) + "; predicted support=" + str(values["predicted_support"]) + "; normalization=" + values["normalize"] + ". "
    elif spec["kind"] == "diagram":
        text += "Single contribution=" + values["contribution"] + "; dashed arrows are feedback; hypothesis labels are proposed, not observed results. "
    return text


def chart(ws, args):
    specpath = ws.input(args.spec, {".json"})
    prepared = common.strict_json(specpath)
    prepared = prepared if isinstance(prepared, dict) else {}
    source, _, path = common.source_record(ws, args.source, {"data"})
    plan, selected_plan = common.require_analysis_scope(ws, args.plan)
    inputs = [specpath, path, source / "source.json", plan / "plan.json"]
    dependencies = [source, plan]
    if prepared.get("kind") == "diagram":
        preview = common.strict_json(path) if path.suffix.lower() == ".json" else {}
        preview = preview if isinstance(preview, dict) else {}
        for item in [*preview.get("nodes", []), *preview.get("edges", [])]:
            folder, _, actual = common.source_record(ws, item.get("source_id"))
            dependencies.append(folder)
            inputs += [folder / "source.json", actual]
            for eid in item.get("evidence_ids", []):
                folder = common.extension_record(ws, "evidence", eid)
                dependencies.append(folder)
                inputs.append(folder / "evidence.json")

    def calculate(out):
        _, current_plan = common.require_analysis_scope(ws, args.plan)
        if args.source not in current_plan.get("source_ids", []):
            raise ValueError("Chart source is not authorized by this plan")
        _, metadata, actual = common.source_record(ws, args.source, {"data"})
        spec = common.strict_json(specpath)
        if not isinstance(spec, dict) or spec.get("kind") not in chart_methods.KINDS:
            raise ValueError("Unsupported chart kind")
        if spec["kind"] == "diagram" and actual.suffix.lower() != ".json":
            raise ValueError("Diagram requires an explicitly registered JSON data source")
        json_input = spec["kind"] in ("diagram", "confusion") and actual.suffix.lower() == ".json"
        if not json_input and actual.suffix.lower() != ".csv":
            raise ValueError("This chart requires registered CSV data; diagram/count matrix can use JSON")
        data = common.strict_json(actual) if json_input else common.csv_rows(actual)
        if spec["kind"] == "diagram":
            provenance(ws, data, current_plan)
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            values, gaps = chart_methods.compute(data, spec)
        gaps += ["Calculation warning: " + str(item.message) for item in caught]
        result = {"source": args.source, "input_sha256": research.digest(actual), "data_label": metadata.get("data_label"),
                  "plan": args.plan, "method": spec["kind"], "parameters": spec, "n": values["n"], "results": values,
                  "units": {name: item["unit"] for name, item in spec.items() if name in ("metric", "x", "y") and isinstance(item, dict)},
                  "orientation": {name: item["direction"] for name, item in spec.items() if name in ("metric", "x", "y") and isinstance(item, dict)},
                  "gaps": gaps, "scientific_conclusion": "pending"}
        research.write_json(out / "result.json", result)
        if isinstance(data, list):
            research.write_csv(out / "cleaned.csv", data, list(data[0]))
        else:
            research.write_json(out / "cleaned.json", data)
        return {"status": "partial" if gaps else "complete", "gaps": gaps, "scientific_conclusion": "pending"}

    common.step(ws, "analysis", args.id, {"source": args.source, "plan": args.plan}, list(dict.fromkeys(inputs)), list(dict.fromkeys(dependencies)), calculate,
                entry=__file__, extra=EXTRA)
    analysis = common.extension_record(ws, "analysis", args.id)
    cleaned = analysis / ("cleaned.csv" if (analysis / "cleaned.csv").is_file() else "cleaned.json")

    def render(out):
        common.extension_record(ws, "analysis", args.id)
        result = common.strict_json(analysis / "result.json")
        spec = result["parameters"]
        assets = str(STYLE.parent)
        if assets not in sys.path:
            sys.path.insert(0, assets)
        import figstyle
        import matplotlib as mpl
        import matplotlib.pyplot as plt
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            figstyle.use_style()
            fig = draw(result, spec, figstyle)
            try:
                font = plot_fonts.apply(fig, out)
                fig.canvas.draw()
                issues = figstyle._audit(fig)
                with mpl.rc_context({"svg.fonttype": "path"}):
                    paths = figstyle.save(fig, str(out / "figure"), formats=("png", "svg", "pdf"), close=False)
            finally:
                plt.close(fig)
                plot_fonts.release(out)
        issues = list(dict.fromkeys([*result["gaps"], *font["issues"], *issues, *[str(item.message) for item in caught]]))
        research.write_json(out / "chart-spec.json", spec)
        if spec["kind"] == "diagram":
            research.write_json(out / "diagram-source.json", common.strict_json(cleaned))
        manifest = {"figure_id": args.id, "analysis": args.id, "kind": spec["kind"], "data_source": result["source"],
                    "data_sha256": result["input_sha256"], "analysis_sha256": research.digest(analysis / "result.json"),
                    "data_label": result["data_label"], "files": [Path(path).name for path in paths], "width_inches": figstyle.TEXT,
                    "orientation": result["orientation"],
                    "caption": caption(result, spec), "audit": {"status": "warning" if issues else "pass", "issues": issues},
                    "font": font, "visual_check": "pending", "scientific_conclusion": "pending"}
        manifest["svg_text"] = "vector paths; editable source data and chart/diagram specifications are retained"
        research.write_json(out / "manifest.json", manifest)
        return {"status": "partial" if issues else "complete", "audit_issues": issues, "visual_check": "pending", "scientific_conclusion": "pending"}

    return common.step(ws, "figures", args.id, {"analysis": args.id, "style_sha256": research.digest(STYLE)},
                       [analysis / "result.json", cleaned], [analysis], render, entry=__file__, extra=EXTRA)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("workspace", "task", "id", "source", "spec", "plan"):
        parser.add_argument("--" + name, required=True)
    return common.cli(chart, parser, argv)


if __name__ == "__main__":
    raise SystemExit(main())
