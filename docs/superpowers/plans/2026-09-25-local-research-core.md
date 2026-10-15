# Pi Research 实施计划

**Goal:** 交付可以实际启动、持久化项目、提交固定快照实验、进行受控 Pi 会话和多智能体调度的本地版本。
**Architecture:** TypeScript 控制服务 + SQLite + 独立 Pi Worker + 独立 Runner Supervisor + React 工作台。Web、CLI、Agent 都复用同一业务服务。
**Spec:** ../../specs/project-design.txt；../../specs/multi-agent-design.md。

## 全局约束
Pi 唯一 Agent 内核；不调用 ORX。默认禁止委派。协作、实验、发布分离批准。TaskAttempt 与 Run 分开。不可变产物与来源快照。未验证能力明确不支持，不生成模拟 AI 回答。

## 当前执行环境与决定
- 新项目在独立目录/功能分支开发，不修改用户已有仓库。
- npm 网络不可达；核心运行使用 Node 内置模块。开发依赖固定并生成锁文件。交付预构建文件使用户无须先安装开发依赖即可启动。
- Pi SDK 固定 0.87.1，动态加载独立运行时。未取得真实模型凭据，不冒充真实科研验证。
- 离线可用的 React UMD 16.0.0/ReactDOM 16.0.1 用于本地工作台，使用 class 组件与 TypeScript；不引入设计未要求的图像概念制作或 CDN 依赖。后续升级 React 属独立兼容测试，不隐式更换执行基线。
- 首版重点是 M1/M3 与可验证的 M2/M5/M6 增量；M0 静态基线与未验证差异留档；全部远程后端、Overleaf、托管账户、桌面安装不会标记完成。

## 任务与验证
- [ ] 1. 领域、SQLite、幂等事务、版本与权限。文件 packages/domain、storage、policy；先写 tests/unit/core.test.mjs，检查重复/冲突/持久化/路径和预算。
- [ ] 2. 项目、快照、审批、实验与独立本地 Runner。文件 workspace、runners、apps/runner-supervisor；tests/integration/runner.test.mjs 真实执行、冻结、缺指标、取消、服务退出恢复。
- [ ] 3. 团队、任务图、结果审查、租约、排队、停用与需求变更。文件 collaboration、scheduler；tests/unit/collaboration.test.mjs 检查 MA-01/04/05/06/07/09/10/11/13/15/17。
- [ ] 4. Pi SDK 独立 Worker、受控工具、会话恢复/引导、中止。文件 pi-adapter、research-tools、apps/agent-worker；tests/integration/agent.test.mjs 检查未配置状态、工具越权、真实进程隔离测试（测试 Worker 明确标识，不作为模型验证）。
- [ ] 5. 统一 API/CLI、事件游标、文献元数据与成果。文件 apps/server、cli、literature、publications；tests/integration/api.test.mjs 检查认证、来源、幂等、请求校验、跨项目与证据。
- [ ] 6. React 工作台：项目/会话/协作/实验/证据/文件/设置。浏览器验收创建项目、开关、计划审批、实际运行、文件冲突、手机视口。
- [ ] 7. 全量验证、源码自审、能力矩阵、启动说明、构建产物和 ZIP。

每个任务执行：写测试 → 观察未实现失败 → 编写实现 → 运行测试 → 留存日志。测试和最终能力声明分开：通过 API 测试不代表远程服务或真实科研验证。

## Review Focus
跨项目引用、路径/符号链接、授权后修改版本、重复提交/失效租约、进程结束与科研结论/依赖验收混淆。每项在相关单元或集成测试中明确断言。

## 本次交付状态

任务1—3与5的本地核心已实现，测试名称以docs/acceptance/verification.json为准。任务4适配器已编码但真实Pi未测；任务6已构建并由HTTP提供，但浏览器被受管策略阻止，未通过E2E/视觉门槛。任务7交付源码、预构建和明确差异，不能等同M0—M9完成。原计划中的测试文件命名已细分为实际unit/integration文件，不存在的agent.test.mjs和api.test.mjs不是通过证据。
