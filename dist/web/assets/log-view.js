import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ApiError } from "./api.js";
const LOG_PAGE_BYTES = 65536;
class LogView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { stream: "stdout", page: null, following: true, loading: false, error: "", reset: false };
    this.epoch = 0;
    this.pending = false;
    this.starts = [0];
  }
  componentDidMount() {
    void this.follow();
    this.timer = window.setInterval(() => {
      if (this.state.following && !this.state.page?.complete) void this.follow();
    }, 1500);
  }
  componentWillUnmount() {
    clearInterval(this.timer);
    this.invalidate();
  }
  invalidate() {
    this.epoch++;
    this.controller?.abort();
    this.pending = false;
    clearTimeout(this.catchup);
  }
  async load(cursor, reset = false) {
    if (this.pending) return;
    this.pending = true;
    const epoch = this.epoch, controller = new AbortController();
    this.controller = controller;
    const identity = reset ? void 0 : this.state.page?.identity ?? void 0;
    this.setState({ loading: true, error: "" });
    try {
      const page = await this.props.read({ stream: this.state.stream, cursor, ...identity ? { identity } : {} }, controller.signal);
      if (!Number.isSafeInteger(page.start) || page.start < 0 || page.cursor < page.start || page.cursor - page.start > LOG_PAGE_BYTES || new TextEncoder().encode(page.content).length > LOG_PAGE_BYTES) throw Error("\u65E5\u5FD7\u9875\u8D85\u51FA\u6709\u754C\u8BFB\u53D6\u8303\u56F4");
      if (epoch === this.epoch) {
        this.starts = [.../* @__PURE__ */ new Set([...this.starts, page.start, page.cursor])].sort((a, b) => a - b).slice(-128);
        const prior = this.state.page;
        const visible = !page.content && prior && prior.cursor === page.start && prior.identity === page.identity ? { ...prior, size: page.size, complete: page.complete } : page;
        await new Promise((resolve) => this.setState({ page: visible, reset: false }, resolve));
        return page;
      }
    } catch (error) {
      if (epoch === this.epoch && !controller.signal.aborted) {
        const reset2 = error instanceof ApiError && error.code === "LOG_RESET", encoding = error instanceof ApiError && error.code === "LOG_ENCODING_INVALID";
        this.setState((previous) => ({ ...previous, error: reset2 ? "\u65E5\u5FD7\u8EAB\u4EFD\u6216\u957F\u5EA6\u5DF2\u53D8\u5316\u3002\u5F53\u524D\u9875\u4E3A\u4E0A\u6B21\u8BFB\u53D6\uFF1B\u8BF7\u663E\u5F0F\u4ECE\u5934\u91CD\u65B0\u8BFB\u53D6\u3002" : encoding ? "\u65E5\u5FD7\u5305\u542B\u65E0\u6548 UTF-8\uFF0C\u5DF2\u6682\u505C\u8DDF\u968F\uFF1B\u8BF7\u4F7F\u7528\u539F\u59CB\u5F52\u6863\u4E0B\u8F7D\u6838\u5BF9\u3002" : error instanceof Error ? error.message : String(error), reset: reset2, ...reset2 || encoding ? { following: false } : {} }));
      }
    } finally {
      if (epoch === this.epoch) {
        this.pending = false;
        this.setState({ loading: false });
      }
    }
  }
  async follow() {
    if (this.pending) return;
    clearTimeout(this.catchup);
    const epoch = this.epoch;
    for (let count = 0; count < 3; count++) {
      const cursor = this.state.page?.cursor ?? 0, page = await this.load(cursor);
      if (epoch !== this.epoch || !this.state.following || !page || page.complete || page.cursor >= page.size || page.cursor === cursor) return;
    }
    if (epoch === this.epoch && this.state.following) this.catchup = setTimeout(() => void this.follow(), 50);
  }
  navigate(cursor) {
    this.invalidate();
    this.setState({ following: false, loading: false }, () => void this.load(cursor));
  }
  fromStart() {
    this.invalidate();
    this.starts = [0];
    this.setState({ page: null, following: false, loading: false, error: "", reset: false }, () => void this.load(0, true));
  }
  selectStream(stream) {
    this.invalidate();
    this.starts = [0];
    this.setState({ stream, page: null, following: true, loading: false, error: "", reset: false }, () => void this.follow());
  }
  render() {
    const s = this.state, p = s.page, previous = this.starts.filter((start) => start < (p?.start ?? 0)).pop();
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("label", { children: [
        this.props.streamLabel,
        /* @__PURE__ */ jsxs("select", { "aria-label": this.props.streamLabel, value: s.stream, onChange: (e) => this.selectStream(e.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "stdout", children: "\u6807\u51C6\u8F93\u51FA stdout" }),
          /* @__PURE__ */ jsx("option", { value: "stderr", children: "\u9519\u8BEF\u8F93\u51FA stderr" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6BCF\u9875\u6700\u591A 64 KiB\uFF1B\u53EA\u663E\u793A\u5F53\u524D\u7A97\u53E3\uFF0C\u4E0D\u4EE3\u8868\u5B8C\u6574\u65E5\u5FD7\u3002\u539F\u59CB\u5F52\u6863\u53EF\u5728\u4EA7\u7269\u4E2D\u4E0B\u8F7D\u3002" }),
      p ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u5B57\u8282\u8303\u56F4 [",
        p.start,
        ", ",
        p.cursor,
        ") / \u6700\u8FD1\u89C2\u5BDF\u5927\u5C0F ",
        p.size,
        p.start > 0 ? "\uFF1B\u524D\u6587\u672A\u5728\u5F53\u524D\u7A97\u53E3\u663E\u793A" : "",
        " \xB7 ",
        s.following ? "\u8DDF\u968F\u672B\u5C3E" : "\u56DE\u67E5\u6A21\u5F0F"
      ] }) : null,
      /* @__PURE__ */ jsx("pre", { className: "logs", "aria-label": `${s.stream} \u65E5\u5FD7`, children: p?.content || (s.loading ? "\u8BFB\u53D6\u65E5\u5FD7\u2026" : "\u6B64\u9875\u6682\u65E0\u5185\u5BB9\u3002") }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => this.fromStart(), children: s.reset ? "\u786E\u8BA4\u91CD\u7F6E\u5E76\u4ECE\u5934\u8BFB\u53D6" : "\u4ECE\u5934\u8BFB\u53D6" }),
        /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: s.loading || s.reset || previous === void 0, onClick: () => {
          if (previous !== void 0) this.navigate(previous);
        }, children: "\u4E0A\u4E00\u9875\u65E5\u5FD7" }),
        /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: s.loading || s.reset || !p || p.cursor >= p.size, onClick: () => this.navigate(p.cursor), children: "\u4E0B\u4E00\u9875\u65E5\u5FD7" }),
        /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: s.loading || s.reset, onClick: () => {
          this.invalidate();
          this.setState({ following: true, loading: false }, () => void this.follow());
        }, children: "\u7EE7\u7EED\u8DDF\u968F\u672B\u5C3E" }),
        s.following ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.setState({ following: false }), children: "\u6682\u505C\u8DDF\u968F" }) : null
      ] }),
      p && p.start > 0 && previous === void 0 ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u66F4\u65E9\u7684\u9875\u8D77\u70B9\u5DF2\u8D85\u51FA 128 \u9879\u56DE\u67E5\u8BB0\u5F55\uFF1B\u8BF7\u4ECE\u5934\u8BFB\u53D6\u3002\u539F\u59CB\u65E5\u5FD7\u672A\u88AB\u5220\u9664\u3002" }) : null,
      p && p.cursor < p.size && s.following ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B63\u5728\u8865\u8BFB\u540E\u7EED\u5185\u5BB9\uFF0C\u6BCF\u8F6E\u6700\u591A 3 \u9875\u540E\u8BA9\u51FA\uFF1B\u5C1A\u672A\u5230\u6700\u65B0\u8F93\u51FA\u3002" }) : null,
      p?.complete ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5F53\u524D\u9875\u5230\u8FBE\u5DF2\u7ED3\u675F\u65E5\u5FD7\u7684\u672B\u5C3E\uFF1B\u524D\u6587\u4ECD\u53EF\u7FFB\u9875\u56DE\u67E5\u3002" }) : p && p.cursor >= p.size ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5DF2\u5230\u5F53\u524D\u5199\u5165\u4F4D\u7F6E\uFF0C\u5C1A\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u4F5C\u4E1A\u5B8C\u6210\u3002" }) : null
    ] });
  }
}
export {
  LOG_PAGE_BYTES,
  LogView
};
