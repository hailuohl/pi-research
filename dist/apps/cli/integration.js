import { SkillService } from '../../packages/skills/service.js';
import { ResearchApp } from '../../packages/research-app.js';
import { USER } from '../../packages/domain/types.js';
import { ensure } from '../../packages/domain/errors.js';
import { randomUUID } from 'node:crypto';
export async function integrationCli(args, root, dataDir) { const command = args[0]; if (!['skills', 'connectors', 'connector-config', 'discover', 'paper'].includes(command))
    return false; const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }; const print = (x) => console.log(JSON.stringify(x, null, 2)); if (command === 'skills') {
    const skills = new SkillService(root), id = args[1] && !args[1].startsWith('--') ? args[1] : undefined;
    print(id ? skills.read('coordinator', id, option('--resource')) : { bundleId: skills.bundleId, skills: skills.list('coordinator') });
    return true;
} const projectId = option('--project'); ensure(projectId, 'PROJECT_REQUIRED', '使用 --project 指定本地项目 ID', 400); const app = new ResearchApp(dataDir, root); try {
    if (command === 'connectors')
        print(app.connectors.settings(USER, projectId));
    else if (command === 'connector-config') {
        const cfg = app.connectors.settings(USER, projectId), enabled = {};
        for (const id of (option('--enable') ?? '').split(',').filter(Boolean))
            enabled[id] = true;
        for (const id of (option('--disable') ?? '').split(',').filter(Boolean))
            enabled[id] = false;
        print(app.connectors.configure(USER, projectId, { expectedVersion: cfg.version, enabled, ...(option('--request-limit') ? { requestLimit: Number(option('--request-limit')) } : {}) }));
    }
    else if (command === 'discover')
        print(await app.connectors.discover(USER, projectId, { query: option('--query'), sources: (option('--sources') ?? 'crossref').split(','), limit: Number(option('--limit') ?? 8), strategy: option('--strategy') ?? 'keyword', prioritize: option('--prioritize') ?? 'default', publishedAfter: option('--after'), publishedBefore: option('--before') }, option('--key') ?? randomUUID()));
    else
        print(await app.operations.execute(USER, 'paper_read', { id: args[1], ...(option('--source') ? { source: option('--source') } : {}) }, { projectId, idempotencyKey: option('--key') ?? randomUUID() }));
}
finally {
    app.close();
} return true; }
//# sourceMappingURL=integration.js.map