---
name: pi-research-instances
description: "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace."
---

# 持久实例与实验作业

原上游可以通过组织账户申请持久机器；本项目当前 **未实现实例申请、资源目录、计费、SSH 登录或远程工作台**。`connector_status` 对 standalone-instances/managed-compute 返回不可用；不可填写一个虚构实例 ID 作为成功。

持久实例用于用户交互式开发；Run 是固定快照的一次有界执行。不要把启动一个远端进程当成已管理实例，也不要把创建实例当成实验已跑完。浏览器断开、Agent 中止、作业取消和释放机器是四个不同动作。

收到需求时明确：目标是本地控制远程计算，还是整个工作台部署远端；是否已有用户明确授权的资源；CPU/GPU、内存、存储、最长占用、地域和数据传输边界。只整理可检查的连接/资源需求草稿；不要索要、打印或保存私钥到成果，也不要从宿主环境寻找未授权账户。

没有对应适配器时交回用户，列出所需能力与未完成步骤。禁止调用 ORX 托管账户、自动选最便宜供应商、借另一工具 provisioning，或把这份技能当成基础设施已经存在的证明。后续实际实现应分别验收创建、查询、销毁、失联、孤儿资源和重复请求，不用静态命令模板代替实测。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-instances/SKILL.md`（blob `80bf26dc1634a4809fae9ee3d0c5598951258026`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
