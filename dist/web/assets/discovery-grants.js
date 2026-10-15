import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, artifactText, downloadArtifact } from "./api.js";
import { short } from "./models.js";
import { Badge, nativeSelectButton } from "./ui.js";
const sources = ["crossref", "alphaxiv", "openalex", "biorxiv", "pubmed"];
const initialSearch = () => ({ query: "", sources: ["crossref"], limit: 2, strategy: "keyword", prioritize: "default" });
const initialTarget = () => ({ source: "crossref", id: "", format: "provider-text" });
const expiry = () => {
  const d = new Date(Date.now() + 36e5);
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
};
function discoveryDraft(input) {
  const searches = input.searches.filter((s) => s.query.trim()).map((s) => ({ ...s, query: s.query.trim() })), targets = input.targets.filter((t) => t.id.trim()).map((t) => ({ ...t, id: t.id.trim(), ...t.requestedVersion?.trim() ? { requestedVersion: t.requestedVersion.trim() } : {} }));
  const maxRequests = Number(input.maxRequests), maxResponseBytes = Number(input.maxResponseBytes), date = new Date(input.expiresAt), duration = date.getTime() - Date.now();
  if (!input.sessionId || !searches.length && !targets.length) throw Error("\u8BF7\u9009\u62E9\u4E3B\u4F1A\u8BDD\u5E76\u586B\u5199\u81F3\u5C11\u4E00\u9879\u7CBE\u786E\u68C0\u7D22\u6216\u8D44\u6599");
  if (searches.length > 8 || targets.length > 20) throw Error("\u6700\u591A8\u9879\u68C0\u7D22\u548C20\u9879\u76EE\u6807");
  if (searches.some((s) => !s.sources.length || !Number.isInteger(s.limit) || s.limit < 1 || s.limit > 20)) throw Error("\u6BCF\u9879\u68C0\u7D22\u9700\u8981\u6765\u6E90\uFF0C\u7ED3\u679C\u4E0A\u9650\u4E3A 1\u201320");
  if (!input.formats.length || targets.some((t) => !input.formats.includes(t.format))) throw Error("\u8BF7\u9009\u62E9\u5141\u8BB8\u7684\u5185\u5BB9\u683C\u5F0F\uFF0C\u660E\u786E\u8D44\u6599\u683C\u5F0F\u987B\u5728\u8303\u56F4\u5185");
  if (!Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 100 || !Number.isInteger(maxResponseBytes) || maxResponseBytes < 1024 || maxResponseBytes > 33554432) throw Error("HTTP\u6B21\u6570\u987B\u4E3A1\u2013100\uFF0C\u5355\u54CD\u5E94\u5B57\u8282\u4E0A\u9650\u987B\u4E3A1 KiB\u201332 MiB");
  if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 36e5) throw Error("\u622A\u6B62\u65F6\u95F4\u987B\u5728\u672A\u676524\u5C0F\u65F6\u5185");
  return { sessionId: input.sessionId, searches, targets, formats: input.formats, allowSearchResults: input.allowSearchResults && searches.length > 0, maxRequests, maxResponseBytes, expiresAt: date.toISOString() };
}
const discoveryUsable = (g) => !!g && g.effectiveState === "active" && g.validity === "current" && g.usage.remaining > 0 && Date.parse(g.expiresAt) > Date.now();
const signature = (p) => JSON.stringify([p.data.discoveryGrants, p.data.approvals, p.data.sessions.map((s) => [s.id, s.version, s.discoveryGrantId])]);
class DiscoveryGrants extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { selected: "", inspection: null, reading: false, error: "", preview: "", sessionId: "", searches: [initialSearch()], targets: [], allowSearchResults: true, formats: ["provider-text"], maxRequests: 2, maxResponseBytes: 262144, expiresAt: expiry() };
    this.mounted = true;
    this.epoch = 0;
  }
  componentDidMount() {
    const id = this.props.selectedGrant || (this.props.data.discoveryGrants ?? []).slice(-1)[0]?.id;
    if (id) void this.inspect(id);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
  }
  componentDidUpdate(previous) {
    if (previous.data.project.id !== this.props.data.project.id) {
      this.epoch++;
      this.setState({ selected: "", inspection: null, reading: false, error: "" });
    } else if (previous.selectedGrant !== this.props.selectedGrant) {
      if (this.props.selectedGrant) void this.inspect(this.props.selectedGrant);
      else {
        this.epoch++;
        this.setState({ selected: "", inspection: null, reading: false, error: "" });
      }
    } else if (signature(previous) !== signature(this.props) && this.state.selected) void this.inspect(this.state.selected);
  }
  call(name, input) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input });
  }
  select(id) {
    if (this.props.onSelect && id !== this.props.selectedGrant) this.props.onSelect(id);
    else void this.inspect(id);
  }
  async inspect(grantId) {
    const epoch = ++this.epoch, projectId = this.props.data.project.id;
    this.setState({ selected: grantId, inspection: null, reading: true, error: "", preview: "" });
    try {
      const grant = await this.call("discovery_grant_inspect", { grantId });
      if (grant.id !== grantId || grant.projectId !== projectId) throw Error("\u6388\u6743\u4E0D\u5C5E\u4E8E\u6240\u9009\u9879\u76EE\u4E0E\u8BB0\u5F55");
      if (this.mounted && epoch === this.epoch && projectId === this.props.data.project.id) this.setState({ inspection: grant });
    } catch (error) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.epoch) this.setState({ reading: false });
    }
  }
  async readPaper(artifactId) {
    const epoch = this.epoch;
    await this.props.perform(async () => {
      const content = await artifactText(artifactId);
      if (this.mounted && epoch === this.epoch) this.setState({ preview: content.slice(0, 65536) + (content.length > 65536 ? "\n\u2026\u53EA\u9884\u89C8\u524D65,536\u5B57\u7B26\u3002" : "") });
    });
  }
  async prepare() {
    let input;
    try {
      input = discoveryDraft(this.state);
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : String(error) });
      return;
    }
    const epoch = this.epoch, projectId = this.props.data.project.id;
    await this.props.perform(async () => {
      const grant = await this.call("discovery_grant_prepare", input);
      if (this.mounted && epoch === this.epoch && projectId === this.props.data.project.id) this.select(grant.id);
    }, "\u6587\u732E\u53D1\u73B0\u6388\u6743\u8349\u6848\u5DF2\u4FDD\u5B58\uFF1B\u7B49\u5F85\u5355\u72EC\u6279\u51C6");
  }
  render() {
    const { data, perform } = this.props, s = this.state, g = s.inspection, approval = data.approvals.find((a) => a.id === g?.approvalId);
    return /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u9650\u5B9A\u6587\u732E\u53D1\u73B0\u6388\u6743" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u56FA\u5B9A\u4E3B\u4F1A\u8BDD\u3001\u7CBE\u786E\u68C0\u7D22\u4E0E\u8D44\u6599\u3001\u6765\u6E90\u3001\u683C\u5F0F\u3001\u5355\u54CD\u5E94\u5927\u5C0F\u3001HTTP\u8BF7\u6C42\u6B21\u6570\u548C\u671F\u9650\u3002\u51C6\u5907\u3001\u6279\u51C6\u548C\u6FC0\u6D3B\u5747\u4E0D\u53D1\u9001\u7F51\u7EDC\u8BF7\u6C42\uFF0C\u4E5F\u4E0D\u542F\u7528\u6765\u6E90\u3002" }),
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u51C6\u5907 DiscoveryGrant \u8349\u6848" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          void this.prepare();
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u6307\u5B9A\u4E3B\u534F\u8C03\u4F1A\u8BDD",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u53D1\u73B0\u6388\u6743\u4E3B\u4F1A\u8BDD", required: true, value: s.sessionId, onChange: (e) => this.setState({ sessionId: e.target.value }), children: [
              nativeSelectButton,
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u672A\u7ED1\u5B9A\u53D1\u73B0\u6388\u6743\u7684\u4E3B\u4F1A\u8BDD" }),
              data.sessions.filter((row) => row.role === "coordinator" && !row.taskId && row.state !== "archived" && !row.discoveryGrantId).map((row) => /* @__PURE__ */ jsxs("option", { value: row.id, children: [
                row.title,
                " \xB7 ",
                short(row.id)
              ] }, row.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsx("legend", { children: "\u51BB\u7ED3\u7684\u7CBE\u786E\u68C0\u7D22" }),
            s.searches.map((search, index) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u68C0\u7D22\u8BCD ",
                index + 1,
                /* @__PURE__ */ jsx("input", { "aria-label": `\u6388\u6743\u68C0\u7D22\u8BCD ${index + 1}`, maxLength: 500, value: search.query, onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, query: e.target.value } : item) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u6765\u6E90",
                  /* @__PURE__ */ jsxs("select", { "aria-label": `\u6388\u6743\u68C0\u7D22\u6765\u6E90 ${index + 1}`, value: search.sources[0], onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, sources: [e.target.value] } : item) }), children: [
                    nativeSelectButton,
                    sources.map((source) => /* @__PURE__ */ jsx("option", { children: source }, source))
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u6700\u591A\u7ED3\u679C",
                  /* @__PURE__ */ jsx("input", { "aria-label": `\u6388\u6743\u7ED3\u679C\u4E0A\u9650 ${index + 1}`, type: "number", min: 1, max: 20, value: search.limit, onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, limit: Number(e.target.value) } : item) }) })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u7B56\u7565",
                  /* @__PURE__ */ jsxs("select", { value: search.strategy, onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, strategy: e.target.value } : item) }), children: [
                    nativeSelectButton,
                    /* @__PURE__ */ jsx("option", { value: "keyword", children: "\u5173\u952E\u8BCD" }),
                    /* @__PURE__ */ jsx("option", { value: "embedding", children: "\u8BED\u4E49" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u6392\u5E8F",
                  /* @__PURE__ */ jsxs("select", { value: search.prioritize, onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, prioritize: e.target.value } : item) }), children: [
                    nativeSelectButton,
                    /* @__PURE__ */ jsx("option", { value: "default", children: "\u9ED8\u8BA4" }),
                    /* @__PURE__ */ jsx("option", { value: "recency", children: "\u6700\u8FD1" }),
                    /* @__PURE__ */ jsx("option", { value: "historical", children: "\u5386\u53F2" }),
                    /* @__PURE__ */ jsx("option", { value: "popular", children: "\u70ED\u95E8" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u53D1\u8868\u65E5\u671F\u8D77",
                  /* @__PURE__ */ jsx("input", { type: "date", value: search.publishedAfter ?? "", onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, publishedAfter: e.target.value || void 0 } : item) }) })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u53D1\u8868\u65E5\u671F\u6B62",
                  /* @__PURE__ */ jsx("input", { type: "date", value: search.publishedBefore ?? "", onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, publishedBefore: e.target.value || void 0 } : item) }) })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", onClick: () => this.setState({ searches: s.searches.filter((_, i) => i !== index) }), children: "\u79FB\u9664\u6B64\u68C0\u7D22" })
            ] }, index)),
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", onClick: () => this.setState({ searches: [...s.searches, initialSearch()] }), children: "\u6DFB\u52A0\u68C0\u7D22" })
          ] }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsx("legend", { children: "\u660E\u786E\u8D44\u6599\u6807\u8BC6\uFF08\u53EF\u9009\uFF09" }),
            s.targets.map((target, index) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
              /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u6765\u6E90",
                  /* @__PURE__ */ jsxs("select", { value: target.source, onChange: (e) => this.setState({ targets: s.targets.map((item, i) => i === index ? { ...item, source: e.target.value } : item) }), children: [
                    nativeSelectButton,
                    sources.map((source) => /* @__PURE__ */ jsx("option", { children: source }, source))
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u8D44\u6599 ID",
                  /* @__PURE__ */ jsx("input", { "aria-label": `\u8D44\u6599\u6807\u8BC6 ${index + 1}`, value: target.id, onChange: (e) => this.setState({ targets: s.targets.map((item, i) => i === index ? { ...item, id: e.target.value } : item) }) })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u5185\u5BB9\u683C\u5F0F",
                  /* @__PURE__ */ jsxs("select", { value: target.format, onChange: (e) => this.setState({ targets: s.targets.map((item, i) => i === index ? { ...item, format: e.target.value } : item) }), children: [
                    nativeSelectButton,
                    /* @__PURE__ */ jsx("option", { value: "provider-text", children: "\u4F9B\u5E94\u5546\u6587\u672C/\u5143\u6570\u636E" }),
                    /* @__PURE__ */ jsx("option", { value: "original-pdf", children: "\u539F\u59CB PDF" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  "\u8BF7\u6C42\u7248\u672C",
                  /* @__PURE__ */ jsx("input", { value: target.requestedVersion ?? "", onChange: (e) => this.setState({ targets: s.targets.map((item, i) => i === index ? { ...item, requestedVersion: e.target.value } : item) }) })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", onClick: () => this.setState({ targets: s.targets.filter((_, i) => i !== index) }), children: "\u79FB\u9664\u6B64\u8D44\u6599" })
            ] }, index)),
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", onClick: () => this.setState({ targets: [...s.targets, initialTarget()] }), children: "\u6DFB\u52A0\u660E\u786E\u8D44\u6599" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", disabled: !s.searches.some((search) => search.query.trim()), checked: s.allowSearchResults && s.searches.some((search) => search.query.trim()), onChange: (e) => this.setState({ allowSearchResults: e.target.checked }) }),
            "\u5141\u8BB8\u8BFB\u53D6\u672C\u6388\u6743\u68C0\u7D22\u547D\u4E2D\u7684\u8D44\u6599"
          ] }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsx("legend", { children: "\u5141\u8BB8\u7684\u5185\u5BB9\u683C\u5F0F" }),
            ["provider-text", "original-pdf"].map((format) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.formats.includes(format), onChange: (e) => this.setState({ formats: e.target.checked ? [...s.formats, format] : s.formats.filter((x) => x !== format) }) }),
              format === "provider-text" ? "\u4F9B\u5E94\u5546\u6587\u672C/\u5143\u6570\u636E" : "\u539F\u59CB PDF"
            ] }, format))
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6700\u591A HTTP \u8BF7\u6C42\u6B21\u6570",
              /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 100, required: true, value: s.maxRequests, onChange: (e) => this.setState({ maxRequests: Number(e.target.value) }) })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u5355\u54CD\u5E94\u5B57\u8282\u4E0A\u9650",
              /* @__PURE__ */ jsx("input", { type: "number", min: 1024, max: 33554432, required: true, value: s.maxResponseBytes, onChange: (e) => this.setState({ maxResponseBytes: Number(e.target.value) }) })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u622A\u6B62\uFF08\u672C\u5730\u65F6\u95F4\uFF0C24\u5C0F\u65F6\u5185\uFF09",
              /* @__PURE__ */ jsx("input", { type: "datetime-local", required: true, value: s.expiresAt, onChange: (e) => this.setState({ expiresAt: e.target.value }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: data.project.archived || !s.sessionId, children: "\u4FDD\u5B58\u56FA\u5B9A\u8303\u56F4\u8349\u6848" })
        ] })
      ] }),
      (data.discoveryGrants ?? []).length ? /* @__PURE__ */ jsxs("label", { children: [
        "\u67E5\u770B\u53D1\u73B0\u6388\u6743",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u67E5\u770B\u53D1\u73B0\u6388\u6743", value: s.selected, onChange: (e) => this.select(e.target.value), children: [
          nativeSelectButton,
          /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u6388\u6743" }),
          (data.discoveryGrants ?? []).map((row) => /* @__PURE__ */ jsxs("option", { value: row.id, children: [
            short(row.id),
            " \xB7 ",
            row.state
          ] }, row.id))
        ] })
      ] }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u6682\u65E0 DiscoveryGrant\u3002" }),
      s.selected ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.inspect(s.selected), children: "\u5237\u65B0\u56FA\u5B9A\u8303\u56F4\u4E0E\u8BA1\u6B21" }) : null,
      s.reading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u56DE\u67E5\u53D1\u73B0\u6388\u6743\u2026" }) : null,
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      g ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          "DiscoveryGrant ",
          short(g.id),
          " ",
          /* @__PURE__ */ jsx(Badge, { value: g.state })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u72B6\u6001\uFF1A",
          g.effectiveState,
          " \xB7 ",
          g.validity,
          " \xB7 \u5DF2\u7528 ",
          g.usage.used,
          "/",
          g.usage.limit,
          " \u6B21 HTTP \u8BF7\u6C42\u5C1D\u8BD5\uFF0C\u5269\u4F59 ",
          g.usage.remaining,
          " \u6B21\u3002\u5931\u8D25\u548C\u672A\u77E5\u8BF7\u6C42\u4E0D\u9000\u6B3E\u3002"
        ] }),
        g.reasons?.map((reason, i) => /* @__PURE__ */ jsx("p", { role: "status", children: reason }, i)),
        /* @__PURE__ */ jsxs("dl", { className: "details", children: [
          /* @__PURE__ */ jsx("dt", { children: "\u4E3B\u4F1A\u8BDD" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            short(g.sessionId),
            " ",
            this.props.onSession ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.props.onSession?.(g.sessionId), children: "\u6253\u5F00\u4F1A\u8BDD" }) : null
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u6A21\u578B" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            g.model.provider,
            " / ",
            g.model.model
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u6765\u6E90 / \u8BBE\u7F6E\u7248\u672C" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            g.sources.join("\u3001"),
            " / ",
            g.settingsVersion
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u6279\u51C6\u8BB0\u5F55" }),
          /* @__PURE__ */ jsx("dd", { children: short(g.approvalId) }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u6458\u8981" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest code-wrap", children: g.digest }) }),
          /* @__PURE__ */ jsx("dt", { children: "\u622A\u6B62" }),
          /* @__PURE__ */ jsx("dd", { children: g.expiresAt }),
          /* @__PURE__ */ jsx("dt", { children: "\u5355\u54CD\u5E94\u4E0A\u9650" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            g.maxResponseBytes,
            " \u5B57\u8282"
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u5141\u8BB8\u683C\u5F0F" }),
          /* @__PURE__ */ jsx("dd", { children: g.formats.join("\u3001") })
        ] }),
        /* @__PURE__ */ jsx("h4", { children: "\u7CBE\u786E\u68C0\u7D22" }),
        g.searches.map((search, i) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            search.query,
            " \xB7 ",
            search.sources.join("\u3001"),
            " \xB7 \u6700\u591A ",
            search.limit,
            " \u6761 \xB7 ",
            search.strategy,
            "/",
            search.prioritize,
            " ",
            search.publishedAfter ?? "",
            " ",
            search.publishedBefore ?? ""
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || !discoveryUsable(g), onClick: () => this.props.onSearch?.(search, g.id), children: "\u63D0\u4EA4\u6B64\u56FA\u5B9A\u68C0\u7D22" })
        ] }, i)),
        !g.searches.length ? /* @__PURE__ */ jsx("p", { children: "\u672A\u5305\u542B\u68C0\u7D22\u8BF7\u6C42" }) : null,
        /* @__PURE__ */ jsx("h4", { children: "\u660E\u786E\u8D44\u6599" }),
        g.targets.map((target, i) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            target.source,
            " \xB7 ",
            target.id,
            " \xB7 ",
            target.format,
            " \xB7 ",
            target.requestedVersion ?? "\u672A\u6307\u5B9A\u7248\u672C"
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || !discoveryUsable(g), onClick: () => this.props.onTarget?.(target, g.id), children: "\u63D0\u4EA4\u6B64\u56FA\u5B9A\u8D44\u6599\u83B7\u53D6" })
        ] }, i)),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u68C0\u7D22\u547D\u4E2D\u8D44\u6599\uFF1A",
          g.allowSearchResults ? "\u5141\u8BB8\uFF08\u4EC5\u9650\u672C\u6388\u6743\u4EFB\u52A1\u4EA7\u751F\u7684\u547D\u4E2D\uFF09" : "\u4E0D\u5141\u8BB8"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "actions", children: [
          g.state === "draft" && approval?.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: data.project.archived || g.validity !== "current", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), "\u53D1\u73B0\u6388\u6743\u5DF2\u6279\u51C6\uFF0C\u5C1A\u672A\u6FC0\u6D3B"), children: "\u6279\u51C6\u56FA\u5B9A\u8303\u56F4" }) : null,
          g.state === "draft" && approval?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: data.project.archived || g.validity !== "current", onClick: () => perform(() => this.call("discovery_grant_activate", { grantId: g.id, expectedVersion: g.version }), "\u53D1\u73B0\u6388\u6743\u5DF2\u6FC0\u6D3B\uFF1B\u672A\u53D1\u7F51\u7EDC\u8BF7\u6C42"), children: "\u6FC0\u6D3B\u5DF2\u6279\u51C6\u6388\u6743" }) : null,
          g.state !== "revoked" ? /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => perform(() => this.call("discovery_grant_revoke", { grantId: g.id, expectedVersion: g.version }), "\u53D1\u73B0\u6388\u6743\u5DF2\u64A4\u9500"), disabled: data.project.archived, children: "\u64A4\u9500\u6388\u6743" }) : null
        ] }),
        /* @__PURE__ */ jsx("h4", { children: "\u5B9E\u9645 HTTP \u8BF7\u6C42\u8BB0\u5F55" }),
        g.calls.length ? g.calls.map((call) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            short(call.id),
            " \xB7 ",
            call.source,
            " \xB7 ",
            call.host,
            " \xB7 ",
            call.status,
            " \xB7 ",
            call.startedAt
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "HTTP ",
            call.httpStatus ?? "\u2014",
            " \xB7 ",
            call.bytes ?? "\u2014",
            " \u5B57\u8282 \xB7 ",
            call.error ?? "\u65E0\u9519\u8BEF"
          ] })
        ] }, call.id)) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5C1A\u65E0\u8BF7\u6C42\u8BB0\u5F55\uFF1B\u6279\u51C6\u548C\u6FC0\u6D3B\u4E0D\u4F1A\u4EA7\u751F\u8BF7\u6C42\u3002" }),
        /* @__PURE__ */ jsx("h4", { children: "\u672C\u6388\u6743\u56FA\u5B9A\u68C0\u7D22\u8BB0\u5F55" }),
        g.searchResults.map((record) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            record.query,
            " \xB7 ",
            short(record.id),
            " \xB7 ",
            record.status,
            " \xB7 ",
            record.retrievedAt
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            record.items.length,
            " \u6761\u5019\u9009\uFF1B\u6765\u6E90 ",
            record.sources.map((source) => `${source.source}:${source.status}`).join("\u3001")
          ] })
        ] }, record.id)),
        !g.searchResults.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5C1A\u65E0\u56FA\u5B9A\u68C0\u7D22\u7ED3\u679C\u3002" }) : null,
        /* @__PURE__ */ jsx("h4", { children: "\u672C\u6388\u6743\u5DF2\u5F52\u6863\u8D44\u6599" }),
        g.papers.map((paper) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            paper.title,
            " \xB7 ",
            paper.source,
            "/",
            paper.idInSource,
            " \xB7 ",
            short(paper.id)
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            paper.contentKind,
            " \xB7 ",
            paper.fullTextRead ? "\u5DF2\u8BFB\u53D6\u6B63\u6587" : "\u672A\u8BFB\u53D6\u5168\u6587",
            " \xB7 \u56FA\u5B9A\u539F\u4EF6 ",
            paper.rawArtifactIds.map(short).join("\u3001")
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => void this.readPaper(paper.artifactId), children: "\u67E5\u770B\u5DF2\u5F52\u6863\u5185\u5BB9" }),
          paper.rawArtifactIds.map((id, index) => /* @__PURE__ */ jsxs("button", { className: "secondary compact", onClick: () => perform(() => downloadArtifact(id, `discovery-response-${short(paper.id)}-${index + 1}`)), children: [
            "\u4E0B\u8F7D\u539F\u59CB\u54CD\u5E94 ",
            index + 1
          ] }, id))
        ] }, paper.id)),
        !g.papers.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5C1A\u65E0\u672C\u6388\u6743\u5F52\u6863\u8D44\u6599\u3002" }) : null,
        s.preview ? /* @__PURE__ */ jsx("pre", { className: "document-preview", children: s.preview }) : null
      ] }) : null
    ] });
  }
}
export {
  DiscoveryGrants,
  discoveryDraft,
  discoveryUsable
};
