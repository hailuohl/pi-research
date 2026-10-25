# 2026 AI与开源参赛实验与技术报告

本目录保存本批E1—E4实验的精简证据和技术报告初稿。机器学习任务名与原文是自有工程夹具，不是新完成的真实模型训练或科研结论。

## 阅读顺序

1. `TECHNICAL-REPORT.zh-CN.md`：可编辑初稿；同名PDF为渲染后的阅读版本。
2. `evidence/RESULTS.json`：实际结果、环境、验证状态及证据索引。
3. `evidence/E1-graph.json`、`E2-E4-service.json`、`E3-benchmark.json`：逐案输入、观察及全部计时批次。
4. `evidence/source-manifest.json`：被测工作副本的逐文件摘要；HEAD不能替代该快照。
5. `RESULT.md`：交付、独立复核、未覆盖项及Git同步说明。

## 复现

使用项目固定Node版本24.19.0与锁文件依赖。先创建一个尚不存在的快照目录；脚本按白名单复制当前源码、排除私密运行内容并记录SHA-256。它使用现有node_modules的目录联接，不安装依赖。

```powershell
node scripts/prepare-contest-snapshot.mjs .validation/contest-replay/runtime
Push-Location .validation/contest-replay/runtime
node scripts/build.mjs
Pop-Location
node scripts/contest-e1-e4/selftest.mjs
node scripts/contest-e1-e4/run.mjs --root .validation/contest-replay/runtime --out .validation/contest-replay/graph --phase graph
node scripts/contest-e1-e4/run.mjs --root .validation/contest-replay/runtime --out .validation/contest-replay/service --phase service
node scripts/contest-e1-e4/run.mjs --root .validation/contest-replay/runtime --out .validation/contest-replay/benchmark --phase benchmark
```

所有输出目录必须是新目录。正式计时应在本任务构建、回归或其它重负载工作结束后单独运行。重现结果前先比对源码清单；若源码不同，属于新版本验证，不能混写为同一次复现。

本批测试的是含既有在途修改的工作副本。副本在本地`.validation/contest-e1-e4-20261025/runtime-v2`；本批Git提交不包含其它执行者的在途改动。因此，远端仅凭基线SHA不能完整重建实测版本，需要对应的完整源码快照。此限制在报告中保留，不能将当前材料标为完整公开复现包。

## 渲染报告

`scripts/render-contest-report.py`使用reportlab与Pillow，从可编辑Markdown及实际E3 JSON生成PDF和两张图。本机使用Codex附带Python，reportlab 4.4.9、Pillow 12.3.0；默认字体为Windows宋体和黑体，也可通过`--font-dir`指定含对应字体的目录。未向项目增加生产依赖。

```powershell
python scripts/render-contest-report.py docs/contest/2026-ai-open-source/TECHNICAL-REPORT.zh-CN.md
```

## 仍需准备

- E5：固定数据和切分协议的真实机器学习科研任务、真实Pi分析、审查与报告回查；不得把本批服务夹具称为该演示。
- E6：若主张检索质量收益，补独立语料消融；本批不主张此收益。
- 团队名称、编号、分工、最终人工审核与参赛授权。
- 完整开源及第三方资源清单、AI辅助开发说明的团队确认、评审材料匿名检查和开放计划。
- 3—5分钟真实演示视频、评审期可访问的成果链接及必要运行说明。总决赛PPT按届时通知准备。

没有提交赛事、公开私密仓库或上传原始科研数据。原始日志、调试失败记录和完整源码副本留在本地忽略目录，本目录只纳入必要且可分享的工程证据。
