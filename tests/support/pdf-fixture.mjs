// Original fixture PDFs built from literal objects; no model, download or parser result is fabricated.
export function pdfFixture({pages=3,marker='Fixture measured source',unicode=true,noise=false,nestedImage=false,nestedImageDepth=0,invalidFormMatrix=false}={}) {
 const objects=[null,null],add=value=>(objects.push(Buffer.isBuffer(value)?value:Buffer.from(value,'ascii')),objects.length),stream=(dictionary,bytes)=>Buffer.concat([Buffer.from(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`),bytes,Buffer.from('\nendstream')]);
 const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 // Self-contained Type3 outlines: actual 中 and a simple smiling face, not missing CID fonts.
 const chinese=add(stream('',Buffer.from('1000 0 0 0 1000 1000 d1\n65 w\n200 300 600 400 re S\n500 120 m 500 880 l S\n','ascii')));
 const smile=add(stream('',Buffer.from('1000 0 0 0 1000 1000 d1\n45 w\n880 500 m 880 710 710 880 500 880 c 290 880 120 710 120 500 c 120 290 290 120 500 120 c 710 120 880 290 880 500 c S\n320 570 70 90 re f\n610 570 70 90 re f\n280 430 m 340 250 660 250 720 430 c S\n','ascii')));
 const cmap=add(stream('',Buffer.from('/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /TestUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n2 beginbfchar\n<01> <4E2D>\n<02> <D83DDE00>\nendbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend','ascii')));
 const unicodeFont=add(`<< /Type /Font /Subtype /Type3 /FontBBox [0 0 1000 1000] /FontMatrix [0.001 0 0 0.001 0 0] /CharProcs << /uni4E2D ${chinese} 0 R /u1F600 ${smile} 0 R >> /Encoding << /Type /Encoding /Differences [1 /uni4E2D /u1F600] >> /FirstChar 1 /LastChar 2 /Widths [1000 1000] /Resources << >> /ToUnicode ${cmap} 0 R >>`);
 const imageWidth=noise?256:160,imageHeight=noise?256:60,data=Buffer.alloc(imageWidth*imageHeight*3,255);
 if(noise){for(let i=0;i<data.length;i++)data[i]=(i*37+(i>>5)*13)%256;}
 else {
  // SCAN is drawn into RGB pixels only: these pages have no PDF text objects or font dependency.
  const glyphs=['01111/10000/10000/01110/00001/00001/11110','01111/10000/10000/10000/10000/10000/01111','01110/10001/10001/11111/10001/10001/10001','10001/11001/11001/10101/10011/10011/10001'];
  for(const [g,glyph] of glyphs.entries())for(const [y,row] of glyph.split('/').entries())for(let x=0;x<5;x++)if(row[x]==='1'){
   for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
    const offset=((16+y*4+dy)*imageWidth+34+g*24+x*4+dx)*3;data.fill(0,offset,offset+3);
   }
  }
 }
 const image=add(stream(`/Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8`,data));
 const depth=nestedImageDepth||(nestedImage?1:0);if(!Number.isInteger(depth)||depth<0||depth>12)throw Error('Invalid nested image depth');
 let form=null;
 for(let level=0;level<depth;level++){
  const inner=level===0,child=inner?image:form,childName=inner?'Im1':`Fm${level}`;
  const body=inner?(depth===2?'q 100 0 0 60 0 0 cm /Im1 Do Q':'q 1 0 0 1 0 0 cm /Im1 Do Q'):`q 1 0 0 1 ${depth===2?15:0} ${depth===2?10:0} cm /${childName} Do Q`;
  const matrix=depth===2?(inner?'0 1 -1 0 220 0':'1 0.2 0.35 1 10 5'):invalidFormMatrix&&level===depth-1?'1 0 0 1 1000001 0':'1 0 0 1 0 0';
  const bbox=depth===2?(inner?'0 0 100 60':'0 0 250 120'):'0 0 1 1';
  form=add(stream(`/Type /XObject /Subtype /Form /BBox [${bbox}] /Matrix [${matrix}] /Resources << /XObject << /${childName} ${child} 0 R >> >>`,Buffer.from(body,'ascii')));
 }
 const kids=[];
 for(let index=0;index<pages;index++){
  const drawing=depth===1?'q 280 0 0 100 80 60 cm /Fm1 Do Q':depth===2?'q 1 0 0 1 10 0 cm /Fm1 Do Q':depth>2?'q 100 0 0 60 10 10 cm /Fm1 Do Q':noise?'q 1000 0 0 1000 0 0 cm /Im1 Do Q':'q 320 0 0 120 40 50 cm /Im1 Do Q';
  const content=add(stream('',Buffer.from(index===0?`BT /F1 18 Tf 20 180 Td (${marker.replace(/[()\\]/g,'')}) Tj ET\n${unicode?'BT /F2 48 Tf 20 80 Td <0102> Tj ET':''}`:drawing,'ascii')));
  kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${noise?1000:400} ${noise?1000:220}] /Resources << /Font << /F1 ${font} 0 R /F2 ${unicodeFont} 0 R >> /XObject << /Im1 ${image} 0 R ${form?`/Fm1 ${form} 0 R`:''} >> >> /Contents ${content} 0 R >>`));
 }
 objects[0]=Buffer.from('<< /Type /Catalog /Pages 2 0 R /OpenAction << /S /JavaScript /JS (app.alert("must-not-run")) >> /PageLabels << /Nums [0 << /S /r >>] >> >>');
 objects[1]=Buffer.from(`<< /Type /Pages /Count ${pages} /Kids [${kids.map(id=>id+' 0 R').join(' ')}] >>`);
 const parts=[Buffer.from('%PDF-1.7\n')],offsets=[0];let offset=parts[0].length;
 for(let i=0;i<objects.length;i++){offsets.push(offset);const item=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`),objects[i],Buffer.from('\nendobj\n')]);parts.push(item);offset+=item.length;}
 parts.push(Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(value=>String(value).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`));return Buffer.concat(parts);
}
