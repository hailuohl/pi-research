"""Synthetic article fixtures only; not research or native-platform evidence."""
import contextlib
import io
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import format_paper
import research


class ArticleFormatTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-article-")
        self.root = Path(self.temp.name) / "workspace"
        self.call(research.main, "init", "--question", "Synthetic article software check only")
        for sid, filename, content, level in (
            ("S1", "source.txt", "Synthetic literature fixture only.", "full_text"),
            ("S2", "unused.txt", "Unselected synthetic fixture.", "full_text"),
            ("D1", "data.csv", "group,value\nA,1\nA,3\nB,5\nB,7\n", "data"),
        ):
            self.input(filename, content)
            metadata = self.input(sid + ".json", {"title": "Synthetic source " + sid, "authors": "Software fixture", "year": "unknown",
                "content_level": level, "selection_reason": "Explicit synthetic software test", "license": "synthetic fixture"})
            self.call(research.main, "register", "--id", sid, "--file", "inputs/" + filename, "--metadata", metadata)
        self.call(research.main, "analyze", "--id", "A1", "--source", "D1", "--column", "value", "--group", "group", "--unit", "dimensionless", "--missing", "error")
        self.figure("F1", 5.5)
        self.paper("V2", "F1")
        self.before = self.snapshot()

    def tearDown(self):
        self.temp.cleanup()

    def call(self, function, *args, fail=False):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            code = function(["--workspace", str(self.root), "--task", "T1", *args])
        self.assertEqual(code, 1 if fail else 0, stderr.getvalue())
        return json.loads(stderr.getvalue().splitlines()[-1] if fail else stdout.getvalue().splitlines()[-1])

    def input(self, name, content):
        path = self.root / "inputs" / name
        path.write_text(json.dumps(content, ensure_ascii=False) if isinstance(content, dict) else content, encoding="utf-8")
        return "inputs/" + name

    def figure(self, fid, width):
        ws = research.Workspace(self.root, "T1")
        analysis = ws.record("analysis", "A1")
        def run(out):
            from PIL import Image
            Image.new("RGB", (550, 374), "white").save(out / "figure.png")
            research.write_json(out / "manifest.json", {"analysis": "A1", "data_source": "D1", "width_inches": width,
                "caption": "Synthetic descriptive figure only.", "audit": {"issues": []}})
            return {"status": "complete"}
        research.execute(ws, "figures", fid, {"width": width}, [analysis / "receipt.json"], [analysis], run)

    def paper(self, pid, fid, body=None):
        context = self.input(pid + "-context.json", {"title": "合成软件验收稿件", "selected_sources": ["S1", "D1"],
            "analysis_ids": ["A1"], "figure_ids": [fid]})
        body = body or ("## 摘要\n\n这只是合成软件夹具 [@S1]。\n\n## 方法\n\n测试不代表科研发现。\n\n### 描述统计\n\n"
            "计算来自选定夹具。\n\n## 结果\n\n- A组均值为[value:A1:groups/A/mean]。\n- B组均值为[value:A1:groups/B/mean]。\n\n"
            f"[figure:{fid}]\n\n## 研究限制\n\n1. 合成资料。\n2. 不作科学结论。")
        source = self.input(pid + "-body.md", body)
        return self.call(research.main, "manuscript", "--id", pid, "--context", context, "--body", source)

    def snapshot(self):
        return {str(p.relative_to(self.root)): research.digest(p) for p in self.root.rglob("*") if p.is_file()}

    def formatted(self, fid="V3", paper="V2", fail=False):
        return self.call(format_paper.main, "--paper", paper, "--id", fid, fail=fail)

    def test_actual_article_exports_same_content_and_old_history(self):
        from docx import Document
        from docx.oxml.ns import qn
        from pypdf import PdfReader
        generated = self.formatted()
        out = Path(generated["path"])
        paper = self.root / "tasks/T1/manuscript/V2"
        for name in ("manuscript.md", "paper_context.json", "citation-map.json", "F1.png"):
            self.assertEqual((out / name).read_bytes(), (paper / name).read_bytes())
        self.assertEqual(research.digest(Path(research.__file__)), format_paper.HELPER_SHA256)
        self.assertTrue(all(research.digest(self.root / name) == sha for name, sha in self.before.items()))
        doc = Document(out / "manuscript.docx")
        page = doc.sections[0]
        self.assertAlmostEqual(page.page_width.mm, 210, places=1)
        self.assertAlmostEqual(page.page_height.mm, 297, places=1)
        for margin in (page.left_margin, page.right_margin, page.top_margin, page.bottom_margin):
            self.assertAlmostEqual(margin.mm, 25, places=1)
        self.assertEqual(doc.styles["Normal"].font.size.pt, 11)
        self.assertEqual(doc.styles["Title"].font.size.pt, 17.5)
        self.assertEqual(doc.styles["Heading 1"].font.size.pt, 14.5)
        self.assertAlmostEqual(doc.styles["Normal"].paragraph_format.line_spacing.pt, 13.6, places=1)
        self.assertEqual(doc.styles["Normal"].paragraph_format.first_line_indent.pt, 17)
        self.assertEqual(tuple(doc.styles["Heading 1"].font.color.rgb), (0, 0, 0))
        paragraphs = [p.text for p in doc.paragraphs]
        self.assertIn("1  方法", paragraphs)
        self.assertIn("1.1  描述统计", paragraphs)
        self.assertIn("参考文献", paragraphs)
        self.assertEqual(len(doc.inline_shapes), 1)
        shape = doc.inline_shapes[0]
        self.assertAlmostEqual(shape.width.inches, 5.5)
        self.assertAlmostEqual(shape.height / shape.width, 374 / 550, places=5)
        self.assertTrue(page.footer._element.xpath('.//w:fldSimple[@w:instr="PAGE"]'))
        self.assertEqual(doc.styles["Normal"].element.rPr.rFonts.get(qn("w:ascii")), "Times New Roman")
        pdf = PdfReader(out / "manuscript.pdf")
        text = "\n".join(p.extract_text() for p in pdf.pages)
        for expected in ("合成软件验收稿件", "摘要", "A组均值为2", "B组均值为6", "Synthetic source S1", "图 1"):
            self.assertIn(expected, text)
        self.assertNotIn("Synthetic source S2", text)
        self.assertEqual(sum(len(p.images) for p in pdf.pages), 1)
        for p in pdf.pages:
            self.assertAlmostEqual(float(p.mediabox.width), 210 * 72 / 25.4, places=2)
            self.assertAlmostEqual(float(p.mediabox.height), 297 * 72 / 25.4, places=2)
        manifest = research.read_json(out / "layout-manifest.json")
        self.assertEqual(manifest["actually_cited"], ["S1"])
        self.assertEqual(manifest["pdf_visual_check"], "pending")
        self.assertEqual(manifest["figures"]["F1"]["width_inches"], 5.5)
        fonts = manifest["layout"]["pdf_fonts"]
        if format_paper.NOTO_FONT.is_file() and importlib.util.find_spec("fontTools"):
            self.assertEqual(fonts["cjk_heading_weight"], 700)
            self.assertEqual(fonts["cjk_body_weight"], 400)
            self.assertTrue(fonts["cjk_face"].startswith("NotoSerifSC-Regular-"))
            self.assertTrue(fonts["cjk_bold_face"].startswith("NotoSerifSC-Bold-"))
            self.assertIsNone(fonts["bold_fallback"])
            self.assertEqual(manifest["layout_gaps"], [])
            resources = [font.get_object() for p in pdf.pages for font in p["/Resources"]["/Font"].values()]
            self.assertTrue(any(fonts["cjk_face"] in str(font["/BaseFont"]) for font in resources))
            self.assertTrue(any(fonts["cjk_bold_face"] in str(font["/BaseFont"]) for font in resources))
            stems = {font["/FontDescriptor"]["/StemV"] for font in resources if "/FontDescriptor" in font}
            self.assertGreater(len(stems), 1)
        else:
            self.assertTrue(fonts["bold_fallback"])
            self.assertEqual(generated["status"], "partial")
        self.assertEqual(manifest["files"]["manuscript.pdf"]["sha256"], research.digest(out / "manuscript.pdf"))
        self.assertEqual(research.Workspace(self.root, "T1").record("formatted", "V3"), out)
        self.assertTrue(self.formatted()["reused"])

    def test_changed_formatter_style_source_and_tampering_rejected(self):
        self.assertEqual(format_paper.blocks("## 2026 Calibration\n\n### 3D fit"),
                         [("section", "1  2026 Calibration"), ("subsection", "1.1  3D fit")])
        self.formatted()
        with patch.object(format_paper, "FORMAT_STYLE", "changed-fixture-style"):
            self.assertIn("different inputs/parameters/code", self.formatted(fail=True)["error"])
        changed_script = Path(self.temp.name) / "changed-format.py"
        changed_script.write_text("# synthetic changed formatter", encoding="utf-8")
        with patch.object(format_paper, "__file__", str(changed_script)):
            self.assertIn("different inputs/parameters/code", self.formatted(fail=True)["error"])
        self.paper("V4", "F1", "## 摘要\n\n第二份合成稿 [@S1]。\n\n## 2026 校准\n\n新稿独有汉字：霁鹤鳞。")
        self.assertIn("different inputs/parameters/code", self.formatted(paper="V4", fail=True)["error"])
        second = Path(self.formatted(fid="V4", paper="V4")["path"])
        from pypdf import PdfReader
        pdf_text = "\n".join(page.extract_text() for page in PdfReader(second / "manuscript.pdf").pages)
        self.assertIn("2026 校准", pdf_text)
        self.assertIn("新稿独有汉字：霁鹤鳞", pdf_text)
        if format_paper.NOTO_FONT.is_file() and importlib.util.find_spec("fontTools"):
            first_fonts = research.read_json(self.root / "tasks/T1/formatted/V3/layout-manifest.json")["layout"]["pdf_fonts"]
            second_fonts = research.read_json(second / "layout-manifest.json")["layout"]["pdf_fonts"]
            self.assertNotEqual(first_fonts["cjk_face"], second_fonts["cjk_face"])
            self.assertNotEqual(first_fonts["cjk_bold_face"], second_fonts["cjk_bold_face"])
        draft = self.root / "tasks/T1/manuscript/V2/manuscript.md"
        draft.write_text("tampered synthetic source", encoding="utf-8")
        self.assertIn("digest changed", self.formatted(fid="V5", fail=True)["error"])
        self.assertFalse((self.root / "tasks/T1/formatted/V5").exists())
        with patch.object(format_paper, "NOTO_FONT", Path(self.temp.name) / "unavailable-font.ttf"):
            fallback = self.formatted(fid="V6", paper="V4")
            self.assertEqual(fallback["status"], "partial")
            manifest = research.read_json(Path(fallback["path"]) / "layout-manifest.json")
            self.assertEqual(manifest["layout"]["pdf_fonts"]["cjk_heading_weight"], "regular")
            self.assertTrue(manifest["layout_gaps"])

    def test_width_and_unsupported_content_fail_with_retained_attempt(self):
        self.figure("F2", 7)
        self.paper("V4", "F2")
        result = self.formatted(fid="V5", paper="V4", fail=True)
        self.assertIn("print width exceeds", result["error"])
        failures = list((self.root / "tasks/T1/formatted").glob(".failed-*/failure.json"))
        self.assertEqual(len(failures), 1)
        self.assertEqual(research.read_json(failures[0])["status"], "failed")
        self.assertFalse((self.root / "tasks/T1/formatted/V5").exists())
        self.assertTrue(all(research.digest(self.root / name) == sha for name, sha in self.before.items()))
        self.paper("V6", "F1", "## 方法\n\n| unsupported | table |\n| --- | --- |")
        self.assertIn("does not support", self.formatted(fid="V7", paper="V6", fail=True)["error"])
        self.assertEqual(len(list((self.root / "tasks/T1/formatted").glob(".failed-*/failure.json"))), 2)
        with self.assertRaisesRegex(ValueError, "unselected citation"):
            research.render_body("Unauthorized fixture [@S2].", research.selected_context(research.Workspace(self.root, "T1"), self.root / "tasks/T1/manuscript/V2/paper_context.json")[1])


if __name__ == "__main__":
    unittest.main()
