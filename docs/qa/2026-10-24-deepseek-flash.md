# DeepSeek V4.1 Flash 本地配置

2026-10-24，在既有工作台 `http://127.0.0.1:4794/` 通过模型管理接口新增供应商与模型。仅更改本机私密运行配置，未改产品代码、依赖、前端或原有模型；新模型可在会话模型菜单选择，当前默认模型保持原值。

## 配置

- 供应商：`deepseek`；名称：DeepSeek。
- API：`openai-completions`；地址：`https://api.deepseek.com`。
- 模型：`deepseek-flash`；名称：DeepSeek V4.1 Flash。
- 固定 Pi SDK `0.87.1` 已有该模型，沿用 SDK 匹配的 1,000,000 上下文、384,000 最大输出及文本/图像声明。
- 仅覆盖思考映射：`off` 发送 `thinking.type=disabled`；`low/high/max` 发送 `thinking.type=enabled` 与同名 `reasoning_effort`。模型自身默认档位为 `high`，不改变全局默认或已有会话。
- Key 仅保存在当前数据目录的 `model-connections.json`；文件受 Git 忽略。此记录及机器证据不含 key、原生对话或研究资料。运行配置不随 Git 推送，其他机器须在模型管理中另行填写自己的 key。

官方主页确认 `deepseek-flash` 对应 DeepSeek-V4.1-Flash-1017；思考工具请求须回传历史 `reasoning_content`。依据：[首次调用](https://api-docs.deepseek.com/zh-cn/)、[思考模式](https://api-docs.deepseek.com/zh-cn/guides/thinking_mode/)。

## 验收及证据

机器证据见同目录 `2026-10-24-deepseek-flash.evidence.json`。

1. 管理接口、磁盘回读与 bootstrap 均包含新模型的四个档位；原有供应商私密记录逐项比较一致，当前默认未变。
2. 工作台内置最小模型探测：一次真实请求，HTTP 200，`passed/success`。
3. 同一已保存连接通过固定 Pi SDK 在 `high` 下完成三次真实流式请求：先普通回答，再调用固定加法工具，最后读取工具结果回答 19。三次均 HTTP 200；后两次线上请求保留全部 assistant 思考历史，包括首轮未调用工具的消息。
4. 不支持的 `xhigh` 档位在参数层拒绝；过期配置版本返回 HTTP 409 / `VERSION_CONFLICT`，拒绝后配置文件字节不变；key 未出现在已跟踪文件中，私密配置受忽略。
5. 相关既有检查 `node --test --test-concurrency=1 tests/unit/model-connections.test.mjs tests/unit/model-management.test.mjs tests/integration/model-management-runtime.test.mjs`：13/13 通过，无跳过。

本批为本地配置操作，未运行全量回归或干净重建；未重启现有服务，未执行浏览器交互、图像、长上下文、low/max 真实调用或完整科研流程。相关测试包含通用重开契约；本批配置持久化以磁盘和接口回读验证，未宣称服务重启实测。

本批基线为 `e9fe86c09cc01fa8f410a90b96fbd7e565747265`，工作区有既有在途改动。本批只提交本记录及精简机器证据。资料核实子任务请求 `gpt-6.1-sol / medium`；独立复核请求 `gpt-6.1-sol / high`；接口未回显实际模型/档位，均记录为已请求、运行时未回显。

独立 Sol 只读复核结论：无阻断或非阻断问题。已独立核对 HEAD、10 个锚定文件哈希及其无漂移状态、当前公开管理视图/选项、原供应商和默认版本、SDK 参数及历史路径。私密配置、真实请求及相关测试依据现有脱敏证据，未重复执行；复核后仅补录本结论与机器证据中的 review 元数据。
