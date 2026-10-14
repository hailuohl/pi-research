"""Synthetic bounded revisions: bytes, source scope, history and two-stage failure."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import alignment_common as common
import document_workflow
import research
import revise_paper


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


class RevisionWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-bounded-revision-")
        self.root = Path(self.temp.name) / "workspace"
        research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic revision fixture only"))
        self.ws = research.Workspace(self.root, "T1")
        self.body = "\ufeff甲😀 same. same.\r\nKeep all other bytes.\r\n".encode()
        self.context = b'{\r\n "title": "Old title", "selected_sources": [], "note": "fixed"\r\n}\r\n'
        def create(out):
            (out / "draft-source.md").write_bytes(self.body)
            (out / "paper_context.json").write_bytes(self.context)
            research.write_json(out / "citation-map.json", {"citations": [], "evidence": [], "claims": [], "values": [], "figures": []})
            return {"status": "complete"}
        self.paper = Path(research.execute(self.ws, "manuscript", "V1", {}, [], [], create)["path"])
        self.spec = {"schema": "yan-zhou-revision-2", "baseline_receipt_sha256": research.digest(self.paper / "receipt.json"),
            "body": {"baseline_sha256": sha(self.body), "edits": [{"start": self.body.decode().index("same", 10), "old": "same", "new": "changed"}]},
            "context": {"baseline_sha256": sha(self.context), "edits": [{"start": self.context.decode().index("Old title"), "old": "Old title", "new": "New title"}]}}
        self.specpath = self.root / "inputs/revision.json"
        self.save_spec()

    def tearDown(self):
        self.temp.cleanup()

    def save_spec(self):
        self.specpath.write_text(json.dumps(self.spec, ensure_ascii=False), encoding="utf-8")

    def args(self, **kw):
        return argparse.Namespace(**{"baseline_kind": "manuscript", "baseline": "V1", "id": "V2", "spec": "inputs/revision.json", "pandoc": sys.executable, **kw})

    def run_revision(self, **kw):
        tree = {"pandoc-api-version": [1, 23, 1], "meta": {}, "blocks": [{"t": "Para", "c": [{"t": "Str", "c": "Synthetic"}]}]}
        with patch.object(revise_paper.ast, "parse_markdown", return_value=tree):
            return revise_paper.revise_paper(self.ws, self.args(**kw))

    def test_exact_title_body_bytes_and_reopen(self):
        old = {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        result = self.run_revision()
        target = Path(result["path"])
        self.assertEqual((target / "draft-source.md").read_bytes(), self.body.replace(b"same.\r\n", b"changed.\r\n"))
        self.assertEqual((target / "paper_context.json").read_bytes(), self.context.replace(b"Old title", b"New title"))
        report = common.strict_json(target / "scope-report.json")
        self.assertEqual(report["scope_check"], "pass")
        self.assertEqual(report["visual_check"], "not_run")
        self.assertFalse((target / "manuscript.pdf").exists())
        self.assertEqual(common.strict_json(target / "export.json")["exported"], [])
        self.assertTrue(all(p.read_bytes() == raw for p, raw in old.items()))
        snapshot = {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        self.assertTrue(self.run_revision()["reused"])
        self.assertEqual(snapshot, {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()})

    def test_context_only_and_body_only(self):
        for field in ("body", "context"):
            spec = copy.deepcopy(self.spec); spec[field]["edits"] = []
            before = self.body if field == "body" else self.context
            result = revise_paper.checked_revision(self.body, self.context, spec, self.spec["baseline_receipt_sha256"])
            self.assertEqual(result[0 if field == "body" else 1], before)

    def test_source_expansion_unknown_context_and_duplicate_key_rejected(self):
        cases = [("[]", '["S2"]', "source scope"), ('"fixed"', '"changed"', "outside bounded"), ('"fixed"', '"fixed", "title":"hidden"', "Duplicate JSON")]
        for old, new, expected in cases:
            spec = copy.deepcopy(self.spec)
            spec["context"]["edits"] = [{"start": self.context.decode().index(old), "old": old, "new": new}]
            with self.subTest(case=expected), self.assertRaisesRegex(ValueError, expected):
                revise_paper.checked_revision(self.body, self.context, spec, self.spec["baseline_receipt_sha256"])

    def test_wrong_baseline_overlap_extra_fields_and_noop_rejected(self):
        for modify in (lambda s: s.update(baseline_receipt_sha256="0" * 64), lambda s: s["body"]["edits"].append(s["body"]["edits"][0]), lambda s: s.update(scientific_check="pass"), lambda s: (s["body"].update(edits=[]), s["context"].update(edits=[]))):
            spec = copy.deepcopy(self.spec); modify(spec)
            with self.assertRaises(ValueError): revise_paper.checked_revision(self.body, self.context, spec, self.spec["baseline_receipt_sha256"])

    def test_formatted_binding_and_format_failure_retain_both_sources(self):
        def create(out):
            for name in ("paper_context.json", "citation-map.json"):
                (out / name).write_bytes((self.paper / name).read_bytes())
            research.write_json(out / "layout-manifest.json", {"source_paper_id": "V1", "source_receipt_sha256": research.digest(self.paper / "receipt.json")})
            return {"status": "complete"}
        formatted = Path(research.execute(self.ws, "formatted", "F1", {"source_paper_id": "V1"}, [self.paper / "receipt.json"], [self.paper], create)["path"])
        result = self.run_revision(baseline_kind="formatted", baseline="F1")
        revised = Path(result["path"])
        original = {p: p.read_bytes() for folder in (self.paper, formatted, revised) for p in folder.rglob("*") if p.is_file()}
        args = argparse.Namespace(id="F2", paper="V2", context=None, body=None, template=None, pandoc=sys.executable, xelatex=sys.executable)
        with patch.object(document_workflow, "export_document", side_effect=ValueError("synthetic export failure")), self.assertRaisesRegex(ValueError, "synthetic export failure"):
            document_workflow.document_workflow(self.ws, args)
        self.assertTrue(all(p.read_bytes() == raw for p, raw in original.items()))
        self.assertFalse((self.ws.task / "formatted/F2").exists())
        self.assertEqual(len(list((self.ws.task / "formatted").glob(".failed-F2-*/failure.json"))), 1)
        self.assertTrue(self.run_revision(baseline_kind="formatted", baseline="F1")["reused"])

    def test_lock_and_pending_are_not_removed(self):
        lock = self.root / ".yan-zhou-pi.lock"; lock.write_text("synthetic owner")
        with self.assertRaises(FileExistsError): self.run_revision()
        self.assertEqual(lock.read_text(), "synthetic owner")
        lock.unlink()
        pending = self.ws.task / "manuscript/.pending-existing"; pending.mkdir()
        with self.assertRaisesRegex(ValueError, "Unresolved pending"): self.run_revision()
        self.assertTrue(pending.is_dir())


if __name__ == "__main__":
    unittest.main()
