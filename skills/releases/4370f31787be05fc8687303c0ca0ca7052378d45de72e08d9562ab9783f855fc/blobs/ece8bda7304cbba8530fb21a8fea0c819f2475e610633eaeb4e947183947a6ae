# SOFTWARE DEMONSTRATION TEMPLATE — NOT RESEARCH RESULTS.
# Copyright (c) 2026 alphaXiv; MIT; see ../LICENSE and ../PROVENANCE.md.
import matplotlib as mpl
import numpy as np
from pi_figstyle import COLUMN, MUTED, SEQUENTIAL, annotate_matrix, figure, save, use_style

counts = np.load("figs/confusion.npy")  # (n_classes, n_classes), true x predicted
classes = ["ent", "neut", "contra"]

use_style()
support = counts.sum(axis=1, keepdims=True)
# A class with no examples is undefined, not zero recall.
recall = np.divide(counts, support, out=np.full(counts.shape, np.nan), where=support > 0)

fig, ax = figure(width=COLUMN, ratio=0.95)
cmap = mpl.colormaps[SEQUENTIAL].with_extremes(bad=MUTED)
image = ax.imshow(recall, cmap=cmap, vmin=0, vmax=1, interpolation="nearest", aspect="equal")
annotate_matrix(ax, recall, fmt="{:.2f}")
ax.set_xticks(range(len(classes)), classes)
ax.set_yticks(range(len(classes)), classes)
ax.set_xlabel("Predicted")
ax.set_ylabel("True")
ax.grid(visible=False)
fig.colorbar(image, ax=ax, label="Fraction of true class", fraction=0.046, pad=0.03)
save(fig, "figs/confusion")
