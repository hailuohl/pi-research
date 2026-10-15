import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store, digest } from '../../dist/packages/storage/store.js';
import { setDataLocation } from '../../dist/packages/storage/data-paths.js';
import { ResearchApp } from '../../dist/packages/research-app.js';
import { DEFAULT_COLLABORATION, USER } from '../../dist/packages/domain/types.js';

const DB_NAME = 'state.db';
function createApp(dataDir) {
    return new ResearchApp(dataDir, process.cwd());
}
function createProject(app, dataDir) {
    return app.projects.create(USER, {
        name: 'storage-paths', description: 'artifact storage path wiring regression',
        workspace: join(dataDir, 'workspace'), archived: false, settings: DEFAULT_COLLABORATION,
    }).id;
}
// Artifact bytes are deliberately immutable (0o444); clear that before removing the temp tree.
function clearReadOnly(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const target = join(dir, entry.name);
        if (entry.isDirectory()) clearReadOnly(target);
        else if (entry.isFile()) { try { chmodSync(target, 0o666); } catch { /* best effort */ } }
    }
}
function dispose(parent) { try { clearReadOnly(parent); } catch { /* best effort */ } rmSync(parent, { recursive: true, force: true }); }

test('new artifacts are stored and returned as canonical pi-data:/ references', t => {
    const parent = mkdtempSync(join(tmpdir(), 'evidence-storage-paths-'));
    t.after(() => dispose(parent));
    const dataDir = join(parent, 'A');
    mkdirSync(dataDir, { recursive: true });
    const app = createApp(dataDir);
    const projectId = createProject(app, dataDir);
    const bytes = Buffer.from('first artifact bytes\n', 'utf8');

    const artifact = app.evidence.put(projectId, 'report.txt', bytes, 'text/plain', 'user');
    assert.equal(artifact.digest, digest(bytes));
    assert.equal(artifact.path, `pi-data:/artifacts/${artifact.digest}`);
    assert.ok(existsSync(join(dataDir, 'artifacts', artifact.digest)));

    const stored = JSON.parse(app.store.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get('artifact', artifact.id).data);
    assert.equal(stored.path, `pi-data:/artifacts/${artifact.digest}`);

    const back = app.evidence.read(USER, artifact.id);
    assert.equal(back.bytes.toString('utf8'), 'first artifact bytes\n');
    assert.equal(back.artifact.path, `pi-data:/artifacts/${artifact.digest}`);
    app.close();
});

test('controlled restore maps legacy absolute paths onto the new root without rewriting frozen records', t => {
    const parent = mkdtempSync(join(tmpdir(), 'evidence-storage-paths-'));
    t.after(() => dispose(parent));
    const A = join(parent, 'A'), B = join(parent, 'B'), C = join(parent, 'C');
    mkdirSync(A, { recursive: true });
    const appA = createApp(A);
    const projectId = createProject(appA, A);

    const freshBytes = Buffer.from('written after relocation support\n', 'utf8');
    const fresh = appA.evidence.put(projectId, 'fresh.txt', freshBytes, 'text/plain', 'user');
    assert.match(fresh.path, /^pi-data:/);

    // Fixture: a pre-migration record still carrying its physical A path.
    const legacyBytes = Buffer.from('legacy artifact content\n', 'utf8');
    const legacy = appA.evidence.put(projectId, 'legacy.txt', legacyBytes, 'text/plain', 'user');
    const legacyPhysical = join(A, 'artifacts', legacy.digest);
    const legacyRecord = JSON.parse(appA.store.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get('artifact', legacy.id).data);
    legacyRecord.path = legacyPhysical;
    appA.store.db.prepare('UPDATE records SET data=? WHERE kind=? AND id=?').run(JSON.stringify(legacyRecord), 'artifact', legacy.id);

    const baseline = appA.store.db.prepare('SELECT kind,id,version,data FROM records ORDER BY kind,id').all();
    appA.store.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    appA.close();

    cpSync(A, B, { recursive: true });
    cpSync(A, C, { recursive: true });

    // A directly copied database must refuse to boot against a moved root.
    assert.throws(() => new Store(join(C, DB_NAME)), error => error.code === 'STORAGE_RELOCATION_REQUIRED');

    const raw = new DatabaseSync(join(B, DB_NAME));
    setDataLocation(raw, B, [A]);
    raw.close();
    const appB = createApp(B);

    // A still exists but no longer holds the original bytes: any read falling back to the
    // legacy root would fail the digest check instead of returning stale data.
    for (const a of [fresh, legacy]) {
        const stale = join(A, 'artifacts', a.digest);
        chmodSync(stale, 0o666);
        writeFileSync(stale, Buffer.from('tampered inside the old root\n', 'utf8'));
    }

    const legacyBack = appB.evidence.read(USER, legacy.id);
    assert.equal(legacyBack.bytes.toString('utf8'), legacyBytes.toString('utf8'));
    assert.equal(legacyBack.artifact.path, legacyPhysical); // returned as stored, never rewritten or hydrated
    const freshBack = appB.evidence.read(USER, fresh.id);
    assert.equal(freshBack.bytes.toString('utf8'), freshBytes.toString('utf8'));

    // Reads reject unknown roots and URI traversal; they never fall back to A.
    const outsideId = appB.store.create('artifact', projectId, { title: 'outside', digest: legacy.digest, size: legacyBytes.length, path: join(parent, 'elsewhere', 'x.txt'), mediaType: 'text/plain', origin: 'user' }).id;
    assert.throws(() => appB.evidence.read(USER, outsideId), error => error.code === 'STORAGE_REFERENCE_OUTSIDE');
    const traversalId = appB.store.create('artifact', projectId, { title: 'traversal', digest: legacy.digest, size: legacyBytes.length, path: 'pi-data:/../artifacts/' + legacy.digest, mediaType: 'text/plain', origin: 'user' }).id;
    assert.throws(() => appB.evidence.read(USER, traversalId), error => error.code === 'STORAGE_PATH_INVALID');

    // New writes land only in B and keep using canonical references.
    const bBytes = Buffer.from('created inside B\n', 'utf8');
    const bArtifact = appB.evidence.put(projectId, 'b-side.txt', bBytes, 'text/plain', 'user');
    assert.equal(bArtifact.path, `pi-data:/artifacts/${bArtifact.digest}`);
    assert.ok(existsSync(join(B, 'artifacts', bArtifact.digest)));
    assert.ok(!existsSync(join(A, 'artifacts', bArtifact.digest)));
    assert.equal(appB.evidence.read(USER, bArtifact.id).bytes.toString('utf8'), 'created inside B\n');

    // Frozen records survive the whole flow byte-for-byte.
    const current = new Map(appB.store.db.prepare('SELECT kind,id,version,data FROM records').all().map(r => [`${r.kind} ${r.id}`, r]));
    for (const row of baseline) {
        const now = current.get(`${row.kind} ${row.id}`);
        assert.ok(now, `baseline record ${row.kind}/${row.id} missing after restore`);
        assert.equal(now.data, row.data);
        assert.equal(now.version, row.version);
    }
    appB.close();
});
