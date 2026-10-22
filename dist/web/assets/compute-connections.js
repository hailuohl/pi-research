import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon } from "./ui.js";
const statusLabels = { unverified: "\u5F85\u6838\u9A8C", verified: "\u8FDE\u63A5\u6B63\u5E38", stale: "\u5F85\u91CD\u65B0\u6838\u9A8C", unavailable: "\u8FDE\u63A5\u5931\u8D25" };
const gb = (mb) => `${(mb / 1024).toFixed(1)} GB`;
const checked = (at) => at ? `\u4E0A\u6B21\u6838\u9A8C ${new Date(at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "\u5C1A\u672A\u6838\u9A8C";
const sshMessages = { SSH_PYTHON_REQUIRED: "\u670D\u52A1\u5668\u9700\u8981\u5148\u5B89\u88C5 Python 3\u3002", SSH_LINUX_REQUIRED: "\u5F53\u524D\u8BA1\u7B97\u8FDE\u63A5\u9700\u8981 Linux \u670D\u52A1\u5668\u3002", SSH_AUTHENTICATION_FAILED: "SSH \u8EAB\u4EFD\u8BA4\u8BC1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u8D26\u53F7\u4E0E\u79C1\u94A5\u3002", SSH_HOST_KEY_CHANGED: "\u670D\u52A1\u5668\u6307\u7EB9\u4E0E\u5DF2\u786E\u8BA4\u8EAB\u4EFD\u4E0D\u7B26\uFF0C\u8BF7\u6838\u5B9E\u670D\u52A1\u5668\u8EAB\u4EFD\u3002", SSH_SETUP_PERMISSION_REQUIRED: "\u5B89\u88C5\u76D1\u7BA1\u5668\u9700\u8981 root \u6216\u514D\u4EA4\u4E92 sudo \u6743\u9650\uFF0C\u8BF7\u8054\u7CFB\u670D\u52A1\u5668\u7BA1\u7406\u5458\u3002", SSH_SUPERVISOR_MISSING: "\u76D1\u7BA1\u5668\u5C1A\u672A\u5B89\u88C5\uFF0C\u53EF\u4EE5\u91CD\u8BD5\u73AF\u5883\u51C6\u5907\u3002", SSH_PROTOCOL_MISMATCH: "\u5DF2\u6709\u76D1\u7BA1\u5668\u7248\u672C\u4E0D\u5339\u914D\uFF0C\u5E94\u7528\u4F1A\u4FDD\u7559\u5B83\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u5904\u7406\u3002", SSH_SUPERVISOR_UNSAFE: "\u76D1\u7BA1\u5668\u8DEF\u5F84\u6216\u6743\u9650\u4E0D\u7B26\u5408\u8981\u6C42\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u68C0\u67E5\u3002", SSH_WORKSPACE_MISSING: "\u8FDC\u7AEF\u5DE5\u4F5C\u76EE\u5F55\u5C1A\u672A\u51C6\u5907\u597D\uFF0C\u53EF\u4EE5\u91CD\u8BD5\u73AF\u5883\u51C6\u5907\u3002", SSH_WORKSPACE_INVALID: "\u5DF2\u6709\u5DE5\u4F5C\u76EE\u5F55\u7684\u5F52\u5C5E\u6216\u6743\u9650\u4E0D\u7B26\u5408\u8981\u6C42\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u5904\u7406\u3002", SSH_DOCKER_MISSING: "\u670D\u52A1\u5668\u5C1A\u672A\u5B89\u88C5 Docker\uFF0C\u8BF7\u5B89\u88C5\u540E\u91CD\u65B0\u68C0\u6D4B\u8FDE\u63A5\u3002", SSH_DOCKER_UNAVAILABLE: "Docker \u5DF2\u5B89\u88C5\u4F46\u65E0\u6CD5\u8BBF\u95EE\uFF0C\u8BF7\u68C0\u67E5\u670D\u52A1\u72B6\u6001\u548C\u5F53\u524D\u7528\u6237\u6743\u9650\u3002", SSH_DOCKER_UNSUPPORTED: "\u9700\u8981\u53EF\u7528\u7684 Linux Docker \u5F15\u64CE\u3002", SSH_SETUP_UNKNOWN: "\u4E0A\u6B21\u73AF\u5883\u51C6\u5907\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u6B63\u5728\u901A\u8FC7\u53EA\u8BFB\u68C0\u67E5\u6838\u5BF9\u3002", SSH_TARGET_CHANGED: "\u8FDE\u63A5\u914D\u7F6E\u6216\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6838\u9A8C\u3002", SSH_TARGET_BUSY: "\u8BE5\u76EE\u6807\u6B63\u5728\u51C6\u5907\u6216\u4ECD\u6709\u4F5C\u4E1A\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002" };
const unconfirmed = (error) => error instanceof TypeError || error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name);
const unconfirmedMessage = "\u7ED3\u679C\u672A\u786E\u8BA4\uFF0C\u8BF7\u67E5\u770B\u539F\u76EE\u6807\u72B6\u6001\uFF0C\u4E0D\u8981\u91CD\u590D\u521B\u5EFA/\u5B89\u88C5\u3002";
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
    this.state = { challenge: null, fingerprintConfirmed: false, confirmationUnknown: false, catalog: null, context: "", busy: "", error: "", notice: "", editor: null, gpuTarget: null };
    this.mounted = false;
    this.epoch = 0;
    this.readEpoch = 0;
    this.locked = false;
    this.unconfirmedSetups = /* @__PURE__ */ new Set();
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
      this.locked = false;
      this.unconfirmedSetups.clear();
      this.editorDialog.current?.close();
      this.gpuDialog.current?.close();
      this.setState({ catalog: null, context: "", busy: "", error: "", notice: "", editor: null, gpuTarget: null, challenge: null, fingerprintConfirmed: false, confirmationUnknown: false });
      void this.refresh();
    } else if (this.props.active && (prev.refreshToken !== this.props.refreshToken || !prev.active) && !this.locked) void this.load();
  }
  current(epoch) {
    return this.mounted && epoch === this.epoch;
  }
  call(name, input = {}, timeoutMs) {
    return api(`/operations/${name}`, { projectId: this.props.projectId, input }, "POST", void 0, void 0, timeoutMs);
  }
  async load() {
    const epoch = this.epoch, read = ++this.readEpoch;
    try {
      const catalog = await this.call("execution_environment_list");
      if (this.current(epoch) && read === this.readEpoch) {
        const observed = new Map(catalog.connections.ssh.map((target) => [target.id, target.setup]));
        for (const id of this.unconfirmedSetups) if (observed.get(id) === "idle") this.unconfirmedSetups.delete(id);
        this.setState({ catalog });
      }
    } catch (e) {
      if (this.current(epoch) && read === this.readEpoch) this.setState({ error: e instanceof Error ? e.message : String(e) });
    }
  }
  refresh() {
    return this.load();
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
    const setupId = input.id, setup = this.state.catalog?.connections.ssh.find((target) => target.id === setupId)?.setup;
    if (this.locked || this.props.readOnly || name === "ssh_target_setup" && (!!setupId && this.unconfirmedSetups.has(setupId) || ["unknown", "installing"].includes(setup ?? ""))) return false;
    const epoch = this.epoch;
    this.locked = true;
    this.readEpoch++;
    if (["ssh_target_probe", "ssh_target_configure", "ssh_target_setup", "gpu_target_probe"].includes(name)) this.withdraw(name, input);
    this.setState({ busy, error: "", notice: "" });
    let succeeded = false;
    try {
      await this.call(name, input, name === "ssh_target_setup" ? 3e5 : name === "ssh_target_probe" ? 75e3 : void 0);
      succeeded = true;
      if (this.current(epoch)) this.setState({ notice });
    } catch (e) {
      if (this.current(epoch)) {
        if (name === "ssh_target_setup" && unconfirmed(e)) {
          if (setupId) this.unconfirmedSetups.add(setupId);
          this.setState({ notice: unconfirmedMessage });
        } else this.setState({ error: e instanceof Error ? e.message : String(e) });
      }
    } finally {
      if (this.current(epoch)) {
        await this.load();
        if (this.current(epoch)) this.setState({ busy: "" });
      }
      if (epoch === this.epoch) this.locked = false;
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
        if (this.current(epoch)) this.setState({ busy: "" });
      }
      if (epoch === this.epoch) this.locked = false;
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
        if (epoch === this.epoch) this.locked = false;
        if (this.current(epoch)) this.setState({ busy: "" });
      }
    }
    if (this.current(epoch)) this.setState({ editor, challenge: null, fingerprintConfirmed: false, confirmationUnknown: false, error: "", notice: "" }, () => {
      this.editorDialog.current?.showModal();
      this.editorDialog.current?.querySelector(editor.version ? "input[name=host]" : "input[name=id]")?.focus();
    });
  }
  async save(form) {
    const editor = this.state.editor;
    if (!editor || this.locked || this.props.readOnly) return;
    const fd = new FormData(form), value = (key) => String(fd.get(key) ?? "").trim(), epoch = this.epoch;
    this.locked = true;
    this.setState({ busy: "challenge", error: "", notice: "" });
    try {
      const challenge = await this.call("ssh_target_challenge", { id: value("id"), host: value("host"), port: Number(fd.get("port")), user: value("user"), remoteRoot: value("remoteRoot"), identityFile: value("identityFile"), expectedVersion: editor.version }, 75e3);
      if (this.current(epoch)) this.setState({ challenge, fingerprintConfirmed: false, confirmationUnknown: false });
    } catch (e) {
      if (this.current(epoch)) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      if (epoch === this.epoch) this.locked = false;
      if (this.current(epoch)) this.setState({ busy: "" });
    }
  }
  async confirmFingerprint() {
    const challenge = this.state.challenge;
    if (!challenge || !this.state.fingerprintConfirmed || this.state.confirmationUnknown || Date.parse(challenge.expiresAt) <= Date.now() || this.locked || this.props.readOnly) return;
    const epoch = this.epoch;
    this.locked = true;
    this.setState({ busy: "confirm", error: "", notice: "" });
    try {
      const result = await this.call("ssh_target_confirm", { challengeId: challenge.challengeId, fingerprint: challenge.fingerprint }, 3e5);
      if (this.current(epoch)) {
        this.editorDialog.current?.close();
        this.setState({ editor: null, challenge: null, fingerprintConfirmed: false, confirmationUnknown: false, notice: result.verified ? "SSH \u8FDE\u63A5\u4E0E\u8BA1\u7B97\u73AF\u5883\u5DF2\u5C31\u7EEA\u3002" : "\u670D\u52A1\u5668\u8EAB\u4EFD\u5DF2\u4FDD\u5B58\uFF0C\u8BF7\u5728\u8FDE\u63A5\u5361\u7247\u67E5\u770B\u73AF\u5883\u51C6\u5907\u72B6\u6001\u3002" });
      }
    } catch (e) {
      if (this.current(epoch)) {
        if (unconfirmed(e)) this.setState({ confirmationUnknown: true, notice: unconfirmedMessage });
        else this.setState({ error: e instanceof Error ? e.message : String(e) });
      }
    } finally {
      if (this.current(epoch)) {
        await this.load();
        if (this.current(epoch)) this.setState({ busy: "" });
      }
      if (epoch === this.epoch) this.locked = false;
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
    const s = this.state, c = s.catalog, disabled = !!s.busy || !!this.props.readOnly, h = c?.local.hardware, ssh = c?.connections.ssh ?? [], docker = c?.connections.docker.find((d) => d.context === (s.context || c.connections.currentDockerContext || "current")), localGpu = c?.gpuTargets.filter((t) => t.backend === "local") ?? [];
    return /* @__PURE__ */ jsxs("div", { className: "compute-connections", "aria-busy": !!s.busy, children: [
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "compute-alert", children: s.error }) : null,
      s.notice ? /* @__PURE__ */ jsx("p", { role: "status", className: "compute-notice", children: s.notice }) : null,
      /* @__PURE__ */ jsxs("div", { className: "compute-overview-grid", children: [
        /* @__PURE__ */ jsxs("section", { className: "compute-card", "aria-labelledby": "local-compute-title", children: [
          /* @__PURE__ */ jsxs("header", { className: "compute-card-header", children: [
            /* @__PURE__ */ jsxs("div", { className: "compute-card-title", children: [
              /* @__PURE__ */ jsx(Icon, { name: "cpu" }),
              /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h2", { id: "local-compute-title", children: "\u672C\u5730\u8BA1\u7B97\u4FE1\u606F" }) })
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
          ] }) : /* @__PURE__ */ jsx("p", { className: "compute-empty", children: "\u6B63\u5728\u8BFB\u53D6\u672C\u673A\u4FE1\u606F\u2026" }) })
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
                /* @__PURE__ */ jsx("input", { id: "compute-docker-context", "aria-label": "Docker context", value: s.context, onChange: (e) => this.setState({ context: e.target.value }), disabled, maxLength: 100, pattern: "[A-Za-z0-9][A-Za-z0-9_.-]*", placeholder: c?.connections.currentDockerContext && c.connections.currentDockerContext !== "current" ? c.connections.currentDockerContext : "\u4F7F\u7528\u5F53\u524D context" }),
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
          /* @__PURE__ */ jsx("footer", { className: "compute-card-footer", children: "\u670D\u52A1\u540E\u53F0\u6BCF 20 \u79D2\u81EA\u52A8\u68C0\u6D4B\uFF1B\u8BA1\u7B97\u4EFB\u52A1\u6309\u65E2\u6709\u5BA1\u6279\u6267\u884C\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "compute-card compute-ssh", "aria-labelledby": "ssh-compute-title", children: [
        /* @__PURE__ */ jsxs("header", { className: "compute-card-header", children: [
          /* @__PURE__ */ jsxs("div", { className: "compute-card-title", children: [
            /* @__PURE__ */ jsx(Icon, { name: "link" }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h2", { id: "ssh-compute-title", children: [
              "SSH \u7BA1\u7406 ",
              /* @__PURE__ */ jsx("span", { className: "compute-count", children: ssh.length })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "primary", type: "button", disabled, onClick: () => void this.edit(), children: [
            /* @__PURE__ */ jsx(Icon, { name: "plus", size: 16 }),
            "\u65B0\u5EFA SSH \u8FDE\u63A5"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "compute-card-content", children: !c ? /* @__PURE__ */ jsx("p", { className: "compute-empty", children: "\u6B63\u5728\u8BFB\u53D6 SSH \u8FDE\u63A5\u2026" }) : !ssh.length ? /* @__PURE__ */ jsxs("div", { className: "compute-ssh-empty", children: [
          /* @__PURE__ */ jsx(Icon, { name: "network", size: 30 }),
          /* @__PURE__ */ jsx("h3", { children: "\u6DFB\u52A0\u7B2C\u4E00\u53F0\u8FDC\u7A0B\u8BA1\u7B97\u673A" }),
          /* @__PURE__ */ jsx("p", { children: "\u786E\u8BA4\u670D\u52A1\u5668\u6307\u7EB9\u540E\uFF0C\u81EA\u52A8\u68C0\u67E5\u5E76\u51C6\u5907 SSH \u73AF\u5883\u3002" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled, onClick: () => void this.edit(), children: "\u65B0\u5EFA SSH \u8FDE\u63A5" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "compute-ssh-list", children: ssh.map((t) => {
          const pending = s.busy === `ssh:${t.id}` || s.busy === `setup:${t.id}`, usable = !pending && t.status === "verified" && !!t.validUntil && Date.parse(t.validUntil) > Date.now(), gpuUsable = usable && s.busy !== `gpu:${t.id}` && t.capabilities.gpu && !!t.gpuValidUntil && Date.parse(t.gpuValidUntil) > Date.now();
          return /* @__PURE__ */ jsxs("article", { className: "compute-ssh-row", children: [
            /* @__PURE__ */ jsxs("div", { className: "compute-ssh-identity", children: [
              /* @__PURE__ */ jsxs("div", { className: "compute-ssh-heading", children: [
                /* @__PURE__ */ jsx("h3", { children: t.id }),
                /* @__PURE__ */ jsx(Status, { connection: t, pending })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "compute-address", children: t.user && t.host ? `${t.user}@${t.host}:${t.port ?? 22}` : "\u8FDC\u7A0B\u8BA1\u7B97\u76EE\u6807" }),
              /* @__PURE__ */ jsxs("p", { className: "compute-observed", children: [
                checked(t.checkedAt),
                pending ? " \xB7 \u6B63\u5728\u68C0\u6D4B" : ""
              ] }),
              /* @__PURE__ */ jsx("p", { className: "compute-remote-health", children: t.managed ? /* @__PURE__ */ jsxs(Fragment, { children: [
                t.supervisor === "ready" ? "\u76D1\u7BA1\u5668\u5DF2\u5C31\u7EEA" : t.supervisor === "missing" ? "\u76D1\u7BA1\u5668\u5C1A\u672A\u5B89\u88C5" : t.supervisor === "mismatch" ? "\u76D1\u7BA1\u5668\u7248\u672C\u4E0D\u5339\u914D" : t.supervisor === "unsafe" ? "\u76D1\u7BA1\u5668\u6743\u9650\u9700\u8981\u68C0\u67E5" : "\u76D1\u7BA1\u5668\u5F85\u68C0\u67E5",
                " \xB7 ",
                t.docker === "ready" ? usable ? "Docker \u5DF2\u8FDE\u63A5" : "Docker \u4E0A\u6B21\u68C0\u67E5\u6B63\u5E38" : t.docker === "missing" ? "\u9700\u8981\u5728\u670D\u52A1\u5668\u5B89\u88C5 Docker" : t.docker === "unavailable" ? "Docker \u65E0\u6CD5\u8BBF\u95EE\uFF0C\u8BF7\u68C0\u67E5\u670D\u52A1\u4E0E\u6743\u9650" : t.docker === "unsupported" ? "\u9700\u8981 Linux Docker" : "Docker \u5F85\u68C0\u67E5",
                t.workspace === "invalid" ? " \xB7 \u5DE5\u4F5C\u76EE\u5F55\u6743\u9650\u9700\u8981\u68C0\u67E5" : "",
                t.setup === "installing" ? " \xB7 \u73AF\u5883\u6B63\u5728\u51C6\u5907" : t.setup === "unknown" ? " \xB7 \u4E0A\u6B21\u51C6\u5907\u7ED3\u679C\u5F85\u6838\u5BF9" : ""
              ] }) : null }),
              t.errorCode && sshMessages[t.errorCode] ? /* @__PURE__ */ jsx("p", { className: "compute-setup-message", children: sshMessages[t.errorCode] }) : null,
              /* @__PURE__ */ jsxs("p", { className: "compute-capability", children: [
                "CPU ",
                usable && t.capabilities.cpu ? "\u5DF2\u6838\u9A8C" : "\u5F85\u6838\u9A8C",
                " \xB7 GPU ",
                gpuUsable ? `${t.gpuDevices.length} \u5757\u5DF2\u6838\u9A8C` : "\u5C1A\u672A\u786E\u8BA4"
              ] }),
              usable && t.capabilities.cpu && (t.cpus !== void 0 || t.memoryMb !== void 0) ? /* @__PURE__ */ jsxs("p", { className: "compute-device-names", children: [
                t.cpus !== void 0 ? `${t.cpus} \u6838 CPU` : "",
                t.memoryMb !== void 0 ? `${t.cpus !== void 0 ? " \xB7 " : "\u5185\u5B58 "}${gb(t.memoryMb)}` : ""
              ] }) : null,
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
              /* @__PURE__ */ jsx("button", { className: "secondary", type: "button", disabled: disabled || t.setup === "installing", onClick: () => void this.mutate("ssh_target_probe", { id: t.id }, `ssh:${t.id}`, "SSH \u8FDE\u63A5\u5DF2\u6838\u9A8C\u3002"), children: s.busy === `ssh:${t.id}` ? "\u6838\u9A8C\u4E2D\u2026" : "\u6838\u9A8C\u8FDE\u63A5" }),
              t.managed && t.status !== "verified" && t.setup !== "installing" && t.setup !== "unknown" ? /* @__PURE__ */ jsx("button", { className: "text-button", type: "button", disabled: disabled || this.unconfirmedSetups.has(t.id), onClick: () => void this.mutate("ssh_target_setup", { id: t.id, expectedVersion: t.configurationVersion }, `setup:${t.id}`, "\u73AF\u5883\u51C6\u5907\u5DF2\u8FD4\u56DE\uFF0C\u8BF7\u67E5\u770B\u8FDE\u63A5\u72B6\u6001\u3002"), children: s.busy === `setup:${t.id}` ? "\u51C6\u5907\u4E2D\u2026" : "\u91CD\u8BD5\u73AF\u5883\u51C6\u5907" }) : null,
              /* @__PURE__ */ jsx("button", { className: "text-button", type: "button", disabled, onClick: () => void this.openGpu(t.id), children: "\u6838\u9A8C GPU" }),
              /* @__PURE__ */ jsx("button", { className: "text-button", type: "button", disabled: disabled || t.setup === "installing" || t.setup === "unknown", onClick: () => void this.edit(t.id), children: "\u7F16\u8F91" })
            ] })
          ] }, t.id);
        }) }) }),
        /* @__PURE__ */ jsxs("footer", { className: "compute-card-footer", children: [
          /* @__PURE__ */ jsx(Icon, { name: "check", size: 15 }),
          /* @__PURE__ */ jsx("span", { children: "\u5B9A\u671F\u6838\u9A8C\u5DF2\u4FE1\u4EFB\u8FDE\u63A5\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("dialog", { ref: this.editorDialog, className: "compute-dialog", "aria-labelledby": "ssh-editor-title", onCancel: () => this.setState({ editor: null, challenge: null, fingerprintConfirmed: false, confirmationUnknown: false }), onClose: () => {
        if (this.state.editor) this.setState({ editor: null, challenge: null, fingerprintConfirmed: false, confirmationUnknown: false });
      }, children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { id: "ssh-editor-title", children: s.challenge ? "\u786E\u8BA4\u670D\u52A1\u5668\u8EAB\u4EFD" : s.editor?.version ? "\u7F16\u8F91 SSH \u8FDE\u63A5" : "\u65B0\u5EFA SSH \u8FDE\u63A5" }),
            /* @__PURE__ */ jsx("p", { children: s.challenge ? "\u6838\u5BF9\u6307\u7EB9\u540E\u8FDE\u63A5\uFF0C\u5E76\u5728\u9700\u8981\u65F6\u5B89\u88C5\u56FA\u5B9A SSH \u76D1\u7BA1\u5668\u3002" : "\u4E3B\u673A\u8EAB\u4EFD\u8BB0\u5F55\u7531\u5E94\u7528\u81EA\u52A8\u7BA1\u7406\u3002" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", "aria-label": "\u5173\u95ED SSH \u8FDE\u63A5\u8868\u5355", onClick: () => this.editorDialog.current?.close(), children: /* @__PURE__ */ jsx(Icon, { name: "close" }) })
        ] }),
        s.editor && !s.challenge ? /* @__PURE__ */ jsx("form", { onSubmit: (e) => {
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
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "compute-form-hint", children: "\u9996\u6B21\u8FDE\u63A5\u5148\u6838\u5BF9\u670D\u52A1\u5668\u6307\u7EB9\uFF1B\u7F3A\u5C11\u76D1\u7BA1\u5668\u65F6\u81EA\u52A8\u5B89\u88C5\uFF0C\u7F3A\u5C11 Docker \u65F6\u63D0\u793A\u4F60\u5B89\u88C5\u3002\u79C1\u94A5\u7559\u5728\u672C\u673A\u3002" }),
          s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "compute-alert", children: s.error }) : null,
          /* @__PURE__ */ jsxs("footer", { children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", onClick: () => this.editorDialog.current?.close(), children: "\u53D6\u6D88" }),
            /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", children: s.busy === "challenge" ? "\u83B7\u53D6\u6307\u7EB9\u4E2D\u2026" : "\u83B7\u53D6\u670D\u52A1\u5668\u6307\u7EB9" })
          ] })
        ] }) }) : null,
        s.challenge ? /* @__PURE__ */ jsxs("form", { className: "compute-trust-form", onSubmit: (e) => {
          e.preventDefault();
          void this.confirmFingerprint();
        }, children: [
          /* @__PURE__ */ jsxs("div", { className: "compute-trust-target", children: [
            /* @__PURE__ */ jsx("strong", { children: s.challenge.id }),
            /* @__PURE__ */ jsxs("p", { children: [
              s.challenge.user,
              "@",
              s.challenge.host,
              ":",
              s.challenge.port
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u670D\u52A1\u5668\u516C\u94A5\u6307\u7EB9 ",
            /* @__PURE__ */ jsx("small", { children: s.challenge.keyType }),
            /* @__PURE__ */ jsx("code", { className: "compute-fingerprint", children: s.challenge.fingerprint })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "compute-form-hint", children: "\u8BF7\u901A\u8FC7\u670D\u52A1\u5668\u7BA1\u7406\u5458\u6216\u53EF\u4FE1\u6E20\u9053\u6838\u5BF9\u6307\u7EB9\u3002\u786E\u8BA4\u540E\u4F1A\u81EA\u52A8\u4FDD\u5B58\u8EAB\u4EFD\u8BB0\u5F55\uFF0C\u4EC5\u5728\u76D1\u7BA1\u5668\u7F3A\u5931\u65F6\u5B89\u88C5\uFF0C\u5E76\u521B\u5EFA\u7F3A\u5931\u7684\u5DE5\u4F5C\u76EE\u5F55\uFF1B\u5DF2\u6709\u6587\u4EF6\u548C\u76EE\u5F55\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002Docker \u9700\u4F60\u81EA\u884C\u5B89\u88C5\u3002" }),
          /* @__PURE__ */ jsxs("label", { className: "compute-trust-check", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.fingerprintConfirmed, disabled, onChange: (e) => this.setState({ fingerprintConfirmed: e.target.checked }) }),
            "\u6211\u5DF2\u6838\u5BF9\u670D\u52A1\u5668\u6307\u7EB9\uFF0C\u786E\u8BA4\u4FE1\u4EFB\u6B64\u670D\u52A1\u5668"
          ] }),
          Date.parse(s.challenge.expiresAt) <= Date.now() ? /* @__PURE__ */ jsx("p", { role: "alert", className: "compute-alert", children: "\u6307\u7EB9\u786E\u8BA4\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u3002" }) : null,
          s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "compute-alert", children: s.error }) : null,
          /* @__PURE__ */ jsxs("footer", { children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled, onClick: () => this.setState({ challenge: null, fingerprintConfirmed: false, confirmationUnknown: false }), children: "\u8FD4\u56DE\u4FEE\u6539" }),
            /* @__PURE__ */ jsx("button", { type: "submit", className: "primary", disabled: disabled || !s.fingerprintConfirmed || s.confirmationUnknown || Date.parse(s.challenge.expiresAt) <= Date.now(), children: s.busy === "confirm" ? "\u8FDE\u63A5\u4E0E\u51C6\u5907\u4E2D\u2026" : "\u786E\u8BA4\u6307\u7EB9\u5E76\u8FDE\u63A5" })
          ] })
        ] }) : null
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
