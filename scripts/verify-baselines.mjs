import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync, existsSync, mkdirSync, mkdtempSync, openSync, closeSync, readFileSync, readdirSync, writeFileSync, lstatSync} from 'node:fs';
import {basename, isAbsolute, join, relative, resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const npm = process.env.npm_execpath;
const sources = process.argv.slice(2).map(path => resolve(path));
const validation = join(root, '.validation');
const within = (path, dir) => {
  const rel = relative(dir, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};
if (sources.length !== 2 || !npm || !existsSync(npm)) {
  console.error('Usage: npm run test:baseline -- <extracted-0.2.3-dir> <extracted-0.3.1-experimental-dir>');
  process.exit(2);
}
if (sources[0].toLowerCase() === sources[1].toLowerCase() || sources.some(path => within(path, validation))) {
  console.error('Pass two distinct frozen source roots outside .validation.');
  process.exit(2);
}
const expected = ['0.2.3', '0.3.1-experimental'];
for (let i = 0; i < 2; i++) {
  const manifest = join(sources[i], 'package.json');
  if (!existsSync(manifest) || JSON.parse(readFileSync(manifest, 'utf8')).version !== expected[i]) {
    console.error(`Expected an extracted ${expected[i]} source root with package.json: ${sources[i]}`);
    process.exit(2);
  }
}

const excluded = new Set(['node_modules', '.git', '.pi-research', '.pi-runtime', '.validation']);
const allowed = path => {
  const name = basename(path);
  return !excluded.has(name) && !((name === '.env' || name.startsWith('.env.')) && name !== '.env.example');
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const frozenOverlayBytes = readFileSync(join(root, 'docs/history/skill-test-overlays.json'));
if (hash(frozenOverlayBytes) !== '504d40903811829c8c86a4c7a2ad27fedcb26abd6d274e63b37815ac79034ea0') throw Error('FROZEN_BASELINE_OVERLAY_MISMATCH: archived test replacement bytes changed');
const frozenOverlays = JSON.parse(frozenOverlayBytes.toString('utf8'));
function businessDigest(dir) {
  const digest = createHash('sha256');
  let files = 0;
  const walk = path => {
    for (const entry of readdirSync(path, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = join(path, entry.name);
      if (!allowed(child)) continue;
      if (entry.isSymbolicLink()) throw Error(`Source link refused: ${child}`);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile()) {
        digest.update(relative(dir, child).replaceAll('\\', '/')).update('\0').update(hash(readFileSync(child))).update('\0');
        files++;
      }
    }
  };
  for (const part of ['apps', 'packages']) walk(join(dir, part));
  return {files, sha256: digest.digest('hex')};
}
const replace = (body, before, after) => {
  if (body.split(before).length !== 2) throw Error(`Expected exactly one test harness match: ${before.slice(0, 80)}`);
  return body.replace(before, after);
};
function overlay(dir, version) {
  const edits = [
    ['audit-integrity.test.mjs', [[
      "symlinkSync('/etc/passwd',join(r.outputDir,'leak.txt'));",
      "const leak=join(r.outputDir,'leak');symlinkSync(s.dir,leak,process.platform==='win32'?'junction':'dir');"
    ], [
      "s.app.store.get('artifact',id).title==='leak.txt'",
      "(()=>{const title=s.app.store.get('artifact',id).title;return title==='leak'||title.startsWith('leak/');})()"
    ]]],
    ['core.test.mjs', [[
      "symlinkSync('/tmp',join(dir,'outside'))",
      "symlinkSync(dir,join(dir,'outside'),process.platform==='win32'?'junction':'dir')"
    ]]],
    ['hardening.test.mjs', [[
      "symlinkSync('/tmp',join(input,'escape'))",
      "symlinkSync(s.dir,join(input,'escape'),process.platform==='win32'?'junction':'dir')"
    ], [
      "symlinkSync(root,join(s.dir,'linked'))",
      "symlinkSync(root,join(s.dir,'linked'),process.platform==='win32'?'junction':'dir')"
    ]]],
    ...frozenOverlays,
    ['handoff-hardening.test.mjs', [[
      "import {setup,USER,approve}from'../support/research.mjs';",
      "import {join} from 'node:path';\nimport {setup,USER,approve}from'../support/research.mjs';"
    ], [
      'const s=setup();const read=fs.readSync;try{const a=',
      'const s=setup(),open=fs.openSync,read=fs.readSync,close=fs.closeSync;try{const a='
    ], [
      "fs.readSync=function(fd,buffer,...args){const n=read.call(fs,fd,buffer,...args);let name='';try{name=fs.readlinkSync(`/proc/self/fd/${fd}`);}catch{}if(n&&name===p.candidateSnapshot.path+'/config.json'&&new Error().stack.includes('readStableFile'))buffer[0]=32;return n;};syncBuiltinESMExports();assert.throws(()=>s.app.changes.apply(USER,p.id),{code:'SNAPSHOT_CORRUPTED'});assert.equal(s.app.store.list('experiment').length,1);",
      "let targetFd,injected=false;fs.openSync=function(path,...args){const fd=open.call(fs,path,...args);if(path===join(p.candidateSnapshot.path,'config.json'))targetFd=fd;return fd;};\nfs.readSync=function(fd,buffer,...args){const n=read.call(fs,fd,buffer,...args);if(n&&fd===targetFd&&new Error().stack.includes('readStableFile')){buffer[0]=32;injected=true;}return n;};\nfs.closeSync=function(fd){const result=close.call(fs,fd);if(fd===targetFd)targetFd=undefined;return result;};syncBuiltinESMExports();assert.throws(()=>s.app.changes.apply(USER,p.id),{code:'SNAPSHOT_CORRUPTED'});assert.equal(injected,true);assert.equal(s.app.store.list('experiment').length,1);"
    ], [
      'finally{fs.readSync=read;syncBuiltinESMExports();s.close();}',
      'finally{fs.openSync=open;fs.readSync=read;fs.closeSync=close;syncBuiltinESMExports();s.close();}'
    ]]],
    ...(version === '0.3.1-experimental' ? [['text-evidence.test.mjs', [[
      "import {existsSync,writeFileSync} from 'node:fs';",
      "import {existsSync,writeFileSync,chmodSync} from 'node:fs';"
    ], [
      "run(s,a);writeFileSync(a.path,'changed');",
      "run(s,a);chmodSync(a.path,0o600);writeFileSync(a.path,'changed');"
    ]]]] : [])
  ];
  return edits.map(([name, changes]) => {
    const path = join(dir, 'tests', 'unit', name);
    const before = readFileSync(path);
    let body = before.toString('utf8');
    for (const [oldText, newText] of changes) body = replace(body, oldText, newText);
    writeFileSync(path, body);
    return {path: `tests/unit/${name}`, beforeSha256: hash(before), afterSha256: hash(body)};
  });
}

function runStep(cwd, log, args) {
  const fd = openSync(log, 'w');
  try {
    const result = spawnSync(process.execPath, args, {cwd, stdio: ['ignore', fd, fd], shell: false});
    if (result.error) writeFileSync(log, `\nSPAWN_ERROR: ${result.error.message}\n`, {flag: 'a'});
    return {command: [process.execPath, ...args], exitCode: result.status ?? 1, signal: result.signal ?? null, log};
  } finally { closeSync(fd); }
}
function testFiles(dir) {
  return ['unit', 'integration'].flatMap(group => readdirSync(join(dir, 'tests', group))
    .filter(name => name.endsWith('.test.mjs')).sort().map(name => join('tests', group, name)));
}
function testTotals(log) {
  const body = readFileSync(log, 'utf8');
  return Object.fromEntries(['tests', 'pass', 'fail', 'skipped'].map(name => {
    const match = body.match(new RegExp(`(?:^|\\n)[^\\r\\n]*?${name} (\\d+)(?:\\r?\\n|$)`, 'm'));
    return [name, match ? Number(match[1]) : null];
  }));
}

mkdirSync(validation, {recursive: true});
const out = mkdtempSync(join(validation, 'baselines-'));
const summary = {description: 'Frozen business source with portable test harness overlays; not an unmodified ZIP test result.',
  generatedAt: new Date().toISOString(), node: process.version, npmEntrypoint: npm, outputDirectory: out, variants: []};
const save = () => writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
save();
for (let i = 0; i < 2; i++) {
  const version = expected[i], label = i ? 'experimental-0.3.1' : 'stable-0.2.3';
  const copy = join(out, label, 'source');
  const item = {label, version, originalSource: sources[i], copiedSource: copy, testHarnessOverlays: [], businessSource: {}, steps: {}};
  summary.variants.push(item);
  try {
    mkdirSync(join(out, label), {recursive: true});
    item.businessSource.originalBefore = businessDigest(sources[i]);
    cpSync(sources[i], copy, {recursive: true, filter: path => {
      if (!allowed(path)) return false;
      if (lstatSync(path).isSymbolicLink()) throw Error(`Source link refused: ${path}`);
      return true;
    }});
    item.testHarnessOverlays = overlay(copy, version);
    item.businessSource.copyAfterOverlay = businessDigest(copy);
    if (item.businessSource.copyAfterOverlay.sha256 !== item.businessSource.originalBefore.sha256) throw Error('Business source changed while copying or overlaying tests.');
    const logs = join(out, label);
    item.steps.npmCi = runStep(copy, join(logs, 'npm-ci.log'), [npm, 'ci', '--no-audit', '--no-fund']);
    item.steps.build = runStep(copy, join(logs, 'build.log'), [npm, 'run', 'build']);
    item.steps.typecheck = runStep(copy, join(logs, 'typecheck.log'), [npm, 'run', 'typecheck']);
    item.steps.tests = runStep(copy, join(logs, 'tests.log'), ['--test', '--test-concurrency=1', ...testFiles(copy)]);
    item.steps.tests.totals = testTotals(item.steps.tests.log);
    item.passed = Object.values(item.steps).every(step => step.exitCode === 0);
  } catch (error) {
    item.passed = false;
    item.error = error.stack ?? String(error);
  } finally {
    if (item.businessSource.originalBefore) {
      try {
        item.businessSource.originalAfter = businessDigest(sources[i]);
        if (existsSync(copy)) item.businessSource.copyAfterValidation = businessDigest(copy);
        item.businessSource.unchanged = item.businessSource.originalBefore.sha256 === item.businessSource.originalAfter.sha256 &&
          item.businessSource.originalBefore.sha256 === item.businessSource.copyAfterValidation?.sha256;
        if (!item.businessSource.unchanged) item.passed = false;
      } catch (error) { item.passed = false; item.error = [item.error, error.stack ?? String(error)].filter(Boolean).join('\n'); }
    }
  }
  save();
  console.log(`${label}: ${item.passed ? 'PASS' : 'FAIL'} (${join(out, label)})`);
}
process.exit(summary.variants.every(item => item.passed) ? 0 : 1);
