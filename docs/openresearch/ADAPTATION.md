# OpenResearch 技能与连接器适配

2026-10-07当前范围：执行后端仅保留本地受信示例、Docker、SSH，计算技能只附带 `references/local.md` 和 `references/ssh.md`，加上6份图表参考共8份。远程实例技能已从当前默认目录移除，现为13个技能；历史发行仍保留原文。当前可用命令为 `node dist/apps/cli/index.js skills pi-research-compute --resource references/ssh.md`。当前状态见[后端清单](../BACKEND-READINESS.zh-CN.md)；以下保留初次移植时的范围与验收说明，不作为当前能力目录或待办。

## 交付范围

本次不是安装 OpenResearch 二进制或把 ORX 命令简单改名。参照 `alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835`，将十三个内置技能及总览改写为本项目的受控工具工作流；把学术文献检索相关 Rust HTTP 协议逻辑独立移植为 TypeScript 适配器。运行不调用 ORX CLI、服务、数据库或托管账户。

文献连接器的实现位于上游 `src/client.rs`，不是一个可以原样装入 Node/Pi 的统一 MCP 插件包。其他外部能力分别依赖计算后端、账户或发布实现。因此本版把“可执行连接器”和“仅有兼容说明、尚不支持的能力”分开。

上游原文和选定源码通过 GitHub 工具实际读取，固定提交、路径、blob SHA 及读取范围见 `third_party/openresearch/source-manifest.json`。该文件不是完整上游源码镜像。本项目保留完整 MIT 许可证及修改说明。计算/图表参考文件是根据已读取主技能编写的兼容说明，不冒充上游对应子文件的逐字移植。

## 14 个技能模块

| 本项目技能 | 对应上游 | 适配后的职责及限制 |
|---|---|---|
| pi-research-overview | 根 SKILL.md | 工具、权限、证据与运行入口；不直接运行 orx 或宿主 Shell |
| pi-research-create | orx-create | 读取已有项目，明确基线/父实验，提交实验方案；项目导入由用户完成 |
| pi-research-experiment-tree | orx-experiment-tree | 固定契约、已回答即保护、同轮候选共同父节点、下一轮沿保留结果派生；使用现有 Campaign/Decision |
| pi-research-git | orx-git | 映射到私有工作区、不可变产物、变更提案和获批子实验；不是 Git checkout/merge/push |
| pi-research-agent-delegation | orx-agent-delegation | 自包含任务、必需产物、审查、输入范围、独立会话；默认不递归委派、不扩大计算批准 |
| pi-research-compute | orx-compute | RunIntent→独立批准→Runner→日志/产物；长期等待交给持久化状态，不阻塞模型工具 |
| pi-research-instances | orx-instances | 解释独立实例与实验作业区别；本版没有实例申请与托管账户接口 |
| pi-research-evidence | orx-evidence | 先读原始运行/文件，核对版本和单位；区分引用存在、当前适用和科学解释 |
| pi-research-reports | orx-reports | 生成实际产物、保持描述性名称和证据 ID；报告确定性结论仍需有效采纳 |
| pi-research-figures | orx-figures | 图表方法、单位、不确定性和脚本溯源；未运行绘图不能声称已生成图片 |
| pi-research-paper | orx-paper | 实际 LaTeX 草稿、模板和真实参考文献；无编译器服务不能声称 PDF 可用 |
| pi-research-customize | orx-customize | 审核后维护受管清单；不自动扫描项目 .pi、AGENTS 或安装未知扩展 |
| pi-research-feedback | orx-feedback | 记录本地、脱敏的产品反馈草稿；不静默外传、不自动向上游提交 |
| pi-research-lit-review | orx-lit-review | 多源选择、日期/优先级、有界跟进、检索去重、再读关键文献；区分元数据/摘要/原文 |

附带九份计算兼容参考和六份图表方法参考，共十五份。SSH/Slurm/Kubernetes/Ray/HF/Modal/Tinker/托管计算参考是不可执行能力说明，不创建作业。图表参考也不自动执行 Python/TeX，未打包字体或未经审查的可执行上游扩展。

## 技能如何进入真实代码路径

`ResearchApp.skills → SkillService.bootstrap(role) → AgentHost → Worker IPC → Pi session options`。

只有总览、该角色的技能目录和 bundleId 进入启动提示；完整模块/参考通过 `research_skill_read` 按需读取。`getSkills()` 也接入受管元数据，但 Pi 内置文件/Shell 工具仍关闭，读取内容以宿主工具为准。

校验发布目录中的规范路径、普通文件、非符号链接和编译清单 SHA-256；未知文件、未知资源、错误角色、被改写技能被拒绝。此机制防止项目内容混入受管目录，不是密码学签名发布，也不能替代 OS 沙箱或保护已被攻击者修改的整个程序包。

维护者修改技能后，要审查差异并显式运行 `node scripts/rebuild-skill-manifest.mjs`、构建和完整测试；普通 build/runtime 不会自动接受新的内容摘要。技能文字不授予 API 权限，不改变批准或费用额度。

## 5 个文献适配器

| 来源 | 检索 | 选中论文读取 | 实际边界 |
|---|---|---|---|
| alphaXiv | keyword / embedding | `/abs/<arxiv-id>.md` 提取文本 | 未提供 PDF 下载、页级映射或原图裁剪；请求版本保留但返回版本不自动保证 |
| OpenAlex | works/search、日期与来源过滤，恢复倒排摘要 | W ID / DOI 的元数据与摘要 | 没有替用户访问出版商全文；可选 OPENALEX_API_KEY |
| bioRxiv | OpenAlex 的 bioRxiv 来源过滤 | 原生 details 接口的最高版本摘要/元数据 | 不是全文阅读；不能把生成报告当原文 |
| PubMed | ESearch→EFetch、日期与 Best Match | PMID 的 XML 摘要/元数据 | 无 PMC 全文下载；限制 XML 文档和实体，不解析外部 DTD |
| Crossref | 原有查询保留；新统一适配器提供日期等 | DOI 元数据 | 无全文、无摘要保证；旧 literature_search 也服从关闭开关 |

不把 votes 与 citations 混成跨来源科学评价。仅在各来源的有限相关候选池内按请求排序；日期精度不足时保守排除不确定边界，不声称完整数据库覆盖。失败来源保留独立错误；所有来源失败抛出 CONNECTOR_ALL_FAILED，不返回“没有论文”。

标准 ID 解析拒绝任意下载 URL、路径穿越、凭据 URL。跨来源 DOI/title 去重保留重复来源标识；arXiv 请求版本不会为“方便”被悄悄抹除。浏览器打开外部结果仍由用户决定，不是后台自动下载。

读取保存原始响应产物、提取文本产物、来源、获取时间、内容种类、请求 ID 与摘要。`fullTextRead` 只表示该次接口取得了提取文本，不证明模型阅读全文、页面精确对应或科学解释正确；摘要/元数据明确为 false。页码不可用时直接标记 unavailable，不从文本猜页码。

## 网络、授权和恢复约束

四个新增远程来源默认关闭；Crossref 保留原有默认开启。用户通过工作台/API/CLI 明确开启，Agent 没有修改来源开关或额度的工具。环境变量存在密钥不等于用户授权开启。

只有交互式 coordinator/literature 获得网络工具；自动综合、Reviewer、实现助手没有隐含网络权限。文献助手只能读取本次任务成功检索返回的 ID。请求开始和返回后都核验项目、会话、任务租约与设置版本；关闭来源、归档、取消或任务失效后不把在途内容登记为新成果。

固定六个 HTTPS 主机，不接受模型自定端点，不跟随 HTTP 重定向，不传递 SSH/云计算凭据；模型 Worker 只得到接口结果。OpenAlex 使用宿主 Authorization header；NCBI 参数在保存来源 URL 时去除密钥和联系字段。返回体反射配置凭据时拒绝入库/回传。

HTTP 并发上限是每个 Transport 实例 3；NCBI 请求起点间隔至少 350ms（本程序选择的保守节流值）。这不是多进程/IP 级集群限流。每次 HTTP 尝试原子计数，项目默认上限 100；失败或未知请求仍占用计数。不是货币/Token 硬上限，无自动续费，无隐式无限重试。

单请求最长约 12 秒，完整操作约 18 秒；返回体最多 2 MiB，流式读取并在错误/超限时取消。单进程同操作去重，已落库操作可重放；跨进程/崩溃边界不保证外部 HTTP 只发送一次，不借失败消息推断服务未计费。

## 同一套服务的入口

HTTP 均继续使用现有回环地址/令牌/Origin 检查。网络 I/O 不放进同步 SQLite 写事务。

```text
GET  /api/skills
GET  /api/skills/:id?resource=...
GET  /api/projects/:id/connectors
POST /api/projects/:id/connectors
GET  /api/projects/:id/connector-history
POST /api/connectors/discover
POST /api/connectors/paper
```

写操作要有 `Idempotency-Key`；设置含 expectedVersion；查询正文含 projectId。Agent 工具：research_skill_list、research_skill_read、connector_status、literature_discover、paper_read。原 literature_search 保留兼容，但也受同一来源设置和请求计数约束。

CLI 示例（`PROJECT_ID` 替换为本机实际 ID）：

```bash
node dist/apps/cli/index.js skills
node dist/apps/cli/index.js skills pi-research-lit-review
node dist/apps/cli/index.js skills pi-research-compute --resource references/slurm.md
node dist/apps/cli/index.js connectors --project PROJECT_ID
node dist/apps/cli/index.js connector-config --project PROJECT_ID --enable openalex,pubmed --request-limit 100
node dist/apps/cli/index.js discover --project PROJECT_ID --query "gas adsorption" --sources openalex,pubmed --limit 5
node dist/apps/cli/index.js paper W123456789 --project PROJECT_ID
```

最后一条中的 W ID 必须换成实际查到的论文；示例不是宣称该编号真实存在。不要将用户任意字符串拼接到 Shell；应用内通过结构化接口执行。

## 两个版本的区别

两版使用字节相同的 connectors/skills 模块、受管技能内容和新增测试。修复派生版不加入本地分块检索/MMR；增强派生版保留原 TextEvidenceService、词项检索、精确重复分组和可选 MMR，其源文件未修改。

新下载的文献产物不会自动加入增强版的本地检索授权集合；用户仍需显式选取。外部文献网络开关与本地原文检索开关彼此独立。没有公平科研 A/B 结果，本轮也不声称增强版比修复版更聪明或更省钱。

## 未提供或尚未验证

未新增 SSH/Slurm/Kubernetes/Ray/HF/Modal/Tinker/托管计算提交器、Git 发布、Overleaf、LaTeX 编译、独立实例申请或通用开发测试沙箱。原有 Docker 路径仍是未实测状态。

真实 Pi SDK/供应商模型调用、技能在真实模型中的遵循率、外部文献服务成功响应与浏览器完整用户旅程没有通过本次验收；详见 VALIDATION.md。不要把 Mock、SDK 参数契约和组件元素树测试说成真实科研闭环。
