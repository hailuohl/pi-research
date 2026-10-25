import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import http from 'node:http';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const MiB = 1024 * 1024;
const argument = name => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);

if (process.argv.includes('--worker')) {
  const size = Number(argument('bytes'));
  assert.ok(Number.isSafeInteger(size) && size >= MiB);
  const {createHttpServer} = await import('../dist/apps/server/http.js');
  const {USER} = await import('../dist/packages/domain/types.js');
  const temporaryRoot = realpathSync.native(tmpdir());
  const dataDir = mkdtempSync(join(temporaryRoot, 'pi-large-file-capacity-'));
  const prefix = Buffer.from('\uFEFFcapacity,中😀\n' + 'a'.repeat(65513) + '😀');
  const suffix = Buffer.from('\nlast,尾🙂\n');
  const bodyLength = size - prefix.length - suffix.length;
  const block = Buffer.alloc(64 * 1024, 120);
  const expectedHash = createHash('sha256');
  let server;
  const result = {sizeBytes:size, node:process.versions.node, heapLimitMiB:192, passed:false};
  const start = performance.now();
  function expectedBytes(start, end) {
    const output = Buffer.alloc(end - start, 120);
    for (const [offset, bytes] of [[0,prefix],[size-suffix.length,suffix]]) {
      const low = Math.max(start, offset), high = Math.min(end, offset + bytes.length);
      if (high > low) bytes.copy(output, low-start, low-offset, high-offset);
    }
    return output;
  }
  async function* original() {
    for (const bytes of [prefix]) { expectedHash.update(bytes); yield bytes; }
    for (let left=bodyLength;left>0;) {
      const bytes=block.subarray(0,Math.min(left,block.length));
      expectedHash.update(bytes);yield bytes;left-=bytes.length;
    }
    expectedHash.update(suffix);yield suffix;
  }
  async function upload(port, projectId) {
    const target=new URL(`http://127.0.0.1:${port}/api/projects/${projectId}/documents/upload`);
    target.searchParams.set('title', `capacity-${size}.txt`);
    target.searchParams.set('mediaType', 'text/plain');
    let response;
    const req=http.request(target,{method:'POST',headers:{'Content-Type':'application/octet-stream','Content-Length':String(size),'Idempotency-Key':randomUUID()}},res=>{
      response=res;
    });
    const completed = new Promise((accept,reject)=>{
      req.once('response',res=>{
        const chunks=[];let count=0;
        res.on('data',bytes=>{count+=bytes.length;if(count>MiB)res.destroy(new Error('Unbounded upload response'));else chunks.push(bytes);});
        res.once('end',()=>{try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));assert.equal(res.statusCode,200,JSON.stringify(value));accept(value);}catch(error){reject(error);}});
        res.once('error',reject);
      });
      req.once('error',reject);
    });
    // A handled rejection also interrupts the producer when a server rejects early.
    completed.catch(()=>req.destroy());
    try {
      for await (const bytes of original()) {
        if(req.destroyed)break;
        if(!req.write(bytes))await Promise.race([once(req,'drain'),completed.then(()=>{})]);
        if(response && response.statusCode!==200)break;
      }
      if(!req.destroyed)req.end();
      return await completed;
    } catch(error) {req.destroy();throw error;}
  }
  async function page(port, projectId, documentId, digest, cursor) {
    const target=new URL(`http://127.0.0.1:${port}/api/projects/${projectId}/documents/${documentId}/text`);
    target.searchParams.set('sourceDigest',digest);target.searchParams.set('cursor',String(cursor));target.searchParams.set('limit','65536');
    const response=await fetch(target),value=await response.json();
    assert.equal(response.status,200,JSON.stringify(value));
    assert.equal(value.cursorUnit,'utf8-byte');assert.equal(value.sourceDigest,digest);
    assert.equal(value.cursor,cursor);assert.ok(value.end>cursor&&value.end-cursor<=65536);
    assert.equal(value.totalBytes,size);assert.equal(value.complete,value.end===size);
    assert.equal(Buffer.byteLength(value.content),value.end-cursor);
    assert.deepEqual(Buffer.from(value.content),expectedBytes(cursor,value.end));
    return value;
  }
  try {
    server=createHttpServer({dataDir,repoRoot:process.cwd(),port:0,computeMonitoring:false});
    let port=await server.listen();await server.host.stop();
    const project=server.app.projects.create(USER,{name:'Large-file capacity fixture',template:'empty'});
    const uploaded=await upload(port,project.id),digest=expectedHash.digest('hex');
    assert.equal(uploaded.original.size,size);assert.equal(uploaded.original.digest,digest);
    result.uploadMilliseconds=Math.round(performance.now()-start);
    const first=await page(port,project.id,uploaded.id,digest,0);
    await page(port,project.id,uploaded.id,digest,first.end);
    await page(port,project.id,uploaded.id,digest,Math.floor(size/2));
    await page(port,project.id,uploaded.id,digest,size-1024);
    await server.close();server=undefined;
    server=createHttpServer({dataDir,repoRoot:process.cwd(),port:0,computeMonitoring:false});
    port=await server.listen();await server.host.stop();
    const reopened=await page(port,project.id,uploaded.id,digest,first.end);
    result.reopenedAtByte=reopened.cursor;result.originalDigest=digest;
    result.peakRssBytes=process.resourceUsage().maxRSS*1024;
    assert.ok(result.peakRssBytes<384*MiB,`Peak RSS ${result.peakRssBytes} exceeds 384 MiB capacity gate`);
    result.passed=true;
  } catch(error) {result.error=error.stack??String(error);process.exitCode=1;}
  finally {
    if(server)await server.close();
    assert.equal(dirname(resolve(dataDir)),resolve(temporaryRoot));
    assert.ok(resolve(dataDir).startsWith(join(resolve(temporaryRoot),'pi-large-file-capacity-')));
    rmSync(dataDir,{recursive:true,force:true});
    result.totalMilliseconds=Math.round(performance.now()-start);
    console.log(JSON.stringify(result));
  }
} else {
  const sizes=(argument('sizes-mib')??'100,300,512').split(',').map(Number);
  assert.ok(sizes.length>0&&sizes.every(size=>Number.isSafeInteger(size)&&size>=1));
  const results=[];
  for(const size of sizes) {
    const child=spawn(process.execPath,['--max-old-space-size=192',fileURLToPath(import.meta.url),'--worker',`--bytes=${size*MiB}`],{cwd:process.cwd(),env:process.env,windowsHide:true,stdio:['ignore','pipe','pipe']});
    let output='',diagnostic='';child.stdout.on('data',bytes=>output+=bytes);child.stderr.on('data',bytes=>diagnostic+=bytes);
    const [code]=await once(child,'exit');
    let result;
    try {result=JSON.parse(output.trim().split(/\r?\n/).at(-1));}catch{result={sizeBytes:size*MiB,passed:false,error:'No capacity result',diagnostic:diagnostic.slice(-4000)};}
    results.push({...result,exitCode:code});
    console.log(JSON.stringify(results.at(-1)));
    if(code!==0||!result.passed){process.exitCode=1;break;}
  }
  const destination=argument('output');
  if(destination){mkdirSync(dirname(resolve(destination)),{recursive:true});writeFileSync(resolve(destination),JSON.stringify({cases:results,passed:results.length===sizes.length&&results.every(result=>result.passed)},null,2));}
}
