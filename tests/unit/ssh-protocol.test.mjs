import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';

test('SSH bootstrap changes only copied children of the root-owned work mount, including hidden entries',()=>{
 const parsed=spawnSync('python',['-c',"import ast,json;from pathlib import Path;tree=ast.parse(Path('scripts/ssh-runner.py').read_text());print(json.dumps(next(ast.literal_eval(n.value) for n in ast.walk(tree) if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='bootstrap' for t in n.targets))))"],{encoding:'utf8',windowsHide:true});assert.equal(parsed.status,0,parsed.stderr);const bootstrap=JSON.parse(parsed.stdout);
 const git=process.platform==='win32'?spawnSync('where.exe',['git'],{encoding:'utf8',windowsHide:true}).stdout.trim().split(/\r?\n/)[0]:undefined,shell=git?join(dirname(dirname(git)),'bin','sh.exe'):'/bin/sh';assert.ok(existsSync(shell),'a POSIX shell is required for the bootstrap regression');
 const root=mkdtempSync(join(tmpdir(),'pi-ssh-bootstrap-'));
 try{for(const [scenario,names] of [['plain',['plain.txt']],['hidden',['.hidden','..hidden']],['nested',['a space.txt','-flag','folder/.inner','folder/child.txt']]]){
  const source=join(root,scenario,'source'),work=join(root,scenario,'work');mkdirSync(source,{recursive:true});mkdirSync(work);for(const name of names){mkdirSync(dirname(join(source,name)),{recursive:true});writeFileSync(join(source,name),'frozen',{mode:0o444});}
  const quote=s=>"'"+s.replaceAll('\\','/').replaceAll("'","'\\''")+"'",workPath=work.replaceAll('\\','/'),sourcePath=source.replaceAll('\\','/');
  // Emulate the real mount boundary on every platform; use real cp/chmod and shell globbing for children.
  const guard=`chmod() { for arg do if [ "$arg" = ${quote(workPath)} ] || [ "$arg" = ${quote(workPath+'/')} ]; then printf '%s\\n' 'mount root is not owned by the workload' >&2; return 1; fi; done; command chmod "$@"; }; `;
  const command=bootstrap.replaceAll('/source/',sourcePath+'/').replaceAll('/work',workPath),check=names.map(name=>`printf updated > ${quote(workPath+'/'+name)}`).join(' && ');
  const result=spawnSync(shell,['-c',guard+command,'pi-test','/bin/sh','-c',check],{encoding:'utf8',windowsHide:true,timeout:10000});assert.equal(result.status,0,scenario+': '+result.stderr);for(const name of names){assert.equal(readFileSync(join(work,name),'utf8'),'updated');assert.equal(readFileSync(join(source,name),'utf8'),'frozen');}
 }}finally{assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep)&&root.includes('pi-ssh-bootstrap-'));rmSync(root,{recursive:true,force:true});}
});

test('trusted SSH protocol validates snapshot bytes, creates one worker, and cancellation tombstones prevent late starts',()=>{
 const script=String.raw`
import base64, contextlib, importlib.util, json, sys, tempfile, types
from pathlib import Path
if sys.platform == 'win32':
    sys.modules['fcntl']=types.SimpleNamespace(LOCK_EX=2,flock=lambda *a: None)
spec=importlib.util.spec_from_file_location('ssh_endpoint','scripts/ssh-runner.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
if sys.platform == 'win32':
    m.os.O_NOFOLLOW=0;m.os.O_NONBLOCK=0
started=[]
m.identity=lambda: {'engineId':'engine','protocolDigest':'protocol'}
m.subprocess.Popen=lambda *a,**k: started.append(a)
m.inspect=lambda r: {'State':{'Status':'running'}}
m.stop=lambda r: None
# Mock OS locking/fsync and Docker only; run the real request and validation handlers.
@contextlib.contextmanager
def locked(job):
    job.mkdir(mode=0o700,exist_ok=True)
    yield
m.locked=locked
m.atomic=lambda p,v:p.write_text(json.dumps(v))
with tempfile.TemporaryDirectory() as d:
    root=Path(d);m.root_path=lambda _:root
    source=b'print("hi")';files=[{'path':'main.py','size':len(source),'digest':m.sha(source),'mode':'100644'}]
    contract={'runner':'ssh','sshTargetId':'unit','image':'python@sha256:'+'a'*64,'command':['python','main.py'],'environment':{},'networkPolicy':'none','cpus':1,'memoryMb':128,'pids':32,'workMb':16,'timeoutSeconds':10,'logBytes':1024,'outputBytes':1024,'expectedArtifacts':['metrics.json']}
    q={'protocol':1,'root':'/fixture/root','op':'start','handle':'pi-ssh-'+'a'*8+'-'+'a'*4+'-'+'a'*4+'-'+'a'*4+'-'+'a'*12,'manifestDigest':'a'*64,'engineId':'engine','protocolDigest':'protocol','contract':contract,'sourceFiles':files,'sourceDigest':m.sha(m.stable(files)),'files':[base64.b64encode(source).decode()]}
    assert m.request(q)['state']=='submitting'
    assert m.request(q)['state']=='submitting'
    assert len(started)==1
    cancelled=m.request({**q,'op':'cancel'});assert cancelled['state']=='cancelled'
    assert m.request(q)['state']=='cancelled' and len(started)==1
    job=root/q['handle'];(job/'output'/'metrics.json').write_text('{"score":1}')
    collected=m.request({**q,'op':'result'});assert collected['files'][0]['path']=='metrics.json'
    late={**q,'handle':q['handle'].replace('a','b')}
    assert m.request({**late,'op':'cancel'})['state']=='cancelled'
    assert m.request(late)['state']=='cancelled' and len(started)==1
    for mutate in [{'sourceDigest':'0'*64},{'files':[base64.b64encode(b'bad').decode()]},{'contract':{**contract,'networkPolicy':'host'}},{'contract':{**contract,'privileged':True}}]:
        try:m.validate_start({**q,**mutate})
        except ValueError:pass
        else:raise AssertionError('invalid transfer accepted')
    for path in ['../private','/etc/passwd','a//b',r'a\b','a:b','a/./b']:
        try:m.relative_path(path)
        except ValueError:pass
        else:raise AssertionError('invalid path accepted')
print('ssh-protocol-ok')
`;
 const result=spawnSync('python',['-c',script],{encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/ssh-protocol-ok/);
});

test('SSH worker seals a failed docker start without hanging, preserves diagnostics, and never restarts the handle',()=>{
 const script=String.raw`
import contextlib, importlib.util, io, json, sys, tempfile, types
from pathlib import Path
if sys.platform == 'win32':sys.modules['fcntl']=types.SimpleNamespace(LOCK_EX=2,flock=lambda *a: None)
spec=importlib.util.spec_from_file_location('ssh_endpoint','scripts/ssh-runner.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
@contextlib.contextmanager
def locked(job):yield
m.locked=locked;m.atomic=lambda p,v:p.write_text(json.dumps(v));m.identity=lambda:{'engineId':'engine','protocolDigest':'protocol'}
scenario=sys.argv[1]
if scenario=='timeout':
    moments=iter([0,2000]);m.time.time=lambda:next(moments,2000)
class Selector:
    def __init__(self):self.turns=0
    def register(self,*a):pass
    def select(self,*a):
        self.turns+=1
        if self.turns>3:raise RuntimeError('test detected infinite created-container loop')
        return []
    def get_map(self):return {}
m.selectors.DefaultSelector=Selector
with tempfile.TemporaryDirectory() as d:
    job=Path(d);(job/'output').mkdir();(job/'stderr.log').write_text('cgroup start diagnostic')
    row={'handle':'pi-ssh-'+'a'*36,'manifestDigest':'a'*64,'engineId':'engine','protocolDigest':'protocol','state':'submitting','startRequested':False,'contract':{'image':'python@sha256:'+'a'*64,'pids':32,'cpus':1,'memoryMb':128,'workMb':16,'command':['python','main.py'],'timeoutSeconds':1000,'logBytes':1024,'outputBytes':1024}}
    m.atomic(job/'record.json',row);state={'created':False,'removed':False,'starts':0,'removes':0,'terminated':False}
    def docker(args,*a,**k):
        if args[0]=='image':return b'sha256:fixture'
        if args[0]=='create':state['created']=True;return b'b'*64
        if args[0]=='rm':
            if scenario=='retirement-failed':raise ValueError('retirement could not be confirmed')
            assert args==['rm','--force','b'*64];state['removed']=True;state['removes']+=1;return b''
        raise AssertionError(args)
    m.docker=docker
    m.inspect=lambda r:{'Id':'b'*64,'State':{'Status':'created','Running':False,'ExitCode':128,'Error':'cgroup error'}} if state['created'] and not state['removed'] else None
    def popen(*a,**k):
        state['starts']+=1
        return types.SimpleNamespace(stdout=io.BytesIO(),stderr=io.BytesIO(),poll=lambda:None if scenario=='timeout' and not state['terminated'] else 1,terminate=lambda:state.update(terminated=True),wait=lambda **k:1,kill=lambda:state.update(terminated=True))
    m.subprocess.Popen=popen
    m.worker(job);done=m.record(job)
    if scenario=='retirement-failed':
        assert done['state']=='unknown' and done['error']=='REMOTE_STATE_UNKNOWN',done
        assert not state['removed'],state
    else:
        assert done['state']=='failed',done
        assert done['error']==('TIMEOUT' if scenario=='timeout' else 'REMOTE_START_FAILED'),done
        assert done['exitCode']==128 and done['startRequested'] is True,done
        assert state['removed'] and state['removes']==1,state
        if scenario=='timeout':assert state['terminated'],state
    assert (job/'stderr.log').read_text()=='cgroup start diagnostic'
    m.worker(job);assert state['starts']==1,state
print('ssh-start-failure-ok')
`;
 for(const scenario of ['rejected','timeout','retirement-failed']){const result=spawnSync('python',['-c',script,scenario],{encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(result.status,0,scenario+': '+result.stderr);assert.match(result.stdout,/ssh-start-failure-ok/);}
});
