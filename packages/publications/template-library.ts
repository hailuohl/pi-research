import type {ResearchApp} from '../research-app.js';
import type {Actor,Session,Row} from '../domain/types.js';
import type {BibliographyMode,PublicationEngine} from './build-types.js';
import {MANUSCRIPT_TEMPLATES,type PublicationTemplate,type PublicationTemplateContent} from './templates.js';
import {manuscriptPath,manuscriptBytes} from './build-service.js';
import {decodeSkillArchive} from '../skills/archive.js';
import {prepareArtifactBlob,readArtifactBlob,type ArtifactBlob} from '../storage/artifact-blob.js';
import {digest} from '../storage/store.js';
import {ensure} from '../domain/errors.js';
import {object,text,oneOf} from '../contracts/validation.js';
import {scope,userOnly,interactiveCoordinator} from '../policy/permissions.js';
import {assertProjectWritable} from '../policy/lifecycle.js';
export const TEMPLATE_ZIP_BYTES=17*1024*1024;
interface TemplateRecord {title:string;engine:PublicationEngine;mainFile:string;bibliography:BibliographyMode;contentDigest:string;files:Array<ArtifactBlob&{path:string;mediaType:string}>;}
const identity=(t:Omit<TemplateRecord,'contentDigest'>)=>({engine:t.engine,mainFile:t.mainFile,bibliography:t.bibliography,files:t.files.map(({path,digest,size,mediaType})=>({path,digest,size,mediaType}))});
function base64(value:unknown,max:number){ensure(typeof value==='string'&&value.length<=Math.ceil(max/3)*4&&value.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(value),'PUBLICATION_INVALID','无效或超限 base64');const bytes=Buffer.from(value,'base64');ensure(bytes.length<=max&&bytes.toString('base64')===value,'PUBLICATION_INVALID','非规范 base64');return bytes;}
export class PublicationTemplateLibrary {
 constructor(private app:ResearchApp){}
 private access(actor:Actor,pid?:string){if(actor.type==='user'){userOnly(actor);if(pid)scope(actor,pid);return;}ensure(pid&&actor.type==='agent'&&actor.sessionId&&actor.generation!==undefined,'PERMISSION_DENIED','需要交互主协调会话',403);scope(actor,pid);assertProjectWritable(this.app.store,pid);interactiveCoordinator(actor,pid,this.app.store.get<Session>('session',actor.sessionId,pid));}
 private summary(row:Row<TemplateRecord>):PublicationTemplate {ensure(row.projectId===null&&row.contentDigest===digest(identity(row)),'PUBLICATION_TEMPLATE_CORRUPTED','模板记录改变',409);return {id:row.id,title:row.title,engine:row.engine,mainFile:row.mainFile,bibliography:row.bibliography,contentDigest:row.contentDigest,builtin:false,files:row.files.map(({path,digest,size,mediaType})=>({path,digest,size,mediaType}))};}
 list(actor:Actor,pid?:string):PublicationTemplate[]{this.access(actor,pid);const builtins=MANUSCRIPT_TEMPLATES.map(t=>{const files=t.files.map(f=>({...f,digest:digest(f.content),size:Buffer.byteLength(f.content),mediaType:'text/plain'}));return {...t,files,builtin:true,contentDigest:digest({engine:t.engine,mainFile:t.mainFile,bibliography:t.bibliography,files:files.map(({path,digest,size,mediaType})=>({path,digest,size,mediaType}))})};});return [...builtins,...this.app.store.list<TemplateRecord>('publication-template').map(r=>this.summary(r))];}
 inspect(actor:Actor,id:string,pid?:string):PublicationTemplate {this.access(actor,pid);text(id,'templateId',100);const builtin=this.list(actor,pid).find(t=>t.builtin&&t.id===id);return builtin??this.summary(this.app.store.get<TemplateRecord>('publication-template',id));}
 read(actor:Actor,id:string,path:string,pid?:string):PublicationTemplateContent {const t=this.inspect(actor,id,pid),name=manuscriptPath(path),file=t.files.find(f=>f.path===name);ensure(file,'NOT_FOUND','模板文件不存在',404);const bytes=t.builtin?Buffer.from(file.content!):readArtifactBlob(this.app.store,this.app.store.get<TemplateRecord>('publication-template',id).files.find(f=>f.path===name)!,8*1024*1024);return {...file,contentBase64:bytes.toString('base64'),...(file.mediaType.startsWith('text/')?{content:new TextDecoder('utf-8',{fatal:true}).decode(bytes)}:{})};}
 import(actor:Actor,value:unknown,key:string,validate:()=>void=()=>{},pid?:string):PublicationTemplate {
  this.access(actor,pid);text(key,'Idempotency-Key',200);validate();const request={inputDigest:digest(value)},operationScope=actor.type==='agent'?`publication-template-import:agent:${actor.sessionId}`:'publication-template-import:user';
  const prior=this.app.store.operationResult<PublicationTemplate>(operationScope,key,request);if(prior.found)return this.inspect(actor,prior.value.id,pid);
  const x=object(value);ensure(['title','engine','mainFile','bibliography'].every(k=>k in x)&&Object.keys(x).every(k=>['title','engine','mainFile','bibliography','files','zipBase64'].includes(k)),'PUBLICATION_INVALID','模板字段不符');
  const title=text(x.title,'title',200),engine=oneOf(x.engine,['pdflatex','xelatex','lualatex'],'engine') as PublicationEngine,bibliography=oneOf(x.bibliography,['auto','none','bibtex','biber'],'bibliography') as BibliographyMode,mainFile=manuscriptPath(x.mainFile);
  ensure(mainFile.endsWith('.tex')&&(x.files!==undefined)!==(x.zipBase64!==undefined),'PUBLICATION_INVALID','须提供一种文件来源及 .tex 主文件');
  const raw=x.zipBase64!==undefined?decodeSkillArchive(base64(x.zipBase64,TEMPLATE_ZIP_BYTES),{zipBytes:TEMPLATE_ZIP_BYTES,totalBytes:16*1024*1024,fileBytes:8*1024*1024,nameBytes:240,errorCode:'PUBLICATION_ARCHIVE_INVALID'}):(()=>{ensure(Array.isArray(x.files)&&x.files.length>=1&&x.files.length<=64,'PUBLICATION_FILE_LIMIT','模板须含1至64个文件');return x.files.map(f=>{const v=object(f);ensure(Object.keys(v).length===2&&'path'in v&&'contentBase64'in v,'PUBLICATION_INVALID','模板仅接受内联文件');return {path:manuscriptPath(v.path),bytes:base64(v.contentBase64,8*1024*1024)};});})();
  let total=0;const seen:string[]=[];
  const files=raw.map(f=>{const path=manuscriptPath(f.path),fold=path.toLowerCase();ensure(!seen.some(s=>s===fold||s.startsWith(fold+'/')||fold.startsWith(s+'/')),'PUBLICATION_PATH_CONFLICT','模板文件路径冲突');seen.push(fold);total+=f.bytes.length;ensure(total<=16*1024*1024,'PUBLICATION_FILE_LIMIT','模板总量超过16 MiB');const mediaType=manuscriptBytes(path,f.bytes);return {path,mediaType,...prepareArtifactBlob(this.app.store,f.bytes)};}).sort((a,b)=>a.path.localeCompare(b.path));
  ensure(files.some(f=>f.path===mainFile),'PUBLICATION_INVALID','主文件不在模板中');const fields={title,engine,mainFile,bibliography,files},contentDigest=digest(identity(fields));
  return this.app.store.transaction(()=>{validate();this.access(actor,pid);return this.app.store.operation(operationScope,key,request,()=>{const row=this.app.store.create<TemplateRecord>('publication-template',null,{...fields,contentDigest});this.app.store.event(null,'publication.template_imported',{templateId:row.id,contentDigest});return this.summary(row);});});
 }
}
