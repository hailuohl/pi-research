"""Synthetic CSV fixtures only; these checks are not scientific evidence."""
import contextlib
import csv
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
import format_paper
import plot_scatter
import research


class ScatterTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-scatter-")
        self.root = Path(self.temp.name) / "workspace"
        self.call_research("init", "--question", "Synthetic scatter software validation only")

    def tearDown(self):
        self.temp.cleanup()

    def call_research(self, *args, fail=False, task="T1"):
        return self.call(research.main, ["--workspace", str(self.root), "--task", task, *args], fail=fail)

    def call_scatter(self, source="D1", plot_id="Scatter1", x="x", y="y", x_unit="cm", y_unit="s", fail=False, task="T1"):
        return self.call(plot_scatter.main, [
            "--workspace", str(self.root), "--task", task, "--source", source,
            "--x", x, "--y", y, "--x-unit", x_unit, "--y-unit", y_unit, "--id", plot_id,
        ], fail=fail)

    def call(self, function, args, fail=False):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            code = function(args)
        self.assertEqual(code, 1 if fail else 0, stderr.getvalue())
        output = stderr.getvalue() if fail else stdout.getvalue()
        return json.loads(output.splitlines()[-1])

    def input(self, name, content):
        path = self.root / "inputs" / name
        path.write_text(content, encoding="utf-8")
        return "inputs/" + name

    def source(self, source_id, content, level="data", label="synthetic-software-demo"):
        filename = source_id + ".csv"
        self.input(filename, content)
        metadata_record = {
            "title": "Synthetic CSV fixture " + source_id,
            "authors": "Software fixture",
            "year": "unknown",
            "content_level": level,
            "selection_reason": "Explicit synthetic software test fixture",
            "license": "synthetic fixture",
        }
        if label is not None:
            metadata_record["data_label"] = label
        metadata = self.input(source_id + ".json", json.dumps(metadata_record))
        self.call_research("register", "--id", source_id, "--file", "inputs/" + filename, "--metadata", metadata)
        return self.root / "inputs" / filename

    @staticmethod
    def snapshot(folder):
        return {
            str(path.relative_to(folder)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in folder.rglob("*") if path.is_file()
        }

    def test_raw_pairs_real_formats_reuse_manuscript_and_article(self):
        raw_csv = "x,y,unused\n3,30,a\n-1,5,b\n3,30,c\n0,-2,d\n"
        source_file = self.source("D1", raw_csv)
        source_bytes = source_file.read_bytes()
        frozen = [
            SCRIPTS / "research.py",
            SCRIPTS / "format_paper.py",
            plot_scatter.PACKAGE / "assets" / "figstyle.py",
        ]
        frozen_hashes = {path: hashlib.sha256(path.read_bytes()).hexdigest() for path in frozen}

        import numpy as np
        from matplotlib.axes import Axes
        capture = {}
        original_scatter = Axes.scatter

        def inspect_scatter(ax, x, y, *args, **kwargs):
            collection = original_scatter(ax, x, y, *args, **kwargs)
            capture["offsets"] = collection.get_offsets().copy()
            capture["axes"] = ax
            return collection

        with patch.object(Axes, "scatter", new=inspect_scatter):
            first = self.call_scatter()
        np.testing.assert_array_equal(capture["offsets"], np.array([[3, 30], [-1, 5], [3, 30], [0, -2]]))
        self.assertEqual(capture["axes"].get_xlabel(), "x (cm)")
        self.assertEqual(capture["axes"].get_ylabel(), "y (s)")
        self.assertEqual(len(capture["axes"].lines), 0)

        analysis = Path(first["analysis_path"])
        figure = Path(first["figure_path"])
        result = research.read_json(analysis / "result.json")
        manifest = research.read_json(figure / "manifest.json")
        analysis_receipt = research.read_json(analysis / "receipt.json")
        figure_receipt = research.read_json(figure / "receipt.json")
        plotter_sha256 = research.digest(Path(plot_scatter.__file__))
        style_sha256 = research.digest(plot_scatter.PACKAGE / "assets" / "figstyle.py")
        self.assertEqual(analysis_receipt["parameters"], {
            "source": "D1", "x_column": "x", "y_column": "y", "x_unit": "cm", "y_unit": "s",
            "plotter_sha256": plotter_sha256,
        })
        self.assertEqual(figure_receipt["parameters"], {
            "kind": "scatter", "analysis": "Scatter1", "plotter_sha256": plotter_sha256,
            "style_sha256": style_sha256,
        })
        self.assertEqual(figure_receipt["dependencies"], ["tasks/T1/analysis/Scatter1/receipt.json"])
        self.assertEqual(first["analysis_id"], "Scatter1")
        self.assertEqual(first["figure_id"], "Scatter1")
        self.assertEqual(first["paper_context"], {"analysis_ids": ["Scatter1"], "figure_ids": ["Scatter1"]})
        self.assertEqual(first["markers"], {"row_count": "[value:Scatter1:row_count]", "figure": "[figure:Scatter1]"})
        self.assertEqual(result["method"], "selected raw CSV pairs; no statistical test or fit")
        self.assertEqual(result["input_sha256"], hashlib.sha256(source_bytes).hexdigest())
        self.assertEqual(result["row_count"], 4)
        self.assertEqual(result["data_label"], "synthetic-software-demo")
        self.assertEqual(set(result), {
            "source", "input_sha256", "method", "x_column", "y_column", "x_unit",
            "y_unit", "row_count", "data_label",
        })
        self.assertEqual(research.digest(analysis / "result.json"), manifest["analysis_sha256"])
        self.assertEqual(manifest["data_source"], "D1")
        self.assertEqual(manifest["data_sha256"], result["input_sha256"])
        self.assertEqual(manifest["files"], ["figure.png", "figure.svg", "figure.pdf"])
        self.assertEqual(manifest["visual_check"], "pending")
        self.assertIn("4 selected raw CSV row pairs", manifest["caption"])
        self.assertIn("Source designation: synthetic-software-demo.", manifest["caption"])
        self.assertNotIn("Synthetic data", manifest["caption"])
        self.assertNotIn("user-selected; provenance requires reading", manifest["caption"])
        self.assertIn("horizontal: x (cm); vertical: y (s)", manifest["caption"])
        self.assertIn("No fit or statistical test", manifest["caption"])
        self.assertIn("Repeated coordinates may overlap; n counts source rows", manifest["caption"])
        self.assertIn(manifest["audit"]["status"], ("pass", "warning"))
        self.assertEqual(first["status"], "partial" if manifest["audit"]["issues"] else "complete")
        self.assertEqual((figure / "figure.png").read_bytes()[:8], b"\x89PNG\r\n\x1a\n")
        self.assertIn("<svg", (figure / "figure.svg").read_text(encoding="utf-8"))
        self.assertTrue((figure / "figure.pdf").read_bytes().startswith(b"%PDF-"))
        with (analysis / "cleaned.csv").open(encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            self.assertEqual(reader.fieldnames, ["x", "y"])
            self.assertEqual(list(reader), [
                {"x": "3", "y": "30"}, {"x": "-1", "y": "5"},
                {"x": "3", "y": "30"}, {"x": "0", "y": "-2"},
            ])
        self.assertEqual(source_file.read_bytes(), source_bytes)

        old_outputs = {
            "analysis": self.snapshot(analysis),
            "figure": self.snapshot(figure),
        }
        repeated = self.call_scatter()
        self.assertEqual(repeated["reused"], {"analysis": True, "figure": True})
        self.assertEqual(old_outputs["analysis"], self.snapshot(analysis))
        self.assertEqual(old_outputs["figure"], self.snapshot(figure))

        context = self.input("paper-context.json", json.dumps({
            "title": "Synthetic scatter article",
            "selected_sources": ["D1"],
            "analysis_ids": ["Scatter1"],
            "figure_ids": ["Scatter1"],
        }))
        body = self.input("paper.md", "## Abstract\n\nSynthetic software fixture only.\n\n"
            "## Methods\n\nThe selected source has [value:Scatter1:row_count] raw pairs.\n\n"
            "## Results\n\n[figure:Scatter1]\n\n## Limitations\n\nSynthetic data only.")
        paper = self.call_research("manuscript", "--id", "V1", "--context", context, "--body", body)
        paper_dir = Path(paper["path"])
        markdown = (paper_dir / "manuscript.md").read_text(encoding="utf-8")
        self.assertIn("The selected source has 4 raw pairs.", markdown)
        self.assertIn("4 selected raw CSV row pairs", markdown)
        self.assertEqual((paper_dir / "Scatter1.png").read_bytes(), (figure / "figure.png").read_bytes())
        citation_map = research.read_json(paper_dir / "citation-map.json")
        self.assertEqual(citation_map["values"], [{"analysis": "Scatter1", "pointer": "row_count", "value": 4}])

        article = self.call(format_paper.main, [
            "--workspace", str(self.root), "--task", "T1", "--paper", "V1", "--id", "Article1",
        ])
        article_dir = Path(article["path"])
        self.assertTrue((article_dir / "manuscript.docx").is_file())
        self.assertTrue((article_dir / "manuscript.pdf").read_bytes().startswith(b"%PDF-"))
        self.assertEqual((article_dir / "Scatter1.png").read_bytes(), (figure / "figure.png").read_bytes())
        self.assertEqual(research.read_json(article_dir / "layout-manifest.json")["figures"]["Scatter1"]["caption"], manifest["caption"])
        from docx import Document
        document = Document(article_dir / "manuscript.docx")
        self.assertIn("The selected source has 4 raw pairs.", "\n".join(p.text for p in document.paragraphs))
        self.assertEqual(len(document.inline_shapes), 1)
        self.source("D2", "x,y\n1,2\n", label=None)
        no_label = self.call_scatter(source="D2", plot_id="ScatterNoLabel")
        no_label_analysis = research.read_json(Path(no_label["analysis_path"]) / "result.json")
        no_label_manifest = research.read_json(Path(no_label["figure_path"]) / "manifest.json")
        self.assertIsNone(no_label_analysis["data_label"])
        self.assertNotIn("Source designation:", no_label_manifest["caption"])
        self.assertNotIn("user-selected; provenance requires reading", no_label_manifest["caption"])
        self.assertIn("horizontal: x (cm); vertical: y (s)", no_label_manifest["caption"])
        for path, sha256 in frozen_hashes.items():
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), sha256)

    def test_invalid_csv_and_non_data_source_are_rejected_without_touching_inputs(self):
        invalid = [
            ("Missing", "x,z\n1,2\n", "missing or duplicate column names", "x", "y"),
            ("Duplicate", "x,y,x\n1,2,3\n", "missing or duplicate column names", "x", "y"),
            ("Malformed", "x,y\n1,2,3\n", "Malformed CSV row", "x", "y"),
            ("ShortRow", "x,y\n1\n", "Malformed CSV row", "x", "y"),
            ("EmptyCell", "x,y\n1,\n", "Missing value", "x", "y"),
            ("NonFinite", "x,y\nnan,2\n", "Non-finite", "x", "y"),
            ("NonNumeric", "x,y\na,2\n", "Non-numeric", "x", "y"),
            ("NoRows", "x,y\n", "no usable observations", "x", "y"),
        ]
        failures_before = len(list((self.root / "tasks/T1/analysis").glob(".failed-*"))) if (self.root / "tasks/T1/analysis").exists() else 0
        for index, (name, content, expected, x, y) in enumerate(invalid):
            with self.subTest(case=name):
                source_id = "D" + str(index + 1)
                path = self.source(source_id, content)
                original = path.read_bytes()
                result = self.call_scatter(source=source_id, plot_id="Bad" + str(index + 1), fail=True, x=x, y=y)
                self.assertIn(expected, result["error"])
                self.assertEqual(path.read_bytes(), original)
                self.assertFalse((self.root / "tasks/T1/analysis" / ("Bad" + str(index + 1))).exists())

        same_path = self.source("DSame", "x,y\n1,2\n")
        same_bytes = same_path.read_bytes()
        same = self.call_scatter(source="DSame", plot_id="Same", x="x", y="x", fail=True)
        self.assertIn("different, non-empty", same["error"])
        self.assertEqual(same_path.read_bytes(), same_bytes)

        text_path = self.source("TextCSV", "x,y\n1,2\n", level="full_text")
        text_bytes = text_path.read_bytes()
        wrong_source = self.call_scatter(source="TextCSV", plot_id="WrongSource", fail=True)
        self.assertIn("registered data CSV", wrong_source["error"])
        self.assertEqual(text_path.read_bytes(), text_bytes)
        failures_after = list((self.root / "tasks/T1/analysis").glob(".failed-*"))
        self.assertEqual(len(failures_after), failures_before + len(invalid) + 1)

    def test_cross_task_input_code_and_style_changes_keep_old_versions(self):
        self.source("D1", "x,y\n3,30\n-1,5\n3,30\n0,-2\n")
        first = self.call_scatter()
        analysis, figure = Path(first["analysis_path"]), Path(first["figure_path"])
        old_analysis = self.snapshot(analysis)
        old_figure = self.snapshot(figure)
        input_file = self.root / "inputs" / "D1.csv"
        original_input = input_file.read_bytes()

        self.call_research("init", "--question", "Synthetic scatter software validation only", task="T2")
        shutil.copytree(self.root / "tasks/T1/sources/D1", self.root / "tasks/T2/sources/D1")
        cross_task = self.call_scatter(task="T2", fail=True)
        self.assertIn("different task", cross_task["error"])
        self.assertFalse((self.root / "tasks/T2/analysis").exists())

        input_file.write_text("x,y\n99,100\n", encoding="utf-8")
        changed_input = self.call_scatter(fail=True)
        self.assertIn("digest changed", changed_input["error"])
        self.assertEqual(old_analysis, self.snapshot(analysis))
        self.assertEqual(old_figure, self.snapshot(figure))
        input_file.write_bytes(original_input)

        changed_code = Path(self.temp.name) / "changed_plot_scatter.py"
        changed_code.write_text("# changed synthetic plotter version\n", encoding="utf-8")
        with patch.object(plot_scatter, "__file__", str(changed_code)):
            result = self.call_scatter(fail=True)
        self.assertIn("different inputs/parameters/code", result["error"])
        self.assertEqual(old_analysis, self.snapshot(analysis))
        self.assertEqual(old_figure, self.snapshot(figure))

        alternate_package = Path(self.temp.name) / "alternate-package"
        alternate_assets = alternate_package / "assets"
        alternate_assets.mkdir(parents=True)
        style = plot_scatter.PACKAGE / "assets" / "figstyle.py"
        (alternate_assets / "figstyle.py").write_bytes(style.read_bytes() + b"\n# changed synthetic style version\n")
        with patch.object(plot_scatter, "PACKAGE", alternate_package):
            changed_style = self.call_scatter(fail=True)
        self.assertIn("different inputs/parameters/code", changed_style["error"])
        self.assertEqual(old_analysis, self.snapshot(analysis))
        self.assertEqual(old_figure, self.snapshot(figure))

    def test_malformed_csv_quotes_keep_failed_attempts_and_original_inputs(self):
        for source_id, content in (
            ("UnclosedQuote", 'x,y\n1,"2\n'),
            ("TrailingQuoteText", 'x,y\n1,"2"0\n'),
        ):
            with self.subTest(source=source_id):
                source_file = self.source(source_id, content)
                original = source_file.read_bytes()
                source_snapshot = self.snapshot(self.root / "tasks/T1/sources" / source_id)
                result = self.call_scatter(source=source_id, plot_id=source_id, fail=True)
                self.assertIn("Malformed CSV", result["error"])
                self.assertEqual(source_file.read_bytes(), original)
                self.assertEqual(source_snapshot, self.snapshot(self.root / "tasks/T1/sources" / source_id))
                self.assertFalse((self.root / "tasks/T1/analysis" / source_id).exists())
                self.assertFalse((self.root / "tasks/T1/figures" / source_id).exists())
                failed = list((self.root / "tasks/T1/analysis").glob(".failed-" + source_id + "-*"))
                self.assertEqual(len(failed), 1)
                failure = research.read_json(failed[0] / "failure.json")
                self.assertEqual(failure["status"], "failed")
                self.assertEqual(failure["error"], result["error"])
                self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())

    def test_real_missing_glyph_warnings_are_audited_and_block_manuscript(self):
        sys.path.insert(0, str(plot_scatter.PACKAGE / "assets"))
        import figstyle
        import matplotlib as mpl
        original_style = figstyle.use_style
        style_hash = research.digest(plot_scatter.PACKAGE / "assets" / "figstyle.py")

        def use_missing_glyph_font():
            original_style()
            mpl.rcParams["font.family"] = "DejaVu Sans"
            mpl.rcParams["font.sans-serif"] = ["DejaVu Sans"]
            figstyle._resolved_font = "DejaVu Sans"

        source_file = self.source("D1", "温度,响应\n1,2\n2,3\n")
        original = source_file.read_bytes()
        with mpl.rc_context(), patch.object(figstyle, "_resolved_font", figstyle._resolved_font), \
                patch.object(figstyle, "use_style", new=use_missing_glyph_font):
            result = self.call_scatter(x="温度", y="响应", x_unit="°C", y_unit="s")
        figure = Path(result["figure_path"])
        manifest = research.read_json(figure / "manifest.json")
        issues = manifest["audit"]["issues"]
        self.assertEqual(result["status"], "partial")
        self.assertEqual(manifest["audit"]["status"], "warning")
        self.assertTrue(any("Glyph" in issue and "missing from font" in issue for issue in issues), issues)
        self.assertEqual(result["audit_issues"], issues)
        self.assertEqual(research.read_json(figure / "receipt.json")["audit_issues"], issues)
        self.assertEqual(len(issues), len(set(issues)))
        self.assertTrue(any("no publication font" in issue for issue in issues), issues)
        self.assertEqual(manifest["visual_check"], "pending")
        self.assertEqual(result["visual_check"], "pending")
        self.assertEqual(result["row_count"], 2)
        from PIL import Image
        with Image.open(figure / "figure.png") as image:
            image.verify()
        self.assertIn("<svg", (figure / "figure.svg").read_text(encoding="utf-8"))
        self.assertTrue((figure / "figure.pdf").read_bytes().startswith(b"%PDF-"))
        self.assertEqual(source_file.read_bytes(), original)
        self.assertEqual(research.digest(plot_scatter.PACKAGE / "assets" / "figstyle.py"), style_hash)
        repeated = self.call_scatter(x="温度", y="响应", x_unit="°C", y_unit="s")
        self.assertEqual(repeated["reused"], {"analysis": True, "figure": True})
        self.assertEqual(repeated["status"], "partial")
        self.assertEqual(repeated["audit_issues"], issues)

        context = self.input("warning-context.json", json.dumps({
            "title": "Synthetic missing glyph fixture", "selected_sources": ["D1"],
            "analysis_ids": ["Scatter1"], "figure_ids": ["Scatter1"],
        }))
        body = self.input("warning-body.md", "## Results\n\n[figure:Scatter1]\n")
        blocked = self.call_research("manuscript", "--id", "WarningPaper", "--context", context, "--body", body, fail=True)
        self.assertIn("unresolved audit issues", blocked["error"])
        self.assertFalse((self.root / "tasks/T1/manuscript/WarningPaper").exists())

    def test_pending_attempt_and_writer_lock_block_all_steps(self):
        self.source("D1", "x,y\n1,2\n")
        pending = self.root / "tasks/T1/analysis/.pending-stale-fixture"
        pending.mkdir(parents=True)
        pending_result = self.call_scatter(fail=True)
        self.assertIn("Unresolved pending attempts", pending_result["error"])
        self.assertTrue(pending.is_dir())
        self.assertFalse((self.root / "tasks/T1/analysis/Scatter1").exists())
        self.assertFalse((self.root / ".yan-zhou-pi.lock").exists())

        shutil.rmtree(pending)
        lock = self.root / ".yan-zhou-pi.lock"
        lock.write_text("active synthetic lock fixture", encoding="utf-8")
        locked = self.call_scatter(fail=True)
        self.assertIn("File exists", locked["error"])
        self.assertEqual(lock.read_text(encoding="utf-8"), "active synthetic lock fixture")
        self.assertFalse((self.root / "tasks/T1/analysis/Scatter1").exists())


if __name__ == "__main__":
    unittest.main()
