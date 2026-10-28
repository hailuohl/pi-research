import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import ts from 'typescript';

test('release typecheck ignores disconnected drafts and rejects their errors once imported by an application',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-build-entry-'));
 try{
  mkdirSync(join(dir,'apps/server'),{recursive:true});mkdirSync(join(dir,'packages'));
  const config=JSON.parse(readFileSync(resolve('tsconfig.json'),'utf8'));
  config.compilerOptions={...config.compilerOptions,types:[],noEmit:true};
  writeFileSync(join(dir,'tsconfig.json'),JSON.stringify(config));
  const entry=join(dir,'apps/server/index.ts'),draft=join(dir,'packages/draft.ts');
  writeFileSync(entry,'export const ready = true;\n');
  writeFileSync(draft,'export const unfinished: string = 42;\n');
  const diagnostics=()=>{
   const input=ts.readConfigFile(join(dir,'tsconfig.json'),ts.sys.readFile);
   const parsed=ts.parseJsonConfigFileContent(input.config,ts.sys,dir);
   return [...parsed.errors,...ts.getPreEmitDiagnostics(ts.createProgram(parsed.fileNames,parsed.options))];
  };
  assert.deepEqual(diagnostics().map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
  writeFileSync(entry,"import '../../packages/draft.js';\nexport const ready = true;\n");
  assert.ok(diagnostics().some(d=>d.code===2322&&resolve(d.file.fileName)===resolve(draft)),'imported draft errors must block the release');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
