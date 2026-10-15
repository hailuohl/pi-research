import {spawnSync} from 'node:child_process';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pinned = readFileSync(resolve(root, '.node-version'), 'utf8').trim();
if (process.versions.node !== pinned) {
  console.error(`SETUP_NODE_MISMATCH: use Node ${pinned}; found ${process.versions.node}`);
  process.exit(1);
}
// npm run supplies the JS entrypoint, so Windows needs neither cmd.exe nor shell quoting.
const npm = process.env.npm_execpath;
if (!npm || !existsSync(npm)) {
  console.error('SETUP_NPM_REQUIRED: run npm run setup:pi (or npm ci directly).');
  process.exit(1);
}
console.log('Install the pinned Pi SDK and build tools from the committed package-lock.json. Existing .pi-runtime installations remain separately checked.');
const result = spawnSync(process.execPath, [npm, 'ci', '--no-audit', '--no-fund'], {cwd: root, stdio: 'inherit', shell: false});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
