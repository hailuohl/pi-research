import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Inspector} from '../../dist/web/assets/workbench.js';

// Minimal host DOM for real React reconciliation; layout and native select behavior need browser acceptance.
class HostNode {
 constructor(nodeType,nodeName,ownerDocument,text=''){
  Object.assign(this,{nodeType,nodeName,tagName:nodeName,ownerDocument,parentNode:null,childNodes:[],attributes:{},style:{},namespaceURI:'http://www.w3.org/1999/xhtml',text});
 }
 appendChild(node){if(node.parentNode)node.parentNode.removeChild(node);this.childNodes.push(node);node.parentNode=this;return node;}
 insertBefore(node,before){if(node.parentNode)node.parentNode.removeChild(node);const index=this.childNodes.indexOf(before);assert.ok(index>=0);this.childNodes.splice(index,0,node);node.parentNode=this;return node;}
 removeChild(node){const index=this.childNodes.indexOf(node);assert.ok(index>=0);this.childNodes.splice(index,1);node.parentNode=null;return node;}
 setAttribute(name,value){this.attributes[name]=String(value);}
 removeAttribute(name){delete this.attributes[name];}
 addEventListener(){}
 removeEventListener(){}
 closest(tag){for(let node=this;node;node=node.parentNode)if(node.tagName===tag.toUpperCase())return node;return null;}
 querySelector(tag){return descendants(this).slice(1).find(node=>node.tagName===tag.toUpperCase())??null;}
 get options(){return descendants(this).filter(node=>node.tagName==='OPTION');}
 get firstChild(){return this.childNodes[0]??null;}
 get lastChild(){return this.childNodes.at(-1)??null;}
 get nextSibling(){const siblings=this.parentNode?.childNodes??[];return siblings[siblings.indexOf(this)+1]??null;}
 get nodeValue(){return this.text;}
 set nodeValue(value){this.text=String(value);}
 get textContent(){return this.text+this.childNodes.map(node=>node.textContent).join('');}
 set textContent(value){for(const node of this.childNodes)node.parentNode=null;this.text=String(value);this.childNodes=[];}
}
const descendants=node=>[node,...node.childNodes.flatMap(descendants)];
const outcomeParagraphs=node=>descendants(node).filter(child=>child.tagName==='P'&&child.textContent.startsWith('问题回答状态：'));
const reviewCards=node=>descendants(node).filter(child=>child.attributes.class==='approval-card');
const contract={command:['python','experiment.py'],runner:'local',datasetVersion:'fixed',metrics:{score:{direction:'max',unit:'fraction'}}};
const experiment={id:'experiment',title:'Regression fixture',revision:1,lifecycle:'frozen',hypothesis:'Fixed question',contract};
const run=(id,fields={})=>({id,experimentId:experiment.id,version:1,state:'succeeded',integrity:'complete',judgment:'pending',createdAt:'2026-10-11T00:00:00Z',artifactIds:[],manifest:{snapshotDigest:`source-${id}`,experimentRevision:1,contract},metrics:{score:0.9},...fields});

function host(t){
 const document=new HostNode(9,'#document',null);document.ownerDocument=document;
 document.createElement=name=>new HostNode(1,name.toUpperCase(),document);
 document.createElementNS=(namespace,name)=>{const node=document.createElement(name);node.namespaceURI=namespace;return node;};
 document.createTextNode=text=>new HostNode(3,'#text',document,String(text));
 document.documentElement=document.createElement('html');document.body=document.createElement('body');document.head=document.createElement('head');document.activeElement=document.body;
 const window={document,HTMLIFrameElement:class{},HTMLElement:HostNode,addEventListener(){},removeEventListener(){},setInterval(){return 0;}};document.defaultView=window;
 const calls=[];
 for(const [name,value]of Object.entries({document,window,getComputedStyle:()=>({appearance:'auto'}),fetch:async(url,options)=>{
  calls.push({url,method:options.method});assert.match(url,/^\/api\/runs\/[^/]+\/logs\?/);assert.equal(options.method,'GET');
  return {ok:true,json:async()=>({content:'',cursor:0,start:0,size:0,complete:true,identity:'fixture'})};
 }})){
  const previous=Object.getOwnPropertyDescriptor(globalThis,name);Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
  t.after(()=>{if(previous)Object.defineProperty(globalThis,name,previous);else delete globalThis[name];});
 }
 return {document,calls};
}
function mount(t,document){
 const container=document.createElement('div'),root=createRoot(container);let closed=false;
 const close=()=>{if(!closed){flushSync(()=>root.unmount());closed=true;}};t.after(close);
 const render=(runs,selectedRun)=>{
  const data={project:{id:'project',archived:false,settings:{enabled:false}},experiments:[experiment],runs,artifacts:[],teams:[],tasks:[],budgets:[],approvals:[]};
  flushSync(()=>root.render(createElement(Inspector,{data,boot:{},tab:'experiments',embedded:true,sessionId:'root',experiment,selectedRun,perform(){assert.fail('rendering must not execute an action');},onConfig(){},onRun(){}})));
 };
 return {container,render,close};
}

test('Run detail polling keeps one current outcome, retains history, and clears old cards on selection or reopen',async t=>{
 const {document,calls}=host(t);
 for(const [name,fields,paragraph,card]of [
  ['success',{state:'succeeded'},'问题回答状态：已有结果，源码受保护',0],
  ['answered failure',{state:'failed',metrics:undefined,answerDisposition:'answered'},'问题回答状态：已有结果，源码受保护',0],
  ['unanswered failure',{state:'failed',metrics:undefined,answerDisposition:'unanswered'},'问题回答状态：用户确认未回答，可准备有界修复',0],
  ['unreviewed failure',{state:'failed',metrics:undefined,answerDisposition:'needs_review'},null,1],
  ['cancelled before start',{state:'cancelled',metrics:undefined},'问题回答状态：用户确认未回答，可准备有界修复',0],
  ['unknown',{state:'unknown',metrics:undefined},null,0]
 ])await t.test(name,async t=>{
  const view=mount(t,document),history=[run('older',{metrics:undefined,state:'failed',answerDisposition:'needs_review'}),run('selected',fields)],before=structuredClone(history);
  for(let poll=0;poll<100;poll++){
   view.render(structuredClone(history),'selected');
   assert.deepEqual(outcomeParagraphs(view.container).map(node=>node.textContent),paragraph?[paragraph]:[]);
   assert.equal(reviewCards(view.container).length,card);
  }
  view.render(structuredClone(history),'older');assert.equal(outcomeParagraphs(view.container).length,0);assert.equal(reviewCards(view.container).length,1);
  view.render(structuredClone(history),'selected');assert.deepEqual(outcomeParagraphs(view.container).map(node=>node.textContent),paragraph?[paragraph]:[]);assert.equal(reviewCards(view.container).length,card);
  const updated=structuredClone(history);updated[1]=run('selected',{state:'failed',metrics:undefined,answerDisposition:'unanswered',version:2});
  view.render(updated,'selected');assert.deepEqual(outcomeParagraphs(view.container).map(node=>node.textContent),['问题回答状态：用户确认未回答，可准备有界修复']);assert.equal(reviewCards(view.container).length,0);
  view.close();assert.equal(view.container.childNodes.length,0);
  const reopened=mount(t,document);reopened.render(structuredClone(history),'selected');assert.deepEqual(outcomeParagraphs(reopened.container).map(node=>node.textContent),paragraph?[paragraph]:[]);assert.equal(reviewCards(reopened.container).length,card);reopened.close();
  assert.deepEqual(history,before);
 });
 await new Promise(resolve=>setImmediate(resolve));assert.ok(calls.length>0);assert.ok(calls.every(call=>call.method==='GET'));
});
