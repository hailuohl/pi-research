# 智谱中国 Coding Plan 接入与 OpenResearch 流程对照

日期：2026-10-02。范围仅为本地 Pi 模型配置、真实连接验收和代码对照；没有改动前端布局或研究执行权限。

## 验收条件与结果

1. 使用 Pi 0.87.1 已有的 `zai-coding-cn / glm-5.3`，端点为 `https://open.bigmodel.cn/api/coding/paas/v4`。真实 SDK 请求返回“连接成功。”，正常结束。
2. 当前 4794 工作台默认模型已保存为该模型，思考等级 `off`。新建的验证会话实际经过 AgentHost、Pi Worker、受管模型 HTTP 和 `project_inspect`，回复当前项目名称并回到 `idle`。
3. 密钥仅在被 Git 忽略的本地 `.env` 和当前数据目录的 `models.json` 配置；未写入页面模型预设、代码或交付证据。当前进程不读取刚修改的 `.env`，所以同时配置其模型凭据文件；未来普通服务启动读取 `.env` 中相同端口和数据目录。
4. 原会话的模型绑定和记录保留，原夹具供应商配置保留用于已有验收历史。没有重启 4317 服务、4794 服务或已有模型/运行作业；没有覆盖其他在途文件。

真实验证的精简机器结果见 `evidence.json`。原日志和浏览器状态留在本地 `.validation/zhipu-coding-plan/`。本批只改动文档和被忽略的运行配置，未重复执行上一批应用全量回归或构建。

独立 Sol 只读复核通过：核对模型目录、精简验证证据、Git 忽略规则及原服务 PID；未读取密钥、原生会话或重复调用模型。

## 本地代码对照

对照目录：`D:/项目/ican/OpenResearch` 与本项目当前实现。下列结论来自代码和技能内容，并不把引导提示等同于保证科研成功。

| 环节 | OpenResearch | Pi Research 当前流程 |
| --- | --- | --- |
| 明确问题 | ChatPanel 起始任务引导用户收敛问题、调研、搭基线和运行实验；继续 Codex/Claude 原生会话。 | 由 Pi 对话推进，已有受限协调者工具；研究问题、计划与后续步骤的持续状态衔接仍需完善。 |
| 检索与证据 | `orx-lit-review` 等技能指导编码智能体使用命令行检索、整理工作树文件。 | 使用项目来源开关、连接器、固定授权与证据记录；来源内容与推断有明确边界。 |
| 实验与运行 | 实验对应 Git 分支/工作树；智能体按实验树技能创建分支、运行命令、查看日志及决定下一步。 | 智能体从对话创建候选、冻结 RunIntent，用户在原对话确认后提交；实验页查看树、历史、日志和实际指标。 |
| 执行权限 | 编码智能体可以使用本地终端和工作树；ChatPanel 支持不同计划和权限模式。 | Pi 禁用 SDK 内置终端工具，使用宿主工具白名单；开发、计算、整合和发布保留固定审批。 |
| 论文与 PDF | `orx-paper` 技能指导智能体在工作树写 `.tex` 并编译。`src/commands/paper.rs` 是已有论文的检索/阅读入口，不能当作写论文接口。 | 已有文稿冻结、受控编译、PDF 校验、审查和导出服务；它们尚未完整接入主对话的连续执行流程。 |

主要证据位置：

- OpenResearch：`ui/src/components/ChatPanel.tsx` 的起始任务和权限选择；`src/local/native_chats.rs` 的原生会话；`src/commands/create_experiment.rs`、`src/local/experiments.rs`、`src/local/localrun.rs`；`agent-skills/orx-lit-review/SKILL.md`、`agent-skills/orx-experiment-tree/SKILL.md`、`agent-skills/orx-paper/SKILL.md`。
- 本项目：`apps/agent-worker/index.ts`、`packages/pi-adapter/options.ts`、`packages/pi-adapter/sessions.ts`、`packages/workspace/experiments.ts`、`packages/runners/service.ts`、`apps/web/src/chat-workflows.tsx`、`packages/publications/build-service.ts`、`packages/publications/reviews.ts`、`packages/publications/reports.ts`。
- Pi 内置模型：`node_modules/@earendil-works/pi-ai/dist/providers/zai-coding-cn.js` 和对应模型目录；公开模型资料：<https://pi.dev/models/zai-coding-cn/glm-5-3?name=pi>。

最需要补齐的是主对话中的“研究问题 → 计划 → 实验结果 → 文稿冻结 → 编译 → 审查 → 导出”连续状态与工具接线。已有后端能力可以复用，不需要重做整套实验或论文系统。本批未扩展这部分实现。
