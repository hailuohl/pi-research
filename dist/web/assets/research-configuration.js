import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
class PublicationCompilerConfiguration extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { status: null, context: "desktop-linux", image: "", error: "" };
    this.mounted = true;
  }
  componentDidMount() {
    void this.load();
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  async load() {
    try {
      const status = await api("/operations/publication_status", { projectId: this.props.projectId, input: {} });
      if (this.mounted) this.setState({ status, context: status.configuration?.dockerContext ?? "desktop-linux", image: status.configuration?.imageDigest ?? "" });
    } catch (error) {
      if (this.mounted) this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  render() {
    return /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u56FA\u5B9A\u6587\u7A3F\u7F16\u8BD1\u73AF\u5883" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u53EA\u914D\u7F6E\u5DF2\u5B58\u5728\u7684\u955C\u50CF\uFF1B\u6587\u7A3F\u548C\u7F16\u8BD1\u4ECD\u5728\u4E3B\u4F1A\u8BDD\u4E2D\u51C6\u5907\u5E76\u786E\u8BA4\u3002" }),
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", children: this.state.error }) : null,
      /* @__PURE__ */ jsxs("form", { onSubmit: (event) => {
        event.preventDefault();
        if (this.props.readOnly || !this.state.status) return;
        void this.props.perform(async () => {
          const status = await api("/operations/publication_configure", { projectId: this.props.projectId, input: { expectedVersion: this.state.status.version, dockerContext: this.state.context, imageDigest: this.state.image.trim() } });
          if (this.mounted) this.setState({ status });
        });
      }, children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "Docker context",
          /* @__PURE__ */ jsx("input", { required: true, value: this.state.context, onChange: (event) => this.setState({ context: event.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u56FA\u5B9A\u7F16\u8BD1\u955C\u50CF\u6458\u8981",
          /* @__PURE__ */ jsx("input", { required: true, pattern: "(?:.+@)?sha256:[a-f0-9]{64}", value: this.state.image, onChange: (event) => this.setState({ image: event.target.value }) })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "secondary", disabled: this.props.readOnly || !this.state.status, children: "\u4FDD\u5B58\u7F16\u8BD1\u914D\u7F6E" })
      ] })
    ] });
  }
}
export {
  PublicationCompilerConfiguration
};
