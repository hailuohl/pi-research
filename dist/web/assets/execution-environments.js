import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { nativeSelectButton } from "./ui.js";
const backendNames = { local: "\u672C\u5730", docker: "Docker", ssh: "SSH" };
class ExecutionEnvironments extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { catalog: null, backend: "local", busy: false, error: "", notice: "" };
    this.mounted = false;
    this.epoch = 0;
    this.onFocus = () => {
      void this.load();
    };
  }
  componentDidMount() {
    this.mounted = true;
    window.addEventListener("focus", this.onFocus);
    void this.load();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    window.removeEventListener("focus", this.onFocus);
  }
  componentDidUpdate(prev) {
    if (prev.projectId !== this.props.projectId) {
      this.epoch++;
      this.setState({ catalog: null, error: "", notice: "", busy: false });
      void this.load();
    }
  }
  call(name, input = {}) {
    return api(`/operations/${name}`, { projectId: this.props.projectId, input });
  }
  async load() {
    const epoch = ++this.epoch;
    try {
      const catalog = await this.call("execution_environment_list");
      if (this.mounted && epoch === this.epoch) this.setState({ catalog });
    } catch (e) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: String(e) });
    }
  }
  async mutate(name, input, notice, form) {
    if (this.state.busy) return;
    const projectId = this.props.projectId;
    this.setState({ busy: true, error: "", notice: "" });
    try {
      await this.call(name, input);
      if (this.mounted && projectId === this.props.projectId) {
        form?.reset();
        this.setState({ notice });
        await this.load();
      }
    } catch (e) {
      if (this.mounted && projectId === this.props.projectId) this.setState({ error: String(e) });
    } finally {
      if (this.mounted && projectId === this.props.projectId) this.setState({ busy: false });
    }
  }
  configureRuntime(form) {
    const fd = new FormData(form), id = String(fd.get("id")).trim();
    return this.mutate("local_runtime_configure", { id, executable: String(fd.get("executable")).trim(), expectedVersion: this.state.catalog?.local.runtimes.find((r) => r.id === id)?.version ?? 0 }, "\u672C\u5730\u8FD0\u884C\u73AF\u5883\u5DF2\u4FDD\u5B58\u3002", form);
  }
  configureSsh(form) {
    const fd = new FormData(form), id = String(fd.get("id")).trim();
    return this.mutate("ssh_target_configure", { id, host: String(fd.get("host")).trim(), user: String(fd.get("user")).trim(), port: Number(fd.get("port")), identityFile: String(fd.get("identityFile")).trim(), knownHostsFile: String(fd.get("knownHostsFile")).trim(), remoteRoot: String(fd.get("remoteRoot")).trim(), expectedVersion: this.state.catalog?.sshTargets.find((t) => t.id === id)?.version ?? 0, gpuProtocol: true }, "SSH \u914D\u7F6E\u5DF2\u4FDD\u5B58\uFF0C\u8BF7\u6838\u5BF9\u76EE\u6807\u3002", form);
  }
  probe(form) {
    const fd = new FormData(form), backend = this.state.backend;
    const optional = (key) => {
      const value = String(fd.get(key) ?? "").trim();
      return value ? { [key]: value } : {};
    };
    return this.mutate("gpu_target_probe", { backend, ...backend === "local" ? optional("localRuntimeId") : backend === "docker" ? optional("context") : optional("sshTargetId"), ...backend !== "local" ? optional("image") : {} }, "NVIDIA \u8BBE\u5907\u5DF2\u6838\u5BF9\uFF1B\u5B9E\u9645\u5B9E\u9A8C\u4ECD\u9700\u5355\u72EC\u6279\u51C6\u548C\u8FD0\u884C\u3002");
  }
  render() {
    const { catalog: c, backend, busy, error, notice } = this.state;
    return /* @__PURE__ */ jsxs("section", { className: "surface report-builder", "aria-label": "\u6267\u884C\u73AF\u5883", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u6267\u884C\u73AF\u5883" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u5730\u3001Docker\u3001SSH\u3002CPU \u53EF\u72EC\u7ACB\u4F7F\u7528\uFF1BGPU \u9996\u671F\u652F\u6301 NVIDIA\u3002\u914D\u7F6E\u4FDD\u5B58\u5728\u5F53\u524D\u7535\u8111\uFF0C\u8FD4\u56DE\u7A97\u53E3\u65F6\u81EA\u52A8\u66F4\u65B0\u3002" }),
      error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: error }) : null,
      notice ? /* @__PURE__ */ jsx("p", { role: "status", children: notice }) : null,
      !c ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8FD0\u884C\u73AF\u5883\u2026" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            "\u672C\u5730\u8FD0\u884C\u73AF\u5883 \xB7 ",
            c.local.runtimes.length,
            " \u4E2A"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u5730\u4EE3\u7801\u4F7F\u7528\u5F53\u524D\u7CFB\u7EDF\u7528\u6237\u6743\u9650\uFF0C\u6587\u4EF6\u4E0E\u7F51\u7EDC\u4E0D\u9694\u79BB\uFF1BCPU\u3001\u5185\u5B58\u4E3A\u8C03\u5EA6\u9884\u7B97\u3002\u4EC5\u8FD0\u884C\u4F60\u4FE1\u4EFB\u7684\u4EE3\u7801\u3002" }),
          c.local.runtimes.map((r) => /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("code", { children: r.id }),
            " \xB7 ",
            r.runtimeVersion,
            " \xB7 ",
            r.platform,
            " \xB7 \u7248\u672C ",
            r.version
          ] }, r.id)),
          /* @__PURE__ */ jsx("form", { onSubmit: (e) => {
            e.preventDefault();
            void this.configureRuntime(e.currentTarget);
          }, children: /* @__PURE__ */ jsxs("fieldset", { disabled: busy, children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u8FD0\u884C\u73AF\u5883\u540D\u79F0",
              /* @__PURE__ */ jsx("input", { name: "id", "aria-label": "\u8FD0\u884C\u73AF\u5883\u540D\u79F0", required: true, maxLength: 80, placeholder: "\u4F8B\u5982 python \u6216 node" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u53EF\u6267\u884C\u7A0B\u5E8F",
              /* @__PURE__ */ jsx("input", { name: "executable", "aria-label": "\u53EF\u6267\u884C\u7A0B\u5E8F", required: true, maxLength: 2e3, placeholder: "\u5DF2\u6709\u7A0B\u5E8F\u7684\u540D\u79F0\u6216\u5B8C\u6574\u8DEF\u5F84" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4F7F\u7528\u672C\u673A\u5DF2\u6709\u7A0B\u5E8F\uFF0C\u4E0D\u81EA\u52A8\u5B89\u88C5\u3002NVIDIA \u9A8C\u8BC1\u9700\u8981 Python\uFF1B\u540C\u540D\u4FDD\u5B58\u4F1A\u66F4\u65B0\u914D\u7F6E\uFF0C\u4F7F\u7528\u4E2D\u7684\u73AF\u5883\u4E0D\u53EF\u66FF\u6362\u3002" }),
            /* @__PURE__ */ jsx("button", { className: "secondary", children: "\u4FDD\u5B58\u8FD0\u884C\u73AF\u5883" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            "SSH \u76EE\u6807 \xB7 ",
            c.sshTargets.length,
            " \u4E2A"
          ] }),
          c.sshTargets.map((t) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("code", { children: t.id }),
              " \xB7 ",
              "verified" in t ? "\u5F85\u6838\u5BF9" : t.gpuProtocol ? "\u5DF2\u6838\u5BF9 \xB7 CPU / NVIDIA" : "\u65E7\u7248\u534F\u8BAE \xB7 \u4EC5\u5DF2\u6709\u4F5C\u4E1A"
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "text-button", disabled: busy, onClick: () => void this.mutate("ssh_target_probe", { id: t.id }, "SSH \u76EE\u6807\u5DF2\u6838\u5BF9\u3002"), children: [
              "\u6838\u5BF9 ",
              t.id
            ] })
          ] }, t.id)),
          /* @__PURE__ */ jsx("form", { onSubmit: (e) => {
            e.preventDefault();
            void this.configureSsh(e.currentTarget);
          }, children: /* @__PURE__ */ jsxs("fieldset", { disabled: busy, children: [
            [{ name: "id", label: "\u76EE\u6807\u540D\u79F0", max: 80 }, { name: "host", label: "SSH \u4E3B\u673A", max: 253 }, { name: "user", label: "SSH \u7528\u6237", max: 64 }, { name: "identityFile", label: "\u672C\u673A\u79C1\u94A5\u6587\u4EF6\u8DEF\u5F84", max: 2e3 }, { name: "knownHostsFile", label: "\u672C\u673A known_hosts \u6587\u4EF6\u8DEF\u5F84", max: 2e3 }, { name: "remoteRoot", label: "\u8FDC\u7AEF\u5DE5\u4F5C\u76EE\u5F55", max: 500 }].map((f) => /* @__PURE__ */ jsxs("label", { children: [
              f.label,
              /* @__PURE__ */ jsx("input", { name: f.name, "aria-label": f.label, required: true, maxLength: f.max, autoComplete: "off" })
            ] }, f.name)),
            /* @__PURE__ */ jsxs("label", { children: [
              "SSH \u7AEF\u53E3",
              /* @__PURE__ */ jsx("input", { name: "port", "aria-label": "SSH \u7AEF\u53E3", type: "number", min: 1, max: 65535, defaultValue: 22, required: true })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8FDC\u7AEF\u9700\u8981 Docker \u548C\u65B0\u7248 ssh-runner-gpu.py\uFF1BCPU \u4E0D\u9700\u8981\u663E\u5361\u3002\u79C1\u94A5\u7559\u5728\u672C\u673A\uFF0C\u65E7\u76EE\u6807\u987B\u5148\u7ED3\u675F\u6216\u53D6\u6D88\u539F\u4F5C\u4E1A\uFF0C\u518D\u66F4\u65B0\u914D\u7F6E\u3002" }),
            /* @__PURE__ */ jsx("button", { className: "secondary", children: "\u4FDD\u5B58 SSH \u76EE\u6807" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            "NVIDIA \u8BBE\u5907 \xB7 ",
            c.gpuTargets.reduce((n, t) => n + t.devices.length, 0),
            " \u6761\u76EE\u6807\u8BBE\u5907\u8BB0\u5F55"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4E0B\u5217\u4E3A\u4E0A\u6B21\u6838\u5BF9\u8BB0\u5F55\uFF0C\u4E0D\u4EE3\u8868\u8BBE\u5907\u5F53\u524D\u7A7A\u95F2\u6216\u5B9E\u9A8C\u5DF2\u6210\u529F\u3002\u8FD0\u884C\u524D\u91CD\u65B0\u6838\u5BF9\u8BBE\u5907\uFF1B\u540C\u4E00\u8BBE\u5907\u7684\u5360\u7528\u5728\u672C\u5E94\u7528\u7BA1\u7406\u7684\u4F5C\u4E1A\u95F4\u5171\u4EAB\u3002\u4E3A\u517C\u5BB9\u65E7\u4F5C\u4E1A\uFF0CGPU \u4F1A\u7B49\u5F85 CPU Docker \u4F5C\u4E1A\u548C\u65E7\u7248 SSH \u4F5C\u4E1A\u7ED3\u675F\u3002" }),
          c.gpuTargets.map((t) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              backendNames[t.backend],
              t.context ? ` \xB7 ${t.context}` : t.sshTargetId ? ` \xB7 ${t.sshTargetId}` : ""
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
              "\u6838\u5BF9\u65F6\u95F4 ",
              t.observedAt
            ] }),
            t.devices.length ? t.devices.map((d) => /* @__PURE__ */ jsxs("p", { children: [
              d.name,
              " \xB7 ",
              d.memoryMb,
              " MiB",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("code", { className: "code-wrap", children: d.uuid })
            ] }, d.uuid)) : /* @__PURE__ */ jsx("p", { children: "\u672A\u53D1\u73B0 NVIDIA \u8BBE\u5907\u3002" })
          ] }, `${t.backend}:${t.context ?? t.sshTargetId ?? t.targetId}`)),
          /* @__PURE__ */ jsx("form", { onSubmit: (e) => {
            e.preventDefault();
            void this.probe(e.currentTarget);
          }, children: /* @__PURE__ */ jsxs("fieldset", { disabled: busy, children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6838\u5BF9 GPU \u7684\u6267\u884C\u4F4D\u7F6E",
              /* @__PURE__ */ jsxs("select", { "aria-label": "\u6838\u5BF9 GPU \u7684\u6267\u884C\u4F4D\u7F6E", value: backend, onChange: (e) => this.setState({ backend: e.target.value, notice: "", error: "" }), children: [
                nativeSelectButton,
                /* @__PURE__ */ jsx("option", { value: "local", children: "\u672C\u5730" }),
                /* @__PURE__ */ jsx("option", { value: "docker", children: "Docker" }),
                /* @__PURE__ */ jsx("option", { value: "ssh", children: "SSH" })
              ] })
            ] }),
            backend === "local" ? /* @__PURE__ */ jsxs("label", { children: [
              "Python \u8FD0\u884C\u73AF\u5883",
              /* @__PURE__ */ jsxs("select", { name: "localRuntimeId", "aria-label": "Python \u8FD0\u884C\u73AF\u5883", required: true, children: [
                nativeSelectButton,
                /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u5DF2\u4FDD\u5B58\u7684 Python" }),
                c.local.runtimes.filter((r) => /^Python\s/i.test(r.runtimeVersion)).map((r) => /* @__PURE__ */ jsxs("option", { value: r.id, children: [
                  r.id,
                  " \xB7 ",
                  r.runtimeVersion
                ] }, r.id))
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              backend === "docker" ? /* @__PURE__ */ jsxs("label", { children: [
                "Docker context",
                /* @__PURE__ */ jsx("input", { name: "context", "aria-label": "GPU \u7684 Docker context", maxLength: 100, placeholder: "\u7559\u7A7A\u4F7F\u7528\u672C\u673A\u5F53\u524D context" })
              ] }) : /* @__PURE__ */ jsxs("label", { children: [
                "SSH \u76EE\u6807",
                /* @__PURE__ */ jsxs("select", { name: "sshTargetId", "aria-label": "GPU \u7684 SSH \u76EE\u6807", required: true, children: [
                  nativeSelectButton,
                  /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u5DF2\u6838\u5BF9\u7684 GPU \u76EE\u6807" }),
                  c.sshTargets.filter((t) => "gpuProtocol" in t && t.gpuProtocol).map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.id }, t.id))
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "\u76EE\u6807\u4E0A\u5DF2\u6709\u7684\u56FA\u5B9A\u955C\u50CF",
                /* @__PURE__ */ jsx("input", { name: "image", "aria-label": "GPU \u6838\u5BF9\u955C\u50CF", required: true, maxLength: 250, placeholder: "\u4F8B\u5982 python@sha256:\u2026" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { className: "secondary", children: busy ? "\u6B63\u5728\u5904\u7406\u2026" : "\u6838\u5BF9 NVIDIA \u8BBE\u5907" })
          ] }) })
        ] })
      ] })
    ] });
  }
}
export {
  ExecutionEnvironments
};
