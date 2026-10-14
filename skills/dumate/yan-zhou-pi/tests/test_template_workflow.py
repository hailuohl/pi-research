"""Synthetic template mapping; active or unmapped rules never count as complete."""
import argparse
import copy
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import alignment_common as common
import document_ast as ast
import research
import template_workflow as templates


class TemplateWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-layout-")
        self.root = Path(self.temp.name) / "workspace"
        research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic layout fixture only"))
        self.ws = research.Workspace(self.root, "T1")

    def tearDown(self):
        self.temp.cleanup()

    def test_declared_complete_layout_roundtrip_and_history(self):
        spec = templates.layout_spec({"name": "Synthetic two-column journal", "columns": {"count": 2}, "first_page": {"different": True, "footer": {"center": ""}}, "header": {"left": "Synthetic journal"}, "table": {"borders": "grid"}})
        path = self.root / "inputs/layout.json"; research.write_json(path, spec)
        args = argparse.Namespace(id="J1", spec="inputs/layout.json", reference=None)
        result = templates.template_workflow(self.ws, args)
        folder = Path(result["path"])
        self.assertEqual(common.strict_json(folder / "template.json"), spec)
        parts = ast.zip_parts(folder / "reference.docx")
        root = ast.safe_xml(parts["word/document.xml"])
        self.assertEqual(root.find(".//w:cols", ast.NS).get("{" + ast.W + "}num"), "2")
        snapshot = {p: p.read_bytes() for p in folder.iterdir()}
        self.assertTrue(templates.template_workflow(self.ws, args)["reused"])
        self.assertEqual(snapshot, {p: p.read_bytes() for p in folder.iterdir()})

    def test_bad_dimensions_commands_and_unmapped_rules_rejected(self):
        for value in ({"shell": "arbitrary"}, {"required_features": ["execute user cls"]}, {"fonts": {"latin": r"C:\outside\font.ttf"}}, {"body": {"size_pt": float("nan")}}, {"page": {"left_mm": 200}}, {"columns": {"count": True}}, {"footer": {"left": "{INCLUDETEXT}"}}):
            with self.subTest(value=value), self.assertRaises(ValueError): templates.layout_spec(value)

    def test_xml_entities_zip_traversal_and_external_relationships(self):
        with self.assertRaisesRegex(ValueError, "DTD/entities"):
            ast.safe_xml(b'<!DOCTYPE x [<!ENTITY external SYSTEM "file:///private">]><x>&external;</x>')
        for encoding in ("utf-16-le", "utf-16-be", "utf-32-le", "utf-32-be"):
            declaration = encoding.upper().replace("-LE", "LE").replace("-BE", "BE")
            raw = ('<?xml version="1.0" encoding="' + declaration + '"?><!DOCTYPE x [<!ENTITY hidden "expansion">]><x>&hidden;</x>').encode(encoding)
            with self.subTest(encoding=encoding), self.assertRaises(ValueError): ast.safe_xml(raw)
        bad = self.root / "inputs/bad.docx"
        with zipfile.ZipFile(bad, "w") as archive: archive.writestr("../outside", b"x")
        with self.assertRaisesRegex(ValueError, "path"): ast.zip_parts(bad)
        templates.build_reference(self.root / "inputs/base.docx", templates.layout_spec({}))
        parts = ast.zip_parts(self.root / "inputs/base.docx")
        parts["word/_rels/document.xml.rels"] = b'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="external" Target="file:///private" TargetMode="External"/></Relationships>'
        with zipfile.ZipFile(bad, "w") as archive:
            for name, raw in parts.items(): archive.writestr(name, raw)
        with self.assertRaisesRegex(ValueError, "unsafe rules"): templates.map_reference(bad)

    def test_reference_fixed_content_is_not_silently_discarded(self):
        from docx import Document
        path = self.root / "inputs/reference.docx"
        doc = Document(); doc.add_paragraph("Required journal title block"); doc.save(path)
        with self.assertRaisesRegex(ValueError, "fixed body content"): templates.map_reference(path)

    def test_safe_reference_maps_its_actual_style_and_page(self):
        path = self.root / "inputs/canonical.docx"
        spec = templates.layout_spec({"title": {"size_pt": 19}, "page": {"left_mm": 20}, "header": {"left": "Synthetic journal"}})
        templates.build_reference(path, spec)
        mapped, report = templates.map_reference(path)
        self.assertEqual(mapped["title"]["size_pt"], 19)
        self.assertAlmostEqual(mapped["page"]["left_mm"], 20, places=1)
        self.assertEqual(mapped["header"]["left"], "Synthetic journal")
        self.assertEqual(report["unmapped_required"], [])

    def test_only_exact_inactive_default_bibliography_is_accepted(self):
        source = self.root / "inputs/canonical.docx"
        templates.build_reference(source, templates.layout_spec({}))
        parts = ast.zip_parts(source)
        self.assertIn("customXml/item1.xml", parts)
        for name, replacement in (("customXml/item1.xml", b'<b:Sources xmlns:b="http://schemas.openxmlformats.org/officeDocument/2006/bibliography" SelectedStyle="/APA.XSL" StyleName="APA"><b:Source/></b:Sources>'),
                                  ("customXml/_rels/item1.xml.rels", b'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="https://outside.invalid/" TargetMode="External"/></Relationships>')):
            changed = dict(parts); changed[name] = replacement
            target = self.root / "inputs/unsafe.docx"
            with zipfile.ZipFile(target, "w") as archive:
                for item, raw in changed.items(): archive.writestr(item, raw)
            with self.assertRaisesRegex(ValueError, "unsafe rules"):
                templates.map_reference(target)

    def test_effective_title_inherits_parent_size_spacing_and_italic(self):
        from docx import Document
        from docx.enum.style import WD_STYLE_TYPE
        from docx.shared import Pt
        path = self.root / "inputs/inherited.docx"
        templates.build_reference(path, templates.layout_spec({}))
        doc = Document(path)
        parent = doc.styles.add_style("JournalTitleParent", WD_STYLE_TYPE.PARAGRAPH)
        parent.base_style = doc.styles["Normal"]
        parent.font.size = Pt(24); parent.font.italic = True
        parent.paragraph_format.space_before = Pt(36)
        title = doc.styles["Title"]; title.base_style = parent
        title.font.size = None; title.font.italic = None; title.paragraph_format.space_before = None
        doc.save(path)
        before = path.read_bytes()
        mapped, report = templates.map_reference(path)
        self.assertEqual(mapped["title"]["size_pt"], 24)
        self.assertEqual(mapped["title"]["before_pt"], 36)
        self.assertTrue(mapped["title"]["italic"])
        self.assertEqual(report["style_resolution"]["Title"]["inheritance"], ["Normal", "JournalTitleParent", "Title"])
        self.assertEqual(path.read_bytes(), before)

    def test_font_size_comes_from_document_defaults_when_style_chain_has_none(self):
        from docx import Document
        from docx.oxml.ns import qn
        path = self.root / "inputs/default-font.docx"
        templates.build_reference(path, templates.layout_spec({}))
        doc = Document(path)
        doc.styles["Normal"].font.size = None
        doc.styles["Title"].base_style = doc.styles["Normal"]
        doc.styles["Title"].font.size = None
        size = doc.styles.element.find("w:docDefaults/w:rPrDefault/w:rPr/w:sz", ast.NS)
        self.assertIsNotNone(size)
        size.set(qn("w:val"), "48")
        doc.save(path)
        mapped, report = templates.map_reference(path)
        self.assertEqual(mapped["body"]["size_pt"], 24)
        self.assertEqual(mapped["title"]["size_pt"], 24)
        self.assertTrue(report["style_resolution"]["Title"]["doc_defaults"])

    def test_inheritance_cycle_missing_parent_and_unmapped_inherited_rule_fail(self):
        from docx import Document
        from docx.enum.style import WD_STYLE_TYPE
        from docx.oxml.ns import qn
        path = self.root / "inputs/bad-inheritance.docx"
        for case in ("cycle", "missing", "unmapped"):
            templates.build_reference(path, templates.layout_spec({}))
            doc = Document(path)
            parent = doc.styles.add_style("JournalTitleParent", WD_STYLE_TYPE.PARAGRAPH)
            parent.base_style = doc.styles["Normal"]
            title = doc.styles["Title"]; title.base_style = parent
            if case == "cycle": parent.base_style = title
            elif case == "missing": title.element.find("w:basedOn", ast.NS).set(qn("w:val"), "MissingParent")
            else: parent.font.underline = True
            doc.save(path)
            with self.subTest(case=case), self.assertRaisesRegex(ValueError, "inheritance cycle|Missing inherited|Unmapped required"):
                templates.map_reference(path)


if __name__ == "__main__":
    unittest.main()
