import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
test('approved research skill service is compiled and packaged',()=>assert.ok(existsSync(resolve('dist/packages/skills/service.js')),'Missing trusted skill service'));
test('literature connector service is compiled and packaged',()=>assert.ok(existsSync(resolve('dist/packages/connectors/service.js')),'Missing independent connector service'));
