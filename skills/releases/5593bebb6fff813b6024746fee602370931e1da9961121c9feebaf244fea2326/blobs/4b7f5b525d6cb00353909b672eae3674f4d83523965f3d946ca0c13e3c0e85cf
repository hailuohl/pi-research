---
name: pi-research-git
description: "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source."
---

# 受管 Git、工作区与实验源码

Git记录精确源码历史，不负责计算运输。每个正式 Run 冻结本地源码归档；不需要 GitHub push。不要为了启动计算 fetch/push 论文作者上游仓库。若用户已另行授权项目交付仓库，按项目约定交付；本技能不自动发布代码。

## 先确认来源与写域

其他会话可能在同项目独立工作区处理相邻任务。先读 project_inspect、相关任务结果/实验备注及固定源码索引，避免重复实现。受管 Git 是真实实现，不再写“没有 Git 工具”。用户先启用项目本地历史；Agent 不代替用户调用 history-enable。

每个 Session 有自己的受管分支（服务返回 branch，如 refs/heads/session-…）及 worktree，源码由固定 sourceRevisionId 绑定。不沿用上游 orx/<slug> 分支、不随意 checkout 任意分支。不占用另一会话 worktree；branch/worktree 所有权不等于能读任意数据或改共享项目。

准备自己工作区：

```json
{"input":{"experimentId":"<真实父实验ID>","revision":1}}
```

用于 workspace_prepare_from_revision；或使用真实 snapshotId。revision 来自已核对的来源。已有不同来源/非空修改时停止，不能覆盖。助手需自己任务的来源和适用 WorkingGrant，不借主会话 ID。

## 查看、修改、提交

1. workspace_history_inspect({input:{}}) 回查 state/head/sourceRevisionId/sourceDigest/operationId。unbound 说明未绑定历史，不能捏造 HEAD；pending 先结束等待回合，宿主处理后回查原操作。conflict/failed 交用户恢复，不重建另一个 worktree碰运气。
2. workspace_list/read 读取自己文件。workspace_write 的 path 是相对路径，创建 expectedDigest:null、修改填刚读到的 digest，必须在获准文件范围；不能把 project 来源当实验，也不能 Agent 写共享项目。
3. workspace_history_diff({input:{}}) 比较当前获准源码与已记录提交，包含新增、删除、未跟踪/gitignore 忽略的源文件及模式变化。逐文件核对没有秘密或越界修改；它不是只看 Git index。
4. workspace_history_commit 保存当前**完整精确源码快照**，不是选择性 git add。输入 expectedHead 取 inspect/diff 的真实40位 HEAD。先确保工作区只有本任务修改，不把其他在途内容混入；返回异步 operationId，不意味着已经提交。
5. workspace_history_operation 用原 operationId 回查，state=complete 后核对 gitCommit/sourceDigest，再 inspect/diff 确认实际一致；等待中不继续写源码。

```json
{"input":{"path":"model.py","content":"<实际完整源码>","expectedDigest":"<workspace_read返回的64位digest>"}}
```

上例是 workspace_write；下面分别是 workspace_history_commit 和 operation：

```json
{"input":{"expectedHead":"<inspect返回的40位head>","message":"只保存本轮模型宽度修改"}}
```

```json
{"input":{"operationId":"<commit返回的operationId>"}}
```

若脚本确需可执行位，workspace_history_set_mode 输入 path、mode:"100755" 与当前整个工作区的 expectedSourceDigest；普通文件用100644。Windows也保留逻辑模式。摘要冲突重读差异，不能填零摘要/盲目覆盖。没有变化会报 CHANGE_EMPTY，不能捏造新提交。

## 开发验证与正式整合

读 pi-research-compute 的本地参考，使用 development_prepare 固定当前私有源码、真实镜像摘要、command、有限资源与expectedArtifacts，另行用户开发批准再 development_submit。开发作业输出及完整性是真实检查证据；退出码0或助手自报“完成”不够。WorkingGrant 若适用仍限定源/文件/镜像/命令，不因有 Shell 文本就可执行。

主协调者可 development_review_prepare({input:{jobId:"<成功完整的实际jobId>"}}) 准备独立检查，用户批准后调度；审查读其固定来源及日志，不用被继续修改的当前工作区。passed及依赖仍有效时 reviewed_change_prepare 输入 `{"reviewId":"<真实reviewId>","title":"已审实现","hypothesis":"具体变化与测量"}` 准备整合；或按允许范围 change_proposal_prepare 明列 baseExperimentId/expectedRevision/changes，其中 artifactId 是实际产物，expectedDigest 是父对应文件摘要，新文件为null、删除文件 artifactId:null。整合仍由用户批准执行。

commit只保存私有历史，不自动合并、不批准开发检查/正式运行。正式run_prepare使用**实验**固定源码而不是会话HEAD；整合成子实验后读取新源码索引再准备Run，防止跑到旧版本。

## 比较子节点和父节点

不要依赖上游 git diff 父分支三点语法猜本项目差异；用两份固定来源：

```json
{"input":{"from":{"experimentId":"<真实父ID>","revision":1},"to":{"experimentId":"<真实子ID>","revision":1}}}
```

experiment_source_diff 返回各文件 before/after digest及模式；逐项 experiment_source_read 读对应修订内容理解变化。run_source_list/read 可核对已运行快照及其真实 gitCommit，不能用最新源码替换“运行时源码”。缺history则只报告snapshotDigest，不补造commit。

## 冻结、冲突与恢复

一旦Run回答节点，实验源码/历史不可重写，不 merge/rebase/reset 冻结分支；整合其他工作放新子实验。尚未回答的修复要先核对真实结果语义及运行已终态，再由用户受控改当前 provisional 实验；Agent 的私有提交不会直接修掉正式节点。

GIT_HEAD_CONFLICT、工作区 pending、来源不匹配、WorkingGrant失效都先补证据或恢复前置条件。观察超时不等于Git失败；回查原operation，禁止重复启动同任务。恢复保留旧操作、原提交、源码摘要与未完成内容，不能为“干净历史”删除失败记录或重写已有commit。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-git/SKILL.md`（blob `13af3bae031a9434c111c9c5ef77bbb8c80cc3bf`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
