"""Small numerical and leakage checks; run in the pinned research image."""
import unittest
import numpy as np
from compare import fit_pair, split_groups


class RegressionChecks(unittest.TestCase):
    def test_quadratic_known_answer_and_single_row_prediction(self):
        x = np.arange(-4.0, 5.0).reshape(-1, 1)
        y = 2 + 3 * x[:, 0] + 0.5 * x[:, 0] ** 2
        result = fit_pair(x, y, np.array([[1.5]]))
        np.testing.assert_allclose(result['predictions'][1], [7.625], atol=1e-10)
        self.assertLess(result['diagnostics'][1]['cross_library_max_abs_error'], 1e-10)

    def test_test_distribution_never_changes_fitted_preprocessing(self):
        x = np.arange(-4.0, 5.0).reshape(-1, 1)
        y = 1 + x[:, 0] + 0.2 * x[:, 0] ** 2
        a = fit_pair(x, y, np.array([[0.5], [1.0]]))
        b = fit_pair(x, y, np.array([[0.5], [10000.0]]))
        np.testing.assert_array_equal(a['training_mean'], x.mean(axis=0))
        np.testing.assert_array_equal(a['training_mean'], b['training_mean'])
        np.testing.assert_allclose(a['predictions'][1][0], b['predictions'][1][0])

    def test_repeated_predictors_stay_in_one_partition(self):
        x = np.repeat(np.arange(20.0), 2).reshape(-1, 1)
        train, test = split_groups(x)
        self.assertFalse(set(map(tuple, x[train])) & set(map(tuple, x[test])))
        self.assertEqual(sorted([*train, *test]), list(range(len(x))))

    def test_invalid_and_rank_deficient_inputs_are_rejected(self):
        x = np.arange(9.0).reshape(-1, 1)
        for bad in (np.full_like(x, np.nan), np.ones_like(x)):
            with self.assertRaises(ValueError):
                fit_pair(bad, np.arange(9.0), np.array([[1.0]]))
        with self.assertRaises(ValueError):
            fit_pair(x, np.full(9, np.inf), np.array([[1.0]]))


if __name__ == '__main__':
    unittest.main()
