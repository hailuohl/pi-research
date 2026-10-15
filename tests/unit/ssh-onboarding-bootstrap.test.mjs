import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('fixed bootstrap classifies Docker, refuses existing unsafe resources and limits sudo to installation',()=>{
 const script=String.raw`
import importlib.util, json, os, stat, subprocess, types
from pathlib import Path
spec=importlib.util.spec_from_file_location('onboarding','scripts/ssh-onboarding.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.sys.platform='linux';m.os.getuid=lambda:1001;m.os.geteuid=lambda:1001
q={'action':'inspect','root':'/srv/pi/jobs','digest':'a'*64}
calls=[]
m.supervisor=lambda _: 'ready';m.workspace=lambda *a: 'ready'
m.shutil.which=lambda *a,**k:None
state=m.request(q);assert state['docker']=='missing' and state['errorCode']=='SSH_DOCKER_MISSING'
m.shutil.which=lambda *a,**k:'/usr/bin/docker'
def docker(args,**kw):
    calls.append((args,kw));assert args==['docker','info','--format','{{json .}}']
    return types.SimpleNamespace(returncode=1,stdout=b'private failure')
m.subprocess.run=docker
state=m.request(q);assert state['docker']=='unavailable' and state['errorCode']=='SSH_DOCKER_UNAVAILABLE'
m.subprocess.run=lambda *a,**k:types.SimpleNamespace(returncode=0,stdout=b'{"OSType":"windows","ID":"engine"}')
assert m.request(q)['docker']=='unsupported'
m.subprocess.run=lambda *a,**k:types.SimpleNamespace(returncode=0,stdout=b'{"OSType":"linux","ID":"engine","NCPU":6,"MemTotal":12884901888}')
state=m.request(q);assert state['docker']=='ready' and state['engineId']=='engine' and 'errorCode' not in state
assert state['cpus']==6 and state['memoryMb']==12288
assert calls[0][1]['env']['DOCKER_HOST']=='unix:///var/run/docker.sock'
installed=[];m.install_root=lambda *a:installed.append(a)
for supervisor,workspace,error in [('mismatch','ready','SSH_PROTOCOL_MISMATCH'),('unsafe','ready','SSH_SUPERVISOR_UNSAFE'),('ready','invalid','SSH_WORKSPACE_INVALID')]:
    m.supervisor=lambda _,v=supervisor:v;m.workspace=lambda *a,v=workspace:v
    assert m.request({**q,'action':'install'})['errorCode']==error
assert installed==[]
m.supervisor=lambda _:'ready';m.workspace=lambda *a:'ready'
m.request({**q,'action':'install'});assert installed==[]
m.supervisor=lambda _:'missing';m.workspace=lambda *a:'missing';m.shutil.which=lambda *a,**k:None
def sudo(args,**kw):
    calls.append((args,kw));assert args[:4]==['sudo','-n','--','/usr/bin/python3']
    sent=json.loads(kw['input']);assert sent['action']=='install-root' and 'uid' not in sent
    return types.SimpleNamespace(returncode=1,stdout=b'',stderr=b'private password prompt')
m.subprocess.run=sudo
state=m.request({**q,'action':'install','bootstrap':'aGVsbG8=','helper':'aGVsbG8='});assert state['errorCode']=='SSH_SETUP_PERMISSION_REQUIRED'
assert 'private' not in json.dumps(state)
def timeout(*a,**k):raise subprocess.TimeoutExpired('sudo',20)
m.subprocess.run=timeout
assert m.request({**q,'action':'install','bootstrap':'aGVsbG8=','helper':'aGVsbG8='})['errorCode']=='SSH_SETUP_UNKNOWN'
before=len(calls);assert m.request(q)['supervisor']=='missing';assert len(calls)==before
# Validate actual ownership/mode predicates independently of the host OS.
class FakePath:
    def __init__(self,mode,uid):self.mode,self.uid=mode,uid
    def lstat(self):return types.SimpleNamespace(st_mode=self.mode,st_uid=self.uid)
assert m.regular(FakePath(stat.S_IFREG|0o644,0))
assert not m.regular(FakePath(stat.S_IFREG|0o664,0))
assert not m.regular(FakePath(stat.S_IFREG|0o644,1001))
assert not m.regular(FakePath(stat.S_IFLNK|0o777,0))
print('onboarding-policy-ok')
`;
 const result=spawnSync('python',['-c',script],{encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/onboarding-policy-ok/);
});

test('privileged creation uses no-follow directory fds, never replaces files, and never repairs existing permissions',{skip:process.platform==='win32'?'POSIX dir_fd and ownership require Linux bootstrap integration':false},()=>{
 const script=String.raw`
import hashlib, importlib.util, os, tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('onboarding','scripts/ssh-onboarding.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)/'workspace';root.mkdir(mode=0o700)
    # Exercise unprivileged directory descriptors with the real current uid/gid;
    # the private root in tmp is owned by the test process, never a deployment path.
    original_fstat=m.os.fstat
    def fstat(fd):
        s=original_fstat(fd)
        # /tmp's sticky parent is intentionally excluded from the production installer.
        if s.st_mode & 0o1000:
            from types import SimpleNamespace
            return SimpleNamespace(st_uid=os.getuid(),st_mode=0o40755)
        return s
    m.os.fstat=fstat
    fd=m.directory(root/'new',os.getuid(),os.getgid(),True);os.close(fd)
    assert (root/'new').stat().st_mode & 0o777==0o700
    existing=root/'existing';existing.mkdir(mode=0o755)
    try:m.directory(existing,os.getuid(),os.getgid(),True)
    except ValueError as e:assert str(e)=='SSH_WORKSPACE_INVALID'
    else:raise AssertionError('existing permissions accepted')
    assert existing.stat().st_mode & 0o777==0o755
    link=root/'link';link.symlink_to(existing,target_is_directory=True)
    try:m.directory(link,os.getuid(),os.getgid(),True)
    except OSError:pass
    else:raise AssertionError('symlink accepted')
print('onboarding-posix-ok')
`;
 const result=spawnSync('python',['-c',script],{encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/onboarding-posix-ok/);
});
