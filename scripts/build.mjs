import {spawnSync} from 'node:child_process';
import {existsSync,cpSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const compiler=resolve('node_modules/typescript/bin/tsc');
const run=(config)=>{const args=existsSync(compiler)?[compiler,'-p',config]:['-p',config];const p=spawnSync(existsSync(compiler)?process.execPath:'tsc',args,{stdio:'inherit',shell:false});if(p.status!==0)process.exit(p.status??1);};
run('tsconfig.json');if(existsSync('apps/web/src/app.tsx'))run('apps/web/tsconfig.json');mkdirSync('dist/web',{recursive:true});cpSync('apps/web/public','dist/web',{recursive:true});
