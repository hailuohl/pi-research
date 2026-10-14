"""Known synthetic numerical answers and immutable source/plan boundaries."""
import argparse
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import alignment_common as common
import plan_workflow
import research
import statistics_workflow as workflow


class StatisticsTests(unittest.TestCase):
    def test_welch_one_constant_arm_still_has_estimable_difference_interval(self):
        result, gaps = workflow.compare([0, 0, 0], [1, 2, 3], "welch_t")
        self.assertEqual(gaps, [])
        self.assertEqual(result["difference"], -2)
        self.assertEqual(result["df"], 2)
        self.assertAlmostEqual(result["statistic"], -(12 ** 0.5), places=12)
        self.assertAlmostEqual(result["p_raw"], 1 - (6 / 7) ** 0.5, places=12)
        self.assertAlmostEqual(result["difference_ci"][1], -2 + 4.302652729696142 / (3 ** 0.5), places=10)

    def rows(self):
        return [{"group": group, "seed": str(index), "value": str(value), "x": str(index), "y": str(value)}
                for group, values in (("A", [3, 5, 8, 10]), ("B", [1, 2, 4, 6])) for index, value in enumerate(values)]

    def spec(self, method, **updates):
        return {"method": method, "metric": {"name": "Fixture value", "unit": "dimensionless", "direction": "higher"},
                "columns": {"value": "value", "group": "group", "key": "seed", "x": "x", "y": "y"}, "x_unit": "count",
                "comparisons": [{"id": "AB", "treatment": "A", "baseline": "B"}],
                "assumptions": {name: True for name in workflow.ASSUMPTIONS[method]}, **updates}

    def test_descriptive_and_t_mean_interval(self):
        result, clean = workflow.compute(self.rows(), self.spec("mean_ci"))
        self.assertEqual(len(clean), 8)
        self.assertEqual(result["results"]["A"]["mean"], 6.5)
        self.assertAlmostEqual(result["results"]["A"]["ci"][0], 6.5 - 3.182446305 * (29 / 12) ** 0.5, places=7)
        self.assertEqual(result["gaps"], [])
        result, _ = workflow.compute(self.rows()[:1], self.spec("mean_ci"))
        self.assertIsNone(result["results"]["A"]["ci"])
        self.assertTrue(result["gaps"])
        perfect = [{"x": str(index), "y": str(2 * index + 1)} for index in range(5)]
        result, _ = workflow.compute(perfect, self.spec("ols", columns={"x": "x", "y": "y"}))
        self.assertIsNone(result["results"]["coefficients"]["slope"]["p_raw"])
        self.assertTrue(result["gaps"])

    def test_welch_and_paired_use_difference_uncertainty(self):
        independent, _ = workflow.compute(self.rows(), self.spec("welch_t"))
        paired, _ = workflow.compute(self.rows(), self.spec("paired_t"))
        self.assertEqual(independent["results"]["AB"]["difference"], 3.25)
        self.assertEqual(paired["results"]["AB"]["pair_keys"], ["0", "1", "2", "3"])
        self.assertNotEqual(independent["results"]["AB"]["difference_ci"], paired["results"]["AB"]["difference_ci"])
        with self.assertRaisesRegex(ValueError, "identical"):
            workflow.compute(self.rows()[:-1], self.spec("paired_t"))
        with self.assertRaisesRegex(ValueError, "unique"):
            workflow.compute(self.rows() + [self.rows()[0]], self.spec("paired_t"))

    def test_rank_methods_correlations_and_ols(self):
        for method in ("mann_whitney", "wilcoxon"):
            result, _ = workflow.compute(self.rows(), self.spec(method))
            self.assertIsNotNone(result["results"]["AB"]["p_raw"])
            self.assertIsNone(result["results"]["AB"]["difference_ci"])
        rows = [{"x": str(x), "y": str(y)} for x, y in enumerate([1, 2, 4, 4, 6], 1)]
        for method in ("pearson", "spearman", "ols"):
            result, _ = workflow.compute(rows, self.spec(method, columns={"x": "x", "y": "y"}))
            if method == "ols":
                self.assertAlmostEqual(result["results"]["coefficients"]["slope"]["estimate"], 1.2)
                self.assertEqual(len(result["results"]["residuals"]), 5)
                self.assertEqual(result["results"]["df_residual"], 3)
            else:
                self.assertGreater(result["results"]["statistic"], 0.9)

    def test_complete_holm_and_bh_family(self):
        expected = [0.03, 0.06, 0.06]
        for actual, wanted in zip(workflow.adjust_pvalues([0.01, 0.04, 0.03], "holm"), expected):
            self.assertAlmostEqual(actual, wanted)
        for actual, wanted in zip(workflow.adjust_pvalues([0.01, 0.04, 0.03], "bh"), [0.03, 0.04, 0.04]):
            self.assertAlmostEqual(actual, wanted)
        with self.assertRaisesRegex(ValueError, "family_count"):
            workflow.compute(self.rows(), self.spec("welch_t", correction={"family": "Fixture family", "method": "holm", "family_count": 2}))

    def test_invalid_inputs_assumptions_and_degenerate_tests(self):
        result, _ = workflow.compute(self.rows(), self.spec("welch_t", assumptions={}))
        self.assertTrue(result["gaps"])
        rows = self.rows()
        rows[0]["value"] = "nan"
        with self.assertRaisesRegex(ValueError, "Non-finite"):
            workflow.compute(rows, self.spec("descriptive"))
        rows[0]["value"] = ""
        with self.assertRaisesRegex(ValueError, "Missing"):
            workflow.compute(rows, self.spec("descriptive"))
        result, clean = workflow.compute(rows, self.spec("descriptive", missing="exclude"))
        self.assertEqual(len(clean), 7)
        self.assertEqual(result["excluded"][0]["row"], 2)
        zeros = [{"group": group, "seed": str(index), "value": "2"} for group in ("A", "B") for index in range(2)]
        result, _ = workflow.compute(zeros, self.spec("welch_t"))
        self.assertIsNone(result["results"]["AB"]["p_raw"])
        self.assertTrue(result["gaps"])

    def test_workflow_source_scope_reopen_and_code_hash(self):
        with tempfile.TemporaryDirectory(prefix="synthetic-statistics-") as folder:
            root = Path(folder)
            research.init(argparse.Namespace(workspace=str(root), task="T1", question="Synthetic"))
            ws = research.Workspace(root, "T1")
            (root / "inputs/data.csv").write_text("group,seed,value\nA,0,3\nA,1,5\nA,2,8\nB,0,1\nB,1,2\nB,2,4\n", encoding="utf-8")
            research.write_json(root / "inputs/meta.json", {"title": "Fixture", "authors": "Fixture", "year": "unknown", "content_level": "data", "selection_reason": "Synthetic", "license": "Synthetic", "data_label": "synthetic"})
            research.register(ws, argparse.Namespace(id="D1", file="inputs/data.csv", metadata="inputs/meta.json"))
            plan = {"question": "Synthetic", "scope": "Software", "constraints": ["Synthetic"], "success_criteria": ["Provenance"], "stop_conditions": ["Bad input"], "clarification_questions": [], "hypotheses": [], "evidence_ids": [], "source_ids": ["D1"], "steps": ["Compute"], "analysis_mode": "required"}
            research.write_json(root / "inputs/plan.json", plan)
            plan_workflow.plan(ws, argparse.Namespace(id="P1", spec="inputs/plan.json", previous=None))
            research.write_json(root / "inputs/spec.json", self.spec("welch_t"))
            args = argparse.Namespace(id="A1", source="D1", spec="inputs/spec.json", plan="P1")
            first = workflow.analyze(ws, args)
            self.assertEqual(first["status"], "complete")
            result = common.strict_json(Path(first["path"]) / "result.json")
            self.assertEqual(result["data_label"], "synthetic")
            self.assertEqual(result["scientific_conclusion"], "pending")
            self.assertTrue(workflow.analyze(ws, args)["reused"])
            with patch.object(common.research, "digest", side_effect=lambda path: "changed" if Path(path).name == "statistics_workflow.py" else research_digest(path)):
                with self.assertRaisesRegex(ValueError, "Extension code changed"):
                    common.extension_record(ws, "analysis", "A1")
            research.write_json(root / "inputs/spec.json", self.spec("paired_t"))
            with self.assertRaisesRegex(ValueError, "changed|different"):
                workflow.analyze(ws, args)


research_digest = research.digest

if __name__ == "__main__":
    unittest.main()
