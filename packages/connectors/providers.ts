/** OpenResearch client.rs wire protocols ported to independent TypeScript providers (MIT).
 * No OpenResearch account/compute endpoint, ORX process, or provider URL supplied by the model.
 */
import {ensure,DomainError} from '../domain/errors.js';
import {object} from '../contracts/validation.js';
import {normalizeDate,reconstructAbstract,rank,routePaperId,type Hit,type SourceId,type SearchInput,type PaperContent,inWindow} from './contracts.js';
import {parsePubmed} from './pubmed.js';
import type {Credentials} from './transport.js';
export type Request=(url:URL,headers?:Record<string,string>)=>Promise<{text:string;bytes:number;contentType:string}>;
/** Exact official routes only; never follow a provider-supplied publisher URL. */
export function pdfTarget(source:SourceId,rawId:string,requestedVersion:string|undefined,credentials:Credentials) {
 const {id}=routePaperId(rawId,source);
 const version=requestedVersion?.replace(/^v/,'');
 ensure(version===undefined||/^[1-9]\d{0,5}$/.test(version),'INVALID_INPUT','版本必须是正整数',400);
 if(source==='alphaxiv') {
  const embedded=id.match(/v([1-9]\d*)$/)?.[1];
  ensure(!embedded||!version||embedded===version,'PAPER_VERSION_MISMATCH','论文地址与指定版本不一致',400);
  const v=version??embedded;ensure(v,'PAPER_VERSION_REQUIRED','获取原始 arXiv PDF 需要明确 vN 版本',400);
  const resolvedId=id.replace(/v[1-9]\d*$/,'')+'v'+v;
  return {url:new URL(`https://arxiv.org/pdf/${resolvedId}`),resolvedId,requestedVersion:v,versionAssurance:'requested-address-unverified'};
 }
 if(source==='biorxiv') {
  ensure(version,'PAPER_VERSION_REQUIRED','获取原始 bioRxiv PDF 需要明确版本',400);
  return {url:new URL(`https://www.biorxiv.org/content/${id}v${version}.full.pdf`),resolvedId:id,requestedVersion:version,versionAssurance:'requested-address-unverified'};
 }
 if(source==='openalex') {
  ensure(credentials.openalexKey,'CONNECTOR_CREDENTIAL_REQUIRED','OpenAlex 原始内容下载需要用户配置 OpenAlex API key',409);
  ensure(/^W\d+$/.test(id),'PAPER_ID_REQUIRED','OpenAlex 原始内容需要明确 W ID',400);
  ensure(!version,'PAPER_VERSION_UNSUPPORTED','OpenAlex 内容地址不能核实指定出版版本',400);
  const url=new URL(`https://content.openalex.org/works/${id}.pdf`);url.searchParams.set('api_key',credentials.openalexKey);
  return {url,resolvedId:id,requestedVersion:null,versionAssurance:'provider-record'};
 }
 throw new DomainError('FULL_TEXT_UNAVAILABLE','此来源没有已核实的原始 PDF 获取路径；摘要不代替全文',409);
}
const str=(v:unknown)=>typeof v==='string'?v:'';
function json(raw:string):any{try{return JSON.parse(raw);}catch{throw new DomainError('PROVIDER_SCHEMA_INVALID','来源没有返回有效 JSON',502);}}
function oaHit(raw:unknown,source:'openalex'|'biorxiv'):Hit{const x=object(raw);const doi=str(x.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').toLowerCase();const id=doi||str(x.id).replace(/^https:\/\/openalex.org\//,'');routePaperId(id,source);ensure(str(x.title),'PROVIDER_SCHEMA_INVALID','文献记录缺少题名',502);return {source,id,title:str(x.title),abstract:reconstructAbstract(x.abstract_inverted_index),publicationDate:normalizeDate(x.publication_date),...(doi?{doi}:{}),url:doi?`https://doi.org/${encodeURI(doi)}`:`https://openalex.org/${id}`,citations:typeof x.cited_by_count==='number'?x.cited_by_count:undefined,contentKind:'metadata',fullTextRead:false};}
function crHit(x:any):Hit{ensure(typeof x?.DOI==='string'&&Array.isArray(x.title)&&x.title.length>0,'PROVIDER_SCHEMA_INVALID','Crossref 缺少 DOI 或题名',502);const {id}=routePaperId(x.DOI,'crossref');const parts=x.published?.['date-parts']?.[0];const d=Array.isArray(parts)?parts.map((v:number,i:number)=>i===0?String(v):String(v).padStart(2,'0')).join('-'):null;return {source:'crossref',id,doi:id,title:String(x.title[0]),abstract:'',publicationDate:normalizeDate(d),url:`https://doi.org/${encodeURI(id)}`,citations:typeof x['is-referenced-by-count']==='number'?x['is-referenced-by-count']:undefined,contentKind:'metadata',fullTextRead:false};}
function oaAuth(c:Credentials):Record<string,string>{return c.openalexKey?{Authorization:`Bearer ${c.openalexKey}`}:{ };}
function ncbiParams(url:URL,c:Credentials){url.searchParams.set('db','pubmed');url.searchParams.set('tool','PiResearch');if(c.email)url.searchParams.set('email',c.email);if(c.ncbiKey)url.searchParams.set('api_key',c.ncbiKey);}
export async function searchProvider(source:SourceId,q:SearchInput,request:Request,credentials:Credentials):Promise<Hit[]> {
 const pool=q.prioritize==='default'?q.limit:Math.min(100,Math.max(50,q.limit*4));
 if(source==='alphaxiv'){
  const url=new URL(`https://api.alphaxiv.org/search/v2/paper/discover/${q.strategy}`);url.searchParams.set('q',q.query);url.searchParams.set('prioritize',q.prioritize);if(q.publishedAfter)url.searchParams.set('publishedAfter',q.publishedAfter);if(q.publishedBefore)url.searchParams.set('publishedBefore',q.publishedBefore);
  const data=json((await request(url)).text);ensure(Array.isArray(data),'PROVIDER_SCHEMA_INVALID','alphaXiv 检索响应必须为数组',502);
  return data.map((x:any):Hit=>{const p=routePaperId(x.paperId,'alphaxiv');ensure(str(x.title),'PROVIDER_SCHEMA_INVALID','alphaXiv 缺少题名',502);return {...p,title:x.title,abstract:str(x.abstract),publicationDate:normalizeDate(x.publicationDate),votes:typeof x.votes==='number'?x.votes:undefined,url:`https://www.alphaxiv.org/abs/${p.id}`,snippets:Array.isArray(x.snippets)?x.snippets.slice(0,8).map((s:any)=>({text:str(s.snippet).slice(0,4000),reportedPage:Number.isSafeInteger(s.pageNumber)&&s.pageNumber>0?s.pageNumber:null})):[],contentKind:'metadata',fullTextRead:false};}).filter((h:Hit)=>inWindow(h.publicationDate,q)).slice(0,q.limit);
 }
 if(source==='openalex'||source==='biorxiv'){
  const url=new URL('https://api.openalex.org/works');url.searchParams.set('search',q.query);url.searchParams.set('per_page',String(pool));url.searchParams.set('select','id,doi,title,publication_date,cited_by_count,abstract_inverted_index');const filters:string[]=[];
  if(source==='biorxiv')filters.push('primary_location.source.id:S4306402567');if(q.publishedAfter)filters.push(`from_publication_date:${q.publishedAfter}`);if(q.publishedBefore)filters.push(`to_publication_date:${q.publishedBefore}`);if(filters.length)url.searchParams.set('filter',filters.join(','));
  const data=json((await request(url,oaAuth(credentials))).text);ensure(Array.isArray(data.results),'PROVIDER_SCHEMA_INVALID','OpenAlex 缺少 results',502);return rank(data.results.map((x:unknown)=>oaHit(x,source)),q);
 }
 if(source==='pubmed'){
  const url=new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');ncbiParams(url,credentials);url.searchParams.set('term',q.query);url.searchParams.set('retmode','json');url.searchParams.set('retmax',String(pool));url.searchParams.set('sort','relevance');
  if(q.publishedAfter||q.publishedBefore){url.searchParams.set('datetype','pdat');url.searchParams.set('mindate',(q.publishedAfter??'1000-01-01').replaceAll('-','/'));url.searchParams.set('maxdate',(q.publishedBefore??'3000-12-31').replaceAll('-','/'));}
  const data=json((await request(url)).text);ensure(data.esearchresult&&Array.isArray(data.esearchresult.idlist)&&!data.esearchresult.ERROR,'PROVIDER_SCHEMA_INVALID','PubMed 搜索响应无效',502);const ids:string[]=data.esearchresult.idlist.slice(0,pool);ids.forEach(id=>routePaperId(id,'pubmed'));if(!ids.length)return [];
  const fetchUrl=new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi');ncbiParams(fetchUrl,credentials);fetchUrl.searchParams.set('id',ids.join(','));fetchUrl.searchParams.set('retmode','xml');const papers=parsePubmed((await request(fetchUrl)).text);const by=new Map(papers.map(p=>[p.id,p]));ensure(ids.every(id=>by.has(id)),'PROVIDER_SCHEMA_INVALID','PubMed EFetch 缺失已选记录，不能声称完整检索',502);return rank(ids.map(id=>by.get(id)!),q);
 }
 const url=new URL('https://api.crossref.org/works');url.searchParams.set('query',q.query);url.searchParams.set('rows',String(pool));url.searchParams.set('select','DOI,title,published,is-referenced-by-count');const filters=[];if(q.publishedAfter)filters.push(`from-pub-date:${q.publishedAfter}`);if(q.publishedBefore)filters.push(`until-pub-date:${q.publishedBefore}`);if(filters.length)url.searchParams.set('filter',filters.join(','));const data=json((await request(url)).text);ensure(Array.isArray(data.message?.items),'PROVIDER_SCHEMA_INVALID','Crossref 缺少 items',502);return rank(data.message.items.map(crHit),q);
}
export async function readProvider(source:SourceId,id:string,request:Request,credentials:Credentials):Promise<PaperContent>{
 const common={source,id,requestedId:id,pageMapping:'unavailable' as const};
 if(source==='alphaxiv') {const url=new URL(`https://www.alphaxiv.org/abs/${id}.md`),r=await request(url);ensure(!/text\/html/i.test(r.contentType)&&!/^\s*(?:<!doctype\s+html|<html)/i.test(r.text)&&r.text.trim().length>0,'FULL_TEXT_UNAVAILABLE','没有取得原文 Markdown；不使用生成报告或 HTML 代替',502);return {...common,title:id,content:r.text,contentKind:'full_text',sourceUrl:url.href,versionAssurance:'requested-address-unverified'};}
 if(source==='openalex') {const url=new URL(`https://api.openalex.org/works/${id.startsWith('10.')?`doi:${encodeURIComponent(id)}`:id}`);const x=json((await request(url,oaAuth(credentials))).text),h=oaHit(x,'openalex');const actualId=str(x.id).replace(/^https:\/\/openalex.org\//,'');ensure(id.startsWith('10.')?h.doi===id:actualId===id,'PAPER_ID_MISMATCH','来源返回的论文与请求不一致',502);return {...common,title:h.title,content:h.abstract||JSON.stringify(x,null,2),contentKind:h.abstract?'abstract':'metadata',sourceUrl:url.href,versionAssurance:'provider-record',...(/^W\d+$/.test(actualId)?{resolvedId:actualId}:{}),...(typeof x.best_oa_location?.license==='string'?{license:x.best_oa_location.license}:{})};}
 if(source==='biorxiv'){const url=new URL(`https://api.biorxiv.org/details/biorxiv/${id}/na/json`);const data=json((await request(url)).text);ensure(Array.isArray(data.collection),'PROVIDER_SCHEMA_INVALID','bioRxiv 缺少 collection',502);const candidates=data.collection.filter((x:any)=>str(x.doi).toLowerCase()===id);ensure(candidates.length,'PAPER_NOT_FOUND','bioRxiv 未返回该 DOI',404);ensure(candidates.every((x:any)=>/^[1-9]\d{0,5}$/.test(String(x.version))),'PROVIDER_SCHEMA_INVALID','bioRxiv 版本字段无效',502);const x=candidates.sort((a:any,b:any)=>Number(b.version)-Number(a.version))[0];return {...common,title:str(x.title)||id,content:str(x.abstract)||JSON.stringify(x,null,2),contentKind:x.abstract?'abstract':'metadata',sourceUrl:url.href,versionAssurance:'provider-record',reportedVersion:String(x.version),resolvedId:id,...(typeof x.license==='string'?{license:x.license}:{})};}
 if(source==='pubmed'){const url=new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi');ncbiParams(url,credentials);url.searchParams.set('id',id);url.searchParams.set('retmode','xml');const x=parsePubmed((await request(url)).text).find(x=>x.id===id);ensure(x,'PAPER_NOT_FOUND','PubMed 未返回该 PMID',404);return {...common,title:x.title,content:x.abstract||JSON.stringify(x,null,2),contentKind:x.abstract?'abstract':'metadata',sourceUrl:`https://pubmed.ncbi.nlm.nih.gov/${id}/`,versionAssurance:'provider-record'};}
 const url=new URL(`https://api.crossref.org/works/${encodeURIComponent(id)}`);const data=json((await request(url)).text);const h=crHit(data.message);ensure(h.id===id,'PAPER_ID_MISMATCH','Crossref 返回的 DOI 不一致',502);return {...common,title:h.title,content:JSON.stringify(data.message,null,2),contentKind:'metadata',sourceUrl:`https://doi.org/${encodeURI(id)}`,versionAssurance:'provider-record'};
}
