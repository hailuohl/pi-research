"""Synthetic plan boundaries only; these fixtures are not real research evidence."""
import argparse
import json
from pathlib import Path
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import alignment_common as common
import plan_workflow
import research


class PlanTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-plan-")
        self.root = Path(self.temp.name)
        research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic question"))
        self.ws = research.Workspace(self.root, "T1")

    def tearDown(self):
        self.temp.cleanup()

    def spec(self, **updates):
        return {"question": "Synthetic question", "scope": "Synthetic software validation only", "constraints": ["No real research data"],
                "success_criteria": ["Values retain provenance"], "stop_conditions": ["Invalid source"], "clarification_questions": [],
                "hypotheses": [], "evidence_ids": [], "source_ids": [], "steps": ["Read selected materials"], "analysis_mode": "materials_only", **updates}

    def run_plan(self, name="P1", previous=None, **updates):
        path = self.root / "inputs" / (name + ".json")
        research.write_json(path, self.spec(**updates))
        return plan_workflow.plan(self.ws, argparse.Namespace(id=name, spec="inputs/" + path.name, previous=previous))

    def test_proposal_reopen_and_preserved_chain(self):
        first = self.run_plan()
        self.assertEqual(first["status"], "partial")
        original = (Path(first["path"]) / "plan.json").read_bytes()
        self.assertTrue(self.run_plan()["reused"])
        second = self.run_plan("P2", previous="P1", scope="Revised software validation scope")
        result = common.strict_json(Path(second["path"]) / "plan.json")
        self.assertEqual(result["history"], [{"plan_id": "P1", "sha256": research.digest(Path(first["path"]) / "plan.json")}])
        self.assertIn("pending", result["scientific_approval"])
        self.assertEqual((Path(first["path"]) / "plan.json").read_bytes(), original)

    def test_changed_same_id_requires_version_and_failure_is_retained(self):
        self.run_plan()
        with self.assertRaisesRegex(ValueError, "changed|different|digest"):
            self.run_plan(scope="Changed")
        self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())
        research.write_json(self.root / "inputs/P1.json", self.spec())
        with self.assertRaisesRegex(ValueError, "preserve"):
            self.run_plan("P2", previous="P1", question="Different question")
        self.assertTrue(list((self.ws.task / "plans").glob(".failed-P2-*/failure.json")))

    def test_no_fake_confirmation_or_established_knowledge(self):
        with self.assertRaisesRegex(ValueError, "confirmation"):
            plan_workflow.validate(self.spec(status="confirmed"))
        with self.assertRaisesRegex(ValueError, "Unresolved"):
            self.run_plan(status="ready")
        self.assertFalse((self.ws.task / "plans/P1").exists())
        with self.assertRaisesRegex(ValueError, "outside"):
            plan_workflow.validate(self.spec(hypotheses=[{"statement": "Unsupported", "evidence_ids": ["E9"]}]))

    def test_analysis_boundary_and_experiment_design(self):
        self.run_plan()
        with self.assertRaisesRegex(ValueError, "materials_only"):
            common.require_analysis_scope(self.ws, "P1")
        design = {"controls": ["Same dataset"], "changed_factors": ["Method"], "data_split": "Held-out fixture",
                  "primary_metric": {"name": "value", "direction": "lower", "unit": "dimensionless"}, "guardrails": ["No leakage"],
                  "repetitions": {"count": 3, "rationale": "Synthetic repetitions"}, "inconclusive_criteria": ["CI spans zero"]}
        second = self.run_plan("P2", analysis_mode="required", experiment_design=design)
        self.assertEqual(common.strict_json(Path(second["path"]) / "plan.json")["experiment_design"], design)
        with self.assertRaisesRegex(ValueError, "incompatible"):
            plan_workflow.validate(self.spec(experiment_design=design))

    def test_missing_sources_cross_task_and_strict_spec(self):
        with self.assertRaises((ValueError, FileNotFoundError)):
            self.run_plan(source_ids=["D9"])
        self.run_plan()
        research.init(argparse.Namespace(workspace=str(self.root), task="T2", question="Synthetic question"))
        other = research.Workspace(self.root, "T2")
        with self.assertRaises((ValueError, FileNotFoundError)):
            plan_workflow.plan(other, argparse.Namespace(id="P2", spec="inputs/P1.json", previous="P1"))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            common.strict_json('{"question":"a","question":"b"}')


if __name__ == "__main__":
    unittest.main()
