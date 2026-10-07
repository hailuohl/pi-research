import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, ApiError } from "./api.js";
import { Icon, SectionTitle, Modal } from "./ui.js";
class EnvironmentView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { data: null, loading: false, busy: false, error: "", message: "", editing: false, replacing: false, name: "", value: "", showValue: false, deleting: "" };
    this.disposed = false;
    this.epoch = 0;
  }
  componentDidMount() {
    void this.load();
  }
  componentWillUnmount() {
    this.disposed = true;
    this.epoch++;
    this.mutation = void 0;
    this.state.value = "";
  }
  safe(data) {
    return { version: data.version, scope: "local", variables: data.variables.map(({ name, hasValue }) => ({ name, hasValue })) };
  }
  async load() {
    if (this.state.busy) return;
    const epoch = ++this.epoch;
    this.setState({ loading: true, error: "" });
    try {
      const data = this.safe(await api("/settings/environment"));
      if (!this.disposed && epoch === this.epoch) this.setState({ data });
    } catch (error) {
      if (!this.disposed && epoch === this.epoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (!this.disposed && epoch === this.epoch) this.setState({ loading: false });
    }
  }
  edit(name = "") {
    if (this.state.busy) return;
    this.mutation = void 0;
    this.setState({ editing: true, replacing: !!name, name, value: "", showValue: false, error: "", message: "" });
  }
  close() {
    if (!this.state.busy) {
      this.mutation = void 0;
      this.setState({ editing: false, value: "", showValue: false, deleting: "", error: "" });
    }
  }
  async save(action) {
    if (this.state.busy || this.state.loading || !this.state.data) return;
    const name = action === "delete" ? this.state.deleting : this.state.name.trim();
    if (action === "set" && (!/^[A-Z_][A-Z0-9_]{0,127}$/.test(name) || !this.state.value)) {
      this.setState({ error: "\u8BF7\u8F93\u5165\u6709\u6548\u53D8\u91CF\u540D\u548C\u975E\u7A7A\u7684\u503C\u3002" });
      return;
    }
    if (action === "set" && !this.state.replacing && this.state.data.variables.some((row) => row.name === name)) {
      this.setState({ error: "\u53D8\u91CF\u5DF2\u5B58\u5728\uFF0C\u8BF7\u9009\u62E9\u201C\u66FF\u6362\u201D\u4FEE\u6539\u5B83\u7684\u503C\u3002" });
      return;
    }
    const request = { action, expectedVersion: this.state.data.version, name, ...action === "set" ? { value: this.state.value } : {} }, body = JSON.stringify(request);
    if (this.mutation?.body !== body) this.mutation = { body, key: crypto.randomUUID() };
    this.epoch++;
    this.setState({ busy: true, error: "", message: "" });
    try {
      const data = this.safe(await api("/settings/environment", request, "POST", void 0, this.mutation.key));
      this.mutation = void 0;
      if (!this.disposed) this.setState({ data, editing: false, deleting: "", value: "", showValue: false, message: action === "set" ? "\u53D8\u91CF\u5DF2\u4FDD\u5B58\uFF0C\u4F9B\u65B0\u542F\u52A8\u7684\u672C\u5730\u4EFB\u52A1\u4F7F\u7528\u3002" : "\u53D8\u91CF\u5DF2\u5220\u9664\uFF0C\u65B0\u542F\u52A8\u7684\u672C\u5730\u4EFB\u52A1\u4E0D\u518D\u4F7F\u7528\u5B83\u3002" });
    } catch (error) {
      if (!this.disposed) {
        if (error instanceof ApiError && error.code === "VERSION_CONFLICT") this.mutation = void 0;
        this.setState({ error: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      if (!this.disposed) this.setState({ busy: false });
    }
  }
  render() {
    const { data, loading, busy, error, message, editing, replacing, name, value, showValue, deleting } = this.state;
    return /* @__PURE__ */ jsxs("div", { className: "page-scroll environment-page", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u73AF\u5883", sub: "\u4E3A\u672C\u5730\u8FD0\u884C\u548C\u7814\u7A76\u667A\u80FD\u4F53\u8BBE\u7F6E\u53D8\u91CF\u3002", children: /* @__PURE__ */ jsxs("button", { className: "primary", disabled: !data || loading || busy, onClick: () => this.edit(), children: [
        /* @__PURE__ */ jsx(Icon, { name: "plus", size: 16 }),
        "\u6DFB\u52A0\u53D8\u91CF"
      ] }) }),
      /* @__PURE__ */ jsx("p", { className: "environment-description", children: "\u5728\u8FD9\u91CC\u4FDD\u5B58 API \u5BC6\u94A5\u3001\u8BBF\u95EE\u4EE4\u724C\u548C\u8FD0\u884C\u53C2\u6570\u3002\u65B0\u542F\u52A8\u7684\u672C\u5730\u4EFB\u52A1\u4F1A\u8BFB\u53D6\u5DF2\u4FDD\u5B58\u7684\u53D8\u91CF\u3002" }),
      /* @__PURE__ */ jsxs("section", { className: "environment-table-wrap surface", "aria-label": "\u73AF\u5883\u53D8\u91CF", children: [
        /* @__PURE__ */ jsxs("div", { className: "environment-table-toolbar", children: [
          /* @__PURE__ */ jsx("span", { children: data ? `${data.variables.length} \u4E2A\u53D8\u91CF` : "\u73AF\u5883\u53D8\u91CF" }),
          /* @__PURE__ */ jsx("button", { className: "text-button", disabled: loading || busy, onClick: () => void this.load(), children: loading ? "\u6B63\u5728\u8BFB\u53D6\u2026" : "\u5237\u65B0" })
        ] }),
        data ? /* @__PURE__ */ jsxs("table", { className: "environment-table", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { scope: "col", children: "\u53D8\u91CF\u540D" }),
            /* @__PURE__ */ jsx("th", { scope: "col", children: "\u503C" }),
            /* @__PURE__ */ jsx("th", { scope: "col", children: /* @__PURE__ */ jsx("span", { className: "sr-only", children: "\u64CD\u4F5C" }) })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.variables.length ? data.variables.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { scope: "row", children: /* @__PURE__ */ jsx("code", { children: row.name }) }),
            /* @__PURE__ */ jsxs("td", { children: [
              /* @__PURE__ */ jsx("span", { className: "environment-masked", "aria-label": "\u503C\u5DF2\u4FDD\u5B58\u5E76\u9690\u85CF", children: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }),
              /* @__PURE__ */ jsx("span", { className: "environment-set", children: "\u5DF2\u8BBE\u7F6E" })
            ] }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "actions", children: [
              /* @__PURE__ */ jsx("button", { className: "text-button", "aria-label": `\u66FF\u6362 ${row.name} \u7684\u503C`, disabled: busy || loading, onClick: () => this.edit(row.name), children: "\u66FF\u6362" }),
              /* @__PURE__ */ jsx("button", { className: "text-button", "aria-label": `\u5220\u9664 ${row.name}`, disabled: busy || loading, onClick: () => this.setState({ deleting: row.name, error: "", message: "" }), children: "\u5220\u9664" })
            ] }) })
          ] }, row.name)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 3, className: "environment-empty", children: [
            /* @__PURE__ */ jsx("strong", { children: "\u8FD8\u6CA1\u6709\u73AF\u5883\u53D8\u91CF" }),
            /* @__PURE__ */ jsx("p", { children: "\u6DFB\u52A0\u4E00\u4E2A\u53D8\u91CF\uFF0C\u8BA9\u672C\u5730\u4EFB\u52A1\u4F7F\u7528\u4F60\u7684 API \u5BC6\u94A5\u6216\u4EE4\u724C\u3002" }),
            /* @__PURE__ */ jsx("code", { children: "\u4F8B\u5982 HF_TOKEN\u3001WANDB_API_KEY\u3001MY_API_KEY" })
          ] }) }) })
        ] }) : /* @__PURE__ */ jsx("p", { className: "environment-empty", role: "status", children: loading ? "\u6B63\u5728\u8BFB\u53D6\u73AF\u5883\u53D8\u91CF\u2026" : "\u73AF\u5883\u53D8\u91CF\u5C1A\u672A\u52A0\u8F7D\uFF0C\u8BF7\u91CD\u8BD5\u3002" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted environment-note", children: "\u9002\u7528\u4E8E\u672C\u673A\u7814\u7A76\u667A\u80FD\u4F53\u3001\u5DF2\u6388\u6743\u7684\u672C\u673A\u547D\u4EE4\u548C\u672C\u5730\u8FD0\u884C\u3002\u4FDD\u5B58\u7684\u503C\u4E0D\u4F1A\u56DE\u663E\uFF1B\u4FEE\u6539\u503C\u65F6\u8BF7\u91CD\u65B0\u8F93\u5165\u3002\u6B63\u5728\u8FD0\u884C\u7684\u4EFB\u52A1\u7EE7\u7EED\u4F7F\u7528\u542F\u52A8\u65F6\u7684\u53D8\u91CF\u3002" }),
      error && !editing && !deleting ? /* @__PURE__ */ jsx("p", { className: "error-text", role: "alert", children: error }) : null,
      message ? /* @__PURE__ */ jsxs("p", { className: "environment-message", role: "status", children: [
        /* @__PURE__ */ jsx(Icon, { name: "check", size: 16 }),
        message
      ] }) : null,
      editing ? /* @__PURE__ */ jsxs(Modal, { title: replacing ? "\u66FF\u6362\u53D8\u91CF\u503C" : "\u6DFB\u52A0\u73AF\u5883\u53D8\u91CF", submitLabel: "\u4FDD\u5B58\u53D8\u91CF", busy, onClose: () => this.close(), onSubmit: () => void this.save("set"), children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u53D8\u91CF\u540D",
          /* @__PURE__ */ jsx("input", { name: "name", "aria-label": "\u53D8\u91CF\u540D", autoComplete: "off", spellCheck: false, required: true, pattern: "[A-Z_][A-Z0-9_]*", maxLength: 128, placeholder: "MY_API_KEY", readOnly: replacing, disabled: busy, value: name, onChange: (event) => this.setState({ name: event.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u53D8\u91CF\u503C",
          /* @__PURE__ */ jsx("input", { name: "value", "aria-label": "\u53D8\u91CF\u503C", type: showValue ? "text" : "password", autoComplete: "new-password", spellCheck: false, required: true, maxLength: 8192, disabled: busy, value, onChange: (event) => this.setState({ value: event.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "environment-show-value", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: showValue, disabled: busy, onChange: (event) => this.setState({ showValue: event.target.checked }) }),
          "\u663E\u793A\u672C\u6B21\u8F93\u5165\u7684\u503C"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u53D8\u91CF\u540D\u4F7F\u7528\u5927\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u548C\u4E0B\u5212\u7EBF\uFF1B\u4EE5\u5B57\u6BCD\u6216\u4E0B\u5212\u7EBF\u5F00\u5934\u3002\u7CFB\u7EDF\u8DEF\u5F84\u548C\u8FD0\u884C\u65F6\u63A7\u5236\u53D8\u91CF\u4E0D\u80FD\u5728\u8FD9\u91CC\u8986\u76D6\u3002" }),
        error ? /* @__PURE__ */ jsxs("p", { role: "alert", className: "error-text", children: [
          error,
          " \u5F53\u524D\u8F93\u5165\u4FDD\u7559\u3002"
        ] }) : null,
        error ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: loading || busy, onClick: () => void this.load(), children: "\u5237\u65B0\u53D8\u91CF\u5217\u8868\uFF0C\u4FDD\u7559\u8F93\u5165" }) : null
      ] }) : null,
      deleting ? /* @__PURE__ */ jsxs(Modal, { title: "\u5220\u9664\u73AF\u5883\u53D8\u91CF", submitLabel: "\u5220\u9664\u53D8\u91CF", busy, onClose: () => this.close(), onSubmit: () => void this.save("delete"), children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "\u5220\u9664 ",
          /* @__PURE__ */ jsx("strong", { children: /* @__PURE__ */ jsx("code", { children: deleting }) }),
          " \u540E\uFF0C\u65B0\u542F\u52A8\u7684\u672C\u5730\u4EFB\u52A1\u5C06\u4E0D\u518D\u4F7F\u7528\u5B83\u3002"
        ] }),
        error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: error }) : null
      ] }) : null
    ] });
  }
}
export {
  EnvironmentView
};
