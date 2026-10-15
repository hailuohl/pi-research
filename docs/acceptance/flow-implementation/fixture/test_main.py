import csv, json, os, subprocess, sys, tempfile, unittest
import main


class FitTests(unittest.TestCase):
    def test_exact_quadratic_coefficients(self):
        rows = [(x, 2 + 3 * x - 1.5 * x ** 2) for x in range(-3, 7)]
        coeffs = main.fit_polynomial(rows, 2)
        for got, want in zip(coeffs, [2.0, 3.0, -1.5]):
            self.assertAlmostEqual(got, want, places=6)

    def test_predict_valid(self):
        rows = [(x, x * x) for x in range(5)]
        coeffs = main.fit_polynomial(rows, 2)
        self.assertAlmostEqual(main.predict(coeffs, 4.0), 16.0, places=6)

    def test_empty_data_rejected(self):
        with self.assertRaises(ValueError):
            main.fit_polynomial([], 2)

    def test_singular_input_rejected(self):
        with self.assertRaises(ValueError):
            main.fit_polynomial([(1.0, 2.0), (1.0, 3.0), (1.0, 4.0)], 2)


class ProtocolTests(unittest.TestCase):
    def run_script(self, outdir):
        env = dict(os.environ, PI_OUTPUT_DIR=str(outdir))
        r = subprocess.run([sys.executable, 'main.py'], capture_output=True, text=True, env=env)
        self.assertEqual(r.returncode, 0, r.stderr)
        return r.stdout

    def test_fixed_data_and_outputs(self):
        with open('config.json') as f:
            cfg = json.load(f)
        self.assertEqual(cfg['polynomialDegree'], 2)
        with open('data.csv') as f:
            rows = list(csv.DictReader(f))
        self.assertEqual(len(rows), 240)
        with tempfile.TemporaryDirectory() as outdir:
            self.run_script(outdir)
            with open(os.path.join(outdir, 'metrics.json')) as f:
                metrics = json.load(f)
            for key in ('mse', 'train_mse', 'r2'):
                self.assertIn(key, metrics)
            self.assertGreater(metrics['r2'], 0.9)
            with open(os.path.join(outdir, 'model.json')) as f:
                model = json.load(f)
            self.assertEqual(model['degree'], 2)
            self.assertEqual(len(model['coefficients']), 3)
            with open(os.path.join(outdir, 'predictions.csv')) as f:
                preds = list(csv.DictReader(f))
            self.assertEqual(len(preds), 60)
            self.assertEqual(list(preds[0].keys()), ['x', 'actual', 'predicted'])


if __name__ == '__main__':
    unittest.main()
