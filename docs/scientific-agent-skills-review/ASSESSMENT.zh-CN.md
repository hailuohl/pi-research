# Scientific Agent Skills 对研舟π的适配评估

有适合适配的内容。最有价值的是补强研究设计、统计推断、数据检查和测量不确定性的方法；建议把它们接到现有技能、证据和运行流程上。177项全部启用会引入大量无当前任务需求的依赖、外部服务和重复流程。

本次为选型与静态内容评估，不安装技能，不修改产品能力。优先级表示适配价值，不表示已经开发、已经通过科学验证或已经加入项目排期。

## 来源与阅读范围

- 上游：[K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills/tree/a1043ef544e3a100c28e70a736b6cf32554d0677)，原名 Claude Scientific Skills。
- 核对日期：2026-10-17；固定提交 `a1043ef544e3a100c28e70a736b6cf32554d0677`，提交时间 2026-10-12；`plugin.json` 版本为 2.72.0。
- 实际目录为177份 `skills/*/SKILL.md`，合计2,470,016字节。搜索缓存曾显示165项，以固定Git树及文件字节为准。
- 已逐项读完177份技能描述及完整主文档；完整选读11份配套脚本或参考文件，另1份仅下载未读；全部路径和状态见来源清单。整个 `skills/` 树另有配套内容，合计2,025文件、21,303,142字节，不能把主文档全读称作这2,025个文件全部逐行审计。
- 上游内容仅作为审阅材料。没有运行其安装命令、模型推理、科研分析、扫描器或外部服务。
- 项目对照基线为 `3dd24628e0e32674f64dd63f78972823bed06d3e`。以当前技能、实际加载代码、固定SDK和[当前能力说明](../openresearch/CURRENT-SKILLS.zh-CN.md)为准，避免把较早文档中的待办重新当作缺失能力。

逐项结果见[177项清单](CATALOG.zh-CN.md)与[详细评估](catalog.json)；固定路径、Git blob、SHA-256和阅读覆盖见[来源清单](source-manifest.json)。每项均有固定版本原文链接，可继续查看完整内容。

最终分类：优先补强8项，按任务启用103项，暂缓或不引入66项。

## 最值得优先吸收的方法

| 上游技能 | 对项目的具体增量 | 建议接入位置 | 适配方式 |
|---|---|---|---|
| [experimental-design](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/experimental-design/SKILL.md) | 区分实验单位与技术重复；随机化、分层/区组、批次混杂、设计与分析模型一致 | `pi-research-create`、`pi-research-experiment-tree` | 增加设计方法参考，沿已有固定研究计划与Campaign保存；不新建实验树 |
| [statistical-power](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/statistical-power/SKILL.md) | 事前样本量、最小可检测效应、科学上有意义的效应及敏感性分析 | create、experiment-tree | 给已有重复依据补充方法；需要计算时通过获准Run执行，不拿事后功效为阴性结果背书 |
| [exploratory-data-analysis](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/exploratory-data-analysis/SKILL.md) | 输入结构、缺失、分组、实体/时间切分重叠、采样检查范围 | create、evidence、compute | 先做CSV/TSV的有界检查。检测到重叠是风险线索，未检出也不证明没有泄漏；不宣称自动支持文档列举的所有格式 |
| [statistical-analysis](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/statistical-analysis/SKILL.md) | 从估计目标、独立性和研究设计选择分析；效应量、区间、诊断与多重比较 | evidence、reports、paper | 补充分析方法参考；现有科学审查已有p值、校正族、单位与比较方向规则，应合并而非再建一套清单 |
| [uncertainty-and-units](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/uncertainty-and-units/SKILL.md) | 测量模型、相关输入、误差传播、覆盖因子和有效数字，超过目前“核对单位”的深度 | evidence、figures、paper | 作为测量型研究按需参考；统计置信区间、测量不确定度和预测不确定性不能混称 |
| [hypothesis-generation](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/hypothesis-generation/SKILL.md)、[scientific-critical-thinking](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/scientific-critical-thinking/SKILL.md) | 竞争假设、反证条件、可区分实验、混杂和替代解释 | create、experiment-tree、evidence及reviewer方法 | 保留候选假设与证据缺口，避免将模型构想升级为已证实Claim；不引入新的代理投票或评分权威 |
| [literature-review](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/literature-review/SKILL.md) | 预先纳排标准、可复现检索记录、同一研究多篇报告关联、偏倚评价 | lit-review | 仅在系统性/范围综述任务触发；普通科学解释继续按现有检索规模处理，不强制所有问题进入系统综述 |

## 有用但应复用现有能力的内容

`scientific-writing`、`peer-review`、`citation-management`、`scientific-visualization`和`venue-templates`可以补充写作、报告规范、引用元数据和投稿样式，但项目已经具备固定证据、科学审查、模板库、图表来源、隔离编译、页图观察及历史保留。这些不是待从零接入的新能力。

尤其不要直接安装上游写作审计脚本后称为“自动科学核验”。[audit_claims.py](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/scientific-writing/scripts/audit_claims.py)解析Markdown物理行上的特定标记；[check_consistency.py](https://github.com/K-Dense-AI/scientific-agent-skills/blob/a1043ef544e3a100c28e70a736b6cf32554d0677/skills/scientific-writing/scripts/check_consistency.py)检查另行填写的JSON登记表，不读取实际TeX、原始实验数据或论文全文。其五份登记表与E/C/N/M/R/O编号也不同于本项目实体。适配时沿用现有Evidence、Claim、Artifact和文稿修订，正文继续使用面向读者的科学表述；脚本通过不能替代原始依据核对。

`pi-agent`适合开发者维护参考。它声明参考Pi 0.99.2，项目锁定 `@earendil-works/pi-coding-agent` 0.87.1；同一包名不代表API和生命周期一致。不能按其示例执行全局升级、启用原生自动技能发现或另装 `pi-subagents` 替代现有任务、权限与历史机制。

## 按真实研究任务启用的工具库

以下是候选工具，不是建议本轮统一安装的依赖集合：

- 常规建模与解释：`scikit-learn`、`statsmodels`、`pymc`、`shap`，分别适用于预测基线、统计模型、贝叶斯建模和模型解释；解释结果不自动构成因果结论。
- 数值、优化与仿真：`sympy`、`pymoo`、`networkx`、`simpy`；图论网络、科研证据关系和项目实验树是不同对象。
- 数据规模与绘图：`polars`、`dask`、`zarr-python`、`matplotlib`、`seaborn`；现有资源足以处理任务时不增加第二套实现。
- 明确领域后再选：材料任务可看 `pymatgen`、`pycalphad`，电池任务可看 `pybamm`，生物序列/单细胞可看 `biopython`、`scanpy`，化学任务可看 `rdkit`。能启动GPU或容器不证明领域流程与数据已经验证。

各包的Python版本、原生库、模型权重和硬件约束不同。使用独立的固定任务环境，不把依赖装入产品Node运行时或一个全局科学Python环境；任务产物仍归档到现有Run与证据路径。

## 当前不建议默认引入的部分

| 类别 | 例子 | 原因 |
|---|---|---|
| 替代平台或第二套工作流状态 | `open-notebook`、`lamindb`，以及完整照搬 `arbor` | 与当前资料、实验树、任务、证据和历史职责重合；可提取方法，但不为技能建立第二个控制平台 |
| 云计算、云实验室和外部业务操作 | `modal`、`dnanexus-integration`、`latchbio-integration`、`adaptyv`、`ginkgo-cloud-lab` | 属于新服务、账户、费用、数据外发或真实实验执行，不在当前本地/Docker/SSH后端维护范围 |
| 无指定领域的数据与临床流程 | 大多数组学数据库、临床报告和治疗计划技能 | 没有对应数据和任务时收益有限，部分还要求专门资格、授权与领域验证 |
| 以历史采集训练技能 | `autoskill` | 依赖Screenpipe历史、OCR及活动数据处理，不符合当前按项目固定技能版本和不增加OCR的安排 |
| 外部生成图片或补充搜索服务 | `generate-image`、`scientific-schematics`、`exa-search`、`parallel-web`、`research-lookup`、GXL `paperclip` | 仅有具体需求且明确服务/内容授权后再接入；Paperclip是生物医学/监管资料检索服务，不是同名代理编排平台；科学数据图继续由真实数据和可回查代码产生 |
| 许可或定位不适合作默认依赖 | `what-if-oracle` | 技能声明CC BY-NC-SA 4.0及商业许可要求；质性情景叙事不能当作校准概率或因果预测 |

这些条目“暂缓”不代表无用。逐项清单保留适用情形，等真实任务命中再决定。

## 适配必须保持的边界

1. **读取方法与执行能力分开。** 本项目通过 `research_skill_read` 加载已固定内容；Python脚本、安装命令、联网和付费调用需要原有执行与来源授权，技能文字不授予权限。当前Pi适配明确关闭原生内置工具和资源自动发现。
2. **保留原来的研究记录。** 现有实验、Run、证据、文稿和旧技能包继续按固定版本回查。方法扩充不自动升级历史会话、不新增平行注册表、不重写旧科研结论。
3. **按包和实际任务选择依赖。** 技能声明的测试版本只是上游声明，不是本机兼容性结果。选中脚本后再审其实际依赖与输入边界，在固定环境验证所选成功、错误和恢复路径。
4. **容量不适合整仓导入。** 当前 `packages/skills/service.ts` 限制单包1–64文件、单文件128 KiB、展开总量2 MiB；一次配置的自定义revisionIds最多64，每项目历史修订最多128。整个上游技能树远超限制，`bids`和`onekgpd`还各有超过128 KiB的配套JSON。应拆出实际需要的方法和资源，不为全库导入放宽边界。
5. **逐项保留来源和许可。** 根 `LICENSE.md` 为MIT，但技能frontmatter、第三方代码、模型、数据库及数据另有声明。`what-if-oracle`明确为非商业共享许可，不能由根MIT覆盖推断。适配时保留适用归属和修改说明；宣传、无关服务导流及要求所有输出统一附加某论文的指令不自动变为产品行为。

## 建议的第一条适配流程

下一批建议只做“给定一份CSV/TSV和研究问题，形成可执行的实验方案”。主要吸收 `exploratory-data-analysis`、`experimental-design` 和 `statistical-power`，先复用已有技能参考和批准执行路径，不新增前端页面。

该批可以沿用以下四条验收条件：

1. 对固定输入说明字段、缺失、分组/实体、数据切分和检查覆盖；实际数值来自获准执行结果，不凭文字推测。
2. 方案说明实验单位、对照、目标效应、评价指标、拆分/随机化方法与重复依据；缺少功效假设时保留缺项，不编造样本量。
3. 对分组泄漏、缺失关键字段、超出支持格式或依赖不可用给出可定位的失败/限制，不能自动换数据、扩大访问或声称完成。
4. 将输入版本、检查结果和方案放入现有Artifact/研究计划，关闭重开仍可回查；原计划、失败结果及旧技能版本保留。

本次只提出这一候选流程，没有启动实施。其余方法和领域包按需求进入后续选择。

## 验证范围

本次核对固定Git树、177份主文档的源文件字节与Git blob、逐项覆盖及项目接口映射；推荐涉及的部分脚本做静态读取。产品代码、依赖和运行环境均未改变，因此不重复运行产品全量回归、Docker或真实模型实验。上游脚本科学正确性、实际依赖兼容性和外部服务可用性仍须在选中任务的适配批次验证。

审阅分工请求为三个独立Sol high子任务，运行时接口未回显模型与档位，因此只记录“已请求，运行时未回显”，不宣称已核验。独立复核与机器一致性检查状态另记于 `VERIFICATION.json`。
