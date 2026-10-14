"""One source tree for editable Word and safely generated TeX; no user code execution."""
from __future__ import annotations

import copy
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import os
import unicodedata
import zipfile
from urllib.parse import unquote

import research
import alignment_common as common

READER = "markdown+tex_math_dollars+tex_math_single_backslash+pipe_tables+grid_tables+multiline_tables+footnotes-citations-raw_html-raw_tex-raw_attribute-yaml_metadata_block-smart-latex_macros"
MAX_NODES = 100000
M = "http://schemas.openxmlformats.org/officeDocument/2006/math"
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"m": M, "w": W}


def executable(value, name):
    # Executable overrides are host CLI choices, never fields in a manuscript or template.
    found = shutil.which(value or name)
    if not found or not Path(found).is_file():
        raise ValueError(name + " executable is unavailable; no dependency is installed automatically")
    return str(Path(found).resolve())


def command(program, args, *, cwd, data=None, timeout=90):
    env = {k: v for k, v in os.environ.items() if k in ("PATH", "SystemRoot", "WINDIR", "TEMP", "TMP", "HOME", "USERPROFILE", "LOCALAPPDATA", "APPDATA")}
    env.update({"MIKTEX_ENABLE_INSTALLER": "0", "shell_escape": "f", "openout_any": "p"})
    result = subprocess.run([program, *args], input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            cwd=cwd, env=env, shell=False, timeout=timeout,
                            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    if result.returncode:
        message = (result.stderr + result.stdout)[-16000:].decode("utf-8", "replace")
        raise ValueError("Document conversion failed: " + message)
    if result.stderr.strip():
        raise ValueError("Document converter emitted warnings: " + result.stderr[-16000:].decode("utf-8", "replace"))
    return result.stdout


def pandoc(program, args, *, cwd, data=None):
    return command(program, ["+RTS", "-M512M", "-RTS", "--sandbox", "--fail-if-warnings", *args], cwd=cwd, data=data)


def parse_markdown(text, program, cwd):
    if "\x00" in text:
        raise ValueError("NUL is not permitted in document source")
    if any(marker in text for marker in ("YZTARGET_", "YZEQNUM_", "YZMATH_", "YZFIGURE_")):
        raise ValueError("Reserved internal document marker")
    tree = common.strict_json(pandoc(program, ["--from", READER, "--to", "json"], cwd=cwd, data=text.encode("utf-8")))
    if tree.get("meta"):
        raise ValueError("Use the explicit paper context, not document metadata")
    validate_tree(tree)
    return tree


INLINE = {"Str", "Space", "SoftBreak", "LineBreak", "Emph", "Strong", "Strikeout", "Superscript", "Subscript", "SmallCaps", "Quoted", "Math", "Note", "Span", "Code", "Link"}
BLOCK = {"Plain", "Para", "LineBlock", "CodeBlock", "BlockQuote", "OrderedList", "BulletList", "DefinitionList", "Header", "HorizontalRule", "Table", "Div", "Figure"}
ENUM = {"DisplayMath", "InlineMath", "SingleQuote", "DoubleQuote", "AlignLeft", "AlignRight", "AlignCenter", "AlignDefault", "ColWidth", "ColWidthDefault", "DefaultStyle", "Decimal", "LowerRoman", "UpperRoman", "LowerAlpha", "UpperAlpha", "DefaultDelim", "Period", "OneParen", "TwoParens"}


def target_identifier(value):
    if not isinstance(value, str) or not value or len(value) > 200:
        raise ValueError("Document identifier must contain 1–200 Unicode characters")
    value = unicodedata.normalize("NFC", value)
    if any(not (unicodedata.category(char)[0] in ("L", "N", "M") or char in "_-:.") for char in value):
        raise ValueError("Unsafe document identifier")
    return value


def validate_tree(tree):
    count = 0
    def visit(value, depth=0):
        nonlocal count
        count += 1
        if count > MAX_NODES or depth > 100:
            raise ValueError("Document structure exceeds resource limits")
        if isinstance(value, dict):
            tag = value.get("t")
            if tag and tag not in INLINE | BLOCK | ENUM:
                raise ValueError("Unsupported document node: " + tag)
            if tag == "Link":
                if value["c"][0] != ["", [], []]: raise ValueError("Link attributes are not supported; put the target on a surrounding span")
                target = value["c"][2][0]
                if target.startswith("#"):
                    target_identifier(unquote(target[1:], errors="strict"))
                elif not re.fullmatch(r"https?://[^\s\x00-\x1f]+", target):
                    raise ValueError("Only HTTP(S) or internal links are permitted; links are never fetched")
            if tag == "Math":
                source = value["c"][1]
                if len(source) > 50000 or re.search(r"\\(?:input|include|includegraphics|usepackage|documentclass|write|openin|openout|read|catcode|csname|def|gdef|edef|xdef|let|futurelet|newcommand|renewcommand|newenvironment|special|directlua|luaexec|pdfobj|pdfximage|filecontents|immediate|loop|repeat|shipout|every|endlinechar)\b", source):
                    raise ValueError("Executable, external or oversized mathematical input is forbidden")
                for environment in re.findall(r"\\(?:begin|end)\s*\{([^}]+)\}", source):
                    if environment not in ("matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "smallmatrix", "cases", "aligned", "alignedat", "gathered", "array", "split", "equation", "equation*", "align", "align*", "gather", "gather*"):
                        raise ValueError("Unsupported mathematical environment: " + environment)
            if tag in ("Span", "Div", "Code", "CodeBlock", "Header", "Table", "Figure"):
                attr = value["c"][1] if tag == "Header" else value["c"][0]
                if not isinstance(attr, list) or len(attr) != 3 or attr[2]:
                    raise ValueError("Raw document attributes are not permitted")
                if attr[0]: target_identifier(attr[0])
                if any(not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*", x) for x in attr[1]):
                    raise ValueError("Unsafe document class")
            for item in value.values():
                visit(item, depth + 1)
        elif isinstance(value, list):
            for item in value:
                visit(item, depth + 1)
        elif isinstance(value, float) and not math.isfinite(value):
            raise ValueError("Nonfinite document dimension")
    visit(tree)


def text_inlines(text):
    return [{"t": "Space"} if part.isspace() else {"t": "Str", "c": part}
            for part in re.findall(r"\s+|\S+", str(text))]


def plain(value):
    if isinstance(value, list):
        return "".join(plain(x) for x in value)
    if not isinstance(value, dict):
        return ""
    tag, content = value.get("t"), value.get("c")
    if tag == "Str":
        return content
    if tag in ("Space", "SoftBreak", "LineBreak"):
        return " "
    if tag in ("Math", "Code"):
        return content[1]
    if tag == "Header":
        return plain(content[2])
    if tag in ("Span", "Quoted"):
        return plain(content[1])
    if tag == "Link":
        return plain(content[1])
    return plain(content)


def selected_context(ws, raw):
    context = common.strict_json(raw)
    if not isinstance(context, dict) or not isinstance(context.get("title"), str) or not context["title"].strip():
        raise ValueError("Paper context requires a nonempty title")
    mapping = {"sources": ("selected_sources", "source.json"), "evidence": ("evidence_ids", "evidence.json"),
               "claims": ("claim_ids", "claim.json"), "analysis": ("analysis_ids", "result.json"), "figures": ("figure_ids", "manifest.json")}
    records = {}
    for kind, (field, filename) in mapping.items():
        ids = context.get(field, [])
        if not isinstance(ids, list) or any(not isinstance(x, str) for x in ids) or len(ids) != len(set(ids)):
            raise ValueError("Invalid/duplicate " + field)
        records[kind] = {}
        for ident in ids:
            folder = common.extension_record(ws, kind, ident)
            records[kind][ident] = (folder, common.strict_json(folder / filename))
    if "selected_sources" not in context:
        raise ValueError("Explicit selected_sources is required")
    sources = set(records["sources"])
    for _, item in records["evidence"].values():
        if item["source_id"] not in sources:
            raise ValueError("Evidence uses an unselected source")
    for _, item in records["claims"].values():
        if not set(item["evidence_ids"]).issubset(records["evidence"]):
            raise ValueError("Claim uses unselected evidence")
    for _, item in records["analysis"].values():
        if item["source"] not in sources:
            raise ValueError("Analysis uses an unselected source")
    for _, item in records["figures"].values():
        if item["analysis"] not in records["analysis"] or item["data_source"] not in sources:
            raise ValueError("Figure is outside the selected context")
    return context, records


def resolve_tree(tree, records):
    tree = copy.deepcopy(tree)
    usage = {"citations": [], "evidence": [], "claims": [], "values": [], "figures": []}
    def replace(match):
        citation, kind, key, analysis_id, pointer = match.groups()
        if citation:
            if citation not in records["sources"] or records["sources"][citation][1]["content_level"] == "data":
                raise ValueError("Unknown, unselected or data-only citation: " + citation)
            if citation not in usage["citations"]:
                usage["citations"].append(citation)
            return "[" + str(usage["citations"].index(citation) + 1) + "]"
        if analysis_id:
            if analysis_id not in records["analysis"]:
                raise ValueError("Unselected analysis value")
            value = records["analysis"][analysis_id][1]
            try:
                for component in pointer.split("/"):
                    value = value[int(component)] if isinstance(value, list) and re.fullmatch(r"0|[1-9][0-9]{0,8}", component) else value[component]
            except (KeyError, TypeError, IndexError) as error:
                raise ValueError("Unknown result pointer") from error
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                raise ValueError("Result marker must select a finite number")
            usage["values"].append({"analysis": analysis_id, "pointer": pointer, "value": value})
            return format(value, ".6g")
        plural = {"evidence": "evidence", "claim": "claims", "figure": "figures"}[kind]
        if key not in records[plural]:
            raise ValueError("Unselected " + kind)
        if plural == "figures":
            if key not in usage[plural]:
                usage[plural].append(key)
            return "YZFIGURE_" + key
        usage[plural].append(key)
        return ""
    def visit(value):
        if isinstance(value, list):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            tag = value.get("t")
            if tag == "Math":
                # Mathematical brackets and commands are not citation or result markers.
                if research.TOKENS.search(value["c"][1]):
                    raise ValueError("Place evidence/result markers in text adjacent to the equation")
                return
            if tag == "Header" and plain(value["c"][2]).casefold() in ("references", "bibliography", "参考文献"):
                raise ValueError("References are generated only from selected citations")
            if tag == "Str":
                text = value["c"]
                if any(marker in text for marker in ("YZFIGURE_", "YZMATH_", "YZTARGET_", "YZEQNUM_")):
                    raise ValueError("Reserved internal document marker")
                if re.search(r"\[\d+(?:[\s,;–-]+\d+)*\]", text):
                    raise ValueError("Use selected-source citation markers in prose")
                text = research.TOKENS.sub(replace, text)
                if "[@" in text or re.search(r"\[(?:value|evidence|claim|figure):", text):
                    raise ValueError("Malformed source/result marker")
                value["c"] = text
            else:
                for item in value.values():
                    visit(item)
    visit(tree["blocks"])
    required = {records["evidence"][e][1]["source_id"] for e in usage["evidence"]}
    for claim in usage["claims"]:
        required.update(records["evidence"][e][1]["source_id"] for e in records["claims"][claim][1]["evidence_ids"])
    if not required.issubset(usage["citations"]):
        raise ValueError("Evidence and claim prose must cite its source")
    if usage["citations"]:
        heading = "参考文献" if CJK_TEXT.search(plain(tree["blocks"])) else "References"
        tree["blocks"].append({"t": "Header", "c": [1, ["", [], []], text_inlines(heading)]})
        for index, ident in enumerate(usage["citations"], 1):
            item = records["sources"][ident][1]
            text = f"[{index}] {item['authors']}. {item['title']}. {item['year']}. " + ("https://doi.org/" + item["doi"] if item.get("doi") else item.get("url", ""))
            tree["blocks"].append({"t": "Para", "c": text_inlines(text)})
    return tree, usage


def bind_crossreferences(tree):
    """Resolve source IDs/numbered equations once; both writers consume these bindings."""
    targets, equations, links = {}, [], []
    attr_types = {"Header", "Span", "Div", "Code", "CodeBlock", "Table", "Figure"}
    def add(identifier, node, kind):
        ident = target_identifier(identifier)
        if ident in targets: raise ValueError("Duplicate document target: " + ident)
        safe = "yz" + hashlib.sha256(ident.encode("utf-8")).hexdigest()[:32]
        if any(item["target"] == safe for item in targets.values()): raise ValueError("Document target hash collision")
        item = {"source_id": ident, "target": safe, "kind": kind}
        targets[ident] = item
        node["crossref_target"] = safe
        return item
    def math_in(value):
        if isinstance(value, list): return [item for child in value for item in math_in(child)]
        if isinstance(value, dict):
            if value.get("t") == "Math": return [value]
            return [item for child in value.values() for item in math_in(child)]
        return []
    def equation_only(value):
        if isinstance(value, list): return all(equation_only(child) for child in value)
        if not isinstance(value, dict): return False
        tag = value.get("t")
        if tag in ("Math", "Space", "SoftBreak", "LineBreak"): return True
        if tag == "Str": return not value["c"].strip()
        if tag in ("Para", "Plain"): return equation_only(value["c"])
        if tag in ("Div", "Span"): return equation_only(value["c"][1])
        return False
    def visit(value):
        if isinstance(value, list):
            for child in value: visit(child)
        elif isinstance(value, dict):
            tag, content = value.get("t"), value.get("c")
            if tag in attr_types:
                attr = content[1] if tag == "Header" else content[0]
                if attr[0]:
                    item = add(attr[0], value, tag)
                    attr[0] = item["target"]
                    if tag in ("Span", "Div") and item["source_id"].startswith("eq:"):
                        found = math_in(content[1])
                        if len(found) != 1 or found[0]["c"][0]["t"] != "DisplayMath" or not equation_only(content[1]): raise ValueError("An eq: container must identify exactly one display equation without extra prose")
                        found[0]["equation_binding"] = item
            if tag == "Math":
                source = content[1]
                labels = re.findall(r"\\label\s*\{([^{}]+)\}", source)
                if re.search(r"\\tag\b", source): raise ValueError("Manual equation tags are not supported; use an explicit equation label")
                if labels:
                    if len(labels) != 1 or content[0]["t"] != "DisplayMath" or value.get("equation_binding"):
                        raise ValueError("Use exactly one label on a display equation")
                    value["equation_binding"] = add(labels[0], value, "equation")
                    content[1] = re.sub(r"\\label\s*\{[^{}]+\}", "", source).strip()
                    if not content[1]: raise ValueError("A labeled equation cannot be empty")
                if re.search(r"\\label\b", content[1]): raise ValueError("Malformed equation label")
                if value.get("equation_binding"):
                    equations.append(value)
            for key, child in list(value.items()):
                if key not in ("crossref_target", "equation_binding"): visit(child)
    visit(tree["blocks"])
    for number, equation in enumerate(equations, 1):
        item = equation["equation_binding"]
        item["equation_number"] = number
        equation["equation_number"] = number
        equation["equation_target"] = item["target"]
        del equation["equation_binding"]
    def reference(identifier, kind):
        ident = target_identifier(identifier)
        item = targets.get(ident)
        if not item or "equation_number" not in item: raise ValueError("Unknown equation reference: " + ident)
        number = str(item["equation_number"])
        label = "(" + number + ")" if kind == "eqref" else number
        return {"t": "Link", "c": [["", [], []], text_inlines(label), ["#" + ident, ""]], "equation_reference": {"source_id": ident, "kind": kind}}
    command_ref = re.compile(r"\\(eqref|ref)\s*\{([^{}]+)\}")
    def resolve(value):
        if isinstance(value, list):
            result = []
            for child in value:
                if isinstance(child, dict) and child.get("t") == "Str" and command_ref.search(child["c"]):
                    end = 0
                    for match in command_ref.finditer(child["c"]):
                        if match.start() > end: result.append(resolve({"t": "Str", "c": child["c"][end:match.start()]}))
                        result.append(resolve(reference(match[2], match[1])))
                        end = match.end()
                    if end < len(child["c"]): result.append(resolve({"t": "Str", "c": child["c"][end:]}))
                else: result.append(resolve(child))
            return result
        if not isinstance(value, dict): return value
        if value.get("t") == "Math":
            raw = value["c"][1]
            ref = command_ref.fullmatch(raw.strip())
            if ref and value["c"][0]["t"] == "InlineMath": return resolve(reference(ref[2], ref[1]))
            if re.search(r"\\(?:ref|eqref)\b", raw): raise ValueError("Place equation references in prose or their own inline math reference")
        if value.get("t") == "Str" and re.search(r"\\(?:label|ref|eqref)\b", value["c"]):
            raise ValueError("Malformed or misplaced equation label/reference")
        if value.get("t") == "Link" and value["c"][2][0].startswith("#"):
            ident = target_identifier(unquote(value["c"][2][0][1:], errors="strict"))
            if ident not in targets: raise ValueError("Dangling internal document reference: " + ident)
            target = targets[ident]["target"]
            value["c"][2][0] = "#" + target
            links.append({"source_id": ident, "target": target, "text": plain(value["c"][1])})
        for key, child in list(value.items()): value[key] = resolve(child)
        return value
    tree["blocks"] = resolve(tree["blocks"])
    return {"targets": list(targets.values()), "links": links, "numbering": "only explicitly labeled display equations, in source order"}


def word_crossreferences(tree):
    """Use explicit marker positions; Word bookmarks are created and verified afterwards."""
    tree = copy.deepcopy(tree)
    def prefix_block(blocks, marker):
        for block in blocks:
            if block["t"] in ("Para", "Plain"):
                block["c"].insert(0, {"t": "Str", "c": marker}); return
            if block["t"] == "Header":
                block["c"][2].insert(0, {"t": "Str", "c": marker}); return
        blocks.insert(0, {"t": "Para", "c": [{"t": "Str", "c": marker}]})
    def walk(value):
        if isinstance(value, list):
            for child in value: walk(child)
        elif isinstance(value, dict):
            for key, child in list(value.items()):
                if key == "c": walk(child)
            tag, content = value.get("t"), value.get("c")
            target = value.pop("crossref_target", None)
            if tag in ("Header", "Span", "Div", "Code", "CodeBlock", "Table", "Figure"):
                (content[1] if tag == "Header" else content[0])[0] = ""
            if target:
                marker = "YZTARGET_" + target + "_END"
                if tag == "Header": content[2].insert(0, {"t": "Str", "c": marker})
                elif tag == "Span": content[1].insert(0, {"t": "Str", "c": marker})
                elif tag == "Div": prefix_block(content[1], marker)
                elif tag == "Table":
                    rows = content[3][1] + [row for body in content[4] for row in body[2] + body[3]] + content[5][1]
                    if not rows or not rows[0][1]: raise ValueError("Cannot anchor an empty table")
                    prefix_block(rows[0][1][0][4], marker)
                elif tag in ("Code", "CodeBlock", "Math", "Figure"):
                    original = copy.deepcopy(value)
                    if tag in ("Code", "Math"):
                        value.clear(); value.update({"t": "Span", "c": [["", [], []], [{"t": "Str", "c": marker}, original]]})
                    else:
                        value.clear(); value.update({"t": "Div", "c": [["", [], []], [{"t": "Para", "c": [{"t": "Str", "c": marker}]}, original]]})
    walk(tree["blocks"])
    def strip(value):
        if isinstance(value, list): return [strip(x) for x in value]
        if isinstance(value, dict): return {key: strip(child) for key, child in value.items() if key not in ("equation_number", "equation_target", "equation_reference", "safe_math")}
        return value
    return strip(tree)


def markdown_crossreferences(tree, bindings):
    tree = copy.deepcopy(tree)
    originals = {item["target"]: item["source_id"] for item in bindings["targets"]}
    def restore(value):
        if isinstance(value, list): return [restore(child) for child in value]
        if not isinstance(value, dict): return value
        if value.get("equation_reference"):
            item = value["equation_reference"]
            return {"t": "Str", "c": "\\" + item["kind"] + "{" + item["source_id"] + "}"}
        tag, content = value.get("t"), value.get("c")
        if tag in ("Header", "Span", "Div", "Code", "CodeBlock", "Table", "Figure"):
            attr = content[1] if tag == "Header" else content[0]
            if attr[0] in originals: attr[0] = originals[attr[0]]
        if tag == "Link" and content[2][0].startswith("#"):
            content[2][0] = "#" + originals[content[2][0][1:]]
        if tag == "Math" and value.get("crossref_target") and value.get("equation_number"):
            content[1] += r" \label{" + originals[value["crossref_target"]] + "}"
        return {key: restore(child) for key, child in value.items() if key not in ("equation_number", "equation_target", "equation_reference", "crossref_target", "safe_math")}
    return restore(tree)


def safe_xml(raw):
    from lxml import etree
    if b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper():
        raise ValueError("XML DTD/entities are forbidden")
    root = etree.fromstring(raw, parser=etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False, huge_tree=False))
    if root.getroottree().docinfo.doctype:
        raise ValueError("XML DTD/entities are forbidden")
    return root


def zip_parts(path):
    with zipfile.ZipFile(path) as archive:
        infos = archive.infolist()
        if len(infos) > 1000 or sum(i.file_size for i in infos) > 60 * 1024 * 1024:
            raise ValueError("DOCX archive exceeds resource limits")
        names = set()
        parts = {}
        for item in infos:
            name = item.filename
            if name in names or name.casefold() in {x.casefold() for x in names} or name.startswith("/") or "\\" in name or ":" in name or ".." in Path(name).parts:
                raise ValueError("Unsafe or duplicate DOCX archive path")
            names.add(name)
            if item.file_size > 20 * 1024 * 1024 or item.file_size > max(1, item.compress_size) * 300:
                raise ValueError("DOCX entry exceeds resource limits")
            if item.is_dir():
                continue
            raw = archive.read(item)
            if name.endswith((".xml", ".rels")):
                safe_xml(raw)
            parts[name] = raw
        return parts


def write_docx_parts(path, parts):
    staged = path.with_name(path.stem + "-rewritten.docx")
    with zipfile.ZipFile(staged, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in parts.items(): archive.writestr(name, data)
    staged.replace(path)


def install_word_targets(path, bindings):
    from collections import Counter
    from lxml import etree
    parts, found, actual_links = zip_parts(path), Counter(), Counter()
    expected = {item["target"] for item in bindings["targets"]}
    marker = re.compile(r"YZTARGET_(yz[0-9a-f]{32})_END")
    bookmark_id = 100000
    for filename in ("word/document.xml", "word/footnotes.xml"):
        if filename not in parts: continue
        root = safe_xml(parts[filename])
        for text in list(root.findall(".//w:t", NS)):
            while text.text and marker.search(text.text):
                match = marker.search(text.text)
                target = match[1]
                if target not in expected: raise ValueError("Unexpected Word target marker")
                run = text.getparent()
                if run.tag != "{" + W + "}r" or len(run.findall("w:t", NS)) != 1 or any(child.tag not in ("{" + W + "}t", "{" + W + "}rPr") for child in run):
                    raise ValueError("Word target marker cannot be placed without changing content")
                before, after = text.text[:match.start()], text.text[match.end():]
                if before:
                    prefix = copy.deepcopy(run); prefix.find("w:t", NS).text = before; run.addprevious(prefix)
                start = etree.Element("{" + W + "}bookmarkStart"); start.set("{" + W + "}id", str(bookmark_id)); start.set("{" + W + "}name", target)
                end = etree.Element("{" + W + "}bookmarkEnd"); end.set("{" + W + "}id", str(bookmark_id))
                bookmark_id += 1
                run.addprevious(start); run.addprevious(end)
                text.text = after
                found[target] += 1
        for node in root.findall(".//w:hyperlink", NS):
            if node.get("{" + W + "}anchor"): actual_links[node.get("{" + W + "}anchor")] += 1
        for para in list(root.findall(".//w:p", NS)):
            if para.findall("w:bookmarkStart", NS) and not any((node.text or "").strip() for node in para.findall(".//w:t", NS)) and not para.findall(".//m:oMath", NS) and not para.findall(".//w:drawing", NS):
                following = para.getnext()
                if following is not None and following.tag == "{" + W + "}p":
                    position = 1 if len(following) and following[0].tag == "{" + W + "}pPr" else 0
                    for item in list(para):
                        if item.tag in ("{" + W + "}bookmarkStart", "{" + W + "}bookmarkEnd"):
                            following.insert(position, item); position += 1
                    para.getparent().remove(para)
        existing = [node.get("{" + W + "}name") for node in root.findall(".//w:bookmarkStart", NS)]
        if len(existing) != len(set(existing)): raise ValueError("Duplicate actual Word bookmark")
        parts[filename] = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)
    if found != Counter({name: 1 for name in expected}): raise ValueError("Word output lost or duplicated source targets")
    needed = Counter(item["target"] for item in bindings["links"])
    if actual_links != needed: raise ValueError("Word output lost or changed internal hyperlinks")
    write_docx_parts(path, parts)


def verify_word_crossreferences(path, bindings):
    from collections import Counter
    targets, links = Counter(), Counter()
    for filename, data in zip_parts(path).items():
        if filename not in ("word/document.xml", "word/footnotes.xml"): continue
        root = safe_xml(data)
        targets.update(node.get("{" + W + "}name") for node in root.findall(".//w:bookmarkStart", NS) if (node.get("{" + W + "}name") or "").startswith("yz"))
        links.update(node.get("{" + W + "}anchor") for node in root.findall(".//w:hyperlink", NS) if (node.get("{" + W + "}anchor") or "").startswith("yz"))
    if targets != Counter({item["target"]: 1 for item in bindings["targets"]}) or links != Counter(item["target"] for item in bindings["links"]):
        raise ValueError("Final Word target/hyperlink bindings differ from the source")
    return {"targets": sum(targets.values()), "links": sum(links.values()), "status": "pass"}


def verify_pdf_crossreferences(reader, bindings):
    from collections import Counter
    expected = {item["target"] for item in bindings["targets"]}
    if not expected.issubset(reader.named_destinations): raise ValueError("PDF is missing source internal targets")
    found = Counter()
    for page in reader.pages:
        for annotation in page.get("/Annots", []):
            annotation = annotation.get_object()
            action = annotation.get("/A")
            action = action.get_object() if action is not None else {}
            destination = action.get("/D") if action.get("/S") == "/GoTo" else annotation.get("/Dest")
            if isinstance(destination, bytes): destination = destination.decode("ascii", "strict")
            if isinstance(destination, str) and destination in expected: found[destination] += 1
    needed = Counter(item["target"] for item in bindings["links"])
    if any(found[target] < count for target, count in needed.items()): raise ValueError("PDF is missing actual internal link annotations")
    return {"targets": len(expected), "links": sum(needed.values()), "link_annotations": sum(found.values()), "status": "pass"}


def escape_tex(value):
    replacement = {"\\": r"\textbackslash{}", "{": r"\{", "}": r"\}", "$": r"\$", "&": r"\&", "%": r"\%", "#": r"\#", "_": r"\_", "~": r"\textasciitilde{}", "^": r"\textasciicircum{}"}
    return "".join(replacement.get(c, c if ord(c) >= 32 or c in "\n\t" else "") for c in str(value))


CJK_TEXT = re.compile(r"[\u2e80-\ua4cf\uac00-\ud7af\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef\U00020000-\U0003134f]+")


def tex_text(value):
    """Explicit CJK runs use the declared font; XeTeX supplies Unicode line breaking."""
    result, end = [], 0
    for match in CJK_TEXT.finditer(str(value)):
        result.extend((escape_tex(str(value)[end:match.start()]), r"{\YZCJK " + escape_tex(match[0]) + "}"))
        end = match.end()
    result.append(escape_tex(str(value)[end:]))
    return "".join(result)


SYMBOLS = dict(zip("αβγδεζηθικλμνξοπρστυφχψω", ("alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi o pi rho sigma tau upsilon phi chi psi omega").split()))
SYMBOLS.update(dict(zip("ΓΔΘΛΞΠΣΥΦΨΩ", "Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega".split())))
SYMBOLS.update({"∑": "sum", "∏": "prod", "∐": "coprod", "∫": "int", "∬": "iint", "∭": "iiint", "∮": "oint", "∞": "infty", "∂": "partial", "∇": "nabla", "±": "pm", "∓": "mp", "×": "times", "÷": "div", "·": "cdot", "⋅": "cdot", "≤": "leq", "≥": "geq", "≠": "neq", "≈": "approx", "≡": "equiv", "∼": "sim", "∝": "propto", "∈": "in", "∉": "notin", "⊂": "subset", "⊆": "subseteq", "⊃": "supset", "⊇": "supseteq", "∪": "cup", "∩": "cap", "∅": "emptyset", "∧": "wedge", "∨": "vee", "¬": "neg", "∀": "forall", "∃": "exists", "→": "to", "←": "leftarrow", "↔": "leftrightarrow", "⇒": "Rightarrow", "⇐": "Leftarrow", "⇔": "Leftrightarrow", "↦": "mapsto", "…": "ldots", "⋯": "cdots", "⋮": "vdots", "⋱": "ddots", "ℝ": "mathbb{R}", "ℂ": "mathbb{C}", "ℕ": "mathbb{N}", "ℤ": "mathbb{Z}", "ℚ": "mathbb{Q}", "ℓ": "ell", "ℏ": "hbar", "ϵ": "varepsilon", "ϕ": "varphi", "ϑ": "vartheta", "ϱ": "varrho", "ς": "varsigma", "ϖ": "varpi", "−": "mathbin{-}"})


def math_atom(text, normal=False):
    if normal:
        return r"\text{" + tex_text(text) + "}"
    result = []
    for char in text:
        if char in SYMBOLS:
            result.append("\\" + SYMBOLS[char] + " ")
        elif char.isascii() and (char.isalnum() or char in "+-=(),.;:!?/|[]' "):
            result.append(char)
        elif 0x1D400 <= ord(char) <= 0x1D7FF:
            base = unicodedata.normalize("NFKD", char)
            rendered = math_atom(base)
            name = unicodedata.name(char, "")
            command_name = "mathbf" if "BOLD" in name else "mathbb" if "DOUBLE-STRUCK" in name else "mathcal" if "SCRIPT" in name else "mathfrak" if "FRAKTUR" in name else "mathit"
            result.append("\\" + command_name + "{" + rendered + "}")
        else:
            result.append(r"\text{" + tex_text(char) + "}")
    return "".join(result)


def omml_tex(node):
    """Serialize native math structure, never execute or pass through source TeX."""
    from lxml import etree
    tag = etree.QName(node).localname
    if etree.QName(node).namespace != M:
        raise ValueError("Unexpected namespace in native math structure")
    props = {"oMathParaPr", "rPr", "ctrlPr", "fPr", "radPr", "sSubPr", "sSupPr", "sSubSupPr", "sPrePr", "naryPr", "dPr", "mPr", "eqArrPr", "accPr", "barPr", "groupChrPr", "limLowPr", "limUppPr", "funcPr", "boxPr", "borderBoxPr", "phantPr"}
    def child(name):
        values = node.findall("m:" + name, NS)
        if len(values) != 1:
            raise ValueError("Native equation requires exactly one " + name)
        return omml_tex(values[0])
    def children(name):
        return [omml_tex(x) for x in node.findall("m:" + name, NS)]
    def prop(group, name, default=""):
        found = node.find("m:" + group + "/m:" + name, NS)
        return found.get("{" + M + "}val", default) if found is not None else default
    structural = [x for x in node if etree.QName(x).localname not in props]
    if tag in props:
        return ""
    if tag in ("oMath", "oMathPara", "e", "num", "den", "deg", "sub", "sup", "lim", "fName"):
        return "".join(omml_tex(x) for x in structural)
    if tag == "r":
        if any(etree.QName(x).localname not in ("t", "rPr", "ctrlPr") and etree.QName(x).namespace == M for x in node):
            raise ValueError("Unsupported native math run")
        text = "".join(x.text or "" for x in node.findall("m:t", NS))
        normal = node.find("m:rPr/m:nor", NS) is not None
        rendered = math_atom(text, normal)
        style = node.find("m:rPr/m:sty", NS)
        if style is not None and style.get("{" + M + "}val") in ("b", "bi"):
            rendered = r"\boldsymbol{" + rendered + "}"
        elif style is not None and style.get("{" + M + "}val") == "p" and not normal:
            rendered = r"\mathrm{" + rendered + "}"
        script = node.find("m:rPr/m:scr", NS)
        if script is not None:
            face = {"roman": "mathrm", "script": "mathcal", "fraktur": "mathfrak", "double-struck": "mathbb", "sans-serif": "mathsf", "monospace": "mathtt"}.get(script.get("{" + M + "}val"))
            if not face: raise ValueError("Unsupported mathematical alphabet")
            rendered = "\\" + face + "{" + rendered + "}"
        return (" & " if node.find("m:rPr/m:aln", NS) is not None else "") + rendered
    if tag == "t":
        return math_atom(node.text or "")
    if tag == "f":
        kind = prop("fPr", "type", "bar")
        if kind not in ("bar", "noBar", "skw", "lin"):
            raise ValueError("Unsupported fraction layout")
        if kind in ("lin", "skw"):
            return "{" + child("num") + "}/{" + child("den") + "}"
        return (r"\genfrac{}{}{0pt}{}{" if kind == "noBar" else r"\frac{") + child("num") + "}{" + child("den") + "}"
    if tag == "rad":
        degree = children("deg")
        return r"\sqrt" + ("[" + degree[0] + "]" if degree and degree[0] and prop("radPr", "degHide") not in ("1", "true") else "") + "{" + child("e") + "}"
    if tag in ("sSub", "sSup", "sSubSup", "sPre"):
        base = "{" + child("e") + "}"
        sub = "_{" + child("sub") + "}" if tag in ("sSub", "sSubSup", "sPre") else ""
        sup = "^{" + child("sup") + "}" if tag in ("sSup", "sSubSup", "sPre") else ""
        return "{}" + sub + sup + base if tag == "sPre" else base + sub + sup
    if tag == "nary":
        char = prop("naryPr", "chr", "∫")
        allowed = {"∫", "∬", "∭", "∮", "∑", "∏", "∐", "∪", "∩", "∧", "∨"}
        if char not in allowed:
            raise ValueError("Unsupported n-ary operator")
        operator = {"∪": r"\bigcup", "∩": r"\bigcap", "∧": r"\bigwedge", "∨": r"\bigvee"}.get(char, "\\" + SYMBOLS[char])
        operator += r"\limits" if prop("naryPr", "limLoc") == "undOvr" else r"\nolimits"
        for name, marker in (("sub", "_"), ("sup", "^")):
            values = children(name)
            if values and values[0] and prop("naryPr", name + "Hide") not in ("1", "true"):
                operator += marker + "{" + values[0] + "}"
        return operator + " {" + child("e") + "}"
    if tag == "d":
        delimiters = {"(": "(", ")": ")", "[": "[", "]": "]", "{": r"\{", "}": r"\}", "|": "|", "‖": r"\Vert", "⟨": r"\langle", "⟩": r"\rangle", "⌊": r"\lfloor", "⌋": r"\rfloor", "⌈": r"\lceil", "⌉": r"\rceil", "": "."}
        begin, end, separator = prop("dPr", "begChr", "("), prop("dPr", "endChr", ")"), prop("dPr", "sepChr", "|")
        if begin not in delimiters or end not in delimiters or separator not in delimiters:
            raise ValueError("Unsupported equation delimiter")
        return r"\left" + delimiters[begin] + (r"\middle" + delimiters[separator]).join(children("e")) + r"\right" + delimiters[end]
    if tag == "m":
        rows = node.findall("m:mr", NS)
        if not rows or len({len(row.findall("m:e", NS)) for row in rows}) != 1:
            raise ValueError("Invalid matrix dimensions")
        alignment = []
        for column in node.findall("m:mPr/m:mcs/m:mc/m:mcPr", NS):
            count = column.find("m:count", NS)
            justify = column.find("m:mcJc", NS)
            count = int(count.get("{" + M + "}val", "1")) if count is not None else 1
            mode = justify.get("{" + M + "}val", "center") if justify is not None else "center"
            if count < 1 or count > 100 or mode not in ("left", "center", "right"):
                raise ValueError("Unsupported matrix column alignment")
            alignment.extend([{"left": "l", "center": "c", "right": "r"}[mode]] * count)
        content = r"\\".join(" & ".join(omml_tex(x) for x in row.findall("m:e", NS)) for row in rows)
        if alignment:
            if len(alignment) != len(rows[0].findall("m:e", NS)): raise ValueError("Matrix alignment differs from its columns")
            return r"\begin{array}{" + "".join(alignment) + "}" + content + r"\end{array}"
        return r"\begin{matrix}" + content + r"\end{matrix}"
    if tag == "eqArr":
        return r"\begin{aligned}" + r"\\".join(children("e")) + r"\end{aligned}"
    if tag == "acc":
        accents = {"̂": "widehat", "ˆ": "widehat", "^": "widehat", "̃": "widetilde", "˜": "widetilde", "~": "widetilde", "̄": "overline", "¯": "overline", "⃗": "vec", "→": "overrightarrow", "̇": "dot", "̈": "ddot", "̆": "breve", "̌": "check", "́": "acute", "̀": "grave"}
        char = prop("accPr", "chr", "̂")
        if char not in accents:
            raise ValueError("Unsupported mathematical accent")
        return "\\" + accents[char] + "{" + child("e") + "}"
    if tag == "bar":
        return (r"\underline{" if prop("barPr", "pos") == "bot" else r"\overline{") + child("e") + "}"
    if tag == "groupChr":
        char = prop("groupChrPr", "chr", "⏟")
        if char not in ("⏟", "⏞", "{", "}"):
            raise ValueError("Unsupported group character")
        return (r"\underbrace{" if prop("groupChrPr", "pos", "bot") == "bot" else r"\overbrace{") + child("e") + "}"
    if tag in ("limLow", "limUpp"):
        return (r"\underset{" if tag == "limLow" else r"\overset{") + child("lim") + "}{" + child("e") + "}"
    if tag == "func":
        return "{" + child("fName") + "} {" + child("e") + "}"
    if tag in ("box", "borderBox", "phant"):
        return (r"\boxed{" if tag == "borderBox" else r"\phantom{" if tag == "phant" else "{") + child("e") + "}"
    raise ValueError("Unsupported native math structure: " + tag)


def math_nodes(tree):
    main, notes = [], []
    def walk(value, bucket):
        if isinstance(value, list):
            for item in value:
                walk(item, bucket)
        elif isinstance(value, dict):
            if value.get("t") == "Math":
                bucket.append(value)
            elif value.get("t") == "Note":
                bucket2 = []
                walk(value["c"], bucket2)
                notes.append(bucket2)
            else:
                for item in value.values():
                    walk(item, bucket)
    walk(tree["blocks"], main)
    return main, notes


def bind_native_math(tree, docx, equation_width_twips=9000):
    from lxml import etree
    parts = zip_parts(docx)
    root = safe_xml(parts["word/document.xml"])
    main, notes = math_nodes(tree)
    pairs = [(main, root.findall(".//m:oMath", NS))]
    note_root = None
    if notes:
        if "word/footnotes.xml" not in parts:
            raise ValueError("DOCX is missing native footnotes")
        note_root = safe_xml(parts["word/footnotes.xml"])
        footnotes = [n for n in note_root.findall("w:footnote", NS) if int(n.get("{" + W + "}id", "-1")) > 0]
        if len(footnotes) != len(notes):
            raise ValueError("DOCX footnote count differs from the source tree")
        pairs.extend((source, note.findall(".//m:oMath", NS)) for source, note in zip(notes, footnotes))
    bindings = []
    for source_nodes, native_nodes in pairs:
        if len(source_nodes) != len(native_nodes):
            raise ValueError("DOCX native equation count differs from the source tree")
        for source, native in zip(source_nodes, native_nodes):
            safe = omml_tex(native)
            ident = "M" + str(len(bindings) + 1)
            bindings.append({"id": ident, "source_sha256": hashlib.sha256(source["c"][1].encode()).hexdigest(), "safe_tex": safe, "display": source["c"][0]["t"] == "DisplayMath"})
            source["safe_math"] = {"id": ident, "tex": safe}
            if source["c"][0]["t"] == "DisplayMath" and native.getparent().tag != "{" + M + "}oMathPara":
                display = etree.Element("{" + M + "}oMathPara")
                props = etree.SubElement(display, "{" + M + "}oMathParaPr")
                justify = etree.SubElement(props, "{" + M + "}jc"); justify.set("{" + M + "}val", "center")
                native.addprevious(display); display.append(native)
            if source.get("equation_number"):
                paragraph = native
                while paragraph is not None and paragraph.tag != "{" + W + "}p": paragraph = paragraph.getparent()
                if paragraph is None or len(paragraph.findall(".//m:oMath", NS)) != 1 or any((node.text or "").strip() for node in paragraph.findall(".//w:t", NS)):
                    raise ValueError("A numbered display equation must occupy its own paragraph")
                properties = paragraph.find("w:pPr", NS)
                if properties is None: properties = etree.Element("{" + W + "}pPr"); paragraph.insert(0, properties)
                tabs = properties.find("w:tabs", NS)
                if tabs is None: tabs = etree.SubElement(properties, "{" + W + "}tabs")
                tab = etree.SubElement(tabs, "{" + W + "}tab"); tab.set("{" + W + "}val", "right"); tab.set("{" + W + "}pos", str(equation_width_twips))
                run = etree.SubElement(paragraph, "{" + W + "}r"); etree.SubElement(run, "{" + W + "}tab")
                text = etree.SubElement(run, "{" + W + "}t"); text.text = "(" + str(source["equation_number"]) + ")"
                bindings[-1].update({"equation_number": source["equation_number"], "target": source["equation_target"], "docx_number_text": text.text})
    parts["word/document.xml"] = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)
    if note_root is not None: parts["word/footnotes.xml"] = etree.tostring(note_root, xml_declaration=True, encoding="UTF-8", standalone=True)
    write_docx_parts(docx, parts)
    return bindings
