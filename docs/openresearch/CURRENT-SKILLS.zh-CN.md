# 当前功能、技能适配与 OpenResearch 差异

2026-10-07。技能适配批次只覆盖已完成能力；后续用户明确要求的个人模板库、可选GitHub源码同步及NVIDIA执行已另批接入。保留13项技能和本地（含受信示例）、Docker、SSH；云算力、实例与完整远程工作台仍移除，Overleaf和报告/论文成果远端发布尚未接入。

对照固定上游 `alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835`，不是移动的main。23份原始文件已按Git blob和SHA-256核验。完整方法与示例按当前工具改写；接口不同、用户主动排除和未完成产品功能分别记录，不能把技能文字当作新增运行能力。

## 已完成的功能及逐项差异

| 技能 | 本项目已有功能与本次适配 | 与固定上游的差异 |
|---|---|---|
| 研究工作流 overview | 项目/会话/研究计划、当前目录、工具参数和实体ID；保留固定合同、已回答节点保护、代码变体和按轮次向下推进 | ORX命令表换为Pi工具及用户入口；无ORX登录、组织和托管服务 |
| 研究启动 create | 本地项目创建/源码导入、已确认研究计划、基线/子实验提案、固定源码和完整config | 后续候选显式parentId与expectedParentRevision，config整体替换；不自动选旧根或自动clone，创建提案不等于实现/运行 |
| 实验与运行 experiment-tree | Campaign轮次/候选、真实观测、Repair/Refill/Promote/Stop、冻结历史、运行通知与状态回查 | 每个决定、整合与正式Run沿现有批准；主协调用project_inspect/campaign_inspect/run_inspect对账，用户run_list另有入口；不照抄ORX阻塞等待命令 |
| 代码与版本 git | 受管私有Git工作树、源码差异/提交、开发测试、独立审查与整合；创建项目可选GitHub私密源码同步、设置CLI状态与恢复；交互Agent可查询准确SHA的各ref保存回执 | 默认本地；用户选择后宿主同步，不授予Agent任意checkout/rebase/push；本地完成与保存时远端确认分开，回执读取不联网，无记录不等于失败 |
| 协作方法 agent-delegation | 协作开关、有界任务图、角色、独立工作区/尝试、成果验收、Reviewer和恢复 | 委派提案先批准；依赖成果验收而非助手结束；联网和计算各有独立授权，不把原版spawn命令直接当本地API |
| 计算环境 compute | 固定RunIntent、可配置本地CPU/NVIDIA、Docker/受控SSH、日志/产物、取消、恢复及UUID共享预留；交互主协调者可读单Run当前排队/预留/恢复原因，local/Docker/SSH分别按需读取 | 仅保留三类执行位置；状态来自保存的调度观察，不实时探测或开放全局队列；本地无文件/网络隔离，CPU/RAM为预算；Docker/SSH使用固定容器；NVIDIA须已有驱动和环境，AMD/Metal未接入；外部目标另验 |
| 证据与引用 evidence | 分页日志、不可变Artifact/Evidence、UTF-16原文定位、来源历史；主协调者可经单独范围批准逐页读取固定原文PNG | 日志字节/原文位置/图片观察分开；视觉不伪造文本Evidence，也不扩大检索授权，当前来源和目的模型在每次历史重发时复验 |
| 报告与成果 reports | Agent保存真实文本草稿；用户固定报告、引用回查和本地成果包；构建结果/原始证据绑定 | 不是写任意目录就成为正式成果；report_create返回正文Artifact，真正reportId从报告目录获取；不自动远端发布 |
| 图表与可视化 figures | 获准脚本/产物归档、样式与六类方法/代码模板；主协调者可经准确页面批准把固定编译页PNG交给支持图片的模型做布局观察 | 图种和统计方法按需读取，实际输出根固定；图片需独立目的模型批准和持续来源/权限检查，布局观察不能冒充独立科学审查或研究测量 |
| 论文写作 paper | 三类基础模板、个人模板库、真实TeX/Bib/资产、固定编译与诊断/独立审查/导出；新增同会话固定页的真实Pi图片输入及历史外发重验 | 保存不自动编译；固定engine/bibliography；页图单页4MiB/1600px、会话合计16MiB，撤权保留历史并停止新外发；原文PDF/PMC视觉仍独立，无Overleaf同步 |
| 技能定制 customize | 技能上传自动开启、启停/删除自定义修订、固定包与历史恢复；内置项始终提供；设置上传/查看个人模板，交互Agent可生成并入库 | 技能仍按项目与固定包加载；个人模板跨项目，每次上传固定独立ID，同名不覆盖旧模板及旧稿；加载/保存不等于代码执行 |
| 评价与反馈 feedback | 识别重要产品问题、复现步骤、实际/预期差异、限制与脱敏；可保存本地反馈草稿 | 没有原版向OpenResearch团队提交反馈的外发接口，不静默发消息、不声称已提交issue |
| 文献研究 lit-review | 五源发现/读取、有界跟进、PDF/PMC与固定语料证据；用户可从成功固定解析结果带入会话，独立批准目的模型/页范围后逐页复用图片授权 | 文本/图片权限独立；元数据附件不含原文或像素。Task仍限已完成发现范围且不授视觉；无通用Web、自动裁图/OCR或alphaXiv report/full切换 |

## 本轮计划执行结果

| 批次 | 已走通的流程 | 配套技能 | 验收记录 |
|---|---|---|---|
| 运行调度观察 | 交互主协调者查询单个 Run 当前保存的排队、预留和恢复原因 | overview、compute；本地/Docker/SSH 按需参考 | [结果](../acceptance/flow-agent-run-scheduling/RESULT.md) |
| GitHub 同步回执 | 本地受管提交后按准确 SHA 查询各 ref 的保存回执 | git、overview | [结果](../acceptance/flow-agent-github-receipt/RESULT.md) |
| 文稿页面视觉输入 | 准确批准固定成功文稿页与目的模型，真实 Pi 图片输入，历史重发复验 | paper、figures、reports、overview | [结果](../acceptance/flow-agent-publication-image/RESULT.md) |
| 固定原文页面视觉输入 | 成功固定解析结果带入当前会话元数据，单独批准页范围，范围内逐页复用 | lit-review、evidence、paper、overview | [结果](../acceptance/flow-agent-document-image/RESULT.md) |

最后代码提交 `aed870e768ccd5c05f2adf256241a559bbce8e34` 的[三平台 CI](https://github.com/hailuohl/pi-research/actions/runs/37642576366) 在 Windows/macOS/Linux 全部通过。本地最终集中回归 1236 项：1213 通过、0 失败、23 跳过；干净安装、构建和类型检查通过，独立权限复核无阻断。两次平台夹具修复仅改变测试目录或进程收尾，产品保护与断言保留。三平台 CI 覆盖本批关键流程，不代表每个平台已实测外部 SSH、GPU 硬件或外部模型视觉理解。

新增视觉链路使用合成固定页及 localhost 脚本化供应商验证；未执行新的实际 PDF 解析或外部模型视觉推理。旧 parity 基线仍引用已迁移的技能目录，文档路径缺口按首批验收记录保留。

## 实测与边界

- 既有项目导入、受管Git、开发测试、正式CPU Docker、研究活动、文稿/图表、文献原件及备份恢复记录见[后端入口](../BACKEND-READINESS.zh-CN.md)。已有记录只证明其具体环境和范围，不代表每个输入或供应商均通过。
- 本批验证技能读取/资源摘要、真实接口示例、历史绑定，并在已有宿主Python环境实际执行图形模板。两个输出变量均做实际绘图检查；Docker只执行明确的向量文件复制/归档/重开检查，不声称其镜像运行了Matplotlib。TikZ与论文模板经既有固定Docker编译。具体通过、失败修复与环境限制见[本批结果](../acceptance/flow-skill-adaptation/RESULT.md)。
- 自动root唤醒的真实Pi路径、外部SSH目标、其他GPU厂商、部分原PDF来源和复杂表图/OCR仍各有既有边界；本次不把文本更新算作补齐这些能力。
- 此前13项技能适配批次的章节/规则与当时文件摘要见[覆盖清单](../acceptance/flow-skill-adaptation/coverage.json)，源身份见[上游来源清单](../../third_party/openresearch/source-manifest.json)。后续新增能力以本表和对应功能验收为准；旧发行和原会话固定绑定保留，不自动切换版本。

NVIDIA新增执行链的实际设备、Windows兼容修复、WSL2选择限制和SSH回环范围见[执行验收](../acceptance/flow-nvidia-execution/RESULT.md)。设备查询、计算正确性和任意模型训练适配分别核对，不能互相替代。

## 配套资源及必要纠错

图形资源保留上游方法、统计、打印尺寸、矢量导出、字体与碰撞审查，并附MIT许可。代码集中在可复制资源，参考说明数据schema、选择依据、陷阱和验收。

有证据的原版错误会修正并列为差异：step横轴不冒称token；natbib外部bibliography使用BibTeX而非Biber；消融样本数按每个变体实际计数；示例图例不得遮挡数据。这里不以逐字相同代替可用，也不以脚本退出成功代替图形或科学审查。
