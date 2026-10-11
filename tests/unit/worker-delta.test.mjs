import test from 'node:test';
import assert from 'node:assert/strict';
import {workerDeltaSender} from '../../dist/packages/pi-adapter/worker-delta.js';

test('coalescing preserves contiguous bytes for the host cross-chunk secret masker',()=>{
 const sent=[],display=workerDeltaSender(m=>sent.push(m)),text='prefix fixture-secret-123456789 🔬 suffix';
 for(const part of text.split(''))display.push(part);
 display.acknowledge(sent[0].deltaId);assert.equal(sent.map(m=>m.text).join(''),text);
});

test('display uses one IPC credit, bounds retained text, and never resumes a truncated prefix',()=>{
 const sent=[],display=workerDeltaSender(m=>sent.push(m));
 display.push('first');for(let i=0;i<10000;i++)display.push('x');
 assert.equal(sent.length,1);display.acknowledge(sent[0].deltaId);
 assert.equal(sent.length,2);assert.equal(sent[1].text,'x'.repeat(4000));
 display.push('must not join a dropped gap');display.acknowledge(sent[1].deltaId);assert.equal(sent.length,2);
});

test('a final message or cancellation drops pending preview; late and duplicate ACKs cannot revive it',()=>{
 const sent=[],display=workerDeltaSender(m=>sent.push(m));display.push('old');display.push('old pending');
 const old=sent[0].deltaId;display.clear();display.acknowledge(old);assert.equal(sent.length,1);
 display.push('new');display.push('new pending');const current=sent[1].deltaId;
 display.acknowledge(old);assert.equal(sent.length,2);display.acknowledge(current);
 assert.equal(sent[2].text,'new pending');display.acknowledge(current);assert.equal(sent.length,3);
 display.clear();display.acknowledge(sent[2].deltaId);assert.equal(sent.length,3);
});

test('a bounded preview never cuts a surrogate pair at the overflow boundary',()=>{
 const sent=[],display=workerDeltaSender(m=>sent.push(m));display.push('first');display.push('x'.repeat(3999)+'🔬');
 display.acknowledge(sent[0].deltaId);assert.equal(sent[1].text,'x'.repeat(3999));
});
