#!/usr/bin/env python3
"""Retained source -> one tree -> native Word and safe, actual PDF, without reanalysis."""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import shutil

import research
import alignment_common as common
import document_ast as ast
import template_workflow as templates

EXTRA = [Path(ast.__file__), Path(templates.__file__)]


def dependencies(ws, context):
    result = []
    for kind, field in (("sources", "selected_sources"), ("evidence", "evidence_ids"), ("claims", "claim_ids"), ("analysis", "analysis_ids"), ("figures", "figure_ids")):
        for ident in context.get(field, []):
            result.append(common.extension_record(ws, kind, ident))
    return result


def collect_figures(ws, records, usage, out, spec):
    from PIL import Image
    images = {}
    width = (spec["page"]["width_mm"] - spec["page"]["left_mm"] - spec["page"]["right_mm"] - (spec["columns"]["count"] - 1) * spec["columns"]["gap_mm"]) / spec["columns"]["count"]
    for index, key in enumerate(usage["figures"], 1):
        folder, manifest = records["figures"][key]
        if manifest.get("audit", {}).get("issues"):
            raise ValueError("Selected figure has unresolved audit issues: " + key)
        declared = manifest.get("width_inches")
        if isinstance(declared, bool) or not isinstance(declared, (int, float)) or not 0 < declared * 25.4 <= width:
            raise ValueError("Selected figure print width exceeds the template column; explicitly create a suitable figure version")
        source = ws.task_path((folder / "figure.png").relative_to(ws.root), exists=True)
        with Image.open(source) as png:
            if png.format != "PNG": raise ValueError("Selected figure is not a PNG")
            pixels = png.size
            if max(pixels) > 30000 or pixels[0] * pixels[1] > 100000000: raise ValueError("Figure exceeds image resource limit")
            png.verify()
        filename = "figure-" + str(index) + ".png"
        shutil.copyfile(source, out / filename)
        caption = manifest.get("caption")
        if not isinstance(caption, str) or not caption.strip(): raise ValueError("Figure requires its retained caption")
        images[key] = {"file": filename, "width_inches": declared, "pixels": list(pixels), "caption": caption, "display_caption": "Figure " + str(index) + ". " + caption, "source_sha256": research.digest(source)}
    return images


def apply_word_layout(path, spec, images, tree):
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Inches, Pt
    doc = Document(path)
    found = []
    abstract = False
    for p in list(doc.paragraphs):
        match = re.fullmatch(r"YZFIGURE_([A-Za-z][A-Za-z0-9_-]{0,63})", p.text.strip())
        if "YZFIGURE_" in p.text and not match:
            raise ValueError("A figure marker must occupy its own paragraph")
        if match:
            key = match[1]
            if key not in images: raise ValueError("Unbound figure marker")
            found.append(key)
            item = images[key]
            bookmarks = [copy.deepcopy(node) for node in p._p if node.tag in (qn("w:bookmarkStart"), qn("w:bookmarkEnd"))]
            p.clear()
            for bookmark in bookmarks: p._p.append(bookmark)
            p.paragraph_format.first_line_indent = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(str(path.parent / item["file"]), width=Inches(item["width_inches"]))
            caption = OxmlElement("w:p")
            if spec["caption"]["figure_position"] == "below": p._p.addnext(caption)
            else: p._p.addprevious(caption)
            from docx.text.paragraph import Paragraph
            cp = Paragraph(caption, p._parent); cp.style = doc.styles["Caption"]; cp.add_run(item["display_caption"])
        if p.style.name.startswith("Heading"):
            abstract = p.text.strip().casefold() in ("abstract", "摘要")
        elif abstract and p.text.strip():
            p.style = doc.styles["Abstract"]
    if list(dict.fromkeys(found)) != list(images):
        raise ValueError("Word figure order/count differs from selected source")
    table_nodes = []
    def collect(value):
        if isinstance(value, list):
            for item in value: collect(item)
        elif isinstance(value, dict):
            if value.get("t") == "Table": table_nodes.append(value)
            if value.get("t") != "Note":
                for item in value.values(): collect(item)
    collect(tree["blocks"])
    from docx.table import Table
    word_tables = [Table(element, doc._body) for element in doc._element.body.iter(qn("w:tbl"))]
    if len(word_tables) != len(table_nodes): raise ValueError("Native Word table count differs from the source tree")
    for table, table_node in zip(word_tables, table_nodes):
        header_rows = len(table_node["c"][3][1])
        for row_index, row in enumerate(table.rows):
            if row_index < header_rows and spec["table"]["repeat_header"]:
                node = OxmlElement("w:tblHeader"); row._tr.get_or_add_trPr().append(node)
            for cell in row.cells:
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.font.size = Pt(spec["table"]["size_pt"])
                        if row_index < header_rows: run.bold = spec["table"]["header_bold"]
                    p.paragraph_format.line_spacing = Pt(spec["table"]["leading_pt"])
        props = table._tbl.tblPr
        existing = props.find(qn("w:tblBorders"))
        if existing is not None: props.remove(existing)
        borders = OxmlElement("w:tblBorders")
        for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
            border = OxmlElement("w:" + side)
            enabled = spec["table"]["borders"] == "grid" or spec["table"]["borders"] == "horizontal" and side in ("top", "bottom", "insideH")
            border.set(qn("w:val"), "single" if enabled else "nil"); border.set(qn("w:sz"), "4"); borders.append(border)
        props.append(borders)
    if spec["columns"]["count"] == 2 and spec["columns"]["title_full_width"]:
        titles = [p for p in doc.paragraphs if p.style.name == "Title"]
        if len(titles) != 1: raise ValueError("Full-width two-column layout requires exactly one title")
        sect = copy.deepcopy(doc.sections[-1]._sectPr)
        cols = sect.find(qn("w:cols")); cols.set(qn("w:num"), "1")
        typ = sect.find(qn("w:type"))
        if typ is None: typ = OxmlElement("w:type"); sect.append(typ)
        typ.set(qn("w:val"), "continuous")
        titles[0]._p.get_or_add_pPr().append(sect)
    doc.save(path)


UNNUMBERED_HEADINGS = {"abstract", "摘要", "references", "bibliography", "参考文献"}


def heading_offset(tree):
    levels = []
    def visit(value):
        if isinstance(value, list):
            for item in value: visit(item)
        elif isinstance(value, dict):
            if value.get("t") == "Header" and ast.plain(value["c"][2]).casefold() not in UNNUMBERED_HEADINGS:
                levels.append(value["c"][0])
            if value.get("t") != "Note":
                for item in value.values(): visit(item)
    visit(tree["blocks"])
    return min(levels, default=1) - 1


def tex_document(tree, title, spec, figures):
    esc = ast.tex_text
    table_count = 0
    list_depth = 0
    offset = heading_offset(tree)
    structure = {"equations": [], "tables": [], "footnotes": [], "figures": list(figures)}
    def anchor(node):
        target = node.get("crossref_target")
        if not target: return ""
        if not re.fullmatch(r"yz[0-9a-f]{32}", target): raise ValueError("Unbound output target")
        return r"\hypertarget{" + target + "}{}"
    def inline(nodes):
        result = []
        for node in nodes:
            tag, value = node["t"], node.get("c")
            result.append(anchor(node))
            if tag == "Str": result.append(esc(value))
            elif tag in ("Space", "SoftBreak"): result.append(" ")
            elif tag == "LineBreak": result.append(r"\newline{}")
            elif tag in ("Emph", "Strong", "Strikeout", "Superscript", "Subscript", "SmallCaps"):
                name = {"Emph": "emph", "Strong": "textbf", "Strikeout": "YZstrike", "Superscript": "textsuperscript", "Subscript": "textsubscript", "SmallCaps": "textsc"}[tag]
                result.append("\\" + name + "{" + inline(value) + "}")
            elif tag == "Quoted": result.append(("``" if value[0]["t"] == "DoubleQuote" else "`") + inline(value[1]) + ("''" if value[0]["t"] == "DoubleQuote" else "'"))
            elif tag == "Span": result.append(inline(value[1]))
            elif tag == "Link":
                if value[2][0].startswith("#"):
                    target = value[2][0][1:]
                    if not re.fullmatch(r"yz[0-9a-f]{32}", target): raise ValueError("Internal link was not bound to a source target")
                    result.append(r"\hyperlink{" + target + "}{" + inline(value[1]) + "}")
                else: result.append(inline(value[1]) + " (" + esc(value[2][0]) + ")")
            elif tag == "Code": result.append(r"\texttt{" + esc(value[1]) + "}")
            elif tag == "Math":
                item = node.get("safe_math")
                if not item: raise ValueError("Math has no verified native Word binding")
                structure["equations"].append(item["id"])
                if node.get("equation_number"):
                    result.append(r"\begin{equation}\tag{" + str(node["equation_number"]) + "}" + item["tex"] + r"\end{equation}")
                else: result.append((r"\[" if value[0]["t"] == "DisplayMath" else r"\(") + item["tex"] + (r"\]" if value[0]["t"] == "DisplayMath" else r"\)"))
            elif tag == "Note":
                structure["footnotes"].append({"id": "N" + str(len(structure["footnotes"]) + 1), "text": ast.plain(value)})
                result.append(r"\footnote{" + blocks(value) + "}")
            else: raise ValueError("Unsupported TeX inline: " + tag)
        return "".join(result)
    def row_tex(row, occupied, widths, header=False, header_columns=0):
        cells = []
        column = 0
        for _, align, rowspan, colspan, content in row[1]:
            if type(rowspan) is not int or type(colspan) is not int or not 1 <= rowspan <= 1000 or not 1 <= colspan <= 100:
                raise ValueError("Invalid table span")
            while column < len(occupied) and occupied[column]:
                cells.append(""); column += 1
            if column + colspan > len(occupied) or any(occupied[column:column + colspan]):
                raise ValueError("Table spans overlap or exceed its column count")
            text = blocks(content)
            if (header or column < header_columns) and spec["table"]["header_bold"]: text = r"\textbf{" + text + "}"
            if rowspan > 1: text = r"\YZrowspan{" + str(rowspan) + "}{" + text + "}"
            if colspan > 1:
                alignment = {"AlignLeft": r"\raggedright", "AlignRight": r"\raggedleft", "AlignCenter": r"\centering", "AlignDefault": r"\raggedright"}[align["t"]]
                width = sum(widths[column:column + colspan])
                text = r"\multicolumn{" + str(colspan) + "}{>{" + alignment + r"\arraybackslash}p{\dimexpr " + str(round(width, 8)) + r"\linewidth-2\tabcolsep\relax}}{" + text + "}"
            cells.append(text)
            occupied[column:column + colspan] = [rowspan] * colspan
            column += colspan
        while column < len(occupied):
            if not occupied[column]: raise ValueError("Table row does not fill its declared columns")
            cells.append(""); column += 1
        occupied[:] = [max(0, remaining - 1) for remaining in occupied]
        return " & ".join(cells) + r"\\" + (r"\hline" if spec["table"]["borders"] != "none" else "") + "\n"
    def table_tex(value):
        nonlocal table_count
        attr, caption, columns, head, bodies, foot = value
        table_count += 1
        caption_text = blocks(caption[1])
        widths = [column[1].get("c", 0) if column[1]["t"] == "ColWidth" else 0 for column in columns]
        if not columns or len(columns) > 100: raise ValueError("Invalid table column count")
        if any(not isinstance(x, (float, int)) or x < 0 or x > 1 for x in widths): raise ValueError("Invalid table width")
        widths = widths if all(widths) else [1 / len(columns)] * len(columns)
        total = sum(widths)
        widths = [x / total for x in widths]
        specs = []
        for (alignment, _), width in zip(columns, widths):
            align_command = {"AlignLeft": r"\raggedright", "AlignRight": r"\raggedleft", "AlignCenter": r"\centering", "AlignDefault": r"\raggedright"}[alignment["t"]]
            specs.append(">{" + align_command + r"\arraybackslash}p{\dimexpr " + str(round(width, 8)) + r"\linewidth-2\tabcolsep\relax}")
        sep = "|" if spec["table"]["borders"] == "grid" else ""
        alignment = sep + sep.join(specs) + sep
        # longtable supports repeating headers and page breaks in single-column documents.
        environment = "longtable" if spec["columns"]["count"] == 1 else "tabular"
        lines = ["{\\fontsize{" + str(spec["table"]["size_pt"]) + "}{" + str(spec["table"]["leading_pt"]) + "}\\selectfont\n"]
        if caption_text and spec["caption"]["table_position"] == "above": lines.append(r"\par\noindent " + "Table " + str(table_count) + ". " + caption_text + "\n")
        lines.append("\\begin{" + environment + "}{" + alignment + "}\n")
        if spec["table"]["borders"] != "none": lines.append(r"\hline" + "\n")
        occupied = [0] * len(columns)
        lines.extend(row_tex(row, occupied, widths, True) for row in head[1])
        if any(occupied): raise ValueError("Row spans cannot cross the repeating table-header boundary")
        if environment == "longtable" and spec["table"]["repeat_header"]: lines.append(r"\endhead" + "\n")
        row_count = len(head[1]) + len(foot[1])
        for _, row_head_columns, heads, rows in bodies:
            if type(row_head_columns) is not int or not 0 <= row_head_columns <= len(columns): raise ValueError("Invalid row-header column count")
            lines.extend(row_tex(row, occupied, widths, True) for row in heads)
            lines.extend(row_tex(row, occupied, widths, header_columns=row_head_columns) for row in rows)
            row_count += len(heads) + len(rows)
        lines.extend(row_tex(row, occupied, widths) for row in foot[1])
        if any(occupied): raise ValueError("Table row span extends beyond the final row")
        lines.append("\\end{" + environment + "}\n")
        if caption_text and spec["caption"]["table_position"] == "below": lines.append(r"\par\noindent " + "Table " + str(table_count) + ". " + caption_text + "\n")
        lines.append("}\n")
        structure["tables"].append({"id": "T" + str(table_count), "rows": row_count, "columns": len(columns), "caption": ast.plain(caption[1])})
        return "".join(lines)
    def blocks(nodes):
        nonlocal list_depth
        output = []
        abstract = False
        for node in nodes:
            tag, value = node["t"], node.get("c")
            output.append(anchor(node))
            if tag in ("Para", "Plain"):
                marker = re.fullmatch(r"YZFIGURE_([A-Za-z][A-Za-z0-9_-]{0,63})", ast.plain(value).strip())
                if marker:
                    item = figures[marker[1]]
                    caption = r"{\fontsize{" + str(spec["caption"]["size_pt"]) + "}{" + str(spec["caption"]["leading_pt"]) + r"}\selectfont " + esc(item["display_caption"]) + "}"
                    picture = r"\includegraphics[width=" + str(item["width_inches"]) + "in]{" + item["file"] + "}"
                    content = [caption, picture] if spec["caption"]["figure_position"] == "above" else [picture, caption]
                    output.append(r"\begin{center}" + r"\par ".join(content) + r"\end{center}" + "\n")
                elif "YZFIGURE_" in ast.plain(value): raise ValueError("Figure marker must occupy its own paragraph")
                else:
                    text = inline(value)
                    if abstract:
                        text = r"{\leftskip=" + str(spec["abstract"]["indent_mm"]) + "mm\\rightskip=" + str(spec["abstract"]["indent_mm"]) + r"mm\fontsize{" + str(spec["abstract"]["size_pt"]) + "}{" + str(spec["abstract"]["leading_pt"]) + r"}\selectfont " + text + r"\par}"
                    output.append(text + ("\n\n" if tag == "Para" else ""))
            elif tag == "Header":
                level, _, text = value
                level = 1 if ast.plain(text).casefold() in UNNUMBERED_HEADINGS else level - offset
                if not 1 <= level <= 3: raise ValueError("Template provides exactly three heading levels")
                abstract = ast.plain(text).casefold() in ("abstract", "摘要")
                unnumbered = abstract or ast.plain(text).casefold() in ("references", "bibliography", "参考文献") or not spec["number_sections"]
                output.append("\\" + ("section", "subsection", "subsubsection")[level - 1] + ("*" if unnumbered else "") + "{" + inline(text) + "}\n")
            elif tag in ("BulletList", "OrderedList"):
                items = value if tag == "BulletList" else value[1]
                environment = "itemize" if tag == "BulletList" else "enumerate"
                option = ""
                if tag == "OrderedList":
                    if list_depth >= 4: raise ValueError("LaTeX supports at most four nested numbered list levels")
                    start, style, delim = value[0]
                    labels = {"DefaultStyle": "arabic", "Decimal": "arabic", "LowerRoman": "roman", "UpperRoman": "Roman", "LowerAlpha": "alph", "UpperAlpha": "Alph"}
                    tail = ")" if delim["t"] in ("OneParen", "TwoParens") else "."
                    lead = "(" if delim["t"] == "TwoParens" else ""
                    counter = ("enumi", "enumii", "enumiii", "enumiv")[list_depth]
                    option = r"\setcounter{" + counter + "}{" + str(int(start) - 1) + r"}\renewcommand{\label" + counter + "}{" + lead + "\\" + labels[style["t"]] + "{" + counter + "}" + tail + "}"
                    list_depth += 1
                content = "".join(r"\item " + blocks(item) + "\n" for item in items)
                if tag == "OrderedList": list_depth -= 1
                output.append("\\begin{" + environment + "}" + option + "\n" + content + "\\end{" + environment + "}\n")
            elif tag == "DefinitionList": output.append(r"\begin{description}" + "".join(r"\item[" + inline(term) + "] " + "\n".join(blocks(x) for x in meanings) for term, meanings in value) + r"\end{description}")
            elif tag == "BlockQuote": output.append(r"\begin{quote}" + blocks(value) + r"\end{quote}")
            elif tag == "LineBlock": output.append(r"\par ".join(inline(line) for line in value))
            elif tag == "HorizontalRule": output.append(r"\par\noindent\rule{\linewidth}{0.4pt}\par")
            elif tag == "CodeBlock": output.append(r"\begin{quote}\ttfamily " + esc(value[1]).replace("\n", r"\par ") + r"\end{quote}")
            elif tag == "Div": output.append(blocks(value[1]))
            elif tag == "Table": output.append(table_tex(value))
            else: raise ValueError("Unsupported TeX block: " + tag)
        return "".join(output)
    page = spec["page"]
    header = [r"\RequirePackage{fix-cm}", r"\documentclass[11pt]{article}", r"\usepackage{fontspec,amsmath,amssymb,graphicx,geometry,longtable,array,fancyhdr}", r"\usepackage[hidelinks]{hyperref}",
              r"\setmainfont{" + spec["fonts"]["latin"] + "}",
              r"\geometry{paperwidth=" + str(page["width_mm"]) + "mm,paperheight=" + str(page["height_mm"]) + "mm," + ",".join(key + "=" + str(page[key + "_mm"]) + "mm" for key in ("top", "bottom", "left", "right")) + "}",
              r"\setlength{\headsep}{" + str(page["header_mm"]) + "mm}", r"\setlength{\footskip}{" + str(page["footer_mm"]) + "mm}",
              r"\setlength{\parindent}{" + str(spec["body"]["first_indent_pt"]) + "pt}", r"\setlength{\parskip}{" + str(spec["body"]["after_pt"] + spec["body"]["before_pt"]) + "pt}",
              r"\setlength{\columnsep}{" + str(spec["columns"]["gap_mm"]) + "mm}"]
    if ast.CJK_TEXT.search(title + ast.plain(tree["blocks"]) + "".join(str(value) for group in (spec["header"], spec["footer"], spec["first_page"]["header"], spec["first_page"]["footer"]) for value in group.values()) + "".join(item["display_caption"] for item in figures.values())):
        header.extend([r"\newfontfamily\YZCJK{" + spec["fonts"]["cjk"] + "}", r'\XeTeXlinebreaklocale "zh"', r"\XeTeXlinebreakskip=0pt plus 1pt"])
    header.extend([r"\newcommand{\YZstrike}[1]{\leavevmode\begingroup\setbox0=\hbox{#1}\rlap{\raise .45ex\hbox{\vrule height .4pt width \wd0}}\box0\endgroup}",
        r"\newcommand{\YZrowspan}[2]{\begingroup\setbox0=\vtop{\hsize=\linewidth\parindent=0pt #2\par}\dimen0=#1\baselineskip\ifdim\dimexpr\ht0+\dp0\relax>\dimen0\PackageWarning{yan-zhou}{Row-spanning cell exceeds its reserved rows}\fi\vtop to0pt{\unvbox0\vss}\endgroup}"])
    header.append(r"\pdfstringdefDisableCommands{\def\YZCJK{}\def\YZstrike#1{#1}}")
    def header_text(text): return r"\thepage{}".join(esc(part) for part in text.split("{PAGE}"))
    def page_style(name, head, foot):
        result = [r"\fancypagestyle{" + name + r"}{\fancyhf{}\renewcommand{\headrulewidth}{0pt}\renewcommand{\footrulewidth}{0pt}"]
        for group, char in ((head, "H"), (foot, "F")):
            for align, text in group.items():
                result.append(r"\fancy" + ("head" if char == "H" else "foot") + "[" + align[0].upper() + "]{" + header_text(text) + "}")
        return "".join(result) + "}"
    header.extend([page_style("normal", spec["header"], spec["footer"]), r"\pagestyle{normal}"])
    if spec["first_page"]["different"]:
        header.append(page_style("first", spec["first_page"]["header"], spec["first_page"]["footer"]))
    header.append(r"\makeatletter")
    for level, (name, style) in enumerate(zip(("section", "subsection", "subsubsection"), spec["headings"]), 1):
        font = r"\fontsize{" + str(style["size_pt"]) + "}{" + str(style["leading_pt"]) + r"}\selectfont" + (r"\bfseries" if style["bold"] else "") + (r"\itshape" if style["italic"] else "")
        font += {"left": r"\raggedright", "center": r"\centering", "right": r"\raggedleft", "justify": ""}[style["alignment"]]
        header.append("\\renewcommand{\\" + name + "}{\\@startsection{" + name + "}{" + str(level) + "}{0pt}{-" + str(style["before_pt"]) + "pt}{" + str(style["after_pt"]) + "pt}{" + font + "}}")
    header.append(r"\makeatother")
    header.append(r"\renewcommand{\footnotesize}{\fontsize{" + str(spec["footnote"]["size_pt"]) + "}{" + str(spec["footnote"]["leading_pt"]) + r"}\selectfont}")
    header.append(r"\begin{document}")
    if spec["first_page"]["different"]: header.append(r"\thispagestyle{first}")
    title_style = spec["title"]
    alignment = {"left": "flushleft", "right": "flushright", "center": "center", "justify": "flushleft"}[title_style["alignment"]]
    title_tex = r"\begin{" + alignment + "}\\vspace*{" + str(title_style["before_pt"]) + "pt}{\\fontsize{" + str(title_style["size_pt"]) + "}{" + str(title_style["leading_pt"]) + r"}\selectfont " + (r"\bfseries " if title_style["bold"] else "") + (r"\itshape " if title_style["italic"] else "") + esc(title) + "}\\par\\vspace{" + str(title_style["after_pt"]) + "pt}\\end{" + alignment + "}"
    if spec["columns"]["count"] == 2:
        header.append(r"\twocolumn[" + title_tex + "]" if spec["columns"]["title_full_width"] else r"\twocolumn " + title_tex)
    else: header.append(title_tex)
    header.append(r"\fontsize{" + str(spec["body"]["size_pt"]) + "}{" + str(spec["body"]["leading_pt"]) + r"}\selectfont")
    header.append({"left": r"\raggedright", "right": r"\raggedleft", "center": r"\centering", "justify": ""}[spec["body"]["alignment"]])
    result = "\n".join(header) + "\n" + blocks(tree["blocks"]) + "\n" + r"\end{document}" + "\n"
    return result, structure


def export_document(ws, out, context, source, records, spec, pandoc_program, tex_program):
    tree, usage = ast.resolve_tree(ast.parse_markdown(source.decode("utf-8-sig"), pandoc_program, out), records)
    crossreferences = ast.bind_crossreferences(tree)
    images = collect_figures(ws, records, usage, out, spec)
    templates.build_reference(out / "reference.docx", spec)
    word_tree = copy.deepcopy(tree)
    offset = heading_offset(tree)
    def unnumbered(value):
        if isinstance(value, list):
            for item in value: unnumbered(item)
        elif isinstance(value, dict):
            if value.get("t") == "Header":
                special = ast.plain(value["c"][2]).casefold() in UNNUMBERED_HEADINGS
                value["c"][0] = 1 if special else value["c"][0] - offset
                if not 1 <= value["c"][0] <= 3: raise ValueError("Template provides exactly three relative heading levels")
                if special: value["c"][1][1].append("unnumbered")
            for item in value.values(): unnumbered(item)
    unnumbered(word_tree["blocks"])
    word_tree = ast.word_crossreferences(word_tree)
    word_tree["meta"] = {"title": {"t": "MetaInlines", "c": ast.text_inlines(context["title"])}}
    payload = json.dumps(word_tree, ensure_ascii=False, allow_nan=False).encode("utf-8")
    ast.pandoc(pandoc_program, ["--from", "json", "--to", "docx", *(["--number-sections"] if spec["number_sections"] else []), "--reference-doc", str(out / "reference.docx"), "--output", str(out / "manuscript.docx")], cwd=out, data=payload)
    ast.install_word_targets(out / "manuscript.docx", crossreferences)
    apply_word_layout(out / "manuscript.docx", spec, images, tree)
    width = (spec["page"]["width_mm"] - spec["page"]["left_mm"] - spec["page"]["right_mm"] - (spec["columns"]["count"] - 1) * spec["columns"]["gap_mm"]) / spec["columns"]["count"]
    equations = ast.bind_native_math(tree, out / "manuscript.docx", round(width / 25.4 * 1440))
    word_links = ast.verify_word_crossreferences(out / "manuscript.docx", crossreferences)
    tex, structure = tex_document(tree, context["title"], spec, images)
    (out / "manuscript.tex").write_text(tex, encoding="utf-8", newline="\n")
    logs = []
    engine_version = ast.command(tex_program, ["--version"], cwd=out).decode("utf-8", "replace")
    engine_flags = ["-disable-installer", "-disable-write18", "-dont-parse-first-line"] if "miktex" in engine_version.casefold() else ["-no-shell-escape", "-no-parse-first-line"]
    for _ in range(2):
        logs.append(ast.command(tex_program, [*engine_flags, "-interaction=nonstopmode", "-halt-on-error", "-file-line-error", "-output-directory=.", "manuscript.tex"], cwd=out).decode("utf-8", "replace"))
    pdf = out / "manuscript.pdf"
    if not pdf.is_file() or not pdf.read_bytes().startswith(b"%PDF-"):
        raise ValueError("Engine did not produce an actual PDF")
    from pypdf import PdfReader
    reader = PdfReader(pdf)
    if not reader.pages: raise ValueError("Engine produced an empty PDF")
    pdf_links = ast.verify_pdf_crossreferences(reader, crossreferences)
    last_log = logs[-1]
    warnings = [line.strip() for line in last_log.splitlines() if re.search(r"Warning|Missing character|Overfull|Underfull", line)]
    # Keep only a compact build record; generated TeX, PDF and native structure are the evidence.
    research.write_json(out / "build.json", {"engine": tex_program, "engine_version": engine_version.splitlines()[0], "pandoc": pandoc_program, "passes": 2, "pages": len(reader.pages), "warnings": warnings, "input_mode": "fixed packages and structure-generated TeX; original math is never executed"})
    for suffix in ("aux", "log", "out"):
        file = out / ("manuscript." + suffix)
        if file.is_file(): file.unlink()
    research.write_json(out / "document.json", tree)
    research.write_json(out / "crossreferences.json", {**crossreferences, "docx": word_links, "pdf": pdf_links, "docx_sha256": research.digest(out / "manuscript.docx"), "pdf_sha256": research.digest(pdf)})
    research.write_json(out / "structure-map.json", {**structure, "equations": equations, "docx_sha256": research.digest(out / "manuscript.docx"), "pdf_sha256": research.digest(pdf), "semantic_check": "pending", "visual_check": "pending"})
    research.write_json(out / "citation-map.json", usage)
    # Preserve human IDs and dynamic equation references in the editable resolved Markdown.
    markdown_tree = ast.markdown_crossreferences(tree, crossreferences)
    markdown = ast.pandoc(pandoc_program, ["--from", "json", "--to", "markdown-raw_html-raw_tex", "--wrap", "none"], cwd=out, data=json.dumps(markdown_tree, ensure_ascii=False).encode()).decode("utf-8")
    for key, item in images.items():
        markdown = markdown.replace("YZFIGURE\\_" + key, "![" + item["display_caption"] + "](" + item["file"] + ")").replace("YZFIGURE_" + key, "![" + item["display_caption"] + "](" + item["file"] + ")")
    (out / "manuscript.md").write_text("# " + context["title"] + "\n\n" + markdown, encoding="utf-8")
    research.write_json(out / "figures.json", images)
    bibliography = []
    for number, ident in enumerate(usage["citations"], 1):
        item = records["sources"][ident][1]
        fields = {"title": item["title"], "author": item["authors"], "year": item["year"], "doi": item.get("doi", ""), "url": item.get("url", "")}
        bibliography.append("@misc{source" + str(number) + ",\n" + ",\n".join("  " + key + " = {" + ast.escape_tex(value) + "}" for key, value in fields.items() if value) + "\n}")
    (out / "references.bib").write_text("\n\n".join(bibliography) + "\n", encoding="utf-8")
    return usage, warnings


def document_workflow(ws, args):
    if bool(args.paper) == bool(args.context or args.body) or (not args.paper and not (args.context and args.body)):
        raise ValueError("Select either one retained manuscript or both context/body inputs")
    paper = common.extension_record(ws, "manuscript", args.paper) if args.paper else None
    contextpath = paper / "paper_context.json" if paper else ws.input(args.context, {".json"})
    bodypath = paper / "draft-source.md" if paper else ws.input(args.body, {".md", ".txt"})
    context = common.strict_json(contextpath)
    deps = dependencies(ws, context)
    if paper: deps.append(paper)
    template = common.extension_record(ws, "templates", args.template) if args.template else None
    if template: deps.append(template)
    inputs = [contextpath, bodypath] + [p / "receipt.json" for p in deps]
    pandoc_program, tex_program = ast.executable(args.pandoc, "pandoc"), ast.executable(args.xelatex, "xelatex")
    params = {"source_paper_id": args.paper, "template_id": args.template, "pandoc_path": pandoc_program, "pandoc_sha256": research.digest(Path(pandoc_program)), "tex_path": tex_program, "tex_sha256": research.digest(Path(tex_program))}
    def run(out):
        if paper: common.extension_record(ws, "manuscript", args.paper)
        raw_context, raw_body = contextpath.read_bytes(), bodypath.read_bytes()
        current_context, records = ast.selected_context(ws, raw_context)
        if template:
            spec = templates.layout_spec(common.strict_json(template / "template.json"))
        elif paper and (paper / "retained-template.json").is_file():
            spec = templates.layout_spec(common.strict_json(paper / "retained-template.json"))
        elif paper and (paper / "template.json").is_file():
            spec = templates.layout_spec(common.strict_json(paper / "template.json"))
        elif paper and (paper / "scope-report.json").is_file() and common.strict_json(paper / "scope-report.json")["baseline"].get("retained_legacy_layout"):
            old = common.strict_json(paper / "scope-report.json")["baseline"]["retained_legacy_layout"]
            spec = templates.layout_spec({"name": "Retained article layout", "page": {"width_mm": old["page_mm"][0], "height_mm": old["page_mm"][1], **{side + "_mm": old["margins_mm"] for side in ("top", "bottom", "left", "right")}},
                "body": {"size_pt": old["body_pt"], "leading_pt": old["body_leading_pt"], "first_indent_pt": old["first_line_indent_pt"]},
                "title": {"size_pt": old["title_pt"], "leading_pt": 22, "before_pt": 24, "after_pt": 24}, "abstract": {"size_pt": old["abstract_pt"], "leading_pt": old["abstract_leading_pt"]},
                "fonts": {"latin": old["docx_fonts"][0], "cjk": old["docx_fonts"][1]}})
            spec["headings"][0]["size_pt"] = old["section_pt"]; spec["headings"][1]["size_pt"] = old["subsection_pt"]
        else:
            spec = templates.layout_spec({})
        if template: common.extension_record(ws, "templates", args.template)
        (out / "draft-source.md").write_bytes(raw_body)
        (out / "paper_context.json").write_bytes(raw_context)
        research.write_json(out / "template.json", spec)
        usage, gaps = export_document(ws, out, current_context, raw_body, records, spec, pandoc_program, tex_program)
        if paper:
            old_usage = common.strict_json(paper / "citation-map.json")
            if usage != old_usage: raise ValueError("Resolved source mapping differs from the retained manuscript")
        files = {p.name: {"sha256": research.digest(p), "size": p.stat().st_size} for p in out.iterdir() if p.is_file()}
        research.write_json(out / "layout-manifest.json", {"schema": "yan-zhou-document-1", **params, "source_receipt_sha256": research.digest(paper / "receipt.json") if paper else None,
            "source_scope_report_sha256": research.digest(paper / "scope-report.json") if paper and (paper / "scope-report.json").is_file() else None,
            "template_receipt_sha256": research.digest(template / "receipt.json") if template else None, "selected_sources": current_context["selected_sources"], "actually_cited": usage["citations"], "files": files,
            "layout_gaps": gaps, "scientific_check": "pending", "visual_check": "pending", "independent_review": "not_performed"})
        research.write_json(out / "export.json", {"exported": ["manuscript.md", "manuscript.docx", "manuscript.pdf", "manuscript.tex", "document.json"], "gaps": gaps, "method": "one resolved AST; native OMML Word and structure-generated safe TeX PDF", "pdf_visual_check": "pending", "semantic_check": "pending", "independent_review": "not_performed"})
        return {"status": "partial" if gaps else "complete", "export_gaps": gaps, "scientific_check": "pending", "visual_check": "pending", "independent_review": "not_performed"}
    return common.step(ws, "formatted" if paper else "manuscript", args.id, params, inputs, deps, run, entry=__file__, extra=EXTRA)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True); parser.add_argument("--task", default="T1"); parser.add_argument("--id", required=True)
    parser.add_argument("--paper"); parser.add_argument("--context"); parser.add_argument("--body"); parser.add_argument("--template")
    parser.add_argument("--pandoc"); parser.add_argument("--xelatex")
    return common.cli(document_workflow, parser, argv)


if __name__ == "__main__":
    raise SystemExit(main())
