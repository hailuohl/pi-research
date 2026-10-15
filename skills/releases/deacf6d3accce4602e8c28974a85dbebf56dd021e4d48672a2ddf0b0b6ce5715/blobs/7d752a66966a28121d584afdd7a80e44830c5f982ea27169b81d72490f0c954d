# SOFTWARE DEMONSTRATION TEMPLATE — NOT RESEARCH RESULTS.
# Copyright (c) 2026 alphaXiv; MIT; see ../LICENSE and ../PROVENANCE.md.
"""Loss vs. parameters with a fitted power law. Regenerate: python figs/scaling.py"""

import csv

import numpy as np
from pi_figstyle import BASELINE, PALETTE, TEXT, figure_grid, save, si_ticks, use_style

DATA = "figs/scaling.csv"
PREDICT_TO = 1e11  # extrapolate the fit out to this many parameters


def load(path):
    n, loss, fitted, family = [], [], [], []
    with open(path) as handle:
        for row in csv.DictReader(handle):
            n.append(float(row["n_params"]))
            loss.append(float(row["loss"]))
            fitted.append(row["fit"] == "1")
            family.append(row["family"])
    return np.array(n), np.array(loss), np.array(fitted), np.array(family)


def fit_power_law(n, loss, alphas=np.linspace(0.02, 1.5, 800)):
    """Least squares for L = E + A*N^-alpha.

    For a fixed alpha the model is linear in (E, A), so scanning alpha and
    solving each slice exactly needs no nonlinear optimizer. It also fits the
    error on L rather than on log(L - E), which is dominated by whichever runs
    sit closest to the floor and collapses the fit to E = 0.
    """
    best = None
    for alpha in alphas:
        design = np.stack([np.ones_like(n), n**-alpha], axis=1)
        coef, *_ = np.linalg.lstsq(design, loss, rcond=None)
        if coef[0] < 0 or coef[1] <= 0:
            continue  # a negative floor or amplitude is not a scaling law
        sse = float(((design @ coef - loss) ** 2).sum())
        if best is None or sse < best[0]:
            best = (sse, float(coef[0]), float(coef[1]), float(alpha))
    if best is None:
        raise ValueError("no fit with a non-negative irreducible term")
    _, e, a, alpha = best
    return e, a, alpha


def bootstrap_alpha(n, loss, draws=200, seed=0):
    rng = np.random.default_rng(seed)
    alphas = []
    for _ in range(draws):
        idx = rng.integers(0, len(n), len(n))
        if len(set(idx.tolist())) < 3:
            continue
        try:
            alphas.append(fit_power_law(n[idx], loss[idx])[2])
        except ValueError:
            continue  # a degenerate resample is not a reason to lose the figure
    if len(alphas) < draws // 4:
        raise ValueError(f"only {len(alphas)}/{draws} resamples fit; too few runs for an interval")
    return np.percentile(alphas, [2.5, 97.5])


def main():
    use_style()
    n, loss, fitted, family = load(DATA)
    e, a, alpha = fit_power_law(n[fitted], loss[fitted])
    lo, hi = bootstrap_alpha(n[fitted], loss[fitted])

    fig, (ax, res) = figure_grid(
        nrows=2, ncols=1, width=TEXT, ratio=0.62,
        sharex=True, gridspec_kw={"height_ratios": [3, 1]},
    )

    def curve(x):
        return e + a * x**-alpha

    measured = np.geomspace(n[fitted].min(), n[fitted].max(), 100)
    beyond = np.geomspace(n[fitted].max(), PREDICT_TO, 100)

    ax.plot(measured, curve(measured), color=BASELINE, zorder=1)
    ax.plot(beyond, curve(beyond), color=BASELINE, linestyle="--", zorder=1)
    ax.axvspan(n[fitted].max(), PREDICT_TO, color=BASELINE, alpha=0.08, linewidth=0)

    markers = ("o", "s", "^", "v", "P", "X")
    families = sorted(set(family))
    if len(families) > len(markers):
        raise ValueError(f"{len(families)} families, {len(markers)} markers: add more")
    for marker, name in zip(markers, families):
        pick = family == name
        ax.scatter(n[pick & fitted], loss[pick & fitted], marker=marker,
                   color=PALETTE["blue"], label=name, zorder=2)
        ax.scatter(n[pick & ~fitted], loss[pick & ~fitted], marker=marker,
                   facecolor="none", edgecolor=PALETTE["blue"], linewidth=0.7, zorder=2)

    ax.set_xscale("log")
    ax.set_yscale("log")
    ax.set_ylabel("Validation loss")
    ax.set_xlim(right=PREDICT_TO)
    ax.text(
        0.03, 0.06,
        rf"$L = {e:.2f} + {a:.1f}\,N^{{-{alpha:.3f}}}$" "\n"
        rf"$\alpha \in [{lo:.3f},\ {hi:.3f}]$, {int(fitted.sum())} runs",
        transform=ax.transAxes, va="bottom", fontsize=7,
    )
    if len(set(family)) > 1:
        ax.legend(loc="upper right")

    res.axhline(0, color=BASELINE, linewidth=0.6)
    res.scatter(n[fitted], 100 * (loss[fitted] - curve(n[fitted])) / loss[fitted],
                color=PALETTE["blue"], s=8)
    res.set_ylabel("Resid. (%)")
    res.set_xlabel("Non-embedding parameters")
    si_ticks(ax, "y")
    si_ticks(res, "x")

    save(fig, "figs/scaling")


if __name__ == "__main__":
    main()
