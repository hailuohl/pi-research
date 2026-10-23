import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {SOURCES} from '../../dist/packages/connectors/contracts.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';

test('new projects default to collaboration and every literature source without starting work',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-project-defaults-')),app=new ResearchApp(dir,process.cwd());let calls=0;
 try{
  const connectors=new ConnectorService(app.context,app.evidence,{transport:new ConnectorTransport({fetcher:async()=>{calls++;throw Error('No automatic request expected');},minIntervalMs:0}),credentials:()=>({})});
  for(const template of ['empty','curve-fit']){
   const p=app.projects.create(USER,{name:'Default '+template,template}),settings=connectors.settings(USER,p.id);
   assert.equal(p.settings.enabled,true);
   assert.deepEqual(settings.enabled,Object.fromEntries(SOURCES.map(source=>[source,true])));
   assert.deepEqual(settings.credentials,{openalexKeyConfigured:false,ncbiKeyConfigured:false,ncbiEmailConfigured:false});
   assert.equal(settings.requestsUsed,0);
  }
  assert.equal(calls,0);for(const kind of ['team','session','connector-call','connector-search','literature-task'])assert.equal(app.store.list(kind).length,0);
 }finally{app.close();rmSync(dir,{recursive:true,force:true});}
});

test('saved collaboration and source opt-outs survive reopening and leave new project defaults enabled',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-project-opt-outs-'));let app=new ResearchApp(dir,process.cwd());
 try{
  const p=app.projects.create(USER,{name:'Saved preferences'}),settings=app.connectors.settings(USER,p.id),disabled=Object.fromEntries(SOURCES.map(source=>[source,false]));
  app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:false});
  app.connectors.configure(USER,p.id,{expectedVersion:settings.version,enabled:disabled});
  app.close();app=new ResearchApp(dir,process.cwd());
  assert.equal(app.projects.get(USER,p.id).settings.enabled,false);assert.deepEqual(app.connectors.settings(USER,p.id).enabled,disabled);
  const next=app.projects.create(USER,{name:'Another new project'});assert.equal(next.settings.enabled,true);assert.ok(Object.values(app.connectors.settings(USER,next.id).enabled).every(Boolean));
 }finally{app.close();rmSync(dir,{recursive:true,force:true});}
});
