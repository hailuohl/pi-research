# 固定附件分页与研究输入（批 2A）

本批打通：批 1 流式导入的用户原件 → 普通主协调会话附件 → 有界文本页 → 精确 SDK 送达确认 → 简报中的固定原件引用。原件默认单文件 512 MiB，由 `PI_RESEARCH_MAX_FILE_BYTES` 配置。

## 附加与能力元数据

先通过 [流式原件接口](owner-streamed-documents.md) 获取 `documentVersionId`，再沿现有消息接口发送 `attachmentDocumentIds`。仍只接受同项目、用户导入、未绑定连接器／受保护全文范围的原件；不把原件内容直接放进模型请求。

附件能力中的旧 `types` 继续描述旧 JSON/Base64 入口及原生媒体能力；`fixedTextOriginals` 单独给出流式原件的上限、媒体类型与 `document-stream` 传输方式。现有旧上传入口及界面不因原件可绑定而自动支持 512 MiB Base64 JSON。

支持的流式原件为 TXT、Markdown、CSV、TSV、JSON、JSONL 的有效 UTF-8 字节。导入和固定引用验证完整性，不表示 CSV/JSON 语法、科学内容或计算结果已经验证。原生媒体、供应商请求和既有结构化解析限制分别保留。

## 新分页协议

继续使用现有 `session_attachment_read`，明确传新协议、原件摘要与用途：

```json
{
  "input": {
    "messageId": "用户消息ID",
    "documentVersionId": "原件版本ID",
    "readProtocol": "fixed-text-v1",
    "sourceDigest": "原件SHA256",
    "purpose": "dataset-reference",
    "cursor": 0,
    "limit": 16000
  }
}
```

新协议的 `cursor/end/total` 以 UTF-8 字节计，每页正文最多 16000 bytes。返回原始字符片段、原件摘要、`attachmentReadId`、`attachmentBindingId` 和 `sourceInputPath`。使用实际 `end` 续读，不从请求的 limit 推算。BOM、CRLF、中文和 emoji 不被重写；页尾可以缩短以保留完整字符。

需要固定续读身份时，传返回的 `attachmentBindingId`，同时保持原 message/document/sourceDigest/purpose。ID 不能被用来更换消息、用途、会话或来源。未传 ID 的正常新消息或显式新用途可以建立独立绑定，同一原件不需要重新上传。旧绑定、回执和简报保持不变。

旧请求没有 `readProtocol` 时仍使用原 UTF-16/BOM 约定。不能把旧字符游标当作新字节游标；过大的原件会提示使用新协议，不回退全文 Buffer。

## 送达、选择与冻结

- 读取回执先是 pending。宿主只在成功 SDK 工具结果、准确结果摘要、调用、会话、代际和当前权限一致时记 delivered。模型或用户不能直接调用 ACK 接口。
- `complete` 只表示当前页到达 EOF。whole-text 用途必须有从头到尾无缺口的已送达覆盖，不能只读取末页。
- dataset-reference 是明确的数据集引用：要求至少一个实际送达的检查页，并在冻结／复验边界流式校验整个原件 SHA-256。它不提供模型逐字全文阅读证明。
- 当前选择与不可变历史绑定分开。只有 fresh 读取实际切换绑定才改变选择；普通续页、缓存回放和迟到 ACK 不抢占选择。
- clarifying 保存可跳过未满足覆盖的新选择，保留其待读状态及有效的继承来源；ready 对实际选中来源严格检查。
- 准备审批与实际保存采用相同 status／选择规则；选择变化或来源变得可纳入时，旧审批不能偷偷使用新的输入。
- 若保存已成功、随后 provider 失败，正常消息重试可建立新绑定；合格的同原件新选择可供新修订使用，旧简报和回执不被修改。未完成、撤回或错误 scope 的新选择不能绕过仍需保留的旧来源检查。

保存仍使用原 `research_brief_save` 及原权限／批准流程，不接受模型自报的已读列表。新 sourceInputs 带 `readProtocol`、`purpose` 和 `documentVersionId`，复用原 `artifactId`／CAS；不为冻结再次复制或全量装载原件。`sourceInputPath` 是稳定的逻辑输入别名，不授予宿主路径访问权。

只读模式仍可读取和记录送达事实，但不能据此保存简报、审批或执行。方法编译对不需解析的数据集只消费已验证描述符；既有有界文献 JSON 等解析器不会因此获得任意大文件解析能力。

## 验证与剩余范围

相关回归：`tests/unit/attachment-fixed-input.test.mjs`。实际固定 Pi SDK／HTTP／IPC 流程：`tests/integration/fixed-attachment-pi-http.test.mjs`，包含 Agent 工具保存，以及保存后 provider 503 的正常消息重试。

512 MiB 验收可对该集测设置 `PI_RESEARCH_FIXED_ATTACHMENT_BYTES=536870912` 并使用 192 MiB V8 堆运行；这是测试输入大小开关，不是另一项部署上限。测试校验实际 SDK 送达、原件复用、总 wire 大小及宿主峰值内存。实际运行结果见批次验收记录。

本批尚未迁移通用 workspace/artifact/draft 大文件读取，未接大数据 Run 挂载、输出归档或独立审查。这些按后续批次推进；本地模拟 provider 的 SDK 测试不代表外部供应商或科学结论验收。
