"""Isolated review regressions; synthetic documents are not scientific approval evidence."""
import argparse
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import alignment_common as common
import format_paper
import research
import review_workflow


@unittest.skipUnless(all(importlib.util.find_spec(name) for name in ("docx", "reportlab")),
                     "Real frozen DOCX/PDF exporters are required")
class ReviewManifestTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-review-manifest-")
        self.root = Path(self.temp.name) / "workspace"
        research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic review compatibility only"))
        self.ws = research.Workspace(self.root, "T1")
        research.write_json(self.root / "inputs/context.json", {"title": "Synthetic compatibility", "selected_sources": []})
        (self.root / "inputs/body.md").write_text("## Method\n\nSynthetic software fixture only.", encoding="utf-8")
        self.source = Path(research.manuscript(self.ws, argparse.Namespace(id="V1", context="inputs/context.json", body="inputs/body.md"))["path"])
        # Deterministically exercise the frozen formatter's retained font warning.
        with patch.object(format_paper, "NOTO_FONT", Path(self.temp.name) / "missing-font.ttf"):
            self.paper = Path(format_paper.format_paper(self.ws, argparse.Namespace(id="F1", paper="V1"))["path"])
        self.specpath = self.root / "inputs/checks.json"
        research.write_json(self.specpath, {})

    def tearDown(self):
        self.temp.cleanup()

    def args(self, **changes):
        return argparse.Namespace(**{"id": "R1", "paper": "F1", "kind": "formatted", "spec": "inputs/checks.json", **changes})

    def snapshot(self, folder):
        return {path: path.read_bytes() for path in folder.rglob("*") if path.is_file()}

    def checks_pass(self, paper=None):
        paper = paper or self.paper
        required = {"scientific": ["manuscript.md", "paper_context.json"], "figure_visual": ["manuscript.md"], "pdf_visual": ["manuscript.pdf"]}
        research.write_json(self.specpath, {key: {"status": "pass", "notes": "Synthetic attestation fixture only", "actor": "fixture-self-check",
            "review_mode": "self_check", "view_evidence": "Synthetic view attestation only",
            "reviewed_sha256": {common.relative(self.ws, paper / name): research.digest(paper / name) for name in names}}
            for key, names in required.items()})

    def replace_manifest(self, change):
        path = self.paper / "layout-manifest.json"
        manifest = common.strict_json(path)
        change(manifest)
        research.write_json(path, manifest)
        receiptpath = self.paper / "receipt.json"
        receipt = common.strict_json(receiptpath)
        receipt["outputs"][common.relative(self.ws, path)] = research.digest(path)
        research.write_json(receiptpath, receipt)

    def test_real_frozen_manifest_without_export_and_history_reopen(self):
        self.assertFalse((self.paper / "export.json").exists())
        old = {**self.snapshot(self.source), **self.snapshot(self.paper)}
        result = review_workflow.record(self.ws, self.args())
        report = common.strict_json(Path(result["path"]) / "review.json")
        manifest = self.paper / "layout-manifest.json"
        self.assertEqual(report["generation_manifest"], {"path": common.relative(self.ws, manifest), "sha256": research.digest(manifest), "kind": "legacy_layout_1.0.2"})
        receipt = common.strict_json(Path(result["path"]) / "receipt.json")
        self.assertEqual(receipt["inputs"][common.relative(self.ws, manifest)], research.digest(manifest))
        self.assertEqual(receipt["inputs"][common.relative(self.ws, self.source / "receipt.json")], research.digest(self.source / "receipt.json"))
        self.assertEqual(report["checks"]["scientific"]["status"], "not_run")
        self.assertEqual(report["checks"]["independent_review"]["status"], "not_performed")
        self.assertEqual(report["status"], "partial")
        self.assertTrue(all(path.read_bytes() == raw for path, raw in old.items()))
        snapshot = self.snapshot(self.root)
        self.assertTrue(review_workflow.record(self.ws, self.args())["reused"])
        self.assertEqual(snapshot, self.snapshot(self.root))

    def test_undeclared_export_regression_rejected(self):
        # Before the fix this artificial, unreceipted export is accepted and a review is committed.
        research.write_json(self.paper / "export.json", {"exported": ["manuscript.md", "manuscript.docx", "manuscript.pdf"], "gaps": []})
        with self.assertRaisesRegex(ValueError, "not declared"):
            review_workflow.record(self.ws, self.args())
        self.assertFalse((self.ws.task / "reviews/R1").exists())

    def test_legacy_font_warning_is_preserved_even_when_self_checks_pass(self):
        self.checks_pass()
        report = common.strict_json(Path(review_workflow.record(self.ws, self.args())["path"]) / "review.json")
        self.assertEqual(report["generation_gaps"], common.strict_json(self.paper / "layout-manifest.json")["layout_gaps"])
        self.assertTrue(report["generation_gaps"])
        self.assertEqual(report["status"], "partial")

    def test_current_receipted_export_keeps_checks_and_manifest_binding(self):
        def create(out):
            for name in ("manuscript.md", "manuscript.docx", "manuscript.pdf", "paper_context.json"):
                (out / name).write_bytes((self.paper / name).read_bytes())
            research.write_json(out / "export.json", {"exported": ["manuscript.md", "manuscript.docx", "manuscript.pdf"], "gaps": []})
            return {"status": "complete"}
        current = Path(common.step(self.ws, "formatted", "F2", {}, [self.paper / "receipt.json"], [self.paper], create, entry=review_workflow.__file__)["path"])
        self.checks_pass(current)
        result = review_workflow.record(self.ws, self.args(paper="F2"))
        report = common.strict_json(Path(result["path"]) / "review.json")
        self.assertEqual(report["status"], "complete")
        self.assertEqual(report["generation_manifest"], {"path": common.relative(self.ws, current / "export.json"), "sha256": research.digest(current / "export.json"), "kind": "export"})
        self.assertEqual(report["checks"]["independent_review"]["status"], "not_performed")

    def test_unknown_incomplete_and_rebound_bad_legacy_metadata_rejected(self):
        original = self.snapshot(self.paper)
        changes = (lambda m: m.update(version="unknown"), lambda m: m.pop("layout_gaps"),
                   lambda m: m["files"].pop("manuscript.pdf"), lambda m: m["files"]["manuscript.pdf"].update(sha256="0" * 64),
                   lambda m: m["files"]["manuscript.docx"].update(size=1), lambda m: m.update(formatter_sha256="0" * 64),
                   lambda m: m.update(source_receipt_sha256="0" * 64))
        for change in changes:
            with self.subTest(change=change):
                for path, raw in original.items():
                    path.write_bytes(raw)
                self.replace_manifest(change)
                with self.assertRaises(ValueError):
                    review_workflow.record(self.ws, self.args())
                self.assertFalse((self.ws.task / "reviews/R1").exists())

    def test_changed_legacy_manifest_digest_rejected_by_receipt(self):
        (self.paper / "layout-manifest.json").write_text("{}", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "digest changed"):
            review_workflow.record(self.ws, self.args())


if __name__ == "__main__":
    unittest.main()
