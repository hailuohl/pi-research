import {spawnSync} from 'node:child_process';
import {existsSync, cpSync, mkdirSync, readFileSync,readdirSync,rmSync} from 'node:fs';
import {resolve,relative} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const nodeVersion = readFileSync(resolve(root, '.node-version'), 'utf8').trim();
if (process.versions.node !== nodeVersion) {
  console.error(`BUILD_NODE_MISMATCH: reproducible builds require Node ${nodeVersion}; found ${process.versions.node}`);
  process.exit(1);
}
const compiler = resolve(root, 'node_modules/typescript/bin/tsc');
if (!existsSync(compiler)) {
  console.error('BUILD_DEPENDENCIES_MISSING: run npm ci; a global tsc is not a reproducible build.');
  process.exit(1);
}
const expected = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).devDependencies.typescript;
const installed = JSON.parse(readFileSync(resolve(root, 'node_modules/typescript/package.json'), 'utf8')).version;
if (installed !== expected) {
  console.error(`BUILD_COMPILER_MISMATCH: require TypeScript ${expected}; run npm ci.`);
  process.exit(1);
}
const dependencies=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
for(const name of ['esbuild','react','react-dom','@types/react','@types/react-dom']){
  const version=JSON.parse(readFileSync(resolve(root,'node_modules',name,'package.json'),'utf8')).version;
  if(version!==(dependencies.dependencies?.[name]??dependencies.devDependencies[name]))throw new Error(`BUILD_DEPENDENCY_MISMATCH: ${name}; run npm ci.`);
}
const typecheck = process.argv.includes('--typecheck');
for (const config of ['tsconfig.json', 'apps/web/tsconfig.json']) {
  const p = spawnSync(process.execPath, [compiler, '-p', config, ...(typecheck ? ['--noEmit'] : [])], {cwd: root, stdio: 'inherit', shell: false});
  if (p.error || p.status !== 0) {
    if (p.error) console.error(p.error.message);
    process.exit(p.status ?? 1);
  }
}
if (!typecheck) {
  const {build}=await import('esbuild');
  const output=resolve(root,'dist/web');
  if(relative(root,output).replaceAll('\\','/')!=='dist/web')throw new Error('Unsafe web output directory');
  rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
  // Keep the original vendor bytes only as the pinned source baseline, never ship/load them.
  const legacyVendor=resolve(root,'apps/web/public/vendor');
  cpSync(resolve(root,'apps/web/public'),output,{recursive:true,filter:path=>resolve(path)!==legacyVendor});
  const source=resolve(root,'apps/web/src'),entries=readdirSync(source).filter(name=>/\.(ts|tsx)$/.test(name)&&!name.endsWith('.d.ts')&&name!=='main.tsx').map(name=>resolve(source,name));
  // Retain importable modules for focused component checks; the browser uses the self-contained main bundle.
  await build({entryPoints:entries,outdir:resolve(output,'assets'),format:'esm',platform:'browser',target:'es2020',jsx:'automatic',bundle:false,logLevel:'warning'});
  await build({entryPoints:[resolve(source,'main.tsx')],outfile:resolve(output,'assets/main.js'),format:'esm',platform:'browser',target:'es2020',jsx:'automatic',bundle:true,minify:true,keepNames:true,define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof',logLevel:'warning'});
  cpSync(resolve(root,'node_modules/react/LICENSE'),resolve(output,'LICENSE.react.txt'));
}
