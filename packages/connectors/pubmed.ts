/** Restricted XML reader for PubMed EFetch. No DTD/entity expansion or external resources. */
import {ensure} from '../domain/errors.js';
import type {Hit} from './contracts.js';
import {normalizeDate} from './contracts.js';
interface Node {name:string;attrs:Record<string,string>;children:(Node|string)[];}
function decode(s:string):string {ensure(!/&(?!(?:amp|lt|gt|quot|apos|#x[0-9a-f]+|#[0-9]+);)/i.test(s),'PROVIDER_XML_INVALID','XML 实体未正确转义',502);return s.replace(/&([^;\s]+);/g,(_,a:string)=>{if(a==='amp')return '&';if(a==='lt')return '<';if(a==='gt')return '>';if(a==='quot')return '"';if(a==='apos')return "'";const n=/^#x[\da-f]+$/i.test(a)?parseInt(a.slice(2),16):/^#\d+$/.test(a)?+a.slice(1):NaN;ensure(Number.isSafeInteger(n)&&n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff),'PROVIDER_XML_INVALID','XML 含未知实体',502);return String.fromCodePoint(n);});}
function parse(xml:string):Node {
 ensure(xml.length<=2*1024*1024&&!/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(xml),'PROVIDER_XML_INVALID','拒绝 XML 实体或内部 DTD',502);
 const input=xml.replace(/<!DOCTYPE\s+[^>]*>/gi,'').replace(/<!--[^]*?-->/g,'').replace(/<\?[^]*?\?>/g,'');const root:Node={name:'#root',attrs:{},children:[]},stack=[root];let count=0;
 const re=/<!\[CDATA\[([\s\S]*?)\]\]>|<([^>]+)>|([^<]+)/g;let end=0,m:RegExpExecArray|null;
 while((m=re.exec(input))){ensure(m.index===end,'PROVIDER_XML_INVALID','XML 标签不完整',502);end=re.lastIndex;ensure(++count<=100000&&stack.length<100,'PROVIDER_XML_INVALID','XML 结构超过限制',502);
  if(m[1]!==undefined){stack.at(-1)!.children.push(m[1]);continue;}if(m[3]!==undefined){stack.at(-1)!.children.push(decode(m[3]));continue;}
  const tag=m[2].trim();if(tag.startsWith('/')){ensure(stack.length>1&&stack.at(-1)!.name===tag.slice(1).trim(),'PROVIDER_XML_INVALID','XML 标签不匹配',502);stack.pop();continue;}
  const name=/^([\w:.-]+)/.exec(tag)?.[1];ensure(name&&!tag.startsWith('!'),'PROVIDER_XML_INVALID','XML 标签无效',502);const attrs:Record<string,string>={};const rest=tag.slice(name.length).replace(/\/$/,'');let consumed=0;const ar=/\s+([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;let a:RegExpExecArray|null;while((a=ar.exec(rest))){ensure(rest.slice(consumed,a.index).trim()==='','PROVIDER_XML_INVALID','XML 属性无效',502);ensure(!Object.hasOwn(attrs,a[1]),'PROVIDER_XML_INVALID','XML 属性重复',502);attrs[a[1]]=decode(a[2]??a[3]);consumed=ar.lastIndex;}ensure(rest.slice(consumed).trim()==='','PROVIDER_XML_INVALID','XML 属性未闭合',502);
  const node:Node={name,attrs,children:[]};stack.at(-1)!.children.push(node);if(!tag.endsWith('/'))stack.push(node);
 }
 ensure(end===input.length&&stack.length===1,'PROVIDER_XML_INVALID','XML 文档未闭合',502);return root;
}
function nodes(n:Node,name:string):Node[]{return n.children.flatMap(c=>typeof c==='string'?[]:[...(c.name===name?[c]:[]),...nodes(c,name)]);}
function txt(n?:Node):string{return n?n.children.map(c=>typeof c==='string'?c:txt(c)).join('').replace(/\s+/g,' ').trim():'';}
function first(n:Node,name:string){return nodes(n,name)[0];}
function dateText(n?:Node):string|null{if(!n)return null;let year=txt(first(n,'Year'));if(!year)year=txt(first(n,'MedlineDate')).slice(0,4);if(!/^\d{4}$/.test(year))return null;const raw=txt(first(n,'Month')),num=Number(raw)||['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(raw.toLowerCase().slice(0,3))+1;if(!num)return year;const month=String(num).padStart(2,'0'),d=txt(first(n,'Day'));return normalizeDate(d?`${year}-${month}-${d.padStart(2,'0')}`:`${year}-${month}`);}
export function parsePubmed(xml:string):Hit[]{const root=parse(xml);ensure(root.children.filter(c=>typeof c!=='string').length===1&&root.children.every(c=>typeof c!=='string'||!c.trim())&&root.children.some(c=>typeof c!=='string'&&c.name==='PubmedArticleSet')&&nodes(root,'PubmedArticleSet').length===1,'PROVIDER_XML_INVALID','缺少 PubmedArticleSet',502);return [...nodes(root,'PubmedArticle'),...nodes(root,'PubmedBookArticle')].map(n=>{const id=txt(first(n,'PMID'));ensure(/^\d{1,12}$/.test(id),'PROVIDER_SCHEMA_INVALID','PubMed PMID 无效',502);const title=txt(first(n,'ArticleTitle'))||txt(first(n,'BookTitle'));ensure(title,'PROVIDER_SCHEMA_INVALID','PubMed 缺少题名',502);const doi=nodes(n,'ArticleId').find(v=>v.attrs.IdType==='doi');return {source:'pubmed',id,title,abstract:nodes(n,'AbstractText').map(v=>`${v.attrs.Label?`${v.attrs.Label}: `:''}${txt(v)}`).join('\n'),publicationDate:dateText(first(n,'ArticleDate'))??dateText(first(n,'PubDate')),url:`https://pubmed.ncbi.nlm.nih.gov/${id}/`,...(doi?{doi:txt(doi).toLowerCase()}:{}),contentKind:'metadata',fullTextRead:false};});}
