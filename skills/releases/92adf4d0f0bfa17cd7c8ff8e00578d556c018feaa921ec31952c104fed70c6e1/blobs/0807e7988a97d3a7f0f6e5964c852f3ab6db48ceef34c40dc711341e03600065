"""Independent-arm ablation effects, sorted relative to a configurable reference."""
import csv
from pathlib import Path

import numpy as np
from pi_figstyle import BASELINE, PALETTE, TEXT, diff_ci, figure, save, use_style

DATA = "figs/ablation.csv"
REFERENCE = "baseline"
HIGHLIGHT = "ours"


def load(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    groups, seen = {}, set()
    for row in rows:
        key = row["variant"], row["seed"]
        value = float(row["value"])
        if key in seen or not np.isfinite(value):
            raise ValueError(f"duplicate or nonfinite independent observation: {key}")
        seen.add(key)
        groups.setdefault(row["variant"], []).append(value)
    if not groups:
        raise ValueError("ablation data is empty")
    return {name: np.asarray(values) for name, values in groups.items()}


def main():
    groups = load(DATA)
    if REFERENCE not in groups:
        raise ValueError(f"ablation data must contain reference arm {REFERENCE!r}")
    for name, values in groups.items():
        print(f"{name}: n={len(values)} independent runs")
    comparisons = [(diff_ci(values, groups[REFERENCE]), name) for name, values in groups.items() if name != REFERENCE]
    comparisons.sort(key=lambda item: (item[0][0], item[1]))
    if not comparisons:
        raise ValueError("an ablation requires at least one comparison arm")
    use_style()
    fig, ax = figure(width=TEXT, ratio=.5)
    for position, ((difference, low, high), name) in enumerate(comparisons):
        color = PALETTE["red"] if name == HIGHLIGHT else BASELINE
        ax.errorbar(difference, position, xerr=[[difference - low], [high - difference]],
                    fmt="o", capsize=3, color=color)
        ax.annotate(f"{difference:+.2f}", (high, position), xytext=(5, 0),
                    textcoords="offset points", ha="left", va="center", color=color, fontsize=7)
    ax.axvline(0, color=BASELINE, linestyle="--", linewidth=.8)
    ax.set(yticks=range(len(comparisons)),
           yticklabels=[f"{name} (n={len(groups[name])})" for _, name in comparisons],
           xlabel=f"Difference from {REFERENCE} (n={len(groups[REFERENCE])}); 95% Welch CI")
    ax.set_ylim(-.6, len(comparisons) - .4)
    ax.margins(x=.25)
    ax.grid(axis="y", visible=False)
    save(fig, "figs/ablation")


if __name__ == "__main__":
    main()
