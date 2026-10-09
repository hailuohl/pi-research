import * as React from 'react';
import type {Bootstrap,Row,Session} from './models.js';
import type {Perform} from './workbench.js';
import {Icon,SectionTitle} from './ui.js';
import {GitHubSettings} from './github-controls.js';
import {TemplateLibraryView} from './template-library-view.js';
import {ModelManagementPanel} from './model-management-view.js';
export {ModelManagementPanel} from './model-management-view.js';

export class SettingsView extends React.Component<{boot:Bootstrap;readOnly?:boolean;projectId?:string;session?:Row<Session>;perform:Perform},{section:string}> {
 state={section:'models'};
 render(){return <div className="page-scroll settings-page"><div className="settings-workspace"><SectionTitle title="模型与模板" sub="管理模型、连接测试、GitHub 同步与个人文稿模板。"/>
  <nav className="settings-sections" aria-label="设置分区">{[{id:'models',title:'模型管理',icon:'cpu'},{id:'github',title:'GitHub 状态',icon:'branch'},{id:'templates',title:'文稿模板库',icon:'book-open'}].map(section=><button key={section.id} type="button" aria-pressed={this.state.section===section.id} aria-controls={`settings-${section.id}`} onClick={()=>this.setState({section:section.id})}><Icon name={section.icon} size={16}/>{section.title}</button>)}</nav>
  <div id="settings-models" className="settings-panel" hidden={this.state.section!=='models'}><ModelManagementPanel boot={this.props.boot} perform={this.props.perform}/></div>
  <div id="settings-github" className="settings-panel" hidden={this.state.section!=='github'}><GitHubSettings readOnly={this.props.readOnly} projectId={this.props.projectId}/></div>
  <div id="settings-templates" className="settings-panel" hidden={this.state.section!=='templates'}><TemplateLibraryView/></div>
 </div></div>;}
}