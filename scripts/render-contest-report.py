"""Render the contest Markdown draft and evidence figures using reportlab and Pillow.

Run with the Codex bundled Python. No product dependencies are changed.
"""
import argparse
import html
import json
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as PDFImage, Preformatted

parser = argparse.ArgumentParser()
parser.add_argument('report', type=Path)
parser.add_argument('--font-dir', type=Path, default=Path('C:/Windows/Fonts'))
args = parser.parse_args()
base = args.report.resolve().parent
figures = base / 'figures'
figures.mkdir(exist_ok=True)
font_regular = args.font_dir / 'simsun.ttc'
font_bold = args.font_dir / 'simhei.ttf'
assert font_regular.exists() and font_bold.exists(), 'Supply a directory containing simsun.ttc and simhei.ttf'
pdfmetrics.registerFont(TTFont('CJK', str(font_regular)))
pdfmetrics.registerFont(TTFont('CJKBold', str(font_bold)))
pdfmetrics.registerFontFamily('CJK', normal='CJK', bold='CJKBold', italic='CJK', boldItalic='CJKBold')

def font(size, bold=False):
    return ImageFont.truetype(str(font_bold if bold else font_regular), size)

def arrow(draw, points, color='#354457', width=5):
    draw.line(points, fill=color, width=width, joint='curve')
    x, y = points[-1]
    dx, dy = x-points[-2][0], y-points[-2][1]
    angle = math.atan2(dy, dx)
    draw.polygon([(x, y), (x-17*math.cos(angle-.45), y-17*math.sin(angle-.45)),
                  (x-17*math.cos(angle+.45), y-17*math.sin(angle+.45))], fill=color)

def node(draw, center, label, outline='#354457', width=160):
    x, y = center
    draw.rounded_rectangle((x-width/2,y-35,x+width/2,y+35), radius=9, fill='white', outline=outline, width=3)
    draw.text((x,y),label,fill=outline,font=font(30),anchor='mm')

img=Image.new('RGB',(1500,600),'white'); d=ImageDraw.Draw(img)
d.text((55,25),'任务关系与审查等待环',font=font(39,True),fill='#17283b')
d.text((55,93),'任务层关系',font=font(30,True),fill='#17283b')
for center,label in [((130,205),'A 训练'),((330,205),'B 验证'),((330,390),'R 审查')]:node(d,center,label)
arrow(d,[(210,205),(250,205)]);arrow(d,[(330,240),(330,355)])
arrow(d,[(130,240),(130,390),(250,390)])
d.text((55,480),'只看任务依赖和reviewOf：无环',font=font(26),fill='#354457')
d.text((590,93),'提交与验收事件',font=font(30,True),fill='#17283b')
for center,label in [((690,160),'S(A)'),((690,300),'A(A)'),((980,300),'S(B)'),((1270,300),'A(B)'),((1270,460),'S(R)'),((980,460),'A(R)')]:node(d,center,label,outline='#a43731' if label!='S(A)' else '#354457')
arrow(d,[(690,195),(690,265)])
arrow(d,[(770,160),(1420,160),(1420,460),(1350,460)],color='#356d91')
d.text((1190,125),'读取已提交成果',font=font(24),fill='#356d91')
for points in [[(770,300),(900,300)],[(1060,300),(1190,300)],[(1270,335),(1270,425)],[(1190,460),(1060,460)],[(900,460),(690,460),(690,335)]]:arrow(d,points,color='#a43731')
d.text((590,550),'S 为提交，A 为验收；红色路径形成等待环',font=font(27),fill='#a43731')
img.save(figures/'event-graph.png')

benchmark=json.loads((base/'evidence/E3-benchmark.json').read_text(encoding='utf-8'))
rows=[r for r in benchmark['rows'] if r['implementation']=='production']
assert [r['size'] for r in rows]==[4,8,16,24]
img=Image.new('RGB',(1500,850),'white');d=ImageDraw.Draw(img)
d.text((70,30),'生产图校验的批次平均每次调用耗时',font=font(36,True),fill='#17283b')
d.text((70,88),'每规模30批，每批1024次；竖线顶端为批次P95',font=font(27),fill='#354457')
x0,y0,w,h=170,650,1170,440
maximum=max(r['p95NsPerCall']/1000 for r in rows)*1.2
for i in range(6):
    value=maximum*i/5;y=y0-h*i/5
    d.line((x0,y,x0+w,y),fill='#dce2e7',width=2)
    d.text((x0-20,y),f'{value:.1f}',font=font(25),fill='#354457',anchor='rm')
d.text((35,155),'微秒',font=font(27),fill='#354457')
for i,r in enumerate(rows):
    x=x0+(i+.5)*w/4;median=r['medianNsPerCall']/1000;p95=r['p95NsPerCall']/1000
    top=y0-h*median/maximum;tail=y0-h*p95/maximum
    d.rectangle((x-72,top,x+72,y0),fill='#356d91')
    d.line((x,tail,x,top),fill='#a65b20',width=5);d.line((x-27,tail,x+27,tail),fill='#a65b20',width=5)
    d.text((x,tail-22),f'{median:.2f} / {p95:.2f}',font=font(25),fill='#17283b',anchor='ms')
    d.text((x,y0+30),str(r['size']),font=font(30),fill='#17283b',anchor='mm')
d.text((750,735),'任务数',font=font(30),fill='#17283b',anchor='mm')
d.text((70,800),'标签为中位数 / 批次P95；不表示单请求尾延迟或整体调度提速',font=font(25),fill='#354457')
img.save(figures/'validation-timing.png')

source=args.report.read_text(encoding='utf-8')
assert '<!-- E3_TABLE -->' not in source and '<!-- REGRESSION_STATUS -->' not in source, 'Unfilled result section'
styles=getSampleStyleSheet()
body=ParagraphStyle('CNBody',fontName='CJK',fontSize=11,leading=16.5,spaceAfter=6,wordWrap='CJK',allowWidows=0,allowOrphans=0)
styles.add(body)
styles.add(ParagraphStyle('CNTitle',parent=body,fontName='CJKBold',fontSize=22,leading=30,spaceAfter=15))
styles.add(ParagraphStyle('CNH1',parent=body,fontName='CJKBold',fontSize=15,leading=22,spaceBefore=13,spaceAfter=8,keepWithNext=True))
styles.add(ParagraphStyle('CNH2',parent=body,fontName='CJKBold',fontSize=12,leading=19,spaceBefore=9,spaceAfter=5,keepWithNext=True))
styles.add(ParagraphStyle('CNCell',parent=body,fontSize=9.2,leading=14,spaceAfter=0))
styles.add(ParagraphStyle('CNCellHead',parent=styles['CNCell'],fontName='CJKBold'))
styles.add(ParagraphStyle('CNCode',parent=body,fontName='CJK',fontSize=9.5,leading=15))
styles.add(ParagraphStyle('CNCaption',parent=body,fontSize=9.5,leading=15,alignment=TA_CENTER,spaceAfter=9))

def rich(text):
    text=html.escape(text)
    text=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',text)
    text=re.sub(r'`([^`]+)`',r'\1',text)
    return text

story=[];lines=source.splitlines();i=0;content_width=A4[0]-44*mm
while i<len(lines):
    line=lines[i].strip()
    if not line:i+=1;continue
    if line.startswith('<!--'):i+=1;continue
    if line.startswith('```'):
        code=[];i+=1
        while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
        story.append(Preformatted('\n'.join(code),styles['CNCode']));story.append(Spacer(1,7));i+=1;continue
    if line.startswith('|'):
        data=[]
        while i<len(lines) and lines[i].strip().startswith('|'):
            cells=[c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?',c.replace(' ','')) for c in cells):data.append(cells)
            i+=1
        n=len(data[0]);assert all(len(r)==n for r in data)
        weights=[max(min(max(len(r[c]) for r in data),36),9) for c in range(n)]
        widths=[content_width*v/sum(weights) for v in weights]
        paragraphs=[[Paragraph(rich(c),styles['CNCellHead'] if ri==0 else styles['CNCell']) for c in row] for ri,row in enumerate(data)]
        table=Table(paragraphs,colWidths=widths,repeatRows=1,hAlign='LEFT')
        table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#edf1f4')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LINEBELOW',(0,0),(-1,0),.6,colors.HexColor('#8c9aa5')),('LINEBELOW',(0,1),(-1,-1),.25,colors.HexColor('#d9e0e5'))]))
        story.extend([table,Spacer(1,10)]);continue
    match=re.fullmatch(r'!\[(.*?)\]\((.*?)\)',line)
    if match:
        path=base/match.group(2)
        with Image.open(path) as im:width,height=im.size
        picture=PDFImage(str(path),width=content_width,height=content_width*height/width)
        story.extend([picture,Paragraph(rich(match.group(1)),styles['CNCaption'])]);i+=1;continue
    if line.startswith('# '):style=styles['CNTitle'];text=line[2:]
    elif line.startswith('## '):style=styles['CNH1'];text=line[3:]
    elif line.startswith('### '):style=styles['CNH2'];text=line[4:]
    else:style=body;text=line
    story.append(Paragraph(rich(text),style));i+=1

def footer(canvas,doc):
    canvas.saveState();canvas.setFont('CJK',8.5);canvas.setFillColor(colors.HexColor('#5d6770'))
    canvas.drawString(22*mm,14*mm,'研舟π 技术报告初稿 2026年10月25日')
    canvas.drawRightString(A4[0]-22*mm,14*mm,str(doc.page));canvas.restoreState()

output=args.report.with_suffix('.pdf')
doc=SimpleDocTemplate(str(output),pagesize=A4,rightMargin=22*mm,leftMargin=22*mm,topMargin=20*mm,bottomMargin=23*mm,title='研舟π 可追溯科研协作智能体 技术报告初稿',author='研舟π项目')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
assert output.stat().st_size<10*1024*1024
print(json.dumps({'pdf':str(output),'bytes':output.stat().st_size,'figures':2},ensure_ascii=False))
