# 系统固定报告、引用回查与本地导出

用户需要创建固定报告、读取其历史引用或导出成果包时读取本参考。以下 report_* 均为 **user-only**，示例只说明用户操作的真实输入；Agent 不能调用，也不能借 host_execute 绕过。示例的 tool 标明工具名，Pi 调用参数为 `{input: ...}`；写操作的请求键由宿主协议管理，不放入 input。

固定报告根据所选来源确定性地生成 Markdown，保存生成时的指标、结论、限制与绑定，不重新调用模型写分析。Agent 用 artifact_create 保存的完整分析正文是另一份文本产物；report_create 没有接收正文或正文 artifactId 的参数，不能声称正文已加入固定报告或导出包。

## 选择来源并创建

用户在“报告与成果”显式选择当前项目的真实来源：

- Run 必须为 succeeded、failed 或 cancelled 的终态，来源、固定源码和记录须通过校验；失败/取消可保留为失败记录，不伪称科学支持。
- Claim 必须已 accepted 且仍有效，采纳、证据与所需审查不能凭模型总结猜测。
- 文稿必须是 succeeded、integrity=complete、exitCode=0 的固定构建结果，具有完整 PDF 且来源有效；固定文稿准备与构建权限按 pi-research-paper。
- 可选 Campaign 必须已有固定研究方案；其实际运行、对照及文稿/Claim 关联运行会一并核验。研究方案的 requires_review 不是科学成功。

report_create 示例：

```json
{"tool":"report_create","input":{"title":"同协议候选比较：固定来源记录","runIds":["<真实终态Run ID>"],"claimIds":[],"publicationResultIds":[],"campaignIds":[]}}
```

标题最长 200 字符；runIds/claimIds 各最多 100 项，publicationResultIds 最多 20 项，campaignIds 最多 5 项。字段可省略，服务按空列表/默认标题处理，但最终必须有真实 Run、已采纳 Claim 或完整文稿结果。所有 ID 来自实际返回。

不同 contractDigest 的运行不能合并为同一固定报告，服务返回 INCOMPARABLE_CONTRACTS；Agent 分析正文可解释这些结果的比较限制，不能用文案绕过此校验。非终态、失效来源或不完整文稿也应保留具体失败原因，不换来源冒充原请求成功。

## 找到报告并核对状态

report_create 返回的是报告正文 Artifact，其 **id 是 artifactId，不是 reportId**。用工作台报告记录或 report_list 的 items 找到匹配 artifactId 的真实报告 id：

```json
{"tool":"report_list","input":{"cursor":0,"limit":20}}
```

这是 report_list 输入。cursor 是列表游标，下一页用返回的 cursor，hasMore 为 false 时停止；limit 为 1–100，默认 20。列表摘要不表示来源仍有效。

report_inspect 输入：

```json
{"tool":"report_inspect","input":{"reportId":"<真实报告 ID>"}}
```

核对返回的 artifactId、formatVersion、integrity、validity、reasons、references、runs 及适用的文稿/研究方案记录：

| 字段 | 含义 |
|---|---|
| integrity=verified / invalid | 固定正文、绑定与文件校验情况；不是科学判断 |
| validity=current / stale | 当前来源效力；前提、采纳、审查或研究状态改变可使旧报告 stale |
| validity=legacy、formatVersion=0 | 旧报告缺生成时绑定，不能当成已验证当前来源 |
| reasons | 具体失效或兼容原因，交付中不能隐藏 |

Run 的 state、integrity 和 judgment 分别说明执行、完整性及科研判断，succeeded 不等于 supported。references 的 relation=ancestry 仅说明祖先来源，不表示当前源码通过了祖先测试或审查。

## 按原绑定回读引用

用 report_inspect 返回的真实 referenceId 调 report_reference_read，不从 URL 或别的报告猜 ID：

```json
{"tool":"report_reference_read","input":{"reportId":"<真实报告 ID>","referenceId":"<该报告的真实引用 ID>","cursor":0,"limit":16000}}
```

cursor/limit 按 **UTF-16 字符位置**读取，limit 为 1–64000，默认 16000；下一页 cursor 用上一页返回的 **end**，直到 complete。这与 run_logs 的字节游标不同，也不使用日志 identity。引用回读固定对象、真实产物或运行时源码；二进制 PDF/图片不能作为文本预览。

旧报告保留原正文和原绑定，来源效力变化不会重写历史；stale 不等于原正文被删除，但回读仍需正文、绑定与目标文件校验通过。不可用引用明确失败，不静默切到新源码或新证据。legacy 报告可保留正文阅读，但没有可验证的生成时引用绑定，不能补造旧绑定。

## 本地导出与交付

report_export 输入：

```json
{"tool":"report_export","input":{"reportId":"<已核对的真实报告 ID>"}}
```

导出要求 formatVersion=1、integrity=verified、validity=current，并在打包期间再次核对来源。stale/invalid 或 legacy 会阻止新导出；需要新来源时由用户另建新报告，旧报告保留。敏感内容、宿主路径、缺少 tar 或打包失败按实际错误交付，不能宣称已导出。

成功返回真实 application/gzip Artifact，其 id/digest 对应本地 tar.gz；交付工作台提供的实际下载入口或 ID 与用途，不自造 URL。包内含 report.md、manifest.json，以及所选来源关联的固定源码、归档证据、文稿和审查记录；不收集任意可变工作区，也不自动纳入 Agent 分析正文。导出不会重新运行实验、编译或发布到外部。

重开后先按原 reportId 回查，使用结论或新导出前重新核对效力。交付分别说明 Agent 分析正文、系统固定报告和本地成果包的实际状态；保存 Artifact、生成 report 记录与成功导出是不同完成条件。
