"""Bind attributed checks to the actual exported manuscript; checks do not judge themselves."""
from __future__ import annotations

import argparse
from pathlib import Path

import alignment_common as common
import format_paper
import research

CHECKS = ("scientific", "figure_visual", "pdf_visual", "independent_review")
STATES = {"pass", "fail", "pending", "not_run", "not_performed"}
DOCUMENTS = {"manuscript.md", "manuscript.docx", "manuscript.pdf"}


def generation_manifest(ws, paper, kind):
    receipt = common.strict_json(paper / "receipt.json")
    outputs = receipt["outputs"]
    exportpath = paper / "export.json"
    if exportpath.exists() and common.relative(ws, exportpath) not in outputs:
        raise ValueError("export.json is not declared by the manuscript receipt")
    manifestpath = exportpath if common.relative(ws, exportpath) in outputs else paper / "layout-manifest.json"
    relative = common.relative(ws, manifestpath)
    if relative not in outputs:
        raise ValueError("Generation manifest is not declared by the manuscript receipt")
    if research.digest(ws.task_path(relative, exists=True)) != outputs[relative]:
        raise ValueError("Generation manifest digest changed")
    manifest = common.strict_json(manifestpath)
    if not isinstance(manifest, dict):
        raise ValueError("Generation manifest must be an object")
    inputs = [manifestpath]
    if manifestpath == exportpath:
        exported = manifest.get("exported")
        if not isinstance(exported, list) or any(not isinstance(name, str) for name in exported) or not DOCUMENTS.issubset(exported):
            raise ValueError("Complete document export is required; revised-source stage needs a new formatted version")
        required = [paper / name for name in DOCUMENTS | {"paper_context.json"}]
        required += [file for file in paper.iterdir() if file.suffix.lower() == ".png"]
        for file in required:
            if common.relative(ws, file) not in outputs:
                raise ValueError("Reviewed file is not declared by the manuscript receipt: " + file.name)
        gaps, manifest_kind = manifest.get("gaps"), "export"
    else:
        if kind != "formatted" or manifest.get("version") != "1.0.2" or manifest.get("format_style") != format_paper.FORMAT_STYLE:
            raise ValueError("Unsupported legacy generation manifest")
        params = receipt["parameters"]
        for key in ("formatter_sha256", "format_style", "source_paper_id", "noto_font_sha256"):
            if key not in manifest or key not in params or manifest[key] != params[key]:
                raise ValueError("Legacy generation manifest differs from receipt parameter: " + key)
        if manifest["formatter_sha256"] != research.digest(Path(format_paper.__file__)) or manifest.get("helper_sha256") != format_paper.HELPER_SHA256 or receipt["script_sha256"] != format_paper.HELPER_SHA256:
            raise ValueError("Legacy formatter/helper code binding changed")
        source_id = manifest["source_paper_id"]
        if not isinstance(source_id, str) or not source_id:
            raise ValueError("Legacy generation manifest requires its source manuscript")
        source = common.extension_record(ws, "manuscript", source_id)
        source_receipt = source / "receipt.json"
        source_relative = common.relative(ws, source_receipt)
        source_sha = research.digest(source_receipt)
        if manifest.get("source_receipt_sha256") != source_sha or receipt["inputs"].get(source_relative) != source_sha or source_relative not in receipt.get("dependencies", []):
            raise ValueError("Legacy generation manifest does not bind its source receipt dependency")
        inputs.append(source_receipt)
        files = manifest.get("files")
        if not isinstance(files, dict) or not (DOCUMENTS | {"paper_context.json", "citation-map.json"}).issubset(files):
            raise ValueError("Incomplete legacy exported files")
        actual = {file.name for file in paper.iterdir() if file.is_file() and file.name not in {"receipt.json", "layout-manifest.json"}}
        if set(files) != actual or set(outputs) != {common.relative(ws, paper / name) for name in files} | {relative}:
            raise ValueError("Legacy exported files differ from the actual receipt-bound files")
        for filename, metadata in files.items():
            path = ws.task_path(common.relative(ws, paper / filename), exists=True)
            if not isinstance(metadata, dict) or set(metadata) != {"sha256", "size"} or type(metadata["size"]) is not int or metadata["size"] != path.stat().st_size or metadata["sha256"] != research.digest(path) or metadata["sha256"] != outputs[common.relative(ws, path)]:
                raise ValueError("Legacy exported file metadata changed: " + filename)
        context = common.strict_json(paper / "paper_context.json")
        usage = common.strict_json(paper / "citation-map.json")
        figures = usage.get("figures") if isinstance(usage, dict) else None
        if not isinstance(context, dict) or not isinstance(figures, list) or any(not isinstance(key, str) for key in figures) or len(figures) != len(set(figures)) or not isinstance(manifest.get("figures"), dict):
            raise ValueError("Malformed legacy source/figure mapping")
        if manifest.get("selected_sources") != context.get("selected_sources") or manifest.get("actually_cited") != usage.get("citations") or set(manifest["figures"]) != set(figures) or {name for name in files if name.lower().endswith(".png")} != {key + ".png" for key in figures}:
            raise ValueError("Legacy generation manifest differs from its source/figure mapping")
        source_outputs = common.strict_json(source_receipt)["outputs"]
        for filename in ["manuscript.md", "paper_context.json", "citation-map.json"] + [key + ".png" for key in figures]:
            source_file = source / filename
            if common.relative(ws, source_file) not in source_outputs or research.digest(ws.task_path(common.relative(ws, source_file), exists=True)) != files[filename]["sha256"]:
                raise ValueError("Legacy formatted content differs from its retained source: " + filename)
        gaps, manifest_kind = manifest.get("layout_gaps"), "legacy_layout_1.0.2"
    if not isinstance(gaps, list) or any(not isinstance(gap, str) for gap in gaps):
        raise ValueError("Generation manifest must retain its explicit gap list")
    binding = {"path": relative, "sha256": outputs[relative], "kind": manifest_kind}
    return gaps, binding, inputs


def record(ws, args):
    paper = common.extension_record(ws, args.kind, args.paper)
    specpath = ws.input(args.spec, {".json"})
    generation_gaps, manifest_binding, manifest_inputs = generation_manifest(ws, paper, args.kind)
    def run(out):
        current_gaps, current_binding, _ = generation_manifest(ws, paper, args.kind)
        if current_binding != manifest_binding or current_gaps != generation_gaps:
            raise ValueError("Generation manifest changed during review preparation")
        spec = common.strict_json(specpath)
        if not isinstance(spec, dict) or set(spec) - set(CHECKS):
            raise ValueError("Select only the four distinct document check types")
        images = [file for file in paper.iterdir() if file.suffix.lower() == ".png"]
        required = {"scientific": [paper / "manuscript.md", paper / "paper_context.json"],
                    "figure_visual": images, "pdf_visual": [paper / "manuscript.pdf"],
                    "independent_review": [paper / "manuscript.md", paper / "manuscript.pdf"]}
        reports = {}
        for key in CHECKS:
            check = spec.get(key, {"status": "not_performed" if key == "independent_review" else "not_run"})
            if not isinstance(check, dict) or set(check) - {"status", "notes", "reviewed_sha256", "actor", "review_mode", "view_evidence"} or check.get("status") not in STATES:
                raise ValueError("Malformed document check: " + key)
            status = check["status"]
            if status in {"pass", "fail", "pending"}:
                if any(not isinstance(check.get(field), str) or not check[field].strip() for field in ("notes", "actor", "review_mode")):
                    raise ValueError("Performed checks need actual actor, mode and findings")
                mode = "independent_review" if key == "independent_review" else "self_check"
                if check["review_mode"] != mode:
                    raise ValueError("Keep self-check and independent-review identities distinct")
                hashes = check.get("reviewed_sha256")
                if not isinstance(hashes, dict) or not hashes:
                    raise ValueError("Performed check must bind its actual inspected files")
                for filename, expected in hashes.items():
                    selected = ws.path(filename, exists=True)
                    if research.digest(selected) != expected:
                        raise ValueError("Inspected file digest changed: " + filename)
                if status == "pass" and any(hashes.get(common.relative(ws, path)) != research.digest(path) for path in required[key]):
                    raise ValueError("Passing check does not cover the current required files: " + key)
                if key in {"figure_visual", "pdf_visual"} and (not isinstance(check.get("view_evidence"), str) or not check["view_evidence"].strip()):
                    raise ValueError("Visual check needs actual page/image viewing evidence")
            reports[key] = {**check, "attestation_check": "attributed; not machine-verified judgment"}
        independent = reports["independent_review"]
        if independent["status"] in {"pass", "fail", "pending"} and independent.get("actor") in {reports[key].get("actor") for key in CHECKS[:-1]}:
            raise ValueError("A self-check actor cannot also claim the independent review")
        files = {common.relative(ws, file): research.digest(file) for file in (paper / "manuscript.md", paper / "manuscript.docx", paper / "manuscript.pdf", paper / "paper_context.json")}
        failed = any(check["status"] == "fail" for check in reports.values())
        passed = all(reports[key]["status"] == "pass" for key in CHECKS[:-1])
        status = "failed_checks" if failed else "complete" if passed and not generation_gaps else "partial"
        research.write_json(out / "review.json", {"paper_id": args.paper, "paper_kind": args.kind, "files": files, "checks": reports,
                                                 "generation_manifest": manifest_binding, "generation_gaps": generation_gaps, "status": status,
                                                 "limitations": ["Hash coverage checks identity, not scientific correctness or image delivery", "No automatic independent actor or approval is created"]})
        return {"status": status, "checks": {key: value["status"] for key, value in reports.items()}}
    return common.step(ws, "reviews", args.id, {"paper": args.paper, "kind": args.kind, "generation_manifest": manifest_binding}, [specpath, paper / "receipt.json", *manifest_inputs], [paper], run, entry=__file__, extra=[format_paper.__file__])


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True); parser.add_argument("--task", default="T1")
    parser.add_argument("--id", required=True); parser.add_argument("--paper", required=True)
    parser.add_argument("--kind", choices=("manuscript", "formatted"), default="formatted"); parser.add_argument("--spec", required=True)
    return common.cli(record, parser, argv)


if __name__ == "__main__":
    raise SystemExit(main())
