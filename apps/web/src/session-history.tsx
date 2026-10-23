import * as React from 'react';
import {api,ApiError,downloadArtifact} from './api.js';
import type {Row,Session,SessionHistoryPage,SessionMessageContent} from './models.js';
import {date,short} from './models.js';
import {Badge,Icon} from './ui.js';
import type {QueueMessage} from './message-queue.js';
import type {Perform} from './workbench.js';
import {MessageMarkdown} from './message-markdown.js';
import {StreamingText} from './streaming-text.js';

type Anchor={direction:'before'|'after';id:string}|null;
type MessagePhase='commentary'|'final_answer';
type ConversationMessage=QueueMessage&{generation?:number;phase?:MessagePhase;toolCalls?:string[];nativeRequestId?:string;branchSource?:{sessionId:string;messageId:string}};
interface Props {projectId:string;sessionId:string;messages:QueueMessage[];history:SessionHistoryPage|null;historyAnchor:Anchor;onNavigate:(anchor:Anchor)=>void;perform:Perform;activeGeneration?:number;readOnly?:boolean;sessionArchived?:boolean;busy?:boolean;onBranch?:(session:Row<Session>)=>void;}
interface State {messageId:string;page:SessionMessageContent|null;busy:boolean;error:string;}
interface ActivityTool {tool:string;status:'running'|'completed'|'failed';}
export interface ConversationActivityProps {content:string;active:boolean;activity?:ActivityTool|null;truncated?:boolean;onBeforeReveal?:()=> (()=>void)|undefined;}
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

export function ConversationActivity({content,active,activity,truncated,onBeforeReveal}:ConversationActivityProps){
    if(!active)return null;
    const message=activity?`${activity.status==='running'?'正在调用':activity.status==='failed'?'调用失败':'工具已返回'} ${toolLabel(activity.tool)}`:'正在思考…';
    return <article className="message message-assistant conversation-activity" aria-label="Pi · 正在处理" aria-live="polite"><div className="message-avatar" aria-hidden="true">π</div><div className="message-body"><div className="message-meta"><strong>Pi · 正在处理</strong></div><p className="activity-line">{message}</p><StreamingText content={content} onBeforeReveal={onBeforeReveal}/>{truncated?<p className="small muted">当前输出仅保留尾部，较早部分已省略。</p>:null}</div></article>;
}

export class SessionHistory extends React.Component<Props,State> {
    state:State={messageId:'',page:null,busy:false,error:''};
    private generation=0;
    private mounted=true;
    private actionEpoch=0;
    private actionPending=false;
    private pendingActions=new Map<string,string>();
    componentDidUpdate(previous:Props){if(previous.projectId!==this.props.projectId||previous.sessionId!==this.props.sessionId){this.actionEpoch++;this.pendingActions.clear();this.close();}else if(this.state.messageId&&previous.messages.find(message=>message.id===this.state.messageId)?.version!==this.props.messages.find(message=>message.id===this.state.messageId)?.version)this.close();}
    componentWillUnmount(){this.mounted=false;this.generation++;this.actionEpoch++;}
    close=()=>{this.generation++;this.setState({messageId:'',page:null,busy:false,error:''});};
    private changeMessage=async(action:'branch'|'retry',messageId:string)=>{
        const {projectId,sessionId}=this.props,epoch=this.actionEpoch;
        if(!this.mounted||this.props.readOnly||action==='retry'&&this.props.sessionArchived||this.props.busy||this.actionPending||!projectId||!sessionId)return;
        const current=()=>this.mounted&&epoch===this.actionEpoch&&projectId===this.props.projectId&&sessionId===this.props.sessionId;
        const target=action+':'+messageId,key=this.pendingActions.get(target)??crypto.randomUUID();this.pendingActions.set(target,key);this.actionPending=true;
        try{
            return await this.props.perform(async()=>{
                if(!current()||this.props.readOnly||action==='retry'&&this.props.sessionArchived)return;
                try{
                    const confirmed=await api<Row<Session>>(`/sessions/${encodeURIComponent(sessionId)}/${action}`,{messageId},'POST',undefined,key);
                    if(!current())return;
                    if(action==='branch'){
                        if(confirmed.projectId!==projectId||confirmed.parentSessionId!==sessionId||typeof confirmed.id!=='string'||!confirmed.id||confirmed.id===sessionId||!Number.isSafeInteger(confirmed.version)||confirmed.version<1||typeof confirmed.title!=='string'||!confirmed.model||typeof confirmed.model.provider!=='string'||typeof confirmed.model.model!=='string'||typeof confirmed.model.thinking!=='string')throw Error('分支回执与当前会话不一致，请刷新后重试');
                        if(!this.props.readOnly)this.props.onBranch?.(confirmed);
                    }
                    this.pendingActions.delete(target);return confirmed;
                }catch(error){if(error instanceof ApiError&&error.status<500)this.pendingActions.delete(target);if(current())throw error;}
            });
        }finally{this.actionPending=false;}
    };
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
        const transcript=messages;
        const active=messages.find(message=>message.id===messageId);
        const controls=historyAnchor||history&&!history.atLatest?<div className="history-controls"><button type="button" onClick={()=>onNavigate(null)}>返回最新</button></div>:null;
        const content=(message:QueueMessage)=><>{active?.id===message.id?<div className="message-reader"><div className="history-controls"><strong>消息原文</strong><button type="button" onClick={this.close}>关闭原文</button></div>{busy?<p className="small muted">正在读取…</p>:null}{error?<p role="alert" className="error-text">{error}</p>:null}{page?<><pre className="prose-text message-window">{page.content}</pre><div className="history-controls"><span>{page.cursor+1}–{page.end} / {page.total} 字节</span><button type="button" disabled={busy||page.cursor===0} onClick={()=>void this.read(message.id,Math.max(0,page.cursor-READ_LIMIT),page.version)}>上一段</button><button type="button" disabled={busy||page.complete} onClick={()=>void this.read(message.id,page.end,page.version)}>下一段</button></div>{page.sourceTruncated?<p className="small muted">数据库中的消息正文已截断；这里只能读取已保存的部分，原生会话记录可能仍保留全文。</p>:null}</>:null}</div>:<><MessageMarkdown content={message.content}/>{message.previewTruncated?<><p className="small muted">预览 {message.contentBytes} 字节中的前段。<button type="button" className="text-button message-read-button" onClick={()=>void this.read(message.id,0,message.version)}>分段查看原文</button></p></>:null}{message.contentTruncated?<p className="small muted">数据库中的消息正文已截断；这里只能读取已保存的部分，原生会话记录可能仍保留全文。</p>:null}</>}</>;
        const card=(message:QueueMessage)=>{
            const current=conversationMessage(message),summary=toolSummary(current);
            const author=message.role==='user'?'你':message.role==='assistant'?(message.wakeupId?'Pi · 结果分析':'Pi'):(message.wakeupId?'持久化结果通知':'工作台状态通知');
            return <article className={'message message-'+message.role} key={message.id} aria-label={author} data-notification={message.wakeupId?'wakeup':undefined} data-history-anchor-id={message.id}><div className="message-avatar" aria-hidden="true">{message.role==='user'?'我':message.role==='assistant'?'π':'·'}</div><div className="message-body"><div className="message-meta"><strong>{author}</strong>{current.nativeRequestId?<span className="badge" title={'原生请求 '+current.nativeRequestId}>原生请求 · {short(current.nativeRequestId)}</span>:null}{current.branchSource?<span className="badge" title={'原会话 '+current.branchSource.sessionId+' · 原消息 '+current.branchSource.messageId}>分支来源 · {short(current.branchSource.sessionId)} / {short(current.branchSource.messageId)}</span>:null}<time dateTime={message.createdAt} title={message.createdAt}>{date(message.createdAt)}</time>{message.queueRemoved?<span className="badge s-cancelled">已移出队列</span>:message.role==='user'&&message.status==='queued'&&message.origin!=='automation'&&message.wakeupId==null?<span className="badge s-queued">{message.mode==='prompt'?'已发送':'已提交 · 等待处理'}</span>:message.status&&message.status!=='completed'?<Badge value={message.status}/>:null}</div>{message.queueRemoved?<details className="removed-message-content"><summary>查看已移出队列的原消息</summary>{content(message)}</details>:content(message)}{summary?<p className="message-tool-summary">涉及工具：{summary}</p>:null}{message.attachments?.length?<div className="message-attachments" aria-label="消息附件">{message.attachments.map(attachment=><div className="message-attachment" key={attachment.documentVersionId}><Icon name="evidence" size={15}/><span title={attachment.title}>{attachment.title}</span><small>{attachment.inputMode==='native'?(message.nativeAttachmentsDisabled?'保留原件引用 · 未自动外发':'整文件附件'):attachment.mediaType==='application/pdf'?(attachment.parseResultId?'固定解析 · 视觉读取须另批':'PDF 原件 · 需显式解析'):'文本原件'}</small><button type="button" className="text-button" aria-label={`下载附件原件 ${attachment.title}`} onClick={()=>perform(()=>downloadArtifact(attachment.artifactId,attachment.title))}>下载原件</button></div>)}</div>:null}
                {message.error?<p className="error-text">{message.error}</p>:null}<div className="message-tools"><button className="message-branch-button" disabled={!!this.props.readOnly||!!this.props.busy} onClick={()=>this.changeMessage('branch',message.id)}>从此处分支</button>{!message.queueRemoved&&message.role==='user'&&['failed','cancelled'].includes(message.status)?<button disabled={!!this.props.readOnly||!!this.props.sessionArchived||!!this.props.busy} onClick={()=>this.changeMessage('retry',message.id)}>重试此消息</button>:null}</div></div></article>;
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
