#!/usr/bin/env python3
"""Register a complete, explicit layout or safely mapped Word reference template."""
from __future__ import annotations

import argparse
import copy
import math
from pathlib import Path
import posixpath
import re
import shutil

import research
import alignment_common as common
import document_ast as ast

DEFAULT = {
    "schema": "yan-zhou-layout-1", "name": "Article", "page": {"width_mm": 210, "height_mm": 297, "top_mm": 25, "bottom_mm": 25, "left_mm": 25, "right_mm": 25, "header_mm": 12.5, "footer_mm": 12.5},
    "fonts": {"latin": "Times New Roman", "cjk": "SimSun"},
    "body": {"size_pt": 11, "leading_pt": 14, "first_indent_pt": 17, "before_pt": 0, "after_pt": 0, "alignment": "justify"},
    "title": {"size_pt": 18, "leading_pt": 23, "before_pt": 18, "after_pt": 18, "bold": False, "italic": False, "alignment": "center"},
    "headings": [{"size_pt": 14, "leading_pt": 18, "before_pt": 14, "after_pt": 8, "bold": True, "italic": False, "alignment": "left"}, {"size_pt": 12, "leading_pt": 16, "before_pt": 12, "after_pt": 6, "bold": True, "italic": False, "alignment": "left"}, {"size_pt": 11, "leading_pt": 14, "before_pt": 10, "after_pt": 4, "bold": True, "italic": False, "alignment": "left"}],
    "abstract": {"size_pt": 10, "leading_pt": 13, "indent_mm": 10},
    "caption": {"size_pt": 10, "leading_pt": 12, "alignment": "center", "figure_position": "below", "table_position": "above"},
    "footnote": {"size_pt": 9, "leading_pt": 11},
    "table": {"size_pt": 10, "leading_pt": 12, "header_bold": True, "borders": "horizontal", "repeat_header": True},
    "columns": {"count": 1, "gap_mm": 8, "title_full_width": True},
    "header": {"left": "", "center": "", "right": ""}, "footer": {"left": "", "center": "{PAGE}", "right": ""},
    "first_page": {"different": False, "header": {"left": "", "center": "", "right": ""}, "footer": {"left": "", "center": "{PAGE}", "right": ""}},
    "number_sections": True, "bibliography": "numbered-appearance", "required_features": []}


def layout_spec(value):
    if not isinstance(value, dict):
        raise ValueError("Template specification must be an object")
    result = copy.deepcopy(DEFAULT)
    def merge(base, supplied, location):
        if not isinstance(supplied, dict) or set(supplied) - set(base):
            raise ValueError("Unknown template rule at " + location)
        for key, item in supplied.items():
            if isinstance(base[key], dict):
                merge(base[key], item, location + "." + key)
            else:
                base[key] = item
    merge(result, value, "template")
    if result["schema"] != DEFAULT["schema"] or result["bibliography"] != "numbered-appearance":
        raise ValueError("Unsupported template schema or bibliography rule")
    if not isinstance(result["name"], str) or not result["name"].strip():
        raise ValueError("Template requires a name")
    if result["required_features"]:
        raise ValueError("Unmapped required template rules: " + repr(result["required_features"]))
    def numeric(value, low, high, label):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
            raise ValueError("Invalid template dimension: " + label)
    for key, val in result["page"].items():
        numeric(val, 0 if key not in ("width_mm", "height_mm") else 80, 600, key)
    page = result["page"]
    if page["left_mm"] + page["right_mm"] >= page["width_mm"] - 30 or page["top_mm"] + page["bottom_mm"] >= page["height_mm"] - 50:
        raise ValueError("Template margins leave no usable page")
    for name in result["fonts"].values():
        if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9\u3400-\u9fff][A-Za-z0-9\u3400-\u9fff ._-]{0,79}", name):
            raise ValueError("Font must be an installed family name, not a path or command")
    if not isinstance(result["headings"], list) or len(result["headings"]) != 3:
        raise ValueError("Exactly three heading styles are required")
    for index, heading in enumerate(result["headings"]):
        if not isinstance(heading, dict) or set(heading) != set(DEFAULT["headings"][index]):
            raise ValueError("Every heading style requires all declared properties")
    for label in ("body", "title", "abstract", "caption", "footnote", "table"):
        group = result[label]
        for key, val in group.items():
            if key.endswith("_pt") or key.endswith("_mm"):
                numeric(val, 0, 200, label + "." + key)
        if group.get("size_pt", 1) <= 0 or group.get("leading_pt", 1) <= 0:
            raise ValueError("Font size and leading must be positive")
    for group in [result["title"], *result["headings"]]:
        for key, val in group.items():
            if key.endswith("_pt"):
                numeric(val, 0, 200, key)
        for key in ("bold", "italic"):
            if type(group[key]) is not bool:
                raise ValueError("Style toggles must be booleans")
    for group in [result["body"], result["title"], result["caption"], *result["headings"]]:
        if group["alignment"] not in ("left", "center", "right", "justify"):
            raise ValueError("Invalid paragraph alignment")
    if result["caption"]["figure_position"] not in ("above", "below") or result["caption"]["table_position"] not in ("above", "below"):
        raise ValueError("Invalid caption position")
    if result["table"]["borders"] not in ("none", "horizontal", "grid"):
        raise ValueError("Unsupported table borders")
    for value in (result["number_sections"], result["table"]["header_bold"], result["table"]["repeat_header"], result["columns"]["title_full_width"], result["first_page"]["different"]):
        if type(value) is not bool:
            raise ValueError("Template toggles must be booleans")
    if type(result["columns"]["count"]) is not int or result["columns"]["count"] not in (1, 2):
        raise ValueError("Only one or two columns are supported")
    numeric(result["columns"]["gap_mm"], 0, 40, "column gap")
    for group in (result["header"], result["footer"], result["first_page"]["header"], result["first_page"]["footer"]):
        for text in group.values():
            if not isinstance(text, str) or len(text) > 1000 or re.search(r"[\x00-\x08\x0b-\x1f]", text):
                raise ValueError("Invalid header/footer text")
            if re.search(r"\{(?!PAGE\})|(?<!PAGE)\}", text):
                raise ValueError("Only {PAGE} is a header/footer placeholder")
    return result


def build_reference(path, spec):
    from docx import Document
    from docx.enum.style import WD_STYLE_TYPE
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Mm, Pt
    doc = Document()
    section = doc.sections[0]
    page = spec["page"]
    section.page_width, section.page_height = Mm(page["width_mm"]), Mm(page["height_mm"])
    for key in ("top", "bottom", "left", "right"):
        setattr(section, key + "_margin", Mm(page[key + "_mm"]))
    section.header_distance, section.footer_distance = Mm(page["header_mm"]), Mm(page["footer_mm"])
    section.different_first_page_header_footer = spec["first_page"]["different"]
    align = {"left": WD_ALIGN_PARAGRAPH.LEFT, "center": WD_ALIGN_PARAGRAPH.CENTER, "right": WD_ALIGN_PARAGRAPH.RIGHT, "justify": WD_ALIGN_PARAGRAPH.JUSTIFY}
    def style(name, values):
        current = doc.styles[name] if name in doc.styles else doc.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        # Remove Word's inherited template decorations before writing the declared style.
        for node in (current.element.find(qn("w:rPr")), current.element.find(qn("w:pPr"))):
            if node is not None:
                for child in list(node): node.remove(child)
        current.font.name, current.font.size = spec["fonts"]["latin"], Pt(round(values["size_pt"] * 2) / 2)
        current.element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), spec["fonts"]["cjk"])
        current.font.bold, current.font.italic = values.get("bold", False), values.get("italic", False)
        fmt = current.paragraph_format
        fmt.line_spacing = Pt(values["leading_pt"])
        fmt.space_before, fmt.space_after = Pt(values.get("before_pt", 0)), Pt(values.get("after_pt", 0))
        fmt.first_line_indent = Pt(values.get("first_indent_pt", 0))
        fmt.alignment = align[values.get("alignment", "left")]
        return current
    for name in ("Normal", "Body Text", "First Paragraph", "Bibliography"):
        style(name, spec["body"])
    style("Title", spec["title"])
    for index, values in enumerate(spec["headings"], 1):
        heading = style("Heading " + str(index), values)
        heading.paragraph_format.keep_with_next = True
        outline = OxmlElement("w:outlineLvl"); outline.set(qn("w:val"), str(index - 1)); heading.element.get_or_add_pPr().append(outline)
    abstract = style("Abstract", spec["abstract"])
    abstract.paragraph_format.left_indent = abstract.paragraph_format.right_indent = Mm(spec["abstract"]["indent_mm"])
    for name in ("Caption", "Image Caption", "Table Caption"):
        style(name, spec["caption"])
    style("Footnote Text", spec["footnote"])
    style("Table Text", spec["table"])
    for actual, values in ((section.header, spec["header"]), (section.footer, spec["footer"]), (section.first_page_header, spec["first_page"]["header"]), (section.first_page_footer, spec["first_page"]["footer"])):
        p = actual.paragraphs[0]
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.tab_stops.add_tab_stop(Mm((page["width_mm"] - page["left_mm"] - page["right_mm"]) / 2))
        p.paragraph_format.tab_stops.add_tab_stop(Mm(page["width_mm"] - page["left_mm"] - page["right_mm"]))
        for index, text in enumerate(values.values()):
            if index:
                p.add_run("\t")
            for part in re.split(r"(\{PAGE\})", text):
                if part == "{PAGE}":
                    field = OxmlElement("w:fldSimple"); field.set(qn("w:instr"), "PAGE"); p._p.append(field)
                elif part:
                    p.add_run(part)
    columns = section._sectPr.find(qn("w:cols"))
    if columns is None:
        columns = OxmlElement("w:cols"); section._sectPr.append(columns)
    columns.set(qn("w:num"), str(spec["columns"]["count"]))
    columns.set(qn("w:space"), str(round(spec["columns"]["gap_mm"] / 25.4 * 1440)))
    doc.save(path)


def map_reference(path):
    """Reject unmapped layout; never silently replace a journal rule with a default."""
    parts = ast.zip_parts(path)
    rejected = []
    bibliography = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography"
    datastore = "http://schemas.openxmlformats.org/officeDocument/2006/customXml"
    relationships = "http://schemas.openxmlformats.org/package/2006/relationships"
    office_relationships = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/"
    inactive = {"customXml/item1.xml", "customXml/itemProps1.xml", "customXml/_rels/item1.xml.rels"}
    safe_inactive = False
    theme_path = None
    if inactive.issubset(parts):
        source = ast.safe_xml(parts["customXml/item1.xml"])
        props = ast.safe_xml(parts["customXml/itemProps1.xml"])
        rels = ast.safe_xml(parts["customXml/_rels/item1.xml.rels"])
        refs = list(props)
        schema = list(refs[0]) if len(refs) == 1 else []
        safe_inactive = (source.tag == "{" + bibliography + "}Sources" and len(source) == 0 and not (source.text or "").strip()
            and dict(source.attrib) == {"SelectedStyle": "/APA.XSL", "StyleName": "APA"}
            and props.tag == "{" + datastore + "}datastoreItem" and set(props.attrib) == {"{" + datastore + "}itemID"}
            and bool(re.fullmatch(r"\{[0-9A-Fa-f-]{36}\}", props.get("{" + datastore + "}itemID", "")))
            and len(refs) == 1 and refs[0].tag == "{" + datastore + "}schemaRefs" and not refs[0].attrib
            and len(schema) == 1 and schema[0].tag == "{" + datastore + "}schemaRef" and len(schema[0]) == 0
            and dict(schema[0].attrib) == {"{" + datastore + "}uri": bibliography}
            and rels.tag == "{" + relationships + "}Relationships" and len(rels) == 1
            and rels[0].tag == "{" + relationships + "}Relationship"
            and set(rels[0].attrib) == {"Id", "Type", "Target"}
            and rels[0].get("Type") == office_relationships + "customXmlProps" and rels[0].get("Target") == "itemProps1.xml")
    for name, raw in parts.items():
        if any(word in name.casefold() for word in ("vbaproject", "embeddings/", "activex/")) or ("customxml/" in name.casefold() and not (safe_inactive and name in inactive)):
            rejected.append("active/embedded content " + name)
        if name.endswith(".rels"):
            root = ast.safe_xml(raw)
            for rel in root:
                target = rel.get("Target", "")
                # OPC internal relationships may use ../, but must resolve to a real archive member.
                owner = name.replace("/_rels/", "/").removesuffix(".rels")
                base = "" if name == "_rels/.rels" else posixpath.dirname(owner)
                resolved = posixpath.normpath(posixpath.join(base, target))
                if rel.get("TargetMode") == "External" or not target or re.search(r"[\\:%\x00-\x1f]", target) or target.startswith("/") or resolved == ".." or resolved.startswith("../") or resolved not in parts:
                    rejected.append("external/unsafe relationship " + name)
                if rel.get("Type") in (office_relationships + "customXml", office_relationships + "customXmlProps") and not (safe_inactive and resolved in inactive):
                    rejected.append("unrecognized custom XML relationship " + name)
                if name == "word/_rels/document.xml.rels" and rel.get("Type") == office_relationships + "theme":
                    if theme_path is not None: rejected.append("ambiguous document theme")
                    theme_path = resolved
        if name.endswith(".xml"):
            root = ast.safe_xml(raw)
            for tag in ("object", "altChunk", "pict", "drawing", "fldChar", "instrText", "hyperlink", "sdt", "ins", "del"):
                if root.findall(".//w:" + tag, ast.NS):
                    rejected.append("unmapped active/content rule " + tag)
            for field in root.findall(".//w:fldSimple", ast.NS):
                if field.get("{" + ast.W + "}instr", "").strip() != "PAGE":
                    rejected.append("non-PAGE field")
    if rejected:
        raise ValueError("Reference template has unmapped or unsafe rules: " + "; ".join(sorted(set(rejected))))
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.styles.style import ParagraphStyle
    doc = Document(path)
    if len(doc.sections) != 1:
        raise ValueError("Multiple reference sections must be expressed explicitly in a supported layout; no sections were dropped")
    # Reference-body prose is content, not a style; it must not disappear silently.
    if doc.tables or any(p.text.strip() for p in doc.paragraphs):
        raise ValueError("Reference DOCX contains fixed body content; move that content to the manuscript and use a styles-only reference")
    spec = copy.deepcopy(DEFAULT)
    spec["name"] = path.stem
    section = doc.sections[0]
    spec["page"].update({"width_mm": section.page_width.mm, "height_mm": section.page_height.mm,
        **{key + "_mm": getattr(section, key + "_margin").mm for key in ("top", "bottom", "left", "right")},
        "header_mm": section.header_distance.mm, "footer_mm": section.footer_distance.mm})
    align = {WD_ALIGN_PARAGRAPH.LEFT: "left", WD_ALIGN_PARAGRAPH.CENTER: "center", WD_ALIGN_PARAGRAPH.RIGHT: "right", WD_ALIGN_PARAGRAPH.JUSTIFY: "justify"}
    styles = [("Normal", spec["body"]), ("Title", spec["title"]), *[("Heading " + str(i), x) for i, x in enumerate(spec["headings"], 1)], ("Abstract", spec["abstract"]), ("Caption", spec["caption"]), ("Footnote Text", spec["footnote"])]
    mapped, resolutions = [], {}
    by_id = {}
    for item in doc.styles:
        if item.style_id in by_id: raise ValueError("Duplicate reference style ID: " + item.style_id)
        by_id[item.style_id] = item
    default_rpr = doc.styles.element.find("w:docDefaults/w:rPrDefault/w:rPr", ast.NS)
    default_ppr = doc.styles.element.find("w:docDefaults/w:pPrDefault/w:pPr", ast.NS)
    theme = ast.safe_xml(parts[theme_path]) if theme_path else None
    drawing_ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}

    def theme_font(token, slot, properties):
        if theme is None or not re.fullmatch(r"(?:major|minor)(?:Ascii|HAnsi|EastAsia|Bidi)", token):
            raise ValueError("Unresolved inherited theme font: " + token)
        family = token[:5]
        kind = "ea" if slot == "eastAsia" else "latin"
        root = theme.find("a:themeElements/a:fontScheme/a:" + family + "Font", drawing_ns)
        if root is None: raise ValueError("Missing inherited theme font scheme")
        font = root.find("a:" + kind, drawing_ns)
        name = font.get("typeface", "") if font is not None else ""
        if not name and slot == "eastAsia":
            language = properties.find("w:lang", ast.NS)
            language = language.get(qn("w:eastAsia"), "") if language is not None else ""
            script = "Hant" if language.lower() in ("zh-tw", "zh-hk", "zh-mo") else "Hans" if language.lower().startswith("zh") else "Jpan" if language.lower().startswith("ja") else "Hang" if language.lower().startswith("ko") else None
            if script:
                selected = [node for node in root.findall("a:font", drawing_ns) if node.get("script") == script]
                if len(selected) == 1: name = selected[0].get("typeface", "")
        if not name: raise ValueError("Unresolved inherited " + slot + " theme font; supply an explicit family")
        return name

    def effective_style(name):
        if name not in doc.styles:
            raise ValueError("Required reference style is missing: " + name)
        current, chain, seen = doc.styles[name], [], set()
        while current is not None:
            if current.style_id in seen: raise ValueError("Reference style inheritance cycle: " + name)
            if len(chain) >= 100: raise ValueError("Reference style inheritance exceeds limit")
            if current.type != WD_STYLE_TYPE.PARAGRAPH: raise ValueError("Reference paragraph style inherits a non-paragraph style: " + name)
            seen.add(current.style_id); chain.append(current)
            parent = current.element.find("w:basedOn", ast.NS)
            if parent is None:
                current = None
            else:
                parent_id = parent.get(qn("w:val"))
                if parent_id not in by_id: raise ValueError("Missing inherited reference style: " + str(parent_id))
                current = by_id[parent_id]
        flat = copy.deepcopy(chain[0].element)
        for prop_name, defaults in (("rPr", default_rpr), ("pPr", default_ppr)):
            old = flat.find("w:" + prop_name, ast.NS)
            if old is not None: flat.remove(old)
            merged = OxmlElement("w:" + prop_name)
            layers = [(defaults, False)] + [(item.element.find("w:" + prop_name, ast.NS), True) for item in reversed(chain)]
            for layer, in_style in layers:
                if layer is None: continue
                found = set()
                for item in layer:
                    if item.tag in found: raise ValueError("Duplicate inherited style property: " + name)
                    found.add(item.tag)
                    previous = merged.find(item.tag)
                    value = copy.deepcopy(item)
                    local = item.tag.split("}")[-1]
                    if previous is not None and local in ("rFonts", "spacing", "ind", "lang"):
                        value.attrib.clear(); value.attrib.update(previous.attrib); value.attrib.update(item.attrib)
                    if local == "rFonts":
                        for literal, themed in (("ascii", "asciiTheme"), ("hAnsi", "hAnsiTheme"), ("eastAsia", "eastAsiaTheme"), ("cs", "cstheme")):
                            if qn("w:" + literal) in item.attrib: value.attrib.pop(qn("w:" + themed), None)
                            elif qn("w:" + themed) in item.attrib: value.attrib.pop(qn("w:" + literal), None)
                    if local in ("b", "i", "bCs", "iCs"):
                        setting = item.get(qn("w:val"), "1")
                        if setting not in ("0", "1", "false", "true", "off", "on"): raise ValueError("Invalid inherited style toggle")
                        enabled = setting in ("1", "true", "on")
                        if in_style:
                            inherited = previous is not None and previous.get(qn("w:val"), "1") in ("1", "true", "on")
                            enabled = inherited != enabled
                        value.set(qn("w:val"), "1" if enabled else "0")
                    if previous is not None: merged.remove(previous)
                    merged.append(value)
            if prop_name == "rPr":
                fonts = merged.find("w:rFonts", ast.NS)
                if fonts is None: raise ValueError("Unresolved inherited font families: " + name)
                for slot, theme_slot in (("ascii", "asciiTheme"), ("hAnsi", "hAnsiTheme"), ("eastAsia", "eastAsiaTheme")):
                    if fonts.get(qn("w:" + theme_slot)):
                        fonts.set(qn("w:" + slot), theme_font(fonts.get(qn("w:" + theme_slot)), slot, merged))
                        fonts.attrib.pop(qn("w:" + theme_slot))
                    if not fonts.get(qn("w:" + slot)): raise ValueError("Unresolved inherited " + slot + " font: " + name)
                if fonts.get(qn("w:ascii")) != fonts.get(qn("w:hAnsi")):
                    raise ValueError("Distinct inherited ASCII/non-ASCII Latin fonts cannot be mapped: " + name)
            flat.append(merged)
        resolutions[name] = {"inheritance": [item.style_id for item in reversed(chain)], "doc_defaults": default_rpr is not None or default_ppr is not None}
        return ParagraphStyle(flat)

    for name, values in styles:
        current = effective_style(name)
        for key in ("size", "bold", "italic"):
            val = getattr(current.font, key)
            if key == "size" and val is None: raise ValueError("Unresolved inherited font size: " + name)
            if key in ("bold", "italic") and val is None: val = False
            if val is not None:
                if key == "size": values["size_pt"] = val.pt
                elif key in values: values[key] = val
                elif val: rejected.append(name + "." + key)
        if name == "Normal":
            if current.font.name: spec["fonts"]["latin"] = current.font.name
            fonts = current.element.find("w:rPr/w:rFonts", ast.NS)
            if fonts is not None and fonts.get("{" + ast.W + "}eastAsia"):
                spec["fonts"]["cjk"] = fonts.get("{" + ast.W + "}eastAsia")
        else:
            fonts = current.element.find("w:rPr/w:rFonts", ast.NS)
            if current.font.name != spec["fonts"]["latin"] or fonts.get(qn("w:eastAsia")) != spec["fonts"]["cjk"]:
                rejected.append(name + " distinct inherited font family")
        fmt = current.paragraph_format
        for attr, key in (("space_before", "before_pt"), ("space_after", "after_pt"), ("first_line_indent", "first_indent_pt")):
            val = getattr(fmt, attr)
            if key in values: values[key] = val.pt if val is not None else 0
            elif val is not None and val != 0: rejected.append(name + "." + attr)
        values["leading_pt"] = fmt.line_spacing.pt if hasattr(fmt.line_spacing, "pt") else values["size_pt"] * (fmt.line_spacing if fmt.line_spacing is not None else 1)
        if "alignment" in values: values["alignment"] = "left"
        if fmt.alignment is not None:
            if fmt.alignment not in align or ("alignment" not in values and fmt.alignment != WD_ALIGN_PARAGRAPH.LEFT): rejected.append(name + " alignment")
            elif "alignment" not in values: pass
            else: values["alignment"] = align[fmt.alignment]
        if name == "Abstract" and fmt.left_indent != fmt.right_indent:
            rejected.append("asymmetric abstract indents")
        if name == "Abstract": values["indent_mm"] = 0
        for side in ("left_indent", "right_indent"):
            indent = getattr(fmt, side)
            if indent:
                if name == "Abstract": values["indent_mm"] = indent.mm
                else: rejected.append(name + "." + side)
        rpr = current.element.find("w:rPr", ast.NS)
        ppr = current.element.find("w:pPr", ast.NS)
        allowed_r = {"rFonts", "sz", "szCs", "b", "bCs", "i", "iCs", "lang"}
        allowed_p = {"spacing", "ind", "jc", "keepNext", "keepLines", "widowControl", "outlineLvl", "contextualSpacing"}
        allowed_attributes = {"rFonts": {"ascii", "hAnsi", "eastAsia", "cs", "cstheme"},
            "lang": {"val", "eastAsia", "bidi"}, "spacing": {"before", "after", "line", "lineRule"},
            "ind": {"firstLine", "hanging", "left", "right"}}
        for node, allowed in ((rpr, allowed_r), (ppr, allowed_p)):
            if node is not None:
                for child in node:
                    local = child.tag.split("}")[-1]
                    if local not in allowed: rejected.append(name + "." + local)
                    attributes = allowed_attributes.get(local, {"val"})
                    if any(key not in {qn("w:" + attr) for attr in attributes} for key in child.attrib):
                        rejected.append(name + "." + local + " inherited attributes")
                    if len(child): rejected.append(name + "." + local + " inherited children")
                    if local == "spacing" and child.get(qn("w:line")) is not None and child.get(qn("w:lineRule"), "auto") != "exact":
                        rejected.append(name + " relative/minimum line spacing cannot be mapped as fixed points")
        mapped.append(name)
    columns = section._sectPr.find("w:cols", ast.NS)
    if columns is not None:
        if len(columns): rejected.append("unequal-width columns")
        spec["columns"]["count"] = int(columns.get("{" + ast.W + "}num", "1"))
        spec["columns"]["gap_mm"] = int(columns.get("{" + ast.W + "}space", "453")) / 1440 * 25.4
    allowed_section = {"pgSz", "pgMar", "cols", "docGrid", "headerReference", "footerReference", "titlePg", "type"}
    for child in section._sectPr:
        if child.tag.split("}")[-1] not in allowed_section: rejected.append("section " + child.tag.split("}")[-1])
    spec["first_page"]["different"] = section.different_first_page_header_footer
    for source, target in ((section.header, spec["header"]), (section.footer, spec["footer"]), (section.first_page_header, spec["first_page"]["header"]), (section.first_page_footer, spec["first_page"]["footer"])):
        if source.tables or len(source.paragraphs) > 1: rejected.append("complex header/footer")
        if source.paragraphs:
            p = source.paragraphs[0]
            fragments = []
            for child in p._p:
                if child.tag == "{" + ast.W + "}r":
                    fragments.append("".join("\t" if x.tag == "{" + ast.W + "}tab" else (x.text or "") for x in child if x.tag in ("{" + ast.W + "}tab", "{" + ast.W + "}t")))
                elif child.tag == "{" + ast.W + "}fldSimple": fragments.append("{PAGE}")
            chunks = "".join(fragments).split("\t")
            if len(chunks) > 3: rejected.append("header/footer tab layout")
            target.update(dict.fromkeys(target, ""))
            if len(chunks) == 1:
                alignment = align.get(p.alignment, "left")
                target[alignment if alignment in target else "left"] = chunks[0]
            else:
                target.update(zip(target, chunks))
    if rejected:
        raise ValueError("Unmapped required reference rules: " + "; ".join(sorted(set(rejected))))
    return layout_spec(spec), {"status": "mapped", "mapped_styles": mapped, "style_resolution": resolutions, "unmapped_required": [], "method": "strict effective Word-style mapping through docDefaults and basedOn; original file is never executed"}


def template_workflow(ws, args):
    selected = ws.input(args.spec or args.reference, {".json"} if args.spec else {".docx"})
    def run(out):
        source = ws.input(args.spec or args.reference, {selected.suffix})
        if args.spec:
            spec, mapping = layout_spec(common.strict_json(source)), {"status": "mapped", "method": "explicit declarative layout", "unmapped_required": []}
        else:
            spec, mapping = map_reference(source)
        shutil.copyfile(source, out / ("original" + source.suffix))
        build_reference(out / "reference.docx", spec)
        research.write_json(out / "template.json", spec)
        word_sizes = {name: round(spec[name]["size_pt"] * 2) / 2 for name in ("body", "title", "abstract", "caption", "footnote", "table")}
        research.write_json(out / "mapping.json", {**mapping, "source_sha256": research.digest(source), "reference_sha256": research.digest(out / "reference.docx"), "docx_font_sizes_pt": word_sizes, "scientific_check": "not_applicable", "visual_check": "pending"})
        return {"status": "complete", "template_mapping": "complete", "visual_check": "pending"}
    return common.step(ws, "templates", args.id, {"input_kind": "spec" if args.spec else "reference"}, [selected], [], run,
                       entry=__file__, extra=[Path(ast.__file__)])


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True); parser.add_argument("--task", default="T1"); parser.add_argument("--id", required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--spec"); group.add_argument("--reference")
    return common.cli(template_workflow, parser, argv)


if __name__ == "__main__":
    raise SystemExit(main())
