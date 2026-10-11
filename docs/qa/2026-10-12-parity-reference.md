# 对标清单失效引用修正

状态：已验收。代码基线 `8b667ede2fe6f9541cd694beac995a303d559fce`。

Chrome 巡检配套的 `npm run test:parity` 曾出现 3 通过、1 失败：能力矩阵中的两处技能清单引用仍指向已迁移的 `skills/openresearch/manifest.json`。

本批只把这两处证据路径改为实际存在的 `skills/piresearch/manifest.json`。该清单包含 13 项适配技能；没有恢复旧目录、复制清单、删除断言或修改能力状态。主工作区原有的 scopeRevision、名称及说明改动仍保留，未纳入本批提交。

验收条件与结果：

1. 目标清单真实存在且为当前适配技能元数据：通过。
2. 固定上游版本、能力 ID、对齐及五维证据状态保持不变：通过。
3. 原有完整 parity 套件通过、测试断言不变：4/4 通过，0 失败、0 跳过。

候选从上述基线归档产生，仅应用两处路径修正；独立 Sol/medium 复核确认源码、dist 和测试未变。该文档修改不影响已完成的产品全量回归及干净构建，复用前批证据，没有重复执行产品测试或新真实科研任务。

候选矩阵 SHA256：`b4d6d02117b5c9a1a60cc764e3b619168eb57be37ad9deac7c8ea05bed4f34e1`。

原始通过日志保存在本机 `.validation/parity-path-20261012/parity.log`，原失败日志保存在 `.validation/chrome-audit-20261012/parity.log`。完整初轮巡检与边界见 [Chrome 巡检记录](2026-10-12-chrome-audit.md)。

模型/档位：请求 Sol/medium；工具接受但运行时未回显。独立复核无阻断。本批只验证引用完整性，不证明实时 OpenResearch 交互或视觉已对齐；旧 `tests/e2e/workbench.py` 的界面入口仍需后续更新。
