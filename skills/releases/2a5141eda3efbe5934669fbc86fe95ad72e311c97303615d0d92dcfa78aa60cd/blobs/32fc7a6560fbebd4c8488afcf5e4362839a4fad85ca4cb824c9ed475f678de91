---
name: pi-research-git
description: "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts."
---

# 私有工作副本与代码交接

此处是上游 Git 工作流的等价目标改写，**不是 Git 集成**。当前没有 checkout、commit、push、rebase 工具；本项目使用版本化目录、内容摘要、变更提案和子实验快照，不应把摘要称作 Git commit。

## 先读后改
`workspace_list` 查看自己目录；`workspace_read` 得到内容和摘要。`workspace_write` 只写自己的工作区，必须提供 expectedDigest（新文件 null）。摘要冲突时重新读取并对比，不覆盖他人修改。不要写共享项目目录、数据库或技能目录。

## 交付可审查版本
实现助手写完后用 `artifact_create` 登记实际文本/代码产物，并在 `task_result_submit` 中交付对应 artifactIds。Reviewer 用 `artifact_read` 读取分配的不可变成果；文件存在不表示已测试，引用摘要不表示解释正确。未执行测试明确记录 not_run。

主协调者或用户选择父实验与文件映射，调用 `change_proposal_prepare`。该提案固定父快照、源文件摘要、采纳/审查依据、新增/替换/删除路径。由用户查看前后差异并批准应用；服务创建新子实验，不覆盖父节点。批准后输入或审查变更必须重新准备。

## 与原 Git 规则的对应
| 上游目标 | 本项目实现 |
|---|---|
| 一个分支一个写入者 | 独立 Session/TaskAttempt 工作区 |
| 已回答节点不改历史 | 实验冻结与子实验交接 |
| commit 后运行固定代码 | RunManifest 固定实际源码归档摘要 |
| 助手改动不自动 merge | 人工批准的文件提案 |
| push 不等于计算传输 | Run 读取快照，无 GitHub 发布前提 |

不能把提案批准解释为测试通过或正式运行批准。当前开发测试沙箱未实现；任意代码不能借宿主受信示例执行器运行。需要通用运行时，查看 compute 能力并报告 Docker 的实际验收状态。不得让不同候选的所有改动自动合并，必须沿可解释的研究血缘派生。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-git/SKILL.md`（blob `13af3bae031a9434c111c9c5ef77bbb8c80cc3bf`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
