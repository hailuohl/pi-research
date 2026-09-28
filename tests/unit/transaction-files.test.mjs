import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '../../dist/packages/storage/store.js';
import {setup, USER} from '../support/research.mjs';

test('nested filesystem callbacks follow the outer transaction and do not leak to later transactions', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pi-rollback-')), store = new Store(join(dir, 'state.db')), events = [];
    try {
        assert.throws(() => store.onRollback(() => {}), {code: 'TRANSACTION_REQUIRED'});
        assert.throws(() => store.transaction(() => {
            store.onRollback(() => {assert.equal(store.db.isTransaction, true); events.push('undo-first');});
            store.afterCommit(() => events.push('should-not-commit'));
            store.transaction(() => {
                store.create('fixture', null, {value: 1});
                store.onRollback(() => events.push('undo-second'));
            });
            throw Error('outer failure');
        }), /outer failure/);
        assert.deepEqual(events, ['undo-second', 'undo-first']);
        assert.equal(store.list('fixture').length, 0);
        store.transaction(() => {
            store.onRollback(() => events.push('should-not-rollback'));
            store.transaction(() => store.afterCommit(() => {assert.equal(store.db.isTransaction, false); events.push('commit');}));
            assert.deepEqual(events, ['undo-second', 'undo-first']);
        });
        assert.deepEqual(events, ['undo-second', 'undo-first', 'commit']);
        store.transaction(() => {});
        assert.equal(events.length, 3);
    } finally {store.close(); rmSync(dir, {recursive: true, force: true});}
});

test('project and private workspace writes restore bytes when the enclosing operation fails', () => {
    const s = setup();
    try {
        const original = s.app.projects.readFile(USER, s.project.id, 'README.md');
        assert.throws(() => s.app.store.transaction(() => {
            s.app.projects.writeFile(USER, s.project.id, 'README.md', 'changed', original.digest);
            s.app.operations.execute(USER, 'workspace_write', {path: 'new.txt', content: 'uncommitted', expectedDigest: null}, {projectId: s.project.id, sessionId: s.session.id, idempotencyKey: 'write'});
            throw Error('outer failure');
        }), /outer failure/);
        assert.equal(s.app.projects.readFile(USER, s.project.id, 'README.md').content, original.content);
        assert.throws(() => s.app.operations.execute(USER, 'workspace_read', {path: 'new.txt'}, {projectId: s.project.id, sessionId: s.session.id}), {code: 'NOT_FOUND'});
        assert.ok(s.app.operations.execute(USER, 'workspace_write', {path: 'new.txt', content: 'retry', expectedDigest: null}, {projectId: s.project.id, sessionId: s.session.id, idempotencyKey: 'write'}).digest);
    } finally {s.close();}
});
