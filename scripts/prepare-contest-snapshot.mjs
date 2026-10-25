import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync, symlinkSync} from 'node:fs';
import {dirname, resolve, relative, sep} from 'node:path';
import assert from 'node:assert/strict';

// Snapshot current source bytes, including in-progress work, without copying credentials or research stores.
const root=resolve(import.meta.dirname,'..');
const target=resolve(process.argv[2]??'');
assert(process.argv[2], 'Usage: node scripts/prepare-contest-snapshot.mjs <new-directory-under-.validation>');
assert(target.startsWith(resolve(root,'.validation')+sep), 'Snapshot must stay inside this project .validation');
assert(!existsSync(target), 'Refusing to overwrite an existing snapshot');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const scope=['apps','packages','tests','skills','examples','scripts','third_party','third-party','docs','package.json','package-lock.json','tsconfig.json','.node-version','.nvmrc','LICENSE','THIRD_PARTY_NOTICES.md'];
const files=[...new Set(git('ls-files','-z','-co','--exclude-standard','--',...scope).split('\0'))].filter(Boolean)
  .filter(p=>!p.startsWith('docs/contest/')&&!p.endsWith('.log')&&!p.split('/').some(x=>x==='.env'||x==='node_modules'||x==='.git')).sort();
assert(files.includes('packages/collaboration/graph.ts') && files.includes('package-lock.json'));
mkdirSync(target,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const entries=[];
for(const p of files){
  const source=resolve(root,p),out=resolve(target,p);
  assert(out.startsWith(target+sep));
  if(!existsSync(source))continue;
  assert(lstatSync(source).isFile(),`Not a regular file: ${p}`);
  const bytes=readFileSync(source);mkdirSync(dirname(out),{recursive:true});writeFileSync(out,bytes);
  entries.push({path:p,bytes:bytes.length,sha256:sha(bytes)});
}
const changedDuringCopy=entries.filter(e=>sha(readFileSync(resolve(root,e.path)))!==e.sha256).map(e=>e.path);
const manifest={schemaVersion:1,createdAt:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),
  snapshotKind:'current working source; HEAD alone is insufficient',node:process.version,sourceManifestSha256:sha(JSON.stringify(entries)),
  dependencyMode:'read-only use of existing locked node_modules through junction; no install',changedDuringCopy,files:entries};
writeFileSync(resolve(target,'source-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
assert.equal(changedDuringCopy.length,0,'Source changed during snapshot; inspect changedDuringCopy before using it');
symlinkSync(resolve(root,'node_modules'),resolve(target,'node_modules'),'junction');
console.log(JSON.stringify({snapshot:relative(root,target),files:entries.length,sourceManifestSha256:manifest.sourceManifestSha256}));
