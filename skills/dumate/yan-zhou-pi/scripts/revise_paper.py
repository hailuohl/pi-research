#!/usr/bin/env python3
"""Exact retained title/body/context revision; formatting is a separate retained stage."""
from __future__ import annotations

import argparse
import difflib
import hashlib
from pathlib import Path
import shutil

import research
import alignment_common as common
import check_revision
import document_ast as ast

ALLOWED_CONTEXT = {"title", "evidence_ids", "claim_ids", "analysis_ids", "figure_ids"}
EXTRA = [Path(ast.__file__), Path(check_revision.__file__)]


def baseline_record(ws, kind, ident):
    selected = common.extension_record(ws, kind, ident)
    if kind == "manuscript":
        return selected, None
    receipt = common.strict_json(selected / "receipt.json")
    manifest = common.strict_json(selected / "layout-manifest.json")
    paper_id = receipt.get("parameters", {}).get("source_paper_id")
    if not paper_id or manifest.get("source_paper_id") != paper_id:
        raise ValueError("Formatted baseline has no unambiguous original manuscript binding")
    paper = common.extension_record(ws, "manuscript", paper_id)
    if manifest.get("source_receipt_sha256") != research.digest(paper / "receipt.json"):
        raise ValueError("Formatted baseline does not bind the current retained manuscript receipt")
    for name in ("paper_context.json", "citation-map.json"):
        if (selected / name).read_bytes() != (paper / name).read_bytes():
            raise ValueError("Formatted baseline context/mapping differs from its original manuscript")
    return paper, selected


def exact_revision(raw, spec, label):
    if not isinstance(spec, dict) or set(spec) != {"baseline_sha256", "edits"} or not isinstance(spec["edits"], list):
        raise ValueError(label + " requires only baseline_sha256 and edits")
    if spec["baseline_sha256"] != hashlib.sha256(raw).hexdigest():
        raise ValueError(label + " baseline_sha256 differs from retained bytes")
    if not spec["edits"]:
        return raw, []
    return check_revision.checked_edits(raw, spec)


def checked_revision(body, context, spec, receipt_sha):
    if not isinstance(spec, dict) or set(spec) != {"schema", "baseline_receipt_sha256", "body", "context"} or spec["schema"] != "yan-zhou-revision-2":
        raise ValueError("Revision spec requires schema, baseline_receipt_sha256, body and context")
    if spec["baseline_receipt_sha256"] != receipt_sha:
        raise ValueError("Revision baseline receipt changed")
    new_body, body_edits = exact_revision(body, spec["body"], "body")
    new_context, context_edits = exact_revision(context, spec["context"], "context")
    before, after = common.strict_json(context), common.strict_json(new_context)
    if not isinstance(before, dict) or not isinstance(after, dict):
        raise ValueError("Context must remain a JSON object")
    if before.get("selected_sources") != after.get("selected_sources"):
        raise ValueError("Selected source scope/order changed; use an explicitly authorized new research scope")
    for key in set(before) | set(after):
        if key not in ALLOWED_CONTEXT and (key not in before or key not in after or before[key] != after[key]):
            raise ValueError("Context field is outside bounded revision: " + key)
    if new_body == body and new_context == context:
        raise ValueError("Revision makes no net byte change")
    return new_body, new_context, body_edits, context_edits


def revision_dependencies(ws, context):
    result = []
    for kind, field in (("sources", "selected_sources"), ("evidence", "evidence_ids"), ("claims", "claim_ids"), ("analysis", "analysis_ids"), ("figures", "figure_ids")):
        ids = context.get(field, [])
        if not isinstance(ids, list): raise ValueError("Invalid context " + field)
        for ident in ids: result.append(common.extension_record(ws, kind, ident))
    return result


def revise_paper(ws, args):
    paper, formatted = baseline_record(ws, args.baseline_kind, args.baseline)
    specpath = ws.input(args.spec, {".json"})
    old_body = (paper / "draft-source.md").read_bytes()
    old_context = (paper / "paper_context.json").read_bytes()
    spec = common.strict_json(specpath)
    new_body, new_context, _, _ = checked_revision(old_body, old_context, spec, research.digest(paper / "receipt.json"))
    deps = [paper] + ([formatted] if formatted else []) + revision_dependencies(ws, common.strict_json(new_context))
    inputs = [specpath, paper / "draft-source.md", paper / "paper_context.json"] + [p / "receipt.json" for p in dict.fromkeys(deps)]
    pandoc_program = ast.executable(args.pandoc, "pandoc")
    params = {"baseline_kind": args.baseline_kind, "baseline_id": args.baseline, "source_paper_id": paper.name, "pandoc_path": pandoc_program, "pandoc_sha256": research.digest(Path(pandoc_program))}
    def run(out):
        current_paper, current_formatted = baseline_record(ws, args.baseline_kind, args.baseline)
        if current_paper != paper or current_formatted != formatted: raise ValueError("Revision baseline binding changed")
        source = (paper / "draft-source.md").read_bytes()
        context_bytes = (paper / "paper_context.json").read_bytes()
        actual_spec = specpath.read_bytes()
        revised_body, revised_context, edits, context_edits = checked_revision(source, context_bytes, common.strict_json(actual_spec), research.digest(paper / "receipt.json"))
        context, records = ast.selected_context(ws, revised_context)
        old, old_records = ast.selected_context(ws, context_bytes)
        original_sources = {key: research.digest(folder / "receipt.json") for key, (folder, _) in old_records["sources"].items()}
        current_sources = {key: research.digest(folder / "receipt.json") for key, (folder, _) in records["sources"].items()}
        if list(original_sources) != list(current_sources) or original_sources != current_sources:
            raise ValueError("Source identities or retained digests changed during revision")
        tree, usage = ast.resolve_tree(ast.parse_markdown(revised_body.decode("utf-8-sig"), pandoc_program, out), records)
        (out / "draft-source.md").write_bytes(revised_body)
        (out / "paper_context.json").write_bytes(revised_context)
        (out / "revision-spec.json").write_bytes(actual_spec)
        research.write_json(out / "document.json", tree)
        research.write_json(out / "citation-map.json", usage)
        # Only source/revision evidence is committed here. The new format step must produce its own PDF.
        research.write_json(out / "export.json", {"exported": [], "gaps": ["Revised source retained; new rich document export has not run"], "method": "exact bounded source revision", "pdf_visual_check": "not_run", "semantic_check": "pending", "independent_review": "not_performed"})
        chain = {"baseline_manuscript": common.relative(ws, paper), "baseline_receipt_sha256": research.digest(paper / "receipt.json"),
                 "baseline_formatted": common.relative(ws, formatted) if formatted else None,
                 "baseline_formatted_receipt_sha256": research.digest(formatted / "receipt.json") if formatted else None,
                 "previous_revision": common.strict_json(paper / "scope-report.json").get("baseline") if (paper / "scope-report.json").is_file() else None}
        if formatted:
            manifest = common.strict_json(formatted / "layout-manifest.json")
            chain["retained_template_id"] = manifest.get("template_id")
            chain["retained_template_receipt_sha256"] = manifest.get("template_receipt_sha256")
            if (formatted / "template.json").is_file():
                shutil.copyfile(formatted / "template.json", out / "retained-template.json")
                chain["retained_layout_sha256"] = research.digest(out / "retained-template.json")
            else:
                chain["retained_legacy_layout"] = manifest.get("layout")
                chain["retained_legacy_format_style"] = manifest.get("format_style")
        else:
            chain["retained_template_id"] = common.strict_json(paper / "receipt.json").get("parameters", {}).get("template_id")
            if (paper / "template.json").is_file():
                shutil.copyfile(paper / "template.json", out / "retained-template.json")
                chain["retained_layout_sha256"] = research.digest(out / "retained-template.json")
            elif (paper / "retained-template.json").is_file():
                shutil.copyfile(paper / "retained-template.json", out / "retained-template.json")
                chain["retained_layout_sha256"] = research.digest(out / "retained-template.json")
        report = {"schema": "yan-zhou-revision-2", "baseline": chain, "scope_check": "pass", "scientific_check": "pending", "visual_check": "not_run", "independent_review": "not_performed",
            "index_unit": "zero-based Unicode code points in original UTF-8 decoded bytes; BOM and CRLF retained", "source_preservation": "all bytes outside explicit original ranges unchanged",
            "body": {"baseline_sha256": hashlib.sha256(source).hexdigest(), "revised_sha256": hashlib.sha256(revised_body).hexdigest(), "edits": edits},
            "context": {"baseline_sha256": hashlib.sha256(context_bytes).hexdigest(), "revised_sha256": hashlib.sha256(revised_context).hexdigest(), "edits": context_edits},
            "selected_sources": context["selected_sources"], "source_receipts": current_sources, "permission_scope": "Mechanical revision verification; no new source acquisition, analysis, scientific approval or sharing authorization"}
        research.write_json(out / "scope-report.json", report)
        for filename, before, after in (("body.diff", source, revised_body), ("context.diff", context_bytes, revised_context)):
            diff = difflib.unified_diff(before.decode("utf-8").splitlines(keepends=True), after.decode("utf-8").splitlines(keepends=True), fromfile="baseline", tofile="revised")
            (out / filename).write_bytes("".join(line if line.endswith("\n") else line + "\n\\ No newline at end of file\n" for line in diff).encode("utf-8"))
        return {"status": "complete", "stage": "revised_source", "scope_check": "pass", "document_export": "not_run", "scientific_check": "pending", "visual_check": "not_run", "independent_review": "not_performed"}
    return common.step(ws, "manuscript", args.id, params, inputs, list(dict.fromkeys(deps)), run, entry=__file__, extra=EXTRA)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True); parser.add_argument("--task", default="T1"); parser.add_argument("--id", required=True)
    parser.add_argument("--baseline", required=True); parser.add_argument("--baseline-kind", choices=("manuscript", "formatted"), default="manuscript")
    parser.add_argument("--spec", required=True); parser.add_argument("--pandoc")
    return common.cli(revise_paper, parser, argv)


if __name__ == "__main__":
    raise SystemExit(main())
