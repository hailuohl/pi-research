import * as React from 'react';
import {api,ApiError} from './api.js';
import {Icon,SectionTitle,Modal} from './ui.js';

interface EnvironmentViewData {version:number;scope:'local';variables:Array<{name:string;hasValue:boolean}>;}
interface State {data:EnvironmentViewData|null;loading:boolean;busy:boolean;error:string;message:string;editing:boolean;replacing:boolean;name:string;value:string;showValue:boolean;deleting:string;}
export class EnvironmentView extends React.Component<{},State> {
 state:State={data:null,loading:false,busy:false,error:'',message:'',editing:false,replacing:false,name:'',value:'',showValue:false,deleting:''};
 private disposed=false;
 private epoch=0;
 private mutation?:{body:string;key:string};
 componentDidMount(){void this.load();}
 componentWillUnmount(){this.disposed=true;this.epoch++;this.mutation=undefined;this.state.value='';}
 private safe(data:EnvironmentViewData):EnvironmentViewData {return {version:data.version,scope:'local',variables:data.variables.map(({name,hasValue})=>({name,hasValue}))};}
 async load(){
  if(this.state.busy)return;
  const epoch=++this.epoch;this.setState({loading:true,error:''});
  try{const data=this.safe(await api<EnvironmentViewData>('/settings/environment'));if(!this.disposed&&epoch===this.epoch)this.setState({data});}
  catch(error){if(!this.disposed&&epoch===this.epoch)this.setState({error:error instanceof Error?error.message:String(error)});}
  finally{if(!this.disposed&&epoch===this.epoch)this.setState({loading:false});}
 }
 edit(name=''){if(this.state.busy)return;this.mutation=undefined;this.setState({editing:true,replacing:!!name,name,value:'',showValue:false,error:'',message:''});}
 close(){if(!this.state.busy){this.mutation=undefined;this.setState({editing:false,value:'',showValue:false,deleting:'',error:''});}}
 async save(action:'set'|'delete'){
  if(this.state.busy||this.state.loading||!this.state.data)return;
  const name=action==='delete'?this.state.deleting:this.state.name.trim();
  if(action==='set'&&(!/^[A-Z_][A-Z0-9_]{0,127}$/.test(name)||!this.state.value)){this.setState({error:'请输入有效变量名和非空的值。'});return;}
  if(action==='set'&&!this.state.replacing&&this.state.data.variables.some(row=>row.name===name)){this.setState({error:'变量已存在，请选择“替换”修改它的值。'});return;}
  const request={action,expectedVersion:this.state.data.version,name,...(action==='set'?{value:this.state.value}:{})},body=JSON.stringify(request);
  if(this.mutation?.body!==body)this.mutation={body,key:crypto.randomUUID()};
  this.epoch++;this.setState({busy:true,error:'',message:''});
  try{
   const data=this.safe(await api<EnvironmentViewData>('/settings/environment',request,'POST',undefined,this.mutation.key));
   this.mutation=undefined;if(!this.disposed)this.setState({data,editing:false,deleting:'',value:'',showValue:false,message:action==='set'?'变量已保存，供新启动的本地任务使用。':'变量已删除，新启动的本地任务不再使用它。'});
  }catch(error){if(!this.disposed){if(error instanceof ApiError&&error.code==='VERSION_CONFLICT')this.mutation=undefined;this.setState({error:error instanceof Error?error.message:String(error)});}}
  finally{if(!this.disposed)this.setState({busy:false});}
 }
 render(){
  const {data,loading,busy,error,message,editing,replacing,name,value,showValue,deleting}=this.state;
  return <div className="page-scroll environment-page"><SectionTitle title="环境" sub="为本地运行和研究智能体设置变量。"><button className="primary" disabled={!data||loading||busy} onClick={()=>this.edit()}><Icon name="plus" size={16}/>添加变量</button></SectionTitle>
   <p className="environment-description">在这里保存 API 密钥、访问令牌和运行参数。新启动的本地任务会读取已保存的变量。</p>
   <section className="environment-table-wrap surface" aria-label="环境变量"><div className="environment-table-toolbar"><span>{data?`${data.variables.length} 个变量`:'环境变量'}</span><button className="text-button" disabled={loading||busy} onClick={()=>void this.load()}>{loading?'正在读取…':'刷新'}</button></div>
    {data?<table className="environment-table"><thead><tr><th scope="col">变量名</th><th scope="col">值</th><th scope="col"><span className="sr-only">操作</span></th></tr></thead><tbody>{data.variables.length?data.variables.map(row=><tr key={row.name}><th scope="row"><code>{row.name}</code></th><td><span className="environment-masked" aria-label="值已保存并隐藏">••••••••</span><span className="environment-set">已设置</span></td><td><div className="actions"><button className="text-button" aria-label={`替换 ${row.name} 的值`} disabled={busy||loading} onClick={()=>this.edit(row.name)}>替换</button><button className="text-button" aria-label={`删除 ${row.name}`} disabled={busy||loading} onClick={()=>this.setState({deleting:row.name,error:'',message:''})}>删除</button></div></td></tr>):<tr><td colSpan={3} className="environment-empty"><strong>还没有环境变量</strong><p>添加一个变量，让本地任务使用你的 API 密钥或令牌。</p><code>例如 HF_TOKEN、WANDB_API_KEY、MY_API_KEY</code></td></tr>}</tbody></table>:<p className="environment-empty" role="status">{loading?'正在读取环境变量…':'环境变量尚未加载，请重试。'}</p>}
   </section><p className="small muted environment-note">适用于本机研究智能体、已授权的本机命令和本地运行。保存的值不会回显；修改值时请重新输入。正在运行的任务继续使用启动时的变量。</p>
   {error&&!editing&&!deleting?<p className="error-text" role="alert">{error}</p>:null}{message?<p className="environment-message" role="status"><Icon name="check" size={16}/>{message}</p>:null}
   {editing?<Modal title={replacing?'替换变量值':'添加环境变量'} submitLabel="保存变量" busy={busy} onClose={()=>this.close()} onSubmit={()=>void this.save('set')}><label>变量名<input name="name" aria-label="变量名" autoComplete="off" spellCheck={false} required pattern="[A-Z_][A-Z0-9_]*" maxLength={128} placeholder="MY_API_KEY" readOnly={replacing} disabled={busy} value={name} onChange={event=>this.setState({name:event.target.value})}/></label><label>变量值<input name="value" aria-label="变量值" type={showValue?'text':'password'} autoComplete="new-password" spellCheck={false} required maxLength={8192} disabled={busy} value={value} onChange={event=>this.setState({value:event.target.value})}/></label><label className="environment-show-value"><input type="checkbox" checked={showValue} disabled={busy} onChange={event=>this.setState({showValue:event.target.checked})}/>显示本次输入的值</label><p className="small muted">变量名使用大写字母、数字和下划线；以字母或下划线开头。系统路径和运行时控制变量不能在这里覆盖。</p>{error?<p role="alert" className="error-text">{error} 当前输入保留。</p>:null}{error?<button type="button" className="secondary" disabled={loading||busy} onClick={()=>void this.load()}>刷新变量列表，保留输入</button>:null}</Modal>:null}
   {deleting?<Modal title="删除环境变量" submitLabel="删除变量" busy={busy} onClose={()=>this.close()} onSubmit={()=>void this.save('delete')}><p>删除 <strong><code>{deleting}</code></strong> 后，新启动的本地任务将不再使用它。</p>{error?<p role="alert" className="error-text">{error}</p>:null}</Modal>:null}
  </div>;
 }
}
