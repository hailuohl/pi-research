# 固定文档取得、解析与阅读

执行取得、导入、解析、读取固定PDF/页图或安排用户交接前读取本文件；涉及联网或固定全文检索授权时，还须先读 [discovery-permissions.md](discovery-permissions.md)。用户入口不能由Agent冒用。示例的tool是工具名称元标记；实际Pi只传{input: ...}，占位ID替换为真实固定来源。

全文文字、页面像素与OCR派生文字分别记录。当前固定PDF解析OCR=false：textStatus=no-text-layer表示未取得可用文字，不表示页面空白或论文没有相关内容；获准且模型支持时可读整页PNG。固定页裁图、扫描件OCR尚未接入，不给出伪调用。若用户提供外部OCR结果，记录原件/页与识别来源，核对识别误差，不把它写成原始文字层或项目OCR产物。

## 用户PDF取得、解析和证据交接

项目已有以下路径，不是“全项目无PDF能力”；它们都是用户入口，Agent不能冒用。

1. **取得原件**：用户 `literature_task_create` 的retrieve（如明确alphaXiv版本）：

```json
{"tool":"literature_task_create","input":{"kind":"retrieve","target":{"source":"alphaxiv","id":"2401.01234v2","format":"original-pdf","requestedVersion":"2"}}}
```

   原ID需替换已核实来源。alphaXiv/arXiv和bioRxiv PDF要求明确版本；OpenAlex要求W-ID和用户配置API key，不接受伪指定出版版本；PubMed/Crossref没有已核实的通用PDF路径。不跟随任意publisher下载地址。`literature_task_inspect`回查持久状态；unknown先核对，不自动重复网络请求，失败/中断由用户 `literature_task_retry` 新尝试，保留旧记录。也可用户 `document_import` 明确选择PDF实际字节和许可证；或 `document_from_paper` 将已保存PaperRead转为固定文档而不重新联网。
2. **核对原件**：用户document_inspect核对documentVersionId、raw digest、source/version/license/limitations。上游 `https://arxiv.org/pdf/<id>` 是原PDF，alphaXiv `/pdf/` 是viewer页；本项目固定提供者路径代替模型手动下载。下载地址带vN仍需内容核对，不能自动称版本已验。
3. **解析**：用户document_parser_status/configure核对固定PDF镜像；document_parse_prepare绑定原件/解析器/资源，单独批准后document_parse_submit。document_parse_inspect核对成功及complete完整性；failed/unknown不冒充解析完成。原件、解析清单、日志与页图固定保存。
4. **阅读页图/文本**：用户document_pages分页取得页清单，document_page_read按parseResultId和1起始pageNumber读取文本及固定页图引用；返回引用不等于模型收到图像。UTF-16游标按实际返回end继续，complete只表示这一页文字读完。物理页号与印刷标签分开；解析质量readingOrder未验证、段落heuristic、表/图unknown且OCR=false；扫描件没有text-layer不等于空论文。imageCandidates只是embedded-raster-object候选，不自动识别科学面板/含义。
5. **保存证据**：用户document_evidence_register以documentVersionId、parseResultId、pageNumber、start/end和description建立精确页文本证据，绑定原件与解析版本。不从PDF任意字节创建普通evidence_register伪定位。
6. **交给主会话**：用户将固定PDF/PMC文档交给指定主会话前，读取 [discovery-permissions.md](discovery-permissions.md) 的固定全文授权。附件和远程来源启用不自动加入本地全文语料，也不授予页图权限。

用户在已成功完整的固定解析结果上点“带入当前会话”，选择当前主会话；附件只传固定 documentVersionId/parseResultId/摘要/页数与标题元数据，session_attachment_read 不因此返回原文或PNG。不要从 latest 或标题猜解析对。用户仍可本地查看原图；下列视觉页范围另行准确批准，不依赖或扩大文本检索授权。

## 准确视觉页范围

只有交互主协调者可申请固定原文范围；Task/wakeup不使用。先根据问题和真实页数选择最小页范围，物理页号从1开始，印刷标签另记。以下 tool 仅标明工具，Pi实际参数保留 {input:…}，ID都取已选固定附件 metadata：

```json
{"tool":"document_page_image_read","input":{"documentVersionId":"<附件固定文档版本ID>","parseResultId":"<附件固定解析结果ID>","pageNumber":1,"firstPage":1,"lastPage":1}}
```

首次请求必须显式 firstPage/lastPage（单页也填写），批准固定文档/解析、页范围、当前目的模型及此会话后续重发；APPROVAL_REQUIRED 时结束回合等准确卡。编译/解析批准、textCorpusGrant或用户上传文件都不代替这个批准。多页仅在确实需要且页数支持时扩大范围，不默认请求全文。

批准后返回真实 image 及 text 中的授权 actionId/范围；范围内后续页用授权ID复用 completed 视觉动作，不能同时再传 firstPage/lastPage：

```json
{"tool":"document_page_image_read","input":{"documentVersionId":"<同一固定文档版本ID>","parseResultId":"<同一固定解析结果ID>","pageNumber":1,"authorizationActionId":"<成功图片返回的actionId>"}}
```

新范围、新文档/解析或新会话需要新准确批准；同 callId 不能改参数。逐页报告真正看过的物理页及限制；只有模型实际收到并读取PNG像素后才有视觉观察，不用截图记忆补作者图/表。原话证据仍按UTF-16定位和原文上下文核对，图片观察不伪装机器文本证据。

沿既有固定解析PNG读取，保留轴、panel标题、图例、表头。没有任意裁剪、重渲染、OCR或下载功能；不能生成相似图代替原图。原件/解析/CAS或来源实际撤销、视觉授权失效、模型目录变化时阻新外发，raw history保留，不删图或偷偷重授权。provider关闭和获取授权过期沿本地资料既有语义阻新取得，不自动抹去已保存资料的明确范围批准；未知许可保留未知。

单页4MiB/1600px、会话实际图合计16MiB（重复也计），目录须声明image并使用受管HTTP；模型不支持、超限、无绑定、缺页/损坏都明确未看。已发内容无法撤回。旧含图会话的失效许可不会因切回权限模式自行恢复。


## 原图展示与定位

上游Markdown方式可作交接格式参考；只有宿主确实提供可见文件时才用实际路径，Pi Research不保证任意工作区PNG路径自动变成chat image：

```markdown
![Architecture overview](actual-visible-image-path "Figure 1. What to notice and its limitations. [p. 6](https://www.alphaxiv.org/pdf/VERIFIED_ID?page=6)")
```

替换成真实可见路径/版本/物理页；未知页不补6。若宿主没有图嵌入契约，用真实artifact ID与页图入口，不伪造PNG或renderer URL。图注基于原文并适配问题，保留重要限定，它是解释而非作者引号；不烘焙进图，也不在图下重复。原图版权/许可未知保留未知。

每个底层文件每次对话只嵌一次；后续用 `[Figure 1](actual-visible-image-path)` 或 `[Table 1](...)` 开同一图。用户另行提供的真实不同裁剪可新嵌，改名未改内容不算新图；论文来源链接与本地图链接分开。
