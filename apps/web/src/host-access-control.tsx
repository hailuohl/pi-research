import * as React from 'react';
import {api} from './api.js';
import {Icon,Modal} from './ui.js';
import type {Perform} from './workbench.js';
interface HostStatus {version:number;epoch:number;available:boolean;enabled:boolean;reason:string;revokedOnRestart:boolean;activeCommands:number;unknownCommands:number;jobs:Array<{id:string;state:string;pid?:number}>;}
export class HostAccessControl extends React.Component<{sessionId:string;archived:boolean;busy:boolean;perform:Perform},{status:HostStatus|null;open:boolean;error:string;saving:boolean}> {
    state={status:null as HostStatus|null,open:false,error:'',saving:false};
    private alive=true;private request=0;private timer?:ReturnType<typeof setInterval>;
    componentDidMount(){void this.load();this.timer=setInterval(()=>{if(!this.state.saving)void this.load();},1500);}
    componentWillUnmount(){this.alive=false;this.request++;clearInterval(this.timer);}
    private async load(){const request=++this.request;try{const status=await api<HostStatus>(`/sessions/${encodeURIComponent(this.props.sessionId)}/host-access`);if(this.alive&&request===this.request)this.setState({status});}catch(error){if(this.alive&&request===this.request)this.setState({status:null,error:error instanceof Error?error.message:String(error)});}}
    private async save(enabled:boolean){const status=this.state.status;if(!status||this.state.saving||this.props.busy)return;this.request++;this.setState({saving:true,error:''});await this.props.perform(async()=>{try{await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/host-access`,{enabled,expectedVersion:status.version,...(enabled?{acknowledgedSameUserAccess:true,...(status.unknownCommands?{acknowledgedUnknownEffects:true}:{})}:{})});if(this.alive)this.setState({open:false});}catch(error){if(this.alive)this.setState({error:error instanceof Error?error.message:String(error)});throw error;}finally{if(this.alive){this.setState({saving:false});await this.load();}}},enabled?'已启用本机完全访问；不提供同用户隔离':'已撤销新宿主命令授权；受管命令正在停止');}
    render(){const {status,open,error,saving}=this.state;return <>
        <button type="button" className={'host-access-trigger'+(status?.enabled?' enabled':'')} aria-label={status?.enabled?'本机完全访问已启用，查看或撤销':status&&!status.available?'查看本机完全访问限制':'启用本机完全访问'} disabled={this.props.archived||!status} onClick={()=>this.setState({open:true,error:''})}><Icon name="cpu" size={13}/><span>{status?.enabled?'完全访问':status?.available?'完全访问 · 可启用':'完全访问 · 受限'}</span><Icon name="chevron" size={11}/></button>
        {open&&status?<Modal title={status.enabled?'本机完全访问':'启用本机完全访问'} onClose={()=>{if(!saving)this.setState({open:false});}} onSubmit={()=>{void this.save(!status.enabled);}} submitLabel={status.enabled?'撤销完全访问':'启用完全访问'} busy={saving||this.props.busy||!status.enabled&&!status.available}>
            <p>使用当前系统用户权限内的真实文件、命令与普通网络。仅当前交互主会话使用，子任务和自动唤醒不继承。</p>
            <div className="host-access-notice"><strong>本机可信模式 · 未隔离</strong><p>命令也能接触该用户的应用数据、凭据、进程及第三方账户权限。不能保证应用审批数据与本机命令隔离。</p></div>
            <p className="small muted">撤销会拒绝新命令并停止能跟踪的进程；无法撤回已经写入的文件、发出的请求或保证清除脱管进程。服务重启后需要重新启用。</p>
            {status.revokedOnRestart?<p className="host-access-note">上次授权不属于当前执行端，需要重新启用；历史记录已保留。</p>:null}
            {status.activeCommands?<p role="status">{status.activeCommands} 条受管命令正在执行或停止。</p>:null}
            {status.unknownCommands?<p className="host-access-note" role="status">{status.unknownCommands} 条历史命令退出状态未确认，请核对原进程与外部效果后决定是否继续。</p>:null}
            {status.jobs.filter(job=>job.state==='unknown').map(job=><p className="small muted" key={job.id}>命令 {job.id.slice(0,8)} · PID {job.pid??'无法确认'}</p>)}
            {!status.enabled?<label className="host-access-ack"><input type="checkbox" required aria-label="接受本机完全访问的未隔离范围"/>我理解本机未隔离及同用户数据可达，并为此会话启用。</label>:null}
            {!status.enabled&&status.unknownCommands?<label className="host-access-ack"><input type="checkbox" required aria-label="已核对未知命令的进程和外部效果"/>我已核对上述未知命令的原进程及外部效果，并明确允许新的执行。</label>:null}
            {!status.available&&!status.enabled?<p role="alert">{status.reason}</p>:null}
            {error?<p className="error-text" role="alert">{error}</p>:null}
        </Modal>:null}
    </>;
    }
}
