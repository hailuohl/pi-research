// The offline distribution uses the MIT-licensed React 16 UMD runtime.
// Backend domain declarations are consumed separately as the shared contract.
declare namespace React {
    type ReactNode = any;
    class Component<P = {}, S = {}> {
        constructor(props: P);
        readonly props: Readonly<P>;
        state: Readonly<S>;
        setState(update: Partial<S> | ((state: Readonly<S>, props: Readonly<P>) => Partial<S> | null), callback?: () => void): void;
        forceUpdate(): void;
        render(): any;
    }
    function createElement(type: any, props: any, ...children: any[]): any;
}
declare namespace ReactDOM {
    function render(element: any, container: Element | null): void;
}
declare namespace JSX {
    interface Element {
    }
    interface ElementClass {
        render(): any;
    }
    interface ElementChildrenAttribute {
        children: {};
    }
    interface IntrinsicAttributes {
        key?: string | number;
    }
    interface IntrinsicElements {
        [tag: string]: any;
    }
}
