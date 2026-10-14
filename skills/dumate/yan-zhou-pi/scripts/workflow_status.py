"""Read-only capability and extended receipt checks; never clears locks or pending attempts."""
from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import sys

import alignment_common as common
import research


def preflight():
    modules = {name: importlib.util.find_spec(name) is not None for name in ("numpy", "scipy", "matplotlib", "docx", "reportlab", "PIL", "pypdf", "pymupdf", "fontTools", "lxml")}
    programs = {name: shutil.which(name) for name in ("pandoc", "xelatex")}
    return {"version": "1.1.0", "modules": modules, "programs": programs,
            "capabilities": {"public_literature": True, "planning": True, "statistics": modules["numpy"] and modules["scipy"],
                             "charts": all(modules[name] for name in ("numpy", "scipy", "matplotlib", "fontTools")), "pdf_pages": modules["pymupdf"],
                             "rich_document": all(modules[name] for name in ("docx", "lxml", "PIL", "pypdf")) and all(programs.values()), "strict_revision": True},
            "remaining_environment_checks": ["Actual TeX packages and installed template fonts are checked during conversion", "Public provider HTTP access is checked only when selected", "Scientific, visual and independent checks need actual task review"],
            "permission_scope": "Task-local script boundary; no DuMate platform sandbox or permissions are changed"}


def status(ws):
    records = []
    for kind in sorted(ws.task.iterdir()):
        if not kind.is_dir() or kind.name.startswith("."):
            continue
        for folder in sorted(kind.iterdir()):
            if not folder.is_dir() or folder.name.startswith(".") or not (folder / "receipt.json").is_file():
                continue
            try:
                common.extension_record(ws, kind.name, folder.name)
                receipt = common.strict_json(folder / "receipt.json")
                records.append({"kind": kind.name, "id": folder.name, "status": receipt["status"], "digests": "match"})
            except Exception as error:
                records.append({"kind": kind.name, "id": folder.name, "status": "invalid", "error": str(error)})
    pending = research.pending_attempts(ws.root)
    failed = [common.relative(ws, file) for file in ws.task.glob("*/.failed-*/failure.json")]
    interrupted = [common.relative(ws, file) for file in ws.task.glob("*/.interrupted-*/failure.json")]
    return {"task": ws.task_id, "steps": records, "writer_lock": (ws.root / ".yan-zhou-pi.lock").exists(),
            "pending": [common.relative(ws, path) for path in pending], "failed": failed, "interrupted": interrupted,
            "reopen": "Read original process state before any write if lock/pending exists; no automatic unlock/restart", "scope": "Current task only; history and normal filesystem protection remain required"}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("preflight", "status")); parser.add_argument("--workspace"); parser.add_argument("--task", default="T1")
    args = parser.parse_args(argv)
    try:
        if args.command == "status" and not args.workspace: raise ValueError("Status requires selected workspace")
        result = preflight() if args.command == "preflight" else status(research.Workspace(args.workspace, args.task))
        print(json.dumps(result, ensure_ascii=False, allow_nan=False)); return 0
    except Exception as error:
        print(json.dumps({"status": "failed", "error": str(error)}, ensure_ascii=False), file=sys.stderr); return 1


if __name__ == "__main__":
    raise SystemExit(main())
