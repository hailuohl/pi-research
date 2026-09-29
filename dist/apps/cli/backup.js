/** Offline, original-path local data backup commands. Retention and recovery policy live in packages/storage/backup. */
import { DomainError, ensure } from '../../packages/domain/errors.js';
import { createDataBackup, restoreDataBackup, verifyDataBackup } from '../../packages/storage/backup.js';
function print(value) { console.log(JSON.stringify(value, null, 2)); }
function help() {
    console.log(`Pi Research backup · 本地私有数据备份

  backup create --data <数据目录> --out <备份目录> --offline [--json]
                                  离线完整备份：数据库、审批、快照、原生 Pi 数据与 Git 历史
  backup verify --from <备份目录> [--json]
                                  校验现有备份的完整性；不读取、不修改数据目录
  backup restore --data <目标目录> --from <备份目录> --offline [--relocate] [--json]
                                  原址恢复；异址迁移须加 --relocate，目标已存在时拒绝

执行前请停止控制器及其他CLI，然后显式提供 --offline。备份保存在本机，不上传数据、不调用模型。
这是包含私有研究历史的本地备份，不能当作公开成果包。数据目录由 --data 指定；省略时使用
PI_DATA_DIR 或默认目录。异址迁移后仅使用新副本，原副本保持离线；目标必须不存在。`);
}
/** Strict flag parsing: only known flags, one value each; positional text, duplicates and unknown flags are rejected. */
function parseFlags(tokens, flags, required, usage) {
    const values = {}, seen = new Set();
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i], kind = Object.hasOwn(flags, token) ? flags[token] : undefined;
        ensure(kind, 'BACKUP_USAGE', `${usage}；未知或多余参数：<${token}>`, 400);
        ensure(!seen.has(token), 'BACKUP_USAGE', `${usage}；参数重复：<${token}>`, 400);
        seen.add(token);
        if (kind === 'value') {
            const value = tokens[++i];
            ensure(value !== undefined && value !== '' && !value.startsWith('--'), 'BACKUP_USAGE', `${usage}；<${token}> 需要一个值`, 400);
            values[token] = value;
        }
        else
            values[token] = 'true';
    }
    for (const flag of required)
        ensure(seen.has(flag), 'BACKUP_USAGE', `${usage}；缺少必需参数：<${flag}>`, 400);
    return values;
}
export async function backupCli(args, dataDir) {
    if (args[0] !== 'backup')
        return false;
    const rest = args.slice(2);
    switch (args[1] ?? 'help') {
        case 'help':
            ensure(rest.length === 0, 'BACKUP_USAGE', '用法：backup help', 400);
            help();
            return true;
        case 'create': {
            const usage = '用法：backup create --data <数据目录> --out <备份目录> --offline [--json]';
            const values = parseFlags(rest, { '--data': 'value', '--out': 'value', '--offline': 'bool', '--json': 'bool' }, ['--out', '--offline'], usage);
            // dataDir is resolved by the main CLI; subcommand --data is accepted syntax only and never read here.
            print(await createDataBackup(dataDir, values['--out'], { offline: true }));
            return true;
        }
        case 'verify': {
            const usage = '用法：backup verify --from <备份目录> [--json]';
            const values = parseFlags(rest, { '--from': 'value', '--json': 'bool' }, ['--from'], usage);
            print(await verifyDataBackup(values['--from']));
            return true;
        }
        case 'restore': {
            const usage = '用法：backup restore --data <目标目录> --from <备份目录> --offline [--relocate] [--json]';
            const values = parseFlags(rest, { '--data': 'value', '--from': 'value', '--offline': 'bool', '--relocate': 'bool', '--json': 'bool' }, ['--from', '--offline'], usage);
            print(await restoreDataBackup(values['--from'], dataDir, { offline: true, relocate: values['--relocate'] === 'true' }));
            return true;
        }
        default:
            throw new DomainError('BACKUP_COMMAND', `未知的 backup 子命令：<${args[1]}>；可用：create、verify、restore、help`, 400);
    }
}
//# sourceMappingURL=backup.js.map