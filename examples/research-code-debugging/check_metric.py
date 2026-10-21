import importlib.util
import math
import sys
import unittest

path = sys.argv.pop(1)
spec = importlib.util.spec_from_file_location("tested_metric", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TestRMSE(unittest.TestCase):
    def test_single_observation(self):
        self.assertEqual(module.rmse([1.0], [0.0]), 1.0)

    def test_two_observations(self):
        self.assertAlmostEqual(module.rmse([1.0, 3.0], [0.0, 0.0]), math.sqrt(5.0))

    def test_empty_input_rejected(self):
        with self.assertRaises(ValueError):
            module.rmse([], [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
