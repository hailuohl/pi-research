"""Render selected physical PDF pages and record explicitly attributed visual observations."""
from __future__ import annotations

import argparse
from pathlib import Path

import alignment_common as common
import research


def render(ws, args):
    if bool(args.source) == bool(args.paper):
        raise ValueError("Select one original source or one generated document")
    if args.source:
        source, metadata, original = common.source_record(ws, args.source, {"full_text", "abstract"})
        binding = {"source_id": args.source, "source_sha256": metadata["sha256"]}
    else:
        source = common.extension_record(ws, args.paper_kind, args.paper)
        original = ws.task_path((source / "manuscript.pdf").relative_to(ws.root), exists=True)
        binding = {"source_id": None, "source_sha256": research.digest(original), "paper_id": args.paper, "paper_kind": args.paper_kind}
    specpath = ws.input(args.spec, {".json"})
    if original.suffix.lower() != ".pdf" or not original.read_bytes().startswith(b"%PDF-"):
        raise ValueError("Select a registered original PDF")
    def run(out):
        import pymupdf
        spec = common.strict_json(specpath)
        if not isinstance(spec, dict) or set(spec) - {"pages", "dpi"}:
            raise ValueError("Page specification accepts only pages and dpi")
        pages, dpi = spec.get("pages"), spec.get("dpi", 144)
        if not isinstance(pages, list) or not pages or len(pages) > 40 or any(type(page) is not int or page < 1 for page in pages) or len(set(pages)) != len(pages):
            raise ValueError("Select 1–40 distinct positive physical page numbers")
        if type(dpi) is not int or not 72 <= dpi <= 200:
            raise ValueError("Page rendering DPI must be 72–200")
        items = []
        with pymupdf.open(original) as document:
            if document.needs_pass or document.is_encrypted:
                raise ValueError("Encrypted PDF is unsupported; retain original and report the gap")
            if not document.is_pdf or any(page > len(document) for page in pages):
                raise ValueError("Physical page is outside the original PDF")
            for number in pages:
                page = document[number - 1]
                if page.rect.width <= 0 or page.rect.height <= 0 or page.rect.width * page.rect.height * (dpi / 72) ** 2 > 25_000_000:
                    raise ValueError("Selected page exceeds the fixed raster size limit")
                image = page.get_pixmap(dpi=dpi, alpha=False, colorspace=pymupdf.csRGB)
                filename = f"page-{number:04d}.png"
                image.save(str(out / filename))
                textfile = f"page-{number:04d}.txt"
                extracted = page.get_text("text")
                (out / textfile).write_text(extracted, encoding="utf-8")
                items.append({"physical_page": number, "image": filename, "image_sha256": research.digest(out / filename),
                              "width_px": image.width, "height_px": image.height, "text_file": textfile,
                              "text_sha256": research.digest(out / textfile), "has_text_layer": bool(extracted.strip()),
                              "actual_view": "not_recorded"})
            total = len(document)
        research.write_json(out / "pages.json", {**binding, "original": common.relative(ws, original),
                                                "physical_page_count": total, "dpi": dpi, "renderer": "PyMuPDF", "renderer_version": pymupdf.VersionBind,
                                                "pages": items, "actual_view": "not_recorded", "scientific_check": "pending",
                                                "limitations": ["Rendering does not establish visual reading", "Physical page numbers may differ from printed labels", "No OCR or automatic panel interpretation"]})
        return {"pages_rendered": len(items), "actual_view": "not_recorded"}
    return common.step(ws, "pages", args.id, binding, [specpath, original, source / "receipt.json"], [source], run, entry=__file__)


def observe(ws, args):
    rendered = common.extension_record(ws, "pages", args.pages)
    specpath = ws.input(args.spec, {".json"})
    def run(out):
        spec = common.strict_json(specpath)
        allowed = {"physical_page", "image_sha256", "observer", "view_evidence", "observation", "limitations"}
        if not isinstance(spec, dict) or set(spec) - allowed or set(spec) != allowed:
            raise ValueError("Observation needs page, exact image digest, observer, actual-view evidence, observation and limitations")
        if type(spec["physical_page"]) is not int or any(not isinstance(spec[key], str) or not spec[key].strip() for key in allowed - {"physical_page"}):
            raise ValueError("Observation must explicitly identify its reading and limitations")
        manifest = common.strict_json(rendered / "pages.json")
        if not manifest.get("source_id"):
            raise ValueError("Document page checks use review_workflow, not bibliographic evidence")
        page = next((item for item in manifest["pages"] if item["physical_page"] == spec["physical_page"]), None)
        if page is None or spec["image_sha256"] != page["image_sha256"]:
            raise ValueError("Observation must bind an actually rendered current-task page")
        _, source_metadata, _ = common.source_record(ws, manifest["source_id"])
        item = {"evidence_id": args.id, "source_id": manifest["source_id"], "source_sha256": manifest["source_sha256"],
                "physical_page": spec["physical_page"], "page_render": args.pages, "page_image_sha256": page["image_sha256"],
                "kind": "visual_observation", "content_level": source_metadata["content_level"], "quote": "", "context": spec["observation"],
                "method": "attributed visual observation; not a machine-verified text quote", "observer": spec["observer"],
                "view_evidence": spec["view_evidence"], "actual_view": "reported_by_observer", "attestation_check": "not_machine_verified",
                "limitations": spec["limitations"], "scientific_check": "pending"}
        research.write_json(out / "evidence.json", item)
        research.write_csv(out / "evidence.csv", [item], list(item))
        return {"actual_view": "reported_by_observer", "attestation_check": "not_machine_verified", "scientific_check": "pending"}
    return common.step(ws, "evidence", args.id, {"pages": args.pages}, [specpath, rendered / "receipt.json"], [rendered], run, entry=__file__)


def parser():
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--workspace", required=True); result.add_argument("--task", default="T1")
    sub = result.add_subparsers(dest="command", required=True)
    item = sub.add_parser("render"); item.add_argument("--id", required=True); item.add_argument("--source"); item.add_argument("--paper"); item.add_argument("--paper-kind", choices=("manuscript", "formatted"), default="formatted"); item.add_argument("--spec", required=True)
    item = sub.add_parser("observe"); item.add_argument("--id", required=True); item.add_argument("--pages", required=True); item.add_argument("--spec", required=True)
    return result


def main(argv=None):
    return common.cli(lambda ws, args: {"render": render, "observe": observe}[args.command](ws, args), parser(), argv)


if __name__ == "__main__":
    raise SystemExit(main())
