import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const live=process.env.PI_LATEX_LIVE==='1',root=resolve(import.meta.dirname,'../..'),base=join(root,'.validation');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const doc=body=>'\\documentclass{article}\n\\begin{document}\n'+body+'\n\\end{document}\n';
const cases=[
 {name:'pdflatex',engine:'pdflatex',main:doc('Hello world.'),status:'succeeded'},
 {name:'xelatex',engine:'xelatex',main:doc('Hello world.'),status:'succeeded'},
 {name:'lualatex',engine:'lualatex',main:doc('Hello world.'),status:'succeeded'},
 {name:'chinese',engine:'xelatex',main:'\\documentclass{article}\n\\usepackage{fontspec}\n\\setmainfont{Noto Serif CJK SC}\n\\begin{document}\n中文论文：固定环境与真实编译。\n\\end{document}',status:'succeeded'},
 {name:'chinese-hyperref',engine:'xelatex',main:readFileSync(join(root,'scripts','document-build','smoke.tex'),'utf8'),status:'succeeded'},
 {name:'lua-chinese-budget',engine:'lualatex',main:'\\documentclass{article}\n\\usepackage{fontspec}\n\\setmainfont{Noto Serif CJK SC}\n\\begin{document}\n中文论文：固定环境与真实编译。\n\\end{document}',status:'succeeded',allowMemoryKill:true},
 {name:'bibtex',engine:'pdflatex',main:doc('Source \\cite{demo}.\\bibliographystyle{plain}\\bibliography{refs}'),files:{'refs.bib':'@book{demo,author={Ada Author},title={Evidence},year={2024},publisher={Example}}'},status:'succeeded'},
 {name:'biber',engine:'pdflatex',main:'\\documentclass{article}\n\\usepackage[backend=biber]{biblatex}\n\\addbibresource{refs.bib}\n\\begin{document}\nSource \\cite{demo}.\\printbibliography\n\\end{document}',files:{'refs.bib':'@book{demo,author={Ada Author},title={Evidence},year={2024},publisher={Example}}'},status:'succeeded'},
 {name:'missing-image',engine:'pdflatex',main:'\\documentclass{article}\n\\usepackage{graphicx}\n\\begin{document}\n\\includegraphics{missing-image.png}\n\\end{document}',status:'failed',line:4,diagnostic:'missing_image'},
 {name:'missing-package',engine:'pdflatex',main:'\\documentclass{article}\n\\usepackage{pi-package-does-not-exist}\n\\begin{document}Hi\\end{document}',status:'failed',diagnostic:'missing_package'},
 {name:'undefined-reference',engine:'pdflatex',main:doc('See \\ref{missing}.'),status:'non_convergent'},
 {name:'shell-blocked',engine:'pdflatex',main:doc('\\immediate\\write18{touch /output/escaped}\nSafe.'),status:'succeeded',absent:'escaped'},
 {name:'lua-blocked',engine:'lualatex',main:doc('\\directlua{for _,n in ipairs({"execute","spawn","exec"}) do assert(os[n]("touch /output/escaped") == nil) end; assert(io.popen("touch /output/escaped") == nil); assert(package.loadlib("/lib/x86_64-linux-gnu/libc.so.6","system") == nil); assert(not pcall(require,"ffi")); assert(not pcall(require,"socket")); for k,_ in pairs(require("debug")) do assert(k == "traceback") end; assert(io.open("/output/build.json","w") == nil)}Safe.'),status:'succeeded',absent:'escaped'},
 {name:'forged-result',engine:'pdflatex',main:doc('\\newwrite\\out\\immediate\\openout\\out=build.json\n\\immediate\\write\\out{forged-success}\\immediate\\closeout\\out\n\\UndefinedControlSequence'),status:'failed'},
 {name:'lua-forged-host-result',engine:'lualatex',main:doc('\\directlua{io.output("/output/build.json"); io.write([[{"status":"succeeded","hadErrors":false}]]); io.close()}\\UndefinedControlSequence'),status:'failed'},
 {name:'pdf-before-error',engine:'pdflatex',main:doc('First page.\\newpage\\UndefinedControlSequence'),status:'failed'},
 {name:'absolute-write-blocked',engine:'pdflatex',main:doc('\\newwrite\\out\\immediate\\openout\\out=/output/build.json\nHello'),status:'failed'},
 {name:'biber-remote-blocked',engine:'pdflatex',main:'\\documentclass{article}\n\\usepackage{biblatex}\n\\addbibresource{https://example.com/refs.bib}\n\\begin{document}\\cite{demo}\\printbibliography\\end{document}',status:'failed'},
 {name:'biber-nonutf8-control',engine:'lualatex',main:doc('\\directlua{local f=assert(io.open("/work/build/document.bcf","wb")); f:write(string.char(255,254,60,0,63,0)); f:close()}Hello'),status:'failed'},
 {name:'timeout',engine:'pdflatex',main:doc('\\newcount\\a\\loop\\advance\\a by1\\iftrue\\repeat'),status:'timed_out'},
];
for(const fixture of cases)test('isolated compiler: '+fixture.name,{skip:!live,timeout:155000},async()=>{
 mkdirSync(base,{recursive:true});const directory=mkdtempSync(join(base,'document-build-test-'+fixture.name+'-')),source=join(directory,'source'),output=join(directory,'output');mkdirSync(source);mkdirSync(output);
 writeFileSync(join(source,'main.tex'),fixture.main);for(const [name,value]of Object.entries(fixture.files??{}))writeFileSync(join(source,name),value);
 const receipt=JSON.parse(readFileSync(join(base,'document-build-cache','latest.json'),'utf8')),sourceDigest=digest(Buffer.from(fixture.main));
 writeFileSync(join(directory,'runtime.json'),JSON.stringify({fixture:fixture.name,imageDigest:receipt.imageDigest,profileDigest:receipt.profileDigest,sourceDigest},null,2)+'\n');
 const argv=['--context',receipt.dockerContext,'run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--user','65532:65532','--pids-limit','128','--cpus','1','--memory','768m','--memory-swap','768m','--tmpfs','/work:rw,nosuid,nodev,exec,uid=65532,gid=65532,mode=1777,size=256m','--tmpfs','/tmp:rw,nosuid,nodev,noexec,uid=65532,gid=65532,mode=1777,size=32m','--mount',`type=bind,src=${source},dst=/source,readonly`,'--mount',`type=bind,src=${output},dst=/output`,'--entrypoint','/bin/sh',receipt.imageDigest,'-c','cp -R /source /work/source && chmod -R u+rwX /work/source && exec python -I /opt/pi-document-build/build.py "$@"','pi-build',fixture.engine,'main.tex','auto',sourceDigest,'/output'];
 const run=await new Promise((done,reject)=>{let log='';const child=spawn('docker',argv,{shell:false,windowsHide:true});child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);child.on('error',reject);child.on('exit',code=>done({code,log}));});
 writeFileSync(join(directory,'docker.log'),run.log);
 assert.ok(existsSync(join(output,'build.json')),run.log);
 const result=JSON.parse(readFileSync(join(output,'build.json'),'utf8'));assert.equal(result.sourceDigest,sourceDigest);
 const memoryKill=fixture.allowMemoryKill&&result.status==='failed'&&result.diagnostics.some(d=>d.code==='engine_exit'&&d.message.endsWith('status -9.'));
 if(!memoryKill)assert.equal(result.status,fixture.status,JSON.stringify(result.diagnostics));assert.equal(run.code,result.status==='succeeded'?0:1);
 assert.equal(result.hadErrors,result.status!=='succeeded');if(fixture.line)assert.ok(result.diagnostics.some(d=>d.file==='main.tex'&&d.line===fixture.line),JSON.stringify(result.diagnostics));
 if(fixture.diagnostic)assert.ok(result.diagnostics.some(d=>d.code===fixture.diagnostic),JSON.stringify(result.diagnostics));
 if(result.status!=='succeeded'){assert.equal(result.pdf,null);assert.deepEqual(result.previews,[]);assert.equal(existsSync(join(output,'document.pdf')),false);}
 if(fixture.absent)assert.equal(existsSync(join(output,fixture.absent)),false);
 if(result.pdf){assert.equal(result.converged,true);for(const artifact of [result.pdf,...result.previews,...result.logs]){const bytes=readFileSync(join(output,artifact.file));assert.equal(digest(bytes),artifact.digest);assert.equal(bytes.length,artifact.bytes);}}
});
