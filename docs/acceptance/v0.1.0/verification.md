# 验证记录 · Pi Research v0.1.0

日期：2026-09-25。运行环境：Linux x86_64，Node.js 22.16.0，TypeScript 5.8.3。

## 已实际通过

| 检查 | 结果 | 证据 |
|---|---|---|
| TypeScript 前后端构建 | 通过 | `npm test` 中先执行 `npm run build` |
| 前后端严格类型检查 | 通过 | `typecheck-output.txt` |
| Node 单元与集成测试 | **61 通过 / 0 失败 / 0 跳过** | `test-output.txt`、`verification.json` |
| HTTP → 项目 → 审批 → 快照 → 真实 Run → 报告 | 通过 | `tests/integration/http.test.mjs` |
| 独立监管进程不依赖控制数据库连接存活 | 通过 | `tests/integration/runner.test.mjs` |
| 独立 CLI 数值闭环 | **4 个实际 Run，全部 succeeded / complete** | `demo/run-summary.json`、`demo/metrics.csv`、`demo/comparison-report.md` |

这是产品状态、权限和实际数值代码测试，不是 SCI 科研有效性证明。CLI 不使用 LLM；协作状态测试显式提交固定结果 fixture。

## 未通过或未执行的门槛

**浏览器 E2E / 视觉检查：阻塞。** Playwright 启动 Chromium 后，本地 URL 导航返回 `net::ERR_BLOCKED_BY_ADMINISTRATOR`。未修改受管策略，未伪造截图；没有执行成功的浏览器用户旅程。所附 `tests/e2e/workbench.py` 需要在允许访问本地服务的开发环境重新执行。

**Pi SDK / 真实多智能体：未实测。** 本环境没有安装固定 Pi 0.87.1，Node 22.16.0 也低于其要求的 22.19.0。SDK 选项、工具允许列表、精确会话恢复、模型错误分类是契约测试，不是已安装包或真实模型调用测试。

**Docker：未实测。** 无 Docker 服务；不接受以参数代码或失败关闭检查替代真实容器验收。

**Crossref：未实网验证。** 元数据幂等测试使用明确的本地响应 fixture；没有把它当成搜到真实论文。

**SSH / Slurm / Kubernetes / Ray / HF Jobs / Modal / Tinker / 托管计算：未实现。**

**完整 M0—M9 和 24 项多 Agent 验收：未全部完成。** 没有全量上游基线截图、远程故障注入、Overleaf 同步、资金账本或真实科研对照。功能矩阵保留这些缺口。

## 自审发现及处理

处理了：越权读取同项目非任务输入、敏感文件变体、符号链接根目录、导入失败残留对象、子模块快照遗漏、文献查询重复落库、模型供应商错误被当成完成、不同契约指标混比，以及失败上游重试后下游永久阻塞。

每项相关修复有新增测试；最终全套重新通过。审查人为本次实现者，**不是独立代码审查或第三方安全认证**。

## 发布前仍建议在目标机器验证

安装固定 Pi 包并实际发送一个小问题；确认模型 ID、真实用量、流式事件和中止。开启协作，给两个助手各自的明确输入证据；确认独立 Session、结果回传、审查和关闭收尾。关闭再启动控制服务，检查会话恢复与已提交 Run 对账。

Windows 原生、WSL、Docker和远程服务器应分别验收。生产接入前还需操作系统级隔离、更新前端依赖、完整预算、数据迁移、备份恢复和权限审计。

## 解压独立验收发现并修复的竞争

首轮解压后测试为59/60，取消测试超时。随后通过真实独立进程复现：控制进程取消与监管心跳竞争，心跳在事务外读取版本，写入时抛出 VERSION_CONFLICT 导致监管进程退出。修复为心跳读取/写入与启动状态更新在同一 SQLite 写事务内，过期心跳对账也在事务内重新检查。新增确定性事务回归测试，最终61/61通过；随后20轮、每轮150次取消请求的真实进程压力测试全部观察到 cancelled。记录在cancellation-stress.json。

## 最终预构建包独立验收

重新打包并解压到独立目录，无node_modules、无安装开发依赖。直接运行预构建代码的61项测试全部通过（portable-test-output.txt）；实际启动打包后的服务，HTML、JavaScript与带令牌bootstrap均成功返回。这里只证明HTTP服务与代码执行，不代表浏览器渲染。最终文档更新前后对apps/packages/dist/tests/scripts/examples逐文件进行SHA-256一致性校验。
