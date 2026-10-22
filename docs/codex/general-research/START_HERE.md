# Codex接手入口：研舟π五日产品功能改进

目标：五个工作日内完成一组真实的产品功能改进，不制作竞赛文稿，不把长期设计全部实现。产品定位仍是通用科研工具。

## 必读
- 根：AGENTS.md
- 产品计划：../../superpowers/plans/2026-10-21-general-research-plan.md
- 长期产品设计：../../superpowers/specs/2026-10-21-general-research-design.md
- 唯一开发状态：STATE.json
- 当前交接：HANDOFF.md
- 验收标准：VALIDATION.md
- 代码基线：BASELINE.json

## 启动指令

请在 D:\项目\pi research\pi-research 按产品计划继续开发研舟π。

本轮只修改产品功能，不制作比赛简介、技术报告、演示视频、资源清单、报名或提交材料。先读取根AGENTS.md、本文件、STATE、HANDOFF和产品计划，核对真实HEAD、dirty改动、在途进程、已有能力和验证入口。不得覆盖已有改动。

五日目标是改善一条真实的产品流程：看懂当前任务目标与范围→确认操作→执行→查看真实验证证据→关闭会话并恢复原任务。优先复用现有ResearchBrief、Task/Attempt/Run、OperationRegistry、权限、交接、证据与工作区。先审计现有功能，只实现确实缺失的部分，不新增平行状态机、执行内核、调度器或权限系统。

按计划Day 1至Day 5推进；每天以真实可验收结果为准，不按代码行数或文档数量衡量。Day 2结束时核心流程仍不稳定就继续减范围。未实际运行的检查不能标pass；unknown不得伪装成失败或成功。每次会话结束更新STATE和HANDOFF，记录准确下一步。

## 续接规则

1. 读取STATE.nextTaskId和activeBatch，确认没有其他执行者占用相同任务。
2. 先核对代码快照和dirty改动；观察超时先查原进程/操作，不重复启动副作用。
3. 选择依赖已满足的任务，只做本轮范围内的修改。
4. 定向测试通过后做必要集成验证和独立复核。
5. 状态、验证、Git提交和远端同步分开记录。
6. 五日结束后停止本轮，不自动扩展新模块。

