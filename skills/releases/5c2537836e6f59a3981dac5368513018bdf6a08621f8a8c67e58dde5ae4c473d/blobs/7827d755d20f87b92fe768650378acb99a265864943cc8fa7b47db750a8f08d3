# SOFTWARE DEMONSTRATION TEMPLATE — NOT RESEARCH RESULTS.
# Copyright (c) 2026 alphaXiv; MIT; see ../LICENSE and ../PROVENANCE.md.
"""Accuracy across benchmarks. Regenerate: python figs/benchmarks.py"""

import csv
import math
from collections import defaultdict

import numpy as np
from pi_figstyle import MUTED, WIDE, family, figure, save, use_style

DATA = "figs/benchmarks.csv"

# Fixed order everywhere, and the family each method belongs to. Grey for the
# untuned model, blue for prior work, red for ours.
METHODS = [
    ("Qwen2.5-Math-7B", "base"),
    ("SimpleRL-Zero-7B (GRPO)", "prior"),
    ("OpenReasoner-Zero-7B (PPO)", "prior"),
    ("Oat-Zero-7B (Dr.GRPO)", "prior"),
    (r"ES$_\mathrm{CHKPT-1}$", "ours"),
    (r"ES$_\mathrm{CHKPT-2}$", "ours"),
    (r"ES$_\mathrm{CHKPT-3}$", "ours"),
]
BENCHMARKS = ["AIME 2024", "Minerva Math", "OlympiadBench", "AMC", "MATH500"]


def method_colors():
    members = defaultdict(list)
    for name, group in METHODS:
        members[group].append(name)
    shades = {
        "base": [MUTED] * len(members["base"]),
        "prior": family("blue", len(members["prior"])),
        "ours": family("red", len(members["ours"])),
    }
    return {
        name: shades[group][members[group].index(name)] for name, group in METHODS
    }


def load(path):
    scores = defaultdict(dict)
    with open(path) as handle:
        for row in csv.DictReader(handle):
            scores[row["method"]][row["benchmark"]] = float(row["score"])
    return scores


def main():
    use_style()
    scores = load(DATA)
    colors = method_colors()

    fig, ax = figure(width=WIDE, ratio=0.42)
    x = np.arange(len(BENCHMARKS))
    # Near-touching bars inside a group; the gap between groups does the separating.
    width = 0.9 / len(METHODS)

    for i, (name, _) in enumerate(METHODS):
        offset = (i - (len(METHODS) - 1) / 2) * width
        bars = ax.bar(
            x + offset,
            [scores[name][benchmark] for benchmark in BENCHMARKS],
            width,
            label=name,
            color=colors[name],
            edgecolor="black",
            linewidth=0.4,
        )
        # Redundant with the bar height, so it may sit at the 5pt floor.
        ax.bar_label(bars, fmt="%.1f", fontsize=5, padding=1.5)

    ax.set_xticks(x, BENCHMARKS)
    ax.set_ylabel("Accuracy (%)")
    # Derived, never hardcoded: a bar clipped at the axes edge no longer
    # encodes its value, which is the failure this whole reference is about.
    highest = max(v for row in scores.values() for v in row.values())
    top = max(10, 10 * math.ceil(highest * 1.12 / 10))
    ax.set_ylim(0, top)
    ax.set_yticks(range(0, top + 1, 10))
    ax.tick_params(axis="x", length=0)
    ax.legend(
        ncol=2, loc="lower left", bbox_to_anchor=(0, 1.02), fontsize=6.5,
        frameon=False, borderaxespad=0,
    )

    save(fig, "figs/benchmarks")


if __name__ == "__main__":
    main()
