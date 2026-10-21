"""Fixed multivariate degree 1/2 comparison, using ordinary Pi Research Run outputs."""
import csv
import hashlib
import importlib.metadata
import io
import json
import os
from pathlib import Path
import sys

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
import statsmodels.api as sm

SEED = 20261021
FEATURES = ['fixed acidity', 'volatile acidity', 'citric acid', 'residual sugar',
            'chlorides', 'free sulfur dioxide', 'total sulfur dioxide', 'density',
            'pH', 'sulphates', 'alcohol']


def split_groups(x):
    """Keep identical measured predictor vectors together, including conflicting scores."""
    _, group = np.unique(x, axis=0, return_inverse=True)
    train_groups, test_groups = train_test_split(np.unique(group), test_size=0.3, random_state=SEED)
    return np.flatnonzero(np.isin(group, train_groups)), np.flatnonzero(np.isin(group, test_groups))


def fit_pair(x_train, y_train, x_test):
    x_train, y_train, x_test = map(lambda x: np.asarray(x, dtype=float), (x_train, y_train, x_test))
    if (x_train.ndim != 2 or x_test.ndim != 2 or y_train.ndim != 1
            or len(x_train) != len(y_train) or x_train.shape[1] != x_test.shape[1]
            or not len(x_test) or not all(np.isfinite(a).all() for a in (x_train, y_train, x_test))):
        raise ValueError('finite, aligned two-dimensional predictors and one-dimensional response required')
    predictions, diagnostics = [], []
    for degree in (1, 2):
        pipeline = Pipeline([('scale', StandardScaler()),
                             ('poly', PolynomialFeatures(degree=degree, include_bias=False)),
                             ('linear', LinearRegression())])
        pipeline.fit(x_train, y_train)
        train_design = sm.add_constant(pipeline[:-1].transform(x_train), has_constant='add')
        test_design = sm.add_constant(pipeline[:-1].transform(x_test), has_constant='add')
        rank = int(np.linalg.matrix_rank(train_design))
        if rank != train_design.shape[1] or len(x_train) <= rank:
            raise ValueError('full rank and positive residual degrees of freedom required')
        ols = sm.OLS(y_train, train_design, missing='raise').fit()
        predicted = pipeline.predict(x_test)
        other = ols.predict(test_design)
        coefficients = np.r_[pipeline[-1].intercept_, pipeline[-1].coef_]
        if not np.isfinite(predicted).all() or not np.isfinite(other).all():
            raise ValueError('nonfinite model prediction')
        np.testing.assert_allclose(predicted, other, rtol=1e-8, atol=1e-9)
        np.testing.assert_allclose(coefficients, ols.params, rtol=1e-8, atol=1e-9)
        condition = float(np.linalg.cond(train_design))
        if not np.isfinite(condition):
            raise ValueError('nonfinite condition number')
        influence = ols.get_influence()
        cooks = influence.cooks_distance[0]
        diagnostics.append({'degree': degree, 'rank': rank, 'parameters': len(coefficients),
                            'condition_number': condition, 'coefficients': coefficients.tolist(),
                            'residual_df': float(ols.df_resid),
                            'training_residual_rmse': float(np.sqrt(np.mean(ols.resid ** 2))),
                            'max_leverage': float(influence.hat_matrix_diag.max()),
                            'max_cooks_distance': float(cooks.max()) if np.isfinite(cooks).all() else None,
                            'cross_library_max_abs_error': float(np.max(np.abs(predicted - other)))})
        predictions.append(predicted)
    return {'predictions': predictions, 'diagnostics': diagnostics,
            'training_mean': pipeline[0].mean_, 'training_scale': pipeline[0].scale_}


def main(path):
    raw = Path(path).read_bytes()
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8')), delimiter=';')
    if reader.fieldnames != FEATURES + ['quality']:
        raise ValueError('expected the documented UCI red wine feature order')
    data = np.array([[float(row[name]) for name in reader.fieldnames] for row in reader], dtype=float)
    if data.ndim != 2 or len(data) < 3 or not np.isfinite(data).all():
        raise ValueError('finite numeric input required')
    x, y = data[:, :-1], data[:, -1]
    train, test = split_groups(x)
    if set(map(tuple, x[train])) & set(map(tuple, x[test])):
        raise ValueError('predictor group leakage')
    fitted = fit_pair(x[train], y[train], x[test])
    baseline, candidate = fitted['predictions']
    baseline_rmse = float(np.sqrt(np.mean((y[test] - baseline) ** 2)))
    candidate_rmse = float(np.sqrt(np.mean((y[test] - candidate) ** 2)))
    ids = [f'row-{i + 1:04d}' for i in range(len(data))]
    output = Path(os.environ['PI_OUTPUT_DIR'])
    output.mkdir(parents=True, exist_ok=True)
    artifacts = {
        'metrics.json': {'baseline_rmse': baseline_rmse, 'candidate_rmse': candidate_rmse,
                         'rmse_gain': baseline_rmse - candidate_rmse},
        'split.json': {'seed': SEED, 'test_group_fraction': 0.3, 'features': FEATURES,
                       'train_row_ids': [ids[i] for i in train], 'test_row_ids': [ids[i] for i in test],
                       'rows': len(data), 'predictor_groups': len(np.unique(x, axis=0)),
                       'train_groups': len(np.unique(x[train], axis=0)),
                       'test_groups': len(np.unique(x[test], axis=0)),
                       'identical_full_rows': len(data) - len(np.unique(data, axis=0))},
        'diagnostics.json': {'models': fitted['diagnostics'],
                             'training_mean': fitted['training_mean'].tolist(),
                             'training_scale': fitted['training_scale'].tolist(),
                             'coefficient_basis': 'intercept then PolynomialFeatures of training-standardized inputs',
                             'inference': 'not_assessed; row-weighted errors on one predictor-group-disjoint split'},
        'environment.json': {'python': sys.version, 'input_sha256': hashlib.sha256(raw).hexdigest(),
                             'source_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                             'packages': {name: importlib.metadata.version(name) for name in
                                          ['numpy', 'scipy', 'pandas', 'scikit-learn', 'statsmodels']},
                             'resolved_requirements': Path('/opt/research-environment.txt').read_text()},
    }
    for name, value in artifacts.items():
        (output / name).write_text(json.dumps(value, ensure_ascii=False, allow_nan=False, indent=2) + '\n')
    with (output / 'predictions.csv').open('w', newline='') as stream:
        writer = csv.writer(stream)
        writer.writerow(['row_id', 'observed', 'baseline_prediction', 'candidate_prediction'])
        writer.writerows((ids[i], float(y[i]), float(a), float(b)) for i, a, b in zip(test, baseline, candidate))


if __name__ == '__main__':
    main(sys.argv[1])
