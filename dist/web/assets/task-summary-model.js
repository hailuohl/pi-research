const time = (value) => {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};
const newest = (rows) => [...rows].map((row, index) => ({ row, index })).sort((a, b) => time(b.row.updatedAt ?? b.row.createdAt) - time(a.row.updatedAt ?? a.row.createdAt) || b.index - a.index).map((item) => item.row);
const sourceRef = (kind, row) => ({ kind, id: row.id });
const status = (operationStatus, verificationStatus, fields = {}) => ({
  goal: "",
  scope: "",
  source: { kind: "unknown", id: "" },
  operationStatus,
  verificationStatus,
  scientificStatus: "not_assessed",
  blocker: "",
  nextAction: "\u67E5\u770B\u5F53\u524D\u4EFB\u52A1\u8BB0\u5F55\u4E0E\u4E0B\u4E00\u6B65\u64CD\u4F5C\u3002",
  artifactIds: [],
  ...fields
});
function briefSummary(data, session) {
  const view = data.researchBrief;
  if (view?.blockedReason) {
    if (!session.researchBriefId || session.researchBriefId !== view.latestId) return null;
    return status("blocked", "unknown", {
      goal: "\u7814\u7A76\u8BA1\u5212\u8BFB\u53D6\u53D7\u963B",
      scope: "\u5F53\u524D\u4F1A\u8BDD\u7ED1\u5B9A\u7684\u539F\u7814\u7A76\u8BA1\u5212",
      source: { kind: "research-brief", id: session.researchBriefId },
      blocker: "\u539F\u7814\u7A76\u8BA1\u5212\u5F53\u524D\u65E0\u6CD5\u8BFB\u53D6\u6216\u6821\u9A8C\uFF0C\u4E0D\u80FD\u786E\u8BA4\u6267\u884C\u4E0E\u9A8C\u8BC1\u72B6\u6001\u3002",
      nextAction: "\u5148\u6838\u5BF9\u539F\u8BB0\u5F55\u53CA\u8BFB\u53D6\u6743\u9650\uFF1B\u4E0D\u8981\u81EA\u52A8\u91CD\u8DD1\u6216\u521B\u5EFA\u66FF\u4EE3\u8BA1\u5212\u3002"
    });
  }
  const brief = view?.brief;
  if (!brief || brief.rootSessionId !== session.id || view.latestId !== brief.id) return null;
  const stale = (view.evidenceChecks ?? []).some((check) => !check.current);
  if (stale) return status("blocked", "stale", {
    goal: brief.question,
    scope: brief.scope,
    source: sourceRef("research-brief", brief),
    snapshotDigest: brief.digest,
    blocker: "\u7814\u7A76\u8BA1\u5212\u5F15\u7528\u7684\u6765\u6E90\u5DF2\u5931\u6548\u6216\u53D1\u751F\u53D8\u5316\u3002",
    nextAction: "\u5148\u5237\u65B0\u5E76\u6838\u5BF9\u5931\u6548\u6765\u6E90\uFF0C\u518D\u51B3\u5B9A\u662F\u5426\u91CD\u65B0\u786E\u8BA4\u8BA1\u5212\u3002"
  });
  if (brief.status === "confirmed") return status("confirmed", "not_run", {
    goal: brief.question,
    scope: brief.scope,
    source: sourceRef("research-brief", brief),
    snapshotDigest: brief.digest,
    nextAction: "\u8BA1\u5212\u5DF2\u786E\u8BA4\uFF1B\u7EE7\u7EED\u7814\u7A76\u6216\u67E5\u770B\u540E\u7EED\u6267\u884C\u8BB0\u5F55\u3002"
  });
  return status(brief.status === "clarifying" ? "blocked" : "awaiting_confirmation", "not_run", {
    goal: brief.question,
    scope: brief.scope,
    source: sourceRef("research-brief", brief),
    snapshotDigest: brief.digest,
    blocker: brief.status === "clarifying" ? "\u7814\u7A76\u95EE\u9898\u6216\u8303\u56F4\u4ECD\u6709\u5F85\u6F84\u6E05\u4E8B\u9879\u3002" : "",
    nextAction: brief.status === "clarifying" ? "\u5148\u56DE\u7B54\u5F85\u6F84\u6E05\u95EE\u9898\u3002" : "\u6838\u5BF9\u7814\u7A76\u95EE\u9898\u3001\u8303\u56F4\u548C\u6210\u529F\u6807\u51C6\u540E\u518D\u786E\u8BA4\u3002"
  });
}
function runSummary(data, session) {
  const intents = newest((data.intents ?? []).filter((intent) => intent.rootSessionId === session.id));
  for (const intent of intents) {
    const run = (data.runs ?? []).find((row) => row.id === intent.runId);
    if (run) {
      const experiment = (data.experiments ?? []).find((row) => row.id === run.experimentId);
      const staleSource = !!experiment && (typeof run.manifest?.experimentRevision === "number" && typeof experiment.revision === "number" && experiment.revision !== run.manifest.experimentRevision || !!run.manifest?.contractDigest && !!experiment.contractDigest && run.manifest.contractDigest !== experiment.contractDigest);
      const valid = run.state === "succeeded" && run.integrity === "complete" && run.exitCode === 0;
      const failed = run.state === "failed" || run.state === "cancelled" || run.exitCode !== void 0 && run.exitCode !== null && run.exitCode !== 0;
      const operationStatus = run.state === "unknown" ? "unknown" : run.state === "cancelling" ? "stopping" : run.state === "succeeded" && !valid ? "completed_with_issue" : failed ? run.state === "cancelled" ? "cancelled" : "failed" : valid ? "completed" : "running";
      const verificationStatus = run.state === "unknown" || run.state === "cancelling" ? "unknown" : run.state === "cancelled" ? "not_run" : failed ? "fail" : staleSource ? "stale" : valid ? "pass" : run.state === "succeeded" ? "unknown" : "not_run";
      return status(operationStatus, verificationStatus, {
        goal: experiment?.title ?? "\u6B63\u5F0F\u8FD0\u884C " + run.id,
        scope: "\u56FA\u5B9A\u6B63\u5F0F\u8FD0\u884C " + run.id,
        source: sourceRef("run", run),
        experimentId: run.experimentId,
        snapshotDigest: run.manifest?.snapshotDigest ?? run.manifestDigest ?? intent.manifestDigest,
        artifactIds: [...run.artifactIds ?? []],
        validationEvidence: {
          sourceDigest: run.manifest?.snapshotDigest ?? run.manifestDigest ?? intent.manifestDigest,
          command: run.manifest?.contract?.command,
          exitCode: run.exitCode,
          integrity: run.integrity,
          startedAt: run.startedAt,
          endedAt: run.endedAt,
          artifactIds: [...run.artifactIds ?? []],
          metrics: run.metrics
        },
        blocker: run.error ?? (staleSource ? "\u5F53\u524D\u5B9E\u9A8C\u7248\u672C\u4E0E\u8FD0\u884C\u5FEB\u7167\u4E0D\u4E00\u81F4\uFF1B\u5386\u53F2 Run \u4ECD\u6709\u6548\uFF0C\u4F46\u4E0D\u80FD\u4F5C\u4E3A\u5F53\u524D\u7248\u672C\u7684\u9A8C\u8BC1\u8BC1\u636E\u3002" : run.state === "succeeded" && !valid ? "\u8FD0\u884C\u7ED3\u675F\uFF0C\u4F46\u9000\u51FA\u7801\u6216\u5B8C\u6574\u6027\u8BC1\u636E\u4E0D\u8DB3\u3002" : ""),
        scientificStatus: valid ? run.judgment && run.judgment !== "pending" ? "reviewed" : "needs_review" : "not_assessed",
        nextAction: run.state === "unknown" || run.state === "cancelling" ? "\u5148\u6838\u5BF9\u540C\u4E00\u4E2A Run \u7684\u771F\u5B9E\u72B6\u6001\u548C\u56DE\u6267\uFF1B\u4E0D\u8981\u81EA\u52A8\u91CD\u8DD1\u3002" : ["running", "queued", "submitting"].includes(run.state) ? "\u7B49\u5F85\u539F\u8FD0\u884C\u7ED3\u675F\uFF0C\u518D\u68C0\u67E5\u9000\u51FA\u7801\u3001\u5B8C\u6574\u6027\u548C\u4EA7\u7269\u3002" : staleSource ? "\u5386\u53F2\u8FD0\u884C\u4ECD\u7ED1\u5B9A\u539F\u5FEB\u7167\uFF1B\u5BF9\u5F53\u524D\u5B9E\u9A8C\u65B0\u7248\u672C\u91CD\u65B0\u6267\u884C\u9002\u7528\u7684\u9A8C\u8BC1\uFF0C\u4E0D\u80FD\u590D\u7528\u65E7\u901A\u8FC7\u72B6\u6001\u3002" : valid ? "\u67E5\u770B\u56FA\u5B9A\u4EA7\u7269\u4E0E\u9A8C\u8BC1\u8BC1\u636E\uFF1B\u79D1\u5B66\u5224\u65AD\u4ECD\u9700\u5355\u72EC\u6838\u67E5\u3002" : failed ? "\u67E5\u770B\u539F\u8FD0\u884C\u65E5\u5FD7\u4E0E\u5931\u8D25\u8BCA\u65AD\uFF0C\u786E\u8BA4\u539F\u56E0\u540E\u518D\u51B3\u5B9A\u662F\u5426\u91CD\u8BD5\u3002" : "\u6838\u5BF9\u539F\u8FD0\u884C\u7684\u9000\u51FA\u7801\u3001\u5B8C\u6574\u6027\u4E0E\u4EA7\u7269\uFF0C\u5F53\u524D\u4E0D\u80FD\u6807\u8BB0\u9A8C\u8BC1\u901A\u8FC7\u3002"
      });
    }
    if (intent.status === "submitted" && intent.runId && !run) {
      const experiment = (data.experiments ?? []).find((row) => row.id === intent.experimentId);
      return status("unknown", "unknown", {
        goal: experiment?.title ?? "\u6B63\u5F0F\u8FD0\u884C\u610F\u5411 " + intent.id,
        scope: "\u5DF2\u63D0\u4EA4\u7684\u56FA\u5B9A\u8FD0\u884C\u610F\u5411 " + intent.id,
        source: sourceRef("run-intent", intent),
        experimentId: intent.experimentId,
        snapshotDigest: intent.manifestDigest,
        blocker: "\u610F\u5411\u5DF2\u63D0\u4EA4\uFF0C\u4F46\u5F53\u524D\u8BFB\u53D6\u7ED3\u679C\u4E2D\u6CA1\u6709\u5173\u8054\u7684 Run \u8BB0\u5F55\uFF1B\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u8FD0\u884C\u5931\u8D25\u3002",
        nextAction: "\u5148\u6309\u539F\u610F\u5411 ID \u6838\u5BF9\u63D0\u4EA4\u56DE\u6267\u548C\u8FD0\u884C\u5217\u8868\uFF1B\u4E0D\u8981\u81EA\u52A8\u91CD\u8DD1\u6216\u521B\u5EFA\u66FF\u4EE3\u610F\u5411\u3002"
      });
    }
    if (intent.status === "prepared" && !intent.runId) {
      const approval = (data.approvals ?? []).find((row) => row.id === intent.approvalId);
      const approved = approval?.status === "approved";
      const experiment = (data.experiments ?? []).find((row) => row.id === intent.experimentId);
      return status(approval?.status === "rejected" ? "blocked" : approved ? "ready_to_submit" : "awaiting_confirmation", "not_run", {
        goal: experiment?.title ?? "\u6B63\u5F0F\u8FD0\u884C\u610F\u5411 " + intent.id,
        scope: "\u56FA\u5B9A\u8FD0\u884C\u610F\u5411 " + intent.id,
        source: sourceRef("run-intent", intent),
        experimentId: intent.experimentId,
        snapshotDigest: intent.manifestDigest,
        blocker: approval?.status === "rejected" ? "\u6B63\u5F0F\u8FD0\u884C\u5BA1\u6279\u5DF2\u62D2\u7EDD\u3002" : "",
        nextAction: approved ? "\u63D0\u4EA4\u5DF2\u6279\u51C6\u7684\u539F\u8FD0\u884C\u610F\u5411\uFF1B\u4E0D\u8981\u521B\u5EFA\u66FF\u4EE3\u610F\u5411\u3002" : "\u6838\u5BF9\u56FA\u5B9A\u8FD0\u884C\u8303\u56F4\u4E0E\u5BA1\u6279\u72B6\u6001\u3002"
      });
    }
  }
  return null;
}
function developmentSummary(data, session) {
  const tasks = newest((data.developmentTasks ?? []).filter((task) => task.sessionId === session.id));
  for (const task of tasks) {
    const job = (data.sandboxJobs ?? []).find((row) => row.id === task.jobId);
    if (!job) {
      if (task.jobId) return status("unknown", "unknown", {
        goal: task.title,
        scope: "\u5DF2\u63D0\u4EA4\u7684\u56FA\u5B9A\u5F00\u53D1\u6D4B\u8BD5 " + task.id + " \xB7 \u539F\u4F5C\u4E1A " + task.jobId,
        source: sourceRef("development-task", task),
        snapshotDigest: task.sourceDigest,
        blocker: "\u5F00\u53D1\u6D4B\u8BD5\u5DF2\u63D0\u4EA4\uFF0C\u4F46\u5F53\u524D\u8BFB\u53D6\u7ED3\u679C\u4E2D\u6CA1\u6709\u5173\u8054\u7684\u539F\u4F5C\u4E1A\u8BB0\u5F55\uFF1B\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u672A\u8FD0\u884C\u6216\u5931\u8D25\u3002",
        nextAction: "\u5148\u6309\u539F\u4EFB\u52A1\u4E0E\u4F5C\u4E1A ID \u6838\u5BF9\u63D0\u4EA4\u56DE\u6267\u548C\u4F5C\u4E1A\u8BB0\u5F55\uFF1B\u4E0D\u8981\u81EA\u52A8\u91CD\u8DD1\u6216\u521B\u5EFA\u66FF\u4EE3\u4EFB\u52A1\u3002"
      });
      const approval = (data.approvals ?? []).find((row) => row.id === task.grantId);
      const effective = task.effectiveState ?? approval?.status;
      const rejected = effective === "rejected" || approval?.status === "rejected";
      const expired = effective === "expired";
      const stale = effective === "stale" && !rejected;
      const blocked = rejected || expired || stale || effective === "approved" && (task.canSubmit === false || !!task.blockedReason);
      const reason = rejected ? "\u5F00\u53D1\u6D4B\u8BD5\u5BA1\u6279\u5DF2\u62D2\u7EDD\u3002" : expired ? "\u5F00\u53D1\u6D4B\u8BD5\u6388\u6743\u5DF2\u8FC7\u671F\uFF0C\u5C1A\u672A\u8FD0\u884C\u3002" : stale ? "\u5F00\u53D1\u6D4B\u8BD5\u6765\u6E90\u6216\u6388\u6743\u5DF2\u5931\u6548\u3002" : blocked ? "\u56FA\u5B9A\u5F00\u53D1\u6D4B\u8BD5\u5F53\u524D\u4E0D\u53EF\u63D0\u4EA4\u3002" : "";
      return status(blocked ? "blocked" : effective === "approved" ? "ready_to_submit" : "awaiting_confirmation", stale ? "stale" : "not_run", {
        goal: task.title,
        scope: "\u56FA\u5B9A\u5F00\u53D1\u6D4B\u8BD5 " + task.id,
        source: sourceRef("development-task", task),
        snapshotDigest: task.sourceDigest,
        validationEvidence: { sourceDigest: task.sourceDigest, command: task.manifest.command, integrity: "not_run", artifactIds: [] },
        blocker: [task.blockedReason, reason].filter(Boolean).join(" \u2014 "),
        nextAction: "\u5148\u6838\u5BF9\u539F\u5F00\u53D1\u6D4B\u8BD5\u8BB0\u5F55\u3001\u56FA\u5B9A\u6E90\u7801\u6458\u8981\u3001\u547D\u4EE4\u548C\u5BA1\u6279\u72B6\u6001\uFF1B\u5C1A\u65E0\u6D4B\u8BD5\u7ED3\u679C\u3002"
      });
    }
    const passed = job.state === "succeeded" && job.integrity === "complete" && job.exitCode === 0;
    const stopping = job.cancelRequested && ["queued", "starting", "running"].includes(job.state);
    const failed = job.state === "failed" || job.state === "timed_out" || job.exitCode !== void 0 && job.exitCode !== null && job.exitCode !== 0;
    const verificationStatus = job.state === "unknown" || stopping ? "unknown" : job.state === "cancelled" ? "not_run" : failed ? "fail" : passed ? "pass" : job.state === "stale" ? "stale" : job.state === "succeeded" ? "unknown" : "not_run";
    const operationStatus = job.state === "unknown" ? "unknown" : stopping ? "stopping" : job.state === "cancelled" ? "cancelled" : failed ? "failed" : passed ? "completed" : job.state === "succeeded" ? "completed_with_issue" : "running";
    return status(operationStatus, verificationStatus, {
      goal: task.title,
      scope: "\u56FA\u5B9A\u5F00\u53D1\u6D4B\u8BD5 " + task.id,
      source: sourceRef("development-job", job),
      snapshotDigest: job.sourceDigest ?? task.sourceDigest,
      artifactIds: [...job.artifactIds ?? []],
      validationEvidence: { sourceDigest: job.sourceDigest ?? task.sourceDigest, command: task.manifest.command, exitCode: job.exitCode, integrity: job.integrity, artifactIds: [...job.artifactIds ?? []] },
      blocker: job.error ?? (job.state === "timed_out" ? "\u5F00\u53D1\u6D4B\u8BD5\u5DF2\u8D85\u65F6\uFF0C\u4E0D\u80FD\u89C6\u4E3A\u9A8C\u8BC1\u901A\u8FC7\u3002" : job.state === "succeeded" && !passed ? "\u6D4B\u8BD5\u7ED3\u679C\u7684\u9000\u51FA\u7801\u6216\u5B8C\u6574\u6027\u8BC1\u636E\u4E0D\u8DB3\u3002" : ""),
      nextAction: job.state === "unknown" || stopping ? "\u6838\u5BF9\u540C\u4E00\u4E2A\u539F\u6D4B\u8BD5\u4F5C\u4E1A\u7684\u771F\u5B9E\u72B6\u6001\u4E0E\u505C\u6B62\u56DE\u6267\uFF1B\u4E0D\u8981\u76F2\u76EE\u91CD\u65B0\u63D0\u4EA4\u3002" : job.state === "cancelled" ? "\u4FDD\u7559\u539F\u6D4B\u8BD5\u4F5C\u4E1A\u4E0E\u53D6\u6D88\u8BB0\u5F55\uFF1B\u6CA1\u6709\u53EF\u590D\u7528\u7684\u9A8C\u8BC1\u901A\u8FC7\u8BC1\u636E\u3002" : passed ? "\u6D4B\u8BD5\u901A\u8FC7\u4EC5\u8BC1\u660E\u672C\u6B21\u56FA\u5B9A\u6E90\u7801\u548C\u547D\u4EE4\u7684\u68C0\u67E5\u901A\u8FC7\uFF0C\u4E0D\u4EE3\u8868\u79D1\u5B66\u7ED3\u8BBA\u6210\u7ACB\u3002" : failed ? "\u67E5\u770B\u5931\u8D25\u65E5\u5FD7\u548C\u5F52\u6863\u4EA7\u7269\uFF0C\u5B9A\u4F4D\u539F\u56E0\u540E\u518D\u51B3\u5B9A\u662F\u5426\u4FEE\u590D\u3002" : "\u7B49\u5F85\u539F\u6D4B\u8BD5\u4F5C\u4E1A\u7ED3\u675F\u540E\u518D\u8BFB\u53D6\u9A8C\u8BC1\u7ED3\u679C\u3002"
    });
  }
  return null;
}
function teamSummary(data, session) {
  const teams = (data.teams ?? []).filter((team) => team.rootSessionId === session.id);
  const ids = new Set(teams.map((team) => team.id));
  const tasks = newest((data.tasks ?? []).filter((task) => ids.has(task.teamId)));
  for (const task of tasks) {
    const team = teams.find((row) => row.id === task.teamId);
    const attempt = task.attempts?.find((row) => row.id === task.attemptId);
    if (["blocked", "waiting_user", "superseded"].includes(task.execution)) {
      return status("blocked", "not_run", {
        goal: task.objective,
        scope: "\u534F\u4F5C\u4EFB\u52A1 " + task.id,
        source: sourceRef("task", task),
        blocker: task.blockReason ?? team?.blockReason ?? "\u5F53\u524D\u4EFB\u52A1\u7B49\u5F85\u5904\u7406\u3002",
        nextAction: "\u67E5\u770B\u539F\u4EFB\u52A1\u3001\u5BA1\u6279\u6216\u963B\u585E\u539F\u56E0\u540E\u518D\u7EE7\u7EED\u3002"
      });
    }
    if (["failed", "running"].includes(task.execution) && attempt?.state === "unknown") return status("unknown", "unknown", {
      goal: task.objective,
      scope: "\u534F\u4F5C\u4EFB\u52A1 " + task.id,
      source: sourceRef("task", task),
      blocker: attempt.error ?? task.blockReason ?? "\u539F\u4EFB\u52A1\u7684\u6267\u884C\u56DE\u6267\u672A\u77E5\u3002",
      nextAction: "\u5148\u6838\u5BF9\u539F\u4EFB\u52A1\u4E0E\u5F53\u524D\u5C1D\u8BD5\u7684\u771F\u5B9E\u72B6\u6001\u548C\u56DE\u6267\uFF1B\u4E0D\u8981\u81EA\u52A8\u91CD\u8BD5\u6216\u521B\u5EFA\u66FF\u4EE3\u4EFB\u52A1\u3002"
    });
    if (task.result) return status(task.result.outcome === "blocked" ? "blocked" : task.execution === "failed" ? "failed" : task.execution === "cancelled" ? "cancelled" : "completed", "not_run", {
      goal: task.objective,
      scope: "\u534F\u4F5C\u4EFB\u52A1 " + task.id,
      source: sourceRef("task", task),
      artifactIds: [...task.result.artifactIds ?? []],
      blocker: task.result.outcome === "blocked" ? task.result.summary : "",
      nextAction: "\u67E5\u770B\u539F\u4EFB\u52A1\u7ED3\u679C\u4E0E\u5F15\u7528\u8BC1\u636E\uFF1B\u4EFB\u52A1\u5B8C\u6210\u6216\u5BA1\u67E5\u63A5\u53D7\u4E0D\u81EA\u52A8\u8BC1\u660E\u79D1\u5B66\u7ED3\u8BBA\u6B63\u786E\u3002"
    });
    if (["failed", "cancelled", "pending"].includes(task.execution)) return status(
      task.execution === "failed" ? "failed" : task.execution === "cancelled" ? "cancelled" : team?.state === "awaiting_approval" ? "awaiting_approval" : team?.state === "active" && team.delegationEnabled !== false ? "ready_to_submit" : "blocked",
      "not_run",
      {
        goal: task.objective,
        scope: "\u534F\u4F5C\u4EFB\u52A1 " + task.id,
        source: sourceRef("task", task),
        blocker: task.blockReason ?? team?.blockReason ?? "",
        nextAction: task.execution === "pending" ? "\u6838\u5BF9\u539F\u56E2\u961F\u7684\u5BA1\u6279\u4E0E\u8C03\u5EA6\u72B6\u6001\uFF0C\u7B49\u5F85\u539F\u4EFB\u52A1\u5206\u914D\uFF1B\u4E0D\u8981\u521B\u5EFA\u66FF\u4EE3\u4EFB\u52A1\u3002" : "\u6838\u5BF9\u539F\u4EFB\u52A1\u7684\u5931\u8D25\u6216\u53D6\u6D88\u8BB0\u5F55\uFF1B\u5C1A\u65E0\u4EFB\u52A1\u7ED3\u679C\uFF0C\u4E0D\u80FD\u636E\u6B64\u8BA4\u5B9A\u5DE5\u7A0B\u9A8C\u8BC1\u901A\u8FC7\u3002"
      }
    );
    if (task.execution === "running") return status("running", "not_run", {
      goal: task.objective,
      scope: "\u534F\u4F5C\u4EFB\u52A1 " + task.id,
      source: sourceRef("task", task),
      blocker: task.blockReason ?? "",
      nextAction: "\u7B49\u5F85\u539F\u4EFB\u52A1\u8FD4\u56DE\u7ED3\u679C\uFF1B\u4E0D\u8981\u521B\u5EFA\u66FF\u4EE3\u4EFB\u52A1\u3002"
    });
  }
  return null;
}
function summarizeSessionWork(data, session) {
  if (!session || session.role !== "coordinator" || session.taskId) return null;
  const sources = {
    run: data.runs ?? [],
    "run-intent": data.intents ?? [],
    "development-task": data.developmentTasks ?? [],
    "development-job": data.sandboxJobs ?? [],
    task: data.tasks ?? [],
    "research-brief": data.researchBrief?.brief ? [data.researchBrief.brief] : []
  };
  const sourceTime = (summary) => {
    const row = sources[summary.source.kind]?.find((row2) => row2.id === summary.source.id);
    const task = summary.source.kind === "development-job" ? data.developmentTasks?.find((task2) => task2.jobId === summary.source.id) : void 0;
    return time(row?.updatedAt ?? row?.createdAt ?? task?.updatedAt ?? task?.createdAt);
  };
  return [runSummary(data, session), developmentSummary(data, session), teamSummary(data, session), briefSummary(data, session)].filter((summary) => summary !== null).sort((a, b) => sourceTime(b) - sourceTime(a))[0] ?? null;
}
export {
  summarizeSessionWork
};
