import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon, nativeSelectButton } from "./ui.js";
import { short } from "./models.js";
function bytesBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
class TemplateLibraryView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { templates: [], selected: "", filePath: "", file: null, upload: null, title: "", mainFile: "main.tex", engine: "pdflatex", bibliography: "none", busy: false, error: "", message: "" };
    this.mounted = false;
    this.epoch = 0;
    this.input = null;
    this.uploadKey = crypto.randomUUID();
  }
  componentDidMount() {
    this.mounted = true;
    void this.load();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
  }
  async load() {
    try {
      const templates = await api("/publication-templates");
      if (this.mounted) this.setState({ templates });
    } catch (e) {
      if (this.mounted) this.setState({ error: String(e) });
    }
  }
  async select(id, path) {
    const epoch = ++this.epoch, t = this.state.templates.find((t2) => t2.id === id), filePath = path ?? t?.mainFile ?? "";
    this.setState({ selected: id, filePath, file: null, error: "" });
    if (!t || !filePath) return;
    try {
      const file = await api(`/publication-templates/${encodeURIComponent(id)}/files?path=${encodeURIComponent(filePath)}`);
      if (this.mounted && epoch === this.epoch) this.setState({ file });
    } catch (e) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: String(e) });
    }
  }
  async upload() {
    const s = this.state;
    if (!s.upload || s.busy) return;
    this.setState({ busy: true, error: "", message: "" });
    try {
      const zip = /\.zip$/i.test(s.upload.name);
      if (!zip && !/\.tex$/i.test(s.upload.name)) throw Error("\u8BF7\u9009\u62E9 .tex \u6216 ZIP \u6587\u4EF6");
      if (s.upload.size > (zip ? 17 : 2) * 1024 * 1024) throw Error(zip ? "ZIP \u6700\u591A 17 MiB\uFF1B\u5C55\u5F00\u5185\u5BB9\u6700\u591A 16 MiB" : "TeX \u6587\u4EF6\u6700\u591A 2 MiB");
      const contentBase64 = bytesBase64(new Uint8Array(await s.upload.arrayBuffer())), body = { title: s.title.trim(), engine: s.engine, mainFile: s.mainFile.trim(), bibliography: s.bibliography, ...zip ? { zipBase64: contentBase64 } : { files: [{ path: s.mainFile.trim(), contentBase64 }] } };
      const t = await api("/publication-templates", body, "POST", void 0, this.uploadKey);
      if (!this.mounted) return;
      this.uploadKey = crypto.randomUUID();
      if (this.input) this.input.value = "";
      this.setState((previous) => ({ templates: [...previous.templates.filter((row) => row.id !== t.id), t], upload: null, message: "\u5DF2\u4FDD\u5B58\u5230\u4E2A\u4EBA\u6A21\u677F\u5E93\uFF1B\u5404\u9879\u76EE\u53EF\u9009\u4F5C\u57FA\u7840\u6A21\u677F\u3002" }), () => void this.select(t.id));
    } catch (e) {
      if (this.mounted) this.setState({ error: String(e) });
    } finally {
      if (this.mounted) this.setState({ busy: false });
    }
  }
  render() {
    const s = this.state, t = s.templates.find((t2) => t2.id === s.selected), f = s.file;
    return /* @__PURE__ */ jsxs("section", { className: "surface settings-template-library", "aria-label": "\u4E2A\u4EBA\u6587\u7A3F\u6A21\u677F\u5E93", children: [
      /* @__PURE__ */ jsxs("header", { className: "settings-detail-heading", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "\u6587\u7A3F\u6A21\u677F\u5E93" }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8DE8\u9879\u76EE\u590D\u7528\u6587\u7A3F\u57FA\u7840\u6A21\u677F\uFF0C\u540C\u540D\u4E0A\u4F20\u4FDD\u7559\u4E3A\u65B0\u6A21\u677F\u3002" })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "settings-default-tag", children: [
          s.templates.length,
          " \u4E2A\u6A21\u677F"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("details", { className: "settings-disclosure settings-template-upload", children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          /* @__PURE__ */ jsx(Icon, { name: "plus", size: 15 }),
          "\u4E0A\u4F20\u6587\u7A3F\u6A21\u677F"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "settings-disclosure-body", children: [
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9009\u62E9 TeX \u6216 ZIP\uFF1BZIP \u9700\u6307\u5B9A\u5305\u5185\u771F\u5B9E\u4E3B\u6587\u4EF6\u8DEF\u5F84\u3002" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
            e.preventDefault();
            void this.upload();
          }, onChange: () => {
            if (!s.busy) this.uploadKey = crypto.randomUUID();
          }, children: [
            /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u6A21\u677F\u6587\u4EF6",
                /* @__PURE__ */ jsx("input", { ref: (node) => {
                  this.input = node;
                }, "aria-label": "\u4E0A\u4F20\u6587\u7A3F\u6A21\u677F\u6587\u4EF6", type: "file", accept: ".tex,.zip", required: true, disabled: s.busy, onChange: (e) => {
                  const upload = e.target.files?.[0] ?? null;
                  this.setState({ upload, title: upload?.name.replace(/\.(tex|zip)$/i, "") ?? "", message: "" });
                } })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "\u6A21\u677F\u540D\u79F0",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u6A21\u677F\u540D\u79F0", required: true, maxLength: 200, disabled: s.busy, value: s.title, onChange: (e) => this.setState({ title: e.target.value }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("details", { className: "settings-compile-options", children: [
              /* @__PURE__ */ jsx("summary", { children: "\u7F16\u8BD1\u8BBE\u7F6E" }),
              /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u6A21\u677F\u4E3B TeX \u6587\u4EF6",
                  /* @__PURE__ */ jsx("input", { "aria-label": "\u6A21\u677F\u4E3B TeX \u6587\u4EF6", required: true, maxLength: 240, disabled: s.busy, value: s.mainFile, onChange: (e) => this.setState({ mainFile: e.target.value }) })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u6A21\u677F\u7F16\u8BD1\u5F15\u64CE",
                  /* @__PURE__ */ jsxs("select", { "aria-label": "\u6A21\u677F\u7F16\u8BD1\u5F15\u64CE", disabled: s.busy, value: s.engine, onChange: (e) => this.setState({ engine: e.target.value }), children: [
                    nativeSelectButton,
                    ["pdflatex", "xelatex", "lualatex"].map((e) => /* @__PURE__ */ jsx("option", { value: e, children: e }, e))
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u6A21\u677F\u53C2\u8003\u6587\u732E\u7B56\u7565",
                  /* @__PURE__ */ jsxs("select", { "aria-label": "\u6A21\u677F\u53C2\u8003\u6587\u732E\u7B56\u7565", disabled: s.busy, value: s.bibliography, onChange: (e) => this.setState({ bibliography: e.target.value }), children: [
                    nativeSelectButton,
                    ["none", "auto", "bibtex", "biber"].map((b) => /* @__PURE__ */ jsx("option", { value: b, children: b }, b))
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5355\u4E2A TeX \u4F7F\u7528\u4E0A\u65B9\u4E3B\u6587\u4EF6\u8DEF\u5F84\uFF1BZIP \u4FDD\u7559\u5305\u5185\u76F8\u5BF9\u8DEF\u5F84\u3002\u6700\u591A 64 \u4E2A\u6587\u4EF6\u3001\u5C55\u5F00\u603B\u91CF 16 MiB\uFF0C\u6587\u672C\u6BCF\u4E2A 2 MiB\u3001PNG/JPG/PDF \u6BCF\u4E2A 8 MiB\u3002" })
            ] }),
            /* @__PURE__ */ jsx("button", { className: "primary", disabled: s.busy || !s.upload || !s.title.trim(), children: s.busy ? "\u6B63\u5728\u4FDD\u5B58\u6A21\u677F\u2026" : "\u4E0A\u4F20\u5E76\u4FDD\u5B58\u6A21\u677F" })
          ] })
        ] })
      ] }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text settings-feedback", children: s.error }) : null,
      s.message ? /* @__PURE__ */ jsx("p", { role: "status", className: "settings-feedback", children: s.message }) : null,
      /* @__PURE__ */ jsxs("div", { className: "settings-template-workspace", children: [
        /* @__PURE__ */ jsxs("nav", { className: "settings-template-list", "aria-label": "\u5DF2\u4FDD\u5B58\u6587\u7A3F\u6A21\u677F", children: [
          /* @__PURE__ */ jsx("div", { className: "settings-list-heading", children: /* @__PURE__ */ jsx("h3", { children: "\u5DF2\u6709\u6A21\u677F" }) }),
          s.templates.map((template) => /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": template.id === s.selected, onClick: () => void this.select(template.id), children: [
            /* @__PURE__ */ jsx(Icon, { name: "report", size: 17 }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: template.title }),
              /* @__PURE__ */ jsxs("small", { children: [
                template.builtin ? "\u5185\u7F6E\u6A21\u677F" : `\u4E2A\u4EBA\u6A21\u677F \xB7 ${short(template.id)}`,
                " \xB7 ",
                template.engine
              ] })
            ] }),
            /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 14 })
          ] }, template.id)),
          /* @__PURE__ */ jsxs("details", { className: "settings-all-models", children: [
            /* @__PURE__ */ jsx("summary", { children: "\u6309\u540D\u79F0\u9009\u62E9\u6A21\u677F" }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u5DF2\u6709\u6587\u7A3F\u6A21\u677F",
              /* @__PURE__ */ jsxs("select", { "aria-label": "\u67E5\u770B\u5DF2\u6709\u6587\u7A3F\u6A21\u677F", value: s.selected, onChange: (e) => void this.select(e.target.value), children: [
                nativeSelectButton,
                /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u6A21\u677F\u67E5\u770B" }),
                s.templates.map((t2) => /* @__PURE__ */ jsxs("option", { value: t2.id, children: [
                  t2.title,
                  " \xB7 ",
                  t2.builtin ? "\u5185\u7F6E" : short(t2.id)
                ] }, t2.id))
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "settings-template-preview", children: t ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "settings-preview-heading", children: [
            /* @__PURE__ */ jsx("h3", { children: t.title }),
            /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
              t.engine,
              " \xB7 \u4E3B\u6587\u4EF6 ",
              t.mainFile,
              " \xB7 \u53C2\u8003\u6587\u732E ",
              t.bibliography
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u67E5\u770B\u6A21\u677F\u6587\u4EF6",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u67E5\u770B\u6A21\u677F\u6587\u4EF6", value: s.filePath, onChange: (e) => void this.select(t.id, e.target.value), children: [
              nativeSelectButton,
              t.files.map((f2) => /* @__PURE__ */ jsx("option", { value: f2.path, children: f2.path }, f2.path))
            ] })
          ] }),
          f ? /* @__PURE__ */ jsx("div", { children: f.content !== void 0 ? /* @__PURE__ */ jsxs("label", { children: [
            "\u6A21\u677F\u6B63\u6587\uFF08\u53EA\u8BFB\uFF09",
            /* @__PURE__ */ jsx("textarea", { "aria-label": "\u6A21\u677F\u6B63\u6587\uFF08\u53EA\u8BFB\uFF09", readOnly: true, rows: 14, value: f.content })
          ] }) : /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u914D\u5957\u8D44\u4EA7 \xB7 ",
            f.size,
            " \u5B57\u8282"
          ] }) }) : /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6A21\u677F\u6587\u4EF6\u2026" }),
          /* @__PURE__ */ jsxs("details", { className: "settings-all-models", children: [
            /* @__PURE__ */ jsxs("summary", { children: [
              "\u6A21\u677F\u6587\u4EF6\u6E05\u5355 \xB7 ",
              t.files.length,
              " \u4E2A\u6587\u4EF6"
            ] }),
            /* @__PURE__ */ jsx("ul", { children: t.files.map((f2) => /* @__PURE__ */ jsxs("li", { children: [
              f2.path,
              " \xB7 ",
              f2.size,
              " \u5B57\u8282"
            ] }, f2.path)) })
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "settings-template-empty", children: [
          /* @__PURE__ */ jsx(Icon, { name: "report", size: 28 }),
          /* @__PURE__ */ jsx("h3", { children: "\u9009\u62E9\u6A21\u677F\u4EE5\u9884\u89C8" })
        ] }) })
      ] })
    ] });
  }
}
export {
  TemplateLibraryView
};
