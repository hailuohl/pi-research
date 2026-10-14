"""Every chart method uses synthetic inputs; no real research or visual approval."""
import argparse
import copy
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import warnings

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import alignment_common as common
import chart_methods as methods
import chart_suite
import literature_workflow
import plan_workflow
import research


def metric():
    return {"name": "合成指标", "unit": "dimensionless", "direction": "lower"}


def fixtures():
    arms = [{"variant": variant, "seed": str(seed), "value": str(value)} for variant, values in (("base", [1, 3, 6]), ("new", [2, 5, 7])) for seed, value in enumerate(values)]
    curves = [{"variant": variant, "seed": str(seed), "x": str(x), "value": str(10 - x + seed + offset)}
              for variant, offset in (("base", 0), ("new", -1)) for seed in (0, 1, 2) for x in ([0, 2, 4] if seed != 1 else [1, 2, 3])]
    scaling = [{"family": "one", "n_params": str(n), "loss": str(0.4 + 3 * n ** -0.4), "fit": "1"} for n in (10, 30, 100, 300, 1000, 3000)]
    diagram = {"nodes": [{"id": "data", "label": "输入", "type": "data", "source_id": "D1", "evidence_ids": [], "provenance": "observed"},
                         {"id": "method", "label": "贡献", "source_id": "D1", "evidence_ids": [], "provenance": "hypothesis"}],
               "edges": [{"from": "data", "to": "method", "source_id": "D1", "evidence_ids": [], "provenance": "hypothesis", "label": "张量"}]}
    x = {"name": "运行预算", "unit": "count", "direction": "lower"}
    y = {"name": "收益", "unit": "dimensionless", "direction": "higher"}
    return {
        "benchmarks": ([{"benchmark": "B1", "method": "base", "score": "2"}, {"benchmark": "B1", "method": "new", "score": "3"}], {"kind": "benchmarks", "metric": metric(), "methods": ["base", "new"], "benchmarks": ["B1"], "method_families": {"base": "prior", "new": "ours"}, "baseline": "base"}),
        "ablation": (arms, {"kind": "ablation", "metric": metric(), "baseline": "base", "design": "independent", "assumptions": {"independent_observations": True, "mean_sampling_distribution": True}}),
        "curves": (curves, {"kind": "curves", "metric": metric(), "x": {**x, "quantity": "optimizer_steps"}, "comparison_basis": "same_config", "measurement_kind": "training_loss", "ema_alpha": 0.3, "assumptions": {"independent_seeds": True}}),
        "scaling": (scaling, {"kind": "scaling", "metric": metric(), "mechanism_interval": "Synthetic one-mechanism test", "comparability": {"same_data": True, "same_tokenizer": True, "same_evaluation": True, "rationale": "Synthetic equal configuration"}, "bootstrap_draws": 100, "predict_to": 6000}),
        "pareto": ([{"method": method, "setting": str(index), "seed": "0", "x": str(xvalue), "y": str(yvalue)} for method in ("base", "new") for index, (xvalue, yvalue) in enumerate(((1, 2), (2, 1), (3, 3)))], {"kind": "pareto", "x": x, "y": y, "budgets": {"base": 3, "new": 3}, "budget_unit": "settings", "budget_comparability": "Equal fixture budgets"}),
        "sweep": ([{"x": str(xvalue), "y": str(yvalue), "value": str(xvalue - yvalue) if (xvalue, yvalue) != (2, 2) else ""} for xvalue in (1, 2) for yvalue in (1, 2)], {"kind": "sweep", "metric": metric(), "x": x, "y": y, "norm": {"signed": True}}),
        "confusion": ({"classes": ["正类", "负类"], "counts": [[5, 1], [2, 6]]}, {"kind": "confusion", "classes": ["正类", "负类"], "class_order_rationale": "Fixture class semantics", "normalize": "row"}),
        "distribution": ([{"group": group, "value": str(value)} for group in ("A", "B") for value in (1, 2, 4)], {"kind": "distribution", "metric": metric(), "summary": "box"}),
        "diagram": (diagram, {"kind": "diagram", "flow": "LR", "contribution": "method"}),
        "scatter": ([{"x": "1", "y": "3"}, {"x": "2", "y": "4"}], {"kind": "scatter", "x": x, "y": y}),
    }


class ChartCalculationTests(unittest.TestCase):
    def test_axis_labels_keep_units_and_directions_in_caption(self):
        axis = {"name": "实际指标", "unit": "dimensionless", "direction": "lower"}
        self.assertEqual(chart_suite.label(axis), "实际指标\n(dimensionless)")
        spec = {"kind": "scatter", "x": axis, "y": {**axis, "direction": "higher"}}
        caption = chart_suite.caption({"data_label": "synthetic", "results": {"n": 2, "ci_method": "none"}}, spec)
        self.assertIn("x 实际指标: lower is better", caption)
        self.assertIn("y 实际指标: higher is better", caption)

    def test_all_kinds_compute_actual_values(self):
        for kind, (data, spec) in fixtures().items():
            with self.subTest(kind=kind):
                result, gaps = methods.compute(data, spec)
                self.assertGreater(result["n"], 0)
                self.assertIsInstance(gaps, list)
        result, _ = methods.compute(*fixtures()["benchmarks"])
        self.assertEqual(result["scores"]["B1"]["new"], 3)
        result, _ = methods.compute(*fixtures()["ablation"])
        self.assertAlmostEqual(result["effects"]["new"]["difference"], 4 / 3)

    def test_curves_common_coverage_and_no_evaluation_smoothing(self):
        data, spec = fixtures()["curves"]
        result, _ = methods.compute(data, spec)
        self.assertEqual(result["common_coverage"], [1, 3])
        self.assertTrue(all(1 <= value <= 3 for value in result["grid"]))
        self.assertEqual(result["groups"]["base"]["n"], 3)
        self.assertEqual(result["groups"]["base"]["individuals"][0]["raw"][0], 10)
        with self.assertRaisesRegex(ValueError, "only supported"):
            methods.compute(data, {**spec, "measurement_kind": "evaluation"})
        with self.assertRaisesRegex(ValueError, "coverage"):
            methods.compute(data, {**spec, "grid": [0, 2, 4]})

    def test_scaling_floor_bootstrap_residuals_and_exclusions(self):
        data, spec = fixtures()["scaling"]
        result, _ = methods.compute(data, spec)
        self.assertAlmostEqual(result["fit"]["E"], 0.4, places=2)
        self.assertAlmostEqual(result["fit"]["alpha"], 0.4, places=2)
        self.assertIsNotNone(result["alpha_ci"])
        self.assertGreaterEqual(result["bootstrap"]["valid"], 25)
        self.assertEqual(len(result["residuals"]), 6)
        with self.assertRaisesRegex(ValueError, "four"):
            methods.compute(data[:3], spec)
        data[0]["fit"] = "0"
        with self.assertRaisesRegex(ValueError, "excluded"):
            methods.compute(data, spec)

    def test_pareto_retains_dominated_points_and_honest_directions(self):
        result, _ = methods.compute(*fixtures()["pareto"])
        self.assertEqual(result["n"], 6)
        self.assertEqual(len(result["frontiers"]["base"]), 2)
        self.assertEqual(result["settings"], {"base": 3, "new": 3})
        points = [{"x": 1, "y": 2}, {"x": 2, "y": 1}, {"x": 3, "y": 3}]
        self.assertEqual(methods.nondominated(points, "lower", "higher"), [0, 2])
        self.assertEqual(methods.nondominated(points, "higher", "lower"), [1, 2])

    def test_sweep_missing_and_shared_norm_zero_support(self):
        data, spec = fixtures()["sweep"]
        result, _ = methods.compute(data, spec)
        self.assertEqual(result["missing_cells"], 1)
        self.assertIsNone(result["matrices"]["all"][1][1])
        self.assertEqual(result["norm"]["vmin"], -result["norm"]["vmax"])
        data = [{**row, "value": ""} for row in data]
        with self.assertRaisesRegex(ValueError, "no measured"):
            methods.compute(data, spec)
        data, spec = fixtures()["confusion"]
        data["counts"][1] = [0, 0]
        result, gaps = methods.compute(data, spec)
        self.assertEqual(result["support"]["负类"], 0)
        self.assertEqual(result["matrix"][1], [None, None])
        self.assertTrue(gaps)

    def test_every_mode_rejects_bad_or_inapplicable_inputs(self):
        invalid = {
            "benchmarks": lambda data, spec: data + [data[0]],
            "ablation": lambda data, spec: data + [data[0]],
            "curves": lambda data, spec: data + [data[0]],
            "scaling": lambda data, spec: data[:3],
            "pareto": lambda data, spec: data + [data[0]],
            "sweep": lambda data, spec: [{**data[0], "value": "nan"}],
            "confusion": lambda data, spec: {"classes": data["classes"], "counts": [[-1, 2], [3, 4]]},
            "distribution": lambda data, spec: [{**data[0], "value": "inf"}],
            "diagram": lambda data, spec: {**data, "edges": [*data["edges"], {"from": "method", "to": "data"}]},
            "scatter": lambda data, spec: [{"x": "1", "y": "nan"}],
        }
        for kind, (data, spec) in fixtures().items():
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                methods.compute(invalid[kind](data, spec), spec)
        data, spec = fixtures()["ablation"]
        with self.assertRaisesRegex(ValueError, "identical"):
            methods.compute(data[:-1], {**spec, "design": "paired"})


class ChartWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-charts-")
        self.root = Path(self.temp.name)
        research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic chart validation"))
        self.ws = research.Workspace(self.root, "T1")

    def tearDown(self):
        self.temp.cleanup()

    def prepare(self, kind="scatter", *, mode="required", authorized=True):
        data, spec = copy.deepcopy(fixtures()[kind])
        filename = "data.json" if isinstance(data, dict) else "data.csv"
        if isinstance(data, dict):
            research.write_json(self.root / "inputs" / filename, data)
        else:
            research.write_csv(self.root / "inputs" / filename, data, list(data[0]))
        research.write_json(self.root / "inputs/meta.json", {"title": "Synthetic source", "authors": "Software fixture", "year": "unknown", "content_level": "data", "selection_reason": "Synthetic only", "license": "Fixture", "data_label": "synthetic—not scientific results"})
        literature_workflow.register_local(self.ws, argparse.Namespace(id="D1", file="inputs/" + filename, metadata="inputs/meta.json"))
        plan = {"question": "Synthetic chart validation", "scope": "Software", "constraints": ["Synthetic only"], "success_criteria": ["Full chart outputs"], "stop_conditions": ["Invalid input"], "clarification_questions": [], "hypotheses": [], "evidence_ids": [], "source_ids": ["D1"] if authorized else [], "steps": ["Render selected chart"], "analysis_mode": mode}
        research.write_json(self.root / "inputs/plan.json", plan)
        plan_workflow.plan(self.ws, argparse.Namespace(id="P1", spec="inputs/plan.json", previous=None))
        research.write_json(self.root / "inputs/chart.json", spec)
        return argparse.Namespace(id="F1", source="D1", spec="inputs/chart.json", plan="P1")

    def test_native_files_binding_chinese_font_reopen_and_lock(self):
        args = self.prepare()
        original_compute = methods.compute
        def locked_compute(*args, **kwargs):
            self.assertTrue((self.root / ".yan-zhou-pi.lock").is_file())
            return original_compute(*args, **kwargs)
        with patch.object(methods, "compute", side_effect=locked_compute):
            first = chart_suite.chart(self.ws, args)
        self.assertEqual(Path(first["path"]), self.ws.task / "figures/F1")
        self.assertEqual(research.pending_attempts(self.root), [])
        self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())
        manifest = common.strict_json(Path(first["path"]) / "manifest.json")
        self.assertEqual(set(manifest["files"]), {"figure.png", "figure.svg", "figure.pdf"})
        self.assertEqual(manifest["width_inches"], 5.5)
        self.assertEqual(manifest["analysis"], "F1")
        self.assertEqual(manifest["data_label"], "synthetic—not scientific results")
        self.assertEqual(manifest["visual_check"], "pending")
        self.assertEqual((Path(first["path"]) / "figure.pdf").read_bytes()[:4], b"%PDF")
        self.assertIn("<svg", (Path(first["path"]) / "figure.svg").read_text(encoding="utf-8"))
        if manifest["font"]["status"] == "complete":
            self.assertTrue((Path(first["path"]) / manifest["font"]["subset"]).is_file())
        else:
            self.assertEqual(first["status"], "partial")
        receipt_sha = research.digest(Path(first["path"]) / "receipt.json")
        reopened = chart_suite.chart(self.ws, args)
        self.assertTrue(reopened["reused"])
        self.assertEqual(reopened["path"], first["path"])
        self.assertEqual(research.digest(Path(first["path"]) / "receipt.json"), receipt_sha)
        self.assertEqual(research.pending_attempts(self.root), [])
        self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())

    def test_all_ten_modes_render_real_artifacts(self):
        for kind in fixtures():
            with self.subTest(kind=kind), tempfile.TemporaryDirectory(prefix="synthetic-render-") as folder:
                old_root, old_ws = self.root, self.ws
                try:
                    self.root = Path(folder)
                    research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic chart validation"))
                    self.ws = research.Workspace(self.root, "T1")
                    result = chart_suite.chart(self.ws, self.prepare(kind))
                    manifest = common.strict_json(Path(result["path"]) / "manifest.json")
                    self.assertEqual(manifest["kind"], kind)
                    self.assertTrue(all((Path(result["path"]) / name).stat().st_size > 0 for name in manifest["files"]))
                    expected_directions = {name: value["direction"] for name, value in fixtures()[kind][1].items() if name in ("metric", "x", "y")}
                    self.assertEqual(manifest["orientation"], expected_directions)
                    if kind in ("scaling", "sweep"):
                        self.assertFalse(any("overlapping text" in issue or "off the canvas" in issue for issue in manifest["audit"]["issues"]), manifest["audit"]["issues"])
                finally:
                    self.root, self.ws = old_root, old_ws

    def test_scaling_math_font_atomic_commit_and_reopen(self):
        args = self.prepare("scaling")
        first = chart_suite.chart(self.ws, args)
        self.assertEqual(first["status"], "complete")
        self.assertEqual(Path(first["path"]), self.ws.task / "figures/F1")
        self.assertEqual(research.pending_attempts(self.root), [])
        self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())
        manifest = common.strict_json(Path(first["path"]) / "manifest.json")
        self.assertEqual(manifest["audit"], {"status": "pass", "issues": []})
        self.assertEqual(manifest["font"]["status"], "complete")
        before = {path.name: research.digest(path) for path in Path(first["path"]).iterdir() if path.is_file()}
        self.assertIn("chart-font.ttf", before)
        reopened = chart_suite.chart(self.ws, args)
        self.assertTrue(reopened["reused"])
        self.assertEqual(reopened["status"], "complete")
        self.assertEqual(reopened["path"], first["path"])
        self.assertEqual({path.name: research.digest(path) for path in Path(first["path"]).iterdir() if path.is_file()}, before)
        self.assertEqual(research.pending_attempts(self.root), [])
        self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())

    def test_warnings_are_partial_and_cannot_be_silent_pass(self):
        args = self.prepare()
        actual = chart_suite.draw
        def warned_draw(*args):
            warnings.warn("Synthetic renderer warning", UserWarning)
            return actual(*args)
        with patch.object(chart_suite, "draw", side_effect=warned_draw):
            result = chart_suite.chart(self.ws, args)
        manifest = common.strict_json(Path(result["path"]) / "manifest.json")
        self.assertEqual(result["status"], "partial")
        self.assertEqual(manifest["audit"]["status"], "warning")
        self.assertIn("Synthetic renderer warning", manifest["audit"]["issues"])

    def test_materials_only_source_scope_and_failure_history(self):
        args = self.prepare(mode="materials_only")
        with self.assertRaisesRegex(ValueError, "materials_only"):
            chart_suite.chart(self.ws, args)
        self.assertFalse((self.ws.task / "analysis/F1").exists())
        with tempfile.TemporaryDirectory(prefix="synthetic-scope-") as folder:
            self.root = Path(folder)
            research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic chart validation"))
            self.ws = research.Workspace(self.root, "T1")
            args = self.prepare(authorized=False)
            with self.assertRaisesRegex(ValueError, "not authorized"):
                chart_suite.chart(self.ws, args)
            self.assertTrue(list((self.ws.task / "analysis").glob(".failed-F1-*/failure.json")))

    def test_diagram_provenance_is_not_faked(self):
        args = self.prepare("diagram")
        data = common.strict_json(self.root / "inputs/data.json")
        data["nodes"][1]["provenance"] = "established"
        with self.assertRaisesRegex(ValueError, "verified"):
            chart_suite.provenance(self.ws, data, common.strict_json(self.ws.task / "plans/P1/plan.json"))
        data["nodes"][1]["provenance"] = "hypothesis"
        data["nodes"][1]["source_id"] = "D9"
        with self.assertRaisesRegex(ValueError, "authorized"):
            chart_suite.provenance(self.ws, data, common.strict_json(self.ws.task / "plans/P1/plan.json"))


if __name__ == "__main__":
    unittest.main()
