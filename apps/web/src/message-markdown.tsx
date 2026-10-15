import * as React from 'react';
import {marked,type Token} from 'marked';

type TokenRecord=Record<string,unknown>;
const record=(token:Token)=>token as unknown as TokenRecord;
const value=(source:unknown)=>typeof source==='string'?source:'';

function safeHref(value:string):string|null {
    const href=value.trim();
    if(!href||/[\u0000-\u0020\u007f\\]/.test(href)||/%5c/i.test(href))return null;
    if(href.startsWith('#')||href.startsWith('/')&&!href.startsWith('//'))return href;
    try{
        const url=new URL(href);
        return ['http:','https:','mailto:'].includes(url.protocol)?href:null;
    }catch{return null;}
}

function tokens(value:unknown):Token[] {return Array.isArray(value)?value as Token[]:[];}
function inlineChildren(value:unknown):React.ReactNode[] {return tokens(value).map((token,index)=>renderInline(token,index));}

function renderInline(token:Token,key:number):React.ReactNode {
    const t=record(token),type=value(t.type),children=inlineChildren(t.tokens),text=value(t.text)||value(t.raw);
    switch(type){
        case 'text':case 'escape':return text;
        case 'strong':return <strong key={key}>{children}</strong>;
        case 'em':return <em key={key}>{children}</em>;
        case 'del':return <del key={key}>{children}</del>;
        case 'codespan':return <code key={key}>{text}</code>;
        case 'br':return <br key={key}/>;
        case 'link':{
            const href=safeHref(value(t.href)),body=children.length?children:text;
            return href?<a key={key} href={href} title={value(t.title)}>{body}</a>:<span key={key}>{body}</span>;
        }
        case 'image':return <span key={key} className="message-image-alt">图片：{value(t.text)||'未命名'}（未自动加载）</span>;
        case 'html':return <span key={key} className="message-raw-html">{value(t.raw)||value(t.text)}</span>;
        default:return text;
    }
}

function renderBlocks(list:Token[],prefix='b'):React.ReactNode[] {
    return list.map((token,index)=>{
        const t=record(token),type=value(t.type),key=`${prefix}-${index}`,children=tokens(t.tokens);
        switch(type){
            case 'space':case 'def':return null;
            case 'paragraph':return <p key={key}>{inlineChildren(children)}</p>;
            case 'text':return <p key={key}>{children.length?inlineChildren(children):value(t.text)||value(t.raw)}</p>;
            case 'heading':{
                const depth=Math.min(6,Math.max(1,Number(t.depth)||1)) as 1|2|3|4|5|6;
                const Tag=`h${depth}` as 'h1'|'h2'|'h3'|'h4'|'h5'|'h6';
                return <Tag key={key}>{inlineChildren(children)}</Tag>;
            }
            case 'code':{
                const language=value(t.lang).split(/[\s,]/,1)[0];
                const className=/^[\w+-]{1,32}$/.test(language)?`language-${language}`:undefined;
                return <pre key={key}><code className={className}>{value(t.text)}</code></pre>;
            }
            case 'list':{
                const items=Array.isArray(t.items)?t.items as TokenRecord[]:[];
                const content=items.map((item,itemIndex)=><li key={`${key}-${itemIndex}`}>{renderBlocks(tokens(item.tokens),`${key}-${itemIndex}`)}</li>);
                return t.ordered?<ol key={key} start={typeof t.start==='number'&&t.start!==1?t.start:undefined}>{content}</ol>:<ul key={key}>{content}</ul>;
            }
            case 'blockquote':return <blockquote key={key}>{renderBlocks(children,key)}</blockquote>;
            case 'hr':return <hr key={key}/>;
            case 'table':{
                const cells=(row:unknown[],tag:'th'|'td',rowKey:string)=><tr key={rowKey}>{row.map((cell,index)=>{
                    const item=cell as TokenRecord,align=item.align,style:React.CSSProperties|undefined=align==='left'||align==='center'||align==='right'?{textAlign:align}:undefined;
                    const Cell=tag;
                    return <Cell key={`${rowKey}-${index}`} style={style}>{inlineChildren(tokens(item.tokens))}</Cell>;
                })}</tr>;
                const header=Array.isArray(t.header)?t.header:[],rows=Array.isArray(t.rows)?t.rows as unknown[][]:[];
                return <div key={key} className="message-table-scroll" role="region" aria-label="Markdown 表格" tabIndex={0}><table><thead>{cells(header,'th',`${key}-head`)}</thead><tbody>{rows.map((row,index)=>cells(row,'td',`${key}-${index}`))}</tbody></table></div>;
            }
            case 'html':return <pre key={key} className="message-raw-html">{value(t.raw)||value(t.text)}</pre>;
            default:return value(t.text)||value(t.raw)||'';
        }
    });
}

export function MessageMarkdown({content}:{content:string}) {
    if(!content)return null;
    let parsed:Token[];
    try{parsed=marked.lexer(content);}catch{return <div className="message-markdown">{content}</div>;}
    return <div className="message-markdown">{renderBlocks(parsed)}</div>;
}
