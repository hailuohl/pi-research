const short = (id) => id ? id.slice(0, 8) : "\u2014";
const number = (value) => value === void 0 ? "\u2014" : Math.abs(value) < 1e-3 ? value.toExponential(3) : value.toFixed(5);
const date = (value) => new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
const names = { draft: "\u8349\u6848", stopped: "\u5DF2\u505C\u6B62", proposed: "\u5F85\u6279\u51C6\u63D0\u6848", applied: "\u5DF2\u5E94\u7528", repair: "\u539F\u8282\u70B9\u4FEE\u590D", refill: "\u8865\u5145\u5019\u9009", promote: "\u664B\u7EA7\u4E0B\u4E00\u8F6E", stop: "\u505C\u6B62\u7814\u7A76", open: "\u8FDB\u884C\u4E2D", closed: "\u5DF2\u7ED3\u675F", decided: "\u5DF2\u51B3\u7B56", pending: "\u5F85\u5904\u7406", queued: "\u6392\u961F\u4E2D", running: "\u8FD0\u884C\u4E2D", succeeded: "\u6267\u884C\u6210\u529F", failed: "\u5931\u8D25", cancelled: "\u5DF2\u53D6\u6D88", cancelling: "\u53D6\u6D88\u4E2D", unknown: "\u5F85\u5BF9\u8D26", provisional: "\u8349\u6848", frozen: "\u5DF2\u51BB\u7ED3", archived: "\u5DF2\u5F52\u6863", complete: "\u5B8C\u6574", incomplete: "\u4E0D\u5B8C\u6574", invalid: "\u65E0\u6548", accepted: "\u5DF2\u9A8C\u6536", rejected: "\u672A\u901A\u8FC7", disputed: "\u6709\u4E89\u8BAE", output_submitted: "\u5DF2\u63D0\u4EA4\u6210\u679C", waiting_user: "\u5F85\u4EBA\u5DE5\u5904\u7406", superseded: "\u65E7\u7248\u672C", blocked: "\u5DF2\u963B\u585E", awaiting_approval: "\u5F85\u6279\u51C6", active: "\u8FDB\u884C\u4E2D", paused: "\u5DF2\u6682\u505C", draining: "\u6B63\u5728\u6536\u5C3E", completed: "\u5DF2\u5B8C\u6210", partial: "\u90E8\u5206\u5B8C\u6210", approved: "\u5DF2\u6279\u51C6", stale: "\u5DF2\u5931\u6548", idle: "\u7A7A\u95F2", interrupted: "\u5DF2\u4E2D\u6B62", waiting: "\u7B49\u5F85\u4E2D", literature: "\u6587\u732E", designer: "\u8BBE\u8BA1", implementer: "\u5B9E\u73B0", analyst: "\u5206\u6790", reviewer: "\u5BA1\u67E5", writer: "\u5199\u4F5C", coordinator: "\u4E3B\u534F\u8C03\u8005", proposal: "\u5019\u9009", implemented: "\u5DF2\u5B9E\u73B0", verified: "\u5DF2\u5B9E\u6D4B", integration_unverified: "\u5F85\u771F\u5B9E\u63A5\u5165\u9A8C\u8BC1", not_implemented: "\u672A\u5B9E\u73B0" };
const label = (value) => names[value] ?? value;
function comparisonMetric(data, selected) {
  const e = data.experiments.find((e2) => e2.id === selected) ?? data.experiments[0];
  const definitions = e?.contract?.metrics ?? data.runs.find((r) => r.manifest.contractDigest === e?.contractDigest)?.manifest.contract?.metrics;
  const key = Object.keys(definitions ?? {})[0] ?? "mse";
  return { key, unit: definitions?.[key]?.unit ?? "", direction: definitions?.[key]?.direction ?? "min", contractDigest: e?.contractDigest };
}
function comparableRuns(data, selected) {
  const m = comparisonMetric(data, selected);
  return data.runs.filter((r) => r.state === "succeeded" && r.integrity === "complete" && Number.isFinite(r.metrics?.[m.key]) && r.manifest.contractDigest === m.contractDigest);
}
export {
  comparableRuns,
  comparisonMetric,
  date,
  label,
  number,
  short
};
