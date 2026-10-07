import * as React from 'react';
import {api} from './api.js';
import {Modal,nativeSelectButton} from './ui.js';
import type {GitHubStatus,ProjectGitHubStatus} from '../../../dist/packages/workspace/github-types.js';

export interface NewProjectInput {name:string;description:string;template:string;github?:{enabled:true;expectedAccountId:number};}
const statusNames:Record<string,string>={local:'仅本地',queued:'等待上传',creating:'正在创建仓库',uploading:'正在上传',synced:'已同步',failed:'同步失败',unknown:'正在等待核对',paused:'已暂停'};
function GitHubReadiness({status,error}:{status:GitHubStatus|null;error:string}){
 return <div aria-live="polite"><p className="small muted">{error||status?.message||'正在检测本机 GitHub CLI…'}</p>{status?.account?<p className="small muted">GitHub 账号：{status.account.login}</p>:null}{status&&!status.cliInstalled?<p className="small muted">安装 <a href="https://cli.github.com/" target="_blank" rel="noreferrer">GitHub CLI</a> 后可启用上传；本地项目始终可用。</p>:null}{status?.state==='unauthenticated'?<p className="small muted">登录命令：<code>gh auth login</code></p>:null}</div>;
}

export class ProjectCreationModal extends React.Component<{busy:boolean;onClose:()=>void;onCreate:(input:NewProjectInput,key:string)=>Promise<unknown>},{status:GitHubStatus|null;upload:boolean;error:string}> {
 state={status:null as GitHubStatus|null,upload:false,error:''};
 private mounted=false;private epoch=0;private requestKey=crypto.randomUUID();
 private onFocus=()=>{void this.loadStatus();};
 componentDidMount(){this.mounted=true;window.addEventListener('focus',this.onFocus);void this.loadStatus();}
 componentWillUnmount(){this.mounted=false;this.epoch++;window.removeEventListener('focus',this.onFocus);}
 async loadStatus(){const epoch=++this.epoch;try{const status=await api<GitHubStatus>('/github/status');if(this.mounted&&epoch===this.epoch)this.setState({status,error:''});}catch(e){if(this.mounted&&epoch===this.epoch)this.setState({status:null,error:String(e)});}}
 changed(){this.requestKey=crypto.randomUUID();}
 async submit(fd:FormData){
  const {status,upload}=this.state;
  if(upload&&(!status?.ready||!status.account)){this.setState({error:'GitHub CLI 尚未就绪。请取消勾选以创建本地项目，或完成登录后返回。'});return;}
  const input:NewProjectInput={name:String(fd.get('name')??''),description:String(fd.get('description')??''),template:String(fd.get('template')??'empty'),...(upload?{github:{enabled:true as const,expectedAccountId:status!.account!.id}}:{})};
  try{await this.props.onCreate(input,this.requestKey);}catch(e){if(this.mounted)this.setState({error:String(e)});}
 }
 render(){const s=this.state;return <Modal title="新建项目" submitLabel="创建项目" busy={this.props.busy} onClose={this.props.onClose} onSubmit={fd=>void this.submit(fd)}><div onChange={()=>this.changed()}><label>项目名称<input aria-label="项目名称" name="name" required maxLength={120} disabled={this.props.busy} placeholder="例如：材料筛选研究"/></label><label>项目说明<textarea name="description" disabled={this.props.busy} placeholder="研究目标、范围或输入资料"/></label><label>项目模板<select aria-label="项目模板" name="template" defaultValue="curve-fit" disabled={this.props.busy}>{nativeSelectButton}<option value="curve-fit">真实曲线拟合示例 · 可直接运行</option><option value="empty">空项目 · 自行准备文件</option></select></label><p className="small muted">曲线拟合是用于验证系统的固定数值示例。</p><label className="check-label"><input type="checkbox" aria-label="创建 GitHub 私密仓库并自动同步已提交源码及其 Git 历史" checked={s.upload} disabled={this.props.busy||(!s.status?.ready&&!s.upload)} onChange={e=>{if(!e.target.checked||s.status?.ready)this.setState({upload:e.target.checked});}}/>创建 GitHub 私密仓库并自动同步已提交源码及其 Git 历史</label><p className="small muted">默认仅本地保存。仓库使用项目名或中文拼音；重名自动加 -1、-2。数据库、会话和独立科研资料留在本地。</p><GitHubReadiness status={s.status} error={s.error}/></div></Modal>;}
}

export class GitHubSettings extends React.Component<{projectId?:string},{status:GitHubStatus|null;project:ProjectGitHubStatus|null;statusError:string;error:string;busy:boolean}> {
 state={status:null as GitHubStatus|null,project:null as ProjectGitHubStatus|null,statusError:'',error:'',busy:false};
 private mounted=false;private cliEpoch=0;private projectEpoch=0;private timer?:ReturnType<typeof setTimeout>;private mutation?:{action:string;version:number;key:string};
 private onFocus=()=>{void this.loadStatus();void this.loadProject();};
 componentDidMount(){this.mounted=true;window.addEventListener('focus',this.onFocus);this.onFocus();}
 componentDidUpdate(prev:Readonly<GitHubSettings['props']>){if(prev.projectId!==this.props.projectId){this.projectEpoch++;clearTimeout(this.timer);this.mutation=undefined;this.setState({project:null,error:'',busy:false});void this.loadProject();}}
 componentWillUnmount(){this.mounted=false;this.cliEpoch++;this.projectEpoch++;clearTimeout(this.timer);window.removeEventListener('focus',this.onFocus);}
 async loadStatus(){const epoch=++this.cliEpoch;try{const status=await api<GitHubStatus>('/github/status');if(this.mounted&&epoch===this.cliEpoch)this.setState({status,statusError:''});}catch(e){if(this.mounted&&epoch===this.cliEpoch)this.setState({status:null,statusError:String(e)});}}
 async loadProject(){
  clearTimeout(this.timer);const pid=this.props.projectId,epoch=++this.projectEpoch;if(!pid)return;
  try{const project=await api<ProjectGitHubStatus>(`/projects/${encodeURIComponent(pid)}/github`);if(!this.mounted||epoch!==this.projectEpoch||pid!==this.props.projectId)return;this.setState({project});if(['queued','creating','uploading'].includes(project.state))this.timer=setTimeout(()=>void this.loadProject(),2000);}
  catch(e){if(this.mounted&&epoch===this.projectEpoch)this.setState({error:String(e)});}
 }
 async change(action:'pause'|'resume'|'retry'){
  const p=this.state.project,pid=this.props.projectId;if(!p||!pid||this.state.busy)return;
  if(action!=='pause'&&!this.state.status?.ready){this.setState({error:'请先使本机 GitHub CLI 就绪。'});return;}
  if(this.mutation?.action!==action||this.mutation.version!==p.version)this.mutation={action,version:p.version,key:crypto.randomUUID()};
  const key=this.mutation.key;this.setState({busy:true,error:''});
  try{await api(`/projects/${encodeURIComponent(pid)}/github${action==='retry'?'/retry':''}`,{expectedVersion:p.version,...(action!=='retry'?{enabled:action==='resume'}:{})},'POST',undefined,key);}
  catch(e){if(this.mounted&&pid===this.props.projectId)this.setState({error:String(e)});}
  finally{if(this.mounted&&pid===this.props.projectId){this.setState({busy:false});await this.loadProject();}}
 }
 render(){const {status,project:p}=this.state,accountChanged=!!(p?.account&&status?.account&&p.account.id!==status.account.id);return <section className="surface settings-model" aria-label="GitHub 状态"><div className="surface-heading"><h2>GitHub</h2><span className={'connection-state '+(status?.ready?'ready':'')}>{status?.ready?'已就绪':'尚未就绪'}</span></div>{status?<p className="small muted">Git {status.gitInstalled?'已安装':'未安装'} · GitHub CLI {status.cliInstalled?(status.version??'已安装'):'未安装'}</p>:null}<GitHubReadiness status={status} error={this.state.statusError}/>{p?<div><p>当前项目：{statusNames[p.state]??p.state}{p.pendingCount>0?` · ${p.pendingCount} 项待同步`:''}</p>{p.repository?<p><a className="code-wrap" href={p.repository.url} target="_blank" rel="noreferrer">{p.repository.fullName}</a> · 私密仓库</p>:null}{accountChanged?<p role="alert">此项目绑定 {p.account!.login}，请切换到该 GitHub 账号。</p>:null}{p.error?<p role="alert">{p.error.message}</p>:null}{p.state!=='local'?<div className="actions wrap"><button type="button" className="secondary" disabled={this.state.busy||(!p.enabled&&(!status?.ready||accountChanged))} onClick={()=>void this.change(p.enabled?'pause':'resume')}>{p.enabled?'暂停 GitHub 同步':'恢复 GitHub 同步'}</button>{p.retryable&&p.enabled?<button type="button" className="secondary" disabled={this.state.busy||!status?.ready||accountChanged} onClick={()=>void this.change('retry')}>重试同步</button>:null}</div>:null}{!p.enabled&&p.state!=='local'?<p className="small muted">暂停不删除远端内容；恢复后同步新提交，新提交会包含其所依赖的 Git 历史。</p>:null}</div>:null}{this.state.error?<p role="alert">{this.state.error}</p>:null}</section>;}
}
