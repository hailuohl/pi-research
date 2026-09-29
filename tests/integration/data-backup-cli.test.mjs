import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ResearchApp } from '../../dist/packages/research-app.js';
import { USER } from '../../dist/packages/domain/types.js';
import { backupCli } from '../../dist/apps/cli/backup.js';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const cli = join(root, 'dist', 'apps', 'cli', 'index.js');

function runCli(args, dataDir) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: root, timeout: 120000, env: { ...process.env, PI_DATA_DIR: dataDir } });
    if (result.error)
        throw result.error;
    return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

test('backupCli 只接管 backup 命令', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pi-backup-cli-'));
    try {
        assert.equal(await backupCli([], dir), false);
        assert.equal(await backupCli(['doctor', '--json'], dir), false);
    }
    finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('backup help 展示用法；未知、缺失、重复参数被拒绝且不写备份', () => {
    const parent = mkdtempSync(join(tmpdir(), 'pi-backup-cli-'));
    const dataDir = join(parent, 'data');
    try {
        const help = runCli(['backup', 'help'], dataDir);
        assert.equal(help.status, 0);
        for (const line of ['backup create', 'backup verify', 'backup restore', '--offline'])
            assert.ok(help.stdout.includes(line), `帮助缺少 ${line}`);

        const invalid = [
            { args: ['backup', 'create', '--out', join(parent, 'prototype'), '--offline', '__proto__'], code: 'BACKUP_USAGE', untouched: join(parent, 'prototype') },
            { args: ['backup', 'create', '--out', '--offline'], code: 'BACKUP_USAGE' },
            { args: ['backup', 'make-it-rain'], code: 'BACKUP_COMMAND' },
            { args: ['backup', 'create', '--data', dataDir, '--out', join(parent, 'no-offline')], code: 'BACKUP_USAGE', untouched: join(parent, 'no-offline') },
            { args: ['backup', 'create', '--out', join(parent, 'unknown-flag'), '--offline', '--compression', '9'], code: 'BACKUP_USAGE', untouched: join(parent, 'unknown-flag') },
            { args: ['backup', 'create', '--out', join(parent, 'dup-out-a'), '--out', join(parent, 'dup-out-b'), '--offline'], code: 'BACKUP_USAGE', untouched: join(parent, 'dup-out-a') },
            { args: ['backup', 'create', '--out', join(parent, 'dup-offline'), '--offline', '--offline'], code: 'BACKUP_USAGE', untouched: join(parent, 'dup-offline') },
            { args: ['backup', 'create', 'stray-text', '--out', join(parent, 'stray'), '--offline'], code: 'BACKUP_USAGE', untouched: join(parent, 'stray') },
            { args: ['backup', 'verify'], code: 'BACKUP_USAGE' },
            { args: ['backup', 'restore', '--from', join(parent, 'restore-no-offline')], code: 'BACKUP_USAGE' }
        ];
        for (const row of invalid) {
            const result = runCli(row.args, dataDir);
            assert.notEqual(result.status, 0, `应失败：${row.args.join(' ')}`);
            assert.equal(JSON.parse(result.stderr).error.code, row.code, row.args.join(' '));
            if (row.untouched)
                assert.equal(existsSync(row.untouched), false, `拒绝后不应创建：${row.untouched}`);
        }
    }
    finally {
        rmSync(parent, { recursive: true, force: true });
    }
});

test('离线创建、校验并按原路径恢复备份，记录保留', async () => {
    const parent = mkdtempSync(join(tmpdir(), 'pi-backup-cli-'));
    const dataDir = join(parent, 'data'), backupDir = join(parent, 'backup');
    let projectId = '';
    try {
        const app = new ResearchApp(dataDir, root);
        try {
            const project = app.projects.create(USER, { name: '备份 CLI 集成测试', description: '临时项目，仅验证备份工作流', template: 'curve-fit' });
            const session = app.sessions.create(USER, project.id, { title: '研究主会话' });
            app.sessions.system(session.id, 'CLI 备份测试写入；不是 Pi 生成的结论。');
            projectId = project.id;
        }
        finally {
            app.close();
        }

        const create = runCli(['backup', 'create', '--data', dataDir, '--out', backupDir, '--offline', '--json'], dataDir);
        assert.equal(create.status, 0, create.stderr);
        const created = JSON.parse(create.stdout);
        assert.ok(created.files >= 1, '备份应至少包含一个文件');
        assert.ok(created.manifestDigest, '备份应返回清单摘要');

        const verify = runCli(['backup', 'verify', '--from', backupDir], dataDir);
        assert.equal(verify.status, 0, verify.stderr);
        assert.equal(JSON.parse(verify.stdout).manifestDigest, created.manifestDigest);

        renameSync(dataDir, join(parent, 'original-aside'));
        assert.equal(existsSync(dataDir), false, '原始目录应已移开');

        const restore = runCli(['backup', 'restore', '--data', dataDir, '--from', backupDir, '--offline', '--json'], dataDir);
        assert.equal(restore.status, 0, restore.stderr);

        const reopened = new ResearchApp(dataDir, root);
        try {
            assert.equal(reopened.projects.get(USER, projectId).name, '备份 CLI 集成测试');
        }
        finally {
            reopened.close();
        }
    }
    finally {
        rmSync(parent, { recursive: true, force: true });
    }
});
