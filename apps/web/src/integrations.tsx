import * as React from 'react';
import {SectionTitle,Icon} from './ui.js';
import {SkillManager} from './skill-manager.js';
import {ComputeConnections} from './compute-connections.js';

type Panel='skills'|'connectors';
export class IntegrationsView extends React.Component<{projectId:string;sessionId?:string;refreshToken?:unknown;readOnly?:boolean;onLiterature?:()=>void},{activePanel:Panel;connectionsVisited:boolean}>{
 state={activePanel:'skills' as Panel,connectionsVisited:false};
 private panelId(panel:Panel){return `integrations-${this.props.projectId}-${panel}`;}
 private setPanel(panel:Panel,focus=false){this.setState({activePanel:panel,connectionsVisited:this.state.connectionsVisited||panel==='connectors'},()=>{if(focus)document.getElementById(this.panelId(panel)+'-tab')?.focus();});}
 private tabKey(e:React.KeyboardEvent<HTMLButtonElement>,panel:Panel){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.setPanel(panel==='skills'?'connectors':'skills',true);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();this.setPanel(e.key==='Home'?'skills':'connectors',true);}}
 render(){const s=this.state;return <div className="page-scroll integrations-page"><div className="integration-workspace">
  <SectionTitle title="技能与连接器" sub={s.activePanel==='skills'?'浏览研究方法，上传后即可在新会话使用。':'查看本地计算资源，管理 Docker 与 SSH 连接。'}/>
  <div className="integration-tabs" role="tablist" aria-label="技能与连接器分类">{(['skills','connectors'] as const).map(panel=><button key={panel} type="button" role="tab" id={this.panelId(panel)+'-tab'} aria-controls={this.panelId(panel)} aria-selected={s.activePanel===panel} tabIndex={s.activePanel===panel?0:-1} onClick={()=>this.setPanel(panel)} onKeyDown={e=>this.tabKey(e,panel)}><Icon name={panel==='skills'?'skills':'link'}/>{panel==='skills'?'技能':'连接器'}</button>)}</div>
  <section className="integration-panel" id={this.panelId('skills')} role="tabpanel" aria-labelledby={this.panelId('skills')+'-tab'} hidden={s.activePanel!=='skills'}><SkillManager key={this.props.projectId} projectId={this.props.projectId} sessionId={this.props.sessionId} refreshToken={this.props.refreshToken} readOnly={this.props.readOnly}/></section>
  <section className="integration-panel" id={this.panelId('connectors')} role="tabpanel" aria-labelledby={this.panelId('connectors')+'-tab'} hidden={s.activePanel!=='connectors'}>{s.connectionsVisited?<ComputeConnections key={this.props.projectId} projectId={this.props.projectId} active={s.activePanel==='connectors'} refreshToken={this.props.refreshToken} readOnly={this.props.readOnly}/>:null}</section>
 </div></div>;}
}
