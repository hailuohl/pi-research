import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, artifactText, downloadArtifact } from "./api.js";
import { short } from "./models.js";
import { Icon, Badge, Empty, SectionTitle } from "./ui.js";
class WorkspaceView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { files: [], path: "", content: "", digest: null, dirty: false, loading: false, saving: false };
    this.loadId = 0;
    this.listId = 0;
    this.mounted = true;
    this.saving = false;
    this.beforeUnload = (event) => {
      if (!this.state.dirty && !this.state.saving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    this.newFile = () => {
      if (this.props.data.project.archived || !this.confirmDiscard()) return;
      const path = prompt("\u65B0\u6587\u4EF6\u76F8\u5BF9\u8DEF\u5F84\uFF0C\u4F8B\u5982 notes/research.md");
      if (path) {
        this.loadId++;
        this.setState({ path, content: "", digest: null, dirty: true, loading: false });
      }
    };
    this.save = async () => {
      if (this.saving || this.props.data.project.archived || !this.state.path || !this.state.dirty || this.state.loading) return;
      const { path, content, digest } = this.state, projectId = this.props.data.project.id, seq = this.loadId;
      const current = () => this.mounted && seq === this.loadId && projectId === this.props.data.project.id && path === this.state.path;
      this.saving = true;
      this.setState({ saving: true });
      try {
        await this.props.perform(async () => {
          try {
            const f = await api(`/projects/${projectId}/files`, { path, content, expectedDigest: digest });
            if (!current()) return;
            await new Promise((resolve) => this.setState((state) => current() ? { digest: f.digest, dirty: state.content !== content } : null, resolve));
            if (current()) await this.loadFiles();
          } catch (e) {
            if (current()) throw e;
          }
        });
      } finally {
        this.saving = false;
        if (this.mounted) this.setState({ saving: false });
      }
    };
  }
  componentDidMount() {
    window.addEventListener("beforeunload", this.beforeUnload);
    void this.loadFiles();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.loadId++;
    this.listId++;
    if (typeof window !== "undefined") window.removeEventListener("beforeunload", this.beforeUnload);
  }
  confirmDiscard() {
    return !this.state.dirty && !this.state.saving || confirm("\u6709\u672A\u4FDD\u5B58\u4FEE\u6539\u6216\u6B63\u5728\u4FDD\u5B58\uFF0C\u653E\u5F03\u5F53\u524D\u8349\u7A3F\uFF1F");
  }
  async loadFiles() {
    const seq = ++this.listId, projectId = this.props.data.project.id, selection = this.loadId;
    try {
      const files = await api(`/projects/${projectId}/files`);
      if (!this.mounted || seq !== this.listId || projectId !== this.props.data.project.id) return;
      this.setState({ files });
      if (!this.state.path && files.length && selection === this.loadId) await this.open(files[0].path);
    } catch (e) {
      if (this.mounted && seq === this.listId && projectId === this.props.data.project.id)
        await this.props.perform(async () => {
          throw e;
        });
    }
  }
  async open(path) {
    if (!this.confirmDiscard()) return;
    const seq = ++this.loadId, projectId = this.props.data.project.id;
    const current = () => this.mounted && seq === this.loadId && projectId === this.props.data.project.id;
    this.setState({ loading: true });
    try {
      const f = await api(`/projects/${projectId}/files?path=${encodeURIComponent(path)}`);
      if (current())
        this.setState({ path, content: f.content, digest: f.digest, dirty: false, loading: false });
    } catch (e) {
      if (!current()) return;
      this.setState({ loading: false });
      await this.props.perform(async () => {
        throw e;
      });
    }
  }
  render() {
    return /* @__PURE__ */ jsxs("div", { className: "page-scroll workspace-page", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u9879\u76EE\u5DE5\u4F5C\u533A", sub: this.props.data.project.archived ? "\u5DF2\u5F52\u6863\u9879\u76EE\u6E90\u7801\u53EA\u8BFB\uFF0C\u5B9E\u9A8C\u5FEB\u7167\u4E0E\u51C6\u5907\u533A\u6587\u4EF6\u4FDD\u7559\u3002" : "\u7F16\u8F91\u7684\u662F\u51C6\u5907\u533A\uFF0C\u4E0D\u4F1A\u6539\u53D8\u5DF2\u7ECF\u63D0\u4EA4\u7684\u5B9E\u9A8C\u5FEB\u7167\u3002", children: /* @__PURE__ */ jsxs("button", { className: "secondary", disabled: this.props.data.project.archived, onClick: this.newFile, children: [
        /* @__PURE__ */ jsx(Icon, { name: "plus", size: 15 }),
        "\u65B0\u5EFA\u6587\u4EF6"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "workspace-grid", children: [
        /* @__PURE__ */ jsxs("nav", { className: "file-tree", "aria-label": "\u9879\u76EE\u6587\u4EF6", children: [
          /* @__PURE__ */ jsx("div", { className: "small-label", children: "SOURCE FILES" }),
          this.state.files.map((f) => /* @__PURE__ */ jsxs("button", { className: this.state.path === f.path ? "active" : "", onClick: () => this.open(f.path), children: [
            /* @__PURE__ */ jsx(Icon, { name: "evidence", size: 15 }),
            /* @__PURE__ */ jsx("span", { children: f.path })
          ] }, f.path)),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: ".git\u3001\u53EF\u6267\u884C Pi \u914D\u7F6E\u4E0E\u654F\u611F\u914D\u7F6E\u4E0D\u4F5C\u4E3A\u666E\u901A\u5DE5\u4F5C\u533A\u8D44\u6E90\u52A0\u8F7D\u3002" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "editor", children: [
          /* @__PURE__ */ jsxs("div", { className: "editor-toolbar", children: [
            /* @__PURE__ */ jsx("code", { children: this.state.path || "\u9009\u62E9\u6587\u4EF6" }),
            this.state.dirty ? /* @__PURE__ */ jsx("span", { className: "dirty-dot", title: "\u672A\u4FDD\u5B58" }) : null,
            /* @__PURE__ */ jsx("span", { className: "grow" }),
            /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.state.path && this.open(this.state.path), children: "\u91CD\u65B0\u8BFB\u53D6" }),
            /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: this.props.data.project.archived || !this.state.path || !this.state.dirty || this.state.loading || this.state.saving, onClick: this.save, children: "\u4FDD\u5B58\u6587\u4EF6" })
          ] }),
          /* @__PURE__ */ jsx("textarea", { "aria-label": "\u6587\u4EF6\u5185\u5BB9", readOnly: this.props.data.project.archived || this.state.loading, spellCheck: false, value: this.state.content, onChange: (e) => {
            if (!this.props.data.project.archived && !this.state.loading) this.setState({ content: e.target.value, dirty: true });
          } }),
          /* @__PURE__ */ jsxs("div", { className: "editor-status", children: [
            /* @__PURE__ */ jsx("span", { children: "UTF-8" }),
            /* @__PURE__ */ jsxs("span", { children: [
              this.state.content.split("\n").length,
              " \u884C"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "\u7248\u672C\u6821\u9A8C ",
              short(this.state.digest)
            ] }),
            /* @__PURE__ */ jsx("span", { className: "grow" }),
            /* @__PURE__ */ jsx("span", { children: "\u51B2\u7A81\u65F6\u4FDD\u7559\u5F53\u524D\u7F16\u8F91\uFF0C\u4E0D\u8986\u76D6\u65B0\u7248\u672C" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "notice", children: [
        /* @__PURE__ */ jsx(Icon, { name: "folder" }),
        /* @__PURE__ */ jsx("p", { children: "\u5B9E\u9A8C\u4EE3\u7801\u53EF\u4F7F\u7528\u672C\u5730\u3001Docker \u6216 SSH\uFF1B\u6E90\u7801\u3001\u6267\u884C\u73AF\u5883\u548C\u8D44\u6E90\u5728\u8FD0\u884C\u524D\u5355\u72EC\u6279\u51C6\u3002\u672C\u5730\u4EE3\u7801\u62E5\u6709\u5F53\u524D\u7528\u6237\u6743\u9650\uFF0C\u6587\u4EF6\u4E0E\u7F51\u7EDC\u4E0D\u9694\u79BB\u3002" })
      ] })
    ] });
  }
}
class EvidenceView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { active: "", content: "", query: "" };
  }
  async open(id) {
    await this.props.perform(async () => {
      const content = await artifactText(id);
      this.setState({ active: id, content });
    });
  }
  render() {
    const { data, perform } = this.props;
    const artifact = data.artifacts.find((a) => a.id === this.state.active);
    return /* @__PURE__ */ jsxs("div", { className: "page-scroll", children: [
      /* @__PURE__ */ jsx(SectionTitle, { level: this.props.embedded ? 2 : 1, title: "\u8D44\u6599\u4E0E\u8BC1\u636E", sub: "\u8D44\u6599\u662F\u539F\u59CB\u8F93\u5165\uFF1B\u53EA\u6709\u660E\u786E\u5B9A\u4F4D\u5E76\u6821\u9A8C\u540E\u7684\u7247\u6BB5\uFF0C\u624D\u662F\u8BC1\u636E\u3002", children: !this.props.readOnly ? /* @__PURE__ */ jsxs("label", { className: "secondary file-upload", children: [
        /* @__PURE__ */ jsx(Icon, { name: "plus", size: 15 }),
        "\u5BFC\u5165\u6587\u672C\u8D44\u6599",
        /* @__PURE__ */ jsx("input", { type: "file", disabled: data.project.archived, accept: ".txt,.md,.csv,.json,.py,.tex,.mjs", onChange: (e) => {
          const file = e.target.files?.[0];
          if (!file)
            return;
          perform(async () => {
            if (file.size > 1024 * 1024)
              throw Error("\u5F53\u524D\u6587\u672C\u5BFC\u5165\u9650\u5236\u4E3A 1 MiB");
            const content = await file.text();
            if (content.includes("\0"))
              throw Error("\u6B64\u5165\u53E3\u53EA\u63A5\u53D7\u6587\u672C\uFF1BPDF \u8BF7\u5230\u201C\u6587\u732E\u4EFB\u52A1\u4E0E\u539F\u6587\u201D\u5BFC\u5165");
            const a = await api("/artifacts", { projectId: data.project.id, title: file.name, content, mediaType: "text/plain" });
            this.setState({ active: a.id, content });
          }, "\u6587\u672C\u8D44\u6599\u5DF2\u4FDD\u5B58");
          e.target.value = "";
        } })
      ] }) : null }),
      /* @__PURE__ */ jsxs("div", { className: "evidence-grid", children: [
        /* @__PURE__ */ jsxs("section", { className: "surface artifact-list", children: [
          /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
            /* @__PURE__ */ jsx("h2", { children: "\u6587\u4EF6\u4EA7\u7269" }),
            /* @__PURE__ */ jsx("span", { children: data.artifacts.length })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "search-field", children: [
            /* @__PURE__ */ jsx(Icon, { name: "search", size: 16 }),
            /* @__PURE__ */ jsx("input", { "aria-label": "\u641C\u7D22\u4EA7\u7269", placeholder: "\u641C\u7D22\u6587\u4EF6\u540D", value: this.state.query, onChange: (e) => this.setState({ query: e.target.value }) })
          ] }),
          data.artifacts.filter((a) => a.title.includes(this.state.query)).slice().reverse().map((a) => /* @__PURE__ */ jsxs("button", { className: "artifact-item " + (a.id === this.state.active ? "active" : ""), onClick: () => this.open(a.id), children: [
            /* @__PURE__ */ jsx(Icon, { name: "evidence" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: a.title }),
              /* @__PURE__ */ jsxs("small", { children: [
                (a.size / 1024).toFixed(1),
                " KB \xB7 ",
                a.origin.startsWith("run") ? "\u5B9E\u9645\u8FD0\u884C\u4EA7\u7269" : a.origin === "report" ? "\u786E\u5B9A\u6027\u62A5\u544A" : "\u5DF2\u5B58\u50A8\u6587\u4EF6"
              ] })
            ] })
          ] }, a.id)),
          !data.artifacts.length ? /* @__PURE__ */ jsx("div", { className: "inline-empty", children: "\u5BFC\u5165\u6587\u672C\uFF0C\u6216\u5B8C\u6210\u4E00\u6B21\u5B9E\u9A8C\u4EE5\u83B7\u53D6\u771F\u5B9E\u4EA7\u7269\u3002" }) : null
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "surface artifact-preview", children: [
          /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
            /* @__PURE__ */ jsx("h2", { children: artifact?.title ?? "\u4EA7\u7269\u9884\u89C8" }),
            artifact ? /* @__PURE__ */ jsxs("div", { className: "actions", children: [
              /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(() => downloadArtifact(artifact.id, artifact.title)), children: "\u4E0B\u8F7D" }),
              !this.props.readOnly ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived, onClick: () => this.props.onRegister(artifact.id, this.state.content), children: "\u767B\u8BB0\u4E3A\u8BC1\u636E" }) : null
            ] }) : null
          ] }),
          artifact ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "preview-meta", children: [
              "SHA-256 ",
              /* @__PURE__ */ jsx("code", { children: artifact.digest })
            ] }),
            /* @__PURE__ */ jsx("pre", { className: "document-preview", children: this.state.content })
          ] }) : /* @__PURE__ */ jsx(Empty, { title: "\u9009\u62E9\u4E00\u4EFD\u8D44\u6599", children: /* @__PURE__ */ jsx("p", { children: "HTML\u3001SVG \u7B49\u5185\u5BB9\u5747\u6309\u6587\u672C\u9884\u89C8\uFF0C\u4E0D\u6267\u884C\u5176\u4E2D\u7684\u811A\u672C\u3002" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
          /* @__PURE__ */ jsx("h2", { children: "\u8BC1\u636E\u7D22\u5F15" }),
          /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u6BCF\u6761\u8BC1\u636E\u56FA\u5B9A\u539F\u6587\u3001\u4F4D\u7F6E\u4E0E\u5185\u5BB9\u6458\u8981" })
        ] }),
        data.evidence.length ? data.evidence.map((e) => /* @__PURE__ */ jsxs("details", { className: "evidence-record", children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            /* @__PURE__ */ jsx("span", { className: "evidence-type", children: e.type.toUpperCase() }),
            /* @__PURE__ */ jsx("strong", { children: e.description }),
            /* @__PURE__ */ jsx("code", { children: short(e.id) })
          ] }),
          /* @__PURE__ */ jsx("blockquote", { children: e.quote }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "UTF-16 \u5B57\u7B26\u4F4D\u7F6E ",
            e.locator.start,
            "\u2013",
            e.locator.end,
            " \xB7 \u4EA7\u7269 ",
            short(e.artifactId)
          ] }),
          /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.open(e.artifactId), children: "\u67E5\u770B\u539F\u59CB\u4EA7\u7269" }),
          e.document && this.props.onDocument ? /* @__PURE__ */ jsxs("button", { className: "secondary compact", onClick: () => {
            const link = e.document;
            this.props.onDocument?.({ documentVersionId: link.documentVersionId, parseResultId: link.parseResultId, pageNumber: link.pageNumber, start: e.locator.start, end: e.locator.end });
          }, children: [
            "\u56DE\u67E5\u56FA\u5B9A\u6587\u6863\u9875 ",
            e.document.pageNumber
          ] }) : null
        ] }, e.id)) : /* @__PURE__ */ jsx("div", { className: "inline-empty", children: "\u68C0\u7D22\u547D\u4E2D\u6216\u6587\u4EF6\u5B58\u5728\uFF0C\u4E0D\u81EA\u52A8\u4EE3\u8868\u7ED3\u8BBA\u5DF2\u88AB\u8BC1\u636E\u652F\u6301\u3002" })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
          /* @__PURE__ */ jsx("h2", { children: "\u7ED3\u8BBA\u5019\u9009\u4E0E\u9A8C\u6536" }),
          !this.props.readOnly ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || !data.evidence.length, onClick: this.props.onClaim, children: "\u63D0\u51FA\u7ED3\u8BBA\u5019\u9009" }) : null
        ] }),
        data.claims.map((c) => /* @__PURE__ */ jsxs("div", { className: "claim-record", children: [
          /* @__PURE__ */ jsx(Badge, { value: c.status }),
          /* @__PURE__ */ jsx("p", { children: c.statement }),
          c.validity === "stale" ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u524D\u63D0\u6216\u5BA1\u67E5\u5DF2\u5931\u6548\uFF1A\u4EC5\u4FDD\u7559\u5386\u53F2\uFF0C\u4E0D\u7528\u4E8E\u65B0\u62A5\u544A\u3002" }) : null,
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u9650\u5236\uFF1A",
            c.limitations.join("\uFF1B") || "\u672A\u586B\u5199",
            " \xB7 \u8BC1\u636E ",
            c.evidenceIds.map(short).join(", ")
          ] }),
          !this.props.readOnly && !data.project.archived && c.status === "proposal" && c.validity !== "stale" ? /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: "accepted" }), "\u7ED3\u8BBA\u5DF2\u7531\u7528\u6237\u91C7\u7EB3"), children: "\u4EBA\u5DE5\u786E\u8BA4\u91C7\u7EB3" }),
            /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: "disputed" })), children: "\u6807\u4E3A\u4E89\u8BAE" }),
            /* @__PURE__ */ jsx("button", { className: "text-button danger", onClick: () => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: "rejected" })), children: "\u62D2\u7EDD" })
          ] }) : null
        ] }, c.id)),
        !data.claims.length ? /* @__PURE__ */ jsx("div", { className: "inline-empty", children: "\u5C1A\u65E0\u7ED3\u8BBA\u5019\u9009\u3002\u591A\u4E2A Agent \u4E00\u81F4\u540C\u610F\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u751F\u6210\u5DF2\u91C7\u7EB3\u4E8B\u5B9E\u3002" }) : null
      ] })
    ] });
  }
}
import { ReportsView } from "./report-view.js";
import { LiteratureView } from "./literature-view.js";
import { SettingsView } from "./settings-view.js";
export {
  EvidenceView,
  LiteratureView,
  ReportsView,
  SettingsView,
  WorkspaceView
};
