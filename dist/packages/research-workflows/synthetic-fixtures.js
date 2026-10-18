import { randomBytes } from 'node:crypto';
import { basename, dirname } from 'node:path';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { object } from '../contracts/validation.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { readStableFile } from '../workspace/stable-file.js';
export const FIXTURE_PROFILE = 'numeric-regression-v1';
export const FIXTURE_INPUT_FORMAT = { format: 'json-object-rows-v1', recordsPointer: '/rows', fields: { rowId: 'rowId', partition: 'partition', predictor: 'x', observed: 'observed' }, partitions: { train: 'train', test: 'test' } };
const origin = (rootSessionId) => `synthetic-fixture:${rootSessionId}`;
export function generateSyntheticFixture(seed) {
    ensure(/^[a-f0-9]{64}$/.test(seed), 'SYNTHETIC_FIXTURE_INVALID', '夹具seed必须来自宿主固定生成器');
    let counter = 0;
    const uniform = () => parseInt(digest(`${FIXTURE_PROFILE}:${seed}:${counter++}`).slice(0, 8), 16) / 0x100000000;
    // A fixed toy profile exercises the pipeline; its coefficients never come from project data.
    const rows = Array.from({ length: 96 }, (_, i) => { const x = Number((4 * uniform() - 2).toFixed(6)), noise = .6 * (uniform() - .5); return { rowId: `fixture-${seed.slice(0, 12)}-${i}`, partition: i < 72 ? 'train' : 'test', x, observed: Number((1 + .6 * x + .3 * x * x + noise).toFixed(6)) }; });
    const splitDigest = digest(rows.map(({ rowId, partition }) => ({ rowId, partition })));
    return { generatorVersion: FIXTURE_PROFILE, profile: FIXTURE_PROFILE, seed, splitDigest, rows };
}
export function parseSyntheticFixtureRef(value) {
    const x = object(value), fields = ['id', 'digest', 'size', 'generatorVersion', 'profile', 'seed', 'splitDigest'];
    ensure(Object.keys(x).length === fields.length && fields.every(k => Object.hasOwn(x, k)) && typeof x.id === 'string' && x.id.length > 0 && x.id.length <= 100 && typeof x.digest === 'string' && /^[a-f0-9]{64}$/.test(x.digest) && Number.isSafeInteger(x.size) && x.size > 0 && x.size <= 2 * 1024 * 1024 && x.generatorVersion === FIXTURE_PROFILE && x.profile === FIXTURE_PROFILE && typeof x.seed === 'string' && /^[a-f0-9]{64}$/.test(x.seed) && typeof x.splitDigest === 'string' && /^[a-f0-9]{64}$/.test(x.splitDigest), 'SYNTHETIC_FIXTURE_INVALID', '固定fixtureRef字段或版本无效', 400);
    return { id: x.id, digest: x.digest, size: x.size, generatorVersion: FIXTURE_PROFILE, profile: FIXTURE_PROFILE, seed: x.seed, splitDigest: x.splitDigest };
}
export function hasSyntheticFixture(store, pid, rootSessionId) { return store.list('artifact', pid).some(a => a.origin === origin(rootSessionId)); }
export function assertSyntheticFixture(store, pid, ref, rootSessionId) {
    const fixed = parseSyntheticFixtureRef(ref), a = store.get('artifact', fixed.id, pid);
    ensure(rootSessionId ? a.origin === origin(rootSessionId) : a.origin.startsWith('synthetic-fixture:'), 'SYNTHETIC_FIXTURE_SCOPE_DENIED', '夹具不属于当前固定主会话');
    const path = store.paths.physical(a.path), bytes = readStableFile(dirname(path), basename(path), 2 * 1024 * 1024), fixture = generateSyntheticFixture(fixed.seed), expected = Buffer.from(JSON.stringify(fixture, null, 2));
    ensure(a.digest === fixed.digest && a.size === fixed.size && bytes.length === fixed.size && digest(bytes) === fixed.digest && bytes.equals(expected) && fixture.splitDigest === fixed.splitDigest, 'SYNTHETIC_FIXTURE_CORRUPTED', '宿主夹具、seed、split或固定字节已改变');
    return { fixtureRef: fixed, bytes, fixture, artifact: a };
}
export function syntheticFixtureBinding(ref, inputArgumentIndex) { return { fixtureRef: ref, inputPath: `/data/${ref.id}`, inputArgumentIndex }; }
export function assertSyntheticManifest(store, pid, rootSessionId, expected, actual, command, data) {
    ensure(digest(actual) === digest(expected) && command[expected.inputArgumentIndex] === expected.inputPath, 'SYNTHETIC_FIXTURE_BINDING_INVALID', '开发数据入口必须是计划固定的宿主fixture路径；本地CSV/其它参数不能替代');
    const context = assertSyntheticFixture(store, pid, expected.fixtureRef, rootSessionId), a = context.artifact;
    ensure(data.length === 1 && data[0].id === a.id && data[0].digest === a.digest && data[0].size === a.size && data[0].path === a.path, 'SYNTHETIC_FIXTURE_DATA_DENIED', 'synthetic-only开发只允许这一个固定fixture输入，不能增加真实数据');
    return context;
}
export class SyntheticFixtureService {
    app;
    constructor(app) {
        this.app = app;
    }
    prepare(actor, pid, rootSessionId, value) {
        this.app.researchBriefs.inspect(actor, pid, rootSessionId);
        const x = object(value);
        ensure(Object.keys(x).every(k => k === 'profile' || k === 'outputProfile') && x.profile === FIXTURE_PROFILE && (x.outputProfile === undefined || x.outputProfile === 'paired-evidence-only-v1'), 'SYNTHETIC_FIXTURE_UNSUPPORTED', '只支持无额外数据/参数的numeric-regression-v1 profile', 400);
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, pid);
            const root = this.app.store.get('session', rootSessionId, pid);
            ensure(root.state !== 'archived' && !root.taskId && !root.teamId && !actor.wakeupId && !actor.continuationId && !actor.approvalResumeId, 'SYNTHETIC_FIXTURE_SCOPE_DENIED', 'fixture准备仅属于交互主会话');
            const prior = this.app.store.list('artifact', pid).filter(a => a.origin === origin(root.id));
            ensure(prior.length <= 1, 'SYNTHETIC_FIXTURE_CORRUPTED', '同一root的固定profile出现多份夹具');
            let artifact = prior[0], fixture;
            if (artifact) {
                const path = this.app.store.paths.physical(artifact.path);
                try {
                    fixture = JSON.parse(readStableFile(dirname(path), basename(path), 2 * 1024 * 1024).toString('utf8'));
                }
                catch {
                    ensure(false, 'SYNTHETIC_FIXTURE_CORRUPTED', '原夹具不可读取，不能重新抽样替换');
                }
            }
            else {
                fixture = generateSyntheticFixture(randomBytes(32).toString('hex'));
                artifact = this.app.evidence.put(pid, 'host-synthetic-fixture.json', Buffer.from(JSON.stringify(fixture, null, 2)), 'application/json', origin(root.id));
                this.app.store.event(pid, 'research.synthetic_fixture_prepared', { sessionId: root.id, artifactId: artifact.id, generatorVersion: FIXTURE_PROFILE });
            }
            const ref = { id: artifact.id, digest: artifact.digest, size: artifact.size, generatorVersion: FIXTURE_PROFILE, profile: FIXTURE_PROFILE, seed: fixture.seed, splitDigest: fixture.splitDigest };
            assertSyntheticFixture(this.app.store, pid, ref, root.id);
            if (x.outputProfile && !this.app.store.db.prepare("SELECT 1 FROM events WHERE project_id=? AND type='research.bearing_profile_selected' AND json_extract(payload,'$.sessionId')=? LIMIT 1").get(pid, root.id))
                this.app.store.event(pid, 'research.bearing_profile_selected', { sessionId: root.id, fixtureId: ref.id, outputProfile: x.outputProfile, selectionKind: 'fixture-workflow' });
            return { fixtureRef: ref, inputPath: `/data/${ref.id}`, ...(x.outputProfile ? { inputFormat: FIXTURE_INPUT_FORMAT } : {}) };
        });
    }
}
//# sourceMappingURL=synthetic-fixtures.js.map