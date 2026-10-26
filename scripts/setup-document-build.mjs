import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,renameSync,copyFileSync,existsSync,createWriteStream,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const root=resolve(import.meta.dirname,'..'),source=join(root,'scripts','document-build');
const args=process.argv.slice(2),resolveLock=args.includes('--resolve'),context=args.find(x=>!x.startsWith('--'))??'desktop-linux';
if(args.some(x=>x.startsWith('--')&&x!=='--resolve')||!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(context))throw Error('Usage: node scripts/setup-document-build.mjs [context] [--resolve]');
const base='python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f',snapshot='20260918T000000Z';
const packages=['texlive-latex-base','texlive-latex-recommended','texlive-lang-chinese','texlive-fonts-recommended','texlive-xetex','texlive-luatex','texlive-bibtex-extra','biber','poppler-utils','fonts-lmodern','fonts-noto-cjk'];
const cache=join(root,'.validation','document-build-cache'),debs=join(cache,'debs');mkdirSync(debs,{recursive:true});
const run=(argv,capture=false)=>new Promise((done,fail)=>{let stdout='';const log=createWriteStream(join(cache,`docker-${Date.now()}.log`)),child=spawn('docker',['--context',context,...argv],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});if(capture)child.stdout.on('data',chunk=>stdout+=chunk);for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log.write(chunk);process.stdout.write(chunk);});child.on('error',error=>{log.end();fail(error);});child.on('close',code=>{log.end();code===0?done(stdout):fail(Error(`Docker exited ${code}; evidence retained at ${cache}`));});});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
if(resolveLock){
 const resolver=`import subprocess,pathlib,json,hashlib,re,os
root=pathlib.Path('/download'); sources=pathlib.Path('/etc/apt/sources.list.d/debian.sources')
sources.write_text('Types: deb\\nURIs: https://snapshot.debian.org/archive/debian/${snapshot}/\\nSuites: trixie trixie-updates\\nComponents: main\\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\\nCheck-Valid-Until: no\\n\\nTypes: deb\\nURIs: https://snapshot.debian.org/archive/debian-security/${snapshot}/\\nSuites: trixie-security\\nComponents: main\\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\\nCheck-Valid-Until: no\\n')
pkgs=${JSON.stringify(packages)}
def call(args):
 p=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);print(p.stdout,flush=True);p.check_returncode();return p.stdout
call(['apt-get','update'])
simulation=call(['apt-get','-s','--no-install-recommends','install',*pkgs]);(root/'simulation.txt').write_text(simulation)
uris=call(['apt-get','--print-uris','--yes','--download-only','--no-install-recommends','install',*pkgs]);(root/'download-plan.txt').write_text(uris)
entries={m[1]:(m[0],int(m[2])) for m in re.findall(r"^'([^']+)' (\\S+) (\\d+) \\S+",uris,re.M)}
total=sum(size for _,size in entries.values());print('Download bytes:',total,flush=True)
if not entries or total>900*1024*1024:raise ValueError('Empty or excessive dependency download')
call(['apt-get','--yes','--download-only','--no-install-recommends','install',*pkgs])
result=[]
for f in sorted(pathlib.Path('/var/cache/apt/archives').glob('*.deb')):
 b=f.read_bytes();fields=call(['dpkg-deb','-f',str(f),'Package','Version','Architecture']);info=dict(line.split(': ',1) for line in fields.strip().splitlines());url,size=entries[f.name]
 if len(b)!=size:raise ValueError('Download size mismatch')
 destination=root/'debs'/f.name
 if destination.exists():
  if destination.read_bytes()!=b:raise ValueError('Corrupt existing cache: '+f.name)
 else:destination.write_bytes(b)
 result.append({'name':info['Package'],'version':info['Version'],'architecture':info['Architecture'],'file':f.name,'url':url,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
if len(result)!=len(entries):raise ValueError('Missing downloaded dependency')
(root/'resolved.lock.json').write_text(json.dumps({'formatVersion':1,'baseImage':'${base}','platform':'linux/amd64','suite':'trixie','snapshot':'${snapshot}','roots':pkgs,'downloadBytes':total,'packages':result},indent=2)+'\\n')
`;
 writeFileSync(join(cache,'resolve.py'),resolver);
 await run(['run','--rm','--pull','never','--platform','linux/amd64','--mount',`type=bind,src=${cache},dst=/download`,'--entrypoint','python',base,'-I','/download/resolve.py']);
 copyFileSync(join(cache,'resolved.lock.json'),join(source,'debian-packages.lock.json'));
 console.log('Resolved dependency lock; review the lock, then run without --resolve to publish an image.');
 process.exit(0);
}
const lockBytes=readFileSync(join(source,'debian-packages.lock.json')),lock=JSON.parse(lockBytes);
if(lock.formatVersion!==1||lock.baseImage!==base||lock.platform!=='linux/amd64'||lock.suite!=='trixie'||lock.snapshot!==snapshot||!Array.isArray(lock.packages)||lock.packages.length<1||lock.packages.length>500||new Set(lock.packages.map(p=>p.file)).size!==lock.packages.length||lock.downloadBytes!==lock.packages.reduce((n,p)=>n+p.bytes,0)||lock.downloadBytes>900*1024*1024||!Array.isArray(lock.roots)||packages.some(name=>!lock.roots.includes(name)||!lock.packages.some(p=>p.name===name)))throw Error('Invalid dependency lock');
for(const p of lock.packages){
 if(!/^[A-Za-z0-9][A-Za-z0-9+_.%~-]*\.deb$/.test(p.file)||!p.url.startsWith(`https://snapshot.debian.org/archive/debian/${snapshot}/`)&&!p.url.startsWith(`https://snapshot.debian.org/archive/debian-security/${snapshot}/`)||!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>256*1024*1024||!/^[a-f0-9]{64}$/.test(p.sha256))throw Error('Invalid locked package');
 const destination=join(debs,p.file);
 if(existsSync(destination)){const bytes=readFileSync(destination);if(bytes.length===p.bytes&&hash(bytes)===p.sha256)continue;throw Error(`Corrupt cache: ${p.file}`);}
 console.log(`Downloading ${p.name} ${p.version} (${p.bytes} bytes)`);
 const response=await fetch(p.url,{signal:AbortSignal.timeout(180000)});if(!response.ok||!response.body)throw Error(`Download failed: ${p.file}`);
 let count=0;const digest=createHash('sha256');await pipeline(Readable.fromWeb(response.body),new Transform({transform(chunk,encoding,callback){count+=chunk.length;if(count>p.bytes)return callback(Error('Package exceeds locked size'));digest.update(chunk);callback(null,chunk);}}),createWriteStream(destination,{flags:'wx'}));
 if(count!==p.bytes||digest.digest('hex')!==p.sha256)throw Error(`Package checksum mismatch: ${p.file}`);
}
const profileId='latex-document-v1',lockDigest=hash(lockBytes),scriptDigest=hash(readFileSync(join(source,'build.py'))),dockerfileDigest=hash(readFileSync(join(source,'Dockerfile'))),profileDigest=hash(JSON.stringify({profileId,lockDigest,scriptDigest,dockerfileDigest}));
const staging=mkdtempSync(join(cache,'staging-'+profileDigest+'-'));mkdirSync(join(staging,'debs'));
for(const p of lock.packages)copyFileSync(join(debs,p.file),join(staging,'debs',p.file));
for(const name of ['Dockerfile','build.py','debian-packages.lock.json'])copyFileSync(join(source,name),join(staging,name));
const tag=`pi-document-build:${profileId}-${profileDigest}`;
await run(['build','--network','none','--pull=false','--platform','linux/amd64',...Object.entries({LOCK_DIGEST:lockDigest,SCRIPT_DIGEST:scriptDigest,DOCKERFILE_DIGEST:dockerfileDigest,PROFILE_DIGEST:profileDigest}).flatMap(([key,value])=>['--build-arg',`${key}=${value}`]),'--iidfile',join(staging,'image.id'),'-t',tag,staging]);
const imageDigest=readFileSync(join(staging,'image.id'),'utf8').trim();if(!/^sha256:[a-f0-9]{64}$/.test(imageDigest))throw Error('Invalid built image ID');
const labels=JSON.parse(await run(['image','inspect','--format','{{json .Config.Labels}}',imageDigest],true));for(const [key,value]of Object.entries({profile:profileId,lock:lockDigest,script:scriptDigest,dockerfile:dockerfileDigest,digest:profileDigest}))if(labels?.['pi-research.compiler-'+key]!==value)throw Error('Built image profile mismatch');
const checks=join(staging,'release-check');mkdirSync(checks);mkdirSync(join(checks,'source'));mkdirSync(join(checks,'output'));
const smoke=readFileSync(join(source,'smoke.tex')),sourceDigest=hash(smoke);writeFileSync(join(checks,'source','main.tex'),smoke);
await run(['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--user','65532:65532','--pids-limit','128','--cpus','1','--memory','768m','--memory-swap','768m','--tmpfs','/work:rw,nosuid,nodev,exec,uid=65532,gid=65532,mode=1777,size=256m','--tmpfs','/tmp:rw,nosuid,nodev,noexec,uid=65532,gid=65532,mode=1777,size=32m','--mount',`type=bind,src=${join(checks,'source')},dst=/source,readonly`,'--mount',`type=bind,src=${join(checks,'output')},dst=/output`,'--entrypoint','/bin/sh',imageDigest,'-ec','kpsewhich ctex.sty && kpsewhich pzdr.tfm && kpsewhich hyperref.sty && cp -R /source /work/source && chmod -R u+rwX /work/source && exec python -I /opt/pi-document-build/build.py xelatex main.tex none "$1" /output','pi-release-check',sourceDigest]);
const output=join(checks,'output'),result=JSON.parse(readFileSync(join(output,'build.json'),'utf8'));
if(result.formatVersion!==1||result.profileId!==profileId||result.sourceDigest!==sourceDigest||result.engine!=='xelatex'||result.bibliography!=='none'||result.status!=='succeeded'||result.hadErrors!==false||result.converged!==true||!Array.isArray(result.diagnostics)||result.diagnostics.some(d=>d.severity==='error')||!result.pdf||!Number.isInteger(result.pdf.pages)||result.pdf.pages<1||!Array.isArray(result.previews)||result.previews.length!==result.pdf.pages||!Array.isArray(result.logs)||result.logs.length!==1)throw Error('Release compiler smoke test failed');
const artifacts=[{...result.pdf,expected:'document.pdf'},...result.previews.map((p,i)=>({...p,expected:`page-${String(i+1).padStart(3,'0')}.png`})),{...result.logs[0],expected:'build.log'}];
for(const a of artifacts){if(a.file!==a.expected)throw Error('Unexpected release artifact');const bytes=readFileSync(join(output,a.file));if(bytes.length!==a.bytes||hash(bytes)!==a.digest||a.file.endsWith('.pdf')&&!bytes.subarray(0,5).equals(Buffer.from('%PDF-'))||a.file.endsWith('.png')&&(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',12,16)!=='IHDR'||bytes.readUInt32BE(16)!==a.width||bytes.readUInt32BE(20)!==a.height))throw Error('Release artifact verification failed');}
if(readdirSync(output).length!==artifacts.length+1)throw Error('Unexpected release output');
for(const [name,expected]of [['debian-packages.lock.json',lockDigest],['build.py',scriptDigest],['Dockerfile',dockerfileDigest]])if(hash(readFileSync(join(source,name)))!==expected)throw Error('Compiler files changed during release; no receipt published');
const receipt={profileId,dockerContext:context,imageDigest,lockDigest,scriptDigest,dockerfileDigest,profileDigest};
const receipts=join(cache,'receipts');mkdirSync(receipts,{recursive:true});
if(existsSync(join(cache,'latest.json'))){const previous=readFileSync(join(cache,'latest.json')),value=JSON.parse(previous);if(/^[a-f0-9]{64}$/.test(value.profileDigest)&&!existsSync(join(receipts,value.profileDigest+'.json')))writeFileSync(join(receipts,value.profileDigest+'.json'),previous,{flag:'wx'});}
const receiptBytes=JSON.stringify(receipt,null,2)+'\n',receiptPath=join(receipts,profileDigest+'.json');if(existsSync(receiptPath)){if(readFileSync(receiptPath,'utf8')!==receiptBytes)throw Error('Conflicting release receipt');}else writeFileSync(receiptPath,receiptBytes,{flag:'wx'});
writeFileSync(join(cache,'latest.json.partial'),receiptBytes);renameSync(join(cache,'latest.json.partial'),join(cache,'latest.json'));console.log(JSON.stringify(receipt));
