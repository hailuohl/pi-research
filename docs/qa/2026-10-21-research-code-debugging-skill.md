# 研究代码调试与回归测试技能

2026-10-21。基线：`c087e1b64ad0c8e205d5178602fadfe46b06aab4`。

新增内置 `pi-research-code-debugging`，仅 coordinator、implementer、reviewer 按需读取，reviewer 只读。内容覆盖固定失败来源、最小复现、单一故障假设、修复前后同测试对照及无法复现时的验证缺口。沿现有开发批准、固定产物、独立审查、批准整合和另批正式 Run；未新增执行接口、依赖或权限，也未安装 Superpowers。

overview 与 git 技能接入入口，当前目录同步为 14 项技能、41 份资源。发行、旧会话和历史资源保留原字节；新会话按所选新发行使用，不自动迁移已固定会话。

## 验收及实际检查

| 检查 | 实际结果 |
|---|---|
| 新增运行时测试的实施前检查 | 2 项按预期失败：缺注册、缺新发行；保留 `debugging-skill-red.log` |
| 角色、正文摘要、旧会话重开/回退及现有技能检查 | 4 个相关单元测试文件，28 通过、0 失败 |
| 一次全量 `npm run test:core` | 2,215 项：2,185 通过、5 失败、25 跳过，退出码 1；未将跳过或失败记为通过 |
| 全量发现的必要修复 | 4 处当前目录旧数量断言及 1 处当前/历史目录恒等断言；保留旧角色、资源、批准和历史校验，仅显式接纳新增技能 |
| 修复后的定向检查 | CLI/HTTP/Worker 5 项、技能管理生命周期 1 项、科学方法历史兼容 1 项，合计 7 通过、0 失败 |
| 保留既有在途修改的集成副本 | 同样 28 项及修复后的 7 项均通过；主工作区与该副本的相关源码及技能构建文件已逐文件比对 |
| 构建及 `npm run verify:build` | npm ci、build、typecheck 均退出 0；独立干净重建的 712 份产物逐字节一致 |
| 独立复核 | 独立 Sol 会话只读复核，无阻断；必要测试修复及目录说明仅定向复查受影响差异 |

全量的 5 个失败均已在上述定向检查中修复并验证。修复只改测试期望和目录说明，生产代码、技能正文、批准接口及运行环境未变，未重复全量回归或干净构建。25 项跳过包括 Windows 不适用的 POSIX 路径/权限检查，以及可选 Docker、LaTeX 集成条件；这些路径未通过本批验证。

## 发行与隔离

- 提交所用干净交付快照的 bundle：`2596e69858f668445f440cd902b3afa94a53673a8a3a379a2329556dfe5f1aa0`。
- 主工作区保留原有未提交内容后的集成 bundle：`711ea79883f2e7166921d3783948620c87b50f4fc180bd3809668afc50e2ff4e`。两者新技能正文相同；其他在途实现未混入本批提交。
- 复核文件及 SHA-256 清单保留于 `.validation/research-code-debugging-20261021/evidence/review-snapshot-final.json`；最终代码、发行、测试及目录说明共 79 份文件，另附本记录。
- 实施与独立复核均显式请求 `gpt-6.1-sol` / `high`；调用接口未回显实际模型和档位，因此记录为“已请求，运行时未回显”。

原始日志留在 `.validation/research-code-debugging-20261021/evidence/`，包括 `full-regression.log`、`debugging-skill-green.log`、`debugging-skill-catalog-fix.log`、`skill-manager-catalog-fix.log`、`scientific-methods-catalog-fix.log` 及对应 `integrated-*` 成功日志。`integrated-catalog-fix.log` 是复制前仍用旧断言的失败检查；成功记录为 `integrated-catalog-fix-after-copy.log`，不混用两者。干净构建原证据位于交付副本的 `.validation/clean-build-NF4ZJM/summary.json`，未复制原始日志入库。

## 限制与后续

未重启用户服务，未单独验证真实 Pi 模型自然选技或新指导下的真实 Docker 调试行为；资源可达与静态流程审查不证明模型会稳定遵守指导。

非阻断后续：可进一步具体化红灯记录的获准交接方式。旧失败作业不会自动加入成功作业的独立审查授权；原件不可读时必须报告缺口，不能声称红灯证据已获独立核验。当前技能已有缺证据时停止或报告缺口的要求，本批不新增跨作业读取权限。
