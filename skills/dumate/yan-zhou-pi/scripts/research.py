#!/usr/bin/env python3
"""Small, task-local research workflow. Python 3.10+, optional export libraries."""
from __future__ import annotations

import argparse
import csv
import hashlib
import importlib.util
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import statistics
import sys
import uuid
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape

VERSION = "1.0.0"
PACKAGE = Path(__file__).resolve().parents[1]
ID = re.compile(r"[A-Za-z][A-Za-z0-9_-]{0,63}\Z")
TOKENS = re.compile(r"\[@([^\]]+)\]|\[(evidence|claim|figure):([^\]]+)\]|\[value:([^:\]]+):([^\]]+)\]")
MAX_FILE = 30 * 1024 * 1024


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def identifier(value):
    if not ID.fullmatch(value):
        raise ValueError("IDs must begin with a letter and contain only letters, digits, _ or -")
    return value


class Workspace:
    def __init__(self, root, task):
        self.root = Path(root).resolve(strict=True)
        self.task_id = identifier(task)
        self.task = self.root / "tasks" / self.task_id
        self.inputs = self.root / "inputs"
        if (self.root / "tasks").resolve() != self.root / "tasks" or self.task.resolve(strict=True) != self.task or self.inputs.resolve() != self.inputs:
            raise ValueError("Task identity and input folders must not be directory aliases")
        self.path("project.json", exists=True, project=True)
        taskfile = self.task_path(self.task.relative_to(self.root) / "task.json", exists=True)
        if read_json(taskfile).get("id") != self.task_id:
            raise ValueError("Task record belongs to a different task")

    def path(self, relative, exists=False, project=False):
        candidate = Path(relative)
        if candidate.is_absolute() or ".." in candidate.parts:
            raise ValueError("Use a workspace-relative path without ..")
        result = (self.root / candidate).resolve(strict=exists)
        if not result.is_relative_to(self.root) or result == self.root:
            raise ValueError("Path escapes the selected workspace")
        requested = self.root / candidate
        if project and requested == self.root / "project.json":
            if result != requested:
                raise ValueError("Project record must not be an alias")
        elif requested.is_relative_to(self.inputs):
            if not result.is_relative_to(self.inputs):
                raise ValueError("Selected input resolves outside inputs/")
        elif requested.is_relative_to(self.task):
            if not result.is_relative_to(self.task):
                raise ValueError("Path resolves outside the current task")
        else:
            raise ValueError("Path is outside the current task and selected inputs/")
        if exists and (not result.is_file() or result.stat().st_size > MAX_FILE):
            raise ValueError("Input must be a regular file of at most 30 MB")
        return result

    def task_path(self, relative, exists=False):
        result = self.path(relative, exists=exists)
        if not result.is_relative_to(self.task) or result != self.root / Path(relative):
            raise ValueError("Task files and step directories must belong to the current real task without aliases")
        return result

    def input(self, relative, suffixes):
        path = self.path(relative, exists=True)
        if not path.is_relative_to(self.inputs) or path.suffix.lower() not in suffixes:
            raise ValueError("Input must be an explicitly selected file in inputs/ of a supported type")
        return path

    def record(self, kind, name):
        path = self.task_path((self.task / identifier(kind) / identifier(name)).relative_to(self.root))
        self.task_path(path.relative_to(self.root) / "receipt.json", exists=True)
        verify_receipt(self, path)
        return path


def pending_attempts(root):
    pending = []
    tasks = root / "tasks"
    if not tasks.is_dir():
        return pending
    for task in tasks.iterdir():
        if not task.is_dir() or task.resolve() != task:
            continue
        for kind in task.iterdir():
            if kind.is_dir() and kind.resolve() == kind:
                pending.extend(p for p in kind.glob(".pending-*") if p.is_dir())
    return sorted(pending)


def verify_receipt(ws, folder):
    folder = ws.task_path(folder.relative_to(ws.root))
    receipt = read_json(ws.task_path((folder / "receipt.json").relative_to(ws.root), exists=True))
    if receipt.get("task_id") != ws.task_id:
        raise ValueError("Step receipt belongs to a different task")
    if receipt["script_sha256"] != digest(Path(__file__)):
        raise ValueError("Helper code changed; retain old outputs and use a new task/version")
    if "style_sha256" in receipt["parameters"] and receipt["parameters"]["style_sha256"] != digest(PACKAGE / "assets" / "figstyle.py"):
        raise ValueError("Figure style changed; regenerate in a new version")
    for relative, expected in receipt["inputs"].items():
        if digest(ws.path(relative, exists=True)) != expected:
            raise ValueError(f"File digest changed: {relative}; use the retained original or a new task/version")
    for relative, expected in receipt["outputs"].items():
        output = ws.task_path(relative, exists=True)
        if not output.is_relative_to(folder):
            raise ValueError("Receipt output belongs to a different step")
        if digest(output) != expected:
            raise ValueError(f"File digest changed: {relative}; use the retained original or a new task/version")
    for relative in receipt.get("dependencies", []):
        depfile = ws.task_path(relative, exists=True)
        if depfile.name != "receipt.json":
            raise ValueError("Dependency must refer to a task step receipt")
        dep = depfile.parent
        verify_receipt(ws, dep)
    return receipt


def execute(ws, kind, name, params, inputs, dependencies, operation):
    """One writer per workspace, commit new directories only; retain failed drafts."""
    lock = ws.root / ".yan-zhou-pi.lock"
    fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    os.close(fd)
    draft = None
    try:
        if pending_attempts(ws.root):
            raise ValueError("Unresolved pending attempts remain in this workspace; check the original process before any write or reuse")
        target = ws.task_path((ws.task / identifier(kind) / identifier(name)).relative_to(ws.root))
        inputs = [ws.path(p.relative_to(ws.root), exists=True) for p in inputs]
        dependencies = [ws.task_path(p.relative_to(ws.root)) for p in dependencies]
        for dep in dependencies:
            verify_receipt(ws, dep)
        fingerprint = {"task_id": ws.task_id, "parameters": params, "inputs": {str(p.relative_to(ws.root)).replace("\\", "/"): digest(p) for p in inputs},
                       "script_sha256": digest(Path(__file__)), "dependencies": [str((p / "receipt.json").relative_to(ws.root)).replace("\\", "/") for p in dependencies]}
        if target.exists():
            old = verify_receipt(ws, target)
            if any(old.get(k) != v for k, v in fingerprint.items()):
                raise ValueError("Existing step has different inputs/parameters/code; choose a new version ID")
            return {"status": old["status"], "reused": True, "path": str(target)}
        target.parent.mkdir(parents=True, exist_ok=True)
        draft = target.parent / (".pending-" + name + "-" + uuid.uuid4().hex)
        draft.mkdir()
        details = operation(draft)
        outputfiles = [ws.task_path(p.relative_to(ws.root), exists=True) for p in draft.rglob("*") if p.is_file()]
        outputs = {str((target / p.relative_to(draft)).relative_to(ws.root)).replace("\\", "/"): digest(p) for p in outputfiles}
        receipt = {**fingerprint, "version": VERSION, "created_at": now(), "status": details.pop("status", "complete"), "outputs": outputs, **details}
        write_json(draft / "receipt.json", receipt)
        draft.rename(target)
        draft = None
        return {"status": receipt["status"], "reused": False, "path": str(target)}
    except BaseException as exc:
        if draft is not None:
            terminal = "failed" if isinstance(exc, Exception) else "interrupted"
            write_json(draft / "failure.json", {"status": terminal, "time": now(), "error": str(exc), "exception_type": type(exc).__name__})
            draft.rename(draft.with_name("." + terminal + "-" + draft.name.removeprefix(".pending-")))
            draft = None
        raise
    finally:
        if draft is None:
            lock.unlink()


def init(args):
    root = Path(args.workspace).resolve()
    root.mkdir(parents=True, exist_ok=True)
    if root.is_symlink():
        raise ValueError("Select a regular workspace directory")
    project = root / "project.json"
    task = root / "tasks" / identifier(args.task)
    if (root / "tasks").resolve() != root / "tasks" or task.resolve() != task or (root / "inputs").resolve() != root / "inputs" or project.resolve() != project:
        raise ValueError("Workspace task/input/project identities must not be aliases")
    if (root / ".yan-zhou-pi.lock").exists() or pending_attempts(root):
        raise ValueError("Workspace has a writer lock or unresolved pending attempt; check the original process before initializing another task")
    if project.exists():
        if read_json(project)["question"] != args.question:
            raise ValueError("Workspace belongs to a different research question")
    else:
        with project.open("x", encoding="utf-8") as f:
            json.dump({"version": VERSION, "question": args.question, "created_at": now()}, f, ensure_ascii=False, indent=2)
    (root / "inputs").mkdir(exist_ok=True)
    if task.exists():
        raise FileExistsError("Task already exists; read status or select a new task ID")
    task.mkdir(parents=True)
    write_json(task / "task.json", {"id": args.task, "question": args.question, "created_at": now(), "steps": "Read immutable step receipts; no background scheduler"})
    return {"status": "complete", "workspace": str(root), "task": args.task}


def preflight(args):
    modules = {name: importlib.util.find_spec(name) is not None for name in ("pypdf", "numpy", "matplotlib", "docx", "reportlab", "PIL")}
    return {"version": VERSION, "modules": modules,
            "capabilities": {"csv": True, "text": True, "pdf_read": modules["pypdf"], "figures": modules["numpy"] and modules["matplotlib"],
                             "docx": modules["docx"], "pdf_export": modules["reportlab"]},
            "visual_checks": "pending: open actual images and PDF pages with the platform viewer", "permission_scope": "Only this helper enforces workspace paths; it is not a platform sandbox"}


def search(ws, args):
    if not 1 <= args.rows <= 50 or not args.query.strip():
        raise ValueError("Provide a query and 1–50 rows")
    params = {"query": args.query, "rows": args.rows, "service": "Crossref metadata"}
    def run(out):
        url = "https://api.crossref.org/works?" + urlencode({"query.bibliographic": args.query, "rows": args.rows})
        request = Request(url, headers={"User-Agent": "yan-zhou-pi/1.0 (public metadata research)", "Accept": "application/json"})
        with urlopen(request, timeout=30) as response:
            raw = response.read(MAX_FILE + 1)
        if len(raw) > MAX_FILE:
            raise ValueError("Crossref response exceeds 30 MB")
        (out / "raw.json").write_bytes(raw)
        data = json.loads(raw)
        if data.get("status") != "ok" or not isinstance(data.get("message", {}).get("items"), list):
            raise ValueError("Unexpected Crossref response")
        seen, sources = set(), []
        for item in data["message"]["items"]:
            doi = item.get("DOI", "").lower().strip()
            title = " ".join(item.get("title", []))
            key = doi or (title.casefold(), str(item.get("published", {})))
            if key in seen:
                continue
            seen.add(key)
            sources.append({"candidate_id": "S" + str(len(sources) + 1), "doi": doi, "title": title,
                            "authors": "; ".join(" ".join(filter(None, [a.get("given"), a.get("family")])) for a in item.get("author", [])),
                            "year": str(item.get("published", {}).get("date-parts", [[""]])[0][0]), "url": item.get("URL", ""),
                            "content_level": "metadata_and_abstract" if item.get("abstract") else "metadata", "abstract": item.get("abstract", ""),
                            "selection": "unselected", "reason": ""})
        write_csv(out / "candidates.csv", sources, ["candidate_id", "doi", "title", "authors", "year", "url", "content_level", "abstract", "selection", "reason"])
        write_json(out / "query.json", {**params, "url": url, "retrieved_at": now(), "count": len(sources), "limitation": "Metadata/abstracts do not establish full-text findings"})
        return {"status": "complete" if sources else "empty", "count": len(sources)}
    return execute(ws, "literature", args.id, params, [], [], run)


def write_csv(path, rows, fields):
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def register(ws, args):
    path = ws.input(args.file, {".pdf", ".txt", ".md", ".csv"})
    metadata = ws.input(args.metadata, {".json"})
    record = read_json(metadata)
    required = ("title", "authors", "year", "content_level", "selection_reason", "license")
    if any(k not in record or not isinstance(record[k], str) for k in required) or not record["selection_reason"].strip() or not record["title"].strip():
        raise ValueError("Metadata needs string title/authors/year/content_level/selection_reason/license; use unknown for unknowns")
    if record["content_level"] not in ("full_text", "abstract", "metadata", "data"):
        raise ValueError("Unsupported content_level")
    def run(out):
        write_json(out / "source.json", {**record, "source_id": args.id, "file": args.file, "sha256": digest(path), "retrieved_at": now(), "selected": True})
        return {}
    return execute(ws, "sources", args.id, {}, [path, metadata], [], run)


def extract(ws, args):
    source = ws.record("sources", args.source)
    metadata = read_json(source / "source.json")
    path = ws.path(metadata["file"], exists=True)
    def run(out):
        if path.suffix.lower() == ".pdf":
            from pypdf import PdfReader
            reader = PdfReader(path)
            if reader.is_encrypted:
                raise ValueError("Encrypted PDF is not supported; retain original and report the gap")
            pages = [{"page": i + 1, "text": page.extract_text() or ""} for i, page in enumerate(reader.pages)]
            method = "pypdf text layer; physical page numbers"
        elif path.suffix.lower() in (".txt", ".md"):
            pages = [{"page": None, "text": path.read_text(encoding="utf-8-sig")}]
            method = "UTF-8 text; fixed paragraph anchors"
        else:
            raise ValueError("CSV uses analyze, not text extraction")
        units = []
        for page in pages:
            for i, text in enumerate(re.split(r"\n\s*\n", page["text"])):
                if text.strip():
                    units.append({"anchor": f"p{page['page'] or 0}-para{i + 1}", "page": page["page"], "text": text.strip()})
        write_json(out / "text.json", {"source_id": args.source, "source_sha256": metadata["sha256"], "content_level": metadata["content_level"], "method": method, "units": units,
                                      "gaps": [] if units else ["No readable text layer; OCR/visual reading not performed"]})
        return {"status": "complete" if units else "partial", "units": len(units)}
    return execute(ws, "extractions", args.id, {"source": args.source}, [path, source / "source.json"], [source], run)


def evidence(ws, args):
    extraction = ws.record("extractions", args.extraction)
    text = read_json(extraction / "text.json")
    path = ws.input(args.spec, {".json"})
    spec = read_json(path)
    def run(out):
        unit = next((u for u in text["units"] if u["anchor"] == spec.get("anchor")), None)
        quote = spec.get("quote", "")
        if not unit or not isinstance(quote, str) or not quote.strip() or quote not in unit["text"]:
            raise ValueError("Quote is absent from the fixed paragraph; do not invent locations or quotations")
        if text["content_level"] not in ("full_text", "abstract"):
            raise ValueError("Metadata is not full-text/abstract evidence")
        item = {"evidence_id": args.id, "source_id": text["source_id"], "source_sha256": text["source_sha256"],
                "extraction": args.extraction, "parsed_sha256": digest(extraction / "text.json"), "anchor": unit["anchor"], "physical_page": unit["page"],
                "quote": quote, "context": unit["text"], "content_level": text["content_level"], "method": text["method"], "limitations": spec.get("limitations", ""), "kind": "verified_text_quote"}
        write_json(out / "evidence.json", item)
        write_csv(out / "evidence.csv", [item], list(item))
        return {}
    return execute(ws, "evidence", args.id, {}, [path, extraction / "text.json"], [extraction], run)


def claim(ws, args):
    specpath = ws.input(args.spec, {".json"})
    spec = read_json(specpath)
    if not spec.get("text") or not isinstance(spec.get("evidence_ids"), list) or not spec["evidence_ids"]:
        raise ValueError("Claim requires text and at least one evidence ID; unsupported claims stay in gap notes")
    records = [ws.record("evidence", e) for e in spec["evidence_ids"]]
    def run(out):
        write_json(out / "claim.json", {**spec, "claim_id": args.id, "support_status": "mapped; semantic support requires task-specific reading"})
        write_csv(out / "claims.csv", [{"claim_id": args.id, "text": spec["text"], "evidence_ids": ";".join(spec["evidence_ids"]), "conditions": spec.get("conditions", ""), "conflicts": spec.get("conflicts", ""), "section": spec.get("section", "")}], ["claim_id", "text", "evidence_ids", "conditions", "conflicts", "section"])
        return {"semantic_check": "pending"}
    return execute(ws, "claims", args.id, {}, [specpath] + [p / "evidence.json" for p in records], records, run)


def describe(values):
    return {"n": len(values), "mean": statistics.mean(values), "median": statistics.median(values), "min": min(values), "max": max(values), "sample_sd": statistics.stdev(values) if len(values) > 1 else None}


def analyze(ws, args):
    source = ws.record("sources", args.source)
    record = read_json(source / "source.json")
    path = ws.path(record["file"], exists=True)
    if record["content_level"] != "data" or path.suffix.lower() != ".csv" or not args.unit.strip():
        raise ValueError("Analysis requires a selected CSV data source and an explicit unit (dimensionless is valid)")
    params = {"source": args.source, "column": args.column, "group": args.group, "unit": args.unit, "missing": args.missing}
    def run(out):
        with path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            fields = reader.fieldnames or []
            if len(fields) != len(set(fields)) or args.column not in fields or (args.group and args.group not in fields):
                raise ValueError("CSV has missing or duplicate column names")
            rows = list(reader)
        clean, excluded, groups = [], [], {}
        for n, row in enumerate(rows, start=2):
            if None in row or any(v is None for v in row.values()):
                raise ValueError(f"Malformed CSV row {n}")
            raw = row[args.column].strip()
            group = row[args.group].strip() if args.group else "all"
            if not raw or not group:
                if args.missing == "error":
                    raise ValueError(f"Missing value/group on row {n}")
                excluded.append({"row": n, "reason": "missing value or group"})
                continue
            value = float(raw)
            if not math.isfinite(value):
                raise ValueError(f"Non-finite value on row {n}")
            groups.setdefault(group, []).append(value)
            clean.append(row)
        if not clean:
            raise ValueError("CSV has no usable observations")
        result = {**params, "input_sha256": digest(path), "script_sha256": digest(Path(__file__)), "method": "descriptive statistics, sample SD (ddof=1), no significance or causal test",
                  "rows_total": len(rows), "rows_valid": len(clean), "excluded": excluded, "groups": {k: describe(v) for k, v in groups.items()}, "data_label": record.get("data_label", "user-selected; provenance requires reading")}
        write_json(out / "result.json", result)
        write_csv(out / "cleaned.csv", clean, fields)
        write_json(out / "cleaning.json", {"policy": args.missing, "excluded": excluded, "source": args.source, "input_sha256": digest(path)})
        return {"valid_rows": len(clean)}
    return execute(ws, "analysis", args.id, params, [path, source / "source.json"], [source], run)


def figure(ws, args):
    analysis = ws.record("analysis", args.analysis)
    result = read_json(analysis / "result.json")
    stylepath = PACKAGE / "assets" / "figstyle.py"
    params = {"analysis": args.analysis, "kind": "bar", "style_sha256": digest(stylepath)}
    def run(out):
        sys.path.insert(0, str(PACKAGE / "assets"))
        import figstyle
        import matplotlib.pyplot as plt
        figstyle.use_style()
        fig, ax = figstyle.figure(width=figstyle.TEXT)
        labels = list(result["groups"])
        values = [result["groups"][k]["mean"] for k in labels]
        ax.bar(labels, values, color=figstyle.PALETTE["blue"])
        ax.set_xlabel(result["group"] or "Observations")
        ax.set_ylabel(f"Mean {result['column']} ({result['unit']})")
        fig.canvas.draw()
        issues = figstyle._audit(fig)
        paths = figstyle.save(fig, str(out / "figure"), formats=("png", "svg", "pdf"))
        plt.close(fig)
        caption = f"Descriptive group means of {result['column']} ({result['unit']}); " + "; ".join(f"{k}: n={result['groups'][k]['n']}" for k in labels) + ". No error bars or significance tests."
        write_json(out / "manifest.json", {"figure_id": args.id, **params, "data_source": result["source"], "data_sha256": result["input_sha256"], "analysis_sha256": digest(analysis / "result.json"),
                                          "files": [Path(p).name for p in paths], "width_inches": figstyle.TEXT, "caption": caption, "audit": {"status": "warning" if issues else "pass", "issues": issues}, "visual_check": "pending"})
        return {"status": "partial" if issues else "complete", "visual_check": "pending", "audit_issues": issues}
    return execute(ws, "figures", args.id, params, [analysis / "result.json", analysis / "cleaned.csv"], [analysis], run)


def selected_context(ws, path):
    context = read_json(path)
    if not context.get("title") or not isinstance(context.get("selected_sources"), list):
        raise ValueError("paper_context requires title and selected_sources")
    mappings = {"sources": "selected_sources", "evidence": "evidence_ids", "claims": "claim_ids", "analysis": "analysis_ids", "figures": "figure_ids"}
    records = {}
    for kind, key in mappings.items():
        ids = context.get(key, [])
        if not isinstance(ids, list) or len(ids) != len(set(ids)):
            raise ValueError(f"Invalid/duplicate {key}")
        filename = {"sources": "source.json", "evidence": "evidence.json", "claims": "claim.json", "analysis": "result.json", "figures": "manifest.json"}[kind]
        records[kind] = {i: (ws.record(kind, i), read_json(ws.record(kind, i) / filename)) for i in ids}
    selected = set(records["sources"])
    for _, item in records["evidence"].values():
        if item["source_id"] not in selected:
            raise ValueError("Evidence references an unselected source")
    for _, item in records["claims"].values():
        if not set(item["evidence_ids"]).issubset(records["evidence"]):
            raise ValueError("Claim references evidence outside this paper context")
    for _, item in records["analysis"].values():
        if item["source"] not in selected:
            raise ValueError("Analysis uses an unselected data source")
    for _, item in records["figures"].values():
        if item["analysis"] not in records["analysis"] or item["data_source"] not in selected:
            raise ValueError("Figure is outside this paper context")
    return context, records


def render_body(body, records):
    if re.search(r"(?im)^\s*#{1,6}\s*(references|bibliography|参考文献)\s*$", body):
        raise ValueError("Do not supply a reference list; it is generated only from used selected citations")
    if re.search(r"\[\d+(?:[\s,;–-]+\d+)*\]", body):
        raise ValueError("Use selected source markers rather than manually numbered citations")
    citations, used_evidence, used_claims, used_values, used_figures = [], [], [], [], []
    def replace(match):
        citation, kind, key, analysis_id, pointer = match.groups()
        if citation:
            if citation not in records["sources"]:
                raise ValueError(f"Unknown or unselected citation: {citation}")
            if records["sources"][citation][1]["content_level"] == "data":
                raise ValueError("Data source is not a bibliographic citation; use actual analysis markers")
            if citation not in citations:
                citations.append(citation)
            return f"[{citations.index(citation) + 1}]"
        if analysis_id:
            if analysis_id not in records["analysis"]:
                raise ValueError("Unselected analysis value")
            value = records["analysis"][analysis_id][1]
            for component in pointer.split("/"):
                value = value[component]
            if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
                raise ValueError("Value marker must point to a finite numeric result")
            used_values.append({"analysis": analysis_id, "pointer": pointer, "value": value})
            return format(value, ".6g")
        plural = {"evidence": "evidence", "claim": "claims", "figure": "figures"}[kind]
        if key not in records[plural]:
            raise ValueError(f"Unknown or unselected {kind}: {key}")
        if kind == "evidence":
            used_evidence.append(key)
            return ""
        if kind == "claim":
            used_claims.append(key)
            return ""
        if key not in used_figures:
            used_figures.append(key)
        return f"\n\n{{{{FIGURE:{key}}}}}\n\n"
    rendered = TOKENS.sub(replace, body)
    rendered = re.sub(r" +([.,;:!?，。；：！？])", r"\1", rendered)
    if "[@" in rendered or re.search(r"\[(?:value|evidence|claim|figure):", rendered):
        raise ValueError("Malformed source/result marker")
    required_sources = {records["evidence"][e][1]["source_id"] for e in used_evidence}
    for c in used_claims:
        required_sources.update(records["evidence"][e][1]["source_id"] for e in records["claims"][c][1]["evidence_ids"])
    if not required_sources.issubset(citations):
        raise ValueError("Evidence/claim used in prose must also cite its selected source")
    bibliography = []
    for n, source in enumerate(citations, 1):
        item = records["sources"][source][1]
        bibliography.append(f"[{n}] {item['authors']}. {item['title']}. {item['year']}. " + ("https://doi.org/" + item["doi"] if item.get("doi") else item.get("url", "")))
    if bibliography:
        heading = "参考文献" if re.search(r"[\u4e00-\u9fff]", body) else "References"
        rendered += "\n\n## " + heading + "\n\n" + "\n\n".join(bibliography)
    return rendered, {"citations": citations, "evidence": used_evidence, "claims": used_claims, "values": used_values, "figures": used_figures}


def export_documents(out, title, text, figures):
    """Same resolved text and PNGs for both editable document and actual PDF."""
    errors, exported = [], []
    blocks = [b.strip() for b in text.split("\n\n") if b.strip()]
    try:
        from docx import Document
        from docx.shared import Inches
        doc = Document()
        doc.add_heading(title, 0)
        for block in blocks:
            marker = re.fullmatch(r"\{\{FIGURE:([^}]+)\}\}", block)
            if marker:
                image, caption = figures[marker[1]]
                doc.add_picture(str(image), width=Inches(5.5))
                doc.add_paragraph(caption)
            elif block.startswith("#"):
                level = min(len(block) - len(block.lstrip("#")), 3)
                doc.add_heading(block.lstrip("# "), level)
            else:
                doc.add_paragraph(block)
        doc.save(out / "manuscript.docx")
        exported.append("manuscript.docx")
    except ImportError as exc:
        errors.append("DOCX export unavailable: " + str(exc))
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.cidfonts import UnicodeCIDFont
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, KeepTogether
        pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
        styles = getSampleStyleSheet()
        for style in styles.byName.values():
            style.fontName = "STSong-Light"
            style.wordWrap = "CJK"
        story = [Paragraph(escape(title), styles["Title"]), Spacer(1, 12)]
        for block in blocks:
            marker = re.fullmatch(r"\{\{FIGURE:([^}]+)\}\}", block)
            if marker:
                image, caption = figures[marker[1]]
                story.append(KeepTogether([Image(str(image), width=396, height=269.28), Paragraph(escape(caption), styles["BodyText"])]))
            else:
                heading = block.startswith("#")
                story.append(Paragraph(escape(block.lstrip("# ") if heading else block).replace("\n", "<br/>"), styles["Heading2" if heading else "BodyText"]))
            if marker or not heading:
                story.append(Spacer(1, 8))
        SimpleDocTemplate(str(out / "manuscript.pdf")).build(story)
        if not (out / "manuscript.pdf").read_bytes().startswith(b"%PDF-"):
            raise ValueError("Exporter did not produce a PDF")
        exported.append("manuscript.pdf")
    except ImportError as exc:
        errors.append("PDF export unavailable: " + str(exc))
    return exported, errors


def manuscript(ws, args):
    contextpath = ws.input(args.context, {".json"})
    bodypath = ws.input(args.body, {".md", ".txt"})
    context, records = selected_context(ws, contextpath)
    text, usage = render_body(bodypath.read_text(encoding="utf-8-sig"), records)
    dependencies = [p for items in records.values() for p, _ in items.values()]
    def run(out):
        write_json(out / "paper_context.json", context)
        write_json(out / "citation-map.json", usage)
        (out / "draft-source.md").write_bytes(bodypath.read_bytes())
        figures = {}
        for key in usage["figures"]:
            folder, manifest = records["figures"][key]
            if manifest["audit"]["issues"]:
                raise ValueError(f"Figure {key} has unresolved audit issues")
            shutil.copyfile(folder / "figure.png", out / (key + ".png"))
            figures[key] = (out / (key + ".png"), manifest["caption"])
        editable_text = text
        for key, (_, caption) in figures.items():
            editable_text = editable_text.replace("{{FIGURE:" + key + "}}", f"![{caption}]({key}.png)\n\n{caption}")
        (out / "manuscript.md").write_text("# " + context["title"] + "\n\n" + editable_text, encoding="utf-8")
        exported, errors = export_documents(out, context["title"], text, figures)
        write_json(out / "export.json", {"exported": exported, "gaps": errors, "method": "same resolved manuscript text and figures via python-docx/reportlab", "pdf_visual_check": "pending", "semantic_check": "pending", "independent_review": "not performed"})
        return {"status": "partial" if errors else "complete", "export_gaps": errors, "visual_check": "pending", "semantic_check": "pending"}
    return execute(ws, "manuscript", args.id, {}, [contextpath, bodypath] + [p / "receipt.json" for p in dependencies], dependencies, run)


def verify(ws, args):
    paper = ws.record("manuscript", args.paper)
    context, records = selected_context(ws, paper / "paper_context.json")
    _, usage = render_body((paper / "draft-source.md").read_text(encoding="utf-8"), records)
    if usage != read_json(paper / "citation-map.json"):
        raise ValueError("Citation/value/figure map does not match actual manuscript source")
    checkpath = ws.input(args.checks, {".json"}) if args.checks else None
    checks = read_json(checkpath) if checkpath else {}
    for category in ("scientific", "figure_visual", "pdf_visual"):
        check = checks.get(category, {})
        if check.get("status") == "pass" and (not check.get("notes") or not check.get("reviewed_sha256")):
            raise ValueError("Passed checks require actual reviewed file digests and notes")
        for relative, expected in check.get("reviewed_sha256", {}).items():
            if digest(ws.path(relative, exists=True)) != expected:
                raise ValueError("Review is for a different file version")
    scientific_targets = {str((paper / "manuscript.md").relative_to(ws.root)).replace("\\", "/")}
    figure_targets = {str((paper / (key + ".png")).relative_to(ws.root)).replace("\\", "/") for key in usage["figures"]}
    pdf_target = str((paper / "manuscript.pdf").relative_to(ws.root)).replace("\\", "/")
    expected_targets = {"scientific": scientific_targets, "figure_visual": figure_targets, "pdf_visual": {pdf_target}}
    export = read_json(paper / "export.json")
    gaps = list(export["gaps"])
    statuses = {}
    for category, targets in expected_targets.items():
        if category == "figure_visual" and not targets:
            statuses[category] = "not_applicable"
            continue
        check = checks.get(category, {})
        status = check.get("status", "not_run")
        if status not in ("pass", "fail", "pending", "not_run"):
            raise ValueError("Unsupported check status")
        if status == "pass" and not targets.issubset(check.get("reviewed_sha256", {})):
            raise ValueError("Passed review does not include all required current artifacts")
        statuses[category] = status
        if status != "pass":
            gaps.append(category + ": " + status)
    if "manuscript.pdf" not in export["exported"]:
        gaps.append("Actual PDF has not been exported")
    def run(out):
        files = []
        allowed = ["manuscript.md", "manuscript.docx", "manuscript.pdf", "citation-map.json"] + [key + ".png" for key in usage["figures"]]
        for name in allowed:
            path = paper / name
            if path.exists():
                shutil.copyfile(path, out / name)
                files.append({"path": name, "size": path.stat().st_size, "sha256": digest(path)})
        write_json(out / "manifest.json", {"version": VERSION, "paper": args.paper, "files": files, "selected_sources": context["selected_sources"], "actually_cited": usage["citations"],
                                         "used_results": usage["values"], "checks": statuses, "gaps": gaps, "status": "partial" if gaps else "complete", "independent_review": "not performed"})
        return {"status": "partial" if gaps else "complete", "gaps": gaps}
    return execute(ws, "delivery", args.id, {"paper": args.paper}, [paper / "receipt.json"] + ([checkpath] if checkpath else []), [paper], run)


def status(ws, args):
    steps = []
    for receipt in sorted(ws.task.glob("*/*/receipt.json")):
        try:
            item = verify_receipt(ws, receipt.parent)
            steps.append({"path": str(receipt.parent.relative_to(ws.root)), "status": item["status"], "digests": "match"})
        except Exception as exc:
            steps.append({"path": str(receipt.parent.relative_to(ws.root)), "status": "changed", "error": str(exc)})
    return {"task": args.task, "steps": steps, "writer_lock": (ws.root / ".yan-zhou-pi.lock").exists(), "failed_attempts": [str(p.relative_to(ws.root)) for p in ws.task.glob("*/.failed-*")],
            "interrupted_attempts": [str(p.relative_to(ws.root)) for p in ws.task.glob("*/.interrupted-*")], "pending_attempts": [str(p.relative_to(ws.root)) for p in pending_attempts(ws.root)],
            "note": "A remaining lock or pending directory requires checking the original process; do not restart or delete automatically"}


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--workspace", required=True)
    p.add_argument("--task", default="T1")
    sub = p.add_subparsers(dest="command", required=True)
    s = sub.add_parser("init"); s.add_argument("--question", required=True)
    sub.add_parser("preflight"); sub.add_parser("status")
    def step(command):
        command_parser = sub.add_parser(command)
        command_parser.add_argument("--id", required=True)
        return command_parser
    s = step("search"); s.add_argument("--query", required=True); s.add_argument("--rows", type=int, default=10)
    s = step("register"); s.add_argument("--file", required=True); s.add_argument("--metadata", required=True)
    s = step("extract"); s.add_argument("--source", required=True)
    s = step("evidence"); s.add_argument("--extraction", required=True); s.add_argument("--spec", required=True)
    s = step("claim"); s.add_argument("--spec", required=True)
    s = step("analyze"); s.add_argument("--source", required=True); s.add_argument("--column", required=True); s.add_argument("--group"); s.add_argument("--unit", required=True); s.add_argument("--missing", choices=("error", "exclude"), default="error")
    s = step("figure"); s.add_argument("--analysis", required=True)
    s = step("manuscript"); s.add_argument("--context", required=True); s.add_argument("--body", required=True)
    s = step("verify"); s.add_argument("--paper", required=True); s.add_argument("--checks")
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        if args.command in ("init", "preflight"):
            result = globals()[args.command](args)
        else:
            result = globals()[args.command](Workspace(args.workspace, args.task), args)
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
