#!/usr/bin/env python3
"""Reproduce summary statistics and a four-panel plot from frozen Anscombe data."""

import hashlib
import json
import math
import os
from pathlib import Path
import re


SOURCE_SHA256 = "02F29379F282FCF909FF988B3FDE2BE2D5591975BA27ED0EFD8714A91629223E"
SOURCE_PATH = Path(__file__).resolve().parent.parent / "anscombe.R"
EXPECTED_COLUMNS = tuple(f"{axis}{i}" for axis in "xy" for i in range(1, 5))
COLUMN_RE = re.compile(r"([A-Za-z][A-Za-z0-9._]*)\s*=\s*c\(([^()]*)\)")
NUMBER_RE = re.compile(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?")


def load_groups():
    raw = SOURCE_PATH.read_bytes()
    digest = hashlib.sha256(raw).hexdigest().upper()
    if digest != SOURCE_SHA256:
        raise SystemExit(f"anscombe.R SHA-256 mismatch: {digest}")

    source = raw.decode("utf-8")
    match = re.fullmatch(r"\s*anscombe\s*<-\s*data\.frame\((.*)\)\s*", source, re.S)
    if not match:
        raise SystemExit("anscombe.R does not match the expected data.frame format")

    body = match.group(1)
    columns = {}
    cursor = 0
    matches = list(COLUMN_RE.finditer(body))
    if len(matches) != len(EXPECTED_COLUMNS):
        raise SystemExit(f"expected 8 columns, found {len(matches)}")

    for index, column in enumerate(matches):
        separator = body[cursor:column.start()]
        valid_separator = r"\s*" if index == 0 else r"\s*,\s*"
        if not re.fullmatch(valid_separator, separator):
            raise SystemExit("unexpected content between data columns")
        name, values_text = column.groups()
        if name != EXPECTED_COLUMNS[index]:
            raise SystemExit(f"unexpected column {name!r}; expected {EXPECTED_COLUMNS[index]!r}")
        tokens = values_text.split(",")
        if len(tokens) != 11 or any(not NUMBER_RE.fullmatch(token.strip()) for token in tokens):
            raise SystemExit(f"{name} must contain exactly 11 numeric values")
        values = [float(token) for token in tokens]
        if not all(math.isfinite(value) for value in values):
            raise SystemExit(f"{name} contains a non-finite value")
        columns[name] = values
        cursor = column.end()

    if body[cursor:].strip():
        raise SystemExit("unexpected content after the data columns")
    return [(columns[f"x{i}"], columns[f"y{i}"]) for i in range(1, 5)]


def summarize(groups):
    metrics = {}
    for index, (xs, ys) in enumerate(groups, 1):
        n = len(xs)
        mean_x = sum(xs) / n
        mean_y = sum(ys) / n
        xx = sum((x - mean_x) ** 2 for x in xs)
        yy = sum((y - mean_y) ** 2 for y in ys)
        xy = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
        prefix = f"q{index}_"
        metrics.update({
            prefix + "n": n,
            prefix + "mean_x": mean_x,
            prefix + "mean_y": mean_y,
            prefix + "slope": xy / xx,
            prefix + "intercept": mean_y - (xy / xx) * mean_x,
            prefix + "r": xy / math.sqrt(xx * yy),
        })
    return metrics


def make_svg(groups):
    all_x = [x for xs, _ in groups for x in xs]
    all_y = [y for _, ys in groups for y in ys]
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    width, height = 960, 620
    plot_x, plot_y, plot_w, plot_h = 58, 48, 392, 218
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<title>Anscombe quartet: four groups of eleven points</title>',
        '<rect width="100%" height="100%" fill="#f7f8fa"/>',
    ]
    for index, (xs, ys) in enumerate(groups, 1):
        left, top = (index - 1) % 2 * 480, (index - 1) // 2 * 310
        parts.extend([
            f'<g id="q{index}" data-group="{index}" data-point-count="11" transform="translate({left} {top})">',
            '<rect x="8" y="6" width="464" height="296" rx="8" fill="#fff" stroke="#d7dee3"/>',
            f'<text x="24" y="31" font-family="sans-serif" font-size="17" font-weight="700" fill="#18313f">Group {index}</text>',
            f'<path d="M {plot_x} {plot_y} V {plot_y + plot_h} H {plot_x + plot_w}" fill="none" stroke="#667782" stroke-width="1.2"/>',
            f'<text x="{plot_x + plot_w / 2:.1f}" y="{plot_y + plot_h + 28}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#43545e">x</text>',
            f'<text x="{plot_x - 27}" y="{plot_y + plot_h / 2:.1f}" text-anchor="middle" transform="rotate(-90 {plot_x - 27} {plot_y + plot_h / 2:.1f})" font-family="sans-serif" font-size="12" fill="#43545e">y</text>',
        ])
        for x, y in zip(xs, ys):
            cx = plot_x + (x - min_x) / (max_x - min_x) * plot_w
            cy = plot_y + plot_h - (y - min_y) / (max_y - min_y) * plot_h
            parts.append(f'<circle class="point" data-group="{index}" cx="{cx:.2f}" cy="{cy:.2f}" r="4.2" fill="#16728a" stroke="#fff" stroke-width="1.2"/>')
        parts.append("</g>")
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def main():
    groups = load_groups()
    output_dir = Path(os.environ.get("PI_OUTPUT_DIR", "/output"))
    output_dir.mkdir(parents=True, exist_ok=True)
    metrics = summarize(groups)
    if not all(math.isfinite(value) for value in metrics.values()):
        raise SystemExit("calculated metrics contain a non-finite value")
    (output_dir / "metrics.json").write_text(
        json.dumps(metrics, indent=2, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    (output_dir / "quartet.svg").write_text(make_svg(groups), encoding="utf-8")
    print(f"wrote metrics.json and quartet.svg to {output_dir}")


if __name__ == "__main__":
    main()
