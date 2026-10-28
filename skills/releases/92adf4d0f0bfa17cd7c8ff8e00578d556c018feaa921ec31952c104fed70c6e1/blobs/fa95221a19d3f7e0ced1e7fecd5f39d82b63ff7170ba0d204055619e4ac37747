"""Grouped benchmark accuracy, preserving declared method-group colors."""
import csv
from pathlib import Path

import numpy as np
from pi_figstyle import BASELINE, WIDE, family, figure, save, use_style

DATA = "figs/benchmarks.csv"
METHODS = [("Qwen2.5-Math-7B", "base"), ("SimpleRL-Zero-7B (GRPO)", "prior"),
           ("OpenReasoner-Zero-7B (PPO)", "prior"), ("Oat-Zero-7B (Dr.GRPO)", "prior"),
           (r"ES$_\mathrm{CHKPT-1}$", "ours"), (r"ES$_\mathrm{CHKPT-2}$", "ours"),
           (r"ES$_\mathrm{CHKPT-3}$", "ours")]
BENCHMARKS = ["AIME 2024", "Minerva Math", "OlympiadBench", "AMC", "MATH500"]


def method_colors():
    palettes = {"base": [BASELINE] * sum(group == "base" for _, group in METHODS),
                "prior": family("blue", max(1, sum(group == "prior" for _, group in METHODS))),
                "ours": family("red", max(1, sum(group == "ours" for _, group in METHODS)))}
    counts, result = dict.fromkeys(palettes, 0), {}
    for name, group in METHODS:
        if group not in palettes:
            raise ValueError(f"unknown method group: {group}")
        result[name] = palettes[group][counts[group]]
        counts[group] += 1
    return result


def load(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    scores = {}
    names = {name for name, _ in METHODS}
    for row in rows:
        benchmark, method = row["benchmark"], row["method"]
        if benchmark not in BENCHMARKS or method not in names or benchmark in scores.get(method, {}):
            raise ValueError(f"duplicate or undeclared benchmark/method: {(benchmark, method)}")
        score = float(row["score"])
        if not np.isfinite(score):
            raise ValueError("benchmark scores must be finite")
        scores.setdefault(method, {})[benchmark] = score
    if not scores:
        raise ValueError("benchmark data is empty")
    return scores


def main():
    scores, colors = load(DATA), method_colors()
    use_style()
    fig, ax = figure(width=WIDE, ratio=.73)
    height, positions = .8 / len(METHODS), np.arange(len(BENCHMARKS))
    for index, (method, _) in enumerate(METHODS):
        values = [scores.get(method, {}).get(name, np.nan) for name in BENCHMARKS]
        bars = ax.barh(positions + (index - (len(METHODS) - 1) / 2) * height,
                       values, height=height * .9, label=method, color=colors[method])
        ax.bar_label(bars, labels=[f"{value:g}" if np.isfinite(value) else "" for value in values], padding=2, fontsize=5.5)
    values = [value for observations in scores.values() for value in observations.values()]
    low, high = min(values), max(values)
    ax.set_xlim(min(0, low) - .03 * max(1, abs(low)), high + .2 * max(1, abs(high)))
    ax.set(yticks=positions, yticklabels=BENCHMARKS, xlabel="Accuracy (%)")
    ax.invert_yaxis()
    ax.grid(axis="y", visible=False)
    ax.legend(loc="upper left", bbox_to_anchor=(1.01, 1), frameon=False, fontsize=6)
    missing = len(METHODS) * len(BENCHMARKS) - len(values)
    print(f"Single reported accuracy per cell; missing cells={missing}, rendered blank; no CI inferred.")
    save(fig, "figs/benchmarks")


if __name__ == "__main__":
    main()
