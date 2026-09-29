import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {CAPABILITIES} from '../../dist/packages/contracts/capabilities.js';

const root = resolve(import.meta.dirname, '../..');
const json = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(join(root, path))).digest('hex');

test('baseline matrix preserves the fixed upstream, all capabilities and five independent evidence dimensions', () => {
  const matrix = json('docs/reference-baseline/capability-matrix.json');
  assert.ok(matrix.basis.upstream.endsWith('@3037f727e80e0ab20c61a87c613a50dde009a835'));
  assert.deepEqual(matrix.capabilities.map(c => c.id).sort(), CAPABILITIES.map(c => c.id).sort());
  for (const capability of matrix.capabilities) {
    assert.ok(['exact', 'equivalent', 'intentional-deviation'].includes(capability.alignment));
    assert.deepEqual(Object.keys(capability.dimensions).sort(), ['code', 'config', 'contractTests', 'targetIntegration', 'userJourney'].sort());
    for (const file of [...capability.files, ...capability.interfaces, ...capability.tests, ...Object.values(capability.dimensions).flatMap(d => d.evidence)]) {
      assert.ok(existsSync(join(root, file)), `${capability.id}: missing evidence ${file}`);
    }
  }
  assert.equal(json('docs/reference-baseline/baseline.json').baselineScreenshotsCaptured, false);
});

test('runtime, compiler and bundled browser assets are pinned', () => {
  const pkg = json('package.json'), lock = json('package-lock.json');
  assert.equal(readFileSync(join(root, '.node-version'), 'utf8').trim(), '24.19.0');
  for (const [name, version] of Object.entries({...pkg.devDependencies,...pkg.dependencies})) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
    assert.equal(lock.packages[`node_modules/${name}`].version, version);
    assert.ok(lock.packages[`node_modules/${name}`].integrity);
  }
  for (const [name, version] of Object.entries(pkg.overrides)) {
    const copies = Object.entries(lock.packages).filter(([path]) => path.endsWith(`node_modules/${name}`));
    assert.ok(copies.length, `${name} must be in the lock`);
    for (const [, dependency] of copies) assert.equal(dependency.version, version, name);
  }
  for (const asset of json('docs/reference-baseline/assets.json').files) assert.equal(sha(asset.path), asset.sha256, asset.path);
});

test('build fails explicitly without local dependencies even when a global compiler is available', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pi-build-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    for (const file of ['scripts/build.mjs', '.node-version', 'package.json']) cpSync(join(root, file), join(dir, file));
    const result = spawnSync(process.execPath, [join(dir, 'scripts/build.mjs')], {cwd: dir, encoding: 'utf8', timeout: 10000});
    assert.equal(result.status, 1);
    assert.match(result.stderr, /BUILD_DEPENDENCIES_MISSING/);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

test('prebuilt CLI and authenticated HTTP core start in a directory without node_modules', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pi-prebuilt-'));
  try {
    for (const file of ['dist', 'skills', 'examples', 'package.json']) cpSync(join(root, file), join(dir, file), {recursive: true});
    assert.equal(existsSync(join(dir, 'node_modules')), false);
    const env = {...process.env, NODE_NO_WARNINGS: '1', PI_DATA_DIR: join(dir, 'data')};
    delete env.NODE_PATH;
    const doctor = spawnSync(process.execPath, ['dist/apps/cli/index.js', 'doctor', '--json'], {cwd: dir, env, encoding: 'utf8', timeout: 15000});
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.equal(JSON.parse(doctor.stdout).pi.code, 'PI_NOT_INSTALLED');
    const smoke = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import {createHttpServer} from './dist/apps/server/http.js';
      const service = createHttpServer({repoRoot:process.cwd(),dataDir:process.env.PI_DATA_DIR,port:0});
      try {
        const port = await service.listen(), base = 'http://127.0.0.1:' + port;
        assert.equal((await fetch(base + '/api/health')).status, 200);
        assert.equal((await fetch(base + '/api/bootstrap')).status, 401);
        assert.equal((await fetch(base + '/api/bootstrap', {headers:{Authorization:'Bearer ' + service.token}})).status, 200);
        assert.match(await (await fetch(base + '/')).text(), /<html/);
      } finally { await service.close(); }
    `], {cwd: dir, env, encoding: 'utf8', timeout: 15000});
    assert.equal(smoke.status, 0, smoke.stderr);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
