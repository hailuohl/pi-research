import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {App} from '../../dist/web/assets/app.js';
import {ConversationResources} from '../../dist/web/assets/conversation-resources.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const data=()=>({project:{id:'p',name:'Project',settings:{enabled:false}},sessions:[{id:'s',projectId:'p',role:'coordinator',state:'idle',model:{}}],experiments:[],runs:[],teams:[],campaigns:[],wakeups:[],intents:[],artifacts:[],evidence:[],claims:[],reports:[]});
const app=()=>{const view=synchronousState(new App({}));Object.assign(view.state,{boot:{projects:[{id:'p'}],runtime:{ready:true}},data:data(),projectId:'p',sessionId:'s'});return view;};
const chat=view=>elements(view.render()).find(node=>node.type?.name==='Chat');

test('old resource page selections reopen in the same conversation and keep fixed history targets',t=>{
    const storage=globalThis.localStorage;t.after(()=>{globalThis.localStorage=storage;});
    for(const tab of ['literature','evidence','reports']){
        globalThis.localStorage={getItem:()=>JSON.stringify({projectId:'p',sessionId:'s',tab,selectedReport:'report',selectedDiscoveryGrant:'grant',selectedDocument:{documentVersionId:'doc',parseResultId:'parse',pageNumber:2}})};
        const view=new App({});assert.equal(view.state.tab,'chat');assert.equal(view.state.resourceTab,tab);assert.equal(view.state.sessionId,'s');assert.equal(view.state.selectedReport,'report');assert.equal(view.state.selectedDiscoveryGrant,'grant');assert.deepEqual(view.state.selectedDocument,{documentVersionId:'doc',parseResultId:'parse',pageNumber:2});view.componentWillUnmount();
    }
    globalThis.localStorage={getItem:()=>JSON.stringify({tab:'chat',resourceTab:'reports',selectedReport:'report'})};
    const reopened=new App({});assert.equal(reopened.state.resourceTab,'reports');assert.equal(reopened.state.selectedReport,'report');reopened.componentWillUnmount();
    globalThis.localStorage={getItem:()=>JSON.stringify({tab:'chat',resourceTab:'unknown'})};assert.equal(new App({}).state.resourceTab,'');
});

test('the header has no workspace menu and opening resources retains the Chat draft and queue',()=>{
    const view=app(),before=chat(view),instance=synchronousState(new before.type(before.props));instance.state.draft='unsent question';instance.state.attachments=[{documentVersionId:'draft-doc'}];
    view.state.pendingMessages=[{id:'queued'}];view.state.messages=[{id:'saved'}];
    assert.equal(elements(view.render()).some(node=>node.props?.id==='workspace-tool-menu'),false);
    before.props.resources.props.onView('reports');const after=chat(view);instance.props=after.props;
    assert.equal(after.key,before.key);assert.equal(view.state.tab,'chat');assert.equal(view.state.resourceTab,'reports');assert.equal(instance.state.draft,'unsent question');assert.deepEqual(instance.state.attachments,[{documentVersionId:'draft-doc'}]);assert.deepEqual(view.state.pendingMessages,[{id:'queued'}]);assert.deepEqual(view.state.messages,[{id:'saved'}]);
    assert.ok(elements(view.render()).some(node=>node.props?.onClick&&node.props.children?.[1]?.props?.children==='项目工作区'));
    instance.componentWillUnmount();view.componentWillUnmount();
});

test('manual authority remains in existing views and document references return to the conversation',()=>{
    const view=app(),resources=chat(view).props.resources,views=resources.props.views;
    assert.equal(views.literature.type.name,'LiteratureView');assert.equal(views.evidence.type.name,'EvidenceView');assert.equal(views.reports.type.name,'ReportsView');
    const target={documentVersionId:'doc',parseResultId:'parse',pageNumber:4,start:8,end:20};views.reports.props.onDocument(target);
    assert.equal(view.state.tab,'chat');assert.equal(view.state.resourceTab,'literature');assert.deepEqual(view.state.selectedDocument,target);
    views.evidence.props.onDocument({...target,pageNumber:5});assert.equal(view.state.selectedDocument.pageNumber,5);
    views.reports.props.onSelect('fixed-report');assert.equal(view.state.selectedReport,'fixed-report');views.literature.props.onSelectDiscoveryGrant('fixed-grant');assert.equal(view.state.selectedDiscoveryGrant,'fixed-grant');
    views.evidence.props.onRegister('artifact','fixed source');assert.equal(view.state.modal,'evidence');assert.deepEqual(view.state.modalData,{artifactId:'artifact',content:'fixed source'});view.componentWillUnmount();
});

test('closing resource inspection preserves visited editors and nested toggles do not close the region',()=>{
    const views={literature:{type:'div',props:{children:'literature editor'}},evidence:{type:'div',props:{children:'evidence index'}},reports:{type:'div',props:{children:'report editor'}}},changes=[];
    const panel=synchronousState(new ConversationResources({view:'literature',onView:view=>changes.push(view),views}));
    const frame=panel.render(),target={};frame.props.onToggle({target,currentTarget:target,newState:'closed'});assert.deepEqual(changes,['']);
    frame.props.onToggle({target:{},currentTarget:target,newState:'closed'});assert.deepEqual(changes,['']);
    panel.props={...panel.props,view:'reports'};Object.assign(panel.state,ConversationResources.getDerivedStateFromProps(panel.props,panel.state));
    let sections=elements(panel.render()).filter(node=>node.type==='section');assert.equal(sections.length,2);assert.equal(sections.find(node=>node.key==='reports').props.hidden,false);assert.equal(sections.find(node=>node.key==='literature').props.hidden,true);
    panel.props={...panel.props,view:''};assert.equal(ConversationResources.getDerivedStateFromProps(panel.props,panel.state),null);sections=elements(panel.render()).filter(node=>node.type==='section');assert.equal(sections.length,2);assert.ok(sections.every(node=>node.props.hidden));
    panel.render().props.onToggle({target,currentTarget:target,newState:'open'});assert.deepEqual(changes,['','literature']);
});
