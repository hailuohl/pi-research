import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {BUILTIN_RELEASES} from '../../dist/packages/skills/releases.js';

const root=resolve('.');
test('generated release index embeds no archived bundles or historical prose',()=>{
 assert.equal(BUILTIN_RELEASES.length,0);
 const generated=readFileSync(join(root,'packages/skills/releases.ts'),'utf8');
 assert.match(generated,/const index = \[\] as const;/);
 assert.doesNotMatch(generated,/alphaXiv|openresearch|科研工作台/i);
 assert.equal(JSON.parse(readFileSync(join(root,'skills/releases/index.json'),'utf8')).length,0);
});
