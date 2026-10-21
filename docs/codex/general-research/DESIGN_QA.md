# 设计交付校验记录

日期：2026-10-21。范围：本方案文档的一致性、可实施性及接续规则；产品实现尚未开始。

## 结论

主代理逐项自查，并由独立会话 `/root/design_package_review` 作关键设计复核。按仓库AGENTS请求模型/档位为 `gpt-6-astra/xhigh`；工具未提供可独立核实的实际运行配置，因此仅记录已请求、运行时未回显。

初审的四组阻断已局部修正，并由同一独立会话定向复查；复查范围内无残留阻断。这不是源码安全审计、产品测试通过或发布认证。

| 发现 | 已完成的设计修正 |
|---|---|
| 矩阵固定成果缺少完整契约 | 明确matrix snapshot、freeze、准确历史读取、两类snapshotRef导出及备份引用链 |
| 部分行列导出没有准确输入 | 先在freeze固定选定行列，export只读取已固定子集，浏览器案例同步 |
| 原最终submit与逐格恢复承诺不兼容 | 每Task单行、同来源范围、最多5格chunk；一次最终submit，同事务候选/TaskResult；已提交片保留，未提交项可重算；partial显式retry |
| done与远端交付定义不一致 | 功能状态与remoteStatus独立；远端未同步时整体delivery=incomplete |

同时澄清了逐格CAS输入、目录adapter交付归属、多智能体关闭后的手工业务路径，以及方案文档完成与产品实现的区分。

## 文档检查

- JSON能解析，STATE有13个任务，产品任务全部not_started，验证未预填pass。
- 55个唯一验收ID在计划、STATE和VALIDATION逐一对应；任务依赖节点完整且无环。
- B01–B10真实浏览器流程齐备；相对链接及代码围栏可解析。
- 引用的当前仓库路径、核心源码及npm脚本已核对；BASELINE保留原观察及交付前20个文件的新摘要。
- 当前工作树有大量旧改动，方案保存只增加本批文档，不代表HEAD已包含所有既有实现。

这些检查只证明文档结构与已审契约一致。浏览器、Pi、运行器、备份恢复和新增功能的真实验收须在后续实施时进行。

## 复查后的文档元数据

独立复查后仅将STATE.planStatus更新为documentation_reviewed_ready，增加本记录引用及更新时间；BASELINE追加一次只读源码观测。产品任务状态未因此改变。主代理另将F01的排序和显示名称约定收敛到现有目录契约：首版最近更新排序、原对象标题，访问排序和目录别名后置；未增加权限、存储或任务范围。以下摘要是最终交付的8份主文件；本记录不包含自身摘要，避免自引用。

| 相对文件 | SHA-256 |
|---|---|
| docs/codex/general-research/BASELINE.json | b385c1e345f93d658f152a29e35a50cdc1691cdf56ef55d967d73b5b79d0ef53 |
| docs/codex/general-research/DECISIONS.md | 33b99ac604d9a557d958ed707615b1639f6015be8d296d19fa743c2caca1ddae |
| docs/codex/general-research/HANDOFF.md | 0a94ff638924a3df2e25aa72fdac15816b2a4bef755d0652eafe29233143dea3 |
| docs/codex/general-research/START_HERE.md | bea8f137054d3a2026e329bf68d94ebc3b0849078d7c58cc27e799d1fdbf9d7c |
| docs/codex/general-research/STATE.json | a6b71058d3fe0e98a31f1b4f114943964eb880e0ce5cb5693585d4d9424a0493 |
| docs/codex/general-research/VALIDATION.md | 980747a4b8bf64e2c5c988791ec5fa65199167c83184bce1904dcdbfdc2e3a9a |
| docs/superpowers/plans/2026-10-21-general-research-plan.md | 12d7fab7d8b9556db4bc27f5760872bbe582c61a753267d38a599396d4ea03a4 |
| docs/superpowers/specs/2026-10-21-general-research-design.md | aaca53f6c97ab031192f440a14dfeaaca362eb9b30d4a50a2ec465d1dc3d6de3 |
