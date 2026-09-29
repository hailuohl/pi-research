import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { short } from "./models.js";
import { SectionTitle, Badge, Empty } from "./ui.js";
class ChangesView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { baseId: "", artifactId: "", path: "", title: "", hypothesis: "", preview: null, inspected: "" };
  }
  async preview(id) {
    await this.props.perform(async () => {
      const result = await api(`/change-proposals/${id}/diff`);
      this.setState({ preview: result, inspected: id });
    });
  }
  async prepare() {
    await this.props.perform(async () => {
      const base = this.props.data.experiments.find((e) => e.id === this.state.baseId);
      if (!base) throw new Error("\u8BF7\u9009\u62E9\u7236\u5B9E\u9A8C");
      const files = await api(`/experiments/${base.id}/files`);
      const before = files.some((f) => f.path === this.state.path) ? await api(`/experiments/${base.id}/files?path=${encodeURIComponent(this.state.path)}`) : null;
      const p = await api("/change-proposals", { projectId: this.props.data.project.id, baseExperimentId: base.id, expectedRevision: base.revision, title: this.state.title, hypothesis: this.state.hypothesis, changes: [{ path: this.state.path, artifactId: this.state.artifactId, expectedDigest: before?.digest ?? null }] });
      const preview = await api(`/change-proposals/${p.id}/diff`);
      this.setState({ preview, inspected: p.id });
    }, "\u5DF2\u51C6\u5907\u56FA\u5B9A\u53D8\u66F4\uFF1B\u8BF7\u68C0\u67E5\u524D\u540E\u5185\u5BB9\u518D\u6279\u51C6");
  }
  render() {
    const { data, perform } = this.props, proposals = data.changeProposals ?? [];
    const selectable = data.artifacts.filter((a) => !a.taskId || data.tasks.some((t) => t.id === a.taskId && t.acceptance === "accepted" && t.execution === "output_submitted" && t.result?.artifactIds.includes(a.id)));
    return /* @__PURE__ */ jsxs("div", { className: "page-scroll", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u53D8\u66F4\u63D0\u6848", sub: "\u628A\u5DF2\u9A8C\u6536\u4EA7\u7269\u6574\u5408\u4E3A\u65B0\u5B50\u5B9E\u9A8C\uFF0C\u800C\u4E0D\u662F\u8986\u76D6\u5171\u4EAB\u4EE3\u7801\u3002" }),
      /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u6574\u5408\u4E0D\u4F1A\u81EA\u52A8\u8FD0\u884C\u6D4B\u8BD5\u6216\u6B63\u5F0F\u8BA1\u7B97\u3002\u5F53\u524D\u53EA\u652F\u6301\u6587\u672C\u6587\u4EF6\uFF1B\u8FD0\u884C\u4ECD\u9700\u5355\u72EC\u6279\u51C6\u3002\u6CA1\u6709\u6D4B\u8BD5\u8BB0\u5F55\u4E0D\u8868\u793A\u6D4B\u8BD5\u901A\u8FC7\u3002" }),
      /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u4F20\u7EDF\u4EA7\u7269\u53D8\u66F4\u5165\u53E3" }) }),
        /* @__PURE__ */ jsxs("form", { className: "form-body", onSubmit: (e) => {
          e.preventDefault();
          void this.prepare();
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u7236\u5B9E\u9A8C",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u7236\u5B9E\u9A8C", required: true, value: this.state.baseId, onChange: (e) => this.setState({ baseId: e.target.value }), children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u56FA\u5B9A\u57FA\u51C6" }),
              data.experiments.filter((e) => e.lifecycle !== "archived").map((e) => /* @__PURE__ */ jsxs("option", { value: e.id, children: [
                e.title,
                " \xB7 \u4FEE\u8BA2 ",
                e.revision
              ] }, e.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u4EE3\u7801\u6216\u914D\u7F6E\u4EA7\u7269",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u4EE3\u7801\u6216\u914D\u7F6E\u4EA7\u7269", required: true, value: this.state.artifactId, onChange: (e) => {
              const a = selectable.find((a2) => a2.id === e.target.value);
              this.setState({ artifactId: e.target.value, path: a?.title ?? this.state.path });
            }, children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u4E0D\u53EF\u53D8\u6587\u672C\u4EA7\u7269" }),
              selectable.map((a) => /* @__PURE__ */ jsxs("option", { value: a.id, children: [
                a.title,
                " \xB7 ",
                short(a.id)
              ] }, a.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u76EE\u6807\u76F8\u5BF9\u8DEF\u5F84",
            /* @__PURE__ */ jsx("input", { "aria-label": "\u76EE\u6807\u76F8\u5BF9\u8DEF\u5F84", required: true, value: this.state.path, onChange: (e) => this.setState({ path: e.target.value }), placeholder: "\u4F8B\u5982 config.json \u6216 src/model.py" })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u65B0\u5B50\u5B9E\u9A8C\u540D\u79F0",
            /* @__PURE__ */ jsx("input", { required: true, "aria-label": "\u65B0\u5B50\u5B9E\u9A8C\u540D\u79F0", value: this.state.title, onChange: (e) => this.setState({ title: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u7814\u7A76\u53D8\u5316\u4E0E\u4F9D\u636E",
            /* @__PURE__ */ jsx("textarea", { required: true, "aria-label": "\u7814\u7A76\u53D8\u5316\u4E0E\u4F9D\u636E", value: this.state.hypothesis, onChange: (e) => this.setState({ hypothesis: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: !selectable.length || !data.experiments.length, children: "\u51C6\u5907\u5E76\u9884\u89C8" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u6574\u5408\u8BB0\u5F55" }) }),
        !proposals.length ? /* @__PURE__ */ jsx(Empty, { title: "\u5C1A\u672A\u51C6\u5907\u53D8\u66F4\u63D0\u6848", children: /* @__PURE__ */ jsx("p", { children: "\u5148\u8BA9\u4E3B\u52A9\u624B\u6216\u5B9E\u73B0\u52A9\u624B\u4FDD\u5B58\u5B9E\u9645\u6587\u4EF6\u4EA7\u7269\uFF1B\u52A9\u624B\u4EA7\u7269\u987B\u5B8C\u6210\u9A8C\u6536\uFF0C\u518D\u9009\u62E9\u7236\u5B9E\u9A8C\u3002" }) }) : proposals.slice().reverse().map((p) => {
          const a = data.approvals.find((a2) => a2.id === p.approvalId);
          return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              p.title,
              " ",
              /* @__PURE__ */ jsx(Badge, { value: p.state })
            ] }),
            /* @__PURE__ */ jsx("p", { children: p.hypothesis }),
            p.reviewId ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
              "\u53D7\u5BA1\u6D41\u7A0B \xB7 \u5BA1\u67E5 ",
              short(p.reviewId),
              " \xB7 \u6D4B\u8BD5 ",
              short(p.testJobId)
            ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4F20\u7EDF\u6D41\u7A0B\u8BB0\u5F55\uFF1B\u4E0D\u4EE3\u8868\u901A\u8FC7\u672C\u6B21\u72EC\u7ACB\u5BA1\u67E5\u95E8\u3002" }),
            p.sourceValidity === "stale" ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u6765\u6E90\u5BA1\u67E5\u5DF2\u5931\u6548\u3002\u5386\u53F2\u63D0\u6848\u4FDD\u7559\uFF1B\u91CD\u65B0\u7814\u7A76\u5E76\u6279\u51C6\u540E\u624D\u80FD\u7528\u4E8E\u65B0\u64CD\u4F5C\u3002" }) : null,
            /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
              "\u57FA\u51C6 ",
              short(p.baseExperimentId),
              " \xB7 \u4FEE\u8BA2 ",
              p.baseRevision,
              " \xB7 ",
              p.changes.length,
              " \u4E2A\u6587\u4EF6 \xB7 ",
              p.testsStatus === "passed" ? "\u5DF2\u901A\u8FC7\u7ED1\u5B9A\u6E90\u7801\u7684\u5F00\u53D1\u68C0\u67E5" : "\u672A\u8FD0\u884C\u5F00\u53D1\u6D4B\u8BD5"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
              /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => void this.preview(p.id), children: "\u67E5\u770B\u56FA\u5B9A\u5DEE\u5F02" }),
              p.state === "prepared" && p.sourceValidity !== "stale" && a?.status === "pending" ? /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: this.state.inspected !== p.id, onClick: () => perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: true }), "\u5DF2\u6279\u51C6\u56FA\u5B9A\u53D8\u66F4\uFF1B\u5C1A\u672A\u521B\u5EFA\u5B50\u5B9E\u9A8C"), children: "\u6279\u51C6\u53D8\u66F4" }),
                /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: false })), children: "\u62D2\u7EDD" })
              ] }) : null,
              p.state === "prepared" && p.sourceValidity !== "stale" && a?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary compact", onClick: () => perform(() => api(`/change-proposals/${p.id}/apply`, {}), "\u65B0\u5B50\u5B9E\u9A8C\u5DF2\u521B\u5EFA\uFF1B\u6CA1\u6709\u542F\u52A8\u8BA1\u7B97"), children: "\u521B\u5EFA\u65B0\u5B50\u5B9E\u9A8C" }) : null
            ] }),
            p.appliedExperimentId ? /* @__PURE__ */ jsxs("p", { children: [
              "\u5DF2\u521B\u5EFA\u5B50\u5B9E\u9A8C\uFF1A",
              /* @__PURE__ */ jsx("code", { children: p.appliedExperimentId })
            ] }) : null
          ] }, p.id);
        })
      ] }),
      this.state.preview ? /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
          /* @__PURE__ */ jsx("h2", { children: "\u56FA\u5B9A\u5185\u5BB9\u524D\u540E\u5BF9\u7167" }),
          /* @__PURE__ */ jsx("span", { className: "small muted", children: short(this.state.preview.proposal.digest) })
        ] }),
        this.state.preview.files.map((f) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsx("h3", { children: f.path }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u6587\u4EF6\u6A21\u5F0F ",
            f.beforeMode ?? "\u672A\u8BB0\u5F55",
            " \u2192 ",
            f.afterMode ?? "\u672A\u8BB0\u5F55"
          ] }),
          /* @__PURE__ */ jsxs("details", { open: true, children: [
            /* @__PURE__ */ jsxs("summary", { children: [
              "\u53D8\u66F4\u524D \xB7 ",
              f.expectedDigest ?? "\u4E0D\u5B58\u5728"
            ] }),
            /* @__PURE__ */ jsx("pre", { className: "file-preview", children: f.before ?? "\uFF08\u65B0\u589E\u6587\u4EF6\uFF09" })
          ] }),
          /* @__PURE__ */ jsxs("details", { open: true, children: [
            /* @__PURE__ */ jsxs("summary", { children: [
              "\u53D8\u66F4\u540E \xB7 ",
              f.artifactDigest ?? "\u5220\u9664"
            ] }),
            /* @__PURE__ */ jsx("pre", { className: "file-preview", children: f.after ?? "\uFF08\u5220\u9664\u6587\u4EF6\uFF09" })
          ] })
        ] }, f.path))
      ] }) : null
    ] });
  }
}
export {
  ChangesView
};
