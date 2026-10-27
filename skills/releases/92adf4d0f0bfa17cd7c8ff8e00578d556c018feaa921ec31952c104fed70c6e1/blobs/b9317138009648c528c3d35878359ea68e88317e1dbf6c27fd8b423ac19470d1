"""研舟π scientific figures: explicit statistics, physical sizes and output review.

The numerical formulas, Okabe-Ito palette and matplotlib/TikZ conventions are
standard tools; this module implements their integration for this project.
"""
import os
from pathlib import Path, PureWindowsPath
import re
import sys
import warnings

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import colors, cycler, font_manager, ticker
from matplotlib.text import Text
from matplotlib.transforms import Bbox
import numpy as np

COLUMN, TEXT, WIDE = 3.25, 5.5, 6.75
PALETTE = dict(zip(("blue", "orange", "green", "red", "purple", "cyan", "yellow", "black"),
                   ("#0072B2", "#E69F00", "#009E73", "#D55E00", "#CC79A7", "#56B4E9", "#F0E442", "#000000")))
CYCLE = list(PALETTE.values())[:6]
BASELINE, MUTED = "#7F7F7F", "#CFCFCF"
SEQUENTIAL, DIVERGING = "viridis", "RdBu_r"
_T95 = np.array([(1, 12.706), (2, 4.303), (3, 3.182), (4, 2.776), (5, 2.571),
                 (6, 2.447), (7, 2.365), (8, 2.306), (9, 2.262), (10, 2.228),
                 (12, 2.179), (15, 2.131), (20, 2.086), (30, 2.042), (40, 2.021),
                 (60, 2.000), (120, 1.980)])


def use_style(family="sans"):
    """Configure portable text, vector output and readable print defaults."""
    if family not in ("sans", "serif"):
        raise ValueError("family must be 'sans' or 'serif'")
    plt.rcParams.update({
        "font.family": "sans-serif" if family == "sans" else "serif",
        "font.sans-serif": ["DejaVu Sans", "Arial", "Liberation Sans"],
        "font.serif": ["DejaVu Serif", "Times New Roman", "Liberation Serif"],
        "font.size": 8, "axes.labelsize": 8, "axes.titlesize": 8,
        "legend.fontsize": 7, "xtick.labelsize": 7, "ytick.labelsize": 7,
        "pdf.fonttype": 42, "ps.fonttype": 42, "svg.fonttype": "none",
        "axes.prop_cycle": cycler(color=CYCLE), "axes.linewidth": .6,
        "lines.linewidth": 1.2, "lines.markersize": 3,
        "axes.spines.top": False, "axes.spines.right": False,
        "axes.grid": True, "grid.alpha": .18, "grid.linewidth": .5,
        "axes.axisbelow": True, "savefig.dpi": 300,
    })


def figure(width=COLUMN, ratio=.68, **kwargs):
    return figure_grid(1, 1, width=width, ratio=ratio, **kwargs)


def figure_grid(nrows=1, ncols=2, width=TEXT, ratio=.4, **kwargs):
    kwargs.setdefault("figsize", (width, width * ratio))
    kwargs.setdefault("layout", "constrained")
    return plt.subplots(nrows, ncols, **kwargs)


def panel_labels(axes, labels=None, weight="bold", pad=2.):
    panels = np.asarray(axes, dtype=object).ravel()
    names = list(labels) if labels is not None else [f"({chr(97 + i)})" for i in range(len(panels))]
    if len(names) != len(panels):
        raise ValueError("one panel label is required per axes")
    for ax, name in zip(panels, names):
        ax.annotate(name, (0, 1), xycoords="axes fraction", xytext=(pad, -pad),
                    textcoords="offset points", weight=weight, va="top", ha="left")


def _observations(values):
    array = np.asarray(values, dtype=float)
    if array.ndim == 0 or array.shape[0] == 0 or not np.all(np.isfinite(array)):
        raise ValueError("observations must have a nonempty independent-run axis and finite values")
    return array


def _critical(df):
    index = np.searchsorted(_T95[:, 0], np.floor(df), side="right") - 1
    return _T95[np.maximum(index, 0), 1]


def mean_ci(runs, confidence=.95):
    """Pointwise two-sided t intervals; axis zero contains independent runs."""
    if confidence != .95:
        raise ValueError("only the declared 95% t interval is supported")
    values = _observations(runs)
    mean = values.mean(axis=0)
    if len(values) == 1:
        warnings.warn("one independent run: returning a point, not an estimated confidence interval", RuntimeWarning, stacklevel=2)
        return mean, mean.copy(), mean.copy()
    radius = _critical(len(values) - 1) * values.std(axis=0, ddof=1) / np.sqrt(len(values))
    return mean, mean - radius, mean + radius


def diff_ci(treatment, baseline):
    """Scalar Welch interval after flattening each independent input group."""
    first = _observations(np.asarray(treatment, dtype=float).ravel())
    second = _observations(np.asarray(baseline, dtype=float).ravel())
    difference = first.mean(axis=0) - second.mean(axis=0)
    if min(len(first), len(second)) < 2:
        warnings.warn("an arm has fewer than two runs: returning a point, not a Welch interval", RuntimeWarning, stacklevel=2)
        return difference, difference.copy(), difference.copy()
    v1, v2 = first.var(axis=0, ddof=1) / len(first), second.var(axis=0, ddof=1) / len(second)
    variance = v1 + v2
    denominator = v1 ** 2 / (len(first) - 1) + v2 ** 2 / (len(second) - 1)
    df = np.divide(variance ** 2, denominator, out=np.full_like(variance, 120.), where=denominator > 0)
    radius = _critical(df) * np.sqrt(variance)
    return difference, difference - radius, difference + radius


def family(name, n, lightest=.55):
    if n < 1 or int(n) != n or not 0 <= lightest <= 1:
        raise ValueError("n must be a positive integer and lightest must be in [0, 1]")
    base = np.array(colors.to_rgb(PALETTE.get(name, name)))
    mixtures = np.linspace(lightest, 0, n) if n > 1 else [0]
    return [colors.to_hex(base * (1 - amount) + amount) for amount in mixtures]


def pareto_front(x, y, minimize_x=True, maximize_y=True):
    horizontal, vertical = np.asarray(x, float), np.asarray(y, float)
    if horizontal.ndim != 1 or horizontal.shape != vertical.shape or not np.all(np.isfinite([horizontal, vertical])):
        raise ValueError("x and y must be equally sized finite one-dimensional arrays")
    cost = horizontal if minimize_x else -horizontal
    benefit = vertical if maximize_y else -vertical
    order = np.lexsort((np.arange(len(cost)), -benefit, cost))
    selected, best = [], -np.inf
    for index in order:
        if benefit[index] > best:
            selected.append(index)
            best = benefit[index]
    return np.asarray(selected, dtype=int)


def band(ax, x, runs, label=None, color=None, **kwargs):
    mean, low, high = mean_ci(runs)
    line, = ax.plot(x, mean, label=label, color=color, **kwargs)
    ax.fill_between(x, low, high, color=line.get_color(), alpha=.17, linewidth=0)
    return line


def label_ends(ax, lines, labels, pad=3., min_gap=7., **kwargs):
    """Place direct labels in display space, reserving space on log or linear x."""
    lines, labels = list(lines), list(labels)
    if len(lines) != len(labels):
        raise ValueError("one label is required per line")
    if not labels:
        return
    fig = ax.figure
    endpoints = []
    for line in lines:
        data = np.asarray(line.get_xydata())
        finite = np.isfinite(data).all(axis=1)
        if not finite.any():
            raise ValueError("a labelled line has no finite endpoint")
        endpoints.append(data[finite][-1])
    transform = ax.xaxis.get_transform()
    left, right = transform.transform(ax.get_xlim())
    endpoint_x = transform.transform(np.asarray(endpoints)[:, 0])
    options = {"fontsize": 7, "va": "center", "ha": "left", **kwargs}
    texts = [ax.text(0, 0, name, transform=ax.transAxes, color=line.get_color(), **options)
             for line, name in zip(lines, labels)]
    for text in texts:
        text.set_in_layout(False)
    for _ in range(2):
        fig.canvas.draw()
        renderer = fig.canvas.get_renderer()
        bounds = ax.get_window_extent(renderer)
        required = max(text.get_window_extent(renderer).width for text in texts) + (pad + 2) * fig.dpi / 72
        reserve = required / bounds.width
        if reserve >= .85:
            warnings.warn("direct labels require a wider figure or shorter names", RuntimeWarning, stacklevel=2)
            reserve = .85
        extreme = max(endpoint_x) if right > left else min(endpoint_x)
        expanded = left + (extreme - left) / (1 - reserve)
        right = max(right, expanded) if right > left else min(right, expanded)
        ax.set_xlim(transform.inverted().transform([left, right]))
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    bounds = ax.get_window_extent(renderer)
    heights = np.array([text.get_window_extent(renderer).height for text in texts])
    ideal = ax.transData.transform(endpoints)
    order = np.argsort(ideal[:, 1], kind="stable")
    positions = ideal[:, 1].copy()
    gap = min_gap * fig.dpi / 72
    for previous, current in zip(order, order[1:]):
        positions[current] = max(positions[current], positions[previous] + (heights[current] + heights[previous]) / 2 + gap)
    positions -= max(0, positions[order[-1]] + heights[order[-1]] / 2 - bounds.y1)
    if positions[order[0]] - heights[order[0]] / 2 < bounds.y0:
        warnings.warn("direct labels exceed axes height; increase figure height", RuntimeWarning, stacklevel=2)
    for i, text in enumerate(texts):
        text.set_position(((ideal[i, 0] + pad * fig.dpi / 72 - bounds.x0) / bounds.width,
                           (positions[i] - bounds.y0) / bounds.height))


def si_ticks(ax, which="x"):
    if which not in ("x", "y"):
        raise ValueError("which must be x or y")
    def format_value(value, position=None):
        for scale, suffix in ((1e12, "T"), (1e9, "B"), (1e6, "M"), (1e3, "k")):
            if abs(value) >= scale:
                return f"{value / scale:.1f}".rstrip("0").rstrip(".") + suffix
        return f"{value:g}"
    axis = ax.xaxis if which == "x" else ax.yaxis
    formatter = ticker.FuncFormatter(format_value)
    axis.set_major_formatter(formatter)
    limits = ax.get_xlim() if which == "x" else ax.get_ylim()
    low, high = sorted(limits)
    if axis.get_scale() == "log" and low > 0 and high / low < 10:
        axis.set_minor_formatter(formatter)


def annotate_matrix(ax, values, fmt="{:.2f}", image=None, threshold=.6):
    matrix = np.asarray(values, float)
    image = image if image is not None else ax.images[-1]
    for row, column in np.ndindex(matrix.shape):
        value = matrix[row, column]
        if not np.isfinite(value):
            continue
        rgb = image.cmap(image.norm(value))[:3]
        luminance = np.dot(rgb, [.2126, .7152, .0722])
        ax.text(column, row, fmt.format(value), ha="center", va="center", fontsize=6,
                color="black" if luminance >= threshold else "white")


def _visible_text(fig):
    """Exclude tick artists that a normal canvas does not actually display."""
    ignored = set()
    for ax in fig.axes:
        for axis, limits in ((ax.xaxis, ax.get_xlim()), (ax.yaxis, ax.get_ylim())):
            low, high = sorted(limits)
            for tick in [*axis.get_major_ticks(), *axis.get_minor_ticks()]:
                if not ax.get_visible() or not ax.axison or not axis.get_visible() or not low <= tick.get_loc() <= high:
                    ignored.update((id(tick.label1), id(tick.label2)))
            if not ax.axison or not axis.get_visible():
                ignored.update((id(axis.label), id(axis.get_offset_text())))
    renderer = fig.canvas.get_renderer()
    found = []
    for text in fig.findobj(match=Text):
        if id(text) in ignored or not text.get_visible() or not text.get_text().strip() or text.get_alpha() == 0:
            continue
        if text.axes is not None and not text.axes.get_visible():
            continue
        box = text.get_window_extent(renderer)
        if text.get_clip_on() and text.get_clip_box() is not None:
            box = Bbox.intersection(box, text.get_clip_box())
            if box is None:
                continue
        if box.width > 0 and box.height > 0:
            found.append((text, box))
    return found


def _text_collisions(fig):
    fig.canvas.draw()
    texts = _visible_text(fig)
    problems = []
    for i, (first, a) in enumerate(texts):
        for second, b in texts[i + 1:]:
            if min(a.x1, b.x1) - max(a.x0, b.x0) > .5 and min(a.y1, b.y1) - max(a.y0, b.y0) > .5:
                problems.append(f"text overlap: {first.get_text()!r} / {second.get_text()!r}")
    return problems


def _categorical(axis):
    if axis.get_converter() is not None:
        return True
    labels = [text.get_text().replace("−", "-") for text in axis.get_ticklabels() if text.get_visible() and text.get_text()]
    if not labels:
        return False
    try:
        for label in labels:
            float(label)
    except ValueError:
        return isinstance(axis.get_major_formatter(), ticker.FuncFormatter) and isinstance(axis.get_major_locator(), ticker.FixedLocator)
    return False


def _audit(fig):
    fig.canvas.draw()
    problems = []
    if not any(np.isclose(fig.get_figwidth(), width, atol=.01) for width in (COLUMN, TEXT, WIDE)):
        problems.append("nonstandard physical width; verify journal print dimensions")
    if plt.rcParams["pdf.fonttype"] != 42 or plt.rcParams["ps.fonttype"] != 42 or plt.rcParams["svg.fonttype"] != "none":
        problems.append("font embedding configuration must use PDF/PS 42 and SVG text")
    for generic in ("sans-serif", "serif"):
        names = plt.rcParams[f"font.{generic}"]
        if not any(name in {font.name for font in font_manager.fontManager.ttflist} for name in names):
            problems.append(f"no installed fallback font in {generic} stack")
    titles = [title.get_text() for ax in fig.axes if ax.get_visible()
              for title in (ax._left_title, ax.title, ax._right_title)
              if title.get_visible() and title.get_text().strip()]
    problems.extend(f"axes title may duplicate paper caption: {title!r}" for title in titles)
    if len(set(titles)) < len(titles):
        problems.append("duplicate axes titles")
    for ax in fig.axes:
        if not ax.get_visible() or not ax.axison or getattr(ax, "_colorbar", None) is not None:
            continue
        for name, axis in (("x", ax.xaxis), ("y", ax.yaxis)):
            siblings = (ax.get_shared_x_axes() if name == "x" else ax.get_shared_y_axes()).get_siblings(ax)
            shared_label = any((other.get_xlabel() if name == "x" else other.get_ylabel()) for other in siblings)
            super_label = fig._supxlabel if name == "x" else fig._supylabel
            if axis.get_visible() and not shared_label and not (super_label and super_label.get_text()) and not _categorical(axis):
                problems.append(f"missing {name} label on quantitative axis")
    width, height = fig.bbox.width, fig.bbox.height
    for text, box in _visible_text(fig):
        try:
            font_manager.findfont(text.get_fontproperties(), fallback_to_default=False)
        except ValueError:
            problems.append(f"unavailable text font: {text.get_text()!r}")
        if text.get_fontsize() < 5:
            problems.append(f"text below 5 pt: {text.get_text()!r}")
        if box.x0 < -.5 or box.y0 < -.5 or box.x1 > width + .5 or box.y1 > height + .5:
            problems.append(f"text outside canvas: {text.get_text()!r}")
    problems.extend(_text_collisions(fig))
    return problems


def _output_stem(stem):
    name = os.fspath(stem)
    root_name = os.environ.get("PI_OUTPUT_DIR") or os.environ.get("OUTPUT_DIR")
    if not root_name:
        return Path(name)
    parts = re.split(r"[/\\]", name)
    if not name or "\0" in name or ":" in name or PureWindowsPath(name).drive or Path(name).is_absolute() or any(part in ("", ".", "..") for part in parts):
        raise ValueError("output stem must be a normalized relative path within the configured root")
    root = Path(root_name).resolve()
    destination = root.joinpath(*parts)
    if not destination.resolve().is_relative_to(root):
        raise ValueError("output stem escapes configured root through a symbolic link")
    return destination


def save(fig, stem, formats=("pdf", "svg"), close=True):
    """Write full-size vector files, then report review findings without deleting files."""
    paths = []
    try:
        destination = _output_stem(stem)
        destination.parent.mkdir(parents=True, exist_ok=True)
        for extension in formats:
            if not re.fullmatch(r"[A-Za-z0-9]+", extension):
                raise ValueError("invalid output format")
            path = Path(f"{destination}.{extension}")
            root_name = os.environ.get("PI_OUTPUT_DIR") or os.environ.get("OUTPUT_DIR")
            if root_name and not path.resolve().is_relative_to(Path(root_name).resolve()):
                raise ValueError("output file escapes configured root through a symbolic link")
            with matplotlib.rc_context({"savefig.bbox": None}):
                fig.savefig(str(path), format=extension)
            paths.append(str(path))
        try:
            problems = _audit(fig)
        except Exception as error:
            print(f"figure audit FAILED: {type(error).__name__}: {error}", file=sys.stderr)
            raise
        else:
            if problems:
                print("figure audit: review required\n" + "\n".join(f"- {problem}" for problem in problems), file=sys.stderr)
            else:
                print("figure audit: clean", file=sys.stderr)
        return paths
    finally:
        if close:
            plt.close(fig)
