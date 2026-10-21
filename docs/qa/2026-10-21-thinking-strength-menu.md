# 2026-10-21 思考强度选择交互

复核基线：`c087e1b64ad0c8e205d5178602fadfe46b06aab4`。交付父提交：`3918881d28e7661012f2cdd483fa5191c2583121`，分支 `implementation/pr01-reproducible-baseline`。仅修复会话模型菜单，前端布局继续暂缓。

## 验收与结果

1. 成功选择强度不显示“已保存”。当前保存链路直接调用 API 和局部确认回写，没有调用全局成功提示；浏览器确认成功路径无该文案。
2. 点选、键盘提交及快速成功回执后，强度面板保持打开，允许继续选择。
3. 主动关闭后重开，显示服务端已确认强度。
4. 保存失败或回执不匹配仍显示错误并恢复确认值；锁定、切换会话、外部不同选型和无效档位边界保留。

成功回执可能早于 React 交付父组件的新属性。原菜单提前清除在途请求，随后把自身确认误判为外部选型变化而关闭。修复仅短暂保留已确认选型，收到对应属性后清除。

## 验证证据

- 回归 RED：旧实现新增菜单测试 17 通过、1 失败，失败为成功回执后 `open=false`；完整旧应用实际点选 `/model` 返回 200，但原生 popover 已关闭。
- 相关测试：菜单与输入控件 44/44 通过；独立复核者另行确认 44 通过、零失败、零跳过。
- 浏览器：完整应用、隔离数据目录、真实本地 HTTP，Edge `155.0.4283.45`，1365×900。Browser 插件不可用，使用现有 Playwright 和已安装 Edge。修复后点选和键盘选择保持打开；Escape 关闭后重开保留“适中”；注入 409 后保持打开、显示错误并恢复“适中”。成功路径无“已保存”，无应用控制台或页面异常；注入失败仅产生预期 HTTP 409 控制台记录。
- 干净安装、构建、类型检查通过，724 个产物一致。证据 `.validation/clean-build-7aMVYB/summary.json`，产物清单 SHA256 `0591e7c6614da2a95d979707e08a8b712706d9ffb80fbf1db689de510cf0a4ef`。
- 一次全量 `npm test`：2,387 项，2,356 通过、6 失败、25 跳过、零取消，退出码 1；原始全量未通过，不将跳过或后续定向结果混记为全量通过。菜单相关回归在全量中亦通过。

全量中发现的菜单范围外问题不扩批修复。正式审查 IPC 的 `fixed SDK sequential review tools deliver a larger full inventory and compact result through production Host` 定向重跑仍为 1 失败：`formal-review-batch-ipc.test.mjs:47` 的工具完成事件摘要／交付字段断言得到 `undefined`，根因未定。该测试只经过 Host、worker、dispatcher 和正式审查服务，不导入本批菜单；首次失败时曾有临时产物比对占用额外资源，已停止，但不能据此归因。重跑日志为 `formal-sdk-retry.log`。

三个技能目录相关失败也不导入菜单。全量启动时工作区 manifest 比基线多出 `pi-research-code-debugging`，由 13 项变为 14 项，旧测试的实际失败均为 `14 !== 13`。回归期间另批提交 `3918881` 已修正这些断言。复用其已有集成成功证据：`.validation/research-code-debugging-20261021/evidence/integrated-catalog-fix-after-copy.log`（5 通过，含 HTTP 与 Worker）及 `integrated-skill-manager-catalog-fix.log`（1 通过）。实际差异、成功日志与当前测试文件已核对，不重复运行整套回归。

另外两个后端失败继续作为范围外待办：`tests/unit/research-brief-runs.test.mjs:60` 在 dropped intermediate brief binding 用例抛出 `TASK_SCOPE_DENIED`；`tests/unit/scientific-claims-workflow.test.mjs:65` 的 metric source 用例期望 `METHOD_METRICS_SOURCE_DENIED`，实际为 `BRIEF_NOT_CONFIRMED`。它们的运行准备和研究简报调用链不经过菜单。合并上述技能批次的已有验证后，仍有正式审查 IPC 与这两项研究流程共三项未解决失败，本批不修复、不削弱断言。

原始浏览器记录、截图、回归日志留在项目父目录 `tmp/thinking-strength-20261021/`，不提交原始日志、验收数据库或认证文件。

## 复核与交付范围

独立 Sol/high 复核无阻断、无非阻断发现。实施与复核均显式请求 `gpt-6.1-sol/high`，运行时未回显实际模型和档位。复核冻结源码 SHA256 `3e57ab0943c33c9b0dcd0c6be0a9300abff832ccd43c4f98eaf4903eef71bc04`、测试 SHA256 `f0120008e1b38f346225cf43b248c5a8d96b5bd842c3eba4bea9f91c532f612d`，补丁 SHA256 `b8e029e4b9816a6c34cd2fc5d2f9ee13b7445c890f17a3c98a0036c792446bc5`。

回归期间新增的 `3918881` 未修改前端源码、静态布局、构建脚本或依赖；冻结文件哈希不变，原独立复核、浏览器与构建证据仍适用。

仅提交菜单源码、菜单测试、对应模块与入口包及本记录。入口包从基线的 50 个已跟踪前端源文件加本批菜单修改独立生成，逐个 Git blob 校验仅菜单不同；最终在基线应用与包源码的隔离副本中复用锁定依赖、运行仓库构建脚本，避免纳入工作区其他在途修改。该包亦通过实际应用点选、键盘与重开验证。入口包 SHA256 `1b11434b2de65b983310d44b2e18c050132737eaaa88c6f1c5db4b58d1d0bbec`。

未额外运行 Docker、外部模型请求、科研流程或其他视口；无后端接口、依赖、数据迁移或布局改动。

## 后续修复

上述三项后端待办已在用户授权后的两批中修正测试夹具并通过对应检查，见[正式审查 SDK 夹具](2026-10-21-formal-sdk-fixture-repair.md)及[科研会话角色与旧 pin 夹具](2026-10-21-research-role-fixture-repair.md)。原全量统计保持原样；本次未改生产权限或前端布局。两份尚未入库测试在工作区已修复，远端保存精确补丁，未把整套原在途功能混入提交。
