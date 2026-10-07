import * as React from 'react';
import {api,downloadArtifact} from './api.js';
import type {SessionHistoryPage,SessionMessageContent} from './models.js';
import {date} from './models.js';
import {Badge,Icon} from './ui.js';
import type {QueueMessage} from './message-queue.js';
import type {Perform} from './workbench.js';
import {MessageMarkdown} from './message-markdown.js';

type Anchor={direction:'before'|'after';id:string}|null;
type MessagePhase='commentary'|'final_answer';
type ConversationMessage=QueueMessage&{generation?:number;phase?:MessagePhase;toolCalls?:string[]};
interface Props {projectId:string;sessionId:string;messages:QueueMessage[];history:SessionHistoryPage|null;historyAnchor:Anchor;onNavigate:(anchor:Anchor)=>void;perform:Perform;activeGeneration?:number;}
interface State {messageId:string;page:SessionMessageContent|null;busy:boolean;error:string;}
interface ActivityTool {tool:string;status:'running'|'completed'|'failed';}
export interface ConversationActivityProps {content:string;active:boolean;activity?:ActivityTool|null;truncated?:boolean;}
const READ_LIMIT=16000;
const conversationMessage=(message:QueueMessage)=>message as ConversationMessage;
const exceptional=(message:QueueMessage)=>message.status==='failed'||message.status==='cancelled'||!!message.error;
const hasMaterial=(message:ConversationMessage)=>!!message.content.trim()||!!message.attachments?.length||!!message.previewTruncated||!!message.contentTruncated||!!message.toolCalls?.length;
const generationOf=(message:QueueMessage)=>conversationMessage(message).generation;
const toolLabel=(name:string)=>{
    const key=name.trim().toLowerCase();
    if(key.startsWith('mcp__'))return '外部工具';
    if(/^(project_inspect|project_list|projects?_(inspect|list))/.test(key))return '项目查看';
    if(/^workspace_(list|find|glob|tree|inspect)/.test(key))return '浏览项目文件';
    if(/^workspace_(read|open|get)/.test(key))return '读取文件';
    if(/^workspace_(write|edit|apply)/.test(key))return '修改文件';
    if(/^(research_brief|brief_)/.test(key))return '研究计划';
    if(/^(run_|experiment_)/.test(key))return '实验操作';
    if(/^(publication_|manuscript_)/.test(key))return '论文操作';
    if(/^(literature_|paper_search)/.test(key))return '文献查询';
    if(/^(document_|artifact_)/.test(key))return '文档操作';
    if(/^(read|read_file|readfile|cat)$/.test(key))return '读取文件';
    if(/^(write|write_file|edit|apply_patch|patch)$/.test(key))return '修改文件';
    if(/^(bash|exec|exec_command|shell|terminal)$/.test(key))return '运行命令';
    if(/^(grep|rg|search|search_files)$/.test(key))return '搜索内容';
    if(/^(find|glob|ls|list|list_files)$/.test(key))return '浏览文件';
    if(/^(web|web_search|browser|tavily|search_web)/.test(key))return '查询网页';
    return /^[a-z][a-z\d_.-]{0,47}$/i.test(name.trim())?name.trim():'工具调用';
};
const toolSummary=(message:ConversationMessage)=>[...new Set((message.toolCalls??[]).map(toolLabel))].join('、');
const systemSummary=(message:QueueMessage)=>{
    const line=message.content.replace(/\s+/g,' ').trim();
    if(!line)return message.attachments?.length?'通知包含附件':'通知详情';
    const chars=Array.from(line),sentenceEnd=chars.findIndex(char=>'。.!?！？'.includes(char));
    const end=sentenceEnd<0?chars.length:sentenceEnd+1;
    const excerpt=chars.slice(0,Math.min(end,80)).join('');
    return excerpt+(chars.length>excerpt.length?'…':'');
};

export function ConversationActivity({content,active,activity,truncated}:ConversationActivityProps){
    if(!active)return null;
    const message=activity?`${activity.status==='running'?'正在调用':activity.status==='failed'?'调用失败':'工具已返回'} ${toolLabel(activity.tool)}`:'正在思考…';
    return <article className="message message-assistant conversation-activity" aria-label="Pi · 正在处理" aria-live="polite"><div className="message-avatar" aria-hidden="true">π</div><div className="message-body"><div className="message-meta"><strong>Pi · 正在处理</strong></div><p className="activity-line">{message}</p>{content?<MessageMarkdown content={content}/>:null}{truncated?<p className="small muted">当前输出仅保留尾部，较早部分已省略。</p>:null}</div></article>;
}

export class SessionHistory extends React.Component<Props,State> {
    state:State={messageId:'',page:null,busy:false,error:''};
    private generation=0;
    componentDidUpdate(previous:Props){if(previous.projectId!==this.props.projectId||previous.sessionId!==this.props.sessionId||this.state.messageId&&previous.messages.find(message=>message.id===this.state.messageId)?.version!==this.props.messages.find(message=>message.id===this.state.messageId)?.version)this.close();}
    componentWillUnmount(){this.generation++;}
    close=()=>{this.generation++;this.setState({messageId:'',page:null,busy:false,error:''});};
    async read(messageId:string,cursor=0,expectedVersion?:number){
        const generation=++this.generation,projectId=this.props.projectId,sessionId=this.props.sessionId;
        this.setState({messageId,page:null,busy:true,error:''});
        try{
            const page=await api<SessionMessageContent>('/operations/session_message_read',{projectId,input:{sessionId,messageId,cursor,limit:READ_LIMIT,...(expectedVersion===undefined?{}:{expectedVersion})}});
            if(page.sessionId!==sessionId||page.messageId!==messageId||page.cursorUnit!=='utf8-byte'||expectedVersion!==undefined&&page.version!==expectedVersion||
                ![page.version,page.cursor,page.end,page.total].every(Number.isSafeInteger)||page.version<1||page.cursor<Math.max(0,cursor-3)||page.cursor>cursor||page.end<page.cursor||page.end>page.total||page.end>page.cursor+READ_LIMIT||page.end<=cursor&&!page.complete||page.complete!==(page.end===page.total)||new TextEncoder().encode(page.content).byteLength!==page.end-page.cursor)
                throw Error('消息原文响应与请求不一致，请刷新历史页后重试');
            if(generation===this.generation&&projectId===this.props.projectId&&sessionId===this.props.sessionId)this.setState({page,busy:false});
        }catch(error){if(generation===this.generation)this.setState({busy:false,error:error instanceof Error?error.message:String(error)});}
    }
    render(){
        const {sessionId,messages,history,historyAnchor,onNavigate,perform}=this.props,{messageId,page,busy,error}=this.state;
        const transcript=messages.filter(message=>!(message.role==='user'&&message.status==='queued'&&message.origin!=='automation'));
        const active=messages.find(message=>message.id===messageId);
        const controls=historyAnchor||history&&!history.atLatest?<div className="history-controls"><button type="button" onClick={()=>onNavigate(null)}>返回最新</button></div>:null;
        const content=(message:QueueMessage)=><>{active?.id===message.id?<div className="message-reader"><div className="history-controls"><strong>消息原文</strong><button type="button" onClick={this.close}>关闭原文</button></div>{busy?<p className="small muted">正在读取…</p>:null}{error?<p role="alert" className="error-text">{error}</p>:null}{page?<><pre className="prose-text message-window">{page.content}</pre><div className="history-controls"><span>{page.cursor+1}–{page.end} / {page.total} 字节</span><button type="button" disabled={busy||page.cursor===0} onClick={()=>void this.read(message.id,Math.max(0,page.cursor-READ_LIMIT),page.version)}>上一段</button><button type="button" disabled={busy||page.complete} onClick={()=>void this.read(message.id,page.end,page.version)}>下一段</button></div>{page.sourceTruncated?<p className="small muted">数据库中的消息正文已截断；这里只能读取已保存的部分，原生会话记录可能仍保留全文。</p>:null}</>:null}</div>:<><MessageMarkdown content={message.content}/>{message.previewTruncated?<><p className="small muted">预览 {message.contentBytes} 字节中的前段。<button type="button" className="text-button message-read-button" onClick={()=>void this.read(message.id,0,message.version)}>分段查看原文</button></p></>:null}{message.contentTruncated?<p className="small muted">数据库中的消息正文已截断；这里只能读取已保存的部分，原生会话记录可能仍保留全文。</p>:null}</>}</>;
        const card=(message:QueueMessage)=>{
            const current=conversationMessage(message),summary=toolSummary(current);
            const author=message.role==='user'?'你':message.role==='assistant'?(message.wakeupId?'Pi · 结果分析':'Pi'):(message.wakeupId?'持久化结果通知':'工作台状态通知');
            return <article className={'message message-'+message.role} key={message.id} aria-label={author} data-notification={message.wakeupId?'wakeup':undefined} data-history-anchor-id={message.id}><div className="message-avatar" aria-hidden="true">{message.role==='user'?'我':message.role==='assistant'?'π':'·'}</div><div className="message-body"><div className="message-meta"><strong>{author}</strong><time dateTime={message.createdAt} title={message.createdAt}>{date(message.createdAt)}</time>{message.queueRemoved?<span className="badge s-cancelled">已移出队列</span>:message.status&&message.status!=='completed'?<Badge value={message.status}/>:null}</div>{message.queueRemoved?<details className="removed-message-content"><summary>查看已移出队列的原消息</summary>{content(message)}</details>:content(message)}{summary?<p className="message-tool-summary">涉及工具：{summary}</p>:null}{message.attachments?.length?<div className="message-attachments" aria-label="消息附件">{message.attachments.map(attachment=><div className="message-attachment" key={attachment.documentVersionId}><Icon name="evidence" size={15}/><span title={attachment.title}>{attachment.title}</span><small>{attachment.mediaType==='application/pdf'?(attachment.parseResultId?'固定解析 · 视觉读取须另批':'PDF 原件 · 需显式解析'):'文本原件'}</small><button type="button" className="text-button" aria-label={`下载附件原件 ${attachment.title}`} onClick={()=>perform(()=>downloadArtifact(attachment.artifactId,attachment.title))}>下载原件</button></div>)}</div>:null}
                {message.error?<p className="error-text">{message.error}</p>:null}<div className="message-tools"><button className="message-branch-button" onClick={()=>perform(()=>api(`/sessions/${sessionId}/branch`,{messageId:message.id}),'已创建对话分支；实验记录保持不变')}>从此处分支</button>{!message.queueRemoved&&message.role==='user'&&['failed','cancelled'].includes(message.status)?<button onClick={()=>perform(()=>api(`/sessions/${sessionId}/retry`,{messageId:message.id}))}>重试此消息</button>:null}</div></div></article>;
        };
        const assistantGroup=(group:QueueMessage[])=>{
            const tagged=group.some(message=>{const current=conversationMessage(message);return current.generation!==undefined||current.phase!==undefined||current.toolCalls!==undefined;});
            const rows:React.ReactNode[]=[],details:QueueMessage[]=[];
            const flush=()=>{if(details.length){const held=details.splice(0),generation=conversationMessage(held[0]).generation,current=this.props.activeGeneration!==undefined&&generation===this.props.activeGeneration;rows.push(<details className="workflow-history" key={`work-${held[0].id}`} data-history-anchor-id={held[0].id}><summary>{current?'当前工作详情':'工作详情'} · {held.length} 条过程消息</summary>{held.map(card)}</details>);}};
            if(tagged){
                for(const message of group){
                    const current=conversationMessage(message);
                    const unconfirmed=message.status!==undefined&&message.status!=='completed';
                    if(current.phase==='commentary'&&!exceptional(message)&&!unconfirmed&&hasMaterial(current)){details.push(message);continue;}
                    flush();if(exceptional(message)||unconfirmed||hasMaterial(current))rows.push(card(message));
                }
            }else{
                const answer=[...group].reverse().find(message=>!exceptional(message)&&['completed',undefined].includes(message.status)&&!!message.content.trim());
                for(const message of group){
                    const current=conversationMessage(message),stable=['completed',undefined].includes(message.status);
                    if(exceptional(message)||!stable){flush();if(exceptional(message)||!stable||hasMaterial(current))rows.push(card(message));continue;}
                    if(message.id===answer?.id){flush();rows.push(card(message));continue;}
                    if(message.content.trim()){details.push(message);continue;}
                    flush();if(hasMaterial(current))rows.push(card(message));
                }
            }
            flush();return rows;
        };
        const rendered:React.ReactNode[]=[];
        for(let index=0;index<transcript.length;){
            const message=transcript[index];
            if(message.role==='assistant'){
                const group=[message],generation=generationOf(message);let next=index+1;
                while(next<transcript.length&&transcript[next].role==='assistant'&&generationOf(transcript[next])===generation){group.push(transcript[next]);next++;}
                rendered.push(...assistantGroup(group));index=next;continue;
            }
            if(message.role==='system'&&!exceptional(message))rendered.push(<details className="notification-history" key={message.id} data-history-anchor-id={message.id}><summary><span>状态通知</span><span>{systemSummary(message)}</span></summary>{card(message)}</details>);
            else rendered.push(card(message));
            index++;
        }
        return <>{rendered}{controls}</>;
    }
}
