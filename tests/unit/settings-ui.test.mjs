import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {SettingsView,ModelManagementPanel} from '../../dist/web/assets/settings-view.js';
import {GitHubSettings} from '../../dist/web/assets/github-controls.js';
import {TemplateLibraryView} from '../../dist/web/assets/template-library-view.js';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const find=(tree,predicate)=>elements(tree).find(predicate);
const boot={model:{provider:'first',model:'default',thinking:'low'},models:[],modelVersion:1,runtime:{ready:true}};
test('model and template sections preserve the mounted management, GitHub and template components',()=>{
 const settings=synchronousState(new SettingsView({boot,projectId:'project',perform:async fn=>fn()})),panelElement=find(settings.render(),node=>node.type===ModelManagementPanel),panel=synchronousState(new ModelManagementPanel(panelElement.props));
 panel.updateProvider({name:'Unsaved connection',apiKey:'FAKE_draft_key'});
 assert.equal(find(settings.render(),node=>node.type===GitHubSettings).props.active,false);
 const nav=find(settings.render(),node=>node.type==='nav'&&node.props['aria-label']==='设置分区');assert.equal(elements(nav).filter(node=>node.type==='button').length,4);
 for(const id of ['github','templates','sources','models']){find(settings.render(),node=>node.props['aria-controls']===`settings-${id}`).props.onClick();const tree=settings.render();assert.equal(find(tree,node=>node.props.id===`settings-${id}`).props.hidden,false);assert.ok(find(tree,node=>node.type===ModelManagementPanel));assert.ok(find(tree,node=>node.type===GitHubSettings));assert.equal(find(tree,node=>node.type===GitHubSettings).props.active,id==='github');assert.ok(find(tree,node=>node.type===TemplateLibraryView));assert.equal(panel.providerDraft().name,'Unsaved connection');assert.equal(panel.providerDraft().apiKey,'FAKE_draft_key');}
 assert.match(JSON.stringify(settings.render()),/模型与模板/);assert.doesNotMatch(JSON.stringify(settings.render()),/能力与验收矩阵/);
});
