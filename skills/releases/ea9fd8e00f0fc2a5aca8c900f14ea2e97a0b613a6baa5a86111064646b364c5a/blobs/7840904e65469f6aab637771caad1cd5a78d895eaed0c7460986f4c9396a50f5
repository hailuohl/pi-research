---
name: pi-research-feedback
description: "Use when recording a product bug, limitation, unexpected behavior, or requested capability."
---

# 本地问题记录，不自动上报

这是上游反馈技能的隐私保护改写。**不向 OpenResearch 或任何第三方静默发送反馈，不自动上传研究信息，不调用遥测。** 不保留上游“发送后保持沉默”的行为。

用户提出产品问题或执行中遇到明确阻塞时，记录：预期、实际、最小步骤、状态与错误码、影响范围、临时绕行方式、版本和已尝试检查。区分产品 bug、环境不可用、未实现能力和研究假设不成立。不要把某接口请求失败说成文献不存在。

有 artifact_create 权限可生成本地诊断草稿；只读 Reviewer 可返回结构化说明，请主会话或用户保存。不因有此技能而扩大写入权限。用户可以主动选择导出和自行提交；目前没有 GitHub issue 或外部反馈提交连接器。

默认去除路径、访问令牌、API key、私钥、论文正文、用户姓名、模型账户、数据集和未公开结果。必要时用通用名描述命令和流程。不要复制未经审查的完整日志；同时保留本地原始证据，使用户可核查脱敏是否影响诊断。

相同问题一次回合只记录一份，已修复/未修复状态依据实测，不把“已报告”当成解决。网络不可用时报告本地事实，不为了提交反馈尝试另一供应商。最终回复明确产物、限制和用户仍需采取的操作，不能承诺后台继续修复。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-feedback/SKILL.md`（blob `82a729e681bb9fe361589aa953d92769b698196f`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
