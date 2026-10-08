# 模型与模板：配置、审批与原生请求

本批流程：管理连接和模型 → 显式测试 → 单独选择默认或会话模型 → 选择整原件/原生联网 → 审阅并批准 → 执行一次 → 重开固定回执。

## 范围与验收

1. 页面和导航改为「模型与模板」，仅保留模型管理、GitHub 状态及文稿模板库。提供商预设与分组、独立模型库、启停、删除、拖放和键盘排序均接实际接口。
2. 模型名称、上下文和输出上限、输入能力、JSON Schema、自定义思考等级与受限参数映射、本地 SDK 推荐与逐字段覆盖可保存。保存模型不会改变默认模型。供应商 ID 规则和套餐额度未扩展。
3. 默认选择、管理配置和精准审批使用版本校验；失败保留草稿。当前默认模型须先切换或清空后才能停用/删除；删除标记阻止旧 SQL 或手工目录回退。旧会话和原有授权保留。
4. Chat 页头提供独立原生请求：整 PDF/MP4（单文件和合计 20 MiB）及支持协议的原生搜索。准备和批准不外发；每个请求至多一个供应商 HTTP 请求。已外发但未确认的结果不自动重发。旧 PNG 页授权不能批准整文件。
5. 来源摘要、目标连接、请求模型、权限与目录版本绑定；API Key 不回显、不进入 SQL、回执或普通 Pi 历史。搜索调用、引用、用量和结束原因可查；Anthropic 暂停续跑必须新审批。引用是供应商返回资料，不自动成为已采纳科学结论。

## 验证记录

- 首管理相关检查 83 项：82 通过，1 项网络错误分类失败；修复后受影响 6 项通过。新增 native/管理/界面相关检查 80/80 通过。
- 首次全量回归：1355 项，1326 通过、5 失败、24 跳过。可选 Pi 依赖、旧目录断言和导航名称已修复；保留原有断言的受影响回归 80/80 通过。
- 最终全量回归：1375 项，1351 通过、0 失败、24 跳过。最后两文件的恢复界面接线修复后，受影响的 40 项检查全部通过。跳过的是环境相关的 Docker、隔离编译器和 POSIX 模式检查，不计为通过。
- 最终干净构建的安装、编译及类型检查均退出 0，两次构建的 613 个产物一致。独立 Astra（请求 xhigh，运行时未回显）确认配置上限、备份目录保留、异步关闭、unknown 备份边界及恢复界面接线全部关闭；冻结快照的 56 个源码/测试文件哈希一致。精简机器证据见 verification.json，原日志保留在本地 `.validation/model-management-20261008/`。
- 浏览器使用合成 PDF、1 秒 MP4 和本机 HTTP fixture：验证模型独立保存/一次最小 SDK 测试、GitHub 状态、模板库、PDF+搜索、MP4、回执重开、窄屏及 Tab/Escape。截图均为合成验收数据。
- 未调用付费远端供应商；真实供应商的账号和具体模型能力尚未现场验证。模板上传和普通授权 PNG 流程复用已有回归。

## 协议依据与限制

PDF 使用 [OpenAI 文件输入](https://developers.openai.com/api/docs/guides/file-inputs) 或 [Anthropic PDF](https://platform.claude.com/docs/en/build-with-claude/pdf-support)；OpenRouter Chat 强制 native 文件处理。视频只在明确兼容模型中使用 Qwen/OpenRouter 的原生视频块，参见 [Qwen 接口](https://help.aliyun.com/en/model-studio/qwen-api-via-openai-chat-completions) 和 [OpenRouter 视频](https://openrouter.ai/docs/guides/overview/multimodal/videos)。

原生搜索采用 [OpenAI Responses](https://developers.openai.com/api/docs/guides/tools-web-search) 或 [Anthropic 基础 Web Search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)。其他配置显示实际不支持原因。原件输入没有伪造页段或时间裁剪；重新发送和续请求都沿新准确批准。凭据仍由本机私有文件和系统账户保护，不宣称加密存储。
