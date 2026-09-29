import test from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest} from '../../dist/packages/storage/store.js';

const message=(s,content,session=s.session,extra={})=>s.app.store.create('message',s.project.id,{sessionId:session.id,role:'assistant',content,mode:'prompt',status:'completed',...extra});
const view=(s,input={})=>s.app.sessions.view(USER,s.session.id,input);

test('empty saved assistant messages remain readable as empty previews and complete zero-byte windows',()=>{const s=setup();try{
 const m=message(s,'');const page=view(s);assert.equal(page.messages[0].id,m.id);assert.equal(page.messages[0].content,'');assert.equal(page.messages[0].contentBytes,0);assert.equal(page.messages[0].previewTruncated,false);assert.deepEqual(s.app.sessions.messageRead(USER,s.session.id,{messageId:m.id}),{sessionId:s.session.id,messageId:m.id,version:1,content:'',cursor:0,end:0,total:0,complete:true,cursorUnit:'utf8-byte',sourceTruncated:false});
}finally{s.close();}});

test('session catalog pages and literal search preserve exact old selection without exposing private paths',()=>{const s=setup();try{
 const sessions=Array.from({length:35},(_,n)=>s.app.sessions.create(USER,s.project.id,{title:n===0?'旧研究 %_ anchor':`catalog ${n}`}));
 const first=s.app.sessions.list(USER,s.project.id,{limit:10});assert.equal(first.items.length,10);assert.ok(first.nextCursor);assert.ok(first.items.every(r=>!('workspace'in r)&&!('piSessionPath'in r)));
 s.app.sessions.create(USER,s.project.id,{title:'new while paging'});const second=s.app.sessions.list(USER,s.project.id,{limit:10,beforeSessionId:first.nextCursor});assert.ok(!second.items.some(x=>first.items.some(y=>x.id===y.id)));
 assert.equal(s.app.sessions.list(USER,s.project.id,{query:'%_'}).items[0].id,sessions[0].id);assert.equal(s.app.sessions.list(USER,s.project.id,{query:sessions[0].id}).items[0].id,sessions[0].id);
 const recent=s.app.sessions.recent(USER,s.project.id,s.session.id);assert.equal(recent.length,31);assert.ok(recent.some(r=>r.id===s.session.id));
 const p=s.app.projects.create(USER,{name:'foreign',template:'empty'}),other=s.app.sessions.create(USER,p.id,{});assert.throws(()=>s.app.sessions.list(USER,s.project.id,{beforeSessionId:other.id}),{code:'SCOPE_DENIED'});assert.throws(()=>s.app.sessions.recent(USER,s.project.id,other.id),{code:'SCOPE_DENIED'});assert.throws(()=>s.app.sessions.list({type:'agent'},s.project.id),{code:'PERMISSION_DENIED'});
}finally{s.close();}});

test('message pages traverse both directions without duplicates and new messages do not shift anchored history',()=>{const s=setup();try{
 const rows=Array.from({length:37},(_,n)=>message(s,`message ${n}`));const latest=view(s);assert.deepEqual(latest.messages.map(m=>m.id),rows.slice(-10).map(m=>m.id));assert.equal(latest.history.atLatest,true);
 const anchor=latest.history.beforeMessageId,older=view(s,{beforeMessageId:anchor});assert.deepEqual(older.messages.map(m=>m.id),rows.slice(-20,-10).map(m=>m.id));assert.equal(older.history.atLatest,false);message(s,'new after older selection');assert.deepEqual(view(s,{beforeMessageId:anchor}).messages,older.messages);
 const newer=view(s,{afterMessageId:older.history.afterMessageId});assert.deepEqual(newer.messages.map(m=>m.id),latest.messages.map(m=>m.id));assert.equal(newer.history.atLatest,false);assert.equal(view(s).messages.at(-1).content,'new after older selection');
 const ids=[];let page=view(s);for(;;){ids.unshift(...page.messages.map(m=>m.id));if(!page.history.beforeMessageId)break;page=view(s,{beforeMessageId:page.history.beforeMessageId});}assert.equal(ids.length,38);assert.equal(new Set(ids).size,38);assert.equal(s.app.sessions.messages(USER,s.session.id).length,38,'internal native context still has all original messages');
}finally{s.close();}});

test('byte budget shortens a page rather than silently dropping saved messages; previews and full reads remain distinct',()=>{const s=setup();try{
 const rows=Array.from({length:30},()=>message(s,'🙂'.repeat(5000)));const latest=view(s,{limit:50});assert.ok(latest.messages.length<30);assert.ok(latest.history.beforeMessageId);assert.ok(Buffer.byteLength(JSON.stringify(latest.messages))<=262144);assert.equal(latest.history.returnedBytes,Buffer.byteLength(JSON.stringify(latest.messages)));
 assert.ok(latest.messages.every(m=>m.previewTruncated&&m.contentBytes===20000&&Array.from(m.content).length===4000&&!m.contentTruncated));const ids=[...latest.messages.map(m=>m.id)];let page=latest;while(page.history.beforeMessageId){page=view(s,{beforeMessageId:page.history.beforeMessageId,limit:50});ids.unshift(...page.messages.map(m=>m.id));}assert.deepEqual(ids,rows.map(m=>m.id));
}finally{s.close();}});

test('UTF8 windows preserve Chinese, emoji, BOM and NUL, align previous cursors and reject stale versions',()=>{const s=setup();try{
 const content='\ufeff中文🙂A\0B'.repeat(3000),row=message(s,content,{...s.session},{contentTruncated:true});let cursor=0,joined='';for(;;){const p=s.app.sessions.messageRead(USER,s.session.id,{messageId:row.id,cursor,limit:4001,expectedVersion:row.version});assert.equal(p.cursor,cursor);assert.ok(p.end-p.cursor<=4001);assert.ok(!p.content.includes('\ufffd'));joined+=p.content;cursor=p.end;if(p.complete){assert.equal(p.total,Buffer.byteLength(content));assert.equal(p.sourceTruncated,true);break;}}assert.equal(joined,content);
 const inside=s.app.sessions.messageRead(USER,s.session.id,{messageId:row.id,cursor:10,limit:40});assert.ok(inside.cursor<=10&&10-inside.cursor<=3);assert.equal(Buffer.from(content).subarray(inside.cursor,inside.end).toString(),inside.content);
 s.app.store.update('message',row.id,row.version,{status:'failed'});assert.throws(()=>s.app.sessions.messageRead(USER,s.session.id,{messageId:row.id,expectedVersion:row.version}),{code:'VERSION_CONFLICT'});assert.throws(()=>s.app.sessions.messageRead(USER,s.session.id,{messageId:row.id,cursor:Buffer.byteLength(content)+1}),{code:'INVALID_INPUT'});
}finally{s.close();}});

test('foreign message cursors and identifiers are rejected without revealing another history',()=>{const s=setup();try{
 const other=s.app.sessions.create(USER,s.project.id,{title:'other'}),m=message(s,'private other',other);for(const input of [{beforeMessageId:m.id},{afterMessageId:m.id}])assert.throws(()=>view(s,input),{code:'SCOPE_DENIED'});assert.throws(()=>view(s,{beforeMessageId:m.id,afterMessageId:m.id}),{code:'INVALID_INPUT'});assert.throws(()=>s.app.sessions.messageRead(USER,s.session.id,{messageId:m.id}),{code:'SCOPE_DENIED'});
 assert.throws(()=>view(s,{beforeMessageId:'missing'}),{code:'NOT_FOUND'});assert.throws(()=>view(s,{limit:51}),{code:'INVALID_INPUT'});assert.equal(s.app.store.list('model-usage').length,0);
}finally{s.close();}});

test('session paging index migration preserves all old record bytes',()=>{const s=setup();try{
 message(s,'retained history');s.app.store.db.exec("DROP INDEX records_session_catalog; DELETE FROM schema_migrations WHERE version=7;");const before=digest(s.app.store.db.prepare('SELECT kind,id,data FROM records ORDER BY kind,id').all());const other=new ResearchApp(s.dir,process.cwd());try{assert.ok(other.store.db.prepare('SELECT 1 FROM schema_migrations WHERE version=7').get());assert.equal(digest(other.store.db.prepare('SELECT kind,id,data FROM records ORDER BY kind,id').all()),before);}finally{other.close();}
}finally{s.close();}});

test('large fixture history uses indexed bounded queries and reports measured page latency',()=>{const s=setup();try{
 const {id,kind,projectId,version,createdAt,updatedAt,...fields}=s.session;s.app.store.transaction(()=>{for(let i=0;i<5000;i++)s.app.store.create('session',s.project.id,{...fields,title:`fixture ${i}`,role:i%2?'analyst':'coordinator',taskId:i%2?'fixture-task':undefined},`fixture-session-${i}`);for(let i=0;i<20000;i++)message(s,'Scale fixture only. 中文🙂 '.repeat(12));});
 const captured=[],prepare=s.app.store.db.prepare.bind(s.app.store.db);s.app.store.db.prepare=sql=>{const statement=prepare(sql);return new Proxy(statement,{get(target,key){const member=Reflect.get(target,key);if(typeof member!=='function')return member;return (...args)=>{if((key==='all'||key==='get')&&sql.startsWith('SELECT'))captured.push({sql,args});return member.apply(target,args);};}});};
 const times=[];for(let i=0;i<20;i++){const start=performance.now();const catalog=s.app.sessions.list(USER,s.project.id),page=view(s);assert.equal(catalog.items.length,10);assert.equal(page.messages.length,10);assert.ok(Buffer.byteLength(JSON.stringify(page))<300000);times.push(performance.now()-start);}s.app.store.db.prepare=prepare;
 const queries=[captured.find(q=>q.sql.includes("json_extract(data,'$.title') title")),captured.find(q=>q.sql.includes('16000) content'))];assert.ok(queries.every(Boolean));const plans=queries.map(q=>prepare('EXPLAIN QUERY PLAN '+q.sql).all(...q.args).map(row=>String(row.detail)));assert.ok(plans[0].some(p=>p.includes('records_session_catalog')));assert.ok(plans[1].some(p=>p.includes('records_kind_session')));assert.ok(plans.flat().every(p=>!p.includes('TEMP B-TREE')));
 times.sort((a,b)=>a-b);console.log('SESSION_HISTORY_PERF '+JSON.stringify({fixtureSessions:5001,fixtureMessages:20000,pageSize:10,iterations:20,p50Ms:times[9],p95Ms:times[18],processRssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed,dbLockWaitMeasured:false,plans}));
}finally{s.close();}});
