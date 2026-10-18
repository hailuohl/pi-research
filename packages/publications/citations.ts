import {digest} from '../storage/store.js';
import type {ResearchApp} from '../research-app.js';
import type {Actor,Artifact,Row} from '../domain/types.js';
import {ensure} from '../domain/errors.js';
import {assertDiscoveryArtifact,discoveryScope} from '../policy/discovery-grant-validation.js';
import {routePaperId} from '../connectors/contracts.js';

export const CITATION_CHECKER_VERSION='literal-citations-v2';
export const CITATION_LIMITS={textBytes:1024*1024,depth:16,entries:1000,citations:2000,fields:40,diagnostics:200,reportBytes:1024*1024} as const;
export interface CitationLocation {file:string;line:number;column:number;}
interface Diagnostic {severity:'error'|'incomplete';code:string;message:string;location:CitationLocation;related?:CitationLocation[];}
interface Field {name:string;value:string;literal:boolean;location:CitationLocation;}
interface Entry {key:string;type:string;location:CitationLocation;fields:Field[];}
export interface CitationFile {path:string;content:string;}
export interface CitationMetadata {artifactId:string;paperReadId:string;doi:string;title:unknown;author:unknown;years:number[];}
interface MetadataRead {source:string;contentKind:string;artifactId:string;artifactDigest:string;idInSource:string;requestedId:string;title:string;versionAssurance:string;fullTextRead:boolean;rawArtifactIds:string[];scopeSessionId:string|null;scopeAttemptId:string|null;discoveryGrant?:import('../policy/discovery-grant-types.js').DiscoveryGrantReference;}
export function readCitationMetadata(app:ResearchApp,actor:Actor,pid:string,artifactId:string){
 app.textCorpusGrants.authorizeContent(actor,pid,'artifact_read',{artifactId});
 const a=app.store.get<Artifact>('artifact',artifactId,pid);assertDiscoveryArtifact(app.store,pid,a);const {bytes}=app.evidence.read(actor,artifactId);
 ensure(a.origin==='connector:crossref:metadata'&&bytes.length<=1024*1024&&a.size===bytes.length,'CITATION_METADATA_INVALID','仅支持有界的原始 Crossref 主 metadata 产物');
 const rows=app.store.db.prepare("SELECT data FROM records WHERE kind='paper-read' AND project_id=? AND json_extract(data,'$.artifactId')=? LIMIT 2").all(pid,artifactId);
 ensure(rows.length===1,'CITATION_METADATA_INVALID','元数据必须对应唯一的成功 paper_read 主产物');const p=JSON.parse(String(rows[0].data)) as Row<MetadataRead>;
 ensure(p.source==='crossref'&&p.contentKind==='metadata'&&p.artifactId===a.id&&p.artifactDigest===a.digest&&p.versionAssurance==='provider-record'&&p.fullTextRead===false&&Array.isArray(p.rawArtifactIds)&&!p.rawArtifactIds.includes(a.id),'CITATION_METADATA_INVALID','paper_read 的来源、类型或主产物绑定无效');
 const target=routePaperId(p.idInSource,'crossref'),scope=discoveryScope(`connector-paper:${pid}:${p.scopeSessionId??'user'}:${p.scopeAttemptId??'root'}`,p.discoveryGrant);
 const receipts=app.store.db.prepare("SELECT key FROM operations WHERE scope=? AND json_extract(response,'$.id')=? LIMIT 2").all(scope,p.id);
 ensure(receipts.length===1,'CITATION_METADATA_INVALID','缺少唯一的成功 paper_read 原始回执');const receipt=app.store.operationResult(scope,String(receipts[0].key),target);
 ensure(receipt.found&&digest(receipt.value)===digest(p),'CITATION_METADATA_INVALID','paper_read 记录与原成功回执不符');
 let data:Record<string,unknown>;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{ensure(false,'CITATION_METADATA_INVALID','Crossref metadata 不是有效 UTF-8 JSON');}
 ensure(data!==null&&typeof data==='object'&&!Array.isArray(data)&&typeof data.DOI==='string'&&citationDoi(data.DOI)===target.id&&target.id===p.idInSource&&routePaperId(p.requestedId,'crossref').id===target.id&&Array.isArray(data.title)&&data.title[0]===p.title,'CITATION_METADATA_INVALID','元数据正文 DOI/题名与 paper_read 来源身份不符');
 ensure((data.title as unknown[]).length<=16&&(data.title as unknown[]).every(t=>typeof t==='string'&&t.length<=4000)&&(data.author===undefined||Array.isArray(data.author)&&data.author.length<=200&&data.author.every(a=>a!==null&&typeof a==='object'&&['given','family','name'].every(k=>a[k]===undefined||typeof a[k]==='string'&&a[k].length<=1000))),'CITATION_METADATA_LIMIT','元数据题名/作者结构超过支持范围；未截断后放行');
 const years:number[]=[];for(const key of ['published','published-online','published-print','issued']){const date=data[key] as {'date-parts'?:unknown}|undefined,parts=date?.['date-parts'];if(Array.isArray(parts))for(const part of parts)if(Array.isArray(part)&&Number.isInteger(part[0])&&part[0]>=1000&&part[0]<=9999)years.push(part[0]);}
 return {metadata:{artifactId:a.id,paperReadId:p.id,doi:target.id,title:data.title,author:data.author,years:[...new Set(years)]} satisfies CitationMetadata,binding:{artifactId:a.id,artifactDigest:a.digest,artifactRecordDigest:digest(a),paperReadId:p.id,paperReadDigest:digest(p),source:p.source,contentKind:p.contentKind,idInSource:p.idInSource}};
}
const literal=(s:string)=>!/[\\{}#$]/.test(s);
export function citationDoi(value:string){const s=value.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'').toLowerCase();return /^10\.\d{4,9}\/[^\s\\{}]+$/.test(s)?s:null;}
const metadataPlain=(value:string)=>value.normalize('NFC').toLowerCase().replace(/\s+/gu,' ').trim();
function bibPlain(value:string){const out:string[]=[];let depth=0;for(let i=0;i<value.length;i++){const c=value[i];if(c==='\\'){const escaped=value[++i];if(!escaped||!'&%_#{}$'.includes(escaped))return null;out.push(escaped);}else if(c==='{')depth++;else if(c==='}'){if(--depth<0)return null;}else if('$^~'.includes(c))return null;else out.push(c);}return depth===0?metadataPlain(out.join(''))||null:null;}
const abbreviatedGiven=(value:string)=>value.split(' ').some(word=>/^(?:\p{L}\.)+$/u.test(word)||word.split('-').every(part=>/^(?:\p{Script=Latin}|\p{L}\.)$/u.test(part)));
function splitAuthors(value:string){const names:string[]=[];let depth=0,start=0;for(let i=0;i<value.length;i++){if(value[i]==='\\'){i++;continue;}if(value[i]==='{')depth++;if(value[i]==='}')depth--;if(depth===0&&/\s/.test(value[i])&&(i===0||!/\s/.test(value[i-1]))){const separator=value.slice(i).match(/^\s+and\s+/i);if(separator){names.push(value.slice(start,i));i+=separator[0].length-1;start=i+1;}}}names.push(value.slice(start));return names;}
function group(text:string,start:number,open='{',close='}') {if(text[start]!==open)return null;let depth=1,brace=0;for(let i=start+1;i<text.length;i++){if(text[i]==='\\'){i++;continue;}if(open==='['){if(text[i]==='{')brace++;if(text[i]==='}')brace--;if(brace)continue;}if(text[i]===open)depth++;if(text[i]===close&&!--depth)return {value:text.slice(start+1,i),end:i+1};}return null;}

/** Bounded literal analysis only: no TeX execution, network, macro expansion or manuscript changes. */
export function checkCitations(files:CitationFile[],mainFile:string,metadata:CitationMetadata[]=[]){
 const diagnostics:Diagnostic[]=[],entries:Entry[]=[],citations:Array<{key:string;command:string;location:CitationLocation}>=[],scanned=new Set<string>(),bibliographies=new Set<string>();
 const byPath=new Map(files.map(f=>[f.path,f.content])),lineStarts=new Map<string,number[]>();let truncated=false,incomplete=false,stopped=false,textBytes=0,nociteAll=false;
 const locate=(file:string,offset:number):CitationLocation=>{let starts=lineStarts.get(file);if(!starts){starts=[0];const raw=byPath.get(file)!;for(let i=0;i<raw.length;i++)if(raw[i]==='\n')starts.push(i+1);lineStarts.set(file,starts);}let low=0,high=starts.length;while(low+1<high){const mid=(low+high)>>>1;if(starts[mid]<=offset)low=mid;else high=mid;}return {file,line:low+1,column:offset-starts[low]+1};};
 const add=(severity:Diagnostic['severity'],code:string,message:string,at:CitationLocation,related?:CitationLocation[])=>{if(stopped)return;if(severity==='incomplete')incomplete=true;diagnostics.push({severity,code,message:message.slice(0,600),location:at,...(related?{related:related.slice(0,8)}:{})});if(diagnostics.length>=CITATION_LIMITS.diagnostics){truncated=true;incomplete=true;stopped=true;}};
 const gap=(code:string,message:string,at:CitationLocation)=>add('incomplete',code,message,at);
 const error=(code:string,message:string,at:CitationLocation,related?:CitationLocation[])=>add('error',code,message,at,related);
 const stop=(code:string,message:string,at:CitationLocation)=>{gap(code,message,at);truncated=true;incomplete=true;stopped=true;};
 function masked(file:string,raw:string,verbatim:boolean){const chars=raw.split('');const erase=(a:number,b:number)=>{for(let j=a;j<b;j++)if(chars[j]!=='\n'&&chars[j]!=='\r')chars[j]=' ';};for(let i=0;i<raw.length&&!stopped;i++){
  if(raw[i]==='%'){const end=raw.indexOf('\n',i);erase(i,end<0?raw.length:end);i=(end<0?raw.length:end)-1;continue;}
  if(raw[i]!=='\\')continue;
  if(!verbatim){i++;continue;}
  const verb=raw.slice(i).match(/^\\verb\*?([^A-Za-z\s])/);if(verb){const end=raw.indexOf(verb[1],i+verb[0].length);if(end<0||raw.slice(i,end).includes('\n')){error('MALFORMED_VERBATIM','Unclosed literal verbatim command',locate(file,i));erase(i,raw.length);break;}erase(i,end+1);i=end;continue;}
  const env=raw.slice(i).match(/^\\begin\s*\{(verbatim\*?|lstlisting|minted|comment|filecontents\*?|luacode\*?|pycode)\}/);if(env){const endToken=`\\end{${env[1]}}`,end=raw.indexOf(endToken,i+env[0].length);if(!['verbatim','verbatim*'].includes(env[1]))gap('UNSUPPORTED_ENVIRONMENT',`Code/conditional environment ${env[1]} is not interpreted`,locate(file,i));if(end<0){error('MALFORMED_ENVIRONMENT',`Unclosed ${env[1]}`,locate(file,i));erase(i,raw.length);break;}erase(i,end+endToken.length);i=end+endToken.length-1;continue;}
  const command=raw.slice(i).match(/^\\(?:[A-Za-z]+|.)/);if(command)i+=command[0].length-1;
 }return chars.join('');}
 function load(path:string,at:CitationLocation){if(stopped)return;const raw=byPath.get(path);if(raw===undefined){error('MISSING_FILE',`Literal input is absent from the fixed manuscript: ${path}`,at);incomplete=true;return;}const bytes=Buffer.byteLength(raw);if(textBytes+bytes>CITATION_LIMITS.textBytes){stop('TEXT_LIMIT','Literal text exceeds the checker byte limit; remaining text was not scanned',at);return;}textBytes+=bytes;scanned.add(path);return raw;}
 function target(value:string,ext:string,at:CitationLocation){const p=value.trim().replace(/^\.\//,'');if(!literal(p)||!p||p.startsWith('/')||p.split('/').some(s=>!s||s==='.'||s==='..')||/[:\x00-\x1f]/.test(p)){gap('DYNAMIC_PATH','Only literal paths under the fixed manuscript root are supported',at);return null;}return p.endsWith(ext)?p:p+ext;}
 function bib(path:string,at:CitationLocation){if(stopped||bibliographies.has(path))return;bibliographies.add(path);const raw=load(path,at);if(raw===undefined)return;const t=masked(path,raw,false);let i=0;
  const ws=()=>{while(/\s/.test(t[i]??'')&&i<t.length)i++;};
  while(i<t.length&&!stopped){ws();if(i===t.length)break;const start=i,m=t.slice(i).match(/^@([A-Za-z]+)\s*([\{(])/);if(!m){error('MALFORMED_BIB','Expected a BibTeX entry',locate(path,i));const next=t.indexOf('@',i+1);if(next<0)break;i=next;continue;}i+=m[0].length;const type=m[1].toLowerCase(),close=m[2]==='{'?'}':')';
   if(['comment','preamble','string'].includes(type)){const g=group(t,i-1,m[2],close);if(type!=='comment')gap('UNSUPPORTED_BIB_MACRO',`@${type} is not expanded`,locate(path,start));if(!g){error('MALFORMED_BIB','Unclosed BibTeX directive',locate(path,start));break;}i=g.end;continue;}
   const keyEnd=t.indexOf(',',i);if(keyEnd<0){error('MALFORMED_BIB','Entry key has no following comma',locate(path,start));break;}const key=t.slice(i,keyEnd).trim();
   if(entries.length>=CITATION_LIMITS.entries){stop('ENTRY_LIMIT','Global entry limit reached; remaining input was not scanned',locate(path,start));break;}
   const entry:Entry={key:key.slice(0,200),type,location:locate(path,start),fields:[]};entries.push(entry);if(!/^[A-Za-z0-9][A-Za-z0-9_.:/+\-]{0,199}$/.test(key))error('INVALID_KEY','Unsupported or malformed bibliography key',entry.location);
   if(!['article','book','inproceedings','misc'].includes(type)||close===')')gap('UNSUPPORTED_ENTRY',`Entry syntax/type ${type} is outside the supported subset`,entry.location);i=keyEnd+1;let closed=false;
   while(i<t.length&&!stopped){ws();if(t[i]===close){i++;closed=true;break;}const pos=i;if(entry.fields.length>=CITATION_LIMITS.fields){stop('FIELD_LIMIT','Field count limit reached; remaining input was not scanned',locate(path,i));break;}const name=t.slice(i).match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=\s*/);if(!name){error('MALFORMED_BIB_FIELD','Expected one field assignment after a separator',locate(path,i));break;}i+=name[0].length;let value='',isLiteral=true;
    if(t[i]==='{'){const g=group(t,i);if(!g){error('MALFORMED_BIB','Unclosed braced field',locate(path,i));i=t.length;break;}value=g.value;i=g.end;}
    else if(t[i]==='"'){const begin=++i;let braces=0;for(;i<t.length;i++){if(t[i]==='\\'){i++;continue;}if(t[i]==='{')braces++;if(t[i]==='}')braces--;if(t[i]==='"'&&braces===0)break;}if(i>=t.length){error('MALFORMED_BIB','Unclosed quoted field',locate(path,begin-1));break;}value=t.slice(begin,i++);}
    else {const val=t.slice(i).match(/^[^,}\)\s]+/);value=val?.[0]??'';i+=value.length;if(!/^\d+$/.test(value)){isLiteral=false;gap('UNSUPPORTED_BIB_MACRO','Bare field macros are not expanded',locate(path,pos));}}
    ws();if(t[i]==='#'){isLiteral=false;gap('UNSUPPORTED_CONCATENATION','BibTeX string concatenation is not expanded',locate(path,i));while(i<t.length&&t[i]!==','&&t[i]!==close)i++;}
   const field:Field={name:name[1].toLowerCase(),value:value.slice(0,2000),literal:isLiteral,location:locate(path,pos)};if(value.length>2000){gap('FIELD_LIMIT','Field value was truncated',field.location);truncated=true;}if(/\\(?![&%_#{}$])/.test(value))gap('UNSUPPORTED_BIB_TEX','TeX commands in bibliography fields are not expanded',field.location);
    if(entry.fields.some(f=>f.name===field.name))error('DUPLICATE_FIELD',`Duplicate ${field.name} field`,field.location,entry.fields.filter(f=>f.name===field.name).map(f=>f.location));
    if(['crossref','xdata','entryset'].includes(field.name))gap('UNSUPPORTED_INHERITANCE',`${field.name} inheritance is not resolved`,field.location);
    entry.fields.push(field);
    if(t[i]!==','&&t[i]!==close){error('MALFORMED_BIB_FIELD','Expected a comma or entry closing delimiter',locate(path,i));break;}
    if(t[i]===',')i++;
   }
   if(!closed&&!stopped){error('MALFORMED_BIB','Entry was not completely closed',entry.location);incomplete=true;const next=t.indexOf('@',i);if(next<0)break;i=next;}
  }
 }
 const citeCommands=new Set(['cite','citep','citet','autocite','parencite','textcite','footcite','smartcite','supercite','nocite']);
 const environments=new Set(['document','abstract','thebibliography','figure','figure*','table','table*','tabular','tabular*','tabularx','itemize','enumerate','description','equation','equation*','align','align*','alignat','alignat*','gather','gather*','multline','multline*','split','array','subequations','math','displaymath','center','minipage','flushleft','flushright','quote','quotation','proof','theorem','lemma']);
 function tex(path:string,depth:number,stack:string[],reference:CitationLocation={file:path,line:1,column:1}){if(stopped)return;if(depth>CITATION_LIMITS.depth||stack.includes(path)){gap('INPUT_RECURSION','Input depth limit or literal input cycle',reference);return;}const raw=load(path,reference);if(raw===undefined)return;const t=masked(path,raw,true);const re=/\\([A-Za-z]+|.)/g;let m:RegExpExecArray|null;
  while(!stopped&&(m=re.exec(t))){const command=m[1],pos=m.index,at=locate(path,pos);let i=re.lastIndex;const ws=()=>{while(i<t.length&&/\s/.test(t[i]))i++;};
   if(['newcommand','renewcommand','providecommand','DeclareRobustCommand','def','gdef','edef','xdef','let','futurelet','csname','catcode','includeonly','InputIfFileExists','IfFileExists','directlua','write','openout','read','includecomment','excludecomment','expandafter','noexpand','string','meaning','scantokens','detokenize','lowercase','uppercase','aftergroup','afterassignment','NewDocumentCommand','RenewDocumentCommand','ProvideDocumentCommand','DeclareDocumentCommand','DeclareCiteCommand','DeclareMultiCiteCommand'].includes(command)||command.startsWith('if')||['else','fi'].includes(command))gap('UNSUPPORTED_TEX_EXECUTION',`Macro/conditional command ${command} is not interpreted`,at);
   if(command==='begin'||command==='end'){ws();const g=group(t,i);if(!g){error('MALFORMED_ARGUMENT',`Missing or unclosed environment argument for ${command}`,at);incomplete=true;break;}re.lastIndex=g.end;if(!environments.has(g.value))gap('UNSUPPORTED_ENVIRONMENT',`Environment ${g.value.slice(0,80)} has no checked literal semantics`,at);continue;}
   if(citeCommands.has(command)||['input','include','bibliography','addbibresource','bibitem'].includes(command)){
    const star=t[i]==='*';if(star)i++;ws();const maxOptional=command==='nocite'?0:citeCommands.has(command)?2:['addbibresource','bibitem'].includes(command)?1:0;let unsupported=star&&(!citeCommands.has(command)||command==='nocite'),badArgument=false,optional=0;
    if(unsupported)gap('UNSUPPORTED_MODIFIER',`${command} does not support a star in the checked subset`,at);
    while(t[i]==='['&&!stopped){const g=group(t,i,'[',']');if(!g){error('MALFORMED_ARGUMENT','Unclosed optional argument',at);incomplete=true;badArgument=true;break;}if(++optional>maxOptional){gap('UNSUPPORTED_ARGUMENTS',`${command} supports at most ${maxOptional} optional arguments`,at);badArgument=true;break;}if(!literal(g.value))gap('DYNAMIC_ARGUMENT','Optional argument contains TeX syntax',at);i=g.end;ws();}
    if(badArgument)break;
    let g=group(t,i);if(!g&&command==='input'){const bare=t.slice(i).match(/^[^\s{}]+/);if(bare)g={value:bare[0],end:i+bare[0].length};}
    if(!g){error('MALFORMED_ARGUMENT',`Missing or unclosed literal argument for ${command}`,at);incomplete=true;break;}re.lastIndex=g.end;
    if(unsupported)continue;
    if(!literal(g.value)){gap('DYNAMIC_ARGUMENT',`${command} argument contains macro/dynamic syntax`,at);continue;}
    if(citeCommands.has(command)){for(const key of g.value.split(',').map(s=>s.trim())){if(stopped)break;if(command==='nocite'&&key==='*'){nociteAll=true;continue;}if(!/^[A-Za-z0-9][A-Za-z0-9_.:/+\-]{0,199}$/.test(key)){gap('INVALID_CITATION_KEY','Citation key is outside the literal subset',at);continue;}if(citations.length>=CITATION_LIMITS.citations){stop('CITATION_LIMIT','Global citation limit reached; remaining input was not scanned',at);break;}citations.push({key,command,location:at});}}
    else if(command==='bibitem'){if(entries.length>=CITATION_LIMITS.entries){stop('ENTRY_LIMIT','Global entry limit reached; remaining input was not scanned',at);break;}entries.push({key:g.value,type:'inline',location:at,fields:[]});}
    else for(const name of g.value.split(',')){if(stopped)break;const bibInput=command==='bibliography'||command==='addbibresource',p=target(name,bibInput?'.bib':'.tex',at);if(p){if(bibInput)bib(p,at);else tex(p,depth+1,[...stack,path],at);}}
   }else if(/cite|citation/i.test(command))gap('UNSUPPORTED_CITATION_COMMAND',`Citation command ${command} is not interpreted`,at);
  }
 }
 tex(mainFile,0,[]);
 for(const f of files){if(stopped)break;if(/\.(sty|cls)$/i.test(f.path))gap('UNSUPPORTED_TEX_EXTENSION','Fixed style/class code is not expanded; custom citation semantics are unverified',{file:f.path,line:1,column:1});}
 const entryMap=new Map<string,{identities:Set<string>;locations:CitationLocation[]}>();
 for(const e of entries){if(stopped)break;const identity=digest(e.fields.filter(f=>['doi','title','author','year'].includes(f.name)).map(f=>[f.name,f.name==='doi'?citationDoi(f.value):bibPlain(f.value)]).sort()),prior=entryMap.get(e.key);
  if(prior){error('DUPLICATE_KEY',`Duplicate bibliography key ${e.key}`,e.location,prior.locations);if(prior.identities.size>1||!prior.identities.has(identity))error('KEY_IDENTITY_CONFLICT',`The same key has different bibliographic identity fields: ${e.key}`,e.location,prior.locations);prior.identities.add(identity);if(prior.locations.length<8)prior.locations.push(e.location);}
  else entryMap.set(e.key,{identities:new Set([identity]),locations:[e.location]});
 }
 // An unscanned or unsupported source cannot establish that a key is absent.
 if(!incomplete)for(const c of citations){if(stopped)break;if(!entryMap.has(c.key))error('UNDEFINED_KEY',`No literal bibliography entry for ${c.key}`,c.location);}
 const comparisons:Array<{key:string;location:CitationLocation;artifactId?:string;paperReadId?:string;fields:Array<{field:string;status:'matched'|'conflict'|'incomplete';actual:string|null;expected:string[];location:CitationLocation}>;status:'matched'|'conflict'|'incomplete'}>=[];
 for(const e of entries){if(stopped||!metadata.length)break;const fields:typeof comparisons[number]['fields']=[],get=(name:string)=>{const fs=e.fields.filter(f=>f.name===name);return fs.length===1&&fs[0].literal?fs[0]:undefined;},doi=get('doi'),normalized=doi&&citationDoi(doi.value),candidates=metadata.filter(m=>m.doi===normalized);let meta:CitationMetadata|undefined;
  const compare=(name:string,actual:string|null,expected:string[],at:CitationLocation,ambiguous=false)=>{const status=actual!==null&&expected.length?(expected.includes(actual)?'matched':ambiguous?'incomplete':'conflict'):'incomplete';fields.push({field:name,status,actual,expected,location:at});if(status==='conflict')error('METADATA_CONFLICT',`${e.key}: ${name} differs from supplied Crossref metadata`,at);};
  if(candidates.length===1)meta=candidates[0];else if(candidates.length>1)gap('AMBIGUOUS_METADATA',`${e.key}: more than one supplied record has this DOI`,doi?.location??e.location);
  compare('doi',normalized||null,meta?[meta.doi]:[],doi?.location??e.location);
  if(meta){const title=get('title'),titles=Array.isArray(meta.title)?meta.title.filter((v):v is string=>typeof v==='string').map(metadataPlain).filter(t=>t.length>0):[];compare('title',title?bibPlain(title.value):null,titles,title?.location??e.location);
   const year=get('year');compare('year',year&&/^\d{4}$/.test(year.value.trim())?year.value.trim():null,meta.years.map(String),year?.location??e.location);
   const author=get('author'),authors=Array.isArray(meta.author)?meta.author.filter(a=>a!==null&&typeof a==='object'&&!Array.isArray(a)):[],bibAuthors=author?splitAuthors(author.value):undefined;let authorStatus:'matched'|'conflict'|'incomplete'='incomplete';
   if(bibAuthors&&authors.length&&bibAuthors.length===authors.length){let conflict=false,unknown=false;for(let i=0;i<authors.length;i++){const a=authors[i] as {given?:unknown;family?:unknown;name?:unknown},b=bibAuthors[i],p=bibPlain(b);if(!p){unknown=true;continue;}if(typeof a.name==='string'){const expected=metadataPlain(a.name);if(!expected)unknown=true;else if(p!==expected)conflict=true;continue;}if(typeof a.family!=='string'||!metadataPlain(a.family)){unknown=true;continue;}const parts=b.split(',');if(parts.length===2){const family=bibPlain(parts[0]),given=bibPlain(parts[1]),expectedFamily=metadataPlain(a.family),expectedGiven=typeof a.given==='string'?metadataPlain(a.given):null;if(!family||!expectedFamily)unknown=true;else if(family!==expectedFamily)conflict=true;else if(!given||!expectedGiven||abbreviatedGiven(given)||abbreviatedGiven(expectedGiven))unknown=true;else if(given!==expectedGiven)conflict=true;}else if(typeof a.given==='string'&&metadataPlain(a.given)&&p===metadataPlain(`${a.given} ${a.family}`)){if(abbreviatedGiven(metadataPlain(a.given)))unknown=true;}else unknown=true;}authorStatus=conflict?'conflict':unknown?'incomplete':'matched';}
   else if(bibAuthors&&authors.length)authorStatus='conflict';
   const authorDisplay=authors.map(a=>{const x=a as {given?:string;family?:string;name?:string};return x.name??[x.given,x.family].filter(Boolean).join(' ');}).filter(name=>metadataPlain(name).length>0);if(authorDisplay.join('; ').length>4000){gap('AUTHOR_DISPLAY_LIMIT','Author comparison details exceed the display limit',author?.location??e.location);truncated=true;}fields.push({field:'author',status:authorStatus,actual:author&&bibPlain(author.value)!==null?author.value:null,expected:authorDisplay.join('; ').length>4000?[authorDisplay.join('; ').slice(0,4000)]:authorDisplay,location:author?.location??e.location});if(authorStatus==='conflict')error('METADATA_CONFLICT',`${e.key}: author differs from supplied Crossref metadata`,author?.location??e.location);
  }
  comparisons.push({key:e.key,location:e.location,...(meta?{artifactId:meta.artifactId,paperReadId:meta.paperReadId}:{}),fields,status:fields.some(f=>f.status==='conflict')?'conflict':fields.some(f=>f.status==='incomplete')?'incomplete':'matched'});
 }
 const structureErrors=diagnostics.some(d=>d.severity==='error'&&d.code!=='METADATA_CONFLICT'),literalStructure={status:structureErrors?'failed':incomplete?'incomplete':'passed',coverage:incomplete?'incomplete':'complete',scope:'literal citations and bibliography keys only; no macro expansion or compilation'};
 return {checkerVersion:CITATION_CHECKER_VERSION,reportKind:'historical_snapshot',scientificClaimSupport:'not_assessed',limitations:['Content digests provide byte integrity, not host attestation or current source authorization.','This report does not verify scientific claims, study identity, missing originals, versions, or unprovided metadata.','No macro expansion, bibliography inheritance, dynamic paths, compilation, fetching or manuscript edits.'],literalStructure,identityComparison:{status:!metadata.length?'not_compared':comparisons.some(c=>c.status==='conflict')?'conflicts':incomplete||comparisons.some(c=>c.status==='incomplete')||!comparisons.length?'incomplete':'matched',comparedFields:[...new Set(comparisons.flatMap(c=>c.fields.filter(f=>f.actual!==null&&f.expected.length).map(f=>f.field)))],note:!metadata.length?'No metadata was supplied for comparison.':'Only supplied archived primary Crossref metadata was compared; DOI/report identity does not establish study identity.',entries:comparisons},filesScanned:[...scanned],nociteAll,citations,entries,diagnostics,truncated,limits:CITATION_LIMITS};
}

export function serializeCitationReport(report:ReturnType<typeof checkCitations>&{binding:unknown}){
 let content=JSON.stringify(report,null,2);
 if(Buffer.byteLength(content)>CITATION_LIMITS.reportBytes){report.truncated=true;report.literalStructure.coverage='incomplete';if(report.literalStructure.status==='passed')report.literalStructure.status='incomplete';if(report.identityComparison.status==='matched')report.identityComparison.status='incomplete';report.diagnostics.splice(CITATION_LIMITS.diagnostics-1);report.diagnostics.push({severity:'incomplete',code:'REPORT_LIMIT',message:'Detailed output was truncated to the declared report byte limit; no complete pass is asserted',location:{file:report.filesScanned[0]??'',line:1,column:1}});do{const lists=[report.entries,report.citations,report.identityComparison.entries];const longest=lists.reduce((a,b)=>a.length>b.length?a:b);longest.splice(Math.max(0,Math.floor(longest.length*0.8)));content=JSON.stringify(report,null,2);}while(Buffer.byteLength(content)>CITATION_LIMITS.reportBytes&&[report.entries,report.citations,report.identityComparison.entries].some(a=>a.length));}
 return content;
}
