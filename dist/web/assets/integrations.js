import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { literatureSourceURL } from "./literature-view.js";
import { api, artifactText, downloadArtifact } from "./api.js";
import { SectionTitle, Icon, nativeSelectButton } from "./ui.js";
import { SkillManager } from "./skill-manager.js";
const sources = ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
const sourceInfo = { alphaxiv: { name: "alphaXiv", description: "\u9884\u5370\u672C\u7814\u7A76\u4E0E\u8BED\u4E49\u5019\u9009", logo: "alphaxiv.svg" }, openalex: { name: "OpenAlex", description: "\u5F00\u653E\u5B66\u672F\u76EE\u5F55\u4E0E\u7814\u7A76\u5143\u6570\u636E", logo: "openalex.svg" }, biorxiv: { name: "bioRxiv", description: "\u751F\u547D\u79D1\u5B66\u9884\u5370\u672C", logo: "biorxiv.svg" }, pubmed: { name: "PubMed", description: "\u751F\u7269\u533B\u5B66\u6587\u732E\u4E0E\u6458\u8981", logo: "pubmed.png" }, crossref: { name: "Crossref", description: "DOI \u6CE8\u518C\u4E0E\u51FA\u7248\u5143\u6570\u636E", logo: "crossref.ico" } };
class IntegrationsView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { activePanel: "skills", config: null, selectedSources: ["crossref"], query: "", priority: "default", strategy: "keyword", after: "", before: "", limit: 8, search: null, paper: null, paperText: "", history: null, busy: false, error: "" };
    this.mounted = true;
  }
  componentDidMount() {
    void this.run(() => this.load());
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  async run(fn) {
    if (this.state.busy) return;
    this.setState({ busy: true, error: "" });
    try {
      await fn();
    } catch (e) {
      if (this.mounted) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.mounted) this.setState({ busy: false });
    }
  }
  async load() {
    const [config, history] = await Promise.all([api(`/projects/${this.props.projectId}/connectors`), api(`/projects/${this.props.projectId}/connector-history`)]);
    if (this.mounted) this.setState({ config, history, selectedSources: this.state.selectedSources.filter((s) => config.enabled[s]) });
  }
  async configure(source, enabled) {
    await this.run(async () => {
      const c = await api(`/projects/${this.props.projectId}/connectors`, { expectedVersion: this.state.config.version, enabled: { [source]: enabled } });
      this.setState({ config: c, selectedSources: this.state.selectedSources.filter((s) => c.enabled[s]) });
    });
  }
  selectSource(source, checked) {
    this.setState({ selectedSources: checked ? [...this.state.selectedSources, source] : this.state.selectedSources.filter((s) => s !== source) });
  }
  async search() {
    await this.run(async () => {
      const result = await api("/connectors/discover", { projectId: this.props.projectId, query: this.state.query, sources: this.state.selectedSources, limit: this.state.limit, prioritize: this.state.priority, strategy: this.state.strategy, ...this.state.after ? { publishedAfter: this.state.after } : {}, ...this.state.before ? { publishedBefore: this.state.before } : {} });
      if (this.mounted) this.setState({ search: result });
      await this.load();
    });
  }
  async readPaper(id, source) {
    await this.run(async () => {
      const paper = await api("/connectors/paper", { projectId: this.props.projectId, id, source });
      const content = await artifactText(paper.artifactId);
      if (this.mounted) this.setState({ paper, paperText: content });
      await this.load();
    });
  }
  panelId(panel) {
    return `integrations-${this.props.projectId}-${panel}`;
  }
  setPanel(panel, focus = false) {
    this.setState({ activePanel: panel }, () => {
      if (focus) document.getElementById(this.panelId(panel) + "-tab")?.focus();
    });
  }
  tabKey(e, panel) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      this.setPanel(panel === "skills" ? "connectors" : "skills", true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.setPanel(e.key === "Home" ? "skills" : "connectors", true);
    }
  }
  render() {
    const s = this.state, c = s.config;
    return /* @__PURE__ */ jsx("div", { className: "page-scroll integrations-page", children: /* @__PURE__ */ jsxs("div", { className: "integration-workspace", children: [
      /* @__PURE__ */ jsxs(SectionTitle, { title: "\u6280\u80FD\u4E0E\u8FDE\u63A5\u5668", sub: "\u9009\u62E9\u7814\u7A76\u65B9\u6CD5\uFF0C\u7BA1\u7406\u6587\u732E\u6765\u6E90\u6388\u6743\u3002", children: [
        this.props.onLiterature ? /* @__PURE__ */ jsx("button", { className: "primary", onClick: this.props.onLiterature, children: "\u524D\u5F80\u6301\u4E45\u6587\u732E\u4EFB\u52A1" }) : null,
        /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy, onClick: () => this.run(() => this.load()), children: "\u5237\u65B0\u672C\u5730\u72B6\u6001" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "integration-tabs", role: "tablist", "aria-label": "\u6280\u80FD\u4E0E\u8FDE\u63A5\u5668\u5206\u7C7B", children: ["skills", "connectors"].map((panel) => /* @__PURE__ */ jsxs("button", { type: "button", role: "tab", id: this.panelId(panel) + "-tab", "aria-controls": this.panelId(panel), "aria-selected": s.activePanel === panel, tabIndex: s.activePanel === panel ? 0 : -1, onClick: () => this.setPanel(panel), onKeyDown: (e) => this.tabKey(e, panel), children: [
        /* @__PURE__ */ jsx(Icon, { name: panel === "skills" ? "skills" : "link" }),
        panel === "skills" ? "\u6280\u80FD" : "\u8FDE\u63A5\u5668"
      ] }, panel)) }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      /* @__PURE__ */ jsx("section", { className: "integration-panel", id: this.panelId("skills"), role: "tabpanel", "aria-labelledby": this.panelId("skills") + "-tab", hidden: s.activePanel !== "skills", children: /* @__PURE__ */ jsx(SkillManager, { projectId: this.props.projectId, sessionId: this.props.sessionId }, this.props.projectId) }),
      /* @__PURE__ */ jsxs("section", { className: "integration-panel", id: this.panelId("connectors"), role: "tabpanel", "aria-labelledby": this.panelId("connectors") + "-tab", hidden: s.activePanel !== "connectors", children: [
        /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u5F00\u542F\u6765\u6E90\u53EA\u6388\u6743\u5411\u8BE5\u5916\u90E8\u670D\u52A1\u53D1\u9001\u67E5\u8BE2\uFF0C\u4E0D\u4FDD\u8BC1\u7F51\u7EDC\u53EF\u8FBE\u6216\u5168\u6587\u53EF\u5F97\u3002\u5B9E\u9645\u8BF7\u6C42\u72B6\u6001\u5355\u72EC\u8BB0\u5F55\uFF1B\u6765\u6E90\u9519\u8BEF\u4E0D\u4EE3\u8868\u6CA1\u6709\u76F8\u5173\u8BBA\u6587\u3002\u4E0D\u4F1A\u6388\u4E88\u8BA1\u7B97\u3001\u53D1\u5E03\u6216\u989D\u5916\u6A21\u578B\u8C03\u7528\u6743\u9650\u3002" }),
        /* @__PURE__ */ jsxs("section", { className: "surface connector-catalog", children: [
          /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
            /* @__PURE__ */ jsx("h2", { children: "\u6587\u732E\u6765\u6E90\u6388\u6743" }),
            /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u65B0\u6765\u6E90\u9ED8\u8BA4\u5173\u95ED\uFF1BCrossref \u4FDD\u7559\u539F\u9ED8\u8BA4" })
          ] }),
          c ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "connector-list", children: sources.map((source) => /* @__PURE__ */ jsxs("label", { className: "connector-row", "data-enabled": !!c.enabled[source], children: [
              /* @__PURE__ */ jsx("span", { className: "connector-logo", children: /* @__PURE__ */ jsx("img", { src: "/source-logos/" + sourceInfo[source].logo, alt: "" }) }),
              /* @__PURE__ */ jsxs("span", { className: "connector-copy", children: [
                /* @__PURE__ */ jsx("strong", { children: sourceInfo[source].name }),
                /* @__PURE__ */ jsx("span", { className: "small muted", children: sourceInfo[source].description })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "connector-status", children: c.enabled[source] ? "\u5DF2\u542F\u7528" : "\u5173\u95ED" }),
              /* @__PURE__ */ jsx("input", { className: "connector-toggle", "aria-label": "\u542F\u7528 " + sourceInfo[source].name, type: "checkbox", disabled: s.busy, checked: !!c.enabled[source], onChange: (e) => this.configure(source, e.target.checked) })
            ] }, source)) }),
            /* @__PURE__ */ jsxs("details", { className: "integration-disclosure", children: [
              /* @__PURE__ */ jsx("summary", { children: "\u8BF7\u6C42\u989D\u5EA6\u4E0E\u5BBF\u4E3B\u914D\u7F6E" }),
              /* @__PURE__ */ jsxs("div", { className: "integration-disclosure-content", children: [
                /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                  "\u5DF2\u9884\u7559/\u53D1\u8D77 HTTP \u8BF7\u6C42 ",
                  c.requestsUsed,
                  " / ",
                  c.requestLimit,
                  " \u6B21\u3002\u4E0D\u662F\u8D39\u7528\u786C\u4E0A\u9650\uFF1B\u670D\u52A1\u53EF\u6536\u8D39\u6216\u9650\u6D41\uFF0C\u5931\u8D25\u4E5F\u4F1A\u5360\u7528\u8BF7\u6C42\u6B21\u6570\u3002"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
                  /* @__PURE__ */ jsxs("label", { children: [
                    "\u8BF7\u6C42\u4E0A\u9650 ",
                    /* @__PURE__ */ jsx("input", { type: "number", min: "1", max: "10000", defaultValue: c.requestLimit, "aria-label": "\u8BF7\u6C42\u4E0A\u9650", id: "request-cap-" + this.props.projectId }, "cap-" + c.version)
                  ] }),
                  /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy, onClick: () => this.run(async () => {
                    const input = document.getElementById("request-cap-" + this.props.projectId);
                    const config = await api(`/projects/${this.props.projectId}/connectors`, { expectedVersion: c.version, requestLimit: Number(input.value) });
                    this.setState({ config });
                  }), children: "\u4FDD\u5B58\u8BF7\u6C42\u4E0A\u9650" })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                  "OpenAlex \u5BC6\u94A5\uFF1A",
                  c.credentials.openalexKeyConfigured ? "\u5DF2\u5728\u5BBF\u4E3B\u914D\u7F6E" : "\u672A\u914D\u7F6E",
                  "\uFF1BNCBI \u5BC6\u94A5\uFF1A",
                  c.credentials.ncbiKeyConfigured ? "\u5DF2\u5728\u5BBF\u4E3B\u914D\u7F6E" : "\u672A\u914D\u7F6E",
                  "\u3002\u5BC6\u94A5\u4E0D\u4F20\u7ED9 Agent\u3001\u4E0D\u663E\u793A\u5728\u9875\u9762\u3002"
                ] })
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx("p", { className: "muted", children: "\u8BFB\u53D6\u672C\u5730\u8BBE\u7F6E\u4E2D\u2026" }),
          /* @__PURE__ */ jsxs("details", { className: "integration-disclosure", children: [
            /* @__PURE__ */ jsx("summary", { children: "\u6700\u8FD1\u5B9E\u9645\u8BF7\u6C42\u89C2\u6D4B\uFF08\u4E0D\u7B49\u4E8E\u6301\u7EED\u5065\u5EB7\u4FDD\u8BC1\uFF09" }),
            /* @__PURE__ */ jsx("div", { className: "integration-disclosure-content", children: Array.isArray(s.history?.observations) ? /* @__PURE__ */ jsx("div", { className: "table-wrap", children: /* @__PURE__ */ jsxs("table", { children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { children: "\u6765\u6E90\u6388\u6743" }),
                /* @__PURE__ */ jsx("th", { children: "\u6700\u8FD1\u89C2\u6D4B" }),
                /* @__PURE__ */ jsx("th", { children: "HTTP / \u9650\u6D41 / \u9519\u8BEF" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: sources.map((source) => {
                const observation = s.history.observations.find((item) => item.source === source);
                return /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsxs("td", { children: [
                    source,
                    " \xB7 ",
                    c?.enabled[source] ? "\u5DF2\u6388\u6743" : "\u672A\u6388\u6743"
                  ] }),
                  /* @__PURE__ */ jsx("td", { children: observation ? `${observation.startedAt} \xB7 ${observation.status === "succeeded" ? "\u8BE5\u6B21\u8BF7\u6C42\u6210\u529F" : observation.status === "reserved" ? "\u8BF7\u6C42\u5DF2\u9884\u7559\uFF0C\u7ED3\u679C\u672A\u786E\u8BA4" : "\u5931\u8D25\u6216\u7ED3\u679C\u672A\u77E5"}` : "\u6700\u8FD150\u6B21\u8BF7\u6C42\u4E2D\u6CA1\u6709\u8BE5\u6765\u6E90\u89C2\u6D4B" }),
                  /* @__PURE__ */ jsx("td", { children: observation ? `HTTP ${observation.httpStatus ?? "\u672A\u53D6\u5F97"} \xB7 Retry-After ${observation.retryAfter ?? "\u65E0"} \xB7 ${observation.error ?? "\u672A\u8BB0\u5F55\u9519\u8BEF"}` : "\u672A\u89C2\u6D4B\uFF1B\u4E0D\u63A8\u65AD\u5065\u5EB7\u6216\u65E0\u6587\u732E" })
                ] }, source);
              }) })
            ] }) }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u63A5\u53E3\u5C1A\u672A\u8FD4\u56DE\u5B9E\u9645\u8BF7\u6C42\u89C2\u6D4B\uFF1B\u6765\u6E90\u5F00\u5173\u4EC5\u8868\u793A\u6388\u6743\uFF0C\u4E0D\u8868\u793A\u5065\u5EB7\u3002" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "surface connector-search-card", children: [
          /* @__PURE__ */ jsxs("details", { className: "integration-disclosure", children: [
            /* @__PURE__ */ jsx("summary", { children: "\u517C\u5BB9\u540C\u6B65\u68C0\u7D22\u5165\u53E3" }),
            /* @__PURE__ */ jsxs("div", { className: "integration-disclosure-content", children: [
              /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u53EA\u5728\u70B9\u51FB\u68C0\u7D22\u65F6\u53D1\u51FA\u7F51\u7EDC\u8BF7\u6C42" }),
              /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
                e.preventDefault();
                void this.search();
              }, children: [
                /* @__PURE__ */ jsxs("label", { className: "full", children: [
                  "\u68C0\u7D22\u95EE\u9898",
                  /* @__PURE__ */ jsx("input", { value: s.query, maxLength: 500, onChange: (e) => this.setState({ query: e.target.value }), placeholder: "\u8F93\u5165\u7CBE\u786E\u672F\u8BED\u6216\u7814\u7A76\u95EE\u9898" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "connector-switches", children: sources.map((source) => /* @__PURE__ */ jsxs("label", { children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", disabled: !c?.enabled[source] || s.busy, checked: s.selectedSources.includes(source), onChange: (e) => this.selectSource(source, e.target.checked) }),
                  source
                ] }, source)) }),
                /* @__PURE__ */ jsxs("div", { className: "integration-controls", children: [
                  /* @__PURE__ */ jsxs("label", { children: [
                    "alphaXiv \u7B56\u7565",
                    /* @__PURE__ */ jsxs("select", { value: s.strategy, onChange: (e) => this.setState({ strategy: e.target.value }), children: [
                      nativeSelectButton,
                      /* @__PURE__ */ jsx("option", { value: "keyword", children: "\u5173\u952E\u8BCD" }),
                      /* @__PURE__ */ jsx("option", { value: "embedding", children: "\u8BED\u4E49\u5019\u9009" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { children: [
                    "\u4F18\u5148\u7EA7",
                    /* @__PURE__ */ jsxs("select", { value: s.priority, onChange: (e) => this.setState({ priority: e.target.value }), children: [
                      nativeSelectButton,
                      /* @__PURE__ */ jsx("option", { value: "default", children: "\u76F8\u5173\u6027" }),
                      /* @__PURE__ */ jsx("option", { value: "recency", children: "\u65B0\u8FD1" }),
                      /* @__PURE__ */ jsx("option", { value: "historical", children: "\u65E9\u671F" }),
                      /* @__PURE__ */ jsx("option", { value: "popular", children: "\u6765\u6E90\u5185\u70ED\u5EA6" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { children: [
                    "\u53D1\u8868\u8D77\u65E5",
                    /* @__PURE__ */ jsx("input", { type: "date", value: s.after, onChange: (e) => this.setState({ after: e.target.value }) })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { children: [
                    "\u53D1\u8868\u6B62\u65E5",
                    /* @__PURE__ */ jsx("input", { type: "date", value: s.before, onChange: (e) => this.setState({ before: e.target.value }) })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { children: [
                    "\u6BCF\u6765\u6E90\u6761\u6570",
                    /* @__PURE__ */ jsx("input", { type: "number", min: "1", max: "20", value: s.limit, onChange: (e) => this.setState({ limit: Number(e.target.value) }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", disabled: s.busy || !s.query.trim() || !s.selectedSources.length, children: s.busy ? "\u6B63\u5728\u5904\u7406\u2026" : "\u68C0\u7D22\u6240\u9009\u6765\u6E90" })
              ] })
            ] })
          ] }),
          s.search ? /* @__PURE__ */ jsxs("div", { className: "connector-results", children: [
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: s.search.status === "partial" ? "\u90E8\u5206\u6765\u6E90\u6210\u529F" : "\u6240\u9009\u6765\u6E90\u54CD\u5E94\u6210\u529F" }),
              " \xB7 ",
              s.search.items.length,
              " \u6761\u5019\u9009\uFF1B\u4E0D\u662F\u5168\u6587\u6838\u9A8C\u6216\u7A77\u5C3D\u68C0\u7D22\u3002"
            ] }),
            s.search.sources.map((r) => /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
              r.source,
              ": ",
              r.status,
              " / ",
              r.count,
              " \u6761 ",
              r.error ?? ""
            ] }, r.source)),
            s.search.items.map((h) => /* @__PURE__ */ jsxs("article", { children: [
              /* @__PURE__ */ jsx("h3", { children: literatureSourceURL(h.url) ? /* @__PURE__ */ jsx("a", { href: literatureSourceURL(h.url), target: "_blank", rel: "noopener noreferrer", children: h.title }) : h.title }),
              /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                h.source,
                " \xB7 ",
                h.id,
                " \xB7 ",
                h.publicationDate ?? "\u65E5\u671F\u672A\u77E5",
                " \xB7 ",
                h.contentKind
              ] }),
              /* @__PURE__ */ jsx("p", { className: "prose-text", children: h.abstract || "\u6B64\u6761\u6CA1\u6709\u6458\u8981\uFF1B\u5C1A\u672A\u9605\u8BFB\u8BBA\u6587\u5168\u6587\u3002" }),
              h.duplicates.length ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                "\u5176\u4ED6\u6765\u6E90\uFF1A",
                h.duplicates.map((d) => d.source + ":" + d.id).join("\uFF1B")
              ] }) : null,
              /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: s.busy || !c?.enabled[h.source], onClick: () => this.readPaper(h.id, h.source), children: "\u8BFB\u53D6\u5E76\u767B\u8BB0\u5185\u5BB9" })
            ] }, h.source + ":" + h.id)),
            !s.search.items.length ? /* @__PURE__ */ jsx("p", { children: "\u672C\u6B21\u672A\u53D6\u5F97\u5339\u914D\u5019\u9009\uFF1B\u4E0D\u8BC1\u660E\u6CA1\u6709\u76F8\u5173\u6587\u732E\u3002" }) : null
          ] }) : null
        ] }),
        s.paper ? /* @__PURE__ */ jsxs("section", { className: "surface", children: [
          /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
            /* @__PURE__ */ jsx("h2", { children: s.paper.title }),
            /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => downloadArtifact(s.paper.artifactId, "paper-text.txt"), children: "\u4FDD\u5B58\u5DF2\u767B\u8BB0\u6587\u672C" })
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsxs("strong", { children: [
              "\u5185\u5BB9\u5C42\u7EA7\uFF1A",
              s.paper.contentKind
            ] }),
            " \xB7 ",
            s.paper.fullTextRead ? "\u53D6\u5F97\u539F\u6587\u63D0\u53D6\u6587\u672C\uFF0C\u672A\u6838\u9A8C\u539F PDF \u9875/\u56FE" : "\u6458\u8981\u6216\u5143\u6570\u636E\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u9605\u8BFB\u5168\u6587"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u8BF7\u6C42\uFF1A",
            s.paper.requestedId,
            "\uFF1B\u7248\u672C\uFF1A",
            s.paper.versionAssurance,
            "\uFF1B\u9875\u6620\u5C04\uFF1A",
            s.paper.pageMapping,
            "\u3002"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "small code-wrap", children: [
            "\u6587\u672C\u4EA7\u7269 ",
            s.paper.artifactId,
            /* @__PURE__ */ jsx("br", {}),
            "\u539F\u59CB\u54CD\u5E94 ",
            s.paper.rawArtifactIds.join(" / ")
          ] }),
          /* @__PURE__ */ jsx("pre", { className: "integration-content", children: s.paperText.slice(0, 4e4) }),
          s.paperText.length > 4e4 ? /* @__PURE__ */ jsx("p", { children: "\u8FD9\u91CC\u53EA\u5C55\u793A\u524D 40,000 \u5B57\u7B26\uFF0C\u5B8C\u6574\u6587\u672C\u8BF7\u4FDD\u5B58\u6216\u5728\u8D44\u6599\u9875\u67E5\u770B\u3002" }) : null
        ] }) : null,
        /* @__PURE__ */ jsx("section", { className: "surface", children: /* @__PURE__ */ jsxs("details", { className: "integration-disclosure", children: [
          /* @__PURE__ */ jsx("summary", { children: "\u5176\u4ED6\u8FDE\u63A5\u80FD\u529B\u8FB9\u754C" }),
          /* @__PURE__ */ jsxs("div", { className: "integration-disclosure-content", children: [
            /* @__PURE__ */ jsx("p", { children: "\u8BA1\u7B97\u540E\u7AEF\u4E0E\u6587\u732E\u8FDE\u63A5\u5668\u4E0D\u540C\u3002\u6280\u80FD\u53C2\u8003\u4E0D\u7B49\u4E8E\u8FDC\u7A0B\u4F5C\u4E1A\u3001Git \u53D1\u5E03\u6216\u8BBA\u6587\u7F16\u8BD1\u5DF2\u5B9E\u73B0\u3002" }),
            /* @__PURE__ */ jsx("div", { className: "table-wrap", children: /* @__PURE__ */ jsxs("table", { children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { children: "\u80FD\u529B" }),
                /* @__PURE__ */ jsx("th", { children: "\u5B9E\u73B0" }),
                /* @__PURE__ */ jsx("th", { children: "\u9A8C\u8BC1" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: (c?.capabilities ?? []).filter((x) => x.category !== "literature").map((x) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { children: x.id }),
                /* @__PURE__ */ jsx("td", { children: x.implementation }),
                /* @__PURE__ */ jsx("td", { children: x.verification })
              ] }, x.id)) })
            ] }) })
          ] })
        ] }) }),
        s.history ? /* @__PURE__ */ jsx("section", { className: "surface", children: /* @__PURE__ */ jsxs("details", { className: "integration-disclosure", children: [
          /* @__PURE__ */ jsx("summary", { children: "\u68C0\u7D22\u4E0E\u9605\u8BFB\u8BB0\u5F55" }),
          /* @__PURE__ */ jsxs("div", { className: "integration-disclosure-content", children: [
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5404\u663E\u793A\u6700\u8FD130\u6761\uFF1B\u65E7\u8BB0\u5F55\u7559\u5728\u672C\u5730\u6570\u636E\u5E93\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u590D\u53D1\u8D77\u8BF7\u6C42\u3002" }),
            s.history.searches.slice().reverse().map((r) => /* @__PURE__ */ jsxs("div", { className: "history-row", children: [
              /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.setState({ search: r }), children: r.query }),
              /* @__PURE__ */ jsxs("span", { children: [
                r.status,
                " \xB7 ",
                r.items.length,
                " \u6761"
              ] })
            ] }, r.id)),
            s.history.papers.slice().reverse().map((r) => /* @__PURE__ */ jsxs("div", { className: "history-row", children: [
              /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.run(async () => {
                const content = await artifactText(r.artifactId);
                this.setState({ paper: r, paperText: content });
              }), children: r.title }),
              /* @__PURE__ */ jsx("span", { children: r.contentKind })
            ] }, r.id))
          ] })
        ] }) }) : null
      ] })
    ] }) });
  }
}
export {
  IntegrationsView
};
