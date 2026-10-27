"""Independent-seed trajectories, interpolated only within shared coverage."""
import csv
from pathlib import Path

import numpy as np
from pi_figstyle import BASELINE, band, figure, label_ends, save, si_ticks, use_style

DATA = "figs/loss_curve.csv"


def load(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    groups = {}
    for row in rows:
        steps = groups.setdefault(row["variant"], {}).setdefault(row["seed"], {})
        step, value = float(row["step"]), float(row["value"])
        if step in steps or not np.all(np.isfinite([step, value])):
            raise ValueError("loss trajectories require unique finite seed/step observations")
        steps[step] = value
    if not groups:
        raise ValueError("loss data is empty")
    aligned = {}
    for variant, seeds in groups.items():
        trajectories = [np.array(sorted(observations.items())) for observations in seeds.values()]
        left = max(points[0, 0] for points in trajectories)
        right = min(points[-1, 0] for points in trajectories)
        if left > right:
            raise ValueError(f"{variant} seeds have no common coverage")
        reference = trajectories[0][:, 0]
        grid = reference[(reference >= left) & (reference <= right)]
        if not len(grid):
            raise ValueError(f"{variant} first-seed grid has no point within common coverage")
        runs = np.array([np.interp(grid, points[:, 0], points[:, 1]) for points in trajectories])
        aligned[variant] = (grid, runs)
    return aligned


def main():
    groups = load(DATA)
    use_style()
    fig, ax = figure()
    lines, labels = [], []
    for variant, (steps, runs) in groups.items():
        label = f"{variant} (n={len(runs)})"
        lines.append(band(ax, steps, runs, color=BASELINE if variant == "baseline" else None, label=label))
        labels.append(label)
        print(f"{variant}: {len(runs)} independent seeds; pointwise 95% t intervals; no extrapolation")
    ax.set(xlabel="Optimizer steps", ylabel="Loss")
    si_ticks(ax)
    label_ends(ax, lines, labels)
    save(fig, "figs/loss_curve")


if __name__ == "__main__":
    main()
