import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {GitCommand, gitEnvironment} from '../../dist/packages/workspace/git-command.js';
import {digest} from '../../dist/packages/storage/store.js';

const command = (args) => {const r = spawnSync('git', args, {shell: false, encoding: 'utf8', windowsHide: true}); assert.equal(r.status, 0, r.stderr); return r.stdout.trim();};
test('managed Git uses verified raw bytes, fixed identities, CAS refs and safe worktrees in Chinese paths', async () => {
 const root = mkdtempSync(join(tmpdir(), 'pi Git 中文 ')), source = join(root, '源 文件'), operation = join(root, '操作 临时');
 const inherited = {GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL, GIT_DIR: process.env.GIT_DIR, GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME};
 try {
  mkdirSync(source); const marker = join(root, 'hook-ran'), hooks = join(root, '恶意 hooks'); mkdirSync(hooks);
  const script = '#!/bin/sh\nprintf bad > "' + marker.replaceAll('\\', '/') + '"\n';
  for (const name of ['post-checkout', 'reference-transaction']) {writeFileSync(join(hooks, name), script); chmodSync(join(hooks, name), 0o755);}
  const config = join(root, '用户 config'); writeFileSync(config, '[core]\n hooksPath = "' + hooks.replaceAll('\\', '/') + '"\n[commit]\n gpgSign = true\n[init]\n defaultBranch = hostile\n');
  process.env.GIT_CONFIG_GLOBAL = config; process.env.GIT_DIR = join(root, '不存在'); process.env.GIT_AUTHOR_NAME = 'hostile author';
  assert.equal(gitEnvironment().GIT_DIR, undefined); assert.equal(gitEnvironment().GIT_AUTHOR_NAME, undefined); assert.notEqual(gitEnvironment().GIT_CONFIG_GLOBAL, config);
  const git = new GitCommand(root, 'project-1'); await git.initialize(); assert.equal(await git.initialize(), git.repoPath);
  // Hostile local config is also harmless: this module never asks Git to apply filters.
  for (const [name, value] of [['core.hooksPath', hooks], ['core.fsmonitor', join(hooks, 'post-checkout')], ['commit.gpgSign', 'true'], ['filter.evil.clean', script], ['filter.evil.smudge', script], ['filter.evil.required', 'true']]) command(['--git-dir', git.repoPath, 'config', name, value]);
  const contents = {'脚本.sh': Buffer.from('#!/bin/sh\nprintf hello\n'), '原始 数据.txt': Buffer.from('one\r\ntwo\r\n'), '.gitattributes': Buffer.from('*.txt filter=evil text eol=lf\n'), '.gitignore': Buffer.from('*.txt\n')};
  const files = Object.entries(contents).map(([path, bytes]) => {writeFileSync(join(source, path), bytes); return {path, size: bytes.length, digest: digest(bytes), mode: path.endsWith('.sh') ? '100755' : '100644'};});
  const snapshot = {path: source, files}, options = {message: '固定快照', date: '2026-09-28T01:02:03.000Z'};
  const commit = await git.commitSnapshot(snapshot, operation, options);
  assert.equal(await git.commitSnapshot(snapshot, operation, options), commit);
  const tree = await git.tree(commit); assert.equal(tree.length, 4); assert.equal(tree.find(e => e.path === '脚本.sh').mode, '100755');
  for (const entry of tree) assert.deepEqual(await git.readBlob(entry.oid), contents[entry.path]);
  await git.updateRef('refs/pi/source/revision-1', commit, null); assert.equal(await git.ref('refs/pi/source/revision-1'), commit);
  assert.equal(await git.ref('refs/heads/missing'), null);
  await assert.rejects(git.updateRef('refs/pi/source/revision-1', commit, null));
  await git.updateRef('refs/heads/session-1', commit, null);
  const worktree = join(root, '中文 工作区');
  assert.equal((await git.addWorktree(worktree, 'refs/heads/session-1', commit)).dirty, false);
  assert.equal((await git.addWorktree(worktree, 'refs/heads/session-1', commit)).head, commit);
  assert.deepEqual(readFileSync(join(worktree, '原始 数据.txt')), contents['原始 数据.txt']);
  command(['--git-dir', git.repoPath, 'config', 'remote.origin.url', 'https://name:secret@example.com/repo.git?token=hidden#private']);
  const imported = await GitCommand.readImport(worktree);
  assert.equal(imported.commit, commit); assert.equal(imported.remote, 'https://example.com/repo.git'); assert.deepEqual(imported.files, tree);
  assert.equal(await GitCommand.readImport(source), null);
  await git.setWorktreeIndex(worktree, commit);
  const next = await git.commitSnapshot(snapshot, operation, {...options, parent: commit, message: 'next commit'});
  await assert.rejects(git.setWorktreeIndex(worktree, next), /HEAD differs/);
  writeFileSync(join(worktree, 'untracked.txt'), 'preserve'); assert.equal((await git.inspectWorktree(worktree)).dirty, true);
  await assert.rejects(git.addWorktree(worktree, 'refs/heads/session-1', commit), /local changes/);
  assert.equal(readFileSync(join(worktree, 'untracked.txt'), 'utf8'), 'preserve');
  assert.equal(existsSync(marker), false);
  await assert.rejects(git.commitSnapshot({...snapshot, files: [{...files[0], mode: '120000'}]}, operation, options), /regular/);
  await assert.rejects(git.commitSnapshot({...snapshot, files: [{...files[0], mode: '160000'}]}, operation, options), /regular/);
  await assert.rejects(git.commitSnapshot({...snapshot, files: [{...files[0], digest: '0'.repeat(64)}]}, operation, options), /digest mismatch/);
  const pointer = Buffer.from('version https://git-lfs.github.com/spec/v1\noid sha256:abc\n'); writeFileSync(join(source, 'pointer'), pointer);
  await assert.rejects(git.commitSnapshot({path: source, files: [{path: 'pointer', size: pointer.length, digest: digest(pointer)}]}, operation, options), /LFS/);
 } finally {for (const [key, value] of Object.entries(inherited)) {if (value === undefined) delete process.env[key]; else process.env[key] = value;} rmSync(root, {recursive: true, force: true});}
});
