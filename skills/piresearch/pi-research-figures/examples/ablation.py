# SOFTWARE DEMONSTRATION TEMPLATE — NOT RESEARCH RESULTS.
"""Accuracy change vs. the baseline. Regenerate: python figs/ablation.py"""

import csv
from collections import defaultdict

import numpy as np
from pi_figstyle import BASELINE, COLUMN, PALETTE, diff_ci, figure, save, use_style

DATA = "figs/ablation.csv"
REFERENCE = "baseline"
HIGHLIGHT = "ours"


def load(path):
    runs = defaultdict(list)
    with open(path) as handle:
        for row in csv.DictReader(handle):
            runs[row["variant"]].append(float(row["value"]))
    return {variant: np.array(values) for variant, values in runs.items()}


def main():
    use_style()
    runs = load(DATA)
    reference = runs[REFERENCE]
    seed_counts = {variant: len(values) for variant, values in runs.items()}

    effects = [
        (variant, *diff_ci(values, reference))
        for variant, values in runs.items()
        if variant != REFERENCE
    ]
    effects.sort(key=lambda row: row[1])  # ascending: best ends up on top

    fig, ax = figure(width=COLUMN, ratio=0.1 + 0.16 * len(effects))
    ax.axvline(0, color=BASELINE, linewidth=0.8, zorder=1)

    for y, (variant, delta, lo, hi) in enumerate(effects):
        color = PALETTE["blue"] if variant == HIGHLIGHT else "#4D4D4D"
        ax.plot([lo, hi], [y, y], color=color, linewidth=1.0, solid_capstyle="round", zorder=2)
        ax.plot([delta], [y], "o", color=color, zorder=3)
        # Sign included: a delta figure is read for direction first.
        ax.annotate(
            f"{delta:+.2f}",
            xy=(hi, y), xytext=(4, 0), textcoords="offset points",
            va="center", fontsize=7, color=color,
        )

    ax.set_yticks(range(len(effects)), [variant for variant, *_ in effects])
    ax.set_ylim(-0.6, len(effects) - 0.4)
    ax.set_xlabel(f"Accuracy vs. {REFERENCE} (points)")
    ax.grid(axis="x")
    ax.grid(axis="y", visible=False)
    ax.tick_params(axis="y", length=0)
    ax.margins(x=0.18)
    print(f"seeds per variant: {seed_counts} — state the actual counts in the caption")

    save(fig, "figs/ablation")


if __name__ == "__main__":
    main()
