"""Fit L=E+A*N**(-alpha) in loss space, with bootstrap and residual diagnostics."""
import csv
from pathlib import Path

import numpy as np
from pi_figstyle import BASELINE, PALETTE, TEXT, figure_grid, panel_labels, save, si_ticks, use_style

DATA = "figs/scaling.csv"
PREDICT_TO = 1e11


def load(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValueError("scaling data is empty")
    n = np.array([float(row["n_params"]) for row in rows])
    loss = np.array([float(row["loss"]) for row in rows])
    flags = [row["fit"].strip() for row in rows]
    if any(flag not in ("0", "1") for flag in flags):
        raise ValueError("fit must be 0 or 1")
    if not np.all(np.isfinite([n, loss])) or np.any(n <= 0):
        raise ValueError("parameter counts must be positive and observations finite")
    return n, loss, np.array([flag == "1" for flag in flags]), np.array([row["family"] for row in rows])


def fit_power_law(n, loss, alphas=None):
    """Profile alpha with an analytic linear fit; reject illegal free coefficients."""
    n, loss = np.asarray(n, float), np.asarray(loss, float)
    if n.ndim != 1 or n.shape != loss.shape or len(n) < 2 or len(np.unique(n)) < 2:
        raise ValueError("a floor power-law fit needs two distinct parameter counts")
    if not np.all(np.isfinite([n, loss])) or np.any(n <= 0):
        raise ValueError("fit data must be finite with positive parameter counts")
    alpha = np.linspace(.02, 1.5, 800) if alphas is None else np.asarray(alphas, float)
    if alpha.ndim != 1 or not len(alpha) or not np.all(np.isfinite(alpha)) or np.any(alpha <= 0):
        raise ValueError("alpha candidates must be positive finite values")
    log_reference = np.log(n).mean()
    basis = np.exp(-alpha[:, None] * (np.log(n) - log_reference))
    centered = basis - basis.mean(axis=1, keepdims=True)
    variance = np.sum(centered ** 2, axis=1)
    amplitude = np.divide(centered @ (loss - loss.mean()), variance,
                          out=np.full(len(alpha), np.nan), where=variance > 0)
    floor = loss.mean() - amplitude * basis.mean(axis=1)
    coefficients = amplitude * np.exp(alpha * log_reference)
    legal = np.isfinite(coefficients) & np.isfinite(floor) & (coefficients > 0) & (floor >= 0)
    errors = np.sum((floor[:, None] + amplitude[:, None] * basis - loss) ** 2, axis=1)
    errors[~legal] = np.inf
    if not np.isfinite(errors).any():
        raise ValueError("no legal E>=0, A>0 power-law fit")
    best = np.argmin(errors)
    return float(floor[best]), float(coefficients[best]), float(alpha[best])


def bootstrap_alpha(n, loss, draws=200, seed=0):
    """Paired row bootstrap, skipping resamples with fewer than three source rows."""
    n, loss = np.asarray(n, float), np.asarray(loss, float)
    if n.ndim != 1 or n.shape != loss.shape or len(n) < 3:
        raise ValueError("bootstrap needs at least three paired observations")
    if not isinstance(draws, (int, np.integer)) or draws < 1:
        raise ValueError("draws must be a positive integer")
    if not np.all(np.isfinite([n, loss])) or np.any(n <= 0):
        raise ValueError("bootstrap data must be finite with positive parameter counts")
    rng, estimates = np.random.default_rng(seed), []
    for _ in range(draws):
        indices = rng.integers(0, len(n), len(n))
        if len(np.unique(indices)) < 3:
            continue
        try:
            estimates.append(fit_power_law(n[indices], loss[indices])[2])
        except ValueError:
            continue
    if not estimates or len(estimates) < draws // 4:
        raise ValueError(f"too few successful bootstrap fits: {len(estimates)}/{draws}")
    return tuple(np.percentile(estimates, [2.5, 97.5]))


def main():
    n, loss, selected, families = load(DATA)
    if np.any(loss <= 0):
        raise ValueError("logarithmic loss display requires positive observations")
    e, a, alpha = fit_power_law(n[selected], loss[selected])
    low, high = bootstrap_alpha(n[selected], loss[selected])
    predict = lambda parameters: e + a * np.asarray(parameters) ** -alpha
    start, end = n[selected].min(), n[selected].max()
    use_style()
    fig, (ax, residual) = figure_grid(2, 1, width=TEXT, ratio=.88, sharex=True,
                                     gridspec_kw={"height_ratios": [3, 1.1]})
    grid = np.geomspace(start, end, 150)
    ax.plot(grid, predict(grid), color=PALETTE["black"], label="Joint floor-law fit")
    if PREDICT_TO > end:
        extra = np.geomspace(end, PREDICT_TO, 100)
        ax.plot(extra, predict(extra), color=BASELINE, linestyle="--", label="Extrapolation")
        ax.axvspan(end, PREDICT_TO, color=PALETTE["orange"], alpha=.09, linewidth=0)
    for index, family in enumerate(dict.fromkeys(families)):
        color = list(PALETTE.values())[index % 6]
        for fitted, marker in ((True, "o"), (False, "s")):
            mask = (families == family) & (selected == fitted)
            if not mask.any():
                continue
            options = {"edgecolors": color, "facecolors": color if fitted else "none", "marker": marker, "zorder": 3}
            ax.scatter(n[mask], loss[mask], label=f"{family}: {'fit' if fitted else 'held out'} (n={mask.sum()})", **options)
            residual.scatter(n[mask], 100 * (loss[mask] - predict(n[mask])) / loss[mask], **options)
    ax.set(xscale="log", yscale="log", ylabel="Loss")
    ax.text(.03, .03, rf"$L={e:.3g}+{a:.3g}N^{{-{alpha:.3f}}}$" + "\n" +
            f"alpha 95% bootstrap [{low:.3f}, {high:.3f}]; fit n={selected.sum()}",
            transform=ax.transAxes, fontsize=7, va="bottom")
    ax.legend(frameon=False, fontsize=6, loc="upper right")
    residual.axhline(0, color=BASELINE, linestyle="--", linewidth=.6)
    residual.set(xscale="log", xlabel="Parameters", ylabel="Residual (%)")
    si_ticks(residual)
    panel_labels([ax, residual])
    print(f"Joint fit over all fit=1 rows: E={e:.8g}, A={a:.8g}, alpha={alpha:.8g}; "
          f"alpha bootstrap 95% [{low:.8g}, {high:.8g}]; n={selected.sum()}, held out n={(~selected).sum()}")
    save(fig, "figs/scaling")


if __name__ == "__main__":
    main()
