import csv, json, os, pathlib


def solve_normal_equations(matrix, rhs):
    """Gauss-Jordan with partial pivoting; raises ValueError on singular matrix."""
    n = len(rhs)
    a = [row[:] for row in matrix]
    b = list(rhs)
    for i in range(n):
        pivot = max(range(i, n), key=lambda k: abs(a[k][i]))
        if abs(a[pivot][i]) < 1e-12:
            raise ValueError("singular normal-equation matrix")
        a[i], a[pivot] = a[pivot], a[i]
        b[i], b[pivot] = b[pivot], b[i]
        v = a[i][i]
        a[i] = [x / v for x in a[i]]
        b[i] /= v
        for k in range(n):
            if k == i:
                continue
            v = a[k][i]
            a[k] = [x - v * y for x, y in zip(a[k], a[i])]
            b[k] -= v * b[i]
    return b


def fit_polynomial(rows, degree):
    """Least-squares polynomial fit. rows: iterable of (x, y)."""
    train = list(rows)
    if degree < 0:
        raise ValueError("degree must be non-negative")
    if len(train) < degree + 1:
        raise ValueError("not enough data points")
    n = degree + 1
    a = [[sum(x ** (i + j) for x, y in train) for j in range(n)] for i in range(n)]
    b = [sum(y * x ** i for x, y in train) for i in range(n)]
    return solve_normal_equations(a, b)


def predict(coeffs, x):
    return sum(v * x ** i for i, v in enumerate(coeffs))


def mse(coeffs, rows):
    if not rows:
        raise ValueError("no data")
    return sum((predict(coeffs, x) - y) ** 2 for x, y in rows) / len(rows)


def main():
    cfg = json.loads(pathlib.Path('config.json').read_text())
    degree = cfg['polynomialDegree']
    with open('data.csv') as f:
        data = [(float(r['x']), float(r['y'])) for r in csv.DictReader(f)]
    train, test = data[:180], data[180:]
    coeffs = fit_polynomial(train, degree)
    mean = sum(y for _, y in test) / len(test)
    metrics = {
        'mse': mse(coeffs, test),
        'train_mse': mse(coeffs, train),
        'r2': 1 - sum((predict(coeffs, x) - y) ** 2 for x, y in test)
                  / sum((y - mean) ** 2 for _, y in test),
    }
    out = pathlib.Path(os.environ['PI_OUTPUT_DIR'])
    out.mkdir(exist_ok=True)
    (out / 'metrics.json').write_text(json.dumps(metrics))
    (out / 'model.json').write_text(json.dumps({'degree': degree, 'coefficients': coeffs}))
    with (out / 'predictions.csv').open('w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['x', 'actual', 'predicted'])
        w.writerows((x, y, predict(coeffs, x)) for x, y in test)
    print(json.dumps({'degree': degree, 'metrics': metrics}), flush=True)


if __name__ == '__main__':
    main()
