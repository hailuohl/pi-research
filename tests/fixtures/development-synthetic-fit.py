"""Small real execution fixture: train two polynomials on the host fixture only."""
import hashlib
import json
import math
import os
import pathlib
import sys


def solve(matrix, values):
    rows = [row[:] + [value] for row, value in zip(matrix, values)]
    for column in range(len(rows)):
        pivot = max(range(column, len(rows)), key=lambda i: abs(rows[i][column]))
        rows[column], rows[pivot] = rows[pivot], rows[column]
        divisor = rows[column][column]
        assert abs(divisor) > 1e-12
        rows[column] = [value / divisor for value in rows[column]]
        for i in range(len(rows)):
            if i != column:
                multiplier = rows[i][column]
                rows[i] = [a - multiplier * b for a, b in zip(rows[i], rows[column])]
    return [row[-1] for row in rows]


def shared_fit_predict(rows):
    train = [row for row in rows if row['partition'] == 'train']
    test = [row for row in rows if row['partition'] == 'test']
    center = sum(row['x'] for row in train) / len(train)
    scale = math.sqrt(sum((row['x'] - center) ** 2 for row in train) / len(train))
    assert scale > 0
    models = {}
    for name, degree in [('baseline', 1), ('candidate', 2)]:
        features = [[((row['x'] - center) / scale) ** i for i in range(degree + 1)] for row in train]
        matrix = [[sum(row[i] * row[j] for row in features) for j in range(degree + 1)] for i in range(degree + 1)]
        values = [sum(row[i] * source['observed'] for row, source in zip(features, train)) for i in range(degree + 1)]
        models[name] = {'coefficients': solve(matrix, values)}
    witness = [{'rowId': row['rowId'], 'observed': row['observed'], **{name + 'Prediction': sum(value * ((row['x'] - center) / scale) ** i for i, value in enumerate(model['coefficients'])) for name, model in models.items()}} for row in test]
    errors = {name: math.sqrt(sum((row['observed'] - row[name + 'Prediction']) ** 2 for row in witness) / len(witness)) for name in models}
    fit = {'trainRowIds': [row['rowId'] for row in train], 'normalization': {'predictor': {'center': center, 'scale': scale}}, 'models': models, 'implementation': {'path': 'compare.py', 'entryPoint': 'shared_fit_predict', 'digest': hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest()}}
    return {'baseline': errors['baseline'], 'candidate': errors['candidate'], 'gain': errors['baseline'] - errors['candidate']}, {'rows': witness}, fit


if __name__ == '__main__':
    source = pathlib.Path(sys.argv[1])
    assert source.parent == pathlib.Path('/data')
    outputs = shared_fit_predict(json.loads(source.read_text())['rows'])
    destination = pathlib.Path(os.environ['PI_OUTPUT_DIR'])
    for name, value in zip(['metrics.json', 'analysis.json', 'fit-provenance.json'], outputs):
        (destination / name).write_text(json.dumps(value), encoding='utf-8')
