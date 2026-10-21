# 2026-10-21 科研会话角色与旧 pin 夹具修复

基线 `bc6f86131984d3528b59492c38d436f4f89ac736`，分支 `implementation/pr01-reproducible-baseline`。本批处理“合法科研会话准备实验与 Run”，前端布局继续暂缓。

## 根因和修复

- 简报用例伪造 designer actor，却复用 coordinator 根会话。改用现有 `startTeam/spec/actor` 和真实 claim，断言会话角色、taskId 和独立 sessionId。保留子实验不直接绑定简报、缺失／空 root 和初始引用断言；补新 ready 未确认时拒绝、intent／approval 不增加、确认后用新 revision 且旧 intent 引用不变。
- 指标用例把 reviewer role 放在 `sessions.create` 第三参，实际得到 coordinator。改至第四参并断言实际 reviewer，保留原 `METHOD_METRICS_SOURCE_DENIED`。
- 修正角色后才走到旧 pin 子段：d18 支持 claims v1，默认夹具却先编译 v2，正确触发 `MEASUREMENT_PROFILE_REQUIRED`，尚未执行指标来源请求。仅该子段改为关闭默认编译、使用 `paired-plan-claims-v1`、去除 v2 的 assessments，断言实际 d18 pin 和 `method-contract-v5`；原已确认计划、来源拒绝和显式指标需要 `APPROVAL_REQUIRED` 的断言保留。

未修改生产权限、错误优先级、默认共享 helper、SDK、schema、依赖或超时；没有给旧 pin 补发新能力。该 helper 原有合成会话绑定逻辑保持原样，本批只核对实际 pin。

## 实际验证

| 检查 | 结果 |
|---|---|
| 修复前两项目标 | 分别复现 `TASK_SCOPE_DENIED` 和错误 reviewer 导致的 `BRIEF_NOT_CONFIRMED`，保留两份 red 日志 |
| 简报文件全量 | `batch2-brief.log`：8 通过、零失败／跳过／取消；包含新 ready 零副作用、确认后新引用、旧引用和重开检查 |
| 指标相关初轮 | `batch2-metrics.log`：4 项中 3 通过、1 失败；失败是后来可达的旧 pin/v2 夹具编译前提，不把该轮记为通过 |
| 旧 pin 目标修后 | `batch2-metrics-fixed.log`：目标 1 通过；前轮另三项各自独立 setup、用例与共享 helper 未改，复用其通过证据，不重复 150 秒的 accepted metric source 用例 |
| 已提交代码独立交付检查 | 从 HEAD 归档，不带入在途功能；复用固定 Node 24.19.0／TS 5.8.3，后端编译成功；只复制本批已跟踪简报测试后 8/8 通过，见 `batch2-committed-tsc.log`、`batch2-committed-brief.log` |
| 精确补丁 | 对原 B3 副本实际 apply，输出哈希与实测工作区文件完全相同 |
| 独立复核 | 独立 Astra/xhigh 只读复核，无阻断或需修复问题；确认角色、历史能力、零副作用、固定引用和实际日志 |

证据留在 `.validation/backend-fixture-repair-20261021/`，不重复复制原始日志入库。原整套回归和干净构建的统计保留原状，本轮只重验受影响部分。18 个相关生产 TS 和 18 个编译 JS 与原验证快照同字节，见 `baseline.json`、`runtime-match.json`、`batch2-extra-guard-match.json`。

本批两个直接服务用例没有新增动态租约拒绝测试；Registry 的身份、generation、attempt、租约守卫已静态核对，并复用前轮实际通过的 changed lease/generation、expired actor 与 actor spoofing 检查。对应 Registry、权限、handoff、协作及方法编译生产源／编译文件哈希均核对相同。

设计诊断显式请求 `gpt-6-astra/high`，测试实施请求 `gpt-6-luna/max`，独立复核请求 `gpt-6-astra/xhigh`。接口接受但运行时未回显实际模型和档位；主会话配置未改。

## 冻结和交付边界

- 已跟踪简报测试 SHA256：`57491ad3a7e5eaf7d9a0b784ffa0bc4d9776d44d37e89ddcd3488ba013246765`，本批正常提交该测试。
- B3 原文件 SHA256：`b3ecf5e2c14a145fcacf386cdc3a71b9e312a29863c057bfcd6d7d65439b636e`。
- B3 实测修复后 SHA256：`c6652bbc05213adb16eb4c2e7b755317faa995e2c187d20e8423da598926b04d`。
- B3 补丁 `docs/qa/patches/2026-10-21-metric-role-and-legacy-fixture.patch`，SHA256 `3f221f52d4db16c114d198b378135a72887f5a50fe5d5f67819e1e7b58fd9fce`。

提交前仅将 B3 补丁上下文规范化，修正末尾空白检查；两份测试源哈希不变。原独立复核者已局部补查新补丁与应用结果，原结论继续适用。

B3 原测试、support 和科研功能仍未入库。本批已在工作区修复并验证，远端仅保留精确补丁，不整体纳入他人在途功能，也不声称该 feature 的完整源码已独立交付。补丁应在原功能所属批次入库时接纳。前一项 SDK 夹具修复见[批次一记录](2026-10-21-formal-sdk-fixture-repair.md)。
