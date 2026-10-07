import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon } from "./ui.js";
const statusLabels = { unverified: "\u5F85\u6838\u9A8C", verified: "\u8FDE\u63A5\u6B63\u5E38", stale: "\u5F85\u91CD\u65B0\u6838\u9A8C", unavailable: "\u8FDE\u63A5\u5931\u8D25" };
const gb = (mb) => `${(mb / 1024).toFixed(1)} GB`;
const checked = (at) => at ? `\u4E0A\u6B21\u6838\u9A8C ${new Date(at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "\u5C1A\u672A\u6838\u9A8C";
function Status({ connection, pending = false }) {
  const status = pending ? "unverified" : connection?.status === "verified" && (!connection.validUntil || !Number.isFinite(Date.parse(connection.validUntil)) || Date.parse(connection.validUntil) <= Date.now()) ? "stale" : connection?.status ?? "unverified";
  return /* @__PURE__ */ jsxs("span", { className: "compute-status", "data-state": status, children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": "true" }),
    statusLabels[status]
  ] });
}
class ComputeConnections extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { catalog: null, context: "", busy: "", error: "", notice: "", editor: null, gpuTarget: null };
    this.mounted = false;
    this.epoch = 0;
    this.readEpoch = 0;
    this.locked = false;
    this.editorDialog = React.createRef();
    this.gpuDialog = React.createRef();
    this.onFocus = () => {
      if (this.props.active) void this.refresh();
    };
  }
  componentDidMount() {
    this.mounted = true;
    window.addEventListener("focus", this.onFocus);
    void this.refresh();
    this.timer = setInterval(() => {
      if (this.props.active && !this.locked) void this.refresh();
    }, 2e4);
    this.expiryTimer = setInterval(() => {
      if (this.mounted && this.props.active) this.setState({});
    }, 1e3);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    this.readEpoch++;
    clearInterval(this.timer);
    clearInterval(this.expiryTimer);
    window.removeEventListener("focus", this.onFocus);
  }
  componentDidUpdate(prev) {
    if (prev.projectId !== this.props.projectId) {
      this.epoch++;
      this.readEpoch++;
      this.editorDialog.current?.close();
      this.gpuDialog.current?.close();
      this.setState({ catalog: null, context: "", error: "", notice: "", editor: null, gpuTarget: null });
      void this.refresh();
    } else if (this.props.active && (prev.refreshToken !== this.props.refreshToken || !prev.active) && !this.locked) void this.load();
  }
  current(epoch) {
    return this.mounted && epoch === this.epoch;
  }
  call(name, input = {}) {
    return api(`/operations/${name}`, { projectId: this.props.projectId, input });
  }
  async load() {
    const epoch = this.epoch, read = ++this.readEpoch;
    try {
      const catalog = await this.call("execution_environment_list");
      if (this.current(epoch) && read === this.readEpoch) this.setState({ catalog });
    } catch (e) {
      if (this.current(epoch) && read === this.readEpoch) this.setState({ error: e instanceof Error ? e.message : String(e) });
    }
  }
  async refresh() {
    const epoch = this.epoch;
    await this.load();
    if (this.current(epoch) && this.props.active && !this.props.readOnly && !this.locked && !this.state.editor && !this.state.gpuTarget) await this.probeDocker();
  }
  withdraw(name, input) {
    const c = this.state.catalog;
    if (!c) return;
    const x = input, id = name === "gpu_target_probe" ? x.sshTargetId : x.id;
    const ssh = c.connections.ssh.map((t) => {
      if (t.id !== id) return t;
      return name === "gpu_target_probe" ? { ...t, capabilities: { ...t.capabilities, gpu: false }, gpuDevices: [], gpuValidUntil: void 0 } : { ...t, status: "unverified", validUntil: void 0, capabilities: { cpu: false, gpu: false }, gpuDevices: [], gpuValidUntil: void 0 };
    });
    const docker = name === "docker_connection_probe" ? c.connections.docker.map((d) => !x.context || d.context === x.context ? { context: d.context, status: "unverified" } : d) : c.connections.docker;
    this.setState({ catalog: { ...c, connections: { docker, ssh } } });
  }
  // ponytail: one page edit at a time; use per-target locks if parallel editing becomes necessary.
  async mutate(name, input, busy, notice = "") {
    if (this.locked || this.props.readOnly) return false;
    const epoch = this.epoch;
    this.locked = true;
    this.readEpoch++;
    if (["ssh_target_probe", "ssh_target_configure", "gpu_target_probe"].includes(name)) this.withdraw(name, input);
    this.setState({ busy, error: "", notice: "" });
    let succeeded = false;
    try {
      await this.call(name, input);
      succeeded = true;
      if (this.current(epoch)) this.setState({ notice });
    } catch (e) {
      if (this.current(epoch)) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.current(epoch)) {
        await this.load();
        this.setState({ busy: "" });
      }
      this.locked = false;
    }
    return succeeded && this.current(epoch);
  }
  async probeDocker() {
    if (this.locked || this.props.readOnly) return;
    const context = this.state.context.trim(), epoch = this.epoch;
    this.locked = true;
    this.readEpoch++;
    this.withdraw("docker_connection_probe", { context });
    this.setState({ busy: "docker" });
    try {
      const connection = await this.call("docker_connection_probe", context ? { context } : {});
      if (this.current(epoch)) this.setState({ context: connection.context === "current" && connection.status === "unavailable" ? context : connection.context });
    } catch (e) {
      if (this.current(epoch)) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (this.current(epoch)) {
        await this.load();
        this.setState({ busy: "" });
      }
      this.locked = false;
    }
  }
  async preferences(target, kind, enabled) {
    const value = { cpu: target.preferences.cpu, gpu: target.preferences.gpu, [kind]: enabled };
    if (!value.cpu && !value.gpu) {
      this.setState({ error: "\u8BF7\u81F3\u5C11\u4FDD\u7559\u4E00\u79CD\u4E3B\u8981\u8C03\u7528\u8D44\u6E90\uFF1ACPU \u6216 GPU\u3002" });
      return;
    }
    await this.mutate("ssh_target_preferences_configure", { id: target.id, expectedVersion: target.preferences.version, ...value }, `preferences:${target.id}`, "\u8BA1\u7B97\u504F\u597D\u5DF2\u4FDD\u5B58\uFF0C\u4E3B Agent \u53EF\u8BFB\u53D6\u3002");
  }
  async edit(id) {
    if (this.locked || this.props.readOnly) return;
    const epoch = this.epoch;
    let editor = { id: "", version: 0, host: "", port: 22, user: "", remoteRoot: "/srv/pi-research/jobs", identityFile: "", knownHostsFile: "" };
    if (id) {
      this.locked = true;
      this.setState({ busy: `edit:${id}`, error: "" });
      try {
        editor = await this.call("ssh_target_inspect", { id });
      } catch (e) {
        if (this.current(epoch)) this.setState({ error: e instanceof Error ? e.message : String(e) });
        return;
      } finally {
        this.locked = false;
        if (this.current(epoch)) this.setState({ busy: "" });
      }
    }
    if (this.current(epoch)) this.setState({ editor, error: "", notice: "" }, () => {
      this.editorDialog.current?.showModal();
      this.editorDialog.current?.querySelector(editor.version ? "input[name=host]" : "input[name=id]")?.focus();
    });
  }
  async save(form) {
    const editor = this.state.editor;
    if (!editor) return;
    const fd = new FormData(form), value = (key) => String(fd.get(key) ?? "").trim();
    const saved = await this.mutate("ssh_target_configure", { id: value("id"), host: value("host"), port: Number(fd.get("port")), user: value("user"), remoteRoot: value("remoteRoot"), identityFile: value("identityFile"), knownHostsFile: value("knownHostsFile"), expectedVersion: editor.version, gpuProtocol: true }, "save", "SSH \u8FDE\u63A5\u5DF2\u4FDD\u5B58\uFF0C\u6838\u9A8C\u540E\u53EF\u7528\u4E8E\u8BA1\u7B97\u3002");
    if (saved) {
      this.editorDialog.current?.close();
      this.setState({ editor: null });
    }
  }
  openGpu(id) {
    this.setState({ gpuTarget: id, error: "", notice: "" }, () => {
      this.gpuDialog.current?.showModal();
      this.gpuDialog.current?.querySelector("input[name=image]")?.focus();
    });
  }
  async probeGpu(form) {
    const id = this.state.gpuTarget;
    if (!id) return;
    const fd = new FormData(form);
    if (await this.mutate("gpu_target_probe", { backend: "ssh", sshTargetId: id, image: String(fd.get("image") ?? "").trim() }, `gpu:${id}`, "GPU \u8BBE\u5907\u5DF2\u6838\u9A8C\uFF0C\u4E3B Agent \u53EF\u8BFB\u53D6\u8BBE\u5907\u4FE1\u606F\u3002")) {
      this.gpuDialog.current?.close();
      this.setState({ gpuTarget: null });
    }
  }
  render() {
    const s = this.state, c = s.catalog, disabled = !!s.busy || !!this.props.readOnly, h = c?.local.hardware, ssh = c?.connections.ssh ?? [], docker = c?.connections.docker.find((d) => d.context === s.context || !s.context && d.context === "current"), localGpu = c?.gpuTargets.filter((t) => t.backend === "local") ?? [];
    return /* @__PURE__ */ jsxs("div", { className: "compute-connections", "aria-busy": !!s.busy, children: [
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "compute-alert", children: s.error }) : null,
      s.notice ? /* @__PURE__ */ jsx("p", { role: "status", className: "compute-notice", children: s.notice }) : null,
      /* @__PURE__ */ jsxs("div", { className: "compute-overview-grid", children: [
        /* @__PURE__ */ jsxs("section", { className: "compute-card", "aria-labelledby": "local-compute-title", children: [
          /* @__PURE__ */ jsxs("header", { className: "compute-card-header", children: [
            /* @__PURE__ */ jsxs("div", { className: "compute-card-title", children: [
              /* @__PURE__ */ jsx(Icon, { name: "cpu" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { id: "local-compute-title", children: "\u672C\u5730\u8BA1\u7B97\u4FE1\u606F" }),
                /* @__PURE__ */ jsx("p", { children: "\u5F53\u524D\u7535\u8111\u7684\u786C\u4EF6\u4E0E\u8FD0\u884C\u73AF\u5883" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "compute-tag", children: "\u672C\u673A" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "compute-card-content", children: h ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "compute-metrics", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { children: "\u903B\u8F91 CPU" }),
                /* @__PURE__ */ jsxs("strong", { children: [
                  h.logicalCpus,
                  /* @__PURE__ */ jsx("small", { children: " \u6838" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { children: "\u603B\u5185\u5B58" }),
                /* @__PURE__ */ jsx("strong", { children: gb(h.totalMemoryMb) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "compute-cpu-model", children: h.cpuModel }),
            /* @__PURE__ */ jsxs("dl", { className: "compute-details", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { children: "\u7CFB\u7EDF" }),
                /* @__PURE__ */ jsxs("dd", { children: [
                  c.local.platform,
                  " \xB7 ",
                  h.arch
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { children: "\u53EF\u7528\u5185\u5B58" }),
                /* @__PURE__ */ jsx("dd", { children: gb(h.freeMemoryMb) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { children: "\u8FD0\u884C\u73AF\u5883" }),
                /* @__PURE__ */ jsx("dd", { children: c.local.runtimes.length ? c.local.runtimes.map((r) => /* @__PURE__ */ jsxs("span", { children: [
                  r.id,
                  " \xB7 ",
                  r.runtimeVersion,
                  /* @__PURE__ */ jsx("br", {})
                ] }, r.id)) : "\u5C1A\u672A\u914D\u7F6E" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { children: "GPU \u8BB0\u5F55" }),
                /* @__PURE__ */ jsx("dd", { children: localGpu.flatMap((t) => t.devices).map((d) => d.name).join("\u3001") || "\u5C1A\u65E0\u5DF2\u6838\u9A8C\u8BBE\u5907\u8BB0\u5F55" })
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx("p", { className: "compute-empty", children: "\u6B63\u5728\u8BFB\u53D6\u672C\u673A\u4FE1\u606F\u2026" }) }),
          /* @__PURE__ */ jsx("footer", { className: "compute-card-footer", children: "\u4E3B Agent \u53EF\u8BFB\u53D6\u672C\u673A\u4FE1\u606F\u4E0E\u5DF2\u4FDD\u5B58\u7684\u8FD0\u884C\u73AF\u5883\u3002" })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "compute-card", "aria-labelledby": "docker-compute-title", children: [
          /* @__PURE__ */ jsxs("header", { className: "compute-card-header", children: [
            /* @__PURE__ */ jsxs("div", { className: "compute-card-title", children: [
              /* @__PURE__ */ jsx(Icon, { name: "network" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { id: "docker-compute-title", children: "Docker \u8FDE\u63A5\u72B6\u6001" }),
                /* @__PURE__ */ jsx("p", { children: "\u8FDE\u63A5\u672C\u673A\u5DF2\u542F\u52A8\u7684 Docker \u5F15\u64CE" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Status, { connection: docker, pending: s.busy === "docker" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "compute-card-content", children: [
            /* @__PURE__ */ jsxs("form", { className: "compute-docker-form", onSubmit: (e) => {
              e.preventDefault();
              void this.probeDocker();
            }, children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "compute-docker-context", children: "Docker context" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("input", { id: "compute-docker-context", "aria-label": "Docker context", value: s.context, onChange: (e) => this.setState({ context: e.target.value }), disabled, maxLength: 100, pattern: "[A-Za-z0-9][A-Za-z0-9_.-]*", placeholder: "\u4F7F\u7528\u5F53\u524D context" }),
                /* @__PURE__ */ jsx("button", { type: "submit", className: "secondary", disabled, children: s.busy === "docker" ? "\u68C0\u6D4B\u4E2D\u2026" : "\u68C0\u6D4B\u8FDE\u63A5" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("dl", { className: "compute-details", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { children: "\u5F15\u64CE\u7248\u672C" }),
                /* @__PURE__ */ jsx("dd", { children: docker?.serverVersion ?? "\u5C1A\u672A\u53D6\u5F97" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { children: "\u5BB9\u5668\u7CFB\u7EDF" }),
                /* @__PURE__ */ jsx("dd", { children: docker?.targetId ? "Linux" : "\u5F85\u68C0\u6D4B" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { children: "\u8BA1\u7B97\u8D44\u6E90" }),
                /* @__PURE__ */ jsxs("dd", { children: [
                  docker?.cpus ? `${docker.cpus} \u6838 CPU` : "\u5F85\u68C0\u6D4B",
                  docker?.memoryMb ? ` \xB7 ${gb(docker.memoryMb)}` : ""
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "compute-observed", children: checked(docker?.checkedAt) })
          ] }),
          /* @__PURE__ */ jsx("footer", { className: "compute-card-footer", children: "\u6253\u5F00\u6B64\u9875\u65F6\u81EA\u52A8\u68C0\u6D4B\uFF1B\u8BA1\u7B97\u4EFB\u52A1\u6309\u65E2\u6709\u5BA1\u6279\u6267\u884C\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "compute-card compute-ssh", "aria-labelledby": "ssh-compute-title", children: [
        /* @__PURE__ */ jsxs("header", { className: "compute-card-header", children: [
          /* @__PURE__ */ jsxs("div", { className: "compute-card-title", children: [
            /* @__PURE__ */ jsx(Icon, { name: "link" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { id: "ssh-compute-title", children: [
                "SSH \u7BA1\u7406 ",
                /* @__PURE__ */ jsx("span", { className: "compute-count", children: ssh.length })
              ] }),
              /* @__PURE__ */ jsx("p", { children: "\u7BA1\u7406\u591A\u4E2A\u8FDC\u7A0B\u8BA1\u7B97\u8FDE\u63A5\uFF0C\u9009\u62E9\u4E3B\u8981\u8C03\u7528\u7684\u8D44\u6E90" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "primary", type: "button", disabled, onClick: () => void this.edit(), children: [
            /* @__PURE__ */ jsx(Icon, { name: "plus", size: 16 }),
            "\u65B0\u5EFA SSH \u8FDE\u63A5"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "compute-card-content", children: !c ? /* @__PURE__ */ jsx("p", { className: "compute-empty", children: "\u6B63\u5728\u8BFB\u53D6 SSH \u8FDE\u63A5\u2026" }) : !ssh.length ? /* @__PURE__ */ jsxs("div", { className: "compute-ssh-empty", children: [
          /* @__PURE__ */ jsx(Icon, { name: "network", size: 30 }),
          /* @__PURE__ */ jsx("h3", { children: "\u6DFB\u52A0\u7B2C\u4E00\u53F0\u8FDC\u7A0B\u8BA1\u7B97\u673A" }),
          /* @__PURE__ */ jsx("p", { children: "\u8FDE\u63A5\u5DF2\u914D\u7F6E SSH \u4E0E\u8BA1\u7B97\u76D1\u7BA1\u5668\u7684\u670D\u52A1\u5668\uFF0C\u6838\u9A8C\u540E\u4F9B\u4E3B Agent \u9009\u7528\u3002" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled, onClick: () => void this.edit(), children: "\u65B0\u5EFA SSH \u8FDE\u63A5" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "compute-ssh-list", children: ssh.map((t) => {
          const pending = s.busy === `ssh:${t.id}`, usable = !pending && t.status === "verified" && !!t.validUntil && Date.parse(t.validUntil) > Date.now(), gpuUsable = usable && s.busy !== `gpu:${t.id}` && t.capabilities.gpu && !!t.gpuValidUntil && Date.parse(t.gpuValidUntil) > Date.now();
          return /* @__PURE__ */ jsxs("article", { className: "compute-ssh-row", children: [
            /* @__PURE__ */ jsxs("div", { className: "compute-ssh-identity", children: [
              /* @__PURE__ */ jsxs("div", { className: "compute-ssh-heading", children: [
                /* @__PURE__ */ jsx("h3", { children: t.id }),
                /* @__PURE__ */ jsx(Status, { connection: t, pending })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "compute-address", children: t.user && t.host ? `${t.user}@${t.host}:${t.port ?? 22}` : "\u8FDC\u7A0B\u8BA1\u7B97\u76EE\u6807" }),
              /* @__PURE__ */ jsx("p", { className: "compute-observed", children: checked(t.checkedAt) }),
              /* @__PURE__ */ jsxs("p", { className: "compute-capability", children: [
                "CPU ",
                usable && t.capabilities.cpu ? "\u5DF2\u6838\u9A8C" : "\u5F85\u6838\u9A8C",
                " \xB7 GPU ",
                gpuUsable ? `${t.gpuDevices.length} \u5757\u5DF2\u6838\u9A8C` : "\u5C1A\u672A\u786E\u8BA4"
              ] }),
              gpuUsable && t.gpuDevices.length ? /* @__PURE__ */ jsx("p", { className: "compute-device-names", children: t.gpuDevices.map((d) => d.name).join("\u3001") }) : null
            ] }),
            /* @__PURE__ */ jsxs("fieldset", { className: "compute-preferences", disabled, children: [
              /* @__PURE__ */ jsxs("legend", { children: [
                t.id,
                " \u4E3B\u8981\u8C03\u7528"
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("label", { children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", checked: t.preferences.cpu, "aria-label": `${t.id} \u4E3B\u8981\u8C03\u7528 CPU`, onChange: (e) => void this.preferences(t, "cpu", e.target.checked) }),
                  /* @__PURE__ */ jsx("span", { children: "CPU" })
                ] }),
                /* @__PURE__ */ jsxs("label", { children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", checked: t.preferences.gpu, "aria-label": `${t.id} \u4E3B\u8981\u8C03\u7528 GPU`, onChange: (e) => void this.preferences(t, "gpu", e.target.checked) }),
                  /* @__PURE__ */ jsx("span", { children: "GPU" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "compute-ssh-actions", children: [
              /* @__PURE__ */ jsx("button", { className: "secondary", type: "button", disabled, onClick: () => void this.mutate("ssh_target_probe", { id: t.id }, `ssh:${t.id}`, "SSH \u8FDE\u63A5\u5DF2\u6838\u9A8C\u3002"), children: s.busy === `ssh:${t.id}` ? "\u6838\u9A8C\u4E2D\u2026" : "\u6838\u9A8C\u8FDE\u63A5" }),
              /* @__PURE__ */ jsx("button", { className: "text-button", type: "button", disabled, onClick: () => void this.openGpu(t.id), children: "\u6838\u9A8C GPU" }),
              /* @__PURE__ */ jsx("button", { className: "text-button", type: "button", disabled, onClick: () => void this.edit(t.id), children: "\u7F16\u8F91" })
            ] })
          ] }, t.id);
        }) }) }),
        /* @__PURE__ */ jsxs("footer", { className: "compute-card-footer", children: [
          /* @__PURE__ */ jsx(Icon, { name: "check", size: 15 }),
          /* @__PURE__ */ jsx("span", { children: "\u8FDE\u63A5\u72B6\u6001\u3001\u8D44\u6E90\u504F\u597D\u4E0E\u5DF2\u6838\u9A8C\u8BBE\u5907\u4F1A\u63D0\u4F9B\u7ED9\u4E3B Agent\uFF1B\u504F\u597D\u53EA\u7528\u4E8E\u9009\u578B\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("dialog", { ref: this.editorDialog, className: "compute-dialog", "aria-labelledby": "ssh-editor-title", onCancel: () => this.setState({ editor: null }), onClose: () => {
        if (this.state.editor) this.setState({ editor: null });
      }, children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { id: "ssh-editor-title", children: s.editor?.version ? "\u7F16\u8F91 SSH \u8FDE\u63A5" : "\u65B0\u5EFA SSH \u8FDE\u63A5" }),
            /* @__PURE__ */ jsx("p", { children: "\u4F7F\u7528\u672C\u673A\u5DF2\u6709\u5BC6\u94A5\uFF0C\u8FDE\u63A5\u53D7\u4FE1\u4EFB\u7684\u8FDC\u7A0B\u8BA1\u7B97\u73AF\u5883\u3002" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", "aria-label": "\u5173\u95ED SSH \u8FDE\u63A5\u8868\u5355", onClick: () => this.editorDialog.current?.close(), children: /* @__PURE__ */ jsx(Icon, { name: "close" }) })
        ] }),
        s.editor ? /* @__PURE__ */ jsx("form", { onSubmit: (e) => {
          e.preventDefault();
          void this.save(e.currentTarget);
        }, children: /* @__PURE__ */ jsxs("fieldset", { disabled, children: [
          /* @__PURE__ */ jsx("legend", { className: "sr-only", children: "SSH \u8FDE\u63A5\u914D\u7F6E" }),
          /* @__PURE__ */ jsxs("div", { className: "compute-field-group", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u8FDE\u63A5\u540D\u79F0",
              /* @__PURE__ */ jsx("input", { name: "id", defaultValue: s.editor.id, readOnly: s.editor.version > 0, autoFocus: true, required: true, pattern: "[A-Za-z0-9][A-Za-z0-9_-]*", maxLength: 80, placeholder: "\u4F8B\u5982 gpu-server" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u7528\u6237\u540D",
              /* @__PURE__ */ jsx("input", { name: "user", defaultValue: s.editor.user, required: true, maxLength: 64, autoComplete: "off", placeholder: "research" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u4E3B\u673A\u5730\u5740",
              /* @__PURE__ */ jsx("input", { name: "host", defaultValue: s.editor.host, required: true, maxLength: 253, placeholder: "IP \u5730\u5740\u6216\u4E3B\u673A\u540D", autoComplete: "off" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u7AEF\u53E3",
              /* @__PURE__ */ jsx("input", { name: "port", defaultValue: s.editor.port, required: true, type: "number", min: 1, max: 65535 })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "compute-field-wide", children: [
              "\u8FDC\u7AEF\u5DE5\u4F5C\u76EE\u5F55",
              /* @__PURE__ */ jsx("input", { name: "remoteRoot", defaultValue: s.editor.remoteRoot, required: true, maxLength: 500 })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "compute-field-wide", children: [
              "\u672C\u673A\u79C1\u94A5\u6587\u4EF6\u8DEF\u5F84",
              /* @__PURE__ */ jsx("input", { name: "identityFile", defaultValue: s.editor.identityFile, required: true, maxLength: 2e3, autoComplete: "off", placeholder: "\u5DF2\u6709\u79C1\u94A5\u6587\u4EF6\u7684\u5B8C\u6574\u8DEF\u5F84" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "compute-field-wide", children: [
              "\u672C\u673A known_hosts \u6587\u4EF6\u8DEF\u5F84",
              /* @__PURE__ */ jsx("input", { name: "knownHostsFile", defaultValue: s.editor.knownHostsFile, required: true, maxLength: 2e3, autoComplete: "off", placeholder: "\u5DF2\u56FA\u5B9A\u670D\u52A1\u5668\u4E3B\u673A\u5BC6\u94A5\u7684\u6587\u4EF6\u8DEF\u5F84" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "compute-form-hint", children: "\u8FDC\u7AEF\u9700\u5B89\u88C5 Docker \u548C\u5F53\u524D SSH \u76D1\u7BA1\u5668\u3002\u5BC6\u94A5\u6587\u4EF6\u7559\u5728\u672C\u673A\uFF0C\u4E3B Agent \u4E0D\u4F1A\u6536\u5230\u5BC6\u94A5\u6216\u6587\u4EF6\u8DEF\u5F84\u3002" }),
          s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "compute-alert", children: s.error }) : null,
          /* @__PURE__ */ jsxs("footer", { children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", onClick: () => this.editorDialog.current?.close(), children: "\u53D6\u6D88" }),
            /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", children: s.busy === "save" ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u8FDE\u63A5" })
          ] })
        ] }) }) : null
      ] }),
      /* @__PURE__ */ jsxs("dialog", { ref: this.gpuDialog, className: "compute-dialog compute-gpu-dialog", "aria-labelledby": "ssh-gpu-title", onCancel: () => this.setState({ gpuTarget: null }), onClose: () => {
        if (this.state.gpuTarget) this.setState({ gpuTarget: null });
      }, children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { id: "ssh-gpu-title", children: "\u6838\u9A8C SSH \u7684 GPU \u8BBE\u5907" }),
            /* @__PURE__ */ jsx("p", { children: s.gpuTarget })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", "aria-label": "\u5173\u95ED GPU \u6838\u9A8C", onClick: () => this.gpuDialog.current?.close(), children: /* @__PURE__ */ jsx(Icon, { name: "close" }) })
        ] }),
        /* @__PURE__ */ jsx("form", { onSubmit: (e) => {
          e.preventDefault();
          void this.probeGpu(e.currentTarget);
        }, children: /* @__PURE__ */ jsxs("fieldset", { disabled, children: [
          /* @__PURE__ */ jsx("legend", { className: "sr-only", children: "GPU \u6838\u9A8C\u914D\u7F6E" }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u76EE\u6807\u4E0A\u5DF2\u6709\u7684\u56FA\u5B9A\u955C\u50CF",
            /* @__PURE__ */ jsx("input", { name: "image", required: true, maxLength: 250, placeholder: "python@sha256:\u2026", pattern: "[^ ]+@sha256:[a-f0-9]{64}" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "compute-form-hint", children: "\u6838\u9A8C\u4F1A\u5728\u76EE\u6807\u4E0A\u4F7F\u7528\u8BE5\u955C\u50CF\u68C0\u67E5 NVIDIA \u8BBE\u5907\u3002CPU \u8FDE\u63A5\u65E0\u9700\u8FDB\u884C\u6B64\u9879\u6838\u9A8C\u3002" }),
          s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "compute-alert", children: s.error }) : null,
          /* @__PURE__ */ jsxs("footer", { children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", onClick: () => this.gpuDialog.current?.close(), children: "\u53D6\u6D88" }),
            /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", children: s.busy.startsWith("gpu:") ? "\u6838\u9A8C\u4E2D\u2026" : "\u6838\u9A8C GPU" })
          ] })
        ] }) })
      ] })
    ] });
  }
}
export {
  ComputeConnections
};
