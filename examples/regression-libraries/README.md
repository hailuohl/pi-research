# Fixed multivariate regression comparison

This example exercises the `regression-libraries.md` resource through ordinary Pi
Research development, independent review, Run and artifact workflows. It does not
change the single-predictor closed protocol or add an execution backend.

The predeclared task uses the public UCI red Wine Quality data (Cortez et al.,
2009, https://doi.org/10.24432/C56S3T, CC BY 4.0): all 11 physicochemical predictors
and the quality score as a numeric response. Treating an ordinal score as equally
spaced is an analysis choice. The program retains every row, groups identical
predictor vectors, and makes one 70/30 group split with seed 20261021. Both models
use exactly that split. There is no tuning, outlier deletion, second seed, feature
selection or search for a favorable result.

Compare degree 1 with degree 2 (including interactions). Fit StandardScaler only
on training rows within each Pipeline. Statsmodels OLS uses the same transformed
design, an explicit intercept and the same training response. Prediction and
coefficient agreement use rtol=1e-8, atol=1e-9; this checks implementation, not
scientific validity. Reject nonfinite or rank-deficient inputs. Save conditioning,
residual and influence diagnostics without automatically removing observations.

Primary output is test **row-weighted RMSE**, in score units; gain is linear RMSE
minus quadratic RMSE. A positive point estimate favors the quadratic model on
this split only. Groups may contain repeated or conflicting scores. No iid
confidence interval, significance, equivalence, causal or external-generalization
claim is made. This is a new multivariate experiment, not a reproduction of the
earlier single-alcohol split or the original paper's SVM result.

Build the optional research image with `docker build -t pi-regression-methods
examples/regression-libraries`. Record the resulting immutable repository digest
and full `/opt/research-environment.txt`; use that digest in the platform's normal
Run contract. Dependency installation happens only during this explicit image
build. The example does not install packages in the application or user Python.

Copy `compare.py`, `test_compare.py`, this protocol and the explicitly supplied
CSV into the research source. Development command: `python -m unittest
test_compare.py` (synthetic checks only). Formal command: `python compare.py
winequality-red.csv`. Both run in the fixed image with network disabled. Declare
`metrics.json`, `split.json`, `predictions.csv`, `diagnostics.json` and
`environment.json`; the platform provides `PI_OUTPUT_DIR`. Metrics are only the
three flat finite values `baseline_rmse`, `candidate_rmse`, and `rmse_gain`.

Re-run the small checks after modifying the example. Verify archived row IDs,
group separation, train-only scaling, both predictions and the metrics against
the original fixed input before accepting a report. Library checks do not prove
the study design or identify otherwise unrecorded batches or repeated wines.

Only the script, tests and environment recipe are versioned here. The raw data,
research database, model conversations and full execution logs stay in the local
research/validation directory. See the batch acceptance record for actual results.
