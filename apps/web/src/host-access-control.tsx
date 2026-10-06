import * as React from 'react';
import {createPortal} from 'react-dom';
import {api} from './api.js';
import {Icon,Modal} from './ui.js';
import type {Perform} from './workbench.js';
interface HostStatus {version:number;epoch:number;available:boolean;enabled:boolean;reason:string;revokedOnRestart:boolean;activeCommands:number;unknownCommands:number;jobs:Array<{id:string;state:string;pid?:number}>;}
type RestrictedMode='readOnly'|'confirm'|'autoEdit';
interface PermissionStatus {mode:RestrictedMode|'fullAccess'|'legacy';version:number;epoch:number;available:boolean;reason:string;hostAccess:HostStatus;}
const modeLabels={readOnly:'只读',confirm:'变更前确认',autoEdit:'自动编辑',fullAccess:'完全访问',legacy:'现有受控工具'};
function permissionDialog(dialog:React.ReactNode){const boundary=<div onSubmit={event=>event.stopPropagation()}>{dialog}</div>;return typeof document==='undefined'?boundary:createPortal(boundary,document.body);}
export class HostAccessControl extends React.Component<{sessionId:string;archived:boolean;busy:boolean;perform:Perform},{status:HostStatus|null;permission:PermissionStatus|null;open:boolean;menuOpen:boolean;error:string;saving:boolean}> {
    state={status:null as HostStatus|null,permission:null as PermissionStatus|null,open:false,menuOpen:false,error:'',saving:false};
    private alive=true;private request=0;private timer?:ReturnType<typeof setInterval>;
    private trigger=React.createRef<HTMLButtonElement>();private menu=React.createRef<HTMLDivElement>();private dialogEnabled=false;
    componentDidMount(){void this.load();this.timer=setInterval(()=>{if(!this.state.saving)void this.load();},1500);window.addEventListener('resize',this.positionMenu);window.addEventListener('scroll',this.positionMenu,true);}
    componentWillUnmount(){this.alive=false;this.request++;clearInterval(this.timer);window.removeEventListener('resize',this.positionMenu);window.removeEventListener('scroll',this.positionMenu,true);}
    private positionMenu=()=>{const menu=this.menu.current,trigger=this.trigger.current;if(!menu?.matches(':popover-open')||!trigger)return;const width=document.documentElement.clientWidth,height=window.innerHeight;menu.style.width=Math.min(320,width-32)+'px';const r=trigger.getBoundingClientRect(),m=menu.getBoundingClientRect();const above=r.top-m.height-8,below=r.bottom+8;menu.style.left=Math.max(16,Math.min(r.left,width-m.width-16))+'px';menu.style.top=Math.max(16,Math.min(above>=16?above:below+m.height<=height-16?below:16,height-m.height-16))+'px';};
    private closeMenu=()=>{if(this.menu.current?.matches(':popover-open'))this.menu.current.hidePopover();};
    private showDetails=()=>{const status=this.state.status;if(!status)return;this.dialogEnabled=status.enabled;this.closeMenu();this.trigger.current?.focus();this.setState({open:true,error:''});};
    private menuKeys=(event:React.KeyboardEvent<HTMLDivElement>)=>{if(event.key==='Escape'){event.preventDefault();this.closeMenu();this.trigger.current?.focus();return;}if(event.key==='Tab'){this.closeMenu();this.trigger.current?.focus();return;}if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const items=Array.from(this.menu.current?.querySelectorAll<HTMLButtonElement>('button[role^="menuitem"]:not(:disabled)')??[]);if(!items.length)return;const current=items.indexOf(document.activeElement as HTMLButtonElement);const next=event.key==='Home'?0:event.key==='End'?items.length-1:(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus();};
    private async load(){const request=++this.request;try{const permission=await api<PermissionStatus>(`/sessions/${encodeURIComponent(this.props.sessionId)}/permissions`);if(this.alive&&request===this.request)this.setState({permission,status:permission.hostAccess});}catch(error){if(this.alive&&request===this.request)this.setState({status:null,permission:null,error:error instanceof Error?error.message:String(error)});}}
    private async saveMode(mode:RestrictedMode){const permission=this.state.permission,status=this.state.status;if(!permission||!status||this.state.saving||this.props.busy)return;this.closeMenu();this.trigger.current?.focus();if(permission.mode===mode)return;this.request++;this.setState({saving:true,error:''});await this.props.perform(async()=>{try{await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/permissions`,{mode,expectedVersion:permission.version,expectedHostVersion:status.version});}catch(error){if(this.alive)this.setState({error:error instanceof Error?error.message:String(error)});throw error;}finally{if(this.alive){this.setState({saving:false});await this.load();}}},'会话权限已更新为'+modeLabels[mode]);}
    private async save(enabled:boolean){const status=this.state.status;if(!status||this.state.saving||this.props.busy)return;if(enabled===status.enabled){this.setState({open:false,error:'权限状态已变化，请重新选择'});return;}this.request++;this.setState({saving:true,error:''});await this.props.perform(async()=>{try{await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/host-access`,{enabled,expectedVersion:status.version,...(enabled?{acknowledgedSameUserAccess:true,...(status.unknownCommands?{acknowledgedUnknownEffects:true}:{})}:{})});if(this.alive)this.setState({open:false});}catch(error){if(this.alive)this.setState({error:error instanceof Error?error.message:String(error)});throw error;}finally{if(this.alive){this.setState({saving:false});await this.load();}}},enabled?'已启用本机完全访问；不提供同用户隔离':'已撤销新宿主命令授权；受管命令正在停止');}
    render(){const {status,permission,open,menuOpen,error,saving}=this.state,menuId='host-permission-menu-'+this.props.sessionId,enabled=this.dialogEnabled,mode=permission?.mode??(status?.enabled?'fullAccess':'legacy');return <>
        <button ref={this.trigger} type="button" className={'host-access-trigger'+(status?.enabled?' enabled':'')} aria-label={'会话权限：'+modeLabels[mode]} aria-haspopup="menu" aria-expanded={menuOpen} aria-controls={menuId} popoverTarget={menuId} disabled={this.props.archived||!status||saving}><Icon name="cpu" size={13}/><span>{mode==='legacy'?'受控工具':modeLabels[mode]}</span><Icon name="chevron" size={11}/></button>
        <div ref={this.menu} id={menuId} popover="auto" role="menu" aria-label="会话权限" className="host-permission-menu" onKeyDown={this.menuKeys} onToggle={event=>{const opening=event.newState==='open';this.setState({menuOpen:opening});if(opening){this.positionMenu();this.menu.current?.querySelector<HTMLButtonElement>('button[role^="menuitem"]:not(:disabled)')?.focus();}}}>
            <div className="host-permission-heading"><strong>会话权限</strong><small>仅当前会话</small></div>
            <div role="group" aria-label="权限档位">
                {([{mode:'readOnly',icon:'book-open',description:'查看已有资料，不编辑、联网或执行'}, {mode:'confirm',icon:'settings',description:'变更与新联网请求先由你确认'}, {mode:'autoEdit',icon:'edit',description:'私有工作区自动编辑，执行仍需确认'}] as const).map(item=><button key={item.mode} type="button" role="menuitemradio" aria-checked={mode===item.mode} disabled={!permission?.available||saving||this.props.busy} className={'host-permission-row'+(mode===item.mode?' selected':'')} onClick={()=>{void this.saveMode(item.mode);}}><Icon name={item.icon}/><span className="host-permission-copy"><strong>{modeLabels[item.mode]}</strong><small>{item.description}</small></span>{mode===item.mode?<Icon name="check"/>:null}</button>)}
                <button type="button" role="menuitemradio" aria-checked={!!status?.enabled} disabled={!status||!status.available&&!status.enabled||saving||this.props.busy} onClick={this.showDetails} className={'host-permission-row'+(status?.enabled?' selected':'')}><Icon name="cpu"/><span className="host-permission-copy"><strong>完全访问</strong><small>本机文件、命令与网络 · 未隔离</small></span>{status?.enabled?<Icon name="check"/>:null}</button>
            </div>
            <div className="host-permission-footer"><span>当前：{modeLabels[mode]}</span><button type="button" role="menuitem" onClick={status?.enabled?this.showDetails:()=>{this.closeMenu();this.trigger.current?.focus();}} className="host-permission-secondary">{status?.enabled?'范围与撤销':'关闭'}</button></div>
            {permission&&!permission.available?<p className="host-permission-reason">{permission.reason}</p>:null}
            {status&&!status.available&&!status.enabled?<p className="host-permission-reason">{status.reason}</p>:null}{error?<p className="host-permission-reason" role="status">{error}</p>:null}
        </div>
        {open&&status?permissionDialog(<Modal title={enabled?'本机完全访问':'启用本机完全访问'} onClose={()=>{if(!saving)this.setState({open:false});}} onSubmit={()=>{void this.save(!enabled);}} submitLabel={enabled?'撤销完全访问':'启用完全访问'} busy={saving||this.props.busy||!enabled&&!status.available}>
            <p>使用当前系统用户权限内的真实文件、命令与普通网络。仅当前交互主会话使用，子任务和自动唤醒不继承。</p>
            <div className="host-access-notice"><strong>本机可信模式 · 未隔离</strong><p>命令也能接触该用户的应用数据、凭据、进程及第三方账户权限。不能保证应用审批数据与本机命令隔离。</p></div>
            <p className="small muted">撤销会拒绝新命令并停止能跟踪的进程；无法撤回已经写入的文件、发出的请求或保证清除脱管进程。服务重启后需要重新启用。</p>
            {status.revokedOnRestart?<p className="host-access-note">上次授权不属于当前执行端，需要重新启用；历史记录已保留。</p>:null}
            {status.activeCommands?<p role="status">{status.activeCommands} 条受管命令正在执行或停止。</p>:null}
            {status.unknownCommands?<p className="host-access-note" role="status">{status.unknownCommands} 条历史命令退出状态未确认，请核对原进程与外部效果后决定是否继续。</p>:null}
            {status.jobs.filter(job=>job.state==='unknown').map(job=><p className="small muted" key={job.id}>命令 {job.id.slice(0,8)} · PID {job.pid??'无法确认'}</p>)}
            {!enabled?<label className="host-access-ack"><input type="checkbox" required aria-label="接受本机完全访问的未隔离范围"/>我理解本机未隔离及同用户数据可达，并为此会话启用。</label>:null}
            {!enabled&&status.unknownCommands?<label className="host-access-ack"><input type="checkbox" required aria-label="已核对未知命令的进程和外部效果"/>我已核对上述未知命令的原进程及外部效果，并明确允许新的执行。</label>:null}
            {!status.available&&!status.enabled?<p role="alert">{status.reason}</p>:null}
            {error?<p className="error-text" role="alert">{error}</p>:null}
        </Modal>):null}
    </>;
    }
}
