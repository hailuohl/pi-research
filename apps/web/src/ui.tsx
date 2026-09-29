import * as React from 'react';
import { label } from './models.js';
export function Icon({ name, size = 18 }: {
    name: string;
    size?: number;
}) { const paths: Record<string, React.ReactNode> = { chat: <path d="M4 4h16v12H9l-5 4z"/>, experiment: <path d="M9 3h6m-5 0v6L4 20h16L14 9V3M7 15h10"/>, folder: <path d="M3 6h7l2 2h9v12H3z"/>, evidence: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7"/>, report: <path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4"/>, settings: <path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>, plus: <path d="M12 5v14M5 12h14"/>, search: <path d="M15 15l6 6M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14"/>, arrow: <path d="M5 12h14M13 6l6 6-6 6"/>, close: <path d="m6 6 12 12M6 18 18 6"/>, check: <path d="m5 12 4 4L19 6"/>, stop: <rect x="6" y="6" width="12" height="12" rx="2"/>, chevron: <path d="m8 4 8 8-8 8"/>, branch: <path d="M6 4v16M6 10h6c4 0 6-2 6-6M3 4h6M3 20h6M15 4h6"/>, run: <path d="m7 4 14 8-14 8z"/> }; return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.report}</svg>; }
export function Badge({ value }: {
    value: string;
}) { return <span className={'badge s-' + value}>{label(value)}</span>; }
export function Empty({ title, children }: {
    title: string;
    children?: React.ReactNode;
}) { return <div className="empty"><div className="empty-symbol"><Icon name="experiment" size={30}/></div><h3>{title}</h3><div className="muted">{children}</div></div>; }
export function SectionTitle({ title, sub, children }: {
    title: string;
    sub?: string;
    children?: React.ReactNode;
}) { return <div className="section-title"><div><h1>{title}</h1>{sub ? <p>{sub}</p> : null}</div><div className="actions">{children}</div></div>; }
export class Modal extends React.Component<{
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    submitLabel: string;
    busy: boolean;
    wide?: boolean;
}> {
    private el: HTMLElement | null = null;
    private previous: Element | null = null;
    componentDidMount() { this.previous = document.activeElement; this.el?.querySelector<HTMLInputElement>('input,textarea,select,button')?.focus(); }
    componentWillUnmount() { (this.previous as HTMLElement)?.focus?.(); }
    render() {
        return <div className="modal-backdrop" onMouseDown={(e) => {
                if (e.target === e.currentTarget)
                    this.props.onClose();
            }}><section ref={(el) => { this.el = el; }} role="dialog" aria-modal="true" aria-label={this.props.title} className={'modal ' + (this.props.wide ? 'wide' : '')} onKeyDown={(e) => {
                if (e.key === 'Escape')
                    this.props.onClose();
                if (e.key === 'Tab') {
                    const els = Array.from(this.el!.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea'));
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
            }}><header><h2>{this.props.title}</h2><button type="button" className="icon-button" aria-label="关闭对话框" onClick={this.props.onClose}><Icon name="close"/></button></header><form onSubmit={(e: any) => { e.preventDefault(); this.props.onSubmit(new FormData(e.currentTarget)); }}><div className="form-body">{this.props.children}</div><footer><button type="button" className="secondary" onClick={this.props.onClose}>取消</button><button className="primary" disabled={this.props.busy}>{this.props.busy ? '正在处理…' : this.props.submitLabel}</button></footer></form></section></div>;
    }
}
