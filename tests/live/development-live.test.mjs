import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, writeFileSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {docker, inspect, createArgs, stageInputs, preflight, physicalDockerJob} from '../../dist/packages/execution/docker.js';

const image = process.env.PI_DEVELOPMENT_IMAGE;
const context = process.env.PI_DEVELOPMENT_CONTEXT || 'desktop-linux';
const enabled = process.env.PI_DEVELOPMENT_LIVE === '1';
const reason = !enabled ? 'NOT EXECUTED: set PI_DEVELOPMENT_LIVE=1' : !image ? 'NOT EXECUTED: PI_DEVELOPMENT_IMAGE must name a locally available immutable image@sha256:digest' : false;
const terminal = j => ['succeeded','failed','cancelled','timed_out'].includes(j.state);

test('real Docker development: Python, isolation, failure, cancellation, disconnect and recovery', {skip:reason, timeout:240000}, async t => {
    const root = resolve('.validation'); mkdirSync(root,{recursive:true});
    const dir = mkdtempSync(join(root,'development-live-'));
    let server = createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
    const port = await server.listen(); let app = server.app;
    const evidence = {image,context,engine:JSON.parse(await docker(context,['version','--format','{{json .Server}}'])),dataDir:dir,checks:[],passed:false};
    const project = app.projects.create(USER,{name:'PR04 real Docker acceptance',template:'curve-fit'});
    const baseline = app.experiments.create(USER,project.id,{title:'unchanged baseline',hypothesis:'development tests are not scientific runs'});
    const hostCanary = join(dir,'host-only-canary.txt'); writeFileSync(hostCanary,'only-host');
    process.env.PI_LIVE_HOST_SECRET_CANARY = 'never-forward-to-container';
    const call = (name,input,sessionId,key=randomUUID()) => app.operations.execute(USER,name,input,{projectId:project.id,sessionId,idempotencyKey:key});
    const approve = id => {const a=app.store.get('approval',id);app.approvals.decide(USER,id,a.version,true);};
    async function wait(id,predicate=terminal,timeout=45000) {
        const end=Date.now()+timeout;
        // After the disconnect case this fixture has no AgentHost; explicitly drive its controller.
        while(Date.now()<end) {app.execution.launchPending();const j=app.store.get('sandbox-job',id);if(predicate(j))return j;await pause(200);}
        const j=app.store.get('sandbox-job',id);throw new Error(`Job did not reach expected state: ${JSON.stringify({id,state:j.state,error:j.error,controlDir:j.controlDir})}`);
    }
    function prepare(source,options={}) {
        const session=app.sessions.create(USER,project.id,{title:options.title??'live sandbox'});
        app.sources.prepare(USER,project.id,session.id,{experimentId:baseline.id,revision:1});
        writeFileSync(join(app.store.paths.physical(session.workspace),'test_sandbox.py'),source);
        const task=call('development_prepare',{command:['python','-u','test_sandbox.py'],environmentImageDigest:image,dockerContext:context,resources:{timeoutSeconds:30},...options},session.id);
        approve(task.grantId);const j=call('development_submit',{developmentTaskId:task.id},session.id);
        return {session,task,job:app.store.get('sandbox-job',j.id),source};
    }
    function record(name,j,extra={}) {
        evidence.checks.push({name,jobId:j.id,state:j.state,integrity:j.integrity,exitCode:j.exitCode,containerId:j.containerId,sourceDigest:j.sourceDigest,reportArtifactId:j.reportArtifactId,...extra});
        writeFileSync(join(dir,'evidence.json'),JSON.stringify(evidence,null,2));
    }
    let failures=0;
    const check=(name,fn)=>t.test(name,async()=>{try{await fn();}catch(error){failures++;throw error;}});
    try {
        await check('real unittest, readonly source/data, no host secrets/network, HTTP disconnect and exact proposal binding',async()=>{
            const data=app.evidence.put(project.id,'readonly-data',Buffer.from('input'), 'text/plain','user');
            const source=`import unittest, os, pathlib, socket, json, time
class SandboxChecks(unittest.TestCase):
    def test_math(self): self.assertEqual(sum([1,2,3]),6)
    def test_isolation(self):
        self.assertEqual(os.getuid(),65532)
        self.assertNotIn('PI_LIVE_HOST_SECRET_CANARY',os.environ)
        self.assertFalse(pathlib.Path(${JSON.stringify(hostCanary)}).exists())
        self.assertEqual(pathlib.Path('/data/${data.id}').read_text(),'input')
        for p in ['/source/test_sandbox.py','/data/${data.id}','/etc/host-write-attempt']:
            with self.assertRaises(OSError): pathlib.Path(p).write_text('forbidden')
        with self.assertRaises(OSError): socket.create_connection(('1.1.1.1',443),timeout=1)
        pathlib.Path('private-edit.txt').write_text('writable work')
        pathlib.Path('/output/result.json').write_text(json.dumps({'checks':'passed'}))
time.sleep(3)
unittest.main(verbosity=2)
`;
            const p=prepare(source,{expectedArtifacts:['result.json'],dataArtifactIds:[data.id]});
            const response=await fetch(`http://127.0.0.1:${port}/api/operations/development_inspect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:project.id,input:{jobId:p.job.id}})});
            assert.equal(response.status,200);assert.equal((await response.json()).jobId,p.job.id);
            app.execution.launchPending();await wait(p.job.id,j=>j.state==='running'||terminal(j));
            await server.close();server=null;app=new ResearchApp(dir,process.cwd());
            const j=await wait(p.job.id);record('unittest-isolation-disconnect',j);
            assert.equal(j.state,'succeeded',JSON.stringify(j));assert.equal(j.integrity,'complete');assert.equal(j.exitCode,0);
            assert.match(call('development_logs',{jobId:j.id,stream:'stderr'}).content,/Ran 2 tests/);
            assert.equal(readFileSync(hostCanary,'utf8'),'only-host');
            const container=JSON.parse(await docker(context,['inspect',j.containerId]))[0];
            assert.equal(container.HostConfig.NetworkMode,'none');assert.equal(container.HostConfig.ReadonlyRootfs,true);
            assert.equal(container.HostConfig.PidsLimit,64);assert.equal(container.HostConfig.Memory,256*1024*1024);
            assert.equal(container.Config.Env.some(e=>e.startsWith('PI_LIVE_HOST_SECRET_CANARY=')),false);
            const artifact=app.evidence.put(project.id,'test_sandbox.py',Buffer.from(source),'text/plain','user');
            const proposal={baseExperimentId:baseline.id,expectedRevision:1,title:'tested source',hypothesis:'exact code was checked',testJobId:j.id,changes:[{path:'test_sandbox.py',expectedDigest:null,artifactId:artifact.id}]};
            const change=call('change_proposal_prepare',proposal);assert.equal(change.testsStatus,'passed');
            const changed=app.evidence.put(project.id,'different.py',Buffer.from(source+'\nassert False\n'));
            assert.throws(()=>call('change_proposal_prepare',{...proposal,changes:[{...proposal.changes[0],artifactId:changed.id}]}),{code:'DEVELOPMENT_SOURCE_STALE'});
            assert.equal(app.store.list('run').length,0);assert.equal(app.store.list('experiment').length,1);
        });
        for(const [name,source,marker] of [['syntax','def broken(:\n','SyntaxError'],['assertion','assert 2 + 2 == 5, "deliberate live failure"\n','AssertionError']]) await check(name+' failure retains real stderr and exit',async()=>{
            const p=prepare(source);app.execution.launchPending();const j=await wait(p.job.id);record(name,j);
            assert.equal(j.state,'failed');assert.equal(j.integrity,'complete');assert.notEqual(j.exitCode,0);
            assert.match(call('development_logs',{jobId:j.id,stream:'stderr'}).content,new RegExp(marker));assert.ok(j.reportArtifactId);
        });
        const sleeping="import subprocess,sys,time,pathlib\nsubprocess.Popen([sys.executable,'-c','import time; time.sleep(60)'])\npathlib.Path('/output/started.txt').write_text('started')\nprint('started',flush=True)\ntime.sleep(60)\n";
        for(const name of ['timeout','cancel']) await check(name+' stops the owned container and its child process',async()=>{
            const p=prepare(sleeping,{resources:{timeoutSeconds:name==='timeout'?2:30},expectedArtifacts:['started.txt']});
            app.execution.launchPending();await wait(p.job.id,j=>j.state==='running'||terminal(j));
            if(name==='cancel')call('development_cancel',{jobId:p.job.id});
            const j=await wait(p.job.id);record(name,j);assert.equal(j.state,name==='timeout'?'timed_out':'cancelled');
            const c=await inspect(physicalDockerJob(j,app.store.paths));assert.equal(c.State.Running,false);assert.equal(c.State.Status,'exited');
        });
        await check('lost worker reconciles the same container without a duplicate execution',async()=>{
            const p=prepare("import time,pathlib\np=pathlib.Path('/output/count.txt')\np.write_text(p.read_text()+'x' if p.exists() else 'x')\nprint('before-recovery',flush=True)\ntime.sleep(5)\nprint('after-recovery',flush=True)\n",{expectedArtifacts:['count.txt']});
            app.execution.launchPending();let j=await wait(p.job.id,j=>j.state==='running'||terminal(j));assert.equal(j.state,'running');
            assert.ok(j.workerPid);process.kill(j.workerPid,'SIGKILL');await pause(400);
            j=app.store.get('sandbox-job',j.id);app.store.update('sandbox-job',j.id,j.version,{leaseUntil:0});
            app.execution.launchPending();const done=await wait(j.id);record('worker-recovery',done);
            assert.equal(done.containerId,j.containerId);assert.equal(done.recoveryCount,1);assert.equal(done.integrity,'incomplete');assert.equal(done.state,'failed');
            assert.equal(readFileSync(join(app.store.paths.physical(done.outputDir),'count.txt'),'utf8'),'x');
            const ids=await docker(context,['ps','-aq','--filter',`label=pi-research.sandbox-job=${j.id}`]);assert.equal(ids.split('\n').filter(Boolean).length,1);
        });
        await check('lost attach transport cannot certify complete success even if Python exits zero',async()=>{
            const p=prepare("import time\nprint('first',flush=True)\ntime.sleep(6)\nprint('last',flush=True)\n");
            app.execution.launchPending();const j=await wait(p.job.id,j=>j.state==='running'||terminal(j));assert.equal(j.state,'running');
            assert.ok(Number.isSafeInteger(j.workerPid));
            const query=process.platform==='win32'
                ?spawnSync('powershell.exe',['-NoProfile','-Command',`Get-CimInstance Win32_Process -Filter "ParentProcessId = ${j.workerPid}" | Where-Object {$_.Name -eq 'docker.exe' -and $_.CommandLine -match 'start --attach'} | Select-Object -ExpandProperty ProcessId`],{encoding:'utf8',timeout:5000,windowsHide:true})
                :spawnSync('ps',['-axo','pid=,ppid=,args='],{encoding:'utf8',timeout:5000});
            assert.equal(query.status,0,query.stderr);
            const pids=process.platform==='win32'?query.stdout.trim().split(/\s+/).filter(Boolean).map(Number)
                :query.stdout.split('\n').map(x=>x.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/)).filter(x=>x&&Number(x[2])===j.workerPid&&/docker.*start --attach/.test(x[3])).map(x=>Number(x[1]));
            assert.equal(pids.length,1,'identify only this worker’s attach process');process.kill(pids[0],'SIGKILL');
            const done=await wait(j.id);record('attach-loss',done);assert.equal(done.exitCode,0);assert.equal(done.state,'failed');assert.equal(done.integrity,'incomplete');
        });
        for(const name of ['missing-output','output-limit','log-limit']) await check(name+' cannot report complete success',async()=>{
            const source=name==='output-limit'?"import pathlib\npathlib.Path('/output/large.txt').write_text('x'*4096)\n":name==='log-limit'?"print('x'*4096,flush=True)\n":"print('no required output')\n";
            const options=name==='missing-output'?{expectedArtifacts:['required.txt']}:{resources:{[name==='log-limit'?'logBytes':'outputBytes']:128}};
            const p=prepare(source,options);app.execution.launchPending();const j=await wait(p.job.id);record(name,j);
            assert.equal(j.state,'failed');assert.equal(j.integrity,'incomplete');assert.ok(j.reportArtifactId);
            if(name==='log-limit')assert.equal(app.evidence.read(USER,j.stdoutArtifactId).bytes.length,128);
        });
        await check('ambiguous persisted start can be cancelled without ever executing created container',async()=>{
            const p=prepare("import pathlib\npathlib.Path('/output/must-not-exist.txt').write_text('executed')\n");
            const imageId=await preflight(context,image),dockerJob=physicalDockerJob(p.job,app.store.paths);stageInputs(dockerJob);await docker(context,createArgs(dockerJob));const c=await inspect(dockerJob);
            app.store.update('sandbox-job',p.job.id,p.job.version,{imageId,containerId:c.Id,startRequested:true,state:'unknown',generation:1,leaseUntil:0,startedAt:new Date().toISOString()});
            call('development_cancel',{jobId:p.job.id});app.execution.launchPending();const done=await wait(p.job.id);record('ambiguous-start-cancel',done);
            assert.equal(done.state,'cancelled');assert.equal(done.integrity,'incomplete');assert.equal(await inspect(physicalDockerJob(done,app.store.paths)),null);
        });
        evidence.passed=failures===0;
    } finally {
        delete process.env.PI_LIVE_HOST_SECRET_CANARY;
        writeFileSync(join(dir,'evidence.json'),JSON.stringify(evidence,null,2));
        if(server)await server.close();else app.close();
        t.diagnostic(`Evidence and job archives retained at ${dir}`);
    }
});
