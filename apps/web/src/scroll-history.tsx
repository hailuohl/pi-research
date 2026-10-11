import * as React from 'react';
import {api} from './api.js';
import type {SessionHistoryPage} from './models.js';
import type {QueueMessage} from './message-queue.js';
import type {Perform} from './workbench.js';
import {SessionHistory} from './session-history.js';

type Direction='before'|'after';
type Anchor={direction:Direction;id:string}|null;
interface HistoryWindow {messages:QueueMessage[];beforeCursor:string|null;afterCursor:string|null;atLatest:boolean;}
interface HistoryView {session:{id:string;projectId:string};messages:QueueMessage[];history:SessionHistoryPage;}
interface Props {projectId:string;sessionId:string;messages:QueueMessage[];history:SessionHistoryPage|null;historyAnchor:Anchor;onNavigate:(anchor:Anchor)=>void;perform:Perform;activeGeneration?:number;liveKey?:string;confirmedMessageId?:string;}
interface State extends HistoryWindow {loading:Direction|null;failedDirection:Direction|null;error:string;atBottom:boolean;}
interface LayoutSnapshot {visible:boolean;atBottom:boolean;scrollElement:HTMLElement|null;scrollTop:number;scrollHeight:number;anchorId:string|null;anchorOffset:number;firstId:string|null;lastId:string|null;}
const PAGE_SIZE=20,MAX_MESSAGES=200,MAX_AUTO_PAGES=10;

export function mergeHistoryMessages(current:QueueMessage[],incoming:QueueMessage[],direction:Direction):QueueMessage[]{
    const ordered=direction==='before'?[...incoming,...current]:[...current,...incoming],result:QueueMessage[]=[],positions=new Map<string,number>();
    for(const message of ordered){
        const index=positions.get(message.id);
        if(index===undefined){positions.set(message.id,result.length);result.push(message);}
        else if((message.version??0)>(result[index].version??0))result[index]=message;
    }
    return result;
}

export function mergeHistoryPage(window:HistoryWindow,messages:QueueMessage[],history:SessionHistoryPage,direction:Direction):HistoryWindow{
    let merged=mergeHistoryMessages(window.messages,messages,direction),beforeCursor=direction==='before'?history.beforeMessageId:window.beforeCursor,
        afterCursor=direction==='after'?history.afterMessageId:window.afterCursor,atLatest=direction==='after'?history.afterMessageId===null:window.atLatest;
    if(merged.length>MAX_MESSAGES){
        if(direction==='before'){merged=merged.slice(0,MAX_MESSAGES);afterCursor=merged[merged.length-1]?.id??afterCursor;atLatest=false;}
        else{merged=merged.slice(-MAX_MESSAGES);beforeCursor=merged[0]?.id??beforeCursor;}
    }
    return {messages:merged,beforeCursor,afterCursor,atLatest};
}

export function reconcileHistoryWindow(window:HistoryWindow,incoming:QueueMessage[],history:SessionHistoryPage|null,atBottom=false):HistoryWindow{
    const ids=new Set(window.messages.map(message=>message.id)),overlap=incoming.some(message=>ids.has(message.id));
    if(window.afterCursor!==null){
        const updates=incoming.filter(message=>ids.has(message.id));
        return {...window,messages:mergeHistoryMessages(window.messages,updates,'after'),afterCursor:overlap?window.afterCursor:window.messages[window.messages.length-1]?.id??window.afterCursor};
    }
    if(!overlap){
        if(atBottom&&history?.atLatest){
            const messages=mergeHistoryMessages([],incoming,'after'),trimmed=messages.length>MAX_MESSAGES?messages.slice(-MAX_MESSAGES):messages;
            return {messages:trimmed,beforeCursor:messages.length>MAX_MESSAGES?trimmed[0]?.id??null:history.beforeMessageId,afterCursor:history.afterMessageId,atLatest:history.atLatest};
        }
        return {...window,afterCursor:window.messages[window.messages.length-1]?.id??null,atLatest:false};
    }
    let messages=mergeHistoryMessages(window.messages,incoming,'after'),beforeCursor=window.beforeCursor??history?.beforeMessageId??null;
    if(!atBottom&&messages.length>MAX_MESSAGES){
        return {...window,messages:mergeHistoryMessages(window.messages,incoming.filter(message=>ids.has(message.id)),'after'),afterCursor:window.messages[window.messages.length-1]?.id??null,atLatest:false};
    }
    if(messages.length>MAX_MESSAGES){messages=messages.slice(-MAX_MESSAGES);beforeCursor=messages[0]?.id??beforeCursor;}
    return {messages,beforeCursor,afterCursor:history?.afterMessageId??null,atLatest:history?.atLatest??window.atLatest};
}

function initialWindow(messages:QueueMessage[],history:SessionHistoryPage|null):HistoryWindow{
    const merged=mergeHistoryMessages([],messages,'after'),trimmed=merged.length>MAX_MESSAGES?merged.slice(-MAX_MESSAGES):merged;
    return {messages:trimmed,beforeCursor:merged.length>MAX_MESSAGES?trimmed[0]?.id??null:history?.beforeMessageId??null,afterCursor:history?.afterMessageId??null,atLatest:history?.atLatest??true};
}
function sameAnchor(left:Anchor,right:Anchor){return left?.direction===right?.direction&&left?.id===right?.id;}
function sameWindow(left:HistoryWindow,right:HistoryWindow){return left.beforeCursor===right.beforeCursor&&left.afterCursor===right.afterCursor&&left.atLatest===right.atLatest&&left.messages.length===right.messages.length&&left.messages.every((message,index)=>message===right.messages[index]);}
function validatePage(page:HistoryView,capturedProjectId:string,capturedSessionId:string,direction:Direction,cursor:string,currentIds:Set<string>){
    if(!page||page.session?.id!==capturedSessionId||page.session?.projectId!==capturedProjectId||!Array.isArray(page.messages)||page.messages.length<1||page.messages.length>PAGE_SIZE||!page.history||typeof page.history.atLatest!=='boolean')throw Error('invalid page');
    for(const boundary of [page.history.beforeMessageId,page.history.afterMessageId])if(boundary!==null&&typeof boundary!=='string')throw Error('invalid cursor');
    const ids=new Set<string>();
    for(const message of page.messages){
        if(message.projectId!==capturedProjectId||message.sessionId!==capturedSessionId||typeof message.id!=='string'||!message.id||message.id===cursor||ids.has(message.id))throw Error('invalid message scope');
        ids.add(message.id);
    }
    if(!page.messages.some(message=>!currentIds.has(message.id)))throw Error('page did not advance');
    if(direction==='before'?page.history.beforeMessageId===cursor:page.history.afterMessageId===cursor)throw Error('cursor did not advance');
}

export class ScrollHistory extends React.Component<Props,State>{
    state:State={...initialWindow(this.props.messages,this.props.history),loading:null,failedDirection:null,error:'',atBottom:true};
    private root=React.createRef<HTMLDivElement>();
    private controller:AbortController|null=null;
    private requestEpoch=0;
    private mounted=false;
    private scrollElement:HTMLElement|null=null;
    private scrollEventsBound=false;
    private loadingDirection:Direction|null=null;
    private requestCursor:string|null=null;
    private requestEdge:string|null=null;
    private waitingLatest=false;
    private autoDirection:Direction|null=null;
    private autoPages=0;
    private touchY:number|null=null;
    private lastConfirmedId='';
    private pendingSnapshot:LayoutSnapshot|null=null;
    private readonly onScroll=()=>{this.updateBottomState();this.checkEdges();};
    private readonly onResize=()=>{this.bindScrollEvents();this.checkEdges();};
    private readonly onWheel=(event:WheelEvent)=>{if(this.isInsideHost(event.target)&&event.deltaY)this.userDirection(event.deltaY<0?'before':'after');};
    private readonly onTouchStart=(event:TouchEvent)=>{if(this.isInsideHost(event.target))this.touchY=event.touches[0]?.clientY??null;};
    private readonly onTouchMove=(event:TouchEvent)=>{if(!this.isInsideHost(event.target))return;const y=event.touches[0]?.clientY;if(y===undefined||this.touchY===null)return;const delta=this.touchY-y;this.touchY=y;if(delta)this.userDirection(delta>0?'after':'before');};
    private readonly navigate=(anchor:Anchor)=>anchor===null?this.jumpLatest():this.props.onNavigate(anchor);

    componentDidMount(){
        this.mounted=true;
        this.bindScrollEvents();
        this.autoDirection=this.state.afterCursor?'after':this.state.beforeCursor?'before':null;
        if(typeof window!=='undefined')window.addEventListener('resize',this.onResize,{passive:true});
        if(this.isHostVisible()&&this.state.atLatest)this.scrollToBottom();
        this.lastConfirmedId=this.confirmedMessage()?.id??'';
        this.checkEdges();
    }

    getSnapshotBeforeUpdate(_previous:Readonly<Props>,previousState:Readonly<State>):LayoutSnapshot{
        const root=this.root.current,scrollElement=this.findScrollElement(root),visible=this.isHostVisible(),scrollTop=scrollElement?.scrollTop??(typeof window==='undefined'?0:window.scrollY),
            scrollHeight=scrollElement?.scrollHeight??(typeof document==='undefined'?0:document.documentElement.scrollHeight),viewportTop=scrollElement?.getBoundingClientRect().top??0,
            viewportHeight=scrollElement?.clientHeight??(typeof window==='undefined'?0:window.innerHeight),atBottom=scrollElement?scrollElement.scrollHeight-scrollElement.clientHeight-scrollElement.scrollTop<=32:
                typeof window!=='undefined'&&typeof document!=='undefined'&&document.documentElement.scrollHeight-window.innerHeight-window.scrollY<=32;
        let anchorId:string|null=null,anchorOffset=0;
        if(root&&visible){
            const anchor=Array.from(root.querySelectorAll<HTMLElement>('[data-history-anchor-id]')).find(element=>{const rect=element.getBoundingClientRect();return rect.height>0&&rect.bottom>viewportTop&&rect.top<viewportTop+viewportHeight;});
            if(anchor){anchorId=anchor.dataset.historyAnchorId??null;anchorOffset=anchor.getBoundingClientRect().top-viewportTop;}
        }
        return {visible,atBottom,scrollElement,scrollTop,scrollHeight,anchorId,anchorOffset,firstId:previousState.messages[0]?.id??null,lastId:previousState.messages[previousState.messages.length-1]?.id??null};
    }

    componentDidUpdate(previous:Props,previousState:State,snapshot:LayoutSnapshot){
        snapshot=this.pendingSnapshot??snapshot;this.pendingSnapshot=null;
        const scopeChanged=previous.projectId!==this.props.projectId||previous.sessionId!==this.props.sessionId||!sameAnchor(previous.historyAnchor,this.props.historyAnchor);
        if(scopeChanged){
            if(previous.projectId!==this.props.projectId||previous.sessionId!==this.props.sessionId)this.lastConfirmedId='';
            this.cancelRequest();
            this.waitingLatest=previous.projectId===this.props.projectId&&previous.sessionId===this.props.sessionId&&!!previous.historyAnchor&&!this.props.historyAnchor&&this.props.messages.length===0;
            const next=this.waitingLatest?initialWindow([],null):initialWindow(this.props.messages,this.props.history);
            this.autoPages=0;this.autoDirection=this.waitingLatest?null:next.afterCursor?'after':next.beforeCursor?'before':null;
            this.setState({...next,loading:null,failedDirection:null,error:''},()=>{if(!this.waitingLatest){if(this.isHostVisible())this.scrollToBottom();this.checkEdges();}});
            return;
        }
        if(this.waitingLatest){
            if(!this.props.history?.atLatest||this.props.messages.length===0&&previous.history===this.props.history)return;
            this.waitingLatest=false;
            const next=initialWindow(this.props.messages,this.props.history);this.autoDirection=next.afterCursor?'after':next.beforeCursor?'before':null;
            this.setState({...next,loading:null,failedDirection:null,error:''},()=>{if(this.isHostVisible())this.scrollToBottom();this.checkEdges();});
            return;
        }
        const confirmed=this.confirmedMessage();
        if(confirmed&&confirmed.id!==this.lastConfirmedId){this.lastConfirmedId=confirmed.id;this.jumpLatest();return;}
        if(previous.messages!==this.props.messages){
            const next=reconcileHistoryWindow(this.state,this.props.messages,this.props.history,snapshot?.atBottom??false);
            const direction=this.loadingDirection,cursor=direction==='before'?next.beforeCursor:next.afterCursor,
                edge=direction==='before'?next.messages[0]?.id??null:next.messages[next.messages.length-1]?.id??null;
            const cancelled=!!direction&&(cursor!==this.requestCursor||edge!==this.requestEdge);
            if(cancelled)this.cancelRequest();
            if(cancelled||!sameWindow(this.state,next)){this.pendingSnapshot=snapshot;this.setState({...next,loading:cancelled?null:this.state.loading});return;}
        }
        if(snapshot?.visible&&this.isHostVisible()){
            if(snapshot.atBottom&&this.state.atLatest)this.scrollToBottom();else this.restorePosition(snapshot);
        }
        this.checkEdges();
    }

    private confirmedMessage(){
        if(!this.props.confirmedMessageId||this.props.historyAnchor||this.props.history&&!this.props.history.atLatest)return;
        return this.props.messages.find(message=>message.id===this.props.confirmedMessageId&&message.role==='user'&&message.projectId===this.props.projectId&&message.sessionId===this.props.sessionId);
    }
    private updateBottomState(){
        if(!this.mounted||!this.isHostVisible())return;
        const element=this.findScrollElement(this.root.current),atBottom=element?element.scrollHeight-element.clientHeight-element.scrollTop<=32:
            typeof window!=='undefined'&&typeof document!=='undefined'&&document.documentElement.scrollHeight-window.innerHeight-window.scrollY<=32;
        if(atBottom!==this.state.atBottom)this.setState({atBottom});
    }

    componentWillUnmount(){
        this.mounted=false;this.cancelRequest();
        if(typeof window!=='undefined')window.removeEventListener('resize',this.onResize);
        this.unbindScrollEvents();
    }

    private cancelRequest(){this.requestEpoch++;this.controller?.abort();this.controller=null;this.loadingDirection=null;this.requestCursor=null;this.requestEdge=null;}
    private bindScrollEvents(){
        const next=this.findScrollElement(this.root.current);if(this.scrollEventsBound&&next===this.scrollElement)return;
        this.unbindScrollEvents();this.scrollElement=next;
        if(next){next.addEventListener('scroll',this.onScroll,{passive:true});next.addEventListener('wheel',this.onWheel,{passive:true});next.addEventListener('touchstart',this.onTouchStart,{passive:true});next.addEventListener('touchmove',this.onTouchMove,{passive:true});}
        else if(typeof window!=='undefined'){window.addEventListener('scroll',this.onScroll,{passive:true});window.addEventListener('wheel',this.onWheel,{passive:true});window.addEventListener('touchstart',this.onTouchStart,{passive:true});window.addEventListener('touchmove',this.onTouchMove,{passive:true});}
        this.scrollEventsBound=!!next||typeof window!=='undefined';
    }
    private unbindScrollEvents(){
        if(!this.scrollEventsBound)return;
        if(this.scrollElement){this.scrollElement.removeEventListener('scroll',this.onScroll);this.scrollElement.removeEventListener('wheel',this.onWheel);this.scrollElement.removeEventListener('touchstart',this.onTouchStart);this.scrollElement.removeEventListener('touchmove',this.onTouchMove);}
        else if(typeof window!=='undefined'){window.removeEventListener('scroll',this.onScroll);window.removeEventListener('wheel',this.onWheel);window.removeEventListener('touchstart',this.onTouchStart);window.removeEventListener('touchmove',this.onTouchMove);}
        this.scrollEventsBound=false;
    }
    private isInsideHost(target:EventTarget|null){
        if(!this.isHostVisible()||typeof Node==='undefined'||!(target instanceof Node))return false;
        const root=this.root.current,host=root?.closest('.conversation');
        return !!root&&(root.contains(target)||!!host&&host.contains(target));
    }
    private userDirection(direction:Direction){this.autoDirection=direction;this.autoPages=0;this.checkEdges();}
    private jumpLatest(){
        const anchored=!!this.props.historyAnchor;
        this.cancelRequest();const next=initialWindow(this.props.messages,this.props.history);this.autoPages=0;this.autoDirection=next.afterCursor?'after':next.beforeCursor?'before':null;
        this.setState({...next,loading:null,failedDirection:null,error:'',atBottom:true},()=>{if(this.isHostVisible())this.scrollToBottom();this.checkEdges();});
        if(anchored)this.props.onNavigate(null);
    }
    private findScrollElement(root:HTMLElement|null):HTMLElement|null{
        if(!root||typeof window==='undefined')return null;
        const conversation=root.closest<HTMLElement>('.conversation');
        if(!conversation)return null;
        const overflow=window.getComputedStyle(conversation).overflowY;
        return overflow==='auto'||overflow==='scroll'?conversation:null;
    }
    private isHostVisible(){
        const root=this.root.current;if(!root||typeof window==='undefined'||typeof document==='undefined'||root.getClientRects().length===0||root.clientHeight<=0)return false;
        const conversation=root.closest<HTMLElement>('.conversation');
        if(conversation&&(conversation.getClientRects().length===0||conversation.clientHeight<=0))return false;
        return this.findScrollElement(root)?this.findScrollElement(root)!.clientHeight>0:window.innerHeight>0;
    }
    private scrollToBottom(){
        if(!this.isHostVisible())return;
        const element=this.findScrollElement(this.root.current);
        if(element)element.scrollTop=element.scrollHeight;
        else if(typeof window!=='undefined'&&typeof document!=='undefined')window.scrollTo(0,document.documentElement.scrollHeight);
        this.updateBottomState();
    }
    private restorePosition(snapshot:LayoutSnapshot){
        const root=this.root.current,scrollElement=this.findScrollElement(root),viewportTop=scrollElement?.getBoundingClientRect().top??0;
        if(snapshot.anchorId&&root){
            const element=Array.from(root.querySelectorAll<HTMLElement>('[data-history-anchor-id]')).find(item=>item.dataset.historyAnchorId===snapshot.anchorId);
            if(element){const delta=element.getBoundingClientRect().top-viewportTop-snapshot.anchorOffset;if(delta)this.adjustScroll(scrollElement,delta);return;}
        }
        const oldFirst=snapshot.firstId,newFirst=this.state.messages[0]?.id??null;
        if(oldFirst!==newFirst&&this.state.messages.some(message=>message.id===oldFirst)){
            const height=(scrollElement?.scrollHeight??(typeof document==='undefined'?0:document.documentElement.scrollHeight))-snapshot.scrollHeight;
            if(height)this.adjustScroll(scrollElement,height);
        }
    }
    private adjustScroll(element:HTMLElement|null,delta:number){
        if(element)element.scrollTop+=delta;
        else if(typeof window!=='undefined')window.scrollTo(0,window.scrollY+delta);
    }
    private checkEdges(){
        if(!this.mounted||this.waitingLatest||!this.isHostVisible()||this.state.loading||this.loadingDirection||this.state.error)return;
        const root=this.root.current;
        if(!root)return;
        const scrollElement=this.findScrollElement(root),viewportHeight=scrollElement?.clientHeight??window.innerHeight,rootRect=root.getBoundingClientRect();
        const nearTop=scrollElement?scrollElement.scrollTop<=96:rootRect.top>=-96&&rootRect.top<=viewportHeight,
            nearBottom=scrollElement?scrollElement.scrollHeight-scrollElement.clientHeight-scrollElement.scrollTop<=96:rootRect.bottom>=-96&&rootRect.bottom<=viewportHeight+96;
        if(this.autoPages>=MAX_AUTO_PAGES)return;
        if(nearTop&&nearBottom){const direction=this.autoDirection??(this.state.afterCursor?'after':'before');if(direction==='after'&&this.state.afterCursor||direction==='before'&&this.state.beforeCursor){this.autoDirection=direction;void this.load(direction,true);}}
        else if(nearTop&&this.state.beforeCursor){this.autoDirection='before';void this.load('before',true);}
        else if(nearBottom&&this.state.afterCursor){this.autoDirection='after';void this.load('after',true);}
    }

    async load(direction:Direction,automatic=false){
        const cursor=direction==='before'?this.state.beforeCursor:this.state.afterCursor;
        if(!cursor||this.waitingLatest||this.loadingDirection)return;
        this.loadingDirection=direction;
        this.requestCursor=cursor;this.requestEdge=direction==='before'?this.state.messages[0]?.id??null:this.state.messages[this.state.messages.length-1]?.id??null;
        const epoch=++this.requestEpoch,projectId=this.props.projectId,sessionId=this.props.sessionId,anchor=this.props.historyAnchor,controller=new AbortController();
        this.controller=controller;this.setState({loading:direction,failedDirection:null,error:''});
        const query=direction==='before'?'beforeMessageId':'afterMessageId',path=`/sessions/${encodeURIComponent(sessionId)}/view?${query}=${encodeURIComponent(cursor)}&limit=${PAGE_SIZE}`;
        try{
            const page=await api<HistoryView>(path,undefined,'GET',controller.signal);
            if(epoch!==this.requestEpoch||controller.signal.aborted||projectId!==this.props.projectId||sessionId!==this.props.sessionId||!sameAnchor(anchor,this.props.historyAnchor))return;
            const currentCursor=direction==='before'?this.state.beforeCursor:this.state.afterCursor,
                currentEdge=direction==='before'?this.state.messages[0]?.id??null:this.state.messages[this.state.messages.length-1]?.id??null;
            if(currentCursor!==cursor||currentEdge!==this.requestEdge){this.cancelRequest();this.setState({loading:null});return;}
            validatePage(page,projectId,sessionId,direction,cursor,new Set(this.state.messages.map(message=>message.id)));
            const next=mergeHistoryPage(this.state,page.messages,page.history,direction);
            if(automatic)this.autoPages++;
            this.loadingDirection=null;this.controller=null;this.requestCursor=null;this.requestEdge=null;
            this.setState({...next,loading:null,failedDirection:null,error:''},()=>this.checkEdges());
        }catch{
            if(epoch===this.requestEpoch&&!controller.signal.aborted&&projectId===this.props.projectId&&sessionId===this.props.sessionId&&sameAnchor(anchor,this.props.historyAnchor))this.setState({loading:null,failedDirection:direction,error:'历史读取失败，当前消息已保留。'});
        }finally{
            if(epoch===this.requestEpoch){this.controller=null;this.loadingDirection=null;this.requestCursor=null;this.requestEdge=null;}
        }
    }

    render(){
        const {projectId,sessionId,historyAnchor,perform,activeGeneration}=this.props,{loading,failedDirection,error}=this.state,
            history=this.props.history?{...this.props.history,beforeMessageId:this.state.beforeCursor,afterMessageId:this.state.afterCursor,atLatest:this.state.atLatest}:null,
            retry=failedDirection?<div className="scroll-history-error" role="alert"><span>{error}</span><button type="button" onClick={()=>{this.autoDirection=failedDirection;this.autoPages=0;void this.load(failedDirection);}}>重试</button></div>:null;
        return <div className="scroll-history" ref={this.root}>
            {loading==='before'?<div className="scroll-history-loading" aria-live="polite">正在加载更早消息…</div>:null}
            {failedDirection==='before'?retry:null}
            <SessionHistory projectId={projectId} sessionId={sessionId} messages={this.state.messages} history={history} historyAnchor={historyAnchor} onNavigate={this.navigate} perform={perform} activeGeneration={activeGeneration}/>
            {!this.state.atBottom?<div className="scroll-latest-control"><button type="button" className="secondary compact" onClick={()=>this.jumpLatest()}>回到最新</button></div>:null}
            {loading==='after'?<div className="scroll-history-loading" aria-live="polite">正在加载更新消息…</div>:null}
            {failedDirection==='after'?retry:null}
        </div>;
    }
}
