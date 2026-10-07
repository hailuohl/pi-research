import { jsx, jsxs } from "react/jsx-runtime";
const computeReasonLabels = { gpu_busy: "\u7B49\u5F85 GPU \u8BBE\u5907\uFF0C\u6216\u7B49\u5F85 CPU Docker\uFF0F\u65E7\u7248 SSH \u4F5C\u4E1A\u7ED3\u675F", ready: "\u5BB9\u91CF\u68C0\u67E5\u901A\u8FC7\uFF0C\u7B49\u5F85\u8C03\u5EA6", worker_active: "\u6267\u884C\u5668\u4ECD\u6301\u6709\u6709\u6548\u79DF\u7EA6", recovery_due: "\u5F85\u6838\u5BF9\u539F\u4F5C\u4E1A\u5E76\u6062\u590D\u76D1\u7BA1", target_unresolved: "\u8BA1\u7B97\u76EE\u6807\u5C1A\u672A\u89E3\u6790", target_unavailable: "\u8BA1\u7B97\u76EE\u6807\u6682\u4E0D\u53EF\u7528", target_changed: "\u76EE\u6807\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u9700\u8981\u6838\u5BF9", legacy_target_unknown: "\u65E7\u4F5C\u4E1A\u76EE\u6807\u672A\u77E5\uFF0C\u4FDD\u7559\u5360\u7528", request_too_large: "\u8BF7\u6C42\u8D85\u8FC7\u914D\u7F6E\u603B\u5BB9\u91CF\uFF0C\u7B49\u5F85\u4E0D\u4F1A\u81EA\u52A8\u89E3\u51B3", host_capacity: "\u7B49\u5F85\u5171\u4EAB\u5BBF\u4E3B\u5BB9\u91CF", target_capacity: "\u7B49\u5F85\u6B64\u8BA1\u7B97\u76EE\u6807\u5BB9\u91CF", earlier_job: "\u7B49\u5F85\u66F4\u65E9\u7684\u4F5C\u4E1A", recovery_backoff: "\u6062\u590D\u6682\u7F13\uFF0C\u7B49\u5F85\u4E0B\u6B21\u6838\u5BF9", manual_recovery_required: "\u65E7\u5BBF\u4E3B\u4F5C\u4E1A\u9700\u8981\u4EBA\u5DE5\u6838\u5BF9\uFF0C\u4FDD\u7559\u5360\u7528" };
function ComputeWait({ data, kind, id }) {
  const item = data.compute?.items.find((i) => i.kind === kind && i.id === id);
  return /* @__PURE__ */ jsxs("div", { className: "small muted", children: [
    /* @__PURE__ */ jsx("p", { children: item ? computeReasonLabels[item.reason] : data.compute ? "\u6B64\u4F5C\u4E1A\u7684\u961F\u5217\u8BE6\u60C5\u6682\u672A\u52A0\u8F7D\uFF0C\u7B49\u5F85\u72B6\u6001\u66F4\u65B0\u3002" : "\u8C03\u5EA6\u4FE1\u606F\u5F85\u52A0\u8F7D\u3002" }),
    item ? /* @__PURE__ */ jsxs("p", { children: [
      "\u9700\u6C42 ",
      item.requested.cpus,
      " CPU / ",
      item.requested.memoryMb,
      " MiB",
      item.requested.gpu ? ` / ${item.requested.gpu.deviceIds.length} NVIDIA GPU` : "",
      " \xB7 ",
      item.held ? "\u5BB9\u91CF\u4FDD\u7559\u4E2D" : "\u5C1A\u672A\u9884\u7559\u5BB9\u91CF",
      item.state === "unknown" ? "\uFF1B\u672A\u77E5\u72B6\u6001\u4E0D\u4F1A\u81EA\u52A8\u91CA\u653E\u5BB9\u91CF" : ""
    ] }) : null
  ] });
}
export {
  ComputeWait,
  computeReasonLabels
};
