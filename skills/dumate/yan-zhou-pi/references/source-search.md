# 多源检索、原文读取与登记

原 research.py search 保留为 Crossref 单源兼容命令。新增 literature_workflow.py 将有界检索、实际读取与明确来源选择分开，不把候选自动写入论文。

```text
python scripts/literature_workflow.py --workspace 工作区 --task T1 search --id L1 --spec inputs/query.json
python scripts/literature_workflow.py --workspace 工作区 --task T1 read --id R1 --search L1 --candidate C1 --spec inputs/read.json
python scripts/literature_workflow.py --workspace 工作区 --task T1 select --id S1 --reading R1 --spec inputs/selection.json
python scripts/literature_workflow.py --workspace 工作区 --task T1 register --id D1 --file inputs/data.csv --metadata inputs/data.json
```

检索规格：

```json
{"query":"实际研究词或PubMed原生表达式","sources":["crossref","pubmed","openalex","biorxiv","alphaxiv","arxiv"],"limit":15,"strategy":"keyword","priority":"default","difficulty":5,"round":0,"cycle":1,"max_requests":12}
```

日期窗口仅实际需要时添加 published_after/published_before（真实ISO日期）。priority为default/historical/recency/popular；provider不支持的优先级保留本地排序及实际限制。embedding仅alphaXiv支持，其它源明确失败，不能偷偷当keyword。难度1–3不跟进，4–7最多1轮，8–10最多2轮；第3/4循环只允许初轮，第5拒绝。下一轮/循环必须显式 `--previous L1`、继承窗口/优先级/难度/每轮请求预算，并提供gap_reason；同轮缩写恢复只用于alphaXiv初轮keyword。每轮最多24个真实HTTP请求，不自动无限重试。

| 来源 | 实际能力与限制 |
|---|---|
| Crossref | 公开书目元数据；不承诺原文访问，abstract若有也不冒充全文 |
| PubMed | 原生ESearch表达式与EFetch原摘要，保留PMID/DOI；全文另选合法PMC |
| OpenAlex | 跨学科元数据及可得的倒排摘要；匿名失败明确记录 |
| bioRxiv | OpenAlex bioRxiv来源筛选作发现；实际bioRxiv DOI接口读取版本/摘要，明确指定版本才请求原PDF |
| alphaXiv | keyword/embedding发现；原Markdown路线只保存实际响应，不用机器overview充当作者原话 |
| arXiv | 原Atom元数据/摘要；显式精确版本请求原PDF，日期过滤的有界遗漏如实记录 |

只访问代码固定的HTTPS provider域名。若用户已选用其本人配置的OpenAlex凭据，可在spec声明 `credential_env:{"openalex":"OPENALEX_API_KEY"}`；凭据不可写进JSON、命令、日志或稿件。缺显式凭据时不私取其它环境/文件。401、限流、超时、HTML假全文、超过30MB、XML实体或坏响应分别记录；多源部分成功保留，某源失败不抹掉其它结果。

每轮保留原响应.bin、请求状态、query-spec、候选JSON/CSV、source-status和reading-plan。精确DOI/arXiv版本或provider ID去重；相同规范题名另列possible_title_duplicates待人工判断，避免把同名论文错合并。5–15个优先真实ID可少于5，不填弱项凑数；综述/比较实际深读承重3–5篇并留反例，推荐阅读只需候选列表。

read规格：`{"mode":"record"}`只取已取得元数据/摘要；alphaXiv原文用 `{"mode":"full_text"}`；arXiv/bioRxiv原PDF用 `{"mode":"pdf","version":"实际版本数字"}`；合法PMC用 `{"mode":"pmc","pmcid":"PMC实际ID"}`，必须通过OA记录且原文DOI/PMID与已选候选匹配。其它源没有已验证原PDF路径时，用已有授权工具取得合法原件、复制inputs并register。不自动绕过登录或访问权限。

paper.json保留requested/resolved identity、source SHA、内容层级、version_assurance、page_mapping、limitations。取得不等于实际读过；地址版本未证明正文版本时保持requested-address-unverified。PDF原页/文字摘录按各自入口读取，实际查看后另留观察。select规格只有 `{"selection_reason":"对应当前问题的具体理由"}`，复制实际读取得到的原件到sources新版本，并保留读记录依赖；unknown作者/年份/许可不补造。

本地register支持PDF/TXT/MD/CSV/JSON，后者只供明确的data/方法图结构，不执行JSON内容。六个来源字段仍沿README；原件摘要变化、新选择或新方法使用新ID，不改旧source/receipt。
