import { ApiError } from './api.js';
export const LOG_PAGE_BYTES = 65536;
/** One server-bounded UTF-8 page; never accumulate the entire running log in browser memory. */
export class LogView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { stream: 'stdout', page: null, following: true, loading: false, error: '', reset: false };
        this.epoch = 0;
        this.pending = false;
        this.starts = [0];
    }
    componentDidMount() { void this.follow(); this.timer = window.setInterval(() => { if (this.state.following && !this.state.page?.complete)
        void this.follow(); }, 1500); }
    componentWillUnmount() { clearInterval(this.timer); this.invalidate(); }
    invalidate() { this.epoch++; this.controller?.abort(); this.pending = false; clearTimeout(this.catchup); }
    async load(cursor, reset = false) {
        if (this.pending)
            return;
        this.pending = true;
        const epoch = this.epoch, controller = new AbortController();
        this.controller = controller;
        const identity = reset ? undefined : this.state.page?.identity ?? undefined;
        this.setState({ loading: true, error: '' });
        try {
            const page = await this.props.read({ stream: this.state.stream, cursor, ...(identity ? { identity } : {}) }, controller.signal);
            if (!Number.isSafeInteger(page.start) || page.start < 0 || page.cursor < page.start || page.cursor - page.start > LOG_PAGE_BYTES || new TextEncoder().encode(page.content).length > LOG_PAGE_BYTES)
                throw Error('日志页超出有界读取范围');
            if (epoch === this.epoch) {
                this.starts = [...new Set([...this.starts, page.start, page.cursor])].sort((a, b) => a - b).slice(-128);
                const prior = this.state.page;
                const visible = !page.content && prior && prior.cursor === page.start && prior.identity === page.identity ? { ...prior, size: page.size, complete: page.complete } : page;
                await new Promise(resolve => this.setState({ page: visible, reset: false }, resolve));
                return page;
            }
        }
        catch (error) {
            if (epoch === this.epoch && !controller.signal.aborted) {
                const reset = error instanceof ApiError && error.code === 'LOG_RESET', encoding = error instanceof ApiError && error.code === 'LOG_ENCODING_INVALID';
                this.setState({ error: reset ? '日志身份或长度已变化。当前页为上次读取；请显式从头重新读取。' : encoding ? '日志包含无效 UTF-8，已暂停跟随；请使用原始归档下载核对。' : error instanceof Error ? error.message : String(error), reset, ...(reset || encoding ? { following: false } : {}) });
            }
        }
        finally {
            if (epoch === this.epoch) {
                this.pending = false;
                this.setState({ loading: false });
            }
        }
    }
    async follow() {
        if (this.pending)
            return;
        clearTimeout(this.catchup);
        const epoch = this.epoch;
        for (let count = 0; count < 3; count++) {
            const cursor = this.state.page?.cursor ?? 0, page = await this.load(cursor);
            if (epoch !== this.epoch || !this.state.following || !page || page.complete || page.cursor >= page.size || page.cursor === cursor)
                return;
        }
        if (epoch === this.epoch && this.state.following)
            this.catchup = setTimeout(() => void this.follow(), 50);
    }
    navigate(cursor) { this.invalidate(); this.setState({ following: false, loading: false }, () => void this.load(cursor)); }
    fromStart() { this.invalidate(); this.starts = [0]; this.setState({ page: null, following: false, loading: false, error: '', reset: false }, () => void this.load(0, true)); }
    selectStream(stream) { this.invalidate(); this.starts = [0]; this.setState({ stream, page: null, following: true, loading: false, error: '', reset: false }, () => void this.follow()); }
    render() {
        const s = this.state, p = s.page, previous = this.starts.filter(start => start < (p?.start ?? 0)).pop();
        return React.createElement("div", null,
            React.createElement("label", null,
                this.props.streamLabel,
                React.createElement("select", { "aria-label": this.props.streamLabel, value: s.stream, onChange: (e) => this.selectStream(e.target.value) },
                    React.createElement("option", { value: "stdout" }, "\u6807\u51C6\u8F93\u51FA stdout"),
                    React.createElement("option", { value: "stderr" }, "\u9519\u8BEF\u8F93\u51FA stderr"))),
            React.createElement("p", { className: "small muted" }, "\u6BCF\u9875\u6700\u591A 64 KiB\uFF1B\u53EA\u663E\u793A\u5F53\u524D\u7A97\u53E3\uFF0C\u4E0D\u4EE3\u8868\u5B8C\u6574\u65E5\u5FD7\u3002\u539F\u59CB\u5F52\u6863\u53EF\u5728\u4EA7\u7269\u4E2D\u4E0B\u8F7D\u3002"),
            p ? React.createElement("p", { className: "small muted" },
                "\u5B57\u8282\u8303\u56F4 [",
                p.start,
                ", ",
                p.cursor,
                ") / \u6700\u8FD1\u89C2\u5BDF\u5927\u5C0F ",
                p.size,
                p.start > 0 ? '；前文未在当前窗口显示' : '',
                " \u00B7 ",
                s.following ? '跟随末尾' : '回查模式') : null,
            React.createElement("pre", { className: "logs", "aria-label": `${s.stream} 日志` }, p?.content || (s.loading ? '读取日志…' : '此页暂无内容。')),
            s.error ? React.createElement("p", { role: "alert", className: "error-text" }, s.error) : null,
            React.createElement("div", { className: "actions wrap" },
                React.createElement("button", { className: "secondary compact", onClick: () => this.fromStart() }, s.reset ? '确认重置并从头读取' : '从头读取'),
                React.createElement("button", { className: "secondary compact", disabled: s.loading || s.reset || previous === undefined, onClick: () => { if (previous !== undefined)
                        this.navigate(previous); } }, "\u4E0A\u4E00\u9875\u65E5\u5FD7"),
                React.createElement("button", { className: "secondary compact", disabled: s.loading || s.reset || !p || p.cursor >= p.size, onClick: () => this.navigate(p.cursor) }, "\u4E0B\u4E00\u9875\u65E5\u5FD7"),
                React.createElement("button", { className: "secondary compact", disabled: s.loading || s.reset, onClick: () => { this.invalidate(); this.setState({ following: true, loading: false }, () => void this.follow()); } }, "\u7EE7\u7EED\u8DDF\u968F\u672B\u5C3E"),
                s.following ? React.createElement("button", { className: "text-button", onClick: () => this.setState({ following: false }) }, "\u6682\u505C\u8DDF\u968F") : null),
            p && p.start > 0 && previous === undefined ? React.createElement("p", { className: "small muted" }, "\u66F4\u65E9\u7684\u9875\u8D77\u70B9\u5DF2\u8D85\u51FA 128 \u9879\u56DE\u67E5\u8BB0\u5F55\uFF1B\u8BF7\u4ECE\u5934\u8BFB\u53D6\u3002\u539F\u59CB\u65E5\u5FD7\u672A\u88AB\u5220\u9664\u3002") : null,
            p && p.cursor < p.size && s.following ? React.createElement("p", { className: "small muted" }, "\u6B63\u5728\u8865\u8BFB\u540E\u7EED\u5185\u5BB9\uFF0C\u6BCF\u8F6E\u6700\u591A 3 \u9875\u540E\u8BA9\u51FA\uFF1B\u5C1A\u672A\u5230\u6700\u65B0\u8F93\u51FA\u3002") : null,
            p?.complete ? React.createElement("p", { className: "small muted" }, "\u5F53\u524D\u9875\u5230\u8FBE\u5DF2\u7ED3\u675F\u65E5\u5FD7\u7684\u672B\u5C3E\uFF1B\u524D\u6587\u4ECD\u53EF\u7FFB\u9875\u56DE\u67E5\u3002") : p && p.cursor >= p.size ? React.createElement("p", { className: "small muted" }, "\u5DF2\u5230\u5F53\u524D\u5199\u5165\u4F4D\u7F6E\uFF0C\u5C1A\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u4F5C\u4E1A\u5B8C\u6210\u3002") : null);
    }
}
