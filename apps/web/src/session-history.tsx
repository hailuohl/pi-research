import * as React from 'react';
import {api} from './api.js';
import type {SessionView,SessionHistoryPage,SessionMessageContent} from './models.js';
import {date} from './models.js';
import {Badge} from './ui.js';
import type {Perform} from './workbench.js';

type Anchor={direction:'before'|'after';id:string}|null;
interface Props {projectId:string;sessionId:string;messages:SessionView['messages'];history:SessionHistoryPage|null;historyAnchor:Anchor;onNavigate:(anchor:Anchor)=>void;perform:Perform;}
interface State {messageId:string;page:SessionMessageContent|null;busy:boolean;error:string;}
const READ_LIMIT=16000;

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
        const active=messages.find(message=>message.id===messageId);
        const controls=<div className="history-controls"><button type="button" disabled={!history?.beforeMessageId} onClick={()=>history?.beforeMessageId&&onNavigate({direction:'before',id:history.beforeMessageId})}>更早消息</button><button type="button" disabled={!history?.afterMessageId} onClick={()=>history?.afterMessageId&&onNavigate({direction:'after',id:history.afterMessageId})}>更新消息</button>{historyAnchor||!history?.atLatest?<button type="button" onClick={()=>onNavigate(null)}>返回最新</button>:null}</div>;
        return <>{history?controls:null}{messages.map(message=><article className={'message message-'+message.role} key={message.id}><div className="message-avatar">{message.role==='user'?'我':message.role==='assistant'?'π':'·'}</div><div className="message-body"><div className="message-meta"><strong>{message.role==='user'?'你':message.role==='assistant'?(message.wakeupId?'Pi · 结果分析':'Pi'):(message.wakeupId?'持久化结果通知':'工作台状态通知')}</strong><span>{date(message.createdAt)}</span>{message.status==='failed'||message.status==='cancelled'?<Badge value={message.status}/>:null}</div>
            {active?.id===message.id?<div className="message-reader"><div className="history-controls"><strong>消息原文</strong><button type="button" onClick={this.close}>关闭原文</button></div>{busy?<p className="small muted">正在读取…</p>:null}{error?<p role="alert" className="error-text">{error}</p>:null}{page?<><pre className="prose-text message-window">{page.content}</pre><div className="history-controls"><span>{page.cursor+1}–{page.end} / {page.total} 字节</span><button type="button" disabled={busy||page.cursor===0} onClick={()=>void this.read(message.id,Math.max(0,page.cursor-READ_LIMIT),page.version)}>上一段</button><button type="button" disabled={busy||page.complete} onClick={()=>void this.read(message.id,page.end,page.version)}>下一段</button></div>{page.sourceTruncated?<p className="small muted">数据库中的消息正文已截断；这里只能读取已保存的部分，原生会话记录可能仍保留全文。</p>:null}</>:null}</div>:<><div className="prose-text">{message.content||'（本次响应没有可展示的文本）'}</div>{message.previewTruncated?<p className="small muted">预览 {message.contentBytes} 字节中的前段。<button type="button" className="text-button" onClick={()=>void this.read(message.id,0,message.version)}>分段查看原文</button></p>:null}{message.contentTruncated?<p className="small muted">数据库中的消息正文已截断；这里只能读取已保存的部分，原生会话记录可能仍保留全文。</p>:null}</>}
            {message.error?<p className="error-text">{message.error}</p>:null}<div className="message-tools"><button onClick={()=>perform(()=>api(`/sessions/${sessionId}/branch`,{messageId:message.id}),'已创建对话分支；实验记录保持不变')}>从此处分支</button>{message.role==='user'&&['failed','cancelled'].includes(message.status)?<button onClick={()=>perform(()=>api(`/sessions/${sessionId}/retry`,{messageId:message.id}))}>重试此消息</button>:null}</div></div></article>)}{history?controls:null}</>;
    }
}
