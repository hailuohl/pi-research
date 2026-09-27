import {spawnSync} from 'node:child_process';
import {existsSync, cpSync, mkdirSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

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
const typecheck = process.argv.includes('--typecheck');
for (const config of ['tsconfig.json', 'apps/web/tsconfig.json']) {
  const p = spawnSync(process.execPath, [compiler, '-p', config, ...(typecheck ? ['--noEmit'] : [])], {cwd: root, stdio: 'inherit', shell: false});
  if (p.error || p.status !== 0) {
    if (p.error) console.error(p.error.message);
    process.exit(p.status ?? 1);
  }
}
if (!typecheck) {
  mkdirSync(resolve(root, 'dist/web'), {recursive: true});
  cpSync(resolve(root, 'apps/web/public'), resolve(root, 'dist/web'), {recursive: true});
}
