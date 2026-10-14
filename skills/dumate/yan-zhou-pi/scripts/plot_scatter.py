#!/usr/bin/env python3
"""Plot explicitly selected raw CSV column pairs through the frozen research helper."""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import sys
import warnings

import research

PACKAGE = Path(__file__).resolve().parents[1]


def selected_pairs(raw, x_column, y_column):
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("CSV must be UTF-8, optionally with a BOM") from exc
    reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
    fields = reader.fieldnames or []
    if len(fields) != len(set(fields)) or x_column not in fields or y_column not in fields:
        raise ValueError("CSV has missing or duplicate column names")

    pairs, cleaned = [], []
    for line, row in enumerate(reader, start=2):
        if None in row or any(value is None for value in row.values()):
            raise ValueError(f"Malformed CSV row {line}")
        raw_x, raw_y = row[x_column].strip(), row[y_column].strip()
        if not raw_x or not raw_y:
            raise ValueError(f"Missing value on row {line}")
        try:
            x, y = float(raw_x), float(raw_y)
        except ValueError as exc:
            raise ValueError(f"Non-numeric value on row {line}") from exc
        if not math.isfinite(x) or not math.isfinite(y):
            raise ValueError(f"Non-finite value on row {line}")
        pairs.append((x, y))
        cleaned.append({x_column: raw_x, y_column: raw_y})
    if not pairs:
        raise ValueError("CSV has no usable observations")
    return pairs, cleaned


def plot_scatter(ws, args):
    if not args.x.strip() or not args.y.strip() or args.x == args.y:
        raise ValueError("Select two different, non-empty CSV columns")
    if not args.x_unit.strip() or not args.y_unit.strip():
        raise ValueError("Both axes require an explicit unit")

    source = ws.record("sources", args.source)
    source_record = research.read_json(source / "source.json")
    input_path = ws.path(source_record["file"], exists=True)
    x_unit, y_unit = args.x_unit.strip(), args.y_unit.strip()
    plotter_sha256 = research.digest(Path(__file__))
    analysis_params = {
        "source": args.source,
        "x_column": args.x,
        "y_column": args.y,
        "x_unit": x_unit,
        "y_unit": y_unit,
        "plotter_sha256": plotter_sha256,
    }

    def analyze(out):
        if source_record.get("content_level") != "data" or input_path.suffix.lower() != ".csv":
            raise ValueError("Scatter plotting requires a registered data CSV source")
        raw = input_path.read_bytes()
        input_sha256 = hashlib.sha256(raw).hexdigest()
        if input_sha256 != source_record.get("sha256"):
            raise ValueError("Selected CSV changed since source registration")
        try:
            pairs, cleaned = selected_pairs(raw, args.x, args.y)
        except csv.Error as exc:
            raise ValueError(f"Malformed CSV: {exc}") from exc
        result = {
            "source": args.source,
            "input_sha256": input_sha256,
            "method": "selected raw CSV pairs; no statistical test or fit",
            "x_column": args.x,
            "y_column": args.y,
            "x_unit": x_unit,
            "y_unit": y_unit,
            "row_count": len(pairs),
            "data_label": source_record.get("data_label"),
        }
        research.write_json(out / "result.json", result)
        research.write_csv(out / "cleaned.csv", cleaned, [args.x, args.y])
        return {"row_count": len(pairs)}

    analysis_step = research.execute(
        ws,
        "analysis",
        args.id,
        analysis_params,
        [input_path, source / "source.json"],
        [source],
        analyze,
    )
    analysis = ws.record("analysis", args.id)
    result = research.read_json(analysis / "result.json")
    style_path = PACKAGE / "assets" / "figstyle.py"
    figure_params = {
        "kind": "scatter",
        "analysis": args.id,
        "plotter_sha256": plotter_sha256,
        "style_sha256": research.digest(style_path),
    }

    def draw(out):
        assets = str(style_path.parent)
        if assets not in sys.path:
            sys.path.insert(0, assets)
        import figstyle
        import matplotlib.pyplot as plt

        with (analysis / "cleaned.csv").open(encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            if reader.fieldnames != [args.x, args.y]:
                raise ValueError("Verified cleaned CSV does not match the selected columns")
            rows = list(reader)
        if len(rows) != result["row_count"]:
            raise ValueError("Verified cleaned CSV row count does not match the analysis result")

        with warnings.catch_warnings(record=True) as rendering_warnings:
            warnings.simplefilter("always")
            figstyle.use_style()
            fig, ax = figstyle.figure(width=figstyle.TEXT)
            ax.scatter(
                [float(row[args.x]) for row in rows],
                [float(row[args.y]) for row in rows],
                color=figstyle.PALETTE["blue"],
            )
            ax.set_xlabel(f"{args.x} ({x_unit})")
            ax.set_ylabel(f"{args.y} ({y_unit})")
            issues = figstyle._audit(fig)
            paths = figstyle.save(fig, str(out / "figure"), formats=("png", "svg", "pdf"))
        issues = list(dict.fromkeys(issues + [str(warning.message) for warning in rendering_warnings]))
        data_label = result["data_label"]
        designation = f"Source designation: {data_label}. " if isinstance(data_label, str) and data_label.strip() else ""
        caption = (
            f"{designation}{result['row_count']} selected raw CSV row pairs; "
            f"horizontal: {args.x} ({x_unit}); vertical: {args.y} ({y_unit}), in source row order. "
            "Repeated coordinates may overlap; n counts source rows. No fit or statistical test."
        )
        research.write_json(
            out / "manifest.json",
            {
                "figure_id": args.id,
                **figure_params,
                "data_source": result["source"],
                "data_sha256": result["input_sha256"],
                "analysis_sha256": research.digest(analysis / "result.json"),
                "files": [Path(path).name for path in paths],
                "width_inches": figstyle.TEXT,
                "caption": caption,
                "audit": {"status": "warning" if issues else "pass", "issues": issues},
                "visual_check": "pending",
            },
        )
        return {
            "status": "partial" if issues else "complete",
            "visual_check": "pending",
            "audit_issues": issues,
        }

    figure_step = research.execute(
        ws,
        "figures",
        args.id,
        figure_params,
        [analysis / "result.json", analysis / "cleaned.csv"],
        [analysis],
        draw,
    )
    return {
        "status": "partial" if "partial" in (analysis_step["status"], figure_step["status"]) else "complete",
        "analysis_id": args.id,
        "figure_id": args.id,
        "analysis_path": analysis_step["path"],
        "figure_path": figure_step["path"],
        "row_count": result["row_count"],
        "reused": {"analysis": analysis_step["reused"], "figure": figure_step["reused"]},
        "paper_context": {"analysis_ids": [args.id], "figure_ids": [args.id]},
        "markers": {"row_count": f"[value:{args.id}:row_count]", "figure": f"[figure:{args.id}]"},
        "visual_check": "pending",
        "audit_issues": research.read_json(ws.record("figures", args.id) / "manifest.json")["audit"]["issues"],
    }


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--workspace", required=True)
    p.add_argument("--task", default="T1")
    p.add_argument("--source", required=True)
    p.add_argument("--x", required=True)
    p.add_argument("--y", required=True)
    p.add_argument("--x-unit", required=True)
    p.add_argument("--y-unit", required=True)
    p.add_argument("--id", required=True)
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        result = plot_scatter(research.Workspace(args.workspace, args.task), args)
        print(json.dumps(result, ensure_ascii=False, allow_nan=False))
        return 0
    except Exception as exc:
        print(json.dumps({"status": "failed", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
