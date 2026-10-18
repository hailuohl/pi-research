# 固定稿件的引用完整性检查

此分支核对字面引用结构与实际提供的书目字段。它不评估论文是否支持科学主张，`scientificClaimSupport` 始终为 `not_assessed`。只要求引用检查时，不重写、补造、删除或重编号条目，不联网换版本，不自动编译、启动科学审查或建立方法合同。

## 输入与角色

使用已经存在的真实 `revisionId`；稿件仍须满足原有项目、主会话、已确认研究计划和来源权限。需要先固定已有源码时沿原 `manuscript_create` 流程保留完整文件及旧稿，不为方便检查降低这些门槛。用户或当前交互主协调者可以调用；writer/reviewer/自动唤醒不能调用，由具备权限者接收准确输入。

```json
{"input":{"revisionId":"actual-fixed-revision-id","metadataArtifactIds":["actual-primary-crossref-artifact-id"]}}
```

`metadataArtifactIds` 可省略，默认空数组，最多 32 个唯一 ID。ID 来自实际成功 `paper_read`、已有获准 evidence 或用户交接。当前没有 `paper_history` 或通用 `artifact_list` Agent 工具，不发明入口，不扫描项目全库。未提供 ID 时仍检查字面结构，报告“未提供用于比对的元数据”；不能说项目没有元数据、论文不存在或身份已经核实。

只支持成功 Crossref `paper_read` 的唯一主 metadata 产物；原始 HTTP response、普通 `artifact_create` 保存的同形 JSON、同名或相同字节都不能冒充它。宿主核对项目、来源/类型、原成功回执、正文 DOI、paper-read 主产物与完整记录/字节摘要。其他来源、全文、缺少字段或未知版本均保留缺口，不自动补检索或推断。

## 保存与读取

`publication_citation_check` 读取固定源，但会在现有 Artifact 服务保存精确报告，因此属于本地报告写入。`APPROVAL_REQUIRED` 时等待准确操作批准，再用原参数调用；不把它当纯读取绕过 readOnly 或审批。无需模型转抄 JSON，不调用额外的 `artifact_create` 复制造成第二份报告。

返回真实 `reportArtifact.artifactId/digest/bytes` 及简短状态。使用 `artifact_read` 读取报告正文；每次至多 16000 个 UTF-16 字符，只传实际 `cursor`，没有 `limit` 参数。按返回 cursor 继续，直到 `complete=true` 才能声称读完。报告绑定 revision、sourceDigest、checkerVersion、实际文件及 metadata/paper-read 记录摘要；产物摘要只证明字节完整，不是宿主认证。

同一幂等键和参数重试会重新验证源权限、记录和字节，再返回原 Artifact，不重新保存。稿件变更要用真实新 revision 和新键，旧报告不能代替新稿的检查；原稿、旧修订和旧报告均保留。

来源撤销阻止新检查及该检查操作的缓存重放。自然到期沿原授权的历史资料语义处理。已经保存的报告按普通 Artifact 的项目、角色、任务及完整性规则保留可读，不复制 source discoveryGrant 充当派生 ACL。重开历史报告不表示来源当前获准或当前稿件仍有效。

## 可检查范围与结果

- 常见字面 `cite/citep/citet`、星号、0–2 个字面可选参数；biblatex 单组 `autocite/parencite/textcite/footcite/smartcite/supercite`；`nocite` 与 `nocite{*}`。`nocite` 不接受星号或可选参数，`input/include/bibliography` 不接受这些修饰；`addbibresource/bibitem` 至多一个可选参数。已识别命令的缺失/未闭合参数、重复 Bib 分隔符及其他修饰形式不能当作完整通过。
- 固定清单内字面 `input/include`、`bibliography`、`addbibresource`；路径从固定稿件根解析，与实际编译器的 SOURCE 工作目录一致，不从每个 included 文件或 main 的父目录猜路径。
- BibTeX `article/book/inproceedings/misc` 的花括号、嵌套括号内容、引号与数字字段，以及字面 inline `bibitem` 的 key。保留重复记录及字段位置，报告未定义/重复 key、同 key 身份字段差异、DOI 对应的题名/作者/年份冲突。
- 注释、`verb`、`verbatim` 不当作真实引用。`lstlisting/minted` 等代码环境不扫描成引用，但其转义/执行语义未解释，报告 incomplete。宏、字符串拼接、继承、动态输入、条件、自定义引用命令和未检查的代码环境明确报告不支持；固定 cls/sty 不展开。复杂 TeX 不能可靠比较时保留 incomplete。

`literalStructure.status=passed` 只表示声明子集内未发现字面结构错误。`failed` 有定位错误；`incomplete` 存在不支持语法或覆盖不足。另读 `identityComparison` 的 `not_compared/matched/conflicts/incomplete`、实际 `comparedFields` 及逐条字段结果，不能只看 DOI 相同。线上/印刷等多个年份保留候选；未知作者/年份不猜，页码卷期缺失不自动判错。同 DOI 或元数据一致不证明同一 study、全文已读或科研结论成立。

字段比较只合并空白、统一大小写和 Unicode NFC；保留有意义的标点、数学符号与非拉丁文字。仅 Bib 侧解释保护花括号及少量字面转义（如 `\#`、`\&`、`\%`、`\{`）；原始 Crossref 字符串不当作 TeX 删除字符或宏。复杂 TeX 及姓名缩写仍可为 incomplete，不能通过丢掉符号得到 matched。当前检查器版本为 `literal-citations-v2`，旧报告保留其原版本与字节。

限制为全局总扫描文本 1 MiB、输入深度 16、1000 条书目、2000 次引用、每条 40 字段、200 条诊断及 1 MiB 报告。条目与引用在插入前检查上限；达到全局字节/条目/引用/字段/诊断边界即停止后续扫描或关联比较，明确 `truncated` 与覆盖不完整。未扫描到正文后面的 bibliography 不等于 key 确定缺失；未知保留未知。`filesScanned` 只列成功加载并开始扫描的文件，缺失或超字节限额而未扫描的路径留在 diagnostics。没有额外用户配置，不能把截断当无条件通过。只交付准确文件/行号、实际比较字段、支持范围与缺口；任何修稿另走用户明确授权的修订流程。
