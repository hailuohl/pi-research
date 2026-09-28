import {ApiError} from './api.js';
export interface LogPage {content:string;cursor:number;complete:boolean;start:number;size:number;identity:string|null;}
export interface LogRequest {stream:'stdout'|'stderr';cursor:number;identity?:string;}
export const LOG_PAGE_BYTES=65536;
/** One server-bounded UTF-8 page; never accumulate the entire running log in browser memory. */
export class LogView extends React.Component<{
    streamLabel:string;read:(request:LogRequest,signal:AbortSignal)=>Promise<LogPage>;
},{stream:'stdout'|'stderr';page:LogPage|null;following:boolean;loading:boolean;error:string;reset:boolean}> {
    state={stream:'stdout' as 'stdout'|'stderr',page:null as LogPage|null,following:true,loading:false,error:'',reset:false};
    private epoch=0;private pending=false;private timer?:number;private controller?:AbortController;private catchup?:ReturnType<typeof setTimeout>;
    private starts:number[]=[0];
    componentDidMount(){void this.follow();this.timer=window.setInterval(()=>{if(this.state.following&&!this.state.page?.complete)void this.follow();},1500);}
    componentWillUnmount(){clearInterval(this.timer);this.invalidate();}
    private invalidate(){this.epoch++;this.controller?.abort();this.pending=false;clearTimeout(this.catchup);}
    async load(cursor:number,reset=false){
        if(this.pending)return;this.pending=true;const epoch=this.epoch,controller=new AbortController();this.controller=controller;
        const identity=reset?undefined:this.state.page?.identity??undefined;
        this.setState({loading:true,error:''});
        try{const page=await this.props.read({stream:this.state.stream,cursor,...(identity?{identity}:{})},controller.signal);
            if(!Number.isSafeInteger(page.start)||page.start<0||page.cursor<page.start||page.cursor-page.start>LOG_PAGE_BYTES||new TextEncoder().encode(page.content).length>LOG_PAGE_BYTES)throw Error('日志页超出有界读取范围');
            if(epoch===this.epoch){
                this.starts=[...new Set([...this.starts,page.start,page.cursor])].sort((a,b)=>a-b).slice(-128);
                const prior=this.state.page;
                const visible=!page.content&&prior&&prior.cursor===page.start&&prior.identity===page.identity?{...prior,size:page.size,complete:page.complete}:page;
                await new Promise<void>(resolve=>this.setState({page:visible,reset:false},resolve));return page;
            }
        }catch(error){if(epoch===this.epoch&&!controller.signal.aborted){const reset=error instanceof ApiError&&error.code==='LOG_RESET',encoding=error instanceof ApiError&&error.code==='LOG_ENCODING_INVALID';this.setState({error:reset?'日志身份或长度已变化。当前页为上次读取；请显式从头重新读取。':encoding?'日志包含无效 UTF-8，已暂停跟随；请使用原始归档下载核对。':error instanceof Error?error.message:String(error),reset,...(reset||encoding?{following:false}:{})});}}
        finally{if(epoch===this.epoch){this.pending=false;this.setState({loading:false});}}
    }
    async follow(){if(this.pending)return;clearTimeout(this.catchup);const epoch=this.epoch;
        for(let count=0;count<3;count++){const cursor=this.state.page?.cursor??0,page=await this.load(cursor);
            if(epoch!==this.epoch||!this.state.following||!page||page.complete||page.cursor>=page.size||page.cursor===cursor)return;
        }
        if(epoch===this.epoch&&this.state.following)this.catchup=setTimeout(()=>void this.follow(),50);
    }
    navigate(cursor:number){this.invalidate();this.setState({following:false,loading:false},()=>void this.load(cursor));}
    fromStart(){this.invalidate();this.starts=[0];this.setState({page:null,following:false,loading:false,error:'',reset:false},()=>void this.load(0,true));}
    selectStream(stream:'stdout'|'stderr'){this.invalidate();this.starts=[0];this.setState({stream,page:null,following:true,loading:false,error:'',reset:false},()=>void this.follow());}
    render(){const s=this.state,p=s.page,previous=this.starts.filter(start=>start<(p?.start??0)).pop();return <div><label>{this.props.streamLabel}<select aria-label={this.props.streamLabel} value={s.stream} onChange={(e:any)=>this.selectStream(e.target.value)}><option value="stdout">标准输出 stdout</option><option value="stderr">错误输出 stderr</option></select></label>
        <p className="small muted">每页最多 64 KiB；只显示当前窗口，不代表完整日志。原始归档可在产物中下载。</p>{p?<p className="small muted">字节范围 [{p.start}, {p.cursor}) / 最近观察大小 {p.size}{p.start>0?'；前文未在当前窗口显示':''} · {s.following?'跟随末尾':'回查模式'}</p>:null}
        <pre className="logs" aria-label={`${s.stream} 日志`}>{p?.content||(s.loading?'读取日志…':'此页暂无内容。')}</pre>{s.error?<p role="alert" className="error-text">{s.error}</p>:null}
        <div className="actions wrap"><button className="secondary compact" onClick={()=>this.fromStart()}>{s.reset?'确认重置并从头读取':'从头读取'}</button><button className="secondary compact" disabled={s.loading||s.reset||previous===undefined} onClick={()=>{if(previous!==undefined)this.navigate(previous);}}>上一页日志</button><button className="secondary compact" disabled={s.loading||s.reset||!p||p.cursor>=p.size} onClick={()=>this.navigate(p!.cursor)}>下一页日志</button><button className="secondary compact" disabled={s.loading||s.reset} onClick={()=>{this.invalidate();this.setState({following:true,loading:false},()=>void this.follow());}}>继续跟随末尾</button>{s.following?<button className="text-button" onClick={()=>this.setState({following:false})}>暂停跟随</button>:null}</div>
        {p&&p.start>0&&previous===undefined?<p className="small muted">更早的页起点已超出 128 项回查记录；请从头读取。原始日志未被删除。</p>:null}{p&&p.cursor<p.size&&s.following?<p className="small muted">正在补读后续内容，每轮最多 3 页后让出；尚未到最新输出。</p>:null}
        {p?.complete?<p className="small muted">当前页到达已结束日志的末尾；前文仍可翻页回查。</p>:p&&p.cursor>=p.size?<p className="small muted">已到当前写入位置，尚不能据此判断作业完成。</p>:null}
    </div>;}
}
