#!/usr/bin/env python3
"""Compare degree-1 and degree-2 fits on Anscombe group 2."""

import csv
import io
import json
import math
import os
from pathlib import Path
import sys

from main import load_groups


CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.json"


def load_degree():
    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate config key: {key}")
            result[key] = value
        return result

    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"), object_pairs_hook=unique_object)
    except (OSError, UnicodeError, ValueError) as exc:
        raise SystemExit(f"invalid config.json: {exc}") from exc
    if (
        not isinstance(config, dict)
        or set(config) != {"degree"}
        or type(config["degree"]) is not int
        or config["degree"] not in (1, 2)
    ):
        raise SystemExit('config.json must be exactly {"degree":1} or {"degree":2}')
    return config["degree"]


def _solve(matrix, vector):
    size = len(vector)
    augmented = [list(row) + [value] for row, value in zip(matrix, vector)]
    scale = max(abs(value) for row in matrix for value in row)
    tolerance = sys.float_info.epsilon * scale * size * 16

    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        if abs(augmented[pivot][column]) <= tolerance:
            raise SystemExit("least-squares design is singular")
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        for row in range(column + 1, size):
            factor = augmented[row][column] / augmented[column][column]
            for index in range(column, size + 1):
                augmented[row][index] -= factor * augmented[column][index]

    solution = [0.0] * size
    for row in range(size - 1, -1, -1):
        tail = math.fsum(augmented[row][column] * solution[column] for column in range(row + 1, size))
        solution[row] = (augmented[row][-1] - tail) / augmented[row][row]
    if not all(math.isfinite(value) for value in solution):
        raise SystemExit("least-squares coefficients are non-finite")
    return solution


def _fit(xs, ys, degree):
    center = math.fsum(xs) / len(xs)
    scale = max(abs(x - center) for x in xs)
    if not math.isfinite(center) or not math.isfinite(scale) or scale == 0:
        raise SystemExit("least-squares input has no finite x variation")

    def basis(x):
        z = (x - center) / scale
        return [1.0, z] if degree == 1 else [1.0, z, z * z]

    rows = [basis(x) for x in xs]
    if not all(math.isfinite(value) for row in rows for value in row):
        raise SystemExit("least-squares design contains a non-finite value")
    width = degree + 1
    matrix = [
        [math.fsum(row[i] * row[j] for row in rows) for j in range(width)]
        for i in range(width)
    ]
    vector = [math.fsum(row[i] * y for row, y in zip(rows, ys)) for i in range(width)]
    if not all(math.isfinite(value) for row in matrix for value in row) or not all(
        math.isfinite(value) for value in vector
    ):
        raise SystemExit("least-squares normal equations contain a non-finite value")
    return center, scale, _solve(matrix, vector)


def _predict(x, fit):
    center, scale, coefficients = fit
    z = (x - center) / scale
    value = math.fsum(coefficient * z**power for power, coefficient in enumerate(coefficients))
    if not math.isfinite(value):
        raise SystemExit("prediction is non-finite")
    return value


def _mse(observed, predicted):
    squared_errors = []
    for actual, estimate in zip(observed, predicted):
        error = actual - estimate
        squared = error * error
        if not math.isfinite(error) or not math.isfinite(squared):
            raise SystemExit("calculated error is non-finite")
        squared_errors.append(squared)
    result = math.fsum(squared_errors) / len(squared_errors)
    if not math.isfinite(result):
        raise SystemExit("calculated MSE is non-finite")
    return result


def main():
    degree = load_degree()
    groups = load_groups()
    try:
        xs, ys = groups[1]
    except (IndexError, TypeError):
        raise SystemExit("Anscombe group 2 is missing") from None
    if len(xs) != 11 or len(ys) != 11 or not all(
        math.isfinite(value) for value in (*xs, *ys)
    ):
        raise SystemExit("Anscombe group 2 must contain 11 finite (x, y) pairs")

    leave_one_out = []
    for held_out in range(len(xs)):
        train_x = xs[:held_out] + xs[held_out + 1 :]
        train_y = ys[:held_out] + ys[held_out + 1 :]
        leave_one_out.append(_predict(xs[held_out], _fit(train_x, train_y, degree)))
    train_fit = _fit(xs, ys, degree)
    train_predictions = [_predict(x, train_fit) for x in xs]
    errors = [observed - predicted for observed, predicted in zip(ys, leave_one_out)]
    metrics = {
        "loocv_mse": _mse(ys, leave_one_out),
        "train_mse": _mse(ys, train_predictions),
        "degree": degree,
        "n": len(xs),
    }
    if not all(math.isfinite(value) for value in metrics.values()):
        raise SystemExit("calculated metrics contain a non-finite value")

    csv_output = io.StringIO(newline="")
    writer = csv.writer(csv_output, lineterminator="\n")
    writer.writerow(("index", "x", "observed", "predicted", "error"))
    writer.writerows(
        (index, x, observed, predicted, error)
        for index, (x, observed, predicted, error) in enumerate(zip(xs, ys, leave_one_out, errors), 1)
    )
    metrics_output = json.dumps(metrics, indent=2, sort_keys=True, allow_nan=False) + "\n"

    output_dir = Path(os.environ.get("PI_OUTPUT_DIR") or "/output")
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "metrics.json").write_text(metrics_output, encoding="utf-8")
    (output_dir / "predictions.csv").write_text(csv_output.getvalue(), encoding="utf-8", newline="")
    print(f"wrote metrics.json and predictions.csv to {output_dir}")


if __name__ == "__main__":
    main()
