import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {MessageQueue} from '../../dist/web/assets/message-queue.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const response=data=>({ok:true,json:async()=>data});
const message=(id,version=1,content=`message ${id}`,extra={})=>({id,projectId:'p',sessionId:'s',role:'user',status:'queued',version,content,contentBytes:new TextEncoder().encode(content).length,previewTruncated:false,...extra});
function queue(messages=[message('m')],overrides={}){
  return synchronousState(new MessageQueue({projectId:'p',sessionId:'s',messages,total:messages.length,nextCursor:null,canSteer:false,disabled:false,busy:false,perform:fn=>fn(),...overrides}));
}
const button=(view,label)=>elements(view.render()).find(node=>node.type==='button'&&text(node).includes(label));
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('queue actions are session-scoped and send the message version expected by the editor',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const calls=[],work=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return response(message('m',7));};
  const view=queue([message('m',7)],{perform:fn=>{const pending=fn();work.push(pending);return pending;}});
  button(view,'删除').props.onClick();await Promise.all(work);
  assert.equal(calls[0].url,'/api/sessions/s/queue');
  assert.deepEqual(JSON.parse(calls[0].init.body),{messageId:'m',expectedVersion:7,action:'cancel'});
  view.componentWillUnmount();
});

test('immediate steering requires backend canSteer and stays pending at the task boundary',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const calls=[],work=[],notices=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return response(message('m',3));};
  const blocked=queue([message('m',3)]);assert.equal(button(blocked,'立即引导').props.disabled,true);button(blocked,'立即引导').props.onClick();assert.equal(calls.length,0);blocked.componentWillUnmount();
  const view=queue([message('m',3)],{canSteer:true,perform:(fn,success)=>{notices.push(success);const pending=fn();work.push(pending);return pending;}});
  button(view,'立即引导').props.onClick();await Promise.all(work);await tick();
  assert.deepEqual(JSON.parse(calls[0].init.body),{messageId:'m',expectedVersion:3,action:'steer'});
  assert.match(notices[0],/下一工具或回合边界/);assert.match(text(view.render()),/已请求 · 等待边界/);assert.equal(button(view,'已请求').props.disabled,true);
  assert.equal(calls.some(call=>call.url.includes('/interrupt')),false);view.componentWillUnmount();
});

test('queue controls stay disabled on history pages or while the parent is busy',()=>{
  for(const view of [queue([message('m')],{disabled:true}),queue([message('m')],{busy:true})]){
    assert.equal(button(view,'删除').props.disabled,true);assert.equal(button(view,'编辑').props.disabled,true);view.componentWillUnmount();
  }
});

test('the first queue page includes all twenty supplied messages and follows the server cursor',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const first=Array.from({length:20},(_,i)=>message(`m${i+1}`)),next=Array.from({length:5},(_,i)=>message(`m${i+21}`));let request;
  globalThis.fetch=async(url,init)=>{request={url,init};return response({items:next,total:25,nextCursor:null,canSteer:false});};
  const view=queue(first,{total:25,nextCursor:'m20'});
  assert.equal(elements(view.render()).filter(node=>node.type==='li').length,20);assert.match(text(view.render()),/message m20/);
  button(view,'下一页').props.onClick();await tick();
  assert.match(request.url,/afterMessageId=m20/);assert.equal(new URLSearchParams(request.url.split('?')[1]).get('limit'),'20');
  assert.equal(view.state.pageIndex,1);assert.equal(view.state.items.length,5);assert.match(text(view.render()),/message m25/);view.componentWillUnmount();
});

test('editing reads every UTF-8 byte page and preserves the exact full body in the versioned update',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const source='你'.repeat(32000),edited=source.slice(0,-7)+'updated',calls=[],work=[];
  globalThis.fetch=async(url,init)=>{
    const body=init.body,input=JSON.parse(body).input;calls.push({url,input,body});
    if(url.endsWith('/operations/session_message_read')){
      const start=input.cursor/3,end=Math.min(source.length,start+Math.floor(input.limit/3)),content=source.slice(start,end),pageEnd=input.cursor+new TextEncoder().encode(content).length,total=new TextEncoder().encode(source).length;
      return response({sessionId:'s',messageId:'m',version:4,content,cursor:input.cursor,end:pageEnd,total,complete:pageEnd===total,cursorUnit:'utf8-byte',sourceTruncated:false});
    }
    return response(message('m',5,edited));
  };
  const view=queue([message('m',4,'preview',{previewTruncated:true,contentBytes:96000})],{perform:fn=>{const pending=fn();work.push(pending);return pending;}});
  button(view,'编辑').props.onClick();await tick();await tick();
  assert.equal(calls.filter(call=>call.url.endsWith('/operations/session_message_read')).length,2);
  assert.equal(calls[0].input.expectedVersion,4);assert.equal(calls[1].input.cursor,63999);
  const editor=elements(view.render()).find(node=>node.type==='textarea'&&node.props['aria-label']==='编辑排队消息');
  assert.equal(editor.props.value,source);editor.props.onChange({target:{value:edited}});
  button(view,'保存').props.onClick();await Promise.all(work);await tick();
  const update=calls.find(call=>call.url.endsWith('/queue'));
  assert.deepEqual(JSON.parse(update.body),{messageId:'m',expectedVersion:4,action:'edit',content:edited});view.componentWillUnmount();
});

test('a changed version blocks save without replacing the text already read for editing',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return response({sessionId:'s',messageId:'m',version:4,content:'original full body',cursor:0,end:18,total:18,complete:true,cursorUnit:'utf8-byte',sourceTruncated:false});};
  const view=queue([message('m',4,'preview')]);button(view,'编辑').props.onClick();await tick();
  const previous=view.props;view.props={...previous,messages:[message('m',5,'new server body')]};view.componentDidUpdate(previous);
  const editor=elements(view.render()).find(node=>node.type==='textarea'&&node.props['aria-label']==='编辑排队消息');
  assert.equal(editor.props.value,'original full body');assert.equal(button(view,'保存').props.disabled,true);
  button(view,'保存').props.onClick();assert.equal(calls.filter(call=>call.url.endsWith('/queue')).length,0);view.componentWillUnmount();
});

test('a late full-text response cannot open an editor after the queue unmounts',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  let resolve;globalThis.fetch=()=>new Promise(r=>{resolve=r;});
  const view=queue([message('m',4,'preview')]);button(view,'编辑').props.onClick();view.componentWillUnmount();
  resolve(response({sessionId:'s',messageId:'m',version:4,content:'late',cursor:0,end:4,total:4,complete:true,cursorUnit:'utf8-byte',sourceTruncated:false}));await tick();
  assert.equal(view.state.editingId,'');
});
