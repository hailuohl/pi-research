import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {MessageQueue} from '../../dist/web/assets/message-queue.js';

const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];
const label=node=>typeof node==='string'?node:Array.isArray(node)?node.map(label).join(''):node&&typeof node==='object'?label(node.props?.children):'';
const button=(view,name)=>nodes(view.render()).find(node=>node.type==='button'&&label(node).includes(name));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const response=data=>({ok:true,json:async()=>data});
const message=(id,version=1)=>({id,projectId:'p',sessionId:'s',role:'user',status:'queued',origin:'direct',version,content:`preview ${id}`,contentBytes:20,previewTruncated:false});

test('a parent refresh on page two does not leave a pending editor read locked',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  let releaseRead,claimed=false;
  globalThis.fetch=async url=>{
    if(url.includes('/session_message_read'))return new Promise(resolve=>{releaseRead=()=>resolve(response({sessionId:'s',messageId:'m21',version:1,content:'full text',cursor:0,end:9,total:9,complete:true,cursorUnit:'utf8-byte',sourceTruncated:false}));});
    return response({items:claimed?[]:[message('m21')],total:claimed?0:21,nextCursor:null,canSteer:false});
  };
  const first=Array.from({length:20},(_,i)=>message(`m${i+1}`));
  const view=synchronousState(new MessageQueue({projectId:'p',sessionId:'s',messages:first,total:21,nextCursor:'m20',canSteer:true,disabled:false,busy:false,perform:fn=>fn()}));
  button(view,'下一页').props.onClick();await tick();
  assert.equal(view.state.pageIndex,1);
  button(view,'编辑').props.onClick();assert.equal(view.state.readingId,'m21');
  const previous=view.props;view.props={...previous,canSteer:false};view.componentDidUpdate(previous);await tick();
  releaseRead();await tick();
  assert.equal(view.state.readingId,'');
  assert.equal(view.state.editingId,'m21');
  assert.equal(button(view,'保存').props.disabled,false);
  claimed=true;
  const refreshed=view.props;view.props={...refreshed,canSteer:true};view.componentDidUpdate(refreshed);await tick();
  assert.equal(view.state.draft,'full text');
  assert.equal(button(view,'保存').props.disabled,true);
  view.componentWillUnmount();
});
