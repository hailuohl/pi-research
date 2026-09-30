#!/usr/bin/env python3
"""Validate archived Anscombe II LOOCV outputs and draw their comparison."""

import binascii
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import struct
import sys
import zlib


WIDTH, HEIGHT = 900, 640
PLOT = {"left": 90, "right": 870, "top": 100, "bottom": 550}
X_RANGE = (3.0, 15.0)
Y_RANGE = (2.5, 12.0)
COLORS = {
    "observed": (198, 40, 48),
    "degree1": (37, 99, 235),
    "degree2": (22, 133, 84),
}
INPUT_NAMES = (
    "degree1_metrics",
    "degree1_predictions",
    "degree2_metrics",
    "degree2_predictions",
)
OUTPUT_NAMES = ("figure.png", "figure-data.json")

FONT = {
    "A": ("01110", "10001", "10001", "11111", "10001", "10001", "10001"),
    "B": ("11110", "10001", "10001", "11110", "10001", "10001", "11110"),
    "C": ("01111", "10000", "10000", "10000", "10000", "10000", "01111"),
    "D": ("11110", "10001", "10001", "10001", "10001", "10001", "11110"),
    "E": ("11111", "10000", "10000", "11110", "10000", "10000", "11111"),
    "G": ("01111", "10000", "10000", "10111", "10001", "10001", "01111"),
    "I": ("11111", "00100", "00100", "00100", "00100", "00100", "11111"),
    "M": ("10001", "11011", "10101", "10101", "10001", "10001", "10001"),
    "N": ("10001", "11001", "10101", "10011", "10001", "10001", "10001"),
    "O": ("01110", "10001", "10001", "10001", "10001", "10001", "01110"),
    "R": ("11110", "10001", "10001", "11110", "10100", "10010", "10001"),
    "S": ("01111", "10000", "10000", "01110", "00001", "00001", "11110"),
    "V": ("10001", "10001", "10001", "10001", "10001", "01010", "00100"),
    "X": ("10001", "10001", "01010", "00100", "01010", "10001", "10001"),
    "Y": ("10001", "10001", "01010", "00100", "00100", "00100", "00100"),
    " ": ("00000",) * 7,
    "0": ("01110", "10001", "10011", "10101", "11001", "10001", "01110"),
    "1": ("00100", "01100", "00100", "00100", "00100", "00100", "01110"),
    "2": ("01110", "10001", "00001", "00010", "00100", "01000", "11111"),
    "3": ("11110", "00001", "00001", "01110", "00001", "00001", "11110"),
    "4": ("00010", "00110", "01010", "10010", "11111", "00010", "00010"),
    "5": ("11111", "10000", "10000", "11110", "00001", "00001", "11110"),
    "6": ("01110", "10000", "10000", "11110", "10001", "10001", "01110"),
    "7": ("11111", "00001", "00010", "00100", "01000", "01000", "01000"),
    "8": ("01110", "10001", "10001", "01110", "10001", "10001", "01110"),
    "9": ("01110", "10001", "10001", "01111", "00001", "00001", "01110"),
}


class Canvas:
    def __init__(self, width, height):
        self.width, self.height = width, height
        self.rows = [bytearray([0]) + bytearray(b"\xff\xff\xff" * width) for _ in range(height)]

    def px(self, x, y, color):
        if 0 <= x < self.width and 0 <= y < self.height:
            start = 1 + 3 * x
            self.rows[y][start : start + 3] = bytes(color)

    def line(self, x0, y0, x1, y1, color):
        dx, dy = abs(x1 - x0), abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        error = dx - dy
        while True:
            self.px(x0, y0, color)
            if x0 == x1 and y0 == y1:
                return
            twice = 2 * error
            if twice > -dy:
                error -= dy
                x0 += sx
            if twice < dx:
                error += dx
                y0 += sy

    def rect(self, x, y, width, height, color):
        for py in range(y, y + height):
            for px in range(x, x + width):
                self.px(px, py, color)

    def circle(self, cx, cy, radius, color):
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                if dx * dx + dy * dy <= radius * radius:
                    self.px(cx + dx, cy + dy, color)

    def text(self, x, y, value, color):
        for char in value.upper():
            glyph = FONT[char]
            for dy, row in enumerate(glyph):
                for dx, bit in enumerate(row):
                    if bit == "1":
                        self.px(x + dx, y + dy, color)
            x += 6

    def png(self):
        def chunk(tag, data):
            return (
                struct.pack(">I", len(data))
                + tag
                + data
                + struct.pack(">I", binascii.crc32(tag + data) & 0xFFFFFFFF)
            )

        header = struct.pack(">IIBBBBB", self.width, self.height, 8, 2, 0, 0, 0)
        raw = b"".join(map(bytes, self.rows))
        return (
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b"")
        )


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key: " + key)
        result[key] = value
    return result


def _reject_constant(value):
    raise ValueError("non-finite JSON number: " + value)


def _finite_number(value, label):
    if type(value) not in (int, float) or not math.isfinite(value):
        raise ValueError(label + " must be a finite number")
    return float(value)


def _load_metrics(raw, degree):
    data = json.loads(
        raw.decode("utf-8"),
        object_pairs_hook=_unique_object,
        parse_constant=_reject_constant,
    )
    if not isinstance(data, dict) or set(data) != {"degree", "n", "loocv_mse", "train_mse"}:
        raise ValueError("metrics.json has an unexpected schema")
    if type(data["degree"]) is not int or data["degree"] != degree:
        raise ValueError("metrics degree does not match input order")
    if type(data["n"]) is not int or data["n"] != 11:
        raise ValueError("metrics n must be 11")
    mse = _finite_number(data["loocv_mse"], "loocv_mse")
    if mse <= 0:
        raise ValueError("loocv_mse must be positive")
    train_mse = _finite_number(data["train_mse"], "train_mse")
    if train_mse < 0:
        raise ValueError("train_mse must not be negative")
    return mse


def _load_predictions(raw, degree):
    reader = csv.reader(io.StringIO(raw.decode("utf-8"), newline=""), strict=True)
    if next(reader, None) != ["index", "x", "observed", "predicted", "error"]:
        raise ValueError("predictions.csv header is invalid")
    rows = []
    for index, fields in enumerate(reader, 1):
        if len(fields) != 5 or index > 11:
            raise ValueError("predictions.csv must contain exactly 11 complete rows")
        if fields[0] != str(index):
            raise ValueError("prediction indices must be ordered from 1 through 11")
        x, observed, predicted, error = (
            _finite_number(float(value), "CSV numeric value") for value in fields[1:]
        )
        if error != observed - predicted:
            raise ValueError("prediction error does not equal observed minus predicted")
        rows.append({"index": index, "x": x, "observed": observed, "predicted": predicted})
    if len(rows) != 11:
        raise ValueError("predictions.csv must contain exactly 11 rows")
    squared_errors = [(row["observed"] - row["predicted"]) ** 2 for row in rows]
    if not all(math.isfinite(value) for value in squared_errors):
        raise ValueError("squared prediction error is non-finite")
    return rows, math.fsum(squared_errors) / len(rows)


def _map_x(value):
    return PLOT["left"] + round((value - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]) * (PLOT["right"] - PLOT["left"]))


def _map_y(value):
    return PLOT["bottom"] - round((value - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]) * (PLOT["bottom"] - PLOT["top"]))


def _draw(rows):
    canvas = Canvas(WIDTH, HEIGHT)
    grid, axis, text = (226, 230, 235), (35, 43, 52), (40, 48, 58)
    x_ticks, y_ticks = (4, 6, 8, 10, 12, 14), (3, 5, 7, 9, 11)
    for tick in x_ticks:
        x = _map_x(tick)
        canvas.line(x, PLOT["top"], x, PLOT["bottom"], grid)
        canvas.line(x, PLOT["bottom"], x, PLOT["bottom"] + 5, axis)
        canvas.text(x - 6, PLOT["bottom"] + 11, str(tick), text)
    for tick in y_ticks:
        y = _map_y(tick)
        canvas.line(PLOT["left"], y, PLOT["right"], y, grid)
        canvas.line(PLOT["left"] - 5, y, PLOT["left"], y, axis)
        canvas.text(PLOT["left"] - 25, y - 3, str(tick), text)
    canvas.line(PLOT["left"], PLOT["top"], PLOT["left"], PLOT["bottom"], axis)
    canvas.line(PLOT["left"], PLOT["bottom"], PLOT["right"], PLOT["bottom"], axis)
    canvas.text(PLOT["left"], 25, "ANSCOMBE II", text)
    canvas.text((PLOT["left"] + PLOT["right"]) // 2 - 3, 590, "X", text)
    canvas.text(PLOT["left"] - 28, PLOT["top"] - 16, "Y", text)

    for label, color in (
        ("OBSERVED", COLORS["observed"]),
        ("DEGREE 1", COLORS["degree1"]),
        ("DEGREE 2", COLORS["degree2"]),
    ):
        row = ("OBSERVED", "DEGREE 1", "DEGREE 2").index(label)
        y = 17 + row * 19
        canvas.rect(625, y, 13, 13, color)
        canvas.text(648, y + 3, label, text)

    for row in rows:
        x, actual = _map_x(row["x"]), _map_y(row["observed"])
        linear, quadratic = _map_y(row["degree1_prediction"]), _map_y(row["degree2_prediction"])
        canvas.circle(x, actual, 4, COLORS["observed"])
        canvas.line(x - 4, linear, x + 4, linear, COLORS["degree1"])
        canvas.line(x, linear - 4, x, linear + 4, COLORS["degree1"])
        diamond = ((x, quadratic - 5), (x + 5, quadratic), (x, quadratic + 5), (x - 5, quadratic))
        for first, second in zip(diamond, diamond[1:] + diamond[:1]):
            canvas.line(first[0], first[1], second[0], second[1], COLORS["degree2"])
    return canvas.png()


def _clear_outputs(output_dir):
    for name in OUTPUT_NAMES:
        path = output_dir / name
        if path.is_file() or path.is_symlink():
            path.unlink()


def main():
    output_dir = Path(os.environ.get("PI_OUTPUT_DIR") or "/output")
    try:
        _clear_outputs(output_dir)
        if len(sys.argv) != 5:
            raise ValueError("expected four input paths: degree-1 metrics/CSV, then degree-2 metrics/CSV")

        raw_inputs = [Path(path).read_bytes() for path in sys.argv[1:]]
        metrics1 = _load_metrics(raw_inputs[0], 1)
        predictions1, recomputed1 = _load_predictions(raw_inputs[1], 1)
        metrics2 = _load_metrics(raw_inputs[2], 2)
        predictions2, recomputed2 = _load_predictions(raw_inputs[3], 2)
        if not math.isclose(metrics1, recomputed1, rel_tol=1e-12, abs_tol=1e-15):
            raise ValueError("degree-1 LOOCV MSE does not match its predictions")
        if not math.isclose(metrics2, recomputed2, rel_tol=1e-12, abs_tol=1e-15):
            raise ValueError("degree-2 LOOCV MSE does not match its predictions")

        rows = []
        for first, second in zip(predictions1, predictions2):
            if first["index"] != second["index"] or first["x"] != second["x"] or first["observed"] != second["observed"]:
                raise ValueError("degree-1 and degree-2 CSV rows do not describe the same observations")
            row = {
                "index": first["index"],
                "x": first["x"],
                "observed": first["observed"],
                "degree1_prediction": first["predicted"],
                "degree2_prediction": second["predicted"],
            }
            if not X_RANGE[0] <= row["x"] <= X_RANGE[1] or any(
                not Y_RANGE[0] <= value <= Y_RANGE[1]
                for value in (row["observed"], row["degree1_prediction"], row["degree2_prediction"])
            ):
                raise ValueError("data falls outside the fixed plot axes")
            rows.append(row)

        mapped_rows = []
        for row in rows:
            mapped_rows.append({
                **row,
                "coordinates": {
                    "observed": {"x": _map_x(row["x"]), "y": _map_y(row["observed"])},
                    "degree1_prediction": {"x": _map_x(row["x"]), "y": _map_y(row["degree1_prediction"])},
                    "degree2_prediction": {"x": _map_x(row["x"]), "y": _map_y(row["degree2_prediction"])},
                },
            })
        data = {
            "schema": "anscombe-paper-figure/v1",
            "inputSha256": {
                name: hashlib.sha256(raw).hexdigest()
                for name, raw in zip(INPUT_NAMES, raw_inputs)
            },
            "loocvMse": {"degree1": recomputed1, "degree2": recomputed2},
            "colors": {
                "observed": "#C62830",
                "degree1": "#2563EB",
                "degree2": "#168554",
            },
            "coordinates": {
                "width": WIDTH,
                "height": HEIGHT,
                "pixelOrigin": "top-left",
                "plot": PLOT,
                "xRange": list(X_RANGE),
                "yRange": list(Y_RANGE),
            },
            "rows": mapped_rows,
        }
        png = _draw(rows)
        if png[:8] != b"\x89PNG\r\n\x1a\n" or struct.unpack(">II", png[16:24]) != (WIDTH, HEIGHT):
            raise ValueError("generated PNG header is invalid")

        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "figure-data.json").write_text(
            json.dumps(data, indent=2, sort_keys=True, allow_nan=False) + "\n", encoding="utf-8"
        )
        (output_dir / "figure.png").write_bytes(png)
        print("validated Anscombe II inputs and wrote figure artifacts to", output_dir)
        return 0
    except Exception as exc:
        try:
            _clear_outputs(output_dir)
        except OSError:
            pass
        print("plot.py:", exc, file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
