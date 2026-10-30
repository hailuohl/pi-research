"""Render the AIC report and its full resource annex from reviewed JSON sources.

Requires reportlab and pypdf. Supply an OFL-licensed Noto Sans SC TrueType font.
No product services, credentials, databases or research jobs are accessed.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Flowable, Image, KeepTogether, LongTable, PageBreak,
                               Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle)
from pypdf import PdfReader, PdfWriter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PAGE_W, PAGE_H = A4
MARGIN = 57
WIDTH = PAGE_W - 2 * MARGIN
TOKENS = {"accent": "#2A5A6B", "ink": "#171B1E", "muted": "#58636B",
          "tint": "#F1F5F6", "line": "#D9E0E3", "body": 11, "leading": 17}
MARKS = {}


def load(name):
    return json.loads((HERE / name).read_text(encoding="utf-8-sig"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe(s):
    return escape(str(s)).replace("\n", "<br/>")


def link(url, label=None):
    if url.startswith("git+"):
        url = url[4:]
    if url.startswith("https://") or url.startswith("http://"):
        return '<link href="' + escape(url, {'"': '&quot;'}) + '">' + safe(label or url) + '</link>'
    return safe(label or url)


def style(name, size, leading=None, **kw):
    return ParagraphStyle(name, fontName="NotoSC", fontSize=size, leading=leading or size * 1.55,
                          textColor=colors.HexColor(TOKENS["ink"]), wordWrap="CJK", alignment=TA_LEFT, **kw)


S = {}


def setup_styles():
    S.update(body=style("body", 11, 17, spaceAfter=8),
             small=style("small", 9, 13, spaceAfter=6),
             tiny=style("tiny", 8.2, 11.5),
             h1=style("h1", 20, 28, spaceAfter=15, keepWithNext=True),
             h2=style("h2", 12.8, 19, spaceBefore=8, spaceAfter=6, keepWithNext=True),
             chapter=style("chapter", 9.5, 14, textTransform=None, spaceAfter=7),
             table=style("table", 9.4, 13.7),
             th=style("th", 9.3, 13.6),
             caption=style("caption", 8.5, 12, spaceBefore=3, spaceAfter=9),
             resource=style("resource", 9.5, 14, spaceAfter=5))


def p(text, sty="body"):
    return Paragraph(safe(text), S[sty])


def rich(text, sty="body"):
    return Paragraph(text, S[sty])


def table(headers, rows, widths=None, compact=False):
    widths = widths or [1 / len(headers)] * len(headers)
    body_style = "tiny" if compact else "table"
    data = [[p(x, "th") for x in headers]]
    for row in rows:
        data.append([rich(x[1], body_style) if isinstance(x, tuple) and x[0] == "html" else p(x, body_style) for x in row])
    t = LongTable(data, colWidths=[WIDTH * x for x in widths], repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(TOKENS["tint"])),
        ("LINEABOVE", (0, 0), (-1, 0), 1.2, colors.HexColor(TOKENS["accent"])),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor(TOKENS["line"])),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFA")]),
        ("LINEBELOW", (0, -1), (-1, -1), 0.5, colors.HexColor(TOKENS["line"])),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)
    ]))
    t.spaceAfter = 10
    return t


class Marker(Flowable):
    def __init__(self, key):
        super().__init__()
        self.key = key
        self.height = 0
    def draw(self):
        MARKS[self.key] = self.canv.getPageNumber()
        self.canv.bookmarkPage(self.key)


class Architecture(Flowable):
    def __init__(self):
        super().__init__()
        self.width, self.height = WIDTH, 245
    def draw(self):
        c = self.canv
        c.saveState()
        c.setFont("NotoSC", 9.5)
        def box(x, y, w, h, lines):
            c.setFillColor(colors.HexColor(TOKENS["tint"]))
            c.setStrokeColor(colors.HexColor(TOKENS["line"]))
            c.rect(x, y, w, h, fill=1, stroke=1)
            c.setFillColor(colors.HexColor(TOKENS["ink"]))
            for j, text in enumerate(lines):
                c.drawCentredString(x+w/2, y+h/2+7*(len(lines)-1)-14*j-3, text)
        def arrow(x1, y1, x2, y2):
            c.setStrokeColor(colors.HexColor(TOKENS["accent"]))
            c.setFillColor(colors.HexColor(TOKENS["accent"]))
            c.line(x1, y1, x2, y2)
            q = c.beginPath(); q.moveTo(x2-3, y2+5); q.lineTo(x2, y2); q.lineTo(x2+3, y2+5); q.close()
            c.drawPath(q, stroke=0, fill=1)
        box(0, 203, 181, 35, ["研究者 React工作台 / CLI"])
        box(208, 203, WIDTH-208, 35, ["主协调Pi / 辅助Pi Worker"])
        arrow(90, 203, 90, 184); arrow(345, 203, 345, 184)
        box(0, 143, WIDTH, 41, ["Operation Registry 统一输入输出与操作入口", "角色与项目范围 / 当前权限 / 精确确认 / 幂等回执"])
        arrow(WIDTH/2, 143, WIDTH/2, 126)
        box(0, 80, WIDTH, 46, ["研究应用服务", "任务与审查 / 固定方案 / 文献证据 / 开发与运行 / 报告与文稿"])
        arrow(76, 80, 76, 61); arrow(240, 80, 240, 61); arrow(403, 80, 403, 61)
        box(0, 7, 151, 54, ["SQLite / 事件与回执", "固定快照 / 文件产物"])
        box(166, 7, 151, 54, ["论文源 / 原文解析", "本地检索 / 模型HTTP"])
        box(332, 7, WIDTH-332, 54, ["local / Docker / SSH", "固定文稿编译器"])
        c.restoreState()


class Workflow(Flowable):
    def __init__(self):
        super().__init__(); self.width = WIDTH; self.height = 100
    def draw(self):
        c = self.canv; c.saveState(); c.setFont("NotoSC", 9.5)
        labels = [("问题与输入", "固定版本"), ("计划与任务", "确认范围"), ("实现与审查", "准确批准"), ("真实Run", "核验产物"), ("报告与文稿", "固定引用")]
        w = 84
        for i, lines in enumerate(labels):
            x = i*(WIDTH-w)/4
            c.setStrokeColor(colors.HexColor(TOKENS["line"])); c.setFillColor(colors.HexColor(TOKENS["tint"]))
            c.rect(x, 20, w, 58, fill=1, stroke=1)
            c.setFillColor(colors.HexColor(TOKENS["ink"]))
            c.drawCentredString(x+w/2, 54, lines[0]); c.drawCentredString(x+w/2, 37, lines[1])
            if i < 4:
                c.setStrokeColor(colors.HexColor(TOKENS["accent"]))
                c.line(x+w+2, 49, x+(WIDTH-w)/4-2, 49)
        c.restoreState()


def frame(kind, body_pages=0):
    def draw(c, doc):
        n = c.getPageNumber()
        c.saveState()
        c.setTitle("研舟π可追溯科研智能体 技术报告" if kind == "report" else "开源及第三方资源使用清单")
        c.setAuthor("")
        c.setSubject("2026 AIC AI+开源 匿名技术材料")
        if kind == "report" and n == 1:
            c.restoreState(); return
        c.setFillColor(colors.HexColor(TOKENS["muted"])); c.setFont("NotoSC", 8)
        c.drawString(MARGIN, PAGE_H-34, "研舟π  AIC 2026  " + ("技术报告" if kind == "report" else "开源及第三方资源使用清单"))
        c.setStrokeColor(colors.HexColor(TOKENS["accent"])); c.setLineWidth(0.8)
        c.line(MARGIN, PAGE_H-41, PAGE_W-MARGIN, PAGE_H-41)
        c.setStrokeColor(colors.HexColor(TOKENS["line"])); c.setLineWidth(0.4)
        c.line(MARGIN, 38, PAGE_W-MARGIN, 38)
        label = f"正文 {n-1}" if kind == "report" and n <= body_pages+1 else f"参考与证据 {n-body_pages-1}" if kind == "report" else f"资源附件 {n}"
        c.drawString(MARGIN, 24, "2026-10-30  ·  0.3.2-experimental")
        c.drawRightString(PAGE_W-MARGIN, 24, label)
        c.restoreState()
    return draw


def build(path, story, kind, body_pages=0):
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                            topMargin=57, bottomMargin=53, pageCompression=1,
                            title="研舟π可追溯科研智能体", author="")
    callback = frame(kind, body_pages)
    doc.build(story, onFirstPage=callback, onLaterPages=callback)


def cover(content, inventory):
    return [Spacer(1, 44), p("2026 第八届全球校园人工智能算法精英大赛", "h2"),
            p("AI+开源 算法主题赛", "h2"), Spacer(1, 48),
            Paragraph("研舟π<br/>可追溯科研智能体", style("coverTitle", 31, 45, spaceAfter=22)),
            p("技术报告", "h1"), Spacer(1, 20),
            p("参赛方向  " + content["direction"]), p("日期  " + content["date"]),
            p("代码版本  " + inventory["packageVersion"] + "  ·  feature/report", "small"),
            p("分析基线  " + inventory["baselineCommit"], "small"), Spacer(1, 27),
            p("作品简介", "h2"), p(content["summary"]),
            Spacer(1, 12), p("正文按官方八章组织；其后为参考与证据，以及完整资源使用清单附件。团队信息按要求暂不列入。", "small"),
            p("本材料记录软件原型、历史实测和本次检查的各自边界。", "small")]


def report_story(content, inventory, verification):
    story = cover(content, inventory)
    for i, page in enumerate(content["pages"]):
        story.extend([PageBreak(), Marker(f"body-{i+1}"), p(page["chapter"], "chapter"), p(page["title"], "h1")])
        for b in page["blocks"]:
            t = b["type"]
            if t in ("p", "h2", "caption"):
                story.append(p(b["text"], {"p":"body", "h2":"h2", "caption":"caption"}[t]))
            elif t == "table":
                story.append(table(b["headers"], b["rows"], b.get("widths")))
            elif t == "architecture": story.append(Architecture())
            elif t == "workflow": story.append(Workflow())
            elif t == "image":
                im = Image(str(ROOT / b["path"])); factor = min(WIDTH/im.imageWidth, b["height"]/im.imageHeight)
                im.drawWidth, im.drawHeight = im.imageWidth*factor, im.imageHeight*factor
                story.extend([im, p(b["caption"], "caption")])
            elif t == "validation":
                test = verification["tests"]
                clean = verification["cleanBuild"]
                story.append(table(["当前代码检查", "实际结果"], [
                    ["npm test", f"{test['total']}项：{test['pass']}通过、{test['fail']}失败、{test['skip']}跳过；退出码{test['exitCode']}。"],
                    ["干净安装 构建 类型检查", f"{clean['status']}；{clean.get('files', '未知')}份dist产物比较；结果一致={clean.get('identical', False)}。"],
                    ["环境", "Windows；Node 24.18.0；npm实际11.16.0（packageManager声明11.17.0）。"],
                    ["未在本轮执行", "外部模型live、真实Docker/SSH/GPU、浏览器交互和科研数值重跑。历史证据单列。"]
                ], [0.36,0.64]))
    story.extend([PageBreak(), Marker("references"), p("附录 参考与证据", "h1"),
                  p("代码链接固定到分析基线；资源附件与本报告一起提供。仓库当前为private，外部访问需要合法授权。行号与详细资源来源见resource-inventory.json。", "small")])
    for r in content["references"]:
        url = r.get("url")
        if r.get("path"):
            url = "https://github.com/hailuohl/pi-research/blob/" + inventory["baselineCommit"] + "/" + quote(r["path"], safe="/")
        if r.get("local"):
            url = "https://github.com/hailuohl/pi-research/blob/feature/report/docs/aic-2026/" + r["local"]
        story.append(rich(safe("["+r["id"]+"] "+r["title"])+"<br/>"+link(url), "small"))
    story.extend([p("数据署名与引用", "h2"),
                  p("Wine Quality：Cortez, P., Cerdeira, A., Almeida, F., Matos, T., & Reis, J. (2009). UCI Machine Learning Repository. DOI 10.24432/C56S3T，CC BY 4.0。报告引用红酒子集的既有分组试用结果，划分及模型处理由项目另述。", "small"),
                  p("Anscombe：F. J. Anscombe (1973), Graphs in Statistical Analysis, DOI 10.1080/00031305.1973.10478966；数值来源R datasets的anscombe资料，R说明另引Tufte (1990)。不转载原论文图页；数据专门许可与精确上游修订未在本轮独立证实。", "small"),
                  p("附后的资源使用清单", "h2"),
                  p("资源附件与独立PDF为同一份内容，覆盖主要资源、条件接入、报告所引用数据、npm锁定组件和可选编译器锁定组件。主表不把历史停用包或仅在文档中提及的框架列为现用。", "small")])
    return story


def group(r):
    t = r["type"]
    if t.startswith("npm-direct"): return 0
    if t in ("npm-transitive-browser", "npm-transitive-runtime", "adapted-source", "adapted-source-resource", "adapted-algorithm-source", "static-assets", "static-brand-assets"): return 1
    if t in ("runtime-tool", "development-tool"): return 2
    if t.startswith("historical-public"): return 5
    if t == "development-ai-tools": return 6
    if t == "external-service-adapter" or t == "optional-external-model-services": return 4
    return 3


def resource_story(inv):
    s = [Marker("resources"), p("技术报告附件", "chapter"), p("开源及第三方资源使用清单", "h1"),
         p("作品  研舟π可追溯科研智能体"),
         p("核对日期 2026-10-30；代码版本 " + inv["packageVersion"], "small"),
         p("基线 " + inv["baselineCommit"], "small"),
         p("披露口径", "h2"),
         p("清单依据当前源码、实际调用链、锁文件与许可文件形成。现用资源、按需接入和报告引用数据分别列明。代码支持或SDK带有某个客户端，不代表该服务实际调用过；锁定可选平台包不表示当前主机安装或执行。历史停用包不列入现用主表。"),
         p(f"主表共{len(inv['resources'])}项披露记录（包含项目开发辅助工具与模型），另附153条npm锁定路径和257项可选文稿编译器锁定组件。11个npm直接依赖中，两个Pi包虽声明于devDependencies，应用AI运行时仍会调用；不能据dev标志判断它们无需安装。"),
         table(["状态含义", "本清单的使用方式"], [["已核对", "仅对明确列出的版本、源码、许可文件或安装事实确认，不表示整个系统获合规认证。"], ["待补齐 / 部分核验", "列明实际告知、授权或组件核验缺口；不以锁字段或资源可下载替代授权。"], ["按需配置", "当前代码已经接线，启用与安装由用户选择；本次没有据此冒称已执行。"], ["报告引用", "历史实验数据用于本报告证据，不是应用的默认运行依赖；保留原日期与实验环境。"]], [0.27,0.73]),
         p("本次发现的具体待办", "h2"),
         p("marked完整分发告知需补齐；论文源logo的原站版权/商标范围、可选编译器逐包许可及Anscombe专门数据许可尚未全面核验。正文已披露这些限制。本次为分析与材料制作，没有修改产品许可文件或第三方资产。", "small")]
    titles = ["A 当前直接npm依赖", "B 当前传递资源与改编内容", "C 运行与构建底座", "D 当前按需工具及运行环境", "E 已接线的可选外部服务", "F 本报告引用的历史数据", "G 项目开发中的AI辅助工具与模型"]
    index = 0
    for g, title in enumerate(titles):
        rs = [r for r in inv["resources"] if group(r) == g]
        if not rs: continue
        if g == 0:
            s.append(PageBreak())
        else:
            s.append(Spacer(1, 18))
        s.append(p(title, "h1"))
        if g == 4:
            s.append(p("这一组仅披露当前代码接入的服务类型及其授权边界，不是“全部服务已实际使用”的证明。具体调用仍以配置、逐请求记录和对应历史验收为准。", "small"))
        for r in rs:
            index += 1
            src = r["source"]
            parts = src.split(" ; ")
            source_html = "<br/>".join(link(x) for x in parts)
            ev = "；".join(e["file"] + (":"+str(e["line"]) if e.get("line") else "") for e in r["evidence"][:3])
            record = [p(f"{index:02d}  {r['name']}", "h2"),
                      p("版本  " + r["version"], "resource"),
                      rich("来源  " + source_html, "tiny"),
                      p("许可证或授权  " + r["license"], "resource"),
                      p("使用及开放方式  " + r["use"], "resource"),
                      p("自主开发边界  " + r["originalBoundary"], "resource"),
                      p("关键义务或限制  " + r["obligations"], "resource"),
                      p("核验状态  " + r["compliance"], "resource")]
            if ev: record.append(p("代码依据  " + ev, "tiny"))
            record.append(Spacer(1, 9))
            s.append(KeepTogether(record))
    s.extend([PageBreak(), p("H npm锁定组件完整索引", "h1"),
              p("以下为package-lock.json的全部非根路径条目。153条包含11项直接声明与142条非直接路径；可选平台组件保留在锁中，其中本机实际安装128条。依赖路径和平台条件以resource-inventory.json为准。表内名称链接到锁定下载来源；同名不同版本或嵌套路径分别保留。", "small"),
              p("共同字段：使用方式为上游依赖；本项目不声称修改这些组件。许可栏来自锁元数据，安装状态只读核对node_modules。每项再分发义务依下表许可索引及包内完整告知；实际分发内容仍需补充核验。Pi相关dev标志不排除运行时调用。", "small"),
              table(["许可", "共同关键义务"], [["MIT / ISC", "再分发保留版权、许可和免责。marked另保留其包内Markdown告知。"], ["Apache-2.0", "保留许可与适用NOTICE、注明修改，并按许可处理专利及再分发条件。"], ["BSD-3-Clause", "保留版权、条件与免责；遵守不以权利人名称背书的条款。"], ["BlueOak-1.0.0", "向接收者保留许可文本或链接，并保留相关告知。"], ["Unlicense / 0BSD", "按原文处理公共领域奉献或无条件许可；不把上游组件作为自有原创。"]], [0.29,0.71], compact=True)])
    npm_rows=[]
    for i,r in enumerate(inv["npmLocked"],1):
        flags = r["kind"] + (" / optional" if r["optional"] else "")
        npm_rows.append([f"N{i:03d}", ("html", link(r["source"], r["name"]) + "<br/>" + safe(r["version"])), r["license"], flags, "已安装" if r["installed"] else "未安装\n条件候选"])
    s.append(table(["索引", "名称与版本 来源链接", "许可元数据", "范围", "本机状态"], npm_rows, [0.1,0.39,0.18,0.2,0.13], compact=True))
    s.extend([PageBreak(), p("I 可选编译器锁定组件索引", "h1"),
              p("此表只用于完整披露当前文稿编译profile的组成，不将257项系统组件当作当前应用已执行的核心库。它们固定于Debian trixie 20260918T000000Z快照；镜像根包为TeX Live、Biber、Poppler及字体。名称链接到锁定的Debian包来源，精确URL、大小与SHA-256见resource-inventory.json及原锁文件。", "small"),
              p("每项共同字段：使用为可选编译器直接或传递组件；上游未修改；许可证为组合许可，逐包copyright及源码提供策略待核验；在实际镜像的/usr/share/doc/<package>/copyright查明后履行相应告知、再分发及源码义务。本表不把整套镜像标为MIT，也不把已保留版权文件等同于全部义务完成。", "small")])
    deb_rows=[]
    for i,r in enumerate(inv["optionalCompilerLocked"],1):
        deb_rows.append([f"D{i:03d}", ("html", link(r["url"], r["name"])), r["version"], "逐包许可待核验"])
    s.append(table(["索引", "组件名称 来源链接", "固定版本", "许可状态"], deb_rows, [0.1,0.37,0.34,0.19], compact=True))
    s.extend([p("J 成果访问与开放方式", "h1"),
              rich(link("https://github.com/hailuohl/pi-research") + "<br/>分支 feature/report。仓库为private，源码中自有部分采用MIT，第三方部分沿各自许可；评审访问仍需单独核验。", "small"),
              p("本附件不包含密钥、认证、运行数据库、原始对话、论文全文、模型权重、工具安装包或容器镜像。已停用资源、仅参考项目和未实现服务未列现用主表。锁内平台条件候选单列，不与现用资源合并计数。", "small")])
    return s


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--font", type=Path, required=True)
    parser.add_argument("--scratch", type=Path, required=True)
    args = parser.parse_args()
    args.scratch.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("NotoSC", str(args.font)))
    setup_styles()
    content, inv, verification = load("report-content.json"), load("resource-inventory.json"), load("verification.json")
    cmap = pdfmetrics.getFont("NotoSC").face.charToGlyph
    missing = sorted({c for c in json.dumps([content, inv], ensure_ascii=False) if ord(c) > 32 and ord(c) not in cmap})
    if missing:
        raise RuntimeError("Font is missing source glyphs: " + repr(missing))
    assert len(content["workName"]) <= 20
    assert len(content["summary"]) <= 300
    body = args.scratch / "technical-body.pdf"
    resource = HERE / "开源及第三方资源使用清单.pdf"
    build(body, report_story(content, inv, verification), "report", len(content["pages"]))
    body_marks = {k:v for k,v in MARKS.items() if k.startswith("body-")}
    expected={f"body-{i+1}":i+2 for i in range(len(content["pages"]))}
    if body_marks != expected:
        raise RuntimeError("Main pages overflowed planned readable layout: " + repr(body_marks))
    body_pages = len(PdfReader(body).pages)
    build(resource, resource_story(inv), "resources")
    writer=PdfWriter()
    writer.append(body, outline_item="技术报告 正文与证据")
    writer.append(resource, outline_item="附件 开源及第三方资源使用清单")
    writer.add_metadata({"/Title":"研舟π可追溯科研智能体 技术报告", "/Author":"", "/Subject":"2026 AIC AI+开源 匿名技术材料"})
    final=HERE / "研舟π技术报告-修订版.pdf"
    with final.open("wb") as f: writer.write(f)
    summary={"workNameChars":len(content["workName"]), "summaryChars":len(content["summary"]),
             "bodyPages":len(content["pages"]), "coverPages":1, "referencePages":body_pages-len(content["pages"])-1,
             "resourcePages":len(PdfReader(resource).pages), "combinedPages":len(PdfReader(final).pages),
             "bodyMarkers":body_marks, "files":{p.name:{"bytes":p.stat().st_size,"sha256":digest(p)} for p in (final,resource)}}
    (HERE / "artifact-checks.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False))


if __name__ == "__main__":
    main()
