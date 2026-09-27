# 可选本地原文证据合同

## 所有权与来源
用户显式选择已存储的 origin=user UTF-8文本/Markdown。模型产物、运行输出、PDF/Office/ZIP和二进制不接收。user_imported_text只说明由用户提供，不认证它是论文、真实数据或无误原文。
项目级启用不扩大助手权限：助手只能搜索任务已授予的文件，禁止跨项目和未授予文件。复用现有系统的文件级授权（一个获准引用可赋予原文件读取权），本版没有另行实现段落级保密隔离。

## API
`GET /api/projects/:id/text-evidence`：状态、配置version、corpusId和可见来源。
`POST /api/projects/:id/text-evidence`：用户提交 `{enabled:true,artifactIds:[...],expectedVersion:0}`；后续修改需要最新version。关闭传enabled:false，不删除历史原文或引用。
`POST /api/text-evidence-search`：`{projectId,artifactIds,query,limit:5,mmrLambda:1,deduplicateExact:true}`。
所有写HTTP请求与原系统相同，需要本机Bearer令牌、JSON与Idempotency-Key。
Pi工具 `text_evidence_search` 不接受任意路径或URL，只接受已批准artifactIds；没有开启开关/添加来源/运行计算的工具。`project_inspect.textCorpus`只列出调用者获准的来源。自动唤醒工具允许列表没有增加此工具。

## 可复现处理
parserVersion=literal-paragraph-utf16-v1，method=local-tfidf-exact-dedup-mmr-v1。
使用原文件UTF-8解码（保留BOM在原位置空间内），段落分块，每块最多1200个UTF-16码元；英文词项、汉字单/双字项用于TF-IDF评分，原文不被规范化改写。精确相同quote分组，所有其他获准source locator保留。
分数是本地词项余弦，不是回答置信度、科学正确性或独立来源数量。mmrLambda=1禁用MMR；0.65为可选试验。候选最多200，返回最多10。超出返回数量/候选数时明确披露，不声称遍历的片段全都被呈现。

## 证据
每个hit提供原文quote、artifactId、原文件digest、UTF-16 [start,end)、lineStart/lineEnd、page=null和现有Evidence ID。quote必须从原文件原区间读回一致。重复查询复用稳定片段引用。search record是派生检索记录，不是Claim；没有自动接受结论。
集合变更/禁用在新检索前和Pi缓存重放前检查。已生成原文引用作为历史可读；关闭检索本身不声称原文事实变假。移除文件的检索授权不等同于删除项目全部历史。

## 上限
最多30份、每份1MiB、总计8MiB、2000块。超过限制拒绝整个请求，不偷偷截断文件。只在SQLite本地完成，没有外部模型、嵌入或平台调用，无额外npm/Python运行依赖。
这是有界小型集合处理，不是大型索引服务；每次查询重新核对来源并构造块。性能、语义检索与费用收益必须用实际任务另测。
