"""Synthetic complex-document contract; converter checks run only when explicitly tested."""
import argparse
import copy
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import alignment_common as common
import document_ast as ast
import document_workflow as documents
import research
import template_workflow as templates


def mathxml(content):
    return ast.safe_xml(('<m:oMath xmlns:m="' + ast.M + '">' + content + '</m:oMath>').encode())


class DocumentStructureTests(unittest.TestCase):
    def test_body_relative_heading_levels_exclude_generated_bibliography(self):
        tree = {"meta": {}, "blocks": [{"t": "Header", "c": [2, ["", [], []], ast.text_inlines("方法")]}, {"t": "Header", "c": [3, ["", [], []], ast.text_inlines("细节")]}, {"t": "Para", "c": ast.text_inlines("来源 [@S1]")}]}
        records = {name: {} for name in ("sources", "evidence", "claims", "analysis", "figures")}
        records["sources"]["S1"] = (None, {"title": "Synthetic source", "authors": "Fixture", "year": "unknown", "content_level": "full_text"})
        resolved, _ = ast.resolve_tree(tree, records)
        self.assertEqual(documents.heading_offset(resolved), 1)
        self.assertEqual(ast.plain(resolved["blocks"][-2]["c"][2]), "参考文献")
        tex, _ = documents.tex_document(resolved, "Fixture", templates.layout_spec({}), {})
        self.assertIn(r"\section{", tex)
        self.assertIn(r"\subsection{", tex)
        self.assertNotIn(r"\subsubsection{", tex)

    def test_numeric_result_interval_endpoints_are_bound_and_invalid_indices_fail(self):
        records = {name: {} for name in ("sources", "evidence", "claims", "analysis", "figures")}
        records["analysis"]["A1"] = (None, {"results": {"ci": [-1.2, 3.4], "invalid": [None, True]}})
        def tree(pointer): return {"meta": {}, "blocks": [{"t": "Para", "c": [{"t": "Str", "c": "[value:A1:" + pointer + "]"}]}]}
        result, usage = ast.resolve_tree(tree("results/ci/1"), records)
        self.assertEqual(ast.plain(result["blocks"]), "3.4")
        self.assertEqual(usage["values"][0]["value"], 3.4)
        for pointer in ("results/ci/-1", "results/ci/01", "results/ci/2", "results/invalid/0", "results/invalid/1"):
            with self.subTest(pointer=pointer), self.assertRaises(ValueError): ast.resolve_tree(tree(pointer), records)

    def test_native_complex_math_generates_structure_not_source_commands(self):
        r = lambda text: '<m:r><m:t>' + text + '</m:t></m:r>'
        examples = [('<m:f><m:num>' + r('x') + '</m:num><m:den>' + r('y') + '</m:den></m:f>', r'\frac{x}{y}'),
            ('<m:rad><m:deg>' + r('3') + '</m:deg><m:e>' + r('x') + '</m:e></m:rad>', r'\sqrt[3]{x}'),
            ('<m:sSubSup><m:e>' + r('x') + '</m:e><m:sub>' + r('i') + '</m:sub><m:sup>' + r('2') + '</m:sup></m:sSubSup>', r'{x}_{i}^{2}'),
            ('<m:m><m:mr><m:e>' + r('1') + '</m:e><m:e>' + r('2') + '</m:e></m:mr><m:mr><m:e>' + r('3') + '</m:e><m:e>' + r('4') + '</m:e></m:mr></m:m>', r'\begin{matrix}1 & 2\\3 & 4\end{matrix}'),
            ('<m:eqArr><m:e>' + r('x=1') + '</m:e><m:e>' + r('y=2') + '</m:e></m:eqArr>', r'\begin{aligned}x=1\\y=2\end{aligned}')]
        for source, expected in examples:
            with self.subTest(expected=expected): self.assertEqual(ast.omml_tex(mathxml(source)), expected)
        text = ast.omml_tex(mathxml(r(r'\input{private}')))
        self.assertNotIn(r'\input{private}', text)
        self.assertIn(r'\textbackslash{}', text)
        with self.assertRaisesRegex(ValueError, "Unsupported native"):
            ast.omml_tex(mathxml('<m:unhandled/>'))

    def test_math_brackets_are_not_manual_citations_and_raw_nodes_fail(self):
        tree = {"meta": {}, "blocks": [{"t": "Para", "c": [{"t": "Math", "c": [{"t": "InlineMath"}, "[1,2]"]}]}]}
        records = {name: {} for name in ("sources", "evidence", "claims", "analysis", "figures")}
        result, usage = ast.resolve_tree(tree, records)
        self.assertEqual(result["blocks"][0]["c"][0]["c"][1], "[1,2]")
        self.assertEqual(usage["citations"], [])
        for tag in ("RawInline", "RawBlock", "Image"):
            with self.assertRaisesRegex(ValueError, "Unsupported document node"):
                ast.validate_tree({"blocks": [{"t": tag, "c": []}]})

    def test_tex_text_cannot_execute_template_or_link_commands(self):
        tree = {"blocks": [{"t": "Para", "c": [{"t": "Str", "c": r'\input{private}%'}]}]}
        tex, mapping = documents.tex_document(tree, r'\write18{anything}', templates.layout_spec({}), {})
        self.assertNotIn(r'\input{private}', tex)
        self.assertNotIn(r'\write18{anything}', tex)
        self.assertIn(r'\textbackslash{}input\{private\}\%', tex)
        self.assertEqual(mapping["equations"], [])

    def test_mixed_language_uses_declared_fonts_without_optional_cjk_package(self):
        tree = {"blocks": [{"t": "Para", "c": [{"t": "Str", "c": "English中文"}]}]}
        tex, _ = documents.tex_document(tree, "中文 title", templates.layout_spec({"fonts": {"cjk": "SimSun"}}), {})
        self.assertIn(r"\newfontfamily\YZCJK{SimSun}", tex)
        self.assertIn(r"{\YZCJK 中文}", tex)
        self.assertIn(r'\XeTeXlinebreaklocale "zh"', tex)
        self.assertNotIn("xeCJK", tex)
        latin, _ = documents.tex_document({"blocks": []}, "Latin only", templates.layout_spec({}), {})
        self.assertNotIn(r"\newfontfamily\YZCJK", latin)

    def test_unicode_targets_labels_refs_and_duplicate_dangling_rejection(self):
        tree = {"meta": {}, "blocks": [
            {"t": "Header", "c": [1, ["摘要", [], []], ast.text_inlines("摘要")]},
            {"t": "Para", "c": [{"t": "Math", "c": [{"t": "DisplayMath"}, r"x^2\label{eq:平方}"]}]},
            {"t": "Para", "c": ast.text_inlines(r"See \eqref{eq:平方}.") + [{"t": "Link", "c": [["", [], []], ast.text_inlines("summary"), ["#摘要", ""]]}]}]}
        ast.validate_tree(tree)
        binding = ast.bind_crossreferences(tree)
        self.assertEqual([item.get("equation_number") for item in binding["targets"]], [None, 1])
        self.assertTrue(all(len(item["target"]) == 34 and item["target"].isascii() for item in binding["targets"]))
        self.assertEqual(len(binding["links"]), 2)
        self.assertEqual(tree["blocks"][1]["c"][0]["c"][1], "x^2")
        restored = ast.markdown_crossreferences(tree, binding)
        self.assertEqual(restored["blocks"][0]["c"][1][0], "摘要")
        self.assertIn(r"\label{eq:平方}", restored["blocks"][1]["c"][0]["c"][1])
        self.assertIn(r"\eqref{eq:平方}", ast.plain(restored["blocks"][2]))
        for blocks in ([{"t": "Header", "c": [1, ["same", [], []], []]}, {"t": "Div", "c": [["same", [], []], []]}],
                       [{"t": "Para", "c": [{"t": "Link", "c": [["", [], []], [], ["#missing", ""]]}]}],
                       [{"t": "Para", "c": [{"t": "Math", "c": [{"t": "InlineMath"}, r"x+\eqref{missing}"]}]}]):
            with self.assertRaises(ValueError): ast.bind_crossreferences({"blocks": blocks})
        with self.assertRaises(ValueError): ast.target_identifier("unsafe\nidentifier")

    def test_internal_links_are_actual_tex_targets_and_hyperlinks(self):
        tree = {"blocks": [{"t": "Header", "c": [1, ["方法", [], []], ast.text_inlines("方法")]},
            {"t": "Para", "c": [{"t": "Span", "c": [["phrase", [], []], ast.text_inlines("phrase")]}, {"t": "Link", "c": [["", [], []], ast.text_inlines("go"), ["#方法", ""]]}]},
            {"t": "Div", "c": [["block", [], []], [{"t": "Para", "c": ast.text_inlines("block text")}]]}]}
        binding = ast.bind_crossreferences(tree)
        tex, _ = documents.tex_document(tree, "Targets", templates.layout_spec({}), {})
        for item in binding["targets"]: self.assertIn(r"\hypertarget{" + item["target"] + "}{}", tex)
        self.assertIn(r"\hyperlink{" + binding["links"][0]["target"] + "}{go}", tex)


@unittest.skipUnless(shutil.which("pandoc") and shutil.which("xelatex"), "Actual Pandoc/XeLaTeX are required; no fake PDF fallback")
class ActualDocumentWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-complex-document-")
        self.root = Path(self.temp.name) / "workspace"
        research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic complex-document check only"))
        self.ws = research.Workspace(self.root, "T1")
        research.write_json(self.root / "inputs/context.json", {"title": "Synthetic complex manuscript", "selected_sources": []})
        source = r'''## Abstract

Synthetic software validation only, with a native footnote.[^note]

## Equations

Inline $\frac{x_i^2}{\sqrt{1+y}}$ and a display matrix:

$$\begin{pmatrix}1&2\\3&4\end{pmatrix}$$

$$\begin{cases}x^2 & x > 0\\0 & x \leq 0\end{cases}$$

$$\begin{aligned}a&=b+c\\d&=\sum_{i=1}^{n} i\end{aligned}$$

| Condition | Value |
|:----------|------:|
| Synthetic A | 1 |
| Synthetic B | 2 |

[^note]: Native note with $\int_0^1 x\,dx$.
'''
        (self.root / "inputs/body.md").write_text(source, encoding="utf-8")

    def tearDown(self): self.temp.cleanup()

    def test_native_formula_table_footnote_pdf_and_reopen(self):
        args = argparse.Namespace(id="V1", paper=None, context="inputs/context.json", body="inputs/body.md", template=None, pandoc=None, xelatex=None)
        result = documents.document_workflow(self.ws, args)
        folder = Path(result["path"])
        self.assertEqual(result["status"], "complete", common.strict_json(folder / "export.json"))
        parts = ast.zip_parts(folder / "manuscript.docx")
        root = ast.safe_xml(parts["word/document.xml"])
        headings = [item.get("{" + ast.W + "}val") for item in root.findall(".//w:pStyle", ast.NS)]
        self.assertIn("Heading1", headings)
        self.assertNotIn("Heading2", headings)
        self.assertEqual(len(root.findall(".//m:oMath", ast.NS)), 4)
        self.assertEqual(len(root.findall(".//w:tbl", ast.NS)), 1)
        notes = ast.safe_xml(parts["word/footnotes.xml"])
        self.assertEqual(len(notes.findall(".//m:oMath", ast.NS)), 1)
        self.assertTrue((folder / "manuscript.pdf").read_bytes().startswith(b"%PDF-"))
        mapping = common.strict_json(folder / "structure-map.json")
        self.assertEqual(len(mapping["equations"]), 5)
        self.assertEqual(len(mapping["footnotes"]), 1)
        self.assertRegex((folder / "manuscript.tex").read_text(), r"\\begin\{(?:matrix|array)\}")
        before = {p: p.read_bytes() for p in folder.iterdir()}
        self.assertTrue(documents.document_workflow(self.ws, args)["reused"])
        self.assertEqual(before, {p: p.read_bytes() for p in folder.iterdir()})

    def test_unsupported_or_executable_math_does_not_create_completed_artifact(self):
        (self.root / "inputs/body.md").write_text(r'$\input{C:/private/file}$', encoding="utf-8")
        args = argparse.Namespace(id="Bad", paper=None, context="inputs/context.json", body="inputs/body.md", template=None, pandoc=None, xelatex=None)
        with self.assertRaises(ValueError): documents.document_workflow(self.ws, args)
        self.assertFalse((self.ws.task / "manuscript/Bad").exists())
        self.assertTrue(list((self.ws.task / "manuscript").glob(".failed-Bad-*")))

    def test_real_unicode_ids_native_bookmarks_pdf_links_and_equation_numbers(self):
        source = r'''## 摘要

中文正文与英文 English。

## 方法 {#sec-method}

See [摘要](#摘要), [phrase](#句子), and [note](#block-note).

[定位文字]{#句子}

::: {#block-note}
Retained block text.
:::

$$E=mc^2 \label{eq:能量}$$

Equation \eqref{eq:能量} and $\ref{eq:能量}$.

::: {#eq:matrix}
$$\begin{pmatrix}1&2\\3&4\end{pmatrix}$$
:::

Matrix \eqref{eq:matrix}.
'''
        (self.root / "inputs/body.md").write_text(source, encoding="utf-8")
        args = argparse.Namespace(id="Crossrefs", paper=None, context="inputs/context.json", body="inputs/body.md", template=None, pandoc=None, xelatex=None)
        folder = Path(documents.document_workflow(self.ws, args)["path"])
        binding = common.strict_json(folder / "crossreferences.json")
        self.assertEqual({item["source_id"] for item in binding["targets"]}, {"摘要", "sec-method", "句子", "block-note", "eq:能量", "eq:matrix"})
        self.assertEqual(binding["docx"]["links"], 6)
        self.assertEqual(binding["pdf"]["links"], 6)
        self.assertEqual(binding["docx"]["status"], "pass")
        self.assertEqual(binding["pdf"]["status"], "pass")
        parts = ast.zip_parts(folder / "manuscript.docx")
        root = ast.safe_xml(parts["word/document.xml"])
        actual_names = {node.get("{" + ast.W + "}name") for node in root.findall(".//w:bookmarkStart", ast.NS)}
        self.assertTrue({item["target"] for item in binding["targets"]}.issubset(actual_names))
        equations = common.strict_json(folder / "structure-map.json")["equations"]
        self.assertEqual([item["equation_number"] for item in equations], [1, 2])
        self.assertEqual([item["docx_number_text"] for item in equations], ["(1)", "(2)"])
        tex = (folder / "manuscript.tex").read_text(encoding="utf-8")
        self.assertIn(r"\tag{1}", tex); self.assertIn(r"\tag{2}", tex)
        self.assertNotIn(r"\label{eq:", tex)
        markdown = (folder / "manuscript.md").read_text(encoding="utf-8")
        self.assertIn("eq:能量", markdown)
        self.assertNotIn("YZTARGET_", markdown)

    def test_real_pandoc_dangling_and_duplicate_targets_fail_before_delivery(self):
        for index, source in enumerate(("## 摘要\n\n[missing](#不存在)", "## One {#same}\n\n## Two {#same}", "$$x\\label{eq:one}$$\n\n$$y\\label{eq:one}$$")):
            (self.root / "inputs/body.md").write_text(source, encoding="utf-8")
            args = argparse.Namespace(id="BadRef" + str(index), paper=None, context="inputs/context.json", body="inputs/body.md", template=None, pandoc=None, xelatex=None)
            with self.assertRaises(ValueError): documents.document_workflow(self.ws, args)
            self.assertFalse((self.ws.task / "manuscript" / args.id).exists())


if __name__ == "__main__":
    unittest.main()
