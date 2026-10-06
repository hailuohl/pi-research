import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Icon } from "./ui.js";
import { api } from "./api.js";
import { label } from "./models.js";
const builtinNames = { overview: ["\u7814\u7A76\u5DE5\u4F5C\u6D41", "skills", "\u68B3\u7406\u7814\u7A76\u76EE\u6807\uFF0C\u5B89\u6392\u53EF\u8FFD\u6EAF\u7684\u7814\u7A76\u6B65\u9AA4\u3002"], create: ["\u7814\u7A76\u542F\u52A8", "plus", "\u5EFA\u7ACB\u9879\u76EE\uFF0C\u660E\u786E\u95EE\u9898\u4E0E\u4E0B\u4E00\u6B65\u8BA1\u5212\u3002"], "experiment-tree": ["\u5B9E\u9A8C\u4E0E\u8FD0\u884C", "experiment", "\u7EC4\u7EC7\u5B9E\u9A8C\u5206\u652F\uFF0C\u8BB0\u5F55\u8FD0\u884C\u4E0E\u7ED3\u679C\u3002"], git: ["\u4EE3\u7801\u4E0E\u7248\u672C", "branch", "\u7BA1\u7406\u4EE3\u7801\u53D8\u66F4\u4E0E\u7248\u672C\u8BB0\u5F55\u3002"], "agent-delegation": ["\u534F\u4F5C\u65B9\u6CD5", "network", "\u5212\u5206\u534F\u4F5C\u4EFB\u52A1\uFF0C\u6838\u5BF9\u4EA4\u63A5\u4E0E\u7ED3\u679C\u3002"], compute: ["\u8BA1\u7B97\u73AF\u5883", "cpu", "\u9009\u62E9\u8BA1\u7B97\u8D44\u6E90\uFF0C\u6838\u5BF9\u8FD0\u884C\u6761\u4EF6\u3002"], instances: ["\u8FDC\u7A0B\u5B9E\u4F8B", "resources", "\u8BC4\u4F30\u8FDC\u7A0B\u5B9E\u4F8B\u4E0E\u8FDE\u63A5\u9700\u6C42\u3002"], evidence: ["\u8BC1\u636E\u4E0E\u5F15\u7528", "evidence", "\u767B\u8BB0\u6765\u6E90\uFF0C\u5EFA\u7ACB\u53EF\u6838\u67E5\u7684\u8BC1\u636E\u94FE\u3002"], reports: ["\u62A5\u544A\u4E0E\u6210\u679C", "report", "\u6C47\u603B\u7814\u7A76\u7ED3\u679C\u4E0E\u4EA4\u4ED8\u6750\u6599\u3002"], figures: ["\u56FE\u8868\u4E0E\u53EF\u89C6\u5316", "report", "\u5236\u4F5C\u56FE\u8868\uFF0C\u68C0\u67E5\u53EF\u89C6\u5316\u8868\u8FBE\u3002"], paper: ["\u8BBA\u6587\u5199\u4F5C", "book-open", "\u7EC4\u7EC7\u8BBA\u6587\u7ED3\u6784\u3001\u8BBA\u8BC1\u4E0E\u5F15\u7528\u3002"], customize: ["\u6280\u80FD\u5B9A\u5236", "settings", "\u5BA1\u9605\u4E0E\u63A5\u5165\u53EF\u590D\u7528\u7684\u7814\u7A76\u65B9\u6CD5\u3002"], feedback: ["\u8BC4\u4EF7\u4E0E\u53CD\u9988", "chat", "\u8BB0\u5F55\u4EA7\u54C1\u95EE\u9898\u548C\u6539\u8FDB\u5EFA\u8BAE\u3002"], "lit-review": ["\u6587\u732E\u7814\u7A76", "search", "\u68C0\u7D22\u4E0E\u9605\u8BFB\u6587\u732E\uFF0C\u6574\u7406\u76F8\u5173\u5DE5\u4F5C\u3002"] };
const call = (projectId, name, input = {}, key) => api(`/operations/${name}`, { projectId, input }, "POST", void 0, key);
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
    this.state = { packageId: "", description: "", files: [], error: "" };
    this.mounted = true;
    this.submitting = false;
    this.key = "";
    this.draftEpoch = 0;
    this.form = React.createRef();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.draftEpoch++;
  }
  change(field, value) {
    this.key = "";
    this.draftEpoch++;
    this.setState({ [field]: value });
  }
  async choose(files) {
    const epoch = ++this.draftEpoch;
    this.key = "";
    this.setState({ files, error: "" });
    const original = files.find((file) => file.name === "SKILL.md");
    if (!original || original.size > 128 * 1024) return;
    try {
      const frontmatter = (await original.text()).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
      if (!frontmatter || !this.mounted || epoch !== this.draftEpoch) return;
      const hint = (field) => {
        const value = frontmatter.match(new RegExp(`^${field}:[ \\t]*(.+)$`, "m"))?.[1].trim() ?? "";
        return /^[>|](?:[+-]?[1-9]?|[1-9][+-]?)(?:\s+#.*)?$/.test(value) ? "" : value.replace(/^(['"])(.*)\1$/, "$2");
      };
      this.setState({ packageId: this.state.packageId || hint("name").slice(0, 100), description: this.state.description || hint("description").slice(0, 2e3) });
    } catch {
    }
  }
  async submit() {
    if (this.submitting || this.props.busy) return;
    const epoch = this.draftEpoch;
    this.submitting = true;
    this.setState({ error: "" });
    try {
      const s = this.state;
      if (!/^[a-z][a-z0-9-]{0,99}$/.test(s.packageId.trim())) throw Error("\u6280\u80FD\u540D\u79F0\u987B\u4EE5\u5C0F\u5199\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u542B\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u548C\u8FDE\u5B57\u7B26");
      if (!s.files.length || s.files.length > 64) throw Error("\u8BF7\u9009\u62E9 1\u201364 \u4E2A\u6587\u672C\u6587\u4EF6\uFF0C\u6216\u5355\u4E2A ZIP");
      if (s.files.reduce((n, f) => n + f.size, 0) > 2 * 1024 * 1024) throw Error("\u4E0A\u4F20\u603B\u91CF\u4E0D\u80FD\u8D85\u8FC7 2 MiB");
      const zip = s.files.some((f) => /\.zip$/i.test(f.name));
      if (zip && s.files.length !== 1) throw Error("ZIP \u5FC5\u987B\u5355\u72EC\u4E0A\u4F20");
      if (!this.key) this.key = crypto.randomUUID();
      const key = this.key;
      const payload = zip ? { zipBase64: await skillFileBase64(s.files[0]) } : { files: await Promise.all(s.files.map(async (file) => ({ path: file.name, contentBase64: await skillFileBase64(file) }))) };
      if (this.mounted && epoch === this.draftEpoch && await this.props.submit({ packageId: s.packageId.trim(), revisionTag: `upload-${key}`, description: s.description.trim() || "\u7528\u6237\u4E0A\u4F20\u7684\u7814\u7A76\u6280\u80FD", roles: ["coordinator"], license: null, requirements: { tools: [], backends: [], artifactIds: [] }, ...payload }, key) && this.mounted && epoch === this.draftEpoch) {
        this.key = "";
        this.draftEpoch++;
        this.form.current?.reset();
        this.setState({ packageId: "", description: "", files: [], error: "" });
      }
    } catch (e) {
      if (this.mounted && epoch === this.draftEpoch) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      this.submitting = false;
      if (this.mounted) this.setState({});
    }
  }
  render() {
    const s = this.state, busy = this.props.busy || this.submitting;
    return /* @__PURE__ */ jsx("div", { className: "skill-import-form", children: /* @__PURE__ */ jsxs("form", { ref: this.form, onSubmit: (e) => {
      e.preventDefault();
      void this.submit();
    }, children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "\u6280\u80FD\u6587\u4EF6",
        /* @__PURE__ */ jsx("input", { type: "file", multiple: true, disabled: busy, onChange: (e) => void this.choose(Array.from(e.target.files ?? [])) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9009\u62E9 SKILL.md \u548C\u6587\u672C\u8D44\u6E90\uFF0C\u6216 ZIP\u3002\u6700\u591A64\u4EFD\u6587\u4EF6\uFF0C\u5355\u4EFD\u6587\u672C\u6216\u9759\u6001 PNG \u6700\u591A128 KiB\uFF0C\u603B\u91CF\u53CA ZIP \u6700\u591A2 MiB\uFF1B\u5D4C\u5957\u8D44\u6E90\u7528 ZIP\u3002" }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u6280\u80FD\u540D\u79F0",
        /* @__PURE__ */ jsx("input", { required: true, pattern: "[a-z][a-z0-9-]{0,99}", title: "\u4EE5\u5C0F\u5199\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u542B\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u548C\u8FDE\u5B57\u7B26", maxLength: 100, disabled: busy, value: s.packageId, onChange: (e) => this.change("packageId", e.target.value), placeholder: "\u5982 research-method" })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u8BF4\u660E\uFF08\u53EF\u9009\uFF09",
        /* @__PURE__ */ jsx("input", { maxLength: 2e3, disabled: busy, value: s.description, onChange: (e) => this.change("description", e.target.value) })
      ] }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || !s.files.length, children: "\u4E0A\u4F20\u5E76\u5F00\u542F" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4E0A\u4F20\u540E\u81EA\u52A8\u5F00\u542F\uFF0C\u65B0\u4F1A\u8BDD\u53EF\u7528\uFF1B\u4E0D\u6267\u884C\u811A\u672C\u3002\u4E0D\u4F1A\u6388\u4E88\u5DE5\u5177\u3001\u6570\u636E\u6216\u8BA1\u7B97\u6743\u9650\u3002" })
    ] }) });
  }
}
class SkillManager extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { catalog: null, selected: null, content: null, builtinContent: null, builtinId: "", panel: null, query: "", enabled: [], busy: false, reading: false, error: "", notice: "" };
    this.mounted = true;
    this.epoch = 0;
    this.readEpoch = 0;
    this.catalogEpoch = 0;
    this.locked = false;
    this.dialog = React.createRef();
  }
  componentDidMount() {
    void this.refresh();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    this.readEpoch++;
    this.catalogEpoch++;
  }
  componentDidUpdate(prev) {
    if (prev.projectId !== this.props.projectId) {
      this.epoch++;
      this.readEpoch++;
      this.catalogEpoch++;
      this.locked = false;
      this.dialog.current?.close();
      this.setState({ catalog: null, selected: null, content: null, builtinContent: null, builtinId: "", panel: null, query: "", enabled: [], busy: false, reading: false, error: "", notice: "" });
      void this.refresh();
    } else if (prev.refreshToken !== this.props.refreshToken) void this.refresh(true);
  }
  openPanel(panel) {
    this.setState({ panel }, () => {
      if (this.dialog.current && !this.dialog.current.open) this.dialog.current.showModal();
    });
  }
  closePanel() {
    this.readEpoch++;
    this.dialog.current?.close();
    this.setState({ panel: null, selected: null, content: null, builtinContent: null, builtinId: "", reading: false });
  }
  current(epoch) {
    return this.mounted && epoch === this.epoch;
  }
  applyCatalog(catalog) {
    const id = this.state.selected?.revision.id, selected = catalog.revisions.find((item) => item.revision.id === id) ?? null;
    this.setState({ catalog, enabled: catalog.configuration.revisionIds, selected });
    if (id && !selected && this.state.panel === "detail") this.closePanel();
  }
  needsRestore(catalog) {
    return !this.props.readOnly && !!catalog.configuration.disabledBuiltinIds?.length;
  }
  async refresh(quiet = false, preserveMessages = false) {
    if (quiet) {
      if (this.locked) return;
      const epoch = this.epoch, request = ++this.catalogEpoch;
      try {
        const catalog = await call(this.props.projectId, "skill_package_list");
        if (this.current(epoch) && request === this.catalogEpoch && !this.locked) {
          if (this.needsRestore(catalog)) await this.refresh(false, true);
          else this.applyCatalog(catalog);
        }
      } catch {
      }
      return;
    }
    await this.run(async (epoch) => {
      const projectId = this.props.projectId;
      let catalog = await call(projectId, "skill_package_list");
      if (!this.current(epoch)) return;
      if (this.needsRestore(catalog)) {
        const c = catalog.configuration;
        try {
          await call(projectId, "skill_bundle_configure", { expectedVersion: c.version, revisionIds: c.revisionIds, builtinBundleId: c.builtinBundleId, disabledBuiltinIds: [] }, `skill-restore-${c.bundleId}-${c.version}`);
          if (!this.current(epoch)) return;
          catalog = await call(projectId, "skill_package_list");
        } catch (error) {
          if (this.current(epoch)) this.applyCatalog(catalog);
          throw error;
        }
      }
      if (this.current(epoch)) this.applyCatalog(catalog);
    }, "", preserveMessages);
  }
  async run(fn, notice = "", preserveMessages = false) {
    if (this.locked) return false;
    this.locked = true;
    this.catalogEpoch++;
    const epoch = this.epoch;
    this.setState((s) => ({ busy: true, error: preserveMessages ? s.error : "", notice: preserveMessages ? s.notice : "" }));
    try {
      await fn(epoch);
      if (!this.current(epoch)) return false;
      if (notice) this.setState({ notice });
      return true;
    } catch (e) {
      if (this.current(epoch)) this.setState({ error: e instanceof Error ? e.message : String(e) });
      return false;
    } finally {
      if (this.current(epoch)) {
        this.locked = false;
        this.setState({ busy: false });
      }
    }
  }
  async inspect(revisionId, readOriginal = false) {
    const request = ++this.readEpoch, epoch = this.epoch;
    this.setState({ selected: null, content: null, builtinContent: null, builtinId: "", reading: true, error: "" });
    try {
      const selected = await call(this.props.projectId, "skill_package_inspect", { revisionId });
      if (this.current(epoch) && request === this.readEpoch) {
        this.setState({ selected });
        if (readOriginal) await this.read("SKILL.md", revisionId);
      }
    } catch (e) {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ reading: false });
    }
  }
  async readBuiltin(id, resource) {
    const request = ++this.readEpoch, epoch = this.epoch, bundleId = this.state.catalog?.configuration.builtinBundleId;
    if (!bundleId) return;
    this.setState({ selected: null, content: null, builtinContent: null, builtinId: id, reading: true, error: "" });
    try {
      const query = new URLSearchParams({ bundleId });
      if (resource) query.set("resource", resource);
      const builtinContent = await api(`/skills/${encodeURIComponent(id)}?${query}`);
      if (this.current(epoch) && request === this.readEpoch) this.setState({ builtinContent });
    } catch (e) {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.current(epoch) && request === this.readEpoch) this.setState({ reading: false });
    }
  }
  async read(resource, revisionId = this.state.selected?.revision.id) {
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
  async mutate(name, input, notice, key) {
    if (this.props.readOnly) return false;
    return this.run(async (epoch) => {
      const projectId = this.props.projectId;
      await call(projectId, name, input, key);
      const catalog = await call(projectId, "skill_package_list");
      if (this.current(epoch)) this.applyCatalog(catalog);
    }, notice);
  }
  async upload(input, key) {
    const epoch = this.epoch, saved = await this.mutate("skill_package_upload", input, "\u6280\u80FD\u5DF2\u4E0A\u4F20\u5E76\u5F00\u542F\u3002", key);
    if (saved && this.current(epoch) && this.state.panel === "upload") this.closePanel();
    return saved;
  }
  async configure(revisionIds = this.state.enabled) {
    if (!this.state.catalog) return false;
    const c = this.state.catalog.configuration;
    return this.mutate("skill_bundle_configure", { expectedVersion: c.version, revisionIds, builtinBundleId: c.builtinBundleId, ...c.disabledBuiltinIds?.length ? { disabledBuiltinIds: [] } : {} }, "\u5DF2\u4FDD\u5B58\u6280\u80FD\u5F00\u5173\uFF1B\u5DF2\u6709\u4F1A\u8BDD\u53CA\u5386\u53F2\u4EFB\u52A1\u4FDD\u7559\u539F\u914D\u7F6E\u3002");
  }
  async enable(revisionId) {
    if (!this.state.catalog) return false;
    return this.mutate("skill_package_enable", { revisionId, expectedVersion: this.state.catalog.configuration.version }, "\u6280\u80FD\u5DF2\u5F00\u542F\uFF0C\u65B0\u4F1A\u8BDD\u53EF\u7528\u3002");
  }
  async remove(revisionId) {
    if (!this.state.catalog) return false;
    const epoch = this.epoch, saved = await this.mutate("skill_package_delete", { revisionId, expectedVersion: this.state.catalog.configuration.version }, "\u6280\u80FD\u5DF2\u5220\u9664\uFF1B\u5386\u53F2\u539F\u6587\u4E0E\u5DF2\u56FA\u5B9A\u4F1A\u8BDD\u4FDD\u7559\u3002");
    if (saved && this.current(epoch) && this.state.selected?.revision.id === revisionId) this.closePanel();
    return saved;
  }
  render() {
    const s = this.state, selected = s.selected, r = selected?.revision, builtin = s.catalog?.builtinSkills?.find((skill) => skill.id === s.builtinId), friendly = builtinNames[s.builtinId.replace(/^pi-research-/, "")], query = s.query.trim().toLocaleLowerCase(), matches = (value) => value.toLocaleLowerCase().includes(query), builtins = (s.catalog?.builtinSkills ?? []).filter((skill) => matches(`${skill.id} ${skill.description} ${builtinNames[skill.id.replace(/^pi-research-/, "")]?.join(" ") ?? ""}`)), revisions = (s.catalog?.revisions ?? []).filter((item) => matches(`${item.revision.packageId} ${item.revision.revisionTag} ${item.revision.description}`)), title = s.panel === "upload" ? "\u4E0A\u4F20\u6280\u80FD" : r ? r.packageId : friendly?.[0] ?? s.builtinId;
    return /* @__PURE__ */ jsxs("section", { className: "skill-manager-card", "aria-label": "\u6280\u80FD\u5E93", children: [
      /* @__PURE__ */ jsxs("div", { className: "skill-toolbar", children: [
        /* @__PURE__ */ jsxs("label", { className: "skill-search", children: [
          /* @__PURE__ */ jsx(Icon, { name: "search" }),
          /* @__PURE__ */ jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u6280\u80FD", value: s.query, onChange: (e) => this.setState({ query: e.target.value }), placeholder: "\u641C\u7D22\u540D\u79F0\u6216\u8BF4\u660E" })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "primary", disabled: this.props.readOnly, onClick: () => this.openPanel("upload"), children: [
          /* @__PURE__ */ jsx(Icon, { name: "plus" }),
          "\u4E0A\u4F20\u6280\u80FD"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "skill-library-meta", children: [
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5185\u7F6E\u6280\u80FD\u59CB\u7EC8\u7531\u7CFB\u7EDF\u63D0\u4F9B" }),
        /* @__PURE__ */ jsxs("span", { className: "small muted", children: [
          builtins.length + revisions.length,
          " \u4E2A\u6280\u80FD\u7248\u672C"
        ] })
      ] }),
      !s.panel && s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      !s.panel && s.notice ? /* @__PURE__ */ jsx("p", { role: "status", children: s.notice }) : null,
      !s.catalog ? /* @__PURE__ */ jsx("p", { role: "status", className: "inline-empty", children: "\u6B63\u5728\u8BFB\u53D6\u6280\u80FD\u5217\u8868\uFF0C\u72B6\u6001\u4F1A\u81EA\u52A8\u66F4\u65B0\u3002" }) : /* @__PURE__ */ jsxs("div", { className: "skill-catalog", children: [
        revisions.map((item) => {
          const revision = item.revision, enabled = s.enabled.includes(revision.id);
          return /* @__PURE__ */ jsxs("div", { className: "skill-revision-row", children: [
            /* @__PURE__ */ jsx(Icon, { name: "skills" }),
            /* @__PURE__ */ jsxs("div", { className: "skill-row-copy", children: [
              /* @__PURE__ */ jsxs("h3", { children: [
                /* @__PURE__ */ jsx("button", { className: "skill-name-button", "aria-label": `\u67E5\u770B\u6280\u80FD ${revision.packageId} ${revision.revisionTag}`, onClick: () => {
                  this.openPanel("detail");
                  void this.inspect(revision.id, true);
                }, children: revision.packageId }),
                /* @__PURE__ */ jsxs("span", { className: "small muted", children: [
                  revision.revisionTag.replace(/^upload-/, "").slice(0, 8),
                  " \xB7 \u4E0A\u4F20"
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "small muted skill-description", title: revision.description, children: revision.description })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "skill-switch", children: [
              /* @__PURE__ */ jsx("span", { children: enabled ? "\u5DF2\u5F00\u542F" : "\u5DF2\u5173\u95ED" }),
              /* @__PURE__ */ jsx("input", { className: "connector-toggle", role: "switch", type: "checkbox", "aria-label": `\u914D\u7F6E\u542F\u7528 ${revision.packageId} ${revision.revisionTag}`, disabled: this.props.readOnly || s.busy || !enabled && item.revocations.length > 0, checked: enabled, onChange: (e) => e.target.checked ? this.enable(revision.id) : this.configure(s.enabled.filter((id) => id !== revision.id)) })
            ] })
          ] }, revision.id);
        }),
        builtins.map((skill) => {
          const name = builtinNames[skill.id.replace(/^pi-research-/, "")];
          return /* @__PURE__ */ jsxs("div", { className: "builtin-skill-row", children: [
            /* @__PURE__ */ jsx(Icon, { name: name?.[1] ?? "skills" }),
            /* @__PURE__ */ jsxs("div", { className: "skill-row-copy", children: [
              /* @__PURE__ */ jsxs("h3", { children: [
                /* @__PURE__ */ jsx("button", { className: "skill-name-button", "aria-label": `\u67E5\u770B\u6280\u80FD ${name?.[0] ?? skill.id}`, onClick: () => {
                  this.openPanel("detail");
                  void this.readBuiltin(skill.id);
                }, children: name?.[0] ?? skill.id }),
                /* @__PURE__ */ jsx("span", { className: "skill-source small muted", children: "\u5185\u7F6E" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "small muted skill-description", title: name?.[2] ?? skill.description, children: name?.[2] ?? skill.description })
            ] })
          ] }, skill.id);
        }),
        !builtins.length && !revisions.length ? /* @__PURE__ */ jsx("p", { role: "status", className: "inline-empty", children: query ? "\u6CA1\u6709\u5339\u914D\u7684\u6280\u80FD\u3002\u5C1D\u8BD5\u5176\u4ED6\u540D\u79F0\u6216\u8BF4\u660E\u5173\u952E\u8BCD\u3002" : "\u5C1A\u65E0\u6280\u80FD\u3002\u4E0A\u4F20 SKILL.md \u6216 ZIP \u5F00\u59CB\u4F7F\u7528\u3002" }) : null
      ] }),
      /* @__PURE__ */ jsxs("dialog", { ref: this.dialog, className: "skill-dialog", "aria-labelledby": `skill-panel-title-${this.props.projectId}`, onCancel: (e) => {
        e.preventDefault();
        this.closePanel();
      }, children: [
        /* @__PURE__ */ jsxs("header", { className: "skill-dialog-heading", children: [
          /* @__PURE__ */ jsx("h2", { id: `skill-panel-title-${this.props.projectId}`, children: title || "\u6280\u80FD\u8BE6\u60C5" }),
          /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => this.closePanel(), "aria-label": "\u5173\u95ED\u6280\u80FD\u9762\u677F", children: "\u5173\u95ED" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "skill-dialog-body", children: [
          s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
          s.notice ? /* @__PURE__ */ jsx("p", { role: "status", children: s.notice }) : null,
          /* @__PURE__ */ jsx("div", { className: "skill-panel skill-upload-panel", hidden: s.panel !== "upload", children: /* @__PURE__ */ jsx(SkillImport, { busy: s.busy || !!this.props.readOnly, submit: (input, key) => this.upload(input, key) }, this.props.projectId) }),
          /* @__PURE__ */ jsxs("div", { className: "skill-panel skill-detail-panel", hidden: s.panel !== "detail", children: [
            s.reading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8BF4\u660E\u2026" }) : null,
            builtin ? /* @__PURE__ */ jsxs("div", { className: "skill-builtin-detail", children: [
              /* @__PURE__ */ jsx("p", { children: builtin.description }),
              builtin.resources.some((resource) => resource !== "SKILL.md") ? /* @__PURE__ */ jsxs("div", { className: "skill-resource-actions", children: [
                /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: s.reading, onClick: () => this.readBuiltin(builtin.id), children: "SKILL.md" }),
                builtin.resources.filter((resource) => resource !== "SKILL.md").map((resource) => /* @__PURE__ */ jsx("button", { className: "secondary compact code-wrap", disabled: s.reading, onClick: () => this.readBuiltin(builtin.id, resource), children: resource }, resource))
              ] }) : null
            ] }) : null,
            s.builtinContent ? /* @__PURE__ */ jsxs("section", { className: "skill-reader", children: [
              "content" in s.builtinContent ? /* @__PURE__ */ jsx("pre", { className: "integration-content", children: s.builtinContent.content }) : null,
              /* @__PURE__ */ jsxs("details", { className: "skill-technical", children: [
                /* @__PURE__ */ jsx("summary", { children: "\u6587\u4EF6\u4FE1\u606F" }),
                /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
                  s.builtinContent.id,
                  " / ",
                  s.builtinContent.resource,
                  /* @__PURE__ */ jsx("br", {}),
                  "SHA-256 ",
                  s.builtinContent.digest
                ] })
              ] })
            ] }) : null,
            r && selected ? /* @__PURE__ */ jsxs("div", { className: "skill-revision-detail", children: [
              /* @__PURE__ */ jsx("p", { children: r.description }),
              r.files.length > 1 ? /* @__PURE__ */ jsx("div", { className: "skill-resource-actions", children: r.files.map((file) => /* @__PURE__ */ jsx("button", { className: "secondary compact code-wrap", disabled: s.reading, onClick: () => this.read(file.path), children: file.path }, file.path)) }) : null,
              s.content ? /* @__PURE__ */ jsx("div", { children: "contentBase64" in s.content ? /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9759\u6001 PNG \u6309\u539F\u5B57\u8282\u4E0B\u8F7D\uFF1B\u4E0D\u6267\u884C\u3002" }),
                /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => void this.downloadBinary(), children: "\u4E0B\u8F7D PNG" })
              ] }) : /* @__PURE__ */ jsx("pre", { className: "integration-content", children: s.content.content }) }) : null,
              /* @__PURE__ */ jsxs("details", { className: "skill-technical", children: [
                /* @__PURE__ */ jsx("summary", { children: "\u7248\u672C\u4E0E\u6587\u4EF6\u4FE1\u606F" }),
                /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
                  "Revision ",
                  r.id,
                  " \xB7 ",
                  r.revisionTag,
                  /* @__PURE__ */ jsx("br", {}),
                  "SHA-256 ",
                  r.contentDigest,
                  /* @__PURE__ */ jsx("br", {}),
                  "\u89D2\u8272 ",
                  r.roles.map(label).join("\u3001"),
                  " \xB7 \u8BB8\u53EF\u8BC1\uFF1A",
                  r.license ?? "\u672A\u77E5"
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
                  "\u5FC5\u9700\u5DE5\u5177\uFF1A",
                  r.requirements.tools.join(", ") || "\u65E0",
                  "\uFF1B\u540E\u7AEF\uFF1A",
                  r.requirements.backends.join(", ") || "\u65E0",
                  "\uFF1B\u6570\u636E\uFF1A",
                  r.requirements.artifactIds.join(", ") || "\u65E0"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u58F0\u660E\u4E0D\u4F1A\u6388\u4E88\u5DE5\u5177\u3001\u6570\u636E\u6216\u8BA1\u7B97\u6743\u9650\u3002\u672A\u77E5\u8BB8\u53EF\u8BC1\u4E0D\u4EE3\u8868\u83B7\u5F97\u518D\u5206\u53D1\u8BB8\u53EF\u3002\u5DF2\u6709\u4F1A\u8BDD\u53CA\u5386\u53F2\u4EFB\u52A1\u4FDD\u7559\u539F\u56FA\u5B9A\u7248\u672C\u3002" }),
                s.content ? /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
                  s.content.resource,
                  " \xB7 SHA-256 ",
                  s.content.digest
                ] }) : null,
                selected.reviews.map((review) => /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
                  label(review.decision),
                  " \xB7 ",
                  review.note,
                  " \xB7 ",
                  review.contentDigest
                ] }, review.id)),
                selected.revocations.map((revoke) => /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
                  "\u64A4\u9500 \xB7 ",
                  revoke.note
                ] }, revoke.id))
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "skill-delete-actions", children: [
                /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5220\u9664\u505C\u6B62\u540E\u7EED\u542F\u7528\uFF0C\u5386\u53F2\u8BB0\u5F55\u4FDD\u7559\u3002" }),
                /* @__PURE__ */ jsx("button", { className: "danger-outline", "aria-label": `\u5220\u9664\u6280\u80FD ${r.packageId} ${r.revisionTag}`, disabled: this.props.readOnly || s.busy, onClick: () => this.remove(r.id), children: "\u5220\u9664\u6280\u80FD" })
              ] })
            ] }) : null
          ] })
        ] })
      ] })
    ] });
  }
}
export {
  SkillManager,
  skillFileBase64
};
