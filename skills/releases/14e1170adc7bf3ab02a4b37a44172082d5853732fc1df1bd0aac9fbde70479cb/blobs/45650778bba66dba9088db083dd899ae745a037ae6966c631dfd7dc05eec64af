# SOFTWARE DEMONSTRATION TEMPLATE — NOT RESEARCH RESULTS.
# Copyright (c) 2026 alphaXiv; MIT; see ../LICENSE and ../PROVENANCE.md.
"""Validation loss over training. Regenerate: python figs/loss_curve.py"""

import csv
from collections import defaultdict

import numpy as np
from pi_figstyle import BASELINE, COLUMN, band, figure, label_ends, save, si_ticks, use_style

DATA = "figs/loss_curve.csv"


def load(path):
    """-> {variant: (steps, runs)} with runs shaped (n_seeds, n_steps)."""
    raw = defaultdict(lambda: defaultdict(list))
    with open(path) as handle:
        for row in csv.DictReader(handle):
            raw[row["variant"]][row["seed"]].append((float(row["step"]), float(row["value"])))

    series = {}
    for variant, seeds in raw.items():
        curves = [sorted(points) for points in seeds.values()]
        grid = np.array([step for step, _ in curves[0]])
        # Seeds log on slightly different grids, so interpolate before
        # averaging — but only across the range every seed actually reached.
        # np.interp clamps outside its input, which would invent a flat tail
        # for a run that stopped early and narrow the band around it.
        first = max(curve[0][0] for curve in curves)
        last = min(curve[-1][0] for curve in curves)
        if first > last:
            raise ValueError(f"{variant}: seeds cover no common range of steps")
        grid = grid[(grid >= first) & (grid <= last)]
        runs = np.stack([
            np.interp(grid, [s for s, _ in curve], [v for _, v in curve]) for curve in curves
        ])
        series[variant] = (grid, runs)
    return series


def main():
    use_style()
    series = load(DATA)

    fig, ax = figure(width=COLUMN, ratio=0.72)
    lines, labels = [], []
    for variant, (steps, runs) in series.items():
        color = BASELINE if variant == "baseline" else None
        lines.append(band(ax, steps, runs, color=color))
        labels.append(f"{variant} (n={runs.shape[0]})")

    ax.set_xlabel("Optimizer steps")
    ax.set_ylabel("Validation loss")
    label_ends(ax, lines, labels)
    si_ticks(ax, "x")  # after label_ends, which moves the right limit

    save(fig, "figs/loss_curve")


if __name__ == "__main__":
    main()
