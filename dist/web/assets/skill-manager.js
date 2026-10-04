import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { nativeSelectButton } from "./ui.js";
import { api } from "./api.js";
import { label } from "./models.js";
const call = (projectId, name, input = {}) => api(`/operations/${name}`, { projectId, input });
const words = (value) => value.split(/[\s,，]+/).filter(Boolean);
const roles = ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
async function skillFileBase64(file) {
  if (file.size > 2 * 1024 * 1024) throw Error("\u5355\u4E2A\u4E0A\u4F20\u6587\u4EF6\u4E0D\u80FD\u8D85\u8FC7 2 MiB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
class SkillImport extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { packageId: "", revisionTag: "", description: "", license: "", roles: ["coordinator"], tools: "", backends: "", artifactIds: "", files: [], error: "" };
    this.mounted = true;
    this.submitting = false;
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  async submit() {
    if (this.submitting || this.props.busy) return;
    this.submitting = true;
    this.setState({ error: "" });
    try {
      const s = this.state;
      if (!s.files.length || s.files.length > 64) throw Error("\u8BF7\u9009\u62E9 1\u201364 \u4E2A\u6587\u672C\u6587\u4EF6\uFF0C\u6216\u5355\u4E2A\u542B\u9759\u6001 PNG \u7684 ZIP");
      if (s.files.reduce((n, f) => n + f.size, 0) > 2 * 1024 * 1024) throw Error("\u4E0A\u4F20\u603B\u91CF\u4E0D\u80FD\u8D85\u8FC7 2 MiB");
      const zip = s.files.some((f) => /\.zip$/i.test(f.name));
      if (zip && s.files.length !== 1) throw Error("ZIP \u5FC5\u987B\u5355\u72EC\u4E0A\u4F20");
      const payload = zip ? { zipBase64: await skillFileBase64(s.files[0]) } : { files: await Promise.all(s.files.map(async (file) => ({ path: file.name, contentBase64: await skillFileBase64(file) }))) };
      if (this.mounted) await this.props.submit({ packageId: s.packageId, revisionTag: s.revisionTag, description: s.description, roles: s.roles, license: s.license.trim() || null, requirements: { tools: words(s.tools), backends: words(s.backends), artifactIds: words(s.artifactIds) }, ...payload });
    } catch (e) {
      if (this.mounted) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      this.submitting = false;
    }
  }
  render() {
    const s = this.state;
    return /* @__PURE__ */ jsxs("details", { children: [
      /* @__PURE__ */ jsx("summary", { children: "\u5BFC\u5165\u5F85\u5BA1\u6280\u80FD\u7248\u672C" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        void this.submit();
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "integration-controls", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u5305 ID",
            /* @__PURE__ */ jsx("input", { required: true, maxLength: 100, value: s.packageId, onChange: (e) => this.setState({ packageId: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u7248\u672C\u6807\u7B7E",
            /* @__PURE__ */ jsx("input", { required: true, maxLength: 100, value: s.revisionTag, onChange: (e) => this.setState({ revisionTag: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u63CF\u8FF0",
          /* @__PURE__ */ jsx("input", { required: true, maxLength: 2e3, value: s.description, onChange: (e) => this.setState({ description: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u8BB8\u53EF\u8BC1\u58F0\u660E\uFF08\u7A7A\u767D\u8868\u793A\u672A\u77E5\uFF09",
          /* @__PURE__ */ jsx("input", { value: s.license, maxLength: 500, onChange: (e) => this.setState({ license: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("fieldset", { children: [
          /* @__PURE__ */ jsx("legend", { children: "\u9002\u7528\u89D2\u8272" }),
          /* @__PURE__ */ jsx("div", { className: "connector-switches", children: roles.map((role) => /* @__PURE__ */ jsxs("label", { children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.roles.includes(role), onChange: (e) => this.setState({ roles: e.target.checked ? [...s.roles, role] : s.roles.filter((r) => r !== role) }) }),
            label(role)
          ] }, role)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "integration-controls", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u5FC5\u9700\u5DE5\u5177\uFF08\u7A7A\u683C\u6216\u9017\u53F7\u5206\u9694\uFF09",
            /* @__PURE__ */ jsx("input", { value: s.tools, onChange: (e) => this.setState({ tools: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u5FC5\u9700\u540E\u7AEF",
            /* @__PURE__ */ jsx("input", { value: s.backends, onChange: (e) => this.setState({ backends: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u5FC5\u9700\u6570\u636E artifact ID",
            /* @__PURE__ */ jsx("input", { value: s.artifactIds, onChange: (e) => this.setState({ artifactIds: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u9009\u62E9 SKILL.md \u548C\u6587\u672C\u8D44\u6E90\uFF0C\u6216\u542B assets/*.png \u7684\u53D7\u9650 ZIP",
          /* @__PURE__ */ jsx("input", { type: "file", multiple: true, disabled: this.props.busy, onChange: (e) => this.setState({ files: Array.from(e.target.files ?? []) }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6700\u591A64\u4E2A\u6587\u4EF6\uFF0C\u6BCF\u4EFD\u6587\u672C\u6216\u9759\u6001 PNG \u6700\u591A128 KiB\uFF0C\u603B\u91CF\u53CA ZIP \u6700\u591A2 MiB\u3002\u666E\u901A\u591A\u9009\u4FDD\u7559\u6587\u4EF6\u540D\uFF1B\u5D4C\u5957\u8D44\u6E90\u8BF7\u7528 ZIP\u3002\u8D44\u6E90\u53EA\u4FDD\u5B58\u548C\u4E0B\u8F7D\uFF0C\u4E0D\u8FD0\u884C\u811A\u672C\u3002" }),
        s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
        /* @__PURE__ */ jsx("button", { className: "primary", disabled: this.props.busy || !s.files.length || !s.roles.length, children: "\u5BFC\u5165\u4E3A\u5F85\u5BA1\u7248\u672C" })
      ] })
    ] });
  }
}
class SkillSession extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { result: null, selected: [], builtin: [], busy: false, error: "" };
    this.mounted = true;
    this.epoch = 0;
  }
  componentDidMount() {
    void this.load();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
  }
  componentDidUpdate(prev) {
    if (prev.projectId !== this.props.projectId || prev.sessionId !== this.props.sessionId) {
      this.epoch++;
      this.setState({ result: null, selected: [], busy: false, error: "" });
      void this.load();
    }
  }
  async load(save = false) {
    if (!this.props.sessionId) return;
    const epoch = ++this.epoch, sessionId = this.props.sessionId, projectId = this.props.projectId, input = save ? { sessionId, expectedVersion: this.state.result.version, skillIds: this.state.selected } : { sessionId };
    this.setState({ busy: true, error: "", result: null });
    try {
      const [result, builtin] = await Promise.all([call(projectId, save ? "skill_session_select" : "skill_preflight", input), api("/skills")]);
      if (this.mounted && epoch === this.epoch) this.setState({ result, selected: result.skillIds, builtin: builtin.skills.map((skill) => skill.id) });
    } catch (e) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.mounted && epoch === this.epoch) this.setState({ busy: false });
    }
  }
  render() {
    const s = this.state, ids = Array.from(/* @__PURE__ */ new Set([...s.builtin, ...(this.props.catalog?.revisions ?? []).filter((item) => this.props.catalog.configuration.revisionIds.includes(item.revision.id)).map((item) => item.revision.packageId), ...s.selected]));
    return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
      /* @__PURE__ */ jsx("h3", { children: "\u5F53\u524D\u4F1A\u8BDD\u663E\u5F0F\u6280\u80FD\u9009\u62E9" }),
      !this.props.sessionId ? /* @__PURE__ */ jsx("p", { children: "\u5148\u5728\u7814\u7A76\u4F1A\u8BDD\u4E2D\u521B\u5EFA\u6216\u9009\u62E9\u4F1A\u8BDD\uFF0C\u518D\u9009\u62E9\u672C\u6B21\u4EFB\u52A1\u5FC5\u9700\u6280\u80FD\u3002" }) : /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
          "\u4F1A\u8BDD ",
          this.props.sessionId,
          " \xB7 \u56FA\u5B9A Bundle ",
          s.result?.skillBundleId ?? "\u672A\u7ED1\u5B9A"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9879\u76EE\u914D\u7F6E\u5347\u7EA7\u4E0D\u4F1A\u6539\u53D8\u6B64\u4F1A\u8BDD\u7684\u56FA\u5B9A Bundle \u6216\u5386\u53F2\u4EFB\u52A1\u7ED1\u5B9A\u3002\u53EA\u68C0\u67E5\u663E\u5F0F\u9009\u7528\u7684\u6280\u80FD\uFF1B\u672A\u9009\u62E9\u7684\u76EE\u5F55\u9879\u4E0D\u4F1A\u963B\u6B62\u542F\u52A8\u3002\u5DF2\u5F00\u59CB\u539F\u751F Pi \u7684\u4F1A\u8BDD\u4E0D\u80FD\u6539\u7ED1\uFF0C\u8BF7\u65B0\u5EFA\u4F1A\u8BDD\u3002\u4FDD\u5B58\u9009\u62E9\u4E0D\u4F1A\u542F\u52A8\u6A21\u578B\u3002" }),
        /* @__PURE__ */ jsx("div", { className: "connector-switches", children: ids.map((id) => /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.selected.includes(id), disabled: s.busy || !s.result, onChange: (e) => this.setState({ selected: e.target.checked ? [...s.selected, id] : s.selected.filter((x) => x !== id) }) }),
          id
        ] }, id)) }),
        /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          /* @__PURE__ */ jsx("button", { className: "primary", disabled: s.busy || !s.result, onClick: () => this.load(true), children: "\u4FDD\u5B58\u663E\u5F0F\u9009\u62E9\u5E76\u9884\u68C0" }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy, onClick: () => this.load(), children: "\u5237\u65B0\u5DF2\u4FDD\u5B58\u9009\u62E9\u7684\u9884\u68C0" })
        ] }),
        s.busy ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u6838\u5BF9\u4F1A\u8BDD\u7ED1\u5B9A\u4E0E\u80FD\u529B\u2026" }) : null,
        s.result ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { role: "status", children: [
            "\u5DF2\u4FDD\u5B58\u9009\u62E9\uFF1A",
            s.result.skillIds.join("\u3001") || "\u65E0",
            " \xB7 ",
            s.result.ready ? "\u672C\u6B21\u9884\u68C0\u901A\u8FC7\uFF1B\u542F\u52A8\u65F6\u4ECD\u4F1A\u91CD\u65B0\u6838\u5BF9" : "\u542F\u52A8\u88AB\u963B\u6B62"
          ] }),
          s.result.missing.map((item, i) => /* @__PURE__ */ jsxs("p", { className: "inline-warning code-wrap", children: [
            item.skillId,
            " \xB7 ",
            item.kind,
            " \xB7 ",
            item.value,
            "\uFF1A",
            item.reason
          ] }, i))
        ] }) : null
      ] }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null
    ] });
  }
}
class SkillManager extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { catalog: null, selected: null, content: null, enabled: [], builtinBundleId: "", note: "", busy: false, reading: false, error: "", notice: "" };
    this.mounted = true;
    this.epoch = 0;
    this.readEpoch = 0;
    this.locked = false;
  }
  componentDidMount() {
    void this.refresh();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    this.readEpoch++;
  }
  componentDidUpdate(prev) {
    if (prev.projectId !== this.props.projectId) {
      this.epoch++;
      this.readEpoch++;
      this.locked = false;
      this.setState({ catalog: null, selected: null, content: null, enabled: [], builtinBundleId: "", busy: false, reading: false, error: "", notice: "" });
      void this.refresh();
    }
  }
  current(epoch) {
    return this.mounted && epoch === this.epoch;
  }
  async refresh() {
    await this.run(async (epoch) => {
      const catalog = await call(this.props.projectId, "skill_package_list");
      if (this.current(epoch)) this.setState({ catalog, enabled: catalog.configuration.revisionIds, builtinBundleId: catalog.configuration.builtinBundleId });
    });
  }
  async run(fn, notice = "") {
    if (this.locked) return;
    this.locked = true;
    const epoch = this.epoch;
    this.setState({ busy: true, error: "", notice: "" });
    try {
      await fn(epoch);
      if (this.current(epoch) && notice) this.setState({ notice });
    } catch (e) {
      if (this.current(epoch)) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.current(epoch)) {
        this.locked = false;
        this.setState({ busy: false });
      }
    }
  }
  async inspect(revisionId) {
    const request = ++this.readEpoch, epoch = this.epoch;
    this.setState({ selected: null, content: null, note: "", reading: true, error: "" });
    try {
      const selected = await call(this.props.projectId, "skill_package_inspect", { revisionId });
      if (this.current(epoch) && request === this.readEpoch) this.setState({ selected });
    } catch (e) {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ reading: false });
    }
  }
  async read(resource) {
    const revisionId = this.state.selected?.revision.id;
    if (!revisionId) return;
    const request = ++this.readEpoch, epoch = this.epoch;
    this.setState({ content: null, reading: true, error: "" });
    try {
      const content = await call(this.props.projectId, "skill_package_read", { revisionId, resource });
      if (this.current(epoch) && request === this.readEpoch) this.setState({ content });
    } catch (e) {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ reading: false });
    }
  }
  async downloadBinary() {
    const content = this.state.content, selected = this.state.selected, epoch = this.epoch, request = this.readEpoch;
    if (!content || !("contentBase64" in content) || !selected) return;
    try {
      const raw = atob(content.contentBase64), bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0)), file = selected.revision.files.find((f) => f.path === content.resource);
      if (!file || bytes.length !== file.size) throw Error("\u56FA\u5B9A\u8D44\u6E90\u957F\u5EA6\u4E0D\u5339\u914D");
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((n) => n.toString(16).padStart(2, "0")).join("");
      if (hash !== content.digest || hash !== file.digest) throw Error("\u56FA\u5B9A\u8D44\u6E90\u6458\u8981\u4E0D\u5339\u914D");
      if (!this.current(epoch) || request !== this.readEpoch) return;
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" })), a = document.createElement("a");
      a.href = url;
      a.download = content.resource.split("/").pop() ?? "resource.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    } catch (error) {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  async mutate(name, input, notice) {
    await this.run(async (epoch) => {
      const projectId = this.props.projectId;
      await call(projectId, name, input);
      const catalog = await call(projectId, "skill_package_list");
      if (this.current(epoch)) {
        const id = this.state.selected?.revision.id;
        this.setState({ catalog, enabled: catalog.configuration.revisionIds, builtinBundleId: catalog.configuration.builtinBundleId, selected: catalog.revisions.find((item) => item.revision.id === id) ?? null });
      }
    }, notice);
  }
  render() {
    const s = this.state, selected = s.selected, r = selected?.revision;
    return /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u6280\u80FD\u7248\u672C\u4E0E\u542F\u52A8\u9884\u68C0" }),
        /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy, onClick: () => this.refresh(), children: "\u5237\u65B0\u6280\u80FD\u72B6\u6001" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5BA1\u9605\u53EA\u6279\u51C6\u6587\u672C\u52A0\u8F7D\u53CA\u9759\u6001\u8D44\u6E90\u4FDD\u5B58\uFF1B\u58F0\u660E\u9700\u6C42\u4E0D\u4F1A\u6388\u4E88\u5DE5\u5177\u3001\u6570\u636E\u3001\u811A\u672C\u6267\u884C\u6216\u8BA1\u7B97\u6743\u9650\u3002\u672A\u77E5\u8BB8\u53EF\u8BC1\u4E0D\u4EE3\u8868\u83B7\u5F97\u518D\u5206\u53D1\u8BB8\u53EF\u3002\u56FE\u5F62\u4E0E\u8BBA\u6587\u6267\u884C\u80FD\u529B\u987B\u5206\u522B\u9884\u68C0\uFF0C\u76EE\u5F55\u5C55\u793A\u4E0D\u4EE3\u8868\u6267\u884C\u5668\u5DF2\u5B9E\u73B0\u3002" }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      s.notice ? /* @__PURE__ */ jsx("p", { role: "status", children: s.notice }) : null,
      s.busy ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u4FDD\u5B58\u6216\u8BFB\u53D6\u6743\u5A01\u72B6\u6001\u2026" }) : null,
      /* @__PURE__ */ jsx(SkillImport, { busy: s.busy, submit: (input) => this.mutate("skill_package_import", input, "\u5DF2\u5BFC\u5165\u5F85\u5BA1\u7248\u672C\uFF1B\u5C1A\u672A\u542F\u7528\u3002") }, this.props.projectId),
      /* @__PURE__ */ jsx("h3", { children: "\u56FA\u5B9A\u7248\u672C\u76EE\u5F55 / \u914D\u7F6E\u6307\u9488" }),
      /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
        "\u5F53\u524D Bundle ",
        s.catalog?.configuration.bundleId ?? "\u8BFB\u53D6\u4E2D",
        " \xB7 \u914D\u7F6E\u7248\u672C ",
        s.catalog?.configuration.version ?? "\u2014"
      ] }),
      s.catalog ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
          "\u5F53\u524D\u5185\u7F6E\u57FA\u7EBF ",
          s.catalog.configuration.builtinBundleId,
          " \xB7 \u53EF\u9009\u53D1\u884C\u7248\u672C ",
          s.catalog.builtinReleases.length,
          " \u4E2A"
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u65B0\u7ED1\u5B9A\u4F7F\u7528\u7684\u5185\u7F6E\u53D1\u884C\u7248\u672C",
          /* @__PURE__ */ jsxs("select", { value: s.builtinBundleId, disabled: s.busy, onChange: (e) => this.setState({ builtinBundleId: e.target.value }), children: [
            nativeSelectButton,
            s.catalog.builtinReleases.map((release) => /* @__PURE__ */ jsxs("option", { value: release.bundleId, children: [
              release.bundleId,
              " \xB7 ",
              release.skillCount,
              " \u4E2A\u6280\u80FD",
              release.current ? " \xB7 \u5F53\u524D\u53D1\u884C" : "",
              release.bundleId === s.catalog.configuration.builtinBundleId ? " \xB7 \u5DF2\u914D\u7F6E\u57FA\u7EBF" : ""
            ] }, release.bundleId))
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9009\u62E9\u53D1\u884C\u7248\u672C\u540E\u4FDD\u5B58\u624D\u4F1A\u5207\u6362\uFF0C\u4EC5\u5F71\u54CD\u540E\u7EED\u65B0\u7ED1\u5B9A\uFF1B\u5DF2\u7ED1\u5B9A\u4F1A\u8BDD\u53CA\u5386\u53F2\u4EFB\u52A1\u4FDD\u7559\u539F Bundle ID\uFF0C\u5E76\u6309\u539F\u7248\u672C\u9884\u68C0\u3002\u672A\u914D\u7F6E\u9879\u76EE\u7684\u65B0\u7ED1\u5B9A\u9ED8\u8BA4\u4F7F\u7528\u5F53\u524D\u53D1\u884C\u3002\u81EA\u5B9A\u4E49\u4FEE\u8BA2\u4FDD\u6301\u52FE\u9009\uFF0C\u5347\u7EA7\u5185\u7F6E\u7248\u672C\u987B\u5728\u6B64\u663E\u5F0F\u9009\u62E9\u3002" })
      ] }) : null,
      !s.catalog ? /* @__PURE__ */ jsx("p", { children: "\u5C1A\u672A\u53D6\u5F97\u6280\u80FD\u72B6\u6001\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002" }) : !s.catalog.revisions.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5C1A\u65E0\u5BFC\u5165\u7684\u6280\u80FD\u7248\u672C\u3002" }) : /* @__PURE__ */ jsx("div", { className: "run-selection", children: s.catalog.revisions.map((item) => {
        const revision = item.revision, approved = item.reviews[item.reviews.length - 1]?.decision === "approved", revoked = item.revocations.length > 0;
        return /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `\u914D\u7F6E\u542F\u7528 ${revision.packageId} ${revision.revisionTag}`, disabled: s.busy || !s.enabled.includes(revision.id) && (!approved || revoked), checked: s.enabled.includes(revision.id), onChange: (e) => this.setState({ enabled: e.target.checked ? [...s.enabled, revision.id] : s.enabled.filter((id) => id !== revision.id) }) }),
            " ",
            revision.packageId,
            " / ",
            revision.revisionTag,
            " \xB7 ",
            revoked ? "\u5DF2\u64A4\u9500" : approved ? "\u5BA1\u9605\u901A\u8FC7" : item.reviews.length ? "\u5BA1\u9605\u672A\u901A\u8FC7" : "\u5F85\u5BA1"
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "text-button code-wrap", onClick: () => this.inspect(revision.id), children: [
            "\u5BA1\u9605\u539F\u6587\u4E0E\u8D44\u6E90 \xB7 ",
            revision.id
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: revision.description }),
          /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
            "\u5FC5\u9700\u5DE5\u5177\uFF1A",
            revision.requirements.tools.join(", ") || "\u65E0",
            "\uFF1B\u540E\u7AEF\uFF1A",
            revision.requirements.backends.join(", ") || "\u65E0",
            "\uFF1B\u6570\u636E\uFF1A",
            revision.requirements.artifactIds.join(", ") || "\u65E0",
            "\u3002\u8BB8\u53EF\u8BC1\uFF1A",
            revision.license ?? "\u672A\u77E5"
          ] })
        ] }, revision.id);
      }) }),
      /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy || !s.catalog, onClick: () => this.mutate("skill_bundle_configure", { expectedVersion: s.catalog.configuration.version, revisionIds: s.enabled, builtinBundleId: s.builtinBundleId }, "\u5DF2\u5207\u6362\u56FA\u5B9A\u914D\u7F6E\uFF1B\u4EC5\u5F71\u54CD\u540E\u7EED\u65B0\u7ED1\u5B9A\uFF0C\u5DF2\u6709\u4F1A\u8BDD\u53CA\u5386\u53F2\u4EFB\u52A1\u4FDD\u7559\u539F ID\u3002"), children: "\u4FDD\u5B58\u542F\u7528 / \u56DE\u6EDA\u5230\u6240\u9009\u7248\u672C" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u56DE\u6EDA\u65F6\u53D6\u6D88\u65B0\u7248\u5E76\u52FE\u9009\u5DF2\u6279\u51C6\u65E7\u7248\uFF1B\u540C\u4E00\u5305\u53EA\u9009\u4E00\u4E2A\u7248\u672C\u3002\u542F\u7528\u4E0D\u7B49\u4E8E\u4EFB\u52A1\u5FC5\u9700\uFF0C\u987B\u5728\u4F1A\u8BDD\u4E2D\u663E\u5F0F\u9009\u62E9\u3002" }),
      s.reading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u8BFB\u53D6\u56FA\u5B9A\u7248\u672C\u2026" }) : null,
      r && selected ? /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          r.packageId,
          " / ",
          r.revisionTag
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
          "Revision ",
          r.id,
          /* @__PURE__ */ jsx("br", {}),
          "SHA-256 ",
          r.contentDigest,
          /* @__PURE__ */ jsx("br", {}),
          "\u89D2\u8272 ",
          r.roles.map(label).join("\u3001"),
          " \xB7 \u8BB8\u53EF\u8BC1 ",
          r.license ?? "\u672A\u77E5"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "actions wrap", children: r.files.map((file) => /* @__PURE__ */ jsxs("button", { className: "secondary compact code-wrap", onClick: () => this.read(file.path), children: [
          file.path,
          " \xB7 ",
          file.size,
          " B",
          file.mediaType === "image/png" ? " \xB7 \u9759\u6001 PNG" : ""
        ] }, file.path)) }),
        s.content ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
            s.content.resource,
            " \xB7 SHA-256 ",
            s.content.digest
          ] }),
          "contentBase64" in s.content ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u56FA\u5B9A PNG \u4EC5\u6309\u539F\u5B57\u8282\u4E0B\u8F7D\uFF1B\u4E0D\u4F1A\u52A0\u8F7D\u5230\u6A21\u578B\u4E0A\u4E0B\u6587\u6216\u5728\u6B64\u6267\u884C\u3002" }),
            /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => void this.downloadBinary(), children: "\u4E0B\u8F7D\u56FA\u5B9A PNG" })
          ] }) : /* @__PURE__ */ jsx("pre", { className: "integration-content", children: s.content.content })
        ] }) : null,
        /* @__PURE__ */ jsxs("label", { children: [
          "\u5BA1\u9605 / \u64A4\u9500\u7406\u7531",
          /* @__PURE__ */ jsx("textarea", { value: s.note, maxLength: 4e3, onChange: (e) => this.setState({ note: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          /* @__PURE__ */ jsx("button", { className: "primary", disabled: s.busy || !s.note.trim() || !!selected.revocations.length, onClick: () => this.mutate("skill_package_review", { revisionId: r.id, decision: "approved", note: s.note }, "\u5BA1\u9605\u51B3\u5B9A\u5DF2\u4FDD\u5B58\uFF1B\u4ECD\u9700\u663E\u5F0F\u542F\u7528\u3002"), children: "\u6279\u51C6\u6B64\u56FA\u5B9A\u7248\u672C" }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy || !s.note.trim() || !!selected.revocations.length, onClick: () => this.mutate("skill_package_review", { revisionId: r.id, decision: "rejected", note: s.note }, "\u62D2\u7EDD\u51B3\u5B9A\u5DF2\u4FDD\u5B58\u3002"), children: "\u62D2\u7EDD" }),
          /* @__PURE__ */ jsx("button", { className: "danger-outline", disabled: s.busy || !s.note.trim() || !!selected.revocations.length, onClick: () => this.mutate("skill_package_revoke", { revisionId: r.id, note: s.note }, "\u7248\u672C\u5DF2\u64A4\u9500\uFF1B\u5386\u53F2\u539F\u6587\u4E0E\u51B3\u5B9A\u4FDD\u7559\u3002"), children: "\u64A4\u9500\u6B64\u7248\u672C" })
        ] }),
        selected.reviews.map((review) => /* @__PURE__ */ jsxs("p", { className: "small", children: [
          label(review.decision),
          " \xB7 ",
          review.note,
          " \xB7 ",
          review.contentDigest
        ] }, review.id)),
        selected.revocations.map((revoke) => /* @__PURE__ */ jsxs("p", { className: "small", children: [
          "\u64A4\u9500 \xB7 ",
          revoke.note
        ] }, revoke.id))
      ] }) : null,
      /* @__PURE__ */ jsx(SkillSession, { projectId: this.props.projectId, sessionId: this.props.sessionId, catalog: s.catalog })
    ] });
  }
}
export {
  SkillManager,
  skillFileBase64
};
