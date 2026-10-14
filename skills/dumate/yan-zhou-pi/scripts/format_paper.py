#!/usr/bin/env python3
"""Reformat one verified manuscript; retain the frozen research helper and history."""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import re
import shutil
import sys
from xml.sax.saxutils import escape

import research

FORMAT_STYLE = "pi-article-1.0.2"
HELPER_SHA256 = "d21aa9bdcc9a19e5f424a9d2b83a9c9b76f362d536bf0a2a1d4b874e798e5b67"
CJK = re.compile(r"[\u3400-\u9fff]")
NOTO_FONT = Path("C:/Windows/Fonts/NotoSerifSC-VF.ttf")


def blocks(text):
    """The current manuscript uses headings, plain paragraphs and line-by-line lists."""
    if re.search(r"(?m)^\s*(?:```|\|)|\[\^[^]]+\]|\$|\\\(|\\\[", text):
        raise ValueError("Article formatter does not support Markdown tables, code fences, footnotes or TeX formulas")
    section, subsection, abstract = 0, 0, False
    result = []
    for block in filter(None, (b.strip() for b in text.split("\n\n"))):
        figure = re.fullmatch(r"\{\{FIGURE:([^}]+)\}\}", block)
        heading = re.fullmatch(r"(#{1,3})\s+([^\n]+)", block)
        if figure:
            result.append(("figure", figure[1]))
        elif heading:
            label = heading[2]
            abstract = label.casefold() in ("摘要", "abstract")
            if abstract:
                result.append(("abstract_heading", label))
            elif label.casefold() in ("参考文献", "references", "bibliography"):
                result.append(("references_heading", label))
            elif len(heading[1]) == 3:
                if not section:
                    raise ValueError("Subsection requires a preceding section")
                subsection += 1
                result.append(("subsection", f"{section}.{subsection}  {label}"))
            else:
                section += 1
                subsection = 0
                result.append(("section", f"{section}  {label}"))
        else:
            kind = "abstract" if abstract else "list" if re.match(r"(?:- |\d+[.)] )", block) else "paragraph"
            result.append((kind, block))
    return result


def figure_layout(records, paper, used, chinese):
    from PIL import Image
    figures = {}
    for n, key in enumerate(used, 1):
        _, manifest = records["figures"][key]
        if manifest["audit"]["issues"]:
            raise ValueError(f"Figure {key} has unresolved audit issues")
        width = manifest["width_inches"]
        if isinstance(width, bool) or not isinstance(width, (float, int)) or not math.isfinite(width) or width <= 0:
            raise ValueError(f"Figure {key} has an invalid declared print width")
        if width * 25.4 > 160:
            raise ValueError(f"Figure {key} print width exceeds the 160 mm article text width; regenerate explicitly")
        image = paper / (key + ".png")
        with Image.open(image) as png:
            pixels = png.size
            png.verify()
        caption = manifest["caption"]
        if not isinstance(caption, str) or not caption.strip():
            raise ValueError(f"Figure {key} requires its original caption")
        label = f"图 {n}：" if chinese else f"Figure {n}. "
        figures[key] = {"image": image, "width_inches": width, "height_inches": width * pixels[1] / pixels[0],
                        "pixels": list(pixels), "caption": caption, "display_caption": label + caption}
    return figures


def export_docx(out, title, content, figures):
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Inches, Mm, Pt, RGBColor

    doc = Document()
    page = doc.sections[0]
    page.page_width, page.page_height = Mm(210), Mm(297)
    page.top_margin = page.bottom_margin = page.left_margin = page.right_margin = Mm(25)
    page.footer_distance = Mm(12.5)
    for name, size in (("Normal", 11), ("Title", 17.28), ("Heading 1", 14.4), ("Heading 2", 12)):
        style = doc.styles[name]
        style.font.name = "Times New Roman"
        # Word stores font sizes in half-points; retain the closest supported size.
        style.font.size = Pt(round(size * 2) / 2)
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Noto Serif SC" if NOTO_FONT.is_file() else "宋体")
        style.paragraph_format.space_after = Pt(0)
    normal = doc.styles["Normal"].paragraph_format
    normal.line_spacing, normal.first_line_indent = Pt(13.6), Pt(17)
    for name in ("Heading 1", "Heading 2"):
        doc.styles[name].font.bold = True
        fmt = doc.styles[name].paragraph_format
        fmt.first_line_indent, fmt.space_before, fmt.space_after = Pt(0), Pt(14), Pt(8)
        fmt.line_spacing = Pt(18 if name == "Heading 1" else 15)
        fmt.keep_with_next = True
    title_para = doc.add_paragraph(title, "Title")
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_para.paragraph_format.first_line_indent = Pt(0)
    title_para.paragraph_format.space_before, title_para.paragraph_format.space_after = Pt(24), Pt(24)
    title_para.paragraph_format.line_spacing = Pt(22)
    title_para.paragraph_format.keep_with_next = True
    for kind, value in content:
        if kind == "figure":
            item = figures[value]
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.keep_with_next = True
            p.add_run().add_picture(str(item["image"]), width=Inches(item["width_inches"]))
            p = doc.add_paragraph(item["display_caption"])
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.line_spacing = Pt(12)
            p.paragraph_format.space_after = Pt(10)
            for run in p.runs:
                run.font.size = Pt(10)
        elif kind in ("section", "subsection", "references_heading"):
            doc.add_paragraph(value, "Heading 2" if kind == "subsection" else "Heading 1")
        else:
            p = doc.add_paragraph(value)
            if kind in ("abstract", "abstract_heading"):
                p.paragraph_format.left_indent = p.paragraph_format.right_indent = Mm(10)
                p.paragraph_format.line_spacing = Pt(12)
                for run in p.runs:
                    run.font.size = Pt(10)
            if kind == "abstract_heading":
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.first_line_indent = Pt(0)
                p.paragraph_format.space_after = Pt(8)
                p.paragraph_format.keep_with_next = True
                for run in p.runs:
                    run.bold = True
            elif kind == "list" or value.startswith("["):
                p.paragraph_format.first_line_indent = Pt(0)
    footer = page.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.paragraph_format.first_line_indent = Pt(0)
    field = OxmlElement("w:fldSimple")
    field.set(qn("w:instr"), "PAGE")
    footer._p.append(field)
    doc.save(out / "manuscript.docx")


def export_pdf(out, title, content, figures):
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import BaseDocTemplate, Frame, Image, KeepTogether, PageTemplate, Paragraph, Spacer

    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))

    def register_noto(text, weight):
        from fontTools.subset import Subsetter
        from fontTools.ttLib import TTFont as FTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        with FTFont(str(NOTO_FONT)) as font:
            subset = Subsetter()
            subset.populate(text=text + "0123456789 ")
            subset.subset(font)
            instantiateVariableFont(font, {"wght": weight}, inplace=True, updateFontNames=True)
            # ReportLab deduplicates by face name; distinguish each weight and text subset.
            face = font["name"].getDebugName(6) + "-" + hashlib.sha256(text.encode()).hexdigest()[:12]
            for record in list(font["name"].names):
                if record.nameID == 6:
                    font["name"].setName(face, 6, record.platformID, record.platEncID, record.langID)
            stream = io.BytesIO()
            font.save(stream)
        stream.seek(0)
        name = "Article-" + face
        pdfmetrics.registerFont(TTFont(name, stream))
        return name, face

    regular_text = title + "".join(value for kind, value in content if kind != "figure") + "".join(item["display_caption"] for item in figures.values())
    cjk_font, font_gap = "STSong-Light", "Noto Serif SC unavailable; using STSong-Light"
    cjk_face = "STSong-Light"
    if NOTO_FONT.is_file():
        try:
            cjk_font, cjk_face = register_noto(regular_text, 400)
            font_gap = None
        except Exception as exc:
            font_gap = "Noto Serif SC 400 could not be instantiated; using STSong-Light: " + str(exc)
    bold_text = "".join(value for kind, value in content if kind.endswith("heading") or kind in ("section", "subsection"))
    cjk_bold_font, cjk_bold_face, bold_gap = None, None, None
    if CJK.search(bold_text):
        bold_gap = "Chinese bold headings unavailable; using regular " + cjk_font
        if font_gap is None:
            try:
                cjk_bold_font, cjk_bold_face = register_noto(bold_text, 700)
                bold_gap = None
            except Exception as exc:
                bold_gap += ": " + str(exc)
    common = dict(fontName=cjk_font, fontSize=11, leading=13.6, textColor=colors.black,
                  wordWrap="CJK", firstLineIndent=17, spaceAfter=0)
    body = ParagraphStyle("article-body", **common)
    styles = {"paragraph": body, "list": ParagraphStyle("article-list", parent=body, firstLineIndent=0),
              "abstract": ParagraphStyle("article-abstract", parent=body, fontSize=10, leading=12, leftIndent=10*mm, rightIndent=10*mm),
              "abstract_heading": ParagraphStyle("article-abstract-heading", parent=body, fontSize=10, leading=12, alignment=TA_CENTER, firstLineIndent=0, spaceAfter=8, keepWithNext=True),
              "section": ParagraphStyle("article-section", parent=body, fontSize=14.4, leading=18, firstLineIndent=0, spaceBefore=14, spaceAfter=8, keepWithNext=True),
              "subsection": ParagraphStyle("article-subsection", parent=body, fontSize=12, leading=15, firstLineIndent=0, spaceBefore=14, spaceAfter=8, keepWithNext=True)}
    styles["references_heading"] = styles["section"]
    title_style = ParagraphStyle("article-title", parent=body, fontSize=17.28, leading=22, alignment=TA_CENTER, firstLineIndent=0, spaceBefore=24, spaceAfter=24, keepWithNext=True)
    caption_style = ParagraphStyle("article-caption", parent=body, fontSize=10, leading=12, alignment=TA_CENTER, firstLineIndent=0, spaceAfter=10)

    def paragraph(value, style, bold=False):
        if not CJK.search(value):
            style = ParagraphStyle(style.name + "-latin", parent=style, fontName="Times-Bold" if bold else "Times-Roman", wordWrap=None)
        elif bold and cjk_bold_font:
            style = ParagraphStyle(style.name + "-bold", parent=style, fontName=cjk_bold_font)
        return Paragraph(escape(value).replace("\n", "<br/>"), style)

    story = [Spacer(1, 24), paragraph(title, title_style)]
    for kind, value in content:
        if kind == "figure":
            item = figures[value]
            story.append(KeepTogether([Image(str(item["image"]), width=item["width_inches"]*72, height=item["height_inches"]*72),
                                       paragraph(item["display_caption"], caption_style)]))
        else:
            style = styles[kind]
            if kind == "paragraph" and value.startswith("["):
                style = styles["list"]
            story.append(paragraph(value, style, kind.endswith("heading") or kind in ("section", "subsection")))

    def page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Times-Roman", 11)
        canvas.drawCentredString(A4[0]/2, 12.5*mm, str(doc.page))
        canvas.restoreState()

    doc = BaseDocTemplate(str(out / "manuscript.pdf"), pagesize=A4, leftMargin=25*mm, rightMargin=25*mm,
                          topMargin=25*mm, bottomMargin=25*mm, title=title)
    frame = Frame(25*mm, 25*mm, 160*mm, 247*mm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id="article", frames=frame, onPage=page_number))
    doc.build(story)
    if not (out / "manuscript.pdf").read_bytes().startswith(b"%PDF-"):
        raise ValueError("Article formatter did not produce an actual PDF")
    return {"cjk_font": cjk_font, "latin_fonts": ["Times-Roman", "Times-Bold"], "fallback": font_gap,
            "cjk_face": cjk_face, "cjk_body_weight": 400 if font_gap is None else "built-in regular",
            "cjk_bold_font": cjk_bold_font, "cjk_bold_face": cjk_bold_face, "bold_fallback": bold_gap,
            "cjk_heading_weight": 700 if cjk_bold_font else "regular" if CJK.search(bold_text) else "not_applicable",
            "noto_sha256": research.digest(NOTO_FONT) if NOTO_FONT.is_file() else None}


def format_paper(ws, args):
    if research.digest(Path(research.__file__)) != HELPER_SHA256:
        raise ValueError("Article formatter requires the retained original research helper")
    paper = ws.record("manuscript", args.paper)
    context, records = research.selected_context(ws, paper / "paper_context.json")
    text, usage = research.render_body((paper / "draft-source.md").read_text(encoding="utf-8-sig"), records)
    if usage != research.read_json(paper / "citation-map.json"):
        raise ValueError("Citation/value/figure map does not match the verified manuscript")
    markdown = text
    for key in usage["figures"]:
        if research.digest(paper / (key + ".png")) != research.digest(records["figures"][key][0] / "figure.png"):
            raise ValueError("Manuscript image does not match its selected original figure")
        caption = records["figures"][key][1]["caption"]
        markdown = markdown.replace("{{FIGURE:" + key + "}}", f"![{caption}]({key}.png)\n\n{caption}")
    if (paper / "manuscript.md").read_text(encoding="utf-8") != "# " + context["title"] + "\n\n" + markdown:
        raise ValueError("Resolved content does not match the verified Markdown manuscript")
    params = {"formatter_sha256": research.digest(Path(__file__)), "format_style": FORMAT_STYLE, "source_paper_id": args.paper,
              "noto_font_sha256": research.digest(NOTO_FONT) if NOTO_FONT.is_file() else None}

    def run(out):
        for name in ["manuscript.md", "citation-map.json", "paper_context.json"] + [key + ".png" for key in usage["figures"]]:
            shutil.copyfile(paper / name, out / name)
        content = blocks(text)
        figures = figure_layout(records, out, usage["figures"], bool(CJK.search(context["title"] + text)))
        export_docx(out, context["title"], content, figures)
        fonts = export_pdf(out, context["title"], content, figures)
        gaps = [gap for gap in (fonts["fallback"], fonts["bold_fallback"]) if gap]
        files = {p.name: {"sha256": research.digest(p), "size": p.stat().st_size} for p in out.iterdir() if p.is_file()}
        research.write_json(out / "layout-manifest.json", {"version": "1.0.2", **params, "helper_sha256": HELPER_SHA256,
            "source_receipt_sha256": research.digest(paper / "receipt.json"), "selected_sources": context["selected_sources"],
            "actually_cited": usage["citations"], "files": files,
            "layout": {"page_mm": [210, 297], "margins_mm": 25, "body_pt": 11, "body_leading_pt": 13.6, "first_line_indent_pt": 17,
                       "title_pt": 17.28, "abstract_pt": 10, "abstract_leading_pt": 12, "section_pt": 14.4, "subsection_pt": 12,
                       "docx_title_pt": 17.5, "docx_section_pt": 14.5,
                       "docx_fonts": ["Times New Roman", "Noto Serif SC" if NOTO_FONT.is_file() else "宋体"],
                       "pdf_fonts": fonts, "page_numbers": "bottom center"},
            "figures": {key: {k: v for k, v in item.items() if k != "image"} for key, item in figures.items()},
            "layout_gaps": gaps, "pdf_visual_check": "pending", "semantic_check": "pending", "independent_review": "not performed",
            "limitations": ["Article layout approximation, not identical TeX pagination", "No TeX formulas, Markdown tables or footnotes"]})
        return {"status": "partial" if gaps else "complete", "layout_gaps": gaps, "visual_check": "pending", "semantic_check": "pending"}

    return research.execute(ws, "formatted", args.id, params, [paper / "receipt.json"], [paper], run)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--task", default="T1")
    parser.add_argument("--paper", required=True)
    parser.add_argument("--id", required=True)
    args = parser.parse_args(argv)
    try:
        result = format_paper(research.Workspace(args.workspace, args.task), args)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"status": "failed", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
