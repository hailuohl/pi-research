#!/usr/bin/env python3
"""Check an explicit edit list against two retained manuscript source versions."""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
from pathlib import Path
import re
import sys

import research


def checked_edits(source, spec):
    if not isinstance(spec, dict) or set(spec) != {"baseline_sha256", "edits"}:
        raise ValueError("Spec requires only baseline_sha256 and edits")
    if spec["baseline_sha256"] != hashlib.sha256(source).hexdigest():
        raise ValueError("Spec baseline_sha256 does not match the retained source")
    text = source.decode("utf-8")
    edits = spec["edits"]
    if not isinstance(edits, list) or not edits:
        raise ValueError("An explicit nonempty edit list is required")
    checked = []
    for edit in edits:
        if not isinstance(edit, dict) or set(edit) != {"start", "old", "new"}:
            raise ValueError("Each edit requires only start, old and new")
        start, old, new = edit["start"], edit["old"], edit["new"]
        if type(start) is not int or start < 0:
            raise ValueError("Edit start must be a nonnegative integer Unicode code-point index")
        if not isinstance(old, str) or not old or not isinstance(new, str) or old == new:
            raise ValueError("Edit old must be nonempty and new must be a different string")
        end = start + len(old)
        if end > len(text) or text[start:end] != old:
            raise ValueError("Edit old does not match the specified baseline range")
        checked.append({"start": start, "end": end, "old": old, "new": new,
                        "old_match_count": sum(1 for _ in re.finditer("(?=" + re.escape(old) + ")", text))})
    checked.sort(key=lambda edit: edit["start"])
    cursor, parts = 0, []
    for edit in checked:
        if edit["start"] < cursor:
            raise ValueError("Edit ranges overlap in the original baseline")
        parts.extend((text[cursor:edit["start"]], edit["new"]))
        cursor = edit["end"]
    parts.append(text[cursor:])
    expected = "".join(parts).encode("utf-8")
    if expected == source:
        raise ValueError("Edit list makes no net source change")
    return expected, checked


def check_revision(ws, args):
    baseline = ws.record("manuscript", args.baseline)
    paper = ws.record("manuscript", args.paper)
    specpath = ws.input(args.spec, {".json"})
    files = [specpath] + [ws.task_path((folder / name).relative_to(ws.root), exists=True)
                             for folder in (baseline, paper)
                             for name in ("receipt.json", "draft-source.md", "paper_context.json")]
    initial = {path: research.digest(path) for path in files}
    params = {"baseline": args.baseline, "paper": args.paper,
              "check_revision_sha256": research.digest(Path(__file__))}

    def run(out):
        # Revalidate under execute's workspace lock, rather than trusting pre-lock reads.
        ws.record("manuscript", args.baseline)
        ws.record("manuscript", args.paper)
        current_spec = ws.input(args.spec, {".json"})
        if current_spec != specpath:
            raise ValueError("Spec path changed during revision check")
        snapshot = {path: ws.path(path.relative_to(ws.root), exists=True).read_bytes() for path in files}
        if any(hashlib.sha256(data).hexdigest() != initial[path] for path, data in snapshot.items()):
            raise ValueError("Revision inputs changed during the check; retain them and use a new version")
        old_source = snapshot[baseline / "draft-source.md"]
        new_source = snapshot[paper / "draft-source.md"]
        old_context = snapshot[baseline / "paper_context.json"]
        if old_context != snapshot[paper / "paper_context.json"]:
            raise ValueError("Paper context changed; selected source and evidence scope must remain byte-identical")
        spec = json.loads(snapshot[specpath].decode("utf-8-sig"))
        expected, edits = checked_edits(old_source, spec)
        if expected != new_source:
            raise ValueError("New manuscript has extra changes or does not apply exactly the explicit edit list")
        relative = lambda path: str(path.relative_to(ws.root)).replace("\\", "/")
        report = {"baseline": {"path": relative(baseline / "draft-source.md"), "sha256": hashlib.sha256(old_source).hexdigest()},
                  "paper": {"path": relative(paper / "draft-source.md"), "sha256": hashlib.sha256(new_source).hexdigest()},
                  "summary": {"edit_count": len(edits), "baseline_bytes": len(old_source), "paper_bytes": len(new_source)},
                  "source_preservation": "all bytes outside the explicit baseline ranges are unchanged",
                  "context_preservation": {"status": "pass", "sha256": hashlib.sha256(old_context).hexdigest()},
                  "index_unit": "zero-based Unicode code points in UTF-8 decoded original source (including BOM and CRLF)",
                  "edits": edits, "scope_check": "pass", "scientific_check": "pending",
                  "visual_check": "pending", "independent_review": "not_performed",
                  "permission_scope": "Mechanical verification only; grants no modification or sharing permission"}
        research.write_json(out / "revision-check.json", report)
        (out / "edits.json").write_bytes(snapshot[specpath])
        diff = difflib.unified_diff(old_source.decode("utf-8").splitlines(keepends=True),
                                    new_source.decode("utf-8").splitlines(keepends=True),
                                    fromfile=report["baseline"]["path"], tofile=report["paper"]["path"])
        lines = [line if line.endswith("\n") else line + "\n\\ No newline at end of file\n" for line in diff]
        (out / "diff.txt").write_bytes("".join(lines).encode("utf-8"))
        return {"scope_check": "pass", "scientific_check": "pending", "visual_check": "pending",
                "independent_review": "not_performed"}

    return research.execute(ws, "revisions", args.id, params, files, [baseline, paper], run)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--task", default="T1")
    for name in ("baseline", "paper", "id", "spec"):
        parser.add_argument("--" + name, required=True)
    args = parser.parse_args(argv)
    try:
        result = check_revision(research.Workspace(args.workspace, args.task), args)
        print(json.dumps(result, ensure_ascii=False, allow_nan=False))
        return 0
    except (KeyboardInterrupt, SystemExit) as exc:
        print(json.dumps({"status": "interrupted", "error": str(exc), "exception_type": type(exc).__name__}, ensure_ascii=False), file=sys.stderr)
        return 130
    except Exception as exc:
        print(json.dumps({"status": "failed", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
