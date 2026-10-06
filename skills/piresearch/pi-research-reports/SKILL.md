---
name: pi-research-reports
description: "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs."
---

# 持久报告与成果组织

交付真实文件或已登记产物，不能只在聊天写“已保存”。Pi没有上游“往任意artifacts目录写文件立即成为项目成果”的隐式行为：私有工作区草稿、不可变artifact、固定用户report、文稿构建及本地导出各有明确入口。

## 先看已有组织再写

用workspace_list/read查看自己的相关源文件，project_inspect/task_result_read查看获准产物索引。报告按研究主题/交付物分组，优先复用已有相关目录；描述性名称，不在根不断积累report1/report2，不为空目录提前搭架子。绘图前读pi-research-figures，论文读pi-research-paper，运行结论读pi-research-evidence。

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

## Agent草稿：实际内容与限制

主协调者/writer用workspace_write在**自己的**获准工作区写Markdown/CSV/脚本；新文件expectedDigest:null，修改填旧digest。artifact_create可登记实际UTF-8正文，返回真实artifactId/digest，记录用途。草稿登记不会采纳Claim，不会自动生成固定report或发布PDF。

```json
{"input":{"title":"curve-fit-comparison-draft.md","content":"<根据实际读取结果写成的完整正文，含证据ID和限制>","mediaType":"text/markdown"}}
```

这是artifact_create输入，placeholder必须替换真实内容。writer先task_result_read/evidence_read/artifact_read读授权输入，不从他人措辞猜测Claim已accepted；没有claim_read工具时按任务固定交付范围与用户选择，尚未核验标候选。

报告正文写研究问题、数据/切分版本、固定合同、实际Run/源码摘要、指标单位与比较、失败/没测/没编译项、解释、停止理由和限制。科学数值来自原始证据，不从模型记忆填。图注明数据/脚本/版本及来源；Sandbox图形执行证明固定作业来源，不证明逐点科学数值，更不能冒充正式Run。

## 用户固定报告与本地导出

以下report_*均是**user-only**；Agent可交付草稿和具体来源，不能调用最终报告/导出，也不能用host_execute替代。

用户在“报告与成果”显式选择真实终态Run、已采纳且有效Claim、成功完整且来源有效的固定文稿结果，可选Campaign。report_create输入示例：

```json
{"input":{"title":"曲线拟合：同协议候选比较","runIds":["<真实终态Run ID>"],"claimIds":[],"publicationResultIds":[],"campaignIds":[]}}
```

用户操作返回报告正文Artifact，不要将artifact.id当reportId。通过report_list/工作台对应报告读取真正reportId；report_inspect输入reportId，核对integrity、validity、reasons、references、Run指标单位与固定源；report_reference_read用真实referenceId前向分页回读。report_export输入reportId生成本地tar.gz，并依据实际返回链接/路径交付。失败/取消Run可作为明确失败记录，不伪称科学支持；非终态Run、未采纳Claim、无完整PDF或失效绑定不能绕过校验。

报告是固定历史记录，包含真实Run/source/evidence/开发审查/文稿/研究方案等可回读引用；ancestry关系仅说明祖先来源，不表示当前源码通过了祖先测试。跨contract结果须写比较限制，不直接同条件排名。固定文稿来源按pi-research-paper核查；主协调者manuscript_create/publication_prepare可准备，提交构建仍用户批准入口。

## 链接、重开与产品差异

工作区报告可用真实相对链接，如 `![Patch size](figures/patch-size.svg)`，前提文件已生成且可随交付解析；不可变artifact之间没有自动目录相对解析保证，应引用真实artifact/evidence ID。固定报告使用服务生成的reference链接，不自造其URL。聊天交付给返回的真实嵌套路径/下载入口或ID及用途，本项目不保证上游 `<file path="…"/>` 富引用渲染。

重开可回读固定旧报告正文和引用，但使用结论/新导出前重新核对来源效力。stale/invalid不能隐藏；新成果写新版本，保留历史。只有已批准且成功的真实绘图/文稿构建才说图/PDF已生成；只保存.tex/.py仍是源码草稿。

已实现：实际草稿/文本产物、用户固定Markdown报告、引用回读、本地tar.gz导出及有效性检查。与上游差异：任意artifacts路径不自动登记；外部成果发布和Overleaf等外部目标未实现；不为这些缺口新增流程或借默认Shell开放。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-reports/SKILL.md`（blob `313d3ca61372e5f2e101cac6e78828393d03ad87`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
