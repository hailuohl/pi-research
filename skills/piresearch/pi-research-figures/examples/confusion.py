"""Row-normalized confusion matrix derived from unchanged true×predicted counts."""
from pathlib import Path

import numpy as np
from matplotlib import colormaps
from pi_figstyle import SEQUENTIAL, annotate_matrix, figure, save, use_style

DATA = "figs/confusion.npy"
classes = ["ent", "neut", "contra"]


def main():
    counts = np.load(Path(DATA), allow_pickle=False)
    if counts.ndim != 2 or min(counts.shape) == 0 or not np.all(np.isfinite(counts)) or np.any(counts < 0):
        raise ValueError("confusion.npy must contain a nonempty finite nonnegative true×predicted count matrix")
    if np.any(counts != np.floor(counts)):
        raise ValueError("confusion.npy contains noninteger counts")
    if counts.shape != (len(classes), len(classes)):
        raise ValueError(f"configure classes to match the {counts.shape} true/predicted count matrix")
    totals = counts.sum(axis=1, keepdims=True, dtype=float)
    normalized = np.divide(counts, totals, out=np.full(counts.shape, np.nan), where=totals != 0)
    use_style()
    fig, ax = figure(ratio=.9)
    cmap = colormaps[SEQUENTIAL].with_extremes(bad="white")
    image = ax.imshow(np.ma.masked_invalid(normalized), cmap=cmap, vmin=0, vmax=1, aspect="equal")
    ax.set(xticks=range(counts.shape[1]), xticklabels=classes,
           yticks=range(counts.shape[0]), yticklabels=classes,
           xlabel="Predicted class", ylabel="True class")
    ax.grid(False)
    annotate_matrix(ax, normalized, fmt="{:.0%}", image=image)
    fig.colorbar(image, ax=ax, label="Fraction within true class", shrink=.8)
    print(f"Raw counts retained in confusion.npy; zero-total rows rendered blank: {np.flatnonzero(totals.ravel() == 0).tolist()}")
    save(fig, "figs/confusion")


if __name__ == "__main__":
    main()
