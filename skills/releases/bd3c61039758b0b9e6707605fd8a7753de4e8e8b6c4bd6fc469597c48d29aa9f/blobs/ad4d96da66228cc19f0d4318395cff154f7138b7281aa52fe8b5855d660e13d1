# 绘图资源来源与适配

来源仓库：alphaXiv/OpenResearch；固定commit：`3037f727e80e0ab20c61a87c613a50dde009a835`。许可：MIT，Copyright (c) 2026 alphaXiv；完整文本为本目录LICENSE及仓库 `third_party/openresearch/LICENSE`。两份共享资产顶部还内嵌完整MIT，单文件复制也保留许可。

本项目中文改写科学方法，接口按 `packages/research-tools/definitions.ts`、`packages/contracts/operations/{inputs,registry,document-schemas,publication-schemas}.ts` 和 `packages/policy/permissions.ts` 核对。Python/TikZ算法与审查未因权限适配而削弱。源码资源只是读取/复制入口，执行沿已有审批，非自动可执行技能。

| 上游固定路径 | Git blob | 本地路径 |
|---|---|---|
| agent-skills/orx-figures/assets/orx_figstyle.py | `c54d418b91b3a5df561abdf31fc8cd51538abe91` | assets/pi_figstyle.py |
| agent-skills/orx-figures/assets/orx-tikz-preamble.tex | `99e18c1ab9b42cf05f3ea148d40a37eab2a61c87` | assets/pi-tikz-preamble.tex |
| agent-skills/orx-figures/references/comparison.md | `c2a27641cf7c379991fbcc1b8fd1b243ef1241a1` | references/comparison.md |
| agent-skills/orx-figures/references/curves.md | `8cea15c41781365384199a847fad8511ca69e71c` | references/curves.md |
| agent-skills/orx-figures/references/diagram.md | `927247efcbe2e55f021bf9b3b0167e0d158f1f65` | references/diagram.md |
| agent-skills/orx-figures/references/matrix.md | `5c9cadc0fba6344645ddb71de65f7099f869e633` | references/matrix.md |
| agent-skills/orx-figures/references/pareto.md | `edda07cc3fe37e9612fc0fc4c42a8fe76d2410c6` | references/pareto.md |
| agent-skills/orx-figures/references/scaling.md | `7fbd874a7c3d307955af3afc9cc577744f11dec3` | references/scaling.md |
| agent-skills/orx-figures/SKILL.md | `611c11b12c395789d3aa0d2c015cf4ce0594a345` | SKILL.md |

原始文件定位方式：`https://github.com/alphaXiv/OpenResearch/blob/3037f727e80e0ab20c61a87c613a50dde009a835/<上表路径>`。本批下载正文已按Git blob与SHA256核验，精确URL和哈希由主代理维护上游清单；不声称资源具有联网后的运行认证。

## 资源与差异

- `assets/pi_figstyle.py` 来自orx_figstyle.py，保留科学统计、样式、保存格式和自动审查；17个函数AST保持原样。`save`增加本项目输出契约适配：优先PI_OUTPUT_DIR，其次SSH的OUTPUT_DIR，把相对stem写入归档根并拒绝越界；无变量时保留原本机行为。另改模块名说明并增加MIT头。`orx`/`orxblue`等TikZ内部样式名保持。
- `assets/pi-tikz-preamble.tex` 来自同名上游（改pi前缀），保留字体、颜色、定位库、箭头和分组样式；加完整MIT。
- `examples/loss_curve.py`、`scaling.py`、`benchmarks.py`、`ablation.py`、`pareto.py`、`sweep.py`、`confusion.py` 为各参考完整Python模板，改导入为pi_figstyle，加软件示例声明/版权。代码集中在examples，参考只保留方法和读取链接，避免双份漂移。
- 曲线模板原CSV为step但标Tokens seen，缺少真实token计数；本地改为Optimizer steps。不能只把step当token；改比较横轴时需真实计数。
- 消融模板原来把所有臂的最小种子数打印为每臂种子数；本地改为逐臂实际计数，Welch差值区间计算保持不变。
- 分组柱模板在前向软件验证中出现43.0/48.0与轴内图例名称重叠；本地只把图例移到轴外上方并增加高度，不改数据、柱、指标、字号底线或audit。证据见本批forward/logs/benchmarks.json，修复是否通过由独立方仅复验此图。
- `examples/method.tex` 组合原preamble与diagram模板，保留相对定位/贡献强调/反馈箭头；只作软件架构演示，实际方法需替换。
- `examples/software-demo-data.py` 为本项目新增隔离验证夹具生成器：固定随机种子、明确软件演示标记、存在数据拒绝覆盖。它不是实验测量或自动项目运行。
- `examples/README.md` 为当前数据schema、路径、依赖和执行交接；references/*.md中文保留全部适用科学规则与错误/停止方法。
- 上游保存自动编译、CLI输出重定向和file-tag解析替换为实际私有工作区、固定资产及文稿/开发/Run流程；本项目不能把PDF二进制塞入UTF-8 artifact_create。

完整逐章节覆盖、product-gap和实际验证状态由主代理的本批记录及 `.validation/skills-parity-20261007/output-coverage.json` 保存。旧发行/历史未修改。
