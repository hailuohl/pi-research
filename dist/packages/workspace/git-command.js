import { spawn } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { digest } from '../storage/store.js';
import { readStableFile } from './stable-file.js';
import { safePath, readSourceMode, setSourceModes } from './files.js';
const oid = (value) => { if (!/^[a-f0-9]{40}$/.test(value))
    throw new Error('Invalid Git object ID'); return value; };
const gitPath = (value) => {
    if (!value || /[\x00-\x1f\\:]/.test(value) || value.split('/').some(p => !p || p === '.' || p === '..' || /[. ]$/.test(p) || ['.git', '.gitmodules', 'git~1'].includes(p.toLowerCase())))
        throw new Error('Unsupported Git snapshot path');
    return value;
};
const refName = (value) => {
    if (!/^refs\/(heads|pi\/(source|operations))\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) || value.includes('..') || value.includes('//') || value.includes('@{') || value.split('/').some(p => !p || p.startsWith('.') || p.endsWith('.') || p.endsWith('.lock')))
        throw new Error('Invalid managed Git ref');
    return value;
};
function parseTree(bytes) {
    return bytes.toString('utf8').split('\0').filter(Boolean).map(line => {
        const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(line);
        if (!match)
            throw new Error('Unsupported Git tree entry (symlink, submodule or path)');
        return { mode: match[1], oid: match[2], path: gitPath(match[3]) };
    });
}
export function gitEnvironment() {
    const env = Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
    return { ...env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_CONFIG_SYSTEM: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', GIT_ALLOW_PROTOCOL: '', GIT_NO_LAZY_FETCH: '1', GIT_NO_REPLACE_OBJECTS: '1', LC_ALL: 'C', LANG: 'C' };
}
export class GitCommand {
    repoPath;
    hooksPath;
    constructor(dataDir, projectId) {
        if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(projectId))
            throw new Error('Invalid managed Git project ID');
        this.repoPath = safePath(resolve(dataDir), `projects/${projectId}/git/repository.git`);
        this.hooksPath = join(dirname(this.repoPath), 'disabled-hooks');
    }
    async run(args, options = {}) {
        const flags = ['--no-pager', '--literal-pathspecs', '-c', `core.hooksPath=${this.hooksPath}`, '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', '-c', 'core.autocrlf=false', '-c', 'core.safecrlf=false', '-c', 'core.symlinks=false', '-c', 'core.attributesFile=' + (process.platform === 'win32' ? 'NUL' : '/dev/null'), '-c', 'commit.gpgSign=false', '-c', 'tag.gpgSign=false', '-c', 'diff.external=', '-c', 'diff.trustExitCode=false', '-c', 'gc.auto=0', '-c', 'maintenance.auto=false', '-c', 'core.pager=', '-c', 'filter.lfs.process=', '-c', 'filter.lfs.clean=', '-c', 'filter.lfs.smudge=', '-c', 'filter.lfs.required=false'];
        return new Promise((resolveResult, reject) => {
            const child = spawn('git', [...flags, ...args], { cwd: options.cwd, env: { ...gitEnvironment(), ...options.env }, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
            const out = [], err = [];
            let size = 0, failure;
            const timeout = setTimeout(() => { failure = new Error('Git command timed out'); child.kill(); }, 15000);
            const collect = (chunks) => (chunk) => { size += chunk.length; if (size > 70 * 1024 * 1024) {
                failure = new Error('Git command output limit exceeded');
                child.kill();
            }
            else
                chunks.push(chunk); };
            child.stdout.on('data', collect(out));
            child.stderr.on('data', collect(err));
            child.stdin.on('error', () => { });
            child.on('error', error => { clearTimeout(timeout); reject(error); });
            child.on('close', code => { clearTimeout(timeout); if (failure)
                reject(failure);
            else if (code !== 0 && !options.allowFailure)
                reject(new Error(`Git command failed (${code}): ${Buffer.concat(err).toString('utf8').slice(0, 4096)}`));
            else
                resolveResult({ stdout: Buffer.concat(out), stderr: Buffer.concat(err), code: code ?? -1 }); });
            child.stdin.end(options.input);
        });
    }
    async bare(args, options = {}) { return this.run(['--git-dir', this.repoPath, ...args], options); }
    static async readImport(sourcePath) {
        sourcePath = resolve(sourcePath);
        const git = new GitCommand(sourcePath, 'import-readonly');
        const run = (args, allowFailure = false) => git.run(['-C', sourcePath, ...args], { allowFailure });
        const probe = await run(['rev-parse', '--is-inside-work-tree'], true);
        if (probe.code !== 0) {
            if (/not a git repository/i.test(probe.stderr.toString()))
                return null;
            throw new Error(`Git import discovery failed: ${probe.stderr.toString().slice(0, 4096)}`);
        }
        if (probe.stdout.toString().trim() !== 'true')
            throw new Error('Import requires a Git working directory');
        const commit = oid((await run(['rev-parse', '--verify', 'HEAD'])).stdout.toString().trim());
        const prefix = (await run(['rev-parse', '--show-prefix'])).stdout.toString().trim();
        const files = parseTree((await run(['ls-tree', '-rz', '--full-tree', commit])).stdout).filter(f => f.path.startsWith(prefix)).map(f => ({ ...f, path: f.path.slice(prefix.length) }));
        const configured = await run(['config', '--local', '--no-includes', '--get', 'remote.origin.url'], true);
        if (configured.code !== 0 && configured.code !== 1)
            throw new Error(`Git import remote read failed: ${configured.stderr.toString().slice(0, 4096)}`);
        const raw = configured.stdout.toString().trim();
        let remote;
        if (raw) {
            try {
                const url = new URL(raw);
                url.username = '';
                url.password = '';
                url.search = '';
                url.hash = '';
                remote = url.toString();
            }
            catch {
                remote = raw.replace(/^[^@/]+@(?=[^:/]+:)/, '').split(/[?#]/, 1)[0];
            }
        }
        return { commit, ...(remote ? { remote } : {}), files };
    }
    async initialize() {
        mkdirSync(dirname(this.repoPath), { recursive: true, mode: 0o700 });
        mkdirSync(this.hooksPath, { recursive: true, mode: 0o700 });
        if (!existsSync(this.repoPath))
            await this.run(['init', '--bare', '--object-format=sha1', '--template=', '--initial-branch=main', this.repoPath]);
        if ((await this.bare(['rev-parse', '--is-bare-repository'])).stdout.toString().trim() !== 'true')
            throw new Error('Managed repository is not bare');
        return this.repoPath;
    }
    async commitSnapshot(snapshot, operationDir, options) {
        await this.initialize();
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(options.date) || !Number.isFinite(Date.parse(options.date)))
            throw new Error('Commit date must be an explicit UTC timestamp');
        if (!options.message || Buffer.byteLength(options.message) > 65536 || options.message.includes('\0'))
            throw new Error('Invalid Git commit message');
        if (snapshot.files.length > 5000)
            throw new Error('Too many snapshot files');
        mkdirSync(operationDir, { recursive: true, mode: 0o700 });
        const indexPath = resolve(operationDir, `index-${randomUUID()}`), env = { GIT_INDEX_FILE: indexPath };
        const records = [], seen = new Set();
        let total = 0;
        try {
            for (const file of [...snapshot.files].sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)))) {
                safePath(snapshot.path, file.path);
                gitPath(file.path);
                if (seen.has(file.path.toLowerCase()))
                    throw new Error('Duplicate Git snapshot path');
                seen.add(file.path.toLowerCase());
                if (!Number.isSafeInteger(file.size) || file.size < 0 || (total += file.size) > 64 * 1024 * 1024)
                    throw new Error('Snapshot exceeds byte limit');
                if (file.mode !== undefined && file.mode !== '100644' && file.mode !== '100755')
                    throw new Error('Only regular Git file modes are supported');
                const bytes = readStableFile(snapshot.path, file.path, file.size);
                if (bytes.length !== file.size || digest(bytes) !== file.digest)
                    throw new Error('Snapshot digest mismatch');
                if (bytes.subarray(0, 150).toString().startsWith('version https://git-lfs.github.com/spec'))
                    throw new Error('Unresolved Git LFS pointer is unsupported');
                const blob = oid((await this.bare(['hash-object', '-w', '--stdin'], { input: bytes })).stdout.toString().trim());
                records.push(Buffer.from(`${file.mode ?? '100644'} ${blob}\t${file.path}\0`));
            }
            await this.bare(['read-tree', '--empty'], { env });
            await this.bare(['update-index', '-z', '--index-info'], { env, input: Buffer.concat(records) });
            const tree = oid((await this.bare(['write-tree'], { env })).stdout.toString().trim());
            const author = { GIT_AUTHOR_NAME: 'Pi Research', GIT_AUTHOR_EMAIL: 'pi-research@local.invalid', GIT_COMMITTER_NAME: 'Pi Research', GIT_COMMITTER_EMAIL: 'pi-research@local.invalid', GIT_AUTHOR_DATE: options.date, GIT_COMMITTER_DATE: options.date };
            return oid((await this.bare(['commit-tree', tree, ...(options.parent ? ['-p', oid(options.parent)] : [])], { env: author, input: Buffer.from(options.message + '\n') })).stdout.toString().trim());
        }
        finally {
            if (existsSync(indexPath))
                unlinkSync(indexPath);
        }
    }
    async updateRef(ref, next, previous) { await this.bare(['update-ref', refName(ref), oid(next), previous === null ? '0'.repeat(40) : oid(previous)]); }
    async ref(ref) {
        const result = await this.bare(['show-ref', '--verify', '--quiet', refName(ref)], { allowFailure: true });
        if (result.code === 1)
            return null;
        if (result.code !== 0)
            throw new Error('Cannot read managed Git ref');
        return oid((await this.bare(['rev-parse', '--verify', ref])).stdout.toString().trim());
    }
    async tree(commit) {
        return parseTree((await this.bare(['ls-tree', '-rz', '--full-tree', oid(commit)])).stdout);
    }
    /** Read-only check on a copied bare repository; never follow worktree paths into the live source. */
    async verifyHistory(commits) {
        for (const name of ['objects/info/alternates', 'objects/info/http-alternates', 'commondir'])
            if (existsSync(join(this.repoPath, name)) && readFileSync(join(this.repoPath, name), 'utf8').trim())
                throw Error('Managed Git backup must be self-contained');
        const config = join(this.repoPath, 'config');
        if (existsSync(config) && /^\s*\[\s*include(?:if)?(?:\s|\])/im.test(readFileSync(config, 'utf8')))
            throw Error('Managed Git backup cannot include external configuration');
        await this.bare(['fsck', '--full']);
        const ids = [...new Set(commits.map(oid))];
        if (ids.length) {
            const output = (await this.bare(['cat-file', '--batch-check=%(objectname) %(objecttype)'], { input: Buffer.from(ids.join('\n') + '\n') })).stdout.toString().trim().split(/\r?\n/);
            if (output.length !== ids.length || output.some((line, i) => line !== ids[i] + ' commit'))
                throw Error('Recorded Git commit is missing');
        }
    }
    async readBlob(objectId) { return (await this.bare(['cat-file', 'blob', oid(objectId)])).stdout; }
    async inspectWorktree(path) {
        path = resolve(path);
        if (!existsSync(path) || lstatSync(path).isSymbolicLink())
            throw new Error('Worktree does not exist or is a symlink');
        const run = (args) => this.run(['-C', path, ...args]);
        const common = (await run(['rev-parse', '--path-format=absolute', '--git-common-dir'])).stdout.toString().trim();
        const canonical = (value) => { const path = resolve(realpathSync.native(value)); return process.platform === 'win32' ? path.toLowerCase() : path; };
        if (canonical(common) !== canonical(this.repoPath))
            throw new Error('Worktree belongs to another repository');
        const head = oid((await run(['rev-parse', '--verify', 'HEAD'])).stdout.toString().trim());
        const branch = (await run(['symbolic-ref', '-q', 'HEAD'])).stdout.toString().trim();
        const entries = await this.tree(head), expected = new Map(entries.map(e => [e.path, e]));
        let dirty = (await run(['diff-index', '--cached', '--raw', '-z', '--no-ext-diff', '--no-textconv', 'HEAD', '--'])).stdout.length > 0, count = 0;
        const walk = async (dir) => {
            for (const entry of readdirSync(dir, { withFileTypes: true })) {
                if (++count > 10000)
                    throw new Error('Worktree inspection file limit exceeded');
                if (dir === path && entry.name === '.git')
                    continue;
                const full = join(dir, entry.name), name = relative(path, full).split(sep).join('/'), stat = lstatSync(full);
                if (stat.isSymbolicLink()) {
                    dirty = true;
                    continue;
                }
                if (stat.isDirectory()) {
                    await walk(full);
                    continue;
                }
                const tracked = expected.get(name);
                if (!stat.isFile() || !tracked) {
                    dirty = true;
                    continue;
                }
                expected.delete(name);
                const bytes = readStableFile(path, name, 64 * 1024 * 1024);
                if (!bytes.equals(await this.readBlob(tracked.oid)) || readSourceMode(path, name) !== tracked.mode)
                    dirty = true;
            }
        };
        await walk(path);
        return { head, branch, dirty: dirty || expected.size > 0, repoPath: this.repoPath };
    }
    async setWorktreeIndex(path, commit) {
        oid(commit);
        const current = await this.inspectWorktree(path);
        if (current.head !== commit)
            throw new Error('Worktree HEAD differs from expected commit');
        await this.run(['-C', resolve(path), 'read-tree', commit]);
    }
    async addWorktree(path, branch, commit) {
        path = resolve(path);
        refName(branch);
        oid(commit);
        if (!branch.startsWith('refs/heads/'))
            throw new Error('Worktrees require a managed branch ref');
        if (existsSync(path)) {
            const current = await this.inspectWorktree(path);
            if (current.branch !== branch || current.head !== commit || current.dirty)
                throw new Error('Existing worktree identity differs or contains local changes');
            return current;
        }
        const entries = await this.tree(commit);
        for (const entry of entries)
            safePath(path, entry.path);
        if (await this.ref(branch) !== commit)
            throw new Error('Worktree branch must already reference the expected commit');
        await this.bare(['worktree', 'add', '--no-checkout', path, branch.slice('refs/heads/'.length)]);
        // Raw object bytes plus read-tree avoid every clean/smudge filter and checkout hook.
        for (const entry of entries) {
            const target = safePath(path, entry.path);
            mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
            writeFileSync(target, await this.readBlob(entry.oid), { flag: 'wx', mode: entry.mode === '100755' ? 0o755 : 0o644 });
            chmodSync(target, entry.mode === '100755' ? 0o755 : 0o644);
        }
        setSourceModes(path, entries);
        await this.run(['-C', path, 'read-tree', commit]);
        return this.inspectWorktree(path);
    }
}
//# sourceMappingURL=git-command.js.map