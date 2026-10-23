import { ensure } from '../domain/errors.js';
import { object, text, oneOf, strings, bool, integer } from '../contracts/validation.js';
export function validateGraph(value, maxTasks = 24) {
    ensure(Array.isArray(value) && value.length > 0 && value.length <= maxTasks, 'INVALID_TASK_GRAPH', `任务图需要 1–${maxTasks} 个任务`, 400);
    const tasks = value.map(raw => {
        const x = object(raw);
        const task = { key: text(x.key, 'key', 60), role: oneOf(x.role, ['literature', 'designer', 'implementer', 'analyst', 'reviewer', 'writer'], 'role'), objective: text(x.objective, 'objective'), dependencies: strings(x.dependencies ?? [], 'dependencies', maxTasks), critical: x.critical === undefined ? false : bool(x.critical, 'critical'), required: x.required === undefined ? true : bool(x.required, 'required'), inputEvidenceIds: strings(x.inputEvidenceIds ?? [], 'inputEvidenceIds') };
        if (x.skillIds !== undefined)
            task.skillIds = strings(x.skillIds, 'skillIds', 32);
        if (x.thinking !== undefined)
            task.thinking = text(x.thinking, 'thinking', 64);
        if (x.thinkingReason !== undefined) {
            ensure(x.thinking !== undefined, 'INVALID_INPUT', '选择理由需要明确档位', 400);
            task.thinkingReason = text(x.thinkingReason, 'thinkingReason', 1000);
        }
        ensure(/^[a-zA-Z0-9_-]+$/.test(task.key), 'INVALID_INPUT', '任务 key 只能含字母、数字、下划线和连字符', 400);
        if (x.reviewOf !== undefined)
            task.reviewOf = text(x.reviewOf, 'reviewOf', 60);
        if (x.expectedOutputs !== undefined) {
            ensure(Array.isArray(x.expectedOutputs) && x.expectedOutputs.length <= 24, 'INVALID_INPUT', 'expectedOutputs 需要不超过24项的数组', 400);
            task.expectedOutputs = x.expectedOutputs.map(raw => {
                const o = object(raw);
                const schemaId = oneOf(o.schemaId, ['report', 'text', 'csv', 'json', 'patch', 'code', 'review'], 'schemaId');
                const output = {
                    kind: oneOf(o.kind, ['report', 'dataset', 'patch', 'analysis', 'review', 'code', 'text'], 'kind'),
                    schemaId, required: bool(o.required ?? true, 'required'), minBytes: integer(o.minBytes ?? 1, 'minBytes', 1, 32 * 1024 * 1024),
                    ...(o.title === undefined ? {} : { title: text(o.title, 'title', 200) }),
                    ...(o.mediaType === undefined ? {} : { mediaType: text(o.mediaType, 'mediaType', 100) })
                };
                return output;
            });
        }
        task.acceptanceRuleIds = strings(x.acceptanceRuleIds ?? [], 'acceptanceRuleIds', 10);
        ensure(task.acceptanceRuleIds.every(r => ['artifact-required', 'evidence-required', 'claims-evidenced'].includes(r)), 'ACCEPTANCE_RULE_UNSUPPORTED', '存在未实现的验收规则；不能忽略后继续运行', 400);
        ensure(task.role !== 'reviewer' || !task.expectedOutputs?.some(o => o.required) && !task.acceptanceRuleIds.includes('artifact-required'), 'REVIEW_OUTPUT_UNSUPPORTED', `审查任务 ${task.key} 没有创建文件产物的权限，不能要求必需 expectedOutputs 或 artifact-required；使用 expectedOutputs=[]，通过 task_result_submit 的 summary 保存完整审查意见并提交 verdict`, 400);
        return task;
    });
    const byKey = new Map(tasks.map(t => [t.key, t]));
    ensure(byKey.size === tasks.length, 'TASK_KEY_DUPLICATE', '任务 key 重复', 400);
    for (const t of tasks) {
        for (const dep of [...t.dependencies, ...(t.reviewOf ? [t.reviewOf] : [])])
            ensure(byKey.has(dep), 'TASK_DEPENDENCY_UNKNOWN', `缺少依赖 ${dep}`, 400);
        if (t.reviewOf) {
            ensure(t.role === 'reviewer' && t.reviewOf !== t.key, 'REVIEW_INVALID', '审查任务必须是独立 Reviewer', 400);
            ensure(!t.dependencies.includes(t.reviewOf), 'REVIEW_DEADLOCK', '审查通过 reviewOf 读取待验收成果，不能等待被审查结果已验收', 400);
        }
        if (t.critical)
            ensure(tasks.some(r => r.role === 'reviewer' && r.reviewOf === t.key), 'REVIEW_REQUIRED', `关键任务 ${t.key} 需要独立审查`, 400);
    }
    const visiting = new Set(), visited = new Set();
    const visit = (key) => {
        ensure(!visiting.has(key), 'TASK_GRAPH_CYCLE', '任务依赖包含循环', 400);
        if (visited.has(key))
            return;
        visiting.add(key);
        const t = byKey.get(key);
        [...t.dependencies, ...(t.reviewOf ? [t.reviewOf] : [])].forEach(visit);
        visiting.delete(key);
        visited.add(key);
    };
    tasks.forEach(t => visit(t.key));
    // Model submission and acceptance as different events. A reviewer consumes
    // submitted output; ordinary dependencies consume accepted output.
    const eventVisiting = new Set(), eventVisited = new Set();
    const visitEvent = (event) => {
        ensure(!eventVisiting.has(event), 'REVIEW_DEADLOCK', '提交/审查/验收依赖形成等待环', 400);
        if (eventVisited.has(event))
            return;
        eventVisiting.add(event);
        const [stage, key] = event.split(':');
        const task = byKey.get(key);
        const parents = stage === 'accepted'
            ? [`submitted:${key}`, ...tasks.filter(r => r.reviewOf === key).map(r => `accepted:${r.key}`)]
            : [...task.dependencies.map(d => `accepted:${d}`), ...(task.reviewOf ? [`submitted:${task.reviewOf}`] : [])];
        parents.forEach(visitEvent);
        eventVisiting.delete(event);
        eventVisited.add(event);
    };
    tasks.forEach(t => visitEvent(`accepted:${t.key}`));
    return tasks;
}
//# sourceMappingURL=graph.js.map