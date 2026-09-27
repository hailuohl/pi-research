import { label } from './models.js';
export function Icon({ name, size = 18 }) { const paths = { chat: React.createElement("path", { d: "M4 4h16v12H9l-5 4z" }), experiment: React.createElement("path", { d: "M9 3h6m-5 0v6L4 20h16L14 9V3M7 15h10" }), folder: React.createElement("path", { d: "M3 6h7l2 2h9v12H3z" }), evidence: React.createElement("path", { d: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" }), report: React.createElement("path", { d: "M5 3h14v18H5zM9 8h6M9 12h6M9 16h4" }), settings: React.createElement("path", { d: "M4 7h16M4 17h16M8 4v6M16 14v6" }), plus: React.createElement("path", { d: "M12 5v14M5 12h14" }), search: React.createElement("path", { d: "M15 15l6 6M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14" }), arrow: React.createElement("path", { d: "M5 12h14M13 6l6 6-6 6" }), close: React.createElement("path", { d: "m6 6 12 12M6 18 18 6" }), check: React.createElement("path", { d: "m5 12 4 4L19 6" }), stop: React.createElement("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" }), chevron: React.createElement("path", { d: "m8 4 8 8-8 8" }), branch: React.createElement("path", { d: "M6 4v16M6 10h6c4 0 6-2 6-6M3 4h6M3 20h6M15 4h6" }), run: React.createElement("path", { d: "m7 4 14 8-14 8z" }) }; return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, paths[name] ?? paths.report); }
export function Badge({ value }) { return React.createElement("span", { className: 'badge s-' + value }, label(value)); }
export function Empty({ title, children }) { return React.createElement("div", { className: "empty" },
    React.createElement("div", { className: "empty-symbol" },
        React.createElement(Icon, { name: "experiment", size: 30 })),
    React.createElement("h3", null, title),
    React.createElement("div", { className: "muted" }, children)); }
export function SectionTitle({ title, sub, children }) { return React.createElement("div", { className: "section-title" },
    React.createElement("div", null,
        React.createElement("h1", null, title),
        sub ? React.createElement("p", null, sub) : null),
    React.createElement("div", { className: "actions" }, children)); }
export class Modal extends React.Component {
    constructor() {
        super(...arguments);
        this.el = null;
        this.previous = null;
    }
    componentDidMount() { this.previous = document.activeElement; this.el?.querySelector('input,textarea,select,button')?.focus(); }
    componentWillUnmount() { this.previous?.focus?.(); }
    render() {
        return React.createElement("div", { className: "modal-backdrop", onMouseDown: (e) => {
                if (e.target === e.currentTarget)
                    this.props.onClose();
            } },
            React.createElement("section", { ref: (el) => { this.el = el; }, role: "dialog", "aria-modal": "true", "aria-label": this.props.title, className: 'modal ' + (this.props.wide ? 'wide' : ''), onKeyDown: (e) => {
                    if (e.key === 'Escape')
                        this.props.onClose();
                    if (e.key === 'Tab') {
                        const els = Array.from(this.el.querySelectorAll('button:not(:disabled),input,select,textarea'));
                        const first = els[0], last = els[els.length - 1];
                        if (e.shiftKey && document.activeElement === first) {
                            e.preventDefault();
                            last.focus();
                        }
                        else if (!e.shiftKey && document.activeElement === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                } },
                React.createElement("header", null,
                    React.createElement("h2", null, this.props.title),
                    React.createElement("button", { type: "button", className: "icon-button", "aria-label": "\u5173\u95ED\u5BF9\u8BDD\u6846", onClick: this.props.onClose },
                        React.createElement(Icon, { name: "close" }))),
                React.createElement("form", { onSubmit: (e) => { e.preventDefault(); this.props.onSubmit(new FormData(e.currentTarget)); } },
                    React.createElement("div", { className: "form-body" }, this.props.children),
                    React.createElement("footer", null,
                        React.createElement("button", { type: "button", className: "secondary", onClick: this.props.onClose }, "\u53D6\u6D88"),
                        React.createElement("button", { className: "primary", disabled: this.props.busy }, this.props.busy ? '正在处理…' : this.props.submitLabel)))));
    }
}
