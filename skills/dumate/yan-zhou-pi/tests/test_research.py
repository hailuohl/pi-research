"""Small synthetic fixtures only; not scientific research or platform evidence."""
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("research", Path(__file__).resolve().parents[1] / "scripts" / "research.py")
research = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(research)


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path.cwd(), prefix="synthetic-check-")
        self.root = Path(self.temp.name) / "workspace"
        self.call("init", "--question", "Synthetic software validation only")

    def tearDown(self):
        self.temp.cleanup()

    def call(self, *argv, fail=False, task="T1"):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            code = research.main(["--workspace", str(self.root), "--task", task, *argv])
        self.assertEqual(code, 1 if fail else 0, stderr.getvalue())
        return json.loads(stderr.getvalue().splitlines()[-1] if fail else stdout.getvalue().splitlines()[-1])

    def input(self, name, data):
        path = self.root / "inputs" / name
        path.write_text(json.dumps(data, ensure_ascii=False) if isinstance(data, (dict, list)) else data, encoding="utf-8")
        return "inputs/" + name

    def source(self, sid, filename, content, level="full_text"):
        self.input(filename, content)
        metadata = self.input(sid + ".json", {"title": "Synthetic source " + sid, "authors": "Software fixture", "year": "unknown", "content_level": level,
                                                "selection_reason": "Explicit fixture for this software test", "license": "synthetic fixture", "data_label": "synthetic"})
        self.call("register", "--id", sid, "--file", "inputs/" + filename, "--metadata", metadata)

    def analysis(self):
        self.source("D1", "data.csv", "group,value\nA,1\nA,3\nB,5\nB,7\nB,\n", "data")
        return self.call("analyze", "--id", "A1", "--source", "D1", "--column", "value", "--group", "group", "--unit", "dimensionless", "--missing", "exclude")

    def literature(self):
        self.source("S1", "article.txt", "Synthetic method uses repeated observations.\n\nThis is not scientific evidence for a real paper.")
        self.call("extract", "--id", "X1", "--source", "S1")
        spec = self.input("quote.json", {"anchor": "p0-para1", "quote": "repeated observations", "limitations": "Software fixture only"})
        self.call("evidence", "--id", "E1", "--extraction", "X1", "--spec", spec)
        self.call("claim", "--id", "C1", "--spec", self.input("claim.json", {"text": "Synthetic fixture describes repeated observations", "evidence_ids": ["E1"]}))

    def paper_inputs(self, extra=None):
        context = {"title": "Synthetic validation document", "selected_sources": ["S1", "D1"], "evidence_ids": ["E1"], "claim_ids": ["C1"], "analysis_ids": ["A1"], "figure_ids": []}
        if extra:
            context.update(extra)
        return self.input("context.json", context), self.input("draft.md", "## Method\n\nThis software fixture uses repeated observations [@S1] [claim:C1].\n\n## Result\n\nGroup A mean is [value:A1:groups/A/mean]. This is synthetic data, not a scientific experiment.")

    def test_known_statistics_missing_and_reopen(self):
        original = self.root / "inputs" / "data.csv"
        first = self.analysis()
        before = original.read_bytes()
        result = research.read_json(Path(first["path"]) / "result.json")
        self.assertEqual(result["groups"]["A"]["mean"], 2)
        self.assertEqual(result["groups"]["B"]["mean"], 6)
        self.assertEqual(result["rows_valid"], 4)
        self.assertEqual(result["excluded"], [{"row": 6, "reason": "missing value or group"}])
        self.assertAlmostEqual(result["groups"]["A"]["sample_sd"], 2 ** 0.5)
        second = self.call("analyze", "--id", "A1", "--source", "D1", "--column", "value", "--group", "group", "--unit", "dimensionless", "--missing", "exclude")
        self.assertTrue(second["reused"])
        self.assertEqual(original.read_bytes(), before)
        self.assertTrue(all(s["digests"] == "match" for s in self.call("status")["steps"]))

    def test_illegal_paths_input_change_and_failure_retention(self):
        self.source("D1", "bad.csv", "group,value\nA,nan\n", "data")
        self.call("analyze", "--id", "A1", "--source", "D1", "--column", "value", "--unit", "unit", fail=True)
        self.assertFalse((self.root / "tasks/T1/analysis/A1").exists())
        failed = list((self.root / "tasks/T1/analysis").glob(".failed-*/failure.json"))
        self.assertEqual(len(failed), 1)
        self.assertIn("Non-finite", research.read_json(failed[0])["error"])
        self.call("register", "--id", "BAD", "--file", "../outside.csv", "--metadata", "inputs/D1.json", fail=True)
        self.input("bad.csv", "group,value\nA,2\n")
        changed = self.call("analyze", "--id", "A2", "--source", "D1", "--column", "value", "--unit", "unit", fail=True)
        self.assertIn("digest changed", changed["error"])

    def test_symlink_escape_if_available(self):
        outside = Path(self.temp.name) / "outside.txt"
        outside.write_text("must not be read", encoding="utf-8")
        link = self.root / "inputs" / "escape.txt"
        try:
            link.symlink_to(outside)
        except OSError:
            self.skipTest("OS does not grant symlink creation in this test session")
        self.input("meta.json", {})
        result = self.call("register", "--id", "S1", "--file", "inputs/escape.txt", "--metadata", "inputs/meta.json", fail=True)
        self.assertIn("escapes", result["error"])

    def test_copied_receipt_cannot_import_other_task_outputs_inputs_or_dependencies(self):
        self.source("S1", "article.txt", "Synthetic task boundary fixture")
        self.call("init", "--question", "Synthetic software validation only", task="T2")
        original = self.root / "tasks/T1/sources/S1"
        copied = self.root / "tasks/T2/sources/S1"
        shutil.copytree(original, copied)
        ws = research.Workspace(self.root, "T2")
        receipt = research.read_json(copied / "receipt.json")
        with self.assertRaisesRegex(ValueError, "different task"):
            ws.record("sources", "S1")
        receipt["task_id"] = "T2"
        research.write_json(copied / "receipt.json", receipt)
        with self.assertRaisesRegex(ValueError, "current task"):
            ws.record("sources", "S1")
        receipt["outputs"] = {key.replace("tasks/T1/", "tasks/T2/"): value for key, value in receipt["outputs"].items()}
        receipt["dependencies"] = ["tasks/T1/sources/S1/receipt.json"]
        research.write_json(copied / "receipt.json", receipt)
        with self.assertRaisesRegex(ValueError, "current task"):
            ws.record("sources", "S1")
        receipt["dependencies"] = []
        receipt["inputs"]["tasks/T1/sources/S1/source.json"] = research.digest(original / "source.json")
        research.write_json(copied / "receipt.json", receipt)
        with self.assertRaisesRegex(ValueError, "current task"):
            ws.record("sources", "S1")
        with self.assertRaisesRegex(ValueError, "current task"):
            research.execute(ws, "analysis", "CrossTask", {}, [], [original], lambda out: {})

    def test_task_and_step_directory_aliases_if_available(self):
        self.source("S1", "article.txt", "Synthetic task boundary fixture")
        self.call("init", "--question", "Synthetic software validation only", task="T2")
        link = self.root / "tasks/T2/sources"
        try:
            link.symlink_to(self.root / "tasks/T1/sources", target_is_directory=True)
        except OSError:
            self.skipTest("OS does not grant directory symlink creation; run the real junction check separately")
        self.call("extract", "--id", "CrossTask", "--source", "S1", task="T2", fail=True)
        self.call("register", "--id", "S2", "--file", "inputs/article.txt", "--metadata", "inputs/S1.json", task="T2", fail=True)
        self.assertFalse((self.root / "tasks/T1/sources/S2").exists())
        (self.root / "tasks/TAlias").symlink_to(self.root / "tasks/T1", target_is_directory=True)
        self.call("status", task="TAlias", fail=True)

    def test_interrupt_records_terminal_state_and_preserves_started_output(self):
        ws = research.Workspace(self.root, "T1")
        def operation(out):
            (out / "started.txt").write_text("incomplete output", encoding="utf-8")
            raise KeyboardInterrupt("synthetic interruption")
        with self.assertRaises(KeyboardInterrupt):
            research.execute(ws, "analysis", "Interrupted", {}, [], [], operation)
        state = self.call("status")
        self.assertEqual(state["pending_attempts"], [])
        self.assertFalse(state["writer_lock"])
        self.assertEqual(len(state["interrupted_attempts"]), 1)
        folder = self.root / state["interrupted_attempts"][0]
        self.assertEqual((folder / "started.txt").read_text(encoding="utf-8"), "incomplete output")
        self.assertEqual(research.read_json(folder / "failure.json")["status"], "interrupted")
        self.assertFalse((self.root / "tasks/T1/analysis/Interrupted").exists())
        self.assertEqual(research.execute(ws, "analysis", "NewAttempt", {}, [], [], lambda out: {})["status"], "complete")

    def test_unresolved_pending_blocks_writes_and_reuse_across_workspace(self):
        ws = research.Workspace(self.root, "T1")
        self.call("init", "--question", "Synthetic software validation only", task="T2")
        completed = research.execute(ws, "analysis", "Done", {}, [], [], lambda out: {})
        pending = self.root / "tasks/T1/analysis/.pending-Unknown-fixture"
        pending.mkdir()
        (pending / "started.txt").write_text("unknown process state", encoding="utf-8")
        self.assertEqual(self.call("status")["pending_attempts"], [str(Path("tasks/T1/analysis/.pending-Unknown-fixture"))])
        for name in ("Done", "New"):
            with self.assertRaisesRegex(ValueError, "Unresolved pending"):
                research.execute(ws, "analysis", name, {}, [], [], lambda out: {})
        self.call("init", "--question", "Synthetic software validation only", task="T3", fail=True)
        self.assertFalse((self.root / "tasks/T3").exists())
        with self.assertRaisesRegex(ValueError, "Unresolved pending"):
            research.execute(research.Workspace(self.root, "T2"), "analysis", "New", {}, [], [], lambda out: {})
        self.assertTrue((Path(completed["path"]) / "receipt.json").exists())
        self.assertEqual((pending / "started.txt").read_text(encoding="utf-8"), "unknown process state")
        self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())

    def test_cli_interruption_never_reports_success(self):
        for name, exception in (("Keyboard", KeyboardInterrupt("synthetic stop")), ("Exit", SystemExit(0))):
            with self.subTest(exception=type(exception).__name__):
                def operation(out):
                    (out / "started.txt").write_text("partial", encoding="utf-8")
                    raise exception
                def command(ws, args):
                    return research.execute(ws, "literature", name, {}, [], [], operation)
                stdout, stderr = io.StringIO(), io.StringIO()
                with patch.object(research, "search", command), contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                    code = research.main(["--workspace", str(self.root), "search", "--id", name, "--query", "synthetic"])
                self.assertEqual(code, 130)
                self.assertEqual(stdout.getvalue(), "")
                self.assertEqual(json.loads(stderr.getvalue())["status"], "interrupted")
                self.assertFalse((self.root / "tasks/T1/literature" / name).exists())

    def test_unsaved_interrupt_retains_pending_and_writer_lock(self):
        ws = research.Workspace(self.root, "T1")
        def operation(out):
            (out / "started.txt").write_text("must survive", encoding="utf-8")
            raise KeyboardInterrupt("synthetic interruption")
        with patch.object(research, "write_json", side_effect=OSError("synthetic disk error")):
            with self.assertRaises(OSError):
                research.execute(ws, "analysis", "Interrupted", {}, [], [], operation)
        state = self.call("status")
        self.assertTrue(state["writer_lock"])
        self.assertEqual(len(state["pending_attempts"]), 1)
        self.assertEqual(state["interrupted_attempts"], [])
        self.assertEqual((self.root / state["pending_attempts"][0] / "started.txt").read_text(encoding="utf-8"), "must survive")
        with self.assertRaises(FileExistsError):
            research.execute(ws, "analysis", "Retry", {}, [], [], lambda out: {})

    def test_quotes_source_scope_and_unused_reference(self):
        self.literature()
        bad = self.input("badquote.json", {"anchor": "p0-para1", "quote": "invented result"})
        self.call("evidence", "--id", "Ebad", "--extraction", "X1", "--spec", bad, fail=True)
        self.source("S2", "unused.txt", "An unrelated fixture must not enter this paper.")
        self.analysis()
        context, body = self.paper_inputs({"selected_sources": ["S1", "S2", "D1"]})
        generated = self.call("manuscript", "--id", "V1", "--context", context, "--body", body)
        markdown = (Path(generated["path"]) / "manuscript.md").read_text(encoding="utf-8")
        self.assertIn("Group A mean is 2", markdown)
        self.assertIn("Synthetic source S1", markdown)
        self.assertNotIn("Synthetic source S2", markdown)
        self.input("context.json", {"title": "Scope", "selected_sources": ["S2", "D1"], "evidence_ids": ["E1"]})
        result = self.call("manuscript", "--id", "V2", "--context", context, "--body", body, fail=True)
        self.assertIn("unselected source", result["error"])

    def test_unknown_citation_hashes_and_old_draft_preserved(self):
        self.literature(); self.analysis()
        context, body = self.paper_inputs()
        first = self.call("manuscript", "--id", "V1", "--context", context, "--body", body)
        old = (Path(first["path"]) / "manuscript.md").read_bytes()
        self.input("draft.md", "Unrelated citation [@UNSELECTED].")
        result = self.call("manuscript", "--id", "V2", "--context", context, "--body", body, fail=True)
        self.assertIn("Unknown or unselected", result["error"])
        self.assertEqual((Path(first["path"]) / "manuscript.md").read_bytes(), old)
        self.call("verify", "--id", "O1", "--paper", "V1", fail=True)
        self.assertFalse((self.root / "tasks/T1/delivery/O1").exists())

    def test_editable_pdf_and_honest_partial_delivery(self):
        self.literature(); self.analysis()
        context, body = self.paper_inputs()
        generated = self.call("manuscript", "--id", "V1", "--context", context, "--body", body)
        folder = Path(generated["path"])
        export = research.read_json(folder / "export.json")
        if importlib.util.find_spec("reportlab"):
            self.assertIn("manuscript.pdf", export["exported"])
            self.assertTrue((folder / "manuscript.pdf").read_bytes().startswith(b"%PDF-"))
            if importlib.util.find_spec("pypdf"):
                from pypdf import PdfReader
                pdf = PdfReader(folder / "manuscript.pdf")
                text = "\n".join(page.extract_text() for page in pdf.pages)
                self.assertIn("Group A mean is 2", text)
                self.assertIn("Synthetic source S1", text)
        else:
            self.assertEqual(generated["status"], "partial")
        delivery = self.call("verify", "--id", "O1", "--paper", "V1")
        manifest = research.read_json(Path(delivery["path"]) / "manifest.json")
        self.assertEqual(manifest["status"], "partial")
        self.assertEqual(manifest["checks"]["scientific"], "not_run")
        self.assertEqual(manifest["actually_cited"], ["S1"])
        self.assertFalse(any(item["path"].endswith(".csv") for item in manifest["files"]))
        self.input("checks.json", {"scientific": {"status": "pass", "notes": "Pretend review", "reviewed_sha256": {"tasks/T1/manuscript/V1/manuscript.md": "0" * 64}}})
        self.call("verify", "--id", "O2", "--paper", "V1", "--checks", "inputs/checks.json", fail=True)

    def test_crossref_metadata_dedupe_and_failed_response(self):
        payload = {"status": "ok", "message": {"items": [{"DOI": "10.fake/A", "title": ["Synthetic candidate"], "published": {"date-parts": [[2026]]}}, {"DOI": "10.fake/a", "title": ["Duplicate"]}]}}
        with patch.object(research, "urlopen", return_value=io.BytesIO(json.dumps(payload).encode())):
            first = self.call("search", "--id", "L1", "--query", "fixture")
        query = research.read_json(Path(first["path"]) / "query.json")
        self.assertEqual(query["count"], 1)
        self.assertTrue((Path(first["path"]) / "raw.json").exists())
        with patch.object(research, "urlopen", side_effect=AssertionError("completed query must not make a network call")):
            self.assertTrue(self.call("search", "--id", "L1", "--query", "fixture")["reused"])
        with patch.object(research, "urlopen", return_value=io.BytesIO(b"{}")):
            self.call("search", "--id", "L2", "--query", "fixture", fail=True)
        self.assertEqual(len(list((self.root / "tasks/T1/literature").glob(".failed-L2-*/raw.json"))), 1)

    @unittest.skipUnless(importlib.util.find_spec("matplotlib") and importlib.util.find_spec("numpy"), "Plot libraries unavailable")
    def test_figure_real_formats_provenance_and_style_math(self):
        self.analysis()
        generated = self.call("figure", "--id", "F1", "--analysis", "A1")
        folder = Path(generated["path"])
        manifest = research.read_json(folder / "manifest.json")
        self.assertEqual(manifest["data_source"], "D1")
        self.assertEqual(manifest["visual_check"], "pending")
        self.assertIn("A: n=2", manifest["caption"])
        self.assertTrue((folder / "figure.png").read_bytes().startswith(b"\x89PNG"))
        self.assertTrue((folder / "figure.pdf").read_bytes().startswith(b"%PDF-"))
        self.assertIn("<svg", (folder / "figure.svg").read_text(encoding="utf-8"))
        import figstyle
        mean, low, high = figstyle.diff_ci([3, 5], [1, 3])
        self.assertEqual(mean, 2)
        self.assertLess(low, mean); self.assertGreater(high, mean)
        self.assertEqual(figstyle._t95(11), 2.228)
        with self.assertRaises(FileExistsError):
            figstyle.save(None, str(folder / "figure"), formats=("png",))


if __name__ == "__main__":
    unittest.main()
