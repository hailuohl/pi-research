#!/usr/bin/env python3
"""Immutable research proposals, with explicit evidence and analysis boundaries."""
from __future__ import annotations

import argparse
from pathlib import Path

import alignment_common as common
import research


def text(value, name):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(name + " must be a non-empty string")
    return value


def strings(value, name, *, ids=False, empty=True):
    if not isinstance(value, list) or (not value and not empty):
        raise ValueError(name + " must be an explicit list")
    for item in value:
        text(item, name)
        if ids:
            research.identifier(item)
    if len(value) != len(set(value)):
        raise ValueError("Duplicate " + name)
    return value


def validate(spec):
    if not isinstance(spec, dict):
        raise ValueError("Plan must be a JSON object")
    for name in ("question", "scope"):
        text(spec.get(name), name)
    for name in ("constraints", "success_criteria", "stop_conditions", "clarification_questions"):
        strings(spec.get(name), name, empty=name in ("constraints", "clarification_questions"))
    for name in ("source_ids", "evidence_ids"):
        strings(spec.get(name), name, ids=True)
    if spec.get("analysis_mode") not in ("materials_only", "required", "agent_decide"):
        raise ValueError("analysis_mode must be materials_only, required or agent_decide")
    hypotheses = spec.get("hypotheses")
    if not isinstance(hypotheses, list):
        raise ValueError("hypotheses must be an explicit list")
    for item in hypotheses:
        if not isinstance(item, dict):
            raise ValueError("Hypothesis must be an object")
        text(item.get("statement"), "hypothesis statement")
        strings(item.get("evidence_ids"), "hypothesis evidence_ids", ids=True)
        if not set(item["evidence_ids"]).issubset(spec["evidence_ids"]):
            raise ValueError("Hypothesis references evidence outside this plan")
    steps = spec.get("steps")
    if not isinstance(steps, list) or not steps:
        raise ValueError("steps must contain the proposed work")
    for item in steps:
        if isinstance(item, str):
            text(item, "step")
        elif isinstance(item, dict):
            text(item.get("action"), "step action")
            if "source_ids" in item and not set(strings(item["source_ids"], "step source_ids", ids=True)).issubset(spec["source_ids"]):
                raise ValueError("Step source is outside this plan")
        else:
            raise ValueError("Step must be an action string or object")
    state = spec.get("status", "proposal")
    if state not in ("proposal", "ready", "confirmed"):
        raise ValueError("Plan status must be proposal, ready or confirmed")
    if state == "confirmed":
        confirmation = spec.get("user_confirmation")
        if not isinstance(confirmation, dict):
            raise ValueError("confirmed requires an existing real user_confirmation record")
        for name in ("statement", "confirmed_by", "confirmed_at", "record_reference"):
            text(confirmation.get(name), "user_confirmation." + name)
        if confirmation.get("origin") != "user":
            raise ValueError("Only an explicitly recorded user confirmation can set confirmed")
    design = spec.get("experiment_design")
    if design is not None:
        if spec["analysis_mode"] == "materials_only" or not isinstance(design, dict):
            raise ValueError("Experiment design is incompatible with materials_only")
        strings(design.get("controls"), "controls", empty=False)
        strings(design.get("changed_factors"), "changed_factors", empty=False)
        text(design.get("data_split"), "data_split")
        metric = design.get("primary_metric", {})
        text(metric.get("name"), "primary_metric.name")
        text(metric.get("unit"), "primary_metric.unit")
        if metric.get("direction") not in ("higher", "lower", "two_sided"):
            raise ValueError("primary_metric.direction must be higher, lower or two_sided")
        strings(design.get("guardrails"), "guardrails", empty=False)
        strings(design.get("inconclusive_criteria"), "inconclusive_criteria", empty=False)
        repetitions = design.get("repetitions", {})
        if isinstance(repetitions.get("count"), bool) or not isinstance(repetitions.get("count"), int) or repetitions["count"] < 1:
            raise ValueError("repetitions.count must be a positive integer")
        text(repetitions.get("rationale"), "repetitions.rationale")
    return spec


def plan(ws, args):
    path = ws.input(args.spec, {".json"})
    prepared = common.strict_json(path)
    prepared = prepared if isinstance(prepared, dict) else {}
    source_ids = prepared.get("source_ids", [])
    evidence_ids = prepared.get("evidence_ids", [])
    dependencies = [common.source_record(ws, sid)[0] for sid in (source_ids if isinstance(source_ids, list) else []) if isinstance(sid, str)]
    dependencies += [common.extension_record(ws, "evidence", eid) for eid in (evidence_ids if isinstance(evidence_ids, list) else []) if isinstance(eid, str)]
    previous = common.extension_record(ws, "plans", args.previous) if args.previous else None
    if previous:
        dependencies.append(previous)
    inputs = [path] + [folder / "source.json" for folder in dependencies if folder.parent.name == "sources"]
    inputs += [folder / "evidence.json" for folder in dependencies if folder.parent.name == "evidence"]
    if previous:
        inputs.append(previous / "plan.json")

    def run(out):
        spec = validate(common.strict_json(path))
        sources = {}
        for sid in spec["source_ids"]:
            _, metadata, _ = common.source_record(ws, sid)
            sources[sid] = {"sha256": metadata["sha256"], "content_level": metadata["content_level"]}
        evidence = {}
        for eid in spec["evidence_ids"]:
            folder = common.extension_record(ws, "evidence", eid)
            item = common.strict_json(folder / "evidence.json")
            if item.get("source_id") not in sources or item.get("source_sha256") != sources[item["source_id"]]["sha256"]:
                raise ValueError("Evidence is not bound to a selected current plan source")
            evidence[eid] = {"source_id": item["source_id"], "sha256": research.digest(folder / "evidence.json")}
        history = []
        if previous:
            prior = common.strict_json(common.extension_record(ws, "plans", args.previous) / "plan.json")
            if prior.get("task_id") != ws.task_id or prior.get("plan_id") != args.previous:
                raise ValueError("Previous plan belongs to a different task/version")
            if prior.get("question") != spec["question"]:
                raise ValueError("Plan version must preserve its research question; use a new task")
            history = [*prior.get("history", []), {"plan_id": args.previous, "sha256": research.digest(previous / "plan.json")}]
            if args.id == args.previous or any(item["plan_id"] == args.id for item in history):
                raise ValueError("Plan history must not contain a cycle")
        gaps = []
        if not evidence:
            gaps.append("No verified literature evidence selected; this is a proposal, not established knowledge")
        if spec["clarification_questions"]:
            gaps.append("Clarification questions remain open")
        if spec.get("status") in ("ready", "confirmed") and gaps:
            raise ValueError("Unresolved evidence/clarification gaps must remain proposal")
        result = {**spec, "status": spec.get("status", "proposal"), "plan_id": args.id, "task_id": ws.task_id,
                  "previous": args.previous, "history": history, "sources": sources, "evidence": evidence,
                  "gaps": gaps, "scientific_approval": "pending; proposal/readiness/user confirmation is not scientific approval"}
        research.write_json(out / "plan.json", result)
        sections = ["# Research plan " + args.id, "", spec["question"], "", "Scope: " + spec["scope"],
                    "", "State: " + result["status"], "Analysis: " + spec["analysis_mode"], "Scientific approval: pending"]
        for title, key in (("Constraints", "constraints"), ("Success criteria", "success_criteria"),
                           ("Stop conditions", "stop_conditions"), ("Clarification questions", "clarification_questions")):
            sections += ["", "## " + title, ""] + ["- " + value for value in spec[key]]
        sections += ["", "## Proposed steps", ""] + ["- " + (value if isinstance(value, str) else value["action"]) for value in spec["steps"]]
        sections += ["", "## Hypotheses (unapproved)", ""] + ["- " + value["statement"] + " [" + ", ".join(value["evidence_ids"]) + "]" for value in spec["hypotheses"]]
        sections += ["", "## Gaps", ""] + ["- " + value for value in gaps]
        (out / "plan.md").write_text("\n".join(sections) + "\n", encoding="utf-8")
        return {"status": "partial" if gaps else "complete", "plan_state": result["status"], "scientific_approval": "pending"}

    return common.step(ws, "plans", args.id, {"previous": args.previous}, inputs, dependencies, run, entry=__file__)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("workspace", "task", "id", "spec"):
        parser.add_argument("--" + name, required=True)
    parser.add_argument("--previous")
    return common.cli(plan, parser, argv)


if __name__ == "__main__":
    raise SystemExit(main())
