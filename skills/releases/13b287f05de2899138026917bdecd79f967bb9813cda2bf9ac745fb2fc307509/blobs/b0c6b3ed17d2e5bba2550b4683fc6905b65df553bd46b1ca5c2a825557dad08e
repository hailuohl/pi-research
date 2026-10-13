# SOFTWARE DEMONSTRATION TEMPLATE — NOT RESEARCH RESULTS.
# Copyright (c) 2026 alphaXiv; MIT; see ../LICENSE and ../PROVENANCE.md.
"""Final loss over the lr x batch-size sweep. Regenerate: python figs/sweep.py"""

import csv

import matplotlib as mpl
import numpy as np
from matplotlib.patches import Rectangle
from pi_figstyle import COLUMN, MUTED, SEQUENTIAL, annotate_matrix, figure, save, use_style

DATA = "figs/sweep.csv"


def load(path):
    with open(path) as handle:
        rows = list(csv.DictReader(handle))
    lrs = sorted({float(row["lr"]) for row in rows}, reverse=True)
    batches = sorted({int(row["batch_size"]) for row in rows})
    grid = np.full((len(lrs), len(batches)), np.nan)
    for row in rows:
        loss = row["loss"].strip()
        # A run with no loss diverged or never finished; NaN keeps it out of
        # the color scale instead of pinning it to the worst value.
        grid[lrs.index(float(row["lr"])), batches.index(int(row["batch_size"]))] = (
            float(loss) if loss else np.nan
        )
    return lrs, batches, grid


def main():
    use_style()
    lrs, batches, grid = load(DATA)

    # A diverged or OOM run is not "the worst loss"; it is a different outcome.
    cmap = mpl.colormaps[SEQUENTIAL].with_extremes(bad=MUTED)

    fig, ax = figure(width=COLUMN, ratio=0.85)
    image = ax.imshow(grid, cmap=cmap, interpolation="nearest", aspect="auto")
    annotate_matrix(ax, grid, fmt="{:.3f}")

    if np.isnan(grid).all():
        raise ValueError("every cell is empty: nothing to plot")
    row, col = np.unravel_index(np.nanargmin(grid), grid.shape)
    ax.add_patch(
        Rectangle((col - 0.5, row - 0.5), 1, 1, fill=False, edgecolor="white", linewidth=1.4)
    )

    ax.set_xticks(range(len(batches)), [str(b) for b in batches])
    ax.set_yticks(range(len(lrs)), [f"{lr:.1e}" for lr in lrs])
    ax.set_xlabel("Batch size")
    ax.set_ylabel("Learning rate")
    ax.grid(visible=False)
    fig.colorbar(image, ax=ax, label="Final validation loss", fraction=0.046, pad=0.03)

    save(fig, "figs/sweep")


if __name__ == "__main__":
    main()
