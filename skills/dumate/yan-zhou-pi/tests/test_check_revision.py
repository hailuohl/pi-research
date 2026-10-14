"""Synthetic manuscripts only: explicit edit scope, byte retention and history."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
try:
    import check_revision
finally:
    sys.path.pop(0)
research = check_revision.research


class RevisionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path.cwd(), prefix="synthetic-revision-")
        self.root = Path(self.temp.name) / "workspace"
        self.call_research("init", "--question", "Synthetic revision software validation only")
        self.input("article.txt", b"Synthetic source, no scientific evidence.")
        self.input("source.json", {"title": "Synthetic source", "authors": "Software fixture", "year": "unknown",
                                   "content_level": "full_text", "selection_reason": "Explicit software fixture",
                                   "license": "synthetic fixture", "data_label": "synthetic"})
        self.call_research("register", "--id", "S1", "--file", "inputs/article.txt", "--metadata", "inputs/source.json")
        self.context = {"title": "Synthetic revision", "selected_sources": ["S1"]}
        self.input("context.json", self.context)

    def tearDown(self):
        self.temp.cleanup()

    def input(self, name, value):
        data = json.dumps(value, ensure_ascii=False).encode("utf-8") if isinstance(value, dict) else value
        (self.root / "inputs" / name).write_bytes(data)
        return "inputs/" + name

    def call_research(self, *args):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            code = research.main(["--workspace", str(self.root), "--task", "T1", *args])
        self.assertEqual(code, 0, stderr.getvalue())
        return json.loads(stdout.getvalue())

    def paper(self, name, body, context="inputs/context.json"):
        path = self.input(name + ".md", body)
        with patch.object(research, "export_documents", return_value=([], ["Synthetic test omits exports"])):
            result = self.call_research("manuscript", "--id", name, "--context", context, "--body", path)
        return Path(result["path"])

    def pair(self, before=b"Repeated. Repeated. [@S1]\n", after=b"Repeated. Changed. [@S1]\n"):
        self.baseline = self.paper("V1", before)
        self.newpaper = self.paper("V2", after)
        self.spec = {"baseline_sha256": hashlib.sha256(before).hexdigest(),
                     "edits": [{"start": 10, "old": "Repeated", "new": "Changed"}]}
        self.input("edits.json", self.spec)

    def check(self, fail=False, **options):
        args = {"workspace": str(self.root), "task": "T1", "baseline": "V1", "paper": "V2", "id": "R1", "spec": "inputs/edits.json"}
        args.update(options)
        argv = [item for key, value in args.items() for item in ("--" + key, value)]
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            code = check_revision.main(argv)
        self.assertEqual(code, 1 if fail else 0, stderr.getvalue())
        if fail:
            self.assertEqual(stdout.getvalue(), "")
        return json.loads(stderr.getvalue() if fail else stdout.getvalue())

    def test_precise_repeated_phrase_reopen_and_all_existing_files_preserved(self):
        self.pair()
        before = {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        result = self.check()
        folder = Path(result["path"])
        report = research.read_json(folder / "revision-check.json")
        self.assertEqual(report["edits"][0], {"start": 10, "end": 18, "old": "Repeated", "new": "Changed", "old_match_count": 2})
        self.assertEqual(report["scope_check"], "pass")
        self.assertEqual(report["scientific_check"], "pending")
        self.assertEqual(report["visual_check"], "pending")
        self.assertEqual(report["independent_review"], "not_performed")
        self.assertEqual((folder / "edits.json").read_bytes(), before[self.root / "inputs/edits.json"])
        self.assertIn(b"+Repeated. Changed.", (folder / "diff.txt").read_bytes())
        self.assertEqual({p.name for p in folder.iterdir()}, {"revision-check.json", "edits.json", "diff.txt", "receipt.json"})
        all_bytes = {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        self.assertTrue(self.check()["reused"])
        self.assertEqual(all_bytes, {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()})
        self.assertTrue(all(p.read_bytes() == data for p, data in before.items()))
        receipt = research.read_json(folder / "receipt.json")
        self.assertEqual(receipt["parameters"]["check_revision_sha256"], research.digest(SCRIPTS / "check_revision.py"))

    def test_unicode_bom_crlf_unsorted_edits_and_deletion(self):
        old = "\ufeff甲😀X\r\nKeep. Remove. [@S1]\r\n".encode("utf-8")
        new = "\ufeff甲😀Y\r\nKeep.  [@S1]\r\n".encode("utf-8")
        self.pair(old, new)
        text = old.decode("utf-8")
        self.spec["edits"] = [{"start": text.index("Remove."), "old": "Remove.", "new": ""}, {"start": 3, "old": "X", "new": "Y"}]
        self.input("edits.json", self.spec)
        folder = Path(self.check()["path"])
        self.assertEqual((self.baseline / "draft-source.md").read_bytes(), old)
        self.assertEqual((self.newpaper / "draft-source.md").read_bytes(), new)
        self.assertIn(b"\r\n", (folder / "diff.txt").read_bytes())

    def test_bad_baseline_ranges_overlap_noops_and_schema_retain_failure(self):
        self.pair()
        cases = [({**self.spec, "baseline_sha256": "0" * 64}, "baseline_sha256"),
                 ({**self.spec, "edits": []}, "nonempty"),
                 ({**self.spec, "edits": [{"start": 0, "old": "Wrong", "new": "New"}]}, "does not match"),
                 ({**self.spec, "edits": [{"start": 1000, "old": "Repeated", "new": "New"}]}, "does not match"),
                 ({**self.spec, "edits": [{"start": True, "old": "Repeated", "new": "New"}]}, "integer"),
                 ({**self.spec, "edits": [{"start": 0, "old": "", "new": "New"}]}, "nonempty"),
                 ({**self.spec, "edits": [{"start": 0, "old": "Repeated", "new": "Repeated"}]}, "different"),
                 ({**self.spec, "edits": [{"start": 0, "old": "Repeated", "new": "New"}, {"start": 0, "old": "Repeat", "new": "X"}]}, "overlap"),
                 ({**self.spec, "scientific_check": "pass"}, "only baseline"),
                 ({**self.spec, "edits": [{"start": 0, "old": "Repeated", "new": "New", "reason": "extra"}]}, "only start")]
        for i, (spec, message) in enumerate(cases):
            with self.subTest(case=i):
                self.input("edits.json", spec)
                self.assertIn(message, self.check(fail=True, id="Bad" + str(i))["error"])
                self.assertFalse((self.root / "tasks/T1/revisions" / ("Bad" + str(i))).exists())
        failures = list((self.root / "tasks/T1/revisions").glob(".failed-*/failure.json"))
        self.assertEqual(len(failures), len(cases))
        self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())
        with self.assertRaisesRegex(ValueError, "no net"):
            check_revision.checked_edits(b"abc", {"baseline_sha256": hashlib.sha256(b"abc").hexdigest(),
                                                  "edits": [{"start": 0, "old": "ab", "new": "a"}, {"start": 2, "old": "c", "new": "bc"}]})

    def test_extra_change_and_context_expansion_rejected(self):
        self.pair(after=b"Repeated. Changed. Extra prose. [@S1]\n")
        self.assertIn("extra changes", self.check(fail=True)["error"])
        self.call_research("register", "--id", "S2", "--file", "inputs/article.txt", "--metadata", "inputs/source.json")
        expanded = self.input("expanded.json", {**self.context, "selected_sources": ["S1", "S2"]})
        self.paper("V3", b"Repeated. Changed. [@S1]\n", expanded)
        self.assertIn("context changed", self.check(fail=True, paper="V3", id="R2")["error"])

    def test_cross_task_formatted_and_old_source_mutation_rejected(self):
        self.pair()
        with self.assertRaisesRegex(ValueError, "IDs"):
            check_revision.check_revision(research.Workspace(self.root, "T1"), type("Args", (), {"baseline": "../T2/V1"})())
        research.init(type("Args", (), {"workspace": str(self.root), "task": "T2", "question": "Synthetic revision software validation only"})())
        copied = self.root / "tasks/T2/manuscript/V1"
        shutil.copytree(self.baseline, copied)
        self.assertIn("different task", self.check(fail=True, task="T2")["error"])
        formatted = self.root / "tasks/T1/formatted/F1"
        shutil.copytree(self.baseline, formatted)
        self.assertIn("receipt.json", self.check(fail=True, baseline="F1")["error"])
        (self.baseline / "draft-source.md").write_bytes(b"tampered old draft")
        self.assertIn("digest changed", self.check(fail=True)["error"])

    def test_pending_lock_and_changed_spec_block_reuse_without_writes(self):
        self.pair()
        folder = Path(self.check()["path"])
        before = {p: p.read_bytes() for p in folder.iterdir()}
        pending = self.root / "tasks/T1/revisions/.pending-Unknown-fixture"
        pending.mkdir()
        self.assertIn("Unresolved pending", self.check(fail=True)["error"])
        pending.rmdir()
        lock = self.root / ".yan-zhou-pi.lock"
        lock.write_bytes(b"synthetic writer")
        self.check(fail=True)
        self.assertEqual(lock.read_bytes(), b"synthetic writer")
        lock.unlink()
        self.input("edits.json", {**self.spec, "baseline_sha256": "0" * 64})
        self.assertIn("digest changed", self.check(fail=True)["error"])
        self.assertEqual(before, {p: p.read_bytes() for p in folder.iterdir()})

    def test_changed_checker_code_parameter_blocks_existing_id(self):
        self.pair()
        self.check()
        original_digest = research.digest
        with patch.object(research, "digest", side_effect=lambda path: "0" * 64 if path == SCRIPTS / "check_revision.py" else original_digest(path)):
            self.assertIn("different inputs/parameters/code", self.check(fail=True)["error"])

    def test_operation_rechecks_spec_after_preparation(self):
        self.pair()
        original_execute = research.execute
        def change_before_lock(*args):
            self.input("edits.json", {**self.spec, "baseline_sha256": "0" * 64})
            return original_execute(*args)
        with patch.object(research, "execute", side_effect=change_before_lock):
            self.assertIn("inputs changed", self.check(fail=True)["error"])
        self.assertEqual(len(list((self.root / "tasks/T1/revisions").glob(".failed-*/failure.json"))), 1)


if __name__ == "__main__":
    unittest.main()
