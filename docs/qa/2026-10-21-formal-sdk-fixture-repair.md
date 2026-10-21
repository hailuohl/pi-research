# 2026-10-21 正式审查 SDK 读取夹具修复

基线 `fbec2ae3eb29ee2d42a190148feb686ca50a02cc`，分支 `implementation/pr01-reproducible-baseline`。本批只处理正式审查 SDK 读取流程；前端布局继续暂缓。

## 根因和改动

准备后的审查固定为 `readRoutingVersion=1`，真实 SDK 的广告 schema 要求 `targetId`。原机械夹具仍发送 `kind/path`，在 RPC 前被 `prepareArguments` 拒绝，工具结束事件自然没有 Host 的交付 token 和结果摘要。生产事件字段没有改名，也不需要放宽读取协议。

SDK 用例现在从该次审查公开的 `targets[].readInput` 生成请求，只推进原 cursor 和 64000 字符分页。新增 fixture 协议和输入存在性检查；保留原顺序、数量、摘要、交付、2048 token 与两次本地请求断言。未改生产代码、权限、schema、包体或超时。

## 验收和实际证据

| 检查 | 结果 |
|---|---|
| 原失败 | 前批全量及独立单例均在摘要／交付断言得到 `undefined`；原日志保留于父目录 `tmp/thinking-strength-20261021/` |
| 集成文件全量 | 3 通过、零失败／跳过／取消。真实 SDK 31 次顺序读取、31 条已交付记录、最大同时在途 1、两次本地 HTTP 请求 |
| 原直接 IPC 大正文 | 九条读取均精确匹配正文摘要，每条两次资格核对、late=0；最长 13537 ms，原 30000 ms 边界保留，无真实 fit 执行 |
| ACK 与撤权边界 | 3 通过：pending 不计覆盖；错误 token/digest/call/tool 与缺失 worker 状态不能确认；权限 epoch 变化后仍 pending，旧响应未发送正文 |
| 重开与机械覆盖 | 1 通过：完整读取含空日志，关闭并重建 ResearchApp 后保留机械完成状态，来源损坏仍拒绝；不把机械覆盖当作科学验收 |
| 补丁可应用性 | 在原始文件副本应用补丁，结果 SHA256 与本批实测文件完全一致 |
| 独立复核 | 独立 Astra/xhigh 只读复核，无阻断或需追加问题；确认原／新文件、补丁和 24 份生产文件哈希与证据一致 |

本批共 7 项新鲜检查通过，零失败／跳过／取消。证据保留在 `.validation/backend-fixture-repair-20261021/` 的 `batch1-ipc.log`、`batch1-boundaries.log`、`batch1-reopen.log`，不复制原始日志入库。

12 个相关生产 TS 文件和 12 个编译 JS 文件均与前批已完成全量和干净构建的快照逐字节相同，见 `baseline.json`、`runtime-match.json`。本批是原全量失败后的测试夹具必要修复，复用仍适用的通过项和构建证据，未重复整套全量；原全量的失败状态不改写为全绿。

诊断会话显式请求 `gpt-6.1-sol/xhigh`，独立复核显式请求 `gpt-6-astra/xhigh`；接口接受但运行时未回显实际模型和档位。短小夹具修改由主代理完成，主会话配置未改。

## 冻结和交付边界

- 原测试 SHA256：`c83c42cc31ed1d4e1563ad08e8cb1971677a5b3654b1becb6edf03f0cf909484`。
- 实测修复后 SHA256：`8381bcd3db1bf261086b54f6eb737353c4f3489778a0e212345a65984d42a3ea`。
- 补丁 `docs/qa/patches/2026-10-21-formal-sdk-read-input.patch`，SHA256 `c014f9908ff3a571f73206e54b0578a5837dea174656451f6f4110f7d8308ff1`。

原测试、support 及固定目标路由属于已有尚未入库科研功能。本批已在工作区修复并验证，只把本次精确补丁、计划和记录提交远端；不把整份原测试和整套在途功能混入提交，不声称 HEAD 已具备该功能的独立可运行源代码。原功能入库时按补丁接纳本次差异。另两项角色夹具失败留给下一批。
