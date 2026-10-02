import * as React from 'react';
import {api} from './api.js';
import type {SessionHistoryPage,SessionMessageContent,SessionView} from './models.js';
import type {Perform} from './workbench.js';

export type QueueMessage=SessionView['messages'][number]&{queueRemoved?:boolean};
interface Props {projectId:string;sessionId:string;messages:QueueMessage[];total:number;nextCursor:string|null;canSteer:boolean;disabled:boolean;busy:boolean;perform:Perform;}
interface Page {items:QueueMessage[];total:number;nextCursor:string|null;canSteer:boolean;}
interface State {items:QueueMessage[];total:number;nextCursor:string|null;canSteer:boolean;pageStarts:(string|null)[];pageIndex:number;loading:boolean;error:string;readingId:string;editingId:string;editingMessage:QueueMessage|null;editVersion:number;draft:string;actionBusy:boolean;steerRequested:string[];}
const PAGE_LIMIT=20,READ_LIMIT=64000,MAX_CONTENT=32000;
const signature=(p:Props)=>JSON.stringify([p.total,p.nextCursor,p.canSteer,p.messages.map(m=>[m.id,m.version,m.status,m.contentBytes])]);
const isQueuedUser=(m:QueueMessage)=>m.role==='user'&&m.status==='queued'&&m.origin!=='automation';

export class MessageQueue extends React.Component<Props,State> {
    state:State={items:this.props.messages.filter(isQueuedUser),total:this.props.total,nextCursor:this.props.nextCursor,canSteer:this.props.canSteer,pageStarts:[null],pageIndex:0,loading:false,error:'',readingId:'',editingId:'',editingMessage:null,editVersion:0,draft:'',actionBusy:false,steerRequested:[]};
    private pageGeneration=0;
    private readGeneration=0;
    private suppressParentReload=false;
    componentDidUpdate(previous:Props){
        if(signature(previous)===signature(this.props))return;
        if(this.state.pageIndex===0)this.setState({items:this.props.messages.filter(isQueuedUser),total:this.props.total,nextCursor:this.props.nextCursor,canSteer:this.props.canSteer,pageStarts:[null]});
        else if(this.suppressParentReload)this.suppressParentReload=false;
        else void this.loadPage(this.state.pageStarts[this.state.pageIndex]??null,this.state.pageIndex);
    }
    componentWillUnmount(){this.mounted=false;this.pageGeneration++;this.readGeneration++;}
    private async loadPage(cursor:string|null,index:number){
        const generation=++this.pageGeneration,{projectId,sessionId}=this.props;
        this.setState({loading:true,error:''});
        try{
            const query=new URLSearchParams({limit:String(PAGE_LIMIT),...(cursor?{afterMessageId:cursor}:{})});
            const page=await api<Page>(`/sessions/${sessionId}/queue?${query}`,undefined,'GET');
            if(!Array.isArray(page.items)||page.items.length>PAGE_LIMIT||!Number.isSafeInteger(page.total)||page.total<page.items.length||typeof page.canSteer!=='boolean'||page.items.some(m=>m.sessionId!==sessionId||m.projectId!==projectId||!isQueuedUser(m))||page.nextCursor!==null&&typeof page.nextCursor!=='string'||page.nextCursor!==null&&page.items[page.items.length-1]?.id!==page.nextCursor)
                throw Error('队列响应与当前会话不一致，请刷新后重试');
            if(generation!==this.pageGeneration||projectId!==this.props.projectId||sessionId!==this.props.sessionId)return;
            if(index>0&&!page.items.length){
                this.setState({items:this.props.messages.filter(isQueuedUser),total:this.props.total,nextCursor:this.props.nextCursor,canSteer:this.props.canSteer,pageStarts:[null],pageIndex:0,loading:false});
                return;
            }
            const starts=this.state.pageStarts.slice(0,index);starts[index]=cursor;
            this.setState({items:page.items,total:page.total,nextCursor:page.nextCursor,canSteer:page.canSteer,pageStarts:starts,pageIndex:index,loading:false});
        }catch(error){if(generation===this.pageGeneration)this.setState({loading:false,error:error instanceof Error?error.message:String(error)});}
    }
    private async readComplete(message:QueueMessage){
        let cursor=0,total:number|undefined,content='';
        for(;;){
            const page=await api<SessionMessageContent>('/operations/session_message_read',{projectId:this.props.projectId,input:{sessionId:this.props.sessionId,messageId:message.id,cursor,limit:READ_LIMIT,expectedVersion:message.version}});
            const bytes=new TextEncoder().encode(page.content).byteLength;
            if(page.sessionId!==this.props.sessionId||page.messageId!==message.id||page.cursorUnit!=='utf8-byte'||page.version!==message.version||![page.version,page.cursor,page.end,page.total].every(Number.isSafeInteger)||page.version<1||page.cursor<Math.max(0,cursor-3)||page.cursor>cursor||page.end<page.cursor||page.end>page.total||page.end>page.cursor+READ_LIMIT||page.end<=cursor&&!page.complete||page.complete!==(page.end===page.total)||bytes!==page.end-page.cursor||total!==undefined&&total!==page.total)
                throw Error('消息原文响应与请求不一致，请刷新队列后重试');
            if(page.sourceTruncated)throw Error('数据库中的消息正文已截断，不能安全编辑；请保留原消息。');
            total=page.total;content+=page.content;
            if(content.length>MAX_CONTENT)throw Error('消息正文超过 32000 字符，不能编辑。');
            if(page.complete)return content;
            cursor=page.end;
        }
    }
    private async beginEdit(message:QueueMessage){
        const generation=++this.readGeneration;
        this.setState({readingId:message.id,error:''});
        try{
            const content=await this.readComplete(message);
            if(generation===this.readGeneration&&message.projectId===this.props.projectId&&message.sessionId===this.props.sessionId)this.setState({readingId:'',editingId:message.id,editingMessage:message,editVersion:message.version,draft:content});
        }catch(error){if(generation===this.readGeneration)this.setState({readingId:'',error:error instanceof Error?error.message:String(error)});}
    }
    private get staleEdit(){const current=this.state.items.find(m=>m.id===this.state.editingId);return !!this.state.editingId&&(!current||current.version!==this.state.editVersion);}
    private closeEdit=()=>this.setState({editingId:'',editingMessage:null,editVersion:0,draft:'',error:''});
    private async action(message:QueueMessage,action:'edit'|'cancel'|'steer',content?:string){
        if(this.props.disabled||this.props.busy||this.state.loading||this.state.actionBusy||action==='steer'&&(!this.state.canSteer||this.state.steerRequested.includes(message.id))||action==='edit'&&this.staleEdit)return;
        if(action==='edit'&&content!==undefined&&(content.length>MAX_CONTENT||!content.trim())){this.setState({error:!content.trim()?'消息内容不能为空。':'消息内容最多 32000 字符。'});return;}
        const index=this.state.pageIndex,cursor=this.state.pageStarts[index]??null;
        this.suppressParentReload=true;this.setState({actionBusy:true,error:''});
        let result:any,failure='';
        try{result=await this.props.perform(()=>api(`/sessions/${this.props.sessionId}/queue`,{messageId:message.id,expectedVersion:action==='edit'?this.state.editVersion:message.version,action,...(content===undefined?{}:{content})}),action==='steer'?'已请求立即引导；将在当前任务的下一工具或回合边界生效，不会停止正式运行':action==='cancel'?'已从待发队列移出':'已更新排队消息');}
        catch(error){failure=error instanceof Error?error.message:String(error);}
        this.suppressParentReload=false;
        if(this.mounted&&result&&action==='steer'&&!this.state.steerRequested.includes(message.id))this.setState(previous=>({steerRequested:[...previous.steerRequested,message.id]}));
        if(this.mounted&&result&&action==='edit')this.closeEdit();
        if(this.mounted&&index>0&&result)void this.loadPage(cursor,index);
        if(this.mounted)this.setState({actionBusy:false,error:result?'':failure||'操作未完成；草稿已保留，请检查页面错误后重试。'});
    }
    private mounted=true;
    componentDidMount(){this.mounted=true;}
    private get displayedItems(){const items=this.state.items.slice();if(this.state.editingMessage&&!items.some(m=>m.id===this.state.editingId))items.push(this.state.editingMessage);return items;}
    render(){
        if(!this.props.sessionId)return null;
        const {pageIndex,total,nextCursor,loading,error,editingId,draft}=this.state,locked=this.props.disabled||this.props.busy||loading||this.state.actionBusy||!!this.state.readingId;
        const items=this.displayedItems;
        return <section className="message-queue" aria-label="待发消息队列"><div className="message-queue-heading"><strong>待发队列</strong><span className="small muted">{this.state.total} 条 · 按排入顺序发送</span>{pageIndex>0?<button type="button" className="text-button" disabled={locked} onClick={()=>this.setState({items:this.props.messages.filter(isQueuedUser),total:this.props.total,nextCursor:this.props.nextCursor,canSteer:this.props.canSteer,pageStarts:[null],pageIndex:0,error:''})}>队首</button>:null}</div>
            {error?<p role="alert" className="error-text queue-error">{error}</p>:null}
            {items.length? <ol className="message-queue-list">{items.map(message=>{
                const editing=editingId===message.id,stale=editing&&this.staleEdit,steerRequested=this.state.steerRequested.includes(message.id),rowLocked=locked||!!editingId&&!editing;
                return <li className="message-queue-row" key={message.id}><div className="message-queue-preview"><span>{message.content||'（空消息）'}</span>{message.previewTruncated?<small>预览 {message.contentBytes} 字节中的一部分</small>:null}</div>
                    {editing?<div className="message-queue-editor"><textarea aria-label="编辑排队消息" maxLength={MAX_CONTENT} value={draft} disabled={this.state.actionBusy} onChange={e=>this.setState({draft:e.target.value,error:''})}/>{stale?<p role="alert" className="error-text">消息版本已变化或已离开队列。草稿已保留，请取消后重新读取。</p>:null}<div className="message-queue-actions"><button type="button" disabled={locked||stale||!draft.trim()} onClick={()=>void this.action(message,'edit',draft)}>保存</button><button type="button" disabled={this.state.actionBusy} onClick={this.closeEdit}>取消编辑</button></div></div>:<div className="message-queue-actions"><button type="button" disabled={rowLocked||this.state.readingId===message.id} onClick={()=>void this.beginEdit(message)}>{this.state.readingId===message.id?'读取全文…':'编辑'}</button><button type="button" disabled={rowLocked} onClick={()=>void this.action(message,'cancel')}>删除</button><button type="button" disabled={rowLocked||!this.state.canSteer||steerRequested} title={!this.state.canSteer?'当前任务暂不可立即引导':'在下一工具或回合边界生效'} onClick={()=>void this.action(message,'steer')}>{steerRequested?'已请求 · 等待边界':'立即引导'}</button></div>}
                </li>;
            })}</ol>:<p className="small muted queue-empty">暂无待发消息</p>}
            {total>PAGE_LIMIT||pageIndex>0?<div className="message-queue-pages"><span className="small muted">第 {pageIndex+1} 页</span><button type="button" disabled={locked||pageIndex===0} onClick={()=>pageIndex===1?this.setState({items:this.props.messages.filter(isQueuedUser),total:this.props.total,nextCursor:this.props.nextCursor,canSteer:this.props.canSteer,pageStarts:[null],pageIndex:0,error:''}):void this.loadPage(this.state.pageStarts[pageIndex-1]??null,pageIndex-1)}>上一页</button><button type="button" disabled={locked||!nextCursor} onClick={()=>nextCursor&&void this.loadPage(nextCursor,pageIndex+1)}>下一页</button></div>:null}
        </section>;
    }
}
