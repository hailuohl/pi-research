"""Isolated synthetic fixtures; no network calls or existing research data."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import alignment_common as common
import literature_workflow as literature
import pdf_pages
import research
import review_workflow
import workflow_status


class AlignmentIOTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-alignment-io-")
        self.root = Path(self.temp.name) / "workspace"
        research.init(argparse.Namespace(workspace=str(self.root), task="T1", question="Synthetic software fixture only"))
        self.ws = research.Workspace(self.root, "T1")

    def tearDown(self):
        self.temp.cleanup()

    def input(self, name, value):
        path = self.root / "inputs" / name
        path.write_text(json.dumps(value) if isinstance(value, (dict, list)) else value, encoding="utf-8")
        return "inputs/" + name

    def test_json_csv_boundaries_and_recursive_code_identity(self):
        for raw in ('{"a":1,"a":2}', '{"a":NaN}', '{"a":Infinity}'):
            with self.assertRaises(ValueError): common.strict_json(raw)
        selected = self.input("bad.csv", 'x,y\n"broken,1\n')
        with self.assertRaises(ValueError): common.csv_rows(self.ws.path(selected, exists=True), ("x", "y"))
        def write(out):
            research.write_json(out / "value.json", {"synthetic": True}); return {}
        first = common.step(self.ws, "observations", "O1", {}, [], [], write, entry=literature.__file__)
        second = common.step(self.ws, "summaries", "M1", {}, [], [Path(first["path"])], write, entry=review_workflow.__file__)
        self.assertEqual(common.extension_record(self.ws, "summaries", "M1"), Path(second["path"]))
        original = research.digest
        with patch.object(research, "digest", side_effect=lambda path: "changed" if Path(path).resolve() == Path(literature.__file__).resolve() else original(path)):
            with self.assertRaisesRegex(ValueError, "Extension code changed"): common.extension_record(self.ws, "summaries", "M1")
        self.assertTrue(workflow_status.status(self.ws)["steps"])

    def test_literature_partial_merge_budget_reopen_and_no_fake_reading(self):
        spec = {"query": "Synthetic method", "sources": ["crossref", "pubmed"], "difficulty": 5}
        filename = self.input("search.json", spec)
        args = argparse.Namespace(spec=filename, id="L1", previous=None)
        hit = {"source": "crossref", "provider_id": "10.1234/fixture", "doi": "10.1234/fixture", "title": "Synthetic method fixture", "year": "unknown", "authors": "Fixture", "content_level": "metadata", "url": "https://doi.org/10.1234/fixture", "version": "provider-record", "abstract": ""}
        def fake(provider, spec, requests):
            if provider == "pubmed": raise ValueError("Synthetic provider unavailable")
            return [hit, {**hit, "source": "pubmed"}]
        with patch.object(literature, "provider_search", side_effect=fake): result = literature.search(self.ws, args)
        folder = Path(result["path"])
        self.assertEqual(result["status"], "partial")
        candidates = common.strict_json(folder / "candidates.json")
        self.assertEqual(len(candidates), 1)
        self.assertEqual(len(candidates[0]["duplicates"]), 1)
        with patch.object(literature, "provider_search", side_effect=AssertionError("Reopen must not contact provider")):
            self.assertTrue(literature.search(self.ws, args)["reused"])
        reading = literature.read_paper(self.ws, argparse.Namespace(search="L1", candidate="C1", spec=self.input("read.json", {"mode": "record"}), id="R1"))
        paper = common.strict_json(Path(reading["path"]) / "paper.json")
        self.assertEqual(paper["content_level"], "metadata")
        self.assertEqual(paper["actual_reading"], "not_recorded")
        selection = literature.select_reading(self.ws, argparse.Namespace(reading="R1", spec=self.input("selection.json", {"selection_reason": "Synthetic candidate selection only"}), id="S1"))
        self.assertEqual(common.source_record(self.ws, "S1")[1]["content_level"], "metadata")
        self.assertTrue((Path(selection["path"]) / "original.md").is_file())
        for invalid in ({**spec, "round": 2}, {**spec, "cycle": 5}, {**spec, "published_after": "2026-02-30"}, {**spec, "api_key": "never store"}):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError): literature.search(self.ws, argparse.Namespace(spec=self.input("invalid.json", invalid), id="BAD", previous=None))

    def test_provider_parsers_and_redirect_boundary(self):
        raw = b'<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>123</PMID><Article><ArticleTitle>Synthetic article</ArticleTitle><Abstract><AbstractText>Fixture abstract.</AbstractText></Abstract><Journal><JournalIssue><PubDate><Year>2026</Year></PubDate></JournalIssue></Journal></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>'
        self.assertEqual(literature.pubmed_hits(raw)[0]["content_level"], "abstract")
        catalog = b'<!DOCTYPE PubmedArticleSet PUBLIC "-//NLM//DTD PubMedArticle, 1st January 2025//EN" "https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_250101.dtd">'
        self.assertEqual(literature.pubmed_hits(catalog + raw)[0]["provider_id"], "123")
        with self.assertRaises(ValueError): literature.pubmed_hits(b'<!DOCTYPE PubmedArticleSet [<!ENTITY x "expansion">]>' + raw)
        with self.assertRaises(ValueError): literature.xml(b'<!DOCTYPE a [<!ENTITY x SYSTEM "file:///private">]><a/>')
        with self.assertRaises(UnicodeError): literature.xml('<!DOCTYPE a [<!ENTITY x "expansion">]><a>&x;</a>'.encode("utf-16"))
        for encoding in ("utf-16-le", "utf-16-be", "utf-32-le", "utf-32-be"):
            with self.subTest(encoding=encoding), self.assertRaises(ValueError): literature.xml('<!DOCTYPE a [<!ENTITY x "expansion">]><a>&x;</a>'.encode(encoding))
        for url in ("http://api.crossref.org/works", "https://localhost/private", "https://api.crossref.org:444/works", "https://secret@api.crossref.org/works"):
            with self.subTest(url=url), self.assertRaises(ValueError): literature.validate_url(url)
        literature.validate_url("https://api.crossref.org/works")
        with self.assertRaises(ValueError): literature.credentials({"credential_env": {"openalex": "OTHER_KEY"}}, "openalex")

    def pdf_source(self, level="full_text"):
        import pymupdf
        file = self.root / "inputs" / "synthetic.pdf"
        with pymupdf.open() as document:
            for text in ("Synthetic first page", "Synthetic second page"):
                page = document.new_page(width=300, height=400); page.insert_text((25, 40), text)
            document.save(file)
        meta = self.input("pdf-meta.json", {"title": "Synthetic PDF", "authors": "Software fixture", "year": "unknown", "content_level": level, "selection_reason": "Page-render software test", "license": "synthetic"})
        literature.register_local(self.ws, argparse.Namespace(file="inputs/synthetic.pdf", metadata=meta, id="S1"))
        return file

    def test_abstract_page_observation_does_not_upgrade_its_source(self):
        self.pdf_source("abstract")
        output = pdf_pages.render(self.ws, argparse.Namespace(source="S1", paper=None, paper_kind="formatted", spec=self.input("abstract-page.json", {"pages": [1]}), id="P1"))
        page = common.strict_json(Path(output["path"]) / "pages.json")["pages"][0]
        spec = {"physical_page": 1, "image_sha256": page["image_sha256"], "observer": "Synthetic observer", "view_evidence": "Synthetic fixture attestation only", "observation": "Abstract-level observation", "limitations": "Only an abstract; no full-text claim"}
        evidence = pdf_pages.observe(self.ws, argparse.Namespace(pages="P1", spec=self.input("abstract-observation.json", spec), id="E1"))
        self.assertEqual(common.strict_json(Path(evidence["path"]) / "evidence.json")["content_level"], "abstract")

    def test_requested_pdf_version_identity_survives_source_selection(self):
        original = self.pdf_source()
        hit = {"source": "arxiv", "provider_id": "2301.01234v1", "arxiv_id": "2301.01234v1", "title": "Synthetic versioned source", "year": "unknown", "authors": "Fixture", "content_level": "abstract", "url": "https://arxiv.org/abs/2301.01234v1", "version": "1"}
        with patch.object(literature, "provider_search", return_value=[hit]):
            literature.search(self.ws, argparse.Namespace(spec=self.input("version-search.json", {"query": "Synthetic version source", "sources": ["arxiv"]}), id="L1", previous=None))
        urls = []
        def response(self, url, params=None, headers=None):
            urls.append(url); return original.read_bytes(), "application/pdf"
        with patch.object(literature.Requests, "get", response):
            read = literature.read_paper(self.ws, argparse.Namespace(search="L1", candidate="C1", spec=self.input("version-read.json", {"mode": "pdf", "version": "2"}), id="R1"))
        paper = common.strict_json(Path(read["path"]) / "paper.json")
        self.assertEqual(urls, ["https://arxiv.org/pdf/2301.01234v2"])
        self.assertEqual(paper["version"], "2")
        self.assertEqual(paper["discovery_version"], "1")
        self.assertEqual(paper["resolved_id"], "2301.01234v2")
        selection = literature.select_reading(self.ws, argparse.Namespace(reading="R1", spec=self.input("version-select.json", {"selection_reason": "Explicit version2 synthetic fixture"}), id="S2"))
        metadata = common.strict_json(Path(selection["path"]) / "source.json")
        self.assertEqual(metadata["version"], "2")
        self.assertEqual(metadata["url"], "https://arxiv.org/abs/2301.01234v2")
        self.assertEqual(metadata["resolved_id"], paper["resolved_id"])
        self.assertEqual(metadata["requested_id"], "2301.01234v1")

    def test_pdf_physical_pages_and_visual_attestation_remain_distinct(self):
        self.pdf_source()
        args = argparse.Namespace(source="S1", paper=None, paper_kind="formatted", spec=self.input("pages.json", {"pages": [2], "dpi": 100}), id="P1")
        output = pdf_pages.render(self.ws, args)
        folder = Path(output["path"]); manifest = common.strict_json(folder / "pages.json")
        page = manifest["pages"][0]
        self.assertEqual(page["physical_page"], 2)
        self.assertIn("second", (folder / page["text_file"]).read_text())
        self.assertEqual(manifest["actual_view"], "not_recorded")
        self.assertTrue(pdf_pages.render(self.ws, args)["reused"])
        observation = {"physical_page": 2, "image_sha256": page["image_sha256"], "observer": "Synthetic fixture actor", "view_evidence": "Fixture simulates attributed evidence; no actual review", "observation": "Synthetic observation for schema validation", "limitations": "Software fixture only"}
        evidence = pdf_pages.observe(self.ws, argparse.Namespace(pages="P1", spec=self.input("observation.json", observation), id="E1"))
        saved = common.strict_json(Path(evidence["path"]) / "evidence.json")
        self.assertEqual(saved["quote"], "")
        self.assertEqual(saved["actual_view"], "reported_by_observer")
        self.assertEqual(saved["attestation_check"], "not_machine_verified")
        with self.assertRaises(ValueError): pdf_pages.observe(self.ws, argparse.Namespace(pages="P1", spec=self.input("wrong-image.json", {**observation, "image_sha256": "0" * 64}), id="E2"))
        with self.assertRaises(ValueError): pdf_pages.render(self.ws, argparse.Namespace(source="S1", paper=None, paper_kind="formatted", spec=self.input("outside-page.json", {"pages": [3]}), id="P2"))
        self.assertTrue(list((self.ws.task / "pages").glob(".failed-*/failure.json")))

    def document_fixture(self):
        def write(out):
            for name in ("manuscript.md", "manuscript.pdf", "manuscript.docx"): (out / name).write_text("Synthetic identity check fixture, not real exported content", encoding="utf-8")
            research.write_json(out / "paper_context.json", {"title": "Synthetic identity check", "selected_sources": []})
            research.write_json(out / "export.json", {"exported": ["manuscript.md", "manuscript.pdf", "manuscript.docx"], "gaps": []})
            return {}
        return Path(common.step(self.ws, "formatted", "F1", {}, [], [], write, entry=review_workflow.__file__)["path"])

    def test_review_identity_missing_checks_and_false_independence(self):
        folder = self.document_fixture()
        args = argparse.Namespace(kind="formatted", paper="F1", id="O1", spec=self.input("checks.json", {}))
        output = review_workflow.record(self.ws, args)
        self.assertEqual(output["status"], "partial")
        hashes = {common.relative(self.ws, p): research.digest(p) for p in folder.iterdir() if p.suffix in {".md", ".pdf", ".docx", ".json"}}
        check = {"status": "pass", "notes": "Synthetic hash-coverage fixture only", "reviewed_sha256": hashes, "actor": "fixture-self", "review_mode": "self_check", "view_evidence": "Fixture only; no actual visual check"}
        bad = {"scientific": check, "independent_review": {**check, "review_mode": "independent_review"}}
        with self.assertRaisesRegex(ValueError, "self-check actor"): review_workflow.record(self.ws, argparse.Namespace(kind="formatted", paper="F1", id="O2", spec=self.input("same-actor.json", bad)))
        with self.assertRaisesRegex(ValueError, "digest changed"): review_workflow.record(self.ws, argparse.Namespace(kind="formatted", paper="F1", id="O3", spec=self.input("bad-sha.json", {"scientific": {**check, "reviewed_sha256": {common.relative(self.ws, folder / "manuscript.md"): "0" * 64}}})))


if __name__ == "__main__":
    unittest.main()
