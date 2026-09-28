import { api } from './api.js';
import { short, label } from './models.js';
import { SectionTitle, Badge } from './ui.js';
export const computeReasonLabels = { ready: '容量检查通过，等待调度', worker_active: '执行器仍持有有效租约', recovery_due: '待核对原作业并恢复监管', target_unresolved: '计算目标尚未解析', target_unavailable: '计算目标暂不可用', target_changed: '目标身份已变化，需要核对', legacy_target_unknown: '旧作业目标未知，保留占用', request_too_large: '请求超过配置总容量，等待不会自动解决', host_capacity: '等待共享宿主容量', target_capacity: '等待此计算目标容量', earlier_job: '等待更早的作业', recovery_backoff: '恢复暂缓，等待下次核对', manual_recovery_required: '旧宿主作业需要人工核对，保留占用' };
const call = (projectId, name, input = {}) => api(`/operations/${name}`, { projectId, input });
const limitsFields = [{ key: 'maxRuns', label: '正式 Run 上限' }, { key: 'maxDevelopment', label: '开发测试上限' }, { key: 'maxJobs', label: '计算作业总上限' }, { key: 'cpus', label: 'CPU 预算（核）', nullable: true }, { key: 'memoryMb', label: '内存预算（MiB）', nullable: true }, { key: 'maxQueued', label: '排队数量上限', nullable: true }];
const values = (limits) => Object.fromEntries(limitsFields.map(f => [f.key, limits[f.key] === null ? '' : String(limits[f.key])]));
export function ComputeWait({ data, kind, id, onScheduler }) {
    const item = data.compute?.items.find(i => i.kind === kind && i.id === id);
    return React.createElement("div", { className: "small muted" },
        React.createElement("p", null, item ? computeReasonLabels[item.reason] : data.compute ? '此作业不在当前队列页中；请到资源与调度查看。' : '调度信息待加载。'),
        item ? React.createElement("p", null,
            "\u9700\u6C42 ",
            item.requested.cpus,
            " CPU / ",
            item.requested.memoryMb,
            " MiB \u00B7 ",
            item.held ? '容量保留中' : '尚未预留容量',
            item.state === 'unknown' ? '；未知状态不会自动释放容量' : '') : null,
        onScheduler ? React.createElement("button", { className: "text-button", onClick: onScheduler }, "\u67E5\u770B\u8D44\u6E90\u4E0E\u8C03\u5EA6") : null);
}
function Usage({ limits, usage, available }) {
    const remainder = (limit, used, remaining, unit) => limit === null ? `未设预算；已预留 ${used} ${unit}` : `${used} / ${limit} ${unit}；可用 ${remaining ?? '未设预算'}`;
    return React.createElement("dl", { className: "details" },
        React.createElement("dt", null, "\u8BA1\u7B97\u4F5C\u4E1A"),
        React.createElement("dd", null, remainder(limits.maxJobs, usage.jobs, available.jobs, '个')),
        React.createElement("dt", null, "\u6B63\u5F0F Run"),
        React.createElement("dd", null,
            usage.runs,
            " / ",
            limits.maxRuns,
            "\uFF1B\u53EF\u7528 ",
            available.runs),
        React.createElement("dt", null, "\u5F00\u53D1\u6D4B\u8BD5"),
        React.createElement("dd", null,
            usage.development,
            " / ",
            limits.maxDevelopment,
            "\uFF1B\u53EF\u7528 ",
            available.development),
        React.createElement("dt", null, "\u6587\u6863\u89E3\u6790"),
        React.createElement("dd", null,
            usage.documents,
            " / 1\uFF1B\u53EF\u7528 ",
            available.documents,
            "\uFF08\u53E6\u53D7\u5171\u4EAB\u603B\u9884\u7B97\u7EA6\u675F\uFF09"),
        React.createElement("dt", null, "\u6587\u7A3F\u6784\u5EFA"),
        React.createElement("dd", null,
            usage.publications ?? '未返回',
            " / 1\uFF1B\u53EF\u7528 ",
            available.publications ?? '未返回',
            "\uFF08\u53E6\u53D7\u5171\u4EAB\u603B\u9884\u7B97\u7EA6\u675F\uFF09"),
        React.createElement("dt", null, "CPU \u9884\u7B97"),
        React.createElement("dd", null, remainder(limits.cpus, usage.cpus, available.cpus, '核')),
        React.createElement("dt", null, "\u5185\u5B58\u9884\u7B97"),
        React.createElement("dd", null, remainder(limits.memoryMb, usage.memoryMb, available.memoryMb, 'MiB')),
        React.createElement("dt", null, "\u672A\u77E5\u5360\u7528"),
        React.createElement("dd", null,
            usage.unknown,
            " \u4E2A\uFF08\u5DF2\u5305\u542B\u5728\u4E0A\u8FF0\u4F5C\u4E1A\u5360\u7528\u4E2D\uFF0C\u4E0D\u91CD\u590D\u6263\u51CF\uFF09"));
}
class ComputeForm extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { fields: values(this.props.configuration.limits), version: this.props.configuration.version, dirty: false, error: '', busy: false };
    }
    componentDidUpdate(prev) { if (prev.configuration.version !== this.props.configuration.version && !this.state.dirty)
        this.reset(); }
    reset() { this.setState({ fields: values(this.props.configuration.limits), version: this.props.configuration.version, dirty: false, error: '' }); }
    async save() { if (this.state.busy)
        return; this.setState({ busy: true, error: '' }); try {
        await this.props.perform(async () => { try {
            const limits = Object.fromEntries(limitsFields.map(f => [f.key, this.state.fields[f.key] === '' && f.nullable ? null : Number(this.state.fields[f.key])]));
            const saved = await call(this.props.projectId, 'compute_capacity_configure', { expectedVersion: this.state.version, ...(this.props.targetId ? { targetId: this.props.targetId } : {}), limits });
            this.setState({ fields: values(saved.limits), version: saved.version, dirty: false });
            await this.props.onSaved();
        }
        catch (error) {
            this.setState({ error: error instanceof Error ? error.message : String(error) });
            throw error;
        } }, '共享计算容量已保存；既有批准资源不变');
    }
    finally {
        this.setState({ busy: false });
    } }
    render() { return React.createElement("form", { className: "form-body", onSubmit: (e) => { e.preventDefault(); void this.save(); } },
        React.createElement("p", { className: "small muted" }, "CPU\u3001\u5185\u5B58\u53CA\u6392\u961F\u4E0A\u9650\u7559\u7A7A\u8868\u793A\u672A\u8BBE\u9884\u7B97\uFF0C\u4E0D\u8868\u793A\u786C\u4EF6\u7A7A\u95F2\u3002\u914D\u7F6E\u4F5C\u7528\u4E8E\u5171\u4EAB\u6B64\u6570\u636E\u76EE\u5F55\u7684\u6240\u6709\u9879\u76EE\u3002"),
        limitsFields.map(f => React.createElement("label", { key: f.key },
            f.label,
            React.createElement("input", { "aria-label": f.label, disabled: this.state.busy, type: "number", min: 0, max: f.key === 'cpus' ? 1024 : !f.nullable ? 256 : undefined, step: f.key === 'cpus' ? 0.001 : 1, required: !f.nullable, placeholder: f.nullable ? '未设预算' : undefined, value: this.state.fields[f.key], onChange: (e) => this.setState({ fields: { ...this.state.fields, [f.key]: e.target.value }, dirty: true }) }))),
        this.state.version !== this.props.configuration.version ? React.createElement("p", { role: "alert", className: "inline-warning" }, "\u914D\u7F6E\u5DF2\u88AB\u5176\u4ED6\u64CD\u4F5C\u66F4\u65B0\uFF1B\u5F53\u524D\u8349\u7A3F\u4FDD\u7559\uFF0C\u4FDD\u5B58\u65F6\u670D\u52A1\u7AEF\u4F1A\u68C0\u67E5\u7248\u672C\u3002") : null,
        this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
        React.createElement("div", { className: "actions wrap" },
            React.createElement("button", { className: "primary", disabled: this.state.busy || !this.state.dirty }, "\u663E\u5F0F\u4FDD\u5B58\u8BA1\u7B97\u5BB9\u91CF"),
            React.createElement("button", { type: "button", className: "secondary", disabled: this.state.busy, onClick: () => this.reset() }, "\u8BFB\u53D6\u6700\u65B0\u914D\u7F6E\uFF08\u653E\u5F03\u8349\u7A3F\uFF09"))); }
}
class AgentForm extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { value: String(this.props.capacity.maxWorkers), version: this.props.capacity.version, dirty: false, error: '', busy: false };
    }
    componentDidUpdate(prev) { if (prev.capacity.version !== this.props.capacity.version && !this.state.dirty)
        this.reset(); }
    reset() { this.setState({ value: String(this.props.capacity.maxWorkers), version: this.props.capacity.version, dirty: false, error: '' }); }
    render() { return React.createElement("form", { onSubmit: (e) => { e.preventDefault(); if (this.state.busy)
            return; this.setState({ busy: true, error: '' }); void this.props.perform(async () => { try {
            const saved = await call(this.props.projectId, 'agent_capacity_configure', { expectedVersion: this.state.version, maxWorkers: Number(this.state.value) });
            this.setState({ version: saved.version, value: String(saved.maxWorkers), dirty: false });
            await this.props.onSaved();
        }
        catch (error) {
            this.setState({ error: error instanceof Error ? error.message : String(error) });
            throw error;
        } }).finally(() => this.setState({ busy: false })); } },
        React.createElement("label", null,
            "\u5BBF\u4E3B Pi Worker \u4E0A\u9650",
            React.createElement("input", { "aria-label": "\u5BBF\u4E3B Pi Worker \u4E0A\u9650", disabled: this.state.busy, type: "number", min: 1, max: 32, required: true, value: this.state.value, onChange: (e) => this.setState({ value: e.target.value, dirty: true }) })),
        this.state.version !== this.props.capacity.version ? React.createElement("p", { className: "inline-warning" }, "\u670D\u52A1\u7AEF\u914D\u7F6E\u5DF2\u66F4\u65B0\uFF1B\u8349\u7A3F\u4FDD\u7559\uFF0C\u8BF7\u6838\u5BF9\u7248\u672C\u3002") : null,
        this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
        React.createElement("div", { className: "actions wrap" },
            React.createElement("button", { className: "primary", disabled: this.state.busy || !this.state.dirty }, "\u663E\u5F0F\u4FDD\u5B58 Worker \u5BB9\u91CF"),
            React.createElement("button", { type: "button", className: "secondary", disabled: this.state.busy, onClick: () => this.reset() }, "\u8BFB\u53D6\u6700\u65B0\u914D\u7F6E\uFF08\u653E\u5F03\u8349\u7A3F\uFF09"))); }
}
class TargetProbe extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { context: 'desktop-linux', busy: false, error: '', result: null };
        this.mounted = true;
    }
    componentWillUnmount() { this.mounted = false; }
    async probe() { if (this.state.busy)
        return; this.setState({ busy: true, error: '', result: null }); try {
        await this.props.perform(async () => { try {
            const result = await call(this.props.projectId, 'compute_target_probe', { context: this.state.context.trim() });
            if (this.mounted)
                this.setState({ result });
            await this.props.onConfirmed();
        }
        catch (error) {
            if (this.mounted)
                this.setState({ error: error instanceof Error ? error.message : String(error) });
            throw error;
        } });
    }
    finally {
        if (this.mounted)
            this.setState({ busy: false });
    } }
    render() { return React.createElement("section", { className: "surface report-builder" },
        React.createElement("h2", null, "\u6838\u5BF9 Docker \u76EE\u6807"),
        React.createElement("p", { className: "small muted" }, "\u9996\u6B21\u4F7F\u7528\u6216 Context \u5DF2\u66F4\u6362\u5F15\u64CE\u65F6\uFF0C\u5148\u6838\u5BF9\u672C\u673A\u76EE\u6807\u8EAB\u4EFD\u3002\u6B64\u64CD\u4F5C\u4E0D\u542F\u52A8\u5BB9\u5668\u3001\u4E0D\u4FEE\u6539\u9650\u989D\u3001\u4E0D\u91CD\u65B0\u63D0\u4EA4\u4F5C\u4E1A\uFF0C\u4E5F\u4E0D\u91CD\u65B0\u7ED1\u5B9A\u5DF2\u6709\u4F5C\u4E1A\u3002"),
        React.createElement("form", { onSubmit: (e) => { e.preventDefault(); void this.probe(); } },
            React.createElement("label", null,
                "\u672C\u673A Docker context",
                React.createElement("input", { "aria-label": "\u6838\u5BF9\u76EE\u6807\u7684 Docker context", required: true, maxLength: 100, pattern: "[A-Za-z0-9][A-Za-z0-9_.-]*", disabled: this.state.busy, value: this.state.context, onChange: (e) => this.setState({ context: e.target.value, result: null, error: '' }) })),
            React.createElement("button", { className: "secondary", disabled: this.state.busy || !this.state.context.trim() }, this.state.busy ? '正在核对…' : '核对 Docker 目标')),
        this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
        this.state.result ? React.createElement("div", { role: "status" },
            React.createElement("p", null,
                "\u76EE\u6807\u8EAB\u4EFD\u5DF2\u786E\u8BA4\uFF1A",
                this.state.result.context),
            React.createElement("code", { className: "digest" }, this.state.result.targetId),
            React.createElement("p", { className: "small muted" },
                "\u6838\u5BF9\u65F6\u95F4 ",
                this.state.result.observedAt,
                "\uFF1B\u8BF7\u6839\u636E\u6700\u65B0\u5BB9\u91CF\u72B6\u6001\u51B3\u5B9A\u540E\u7EED\u64CD\u4F5C\u3002")) : null); }
}
export class SchedulerView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { compute: null, agents: null, cursor: 0, loading: false, error: '' };
        this.epoch = 0;
    }
    componentDidMount() { void this.refresh(); }
    componentWillUnmount() { this.epoch++; }
    componentDidUpdate(prev) { if (prev.data !== this.props.data && this.state.cursor === 0)
        this.setState({ compute: this.props.data.compute ?? this.state.compute, agents: this.props.data.agentCapacity ?? this.state.agents }); }
    async refresh(cursor = this.state.cursor) { const epoch = ++this.epoch; this.setState({ loading: true, error: '' }); try {
        const [compute, agents] = await Promise.all([call(this.props.data.project.id, 'compute_queue_inspect', { cursor, limit: 50 }), call(this.props.data.project.id, 'agent_capacity_inspect')]);
        if (epoch === this.epoch)
            this.setState({ compute, agents, cursor });
    }
    catch (error) {
        if (epoch === this.epoch)
            this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
    finally {
        if (epoch === this.epoch)
            this.setState({ loading: false });
    } }
    render() {
        const c = this.state.compute ?? this.props.data.compute, a = this.state.agents ?? this.props.data.agentCapacity;
        return React.createElement("div", { className: "page-scroll" },
            React.createElement(SectionTitle, { title: "\u8D44\u6E90\u4E0E\u8C03\u5EA6", sub: "\u5171\u4EAB\u5BB9\u91CF\u3001\u5F53\u524D\u9879\u76EE\u961F\u5217\u548C\u4FDD\u7559\u4E2D\u7684\u672A\u77E5\u5360\u7528\u3002" },
                React.createElement("button", { className: "secondary", disabled: this.state.loading, onClick: () => void this.refresh() }, "\u5237\u65B0\u8C03\u5EA6\u72B6\u6001")),
            React.createElement("p", { className: "notice" }, "\u5BB9\u91CF\u8BBE\u7F6E\u5F71\u54CD\u5171\u4EAB\u540C\u4E00\u6570\u636E\u76EE\u5F55\u7684\u6240\u6709\u9879\u76EE\uFF0C\u4E0D\u4FEE\u6539\u5DF2\u7ECF\u6279\u51C6\u7684\u547D\u4EE4\u3001\u955C\u50CF\u6216\u8D44\u6E90\u9700\u6C42\u3002\u4EE5\u4E0B\u6570\u5B57\u662F\u8C03\u5EA6\u9884\u7B97\uFF0C\u4E0D\u662F\u786C\u4EF6\u7A7A\u95F2\u91CF\u3001Token \u6216\u8D26\u5355\u786C\u9650\u989D\u3002"),
            this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
            React.createElement("section", { className: "surface report-builder" },
                React.createElement("h2", null, "\u5BBF\u4E3B Pi Worker"),
                a ? React.createElement("div", null,
                    React.createElement("dl", { className: "details" },
                        React.createElement("dt", null, "\u5171\u4EAB\u5360\u7528"),
                        React.createElement("dd", null,
                            a.counts.held,
                            " / ",
                            a.maxWorkers,
                            " \u4E2A Pi Worker"),
                        React.createElement("dt", null, "\u5BBF\u4E3B\u53EF\u7528"),
                        React.createElement("dd", null,
                            a.available,
                            " \u4E2A Worker"),
                        React.createElement("dt", null, "\u72B6\u6001\u5206\u5E03"),
                        React.createElement("dd", null,
                            "\u9884\u7559 ",
                            a.counts.reserved,
                            " \u00B7 \u8FD0\u884C ",
                            a.counts.running,
                            " \u00B7 \u505C\u6B62\u4E2D ",
                            a.counts.stopping,
                            " \u00B7 \u672A\u77E5 ",
                            a.counts.unknown),
                        a.project ? React.createElement("div", { className: "detail-pair" },
                            React.createElement("dt", null, "\u9879\u76EE\u914D\u989D"),
                            React.createElement("dd", null,
                                "Agent ",
                                a.project.maxActiveAgents,
                                " \u00B7 \u52A9\u624B ",
                                a.project.maxConcurrentAssistants,
                                "\uFF1B\u5F53\u524D\u53EF\u7528 ",
                                a.project.available,
                                "\uFF0C\u52A9\u624B\u53EF\u7528 ",
                                a.project.assistantAvailable)) : null),
                    React.createElement("p", { className: "small muted" }, "HTTP \u5E76\u53D1\u672A\u6D4B\u91CF\uFF08httpConcurrencyMeasured=false\uFF09\u3002Worker \u672A\u77E5\u5360\u7528\u9700\u6838\u5BF9\uFF0C\u4E0D\u56E0\u79DF\u7EA6\u8FC7\u671F\u81EA\u52A8\u5F53\u4F5C\u7A7A\u95F2\u3002"),
                    React.createElement("div", null,
                        React.createElement("h3", null, "\u5F53\u524D\u9879\u76EE\u5F85\u542F\u52A8\u4F1A\u8BDD\uFF08\u6709\u754C\u5217\u8868\uFF09"),
                        a.queued?.length ? React.createElement("ul", null, a.queued.map(item => React.createElement("li", { key: item.sessionId },
                            React.createElement("code", null, short(item.sessionId)),
                            " \u00B7 ",
                            label(item.role),
                            React.createElement("ul", null, item.reasons.map((reason, i) => React.createElement("li", { key: i },
                                reason.message,
                                " ",
                                React.createElement("small", null,
                                    "(",
                                    reason.code,
                                    ")"))))))) : React.createElement("p", { className: "small muted" }, "\u672A\u8FD4\u56DE\u5F85\u542F\u52A8\u4F1A\u8BDD\uFF1B\u4E0D\u636E\u6B64\u63A8\u65AD\u5176\u4ED6\u9879\u76EE\u961F\u5217\u4E3A\u7A7A\u3002")),
                    React.createElement("details", null,
                        React.createElement("summary", null, "\u4FEE\u6539\u5171\u4EAB Worker \u5BB9\u91CF"),
                        React.createElement(AgentForm, { projectId: this.props.data.project.id, capacity: a, perform: this.props.perform, onSaved: () => this.refresh() }))) : React.createElement("p", { role: "status" }, "Worker \u5BB9\u91CF\u5F85\u52A0\u8F7D\u3002")),
            React.createElement(TargetProbe, { projectId: this.props.data.project.id, perform: this.props.perform, onConfirmed: () => this.refresh() }),
            c ? React.createElement("div", null,
                React.createElement("section", { className: "surface report-builder" },
                    React.createElement("h2", null, "\u5171\u4EAB\u8BA1\u7B97\u9884\u7B97"),
                    React.createElement(Usage, { limits: c.configuration.limits, usage: c.usage, available: c.available }),
                    React.createElement("p", null,
                        "\u6392\u961F\u8BA1\u6570\uFF1A",
                        c.queued,
                        " \u00B7 \u914D\u7F6E\u7248\u672C ",
                        c.configuration.version),
                    React.createElement("details", null,
                        React.createElement("summary", null, "\u4FEE\u6539\u5171\u4EAB\u8BA1\u7B97\u5BB9\u91CF"),
                        React.createElement(ComputeForm, { projectId: this.props.data.project.id, configuration: c.configuration, perform: this.props.perform, onSaved: () => this.refresh() }))),
                c.targets.map(target => React.createElement("section", { className: "surface report-builder", key: target.targetId },
                    React.createElement("h2", null, target.backend === 'docker' ? 'Docker 计算目标' : '受信本地示例目标'),
                    React.createElement("p", { className: "small muted" },
                        "Context \u522B\u540D\uFF1A",
                        target.contexts.join('、') || '无',
                        "\u3002\u540C\u4E00\u5B9E\u9645\u5F15\u64CE\u7684\u522B\u540D\u5171\u4EAB\u5BB9\u91CF\u3002"),
                    React.createElement(Usage, { limits: target.configuration.limits, usage: target.usage, available: target.available }),
                    React.createElement("details", null,
                        React.createElement("summary", null, "\u76EE\u6807\u8EAB\u4EFD\u4E0E\u5BB9\u91CF\u914D\u7F6E"),
                        React.createElement("code", { className: "digest" }, target.targetId),
                        React.createElement(ComputeForm, { projectId: this.props.data.project.id, targetId: target.targetId, configuration: target.configuration, perform: this.props.perform, onSaved: () => this.refresh() })))),
                React.createElement("section", { className: "surface" },
                    React.createElement("div", { className: "surface-heading" },
                        React.createElement("h2", null, "\u5F53\u524D\u9879\u76EE\u8BA1\u7B97\u961F\u5217"),
                        React.createElement("span", { className: "small muted" }, "\u5360\u7528\u7EDF\u8BA1\u4E3A\u5BBF\u4E3B\u5171\u4EAB\u8303\u56F4\uFF1B\u672C\u5217\u8868\u53EA\u5305\u542B\u5F53\u524D\u9879\u76EE\u3002")),
                    c.items.length ? React.createElement("div", { className: "table-wrap" },
                        React.createElement("table", null,
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "\u4F5C\u4E1A"),
                                    React.createElement("th", null, "\u72B6\u6001\u4E0E\u539F\u56E0"),
                                    React.createElement("th", null, "\u8D44\u6E90\u9700\u6C42"),
                                    React.createElement("th", null, "\u6062\u590D\u4E0E\u5360\u7528"))),
                            React.createElement("tbody", null, c.items.map(item => React.createElement(QueueRow, { key: `${item.kind}:${item.id}`, item: item }))))) : React.createElement("p", { className: "inline-empty" }, "\u5F53\u524D\u9875\u6CA1\u6709\u8BA1\u7B97\u4F5C\u4E1A\u3002"),
                    React.createElement("div", { className: "actions wrap" },
                        React.createElement("button", { className: "secondary", disabled: this.state.loading || this.state.cursor === 0, onClick: () => void this.refresh(0) }, "\u8FD4\u56DE\u9996\u9875"),
                        React.createElement("button", { className: "secondary", disabled: this.state.loading || c.nextCursor === null, onClick: () => { if (c.nextCursor !== null)
                                void this.refresh(c.nextCursor); } }, "\u4E0B\u4E00\u9875")))) : React.createElement("p", { role: "status" }, "\u8BA1\u7B97\u5BB9\u91CF\u4E0E\u961F\u5217\u5F85\u52A0\u8F7D\u3002"));
    }
}
function QueueRow({ item }) { return React.createElement("tr", null,
    React.createElement("td", null,
        item.kind === 'run' ? '正式 Run' : item.kind === 'document' ? '文档解析' : item.kind === 'publication' ? '文稿构建' : '开发测试',
        " ",
        React.createElement("code", null, short(item.id)),
        React.createElement("small", null,
            "\u961F\u5217\u5E8F\u53F7 ",
            item.sequence)),
    React.createElement("td", null,
        React.createElement(Badge, { value: item.state }),
        React.createElement("p", null, computeReasonLabels[item.reason])),
    React.createElement("td", null,
        item.requested.cpus,
        " CPU / ",
        item.requested.memoryMb,
        " MiB"),
    React.createElement("td", null,
        item.held ? '容量保留中' : '未占容量',
        item.state === 'unknown' ? React.createElement("p", null, "\u672A\u77E5\u72B6\u6001\u4ECD\u8BA1\u5165\u5360\u7528\uFF0C\u7B49\u5F85\u6838\u5BF9\u3002") : null,
        item.nextAttemptAt > 0 ? React.createElement("p", { className: "small muted" },
            "\u4E0B\u6B21\u53EF\u6838\u5BF9\u65F6\u95F4 ",
            new Date(item.nextAttemptAt).toLocaleString('zh-CN'),
            "\uFF08\u4E0D\u662F\u5F00\u59CB\u6267\u884C\u627F\u8BFA\uFF09") : null,
        React.createElement("details", null,
            React.createElement("summary", null, "\u6062\u590D\u53CA\u76EE\u6807\u8BE6\u60C5"),
            React.createElement("p", null,
                "\u4EE3\u6B21 ",
                item.generation,
                " \u00B7 ",
                label(item.backend)),
            React.createElement("code", { className: "digest" }, item.targetId ?? '目标尚未确认'),
            React.createElement("p", { className: "small muted" },
                "\u79DF\u7EA6\u622A\u6B62 ",
                item.leaseUntil > 0 ? new Date(item.leaseUntil).toLocaleString('zh-CN') : '无有效租约',
                "\uFF1B\u8FC7\u671F\u4E0D\u4EE3\u8868\u5916\u90E8\u4F5C\u4E1A\u5DF2\u7ED3\u675F\u3002")))); }
