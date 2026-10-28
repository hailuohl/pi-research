"""KL/reward: every raw run and per-method frontiers with color/shape redundancy."""
import csv
from pathlib import Path

import numpy as np
from pi_figstyle import PALETTE, figure, pareto_front, save, use_style

DATA = "figs/pareto.csv"
METHODS = {"GRPO": ("blue", "o"), "ES": ("red", "D")}


def load(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    groups, seen = {}, set()
    for row in rows:
        key = row["method"], row["setting"], row["seed"]
        if key in seen:
            raise ValueError(f"duplicate setting/seed: {key}")
        seen.add(key)
        point = [float(row["kl"]), float(row["reward"])]
        if not np.all(np.isfinite(point)):
            raise ValueError("KL/reward observations must be finite")
        groups.setdefault(row["method"], []).append((row["setting"], point))
    if not groups:
        raise ValueError("pareto data is empty")
    return {method: (np.array([point[0] for _, point in records]),
                     np.array([point[1] for _, point in records]),
                     len({setting for setting, _ in records}))
            for method, records in groups.items()}


def main():
    groups = load(DATA)
    unknown = groups.keys() - METHODS.keys()
    if unknown:
        raise ValueError(f"configure METHODS colors/markers for: {sorted(unknown)}")
    use_style()
    fig, ax = figure()
    for method, (color_name, marker) in METHODS.items():
        if method not in groups:
            continue
        x, y, settings = groups[method]
        color = PALETTE[color_name]
        ax.scatter(x, y, color=color, marker=marker, alpha=.25, s=12, linewidths=0)
        frontier = pareto_front(x, y)
        ax.plot(x[frontier], y[frontier], color=color, marker=marker,
                label=f"{method} (runs={len(x)}, settings={settings})")
        print(f"{method}: observed runs={len(x)}, distinct settings={settings}; raw-point frontier")
    ax.set(xlabel="KL divergence", ylabel="Reward")
    ax.legend(frameon=False, fontsize=6)
    save(fig, "figs/pareto")


if __name__ == "__main__":
    main()
