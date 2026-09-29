import { api } from './api.js';
import { short, label } from './models.js';
import { Badge } from './ui.js';
const expiry = () => { const d = new Date(Date.now() + 3600000); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const signature = (p) => JSON.stringify([p.data.runGrants, p.data.approvals, p.data.intents.map(i => [i.id, i.version, i.status, i.runId]), p.data.sessions.map(s => [s.id, s.version, s.runGrantId])]);
export const runGrantUsable = (grant) => !!grant && grant.validity === 'current' && grant.effectiveState === 'active' && grant.usage.remaining > 0 && Date.parse(grant.expiresAt) > Date.now();
export function readRunGrantDraft(fd) { const intentIds = fd.getAll('intentIds').map(String), maxRuns = Number(fd.get('maxRuns')), expiresAt = new Date(String(fd.get('expiresAt'))); if (!intentIds.length || intentIds.length > 20 || new Set(intentIds).size !== intentIds.length || !Number.isInteger(maxRuns) || maxRuns < 1 || maxRuns > intentIds.length)
    throw Error('请选择 1–20 份不同清单，并将额度设在集合数量以内'); if (!Number.isFinite(expiresAt.getTime()))
    throw Error('授权截止时间无效'); return { sessionId: String(fd.get('sessionId')), intentIds, maxRuns, expiresAt: expiresAt.toISOString() }; }
export class RunGrants extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { selected: '', intentIds: [], inspection: null, reading: false, error: '' };
        this.epoch = 0;
        this.mounted = true;
    }
    componentDidMount() { const id = this.props.selectedGrant || (this.props.data.runGrants ?? []).slice(-1)[0]?.id; if (id)
        void this.inspect(id); }
    componentWillUnmount() { this.mounted = false; this.epoch++; }
    componentDidUpdate(previous) { if (previous.data.project.id !== this.props.data.project.id) {
        this.epoch++;
        this.setState({ selected: '', intentIds: [], inspection: null, reading: false, error: '' });
        if (this.props.selectedGrant)
            void this.inspect(this.props.selectedGrant);
    }
    else if (previous.selectedGrant !== this.props.selectedGrant) {
        if (this.props.selectedGrant)
            void this.inspect(this.props.selectedGrant);
        else {
            this.epoch++;
            this.setState({ selected: '', inspection: null, reading: false, error: '' });
        }
    }
    else if (signature(previous) !== signature(this.props) && this.state.selected)
        void this.inspect(this.state.selected); }
    call(name, input) { return api(`/operations/${name}`, { projectId: this.props.data.project.id, input }); }
    select(id) { if (this.props.onSelect && id !== this.props.selectedGrant)
        this.props.onSelect(id);
    else
        void this.inspect(id); }
    async inspect(grantId) { const epoch = ++this.epoch, projectId = this.props.data.project.id; this.setState({ selected: grantId, inspection: null, reading: true, error: '' }); try {
        const grant = await this.call('run_grant_inspect', { grantId });
        if (grant.id !== grantId || grant.projectId !== projectId)
            throw Error('授权不属于所选项目与记录');
        if (this.mounted && epoch === this.epoch && projectId === this.props.data.project.id)
            this.setState({ inspection: grant });
    }
    catch (error) {
        if (this.mounted && epoch === this.epoch)
            this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
    finally {
        if (this.mounted && epoch === this.epoch)
            this.setState({ reading: false });
    } }
    async prepare(fd) { const epoch = this.epoch, projectId = this.props.data.project.id; await this.props.perform(async () => { const grant = await this.call('run_grant_prepare', readRunGrantDraft(fd)); if (this.mounted && epoch === this.epoch && projectId === this.props.data.project.id) {
        this.setState({ intentIds: [] });
        this.select(grant.id);
    } }, '冻结集合草案已保存；尚未批准或激活，未启动模型或计算'); }
    async submit(intentId, experimentId) { await this.props.perform(async () => { const run = await this.call('run_submit', { intentId }); if (run.experimentId !== experimentId)
        throw Error('返回的 Run 不属于固定实验'); }, '已提交固定 Run；该提交永久计次，刷新后可回查实际运行'); }
    render() {
        const { data, busy, perform } = this.props, grants = data.runGrants ?? [], grant = this.state.inspection, approval = data.approvals.find(a => a.id === grant?.approvalId), eligible = data.intents.filter(i => i.status === 'prepared' && !i.runId && !i.runGrant && data.approvals.some(a => a.id === i.approvalId && a.status === 'pending' && !a.runGrant)), available = this.state.intentIds.every(id => eligible.some(i => i.id === id));
        return React.createElement("section", { className: "surface" },
            React.createElement("div", { className: "surface-heading" },
                React.createElement("h2", null, "\u6709\u9650\u51BB\u7ED3\u8FD0\u884C\u6388\u6743")),
            React.createElement("p", { className: "small muted" }, "\u4ECE\u5DF2\u51C6\u5907\u6E05\u5355\u4E2D\u6279\u51C6\u4E00\u4E2A\u6709\u9650\u96C6\u5408\uFF0C\u53EA\u8986\u76D6\u56FA\u5B9A\u6E90\u7801\u4E0E\u5951\u7EA6\u3002\u6279\u51C6\u548C\u6FC0\u6D3B\u4E0D\u542F\u52A8\u6A21\u578B\u6216\u8BA1\u7B97\uFF1B\u672A\u77E5\u65B0\u6E05\u5355\u4E0D\u81EA\u52A8\u52A0\u5165\u3002\u4FEE\u6539\u8303\u56F4\u6216\u7EED\u671F\u8BF7\u4F7F\u7528\u65B0\u7684\u4E13\u7528\u4E3B\u4F1A\u8BDD\u3002"),
            React.createElement("details", null,
                React.createElement("summary", null, "\u51C6\u5907 RunGrant \u8349\u6848"),
                React.createElement("form", { className: "form-body", onSubmit: (e) => { e.preventDefault(); void this.prepare(new FormData(e.currentTarget)); } },
                    React.createElement("label", null,
                        "\u4E13\u7528\u4E3B\u534F\u8C03\u4F1A\u8BDD",
                        React.createElement("select", { name: "sessionId", required: true },
                            React.createElement("option", { value: "" }, "\u9009\u62E9\u5C1A\u672A\u7ED1\u5B9A RunGrant \u7684\u4E3B\u4F1A\u8BDD"),
                            data.sessions.filter(s => s.role === 'coordinator' && !s.taskId && s.state !== 'archived' && !s.runGrantId).map(s => React.createElement("option", { key: s.id, value: s.id },
                                s.title,
                                " \u00B7 ",
                                short(s.id))))),
                    React.createElement("fieldset", null,
                        React.createElement("legend", null,
                            "\u56FA\u5B9A\u8FD0\u884C\u6E05\u5355\uFF08\u5DF2\u9009 ",
                            this.state.intentIds.length,
                            "/20\uFF09"),
                        data.intents.filter(i => eligible.some(row => row.id === i.id) || this.state.intentIds.includes(i.id)).map(i => React.createElement("label", { className: "check-label", key: i.id },
                            React.createElement("input", { type: "checkbox", name: "intentIds", value: i.id, checked: this.state.intentIds.includes(i.id), disabled: !this.state.intentIds.includes(i.id) && this.state.intentIds.length >= 20, onChange: (e) => this.setState({ intentIds: e.target.checked ? [...this.state.intentIds, i.id] : this.state.intentIds.filter(id => id !== i.id) }) }),
                            data.experiments.find(e => e.id === i.experimentId)?.title ?? short(i.experimentId),
                            " \u00B7 \u6E05\u5355 ",
                            short(i.id),
                            " \u00B7 \u4FEE\u8BA2 ",
                            i.manifest.experimentRevision,
                            !eligible.some(row => row.id === i.id) ? ' · 已不可用于新授权' : '')),
                        !eligible.length ? React.createElement("p", { className: "small muted" }, "\u5148\u5728\u5B9E\u9A8C\u8BE6\u60C5\u51C6\u5907\u8FD0\u884C\uFF0C\u4FDD\u7559\u539F\u6279\u51C6\u4E3A\u5F85\u6279\u51C6\u72B6\u6001\uFF1B\u5DF2\u63D0\u4EA4\u6216\u5DF2\u7ED1\u5B9A\u6E05\u5355\u4E0D\u80FD\u52A0\u5165\u3002") : null),
                    this.state.intentIds.length ? React.createElement("button", { type: "button", className: "text-button", onClick: () => this.setState({ intentIds: [] }) }, "\u6E05\u7A7A\u6E05\u5355\u9009\u62E9") : null,
                    !available ? React.createElement("p", { role: "alert", className: "error-text" }, "\u6240\u9009\u6E05\u5355\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002") : null,
                    React.createElement("div", { className: "form-columns" },
                        React.createElement("label", null,
                            "\u6700\u591A\u8FD0\u884C\u63D0\u4EA4\u6B21\u6570",
                            React.createElement("input", { name: "maxRuns", type: "number", required: true, min: 1, max: Math.max(1, this.state.intentIds.length), defaultValue: 1 })),
                        React.createElement("label", null,
                            "\u6388\u6743\u622A\u6B62\uFF08\u672C\u5730\u65F6\u95F4\uFF09",
                            React.createElement("input", { name: "expiresAt", type: "datetime-local", required: true, defaultValue: expiry() }))),
                    React.createElement("button", { className: "secondary", disabled: busy || !available || !this.state.intentIds.length }, "\u4FDD\u5B58\u51BB\u7ED3\u96C6\u5408\u8349\u6848"))),
            grants.length ? React.createElement("label", null,
                "\u67E5\u770B\u8FD0\u884C\u6388\u6743",
                React.createElement("select", { value: this.state.selected, onChange: (e) => this.select(e.target.value) },
                    React.createElement("option", { value: "", disabled: true }, "\u9009\u62E9\u6388\u6743\u8BB0\u5F55"),
                    grants.map(g => React.createElement("option", { key: g.id, value: g.id },
                        short(g.id),
                        " \u00B7 ",
                        g.state)))) : React.createElement("p", { className: "inline-empty" }, "\u6682\u65E0 RunGrant\uFF1B\u672A\u7ED1\u5B9A\u6E05\u5355\u4ECD\u53EF\u7531\u7528\u6237\u72EC\u7ACB\u9010\u6B21\u6279\u51C6\u3002"),
            this.state.selected ? React.createElement("button", { className: "text-button", disabled: this.state.reading, onClick: () => void this.inspect(this.state.selected) }, "\u91CD\u65B0\u6838\u9A8C\u6B64\u8FD0\u884C\u6388\u6743") : null,
            this.state.reading ? React.createElement("p", { role: "status" }, "\u6B63\u5728\u8BFB\u53D6\u56FA\u5B9A\u96C6\u5408\u4E0E\u7528\u91CF\u2026") : null,
            this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
            grant ? React.createElement("div", null,
                React.createElement("h3", null,
                    "RunGrant ",
                    short(grant.id),
                    " ",
                    React.createElement(Badge, { value: grant.state })),
                React.createElement("p", null,
                    "\u5F53\u524D\u72B6\u6001\uFF1A",
                    grant.effectiveState,
                    " \u00B7 ",
                    grant.validity),
                grant.reasons.map((reason, i) => React.createElement("p", { key: i, className: "notice-inline", role: "status" }, reason)),
                React.createElement("p", null,
                    "\u5DF2\u7528 ",
                    grant.usage.used,
                    " / \u989D\u5EA6 ",
                    grant.usage.limit,
                    " / \u5269\u4F59 ",
                    grant.usage.remaining,
                    " \u6B21\u3002\u5931\u8D25\u3001\u53D6\u6D88\u6216\u672A\u77E5\u72B6\u6001\u4E0D\u9000\u6B21\u6570\uFF1B\u91CD\u653E\u540C\u4E00\u6E05\u5355\u4E0D\u521B\u5EFA\u7B2C\u4E8C\u4E2A Run\u3002"),
                React.createElement("dl", { className: "details" },
                    React.createElement("dt", null, "\u6307\u5B9A\u4E3B\u4F1A\u8BDD"),
                    React.createElement("dd", null,
                        short(grant.sessionId),
                        this.props.onSession ? React.createElement("button", { className: "text-button", disabled: !data.sessions.some(s => s.id === grant.sessionId), onClick: () => this.props.onSession?.(grant.sessionId) }, "\u6253\u5F00\u6307\u5B9A Pi \u4F1A\u8BDD") : null),
                    React.createElement("dt", null, "\u56FA\u5B9A\u6A21\u578B"),
                    React.createElement("dd", null,
                        grant.model.provider,
                        " / ",
                        grant.model.model),
                    React.createElement("dt", null, "\u6388\u6743\u622A\u6B62"),
                    React.createElement("dd", null,
                        new Date(grant.expiresAt).toLocaleString(),
                        " \u00B7 ",
                        grant.expiresAt),
                    React.createElement("dt", null, "\u6388\u6743\u6279\u51C6"),
                    React.createElement("dd", null, short(grant.approvalId)),
                    React.createElement("dt", null, "\u96C6\u5408\u6458\u8981"),
                    React.createElement("dd", null,
                        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } }, grant.digest))),
                grant.manifests.map(item => { const intent = data.intents.find(i => i.id === item.intentId), runId = grant.uses.find(use => use.intentId === item.intentId)?.runId ?? intent?.runId, run = data.runs.find(r => r.id === runId && r.experimentId === item.experimentId); return React.createElement("article", { className: "inspector-section", key: item.intentId },
                    React.createElement("h4", null,
                        data.experiments.find(e => e.id === item.experimentId)?.title ?? short(item.experimentId),
                        " \u00B7 \u6E05\u5355 ",
                        short(item.intentId)),
                    React.createElement("p", null,
                        "\u56FA\u5B9A\u4FEE\u8BA2 ",
                        item.experimentRevision,
                        " \u00B7 \u539F\u6279\u51C6 ",
                        short(item.approvalId),
                        " \u00B7 ",
                        label(data.approvals.find(a => a.id === item.approvalId)?.status ?? 'pending')),
                    React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                        "\u6E90\u7801 ",
                        item.sourceDigest),
                    React.createElement("dl", { className: "details" },
                        React.createElement("dt", null, "\u56FA\u5B9A argv"),
                        React.createElement("dd", null,
                            React.createElement("code", null, JSON.stringify(item.contract.command))),
                        React.createElement("dt", null, "\u955C\u50CF"),
                        React.createElement("dd", null,
                            React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } }, item.contract.image ?? '受信本地数值示例')),
                        React.createElement("dt", null, "Docker context"),
                        React.createElement("dd", null, item.contract.dockerContext ?? '不适用'),
                        React.createElement("dt", null, "\u8D44\u6E90"),
                        React.createElement("dd", null,
                            item.contract.cpus,
                            " CPU \u00B7 ",
                            item.contract.memoryMb,
                            " MiB \u00B7 ",
                            item.contract.timeoutSeconds,
                            " \u79D2"),
                        React.createElement("dt", null, "\u6570\u636E / \u534F\u8BAE"),
                        React.createElement("dd", null,
                            item.contract.datasetVersion,
                            " / ",
                            item.contract.evaluationProtocolVersion)),
                    runId ? React.createElement("button", { className: "secondary compact", disabled: !run || !this.props.onRun, onClick: () => this.props.onRun?.(runId, item.experimentId) },
                        "\u67E5\u770B\u5B9E\u9645 Run ",
                        short(runId),
                        " \u00B7 ",
                        label(run?.state ?? '等待记录刷新')) : React.createElement("button", { className: "primary compact", disabled: busy || !runGrantUsable(grant) || intent?.runGrant?.id !== grant.id, onClick: () => void this.submit(item.intentId, item.experimentId) }, "\u63D0\u4EA4\u6B64\u56FA\u5B9A\u6E05\u5355\uFF08\u8BA1\u4E00\u6B21\uFF09")); }),
                React.createElement("div", { className: "actions" },
                    grant.state === 'draft' && approval?.status === 'pending' ? React.createElement("button", { className: "primary", disabled: busy || grant.validity !== 'current' || grant.effectiveState !== 'draft', onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), '固定集合已批准；尚未激活') }, "\u6279\u51C6\u6B64\u56FA\u5B9A\u96C6\u5408") : null,
                    grant.state === 'draft' && approval?.status === 'approved' ? React.createElement("button", { className: "primary", disabled: busy || grant.validity !== 'current' || grant.effectiveState !== 'draft', onClick: () => perform(() => this.call('run_grant_activate', { grantId: grant.id, expectedVersion: grant.version }), '运行授权已激活；未启动模型或 Run') }, "\u6FC0\u6D3B\u5DF2\u6279\u51C6\u8FD0\u884C\u6388\u6743") : null,
                    grant.state !== 'revoked' ? React.createElement("button", { className: "secondary", disabled: busy, onClick: () => perform(() => this.call('run_grant_revoke', { grantId: grant.id, expectedVersion: grant.version }), '已撤销运行授权；历史字节与取消入口保留') }, "\u64A4\u9500\u8FD0\u884C\u6388\u6743") : null),
                React.createElement("details", null,
                    React.createElement("summary", null, "\u5B8C\u6574\u56FA\u5B9A\u96C6\u5408\u4E0E\u8BA1\u6B21\u8BB0\u5F55"),
                    React.createElement("pre", { className: "file-preview" }, JSON.stringify(grant, null, 2))),
                React.createElement("p", { className: "small muted" }, "\u81EA\u7136\u5230\u671F\u4E0D\u4F5C\u5E9F\u5DF2\u5B8C\u6210\u8BC1\u636E\uFF1B\u663E\u5F0F\u64A4\u9500\u963B\u65AD\u4F9D\u8D56\u8BE5\u6388\u6743\u7684\u65B0\u4EA4\u4ED8\u3002\u5B9E\u9645\u8FD0\u884C\u7684\u65E5\u5FD7\u4E0E\u53D6\u6D88\u5165\u53E3\u5728\u7CBE\u786E Run \u8BE6\u60C5\u4E2D\u3002")) : null);
    }
}
