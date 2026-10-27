# 当前交付：Pi Research 0.3.1-experimental

本包加入 科研工作台 技能与文献连接器适配。实际范围、271项测试、外部接口未验收和双版本升级请先读 README.md 与 docs/skills/ADAPTATION.md、VALIDATION.md、UPGRADE.md。

以下是保留的历史交付说明，不作为当前版本验证记录。

---

# Pi Research v0.2.1 交付

这是v0.2.0的缺陷修复与受控流程补齐版本。包括源码、预构建dist、测试、原始设计、固定科研工作台对照、升级与验证说明。

主要修复：审查等待环与冲突覆盖、空产物验收、部分成果卡住、必需运行文件未归档、结果冻结、报告数值复核、跨租约幂等、宿主通知同步。新增安全的文本产物到新子实验交接及模糊结果人工评议，保持计算单独审批。

直接启动：`node dist/apps/cli/index.js doctor`，再运行`node dist/apps/server/index.js`，打开终端输出的私有本机地址。核心预构建程序不要求先安装npm依赖。数据升级先读`docs/UPGRADE-0.2.1.md`。

本次171项测试通过，并在独立解压、无node_modules时再次通过；实际4Run数值活动与旧数据同路径接管案例通过。详见docs/acceptance/verification.md。

真实Pi、Docker、浏览器渲染和全量科研工作台对齐仍未验收。变更交接不是Git合并，没有自动运行开发测试；Alpha不是无人值守科研产品。不要公开访问令牌或把未隔离代码当成宿主受信示例运行。
