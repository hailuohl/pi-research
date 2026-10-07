# SOFTWARE DEMONSTRATION TEMPLATE — NOT RESEARCH RESULTS.
# Copyright (c) 2026 alphaXiv; MIT; see ../LICENSE and ../PROVENANCE.md.
"""Reward against KL divergence. Regenerate: python figs/pareto.py"""

import csv
from collections import defaultdict

import numpy as np
from pi_figstyle import PALETTE, TEXT, figure, pareto_front, save, use_style

DATA = "figs/pareto.csv"

# Shape and hue both carry the method: redundant so the figure survives
# greyscale and a colorblind reader.
METHODS = {"GRPO": ("blue", "o"), "ES": ("red", "D")}


def load(path):
    runs = defaultdict(lambda: ([], [], set()))
    with open(path) as handle:
        for row in csv.DictReader(handle):
            kl, reward, settings = runs[row["method"]]
            kl.append(float(row["kl"]))
            reward.append(float(row["reward"]))
            settings.add(row["setting"])
    return {
        method: (np.array(kl), np.array(reward), len(settings))
        for method, (kl, reward, settings) in runs.items()
    }


def main():
    use_style()
    runs = load(DATA)

    fig, ax = figure(width=TEXT, ratio=0.62)
    for method, (color_name, marker) in METHODS.items():
        kl, reward, n_settings = runs[method]
        color = PALETTE[color_name]
        # Every run, faded: the spread is part of the result.
        ax.scatter(kl, reward, marker=marker, s=16, color=color, alpha=0.35, linewidth=0)
        front = pareto_front(kl, reward, minimize_x=True, maximize_y=True)
        ax.plot(
            kl[front], reward[front],
            marker=marker, markersize=4, color=color, linewidth=1.1, zorder=3,
            label=f"{method} ({n_settings} settings)",
        )

    ax.set_xlabel("KL divergence from the base model (lower is better)")
    ax.set_ylabel("Reward (higher is better)")
    ax.grid(True, axis="both")
    ax.legend(loc="lower right", frameon=True, framealpha=1.0, edgecolor="black")

    save(fig, "figs/pareto")


if __name__ == "__main__":
    main()
