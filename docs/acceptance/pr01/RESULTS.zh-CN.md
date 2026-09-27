# PR01 实施与验收记录

日期：2026-09-28（Asia/Shanghai）。范围：实施计划 PR01 的代码与本地验证。**真实模型调用尚未执行，PR01 整体尚未放行；PR02–14 尚未开始实施。**

开发目录是独立的 `pi-research/`，由用户提供的 v0.3.1-experimental-skills ZIP 导入。两份原 ZIP 和 `review/` 源码副本保留。初始导入提交为 `f5ef5aef3ca4af6a18bbc58f40c21e92536e87f0`；当前代码可在本地 `implementation/pr01-reproducible-baseline` 分支查看，未配置远端或推送。

## 已落地

- 固定 Node 24.19.0、npm 11.17.0、TypeScript 5.8.3、Pi SDK/pi-ai 0.87.1，并锁定其 Pi 子包。构建与类型检查使用本地编译器；缺依赖时明确失败。`setup:pi` 使用已提交的根锁文件执行 `npm ci`。
- 保持核心预构建包无依赖启动。SDK 使用动态导入和真实类型契约；修复原 `require.resolve` 无法加载 import-only ESM 导出的问题。根目录固定安装优先，仅无根安装时兼容旧 `.pi-runtime`。
- 真实 SDK 离线创建会话、工具白名单隔离、精确文件与会话 ID 恢复已经验证。拒绝不存在、空、坏 JSON 行或不支持版本的恢复文件，避免 SDK 静默修复或新建替代；被拒文件原字节保持不变。中止与供应商错误分别处理，缺包、安装不完整、版本、模型、凭据与权限错误可区分。
- 增加真正经过 Worker IPC 的 opt-in live 检查：私有读取/写入、流输出、引导、使用量、原生会话恢复与中止；当前为未执行。确定性 Worker 和离线合成会话只属于契约验证。
- 修复 Windows 下链接与只读文件篡改测试；批准后复制故障注入不再依赖 Linux `/proc`，且断言注入确实命中复制阶段。两项“缺 SDK”HTTP 测试使用隔离目录，避免安装真实 SDK 后测试前提改变。
- 冻结 ZIP 身份、浏览器资源摘要与 [21 项能力矩阵](../../reference-baseline/capability-matrix.json)。矩阵单独列出代码、配置、契约测试、目标环境集成、用户旅程；未将原计划后续项删除。

## 实际运行结果

环境：Windows、Node v24.19.0、npm 11.17.0。以下都是本次执行的输出。

| 检查 | 结果 | 证据 |
|---|---|---|
| 根锁文件干净安装 | 通过，230 个包 | [npm ci](npm-ci.txt) |
| setup:pi 安装入口 | Windows 下退出 0，使用根锁文件安装 | [setup 输出](setup-pi.txt) |
| 独立空目录 npm ci / build / typecheck | 全部退出 0 | [摘要](clean-build-summary.json)、[安装](clean-npm-ci.txt)、[构建](clean-build.txt)、[类型检查](typecheck.txt) |
| 当前 dist 与干净重建 | 204 个文件集合及每文件 SHA-256 完全一致 | [产物清单](dist-manifest.json) |
| 当前完整测试 | **273/273，0 fail，0 skip** | [完整输出](current-tests.txt) |
| 矩阵、依赖/资源固定、缺本地编译器、无依赖 CLI/认证 HTTP 启动 | **4/4** | [parity 输出](parity-tests.txt) |
| v0.2.3 冻结业务源码回归 | **245/245，0 fail，0 skip** | [测试](stable-tests.txt)、[安装](stable-npm-ci.txt)、[构建](stable-build.txt)、[类型检查](stable-typecheck.txt) |
| v0.3.1 冻结业务源码回归 | **271/271，0 fail，0 skip** | [测试](experimental-tests.txt)、[安装](experimental-npm-ci.txt)、[构建](experimental-build.txt)、[类型检查](experimental-typecheck.txt) |
| 真实 Pi 模型调用 | **0 pass、1 skip：未配置并启用 live** | [原始输出](live-tests.txt) |
| 独立代码审查 | 两项问题修复后复审无剩余可行动问题；定向检查 6/6 | 旧运行时遮蔽与空/损坏原生会话恢复已加入上述回归 |

两版回归使用其各自完整测试集合，在独立验证副本应用 5/6 个跨平台测试文件片段补丁；**不是宣称原 ZIP 的测试原样全绿**。未覆盖旧版业务代码或测试集合。原业务源码、复制后源码、测试后源码摘要一致；原始日志与每个测试补丁前后 SHA-256 在 [双版摘要](baselines-summary.json)。逐文件核对原 ZIP 的 apps/packages，与评审源目录分别 76/80 个文件一致，见 [归档核验](archive-verification.json)。

npm 11.17 的安装输出含上游弃用与待批准 install-script 提示；日志完整保留。此环境下构建、类型检查和真实 SDK 离线创建成功。未将这些检查当成所有供应商或所有 SDK 功能可用的证明。

## 复跑

切换到固定 Node/npm，在开发目录执行：

```powershell
npm ci
npm run typecheck
npm test
npm run test:parity
npm run verify:build
npm run test:baseline -- '..\review\pi-research-v0.2.3-fixed-skills\pi-research' '..\review\pi-research-v0.3.1-experimental-skills\pi-research'
npm run test:live
```

最后一条默认跳过。真实验收需要在调用进程环境中配置 `PI_LIVE_TEST=1`、`PI_PROVIDER`、`PI_MODEL`、`PI_API_KEY`，并使用所选供应商额度。密钥不写进文档、Git 或聊天；live 检查使用独立 HOME、agentDir、workspace，不读取个人 Pi 全局凭据。临时目录保留原生会话与不含密钥的证据 JSON，输出中会显示证据路径。当前 live harness 的工具权限只验证这条私有测试路径，不能证明 PR02 的全工具统一授权或后续科研闭环已经可用。

## 放行状态与下一关

PR01 的构建、源码身份、跨平台回归、真实 SDK 离线契约和无依赖启动已验证；供应商真实调用、浏览器科研旅程、上游 M0 页面截图仍为未验证。没有通过所有维度的能力不升级为“目标环境可用”。

下一关是配置并执行真实 Pi 验收，然后进入 PR02 的统一 OperationRegistry 与精确输入/输出 Schema。PR03–06 的指定实验源码、开发测试、GitWorkspace、通用 Docker Runner，以及 PR07–14 的调度、研究闭环、工作台、文献、技能、论文与分发仍保留在实施计划中。本轮未改变本地文本检索默认关闭、审批、权限或发布策略。
