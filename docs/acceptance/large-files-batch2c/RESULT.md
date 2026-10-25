# 大文件第二批 C：workspace 快照与固定研究输入

状态：本批验证通过。提交、分支及远端包含性由主代理在交付消息记录。

基线：`90aab4ff63f6659350cb35bed216d588d5b30b26`。只在隔离工作树实施，主目录在途代码、研究数据和主服务保持不动。

## 实际变更

- `workspace_text_prepare` 将规范项目相对路径的 UTF-8 文件流式固定为原件与索引，默认新接收上限 512 MiB，继续使用配置策略。派生读取不授予简报写入或执行权限；只允许普通主协调身份。
- 新 snapshot 拥有独立 artifact/binding 和当前 selection，后续直接沿用返回 descriptor 的 `artifact_read` 与真实 SDK ACK。新同内容准备仍有独立身份，旧页、缓存和迟到 ACK 不能切换选择。
- `whole-text` 需要完整送达范围；`dataset-reference` 需要非空检查页及整源 SHA。空文本 whole-text 也须实际送达 EOF。brief 保存明确的 workspace-snapshot 引用，prepare/save 使用相同选择指纹。
- 准备成功后 live 文件的变化不会改写固定快照；旧 workspace live 输入、附件和游标语义保留，历史原件不会因降低新接收限额而被撤销。生成参数及有界 literature/protocol 解析预算保持独立。
- paired intent 先于永久 CAS 发布，binding、selection、域 receipt 和工具 receipt 同事务提交。空 source 仅允许在 pair 第一项且摘要必须是 SHA-256(empty)，index 仍非空；原 document import 仍要求非空，维护硬链接防线保持。

接口与使用范围见 `docs/api/fixed-workspace-inputs.md`，五条验收见本批 spec。

## 验证证据

- 修复前 RED 覆盖新操作不存在、mutable source 发布后变化、notice 身份、通用 receipt 失败、Windows 秘密路径别名、附件路径别名、回放期限和 notice 读取覆盖。
- 初始 512 MiB SDK 实测触发 120 秒准备期限。100 MiB 直接探针定位重复完整权限/路径检查占 89.03%；分开廉价预算与关键授权检查后，同探针 16.55 秒降至 1.34 秒，完整检查 8274 降至 125 次。
- 每 64 KiB 保留期限/取消检查，按真实 1 MiB 字节里程碑及 source/intent/CAS/ready/receipt 边界完整复验。共享 publisher 默认回调不减弱旧调用者。私有 stage 内部哈希仍检查预算，整个 prepared stage 在发布前完整复验。
- 最终 workspace 相关检查 22/22；指定受影响集 85/85，包括普通上传、retention、2B 索引并发复证、契约以及 workspace/旧 artifact 的真实 SDK 流程。
- 主代理实际固定 Pi SDK＋本地模拟 provider，512 MiB dataset-reference：准备 → 16000-byte 检查页 → ACK → brief 保存 → live 改变 → 原快照重开通过。总 wire 882302 bytes，峰值 RSS 237174784 bytes（约 226 MiB），V8 堆 192 MiB，总耗时 15.34 秒。测试禁止完整原件同步读取；没有声称模型已读全文。
- 小型真实 SDK 另验 confirm 跨代批准和保存后 provider 失败的正常重试，旧 brief/binding/receipt 保持不变。
- 原独立 Astra/xhigh 会话定向解除容量和目录说明两项阻断；起止 64 文件哈希匹配。探针验证旧 publisher 默认检查及 CAS 撤权、stage 取消的归属保留；之后仅由根代理澄清 spec 的私有 stage 哈希边界描述。
- 完整 `npm test`：2718 项，2693 通过、25 跳过、0 失败、0 取消，耗时 2258619 ms。
- 干净安装、构建和类型检查通过，785 个产物一致；manifest SHA-256 `1db7623c4f374c976141a186ff36a1ce6ba3f5c46eda3daadf646626b10e4bab`。

原日志与机器证据在 `D:\项目\pi research\tmp\large-file-512mib-20261025\batch2c`；不复制大原件或大份日志进仓库。实施 Astra/high、独立复核 Astra/xhigh 均已请求，接口未回显实际运行时配置。性能数字是本机一次测量。

## 后续与限制

本批只完成 project workspace 固定输入；受管草稿的真实送达、Run/归档/独立审查、文档处理/模型预算和必要功能上传继续后续批次。旧受管草稿生成/写入预算没有扩大为 512 MiB。未调用外部 provider、Docker、浏览器或重新运行科研评测，主服务未切换。
