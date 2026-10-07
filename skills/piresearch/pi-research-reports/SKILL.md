---
name: pi-research-reports
description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports."
---

# 研究分析报告与成果交付

用户要求研究报告时，默认交付可打开、包含比较与解释的完整 Markdown 正文及实际来源。只返回日志、指标表、报告 ID 或聊天中的“已保存”不足以完成任务。先按报告用途和现有证据决定结构与篇幅，不机械规定章节、字数或图数量。

区分三个对象：**原始日志**记录程序输出；**Agent 分析报告**是根据实际证据撰写并保存的正文；**系统固定报告**是用户选择来源后生成的确定性历史记录，不会重新调用模型写分析。Agent 正文不会自动合并进固定报告列表或成果导出包；保存正文不表示固定报告已创建。

## 默认流程：从问题到正文

1. 根据用户问题明确报告用途、比较对象和判断标准；已有信息足够就继续，不为固定格式追加提问。
2. 用当前可用的 project_inspect 或 task_result_read 找到获准真实输入，按 pi-research-evidence 使用实际工具读取 run_inspect、run_logs、artifact_read、evidence_read 和运行时固定源码。自动分析缺 artifact_read/源码读取工具时使用获准日志与证据并标未覆盖范围，交由交互主协调者补核；任务总结、Run 状态和最新工作区不能替代原始证据。
3. 比较实际结果，核对数据/切分版本、固定合同、评价协议、单位和指标方向。差值或相对变化注明计算依据；跨合同结果写清不可比条件，不直接当同条件排名。没有对照、关键数据或验证时，继续写现有证据支持的内容，准确列出缺口，不补造数值或结论。
4. 撰写研究问题、方法、实际结果、分析、局限和来源，按任务调整组织。保留实际 Run ID、源码摘要、指标单位及原始产物/证据 ID；区分本项目实测、论文报告值、图片观察和模型解释。解释应连接结果与问题，说明支持程度、替代解释和下一步，而非复述日志。运行成功不等于假设成立。
5. 由具备保存和回读工具的执行者保存实际正文并核对内容与摘要，再交付正文入口、主要结论与限制。只读 Task 先用既有 `task_result_submit` 交回意见、分析与来源，由获准主协调者/writer 保存和回读；没有保存工具时交回正文及缺口，不声称已保存，有保存但缺回读工具时区分已保存与尚未回读。分别说明 Agent 正文的保存状态和系统固定报告的创建/导出状态；没有执行的操作明确未执行。

失败、没测、没编译、停止理由及矛盾结果应进入适用的正文限制。科学数值来自实际读取的来源，不从模型记忆填；图注明实际数据、脚本、版本及来源。Sandbox 图形执行证明固定作业来源，不证明逐点科学数值，更不能冒充正式 Run。

## 先看已有组织再写

当前工具包含 workspace_list/read 时查看自己的相关源文件，用可用的 project_inspect/task_result_read 查看获准产物索引；自动分析不假设拥有工作区或 artifact_read。报告按研究主题/交付物分组，优先复用已有相关目录；描述性名称，不在根不断积累report1/report2，不为空目录提前搭架子。绘图前读pi-research-figures，论文读pi-research-paper，运行结论读pi-research-evidence。

私有草稿目录可以保留上游的组织示例（仅当这些实际输出存在）：

```text
transformer-sweep/
  transformer-sweep-report.md
  figures/
    pi_figstyle.py
    patch-size.py
    patch-size.pdf
    patch-size.svg
    learning-rate.py
    learning-rate.pdf
    learning-rate.svg
  data/
    sweep-results.csv
```

脚本、实际数据和图保留一起便于复验；图形技能的assets/pi_figstyle.py是随技能静态资源，不自动执行/安装。日志/临时scratch不混入最终产物；当前Run日志由原处持久化，只引用无需重复复制。已有发布/交付输出保留原路径，只有用户请求才重排旧文件，同时更新引用并检查能解析。

## 保存分析正文与草稿

主协调者/writer 可用 workspace_write 在**自己的**获准工作区写 Markdown/CSV/脚本；新文件 expectedDigest:null，修改填旧 digest。analyst 没有工作区写入/绘图执行工具，但可用获准的 artifact_create 保存实际 UTF-8 分析正文；reviewer 没有保存工具，通过 task_result_submit 的 summary、evidenceIds、unresolvedQuestions 与 verdict 等现有字段交回意见，由获准主协调者/writer 保存并回读，不新增交接字段。任务实际权限和会话动作策略仍须满足；只读模式不因技能要求变成可写。登记分析报告不会采纳 Claim，不会自动生成固定 report 或发布 PDF。

自动结果分析的工具集合更窄：可用本次获准 run_inspect/run_logs/evidence_read 等完成分析，有 artifact_create 时可保存文本产物；没有 workspace_*、artifact_read 或执行工具时不要求创建目录、绘图或自行回读。交回返回的真实 id/digest 和正文，明确“已保存，尚未回读”，由后续获准交互主协调者回读核对；无保存工具则仅交回正文与限制。

```json
{"tool":"artifact_create","input":{"title":"curve-fit-comparison-draft.md","content":"<根据实际读取结果写成的完整正文，含证据ID和限制>","mediaType":"text/markdown"}}
```

示例的 tool 标明 artifact_create，Pi 调用参数为 `{input: ...}`；占位内容必须替换为实际写好的完整正文。具备回读工具的执行者用返回的 id 作为 artifact_read 的 artifactId，分页至完整正文核对 digest 和内容；工作区文件用 workspace_read 核对实际路径与 digest。没有回读工具时沿上面的交接处理。回读确认保存成功，不代替科学证据核验。writer 先读授权输入，不从他人措辞猜测 Claim 已 accepted；没有 claim_read 工具时按任务固定交付范围与用户选择，尚未核验标候选。

## 固定报告、引用回查与本地导出

用户需要固定报告、回查其引用、重开核对来源或导出本地成果包时，先读取 [references/fixed-report.md](references/fixed-report.md)：

```json
{"tool":"research_skill_read","input":{"skillId":"pi-research-reports","resource":"references/fixed-report.md"}}
```

示例的 tool 标明工具名，Pi 调用参数为 `{input: ...}`。report_* 均为 **user-only**；Agent 交付完整分析正文和具体来源，不调用用户固定报告/导出，也不能用 host_execute 替代。固定报告用于冻结历史来源、引用回读和本地导出；其操作参数与有效性状态只在参考文件中维护。

固定文稿来源按 pi-research-paper 核查；主协调者 manuscript_create/publication_prepare 可准备，提交构建仍用户批准入口。ancestry 关系仅说明祖先来源，不表示当前源码通过了祖先测试。

## 链接、重开与产品差异

工作区报告可用真实相对链接，如 `![Patch size](figures/patch-size.svg)`，前提文件已生成且可随交付解析；不可变artifact之间没有自动目录相对解析保证，应引用真实artifact/evidence ID。固定报告使用服务生成的reference链接，不自造其URL。聊天交付给返回的真实嵌套路径/下载入口或ID及用途，本项目不保证上游 `<file path="…"/>` 富引用渲染。

分析正文修改形成新产物版本；旧正文、旧固定报告及其原绑定保留，不用最新来源替换历史。重开后使用结论或新导出前按参考文件核对来源效力。只有已批准且成功的真实绘图/文稿构建才说图/PDF已生成；只保存 .tex/.py 仍是源码草稿。

已实现：实际分析正文/文本产物、用户固定 Markdown 报告、引用回读、本地 tar.gz 导出及有效性检查。Pi 没有上游“往任意 artifacts 目录写文件立即成为项目成果”的隐式行为；Agent 正文接入固定报告与成果导出、外部成果发布和 Overleaf 等外部目标尚未实现，不用技能文字或默认 Shell 绕过这些缺口。

## 记录视觉验收范围

引用文稿时分别写明固定 publicationResultId、成功完整构建、实际看过的 pageNumber，以及未看/失败原因。交互主协调者可沿 pi-research-paper 的准确页批准和图片读取做布局观察；不能以结果目录有 PNG 或编译成功就填“已视觉检查”。科学数字仍回读原始 Run/数据/证据，单页布局意见不等于全文或科学结论验收。

默认模型具备图片识别能力，获准真实图片到达后直接视觉阅读；工具实际拒绝、图片超限、来源/授权失效时明确未看或未验证，不绕过校验。原固定成果和历史保留，新修订另行编译与核对。报告与本地导出仍由已有用户流程选择固定结果，不因图片批准而自动发布。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-reports/SKILL.md`（blob `313d3ca61372e5f2e101cac6e78828393d03ad87`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
