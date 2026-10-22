import type {MessageAttachment} from './models.js';

export interface ComposerDraft {
 draft:string;draftVersion:number;attachments:MessageAttachment[];
 pending?:{key:string;mode:'prompt'|'follow_up';draft:string;draftVersion:number;attachmentIds:string[]};
}
// shortcut: drafts stay in this browser tab, use server drafts if cross-device recovery is needed.
const drafts=new Map<string,ComposerDraft>();
const key=(projectId:string,sessionId:string)=>'pi-research-composer-v1:'+JSON.stringify([projectId,sessionId]);
const empty=():ComposerDraft=>({draft:'',draftVersion:0,attachments:[]});
const text=(value:unknown,max:number):value is string=>typeof value==='string'&&value.length<=max;
function attachment(value:unknown):MessageAttachment|null {
 if(!value||typeof value!=='object')return null;
 const a=value as Record<string,unknown>;
 if(!text(a.documentVersionId,200)||!a.documentVersionId||!text(a.artifactId,200)||!a.artifactId||typeof a.digest!=='string'||!/^[a-f0-9]{64}$/.test(a.digest)||!text(a.title,2000)||!text(a.mediaType,200)||!Number.isSafeInteger(a.size)||Number(a.size)<0||Number(a.size)>32*1024*1024)return null;
 if(a.inputMode!==undefined&&a.inputMode!=='native'||a.parseResultId!==undefined&&!text(a.parseResultId,200)||a.resultDigest!==undefined&&(typeof a.resultDigest!=='string'||!/^[a-f0-9]{64}$/.test(a.resultDigest))||a.pageCount!==undefined&&(!Number.isSafeInteger(a.pageCount)||Number(a.pageCount)<1))return null;
 return {documentVersionId:a.documentVersionId,artifactId:a.artifactId,digest:a.digest,title:a.title,mediaType:a.mediaType,size:Number(a.size),...(a.inputMode==='native'?{inputMode:'native' as const}:{}),...(typeof a.parseResultId==='string'?{parseResultId:a.parseResultId}:{}),...(typeof a.resultDigest==='string'?{resultDigest:a.resultDigest}:{}),...(typeof a.pageCount==='number'?{pageCount:a.pageCount}:{})};
}
export function readComposerDraft(projectId:string,sessionId:string):ComposerDraft {
 try{if(typeof sessionStorage==='undefined')return empty();}catch{}
 const id=key(projectId,sessionId),cached=drafts.get(id);if(cached)return structuredClone(cached);
 try{
  const saved=JSON.parse(sessionStorage.getItem(id)??'null');
  if(!saved||saved.version!==1||typeof saved.draft!=='string'||!Number.isSafeInteger(saved.draftVersion)||saved.draftVersion<0||!Array.isArray(saved.attachments)||saved.attachments.length>5)return empty();
  const attachments=saved.attachments.map(attachment);if(!attachments.every((a:MessageAttachment|null):a is MessageAttachment=>a!==null))return empty();
  const value:ComposerDraft={draft:saved.draft,draftVersion:saved.draftVersion,attachments};
  const p=saved.pending;
  if(p&&typeof p.key==='string'&&/^[a-f0-9-]{36}$/.test(p.key)&&['prompt','follow_up'].includes(p.mode)&&typeof p.draft==='string'&&Number.isSafeInteger(p.draftVersion)&&p.draftVersion>=0&&Array.isArray(p.attachmentIds)&&p.attachmentIds.length<=5&&p.attachmentIds.every((id:unknown)=>text(id,200)))value.pending={key:p.key,mode:p.mode,draft:p.draft,draftVersion:p.draftVersion,attachmentIds:p.attachmentIds};
  return value;
 }catch{return empty();}
}
export function saveComposerDraft(projectId:string,sessionId:string,value:ComposerDraft):boolean {
 try{if(typeof sessionStorage==='undefined')return false;}catch{}
 const id=key(projectId,sessionId),hasDraft=!!value.draft||value.attachments.length>0;
 drafts.set(id,structuredClone(value));
 try{if(hasDraft)sessionStorage.setItem(id,JSON.stringify({version:1,...value}));else{sessionStorage.removeItem(id);drafts.delete(id);}return true;}catch{return false;}
}
