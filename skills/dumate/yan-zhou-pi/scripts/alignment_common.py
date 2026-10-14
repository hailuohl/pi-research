"""Shared boundaries for the new standalone alignment commands; legacy bytes stay frozen."""
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
from pathlib import Path
import sys

import research

PACKAGE = Path(__file__).resolve().parents[1]


def strict_json(value):
    raw = value.read_bytes() if isinstance(value, Path) else value
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8-sig")
    def pairs(items):
        result = {}
        for key, item in items:
            if key in result:
                raise ValueError("Duplicate JSON key: " + key)
            result[key] = item
        return result
    def invalid(number):
        raise ValueError("Non-finite JSON number: " + number)
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid)


def code_hashes(entry, extra=()):
    paths = [Path(entry).resolve(), Path(__file__).resolve(), PACKAGE / "scripts/research.py", *map(Path, extra)]
    return {str(path.resolve().relative_to(PACKAGE)).replace("\\", "/"): research.digest(path) for path in dict.fromkeys(paths)}


def step(ws, kind, name, parameters, inputs, dependencies, operation, *, entry, extra=()):
    paths = [ws.path(Path(path).relative_to(ws.root), exists=True) for path in inputs]
    initial = {path: research.digest(path) for path in paths}
    parameters = {**parameters, "extension_code": code_hashes(entry, extra)}
    for dependency in dependencies:
        extension_record(ws, dependency.parent.name, dependency.name)
    def guarded(out):
        for path, expected in initial.items():
            actual = ws.path(path.relative_to(ws.root), exists=True)
            if actual != path or research.digest(actual) != expected:
                raise ValueError("Selected input changed during preparation; retain history and use a new version")
        if code_hashes(entry, extra) != parameters["extension_code"]:
            raise ValueError("Extension code changed during preparation; use a retained release or a new version")
        for dependency in dependencies:
            extension_record(ws, dependency.parent.name, dependency.name)
        return operation(out)
    return research.execute(ws, kind, name, parameters, paths, dependencies, guarded)


def extension_record(ws, kind, name, *, entry=None, extra=()):
    folder = ws.record(kind, name)
    seen = set()
    def check(current):
        if current in seen:
            return
        seen.add(current)
        receipt = strict_json(current / "receipt.json")
        bound = receipt.get("parameters", {}).get("extension_code", {})
        for filename, expected in bound.items():
            path = (PACKAGE / filename).resolve()
            if not path.is_relative_to(PACKAGE) or not path.is_file() or research.digest(path) != expected:
                raise ValueError("Extension code changed: " + filename + "; use retained release or a new version")
        for dependency in receipt.get("dependencies", []):
            check(ws.task_path(dependency, exists=True).parent)
    check(folder)
    return folder


def source_record(ws, source_id, levels=None):
    folder = extension_record(ws, "sources", source_id)
    metadata = strict_json(folder / "source.json")
    if levels is not None and metadata.get("content_level") not in levels:
        raise ValueError("Selected source has an unsuitable content level")
    path = ws.path(metadata["file"], exists=True)
    if research.digest(path) != metadata.get("sha256"):
        raise ValueError("Selected source bytes changed")
    return folder, metadata, path


def csv_rows(path, required=(), *, missing=()):
    raw = path.read_bytes()
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""), strict=True)
    names = reader.fieldnames or []
    if len(names) != len(set(names)) or not set(required).issubset(names):
        raise ValueError("Missing or duplicate CSV columns")
    rows = []
    try:
        for index, row in enumerate(reader, 2):
            if None in row or any(value is None for value in row.values()):
                raise ValueError("Malformed CSV record " + str(index))
            for name in required:
                if name not in missing and not row[name].strip():
                    raise ValueError("Missing " + name + " in CSV record " + str(index))
            rows.append(row)
    except csv.Error as error:
        raise ValueError("Malformed CSV quoting: " + str(error)) from error
    if not rows:
        raise ValueError("CSV has no observations")
    return rows


def number(value, name="value"):
    if isinstance(value, bool):
        raise ValueError("Boolean is not a numeric " + name)
    try:
        result = float(value)
    except (ValueError, TypeError) as error:
        raise ValueError("Non-numeric " + name) from error
    if not math.isfinite(result):
        raise ValueError("Non-finite " + name)
    return result


def relative(ws, path):
    return str(Path(path).relative_to(ws.root)).replace("\\", "/")


def require_analysis_scope(ws, plan_id):
    folder = extension_record(ws, "plans", plan_id)
    plan = strict_json(folder / "plan.json")
    if plan.get("analysis_mode") == "materials_only":
        raise ValueError("This plan is materials_only; new statistical analysis is outside its scope")
    if plan.get("analysis_mode") not in ("required", "agent_decide"):
        raise ValueError("Plan must explicitly state the analysis scope")
    return folder, plan


def cli(function, parser, argv=None):
    args = parser.parse_args(argv)
    try:
        result = function(research.Workspace(args.workspace, args.task), args)
        print(json.dumps(result, ensure_ascii=False, allow_nan=False))
        return 0
    except (KeyboardInterrupt, SystemExit) as error:
        print(json.dumps({"status": "interrupted", "error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 130
    except Exception as error:
        print(json.dumps({"status": "failed", "error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 1
