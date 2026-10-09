#!/usr/bin/env node
/** Local CLI uses the same ResearchApp services as HTTP and Pi tools. No Agent fallback. */
import { integrationCli } from './integration.js';
import { projectCli } from './project.js';
import { backupCli } from './backup.js';
import { sshTargetCli } from './ssh.js';
import { campaignDemo } from './campaign-demo.js';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { ResearchApp } from '../../packages/research-app.js';
import { USER } from '../../packages/domain/types.js';
import { inspectPi } from '../../packages/pi-adapter/runtime.js';
import { DomainError, ensure } from '../../packages/domain/errors.js';
const root = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
if (existsSync(join(root, '.env')))
    process.loadEnvFile(join(root, '.env'));
const args = process.argv.slice(2), command = args[0] ?? 'help';
const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const dataDir = resolve(option('--data') ?? process.env.PI_DATA_DIR ?? join(root, '.pi-research'));
const json = args.includes('--json');
function print(value) { console.log(JSON.stringify(value, null, 2)); }
function parseJson(value) {
    try {
        return JSON.parse(value);
    }
    catch {
        throw new DomainError('INVALID_JSON', '请求不是有效 JSON', 400);
    }
}
async function demo() {
    const app = new ResearchApp(dataDir, root);
    try {
        ensure(app.store.list('run').every(r => ['succeeded', 'failed', 'cancelled'].includes(r.state)), 'ACTIVE_RUNS', '已有活动或未知作业；请完成对账后再运行数值示例');
        if (!json)
            console.log('执行随包受信曲线拟合示例：4次固定小型计算，不调用模型、不执行任意导入代码。');
        const project = app.projects.create(USER, { name: '曲线拟合 · 可追溯实验', description: '固定合成数据验证工作流；不是材料性能或论文复现结果。', template: 'curve-fit' });
        const session = app.sessions.create(USER, project.id, { title: '研究主会话' });
        app.sessions.system(session.id, '本项目由 CLI demo 创建。下列实验由固定数值代码真实执行，不是 Pi 生成或执行的科研结论。');
        const execute = async (title, degree, ridge, parentId) => {
            const experiment = app.experiments.create(USER, project.id, { title, hypothesis: `在相同数据与评估条件下，检查${degree}阶模型的误差；不预设实验结论。`, parentId, config: { polynomialDegree: degree, ridge } });
            const intent = app.runs.prepare(USER, experiment.id), approval = app.store.get('approval', intent.approvalId);
            // The explicit demo command authorizes only this bundled, hash-checked computation.
            app.approvals.decide(USER, approval.id, approval.version, true);
            const run = app.runs.submit(USER, intent.id);
            const deadline = Date.now() + 45000;
            let current = run;
            while (!['succeeded', 'failed', 'cancelled', 'unknown'].includes(current.state)) {
                ensure(Date.now() < deadline, 'DEMO_WAIT_TIMEOUT', '等待超时；运行记录已保留，重新打开工作台检查，不自动重复提交');
                app.runs.reconcile();
                app.runs.launchPending();
                await delay(80);
                current = app.runs.get(USER, run.id);
            }
            ensure(current.state === 'succeeded' && current.integrity === 'complete', 'DEMO_RUN_FAILED', `示例未完成：${current.error ?? current.state} / ${current.integrity}`);
            if (!json)
                console.log(`${title}：MSE=${current.metrics.mse}；快照=${current.manifest.snapshotDigest.slice(0, 12)}`);
            return { experiment, run: current };
        };
        const baseline = await execute('基线 · 一阶模型', 1, 0.000001);
        const a = await execute('候选 A · 二阶模型', 2, 0.000001, baseline.experiment.id);
        const b = await execute('候选 B · 三阶模型', 3, 0.000001, baseline.experiment.id);
        const retained = a.run.metrics.mse <= b.run.metrics.mse ? a : b;
        const next = await execute('保留候选的下一轮 · 岭参数变体', retained === a ? 2 : 3, 0.01, retained.experiment.id);
        const runIds = [baseline, a, b, next].map(x => x.run.id);
        const report = app.reports.create(USER, project.id, { title: '固定合成数据实验比较', runIds });
        const result = { version: '0.3.1-experimental', aiUsed: false, projectId: project.id, sessionId: session.id, runIds, retainedParentId: retained.experiment.id, retainedChildId: next.experiment.id, reportId: report.id, reportPath: report.path, dataDir, metrics: [baseline, a, b, next].map(x => ({ title: x.experiment.title, runId: x.run.id, ...x.run.metrics })), limitations: '只验证应用工作流和真实本地运算；未调用 Pi、未执行 DFT、未验证论文结论。' };
        if (json)
            print(result);
        else {
            console.log(`\n报告产物：${report.id}\n数据已保存：${dataDir}\n用相同 PI_DATA_DIR 启动工作台即可查看实验树、快照、日志与报告。`);
        }
    }
    finally {
        app.close();
    }
}
async function main() {
    if (projectCli(args, resolve(process.env.PI_DATA_DIR ?? join(root, '.pi-research'))))
        return;
    if (await backupCli(args, dataDir))
        return;
    if (await sshTargetCli(args, root, dataDir))
        return;
    if (await integrationCli(args, root, dataDir))
        return;
    switch (command) {
        case 'operation': {
            const id = args[1], projectId = option('--project'), input = option('--input'), inputFile = option('--input-file');
            ensure(id && !id.startsWith('--') && projectId && (input !== undefined) !== (inputFile !== undefined), 'INVALID_INPUT', '用法：operation <id> --project <id> [--session <id>] (--input <JSON> | --input-file <JSON文件>) [--key <id>]', 400);
            if (inputFile) {
                const info = statSync(inputFile);
                ensure(info.isFile() && info.size <= 48 * 1024 * 1024, 'BODY_TOO_LARGE', '操作 JSON 文件最多 48 MiB', 413);
            }
            const value = parseJson(input ?? readFileSync(inputFile, 'utf8')), app = new ResearchApp(dataDir, root);
            try {
                print(await app.operations.execute(USER, id, value, { projectId, sessionId: option('--session'), idempotencyKey: option('--key') ?? randomUUID() }));
            }
            finally {
                app.close();
            }
            return;
        }
        case 'doctor': {
            const probe = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { encoding: 'utf8', timeout: 3000 });
            const pi = inspectPi(root, { provider: process.env.PI_PROVIDER ?? '', model: process.env.PI_MODEL ?? '', thinking: 'medium' });
            print({ version: '0.3.1-experimental', node: process.versions.node, platform: process.platform, dataDir, distribution: existsSync(join(root, 'dist/web/index.html')), sqlite: 'Node 内置 node:sqlite；首次打开数据库时初始化', pi, backends: { localTrustedExample: true, dockerReachable: probe.status === 0, dockerLiveVerified: false, remoteRunners: false }, notes: ['核心工作台无需 npm 安装即可启动。', '真实 Pi 要求 Node >=22.19.0、固定 SDK 和有效模型配置。', '本工具仅检查配置和进程可达性，不宣称真实供应商/容器集成已通过。'] });
            return;
        }
        case 'demo-campaign': {
            const app = new ResearchApp(dataDir, root);
            try {
                const result = await campaignDemo(app, message => { if (!json)
                    console.log(message); });
                print(result);
            }
            finally {
                app.close();
            }
            return;
        }
        case 'demo':
            await demo();
            return;
        case 'import': {
            const source = args[1];
            ensure(!!source && !source.startsWith('--'), 'SOURCE_REQUIRED', '用法：import <本地目录> --name <项目名称> [--data <目录>]');
            const app = new ResearchApp(dataDir, root);
            try {
                const input = { name: option('--name') ?? '导入的研究项目', sourcePath: source }, prepared = await app.projects.prepareImport(USER, input);
                const p = app.projects.importDirectory(USER, input, prepared);
                app.sessions.create(USER, p.id, { title: '研究主会话' });
                print({ id: p.id, name: p.name, fileCount: app.projects.listFiles(USER, p.id).length, dataDir, originalUnchanged: true });
            }
            finally {
                app.close();
            }
            return;
        }
        case 'history-enable':
        case 'history-sync':
        case 'history-retry': {
            const projectId = option('--project');
            ensure(projectId, 'PROJECT_REQUIRED', '需要 --project <项目ID>');
            const app = new ResearchApp(dataDir, root);
            try {
                if (command === 'history-enable')
                    print(app.git.enable(USER, projectId));
                else if (command === 'history-retry') {
                    const id = option('--operation');
                    ensure(id, 'OPERATION_REQUIRED', '需要 --operation <操作ID>');
                    print(app.git.retry(USER, projectId, id));
                }
                else {
                    app.projects.get(USER, projectId);
                    await app.git.drain(projectId);
                    print(app.store.list('git-operation', projectId).map(op => app.git.operation(USER, projectId, op.id)));
                }
            }
            finally {
                app.close();
            }
            return;
        }
        case 'request': {
            const method = (args[1] ?? 'GET').toUpperCase(), path = args[2] ?? '/bootstrap';
            ensure(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && path.startsWith('/') && !path.startsWith('//'), 'INVALID_INPUT', '用法：request GET /projects 或 request POST /projects --body <JSON>');
            const port = Number(process.env.PORT ?? 4317);
            ensure(Number.isInteger(port) && port > 0 && port <= 65535, 'INVALID_PORT', 'PORT 无效');
            const body = option('--body');
            if (body)
                parseJson(body);
            const response = await fetch(`http://127.0.0.1:${port}/api${path}`, { method, headers: { 'Content-Type': 'application/json', 'Idempotency-Key': option('--key') ?? randomUUID() }, body: method === 'GET' ? undefined : body ?? '{}', redirect: 'error', signal: AbortSignal.timeout(30000) });
            const result = await response.json();
            print(result);
            if (!response.ok)
                process.exitCode = 1;
            return;
        }
        default: console.log(`Pi Research 0.3.1-experimental\n\n  project purge --project ID --data DIR --offline --confirm-name NAME [--resume]\n  project purge-status --project ID --data DIR\n  backup help                      离线完整备份、校验与原址恢复\n  ssh-target help                 配置、探测和查看本机私有 SSH 目标\n  doctor [--json]                    检查运行环境（不调用模型）\n  demo-campaign [--json]             真实4次运行 + 持久化活动/轮次/决定（不调用模型）\n  demo [--data <目录>] [--json]       真实运行4个随包受信数值实验\n  import <目录> --name <名称>          复制导入本地源码，不修改原目录\n  history-enable --project <id>        显式启用项目本地 Git 历史\n  history-sync --project <id>          处理已排队 Git 操作\n  history-retry --project <id> --operation <id>  恢复已停止的 Git 操作\n  operation <id> --project <id> --input <JSON> [--session <id>] [--key <id>]\n  request GET /projects              访问正在运行的同一控制服务\n  request POST /projects --body '{"name":"研究"}'\n\n  skills [skill-id] [--resource <path>]  只读受管技能\n  connectors --project <id>             查看来源授权与能力\n  connector-config --project <id> --enable openalex,pubmed  显式启用来源\n  discover --project <id> --query <问题> --sources openalex  发出文献查询\n  paper <论文ID> --project <id>          保存论文文本或摘要\n\n启动工作台：node dist/apps/server/index.js\n数据目录：PI_DATA_DIR 或 --data；模型凭据：仅 .env / 受控环境变量。`);
    }
}
main().catch(e => { console.error(JSON.stringify({ error: { code: e.code ?? 'CLI_FAILED', message: e instanceof Error ? e.message : String(e) } })); process.exitCode = 1; });
//# sourceMappingURL=index.js.map