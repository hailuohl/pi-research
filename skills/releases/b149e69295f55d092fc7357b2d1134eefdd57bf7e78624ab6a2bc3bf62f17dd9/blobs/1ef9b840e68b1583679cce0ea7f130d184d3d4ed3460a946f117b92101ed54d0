# 固定稿件的构建、检查与修订

固定稿件、准备构建、读取诊断、页图检查、独立审查或修订前读取本文。示例的 `tool` 只标明工具名称，实际 Pi 参数只用 `{input:...}` 包装；示例 ID 必须换成真实返回值，不伪造会话归属字段。

## 固定源码与资产

用户或交互主协调者可 `manuscript_create`。Agent 必须有当前已确认研究计划，`evidenceIds` 只能是计划证据的获准子集；宿主绑定 rootSessionId/researchBrief，Agent 不传这些字段。自动唤醒、writer/Task 无此入口。writer 可准备草稿，由主协调者接收并核对合法来源；不能直接把 Task 资产当自己的已获准资产。

先完成草稿与当前计划绑定，再冻结：

1. 用 `workspace_write` 保存最新稿件；`workspace_read` 实际完整回读各已写文件，取得真实 `digest` 与 `draftReadId`。UTF-8 分页须完整 SDK 送达；截断或编码损坏不算成功凭据。
2. 用 `research_brief_inspect` 回读当前计划及 `latestId`，以它作 `expectedRevisionId` 保存包含全部已写文件 `draftFiles:[{path,readId}]` 的新 ready 修订，`readId` 使用真实 `draftReadId`。计划原本为空清单时，即使已回读新增 main.tex 也仍未绑定；先核对已有有效凭据，不把 READ_REQUIRED 解释为完全没有读过。
3. 按现有模式取得确认结果：confirm 等待用户确认当前 ready 修订；合法 fullAccess 自动确认只沿既有 automatic-approvals 证明链，核对真实返回已 confirmed，不再强加人工重复批准。不能自行新增隐式确认。
4. 当前修订确认后，再以完整真实源码和资产调用 `manuscript_create`，核对返回 `sourceDigest` 与固定计划。该工具不会补写或确认计划。

每次修改已绑定草稿（包括同字节重写）都需新写入版本的完整回读及新计划绑定，不能复用旧 readId、跨会话凭据或复制 digest 制造凭据。外部修改、删除或工作区替换时，先核对当前实际文件；按实际 digest 作 expectedDigest 受管保存修复，再以新 callId 回读并更新计划、按既有模式确认。编码不一致先核对完整 UTF-8 保存与读取，不把截断或损坏内容变成成功凭据。旧计划、稿件与编译结果按原 ID 保留，历史固定计划不强制迁移到最新工作区，不自动更换 sourceDigest 或借旧稿冒充新稿。

计划绑定完成后，可用 `artifact_create` 保存同一真实 UTF-8 TeX 作为冻结资产；不能用它替代工作区回读与计划绑定。下例只适用于无需其他配套文件的主协调者稿件：

```json
{"tool":"manuscript_create","input":{"title":"Research manuscript draft","engine":"pdflatex","mainFile":"main.tex","bibliography":"none","templateId":"article-pdflatex","evidenceIds":[],"files":[{"path":"main.tex","artifactId":"actual-tex-artifact-id"}]}}
```

用户入口不传 `evidenceIds`。`files` 是完整清单，每项 `path` 配真实 `artifactId` 或规范 `contentBase64` 恰好一种来源；不能把磁盘路径当文件内容。`artifact_create` 不存二进制 PDF，图可用当前主会话获准 Run/开发作业的真实产物，或实际文件字节。主文件、cls/sty/bst/bib、图和数据按原相对路径保存，不能只固定 main.tex。模板 ID 是记录来源，不会自动补齐模板文件。

文稿 1–64 文件，总量不超过16 MiB；主 `.tex` 必须在清单内，路径与内容通过实际文稿校验。Python 脚本不属于允许的文稿扩展名；另存固定源码或文本产物并关联数据与图。来源未知如实保留 unknown，不包装成实测来源。用 `manuscript_inspect` 核对返回的 `id`、`sourceDigest`、文件清单和资产来源。

## 环境与批准构建

1. `publication_status`：`{"input":{}}`。返回真实 configured、version、固定配置和资源限制。未配置时由用户执行 `publication_configure`，必填 expectedVersion、dockerContext、imageDigest；Agent 不配置镜像、不自动安装包或字体，不用 host_execute 编稿绕过。
2. 用户或原交互主协调者 `publication_prepare`：`{"input":{"revisionId":"actual-revision-id"}}`。仅准备固定待批 job，源码、引擎、镜像和资源已冻结，此时尚未编译。
3. 用户通过审批入口批准该准确构建，再 `publication_submit`：`{"input":{"jobId":"actual-job-id"}}`。Agent 不能 configure/approve/submit/cancel。收到会话动作 `APPROVAL_REQUIRED` 时结束回合，等待原准确操作卡，批准后按原参数继续；准备构建的动作批准不代替 job 的构建批准。
4. 同主协调者或用户用 `publication_inspect`：`{"input":{"jobId":"actual-job-id"}}`；取得真实 resultId 后 `publication_result`：`{"input":{"resultId":"actual-result-id"}}`。

Codex 的终端、图像和 LaTeX 工具不是 Pi Research 工具；这些示例不授予额外执行权限。

## 状态与诊断

| 实际状态 | 应交付或继续的动作 |
|---|---|
| prepared | 等待准确构建批准与用户提交；不称已编译 |
| queued/starting/running | 保留 job ID，结束本轮等待已有作业；不忙轮询或重复启动 |
| unknown | 回查 `publication_build_list`/`publication_inspect` 原持久 job，不能把观察超时当失败 |
| failed/cancelled/timed_out，或结果 non_convergent | 交付源码与实际诊断；停止称成稿，按原因修订或由用户处理取消/重试 |
| succeeded | 继续核对完整性、结果与来源，不凭状态名或 PDF 存在就结束 |

成功要求 job `state:succeeded`、`integrity:complete`，固定结果 `status:succeeded`、`hadErrors:false`、`converged:true`，无 error 诊断，真实 PDF 和完整页预览绑定正确；同时核对 `sourceValidity:current`。读取实际 `diagnostics`、`logs` 及 PDF/previews 记录；退出码0、文件存在或模型自述都不能单独证明成功。

`PUBLICATION_PARSER_FAILED` 是容器非零退出的兼容统称，不能据此认定只有解析器故障。先读取 `publication_result.diagnostics` 的结构化错误代码、严重性、文件与行号，并核对实际 logs；没有完整结果时读取原 job 诊断。包/字体缺失、TeX 错误或编译环境故障按真实原因处理，不在作业运行时安装包、联网下载字体或改用宿主编译。

有 resultId 时从 `publication_result.logs` 的真实 artifactId 读日志；没有完整结果时核对 job.error 和已归档 artifactIds。TeX 日志第一条 `!` 常给根因及行号，先处理该处：未定义宏、缺包、引擎不符、图路径错误、未解决引用、超时或非收敛分别诊断，不拿后续连串错误替代首因。环境缺口明确交回配置，不为过编译改掉用户模板。

未构建交付“真实草稿，尚未编译”；构建失败保留真实源码、诊断和失败 job 引用。有引擎/镜像缺口明确报告，不声称有 Overleaf 按钮。`sourceValidity:stale` 时保留历史结果与 sourceError，但不可当当前有效成果纳入新报告。

## 读取固定编译页做视觉检查

交互主协调者先以 `publication_result` 取得实际成功、完整且 `sourceValidity:current` 的固定结果，再选真实预览中的 pageNumber。工具只接受自己当前会话文稿的固定结果页。以下保留 `tool` + `input` 元标记说明工具名字；实际调用 `publication_page_image_read` 时仅传 `{input:...}` 参数，不将 `tool` 字段塞入参数。

```json
{"tool":"publication_page_image_read","input":{"publicationResultId":"<实际publication-build-result.id>","pageNumber":1}}
```

所有可执行模式均需用户批准这个准确页送给当前目的模型并加入本会话；之后的模型请求及合法重开可能重复发送这页。readOnly 不执行此动作。收到 `APPROVAL_REQUIRED` 就结束回合，等原准确卡批准后按原参数重试；不能从批准编译推断批准图片外发。

默认模型具备图片识别能力；工具成功将获准真实 PNG 送达当前所选目的模型后直接阅读，实际看过才写该页的视觉观察。逐页核对裁切、图注/图例遮挡、字体、轴标签/单位、面板次序及版心，按最终打印尺寸判断可读性。能看图、编译成功都不是已视觉检查，单页意见不是看过整份 PDF；工具实际拒绝、缺信息、超限或撤权时明确未看，保留原状态，不绕过目录或权限校验。视觉意见不替代原始数据、引用和独立审查的科学核对，也不能伪造UTF-16原文Evidence或精确数值。

固定 PNG 原始字节保留，不自动缩放/重渲染；单页 <=4 MiB、两边 <=1600px，会话实际图片合计 <=16 MiB。Task/wakeup 不使用此工具。原文 PDF 页需另按 `pi-research-lit-review` 的固定文档/解析与页范围批准；PMC 非 PDF 不自动生成页图，不能把文稿页许可当原文查看入口。

每次后续模型请求都会重新核对准确批准、当前会话/目的模型、权限版本、模型目录摘要和来源/CAS。模型目录变化、撤权、来源失效、历史缺引用或字节损坏时停止新的外发，保留原始 native history，不删图或自动重新授权；需要新的会话与准确批准。已经发送的内容不能撤回，不能承诺远端回收。目录中的其他模型变化也会使旧图片批准失效。

最终记录固定 result ID、实际读到的页及未看范围；工具读取失败不能记为看过。

## 独立审查与新修订

主协调者可用 `publication_review_prepare`：`{"input":{"resultId":"actual-result-id"}}` 准备精确成功构建的独立审查。用户另行批准启动已有 reviewer；多智能体未启用时说明该缺口，不自行启用。只审本主会话文稿，审查不会授予 PDF/PMC 原文读取或重发权限；明确实际审查输入与未覆盖范围。

用 `publication_review_inspect`：`{"input":{"reviewId":"actual-review-id"}}` 核对真实 `status`、`validity`、固定意见及版本；执行完成不等于通过。awaiting_approval/pending/running 是未完成，rejected/disputed/failed 保留意见和缺口；passed 仍不能替代科学证据。旧意见不自动覆盖新稿。

内容复核还应确认：摘要、正文及图表用读者能理解的科学/实验名称，内部追溯编号留在既有绑定或独立来源记录；真实引用、必要代码/数据版本、单位、科学局限和负结果完整。来源记录须对应实际产物和可解析入口，不因隐藏内部编号而丢失证据绑定，不把尚未生成的材料称为已交付。提示词符合这些规则不等于模型输出已通过核对。

修正文/图/引用后，按上述 workspace_write → workspace_read → 当前 latestId/expectedRevisionId 保存完整 draftFiles → 既有模式确认的顺序重新绑定，再用 `manuscript_create` 创建完整新修订，增加真实 `previousRevisionId`；旧批准不覆盖新字节。再准备新待批构建，实际成功后查看新 result 对应页，旧页图不能代表新稿布局。

`manuscript_list`/`manuscript_inspect`/`manuscript_source_read` 按原 revision ID 和文件路径回查源码，`publication_build_list` 按原 revisionId 回查 job，`publication_result` 及 review 入口回查结果与意见。个人模板按旧 templateId 读取；同名新上传不改旧模板与已有固定稿。无权、来源失效或摘要不符时保留合法历史并报告具体缺口，不回退到最新文件冒充原版本。

技能与示例不授予权限。
