"""Hyperparameter grid with missing cells masked and the finite minimum outlined."""
import csv
from pathlib import Path

import numpy as np
from matplotlib import colormaps
from matplotlib.patches import Rectangle
from pi_figstyle import PALETTE, SEQUENTIAL, TEXT, annotate_matrix, figure, save, use_style

DATA = "figs/sweep.csv"


def load(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValueError("sweep data is empty")
    rates = sorted({float(row["lr"]) for row in rows}, reverse=True)
    batches = sorted({int(row["batch_size"]) for row in rows})
    if not all(np.isfinite(rates)) or min(rates) <= 0 or min(batches) <= 0:
        raise ValueError("learning rates and batch sizes must be positive finite values")
    values = np.full((len(rates), len(batches)), np.nan)
    seen = set()
    for row in rows:
        key = float(row["lr"]), int(row["batch_size"])
        if key in seen:
            raise ValueError(f"duplicate sweep cell: {key}")
        seen.add(key)
        if row["loss"].strip():
            value = float(row["loss"])
            if not np.isfinite(value):
                raise ValueError("use an empty loss cell for missing data")
            values[rates.index(key[0]), batches.index(key[1])] = value
    if not np.isfinite(values).any():
        raise ValueError("sweep has no finite loss observations")
    return rates, batches, values


def main():
    rates, batches, values = load(DATA)
    use_style()
    fig, ax = figure(width=TEXT, ratio=.66)
    cmap = colormaps[SEQUENTIAL].with_extremes(bad="white")
    image = ax.imshow(np.ma.masked_invalid(values), cmap=cmap, aspect="auto")
    ax.set(xticks=range(len(batches)), xticklabels=[str(value) for value in batches],
           yticks=range(len(rates)), yticklabels=[f"{value:g}" for value in rates],
           xlabel="Batch size (examples)", ylabel="Learning rate")
    ax.grid(False)
    annotate_matrix(ax, values, image=image)
    row, column = np.unravel_index(np.nanargmin(values), values.shape)
    ax.add_patch(Rectangle((column - .5, row - .5), 1, 1, fill=False,
                           edgecolor=PALETTE["red"], linewidth=1.5))
    fig.colorbar(image, ax=ax, label="Loss")
    print(f"Missing sweep cells: {np.isnan(values).sum()}; minimum finite loss={values[row, column]:g} outlined.")
    save(fig, "figs/sweep")


if __name__ == "__main__":
    main()
