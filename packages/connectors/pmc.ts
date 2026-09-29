import {ensure} from '../domain/errors.js';
import {parseRestrictedXml,xmlChildren,xmlNodes,xmlText,type RestrictedXmlNode} from './pubmed.js';

function only<T>(items:T[],label:string):T {ensure(items.length===1,'PROVIDER_SCHEMA_INVALID',`PMC EFetch ${label} 必须唯一`,502);return items[0]!;}
function rootElement(root:RestrictedXmlNode,name:string){const element=root.children.filter((item):item is RestrictedXmlNode=>typeof item!=='string');return only(element.filter(item=>item.name===name),name);}
function id(meta:RestrictedXmlNode,type:string){return xmlText(only(xmlChildren(meta,'article-id').filter(n=>n.attrs['pub-id-type']===type),`${type} 标识`));}

export function parsePubmedPmcid(xml:string,requestedPmid:string):string {
 ensure(/^[1-9]\d{0,11}$/.test(requestedPmid),'INVALID_INPUT','oa-full-text 需要有效 PMID',400);
 const root=parseRestrictedXml(xml),articleSet=rootElement(root,'PubmedArticleSet'),articles=xmlChildren(articleSet,'PubmedArticle'),article=only(articles,'PubMed 目标文章');
 ensure(articles.length===1&&xmlChildren(articleSet,'PubmedBookArticle').length===0,'PROVIDER_SCHEMA_INVALID','PubMed EFetch 必须只返回一篇目标文章',502);
 const citation=only(xmlChildren(article,'MedlineCitation'),'MedlineCitation');ensure(xmlText(only(xmlChildren(citation,'PMID'),'PMID'))===requestedPmid,'PROVIDER_IDENTITY_MISMATCH','PubMed EFetch PMID 与请求不符',502);
 const pubmedData=only(xmlChildren(article,'PubmedData'),'PubmedData'),articleIds=only(xmlChildren(pubmedData,'ArticleIdList'),'ArticleIdList'),pmcids=xmlChildren(articleIds,'ArticleId').filter(n=>n.attrs.IdType?.toLowerCase()==='pmc').map(xmlText);
 const pmcid=only(pmcids,'PMCID');ensure(/^PMC[1-9]\d*$/.test(pmcid),'PROVIDER_SCHEMA_INVALID','PubMed EFetch PMCID 无效',502);return pmcid;
}

export interface PmcFullText {pmid:string;pmcid:string;reportedVersion:string;title:string;license:string;content:string;}
export function parsePmcFullText(xml:string,requestedPmid:string,requestedPmcid:string):PmcFullText {
 const root=parseRestrictedXml(xml),container=only(root.children.filter((item):item is RestrictedXmlNode=>typeof item!=='string'),'根元素'),articles=container.name==='article'?[container]:container.name==='pmc-articleset'?xmlChildren(container,'article'):(()=>{ensure(false,'PROVIDER_SCHEMA_INVALID','PMC EFetch 根元素无效',502);return [];})(),article=only(articles,'目标文章');
 ensure(articles.length===1,'PROVIDER_SCHEMA_INVALID','PMC EFetch 必须只返回一篇文章',502);
 const front=only(xmlChildren(article,'front'),'front'),meta=only(xmlChildren(front,'article-meta'),'article-meta');
 const pmid=id(meta,'pmid'),pmcid=id(meta,'pmcid'),reportedVersion=id(meta,'pmcid-ver');
 ensure(pmid===requestedPmid&&pmcid===requestedPmcid,'PROVIDER_IDENTITY_MISMATCH','PMC 全文 PMID 或 PMCID 与请求不符',502);
 ensure(/^PMC[1-9]\d*\.([1-9]\d*)$/.test(reportedVersion)&&reportedVersion.startsWith(`${pmcid}.`),'PROVIDER_SCHEMA_INVALID','PMC 全文版本标识无效',502);
 const oa=xmlNodes(meta,'custom-meta').filter(n=>xmlText(only(xmlNodes(n,'meta-name'),'pmc-prop-open-access 名称'))==='pmc-prop-open-access');
 const marker=only(oa,'pmc-prop-open-access'),oaValue=xmlText(only(xmlNodes(marker,'meta-value'),'pmc-prop-open-access 值'));
 ensure(oaValue==='yes','FULL_TEXT_NOT_OPEN_ACCESS','PMC 未标记为开放获取',409);
 const license=xmlText(only(xmlNodes(meta,'license'),'许可声明'));ensure(license.length>0&&license.length<=2000,'PROVIDER_SCHEMA_INVALID','PMC 全文缺少有效许可声明',502);
 const title=xmlText(only(xmlNodes(meta,'article-title'),'题名'));ensure(title.length>0&&title.length<=2000,'PROVIDER_SCHEMA_INVALID','PMC 全文缺少有效题名',502);
 const body=only(xmlNodes(article,'body'),'body'),blocks:string[]=[];
 const collect=(node:RestrictedXmlNode)=>{for(const child of node.children)if(typeof child!=='string'){if(['title','label','p','caption'].includes(child.name)){const text=xmlText(child);if(text)blocks.push(text);}else collect(child);}};
 collect(body);const content=blocks.join('\n\n')||xmlText(body);ensure(content.length>0,'PROVIDER_SCHEMA_INVALID','PMC 全文正文为空',502);
 return {pmid,pmcid,reportedVersion,title,license,content};
}
