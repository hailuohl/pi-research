import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,copyFileSync,existsSync,createWriteStream} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const root=resolve(import.meta.dirname,'..'),source=join(root,'scripts','document-build');
const args=process.argv.slice(2),resolveLock=args.includes('--resolve'),context=args.find(x=>!x.startsWith('--'))??'desktop-linux';
if(args.some(x=>x.startsWith('--')&&x!=='--resolve')||!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(context))throw Error('Usage: node scripts/setup-document-build.mjs [context] [--resolve]');
const base='python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f',snapshot='20260918T000000Z';
const packages=['texlive-latex-base','texlive-latex-recommended','texlive-xetex','texlive-luatex','texlive-bibtex-extra','biber','poppler-utils','fonts-lmodern','fonts-noto-cjk'];
const cache=join(root,'.validation','document-build-cache'),debs=join(cache,'debs');mkdirSync(debs,{recursive:true});
const run=(argv)=>new Promise((done,fail)=>{const log=createWriteStream(join(cache,`docker-${Date.now()}.log`)),child=spawn('docker',['--context',context,...argv],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log.write(chunk);process.stdout.write(chunk);});child.on('error',error=>{log.end();fail(error);});child.on('close',code=>{log.end();code===0?done():fail(Error(`Docker exited ${code}; evidence retained at ${cache}`));});});
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
 (root/'debs'/f.name).write_bytes(b);result.append({'name':info['Package'],'version':info['Version'],'architecture':info['Architecture'],'file':f.name,'url':url,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
if len(result)!=len(entries):raise ValueError('Missing downloaded dependency')
(root/'resolved.lock.json').write_text(json.dumps({'formatVersion':1,'baseImage':'${base}','platform':'linux/amd64','suite':'trixie','snapshot':'${snapshot}','roots':pkgs,'downloadBytes':total,'packages':result},indent=2)+'\\n')
`;
 writeFileSync(join(cache,'resolve.py'),resolver);
 await run(['run','--rm','--pull','never','--platform','linux/amd64','--mount',`type=bind,src=${cache},dst=/download`,'--entrypoint','python',base,'-I','/download/resolve.py']);
 copyFileSync(join(cache,'resolved.lock.json'),join(source,'debian-packages.lock.json'));
}
const lockBytes=readFileSync(join(source,'debian-packages.lock.json')),lock=JSON.parse(lockBytes);
if(lock.baseImage!==base||lock.platform!=='linux/amd64'||!Array.isArray(lock.packages)||lock.packages.length>500)throw Error('Invalid dependency lock');
for(const p of lock.packages){
 if(!/^[A-Za-z0-9][A-Za-z0-9+_.%~-]*\.deb$/.test(p.file)||!/^https:\/\/snapshot\.debian\.org\/archive\//.test(p.url)||!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>256*1024*1024||!/^[a-f0-9]{64}$/.test(p.sha256))throw Error('Invalid locked package');
 const destination=join(debs,p.file);
 if(existsSync(destination)){const bytes=readFileSync(destination);if(bytes.length===p.bytes&&hash(bytes)===p.sha256)continue;throw Error(`Corrupt cache: ${p.file}`);}
 console.log(`Downloading ${p.name} ${p.version} (${p.bytes} bytes)`);
 const response=await fetch(p.url,{signal:AbortSignal.timeout(180000)});if(!response.ok||!response.body)throw Error(`Download failed: ${p.file}`);
 let count=0;const digest=createHash('sha256');await pipeline(Readable.fromWeb(response.body),new Transform({transform(chunk,encoding,callback){count+=chunk.length;if(count>p.bytes)return callback(Error('Package exceeds locked size'));digest.update(chunk);callback(null,chunk);}}),createWriteStream(destination,{flags:'wx'}));
 if(count!==p.bytes||digest.digest('hex')!==p.sha256)throw Error(`Package checksum mismatch: ${p.file}`);
}
for(const name of ['Dockerfile','build.py','debian-packages.lock.json'])copyFileSync(join(source,name),join(cache,name));
const profileId='latex-document-v1',lockDigest=hash(lockBytes),scriptDigest=hash(readFileSync(join(cache,'build.py'))),dockerfileDigest=hash(readFileSync(join(cache,'Dockerfile'))),profileDigest=hash(JSON.stringify({profileId,lockDigest,scriptDigest,dockerfileDigest}));
await run(['build','--network','none','--pull=false','--platform','linux/amd64',...Object.entries({LOCK_DIGEST:lockDigest,SCRIPT_DIGEST:scriptDigest,DOCKERFILE_DIGEST:dockerfileDigest,PROFILE_DIGEST:profileDigest}).flatMap(([key,value])=>['--build-arg',`${key}=${value}`]),'--iidfile',join(cache,'image.id'),'-t','pi-document-build:latex-document-v1',cache]);
const receipt={profileId,dockerContext:context,imageDigest:readFileSync(join(cache,'image.id'),'utf8').trim(),lockDigest,scriptDigest,dockerfileDigest,profileDigest};writeFileSync(join(cache,'latest.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
