import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {deflateSync} from 'node:zlib';
import {pdfFixture} from './pdf-fixture.mjs';
import {USER,approve} from './research.mjs';
import {parserProfile} from '../../dist/packages/documents/parse-service.js';
import {DOCUMENT_PARSER_PROFILE} from '../../dist/packages/documents/parse-types.js';
import {digest} from '../../dist/packages/storage/store.js';
function png(index){const chunk=(name,data)=>{const type=Buffer.from(name),crc=Buffer.alloc(4),size=Buffer.alloc(4);let value=0xffffffff;for(const byte of Buffer.concat([type,data])){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}crc.writeUInt32BE((value^0xffffffff)>>>0);size.writeUInt32BE(data.length);return Buffer.concat([size,type,data,crc]);};const header=Buffer.alloc(13);header.writeUInt32BE(1,0);header.writeUInt32BE(1,4);header[8]=8;header[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from([0,index*40,0,180,255]))),chunk('IEND',Buffer.alloc(0))]);}
/** Synthetic parser outputs only: original literal PDF fixture, no Docker/parser/model/network execution. */
export function documentImageFixture(app,pid,{pages=3,beforeParse}={}){
 let document=app.documents.import(USER,pid,{title:'OFFLINE visual fixture.pdf',mediaType:'application/pdf',contentBase64:pdfFixture({pages}).toString('base64')},crypto.randomUUID());if(beforeParse)document=beforeParse(document);
 const imageId='sha256:'+'a'.repeat(64);if(!app.store.maybe('document-parser-settings','global'))app.store.create('document-parser-settings',null,{...parserProfile(process.cwd()),dockerContext:'default',imageDigest:imageId,imageId},'global');
 const prepared=app.documentParsing.prepare(USER,pid,{documentVersionId:document.id});approve(app,prepared.approvalId);let job=app.store.get('document-parse-job',prepared.id);job=app.store.update('document-parse-job',job.id,job.version,{imageId});const root=app.store.paths.physical(job.outputDir),images=[];
 const fixed=Array.from({length:pages},(_,i)=>{const pageNumber=i+1,text='SYNTHETIC PARSER TEXT '+pageNumber,bytes=Buffer.from(text),image=png(pageNumber),prefix='page-'+String(pageNumber).padStart(4,'0');images.push(image);writeFileSync(join(root,prefix+'.txt'),bytes);writeFileSync(join(root,prefix+'.png'),image);return {pageNumber,pageLabel:null,width:400,height:200,imageWidth:1,imageHeight:1,textFile:prefix+'.txt',textDigest:digest(bytes),textBytes:bytes.length,imageFile:prefix+'.png',imageDigest:digest(image),imageBytes:image.length,paragraphs:[{index:1,start:0,end:text.length}],textStatus:'text-extracted',imageCandidates:[]};});
 writeFileSync(join(root,'manifest.json'),JSON.stringify({formatVersion:2,profileId:DOCUMENT_PARSER_PROFILE,rawDigest:document.original.digest,pageCount:pages,quality:{readingOrder:'unverified',paragraphs:'heuristic',tables:'unknown',figures:'unknown',ocr:false,score:null},pages:fixed}));job=app.documentParsing.finalize(job.id,{state:'succeeded',exitCode:0});return {document,job,result:app.documentParsing.result(USER,pid,job.resultId),images};
}
