import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, openSync, closeSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..'), npm = process.env.npm_execpath;
assert.ok(npm, 'Run npm run verify:build after npm run build.');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function manifest(dir) {
  const files = {};
  const walk = path => {
    for (const entry of readdirSync(path, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const next = join(path, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (entry.isFile()) files[relative(dir, next).replaceAll('\\', '/')] = hash(readFileSync(next));
      else throw Error(`Unexpected non-file build output: ${next}`);
    }
  };
  walk(dir);
  return files;
}
mkdirSync(join(root, '.validation'), {recursive: true});
const out = mkdtempSync(join(root, '.validation', 'clean-build-')), source = join(out, 'source');
const result = {node: process.versions.node, platform: process.platform, lockSha256: hash(readFileSync(join(root, 'package-lock.json'))), steps: [], identical: false};
try {
  mkdirSync(source);
  for (const path of ['.node-version', 'package.json', 'package-lock.json', 'tsconfig.json', 'apps', 'packages', 'scripts']) cpSync(join(root, path), join(source, path), {recursive: true});
  for (const [name, args] of [['npm-ci', ['ci', '--no-audit', '--no-fund']], ['build', ['run', 'build']], ['typecheck', ['run', 'typecheck']]]) {
    const log = join(out, `${name}.log`), fd = openSync(log, 'w');
    let step;
    try { step = spawnSync(process.execPath, [npm, ...args], {cwd: source, stdio: ['ignore', fd, fd], shell: false, timeout: 180000}); }
    finally { closeSync(fd); }
    result.steps.push({name, exitCode: step.status, log});
    assert.equal(step.status, 0, `${name} failed; inspect ${log}`);
  }
  const original = manifest(join(root, 'dist')), rebuilt = manifest(join(source, 'dist'));
  writeFileSync(join(out, 'dist-manifest.json'), JSON.stringify(rebuilt, null, 2));
  assert.deepEqual(rebuilt, original, 'Clean output differs from the current prebuilt distribution. Run npm run build first.');
  result.identical = true;
  result.files = Object.keys(rebuilt).length;
  result.distManifestSha256 = hash(JSON.stringify(rebuilt));
} catch (error) { result.error = error.message; process.exitCode = 1; }
finally {
  writeFileSync(join(out, 'summary.json'), JSON.stringify(result, null, 2));
  console.log(`${result.identical ? 'PASS' : 'FAIL'}: ${join(out, 'summary.json')}`);
}
