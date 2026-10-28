import test from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,readdirSync,symlinkSync,lstatSync,rmdirSync,unlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,relative,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

test('release output is identical after CRLF-only source edits and preserves binary assets',()=>{
 const root=resolve('.'),dir=mkdtempSync(join(tmpdir(),'pi-build-eol-')),modules=join(dir,'node_modules');
 try{
  for(const p of ['scripts','apps/server','apps/web/src','apps/web/public'])mkdirSync(join(dir,p),{recursive:true});
  for(const p of ['.node-version','package.json','scripts/build.mjs'])cpSync(join(root,p),join(dir,p));
  symlinkSync(join(root,'node_modules'),modules,process.platform==='win32'?'junction':'dir');
  writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'NodeNext',moduleResolution:'NodeNext',rootDir:'.',outDir:'dist',strict:true,skipLibCheck:true,types:[],declaration:true,sourceMap:true},include:['apps/server/**/*.ts']}));
  writeFileSync(join(dir,'apps/web/tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',strict:true,skipLibCheck:true,types:[],noEmit:true},include:['src']}));
  const sources={
   'apps/server/index.ts':'export const marker = `alpha\nbeta`;\nexport const raw = String.raw`left\nright`;\nexport const literal = "keep\\r\\nexact";\n',
   'apps/web/src/main.tsx':"import {ready} from './helper';\nconsole.log(ready);\n",
   'apps/web/src/helper.ts':'export const ready = true;\n',
   'apps/web/public/index.html':'<!doctype html>\n<p>研舟π</p>\n',
   'apps/web/public/style.css':'body {\n color: black;\n}\n',
   'apps/web/public/data.json':'{\n "ready": true\n}\n'
  };
  const binary=Buffer.from([137,80,78,71,13,10,26,10,0]);
  writeFileSync(join(dir,'apps/web/public/binary.png'),binary);
  writeFileSync(join(dir,'apps/web/public/bytes.txt'),Buffer.from([255,10,128]));
  const manifest=()=>{const values={};const walk=p=>{for(const e of readdirSync(p,{withFileTypes:true})){const q=join(p,e.name);if(e.isDirectory())walk(q);else values[relative(join(dir,'dist'),q)]=createHash('sha256').update(readFileSync(q)).digest('hex');}};walk(join(dir,'dist'));return values;};
  const build=()=>{const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:dir,encoding:'utf8',timeout:60000,windowsHide:true});assert.equal(result.status,0,result.stderr||result.stdout);assert.deepEqual(readFileSync(join(dir,'dist/web/binary.png')),binary);return manifest();};
  for(const [p,text]of Object.entries(sources))writeFileSync(join(dir,p),text);
  const lf=build();
  for(const [p,text]of Object.entries(sources))writeFileSync(join(dir,p),text.replaceAll('\n','\r\n'));
  writeFileSync(join(dir,'apps/web/public/bytes.txt'),Buffer.from([255,13,10,128]));
  assert.deepEqual(build(),lf);
  for(const [p,text]of Object.entries(sources))assert.equal(readFileSync(join(dir,p),'utf8'),text.replaceAll('\n','\r\n'),'build must not rewrite source '+p);
  assert.deepEqual(readFileSync(join(dir,'dist/web/bytes.txt')),Buffer.from([255,10,128]));
  const moduleUrl=pathToFileURL(join(dir,'dist/apps/server/index.js')).href,result=spawnSync(process.execPath,['--input-type=module','-e',`console.log(JSON.stringify(await import(${JSON.stringify(moduleUrl)})))`],{encoding:'utf8',windowsHide:true});
  assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),{marker:'alpha\nbeta',raw:'left\nright',literal:'keep\r\nexact'});
 }finally{
  assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));
  if(lstatSync(modules,{throwIfNoEntry:false})?.isSymbolicLink())process.platform==='win32'?rmdirSync(modules):unlinkSync(modules);
  rmSync(dir,{recursive:true,force:true});
 }
});
